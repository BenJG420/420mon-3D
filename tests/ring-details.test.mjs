import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export { createDistrictWorld } from "./src/game/world.ts";
    export { createPlayerOcclusion } from "./src/game/occlusion.ts";
    export { MAPS, RING_CHALK } from "./src/game/data/maps.ts";
    export { collidesOnMap } from "./src/game/worldGeometry.ts";
    export { getSave } from "./src/game/save.ts";
    export * as THREE from "three";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { THREE, createDistrictWorld, createPlayerOcclusion, MAPS, RING_CHALK, collidesOnMap, getSave } = await import(
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

test("Ring preserves original cage openings, actors and saves with bounded arena details", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const legacy = JSON.stringify({ gold: 777, starterId: "mon_budling", inventory: { seed_kush: 7 } });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "ring", x: 140, y: 380, trainerLv: 99,
      starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["ring", "sewer"], quests: { q_v_sewer: "done" }, quest: { q_v_sewer: true } })],
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
    const definition = MAPS.ring, source = JSON.stringify(definition);
    const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); player.add(body);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    const save = structuredClone(getSave()), stored = [...data], position = player.position.clone();
    assert.strictEqual(world.getMapInfo().map, definition);
    const sameRect = (a, b) => ["x", "y", "w", "h"].every(key => a[key] === b[key]);
    const edge = rect => rect.x <= 0 || rect.y <= 0 || rect.x + rect.w >= definition.w || rect.y + rect.h >= definition.h;
    const isFacade = rect => !edge(rect) && rect.w >= 56 && rect.h >= 56;
    const normalRects = definition.walls.filter(rect => !definition.obstacles.some(obstacle => sameRect(obstacle, rect)));
    const facadeRects = normalRects.filter(isFacade), boundaryRects = normalRects.filter(rect => !isFacade(rect));
    assert.equal(normalRects.length, 9); assert.equal(facadeRects.length, 4); assert.equal(boundaryRects.length, 5);
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
    const details = root.children.filter(node => ["ring-facade-detail", "ring-boundary-detail"].includes(node.name));
    const expectedDetailCount = facadeRects.length + boundaryRects.reduce((sum, rect) => sum + Math.ceil(Math.max(rect.w, rect.h) * .06 / 24), 0);
    assert.equal(details.length, expectedDetailCount);
    for (const rect of normalRects) {
      const matching = details.filter(group => group.userData.sourceRect === rect);
      assert.equal(matching.length, isFacade(rect) ? 1 : Math.ceil(Math.max(rect.w, rect.h) * .06 / 24));
      for (const group of matching) {
        const parts = meshes(group), wall = walls.get(rect);
        assert.equal(group.name, isFacade(rect) ? "ring-facade-detail" : "ring-boundary-detail");
        assert.equal(group.userData.districtDetail, "ring");
        assert.ok(parts.length > 0 && parts.length <= 7);
        if (isFacade(rect)) assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
        else assert.ok(parts.every(part => size(part).x <= 24.6), "long boundary details retain local frustum bounds");
        assert.ok(parts.every(part => part.userData.occlusionGroup === wall.uuid && world.getOccluders().includes(part) && !part.castShadow));
      }
    }
    const roofs = meshes(root).filter(node => node.name === "ring-roof"), caps = meshes(root).filter(node => node.name === "ring-cap");
    const floor = root.getObjectByName("ring-rain-paving"); assert.ok(floor); assert.equal(floor.material.userData.surface, "stone");
    assert.equal(roofs.length, facadeRects.length); assert.equal(caps.length, boundaryRects.length);
    assert.deepEqual(new Set(roofs.map(roof => roof.material.userData.surface)), new Set(["roof-tile", "roof-metal", "roof-felt"]));
    for (const roof of [...roofs, ...caps]) {
      const rect = normalRects.find(rect => walls.get(rect).uuid === roof.userData.occlusionGroup); assert.ok(rect);
      assert.equal(roof.name, isFacade(rect) ? "ring-roof" : "ring-cap");
      if (!isFacade(rect)) assert.equal(roof.material.userData.surface, "roof-metal");
      assert.ok(roof.material.map && roof.material.normalMap && roof.material.roughnessMap);
      assert.notEqual(roof.material.map, floor.material.map);
      closeTo(size(roof).x, rect.w * .06); closeTo(size(roof).z, rect.h * .06);
    }
    const fenceRects = definition.obstacles.filter(rect => rect.kind === "fence");
    const fences = root.children.filter(group => group.name === "ring-fence-detail");
    assert.equal(fences.length, fenceRects.length); assert.equal(fences.length, 9);
    for (const rect of fenceRects) {
      const matching = fences.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], parts = meshes(group), localBounds = new THREE.Box3();
      assert.ok(parts.length > 0 && parts.length <= 4);
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      let triangles = 0;
      for (const part of parts) {
        part.geometry.computeBoundingBox(); localBounds.union(part.geometry.boundingBox);
        triangles += (part.geometry.index?.count ?? part.geometry.getAttribute("position").count) / 3;
        assert.equal(part.castShadow, false);
        assert.equal(part.userData.occlusionGroup, group.uuid); assert.ok(world.getOccluders().includes(part));
      }
      assert.ok(triangles <= 12000, "a whole fence panel has a bounded wire-mesh budget");
      assert.ok(localBounds.min.x >= -rect.w * .03 - 1e-5 && localBounds.max.x <= rect.w * .03 + 1e-5);
      assert.ok(localBounds.min.z >= -rect.h * .03 - 1e-5 && localBounds.max.z <= rect.h * .03 + 1e-5);
      assert.ok(localBounds.min.y >= -1e-5 && localBounds.max.y <= 1.60001 && localBounds.max.y >= 1.5);
      const span = localBounds.getSize(new THREE.Vector3());
      assert.ok((rect.w >= rect.h ? span.x : span.z) >= Math.max(rect.w, rect.h) * .06 - .35,
        "long side fences span the source Z rectangle rather than a short transverse strip");
      assert.equal(world.collides(group.position.x, group.position.z), true, "the original cage remains blocked along its fences");
    }
    const blockRects = definition.obstacles.filter(rect => rect.kind === "block");
    const blocks = root.children.filter(group => group.name === "ring-block-detail");
    assert.equal(blocks.length, blockRects.length); assert.equal(blocks.length, 4);
    for (const rect of blockRects) {
      const matching = blocks.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], parts = meshes(group), original = group.getObjectByName("ring-block-body"), cap = group.getObjectByName("ring-block-cap");
      assert.ok(original && cap);
      closeTo(size(original).x, rect.w * .06); closeTo(size(original).z, rect.h * .06); closeTo(size(original).y, .75);
      assert.equal(original.castShadow, true);
      closeTo(size(cap).x, rect.w * .06); closeTo(size(cap).z, rect.h * .06); closeTo(size(cap).y, .06); closeTo(cap.position.y, .77);
      assert.equal(cap.material.userData.surface, "roof-metal");
      assert.ok(cap.material.map && cap.material.normalMap && cap.material.roughnessMap);
      const fittings = group.getObjectByName("ring-block-fittings"); assert.ok(fittings);
      assert.ok(meshes(fittings).length > 0 && meshes(fittings).length <= 4 && parts.length <= 6);
      assert.ok(parts.every(part => part.userData.occlusionGroup === original.uuid && world.getOccluders().includes(part)));
      assert.ok(parts.filter(part => part !== original).every(part => !part.castShadow));
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      for (const part of meshes(fittings)) {
        part.geometry.computeBoundingBox(); const bounds = part.geometry.boundingBox;
        assert.ok(bounds.min.x >= -rect.w * .03 - 1e-5 && bounds.max.x <= rect.w * .03 + 1e-5);
        assert.ok(bounds.min.z >= -rect.h * .03 - 1e-5 && bounds.max.z <= rect.h * .03 + 1e-5);
        assert.ok(bounds.min.y >= -1e-5 && bounds.max.y <= 1.30001);
      }
    }
    const arena = root.getObjectByName("ring-arena-floor"), arenaRect = definition.deco[0]; assert.ok(arena);
    assert.strictEqual(arena.userData.sourceRect, arenaRect);
    closeTo(size(arena).x, arenaRect.w * .06); closeTo(size(arena).z, arenaRect.h * .06);
    closeTo(size(arena).y, .006); closeTo(arena.position.y, .038); assert.equal(arena.castShadow, false);
    const arenaPosition = world.toWorld(arenaRect.x + arenaRect.w / 2, arenaRect.y + arenaRect.h / 2);
    closeTo(arena.position.x, arenaPosition.x); closeTo(arena.position.z, arenaPosition.z);
    const markings = root.children.filter(group => group.name === "ring-floor-markings");
    assert.equal(markings.length, RING_CHALK.length); assert.equal(markings.length, 2);
    for (const rect of RING_CHALK) {
      const matching = markings.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], parts = meshes(group); assert.ok(parts.length > 0 && parts.length <= 3);
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      assert.ok(definition.zones.some(zone => sameRect(zone, rect)), "original chalk encounter zones remain present");
      for (const part of parts) {
        part.geometry.computeBoundingBox(); const bounds = part.geometry.boundingBox;
        assert.ok(bounds.min.x >= -rect.w * .03 - 1e-5 && bounds.max.x <= rect.w * .03 + 1e-5);
        assert.ok(bounds.min.z >= -rect.h * .03 - 1e-5 && bounds.max.z <= rect.h * .03 + 1e-5);
        assert.ok(bounds.min.y >= .044 - 1e-5 && bounds.max.y <= .05201, "chalk/paint stays flush on the original arena and training strip");
        assert.equal(part.castShadow, false); assert.ok(!world.getOccluders().includes(part));
      }
    }
    for (const [x, y] of [[560, 280], [540, 634], [754, 460], [300, 420], [560, 800], [560, 460]]) {
      const p = world.toWorld(x, y);
      assert.equal(world.collides(p.x, p.z), false, "source cage entrances, arena and outer passages remain open");
    }

    root.updateMatrixWorld(true);
    const wall = walls.get(facadeRects[0]), wallParts = world.getOccluders().filter(part => part.userData.occlusionGroup === wall.uuid);
    const bounds = new THREE.Box3().setFromObject(wall), centre = bounds.getCenter(new THREE.Vector3()), fade = createPlayerOcclusion();
    assert.ok(wallParts.some(part => part.name === "ring-roof") && wallParts.some(part => part.name.startsWith("ring-facade-detail:")));
    for (let frame = 0; frame < 12; frame++) fade.update(wallParts,
      new THREE.Vector3(centre.x, centre.y, bounds.max.z + 4), new THREE.Vector3(centre.x, 0, bounds.min.z - 4), .1);
    for (const part of wallParts) for (const material of materials(part)) assert.ok(material.opacity < .1, "roof, wall and facade fade together");
    fade.dispose(); for (const part of wallParts) for (const material of materials(part)) assert.equal(material.opacity, 1);

    const objects = definition.objs.filter(obj => obj.kind !== "wild").map(obj => {
      const group = root.getObjectByName(`map-object:${obj.id}`); assert.ok(group); assert.strictEqual(group.userData.object, obj);
      assert.ok(group.position.distanceTo(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2)) < 1e-8); return group;
    });
    const npcs = objects.filter(group => group.userData.object.kind === "npc"), npcChildren = npcs.map(group => [...group.children]);
    const props = objects.filter(group => group.userData.object.kind === "prop");
    const devices = props.map(group => group.getObjectByName("ring-crate-detail"));
    assert.equal(devices.length, 3);
    for (let i = 0; i < props.length; i++) {
      const detail = devices[i]; assert.ok(detail); assert.strictEqual(detail.userData.sourceObject, props[i].userData.object);
      assert.ok(meshes(detail).length > 0 && meshes(detail).length <= 4);
      assert.ok(meshes(detail).every(part => !part.castShadow && !world.getOccluders().includes(part)));
      assert.ok(props[i].children.some(part => part.isMesh), "the original interaction shell remains beside the detail group");
    }
    const interactions = []; world.setInteractionHandler((object, mapId) => { interactions.push([object, mapId]); return true; });
    for (const id of ["rg_c1", "ringm0", "cage", "knuckle"]) {
      const obj = definition.objs.find(obj => obj.id === id);
      // Approach the crate above the nearby mattress so the physical prompt selects the crate.
      const y = id === "rg_c1" ? obj.y - 9 : obj.y + obj.h + 9;
      player.position.copy(world.toWorld(obj.x + obj.w / 2, y));
      assert.equal(prompt.onclick(), true); assert.deepEqual(interactions.at(-1), [obj, "ring"]);
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
    assert.equal(world.getPerformanceStats().objects, 32 + definition.objs.filter(obj => obj.kind === "bin").length);
    const lights = nodes(root, node => node.isPointLight);
    assert.equal(lights.length, definition.objs.filter(obj => obj.kind === "lamp").length + 1);
    assert.equal(lights.filter(light => light.name === "flickering-district-lamp").length, 2);
    const signs = nodes(root, node => node.name === "ring-sign-neon");
    assert.equal(signs.length, definition.objs.filter(obj => obj.kind === "sign").length);
    assert.ok(signs.every(part => !part.castShadow)); assert.ok(root.getObjectByName("district-wall-art"));
    const street = root.getObjectByName("street-details"); assert.ok(street && street.children.length);
    assert.ok(street.children.every(part => part.isInstancedMesh));
    assert.equal(JSON.stringify(definition), source); assert.deepEqual(getSave(), save); assert.deepEqual([...data], stored);

    const hatch = root.getObjectByName("map-object:ring_gully"), hatchDetail = hatch.getObjectByName("ring-hatch-detail");
    assert.ok(hatchDetail && meshes(hatchDetail).length > 0 && meshes(hatchDetail).length <= 3);
    assert.ok(meshes(hatchDetail).every(part => !part.castShadow));
    const owned = [...details, ...fences, ...blocks, ...markings, ...devices, hatchDetail].flatMap(meshes).concat(roofs, caps, signs, arena);
    const geometryDisposals = watch(owned.map(part => part.geometry));
    const materialDisposals = watch(owned.flatMap(materials).filter(material => material.userData.local));
    const textureDisposals = watch([...roofs, ...caps].flatMap(part => [part.material.map, part.material.normalMap, part.material.roughnessMap]));
    const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); root.add(foreign);
    const foreignDisposals = watch([foreign.geometry, foreign.material, body.geometry, body.material]);
    const exit = definition.objs.find(obj => obj.id === "ring_gully");
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
