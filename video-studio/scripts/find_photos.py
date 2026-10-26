"""Find and download free-licence photos from Wikimedia Commons.

Usage (from the project folder):

    # 1. search: prints a short numbered list (size, licence, title)
    .venv/bin/python scripts/find_photos.py videos/<name> search "Bangladesh quota protest 2024"

    # 2. download the ones you want by number, giving each a short file name
    .venv/bin/python scripts/find_photos.py videos/<name> get 1:bd_crowd 4:bd_placard

    # or download a file whose exact Commons title you already know
    .venv/bin/python scripts/find_photos.py videos/<name> title "Gotagogama.jpg" gotagogama

    # or the lead picture of a Wikipedia article (good for portraits)
    .venv/bin/python scripts/find_photos.py videos/<name> wiki "Sheikh Hasina" hasina

Downloads go to videos/<name>/assets/ at up to 2560 pixels wide. Each one is
recorded in research/sources.json with its author, licence and page, and the
script prints the credit line to use in the scene.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

COMMONS = "https://commons.wikimedia.org/w/api.php"
WIKIPEDIA = "https://en.wikipedia.org/w/api.php"
# Wikimedia throttles requests whose User-Agent does not describe the tool
HEADERS = {"User-Agent": "VideoStudioBot/1.0 (https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia; local video project) python-requests/2"}
MIN_WIDTH = 1600
FREE = ("cc", "public domain", "godl", "pd", "no restrictions", "ogl")


class PhotoError(RuntimeError):
    pass


def clean(value: str) -> str:
    """Strip HTML from a Commons metadata value."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", value or "")).strip()


def is_free(licence: str) -> bool:
    return any(key in licence.lower() for key in FREE)


def credit_line(author: str, licence: str) -> str:
    author = author[:60] or "Unknown author"
    return f"Photo: {author} / Wikimedia Commons · {licence}"


def parse_picks(picks: list[str]) -> list[tuple[int, str]]:
    """'3:crowd' -> (3, 'crowd')."""
    out = []
    for pick in picks:
        number, _, name = pick.partition(":")
        if not number.isdigit() or not re.fullmatch(r"[a-z0-9_]+", name):
            raise PhotoError(f"'{pick}' should look like 3:short_name (small letters, digits, underscore)")
        out.append((int(number), name))
    return out


def api(url: str, **params) -> dict:
    import requests

    response = requests.get(url, headers=HEADERS, params={"format": "json", "action": "query", **params}, timeout=40)
    response.raise_for_status()
    return response.json()


def describe(page: dict) -> dict:
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    return {"title": page["title"].removeprefix("File:"), "width": info["width"], "height": info["height"],
            "licence": clean(meta.get("LicenseShortName", {}).get("value", "")),
            "author": clean(meta.get("Artist", {}).get("value", "")),
            "date": clean(meta.get("DateTimeOriginal", {}).get("value", ""))[:20],
            "description": clean(meta.get("ImageDescription", {}).get("value", ""))[:160],
            "page": info.get("descriptionurl", ""), "url": info.get("thumburl") or info["url"]}


def search(query: str, limit: int = 20) -> list[dict]:
    data = api(COMMONS, generator="search", gsrsearch=f"{query} filetype:bitmap", gsrnamespace=6, gsrlimit=limit,
               prop="imageinfo", iiprop="size|extmetadata|url", iiurlwidth=2560)
    pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    found = [describe(p) for p in pages if "imageinfo" in p]
    return [f for f in found if f["width"] >= MIN_WIDTH and is_free(f["licence"])]


def by_title(title: str) -> dict:
    data = api(COMMONS, titles=f"File:{title}", prop="imageinfo", iiprop="size|extmetadata|url", iiurlwidth=2560)
    page = next(iter(data["query"]["pages"].values()))
    if "imageinfo" not in page:
        raise PhotoError(f"'{title}' is not on Wikimedia Commons (it may be a non-free file on Wikipedia only)")
    found = describe(page)
    if not is_free(found["licence"]):
        raise PhotoError(f"'{title}' has licence '{found['licence']}', which is not a free licence")
    return found


