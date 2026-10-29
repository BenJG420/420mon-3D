import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { createServer } from 'vite';

const server = await createServer({ root: new URL('..', import.meta.url).pathname,
  server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
after(() => server.close());
const { DEX_ORDER } = await server.ssrLoadModule('/src/game/data/dex.ts');
const { AUTHORED_MONSTER_IDS, authoredMonsterGeometry } = await server.ssrLoadModule('/src/game/monster-authored.ts');
const { acquireMonsterModel } = await server.ssrLoadModule('/src/game/monster-models.ts');
const { createMonsterSurface } = await server.ssrLoadModule('/src/game/monster-surface.ts');
const ids = ['flicker','plunger','beakerling','gumguard','shardtile','heelsole'].map(slug => `mon_${slug}`);

test('Dex 103–108 retain their source designs as distinct rounded, bounded full-volume sculptures', async () => {
  assert.deepEqual(DEX_ORDER.slice(102,108), ids);
  assert.deepEqual(AUTHORED_MONSTER_IDS.slice(102,108), ids);
  const signatures = new Set();
  for (const id of ids) {
    const geometry = authoredMonsterGeometry(id), slug = id.slice(4);
    try {
      const data = JSON.parse(await readFile(new URL(`../public/game/models/${slug}.json`, import.meta.url), 'utf8'));
      const source = await readFile(new URL(`../public/game/sprites/${slug}.svg`, import.meta.url));
      assert.equal(geometry.userData.sourceSpecies, id);
      assert.equal(geometry.userData.sourceSprite, slug);
      assert.equal(geometry.userData.sourceHash, data.sourceHash);
      assert.equal(data.sourceHash, createHash('sha256').update(source).digest('hex'));
      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      assert.ok(Math.max(size.x,size.y,size.z) <= 1.601 && size.z > .2, `${id}: full depth and standard scale`);
      assert.ok(Math.abs(geometry.boundingBox.min.y + .8) < 1e-6, `${id}: grounded`);
      const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
      assert.ok(positions.count / 3 > 2000 && positions.count / 3 < 30000, `${id}: ${positions.count / 3} triangles`);
      for (const name of ['position','normal','color']) {
        assert.equal(geometry.getAttribute(name).count, positions.count);
        for (const value of geometry.getAttribute(name).array) assert.ok(Number.isFinite(value), `${id}: ${name}`);
      }
      let rounded = 0;
      for (let i = 0; i < normals.count; i += 11) {
        const n = new THREE.Vector3().fromBufferAttribute(normals, i), length = n.length();
        if (length > .5) assert.ok(Math.abs(length - 1) < .001, `${id}: normalized shading`);
        if (Math.abs(n.x) > .1 && Math.abs(n.y) > .1 && Math.abs(n.z) > .1) rounded++;
      }
      assert.ok(rounded > 20, `${id}: sculpted curved surfaces`);
      signatures.add(createHash('sha256').update(Buffer.from(positions.array.buffer)).digest('hex'));
    } finally { geometry.dispose(); }
  }
  assert.equal(signatures.size, 6);
});

test('new sculpture leases retain shared geometry and complete UVs without loading replacement artwork', async () => {
  const originalFetch = globalThis.fetch, leases = [];
  globalThis.fetch = () => { throw new Error('authored sculptures must use local geometry'); };
  try {
    for (const id of ids) {
      const a = await acquireMonsterModel(id), b = await acquireMonsterModel(id); leases.push(a,b);
      assert.strictEqual(a.geometry, b.geometry); assert.equal(a.kind, 'sculpted');
      const uv = a.geometry.getAttribute('uv'); assert.equal(uv.count, a.geometry.getAttribute('position').count);
      for (const value of uv.array) assert.ok(Number.isFinite(value));
      let disposed = 0; a.geometry.addEventListener('dispose', () => disposed++);
      a.release(); a.release(); assert.equal(disposed, 0, 'active second lease retains the model'); b.release();
    }
  } finally { leases.forEach(lease => lease.release()); globalThis.fetch = originalFetch; }
});

test('custom torso, mirror front and shoe toe face outward with normal back-face culling', () => {
  const rays = [
    ['mon_gumguard', [3,.3,-.15], [-1,0,0]],
    ['mon_shardtile', [0,.55,3], [0,0,-1]],
    ['mon_heelsole', [-.45,3,0], [0,-1,0]],
  ];
  for (const [id, origin, direction] of rays) {
    const geometry = authoredMonsterGeometry(id);
    const material = new THREE.MeshBasicMaterial({ side: THREE.FrontSide });
    try {
      const mesh = new THREE.Mesh(geometry, material); mesh.updateMatrixWorld(true);
      const ray = new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction));
      const visible = ray.intersectObject(mesh)[0];
      material.side = THREE.DoubleSide;
      const nearest = ray.intersectObject(mesh)[0];
      assert.ok(visible && nearest, `${id}: ray reaches the authored outer surface`);
      assert.ok(Math.abs(visible.distance - nearest.distance) < 1e-5, `${id}: closest surface must face outwards`);
    } finally { geometry.dispose(); material.dispose(); }
  }
});

test('Flicker uses localized flame emission in the existing PBR art path, with unlit casing and owned studio cleanup', async () => {
  const originalLoad = THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load = function (_url, onLoad) {
    const texture = new THREE.Texture(); queueMicrotask(() => onLoad?.(texture)); return texture;
  };
  const surface = createMonsterSurface(32, { studio: true }), groups = [];
  let art;
  try {
    art = await server.ssrLoadModule('/src/game/monster-art.ts');
    for (const id of ['mon_flicker','mon_growbulb','mon_gumguard']) groups.push(art.createMonsterArt(id, 0x56ead0, { surface }));
    await new Promise(resolve => setImmediate(resolve));
    for (const group of groups) {
      assert.equal(group.userData.modelStatus, 'ready'); assert.equal(group.userData.surfaceTextureSize, 32);
    }
    const flicker = groups[0].children[0].children[0], bulb = groups[1].children[0].children[0];
    assert.strictEqual(flicker.material, surface.glow); assert.strictEqual(bulb.material, surface.glow);
    assert.notStrictEqual(groups[2].children[0].children[0].material, surface.glow);
    const weights = flicker.geometry.getAttribute('glowWeight');
    assert.equal(weights.count, flicker.geometry.getAttribute('position').count);
    let lit = 0, dark = 0;
    for (const value of weights.array) { assert.ok(value >= 0 && value <= 1); if (value > .1) lit++; else dark++; }
    assert.ok(lit > 100 && dark > 100, 'flame is lit while metal fittings remain shaded');
    let released = 0; surface.normalMap.addEventListener('dispose', () => released++);
    for (const group of groups) art.disposeMonsterArt(group);
    assert.equal(released, 0, 'art does not own the studio texture');
    surface.dispose(); surface.dispose(); assert.equal(released, 1);
  } finally {
    THREE.TextureLoader.prototype.load = originalLoad;
    if (art) for (const group of groups) art.disposeMonsterArt(group);
    surface.dispose();
  }
});
