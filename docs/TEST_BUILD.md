# Original-world test build v23

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

## Validation

`npm test` runs real TypeScript modules through Node's test runner. The current
suite has 65 regression tests covering 420 assets, restored source hashes, battle save
references, defeated HP, capture overflow, legacy/original save migration, Grow
rules, offline progress, all original map coordinates/68 transitions and world
interaction/resource ownership, source combat formulas/status/evolution and
inventory chip/healing integration, quest reward idempotence, turn-ins,
container cooldowns and story mattress/merchant actions, original fish schools,
cast settlement/refunds/recovery, fish-food buffs and the full aquarium Grow bonus. `npm run build` performs TypeScript and Vite
production checks. CI runs both commands. For v23, one touch smoke confirmed the physical rod,
wheel catch, fish food, timing-miss/close seed refunds and saved collection after
reload. The final aquarium step selected the preserved nearby fishing pad at the
fixture position; the third deployment check approaches the tank from its right
side. No full smoke loop was repeated.

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
6; Can, trainer challenges and Rajko's radio are reserved for their listed packages.

Fishing package 2 is implemented in v23; its successful catches, failed casts,
food and aquarium collection share the existing save. Continue with:

1. Next: trainer battles; multiplayer sparring remains a separate source feature.
2. Can in the cellar — all 420 achievements and actual reward claiming.
3. Equipped clothes visibly rendered on the character.
4. Radio and story economy, including Felix/Eddi automation and Ben's support
   backend. Ben's quest acknowledgement alone does not implement payments.
5. Individual 3D monster models following the retained source sprites.

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
