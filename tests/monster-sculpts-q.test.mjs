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
const ids = ['matchbook','shutoff','goggles','speedbag','yarnball','choker'].map(slug => `mon_${slug}`);

test('Dex 127–132 retain their source designs as distinct rounded, bounded full-volume sculptures', async (t) => {
  assert.deepEqual(DEX_ORDER.slice(126,132), ids);
  assert.deepEqual(AUTHORED_MONSTER_IDS.slice(126,132), ids);
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

test('Shutoff keeps real empty spoke spaces and outward-facing cast wheel/hub', () => {
  const geometry=authoredMonsterGeometry('mon_shutoff'), material=new THREE.MeshBasicMaterial({side:THREE.FrontSide});
  try {
    const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
    const ray=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
    assert.equal(ray(.32,.49),undefined,'diagonal opening is clear through the handwheel');
    const top=ray(0,.74),hub=ray(0,.29);
    assert.ok(top && hub,'outer wheel and central cast hub remain solid');
    material.side=THREE.DoubleSide;
    assert.equal(ray(.32,.49),undefined,'no hidden backwards disk seals the opening');
    assert.ok(Math.abs(top.distance-ray(0,.74).distance)<1e-5,'top wheel surface faces outward');
    assert.ok(Math.abs(hub.distance-ray(0,.29).distance)<1e-5,'eye plate faces outward');
  } finally {geometry.dispose();material.dispose();}
});

test('Yarnball eyes sit inside actual open sockets behind the front yarn', () => {
  const geometry=authoredMonsterGeometry('mon_yarnball'), material=new THREE.MeshBasicMaterial({side:THREE.FrontSide});
  try {
    const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
    const ray=x=>new THREE.Raycaster(new THREE.Vector3(x,.16,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
    const eye=ray(-.30),bridge=ray(-.11);
    assert.ok(eye && bridge,'both the socket back and yarn-covered bridge are present');
    assert.ok(bridge.point.z-eye.point.z>.06,'eye is recessed beyond the outer yarn, not painted over a ball');
    const color=new THREE.Color().fromBufferAttribute(geometry.getAttribute('color'),eye.face.a);
    assert.ok(Math.max(color.r,color.g,color.b)<.08,'no bright winding obscures the dark eye');
    material.side=THREE.DoubleSide;
    assert.ok(Math.abs(eye.distance-ray(-.30).distance)<1e-5,'visible socket surface faces the viewer');
  } finally {geometry.dispose();material.dispose();}
});
