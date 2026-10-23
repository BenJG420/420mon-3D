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
const meshes = group => { const result = []; group.traverse(node => { if (node.isMesh) result.push(node); }); return result; };
const materials = node => Array.isArray(node.material) ? node.material : [node.material];
function watchDisposals(resources) {
  const counts = new Map([...new Set(resources)].map(resource => [resource, 0]));
  for (const resource of counts.keys()) resource.addEventListener("dispose", () => counts.set(resource, counts.get(resource) + 1));
  return counts;
}

function assertOriginalWorld(world, definition, player, body) {
  const root = world.getRoot(), save = structuredClone(getSave()), position = player.position.clone();
  assert.strictEqual(world.getMapInfo().map, definition);
  const source = JSON.stringify(definition);
  const objects = definition.objs.filter(object => object.kind !== "wild").map(object => {
    const node = root.getObjectByName(`map-object:${object.id}`);
    assert.ok(node, `${definition.id}/${object.id}: original interaction stays visible`);
    assert.strictEqual(node.userData.object, object);
    assert.ok(node.position.distanceTo(world.toWorld(object.x + object.w / 2, object.y + object.h / 2)) < 1e-8);
    return node;
  });
  const actors = objects.filter(node => ["npc", "shop", "stall"].includes(node.userData.object.kind));
  const actorChildren = actors.map(node => [...node.children]);
  const points = [...definition.walls, ...definition.objs].map(rect => world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2));
  const collision = points.map(point => world.collides(point.x, point.z));
  for (let i = 0; i < points.length; i++) assert.equal(collision[i],
    collidesOnMap(definition, points[i].x, points[i].z, .48, save.deadWild, save.starterId), "visual details preserve original collision");
  world.setPerformanceMode(false); world.setPerformanceMode(true);
  assert.deepEqual(objects.map(node => root.getObjectByName(node.name)), objects);
  actors.forEach((node, index) => assert.deepEqual(node.children, actorChildren[index], "graphics mode does not rebuild NPCs"));
  assert.deepEqual(player.children, [body]); assert.deepEqual(player.position, position);
  assert.deepEqual(points.map(point => world.collides(point.x, point.z)), collision);
  assert.equal(JSON.stringify(definition), source); assert.deepEqual(getSave(), save);
}

