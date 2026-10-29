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
const ids = ['jerrycan','floatball','letterbox','bollard','shears','switchbox'].map(slug => `mon_${slug}`);

test('Dex 121–126 retain their source designs as distinct rounded, bounded full-volume sculptures', async (t) => {
  assert.deepEqual(DEX_ORDER.slice(120,126), ids);
  assert.deepEqual(AUTHORED_MONSTER_IDS.slice(120,126), ids);
  const signatures = new Set(), budgetErrors = [];
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
      assert.ok(Math.max(size.x,size.y,size.z) <= 1.601 && size.z > .12, `${id}: full depth and standard scale`);
      assert.ok(Math.abs(geometry.boundingBox.min.y + .8) < 1e-6, `${id}: grounded`);
      const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
      t.diagnostic(`${id}: ${positions.count / 3} triangles`);
      if (!(positions.count / 3 > 2000 && positions.count / 3 < 30000)) budgetErrors.push(`${id}: ${positions.count / 3} triangles`);
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
  assert.deepEqual(budgetErrors, [], "all six detailed models stay within the geometry budget");
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

test('Jerrycan has real negative space through its carry handle and a solid rounded top bar', () => {
  const geometry=authoredMonsterGeometry('mon_jerrycan'), material=new THREE.MeshBasicMaterial({side:THREE.FrontSide});
  try {
    const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
    const ray=y=>new THREE.Raycaster(new THREE.Vector3(.24,y,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
    assert.equal(ray(.57),undefined,'the handle aperture is clear through front and rear');
    const bar=ray(.74);assert.ok(bar,'solid rounded upper grip remains');
    material.side=THREE.DoubleSide;
    assert.equal(ray(.57),undefined,'opening remains clear even without backface culling');
    assert.ok(Math.abs(bar.distance-ray(.74).distance)<1e-5,'outer grip faces the viewer');
  } finally {geometry.dispose();material.dispose();}
});

test('Switchbox uses localized LED emission in the existing PBR art path, with unlit housing and owned studio cleanup', async () => {
  const originalLoad = THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load = function (_url, onLoad) {
    const texture = new THREE.Texture(); queueMicrotask(() => onLoad?.(texture)); return texture;
  };
  const surface = createMonsterSurface(32, { studio: true }), groups = [];
  let art;
  try {
    art = await server.ssrLoadModule('/src/game/monster-art.ts');
    for (const id of ['mon_switchbox','mon_bladeu','mon_jerrycan']) groups.push(art.createMonsterArt(id, 0x56ead0, { surface }));
    await new Promise(resolve => setImmediate(resolve));
    for (const group of groups) {
      assert.equal(group.userData.modelStatus, 'ready'); assert.equal(group.userData.surfaceTextureSize, 32);
    }
    const blade = groups[0].children[0].children[0], flame = groups[1].children[0].children[0];
    assert.strictEqual(blade.material, surface.glow); assert.strictEqual(flame.material, surface.glow);
    assert.notStrictEqual(groups[2].children[0].children[0].material, surface.glow);
    const weights = blade.geometry.getAttribute('glowWeight');
    assert.equal(weights.count, blade.geometry.getAttribute('position').count);
    let lit = 0, dark = 0;
    for (const value of weights.array) { assert.ok(value >= 0 && value <= 1); if (value > .1) lit++; else dark++; }
    assert.ok(lit > 100 && dark > 100, 'LEDs are lit while the switch enclosure remains shaded');
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
