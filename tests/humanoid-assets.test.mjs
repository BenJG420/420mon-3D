import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
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
    assert.ok(asset.images.length>=3);
    assert.ok(asset.images.every(image=>image.bufferView!==undefined&&!image.uri));
    assert.ok(asset.buffers.every(buffer=>!buffer.uri));
  }
});
