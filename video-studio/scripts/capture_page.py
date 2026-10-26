"""Screenshot a web page (a news article, a Wikipedia page) to use as evidence on screen.

Usage (from the project folder):

    # 1. capture: saves the page and a small preview with a numbered grid
    .venv/bin/python scripts/capture_page.py videos/<name> shot https://example.com/article crisis

    # 2. look at research/shots/crisis_grid.jpg ONCE, read the crop off the grid, then:
    .venv/bin/python scripts/capture_page.py videos/<name> crop crisis 60,500,1660,1140 \\
        --outlet "The Kathmandu Post" --date 2022-04-01 --url https://example.com/article

The crop is left,top,width,height in the page's own pixels (the numbers on the
grid). It is saved as assets/shot_<name>.png and recorded in
research/sources.json.

Many big news sites refuse automated browsers. The script says so when a
capture looks blocked; use another outlet for the same story, or ask the user
for a screenshot. Do not try to get round the block.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

WINDOW = (1280, 1000)  # browser window in CSS pixels; captured at 2x, so 2560x2000
BLOCK_WORDS = ("access denied", "security verification", "are you a robot", "unknown error", "captcha", "403 forbidden")


class CaptureError(RuntimeError):
    pass


def parse_crop(text: str) -> tuple[int, int, int, int]:
    parts = text.split(",")
    if len(parts) != 4 or not all(p.strip().isdigit() for p in parts):
        raise CaptureError("crop must be left,top,width,height in pixels, e.g. 60,500,1660,1140")
    left, top, width, height = (int(p) for p in parts)
    if width < 200 or height < 100:
        raise CaptureError("crop is too small to read on screen")
    return left, top, width, height


def looks_blocked(size_bytes: int, colours: int) -> bool:
    """A blocked page is a near-empty white page: tiny file, very few colours."""
    return size_bytes < 150_000 or colours < 400


def find_chrome() -> str:
    import shutil

    for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        if shutil.which(name):
            return name
    raise CaptureError("Google Chrome is not installed")


def shot(video_dir: Path, url: str, name: str) -> dict:
    from PIL import Image, ImageDraw

    if not re.fullmatch(r"[a-z0-9_]+", name):
        raise CaptureError("the name may use only small letters, digits and underscore")
    shots = video_dir / "research" / "shots"
    shots.mkdir(parents=True, exist_ok=True)
    target = shots / f"{name}.png"
    target.unlink(missing_ok=True)
    cmd = [find_chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2",
           f"--window-size={WINDOW[0]},{WINDOW[1]}", "--virtual-time-budget=12000", f"--screenshot={target}", url]
    try:
        subprocess.run(cmd, capture_output=True, timeout=80)
    except subprocess.TimeoutExpired:
        raise CaptureError("the page took too long to load (often a sign the site blocks automated browsers)")
    if not target.exists():
        raise CaptureError("Chrome did not produce a screenshot")

    image = Image.open(target).convert("RGB")
    colours = len(image.resize((160, 125)).getcolors(maxcolors=20000) or [])
    blocked = looks_blocked(target.stat().st_size, colours)

    # preview at half size with a grid labelled in the page's own pixels
    preview = image.resize((image.width // 2, image.height // 2))
    draw = ImageDraw.Draw(preview)
    for x in range(0, image.width, 200):
        draw.line([(x // 2, 0), (x // 2, preview.height)], fill=(255, 0, 80), width=1)
        draw.text((x // 2 + 3, 2), str(x), fill=(255, 0, 80))
    for y in range(0, image.height, 200):
        draw.line([(0, y // 2), (preview.width, y // 2)], fill=(255, 0, 80), width=1)
        draw.text((3, y // 2 + 2), str(y), fill=(255, 0, 80))
    grid = shots / f"{name}_grid.jpg"
    preview.save(grid, quality=80)
    return {"capture": str(target), "grid": str(grid), "size": f"{image.width}x{image.height}", "blocked": blocked}


def crop(video_dir: Path, name: str, box: tuple[int, int, int, int], outlet: str, date: str, url: str) -> dict:
    from PIL import Image

    source = video_dir / "research" / "shots" / f"{name}.png"
    if not source.exists():
        raise CaptureError(f"no capture called '{name}'; run 'shot' first")
    left, top, width, height = box
    image = Image.open(source)
    if left + width > image.width or top + height > image.height:
        raise CaptureError(f"crop goes outside the capture, which is {image.width}x{image.height}")
    target = video_dir / "assets" / f"shot_{name}.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    image.crop((left, top, left + width, top + height)).save(target)
    entry = {"file": f"assets/shot_{name}.png", "outlet": outlet, "date": date, "url": url,
             "chip": " · ".join(part for part in (outlet, date) if part)}
    sources_path = video_dir / "research" / "sources.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8")) if sources_path.exists() else {}
    sources["screenshots"] = [s for s in sources.get("screenshots", []) if s.get("file") != entry["file"]] + [entry]
    sources_path.write_text(json.dumps(sources, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return entry


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Screenshot a web page for use as evidence on screen.")
    parser.add_argument("video_dir", type=Path)
    sub = parser.add_subparsers(dest="action", required=True)
    p_shot = sub.add_parser("shot", help="capture a page")
    p_shot.add_argument("url")
    p_shot.add_argument("name")
    p_crop = sub.add_parser("crop", help="cut the useful part out of a capture")
    p_crop.add_argument("name")
    p_crop.add_argument("box", help="left,top,width,height in page pixels")
    p_crop.add_argument("--outlet", default="", help="who published it, shown above the card")
    p_crop.add_argument("--date", default="", help="publication date, shown above the card")
    p_crop.add_argument("--url", default="", help="the page address, for the source log")
    args = parser.parse_args(argv)
    try:
        if args.action == "shot":
            result = shot(args.video_dir, args.url, args.name)
            print(json.dumps(result))
            if result["blocked"]:
                print("warning: this capture looks blocked or empty. Use another outlet or ask for a manual screenshot.")
                return 2
        else:
            print(json.dumps(crop(args.video_dir, args.name, parse_crop(args.box), args.outlet, args.date, args.url),
                             ensure_ascii=False))
        return 0
    except CaptureError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
