# Original-world test build v19

This is an integrated continuation of 420mon-3D. The original private 2D game
BenJG420/420mon remains the specification. The visual reference supplied by the
owner guides the elevated diorama camera, warm interior lamps, cool shadows,
weathered floors and detailed furnishings.

The Pages workflow retains the audited v18 release at `/420mon-3D/` and builds
this source at `/420mon-3D/test/`. A workflow success must be checked before
describing the test URL as published. Browser storage belongs to the origin, so
both paths use the compatible `420mon-progress-v1` save. The new loader preserves
legacy fields and monsters, backs up the previous save and can import an existing
`420mon_save_v1` without modifying that original slot. Cross-origin original
2D saves must be transferred by the player; browsers cannot read another
origin's localStorage.

## What is implemented

- All 22 original map definitions, coordinates and routes drive the active 3D
  scene. Kapsel contains the original bed, six pots, six growboxes, starter case,
  aquarium, terminal and doors. Rajko's cellar has the original NPCs, desk,
  speakers, wall furniture and a return door. Other districts use their original
  geometry, paths, obstacles and objects rather than detached circles of boxes.
- Source-based collisions, safe saved-position migration, local minimap,
  keyboard/touch interaction, original quest/level door gates and intentional
  manhole bypasses. Only the current map is rendered; map-owned resources are
  disposed on travel while reusable plant resources survive.
- Original three starter choices at level five, starter seed reward, Bolt's
  Junk-Chip dialogue and gate quest, Rajko/Can introductions, 24 original quest
  definitions in the menu. The bed heals living partners only and advances Grow
  by the original 1,800 conceptual seconds.
- Original Grow seeds, tiers, fertilizer speed/yield/XP multipliers, 12 slots and
  unlock prices, 33%/66% phases, box yield, seed return, original harvest rewards,
  saved progress and 72-hour offline cap. Instanced 3D leaves/buds visibly grow.
  The Grow merchant supplies seeds, fertilizer and expansions at original prices.
  Shops open from physical merchants, not a universal menu tab.
- Optional three-tap watering rhythm game. Its saved best score and water effect
  are cosmetic; original growth times and yields remain intact.
- Shared persistent state fixes stale battle partner references. Healing skips
  0-HP partners; full-team captures enter the box; species records are deduplicated.
  Encounters use original habitat weights and level ranges. Original fixed wild
  spots and legendary time windows are used where supplied by the map.
- All 420 Dex entries have local original sheets, including ten restored
  legendary PNGs. One pose is shown in portraits. World monsters currently use
  the authentic original pose as a billboard; these are not finished individual
  3D creature meshes. See ASSET_ATTRIBUTION.md for source hashes.

## How to try it

1. Start in Kapsel. Walk toward the case and press E or the on-screen interaction
   button to select Budling, Glitchbitch or Neonpunx.
2. Use Grow or approach a pot. Plant an owned seed and optionally play the
   watering game. Close the panel to watch the plant in the room.
3. Use the bed to advance plants by 30 minutes. Return to a ready pot to harvest.
4. Use the left door to enter Rajko's cellar; the right door leads to the original
   Gasse. The town map also contains home shortcuts for this test build.
5. Talk to Bolt twice with a Junk-Chip to clear his original gate quest. Higher
   districts still require their original levels; manholes remain a side route.
6. Reload to verify team HP, plants, inventory, care score and position persist.

## Validation and remaining work

`npm test` runs real TypeScript modules through Node's test runner. The initial
v19 suite has 32 tests covering 420 assets, restored source hashes, battle save
references, defeated HP, capture overflow, legacy/original save migration, Grow
rules, offline progress, all original map coordinates/68 transitions and world
interaction/resource ownership. `npm run build` performs TypeScript and Vite
production checks. CI runs both commands.

This is a testable feature package, not the completed 2D-to-3D port. The full
original battle engine (four move choices, all status/IV/evolution rules), all
quest/NPC actions, trainer systems, achievements, clothing effects, fishing,
radio, story economics and individual 3D monster models still need deliberate
integration. Quest definitions and scene objects alone do not imply those
mechanics are complete. Physical Android performance and native 4K verification
remain device tests; desktop Chromium and touch emulation do not replace them.
