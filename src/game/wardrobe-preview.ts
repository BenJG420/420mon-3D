import * as THREE from "three";

/** A clear fitting view of the same animated player, independent of room furniture. */
export function createWardrobePreview(renderer: THREE.WebGLRenderer, player: THREE.Object3D) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color("#17272d");
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 30);
  const fill = new THREE.HemisphereLight(0xdcebf4, 0x58655a, 2.1);
  const key = new THREE.DirectionalLight(0xffe8cd, 3.2); key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(0xa5d9eb, 2); rim.position.set(-3, 3, -2);
  studio.add(fill, key, rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(2, 64), new THREE.MeshStandardMaterial({ color: 0x293e43, roughness: .9 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.03; studio.add(floor);
  const position = new THREE.Vector3(), quaternion = new THREE.Quaternion();
  const viewport = new THREE.Vector4();
  return {
    render(turn: number, width: number, height: number, panelWidth: number) {
      const mobile = width <= 680;
      const viewWidth = mobile ? width : Math.max(1, width - panelWidth - 24);
      const viewHeight = mobile ? height * .47 : height;
      camera.aspect = viewWidth / viewHeight; camera.updateProjectionMatrix();
      const distance = 5.9 / Math.min(1, camera.aspect);
      camera.position.set(Math.sin(turn + .3) * distance, 1.65, Math.cos(turn + .3) * distance);
      camera.lookAt(0, 1.35, 0);
      const parent = player.parent;
      position.copy(player.position); quaternion.copy(player.quaternion); renderer.getViewport(viewport);
      try {
        studio.add(player); player.position.set(0, 0, 0); player.quaternion.identity();
        renderer.setViewport(0, height - viewHeight, viewWidth, viewHeight);
        renderer.render(studio, camera);
      } finally {
        if (parent) parent.add(player); else player.removeFromParent();
        player.position.copy(position); player.quaternion.copy(quaternion); player.updateMatrixWorld(true);
        renderer.setViewport(viewport);
      }
    },
    dispose() { floor.geometry.dispose(); floor.material.dispose(); studio.clear(); },
  };
}
