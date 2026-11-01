"""Make a faster cut of a finished video (e.g. 1.2x) without re-rendering anything.

    .venv/bin/python scripts/speed_version.py videos/<name> 1.2 [--music-db 3] [--duck-db 5]

Uses the silent picture from the last fast_assemble.py run (hf/fast/video.mp4) and sound.json:
- picture: sped up by the factor (frames resampled to 30 fps);
- narration: sped up with pitch kept (ffmpeg atempo) -> audio-edit/<voice>_x<speed>.wav;
- music beds and sound effects: start/end times divided by the factor, music itself plays at normal speed;
  music level/ducking can be set here (below_voice_db for every bed, duck db);
- captions: timing/subtitles_hi.srt -> timing/subtitles_hi_x<speed>.srt.
Writes output/final_x<speed>.mp4 (and the credits file).
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import finish  # noqa: E402
import make_video  # noqa: E402


def main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    opts = {argv[i]: float(argv[i + 1]) for i in range(len(argv) - 1) if argv[i].startswith("--")}
    if len(args) < 2:
        print(__doc__)
        return 1
    vd, k = Path(args[0]).resolve(), float(args[1])
    tag = f"x{k:g}"
    root = vd.parents[1]
    silent = vd / "hf" / "fast" / "video.mp4"
    if not silent.exists():
        print("run scripts/fast_assemble.py first (no hf/fast/video.mp4)")
        return 1
    plan = json.loads((vd / "sound.json").read_text(encoding="utf-8"))
    voice_src = root / plan["voice"]["file"]
    voice_out = voice_src.with_name(f"{voice_src.stem}_{tag}.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(voice_src), "-af", f"atempo={k}", str(voice_out)], check=True)
    fast_video = vd / "hf" / "fast" / f"video_{tag}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(silent), "-vf", f"setpts=PTS/{k},fps=30", "-an",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", str(fast_video)], check=True)
    sp = dict(plan)
    sp["voice"] = {**plan["voice"], "file": str(voice_out.relative_to(root)), "start": 0.0, "end": round(plan["voice"]["end"] / k, 3)}
    sp["music"] = [{**m, "from": round(m["from"] / k, 3), "to": round(m["to"] / k, 3),
                    **({"below_voice_db": opts["--music-db"]} if "--music-db" in opts else {})} for m in plan.get("music", [])]
    sp["cues"] = [[round(c[0] / k, 3), c[1], c[2]] for c in plan.get("cues", [])]
    if "--duck-db" in opts:
        sp["duck"] = {"db": opts["--duck-db"], "attack": 0.08, "release": 0.6}
    plan_path = vd / f"sound_{tag}.json"
    plan_path.write_text(json.dumps(sp, ensure_ascii=False, indent=1), encoding="utf-8")
    final = vd / "output" / f"final_{tag}.mp4"
    code = finish.main(["--video", str(fast_video), "--sound", str(plan_path), "--output", str(final)])
    if code:
        return code
    srt = vd / "timing" / "subtitles_hi.srt"
    if srt.exists():
        def scale(m: re.Match) -> str:
            h, mi, s, ms = map(int, m.groups())
            t = (h * 3600 + mi * 60 + s + ms / 1000) / k
            return f"{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round(t % 1 * 1000)) % 1000:03d}"
        (vd / "timing" / f"subtitles_hi_{tag}.srt").write_text(
            re.sub(r"(\d\d):(\d\d):(\d\d),(\d\d\d)", scale, srt.read_text(encoding="utf-8")), encoding="utf-8")
    make_video.write_credits(vd)
    print(f"wrote {final}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
