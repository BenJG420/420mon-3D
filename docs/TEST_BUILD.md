# Original-world test build v25

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
  and at the source eight-second interval. Future Felix/Eddi economy conditions
  remain unearned until their own listed package or an existing imported flag;
  achievement synchronization does not pretend those mechanics are implemented.

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

## Validation

`npm test` runs real TypeScript modules through Node's test runner. The current
suite has 100 regression tests covering 420 assets, restored source hashes, battle save
references, defeated HP, capture overflow, legacy/original save migration, Grow
rules, offline progress, all original map coordinates/68 transitions and world
interaction/resource ownership, source combat formulas/status/evolution and
inventory chip/healing integration, quest reward idempotence, turn-ins,
container cooldowns and story mattress/merchant actions, original fish schools,
cast settlement/refunds/recovery, fish-food buffs, the full aquarium Grow bonus,
trainer roster/daily settlement/one-time bonuses/gates and source save compatibility,
Nim team generation, movement, playtime cooldowns and HP0 preservation, all 420
original achievement predicates and save adapters, paid tips, exact-once single/
batch rewards, earning thresholds, movement/time counters and Moss-find history. `npm run build` performs TypeScript and Vite
production checks. CI runs both commands. For v25, the first pass completed all
100 tests and the production build. One Chromium touch smoke confirmed Can's
physical book, all 420 entries, pagination, hidden-secret search, a source-priced
75-Softcash tip, a 10-Softcash single claim and batch collection, persistence
without duplicate payment, and a read-only remote journal. HP0, XP and inventory
were unchanged; no page errors or horizontal overflow occurred. CI/Pages and
exact live artifact verification form the third and final pass.

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

## Remaining work — continue in this order

Quest/NPC package 1 is playable: source dialogue, turn-ins, loot, journal counters,
board rewards and the Lowtown thread chain are connected. This does not imply the
following separate mechanics are implemented. As recorded in CODEX_HANDOFF.md,
Felix/Eddi automation and the operational Ko-fi support economy belong to package
6; Rajko's radio remains reserved for its listed package.

Fishing package 2 is implemented in v23; its successful catches, failed casts,
food and aquarium collection share the existing save. Trainer package 3 is
implemented in v24: seven daily Kiez trainers, three one-time gate trainers and
Nim’s roaming multi-monster duels. Multiplayer sparring remains a separate source
network feature and is not claimed as implemented. Can package 4 is implemented
in v25: 420 original achievement pages, paid tips, durable individual/batch reward
claiming and a read-only menu journal. Continue with:

1. Next: equipped clothes visibly rendered on the character.
2. Radio and story economy, including Felix/Eddi automation and Ben's support
   backend. Ben's quest acknowledgement alone does not implement payments.
3. Individual 3D monster models following the retained source sprites.

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
