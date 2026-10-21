import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { createServer } from 'vite';

globalThis.self = globalThis;
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} });
globalThis.ProgressEvent ??= class { constructor(type, data) { Object.assign(this, data); } };
const server = await createServer({ root: new URL('..', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
after(() => server.close());
const { createRigWardrobe } = await server.ssrLoadModule('/src/game/wardrobe-rig.ts');
const { GARMENTS, WARDROBE_SLOTS, DEFAULT_WARDROBE } = await server.ssrLoadModule('/src/game/wardrobe.ts');
const { prepareHumanClips } = await server.ssrLoadModule('/src/game/human-animation.ts');
const assets = await Promise.all(['male', 'female'].map(async sex => {
  const data = readFileSync(new URL(`../public/game/characters/${sex}.glb`, import.meta.url));
  return { sex, gltf: await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '') };
}));
const look = { skin: '#c29172', hair: '#251b15', jacket: '#345b41', pants: '#36383a', shoes: '#252525' };
const combinations = WARDROBE_SLOTS.reduce((rows, slot) => rows.flatMap(row => Object.values(GARMENTS).filter(item => item.slot === slot).map(item => ({ ...row, [slot]: item.id }))), [{}]);

for (const { sex, gltf } of assets) {
  test(`${sex}: all 2,304 wardrobe combinations have complete exclusive drawable skin and fit Idle/Walk/Run at both shape extremes`, () => {
    assert.equal(combinations.length, 2304);
    const model = clone(gltf.scene), originalMeshes = [];
    model.traverse(mesh => { if (mesh.isSkinnedMesh) originalMeshes.push({ mesh, geometry: mesh.geometry, material: mesh.material }); });
    const shared = new Set(originalMeshes.map(entry => entry.geometry));
    let sourceDisposed = 0;
    for (const geometry of shared) geometry.addEventListener('dispose', () => sourceDisposed++);
    const controller = createRigWardrobe(model), inspected = controller.inspect();
    const clips = prepareHumanClips(model, gltf.animations), mixer = new THREE.AnimationMixer(model);
    const actions = clips.map(clip => mixer.clipAction(clip));
    const marks = new Map(inspected.body.map(mesh => [mesh, new Uint8Array(mesh.geometry.getAttribute('position').count)]));
    const skinSnapshots = new Map(inspected.body.map(mesh => [mesh, {
      joints: new Uint16Array(mesh.geometry.getAttribute('skinIndex').array),
      weights: new Float32Array(mesh.geometry.getAttribute('skinWeight').array),
      uv: new Float32Array(mesh.geometry.getAttribute('uv').array),
    }]));
    const ownedGeometry = new Set([...inspected.body, ...inspected.extras].map(mesh => mesh.geometry));
    const ownedMaterials = new Set([...inspected.body, ...inspected.extras].flatMap(mesh => Array.isArray(mesh.material) ? mesh.material : [mesh.material]));
    let geometryDisposals = 0, materialDisposals = 0;
    ownedGeometry.forEach(geometry => geometry.addEventListener('dispose', () => geometryDisposals++));
    ownedMaterials.forEach(material => material.addEventListener('dispose', () => materialDisposals++));
    const point = new THREE.Vector3();
    let coverageKey = '';
    for (const wardrobe of combinations) {
      controller.apply(wardrobe, look);
      const draw = controller.inspect();
      assert.deepEqual(draw.wardrobe, wardrobe);
      assert.equal(draw.extras.filter(mesh => mesh.visible && /head-/.test(mesh.name)).length, wardrobe.head === 'head_none' ? 0 : 1);
      assert.equal(draw.extras.filter(mesh => mesh.visible && /collar/.test(mesh.name)).length, wardrobe.accessory === 'accessory_collar' ? 1 : 0);
      assert.ok(draw.hair.every(mesh => mesh.visible === (wardrobe.head === 'head_none')), 'head coverage masks the original hair instead of intersecting it');
      const key = [wardrobe.top, wardrobe.jacket, wardrobe.pants, wardrobe.shoes].join('/');
      // Each distinct drawable body is checked in full; head/accessory choices do not rebuild it.
      if (coverageKey !== key) {
        for (const mesh of draw.body) {
          const geometry = mesh.geometry, position = geometry.getAttribute('position'), index = geometry.index;
          const occupied = marks.get(mesh); occupied.fill(0);
          assert.equal(index.count, position.count, 'every subdivided original triangle is drawn exactly once');
          let covered = 0;
          for (const group of geometry.groups) {
            assert.equal(group.start, covered, 'material ranges are contiguous');
            assert.equal(group.count % 3, 0);
            assert.ok(mesh.material[group.materialIndex], 'every triangle has a real material');
            for (let i = group.start; i < group.start + group.count; i++) {
              const vertex = index.getX(i);
              assert.equal(occupied[vertex], 0, 'no duplicate skin or clothing triangle'); occupied[vertex] = 1;
            }
            covered += group.count;
          }
          assert.equal(covered, position.count, 'no holes after changing layers');
          assert.ok(occupied.every(value => value === 1));
          const countFor = name => geometry.groups.filter(group => mesh.material[group.materialIndex].name === `wardrobe-${name}`).reduce((sum, group) => sum + group.count, 0);
          assert.ok(countFor('top') + countFor('topSleeve') > 0, 'inner top stays visible through open jackets');
          assert.ok(countFor('pants') + countFor('pantsLower') > 0);
          assert.ok(countFor('shoes') > 0);
          assert.equal(countFor('jacket') > 0, wardrobe.jacket !== 'jacket_none');
          if (wardrobe.pants === 'pants_overalls') {
            assert.ok(countFor('bib') > 0 && countFor('strap') > 0, 'the bib and shoulder straps survive every jacket');
          } else assert.equal(countFor('bib') + countFor('strap'), 0, 'old overalls cannot remain after a swap');
        }
        coverageKey = key;
      }
      for (const [build, height] of [[.8, .8], [1.25, 1.2]]) {
        model.scale.set(build, height, build);
        for (let pose = 0; pose < clips.length; pose++) {
          mixer.stopAllAction(); actions[pose].reset().play(); mixer.setTime(clips[pose].duration * .31);
          model.updateMatrixWorld(true);
          const meshes = [...draw.body, ...draw.extras.filter(mesh => mesh.visible)];
          for (const mesh of meshes) {
            mesh.skeleton.update();
            const attribute = mesh.geometry.getAttribute('position'), indices = mesh.geometry.index;
            // Samples include every visible material boundary and every head/accessory edge.
            const vertices = new Set([0, attribute.count - 1, Math.floor(attribute.count / 2)]);
            for (const group of mesh.geometry.groups) if (group.count) {
              vertices.add(indices ? indices.getX(group.start) : group.start);
              vertices.add(indices ? indices.getX(group.start + group.count - 1) : group.start + group.count - 1);
            }
            for (const vertex of vertices) {
              mesh.getVertexPosition(vertex, point).applyMatrix4(mesh.matrixWorld);
              assert.ok(point.toArray().every(Number.isFinite), `${sex}/${clips[pose].name}: finite animated clothing`);
              assert.ok(Math.abs(point.x) < 1.2 && point.y > -.2 && point.y < 2.7 && Math.abs(point.z) < 1.5,
                `${sex}/${clips[pose].name}: clothing stays on the rig, not in bind-space or at the origin`);
              if (/head-/.test(mesh.name)) assert.ok(point.y > 1.1 * height, 'headwear follows the head, including short characters');
            }
          }
        }
      }
    }
    for (const mesh of inspected.body) {
      const snapshot = skinSnapshots.get(mesh);
      assert.deepEqual(mesh.geometry.getAttribute('skinIndex').array, snapshot.joints, 'swaps preserve bone mapping');
      assert.deepEqual(mesh.geometry.getAttribute('skinWeight').array, snapshot.weights, 'swaps preserve skinning');
      assert.deepEqual(mesh.geometry.getAttribute('uv').array, snapshot.uv, 'source texture coordinates survive');
      const weights = mesh.geometry.getAttribute('skinWeight'), indices = mesh.geometry.getAttribute('skinIndex');
      for (let vertex = 0; vertex < weights.count; vertex++) {
        let total = 0;
        for (let k = 0; k < 4; k++) { total += weights.getComponent(vertex, k); assert.ok(indices.getComponent(vertex, k) < mesh.skeleton.bones.length); }
        assert.ok(Math.abs(total - 1) < 1e-6);
      }
    }
    mixer.stopAllAction(); mixer.uncacheRoot(model);
    controller.dispose(); controller.dispose();
    assert.equal(geometryDisposals, ownedGeometry.size, 'owned geometry is disposed exactly once');
    assert.equal(materialDisposals, ownedMaterials.size, 'owned materials are disposed exactly once');
    assert.equal(sourceDisposed, 0, 'shared GLTF geometry remains usable by NPCs and the next actor');
    for (const entry of originalMeshes) { assert.equal(entry.mesh.geometry, entry.geometry); assert.equal(entry.mesh.material, entry.material); }
    assert.ok(inspected.extras.every(mesh => mesh.parent === null));
  });
  test(`${sex}: changing the player wardrobe never mutates an independently cloned NPC or GLTF source`, () => {
    const player = clone(gltf.scene), npc = clone(gltf.scene);
    const npcState = [];
    npc.traverse(mesh => { if (mesh.isSkinnedMesh) npcState.push({ mesh, material: mesh.material, geometry: mesh.geometry, index: mesh.geometry.index, visible: mesh.visible }); });
    const controller = createRigWardrobe(player);
    controller.apply(DEFAULT_WARDROBE, look);
    const editable = controller.inspect().body[0].material;
    for (const [region, color] of [['top', look.jacket], ['pants', look.pants], ['shoes', look.shoes]]) {
      assert.equal(editable.find(material => material.name === `wardrobe-${region}`).color.getHexString(), new THREE.Color(color).getHexString(), 'basic clothing retains the existing editor color');
    }
    controller.apply(DEFAULT_WARDROBE, { ...look, jacket: '#ff1111', pants: '#11ff11', shoes: '#1111ff' });
    for (const [region, color] of [['top', '#ff1111'], ['pants', '#11ff11'], ['shoes', '#1111ff']]) {
      assert.equal(editable.find(material => material.name === `wardrobe-${region}`).color.getHexString(), new THREE.Color(color).getHexString(), 'color-only changes update the current clothes without rebuilding the skin');
    }
    controller.apply({ ...DEFAULT_WARDROBE, pants: 'pants_overalls', jacket: 'jacket_leather', head: 'head_beanie' }, look);
    for (const entry of npcState) {
      assert.equal(entry.mesh.material, entry.material); assert.equal(entry.mesh.geometry, entry.geometry);
      assert.equal(entry.mesh.geometry.index, entry.index); assert.equal(entry.mesh.visible, entry.visible);
    }
    controller.dispose();
  });
}
