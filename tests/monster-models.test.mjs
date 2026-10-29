import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import * as THREE from "three";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
const { DEX, DEX_ORDER } = await server.ssrLoadModule("/src/game/data/dex.ts");
const { spriteUrl } = await server.ssrLoadModule("/src/game/sprites.ts");
const models = await server.ssrLoadModule("/src/game/monster-models.ts");
const { AUTHORED_MONSTER_IDS, authoredMonsterGeometry } = await server.ssrLoadModule("/src/game/monster-authored.ts");
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
let assetPromise;
function assets() {
  return assetPromise ??= (async () => {
    const catalogue = JSON.parse(await readFile(new URL("../public/game/models/catalogue.json", import.meta.url), "utf8"));
    const records = await Promise.all(catalogue.entries.map(async entry => {
      const bytes = await readFile(new URL(`../public/${entry.url}`, import.meta.url));
      return { entry, bytes, data: JSON.parse(bytes) };
    }));
    return { catalogue, records, byId: new Map(records.map(record => [record.data.id, record])) };
  })();
}

// This small PNG reader is independent of the authoring pipeline. It verifies
// palettes against actual source pixels, including the original SVG wrappers.
function sourceColors(bytes) {
  if (bytes.toString("ascii", 1, 4) !== "PNG") {
    const embedded = bytes.toString("utf8").match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
    assert.ok(embedded, "local SVG must retain its complete source PNG");
    bytes = Buffer.from(embedded[1], "base64");
  }
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  assert.equal(bytes[24], 8, "source PNG uses eight-bit channels");
  assert.equal(bytes[28], 0, "source PNG is non-interlaced");
  const type = bytes[25], channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  assert.ok(channels, `supported source color type ${type}`);
  let palette, transparency;
  const parts = [];
  for (let offset = 8; offset < bytes.length;) {
    const size = bytes.readUInt32BE(offset), kind = bytes.toString("ascii", offset + 4, offset + 8);
    const body = bytes.subarray(offset + 8, offset + 8 + size);
    if (kind === "IDAT") parts.push(body);
    if (kind === "PLTE") palette = body;
    if (kind === "tRNS") transparency = body;
    offset += size + 12;
  }
  const inflated = inflateSync(Buffer.concat(parts)), stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = inflated[y * (stride + 1)];
    assert.ok(filter >= 0 && filter <= 4, `PNG row filter ${filter}`);
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const above = y ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      const prediction = [0, left, above, Math.floor((left + above) / 2), paeth(left, above, upperLeft)][filter];
      pixels[y * stride + x] = (inflated[y * (stride + 1) + x + 1] + prediction) & 255;
    }
  }
  const colors = new Set();
  for (let y = 0; y < Math.min(height, 128); y++) for (let x = 0; x < Math.min(width, 128); x++) {
    const offset = y * stride + x * channels;
    let rgb, alpha = 255;
    if (type === 6 || type === 2) { rgb = [...pixels.subarray(offset, offset + 3)]; if (type === 6) alpha = pixels[offset + 3]; }
    else if (type === 3) { const index = pixels[offset]; rgb = [...palette.subarray(index * 3, index * 3 + 3)]; alpha = transparency?.[index] ?? 255; }
    else { rgb = [pixels[offset], pixels[offset], pixels[offset]]; if (type === 4) alpha = pixels[offset + 1]; }
    if (alpha >= 96) colors.add(rgb.join(","));
  }
  return colors;
}

function geometryVolume(geometry) {
  const p = geometry.getAttribute("position"), index = geometry.index;
  const count = index ? index.count : p.count;
  let volume = 0;
  for (let i = 0; i < count; i += 3) {
    const a = index ? index.getX(i) : i, b = index ? index.getX(i + 1) : i + 1, c = index ? index.getX(i + 2) : i + 2;
    volume += p.getX(a) * (p.getY(b) * p.getZ(c) - p.getZ(b) * p.getY(c))
      + p.getY(a) * (p.getZ(b) * p.getX(c) - p.getX(b) * p.getZ(c))
      + p.getZ(a) * (p.getX(b) * p.getY(c) - p.getY(b) * p.getX(c));
  }
  return volume / 6;
}
const geometryHash = geometry => {
  const hash = createHash("sha256");
  for (const name of ["position", "normal", "color"]) {
    const a = geometry.getAttribute(name).array;
    hash.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
  }
  if (geometry.index) { const a = geometry.index.array; hash.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); }
  return hash.digest("hex");
};

