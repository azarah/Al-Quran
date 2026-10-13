#!/usr/bin/env python3
"""Build embedded star catalog from HYG + constellation stick figures for star_field.js.

First-time data (not committed — large CSV):
  curl.exe -sL -o _hyg_sample.csv \\
    https://raw.githubusercontent.com/astronexus/HYG-Database/master/hyg/CURRENT/hygdata_v41.csv
  curl.exe -sL -o _const_lines.json \\
    https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json
Then: python build_star_catalog.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HYG = ROOT / "_hyg_sample.csv"
LINES = ROOT / "_const_lines.json"
OUT_STARS = ROOT / "star_catalog_data.js"
OUT_META = ROOT / "constellation_lines_data.js"

MAG_LIMIT = 6.15


def main():
    stars = []
    with HYG.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("id") == "0":
                continue
            try:
                mag = float(row["mag"])
            except (TypeError, ValueError):
                continue
            if mag > MAG_LIMIT:
                continue
            try:
                ra = float(row["rarad"])
                dec = float(row["decrad"])
            except (TypeError, ValueError):
                continue
            if not (-1.5708 <= dec <= 1.5708):
                continue
            proper = (row.get("proper") or "").strip()
            entry = [round(ra, 6), round(dec, 6), round(mag, 2)]
            if proper and len(proper) < 32:
                entry.append(proper)
            stars.append(entry)

    stars.sort(key=lambda s: s[2])

    header = """/* AUTO-GENERATED — do not edit by hand. Run: python build_star_catalog.py */
/* Stars: HYG Database v4.1 (CC BY-SA 4.0) — Astronomy Nexus / Hipparcos, Yale Bright Star, Gliese */
/* https://github.com/astronexus/HYG-Database */
(function (global) {
  global.STAR_CATALOG_HYG = """
    footer = """
})(typeof window !== "undefined" ? window : globalThis);
"""
    payload = {
        "version": "HYG 4.1",
        "license": "CC BY-SA 4.0",
        "magLimit": MAG_LIMIT,
        "count": len(stars),
        "stars": stars,
    }
    OUT_STARS.write_text(
        header + json.dumps(payload, separators=(",", ":")) + ";" + footer,
        encoding="utf-8",
    )
    print(f"Wrote {len(stars)} stars -> {OUT_STARS.name} ({OUT_STARS.stat().st_size // 1024} KB)")

    with LINES.open(encoding="utf-8") as f:
        geo = json.load(f)

    segments = []
    for feat in geo.get("features", []):
        geom = feat.get("geometry") or {}
        for line in geom.get("coordinates", []):
            if len(line) < 2:
                continue
            seg = []
            for pt in line:
                ra_deg = float(pt[0]) % 360.0
                dec_deg = float(pt[1])
                ra_rad = ra_deg * 3.141592653589793 / 180.0
                dec_rad = dec_deg * 3.141592653589793 / 180.0
                seg.append([round(ra_rad, 5), round(dec_rad, 5)])
            segments.append(seg)

    line_header = """/* AUTO-GENERATED — constellation stick figures (d3-celestial / IAU patterns) */
/* https://github.com/ofrohn/d3-celestial — traditional line art, RA/Dec degrees from catalog geometry */
(function (global) {
  global.CONSTELLATION_LINES = """
    line_footer = """
})(typeof window !== "undefined" ? window : globalThis);
"""
    line_payload = {"segments": segments, "segmentCount": len(segments)}
    OUT_META.write_text(
        line_header + json.dumps(line_payload, separators=(",", ":")) + ";" + line_footer,
        encoding="utf-8",
    )
    print(f"Wrote {len(segments)} line chains -> {OUT_META.name} ({OUT_META.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
