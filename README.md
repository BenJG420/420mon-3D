# 420mon-3D

The existing original-based 420mon game, continued as a 3D port with preserved mechanics and saves. Current work upgrades its visual presentation.

## Vision

Build a fully explorable 3D world with:
- 4K-ready rendering and scalable quality
- third-person player controller
- modular character equipment and clothing
- animated creatures/monsters
- exploration, interaction, quests, inventory and combat
- dynamic weather and day/night
- atmospheric lighting, rain, particles and post-processing
- persistent saves
- a clean data-driven architecture

## Reference

The original `420mon` repository remains untouched and is used only to recover gameplay ideas, data structures and proven systems.

The [owner-supplied visual reference](https://photos.app.goo.gl/EjPtD2afQq3hnZ4x5) is an elevated third-person 3D RPG scene: dense industrial courtyards, wet small paving, dark blue-green buildings, warm-white/amber light pools, cool shadows, ground haze and thin rain. The player and routes remain readable. The reference is viewed for art direction, not bundled as a game asset.

## Development rule

The goal is that the owner mainly has to **run, test and report what feels wrong**. Code, architecture and implementation should be maintained in GitHub in small, testable milestones.

## Current milestone

v29 upgrades district light, wet PBR materials, weather and post-processing.
Existing districts, maps, combat/capture, Grow, fishing, quests, clothing and saves
remain in place. See [graphics pipeline](docs/GRAPHICS.md),
[test build and remaining work](docs/TEST_BUILD.md), and
[asset attribution](docs/ASSET_ATTRIBUTION.md).

The owner's current order is one PR per package:
1. District lighting, materials, weather and post-processing.
2. Realistic freely licensed rigged player with animations.
3. Equivalent NPC upgrade.
4. Individual 3D monsters following the original 2D sprites.

Ko-fi and payment-server work is explicitly skipped.

[Test channel](https://benjg420.github.io/420mon-3D/test/) ·
[Stable release](https://benjg420.github.io/420mon-3D/)
