"""Cut the lab reel into one clip per style and build labelled reference sheets.

Usage: .venv/bin/python videos/_lab-animations/make_catalog.py
Reads hf/renders/lab.mp4, writes output/clips/*.mp4 and output/*.jpg.
"""
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
REEL = HERE / "hf/renders/lab.mp4"
OUT = HERE / "output"
FONT = HERE.parents[1] / "library/fonts/Inter.ttf"

# code, name, use it for, frame time in the reel (each sample is 5 s long, in this order)
SAMPLES = [
    ("C1", "Flat vector", "General explainer, aam aadmi stories", 3.6),
    ("C2", "Stick figure", "Light / funny, quick concepts", 8.4),
    ("C3", "Pencil sketch", "Serious, history, thoughtful questions", 13.6),
    ("C4", "Whiteboard doodle", "Step-by-step explaining", 18.3),
    ("C5", "Silhouette", "Protests, crowds, sensitive topics (no faces)", 23.5),
    ("C6", "Paper cut-out", "Stories, soft topics, stop-motion feel", 28.5),
    ("C7", "Chibi cartoon", "Reactions, light moments, Shorts", 32.6),
    ("C8", "Comic halftone", "Drama, conflict, big moments", 36.4),
    ("C9", "Gold line", "Matches the channel's current look", 43.8),
    ("C10", "Person in the story", "A named person acting the script", 46.3),
    ("O1", "Objects: coins", "Money, budget, savings", 54.0),
    ("O2", "Process + chart", "Economy, industry, growth", 58.8),
    ("O3", "Process steps", "Elections, how-it-works sequences", 63.8),
    ("P1", "2.5D parallax", "Openings, mood, transitions", 68.5),
    ("K", "Character cast", "K1-K8 ready-made characters", 72.6),
    ("ALL", "Every style side by side", "Same person in C1-C9", 78.5),
]


def frame(t: float) -> Image.Image:
    png = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", str(REEL), "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True, check=True).stdout
    from io import BytesIO
    return Image.open(BytesIO(png)).convert("RGB")


def sheet(items, cols, tile_w, path, title):
    tile_h, strip = tile_w * 9 // 16, 96
    rows = -(-len(items) // cols)
    big, small, head = ImageFont.truetype(str(FONT), 30), ImageFont.truetype(str(FONT), 22), ImageFont.truetype(str(FONT), 44)
    img = Image.new("RGB", (cols * tile_w + (cols + 1) * 24, 110 + rows * (tile_h + strip + 24)), "#14161c")
    d = ImageDraw.Draw(img)
    d.text((24, 32), title, font=head, fill="#f3efe6")
    for i, (code, name, use, t) in enumerate(items):
        x, y = 24 + (i % cols) * (tile_w + 24), 110 + (i // cols) * (tile_h + strip + 24)
        img.paste(frame(t).resize((tile_w, tile_h), Image.LANCZOS), (x, y))
        d.rectangle([x, y + tile_h, x + tile_w, y + tile_h + strip], fill="#1f222b")
        d.text((x + 16, y + tile_h + 12), code, font=big, fill="#e8b34b")
        d.text((x + 16 + d.textlength(code, font=big) + 14, y + tile_h + 12), name, font=big, fill="#f3efe6")
        d.text((x + 16, y + tile_h + 56), use, font=small, fill="#a9a59c")
    img.save(path, quality=90)
    return path


def main():
    clips = OUT / "clips"
    clips.mkdir(parents=True, exist_ok=True)
    for i, (code, name, _, _) in enumerate(SAMPLES):
        slug = name.lower().replace(":", "").replace("+", "").replace(" ", "-").replace("--", "-")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(i * 5), "-t", "5", "-i", str(REEL), "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-an", str(clips / f"{i + 1:02d}_{code}_{slug}.mp4")], check=True)
    print(sheet(SAMPLES[:14], 4, 640, OUT / "style_catalog.jpg", "Animation styles: point to a code (C1, O2, P1...)"))
    frame(SAMPLES[14][3]).save(OUT / "characters_K1-K8.jpg", quality=92)
    frame(SAMPLES[15][3]).save(OUT / "styles_side_by_side.jpg", quality=92)
    print(OUT / "characters_K1-K8.jpg", OUT / "styles_side_by_side.jpg", clips, sep="\n")


if __name__ == "__main__":
    main()
