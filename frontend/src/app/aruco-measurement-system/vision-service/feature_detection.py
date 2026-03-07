"""
Wall feature detection (windows, doors, switchboards) using YOLO.
Models are loaded from vision-service/models/{windows,doors,switchboards}/best.pt.
Runs on every image; does not depend on ArUco.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# Model base dir: same folder as this file, then "models"
_MODELS_DIR = Path(__file__).resolve().parent / "models"

# Env overrides for model paths
def _model_path(name: str) -> Path:
    env_key = f"{name.upper()}_MODEL_PATH"
    path = os.environ.get(env_key)
    if path:
        return Path(path)
    return _MODELS_DIR / name / "best.pt"


@dataclass
class FeatureDetection:
    """Single detection: type and bbox in pixels."""
    type: str  # "window" | "door" | "switchboard"
    bbox_px: Tuple[float, float, float, float]  # x1, y1, x2, y2
    confidence: float


# Lazy-loaded YOLO models (loaded on first use)
_models: dict = {}
_CONF_DEFAULT = 0.25


def _load_models() -> dict:
    """Load the three YOLO models once. Skip missing files with a warning."""
    global _models
    if _models:
        return _models
    try:
        from ultralytics import YOLO
    except ImportError:
        logger.warning("ultralytics not installed; feature detection disabled")
        return _models
    for name, key in [("windows", "window"), ("doors", "door"), ("switchboards", "switchboard")]:
        path = _model_path(name)
        if path.exists():
            try:
                _models[key] = YOLO(str(path))
                logger.info("Loaded %s model: %s", key, path)
            except Exception as e:
                logger.warning("Failed to load %s model %s: %s", key, path, e)
        else:
            logger.warning("Model file not found: %s (skip %s detection)", path, key)
    return _models


def run_feature_detection(
    image: np.ndarray,
    conf: float = _CONF_DEFAULT,
) -> List[FeatureDetection]:
    """
    Run windows, doors, and switchboards detection on the image.
    Returns list of detections with type, bbox_px (x1,y1,x2,y2), and confidence.
    """
    out: List[FeatureDetection] = []
    models = _load_models()
    if not models:
        return out
    try:
        from ultralytics import YOLO
    except ImportError:
        return out
    for type_name, model in models.items():
        try:
            results = model.predict(image, conf=conf, verbose=False)
            if not results:
                continue
            boxes = results[0].boxes
            if boxes is None:
                continue
            for box in boxes:
                xyxy = box.xyxy[0]
                if xyxy is not None and len(xyxy) >= 4:
                    x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])
                    c = float(box.conf[0]) if box.conf is not None else 0.0
                    out.append(
                        FeatureDetection(
                            type=type_name,
                            bbox_px=(x1, y1, x2, y2),
                            confidence=c,
                        )
                    )
        except Exception as e:
            logger.warning("Feature detection failed for %s: %s", type_name, e)
    return out


def build_feature_summary(detections: List[FeatureDetection]) -> dict:
    """
    Build feature_summary dict with exact wording for UI:
    - windows: "No windows found" | "1 window detected" | "2 windows detected"
    - doors: same pattern
    - switchboards: "No switchboards found" | "1 switchboard detected" | "2 switchboards detected"
    """
    counts = {"window": 0, "door": 0, "switchboard": 0}
    for d in detections:
        if d.type in counts:
            counts[d.type] += 1

    def phrase(name: str, singular: str, plural: str, n: int) -> str:
        if n == 0:
            return f"No {plural} found"
        if n == 1:
            return f"1 {singular} detected"
        return f"{n} {plural} detected"

    return {
        "windows": phrase("windows", "window", "windows", counts["window"]),
        "doors": phrase("doors", "door", "doors", counts["door"]),
        "switchboards": phrase("switchboards", "switchboard", "switchboards", counts["switchboard"]),
    }