test("420 individual model files cover the real Dex with authenticated local source references", async () => {
  const { catalogue, records } = await assets();
  assert.equal(catalogue.version, 1);
  assert.equal(catalogue.sourceRevision, "010807da77df8468a297adf33eaf1fb5c9a61c8b");
  assert.equal(catalogue.sourcePose, "top-left-128x128");
  assert.equal(records.length, 420);
  assert.deepEqual(records.map(({ data }) => data.id).sort(), [...DEX_ORDER].sort());
  const signatures = new Set();
  let totalBytes = 0;
  for (const { entry, data, bytes } of records) {
    const species = DEX[data.id], sourcePath = spriteUrl(species.sprite, "");
    assert.equal(entry.name, species.name, data.id);
    assert.equal(data.sourceSprite, species.sprite, data.id);
    assert.equal(entry.sprite, species.sprite);
    assert.equal(entry.spriteFile, `public/${sourcePath}`);
    assert.equal(entry.url, `game/models/${species.sprite}.json`);
    assert.deepEqual(entry.sourceFrame, [0, 0, 128, 128]);
    const source = await readFile(new URL(`../public/${sourcePath}`, import.meta.url));
    assert.equal(data.sourceHash, sha256(source), `${data.id}: unchanged local source bytes`);
    assert.equal(entry.sourceHash, data.sourceHash);
    assert.equal(entry.modelHash, sha256(bytes), `${data.id}: model manifest integrity`);
    assert.equal(entry.bytes, bytes.length);
    assert.ok(bytes.length < 64 * 1024, `${data.id}: modest per-species download`);
    totalBytes += bytes.length;
    signatures.add(sha256(JSON.stringify([data.grid, data.columns, data.palette])));
  }
  assert.equal(signatures.size, 420, "species must have individual forms/colors rather than a repeated placeholder");
  assert.ok(totalBytes < 8 * 1024 * 1024, "the complete model catalogue stays below eight MiB");
});

test("source volumes preserve actual first-frame palette pixels and bounded solid columns", async () => {
  const { records } = await assets();
  for (const { entry, data } of records) {
    assert.strictEqual(models.validateMonsterModel(data), data);
    const [w, h] = data.grid;
    assert.ok(w > 1 && h > 1 && w <= 36 && h <= 36, data.id);
    assert.ok(Math.abs(data.cellSize * Math.max(w, h) - 1.6) < .000001, data.id);
    assert.deepEqual(entry.grid, data.grid);
    assert.equal(entry.columns, data.columns.length);
    const cells = new Set();
    let voxels = 0, deepest = 0;
    for (const [x, y, depth, color] of data.columns) {
      assert.ok(Number.isInteger(x) && x >= 0 && x < w);
      assert.ok(Number.isInteger(y) && y >= 0 && y < h);
      assert.ok(Number.isInteger(depth) && depth >= 1 && depth <= 7);
      assert.ok(Number.isInteger(color) && color >= 0 && color < data.palette.length);
      const key = `${x},${y}`;
      assert.ok(!cells.has(key), `${data.id}: overlapping columns`); cells.add(key);
      voxels += 2 * depth - 1; deepest = Math.max(deepest, depth);
    }
    assert.ok(deepest > 1, `${data.id}: real varying Z volume`);
    assert.equal(entry.voxels, voxels);
    const colors = sourceColors(await readFile(new URL(`../${entry.spriteFile}`, import.meta.url)));
    for (const color of data.palette) assert.ok(colors.has(color.join(",")), `${data.id}: palette color ${color} belongs to the original first pose`);
  }
});

