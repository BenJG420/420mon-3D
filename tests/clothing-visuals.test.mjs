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
const { legacyWardrobe } = await server.ssrLoadModule("/src/game/wardrobe.ts");
const legacyIds = ["nude", "wear_trashbag", "wear_collar", "wear_jacket", "wear_vest", "wear_coat", "wear_hoodie", "wear_track", "wear_rain", "wear_overalls", "wear_lack"];
const choices = {
  top: ["top_tanktop", "top_shirt", "top_hoodie", "top_track"],
  jacket: ["jacket_none", "jacket_trashbag", "jacket_bomber", "jacket_vest", "jacket_leather", "jacket_coat", "jacket_rain", "jacket_lack"],
  pants: ["pants_shorts", "pants_plain", "pants_track", "pants_overalls"],
  shoes: ["shoes_basic", "shoes_trainers", "shoes_work"],
  head: ["head_none", "head_beanie", "head_rainhood"],
  accessory: ["accessory_none", "accessory_collar"],
};
function* combinations(entries = Object.entries(choices), state = {}) {
  if (!entries.length) { yield { ...state }; return; }
  const [[slot, items], ...rest] = entries;
  for (const id of items) yield* combinations(rest, { ...state, [slot]: id });
}
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
  const hair = new THREE.Group(); hair.name = "custom-hair";
  const hiddenHair = new THREE.Group(); hiddenHair.visible = false;
  character.add(shoulderTrim, jacketAccent, belt, hair, hiddenHair);
  const rig = { character, torso, leftArm, rightArm, leftLeg, rightLeg, leftArmMesh, rightArmMesh, leftLegMesh, rightLegMesh, skin, shoulderTrim, jacketAccent, belt, leftBoot, rightBoot, headParts: [hair, hiddenHair] };
  const controller = createClothingVisuals(rig);
  return { ...rig, controller, shirt, pants, geometry, hair, hiddenHair };
}
function clothingGroups(rig) {
  const result = [];
  rig.character.traverse(object => { if (object.userData.clothingGarment) result.push(object); });
  return result;
}
function visibleMeshes(rig) {
  const result = [];
  rig.character.traverseVisible(object => { if (object.isMesh) result.push(object); });
  return result;
}
function snapshot(rig) {
  const result = [];
  rig.character.traverse(object => result.push([object.uuid, object.geometry?.uuid]));
  return result;
}

test("fallback renders all 2304 six-slot combinations without missing slots, duplicate shoes or cache growth", () => {
  const rig = fixture(), initial = snapshot(rig), groups = clothingGroups(rig);
  let count = 0;
  for (const wardrobe of combinations()) {
    // Runtime syncClothes refreshes the selected hairstyle before applying its hat.
    rig.hair.visible = true; rig.hiddenHair.visible = false;
    rig.controller.apply(wardrobe);
    assert.deepEqual(rig.controller.currentWardrobe(), wardrobe);
    const selectedBodies = groups.filter(group => group.visible && group.userData.clothingPart === "body");
    assert.equal(selectedBodies.length, 6);
    for (const [slot, id] of Object.entries(wardrobe)) {
      assert.equal(selectedBodies.filter(group => group.userData.clothingSlot === slot && group.userData.clothingGarment === id).length, 1);
      assert.ok(groups.filter(group => group.visible && group.userData.clothingSlot === slot).every(group => group.userData.clothingGarment === id));
    }
    const meshes = visibleMeshes(rig);
    assert.ok(meshes.length < 100, `${JSON.stringify(wardrobe)} stays modest for fallback phones`);
    assert.equal(meshes.filter(mesh => mesh.name === "shoe-sole").length, 2);
    assert.equal(meshes.filter(mesh => mesh.name === "shoe" || mesh.name === "work-boot").length, 2);
    assert.equal(meshes.filter(mesh => mesh.name === "work-bib").length, wardrobe.pants === "pants_overalls" ? 1 : 0);
    assert.equal(meshes.filter(mesh => mesh.name === "collar-ring").length, wardrobe.accessory === "accessory_collar" ? 1 : 0);
    assert.equal(rig.leftBoot.visible, false); assert.equal(rig.rightBoot.visible, false);
    assert.equal(rig.hair.visible, wardrobe.head === "head_none"); assert.equal(rig.hiddenHair.visible, false);
    const sleevedJacket = !["jacket_none", "jacket_vest"].includes(wardrobe.jacket);
    assert.ok(groups.filter(group => group.userData.clothingSlot === "top" && ["leftArm", "rightArm"].includes(group.userData.clothingPart))
      .every(group => !group.visible || !sleevedJacket));
    assert.equal(rig.leftLegMesh.material === rig.skin, wardrobe.pants === "pants_shorts");
    assert.equal(rig.torso.visible, true); assert.equal(rig.leftArmMesh.visible, true);
    assert.equal(meshes.every(mesh => !!mesh.material && mesh.scale.toArray().every(value => Number.isFinite(value) && value > 0)), true);
    count++;
  }
  assert.equal(count, 2304); assert.deepEqual(snapshot(rig), initial);
  const copy = rig.controller.currentWardrobe(); copy.top = "not-a-real-shirt";
  assert.notEqual(rig.controller.currentWardrobe().top, copy.top, "callers cannot mutate the active selection");
  rig.controller.dispose();
});

