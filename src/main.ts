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
const buildingColliders: THREE.Box3[] = [];
const playerRadius = 0.48;
const collisionPadding = 0.05;
let collisionCount = 0;
let blockedThisFrame = false;

// Horizontal circle-vs-box collision using actual building world bounds.
// Unlike a point check, this also catches the player's body at corners.
function collidesWithBuilding(x: number, z: number): boolean {
  const radius = playerRadius + collisionPadding;
  for (const box of buildingColliders) {
    const nearestX = THREE.MathUtils.clamp(x, box.min.x, box.max.x);
    const nearestZ = THREE.MathUtils.clamp(z, box.min.z, box.max.z);
    const dx = x - nearestX;
    const dz = z - nearestZ;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}

function movePlayer(dx: number, dz: number) {
  // Sweep in small increments; resolve each axis separately for wall sliding.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  for (let i = 0; i < steps; i++) {
    const nextX = player.position.x + dx / steps;
    if (!collidesWithBuilding(nextX, player.position.z)) {
      player.position.x = nextX;
    } else {
      blockedThisFrame = true;
    }
    const nextZ = player.position.z + dz / steps;
    if (!collidesWithBuilding(player.position.x, nextZ)) {
      player.position.z = nextZ;
    } else {
      blockedThisFrame = true;
    }
  }
}

// Ensure the character can never start inside a solid building.
function ensureValidSpawn() {
  if (!collidesWithBuilding(player.position.x, player.position.z)) return;
  for (let radius = 0; radius <= 40; radius += 1) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (!collidesWithBuilding(x, z)) {
        player.position.set(x, 0, z);
        return;
      }
    }
  }
}

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
    building.updateMatrixWorld(true);
    buildingColliders.push(new THREE.Box3().setFromObject(building));
  }
}

ensureValidSpawn();

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
  <div class="target">WALL COLLISIONS v2 · RUN INTO A BUILDING</div>
`;
app.appendChild(hud);

// Mobile touch controls: joystick + sprint button.
const touch = { x: 0, y: 0, sprint: false };
const controls = document.createElement("div");
controls.className = "touch-controls";
controls.innerHTML = '<div class="joystick" aria-label="Movement joystick"><div class="joystick-knob"></div></div><button class="sprint-button" type="button">SPRINT</button>';
app.appendChild(controls);
const joystick = controls.querySelector<HTMLElement>(".joystick")!;
const knob = controls.querySelector<HTMLElement>(".joystick-knob")!;
let joystickPointer: number | null = null;
function updateJoystick(event: PointerEvent) {
  const rect = joystick.getBoundingClientRect();
  const radius = rect.width * 0.36;
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  const length = Math.hypot(x, y);
  const scale = length > radius ? radius / length : 1;
  touch.x = x * scale / radius;
  touch.y = -y * scale / radius;
  knob.style.transform = `translate(${touch.x * radius}px, ${-touch.y * radius}px)`;
}
joystick.addEventListener("pointerdown", event => {
  joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});
joystick.addEventListener("pointermove", event => {
  if (event.pointerId === joystickPointer) updateJoystick(event);
});
function releaseJoystick(event: PointerEvent) {
  if (event.pointerId !== joystickPointer) return;
  joystickPointer = null;
  touch.x = 0; touch.y = 0;
  knob.style.transform = "translate(0px, 0px)";
}
joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);
const sprintButton = controls.querySelector<HTMLButtonElement>(".sprint-button")!;
sprintButton.addEventListener("pointerdown", event => {
  sprintButton.setPointerCapture(event.pointerId);
  touch.sprint = true;
});
sprintButton.addEventListener("pointerup", () => { touch.sprint = false; });
sprintButton.addEventListener("pointercancel", () => { touch.sprint = false; });
window.addEventListener("blur", () => {
  touch.x = 0; touch.y = 0; touch.sprint = false;
  knob.style.transform = "translate(0px, 0px)";
});

const clock = new THREE.Clock();
const velocity = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const cameraRaycaster = new THREE.Raycaster();
const cameraDirection = new THREE.Vector3();
const cameraOffset = new THREE.Vector3(7.5, 5.8, 9.5);

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
    Number(state.right) - Number(state.left) + touch.x,
    0,
    Number(state.backward) - Number(state.forward) - touch.y,
  );

  if (input.lengthSq() > 0) input.normalize();

  const speed = (state.sprint || touch.sprint) ? 7.5 : 4.2;
  velocity.lerp(input.multiplyScalar(speed), 1 - Math.pow(0.001, dt));
  blockedThisFrame = false;
  movePlayer(velocity.x * dt, velocity.z * dt);
  if (blockedThisFrame) collisionCount++;

  if (velocity.lengthSq() > 0.01) {
    const angle = Math.atan2(velocity.x, velocity.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, angle, 1 - Math.pow(0.0001, dt));
    body.rotation.z = Math.sin(performance.now() * 0.012) * 0.025;
  }

  cameraTarget.copy(player.position);
  cameraTarget.y += 1.0;

  // Keep buildings between the player and camera from hiding the character.
  desiredCamera.copy(player.position).add(cameraOffset);
  cameraDirection.subVectors(desiredCamera, cameraTarget);
  const cameraDistance = cameraDirection.length();
  cameraDirection.normalize();
  cameraRaycaster.set(cameraTarget, cameraDirection);
  cameraRaycaster.far = cameraDistance;
  const cameraHits = cameraRaycaster.intersectObjects(blocks, false);
  if (cameraHits.length > 0) {
    const safeDistance = Math.max(1.4, cameraHits[0].distance - 0.35);
    desiredCamera.copy(cameraTarget).addScaledVector(cameraDirection, safeDistance);
  }
  // Move inward immediately on obstruction, smooth out again afterward.
  const followFactor = cameraHits.length > 0 ? 1 : 1 - Math.pow(0.00001, dt);
  camera.position.lerp(desiredCamera, followFactor);
  camera.lookAt(cameraTarget);

  moon.position.x = player.position.x - 20;
  moon.position.z = player.position.z + 12;

  renderer.render(scene, camera);

  const fps = Math.round(1 / Math.max(dt, 0.001));
  const status = hud.querySelector(".status");
  if (status) status.innerHTML = `COLLISION TEST <span></span> ${fps} FPS · ${blockedThisFrame ? "🧱 WAND" : "FREI"} · BLOCKS ${collisionCount}`;
}

animate();
