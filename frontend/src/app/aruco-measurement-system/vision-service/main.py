"""
Nestup ArUco Wall Measurement System - Vision Service
Production-grade prototype for measuring wall dimensions from a single image
using a 90×90mm ArUco marker for scale calibration.

Pipeline stages:
1. Image Input & Validation
2. ArUco Detection with sub-pixel refinement
3. Scale Calibration (mm_per_pixel)
4. Perspective Correction (Homography)
5. Wall Boundary Detection
6. Dimension Calculation
7. Confidence Scoring
"""

import io
import math
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Tuple, Dict, Any
from dataclasses import dataclass, asdict
from enum import Enum

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from PIL import Image, ImageOps

# Directory containing this file; static assets (e.g. index.html) live in ./static
STATIC_DIR = Path(__file__).resolve().parent / "static"

# EXIF tag numbers
EXIF_FOCAL_LENGTH = 37386  # FocalLength (rational, mm)
EXIF_FOCAL_35MM = 41989    # FocalLengthIn35mmFilm
EXIF_IMAGE_WIDTH = 40962   # ExifImageWidth
EXIF_IMAGE_HEIGHT = 40963  # ExifImageHeight


def _parse_exif_rational(num: int, den: int) -> Optional[float]:
    """Convert EXIF rational to float."""
    if den == 0:
        return None
    return float(num) / float(den)


def _extract_exif(contents: bytes) -> Dict[str, Any]:
    """
    Extract EXIF from image bytes. Returns dict with focal_length_mm, focal_length_35mm_equiv,
    image_width_px, image_height_px, and raw exif dict for debug. Not shown to customer.
    """
    out: Dict[str, Any] = {}
    try:
        img = Image.open(io.BytesIO(contents))
        exif = img.getexif() if hasattr(img, "getexif") else None
        if exif is None:
            return out
        # Focal length (actual, mm)
        fl = exif.get(EXIF_FOCAL_LENGTH)
        if fl is not None:
            if isinstance(fl, tuple) and len(fl) >= 2:
                out["focal_length_mm"] = _parse_exif_rational(fl[0], fl[1])
            elif isinstance(fl, (int, float)):
                out["focal_length_mm"] = float(fl)
        # 35mm equivalent
        fl35 = exif.get(EXIF_FOCAL_35MM)
        if fl35 is not None and isinstance(fl35, (int, float)):
            out["focal_length_35mm_equiv"] = int(fl35)
        # Image dimensions from EXIF or from image size
        w = exif.get(EXIF_IMAGE_WIDTH) or img.width
        h = exif.get(EXIF_IMAGE_HEIGHT) or img.height
        if w is not None and h is not None:
            out["image_width_px"] = int(w)
            out["image_height_px"] = int(h)
        else:
            out["image_width_px"] = img.width
            out["image_height_px"] = img.height
    except Exception:
        pass
    return out


def _apply_exif_orientation(cv_image: np.ndarray, contents: bytes) -> np.ndarray:
    """
    Apply EXIF orientation so the image is upright. OpenCV imdecode does not apply
    orientation; rotated photos (e.g. phone) can cause marker detection to fail.
    """
    try:
        pil_img = Image.open(io.BytesIO(contents))
        pil_img = ImageOps.exif_transpose(pil_img)
        if pil_img.mode == "RGBA":
            pil_img = pil_img.convert("RGB")
        arr = np.array(pil_img)
        return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    except Exception:
        return cv_image


def _compute_intrinsics_mm_per_px(
    exif: Dict[str, Any],
    distance_mm: Optional[float],
    image_width_px: int,
    image_height_px: int
) -> Optional[float]:
    """
    Compute mm per pixel at wall from EXIF + distance.
    mm_per_px_at_wall = (sensor_width_mm / image_width_px) * (distance_mm / focal_mm).
    With 35mm equiv: sensor_width_mm ≈ 36 * (focal_actual / focal_35). So
    intrinsics_mm_per_px = 36 * distance_mm / (focal_35 * image_width_px) when we have focal_35.
    """
    if distance_mm is None or distance_mm <= 0:
        return None
    focal_35 = exif.get("focal_length_35mm_equiv")
    focal_mm = exif.get("focal_length_mm")
    w = exif.get("image_width_px") or image_width_px
    if w is None or w <= 0:
        return None
    if focal_35 and focal_35 > 0:
        # sensor_width_mm ≈ 36mm full frame; scale by crop: 36 * (1/crop) = 36 * focal_actual/focal_35.
        # We don't have focal_actual here; use 36/focal_35 as proxy for sensor_width/43.27, so sensor_width ≈ 36 * (focal_actual/focal_35). 
        # Simplified: use 36 * distance_mm / (focal_35 * w) as scale (assumes focal_actual ~ focal_35 for typical phone).
        return (36.0 * float(distance_mm)) / (float(focal_35) * float(w))
    if focal_mm and focal_mm > 0:
        # Assume typical phone sensor width ~ 6mm (1/2.3") or use 36*(6/43.27) for unknown.
        sensor_width_mm = 6.0  # fallback for unknown sensor
        return (sensor_width_mm / float(w)) * (float(distance_mm) / float(focal_mm))
    return None


def _to_json_serializable(obj: Any) -> Any:
    """Recursively convert numpy types to native Python for JSON serialization."""
    if isinstance(obj, dict):
        return {k: _to_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_json_serializable(x) for x in obj]
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (np.floating, np.integer)):
        return float(obj) if isinstance(obj, np.floating) else int(obj)
    # Catch any numpy scalar (e.g. np.float32) that might not match above
    if hasattr(obj, "item") and callable(getattr(obj, "item")):
        try:
            return obj.item()
        except (ValueError, AttributeError):
            pass
    return obj


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION & CONSTANTS
# ============================================================================

class Config:
    """System configuration - DO NOT VIOLATE these constraints"""
    MARKER_PHYSICAL_SIZE_MM: float = 90.0
    MARKER_DICTIONARY: int = cv2.aruco.DICT_4X4_50
    MIN_MARKER_SIZE_RATIO: float = 0.02  # Marker must be at least 2% of image width
    MAX_PERSPECTIVE_ANGLE_DEG: float = 65.0  # Slightly increased for tolerance
    MIN_IMAGE_WIDTH: int = 640
    MIN_IMAGE_HEIGHT: int = 480
    MAX_IMAGE_SIZE_MB: int = 50
    SUPPORTED_FORMATS: set = {"JPEG", "PNG", "JPG", "WEBP"}
    
    # Accuracy thresholds
    BLUR_THRESHOLD: float = 100.0  # Laplacian variance threshold
    MIN_CONFIDENCE_THRESHOLD: float = 0.3
    
    # Wall detection parameters
    CANNY_LOW: int = 50
    CANNY_HIGH: int = 150
    HOUGH_THRESHOLD: int = 100
    HOUGH_MIN_LINE_LENGTH: int = 100
    HOUGH_MAX_LINE_GAP: int = 10
    
    # Wall dimension constraints (user-defined)
    MIN_WALL_WIDTH_MM: float = 1000.0   # Minimum wall width in mm
    MIN_WALL_HEIGHT_MM: float = 1000.0  # Minimum wall height in mm
    MAX_WALL_WIDTH_MM: float = 15000.0  # Maximum wall width in mm (15m)
    MAX_WALL_HEIGHT_MM: float = 6000.0  # Maximum wall height in mm (6m)
    STANDARD_CEILING_HEIGHT_MM: float = 2700.0  # Standard ceiling height (9ft)


