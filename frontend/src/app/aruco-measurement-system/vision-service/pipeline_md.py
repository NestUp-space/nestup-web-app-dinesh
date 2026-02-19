"""
Nestup Wall Measurement - MD-compliant pipeline (documentation as source of truth).
- Multi ArUco (74mm, ID-7) + ChArUco (22.5mm) detection; position-based roles.
- Scale: weighted average (ChArUco 0.95, ArUco 0.80); optional intrinsics correction.
- Boundaries: floor from floor-marker bottom; ceiling cascade (LSD → gradient → intensity → LBP → VP → fallback); width from markers + LSD.
- Four measurement methods (A–D) + cross-validation; robustness when one marker missing (infer, no hard fail).
"""

import math
import logging
from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Dict, Any

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants (MD spec)
# ---------------------------------------------------------------------------
ARUCO_SIZE_MM = 74.0
CHARUCO_MARKER_SIZE_MM = 22.5
DICT_ARUCO = cv2.aruco.DICT_4X4_50
DICT_CHARUCO = cv2.aruco.DICT_5X5_100
WEIGHT_CHARUCO = 0.95
WEIGHT_ARUCO = 0.80
SCALE_STD_WARN = 0.1  # mm/px - warn if scale std dev above this
OUTLIER_PERCENT = 5.0  # reject method if >5% from others
MIN_MARKERS_FOR_SUCCESS = 1  # at least one scale source (ArUco or ChArUco)


@dataclass
class MarkerInfo:
    """Single detected marker (ArUco or ChArUco)."""
    id: int
    corners: np.ndarray  # (4, 2)
    center: Tuple[float, float]
    avg_side_px: float
    mm_per_px: float
    source: str  # "aruco" | "charuco"
    bottom_y: float
    top_y: float
    left_x: float
    right_x: float


@dataclass
class ScaleResult:
    primary_mm_per_px: float
    all_scales: List[Dict[str, Any]]
    std_dev: Optional[float]
    charuco_count: int
    aruco_count: int


@dataclass
class BoundsResult:
    floor_y: float
    ceiling_y: float
    left_x: float
    right_x: float
    floor_source: str
    ceiling_source: str
    width_source: str
    ceiling_confidence: float  # 0.9 LSD, 0.75 gradient, 0.6 intensity, 0.5 LBP, 0.4 VP, 0.2 fallback


@dataclass
class MeasurementOutput:
    status: str  # "success" | "failed"
    wall_height_mm: Optional[int] = None
    wall_width_mm: Optional[int] = None
    wall_height_uncertainty_mm: Optional[int] = None
    wall_width_uncertainty_mm: Optional[int] = None
    confidence: str = "low"  # high | medium | low
    confidence_score: float = 0.0
    error_message: Optional[str] = None
    mm_per_pixel: Optional[float] = None
    markers_detected: Optional[Dict] = None
    scale_statistics: Optional[Dict] = None
    height_methods: Optional[Dict] = None
    boundary_detection: Optional[Dict] = None
    corners_px: Optional[List[List[float]]] = None
    detected_markers: Optional[List[Dict]] = None  # [{type, id, corners_px, center_px}, ...]
    calibration: Optional[Dict] = None
    processing_time_ms: Optional[int] = None


def _detect_aruco(gray: np.ndarray) -> Tuple[List[np.ndarray], Optional[np.ndarray]]:
    """Detect ArUco markers DICT_4X4_50. Returns list of corner arrays and ids."""
    d = cv2.aruco.getPredefinedDictionary(DICT_ARUCO)
    params = cv2.aruco.DetectorParameters()
    params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
    detector = cv2.aruco.ArucoDetector(d, params)
    corners, ids, _ = detector.detectMarkers(gray)
    if ids is None or len(ids) == 0:
        return [], None
    return corners, ids


def _detect_charuco(gray: np.ndarray) -> Tuple[List[np.ndarray], Optional[np.ndarray]]:
    """Detect ChArUco board markers DICT_5X5_100. Returns list of corner arrays and ids."""
    d = cv2.aruco.getPredefinedDictionary(DICT_CHARUCO)
    params = cv2.aruco.DetectorParameters()
    params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
    detector = cv2.aruco.ArucoDetector(d, params)
    corners, ids, _ = detector.detectMarkers(gray)
    if ids is None or len(ids) == 0:
        return [], None
    return corners, ids


