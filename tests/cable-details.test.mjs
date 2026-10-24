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

test("Kabelkeller details preserve original obstacles, routes, actors, lighting budgets and owned resources", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const legacy = JSON.stringify({ gold: 777, inventory: { seed_kush: 7 }, starterId: "mon_budling" });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "cable", x: 90, y: 200,
      starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["alley", "yard", "cable"] })],
    ["420mon_save_v1", legacy], ["stable-release-fixture", "unchanged"],
  ]);
  const context = new Proxy({}, { get: (_, name) => name === "createRadialGradient" || name === "createLinearGradient" ? () => ({ addColorStop() {} })
    : name === "createImageData" ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) : () => {} });
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  globalThis.document = { body: { classList: { contains: () => false } },
    querySelector: selector => selector === "#app" ? { append() {} } : null,
    createElement: tag => tag === "canvas" ? { width: 0, height: 0, getContext: () => context } : { dataset: {}, setAttribute() {} },
  };
  globalThis.window = { addEventListener() {}, dispatchEvent: () => true };
  globalThis.CustomEvent = class extends Event { constructor(type, options) { super(type); this.detail = options?.detail; } };
  try {
    const definition = MAPS.cable, source = JSON.stringify(definition);
    const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); player.add(body);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    assert.strictEqual(world.getMapInfo().map, definition);
    const save = structuredClone(getSave()), stored = [...data], position = player.position.clone();
    const racks = root.children.filter(node => node.name === "cable-rack-detail");
    const sourceRacks = definition.obstacles.filter(rect => rect.kind === "rack");
    assert.equal(racks.length, sourceRacks.length);
    const floorMaps = new Set(meshes(root).flatMap(materials).filter(material => ["stone", "asphalt"].includes(material.userData.surface)).map(material => material.map));
    const caps = [];
    for (const rect of sourceRacks) {
      const group = racks.find(node => node.userData.sourceRect === rect); assert.ok(group, "each original cabinet retains its source footprint");
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      const parts = meshes(group), shell = group.getObjectByName("cable-rack:shell"), cap = group.getObjectByName("cable-rack:cap");
      assert.ok(shell && cap); assert.ok(parts.length <= 7, "all cabinet fittings merge into seven or fewer material submissions");
      shell.geometry.computeBoundingBox();
      const size = shell.geometry.boundingBox.getSize(new THREE.Vector3());
      assert.ok(Math.abs(size.x - rect.w * .06) < 1e-5 && Math.abs(size.z - rect.h * .06) < 1e-5);
      assert.ok(Math.abs(size.y - (rect.h >= 70 ? 2.9 : .8)) < 1e-5, "low junction boxes keep their original height");
      for (const part of parts) { assert.equal(part.userData.occlusionGroup, shell.uuid); assert.ok(world.getOccluders().includes(part)); }
      assert.equal(cap.material.userData.surface, "roof-metal");
      assert.ok(cap.material.map && cap.material.normalMap && cap.material.roughnessMap);
      assert.equal(floorMaps.has(cap.material.map), false, "cabinet caps have independent PBR surfaces"); caps.push(cap);
    }
    const walls = root.children.filter(node => node.name === "cable-wall-detail");
    assert.equal(walls.length, definition.walls.length - definition.obstacles.length);
    for (const wall of walls) {
      const parts = meshes(wall); assert.ok(parts.length > 0 && parts.length <= 4);
      for (const part of parts) assert.ok(world.getOccluders().some(original => original.uuid === part.userData.occlusionGroup && original.name.startsWith("original-wall:")));
    }
    const live = root.children.filter(node => node.name === "cable-live-detail");
    assert.equal(live.length, 1); assert.ok(meshes(live[0]).length > 0 && meshes(live[0]).length <= 6);
    const terminals = definition.objs.filter(obj => obj.sprite?.includes("terminal"));
    assert.equal(terminals.length, 4);
    const terminalDetails = terminals.map(obj => root.getObjectByName(`map-object:${obj.id}`).getObjectByName("cable-terminal-detail"));
    for (const detail of terminalDetails) { assert.ok(detail); assert.ok(meshes(detail).length > 0 && meshes(detail).length <= 4); }
    for (const sign of definition.objs.filter(obj => obj.kind === "sign")) assert.ok(root.getObjectByName(`map-object:${sign.id}`).getObjectByName("cable-sign-neon"));
    assert.equal(world.getPerformanceStats().objects, 35, "three runoff puddles join the existing 32 floor instances");
    assert.ok(root.getObjectByName("street-details")?.children.length > 0);
    assert.ok(root.getObjectByName("district-wall-art"));
    const lights = nodes(root, node => node.isPointLight);
    assert.equal(lights.length, definition.objs.filter(obj => obj.kind === "lamp").length, "cabinet lights do not add point lights");
    assert.equal(lights.filter(light => light.name === "flickering-district-lamp").length, 2);

    root.updateMatrixWorld(true);
    const first = racks[0], firstParts = meshes(first), shell = first.getObjectByName("cable-rack:shell"), bounds = new THREE.Box3().setFromObject(shell), centre = bounds.getCenter(new THREE.Vector3());
    const fade = createPlayerOcclusion();
    for (let frame = 0; frame < 12; frame++) fade.update(firstParts, new THREE.Vector3(centre.x, centre.y, bounds.max.z + 4), new THREE.Vector3(centre.x, 0, bounds.min.z - 4), .1);
    for (const part of meshes(first)) assert.ok(part.material.opacity < .1, "fittings fade together with the cabinet hiding the player");
    fade.dispose(); for (const part of meshes(first)) assert.equal(part.material.opacity, 1);

    const objects = definition.objs.filter(obj => obj.kind !== "wild").map(obj => {
      const group = root.getObjectByName(`map-object:${obj.id}`); assert.ok(group); assert.strictEqual(group.userData.object, obj);
      assert.ok(group.position.distanceTo(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2)) < 1e-8); return group;
    });
    const actors = objects.filter(group => group.userData.object.kind === "npc"), children = actors.map(actor => [...actor.children]);
    const points = [...definition.walls, ...definition.objs].map(rect => world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2));
    for (const p of points) assert.equal(world.collides(p.x, p.z), collidesOnMap(definition, p.x, p.z, .48, save.deadWild, save.starterId));
    world.setPerformanceMode(false); world.setPerformanceMode(true);
    assert.deepEqual(objects.map(obj => root.getObjectByName(obj.name)), objects);
    actors.forEach((actor, index) => assert.deepEqual(actor.children, children[index]));
    assert.deepEqual(player.children, [body]); assert.deepEqual(player.position, position);
    assert.equal(JSON.stringify(definition), source); assert.deepEqual(getSave(), save); assert.deepEqual([...data], stored);

    const owned = [...racks, ...walls, ...live, ...terminalDetails].flatMap(meshes);
    const geometryDisposals = watch(owned.map(node => node.geometry));
    const materialDisposals = watch(owned.flatMap(materials).filter(material => material.userData.local));
    const capDisposals = watch(caps.flatMap(node => [node.material.map, node.material.normalMap, node.material.roughnessMap]));
    const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); root.add(foreign);
    const foreignDisposals = watch([foreign.geometry, foreign.material, body.geometry, body.material]);
    world.travel("alley", 384, 80);
    assert.ok([...geometryDisposals.values()].every(count => count === 1));
    assert.ok([...materialDisposals.values()].every(count => count === 1));
    assert.ok([...capDisposals.values()].every(count => count === 0), "cached PBR maps survive district changes");
    assert.ok([...foreignDisposals.values()].every(count => count === 0), "foreign systems and actors retain their assets");
    for (const name of ["cable-rack-detail", "cable-wall-detail", "cable-live-detail", "cable-terminal-detail"]) assert.equal(root.getObjectByName(name), undefined);
    for (const key of ["gold", "inventory", "team", "box", "starterId"]) assert.deepEqual(getSave()[key], save[key]);
    assert.equal(data.get("420mon_save_v1"), legacy); assert.equal(data.get("stable-release-fixture"), "unchanged");
    foreign.geometry.dispose(); foreign.material.dispose(); body.geometry.dispose(); body.material.dispose();
  } finally {
    for (const key of keys) { if (globals[key]) Object.defineProperty(globalThis, key, globals[key]); else delete globalThis[key]; }
  }
});
