import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createServer } from "vite";

const server = await createServer({ root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
after(() => server.close());
const { quoteTrade, executeTrade } = await server.ssrLoadModule("/src/game/trade-state.ts");
const { eddiBuyPrice, buyEddiItem } = await server.ssrLoadModule("/src/game/eddi-state.ts");
const { salePrice, sellMerchantItem } = await server.ssrLoadModule("/src/game/merchant-state.ts");
const { ITEMS } = await server.ssrLoadModule("/src/game/data/items.ts");
const MAX = Number.MAX_SAFE_INTEGER;
const state = extra => ({ version: 2, captures: 0, wins: 0, balls: 3, collection: [], gold: 100000,
  inventory: {}, quest: {}, quests: {}, stats: {}, deadWild: [], eddiIn: true, schnittTitle: false,
  outfit: "wear_trashbag", worn: [], map: "capsule", playtime: 0,
  team: [{ uid: "ko", id: "mon_puffpuff", hp: 0, level: 5, xp: 17 }], box: [],
  pots: [{ id: 6, seed: "seed_ordinary", phase: "grow", timeLeft: 123, total: 300 }],
  legacyExtension: { keep: [1, 2] }, ...extra });
const buy = id => ({ kind: "eddi-buy", id });
const sell = id => ({ kind: "eddi-sell", id });
const neverSave = () => assert.fail("rejected trade must not persist");

function confirm(s, offer, quantity, persist = () => true) {
  const q = quoteTrade(s, offer, quantity);
  assert.equal(q.ok, true, q.reason);
  return executeTrade(s, offer, quantity, q.unitPrice, persist);
}

test("Eddi bulk quotes preserve discounted/exclusive source prices, then book the quantity once", () => {
  for (const id of ["seed_ordinary", "fert_eddi", "chip_silk"]) {
    const s = state({ inventory: { [id]: 2 } }), before = structuredClone(s), source = structuredClone(s);
    const q = quoteTrade(s, buy(id), 7), unit = eddiBuyPrice(s, id);
    assert.equal(q.unitPrice, ITEMS[id].eddiOnly ? ITEMS[id].buy : Math.max(1, Math.round(ITEMS[id].buy * .5)));
    assert.equal(q.total, unit * 7); assert.equal(q.max, Math.floor(s.gold / unit));
    assert.deepEqual(s, before, "selecting quantity has no save effects");
    const inventory = s.inventory, party = s.team, plant = s.pots[0]; let writes = 0;
    assert.equal(confirm(s, buy(id), 7, () => { writes++; return true; }).ok, true);
    for (let i = 0; i < 7; i++) assert.equal(buyEddiItem(source, id).ok, true);
    assert.deepEqual(s, source); assert.equal(writes, 1); assert.equal(s.inventory[id], 9);
    assert.strictEqual(s.inventory, inventory); assert.strictEqual(s.team, party); assert.strictEqual(s.pots[0], plant);
  }
});

test("the title is one flag-only purchase and save failure restores even a previously absent flag", () => {
  const offer = buy("title_schnitt"), s = state(), unit = eddiBuyPrice(s, offer.id);
  assert.equal(quoteTrade(s, offer, 1).max, 1);
  assert.equal(executeTrade(s, offer, 2, unit, neverSave).ok, false);
  assert.equal(confirm(s, offer, 1).ok, true);
  assert.equal(s.schnittTitle, true); assert.equal(s.inventory.title_schnitt, undefined);
  assert.equal(s.gold, 100000 - unit);
  const after = structuredClone(s);
  assert.equal(executeTrade(s, offer, 1, unit, neverSave).ok, false); assert.deepEqual(s, after);
  for (const failure of ["false", "throw"]) for (const present of [false, true]) {
    const retry = state(); if (!present) delete retry.schnittTitle;
    const before = structuredClone(retry), inventory = retry.inventory;
    const result = confirm(retry, offer, 1, () => {
      assert.equal(retry.schnittTitle, true);
      retry.inventory.potion_patch = 99;
      if (failure === "throw") throw new Error("storage unavailable");
      return false;
    });
    assert.equal(result.ok, false); assert.deepEqual(retry, before); assert.strictEqual(retry.inventory, inventory);
    assert.equal(Object.hasOwn(retry, "schnittTitle"), present);
    assert.equal(confirm(retry, offer, 1).ok, true);
  }
});

test("Eddi cannot trade unavailable stock, unsafe quantities, changed funds or overflowing counters", () => {
  for (const offer of [buy("seed_ordinary"), sell("bud_kush")]) {
    for (const quantity of [0, -1, .5, NaN, Infinity, MAX + 1, "2"]) {
      const s = state({ inventory: { bud_kush: 8 } }), before = structuredClone(s);
      assert.equal(executeTrade(s, offer, quantity, 1, neverSave).ok, false); assert.deepEqual(s, before);
    }
    const away = state({ eddiIn: false, inventory: { bud_kush: 8 } }), before = structuredClone(away);
    assert.equal(executeTrade(away, offer, 1, 1, neverSave).ok, false); assert.deepEqual(away, before);
  }
  for (const id of ["potion_patch", "key_stick", "__proto__", "constructor", "missing"]) {
    assert.equal(quoteTrade(state(), { ...buy(id), items: [id] }, 1).ok, false, "caller cannot add items to Eddi's stock");
  }
  const s = state(), offer = buy("seed_ordinary"), q = quoteTrade(s, offer, 10);
  s.gold = q.unitPrice * 9;
  const before = structuredClone(s);
  assert.equal(executeTrade(s, offer, 10, q.unitPrice, neverSave).ok, false); assert.deepEqual(s, before);
  assert.equal(quoteTrade(state({ gold: MAX, inventory: { seed_ordinary: MAX - 2 } }), offer, 2).max, 2);
  assert.equal(quoteTrade(state({ gold: MAX, inventory: { bud_kush: 8 } }), sell("bud_kush"), 1).max, 0);
  assert.equal(quoteTrade(state({ inventory: { bud_kush: 8 }, budsSoldToSilk: MAX - 1 }), sell("bud_kush"), 1).max, 1);
});

test("Eddi sales keep double prices, bonuses and counters, reject expired quotes and roll back failed bulk saves", () => {
  const offer = { ...sell("bud_eddi"), sellMultiplier: 999 };
  const s = state({ gold: 0, inventory: { bud_eddi: 7 }, stats: { goldEarned: 990, budsSold: 98 }, budsSoldToSilk: 10,
    outfit: "wear_vest", map: "ring", flagLowtown: true, playtime: 9, highGold: 2, highGoldUntil: 10 });
  const source = structuredClone(s), unit = salePrice(s, "bud_eddi", 2);
  const q = quoteTrade(s, offer, 7); assert.equal(q.unitPrice, unit); assert.equal(q.total, unit * 7);
  let writes = 0;
  assert.equal(confirm(s, offer, 7, () => { writes++; return true; }).ok, true);
  assert.equal(sellMerchantItem(source, "bud_eddi", 2, 7), unit * 7);
  assert.deepEqual(s, source); assert.equal(writes, 1); assert.equal(s.stats.budsSold, 105); assert.equal(s.budsSoldToSilk, 17);
  const expired = state({ inventory: { bud_eddi: 7 }, playtime: 9, highGold: 2, highGoldUntil: 10 });
  const old = quoteTrade(expired, offer, 7); expired.playtime = 10;
  const before = structuredClone(expired);
  assert.notEqual(old.unitPrice, quoteTrade(expired, offer, 7).unitPrice);
  assert.equal(executeTrade(expired, offer, 7, old.unitPrice, neverSave).ok, false); assert.deepEqual(expired, before);
  for (const failure of ["false", "throw"]) {
    const failed = state({ inventory: { bud_eddi: 7 }, stats: { goldEarned: 990, budsSold: 98 }, budsSoldToSilk: 10 });
    const snapshot = structuredClone(failed), inventory = failed.inventory, stats = failed.stats;
    assert.equal(confirm(failed, offer, 7, () => { if (failure === "throw") throw new Error("quota"); return false; }).ok, false);
    assert.deepEqual(failed, snapshot); assert.strictEqual(failed.inventory, inventory); assert.strictEqual(failed.stats, stats);
  }
});
