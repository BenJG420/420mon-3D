import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname, base: "/420mon-3D/test/",
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
const { quoteTrade, executeTrade } = await server.ssrLoadModule("/src/game/trade-state.ts");
const merchant = await server.ssrLoadModule("/src/game/merchant-state.ts");
const grow = await server.ssrLoadModule("/src/game/grow-state.ts");
const { ITEMS, STALL_GROW } = await server.ssrLoadModule("/src/game/data/items.ts");
const { normalizeClothing } = await server.ssrLoadModule("/src/game/clothing-state.ts");
const { syncQuests } = await server.ssrLoadModule("/src/game/quests.ts");
const { syncAchievements } = await server.ssrLoadModule("/src/game/achievements.ts");
const MAX = Number.MAX_SAFE_INTEGER;
const buy = { kind: "buy", id: "potion_patch", items: ["potion_patch"] };
const sell = { kind: "sell", id: "potion_patch", sellMultiplier: 1 };
const caps = { kind: "capsule", id: "capsule" };
const state = extra => ({
  version: 2, captures: 0, wins: 0, balls: 3, collection: [], gold: 400,
  inventory: {}, quest: {}, quests: {}, stats: {}, deadWild: [],
  team: [{ uid: "ko", id: "mon_puffpuff", name: "Puffpuff", level: 5, hp: 0, hpMax: 50, xp: 17 }],
  box: [{ uid: "box-ko", id: "mon_budling", name: "Budling", level: 2, hp: 0, hpMax: 30, xp: 9 }],
  pots: [{ id: 0, seed: "seed_ordinary", fert: "", phase: "grow", timeLeft: 123, total: 300 }],
  potsUnlocked: 2, boxesUnlocked: 0, harvestedSeeds: [], boxHarvests: 0,
  schnittTitle: false, eddiIn: false, lastGrowAt: 0, growInitialized: true,
  outfit: "wear_trashbag", worn: [], map: "capsule", originalExtension: { keep: [1, 2] }, ...extra,
});
function confirm(s, offer, quantity, persist = () => true) {
  const quote = quoteTrade(s, offer, quantity);
  assert.equal(quote.ok, true, quote.reason);
  return executeTrade(s, offer, quantity, quote.unitPrice, persist);
}
function persistedNormalization(s) {
  normalizeClothing(s); syncQuests(s); syncAchievements(s);
}

test("quotes are read-only and quantity totals/max use current funds, stock and each shop's prices", () => {
  const s = state({ gold: 103, inventory: { potion_patch: 7, bud_ordinary: 5 } });
  const before = structuredClone(s);
  assert.deepEqual(Object.fromEntries(["ok", "max", "unitPrice", "total"].map(key => [key, quoteTrade(s, buy, 3)[key]])),
    { ok: true, max: 6, unitPrice: 16, total: 48 });
  const capQuote = quoteTrade(s, caps, 4);
  assert.equal(capQuote.max, 4); assert.equal(capQuote.unitPrice, 25); assert.equal(capQuote.total, 100);
  const sale = quoteTrade(s, sell, 7);
  assert.equal(sale.max, 7); assert.equal(sale.unitPrice, 5); assert.equal(sale.total, 35);
  const id = STALL_GROW[0], seed = quoteTrade(s, { kind: "grow-buy", id }, 1);
  assert.equal(seed.unitPrice, ITEMS[id].buy); assert.equal(seed.max, Math.floor(s.gold / ITEMS[id].buy));
  const bud = quoteTrade(s, { kind: "grow-sell", id: "bud_ordinary" }, 5);
  assert.equal(bud.unitPrice, Math.max(1, Math.round(ITEMS.bud_ordinary.sell * .95)));
  assert.equal(bud.total, bud.unitPrice * 5);
  assert.deepEqual(s, before);
});

