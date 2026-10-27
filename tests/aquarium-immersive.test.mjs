import assert from "node:assert/strict";
import { test, after } from "node:test";
import * as THREE from "three";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
const { FISH } = await server.ssrLoadModule("/src/game/data/fish.ts");
const { createAquariumFish } = await server.ssrLoadModule("/src/game/aquarium-fish.ts");
const { createAquariumHabitat } = await server.ssrLoadModule("/src/game/aquarium-habitat.ts");
const { createAquariumSchool, aquariumCollectionKey } = await server.ssrLoadModule("/src/game/aquarium-school.ts");
const { createAquariumCamera } = await server.ssrLoadModule("/src/game/aquarium-camera.ts");

function meshes(root) {
  const result = [];
  root.traverse(object => { if (object.isMesh) result.push(object); });
  return result;
}
const triangles = root => meshes(root).reduce((sum, mesh) => sum + (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3, 0);
function finite(attribute) {
  assert.ok(attribute && attribute.count > 0);
  for (const value of attribute.array) assert.ok(Number.isFinite(value));
}
function disposalWatcher(root) {
  const resources = new Set();
  for (const mesh of meshes(root)) {
    resources.add(mesh.geometry);
    if (mesh.isInstancedMesh) resources.add(mesh);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      resources.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
    }
  }
  const counts = new Map([...resources].map(resource => [resource, 0]));
  for (const resource of resources) resource.addEventListener("dispose", () => counts.set(resource, counts.get(resource) + 1));
  return () => { for (const count of counts.values()) assert.equal(count, 1); };
}
function projectedWidth(object, camera) {
  object.updateWorldMatrix(true, true);
  let min = Infinity, max = -Infinity;
  const point = new THREE.Vector3();
  for (const mesh of meshes(object)) {
    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).project(camera);
      min = Math.min(min, point.x); max = Math.max(max, point.x);
    }
  }
  return (max - min) / 2;
}

// Projection math verifies framing, not GPU appearance or perceived realism.
test("close camera makes the selected 3D fish prominent and fills portrait/desktop with water", () => {
  const immersive = createAquariumSchool({ [FISH[0].id]: 1 }, { immersive: true });
  const oldSchool = createAquariumSchool({ [FISH[0].id]: 1 });
  try {
    for (const [width, height] of [[360, 560], [1100, 620]]) {
      const camera = new THREE.PerspectiveCamera(), rig = createAquariumCamera(camera);
      rig.resize(width, height); rig.update(0, immersive.root.children[0].position);
      const fraction = projectedWidth(immersive.root, camera);
      assert.ok(fraction >= .15 && fraction < .8, `${width}: fish occupies ${(fraction * 100).toFixed(1)}% width`);
      const oldCamera = new THREE.PerspectiveCamera(38, width / height, .1, 100);
      oldCamera.position.set(0, 3.2, Math.max(8.6, 5.65 / (Math.tan(THREE.MathUtils.degToRad(19)) * oldCamera.aspect)) + 2);
      oldCamera.lookAt(0, 1.95, 0); oldCamera.updateMatrixWorld();
      assert.ok(fraction > projectedWidth(oldSchool.root, oldCamera) * 1.7, "larger actual projection, not merely a bigger CSS frame");
      const left = new THREE.Vector3(-5, 2, 2.025).project(camera), right = new THREE.Vector3(5, 2, 2.025).project(camera);
      assert.ok(left.x < -1 && right.x > 1, "front glass spans the canvas instead of showing a small box");
      assert.ok(camera.position.z > 2.06 && camera.position.z < 5.5, "camera is just outside the glass");
    }
  } finally { immersive.dispose(); oldSchool.dispose(); }
});

test("selected fish stays visible through turns; drag and overview preserve bounded camera motion", () => {
  const school = createAquariumSchool({ [FISH[0].id]: 1 }, { immersive: true });
  try {
    for (const time of [0, 7.5, 19, 34]) {
      school.update(time);
      const camera = new THREE.PerspectiveCamera(), rig = createAquariumCamera(camera);
      rig.resize(360, 560); rig.update(0, school.root.children[0].position);
      const center = school.root.children[0].position.clone().project(camera);
      assert.ok(Math.abs(center.x) < .35 && Math.abs(center.y) < .35 && Math.abs(center.z) < 1);
      rig.pan(100, -100);
      for (let i = 0; i < 30; i++) rig.update(.1, school.root.children[0].position);
      assert.ok(Math.abs(camera.position.x) <= 2.91 && camera.position.y >= 1.79 && camera.position.y <= 2.81 && camera.position.z > 2.06);
      rig.reset(); rig.setOverview(true);
      for (let i = 0; i < 30; i++) rig.update(.1, school.root.children[0].position);
      assert.ok(camera.position.z > 10, "overview intentionally fits the entire tank");
      rig.setOverview(false);
      for (let i = 0; i < 30; i++) rig.update(.1, school.root.children[0].position);
      assert.ok(camera.position.z > 4.79 && camera.position.z < 4.82, "near view is restored");
    }
  } finally { school.dispose(); }
});

