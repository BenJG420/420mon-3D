# Current authored coverage — v46

90 authored species / 330 smooth reconstructions. `monster-sculpts-j.ts` registers
`monster-sculpts-j-props.ts` and `monster-sculpts-j-creatures.ts`: Dex #85–90
Bubstack, Hangscale, Curbcone, Neonarrow, Clipin and Heatsink. Stacked bubbles,
hanging scales, traffic cone, neon arrow, wooden peg and finned heat sink use
the retained original first poses. Original sources/hashes, previous 84
geometries, toolkit, renderer and shared PBR/UV/cache remain intact. Next:
original Dex #91. Hidden surfaces conservatively continue the visible forms.

# Historical authored coverage — v45

84 authored species / 336 smooth reconstructions. `monster-sculpts-i.ts` registers
`monster-sculpts-i-props.ts` and `monster-sculpts-i-creatures.ts`: Dex #79–84
Fatcandle, Fizzcap, Stoolpad, Keywisp, Boothdrape and Anvilant. Wax/drips/flame,
fizzy cap, padded stool, keyhole spirit, folded stage drapery and anvil ant are
individual geometry from retained original first poses. Original sources/hashes,
previous 78 geometries, toolkit, renderer and shared PBR/UV/cache remain intact.
Each stays under 30k triangles. Next: original Dex #85. Hidden surfaces are
conservatively completed; no canonical back views claimed.

# Current authored coverage — v44

78 authored species / 342 smooth reconstructions. `monster-sculpts-h.ts` and
`monster-sculpts-h-objects.ts` add Dex #73–78 Pricecrow, Grafface, Pitmaw,
Pothead, Rackfan and Matchimp from their retained original first poses.
Layered crow feathers/price tag, cracked graffiti block, stone well-mouth,
open sprout pot, deep fan housing/rotor/grille and a stick figure with a flame
head are individual geometry. Toolkit, renderer, prior 72 geometries, source
sheets/hashes and shared PBR/UV/cache stay intact; <30k triangles per sculpture.
Next: original Dex #79. Hidden surfaces are conservatively completed.

# Current authored coverage — v43

72 authored species / 348 smooth reconstructions. `monster-sculpts-g.ts` and
`monster-sculpts-g-creatures.ts` add Dex #67–72 Spilleye, Gongling, Maskwisp,
Lipkrait, Magtick and Valvekoi from their retained original first poses.
A single-eyed dripping spill, spun gong/striker, cracked mask/wisp, coiled snake,
open horseshoe magnet insect and koi/valve wheel are individual geometry.
Two optional Sculpt helpers make smooth closed cords and revolved profiles;
previous methods and all 66 earlier geometries are unchanged. Source hashes,
PBR/UV/cache ownership and <30k triangles remain. Next: original Dex #73.
Hidden surfaces are conservatively completed; no canonical back views claimed.

# Current authored coverage — v42

66 authored species / 354 smooth reconstructions. `monster-sculpts-f.ts` and
`monster-sculpts-f-aquatic.ts` add Dex #61–66 Harzback, Lampjell, Curbowl,
Tarslug, Plugeel and Lidtoad using their original first poses. Resin scales and
roots, a closed jellyfish bell/tendrils, carved owl feathers, tar fissures,
a segmented plug eel and a toad with a radial manhole lid are individual geometry.
Source hashes, shared PBR/UV/cache and the <30k-triangle budget remain.
The previous 60 sculptures and original sheets/data are unchanged. Next: Dex #67.
Hidden surfaces are conservatively completed; no canonical back views claimed.

# Current authored coverage — v41

60 authored species / 360 smooth reconstructions. `monster-sculpts-e.ts` adds
Dex #55–60 Portwolf, Fogbank, Dockclaw, Flaskwyrm, Velourfox and Rustmaw from
their retained original first poses. Source hashes, PBR UVs/materials, preferred
bounded cache path and <30k-triangle budget remain. Previous 54 designs and
original sheets/data are unchanged. Next: original species from Dex #61.
Hidden surfaces are conservatively completed; no canonical back views claimed.

# Current authored coverage — v40

54 authored species / 366 smooth reconstructions. `monster-sculpts-d.ts` adds
Dex #49–54 Hawkerfox, Kiefhound, Puffwraith, Blazetail, Rootroach and Crackveil,
individually built from the retained original first poses. Each retains its
source hash, preferred cache path, PBR UVs/material and <30k-triangle budget.
The previous 48 designs and all source sheets/data are preserved. Next: Dex #55.
Hidden surfaces are conservatively completed, not a claim of canonical 2D backs.