test("invalid quantities, unaffordable selections and corrupt balances cannot write or partially trade", () => {
  const invalid = [0, -1, .5, NaN, Infinity, -Infinity, MAX + 1, "2", null];
  let writes = 0;
  for (const quantity of invalid) for (const offer of [buy, sell, caps]) {
    const s = state({ inventory: { potion_patch: 10 } }), before = structuredClone(s);
    assert.equal(quoteTrade(s, offer, quantity).ok, false);
    assert.equal(executeTrade(s, offer, quantity, 16, () => { writes++; return true; }).ok, false);
    assert.deepEqual(s, before);
  }
  for (const gold of [NaN, Infinity, -1, .5, MAX + 1]) {
    const s = state({ gold }), before = structuredClone(s);
    assert.equal(executeTrade(s, buy, 1, 16, () => { writes++; return true; }).ok, false);
    assert.deepEqual(s, before);
  }
  for (const count of [NaN, Infinity, -1, .5, MAX + 1]) {
    const s = state({ inventory: { potion_patch: count } }), before = structuredClone(s);
    for (const offer of [buy, sell]) assert.equal(executeTrade(s, offer, 1, 5, () => { writes++; return true; }).ok, false);
    assert.deepEqual(s, before);
  }
  const poor = state({ gold: 15 }), outOfStock = state({ inventory: { potion_patch: 2 } });
  assert.equal(quoteTrade(poor, buy, 1).max, 0);
  assert.equal(executeTrade(poor, buy, 1, 16, () => { writes++; return true; }).ok, false);
  assert.equal(executeTrade(outOfStock, sell, 3, 5, () => { writes++; return true; }).ok, false);
  assert.equal(writes, 0);
});

test("offers reject unknown/prototype IDs, unlisted stock and wrong merchant categories", () => {
  const offers = [
    ...["__proto__", "constructor", "toString", "does_not_exist"].flatMap(id => [
      { kind: "buy", id, items: [id] }, { kind: "sell", id }, { kind: "grow-buy", id }, { kind: "grow-sell", id },
    ]),
    { ...buy, items: [] }, { kind: "buy", id: "potion_patch" },
    { kind: "buy", id: "key_stick", items: ["key_stick"] },
    { kind: "grow-buy", id: "potion_patch" }, { kind: "grow-sell", id: "potion_patch" },
    { kind: "capsule", id: "potion_patch" }, { kind: "invalid", id: "potion_patch" },
    ...[0, -1, NaN, Infinity].map(sellMultiplier => ({ ...sell, sellMultiplier })),
  ];
  for (const offer of offers) {
    const s = state({ inventory: { potion_patch: 9, key_stick: 1 } }), before = structuredClone(s);
    assert.equal(quoteTrade(s, offer, 1).ok, false, JSON.stringify(offer));
    assert.equal(executeTrade(s, offer, 1, 1, () => assert.fail("invalid offers never persist")).ok, false);
    assert.deepEqual(s, before);
  }
});

test("bulk purchases book one total and one save while preserving live party and pot references", () => {
  const s = state({ gold: 400, inventory: { potion_patch: 2 } });
  const inventory = s.inventory, team = s.team, partner = s.team[0], box = s.box, pots = s.pots, pot = s.pots[0];
  const snapshot = structuredClone({ team: s.team, box: s.box, pots: s.pots, extra: s.originalExtension });
  let writes = 0;
  const persist = () => { writes++; return true; };
  assert.equal(confirm(s, buy, 6, persist).total, 96);
  assert.equal(s.gold, 304); assert.equal(s.inventory.potion_patch, 8); assert.equal(writes, 1);
  assert.equal(confirm(s, caps, 4, persist).total, 100);
  assert.equal(s.gold, 204); assert.equal(s.balls, 7); assert.equal(writes, 2);
  assert.equal(s.inventory, inventory); assert.equal(s.team, team); assert.equal(s.team[0], partner);
  assert.equal(s.box, box); assert.equal(s.pots, pots); assert.equal(s.pots[0], pot);
  assert.deepEqual({ team: s.team, box: s.box, pots: s.pots, extra: s.originalExtension }, snapshot);
});

