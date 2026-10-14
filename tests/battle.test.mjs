import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createServer } from "vite";

const server = await createServer({ root: new URL("..", import.meta.url).pathname, server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
after(() => server.close());
const battle = await server.ssrLoadModule("/src/game/battle.ts");
const { DEX_ORDER, speciesById } = await server.ssrLoadModule("/src/game/data/dex.ts");
const rewards = await server.ssrLoadModule("/src/game/battle-rewards.ts");
const { ITEMS } = await server.ssrLoadModule("/src/game/data/items.ts");
const fixed = battle.ensureIvs();
const fighter = (id, level = 20, ivs = fixed, wild = false) => battle.toFighter(battle.makeInst(id, level, ivs), wild);
function randomAt(n, callback) {
  const previous = Math.random;
  Math.random = () => n;
  try { return callback(); } finally { Math.random = previous; }
}

test("original stats use all six IVs and normalization preserves defeated saves and extra fields", () => {
  assert.deepEqual(battle.statsFor("mon_budling", 5, fixed), { hp: 19, atk: 10, def: 9, spa: 10, spd: 10, spe: 9 });
  const raw = { uid: "old", id: "mon_budling", name: "Budling", level: 5, xp: 8, hp: 0, hpMax: 47, ivs: { atk: 99 }, souvenir: "keep" };
  const inst = battle.normalizePartnerForBattle(raw);
  assert.equal(raw.hp, 0); assert.equal(raw.hpMax, 47); assert.equal(raw.souvenir, "keep");
  assert.equal(inst.ivs.atk, 99); assert.equal(inst.ivs.hp, 50); assert.equal(inst.moves.length, 4);
  assert.notStrictEqual(inst, raw);
  assert.throws(() => battle.normalizePartnerForBattle({ name: "Old prototype", level: 1, hp: 9 }), /Kein Original/);
});

test("physical and special defenses differ, and the original type immunity prevents damage", () => randomAt(.5, () => {
  const attacker = fighter("mon_budling");
  const weak = fighter("mon_puffpuff", 20, { ...fixed, def: 1 }, true);
  const strong = fighter("mon_puffpuff", 20, { ...fixed, def: 100 }, true);
  const before = weak.inst.hp;
  battle.execMove(attacker, weak, "move_tackle"); battle.execMove(attacker, strong, "move_tackle");
  assert.ok(before - weak.inst.hp > before - strong.inst.hp);
  const ghost = fighter(DEX_ORDER.find(id => speciesById(id).types.includes("ghost")), 20, fixed, true);
  const hp = ghost.inst.hp;
  assert.match(battle.execMove(attacker, ghost, "move_tackle").map(e => e.text).join(" "), /Kein Effekt/);
  assert.equal(ghost.inst.hp, hp);
}));

test("self boosts raise own stages, debuffs lower the target, and stages stop at six", () => randomAt(.5, () => {
  const own = fighter("mon_budling"), enemy = fighter("mon_puffpuff", 20, fixed, true);
  const speed = battle.turnSpe(own);
  for (let i = 0; i < 8; i++) battle.execMove(own, enemy, "move_agility");
  assert.equal(own.stages.spe, 6); assert.equal(enemy.stages.spe, 0); assert.ok(battle.turnSpe(own) > speed);
  battle.execMove(own, enemy, "move_growl"); assert.equal(enemy.stages.atk, -1); assert.equal(own.stages.atk, 0);
}));

test("sleep prevents a turn then wakes, poison can defeat, and KO prevents further attacks or guaranteed capture", () => randomAt(.5, () => {
  const own = fighter("mon_budling"), enemy = fighter("mon_puffpuff", 20, fixed, true);
  own.inst.status = "sleep"; own.sleepTurns = 2;
  const hp = enemy.inst.hp;
  assert.match(battle.execMove(own, enemy, "move_tackle")[0].text, /schläft/); assert.equal(enemy.inst.hp, hp);
  battle.execMove(own, enemy, "move_tackle"); assert.equal(own.inst.status, ""); assert.ok(enemy.inst.hp < hp);
  enemy.inst.status = "poison"; enemy.inst.hp = 1;
  battle.tickStatus(enemy); assert.equal(enemy.inst.hp, 0);
  const guaranteed = Object.values(ITEMS).find(item => item.sureCatch).id;
  assert.equal(battle.catchChance(enemy, guaranteed), 0);
  assert.deepEqual(battle.execMove(enemy, own, "move_tackle"), []);
}));

test("source XP evolves Budling at level sixteen, refreshes its moves, and never revives HP0", () => {
  const own = battle.makeInst("mon_budling", 15, fixed);
  own.xp = battle.xpToNext(15); own.hp = 1;
  const lines = battle.tryLevel(own);
  assert.equal(own.level, 16); assert.equal(own.id, "mon_lustleaf");
  assert.equal(own.hp, own.hpMax); assert.deepEqual(own.moves, speciesById("mon_lustleaf").moves);
  assert.ok(lines.some(line => line.includes("evolviert")));
  const dead = battle.makeInst("mon_budling", 15, fixed); dead.hp = 0; dead.xp = battle.xpToNext(15);
  battle.tryLevel(dead); assert.equal(dead.hp, 0);
  const cap = battle.makeInst("mon_budling", 420, fixed); cap.xp = 999; battle.tryLevel(cap); assert.equal(cap.xp, 0);
});


test("original outfit/sewer rewards and timed legacy capture buffs expire by playtime", () => {
  assert.equal(rewards.battleGoldReward({ map: "sewer", outfit: "nude", flagLowtown: true }, 100), 140);
  assert.equal(rewards.battleGoldReward({ map: "yard", outfit: "wear_overalls" }, 100), 121);
  const base = rewards.battleCatchBoost({ map: "market", outfit: "wear_collar" });
  const active = { map: "market", outfit: "wear_collar", highMul: 2, highUntil: 20, playtime: 10 };
  assert.equal(rewards.battleCatchBoost(active), base * 2);
  assert.equal(rewards.battleCatchBoost({ ...active, playtime: 20 }), base);
  assert.equal(rewards.battleCatchBoost({ ...active, highCatchUntil: 5 }), base, "an expired modern deadline cannot restart a legacy buff");
});
