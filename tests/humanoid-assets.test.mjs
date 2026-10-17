import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Matrix4,Vector3,Quaternion} from 'three';
const base=new URL('../public/game/characters/',import.meta.url);
const sources=JSON.parse(readFileSync(new URL('sources.json',base),'utf8'));
test('both redistributable human assets bundle a real weighted skeleton, three nonempty clips and all textures',()=>{
  assert.match(readFileSync(new URL('LICENSE.txt',base),'utf8'),/Copyright \(c\) 2020 Microsoft/);
  for(const output of sources.outputs){
    const data=readFileSync(new URL(output.file,base));
    assert.equal(createHash('sha256').update(data).digest('hex'),output.sha256);
    assert.equal(data.readUInt32LE(0),0x46546c67);
    const asset=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
    assert.ok(asset.skins[0].joints.length>=60);
    assert.deepEqual(asset.animations.map(a=>a.name).sort(),['Idle','Run','Walk']);
    for(const animation of asset.animations){
      assert.ok(animation.channels.filter(c=>c.target.path==='rotation').length>=60);
      assert.ok(animation.samplers.every(s=>asset.accessors[s.input].count>1));
    }
    for(const mesh of asset.meshes)for(const primitive of mesh.primitives){
      assert.ok(primitive.attributes.JOINTS_0!==undefined);
      assert.ok(primitive.attributes.WEIGHTS_0!==undefined);
    }
    // The clip FBXs have different rest bases. An authentic idle must place
    // both wrists near the hips rather than preserve the avatar's A-pose.
    const parents=new Map();asset.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>parents.set(c,i)));
    const world=index=>{
      const n=asset.nodes[index],m=new Matrix4().compose(new Vector3(...(n.translation??[0,0,0])),new Quaternion(...(n.rotation??[0,0,0,1])),new Vector3(...(n.scale??[1,1,1])));
      return parents.has(index)?world(parents.get(index)).multiply(m):m;
    };
    const point=name=>new Vector3().setFromMatrixPosition(world(asset.nodes.findIndex(n=>n.name===name)));
    const pelvis=point('Bip01 Pelvis'),head=point('Bip01 Head');
    for(const side of ['L','R']){
      const hand=point(`Bip01 ${side} Hand`);
      assert.ok(Math.abs(hand.x-pelvis.x)<.4,`${output.file}: idle wrist must hang beside the body`);
      assert.ok(hand.y<head.y-.35,`${output.file}: idle wrist stays below shoulders`);
    }
    assert.ok(asset.images.length>=3);
    assert.ok(asset.images.every(image=>image.bufferView!==undefined&&!image.uri));
    assert.ok(asset.buffers.every(buffer=>!buffer.uri));
  }
});
