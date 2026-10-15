import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
const achievements = await server.ssrLoadModule("/src/game/achievements.ts");
const { ACH_DEFS, achMet } = await server.ssrLoadModule("/src/game/data/achievements.ts");
const { DEX_ORDER } = await server.ssrLoadModule("/src/game/data/dex.ts");
const { STRAINS, UNIQUE_FIND } = await server.ssrLoadModule("/src/game/data/items.ts");
const { DISTRICTS } = await server.ssrLoadModule("/src/game/data/zones.ts");
const grow = await server.ssrLoadModule("/src/game/grow-state.ts");
const mon = (id = DEX_ORDER[0], extra = {}) => ({
  id, name: "Partner", level: 1, xp: 23, hp: 0, hpMax: 52,
  ivs: { hp: 20, atk: 30, def: 40, spa: 50, spd: 60, spe: 70 }, ...extra,
});
const state = extra => ({
  version: 2, captures: 0, wins: 0, balls: 3, team: [], box: [],
  collection: [], gold: 0, inventory: {}, quest: {}, quests: {},
  pots: [], potsUnlocked: 2, boxesUnlocked: 0, harvestedSeeds: [],
  boxHarvests: 0, stats: {}, schnittTitle: false, eddiIn: false,
  lastGrowAt: 0, deadWild: [], ach: {}, achTips: [], achClaimed: [], worn: [],
  ...extra,
});
function freeze(value) {
  if (value && typeof value === "object") { Object.freeze(value); for (const child of Object.values(value)) freeze(child); }
  return value;
}

test("all 420 original achievements use their original predicates across every family", () => {
  assert.equal(ACH_DEFS.length, 420);
  assert.equal(new Set(ACH_DEFS.map(def => def.id)).size, 420);
  const s = state({
    collection: [...DEX_ORDER], seen: [...DEX_ORDER],
    team: DEX_ORDER.slice(0, 6).map(id => mon(id, { level: 420, ivs: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 } })),
    box: DEX_ORDER.slice(6, 26).map(id => mon(id, { level: 420 })),
    stats: Object.fromEntries(["battlesWon", "monsCaught", "binsSearched", "budsSold", "plantsHarvested", "goldEarned", "steps", "nudeSeconds", "sexEvents", "chipsUsed"].map(key => [key, 1e6])),
    quests: Object.fromEntries([...Array.from({ length: 24 }, (_, i) => `quest_${i}`), "q1_bolt", "q2_harvest", "q3_trash", "q4_fight", "q5_silk", "q6_nude", "q7_grow", "q8_mattress", "q9_static", "q10_lowtown"].map(id => [id, "done"])),
    visitedMaps: ["alley", "yard", "cable", ...DISTRICTS.map(d => d.map).filter(Boolean), ...ACH_DEFS.filter(def => def.id.startsWith("visit_")).map(def => def.id.slice(6))],
    deadWild: ["cinder", "tide", "vial", "knuckle", "hush", "glow", "coil"],
    trainerLv: 420, gold: 100000, potsUnlocked: 6, boxesUnlocked: 3,
    harvestedSeeds: STRAINS.map(strain => `seed_${strain.id}`),
    catchPerm: 1.5, flagLowtown: true, leftCapsuleNude: true,
    felixHired: true, eddiIn: true, schnittTitle: true,
    starterId: DEX_ORDER[0], playtime: 1e6, foundLoot: [...UNIQUE_FIND],
    worn: ["wear_trashbag", "wear_collar", "wear_hoodie", "wear_jacket", "wear_track", "wear_rain", "wear_overalls", "wear_coat", "wear_vest"],
  });
  const snap = achievements.achievementSnapshot(s);
  const expected = ACH_DEFS.filter(def => achMet(snap, def.id)).map(def => def.id);
  assert.equal(expected.length, 419, "Silk's explicitly granted source achievement has no predicate");
  assert.deepEqual(achievements.syncAchievements(s), expected);
  assert.equal(s.ach.silk_deal, undefined);
  assert.deepEqual(achievements.syncAchievements(s), []);
  assert.deepEqual(achievements.achievementCounts(s), { done: 419, total: 420, claimable: 419, claimed: 0, tips: 0 });
});

