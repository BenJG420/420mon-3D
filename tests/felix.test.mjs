import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile, mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, ".."), output = await mkdtemp(path.join(tmpdir(), "420mon-felix-test-")), written = new Set();
async function compile(relative) {
  if (written.has(relative)) return;
  written.add(relative);
  const source = await readFile(path.join(root, relative), "utf8");
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const imports = [...result.matchAll(/from ["'](\.[^"']+)["']/g)];
  const rewritten = result.replace(/from (["'])(\.[^"']+)\1/g, (_, quote, file) => `from ${quote}${file}.mjs${quote}`);
  const target = path.join(output, relative.replace(/\.ts$/, ".mjs"));
  await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, rewritten);
  for (const match of imports) await compile(path.join(path.dirname(relative), `${match[1]}.ts`));
}
await compile("src/game/felix-state.ts");
after(() => rm(output, { recursive: true, force: true }));
const load = relative => import(pathToFileURL(path.join(output, relative)));
const felix = await load("src/game/felix-state.mjs"), grow = await load("src/game/grow-state.mjs"), rules = await load("src/game/data/grow.mjs");

function state(extra = {}) {
  const s = { pots: [], potsUnlocked: 2, boxesUnlocked: 0, inventory: {}, gold: 123, harvestedSeeds: [], boxHarvests: 0, stats: {}, schnittTitle: false, eddiIn: false, lastGrowAt: 1000, quest: {}, quests: {}, team: [{ name: "Besiegt", hp: 0, xp: 42, level: 5 }], growInitialized: true, eddiSeed: true, outfit: "wear_trashbag", ...extra };
  grow.ensureGrowState(s, 1000); felix.ensureFelixState(s); return s;
}
function worker(s, act, pot = 0) {
  s.felixHired = true; s.felixAct = act; s.felixPot = pot; s.felixAnim = .01;
}

test("Felix's original free deal and shared puff preserve money, HP and XP", () => {
  const s = state({ inventory: { bud_ordinary: 2 } });
  assert.equal(felix.meetFelix(s), true); assert.equal(felix.meetFelix(s), false);
  assert.deepEqual(felix.shareWithFelix(s, true), { shared: true, bud: "bud_ordinary" });
  assert.equal(s.inventory.bud_ordinary, 1); assert.equal(s.felixSmoked, true);
  assert.equal(felix.hireFelix(s), true); assert.equal(felix.hireFelix(s), false);
  assert.deepEqual(felix.shareWithFelix(s, true), { shared: false });
  assert.equal(s.inventory.bud_ordinary, 1); assert.equal(s.gold, 123);
  assert.equal(s.team[0].hp, 0); assert.equal(s.team[0].xp, 42);
  const empty = state(); felix.shareWithFelix(empty, true);
  assert.equal(empty.felixSmoked, true, "the original offers the lower cut even if no bud was found");
});

test("the physical crate transfers only source categories atomically and keeps discoveries", () => {
  const s = state({ inventory: { seed_ordinary: 3, potion_patch: 2, bud_moss: 1 } });
  assert.equal(felix.cratePut(s, "seed_ordinary", 1), 0, "hire first"); felix.hireFelix(s);
  assert.equal(felix.cratePut(s, "potion_patch", 1), 0);
  assert.equal(felix.cratePut(s, "seed_ordinary", 4), 0);
  assert.equal(felix.cratePut(s, "seed_ordinary", NaN), 0);
  assert.equal(felix.cratePut(s, "seed_ordinary", 3), 3);
  assert.equal(s.inventory.seed_ordinary, 0); assert.equal(s.felixCrate.seed_ordinary, 3);
  assert.equal(felix.crateTake(s, "seed_ordinary", 99), 3); assert.equal(s.inventory.seed_ordinary, 3);
  assert.equal(felix.crateTake(s, "seed_ordinary", 1), 0);
  felix.cratePut(s, "bud_moss"); felix.crateTake(s, "bud_moss");
  assert.ok(s.foundLoot.includes("bud_moss")); assert.equal(s.gold, 123);
});

test("Felix collects at most 100 seeds and takes the best original fertilizer first", () => {
  const s = state({ felixCrate: { seed_ordinary: 101, fert_normal: 100, fert_premium: 1 } }); worker(s, "grab");
  felix.tickFelix(s, 1);
  assert.equal(felix.felixBagSeeds(s), 100); assert.equal(s.felixCrate.seed_ordinary, 1);
  assert.equal(s.felixBag.fert_premium, 1); assert.equal(s.felixBag.fert_normal, 99);
  worker(s, "plant"); felix.tickFelix(s, 2);
  assert.equal(s.pots[0].fert, "fert_premium"); assert.equal(s.pots[0].byFelix, true);
  assert.equal(s.pots[0].total, 300); assert.equal(s.quest.q7_grow, true);
  assert.equal(s.team[0].xp, 42); assert.equal(s.team[0].hp, 0);
});

test("automation does not overwrite a manually tended planting or its care bonus", () => {
  const s = state({ inventory: { seed_ordinary: 1 }, felixBag: { seed_ordinary: 1 } });
  grow.plantPot(s, 0, "seed_ordinary"); grow.recordGrowCare(s, 0, 3);
  const manual = structuredClone(s.pots[0]); worker(s, "plant", 0);
  const result = felix.tickFelix(s, 2);
  assert.equal(result.planted, 1); assert.deepEqual(s.pots[0], manual);
  assert.equal(s.pots[1].byFelix, true); assert.equal(s.pots[1].careRewardHits, undefined);
  s.pots[0].phase = "ready"; s.pots[0].timeLeft = 0;
  s.pots[1].phase = "sprout";
  s.felixAct = "idle"; felix.tickFelix(s, .05);
  assert.notEqual(s.felixAct, "toharvest", "Felix only harvests his own plants");
});

test("worker harvest retains earned care, Eddi and original milestones without reviving partners", () => {
  const s = state({ inventory: { seed_ordinary: 1 }, boxesUnlocked: 1, boxHarvests: 99, outfit: "nude" });
  grow.plantPot(s, 6, "seed_ordinary"); grow.recordGrowCare(s, 6, 3);
  Object.assign(s.pots[6], { byFelix: true, eddiBoost: true, phase: "ready", timeLeft: 0 });
  const expected = grow.previewGrowHarvest(s, 6).buds, xp = s.team[0].xp;
  worker(s, "cut", 6); const result = felix.tickFelix(s, 2, () => .35);
  assert.equal(result.harvested, 1); assert.equal(s.felixHarvest.bud_ordinary, expected);
  assert.equal(s.stats.plantsHarvested, 1); assert.equal(s.boxHarvests, 100); assert.equal(s.eddiIn, true);
  assert.equal(s.quest.q2_harvest, true); assert.deepEqual(s.harvestedSeeds, ["seed_ordinary"]);
  assert.equal(s.inventory.bud_ordinary, undefined); assert.equal(s.pots[6].phase, "empty");
  assert.equal(s.team[0].hp, 0); assert.equal(s.team[0].xp, xp);
});

test("Felix's storage fee floors each bud type, is 5/10 percent, and pays only once", () => {
  for (const smoked of [false, true]) {
    const s = state({ felixSmoked: smoked, felixHarvest: { bud_ordinary: 420, bud_moss: 19 } }); worker(s, "store");
    const result = felix.tickFelix(s, 1), rate = smoked ? .05 : .1;
    const fee = Math.floor(420 * rate) + Math.floor(19 * rate);
    assert.equal(result.cut, fee); assert.equal(result.buds, 439 - fee);
    assert.equal(s.felixCrate.bud_ordinary, 420 - Math.floor(420 * rate));
    assert.equal(felix.felixHarvestN(s), 0);
    assert.deepEqual(felix.flushFelixHarvest(s), { buds: 0, cut: 0 });
  }
});

test("offline source cycles preserve manual pots and consume each seed once on the caller's clock", () => {
  const s = state({ felixCrate: { seed_ordinary: 6 } }); felix.hireFelix(s);
  Object.assign(s.pots[0], { seed: "seed_ordinary", phase: "ready", timeLeft: 0, total: 300 });
  let elapsed = 0;
  const result = felix.simulateFelixOffline(s, 1000, dt => {
    elapsed += dt;
    for (const p of s.pots) if (p.phase !== "empty" && p.phase !== "ready") {
      p.timeLeft -= dt * rules.growTickSpeed(p.fert, !!p.byFelix, s.schnittTitle, s.eddiIn); grow.refreshPot(p);
    }
  }, () => 1);
  assert.equal(elapsed, 1000); assert.ok(result.planted > 0); assert.ok(result.harvested > 0);
  assert.equal(s.pots[0].phase, "ready"); assert.equal(s.pots[0].byFelix, undefined);
  const growing = s.pots.filter(p => p.byFelix && p.seed).length;
  assert.equal((s.felixCrate.seed_ordinary ?? 0) + felix.felixBagSeeds(s) + growing + result.harvested, 6);
  assert.equal(s.lastGrowAt, 1000, "shared timeline belongs to caller");
  assert.equal(s.team[0].hp, 0); assert.equal(s.team[0].xp, 42);
});

test("original single-item worker saves migrate once and the offline clock keeps its 72-hour cap", () => {
  const s = state({ felixSeed: "seed_ordinary", felixFert: "fert_normal", felixCarry: "bud_ordinary", felixCarryN: 9 });
  felix.ensureFelixState(s); felix.ensureFelixState(s);
  assert.equal(s.felixBag.seed_ordinary, 1); assert.equal(s.felixBag.fert_normal, 1); assert.equal(s.felixHarvest.bud_ordinary, 9);
  let seconds = 0; felix.simulateFelixOffline(s, 99 * 3600, dt => { seconds += dt; });
  assert.equal(seconds, 72 * 3600);
  assert.equal(felix.tickFelix(s, NaN).changed, false);
});
