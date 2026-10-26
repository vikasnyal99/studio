"""Build a still-image story video timed to an audio file.

    .venv/bin/python scripts/story_from_images.py IMAGES_DIR TIMING.json AUDIO OUT.mp4 [--captions captions.json]

TIMING.json is [[name, start_s, end_s], ...]; IMAGES_DIR holds name.png/.jpg/.jpeg/.webp for each.
Each image is cover-fitted to 1920x1080 and shown as-is (hard cuts). Stops and lists any missing image (skipping one would shift the timing).
"""
import json, subprocess, sys, tempfile
from pathlib import Path

d, tj, audio, out = (Path(a).resolve() for a in sys.argv[1:5])
tl = json.load(open(tj))
tmp = Path(tempfile.mkdtemp())
lines, last, missing = [], None, []
for i, (n, a, b) in enumerate(tl):
    f = next((p for e in ("png", "jpg", "jpeg", "webp") for p in [d / f"{n}.{e}"] if p.exists()), None)
    if not f:
        missing.append(n); continue
    start = tl[i][1]
    end = tl[i + 1][1] if i + 1 < len(tl) else b
    lines += [f"file '{f}'", f"duration {end - start:.3f}"]; last = f
if missing: sys.exit("missing images: " + ", ".join(missing))
lines.append(f"file '{last}'")
lst = tmp / "l.txt"; lst.write_text("\n".join(lines))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-i", str(audio), "-vf",
    "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,format=yuv420p,fade=t=in:st=0:d=0.5",
    "-c:v", "libx264", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-t", str(tl[-1][2]), str(out)], check=True)
print("wrote", out)
