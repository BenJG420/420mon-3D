#!/usr/bin/env python3
"""Build bounded, source-traceable voxel volumes from the retained 2D artwork.

Needs Python 3 and Pillow. Run from the repository root. An initial catalogue
can be supplied with --catalogue; subsequent runs use the generated manifest.
This tool does not fetch artwork or contact the private original repository.
"""

from __future__ import annotations

import argparse
import base64
from collections import deque
import hashlib
import heapq
import io
import json
import math
from pathlib import Path
import re

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_REVISION = "010807da77df8468a297adf33eaf1fb5c9a61c8b"
GRID_LIMIT = 36
ALPHA_CUTOFF = 96
MAX_HALF_DEPTH = 7


def source_frame(path: Path) -> tuple[Image.Image, bytes]:
    """Keep all original sheets untouched and decode only their first pose."""
    raw = path.read_bytes()
    payload = raw
    if path.suffix == ".svg":
        match = re.search(rb"base64,([^\"\s]+)", raw)
        if match is None:
            raise ValueError(f"No embedded original PNG: {path}")
        payload = base64.b64decode(match.group(1))
    sheet = Image.open(io.BytesIO(payload)).convert("RGBA")
    if sheet.size != (256, 256):
        raise ValueError(f"Unexpected original sheet size {sheet.size}: {path}")
    return sheet.crop((0, 0, 128, 128)), raw


