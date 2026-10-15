import assert from "node:assert/strict";
import { test, after } from "node:test";
import * as THREE from "three";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
const { createClothingVisuals } = await server.ssrLoadModule("/src/game/clothing-visuals.ts");
const ids = ["nude", "wear_trashbag", "wear_collar", "wear_jacket", "wear_vest", "wear_coat", "wear_hoodie", "wear_track", "wear_rain", "wear_overalls", "wear_lack"];

function fixture() {
  const character = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xc4a68d });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x607848 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x171f2c });
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const part = (parent, material, scale, position) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(...scale); mesh.position.set(...position); parent.add(mesh); return mesh;
  };
  const torso = part(character, shirt, [.78, .88, .4], [0, 1.36, 0]);
  const leftArm = new THREE.Group(), rightArm = new THREE.Group();
  const leftLeg = new THREE.Group(), rightLeg = new THREE.Group();
  leftArm.position.set(-.51, 1.72, 0); rightArm.position.set(.51, 1.72, 0);
  leftLeg.position.set(-.2, .9, 0); rightLeg.position.set(.2, .9, 0);
  character.add(leftArm, rightArm, leftLeg, rightLeg);
  const leftArmMesh = part(leftArm, shirt, [.23, .7, .28], [0, -.35, 0]);
  const rightArmMesh = part(rightArm, shirt, [.23, .7, .28], [0, -.35, 0]);
  const leftLegMesh = part(leftLeg, pants, [.28, .69, .3], [0, -.36, 0]);
  const rightLegMesh = part(rightLeg, pants, [.28, .69, .3], [0, -.36, 0]);
  const leftBoot = part(leftLeg, pants, [.32, .22, .47], [0, -.76, .07]);
  const rightBoot = part(rightLeg, pants, [.32, .22, .47], [0, -.76, .07]);
  const shoulderTrim = new THREE.Group(), jacketAccent = new THREE.Group(), belt = new THREE.Group();
  character.add(shoulderTrim, jacketAccent, belt);
  const rig = { character, torso, leftArm, rightArm, leftLeg, rightLeg, leftArmMesh, rightArmMesh, leftLegMesh, rightLegMesh, skin, shoulderTrim, jacketAccent, belt };
  const controller = createClothingVisuals(rig);
  return { ...rig, controller, shirt, pants, geometry, leftBoot, rightBoot };
}
function clothingGroups(rig) {
  const result = [];
  rig.character.traverse(object => { if (object.userData.clothingOutfit) result.push(object); });
  return result;
}
function visibleMeshes(rig) {
  const result = [];
  rig.character.traverseVisible(object => { if (object.isMesh) result.push(object); });
  return result;
}

test("all ten source outfits have distinct cached geometry on the same character", () => {
  const rig = fixture();
  const geometryIds = new Set();
  rig.character.traverse(object => { if (object.isMesh) geometryIds.add(object.geometry.uuid); });
  const initialObjects = [];
  rig.character.traverse(object => initialObjects.push(object.uuid));
  const signatures = new Set();
  for (const id of ids) {
    rig.controller.apply(id);
    assert.equal(rig.controller.current(), id);
    assert.equal(clothingGroups(rig).filter(group => group.visible).length, 5);
    assert.ok(clothingGroups(rig).filter(group => group.visible).every(group => group.userData.clothingOutfit === id));
    const meshes = visibleMeshes(rig);
    assert.ok(meshes.length < 60, `${id} stays modest for phones`);
    signatures.add(meshes.map(mesh => [mesh.geometry.type, ...mesh.scale.toArray(), ...mesh.position.toArray(), mesh.material.color?.getHex()]).sort().join("|"));
  }
  assert.equal(signatures.size, 11, "gear must change the rendered form and source palette");
  for (let round = 0; round < 4; round++) for (const id of ids) rig.controller.apply(id);
  const finalObjects = [], finalGeometryIds = new Set();
  rig.character.traverse(object => { finalObjects.push(object.uuid); if (object.isMesh) finalGeometryIds.add(object.geometry.uuid); });
  assert.deepEqual(finalObjects, initialObjects);
  assert.deepEqual(finalGeometryIds, geometryIds);
  rig.controller.dispose();
});

test("short source outfits expose skin while full outfits retain their own colors and hair stays untouched", () => {
  const rig = fixture();
  const hair = new THREE.Group(); hair.name = "custom-hair"; rig.character.add(hair);
  for (const id of ["nude", "wear_trashbag", "wear_collar"]) {
    rig.controller.apply(id);
    assert.equal(rig.leftLegMesh.material, rig.skin);
    assert.equal(rig.rightLegMesh.material, rig.skin);
    assert.equal(rig.leftArmMesh.material, rig.skin);
    assert.equal(rig.rightArmMesh.material, rig.skin);
    assert.equal(visibleMeshes(rig).filter(mesh => mesh.name === "shorts").length, 2);
  }
  rig.controller.apply("wear_rain");
  assert.notEqual(rig.leftLegMesh.material, rig.skin);
  const yellow = visibleMeshes(rig).find(mesh => mesh.name === "sleeve").material.color.getHex();
  rig.shirt.color.set(0xff00ff);
  assert.equal(visibleMeshes(rig).find(mesh => mesh.name === "sleeve").material.color.getHex(), yellow);
  rig.controller.apply("nude");
  assert.equal(rig.torso.material, rig.shirt);
  assert.equal(rig.torso.material.color.getHex(), 0xff00ff);
  assert.equal(hair.parent, rig.character);
  assert.equal(hair.visible, true);
  assert.equal(rig.shoulderTrim.visible, false);
  assert.equal(rig.jacketAccent.visible, false);
  assert.equal(rig.belt.visible, false);
  rig.controller.dispose();
});

