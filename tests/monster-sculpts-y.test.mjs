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
const ids = ['grinder','squeegee','funnel','headgear','chalk','cuff'].map(slug => `mon_${slug}`);

test('Dex 175–180 retain their source designs as distinct rounded, bounded full-volume sculptures', async (t) => {
  assert.deepEqual(DEX_ORDER.slice(174,180), ids);
  assert.deepEqual(AUTHORED_MONSTER_IDS.slice(174,180), ids);
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

test('the raised squeegee and padded headguard leave the source eye pairs visible with outward faces', () => {
  for(const [id,palettes] of [['mon_squeegee',['#fcfff0']],['mon_headgear',['#fff0cd','#fff6df']]]) {
    const geometry=authoredMonsterGeometry(id),material=new THREE.MeshBasicMaterial({side:THREE.FrontSide});
    try {
      const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
      for(const hex of palettes) {
        const points=coloredPoints(geometry,hex),middle=(Math.min(...points.map(p=>p.x))+Math.max(...points.map(p=>p.x)))/2;
        for(const side of [-1,1]) {
          const center=mean(points.filter(p=>(p.x-middle)*side>0));
          const ray=()=>new THREE.Raycaster(new THREE.Vector3(center.x,center.y,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
          const hit=ray();assert.ok(hit,`${id} ${hex}: visible source eye`);
          const color=new THREE.Color().fromBufferAttribute(geometry.getAttribute('color'),hit.face.a),target=new THREE.Color(hex);
          assert.ok(Math.abs(color.r-target.r)<1e-5 && Math.abs(color.g-target.g)<1e-5 && Math.abs(color.b-target.b)<1e-5,`${id} ${hex}: no accessory masks the pupil highlight`);
          material.side=THREE.DoubleSide;assert.ok(Math.abs(hit.distance-ray().distance)<1e-5,`${id}: eye surfaces face out`);material.side=THREE.FrontSide;
        }
      }
    } finally {geometry.dispose();material.dispose();}
  }
});

test('new sculptures reuse the existing metal, wet and smooth studio PBR without owning viewer textures', async () => {
  const originalLoad=THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load=function (_url,onLoad) {
    const texture=new THREE.Texture();queueMicrotask(()=>onLoad?.(texture));return texture;
  };
  const surface=createMonsterSurface(32,{studio:true}),groups=[];let art;
  try {
    art=await server.ssrLoadModule('/src/game/monster-art.ts');
    for(const id of ids)groups.push(art.createMonsterArt(id,0x56ead0,{surface}));
    await new Promise(resolve=>setImmediate(resolve));
    const materials=[surface.metal,surface.wet,surface.wet,surface.material,surface.material,surface.metal];
    for(let i=0;i<groups.length;i++) {
      const group=groups[i];assert.equal(group.userData.modelStatus,'ready');assert.equal(group.userData.surfaceTextureSize,32);
      const mesh=group.children[0].children[0];assert.strictEqual(mesh.material,materials[i]);assert.equal(mesh.material.flatShading,false);
      assert.strictEqual(mesh.material.normalMap,surface.normalMap);
      assert.notStrictEqual(mesh.material,surface.glow,'nonluminous source designs remain ordinarily lit');
    }
    let released=0;surface.normalMap.addEventListener('dispose',()=>released++);
    for(const group of groups)art.disposeMonsterArt(group);assert.equal(released,0,'studio viewer owns shared PBR textures');
    surface.dispose();surface.dispose();assert.equal(released,1);
  } finally {
    THREE.TextureLoader.prototype.load=originalLoad;
    if(art)for(const group of groups)art.disposeMonsterArt(group);
    surface.dispose();
  }
});

test('Funnel has a continuous open throat and front-facing inner walls far below its rim', () => {
  const geometry=authoredMonsterGeometry('mon_funnel'),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  try {
    const points=coloredPoints(geometry,'#e3ec64'),center=mean(points);
    const scale=(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)))/(.488*2);
    const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
    const down=x=>new THREE.Raycaster(new THREE.Vector3(center.x+x*scale,3,center.z),new THREE.Vector3(0,-1,0)).intersectObject(mesh);
    assert.equal(down(.035).length,0,'open narrow outlet, offset from the suspended drops');
    const rim=down(.482)[0],inside=down(.19)[0];assert.ok(rim && inside,'physical rim and deep inner wall');
    assert.ok(rim.point.y-inside.point.y>.3*scale,'hollow cone has actual vertical depth');
    const color=new THREE.Color().fromBufferAttribute(geometry.getAttribute('color'),inside.face.a),target=new THREE.Color('#758d20');
    assert.ok(Math.abs(color.r-target.r)<1e-5 && Math.abs(color.g-target.g)<1e-5,'inner wall, not a filled lid');
    material.side=THREE.FrontSide;assert.ok(Math.abs(inside.distance-down(.19)[0].distance)<1e-5,'inner normals face the cavity');
  } finally {geometry.dispose();material.dispose();}
});

test('Cuff keeps both bores open and Chalk has an outward-facing fractured solid top', () => {
  const cuff=authoredMonsterGeometry('mon_cuff'),chalk=authoredMonsterGeometry('mon_chalk'),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  try {
    const mesh=new THREE.Mesh(cuff,material);mesh.updateMatrixWorld(true);
    const points=coloredPoints(cuff,'#bf299d'),middle=(Math.min(...points.map(p=>p.x))+Math.max(...points.map(p=>p.x)))/2;
    const normal=new THREE.Vector3(0,Math.cos(.52),Math.sin(.52));
    for(const side of [-1,1]) {
      const group=points.filter(p=>(p.x-middle)*side>0),center=mean(group);
      assert.equal(new THREE.Raycaster(center.clone().addScaledVector(normal,3),normal.clone().negate()).intersectObject(mesh).length,0,'annular castings and enamel do not fill either bore');
    }
    const top=mean(coloredPoints(chalk,'#f7efff')),stick=new THREE.Mesh(chalk,material);stick.updateMatrixWorld(true);
    const down=()=>new THREE.Raycaster(new THREE.Vector3(top.x,3,top.z),new THREE.Vector3(0,-1,0)).intersectObject(stick)[0];
    const hit=down();assert.ok(hit && Math.abs(hit.point.y-top.y)<.04,'solid fractured chalk top');
    material.side=THREE.FrontSide;assert.ok(Math.abs(hit.distance-down().distance)<1e-5,'chalk top normal faces outward');
  } finally {cuff.dispose();chalk.dispose();material.dispose();}
});

