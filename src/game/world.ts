import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { MAPS, mapSketch, CAPSULE_SPAWN_X, CAPSULE_SPAWN_Y, type MapDef, type MapObj, type Rect } from "./data/maps";
import { WORLD_SCALE, mapToWorld, worldToMap, collidesOnMap, safeSpawn, isDefeatedGate } from "./worldGeometry";
import { getSave, saveProgress } from "./save";
import { recordVisit, setQuestState } from "./quests";
import { stageOf } from "./data/progress";
import { createWorldSurfaces, projectSurfaceUvs } from "./world-surfaces";
import { getDistrictGraphics } from "./graphics-profile";

/** Geometry, object positions and routes come from the original 2D game. */
export type MapInfo = {
  id: string; name: string; map: MapDef; w: number; h: number; scale: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  player: { x: number; y: number };
};
export type DistrictTravel = {
  travel: (id: string, x?: number, y?: number) => void;
  current: () => string;
  shopNearby: () => boolean;
  shopAt: (obj: MapObj) => boolean;
  openShop: (fn: (obj?: MapObj) => void) => void;
  update: () => void;
  collides: (x: number, z: number, radius?: number) => boolean;
  getOccluders: () => THREE.Mesh[];
  getMapInfo: () => MapInfo;
  getRoot: () => THREE.Group;
  toWorld: (x: number, y: number) => THREE.Vector3;
  setInteractionHandler: (fn: (obj: MapObj, mapId: string) => boolean | void) => void;
  setRoamingNpc: (obj?: MapObj) => void;
  setStoryNpcs: (objects: MapObj[]) => void;
};

const palette = {
  plaster: 0x56616b, stone: 0x39434c, wood: 0x65503b, dark: 0x1e2931,
  brass: 0x9c8050, linen: 0xbab09d, rust: 0x725344, soil: 0x231c16,
  green: 0x507462, glow: 0xd7a459, blue: 0x638b96,
};
const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const DAILY_TRAINERS = new Set(["cinder", "tide", "vial", "knuckle", "hush", "glow", "coil"]);

