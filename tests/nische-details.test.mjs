import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export { createDistrictWorld } from "./src/game/world.ts";
    export { createPlayerOcclusion } from "./src/game/occlusion.ts";
    export { MAPS, NISCHE_PINK } from "./src/game/data/maps.ts";
    export { collidesOnMap } from "./src/game/worldGeometry.ts";
    export { getSave } from "./src/game/save.ts";
    export * as THREE from "three";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { THREE, createDistrictWorld, createPlayerOcclusion, MAPS, NISCHE_PINK, collidesOnMap, getSave } = await import(
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

test("Nischen details preserve narrow source passages, actors, interactions and save/resource ownership", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const legacy = JSON.stringify({ gold: 777, starterId: "mon_budling", inventory: { seed_kush: 7 } });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "nische", x: 920, y: 160, trainerLv: 99,
      starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["nische", "sewer"], quests: { q_v_sewer: "done" }, quest: { q_v_sewer: true } })],
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
    const definition = MAPS.nische, source = JSON.stringify(definition);
    const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); player.add(body);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    const save = structuredClone(getSave()), stored = [...data], position = player.position.clone();
    assert.strictEqual(world.getMapInfo().map, definition);
    const sameRect = (a, b) => ["x", "y", "w", "h"].every(key => a[key] === b[key]);
    const edge = rect => rect.x <= 0 || rect.y <= 0 || rect.x + rect.w >= definition.w || rect.y + rect.h >= definition.h;
    const normalRects = definition.walls.filter(rect => !definition.obstacles.some(obstacle => sameRect(obstacle, rect)));
    const internalRects = normalRects.filter(rect => !edge(rect));
    assert.equal(definition.walls.length, 34);
    assert.equal(normalRects.length, 9); assert.equal(internalRects.length, 4);
    const walls = new Map(normalRects.map(rect => {
      const index = definition.walls.indexOf(rect), wall = root.getObjectByName(`original-wall:${index}`); assert.ok(wall);
      closeTo(size(wall).x, rect.w * .06); closeTo(size(wall).z, rect.h * .06);
      closeTo(size(wall).y, edge(rect) ? (rect.y > definition.h / 2 || rect.x > definition.w / 2 ? .72 : 2.85) : 2.25);
      const expected = world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2);
      closeTo(wall.position.x, expected.x); closeTo(wall.position.z, expected.z);
      return [rect, wall];
    }));
    assert.equal(nodes(root, node => node.name.startsWith("original-wall:")).length, normalRects.length);
    const details = root.children.filter(node => node.name === "nische-wall-detail");
    root.updateMatrixWorld(true);
    for (const rect of normalRects) {
      const matching = details.filter(group => group.userData.sourceRect === rect), wall = walls.get(rect);
      const faces = edge(rect) ? [rect.w < rect.h ? rect.x < definition.w / 2 ? 1 : 3 : rect.y > definition.h / 2 ? 2 : 0] : [0, 1, 2, 3];
      assert.equal(matching.length, faces.reduce((sum, face) => sum + Math.ceil((face % 2 ? rect.h : rect.w) * .06 / 16), 0));
      assert.deepEqual(new Set(matching.map(group => group.userData.face)), new Set(faces));
      const originalBounds = new THREE.Box3().setFromObject(wall);
      for (const group of matching) {
        const parts = meshes(group), bounds = new THREE.Box3().setFromObject(group);
        assert.equal(group.userData.districtDetail, "nische");
        assert.ok(parts.length > 0 && parts.length <= 5);
        assert.ok(parts.every(part => size(part).x <= 16.00001), "wall batches keep short local frustum bounds");
        assert.ok(bounds.min.x >= originalBounds.min.x - .12001 && bounds.max.x <= originalBounds.max.x + .12001);
        assert.ok(bounds.min.z >= originalBounds.min.z - .12001 && bounds.max.z <= originalBounds.max.z + .12001,
          "fittings do not protrude into narrow original passages");
        assert.ok(parts.every(part => part.userData.occlusionGroup === wall.uuid && world.getOccluders().includes(part) && !part.castShadow));
      }
    }
    const caps = meshes(root).filter(node => node.name === "nische-cap");
    const floor = root.getObjectByName("nische-damp-paving"); assert.ok(floor); assert.equal(floor.material.userData.surface, "stone");
    assert.equal(caps.length, normalRects.length);
    assert.deepEqual(new Set(caps.map(cap => cap.material.userData.surface)), new Set(["roof-metal", "roof-felt"]));
    for (const cap of caps) {
      const rect = normalRects.find(rect => walls.get(rect).uuid === cap.userData.occlusionGroup); assert.ok(rect);
      assert.equal(cap.material.userData.surface, !edge(rect) && rect.w === 40 && rect.h === 164 ? "roof-felt" : "roof-metal");
      assert.ok(cap.material.map && cap.material.normalMap && cap.material.roughnessMap); assert.notEqual(cap.material.map, floor.material.map);
      closeTo(size(cap).x, rect.w * .06); closeTo(size(cap).z, rect.h * .06);
    }
    const fences = root.children.filter(group => group.name === "nische-partition-detail");
    assert.equal(fences.length, 25);
    assert.equal(fences.filter(group => group.userData.gate).length, 2);
    for (const rect of definition.obstacles) {
      const matching = fences.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], parts = meshes(group), bounds = new THREE.Box3();
      const gate = rect.x === 1472;
      assert.equal(group.userData.gate, gate);
      assert.ok(parts.length > 0 && parts.length <= (gate ? 3 : 4));
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      for (const part of parts) {
        part.geometry.computeBoundingBox(); bounds.union(part.geometry.boundingBox);
        assert.equal(part.castShadow, false); assert.equal(part.userData.occlusionGroup, group.uuid); assert.ok(world.getOccluders().includes(part));
      }
      assert.ok(bounds.min.x >= -rect.w * .03 - 1e-5 && bounds.max.x <= rect.w * .03 + 1e-5);
      assert.ok(bounds.min.z >= -rect.h * .03 - 1e-5 && bounds.max.z <= rect.h * .03 + 1e-5);
      assert.ok(bounds.min.y >= -1e-5 && bounds.max.y <= 1.60001 && bounds.max.y >= 1.5);
      const span = bounds.getSize(new THREE.Vector3());
      assert.ok((rect.w > rect.h ? span.x : span.z) >= Math.max(rect.w, rect.h) * .06 - .35,
        "side partitions and booth backs follow the original full X/Z extent");
      assert.equal(world.collides(group.position.x, group.position.z), true);
    }
    const rugFloors = meshes(root).filter(part => part.name === "nische-rug-floor");
    const markings = root.children.filter(group => group.name === "nische-floor-detail");
    assert.equal(rugFloors.length, NISCHE_PINK.length); assert.equal(markings.length, NISCHE_PINK.length);
    for (const rect of NISCHE_PINK) {
      const matching = markings.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], parts = meshes(group); assert.ok(parts.length > 0 && parts.length <= 3);
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      assert.ok(definition.zones.some(zone => sameRect(zone, rect)), "original pink encounter areas stay intact");
      const base = rugFloors.find(part => part.userData.sourceRect === rect); assert.ok(base);
      closeTo(size(base).x, rect.w * .06); closeTo(size(base).z, rect.h * .06);
      for (const part of parts) {
        part.geometry.computeBoundingBox(); const bounds = part.geometry.boundingBox;
        assert.ok(bounds.min.x >= -rect.w * .03 - 1e-5 && bounds.max.x <= rect.w * .03 + 1e-5);
        assert.ok(bounds.min.z >= -rect.h * .03 - 1e-5 && bounds.max.z <= rect.h * .03 + 1e-5);
        assert.ok(bounds.min.y >= .044 - 1e-5 && bounds.max.y <= .05001, "floor detail remains flat below the puddles");
        assert.equal(part.castShadow, false); assert.ok(!world.getOccluders().includes(part));
      }
    }
    // Nine booth entrances and the 22-pixel trainer opening retain the full player radius.
    const openings = [[420, 220], [660, 220], [1180, 220], [1420, 220],
      [420, 410], [660, 410], [900, 410], [1180, 410], [1420, 410],
      [1486, 303], [920, 160], [220, 500], [1600, 720]];
    for (const [x, y] of openings) {
      const p = world.toWorld(x, y);
      assert.equal(world.collides(p.x, p.z), false, `source passage at ${x},${y} stays open`);
    }

    const wall = walls.get(internalRects[1]), wallParts = world.getOccluders().filter(part => part.userData.occlusionGroup === wall.uuid);
    const bounds = new THREE.Box3().setFromObject(wall), centre = bounds.getCenter(new THREE.Vector3()), fade = createPlayerOcclusion();
    assert.ok(wallParts.some(part => part.name === "nische-cap") && wallParts.some(part => part.name.startsWith("nische-wall-detail:")));
    for (let frame = 0; frame < 12; frame++) fade.update(wallParts,
      new THREE.Vector3(centre.x, centre.y, bounds.max.z + 4), new THREE.Vector3(centre.x, 0, bounds.min.z - 4), .1);
    for (const part of wallParts) for (const material of materials(part)) assert.ok(material.opacity < .1, "cap, wall and fittings fade together");
    fade.dispose(); for (const part of wallParts) for (const material of materials(part)) assert.equal(material.opacity, 1);

    const objects = definition.objs.filter(obj => obj.kind !== "wild").map(obj => {
      const group = root.getObjectByName(`map-object:${obj.id}`); assert.ok(group); assert.strictEqual(group.userData.object, obj);
      assert.ok(group.position.distanceTo(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2)) < 1e-8); return group;
    });
    const npcs = objects.filter(group => group.userData.object.kind === "npc"), npcChildren = npcs.map(group => [...group.children]);
    const props = objects.filter(group => group.userData.object.kind === "prop"), devices = props.map(group => group.getObjectByName("nische-crate-detail"));
    assert.equal(devices.length, 3);
    for (let i = 0; i < props.length; i++) {
      const detail = devices[i]; assert.ok(detail); assert.strictEqual(detail.userData.sourceObject, props[i].userData.object);
      assert.ok(meshes(detail).length > 0 && meshes(detail).length <= 4);
      assert.ok(meshes(detail).every(part => !part.castShadow && !world.getOccluders().includes(part)));
      assert.ok(props[i].children.some(part => part.isMesh), "original interaction shells remain present");
    }
    const interactions = []; world.setInteractionHandler((object, mapId) => { interactions.push([object, mapId]); return true; });
    // Every existing mattress remains reachable in its open booth, as do both NPCs.
    const mattresses = definition.objs.filter(obj => obj.kind === "mattress"); assert.equal(mattresses.length, 5);
    const actions = [["ni_c3", 908, 725], ["velvet", 212, 199], ["glow", 1486, 303],
      ...mattresses.map(obj => [obj.id, obj.x + obj.w / 2, obj.y + obj.h + 9])];
    for (const [id, x, y] of actions) {
      const obj = definition.objs.find(obj => obj.id === id);
      player.position.copy(world.toWorld(x, y));
      assert.equal(prompt.onclick(), true); assert.deepEqual(interactions.at(-1), [obj, "nische"]);
    }
    player.position.copy(position);
    for (const rect of [...definition.walls, ...definition.objs]) {
      const p = world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2);
      assert.equal(world.collides(p.x, p.z), collidesOnMap(definition, p.x, p.z, .48, save.deadWild, save.starterId));
    }
    world.setPerformanceMode(false); world.setPerformanceMode(true);
    assert.deepEqual(objects.map(group => root.getObjectByName(group.name)), objects);
    assert.deepEqual(npcs.map(group => group.children), npcChildren); assert.deepEqual(player.children, [body]); assert.deepEqual(player.position, position);
    assert.equal(world.getPerformanceStats().objects, 35);
    const lights = nodes(root, node => node.isPointLight); assert.equal(lights.length, 4);
    assert.equal(lights.filter(light => light.name === "flickering-district-lamp").length, 2);
    const signs = nodes(root, node => node.name === "nische-sign-neon"); assert.equal(signs.length, 2);
    assert.ok(signs.every(part => !part.castShadow)); assert.ok(root.getObjectByName("district-wall-art"));
    const street = root.getObjectByName("street-details"); assert.ok(street && street.children.length);
    assert.ok(street.children.every(part => part.isInstancedMesh));
    assert.equal(JSON.stringify(definition), source); assert.deepEqual(getSave(), save); assert.deepEqual([...data], stored);

    const hatch = root.getObjectByName("map-object:nische_gully"), hatchDetail = hatch.getObjectByName("nische-hatch-detail");
    assert.ok(hatchDetail && meshes(hatchDetail).length > 0 && meshes(hatchDetail).length <= 3);
    assert.ok(meshes(hatchDetail).every(part => !part.castShadow));
    const owned = [...details, ...fences, ...markings, ...devices, hatchDetail].flatMap(meshes).concat(caps, signs, rugFloors);
    const geometryDisposals = watch(owned.map(part => part.geometry));
    const materialDisposals = watch(owned.flatMap(materials).filter(material => material.userData.local));
    const textureDisposals = watch(caps.flatMap(part => [part.material.map, part.material.normalMap, part.material.roughnessMap]));
    const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); root.add(foreign);
    const foreignDisposals = watch([foreign.geometry, foreign.material, body.geometry, body.material]);
    player.position.copy(world.toWorld(121, 367));
    assert.equal(prompt.onclick(), true); assert.equal(world.current(), "sewer", "the original hatch still reaches the Kanal");
    for (const counts of [geometryDisposals, materialDisposals]) assert.ok([...counts.values()].every(count => count === 1), "map-owned resources release exactly once");
    for (const counts of [textureDisposals, foreignDisposals]) assert.ok([...counts.values()].every(count => count === 0), "cached textures and foreign meshes retain ownership");
    assert.equal(JSON.stringify(definition), source);
    for (const key of ["gold", "inventory", "team", "box", "starterId"]) assert.deepEqual(getSave()[key], save[key]);
    assert.equal(data.get("420mon_save_v1"), legacy); assert.equal(data.get("stable-release-fixture"), "unchanged");
    foreign.geometry.dispose(); foreign.material.dispose(); body.geometry.dispose(); body.material.dispose();
  } finally {
    for (const key of keys) { if (globals[key]) Object.defineProperty(globalThis, key, globals[key]); else delete globalThis[key]; }
  }
});
