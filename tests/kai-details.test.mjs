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
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} ≈ ${expected}`);
function size(mesh) { mesh.geometry.computeBoundingBox(); return mesh.geometry.boundingBox.getSize(new THREE.Vector3()); }
function watch(resources) {
  const counts = new Map([...new Set(resources)].map(resource => [resource, 0]));
  for (const resource of counts.keys()) resource.addEventListener("dispose", () => counts.set(resource, counts.get(resource) + 1));
  return counts;
}

test("Neonkai preserves fishing, routes and collision with bounded wet-quay graphics and owned resources", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const legacy = JSON.stringify({ gold: 777, starterId: "mon_budling", inventory: { seed_kush: 7 } });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "kai", x: 240, y: 128, trainerLv: 99,
      starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["kai", "capsule"] })],
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
    const definition = MAPS.kai, source = JSON.stringify(definition);
    const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); player.add(body);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    const save = structuredClone(getSave()), stored = [...data], position = player.position.clone();
    assert.strictEqual(world.getMapInfo().map, definition);
    assert.equal(definition.walls.length, 5); assert.equal(definition.objs.length, 9);
    const walls = definition.walls.map((rect, i) => {
      const wall = root.getObjectByName(`original-wall:${i}`); assert.ok(wall);
      closeTo(size(wall).x, rect.w * .06); closeTo(size(wall).z, rect.h * .06); return wall;
    });
    closeTo(size(walls[4]).y, .65);
    assert.equal(world.collides(walls[4].position.x, walls[4].position.z), true, "the lowered quay still blocks the original water boundary");
    const details = root.children.filter(node => ["kai-wall-detail", "kai-quay-detail"].includes(node.name));
    assert.equal(details.filter(node => node.name === "kai-wall-detail").length, 4);
    assert.equal(details.filter(node => node.name === "kai-quay-detail").length, 1);
    for (const group of details) {
      const rect = group.userData.sourceRect, index = definition.walls.indexOf(rect), parts = meshes(group);
      assert.ok(index >= 0); assert.equal(group.userData.districtDetail, "kai");
      assert.ok(group.userData.kaiFeatures.length > 0 && parts.length > 0 && parts.length <= 7);
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      assert.ok(parts.every(part => part.userData.occlusionGroup === walls[index].uuid && world.getOccluders().includes(part) && !part.castShadow));
    }
    const caps = meshes(root).filter(node => node.name === "kai-cap"), floor = root.getObjectByName("kai-rain-paving");
    assert.equal(caps.length, 5); assert.ok(floor); assert.equal(floor.material.userData.surface, "stone");
    for (const cap of caps) {
      assert.equal(cap.material.userData.surface, "roof-metal");
      assert.ok(cap.material.map && cap.material.normalMap && cap.material.roughnessMap);
      assert.notEqual(cap.material.map, floor.material.map);
      assert.ok(walls.some(wall => wall.uuid === cap.userData.occlusionGroup));
    }
    const water = root.getObjectByName("kai-water"), pad = root.getObjectByName("kai-transfer-pad");
    assert.ok(water && pad); closeTo(size(water).x, 928 * .06); closeTo(size(water).z, 144 * .06);
    closeTo(size(pad).x, 40 * .06); closeTo(size(pad).z, 16 * .06);
    assert.ok(water.material.roughness < .3 && pad.material.roughness > .3, "only the original water rectangle receives the water finish");
    assert.notStrictEqual(water.material, pad.material);
    const waterDetail = root.getObjectByName("kai-water-detail"); assert.ok(waterDetail);
    assert.ok(meshes(waterDetail).length > 0 && meshes(waterDetail).length <= 2);
    assert.ok(meshes(waterDetail).every(part => !part.castShadow));

    root.updateMatrixWorld(true);
    const wallParts = world.getOccluders().filter(part => part.userData.occlusionGroup === walls[0].uuid);
    const bounds = new THREE.Box3().setFromObject(walls[0]), centre = bounds.getCenter(new THREE.Vector3()), fade = createPlayerOcclusion();
    for (let frame = 0; frame < 12; frame++) fade.update(wallParts,
      new THREE.Vector3(centre.x, centre.y, bounds.max.z + 4), new THREE.Vector3(centre.x, 0, bounds.min.z - 4), .1);
    assert.ok(wallParts.length > 2);
    for (const part of wallParts) for (const material of materials(part)) assert.ok(material.opacity < .1, "cap and fittings fade with their wall");
    fade.dispose(); for (const part of wallParts) for (const material of materials(part)) assert.equal(material.opacity, 1);

    const objects = definition.objs.map(obj => {
      const group = root.getObjectByName(`map-object:${obj.id}`); assert.ok(group); assert.strictEqual(group.userData.object, obj);
      assert.ok(group.position.distanceTo(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2)) < 1e-8); return group;
    });
    const devices = objects.filter(group => group.userData.object.kind === "prop").map(group => group.getObjectByName("kai-device-detail"));
    assert.equal(devices.length, 5);
    for (const detail of devices) assert.ok(detail && meshes(detail).length > 0 && meshes(detail).length <= 6 && meshes(detail).every(part => !part.castShadow));
    const interactions = [];
    world.setInteractionHandler((object, mapId) => { interactions.push([object, mapId]); return true; });
    for (const obj of definition.objs.filter(obj => obj.kind === "prop")) {
      player.position.copy(world.toWorld(obj.x + obj.w / 2, obj.y - 9));
      assert.equal(prompt.onclick(), true); assert.deepEqual(interactions.at(-1), [obj, "kai"]);
    }
    player.position.copy(position);
    for (const rect of [...definition.walls, ...definition.objs]) {
      const p = world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2);
      assert.equal(world.collides(p.x, p.z), collidesOnMap(definition, p.x, p.z, .48, save.deadWild, save.starterId));
    }
    world.setPerformanceMode(false); world.setPerformanceMode(true);
    assert.deepEqual(objects.map(obj => root.getObjectByName(obj.name)), objects);
    assert.deepEqual(player.children, [body]); assert.deepEqual(player.position, position);
    assert.equal(JSON.stringify(definition), source); assert.deepEqual(getSave(), save); assert.deepEqual([...data], stored);
    const lights = nodes(root, node => node.isPointLight);
    assert.equal(lights.length, 1); assert.equal(lights[0].name, "flickering-district-lamp");
    assert.equal(world.getPerformanceStats().objects, 37);
    assert.ok(root.getObjectByName("district-wall-art"));
    const litter = root.getObjectByName("kai-edge-litter"); assert.ok(litter);
    const litterParts = meshes(litter);
    assert.ok(litterParts.length > 0 && litterParts.length <= 8, "four reused prop models keep their separate material batches");
    assert.ok(litterParts.every(part => part.isInstancedMesh && part.count > 0 && part.count <= 16 && !part.castShadow));

    const owned = [...details, ...devices, waterDetail].flatMap(meshes).concat(caps, litterParts, water, pad);
    const geometryDisposals = watch(owned.map(part => part.geometry));
    const materialDisposals = watch(owned.flatMap(materials).filter(material => material.userData.local));
    const textureDisposals = watch(caps.flatMap(part => [part.material.map, part.material.normalMap, part.material.roughnessMap]));
    const instanceDisposals = watch(litterParts);
    const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); root.add(foreign);
    const foreignDisposals = watch([foreign.geometry, foreign.material, body.geometry, body.material]);
    player.position.copy(world.toWorld(320, 100));
    assert.equal(prompt.onclick(), true); assert.equal(world.current(), "capsule", "the original transfer pad still leads home");
    for (const counts of [geometryDisposals, materialDisposals, instanceDisposals])
      assert.ok([...counts.values()].every(count => count === 1), "map-owned resources release exactly once");
    assert.ok([...textureDisposals.values()].every(count => count === 0));
    assert.ok([...foreignDisposals.values()].every(count => count === 0));
    for (const key of ["gold", "inventory", "team", "box", "starterId"]) assert.deepEqual(getSave()[key], save[key]);
    assert.equal(data.get("420mon_save_v1"), legacy); assert.equal(data.get("stable-release-fixture"), "unchanged");
    foreign.geometry.dispose(); foreign.material.dispose(); body.geometry.dispose(); body.material.dispose();
  } finally {
    for (const key of keys) { if (globals[key]) Object.defineProperty(globalThis, key, globals[key]); else delete globalThis[key]; }
  }
});
