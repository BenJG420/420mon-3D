import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
const { recordAchievementActivity } = await server.ssrLoadModule("/src/game/achievement-activity.ts");

test("stationary, blocked and sub-threshold frames never earn walking achievements", () => {
  const s = { outfit: "wear_trashbag", stats: { steps: 99, nudeSeconds: 2 } };
  for (const distance of [0, -.1, .01, .04, NaN, Infinity, -Infinity]) {
    recordAchievementActivity(s, .05, distance);
  }
  assert.deepEqual(s.stats, { steps: 99, nudeSeconds: 2 });
});

test("actual movement counts exactly one step per frame regardless of distance or frame duration", () => {
  const s = { stats: { steps: 98 } };
  recordAchievementActivity(s, .01, .041);
  assert.equal(s.stats.steps, 99);
  recordAchievementActivity(s, .05, 100);
  assert.equal(s.stats.steps, 100);
  recordAchievementActivity(s, 1, Math.hypot(3, 4));
  assert.equal(s.stats.steps, 101);
});

test("nude time follows source play frames indoors, in menus and in combat, while clothing pauses it", () => {
  const s = { outfit: "nude", map: "capsule", overlay: "can", battle: {}, stats: { nudeSeconds: 599 } };
  recordAchievementActivity(s, .5, 0);
  s.map = "studio";
  recordAchievementActivity(s, .5, 0);
  assert.equal(s.stats.nudeSeconds, 600);
  s.outfit = "wear_trashbag";
  recordAchievementActivity(s, 10, 0);
  assert.equal(s.stats.nudeSeconds, 600);
});

test("malformed durations and counter values cannot poison activity counters", () => {
  const s = { outfit: "nude", stats: { steps: NaN, nudeSeconds: Infinity, goldEarned: 17 } };
  for (const dt of [-1, NaN, Infinity, -Infinity]) recordAchievementActivity(s, dt, 0);
  assert.equal(s.stats.nudeSeconds, 0);
  recordAchievementActivity(s, .25, .1);
  assert.equal(s.stats.nudeSeconds, .25);
  assert.equal(s.stats.steps, 1);
  assert.equal(s.stats.goldEarned, 17);
  for (const stats of [undefined, null, [], "invalid"]) {
    const malformed = { outfit: "nude", stats };
    recordAchievementActivity(malformed, .25, .1);
    assert.deepEqual(malformed.stats, { nudeSeconds: .25, steps: 1 });
  }
});

test("activity does not advance playtime twice, heal defeated partners or consume possessions", () => {
  const s = {
    outfit: "nude", playtime: 123, gold: 40, inventory: { seed_ordinary: 2 },
    stats: { steps: 10, nudeSeconds: 7, battlesWon: 3 },
    team: [{ id: "mon_puffpuff", hp: 0, level: 5, xp: 12 }],
    ach: { silk_deal: "done" },
  };
  const expected = structuredClone(s);
  expected.stats.steps++;
  expected.stats.nudeSeconds += .05;
  recordAchievementActivity(s, .05, 1);
  assert.deepEqual(s, expected);
});
