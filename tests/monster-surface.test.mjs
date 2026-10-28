import assert from "node:assert/strict";
import { test, after } from "node:test";
import * as THREE from "three";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
const { createMonsterSurface, monsterStudioSurfaceSize } = await server.ssrLoadModule("/src/game/monster-surface.ts");

function compile(material) {
  const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader };
  material.onBeforeCompile(shader, null);
  return shader;
}
function watch(resources) {
  const counts = new Map([...new Set(resources)].map(resource => [resource, 0]));
  for (const resource of counts.keys()) resource.addEventListener("dispose", () => counts.set(resource, counts.get(resource) + 1));
  return expected => { for (const count of counts.values()) assert.equal(count, expected); };
}

test("studio texture resolution respects device memory, touch and actual GPU limits", () => {
  assert.equal(monsterStudioSurfaceSize(16384, 8, false), 4096);
  assert.equal(monsterStudioSurfaceSize(16384, 4, false), 2048);
  assert.equal(monsterStudioSurfaceSize(16384, undefined, false), 2048);
  assert.equal(monsterStudioSurfaceSize(16384, 8, true), 1024);
  assert.equal(monsterStudioSurfaceSize(16384, 2, false), 1024);
  assert.equal(monsterStudioSurfaceSize(2048, 8, false), 2048);
  assert.equal(monsterStudioSurfaceSize(512, 8, false), 512);
  assert.equal(monsterStudioSurfaceSize(NaN, 8, false), 1024);
});

test("one actual 4K packed normal/roughness map is shared by studio materials and disposed once", () => {
  const surface = createMonsterSurface(4096, { studio: true, anisotropy: 16 });
  try {
    assert.equal(surface.textureSize, 4096);
    assert.strictEqual(surface.normalMap, surface.roughnessMap);
    const texture = surface.normalMap, { data, width, height } = texture.image;
    assert.equal(width, 4096); assert.equal(height, 4096);
    assert.equal(data.byteLength, 4096 * 4096 * 4, "one 64-MiB source, not duplicate 4K maps");
    assert.equal(texture.generateMipmaps, true);
    assert.equal(texture.minFilter, THREE.LinearMipmapLinearFilter);
    assert.equal(texture.magFilter, THREE.LinearFilter);
    assert.equal(texture.anisotropy, 8);
    assert.equal(texture.wrapS, THREE.RepeatWrapping);
    assert.equal(texture.colorSpace, THREE.NoColorSpace);
    const normals = new Set(), roughness = new Set();
    for (let i = 0; i < data.length; i += 4 * 7919) {
      normals.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      roughness.add(data[i + 3]);
      assert.ok(data[i + 2] >= 220, "normal points out from the smooth surface");
      assert.ok(data[i + 3] >= 160 && data[i + 3] <= 225);
    }
    assert.ok(normals.size > 8 && roughness.size > 8, "real high-resolution signal in both channels");
    for (const material of [surface.material, surface.metal, surface.wet, surface.glow]) {
      assert.strictEqual(material.normalMap, texture); assert.strictEqual(material.roughnessMap, texture);
      assert.equal(material.flatShading, false); assert.equal(material.vertexColors, true);
      const shader = compile(material);
      assert.ok(shader.fragmentShader.includes("texture2D(roughnessMap, vRoughnessMapUv).a"), "roughness reads packed alpha, not normal green");
    }
    const shader = compile(surface.glow);
    assert.ok(shader.vertexShader.includes("vMonsterGlow = clamp(glowWeight"));
    assert.ok(shader.fragmentShader.includes("diffuseColor.rgb * vMonsterGlow * 1.7"));
  } finally {
    const released = watch([surface.material, surface.metal, surface.wet, surface.glow, surface.normalMap]);
    surface.dispose(); surface.dispose(); released(1);
  }
});

test("small studio tiles are deterministic and the existing world material path retains separate maps", () => {
  const a = createMonsterSurface(32, { studio: true }), b = createMonsterSurface(32, { studio: true }), world = createMonsterSurface(32);
  try {
    assert.deepEqual(a.normalMap.image.data, b.normalMap.image.data);
    assert.notStrictEqual(world.normalMap, world.roughnessMap);
    assert.equal(world.material.name, "original-monster-pbr");
    assert.equal(world.material.roughness, .88); assert.equal(world.metal.metalness, .62);
    assert.equal(world.wet.roughness, .48);
    assert.ok(compile(world.material).fragmentShader.includes("#include <roughnessmap_fragment>"));
    assert.equal(world.normalMap.image.width, 32);
  } finally { a.dispose(); b.dispose(); world.dispose(); }
  assert.throws(() => createMonsterSurface(8192), /Texturgröße/);
});

test("viewer surface ownership survives concurrent world art and closing before async model attachment", async () => {
  const originalLoad = THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load = function (_url, onLoad) {
    const texture = new THREE.Texture(); queueMicrotask(() => onLoad?.(texture)); return texture;
  };
  let studio, world, late;
  const surface = createMonsterSurface(32, { studio: true });
  const released = watch([surface.material, surface.metal, surface.wet, surface.glow, surface.normalMap]);
  try {
    const art = await server.ssrLoadModule("/src/game/monster-art.ts");
    studio = art.createMonsterArt("mon_budling", 0x56ead0, { surface });
    world = art.createMonsterArt("mon_budling");
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(studio.userData.modelStatus, "ready");
    assert.equal(studio.userData.surfaceTextureSize, 32);
    const studioMesh = studio.children[0].children[0], worldMesh = world.children[0].children[0];
    assert.strictEqual(studioMesh.geometry, worldMesh.geometry, "geometry cache remains shared");
    assert.strictEqual(studioMesh.material, surface.material);
    assert.notStrictEqual(worldMesh.material, surface.material, "studio maps never replace live world material");
    art.disposeMonsterArt(studio); art.disposeMonsterArt(world); released(0);
    late = art.createMonsterArt("mon_budling", 0x56ead0, { surface });
    art.disposeMonsterArt(late); surface.dispose(); released(1);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(late.children[0].children.length, 0, "no late mesh binds the disposed studio surface");
    assert.equal(late.userData.modelStatus, "disposed");
  } finally {
    THREE.TextureLoader.prototype.load = originalLoad;
    const art = await server.ssrLoadModule("/src/game/monster-art.ts");
    for (const item of [studio, world, late]) if (item) art.disposeMonsterArt(item);
    surface.dispose();
  }
});
