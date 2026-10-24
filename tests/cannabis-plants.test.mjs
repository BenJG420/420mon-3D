import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export * from "./src/game/cannabis-plants.ts"; export * as THREE from "three";`,
    resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { THREE, createCannabisLibrary, cannabisGrowthScale } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`,
);
const part = (plant, name) => plant.root.getObjectByName(`cannabis-${name}`);
const watch = resources => {
  const counts = new Map([...new Set(resources)].map(resource => [resource, 0]));
  for (const resource of counts.keys()) resource.addEventListener("dispose", () => counts.set(resource, counts.get(resource) + 1));
  return counts;
};

test("cannabis stages have distinct anatomy, bounded real geometry and continuous growth height", () => {
  const library = createCannabisLibrary(), plant = library.create();
  const heights = {};
  try {
    assert.equal(plant.root.children.length, 0);
    let seedlingLeaves;
    for (const stage of ["sprout", "grow", "bloom", "ready"]) {
      plant.setStage(stage);
      assert.equal(plant.root.userData.growthStage, stage);
      const meshes = plant.root.children;
      assert.ok(meshes.length > 0 && meshes.length <= 5, "one bounded submission per botanical part");
      let triangles = 0;
      for (const mesh of meshes) {
        assert.ok(mesh.isInstancedMesh && mesh.count > 0);
        assert.ok([...mesh.instanceMatrix.array].every(Number.isFinite));
        for (const attribute of ["position", "normal", "uv"])
          assert.ok([...mesh.geometry.getAttribute(attribute).array].every(Number.isFinite), `${stage}/${mesh.name}: finite ${attribute}`);
        assert.ok(mesh.boundingBox && mesh.boundingSphere && Number.isFinite(mesh.boundingSphere.radius));
        assert.equal(mesh.castShadow, mesh.name === "cannabis-stems", "dense foliage does not multiply shadow submissions");
        triangles += mesh.geometry.index.count / 3 * mesh.count;
      }
      assert.ok(triangles < 30000, `${stage}: submitted triangles remain bounded (${triangles})`);
      const bounds = new THREE.Box3().setFromObject(plant.root);
      heights[stage] = bounds.max.y;
      assert.ok(bounds.min.y >= -.03 && bounds.max.y < 1.7);
      assert.ok(bounds.max.x - bounds.min.x < 1.5 && bounds.max.z - bounds.min.z < 1.5);
      const leaves = part(plant, "fan-leaves");
      if (stage === "sprout") {
        assert.equal(part(plant, "cotyledons").count, 2, "seedlings begin with paired oval cotyledons");
        seedlingLeaves = leaves.count;
        assert.equal(part(plant, "buds"), undefined);
      } else {
        assert.equal(part(plant, "cotyledons"), undefined);
        assert.ok(leaves.count > seedlingLeaves * 5, "grown plants have branched multi-finger fan leaves");
        assert.equal(!!part(plant, "buds"), stage !== "grow");
        assert.equal(!!part(plant, "pistils"), stage !== "grow");
      }
      const position = leaves.geometry.getAttribute("position");
      assert.ok(position.getY(12 * 3 + 1) > position.getY(12 * 3), "leaf blade is curved around the raised midrib");
      assert.ok(Math.abs(position.getX(11 * 3)) < Math.abs(position.getX(10 * 3)), "leaf outline has real serration");
      assert.ok(part(plant, "leaf-veins").count === leaves.count);
    }
    plant.setStage("bloom");
    const bloom = part(plant, "buds"), bloomBounds = bloom.boundingBox.clone(), bloomPistil = part(plant, "pistils").material;
    plant.setStage("ready");
    const ripe = part(plant, "buds");
    assert.ok(ripe.boundingBox.max.y > bloomBounds.max.y, "ripe colas gain volume instead of only changing the label");
    assert.notEqual(part(plant, "pistils").material.color.getHex(), bloomPistil.color.getHex(), "ripe pistils turn amber");
    const before = heights.sprout * cannabisGrowthScale("sprout", .33);
    const after = heights.grow * cannabisGrowthScale("grow", .33);
    assert.ok(Math.abs(before - after) < .05, "switching to the branched model does not shrink a growing seedling");
    for (const stage of ["sprout", "grow", "bloom", "ready"]) {
      const scales = [-1, 0, .33, .66, 1, 2].map(progress => cannabisGrowthScale(stage, progress));
      assert.ok(scales.every(value => Number.isFinite(value) && value > 0 && value <= 1.11));
      assert.ok(scales.every((value, index) => index === 0 || value >= scales[index - 1]));
      assert.ok(Number.isFinite(cannabisGrowthScale(stage, NaN)));
    }
    plant.setStage("empty"); assert.equal(plant.root.children.length, 0);
    assert.equal(cannabisGrowthScale("empty", .8), 0);
  } finally { library.dispose(); }
});

test("stage changes and map rebuilds release only instance buffers while shared assets survive", () => {
  const library = createCannabisLibrary(), first = library.create(), second = library.create();
  const assets = new Set();
  for (const stage of ["sprout", "grow", "bloom", "ready"]) {
    first.setStage(stage);
    for (const mesh of first.root.children) { assets.add(mesh.geometry); assets.add(mesh.material); }
  }
  const shared = watch(assets);
  first.setStage("grow"); second.setStage("grow");
  for (const mesh of first.root.children) {
    const other = second.root.getObjectByName(mesh.name);
    assert.strictEqual(mesh.geometry, other.geometry); assert.strictEqual(mesh.material, other.material);
  }
  const original = [...first.root.children], instances = watch(original);
  first.setStage("grow");
  assert.deepEqual(first.root.children, original, "ordinary frames do not rebuild geometry or instance buffers");
  first.setStage("bloom");
  assert.ok([...instances.values()].every(count => count === 1));
  assert.ok([...shared.values()].every(count => count === 0));
  first.dispose(); first.dispose();
  assert.equal(first.root.children.length, 0); assert.ok(second.root.children.length > 0);
  const survivor = [...second.root.children];
  const remainingInstances = watch(survivor);
  const replacement = library.create(); replacement.setStage("ready");
  assert.strictEqual(part(replacement, "fan-leaves").geometry, part(second, "fan-leaves").geometry);
  library.dispose(); library.dispose();
  assert.ok([...remainingInstances.values()].every(count => count === 1));
  assert.ok([...shared.values()].every(count => count === 1), "application-lifetime assets dispose exactly once");
  assert.equal(second.root.children.length, 0); assert.equal(replacement.root.children.length, 0);
  assert.throws(() => library.create(), /disposed/);
});