test("the read-only adapter combines current and legacy Dex history without counting fish or unknown species", () => {
  const s = state({
    collection: [DEX_ORDER[0], "fish_neonbrasse", "bogus"],
    caught: [DEX_ORDER[1], DEX_ORDER[0]], seen: [DEX_ORDER[2], "fish_kanalgrundel"],
    team: [mon(DEX_ORDER[3]), mon("fish_neonbrasse")],
    box: [mon(DEX_ORDER[4]), mon("unknown")],
    wins: 9, captures: 7, stats: { battlesWon: 11, monsCaught: 2, goldEarned: NaN, steps: -5 },
    fishCaught: { fish_neonbrasse: 420 }, inventory: { potion_patch: 2 },
  });
  const before = structuredClone(s);
  freeze(s);
  const snap = achievements.achievementSnapshot(s);
  assert.deepEqual(new Set(snap.caught), new Set(DEX_ORDER.slice(0, 5).filter((_, i) => i !== 2)));
  assert.deepEqual(new Set(snap.seen), new Set(DEX_ORDER.slice(0, 5)));
  assert.equal(snap.party.length, 1);
  assert.equal(snap.box.length, 1);
  assert.equal(snap.stats.battlesWon, 11);
  assert.equal(snap.stats.monsCaught, 7);
  assert.equal(snap.stats.goldEarned, 0);
  assert.equal(snap.stats.steps, 0);
  snap.party[0].ivs.hp = 99;
  snap.caught.push(DEX_ORDER[10]);
  assert.deepEqual(s, before);
});

test("legacy 2D party and stat fields remain valid achievement inputs", () => {
  const s = state({ party: [mon(DEX_ORDER[0], { level: 50 })], caught: [DEX_ORDER[1]], stats: { battlesWon: 3, monsCaught: 6 } });
  delete s.team;
  const snap = achievements.achievementSnapshot(s);
  assert.equal(snap.party[0].id, DEX_ORDER[0]);
  assert.equal(achMet(snap, "lv_50"), true);
  assert.equal(achMet(snap, "chips_5"), true);
  assert.equal(achMet(snap, "win_3"), true);
});

test("normalization preserves earned flags and extensions, deduplicates valid claims and tracks source clothing", () => {
  const s = state({
    ach: { first_step: "done", first_fight: "locked", catch_1: true, silk_deal: "done", future_extension: { keep: true } },
    achTips: ["first_fight", "first_fight", "unknown", 7],
    achClaimed: ["first_step", "first_step", "unknown", false],
    worn: ["wear_hoodie", "wear_hoodie", "nude", 5], outfit: "bag",
  });
  assert.equal(achievements.ensureAchievementState(s), true);
  assert.deepEqual(s.achTips, ["first_fight"]);
  assert.deepEqual(s.achClaimed, ["first_step"]);
  assert.deepEqual(s.worn, ["wear_hoodie", "wear_trashbag"]);
  assert.equal(s.ach.catch_1, undefined);
  assert.deepEqual(s.ach.future_extension, { keep: true });
  assert.equal(achievements.ensureAchievementState(s), false);
  achievements.syncAchievements(s);
  assert.equal(s.ach.first_step, "done", "a previously earned achievement survives a snapshot below its threshold");
  assert.equal(s.ach.silk_deal, "done", "the original explicit Silk grant must survive sync");
  s.outfit = "wear_rain";
  assert.equal(achievements.ensureAchievementState(s), true);
  assert.ok(s.worn.includes("wear_rain"));
});

