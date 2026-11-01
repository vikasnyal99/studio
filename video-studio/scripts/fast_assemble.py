"""Fast final render for a video whose scenes are ALL ready-made clips (type "clip").

HyperFrames screenshots every frame in a browser (~75 min and up to 10 GB RAM for 10 min of video). When every scene
in scenes.json is already an mp4 (animation-studio inserts: hook, maps, war maps, proof shots, Doc chapters), the
same picture can be cut and joined with ffmpeg in minutes, with little memory:

    .venv/bin/python scripts/fast_assemble.py videos/<name>

1. builds sound.json exactly like make_video.py (voice + music beds + sfx) and mixes it with finish.py;
2. cuts each clip from its `from` second for the scene's length (last frame held if the clip is short), 1920x1080 30 fps;
3. joins the pieces, adds the sound -> output/final.mp4, and writes output/description_credits.txt.
Stops with a message if any scene is not a clip (use make_video.py render for those videos).
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_video  # noqa: E402
import finish  # noqa: E402
import make_video  # noqa: E402

FPS = 30


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print(__doc__)
        return 1
    vd = Path(argv[0]).resolve()
    plan = json.loads((vd / "scenes.json").read_text(encoding="utf-8"))
    scenes, total = plan["scenes"], float(plan["duration"])
    other = [s for s in scenes if s["type"] != "clip"]
    if other:
        print(f"not all scenes are clips ({len(other)} are {sorted({s['type'] for s in other})}); use make_video.py render")
        return 1
    build_video.build(vd)  # writes sound.json (and hf/, unused here)
    work = vd / "hf" / "fast"
    work.mkdir(parents=True, exist_ok=True)
    pieces = []
    for i, s in enumerate(scenes):
        start = float(s["t"])
        end = float(scenes[i + 1]["t"]) if i + 1 < len(scenes) else total
        span = round(end - start, 3)
        if span <= 0.02:
            continue
        clip = vd / "assets" / s["clip"]
        frm = float(s.get("from", 0))
        have = duration(clip) - frm
        pad = max(0.0, span - have + 0.05)
        zoom = float(s.get("zoom", 1.0))
        vf = f"scale={round(1920 * zoom)}:{round(1080 * zoom)}:flags=lanczos,crop=1920:1080,fps={FPS},setsar=1,format=yuv420p"
        if pad > 0:
            vf += f",tpad=stop_mode=clone:stop_duration={pad:.3f}"
        out = work / f"{i:03d}.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{frm:.3f}", "-i", str(clip), "-t", f"{span:.3f}", "-vf", vf, "-an",
             "-c:v", "libx264", "-preset", "medium", "-crf", str(plan.get("crf", 16)), "-r", str(FPS), str(out)])
        pieces.append(out)
        print(f"\r{i + 1}/{len(scenes)} scenes", end="", flush=True)
    print()
    lst = work / "list.txt"
    lst.write_text("".join(f"file '{p}'\n" for p in pieces))
    silent = work / "video.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(silent)])
    final = vd / "output" / "final.mp4"
    final.parent.mkdir(exist_ok=True)
    code = finish.main(["--video", str(silent), "--sound", str(vd / "sound.json"), "--output", str(final)])
    if code != 0:
        print("adding the sound failed")
        return code
    make_video.write_credits(vd)
    print(f"wrote {final} ({duration(final):.1f} s, scenes.json says {total:.1f} s)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
