import * as THREE from "three";
import { createMonsterGame } from "./game/monsters";
import { createGameSystems } from "./game/systems";
import { createDistrictWorld } from "./game/world";
import { createEnvironment } from "./game/environment";
import { createGrowSystem } from "./game/grow";
import { createFishingSystem } from "./game/fishing";
import { createFishingWorld } from "./game/fish-art";
import { fishEffectMultiplier } from "./game/fish-consumption";
import { getSave, saveProgress } from "./game/save";
import { createHomeInteractions } from "./game/home";
import { createRivalSystem } from "./game/rival";
import { createStoryEconomy } from "./game/story-economy";
import { createRadioSystem } from "./game/radio";
import { createMonsterViewer } from "./game/monster-viewer";
import { createPostProcessing } from "./game/post-processing";
import { graphicsPixelRatio, type GraphicsQuality } from "./game/graphics-profile";
import { createAchievementBook } from "./game/achievement-book";
import { syncAchievements } from "./game/achievements";
import { recordAchievementActivity } from "./game/achievement-activity";
import { clothingId, clothingLabel, CLOTHING_IDS, toggleClothing, toggleBag } from "./game/clothing-state";
import { createHumanoid } from "./game/humanoid";
import { createClothingVisuals } from "./game/clothing-visuals";
import "./styles.css";
import "./home.css";
import "./clothing.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found.");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07090d);
scene.fog = new THREE.FogExp2(0x111923, 0.009);

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

const environment = createEnvironment(scene, renderer);
const postProcessing = createPostProcessing(renderer, scene, camera);
const storedQuality = localStorage.getItem("420mon-graphics-quality");
let graphicsQuality: GraphicsQuality = storedQuality === "high" || storedQuality === "low" ? storedQuality : "auto";
postProcessing.setQuality(graphicsQuality);

