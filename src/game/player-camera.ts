import * as THREE from "three";

const DEFAULT_YAW = Math.atan2(8, 12);
const DEFAULT_PITCH = Math.atan2(12, Math.hypot(8, 12));
const DEFAULT_DISTANCE = Math.hypot(8, 12, 12);
const MIN_PITCH = .12, MAX_PITCH = 1.35;
const clamp = THREE.MathUtils.clamp;
const angle = (value: number) => Math.atan2(Math.sin(value), Math.cos(value));

/** Player-centred orbit: smooth angles/radius, never a chord through the player. */
export function createPlayerCamera(camera: THREE.PerspectiveCamera) {
  let goalYaw = DEFAULT_YAW, goalPitch = DEFAULT_PITCH, goalDistance = DEFAULT_DISTANCE;
  let yaw = DEFAULT_YAW, pitch = DEFAULT_PITCH, distance = DEFAULT_DISTANCE;
  let initialized = false;

  function rotate(deltaYaw: number, deltaPitch: number) {
    if (!Number.isFinite(deltaYaw) || !Number.isFinite(deltaPitch)) return;
    goalYaw = angle(goalYaw + deltaYaw);
    goalPitch = clamp(goalPitch + deltaPitch, MIN_PITCH, MAX_PITCH);
  }
  function zoom(factor: number) {
    if (!Number.isFinite(factor) || factor <= 0) return;
    goalDistance = clamp(goalDistance * factor, 5, 32);
  }
  function reset() {
    goalYaw = DEFAULT_YAW; goalPitch = DEFAULT_PITCH; goalDistance = DEFAULT_DISTANCE;
  }
  function update(target: THREE.Vector3, dt: number, indoor = false) {
    if (!Number.isFinite(target.x) || !Number.isFinite(target.y) || !Number.isFinite(target.z)) return;
    const wantedDistance = indoor ? clamp(goalDistance * .66, 4, 24) : goalDistance;
    const elapsed = Number.isFinite(dt) ? clamp(dt, 0, .1) : 0;
    const blend = initialized ? 1 - Math.exp(-12 * elapsed) : 1;
    yaw = angle(yaw + angle(goalYaw - yaw) * blend);
    pitch += (goalPitch - pitch) * blend;
    distance += (wantedDistance - distance) * blend;
    const horizontal = Math.cos(pitch) * distance;
    camera.position.set(target.x + Math.sin(yaw) * horizontal,
      target.y + Math.sin(pitch) * distance, target.z + Math.cos(yaw) * horizontal);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    initialized = true;
  }
  /** Input is screen-relative; use the displayed yaw while a turn is easing. */
  function movement(right: number, forward: number, out: THREE.Vector3) {
    if (!Number.isFinite(right) || !Number.isFinite(forward)) return out.set(0, 0, 0);
    // Scale huge finite input first so its length cannot overflow; keep small stick input analogue.
    const largest = Math.max(Math.abs(right), Math.abs(forward));
    if (largest > 1) { right /= largest; forward /= largest; }
    const length = Math.hypot(right, forward);
    if (length > 1 || largest > 1) { right /= length; forward /= length; }
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    return out.set(right * cos - forward * sin, 0, -right * sin - forward * cos);
  }
  return {
    rotate, zoom, reset, update, movement,
    /** Distance is the displayed world radius; goalDistance is the outdoor zoom setting. */
    getState: () => ({ yaw, pitch, distance, goalYaw, goalPitch, goalDistance }),
  };
}
