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
const ids = ['cigpack','seatring','pipette','belltimer','compass','compact'].map(slug => `mon_${slug}`);

test('Dex 115–120 retain their source designs as distinct rounded, bounded full-volume sculptures', async (t) => {
  assert.deepEqual(DEX_ORDER.slice(114,120), ids);
  assert.deepEqual(AUTHORED_MONSTER_IDS.slice(114,120), ids);
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

// CPU intersections check real interior geometry under normal front-face culling;
// they do not replace Ben's visual/device checks.
function withRayModel(id, check) {
  const geometry = authoredMonsterGeometry(id), material = new THREE.MeshBasicMaterial({side: THREE.FrontSide});
  try {
    const mesh = new THREE.Mesh(geometry,material); mesh.updateMatrixWorld(true);
    const ray = (origin,direction) => new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0];
    check(ray,material,geometry);
  } finally { geometry.dispose(); material.dispose(); }
}

test('Cigpack retains an open top cavity below its cardboard wall', () => {
  withRayModel('mon_cigpack', (ray,material) => {
    const inside = ray([.22,3,.06],[0,-1,0]);
    const frontWall = ray([.22,3,.21],[0,-1,0]);
    assert.ok(inside && frontWall, 'inner floor and rim both exist');
    assert.ok(frontWall.point.y - inside.point.y > .5, 'opening leads down into a real box cavity');
    material.side = THREE.DoubleSide;
    const nearest = ray([.22,3,.21],[0,-1,0]);
    assert.ok(Math.abs(frontWall.distance-nearest.distance)<1e-5, 'wall top is outward-facing');
  });
});

test('Pipette has visible liquid in the lower chamber and open sightline through the empty upper tube', () => {
  withRayModel('mon_pipette', (ray,material,geometry) => {
    const liquid = ray([0,-.4,3],[0,0,-1]);
    const empty = ray([0,-.15,3],[0,0,-1]);
    assert.ok(liquid && empty, 'lower fill and upper back glass are present');
    assert.ok(liquid.point.z-empty.point.z>.05, 'liquid is in front of the rear glass; no solid front hides it');
    const colors = geometry.getAttribute('color');
    const fill = new THREE.Color().fromBufferAttribute(colors,liquid.face.a);
    assert.ok(fill.g>fill.r && fill.g>fill.b, 'actual front-facing liquid surface keeps the green source color');
    material.side = THREE.DoubleSide;
    const nearest = ray([0,-.4,3],[0,0,-1]);
    assert.ok(Math.abs(liquid.distance-nearest.distance)<1e-5, 'liquid volume faces outward');
  });
});