test("every generated geometry encloses its actual volume with finite bounds and a phone-sized mesh budget", async () => {
  const { records } = await assets();
  for (const { entry, data } of records) {
    const geometry = models.buildMonsterGeometry(data);
    try {
      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      assert.ok(size.x > 0 && size.y > 0 && size.z > data.cellSize * 2, data.id);
      assert.ok(Math.max(size.x, size.y) <= 1.601 && size.z < 1.6, data.id);
      const firstOccupiedRow = Math.min(...data.columns.map(column => column[1]));
      assert.ok(Math.abs(geometry.boundingBox.min.y - (firstOccupiedRow * data.cellSize - .8)) < .000001, `${data.id}: source bottom-up rows preserve the existing animation pivot`);
      const position = geometry.getAttribute("position"), color = geometry.getAttribute("color"), normal = geometry.getAttribute("normal");
      assert.equal(position.count, color.count); assert.equal(position.count, normal.count);
      for (const value of position.array) assert.ok(Number.isFinite(value), data.id);
      for (const value of color.array) assert.ok(Number.isFinite(value) && value >= 0 && value <= 1, data.id);
      const triangles = geometry.index.count / 3;
      assert.equal(triangles, entry.triangleBudget, data.id);
      assert.ok(triangles < 15000, `${data.id}: exterior faces only`);
      const expectedVolume = data.columns.reduce((sum, column) => sum + (2 * column[2] - 1), 0) * data.cellSize ** 3;
      assert.ok(Math.abs(geometryVolume(geometry) - expectedVolume) < Math.max(.000001, expectedVolume * .00001), `${data.id}: closed outward-facing solid instead of crossed sprite planes`);
      const rgb = new THREE.Color().setRGB(...data.palette[data.columns[0][3]].map(n => n / 255), THREE.SRGBColorSpace);
      assert.ok(Math.abs(color.getX(0) - rgb.r) < .000001 && Math.abs(color.getY(0) - rgb.g) < .000001 && Math.abs(color.getZ(0) - rgb.b) < .000001, `${data.id}: source RGB becomes correct linear vertex color`);
      assert.equal(geometry.userData.speciesId, data.id);
      assert.equal(geometry.userData.sourceHash, data.sourceHash);
    } finally { geometry.dispose(); }
  }
});

test("model validation rejects corrupt coordinates, duplicate columns and invalid resource allocations", () => {
  const valid = { version: 1, id: "mon_example", sourceSprite: "example", sourceHash: "source", grid: [2, 2], cellSize: .5, palette: [[20, 30, 40]], columns: [[0, 0, 2, 0]] };
  for (const value of [null, {}, { ...valid, version: 2 }, { ...valid, grid: [Infinity, 2] }, { ...valid, grid: [100000, 2] }, { ...valid, cellSize: 0 }, { ...valid, cellSize: NaN }, { ...valid, palette: [[256, 0, 0]] }, { ...valid, palette: [] }, { ...valid, columns: [] }, { ...valid, columns: [[0, 0, 2, 0], [0, 0, 3, 0]] }, { ...valid, columns: [[2, 0, 1, 0]] }, { ...valid, columns: [[0, -1, 1, 0]] }, { ...valid, columns: [[0, 0, 0, 0]] }, { ...valid, columns: [[0, 0, 10000, 0]] }, { ...valid, columns: [[0, 0, 1, 1]] }, { ...valid, columns: [[0, 0, 1.5, 0]] }]) {
    assert.throws(() => models.buildMonsterGeometry(value));
  }
  const single = models.buildMonsterGeometry(valid);
  assert.equal(single.index.count / 3, 12, "a solid column has six outward faces");
  assert.ok(Math.abs(geometryVolume(single) - .375) < .000001);
  single.dispose();
});

test("120 authored source species have individual mesh geometry, honest metadata and no fake unknown-species model", async () => {
  const { byId } = await assets();
  assert.equal(AUTHORED_MONSTER_IDS.length, 120);
  assert.equal(new Set(AUTHORED_MONSTER_IDS).size, 120);
  const expected = DEX_ORDER.slice(0, 120);
  assert.deepEqual([...AUTHORED_MONSTER_IDS].sort(), expected.sort());
  const signatures = new Set();
  for (const id of AUTHORED_MONSTER_IDS) {
    const geometry = authoredMonsterGeometry(id);
    assert.ok(geometry?.isBufferGeometry, id);
    try {
      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      assert.ok(size.x > .1 && size.y > .1 && size.z > .1, `${id}: modeled all around`);
      assert.ok(Math.max(size.x, size.y, size.z) <= 1.601, id);
      assert.ok(Math.abs(geometry.boundingBox.min.y + .8) < .000001, id);
      assert.equal(geometry.userData.sourceSpecies, id);
      assert.equal(geometry.userData.sourceSprite, DEX[id].sprite);
      assert.equal(geometry.userData.sourceHash, byId.get(id).data.sourceHash);
      for (const attribute of ["position", "normal", "color"]) for (const value of geometry.getAttribute(attribute).array) assert.ok(Number.isFinite(value), `${id}: finite ${attribute}`);
      const count = geometry.index?.count ?? geometry.getAttribute("position").count;
      assert.ok(count / 3 < 30000, `${id}: single bounded mesh`);
      signatures.add(geometryHash(geometry));
    } finally { geometry.dispose(); }
  }
  assert.equal(signatures.size, 120);
  assert.equal(authoredMonsterGeometry("mon_not_real"), null);
  const automatic = DEX_ORDER.find(id => !AUTHORED_MONSTER_IDS.includes(id));
  assert.equal(authoredMonsterGeometry(automatic), null, "automatic volumes are not mislabeled as authored sculpts");
});