# Current runtime surface pipeline — v39

PR #46 retains the 48 authored designs, with finer curves under 30k triangles.
For the other 372 species, monster-smooth.ts samples the original volume records
into a continuous marching-cubes surface with smooth normals and bilinear source
colors (under 24k triangles). These are still reconstructions, not newly sculpted
anatomies. Runtime kind is smooth-volume; source voxel JSON remains intact for
provenance and compatibility, and buildMonsterGeometry remains the legacy helper.

monster-surface.ts adds UVs, shared normal/roughness maps, organic/wet/metal PBR
variants and smooth shading. The temporary viewer owns/disposes its studio PMREM
reflection. Cache/lease ownership and authentic source hashes remain. Original
sprites and first-frame Dex portraits are unchanged. Next: individually author
species from Dex #49; do not replace this pipeline or claim 420 detailed sculpts.

## Historical asset construction and source provenance

# Source-derived monster models (v28 / v32)

Every one of the 420 runtime species has its own local, colored 3D voxel volume.
The first 48 additionally have individually authored, preferred low-poly meshes
in `src/game/monster-sculpts-a.ts` and `monster-sculpts-b.ts` and `monster-sculpts-c.ts`, built from the same
original references: Budling through Slagjaw in the runtime Dex order. Their
leaf crowns, cables, armor, limbs, jaws, wings and tails are geometry. They merge
into one vertex-colored mesh per species; `monster-authored.ts` records the source
hashes and selects them before the voxel reconstruction. The reconstruction is
retained for all species so a later sculpt never changes the asset pipeline.
The designs come from the retained original monster sprites at original source
revision `010807da77df8468a297adf33eaf1fb5c9a61c8b`. The generated volumes are **procedural volume
reconstructions**, distinct from the 48 individually sculpted meshes. The source silhouette,
holes and colors determine the model; no substitute monster catalogue, random
sphere generator or sprite billboard is used. The unmodified full spritesheets
remain the Dex artwork and the references for future sculpting.

## Rebuild without the private repository

Python 3 and Pillow 12 or later are the only asset-generation dependencies. From the root:

```sh
python scripts/generate-monster-models.py
```

The checked-in `public/game/models/catalogue.json` supplies all 420 species IDs,
names, local sprite filenames and expected SHA-256 hashes. The generator verifies
each retained file before producing its model. For an explicitly changed input
catalogue, use `--catalogue path/to/catalogue.json`; it accepts either an array
with the same entry metadata or a complete previous manifest. It does not fetch
artwork, require a private URL or alter the source images.

Generation is deterministic: no random numbers, timestamps or external services
enter either the geometry or the manifest. The generated model files total
6,654,600 bytes before transfer compression; each species is a separate request.
The largest file is 28,215 bytes. Each volume is bounded to 36 cells on its
longest source-image axis and at most 13 voxel layers in depth. The highest
exposed-face budget in this catalogue is 8,228 triangles.

## Conversion and its limits

1. Decode the local PNG, or the original PNG embedded in its SVG wrapper.
   Preserve the complete 256×256 sheet. Read only its top-left 128×128 pose,
   matching the existing Dex thumbnail.
2. Use the source alpha mask at threshold 96. The retained Budling PNG is the
   sole fully opaque pose: its uniform magenta background is removed with a
   color-distance flood starting at the image boundary. A Budling-only source
   correction additionally removes magenta-matte fringes and enclosed pink gaps:
   `G < 90`, `R > 45`, `B > 30`, `R > 1.15G`, `B > 1.05G`. The actual original
   creature has no pink anatomy. Other monsters retain their source alpha and
   never have interior colors keyed out.
3. Crop to the opaque silhouette's bounding box. Map it to a grid with a maximum
   axis of 36 cells. A cell remains solid at 32% source coverage; empty body/arm
   gaps and object holes remain empty. Its RGB is an actual opaque source pixel
   nearest that cell's mean color, rather than an invented interpolated palette.
4. Compute distance from each occupied cell to its silhouette boundary. A
   symmetric, rounded depth field gives narrow leaves/fingers a thin section and
   wider heads/torso/shells more volume. The integer half-depth is
   `clamp(round(0.9 + distance × 0.92), 1, 7)`. The distance uses an eight-neighbor
   grid with orthogonal cost 1 and diagonal cost √2, starting boundary cells at
   0.5. Thus depth varies across the body instead of extruding one flat card.
5. Store occupied columns and source colors. The runtime builds only exposed
   surfaces, including the bands between unequal neighboring depths; hidden
   internal voxel faces do not become triangles.

