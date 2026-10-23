> **Published v56 — Shared street details, [PR #63](https://github.com/BenJG420/420mon-3D/pull/63), source `ed853d8`:** locally authored empty
> bottles, cans, open cardboard boxes, parked bicycles and wire shopping carts.
> The common renderer retrofits Gasse A/Grow-Hinterhöfe and runs on all 14 district
> and connecting maps at their original bins (indoor districts: small litter only).
> Deterministic placement avoids source walls, objects, door/NPC approaches and
> overlapping props. Spatial 16m instancing cells share models/materials, retain
> culling bounds and hide beyond 48m plus cell radius. No added shadow casters,
> point lights, alpha passes, gameplay objects or save fields. Figures unchanged.
> Validation: build passed in both local rounds; alley/yard integration checks
> passed. First street test caught the crowded initial cart location; placement
> now tries another bin. Both focused street tests passed after correction,
> including all 14 maps, clearance, geometry bounds, culling and resource disposal.
> PR CI40020045721/Main CI40020249737/Pages40020249742 passed. Live JS
> `index-CtT5N5H2.js`, SHA256 `f14f40613bb514aa5a60b231091730b78eda84c4898fc0fda6b7c0ab4be4f39d`;
> JS/CSS/fonts match the local build, stable root unchanged. No browser/full-suite
> run. Ben checks appearance. Next addendum: graffiti/stickers/posters and a few
> flickering existing lamps, then the full Kabelkeller district package.
> **Monster erst nach Freigabe.**

> **Published v55 — Grow-Hinterhöfe / Moss, merged [PR #62](https://github.com/BenJG420/420mon-3D/pull/62), source `da47361`:** the three original
> blocked inner rectangles receive independent tile/metal/felt PBR roofs, gutters,
> flashing, storage shutters, repaired cladding, lit side windows, vents and ivy.
> Original courtyard walls gain masonry, conduit and restrained emissive fixtures;
> existing signs, bins and Moss’ door gain neon/refuse/hardware detail. Both source
> green patches remain walkable with 36 instanced tufts; three additional shed
> runoff puddles use the existing batch renderer. Moss’ original room gains high
> wall shelving, seed jars and conduit. Details share original wall occlusion,
> at most seven material submissions per structure, no extra point lights.
> Original map/actor/gameplay/save behavior and weather/shadow budgets retained.
> One local round: build and 14/14 affected tests passed (yard/Moss, alley,
> static batches, world geometry). Yard decorations: 71 objects / 25 potential
> instanced main-pass draws before culling; this is not an FPS measurement.
> PR CI40018866793/Main CI40019032929/Pages40019032930 passed. Live JS
> `index-Draa-8EJ.js`, SHA256 `364debcd0e8a2391f61a54c1356ebbb3ca1e166e093513594cc2e071634a8ad7`;
> JS/CSS/fonts match the local build; stable root unchanged. No browser run;
> Ben checks visuals/device FPS. Next: Street-detail addendum, then Kabelkeller.
> **Monster erst nach Freigabe.** Ko-fi/payment stays skipped.

> **Published v54 — Gasse A detail, merged [PR #61](https://github.com/BenJG420/420mon-3D/pull/61), source `15d104f`:** three independent roof PBR
> surfaces (tile/standing-seam metal/felt), four facade sides, gutters/downpipes,
> shutters, cables, service boxes, ivy, existing signs with neon frames, detailed
> house doors, refuse clusters and six additional instanced runoff puddles.
> Facades share building occlusion and bounded material batches; original map
> objects/collision, player/NPCs, mechanics/saves and light/weather budgets remain.
> Build passed in all three local rounds; 15 other affected tests passed. The
> alley test found missing contained-house metadata and edge-house classification
> (fixed). Its third run reached disposal checks, then found the fixture's valid
> first-market-visit +18 gold reward. Fixture now uses an already rewarded visit;
> no fourth local run. Final automatic PR CI39970548173 passed all tests and build.
> Main CI39970741718 and Pages39970741771 passed. Live JS `index-DzV-Bttf.js`,
> SHA256 `d0fe002d13c68bc11de0f5984367d57c51bae105bc15c486fd528c61f5075838`;
> JS/CSS/fonts match the final local build, stable root unchanged.
> Buff HUD PR #60 was merged/published first. Next district: Grow-Hinterhöfe.
> **Monster erst nach Freigabe.** Ben checks visuals; build + affected tests only.

> **Published v53 — Buff HUD, [PR #60](https://github.com/BenJG420/420mon-3D/pull/60), source `1ae4009`:** active consumption effects show symbols,
> original colors, percentage and remaining playtime seconds inside the existing
> top-left Cash/time/level HUD. Outfit bonuses show ∞ while worn; permanent
> Silk/Züchter indicators show ∞. Buffs collapse separately (UI preference) and
> hide with the main HUD. Only the existing active outfit contributes, not all
> six visual slots. Build + 3/3 focused HUD tests passed. No browser/full-suite run.
> No gameplay/save/character changes. PR CI39931342196/Main CI39931435161/
> Pages39931435097 passed. Live JS `index-CLGU9YtK.js`, SHA256
> `19c29ccde341233742134454bb52fa70f783a5c3b003e9edfabbc4f1cb525597`;
> CSS `index-DAJEILXa.css` and fonts match the local build, stable root unchanged.
> Reference: original 2D overlays.tsx Hud(), runtime.highList()/outfitHud() at
> `010807da`; no new browser session at the live reference. Ben checks visuals.
> **NEXT: continue the already-started Gasse A district package as its own PR.
> Monster erst nach Freigabe.**

> **v52 — Performance/FPS, merged/live PR #59, source `7127acf`:** static grass/puddle instancing in small
> culling cells, quality-aware shadow budget, and an optional local A/B FPS capture
> under Hilfe → FPS vergleichen. No player/NPC, mechanics or save changes.
> Node counts before culling: Gasse A decoration 111 → 38 calls, Grow-Hinterhöfe
> 32 → 19, Neonkai 32 → 7 (not whole-scene calls or measured FPS).
> Build + **26/26 directly affected tests** passed; no browser run or broad local suite.
> Actual device FPS measurements remain with Ben; no automated browser benchmark
> is claimed. Build and directly affected tests only. Districts follow in separate
> PRs, starting Gasse A. **Monster erst nach Freigabe.**

> **Published v51 — GUI, [PR #58](https://github.com/BenJG420/420mon-3D/pull/58), source `095856c`:** live-2D menu structure, fixed title/footer,
> touch bottom sheets, readable inventory counts/actions, compact HUD, separate
> Handy/Leiste layout and graphic quality. Licensed local reference fonts.
> **Grow actions are directly under the pot/growbox selector.**
> Build + **28/28 directly affected tests** passed (inventory, Grow, trading).
> No new browser run, broad suite or combination check: Ben performs visual and
> gameplay checks in the test build, per his latest instruction. Existing item
> glyphs remain; illustrated 2D item icons are a documented visual difference.
> PR CI `39828716546`, main CI `39828751359` and Pages `39828751392` passed.
> Live JS `index-DHW3W9Wh.js`, SHA256 `3ebf0b02af182387731afaca713267bc64f663202dfc66d9191df76ca26c5264`;
> CSS `index-CDjTSEA-.css` and both fonts are byte-identical to the local build.
> Pages log retrieval was empty; deployment success + live/local bytes verified.
> Stable root unchanged. NEXT: Performance/FPS, then districts. Monster erst nach Freigabe.

> **v50 — starter case, merged [PR #57](https://github.com/BenJG420/420mon-3D/pull/57), source `97e68c9`:** the original saved `starterId` now removes the case
> from the room, interaction, collision, safe-spawn blockers and minimap after
> choosing. The same marker in existing 3D/2D saves keeps it absent after reload;
> party, box or `eddiSeed` alone never count as a choice. Original rewards retained.
> 214/214 tests and corrected build passed before the new lean-validation rule.
> The already-running fresh-choice/reload and old-2D-save touch smoke completed
> successfully, including HP0/XP17 and unchanged original/stable saves. No browser
> or shader errors. First build had a corrected TypeScript weak-type error. PR CI `39827322232` passed; main CI `39827460352` and Pages `39827460331` passed. Published asset names/hashes verified; stable root unchanged.

> **Published v49 — Mengenhandel:** [PR #56](https://github.com/BenJG420/420mon-3D/pull/56), source `a10f5a4`.
> NPC shops, capsules and Grow shop share slider, +/−, Max, numeric input, live total
> and one full-batch confirmation. Original per-unit prices/bonuses, bounds and
> rollback on failed persistence are preserved. Three check blocks completed:
> 211/211 local tests + build; desktop NPC smoke/image review; final PR CI
> `39781120478`, main CI `39781292426`, Pages `39781292473` green.
> Local Grow smoke fixture was overwritten by pagehide; focused final live touch
> check passed buying, Max selling, reload, HP0/XP17 and untouched original/stable
> saves at 320px, without browser/shader errors. Both screenshots reviewed.
> Live JS `index-DuDgF1N1.js`, SHA256 `0ad2e8415d1abacc411e88b75e6b7c24b5c34d68a1f954c4548127dd0935adbd`;
> CSS `index-BC8t3waH.css`; hashes/names match Pages; stable root unchanged.
> **NEXT: starter case, GUI, performance, districts. Monster erst nach Freigabe.**

> **Published v48 — clothing:** [PR #55](https://github.com/BenJG420/420mon-3D/pull/55),
> source `8e21282`. Six independent slots: top, jacket, pants, shoes, head and
> accessory; overalls + leather jacket, old-save migration, reusable owned pieces,
> one original bonus, storage-failure rollback and a clear lit fitting preview.
> **Three check blocks complete:** 201/201 local tests + build; desktop/touch
> smoke/image review; final PR CI 39678627491, main CI 39678879707 and Pages
> 39678879875 green. All **2,304 combinations** checked in state/fallback and both
> real GLBs (exclusive triangle coverage, UVs/weights, three pose samples/body
> extremes, replacement/resources). This is not an exhaustive visual inspection
> of every combination on every device.
> Local smoke had preview-path/selector harness failures and stopped on a Walk
> assertion (Idle at the obstructed cellar position). It proved slots, migration,
> swapping and failed-write rollback. Image findings led to precise cloth edges,
> clean materials and the unobstructed studio; no further local test/smoke.
> Focused final live check/image review passed both rigs, headwear, rotation,
> independent swaps, desktop/touch, reload, inventory removal, T reset, reusable
> items, HP0/XP17 and unchanged stable/original saves, with no browser/shader errors.
> Walking/running are covered by real-GLB automated animation tests; no successful
> browser-walk result is claimed. Physical Android remains a device check.
> Live JS `index-DdlI5VEC.js`, SHA256
> `db469815262c217f4360ddb310a64d8536d56953f1b2ce809ab8ae73143c794f`;
> CSS `index--XBrvHKG.css`. Names/content/hashes match Pages; stable root stays
> `index-DWZ4yP_E.js`. Final source differs from the earlier local smoke build.
> **NEXT: bulk buying/selling, then starter case, GUI, performance, district detail,
> then **Monster erst nach Freigabe** — explicit permission from Ben required.
> Each package gets its own PR.**

> **Historical v47:** Originalmonster Dex #91–96 [PR #54](https://github.com/BenJG420/420mon-3D/pull/54),
> source `1e46dcd`. Three rounds complete: 188/188 tests + build; one six-model
> original-comparison touch smoke; final PR CI 39218634304, main CI 39253739794
> and Pages 39253739612 green. Ypipe/Taperoll tilted after image review;
> focused final live interaction passed (rotation/zoom/close/reload, HP0/XP17,
> narrow layout, no browser/shader errors). Taperoll core visible; Ypipe still
> partially hides its eyes behind the pipes in the initial view (visual follow-up). Live names/content/hashes verified:
> `index-dJgNAn4W.js`, SHA256 `53ee7409945212a459e4c2e3b62bd41b6c44f44c222165f40329b4b803ed1ba4`;
> CSS `index-tKfj-jno.css`. Stable root stays `index-DWZ4yP_E.js`.
> **NEXT: freely combinable clothing slots. Remaining monster sculpts deferred.**
> Coverage: 96 authored / 324 smooth reconstructions; same test URL/save slots.
> Physical Android/native 4K remain device checks.

> **Historical v46:** Originalmonster Dex #85–90 [PR #53](https://github.com/BenJG420/420mon-3D/pull/53),
> source `0829c76`. Three rounds complete: first build green, 186/188 tests
> (both failures: Bubstack triangle budget); reduced small details, all-six budget
> check + corrected build + one original-comparison touch smoke passed. Rotate,
> zoom, close, reload, HP0/XP17 and narrow layout passed without browser/shader errors.
> Final PR CI 39217287883 and main CI 39217407067 green (188 + build), Pages
> 39217407079 green. Live JS/CSS byte-identical to the corrected smoke build:
> `index-DKWyXFaG.js`, SHA256 `429be189d6260988d5795925ff71671f1d63511752336ccc9a2bce28129b48fe`;
> CSS `index-tKfj-jno.css`. Stable root stays `index-DWZ4yP_E.js`.
> **NEXT: Dex #91. Coverage: 90 authored / 330 smooth reconstructions.**
> Same test URL and save slots; physical Android/native 4K remain device checks.

> **Historical v45:** Originalmonster Dex #79–84 [PR #52](https://github.com/BenJG420/420mon-3D/pull/52),
> source `a26c28c`. Three rounds complete: 188/188 tests + build; one six-model
> original-comparison touch smoke (rotate/zoom/close/reload, HP0/XP17, narrow
> layout, no browser/shader errors); PR CI 39190885592, main CI 39190979906
> and Pages 39190979866 green. Live JS/CSS byte-identical to the local smoke build:
> `index-DLI_qK9P.js`, SHA256 `1e08da89be982c1cb8e362eb5828261e216b1d133e92aef646a772d92d768390`;
> CSS `index-tKfj-jno.css`. Stable root stays `index-DWZ4yP_E.js`.
> **NEXT: Dex #85. Coverage: 84 authored / 336 smooth reconstructions.**
> Same test URL and save slots. Physical Android/native 4K remain device checks.

> **Historical v44:** Originalmonster Dex #73–78 [PR #51](https://github.com/BenJG420/420mon-3D/pull/51),
> source `9cbb0cf`. PR CI 39165042607, main CI 39165152120 and Pages 39165152009
> green (188 tests + build). Live asset names/content/hashes verified:
> `index-CnlEILwF.js`, SHA256 `bf6d2dd88f7eae045455e722f727381bf69ed2a910c0df7ae4589035e5e5003e`;
> CSS `index-tKfj-jno.css`. Stable root stays `index-DWZ4yP_E.js`.
> Six-model original-comparison touch smoke and final Pitmaw live check passed:
> rotation/zoom/close/reload, HP0/XP, narrow layout, no browser/shader errors.
> **NEXT: Dex #79. Coverage: 78 authored / 342 smooth reconstructions.**
> Three rounds completed; same test URL and save slots.

# Original-world test build v51

This is an integrated continuation of 420mon-3D. The original private 2D game
BenJG420/420mon remains the specification. The visual reference supplied by the
owner guides the elevated diorama camera, warm interior lamps, cool shadows,
weathered floors and detailed furnishings.

The Pages workflow retains the audited v18 release at `/420mon-3D/` and builds
this source at `/420mon-3D/test/`. A workflow success must be checked before
describing the test URL as published. The test build uses its own
`420mon-test-progress-v1` save. It copies an existing `420mon-progress-v1` into
the test channel on first use and then leaves the stable release's slot alone.
The new loader preserves
legacy fields and monsters, backs up the previous save and can import an existing
`420mon_save_v1` without modifying that original slot. Cross-origin original
2D saves must be transferred by the player; browsers cannot read another
origin's localStorage.

## What is implemented

- Grouped building occlusion keeps the player visible behind architecture,
  using head/torso/feet/shoulder samples and smoothly restoring clear buildings.

- Larger aquarium and dedicated swimming caught-fish view, with empty-state
  guidance and direct catalogue/bag tabs. Same original collection and bonuses.

- All three physical Glutwalzen open the original 420, Obststand and Freidreher
  games. Authentic reel strips, 20/5/9 lines, original per-line stakes and
  payouts, wild/scatter, fruit nudge and ten-seed/ten-chip jackpot are retained.
  Auto/Stop and doubled free spins work. A single booking saves stake and
  outcome before the visual animation; close/reload cannot replay a payout.
  Unused free spins retain their original bet/lines. The new isolated slotState
  leaves existing saves, references and mechanics intact. Own vector symbols,
  winning-cell highlights and a payout/line table support keyboard and touch.

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
  definitions in the menu. Physical beds and mattresses restore the party to full HP, including defeated
  partners, and advance Grow by the original 1,800 conceptual seconds.
- Original Grow seeds, tiers, fertilizer speed/yield/XP multipliers, 12 slots and
  unlock prices, 33%/66% phases, box yield, seed return, original harvest rewards,
  saved progress and 72-hour offline cap. Instanced 3D leaves/buds visibly grow.
  The Grow merchant supplies seeds, fertilizer and expansions at original prices.
  Shops open from physical merchants, not a universal menu tab.
- Optional three-tap watering rhythm game. Each earned hit awards 10% shorter
  remaining growth and 10% extra harvest, capped at 30% per planting. Only an
  improved best score upgrades the bonus, so replaying cannot stack it. Additional
  buds are rounded up. Bonuses persist and reset on the next planting. Original
  fertilizer, box and economy rules remain the foundation. Legacy cosmetic
  scores need a new completed run to earn a reward.
- Shared persistent state fixes stale battle partner references. Ordinary healing
  skips 0-HP partners; physical mattress rest revives them; full-team captures enter the box; species records are deduplicated.
  Encounters use original habitat weights and level ranges. Original fixed wild
  spots and legendary time windows are used where supplied by the map.
- All 420 Dex entries have local original sheets, including ten restored
  legendary PNGs. One pose is shown in portraits. World monsters currently use
  the authentic original pose as a billboard; these are not finished individual
  3D creature meshes. See ASSET_ATTRIBUTION.md for source hashes.

- Original wild battle engine: up to four saved move choices, physical/special
  defenses, STAB and elemental immunity, initiative, six IVs, bounded stat stages,
  sleep/high/glitch/lust/poison, draining moves and legendary modifiers. Team
  switching spends the player action; misses still allow the opponent to act.
  Inventory chips use original multipliers, type matching and status bonuses.
  Legacy capsules remain independent. Caught HP, status, moves and IVs persist;
  overflow goes to storage. HP0 wild creatures cannot be caught, even with a
  guaranteed chip.
- Original victory XP, half XP for other living partners, trainer XP, level cap
  420 and source evolutions with updated names/moves/art. Grow XP now uses the
  same level/evolution rules. Defeated partners receive no shared XP or healing.
  Victory completes q4_fight. Fight/catch counters and original achievement flags
  persist. The battle result remains visible until the player chooses Continue.
- A responsive battle overlay shows both original portraits, HP, statuses, move
  categories, matchup hints and the selected chip's capture chance. Team/box
  entries show IV score and calculated combat stats. Healing items work during
  combat without spending a turn, as in the original, and choose the most injured
  living partner. Physical rest also clears combat status. Clothes can be equipped
  from the bag and apply the original combat reward/fang bonuses.

- Quest/NPC package: all 24 source quest states now synchronize across saved
  booleans/string states, visits, owned species, Grow, victory, container searches
  and mattress actions. Board quests pay the original one-time reward and the
  nine introductory threads finish Lowtown. Existing completions remain done.
  The journal displays giver, location, recommended level and actual counts.
- Original NPC guide dialogue, Bolt's two-talk toll, Silk's stick/calibration,
  Static's data-stick/Neon-Chip reward and source legend rumor/24-hour override,
  and Ben's read acknowledgement at trainer level ten. Physical Silk interaction
  opens his dialogue before his shop. Selling remains attached to the physical
  merchant and uses source-specific sell multipliers.
- Real container/lamp searches with source loot, unique district finds, quest
  sticks, 75/90-second playtime cooldowns and persistent search history. Outdoor
  mattresses award the source story reward with its 110-second cooldown; healing
  and 0-HP revival remain available regardless of that reward timer. Leaving
  Kapsel in the tanktop records the original secret thread. No older game system
  or save slot is rebuilt.

- Original fishing package: all 42 named fish, source seed-specific schools,
  weights, rarities, green arc sizes, 2–8 second bite wait and circular timing
  wheel. The four original Neonkai rods are physical interaction points. One
  successful hook follows the actual 2D runtime; the unused multi-hit data helper
  is not activated. Keyboard and touch use the displayed marker position.
- A failed timing attempt or original non-fish result now returns exactly the
  consumed bait seed instead of trash. Closing a running cast or recovering an
  interrupted saved cast refunds it once. Durable cast ownership prevents double
  fish, gold or seed claims. Successful catches preserve source gold/outfit
  rewards, fish inventory and historical aquarium counts, separate from the Dex.
- Original fish artwork is rendered as single-pose portraits and up to 16 swimming
  sprites in the existing capsule aquarium. The complete catalogue tracks all 42
  species. The Neonkai has rod, line and float details at its existing coordinates.
  These source-art sprites are not new 3D monster models.
- Fish can be eaten from the fish bag or inventory, applying their original
  separate Fang/Tempo/Gold/Loot/XP playtime buffs and 600-second stacking cap.
  Eating leaves historical aquarium counts and HP unchanged. All 42 fish grant
  the original +20% Grow speed while in Kapsel; previews and actual Grow ticking
  use the same bonus. Original fish-stock migration runs once.

- Original trainer package: the seven Kiez trainers (Cinder, Tide, Vial, Knuckle,
  Hush, Glow and Coil) and the three one-time gate trainers (Soot, Sluice and Dose)
  use their existing source NPCs, monsters, levels and dialogue. Daily rematches
  follow the player’s local calendar. A win or capture records the source history
  and separately rounded 18-base-Softcash bonus once; all seven historical Kiez
  victories grant trainer_7. Standard trainer monsters remain catchable as in
  the actual source runtime. Completed gate NPCs disappear immediately and on reload.
- Nim now wanders through the ten source outdoor maps, changes district after
  80–150 seconds, walks at the original speed and approaches for a duel. His team
  counters the first living partner with up to three distinct nonlegendary species
  at the highest living team level. His monsters cannot be caught. Intermediate
  opponents grant active-partner/trainer XP; the last grants the normal victory
  rewards and living-team shared XP. The source 50/75-second playtime cooldowns,
  saved location and seen-species history persist.
- Trainer fights reuse the existing four-move combat, statuses, items and team
  switching. Flight grants no trainer reward or completion. Defeat returns to
  Kapsel and costs up to eight Softcash after Continue; HP0 remains HP0 until
  physical mattress rest. Other battles, Grow, fishing, NPC shops and save slots
  continue through their existing systems. Multiplayer sparring remains separate.

- Can's achievement package: all 420 unchanged original definitions and checks,
  seven chapters, free hints, original paid tips and hidden secret pages now use
  the shared 3D save. Current team/box/collection are adapted to the original
  party/caught predicates; fish never count toward the monster Dex. Existing
  earned flags, tips and special event grants remain fulfilled permanently.
- Talk to the physical Can in Rajko's cellar to open his book. Filter by chapter,
  status or revealed name, with eight entries per page. Tips reveal original
  instructions and are bought once at source prices. Secret names remain hidden
  until earned or a tip is purchased. The menu's Erfolge journal is read-only;
  buying tips and collecting rewards require the real NPC and current proximity.
- Owner-requested extension, separate from the original rules: each fulfilled
  achievement pays 10 Softcash, or 25 for a secret achievement, once at Can.
  Individual and batch collection share persistent claimed IDs. A batch pays
  only pages already available at that click; new earning achievements wait for
  the next explicit collection. Historical completed achievements are eligible
  once. Payouts never change monster HP, XP or inventory.
- Source activity history is connected: real movement frames count steps,
  unwrapped/tanktop play frames count the original nudeSeconds timer including
  menus and indoors, and worn clothes remain remembered. Moss harvests now
  record the original unique-find history. Synchronization occurs on load/save
  and at the source eight-second interval. Felix/Eddi economy conditions
  now follow their real v27 worker/visitor actions or valid imported history;
  achievement synchronization never invents worker activity or paid support.

- Visible clothing package: all ten original wearable items and the Tanktop
  base now have distinct lightweight 3D forms on the existing animated character.
  Torn charcoal bag panels, collar/ring, lime jacket, leather vest, split long
  coat, folded hoodie, striped tracksuit, yellow raincoat, brown work overalls
  and cyan lacquer jacket follow the original player sheets. Source images take
  priority where their colors differ from item prose. Sleeves and trouser details
  follow the existing walking pivots; models are reused when changing clothes.
- Inventory equipment changes update the world character immediately. The same
  original ownership/toggle rules apply without consuming clothes; T removes an
  outfit or puts on an owned trashbag. Legacy bag/clothed names are normalized,
  valid equipped items survive a zero inventory balance, and worn history persists.
  Existing catch/gold bonuses and all other gameplay systems remain in place.
- The retained character editor includes owned-clothing selection, an equipped
  label and a rotatable close-up using the existing scene/camera. On phones the
  preview stays above the controls. Studio body, face, hair and base-color presets
  remain saved; they do not repaint equipped original clothing. Inventory also
  links to this preview. Shops still require their physical NPC.

- Radio and helper economy package: Rajko and the physical cellar deck open
  the original radio controls. Both original MP3s ship locally (verified Git blob
  hashes); selection/mute persist, and music continues during exploration.
  YouTube/Spotify links use their platform players; external HTTPS streams follow
  the original GEMA toggle, enabled by default. Playback requires a browser gesture.
- Felix's original free hire/puff conversation, 5%/10% cut, capsule crate,
  100-seed bag, fertilizer priority, individual walking/work states and 420-bud
  delivery threshold now use the shared Grow save. Automatic planting/cutting
  follows source timing and grants no player/partner XP. Offline production uses
  the original cycle simulation and 72-hour cap. Manual plants stay untouched;
  earned care bonuses also count on Felix's harvests.
- Eddi arrives after the 100th growbox harvest, wanders through the Kapsel and
  has the original single 34% chance per look to triple a plant's base yield.
  His physical shop buys at double the base price, sells at half price (exclusive
  items retain their original 420 price), and sells the unique 10,000-Softcash
  grow-speed title. Offline time does not invent Eddi visits. Helpers share one
  plant clock without incrementing playtime or changing defeated HP.
- **Übersprungen — Ko-fi und Zahlungsserver (user instruction 2026-10-16).**
  This work is no longer blocked, pending setup or a next task. The game no
  longer opens Ben's payment UI, polls a payment service or passes a payment URL
  to its deployment. Historical service/client files and receipt/save history
  remain archived; Ben's existing quest acknowledgement remains available.

- Monster model package: every runtime species now has its own rounded 3D
  volume reconstructed from the exact first original pose, preserving its color,
  outline and holes. All 420 local model assets include source hashes and a
  reproducible pipeline; they total 6.65 MB and are requested per visible species.
  These reconstructions have inferred side/back depth, not authored rear anatomy.
- The first 24 species, Budling through Graterat, additionally use individually
  modeled bodies: leaves, vines, cables, punk armor, smoke, wings, jaws, legs and
  tails follow their original references. Each sculpture merges into one colored
  mesh. The other 396 use their own source-derived volumes. Original Dex sheets
  remain unchanged. See [model scope and pipeline](MONSTER_MODELS.md).
- Wild monsters, daily/gate trainers, Nim's changing opponents and battle allies
  share the same model renderer and existing species IDs. Original portraits are
  used while loading or on error. Caches retain active models and at most 24
  unused species; stale async loads cannot attach to a different creature or a
  removed instance. Bobbing keeps the new model feet above the ground.
- Captured Dex entries and battle fighter buttons open a read-only 3D comparison
  studio. Rotate by touch/mouse or arrows, zoom/reset, compare with one original
  pose and close with Escape. One temporary viewer renderer is destroyed on
  close; the covered world renderer pauses GPU drawing. Keyboard/touch movement
  is cleared on entry. Battle turns and save data do not change by viewing.

- District atmosphere package: dark blue-green industrial materials and small
  paving, warm-white/amber key and lamp pools, cool fill/rim, distance fog, wet
  PBR roughness/normal/clearcoat and irregular puddles follow the owner's visual
  reference. Facades add merged windows, roof trim, vents and downpipes. A
  per-district HDR/PMREM environment supplies material reflections; this is not
  a claim of screen-space ray tracing or exact moving-character reflections.
- GPU rain streaks, world-anchored splashes and ground haze use fixed resources;
  source indoor maps remain rain-free, with warm dust instead. Nearby physical
  lamps are capped at four outdoors/five indoors, and the shadow area follows
  the player. Geometry, map coordinates, routes, collisions and NPC actions stay
  in place. See [graphics pipeline and budgets](GRAPHICS.md).
- The world now passes through color grading, vignette/grain, ACES/sRGB output
  and FXAA. Supported high mode adds bounded HDR bloom; the automatic phone/low
  path keeps grading and antialiasing without the expensive bloom chain. Grafik
  selects Automatisch/Hoch/Sparsam and saves only a presentation preference.
  Pixel budgets and DPR caps avoid forced phone supersampling. DOM menus and
  existing monster/editor previews retain their own rendering.
- Player and NPCs use locally bundled MIT Rocketbox skinned models, with shared
  explicit limb mappings, target rotations and phase-matched Idle/Walk/Run blends.
  Source/animation licensing is in [ASSET_ATTRIBUTION.md](ASSET_ATTRIBUTION.md).
  Further HD/PBR monster work follows Bens ordered fixes below.

## How to try it

1. Start in Kapsel. Walk toward the case and press E or the on-screen interaction
   button to select Budling, Glitchbitch or Neonpunx.
2. Use Grow or approach a pot. Plant an owned seed and optionally play the
   watering game. Close the panel to watch the plant in the room.
3. Use the bed to revive and heal your party and advance plants by 30 minutes.
   A perfect Grow round grants 30% less remaining time and 30% more yield. Return
   to a ready pot to harvest.
4. Use the left door to enter Rajko's cellar; the right door leads to the original
   Gasse. The town map also contains home shortcuts for this test build.
5. Talk to Bolt twice with a Junk-Chip to clear his original gate quest. Higher
   districts still require their original levels; manholes remain a side route.
6. Find a wild monster in a district, then try each of your four attacks. Use
   Team to switch, Items to heal, and choose a purchased chip in the Fangmittel
   selector. Read the result and choose Weiter to return to the world.
7. Train Budling, Glitchbitch or Neonpunx to its source evolution level. Grow XP
   also develops living partners. Reload to verify team stats, moves, plants,
   inventory and position persist.

8. Search three different containers. Take the warm data stick to Static and
   the market's Silk-Stick to Silk. Talk to Silk, give his stick, then open his
   physical shop to buy or sell. Use Aufträge ansehen in an NPC dialogue to check
   saved progress.

9. Use the original Kapsel fishing pad or the canal route to Neonkai. Approach
   one of its four rods and choose a Weed seed. Wait for the bite, then tap the
   wheel or use Space/Enter/E when the marker crosses the green arc.
10. Inspect the fish bag and eat a catch to activate its listed bonus. Miss a
    cast to get its seed back. Return to the physical aquarium in Kapsel to inspect
    the 42-species catalogue and your swimming collection.

11. Find Soot in the Aschegang (Lv.33), Sluice in Abfluss (Lv.26) or Dose in
    Chemie (Lv.46). Talk and choose Kämpfen; flee, defeat or catch their monster.
    A win/capture removes the one-time gate NPC and persists its bonus.
12. Challenge a Kiez trainer: Tide/Abfluss Lv.31, Cinder/Aschegang Lv.39,
    Vial/Chemie Lv.54, Knuckle/Ring Lv.89, Glow/Nischen Lv.109,
    Hush/Labyrinth Lv.146, Coil/Schrotttor Lv.259. After a win/capture they say
    Heute reicht. Morgen wieder.; the next local day allows a rematch.
13. Meet wandering Nim in an outdoor district. Choose Duell to fight his team,
    or Später to defer his automatic challenge. Chips stay unavailable in his
    duel. A trainer loss leaves defeated partners at zero HP; use the physical
    Kapsel mattress to revive them.

14. From Kapsel enter the cellar and approach Can (left of Ben, south of Rajko).
    Choose Buch. Read a free hint, buy an original tip, then use Abholbereit to
    collect an earned reward or collect the currently available batch. Reload to
    verify the tip and claimed marker persist; the same reward cannot pay again.
15. Open Erfolge through the game menu away from Can. Search revealed names and
    use chapter/status filters and pagination. This journal shows progress and
    reward status but cannot buy or pay remotely. Walking, capturing, winning,
    growing and selling continue to earn the original pages through existing systems.

16. Buy an outfit from a physical clothing merchant, then equip it from Inventar.
    The character changes immediately. Tap the equipped item again to return to
    Tanktop, or press T to switch the original trashbag shortcut.
17. Use Charakter or the equipped-clothing row in Inventar. Select an owned
    outfit and rotate the close-up; on a phone the figure stays above the editor.
    Change body/hair or base colors, then close and reload. The equipped piece,
    its source colors, existing presets and gameplay bonuses remain consistent.

18. Approach Rajko in the cellar or his desk, choose Rajko/Lowtown, mute,
    close and reload. Selection persists. The URL field supports platform players
    and optional HTTPS streams; the original protection toggle starts enabled.
19. Meet Felix in the Gasse. Choose Ein Zug or Lass, then Deal. In Kapsel use the
    crate at the lower right to deposit seeds/fertilizer and retrieve harvested
    buds. Watch Felix work; returning after an absence also advances production.
20. After 100 growbox harvests meet Eddi in Kapsel. Buy seeds, try his title and
    sell buds. His star marks triple base yield; the existing care bonus still
    adds to that harvest. His shop remains attached to the actual NPC.
21. Ko-fi/payment work is intentionally skipped. Ben remains an ordinary story
    NPC for the existing acknowledgement; no payment counter opens.

22. Open the Dex and select a captured entry marked 3D ansehen. Compare the
    original pose with its model, drag to rotate, zoom, reset and close with Esc.
    The first 60 entries use individual sculptures; other entries identify their
    source-sprite reconstruction. Return to the world to see the same creatures.
23. In a trainer or wild battle choose 3D ansehen under either fighter portrait.
    Inspect and close: the same battle turn remains active. Continue fighting or
    catching with the existing rules. Evolution, respawn and Nim's next opponent
    update the same model slot.

24. Explore the Gasse or another outdoor district: wet paving, warm pools,
    cool shadows, thin rain and low haze replace the previous late-day lighting.
    Enter Kapsel or Rajko's cellar: rainfall stops and warm interior lighting
    remains. Changing districts also changes the color/fog/wetness profile.
25. Switch Grafik between Automatisch, Hoch and Sparsam, resize and reload.
    High enables bloom on supported hardware; automatic phones use the cheaper
    path. Menus, movement, interaction, model previews and save slots still work.

26. In Rajko's cellar approach the Glutwalze to Ben's right; the other cabinets
    are at the cinema and Neonkai. Press E/tap the interaction, choose 420,
    Obststand or Freidreher, set stakes per line and select active lines. The
    payout table shows original rules and line shapes. Try Auto/Stop; Escape
    or close keeps the booked outcome and unspent locked-stake free spins.
    Reopen/reload to read the last receipt without a second payout.

27. Walk behind a house in Gasse A. Its walls, roof and facade should fade
    together, leaving the player visible; move clear to restore the house.
    Travel indoors and back: camera distance, collision and interactions stay.

28. Open Inventar with an owned Joint/Bud and tap its row. One item is consumed;
    active effect values/time appear above. Stack a weaker Joint: the stronger
    value stays and time extends (600s cap). Reload to check persistence. In a
    battle use Items to consume one: enemy HP/turn/partner HP must not change.
    Defeated partners remain at zero HP until physical mattress rest.

29. Open Menü: Pause lists destinations in the 2D order. Choose Inventar, open
    categories and use their separate action buttons. Healing opens the partner
    picker; KO/full entries are disabled. I toggles inventory, T switches the
    original trashbag shortcut, Esc returns/back/closes. Unknown saved items
    remain under Sonstiges. Party retains Box access; 3D equipment is below
    the original inventory. Dex → 3D ansehen must close correctly with Esc.
    Online menu entries open the 2D original in another tab, without save transfer.

30. In Dex or battle, inspect an authored model (Budling/Coinwraith) and a later
    reconstruction (Hawkerfox). Curved silhouettes now shade smoothly, surfaces
    use PBR normal/roughness detail and the studio has reflections. Rotate/zoom,
    close and reload. Reconstruction labels remain explicit: individual anatomy,
    eyes and accessories for the remaining 360 species are still next work. Native 4K
    and physical Android appearance/performance remain user/device checks.

31. Inspect Dex #49–54 Hawkerfox, Kiefhound, Puffwraith, Blazetail, Rootroach and
    Crackveil when owned/in battle: each now uses its individual sculpture.
    Compare the original first pose, rotate/zoom and close. Bright studio
    surfaces use ACES tonemapping; all 54 authored models retain PBR and cache
    ownership. Dex #55 onward remains explicitly marked smooth reconstruction.

32. Inspect Dex #55–60 Portwolf, Fogbank, Dockclaw, Flaskwyrm, Velourfox and
    Rustmaw when owned/in battle. Each now uses its own source-based sculpture.
    Compare the first pose, rotate/zoom, close and reload. Rustmaw has separated
    tooth jaws with a recessed mouth interior; Fogbank retains hanging wisps.
    Current coverage is 60 authored; Dex #61 onward remains smooth reconstruction.

## Validation

v41 round 1: 188/188 tests + build passed. Existing real geometry/provenance/
normal/UV/budget/cache checks now cover 60 authored and 360 reconstructed species.
Round 2 passed one original-comparison touch smoke for all six: sculpted status,
rotate/zoom/close/reload, HP0/XP17, narrow layout and no browser/shader errors.
Image review led to a recessed mouth back wall for Rustmaw and staggered Fogbank
puffs before final CI/deploy (round 3). Final PR/main CI and Pages passed;
live asset names/content/hash and targeted final Rustmaw/Fogbank views passed,
including rotation/zoom/close/reload, HP0/XP and no browser/shader errors. No
additional local full loop or tests merely mirroring cosmetic definitions.
Physical Android/native 4K remains a user/device check.


v40 round 1: 188/188 tests + build passed. Existing real geometry/provenance/
normal/UV/budget/cache tests now cover 54 authored and 366 reconstructed species.
Round 2 passed one original-comparison touch model smoke for all six species:
sculpted status, rotate/zoom/close/reload, HP0/XP17 and narrow layout with no
browser/shader errors. Round 3 is CI/Pages. No extra tests merely duplicate
the model definitions.


v39 round 1 passed 185 tests + build. Round 2 passed three focused new checks
(all 372 smooth reconstructions, 48 authored meshes/UVs/budgets, PBR maps and
cleanup) + build; one touch model smoke passed Budling/Coinwraith/Hawkerfox, rotation,
zoom/close/reload, HP0/XP17, narrow layout and no browser/shader errors. The
reconstruction remains visibly simpler than a sculpture. Final bilinear color
sampling preserves markings better than the first Gaussian color blur; round 3
CI/Pages passed the final state (188 tests/build); live names/hash/content
confirmed. One targeted live reconstruction check passed rotation/zoom/close,
reload and HP0/XP without browser/shader errors. No further local full loop.
The sculpture triangle budget changes explicitly from 15k to 30k for finer
curves; reconstructed surfaces are bounded at 24k. Source data validation and
legacy voxel budget checks remain unchanged.


v38 round 1: 182 existing tests + build passed. Round 2: three targeted new
inventory/menu tests + build and one touch smoke passed (categories/quantities,
explicit healing with KO protected, consumption, Party/Box, shortcuts, modal
Escape, reload/unknown items, narrow layout, no browser/shader errors). Final
CSS panel sizes, inventory T shortcut and a follow-up guard letting the overlaid
Dex studio handle Escape were checked in round 3: final CI passed all 185 tests
and build; Pages and live artifact names/hash passed. A targeted live check
confirmed final bounds/T/Dex Escape with no browser/shader errors. No repeated
local full test/smoke. Online pages remain links to the 2D version; physical
Android/native 4K remain device checks.


v37 round 1: 182/182 tests and build green. Four new checks cover all original
Joint/Bud items, exact consumption, stacking/cap/expiry, hybrid selection,
Zero-Day, XP/reward consumers, legacy clocks, fish coexistence, storage rollback
and HP0/reference preservation. Round 2 passed one touch smoke: Joint/Bud consumption, strongest stacked catch
bonus, reload, combat use without a turn/HP loss, HP0/XP17 and narrow layout
without browser/shader errors. Round 3 passed PR/main CI, Pages and exact live JS/CSS comparison. No fourth
check; physical Android/4K remains a device test.


v36 round 1: 178/178 tests + test-channel build green. Three new regression
checks cover complete houses, head/shoulder coverage, camera inside a wall,
geometry/camera preservation and exact state restoration on map replacement.
Round 2 passed one touch smoke: active fades at two houses, map replacement,
existing aquarium interaction, HP0/XP17, narrow layout and no browser/shader
errors. Its screenshot was taken during camera approach, so is not a settled
visual proof. Before merge, an explicit shader refresh on transparent/opaque
transitions was added, with a regression assertion; final PR/main CI passed
178 tests + build. Round 3 passed Pages and live filenames/content/hash checks.
The extra live view waiting for 100 software-rendered frames was stopped after
about 100 seconds; no retry/full smoke. Settled close-up/physical device visuals
remain a user check; no claim of completed Android/4K verification.

v35: round 1 passed all 175 tests and the test-channel build. Round 2 passed
one Chromium touch smoke: 0/1/42 caught species, million-count bounding,
catalogue/full bonus, tab switching/reopening, narrow layout and HP0/XP17;
no browser/shader errors. Round 3 passed PR/main CI, Pages and exact live
JS/CSS verification. No fourth check. Physical Android remains a device test.

v34: round 1 passed build and 174/175 tests; one new fixture wrongly expected
crown chips to count as unique Kiez finds. The source list excludes these items,
so only the fixture changed. Round 2 passed eight targeted tests and one
Chromium touch smoke at all three physical cabinets, affordability, closing
mid-spin without loss/double-booking, reload, Auto/Stop and locked-stake free
spins across reload, unchanged HP0/XP and no overflow/page/shader errors. Round 3
passed PR/Main CI (175 tests), Pages and exact live JS/CSS verification. No
fourth whole smoke/test loop. Physical device checks remain separate.


v33 closing validation: the first round passed build and 165/167 tests; two
new skin assertions compared FBX mesh centimetres to world metres. Applying
the actual mesh world matrix fixed the fixture without relaxing the bound.
Round 2 passed the five affected full-cycle/transition/mapping tests and one
male/female game smoke (walk/run/idle, three NPC rigs, reload, narrow layout,
HP0/XP unchanged, no page/shader errors). Round 3 passed PR/Main CI (167 tests),
Pages and exact live artifact verification. No further whole smoke/test loop.
Physical Android and native 4K remain device checks.

`npm test` runs real TypeScript modules through Node's test runner. The current
suite has 188 regression tests covering 420 assets, restored source hashes, battle save
references, defeated HP, capture overflow, legacy/original save migration, Grow
rules, offline progress, all original map coordinates/68 transitions and world
interaction/resource ownership, source combat formulas/status/evolution and
inventory chip/healing integration, quest reward idempotence, turn-ins,
container cooldowns and story mattress/merchant actions, original fish schools,
cast settlement/refunds/recovery, fish-food buffs, the full aquarium Grow bonus,
trainer roster/daily settlement/one-time bonuses/gates and source save compatibility,
Nim team generation, movement, playtime cooldowns and HP0 preservation, all 420
original achievement predicates and save adapters, paid tips, exact-once single/
batch rewards, earning thresholds, movement/time counters and Moss-find history,
clothing ownership/legacy saves/bonuses and distinct reusable 3D garment layers,
walking pivots and GPU resource ownership. `npm run build` performs TypeScript and Vite
production checks. CI runs both commands. The v27 extension also covers original
radio assets/URL rules, worker stock and clock conservation, offline production,
Eddi pricing/stars/title, secure receipt ownership/retries and persistence failure.

For v29, pass 1 completed all 161 tests and the test-channel build. Five new
checks cover all 22 presentation profiles/shelter rules, profile isolation,
phone/4K pixel budgets, fixed weather resources across district changes and
owned-resource cleanup. The existing world fixture now supplies real image-data
buffers for its procedural PBR atlas. Browser smoke and deployment are recorded
below after completion. Pass 2 confirmed outdoor rain, the automatic mobile
post path and the DPR3 pixel budget, with a captured Gasse image and no shader or
page errors. High/HDR/bloom enabled successfully, but its 1280×800 screenshot at
emulated DPR3 hit a 16-second software-rendering timeout; subsequent indoor,
reload/payment/viewer checks in that script were not reached. No whole smoke
rerun. The observed mobile graphic-selector/prompt overlap was corrected in CSS.
Pass 3 completed PR CI run 38854928401, main CI run 38855024073 (161/161
and build), and Pages run 38855024104. PR #36 published source
`c82f7c830700019fbcac5872927dfb80709597b8`. Live bundle `index-CUSOzd0g.js`
(SHA-256 `28581be3e6f8be5a27c029ee3487c379698bd69d31e8b5102a19de8dcfadb695`)
and CSS `index-B22-BWfz.css` match the CI artifact names; stable root remains
`index-DWZ4yP_E.js`. A focused live check at DPR1 confirmed high/HDR/bloom,
indoor rain off, persisted Sparsam preference, no payment counter, preserved
HP0/XP/gold/inventory and the corrected mobile control position. No shader or
page exceptions occurred. No full smoke was repeated. Sustained high-DPR/native
4K performance remains a physical device check. This final note changes docs
only (`[skip ci]`); the above merge remains the published source.

Historical v28: pass 1 completed all 156 tests, including all 420 model assets and
source palettes/hashes, non-flat closed geometry/budgets, 24 distinct sculptures,
cache ownership and stale/error/retry paths. Its production build stopped on a
TypeScript narrowing error in the new raster validator. The validator now checks
number types explicitly. Pass 2's production build passed and one Chromium touch
smoke confirmed six sculptures and two generated volumes, real rendered rotation,
zoom/reset, desktop/mobile fit, close/reload without HP0/XP/gold/inventory changes,
and the correct trainer opponent preview without consuming a turn. A guaranteed
source chip then caught that trainer monster; the defeated partner stayed at
zero HP with unchanged XP. No browser exceptions occurred. Pass 3 completed PR
CI run 38843795101, main CI run 38843909379 (156/156 tests/build), and Pages run
38843909553. PR #35 published source `861750bbcc1057326c6cb1db0b11bd68bc5d7119`.
The live JS `index-CaFS25C1.js` exactly matches the checked production bundle
(SHA-256 `f42e5c3d422f2bb54dc38c346313e7b0a2be62dc3821a9af97baceb70b687bdd`);
CSS is `index-CqXk0kcd.css`. The full 420-entry manifest and sampled model files
match local hashes. The stable root remains `index-DWZ4yP_E.js`. No extra full
test/build or browser smoke loop was run. This final deployment note is docs only
(`[skip ci]`); published game source is the above PR merge.

Historical v27: pass 1 completed with all 148 tests and the test-channel production build
successful. Pass 2: one Chromium touch smoke confirmed real local MP3 playback,
radio URL/protection rules and selection/mute after reload, Felix's physical
hire/puff and offline harvest, crate deposits/withdrawals and reload, Eddi's
half-price seed/title/double-base sale, HP0/XP preservation and the closed Ben
counter. No browser exceptions or horizontal touch overflow were observed.
External YouTube/Spotify availability and physical Android audio/performance
remain user/device checks. Pass 3: PR CI run 38806914272 and main CI run
38807097995 passed all 148 tests/build; Pages run 38807097955 published PR #34
at `c4c1ab20dd91cb3cb991e2981e099c86bbeb2b90`. The live test JS is
`index-CDtlnkfY.js` (SHA-256
`2ef5a0a558d7a26198149b17e12a55c2fdd3d5ddcb13235ac0d5136bbb0c87a2`),
CSS `index-DyhZO3Kd.css`. The first filename assertion expected the local
`index-COP-fW4Z.js`; Pages supplies the public support build variable and emits
its own filename. The targeted live check then confirmed the actual CI artifact
names, v27 contents and both original MP3 hashes. No build or browser smoke was
repeated. The stable root still serves `index-DWZ4yP_E.js`.

The v27 final deployment note was documentation only (`[skip ci]`). Payment
work was later skipped by the owner; current publication is recorded above.

Historical v26: the first pass had 112/114
successful cases; two fixture currency expectations missed legitimate Tanktop or
quest rewards. Both were corrected, and their 17 targeted tests plus build passed
in pass two. Its one touch smoke verified all eleven appearances, original T,
inventory equipment, editor preview and saved HP0/XP/inventory/gold. The subsequent
simulated walk did not record a step; closing the editor now releases hidden
control focus explicitly. No full smoke was repeated. Pass three completed full CI with 114/114 tests,
build and Pages, and confirmed live focus release plus actual walking/steps.
Its subsequent inventory assertion missed the legitimate Grow starter seed;
the desktop preview step was not reached. Desktop visual verification therefore
remains a player-check item. The three-pass limit was respected; no fourth smoke
was run. The published v26 bundle includes the focus fix, CSS matches the checked
build, and the stable v18 root remains intact (PR #33, source 4c450bd).

Historical v25 check: the first pass completed all
100 tests and the production build. One Chromium touch smoke confirmed Can's
physical book, all 420 entries, pagination, hidden-secret search, a source-priced
75-Softcash tip, a 10-Softcash single claim and batch collection, persistence
without duplicate payment, and a read-only remote journal. HP0, XP and inventory
were unchanged; no page errors or horizontal overflow occurred. CI/Pages and
exact live artifact verification also succeeded for PR #32.

Historical v24 check: the single Chromium touch smoke
confirmed a physical daily trainer dialogue, victory, once-only bonus and same-day
lock; gate-trainer capture/removal/reload; Nim’s complete three-enemy queue and
capture ban; and the source loss penalty/capsule return with HP0 preserved until
physical mattress rest. No browser errors or horizontal overflow were found.
CI/Pages and exact live artifact verification also succeeded for PR #31.

Historical v23 check: one touch smoke confirmed the physical rod,
wheel catch, fish food, timing-miss/close seed refunds and saved collection after
reload. The final aquarium step selected the preserved nearby fishing pad at the
fixture position; the third deployment check successfully opened the live tank
from its right side and verified all 42 catalogue entries without browser errors.
No full smoke loop was repeated.

Historical v22 check: the single touch smoke exercised Silk's stick hand-in,
physical merchant opening and a sale successfully. Its subsequent Static fixture
relocation timed out because pagehide persistence restored the in-memory position;
no extra smoke loop was added. Static's actual quest mutation is covered by the
module tests; his browser interaction remains a user-check item.


## GUI reference inspected — v51, 2026-10-22

The live 2D game https://coral-nova-gem-pearl.grok.me/ was visited in isolated guest
sessions without email on desktop (1365×900) and touch (390×844), before Ben’s
new instruction to stop browser runs. No original accounts/saves were modified.
Observed: Pause 360px, inventory 520px, maximum 640px height; centered desktop
panels, touch bottom sheets, fixed title/footer and one scroll region. Pause order:
Anzeige (Handy/Leiste), Hilfe, Leute & Chat, Nachrichten, Änderungen, Inventar,
Dex, Quests, Erfolge, Party, Weltkarte, Kapsel, Feedback, Ton, Teilen; green Weiter.
Inventory has collapsible categories with distinct-item and total-piece counts,
name/count/description, contextual actions and a neutral Zurück returning to the
world. Fresh guest categories: Heilen, Rausch, Chips, Samen, Kleidung, Keys.
Green headings except orange Rausch/Keys and gray Kleidung. Existing extra 3D
categories stay in the original source order. Color tokens: #070708 background,
#121416 panel, #1a1c20 surfaces, #2a2a30 borders, #e8e8ea text, #8a8a90 muted,
#7cff6b active; IBM Plex Sans body and Press Start 2P headings. HUD: compact
cash/time/level/outfit at top left, collapsible minimap right, optional bottom
shortcuts and touch controls. Local licensed fonts now match these families.
Existing category glyphs remain; the original's illustrated item icons are not
claimed as imported. Online entries link honestly to the live original; no new
chat/account/payment server is implied.

**Ben’s Grow requirement:** plant/care/harvest actions sit directly below the
pot/growbox selector, ahead of the illustration and long bonus/harvest details.
Empty slots keep seed/fertilizer inputs with the planting button in this action
area. Original prices, care bonuses and planting rules remain unchanged.

Evidence: `/workspace/scratch/420mon-audit/v51-reference-notes.md`, reference
screenshots and recorded guest observations. Ben performs the next visual/gameplay
check in the published test build. Validation here is build + affected tests only.

## Remaining work — Bens neue Prioritäten (2026-10-23)

PR #54 / v47 is complete, merged and live. Coverage is 96 individual sculptures /
324 smooth reconstructions. The new owner order below supersedes every older
NEXT/order note. One complete playable package per PR. **Latest rule (Ben 2026-10-22):
build + directly affected tests only; no broad suites, combination sweeps or browser
runs. Ben tests gameplay in the published test build.** Older check budgets below
are historical; existing repository CI may run automatically.

1. **DONE — Kleidung, PR #55 / v48:** separate freely combinable slots for **Oberteil, Jacke,
   Hose, Schuhe, Kopf, Accessoires**, including Latzhose with Lederjacke. Swapping
   must remove the old parts without duplicates, clipping or missing pieces;
   fitted to the existing rigs and persisted. **Test every supported combination.**
   Preserve existing player/NPC rigs and legacy saves; use the original clothing
   as the starting point. All 2,304 combinations passed within the three check
   blocks; exact validation and limitations are recorded above.
2. **DONE — Bulk buying/selling, PR #56 / v49:** quantity selection with slider and
   +/- controls, Max and a numeric input. Show the total price live and confirm
   the full selected quantity in one transaction. Support desktop/touch; test
   stock, funds, bounds and save integrity. Preserve original prices and rules.
3. **DONE — Starter case, PR #57 / v50:** remove the case from the room once a starter has
   been chosen. Keep it absent after reload and in existing saves; add a test.
4. **DONE — GUI, PR #58 / v51:** use the running 2D version at https://coral-nova-gem-pearl.grok.me/
   as the menu, inventory and HUD reference. Inspect its guest start (no email),
   reproduce the observed hierarchy/appearance/behavior and record findings here.
   **Grow touch priority:** put “Gieß-Rhythmus spielen” and planting/action buttons
   immediately below the pot/growbox selector, so selection and action do not
   require scrolling back and forth. Declutter overlaps and keep desktop/touch readable. Existing 2D saves originated
   there; preserve their import, never write to or reset that original save.
5. **DONE — Performance/FPS, PR #59 / v52:** spatially bounded static grass/puddle
   instancing and quality-aware shadows; existing facade merges, texture caches,
   pixel budgets and bounded bloom are retained. Optional Help → FPS vergleichen
   captures both modes at the same stationary view (2s warmup + 10s each), actual
   untruncated frame times, mean FPS, 1% low, p95, draw calls and context as local JSON.
   Baseline restores v51 individual decoration and shadow sizes. Auto/Low reduce
   shadow resolution; High preserves it. **Actual before/after device FPS remains
   Ben’s test-build check; Node geometry counts are not an FPS result.**
6. **DONE — Buff HUD, PR #60 / v53:** show active effects with
   symbols and remaining time inside the same collapsible top-left Cash/time/level
   panel. Preserve effect clocks/rules and the one active outfit bonus. Build +
   directly affected tests only; Ben checks the published GUI. Own PR.
7. **District detail — Gasse A DONE (PR #61 / v54); Grow-Hinterhöfe/Moss DONE (PR #62 / v55); NEXT Kabelkeller (`cable`), one PR per district:** preserve each original 2D layout,
   add substantially richer visual detail matching the reference. Give roofs
   their own tile/metal/felt materials, edges and gutters instead of floor textures.
   Detail facades, windows, doors, signage, neon, trash, cables, puddles, props,
   vegetation and PBR materials; improve lighting, fog and post-processing.
   **Do not change players or NPCs in these district packages.**
   Gasse A v54 completes the first exterior package: independent roof PBR maps, four-sided
   facade detail, neon/signs, refuse and runoff puddles; no extra point lights.
   Grow-Hinterhöfe v55 adds detailed original sheds/courtyard walls, source green
   patches, refuse/neon/runoff and Moss’ interior, keeping the native layout and
   actors. Next is Kabelkeller (`cable`), then Markt, Kino, Neonkai, Kanal,
   Aschegang, Abfluss, Chemiegasse, Ring, Labyrinth, Nischen and Schrotttor.
   **Ben addendum (2026-10-23):** add empty bottles/cans, cardboard boxes,
   parked bicycles/shopping carts and similar street clutter with instancing.
   Retrofit Gasse A too; carry the shared detail system through every district.
   Street-detail addendum DONE (PR #63 / v56), merged and published.
   **Ben addendum (2026-10-23): NEXT shared graffiti/tags/stickers/posters and a few
   flickering lamps/lanterns across districts, including Gasse A retrofit; retain
   performance budgets and actors.** Own PR because #63 is already merged.
   The next full district package remains Kabelkeller. Player/NPC assets remain unchanged.
   Associated interiors follow with their district. Each gets its own PR; native
   device appearance/FPS stays with Ben, no blanket visual-completion claim.
8. **Monster erst nach Freigabe:** remaining monster sculpts and visual follow-up
   from **Dex #97 require Ben’s explicit approval**. Finishing fixes, performance
   and all district graphics/details does not itself grant that approval. Preserve the 96 authored models and PBR/UV/cache.
   Known v47 visual follow-up: Ypipe branches partly cover its eyes in the initial
   viewer angle; the right opening is shallow at that angle. Three check rounds
   are exhausted; no fourth loop. Rotation works, no gameplay/save error found.

Ko-fi and payment servers stay skipped. Preserve gameplay, saves and the stable
root release; test URL remains https://benjg420.github.io/420mon-3D/test/.

### Completed packages — historical order superseded above

1. **DONE — PR #40 / v33:** correct retargeting and bone mapping for walking/running
   arms (T-pose) and the incorrectly bending knee. Inspect male/female player
   and NPCs with the shared rig; verify actual animated poses, not just clip
   names or static Idle. v33 adds explicit limb mapping, rotation-only target
   animation and phase-matched sprint blends shared by player/NPCs. Real GLTF
   full-cycle/skin/transition tests and game smoke passed after correcting the
   new skin fixture to world units. Final CI/Pages is recorded in the current
   publication note. Movement, editor,
   clothes and saves remain.
2. **DONE — PR #41 / v34:** the three physical
   Glutwalzen (Keller/Kino/Neonkai) open the original 420/Obststand/Freidreher
   games, with authentic strips, 20/5/9 lines, stakes, wild/scatter payouts,
   fruit nudge, double free spins and jackpot (10 Zero-Day seeds + 10 crown chips).
   Atomic booking prevents closing/reload loss or double payment. Unused free
   spins retain their locked stake/lines in isolated slotState. Original gold
   earnings/discovery counters and all existing saves/HP/mechanics remain.
   Auto/Stop, winning cells/line table, keyboard/touch and interaction guards
   are integrated. Three rounds completed; publication/checks recorded above.
3. **DONE — v35 Aquarium:** taller physical aquarium on its original footprint;
   interaction opens a lit 3D tank with swimming original fish artwork, one
   swimmer per caught species (0–42). Catalogue/bag remain available.
   GPU resources are released on close/tab change; DPR/30fps are bounded.
   The 42-fish collection, fishing, saves and bonuses remain unchanged.
4. **DONE — PR #43 / v36 Occlusion:** a body-sized visibility corridor fades occluding
   houses as complete groups (walls, plinth, roof and facade), including a
   camera inside the structure. Short hold and smooth recovery avoid flicker.
   Faded parts stop casting dark shadows; original opacity, depth and shadows
   return when clear or on map replacement. Camera, geometry, collision and
   all gameplay/save behavior remain unchanged.

### 6) DONE — PR #44 / v37 Joint und Bud konsumieren

Joint und Bud lassen sich im Inventar und im Kampf konsumieren. Originale
runtime.useItem/applySmoke-Regeln aus BenJG420/420mon (010807da77df8468a297adf33eaf1fb5c9a61c8b):
ein Item, stärkster Wert, getrennte Spielzeit-Uhren, maximal 600s Verlängerung;
Hybrid würfelt unterschiedliche Effekte, Zero-Day gewährt Fang/Tempo/Gold.
Vorhandene Fang-, Lauf-, Gold-, Loot- und EP-Verbraucher nutzen dieselben Felder
wie Fischboni. Mehr Wild bedeutet im vorhandenen 3D-Habitat kürzere Respawnzeit
für gewöhnliche Wildmonster. Kein neuer Begegnungsmodus. Konsum im Kampf kostet
keinen Zug; HP0/Team/Collection bleiben erhalten. Speicherfehler rollen Joint-/
Bud-Verbrauch und Effekte zurück. Ein Paket/PR; Prüfung/Veröffentlichung oben.

### 7) DONE — PR #45 / v38 Menü und Inventar nach dem 2D-Original

Pause-Menü nach originaler Reihenfolge (Hilfe, Leute/Chat, Nachrichten,
Änderungen, Inventar, Dex, Quests, Erfolge, Party, Weltkarte, Kapsel, Feedback,
Ton/Teilen/Konto/Weiter), bestehende 3D-Grafikeinstellung und Box/Editor erreichbar.
Inventar verwendet originale groupedInv/CAT_ORDER/CAT_LABEL/itemUseLabel:
einklappbare Kategorien, deutsche Namenssortierung, Arten-/Gesamtanzahl,
Einzelmengen, Itembeschreibung und separate Benutzen-Knöpfe. Heilitems öffnen
originalgetreu eine Partnerauswahl; k.o./volle Partner sind deaktiviert.
Unbekannte Legacy-Items bleiben unter Sonstiges sichtbar. Originalpalette und
360/520px/80dvh-Menürahmen; Tastatur I/B/M/H/T/Escape, Fokus und Touch bleiben.
**Online-Abgrenzung:** Leute/Chat, Nachrichten und Konto öffnen ausdrücklich das
2D-Original; kein eigener 3D-Chat-/Nachrichten-/Authserver und kein Save-Transfer.
Bestehende Spielmechaniken/Speicherplätze bleiben, Shop nur am physischen NPC.

### 5) DONE — PR #46 / v39 surface/PBR pass; individual remaining species NEXT

The rendering pass applies smooth, filtered PBR surfaces to all 420 models.
48 authored sculptures retain their distinct anatomy with denser curved parts
and a 30k-triangle ceiling. The remaining 372 render continuous marching-cubes
surfaces from their original silhouette/depth/color data, with smoothly
interpolated colors and normals, up to 24k triangles; they are explicitly
**reconstructions, not individually sculpted HD anatomy**. The retained voxel
files remain source/compatibility data; runtime rendering no longer emits
pixel-column faces. Original sprites and first-frame Dex portraits are intact.

Own deterministic normal/roughness tiles (1024 desktop / 512 mobile), projected
UVs and organic/wet/oxidized-metal variants support existing district reflections;
the temporary model viewer now has owned PMREM studio reflections. No forced
4K DPR/textures on phones. Existing bounded model cache, async/error/fallback
ownership and original source hashes remain. No mechanics or saves changed.

**DONE — PR #47 / v40 Dex #49–54:** Hawkerfox (orange fox face, torn purple mantle,
gold collar/amulet), Kiefhound (low quadruped with moss ridges/red eyes), Puffwraith
(skull cloud, curled smoke arms and wisp), Blazetail (scaled lizard with raised
layered flame tail), Rootroach (ribbed domed shell, six jointed legs, purple ports),
Crackveil (split luminous heart, fractured dark veil, zigzag lightning). Each has
its own geometry from the retained first pose and original source hash, uses the
existing PBR/UV/cache integration and stays below 30k triangles. Original 48
sculptures and all gameplay/save behavior remain unchanged.

**DONE — PR #48 / v41 Dex #55–60:** Portwolf (howling open jaws, layered mane,
cable loops), Fogbank (mist canopy, recessed yellow eyes, hanging wisps),
Dockclaw (cargo shell, red lights, jointed legs and open pincers), Flaskwyrm
(lime segmented caterpillar, bubble helmet/brim with drips), Velourfox
(seated purple fox, dark hood, gold crest/rings, curled lap tail), Rustmaw
(riveted rust plates, piston legs, mechanical eyes and separated toothed jaws).
Each is its own source-based mesh with original hash and existing PBR/UV/cache
integration; previous 54 sculptures and gameplay/saves remain unchanged.

**DONE — PR #49 / v42 Dex #61–66:** Harzback (amber resin shell,
leaf crown, pointed mask and purple roots), Lampjell (closed amber bell, lamp
eyes and violet tentacles), Curbowl (carved feather layers, round yellow eyes
and hooked beak), Tarslug (tar mound, eye stalks and orange fissures), Plugeel
(copper segments, pronged head, cyan eyes and yellow electric underside),
Lidtoad (green crouched toad, beige throat and radial manhole lid). Each uses
the real first pose, registered source hash and existing PBR/UV/cache path.
Previous 60 geometries and all gameplay/save behavior remain intact.

**DONE — PR #50 / v43 Dex #67–72:** Spilleye (tapered dripping slime,
recessed single eye), Gongling (round spun brass shell, rolled rims, carry handle,
feet and attached striker), Maskwisp (cracked ivory mask, deep purple eye sockets
and curling smoke), Lipkrait (coiled pink snake, segment bands, yellow eyes and
forked tongue), Magtick (open horseshoe magnet, rivets, inset eyes, jointed legs
and electric forearms), Valvekoi (orange-white koi, layered fins and valve wheel).
Each retains its actual first-pose reference/hash and existing PBR/UV/cache path.
Previous 66 geometries and all gameplay/save behavior remain intact.

**DONE — PR #51 / v44 Dex #73–78:** Pricecrow (layered dark feathers,
hooked beak, gripping toes and hanging price tag), Grafface (chipped concrete,
cracked capstones and dripping X-eye graffiti), Pitmaw (separate rim stones,
deep violet mouth bowl, inset eyes and inward fangs), Pothead (open terracotta
pot, soil, two-leaf sprout, eyes and feet), Rackfan (deep cabinet, blades behind
a grille, magenta windings and hub eyes), Matchimp (thin wooden limbs and
layered pointed flame head). Original first-pose/hash references and existing
PBR/UV/cache are preserved; previous 72 geometries and gameplay/saves remain.

**DONE — PR #52 / v45 Dex #79–84:** Fatcandle (thick wax, drips, wick
and flame), Fizzcap (green crown/cap, gold rim, eyes, feet and bubbles), Stoolpad
(red padded stool, narrowed eyes, metal legs and braces), Keywisp (gray keyhole
frame, purple spirit and bottom teeth), Boothdrape (magenta folds, eyes and
scalloped gold cords), Anvilant (six jointed legs, antennae and rusted anvil).
Original first-pose references/hashes and the shared PBR/UV/cache path remain;
previous 78 geometries, toolkit, renderer and gameplay/saves are unchanged.

**DONE — PR #53 / v46 Dex #85–90:** Bubstack (stacked pale bubbles,
drips and eyes), Hangscale (hook, circular dial, chains and hollow pans),
Curbcone (orange cone, white band, purple eyes and worn foot), Neonarrow
(magenta sign with cyan/white neon tubes), Clipin (wooden peg, visible spring
and green leaf), Heatsink (deep metal fins, orange eyes and violet arcs).
Original references/hashes and shared PBR/UV/cache remain; previous 84
geometries, toolkit, renderer and gameplay/saves are unchanged.

**DONE — PR #54 / v47 Dex #91–96:** Ashpan (hollow metal ashtray,
ash, cigarette ends and sleepy eyes), Ypipe (open forked pipe, collars and bolts),
Glovepair (two yellow gloves with separate fingers and cuff eyes), Taperoll
(open cardboard core, white roll and loose tape), Deadend (weathered red-white
sign and post), Spotlamp (round lens, magenta housing, neck and tripod).
Original references/hashes and shared PBR/UV/cache remain; previous 90
geometries, toolkit, renderer and gameplay/saves are unchanged.

**Monster erst nach Freigabe — explicit approval from Ben required even after fixes, GUI, performance and district detail:** individual
anatomy/detail work for the remaining **324 original species, starting Dex #97**,
following the 2D artwork and reference. Current
coverage is 96 authored / 324 smooth reconstructions.
This pass does not claim 420 individually sculpted/production-4K creatures.
Physical Android/native 4K visual/performance verification remains a device test.

**Übersprungen: Ko-fi und Zahlungsserver.** Do not investigate, configure or
re-enable payment services. Existing mechanics (districts, battles/capture,
Grow, mattresses, fishing, NPC shops/quests, achievements and saves) remain.
Previous v29 lighting/weather/post-processing and v30/v31 licensed rigs stay.

Each package gets one PR, at most three focused validation passes, an updated
handoff and explicit Remaining work. Do not ask routine questions; write a
one-line assumption and continue with the available evidence.

Physical Android performance and native 4K verification remain device tests;
Chromium touch emulation does not replace those. The stable root release and the
same `/test/` channel remain in place.


This release follows the user's request to limit technical verification to at
most three focused passes: automated regression/build, desktop/touch browser
smoke, and deployment verification. The Grow minigame has no new attempt limit.
The original engine was read from revision
010807da77df8468a297adf33eaf1fb5c9a61c8b. Deliberate bug fixes make positive stat
boosts target the user, bound stat stages and prevent HP0 actions/capture/revival
through level gains. No original private runtime URLs or credentials are shipped.
