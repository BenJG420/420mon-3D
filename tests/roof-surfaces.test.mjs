import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: 'export * from "./src/game/world-surfaces.ts"; export * as THREE from "three";', resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { createWorldSurfaces, projectSurfaceUvs, THREE } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`,
);

function canvasEnvironment(run) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
  const canvases = [];
  globalThis.document = { createElement(tag) {
    assert.equal(tag, "canvas");
    const canvas = { width: 0, height: 0, pixels: null };
    const context = {
      createImageData: (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
      putImageData(image) { canvas.pixels = image.data.slice(); },
    };
    canvas.getContext = () => context; canvases.push(canvas); return canvas;
  } };
  try { return run(canvases); }
  finally { if (descriptor) Object.defineProperty(globalThis, "document", descriptor); else delete globalThis.document; }
}
const pixels = texture => texture.image.pixels ?? texture.image.data;
const hash = texture => createHash("sha256").update(pixels(texture)).digest("hex");
const channel = (texture, x, y, c = 0) => pixels(texture)[(y * texture.image.width + x) * 4 + c];

test("roof ceramic/standing metal seams/rolled felt have their own deterministic PBR data, distinct from ground", () => canvasEnvironment(() => {
  const first = createWorldSurfaces(), second = createWorldSurfaces();
  const kinds = ["stone", "wood", "plaster", "metal", "asphalt", "roof-tile", "roof-metal", "roof-felt"];
  const materials = Object.fromEntries(kinds.map(kind => [kind, first.material(0xffffff, kind)]));
  for (const slot of ["map", "roughnessMap", "normalMap"]) {
    assert.equal(new Set(kinds.map(kind => hash(materials[kind][slot]))).size, kinds.length, `${slot}: roof and floor patterns must be distinct`);
  }
  for (const kind of kinds) {
    const material = materials[kind], repeated = second.material(0xffffff, kind);
    for (const slot of ["map", "roughnessMap", "normalMap"]) {
      const texture = material[slot];
      assert.equal(hash(texture), hash(repeated[slot]), `${kind}/${slot}: deterministic on reload`);
      assert.equal(texture.image.width, 256); assert.equal(texture.image.height, 256);
      assert.equal(texture.wrapS, THREE.RepeatWrapping); assert.equal(texture.wrapT, THREE.RepeatWrapping);
      assert.equal(texture.minFilter, THREE.LinearMipmapLinearFilter);
      assert.equal(texture.magFilter, THREE.LinearFilter); assert.equal(texture.generateMipmaps, true);
    }
    assert.equal(material.map.colorSpace, THREE.SRGBColorSpace);
    assert.equal(material.roughnessMap.colorSpace, THREE.NoColorSpace);
    assert.equal(material.normalMap.colorSpace, THREE.NoColorSpace);
  }
  const ceramic = materials["roof-tile"], metal = materials["roof-metal"], felt = materials["roof-felt"];
  assert.ok(channel(ceramic.map, 1, 16) + 50 < channel(ceramic.map, 32, 16), "ceramic side joint is visibly recessed");
  assert.ok(channel(ceramic.map, 32, 48) + 50 < channel(ceramic.map, 32, 16), "ceramic joints stagger between rows");
  assert.ok(channel(metal.map, 1, 32) + 30 < channel(metal.map, 32, 32), "standing seam differs from its metal panel");
  assert.ok(channel(felt.map, 32, 2) + 30 < channel(felt.map, 32, 24), "felt overlap differs from its rolled sheet");
  for (const material of [ceramic, metal, felt]) {
    const normal = pixels(material.normalMap), roughness = pixels(material.roughnessMap);
    let minRough = 255, maxRough = 0, strongRelief = false;
    for (let i = 0; i < normal.length; i += 4) {
      const x = normal[i] / 255 * 2 - 1, y = normal[i + 1] / 255 * 2 - 1, z = normal[i + 2] / 255 * 2 - 1;
      assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < .018, "encoded normal remains normalized");
      if (Math.abs(x) + Math.abs(y) > .3) strongRelief = true;
      minRough = Math.min(minRough, roughness[i]); maxRough = Math.max(maxRough, roughness[i]);
    }
    assert.equal(strongRelief, true, "seams have physical normal relief");
    assert.ok(maxRough - minRough > 15, "seams and sheets have separate roughness");
  }
  assert.equal(metal.metalness, materials.metal.metalness);
  assert.ok(metal.metalness > .6); assert.ok(ceramic.metalness < .02); assert.ok(felt.metalness < .02);
  first.dispose(); second.dispose();
}));

test("surface tiles are allocated on demand, shared across tint/wetness changes and disposed once", () => canvasEnvironment(canvases => {
  const surfaces = createWorldSurfaces();
  assert.equal(canvases.length, 0, "creating a world does not allocate unused roof/ground maps");
  const plain = surfaces.material(0x777777);
  assert.equal(canvases.length, 0); assert.equal(plain.map, null);
  const roof = surfaces.material(0xaa4422, "roof-tile");
  assert.equal(canvases.length, 2);
  assert.strictEqual(surfaces.material(0xaa4422, "roof-tile"), roof);
  const otherTint = surfaces.material(0x664433, "roof-tile");
  assert.notStrictEqual(otherTint, roof); assert.equal(canvases.length, 2);
  for (const key of ["map", "roughnessMap", "normalMap"]) assert.strictEqual(otherTint[key], roof[key]);
  const metal = surfaces.material(0x556677, "roof-metal"), felt = surfaces.material(0x333333, "roof-felt");
  assert.equal(canvases.length, 6, "each requested roof owns one color/roughness pair, not per-building textures");
  const resources = new Set([plain, roof, otherTint, metal, felt]);
  for (const material of [roof, metal, felt]) for (const key of ["map", "roughnessMap", "normalMap"]) resources.add(material[key]);
  const disposal = new Map([...resources].map(resource => [resource, 0]));
  for (const resource of resources) resource.addEventListener("dispose", () => disposal.set(resource, disposal.get(resource) + 1));
  for (const material of [roof, metal, felt]) {
    surfaces.setWetness(0);
    const dry = material.roughness, maps = [material.map, material.roughnessMap, material.normalMap];
    surfaces.setWetness(1);
    assert.ok(material.roughness < dry); assert.ok(material.clearcoat > .7);
    assert.deepEqual([material.map, material.roughnessMap, material.normalMap], maps);
    surfaces.setWetness(2); assert.ok(material.roughness >= 0 && material.roughness <= 1);
    surfaces.setWetness(-2); assert.equal(material.roughness, dry); assert.equal(material.clearcoat, 0);
  }
  assert.equal(canvases.length, 6, "weather updates do not create textures");
  assert.ok([...disposal.values()].every(count => count === 0));
  surfaces.dispose(); surfaces.dispose();
  assert.ok([...disposal.values()].every(count => count === 1));
}));

test("roof UV density follows world metres on slopes and stays distinct from floor paving", () => canvasEnvironment(() => {
  const surfaces = createWorldSurfaces();
  const geometry = new THREE.PlaneGeometry(7.68, 3.84); geometry.rotateX(-Math.PI / 2 + .25);
  const sourcePositions = [...geometry.getAttribute("position").array], sourceNormals = [...geometry.getAttribute("normal").array];
  const samples = [];
  for (const kind of ["roof-tile", "roof-metal", "roof-felt", "stone", "asphalt"]) {
    const clone = geometry.clone(), material = surfaces.material(0xffffff, kind);
    projectSurfaceUvs(clone, material);
    const position = clone.getAttribute("position"), uv = clone.getAttribute("uv"), tileSize = material.userData.surfaceTile;
    assert.deepEqual([...position.array], sourcePositions); assert.deepEqual([...clone.getAttribute("normal").array], sourceNormals);
    for (let i = 0; i < position.count; i++) {
      assert.ok(Math.abs(uv.getX(i) * tileSize - position.getX(i)) < 1e-6);
      assert.ok(Math.abs(uv.getY(i) * tileSize - position.getZ(i)) < 1e-6);
    }
    samples.push({ kind, u: Math.abs(uv.getX(0)) }); clone.dispose();
  }
  assert.equal(new Set(samples.filter(({ kind }) => kind.startsWith("roof")).map(({ u }) => u)).size, 3);
  assert.notEqual(samples[0].u, samples.find(({ kind }) => kind === "stone").u);
  geometry.dispose(); surfaces.dispose();
}));