# ============================================================================
# DATA MODELS
# ============================================================================

class MeasurementStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"


@dataclass
class ArUcoDetectionResult:
    """Result of ArUco marker detection"""
    detected: bool
    aruco_id: Optional[int] = None
    corners_px: Optional[List[List[float]]] = None
    center_px: Optional[List[float]] = None
    pixel_width: Optional[float] = None
    pixel_height: Optional[float] = None
    detection_confidence: float = 0.0
    error_message: Optional[str] = None


@dataclass
class ScaleCalibrationResult:
    """Result of scale calibration"""
    mm_per_pixel: float
    is_valid: bool
    marker_distortion_ratio: float  # Ratio of width to height (should be ~1.0)
    error_message: Optional[str] = None


@dataclass
class PerspectiveCorrectionResult:
    """Result of perspective correction"""
    corrected: bool
    homography_matrix: Optional[List[List[float]]] = None
    corrected_mm_per_pixel: Optional[float] = None
    perspective_angle_deg: Optional[float] = None
    error_message: Optional[str] = None


@dataclass
class DetectionDetails:
    """Details about what was detected vs inferred"""
    ceiling_line_detected: bool = False
    floor_line_detected: bool = False
    floor_line_estimated: bool = False
    left_edge_detected: bool = False
    right_edge_detected: bool = False
    left_edge_detected_percent: float = 0.0
    right_edge_detected_percent: float = 0.0
    total_lines_detected: int = 0
    horizontal_lines_count: int = 0
    vertical_lines_count: int = 0


@dataclass
class UncertaintyResult:
    """Uncertainty estimation for measurements"""
    width_uncertainty_mm: int = 50
    height_uncertainty_mm: int = 50
    width_confidence: str = "low"  # high, medium, low, very_low
    height_confidence: str = "low"
    overall_confidence: str = "low"
    guidance: Optional[str] = None


@dataclass
class WallBoundaryResult:
    """Result of wall boundary detection"""
    detected: bool
    corners_px: Optional[List[List[float]]] = None
    width_px: Optional[float] = None
    height_px: Optional[float] = None
    geometry_valid: bool = False
    edge_strength: float = 0.0
    error_message: Optional[str] = None
    # New fields for uncertainty
    detection_details: Optional[DetectionDetails] = None
    uncertainty: Optional[UncertaintyResult] = None


@dataclass
class MeasurementResult:
    """Final measurement result"""
    status: str
    wall_width_mm: Optional[int] = None
    wall_height_mm: Optional[int] = None
    aruco_id: Optional[int] = None
    mm_per_pixel: Optional[float] = None
    confidence_score: float = 0.0
    geometry_valid: bool = False
    error_message: Optional[str] = None
    
    # Uncertainty fields (new)
    wall_width_uncertainty_mm: Optional[int] = None
    wall_height_uncertainty_mm: Optional[int] = None
    wall_width_confidence: Optional[str] = None  # high, medium, low, very_low
    wall_height_confidence: Optional[str] = None
    guidance: Optional[str] = None
    
    # Extended data for debugging/review
    calibration: Optional[Dict] = None
    wall_detection: Optional[Dict] = None
    processing_time_ms: Optional[int] = None


class MeasurementRequest(BaseModel):
    """Request parameters for wall measurement"""
    aruco_size_mm: float = Field(default=90.0, description="Physical size of ArUco marker in mm")
    aruco_dict: str = Field(default="DICT_4X4_50", description="ArUco dictionary to use")
    laser_width_mm: Optional[float] = Field(default=None, description="Laser-verified wall width")
    laser_height_mm: Optional[float] = Field(default=None, description="Laser-verified wall height")


class MeasurementResponse(BaseModel):
    """API response for wall measurement"""
    status: str
    wall_width_mm: Optional[int] = None
    wall_height_mm: Optional[int] = None
    aruco_id: Optional[int] = None
    mm_per_pixel: Optional[float] = None
    confidence_score: float
    geometry_valid: bool
    error_message: Optional[str] = None
    
    # Uncertainty fields (new)
    wall_width_uncertainty_mm: Optional[int] = None
    wall_height_uncertainty_mm: Optional[int] = None
    wall_width_confidence: Optional[str] = None  # high, medium, low, very_low
    wall_height_confidence: Optional[str] = None
    guidance: Optional[str] = None
    
    # Extended calibration data
    calibration: Optional[Dict] = None
    wall: Optional[Dict] = None
    processing_time_ms: Optional[int] = None


# ============================================================================
# VISION PROCESSING PIPELINE
# ============================================================================