test("merchant bulk sales preserve per-item rounding, bonuses, Silk counters and legacy one-item calls", () => {
  for (const id of ["potion_patch", "bud_kush", "bud_eddi"]) {
    const bulk = state({ gold: 0, outfit: "wear_vest", map: "ring", flagLowtown: true,
      inventory: { [id]: 7 }, stats: { goldEarned: 990, budsSold: 98 }, budsSoldToSilk: 10 });
    const singles = structuredClone(bulk), unit = merchant.salePrice(bulk, id, .85);
    const quote = quoteTrade(bulk, { kind: "sell", id, sellMultiplier: .85 }, 7);
    assert.equal(quote.total, unit * 7);
    let writes = 0;
    assert.equal(confirm(bulk, { kind: "sell", id, sellMultiplier: .85 }, 7, () => { writes++; return true; }).total, unit * 7);
    let total = 0;
    for (let i = 0; i < 7; i++) total += merchant.sellMerchantItem(singles, id, .85);
    assert.equal(total, unit * 7); assert.equal(writes, 1); assert.deepEqual(bulk, singles);
    if (id.startsWith("bud_")) {
      assert.equal(bulk.stats.budsSold, 105); assert.equal(bulk.budsSoldToSilk, 17);
      assert.equal(bulk.quests.q5_silk, "done"); assert.equal(bulk.ach.sold_100, "done");
      assert.equal(bulk.ach.silk_deal, "done");
    }
  }
  // Rounding each item is deliberate: 5 * .85 rounds to 4 before seven units are sold.
  const rounded = state({ outfit: "wear_trashbag", inventory: { potion_patch: 7 } });
  assert.equal(quoteTrade(rounded, { ...sell, sellMultiplier: .85 }, 7).total, 28);
});

test("Grow bulk transactions retain the original Grow price and counter rules without Silk flags", () => {
  const id = STALL_GROW[0], bulk = state({ gold: 100000, inventory: { bud_eddi: 12 }, outfit: "wear_vest", map: "ring", flagLowtown: true });
  const singles = structuredClone(bulk);
  assert.equal(confirm(bulk, { kind: "grow-buy", id }, 8).ok, true);
  for (let i = 0; i < 8; i++) assert.equal(grow.buyGrowItem(singles, id), true);
  assert.deepEqual(bulk, singles);
  const unit = Math.max(1, Math.round(ITEMS.bud_eddi.sell * .95));
  assert.equal(confirm(bulk, { kind: "grow-sell", id: "bud_eddi" }, 12).total, unit * 12);
  let total = 0;
  for (let i = 0; i < 12; i++) total += grow.sellGrowBud(singles, "bud_eddi");
  assert.equal(total, unit * 12); assert.deepEqual(bulk, singles);
  assert.equal(bulk.stats.budsSold, 12); assert.equal(bulk.stats.goldEarned, unit * 12);
  assert.equal(bulk.budsSoldToSilk, undefined); assert.equal(bulk.quests.q5_silk, undefined);
});

test("Max respects safe inventory, money and progress capacity; large batches still persist once", () => {
  assert.equal(quoteTrade(state({ gold: MAX, inventory: { potion_patch: MAX - 1 } }), buy, 1).max, 1);
  assert.equal(quoteTrade(state({ gold: MAX, balls: MAX }), caps, 1).max, 0);
  assert.equal(quoteTrade(state({ gold: MAX - 20, inventory: { potion_patch: 9 } }), sell, 1).max, 4);
  assert.equal(quoteTrade(state({ gold: 0, inventory: { potion_patch: 9 }, stats: { goldEarned: MAX - 10 } }), sell, 1).max, 2);
  const budState = state({ gold: 0, inventory: { bud_kush: 9 }, stats: { budsSold: MAX - 1 } });
  assert.equal(quoteTrade(budState, { kind: "sell", id: "bud_kush" }, 1).max, 1);
  const quantity = 1000000, s = state({ gold: quantity * 16, inventory: {} });
  let writes = 0;
  assert.equal(confirm(s, buy, quantity, () => { writes++; return true; }).ok, true);
  assert.equal(s.gold, 0); assert.equal(s.inventory.potion_patch, quantity); assert.equal(writes, 1);
});

