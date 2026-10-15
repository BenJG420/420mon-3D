import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
const trainers = await server.ssrLoadModule("/src/game/trainers.ts");
const { MAPS } = await server.ssrLoadModule("/src/game/data/maps.ts");
const { battleGoldReward } = await server.ssrLoadModule("/src/game/battle-rewards.ts");
const geometry = await server.ssrLoadModule("/src/game/worldGeometry.ts");
const morning = new Date(2026, 0, 2, 9);
const tomorrow = new Date(2026, 0, 3, 9);
const state = extra => ({
  gold: 0, stats: {}, inventory: { chip_junk: 2 }, deadWild: [], ach: {},
  team: [{ id: "mon_budling", name: "Budling", hp: 20, hpMax: 40, level: 5, xp: 19, status: "poison" }],
  box: [], collection: ["mon_budling"], map: "ash", outfit: "wear_trashbag", ...extra,
});
const find = id => trainers.TRAINERS.find(trainer => trainer.id === id);
const attempt = (s, id, date = morning) => {
  const trainer = find(id);
  const result = trainers.createTrainerAttempt(s, trainer.mapId, id, date);
  assert.ok(result);
  return result;
};

test("seven daily source trainers and three gates use the existing exact map objects and levels", () => {
  assert.equal(trainers.TRAINERS.length, 10);
  assert.deepEqual(trainers.TRAINERS.filter(t => t.daily).map(t => t.id).sort(),
    ["cinder", "tide", "vial", "knuckle", "hush", "glow", "coil"].sort());
  for (const [id, mapId, mon, level] of [
    ["cinder", "ash", "mon_jointail", 39], ["tide", "drain", "mon_cumulus", 31],
    ["vial", "chem", "mon_cracksprite", 54], ["knuckle", "ring", "mon_neonpunx", 89],
    ["hush", "labyrinth", "mon_datawhore", 146], ["glow", "nische", "mon_glitchbitch", 109],
    ["coil", "scrap", "mon_firewallf", 259], ["gate_soot", "ash", "mon_hashound", 33],
    ["gate_sluice", "drain", "mon_puffpuff", 26], ["gate_dose", "chem", "mon_cracksprite", 46],
  ]) {
    const trainer = trainers.trainerById(mapId, id);
    assert.equal(trainer.mon, mon); assert.equal(trainer.level, level);
    assert.equal(trainer.obj, MAPS[mapId].objs.find(obj => obj.id === id));
  }
  assert.equal(trainers.trainerById("capsule", "cinder"), undefined);
});

test("daily keys use the local calendar without UTC conversion or padded month/day", () => {
  assert.equal(trainers.trainerDay(new Date(2026, 0, 2, 0, 1)), "2026-1-2");
  assert.equal(trainers.trainerDay(new Date(2026, 9, 15, 23, 59)), "2026-10-15");
  // Force a Date whose local fields differ from its UTC fields without relying
  // on the runner's time zone; the source must read the local getters.
  const date = new Date("2026-01-01T23:30:00Z");
  date.getFullYear = () => 2026; date.getMonth = () => 0; date.getDate = () => 2;
  assert.equal(trainers.trainerDay(date), "2026-1-2");
});

test("legacy historical wins do not block a daily rematch; settlement records its local day", () => {
  const s = state({ deadWild: ["custom_wild", "cinder"], bossDay: { custom: "keep" } });
  assert.equal(trainers.trainerStatus(s, find("cinder"), morning), "ready");
  const run = attempt(s, "cinder");
  assert.equal(trainers.settleTrainer(s, run, "win", tomorrow).changed, true);
  assert.deepEqual(s.deadWild, ["custom_wild", "cinder"]);
  assert.deepEqual(s.bossDay, { custom: "keep", cinder: "2026-1-3" });
  assert.equal(trainers.trainerStatus(s, find("cinder"), tomorrow), "today");
  assert.equal(trainers.createTrainerAttempt(s, "ash", "cinder", tomorrow), null);
  assert.equal(trainers.trainerStatus(s, find("cinder"), new Date(2026, 0, 4)), "ready");
});

test("capturing a gate clears it permanently and repeated settlement cannot duplicate gold", () => {
  const s = state({ bossDay: { custom: "keep" } });
  const run = attempt(s, "gate_soot");
  assert.equal(trainers.settleTrainer(s, run, "caught", morning).gold, 18);
  assert.equal(trainers.trainerStatus(s, find("gate_soot"), tomorrow), "done");
  assert.equal(trainers.createTrainerAttempt(s, "ash", "gate_soot", tomorrow), null);
  const before = structuredClone(s);
  assert.deepEqual(trainers.settleTrainer(s, run, "win", tomorrow), { gold: 0, lines: [], changed: false });
  assert.deepEqual(s, before); assert.deepEqual(s.bossDay, { custom: "keep" });
});

test("same-day duplicate attempts cannot double-pay a win or capture", () => {
  for (const outcome of ["win", "caught"]) {
    const s = state();
    const first = attempt(s, "cinder"), second = attempt(s, "cinder");
    assert.equal(trainers.settleTrainer(s, first, outcome, morning).gold, 18);
    const before = structuredClone(s);
    assert.equal(trainers.settleTrainer(s, second, outcome, morning).changed, false);
    assert.deepEqual(s, before);
  }
});