export function createDistrictWorld(scene: THREE.Scene, player: THREE.Group): DistrictTravel {
  const root = new THREE.Group(); root.name = "original-map-world"; scene.add(root);
  const surfaces = createWorldSurfaces();
  const mat = surfaces.material;
  const poolCanvas = document.createElement("canvas"); poolCanvas.width = poolCanvas.height = 128;
  const poolContext = poolCanvas.getContext("2d")!;
  const poolGradient = poolContext.createRadialGradient(64, 64, 3, 64, 64, 64);
  poolGradient.addColorStop(0, "rgba(255,255,255,.75)"); poolGradient.addColorStop(.25, "rgba(255,255,255,.35)"); poolGradient.addColorStop(1, "rgba(255,255,255,0)");
  poolContext.fillStyle = poolGradient; poolContext.fillRect(0, 0, 128, 128);
  const poolTexture = new THREE.CanvasTexture(poolCanvas);
  const puddleCanvas = document.createElement("canvas"); puddleCanvas.width = puddleCanvas.height = 128;
  const puddleContext = puddleCanvas.getContext("2d")!;
  const puddlePixels = puddleContext.createImageData(128, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const dx = (x - 64) / 64, dy = (y - 64) / 64, angle = Math.atan2(dy, dx);
    const edge = .75 + .13 * Math.sin(angle * 5) + .06 * Math.cos(angle * 9);
    const distance = Math.hypot(dx, dy), i = (y * 128 + x) * 4;
    const alpha = Math.max(0, Math.min(1, (edge - distance) * 18)) * (225 + seeded(x + y * 128) * 30);
    puddlePixels.data[i] = puddlePixels.data[i + 1] = puddlePixels.data[i + 2] = alpha; puddlePixels.data[i + 3] = 255;
  }
  puddleContext.putImageData(puddlePixels, 0, 0);
  const puddleTexture = new THREE.CanvasTexture(puddleCanvas);
  const puddleMaterial = new THREE.MeshPhysicalMaterial({ color: 0x7c8b91, alphaMap: puddleTexture, transparent: true, opacity: .48, roughness: .09, metalness: .12, clearcoat: 1, clearcoatRoughness: .055, depthWrite: false });
  let id = "capsule";
  let active = MAPS[id];
  let occluders: THREE.Mesh[] = [];
  let interaction: ((obj: MapObj, mapId: string) => boolean | void) | undefined;
  let shopFn: ((obj?: MapObj) => void) | undefined;
  let nearby: MapObj | undefined;
  let interactionMessage: { id: string; text: string; until: number } | undefined;
  const lampLights: THREE.PointLight[] = [];
  let lastLightSelection = -Infinity;
  const lightPosition = new THREE.Vector3();
  let lastSave = 0;
  let lastPosition = { x: NaN, y: NaN };
  const glowing: { mesh: THREE.Mesh; phase: number }[] = [];
  const mapObjects = new Map<string, THREE.Group>();
  let roamingNpc: MapObj | undefined;
  const storyNpcs = new Map<string, MapObj>();

  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, x: number, y: number, z: number, shadow = true) {
    projectSurfaceUvs(geometry, material);
    const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true;
    m.userData.worldOwned = true;
    parent.add(m); return m;
  }
  function box(parent: THREE.Object3D, width: number, height: number, depth: number, material: THREE.Material, x = 0, y = height / 2, z = 0) {
    return mesh(new THREE.BoxGeometry(Math.max(.015, width), Math.max(.015, height), Math.max(.015, depth)), material, parent, x, y, z);
  }
  function cylinder(parent: THREE.Object3D, top: number, bottom: number, height: number, material: THREE.Material, x = 0, y = height / 2, z = 0) {
    return mesh(new THREE.CylinderGeometry(top, bottom, height, 12), material, parent, x, y, z);
  }
  function occluder(m: THREE.Mesh) {
    // Camera fading changes transparency per mesh. Keep those materials
    // independent while retaining the shared map texture across transitions.
    const copy = (m.material as THREE.Material).clone();
    copy.userData.local = true; copy.userData.sharedTexture = true;
    m.material = copy; occluders.push(m); return m;
  }
  function tag(parent: THREE.Object3D, label: string, width: number, y: number, color = "#d2bd89", z = 0) {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#202722"; ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.strokeRect(8, 8, 496, 112);
    ctx.fillStyle = color; ctx.font = "600 40px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label, 256, 67, 470);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }); material.userData.local = true;
    return mesh(new THREE.PlaneGeometry(width, width / 4), material, parent, 0, y, z, false);
  }
  function lamp(parent: THREE.Object3D, x: number, y: number, z: number, color = 0xf5bc71, strength = 12) {
    box(parent, .42, .13, .33, mat(palette.dark, "metal"), x, y, z);
    box(parent, .33, .035, .22, mat(color, undefined, color), x, y - .08, z);
    const light = new THREE.PointLight(color, strength * (active.indoor ? 1 : 1.6), 12, 2);
    light.position.set(x, y - .2, z); light.visible = false; parent.add(light); lampLights.push(light);
    if (!active.indoor) {
      // Soft pools and broken wet streaks sit directly below the actual fixture.
      const pool = new THREE.MeshBasicMaterial({ color, map: poolTexture, transparent: true, opacity: .19, depthWrite: false, blending: THREE.AdditiveBlending });
      pool.userData.local = true; pool.userData.sharedTexture = true;
      const reflected = mesh(new THREE.PlaneGeometry(2.8, 3.8), pool, parent, x, .066, z, false);
      reflected.rotation.x = -Math.PI / 2;
      const shaft = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .018, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }); shaft.userData.local = true;
      const cone = mesh(new THREE.ConeGeometry(1.15, Math.max(.3, y - .25), 16, 1, true), shaft, parent, x, (y - .25) / 2 + .1, z, false);
      cone.name = "lamp-haze";
    }
  }
  function at(x: number, y: number) {
    const p = mapToWorld(active, x, y); return new THREE.Vector3(p.x, 0, p.z);
  }
  function region(rect: Rect, height: number, material: THREE.Material, y = height / 2) {
    const p = at(rect.x + rect.w / 2, rect.y + rect.h / 2);
    return box(root, rect.w * WORLD_SCALE, height, rect.h * WORLD_SCALE, material, p.x, y, p.z);
  }
  function objectGroup(obj: MapObj) {
    const g = new THREE.Group(); g.name = `map-object:${obj.id}`; g.userData.object = obj;
    g.position.copy(at(obj.x + obj.w / 2, obj.y + obj.h / 2)); root.add(g); mapObjects.set(obj.id, g); return g;
  }

  function planter(obj: MapObj, g: THREE.Group) {
    const boxPot = (obj.pot ?? 0) >= 6;
    if (boxPot) {
      box(g, obj.w * WORLD_SCALE, .38, obj.h * WORLD_SCALE, mat(0x645b40, "wood"));
      box(g, obj.w * WORLD_SCALE - .12, .06, obj.h * WORLD_SCALE - .12, mat(palette.soil), 0, .4, 0);
      for (const x of [-1, 1]) box(g, .07, .47, obj.h * WORLD_SCALE + .06, mat(palette.brass, "metal"), x * (obj.w * WORLD_SCALE / 2 - .06), .235);
    } else {
      cylinder(g, .39, .28, .53, mat(0x8b6950, "plaster"));
      cylinder(g, .405, .405, .12, mat(0xa4835a, "plaster"), 0, .53);
      cylinder(g, .35, .35, .025, mat(palette.soil), 0, .567);
      cylinder(g, .43, .43, .035, mat(palette.dark), 0, .025);
    }
    tag(g, `${(obj.pot ?? 0) + 1}`, .45, boxPot ? .22 : .32, "#dac491", boxPot ? obj.h * WORLD_SCALE / 2 + .02 : .39);
  }
  function bed(obj: MapObj, g: THREE.Group) {
    const w = obj.w * WORLD_SCALE, d = obj.h * WORLD_SCALE;
    box(g, w, .3, d, mat(palette.wood, "wood"));
    box(g, w - .1, .22, d - .1, mat(palette.linen), 0, .43);
    box(g, w * .62, .15, d - .05, mat(0x536b62), w * .18, .61);
    box(g, w * .24, .17, d * .65, mat(0xd0c0a0), -w * .31, .625);
    box(g, .12, .76, d, mat(palette.wood, "wood"), -w / 2, .38);
    for (const x of [-1, 1]) for (const z of [-1, 1]) box(g, .1, .25, .1, mat(palette.dark), x * (w / 2 - .12), .1, z * (d / 2 - .12));
  }
  function npc(obj: MapObj, g: THREE.Group) {
    const seed = Array.from(obj.id).reduce((n, c) => n + c.charCodeAt(0), 0);
    const outfit = [0x596a59, 0x786047, 0x59536a, 0x597580, 0x8a6256][seed % 5];
    const skin = mat([0xc09d77, 0x8c6b4d, 0xcfb18f][seed % 3]);
    mesh(new THREE.CapsuleGeometry(.31, .56, 4, 8), mat(outfit, "plaster"), g, 0, 1.15, 0);
    mesh(new THREE.SphereGeometry(.24, 12, 10), skin, g, 0, 1.9, 0);
    mesh(new THREE.SphereGeometry(.255, 12, 8, 0, Math.PI * 2, 0, Math.PI * .5), mat(0x272725), g, 0, 1.98, -.025);
    for (const s of [-1, 1]) {
      box(g, .2, .68, .23, mat(0x2e3431), s * .17, .49);
      box(g, .25, .18, .38, mat(0x272820), s * .17, .09, .065);
      const arm = box(g, .17, .58, .2, mat(outfit), s * .43, 1.13); arm.rotation.z = s * .09;
      box(g, .15, .15, .17, skin, s * .46, .78);
    }
    tag(g, obj.label, Math.min(2.5, Math.max(1.4, obj.label.length * .13)), 2.7);
    if (obj.kind === "shop" || obj.kind === "stall") {
      box(g, 2.7, .86, 1.1, mat(palette.wood, "wood"), 0, .43, .94);
      box(g, 2.88, .12, 1.25, mat(palette.brass, "metal"), 0, .92, .94);
      for (let i = 0; i < 4; i++) cylinder(g, .13, .14, .3, mat(i % 2 ? 0xa89553 : 0x57765d), -.75 + i * .5, 1.14, .92);
      for (const s of [-1, 1]) box(g, .07, 2.9, .07, mat(palette.dark, "metal"), s * 1.25, 1.45, .85);
      box(g, 2.9, .15, 1.7, mat(obj.stall === "grow" ? 0x547659 : 0x967a4d, "plaster"), 0, 2.95, .73);
    }
  }
  function door(obj: MapObj, g: THREE.Group) {
    const hatch = obj.kind === "manhole";
    const w = Math.max(1.2, obj.w * WORLD_SCALE), d = Math.max(.6, obj.h * WORLD_SCALE);
    if (hatch) {
      const disc = cylinder(g, .72, .76, .06, mat(palette.dark, "metal"), 0, .06);
      for (let i = -2; i <= 2; i++) box(g, 1.15, .025, .045, mat(palette.brass, "metal"), 0, .106, i * .17);
      tag(g, obj.label, 2.2, 1.6); disc.userData.hatch = true; return;
    }
    if (obj.id.startsWith("pad_") || obj.id.startsWith("kai_cast")) {
      box(g, w, .08, d, mat(palette.green, undefined, 0x4a735f), 0, .07);
      tag(g, obj.label, 1.7, 1.4); return;
    }
    const side = obj.x < 24 || obj.x > active.w - 40;
    const length = side ? Math.min(2.6, d) : Math.min(3.4, w);
    const frame = new THREE.Group(); g.add(frame); if (side) frame.rotation.y = Math.PI / 2;
    box(frame, .17, 2.75, .25, mat(palette.wood, "wood"), -length / 2, 1.375);
    box(frame, .17, 2.75, .25, mat(palette.wood, "wood"), length / 2, 1.375);
    box(frame, length + .34, .2, .3, mat(palette.wood, "wood"), 0, 2.75);
    box(frame, length + .25, .09, .75, mat(palette.stone, "stone"), 0, .045);
    const glow = box(frame, length - .15, 2.45, .04, mat(0x1f322b, undefined, 0x537c64), 0, 1.23);
    glowing.push({ mesh: glow, phase: obj.x });
    tag(frame, obj.label, Math.max(1.65, length), 3.1);
    lamp(frame, 0, 2.82, .3, 0xffce84, 8);
  }
  function terminal(g: THREE.Group, width = 1.15) {
    box(g, width, .73, .82, mat(palette.dark, "metal"));
    const screen = box(g, width * .8, .56, .09, mat(0x182f28, undefined, 0x538269), 0, 1.02, -.14);
    screen.rotation.x = -.22;
    for (let i = 0; i < 3; i++) box(g, width * .55, .015, .015, mat(0x8fbd96, undefined, 0x619c73), -.04, .88 + i * .12, -.075);
    box(g, width * .7, .04, .29, mat(0x77796b, "metal"), 0, .76, .15);
  }
  function prop(obj: MapObj, g: THREE.Group) {
    const w = Math.max(.7, obj.w * WORLD_SCALE), d = Math.max(.6, obj.h * WORLD_SCALE);
    if (obj.id === "tank") {
      box(g, w, .35, d, mat(palette.wood, "wood"));
      box(g, w, .08, d, mat(palette.brass, "metal"), 0, 1.4);
      const glass = new THREE.MeshPhysicalMaterial({ color: 0x79a399, transparent: true, opacity: .22, roughness: .2, metalness: .05, side: THREE.DoubleSide }); glass.userData.local = true;
      box(g, w - .08, 1, d - .08, glass, 0, .86);
      box(g, w - .14, .05, d - .14, mat(0x355b50, undefined, 0x234b39), 0, .8);
      for (let i = 0; i < 7; i++) {
        const plant = cylinder(g, .02, .045, .45 + (i % 3) * .14, mat(0x406e44), -w * .4 + i * w * .12, .63, (i % 2 - .5) * d * .3);
        plant.rotation.z = (seeded(i) - .5) * .3;
      }
    } else if (obj.id === "st_desk") {
      box(g, w, .68, d, mat(palette.dark, "metal"));
      box(g, w, .08, d, mat(palette.wood, "wood"), 0, .78);
      for (let i = 0; i < 10; i++) {
        box(g, .1, .05, .08, mat(i % 3 ? palette.brass : palette.green), -w * .4 + i * w * .08, .86, .12);
        box(g, .035, .025, .35, mat(0xa0a092, "metal"), -w * .4 + i * w * .08, .85, -.18);
      }
      for (const x of [-1, 1]) terminalSpeaker(g, x * (w / 2 + .35), .45);
    } else if (obj.id.includes("slot_")) {
      box(g, w * .8, 1.6, d * .6, mat(0x70433c, "metal"));
      box(g, w * .7, .6, .06, mat(0xdbc073, undefined, 0x796430), 0, 1.23, d * .31);
      tag(g, "GLUTWALZE", w * .7, 1.85);
      for (let i = 0; i < 3; i++) cylinder(g, .12, .12, .08, mat(0x2d3428), -.3 + i * .3, 1.25, d * .35);
      box(g, w * .8, .13, .4, mat(palette.brass, "metal"), 0, .56, d * .4);
    } else if (obj.sprite?.includes("terminal") || obj.id === "term" || obj.id.startsWith("kino_")) {
      terminal(g, w);
    } else if (obj.sprite?.includes("barrel") || obj.label === "Fass") {
      cylinder(g, w * .4, w * .43, .95, mat(palette.rust, "metal"));
      for (const y of [.2, .75]) cylinder(g, w * .445, w * .445, .06, mat(palette.dark, "metal"), 0, y);
    } else if (obj.id.includes("cast")) {
      const pole = cylinder(g, .025, .025, 2.3, mat(palette.wood)); pole.rotation.z = -.5;
      box(g, .6, .1, .65, mat(palette.wood, "wood"), 0, .2);
    } else if (obj.id === "felix_cage_box") {
      box(g, w, .14, d, mat(palette.wood, "wood"));
      for (let i = 0; i < 7; i++) for (const z of [-1, 1]) box(g, .035, 1.04, .035, mat(palette.dark, "metal"), -w / 2 + i * w / 6, .63, z * d / 2);
      box(g, w, .05, d, mat(palette.dark, "metal"), 0, 1.17);
    } else {
      box(g, w, .6, d, mat(obj.kind === "starter" ? 0x85683f : palette.wood, "wood"));
      box(g, w + .03, .065, d + .03, mat(palette.brass, "metal"), 0, .6);
      for (const x of [-1, 1]) box(g, .09, .59, d + .04, mat(0x2e362d, "metal"), x * w * .32, .3);
      box(g, .16, .19, .045, mat(0xae9b65, "metal"), 0, .49, d / 2 + .03);
    }
    if (obj.kind === "starter" || obj.id === "term" || obj.id.includes("slot_")) tag(g, obj.label, Math.max(1.4, Math.min(w, 2.5)), 1.75);
  }
  function terminalSpeaker(g: THREE.Object3D, x: number, z: number) {
    box(g, .57, 1.06, .45, mat(0x282f29, "metal"), x, .53, z);
    for (const y of [.32, .8]) {
      const speaker = mesh(new THREE.CylinderGeometry(.18, .18, .025, 16), mat(0x141a18), g, x, y, z + .24);
      speaker.rotation.x = Math.PI / 2;
    }
  }

  function renderObject(obj: MapObj) {
    if (obj.kind === "wild" || isDefeatedGate(obj, getSave().deadWild)) return; // Encounters own wild meshes; defeated gate trainers vanish.
    const g = objectGroup(obj);
    if (obj.kind === "pot") planter(obj, g);
    else if (obj.kind === "bed" || obj.kind === "mattress") bed(obj, g);
    else if (obj.kind === "npc" || obj.kind === "shop" || obj.kind === "stall") npc(obj, g);
    else if (obj.kind === "door" || obj.kind === "manhole") door(obj, g);
    else if (obj.kind === "sign") { tag(g, obj.label, 1.8, 1.6); box(g, .08, 1.5, .08, mat(palette.dark, "metal")); }
    else if (obj.kind === "lamp") {
      cylinder(g, .045, .07, 2.8, mat(palette.dark, "metal")); lamp(g, .2, 2.75, 0);
      box(g, .7, .06, .07, mat(palette.dark, "metal"), .15, 2.84);
    } else if (obj.kind === "bin") {
      box(g, Math.max(.9, obj.w * WORLD_SCALE), 1, Math.max(.7, obj.h * WORLD_SCALE), mat(0x4f5b49, "metal"));
      box(g, 1.06, .12, .91, mat(palette.dark, "metal"), 0, 1.07);
      for (const s of [-1, 1]) box(g, .13, .2, .3, mat(palette.dark), s * .43, .11, .33);
    } else prop(obj, g);
  }

  function homeDetails() {
    const width = active.w * WORLD_SCALE, depth = active.h * WORLD_SCALE;
    const north = -depth / 2 + .64;
    // Warm hanging strips, cable brackets and shelves above the original pots.
    for (const x of id === "capsule" ? [-3.7, 1.1] : [-7.1, 5.8]) {
      box(root, .06, .72, .06, mat(palette.dark, "metal"), x, 3.42, north + 1.1);
      box(root, 3.45, .18, .55, mat(palette.dark, "metal"), x, 3.06, north + 1.1);
      box(root, 3.1, .035, .43, mat(0xd3d5ae, undefined, 0xb8bd8f), x, 2.94, north + 1.1);
      const light = new THREE.SpotLight(0xc6cba2, 34, 14, .76, .75, 1.5); light.position.set(x, 2.9, north + 1.2);
      light.target.position.set(x, 0, north + 1.2); root.add(light, light.target);
    }
    // Visible industrial pipework replaces the old featureless indoor blocks.
    const pipe = mesh(new THREE.CylinderGeometry(.08, .08, width - 1.6, 10), mat(0x625b45, "metal"), root, 0, 2.56, north - .35);
    pipe.rotation.z = Math.PI / 2;
    for (let x = -width / 2 + 1.4; x < width / 2 - 1; x += 3.2) box(root, .16, .35, .23, mat(palette.dark, "metal"), x, 2.61, north - .37);
    const shelf = new THREE.Group(); root.add(shelf);
    shelf.position.set(id === "capsule" ? 7.1 : -10.4, 0, north + .38);
    for (const y of [1.15, 2.1]) {
      box(shelf, 2.4, .12, .58, mat(palette.wood, "wood"), 0, y);
      for (let i = 0; i < 5; i++) cylinder(shelf, .12, .12, .27 + i % 2 * .13, mat(i % 2 ? 0x53745c : 0x9b835b), -.94 + i * .45, y + .22);
    }
    if (id === "capsule") {
      const rug = region({ x: 94, y: 108, w: 112, h: 25 }, .025, mat(0x635740, "plaster"), .022);
      rug.name = "woven-entry-rug";
      const desk = new THREE.Group(); desk.position.copy(at(288, 146)); root.add(desk);
      box(desk, 1.8, .07, 1.2, mat(palette.wood, "wood"), 0, .72);
      for (const x of [-1, 1]) box(desk, .09, .68, 1.08, mat(palette.dark, "metal"), x * .79, .35);
      const kettle = objectGroup({ id: "home-kettle", kind: "prop", x: 274, y: 46, w: 1, h: 1, label: "" });
      cylinder(kettle, .18, .24, .3, mat(palette.brass, "metal"), 0, 1.45);
      lamp(root, -8.1, 2.4, -2.8, 0xefab63, 14);
      lamp(root, 8.2, 2.4, 2.7, 0x74a3a2, 8);
    } else {
      const lounge = new THREE.Group(); lounge.position.copy(at(232, 87)); root.add(lounge);
      occluder(box(lounge, 248 * WORLD_SCALE, .42, 78 * WORLD_SCALE, mat(0x4d4a3e, "wood")));
      box(lounge, 12.9, .43, 2.6, mat(0x666655, "plaster"), 0, .72, -.7);
      box(lounge, 12.9, 1.08, .4, mat(0x586451, "plaster"), 0, 1.23, -1.87);
      for (let i = 0; i < 7; i++) box(lounge, 1.65, .25, 2.48, mat(i % 2 ? 0x72745c : 0x76705a, "plaster"), -5.4 + i * 1.78, .91, -.6);
      for (const x of [-6.7, 6.7]) box(lounge, .43, .75, 2.95, mat(0x53604e, "plaster"), x, 1, -.8);
      const left = new THREE.Group(); left.position.copy(at(53, 80)); root.add(left);
      const right = new THREE.Group(); right.position.copy(at(427, 70)); root.add(right);
      for (const s of [left, right]) {
        const w = 70 * WORLD_SCALE, d = (s === left ? 108 : 88) * WORLD_SCALE;
        occluder(box(s, w, 2.45, d, mat(0x32392f, "metal")));
        for (let i = 0; i < 3; i++) terminalSpeaker(s, -1.08 + i * 1.08, d / 2);
        box(s, w + .1, .13, d + .05, mat(palette.brass, "metal"), 0, 2.46);
        for (let i = 0; i < 7; i++) box(s, .045, .7, .03, mat(0xb59759), -1.3 + i * .44, 1.8, d / 2 + .015);
      }
      for (const x of [61, 419]) {
        const g = new THREE.Group(); g.position.copy(at(x, 227)); root.add(g);
        occluder(box(g, 86 * WORLD_SCALE, .58, 58 * WORLD_SCALE, mat(0x525d50, "plaster")));
        box(g, 4.55, .85, .32, mat(0x485449, "plaster"), 0, 1, -1.42);
        for (let i = 0; i < 3; i++) box(g, 1.4, .19, 3.07, mat(0x707561), -1.5 + i * 1.5, .68);
      }
      const carpet = region({ x: 122, y: 184, w: 225, h: 58 }, .035, mat(0x67553e, "plaster"), .025);
      carpet.name = "keller-vintage-carpet";
      const name = new THREE.Group(); name.position.copy(at(240, 27)); root.add(name); tag(name, "RAJKOS KELLER", 5.2, 2.82);
      lamp(root, 0, 2.8, -6.7, 0xffb968, 23);
      lamp(root, -8.5, 2.8, 6.1, 0xeb9d61, 18);
      lamp(root, 8.5, 2.8, 6.1, 0xb8bf9b, 10);
    }
  }

  function buildWalls() {
    for (let i = 0; i < active.walls.length; i++) {
      const r = active.walls[i];
      const edge = r.x <= 0 || r.y <= 0 || r.x + r.w >= active.w || r.y + r.h >= active.h;
      if (id === "studio" && !edge) continue; // Lounge and speaker banks furnish original blocked rectangles.
      const obstacle = active.obstacles?.find(o => o.x === r.x && o.y === r.y && o.w === r.w && o.h === r.h);
      if (obstacle) { renderObstacle(obstacle); continue; }
      const building = active.buildings?.find(b => b.x === r.x && b.y === r.y && b.w === r.w && b.h === r.h);
      const outside = !active.indoor && !edge && r.w >= 56 && r.h >= 56;
      const height = edge ? (r.y > active.h / 2 || r.x > active.w / 2 ? .72 : 2.85) : outside ? 3.7 + seeded(i + 17) * 4.8 : 2.25;
      const m = region(r, height, mat(outside ? new THREE.Color(building?.tone ?? "#546269").lerp(new THREE.Color(0x3a4a53), .72) : palette.plaster, "plaster"));
      m.name = `original-wall:${i}`; occluder(m);
      // Dark plinth and narrow cap keep the rooms readable as a cutaway diorama.
      region(r, .16, mat(palette.stone, "stone"), .08);
      region(r, .1, mat(outside ? 0x626c6b : 0x7d8681, "stone"), height + .02);
      if (outside && r.w > 100 && r.h > 80) {
        buildingDetails(r, height, i, building?.name);
      }
    }
  }

  function buildingDetails(r: Rect, height: number, seed: number, name?: string) {
    const group = new THREE.Group(); group.name = "rain-worn-facade";
    group.position.copy(at(r.x + r.w / 2, r.y + r.h / 2)); root.add(group);
    const w = r.w * WORLD_SCALE, d = r.h * WORLD_SCALE;
    // Merge all repeated trim by material: dense façades cost a handful of draws.
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    function detail(material: THREE.Material, width: number, h: number, depth: number, x: number, y: number, z: number) {
      const geometry = new THREE.BoxGeometry(width, h, depth); geometry.translate(x, y, z);
      const batch = batches.get(material) ?? []; batch.push(geometry); batches.set(material, batch);
    }
    const frame = mat(0x1f2a30, "metal"), stone = mat(0x66706d, "stone"), metal = mat(0x4b5c60, "metal");
    const unlit = mat(0x14252c, "metal"), warm = mat(0x514432, undefined, 0x9b7044), cool = mat(0x273e43, undefined, 0x3a6268);
    const cols = Math.min(12, Math.max(2, Math.floor(w / 2.1))), rows = Math.max(1, Math.floor((height - .5) / 1.65));
    for (let side = 0; side < 3; side++) {
      const length = side ? d : w, count = side ? Math.min(8, Math.max(1, Math.floor(d / 2.2))) : cols;
      for (let row = 0; row < rows; row++) for (let col = 0; col < count; col++) {
        const u = -length / 2 + (col + .5) * length / count, y = 1.2 + row * 1.65;
        const light = seeded(seed * 101 + row * 27 + col * 7 + side * 19);
        const pane = light > .81 ? warm : light < .055 ? cool : unlit;
        const x = side === 1 ? -w / 2 - .04 : side === 2 ? w / 2 + .04 : u;
        const z = side ? u : d / 2 + .04;
        detail(frame, side ? .1 : .96, 1.11, side ? .96 : .1, x, y, z);
        detail(pane, side ? .11 : .74, .88, side ? .74 : .11, x + (side === 1 ? -.025 : side === 2 ? .025 : 0), y, z + (side ? 0 : .025));
        detail(stone, side ? .26 : 1.05, .09, side ? 1.05 : .26, x, y - .55, z);
        detail(frame, side ? .14 : .04, .94, side ? .04 : .14, x, y, z + (side ? 0 : .07));
        if (light > .5) detail(frame, side ? .14 : .8, .04, side ? .8 : .14, x, y + .08, z + (side ? 0 : .07));
      }
    }
    // Rain-darkened corner columns, roof parapet blocks, drainage and service ducts.
    for (const x of [-w / 2 + .13, w / 2 - .13]) {
      detail(stone, .25, height, d + .12, x, height / 2, 0);
      detail(metal, .09, height - .3, .09, x + (x < 0 ? .34 : -.34), height / 2, d / 2 + .17);
      for (let y = .6; y < height; y += 1.6) detail(frame, .2, .055, .15, x + (x < 0 ? .34 : -.34), y, d / 2 + .15);
    }
    detail(stone, w + .26, .26, .46, 0, height + .22, d / 2);
    detail(stone, w + .26, .26, .46, 0, height + .22, -d / 2);
    for (const x of [-w / 2, w / 2]) detail(stone, .46, .26, d + .25, x, height + .22, 0);
    const blocks = Math.min(18, Math.ceil(w / 1.3));
    for (let i = 0; i < blocks; i++) detail(stone, w / blocks - .06, .16, .53, -w / 2 + (i + .5) * w / blocks, height + .42, d / 2);
    if (w < 23 && d < 23) {
      detail(metal, w * .36, .7, d * .28, -w * .17, height + .65, 0);
      for (let i = 0; i < 5; i++) detail(frame, w * .32, .035, .04, -w * .17, height + .42 + i * .1, d * .145);
      for (let i = 0; i < 3; i++) detail(metal, .1, .25, d * .34, w * .15 + i * .23, height + .25, 0);
    }
    for (const [material, geometries] of batches) {
      const geometry = mergeGeometries(geometries, false);
      for (const part of geometries) part.dispose();
      if (geometry) occluder(mesh(geometry, material, group, 0, 0, 0));
    }
    if (name) { const n = tag(group, name.toUpperCase(), Math.min(4, w * .8), 2.9, "#c6b48f", d / 2 + .2); n.name = "house-name"; }
  }
  function renderObstacle(rect: Rect & { kind: string }) {
    const p = at(rect.x + rect.w / 2, rect.y + rect.h / 2);
    const g = new THREE.Group(); g.position.copy(p); root.add(g);
    const w = rect.w * WORLD_SCALE, d = rect.h * WORLD_SCALE;
    if (rect.kind === "rack") {
      const h = rect.h >= 70 ? 2.9 : .8;
      const body = box(g, w, h, d, mat(0x364a45, "metal")); occluder(body);
      for (let y = .4; y < h; y += .38) {
        box(g, w * .84, .23, .07, mat(0x1b2926, "metal"), 0, y, d / 2 + .03);
        box(g, .06, .06, .03, mat(0x92bfa3, undefined, 0x62b999), w * .25, y, d / 2 + .08);
        box(g, .14, .04, .03, mat(0xba9d65, undefined, 0x9a7534), -w * .19, y, d / 2 + .08);
      }
    } else if (rect.kind === "pipe" || rect.kind === "valve") {
      const pipe = mesh(new THREE.CylinderGeometry(Math.min(w, d) * .48, Math.min(w, d) * .48, Math.max(w, d), 12), mat(0x68756a, "metal"), g, 0, .7, 0);
      pipe.rotation.z = w > d ? Math.PI / 2 : 0; if (d > w) pipe.rotation.x = Math.PI / 2;
      occluder(pipe);
    } else if (rect.kind === "fence") {
      for (let x = -w / 2; x <= w / 2 + .02; x += Math.max(.45, w / 24)) box(g, .035, 1.6, .04, mat(palette.dark, "metal"), x, .8);
      for (const y of [.35, 1.3]) box(g, w, .045, .07, mat(palette.brass, "metal"), 0, y);
    } else if (rect.kind === "ember") {
      box(g, w, .12, d, mat(0x563623, undefined, 0x853c21));
      for (let i = 0; i < Math.min(20, w * d); i++) box(g, .19, .06, .19, mat(0x99704b, undefined, 0xaf5629), (seeded(i) - .5) * w, .14, (seeded(i + 200) - .5) * d);
    } else {
      const h = rect.kind === "median" ? .32 : rect.kind === "toilet" ? .78 : .75;
      const m = box(g, w, h, d, mat(rect.kind === "toilet" ? 0x938d75 : palette.stone, "stone")); occluder(m);
      if (id === "scrap") for (let i = 0; i < 5; i++) {
        const junk = box(g, w * .38, .3 + seeded(i) * .7, d * .4, mat(i % 2 ? 0x756447 : 0x526057, "metal"), (seeded(i + 60) - .5) * w * .5, h + .22, (seeded(i + 90) - .5) * d * .5); junk.rotation.y = seeded(i) * .6;
      }
    }
  }

  function buildFloor() {
    const w = active.w * WORLD_SCALE, d = active.h * WORLD_SCALE;
    box(root, w + .25, .45, d + .25, mat(palette.dark, "stone"), 0, -.27);
    const indoor = getDistrictGraphics(id).wetness < .15;
    const floor = mesh(new THREE.PlaneGeometry(w, d), mat(id === "capsule" ? 0x8a7760 : indoor ? 0x697378 : id === "yard" ? 0x4b594e : 0x65727b, id === "capsule" ? "wood" : indoor ? "stone" : "asphalt"), root, 0, .002, 0);
    floor.rotation.x = -Math.PI / 2;
    const sketch = mapSketch(id);
    if (!active.indoor) for (const r of sketch.walk) {
      const m = region(r, .045, mat(id === "yard" ? 0x637263 : 0x788487, "stone"), .007);
      m.name = "original-walkway";
    }
    for (const { r, fill } of sketch.extras) {
      const water = id === "drain" || id === "kai";
      const color = new THREE.Color(fill);
      const m = region(r, .025, mat(color.lerp(new THREE.Color(water ? 0x1c3945 : 0x3c5146), .7), water ? "metal" : "stone"), .025);
      if (water) { const material = m.material as THREE.MeshPhysicalMaterial; material.roughness = .15; material.clearcoat = .9; }
      if (id === "alley" || id === "yard") {
        const amount = Math.min(55, Math.round(r.w * r.h / 1000));
        for (let i = 0; i < amount; i++) {
          const p = at(r.x + seeded(i + r.x) * r.w, r.y + seeded(i + r.y + 8) * r.h);
          const leaf = mesh(new THREE.ConeGeometry(.1, .26 + seeded(i) * .22, 5), mat(0x586c3d), root, p.x, .17, p.z, false);
          leaf.rotation.z = (seeded(i + 22) - .5) * .4;
        }
      }
    }
    // Irregular clearcoat patches preserve the masonry below and reflect the HDR lamps.
    if (getDistrictGraphics(id).wetness > .25) for (let i = 0; i < 32; i++) {
      const r = sketch.walk[i % Math.max(1, sketch.walk.length)]; if (!r) continue;
      const p = at(r.x + seeded(i + 712) * r.w, r.y + seeded(i + 309) * r.h);
      const size = .9 + seeded(i) * 2.5;
      const puddle = mesh(new THREE.PlaneGeometry(size, size), puddleMaterial, root, p.x, .058, p.z, false);
      puddle.rotation.x = -Math.PI / 2; puddle.rotation.z = seeded(i + 69) * Math.PI; puddle.scale.y = .35 + seeded(i + 69) * .5;
      puddle.name = "rain-puddle";
    }
    if (!active.indoor) for (let i = 0; i < Math.min(6, sketch.walk.length); i++) {
      const r = sketch.walk[i];
      const p = at(r.x + r.w * .82, r.y + r.h * .68);
      const pieces: THREE.BufferGeometry[] = [];
      for (let bar = 0; bar < 7; bar++) {
        const geometry = new THREE.BoxGeometry(.055, .035, .49); geometry.translate(p.x - .26 + bar * .087, .063, p.z); pieces.push(geometry);
      }
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (geometry) { const grate = mesh(geometry, mat(0x28363e, "metal"), root, 0, 0, 0, false); grate.name = "storm-drain-detail"; }
    }
  }
  function mapDetails() {
    if (id === "capsule" || id === "studio") { homeDetails(); return; }
    if (id === "kino") {
      const screen = new THREE.Group(); screen.position.copy(at(360, 58)); root.add(screen);
      box(screen, 33, 3.9, .3, mat(0x182a27), 0, 2.1);
      box(screen, 31.5, 3.3, .05, mat(0x55796e, undefined, 0x21483b), 0, 2.1, .19);
      tag(screen, "420MON · KIEZKINO", 13, 2.1, "#d0c499", .23);
    } else if (id === "ring") {
      const rect = mapSketch(id).extras[0]?.r; if (rect) {
        const p = at(rect.x + rect.w / 2, rect.y + rect.h / 2);
        const g = new THREE.Group(); g.position.copy(p); root.add(g);
        const w = rect.w * WORLD_SCALE, d = rect.h * WORLD_SCALE;
        for (const x of [-1, 1]) for (const z of [-1, 1]) box(g, .1, 2.5, .1, mat(palette.dark, "metal"), x * w / 2, 1.25, z * d / 2);
        for (const h of [.7, 1.25, 1.8]) for (const z of [-1, 1]) box(g, w, .035, .035, mat(0x997953), 0, h, z * d / 2);
      }
    } else if (id.startsWith("den_")) {
      const couch = new THREE.Group(); couch.position.copy(at(200, 52)); root.add(couch);
      box(couch, 8.8, .6, 2.8, mat(0x666757, "plaster"));
      box(couch, 8.8, .8, .4, mat(0x515a4b, "plaster"), 0, 1, -1.3);
      const table = new THREE.Group(); table.position.copy(at(230, 132)); root.add(table);
      box(table, 1.7, .1, 1.35, mat(palette.wood, "wood"), 0, .67);
      box(table, .12, .63, .12, mat(palette.dark), 0, .315);
      lamp(root, -5.2, 2.6, -4.5, 0xeeb473, 16);
    }
    const sign = new THREE.Group(); sign.position.copy(at(active.w / 2, 34)); root.add(sign);
    if (id !== "alley" && id !== "kino") tag(sign, active.name.toUpperCase(), Math.min(9, active.w * WORLD_SCALE * .55), 3.25);
  }

  function disposeOwnedObjects(parent: THREE.Object3D) {
    parent.traverse(object => {
      // Grow and encounter systems attach their own reusable meshes to root.
      // They retain ownership of their geometry and materials across maps.
      if (object instanceof THREE.Mesh && object.userData.worldOwned) {
        object.geometry.dispose();
        const list = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of list) if (material.userData.local) {
          const mapped = material as THREE.MeshBasicMaterial;
          if (!material.userData.sharedTexture) mapped.map?.dispose();
          material.dispose();
        }
      }
      if (object instanceof THREE.Light) object.dispose();
    });
  }
  function disposeMap() {
    disposeOwnedObjects(root);
    root.clear(); mapObjects.clear(); roamingNpc = undefined; storyNpcs.clear(); occluders = []; lampLights.length = 0; lastLightSelection = -Infinity; glowing.length = 0;
  }
  function removeMapObject(objectId: string) {
    const group = mapObjects.get(objectId);
    if (group) {
      // Remove only this map-owned group. Rebuilding root would also detach
      // the encounter, Grow and aquarium systems' independently owned meshes.
      const removed = new Set<THREE.Object3D>();
      group.traverse(object => removed.add(object));
      occluders = occluders.filter(object => !removed.has(object));
      for (let i = glowing.length - 1; i >= 0; i--) if (removed.has(glowing[i].mesh)) glowing.splice(i, 1);
      disposeOwnedObjects(group); group.removeFromParent(); mapObjects.delete(objectId);
    }
    if (nearby?.id === objectId) { nearby = undefined; prompt.hidden = true; }
    if (interactionMessage?.id === objectId) interactionMessage = undefined;
  }
  function setRoamingNpc(obj?: MapObj) {
    if (roamingNpc && roamingNpc.id !== obj?.id) removeMapObject(roamingNpc.id);
    roamingNpc = obj;
    if (!obj) return;
    const group = mapObjects.get(obj.id);
    if (!group) renderObject(obj);
    else {
      group.userData.object = obj;
      group.position.copy(at(obj.x + obj.w / 2, obj.y + obj.h / 2));
    }
  }
  function setStoryNpcs(objects: MapObj[]) {
    const present = new Set(objects.map(object => object.id));
    for (const objectId of storyNpcs.keys()) if (!present.has(objectId)) { removeMapObject(objectId); storyNpcs.delete(objectId); }
    for (const obj of objects) {
      storyNpcs.set(obj.id, obj);
      const group = mapObjects.get(obj.id);
      if (!group) renderObject(obj);
      else { group.userData.object = obj; group.position.copy(at(obj.x + obj.w / 2, obj.y + obj.h / 2)); }
    }
    // The original Gasse Felix leaves after hiring; his capsule body is separate.
    if (getSave().felixHired && id === "alley") removeMapObject("felix");
  }
  function syncDefeatedGates() {
    const defeatedIds = getSave().deadWild;
    for (const obj of active.objs) {
      if (!isDefeatedGate(obj, defeatedIds)) continue;
      removeMapObject(obj.id);
    }
  }
  function unlocked(lock: string) {
    const save = getSave();
    const completed: unknown = save.quests;
    return Array.isArray(completed) ? completed.includes(lock)
      : completed !== null && typeof completed === "object" && (completed as Record<string, unknown>)[lock] === "done";
  }
  function lockMessage(obj: MapObj) {
    // The original underground routes and Kapsel fishing pad bypass gates.
    if (obj.kind === "manhole" || obj.id.startsWith("pad_")) return;
    if (obj.lock && !unlocked(obj.lock)) return "🔒 Bolt zuerst helfen · Auftrag im Menü";
    if (!obj.door) return;
    const save = getSave();
    const trainer = typeof save.trainerLv === "number" && Number.isFinite(save.trainerLv) ? save.trainerLv : 1;
    const level = Math.max(1, trainer, ...save.team.map(mon => mon.level));
    const stage = stageOf(obj.door);
    if (level < stage.minLv) return `🔒 ${obj.label} ab Lv. ${stage.minLv} · Dein Team: Lv. ${level}`;
  }
  function sourcePosition() { return worldToMap(active, player.position.x, player.position.z); }
  function saveLocation() {
    const p = sourcePosition();
    if (Math.abs(p.x - lastPosition.x) < .5 && Math.abs(p.y - lastPosition.y) < .5) return;
    lastPosition = p; saveProgress({ map: id, x: p.x, y: p.y });
  }
  function travel(next: string, x?: number, y?: number) {
    if (!MAPS[next]) return;
    const previous = id;
    saveLocation(); id = next; active = MAPS[id];
    const progress = getSave();
    if (previous === "capsule" && next !== "capsule") {
      const ach = progress.ach && typeof progress.ach === "object" ? progress.ach as Record<string, string> : {};
      ach.first_step = "done";
      if (progress.outfit === "nude") { progress.leftCapsuleNude = true; ach.nude_start = "done"; setQuestState(progress, "q6_nude", "done"); }
      progress.ach = ach;
    }
    progress.map = next; recordVisit(progress, next);
    disposeMap(); surfaces.setWetness(getDistrictGraphics(id).wetness);
    buildFloor(); buildWalls(); active.objs.forEach(renderObject); mapDetails();
    const desired = x !== undefined && y !== undefined ? { x, y }
      : id === "capsule" ? { x: CAPSULE_SPAWN_X, y: CAPSULE_SPAWN_Y }
      : id === "studio" ? { x: 440, y: 140 }
      : id === "alley" ? { x: 80, y: 740 }
      : (() => {
        const exit = active.objs.find(o => o.kind === "door" || o.kind === "manhole");
        return exit ? { x: exit.x + exit.w / 2, y: exit.y + exit.h / 2 } : { x: active.w / 2, y: active.h / 2 };
      })();
    const spawn = safeSpawn(active, desired.x, desired.y, .48, progress.deadWild);
    player.position.copy(at(spawn.x, spawn.y)); player.rotation.y = 0;
    lastPosition = { x: NaN, y: NaN }; saveLocation();
    localStorage.setItem("420mon-current-map", id); localStorage.setItem("420mon-district", id);
    nearby = undefined; interactionMessage = undefined; prompt.hidden = true;
    window.dispatchEvent(new CustomEvent("420mon-district-change", { detail: id }));
    window.dispatchEvent(new CustomEvent("420mon-map-change", { detail: { id, map: active, scale: WORLD_SCALE } }));
  }

  const prompt = document.createElement("button"); prompt.className = "npc-shop-prompt world-interaction";
  prompt.hidden = true; prompt.type = "button"; prompt.setAttribute("aria-label", "Objekt in der Nähe benutzen");
  document.querySelector("#app")!.append(prompt);
  function overlayOpen() {
    return document.body.classList.contains("menu-open") || !!document.querySelector(
      ".systems-panel:not([hidden]), .grow-backdrop:not([hidden]), .monster-battle:not([hidden]), .home-dialog:not([hidden]), .fish-overlay:not([hidden]),.achievement-overlay:not([hidden]),.monster-model-overlay:not([hidden]), .story-overlay:not([hidden]), .radio-overlay:not([hidden]), .support-overlay:not([hidden]), .studio-panel.is-open"
    );
  }
  function closestInteraction() {
    const p = sourcePosition();
    let best: MapObj | undefined, closest = 1.9;
    const defeatedIds = getSave().deadWild;
    for (const object of active.objs) {
      if (object.kind === "wild" || object.kind === "sign" || isDefeatedGate(object, defeatedIds)) continue;
      if (object.id === "felix" && getSave().felixHired) continue;
      const d = distance(object, p);
      if (d < closest) { closest = d; best = object; }
    }
    for (const object of [...storyNpcs.values(), ...(roamingNpc ? [roamingNpc] : [])]) {
      const d = distance(object, p);
      if (d < closest) { closest = d; best = object; }
    }
    return best;
  }
  function interact() {
    if (overlayOpen()) return false;
    nearby = closestInteraction();
    if (!nearby) return false;
    const obj = nearby;
    const reason = lockMessage(obj);
    if (reason) {
      interactionMessage = { id: obj.id, text: reason, until: performance.now() + 2600 };
      prompt.textContent = reason; return true;
    }
    if (obj.door) { travel(obj.door, obj.dx, obj.dy); return true; }
    if (obj.kind === "shop" || obj.kind === "stall") {
      if (interaction?.(obj, id) !== true) shopFn?.(obj);
    } else interaction?.(obj, id);
    window.dispatchEvent(new CustomEvent("420mon-world-interaction", { detail: { obj, mapId: id } }));
    return true;
  }
  prompt.onclick = interact;
  window.addEventListener("keydown", event => {
    const target = event.target as HTMLElement | null;
    if (event.defaultPrevented || event.key.toLowerCase() !== "e" || event.repeat || target?.closest("input,textarea,select,[contenteditable=true]")) return;
    // The encounter listener runs afterwards and honors this consumed action.
    if (interact()) event.preventDefault();
  });
  function distance(obj: MapObj, p = sourcePosition()) {
    const dx = Math.max(obj.x - p.x, 0, p.x - obj.x - obj.w);
    const dy = Math.max(obj.y - p.y, 0, p.y - obj.y - obj.h);
    return Math.hypot(dx, dy) * WORLD_SCALE;
  }
  function trainerAction(obj: MapObj): string | undefined {
    if (obj.id === "nim_body") return "DUELL";
    if (obj.kind !== "npc" || !obj.mon) return;
    const save = getSave();
    if (DAILY_TRAINERS.has(obj.id)) {
      const date = new Date();
      const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const days = save.bossDay;
      if (days && typeof days === "object" && !Array.isArray(days) && (days as Record<string, unknown>)[obj.id] === today) return "HEUTE BESIEGT";
    } else if (save.deadWild.includes(obj.id)) return "BESIEGT";
    return "HERAUSFORDERN";
  }
  function update() {
    const time = performance.now();
    if (time - lastLightSelection > 350) {
      lastLightSelection = time;
      const closest = lampLights.map(light => ({ light, distance: light.getWorldPosition(lightPosition).distanceToSquared(player.position) }));
      closest.sort((a, b) => a.distance - b.distance);
      const count = active.indoor ? 5 : 4;
      for (let i = 0; i < closest.length; i++) closest[i].light.visible = i < count && closest[i].distance < 24 * 24;
    }
    if (time - lastSave > 1800) { saveLocation(); lastSave = time; }
    nearby = closestInteraction();
    const overlay = overlayOpen();
    prompt.hidden = !nearby || overlay;
    if (nearby) {
      const action = trainerAction(nearby) ?? (nearby.id.startsWith("kai_cast") ? "ANGELN" : nearby.id === "tank" ? "BECKEN" : nearby.door ? "BETRETEN" : nearby.kind === "pot" ? "PFLEGEN" : nearby.kind === "bed" || nearby.kind === "mattress" ? "AUSRUHEN" : nearby.kind === "npc" || nearby.kind === "shop" || nearby.kind === "stall" ? "ANSPRECHEN" : "BENUTZEN");
      const reason = lockMessage(nearby);
      prompt.textContent = interactionMessage?.id === nearby.id && time < interactionMessage.until ? interactionMessage.text
        : `${reason ? "🔒 " : ""}${nearby.label.toUpperCase()} · ${action} [E]`;
      prompt.dataset.object = nearby.id;
    }
    for (const glow of glowing) (glow.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = .55 + Math.sin(time / 1800 + glow.phase) * .08;
  }
  window.addEventListener("420mon-save-changed", syncDefeatedGates);
  const saved = getSave();
  const requested = saved.map ?? localStorage.getItem("420mon-current-map") ?? localStorage.getItem("420mon-district") ?? "capsule";
  // Initial load must read location before travel writes the active map.
  id = MAPS[requested] ? requested : "capsule"; active = MAPS[id];
  lastPosition = sourcePosition(); // Avoid saving an uninitialised player over the loaded coordinates.
  travel(id, MAPS[requested] ? saved.x : undefined, MAPS[requested] ? saved.y : undefined);
  window.addEventListener("pagehide", saveLocation);
  return {
    travel, current: () => id,
    shopNearby: () => active.objs.some(o => (o.kind === "shop" || o.kind === "stall") && distance(o) < 1.9),
    shopAt: obj => {
      if (!shopFn || !(obj.kind === "shop" || obj.kind === "stall") || !active.objs.some(item => item.id === obj.id) || distance(obj) >= 1.9) return false;
      shopFn(obj); return true;
    },
    openShop: fn => { shopFn = fn; }, update,
    collides: (x, z, radius = .48) => collidesOnMap(active, x, z, radius, getSave().deadWild),
    getOccluders: () => occluders,
    getMapInfo: () => ({ id, name: active.name, map: active, w: active.w, h: active.h, scale: WORLD_SCALE,
      bounds: { minX: -active.w * WORLD_SCALE / 2, maxX: active.w * WORLD_SCALE / 2, minZ: -active.h * WORLD_SCALE / 2, maxZ: active.h * WORLD_SCALE / 2 }, player: sourcePosition() }),
    getRoot: () => root, toWorld: at,
    setInteractionHandler: fn => { interaction = fn; },
    setRoamingNpc, setStoryNpcs,
  };
}
