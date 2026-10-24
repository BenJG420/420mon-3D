import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export { createEddiSmoke, eddiSmokePhase } from "./src/game/eddi-smoke.ts"; export { EDDI_PAUSE_T } from "./src/game/data/eddi.ts"; export * as THREE from "three";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { THREE, createEddiSmoke, eddiSmokePhase, EDDI_PAUSE_T } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);

function actualMaleRig() {
  const bytes = readFileSync(new URL("../public/game/characters/male.glb", import.meta.url));
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  const objects = gltf.nodes.map(node => {
    const object = new THREE.Object3D(); object.name = node.name ?? "";
    if (node.matrix) new THREE.Matrix4().fromArray(node.matrix).decompose(object.position, object.quaternion, object.scale);
    else {
      object.position.fromArray(node.translation ?? [0, 0, 0]); object.quaternion.fromArray(node.rotation ?? [0, 0, 0, 1]); object.scale.fromArray(node.scale ?? [1, 1, 1]);
    }
    return object;
  });
  gltf.nodes.forEach((node, i) => (node.children ?? []).forEach(child => objects[i].add(objects[child])));
  const scene = new THREE.Group(); (gltf.scenes[gltf.scene ?? 0].nodes ?? []).forEach(index => scene.add(objects[index]));
  const bounds = gltf.meshes.flatMap(mesh => mesh.primitives.map(part => gltf.accessors[part.attributes.POSITION]));
  const min = Math.min(...bounds.map(bounds => bounds.min[1])), max = Math.max(...bounds.map(bounds => bounds.max[1]));
  const container = new THREE.Group(); container.add(scene); container.scale.setScalar(2.4 / (max - min)); container.position.y = -min * container.scale.y;
  const actor = new THREE.Group(); actor.scale.set(1.05, .92, 1.05); actor.add(container); actor.userData.status = "ready";
  return { actor, objects };
}

test("Eddi draws/exhales at real lip bones without posing the rig, with a fixed disposable particle budget", () => {
  assert.ok(eddiSmokePhase(.25).draw > .99); assert.equal(eddiSmokePhase(5).draw, 0);
  assert.deepEqual(eddiSmokePhase(7.75), eddiSmokePhase(.25)); assert.equal(eddiSmokePhase(NaN).time, 0);
  const parent = new THREE.Group(); parent.position.set(4, .2, -3); parent.rotation.y = .73;
  const { actor, objects } = actualMaleRig(); parent.add(actor);
  const original = objects.map(object => [object.position.toArray(), object.quaternion.toArray(), object.scale.toArray()]);
  const effect = createEddiSmoke(parent, actor), smoke = effect.root.getObjectByName("eddi-exhaled-smoke");
  const joint = effect.root.getObjectByName("eddi-joint");
  assert.equal(smoke.count, 12); assert.equal(smoke.castShadow, false);
  assert.equal(effect.root.children.filter(child => child.isLight).length, 0);
  const geometry = smoke.geometry, material = smoke.material, alpha = geometry.getAttribute("puffOpacity");
  for (let frame = 0; frame < 10; frame++) effect.update(Math.min(.1, EDDI_PAUSE_T / 11), false, true);
  parent.updateMatrixWorld(true);
  const top = actor.getObjectByName("Bip01 MUpperLip").getWorldPosition(new THREE.Vector3());
  const bottom = actor.getObjectByName("Bip01 MBottomLip").getWorldPosition(new THREE.Vector3());
  const mouth = top.add(bottom).multiplyScalar(.5), origin = effect.root.getWorldPosition(new THREE.Vector3());
  assert.ok(origin.distanceTo(mouth) < .009, "centimetre rig/head scale is converted into a world-space mouth anchor");
  assert.ok(origin.y > 1.7 && origin.y < 2.7, "mouth anchor remains at the normalized human head");
  assert.ok([...alpha.array].some(value => value > .05), "exhalation is visible before Eddi's shortest original pause ends");
  assert.ok([...alpha.array].every(value => value >= 0 && value <= .26));
  assert.ok([...smoke.instanceMatrix.array].every(Number.isFinite));
  const head = actor.getObjectByName("Bip01 Head"), outward = mouth.clone().sub(head.getWorldPosition(new THREE.Vector3()));
  const jointDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(joint.getWorldQuaternion(new THREE.Quaternion()));
  assert.ok(jointDirection.dot(outward) > 0, "joint projects out of the face rather than into the rig");
  assert.deepEqual(objects.map(object => [object.position.toArray(), object.quaternion.toArray(), object.scale.toArray()]), original, "effect does not alter animation bones");
  effect.update(.1, true, true);
  assert.equal(effect.root.userData.draw, 0); assert.equal(smoke.visible, false);
  assert.ok([...alpha.array].every(value => value === 0), "walking pauses the draw/exhale without changing source movement");
  effect.update(.1, false, false); assert.equal(effect.root.visible, false);
  actor.userData.status = "loading"; effect.update(.1, false, true);
  assert.ok(effect.root.position.distanceTo(new THREE.Vector3(.025, 1.84, .23)) < 1e-8, "loading fallback still has a plausible mouth anchor");
  actor.userData.status = "ready"; effect.update(.1, false, true);
  assert.strictEqual(smoke.geometry, geometry); assert.strictEqual(smoke.material, material);
  const resources = [smoke, geometry, material, material.uniforms.puffMap.value, ...joint.children.flatMap(mesh => [mesh.geometry, mesh.material])];
  const disposal = new Map(resources.map(resource => [resource, 0]));
  resources.forEach(resource => resource.addEventListener("dispose", () => disposal.set(resource, disposal.get(resource) + 1)));
  effect.dispose(); effect.dispose();
  assert.ok([...disposal.values()].every(count => count === 1), "each owned GPU resource releases exactly once");
  assert.deepEqual(parent.children, [actor]);
});
