import assert from "node:assert/strict";
import { test, after } from "node:test";
import * as THREE from "three";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.window = new EventTarget();
const { FISH } = await server.ssrLoadModule("/src/game/data/fish.ts");
const { createAquariumFish, aquariumFishForm } = await server.ssrLoadModule("/src/game/aquarium-fish.ts");
const { createAquariumHabitat } = await server.ssrLoadModule("/src/game/aquarium-habitat.ts");
const { createAquariumSchool } = await server.ssrLoadModule("/src/game/aquarium-school.ts");

const meshes = root => {
  const result = [];
  root.traverse(object => { if (object.isMesh) result.push(object); });
  return result;
};
const renderables = root => {
  const result = [];
  root.traverse(object => { if (object.geometry && object.material) result.push(object); });
  return result;
};
const materialList = root => [...new Set(renderables(root).flatMap(mesh => Array.isArray(mesh.material) ? mesh.material : [mesh.material]))];
function finiteAttribute(attribute, label) {
  assert.ok(attribute && attribute.count > 0, `${label} exists`);
  for (const value of attribute.array) assert.ok(Number.isFinite(value), `${label} has finite coordinates`);
}
function watchDisposal(root) {
  const resources = new Set();
  for (const mesh of renderables(root)) {
    resources.add(mesh.geometry);
    if (mesh.isInstancedMesh) resources.add(mesh);
  }
  for (const material of materialList(root)) {
    resources.add(material);
    for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
    for (const uniform of Object.values(material.uniforms ?? {})) if (uniform?.value?.isTexture) resources.add(uniform.value);
  }
  const counts = new Map([...resources].map(resource => [resource, 0]));
  for (const resource of resources) resource.addEventListener("dispose", () => counts.set(resource, counts.get(resource) + 1));
  return () => {
    assert.ok(resources.size > 0);
    for (const [resource, count] of counts) assert.equal(count, 1, `${resource.type ?? resource.constructor.name} released once`);
  };
}

test("all original aquarium species have finite smooth 3D fish geometry within the per-fish budget", () => {
  assert.equal(FISH.length, 42);
  const original = structuredClone(FISH);
  const forms = new Set(), programs = new Map();
  for (const [index, fish] of FISH.entries()) {
    const model = createAquariumFish(fish, index);
    const bodies = meshes(model.root);
    forms.add(aquariumFishForm(fish));
    // The first geometry begins with the ring body: dorsal normals must face out.
    assert.ok(bodies[0].geometry.attributes.normal.getY(16 * 25) > .5, fish.id);
    for (const material of materialList(model.root)) {
      const shader = { vertexShader: THREE.ShaderLib.physical.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader, uniforms: {} };
      material.onBeforeCompile(shader, null);
      const key = material.customProgramCacheKey();
      const source = shader.vertexShader + shader.fragmentShader;
      if (programs.has(key)) assert.equal(source, programs.get(key), "shared shader keys have identical code");
      programs.set(key, source);
      assert.ok(shader.vertexShader.includes("transformed.z += aquariumBend"));
      assert.ok(shader.vertexShader.includes("objectNormal.x -= aquariumBend"));
      model.update(2.5);
      assert.equal(shader.uniforms.aquariumTime.value, 2.5);
    }
    assert.ok(bodies.length >= 2 && bodies.length <= 5, fish.id);
    let triangles = 0;
    model.root.traverse(object => assert.ok(!object.isSprite, `${fish.id}: genuine volume, no sprite`));
    for (const body of bodies) {
      finiteAttribute(body.geometry.attributes.position, `${fish.id} position`);
      finiteAttribute(body.geometry.attributes.normal, `${fish.id} normal`);
      finiteAttribute(body.geometry.attributes.uv, `${fish.id} UV`);
      triangles += (body.geometry.index?.count ?? body.geometry.attributes.position.count) / 3;
      assert.equal(body.castShadow, false, "aquarium adds no shadow pass");
    }
    const bounds = new THREE.Box3().setFromObject(model.root, true);
    const size = bounds.getSize(new THREE.Vector3());
    assert.ok(size.x > .3 && size.x <= 1.35, `${fish.id}: length ${size.x}`);
    assert.ok(size.y > .03 && size.y <= .8, `${fish.id}: height ${size.y}`);
    assert.ok(size.z > .03 && size.z <= .8, `${fish.id}: depth ${size.z}`);
    assert.ok(triangles <= 7000, `${fish.id}: ${triangles} triangles`);
    assert.ok(materialList(model.root).every(material => material.isMeshStandardMaterial), "lit PBR materials");
    model.update(1.5);
    model.dispose();
  }
  assert.equal(forms.size, 10, "species-informed carp, eel, shark, flatfish and other anatomies");
  assert.equal(programs.size, 3, "no per-species shader compilation explosion");
  assert.deepEqual(FISH, original, "catalogue and fishing definitions remain unchanged");
});

test("school selection is read-only and shows each caught species once, including empty and full collections", () => {
  const cases = [
    [{}, []],
    [{ [FISH[0].id]: 99, unknown_fish: 2, [FISH[1].id]: 0, [FISH[2].id]: -2, [FISH[3].id]: "1", [FISH[4].id]: NaN, [FISH[5].id]: Infinity }, [FISH[0].id]],
    [Object.fromEntries(FISH.map(fish => [fish.id, 4])), FISH.map(fish => fish.id)],
  ];
  for (const [caught, expected] of cases) {
    const original = structuredClone(caught);
    const school = createAquariumSchool(caught);
    assert.deepEqual(school.species.map(fish => fish.id), expected);
    assert.equal(school.root.children.length, expected.length);
    school.update(12);
    assert.deepEqual(caught, original);
    school.dispose();
  }
});

