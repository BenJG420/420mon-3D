import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile, mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// Transpile the real TypeScript modules; no parallel reimplementation of the save logic.
const root = path.resolve(import.meta.dirname, "..");
const output = await mkdtemp(path.join(tmpdir(), "420mon-save-test-"));
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
await compile("src/game/save.ts");
after(() => rm(output, { recursive: true, force: true }));

let serial = 0;
async function fixture(entries = {}) {
  const slots = new Map(Object.entries(entries).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  globalThis.localStorage = {
    getItem: key => slots.get(key) ?? null,
    setItem: (key, value) => slots.set(key, value),
    removeItem: key => slots.delete(key),
  };
  globalThis.window = new EventTarget();
  const module = await import(`${pathToFileURL(path.join(output, "src/game/save.mjs"))}?fixture=${serial++}`);
  return { ...module, slots };
}

const living = { id: "mon_budling", name: "Budling", level: 5, xp: 7, hp: 4 };
const defeated = { id: "mon_puffpuff", name: "Puffpuff", level: 5, xp: 0, hp: 0 };

test("legacy 3D save retains monsters, overflow, unknown fields, and defeated HP", async () => {
  const team = [living, defeated, ...Array.from({ length: 5 }, (_, index) => ({ ...living, hp: index + 1 }))];
  const api = await fixture({ "420mon-progress-v1": { team, box: [defeated, null, 42], captures: 39, collection: ["Budling", "mon_budling", "Budling"], gold: 910, inventory: { seed_ordinary: 3 }, customFlag: "keep", pots: [{ id: 0, seed: "seed_ordinary", phase: "bloom", timeLeft: 44, total: 160, fert: "fert1", careBest: 88 }] } });
  const save = api.getSave();
  assert.equal(save.team.length, 6);
  assert.equal(save.box.length, 2, "overflow enters storage instead of being lost");
  assert.equal(save.team[1].hp, 0);
  assert.equal(save.box[0].hp, 0);
  assert.equal(save.captures, 39);
  assert.equal(save.customFlag, "keep");
  assert.deepEqual(save.collection.sort(), ["mon_budling", "mon_puffpuff"].sort());
  assert.equal(save.pots[0].careBest, 88);
  api.saveProgress();
  assert.equal(JSON.parse(api.slots.get(api.SAVE_KEY)).customFlag, "keep");
});

test("menu and world saves preserve a live battle's partner reference and its next HP/XP change", async () => {
  const api = await fixture({ "420mon-progress-v1": { team: [living], inventory: { seed_ordinary: 2 }, gold: 50 } });
  const state = api.getSave();
  const ally = state.team[0];
  let notifications = 0;
  window.addEventListener("420mon-save-changed", () => {
    notifications++;
    assert.strictEqual(api.getSave(), state);
    assert.strictEqual(api.getSave().team[0], ally);
  });
  api.saveProgress({ map: "yard", x: 200, y: 150 });
  ally.hp = 2;
  ally.xp += 15;
  api.saveProgress();
  state.inventory.seed_ordinary--;
  api.saveProgress();
  ally.hp = 0;
  ally.xp += 3;
  api.saveProgress();
  const disk = JSON.parse(api.slots.get(api.SAVE_KEY));
  assert.equal(disk.team[0].hp, 0);
  assert.equal(disk.team[0].xp, 25);
  assert.equal(disk.map, "yard");
  assert.equal(disk.inventory.seed_ordinary, 1);
  assert.equal(notifications, 4);
});

test("healing never revives defeated monsters and preserves original calculated max HP", async () => {
  const api = await fixture();
  const a = { ...living, hpMax: 100, hp: 7 };
  const b = { ...defeated, hpMax: 140 };
  assert.equal(api.healLiving([a, b], 0.25), 1);
  assert.equal(a.hp, 32);
  assert.equal(b.hp, 0);
  assert.equal(api.healLiving([a, b]), 1);
  assert.equal(a.hp, 100);
  assert.equal(b.hp, 0);
  assert.equal(api.healLiving([a, b]), 0);
  assert.equal(api.healLiving([a, b], NaN), 0);
});

test("original 2D save imports party, IVs, inventory, quests, growth and map without overwriting it", async () => {
  const original = { party: [{ uid: "original-mon", id: "mon_budling", level: 42, xp: 33, hp: 0, hpMax: 120, moves: ["move_tackle"], ivs: { hp: 94 }, status: "poison" }], box: [{ ...living, hpMax: 50 }], inv: { seed_ordinary: 4, key_dex: 1 }, caught: ["mon_budling"], stats: { monsCaught: 12, battlesWon: 6, plantsHarvested: 3 }, gold: 777, quests: { q1_bolt: "done" }, map: "capsule", x: 150, y: 130, lastUnix: 100, pots: [{ id: 0, seed: "seed_ordinary", phase: "ready", timeLeft: 0, total: 200, fert: "" }], potsUnlocked: 4, eddiIn: true };
  const api = await fixture({ "420mon_save_v1": original });
  const source = api.slots.get("420mon_save_v1");
  const save = api.getSave();
  assert.equal(save.team[0].name, "Budling");
  assert.equal(save.team[0].hp, 0);
  assert.equal(api.maxHp(save.team[0]), 120);
  assert.deepEqual(save.team[0].ivs, { hp: 94 });
  assert.equal(save.box.length, 1);
  assert.equal(save.inventory.seed_ordinary, 4);
  assert.equal(save.quests.q1_bolt, "done");
  assert.equal(save.captures, 12);
  assert.equal(save.wins, 6);
  assert.equal(save.pots[0].phase, "ready");
  assert.equal(save.potsUnlocked, 4);
  assert.equal(save.lastGrowAt, 100000);
  assert.equal(save.x, 150);
  api.saveProgress();
  assert.equal(api.slots.get("420mon_save_v1"), source);
});

test("corrupt primary recovers backup; current 3D save takes priority over original", async () => {
  const recovery = await fixture({ "420mon-progress-v1": "{broken", "420mon-progress-v1_bak": { team: [defeated], gold: 555 }, "420mon_save_v1": { party: [living], gold: 999 } });
  assert.equal(recovery.getSave().gold, 555);
  assert.equal(recovery.getSave().team[0].hp, 0);
  recovery.saveProgress();
  assert.equal(JSON.parse(recovery.slots.get(recovery.SAVE_KEY)).gold, 555);
  assert.equal(JSON.parse(recovery.slots.get(`${recovery.SAVE_KEY}_bak`)).gold, 555);
});

test("invalid legacy numbers normalize safely and historical prototype-era partners survive", async () => {
  const api = await fixture({ "420mon-progress-v1": { team: [{ name: "Neonix", level: -20, hp: 0, xp: -4 }, { name: "Voltling", level: 999, hp: 90 }], balls: -5, gold: -7, inventory: { seed_ordinary: 3, bad: "999", negative: -1 }, boxesUnlocked: 999 } });
  const save = api.getSave();
  assert.equal(save.balls, 0);
  assert.equal(save.gold, 0);
  assert.equal(save.team[0].level, 1);
  assert.equal(save.team[0].hp, 0);
  assert.equal(save.team[1].level, 420);
  assert.equal(save.team[1].hp, 90);
  assert.equal(api.maxHp(save.team[1]), 90);
  assert.equal(save.boxesUnlocked, 6);
  assert.deepEqual(save.inventory, { seed_ordinary: 3 });
});

test("fresh save uses original inventory once and creates only known original partners", async () => {
  const api = await fixture();
  assert.equal(api.getSave().inventory.seed_ordinary, 1);
  const dead = api.createPartner("mon_budling", 1, 0);
  assert.equal(dead.hp, 0);
  api.getSave().team.push(dead);
  api.saveProgress();
  assert.equal(api.getSave().inventory.seed_ordinary, 1);
  assert.throws(() => api.createPartner("fake_species"), /Unbekanntes/);
});

test("the published test channel uses a separate save while the stable release keeps its original key", async () => {
  const api = await fixture();
  assert.equal(api.saveKeyForBase('/420mon-3D/test/'), '420mon-test-progress-v1');
  assert.equal(api.saveKeyForBase('/420mon-3D/'), '420mon-progress-v1');
  assert.equal(api.saveKeyForBase('/'), '420mon-progress-v1');
});