// Modular low-poly humanoid. Individual limb pivots can later be replaced
// with rigged meshes, clothing and equipment without changing movement code.
const player = new THREE.Group();
const character = new THREE.Group();
player.add(character);
const jacket = new THREE.MeshStandardMaterial({ color: 0x185d50, roughness: 0.68, metalness: 0.18 });
const trim = new THREE.MeshStandardMaterial({ color: 0x4bffc0, emissive: 0x087b50, emissiveIntensity: 0.7 });
const skin = new THREE.MeshStandardMaterial({ color: 0xc4a68d, roughness: 0.88 });
const trousers = new THREE.MeshStandardMaterial({ color: 0x171f2c, roughness: 0.84 });
const boots = new THREE.MeshStandardMaterial({ color: 0x0a0e16, roughness: 0.75 });
function part(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
const torso = part(character, new THREE.BoxGeometry(0.78, 0.88, 0.4), jacket, 0, 1.36, 0);
const shoulderTrim = part(character, new THREE.BoxGeometry(0.8, 0.09, 0.44), trim, 0, 1.76, 0);
part(character, new THREE.CylinderGeometry(0.12, 0.12, 0.18, 10), skin, 0, 1.88, 0);
const face = part(character, new THREE.SphereGeometry(0.28, 16, 12), skin, 0, 2.15, 0);
const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x17121e, roughness: 0.9 });
const hair = part(character, new THREE.SphereGeometry(0.295, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMaterial, 0, 2.18, 0);
const ponytail = part(character, new THREE.CapsuleGeometry(0.11, 0.34, 6, 10), hairMaterial, 0, 1.95, -0.29);

const waist = part(character, new THREE.BoxGeometry(0.58, 0.14, 0.5), trousers, 0, 0.91, 0);
const leftArm = new THREE.Group();
const rightArm = new THREE.Group();
leftArm.position.set(-0.51, 1.72, 0);
rightArm.position.set(0.51, 1.72, 0);
character.add(leftArm, rightArm);
const leftArmMesh = part(leftArm, new THREE.BoxGeometry(0.23, 0.7, 0.28), jacket, 0, -0.35, 0);
const rightArmMesh = part(rightArm, new THREE.BoxGeometry(0.23, 0.7, 0.28), jacket, 0, -0.35, 0);
part(leftArm, new THREE.BoxGeometry(0.2, 0.18, 0.23), skin, 0, -0.77, 0);
part(rightArm, new THREE.BoxGeometry(0.2, 0.18, 0.23), skin, 0, -0.77, 0);
const leftLeg = new THREE.Group();
const rightLeg = new THREE.Group();
leftLeg.position.set(-0.2, 0.9, 0);
rightLeg.position.set(0.2, 0.9, 0);
character.add(leftLeg, rightLeg);
const leftLegMesh = part(leftLeg, new THREE.BoxGeometry(0.28, 0.69, 0.3), trousers, 0, -0.36, 0);
const rightLegMesh = part(rightLeg, new THREE.BoxGeometry(0.28, 0.69, 0.3), trousers, 0, -0.36, 0);
const leftBoot = part(leftLeg, new THREE.BoxGeometry(0.32, 0.22, 0.47), boots, 0, -0.76, 0.07);
const rightBoot = part(rightLeg, new THREE.BoxGeometry(0.32, 0.22, 0.47), boots, 0, -0.76, 0.07);
scene.add(player);
type CharacterChoice = "man" | "woman";
const storedChoice = localStorage.getItem("420mon-character");
let characterChoice: CharacterChoice = storedChoice ? storedChoice === "woman" ? "woman" : "man" : getSave().playerGender === "f" ? "woman" : "man";
function applyCharacterChoice(choice: CharacterChoice) {
  characterChoice = choice;
  localStorage.setItem("420mon-character", choice);
  torso.scale.x = choice === "woman" ? 0.83 : 1;
  character.scale.set(choice === "woman" ? 0.94 : 1, choice === "woman" ? 0.96 : 1, 1);
  leftArm.position.x = choice === "woman" ? -0.46 : -0.51;
  rightArm.position.x = choice === "woman" ? 0.46 : 0.51;
  ponytail.visible = choice === "woman";
  hair.scale.setScalar(choice === "woman" ? 1.06 : 1);
}
applyCharacterChoice(characterChoice);
let walkCycle = 0;
const human = createHumanoid(player, ready => {
  character.visible = !ready;
  renderer.domElement.dataset.playerModel = ready ? "rocketbox-rigged" : "fallback";
});

const playerRadius = 0.4;
let collisionCount = 0;
let blockedThisFrame = false;
const districtWorld = createDistrictWorld(scene, player);
const monsterGame = createMonsterGame(scene, player, districtWorld);
const grow = createGrowSystem(districtWorld);
const fishing = createFishingSystem(districtWorld);
const fishingWorld = createFishingWorld(districtWorld);
const achievements = createAchievementBook(districtWorld);
const story = createStoryEconomy(districtWorld);
const radio = createRadioSystem();
const monsterViewer = createMonsterViewer();
const home = createHomeInteractions(districtWorld, grow, fishing, monsterGame, achievements, { ...story, openRadio: radio.open });
const rival = createRivalSystem(districtWorld, home.openNim);
createGameSystems(districtWorld, () => grow.openShop(), achievements);

function movePlayer(dx: number, dz: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  for (let i = 0; i < steps; i++) {
    const nextX = player.position.x + dx / steps;
    if (!districtWorld.collides(nextX, player.position.z, playerRadius)) player.position.x = nextX;
    else blockedThisFrame = true;
    const nextZ = player.position.z + dz / steps;
    if (!districtWorld.collides(player.position.x, nextZ, playerRadius)) player.position.z = nextZ;
    else blockedThisFrame = true;
  }
}
window.dispatchEvent(new CustomEvent("420mon-district-change", { detail: districtWorld.current() }));

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

window.addEventListener("keydown", (event) => {
  if ((event.target as HTMLElement)?.matches("input,select,textarea")) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
  setKey(event.code, true);
});
window.addEventListener("blur", () => { for (const key of Object.keys(state)) state[key as keyof typeof state] = false; });
window.addEventListener("keyup", (event) => setKey(event.code, false));

const hud = document.createElement("div");
hud.className = "hud";
hud.innerHTML = `
  <div class="brand">420MON <span>LOWTOWN</span></div>
  <div class="status">DEIN ZUHAUSE IN 3D</div>
  <div class="hint">WASD / PFEILE · E INTERAGIEREN · T KLEIDUNG · SHIFT LAUFEN</div>
  <div class="target">LOWTOWN · TESTVERSION 33</div>
  <div class="local-map"><canvas id="local-map-canvas" width="240" height="160"></canvas><span id="local-map-name"></span></div>
`;
app.appendChild(hud);
const graphicsControl = document.createElement("label");
graphicsControl.className = "graphics-control";
graphicsControl.innerHTML = '<span>Grafik</span><select aria-label="Grafikqualität"><option value="auto">Automatisch</option><option value="high">Hoch</option><option value="low">Sparsam</option></select>';
const graphicsSelect = graphicsControl.querySelector<HTMLSelectElement>("select")!;
graphicsSelect.value = graphicsQuality;
graphicsSelect.onchange = () => {
  graphicsQuality = graphicsSelect.value as GraphicsQuality;
  localStorage.setItem("420mon-graphics-quality", graphicsQuality);
  postProcessing.setQuality(graphicsQuality);
  resize();
};
app.appendChild(graphicsControl);
const characterPicker = document.createElement("div");
characterPicker.className = "character-picker";
characterPicker.innerHTML = '<span>CHARAKTER</span><button type="button" data-choice="man">MANN</button><button type="button" data-choice="woman">FRAU</button>';
app.appendChild(characterPicker);
function updatePicker() {
  characterPicker.querySelectorAll<HTMLButtonElement>("button").forEach(button => {
    const active = button.dataset.choice === characterChoice;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
characterPicker.querySelectorAll<HTMLButtonElement>("button").forEach(button => {
  button.addEventListener("click", () => {
    applyCharacterChoice(button.dataset.choice === "woman" ? "woman" : "man");
    updatePicker();
  });
});
updatePicker();

// Full mobile-friendly character studio with persistent presets.
type StudioOptions = {
  choice: CharacterChoice;
  skin: string;
  hair: string;
  hairStyle: "short" | "long" | "mohawk";
  face: "classic" | "soft" | "sharp";
  outfit: "street" | "runner" | "tech";
  jacket: string;
  pants: string;
  shoes: string;
  height: number;
  build: number;
};
const studioDefaults: StudioOptions = {
  choice: characterChoice, skin: "#c4a68d", hair: "#17121e",
  hairStyle: "short", face: "classic", outfit: "street",
  jacket: "#536742", pants: "#171f2c", shoes: "#0a0e16",
  height: 1, build: 1,
};
function loadStudio(): StudioOptions {
  try {
    const raw = localStorage.getItem("420mon-studio-v1");
    if (raw) return { ...studioDefaults, ...JSON.parse(raw) } as StudioOptions;
  } catch { /* corrupt or unavailable storage: use defaults */ }
  return { ...studioDefaults };
}
let studio = loadStudio();
const facialDetails = new THREE.Group();
character.add(facialDetails);
const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111823, roughness: 0.4 });
for (const x of [-0.1, 0.1]) {
  const eye = part(facialDetails, new THREE.SphereGeometry(0.026, 8, 6), eyeMaterial, x, 2.17, 0.267);
  eye.scale.z = 0.5;
}
const mouth = part(facialDetails, new THREE.BoxGeometry(0.12, 0.018, 0.012), eyeMaterial, 0, 2.03, 0.267);
const nose = part(facialDetails, new THREE.SphereGeometry(0.045, 8, 6), skin, 0, 2.105, 0.282);
const hairBack = part(character, new THREE.BoxGeometry(0.53, 0.68, 0.2), hairMaterial, 0, 1.92, -0.22);
const mohawk = part(character, new THREE.BoxGeometry(0.14, 0.28, 0.49), hairMaterial, 0, 2.47, 0);
const jacketAccent = part(character, new THREE.BoxGeometry(0.07, 0.7, 0.03), trim, 0, 1.37, 0.22);
const belt = part(character, new THREE.BoxGeometry(0.61, 0.08, 0.46), trim, 0, 0.97, 0);
const clothes = createClothingVisuals({ character, torso, leftArm, rightArm, leftLeg, rightLeg, leftArmMesh, rightArmMesh, leftLegMesh, rightLegMesh, skin, shoulderTrim, jacketAccent, belt });
function syncClothes() {
  clothes.apply(clothingId(getSave().outfit), studio.choice === "woman" ? .83 : 1);
  renderer.domElement.dataset.outfit = clothes.current();
  human.setLook(studio, clothes.current());
}
function applyStudio() {
  applyCharacterChoice(studio.choice);
  skin.color.set(studio.skin);
  hairMaterial.color.set(studio.hair);
  jacket.color.set(studio.jacket);
  trousers.color.set(studio.pants);
  boots.color.set(studio.shoes);
  hair.visible = studio.hairStyle !== "mohawk";
  ponytail.visible = studio.hairStyle === "long";
  hairBack.visible = studio.hairStyle === "long";
  mohawk.visible = studio.hairStyle === "mohawk";
  face.scale.x = studio.face === "soft" ? 1.08 : studio.face === "sharp" ? 0.88 : 1;
  face.scale.y = studio.face === "sharp" ? 1.12 : 1;
  nose.scale.setScalar(studio.face === "sharp" ? 1.25 : 1);
  mouth.scale.x = studio.face === "soft" ? 1.2 : 1;
  torso.scale.x = (studio.choice === "woman" ? 0.83 : 1) * studio.build;
  waist.scale.x = studio.build;
  character.scale.set((studio.choice === "woman" ? 0.94 : 1) * studio.build, (studio.choice === "woman" ? 0.96 : 1) * studio.height, studio.build);
  jacketAccent.visible = studio.outfit !== "street";
  belt.visible = studio.outfit === "tech";
  trim.color.set(studio.outfit === "runner" ? "#00eaff" : studio.outfit === "tech" ? "#ff48b5" : "#4bffc0");
  leftBoot.scale.z = studio.outfit === "tech" ? 1.2 : 1;
  rightBoot.scale.z = studio.outfit === "tech" ? 1.2 : 1;
  syncClothes();
  localStorage.setItem("420mon-studio-v1", JSON.stringify(studio));
  updatePicker();
}
const studioPanel = document.createElement("section");
studioPanel.className = "studio-panel";
studioPanel.setAttribute("aria-label", "Charaktereditor");
studioPanel.innerHTML = `
  <div class="studio-heading"><strong>CHARAKTER & KLEIDUNG</strong><button type="button" id="studio-close" aria-label="Editor schließen">✕</button></div>
  <div class="studio-wardrobe"><label for="wardrobe-outfit">Angelegte Kleidung</label><select id="wardrobe-outfit" aria-label="Angelegte Kleidung"></select><div><button type="button" id="wardrobe-turn">Ansicht drehen ↻</button><span id="wardrobe-status" role="status"></span></div></div>
  <div class="studio-scroll">
    <label>Charakter<select data-studio="choice"><option value="man">Mann</option><option value="woman">Frau</option></select></label>
    <label>Frisur<select data-studio="hairStyle"><option value="short">Kurz</option><option value="long">Lang / Zopf</option><option value="mohawk">Irokesenschnitt</option></select></label>
    <label>Gesichtsform<select data-studio="face"><option value="classic">Klassisch</option><option value="soft">Weich</option><option value="sharp">Markant</option></select></label>
    <label>Grundstil<select data-studio="outfit"><option value="street">Streetwear</option><option value="runner">Neon Runner</option><option value="tech">Techwear</option></select></label>
    <label>Hautfarbe<input data-studio="skin" type="color"></label>
    <label>Haarfarbe<input data-studio="hair" type="color"></label>
    <label>Tanktopfarbe<input data-studio="jacket" type="color"></label>
    <label>Hosenfarbe<input data-studio="pants" type="color"></label>
    <label>Schuhfarbe<input data-studio="shoes" type="color"></label>
    <label>Größe<input data-studio="height" type="range" min="0.85" max="1.15" step="0.01"></label>
    <label>Statur<input data-studio="build" type="range" min="0.8" max="1.2" step="0.01"></label>
  </div>
  <div class="studio-actions"><button type="button" id="studio-reset">Zurücksetzen</button><button type="button" id="studio-done">Fertig ✓</button></div>`;
app.appendChild(studioPanel);
let previewTurn = 0;
let wardrobeSignature = "";
const wardrobeSelect = studioPanel.querySelector<HTMLSelectElement>("#wardrobe-outfit")!;
function syncWardrobe() {
  const s = getSave(), current = clothingId(s.outfit);
  const ids = ["nude", ...CLOTHING_IDS.filter(id => s.inventory[id] >= 1 || current === id)];
  const signature = [current, ...ids].join("|");
  if (signature === wardrobeSignature) return;
  wardrobeSignature = signature;
  wardrobeSelect.replaceChildren();
  for (const id of ids) {
    const option = document.createElement("option"); option.value = id; option.textContent = clothingLabel(id); wardrobeSelect.append(option);
  }
  wardrobeSelect.value = current;
  studioPanel.querySelector("#wardrobe-status")!.textContent = clothingLabel(current);
}
wardrobeSelect.addEventListener("change", () => {
  if (wardrobeSelect.value === clothingId(getSave().outfit)) return;
  const result = toggleClothing(getSave(), wardrobeSelect.value);
  if (result.ok) saveProgress();
  syncWardrobe(); studioPanel.querySelector("#wardrobe-status")!.textContent = result.lines.join(" ");
});
studioPanel.querySelector("#wardrobe-turn")!.addEventListener("click", () => { previewTurn += Math.PI / 2; });
window.addEventListener("420mon-save-changed", () => { syncClothes(); syncWardrobe(); });
syncWardrobe();
const studioOpen = document.createElement("button");
studioOpen.className = "studio-open";
studioOpen.textContent = "✎ CHARAKTER";
studioOpen.type = "button";
app.appendChild(studioOpen);
function toggleStudio(open: boolean) {
  if (open && document.querySelector(".monster-battle:not([hidden]),.systems-panel:not([hidden]),.grow-backdrop:not([hidden]),.home-dialog:not([hidden]),.fish-overlay:not([hidden]),.achievement-overlay:not([hidden]),.monster-model-overlay:not([hidden]),.story-overlay:not([hidden]),.radio-overlay:not([hidden]),.support-overlay:not([hidden])")) return;
  studioPanel.classList.toggle("is-open", open);
  document.body.classList.toggle("wardrobe-preview", open);
  if (!open && studioPanel.contains(document.activeElement)) (document.activeElement as HTMLElement)?.blur();
  studioOpen.setAttribute("aria-expanded", String(open));
  studioOpen.textContent = open ? "✎ EDITOR OFFEN" : "✎ CHARAKTER";
  if (open) { state.forward = state.backward = state.left = state.right = state.sprint = false; previewTurn = 0; syncWardrobe(); }
  updateStudioView();
}
window.addEventListener("420mon-preview-clothes", () => toggleStudio(true));
window.addEventListener("keydown", event => {
  if (event.code === "Escape" && studioPanel.classList.contains("is-open")) toggleStudio(false);
  if (event.code !== "KeyT" || event.repeat || event.defaultPrevented || (event.target as HTMLElement)?.closest("input,select,textarea,[contenteditable=true]") || document.querySelector(".monster-battle:not([hidden]),.systems-panel:not([hidden]),.studio-panel.is-open,.grow-backdrop:not([hidden]),.home-dialog:not([hidden]),.fish-overlay:not([hidden]),.achievement-overlay:not([hidden]),.monster-model-overlay:not([hidden]),.story-overlay:not([hidden]),.radio-overlay:not([hidden]),.support-overlay:not([hidden])")) return;
  const result = toggleBag(getSave()); if (result.ok) saveProgress();
});
studioOpen.addEventListener("click", () => toggleStudio(!studioPanel.classList.contains("is-open")));
studioPanel.querySelector("#studio-close")!.addEventListener("click", () => toggleStudio(false));
studioPanel.querySelector("#studio-done")!.addEventListener("click", () => toggleStudio(false));
function syncStudioInputs() {
  studioPanel.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-studio]").forEach(input => {
    const key = input.dataset.studio as keyof StudioOptions;
    input.value = String(studio[key]);
  });
}
studioPanel.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-studio]").forEach(input => {
  input.addEventListener("input", () => {
    const key = input.dataset.studio as keyof StudioOptions;
    (studio as unknown as Record<string, string | number>)[key] =
      key === "height" || key === "build" ? Number(input.value) : input.value;
    applyStudio();
  });
});
studioPanel.querySelector("#studio-reset")!.addEventListener("click", () => {
  studio = { ...studioDefaults };
  syncStudioInputs();
  applyStudio();
});
syncStudioInputs();
applyStudio();
characterPicker.querySelectorAll<HTMLButtonElement>("button").forEach(button => {
  button.addEventListener("click", () => {
    studio.choice = button.dataset.choice === "woman" ? "woman" : "man";
    applyStudio();
    syncStudioInputs();
  });
});

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
window.addEventListener("420mon-model-opened", () => {
  for (const key of Object.keys(state)) state[key as keyof typeof state] = false;
  touch.x = 0; touch.y = 0; touch.sprint = false;
  joystickPointer = null; knob.style.transform = "translate(0px, 0px)";
  velocity.set(0, 0, 0);
});
const cameraTarget = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const cameraRaycaster = new THREE.Raycaster();
const cameraDirection = new THREE.Vector3();
const cameraOffset = new THREE.Vector3(8, 13, 12);
const cameraMinDistance = 8;
const mapCanvas = hud.querySelector<HTMLCanvasElement>("#local-map-canvas")!;
const mapContext = mapCanvas.getContext("2d")!;
let mapClock = 0;
function drawLocalMap() {
  const info = districtWorld.getMapInfo();
  const m = info.map;
  mapContext.clearRect(0, 0, 240, 160);
  mapContext.fillStyle = "#112020"; mapContext.fillRect(0, 0, 240, 160);
  const scale = Math.min(224 / m.w, 140 / m.h);
  const ox = (240 - m.w * scale) / 2, oy = (160 - m.h * scale) / 2;
  mapContext.fillStyle = "#71857b";
  for (const wall of m.walls) mapContext.fillRect(ox + wall.x * scale, oy + wall.y * scale, Math.max(1, wall.w * scale), Math.max(1, wall.h * scale));
  for (const obj of m.objs) {
    mapContext.fillStyle = obj.kind === "door" || obj.kind === "manhole" ? "#ecc782" : obj.kind === "pot" ? "#81b478" : "#829aaa";
    mapContext.fillRect(ox + obj.x * scale, oy + obj.y * scale, Math.max(3, obj.w * scale), Math.max(3, obj.h * scale));
  }
  mapContext.fillStyle = "#ecf5e1"; mapContext.beginPath(); mapContext.arc(ox + info.player.x * scale, oy + info.player.y * scale, 3.5, 0, Math.PI * 2); mapContext.fill();
  hud.querySelector("#local-map-name")!.textContent = info.name;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const mobile = window.matchMedia("(pointer: coarse)").matches || width < 760;
  const ratio = graphicsPixelRatio(width, height, window.devicePixelRatio, graphicsQuality, mobile);
  renderer.setPixelRatio(ratio);
  renderer.setSize(width, height, false);
  postProcessing.resize(width, height, ratio);
  updateStudioView();
}
function updateStudioView() {
  if (!studioPanel.classList.contains("is-open")) { camera.clearViewOffset(); return; }
  const width = window.innerWidth, height = window.innerHeight;
  const mobile = width <= 680;
  camera.setViewOffset(width, height, mobile ? 0 : studioPanel.getBoundingClientRect().width / 2, mobile ? height * .265 : 0, width, height);
}
window.addEventListener("resize", resize);
resize();

