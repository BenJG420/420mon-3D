import * as THREE from "three";

/** A window at the front glass, not a camera backed away to fit a box thumbnail. */
export function createAquariumCamera(camera: THREE.PerspectiveCamera) {
  let aspect = 1, overview = false, initialized = false;
  let dragX = 0, dragY = 0;
  const goal = new THREE.Vector3(), target = new THREE.Vector3(), look = new THREE.Vector3();
  const clamp = THREE.MathUtils.clamp;
  function resize(width: number, height: number) {
    aspect = Math.max(.25, width / Math.max(1, height));
    camera.aspect = aspect;
    camera.fov = aspect < .9 ? 58 : 48;
    camera.updateProjectionMatrix();
  }
  function update(dt: number, fish?: THREE.Vector3) {
    const x = clamp((fish?.x ?? 0) + dragX, -3.4, 3.4);
    const y = clamp((fish?.y ?? 1.9) + dragY, 1.25, 2.9);
    if (overview) {
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      goal.set(0, 2.9, Math.max(6.8, 5.5 / (Math.tan(halfFov) * aspect) + 2));
      look.set(0, 1.95, 0);
    } else {
      // Stay outside the pane. Moving with a fish keeps sparse catches in view on phones.
      goal.set(clamp(x * .9, -2.9, 2.9), clamp(y + .2, 1.8, 2.8), 4.8);
      look.set(x, y, .35);
    }
    const blend = initialized ? 1 - Math.exp(-3.2 * Math.max(0, Math.min(dt, .1))) : 1;
    camera.position.lerp(goal, blend); target.lerp(look, blend);
    camera.lookAt(target); camera.updateMatrixWorld(); initialized = true;
  }
  return {
    resize, update,
    setOverview(value: boolean) { overview = value; dragX = dragY = 0; },
    pan(dx: number, dy: number) { dragX = clamp(dragX + dx * 5, -2, 2); dragY = clamp(dragY + dy * 3, -.7, .7); },
    reset() { dragX = dragY = 0; },
  };
}