class ArUcoDetector:
    """Stage 2: ArUco marker detection with sub-pixel refinement"""
    
    def __init__(self, dictionary_type: int = Config.MARKER_DICTIONARY):
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(dictionary_type)
        self.aruco_params = cv2.aruco.DetectorParameters()
        # Enable sub-pixel corner refinement
        self.aruco_params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
        self.aruco_params.cornerRefinementWinSize = 5
        self.aruco_params.cornerRefinementMaxIterations = 30
        self.aruco_params.cornerRefinementMinAccuracy = 0.01
        self.detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
    
    def detect(self, image: np.ndarray) -> ArUcoDetectionResult:
        """Detect ArUco marker in image with sub-pixel refinement"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Detect markers
        corners, ids, rejected = self.detector.detectMarkers(gray)
        
        if ids is None or len(ids) == 0:
            return ArUcoDetectionResult(
                detected=False,
                error_message="No ArUco marker detected in image"
            )
        
        # If multiple markers, select the largest one
        if len(ids) > 1:
            areas = []
            for corner in corners:
                pts = corner[0]
                area = cv2.contourArea(pts)
                areas.append(area)
            best_idx = np.argmax(areas)
            corners = [corners[best_idx]]
            ids = [ids[best_idx]]
            logger.info(f"Multiple markers detected, selecting largest (ID: {ids[0][0]})")
        
        marker_corners = corners[0][0]  # Shape: (4, 2)
        marker_id = int(ids[0][0])
        
        # Apply additional sub-pixel refinement using cornerSubPix
        gray_float = gray.astype(np.float32)
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.001)
        refined_corners = cv2.cornerSubPix(
            gray, 
            marker_corners.astype(np.float32),
            winSize=(5, 5),
            zeroZone=(-1, -1),
            criteria=criteria
        )
        
        # Validate marker size relative to image
        image_width = image.shape[1]
        marker_width_px = self._compute_side_length(refined_corners, 0, 1)
        
        if marker_width_px / image_width < Config.MIN_MARKER_SIZE_RATIO:
            return ArUcoDetectionResult(
                detected=False,
                error_message=f"Marker too small (<{Config.MIN_MARKER_SIZE_RATIO*100}% of image width). Move closer or use higher resolution."
            )
        
        # Calculate marker dimensions
        marker_height_px = self._compute_side_length(refined_corners, 1, 2)
        center = np.mean(refined_corners, axis=0)
        
        # Calculate detection confidence based on corner clarity and squareness
        squareness = min(marker_width_px, marker_height_px) / max(marker_width_px, marker_height_px)
        corner_clarity = self._compute_corner_clarity(gray, refined_corners)
        confidence = squareness * 0.5 + corner_clarity * 0.5
        
        return ArUcoDetectionResult(
            detected=True,
            aruco_id=marker_id,
            corners_px=refined_corners.tolist(),
            center_px=center.tolist(),
            pixel_width=float(marker_width_px),
            pixel_height=float(marker_height_px),
            detection_confidence=float(confidence)
        )
    
    def _compute_side_length(self, corners: np.ndarray, idx1: int, idx2: int) -> float:
        """Compute Euclidean distance between two corner points"""
        return float(np.linalg.norm(corners[idx1] - corners[idx2]))
    
    def _compute_corner_clarity(self, gray: np.ndarray, corners: np.ndarray) -> float:
        """Estimate corner clarity based on local gradient magnitude"""
        clarity_scores = []
        for corner in corners:
            x, y = int(corner[0]), int(corner[1])
            # Extract small patch around corner
            patch_size = 11
            x1 = max(0, x - patch_size // 2)
            y1 = max(0, y - patch_size // 2)
            x2 = min(gray.shape[1], x + patch_size // 2 + 1)
            y2 = min(gray.shape[0], y + patch_size // 2 + 1)
            patch = gray[y1:y2, x1:x2]
            if patch.size > 0:
                # Higher gradient variance indicates clearer corners
                sobelx = cv2.Sobel(patch, cv2.CV_64F, 1, 0, ksize=3)
                sobely = cv2.Sobel(patch, cv2.CV_64F, 0, 1, ksize=3)
                gradient_mag = np.sqrt(sobelx**2 + sobely**2)
                clarity_scores.append(min(1.0, np.mean(gradient_mag) / 100))
        return float(np.mean(clarity_scores)) if clarity_scores else 0.5


class ScaleCalibrator:
    """Stage 3: Scale calibration using detected marker"""
    
    def __init__(self, marker_size_mm: float = Config.MARKER_PHYSICAL_SIZE_MM):
        self.marker_size_mm = marker_size_mm
    
    def calibrate(self, detection: ArUcoDetectionResult) -> ScaleCalibrationResult:
        """Compute mm-per-pixel scale factor from detected marker"""
        if not detection.detected:
            return ScaleCalibrationResult(
                mm_per_pixel=0.0,
                is_valid=False,
                marker_distortion_ratio=0.0,
                error_message="Cannot calibrate: no marker detected"
            )
        
        # Use average of width and height for more robust scale
        avg_pixel_size = (detection.pixel_width + detection.pixel_height) / 2
        mm_per_pixel = self.marker_size_mm / avg_pixel_size
        
        # Check marker distortion (should be close to 1.0 for frontal view)
        distortion_ratio = detection.pixel_width / detection.pixel_height if detection.pixel_height > 0 else 0
        
        # Validate scale is realistic (typical range for phone photos)
        if mm_per_pixel < 0.1 or mm_per_pixel > 10.0:
            return ScaleCalibrationResult(
                mm_per_pixel=mm_per_pixel,
                is_valid=False,
                marker_distortion_ratio=distortion_ratio,
                error_message=f"Unrealistic scale factor: {mm_per_pixel:.4f} mm/px"
            )
        
        # Warn if significant distortion
        is_valid = 0.7 < distortion_ratio < 1.43  # ~30% tolerance
        error_msg = None
        if not is_valid:
            error_msg = f"High marker distortion detected (ratio: {distortion_ratio:.2f}). Consider retaking photo more frontal."
        
        return ScaleCalibrationResult(
            mm_per_pixel=float(mm_per_pixel),
            is_valid=is_valid or True,  # Still allow processing with warning
            marker_distortion_ratio=float(distortion_ratio),
            error_message=error_msg
        )


class PerspectiveCorrector:
    """Stage 4: Perspective correction using homography"""
    
    def __init__(self, marker_size_mm: float = Config.MARKER_PHYSICAL_SIZE_MM):
        self.marker_size_mm = marker_size_mm
    
    def correct(self, image: np.ndarray, detection: ArUcoDetectionResult) -> Tuple[np.ndarray, PerspectiveCorrectionResult]:
        """Apply perspective correction based on detected marker"""
        if not detection.detected:
            return image, PerspectiveCorrectionResult(
                corrected=False,
                error_message="Cannot correct perspective: no marker detected"
            )
        
        # Source points: detected marker corners
        src_pts = np.array(detection.corners_px, dtype=np.float32)
        
        # Destination points: ideal square marker
        # We'll use a reasonable pixel size for the corrected marker
        corrected_marker_size_px = 200  # Reasonable size for corrected image
        
        # Calculate center of detected marker
        center_x = np.mean(src_pts[:, 0])
        center_y = np.mean(src_pts[:, 1])
        
        # Destination: perfect square centered at marker location
        half_size = corrected_marker_size_px / 2
        dst_pts = np.array([
            [center_x - half_size, center_y - half_size],  # Top-left
            [center_x + half_size, center_y - half_size],  # Top-right
            [center_x + half_size, center_y + half_size],  # Bottom-right
            [center_x - half_size, center_y + half_size],  # Bottom-left
        ], dtype=np.float32)
        
        # Compute homography matrix with RANSAC
        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
        
        if H is None:
            return image, PerspectiveCorrectionResult(
                corrected=False,
                error_message="Failed to compute homography matrix"
            )
        
        # Estimate perspective angle from homography
        perspective_angle = self._estimate_perspective_angle(H)
        
        if perspective_angle >= Config.MAX_PERSPECTIVE_ANGLE_DEG:
            return image, PerspectiveCorrectionResult(
                corrected=False,
                perspective_angle_deg=float(perspective_angle),
                error_message=f"Perspective angle too extreme ({perspective_angle:.1f}° > {Config.MAX_PERSPECTIVE_ANGLE_DEG}°). Please retake photo more frontal."
            )
        
        # Apply perspective warp
        h, w = image.shape[:2]
        corrected_image = cv2.warpPerspective(image, H, (w, h), flags=cv2.INTER_LINEAR)
        
        # Recalculate scale on corrected image
        corrected_mm_per_pixel = self.marker_size_mm / corrected_marker_size_px
        
        return corrected_image, PerspectiveCorrectionResult(
            corrected=True,
            homography_matrix=H.tolist(),
            corrected_mm_per_pixel=float(corrected_mm_per_pixel),
            perspective_angle_deg=float(perspective_angle)
        )
    
    def _estimate_perspective_angle(self, H: np.ndarray) -> float:
        """Estimate the perspective viewing angle from homography matrix"""
        # Decompose homography to estimate rotation
        # This is a simplified estimation
        try:
            # Use SVD to extract rotation component
            U, S, Vt = np.linalg.svd(H[:2, :2])
            rotation = U @ Vt
            angle_rad = np.arccos(np.clip((np.trace(rotation) - 1) / 2, -1, 1))
            angle_deg = np.degrees(angle_rad)
            
            # Also consider scale distortion as indicator of perspective
            scale_ratio = S[0] / S[1] if S[1] > 0 else 1
            scale_angle = np.degrees(np.arccos(np.clip(1 / scale_ratio, -1, 1))) if scale_ratio > 1 else 0
            
            return max(angle_deg, scale_angle)
        except:
            return 0.0


class UncertaintyEstimator:
    """Estimates measurement uncertainty based on detection quality"""
    
    # Standard ceiling heights in mm for estimation
    STANDARD_CEILING_HEIGHTS_MM = [2400, 2700, 3000]  # 8ft, 9ft, 10ft
    DEFAULT_CEILING_HEIGHT_MM = 2700  # 9ft default
    
    def estimate(self, detection_details: DetectionDetails, 
                 perspective_angle: float,
                 marker_confidence: float,
                 image_quality_score: float) -> UncertaintyResult:
        """Calculate uncertainty based on what was detected vs inferred"""
        
        # Base uncertainty (best case: all edges detected clearly)
        width_uncertainty = 20
        height_uncertainty = 20
        
        # Add uncertainty for missing/inferred components
        
        # Ceiling line is most reliable - if missing, add uncertainty
        if not detection_details.ceiling_line_detected:
            width_uncertainty += 40
            height_uncertainty += 30
        
        # Floor line - if estimated instead of detected
        if detection_details.floor_line_estimated:
            height_uncertainty += 30
        elif not detection_details.floor_line_detected:
            height_uncertainty += 50
        
        # Vertical edges - check detection percentage
        if detection_details.left_edge_detected_percent < 30:
            width_uncertainty += 25
            height_uncertainty += 20
        elif detection_details.left_edge_detected_percent < 60:
            width_uncertainty += 15
            height_uncertainty += 10
        
        if detection_details.right_edge_detected_percent < 30:
            width_uncertainty += 25
            height_uncertainty += 20
        elif detection_details.right_edge_detected_percent < 60:
            width_uncertainty += 15
            height_uncertainty += 10
        
        # Perspective angle adds uncertainty
        if perspective_angle > 45:
            width_uncertainty += 25
            height_uncertainty += 25
        elif perspective_angle > 30:
            width_uncertainty += 15
            height_uncertainty += 15
        elif perspective_angle > 15:
            width_uncertainty += 5
            height_uncertainty += 5
        
        # Low marker confidence adds uncertainty
        if marker_confidence < 0.5:
            width_uncertainty += 20
            height_uncertainty += 20
        elif marker_confidence < 0.7:
            width_uncertainty += 10
            height_uncertainty += 10
        
        # Image quality affects uncertainty
        if image_quality_score < 0.3:
            width_uncertainty += 20
            height_uncertainty += 20
        elif image_quality_score < 0.6:
            width_uncertainty += 10
            height_uncertainty += 10
        
        # Cap uncertainties
        width_uncertainty = min(width_uncertainty, 150)
        height_uncertainty = min(height_uncertainty, 150)
        
        # Determine confidence levels
        width_confidence = self._uncertainty_to_confidence(width_uncertainty)
        height_confidence = self._uncertainty_to_confidence(height_uncertainty)
        overall_confidence = self._combine_confidence(width_confidence, height_confidence)
        
        # Generate guidance if needed
        guidance = self._generate_guidance(detection_details, width_confidence, height_confidence)
        
        return UncertaintyResult(
            width_uncertainty_mm=width_uncertainty,
            height_uncertainty_mm=height_uncertainty,
            width_confidence=width_confidence,
            height_confidence=height_confidence,
            overall_confidence=overall_confidence,
            guidance=guidance
        )
    
    def _uncertainty_to_confidence(self, uncertainty_mm: int) -> str:
        """Convert uncertainty in mm to confidence level"""
        if uncertainty_mm <= 30:
            return "high"
        elif uncertainty_mm <= 50:
            return "medium"
        elif uncertainty_mm <= 80:
            return "low"
        else:
            return "very_low"
    
    def _combine_confidence(self, width_conf: str, height_conf: str) -> str:
        """Combine width and height confidence into overall"""
        levels = {"high": 3, "medium": 2, "low": 1, "very_low": 0}
        reverse = {3: "high", 2: "medium", 1: "low", 0: "very_low"}
        combined = min(levels[width_conf], levels[height_conf])
        return reverse[combined]
    
    def _generate_guidance(self, details: DetectionDetails, 
                          width_conf: str, height_conf: str) -> Optional[str]:
        """Generate specific guidance for improving measurement"""
        issues = []
        
        if not details.floor_line_detected:
            issues.append("floor-wall junction not visible")
        
        if not details.ceiling_line_detected:
            issues.append("ceiling-wall junction not visible")
        
        if details.left_edge_detected_percent < 50:
            issues.append("left wall edge partially blocked")
        
        if details.right_edge_detected_percent < 50:
            issues.append("right wall edge partially blocked")
        
        if not issues:
            return None
        
        if len(issues) == 1:
            return f"For better accuracy: {issues[0]}. Consider taking another photo showing this area."
        else:
            return f"For better accuracy, these areas need clearer view: {', '.join(issues)}."


class SmartWallDetector:
    """Stage 5: Wall boundary detection using color segmentation + edge detection"""
    
    def __init__(self):
        self.uncertainty_estimator = UncertaintyEstimator()
        self.lsd = cv2.createLineSegmentDetector(cv2.LSD_REFINE_STD)
    
    def detect(self, image: np.ndarray, marker_center: List[float], 
               mm_per_pixel: float, perspective_angle: float = 0.0,
               marker_confidence: float = 0.8) -> WallBoundaryResult:
        """Detect wall boundaries using color segmentation around the marker"""
        h, w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Initialize detection details
        detection_details = DetectionDetails()
        
        logger.info(f"Image size: {w}x{h}, mm_per_pixel: {mm_per_pixel}")
        
        # METHOD 1: Color-based wall segmentation
        # Sample the wall color around the marker (the marker is ON the wall)
        wall_mask = self._segment_wall_by_color(image, marker_center, w, h)
        
        # METHOD 2: Edge-based boundary detection
        edges_result = self._detect_wall_edges(gray, marker_center, w, h)
        
        # Combine both methods to find wall boundaries
        corners, detection_details = self._find_wall_corners_combined(
            image, gray, wall_mask, edges_result, marker_center, w, h, mm_per_pixel
        )
        
        # Calculate dimensions
        width_px = self._distance(corners[0], corners[1])
        height_px = self._distance(corners[0], corners[3])
        
        # Calculate dimensions in mm
        width_mm = width_px * mm_per_pixel
        height_mm = height_px * mm_per_pixel
        
        logger.info(f"Detected wall: {width_px:.0f}x{height_px:.0f} px = {width_mm:.0f}x{height_mm:.0f} mm")
        
        # Validate geometry
        geometry_valid = self._validate_geometry(corners)
        
        # Calculate edge strength
        edge_strength = self._compute_edge_strength(gray)
        
        # Calculate image quality for uncertainty
        image_quality = self._compute_image_quality(gray)
        
        # Calculate uncertainty
        uncertainty = self.uncertainty_estimator.estimate(
            detection_details,
            perspective_angle,
            marker_confidence,
            image_quality
        )
        
        return WallBoundaryResult(
            detected=True,
            corners_px=corners,
            width_px=float(width_px),
            height_px=float(height_px),
            geometry_valid=geometry_valid,
            edge_strength=float(edge_strength),
            detection_details=detection_details,
            uncertainty=uncertainty,
            error_message=uncertainty.guidance
        )
    
    def _segment_wall_by_color(self, image: np.ndarray, marker_center: List[float], 
                                w: int, h: int) -> np.ndarray:
        """Segment the wall surface by sampling color around the marker"""
        marker_x, marker_y = int(marker_center[0]), int(marker_center[1])
        
        # Sample wall color from multiple points around the marker
        sample_offsets = [
            (-50, -50), (50, -50), (-50, 50), (50, 50),  # corners
            (0, -80), (0, 80), (-80, 0), (80, 0),  # cardinal directions
        ]
        
        wall_colors = []
        for dx, dy in sample_offsets:
            sx = max(0, min(w-1, marker_x + dx))
            sy = max(0, min(h-1, marker_y + dy))
            # Sample a small region
            region = image[max(0,sy-5):min(h,sy+5), max(0,sx-5):min(w,sx+5)]
            if region.size > 0:
                avg_color = np.mean(region, axis=(0, 1))
                wall_colors.append(avg_color)
        
        if not wall_colors:
            # Fallback: sample directly at marker
            wall_colors = [image[marker_y, marker_x]]
        
        # Calculate average wall color and tolerance
        wall_color = np.mean(wall_colors, axis=0)
        color_std = np.std(wall_colors, axis=0) if len(wall_colors) > 1 else np.array([30, 30, 30])
        
        # Create mask for wall color (with tolerance)
        tolerance = np.maximum(color_std * 2, 25)  # At least 25 tolerance per channel
        
        lower = np.clip(wall_color - tolerance, 0, 255).astype(np.uint8)
        upper = np.clip(wall_color + tolerance, 0, 255).astype(np.uint8)
        
        # Create color mask
        wall_mask = cv2.inRange(image, lower, upper)
        
        # Clean up mask with morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        wall_mask = cv2.morphologyEx(wall_mask, cv2.MORPH_CLOSE, kernel)
        wall_mask = cv2.morphologyEx(wall_mask, cv2.MORPH_OPEN, kernel)
        
        # Keep only the largest connected component containing the marker
        wall_mask = self._keep_marker_component(wall_mask, marker_center)
        
        return wall_mask
    
    def _keep_marker_component(self, mask: np.ndarray, marker_center: List[float]) -> np.ndarray:
        """Keep only the connected component containing the marker"""
        marker_x, marker_y = int(marker_center[0]), int(marker_center[1])
        
        # Find connected components
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=8)
        
        if num_labels <= 1:
            return mask
        
        # Find which component contains the marker
        marker_label = labels[marker_y, marker_x]
        
        if marker_label == 0:
            # Marker is not in any component, find nearest
            min_dist = float('inf')
            for i in range(1, num_labels):
                cx, cy = centroids[i]
                dist = (cx - marker_x)**2 + (cy - marker_y)**2
                if dist < min_dist:
                    min_dist = dist
                    marker_label = i
        
        # Create mask with only the marker's component
        result = np.zeros_like(mask)
        result[labels == marker_label] = 255
        
        return result
    
    def _detect_wall_edges(self, gray: np.ndarray, marker_center: List[float],
                           w: int, h: int) -> Dict:
        """Detect wall edges using Canny + line detection"""
        # Adaptive Canny thresholds
        median_val = np.median(gray)
        canny_low = int(max(0, 0.5 * median_val))
        canny_high = int(min(255, 1.5 * median_val))
        
        edges = cv2.Canny(gray, canny_low, canny_high)
        
        # Detect lines
        lines = self.lsd.detect(gray)[0]
        
        h_lines = []
        v_lines = []
        
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = abs(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
                length = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                
                if length < 50:  # Skip short lines
                    continue
                
                if angle < 20 or angle > 160:  # Horizontal
                    h_lines.append({
                        'y': (y1 + y2) / 2,
                        'x_min': min(x1, x2),
                        'x_max': max(x1, x2),
                        'length': length
                    })
                elif 70 < angle < 110:  # Vertical
                    v_lines.append({
                        'x': (x1 + x2) / 2,
                        'y_min': min(y1, y2),
                        'y_max': max(y1, y2),
                        'length': length
                    })
        
        return {
            'edges': edges,
            'h_lines': h_lines,
            'v_lines': v_lines
        }
    
    def _find_wall_corners_combined(self, image: np.ndarray, gray: np.ndarray,
                                     wall_mask: np.ndarray, edges_result: Dict,
                                     marker_center: List[float], w: int, h: int,
                                     mm_per_pixel: float) -> Tuple[List[List[float]], DetectionDetails]:
        """Find wall corners by combining color segmentation and edge detection"""
        detection_details = DetectionDetails()
        marker_x, marker_y = marker_center
        
        # Get bounding box from wall mask
        mask_contours, _ = cv2.findContours(wall_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Initialize with image boundaries
        left_x, top_y = 0.0, 0.0
        right_x, bottom_y = float(w), float(h)
        
        if mask_contours:
            # Get the largest contour
            largest_contour = max(mask_contours, key=cv2.contourArea)
            mask_area = cv2.contourArea(largest_contour)
            
            # Get bounding rectangle
            x, y, bw, bh = cv2.boundingRect(largest_contour)
            
            # Use mask boundaries if they cover reasonable area
            if mask_area > (w * h * 0.1):  # At least 10% of image
                left_x = float(x)
                top_y = float(y)
                right_x = float(x + bw)
                bottom_y = float(y + bh)
                logger.info(f"Wall mask boundaries: ({left_x}, {top_y}) to ({right_x}, {bottom_y})")
        
        # Refine boundaries using detected lines
        h_lines = edges_result['h_lines']
        v_lines = edges_result['v_lines']
        
        detection_details.horizontal_lines_count = len(h_lines)
        detection_details.vertical_lines_count = len(v_lines)
        detection_details.total_lines_detected = len(h_lines) + len(v_lines)
        
        # Find ceiling line (top horizontal line above marker)
        ceiling_candidates = [l for l in h_lines if l['y'] < marker_y and l['length'] > w * 0.2]
        if ceiling_candidates:
            ceiling_line = max(ceiling_candidates, key=lambda l: l['y'])  # Lowest one above marker
            top_y = ceiling_line['y']
            detection_details.ceiling_line_detected = True
            logger.info(f"Ceiling line detected at y={top_y}")
        
        # Find floor line (bottom horizontal line below marker)
        floor_candidates = [l for l in h_lines if l['y'] > marker_y and l['length'] > w * 0.2]
        if floor_candidates:
            floor_line = min(floor_candidates, key=lambda l: l['y'])  # Highest one below marker
            bottom_y = floor_line['y']
            detection_details.floor_line_detected = True
            logger.info(f"Floor line detected at y={bottom_y}")
        
        # Find left edge (leftmost vertical line left of marker)
        left_candidates = [l for l in v_lines if l['x'] < marker_x - 50 and l['length'] > h * 0.15]
        if left_candidates:
            left_edge = min(left_candidates, key=lambda l: l['x'])
            left_x = left_edge['x']
            detection_details.left_edge_detected = True
            detection_details.left_edge_detected_percent = (left_edge['length'] / h) * 100
            logger.info(f"Left edge detected at x={left_x}")
        
        # Find right edge (rightmost vertical line right of marker)
        right_candidates = [l for l in v_lines if l['x'] > marker_x + 50 and l['length'] > h * 0.15]
        if right_candidates:
            right_edge = max(right_candidates, key=lambda l: l['x'])
            right_x = right_edge['x']
            detection_details.right_edge_detected = True
            detection_details.right_edge_detected_percent = (right_edge['length'] / h) * 100
            logger.info(f"Right edge detected at x={right_x}")
        
        # Estimate floor if not detected (using standard ceiling height)
        if not detection_details.floor_line_detected and detection_details.ceiling_line_detected:
            estimated_height_px = Config.STANDARD_CEILING_HEIGHT_MM / mm_per_pixel
            estimated_bottom = top_y + estimated_height_px
            if estimated_bottom <= h:
                bottom_y = estimated_bottom
                detection_details.floor_line_estimated = True
                logger.info(f"Floor estimated at y={bottom_y} using standard ceiling height")
        
        # CRITICAL: Ensure marker is within boundaries
        margin = 100  # pixels
        if left_x > marker_x - margin:
            left_x = 0.0
        if right_x < marker_x + margin:
            right_x = float(w)
        if top_y > marker_y - margin:
            top_y = 0.0
        if bottom_y < marker_y + margin:
            bottom_y = float(h)
        
        # Calculate dimensions and validate
        width_px = right_x - left_x
        height_px = bottom_y - top_y
        width_mm = width_px * mm_per_pixel
        height_mm = height_px * mm_per_pixel
        
        logger.info(f"Pre-validation: {width_mm:.0f}mm x {height_mm:.0f}mm")
        
        # IMPORTANT: If dimensions are below minimum, expand to full image
        # and add high uncertainty
        if width_mm < Config.MIN_WALL_WIDTH_MM:
            logger.warning(f"Width {width_mm:.0f}mm below minimum {Config.MIN_WALL_WIDTH_MM}mm - using full image width")
            left_x = 0.0
            right_x = float(w)
            detection_details.left_edge_detected = False
            detection_details.right_edge_detected = False
        
        if height_mm < Config.MIN_WALL_HEIGHT_MM:
            logger.warning(f"Height {height_mm:.0f}mm below minimum {Config.MIN_WALL_HEIGHT_MM}mm - using full image height")
            top_y = 0.0
            bottom_y = float(h)
            detection_details.ceiling_line_detected = False
            detection_details.floor_line_detected = False
        
        # Build corners: top-left, top-right, bottom-right, bottom-left
        corners = [
            [left_x, top_y],
            [right_x, top_y],
            [right_x, bottom_y],
            [left_x, bottom_y]
        ]
        
        return corners, detection_details
    
    def _validate_geometry(self, corners: List[List[float]]) -> bool:
        """Validate that corners form approximately rectangular geometry"""
        top_width = self._distance(corners[0], corners[1])
        bottom_width = self._distance(corners[3], corners[2])
        left_height = self._distance(corners[0], corners[3])
        right_height = self._distance(corners[1], corners[2])
        
        if max(top_width, bottom_width) == 0 or max(left_height, right_height) == 0:
            return False
        
        width_ratio = min(top_width, bottom_width) / max(top_width, bottom_width)
        height_ratio = min(left_height, right_height) / max(left_height, right_height)
        
        # Require sides to be within 20% of each other
        return width_ratio > 0.80 and height_ratio > 0.80
    
    def _distance(self, p1: List[float], p2: List[float]) -> float:
        """Euclidean distance between two points"""
        return math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
    
    def _compute_edge_strength(self, gray: np.ndarray) -> float:
        """Compute overall edge strength in image"""
        edges = cv2.Canny(gray, 50, 150)
        return float(np.mean(edges > 0))
    
    def _compute_image_quality(self, gray: np.ndarray) -> float:
        """Compute image quality score (blur detection)"""
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        return min(1.0, laplacian_var / Config.BLUR_THRESHOLD)


class ConfidenceCalculator:
    """Stage 7: Confidence score calculation"""
    
    def calculate(self, detection: ArUcoDetectionResult, 
                  scale: ScaleCalibrationResult,
                  perspective: PerspectiveCorrectionResult,
                  wall: WallBoundaryResult,
                  image: np.ndarray) -> float:
        """Calculate overall confidence score (0-1)"""
        scores = []
        weights = []
        
        # Marker detection confidence (weight: 0.3)
        if detection.detected:
            scores.append(detection.detection_confidence)
            weights.append(0.3)
        else:
            return 0.0
        
        # Scale calibration validity (weight: 0.2)
        if scale.is_valid:
            # Score based on marker squareness
            squareness_score = 1.0 - abs(1.0 - scale.marker_distortion_ratio)
            scores.append(max(0, squareness_score))
            weights.append(0.2)
        
        # Perspective correction quality (weight: 0.2)
        if perspective.corrected:
            # Lower angle = higher confidence
            angle_score = 1.0 - (perspective.perspective_angle_deg / Config.MAX_PERSPECTIVE_ANGLE_DEG)
            scores.append(max(0, angle_score))
            weights.append(0.2)
        
        # Wall geometry validity (weight: 0.2)
        if wall.detected:
            geo_score = 1.0 if wall.geometry_valid else 0.5
            scores.append(geo_score)
            weights.append(0.2)
        
        # Image quality - blur detection (weight: 0.1)
        blur_score = self._compute_blur_score(image)
        scores.append(blur_score)
        weights.append(0.1)
        
        # Weighted average
        if sum(weights) > 0:
            confidence = sum(s * w for s, w in zip(scores, weights)) / sum(weights)
        else:
            confidence = 0.0
        
        return round(float(confidence), 3)
    
    def _compute_blur_score(self, image: np.ndarray) -> float:
        """Compute blur score using Laplacian variance"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        # Normalize: higher variance = less blur = higher score
        score = min(1.0, laplacian_var / Config.BLUR_THRESHOLD)
        return float(score)


