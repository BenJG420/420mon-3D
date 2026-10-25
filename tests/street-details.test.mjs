import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export * from "./src/game/street-details.ts";
    export { MAPS } from "./src/game/data/maps.ts";
    export { DISTRICTS } from "./src/game/data/zones.ts";
    export { WORLD_SCALE, mapToWorld } from "./src/game/worldGeometry.ts";
    export * as THREE from "three";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { THREE, planStreetDetails, createStreetDetails, STREET_PROP_RADIUS, MAPS, DISTRICTS, WORLD_SCALE, mapToWorld } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`,
);
const kinds = ["bottle", "can", "cardboard", "bicycle", "cart"];
const close = (a, b) => Math.abs(a - b) < 1e-5;
function distanceFromRect(map, item, rect) {
  const corner = mapToWorld(map, rect.x, rect.y), width = rect.w * WORLD_SCALE, depth = rect.h * WORLD_SCALE;
  const nearestX = Math.min(corner.x + width, Math.max(corner.x, item.x));
  const nearestZ = Math.min(corner.z + depth, Math.max(corner.z, item.z));
  return Math.hypot(item.x - nearestX, item.z - nearestZ);
}

test("district street props are deterministic, stay near existing bins and preserve source maps/routes", () => {
  const ids = [...new Set([...DISTRICTS.map(district => district.map), "market", "kino", "sewer", "kai"].filter(id => MAPS[id]))];
  for (const id of ids) {
    const map = MAPS[id], source = JSON.stringify(map), placements = planStreetDetails(map);
    assert.deepEqual(planStreetDetails(map), placements, `${id}: placement cannot change when revisiting`);
    assert.equal(JSON.stringify(map), source, `${id}: original objects, walls and routes are untouched`);
    const bins = map.objs.filter(object => object.kind === "bin");
    if (!bins.length) assert.equal(placements.length, 0);
    else assert.ok(placements.length > 0, `${id}: existing street bins receive detail`);
    for (const [index, item] of placements.entries()) {
      const radius = STREET_PROP_RADIUS[item.kind];
      assert.ok(kinds.includes(item.kind));
      assert.ok([item.x, item.z, item.angle].every(Number.isFinite));
      assert.ok(Math.abs(item.x) + radius + .1 < map.w * WORLD_SCALE / 2 && Math.abs(item.z) + radius + .1 < map.h * WORLD_SCALE / 2);
      for (const wall of map.walls) assert.ok(distanceFromRect(map, item, wall) >= radius + .08 - 1e-8, `${id}: complete prop footprint stays outside original walls`);
      for (const object of map.objs) {
        const clearance = object.kind === "bin" ? .08 : .65;
        assert.ok(distanceFromRect(map, item, object) >= radius + clearance - 1e-8, `${id}/${object.id}: props keep interactions and actor approaches clear`);
      }
      for (const other of placements.slice(0, index)) assert.ok(Math.hypot(item.x - other.x, item.z - other.z) >= radius + STREET_PROP_RADIUS[other.kind] + .08 - 1e-8, "parked props do not overlap each other");
      assert.ok(bins.some(bin => {
        const centre = mapToWorld(map, bin.x + bin.w / 2, bin.y + bin.h / 2);
        return Math.hypot(item.x - centre.x, item.z - centre.z) < 5;
      }), `${id}: scenery stays at original street-service anchors`);
      if (map.indoor) assert.ok(item.kind !== "bicycle" && item.kind !== "cart", "indoor rooms do not receive parked outdoor vehicles");
    }
    if (id === "sewer") {
      assert.ok(placements.some(item => item.x < -map.w * WORLD_SCALE * .4));
      assert.ok(placements.some(item => item.x > map.w * WORLD_SCALE * .4), "Kanal props extend to its eastern exits within the same six-cluster budget");
      assert.ok(placements.length <= 39);
    }
    if (id === "alley" || id === "yard") assert.deepEqual([...new Set(placements.map(item => item.kind))].sort(), [...kinds].sort(), `${id}: retrofitted streets include each requested prop type`);
  }
});

test("street detail instances retain bounded geometry, culling and shared material ownership", () => {
  const parent = new THREE.Group(), outsider = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  parent.add(outsider);
  const texture = new THREE.Texture();
  const materials = Object.fromEntries(["glass", "metal", "rubber", "cardboard"].map(finish => [finish, new THREE.MeshPhysicalMaterial({ map: texture })]));
  let externalDisposals = 0;
  for (const resource of [texture, ...Object.values(materials), outsider.geometry, outsider.material]) resource.addEventListener("dispose", () => externalDisposals++);
  for (const map of [MAPS.alley, MAPS.yard]) {
    const placements = planStreetDetails(map), renderer = createStreetDetails(parent, map, materials), root = renderer.root;
    assert.equal(root.name, "street-details"); assert.strictEqual(root.parent, parent);
    assert.ok(root.children.length > 0 && root.children.every(node => node.isInstancedMesh));
    assert.ok(root.children.some(node => node.count > 1), "repeated street props actually share instance submissions");
    root.updateMatrixWorld(true);
    const represented = new Set(), resources = new Set();
    for (const node of root.children) {
      assert.ok(kinds.includes(node.userData.propKind));
      assert.ok(Object.values(materials).includes(node.material), "materials remain shared rather than cloned per item");
      assert.equal(node.castShadow, false); assert.equal(node.receiveShadow, true); assert.equal(node.frustumCulled, true);
      assert.ok(node.boundingBox && node.boundingSphere?.radius > 0);
      assert.equal(node.instanceMatrix.usage, THREE.StaticDrawUsage);
      resources.add(node); resources.add(node.geometry);
      const centres = [], positions = node.geometry.getAttribute("position"), bounds = node.boundingBox.clone().expandByScalar(1e-5);
      for (let vertex = 0; vertex < positions.count; vertex++) assert.ok(Math.hypot(positions.getX(vertex), positions.getZ(vertex)) <= STREET_PROP_RADIUS[node.userData.propKind] + 1e-6, "real model geometry fits the planner's clearance radius");
      for (let instance = 0; instance < node.count; instance++) {
        const matrix = new THREE.Matrix4(); node.getMatrixAt(instance, matrix);
        const local = new THREE.Vector3().setFromMatrixPosition(matrix), world = local.clone().applyMatrix4(node.matrixWorld);
        centres.push(local);
        const index = placements.findIndex(item => item.kind === node.userData.propKind && close(item.x, world.x) && close(item.z, world.z));
        assert.ok(index >= 0, "rendered instances use actual planned positions"); represented.add(index);
        for (let vertex = 0; vertex < positions.count; vertex++) {
          const point = new THREE.Vector3().fromBufferAttribute(positions, vertex).applyMatrix4(matrix);
          assert.ok(bounds.containsPoint(point), "frustum bounds contain every transformed prop vertex");
          assert.ok(node.boundingSphere.distanceToPoint(point) < 1e-5);
        }
      }
      for (const axis of ["x", "z"]) assert.ok(Math.max(...centres.map(point => point[axis])) - Math.min(...centres.map(point => point[axis])) <= 16 + 1e-5, "street instances use small culling cells");
    }
    assert.equal(represented.size, placements.length, "all planned street props reach the scene");
    renderer.update(new THREE.Vector3(10000, 0, 10000));
    assert.ok(root.children.every(node => !node.visible), "distant street detail batches stop submitting draws");
    renderer.update(new THREE.Vector3(placements[0].x, 0, placements[0].z));
    assert.ok(root.children.some(node => node.visible), "street details return when approaching their district cell");
    const disposalCounts = new Map([...resources].map(resource => [resource, 0]));
    for (const resource of resources) resource.addEventListener("dispose", () => disposalCounts.set(resource, disposalCounts.get(resource) + 1));
    renderer.dispose(); renderer.dispose();
    assert.ok([...disposalCounts.values()].every(count => count === 1), "instance buffers and prototype geometries are each released once");
    assert.equal(root.parent, null); assert.deepEqual(parent.children, [outsider]); assert.equal(externalDisposals, 0);
  }
  for (const material of Object.values(materials)) material.dispose();
  texture.dispose(); outsider.geometry.dispose(); outsider.material.dispose();
});
