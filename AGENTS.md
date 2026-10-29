# AGENTS.md — Instructions for Codex working on 420mon-3D

## Latest validation rule — Ben, 2026-10-22
Ben tests gameplay in the published test build. Run only the build and directly
affected tests; no new broad suites, combination sweeps or browser smoke loops.
Then publish/merge each package. Existing CI may run automatically. This rule
supersedes older three-block/full-suite/browser requirements below. For the GUI,
place Grow care and planting action buttons directly below pot/growbox selection
so touch players do not scroll between selection and action.

Read [CODEX_HANDOFF.md](CODEX_HANDOFF.md) before editing. The user explicitly wants a **complete, working 3D remake of their existing original 2D game**, retaining its authentic mechanics, monster assets, districts and quest content. **Do not start a replacement game from scratch, invent placeholder monsters, or report a work-in-progress as complete.**

## Repositories
- 3D target: `BenJG420/420mon-3D` (this repository, public); Three.js / TypeScript / Vite; `npm run build` runs `tsc -b && vite build`.
- Original 2D source of truth: `BenJG420/420mon` (private; ask for Codex GitHub access if needed). Read the 2D files directly, especially `src/game/data/`, `src/game/runtime.ts`, `src/game/state.ts`, `src/game/battle.ts` and the 2D `public/game/maps/` / `public/game/sprites/` assets.
- Play/test: https://benjg420.github.io/420mon-3D/ ; GitHub Actions build and Pages deploy workflows.

## Non-negotiable behavior
1. Prefer integrated, end-to-end working feature packages instead of one-line demos, plans, or repeated user questions. Implement, test, and present concrete changes.
2. Preserve existing player saves; provide migration and regression checks. Check `420mon-progress-v1` and original `420mon_save_v1`.
3. Latest user rule (2026-10-14): **0 HP means defeated and not catchable; resting on a physical bed/mattress revives owned team monsters to full HP**. Healing items and ordinary team healing still skip 0 HP. Preserve this deliberate mattress exception. The Grow minigame now awards shorter growth and extra harvest per best score, capped at 30% per planting.
4. Copy and use original 2D monster artwork as the design reference for eventual distinct 3D models, and render **one frame only** in Dex portraits; original sprites often contain 2×2 frames. Preserve full source spritesheets. Avoid external references to the private repo at runtime.
5. Shop should be triggered by **talking to its NPC in the world**, never freely from an ordinary menu tab.
6. 10 original districts must become meaningful, enterable/explorable 3D spaces matching 2D geography, encounters and progression; not just metadata cards or disconnected placeholder boxes.
7. Keep desktop and Android/touch controls working. Use responsive UI and good performance; don't force excessive resolution on phones.
8. Run `npm install && npm run build` and relevant tests, inspect errors, and verify GitHub Actions/Pages deployments after merges. Latest user preference (2026-10-14): limit technical verification to at most three focused passes per development batch; the user will investigate further gameplay bugs. This is not a limit on Grow minigame attempts. Don't claim deployment or mobile browser verification without evidence.
9. Do not overwrite or delete the original 2D repository. Preserve source attribution and be mindful that its content is private; access requires authorization.
10. Report what is implemented, tested, missing, and deployed factually in German. Do not repeatedly ask what to work on next when the goal is clear.

## Current authorization — Ben, 2026-10-28

Ben explicitly approved all remaining monster sculptures. Resume at Dex #97,
package by package with one PR each, detailed original-sprite anatomy, clean
silhouettes and high-resolution PBR. The prior “Monster erst nach Freigabe” and
post-v75 waiting instructions below are historical and superseded. PR #83 / v75
is merged/live. Only build + directly affected tests; no heavy browser runs.
Player/NPC assets and all mechanics/saves remain unchanged. Current package:
v80 / PR #88, Dex #121–126 merged/live.
Coverage: 126 authored / 294 reconstructions; build + 7 directly affected tests
passed in one local round. Next package v81: Dex #127–132. Continue from the next unfinished Dex after each completed PR.

## Previous priority order (user instruction, 2026-10-22)

PR #54 / v47 (Dex #91–96) is merged and published. Coverage is 96 authored /
324 smooth reconstructions. **Monster erst nach Freigabe**: remaining sculpts
from Dex #97 require Ben’s explicit approval, even after all other work.
Follow `docs/TEST_BUILD.md`, one finished package/PR, maximum three check rounds:
1. DONE — PR #55 / v48, merged and published: freely combinable clothing slots: Oberteil, Jacke, Hose, Schuhe, Kopf,
   Accessoires, including Latzhose + Lederjacke. Correct replacement without
   duplicate/missing parts or clipping, fitted to existing rigs and persisted.
   All 2,304 combinations tested within the three-check budget; final live
   desktop/touch preview and persistence checks passed. See TEST_BUILD.md.
2. DONE — PR #56 / v49, merged and published: Bulk buying/selling: quantity slider or +/-/Max/input, live total, one full
   transaction confirmation, desktop/touch and tests. Own PR.
3. DONE — PR #57 / v50: Hide the starter case after choosing, including reload and old saves; test.
   Own PR.
4. DONE — PR #58 / v51, merged and published: GUI reference: inspect and reproduce menu/inventory/HUD from the running
   2D game https://coral-nova-gem-pearl.grok.me/ (guest start, no email). Record
   actual observations in TEST_BUILD.md; desktop/touch clarity and less overlap.