class MeasurementPipeline:
    """Complete measurement pipeline orchestrator"""
    
    def __init__(self, marker_size_mm: float = Config.MARKER_PHYSICAL_SIZE_MM):
        self.marker_size_mm = marker_size_mm
        self.detector = ArUcoDetector()
        self.calibrator = ScaleCalibrator(marker_size_mm)
        self.perspective_corrector = PerspectiveCorrector(marker_size_mm)
        self.wall_detector = SmartWallDetector()  # Use new SmartWallDetector
        self.confidence_calculator = ConfidenceCalculator()
    
    def process(self, image: np.ndarray) -> MeasurementResult:
        """Execute complete measurement pipeline"""
        start_time = datetime.now()
        
        # Stage 1: Validate image
        validation_error = self._validate_image(image)
        if validation_error:
            return MeasurementResult(
                status=MeasurementStatus.FAILED,
                error_message=validation_error
            )
        
        # Stage 2: ArUco Detection
        detection = self.detector.detect(image)
        if not detection.detected:
            return MeasurementResult(
                status=MeasurementStatus.FAILED,
                error_message=detection.error_message or "ArUco marker not detected"
            )
        
        # Stage 3: Scale Calibration
        scale = self.calibrator.calibrate(detection)
        
        # Stage 4: Perspective Correction
        corrected_image, perspective = self.perspective_corrector.correct(image, detection)
        if not perspective.corrected:
            return MeasurementResult(
                status=MeasurementStatus.FAILED,
                aruco_id=detection.aruco_id,
                error_message=perspective.error_message
            )
        
        # Use corrected scale factor after perspective correction
        mm_per_pixel = perspective.corrected_mm_per_pixel or scale.mm_per_pixel
        
        # Stage 5: Wall Boundary Detection (using SmartWallDetector)
        wall = self.wall_detector.detect(
            corrected_image, 
            detection.center_px,
            mm_per_pixel,
            perspective_angle=perspective.perspective_angle_deg or 0.0,
            marker_confidence=detection.detection_confidence
        )
        
        # Stage 6: Calculate Dimensions
        wall_width_mm = None
        wall_height_mm = None
        if wall.detected and wall.width_px and wall.height_px:
            wall_width_mm = round(wall.width_px * mm_per_pixel)
            wall_height_mm = round(wall.height_px * mm_per_pixel)
        
        # Stage 7: Calculate Confidence
        confidence = self.confidence_calculator.calculate(
            detection, scale, perspective, wall, image
        )
        
        # Extract uncertainty information
        width_uncertainty_mm = None
        height_uncertainty_mm = None
        width_confidence = None
        height_confidence = None
        guidance = None
        
        if wall.uncertainty:
            width_uncertainty_mm = wall.uncertainty.width_uncertainty_mm
            height_uncertainty_mm = wall.uncertainty.height_uncertainty_mm
            width_confidence = wall.uncertainty.width_confidence
            height_confidence = wall.uncertainty.height_confidence
            guidance = wall.uncertainty.guidance
        
        # Calculate processing time
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Build detection details dict
        detection_details_dict = None
        if wall.detection_details:
            detection_details_dict = {
                "ceiling_line_detected": wall.detection_details.ceiling_line_detected,
                "floor_line_detected": wall.detection_details.floor_line_detected,
                "floor_line_estimated": wall.detection_details.floor_line_estimated,
                "left_edge_detected": wall.detection_details.left_edge_detected,
                "right_edge_detected": wall.detection_details.right_edge_detected,
                "left_edge_detected_percent": round(wall.detection_details.left_edge_detected_percent, 1),
                "right_edge_detected_percent": round(wall.detection_details.right_edge_detected_percent, 1),
                "total_lines_detected": wall.detection_details.total_lines_detected,
                "horizontal_lines_count": wall.detection_details.horizontal_lines_count,
                "vertical_lines_count": wall.detection_details.vertical_lines_count
            }
        
        # Build result
        return MeasurementResult(
            status=MeasurementStatus.SUCCESS if wall_width_mm else MeasurementStatus.FAILED,
            wall_width_mm=wall_width_mm,
            wall_height_mm=wall_height_mm,
            aruco_id=detection.aruco_id,
            mm_per_pixel=round(mm_per_pixel, 6),
            confidence_score=confidence,
            geometry_valid=wall.geometry_valid,
            error_message=wall.error_message,
            # New uncertainty fields
            wall_width_uncertainty_mm=width_uncertainty_mm,
            wall_height_uncertainty_mm=height_uncertainty_mm,
            wall_width_confidence=width_confidence,
            wall_height_confidence=height_confidence,
            guidance=guidance,
            calibration={
                "aruco_id": detection.aruco_id,
                "aruco_size_mm": self.marker_size_mm,
                "aruco_corners_px": detection.corners_px,
                "mm_per_pixel": round(mm_per_pixel, 6),
                "mm_per_pixel_uncorrected": round(scale.mm_per_pixel, 6),
                "perspective_corrected": perspective.corrected,
                "perspective_angle_deg": round(perspective.perspective_angle_deg, 2) if perspective.perspective_angle_deg else None,
                "homography_matrix": perspective.homography_matrix,
                "marker_distortion_ratio": round(scale.marker_distortion_ratio, 3),
                "detection_confidence": round(detection.detection_confidence, 3)
            },
            wall_detection={
                "corners_px": wall.corners_px,
                "width_px": round(wall.width_px, 2) if wall.width_px else None,
                "height_px": round(wall.height_px, 2) if wall.height_px else None,
                "geometry_valid": wall.geometry_valid,
                "edge_strength": round(wall.edge_strength, 3),
                "detection_details": detection_details_dict,
                "uncertainty": {
                    "width_uncertainty_mm": width_uncertainty_mm,
                    "height_uncertainty_mm": height_uncertainty_mm,
                    "width_confidence": width_confidence,
                    "height_confidence": height_confidence
                } if wall.uncertainty else None
            },
            processing_time_ms=processing_time
        )
    
    def _validate_image(self, image: np.ndarray) -> Optional[str]:
        """Validate image meets requirements"""
        if image is None or image.size == 0:
            return "Invalid or empty image"
        
        h, w = image.shape[:2]
        
        if w < Config.MIN_IMAGE_WIDTH or h < Config.MIN_IMAGE_HEIGHT:
            return f"Image too small ({w}x{h}). Minimum: {Config.MIN_IMAGE_WIDTH}x{Config.MIN_IMAGE_HEIGHT}"
        
        return None


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="Nestup ArUco Wall Measurement API",
    description="Production-grade wall dimension measurement using ArUco markers",
    version="1.0.0"
)