A single front pose cannot specify the real rear anatomy. These models retain
the same source-derived color through each depth column, including its back.
They have physical side/back surfaces and respond to camera rotation and scene
lighting, but their rear design is a reconstruction assumption. Thin source
objects such as ladders and trellises remain thin and preserve their holes.
Future individually sculpted meshes can replace registry entries without
changing saves, species IDs, battle rules or Dex artwork.

## Model format and coordinates

`public/game/models/{sprite}.json`:

```json
{
  "version": 1,
  "id": "mon_budling",
  "sourceSprite": "budling",
  "sourceHash": "SHA-256 of the complete local PNG or SVG file",
  "grid": [32, 36],
  "cellSize": 0.04444444,
  "columns": [[0, 0, 1, 0]],
  "palette": [[96, 128, 32]]
}
```

The array values above illustrate the format, not Budling's actual dimensions.
Each column is `[x, y, halfDepth, paletteIndex]`. `x` is left-to-right, and `y`
is bottom-to-top; both are zero-based integers in `grid`. Palette entries are
unmodified RGB bytes in sRGB, from 0 to 255. The renderer converts them to its
working color space for lighting. A palette may contain more than 256 entries.

An occupied column with depth `d` contains voxel centers at integer `z` from
`-(d-1)` through `+(d-1)`. Its outer surfaces are at
`±(d-0.5) × cellSize`. The centered x coordinate is
`(x-(gridWidth-1)/2) × cellSize`; its ground-relative center y is
`(y+0.5) × cellSize`. `cellSize = 1.6 / max(gridWidth, gridHeight)`, rounded to
eight decimal places. The existing monster pivot supplies the scene translation
and scale; these asset coordinates do not modify encounters or collision.

## Manifest and provenance

`catalogue.json` records format version, original revision, reconstruction
algorithm, grid/depth limits and all 420 entries. Each entry includes:

- runtime species ID, name, sprite slug and retained local source filename;
- full-source SHA-256, source frame, opaque crop and background-mask method;
- local model URL, grid, column count, depth range and occupied voxel count;
- exposed-surface triangle budget, file byte count and generated file SHA-256.

The hashes include the original SVG wrapper where applicable and the complete
JSON bytes, including their terminating newline. This lets a future artist or
maintainer trace a volume to its exact original pose without reading the private
repository or mistaking an inferred side view for new canonical artwork.

## Runtime and inspection

Wild creatures, trainer opponents and living battle partners use the existing
`createMonsterArt` / `setMonsterArt` integration. The stable first-child animation
pivot is retained. The original portrait appears only while a model loads or if
its request fails, with an explicit status in the viewer. No battle, capture,
HP/XP, inventory or save schema is replaced.

Only visible species are requested. A shared geometry cache retains active
leases and at most 24 unused species; all instances share their colored model
material. Ground materials belong to each instance. Stale asynchronous loads and
removed monsters release their leases instead of attaching to a different
species. The original-image fallback cache also retains at most 24 unused entries.

Select a captured Dex entry or use `3D ansehen` in a battle. The comparison studio
shows one original pose beside the rotatable model. It supports touch dragging,
arrow keys, zoom, reset and Escape; it is read-only. One temporary viewer renderer
runs at 30 FPS maximum, with limited pixel ratio, and is destroyed on close.
The covered world renderer pauses its GPU drawing while game simulation continues.

Remaining art work is anatomical refinement of the other 396 species and artist
review of inferred side/back details. The generated volumes are playable original
art reconstructions, not a claim that all 420 have hand-authored rear anatomy.

## v32 — original Dex 25–48

Twenty-four additional authored meshes replace the volume presentation for
Coinbat, Dumpsterpup, Harzling, Wiremite, Glutmoth, Rohrling, Fumemoth, Knuckrat,
Shadefox, Lacebat, Slagpup, Foambat, Stallfox, Kerbstomp, Binmaw, Moosback,
Cinderfang, Schlickhound, Tapedog, Racklurk, Knuckbrute, Gratehound, Coinwraith
and Slagjaw. Each was modelled against its unchanged local first-pose sprite.
Coin wings, grates/lids, resin drops, coil shells, pipes, scalloped membranes,
bandages, teeth, rock cracks and moss are geometry, including conservative
authored backs. The new closed membrane helper preserves thin wing silhouettes.

All 420 volume files remain untouched and the same bounded lease cache, world
slots, battle controls, source portraits and comparison viewer are retained.
**48 individual sculptures are preferred; 372 species still use their source-
volume reconstruction.** Continue sculpting at Dex #49, without rebuilding
the asset pipeline or describing the remaining reconstructions as hand sculpts.
