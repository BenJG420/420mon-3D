import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export { createDistrictWorld } from "./src/game/world.ts";
    export { createPlayerOcclusion } from "./src/game/occlusion.ts";
    export { MAPS } from "./src/game/data/maps.ts";
    export { collidesOnMap } from "./src/game/worldGeometry.ts";
    export { getSave } from "./src/game/save.ts";
    export * as THREE from "three";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { THREE, createDistrictWorld, createPlayerOcclusion, MAPS, collidesOnMap, getSave } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`,
);
const nodes = (root, predicate) => { const result = []; root.traverse(node => { if (predicate(node)) result.push(node); }); return result; };
const meshes = root => nodes(root, node => node.isMesh);
const materials = node => Array.isArray(node.material) ? node.material : [node.material];
function watch(resources) {
  const counts = new Map([...new Set(resources)].map(resource => [resource, 0]));
  for (const resource of counts.keys()) resource.addEventListener("dispose", () => counts.set(resource, counts.get(resource) + 1));
  return counts;
}
function dimensions(mesh) {
  mesh.geometry.computeBoundingBox(); return mesh.geometry.boundingBox.getSize(new THREE.Vector3());
}
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} ≈ ${expected}`);

test("Kino keeps original interactions and collision while exposing the screen and owning bounded detail resources", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const legacy = JSON.stringify({ gold: 777, starterId: "mon_budling", inventory: { seed_kush: 7 } });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "kino", x: 36, y: 142, trainerLv: 99,
      starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["kino", "market"],
      quests: { q_v_market: "done" }, quest: { q_v_market: true } })],
    ["420mon_save_v1", legacy], ["stable-release-fixture", "unchanged"],
  ]);
  let prompt;
  const context = new Proxy({}, { get: (_, name) => name === "createRadialGradient" || name === "createLinearGradient" ? () => ({ addColorStop() {} })
    : name === "createImageData" ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) : () => {} });
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  globalThis.document = { body: { classList: { contains: () => false } },
    querySelector: selector => selector === "#app" ? { append(node) { if (node.className?.includes("world-interaction")) prompt = node; } } : null,
    createElement: tag => tag === "canvas" ? { width: 0, height: 0, getContext: () => context } : { dataset: {}, setAttribute() {} },
  };
  globalThis.window = { addEventListener() {}, dispatchEvent: () => true };
  globalThis.CustomEvent = class extends Event { constructor(type, options) { super(type); this.detail = options?.detail; } };
  try {
    const definition = MAPS.kino, source = JSON.stringify(definition);
    const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); player.add(body);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    const save = structuredClone(getSave()), stored = [...data], position = player.position.clone();
    assert.strictEqual(world.getMapInfo().map, definition);
    assert.equal(definition.walls.length, 6); assert.equal(definition.objs.length, 6);
    const walls = definition.walls.map((rect, i) => {
      const wall = root.getObjectByName(`original-wall:${i}`); assert.ok(wall);
      const size = dimensions(wall); closeTo(size.x, rect.w * .06); closeTo(size.z, rect.h * .06);
      return wall;
    });
    closeTo(dimensions(walls[5]).y, .28);
    assert.equal(world.collides(walls[5].position.x, walls[5].position.z), true, "lowering the visual plinth does not open the original blocked projection area");
    const details = root.children.filter(node => ["kino-stage-detail", "kino-wall-detail"].includes(node.name));
    assert.equal(details.filter(node => node.name === "kino-stage-detail").length, 1);
    assert.equal(details.filter(node => node.name === "kino-wall-detail").length, 5);
    for (const group of details) {
      const rect = group.userData.sourceRect, index = definition.walls.indexOf(rect), parts = meshes(group);
      assert.ok(index >= 0); assert.equal(group.userData.districtDetail, "kino");
      assert.ok(group.userData.kinoFeatures.length > 0 && parts.length > 0 && parts.length <= 7);
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      assert.ok(parts.every(part => part.userData.occlusionGroup === walls[index].uuid && world.getOccluders().includes(part) && !part.castShadow));
    }
    const caps = meshes(root).filter(node => node.name === "kino-cap"); assert.equal(caps.length, 6);
    assert.deepEqual(caps.map(node => node.material.userData.surface).sort(), ["roof-felt", ...Array(5).fill("roof-metal")]);
    const floorMaps = new Set(meshes(root).flatMap(materials).filter(material => ["stone", "asphalt"].includes(material.userData.surface)).map(material => material.map));
    for (const cap of caps) {
      assert.ok(cap.material.map && cap.material.normalMap && cap.material.roughnessMap);
      assert.equal(floorMaps.has(cap.material.map), false, "caps do not reuse the floor texture");
      assert.ok(walls.some(wall => wall.uuid === cap.userData.occlusionGroup));
    }
    const screen = root.getObjectByName("kino-screen-detail"); assert.ok(screen);
    assert.ok(screen.position.distanceTo(world.toWorld(360, 58)) < 1e-8);
    const backing = screen.getObjectByName("kino-screen-backing"), panel = screen.getObjectByName("kino-screen-panel");
    assert.ok(backing && panel); closeTo(dimensions(backing).x, 33); closeTo(dimensions(backing).y, 3.9);
    closeTo(dimensions(panel).x, 31.5); closeTo(dimensions(panel).y, 3.3);
    const screenParts = meshes(screen); assert.ok(screenParts.length <= 10);
    assert.equal(new Set(screenParts.map(part => part.userData.occlusionGroup)).size, 1);
    assert.ok(screenParts.every(part => part.userData.occlusionGroup && world.getOccluders().includes(part)));
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(backing), centre = bounds.getCenter(new THREE.Vector3()), fade = createPlayerOcclusion();
    for (let frame = 0; frame < 12; frame++) fade.update(screenParts,
      new THREE.Vector3(centre.x, centre.y, bounds.max.z + 4), new THREE.Vector3(centre.x, 0, bounds.min.z - 4), .1);
    for (const part of screenParts) for (const material of materials(part)) assert.ok(material.opacity < .1, "screen, curtains and fittings fade together");
    fade.dispose(); for (const part of screenParts) for (const material of materials(part)) assert.equal(material.opacity, 1);

    const objects = definition.objs.map(obj => {
      const group = root.getObjectByName(`map-object:${obj.id}`); assert.ok(group); assert.strictEqual(group.userData.object, obj);
      assert.ok(group.position.distanceTo(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2)) < 1e-8); return group;
    });
    const devices = objects.filter(group => group.userData.object.kind === "prop").map(group => group.getObjectByName("kino-device-detail"));
    assert.equal(devices.length, 5);
    for (const detail of devices) assert.ok(detail && meshes(detail).length > 0 && meshes(detail).length <= 6);
    const interactions = [];
    world.setInteractionHandler((object, mapId) => { interactions.push([object, mapId]); return true; });
    for (const obj of definition.objs.filter(obj => obj.kind === "prop")) {
      player.position.copy(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h + 9));
      assert.equal(prompt.onclick(), true); assert.deepEqual(interactions.at(-1), [obj, "kino"]);
    }
    player.position.copy(position);
    const points = [...definition.walls, ...definition.objs].map(rect => world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2));
    for (const p of points) assert.equal(world.collides(p.x, p.z), collidesOnMap(definition, p.x, p.z, .48, save.deadWild, save.starterId));
    world.setPerformanceMode(false); world.setPerformanceMode(true);
    assert.deepEqual(objects.map(obj => root.getObjectByName(obj.name)), objects);
    assert.deepEqual(player.children, [body]); assert.deepEqual(player.position, position);
    assert.equal(JSON.stringify(definition), source); assert.deepEqual(getSave(), save); assert.deepEqual([...data], stored);
    const lights = nodes(root, node => node.isPointLight);
    assert.equal(lights.length, 1); assert.equal(lights[0].name, "flickering-district-lamp");
    assert.equal(world.getPerformanceStats().objects, 2, "entry water shares the existing instance renderer");
    assert.ok(root.getObjectByName("district-wall-art"));
    const litter = root.getObjectByName("kino-stage-litter"); assert.ok(litter);
    const litterParts = meshes(litter);
    assert.ok(litterParts.length > 0 && litterParts.length <= 4);
    assert.ok(litterParts.every(part => part.isInstancedMesh && part.count > 0 && part.count <= 16 && !part.castShadow));

    const owned = [...details, ...devices, screen].flatMap(meshes).concat(caps, litterParts);
    const geometryDisposals = watch(owned.map(part => part.geometry));
    const materialDisposals = watch(owned.flatMap(materials).filter(material => material.userData.local));
    const labelDisposals = watch(screenParts.flatMap(materials).filter(material => material.userData.local && !material.userData.sharedTexture && material.map).map(material => material.map));
    const textureDisposals = watch(caps.flatMap(part => [part.material.map, part.material.normalMap, part.material.roughnessMap]));
    const instanceDisposals = watch(litterParts);
    const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); root.add(foreign);
    const foreignDisposals = watch([foreign.geometry, foreign.material, body.geometry, body.material]);
    player.position.copy(world.toWorld(22, 141));
    assert.equal(prompt.onclick(), true); assert.equal(world.current(), "market", "the original exit still reaches Markt");
    for (const counts of [geometryDisposals, materialDisposals, labelDisposals, instanceDisposals])
      assert.ok([...counts.values()].every(count => count === 1), "each map-owned resource is released exactly once");
    assert.ok([...textureDisposals.values()].every(count => count === 0));
    assert.ok([...foreignDisposals.values()].every(count => count === 0));
    for (const key of ["gold", "inventory", "team", "box", "starterId"]) assert.deepEqual(getSave()[key], save[key]);
    assert.equal(data.get("420mon_save_v1"), legacy); assert.equal(data.get("stable-release-fixture"), "unchanged");
    foreign.geometry.dispose(); foreign.material.dispose(); body.geometry.dispose(); body.material.dispose();
  } finally {
    for (const key of keys) { if (globals[key]) Object.defineProperty(globalThis, key, globals[key]); else delete globalThis[key]; }
  }
});