test("source silhouettes include a torn bag, long split coat, open face, collar ring and dungaree bib", () => {
  const rig = fixture();
  rig.controller.apply("wear_trashbag");
  const torn = visibleMeshes(rig).filter(mesh => mesh.geometry.type === "ExtrudeGeometry");
  assert.equal(torn.length, 2);
  assert.ok(torn.every(mesh => mesh.geometry.parameters.shapes.holes.length > 0));
  rig.controller.apply("wear_coat");
  const tails = visibleMeshes(rig).filter(mesh => mesh.name === "split-coat-tail");
  assert.equal(tails.length, 2);
  assert.ok(tails.every(mesh => new THREE.Box3().setFromObject(mesh).min.y < .15));
  rig.controller.apply("wear_hoodie");
  assert.ok(visibleMeshes(rig).filter(mesh => mesh.name.startsWith("folded-hood")).every(mesh => new THREE.Box3().setFromObject(mesh).max.y < 2));
  rig.controller.apply("wear_collar");
  assert.ok(visibleMeshes(rig).some(mesh => mesh.geometry.type === "TorusGeometry"));
  rig.controller.apply("wear_overalls");
  assert.equal(visibleMeshes(rig).filter(mesh => mesh.name === "overall-strap").length, 2);
  assert.ok(visibleMeshes(rig).some(mesh => mesh.name === "bib-pocket"));
  rig.controller.dispose();
});

test("sleeves and trouser details follow existing walking pivots; body width is applied once", () => {
  const rig = fixture();
  rig.character.scale.set(.94, .96, 1);
  rig.controller.apply("wear_track", .83);
  const groups = clothingGroups(rig).filter(group => group.visible);
  const body = groups.find(group => group.userData.clothingPart === "body");
  assert.equal(body.scale.x, .83);
  assert.equal(rig.character.scale.x, .94);
  const sleeve = visibleMeshes(rig).find(mesh => mesh.parent.parent === rig.leftArm && mesh.name === "track-sleeve-stripe");
  const stripe = visibleMeshes(rig).find(mesh => mesh.parent.parent === rig.leftLeg && mesh.name === "track-leg-stripe");
  assert.ok(sleeve && stripe);
  const beforeArm = sleeve.getWorldPosition(new THREE.Vector3()).clone();
  const beforeLeg = stripe.getWorldPosition(new THREE.Vector3()).clone();
  rig.leftArm.rotation.x = .8; rig.leftLeg.rotation.x = -.6;
  assert.ok(sleeve.getWorldPosition(new THREE.Vector3()).distanceTo(beforeArm) > .1);
  assert.ok(stripe.getWorldPosition(new THREE.Vector3()).distanceTo(beforeLeg) > .1);
  assert.equal(sleeve.parent.scale.x, 1);
  assert.equal(stripe.parent.scale.x, 1);
  assert.equal(rig.leftBoot.parent, rig.leftLeg);
  assert.equal(rig.rightBoot.parent, rig.rightLeg);
  rig.controller.apply("bag");
  assert.equal(rig.controller.current(), "wear_trashbag");
  rig.controller.apply("unknown-legacy-outfit");
  assert.equal(rig.controller.current(), "nude");
  rig.controller.dispose();
});

test("disposing releases only owned clothing once and restores original rig materials", () => {
  const rig = fixture();
  const geometries = new Set(), materials = new Set();
  for (const group of clothingGroups(rig)) group.traverse(object => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    for (const material of [object.material].flat()) if (![rig.shirt, rig.pants, rig.skin].includes(material)) materials.add(material);
  });
  let originalDisposals = 0;
  for (const resource of [rig.geometry, rig.shirt, rig.pants, rig.skin]) resource.addEventListener("dispose", () => originalDisposals++);
  const disposed = new Map();
  for (const resource of [...geometries, ...materials]) resource.addEventListener("dispose", () => disposed.set(resource, (disposed.get(resource) || 0) + 1));
  rig.controller.apply("wear_lack");
  rig.controller.dispose(); rig.controller.dispose();
  assert.equal(originalDisposals, 0);
  assert.equal(clothingGroups(rig).length, 0);
  assert.ok([...disposed.values()].every(count => count === 1));
  assert.equal(disposed.size, geometries.size + materials.size);
  assert.equal(rig.torso.material, rig.shirt);
  assert.equal(rig.leftArmMesh.material, rig.shirt);
  assert.equal(rig.leftLegMesh.material, rig.pants);
  assert.equal(rig.shoulderTrim.visible, true);
  assert.equal(rig.belt.visible, true);
});
