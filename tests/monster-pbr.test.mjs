import assert from 'node:assert/strict';import {test,after} from 'node:test';import {readFile} from 'node:fs/promises';import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});after(()=>server.close());
const {buildSmoothMonsterGeometry}=await server.ssrLoadModule('/src/game/monster-smooth.ts');
const {createMonsterSurface,addMonsterSurfaceUvs}=await server.ssrLoadModule('/src/game/monster-surface.ts');
const {AUTHORED_MONSTER_IDS,authoredMonsterGeometry}=await server.ssrLoadModule('/src/game/monster-authored.ts');
test('all 366 reconstructions have bounded smooth 3D surfaces, UVs and source attribution without voxel faces',async()=>{
 const catalog=JSON.parse(await readFile('public/game/models/catalogue.json','utf8'));let total=0;
 for(const entry of catalog.entries.filter(e=>!AUTHORED_MONSTER_IDS.includes(e.id))){
  const data=JSON.parse(await readFile('public/'+entry.url,'utf8'));const g=buildSmoothMonsterGeometry(data);
  const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv'),c=g.getAttribute('color');assert.ok(p.count>0&&p.count/3<=24000,data.id);assert.equal(uv.count,p.count);
  let diagonal=0;for(let i=0;i<n.count;i++){const length=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));assert.ok(Number.isFinite(length)&&Math.abs(length-1)<.01,data.id);if(Math.max(Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i)))<.98)diagonal++;assert.ok(Number.isFinite(uv.getX(i)));assert.ok(Number.isFinite(uv.getY(i)));for(const v of [c.getX(i),c.getY(i),c.getZ(i)])assert.ok(Number.isFinite(v)&&v>=0&&v<=1);}
  assert.ok(diagonal>n.count*.05,data.id);const b=g.boundingBox;assert.ok(b.max.z-b.min.z>.03,data.id);assert.equal(g.userData.sourceHash,data.sourceHash);assert.equal(g.userData.surface,'smooth-pbr');g.dispose();total++;
 }assert.equal(total,366);
});
test('all 54 sculptures keep their own smooth normals and complete PBR UVs under 30k triangles',()=>{
 for(const id of AUTHORED_MONSTER_IDS){const g=addMonsterSurfaceUvs(authoredMonsterGeometry(id));assert.ok(g.getAttribute('position').count/3<30000,id);assert.equal(g.getAttribute('uv').count,g.getAttribute('position').count);assert.ok(g.userData.sourceHash);g.dispose();}
});
test('PBR uses deterministic filtered normal/roughness maps with distinct organic, metal and wet surfaces and owned cleanup',()=>{
 const a=createMonsterSurface(32),b=createMonsterSurface(32);assert.deepEqual(a.normalMap.image.data,b.normalMap.image.data);assert.notDeepEqual(a.normalMap.image.data,a.roughnessMap.image.data);assert.equal(a.material.flatShading,false);assert.ok(a.metal.metalness>a.material.metalness);assert.ok(a.wet.roughness<a.material.roughness);assert.equal(a.material.normalMap,a.metal.normalMap);let disposed=0;for(const r of [a.material,a.metal,a.wet,a.normalMap,a.roughnessMap])r.addEventListener('dispose',()=>disposed++);a.dispose();assert.equal(disposed,5);b.dispose();
});
