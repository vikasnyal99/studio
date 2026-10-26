"""Cut short clips out of a source video and draw hand-drawn red circles on them.

Usage (from the project folder):

    .venv/bin/python scripts/circle_clip.py videos/<name>/circles.json [name ...]

circles.json:
    {"src": {"t1": "path.mp4", "t2": "path.mp4"},
     "out": "videos/<name>/assets",
     "clips": [
       {"name": "c_sword", "src": "t2", "start": 57.0, "end": 58.6, "slow": 0.7,
        "circles": [{"at": 57.45, "cx": 0.28, "cy": 0.38, "rx": 0.2, "ry": 0.18}]}
     ]}

- start / end / at are seconds in the source video. A clip is at most 10 s.
- cx, cy, rx, ry are fractions of the frame (centre and radii).
- Each circle is drawn on over 0.35 s of source time (or `draw`), then stays until the clip ends
  (or `until`). A pen wobble and a small overshoot make it look hand-drawn.
- `slow` (default 1) plays the clip slower, e.g. 0.6 for a very short shot.
- Output: out/<name>.mp4, 1920x1080, 30 fps, no sound (clip scenes are silent).
  Add `"plain": true` to a clip to skip the circles.
"""

from __future__ import annotations

import json
import math
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

W, H = 1920, 1080
DRAW_SECONDS = 0.35


def ellipse_path(c: dict, seed: int) -> np.ndarray:
    """Points of a slightly wobbly, overshooting ellipse, as (N, 2) pixels."""
    rng = np.random.default_rng(seed)
    n = 120
    turns = 1.08
    start = rng.uniform(-2.6, -1.9)  # begin up and to the left
    theta = start + np.linspace(0, 2 * math.pi * turns, n)
    wob = 1 + 0.045 * np.sin(theta * 2 + rng.uniform(0, 6)) + 0.03 * np.sin(theta * 3 + rng.uniform(0, 6))
    grow = 1 + 0.07 * np.linspace(0, 1, n)  # the second lap sits a little wider
    cx, cy = c["cx"] * W, c["cy"] * H
    rx, ry = c["rx"] * W, c["ry"] * H
    x = cx + rx * wob * grow * np.cos(theta)
    y = cy + ry * wob * grow * np.sin(theta)
    return np.stack([x, y], 1)


def draw_circle(img: np.ndarray, pts: np.ndarray, progress: float) -> None:
    k = max(2, int(len(pts) * min(1.0, progress)))
    poly = pts[:k].astype(np.int32).reshape(-1, 1, 2)
    cv2.polylines(img, [poly], False, (20, 20, 20), 11, cv2.LINE_AA)  # soft dark edge
    cv2.polylines(img, [poly], False, (40, 40, 235), 7, cv2.LINE_AA)  # red (BGR)


def render(clip: dict, spec: dict) -> Path:
    src = spec["src"][clip["src"]]
    start, end = float(clip["start"]), float(clip["end"])
    if end - start > 10:
        raise SystemExit(f"{clip['name']}: longer than 10 s")
    out = Path(spec["out"]) / f"{clip['name']}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    slow = float(clip.get("slow", 1.0))
    circles = [] if clip.get("plain") else clip.get("circles", [])
    paths = [ellipse_path(c, 7 + i) for i, c in enumerate(circles)]

    dec = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-ss", f"{start}", "-t", f"{end - start}", "-i", src,
         "-vf", f"scale={W}:{H}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
        stdout=subprocess.PIPE)
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries",
                            "stream=r_frame_rate", "-of", "csv=p=0", src], capture_output=True, text=True)
    num, den = probe.stdout.split()[0].split("/")
    fps = float(num) / float(den)
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", f"{fps}",
         "-i", "-", "-vf", f"setpts={1 / slow}*PTS,fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "16",
         "-preset", "medium", "-an", str(out)], stdin=subprocess.PIPE)
    i = 0
    size = W * H * 3
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        img = np.frombuffer(buf, np.uint8).reshape(H, W, 3).copy()
        t = start + i / fps
        for c, pts in zip(circles, paths):
            if t < c["at"] or ("until" in c and t > c["until"]):
                continue
            draw_circle(img, pts, (t - c["at"]) / c.get("draw", DRAW_SECONDS))
        enc.stdin.write(img.tobytes())
        i += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    return out


def main() -> None:
    spec = json.loads(Path(sys.argv[1]).read_text())
    only = set(sys.argv[2:])
    for clip in spec["clips"]:
        if only and clip["name"] not in only:
            continue
        print(render(clip, spec))


if __name__ == "__main__":
    main()
