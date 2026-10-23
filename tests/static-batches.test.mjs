import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export * from "./src/game/static-batches.ts";
    export { createDistrictWorld } from "./src/game/world.ts";
    export { MAPS, mapSketch } from "./src/game/data/maps.ts";
    export * as THREE from "three";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { THREE, createStaticBatches, createDistrictWorld, MAPS, mapSketch } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`,
);

// Compare the actual submitted vertex/normal/UV/index streams in world space,
// including non-uniform instance transforms, rather than checking a batch recipe.
function renderedShapes(group) {
  group.updateMatrixWorld(true);
  const result = [];
  group.traverse(node => {
    if (!node.isMesh) return;
    for (let instance = 0; instance < (node.isInstancedMesh ? node.count : 1); instance++) {
      const matrix = node.matrixWorld.clone();
      if (node.isInstancedMesh) { const local = new THREE.Matrix4(); node.getMatrixAt(instance, local); matrix.multiply(local); }
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
      const positions = node.geometry.getAttribute("position"), normals = node.geometry.getAttribute("normal");
      const points = [], directions = [];
      for (let vertex = 0; vertex < positions.count; vertex++) {
        points.push(new THREE.Vector3().fromBufferAttribute(positions, vertex).applyMatrix4(matrix));
        directions.push(new THREE.Vector3().fromBufferAttribute(normals, vertex).applyNormalMatrix(normalMatrix));
      }
      result.push({ key: `${node.name}:${new THREE.Vector3().setFromMatrixPosition(matrix).toArray().map(value => value.toFixed(4)).join(",")}`,
        points, directions, uv: [...node.geometry.getAttribute("uv").array], indices: [...node.geometry.index.array],
        material: node.material, castShadow: node.castShadow, receiveShadow: node.receiveShadow });
    }
  });
  return result.sort((a, b) => a.key.localeCompare(b.key));
}
function equivalent(actual, original) {
  assert.equal(actual.length, original.length);
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i], b = original[i];
    assert.equal(a.key, b.key); assert.strictEqual(a.material, b.material);
    assert.equal(a.castShadow, b.castShadow); assert.equal(a.receiveShadow, b.receiveShadow);
    assert.deepEqual(a.uv, b.uv); assert.deepEqual(a.indices, b.indices);
    assert.equal(a.points.length, b.points.length);
    for (let j = 0; j < a.points.length; j++) {
      assert.ok(a.points[j].distanceTo(b.points[j]) < 4e-6, `${a.key}: vertex ${j} moved`);
      assert.ok(a.directions[j].distanceTo(b.directions[j]) < 2e-6, `${a.key}: normal ${j} changed`);
    }
  }
}

test("static instances retain original cone/plane vertices, smooth normals, UVs and cell culling bounds", () => {
  const parent = new THREE.Group(), texture = new THREE.Texture();
  // Coplanar puddles keep one shared material/normal; overlapping alpha patches
  // therefore preserve their appearance regardless of instance ordering.
  const materials = { grass: new THREE.MeshPhysicalMaterial(), puddle: new THREE.MeshPhysicalMaterial({ alphaMap: texture, transparent: true, depthWrite: false }) };
  const items = [
    { kind: "grass", position: new THREE.Vector3(-.2, .17, 2), height: .26, lean: -.19 },
    { kind: "grass", position: new THREE.Vector3(-1, .17, 2.3), height: .473, lean: .16 },
    { kind: "grass", position: new THREE.Vector3(17, .17, 2), height: .39, lean: 0 },
    { kind: "puddle", position: new THREE.Vector3(1, .058, 2), size: 3.4, angle: 1.71, stretch: .35 },
    { kind: "puddle", position: new THREE.Vector3(1.5, .058, 2.3), size: .9, angle: .3, stretch: .85 },
    { kind: "puddle", position: new THREE.Vector3(33, .058, -17), size: 2, angle: 2.8, stretch: .6 },
  ];
  const batches = createStaticBatches(parent, items, materials);
  const root = parent.children[0];
  assert.ok(root.children.every(node => node.isInstancedMesh), "legacy meshes are not allocated in optimized mode");
  assert.equal(root.children.length, 4); assert.equal(batches.getStats().baselineDraws, 6);
  assert.equal(batches.getStats().optimizedDraws, 4); assert.equal(batches.getStats().activeDraws, 4);
  const instanced = renderedShapes(root);
  for (const node of root.children) {
    assert.equal(node.frustumCulled, true);
    assert.ok(node.boundingSphere.radius > 0);
    const matrices = [];
    for (let i = 0; i < node.count; i++) { const matrix = new THREE.Matrix4(); node.getMatrixAt(i, matrix); matrices.push(matrix); }
    const centres = matrices.map(matrix => new THREE.Vector3().setFromMatrixPosition(matrix));
    assert.ok(Math.max(...centres.map(point => point.x)) - Math.min(...centres.map(point => point.x)) <= 16);
    assert.ok(Math.max(...centres.map(point => point.z)) - Math.min(...centres.map(point => point.z)) <= 16);
    const bounds = node.boundingBox.clone().expandByScalar(1e-6);
    const positions = node.geometry.getAttribute("position");
    for (const matrix of matrices) for (let i = 0; i < positions.count; i++) {
      const point = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(matrix);
      assert.ok(bounds.containsPoint(point), "small-cell culling bounds contain every transformed vertex");
      assert.ok(node.boundingSphere.distanceToPoint(point) < 1e-6);
    }
  }
  batches.setOptimized(false);
  assert.equal(root.children.length, 6); assert.ok(root.children.every(node => !node.isInstancedMesh));
  equivalent(instanced, renderedShapes(root));
  const reference = renderedShapes(root);
  batches.setOptimized(true); equivalent(renderedShapes(root), reference);
  batches.dispose(); texture.dispose(); materials.grass.dispose(); materials.puddle.dispose();
});

test("mode changes release owned instance buffers/geometries exactly once and keep shared materials/textures", () => {
  const parent = new THREE.Group(), outsiderGeometry = new THREE.BoxGeometry();
  const texture = new THREE.Texture(), material = new THREE.MeshPhysicalMaterial({ alphaMap: texture });
  const outsider = new THREE.Mesh(outsiderGeometry, material); parent.add(outsider);
  let externalDisposals = 0;
  for (const resource of [outsiderGeometry, texture, material]) resource.addEventListener("dispose", () => externalDisposals++);
  const batches = createStaticBatches(parent, [
    { kind: "grass", position: new THREE.Vector3(1, .17, 1), height: .31, lean: .12 },
    { kind: "grass", position: new THREE.Vector3(20, .17, 1), height: .31, lean: .12 },
  ], { grass: material, puddle: material });
  const root = parent.children.find(node => node !== outsider);
  function watch() {
    const counts = new Map();
    for (const node of root.children) for (const resource of [node.geometry, ...(node.isInstancedMesh ? [node] : [])]) {
      if (counts.has(resource)) continue;
      counts.set(resource, 0); resource.addEventListener("dispose", () => counts.set(resource, counts.get(resource) + 1));
    }
    return counts;
  }
  const originalNodes = [...root.children], instanced = watch();
  batches.setOptimized(true); assert.deepEqual(root.children, originalNodes, "unchanged setting does no rebuild");
  batches.setOptimized(false); assert.ok([...instanced.values()].every(count => count === 1));
  const individual = watch(); batches.setOptimized(true);
  assert.ok([...individual.values()].every(count => count === 1));
  const final = watch(); batches.dispose(); batches.dispose(); batches.setOptimized(false);
  assert.ok([...final.values()].every(count => count === 1));
  assert.deepEqual(parent.children, [outsider]); assert.equal(externalDisposals, 0);
  assert.equal(batches.getStats().objects, 0);
  outsiderGeometry.dispose(); material.dispose(); texture.dispose();
});

test("original alley/yard/kai decoration batches reduce potential draw calls without replacing map objects or saves", () => {
  const keys = ["window", "document", "localStorage", "CustomEvent"];
  const globals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const data = new Map([["420mon-progress-v1", JSON.stringify({ gold: 150, map: "capsule", x: 162, y: 110 })]]);
  const context = new Proxy({}, { get: (_, name) => name === "createRadialGradient" ? () => ({ addColorStop() {} })
    : name === "createImageData" ? (width, height) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }) : () => {} });
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  globalThis.document = { body: { classList: { contains: () => false } },
    createElement: tag => tag === "canvas" ? { width: 0, height: 0, getContext: () => context } : { dataset: {}, setAttribute() {} },
    querySelector: selector => selector === "#app" ? { append() {} } : null };
  globalThis.window = { addEventListener() {}, dispatchEvent() { return true; } };
  globalThis.CustomEvent = class extends Event { constructor(type, options) { super(type); this.detail = options?.detail; } };
  try {
    const player = new THREE.Group(), world = createDistrictWorld(new THREE.Scene(), player), rows = [];
    assert.equal(world.getPerformanceStats().objects, 0, "dry Kapsel has no decoration draws");
    for (const id of ["alley", "yard", "kai"]) {
      world.travel(id);
      const root = world.getRoot(), decorations = root.getObjectByName("static-district-decorations");
      const optimized = renderedShapes(decorations), stats = world.getPerformanceStats();
      const grassCount = id === "kai" ? 0 : mapSketch(id).extras.reduce((count, { r }) => count + Math.min(55, Math.round(r.w * r.h / 1000)), 0);
      assert.equal(stats.objects, grassCount + 32, `${id}: all original grass and puddles retained`);
      assert.equal(stats.optimizedDraws, decorations.children.length);
      assert.ok(stats.optimizedDraws < stats.baselineDraws, `${id}: draw submissions should decrease`);
      const objects = root.children.filter(node => node !== decorations), occluders = [...world.getOccluders()];
      const saved = [...data], position = player.position.clone();
      const mapDefinition = JSON.stringify(MAPS[id]);
      const sourcePoint = world.toWorld(MAPS[id].w / 2, MAPS[id].h / 2);
      const collision = world.collides(sourcePoint.x, sourcePoint.z);
      world.setPerformanceMode(false);
      assert.equal(world.getPerformanceStats().activeDraws, stats.objects);
      equivalent(optimized, renderedShapes(decorations));
      assert.deepEqual(root.children.filter(node => node !== decorations), objects, "NPCs, buildings and interactive groups retain identity");
      assert.deepEqual(world.getOccluders(), occluders); assert.deepEqual([...data], saved);
      assert.deepEqual(player.position, position); assert.equal(JSON.stringify(MAPS[id]), mapDefinition);
      assert.equal(world.collides(sourcePoint.x, sourcePoint.z), collision);
      world.setPerformanceMode(true);
      rows.push(`${id}: ${stats.baselineDraws} -> ${stats.optimizedDraws}`);
    }
    world.setPerformanceMode(false); world.travel("yard");
    assert.equal(world.getPerformanceStats().optimized, false, "A/B mode survives a district transition");
    const oldDecoration = world.getRoot().getObjectByName("static-district-decorations");
    const oldGeometries = oldDecoration.children.map(node => node.geometry);
    let disposed = 0; for (const geometry of oldGeometries) geometry.addEventListener("dispose", () => disposed++);
    world.travel("capsule");
    assert.equal(disposed, oldGeometries.length); assert.equal(oldDecoration.parent, null);
    assert.equal(world.getPerformanceStats().objects, 0);
    console.info(`Static decoration main-pass draw submissions before culling (Node geometry counts, NOT FPS): ${rows.join("; ")}`);
  } finally {
    for (const key of keys) { if (globals[key]) Object.defineProperty(globalThis, key, globals[key]); else delete globalThis[key]; }
  }
});