test("malformed achievement containers recover without damaging another system's state", () => {
  const s = state({ ach: [], achTips: null, achClaimed: "first_step", worn: {}, inventory: { seed_ordinary: 2 } });
  assert.equal(achievements.ensureAchievementState(s), true);
  assert.deepEqual(s.ach, {});
  assert.deepEqual(s.achTips, []);
  assert.deepEqual(s.achClaimed, []);
  assert.deepEqual(s.inventory, { seed_ordinary: 2 });
  assert.equal(achievements.ensureAchievementState(s), false);
  for (const outfit of [42, {}, [], null]) {
    s.outfit = outfit;
    assert.equal(achievements.ensureAchievementState(s), false);
    assert.equal(achievements.achievementSnapshot(s).outfit, undefined);
    assert.doesNotThrow(() => achievements.syncAchievements(s));
  }
});

test("a real Moss harvest records its original loot achievement without reviving or training an HP-zero partner", () => {
  const s = state({ team: [mon()], inventory: { seed_moss: 1 }, growInitialized: true, eddiSeed: true });
  grow.ensureGrowState(s, 1000);
  assert.equal(grow.plantPot(s, 0, "seed_moss").ok, true);
  s.pots[0].timeLeft = 0;
  grow.refreshPot(s.pots[0]);
  const before = structuredClone(s.team);
  const result = grow.harvestPot(s, 0, () => 1);
  assert.equal(result.ok, true);
  assert.equal(result.budId, "bud_moss");
  assert.ok(s.inventory.bud_moss > 0);
  assert.deepEqual(s.foundLoot, ["bud_moss"]);
  assert.ok(achievements.syncAchievements(s).includes("loot_bud_moss"));
  assert.equal(s.ach.loot_bud_moss, "done");
  assert.deepEqual(s.team, before);
  assert.equal(grow.harvestPot(s, 0).ok, false);
  assert.deepEqual(s.foundLoot, ["bud_moss"]);
});

test("Can sells the source tip exactly once and refuses unknown, earned or unaffordable pages", () => {
  const ordinary = ACH_DEFS.find(def => def.id === "fight_10");
  const secret = ACH_DEFS.find(def => def.id === "nude_start");
  assert.equal(secret.price, 75);
  const s = state({ gold: ordinary.price + secret.price });
  assert.equal(achievements.buyAchievementTip(s, ordinary.id).ok, true);
  assert.equal(s.gold, secret.price);
  assert.equal(achievements.buyAchievementTip(s, ordinary.id).ok, false);
  assert.equal(s.gold, secret.price);
  assert.equal(achievements.buyAchievementTip(s, secret.id).ok, true);
  assert.equal(s.gold, 0);
  assert.equal(achievements.buyAchievementTip(s, "catch_420").ok, false);
  assert.equal(achievements.buyAchievementTip(s, "unknown").ok, false);
  s.ach.first_step = "done";
  s.gold = 100;
  assert.equal(achievements.buyAchievementTip(s, "first_step").ok, false);
  assert.equal(s.gold, 100);
  assert.deepEqual(s.achTips, [ordinary.id, secret.id]);
});

test("legacy completed pages pay one fixed reward, with HP-zero partners and all items untouched", () => {
  const s = state({
    ach: { first_step: "done", nude_start: "done" },
    team: [mon()], box: [mon(DEX_ORDER[1])],
    gold: 3, stats: { goldEarned: 8 }, outfit: "wear_track",
    inventory: { potion_patch: 2, seed_ordinary: 1 },
  });
  const team = structuredClone(s.team), box = structuredClone(s.box), inventory = structuredClone(s.inventory);
  assert.equal(achievements.achievementReward("first_step"), 10);
  assert.equal(achievements.achievementReward(ACH_DEFS.find(def => def.id === "nude_start")), 25);
  assert.deepEqual(achievements.claimAchievementReward(s, "first_step"), { ok: true, gold: 10, lines: ["Can: Barfuß in Lowtown. 10 Softcash für dich."] });
  assert.equal(achievements.claimAchievementReward(s, "nude_start").gold, 25);
  assert.equal(s.gold, 38);
  assert.equal(s.stats.goldEarned, 43);
  const persisted = JSON.parse(JSON.stringify(s));
  assert.equal(achievements.claimAchievementReward(persisted, "first_step").ok, false);
  assert.equal(achievements.claimAchievementReward(persisted, "nude_start").ok, false);
  assert.equal(persisted.gold, 38);
  assert.deepEqual(s.team, team);
  assert.deepEqual(s.box, box);
  assert.deepEqual(s.inventory, inventory);
});