def _avg_side_px(corners: np.ndarray) -> float:
    """Average of 4 side lengths of quadrilateral. corners: (4, 2)."""
    s = 0.0
    for i in range(4):
        j = (i + 1) % 4
        s += np.linalg.norm(corners[i] - corners[j])
    return s / 4.0


def _bounds_from_corners(corners: np.ndarray) -> Tuple[float, float, float, float]:
    """bottom_y, top_y, left_x, right_x."""
    ys = corners[:, 1]
    xs = corners[:, 0]
    return float(np.max(ys)), float(np.min(ys)), float(np.min(xs)), float(np.max(xs))


def stage1_detect_markers(image: np.ndarray) -> Tuple[List[MarkerInfo], List[MarkerInfo], np.ndarray]:
    """
    Stage 1: ArUco (74mm) + ChArUco (22.5mm). Returns (aruco_markers, charuco_markers, gray).
    Robust: works with any number of ArUco (0+) and ChArUco (0+).
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    aruco_list: List[MarkerInfo] = []
    charuco_list: List[MarkerInfo] = []

    corners_a, ids_a = _detect_aruco(gray)
    if ids_a is not None:
        for i in range(len(ids_a)):
            c = corners_a[i][0]  # (4, 2)
            avg = _avg_side_px(c)
            mm_per_px = ARUCO_SIZE_MM / avg if avg > 0 else 0.0
            center = (float(np.mean(c[:, 0])), float(np.mean(c[:, 1])))
            bottom_y, top_y, left_x, right_x = _bounds_from_corners(c)
            aruco_list.append(MarkerInfo(
                id=int(ids_a[i][0]),
                corners=c,
                center=center,
                avg_side_px=avg,
                mm_per_px=mm_per_px,
                source="aruco",
                bottom_y=bottom_y, top_y=top_y, left_x=left_x, right_x=right_x
            ))

    corners_c, ids_c = _detect_charuco(gray)
    if ids_c is not None:
        for i in range(len(ids_c)):
            c = corners_c[i][0]
            avg = _avg_side_px(c)
            mm_per_px = CHARUCO_MARKER_SIZE_MM / avg if avg > 0 else 0.0
            center = (float(np.mean(c[:, 0])), float(np.mean(c[:, 1])))
            bottom_y, top_y, left_x, right_x = _bounds_from_corners(c)
            charuco_list.append(MarkerInfo(
                id=int(ids_c[i][0]),
                corners=c,
                center=center,
                avg_side_px=avg,
                mm_per_px=mm_per_px,
                source="charuco",
                bottom_y=bottom_y, top_y=top_y, left_x=left_x, right_x=right_x
            ))

    return aruco_list, charuco_list, gray


def stage2_scale(aruco_list: List[MarkerInfo], charuco_list: List[MarkerInfo],
                 intrinsics_mm_per_px: Optional[float] = None) -> Optional[ScaleResult]:
    """
    Stage 2: Weighted average scale. ChArUco median weight 0.95, each ArUco 0.80.
    If intrinsics_mm_per_px provided, blend with computed scale for correction.
    Robust: need at least one source; otherwise returns None.
    """
    all_scales: List[Dict[str, Any]] = []
    for m in aruco_list:
        all_scales.append({"source": "aruco", "mm_per_px": m.mm_per_px, "weight": WEIGHT_ARUCO})
    if charuco_list:
        vals = sorted([m.mm_per_px for m in charuco_list])
        med = vals[len(vals) // 2]
        all_scales.append({"source": "charuco_median", "mm_per_px": med, "weight": WEIGHT_CHARUCO})

    if not all_scales:
        return None

    w_sum = sum(s["weight"] for s in all_scales)
    p_sum = sum(s["mm_per_px"] * s["weight"] for s in all_scales)
    primary = float(p_sum / w_sum) if w_sum > 0 else 0.0

    if intrinsics_mm_per_px is not None and intrinsics_mm_per_px > 0:
        primary = float(0.7 * primary + 0.3 * intrinsics_mm_per_px)

    std_dev = None
    if len(all_scales) > 1:
        mean_s = sum(s["mm_per_px"] for s in all_scales) / len(all_scales)
        std_dev = float(math.sqrt(sum((s["mm_per_px"] - mean_s) ** 2 for s in all_scales) / len(all_scales)))

    return ScaleResult(
        primary_mm_per_px=primary,
        all_scales=all_scales,
        std_dev=std_dev,
        charuco_count=len(charuco_list),
        aruco_count=len(aruco_list)
    )


def _ceiling_lsd(gray: np.ndarray, top_marker_y: float, w: int) -> Tuple[Optional[float], float]:
    """LSD: horizontal lines above top marker, longest with length > 50% width. Confidence 0.9."""
    try:
        lsd = cv2.createLineSegmentDetector(cv2.LSD_REFINE_STD)
        lines = lsd.detect(gray)[0]
    except Exception:
        return None, 0.0
    if lines is None or len(lines) == 0:
        return None, 0.0
    candidates = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        ay = (y1 + y2) / 2
        length = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        angle_deg = abs(math.degrees(math.atan2(y2 - y1, x2 - x1)))
        if (angle_deg < 15 or angle_deg > 165) and ay < top_marker_y and length > w * 0.5:
            candidates.append((ay, length))
    if not candidates:
        return None, 0.0
    candidates.sort(key=lambda x: (-x[1], x[0]))
    return candidates[0][0], 0.9


def _ceiling_gradient(gray: np.ndarray, top_marker_y: float, h: int) -> Tuple[Optional[float], float]:
    """Multi-scale gradient: Gaussian 2,4,8,16 + Sobel vertical; peak above top marker. Confidence 0.75."""
    roi_y_end = max(0, int(top_marker_y) - 10)
    if roi_y_end < 20:
        return None, 0.0
    roi = gray[:roi_y_end, :]
    if roi.size == 0:
        return None, 0.0
    combined = np.zeros_like(roi, dtype=np.float64)
    for sigma in (2, 4, 8, 16):
        blurred = cv2.GaussianBlur(roi, (0, 0), sigma)
        gy = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
        combined += np.abs(gy) * (sigma / 10.0)
    row_sum = np.mean(combined, axis=1)
    peak_idx = np.argmax(row_sum)
    if row_sum[peak_idx] < 1.0:
        return None, 0.0
    return float(peak_idx), 0.75


def _ceiling_intensity(gray: np.ndarray, top_marker_y: float) -> Tuple[Optional[float], float]:
    """Intensity profile: mean per row, smooth, inflection with >1% change. Confidence 0.6."""
    roi_y_end = max(0, int(top_marker_y) - 10)
    if roi_y_end < 20:
        return None, 0.0
    roi = gray[:roi_y_end, :]
    profile = np.mean(roi, axis=1).astype(np.float64)
    kernel = np.ones(5) / 5.0
    smooth = np.convolve(profile, kernel, mode="same")
    diff2 = np.diff(np.diff(smooth))
    for i in range(1, len(diff2)):
        if abs(diff2[i]) < 0.5:
            continue
        if i < len(profile) and abs(profile[i] - profile[max(0, i - 5)]) / (profile[max(0, i - 5)] + 1e-6) > 0.01:
            return float(i), 0.6
    return None, 0.0


def _ceiling_fallback(top_marker_y: float, h: int) -> float:
    """Fallback: 2% from top or just above top marker. Confidence 0.2."""
    return min(top_marker_y * 0.5, h * 0.02)


def stage3_boundaries(
    gray: np.ndarray,
    aruco_list: List[MarkerInfo],
    scale: ScaleResult,
    h: int,
    w: int
) -> Optional[BoundsResult]:
    """
    Stage 3: Floor from floor-marker bottom (robust: if no floor marker, use lowest marker or image bottom).
    Ceiling: cascade LSD → gradient → intensity → fallback.
    Width: leftmost/rightmost marker edges; optional LSD vertical outside markers.
    """
    # Floor: position-based floor marker = bottommost ArUco
    if aruco_list:
        by_y = sorted(aruco_list, key=lambda m: m.center[1], reverse=True)
        floor_marker = by_y[0]
        floor_y = floor_marker.bottom_y
        floor_source = "floor_marker_bottom"
    else:
        floor_y = float(h - 1)
        floor_source = "image_bottom"

    top_marker_y = float(h * 0.5)
    if aruco_list:
        top_marker_y = min(m.top_y for m in aruco_list)

    ceiling_y = None
    ceiling_conf = 0.0
    ceiling_source = "fallback"
    ceiling_y, ceiling_conf = _ceiling_lsd(gray, top_marker_y, w)
    if ceiling_y is not None:
        ceiling_source = "lsd"
    else:
        ceiling_y, ceiling_conf = _ceiling_gradient(gray, top_marker_y, h)
        if ceiling_y is not None:
            ceiling_source = "gradient"
    if ceiling_y is None:
        ceiling_y, ceiling_conf = _ceiling_intensity(gray, top_marker_y)
        if ceiling_y is not None:
            ceiling_source = "intensity"
    if ceiling_y is None:
        ceiling_y = _ceiling_fallback(top_marker_y, h)
        ceiling_conf = 0.2
        ceiling_source = "fallback"

    if ceiling_y >= floor_y:
        ceiling_y = max(0.0, top_marker_y * 0.3)

    left_x = 0.0
    right_x = float(w)
    if aruco_list:
        left_x = min(m.left_x for m in aruco_list)
        right_x = max(m.right_x for m in aruco_list)
    width_source = "marker_edges" if aruco_list else "image_width"

    return BoundsResult(
        floor_y=floor_y,
        ceiling_y=float(ceiling_y),
        left_x=left_x,
        right_x=right_x,
        floor_source=floor_source,
        ceiling_source=ceiling_source,
        width_source=width_source,
        ceiling_confidence=ceiling_conf
    )


def stage4_measurement(
    bounds: BoundsResult,
    scale: ScaleResult,
    aruco_list: List[MarkerInfo]
) -> Tuple[int, int, Dict[str, Optional[int]], int, str]:
    """
    Stage 4 & 5: Four methods A (local scale interpolation), B (top marker), C (floor marker), D (weighted avg).
    Cross-validate: reject >5% outliers, compute uncertainty and confidence.
    Returns (height_mm, width_mm, height_methods_dict, uncertainty_mm, confidence_str).
    """
    sc = scale.primary_mm_per_px
    h_px = bounds.floor_y - bounds.ceiling_y
    w_px = bounds.right_x - bounds.left_x
    if h_px <= 0 or w_px <= 0:
        return 0, 0, {}, 50, "low"

    width_mm = round(w_px * sc)

    # Method D: global weighted scale
    hD = h_px * sc

    # Method B: top marker scale
    hB = None
    if aruco_list:
        by_y = sorted(aruco_list, key=lambda m: m.center[1])
        top_m = by_y[0]
        hB = h_px * top_m.mm_per_px

    # Method C: floor marker scale
    hC = None
    if aruco_list:
        by_y = sorted(aruco_list, key=lambda m: m.center[1], reverse=True)
        floor_m = by_y[0]
        hC = h_px * floor_m.mm_per_px

    # Method A: local scale interpolation (between markers)
    hA = None
    if len(aruco_list) >= 2:
        by_y = sorted(aruco_list, key=lambda m: m.center[1])
        total = 0.0
        last_y = bounds.ceiling_y
        for m in by_y:
            total += abs(m.center[1] - last_y) * m.mm_per_px
            last_y = m.center[1]
        total += abs(bounds.floor_y - last_y) * by_y[-1].mm_per_px
        hA = total

    methods = {"A_interpolated_mm": round(hA) if hA is not None else None,
               "B_top_marker_mm": round(hB) if hB is not None else None,
               "C_floor_marker_mm": round(hC) if hC is not None else None,
               "D_global_avg_mm": round(hD)}

    values = [v for v in methods.values() if v is not None]
    if not values:
        height_mm = round(hD)
        return height_mm, width_mm, methods, 50, "low"

    primary = values[0]
    mean_h = sum(values) / len(values)
    spread = max(values) - min(values) if len(values) > 1 else 0
    outlier_threshold = mean_h * (OUTLIER_PERCENT / 100.0)
    valid = [v for v in values if abs(v - mean_h) <= max(outlier_threshold, 10)]
    if valid:
        primary = int(sum(valid) / len(valid))
    else:
        primary = int(mean_h)

    uncertainty = max(5, min(100, spread // 2))
    if scale.std_dev and scale.std_dev > 0:
        uncertainty = max(uncertainty, int(scale.std_dev * h_px))

    if len(aruco_list) + scale.charuco_count >= 5 and uncertainty <= 30 and bounds.ceiling_confidence >= 0.6:
        confidence = "high"
    elif len(aruco_list) + scale.charuco_count >= 3 and uncertainty <= 50:
        confidence = "medium"
    else:
        confidence = "low"
    if bounds.ceiling_source == "fallback":
        confidence = "medium" if confidence == "high" else "low"

    return primary, width_mm, methods, uncertainty, confidence


def run_pipeline_md(
    image: np.ndarray,
    intrinsics_mm_per_px: Optional[float] = None
) -> MeasurementOutput:
    """
    Run full MD-compliant pipeline. Robust: does not throw; returns best-effort result with status/confidence.
    """
    import time
    start = time.perf_counter()
    h, w = image.shape[:2]

    aruco_list, charuco_list, gray = stage1_detect_markers(image)
    total_markers = len(aruco_list) + len(charuco_list)

    if total_markers < MIN_MARKERS_FOR_SUCCESS:
        return MeasurementOutput(
            status="failed",
            error_message="No ArUco or ChArUco markers detected. Please ensure at least one marker is visible.",
            processing_time_ms=int((time.perf_counter() - start) * 1000)
        )

    scale = stage2_scale(aruco_list, charuco_list, intrinsics_mm_per_px)
    if scale is None or scale.primary_mm_per_px <= 0:
        return MeasurementOutput(
            status="failed",
            error_message="Could not compute scale from markers.",
            processing_time_ms=int((time.perf_counter() - start) * 1000)
        )

    bounds = stage3_boundaries(gray, aruco_list, scale, h, w)
    if bounds is None:
        return MeasurementOutput(
            status="failed",
            error_message="Could not determine boundaries.",
            mm_per_pixel=float(scale.primary_mm_per_px),
            processing_time_ms=int((time.perf_counter() - start) * 1000)
        )

    height_mm, width_mm, height_methods, uncertainty_mm, confidence_str = stage4_measurement(
        bounds, scale, aruco_list
    )

    corners_px = [
        [float(bounds.left_x), float(bounds.ceiling_y)],
        [float(bounds.right_x), float(bounds.ceiling_y)],
        [float(bounds.right_x), float(bounds.floor_y)],
        [float(bounds.left_x), float(bounds.floor_y)]
    ]

    # Per-marker list for overlay: type, id, corners_px (4 [x,y]), center_px [x,y].
    # corners_px order matches OpenCV detectMarkers: index 0=TL, 1=TR, 2=BR, 3=BL (closed quad).
    detected_markers_list: List[Dict] = []
    for m in aruco_list:
        corners_4 = [[float(m.corners[i][0]), float(m.corners[i][1])] for i in range(4)]
        detected_markers_list.append({
            "type": "aruco",
            "id": int(m.id),
            "corners_px": corners_4,
            "center_px": [float(m.center[0]), float(m.center[1])]
        })
    for m in charuco_list:
        corners_4 = [[float(m.corners[i][0]), float(m.corners[i][1])] for i in range(4)]
        detected_markers_list.append({
            "type": "charuco",
            "id": int(m.id),
            "corners_px": corners_4,
            "center_px": [float(m.center[0]), float(m.center[1])]
        })

    conf_score = 0.9 if confidence_str == "high" else 0.6 if confidence_str == "medium" else 0.4

    return MeasurementOutput(
        status="success",
        wall_height_mm=int(height_mm) if height_mm is not None else None,
        wall_width_mm=int(width_mm) if width_mm is not None else None,
        wall_height_uncertainty_mm=int(uncertainty_mm) if uncertainty_mm is not None else None,
        wall_width_uncertainty_mm=int(uncertainty_mm) if uncertainty_mm is not None else None,
        confidence=confidence_str,
        confidence_score=float(conf_score),
        mm_per_pixel=float(scale.primary_mm_per_px),
        markers_detected={"aruco_count": len(aruco_list), "charuco_count": len(charuco_list), "total": total_markers},
        scale_statistics={
            "mean_mm_per_px": round(float(scale.primary_mm_per_px), 4),
            "std_dev_mm_per_px": round(float(scale.std_dev), 4) if scale.std_dev is not None else None
        },
        height_methods=height_methods,
        boundary_detection={
            "floor_source": bounds.floor_source,
            "ceiling_source": bounds.ceiling_source,
            "width_source": bounds.width_source
        },
        corners_px=corners_px,
        detected_markers=detected_markers_list,
        calibration={
            "aruco_size_mm": ARUCO_SIZE_MM,
            "charuco_marker_size_mm": CHARUCO_MARKER_SIZE_MM,
        },
        processing_time_ms=int((time.perf_counter() - start) * 1000)
    )