5. DONE — PR #59 / v52 Performance/FPS: decoration instancing, shadow budget and optional device A/B capture (actual FPS measurement by Ben pending); instancing, LOD, culling, textures,
   shaders and a shadow budget as appropriate.
6. DONE — Buff HUD mini-fix, PR #60 / v53 (Ben 2026-10-23): symbols and remaining time in the same collapsible Cash/time/level HUD. District implementation packages delivered: Gasse A v54 DONE (PR #61), Grow-Hinterhöfe/Moss v55 DONE (PR #62), Kabelkeller v58 DONE (PR #65), Markt/Silk/Static v59 DONE (PR #66), Kino v64 DONE (PR #72); Neonkai v65 DONE (PR #73), Kanal v66 DONE (PR #74), Aschegang v67 DONE (PR #75), Abfluss v68 DONE (PR #76), Chemiegasse v69 DONE (PR #77), Ring v70 DONE (PR #78), Labyrinth v71 DONE (PR #79), Nischen v72 DONE (PR #80), Schrotttor v73 DONE (PR #81), NEXT concrete feedback fixes and Ben’s device FPS/visual checks; one PR each: preserve 2D structure, independent
   roof materials (tile/metal/felt), edges/gutters, facades/windows/doors/signs,
   neon/trash/cables/puddles/props/vegetation/PBR, lighting/fog/post-processing.
   Shared street props v56 (PR #63) and wall art/flickering existing lamps v57
   (PR #64) are merged/published across districts, including Gasse A.
   Do not change player/NPC assets or behavior in district packages.
7. Ben 2026-10-24, BEFORE further districts, own PR each: DONE Eddi inventory-style bulk shop PR #67 / v60 and smoking animation PR #68 / v61; DONE botanical cannabis growth v62 PR #69; DONE brighter Kabelkeller v63 PR #70. Kino v64 PR #72 and Neonkai v65 PR #73 merged/live; publication tracked in TEST_BUILD. Kanal v66 DONE (PR #74), Aschegang v67 DONE (PR #75), Abfluss v68 DONE (PR #76), Chemiegasse v69 DONE (PR #77), Ring v70 DONE (PR #78), Labyrinth v71 DONE (PR #79), Nischen v72 DONE (PR #80), Schrotttor v73 DONE (PR #81), NEXT concrete feedback fixes and Ben’s device FPS/visual checks. Eddi purchase hotfix PR #71 is merged/live. Only build + directly affected tests.
8. DONE — PR #82, merged/live; Ben 2026-10-27, BEFORE monsters: Aquarium/Fische v74 — detailed smooth 3D fish, natural swimming, physical glass/refraction, caustics, planted gravel/rocks/wood and bubbles; preserve original catches/bonuses and tank footprint. Build + directly affected tests only, own PR; Ben checks appearance/FPS.
9. DONE — PR #83 merged/live; Ben 2026-10-27 — Aquarium-Modal v75: immersive close view for “Dein Becken”, larger detailed fish, depth, planting/lighting/caustics. Only build + directly affected tests. After publication wait for Ben’s feedback; no further package until then. Physical room tank/player/NPCs retained.
10. Monster erst nach Freigabe: only resume sculpts at #97 after Ben explicitly
   approves. First finish fixes and all district graphics/details. Retain the 96 existing models
   and shared PBR/cache. Do not claim 324 reconstructions are authored HD anatomy.
No new game or restarted old packages. Preserve gameplay/saves and licensed rigs.
Ko-fi/payment stays skipped. Read only relevant files; no routine questions;
record assumptions in one handoff line and continue. Existing fixes PR #40–53
are complete; detailed publication history is in TEST_BUILD.md.

## Previous graphics order (superseded by 2026-10-17 fix list)

Ko-fi and payment-server work is **skipped by user request**, not blocked or next.
Preserve the existing game mechanics; change them only if rendering requires it.
Continue graphics packages in order, one PR each: (1) district lighting, materials,
weather and post-processing matching the README/reference, (2) realistic rigged
player with freely licensed model/animations and docs/ASSET_ATTRIBUTION.md,
(3) equivalent NPC upgrade, (4) individual original-sprite monster models.
Keep the same read-only-file discipline, no questions, handoff assumptions, and
maximum three focused validation passes. Older order below is historical.

## Historical package order (2026-10-15)
Read only AGENTS.md, CODEX_HANDOFF.md and docs/TEST_BUILD.md before choosing the
next package; then read only its required files. No full repository scan or
questions. Record unclear choices in one handoff line. Keep existing systems.
Deliver one playable package per PR and update Remaining work in TEST_BUILD.md:
quest/NPC actions, fishing (42 fish/seed bait/timing wheel/failed cast seed),
trainer battles, Can's 420 achievements/rewards, visible clothing, radio/story
economy, original-sprite-based 3D monster models. Verification is limited to
three focused checks: test+build, short smoke, deployment. After three failures,
record the problem and continue instead of repeated troubleshooting loops.

## Current unfinished integration
PR #25 merged v18 on 2026-10-13. The v19 checkout completes local artwork for all
420 runtime species, shared saves and Grow, and renders original MAPS in 3D.
Do not re-merge the old v17/v18 branches or rely on historical sprite counts.
Read [docs/TEST_BUILD.md](docs/TEST_BUILD.md) for current implementation, test
channel, validation and explicit remaining gaps. The deployment workflow keeps
the audited v18 release at the root and serves this evolving port under `/test/`.

Full details, file map, acceptance criteria and project context: [CODEX_HANDOFF.md](CODEX_HANDOFF.md).
