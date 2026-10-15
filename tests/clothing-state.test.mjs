import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
const clothing = await server.ssrLoadModule("/src/game/clothing-state.ts");
const { ITEMS } = await server.ssrLoadModule("/src/game/data/items.ts");
const achievements = await server.ssrLoadModule("/src/game/achievements.ts");
const { battleCatchBoost, battleGoldReward } = await server.ssrLoadModule("/src/game/battle-rewards.ts");
const state = extra => ({
  version: 2, captures: 0, wins: 0, balls: 3, team: [], box: [],
  collection: [], gold: 42, inventory: {}, quest: {}, quests: {},
  pots: [], potsUnlocked: 2, boxesUnlocked: 0, harvestedSeeds: [],
  boxHarvests: 0, stats: {}, schnittTitle: false, eddiIn: false,
  lastGrowAt: 0, deadWild: [], outfit: "nude", worn: [], ...extra,
});

test("only the ten source wear items can be equipped and keep their source names", () => {
  assert.deepEqual([...clothing.CLOTHING_IDS].sort(), [
    "wear_trashbag", "wear_collar", "wear_jacket", "wear_vest", "wear_coat",
    "wear_hoodie", "wear_track", "wear_rain", "wear_overalls", "wear_lack",
  ].sort());
  for (const id of clothing.CLOTHING_IDS) {
    assert.equal(ITEMS[id].cat, "wear");
    assert.equal(ITEMS[id].use, "wear");
    assert.equal(clothing.clothingId(id), id);
    assert.equal(clothing.clothingLabel(id), ITEMS[id].name);
  }
  assert.equal(clothing.clothingLabel("nude"), "Tanktop");
  assert.equal(clothing.clothingLabel("bag"), "Mülltüte");
});

test("source aliases and malformed outfits normalize without inventing ownership", () => {
  for (const raw of ["bag", "clothed"]) {
    const s = state({ outfit: raw, inventory: {}, worn: ["wear_hoodie", "wear_hoodie", 7, "nude", "wear_retired"] });
    assert.equal(clothing.normalizeClothing(s), true);
    assert.equal(s.outfit, "wear_trashbag");
    assert.deepEqual(s.worn, ["wear_hoodie", "wear_retired", "wear_trashbag"]);
    assert.deepEqual(s.inventory, {});
    const history = s.worn;
    assert.equal(clothing.normalizeClothing(s), false);
    assert.strictEqual(s.worn, history);
  }
  for (const raw of [undefined, null, "", false, 42, {}, [], "wear_unknown", "chip_junk", "__proto__"]) {
    const s = state({ outfit: raw, worn: null });
    assert.equal(clothing.clothingId(raw), "nude");
    assert.equal(clothing.normalizeClothing(s), true);
    assert.equal(s.outfit, "nude");
    assert.deepEqual(s.worn, []);
    assert.deepEqual(s.inventory, {});
  }
});

test("a previously equipped authentic item persists with zero inventory and remembers source history", () => {
  const s = state({ outfit: "wear_lack", inventory: { wear_lack: 0 }, worn: ["wear_coat"], extension: { untouched: true } });
  assert.equal(clothing.normalizeClothing(s), true);
  assert.equal(s.outfit, "wear_lack");
  assert.deepEqual(s.worn, ["wear_coat", "wear_lack"]);
  assert.deepEqual(s.inventory, { wear_lack: 0 });
  assert.deepEqual(s.extension, { untouched: true });
  assert.equal(clothing.normalizeClothing(s), false);
  assert.equal(clothing.toggleClothing(s, "nude").ok, true);
  assert.equal(s.outfit, "nude");
  assert.deepEqual(s.worn, ["wear_coat", "wear_lack"]);
});