test("fallback retains eleven legacy presets and changes their rendered silhouette without adding objects", () => {
  const rig = fixture(), initial = snapshot(rig), signatures = new Set();
  for (const id of legacyIds) {
    rig.controller.apply(id);
    assert.equal(rig.controller.current(), id);
    assert.deepEqual(rig.controller.currentWardrobe(), legacyWardrobe(id));
    signatures.add(visibleMeshes(rig).map(mesh => [mesh.name, mesh.geometry.type, ...mesh.scale.toArray(), ...mesh.position.toArray(), mesh.material.color?.getHex()]).sort().join("|"));
  }
  assert.equal(signatures.size, 11);
  rig.controller.apply("bag"); assert.equal(rig.controller.current(), "wear_trashbag");
  rig.controller.apply("unknown-legacy-outfit"); assert.equal(rig.controller.current(), "nude");
  assert.deepEqual(snapshot(rig), initial);
  rig.controller.dispose();
});

test("fallback layer depths expose an overall bib under every open jacket and mask covered underlayers", () => {
  const rig = fixture();
  for (const jacket of choices.jacket) {
    rig.controller.apply({ ...legacyWardrobe("wear_overalls"), top: "top_hoodie", jacket });
    const meshes = visibleMeshes(rig);
    const bib = meshes.find(mesh => mesh.name === "work-bib"), bibBounds = new THREE.Box3().setFromObject(bib);
    assert.ok(new THREE.Box3().setFromObject(rig.torso).max.z < bibBounds.min.z);
    assert.equal(meshes.filter(mesh => mesh.name === "overall-strap").length, 2);
    assert.equal(meshes.filter(mesh => mesh.name === "kangaroo-pocket").length, 0);
    for (const front of meshes.filter(mesh => ["open-front", "torn-open-front"].includes(mesh.name))) {
      const bounds = new THREE.Box3().setFromObject(front);
      assert.ok(bounds.min.z > bibBounds.max.z, `${jacket}: jacket stays in front of the bib`);
      assert.ok(bounds.max.x < -.2 || bounds.min.x > .2, `${jacket}: the center bib stays exposed`);
    }
    assert.equal(meshes.filter(mesh => mesh.name === "bib-pocket").length, 1);
  }
  rig.controller.apply({ ...legacyWardrobe("nude"), head: "head_rainhood" });
  const headParts = visibleMeshes(rig).filter(mesh => mesh.name.startsWith("rainhood"));
  assert.equal(headParts.length, 4);
  assert.ok(headParts.every(mesh => mesh.name !== "rainhood-front"), "hood is open at the face");
  rig.controller.apply({ ...legacyWardrobe("wear_hoodie"), head: "head_rainhood" });
  assert.equal(visibleMeshes(rig).filter(mesh => mesh.name.startsWith("folded-hood")).length, 0);
  rig.controller.dispose();
});

test("fallback slot swaps keep independent palettes and preserve original customized tank top", () => {
  const rig = fixture();
  const wardrobe = { ...legacyWardrobe("wear_overalls"), jacket: "jacket_leather", shoes: "shoes_trainers", head: "head_beanie", accessory: "accessory_collar" };
  rig.controller.apply(wardrobe);
  const before = new Map(visibleMeshes(rig).filter(mesh => ["work-bib", "shoe", "beanie-crown", "collar-ring"].includes(mesh.name))
    .map(mesh => [mesh.uuid, mesh.material.color.getHex()]));
  rig.shirt.color.set(0xff00ff);
  rig.controller.apply({ ...wardrobe, jacket: "jacket_lack", top: "top_track" });
  for (const mesh of visibleMeshes(rig)) if (before.has(mesh.uuid)) assert.equal(mesh.material.color.getHex(), before.get(mesh.uuid));
  assert.equal([...before.keys()].filter(uuid => visibleMeshes(rig).some(mesh => mesh.uuid === uuid)).length, before.size);
  rig.hair.visible = false; rig.hiddenHair.visible = true; // Player selected a different hairstyle while wearing a hat.
  rig.controller.apply("nude"); assert.equal(rig.torso.material, rig.shirt); assert.equal(rig.torso.material.color.getHex(), 0xff00ff);
  assert.equal(rig.hair.visible, false); assert.equal(rig.hiddenHair.visible, true);
  rig.controller.dispose();
});

