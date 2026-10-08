import * as THREE from "three";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found.");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07090d);
scene.fog = new THREE.FogExp2(0x111923, 0.018);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
camera.position.set(8, 6, 10);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0x9bbcff, 0x11100e, 1.8);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0xb8c7ff, 3.2);
moon.position.set(-20, 30, 12);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 100;
moon.shadow.camera.left = -35;
moon.shadow.camera.right = 35;
moon.shadow.camera.top = 35;
moon.shadow.camera.bottom = -35;
scene.add(moon);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(160, 160),
  new THREE.MeshStandardMaterial({
    color: 0x24272a,
    roughness: 0.58,
    metalness: 0.18,
  }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(160, 80, 0x29333b, 0x161b20);
grid.position.y = 0.01;
scene.add(grid);

const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.42, 1.0, 8, 16),
  new THREE.MeshStandardMaterial({
    color: 0x6fd17c,
    roughness: 0.7,
    metalness: 0.05,
  }),
);
body.position.y = 1.0;
body.castShadow = true;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.36, 20, 14),
  new THREE.MeshStandardMaterial({
    color: 0xb8e3b2,
    roughness: 0.8,
  }),
);
head.position.y = 1.85;
head.castShadow = true;
player.add(head);

scene.add(player);

const blocks: THREE.Mesh[] = [];
for (let x = -18; x <= 18; x += 6) {
  for (let z = -18; z <= 18; z += 6) {
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
    const h = 2 + Math.abs((x * 13 + z * 7) % 7);
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, h, 4.5),
      new THREE.MeshStandardMaterial({
        color: 0x30363b,
        roughness: 0.82,
        metalness: 0.08,
      }),
    );
    building.position.set(x, h / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    blocks.push(building);
  }
}

const state = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
};

const keys: Record<string, keyof typeof state> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  ShiftLeft: "sprint",
  ShiftRight: "sprint",
};

function setKey(code: string, value: boolean) {
  const action = keys[code];
  if (action) state[action] = value;
}

window.addEventListener("keydown", (event) => setKey(event.code, true));
window.addEventListener("keyup", (event) => setKey(event.code, false));

const hud = document.createElement("div");
hud.className = "hud";
hud.innerHTML = `
  <div class="brand">420MON // 3D</div>
  <div class="status">FOUNDATION BUILD <span></span></div>
  <div class="hint">WASD / ARROWS · SHIFT SPRINT</div>
  <div class="target">3D WORLD ONLINE</div>
`;
app.appendChild(hud);

const clock = new THREE.Clock();
const velocity = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
}
window.addEventListener("resize", resize);
resize();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  const input = new THREE.Vector3(
    Number(state.right) - Number(state.left),
    0,
    Number(state.backward) - Number(state.forward),
  );

  if (input.lengthSq() > 0) input.normalize();

  const speed = state.sprint ? 7.5 : 4.2;
  velocity.lerp(input.multiplyScalar(speed), 1 - Math.pow(0.001, dt));
  player.position.addScaledVector(velocity, dt);

  if (velocity.lengthSq() > 0.01) {
    const angle = Math.atan2(velocity.x, velocity.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, angle, 1 - Math.pow(0.0001, dt));
    body.rotation.z = Math.sin(performance.now() * 0.012) * 0.025;
  }

  cameraTarget.copy(player.position);
  cameraTarget.y += 1.0;

  desiredCamera.copy(player.position).add(new THREE.Vector3(7.5, 5.8, 9.5));
  camera.position.lerp(desiredCamera, 1 - Math.pow(0.00001, dt));
  camera.lookAt(cameraTarget);

  moon.position.x = player.position.x - 20;
  moon.position.z = player.position.z + 12;

  renderer.render(scene, camera);

  const fps = Math.round(1 / Math.max(dt, 0.001));
  const status = hud.querySelector(".status");
  if (status) status.innerHTML = `FOUNDATION BUILD <span></span> ${fps} FPS`;
}

animate();
