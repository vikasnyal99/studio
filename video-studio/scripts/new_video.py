"""Start a new video: make its folder and bring in the recording and the script.

Usage (from the project folder):

    .venv/bin/python scripts/new_video.py 2026-10-14-topic --media inbox/recording.mp3 --script inbox/script.txt

--media   the voice recording, or a video of you speaking (its sound becomes the narration)
--script  optional: the written script as a text file

Creates videos/<name>/ with:

    voice/      a copy of your recording (the original is never changed)
    script.txt  your script, if given
    timing/     filled by scripts/transcribe.py
    research/   sources.json: every fact, screenshot and photo with its link and licence
    assets/     pictures used in the video
    scenes.json the storyboard, ready for scenes to be added
    output/     the finished video
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUDIO = {".mp3", ".wav", ".m4a", ".flac", ".ogg"}
VIDEO = {".mp4", ".mov", ".mkv", ".webm", ".m4v"}
DEFAULT_MUSIC = "library/music/Interloper.mp3"


def valid_name(name: str) -> bool:
    return bool(re.fullmatch(r"[a-z0-9][a-z0-9-]{1,60}", name))


def media_seconds(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def starter_plan(voice: str, seconds: float) -> dict:
    return {
        "voice": voice,
        "duration": round(seconds, 2),
        "map": "south_asia",
        "music": [{"file": DEFAULT_MUSIC, "from": 0, "to": round(seconds, 2), "below_voice_db": 13}],
        "scenes": [],
    }


def create(name: str, media: Path, script: Path | None) -> dict:
    if not valid_name(name):
        raise ValueError("the name may use only small letters, digits and dashes, e.g. 2026-10-14-farm-laws")
    if not media.is_file():
        raise FileNotFoundError(f"recording not found: {media}")
    kind = media.suffix.lower()
    if kind not in AUDIO | VIDEO:
        raise ValueError(f"unsupported file type '{media.suffix}'. Use one of: {', '.join(sorted(AUDIO | VIDEO))}")
    if script is not None and not script.is_file():
        raise FileNotFoundError(f"script not found: {script}")

    video_dir = PROJECT_ROOT / "videos" / name
    if video_dir.exists():
        raise FileExistsError(f"{video_dir} already exists; pick another name")
    for sub in ("voice", "timing", "research", "assets", "output"):
        (video_dir / sub).mkdir(parents=True)

    original = video_dir / "voice" / f"original{kind}"
    shutil.copyfile(media, original)
    if kind in VIDEO:
        # the sound of a video recording becomes the narration
        voice = video_dir / "voice" / "narration.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(original), "-vn", "-ac", "1", "-ar", "48000", str(voice)],
                       check=True)
    else:
        voice = original
    if script is not None:
        shutil.copyfile(script, video_dir / "script.txt")

    seconds = media_seconds(voice)
    plan = starter_plan(voice.relative_to(PROJECT_ROOT).as_posix(), seconds)
    (video_dir / "scenes.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    sources = {"facts": [], "screenshots": [], "photos": [], "music": [], "map": "Natural Earth (public domain)"}
    (video_dir / "research" / "sources.json").write_text(json.dumps(sources, indent=1) + "\n", encoding="utf-8")
    return {"folder": str(video_dir.relative_to(PROJECT_ROOT)), "voice": plan["voice"], "seconds": plan["duration"],
            "script": script is not None, "from_video": kind in VIDEO}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Start a new video folder.")
    parser.add_argument("name", help="folder name, e.g. 2026-10-14-farm-laws")
    parser.add_argument("--media", required=True, type=Path, help="voice recording, or a video of you speaking")
    parser.add_argument("--script", type=Path, help="the written script (text file)")
    args = parser.parse_args(argv)
    try:
        result = create(args.name, args.media.expanduser(), args.script.expanduser() if args.script else None)
    except (FileNotFoundError, FileExistsError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    except subprocess.CalledProcessError as exc:
        print(f"error: FFmpeg could not read the recording (exit code {exc.returncode})", file=sys.stderr)
        return 1
    print(json.dumps(result))
    print(f"next: .venv/bin/python scripts/transcribe.py --input {result['voice']} --output-dir {result['folder']}/timing")
    return 0


if __name__ == "__main__":
    sys.exit(main())
