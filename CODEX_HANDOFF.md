# 420mon → 420mon-3D — Codex handoff (2026-10-12)

> Latest user update (2026-10-14): mattresses revive defeated team partners, and Grow care gives real time/yield bonuses. These override the historical 0-HP and cosmetic-only rules below.
>
> Historical handoff below. v18 was merged through PR #25 on 2026-10-13. The
> current v19 implementation and remaining work are documented in
> [docs/TEST_BUILD.md](docs/TEST_BUILD.md). Its runtime Dex has 420 local original
> sheets; its world uses the original MAPS. Old branch/count statements below
> are preserved as history and must not drive new merge decisions.

## User's goal (must not reinterpret)
German original: **"eine komplette Kopie nur auf 3d und 4k mit Verbesserungen nicht alles von anfang"** and **"Bau jetzt soweit alles fertig das wir eine richtige Lösung haben und nicht 100 mal das der nächste Punkt der ist"**.
The existing 2D game is the specification. Reuse all authentic data and gameplay; port the game systems to a polished **3D, 4K-capable, touch-friendly** experience for Android and desktop. Do not rebuild from scratch, substitute fake monsters, or claim completion while important features are missing. The user wants larger integrated implementations, functioning deploys, and less repetitive planning.

## Repository and delivery links
- Original source (private, read access required): https://github.com/BenJG420/420mon
- 3D target (public): https://github.com/BenJG420/420mon-3D
- GitHub Pages: https://benjg420.github.io/420mon-3D/
- CI + Deploy: https://github.com/BenJG420/420mon-3D/actions
- 3D main checked 2026-10-12: `1144f154da2dcb87b9a1393d60b9d889acfa9137`; both latest main build and Pages deploy **success** at that commit (2026-10-08); not the latest WIP assets.
- WIP v18: `fix/dex-single-frame-v18` at `42e9174a6e8c6b47f995cba5fcfae71c166737d7` (as checked 2026-10-12). Its changes are not in `main`. **Re-check remote heads before working.**
- Previous WIP: `fix/local-original-sprites-v17`; superseded for most purposes by v18.
- No open PRs at last check.

## Technical state of 3D repository
- Stack: Three.js ^0.180, TypeScript ^5.9, Vite ^7; `npm install`, `npm run build` (= `tsc -b && vite build`).
- Entry and city + input: `src/main.ts`; third-person movement, 3D block/neon city, collision, character customisation, mobile controls.
- Wild encounters, minimal capture/combat, EXP + current save: `src/game/monsters.ts`.
- Main game menu, searchable Dex, team/box transfers, items, shop screen, district selection: `src/game/systems.ts`.
- 10 themed 3D placeholder district spaces, NPC "Eddi" and shop proximity: `src/game/world.ts`. Current regions are approximate detached geometric environments, not faithful translations of the original maps. The user complained maps/districts were missing or visually unchanged.
- CSS: `src/styles.css`.
- Canonical 2D data previously copied: `src/game/data/dex.ts`, `roster.ts`, `types.ts`, `progress.ts`, `moves.ts`, `items.ts`, `zones.ts`, `achievements.ts`, `legend.ts`. Some is only partially wired to gameplay.
- Original 2D major code: `src/game/runtime.ts` (~153K chars), `src/game/state.ts` (~33K chars), `src/game/battle.ts` (~13K chars), `src/game/data/dex.ts` (~229K chars), and other files. Port functionality deliberately; copying the React runtime straight into Three.js without integration will not work.
- Current 3D save key: `420mon-progress-v1`; original 2D save: `420mon_save_v1`; assess migration and maintain save compatibility.

## Important live bug: Dex art / sprite sheets
Recent screenshot showed four sprites together in each Dex thumbnail (2×2 sprite sheet). It also showed intermittent empty icons. These are *not a user setting*.

1. The original 2D repo is **private**. Linking `https://raw.githubusercontent.com/BenJG420/420mon/main/public/game/sprites/...png` in the public 3D site returns inaccessible resources to unauthenticated players. Do not use this at runtime.
2. The original has 410 explicitly declared sprite paths in `src/game/data/dex.ts`, with actual PNG assets in original `public/game/sprites/`. 420 Dex entries include some auto-generated entries that may require actual sprite creation or a documented fallback.
3. In current `main`, only 226/410 of the canonical 2D sprites exist locally in `public/game/sprites/` (227 files including duplicate/extra). In `fix/dex-single-frame-v18`, 362/410 are present (363 files). **48 canonical sprites still missing in v18.** Recount after checkout; other commits may have changed this.
4. The WIP branch v18 updates `src/game/systems.ts` and `src/styles.css` to display only the **top-left 128×128** section of each 256×256 sheet inside a 64×64 thumbnail using a clipped container and a 200%-sized child image. Test that this actually works on Android and does not distort 4K/UI scaling.
5. WIP graphics were copied as `.svg` files containing an embedded base64 source PNG in `<image>` (plus three `.png` files: Budling, Neonpunx, Puffpuff). Although the pixels are original, this is a stopgap. Prefer authentic PNGs and a clear asset pipeline without unexpectedly inflating build size; preserve the complete 2D spritesheets for 3D-modelling reference.
6. `src/game/systems.ts` on main chooses `.png` for `neonpunx`/`puffpuff`, `.svg` for others, and on failures displays an outline diamond instead of removing the image. In v18 `budling` is also a PNG (fix extension mapping).
7. For species with no actual art, show a clear placeholder and mark it missing; do not display a sheet with four sprites or pretend a generated generic model is the true 2D artwork.

