import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.window = new EventTarget();
const fishing = await server.ssrLoadModule("/src/game/fishing-state.ts");
const catalog = await server.ssrLoadModule("/src/game/data/fish.ts");
const consumption = await server.ssrLoadModule("/src/game/fish-consumption.ts");
const grow = await server.ssrLoadModule("/src/game/grow-state.ts");
const { ITEMS } = await server.ssrLoadModule("/src/game/data/items.ts");
const { battleGoldReward } = await server.ssrLoadModule("/src/game/battle-rewards.ts");
const save = await server.ssrLoadModule("/src/game/save.ts");
const fresh = structuredClone(save.getSave());
const state = extra => ({
  ...structuredClone(fresh), map: "kai", gold: 0, inventory: {}, stats: {},
  fishCaught: {}, fishStocked: true, outfit: "wear_trashbag", ...extra,
});
const midZone = session => (session.zone0 + session.zone / 2) % 1;
function cast(s, random = () => .5, now = 1000) {
  const session = fishing.createFishSession();
  assert.equal(fishing.startCast(s, session, "seed_ordinary", now, random).ok, true);
  assert.equal(fishing.readyFish(session, now + session.waitMs), true);
  return session;
}

test("42 original fish remain unique and reachable from Weed seeds with source schools and weights", () => {
  assert.equal(catalog.FISH.length, 42);
  assert.equal(new Set(catalog.FISH.map(fish => fish.id)).size, 42);
  const seeds = Object.values(ITEMS).filter(item => item.cat === "seed" && item.id !== "seed_eddi" && !item.eddiOnly);
  const reachable = new Set(seeds.flatMap(item => catalog.fishForBait(item.id).map(fish => fish.id)));
  assert.deepEqual([...reachable].sort(), catalog.FISH.map(fish => fish.id).sort());
  assert.equal(catalog.fishForBait("seed_eddi").length, 42);
  assert.deepEqual(catalog.fishForBait("seed_ordinary").map(fish => fish.id), ["fish_neonbrasse", "fish_kanalgrundel", "fish_pfuetzenploetze"]);
  assert.deepEqual(catalog.fishForBait("seed_moss").map(fish => fish.id), ["fish_schlickbutt", "fish_siffhecht", "fish_rootwels"]);
  for (const [rarity, zone, weight, payout] of [["gewöhnlich", .3, 10, 8], ["zäh", .2, 5, 16], ["selten", .12, 2, 28], ["bissig", .07, 1, 48]]) {
    for (const fish of catalog.FISH.filter(fish => fish.rarity === rarity)) assert.deepEqual([fish.zone, fish.weight, fish.payout], [zone, weight, payout]);
  }
  assert.equal(catalog.rollFish("seed_ordinary", () => 0).id, "fish_neonbrasse");
  assert.equal(catalog.rollFish("seed_ordinary", () => .34).id, "fish_kanalgrundel");
  assert.equal(catalog.rollFish("seed_ordinary", () => .99).id, "fish_pfuetzenploetze");
});

test("invalid bait or missing seeds changes nothing; one active cast pays exactly one seed", () => {
  const s = state({ inventory: { seed_ordinary: 2, chip_junk: 1 } });
  const session = fishing.createFishSession();
  for (const id of ["chip_junk", "seed_missing", "seed_kush"]) {
    const before = structuredClone(s);
    assert.equal(fishing.startCast(s, session, id, 0, () => .5).ok, false);
    assert.deepEqual(s, before);
    assert.equal(session.phase, "pick");
  }
  assert.equal(fishing.startCast(s, session, "seed_ordinary", 0, () => .5).ok, true);
  assert.equal(s.inventory.seed_ordinary, 1);
  assert.equal(s.pendingFishCast.bait, "seed_ordinary");
  const before = structuredClone(s);
  assert.equal(fishing.startCast(s, session, "seed_ordinary", 1, () => .5).ok, false);
  assert.equal(fishing.startCast(s, fishing.createFishSession(), "seed_ordinary", 1, () => .5).ok, false);
  assert.deepEqual(s, before);
});