test("all swimmers stay inside the water and turn continuously along deterministic paths", () => {
  const school = createAquariumSchool(Object.fromEntries(FISH.map(fish => [fish.id, 1])));
  for (const time of [0, 7.3, 19.9, 53.2, 121.7]) {
    school.update(time);
    const poses = school.root.children.map(fish => ({ position: fish.position.clone(), rotation: fish.quaternion.clone() }));
    for (const fish of school.root.children) {
      const { x, y, z } = fish.position;
      assert.ok(Number.isFinite(x + y + z));
      assert.ok(Math.abs(x) < 4.5 && y > .4 && y < 3.6 && Math.abs(z) < 1.5, "swim centers leave space for anatomy inside the tank");
    }
    school.update(time + 1 / 30);
    for (const [index, fish] of school.root.children.entries()) {
      assert.ok(fish.position.distanceTo(poses[index].position) < .12, "no teleport at a turn");
      assert.ok(fish.quaternion.angleTo(poses[index].rotation) < .2, "no mirrored 180-degree snap");
    }
    school.update(time);
    for (const [index, fish] of school.root.children.entries()) {
      assert.ok(fish.position.distanceTo(poses[index].position) < 1e-10);
      assert.ok(fish.quaternion.angleTo(poses[index].rotation) < 1e-7);
    }
  }
  school.dispose();
});

test("habitat has bounded instanced planting and gravel with a cheaper non-transmissive world variant", () => {
  const full = createAquariumHabitat();
  const compact = createAquariumHabitat({ compact: true });
  for (const habitat of [full, compact]) {
    const all = renderables(habitat.root);
    assert.ok(all.length <= 30, `${all.length} habitat draws`);
    assert.ok(all.filter(mesh => mesh.isInstancedMesh).length >= 3, "plants, gravel and atmosphere are batched");
    habitat.root.traverse(object => { assert.ok(!object.isLight, "scene owns lights"); assert.equal(object.castShadow, false); });
    for (const mesh of all) finiteAttribute(mesh.geometry.attributes.position, `${mesh.name} geometry`);
    habitat.update(12);
    for (const mesh of all.filter(mesh => mesh.isInstancedMesh)) finiteAttribute(mesh.instanceMatrix, `${mesh.name} instance transform`);
  }
  const glass = materialList(full.root).find(material => material.transmission > .5);
  assert.ok(glass, "close view has physical glass transmission");
  assert.equal(glass.depthWrite, false, "glass must not depth-occlude transparent bubbles and surface");
  assert.ok(materialList(compact.root).every(material => !(material.transmission > 0)), "world tank avoids a transmission render target");
  const count = habitat => meshes(habitat.root).filter(mesh => mesh.isInstancedMesh).reduce((sum, mesh) => sum + mesh.count, 0);
  assert.ok(count(compact) < count(full), "compact world tank uses fewer instances");
  full.dispose(); compact.dispose();
});

test("closing or replacing aquarium content releases each owned GPU resource exactly once", () => {
  for (const item of [createAquariumFish(FISH[0], 0), createAquariumSchool({ [FISH[4].id]: 1 }), createAquariumHabitat(), createAquariumHabitat({ compact: true })]) {
    const assertDisposed = watchDisposal(item.root);
    const parent = new THREE.Group(); parent.add(item.root);
    item.update(2);
    item.dispose(); item.dispose();
    assertDisposed();
    assert.equal(item.root.parent, null);
  }
});


test("room tank reuses the 3D habitat, rebuilds for catches/map travel and preserves save state", async () => {
  const { createFishingWorld } = await server.ssrLoadModule("/src/game/fish-art.ts");
  const { getSave } = await server.ssrLoadModule("/src/game/save.ts");
  const { MAPS } = await server.ssrLoadModule("/src/game/data/maps.ts");
  const state = getSave(), oldCaught = state.fishCaught;
  state.fishCaught = { [FISH[0].id]: 2 };
  const before = structuredClone(state);
  let id = "capsule", sceneRoot = new THREE.Group();
  const world = {
    current: () => id, getRoot: () => sceneRoot,
    getMapInfo: () => ({ map: MAPS[id], scale: .06 }),
    toWorld: (x,y) => new THREE.Vector3(x*.06,0,y*.06),
  };
  const renderer = createFishingWorld(world);
  try {
    renderer.update(.05);
    const tank = sceneRoot.getObjectByName("capsule-aquarium");
    assert.ok(tank);
    assert.equal(tank.getObjectByName("aquarium-school").children.length, 1);
    assert.ok(materialList(tank).every(material => !(material.transmission > 0)));
    const released = watchDisposal(tank);
    state.fishCaught[FISH[1].id] = 1;
    renderer.update(.05); released();
    assert.equal(sceneRoot.getObjectByName("aquarium-school").children.length, 2);
    delete state.fishCaught[FISH[1].id];
    const releasedOnTravel = watchDisposal(sceneRoot.getObjectByName("capsule-aquarium"));
    id = "alley"; sceneRoot = new THREE.Group(); renderer.update(.05); releasedOnTravel();
    assert.equal(sceneRoot.getObjectByName("aquarium-school"), undefined);
    assert.deepEqual(state, before, "view creates no save fields or reward changes");
  } finally { renderer.dispose(); state.fishCaught = oldCaught; }
});
