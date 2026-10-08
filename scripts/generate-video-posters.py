"""Optional poster regeneration: Python with opencv-python and Pillow.

Extract the readable title frame at 1 second; keep the original MP4s untouched.
Not a build dependency: generated JPEGs are checked in.
"""
from pathlib import Path

import cv2
from PIL import Image

video_dir = Path(__file__).resolve().parents[1] / "assets" / "video"
for name in ("wenshu-ai-reception", "wenshu-ai-plan-generation"):
    capture = cv2.VideoCapture(str(video_dir / f"{name}.mp4"))
    try:
        capture.set(cv2.CAP_PROP_POS_MSEC, 1000)
        ok, frame = capture.read()
        if not ok:
            raise RuntimeError(f"Cannot decode poster: {name}")
        poster = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        poster.thumbnail((1280, 720), Image.Resampling.LANCZOS)
        target = video_dir / f"{name}.jpg"
        poster.save(target, quality=85)
        print(f"{target}: {target.stat().st_size} bytes")
    finally:
        capture.release()
