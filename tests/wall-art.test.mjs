import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export { createWallArt } from "./src/game/wall-art.ts";
    export { createDistrictWorld } from "./src/game/world.ts";
    export { MAPS } from "./src/game/data/maps.ts";
    export * as THREE from "three";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { THREE, createWallArt, createDistrictWorld, MAPS } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`,
);
const nodes = (root, predicate) => { const result = []; root.traverse(node => { if (predicate(node)) result.push(node); }); return result; };
function withDom(run) {
  const keys = ["window", "document", "localStorage", "CustomEvent", "performance"];
  const saved = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const data = new Map([["420mon-progress-v1", JSON.stringify({ gold: 150, map: "alley", x: 80, y: 740, starterId: "mon_budling", visitedMaps: ["alley", "yard", "cable"] })]]);
  const painted = [], canvases = [];
  const context = new Proxy({}, { get: (_, key) => key === "createRadialGradient" || key === "createLinearGradient" ? () => ({ addColorStop() {} })
    : key === "createImageData" ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h })
      : key === "fillText" ? text => painted.push(text) : () => {} });
  let clock = 0;
  Object.defineProperty(globalThis, "performance", { configurable: true, value: { now: () => clock } });
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  globalThis.document = { body: { classList: { contains: () => false } },
    querySelector: selector => selector === "#app" ? { append() {} } : null,
    createElement: tag => { if (tag !== "canvas") return { dataset: {}, setAttribute() {} }; const canvas = { width: 0, height: 0, getContext: () => context }; canvases.push(canvas); return canvas; },
  };
  globalThis.window = { addEventListener() {}, dispatchEvent: () => true };
  globalThis.CustomEvent = class extends Event { constructor(type, options) { super(type); this.detail = options?.detail; } };
  try { run({ painted, canvases, setClock: value => { clock = value; } }); }
  finally { for (const key of keys) { if (saved[key]) Object.defineProperty(globalThis, key, saved[key]); else delete globalThis[key]; } }
}

test("wall art uses one bounded atlas, valid face geometry and once-only owned disposal", () => withDom(({ painted, canvases }) => {
  const art = createWallArt(), texture = art.material.map;
  assert.equal(canvases.length, 1); assert.equal(texture.image.width, 1024); assert.equal(texture.image.height, 512);
  assert.equal(texture.colorSpace, THREE.SRGBColorSpace);
  assert.ok(painted.includes("420") && painted.includes("GROW") && painted.includes("BLEIBT") && painted.includes("SIGNAL"));
  assert.equal(art.material.transparent, false); assert.ok(art.material.alphaTest > 0); assert.equal(art.material.depthWrite, false);
  assert.equal(art.geometry(.8, .7, .15, 2), undefined);
  for (const [w, d, h, band] of [[12, 8, 6, .6], [144, 2.16, 2.85, 1.8], [4, 3, .72, .6]]) {
    const geometry = art.geometry(w, d, h, 2, band), repeat = art.geometry(w, d, h, 2, band);
    assert.deepEqual([...geometry.getAttribute("position").array], [...repeat.getAttribute("position").array]);
    assert.deepEqual([...geometry.userData.wallArtTypes].sort(), ["graffiti", "poster", "sticker"]);
    assert.ok(geometry.index.count <= 24 * 6, "wall details remain at most 24 quads in one batch");
    const position = geometry.getAttribute("position"), normal = geometry.getAttribute("normal"), uv = geometry.getAttribute("uv");
    for (let i = 0; i < position.count; i++) {
      assert.ok(uv.getX(i) > 0 && uv.getX(i) < 1 && uv.getY(i) > 0 && uv.getY(i) < 1);
      assert.ok(position.getY(i) >= 0 && position.getY(i) <= Math.min(band, h - .08) + 1e-6, "art stays below original windows/caps");
      if (Math.abs(normal.getX(i)) > .9) assert.ok(Math.abs(position.getX(i) - normal.getX(i) * (w / 2 + .09)) < 1e-5);
      else assert.ok(Math.abs(position.getZ(i) - normal.getZ(i) * (d / 2 + .09)) < 1e-5);
    }
    geometry.dispose(); repeat.dispose();
  }
  let materialDisposals = 0, textureDisposals = 0;
  art.material.addEventListener("dispose", () => materialDisposals++); texture.addEventListener("dispose", () => textureDisposals++);
  art.dispose(); art.dispose(); assert.equal(materialDisposals, 1); assert.equal(textureDisposals, 1);
}));

test("district wall art shares wall fades and its atlas; existing lamp budgets and actors are preserved", () => withDom(({ setClock }) => {
  const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); player.add(body);
  const world = createDistrictWorld(new THREE.Scene(), player), textures = new Set();
  let oldArt = [], oldResources = new Map();
  for (const id of ["alley", "yard", "cable"]) {
    const source = JSON.stringify(MAPS[id]);
    if (id !== "alley") world.travel(id);
    assert.equal(world.current(), id);
    assert.ok([...oldResources.values()].every(count => count === 1), "previous wall batches release their geometry and fading materials once");
    const root = world.getRoot(), art = nodes(root, node => node.name === "district-wall-art");
    assert.ok(art.length > 0 && art.length <= 24);
    for (const part of art) {
      assert.deepEqual([...part.userData.artTypes].sort(), ["graffiti", "poster", "sticker"]);
      assert.ok(world.getOccluders().includes(part));
      assert.ok(world.getOccluders().some(wall => wall.uuid === part.userData.occlusionGroup && wall.name.startsWith("original-wall:")));
      assert.equal(part.castShadow, false); assert.equal(part.material.userData.sharedTexture, true); textures.add(part.material.map);
    }
    const lights = nodes(root, node => node.isPointLight), flicker = lights.filter(node => node.name === "flickering-district-lamp");
    const sourceLamps = MAPS[id].objs.filter(obj => obj.kind === "lamp");
    assert.equal(flicker.length, Math.min(2, sourceLamps.length));
    assert.equal(lights.length, MAPS[id].objs.filter(obj => obj.kind === "lamp" || obj.kind === "door").length, "no point lights are added for wall art or flicker");
    const emitters = nodes(root, node => node.name === "flickering-lamp-emitter");
    assert.equal(new Set(emitters.map(node => node.material)).size, emitters.length);
    const steady = sourceLamps.slice(2).flatMap(obj => nodes(root.getObjectByName(`map-object:${obj.id}`), node => node.isMesh && node.material.emissive?.getHex() > 0));
    for (const emitter of emitters) assert.ok(steady.every(node => node.material !== emitter.material), "flicker cannot mutate steady shared lamp materials");
    const before = steady.map(node => node.material.emissiveIntensity);
    const actors = MAPS[id].objs.filter(obj => obj.kind === "npc").map(obj => root.getObjectByName(`map-object:${obj.id}`));
    const children = actors.map(actor => [...actor.children]);
    setClock(10000); world.update();
    assert.deepEqual(steady.map(node => node.material.emissiveIntensity), before);
    actors.forEach((actor, index) => assert.deepEqual(actor.children, children[index]));
    assert.deepEqual(player.children, [body]); assert.equal(JSON.stringify(MAPS[id]), source);
    assert.ok(lights.filter(light => light.visible).length <= (MAPS[id].indoor ? 5 : 4));
    oldArt = art; oldResources = new Map(art.flatMap(node => [node.geometry, node.material]).map(resource => [resource, 0]));
    for (const resource of oldResources.keys()) resource.addEventListener("dispose", () => oldResources.set(resource, oldResources.get(resource) + 1));
  }
  assert.equal(textures.size, 1, "district travel retains one shared atlas");
  let atlasDisposed = 0; [...textures][0].addEventListener("dispose", () => atlasDisposed++);
  world.travel("capsule");
  assert.equal(atlasDisposed, 0); assert.ok(oldArt.every(node => node.parent === null));
  assert.ok([...oldResources.values()].every(count => count === 1));
  assert.equal(nodes(world.getRoot(), node => node.name === "district-wall-art" || node.name === "flickering-district-lamp").length, 0);
  body.geometry.dispose(); body.material.dispose();
}));