let achievementClock = 0;
let graphicsDistrict = "";
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  monsterGame.update(dt);
  rival.update(dt);
  districtWorld.update();
  renderer.domElement.dataset.npcModels = String(districtWorld.getRoot().userData.riggedNpcs ?? 0);
  grow.update(dt);
  story.update();
  fishing.update(dt);
  fishingWorld.update(dt);
  achievements.update(dt);
  const graphicsMap = districtWorld.getMapInfo();
  if (graphicsDistrict !== graphicsMap.id) {
    graphicsDistrict = graphicsMap.id;
    environment.setDistrict(graphicsMap.id, !!graphicsMap.map.indoor);
    postProcessing.setDistrict(graphicsMap.id);
    const diagnostics = environment.getDiagnostics();
    renderer.domElement.dataset.district = graphicsMap.id;
    renderer.domElement.dataset.rain = String(diagnostics.rainDrops);
    renderer.domElement.dataset.indoor = String(diagnostics.indoor);
  }
  environment.update(player, dt);
  mapClock += dt;
  if (mapClock > 0.15) { mapClock = 0; drawLocalMap(); }

  const input = new THREE.Vector3(
    Number(state.right) - Number(state.left) + touch.x,
    0,
    Number(state.backward) - Number(state.forward) - touch.y,
  );

  if (input.lengthSq() > 0) input.normalize();

  const overlayOpen = !!document.querySelector(".systems-panel:not([hidden]), .studio-panel.is-open, .grow-backdrop:not([hidden]), .home-dialog:not([hidden]), .fish-overlay:not([hidden]),.achievement-overlay:not([hidden]),.monster-model-overlay:not([hidden]),.story-overlay:not([hidden]),.radio-overlay:not([hidden]),.support-overlay:not([hidden])");
  const speed = monsterGame.inBattle || overlayOpen ? 0 : ((state.sprint || touch.sprint) ? 7.5 : 4.2) * fishEffectMultiplier(getSave(), "speed");
  velocity.lerp(input.multiplyScalar(speed), 1 - Math.pow(0.001, dt));
  blockedThisFrame = false;
  const beforeMove = { x: player.position.x, z: player.position.z };
  movePlayer(velocity.x * dt, velocity.z * dt);
  recordAchievementActivity(getSave(), dt, Math.hypot(player.position.x - beforeMove.x, player.position.z - beforeMove.z) / districtWorld.getMapInfo().scale);
  achievementClock += dt;
  if (achievementClock >= 8) {
    achievementClock = 0;
    if (syncAchievements(getSave()).length) saveProgress();
  }
  if (blockedThisFrame) collisionCount++;

  if (velocity.lengthSq() > 0.01) {
    const angle = Math.atan2(velocity.x, velocity.z);
    // Turn by the shortest angular path across the -PI / +PI boundary.
    const delta = Math.atan2(
      Math.sin(angle - player.rotation.y),
      Math.cos(angle - player.rotation.y),
    );
    player.rotation.y += delta * (1 - Math.exp(-12 * dt));
  }
  human.update(dt, velocity.length(), state.sprint || touch.sprint);
  renderer.domElement.dataset.playerAnimation = human.root.userData.animation;
  const moving = velocity.length() > 0.35;
  const gait = Math.min(1, velocity.length() / 4.2);
  if (moving) walkCycle += dt * (state.sprint || touch.sprint ? 13 : 9);
  const swing = moving ? Math.sin(walkCycle) * 0.62 * gait : 0;
  leftLeg.rotation.x = swing;
  rightLeg.rotation.x = -swing;
  leftArm.rotation.x = -swing * 0.75;
  rightArm.rotation.x = swing * 0.75;
  character.position.y = moving ? Math.abs(Math.sin(walkCycle)) * 0.045 * gait : 0;
  character.rotation.z = moving ? Math.sin(walkCycle) * 0.025 : 0;
  cameraTarget.copy(player.position);
  cameraTarget.y += 1.0;

  // Keep a comfortable third-person view. Occluding buildings become
  // translucent instead of forcing the camera into the character.
  const indoor = !!districtWorld.getMapInfo().map.indoor;
  const editing = studioPanel.classList.contains("is-open");
  const desiredOffset = editing ? new THREE.Vector3(3, 2.4, 5).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y + previewTurn) : indoor ? cameraOffset.clone().multiplyScalar(0.66) : cameraOffset;
  desiredCamera.copy(player.position).add(desiredOffset);
  camera.position.lerp(desiredCamera, 1 - Math.pow(0.00001, dt));
  // Never allow the third-person camera to collapse into the player.
  cameraDirection.subVectors(camera.position, cameraTarget);
  const minCameraDistance = editing ? 4.5 : cameraMinDistance;
  if (cameraDirection.length() < minCameraDistance) {
    camera.position.copy(cameraTarget).add(cameraDirection.normalize().multiplyScalar(minCameraDistance));
  }
  camera.lookAt(cameraTarget);
  cameraDirection.subVectors(camera.position, cameraTarget);
  const cameraDistance = cameraDirection.length();
  cameraDirection.normalize();
  cameraRaycaster.set(cameraTarget, cameraDirection);
  cameraRaycaster.far = cameraDistance;
  const blocks = districtWorld.getOccluders();
  const occluded = new Set(cameraRaycaster.intersectObjects(blocks, false).map(hit => hit.object));
  for (const building of blocks) {
    const material = building.material as THREE.MeshStandardMaterial;
    const hidden = occluded.has(building);
    material.transparent = hidden;
    material.opacity = hidden ? 0.12 : 1;
    material.depthWrite = !hidden;
  }

  if (!monsterViewer.isOpen()) postProcessing.render(dt);
  const graphicsState = postProcessing.getDiagnostics();
  renderer.domElement.dataset.graphics = graphicsState.mode;
  renderer.domElement.dataset.bloom = String(graphicsState.bloom);

  const status = hud.querySelector(".status");
  if (status) status.textContent = districtWorld.getMapInfo().name;
}

animate();
