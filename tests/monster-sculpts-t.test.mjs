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
const ids = ['wrench','gratecover','stoplight','ladder','humidifier','usbstick'].map(slug => `mon_${slug}`);

test('Dex 145–150 retain their source designs as distinct rounded, bounded full-volume sculptures', async (t) => {
  assert.deepEqual(DEX_ORDER.slice(144,150), ids);
  assert.deepEqual(AUTHORED_MONSTER_IDS.slice(144,150), ids);
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

test('Gratecover has visible recessed eyes behind actual front bars, with correct face winding', () => {
  const geometry=authoredMonsterGeometry('mon_gratecover'),material=new THREE.MeshBasicMaterial({side:THREE.FrontSide});
  try {
    const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
    const positions=geometry.getAttribute('position'),colors=geometry.getAttribute('color'),target=new THREE.Color('#dc4abb');
    for(const side of [-1,1]) {
      const center=new THREE.Vector3();let count=0;
      for(let i=0;i<positions.count;i++) if(positions.getX(i)*side>0 && Math.abs(colors.getX(i)-target.r)<1e-5 && Math.abs(colors.getY(i)-target.g)<1e-5 && Math.abs(colors.getZ(i)-target.b)<1e-5) {
        center.add(new THREE.Vector3().fromBufferAttribute(positions,i));count++;
      }
      assert.ok(count>100,'distinct eye surface');center.divideScalar(count);
      const ray=x=>new THREE.Raycaster(new THREE.Vector3(x,center.y,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
      const eye=ray(center.x),bar=ray(0);
      assert.ok(eye && bar,'eye and center bar exist');
      const color=new THREE.Color().fromBufferAttribute(colors,eye.face.a);
      assert.ok(color.r>color.g*1.2 && color.b>color.g*1.2,'front-facing opening exposes the pink eye');
      assert.ok(bar.point.z-eye.point.z>.07,'bar is separated from the eye by real cavity depth');
      material.side=THREE.DoubleSide;assert.ok(Math.abs(eye.distance-ray(center.x).distance)<1e-5,'eye surface faces outward');
      material.side=THREE.FrontSide;
    }
  } finally {geometry.dispose();material.dispose();}
});

test('ladder bays and the wrench jaw remain actual open spaces through the complete model', () => {
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  try {
    for(const [id,open,solid] of [
      ['mon_ladder',[0,-.25],[0,-.095]],
      ['mon_wrench',[-.37,.43],[0,.43]],
    ]) {
      const geometry=authoredMonsterGeometry(id);
      try {
        const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
        const ray=([x,y])=>new THREE.Raycaster(new THREE.Vector3(x,y,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh);
        assert.equal(ray(open).length,0,`${id}: no hidden rear plate closes the opening`);
        assert.ok(ray(solid).length>0,`${id}: neighboring solid frame is retained`);
      } finally {geometry.dispose();}
    }
  } finally {material.dispose();}
});

test('Stoplight and USB eyes use bounded local emission and the existing shared studio PBR ownership', async () => {
  const originalLoad=THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load=function (_url,onLoad) {
    const texture=new THREE.Texture();queueMicrotask(()=>onLoad?.(texture));return texture;
  };
  const surface=createMonsterSurface(32,{studio:true}),groups=[];let art;
  try {
    art=await server.ssrLoadModule('/src/game/monster-art.ts');
    for(const id of ['mon_stoplight','mon_usbstick','mon_bunsen','mon_humidifier']) groups.push(art.createMonsterArt(id,0x56ead0,{surface}));
    await new Promise(resolve=>setImmediate(resolve));
    for(const group of groups) {assert.equal(group.userData.modelStatus,'ready');assert.equal(group.userData.surfaceTextureSize,32);}
    for(const group of groups.slice(0,3)) {
      const mesh=group.children[0].children[0];assert.strictEqual(mesh.material,surface.glow);
      const weights=mesh.geometry.getAttribute('glowWeight');assert.equal(weights.count,mesh.geometry.getAttribute('position').count);
      let lit=0,dark=0;
      for(const value of weights.array) {assert.ok(value>=0 && value<=1);if(value>.1)lit++;else dark++;}
      assert.ok(lit>100 && dark>100,'only lenses/eyes/flame emit; body retains PBR shading');
    }
    assert.notStrictEqual(groups[3].children[0].children[0].material,surface.glow);
    let released=0;surface.normalMap.addEventListener('dispose',()=>released++);
    for(const group of groups)art.disposeMonsterArt(group);
    assert.equal(released,0,'viewer owns studio texture');surface.dispose();surface.dispose();assert.equal(released,1);
  } finally {
    THREE.TextureLoader.prototype.load=originalLoad;
    if(art)for(const group of groups)art.disposeMonsterArt(group);
    surface.dispose();
  }
});