test("the shared geometry cache deduplicates loads, retains active consumers and disposes only evicted idle resources", async () => {
  const { byId } = await assets(), originalFetch = globalThis.fetch;
  const ids = DEX_ORDER.filter(id => !AUTHORED_MONSTER_IDS.includes(id));
  const requests = new Map();
  globalThis.fetch = async input => {
    const slug = String(input).split("/").at(-1).replace(/\.json$/, "");
    const record = [...byId.values()].find(({ data }) => data.sourceSprite === decodeURIComponent(slug));
    assert.ok(record, `requested real model ${slug}`);
    requests.set(record.data.id, (requests.get(record.data.id) || 0) + 1);
    return { ok: true, json: async () => structuredClone(record.data) };
  };
  const leases = [];
  try {
    const [a, b] = await Promise.all([models.acquireMonsterModel(ids[0]), models.acquireMonsterModel(ids[0])]);
    leases.push(a, b);
    assert.strictEqual(a.geometry, b.geometry);
    assert.equal(a.kind, "smooth-volume");
    assert.equal(requests.get(ids[0]), 1);
    let activeDisposals = 0, evictedDisposals = 0;
    a.geometry.addEventListener("dispose", () => activeDisposals++);
    a.release(); a.release();
    const firstIdle = await models.acquireMonsterModel(ids[1]); leases.push(firstIdle);
    firstIdle.geometry.addEventListener("dispose", () => evictedDisposals++);
    firstIdle.release();
    for (const id of ids.slice(2, models.MONSTER_MODEL_CACHE_UNUSED_LIMIT + 5)) {
      const lease = await models.acquireMonsterModel(id); leases.push(lease); lease.release();
    }
    assert.equal(activeDisposals, 0, "the second live owner retains its geometry");
    assert.equal(evictedDisposals, 1, "old idle geometry is disposed exactly once");
    const info = models.monsterModelCacheInfo();
    assert.equal(info.active, 1);
    assert.ok(info.unused <= 24 && info.entries <= 25);
    b.release(); b.release();
    assert.equal(models.monsterModelCacheInfo().active, 0);
    assert.ok(models.monsterModelCacheInfo().unused <= 24);
    await assert.rejects(models.acquireMonsterModel("mon_not_real"));
  } finally { leases.forEach(lease => lease.release()); globalThis.fetch = originalFetch; }
});

