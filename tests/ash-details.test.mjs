import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export { createDistrictWorld } from "./src/game/world.ts";
    export { createPlayerOcclusion } from "./src/game/occlusion.ts";
    export { MAPS, ASH_HOT } from "./src/game/data/maps.ts";
    export { collidesOnMap } from "./src/game/worldGeometry.ts";
    export { getSave } from "./src/game/save.ts";
    export * as THREE from "three";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { THREE, createDistrictWorld, createPlayerOcclusion, MAPS, ASH_HOT, collidesOnMap, getSave } = await import(
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

test("Aschegang preserves source heat areas, actors, routes and saves with bounded industrial details", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const legacy = JSON.stringify({ gold: 777, starterId: "mon_budling", inventory: { seed_kush: 7 } });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "ash", x: 110, y: 350, trainerLv: 99,
      starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["ash", "sewer"] })],
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
    const definition = MAPS.ash, source = JSON.stringify(definition);
    const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); player.add(body);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    const save = structuredClone(getSave()), stored = [...data], position = player.position.clone();
    assert.strictEqual(world.getMapInfo().map, definition);
    const sameRect = (a, b) => ["x", "y", "w", "h"].every(key => a[key] === b[key]);
    const edge = rect => rect.x <= 0 || rect.y <= 0 || rect.x + rect.w >= definition.w || rect.y + rect.h >= definition.h;
    const isFacade = rect => !edge(rect) && rect.w >= 56 && rect.h >= 56;
    const normalRects = definition.walls.filter(rect => !ASH_HOT.includes(rect) && !definition.obstacles.some(obstacle => sameRect(obstacle, rect)));
    const facadeRects = normalRects.filter(isFacade), boundaryRects = normalRects.filter(rect => !isFacade(rect));
    assert.equal(ASH_HOT.length, 8); assert.equal(facadeRects.length, 6); assert.equal(boundaryRects.length, 9);
    const walls = new Map(normalRects.map(rect => {
      const index = definition.walls.indexOf(rect), wall = root.getObjectByName(`original-wall:${index}`); assert.ok(wall);
      closeTo(size(wall).x, rect.w * .06); closeTo(size(wall).z, rect.h * .06);
      const seeded = Math.sin((index + 17) * 127.1 + 311.7) * 43758.5453;
      const oldHeight = isFacade(rect) ? 3.7 + (seeded - Math.floor(seeded)) * 4.8
        : edge(rect) ? (rect.y > definition.h / 2 || rect.x > definition.w / 2 ? .72 : 2.85) : 2.25;
      closeTo(size(wall).y, oldHeight);
      const expected = world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2);
      closeTo(wall.position.x, expected.x); closeTo(wall.position.z, expected.z);
      return [rect, wall];
    }));
    assert.equal(nodes(root, node => node.name.startsWith("original-wall:")).length, normalRects.length);
    const details = root.children.filter(node => ["ash-facade-detail", "ash-boundary-detail"].includes(node.name));
    assert.equal(details.length, normalRects.length);
    for (const rect of normalRects) {
      const matching = details.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], parts = meshes(group), wall = walls.get(rect);
      assert.equal(group.name, isFacade(rect) ? "ash-facade-detail" : "ash-boundary-detail");
      assert.equal(group.userData.districtDetail, "ash"); assert.ok(group.userData.ashFeatures.length);
      assert.ok(parts.length > 0 && parts.length <= 7);
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      assert.ok(parts.every(part => part.userData.occlusionGroup === wall.uuid && world.getOccluders().includes(part) && !part.castShadow));
    }
    const roofs = meshes(root).filter(node => node.name === "ash-roof"), caps = meshes(root).filter(node => node.name === "ash-cap");
    const floor = root.getObjectByName("ash-rain-paving"); assert.ok(floor); assert.equal(floor.material.userData.surface, "stone");
    assert.equal(roofs.length, facadeRects.length); assert.equal(caps.length, boundaryRects.length);
    assert.deepEqual(new Set(roofs.map(roof => roof.material.userData.surface)), new Set(["roof-tile", "roof-metal", "roof-felt"]));
    for (const roof of [...roofs, ...caps]) {
      const rect = normalRects.find(rect => walls.get(rect).uuid === roof.userData.occlusionGroup); assert.ok(rect);
      assert.equal(roof.name, isFacade(rect) ? "ash-roof" : "ash-cap");
      if (!isFacade(rect)) assert.equal(roof.material.userData.surface, "roof-metal");
      assert.ok(roof.material.map && roof.material.normalMap && roof.material.roughnessMap);
      assert.notEqual(roof.material.map, floor.material.map);
      closeTo(size(roof).x, rect.w * .06); closeTo(size(roof).z, rect.h * .06);
    }
    const embers = root.children.filter(group => group.name === "ash-ember-detail");
    assert.equal(embers.length, ASH_HOT.length);
    for (const rect of ASH_HOT) {
      assert.ok(definition.walls.includes(rect));
      const matching = embers.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], parts = meshes(group); assert.ok(parts.length > 0 && parts.length <= 4);
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      assert.ok(group.userData.ashFeatures.includes("ember-bed"));
      const bed = parts.find(part => part.name === "ash-ember-detail:soot"); assert.ok(bed);
      closeTo(size(bed).x, rect.w * .06); closeTo(size(bed).z, rect.h * .06);
      closeTo(bed.geometry.boundingBox.min.y, 0);
      for (const part of parts) {
        part.geometry.computeBoundingBox(); const bounds = part.geometry.boundingBox;
        assert.ok(bounds.min.y >= -1e-5 && bounds.max.y <= .32, "all eight blocked heat areas remain low ember beds");
        assert.ok(bounds.min.x >= -rect.w * .03 - 1e-5 && bounds.max.x <= rect.w * .03 + 1e-5);
        assert.ok(bounds.min.z >= -rect.h * .03 - 1e-5 && bounds.max.z <= rect.h * .03 + 1e-5);
        assert.equal(part.castShadow, false); assert.ok(!world.getOccluders().includes(part));
        assert.ok(!part.material.userData.surface?.startsWith("roof-"));
      }
      assert.equal(root.getObjectByName(`original-wall:${definition.walls.indexOf(rect)}`), undefined);
      assert.equal(world.collides(group.position.x, group.position.z), true, "the original hot-area collisions stay blocked");
    }
    const blockRects = definition.obstacles.filter(rect => rect.kind === "block");
    const blocks = root.children.filter(group => group.name === "ash-block-detail"); assert.equal(blocks.length, blockRects.length);
    for (const rect of blockRects) {
      const matching = blocks.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], parts = meshes(group), cap = group.getObjectByName("ash-block-cap");
      const original = group.children.find(part => part.isMesh && part !== cap); assert.ok(original && cap);
      assert.ok(parts.length <= 9); closeTo(size(original).x, rect.w * .06); closeTo(size(original).z, rect.h * .06); closeTo(size(original).y, .75);
      closeTo(size(cap).x, rect.w * .06); closeTo(size(cap).z, rect.h * .06); closeTo(size(cap).y, .06); closeTo(cap.position.y, .77);
      assert.equal(cap.material.userData.surface, "roof-metal");
      assert.ok(cap.material.map && cap.material.normalMap && cap.material.roughnessMap);
      const fittings = group.getObjectByName("ash-block-fittings"); assert.ok(fittings && meshes(fittings).length <= 7);
      assert.ok(parts.every(part => part.userData.occlusionGroup === original.uuid && world.getOccluders().includes(part)));
      assert.ok(parts.filter(part => part !== original).every(part => !part.castShadow));
      assert.equal(original.castShadow, true);
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
    }
    for (const rect of definition.obstacles.filter(rect => rect.kind === "fence")) {
      const position = world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2);
      const fence = root.children.find(group => group.isGroup && !group.name && group.position.distanceTo(position) < 1e-8); assert.ok(fence);
      assert.equal(fence.children.length, Math.floor((rect.w * .06 + .02) / Math.max(.45, rect.w * .06 / 24)) + 3);
      assert.ok(meshes(fence).every(part => part.material.userData.surface === "metal"));
      const bounds = new THREE.Box3().setFromObject(fence); closeTo(bounds.max.y, 1.6);
    }

    root.updateMatrixWorld(true);
    const wall = walls.get(facadeRects[0]), wallParts = world.getOccluders().filter(part => part.userData.occlusionGroup === wall.uuid);
    const bounds = new THREE.Box3().setFromObject(wall), centre = bounds.getCenter(new THREE.Vector3()), fade = createPlayerOcclusion();
    assert.ok(wallParts.some(part => part.name === "ash-roof") && wallParts.some(part => part.name.startsWith("ash-facade-detail:")));
    for (let frame = 0; frame < 12; frame++) fade.update(wallParts,
      new THREE.Vector3(centre.x, centre.y, bounds.max.z + 4), new THREE.Vector3(centre.x, 0, bounds.min.z - 4), .1);
    for (const part of wallParts) for (const material of materials(part)) assert.ok(material.opacity < .1, "roof, wall and facade fade together");
    fade.dispose(); for (const part of wallParts) for (const material of materials(part)) assert.equal(material.opacity, 1);

    const objects = definition.objs.filter(obj => obj.kind !== "wild").map(obj => {
      const group = root.getObjectByName(`map-object:${obj.id}`); assert.ok(group); assert.strictEqual(group.userData.object, obj);
      assert.ok(group.position.distanceTo(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2)) < 1e-8); return group;
    });
    const npcs = objects.filter(group => group.userData.object.kind === "npc"), npcChildren = npcs.map(group => [...group.children]);
    const soot = definition.objs.find(obj => obj.id === "gate_soot"); assert.equal(soot.w, 480); assert.equal(soot.block, true);
    assert.ok(root.getObjectByName("map-object:gate_soot"), "the original wide Soot gate is retained");
    const props = objects.filter(group => group.userData.object.kind === "prop");
    const devices = props.map(group => group.getObjectByName("ash-prop-detail"));
    assert.equal(devices.length, 8);
    for (let i = 0; i < props.length; i++) {
      const detail = devices[i]; assert.ok(detail); assert.strictEqual(detail.userData.sourceObject, props[i].userData.object);
      assert.ok(meshes(detail).length > 0 && meshes(detail).length <= 4);
      assert.ok(meshes(detail).every(part => !part.castShadow && !world.getOccluders().includes(part)));
      assert.ok(props[i].children.some(part => part.isMesh), "the original interaction shell remains beside the detail group");
    }
    const interactions = []; world.setInteractionHandler((object, mapId) => { interactions.push([object, mapId]); return true; });
    for (const id of ["ash_t1", "ashm0", "ember", "cinder", "gate_soot"]) {
      const obj = definition.objs.find(obj => obj.id === id);
      player.position.copy(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h + 9));
      assert.equal(prompt.onclick(), true); assert.deepEqual(interactions.at(-1), [obj, "ash"]);
    }
    player.position.copy(position);
    for (const rect of [...definition.walls, ...definition.objs]) {
      const p = world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2);
      assert.equal(world.collides(p.x, p.z), collidesOnMap(definition, p.x, p.z, .48, save.deadWild, save.starterId));
    }
    world.setPerformanceMode(false); world.setPerformanceMode(true);
    assert.deepEqual(objects.map(group => root.getObjectByName(group.name)), objects);
    assert.deepEqual(npcs.map(group => group.children), npcChildren);
    assert.deepEqual(player.children, [body]); assert.deepEqual(player.position, position);
    assert.equal(world.getPerformanceStats().objects, 32 + facadeRects.length);
    const lights = nodes(root, node => node.isPointLight);
    assert.equal(lights.length, definition.objs.filter(obj => obj.kind === "lamp").length + 1);
    assert.equal(lights.filter(light => light.name === "flickering-district-lamp").length, 2);
    const signs = nodes(root, node => node.name === "ash-sign-neon");
    assert.equal(signs.length, definition.objs.filter(obj => obj.kind === "sign").length);
    assert.ok(signs.every(part => !part.castShadow)); assert.ok(root.getObjectByName("district-wall-art"));
    const street = root.getObjectByName("street-details"); assert.ok(street && street.children.length);
    assert.ok(street.children.every(part => part.isInstancedMesh));
    assert.equal(JSON.stringify(definition), source); assert.deepEqual(getSave(), save); assert.deepEqual([...data], stored);

    const owned = [...details, ...embers, ...blocks, ...devices].flatMap(meshes).concat(roofs, caps, signs);
    const geometryDisposals = watch(owned.map(part => part.geometry));
    const materialDisposals = watch(owned.flatMap(materials).filter(material => material.userData.local));
    const textureDisposals = watch([...roofs, ...caps].flatMap(part => [part.material.map, part.material.normalMap, part.material.roughnessMap]));
    const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); root.add(foreign);
    const foreignDisposals = watch([foreign.geometry, foreign.material, body.geometry, body.material]);
    const exit = definition.objs.find(obj => obj.id === "ash_gully");
    player.position.copy(world.toWorld(exit.x + exit.w / 2, exit.y + exit.h + 9));
    assert.equal(prompt.onclick(), true); assert.equal(world.current(), "sewer", "the original hatch still leads to the Kanal");
    for (const counts of [geometryDisposals, materialDisposals]) assert.ok([...counts.values()].every(count => count === 1), "map-owned resources release exactly once");
    for (const counts of [textureDisposals, foreignDisposals]) assert.ok([...counts.values()].every(count => count === 0), "cached textures and foreign meshes remain owned by their callers");
    assert.equal(JSON.stringify(definition), source);
    for (const key of ["gold", "inventory", "team", "box", "starterId"]) assert.deepEqual(getSave()[key], save[key]);
    assert.equal(data.get("420mon_save_v1"), legacy); assert.equal(data.get("stable-release-fixture"), "unchanged");
    foreign.geometry.dispose(); foreign.material.dispose(); body.geometry.dispose(); body.material.dispose();
  } finally {
    for (const key of keys) { if (globals[key]) Object.defineProperty(globalThis, key, globals[key]); else delete globalThis[key]; }
  }
});
