import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile, mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// Exercise the production modules and their real item catalogue, including save reload.
const root = path.resolve(import.meta.dirname, "..");
const output = await mkdtemp(path.join(tmpdir(), "420mon-grow-test-"));
const written = new Set();
async function compile(relative) {
  if (written.has(relative)) return;
  written.add(relative);
  const source = await readFile(path.join(root, relative), "utf8");
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const imports = [...result.matchAll(/from ["'](\.[^"']+)["']/g)];
  const rewritten = result.replace(/from (["'])(\.[^"']+)\1/g, (_, quote, file) => `from ${quote}${file}.mjs${quote}`);
  const target = path.join(output, relative.replace(/\.ts$/, ".mjs"));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, rewritten);
  for (const match of imports) await compile(path.join(path.dirname(relative), `${match[1]}.ts`));
}
await compile("src/game/grow-state.ts");
await compile("src/game/save.ts");
after(() => rm(output, { recursive: true, force: true }));
const load = (relative, query = "") => import(`${pathToFileURL(path.join(output, relative))}${query}`);
const grow = await load("src/game/grow-state.mjs");
const rules = await load("src/game/data/grow.mjs");
const { ITEMS, POT_UNLOCK, BOX_UNLOCK } = await load("src/game/data/items.mjs");
const { xpToNext } = await load("src/game/data/progress.mjs");

function state(extra = {}) {
  const s = { pots: [], potsUnlocked: 2, boxesUnlocked: 0, inventory: { seed_ordinary: 3, fert_normal: 1 }, gold: 1000, harvestedSeeds: [], boxHarvests: 0, stats: {}, schnittTitle: false, eddiIn: false, lastGrowAt: 1000, quest: {}, quests: {}, team: [], growInitialized: true, ...extra };
  grow.ensureGrowState(s, 1000);
  return s;
}
function ready(s, index = 0) {
  s.pots[index].timeLeft = 0;
  grow.refreshPot(s.pots[index]);
}

test("planting consumes exactly one seed and fertilizer, uses original pacing and finishes the original quest", () => {
  const s = state();
  const result = grow.plantPot(s, 0, "seed_ordinary", "fert_normal");
  assert.equal(result.ok, true);
  assert.equal(result.xp, 8);
  assert.equal(s.inventory.seed_ordinary, 2);
  assert.equal(s.inventory.fert_normal, 0);
  assert.equal(s.pots[0].phase, "sprout");
  assert.equal(s.pots[0].total, 300, "original T1 grow is five minutes");
  assert.equal(s.pots[0].timeLeft, 300);
  assert.equal(s.quests.q7_grow, "done");
  assert.equal(s.quest.q7_grow, true);
  assert.equal(s.trainerXp, 8);
  assert.equal(grow.plantPot(s, 0, "seed_ordinary").ok, false);
  assert.equal(grow.plantPot(s, 2, "seed_ordinary").ok, false, "locked slots cannot consume a seed");
  assert.equal(s.inventory.seed_ordinary, 2);
});

test("invalid seed or fertilizer inventory rejects atomically, including fractional and nonfinite amounts", () => {
  for (const amount of [0, -1, .5, NaN, Infinity, "1", undefined]) {
    const s = state({ inventory: { seed_ordinary: 2, fert_normal: amount } });
    assert.equal(grow.plantPot(s, 0, "seed_ordinary", "fert_normal").ok, false);
    assert.equal(s.inventory.seed_ordinary, 2, `seed survives rejected fertilizer ${amount}`);
    assert.equal(s.pots[0].phase, "empty");
    assert.equal(s.quests.q7_grow, undefined);
    s.inventory.seed_ordinary = amount;
    assert.equal(grow.plantPot(s, 0, "seed_ordinary").ok, false);
  }
  const s = state({ inventory: { seed_ordinary: 1, potion_patch: 1 } });
  assert.equal(grow.plantPot(s, 0, "seed_ordinary", "potion_patch").ok, false);
  assert.equal(grow.plantPot(s, 0, "potion_patch").ok, false);
  assert.equal(grow.plantPot(s, -1, "seed_ordinary").ok, false);
  assert.equal(grow.plantPot(s, 1.5, "seed_ordinary").ok, false);
  assert.equal(s.inventory.seed_ordinary, 1);
});

test("offline ticking obeys original fertilizer, Felix and title speed and caps each absence at 72 hours", () => {
  const s = state();
  grow.plantPot(s, 0, "seed_ordinary", "fert_normal");
  const p = s.pots[0];
  p.total = p.timeLeft = rules.OFFLINE_CAP * 10;
  p.byFelix = true; s.eddiIn = true;
  const elapsed = grow.advanceGrow(s, s.lastGrowAt + 100 * 3600 * 1000);
  assert.equal(elapsed, 72 * 3600);
  assert.equal(p.timeLeft, p.total - 72 * 3600 * 2.2);
  assert.equal(grow.advanceGrow(s, s.lastGrowAt), 0, "same timestamp cannot apply twice");
  assert.equal(grow.advanceGrow(s, s.lastGrowAt - 1000), 0, "clock reversal cannot add or remove time");
  assert.equal(grow.advanceGrow(s, NaN), 0);
  s.schnittTitle = true;
  assert.equal(grow.growRemaining(s, p), p.timeLeft / 2.2, "title and Felix do not stack to quadruple speed");
});

test("growth reaches the original 33% and 66% phases and stays ready until harvest", () => {
  const s = state();
  grow.plantPot(s, 0, "seed_ordinary");
  const p = s.pots[0];
  p.total = 100;
  for (const [left, phase] of [[100, "sprout"], [67, "grow"], [34, "bloom"], [0, "ready"]]) {
    p.timeLeft = left; grow.refreshPot(p);
    assert.equal(p.phase, phase);
  }
  grow.advanceGrow(s, s.lastGrowAt + 900000);
  assert.equal(p.phase, "ready");
  assert.equal(p.timeLeft, 0);
  assert.equal(s.stats.plantsHarvested, 0, "offline growth does not harvest automatically");
});

test("harvest gives original buds, fertilizer and box multipliers with a strict 35% seed return", () => {
  const s = state({ boxesUnlocked: 1 });
  grow.plantPot(s, 6, "seed_ordinary", "fert_normal");
  ready(s, 6);
  const expected = (ITEMS.seed_ordinary.yieldN + 2) * 2;
  const first = grow.harvestPot(s, 6, () => .349999);
  assert.equal(first.buds, expected);
  assert.equal(first.seedReturned, true);
  assert.equal(s.inventory.bud_ordinary, expected);
  assert.equal(s.inventory.seed_ordinary, 3);
  assert.equal(s.stats.plantsHarvested, 1);
  assert.equal(s.boxHarvests, 1);
  assert.deepEqual(s.harvestedSeeds, ["seed_ordinary"]);
  assert.equal(s.quests.q2_harvest, "done");
  assert.equal(s.pots[6].phase, "empty");
  assert.equal(grow.harvestPot(s, 6).ok, false, "cannot harvest twice");
  grow.plantPot(s, 0, "seed_ordinary"); ready(s);
  assert.equal(grow.harvestPot(s, 0, () => .35).seedReturned, false);
  assert.equal(s.inventory.seed_ordinary, 2);
  assert.deepEqual(s.harvestedSeeds, ["seed_ordinary"], "strain journal is unique");
});

test("original harvest bonuses, Eddi triple yield, active XP bonus and 100-box milestone apply", () => {
  const s = state({ boxesUnlocked: 1, boxHarvests: 99, outfit: "nude", flagLowtown: true, playtime: 10, highGold: 2, highGoldUntil: 20, highXp: 2, highXpUntil: 20 });
  const planted = grow.plantPot(s, 6, "seed_ordinary");
  assert.equal(planted.xp, 16);
  s.pots[6].eddiBoost = true; ready(s, 6);
  const harvested = grow.harvestPot(s, 6, () => .9);
  assert.equal(harvested.buds, Math.round(ITEMS.seed_ordinary.yieldN * 2 * 3 * 1.15 * 2));
  assert.equal(s.eddiIn, true);
  assert.equal(s.boxHarvests, 100);
});

test("sleep removes exactly 1800 conceptual seconds and neither sleep nor grow XP revives a defeated partner", () => {
  const living = { id: "mon_budling", name: "Budling", level: 5, xp: xpToNext(5) - 1, hp: 4, hpMax: 30 };
  const dead = { id: "mon_puffpuff", name: "Puffpuff", level: 5, xp: 99, hp: 0 };
  const s = state({ team: [living, dead], eddiSeed: true });
  grow.plantPot(s, 0, "seed_ordinary");
  assert.equal(living.level, 6);
  assert.equal(dead.level, 5); assert.equal(dead.xp, 99); assert.equal(dead.hp, 0);
  const p = s.pots[0]; p.total = p.timeLeft = 7200;
  grow.sleepGrow(s);
  assert.equal(p.timeLeft, 5400);
  assert.equal(dead.hp, 0);
  p.timeLeft = 100; grow.sleepGrow(s);
  assert.equal(p.phase, "ready");
  grow.harvestPot(s, 0, () => 1);
  assert.equal(dead.hp, 0); assert.equal(dead.xp, 99);
});

test("earned care bonus cannot stack or regress and survives a shared save reload alongside Grow progress", async () => {
  const slots = new Map();
  globalThis.localStorage = { getItem: key => slots.get(key) ?? null, setItem: (key, value) => slots.set(key, value) };
  globalThis.window = new EventTarget();
  const api = await load("src/game/save.mjs", "?fresh");
  const s = api.getSave(); grow.ensureGrowState(s, 1000); s.lastGrowAt = 1000;
  grow.plantPot(s, 0, "seed_ordinary");
  const before = structuredClone(s);
  assert.equal(grow.recordGrowCare(s, 0, 3), true);
  assert.equal(grow.recordGrowCare(s, 0, 1), true);
  assert.equal(s.pots[0].careBest, 3);
  assert.equal(s.pots[0].timeLeft, before.pots[0].timeLeft * .7);
  assert.equal(s.pots[0].total, before.pots[0].total * .7);
  assert.equal(s.pots[0].careRewardHits, 3);
  assert.deepEqual(s.inventory, before.inventory);
  assert.equal(s.trainerXp, before.trainerXp);
  const ref = s.pots[0]; grow.ensureGrowState(s, 1000);
  assert.strictEqual(s.pots[0], ref, "unrelated saves retain the active pot object");
  api.saveProgress({ map: "capsule", x: 77, y: 80 });
  const reload = await load("src/game/save.mjs", "?reload");
  const restored = reload.getSave(); grow.ensureGrowState(restored, 1000);
  assert.equal(restored.pots[0].careBest, 3);
  assert.equal(restored.inventory.seed_ordinary, 0);
  assert.equal(restored.map, "capsule");
  grow.advanceGrow(restored, 61000);
  assert.equal(restored.pots[0].timeLeft, before.pots[0].timeLeft * .7 - 60);
  assert.equal(restored.pots[0].careRewardHits, 3);
  const afterReload = restored.pots[0].timeLeft;
  grow.recordGrowCare(restored, 0, 3);
  assert.equal(restored.pots[0].timeLeft, afterReload, "reload cannot reapply a paid bonus");
  assert.equal(grow.recordGrowCare(restored, 1, 3), false, "an empty pot cannot be cared for");
});

test("shop prices and slot unlocks follow original tables and reject missing stock or invalid currency", () => {
  const s = state();
  const startGold = s.gold;
  assert.equal(grow.buyNextSlot(s, false), true);
  assert.equal(s.potsUnlocked, 3);
  assert.equal(s.gold, startGold - POT_UNLOCK[0].price);
  assert.equal(grow.buyNextSlot(s, true), true);
  assert.equal(s.boxesUnlocked, 1);
  assert.equal(s.gold, startGold - POT_UNLOCK[0].price - BOX_UNLOCK[0].price);
  assert.equal(grow.buyGrowItem(s, "seed_ordinary"), true);
  assert.equal(grow.buyGrowItem(s, "key_dex"), false);
  s.inventory.bud_ordinary = 1;
  const price = grow.sellGrowBud(s, "bud_ordinary");
  assert.equal(price, Math.round(ITEMS.bud_ordinary.sell * .95));
  assert.equal(s.inventory.bud_ordinary, 0);
  assert.equal(grow.sellGrowBud(s, "seed_ordinary"), 0);
  assert.equal(grow.sellGrowBud(s, "bud_ordinary"), 0);
  s.gold = NaN;
  assert.equal(grow.buyNextSlot(s, false), false);
  assert.equal(grow.buyGrowItem(s, "seed_ordinary"), false);
});

test("Grow initialization grants starter supplies once and preserves an imported player's consumed supplies", () => {
  const s = state({ inventory: {}, growInitialized: undefined, team: [{ name: "Budling", level: 5, xp: 0, hp: 1 }] });
  assert.equal(s.inventory.seed_ordinary, 1); assert.equal(s.inventory.seed_eddi, 1);
  s.inventory.seed_ordinary = 0; s.inventory.seed_eddi = 0;
  grow.ensureGrowState(s);
  assert.equal(s.inventory.seed_ordinary, 0); assert.equal(s.inventory.seed_eddi, 0);
  const original = state({ inventory: {}, growInitialized: undefined, migratedFrom: "420mon_save_v1" });
  assert.equal(original.inventory.seed_ordinary, undefined);
});


test("every earned hit shortens the current clock and increases the exact harvest preview", () => {
  for (let hits = 1; hits <= 3; hits++) {
    const s = state(); grow.plantPot(s, 0, "seed_ordinary");
    const p = s.pots[0]; p.timeLeft = 150;
    const base = grow.previewGrowHarvest(s, 0).buds;
    grow.recordGrowCare(s, 0, hits);
    assert.equal(p.total, 300 * (10 - hits) / 10);
    assert.equal(p.timeLeft, 150 * (10 - hits) / 10);
    assert.equal(p.timeLeft / p.total, .5, "care preserves the visible growth phase");
    const preview = grow.previewGrowHarvest(s, 0);
    assert.equal(preview.careBonusPercent, hits * 10);
    assert.equal(preview.buds, base + Math.ceil(base * hits / 10));
    assert.ok(preview.buds > base);
    ready(s); const result = grow.harvestPot(s, 0, () => 1);
    assert.equal(result.buds, preview.buds);
    assert.equal(s.inventory.bud_ordinary, preview.buds);
    assert.equal(s.pots[0].careRewardHits, undefined);
    grow.plantPot(s, 0, "seed_ordinary");
    assert.equal(s.pots[0].total, 300, "a new planting must earn its own care bonus");
  }
});

test("better care upgrades only the difference; identical and weaker repeats award no extra reduction", () => {
  const s = state(); grow.plantPot(s, 0, "seed_ordinary");
  const p = s.pots[0];
  grow.recordGrowCare(s, 0, 1); assert.equal(p.timeLeft, 270);
  grow.advanceGrow(s, s.lastGrowAt + 10000); assert.equal(p.timeLeft, 260);
  grow.recordGrowCare(s, 0, 3);
  assert.equal(p.total, 210);
  assert.ok(Math.abs(p.timeLeft - 260 * 7 / 9) < 1e-10);
  const best = structuredClone(p);
  for (const hits of [3, 3, 1, 2, 0]) grow.recordGrowCare(s, 0, hits);
  assert.deepEqual(p, best);
});

test("legacy cosmetic scores require a new run and invalid, empty, locked or ready plants award no bonus", () => {
  const s = state(); grow.plantPot(s, 0, "seed_ordinary");
  const p = s.pots[0]; p.careBest = 3;
  grow.ensureGrowState(s, 1000);
  assert.equal(p.timeLeft, 300);
  assert.equal(grow.growCareBonus(p), 0);
  for (const hits of [NaN, Infinity, -1]) {
    grow.recordGrowCare(s, 0, hits);
    assert.equal(p.timeLeft, 300);
  }
  grow.recordGrowCare(s, 0, 1); assert.equal(p.timeLeft, 270);
  assert.equal(p.careBest, 3); assert.equal(p.careRewardHits, 1);
  assert.equal(grow.recordGrowCare(s, 1, 3), false);
  assert.equal(grow.recordGrowCare(s, 2, 3), false);
  const preview = grow.previewGrowHarvest(s, 0).buds;
  ready(s);
  assert.equal(grow.recordGrowCare(s, 0, 3), false);
  assert.equal(grow.harvestPot(s, 0, () => 1).buds, preview);
});

test("care composes with fertilizer, growboxes, Eddi and original rewards, with preview equal to actual yield", () => {
  const s = state({ boxesUnlocked: 1, outfit: "nude", flagLowtown: true });
  grow.plantPot(s, 6, "seed_ordinary", "fert_normal"); s.pots[6].eddiBoost = true;
  const base = grow.previewGrowHarvest(s, 6).buds;
  grow.recordGrowCare(s, 6, 3);
  assert.equal(grow.growRemaining(s, s.pots[6]), 210 / 1.1);
  const preview = grow.previewGrowHarvest(s, 6);
  assert.equal(preview.baseBuds, base);
  assert.equal(preview.buds, base + Math.ceil(base * .3));
  grow.sleepGrow(s); assert.equal(s.pots[6].phase, "ready");
  assert.equal(grow.harvestPot(s, 6, () => .99).buds, preview.buds);
});

test("a started care run keeps its earned harvest bonus if the plant matures before the final tap", () => {
  const s = state(); grow.plantPot(s, 0, 'seed_ordinary');
  ready(s);
  assert.equal(grow.recordGrowCare(s, 0, 3), false, 'new runs cannot start on ready plants');
  assert.equal(grow.recordGrowCare(s, 0, 3, true), true, 'an already started run can finish');
  assert.equal(s.pots[0].timeLeft, 0);
  assert.equal(s.pots[0].phase, 'ready');
  assert.equal(grow.harvestPot(s, 0, () => 1).buds, 6);
});
