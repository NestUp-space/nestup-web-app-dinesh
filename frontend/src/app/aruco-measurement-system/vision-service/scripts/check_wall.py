#!/usr/bin/env python3
"""
Check what's on the wall: run window, door, switchboard detection on image(s).
Usage (run from vision-service directory):
  python scripts/check_wall.py [--json] [--conf 0.25] <image_or_folder> [<image2> ...]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Allow importing feature_detection when run from vision-service root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import cv2
from feature_detection import run_feature_detection, build_feature_summary

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def collect_images(paths: list[str]) -> list[Path]:
    out = []
    for p in paths:
        path = Path(p).resolve()
        if not path.exists():
            print(f"Warning: not found: {path}", file=sys.stderr)
            continue
        if path.is_file():
            if path.suffix.lower() in IMAGE_EXTENSIONS:
                out.append(path)
            else:
                print(f"Warning: skip non-image {path}", file=sys.stderr)
        else:
            for f in sorted(path.iterdir()):
                if f.suffix.lower() in IMAGE_EXTENSIONS:
                    out.append(f)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description="Detect windows, doors, switchboards in wall images")
    ap.add_argument("paths", nargs="+", help="Image files or folders")
    ap.add_argument("--json", action="store_true", help="Output JSON per image")
    ap.add_argument("--conf", type=float, default=0.25, help="Confidence threshold (default 0.25)")
    args = ap.parse_args()
    images = collect_images(args.paths)
    if not images:
        print("No images found.", file=sys.stderr)
        sys.exit(1)
    all_results = []
    for img_path in images:
        img = cv2.imread(str(img_path))
        if img is None:
            print(f"Warning: could not read {img_path}", file=sys.stderr)
            continue
        detections = run_feature_detection(img, conf=args.conf)
        summary = build_feature_summary(detections)
        counts = {
            "windows": summary["windows"],
            "doors": summary["doors"],
            "switchboards": summary["switchboards"],
        }
        if args.json:
            all_results.append({
                "path": str(img_path),
                "feature_summary": summary,
                "counts": counts,
                "detections": [
                    {
                        "type": d.type,
                        "bbox_px": list(d.bbox_px),
                        "confidence": round(d.confidence, 3),
                    }
                    for d in detections
                ],
            })
        else:
            line = f"{img_path.name}: {summary['windows']}, {summary['doors']}, {summary['switchboards']}"
            print(line)
            if detections:
                for d in detections:
                    print(f"  - {d.type} @ {d.bbox_px} conf={d.confidence:.2f}")
    if args.json:
        print(json.dumps(all_results if len(all_results) > 1 else (all_results[0] if all_results else {}), indent=2))


if __name__ == "__main__":
    main()
