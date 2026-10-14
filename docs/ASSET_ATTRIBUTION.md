# Original 420mon artwork

The monster artwork is reused from the user's original `BenJG420/420mon` 2D
game, with the repository owner's authorization for this 3D upgrade. The
original game remains the source for species names, designs and gameplay data.
No third-party artwork or generated replacement monster designs are included.

All 420 assembled Dex species now resolve to a local original spritesheet in
`public/game/sprites/`. These sheets contain four 128 × 128 poses in a 256 × 256
image. The Dex and the 3D encounter billboards show the top-left pose only, and
the complete sheets remain available as references for future species models.
Encounter billboards are 2D artwork placed in the 3D world, not finished 3D
monster meshes.

Existing `.svg` files are wrappers containing the unchanged source PNG image.
The existing Budling, Neonpunx and Puffpuff PNGs remain in place. The ten missing
legendary sheets were copied byte for byte from `public/game/sprites/` in the
original repository on 2026-10-13. Their original Git blob hashes are recorded
below and checked by `tests/assets.test.mjs`.

| Original source path | Git blob SHA-1 |
| --- | --- |
| `public/game/sprites/kerboss.png` | `62c666daef714bc5ec5bbdde1dd47dd7928f815f` |
| `public/game/sprites/kronkush.png` | `5bfadcc0ef93e11b9832f232798fe69e53f04870` |
| `public/game/sprites/rootkaiser.png` | `62604531fa473fcc31679ea185b6f97569d58aa3` |
| `public/game/sprites/glutarch.png` | `3dbd6503bf9a27563a0b588651a953756512cbaa` |
| `public/game/sprites/rohrlethe.png` | `07ffbfc5a001a0daca301e93a0e644d1c32bbce5` |
| `public/game/sprites/vialith.png` | `01fe2ec423790c88663c78627746818f4d6e563c` |
| `public/game/sprites/cagekaiser.png` | `8862f286e7797e2eb0577391792077ed90334945` |
| `public/game/sprites/noxarch.png` | `035fdcc4c68dbe2da02c58d9849f65a328c8aa23` |
| `public/game/sprites/velouryx.png` | `6fef39c3b51c234c72bb6729741244620720a6be` |
| `public/game/sprites/slagodon.png` | `d2739e01c6078a041e2189454c18fdc184e8b7c1` |

Runtime image requests use only this repository's local build assets. The
private original repository is never required by a player's browser.