test("Grow-Hinterhöfe and Moss details preserve original routes, actors, saves and resource ownership", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const legacy = JSON.stringify({ gold: 777, starterId: "mon_budling", inventory: { seed_kush: 7 } });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "yard", x: 1180, y: 540,
      starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["yard", "den_moss", "alley"] })],
    ["420mon_save_v1", legacy], ["stable-release-fixture", "unchanged"],
  ]);
  const context = new Proxy({}, { get: (_, name) => name === "createRadialGradient" || name === "createLinearGradient" ? () => ({ addColorStop() {} })
    : name === "createImageData" ? (width, height) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }) : () => {} });
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  globalThis.document = {
    body: { classList: { contains: () => false } },
    createElement: tag => tag === "canvas" ? { width: 0, height: 0, getContext: () => context } : { dataset: {}, setAttribute() {} },
    querySelector: selector => selector === "#app" ? { append() {} } : null,
  };
  globalThis.window = { addEventListener() {}, dispatchEvent() { return true; } };
  globalThis.CustomEvent = class extends Event { constructor(type, options) { super(type); this.detail = options?.detail; } };
  try {
    const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    player.add(body);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    const snapshot = structuredClone(getSave()), stored = [...data];
    assertOriginalWorld(world, MAPS.yard, player, body);
    assert.deepEqual([...data], stored, "switching graphics modes does not rewrite saves");

    const allMeshes = meshes(root), roofs = allMeshes.filter(node => node.name === "yard-roof");
    assert.equal(roofs.length, 3, "each original blocked inner rectangle becomes a detailed shed");
    assert.deepEqual(roofs.map(node => node.userData.roofKind).sort(), ["roof-felt", "roof-metal", "roof-tile"]);
    const floorMaps = new Set(allMeshes.flatMap(materials).filter(material => ["asphalt", "stone"].includes(material.userData.surface)).map(material => material.map));
    for (const roof of roofs) {
      assert.equal(roof.material.userData.surface, roof.userData.roofKind);
      assert.ok(roof.material.map && roof.material.normalMap && roof.material.roughnessMap);
      assert.equal(floorMaps.has(roof.material.map), false, "roofs do not reuse the floor texture");
      assert.ok(world.getOccluders().some(node => node.uuid === roof.userData.occlusionGroup && node.name.startsWith("original-wall:")));
    }
    const sheds = root.children.filter(node => node.name === "yard-shed-detail");
    const boundaries = root.children.filter(node => node.name === "yard-boundary-detail");
    assert.equal(sheds.length, 3); assert.equal(boundaries.length, 5);
    for (const group of [...sheds, ...boundaries]) {
      const parts = meshes(group), groups = new Set(parts.map(node => node.userData.occlusionGroup));
      assert.equal(group.userData.districtDetail, "yard");
      assert.ok(group.userData.yardFeatures.length > 0);
      assert.ok(parts.length > 0 && parts.length <= 7, "detail geometry stays within seven material submissions per wall");
      assert.equal(groups.size, 1); assert.ok(!groups.has(undefined));
      assert.ok(parts.every(node => world.getOccluders().includes(node)), "all facade details follow building occlusion");
    }
    const controller = createPlayerOcclusion();
    const building = world.getOccluders().filter(node => node.userData.occlusionGroup === roofs[0].userData.occlusionGroup);
    const wall = building.find(node => node.name.startsWith("original-wall:"));
    const bounds = new THREE.Box3().setFromObject(wall), centre = bounds.getCenter(new THREE.Vector3());
    for (let frame = 0; frame < 12; frame++) controller.update(building,
      new THREE.Vector3(centre.x, centre.y, bounds.max.z + 4), new THREE.Vector3(centre.x, 0, bounds.min.z - 4), .1);
    for (const part of building) for (const material of materials(part)) assert.ok(material.opacity < .1, "shed roofs and trim cannot hide the player behind an opaque detail");
    controller.dispose();
    for (const part of building) for (const material of materials(part)) assert.equal(material.opacity, 1);
    for (const object of MAPS.yard.objs) {
      const group = root.getObjectByName(`map-object:${object.id}`);
      if (object.kind === "bin") {
        const detail = group.getObjectByName("yard-bin-detail");
        assert.ok(detail); assert.ok(meshes(detail).length > 0 && meshes(detail).length <= 3);
      }
      if (object.kind === "sign") {
        const neon = group.getObjectByName("yard-sign-neon");
        assert.ok(neon?.material.emissive.getHex() > 0 && neon.material.emissiveIntensity > 0);
      }
    }
    assert.ok(root.getObjectByName("map-object:house_moss").getObjectByName("yard-door-hardware"));
    assert.equal(world.getPerformanceStats().objects, 71, "36 bounded green-zone tufts and three runoff patches use existing static batches");
    const roofTextureDisposals = watchDisposals(roofs.flatMap(node => [node.material.map, node.material.normalMap, node.material.roughnessMap]));

    const owned = meshes(root).filter(node => node.userData.worldOwned);
    const local = owned.flatMap(materials).filter(material => material.userData.local);
    const geometryDisposals = watchDisposals(owned.map(node => node.geometry));
    const materialDisposals = watchDisposals(local);
    const labelDisposals = watchDisposals(local.filter(material => !material.userData.sharedTexture && material.map?.isCanvasTexture).map(material => material.map));
    const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); root.add(foreign);
    const foreignDisposals = watchDisposals([foreign.geometry, foreign.material, body.geometry, body.material]);
    world.travel("den_moss", 200, 190);
    assert.ok([...geometryDisposals.values()].every(count => count === 1), "yard-owned geometries are released once");
    assert.ok([...materialDisposals.values()].every(count => count === 1), "local fading materials are released once");
    assert.ok([...labelDisposals.values()].every(count => count === 1), "owned sign textures are released once");
    assert.ok([...roofTextureDisposals.values()].every(count => count === 0), "shared PBR roof cache survives district travel");
    assert.ok([...foreignDisposals.values()].every(count => count === 0), "actors and foreign meshes retain resource ownership");
    assert.equal(root.getObjectByName("yard-roof"), undefined);
    assert.equal(root.getObjectByName("yard-shed-detail"), undefined);
    assertOriginalWorld(world, MAPS.den_moss, player, body);
    const interior = root.getObjectByName("moss-interior-detail");
    assert.ok(interior, "Moss's associated interior receives the same district package");
    const interiorMeshes = meshes(interior);
    assert.ok(interiorMeshes.length > 0 && interiorMeshes.length <= 7);
    const northWall = root.getObjectByName("original-wall:0");
    for (const part of interiorMeshes) {
      assert.equal(part.userData.occlusionGroup, northWall.uuid);
      assert.ok(world.getOccluders().includes(part)); assert.equal(part.userData.worldOwned, true);
    }
    const interiorDisposals = watchDisposals(interiorMeshes.map(node => node.geometry));

    world.travel("alley", 384, 80);
    assert.ok([...interiorDisposals.values()].every(count => count === 1));
    assert.equal(root.getObjectByName("moss-interior-detail"), undefined);
    for (const key of ["gold", "inventory", "team", "box", "starterId"]) assert.deepEqual(getSave()[key], snapshot[key], `${key}: district visuals do not alter gameplay content`);
    assert.equal(data.get("420mon_save_v1"), legacy);
    assert.equal(data.get("stable-release-fixture"), "unchanged");
    foreign.geometry.dispose(); foreign.material.dispose(); body.geometry.dispose(); body.material.dispose();
  } finally {
    for (const key of keys) { if (globals[key]) Object.defineProperty(globalThis, key, globals[key]); else delete globalThis[key]; }
  }
});
