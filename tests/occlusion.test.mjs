import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { createServer } from 'vite';
const server = await createServer({server:{middlewareMode:true}, appType:'custom', logLevel:'silent'});
after(()=>server.close());
const {createPlayerOcclusion}=await server.ssrLoadModule('/src/game/occlusion.ts');
const THREE=await import('three');
const v=(x,y,z)=>new THREE.Vector3(x,y,z);
function mesh(x,y,z,w=3,h=4,d=1){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial());m.position.set(x,y,z);m.castShadow=true;return m;}
function settle(controller,blocks,camera,player,n=60){let count;for(let i=0;i<n;i++)count=controller.update(blocks,camera,player,1/60);return count;}
test('whole house fades including roof trim; unrelated houses and camera/collision geometry stay intact',()=>{
 const wall=mesh(0,2,3),trim=mesh(0,4.5,3),other=mesh(12,2,3);wall.userData.occlusionGroup=trim.userData.occlusionGroup='house';
 const materialVersion=wall.material.version;
 const blocks=[wall,trim,other],c=createPlayerOcclusion(),camera=v(0,3,8),player=v(0,0,0),before=wall.geometry.attributes.position.array.slice();
 assert.equal(settle(c,blocks,camera,player),1);assert.ok(wall.material.opacity<.07);assert.equal(trim.material.opacity,wall.material.opacity);assert.equal(other.material.opacity,1);assert.ok(wall.material.version>materialVersion, "transparent transition recompiles the opaque shader variant");assert.equal(wall.castShadow,false);assert.equal(wall.material.depthWrite,false);assert.deepEqual(wall.geometry.attributes.position.array,before);assert.deepEqual(camera,v(0,3,8));
 settle(c,blocks,v(8,3,0),player);assert.equal(wall.material.opacity,1);assert.equal(wall.material.transparent,false);assert.equal(wall.castShadow,true);c.dispose();
});
test('head/shoulder corridor and camera inside a building are detected; geometry behind the player is ignored',()=>{
 const c=createPlayerOcclusion(),head=mesh(0,1.9,3,1,.45,1),behind=mesh(0,2,-5);const blocks=[head,behind];
 settle(c,blocks,v(0,2,8),v(0,0,0));assert.ok(head.material.opacity<.07);assert.equal(behind.material.opacity,1);
 settle(c,blocks,v(0,1.9,3),v(0,0,0));assert.ok(head.material.opacity<.07);c.dispose();assert.equal(head.material.opacity,1);
});
test('map replacement and dispose restore exact original multi-material transparency/depth/shadows',()=>{
 const c=createPlayerOcclusion(),m=mesh(0,2,3);m.material=[new THREE.MeshBasicMaterial({opacity:.6,transparent:true,depthWrite:false}),new THREE.MeshBasicMaterial()];m.castShadow=false;
 settle(c,[m],v(0,3,8),v(0,0,0));assert.ok(m.material[0].opacity<.6);c.update([],v(0,3,8),v(0,0,0),.016);
 assert.equal(m.material[0].opacity,.6);assert.equal(m.material[0].transparent,true);assert.equal(m.material[0].depthWrite,false);assert.equal(m.material[1].opacity,1);assert.equal(m.castShadow,false);c.dispose();
});
