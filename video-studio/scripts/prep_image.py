"""Prepare a picture the user supplied (portrait, animal, cartoon) for use in a video.

Usage (from the project folder):

    # crop (left,top,right,bottom in source pixels), upscale 2x, save to the video's assets/
    .venv/bin/python scripts/prep_image.py videos/<name> library/custom-source/nijjar.webp nijjar --crop 100,0,1000,668 --scale 2

    # cut a cartoon figure out of a plain light background (transparent PNG)
    .venv/bin/python scripts/prep_image.py videos/<name> library/custom-source/1.webp gunman --cutout

Always: look at the picture first (a contact sheet is enough), crop off watermarks and logos
(then credit the outlet in the scene's `credit`), crop blank side bars, and crop to the face
when the identity is shown with a circle. Small pictures (under 700 px) look soft at 1080p;
--scale 2 or 3 (Lanczos) keeps them clean. The picture is logged in research/sources.json with
licence "supplied by editor (to confirm)"; ask the user for the real source before publishing.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def cutout(im: Image.Image) -> Image.Image:
    """Transparent PNG from a figure on a flat light background (flood fill from the corner)."""
    a = np.array(im.convert("RGB")).astype(int)
    free = np.abs(a - a[5, 5]).sum(2) <= 40
    reach = np.zeros_like(free)
    reach[0, 0] = True
    while True:
        n = reach.copy()
        n[1:] |= reach[:-1]; n[:-1] |= reach[1:]; n[:, 1:] |= reach[:, :-1]; n[:, :-1] |= reach[:, 1:]
        n &= free
        if (n == reach).all():
            break
        reach = n
    alpha = Image.fromarray(((~reach) * 255).astype("uint8")).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    return out.crop(out.getbbox())


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video_dir", type=Path)
    ap.add_argument("source", type=Path)
    ap.add_argument("name", help="file name to save as (no extension)")
    ap.add_argument("--crop", help="left,top,right,bottom")
    ap.add_argument("--scale", type=int, default=1)
    ap.add_argument("--cutout", action="store_true")
    ap.add_argument("--note", default="supplied by editor", help="what it is / where it came from")
    args = ap.parse_args()
    im = Image.open(args.source).convert("RGB")
    if args.crop:
        im = im.crop(tuple(int(v) for v in args.crop.split(",")))
    if args.scale > 1:
        im = im.resize((im.width * args.scale, im.height * args.scale), Image.LANCZOS)
    if args.cutout:
        im, ext = cutout(im), "png"
        im.save(args.video_dir / "assets" / f"{args.name}.png")
    else:
        ext = "jpg"
        im.save(args.video_dir / "assets" / f"{args.name}.jpg", quality=94)
    path = args.video_dir / "research" / "sources.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data.setdefault("photos", []).append({"file": f"assets/{args.name}.{ext}", "title": args.note, "author": "unknown",
                                          "licence": "supplied by editor (to confirm)", "credit": "supplied by editor (source to be confirmed)"})
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"assets/{args.name}.{ext} {im.size}")


if __name__ == "__main__":
    main()