test("equipping, replacing and toggling source clothes never consumes items or changes partners", () => {
  const s = state({
    inventory: Object.fromEntries(clothing.CLOTHING_IDS.map(id => [id, 1])),
    team: [{ id: "mon_budling", hp: 0, hpMax: 120, level: 5, xp: 17, status: "poison" }],
    box: [{ id: "mon_puffpuff", hp: 0, hpMax: 30, level: 2, xp: 9 }],
    party: [{ id: "mon_budling", hp: 0, level: 5, xp: 17 }],
    quests: { q1_bolt: "done" }, originalExtension: { keep: [1, 2] },
  });
  const before = structuredClone(s);
  const team = s.team, partner = s.team[0], inventory = s.inventory;
  for (const id of clothing.CLOTHING_IDS) {
    const equip = clothing.toggleClothing(s, id);
    assert.equal(equip.ok, true);
    assert.equal(equip.outfit, id);
    assert.equal(s.outfit, id);
    assert.ok(s.worn.includes(id));
    assert.equal(clothing.toggleClothing(s, id).outfit, "nude");
    assert.equal(s.outfit, "nude");
    assert.equal(clothing.toggleClothing(s, id).ok, true);
  }
  assert.deepEqual(s.worn, clothing.CLOTHING_IDS);
  assert.strictEqual(s.team, team);
  assert.strictEqual(s.team[0], partner);
  assert.strictEqual(s.inventory, inventory);
  const { outfit: _oldOutfit, worn: _oldWorn, ...restBefore } = before;
  const { outfit: _newOutfit, worn: _newWorn, ...restAfter } = s;
  assert.deepEqual(restAfter, restBefore);
});

test("invalid or unowned inputs cannot equip, consume, grant history or silently undress", () => {
  for (const raw of [undefined, null, 42, {}, [], "wear_missing", "chip_junk", "seed_ordinary", "__proto__", "constructor"]) {
    const s = state({ outfit: "wear_vest", inventory: { chip_junk: 3, seed_ordinary: 2 } });
    const before = structuredClone(s);
    assert.equal(clothing.toggleClothing(s, raw).ok, false);
    assert.deepEqual(s, before);
  }
  for (const count of [undefined, 0, -1, .5, "1", NaN, Infinity, -Infinity]) {
    const s = state({ outfit: "wear_vest", inventory: { wear_jacket: count } });
    const before = structuredClone(s);
    assert.equal(clothing.toggleClothing(s, "wear_jacket").ok, false);
    assert.deepEqual(s, before);
  }
});

test("the T shortcut removes any clothes and equips only an owned original trashbag", () => {
  const s = state({ outfit: "wear_collar", inventory: { wear_trashbag: 1, wear_collar: 0 }, worn: ["wear_collar"] });
  assert.equal(clothing.toggleBag(s).outfit, "nude");
  assert.equal(clothing.toggleBag(s).outfit, "wear_trashbag");
  assert.deepEqual(s.worn, ["wear_collar", "wear_trashbag"]);
  assert.equal(clothing.toggleClothing(s, "bag").outfit, "nude");
  assert.equal(clothing.toggleClothing(s, "clothed").outfit, "wear_trashbag");
  assert.deepEqual(s.inventory, { wear_trashbag: 1, wear_collar: 0 });
  assert.equal(clothing.toggleBag(s).outfit, "nude");
  s.inventory.wear_trashbag = 0;
  const before = structuredClone(s);
  assert.equal(clothing.toggleBag(s).ok, false);
  assert.deepEqual(s, before);
});

test("unwrapping preserves the source achievement history after save serialization", () => {
  const s = state({ inventory: { wear_trashbag: 1, wear_collar: 1, wear_jacket: 1 } });
  for (const id of ["wear_trashbag", "wear_collar", "wear_jacket"]) assert.equal(clothing.toggleClothing(s, id).ok, true);
  assert.equal(clothing.toggleClothing(s, "nude").ok, true);
  const reloaded = JSON.parse(JSON.stringify(s));
  clothing.normalizeClothing(reloaded);
  achievements.syncAchievements(reloaded);
  assert.equal(reloaded.outfit, "nude");
  assert.equal(reloaded.ach.bag_life, "done");
  assert.equal(reloaded.ach.fit_wear_collar, "done");
  assert.equal(reloaded.ach.fit_wear_jacket, "done");
  assert.deepEqual(achievements.achievementSnapshot(reloaded).worn, ["wear_trashbag", "wear_collar", "wear_jacket"]);
  assert.deepEqual(reloaded.inventory, s.inventory);
});

