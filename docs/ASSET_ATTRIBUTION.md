# Asset attribution

## Aquarium modal detail — v75

- Additional close-view fish body/fin/eye geometry, opercula, lateral lines and procedural scale relief are project-authored extensions in `src/game/aquarium-fish.ts`. Layered rear rocks, foreground stones/plants, branched aquatic leaves and soft animated light shafts extend `src/game/aquarium-habitat.ts`. No external model, photograph or texture pack added. The original fish identities/colors and all player/NPC/monster assets remain unchanged.

## Aquarium and fish — v74

- Fish bodies, fins, gills, eyes and species-specific anatomy, planted habitat, gravel, rocks, driftwood, glass, bubbles and procedural surface/lighting details are project-authored in `src/game/aquarium-fish.ts` and `src/game/aquarium-habitat.ts`. Original fish IDs, names and color palettes from `src/game/data/fish.ts` are retained. No external model or texture pack is added.
- Three.js (MIT), including its procedural `RoomEnvironment`, provides the reflection environment. Existing 2D catalogue art, player/NPC assets and monster licensing remain unchanged.

## Kabelkeller detail — v58

- Service racks/junction boxes, cooling fans, patch leads, electrical trench,
  wall conduits and terminal fittings are project-authored geometry in
  `src/game/cable-details.ts`, on the original 2D footprints. Existing procedural
  PBR metal-cap/stone textures, wall-art atlas and street props are reused.
- No external asset or font added; original player/NPC/monster assets and their
  licenses are unchanged.

## Wall art and lamp effects — v57

- Graffiti/tags, stickers and torn-paper posters are project-authored Canvas
  drawings in `src/game/wall-art.ts`, combined in one local 1024×512 atlas.
  No external artwork, photo, font or texture pack is redistributed. Canvas
  uses installed generic fonts; text and paint details are drawn at runtime.
- `lamp-flicker.ts` animates existing fixtures; no new external asset. Original
  player/NPC models, animation and monster artwork are unchanged.

## Shared street props — v56

- Empty bottles/cans, open cartons, bicycles and wire shopping carts are
  project-authored geometries in `src/game/street-prop-models.ts`, spatially
  instanced by `src/game/street-details.ts`. Existing procedural PBR materials
  are reused. No external model, texture or new license dependency is added.
- Player/NPC rigs, animation and the original monster assets are unchanged.

## Grow-Hinterhöfe / Moss — v55

- Shed cladding, roof flashing, courtyard masonry, pipes, vegetation and Moss’
  wall shelving are project-authored geometry in `src/game/yard-details.ts`.
  `world.ts` places them only on the original district/room and reuses the v54
  locally generated roof PBR maps, neon surrounds and batched refuse geometry.
- No external models, textures or fonts added. Player/NPC rigs and their licenses
  remain unchanged; original gameplay/map data remain the source of truth.

## Gasse A detail — v54

- Roof tile, standing-seam metal and roofing-felt PBR maps are deterministic
  project-authored textures in `src/game/world-surfaces.ts`, generated locally.
  Facade trim, gutters, cables, signs and street debris are project-authored
  geometry in `src/game/alley-details.ts` and `world.ts` on the original 2D map.
- No downloaded photo, texture pack, external model or new font is included.
  Original character/NPC rigs, animations and existing licenses are retained.

## GUI fonts — v51

- IBM Plex Sans, IBM Corp., and Press Start 2P, CodeMan38: SIL Open Font License 1.1.
- Retrieved 2026-10-22 from the Google Fonts repository:
  https://github.com/google/fonts/tree/main/ofl/ibmplexsans and
  https://github.com/google/fonts/tree/main/ofl/pressstart2p .
- Original variable IBM Plex Sans and regular Press Start 2P font data are bundled
  as losslessly converted WOFF files in `public/fonts/`; full upstream licenses
  are included as `IBMPlexSans-OFL.txt` and `PressStart2P-OFL.txt` there.
- No remote font request at runtime. The running 2D game was used as a visual
  reference; its screenshots are audit material, not redistributed game assets.

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

## Independent wardrobe slots — v48

- The same pinned Microsoft Rocketbox MIT GLBs, embedded textures, skeletons
  and animation clips are retained. The distributed files and their hashes do
  not change; the upstream notice remains in `public/game/characters/LICENSE.txt`.
- `src/game/wardrobe-rig.ts` adapts the player body at runtime: subdivided original
  skin triangles use exclusive clothing material regions, preserving source UVs,
  normals and bone influences. Project-authored headwear and collar use that same
  skeleton. NPCs retain their previous appearance path.
- Garment designs, palettes, garment catalogue and fallback meshes are authored
  in this repository. No additional model, texture pack or external license is added.

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


## Individual monster meshes — v45

- Fatcandle, Fizzcap, Stoolpad, Keywisp, Boothdrape and Anvilant geometry is
  authored in `src/game/monster-sculpts-i-props.ts` and
  `monster-sculpts-i-creatures.ts`, registered by `monster-sculpts-i.ts`, using
  the owner's retained original first-pose sprites. Full sheets are unchanged;
  source sprite/hash references remain in `monster-authored.ts`.
- No external mesh/texture pack is added. Existing project Sculpt/PBR helpers,
  bounded cache and Three.js MIT dependency remain. Coverage: 84 authored /
  336 reconstructions; next work begins at Dex #85.


## Individual monster meshes — v46

- Bubstack, Hangscale, Curbcone, Neonarrow, Clipin and Heatsink geometry is
  authored in `src/game/monster-sculpts-j-props.ts` and
  `monster-sculpts-j-creatures.ts`, registered by `monster-sculpts-j.ts`, using
  the owner's retained original first-pose sprites. Full sheets are unchanged;
  source sprite/hash references remain in `monster-authored.ts`.
- No external mesh/texture pack is added. Existing project Sculpt/PBR helpers,
  bounded cache and Three.js MIT dependency remain. Coverage: 90 authored /
  330 reconstructions; next work begins at Dex #91.


## Individual monster meshes — v47

- Ashpan, Ypipe, Glovepair, Taperoll, Deadend and Spotlamp geometry is authored
  in `src/game/monster-sculpts-k-props.ts` and `monster-sculpts-k-creatures.ts`,
  registered by `monster-sculpts-k.ts`, using the owner's retained original
  first-pose sprites. Full sheets are unchanged; source sprite/hash references
  remain in `monster-authored.ts`.
- No external mesh/texture pack is added. Existing project Sculpt/PBR helpers,
  bounded cache and Three.js MIT dependency remain. Coverage: 96 authored /
  324 reconstructions; next work begins at Dex #97.
