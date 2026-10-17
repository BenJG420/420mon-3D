> Current instruction: finish existing PR #39 first, then Bens Fix-Liste below.
> Older stop/publication notes below are historical and superseded by this order.

> **v32 is DRAFT in PR #39, not deployed.** Three check rounds exhausted; CI
> 39066240154 passed 161/162, failing only Coinwraith’s existing 15k-triangle
> ceiling. Reduced its coins from 18 to 13 without raising that ceiling; this
> correction and preserved editor head scaling are not re-tested. Resume and
> finish PR #39 first. Live `/test/` remains v31 (PR #38); its human pose fix
> is included in the open v32 package.

> v32: 24 further individual source-sprite sculptures; 48 authored / 372 reconstructed.
> Also corrects human animation rest-basis transfer found in the v31 close view.

> v31: Rigged NPC graphics package; v30 player published via PR #37.

> v30: Licensed rigged player package; publication/check notes follow in the handoff.

# Original-world test build v29

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
- Licensed rigged player and NPC replacements are deliberately next, followed
  by individual monster refinement. No external character asset is introduced
  here; current procedural asset provenance is in [ASSET_ATTRIBUTION.md](ASSET_ATTRIBUTION.md).

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
    The first 24 entries use individual sculptures; other entries identify their
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

## Validation

`npm test` runs real TypeScript modules through Node's test runner. The current
suite has 161 regression tests covering 420 assets, restored source hashes, battle save
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

## Remaining work — Bens Fix-Liste (2026-10-17)

First finish and merge the **existing PR #39** (v32, Dex #25–48 and initial
human pose transfer). Do not replace it or start another monster batch first.
The owner explicitly requested this continuation; use at most three focused
closing checks in this run and record their results.

Then deliver these playable packages in this exact order, **one PR per package**:

1. **v30 animation bug:** correct retargeting and bone mapping for walking/running
   arms (T-pose) and the incorrectly bending knee. Inspect male/female player
   and NPCs with the shared rig; verify actual animated poses, not just clip
   names or static Idle. Preserve movement, editor, clothes and saves.
2. **Slot machines:** repair the existing original 2D-based Spielautomaten;
   retain their authentic rules and existing save/economy semantics.
3. **Aquarium:** enlarge the physical aquarium and open a dedicated view when
   clicked/interacted with, showing the player's caught fish swimming. Preserve
   the 42-fish catalogue, collection, fishing and bonuses.
4. **Occlusion:** when the player is behind a house, fade occluding buildings
   or render a visible silhouette. Preserve camera/geometry/collision behavior.
5. **Monster HD/4K art pass:** detailed meshes, PBR textures and smooth shading,
   with no pixel-style world models, following the README graphics reference.
   Then continue the remaining original-sprite monster species. Keep the 420
   pipeline, cache, viewer and original Dex portraits. v32 aims for 48 authored
   sculptures and 372 volume reconstructions; do not claim all 420 are sculpted
   or HD/PBR already. Native 4K/mobile performance needs real device feedback.

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