test("visible equipment keeps the unchanged original Fang and Gold calculations", () => {
  const s = state({ inventory: { wear_collar: 1, wear_jacket: 1, wear_vest: 1, wear_overalls: 1 }, map: "market" });
  clothing.toggleClothing(s, "wear_collar");
  assert.equal(battleCatchBoost(s), 1.05 * 1.06);
  clothing.toggleClothing(s, "wear_jacket");
  assert.equal(battleCatchBoost(s), 1.08);
  s.map = "ring";
  clothing.toggleClothing(s, "wear_vest");
  assert.equal(battleCatchBoost(s), 1.06);
  assert.equal(battleGoldReward(s, 100), Math.round(100 * 1.15 * 1.06));
  s.map = "yard";
  clothing.toggleClothing(s, "wear_overalls");
  assert.equal(battleGoldReward(s, 100), Math.round(100 * 1.08 * 1.12));
});

test("original outfit aliases import and persist through the shared save without changing the original slot", async () => {
  const original = {
    party: [{ uid: "original-partner", id: "mon_budling", level: 5, xp: 17, hp: 0, hpMax: 120 }],
    box: [], caught: ["mon_budling"], gold: 777,
    inv: { wear_trashbag: 1, wear_collar: 1, seed_ordinary: 3 },
    outfit: "clothed", worn: ["wear_coat"],
    map: "capsule", x: 150, y: 130, lastUnix: 100,
    quests: { legacy_extension: "keep" }, originalExtension: { preserved: true },
  };
  const source = JSON.stringify(original);
  const slots = new Map([["420mon_save_v1", source]]);
  globalThis.localStorage = { getItem: key => slots.get(key) ?? null, setItem: (key, value) => slots.set(key, value) };
  globalThis.window = new EventTarget();
  const save = await server.ssrLoadModule("/src/game/save.ts");
  const s = save.getSave();
  assert.equal(s.outfit, "wear_trashbag");
  assert.deepEqual(s.worn, ["wear_coat", "wear_trashbag"]);
  assert.equal(s.ach.bag_life, "done");
  assert.deepEqual(s.inventory, original.inv);
  const loadedGold = s.gold; // Existing quest recovery can pay on import.
  const partner = s.team[0];
  assert.equal(clothing.toggleClothing(s, "wear_collar").ok, true);
  assert.equal(save.saveProgress(), true);
  assert.strictEqual(s.team[0], partner);
  const persisted = JSON.parse(slots.get(save.SAVE_KEY));
  assert.equal(persisted.outfit, "wear_collar");
  assert.deepEqual(persisted.worn, ["wear_coat", "wear_trashbag", "wear_collar"]);
  assert.equal(persisted.ach.fit_wear_collar, "done");
  assert.deepEqual(persisted.originalExtension, original.originalExtension);
  assert.deepEqual(persisted.party, original.party);
  assert.equal(persisted.quests.legacy_extension, "keep");
  assert.equal(persisted.gold, loadedGold);
  assert.deepEqual(persisted.inventory, original.inv);
  assert.equal(persisted.team[0].hp, 0);
  assert.equal(persisted.team[0].xp, 17);
  assert.equal(slots.get("420mon_save_v1"), source);
  const reloadedApi = await server.ssrLoadModule("/src/game/save.ts?clothing-state-reload");
  const reloaded = reloadedApi.getSave();
  assert.equal(reloaded.outfit, "wear_collar");
  assert.equal(reloaded.team[0].hp, 0);
  assert.deepEqual(reloaded.worn, persisted.worn);
  assert.deepEqual(reloaded.inventory, persisted.inventory);
});