test("source 2–8 second wait, 0.55-turn wheel, wrapped target and 280ms hook guard use the shown marker", () => {
  for (const [random, expected] of [[0, 2000], [1, 8000]]) {
    const s = state({ inventory: { seed_ordinary: 1 } });
    const session = fishing.createFishSession();
    fishing.startCast(s, session, "seed_ordinary", 100, () => random);
    assert.equal(session.waitMs, expected);
    assert.equal(fishing.readyFish(session, 100 + expected - 1), false);
    assert.equal(session.phase, "wait");
    assert.equal(fishing.readyFish(session, 100 + expected), true);
    assert.equal(fishing.readyFish(session, 100 + expected + 1), false);
    assert.equal(fishing.fishMarker(session, session.t0 + 1000), .55);
    assert.ok(Math.abs(fishing.fishMarker(session, session.t0 + 2000) - .1) < 1e-9);
  }
  const s = state({ inventory: { seed_ordinary: 1 } });
  const session = cast(s);
  session.zone0 = .9;
  session.zone = .2;
  assert.equal(fishing.fishInZone(session, .95), true);
  assert.equal(fishing.fishInZone(session, .05), true);
  assert.equal(fishing.fishInZone(session, .2), false);
  session.hookAt = session.t0;
  assert.equal(fishing.hookFish(s, session, session.t0 + 279, .95).ok, false);
  assert.equal(session.phase, "wheel");
  assert.equal(fishing.hookFish(s, session, session.t0 + 280, .95).ok, true);
  assert.equal(session.hit, true);
});

test("a catch pays fish, original gold and earning achievement once without changing Dex or team", () => {
  const s = state({
    inventory: { seed_ordinary: 1 }, gold: 7, stats: { goldEarned: 995 },
    team: [{ id: "mon_budling", name: "Budling", level: 5, xp: 17, hp: 0, hpMax: 50 }],
    collection: ["mon_budling"], ach: { existing: "done" },
  });
  const team = structuredClone(s.team), dex = [...s.collection];
  const session = cast(s);
  const target = session.target;
  const reward = battleGoldReward(s, target.payout);
  assert.equal(fishing.hookFish(s, session, session.t0 + 100, midZone(session)).ok, true);
  assert.equal(session.hit, true);
  assert.equal(session.hits, 1);
  assert.equal(session.paid, reward);
  assert.equal(s.gold, 7 + reward);
  assert.equal(s.stats.goldEarned, 995 + reward);
  assert.equal(s.ach.gold_1000, "done");
  assert.equal(s.ach.existing, "done");
  assert.equal(s.inventory.seed_ordinary, 0);
  assert.equal(s.inventory[target.id], 1);
  assert.equal(s.fishCaught[target.id], 1);
  assert.equal(s.pendingFishCast, undefined);
  assert.deepEqual(s.team, team);
  assert.deepEqual(s.collection, dex);
  const settled = structuredClone(s);
  assert.equal(fishing.hookFish(s, session, session.t0 + 1000, midZone(session)).ok, false);
  assert.deepEqual(s, settled);
});

test("timing miss and source junk outcome return exactly the same bait, never trash or gold", () => {
  for (const junk of [false, true]) {
    const s = state({ inventory: { seed_ordinary: 2, chip_junk: 3 }, gold: 10 });
    const session = cast(s, () => junk ? 0 : .5);
    assert.equal(session.junk, junk);
    const position = junk ? midZone(session) : (session.zone0 + session.zone + .1) % 1;
    assert.equal(fishing.hookFish(s, session, session.t0 + 100, position).ok, true);
    assert.equal(session.hit, false);
    assert.equal(s.inventory.seed_ordinary, 2);
    assert.equal(s.inventory.chip_junk, 3);
    assert.equal(s.gold, 10);
    assert.deepEqual(s.fishCaught, {});
    assert.equal(s.pendingFishCast, undefined);
    const settled = structuredClone(s);
    assert.equal(fishing.hookFish(s, session, session.t0 + 1000, position).ok, false);
    assert.equal(fishing.abortFish(s, session).changed, false);
    assert.equal(fishing.recoverInterruptedCast(s), false);
    assert.deepEqual(s, settled);
  }
});

test("closing or reloading either active phase refunds a pending cast exactly once", () => {
  for (const phase of ["wait", "wheel"]) {
    const s = state({ inventory: { seed_ordinary: 1 } });
    const session = fishing.createFishSession();
    fishing.startCast(s, session, "seed_ordinary", 0, () => .5);
    if (phase === "wheel") fishing.readyFish(session, session.waitMs);
    const reloaded = JSON.parse(JSON.stringify(s));
    assert.equal(fishing.recoverInterruptedCast(reloaded), true);
    assert.equal(reloaded.inventory.seed_ordinary, 1);
    assert.equal(fishing.recoverInterruptedCast(reloaded), false);
    assert.equal(fishing.abortFish(reloaded, structuredClone(session)).changed, false);
    assert.equal(reloaded.inventory.seed_ordinary, 1);
    assert.equal(fishing.abortFish(s, session).changed, true);
    assert.equal(s.inventory.seed_ordinary, 1);
    assert.equal(fishing.abortFish(s, session).changed, false);
    assert.equal(fishing.recoverInterruptedCast(s), false);
    assert.equal(s.inventory.seed_ordinary, 1);
  }
});

