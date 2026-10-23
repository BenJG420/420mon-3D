import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const compiled = await build({
  stdin: { contents: 'export { activeHudBuffs } from "./src/game/hud-buffs.ts"; export { consumeSmoke } from "./src/game/fish-consumption.ts"; export { ITEMS } from "./src/game/data/items.ts";', resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { activeHudBuffs, consumeSmoke, ITEMS } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
const fresh = () => ({ inventory: {}, outfit: "nude", playtime: 100, team: [{ hp: 0, xp: 17 }] });

test("joint and bud HUD follows real independent playtime clocks, source values and expiry without mutation", () => {
  const save = fresh(); save.inventory.joint_street = 1;
  const bud = Object.values(ITEMS).find(item => item.cat === "bud" && item.strain !== "hybrid" && item.speedMul > 1);
  save.inventory[bud.id] = 1;
  assert.equal(consumeSmoke(save, "joint_street").ok, true);
  assert.equal(consumeSmoke(save, bud.id).ok, true);
  const original = structuredClone(save), entries = activeHudBuffs(save);
  const catchBuff = entries.find(row => row.id === "high:catch");
  assert.equal(catchBuff.label, "Fang +35%"); assert.equal(catchBuff.time, "42s");
  assert.ok(catchBuff.icon); assert.equal(entries.find(row => row.id === "high:speed").left, bud.highTime);
  assert.deepEqual(save, original, "reading the HUD must not write inventory, HP or clocks");
  save.playtime += 10.2;
  assert.equal(activeHudBuffs(save).find(row => row.id === "high:catch").time, "32s");
  save.playtime = Math.max(save.highCatchUntil, save.highSpeedUntil) + 1;
  assert.equal(activeHudBuffs(save).length, 0);
});

test("legacy clocks, explicit expired deadlines and all five effect labels use the existing save semantics", () => {
  const save = { ...fresh(), highMul: 1.4, highUntil: 125, highSpeed: 1.2, highSpeedUntil: 90,
    highGold: 1.25, highLuck: 1.3, highXp: 1.5 };
  assert.deepEqual(activeHudBuffs(save).map(row => row.id), ["high:catch", "high:gold", "high:luck", "high:xp"]);
  assert.ok(activeHudBuffs(save).every(row => row.time === "25s"));
  save.highCatchUntil = 99;
  assert.ok(!activeHudBuffs(save).some(row => row.id === "high:catch"));
  save.playtime = 125;
  assert.equal(activeHudBuffs(save).length, 0);
});

test("only the active original outfit bonus is shown, with no countdown or stacking across visual slots", () => {
  const save = { ...fresh(), outfit: "wear_overalls", wardrobe: { top: "overalls_top", jacket: "jacket_leather" }, catchPerm: 1.08, schnittTitle: true };
  const snapshot = structuredClone(save), rows = activeHudBuffs(save), clothing = rows.filter(row => row.id.startsWith("wear:"));
  assert.equal(clothing.length, 1); assert.equal(clothing[0].label, "Gold +8% · Loot +5%");
  assert.equal(clothing[0].time, "∞"); assert.equal(clothing[0].left, null); assert.match(clothing[0].title, /solange getragen/);
  assert.ok(rows.some(row => row.id === "permanent:silk" && row.time === "∞"));
  assert.ok(rows.some(row => row.id === "permanent:breeder"));
  assert.deepEqual(save, snapshot);
  save.outfit = "wear_jacket";
  assert.equal(activeHudBuffs(save).filter(row => row.id.startsWith("wear:"))[0].label, "Fang +8%");
  save.outfit = "nude";
  assert.ok(!activeHudBuffs(save).some(row => row.id.startsWith("wear:")));
  save.outfit = "bag";
  assert.equal(activeHudBuffs(save).find(row => row.id.startsWith("wear:")).label, "Loot +12%");
});