def remove_boundary_background(image: Image.Image, sprite: str) -> tuple[Image.Image, str]:
    """Remove an opaque, uniform frame background, never an interior color.

    Budling's original PNG has a magenta backdrop. The other retained sheets
    already have alpha. Flooding only from the border retains eyes/body holes
    and prevents a 3D rectangular card behind Budling.
    """
    pixels = list(image.get_flattened_data())
    width, height = image.size
    opaque = sum(pixel[3] >= ALPHA_CUTOFF for pixel in pixels)
    if opaque < width * height * 0.95:
        return image, "source-alpha"
    border = set(range(width)) | set(range((height - 1) * width, height * width))
    border.update(y * width for y in range(height))
    border.update(y * width + width - 1 for y in range(height))
    colors = [pixels[index] for index in border]
    background = tuple(sorted(color[c] for color in colors)[len(colors) // 2]
                       for c in range(3))
    matching = sum(sum((color[channel] - background[channel]) ** 2 for channel in range(3)) <= 48 ** 2
                   for color in colors)
    if matching < len(border) * 0.65:
        raise ValueError("Opaque frame has no safely removable uniform background")

    def close_to_background(index: int) -> bool:
        return sum((pixels[index][channel] - background[channel]) ** 2 for channel in range(3)) <= 48 ** 2

    pending = deque(index for index in border if close_to_background(index))
    removed = set(pending)
    while pending:
        index = pending.popleft()
        x, y = index % width, index // width
        for xx, yy in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            neighbor = yy * width + xx
            if (0 <= xx < width and 0 <= yy < height and neighbor not in removed
                    and close_to_background(neighbor)):
                removed.add(neighbor)
                pending.append(neighbor)
    if not width * height * 0.1 < len(removed) < width * height * 0.95:
        raise ValueError("Uniform background removal did not leave a credible source silhouette")
    # The source Budling has no magenta anatomy. Its opaque pink matte also
    # contaminates antialiased edges and enclosed gaps, beyond the border flood.
    # This named source correction does not key colors from any other species.
    if sprite == "budling":
        removed.update(index for index, (red, green, blue, _) in enumerate(pixels)
                       if green < 90 and red > 45 and blue > 30
                       and red > green * 1.15 and blue > green * 1.05)
    for index in removed:
        pixels[index] = (0, 0, 0, 0)
    result = Image.new("RGBA", image.size)
    result.putdata(pixels)
    return result, "boundary-chroma-flood+budling-fringe" if sprite == "budling" else "boundary-chroma-flood"


def sample_columns(image: Image.Image) -> tuple[int, int, dict[tuple[int, int], tuple[int, int, int]], list[int]]:
    """Conserve the alpha silhouette, holes and source RGB on a bounded grid."""
    source = image.load()
    foreground = [(x, y) for y in range(image.height) for x in range(image.width)
                  if source[x, y][3] >= ALPHA_CUTOFF]
    if len(foreground) < 20:
        raise ValueError("Source first pose has no usable silhouette")
    left, top = min(x for x, _ in foreground), min(y for _, y in foreground)
    right, bottom = max(x for x, _ in foreground) + 1, max(y for _, y in foreground) + 1
    width, height = right - left, bottom - top
    scale = GRID_LIMIT / max(width, height)
    grid_width, grid_height = max(1, round(width * scale)), max(1, round(height * scale))
    colors = {}
    for yy in range(grid_height):
        y0 = top + yy * height / grid_height
        y1 = top + (yy + 1) * height / grid_height
        for xx in range(grid_width):
            x0 = left + xx * width / grid_width
            x1 = left + (xx + 1) * width / grid_width
            samples = [source[x, y] for y in range(math.floor(y0), math.ceil(y1))
                       for x in range(math.floor(x0), math.ceil(x1))]
            solid = [pixel for pixel in samples if pixel[3] >= ALPHA_CUTOFF]
            if len(solid) < len(samples) * 0.32:
                continue
            # A real source pixel nearest the opaque-cell mean avoids inventing
            # RGB colors through interpolation and keeps compression deterministic.
            mean = [sum(pixel[c] for pixel in solid) / len(solid) for c in range(3)]
            representative = min(solid, key=lambda pixel: sum((pixel[c] - mean[c]) ** 2 for c in range(3)))
            colors[xx, grid_height - 1 - yy] = representative[:3]
    return grid_width, grid_height, colors, [left, top, right, bottom]


def rounded_depths(colors: dict[tuple[int, int], tuple[int, int, int]]) -> dict[tuple[int, int], int]:
    """Round each limb/body using its distance to the actual silhouette.

    This produces solid nonuniform XYZ volumes rather than textured planes or
    constant-depth extrusions. Narrow fingers/leaves stay thin; broad torsos,
    heads, coils and shells gain a rounded cross section.
    """
    distances: dict[tuple[int, int], float] = {}
    queue = []
    neighbors = [(dx, dy, math.hypot(dx, dy)) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]
    for x, y in colors:
        if any((x + dx, y + dy) not in colors for dx, dy, _ in neighbors):
            distances[x, y] = 0.5
            heapq.heappush(queue, (0.5, x, y))
    while queue:
        distance, x, y = heapq.heappop(queue)
        if distance != distances[x, y]:
            continue
        for dx, dy, cost in neighbors:
            position = x + dx, y + dy
            next_distance = distance + cost
            if position in colors and next_distance < distances.get(position, float("inf")):
                distances[position] = next_distance
                heapq.heappush(queue, (next_distance, *position))
    return {position: min(MAX_HALF_DEPTH, max(1, round(0.9 + distance * 0.92)))
            for position, distance in distances.items()}


def face_budget(depths: dict[tuple[int, int], int]) -> int:
    # Front/back plus four exposed neighbor bands. A depth step exposes two
    # strips; a missing neighbor exposes one full side. Each quad is 2 triangles.
    quads = len(depths) * 2
    for (x, y), depth in depths.items():
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            adjacent = depths.get((x + dx, y + dy), 0)
            quads += 1 if adjacent == 0 else 2 if adjacent < depth else 0
    return quads * 2


def build_model(entry: dict, output: Path) -> dict:
    frame, raw = source_frame(ROOT / entry["spriteFile"])
    source_hash = hashlib.sha256(raw).hexdigest()
    if entry.get("sourceHash") != source_hash:
        raise ValueError(f"Source hash mismatch: {entry['spriteFile']}")
    frame, background = remove_boundary_background(frame, entry["sprite"])
    width, height, colors, bounds = sample_columns(frame)
    depths = rounded_depths(colors)
    palette: list[list[int]] = []
    palette_index: dict[tuple[int, int, int], int] = {}
    columns = []
    for (x, y), color in sorted(colors.items(), key=lambda column: (column[0][1], column[0][0])):
        if color not in palette_index:
            palette_index[color] = len(palette)
            palette.append(list(color))
        columns.append([x, y, depths[x, y], palette_index[color]])
    model = {
        "version": 1, "id": entry["id"], "sourceSprite": entry["sprite"],
        "sourceHash": source_hash, "grid": [width, height],
        "cellSize": round(1.6 / max(width, height), 8), "columns": columns, "palette": palette,
    }
    encoded = json.dumps(model, separators=(",", ":"), ensure_ascii=False).encode() + b"\n"
    (output / (entry["sprite"] + ".json")).write_bytes(encoded)
    return {
        "id": entry["id"], "name": entry["name"], "sprite": entry["sprite"],
        "spriteFile": entry["spriteFile"], "sourceHash": source_hash,
        "url": "game/models/" + entry["sprite"] + ".json",
        "sourceFrame": [0, 0, 128, 128], "sourceBounds": bounds,
        "background": background, "grid": [width, height], "columns": len(columns),
        "depthRange": [min(depths.values()), max(depths.values())],
        "voxels": sum(depth * 2 - 1 for depth in depths.values()),
        "triangleBudget": face_budget(depths), "bytes": len(encoded),
        "modelHash": hashlib.sha256(encoded).hexdigest(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalogue", type=Path, default=ROOT / "public/game/models/catalogue.json")
    parser.add_argument("--output", type=Path, default=ROOT / "public/game/models")
    args = parser.parse_args()
    supplied = json.loads(args.catalogue.read_text())
    entries = supplied if isinstance(supplied, list) else supplied["entries"]
    if len(entries) != 420 or len({entry["id"] for entry in entries}) != 420:
        raise ValueError("Expected all 420 distinct runtime species")
    if len({entry["sprite"] for entry in entries}) != 420:
        raise ValueError("Each runtime species must keep its own source model")
    args.output.mkdir(parents=True, exist_ok=True)
    generated = [build_model(entry, args.output) for entry in entries]
    manifest = {
        "version": 1, "sourceRevision": SOURCE_REVISION,
        "reconstruction": "voxel-volume", "algorithm": "source-alpha-distance-rounded-v1",
        "gridLimit": GRID_LIMIT, "maxHalfDepth": MAX_HALF_DEPTH,
        "sourcePose": "top-left-128x128", "entries": generated,
    }
    (args.output / "catalogue.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"Generated {len(generated)} unique source-derived volumes; "
          f"{sum(entry['bytes'] for entry in generated):,} JSON bytes; "
          f"max {max(entry['triangleBudget'] for entry in generated):,} triangles per model")


if __name__ == "__main__":
    main()