# CORS middleware for frontend (localhost + web)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all; for localhost:5173 and any deployed frontend
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize pipeline
pipeline = MeasurementPipeline()


@app.get("/")
async def serve_index():
    """Serve the single-page measurement UI (same origin as API)."""
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Static index.html not found")
    return FileResponse(index_path, media_type="text/html")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "aruco-measurement", "version": "1.0.0"}


@app.post("/measure-wall", response_model=MeasurementResponse)
async def measure_wall(
    image: UploadFile = File(..., description="Wall image with ArUco marker"),
    aruco_size_mm: float = Form(default=74.0, description="Physical marker size in mm (74 = MD spec, multi-marker + ChArUco)"),
    laser_width_mm: Optional[float] = Form(default=None, description="Laser-verified wall width"),
    laser_height_mm: Optional[float] = Form(default=None, description="Laser-verified wall height"),
    intrinsics_mm_per_px: Optional[float] = Form(default=None, description="Optional: precomputed mm per pixel from camera intrinsics (blended with marker scale)"),
    distance_mm: Optional[float] = Form(default=None, description="Optional: distance to wall in mm; used with EXIF to compute intrinsics scale when intrinsics_mm_per_px not provided")
):
    """
    Measure wall dimensions from uploaded image containing ArUco marker.
    
    Pipeline stages:
    1. Image validation
    2. ArUco detection with sub-pixel refinement
    3. Scale calibration
    4. Perspective correction (homography)
    5. Wall boundary detection
    6. Dimension calculation
    7. Confidence scoring
    """
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image
        contents = await image.read()
        
        # Validate file size
        if len(contents) > Config.MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400, 
                detail=f"Image too large. Maximum: {Config.MAX_IMAGE_SIZE_MB}MB"
            )
        
        # Decode image
        nparr = np.frombuffer(contents, np.uint8)
        cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if cv_image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image")
        
        # Apply EXIF orientation so image is upright (fixes rotated phone photos; improves marker detection)
        cv_image = _apply_exif_orientation(cv_image, contents)
        
        # EXIF extraction (for calibration/debug; not shown to customer)
        exif_info = _extract_exif(contents)
        h_img, w_img = cv_image.shape[:2]
        if not exif_info.get("image_width_px"):
            exif_info["image_width_px"] = w_img
            exif_info["image_height_px"] = h_img
        
        # Intrinsics: use client value, or compute from EXIF + distance_mm
        pipeline_intrinsics: Optional[float] = None
        if intrinsics_mm_per_px is not None and intrinsics_mm_per_px > 0:
            pipeline_intrinsics = float(intrinsics_mm_per_px)
        elif distance_mm is not None and distance_mm > 0:
            pipeline_intrinsics = _compute_intrinsics_mm_per_px(
                exif_info, float(distance_mm), w_img, h_img
            )
        
        # MD-compliant pipeline (74mm spec: multi ArUco + ChArUco, ceiling cascade, 4 methods, robust)
        if aruco_size_mm == 74.0:
            from pipeline_md import run_pipeline_md, MeasurementOutput
            md_out = run_pipeline_md(cv_image, intrinsics_mm_per_px=pipeline_intrinsics)
            if md_out.status == "failed":
                result = MeasurementResult(
                    status=MeasurementStatus.FAILED,
                    error_message=md_out.error_message,
                    processing_time_ms=md_out.processing_time_ms
                )
            else:
                result = MeasurementResult(
                    status=MeasurementStatus.SUCCESS,
                    wall_width_mm=md_out.wall_width_mm,
                    wall_height_mm=md_out.wall_height_mm,
                    wall_width_uncertainty_mm=md_out.wall_width_uncertainty_mm,
                    wall_height_uncertainty_mm=md_out.wall_height_uncertainty_mm,
                    wall_width_confidence=md_out.confidence,
                    wall_height_confidence=md_out.confidence,
                    aruco_id=None,
                    mm_per_pixel=md_out.mm_per_pixel,
                    confidence_score=md_out.confidence_score,
                    geometry_valid=True,
                    guidance=md_out.error_message,
                    calibration={
                        "aruco_size_mm": 74.0,
                        "charuco_marker_size_mm": 22.5,
                        "exif": exif_info,
                        "intrinsics_used": pipeline_intrinsics is not None,
                        **((md_out.calibration or {}).copy())
                    },
                    wall_detection={
                        "corners_px": md_out.corners_px,
                        "detected_markers": md_out.detected_markers if md_out.detected_markers is not None else [],
                        "detection_details": None,
                        "uncertainty": {
                            "width_uncertainty_mm": md_out.wall_width_uncertainty_mm,
                            "height_uncertainty_mm": md_out.wall_height_uncertainty_mm,
                            "width_confidence": md_out.confidence,
                            "height_confidence": md_out.confidence
                        }
                    } if md_out.corners_px else None,
                    processing_time_ms=md_out.processing_time_ms
                )
        else:
            # Legacy single-marker pipeline (90mm or other)
            if aruco_size_mm != Config.MARKER_PHYSICAL_SIZE_MM:
                local_pipeline = MeasurementPipeline(marker_size_mm=aruco_size_mm)
                result = local_pipeline.process(cv_image)
            else:
                result = pipeline.process(cv_image)
        
        # Override with laser measurements if provided
        response_dict = asdict(result)
        
        if laser_width_mm is not None and result.status == MeasurementStatus.SUCCESS:
            response_dict["wall_width_mm"] = int(laser_width_mm)
            if response_dict.get("wall_detection"):
                response_dict["wall_detection"]["width_source"] = "laser"
                response_dict["wall_detection"]["width_accuracy_mm"] = 1.5
        
        if laser_height_mm is not None and result.status == MeasurementStatus.SUCCESS:
            response_dict["wall_height_mm"] = int(laser_height_mm)
            if response_dict.get("wall_detection"):
                response_dict["wall_detection"]["height_source"] = "laser"
                response_dict["wall_detection"]["height_accuracy_mm"] = 1.5
        
        # Rename for response model
        if "wall_detection" in response_dict:
            response_dict["wall"] = response_dict.pop("wall_detection")
        
        return JSONResponse(content=_to_json_serializable(response_dict))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error processing image")
        return JSONResponse(
            status_code=500,
            content=_to_json_serializable({
                "status": "failed",
                "wall_width_mm": None,
                "wall_height_mm": None,
                "aruco_id": None,
                "mm_per_pixel": None,
                "confidence_score": 0.0,
                "geometry_valid": False,
                "error_message": f"Internal processing error: {str(e)}"
            })
        )


@app.post("/detect-aruco")
async def detect_aruco(
    image: UploadFile = File(..., description="Image containing ArUco marker")
):
    """
    Detect ArUco marker only (for testing/debugging).
    Returns marker ID, corners, and detection confidence.
    """
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if cv_image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image")
        
        detector = ArUcoDetector()
        result = detector.detect(cv_image)
        
        return {
            "detected": result.detected,
            "aruco_id": result.aruco_id,
            "corners_px": result.corners_px,
            "center_px": result.center_px,
            "pixel_width": result.pixel_width,
            "pixel_height": result.pixel_height,
            "detection_confidence": result.detection_confidence,
            "error_message": result.error_message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error detecting ArUco marker")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
