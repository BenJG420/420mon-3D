# AGENTS.md — Instructions for Codex working on 420mon-3D

Read [CODEX_HANDOFF.md](CODEX_HANDOFF.md) before editing. The user explicitly wants a **complete, working 3D remake of their existing original 2D game**, retaining its authentic mechanics, monster assets, districts and quest content. **Do not start a replacement game from scratch, invent placeholder monsters, or report a work-in-progress as complete.**

## Repositories
- 3D target: `BenJG420/420mon-3D` (this repository, public); Three.js / TypeScript / Vite; `npm run build` runs `tsc -b && vite build`.
- Original 2D source of truth: `BenJG420/420mon` (private; ask for Codex GitHub access if needed). Read the 2D files directly, especially `src/game/data/`, `src/game/runtime.ts`, `src/game/state.ts`, `src/game/battle.ts` and the 2D `public/game/maps/` / `public/game/sprites/` assets.
- Play/test: https://benjg420.github.io/420mon-3D/ ; GitHub Actions build and Pages deploy workflows.

## Non-negotiable behavior
1. Prefer integrated, end-to-end working feature packages instead of one-line demos, plans, or repeated user questions. Implement, test, and present concrete changes.
2. Preserve existing player saves; provide migration and regression checks. Check `420mon-progress-v1` and original `420mon_save_v1`.
3. Gameplay requirement specified by the user: **a monster with 0 HP is dead/defeated and cannot be captured or resurrected by healing**. A future wearable ring may prevent fatal damage by leaving 1 HP. Fix currently inconsistent "heal-all" behavior rather than silently violating this.
4. Copy and use original 2D monster artwork as the design reference for eventual distinct 3D models, and render **one frame only** in Dex portraits; original sprites often contain 2×2 frames. Preserve full source spritesheets. Avoid external references to the private repo at runtime.
5. Shop should be triggered by **talking to its NPC in the world**, never freely from an ordinary menu tab.
6. 10 original districts must become meaningful, enterable/explorable 3D spaces matching 2D geography, encounters and progression; not just metadata cards or disconnected placeholder boxes.
7. Keep desktop and Android/touch controls working. Use responsive UI and good performance; don't force excessive resolution on phones.
8. Run `npm install && npm run build` and relevant tests, inspect errors, and verify GitHub Actions/Pages deployments after merges. Don't claim deployment or mobile browser verification without evidence.
9. Do not overwrite or delete the original 2D repository. Preserve source attribution and be mindful that its content is private; access requires authorization.
10. Report what is implemented, tested, missing, and deployed factually in German. Do not repeatedly ask what to work on next when the goal is clear.

## Current unfinished integration
PR #25 merged v18 on 2026-10-13. The v19 checkout completes local artwork for all
420 runtime species, shared saves and Grow, and renders original MAPS in 3D.
Do not re-merge the old v17/v18 branches or rely on historical sprite counts.
Read [docs/TEST_BUILD.md](docs/TEST_BUILD.md) for current implementation, test
channel, validation and explicit remaining gaps. The deployment workflow keeps
the audited v18 release at the root and serves this evolving port under `/test/`.

Full details, file map, acceptance criteria and project context: [CODEX_HANDOFF.md](CODEX_HANDOFF.md).
