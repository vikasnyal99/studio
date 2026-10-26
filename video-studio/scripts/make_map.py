"""Turn Natural Earth country outlines into SVG paths for map animations.

Usage:

    .venv/bin/python scripts/make_map.py                       # South Asia (already made)
    .venv/bin/python scripts/make_map.py --name middle_east --west 25 --east 65 --south 10 --north 43

Reads library/maps/ne_10m_admin_0_countries_ind.geojson (Natural Earth, public
domain; the "_ind" file draws borders as India depicts them) and writes
library/maps/<name>.json: one SVG path per country in a fixed pixel space,
plus the projection numbers so scenes can place cities by longitude/latitude.
A video picks its map with "map": "<name>" at the top of scenes.json.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SOURCE = PROJECT_ROOT / "library" / "maps" / "ne_10m_admin_0_countries_ind.geojson"
WIDTH = 4000  # pixel width the region is drawn at
MIN_STEP = 0.9  # drop points closer than this many pixels to keep files small


def mercator_y(lat: float) -> float:
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


class Region:
    """A rectangle of the world (degrees) and its Mercator projection into pixels."""

    def __init__(self, west: float, east: float, south: float, north: float):
        if not (west < east and south < north and -80 <= south and north <= 80):
            raise ValueError("region must have west < east, south < north, and latitudes within -80..80")
        self.west, self.east, self.south, self.north = west, east, south, north
        self.scale = WIDTH / math.radians(east - west)
        self.height = round((mercator_y(north) - mercator_y(south)) * self.scale)

    def project(self, lon: float, lat: float) -> tuple[float, float]:
        x = math.radians(lon - self.west) * self.scale
        y = (mercator_y(self.north) - mercator_y(lat)) * self.scale
        return x, y

    def touches(self, ring: list) -> bool:
        return any(self.west - 4 <= lon <= self.east + 4 and self.south - 4 <= lat <= self.north + 4
                   for lon, lat, *_ in ring)


def ring_path(ring: list, region: Region) -> str:
    """One closed outline as an SVG path, or '' if it lies outside the region."""
    if not region.touches(ring):
        return ""
    points, last = [], None
    for lon, lat, *_ in ring:
        x, y = region.project(lon, max(min(lat, 84), -84))
        if last is None or abs(x - last[0]) + abs(y - last[1]) >= MIN_STEP:
            points.append(f"{x:.1f},{y:.1f}")
            last = (x, y)
    if len(points) < 3:
        return ""
    return "M" + "L".join(points) + "Z"


def build(region: Region) -> dict:
    with SOURCE.open(encoding="utf-8") as fh:
        features = json.load(fh)["features"]
    countries = {}
    for feature in features:
        props, geometry = feature["properties"], feature["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        path = "".join(ring_path(ring, region) for polygon in polygons for ring in polygon)
        if not path:
            continue
        code = props.get("ADM0_A3") or props.get("ISO_A3")
        lon, lat = props.get("LABEL_X"), props.get("LABEL_Y")
        label = [round(v, 1) for v in region.project(lon, lat)] if lon is not None and lat is not None else None
        countries[code] = {"name": props.get("NAME", code), "d": path, "label": label}
    return {
        "source": "Natural Earth 10m admin 0 countries, India point of view (public domain)",
        "width": WIDTH, "height": region.height,
        "projection": {"west": region.west, "north": region.north, "scale": round(region.scale, 4)},
        "countries": countries,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Make a map of one region for map scenes.")
    parser.add_argument("--name", default="south_asia", help="file name for the map (library/maps/<name>.json)")
    parser.add_argument("--west", type=float, default=58.0, help="left edge, degrees of longitude")
    parser.add_argument("--east", type=float, default=112.0, help="right edge, degrees of longitude")
    parser.add_argument("--south", type=float, default=-6.0, help="bottom edge, degrees of latitude")
    parser.add_argument("--north", type=float, default=40.0, help="top edge, degrees of latitude")
    args = parser.parse_args(argv)
    if not SOURCE.exists():
        print(f"map data not found: {SOURCE}", file=sys.stderr)
        return 1
    try:
        region = Region(args.west, args.east, args.south, args.north)
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 1
    data = build(region)
    output = SOURCE.parent / f"{args.name}.json"
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {output} ({len(data['countries'])} countries, {data['width']}x{data['height']}, "
          f"{output.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
