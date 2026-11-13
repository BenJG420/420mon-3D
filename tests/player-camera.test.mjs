import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { createServer } from 'vite';
import * as THREE from 'three';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
after(() => server.close());
const { createPlayerCamera } = await server.ssrLoadModule('/src/game/player-camera.ts');
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≈ ${b}`);
const angular = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const make = () => { const camera = new THREE.PerspectiveCamera(55, 1, .1, 500); return { camera, orbit: createPlayerCamera(camera) }; };
const settle = (orbit, target, indoor = false, count = 150) => { for (let i = 0; i < count; i++) orbit.update(target, 1 / 60, indoor); };

test('initial orbit retains the established outside view, follows its target and starts closer indoors', () => {
  const target = new THREE.Vector3(12, 1, -6), original = target.clone(), { camera, orbit } = make();
  orbit.update(target, 0);
  assert.ok(camera.position.distanceTo(new THREE.Vector3(20, 13, 6)) < 1e-10);
  const direction = camera.getWorldDirection(new THREE.Vector3());
  assert.ok(direction.distanceTo(target.clone().sub(camera.position).normalize()) < 1e-10);
  assert.deepEqual(target, original, 'following must not move the player/target');
  const inside = make(); inside.orbit.update(target, 0, true);
  near(inside.camera.position.distanceTo(target), Math.hypot(8, 12, 12) * .66);
  target.add(new THREE.Vector3(3, 0, 2)); orbit.update(target, 1 / 60);
  assert.ok(camera.position.distanceTo(target.clone().add(new THREE.Vector3(8, 12, 12))) < 1e-10);
});

test('full-circle turns keep a safe orbit radius and elevation/zoom remain bounded', () => {
  const target = new THREE.Vector3(), { camera, orbit } = make(); orbit.update(target, 0);
  const radius = orbit.getState().distance; orbit.rotate(Math.PI, 0);
  for (let i = 0; i < 80; i++) { orbit.update(target, 1 / 60); near(camera.position.length(), radius); }
  orbit.rotate(Math.PI * 8, 100); orbit.zoom(1e9); settle(orbit, target);
  near(orbit.getState().pitch, 1.35); near(orbit.getState().distance, 32);
  orbit.rotate(0, -100); orbit.zoom(1e-9); settle(orbit, target);
  near(orbit.getState().pitch, .12); near(camera.position.length(), 5);
  assert.ok(camera.position.y > 0, 'the view never flips below the target');
  settle(orbit, target, true); near(camera.position.length(), 4);
  orbit.zoom(1e9); settle(orbit, target, true); near(camera.position.length(), 32 * .66);
  settle(orbit, target); near(camera.position.length(), 32);
});

test('crossing the signed-angle boundary takes the short turn without jumping through the character', () => {
  const target = new THREE.Vector3(), { camera, orbit } = make();
  orbit.rotate(Math.PI - .02 - orbit.getState().goalYaw, 0); orbit.update(target, 0);
  const before = orbit.getState(), position = camera.position.clone();
  orbit.rotate(.04, 0); orbit.update(target, 1 / 60);
  const turned = angular(orbit.getState().yaw, before.yaw);
  assert.ok(turned > 0 && turned < .04, 'yaw moves across +PI towards -PI by the small positive arc');
  near(camera.position.length(), before.distance);
  assert.ok(camera.position.distanceTo(position) < .5);
});

test('easing is frame-rate independent and reset smoothly restores the original view', () => {
  const target = new THREE.Vector3(4, 2, 8), a = make(), b = make();
  for (const { orbit } of [a, b]) { orbit.update(target, 0); orbit.rotate(.9, .23); orbit.zoom(.45); }
  for (let i = 0; i < 30; i++) a.orbit.update(target, 1 / 60);
  for (let i = 0; i < 15; i++) b.orbit.update(target, 1 / 30);
  assert.ok(a.camera.position.distanceTo(b.camera.position) < 1e-10);
  const before = a.camera.position.clone(); a.orbit.reset();
  assert.deepEqual(a.camera.position, before, 'reset sets the goal, not a teleport');
  settle(a.orbit, target);
  assert.ok(a.camera.position.distanceTo(target.clone().add(new THREE.Vector3(8, 12, 12))) < 1e-8);
});

test('movement follows the currently displayed camera, caps diagonals and preserves analogue stick input', () => {
  const target = new THREE.Vector3(), out = new THREE.Vector3();
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const { orbit } = make(); orbit.rotate(yaw - orbit.getState().goalYaw, 0); orbit.update(target, 0);
    assert.strictEqual(orbit.movement(0, 1, out), out);
    near(out.x, -Math.sin(yaw)); near(out.z, -Math.cos(yaw)); assert.equal(out.y, 0);
    orbit.movement(1, 0, out); near(out.x, Math.cos(yaw)); near(out.z, -Math.sin(yaw));
    orbit.movement(1, 1, out); near(out.length(), 1);
    orbit.movement(.3, .4, out); near(out.length(), .5);
    orbit.movement(Number.MAX_VALUE, Number.MAX_VALUE, out); near(out.length(), 1);
    const visibleMovement = orbit.movement(0, 1, out).clone(); orbit.rotate(Math.PI / 2, 0);
    assert.ok(orbit.movement(0, 1, out).distanceTo(visibleMovement) < 1e-10, 'pending yaw must not turn movement before the view');
    orbit.update(target, 1 / 60); assert.ok(orbit.movement(0, 1, out).distanceTo(visibleMovement) > .01);
  }
});

test('invalid gesture/time/target inputs cannot poison camera state or mutate the supplied target', () => {
  const target = new THREE.Vector3(1, 2, 3), original = target.clone(), { camera, orbit } = make(); orbit.update(target, 0);
  const baseline = orbit.getState(), position = camera.position.clone();
  for (const bad of [NaN, Infinity, -Infinity]) {
    orbit.rotate(bad, 0); orbit.rotate(0, bad); orbit.zoom(bad);
    orbit.update(new THREE.Vector3(bad, 0, 0), 1 / 60);
  }
  orbit.zoom(0); orbit.zoom(-1);
  assert.deepEqual(orbit.getState(), baseline); assert.deepEqual(camera.position, position);
  orbit.rotate(.5, .2); orbit.update(target, NaN); orbit.update(target, -10);
  assert.deepEqual(camera.position, position, 'invalid elapsed time does not advance an initialized orbit');
  const out = new THREE.Vector3(1, 2, 3); orbit.movement(Infinity, 1, out); assert.deepEqual(out, new THREE.Vector3());
  orbit.update(target, 1e9);
  assert.ok(Object.values(orbit.getState()).every(Number.isFinite));
  assert.ok(camera.position.toArray().every(Number.isFinite)); assert.deepEqual(target, original);
});
