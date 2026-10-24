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

function assertOriginalMap(world, definition, player, body) {
  const root = world.getRoot(), save = structuredClone(getSave()), position = player.position.clone();
  const source = JSON.stringify(definition);
  assert.strictEqual(world.getMapInfo().map, definition);
  const objects = definition.objs.filter(obj => obj.kind !== "wild").map(obj => {
    const group = root.getObjectByName(`map-object:${obj.id}`);
    assert.ok(group, `${definition.id}/${obj.id}: original interaction retained`);
    assert.strictEqual(group.userData.object, obj);
    assert.ok(group.position.distanceTo(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2)) < 1e-8);
    return group;
  });
  const actors = objects.filter(group => ["npc", "shop", "stall"].includes(group.userData.object.kind));
  const children = actors.map(actor => [...actor.children]);
  const points = [...definition.walls, ...definition.objs].map(rect => world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2));
  for (const point of points) assert.equal(world.collides(point.x, point.z),
    collidesOnMap(definition, point.x, point.z, .48, save.deadWild, save.starterId), "decoration does not change original collision");
  world.setPerformanceMode(false); world.setPerformanceMode(true);
  assert.deepEqual(objects.map(group => root.getObjectByName(group.name)), objects);
  actors.forEach((actor, index) => assert.deepEqual(actor.children, children[index], "graphics modes retain the existing NPCs"));
  assert.deepEqual(player.children, [body]); assert.deepEqual(player.position, position);
  assert.equal(JSON.stringify(definition), source); assert.deepEqual(getSave(), save);
}

