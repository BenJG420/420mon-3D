import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {createServer} from 'vite';
// Real GLTF skins and animation tracks; only image decoding is irrelevant to CPU pose tests.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
globalThis.ProgressEvent??=class {constructor(type,data){Object.assign(this,data)}};
const server=await createServer({root:new URL('..',import.meta.url).pathname,server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
after(()=>server.close());
const {mapHumanBones,prepareHumanClips,createHumanAnimation}=await server.ssrLoadModule('/src/game/human-animation.ts');
const assets=await Promise.all(['male','female'].map(async sex=>{
 const bytes=readFileSync(new URL(`../public/game/characters/${sex}.glb`,import.meta.url));
 return {sex,gltf:await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')};
}));
const position=bone=>bone.getWorldPosition(new THREE.Vector3());
function assertPose(model,bones,label){
 model.updateMatrixWorld(true);
 for(const side of ['left','right']){
  const shoulder=position(bones[`${side}Shoulder`]),elbow=position(bones[`${side}Elbow`]);
  const arm=elbow.clone().sub(shoulder).normalize();
  assert.ok(arm.y<-.18,`${label}/${side}: upper arm must hang/swing below shoulder, not T-pose`);
  const hip=position(bones[`${side}Hip`]),knee=position(bones[`${side}Knee`]),ankle=position(bones[`${side}Ankle`]);
  const axis=ankle.clone().sub(hip).normalize();
  const projection=hip.clone().addScaledVector(axis,knee.clone().sub(hip).dot(axis));
  assert.ok(knee.z-projection.z>-.025,`${label}/${side}: knee must not fold backwards`);
  assert.ok(knee.distanceTo(hip)>.25&&knee.distanceTo(hip)<.6,`${label}: connected thigh`);
  assert.ok(knee.distanceTo(ankle)>.25&&knee.distanceTo(ankle)<.6,`${label}: connected calf`);
 }
}
for(const {sex,gltf} of assets){
 test(`${sex}: actual Idle/Walk/Run limb poses and skin stay anatomical throughout each cycle`,()=>{
  const model=clone(gltf.scene),bones=mapHumanBones(model),clips=prepareHumanClips(model,gltf.animations);
  const mixer=new THREE.AnimationMixer(model);
  for(const clip of clips){
   mixer.stopAllAction();mixer.clipAction(clip).reset().play();
   for(let sample=0;sample<48;sample++){
    mixer.setTime(clip.duration*sample/48);assertPose(model,bones,`${sex}/${clip.name}/${sample}`);
    model.traverse(mesh=>{
     if(!(mesh instanceof THREE.SkinnedMesh))return;
     mesh.skeleton.update();
     for(let v=0;v<mesh.geometry.getAttribute('position').count;v+=97){
      const point=mesh.getVertexPosition(v,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);
      assert.ok(point.toArray().every(Number.isFinite)&&point.length()<4,`${sex}/${clip.name}: bounded deforming skin`);
     }
    });
   }
  }
  mixer.stopAllAction();mixer.uncacheRoot(model);
 });
 test(`${sex}: player and independent NPC mixers retain foot phase through sprint/stop/restart`,()=>{
  const player=clone(gltf.scene),npc=clone(gltf.scene);
  const playerBones=mapHumanBones(player),npcBones=mapHumanBones(npc);
  const controller=createHumanAnimation(player,gltf.animations),other=createHumanAnimation(npc,gltf.animations);
  for(let i=0;i<45;i++)controller.update(1/60,4.2,false);
  const before=controller.diagnostics().phase;
  controller.update(0,7,true);assert.equal(controller.diagnostics().phase,before);
  const npcHand=position(npcBones.leftWrist);
  for(const [speed,sprint] of [[7,true],[4.2,false],[0,false],[4.2,false],[7,true]]){
   for(let i=0;i<24;i++){
    controller.update(1/60,speed,sprint);assertPose(player,playerBones,`${sex}/blend/${speed}/${i}`);
    const state=controller.diagnostics();
    assert.ok(Math.abs(Object.values(state.weights).reduce((a,b)=>a+b,0)-1)<1e-6,'no unweighted bind/T-pose frame');
   }
  }
  assert.ok(position(npcBones.leftWrist).distanceTo(npcHand)<1e-8,'another actor cannot mutate this skeleton');
  for(let i=0;i<60;i++)other.update(1/60,2.4,false);
  assertPose(npc,npcBones,`${sex}/NPC-walk`);
  controller.dispose();other.dispose();
 });
}
test('missing or wrongly connected limb mappings reject the rig instead of silently playing a partial T-pose',()=>{
 const {gltf}=assets[0],model=clone(gltf.scene),bones=mapHumanBones(model);
 bones.leftKnee.removeFromParent();
 assert.throws(()=>mapHumanBones(model),/missing|invalid/);
});
