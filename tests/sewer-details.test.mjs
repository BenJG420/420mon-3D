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

test("Kanal preserves its original route, actors and saves with locally culled service details", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent", "performance"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const legacy = JSON.stringify({ gold: 777, starterId: "mon_budling", inventory: { seed_kush: 7 } });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "sewer", x: 100, y: 230, trainerLv: 99,
      starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["sewer", "kai"] })],
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
  let now = 100; Object.defineProperty(globalThis, "performance", { configurable: true, value: { now: () => now } });
  try {
    const definition = MAPS.sewer, source = JSON.stringify(definition);
    const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); player.add(body);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    const save = structuredClone(getSave()), stored = [...data], position = player.position.clone();
    assert.strictEqual(world.getMapInfo().map, definition);
    assert.equal(definition.walls.length, 4);
    const walls = definition.walls.map((rect, i) => {
      const wall = root.getObjectByName(`original-wall:${i}`); assert.ok(wall);
      closeTo(size(wall).x, rect.w * .06); closeTo(size(wall).z, rect.h * .06);
      closeTo(size(wall).y, i === 0 || i === 2 ? 2.85 : .72); return wall;
    });
    const details = root.children.filter(node => node.name === "sewer-wall-detail");
    assert.equal(details.length, 34);
    for (const group of details) {
      const index = definition.walls.indexOf(group.userData.sourceRect), parts = meshes(group);
      assert.ok(index >= 0); assert.equal(group.userData.districtDetail, "sewer");
      assert.ok(group.userData.sewerFeatures.length && parts.length > 0 && parts.length <= 7);
      for (const part of parts) {
        assert.equal(part.userData.occlusionGroup, walls[index].uuid);
        assert.ok(world.getOccluders().includes(part)); assert.equal(part.castShadow, false);
        assert.ok(size(part).x <= 24.1, "each detail batch has local frustum bounds");
      }
    }
    for (let i = 0; i < walls.length; i++) {
      const groups = details.filter(group => group.userData.sourceRect === definition.walls[i]);
      const width = Math.max(definition.walls[i].w, definition.walls[i].h) * .06;
      assert.equal(groups.length, Math.ceil(width / 24));
    }
    const caps = meshes(root).filter(node => node.name === "sewer-cap"), floor = root.getObjectByName("sewer-service-floor");
    assert.equal(caps.length, 4); assert.equal(floor.material.userData.surface, "stone");
    for (const cap of caps) {
      assert.equal(cap.material.userData.surface, "roof-metal");
      assert.ok(cap.material.map && cap.material.normalMap && cap.material.roughnessMap);
      assert.notEqual(cap.material.map, floor.material.map);
    }
    const objects = definition.objs.filter(obj => obj.kind !== "wild").map(obj => {
      const group = root.getObjectByName(`map-object:${obj.id}`); assert.ok(group); assert.strictEqual(group.userData.object, obj);
      assert.ok(group.position.distanceTo(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2)) < 1e-8); return group;
    });
    const npc = root.getObjectByName("map-object:grate"), npcChildren = [...npc.children];
    const hatches = objects.filter(group => group.userData.object.kind === "manhole").map(group => group.getObjectByName("sewer-hatch-detail"));
    const drains = root.children.filter(group => group.name === "sewer-drain-detail");
    assert.equal(hatches.length, 14); assert.equal(drains.length, 14);
    for (const group of [...hatches, ...drains]) {
      assert.ok(group && meshes(group).length > 0 && meshes(group).length <= 3);
      assert.ok(meshes(group).every(part => !part.castShadow));
    }
    const initialVisibility = details.map(group => group.visible);
    assert.ok(initialVisibility.some(Boolean) && initialVisibility.some(value => !value));
    const east = details.find(group => group.position.x > 170);
    assert.equal(east.visible, false);
    player.position.copy(world.toWorld(6000, 230)); now = 500; world.update();
    assert.equal(east.visible, true, "approaching a distant part of the corridor restores its details");
    player.position.copy(position); now = 1000; world.update();
    assert.deepEqual(details.map(group => group.visible), initialVisibility);
    assert.deepEqual(npc.children, npcChildren); assert.deepEqual(player.children, [body]);
    root.updateMatrixWorld(true);
    const wallParts = world.getOccluders().filter(part => part.userData.occlusionGroup === walls[0].uuid);
    const bounds = new THREE.Box3().setFromObject(walls[0]), x = player.position.x, fade = createPlayerOcclusion();
    for (let frame = 0; frame < 12; frame++) fade.update(wallParts,
      new THREE.Vector3(x, 2, bounds.max.z + 4), new THREE.Vector3(x, 0, bounds.min.z - 4), .1);
    for (const part of wallParts) for (const material of materials(part)) assert.ok(material.opacity < .1, "wall, cap and service fittings fade together");
    fade.dispose();
    for (const rect of [...definition.walls, ...definition.objs]) {
      const p = world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2);
      assert.equal(world.collides(p.x, p.z), collidesOnMap(definition, p.x, p.z, .48, save.deadWild, save.starterId));
    }
    world.setPerformanceMode(false); world.setPerformanceMode(true);
    assert.deepEqual(objects.map(group => root.getObjectByName(group.name)), objects);
    assert.equal(world.getPerformanceStats().objects, 46);
    const lights = nodes(root, node => node.isPointLight);
    assert.equal(lights.length, definition.objs.filter(obj => obj.kind === "lamp").length);
    assert.equal(lights.filter(light => light.name === "flickering-district-lamp").length, 2);
    assert.ok(root.getObjectByName("district-wall-art"));
    assert.equal(nodes(root, node => node.name === "sewer-sign-neon").length, 14);
    assert.ok(root.getObjectByName("street-details").children.every(part => part.isInstancedMesh));
    assert.equal(JSON.stringify(definition), source); assert.deepEqual(getSave(), save); assert.deepEqual([...data], stored);
    const owned = [...details, ...hatches, ...drains].flatMap(meshes).concat(caps);
    const geometryDisposals = watch(owned.map(part => part.geometry));
    const materialDisposals = watch(owned.flatMap(materials).filter(material => material.userData.local));
    const textureDisposals = watch(caps.flatMap(part => [part.material.map, part.material.normalMap, part.material.roughnessMap]));
    const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); root.add(foreign);
    const foreignDisposals = watch([foreign.geometry, foreign.material, body.geometry, body.material]);
    const exit = definition.objs.find(obj => obj.id === "sgully_kai");
    player.position.copy(world.toWorld(exit.x + exit.w / 2, exit.y + exit.h + 9));
    assert.equal(prompt.onclick(), true); assert.equal(world.current(), "kai", "the original eastern hatch still reaches Neonkai");
    for (const counts of [geometryDisposals, materialDisposals]) assert.ok([...counts.values()].every(count => count === 1));
    for (const counts of [textureDisposals, foreignDisposals]) assert.ok([...counts.values()].every(count => count === 0));
    for (const key of ["gold", "inventory", "team", "box", "starterId"]) assert.deepEqual(getSave()[key], save[key]);
    assert.equal(data.get("420mon_save_v1"), legacy); assert.equal(data.get("stable-release-fixture"), "unchanged");
    foreign.geometry.dispose(); foreign.material.dispose(); body.geometry.dispose(); body.material.dispose();
  } finally {
    for (const key of keys) { if (globals[key]) Object.defineProperty(globalThis, key, globals[key]); else delete globalThis[key]; }
  }
});