test("legacy fishStocked migration preserves aquarium history and adds at most 99 per species once", () => {
  const s = state({ fishStocked: false, fishCaught: { fish_neonbrasse: 120, fish_rootwels: 2 }, inventory: { fish_neonbrasse: 3 } });
  fishing.ensureFishState(s);
  assert.equal(s.fishStocked, true);
  assert.equal(s.inventory.fish_neonbrasse, 102);
  assert.equal(s.inventory.fish_rootwels, 2);
  assert.equal(s.fishCaught.fish_neonbrasse, 120);
  fishing.ensureFishState(s);
  assert.equal(s.inventory.fish_neonbrasse, 102);
  assert.equal(s.inventory.fish_rootwels, 2);
  const restored = JSON.parse(JSON.stringify(s));
  fishing.ensureFishState(restored);
  assert.deepEqual(restored, s);
});

test("fish food keeps the strongest buff, extends only to 600 seconds and never heals or removes tank catches", () => {
  const caught = { fish_kaisermuraene: 1, fish_neonbrasse: 1 };
  const s = state({
    playtime: 100, inventory: { fish_kaisermuraene: 1, fish_neonbrasse: 20 },
    fishCaught: caught,
    team: [{ id: "mon_budling", name: "Budling", level: 5, xp: 0, hp: 0, hpMax: 50 }],
  });
  assert.equal(consumption.consumeFish(s, "fish_kaisermuraene").ok, true);
  assert.equal(consumption.fishEffectMultiplier(s, "catch"), 1.65);
  assert.equal(consumption.fishEffectMultiplier(s, "speed"), 1.3);
  assert.equal(s.highCatchUntil, 240);
  assert.equal(consumption.consumeFish(s, "fish_neonbrasse").ok, true);
  assert.equal(consumption.fishEffectMultiplier(s, "catch"), 1.65);
  assert.equal(s.highCatchUntil, 285);
  for (let index = 0; index < 19; index++) assert.equal(consumption.consumeFish(s, "fish_neonbrasse").ok, true);
  assert.equal(s.highCatchUntil, 700);
  assert.equal(s.highSpeedUntil, 240);
  s.playtime = 240;
  assert.equal(consumption.fishEffectMultiplier(s, "speed"), 1);
  assert.equal(consumption.fishEffectMultiplier(s, "catch"), 1.65);
  s.playtime = 700;
  assert.equal(consumption.fishEffectMultiplier(s, "catch"), 1);
  assert.deepEqual(consumption.activeFishEffects(s), []);
  assert.equal(s.team[0].hp, 0);
  assert.deepEqual(s.fishCaught, caught);
  const settled = structuredClone(s);
  assert.equal(consumption.consumeFish(s, "fish_neonbrasse").ok, false);
  assert.deepEqual(s, settled);
});

test("all 42 aquarium species accelerate actual growth by 1.2 only while in the Kapsel", () => {
  const all = Object.fromEntries(catalog.FISH.map(fish => [fish.id, 1]));
  const almost = { ...all };
  delete almost[catalog.FISH[0].id];
  assert.equal(catalog.tankFull(all), true);
  assert.equal(catalog.tankFull(almost), false);
  for (const [map, fishCaught, speed] of [["capsule", all, 1.2], ["kai", all, 1], ["capsule", almost, 1]]) {
    const s = state({ map, fishCaught, inventory: { seed_ordinary: 1 }, lastGrowAt: 1000, team: [] });
    grow.ensureGrowState(s, 1000);
    assert.equal(grow.plantPot(s, 0, "seed_ordinary").ok, true);
    const before = s.pots[0].timeLeft;
    const remaining = grow.growRemaining(s, s.pots[0]);
    grow.advanceGrow(s, 11000);
    assert.ok(Math.abs((before - s.pots[0].timeLeft) - 10 * speed) < 1e-9);
    assert.ok(Math.abs(remaining - before / speed) < 1e-9);
    assert.equal(s.inventory.seed_ordinary, 0);
    assert.deepEqual(s.fishCaught, fishCaught);
  }
});