def wiki_lead(article: str) -> dict:
    data = api(WIKIPEDIA, titles=article, prop="pageimages", piprop="name", redirects=1)
    page = next(iter(data["query"]["pages"].values()))
    if "pageimage" not in page:
        raise PhotoError(f"the Wikipedia article '{article}' has no lead picture")
    return by_title(page["pageimage"].replace("_", " "))


def download(photo: dict, name: str, video_dir: Path) -> dict:
    import requests

    ext = ".png" if photo["title"].lower().endswith(".png") else ".jpg"
    target = video_dir / "assets" / f"{name}{ext}"
    target.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(4):
        response = requests.get(photo["url"], headers=HEADERS, timeout=120)
        if response.status_code != 429:
            break
        # Wikimedia asks fast downloaders to slow down; wait and try again
        time.sleep(min(int(response.headers.get("Retry-After", 0) or 0) or 20 * (attempt + 1), 90))
    response.raise_for_status()
    target.write_bytes(response.content)
    time.sleep(2)  # stay polite between downloads
    entry = {"file": f"assets/{name}{ext}", "title": photo["title"], "page": photo["page"], "author": photo["author"][:80],
             "licence": photo["licence"], "date": photo["date"], "description": photo["description"],
             "credit": credit_line(photo["author"], photo["licence"])}
    sources_path = video_dir / "research" / "sources.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8")) if sources_path.exists() else {}
    photos = [p for p in sources.get("photos", []) if p.get("file") != entry["file"]]
    sources["photos"] = photos + [entry]
    sources_path.parent.mkdir(parents=True, exist_ok=True)
    sources_path.write_text(json.dumps(sources, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return entry


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Find and download free-licence photos from Wikimedia Commons.")
    parser.add_argument("video_dir", type=Path)
    parser.add_argument("action", choices=["search", "get", "title", "wiki"])
    parser.add_argument("args", nargs="+")
    opts = parser.parse_args(argv)
    cache = opts.video_dir / "research" / ".last_search.json"
    try:
        if opts.action == "search":
            found = search(" ".join(opts.args))
            cache.parent.mkdir(parents=True, exist_ok=True)
            cache.write_text(json.dumps(found, ensure_ascii=False), encoding="utf-8")
            if not found:
                print(f"no free photos at {MIN_WIDTH}px or wider; try other words, or use an article screenshot")
            for i, f in enumerate(found, 1):
                print(f"{i:2d} | {f['width']}x{f['height']} | {f['licence']} | {f['date'][:10]} | {f['title'][:90]}")
            return 0
        if opts.action == "get":
            if not cache.exists():
                raise PhotoError("run a search first")
            found = json.loads(cache.read_text(encoding="utf-8"))
            for number, name in parse_picks(opts.args):
                if not 1 <= number <= len(found):
                    raise PhotoError(f"no result number {number} in the last search")
                entry = download(found[number - 1], name, opts.video_dir)
                print(f"{entry['file']} | {entry['credit']} | {entry['description'][:80]}")
            return 0
        if len(opts.args) != 2:
            raise PhotoError(f"'{opts.action}' needs two values: the {'file title' if opts.action == 'title' else 'article name'} and a short file name")
        photo = by_title(opts.args[0]) if opts.action == "title" else wiki_lead(opts.args[0])
        (_, name), = parse_picks([f"1:{opts.args[1]}"])
        entry = download(photo, name, opts.video_dir)
        print(f"{entry['file']} | {photo['width']}x{photo['height']} | {entry['credit']} | {entry['description'][:80]}")
        return 0
    except PhotoError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # network problems and the like
        print(f"error: could not reach Wikimedia ({exc})", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