## User game rules and expected systems
- Level cap 420, original XP formula, 14 elemental types/effectiveness and original attack/move catalog.
- User rule: **0 HP means truly defeated/dead and cannot be caught or brought back by healing**. A later wearable protective ring is allowed to prevent fatal damage (survive with 1 HP). Current 3D `TEAM HEILEN` and item healing violate this; correct behavior consistently without corrupting preexisting saves.
- Team capacity 6, storage box (with safe full-team capture behavior), original 420-species Dex, battles, captures, status/IV/evolutions, inventory, quest system, achievements, economy, NPC dialogs, shops, growth/strains, fishing/minigames, other original mechanics.
- Shop should **only open by talking to a physical shop NPC** (named Eddi in current 3D code), not via globally accessible ordinary menu; Dex may stay in main game menu.
- True in-world map + all original districts: `alley`, `yard`, `cable`, `ash`, `drain`, `chem`, `ring`, `labyrinth`, `nische`, `scrap` and other original hub/market/sewer as present in original code. Use original 2D `public/game/maps/` resources and `src/game/data/zones.ts` to plan recognizable topology/landmarks, transitions and spawn points, not merely ten teleports into repetitive colored buildings. Enforce original story gating and appropriate encounters instead of all areas being unrestricted.
- Distinctive 3D monsters should **follow their individual original 2D visual identity**; model them from source art, not random generic spheres or repeated placeholders. Create an extensible model registry and conversion workflow.
- Support both Android touch and desktop keyboard/mouse, stable camera/collision, appropriate frame rates, good UI, responsive/full-HD/4K-capable rendering. Do not force native 4K on mobile at cost of playability.

## Recommended implementation sequence (execute, don't stop at reporting the plan)
**P0 — Finish and ship Dex display with tests.** Integrate WIP v18 back onto latest main, import the remaining 48 original asset sheets from the user's private 2D repo, fix PNG/SVG paths, crop one frame, test at least several species and fallback cases. Run local build then PR/merge and verify Pages deploy. Keep source art as model references.
**P1 — Faithful world and NPCs.** Inspect original 2D maps + zone layout; implement functioning in-world navigation/minimap, enterable 3D versions of all main districts, encounters and district transitions; shop via Eddi proximity and dialogue, no global shop.
**P2 — Feature parity.** Reuse original data and logic for battles (four moves/status/types/IV), evolutions, healing/death semantics, party/box/quests/achievements/inventory/economy and other 2D gameplay. Provide reliable save migration and tests.
**P3 — Authentic models and polish.** Build distinct 3D-model pipeline with source-sheet links/metadata, memorable design for each species; optimize device graphics settings for mobile/desktop/4K; HUD, sounds, controls, camera and gameplay tests.

These are milestones of a *single complete 3D port*, not an invitation to repeatedly ask the user for the next small step. Commit substantial working deliverables with tests. If time/resources mean incomplete, state accurate scope and preserve a working build.

## Acceptance checklist
- [ ] `npm install && npm run build` succeeds, and GitHub Actions/Pages success is verified for the merged commit.
- [ ] Dex shows **one** recognisable original 2D monster pose per species; images do not disappear; missing art is deliberately tracked.
- [ ] All original source 2D sprite files used by Dex accessible from **public 3D build**, no private-repo image URLs.
- [ ] 10 districts plus relevant hub areas visible, enterable, distinctive; appropriate original encounters and NPCs.
- [ ] Shop interaction requires NPC; inventory/gold and team/box updates persist after reload.
- [ ] Rules: original 420 level progression, actual moves and stats/statuses/evolutions; 0-HP no capture and no accidental revival.
- [ ] Character movement/collision, camera and mobile joystick all work; no overlay blocking touch controls.
- [ ] Regression checks on fresh save and an older 3D save; no silent wipe or unreachable party.
- [ ] Do not describe partial systems or dummy art as 'complete game'. Clearly say what is genuinely ported.

## Prior conversation links / relevant merged PRs
- PR #15: copied original moves, levels and element effectiveness (foundation).
- PR #16: copied original 420 Dex and first integrated encounters.
- PR #17: copied original items, achievements and districts; added box, shop UI, quests summary.
- PR #18/#19: CI missing lockfile and missing `legend.ts` dependencies fixed.
- PR #20: initial 3D themed districts/NPC and original sprite URL Dex attempt.
- PR #21: made map shortcut visible on HUD.
- Subsequent main commit `1144f154...` bundled *partial* local monster assets (226/410), with Build/Pages success. V18 is separate.

## Coding and communication requirements
1. Inspect repositories and Git history before making claims; do not guess file paths or missing resources.
2. Prefer actual code changes, tests and builds over small unverified code snippets.
3. Preserve functional existing user features and avoid risky sweeping rewrites unless required by robust integration.
4. Deliver whole files/working features and practical testing links. Inform the user in German; short, substantive progress reports only.
5. Keep private credentials and user data out of public 3D repo. Access to the private original repo must be explicitly configured in Codex Cloud/desktop.