test("confirm revalidates changed funds, inventory and expiring price bonuses instead of silently changing the deal", () => {
  const buyState = state({ gold: 100 }), buyQuote = quoteTrade(buyState, buy, 5);
  buyState.gold = 40;
  const buyBefore = structuredClone(buyState);
  assert.equal(executeTrade(buyState, buy, 5, buyQuote.unitPrice, () => assert.fail("changed funds")).ok, false);
  assert.deepEqual(buyState, buyBefore);
  const sellState = state({ inventory: { potion_patch: 5 } }), sellQuote = quoteTrade(sellState, sell, 5);
  sellState.inventory.potion_patch = 2;
  const sellBefore = structuredClone(sellState);
  assert.equal(executeTrade(sellState, sell, 5, sellQuote.unitPrice, () => assert.fail("changed stock")).ok, false);
  assert.deepEqual(sellState, sellBefore);
  const timed = state({ inventory: { bud_kush: 5 }, playtime: 9, highGold: 2, highGoldUntil: 10 });
  const old = quoteTrade(timed, { kind: "sell", id: "bud_kush" }, 5);
  timed.playtime = 10;
  const before = structuredClone(timed), current = quoteTrade(timed, { kind: "sell", id: "bud_kush" }, 5);
  assert.notEqual(old.unitPrice, current.unitPrice);
  assert.equal(executeTrade(timed, { kind: "sell", id: "bud_kush" }, 5, old.unitPrice, () => assert.fail("stale price")).ok, false);
  assert.deepEqual(timed, before);
});

test("failed bulk persistence restores trade and normalization effects, and retry books the batch only once", () => {
  for (const mode of ["false", "throw"]) for (const offer of [buy, { kind: "sell", id: "bud_kush" }, { kind: "grow-sell", id: "bud_kush" }]) {
    const s = state({ inventory: { bud_kush: 5 }, stats: { goldEarned: 990, budsSold: 99 }, ach: { keep: "done" } });
    const before = structuredClone(s), inventory = s.inventory, stats = s.stats, team = s.team, box = s.box, pots = s.pots, pot = s.pots[0];
    const quote = quoteTrade(s, offer, 3);
    assert.equal(quote.ok, true, quote.reason);
    let writes = 0;
    const failed = executeTrade(s, offer, 3, quote.unitPrice, () => {
      writes++; persistedNormalization(s);
      if (mode === "throw") throw new Error("quota");
      return false;
    });
    assert.equal(failed.ok, false); assert.match(failed.message, /speicher/i); assert.equal(writes, 1);
    assert.deepEqual(s, before);
    assert.equal(s.inventory, inventory); assert.equal(s.stats, stats); assert.equal(s.team, team);
    assert.equal(s.box, box); assert.equal(s.pots, pots); assert.equal(s.pots[0], pot);
    assert.equal(executeTrade(s, offer, 3, quote.unitPrice, () => { writes++; return true; }).ok, true);
    assert.equal(writes, 2);
    assert.equal(s.inventory[offer.id], offer.kind === "buy" ? 3 : 2);
    assert.equal(s.gold, before.gold + (offer.kind === "buy" ? -quote.total : quote.total));
    assert.equal(s.team[0].hp, 0); assert.equal(s.team[0].xp, 17);
  }
});

test("real save persistence serializes the whole batch once without modifying stable or original 2D slots", async () => {
  const original = JSON.stringify({ source: "original", party: [{ id: "mon_puffpuff", hp: 0, xp: 17 }] });
  const stable = JSON.stringify({ source: "stable" });
  const seed = state({ gold: 200, inventory: { potion_patch: 1 } });
  const storage = new Map([["420mon_save_v1", original], ["420mon-progress-v1", stable], ["420mon-test-progress-v1", JSON.stringify(seed)]]);
  const writes = [];
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { writes.push(key); storage.set(key, value); } };
  globalThis.window = new EventTarget();
  const persistence = await server.ssrLoadModule("/src/game/save.ts");
  assert.equal(persistence.SAVE_KEY, "420mon-test-progress-v1");
  const s = persistence.getSave(), gold = s.gold;
  const result = confirm(s, buy, 4, () => persistence.saveProgress());
  assert.equal(result.ok, true);
  assert.equal(writes.filter(key => key === persistence.SAVE_KEY).length, 1);
  const reloaded = JSON.parse(storage.get(persistence.SAVE_KEY));
  assert.equal(reloaded.gold, gold - 64); assert.equal(reloaded.inventory.potion_patch, 5);
  assert.equal(reloaded.team[0].hp, 0); assert.equal(reloaded.team[0].xp, 17);
  assert.deepEqual(reloaded.originalExtension, seed.originalExtension);
  assert.equal(storage.get("420mon_save_v1"), original); assert.equal(storage.get("420mon-progress-v1"), stable);
});