test("missing or wholly defeated parties cannot start; a valid living partner allows the challenge", () => {
  for (const team of [[], [{ id: "mon_budling", hp: 0 }], [{ id: "missing", hp: 20 }]]) {
    const s = state({ team }), before = structuredClone(s);
    assert.equal(trainers.createTrainerAttempt(s, "ash", "cinder", morning), null);
    assert.deepEqual(s, before);
  }
  const s = state({ team: [{ id: "mon_budling", hp: 0 }, { id: "mon_neonpunx", hp: 1 }] });
  const before = structuredClone(s);
  assert.ok(trainers.createTrainerAttempt(s, "ash", "cinder", morning));
  assert.equal(trainers.createTrainerAttempt(s, "ash", "missing", morning), null);
  assert.deepEqual(s, before);
});

test("loss and flight spend no trainer reward or daily claim and never heal the team", () => {
  for (const outcome of ["lose", "flee"]) {
    const s = state(), run = attempt(s, "cinder");
    // The ordinary combat engine has defeated the partner by settlement time.
    s.team[0].hp = 0;
    const before = structuredClone(s);
    assert.deepEqual(trainers.settleTrainer(s, run, outcome, morning), { gold: 0, lines: [], changed: false });
    assert.deepEqual(s, before);
    assert.equal(trainers.settleTrainer(s, run, "win", morning).changed, false);
    assert.deepEqual(s, before);
  }
});

test("all seven historical victories grant the source achievement without touching team/items/Dex", () => {
  const s = state({ ach: { custom: "keep", trainer_7: "locked" }, bossDay: { custom: "keep" } });
  const team = structuredClone(s.team), inventory = structuredClone(s.inventory), collection = [...s.collection];
  for (const id of trainers.KIEZ_TRAINERS.slice(0, -1)) trainers.settleTrainer(s, attempt(s, id), "win", morning);
  assert.equal(s.ach.trainer_7, "locked");
  trainers.settleTrainer(s, attempt(s, "coil"), "caught", morning);
  assert.equal(s.ach.trainer_7, "done"); assert.equal(s.ach.custom, "keep");
  assert.equal(s.bossDay.custom, "keep"); assert.equal(s.stats.goldEarned, 126);
  assert.deepEqual(s.team, team); assert.deepEqual(s.inventory, inventory); assert.deepEqual(s.collection, collection);
});

test("trainer bonus uses original clothing/food rules and records earned-gold achievement", () => {
  const s = state({ map: "scrap", outfit: "wear_overalls", playtime: 1, highGold: 1.2, highGoldUntil: 100, gold: 8, stats: { goldEarned: 995 }, ach: { custom: "keep" } });
  const expected = battleGoldReward(s, 18);
  const reward = trainers.settleTrainer(s, attempt(s, "coil"), "win", morning);
  assert.equal(reward.gold, expected); assert.equal(s.gold, 8 + expected);
  assert.equal(s.stats.goldEarned, 995 + expected);
  assert.equal(s.ach.gold_1000, "done"); assert.equal(s.ach.custom, "keep");
});

test("trainer dialogue preserves source intro, clothing response and daily/gate completion lines", () => {
  const s = state({ outfit: "wear_hoodie" });
  assert.deepEqual(trainers.trainerPages(s, find("cinder"), morning), [
    "Cinder hat Asche an den Zähnen.", "Cinder: Jointail tanzt auf Glut. Wer nicht brennt, verliert.",
    "Stoff. Immer noch Knockout.", "Kapuze. Weniger Augen.",
  ]);
  s.outfit = "wear_trashbag";
  assert.ok(trainers.trainerPages(s, find("coil"), morning).includes("Tüte raschelt. Egal. Kampf."));
  s.outfit = "nude";
  assert.ok(trainers.trainerPages(s, find("tide"), morning).includes("Der Blick hängt einen Schlag zu lang. Dann Prügel."));
  s.bossDay = { cinder: "2026-1-2" }; s.deadWild = ["gate_soot"];
  assert.deepEqual(trainers.trainerPages(s, find("cinder"), morning), ["Cinder: Heute reicht. Morgen wieder."]);
  assert.deepEqual(trainers.trainerPages(s, find("gate_soot"), morning), ["Soot: Der Weg ist frei."]);
});

test("cleared gates are excluded while daily trainers remain and source NPC paths stay passable", () => {
  const gate = find("gate_soot").obj, boss = find("cinder").obj;
  assert.equal(geometry.isDefeatedGate(gate, []), false);
  assert.equal(geometry.isDefeatedGate(gate, [gate.id]), true);
  assert.equal(geometry.isDefeatedGate(boss, [boss.id]), false);
  const map = { id: "trainer-path", w: 100, h: 100, walls: [], objs: [{ ...gate, x: 40, y: 40, w: 20, h: 20 }] };
  const point = geometry.mapToWorld(map, 50, 50);
  assert.equal(geometry.collidesOnMap(map, point.x, point.z, .3), false);
  assert.equal(geometry.collidesOnMap(map, point.x, point.z, .3, [gate.id]), false);
  assert.deepEqual(geometry.safeSpawn(map, 50, 50, .3, [gate.id]), { x: 50, y: 50 });
});