test("locked and unknown pages cannot pay, and ownership cannot be forged through the reward helper", () => {
  const s = state({ gold: 19 });
  assert.equal(achievements.claimAchievementReward(s, "catch_420").ok, false);
  assert.equal(achievements.claimAchievementReward(s, "not_a_page").ok, false);
  assert.equal(s.gold, 19);
  assert.deepEqual(s.achClaimed, []);
  assert.equal(achievements.achievementReward("not_a_page"), 0);
  assert.equal(achievements.achievementReward({ id: "first_step", secret: true }), 10);
});

test("only actually collected rewards advance earning thresholds; newly unlocked pages require their own claim", () => {
  const s = state({ gold: 0, stats: { goldEarned: 995 }, ach: { first_step: "done" } });
  achievements.syncAchievements(s);
  assert.equal(s.ach.gold_1000, undefined);
  assert.equal(s.gold, 0);
  assert.equal(s.stats.goldEarned, 995);
  assert.equal(achievements.claimAchievementReward(s, "first_step").ok, true);
  assert.equal(s.ach.gold_1000, "done");
  assert.equal(s.gold, 10);
  assert.equal(s.stats.goldEarned, 1005);
  assert.deepEqual(s.achClaimed, ["first_step"]);
  assert.equal(achievements.claimAchievementReward(s, "gold_1000").gold, 10);
  assert.equal(s.gold, 20);
  assert.equal(s.stats.goldEarned, 1015);
  assert.equal(achievements.claimAchievementReward(s, "gold_1000").ok, false);
});

test("batch collection pays each legacy page once across callbacks and reloads", () => {
  const s = state({ ach: { first_step: "done", nude_start: "done" } });
  const result = achievements.claimAchievementRewards(s);
  assert.equal(result.ok, true);
  assert.equal(result.count, 2);
  assert.equal(result.gold, 35);
  assert.equal(s.gold, 35);
  assert.equal(s.stats.goldEarned, 35);
  assert.deepEqual(new Set(s.achClaimed), new Set(["first_step", "nude_start"]));
  const repeated = achievements.claimAchievementRewards(s);
  assert.equal(repeated.ok, false);
  assert.equal(repeated.count, 0);
  assert.equal(repeated.gold, 0);
  const reloaded = JSON.parse(JSON.stringify(s));
  assert.equal(achievements.claimAchievementRewards(reloaded).gold, 0);
  assert.equal(achievements.claimAchievementReward(reloaded, "first_step").ok, false);
  assert.equal(achievements.claimAchievementReward(reloaded, "nude_start").ok, false);
  assert.equal(reloaded.gold, 35);
  assert.equal(reloaded.stats.goldEarned, 35);
});

test("a batch snapshots available pages before payment and leaves new earning thresholds for a later claim", () => {
  const s = state({ gold: 0, stats: { goldEarned: 995 }, ach: { first_step: "done" } });
  const result = achievements.claimAchievementRewards(s);
  assert.equal(result.count, 4, "first step plus the three earning thresholds already reached at 995");
  assert.equal(result.gold, 40);
  assert.equal(s.gold, 40);
  assert.equal(s.stats.goldEarned, 1035);
  assert.equal(s.ach.gold_1000, "done");
  assert.equal(s.achClaimed.includes("gold_1000"), false);
  assert.deepEqual(new Set(s.achClaimed), new Set(["first_step", "earn_100", "earn_400", "earn_800"]));
  const next = achievements.claimAchievementRewards(s);
  assert.equal(next.count, 1);
  assert.equal(next.gold, 10);
  assert.equal(s.gold, 50);
  assert.equal(s.stats.goldEarned, 1045);
  assert.equal(achievements.claimAchievementRewards(s).gold, 0);
});
