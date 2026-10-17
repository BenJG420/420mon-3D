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
