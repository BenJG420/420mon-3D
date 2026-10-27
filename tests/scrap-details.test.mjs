import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export { createDistrictWorld } from "./src/game/world.ts";
    export { createPlayerOcclusion } from "./src/game/occlusion.ts";
    export { MAPS, SCRAP_RUST, SCRAP_BELT, SCRAP_PILES } from "./src/game/data/maps.ts";
    export { collidesOnMap } from "./src/game/worldGeometry.ts";
    export { getSave } from "./src/game/save.ts";
    export * as THREE from "three";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { THREE, createDistrictWorld, createPlayerOcclusion, MAPS, SCRAP_RUST, SCRAP_BELT, SCRAP_PILES, collidesOnMap, getSave } = await import(
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

test("Schrotttor details preserve narrow source passages, actors, interactions and save/resource ownership", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const legacy = JSON.stringify({ gold: 777, starterId: "mon_budling", inventory: { seed_kush: 7 } });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "scrap", x: 880, y: 800, trainerLv: 99,
      starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["scrap", "sewer"], quests: { q_v_sewer: "done" }, quest: { q_v_sewer: true } })],
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
    const definition = MAPS.scrap, source = JSON.stringify(definition);
    const player = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); player.add(body);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    const save = structuredClone(getSave()), stored = [...data], position = player.position.clone();
    assert.strictEqual(world.getMapInfo().map, definition);
    const sameRect = (a, b) => ["x", "y", "w", "h"].every(key => a[key] === b[key]);
    const edge = rect => rect.x <= 0 || rect.y <= 0 || rect.x + rect.w >= definition.w || rect.y + rect.h >= definition.h;
    const normalRects = definition.walls.filter(rect => !definition.obstacles.some(obstacle => sameRect(obstacle, rect)));
    const internalRects = normalRects.filter(rect => !edge(rect));
    assert.equal(definition.walls.length, 24);
    assert.equal(normalRects.length, 10); assert.equal(internalRects.length, 5);
    const walls = new Map(normalRects.map(rect => {
      const index = definition.walls.indexOf(rect), wall = root.getObjectByName(`original-wall:${index}`); assert.ok(wall);
      closeTo(size(wall).x, rect.w * .06); closeTo(size(wall).z, rect.h * .06);
      const seed = Math.sin((index + 17) * 127.1 + 311.7) * 43758.5453;
      closeTo(size(wall).y, edge(rect) ? (rect.y > definition.h / 2 || rect.x > definition.w / 2 ? .72 : 2.85)
        : 3.7 + (seed - Math.floor(seed)) * 4.8);
      const expected = world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2);
      closeTo(wall.position.x, expected.x); closeTo(wall.position.z, expected.z);
      return [rect, wall];
    }));
    assert.equal(nodes(root, node => node.name.startsWith("original-wall:")).length, normalRects.length);
    const details = root.children.filter(node => node.name === "scrap-wall-detail");
    root.updateMatrixWorld(true);
    for (const rect of normalRects) {
      const matching = details.filter(group => group.userData.sourceRect === rect), wall = walls.get(rect);
      const faces = edge(rect) ? [rect.w < rect.h ? rect.x < definition.w / 2 ? 1 : 3 : rect.y > definition.h / 2 ? 2 : 0] : [0, 1, 2, 3];
      assert.equal(matching.length, faces.reduce((sum, face) => sum + Math.ceil((face % 2 ? rect.h : rect.w) * .06 / 16), 0));
      assert.deepEqual(new Set(matching.map(group => group.userData.face)), new Set(faces));
      const originalBounds = new THREE.Box3().setFromObject(wall);
      for (const group of matching) {
        const parts = meshes(group), bounds = new THREE.Box3().setFromObject(group);
        assert.equal(group.userData.districtDetail, "scrap");
        assert.ok(parts.length > 0 && parts.length <= 6);
        assert.ok(parts.every(part => size(part).x <= 16.00001), "wall batches keep short local frustum bounds");
        assert.ok(bounds.min.x >= originalBounds.min.x - .18001 && bounds.max.x <= originalBounds.max.x + .18001);
        assert.ok(bounds.min.z >= originalBounds.min.z - .18001 && bounds.max.z <= originalBounds.max.z + .18001,
          "fittings do not protrude into narrow original passages");
        assert.ok(parts.every(part => part.userData.occlusionGroup === wall.uuid && world.getOccluders().includes(part) && !part.castShadow));
      }
    }
    const roofs = meshes(root).filter(node => node.name === "scrap-roof"), caps = meshes(root).filter(node => node.name === "scrap-cap");
    const floor = root.getObjectByName("scrap-damp-paving"); assert.ok(floor); assert.equal(floor.material.userData.surface, "stone");
    assert.equal(roofs.length, 5); assert.equal(caps.length, 5);
    assert.deepEqual(new Set(roofs.map(roof => roof.material.userData.surface)), new Set(["roof-metal", "roof-felt", "roof-tile"]));
    for (const cap of [...caps, ...roofs]) {
      const rect = normalRects.find(rect => walls.get(rect).uuid === cap.userData.occlusionGroup); assert.ok(rect);
      assert.equal(cap.name, edge(rect) ? "scrap-cap" : "scrap-roof");
      if (edge(rect)) assert.equal(cap.material.userData.surface, "roof-metal");
      assert.ok(cap.material.map && cap.material.normalMap && cap.material.roughnessMap); assert.notEqual(cap.material.map, floor.material.map);
      closeTo(size(cap).x, rect.w * .06); closeTo(size(cap).z, rect.h * .06);
    }
    const blocks = root.children.filter(group => group.name === "scrap-obstacle-detail");
    assert.equal(blocks.length, 9);
    const roles = { belt: 0, pile: 0, gate: 0 };
    for (const rect of definition.obstacles.filter(rect => rect.kind === "block")) {
      const matching = blocks.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], body = group.getObjectByName("scrap-obstacle-body"); assert.ok(body);
      const role = SCRAP_BELT.some(source => sameRect(source, rect)) ? "belt" : SCRAP_PILES.some(source => sameRect(source, rect)) ? "pile" : "gate";
      roles[role]++; assert.equal(group.userData.role, role);
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      closeTo(size(body).x, rect.w * .06); closeTo(size(body).z, rect.h * .06); closeTo(size(body).y, .75);
      closeTo(body.position.y, .375); assert.equal(body.castShadow, true);
      const fittings = group.children.filter(child => child.name === `scrap-${role}-fittings`);
      assert.equal(fittings.length, role === "belt" ? Math.ceil(rect.w * .06 / 16) : 1);
      const originalBounds = new THREE.Box3().setFromObject(body);
      for (const fitting of fittings) {
        const parts = meshes(fitting), bounds = new THREE.Box3().setFromObject(fitting);
        assert.ok(parts.length > 0 && parts.length <= 4);
        if (role === "belt") assert.ok(parts.every(part => size(part).x <= 16.00001), "belt fittings retain local frustum bounds");
        assert.ok(bounds.min.x >= originalBounds.min.x - 1e-5 && bounds.max.x <= originalBounds.max.x + 1e-5,
          "machinery cannot overhang Coil's original passage");
        assert.ok(bounds.min.z >= originalBounds.min.z - 1e-5 && bounds.max.z <= originalBounds.max.z + 1e-5);
        assert.ok(bounds.min.y >= -1e-5 && bounds.max.y <= ({ belt: 1.5, pile: 2, gate: 1.35 }[role]) + 1e-5);
        assert.ok(parts.every(part => part.userData.occlusionGroup === body.uuid && world.getOccluders().includes(part) && !part.castShadow));
        if (role === "pile") assert.ok(parts.reduce((n, part) => n + (part.geometry.index?.count ?? part.geometry.getAttribute("position").count) / 3, 0) <= 10000);
      }
      const cap = group.getObjectByName("scrap-gate-cap");
      if (role === "gate") {
        assert.ok(cap); closeTo(size(cap).x, rect.w * .06); closeTo(size(cap).z, rect.h * .06);
        closeTo(size(cap).y, .06); closeTo(cap.position.y, .77); assert.equal(cap.material.userData.surface, "roof-metal");
        assert.equal(cap.userData.occlusionGroup, body.uuid); assert.ok(world.getOccluders().includes(cap)); assert.equal(cap.castShadow, false);
      } else assert.equal(cap, undefined);
    }
    assert.deepEqual(roles, { belt: 2, pile: 5, gate: 2 });
    const fences = root.children.filter(group => group.name === "scrap-fence-detail");
    assert.equal(fences.length, 5);
    for (const rect of definition.obstacles.filter(rect => rect.kind === "fence")) {
      const matching = fences.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], parts = meshes(group), bounds = new THREE.Box3();
      assert.ok(parts.length > 0 && parts.length <= 3);
      assert.ok(parts.reduce((n, part) => n + (part.geometry.index?.count ?? part.geometry.getAttribute("position").count) / 3, 0) <= 8000);
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
        "the enclosure fences follow the original full X/Z extent");
      assert.equal(world.collides(group.position.x, group.position.z), true);
    }
    const infillFloors = meshes(root).filter(part => part.name === "scrap-yard-infill");
    const markings = root.children.filter(group => group.name === "scrap-rust-detail");
    assert.equal(infillFloors.length, SCRAP_BELT.length + SCRAP_PILES.length); assert.equal(markings.length, SCRAP_RUST.length);
    for (const rect of [...SCRAP_BELT, ...SCRAP_PILES]) {
      const base = infillFloors.find(part => part.userData.sourceRect === rect); assert.ok(base);
      closeTo(size(base).x, rect.w * .06); closeTo(size(base).z, rect.h * .06);
    }
    for (const rect of SCRAP_RUST) {
      const matching = markings.filter(group => group.userData.sourceRect === rect); assert.equal(matching.length, 1);
      const group = matching[0], parts = meshes(group); assert.ok(parts.length > 0 && parts.length <= 3);
      assert.ok(group.position.distanceTo(world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2)) < 1e-8);
      assert.ok(definition.zones.some(zone => sameRect(zone, rect)), "original rust encounter areas stay intact");
      for (const part of parts) {
        part.geometry.computeBoundingBox(); const bounds = part.geometry.boundingBox;
        assert.ok(bounds.min.x >= -rect.w * .03 - 1e-5 && bounds.max.x <= rect.w * .03 + 1e-5);
        assert.ok(bounds.min.z >= -rect.h * .03 - 1e-5 && bounds.max.z <= rect.h * .03 + 1e-5);
        assert.ok(bounds.min.y >= .044 - 1e-5 && bounds.max.y <= .05001, "floor detail remains flat below the puddles");
        assert.equal(part.castShadow, false); assert.ok(!world.getOccluders().includes(part));
      }
    }
    // The original 16-pixel Coil gate fits the unchanged .48 m player radius exactly.
    const openings = [[896, 420], [896, 460], [900, 260], [880, 800], [200, 520], [600, 350], [1500, 560]];
    for (const [x, y] of openings) {
      const p = world.toWorld(x, y);
      assert.equal(world.collides(p.x, p.z), false, `source passage at ${x},${y} stays open`);
    }

    const wall = walls.get(internalRects[1]), wallParts = world.getOccluders().filter(part => part.userData.occlusionGroup === wall.uuid);
    const bounds = new THREE.Box3().setFromObject(wall), centre = bounds.getCenter(new THREE.Vector3()), fade = createPlayerOcclusion();
    assert.ok(wallParts.some(part => part.name === "scrap-roof") && wallParts.some(part => part.name.startsWith("scrap-wall-detail:")));
    for (let frame = 0; frame < 12; frame++) fade.update(wallParts,
      new THREE.Vector3(centre.x, centre.y, bounds.max.z + 4), new THREE.Vector3(centre.x, 0, bounds.min.z - 4), .1);
    for (const part of wallParts) for (const material of materials(part)) assert.ok(material.opacity < .1, "cap, wall and fittings fade together");
    fade.dispose(); for (const part of wallParts) for (const material of materials(part)) assert.equal(material.opacity, 1);

    const objects = definition.objs.filter(obj => obj.kind !== "wild").map(obj => {
      const group = root.getObjectByName(`map-object:${obj.id}`); assert.ok(group); assert.strictEqual(group.userData.object, obj);
      assert.ok(group.position.distanceTo(world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2)) < 1e-8); return group;
    });
    const npcs = objects.filter(group => group.userData.object.kind === "npc"), npcChildren = npcs.map(group => [...group.children]);
    const props = objects.filter(group => group.userData.object.kind === "prop"), devices = props.map(group => group.getObjectByName("scrap-prop-detail"));
    assert.equal(devices.length, 5);
    for (let i = 0; i < props.length; i++) {
      const detail = devices[i]; assert.ok(detail); assert.strictEqual(detail.userData.sourceObject, props[i].userData.object);
      assert.ok(meshes(detail).length > 0 && meshes(detail).length <= 4);
      assert.ok(meshes(detail).every(part => !part.castShadow && !world.getOccluders().includes(part)));
      assert.ok(props[i].children.some(part => part.isMesh), "original interaction shells remain present");
    }
    const interactions = []; world.setInteractionHandler((object, mapId) => { interactions.push([object, mapId]); return true; });
    const mattresses = definition.objs.filter(obj => obj.kind === "mattress"); assert.equal(mattresses.length, 1);
    const actions = [["weld", 252, 259], ["coil", 896, 455],
      ...definition.objs.filter(obj => obj.kind === "prop" || obj.kind === "mattress")
        .map(obj => [obj.id, obj.x + obj.w / 2, obj.y + obj.h + 9])];
    for (const [id, x, y] of actions) {
      const obj = definition.objs.find(obj => obj.id === id);
      player.position.copy(world.toWorld(x, y));
      assert.equal(prompt.onclick(), true); assert.deepEqual(interactions.at(-1), [obj, "scrap"]);
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
    const signs = nodes(root, node => node.name === "scrap-sign-neon"); assert.equal(signs.length, 2);
    assert.ok(signs.every(part => !part.castShadow)); assert.ok(root.getObjectByName("district-wall-art"));
    const street = root.getObjectByName("street-details"); assert.ok(street && street.children.length);
    assert.ok(street.children.every(part => part.isInstancedMesh));
    assert.equal(JSON.stringify(definition), source); assert.deepEqual(getSave(), save); assert.deepEqual([...data], stored);

    const hatch = root.getObjectByName("map-object:scrap_gully"), hatchDetail = hatch.getObjectByName("scrap-hatch-detail");
    assert.ok(hatchDetail && meshes(hatchDetail).length > 0 && meshes(hatchDetail).length <= 3);
    assert.ok(meshes(hatchDetail).every(part => !part.castShadow));
    const owned = [...details, ...blocks, ...fences, ...markings, ...devices, hatchDetail].flatMap(meshes).concat(caps, roofs, signs, infillFloors);
    const geometryDisposals = watch(owned.map(part => part.geometry));
    const materialDisposals = watch(owned.flatMap(materials).filter(material => material.userData.local));
    const textureDisposals = watch([...caps, ...roofs].flatMap(part => [part.material.map, part.material.normalMap, part.material.roughnessMap]));
    const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); root.add(foreign);
    const foreignDisposals = watch([foreign.geometry, foreign.material, body.geometry, body.material]);
    player.position.copy(world.toWorld(121, 387));
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