test("fallback sleeves, trouser details, coat tails and shoes follow existing walking pivots", () => {
  const rig = fixture();
  rig.character.scale.set(.94, .96, 1);
  rig.controller.apply({ ...legacyWardrobe("wear_track"), jacket: "jacket_none", head: "head_beanie" }, .83);
  const groups = clothingGroups(rig).filter(group => group.visible);
  assert.ok(groups.filter(group => group.userData.clothingPart === "body" && !["head", "accessory"].includes(group.userData.clothingSlot)).every(group => group.scale.x === .83));
  assert.equal(groups.find(group => group.userData.clothingSlot === "head" && group.userData.clothingPart === "body").scale.x, 1);
  assert.equal(rig.character.scale.x, .94);
  const sleeve = visibleMeshes(rig).find(mesh => mesh.parent.parent === rig.leftArm && mesh.name === "track-sleeve-stripe");
  const stripe = visibleMeshes(rig).find(mesh => mesh.parent.parent === rig.leftLeg && mesh.name === "track-leg-stripe");
  const shoe = visibleMeshes(rig).find(mesh => mesh.parent.parent === rig.leftLeg && mesh.name === "shoe");
  for (const [part, pivot, angle] of [[sleeve, rig.leftArm, .8], [stripe, rig.leftLeg, -.6]]) {
    assert.ok(part); const before = part.getWorldPosition(new THREE.Vector3()).clone(); pivot.rotation.x = angle;
    assert.ok(part.getWorldPosition(new THREE.Vector3()).distanceTo(before) > .1); assert.equal(part.parent.scale.x, 1);
  }
  assert.ok(shoe); assert.equal(shoe.parent.parent, rig.leftLeg);
  rig.controller.apply("wear_coat");
  const tails = visibleMeshes(rig).filter(mesh => mesh.name === "split-coat-tail");
  assert.equal(tails.length, 2);
  assert.ok(tails.every(mesh => [rig.leftLeg, rig.rightLeg].includes(mesh.parent.parent)));
  rig.controller.dispose();
});

test("fallback disposes owned clothing once, restores head/boots and never disposes the original rig", () => {
  const rig = fixture(), geometries = new Set(), materials = new Set();
  for (const group of clothingGroups(rig)) group.traverse(object => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    for (const material of [object.material].flat()) if (![rig.shirt, rig.pants, rig.skin].includes(material)) materials.add(material);
  });
  // Some colors live on the original torso/legs, not on a cached overlay mesh.
  for (const wardrobe of combinations()) {
    rig.controller.apply(wardrobe);
    for (const original of [rig.torso, rig.leftLegMesh]) for (const material of [original.material].flat())
      if (![rig.shirt, rig.pants, rig.skin].includes(material)) materials.add(material);
  }
  let originalDisposals = 0;
  for (const resource of [rig.geometry, rig.shirt, rig.pants, rig.skin]) resource.addEventListener("dispose", () => originalDisposals++);
  const disposed = new Map();
  for (const resource of [...geometries, ...materials]) resource.addEventListener("dispose", () => disposed.set(resource, (disposed.get(resource) || 0) + 1));
  rig.controller.apply({ ...legacyWardrobe("wear_lack"), head: "head_beanie" });
  rig.controller.dispose(); rig.controller.dispose();
  assert.equal(originalDisposals, 0); assert.equal(clothingGroups(rig).length, 0);
  assert.ok([...disposed.values()].every(count => count === 1)); assert.equal(disposed.size, geometries.size + materials.size);
  assert.equal(rig.torso.material, rig.shirt); assert.equal(rig.leftArmMesh.material, rig.shirt); assert.equal(rig.leftLegMesh.material, rig.pants);
  assert.equal(rig.shoulderTrim.visible, true); assert.equal(rig.belt.visible, true);
  assert.equal(rig.leftBoot.visible, true); assert.equal(rig.rightBoot.visible, true);
  assert.equal(rig.hair.visible, true); assert.equal(rig.hiddenHair.visible, false);
});
