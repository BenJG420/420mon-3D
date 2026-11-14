import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export * from "./src/game/district-props.ts";
    export { appendDistrictProp } from "./src/game/district-prop-models.ts";
    export { planStreetDetails, STREET_PROP_RADIUS } from "./src/game/street-details.ts";
    export { MAPS } from "./src/game/data/maps.ts";
    export { WORLD_SCALE, mapToWorld } from "./src/game/worldGeometry.ts";
    export * as THREE from "three";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const {
  THREE, MAPS, WORLD_SCALE, mapToWorld, appendDistrictProp,
  DISTRICT_PROP_KINDS, DISTRICT_PROP_RADIUS, planDistrictProps, createDistrictProps,
  planStreetDetails, STREET_PROP_RADIUS,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
const ids = ["alley", "yard", "cable", "market", "kino", "kai", "sewer", "ash", "drain", "chem", "ring", "labyrinth", "nische", "scrap"];
const finishes = ["metal", "wood", "rubber", "paint"];
const close = (a, b) => Math.abs(a - b) < 1e-5;
const isServiceAnchor = object => ["bin", "lamp", "sign"].includes(object.kind);

function distanceFromRect(map, item, rect) {
  const corner = mapToWorld(map, rect.x, rect.y), width = rect.w * WORLD_SCALE, depth = rect.h * WORLD_SCALE;
  const nearestX = Math.min(corner.x + width, Math.max(corner.x, item.x));
  const nearestZ = Math.min(corner.z + depth, Math.max(corner.z, item.z));
  return Math.hypot(item.x - nearestX, item.z - nearestZ);
}

test("all 28 district models have distinct bounded geometry fitting their complete clearance circles", () => {
  assert.deepEqual(Object.keys(DISTRICT_PROP_KINDS), ids);
  const kinds = Object.values(DISTRICT_PROP_KINDS).flat(), signatures = new Set();
  assert.equal(kinds.length, 28); assert.equal(new Set(kinds).size, 28);
  for (const kind of kinds) {
    const usedFinishes = new Set(), hash = createHash("sha256");
    let triangles = 0, minY = Infinity, maxY = -Infinity, radius = 0;
    appendDistrictProp(kind, (finish, geometry) => {
      assert.ok(finishes.includes(finish)); usedFinishes.add(finish);
      const positions = geometry.getAttribute("position");
      assert.equal(geometry.index, null, "parts use compatible nonindexed geometry for merging");
      triangles += positions.count / 3;
      for (const name of ["position", "normal", "uv"]) {
        const attribute = geometry.getAttribute(name);
        assert.equal(attribute.count, positions.count);
        assert.ok([...attribute.array].every(Number.isFinite), `${kind}: ${name} is finite`);
      }
      for (let vertex = 0; vertex < positions.count; vertex++) {
        radius = Math.max(radius, Math.hypot(positions.getX(vertex), positions.getZ(vertex)));
        minY = Math.min(minY, positions.getY(vertex)); maxY = Math.max(maxY, positions.getY(vertex));
      }
      hash.update(finish); hash.update(Buffer.from(positions.array.buffer, positions.array.byteOffset, positions.array.byteLength));
      geometry.dispose();
    });
    assert.ok(triangles >= 100 && triangles <= 3000, `${kind}: ${triangles} triangles`);
    assert.ok(usedFinishes.size >= 2 && usedFinishes.size <= 4, `${kind}: at most four material submissions per cell`);
    assert.ok(radius <= DISTRICT_PROP_RADIUS[kind] + 1e-6 && DISTRICT_PROP_RADIUS[kind] <= .75, `${kind}: every handle, cable and projecting detail fits the planner radius`);
    assert.ok(minY >= -1e-7 && maxY > .2, `${kind}: grounded volumetric model, minimum ${minY}`);
    signatures.add(hash.digest("hex"));
  }
  assert.equal(signatures.size, 28, "district models have independently authored shapes");
});

test("all 14 original districts receive both local models without changing routes or overlapping existing detail", () => {
  for (const id of ids) {
    const map = MAPS[id], source = JSON.stringify(map), placements = planDistrictProps(map), streetProps = planStreetDetails(map);
    assert.deepEqual(planDistrictProps(map), placements, `${id}: revisits use deterministic positions`);
    assert.equal(JSON.stringify(map), source, `${id}: source walls, objects, actors, routes and interactions stay unchanged`);
    const kinds = DISTRICT_PROP_KINDS[id];
    assert.ok(placements.length >= 6 && placements.length <= 8, `${id}: six to eight total props`);
    for (const kind of kinds) {
      const count = placements.filter(item => item.kind === kind).length;
      assert.ok(count === 3 || count === 4, `${id}/${kind}: three or four instances, got ${count}`);
    }
    for (const [index, item] of placements.entries()) {
      const radius = DISTRICT_PROP_RADIUS[item.kind], anchor = map.objs.find(object => object.id === item.anchorId);
      assert.ok(kinds.includes(item.kind)); assert.ok([item.x, item.z, item.angle].every(Number.isFinite));
      assert.ok(anchor && (isServiceAnchor(anchor) || id === "kino" && anchor.kind === "prop"), `${id}: placements use original service anchors or Kino fixtures`);
      assert.ok(Math.abs(item.x) + radius + .1 < map.w * WORLD_SCALE / 2 && Math.abs(item.z) + radius + .1 < map.h * WORLD_SCALE / 2, `${id}: full models stay inside map edges`);
      for (const wall of map.walls) assert.ok(distanceFromRect(map, item, wall) >= radius + .08 - 1e-8, `${id}: full model stays clear of original walls`);
      for (const object of map.objs) {
        const clearance = object === anchor && isServiceAnchor(object) ? .08 : .65;
        assert.ok(distanceFromRect(map, item, object) >= radius + clearance - 1e-8, `${id}/${object.id}: complete model keeps fixture and interaction clearance`);
      }
      for (const prop of streetProps) assert.ok(Math.hypot(prop.x - item.x, prop.z - item.z) >= radius + STREET_PROP_RADIUS[prop.kind] + .08 - 1e-8, `${id}: existing bottles, cans, cardboard, carts and bicycles retain their full footprint`);
      for (const other of placements.slice(0, index)) assert.ok(Math.hypot(item.x - other.x, item.z - other.z) >= radius + DISTRICT_PROP_RADIUS[other.kind] + .08 - 1e-8, `${id}: district models do not overlap`);
      const centre = mapToWorld(map, anchor.x + anchor.w / 2, anchor.y + anchor.h / 2);
      const maximumReach = Math.hypot(anchor.w, anchor.h) * WORLD_SCALE / 2 + radius + (isServiceAnchor(anchor) ? .08 : .65) + .04 + 2.8;
      assert.ok(Math.hypot(item.x - centre.x, item.z - centre.z) <= maximumReach + 1e-8, `${id}: props remain near their original landmark`);
    }
    if (id === "sewer") {
      for (const kind of kinds) {
        const xs = placements.filter(item => item.kind === kind).map(item => item.x);
        assert.ok(Math.max(...xs) - Math.min(...xs) > map.w * WORLD_SCALE * .5, `${kind}: both model kinds extend along the long Kanal`);
      }
      assert.ok(placements.some(item => item.x < -map.w * WORLD_SCALE * .4));
      assert.ok(placements.some(item => item.x > map.w * WORLD_SCALE * .4));
    }
  }
});

test("unsupported, anchorless or completely blocked maps add no district props", () => {
  const blank = { id: "capsule", name: "Room", w: 400, h: 300, bg: "", walls: [], objs: [], zones: [] };
  assert.deepEqual(planDistrictProps(blank), []);
  assert.deepEqual(planDistrictProps({ ...blank, id: "alley" }), []);
  const blocked = { ...MAPS.kino, walls: [{ x: 0, y: 0, w: MAPS.kino.w, h: MAPS.kino.h }] };
  assert.deepEqual(planDistrictProps(blocked), [], "bounded search never relaxes clearance to force a placement");
  const parent = new THREE.Group(), renderer = createDistrictProps(parent, blank, {});
  assert.equal(renderer.root.userData.district, "capsule"); assert.equal(renderer.root.userData.propCount, 0);
  assert.deepEqual(renderer.root.children, []);
  renderer.update(new THREE.Vector3()); renderer.dispose(); renderer.dispose();
  assert.deepEqual(parent.children, []);
});

test("district instances match plans with conservative bounds, 16m cells, 48m culling and owned-resource disposal", () => {
  const parent = new THREE.Group(), outsider = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  parent.add(outsider);
  const texture = new THREE.Texture(), materials = Object.fromEntries(finishes.map(finish => [finish, new THREE.MeshPhysicalMaterial({ map: texture })]));
  let externalDisposals = 0, repeatedInstances = 0;
  for (const resource of [texture, ...Object.values(materials), outsider.geometry, outsider.material]) resource.addEventListener("dispose", () => externalDisposals++);
  for (const id of ids) {
    const placements = planDistrictProps(MAPS[id]), renderer = createDistrictProps(parent, MAPS[id], materials), root = renderer.root;
    assert.equal(root.name, "district-props"); assert.equal(root.userData.district, id); assert.equal(root.userData.propCount, placements.length);
    assert.strictEqual(root.parent, parent); root.updateMatrixWorld(true);
    assert.ok(root.children.length > 0 && root.children.length <= placements.length * 4 && root.children.every(node => node.isInstancedMesh));
    const represented = new Set(), resources = new Set(), prototypes = new Map();
    for (const node of root.children) {
      const kind = node.userData.propKind, finish = node.userData.finish, key = `${kind}:${finish}`;
      assert.ok(DISTRICT_PROP_KINDS[id].includes(kind)); assert.strictEqual(node.material, materials[finish]);
      assert.equal(node.castShadow, false); assert.equal(node.receiveShadow, true); assert.equal(node.frustumCulled, true);
      assert.ok(node.boundingBox && node.boundingSphere?.radius > 0); assert.equal(node.instanceMatrix.usage, THREE.StaticDrawUsage);
      if (prototypes.has(key)) assert.strictEqual(prototypes.get(key), node.geometry, "separate cells share model geometry");
      prototypes.set(key, node.geometry); resources.add(node); resources.add(node.geometry);
      if (node.count > 1) repeatedInstances++;
      const positions = node.geometry.getAttribute("position"), centres = [], bounds = node.boundingBox.clone().expandByScalar(1e-5);
      for (let instance = 0; instance < node.count; instance++) {
        const matrix = new THREE.Matrix4(); node.getMatrixAt(instance, matrix);
        const local = new THREE.Vector3().setFromMatrixPosition(matrix), world = local.clone().applyMatrix4(node.matrixWorld);
        centres.push(local);
        const index = placements.findIndex(item => item.kind === kind && close(item.x, world.x) && close(item.z, world.z));
        assert.ok(index >= 0, `${id}: rendered model uses planned world position`); represented.add(index);
        assert.ok(close(world.y, .055));
        assert.ok(close(matrix.elements[0], Math.cos(placements[index].angle)) && close(matrix.elements[8], Math.sin(placements[index].angle)), "rendered rotation matches the plan");
        for (let vertex = 0; vertex < positions.count; vertex++) {
          const point = new THREE.Vector3().fromBufferAttribute(positions, vertex).applyMatrix4(matrix);
          assert.ok(bounds.containsPoint(point), `${id}/${kind}: frustum box contains every transformed model vertex`);
          assert.ok(node.boundingSphere.distanceToPoint(point) < 1e-5, `${id}/${kind}: frustum sphere contains every transformed model vertex`);
        }
      }
      for (const axis of ["x", "z"]) assert.ok(Math.max(...centres.map(point => point[axis])) - Math.min(...centres.map(point => point[axis])) <= 16 + 1e-5, "batches stay within a 16m spatial cell");
    }
    assert.equal(represented.size, placements.length, `${id}: every planned model reaches the scene`);
    renderer.update(new THREE.Vector3(10000, 0, 10000)); assert.ok(root.children.every(node => !node.visible));
    const node = root.children[0], sphere = node.boundingSphere;
    const centreX = node.position.x + sphere.center.x, centreZ = node.position.z + sphere.center.z;
    renderer.update(new THREE.Vector3(centreX + 48 + sphere.radius + .001, 0, centreZ)); assert.equal(node.visible, false);
    renderer.update(new THREE.Vector3(centreX + 48 + sphere.radius - .001, 0, centreZ)); assert.equal(node.visible, true);
    renderer.update(new THREE.Vector3(placements[0].x, 0, placements[0].z)); assert.ok(root.children.some(child => child.visible));
    const disposalCounts = new Map([...resources].map(resource => [resource, 0]));
    for (const resource of resources) resource.addEventListener("dispose", () => disposalCounts.set(resource, disposalCounts.get(resource) + 1));
    renderer.dispose(); renderer.dispose(); renderer.update(new THREE.Vector3());
    assert.ok([...disposalCounts.values()].every(count => count === 1), `${id}: instance buffers and shared prototype geometries are each disposed exactly once`);
    assert.equal(root.parent, null); assert.deepEqual(root.children, []); assert.deepEqual(parent.children, [outsider]); assert.equal(externalDisposals, 0);
  }
  assert.ok(repeatedInstances > 0, "nearby repetitions actually share instance submissions");
  for (const material of Object.values(materials)) material.dispose();
  texture.dispose(); outsider.geometry.dispose(); outsider.material.dispose();
});
