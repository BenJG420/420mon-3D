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
const ids = ['bolt','sumpump','streetlamp','spraycan','phmeter','keycap'].map(slug => `mon_${slug}`);

test('Dex 157–162 retain their source designs as distinct rounded, bounded full-volume sculptures', async (t) => {
  assert.deepEqual(DEX_ORDER.slice(156,162), ids);
  assert.deepEqual(AUTHORED_MONSTER_IDS.slice(156,162), ids);
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

function coloredPoints(geometry,hex) {
  const positions=geometry.getAttribute('position'),colors=geometry.getAttribute('color'),target=new THREE.Color(hex),points=[];
  for(let i=0;i<positions.count;i++)if(Math.abs(colors.getX(i)-target.r)<1e-5 && Math.abs(colors.getY(i)-target.g)<1e-5 && Math.abs(colors.getZ(i)-target.b)<1e-5)points.push(new THREE.Vector3().fromBufferAttribute(positions,i));
  assert.ok(points.length>100,hex);return points;
}
const mean=points=>points.reduce((v,p)=>v.add(p),new THREE.Vector3()).divideScalar(points.length);

test('Keycap lights and Spraycan nozzle are visible inside actual deep front openings', () => {
  const material=new THREE.MeshBasicMaterial({side:THREE.FrontSide});
  try {
    for(const [id,hex] of [['mon_keycap','#ffd2ff'],['mon_spraycan','#2b1b2e']]) {
      const geometry=authoredMonsterGeometry(id);
      try {
        const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
        const points=coloredPoints(geometry,hex),middle=(Math.min(...points.map(p=>p.x))+Math.max(...points.map(p=>p.x)))/2;
        const centers=id==='mon_keycap'?[-1,1].map(side=>mean(points.filter(p=>(p.x-middle)*side>0))):[mean(points)];
        for(const center of centers) {
          const ray=x=>new THREE.Raycaster(new THREE.Vector3(x,center.y,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
          const inside=ray(center.x),front=ray(id==='mon_keycap'?middle:center.x+.05);
          assert.ok(inside && front,`${id}: opening and surrounding panel`);
          const color=new THREE.Color().fromBufferAttribute(geometry.getAttribute('color'),inside.face.a),target=new THREE.Color(hex);
          assert.ok(Math.abs(color.r-target.r)<1e-5 && Math.abs(color.g-target.g)<1e-5 && Math.abs(color.b-target.b)<1e-5,`${id}: opening is not covered`);
          assert.ok(front.point.z-inside.point.z>.06,`${id}: real recess depth`);
          material.side=THREE.DoubleSide;assert.ok(Math.abs(inside.distance-ray(center.x).distance)<1e-5,`${id}: interior faces forward`);material.side=THREE.FrontSide;
        }
      } finally {geometry.dispose();}
    }
  } finally {material.dispose();}
});

test('Streetlamp gooseneck remains genuinely open through the full model', () => {
  const geometry=authoredMonsterGeometry('mon_streetlamp'),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  try {
    const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
    const ray=x=>new THREE.Raycaster(new THREE.Vector3(x,.52,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh);
    assert.equal(ray(-.08).length,0,'empty hook opening');assert.ok(ray(-.23).length>0,'neighboring curved casting remains solid');
  } finally {geometry.dispose();material.dispose();}
});

test('Streetlamp and Keycap isolate light emission while retaining shaded bodies and shared studio ownership', async () => {
  const originalLoad=THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load=function (_url,onLoad) {
    const texture=new THREE.Texture();queueMicrotask(()=>onLoad?.(texture));return texture;
  };
  const surface=createMonsterSurface(32,{studio:true}),groups=[];let art;
  try {
    art=await server.ssrLoadModule('/src/game/monster-art.ts');
    for(const id of ['mon_streetlamp','mon_keycap','mon_lantern','mon_phmeter'])groups.push(art.createMonsterArt(id,0x56ead0,{surface}));
    await new Promise(resolve=>setImmediate(resolve));
    for(const group of groups){assert.equal(group.userData.modelStatus,'ready');assert.equal(group.userData.surfaceTextureSize,32);}
    for(const group of groups.slice(0,3)) {
      const mesh=group.children[0].children[0];assert.strictEqual(mesh.material,surface.glow);
      const weights=mesh.geometry.getAttribute('glowWeight');assert.equal(weights.count,mesh.geometry.getAttribute('position').count);
      let lit=0,dark=0;
      for(const value of weights.array){assert.ok(value>=0 && value<=1);if(value>.1)lit++;else dark++;}
      assert.ok(lit>100 && dark>100,'body stays shaded outside luminous regions');
    }
    assert.notStrictEqual(groups[3].children[0].children[0].material,surface.glow);
    const lamp=groups[0].children[0].children[0],colors=lamp.geometry.getAttribute('color'),weights=lamp.geometry.getAttribute('glowWeight'),eye=new THREE.Color('#51461c');let eyeCount=0;
    for(let i=0;i<colors.count;i++)if(Math.abs(colors.getX(i)-eye.r)<1e-5 && Math.abs(colors.getY(i)-eye.g)<1e-5 && Math.abs(colors.getZ(i)-eye.b)<1e-5){assert.equal(weights.getX(i),0);eyeCount++;}
    assert.ok(eyeCount>100,'sleepy pupils remain dark');
    let released=0;surface.normalMap.addEventListener('dispose',()=>released++);
    for(const group of groups)art.disposeMonsterArt(group);assert.equal(released,0,'viewer owns the studio texture');
    surface.dispose();surface.dispose();assert.equal(released,1);
  } finally {
    THREE.TextureLoader.prototype.load=originalLoad;
    if(art)for(const group of groups)art.disposeMonsterArt(group);
    surface.dispose();
  }
});