test("Markt and its back rooms retain routes, traders, occlusion and bounded owned graphics", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const legacy = JSON.stringify({ gold: 777, starterId: "mon_budling", inventory: { seed_kush: 7 } });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "market", x: 48, y: 248,
      starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["market", "den_silk", "den_static", "alley"],
      quests: { q_v_market: "done" }, quest: { q_v_market: true } })],
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
    const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); player.add(body);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    const save = structuredClone(getSave()), stored = [...data];
    assertOriginalMap(world, MAPS.market, player, body);
    assert.deepEqual([...data], stored, "graphics modes do not rewrite saves");

    const roofs = meshes(root).filter(node => node.name === "market-roof");
    assert.equal(roofs.length, 4, "all four original northern masses get their own roof");
    assert.deepEqual([...new Set(roofs.map(node => node.userData.roofKind))].sort(), ["roof-felt", "roof-metal", "roof-tile"]);
    const floor = root.getObjectByName("market-rain-paving"); assert.ok(floor);
    for (const roof of roofs) {
      assert.equal(roof.material.userData.surface, roof.userData.roofKind);
      assert.ok(roof.material.map && roof.material.normalMap && roof.material.roughnessMap);
      assert.notEqual(roof.material.map, floor.material.map, "roofs do not use paving textures");
      assert.ok(world.getOccluders().some(node => node.uuid === roof.userData.occlusionGroup && node.name.startsWith("original-wall:")));
    }
    const facades = root.children.filter(node => node.name === "market-facade-detail");
    const boundaries = root.children.filter(node => node.name === "market-boundary-detail");
    assert.equal(facades.length, 4); assert.equal(boundaries.length, 6);
    for (const group of [...facades, ...boundaries]) {
      const rect = group.userData.sourceRect, parts = meshes(group);
      assert.ok(MAPS.market.walls.includes(rect));
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      assert.ok(group.userData.marketFeatures.length > 0);
      assert.ok(parts.length > 0 && parts.length <= 8, "wall details are merged within a small material budget");
      const wall = root.getObjectByName(`original-wall:${MAPS.market.walls.indexOf(rect)}`);
      wall.geometry.computeBoundingBox();
      const dimensions = wall.geometry.boundingBox.getSize(new THREE.Vector3());
      assert.ok(Math.abs(dimensions.x - rect.w * .06) < 1e-5 && Math.abs(dimensions.z - rect.h * .06) < 1e-5);
      for (const part of parts) {
        assert.equal(part.userData.occlusionGroup, wall.uuid); assert.ok(world.getOccluders().includes(part));
        assert.equal(part.castShadow, false, "small facade details do not expand the shadow budget");
      }
    }
    const stalls = root.children.filter(node => node.name === "market-stall-detail");
    const traders = MAPS.market.objs.filter(obj => obj.kind === "shop" || obj.kind === "stall");
    assert.equal(stalls.length, traders.length);
    for (const obj of traders) {
      const detail = stalls.find(node => node.userData.sourceObject === obj); assert.ok(detail);
      assert.ok(detail.position.distanceTo(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2)) < 1e-8);
      assert.strictEqual(detail.parent, root, "stand decoration stays separate from NPC model hierarchy");
      const parts = meshes(detail), groups = new Set(parts.map(node => node.userData.occlusionGroup));
      assert.ok(parts.length > 0 && parts.length <= 8); assert.equal(groups.size, 1); assert.ok(!groups.has(undefined));
      assert.ok(parts.every(part => world.getOccluders().includes(part) && !part.castShadow));
    }
    for (const obj of MAPS.market.objs.filter(obj => obj.kind === "sign"))
      assert.ok(root.getObjectByName(`map-object:${obj.id}`).getObjectByName("market-sign-neon"));
    for (const id of ["house_silk", "house_static"])
      assert.ok(root.getObjectByName(`map-object:${id}`).getObjectByName("market-door-hardware"));
    assert.equal(world.getPerformanceStats().objects, 41, "nine runoff patches use the existing puddle instance renderer");
    assert.ok(root.getObjectByName("street-details")?.children.length > 0);
    assert.ok(root.getObjectByName("district-wall-art"));
    const lights = nodes(root, node => node.isPointLight);
    assert.equal(lights.length, MAPS.market.objs.filter(obj => obj.kind === "lamp" || obj.kind === "door").length, "only the four lamps and four existing doorway lights remain");
    assert.equal(lights.filter(light => light.name === "flickering-district-lamp").length, 2);

    root.updateMatrixWorld(true);
    const wallId = roofs[0].userData.occlusionGroup;
    const building = world.getOccluders().filter(node => node.userData.occlusionGroup === wallId);
    const wall = building.find(node => node.uuid === wallId), bounds = new THREE.Box3().setFromObject(wall), centre = bounds.getCenter(new THREE.Vector3());
    const fade = createPlayerOcclusion();
    for (let frame = 0; frame < 12; frame++) fade.update(building, new THREE.Vector3(centre.x, centre.y, bounds.max.z + 4), new THREE.Vector3(centre.x, 0, bounds.min.z - 4), .1);
    for (const part of building) for (const material of materials(part)) assert.ok(material.opacity < .1, "roofs, walls and details fade together");
    fade.dispose(); for (const part of building) for (const material of materials(part)) assert.equal(material.opacity, 1);

    const owned = [...facades, ...boundaries, ...stalls].flatMap(meshes).concat(roofs);
    const geometryDisposals = watch(owned.map(node => node.geometry));
    const materialDisposals = watch(owned.flatMap(materials).filter(material => material.userData.local));
    const textureDisposals = watch(roofs.flatMap(node => [node.material.map, node.material.normalMap, node.material.roughnessMap]));
    const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); root.add(foreign);
    const foreignDisposals = watch([foreign.geometry, foreign.material, body.geometry, body.material]);
    let interiorDisposals;
    for (const id of ["den_silk", "den_static"]) {
      world.travel(id, 200, 190);
      if (interiorDisposals) assert.ok([...interiorDisposals.values()].every(count => count === 1));
      assertOriginalMap(world, MAPS[id], player, body);
      const detail = root.getObjectByName("market-interior-detail"); assert.ok(detail);
      const parts = meshes(detail), north = root.getObjectByName("original-wall:0");
      assert.ok(parts.length > 0 && parts.length <= 8);
      assert.ok(parts.every(part => part.userData.occlusionGroup === north.uuid && world.getOccluders().includes(part) && !part.castShadow));
      assert.equal(nodes(root, node => node.isPointLight).length, 2, "back-room details reuse the existing doorway and room lights");
      interiorDisposals = watch([...parts.map(part => part.geometry), ...parts.flatMap(materials).filter(material => material.userData.local)]);
    }
    world.travel("alley", 384, 80);
    for (const counts of [geometryDisposals, materialDisposals, interiorDisposals])
      assert.ok([...counts.values()].every(count => count === 1), "map-owned resources dispose once on travel");
    assert.ok([...textureDisposals.values()].every(count => count === 0), "cached PBR textures survive travel");
    assert.ok([...foreignDisposals.values()].every(count => count === 0), "foreign/player resources retain their owners");
    assert.equal(root.getObjectByName("market-interior-detail"), undefined);
    for (const key of ["gold", "inventory", "team", "box", "starterId"]) assert.deepEqual(getSave()[key], save[key]);
    assert.equal(data.get("420mon_save_v1"), legacy); assert.equal(data.get("stable-release-fixture"), "unchanged");
    foreign.geometry.dispose(); foreign.material.dispose(); body.geometry.dispose(); body.material.dispose();
  } finally {
    for (const key of keys) { if (globals[key]) Object.defineProperty(globalThis, key, globals[key]); else delete globalThis[key]; }
  }
});
