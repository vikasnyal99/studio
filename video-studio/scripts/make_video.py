"""Turn a video's scenes.json into the finished MP4.

Usage (from the project folder):

    .venv/bin/python scripts/make_video.py videos/<name> check    # build + still frames on a few sheets
    .venv/bin/python scripts/make_video.py videos/<name> render   # build + render + sound -> output/final.mp4
    .venv/bin/python scripts/make_video.py videos/<name> assets   # one sheet of every picture in assets/

check   writes videos/<name>/check/sheet_1.jpg, sheet_2.jpg ... with one frame
        per scene, 20 to a sheet, each labelled with its scene number and
        start second. Look at the sheets, fix scenes.json, check again.
render  takes about 1.2x the length of the video on this laptop. The result
        is videos/<name>/output/final.mp4 plus description_credits.txt.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

import build_video  # noqa: E402

log = logging.getLogger("make")
PER_SHEET, COLUMNS, CELL = 20, 5, (384, 216)


class MakeError(RuntimeError):
    pass


def check_times(starts: list[float], total: float) -> list[float]:
    """One moment per scene, late enough that its animations have played."""
    ends = starts[1:] + [total]
    return [round(min(end - 0.25, start + (end - start) * 0.92), 2) for start, end in zip(starts, ends)]


NETWORK_HINTS = ("ENOTFOUND", "EAI_AGAIN", "ECONNRESET", "ETIMEDOUT", "ERR_INTERNET_DISCONNECTED", "ERR_NAME_NOT_RESOLVED", "network")


def hyperframes(args: list[str], cwd: Path, quiet: bool = True, tries: int = 3) -> None:
    """Run HyperFrames under Node 22 (installed through nvm).

    The pinned package is taken from npm's cache when it is there, so a dropped Wi-Fi
    connection does not stop a render; a failure that looks like a network blip is retried.
    """
    import time

    tool = f"npx --yes --prefer-offline hyperframes@{build_video.HYPERFRAMES_VERSION} " + " ".join(args)
    # 4K renders encode slowly on this laptop: lift HyperFrames' 19-minute encoder limit and encode in chunks
    limits = "export FFMPEG_ENCODE_TIMEOUT_MS=21600000 PRODUCER_ENABLE_CHUNKED_ENCODE=true;"
    command = f'{limits} export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 22 >/dev/null; {tool}'
    for attempt in range(1, tries + 1):
        result = subprocess.run(["bash", "-c", command], cwd=cwd, capture_output=True, text=True)
        if not quiet:
            print(result.stdout, end="")
        if result.returncode == 0:
            return
        tail = "\n".join((result.stdout or "").splitlines()[-15:] + (result.stderr or "").splitlines()[-15:])
        if attempt < tries and any(h in tail for h in NETWORK_HINTS):
            log.warning("HyperFrames hit a network error (attempt %d of %d); retrying in 20 s", attempt, tries)
            time.sleep(20)
            continue
        raise MakeError(f"HyperFrames failed ({' '.join(args[:2])}):\n{tail}")


def labelled_sheets(frames: list[tuple[Path, str]], out_dir: Path, prefix: str = "sheet") -> list[Path]:
    from PIL import Image, ImageDraw

    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob(f"{prefix}_*.jpg"):
        old.unlink()
    sheets = []
    for part in range(0, len(frames), PER_SHEET):
        chunk = frames[part:part + PER_SHEET]
        rows = -(-len(chunk) // COLUMNS)
        sheet = Image.new("RGB", (COLUMNS * CELL[0], rows * (CELL[1] + 18)), "black")
        draw = ImageDraw.Draw(sheet)
        for i, (path, label) in enumerate(chunk):
            x, y = (i % COLUMNS) * CELL[0], (i // COLUMNS) * (CELL[1] + 18)
            picture = Image.open(path).convert("RGB")
            picture.thumbnail(CELL)
            sheet.paste(picture, (x, y + 18))
            draw.text((x + 4, y + 3), label, fill=(255, 220, 0))
        target = out_dir / f"{prefix}_{part // PER_SHEET + 1}.jpg"
        sheet.save(target, quality=82)
        sheets.append(target)
    return sheets


def do_build(video_dir: Path) -> dict:
    return build_video.build(video_dir)


def do_check(video_dir: Path) -> list[Path]:
    do_build(video_dir)
    plan = json.loads((video_dir / "scenes.json").read_text(encoding="utf-8"))
    starts = [float(s["t"]) for s in plan["scenes"]]
    times = check_times(starts, float(plan["duration"]))
    hf = video_dir / "hf"
    shutil.rmtree(hf / "snapshots", ignore_errors=True)
    hyperframes(["snapshot", "--no-end", "--at", ",".join(str(t) for t in times)], hf)
    found = sorted((hf / "snapshots").glob("frame-*.png"), key=lambda f: int(re.search(r"frame-(\d+)", f.name).group(1)))
    if len(found) != len(times):
        raise MakeError(f"expected {len(times)} still frames, got {len(found)}")
    labels = [f"#{i} t={start:g} {plan['scenes'][i]['type']}" for i, start in enumerate(starts)]
    sheets = labelled_sheets(list(zip(found, labels)), video_dir / "check")
    shutil.rmtree(hf / "snapshots", ignore_errors=True)
    return sheets


def do_assets(video_dir: Path) -> list[Path]:
    pictures = sorted(p for p in (video_dir / "assets").iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    if not pictures:
        raise MakeError("no pictures in assets/ yet")
    return labelled_sheets([(p, p.name[:44]) for p in pictures], video_dir / "check", prefix="assets")


def write_credits(video_dir: Path) -> Path:
    """Credit lines for the YouTube description (required by the CC BY licences)."""
    sources_path = video_dir / "research" / "sources.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8")) if sources_path.exists() else {}
    plan_text = (video_dir / "scenes.json").read_text(encoding="utf-8")
    proofs = video_dir / "proofs.json"   # proof shots made in animation-studio also show screenshots
    used_text = plan_text + (proofs.read_text(encoding="utf-8") if proofs.exists() else "")
    lines = ["SOURCES", ""]
    lines += [f"- {s.get('outlet', '')} ({s.get('date', '')}): {s.get('url', '')}" for s in sources.get("screenshots", [])
              if Path(s["file"]).name in used_text]
    lines += sources.get("credits_extra", [])   # data sources shown as numbers/text, clips quoted, etc.
    used = sorted({(p.get("author", ""), p.get("licence", "")) for p in sources.get("photos", []) if Path(p["file"]).name in used_text})
    lines += ["", "PHOTOS (Wikimedia Commons)", ""] + [f"- {author} · {licence}" for author, licence in used]
    lines += ["", "MAPS", "", "- Natural Earth (public domain)", "", "MUSIC", ""]
    tracks = sorted({Path(m["file"]).stem.replace("_", " ") for m in json.loads(plan_text).get("music", [])})
    if tracks:
        lines += [", ".join(f'"{t}"' for t in tracks) + " Kevin MacLeod (incompetech.com)",
                  "Licensed under Creative Commons: By Attribution 4.0 License", "http://creativecommons.org/licenses/by/4.0/"]
    target = video_dir / "output" / "description_credits.txt"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return target


def do_render(video_dir: Path) -> Path:
    import finish

    do_build(video_dir)
    hf = video_dir / "hf"
    silent = hf / "renders" / "video.mp4"
    plan = json.loads((video_dir / "scenes.json").read_text(encoding="utf-8"))
    args = ["render", "--quiet", "-o", "renders/video.mp4"]
    if plan.get("resolution") == "4k":  # scenes.json "resolution": "4k" renders 3840x2160; YouTube streams 4K uploads at a much higher bitrate
        args += ["--resolution", "4k", "--crf", "18"]
        log.info("rendering in 4K (about 4x the length of the video)...")
    else:
        # near-lossless 1080p; YouTube re-encodes anyway, so give it a clean source. scenes.json "crf" overrides (12 = sharper, ~2x size)
        args += ["--crf", str(plan.get("crf", 16))]
        log.info("rendering (about 1.2x the length of the video)...")
    hyperframes(args, hf)
    if not silent.exists():
        raise MakeError("HyperFrames finished but renders/video.mp4 is missing")
    final = video_dir / "output" / "final.mp4"
    code = finish.main(["--video", str(silent), "--sound", str(video_dir / "sound.json"), "--output", str(final)])
    if code != 0:
        raise MakeError("adding the sound failed; see the error above")
    write_credits(video_dir)
    return final


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="Build, check and render one video.")
    parser.add_argument("video_dir", type=Path, help="the video's folder, e.g. videos/2026-10-14-topic")
    parser.add_argument("action", choices=["check", "render", "assets"])
    args = parser.parse_args(argv)
    video_dir = args.video_dir.resolve()
    try:
        if args.action == "check":
            for sheet in do_check(video_dir):
                print(sheet)
        elif args.action == "assets":
            for sheet in do_assets(video_dir):
                print(sheet)
        else:
            print(do_render(video_dir))
        return 0
    except (MakeError, FileNotFoundError, build_video.SceneError) as exc:
        log.error("%s", exc)
        return 1
    except json.JSONDecodeError as exc:
        log.error("scenes.json is not valid JSON: %s", exc)
        return 1


if __name__ == "__main__":
    sys.exit(main())
