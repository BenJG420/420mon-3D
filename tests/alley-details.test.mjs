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

test("Gasse A details share building occlusion, preserve the original world and release only map-owned resources", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const savedGlobals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const originalSave = JSON.stringify({ gold: 777, starterId: "mon_budling", inventory: { seed_kush: 7 } });
  const data = new Map([
    ["420mon-progress-v1", JSON.stringify({ gold: 150, map: "alley", x: 80, y: 740, starterId: "mon_budling", inventory: { seed_kush: 3 }, visitedMaps: ["alley", "market"], quests: { q_v_market: "done" }, quest: { q_v_market: true } })],
    ["420mon_save_v1", originalSave], ["stable-release-fixture", "unchanged"],
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
    const sourceDefinition = JSON.stringify(MAPS.alley);
    const player = new THREE.Group();
    const playerBody = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    player.add(playerBody);
    const world = createDistrictWorld(new THREE.Scene(), player), root = world.getRoot();
    assert.strictEqual(world.getMapInfo().map, MAPS.alley);
    const allMeshes = meshes(root), roofs = allMeshes.filter(node => node.name === "alley-roof");
    assert.deepEqual([...new Set(roofs.map(node => node.userData.roofKind))].sort(), ["roof-felt", "roof-metal", "roof-tile"]);
    const floorMaps = new Set(allMeshes.flatMap(materials).filter(material => material.userData.surface === "asphalt" || material.userData.surface === "stone").map(material => material.map));
    for (const roof of roofs) {
      assert.equal(roof.material.userData.surface, roof.userData.roofKind);
      assert.ok(roof.material.map && roof.material.normalMap && roof.material.roughnessMap);
      assert.equal(floorMaps.has(roof.material.map), false, "roof material has independent PBR textures");
      const wall = world.getOccluders().find(node => node.uuid === roof.userData.occlusionGroup);
      assert.ok(wall?.name.startsWith("original-wall:"), "roof fades with its original building wall");
    }
    const facades = root.children.filter(node => node.userData.districtDetail === "alley");
    assert.ok(facades.length > 3, "the actual district receives multiple detailed building facades");
    for (const facade of facades) {
      assert.equal(facade.userData.facadeSides, 4, "rear-facing walls receive facade detail too");
      const parts = meshes(facade);
      assert.ok(parts.some(node => node.name.startsWith("alley-building-detail:")));
      assert.ok(parts.length <= 10, `${facade.name}: merged details stay within ten main-pass submissions per building`);
      const groups = new Set(parts.map(node => node.userData.occlusionGroup));
      assert.equal(groups.size, 1, "facade trim and its label fade together");
      assert.ok(!groups.has(undefined));
      for (const part of parts) assert.ok(world.getOccluders().includes(part), "new details participate in actual player occlusion");
    }
    const bins = MAPS.alley.objs.filter(object => object.kind === "bin");
    for (const bin of bins) {
      const detail = root.getObjectByName(`map-object:${bin.id}`).getObjectByName("alley-bin-detail");
      assert.ok(detail, `${bin.id}: visible litter at the existing bin`);
      assert.ok(meshes(detail).length > 0 && meshes(detail).length <= 4, "litter is merged within its draw budget");
    }
    for (const sign of MAPS.alley.objs.filter(object => object.kind === "sign")) {
      const signMeshes = meshes(root.getObjectByName(`map-object:${sign.id}`));
      assert.ok(signMeshes.some(node => materials(node).some(material => material.emissive?.getHex() > 0 && material.emissiveIntensity > 0)), `${sign.id}: original destination sign has a visible emissive surround`);
    }

    // Exercise the existing fading controller using a real district building.
    const facadeParts = meshes(facades[0]);
    const building = world.getOccluders().filter(node => node.userData.occlusionGroup === facadeParts[0].userData.occlusionGroup);
    const wall = building.find(node => node.name.startsWith("original-wall:"));
    const bounds = new THREE.Box3().setFromObject(wall), centre = bounds.getCenter(new THREE.Vector3());
    const controller = createPlayerOcclusion();
    for (let frame = 0; frame < 12; frame++) controller.update(building,
      new THREE.Vector3(centre.x, centre.y, bounds.max.z + 4), new THREE.Vector3(centre.x, 0, bounds.min.z - 4), .1);
    for (const part of facadeParts) for (const material of materials(part)) assert.ok(material.opacity < .1, "facade details must not remain opaque in front of the player");
    controller.dispose();
    for (const part of facadeParts) for (const material of materials(part)) assert.equal(material.opacity, 1);

    // Source map objects and actor identity remain untouched by visual mode changes.
    const sourceObjects = MAPS.alley.objs.filter(object => object.kind !== "wild");
    const objectGroups = sourceObjects.map(object => {
      const node = root.getObjectByName(`map-object:${object.id}`);
      assert.ok(node, `${object.id}: original interaction is still rendered`);
      assert.strictEqual(node.userData.object, object);
      const position = world.toWorld(object.x + object.w / 2, object.y + object.h / 2);
      assert.ok(node.position.distanceTo(position) < 1e-8);
      return node;
    });
    const npcGroups = objectGroups.filter(node => ["npc", "shop", "stall"].includes(node.userData.object.kind));
    const npcChildren = npcGroups.map(node => [...node.children]);
    const position = player.position.clone(), snapshot = structuredClone(getSave()), stored = [...data];
    const collisionPoints = [MAPS.alley.walls[0], MAPS.alley.buildings[0], ...MAPS.alley.objs.filter(object => object.kind === "door").slice(0, 2)]
      .map(rect => world.toWorld(rect.x + rect.w / 2, rect.y + rect.h / 2));
    const beforeCollision = collisionPoints.map(point => world.collides(point.x, point.z));
    for (let index = 0; index < collisionPoints.length; index++) {
      const point = collisionPoints[index];
      assert.equal(beforeCollision[index], collidesOnMap(MAPS.alley, point.x, point.z, .48, snapshot.deadWild, snapshot.starterId));
    }
    world.setPerformanceMode(false); world.setPerformanceMode(true);
    assert.deepEqual(objectGroups.map(node => root.getObjectByName(node.name)), objectGroups);
    npcGroups.forEach((node, index) => assert.deepEqual(node.children, npcChildren[index]));
    assert.deepEqual(player.children, [playerBody]); assert.deepEqual(player.position, position);
    assert.deepEqual(collisionPoints.map(point => world.collides(point.x, point.z)), beforeCollision);
    assert.equal(JSON.stringify(MAPS.alley), sourceDefinition);
    assert.deepEqual(getSave(), snapshot); assert.deepEqual([...data], stored);

    const ownedMeshes = [...new Set([...roofs, ...facades.flatMap(meshes), ...bins.flatMap(bin => meshes(root.getObjectByName(`map-object:${bin.id}`).getObjectByName("alley-bin-detail")))])];
    const localMaterials = [...new Set(ownedMeshes.flatMap(materials).filter(material => material.userData.local))];
    const geometryDisposals = watchDisposals(ownedMeshes.map(node => node.geometry));
    const materialDisposals = watchDisposals(localMaterials);
    const labelTextures = localMaterials.filter(material => !material.userData.sharedTexture && material.map?.isCanvasTexture).map(material => material.map);
    assert.equal(labelTextures.length, 3, "Mira, Raze and Cherry labels must match contained source house frontages");
    root.updateMatrixWorld(true);
    const labels = ownedMeshes.filter(node => node.name === "house-name");
    for (const house of MAPS.alley.buildings.filter(building => building.name)) {
      const centre = world.toWorld(house.x + house.w / 2, house.side === "n" ? house.y + house.h : house.y);
      assert.ok(labels.some(label => {
        const position = label.getWorldPosition(new THREE.Vector3());
        return Math.abs(position.x - centre.x) < 1e-6 && Math.abs(position.z - centre.z) < .25;
      }), `${house.name}: facade label follows its actual doorway frontage`);
    }
    const labelDisposals = watchDisposals(labelTextures);
    const sharedRoofDisposals = watchDisposals(roofs.flatMap(node => [node.material.map, node.material.normalMap, node.material.roughnessMap]));
    const external = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    root.add(external);
    const externalDisposals = watchDisposals([external.geometry, external.material, playerBody.geometry, playerBody.material]);
    // Revisit a previously rewarded map: first visits legitimately award quest gold.
    world.travel("market");
    assert.ok([...geometryDisposals.values()].every(count => count === 1), "old detail geometries are released once");
    assert.ok([...materialDisposals.values()].every(count => count === 1), "per-building fading materials are released once");
    assert.ok([...labelDisposals.values()].every(count => count === 1), "map-owned canvas textures are released");
    assert.ok([...sharedRoofDisposals.values()].every(count => count === 0), "PBR cache survives the map transition");
    assert.ok([...externalDisposals.values()].every(count => count === 0), "player and foreign systems keep ownership");
    assert.equal(root.getObjectByName("alley-roof"), undefined);
    assert.equal(root.children.some(node => node.userData.districtDetail === "alley"), false);
    assert.equal(meshes(root).filter(node => node.name === "market-roof").length, 4, "v59 market roofs replace the old undecorated destination without retaining alley meshes");
    for (const key of ["gold", "inventory", "team", "box", "starterId"]) assert.deepEqual(getSave()[key], snapshot[key], `${key}: travel must not change gameplay content`);
    assert.equal(data.get("420mon_save_v1"), originalSave);
    assert.equal(data.get("stable-release-fixture"), "unchanged");
    external.geometry.dispose(); external.material.dispose(); playerBody.geometry.dispose(); playerBody.material.dispose();
  } finally {
    for (const key of keys) { if (savedGlobals[key]) Object.defineProperty(globalThis, key, savedGlobals[key]); else delete globalThis[key]; }
  }
});
