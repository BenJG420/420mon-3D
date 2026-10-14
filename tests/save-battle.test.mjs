import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "vite";
import * as THREE from "three";

class Element {
  hidden = false;
  disabled = false;
  style = {};
  children = [];
  nodes = new Map();
  listeners = new Map();
  set innerHTML(html) {
    for (const match of html.matchAll(/id="([^"]+)"/g)) this.nodes.set(`#${match[1]}`, new Element());
  }
  querySelector(selector) { return this.nodes.get(selector); }
  appendChild(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(type, callback) { this.listeners.set(type, callback); }
  click() { this.listeners.get("click")?.(); }
}

async function gameFixture(team) {
  const slots = new Map([["420mon-progress-v1", JSON.stringify({ team, balls: 20, inventory: {}, collection: [], box: [], captures: 0, wins: 0 })]]);
  globalThis.localStorage = { getItem: key => slots.get(key) ?? null, setItem: (key, value) => slots.set(key, value) };
  globalThis.window = new EventTarget();
  const app = new Element();
  globalThis.document = { createElement: () => new Element(), querySelector: () => app };
  // Rendering alone is mocked; battle, shared persistence, and original monster data run unchanged.
  const server = await createServer({
    root: new URL("..", import.meta.url).pathname,
    server: { middlewareMode: true },
    appType: "custom", logLevel: "silent",
    plugins: [{
      name: "test-monster-rendering",
      enforce: "pre",
      resolveId(source, importer) {
        if (source === "./monster-art" && importer?.endsWith("/monsters.ts")) return "\0test-monster-art";
      },
      load(id) {
        if (id !== "\0test-monster-art") return;
        return `import * as THREE from 'three';
          export function createMonsterArt() { const g=new THREE.Group(); g.add(new THREE.Object3D()); return g; }
          export function setMonsterArt() {}
          export function disposeMonsterArt(group) { group.removeFromParent(); }`;
      },
    }],
  });
  const module = await server.ssrLoadModule("/src/game/monsters.ts");
  const scene = new THREE.Scene();
  const player = new THREE.Group();
  const world = {
    current: () => "alley",
    getMapInfo: () => ({ map: { objs: [{ kind: "wild", id: "fixture", mon: "mon_puffpuff", lvl: 50, x: 0, y: 0, w: 0, h: 0 }], zones: [] } }),
    toWorld: (x, y) => ({ x, z: y }), collides: () => false,
  };
  const game = module.createMonsterGame(scene, player, world);
  window.dispatchEvent(new CustomEvent("420mon-district-change", { detail: "alley" }));
  game.update(2);
  const ui = app.children[0];
  const get = id => ui.querySelector(`#${id}`);
  return { module, game, get, slots, server, disk: () => JSON.parse(slots.get("420mon-progress-v1")) };
}

const mon = (hp, index = 0) => ({ uid: `team-${index}`, id: "mon_budling", name: "Budling", level: 5, xp: 0, hp, hpMax: 100 });

test("consecutive turns save actual partner HP after save-change events, and healing preserves 0HP", async () => {
  const random = Math.random;
  Math.random = () => 0.4;
  const fixture = await gameFixture([mon(100), mon(0, 1)]);
  try {
    fixture.get("monster-interact").click();
    assert.equal(fixture.game.inBattle, true);
    fixture.get("monster-attack").click();
    assert.equal(fixture.disk().team[0].hp, 90);
    fixture.get("monster-attack").click();
    assert.equal(fixture.disk().team[0].hp, 80, "second turn must update the stored partner, not a stale detached object");
    fixture.get("monster-run").click();
    fixture.get("monster-heal").click();
    assert.equal(fixture.disk().team[0].hp, 100);
    assert.equal(fixture.disk().team[1].hp, 0);
  } finally { Math.random = random; await fixture.server.close(); }
});

test("full-team capture enters storage with positive actual HP and records one species", async () => {
  const random = Math.random;
  Math.random = () => 0;
  const fixture = await gameFixture(Array.from({ length: 6 }, (_, index) => mon(100, index)));
  try {
    fixture.get("monster-interact").click();
    fixture.get("monster-catch").click();
    const saved = fixture.disk();
    assert.equal(saved.team.length, 6);
    assert.equal(saved.box.length, 1);
    assert.ok(saved.box[0].hp > 0);
    assert.equal(saved.box[0].id, "mon_puffpuff");
    assert.deepEqual(saved.collection.sort(), ["mon_budling", "mon_puffpuff"].sort());
    assert.equal(saved.captures, 1);
    assert.equal(saved.balls, 19);
    assert.equal(fixture.game.inBattle, false);
    assert.ok(saved.deadWild.includes("alley:fixture"));
  } finally { Math.random = random; await fixture.server.close(); }
});

test("defeated wild cannot be captured after victory", async () => {
  const random = Math.random;
  Math.random = () => 0.4;
  const fixture = await gameFixture([{ ...mon(100), level: 420 }]);
  try {
    fixture.get("monster-interact").click();
    fixture.get("monster-attack").click();
    assert.equal(fixture.game.inBattle, false);
    fixture.get("monster-catch").click();
    const saved = fixture.disk();
    assert.equal(saved.wins, 1);
    assert.equal(saved.captures, 0);
    assert.equal(saved.box.length, 0);
    assert.equal(saved.team.length, 1);
    assert.equal(saved.team[0].xp, 15);
  } finally { Math.random = random; await fixture.server.close(); }
});

test("original encounter weights and inclusive district level bands are honored", async () => {
  const fixture = await gameFixture([]);
  try {
    const pool = [{ id: "common", lvl: [42, 55], w: 5 }, { id: "rare", lvl: [58, 72], w: 2 }];
    assert.equal(fixture.module.pickEncounter(pool, () => 0).id, "common");
    assert.equal(fixture.module.pickEncounter(pool, () => 4.999 / 7).id, "common");
    assert.equal(fixture.module.pickEncounter(pool, () => 5.001 / 7).id, "rare");
    assert.equal(fixture.module.encounterLevel(pool[1], () => 0), 58);
    assert.equal(fixture.module.encounterLevel(pool[1], () => 1), 72);
    assert.equal(fixture.module.pickEncounter([], () => 0), undefined);
  } finally { await fixture.server.close(); }
});
