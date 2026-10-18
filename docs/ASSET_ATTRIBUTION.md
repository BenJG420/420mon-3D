# Asset attribution

## District atmosphere — v29

- Procedural asphalt, stone, plaster, wood and metal color/roughness/normal maps,
  puddle masks, light pools, reflection cards, rain, splashes and haze are authored
  in this repository. No third-party texture pack or HDR photograph is shipped.
- Rendering uses [Three.js](https://threejs.org/) and its post-processing addons,
  distributed under the [MIT license](https://github.com/mrdoob/three.js/blob/dev/LICENSE).
  The dependency retains its upstream license.
- The owner's [shared graphics reference](https://photos.app.goo.gl/EjPtD2afQq3hnZ4x5)
  was viewed as an art-direction reference. Its photo/video is not bundled or
  claimed as an asset licensed for redistribution.
- Existing original 420mon sprites and project-authored monster/clothing meshes
  remain unchanged in this package; see [MONSTER_MODELS.md](MONSTER_MODELS.md).

## Rigged humans — v30 / v31 / v32

- **Microsoft Rocketbox Avatar Library**, Microsoft and the Rocketbox original
  avatar team (Markus Wojcik); maintained by Mar Gonzalez-Franco and contributors.
- Source: https://github.com/microsoft/Microsoft-Rocketbox/tree/0943055db6ec570bcef9f2c8b41c9e5467c808f9
- Assets: `Assets/Avatars/Adults/Male_Adult_01` and `Female_Adult_01`, FBX export,
  body/head/opacity color textures; corresponding `m_` / `f_` idle_breathe_01,
  walk_neutral and run_neutral FBX clips in `Assets/Animations`.
- **MIT**, Copyright (c) 2020 Microsoft. The library changed to MIT in December
  2020; older announcements about research-only use do not describe this pinned
  revision. Redistribution, modification and commercial game use are permitted
  provided the copyright and permission notice accompany substantial copies.
- Full upstream notice is shipped at `public/game/characters/LICENSE.txt`,
  including the deployed asset directory. Upstream license:
  https://github.com/microsoft/Microsoft-Rocketbox/blob/0943055db6ec570bcef9f2c8b41c9e5467c808f9/LICENSE.md
- Conversion: Blender 4.3.2, original rig/UVs retained, textures downsampled to
  1024 pixels, absolute local bone orientations transferred into each avatar rest basis,
  root movement removed so gameplay controls remain authoritative. v32 corrects
  the clip FBXs’ individual rest bases (copying delta quaternions alone left
  arms spread); the default GLTF node pose also matches the first Idle sample. Three clips
  named Idle, Walk and Run. Wardrobe tint/roughness regions follow skin weights;
  head accessories and body proportions are project adaptations.
- `public/game/characters/sources.json` records every input path/hash and the
  exact distributed GLB hashes. `scripts/convert-rocketbox.py` records conversion.
  No Adobe/Mixamo asset or animation is redistributed.

### v33 animation runtime correction

The same Microsoft MIT models/clips are retained unchanged. Explicit limb-chain
and clip/bone binding checks cover both bodies and NPC clones. Only joint
quaternions animate; avatar bind translations and editor scaling remain intact.
Walk and Run share a normalized stride phase and continuous weights, preserving
foot/knee phase when sprint starts or ends. No additional third-party assets.

## Monster surface pass — v39

- Deterministic PBR normal/roughness tiles and organic/wet/oxidized-metal
  presets are authored procedurally in `src/game/monster-surface.ts`. No
  downloaded texture pack, HDR photo or new externally licensed art is bundled.
- Continuous surfaces reuse the retained original 2D first-pose colors,
  silhouette/depth records and source hashes; original sprite files are intact.
  48 existing authored sculptures remain; 372 surfaces remain reconstructions.
- Three.js `MarchingCubes` and `RoomEnvironment`/PMREM addons use the existing
  Three.js MIT dependency/license above. Viewer reflection resources are owned
  by the temporary studio and released on close.

## Individual monster meshes — v40

- Hawkerfox, Kiefhound, Puffwraith, Blazetail, Rootroach and Crackveil geometry
  is authored in `src/game/monster-sculpts-d.ts` from the owner's retained
  original first-frame sprites. Source sprite/hash references are preserved
  in `monster-authored.ts`; full original sheets remain untouched.
- No external mesh/texture pack is introduced. The existing project PBR tiles
  and Three.js MIT rendering dependency are reused. Coverage: 54 authored
  sculptures, 366 smooth reconstructions; next work starts at Dex #55.

## Individual monster meshes — v41

- Portwolf, Fogbank, Dockclaw, Flaskwyrm, Velourfox and Rustmaw geometry is
  authored in `src/game/monster-sculpts-e.ts` using the owner's retained
  original first-pose sprites. `monster-authored.ts` keeps original source
  sprite/hash references; full original sheets remain untouched.
- No external model/texture pack is added. Existing PBR tiles, Three.js MIT
  dependency and cache remain. Coverage: 60 authored / 360 reconstructions;
  next work starts at Dex #61.


## Individual monster meshes — v42

- Harzback, Lampjell, Curbowl, Tarslug, Plugeel and Lidtoad geometry is authored
  in `src/game/monster-sculpts-f.ts` and `monster-sculpts-f-aquatic.ts` from
  the owner's retained original first-pose sprites. Original source hashes
  remain registered in `monster-authored.ts`; complete sheets stay intact.
- No external model or texture pack is introduced. Existing project PBR tiles,
  Three.js MIT dependency and bounded geometry cache are reused. Coverage:
  66 authored / 354 smooth reconstructions; next work starts at Dex #67.


## Individual monster meshes — v43

- Spilleye, Gongling, Maskwisp, Lipkrait, Magtick and Valvekoi geometry is
  authored in `src/game/monster-sculpts-g.ts` and `monster-sculpts-g-creatures.ts`
  from the owner's retained original first-pose sprites. Original source/hash
  references stay in `monster-authored.ts`; full original sheets remain intact.
- No external mesh/texture pack is introduced. Curves and revolved profiles use
  the existing Three.js MIT dependency; project PBR tiles and bounded cache
  remain. Coverage: 72 authored / 348 reconstructions; next work is Dex #73.


## Individual monster meshes — v44

- Pricecrow, Grafface, Pitmaw, Pothead, Rackfan and Matchimp geometry is authored
  in `src/game/monster-sculpts-h.ts` and `monster-sculpts-h-objects.ts` from
  the owner's retained original first-pose sprites. Original sprite/hash
  references remain registered; complete source sheets are unchanged.
- No external model/texture/font pack is added. Existing project Sculpt/PBR
  helpers, bounded cache and Three.js MIT dependency are retained. Coverage:
  78 authored / 342 reconstructions; next work begins at Dex #79.