test("async species changes and disposal cannot attach a stale model or dispose another monster's shared geometry", async () => {
  const { byId } = await assets(), originalFetch = globalThis.fetch, originalLoad = THREE.TextureLoader.prototype.load;
  const ids = DEX_ORDER.filter(id => !AUTHORED_MONSTER_IDS.includes(id)).slice(-4);
  const pending = new Map(), groups = [];
  const flush = () => new Promise(resolve => setImmediate(resolve));
  THREE.TextureLoader.prototype.load = function (_url, onLoad) { const texture = new THREE.Texture(); queueMicrotask(() => onLoad?.(texture)); return texture; };
  globalThis.fetch = input => new Promise(resolve => pending.set(decodeURIComponent(String(input).split("/").at(-1).replace(/\.json$/, "")), resolve));
  const respond = id => { const resolve = pending.get(DEX[id].sprite); assert.ok(resolve, `pending ${id}`); resolve({ ok: true, json: async () => structuredClone(byId.get(id).data) }); };
  const art = await server.ssrLoadModule("/src/game/monster-art.ts");
  try {
    const group = art.createMonsterArt(ids[0]); groups.push(group);
    const pivot = group.children[0];
    assert.equal(pivot.name, "monster-animation-pivot"); assert.equal(pivot.position.y, .82);
    assert.equal(group.userData.modelStatus, "loading");
    assert.ok(pivot.children[0].isSprite, "loading preserves an explicit original-pose fallback");
    art.setMonsterArt(group, ids[1]);
    respond(ids[1]); await flush();
    assert.equal(group.userData.speciesId, ids[1]); assert.equal(group.userData.modelStatus, "ready");
    assert.strictEqual(group.children[0], pivot); assert.equal(pivot.children.length, 1); assert.ok(pivot.children[0].isMesh);
    const readyGeometry = pivot.children[0].geometry;
    respond(ids[0]); await flush();
    assert.equal(group.userData.speciesId, ids[1]); assert.strictEqual(pivot.children[0].geometry, readyGeometry);
    const second = art.createMonsterArt(ids[1]); groups.push(second); await flush();
    assert.strictEqual(second.children[0].children[0].geometry, readyGeometry);
    let sharedDisposals = 0, ownDisposals = 0;
    readyGeometry.addEventListener("dispose", () => sharedDisposals++);
    for (const mesh of group.children.slice(1)) mesh.material.addEventListener("dispose", () => ownDisposals++);
    art.disposeMonsterArt(group); art.disposeMonsterArt(group);
    assert.equal(ownDisposals, 2); assert.equal(sharedDisposals, 0);
    assert.equal(second.userData.modelStatus, "ready"); assert.equal(second.children[0].children.length, 1);
    const abandoned = art.createMonsterArt(ids[2]); groups.push(abandoned);
    art.disposeMonsterArt(abandoned); respond(ids[2]); await flush();
    assert.equal(abandoned.userData.modelStatus, "disposed"); assert.equal(abandoned.children[0].children.length, 0);
    art.setMonsterArt(abandoned, ids[3]);
    assert.ok(!pending.has(DEX[ids[3]].sprite), "disposed instances cannot start a new fetch");
    art.disposeMonsterArt(second);
    assert.equal(models.monsterModelCacheInfo().active, 0, "stale and disposed asynchronous leases were released");
  } finally { groups.forEach(group => art.disposeMonsterArt(group)); globalThis.fetch = originalFetch; THREE.TextureLoader.prototype.load = originalLoad; }
});

test("failed or mismatched model downloads retain a clearly marked single original pose and allow a later retry", async () => {
  const { byId } = await assets(), originalFetch = globalThis.fetch, originalLoad = THREE.TextureLoader.prototype.load;
  const ids = DEX_ORDER.filter(id => !AUTHORED_MONSTER_IDS.includes(id)).slice(-7, -5);
  const groups = [], flush = () => new Promise(resolve => setImmediate(resolve));
  THREE.TextureLoader.prototype.load = function (_url, onLoad) { const texture = new THREE.Texture(); queueMicrotask(() => onLoad?.(texture)); return texture; };
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  const art = await server.ssrLoadModule("/src/game/monster-art.ts");
  try {
    const group = art.createMonsterArt(ids[0]); groups.push(group); await flush();
    assert.equal(group.userData.modelStatus, "error"); assert.equal(group.userData.modelKind, "sprite-fallback");
    const fallback = group.children[0].children[0];
    assert.ok(fallback.isSprite); assert.equal(fallback.name, "error-original-pose");
    assert.deepEqual(fallback.material.map.repeat.toArray(), [.5, .5]);
    assert.deepEqual(fallback.material.map.offset.toArray(), [0, .5]);
    globalThis.fetch = async () => ({ ok: true, json: async () => structuredClone(byId.get(ids[1]).data) });
    art.setMonsterArt(group, ids[0]); await flush();
    assert.equal(group.userData.modelStatus, "error", "a different species payload cannot impersonate this monster");
    globalThis.fetch = async () => ({ ok: true, json: async () => structuredClone(byId.get(ids[0]).data) });
    art.setMonsterArt(group, ids[0]); await flush();
    assert.equal(group.userData.modelStatus, "ready"); assert.equal(group.userData.modelKind, "smooth-volume");
    assert.ok(group.children[0].children[0].isMesh);
    assert.equal(group.userData.sourceHash, byId.get(ids[0]).data.sourceHash);
  } finally { groups.forEach(group => art.disposeMonsterArt(group)); globalThis.fetch = originalFetch; THREE.TextureLoader.prototype.load = originalLoad; }
});
