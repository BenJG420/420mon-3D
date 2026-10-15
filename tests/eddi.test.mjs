import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile, mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const output = await mkdtemp(path.join(tmpdir(), "420mon-eddi-test-"));
const written = new Set();
async function compile(relative) {
  if (written.has(relative)) return;
  written.add(relative);
  const source = await readFile(path.join(root, relative), "utf8");
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const imports = [...result.matchAll(/from ["'](\.[^"']+)["']/g)];
  const target = path.join(output, relative.replace(/\.ts$/, ".mjs"));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, result.replace(/from (["'])(\.[^"']+)\1/g, (_, quote, file) => `from ${quote}${file}.mjs${quote}`));
  for (const match of imports) await compile(path.join(path.dirname(relative), `${match[1]}.ts`));
}
await compile("src/game/eddi-state.ts");
after(() => rm(output, { recursive: true, force: true }));
const load = relative => import(pathToFileURL(path.join(output, relative)));
const eddi = await load("src/game/eddi-state.mjs");
const grow = await load("src/game/grow-state.mjs");
const rules = await load("src/game/data/grow.mjs");
const data = await load("src/game/data/eddi.mjs");
const items = await load("src/game/data/items.mjs");

function state(extra = {}) {
  const save = { pots: [], potsUnlocked: 2, boxesUnlocked: 1, inventory: { seed_ordinary: 6 }, gold: 30000, harvestedSeeds: [], boxHarvests: 0, stats: {}, schnittTitle: false, eddiIn: false, lastGrowAt: 1000, quest: {}, quests: {}, team: [], growInitialized: true, outfit: "wear_trashbag", ...extra };
  grow.ensureGrowState(save, 1000);
  return save;
}
function plant(save, index) {
  assert.equal(grow.plantPot(save, index, "seed_ordinary").ok, true);
}
function sequence(...values) {
  return () => {
    assert.ok(values.length, "unexpected extra random roll");
    return values.shift();
  };
}
function arrive(save, session, expectedIndex = 0) {
  eddi.tickEddi(save, session, .1, sequence(0)); // Home -> idle pause.
  eddi.tickEddi(save, session, 2, sequence(.1, 0)); // Pick planted pot.
  assert.equal(save.eddiPot, expectedIndex);
  eddi.tickEddi(save, session, 100, sequence()); // Walk to the pot.
  assert.equal(save.eddiAct, "look");
}

test("the hundredth real growbox harvest unlocks Eddi and waking preserves party and harvest rewards", () => {
  const save = state({ boxHarvests: 99, team: [{ name: "Legacy", level: 1, xp: 4, hp: 0 }] });
  plant(save, 6);
  save.pots[6].timeLeft = 0; grow.refreshPot(save.pots[6]);
  assert.equal(save.eddiIn, false);
  assert.equal(grow.harvestPot(save, 6, () => .9).ok, true);
  assert.equal(save.boxHarvests, 100);
  assert.equal(save.eddiIn, true);
  const before = structuredClone({ inventory: save.inventory, team: save.team, gold: save.gold });
  const session = eddi.createEddiSession();
  session.lookArmed = true;
  eddi.wakeEddi(save, session);
  assert.deepEqual([save.eddiX, save.eddiY, save.eddiAct, save.eddiPot], [248, 140, "wander", -1]);
  assert.equal(session.lookArmed, false);
  assert.deepEqual({ inventory: save.inventory, team: save.team, gold: save.gold }, before);
  assert.equal(save.team[0].hp, 0);
  assert.equal(save.team[0].xp, 4);
});

test("Eddi prefers an unboosted unlocked plant and walks at the source speed", () => {
  const save = state({ eddiIn: true });
  plant(save, 0); plant(save, 1);
  save.pots[0].eddiBoost = true;
  save.pots[2] = { id: 2, seed: "seed_ordinary", fert: "", phase: "ready", total: 300, timeLeft: 0 };
  const session = eddi.createEddiSession();
  eddi.tickEddi(save, session, .1, sequence(0));
  eddi.tickEddi(save, session, 2, sequence(.1, 0));
  assert.equal(save.eddiPot, 1, "locked index 2 and boosted index 0 do not win priority");
  const start = { x: save.eddiX, y: save.eddiY };
  eddi.tickEddi(save, session, .1, sequence());
  assert.ok(Math.abs(Math.hypot(save.eddiX - start.x, save.eddiY - start.y) - 3) < 1e-8);
  assert.equal(eddi.eddiBody(save).block, false, "visitor remains passable like source");
  eddi.tickEddi(save, session, 100, sequence());
  assert.equal(save.eddiAct, "look");
  assert.equal(save.eddiAnim, 2.15);
});

test("each look rolls only once below 34 percent and its star triples the real saved harvest", () => {
  for (const [roll, success] of [[.33999, true], [.34, false]]) {
    const save = state({ eddiIn: true });
    plant(save, 0);
    const session = eddi.createEddiSession();
    arrive(save, session);
    const result = eddi.tickEddi(save, session, .1, sequence(roll));
    assert.equal(result.boostedPot, success ? 0 : undefined);
    eddi.tickEddi(save, session, .1, sequence());
    assert.equal(!!save.pots[0].eddiBoost, success, "second frame cannot reroll");
    const reloaded = state(JSON.parse(JSON.stringify(save)));
    assert.equal(!!reloaded.pots[0].eddiBoost, success);
    save.pots[0].timeLeft = 0; grow.refreshPot(save.pots[0]);
    const base = items.ITEMS.seed_ordinary.yieldN;
    assert.equal(grow.harvestPot(save, 0, () => .9).buds, base * (success ? 3 : 1));
    assert.equal(save.pots[0].eddiBoost, undefined, "the next planting gets a clean pot");
  }
});

test("loading an original in-progress look does not reroll it or overwrite imported coordinates", () => {
  const save = state({ eddiIn: true, eddiX: 76, eddiY: 66, eddiFacing: 1, eddiAct: "look", eddiAnim: 1.4, eddiPot: 0 });
  plant(save, 0);
  eddi.ensureEddiState(save);
  assert.deepEqual([save.eddiX, save.eddiY, save.eddiFacing, save.eddiAct], [76, 66, 1, "look"]);
  eddi.tickEddi(save, eddi.createEddiSession(), .1, sequence());
  assert.equal(save.pots[0].eddiBoost, undefined);
  for (const delta of [0, -1, NaN, Infinity]) assert.equal(eddi.tickEddi(save, eddi.createEddiSession(), delta, sequence()).changed, false);
  const absent = state();
  assert.equal(eddi.tickEddi(absent, eddi.createEddiSession(), 5, sequence()).changed, false);
  assert.equal(absent.eddiX, undefined, "an absent visitor cannot move or boost");
});

test("the original physical stock discounts normal items but keeps exclusive seed and fertilizer at 420", () => {
  const save = state({ eddiIn: true });
  const stock = data.eddiStock(false);
  assert.ok(stock.includes("seed_eddi") && stock.includes("fert_eddi") && stock.includes("chip_crown"));
  assert.equal(eddi.eddiBuyPrice(save, "seed_ordinary"), Math.round(items.ITEMS.seed_ordinary.buy * .5));
  assert.equal(eddi.eddiBuyPrice(save, "seed_eddi"), 420);
  assert.equal(eddi.eddiBuyPrice(save, "fert_eddi"), 420);
  assert.equal(eddi.eddiBuyPrice(save, "title_schnitt"), 10000);
  assert.equal(eddi.buyEddiItem(save, "seed_eddi", 3).price, 1260);
  assert.equal(save.inventory.seed_eddi, 3);
  assert.equal(eddi.buyEddiItem(save, "fert_eddi").price, 420);
  assert.equal(save.inventory.fert_eddi, 1);
});

test("the title is bought once and doubles manual growth without stacking Felix's Eddi speed", () => {
  const save = state({ eddiIn: true, gold: 10000 });
  plant(save, 0);
  assert.deepEqual(eddi.buyEddiItem(save, "title_schnitt"), { ok: true, price: 10000 });
  assert.equal(save.schnittTitle, true);
  assert.equal(save.inventory.title_schnitt, undefined, "source title is a durable flag");
  assert.equal(save.gold, 0);
  assert.equal(eddi.buyEddiItem(save, "title_schnitt").ok, false);
  assert.equal(data.eddiStock(true).includes("title_schnitt"), false);
  assert.equal(rules.growTickSpeed("", false, true, true), 2);
  assert.equal(rules.growTickSpeed("", true, true, true), 2);
});

test("rejected Eddi purchases cannot change money or inventory", () => {
  for (const extra of [{ eddiIn: false }, { eddiIn: true, gold: 1 }]) {
    const save = state(extra), before = structuredClone(save);
    assert.equal(eddi.buyEddiItem(save, "seed_eddi").ok, false);
    assert.deepEqual(save, before);
  }
  const save = state({ eddiIn: true }), before = structuredClone(save);
  for (const count of [0, -1, NaN, Infinity]) assert.equal(eddi.buyEddiItem(save, "seed_eddi", count).ok, false);
  assert.equal(eddi.buyEddiItem(save, "wear_trashbag").ok, false);
  assert.deepEqual(save, before);
});
