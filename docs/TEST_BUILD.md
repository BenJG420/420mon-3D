# Original-world test build v21

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

## Validation and remaining work

`npm test` runs real TypeScript modules through Node's test runner. The current
suite has 48 regression tests covering 420 assets, restored source hashes, battle save
references, defeated HP, capture overflow, legacy/original save migration, Grow
rules, offline progress, all original map coordinates/68 transitions and world
interaction/resource ownership, source combat formulas/status/evolution and
inventory chip/healing integration. `npm run build` performs TypeScript and Vite
production checks. CI runs both commands.

This is a testable feature package, not the completed 2D-to-3D port. Trainer duels, multiplayer sparring, all quest/NPC actions, full achievement
progression/rewards, clothing visuals, fishing,
radio, story economics and individual 3D monster models still need deliberate
integration. Quest definitions and scene objects alone do not imply those
mechanics are complete. Physical Android performance and native 4K verification
remain device tests; desktop Chromium and touch emulation do not replace them.


This release follows the user's request to limit technical verification to at
most three focused passes: automated regression/build, desktop/touch browser
smoke, and deployment verification. The Grow minigame has no new attempt limit.
The original engine was read from revision
010807da77df8468a297adf33eaf1fb5c9a61c8b. Deliberate bug fixes make positive stat
boosts target the user, bound stat stages and prevent HP0 actions/capture/revival
through level gains. No original private runtime URLs or credentials are shipped.
