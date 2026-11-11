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
const ids = ['circsaw','tidegate','sawhorse','gutter','growtimer','mouse'].map(slug => `mon_${slug}`);

test('Dex 169–174 retain their source designs as distinct rounded, bounded full-volume sculptures', async (t) => {
  assert.deepEqual(DEX_ORDER.slice(168,174), ids);
  assert.deepEqual(AUTHORED_MONSTER_IDS.slice(168,174), ids);
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

test('Tidegate amber eyes are recessed behind true openings and gate bars stand ahead of the water chamber', () => {
  const geometry=authoredMonsterGeometry('mon_tidegate'),material=new THREE.MeshBasicMaterial({side:THREE.FrontSide});
  try {
    const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
    const points=coloredPoints(geometry,'#fff0b7'),middle=(Math.min(...points.map(p=>p.x))+Math.max(...points.map(p=>p.x)))/2;
    const ray=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
    for(const side of [-1,1]) {
      const center=mean(points.filter(p=>(p.x-middle)*side>0)),inside=ray(center.x,center.y),front=ray(middle,center.y);
      assert.ok(inside && front,'eye and frame exist');
      const color=new THREE.Color().fromBufferAttribute(geometry.getAttribute('color'),inside.face.a),target=new THREE.Color('#fff0b7');
      assert.ok(Math.abs(color.r-target.r)<1e-5 && Math.abs(color.g-target.g)<1e-5 && Math.abs(color.b-target.b)<1e-5,'front opening exposes amber eye');
      assert.ok(front.point.z-inside.point.z>.02,'eye lies behind real front rail');
      material.side=THREE.DoubleSide;assert.ok(Math.abs(inside.distance-ray(center.x,center.y).distance)<1e-5,'eye faces outward');material.side=THREE.FrontSide;
    }
    const chamber=ray(0,-.1),bar=ray(.11,-.1);assert.ok(chamber && bar,'rear chamber and front bar');
    assert.ok(bar.point.z-chamber.point.z>.2,'actual depth through the gate gap');
  } finally {geometry.dispose();material.dispose();}
});

test('Circsaw handle is open through its rear and Gutter contents sit inside a deep stone trough', () => {
  const saw=authoredMonsterGeometry('mon_circsaw'),gutter=authoredMonsterGeometry('mon_gutter'),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  try {
    const sawMesh=new THREE.Mesh(saw,material);sawMesh.updateMatrixWorld(true);
    const across=x=>new THREE.Raycaster(new THREE.Vector3(x,.67,3),new THREE.Vector3(0,0,-1)).intersectObject(sawMesh);
    assert.equal(across(0).length,0,'no back plate closes the handle');assert.ok(across(-.16).length>0,'handle wire remains');
    const bowl=new THREE.Mesh(gutter,material);bowl.updateMatrixWorld(true);
    const down=x=>new THREE.Raycaster(new THREE.Vector3(x,3,0),new THREE.Vector3(0,-1,0)).intersectObject(bowl)[0];
    const inside=down(0),rim=down(.74);assert.ok(inside && rim,'debris and rim exist');
    assert.ok(rim.point.y-inside.point.y>.18,'leaf litter lies well below the stone lip');
    material.side=THREE.FrontSide;assert.ok(Math.abs(inside.distance-down(0).distance)<1e-5,'contents have outward top faces');
  } finally {saw.dispose();gutter.dispose();material.dispose();}
});

test('Growtimer lower dial face remains visible above the opaque housing lid', () => {
  const geometry=authoredMonsterGeometry('mon_growtimer'),material=new THREE.MeshBasicMaterial({side:THREE.FrontSide});
  try {
    const points=coloredPoints(geometry,'#e9dfb7'),center=mean(points);
    const scale=(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)))/.45;
    const normal=new THREE.Vector3(0,Math.sin(.75),Math.cos(.75)),up=new THREE.Vector3(0,Math.cos(.75),-Math.sin(.75));
    const lowerFace=center.clone().addScaledVector(up,-.207*scale).addScaledVector(normal,.0065*scale);lowerFace.x+=.04*scale;
    const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
    const hit=new THREE.Raycaster(lowerFace.clone().addScaledVector(normal,3),normal.clone().negate()).intersectObject(mesh)[0];
    assert.ok(hit && hit.point.distanceTo(lowerFace)<.018*scale,'the ray reaches the lower dial, not an occluding beige lid');
  } finally {geometry.dispose();material.dispose();}
});

test('Tidegate, Growtimer and Mouse isolate luminous eyes within the existing shared studio PBR', async () => {
  const originalLoad=THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load=function (_url,onLoad) {
    const texture=new THREE.Texture();queueMicrotask(()=>onLoad?.(texture));return texture;
  };
  const surface=createMonsterSurface(32,{studio:true}),groups=[];let art;
  try {
    art=await server.ssrLoadModule('/src/game/monster-art.ts');
    for(const id of ['mon_tidegate','mon_growtimer','mon_mouse','mon_keycap','mon_sawhorse'])groups.push(art.createMonsterArt(id,0x56ead0,{surface}));
    await new Promise(resolve=>setImmediate(resolve));
    for(const group of groups){assert.equal(group.userData.modelStatus,'ready');assert.equal(group.userData.surfaceTextureSize,32);}
    for(const group of groups.slice(0,4)) {
      const mesh=group.children[0].children[0];assert.strictEqual(mesh.material,surface.glow);
      const weights=mesh.geometry.getAttribute('glowWeight');assert.equal(weights.count,mesh.geometry.getAttribute('position').count);
      let lit=0,dark=0;
      for(const value of weights.array){assert.ok(value>=0 && value<=1);if(value>.1)lit++;else dark++;}
      assert.ok(lit>100 && dark>100,'body stays shaded outside eye lenses');
    }
    assert.notStrictEqual(groups[4].children[0].children[0].material,surface.glow);
    let released=0;surface.normalMap.addEventListener('dispose',()=>released++);
    for(const group of groups)art.disposeMonsterArt(group);assert.equal(released,0,'viewer owns the studio texture');
    surface.dispose();surface.dispose();assert.equal(released,1);
  } finally {
    THREE.TextureLoader.prototype.load=originalLoad;
    if(art)for(const group of groups)art.disposeMonsterArt(group);
    surface.dispose();
  }
});
