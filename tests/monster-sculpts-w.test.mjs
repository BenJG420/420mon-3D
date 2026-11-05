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
const ids = ['bong','ubend','teststrip','heavybag','mapscrap','whip'].map(slug => `mon_${slug}`);

test('Dex 163–168 retain their source designs as distinct rounded, bounded full-volume sculptures', async (t) => {
  assert.deepEqual(DEX_ORDER.slice(162,168), ids);
  assert.deepEqual(AUTHORED_MONSTER_IDS.slice(162,168), ids);
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

test('Teststrip fields and curled Mapscrap eye interiors remain visible behind actual openings', () => {
  const material=new THREE.MeshBasicMaterial({side:THREE.FrontSide});
  try {
    for(const [id,hex,depth] of [['mon_teststrip','#392d4b',.025],['mon_teststrip','#3b2343',.025],['mon_mapscrap','#29182f',.07]]) {
      const geometry=authoredMonsterGeometry(id);
      try {
        const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
        const center=mean(coloredPoints(geometry,hex));
        const ray=x=>new THREE.Raycaster(new THREE.Vector3(x,center.y,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
        const inside=ray(center.x),front=ray(center.x+.22);
        assert.ok(inside && front,`${id}: opening and surrounding material`);
        const actual=new THREE.Color().fromBufferAttribute(geometry.getAttribute('color'),inside.face.a),target=new THREE.Color(hex);
        assert.ok(Math.abs(actual.r-target.r)<1e-5 && Math.abs(actual.g-target.g)<1e-5 && Math.abs(actual.b-target.b)<1e-5,`${id}: dark interior is unobstructed`);
        assert.ok(front.point.z-inside.point.z>depth,`${id}: real cavity depth`);
        material.side=THREE.DoubleSide;assert.ok(Math.abs(inside.distance-ray(center.x).distance)<1e-5,`${id}: interior faces forward`);material.side=THREE.FrontSide;
      } finally {geometry.dispose();}
    }
  } finally {material.dispose();}
});

test('Ubend mouths have deep visible inner walls and Heavybag chain links are genuinely open', () => {
  const pipe=authoredMonsterGeometry('mon_ubend'),bag=authoredMonsterGeometry('mon_heavybag'),material=new THREE.MeshBasicMaterial({side:THREE.FrontSide});
  try {
    const mesh=new THREE.Mesh(pipe,material);mesh.updateMatrixWorld(true);
    const down=x=>new THREE.Raycaster(new THREE.Vector3(x,3,-.025),new THREE.Vector3(0,-1,0)).intersectObject(mesh)[0];
    for(const side of [-1,1]) {
      const inside=down(side*.576),rim=down(side*.747);
      assert.ok(inside && rim,'both pipe mouths and inner walls exist');assert.ok(rim.point.y-inside.point.y>.15,'real hollow pipe, not a dark top decal');
      const color=new THREE.Color().fromBufferAttribute(pipe.getAttribute('color'),inside.face.a),target=new THREE.Color('#484c46');
      assert.ok(Math.abs(color.r-target.r)<1e-5 && Math.abs(color.g-target.g)<1e-5 && Math.abs(color.b-target.b)<1e-5,'the ray reaches the inward-facing pipe wall');
      material.side=THREE.DoubleSide;assert.ok(Math.abs(inside.distance-down(side*.576).distance)<1e-5,'inner walls face into the pipe');material.side=THREE.FrontSide;
    }
    material.side=THREE.DoubleSide;const chain=new THREE.Mesh(bag,material);chain.updateMatrixWorld(true);
    const ray=x=>new THREE.Raycaster(new THREE.Vector3(x,.537,3),new THREE.Vector3(0,0,-1)).intersectObject(chain);
    assert.equal(ray(0).length,0,'chain center is open through the model');assert.ok(ray(.020).length>0,'adjacent metal link remains');
  } finally {pipe.dispose();bag.dispose();material.dispose();}
});

test('all six new sculptures use the existing studio PBR and release only their owned resources', async () => {
  const originalLoad=THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load=function (_url,onLoad) {
    const texture=new THREE.Texture();queueMicrotask(()=>onLoad?.(texture));return texture;
  };
  const surface=createMonsterSurface(32,{studio:true}),groups=[];let art;
  try {
    art=await server.ssrLoadModule('/src/game/monster-art.ts');
    for(const id of ids)groups.push(art.createMonsterArt(id,0x56ead0,{surface}));
    await new Promise(resolve=>setImmediate(resolve));
    for(const group of groups) {
      assert.equal(group.userData.modelStatus,'ready');assert.equal(group.userData.surfaceTextureSize,32);
      const mesh=group.children[0].children[0];assert.ok([surface.material,surface.metal,surface.wet].includes(mesh.material),'existing shared surface selection');
      assert.strictEqual(mesh.material.normalMap,surface.normalMap);assert.notStrictEqual(mesh.material,surface.glow,'no new emission path');
    }
    let released=0;surface.normalMap.addEventListener('dispose',()=>released++);
    for(const group of groups)art.disposeMonsterArt(group);assert.equal(released,0,'viewer owns the studio texture');
    surface.dispose();surface.dispose();assert.equal(released,1);
  } finally {
    THREE.TextureLoader.prototype.load=originalLoad;
    if(art)for(const group of groups)art.disposeMonsterArt(group);
    surface.dispose();
  }
});