test("detailed fish add bounded 3D detail while sharing shader programs and leaving default quality intact", () => {
  const programs = new Map();
  for (const fish of [FISH[0], ...["kippenaal", "schlickbutt", "kabelwels", "schrotthai", "vialstoer", "pinkflosse"].map(id => FISH.find(fish => fish.id === `fish_${id}`))]) {
    const index = FISH.indexOf(fish), detailed = createAquariumFish(fish, index, { detailed: true }), normal = createAquariumFish(fish, index);
    const released = disposalWatcher(detailed.root);
    assert.equal(meshes(detailed.root).length, 3);
    assert.ok(triangles(detailed.root) > triangles(normal.root));
    assert.ok(triangles(detailed.root) <= 12000, `${fish.id}: ${triangles(detailed.root)} triangles`);
    assert.equal(normal.root.userData.detailed, false);
    assert.equal(detailed.root.userData.detailed, true);
    for (const mesh of meshes(detailed.root)) {
      finite(mesh.geometry.attributes.position); finite(mesh.geometry.attributes.normal); finite(mesh.geometry.attributes.uv);
      assert.equal(mesh.castShadow, false);
      const shader = { vertexShader: THREE.ShaderLib.physical.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader, uniforms: {} };
      mesh.material.onBeforeCompile(shader, null);
      const key = mesh.material.customProgramCacheKey(), source = shader.vertexShader + shader.fragmentShader;
      if (programs.has(key)) assert.equal(programs.get(key), source);
      programs.set(key, source);
      detailed.update(3);
      assert.equal(shader.uniforms.aquariumTime.value, 3);
    }
    assert.ok(meshes(detailed.root)[0].geometry.attributes.normal.getY(24 * 33) > .5, "body dorsal normal faces out");
    detailed.dispose(); detailed.dispose(); released(); normal.dispose();
  }
  assert.equal(programs.size, 3);
});

test("immersive scenery has depth layers and owned resources while compact room tank stays unchanged", () => {
  const immersive = createAquariumHabitat({ immersive: true }), compact = createAquariumHabitat({ compact: true });
  const both = createAquariumHabitat({ compact: true, immersive: true });
  const released = disposalWatcher(immersive.root);
  try {
    assert.ok(meshes(immersive.root).length <= 40);
    assert.ok(immersive.root.getObjectByName("aquarium-rear-rock-relief")?.isInstancedMesh);
    assert.ok(immersive.root.getObjectByName("aquarium-foreground-rosettes")?.isInstancedMesh);
    assert.ok(immersive.root.getObjectByName("aquarium-light-shafts")?.isMesh);
    const signature = habitat => meshes(habitat.root).map(mesh => [mesh.name, mesh.count ?? 1, mesh.geometry.attributes.position.count]);
    assert.deepEqual(signature(both), signature(compact), "immersive is ignored for the existing room variant");
    assert.equal(compact.root.getObjectByName("aquarium-light-shafts"), undefined);
    immersive.root.traverse(object => assert.ok(!object.isLight && !object.castShadow));
    immersive.update(12);
    for (const mesh of meshes(immersive.root)) {
      finite(mesh.geometry.attributes.position);
      if (mesh.isInstancedMesh) finite(mesh.instanceMatrix);
    }
    assert.equal(immersive.root.getObjectByName("aquarium-glass").material.depthWrite, false);
  } finally { immersive.dispose(); immersive.dispose(); released(); compact.dispose(); both.dispose(); }
});

test("collection view key changes only when visible species change, avoiding autosave camera resets", () => {
  const caught = { [FISH[0].id]: 1, [FISH[1].id]: 0, invalid: 8 };
  const before = structuredClone(caught), key = aquariumCollectionKey(caught);
  assert.equal(aquariumCollectionKey({ ...caught, [FISH[0].id]: 20, invalid: 0 }), key);
  assert.notEqual(aquariumCollectionKey({ ...caught, [FISH[1].id]: 1 }), key);
  assert.equal(aquariumCollectionKey({ [FISH[0].id]: "1", [FISH[1].id]: NaN }), "");
  assert.deepEqual(caught, before);
});
