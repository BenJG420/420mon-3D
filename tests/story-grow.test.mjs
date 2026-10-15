import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile, mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const output = await mkdtemp(path.join(tmpdir(), "420mon-story-grow-test-"));
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
await compile("src/game/story-grow.ts");
after(() => rm(output, { recursive: true, force: true }));
const load = relative => import(pathToFileURL(path.join(output, relative)));
const { advanceStoryGrow } = await load("src/game/story-grow.mjs");
const grow = await load("src/game/grow-state.mjs");
const felix = await load("src/game/felix-state.mjs");
const { OFFLINE_CAP } = await load("src/game/data/grow.mjs");
const START = 1_000_000;

function state(extra = {}) {
  const save = { pots: [], potsUnlocked: 2, boxesUnlocked: 1, inventory: { seed_ordinary: 6 }, gold: 30000, harvestedSeeds: [], boxHarvests: 0, stats: {}, schnittTitle: false, eddiIn: false, lastGrowAt: START, quest: {}, quests: {}, team: [{ name: "Legacy", level: 1, xp: 4, hp: 0 }], growInitialized: true, eddiSeed: true, outfit: "wear_trashbag", playtime: 123, ...extra };
  grow.ensureGrowState(save, START);
  return save;
}
function withRandom(random, action) {
  const original = Math.random;
  Math.random = random;
  try { return action(); } finally { Math.random = original; }
}

test("one shared story clock consumes elapsed once and preserves care, playtime and defeated partners", () => {
  const save = state();
  assert.equal(grow.plantPot(save, 0, "seed_ordinary").ok, true);
  grow.recordGrowCare(save, 0, 3);
  const before = { team: structuredClone(save.team), playtime: save.playtime, total: save.pots[0].total, left: save.pots[0].timeLeft };
  assert.equal(advanceStoryGrow(save, START + 2000), 2);
  assert.ok(Math.abs(save.pots[0].timeLeft - (before.left - 2)) < 1e-8);
  assert.equal(save.lastGrowAt, START + 2000);
  assert.equal(save.pots[0].total, before.total);
  assert.equal(save.pots[0].careBest, 3);
  assert.equal(save.pots[0].careRewardHits, 3);
  const after = JSON.stringify(save);
  for (const timestamp of [START + 2000, START, NaN, Infinity]) {
    assert.equal(advanceStoryGrow(save, timestamp), 0);
    assert.equal(JSON.stringify(save), after, "a second caller or reversed clock cannot spend time twice");
  }
  assert.equal(save.playtime, before.playtime);
  assert.deepEqual(save.team, before.team);
});

test("an offline interval does not tick Eddi or reroll even an armed plant look", () => {
  const save = state({ eddiIn: true, eddiX: 248, eddiY: 140, eddiAct: "wander", eddiPot: 0 });
  grow.plantPot(save, 0, "seed_ordinary");
  advanceStoryGrow(save, START + 50);
  assert.equal(save.eddiAct, "look", "online arrival arms the source look");
  const before = { anim: save.eddiAnim, x: save.eddiX, y: save.eddiY, left: save.pots[0].timeLeft };
  withRandom(() => { throw new Error("offline Eddi must not roll"); }, () => {
    assert.equal(advanceStoryGrow(save, START + 30_050), 30);
  });
  assert.equal(save.pots[0].eddiBoost, undefined);
  assert.deepEqual([save.eddiAnim, save.eddiX, save.eddiY], [before.anim, before.x, before.y]);
  assert.ok(Math.abs(save.pots[0].timeLeft - (before.left - 30)) < 1e-8);
  assert.equal(save.playtime, 123);
  assert.equal(save.team[0].hp, 0);
  assert.equal(save.team[0].xp, 4);
});

test("offline story growth produces repeated real Felix harvests and caps the whole absence at 72 hours", () => {
  const save = state({ inventory: { seed_ordinary: 10005 } });
  grow.plantPot(save, 0, "seed_ordinary");
  grow.recordGrowCare(save, 0, 3);
  save.pots[0].total = save.pots[0].timeLeft = 1_000_000;
  felix.hireFelix(save);
  assert.equal(felix.cratePut(save, "seed_ordinary", 10000), 10000);
  const capped = structuredClone(save);
  withRandom(() => .9, () => {
    assert.equal(advanceStoryGrow(save, START + 100 * 3600 * 1000), OFFLINE_CAP);
    assert.equal(advanceStoryGrow(capped, START + OFFLINE_CAP * 1000), OFFLINE_CAP);
  });
  assert.ok(save.stats.plantsHarvested > 10, "multiple complete worker cycles actually cut plants");
  assert.ok(save.felixCrate.bud_ordinary > 0, "commission-adjusted buds reach the real crate");
  assert.ok(save.felixCrate.seed_ordinary < 10000, "worker production consumes real deposited seeds");
  assert.deepEqual(save.felixCrate, capped.felixCrate, "100h cannot produce more than the source 72h cap");
  assert.deepEqual(save.pots, capped.pots);
  assert.equal(save.stats.plantsHarvested, capped.stats.plantsHarvested);
  assert.ok(Math.abs(save.pots[0].timeLeft - (1_000_000 - OFFLINE_CAP)) < 1e-5, "manual pots share the same capped clock");
  assert.equal(save.pots[0].careRewardHits, 3);
  assert.equal(save.pots[0].byFelix, undefined, "the worker does not take over the manual plant");
  assert.equal(save.playtime, 123);
  assert.equal(save.team[0].hp, 0);
  assert.equal(save.team[0].xp, 4, "automatic production cannot grant resurrection through XP");
  const stable = JSON.stringify(save);
  assert.equal(advanceStoryGrow(save, START + 100 * 3600 * 1000), 0);
  assert.equal(JSON.stringify(save), stable);
});

test("a manual hundredth box harvest wakes Eddi once on the next advance even with no new time", () => {
  const save = state({ boxHarvests: 99 });
  advanceStoryGrow(save, START);
  grow.plantPot(save, 6, "seed_ordinary");
  save.pots[6].timeLeft = 0; grow.refreshPot(save.pots[6]);
  save.eddiX = 90; save.eddiY = 58;
  const events = [];
  const previousWindow = globalThis.window;
  globalThis.window = { dispatchEvent(event) { events.push(event.type); return true; } };
  try {
    grow.harvestPot(save, 6, () => .9);
    assert.equal(save.eddiIn, true);
    const inventory = structuredClone(save.inventory);
    assert.equal(advanceStoryGrow(save, START), 0);
    assert.deepEqual([save.eddiX, save.eddiY, save.eddiAct], [248, 140, "wander"]);
    assert.equal(advanceStoryGrow(save, START), 0);
    advanceStoryGrow(save, START + 50);
    assert.deepEqual(events, ["420mon-eddi-arrived"]);
    assert.deepEqual(save.inventory, inventory, "arrival does not duplicate a harvest or grant rewards");
    assert.equal(save.team[0].hp, 0);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
