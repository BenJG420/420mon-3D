import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { createServer } from 'vite';

const server = await createServer({root:new URL('..',import.meta.url).pathname,server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
after(()=>server.close());
const { DEX_ORDER } = await server.ssrLoadModule('/src/game/data/dex.ts');
const { authoredMonsterGeometry, AUTHORED_MONSTER_IDS } = await server.ssrLoadModule('/src/game/monster-authored.ts');
const { acquireMonsterModel } = await server.ssrLoadModule('/src/game/monster-models.ts');
const ids=['weldmask','drainplug','callbox','hydrant','growbulb','patchcoil'].map(slug=>`mon_${slug}`);

test('Dex 97–102 are distinct full-volume authored sculpts with authenticated original references', async()=>{
  assert.deepEqual(DEX_ORDER.slice(96,102),ids);
  assert.equal(AUTHORED_MONSTER_IDS.length,102);
  const signatures=new Set();
  for(const id of ids){
    const geometry=authoredMonsterGeometry(id), slug=id.slice(4);
    try {
      const data=JSON.parse(await readFile(new URL(`../public/game/models/${slug}.json`,import.meta.url),'utf8'));
      const source=await readFile(new URL(`../public/game/sprites/${slug}.svg`,import.meta.url));
      assert.equal(geometry.userData.sourceSpecies,id);
      assert.equal(geometry.userData.sourceSprite,slug);
      assert.equal(geometry.userData.sourceHash,data.sourceHash);
      assert.equal(geometry.userData.sourceHash,createHash('sha256').update(source).digest('hex'));
      const size=geometry.boundingBox.getSize(new THREE.Vector3());
      assert.ok(Math.max(size.x,size.y,size.z)<=1.601 && size.z>.25,`${id}: actual 3D depth`);
      assert.ok(Math.abs(geometry.boundingBox.min.y+.8)<1e-6,`${id}: aligned ground`);
      const positions=geometry.getAttribute('position'), normals=geometry.getAttribute('normal');
      assert.ok(positions.count/3>2000 && positions.count/3<30000,`${id}: ${positions.count/3} triangles`);
      for(const name of ['position','normal','color']) for(const value of geometry.getAttribute(name).array) assert.ok(Number.isFinite(value),`${id}: finite ${name}`);
      let smooth=0;
      for(let i=0;i<normals.count;i+=13){
        const n=new THREE.Vector3().fromBufferAttribute(normals,i);
        if(n.length()>.5)assert.ok(Math.abs(n.length()-1)<.001,`${id}: unit surface normal`);
        if(Math.abs(n.x)>.1&&Math.abs(n.y)>.1&&Math.abs(n.z)>.1)smooth++;
      }
      assert.ok(smooth>20,`${id}: rounded surfaces, not a block extrusion`);
      signatures.add(createHash('sha256').update(Buffer.from(positions.array.buffer)).digest('hex'));
    } finally {geometry.dispose();}
  }
  assert.equal(signatures.size,6);
  assert.equal(authoredMonsterGeometry('mon_flicker'),null,'next package stays honestly marked as reconstruction');
});

test('new sculpts enter the existing leased UV/PBR cache without fetching replacement artwork',async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=()=>{throw new Error('authored model must be local geometry');};
  const leases=[];
  try {
    for(const id of ids){
      const a=await acquireMonsterModel(id),b=await acquireMonsterModel(id);leases.push(a,b);
      assert.strictEqual(a.geometry,b.geometry);assert.equal(a.kind,'sculpted');
      assert.equal(a.geometry.getAttribute('uv').count,a.geometry.getAttribute('position').count);
      for(const value of a.geometry.getAttribute('uv').array)assert.ok(Number.isFinite(value));
      let disposed=0;a.geometry.addEventListener('dispose',()=>disposed++);
      a.release();a.release();assert.equal(disposed,0,'another active lease retains its model');
      b.release();
    }
  }finally{leases.forEach(lease=>lease.release());globalThis.fetch=originalFetch;}
});

test('Growbulb has localized core emission while the neck and feet remain shaded',()=>{
  const geometry=authoredMonsterGeometry('mon_growbulb');
  try {
    const weights=geometry.getAttribute('glowWeight');assert.ok(weights);
    assert.equal(geometry.userData.glowSurface,true);
    assert.equal(weights.count,geometry.getAttribute('position').count);
    let glowing=0,unlit=0;
    for(const value of weights.array){assert.ok(value>=0&&value<=1);if(value>.1)glowing++;else unlit++;}
    assert.ok(glowing>100 && unlit>100,'emissive core and opaque fittings both exist');
  }finally{geometry.dispose();}
});
