import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createServer } from "vite";

const server = await createServer({ root: new URL("..", import.meta.url).pathname, server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
after(() => server.close());
const nim = await server.ssrLoadModule("/src/game/nim.ts");
const { DEX } = await server.ssrLoadModule("/src/game/data/dex.ts");
const { MAPS } = await server.ssrLoadModule("/src/game/data/maps.ts");
const partner = (id, level, hp = 10) => ({ id, name: DEX[id].name, level, hp, hpMax: 60, xp: 17 });
const state = extra => ({ team: [partner("mon_budling", 5)], deadWild: [], inventory: {}, gold: 10, map: "kai", x: 100, y: 100, playtime: 100, ...extra });

test("Nim counters with at most three unique nonlegendary monsters at the highest living level and original IV bounds", () => {
  const party = [partner("mon_budling", 12), partner("mon_puffpuff", 32), partner("mon_jointail", 20), partner("mon_cumulus", 16), partner("mon_firewallf", 420, 0)];
  const before = structuredClone(party);
  for (const [random, expectedIv] of [[0, 58], [1, 75]]) {
    const queue = nim.nimTeam(party, () => random);
    assert.equal(queue.length, 3);
    assert.equal(new Set(queue.map(mon => mon.id)).size, 3);
    for (const mon of queue) {
      assert.equal(mon.level, 32);
      assert.equal(!!DEX[mon.id].legendary, false);
      assert.equal(!!DEX[mon.id].evo, false);
      assert.ok(mon.hp > 0);
      assert.equal(mon.hp, mon.hpMax);
      assert.ok(mon.moves.length > 0 && mon.moves.length <= 4);
      assert.deepEqual(Object.values(mon.ivs), Array(6).fill(expectedIv));
    }
  }
  assert.equal(nim.nimTeam(party.slice(0, 1)).length, 1);
  assert.deepEqual(nim.nimTeam([partner("mon_budling", 420, 0)]), []);
  assert.deepEqual(party, before, "counter-team generation must not heal or alter the player's party");
});

test("starting or declining Nim changes source playtime cooldowns and seen records without paying a trainer reward", () => {
  const s = state({ seen: ["mon_budling"], stats: { battlesWon: 4 }, quests: { q4_fight: "active" } });
  const unchanged = structuredClone({ team: s.team, gold: s.gold, inventory: s.inventory, stats: s.stats, quests: s.quests, deadWild: s.deadWild });
  nim.declineNim(s);
  assert.equal(s.rivalCool, 150);
  const queue = nim.beginNimDuel(s, () => .5);
  assert.equal(queue.length, 1);
  assert.equal(s.rivalCool, 175);
  assert.ok(queue.every(mon => s.seen.includes(mon.id)));
  assert.ok(s.seen.includes("mon_budling"));
  assert.deepEqual({ team: s.team, gold: s.gold, inventory: s.inventory, stats: s.stats, quests: s.quests, deadWild: s.deadWild }, unchanged);
  const defeated = state({ team: [partner("mon_budling", 5, 0)], rivalCool: 123, seen: ["mon_puffpuff"] });
  const before = structuredClone(defeated);
  assert.deepEqual(nim.beginNimDuel(defeated), []);
  assert.deepEqual(defeated, before);
  assert.deepEqual(nim.nimDialogue(defeated), ["Nim: Ohne stehendes Team red ich nicht."]);
});

test("imported rival location and cooldown survive normalization and the original dialogue counts living teammates", () => {
  const s = state({ rivalMap: "scrap", rivalX: 300, rivalY: 420, rivalFacing: 3, rivalCool: 470, team: [partner("mon_budling", 5), partner("mon_firewallf", 420, 0)] });
  const roam = nim.createNimRoam(s);
  assert.deepEqual([s.rivalMap, s.rivalX, s.rivalY, s.rivalFacing, s.rivalCool], ["scrap", 300, 420, 3, 470]);
  assert.deepEqual(roam, { targetX: 300, targetY: 420, wait: 0, stay: 90 });
  assert.deepEqual(nim.nimDialogue(s), ["Nim mustert Budling.", "Lv.5. Dein Stärkstes ist 420. Ich stell 1 dagegen."]);
  assert.deepEqual(nim.nimBody(s), { id: "nim_body", kind: "npc", x: 292, y: 402, w: 16, h: 22, label: "Nim", block: false });
  const fresh = state();
  nim.ensureNimState(fresh);
  assert.equal(fresh.rivalCool, 20);
  const malformed = state({ rivalFacing: 99, rivalX: NaN, rivalY: Infinity, rivalCool: -10 });
  nim.ensureNimState(malformed);
  assert.deepEqual([malformed.rivalX, malformed.rivalY, malformed.rivalFacing, malformed.rivalCool], [0, 0, 3, 0]);
});

test("Nim map hops exclude the previous map and his spawn foot box respects original bounds and obstacles", () => {
  let seed = 42;
  const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  const s = state({ rivalMap: "alley" }), roam = nim.createNimRoam(s);
  for (let i = 0; i < 15; i++) {
    const previous = s.rivalMap;
    nim.hopNim(s, roam, random);
    assert.notEqual(s.rivalMap, previous);
    assert.ok(nim.NIM_MAPS.includes(s.rivalMap));
    assert.ok(roam.stay >= 80 && roam.stay < 150);
    assert.equal(roam.targetX, s.rivalX);
    assert.equal(roam.targetY, s.rivalY);
    const map = MAPS[s.rivalMap];
    assert.ok(s.rivalX >= 24 && s.rivalX <= map.w - 24);
    assert.ok(s.rivalY >= 24 && s.rivalY <= map.h - 24);
  }
  assert.equal(nim.nimOpen("capsule", 1, 1), false);
  assert.equal(nim.nimOpen("not-a-map", 100, 100), false);
  const wall = MAPS.alley.walls[0];
  assert.equal(nim.nimOpen("alley", wall.x + wall.w / 2, wall.y + wall.h / 2), false);
  const obj = MAPS.capsule.objs.find(obj => obj.block);
  assert.equal(nim.nimOpen("capsule", obj.x + obj.w / 2, obj.y + obj.h / 2), false);
});

test("roaming movement follows the source speed, axis collisions, player distance and paused-map behavior", () => {
  const s = state({ rivalMap: "kai", rivalX: 200, rivalY: 100, rivalCool: 1000 });
  const roam = { targetX: 300, targetY: 100, wait: 10, stay: 90 };
  assert.equal(nim.tickNim(s, roam, .5, { blocked: () => false, playerX: 10, playerY: 10 }), false);
  assert.equal(s.rivalX, 217);
  assert.equal(s.rivalY, 100);
  assert.equal(s.rivalFacing, 3);
  nim.tickNim(s, roam, .5, { blocked: () => true, playerX: 10, playerY: 10 });
  assert.equal(s.rivalX, 217);
  assert.equal(roam.wait, .45);
  roam.wait = 10;
  nim.tickNim(s, roam, .5, { blocked: () => false, playerX: 234, playerY: 100 });
  assert.equal(s.rivalX, 217, "Nim must not overlap the player within 14 pixels");
  const before = [s.rivalX, s.rivalY];
  nim.tickNim(s, roam, 1, { paused: true, blocked: () => false });
  assert.deepEqual([s.rivalX, s.rivalY], before);
  s.map = "capsule";
  nim.tickNim(s, roam, 1, { blocked: () => false });
  assert.deepEqual([s.rivalX, s.rivalY], before);
});

test("automatic challenge requires the same map, expired playtime cooldown, proximity and a standing partner", () => {
  const s = state({ rivalMap: "kai", rivalX: 130, rivalY: 100, rivalCool: 101 });
  const roam = { targetX: 130, targetY: 100, wait: 10, stay: 90 };
  const options = { blocked: () => false, playerX: 100, playerY: 100 };
  assert.equal(nim.tickNim(s, roam, 0, options), false);
  s.playtime = 101;
  assert.equal(nim.tickNim(s, roam, 0, options), true);
  assert.equal(nim.tickNim(s, roam, 0, { ...options, paused: true }), false);
  s.team[0].hp = 0;
  assert.equal(nim.tickNim(s, roam, 0, options), false);
  s.team[0].hp = 10;
  s.rivalX = 139;
  assert.equal(nim.tickNim(s, roam, 0, options), false);
  s.map = "ash";
  assert.equal(nim.tickNim(s, roam, 0, options), false);
});

test("original save migration retains daily trainer history and Nim position/cooldown without reviving HP0", async () => {
  const raw = { gold: 91, party: [partner("mon_budling", 12, 0)], deadWild: ["cinder", "gate_soot"], bossDay: { cinder: "2026-10-15", custom: "keep" }, rivalMap: "kai", rivalX: 180, rivalY: 150, rivalCool: 333, playtime: 300 };
  const slots = new Map([["420mon_save_v1", JSON.stringify(raw)]]);
  globalThis.localStorage = { getItem: key => slots.get(key) ?? null, setItem: (key, value) => slots.set(key, value) };
  globalThis.window = new EventTarget();
  const save = await server.ssrLoadModule("/src/game/save.ts");
  const migrated = save.getSave();
  nim.createNimRoam(migrated);
  assert.equal(migrated.team[0].hp, 0);
  assert.deepEqual(migrated.deadWild, raw.deadWild);
  assert.deepEqual(migrated.bossDay, raw.bossDay);
  assert.deepEqual([migrated.rivalMap,migrated.rivalX,migrated.rivalY,migrated.rivalCool], ["kai",180,150,333]);
  save.saveProgress();
  assert.equal(slots.get("420mon_save_v1"), JSON.stringify(raw));
});
