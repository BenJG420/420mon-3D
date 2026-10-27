import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { MAPS, mapSketch, ASH_HOT, DRAIN_WATER, CHEM_VATS, CHEM_FILL, RING_CHALK, LAB_SHADE, NISCHE_PINK, SCRAP_BELT, SCRAP_PILES, SCRAP_RUST, CAPSULE_SPAWN_X, CAPSULE_SPAWN_Y, type MapDef, type MapObj, type Rect } from "./data/maps";
import { WORLD_SCALE, mapToWorld, worldToMap, collidesOnMap, safeSpawn, isDefeatedGate } from "./worldGeometry";
import { getSave, saveProgress } from "./save";
import { recordVisit, setQuestState } from "./quests";
import { stageOf } from "./data/progress";
import { createWorldSurfaces, projectSurfaceUvs } from "./world-surfaces";
import { createNpcHuman } from "./npc-humanoids";
import { getDistrictGraphics } from "./graphics-profile";
import { isTakenStarter } from "./starter-state";
import { createStaticBatches, type StaticDecoration, type StaticBatchStats } from "./static-batches";
import { alleyRoofKind, appendAlleyBuildingDetails, appendAlleyBinDetails, alleyRunoffPuddles, type AlleyFinish } from "./alley-details";
import { appendYardShedDetails, appendYardBoundaryDetails, appendMossInteriorDetails, type YardFinish, type YardDetailEmitter } from "./yard-details";
import { createStreetDetails, isDetailedDistrict } from "./street-details";
import { createWallArt } from "./wall-art";
import { lampFlicker } from "./lamp-flicker";
import { appendCableRackDetails, appendCableWallDetails, appendCableLiveDetails, appendCableTerminalDetails, type CableFinish, type CableDetailEmitter } from "./cable-details";
import { appendKaiWall, appendKaiQuay, appendKaiDevice, appendKaiWater, type KaiFinish, type KaiEmitter } from "./kai-details";
import { createKaiLitter } from "./kai-litter";
import { appendSewerWallDetails, appendSewerHatchDetails, appendSewerDrainDetails, type SewerFinish, type SewerDetailEmitter } from "./sewer-details";
import { appendMarketFacadeDetails, appendMarketBoundaryDetails, appendMarketStallDetails, appendMarketInteriorDetails, type MarketFinish, type MarketDetailEmitter } from "./market-details";

import { appendKinoWallDetails, appendKinoStageDetails, appendKinoScreenDetails, appendKinoDeviceDetails, type KinoFinish, type KinoDetailEmitter } from "./kino-details";
import { createKinoLitter } from "./kino-litter";
import { appendAshFacadeDetails, appendAshBoundaryDetails, appendAshEmberDetails, appendAshPropDetails, type AshFinish, type AshDetailEmitter } from "./ash-details";
import { appendDrainFacadeDetails, appendDrainBoundaryDetails, appendDrainWaterDetails, appendDrainObstacleDetails, appendDrainPropDetails, type DrainFinish, type DrainDetailEmitter } from "./drain-details";
import { appendChemFacadeDetails, appendChemBoundaryDetails, appendChemVatDetails, appendChemBlockDetails, appendChemPropDetails, appendChemVatMarkings, type ChemFinish, type ChemDetailEmitter } from "./chem-details";
import { appendRingFacadeDetails, appendRingBoundaryDetails, appendRingFenceDetails, appendRingBlockDetails, appendRingCrateDetails, appendRingFloorDetails, type RingFinish, type RingDetailEmitter } from "./ring-details";
import { appendLabyrinthWallDetails, appendLabyrinthFenceDetails, appendLabyrinthCrateDetails, appendLabyrinthShadeDetails, type LabyrinthFinish, type LabyrinthDetailEmitter } from "./labyrinth-details";
import { appendNischeWallDetails, appendNischePartitionDetails, appendNischeCrateDetails, appendNischeFloorDetails, type NischeFinish, type NischeDetailEmitter } from "./nische-details";
import { appendScrapWallDetails, appendScrapBeltDetails, appendScrapPileDetails, appendScrapGateDetails, appendScrapFenceDetails, appendScrapPropDetails, appendScrapRustDetails, type ScrapFinish, type ScrapDetailEmitter } from "./scrap-details";

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
  setPerformanceMode: (enabled: boolean) => void;
  getPerformanceStats: () => StaticBatchStats;
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
const sameRect = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

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
  const npcActors = new Map<string, ReturnType<typeof createNpcHuman>>();
  let lastActorTime = performance.now();
  let roamingNpc: MapObj | undefined;
  const storyNpcs = new Map<string, MapObj>();
  let performanceMode = true;
  let staticBatches: ReturnType<typeof createStaticBatches> | undefined;
  let streetDetails: ReturnType<typeof createStreetDetails> | undefined;
  let kinoLitter: ReturnType<typeof createKinoLitter> | undefined;
  let kaiLitter: ReturnType<typeof createKaiLitter> | undefined;
  const sewerDetailGroups: THREE.Group[] = [];
  const sewerDetailPosition = new THREE.Vector3();
  let wallArt: ReturnType<typeof createWallArt> | undefined;
  const animatedLamps: { light: THREE.PointLight; emitter: THREE.MeshPhysicalMaterial; seed: number; intensity: number; emissive: number; pool?: THREE.MeshBasicMaterial }[] = [];

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
  function lamp(parent: THREE.Object3D, x: number, y: number, z: number, color = 0xf5bc71, strength = 12, flickerSeed?: number) {
    box(parent, .42, .13, .33, mat(palette.dark, "metal"), x, y, z);
    const emitter = box(parent, .33, .035, .22, mat(color, undefined, color), x, y - .08, z);
    const light = new THREE.PointLight(color, strength * (active.indoor ? 1 : 1.6), 12, 2);
    light.position.set(x, y - .2, z); light.visible = false; parent.add(light); lampLights.push(light);
    let poolMaterial: THREE.MeshBasicMaterial | undefined;
    if (!active.indoor) {
      // Soft pools and broken wet streaks sit directly below the actual fixture.
      const pool = new THREE.MeshBasicMaterial({ color, map: poolTexture, transparent: true, opacity: .19, depthWrite: false, blending: THREE.AdditiveBlending });
      poolMaterial = pool;
      pool.userData.local = true; pool.userData.sharedTexture = true;
      const reflected = mesh(new THREE.PlaneGeometry(2.8, 3.8), pool, parent, x, .066, z, false);
      reflected.rotation.x = -Math.PI / 2;
      const shaft = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .018, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }); shaft.userData.local = true;
      const cone = mesh(new THREE.ConeGeometry(1.15, Math.max(.3, y - .25), 16, 1, true), shaft, parent, x, (y - .25) / 2 + .1, z, false);
      cone.name = "lamp-haze";
    }
    if (flickerSeed !== undefined) {
      // Only this fixture varies: do not animate the shared material of other lamps/actors.
      const material = (emitter.material as THREE.MeshPhysicalMaterial).clone();
      material.userData.local = true; material.userData.sharedTexture = true; emitter.material = material;
      emitter.name = "flickering-lamp-emitter"; light.name = "flickering-district-lamp";
      animatedLamps.push({ light, emitter: material, seed: flickerSeed, intensity: light.intensity, emissive: material.emissiveIntensity, pool: poolMaterial });
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
    const body = new THREE.Group(); body.name = "npc-load-fallback"; g.add(body);
    const seed = Array.from(obj.id).reduce((n, c) => n + c.charCodeAt(0), 0);
    const outfit = [0x596a59, 0x786047, 0x59536a, 0x597580, 0x8a6256][seed % 5];
    const skin = mat([0xc09d77, 0x8c6b4d, 0xcfb18f][seed % 3]);
    mesh(new THREE.CapsuleGeometry(.31, .56, 4, 8), mat(outfit, "plaster"), body, 0, 1.15, 0);
    mesh(new THREE.SphereGeometry(.24, 12, 10), skin, body, 0, 1.9, 0);
    mesh(new THREE.SphereGeometry(.255, 12, 8, 0, Math.PI * 2, 0, Math.PI * .5), mat(0x272725), body, 0, 1.98, -.025);
    for (const s of [-1, 1]) {
      box(body, .2, .68, .23, mat(0x2e3431), s * .17, .49);
      box(body, .25, .18, .38, mat(0x272820), s * .17, .09, .065);
      const arm = box(body, .17, .58, .2, mat(outfit), s * .43, 1.13); arm.rotation.z = s * .09;
      box(body, .15, .15, .17, skin, s * .46, .78);
    }
    npcActors.set(obj.id, createNpcHuman(obj, g, body));
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
      tag(g, obj.label, 2.2, 1.6);
      if (id === "sewer") {
        const detail = new THREE.Group(); detail.name = "sewer-hatch-detail"; g.add(detail);
        detail.userData.sourceObject = obj;
        sewerParts(detail, emit => appendSewerHatchDetails(w, d, emit), false, 1);
      }
      if (id === "drain") {
        const detail = drainDetailGroup("drain-hatch-detail", new THREE.Vector3(), emit => appendSewerHatchDetails(w, d, emit), g, false);
        detail.userData.sourceObject = obj;
      }
      if (id === "chem") {
        const detail = chemDetailGroup("chem-hatch-detail", new THREE.Vector3(), emit => appendSewerHatchDetails(w, d,
          (finish, geometry, feature) => emit(finish === "amber" ? "yellow" : finish === "cyan" ? "green" : finish === "moss" ? "dark" : finish, geometry, feature)), g, false);
        detail.userData.sourceObject = obj;
      }
      if (id === "ring") {
        const detail = ringDetailGroup("ring-hatch-detail", new THREE.Vector3(), emit => appendSewerHatchDetails(w, d,
          (finish, geometry, feature) => emit(finish === "amber" ? "cream" : finish === "cyan" ? "glow" : finish === "moss" ? "dark" : finish, geometry, feature)), g, false);
        detail.userData.sourceObject = obj;
      }
      if (id === "labyrinth") {
        const detail = labyrinthDetailGroup("labyrinth-hatch-detail", new THREE.Vector3(), emit => appendSewerHatchDetails(w, d,
          (finish, geometry, feature) => emit(finish === "amber" ? "paper" : finish === "cyan" ? "glow" : finish === "moss" ? "dark" : finish, geometry, feature)), g, false);
        detail.userData.sourceObject = obj;
      }
      if (id === "nische") {
        const detail = nischeDetailGroup("nische-hatch-detail", new THREE.Vector3(), emit => appendSewerHatchDetails(w, d,
          (finish, geometry, feature) => emit(finish === "amber" ? "paper" : finish === "cyan" ? "glow" : finish === "moss" ? "dark" : finish === "rust" ? "metal" : finish, geometry, feature)), g, false);
        detail.userData.sourceObject = obj;
      }
      if (id === "scrap") {
        const detail = scrapDetailGroup("scrap-hatch-detail", new THREE.Vector3(), emit => appendSewerHatchDetails(w, d,
          (finish, geometry, feature) => emit(finish === "amber" ? "yellow" : finish === "cyan" ? "glow" : finish === "moss" ? "dark" : finish, geometry, feature)), g, false);
        detail.userData.sourceObject = obj;
      }
      disc.userData.hatch = true; return;
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
    if ((id === "alley" || id === "yard" || id === "market") && obj.id.startsWith("house_")) {
      glow.material = mat(0x344b49, "wood", 0x1b2f29);
      projectSurfaceUvs(glow.geometry, glow.material);
      const parts: THREE.BufferGeometry[] = [];
      for (const [w, h, x, y] of [[length - .25, .22, 0, .28], [.055, .21, length * .29, 1.14], [.13, .11, -length * .33, .67], [.13, .11, -length * .33, 1.92]]) {
        const piece = new THREE.BoxGeometry(w, h, .045); piece.translate(x, y, .06); parts.push(piece);
      }
      const geometry = mergeGeometries(parts, false); for (const part of parts) part.dispose();
      if (geometry) { const hardware = mesh(geometry, mat(0x87795a, "metal"), frame, 0, 0, 0, false); hardware.name = `${id}-door-hardware`; }
    }
    tag(frame, obj.label, Math.max(1.65, length), 3.1);
    lamp(frame, 0, 2.82, .3, 0xffce84, 8, id === "kino" ? 640 : undefined);
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
      // Glass, planted habitat and 3D fish are owned by createFishingWorld.
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
      if (id === "cable") {
        const detail = new THREE.Group(); detail.name = "cable-terminal-detail"; g.add(detail);
        cableParts(detail, emit => appendCableTerminalDetails(w, d, emit), false);
      }
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
    if (id === "kino" && (obj.id.startsWith("kino_") || obj.id === "slot_kino")) {
      const detail = kinoDetailGroup("kino-device-detail", new THREE.Vector3(),
        emit => appendKinoDeviceDetails(w, d, obj.id === "slot_kino", emit), g);
      if (obj.id !== "slot_kino") {
        const label = tag(detail, obj.label, Math.min(w * .84, 1.9), 1.48, "#e0c6a1", .18);
        label.userData.occlusionGroup = detail.uuid; occluders.push(label);
      }
    }
    if (id === "kai" && (obj.id.startsWith("kai_cast") || obj.id === "slot_kai")) {
      const detail = new THREE.Group(); detail.name = "kai-device-detail"; g.add(detail);
      detail.userData.sourceObject = obj;
      kaiParts(detail, emit => appendKaiDevice(w, d, obj.id.startsWith("kai_cast"), emit), false);
    }
    if (id === "ash" && obj.kind === "prop") {
      const kind = obj.sprite?.includes("barrel") ? "barrel" : obj.sprite?.includes("terminal") ? "terminal" : "crate";
      const detail = ashDetailGroup("ash-prop-detail", new THREE.Vector3(), emit => appendAshPropDetails(w, d, kind, emit), g, false);
      detail.userData.sourceObject = obj;
    }
    if (id === "drain" && obj.kind === "prop") {
      const detail = drainDetailGroup("drain-prop-detail", new THREE.Vector3(),
        emit => appendDrainPropDetails(w, d, obj.sprite?.includes("barrel") ? "barrel" : "crate", emit), g, false);
      detail.userData.sourceObject = obj;
    }
    if (id === "chem" && obj.kind === "prop") {
      const detail = chemDetailGroup("chem-prop-detail", new THREE.Vector3(),
        emit => appendChemPropDetails(w, d, obj.sprite?.includes("barrel") ? "barrel" : "crate", emit), g, false);
      detail.userData.sourceObject = obj;
    }
    if (id === "ring" && obj.kind === "prop") {
      const detail = ringDetailGroup("ring-crate-detail", new THREE.Vector3(), emit => appendRingCrateDetails(w, d, emit), g, false);
      detail.userData.sourceObject = obj;
    }
    if (id === "labyrinth" && obj.kind === "prop") {
      const detail = labyrinthDetailGroup("labyrinth-crate-detail", new THREE.Vector3(), emit => appendLabyrinthCrateDetails(w, d, emit), g, false);
      detail.userData.sourceObject = obj;
    }
    if (id === "scrap" && obj.kind === "prop") {
      const kind = obj.sprite?.includes("barrel") ? "barrel" : obj.sprite?.includes("terminal") ? "terminal" : "crate";
      const detail = scrapDetailGroup("scrap-prop-detail", new THREE.Vector3(), emit => appendScrapPropDetails(w, d, kind, emit), g, false);
      detail.userData.sourceObject = obj;
    }
    if (id === "nische" && obj.kind === "prop") {
      const detail = nischeDetailGroup("nische-crate-detail", new THREE.Vector3(), emit => appendNischeCrateDetails(w, d, emit), g, false);
      detail.userData.sourceObject = obj;
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
    const save = getSave();
    if (obj.kind === "wild" || isDefeatedGate(obj, save.deadWild) || isTakenStarter(obj, save.starterId)) return;
    const g = objectGroup(obj);
    if (obj.kind === "pot") planter(obj, g);
    else if (obj.kind === "bed" || obj.kind === "mattress") bed(obj, g);
    else if (obj.kind === "npc" || obj.kind === "shop" || obj.kind === "stall") npc(obj, g);
    else if (obj.kind === "door" || obj.kind === "manhole") door(obj, g);
    else if (obj.kind === "sign") {
      tag(g, obj.label, 1.8, 1.6); box(g, .08, 1.5, .08, mat(palette.dark, "metal"));
      if (id === "alley" || id === "yard" || id === "cable" || id === "market" || id === "kai" || id === "sewer" || id === "ash" || id === "drain" || id === "chem" || id === "ring" || id === "labyrinth" || id === "nische" || id === "scrap") {
        const pieces: THREE.BufferGeometry[] = [];
        const trim = (w: number, h: number, x: number, y: number) => {
          const piece = new THREE.BoxGeometry(w, h, .055); piece.translate(x, y, -.035); pieces.push(piece);
        };
        trim(1.95, .045, 0, 1.36); trim(1.95, .045, 0, 1.84);
        trim(.045, .52, -.95, 1.6); trim(.045, .52, .95, 1.6);
        const neon = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
        if (neon) {
          const light = mesh(neon, mat(id === "scrap" ? 0x9b784f : id === "nische" ? 0x90627d : id === "labyrinth" ? 0x78618f : 0x486e71, undefined, id === "scrap" ? 0xf3a457 : id === "nische" ? 0xef78b5 : id === "labyrinth" ? 0xae8df5 : 0x568b8a), g, 0, 0, 0, false);
          light.name = `${id}-sign-neon`;
        }
        const casing = box(g, 1.93, .51, .09, mat(0x293b42, "metal"), 0, 1.6, -.09);
        casing.name = `${id}-sign-casing`;
        if (id === "ash" || id === "drain" || id === "chem" || id === "ring" || id === "labyrinth" || id === "nische" || id === "scrap") casing.castShadow = false;
      }
    }
    else if (obj.kind === "lamp") {
      cylinder(g, .045, .07, 2.8, mat(palette.dark, "metal"));
      const flicker = isDetailedDistrict(id) && active.objs.filter(o => o.kind === "lamp").indexOf(obj) < 2;
      lamp(g, .2, 2.75, 0, 0xf5bc71, 12, flicker ? obj.x + obj.y * 7 : undefined);
      box(g, .7, .06, .07, mat(palette.dark, "metal"), .15, 2.84);
    } else if (obj.kind === "bin") {
      box(g, Math.max(.9, obj.w * WORLD_SCALE), 1, Math.max(.7, obj.h * WORLD_SCALE), mat(0x4f5b49, "metal"));
      box(g, 1.06, .12, .91, mat(palette.dark, "metal"), 0, 1.07);
      for (const s of [-1, 1]) box(g, .13, .2, .3, mat(palette.dark), s * .43, .11, .33);
      if (id === "alley" || id === "yard") {
        const litter = new THREE.Group(); litter.name = `${id}-bin-detail`; g.add(litter);
        const batches = new Map<AlleyFinish, THREE.BufferGeometry[]>();
        appendAlleyBinDetails((finish, geometry) => {
          const batch = batches.get(finish) ?? []; batch.push(geometry); batches.set(finish, batch);
        }, obj.x + obj.y);
        const finishes = { bag: mat(0x303c38), paper: mat(0xb1a88b), metal: mat(0x7a837c, "metal") };
        for (const [finish, pieces] of batches) {
          const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
          if (geometry) { const part = mesh(geometry, finishes[finish as keyof typeof finishes], litter, 0, 0, 0, false); part.name = `${id}-litter:${finish}`; }
        }
      }
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
    let artCount = 0;
    for (let i = 0; i < active.walls.length; i++) {
      const r = active.walls[i];
      const edge = r.x <= 0 || r.y <= 0 || r.x + r.w >= active.w || r.y + r.h >= active.h;
      if (id === "studio" && !edge) continue; // Lounge and speaker banks furnish original blocked rectangles.
      // Water is blocked by the original 2D collision rectangles, not a tall 3D wall.
      if (id === "drain" && DRAIN_WATER.some(water => sameRect(water, r))) {
        const group = drainDetailGroup("drain-water-detail", at(r.x + r.w / 2, r.y + r.h / 2),
          emit => appendDrainWaterDetails(r.w * WORLD_SCALE, r.h * WORLD_SCALE, i, emit), root, false);
        group.userData.sourceRect = r;
        continue;
      }
      // All eight source heat areas are low, blocked beds, including those without an obstacle entry.
      if (id === "ash" && ASH_HOT.includes(r)) {
        const group = ashDetailGroup("ash-ember-detail", at(r.x + r.w / 2, r.y + r.h / 2),
          emit => appendAshEmberDetails(r.w * WORLD_SCALE, r.h * WORLD_SCALE, i, emit), root, false);
        group.userData.sourceRect = r;
        continue;
      }
      const obstacle = active.obstacles?.find(o => o.x === r.x && o.y === r.y && o.w === r.w && o.h === r.h);
      if (obstacle) { renderObstacle(obstacle); continue; }
      const building = active.buildings?.find(b => b.x === r.x && b.y === r.y && b.w === r.w && b.h === r.h)
        // Named alley houses occupy a smaller frontage within the source wall mass.
        ?? (id === "alley" ? active.buildings?.find(b => b.name && b.x >= r.x && b.y >= r.y
          && b.x + b.w <= r.x + r.w && b.y + b.h <= r.y + r.h) : undefined);
      // Raze/Cherry's original building masses touch the map edge but are houses,
      // not the thin boundary wall. Their footprint/collision still stays identical.
      const outside = !active.indoor && (!edge || (id === "alley" && !!building?.name)) && r.w >= 56 && r.h >= 56;
      const kinoStage = id === "kino" && i === 5;
      const height = kinoStage ? .28 : id === "kai" && i === 4 ? .65 : outside ? 3.7 + seeded(i + 17) * 4.8 : edge ? (r.y > active.h / 2 || r.x > active.w / 2 ? .72 : 2.85) : 2.25;
      const m = region(r, height, mat(id === "scrap" ? 0x67645b : id === "nische" ? 0x6b5c66 : id === "labyrinth" ? 0x626070 : id === "ring" ? 0x685d55 : id === "chem" ? 0x576152 : id === "drain" ? 0x526760 : id === "ash" ? outside ? 0x64554b : 0x5a5550 : outside ? new THREE.Color(building?.tone ?? "#546269").lerp(new THREE.Color(0x3a4a53), .72) : id === "sewer" ? 0x4d625d : palette.plaster, id === "sewer" || id === "drain" ? "stone" : "plaster"));
      const firstPart = occluders.length;
      m.name = `original-wall:${i}`; occluder(m);
      // Dark plinth and narrow cap keep the rooms readable as a cutaway diorama.
      occluder(region(r, .16, mat(palette.stone, "stone"), .08));
      const yardShed = id === "yard" && !edge;
      const marketFacade = id === "market" && !edge;
      const ashFacade = id === "ash" && outside;
      const drainFacade = id === "drain" && outside;
      const chemFacade = id === "chem" && outside;
      const ringFacade = id === "ring" && outside;
      const roofKind = id === "alley" && outside ? alleyRoofKind(building?.variant ?? i)
        : id === "scrap" ? outside ? alleyRoofKind(i) : "roof-metal"
        : id === "nische" ? !edge && r.w >= 32 && r.h >= 80 ? "roof-felt" : "roof-metal"
        : id === "labyrinth" ? !edge && r.w >= 56 && r.h >= 56 ? "roof-felt" : "roof-metal"
        : id === "ring" ? ringFacade ? alleyRoofKind(i) : "roof-metal"
        : id === "chem" ? chemFacade ? CHEM_FILL.includes(r) ? "roof-felt" : alleyRoofKind(i) : "roof-metal"
        : id === "drain" ? drainFacade ? alleyRoofKind(i) : "roof-metal"
        : id === "ash" ? ashFacade ? alleyRoofKind(i) : "roof-metal"
        : id === "kai" || id === "sewer" ? "roof-metal" : yardShed || marketFacade ? alleyRoofKind(i) : id === "kino" ? kinoStage ? "roof-felt" : "roof-metal" : undefined;
      const roofTint = roofKind === "roof-tile" ? 0x896f5b : roofKind === "roof-metal" ? 0x718087 : roofKind === "roof-felt" ? 0x454d4c : outside ? 0x626c6b : 0x7d8681;
      const roof = occluder(region(r, .1, mat(roofTint, roofKind ?? "stone"), height + .02));
      if (roofKind) { roof.name = id === "kai" || id === "sewer" ? `${id}-cap` : `${id}-roof`; roof.userData.roofKind = roofKind; }
      if (id === "scrap") {
        roof.name = outside ? "scrap-roof" : "scrap-cap";
        const centre = at(r.x + r.w / 2, r.y + r.h / 2);
        // Interior corridors run on both sides of the original solids. Split each
        // face into small frustum-bounded groups without spanning a whole block.
        const faces = edge ? [r.w < r.h ? r.x < active.w / 2 ? 1 : 3 : r.y > active.h / 2 ? 2 : 0] : [0, 1, 2, 3];
        for (const face of faces) {
          const length = (face % 2 ? r.h : r.w) * WORLD_SCALE;
          const depth = (face % 2 ? r.w : r.h) * WORLD_SCALE;
          const count = Math.ceil(length / 16), span = length / count, angle = face * Math.PI / 2;
          for (let chunk = 0; chunk < count; chunk++) {
            const offset = -length / 2 + (chunk + .5) * span;
            const position = centre.clone().add(new THREE.Vector3(
              Math.cos(angle) * offset + Math.sin(angle) * depth / 2, 0,
              -Math.sin(angle) * offset + Math.cos(angle) * depth / 2));
            const group = scrapDetailGroup("scrap-wall-detail", position,
              emit => appendScrapWallDetails(span, 0, height, i * 29 + face * 7 + chunk, emit));
            group.rotation.y = angle; group.userData.sourceRect = r;
            group.userData.face = face; group.userData.chunk = chunk;
          }
        }
      }
      if (id === "nische") {
        roof.name = "nische-cap";
        const centre = at(r.x + r.w / 2, r.y + r.h / 2);
        // Interior corridors run on both sides of the original solids. Split each
        // face into small frustum-bounded groups without spanning a whole block.
        const faces = edge ? [r.w < r.h ? r.x < active.w / 2 ? 1 : 3 : r.y > active.h / 2 ? 2 : 0] : [0, 1, 2, 3];
        for (const face of faces) {
          const length = (face % 2 ? r.h : r.w) * WORLD_SCALE;
          const depth = (face % 2 ? r.w : r.h) * WORLD_SCALE;
          const count = Math.ceil(length / 16), span = length / count, angle = face * Math.PI / 2;
          for (let chunk = 0; chunk < count; chunk++) {
            const offset = -length / 2 + (chunk + .5) * span;
            const position = centre.clone().add(new THREE.Vector3(
              Math.cos(angle) * offset + Math.sin(angle) * depth / 2, 0,
              -Math.sin(angle) * offset + Math.cos(angle) * depth / 2));
            const group = nischeDetailGroup("nische-wall-detail", position,
              emit => appendNischeWallDetails(span, 0, height, i * 29 + face * 7 + chunk, emit));
            group.rotation.y = angle; group.userData.sourceRect = r;
            group.userData.face = face; group.userData.chunk = chunk;
          }
        }
      }
      if (id === "labyrinth") {
        roof.name = "labyrinth-cap";
        const centre = at(r.x + r.w / 2, r.y + r.h / 2);
        // Interior corridors run on both sides of the original solids. Split each
        // face into small frustum-bounded groups without spanning a whole block.
        const faces = edge ? [r.w < r.h ? r.x < active.w / 2 ? 1 : 3 : r.y > active.h / 2 ? 2 : 0] : [0, 1, 2, 3];
        for (const face of faces) {
          const length = (face % 2 ? r.h : r.w) * WORLD_SCALE;
          const depth = (face % 2 ? r.w : r.h) * WORLD_SCALE;
          const count = Math.ceil(length / 16), span = length / count, angle = face * Math.PI / 2;
          for (let chunk = 0; chunk < count; chunk++) {
            const offset = -length / 2 + (chunk + .5) * span;
            const position = centre.clone().add(new THREE.Vector3(
              Math.cos(angle) * offset + Math.sin(angle) * depth / 2, 0,
              -Math.sin(angle) * offset + Math.cos(angle) * depth / 2));
            const group = labyrinthDetailGroup("labyrinth-wall-detail", position,
              emit => appendLabyrinthWallDetails(span, 0, height, i * 29 + face * 7 + chunk, emit));
            group.rotation.y = angle; group.userData.sourceRect = r;
            group.userData.face = face; group.userData.chunk = chunk;
          }
        }
      }
      if (id === "ring") {
        roof.name = ringFacade ? "ring-roof" : "ring-cap";
        const centre = at(r.x + r.w / 2, r.y + r.h / 2);
        if (ringFacade) {
          const group = ringDetailGroup("ring-facade-detail", centre,
            emit => appendRingFacadeDetails(r.w * WORLD_SCALE, r.h * WORLD_SCALE, height, i, emit));
          group.userData.sourceRect = r;
        } else {
          const side = r.w < r.h, length = (side ? r.h : r.w) * WORLD_SCALE;
          const depth = (side ? r.w : r.h) * WORLD_SCALE, count = Math.ceil(length / 24), span = length / count;
          const angle = side ? (r.x < active.w / 2 ? Math.PI / 2 : -Math.PI / 2) : r.y > active.h / 2 ? Math.PI : 0;
          for (let chunk = 0; chunk < count; chunk++) {
            const offset = -length / 2 + (chunk + .5) * span;
            const position = centre.clone().add(new THREE.Vector3(Math.cos(angle) * offset, 0, -Math.sin(angle) * offset));
            const group = ringDetailGroup("ring-boundary-detail", position,
              emit => appendRingBoundaryDetails(span, depth, height, i * 17 + chunk, emit));
            group.rotation.y = angle; group.userData.sourceRect = r; group.userData.chunk = chunk;
          }
        }
      }
      if (id === "chem") {
        roof.name = chemFacade ? "chem-roof" : "chem-cap";
        const centre = at(r.x + r.w / 2, r.y + r.h / 2);
        if (chemFacade) {
          const group = chemDetailGroup("chem-facade-detail", centre,
            emit => appendChemFacadeDetails(r.w * WORLD_SCALE, r.h * WORLD_SCALE, height, i, emit));
          group.userData.sourceRect = r;
        } else {
          const side = r.w < r.h, length = (side ? r.h : r.w) * WORLD_SCALE;
          const depth = (side ? r.w : r.h) * WORLD_SCALE, count = Math.ceil(length / 24), span = length / count;
          const angle = side ? (r.x < active.w / 2 ? Math.PI / 2 : -Math.PI / 2) : r.y > active.h / 2 ? Math.PI : 0;
          for (let chunk = 0; chunk < count; chunk++) {
            const offset = -length / 2 + (chunk + .5) * span;
            const position = centre.clone().add(new THREE.Vector3(Math.cos(angle) * offset, 0, -Math.sin(angle) * offset));
            const group = chemDetailGroup("chem-boundary-detail", position,
              emit => appendChemBoundaryDetails(span, depth, height, i * 17 + chunk, emit));
            group.rotation.y = angle; group.userData.sourceRect = r; group.userData.chunk = chunk;
          }
        }
      }
      if (id === "drain") {
        roof.name = drainFacade ? "drain-roof" : "drain-cap";
        const centre = at(r.x + r.w / 2, r.y + r.h / 2);
        if (drainFacade) {
          const group = drainDetailGroup("drain-facade-detail", centre,
            emit => appendDrainFacadeDetails(r.w * WORLD_SCALE, r.h * WORLD_SCALE, height, i, emit));
          group.userData.sourceRect = r;
        } else {
          // Short local meshes allow frustum culling along the long service walls.
          const side = r.w < r.h, length = (side ? r.h : r.w) * WORLD_SCALE;
          const depth = (side ? r.w : r.h) * WORLD_SCALE, count = Math.ceil(length / 24), span = length / count;
          const angle = side ? (r.x < active.w / 2 ? Math.PI / 2 : -Math.PI / 2) : r.y > active.h / 2 ? Math.PI : 0;
          for (let chunk = 0; chunk < count; chunk++) {
            const offset = -length / 2 + (chunk + .5) * span;
            const position = centre.clone().add(new THREE.Vector3(Math.cos(angle) * offset, 0, -Math.sin(angle) * offset));
            const group = drainDetailGroup("drain-boundary-detail", position,
              emit => appendDrainBoundaryDetails(span, depth, height, i * 17 + chunk, emit));
            group.rotation.y = angle; group.userData.sourceRect = r; group.userData.chunk = chunk;
          }
        }
      }
      if (id === "ash") {
        roof.name = ashFacade ? "ash-roof" : "ash-cap";
        const side = edge && r.w < r.h;
        const group = ashDetailGroup(ashFacade ? "ash-facade-detail" : "ash-boundary-detail",
          at(r.x + r.w / 2, r.y + r.h / 2), emit => {
            if (ashFacade) appendAshFacadeDetails(r.w * WORLD_SCALE, r.h * WORLD_SCALE, height, i, emit);
            else appendAshBoundaryDetails((side ? r.h : r.w) * WORLD_SCALE, (side ? r.w : r.h) * WORLD_SCALE, height, i, emit);
          });
        group.userData.sourceRect = r;
        if (edge) group.rotation.y = side ? (r.x === 0 ? Math.PI / 2 : -Math.PI / 2) : r.y === 0 ? 0 : Math.PI;
      }
      if (id === "kino") {
        roof.name = "kino-cap";
        const side = edge && r.w < r.h;
        const group = kinoDetailGroup(kinoStage ? "kino-stage-detail" : "kino-wall-detail",
          at(r.x + r.w / 2, r.y + r.h / 2), emit => {
            if (kinoStage) appendKinoStageDetails(r.w * WORLD_SCALE, r.h * WORLD_SCALE, height, emit);
            else appendKinoWallDetails((side ? r.h : r.w) * WORLD_SCALE, (side ? r.w : r.h) * WORLD_SCALE, height, emit);
          });
        group.userData.sourceRect = r;
        if (edge) group.rotation.y = side ? (r.x === 0 ? Math.PI / 2 : -Math.PI / 2) : r.y === 0 ? 0 : Math.PI;
      }
      if (id === "yard") {
        const centre = at(r.x + r.w / 2, r.y + r.h / 2);
        const side = edge && r.w < r.h;
        const group = yardDetailGroup(yardShed ? "yard-shed-detail" : "yard-boundary-detail", centre, emit => {
          if (yardShed) appendYardShedDetails(r.w * WORLD_SCALE, r.h * WORLD_SCALE, height, i, emit);
          else appendYardBoundaryDetails((side ? r.h : r.w) * WORLD_SCALE, (side ? r.w : r.h) * WORLD_SCALE, height, emit);
        });
        if (edge) group.rotation.y = side ? (r.x === 0 ? Math.PI / 2 : -Math.PI / 2) : r.y === 0 ? 0 : Math.PI;
      }
      if (id === "cable") {
        const group = new THREE.Group(); group.name = "cable-wall-detail"; group.userData.sourceRect = r;
        group.position.copy(at(r.x + r.w / 2, r.y + r.h / 2)); root.add(group);
        const side = edge && r.w < r.h;
        cableParts(group, emit => appendCableWallDetails((side ? r.h : r.w) * WORLD_SCALE, (side ? r.w : r.h) * WORLD_SCALE, height, emit));
        if (edge) group.rotation.y = side ? (r.x === 0 ? Math.PI / 2 : -Math.PI / 2) : r.y === 0 ? 0 : Math.PI;
      }
      if (id === "market") {
        const side = edge && r.w < r.h;
        const group = marketDetailGroup(marketFacade ? "market-facade-detail" : "market-boundary-detail",
          at(r.x + r.w / 2, r.y + r.h / 2), emit => {
            if (marketFacade) appendMarketFacadeDetails(r.w * WORLD_SCALE, r.h * WORLD_SCALE, height, i, emit);
            else appendMarketBoundaryDetails((side ? r.h : r.w) * WORLD_SCALE, (side ? r.w : r.h) * WORLD_SCALE, height, emit);
          });
        group.userData.sourceRect = r;
        if (edge) group.rotation.y = side ? (r.x === 0 ? Math.PI / 2 : -Math.PI / 2) : r.y === 0 ? 0 : Math.PI;
      }
      if (id === "kai") {
        const quay = i === 4, side = edge && r.w < r.h;
        const group = new THREE.Group(); group.name = quay ? "kai-quay-detail" : "kai-wall-detail";
        group.userData.sourceRect = r; group.position.copy(at(r.x + r.w / 2, r.y + r.h / 2)); root.add(group);
        kaiParts(group, emit => quay ? appendKaiQuay(r.w * WORLD_SCALE, r.h * WORLD_SCALE, height, emit)
          : appendKaiWall((side ? r.h : r.w) * WORLD_SCALE, (side ? r.w : r.h) * WORLD_SCALE, height, i === 0, emit));
        if (edge) group.rotation.y = side ? (r.x === 0 ? Math.PI / 2 : -Math.PI / 2) : r.y === 0 ? 0 : Math.PI;
      }
      if (id === "sewer") {
        const side = r.w < r.h, length = (side ? r.h : r.w) * WORLD_SCALE;
        const depth = (side ? r.w : r.h) * WORLD_SCALE, count = Math.ceil(length / 24), span = length / count;
        const angle = side ? (r.x === 0 ? Math.PI / 2 : -Math.PI / 2) : r.y === 0 ? 0 : Math.PI;
        const centre = at(r.x + r.w / 2, r.y + r.h / 2);
        for (let chunk = 0; chunk < count; chunk++) {
          const group = new THREE.Group(); group.name = "sewer-wall-detail"; root.add(group);
          const offset = -length / 2 + (chunk + .5) * span;
          group.position.copy(centre).add(new THREE.Vector3(Math.cos(angle) * offset, 0, -Math.sin(angle) * offset));
          group.rotation.y = angle; group.userData.sourceRect = r; group.userData.chunk = chunk;
          sewerParts(group, emit => appendSewerWallDetails(span, depth, height, i * 17 + chunk, emit), true, Math.hypot(span, depth) / 2 + 1);
        }
      }
      if (outside && r.w > 100 && r.h > 80 && id !== "ash" && id !== "drain" && id !== "chem" && id !== "ring" && id !== "scrap") {
        buildingDetails(r, height, i, building?.name, building?.side, building ? (building.x + building.w / 2 - r.x - r.w / 2) * WORLD_SCALE : 0);
      }
      if (isDetailedDistrict(id) && artCount < 24) {
        wallArt ??= createWallArt();
        // House windows keep their ground-floor band; blank perimeter walls have more room.
        const band = edge && !outside ? Math.min(1.8, height - .12) : yardShed ? .85 : .6;
        const geometry = wallArt.geometry(r.w * WORLD_SCALE, r.h * WORLD_SCALE, height, i, band);
        if (geometry) {
          const p = at(r.x + r.w / 2, r.y + r.h / 2);
          const art = occluder(mesh(geometry, wallArt.material, root, p.x, 0, p.z, false));
          art.name = "district-wall-art"; art.userData.artTypes = geometry.userData.wallArtTypes; artCount++;
        }
      }
      for (const part of occluders.slice(firstPart)) part.userData.occlusionGroup = m.uuid;
    }
  }
  /** A cinema fixture costs one draw per finish and shares a single fade group. */
  function kinoDetailGroup(name: string, position: THREE.Vector3, append: (emit: KinoDetailEmitter) => void, parent: THREE.Object3D = root) {
    const group = new THREE.Group(); group.name = name; group.position.copy(position); parent.add(group);
    group.userData.districtDetail = "kino";
    const finishes: Record<KinoFinish, THREE.Material> = {
      frame: mat(0x293236, "metal"), metal: mat(0x91877b, "metal"), fabric: mat(0x683d43, "plaster"),
      wood: mat(0x715a41, "wood"), rubber: mat(0x1b2327),
      warm: mat(0x806c47, undefined, 0xb9975c), cool: mat(0x3b6769, undefined, 0x558e91),
    };
    const batches = new Map<KinoFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.kinoFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (geometry) {
        const part = occluder(mesh(geometry, finishes[finish], group, 0, 0, 0, false));
        part.name = `${name}:${finish}`; part.userData.occlusionGroup = group.uuid;
      }
    }
    return group;
  }

  function sewerParts(group: THREE.Group, append: (emit: SewerDetailEmitter) => void, fading: boolean, radius: number) {
    group.userData.districtDetail = "sewer"; group.userData.detailRadius = radius;
    sewerDetailGroups.push(group);
    const finishes: Record<SewerFinish, THREE.Material> = {
      stone: mat(0x67746a, "stone"), metal: mat(0x7b8980, "metal"), rust: mat(0x82624c, "metal"),
      dark: mat(0x263b36), moss: mat(0x49674b, "plaster"),
      cyan: mat(0x3f7065, undefined, 0x579d89), amber: mat(0x7e704b, undefined, 0xb69a61),
    };
    const batches = new Map<SewerFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.sewerFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const part = mesh(geometry, finishes[finish], group, 0, 0, 0, false);
      part.name = `${group.name}:${finish}`;
      if (fading) { occluder(part); part.userData.occlusionGroup = group.uuid; }
    }
  }
  function updateSewerDetails() {
    for (const group of sewerDetailGroups) {
      group.getWorldPosition(sewerDetailPosition);
      group.visible = Math.hypot(sewerDetailPosition.x - player.position.x, sewerDetailPosition.z - player.position.z)
        <= 48 + group.userData.detailRadius;
    }
  }

  function kaiParts(group: THREE.Group, append: (emit: KaiEmitter) => void, fading = true) {
    group.userData.districtDetail = "kai";
    const finishes: Record<KaiFinish, THREE.Material> = {
      frame: mat(0x26353c, "metal"), metal: mat(0x738586, "metal"), stone: mat(0x586967, "stone"),
      wood: mat(0x6e6450, "wood"), rust: mat(0x826052, "metal"),
      cyan: mat(0x346674, undefined, 0x4eabb8), warm: mat(0x876853, undefined, 0xc28d61),
    };
    const batches = new Map<KaiFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.kaiFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const part = mesh(geometry, finishes[finish], group, 0, 0, 0, false);
      part.name = `${group.name}:${finish}`;
      if (fading) { occluder(part); part.userData.occlusionGroup = group.uuid; }
    }
  }
  /** Local corridor fittings share cached finishes and their source wall's fade. */
  function scrapDetailGroup(name: string, position: THREE.Vector3, append: (emit: ScrapDetailEmitter) => void, parent: THREE.Object3D = root, fading = true) {
    const group = new THREE.Group(); group.name = name; group.position.copy(position); parent.add(group);
    group.userData.districtDetail = "scrap";
    const finishes: Record<ScrapFinish, THREE.Material> = {
      stone: mat(0x807467, "plaster"), metal: mat(0x858d88, "metal"), rust: mat(0x956445, "metal"),
      dark: mat(0x2c3333, "metal"), yellow: mat(0xbf9b53, "plaster"),
      glow: mat(0x9b784f, undefined, 0xf3a457), wood: mat(0x6e5d4c, "wood"),
    };
    const batches = new Map<ScrapFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.scrapFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const part = mesh(geometry, finishes[finish], group, 0, 0, 0, false); part.name = `${name}:${finish}`;
      if (fading) { occluder(part); part.userData.occlusionGroup = group.uuid; }
    }
    return group;
  }
  /** Local corridor fittings share cached finishes and their source wall's fade. */
  function nischeDetailGroup(name: string, position: THREE.Vector3, append: (emit: NischeDetailEmitter) => void, parent: THREE.Object3D = root, fading = true) {
    const group = new THREE.Group(); group.name = name; group.position.copy(position); parent.add(group);
    group.userData.districtDetail = "nische";
    const finishes: Record<NischeFinish, THREE.Material> = {
      stone: mat(0x8a7a7d, "plaster"), metal: mat(0x9a8771, "metal"), dark: mat(0x342b36, "metal"),
      fabric: mat(0x814b69, "plaster"), paper: mat(0xc2b8ae, "plaster"),
      glow: mat(0x965d7c, undefined, 0xef78b5), wood: mat(0x776255, "wood"),
    };
    const batches = new Map<NischeFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.nischeFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const part = mesh(geometry, finishes[finish], group, 0, 0, 0, false); part.name = `${name}:${finish}`;
      if (fading) { occluder(part); part.userData.occlusionGroup = group.uuid; }
    }
    return group;
  }
  /** Local corridor fittings share cached finishes and their source wall's fade. */
  function labyrinthDetailGroup(name: string, position: THREE.Vector3, append: (emit: LabyrinthDetailEmitter) => void, parent: THREE.Object3D = root, fading = true) {
    const group = new THREE.Group(); group.name = name; group.position.copy(position); parent.add(group);
    group.userData.districtDetail = "labyrinth";
    const finishes: Record<LabyrinthFinish, THREE.Material> = {
      stone: mat(0x77737f, "plaster"), metal: mat(0x93939f, "metal"), rust: mat(0x796050, "metal"),
      dark: mat(0x30303d, "metal"), paper: mat(0xb4b1a9, "plaster"), violet: mat(0x706080, "plaster"),
      glow: mat(0x716180, undefined, 0xae8df5), wood: mat(0x716150, "wood"),
    };
    const batches = new Map<LabyrinthFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.labyrinthFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const part = mesh(geometry, finishes[finish], group, 0, 0, 0, false); part.name = `${name}:${finish}`;
      if (fading) { occluder(part); part.userData.occlusionGroup = group.uuid; }
    }
    return group;
  }
  /** Arena fittings share cached finishes and fade with their original wall or fence. */
  function ringDetailGroup(name: string, position: THREE.Vector3, append: (emit: RingDetailEmitter) => void, parent: THREE.Object3D = root, fading = true) {
    const group = new THREE.Group(); group.name = name; group.position.copy(position); parent.add(group);
    group.userData.districtDetail = "ring";
    const finishes: Record<RingFinish, THREE.Material> = {
      stone: mat(0x776959, "plaster"), metal: mat(0x91908a, "metal"), rust: mat(0x805b46, "metal"),
      dark: mat(0x26302d, "metal"), red: mat(0x7d3e36, "plaster"), cream: mat(0xc7bda4, "plaster"),
      wood: mat(0x7b6348, "wood"), glow: mat(0x886947, undefined, 0xb1864b),
    };
    const batches = new Map<RingFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.ringFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const part = mesh(geometry, finishes[finish], group, 0, 0, 0, false); part.name = `${name}:${finish}`;
      if (fading) { occluder(part); part.userData.occlusionGroup = group.uuid; }
    }
    return group;
  }
  /** Chemical service structures use local material batches with their source solid's fade. */
  function chemDetailGroup(name: string, position: THREE.Vector3, append: (emit: ChemDetailEmitter) => void, parent: THREE.Object3D = root, fading = true) {
    const group = new THREE.Group(); group.name = name; group.position.copy(position); parent.add(group);
    group.userData.districtDetail = "chem";
    const liquid = mat(0x546c36, undefined, 0x1a2e0a);
    liquid.roughness = .19; liquid.clearcoat = .85; liquid.emissiveIntensity = .65;
    const finishes: Record<ChemFinish, THREE.Material> = {
      stone: mat(0x6b7060, "plaster"), metal: mat(0x929b88, "metal"), rust: mat(0x80654b, "metal"),
      dark: mat(0x28352e, "metal"), yellow: mat(0xc0aa50, "plaster"), green: liquid,
      glass: mat(0x27474c, "metal", 0x43645d), wood: mat(0x756950, "wood"),
    };
    const batches = new Map<ChemFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.chemFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const part = mesh(geometry, finishes[finish], group, 0, 0, 0, false); part.name = `${name}:${finish}`;
      if (fading) { occluder(part); part.userData.occlusionGroup = group.uuid; }
    }
    return group;
  }
  /** Wet masonry, mechanical fittings and basin details reuse cached PBR finishes. */
  function drainDetailGroup(name: string, position: THREE.Vector3, append: (emit: DrainDetailEmitter) => void, parent: THREE.Object3D = root, fading = true) {
    const group = new THREE.Group(); group.name = name; group.position.copy(position); parent.add(group);
    group.userData.districtDetail = "drain";
    const finishes: Record<DrainFinish, THREE.Material> = {
      stone: mat(0x697a6b, "stone"), metal: mat(0x82938f, "metal"), rust: mat(0x7a5944, "metal"),
      dark: mat(0x202f31, "metal"), moss: mat(0x46614a, "plaster"),
      cyan: mat(0x37646b, undefined, 0x5b9ba8), amber: mat(0x7b6750, undefined, 0xb58a55),
      wood: mat(0x6b6251, "wood"), porcelain: mat(0xb2bbb1),
    };
    const batches = new Map<DrainFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.drainFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const part = mesh(geometry, finishes[finish], group, 0, 0, 0, false); part.name = `${name}:${finish}`;
      if (fading) { occluder(part); part.userData.occlusionGroup = group.uuid; }
    }
    return group;
  }
  /** Each ash structure has at most seven cached material batches and one fade group. */
  function ashDetailGroup(name: string, position: THREE.Vector3, append: (emit: AshDetailEmitter) => void, parent: THREE.Object3D = root, fading = true) {
    const group = new THREE.Group(); group.name = name; group.position.copy(position);
    group.userData.districtDetail = "ash"; parent.add(group);
    const finishes: Record<AshFinish, THREE.Material> = {
      frame: mat(0x302e2b, "metal"), metal: mat(0x7b7770, "metal"),
      brick: mat(0x776252, "plaster"), wood: mat(0x6f5441, "wood"), soot: mat(0x262423, "stone"),
      amber: mat(0x805037, undefined, 0xc87737), cool: mat(0x395b60, undefined, 0x5a8993),
    };
    const batches = new Map<AshFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.ashFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const part = mesh(geometry, finishes[finish], group, 0, 0, 0, false); part.name = `${name}:${finish}`;
      if (fading) { occluder(part); part.userData.occlusionGroup = group.uuid; }
    }
    return group;
  }
  /** Market fixtures share cached PBR materials and the source structure's fade. */
  function marketDetailGroup(name: string, position: THREE.Vector3, append: (emit: MarketDetailEmitter) => void) {
    const group = new THREE.Group(); group.name = name; group.position.copy(position);
    group.userData.districtDetail = "market"; root.add(group);
    const finishes: Record<MarketFinish, THREE.Material> = {
      frame: mat(0x25383e, "metal"), metal: mat(0x78857c, "metal"),
      brick: mat(0x766653, "plaster"), wood: mat(0x766044, "wood"),
      fabric: mat(0x687d71, "plaster"), leaf: mat(0x485e43),
      warm: mat(0x746044, undefined, 0xb98d59), cool: mat(0x34595e, undefined, 0x518c96),
    };
    const batches = new Map<MarketFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const parts = batches.get(finish) ?? []; parts.push(geometry); batches.set(finish, parts); features.add(feature);
    });
    group.userData.marketFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (geometry) {
        const part = occluder(mesh(geometry, finishes[finish], group, 0, 0, 0, false));
        part.name = `${name}:${finish}`;
        // Stand-alone overhead fixtures fade together; walls override this with their UUID.
        part.userData.occlusionGroup = group.uuid;
      }
    }
    return group;
  }
  /** Keep detailed electrical fixtures to a few material batches per original solid. */
  function cableParts(group: THREE.Group, append: (emit: CableDetailEmitter) => void, fading = true) {
    group.userData.districtDetail = "cable";
    const finishes: Record<CableFinish, THREE.Material> = {
      shell: mat(0x304b4b, "metal"), cap: mat(0x607a76, "roof-metal"),
      metal: mat(0x67736d, "metal"), rubber: mat(0x1a2c2c), copper: mat(0x967458, "metal"),
      green: mat(0x315b54, undefined, 0x4ca392), amber: mat(0x776344, undefined, 0xc3994f),
    };
    const batches = new Map<CableFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const parts = batches.get(finish) ?? []; parts.push(geometry); batches.set(finish, parts); features.add(feature);
    });
    group.userData.cableFeatures = [...features];
    const meshes: THREE.Mesh[] = [];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (geometry) {
        const part = mesh(geometry, finishes[finish], group, 0, 0, 0, finish === "shell" && fading);
        if (fading) occluder(part);
        part.name = `${group.name.replace("-detail", "")}:${finish}`; meshes.push(part);
      }
    }
    return meshes;
  }

  /** Each yard structure has bounded material batches and follows its wall fade. */
  function yardDetailGroup(name: string, position: THREE.Vector3, append: (emit: YardDetailEmitter) => void) {
    const group = new THREE.Group(); group.name = name; group.position.copy(position);
    group.userData.districtDetail = id; root.add(group);
    const finishes: Record<YardFinish, THREE.Material> = {
      frame: mat(0x263b3c, "metal"), metal: mat(0x718078, "metal"),
      brick: mat(0x6a6953, "plaster"), wood: mat(0x746649, "wood"), leaf: mat(0x4d6843),
      warm: mat(0x665239, undefined, 0xb4884f), cool: mat(0x36534d, undefined, 0x568c75),
    };
    const batches = new Map<YardFinish, THREE.BufferGeometry[]>(), features = new Set<string>();
    append((finish, geometry, feature) => {
      const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces); features.add(feature);
    });
    group.userData.yardFeatures = [...features];
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (geometry) { const part = occluder(mesh(geometry, finishes[finish], group, 0, 0, 0)); part.name = `${name}:${finish}`; }
    }
    return group;
  }

  function buildingDetails(r: Rect, height: number, seed: number, name?: string, entranceSide?: "n" | "s", nameOffsetX = 0) {
    const group = new THREE.Group(); group.name = "rain-worn-facade";
    group.position.copy(at(r.x + r.w / 2, r.y + r.h / 2)); root.add(group);
    const w = r.w * WORLD_SCALE, d = r.h * WORLD_SCALE;
    const alley = id === "alley", features = new Set<string>();
    if (alley) { group.userData.districtDetail = "alley"; group.userData.facadeSides = 4; }
    // Merge all repeated trim by material: dense façades cost a handful of draws.
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    function detail(material: THREE.Material, width: number, h: number, depth: number, x: number, y: number, z: number) {
      const geometry = new THREE.BoxGeometry(width, h, depth); geometry.translate(x, y, z);
      const batch = batches.get(material) ?? []; batch.push(geometry); batches.set(material, batch);
    }
    const frame = mat(0x1f2a30, "metal"), stone = mat(0x66706d, "stone"), metal = mat(0x4b5c60, "metal");
    const unlit = mat(0x14252c, "metal"), warm = mat(0x514432, undefined, 0x9b7044), cool = mat(0x273e43, undefined, 0x3a6268);
    const cols = Math.min(12, Math.max(2, Math.floor(w / 2.1))), rows = Math.max(1, Math.floor((height - .5) / 1.65));
    for (let side = 0; side < (alley ? 4 : 3); side++) {
      const cross = side === 1 || side === 2, reverse = side === 3;
      const length = cross ? d : w, count = cross ? Math.min(8, Math.max(1, Math.floor(d / 2.2))) : cols;
      for (let row = 0; row < rows; row++) for (let col = 0; col < count; col++) {
        const u = -length / 2 + (col + .5) * length / count, y = 1.2 + row * 1.65;
        const light = seeded(seed * 101 + row * 27 + col * 7 + side * 19);
        const pane = light > .81 ? warm : light < .055 ? cool : unlit;
        const x = side === 1 ? -w / 2 - .04 : side === 2 ? w / 2 + .04 : u;
        const z = cross ? u : (reverse ? -1 : 1) * (d / 2 + .04);
        detail(frame, cross ? .1 : .96, 1.11, cross ? .96 : .1, x, y, z);
        detail(pane, cross ? .11 : .74, .88, cross ? .74 : .11, x + (side === 1 ? -.025 : side === 2 ? .025 : 0), y, z + (cross ? 0 : reverse ? -.025 : .025));
        detail(stone, cross ? .26 : 1.05, .09, cross ? 1.05 : .26, x, y - .55, z);
        detail(frame, cross ? .14 : .04, .94, cross ? .04 : .14, x, y, z + (cross ? 0 : reverse ? -.07 : .07));
        if (light > .5) detail(frame, cross ? .14 : .8, .04, cross ? .8 : .14, x, y + .08, z + (cross ? 0 : reverse ? -.07 : .07));
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
    if (alley) {
      const finishes: Record<AlleyFinish, THREE.Material> = {
        frame, stone, metal, neon: cool, brick: mat(0x6b5146, "plaster"), leaf: mat(0x425f42),
        paper: frame, bag: frame,
      };
      appendAlleyBuildingDetails(w, d, height, seed, (finish, geometry, feature) => {
        const material = finishes[finish], batch = batches.get(material) ?? [];
        batch.push(geometry); batches.set(material, batch); features.add(feature);
      });
      group.userData.alleyFeatures = [...features];
    }
    for (const [material, geometries] of batches) {
      const geometry = mergeGeometries(geometries, false);
      for (const part of geometries) part.dispose();
      if (geometry) {
        const part = occluder(mesh(geometry, material, group, 0, 0, 0));
        if (alley) { part.name = `alley-building-detail:${material.uuid}`; part.userData.alleyFeature = [...features]; }
      }
    }
    if (name) {
      const rear = alley && entranceSide === "s";
      const n = tag(group, name.toUpperCase(), Math.min(4, w * .8), 2.9, "#c6b48f", (rear ? -1 : 1) * (d / 2 + .2));
      n.name = "house-name";
      if (alley) n.position.x = nameOffsetX;
      if (rear) n.rotation.y = Math.PI;
      // tag already owns a unique local material/texture; no clone or sharedTexture flag.
      if (alley) occluders.push(n);
    }
  }
  function renderObstacle(rect: Rect & { kind: string }) {
    const p = at(rect.x + rect.w / 2, rect.y + rect.h / 2);
    const w = rect.w * WORLD_SCALE, d = rect.h * WORLD_SCALE;
    if (id === "scrap" && rect.kind === "fence") {
      const group = scrapDetailGroup("scrap-fence-detail", p, emit => appendScrapFenceDetails(w, d, rect.x + rect.y, emit));
      group.userData.sourceRect = rect;
      return;
    }
    if (id === "nische" && rect.kind === "fence") {
      const gate = rect.x === 1472 && rect.w === 28;
      const group = nischeDetailGroup("nische-partition-detail", p,
        emit => appendNischePartitionDetails(w, d, gate, rect.x + rect.y, emit));
      group.userData.sourceRect = rect; group.userData.gate = gate;
      return;
    }
    if (id === "labyrinth" && rect.kind === "fence") {
      const group = labyrinthDetailGroup("labyrinth-fence-detail", p, emit => appendLabyrinthFenceDetails(w, d, rect.x + rect.y, emit));
      group.userData.sourceRect = rect;
      return;
    }
    if (id === "ring" && rect.kind === "fence") {
      const group = ringDetailGroup("ring-fence-detail", p, emit => appendRingFenceDetails(w, d, rect.x + rect.y, emit));
      group.userData.sourceRect = rect;
      return;
    }
    const g = new THREE.Group(); g.position.copy(p); root.add(g);
    if (id === "scrap" && rect.kind === "block") {
      const role = SCRAP_BELT.some(source => sameRect(source, rect)) ? "belt"
        : SCRAP_PILES.some(source => sameRect(source, rect)) ? "pile" : "gate";
      g.name = "scrap-obstacle-detail"; g.userData.sourceRect = rect; g.userData.role = role;
      const body = occluder(box(g, w, .75, d, mat(role === "pile" ? 0x625a4e : 0x515a56, role === "pile" ? "stone" : "metal")));
      body.name = "scrap-obstacle-body"; body.userData.occlusionGroup = body.uuid;
      if (role === "gate") {
        const cap = occluder(mesh(new THREE.BoxGeometry(w, .06, d), mat(0x77796b, "roof-metal"), g, 0, .77, 0, false));
        cap.name = "scrap-gate-cap"; cap.userData.occlusionGroup = body.uuid;
      }
      // The long conveyors retain one source body, with small independent detail bounds.
      const count = role === "belt" ? Math.ceil(w / 16) : 1, span = w / count;
      for (let chunk = 0; chunk < count; chunk++) {
        const position = new THREE.Vector3(-w / 2 + (chunk + .5) * span, 0, 0);
        const seed = rect.x + rect.y + chunk;
        const detail = scrapDetailGroup(`scrap-${role}-fittings`, position, emit => {
          if (role === "belt") appendScrapBeltDetails(span, d, seed, emit);
          else if (role === "pile") appendScrapPileDetails(w, d, seed, emit);
          else appendScrapGateDetails(w, d, seed, emit);
        }, g);
        detail.userData.chunk = chunk;
        for (const part of detail.children) part.userData.occlusionGroup = body.uuid;
      }
      return;
    }
    if (id === "ring" && rect.kind === "block") {
      g.name = "ring-block-detail"; g.userData.sourceRect = rect;
      const body = occluder(box(g, w, .75, d, mat(palette.stone, "stone")));
      body.name = "ring-block-body"; body.userData.occlusionGroup = body.uuid;
      const cap = occluder(mesh(new THREE.BoxGeometry(w, .06, d), mat(0x777769, "roof-metal"), g, 0, .77, 0, false));
      cap.name = "ring-block-cap"; cap.userData.occlusionGroup = body.uuid;
      const detail = ringDetailGroup("ring-block-fittings", new THREE.Vector3(), emit => appendRingBlockDetails(w, d, emit), g);
      for (const part of detail.children) part.userData.occlusionGroup = body.uuid;
      return;
    }
    if (id === "chem" && rect.kind === "block") {
      const vat = CHEM_VATS.some(source => sameRect(source, rect));
      g.name = vat ? "chem-vat-detail" : "chem-block-detail"; g.userData.sourceRect = rect;
      const body = occluder(box(g, w, .75, d, mat(vat ? 0x566456 : palette.stone, vat ? "metal" : "stone")));
      body.name = "chem-obstacle-body"; body.userData.occlusionGroup = body.uuid;
      if (!vat) {
        const cap = occluder(mesh(new THREE.BoxGeometry(w, .06, d), mat(0x7a826c, "roof-metal"), g, 0, .77, 0, false));
        cap.name = "chem-block-cap"; cap.userData.occlusionGroup = body.uuid;
      }
      const detail = chemDetailGroup(vat ? "chem-vat-fittings" : "chem-block-fittings", new THREE.Vector3(),
        emit => vat ? appendChemVatDetails(w, d, rect.x + rect.y, emit) : appendChemBlockDetails(w, d, emit), g);
      for (const part of detail.children) part.userData.occlusionGroup = body.uuid;
      return;
    }
    if (id === "drain" && (rect.kind === "pipe" || rect.kind === "valve" || rect.kind === "toilet" || rect.kind === "block")) {
      g.name = "drain-obstacle-detail"; g.userData.sourceRect = rect;
      let body: THREE.Mesh;
      if (rect.kind === "pipe" || rect.kind === "valve") {
        body = mesh(new THREE.CylinderGeometry(Math.min(w, d) * .48, Math.min(w, d) * .48, Math.max(w, d), 12), mat(0x68756a, "metal"), g, 0, .7, 0);
        body.rotation.z = w > d ? Math.PI / 2 : 0; if (d > w) body.rotation.x = Math.PI / 2;
      } else {
        body = box(g, w, rect.kind === "toilet" ? .78 : .75, d, mat(rect.kind === "toilet" ? 0x938d75 : palette.stone, "stone"));
        // Source pump plinths were hidden in the water walls; keep their new view cheap.
        if (rect.kind === "block") body.castShadow = false;
      }
      body.name = "drain-obstacle-body"; occluder(body); body.userData.occlusionGroup = body.uuid;
      if (rect.kind === "block") {
        const cap = occluder(mesh(new THREE.BoxGeometry(w, .06, d), mat(0x738981, "roof-metal"), g, 0, .77, 0, false));
        cap.name = "drain-block-cap"; cap.userData.occlusionGroup = body.uuid;
      }
      const detail = drainDetailGroup("drain-obstacle-fittings", new THREE.Vector3(),
        emit => appendDrainObstacleDetails(w, d, rect.kind as "pipe" | "valve" | "toilet" | "block", emit), g);
      for (const part of detail.children) part.userData.occlusionGroup = body.uuid;
      return;
    }
    if (id === "cable" && rect.kind === "rack") {
      g.name = "cable-rack-detail"; g.userData.sourceRect = rect;
      const parts = cableParts(g, emit => appendCableRackDetails(w, d, rect.h >= 70 ? 2.9 : .8, rect.x + rect.y, emit));
      const body = parts.find(part => part.name === "cable-rack:shell")!;
      for (const part of parts) part.userData.occlusionGroup = body.uuid;
    } else if (id === "cable" && rect.kind === "ember") {
      g.name = "cable-live-detail"; g.userData.sourceRect = rect;
      cableParts(g, emit => appendCableLiveDetails(w, d, emit), false);
    } else if (rect.kind === "rack") {
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
      if (id === "ash") {
        g.name = "ash-block-detail"; g.userData.sourceRect = rect;
        const cap = occluder(mesh(new THREE.BoxGeometry(w, .06, d), mat(0x746c61, "roof-metal"), g, 0, h + .02, 0, false));
        cap.name = "ash-block-cap";
        const detail = ashDetailGroup("ash-block-fittings", new THREE.Vector3(), emit => appendAshBoundaryDetails(w, d, h, rect.x + rect.y, emit), g);
        m.userData.occlusionGroup = cap.userData.occlusionGroup = m.uuid;
        for (const part of detail.children) part.userData.occlusionGroup = m.uuid;
      }
    }
  }

  function buildFloor() {
    const decorations: StaticDecoration[] = [];
    const w = active.w * WORLD_SCALE, d = active.h * WORLD_SCALE;
    box(root, w + .25, .45, d + .25, mat(palette.dark, "stone"), 0, -.27);
    const indoor = getDistrictGraphics(id).wetness < .15;
    const floor = mesh(new THREE.PlaneGeometry(w, d), mat(id === "capsule" ? 0x8a7760 : id === "scrap" ? 0x655e51 : id === "nische" ? 0x655a63 : id === "labyrinth" ? 0x656171 : id === "ring" ? 0x65665d : id === "chem" ? 0x5b6554 : id === "drain" ? 0x536a69 : id === "ash" ? 0x60564d : id === "cable" ? 0x43575a : id === "market" ? 0x586567 : indoor ? 0x697378 : id === "yard" ? 0x4b594e : 0x65727b, id === "capsule" ? "wood" : indoor || id === "cable" || id === "market" || id === "kai" || id === "sewer" || id === "ash" || id === "drain" || id === "chem" || id === "ring" || id === "labyrinth" || id === "nische" || id === "scrap" ? "stone" : "asphalt"), root, 0, .002, 0);
    floor.rotation.x = -Math.PI / 2;
    const sketch = mapSketch(id);
    if (!active.indoor) for (const r of sketch.walk) {
      const m = region(r, .045, mat(id === "scrap" ? 0x766e60 : id === "yard" ? 0x637263 : id === "ash" ? 0x7c7265 : id === "market" ? 0x6d7169 : 0x788487, "stone"), .007);
      m.name = "original-walkway";
    }
    for (const { r, fill } of sketch.extras) {
      const water = id === "drain" || (id === "kai" && r.y === 220);
      const color = new THREE.Color(fill);
      const m = region(r, .025, mat(id === "scrap" ? 0x514637 : id === "nische" ? 0x604452 : id === "labyrinth" ? 0x4e485d : color.lerp(new THREE.Color(water ? 0x1c3945 : 0x3c5146), .7), water ? "metal" : id === "nische" ? "plaster" : "stone"), .025);
      if (id === "labyrinth") { m.name = "labyrinth-shade-floor"; m.userData.sourceRect = r; m.castShadow = false; }
      if (id === "nische") { m.name = "nische-rug-floor"; m.userData.sourceRect = r; m.castShadow = false; }
      if (id === "scrap") { m.name = "scrap-yard-infill"; m.userData.sourceRect = r; m.castShadow = false; }
      if (id === "kai") m.name = water ? "kai-water" : "kai-transfer-pad";
      if (id === "drain") { m.name = "drain-water"; m.userData.sourceRect = r; m.castShadow = false; }
      if (water) { const material = m.material as THREE.MeshPhysicalMaterial; material.roughness = .15; material.clearcoat = .9; }
      if (id === "alley" || id === "yard") {
        const amount = Math.min(55, Math.round(r.w * r.h / 1000));
        for (let i = 0; i < amount; i++) {
          const p = at(r.x + seeded(i + r.x) * r.w, r.y + seeded(i + r.y + 8) * r.h);
          p.y = .17;
          decorations.push({ kind: "grass", position: p, height: .26 + seeded(i) * .22, lean: (seeded(i + 22) - .5) * .4 });
        }
      }
    }
    // Irregular clearcoat patches preserve the masonry below and reflect the HDR lamps.
    if (getDistrictGraphics(id).wetness > .25) for (let i = 0; i < 32; i++) {
      const r = sketch.walk[i % Math.max(1, sketch.walk.length)]; if (!r) continue;
      const p = at(r.x + seeded(i + 712) * r.w, r.y + seeded(i + 309) * r.h);
      const size = .9 + seeded(i) * 2.5;
      p.y = .058;
      decorations.push({ kind: "puddle", position: p, size, angle: seeded(i + 69) * Math.PI, stretch: .35 + seeded(i + 69) * .5 });
    }
    if (id === "kino") {
      const carpet = region({ x: 20, y: 108, w: 680, h: 72 }, .012, mat(0x493b45, "plaster"), .031);
      carpet.name = "kino-aisle-carpet"; carpet.castShadow = false;
      for (const [x, y] of [[28, 142], [52, 150]]) {
        const p = at(x, y); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.15, angle: .3, stretch: .4 });
      }
    }
    if (id === "sewer") {
      floor.name = "sewer-service-floor";
      const hatches = active.objs.filter(obj => obj.kind === "manhole");
      for (const [index, hatch] of hatches.entries()) {
        const p = at(hatch.x + hatch.w + 13, hatch.y + hatch.h + 18); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.7, angle: .3, stretch: .4 });
        const drain = new THREE.Group(); drain.name = "sewer-drain-detail";
        drain.position.copy(at(hatch.x + hatch.w / 2, 302)); root.add(drain);
        sewerParts(drain, emit => appendSewerDrainDetails(5.4, .9, index, emit), false, 3);
      }
    }
    if (id === "alley") decorations.push(...alleyRunoffPuddles(active, at));
    if (id === "scrap") {
      floor.name = "scrap-damp-paving";
      for (const [index, rect] of SCRAP_RUST.entries()) {
        const group = scrapDetailGroup("scrap-rust-detail", at(rect.x + rect.w / 2, rect.y + rect.h / 2),
          emit => appendScrapRustDetails(rect.w * WORLD_SCALE, rect.h * WORLD_SCALE, index, emit), root, false);
        group.userData.sourceRect = rect;
      }
      // Source bin scb1 is inside a blocked pile; runoff stays on the open original paving.
      for (const [x, y] of [[196, 728], [1220, 760], [68, 430]]) {
        const p = at(x, y); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.3, angle: .3, stretch: .4 });
      }
    }
    if (id === "nische") {
      floor.name = "nische-damp-paving";
      for (const [index, rect] of NISCHE_PINK.entries()) {
        const group = nischeDetailGroup("nische-floor-detail", at(rect.x + rect.w / 2, rect.y + rect.h / 2),
          emit => appendNischeFloorDetails(rect.w * WORLD_SCALE, rect.h * WORLD_SCALE, index, emit), root, false);
        group.userData.sourceRect = rect;
      }
      for (const bin of active.objs.filter(obj => obj.kind === "bin")) {
        const p = at(bin.x + bin.w / 2, bin.y + bin.h + 12); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.3, angle: .3, stretch: .4 });
      }
    }
    if (id === "labyrinth") {
      floor.name = "labyrinth-damp-paving";
      for (const [index, rect] of LAB_SHADE.entries()) {
        const group = labyrinthDetailGroup("labyrinth-shade-detail", at(rect.x + rect.w / 2, rect.y + rect.h / 2),
          emit => appendLabyrinthShadeDetails(rect.w * WORLD_SCALE, rect.h * WORLD_SCALE, index, emit), root, false);
        group.userData.sourceRect = rect;
      }
      for (const bin of active.objs.filter(obj => obj.kind === "bin")) {
        const p = at(bin.x + bin.w / 2, bin.y + bin.h + 12); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.3, angle: .3, stretch: .4 });
      }
    }
    if (id === "ring") {
      floor.name = "ring-rain-paving";
      const arena = active.deco?.[0];
      if (arena) {
        const position = at(arena.x + arena.w / 2, arena.y + arena.h / 2);
        // The ordinary box helper clamps to 15 mm; this thin layer must stay below the chalk.
        const canvas = mesh(new THREE.BoxGeometry(arena.w * WORLD_SCALE, .006, arena.h * WORLD_SCALE),
          mat(0x4f4c45, "plaster"), root, position.x, .038, position.z, false);
        canvas.name = "ring-arena-floor"; canvas.userData.sourceRect = arena; canvas.castShadow = false;
      }
      for (const [index, rect] of RING_CHALK.entries()) {
        const group = ringDetailGroup("ring-floor-markings", at(rect.x + rect.w / 2, rect.y + rect.h / 2),
          emit => appendRingFloorDetails(rect.w * WORLD_SCALE, rect.h * WORLD_SCALE, index, emit), root, false);
        group.userData.sourceRect = rect;
      }
      for (const bin of active.objs.filter(obj => obj.kind === "bin")) {
        const p = at(bin.x + bin.w / 2, bin.y + bin.h + 12); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.3, angle: .3, stretch: .4 });
      }
    }
    if (id === "chem") {
      floor.name = "chem-rain-paving";
      for (const bin of active.objs.filter(obj => obj.kind === "bin")) {
        const p = at(bin.x + bin.w / 2, bin.y + bin.h + 14); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.3, angle: .3, stretch: .4 });
      }
      for (const vat of CHEM_VATS) {
        const group = chemDetailGroup("chem-vat-markings", at(vat.x + vat.w / 2, vat.y + vat.h / 2),
          emit => appendChemVatMarkings(vat.w * WORLD_SCALE, vat.h * WORLD_SCALE, emit), root, false);
        group.userData.sourceRect = vat;
      }
    }
    if (id === "drain") {
      floor.name = "drain-rain-paving";
      for (const bin of active.objs.filter(obj => obj.kind === "bin")) {
        const p = at(bin.x + bin.w / 2, bin.y + bin.h + 10); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.3, angle: .3, stretch: .4 });
      }
    }
    if (id === "ash") {
      floor.name = "ash-rain-paving";
      const facades = active.walls.filter(r => !ASH_HOT.includes(r) && r.w >= 56 && r.h >= 56
        && r.x > 0 && r.y > 0 && r.x + r.w < active.w && r.y + r.h < active.h);
      // Runoff lies on existing paving outside each solid, clear of the hot beds.
      for (const r of facades) {
        const p = r.h > r.w ? at(r.x < active.w / 2 ? r.x + r.w + 12 : r.x - 12, r.y + r.h / 2)
          : at(r.x + r.w / 2, r.y > active.h * .75 ? r.y - 12 : r.y + r.h + 12);
        p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.6, angle: .3, stretch: .4 });
      }
    }
    if (id === "kai") {
      floor.name = "kai-rain-paving";
      for (const [x, y] of [[130, 52], [460, 52], [700, 64], [861, 133], [100, 160]]) {
        const p = at(x, y); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.5, angle: .25, stretch: .45 });
      }
    }
    if (id === "market") {
      floor.name = "market-rain-paving";
      // Runoff stays on the existing paving, below roof outlets and beside awnings.
      const fronts = active.walls.filter(r => r.x > 0 && r.y > 0 && r.x + r.w < active.w && r.y + r.h < active.h);
      const positions = fronts.map(r => at(r.x + r.w - 5, r.y + r.h + 12));
      positions.push(...active.objs.filter(obj => obj.kind === "stall").map(obj => at(obj.x + obj.w / 2 + 20, obj.y + obj.h / 2 + 30)));
      for (const p of positions) {
        p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.5, angle: .2, stretch: .4 });
      }
    }
    if (id === "cable") {
      floor.name = "cable-service-floor";
      for (const bin of active.objs.filter(obj => obj.kind === "bin")) {
        const p = at(bin.x + bin.w / 2, bin.y + bin.h + 12); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.6, angle: .35, stretch: .45 });
      }
      const strips: THREE.BufferGeometry[] = [];
      // Painted service-lane edges follow existing walk rectangles; no raised curbs/collision.
      for (const r of sketch.walk) {
        const p = at(r.x + r.w / 2, r.y + r.h / 2), width = r.w * WORLD_SCALE, depth = r.h * WORLD_SCALE;
        for (const sign of [-1, 1]) {
          const strip = new THREE.BoxGeometry(width > depth ? width - .4 : .07, .008, width > depth ? .07 : depth - .4);
          strip.translate(p.x + (width > depth ? 0 : sign * (width / 2 - .18)), .049, p.z + (width > depth ? sign * (depth / 2 - .18) : 0)); strips.push(strip);
        }
      }
      const geometry = mergeGeometries(strips, false); for (const strip of strips) strip.dispose();
      if (geometry) { const markings = mesh(geometry, mat(0x9a8758, "plaster"), root, 0, 0, 0, false); markings.name = "cable-route-markings"; }
    }
    if (id === "yard") {
      // The original nonblocking green patches remain walkable; no new planters/collision.
      for (const [index, r] of (active.deco ?? []).entries()) {
        const soil = region(r, .012, mat(0x394936, "plaster"), .036);
        soil.name = "yard-ground-cover";
        const count = index === 0 ? 12 : 24;
        for (let i = 0; i < count; i++) {
          const p = at(r.x + 8 + seeded(i + index * 57) * (r.w - 16), r.y + 8 + seeded(i + index * 19 + 91) * (r.h - 16));
          const height = .23 + seeded(i + 56) * .27; p.y = .04 + height / 2;
          decorations.push({ kind: "grass", position: p, height, lean: (seeded(i + 29) - .5) * .5 });
        }
      }
      for (const r of active.walls.filter(r => r.x > 0 && r.y > 0 && r.x + r.w < active.w && r.y + r.h < active.h)) {
        const p = at(r.x + r.w - 5, r.y + r.h + 7); p.y = .059;
        decorations.push({ kind: "puddle", position: p, size: 1.6, angle: .3, stretch: .4 });
      }
    }
    staticBatches = createStaticBatches(root, decorations, { grass: mat(0x586c3d), puddle: puddleMaterial }, performanceMode);
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
    if (id === "drain") {
      // These two original obstacle plinths sit inside water instead of duplicating a wall.
      for (const obstacle of active.obstacles ?? []) if (obstacle.kind === "block"
        && !active.walls.some(wall => sameRect(wall, obstacle))) renderObstacle(obstacle);
    }
    if (id === "market") {
      // Decorate the fixed counters separately: NPC rigs, children and animation stay intact.
      for (const obj of active.objs.filter(obj => obj.kind === "stall" || obj.kind === "shop")) {
        const group = marketDetailGroup("market-stall-detail", at(obj.x + obj.w / 2, obj.y + obj.h / 2),
          emit => appendMarketStallDetails(obj.stall ?? "silk", emit));
        group.userData.sourceObject = obj;
      }
    }
    if (id === "kai") {
      const water = new THREE.Group(); water.name = "kai-water-detail";
      water.position.copy(at(480, 292)); root.add(water);
      kaiParts(water, emit => appendKaiWater(928 * WORLD_SCALE, 144 * WORLD_SCALE, emit), false);
      kaiLitter = createKaiLitter(root, at, { glass: mat(0x426c60, "metal"), metal: mat(0x788080, "metal"),
        rubber: mat(0x283236), cardboard: mat(0x8a7657, "wood") });
    }
    if (id === "kino") {
      const screen = kinoDetailGroup("kino-screen-detail", at(360, 58), appendKinoScreenDetails);
      const backing = occluder(mesh(new THREE.BoxGeometry(33, 3.9, .3), mat(0x182a27), screen, 0, 2.1, 0, false));
      backing.name = "kino-screen-backing";
      const panel = occluder(mesh(new THREE.BoxGeometry(31.5, 3.3, .05), mat(0x55796e, undefined, 0x21483b), screen, 0, 2.1, .19, false));
      panel.name = "kino-screen-panel";
      const title = tag(screen, "420MON · KIEZKINO", 13, 2.1, "#d0c499", .23);
      // The tag owns its texture; only ordinary PBR meshes use cloned fade materials.
      occluders.push(title);
      for (const part of [backing, panel, title]) part.userData.occlusionGroup = screen.uuid;
      kinoLitter = createKinoLitter(root, at, { metal: mat(0x8a9691, "metal"), rubber: mat(0x29312f), paper: mat(0xb8aa8f, "plaster") });
    } else if (id.startsWith("den_")) {
      const couch = new THREE.Group(); couch.position.copy(at(200, 52)); root.add(couch);
      box(couch, 8.8, .6, 2.8, mat(0x666757, "plaster"));
      box(couch, 8.8, .8, .4, mat(0x515a4b, "plaster"), 0, 1, -1.3);
      const table = new THREE.Group(); table.position.copy(at(230, 132)); root.add(table);
      box(table, 1.7, .1, 1.35, mat(palette.wood, "wood"), 0, .67);
      box(table, .12, .63, .12, mat(palette.dark), 0, .315);
      lamp(root, -5.2, 2.6, -4.5, 0xeeb473, 16);
      if (id === "den_moss") {
        const firstPart = occluders.length;
        yardDetailGroup("moss-interior-detail", new THREE.Vector3(), emit => appendMossInteriorDetails(active.w * WORLD_SCALE, active.h * WORLD_SCALE, emit));
        const northWall = occluders.find(part => part.name === "original-wall:0");
        if (northWall) for (const part of occluders.slice(firstPart)) part.userData.occlusionGroup = northWall.uuid;
      }
      if (id === "den_silk" || id === "den_static") {
        const firstPart = occluders.length;
        marketDetailGroup("market-interior-detail", new THREE.Vector3(), emit =>
          appendMarketInteriorDetails(active.w * WORLD_SCALE, active.h * WORLD_SCALE, id === "den_silk" ? "silk" : "static", emit));
        const northWall = occluders.find(part => part.name === "original-wall:0");
        if (northWall) for (const part of occluders.slice(firstPart)) part.userData.occlusionGroup = northWall.uuid;
      }
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
    for (const actor of npcActors.values()) actor.dispose(); npcActors.clear();
    staticBatches?.dispose(); staticBatches = undefined;
    streetDetails?.dispose(); streetDetails = undefined;
    kinoLitter?.dispose(); kinoLitter = undefined;
    kaiLitter?.dispose(); kaiLitter = undefined;
    animatedLamps.length = 0; sewerDetailGroups.length = 0;
    disposeOwnedObjects(root);
    root.clear(); mapObjects.clear(); roamingNpc = undefined; storyNpcs.clear(); occluders = []; lampLights.length = 0; lastLightSelection = -Infinity; glowing.length = 0;
  }
  function removeMapObject(objectId: string) {
    const group = mapObjects.get(objectId);
    if (group) {
      npcActors.get(objectId)?.dispose(); npcActors.delete(objectId);
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
  function syncRemovedObjects() {
    const save = getSave();
    for (const obj of active.objs) {
      if (!isDefeatedGate(obj, save.deadWild) && !isTakenStarter(obj, save.starterId)) continue;
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
    // Opaque coated green glass avoids an extra transparency pass for tiny bottles.
    const streetGlass = mat(0x396755, "metal");
    streetGlass.metalness = .04; streetGlass.roughness = .2; streetGlass.clearcoat = .9;
    streetDetails = createStreetDetails(root, active, {
      glass: streetGlass, metal: mat(0x8a9691, "metal"),
      rubber: mat(0x29312f), cardboard: mat(0x9a8055, "plaster"),
    });
    const desired = x !== undefined && y !== undefined ? { x, y }
      : id === "capsule" ? { x: CAPSULE_SPAWN_X, y: CAPSULE_SPAWN_Y }
      : id === "studio" ? { x: 440, y: 140 }
      : id === "alley" ? { x: 80, y: 740 }
      : (() => {
        const exit = active.objs.find(o => o.kind === "door" || o.kind === "manhole");
        return exit ? { x: exit.x + exit.w / 2, y: exit.y + exit.h / 2 } : { x: active.w / 2, y: active.h / 2 };
      })();
    const spawn = safeSpawn(active, desired.x, desired.y, .48, progress.deadWild, progress.starterId);
    player.position.copy(at(spawn.x, spawn.y)); player.rotation.y = 0;
    streetDetails.update(player.position); updateSewerDetails();
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
      ".systems-panel:not([hidden]), .grow-backdrop:not([hidden]), .monster-battle:not([hidden]),.monster-collection:not([hidden]), .home-dialog:not([hidden]), .fish-overlay:not([hidden]),.achievement-overlay:not([hidden]),.monster-model-overlay:not([hidden]), .story-overlay:not([hidden]), .radio-overlay:not([hidden]), .support-overlay:not([hidden]),.slot-overlay:not([hidden]), .performance-overlay:not([hidden]), .studio-panel.is-open"
    );
  }
  function closestInteraction() {
    const p = sourcePosition();
    let best: MapObj | undefined, closest = 1.9;
    const save = getSave();
    for (const object of active.objs) {
      if (object.kind === "wild" || object.kind === "sign" || isDefeatedGate(object, save.deadWild) || isTakenStarter(object, save.starterId)) continue;
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
    for (const fixture of animatedLamps) {
      const factor = lampFlicker(fixture.seed, time / 1000);
      fixture.light.intensity = fixture.intensity * factor; fixture.emitter.emissiveIntensity = fixture.emissive * factor;
      if (fixture.pool) fixture.pool.opacity = .19 * factor;
    }
    const actorDt = Math.min(.05, Math.max(0, (time - lastActorTime) / 1000)); lastActorTime = time;
    for (const actor of npcActors.values()) actor.update(actorDt, player.position);
    root.userData.riggedNpcs = [...mapObjects.values()].filter(group => group.userData.npcModel === "rocketbox-rigged").length;
    if (time - lastLightSelection > 350) {
      lastLightSelection = time;
      streetDetails?.update(player.position); updateSewerDetails();
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
  window.addEventListener("420mon-save-changed", syncRemovedObjects);
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
    collides: (x, z, radius = .48) => collidesOnMap(active, x, z, radius, getSave().deadWild, getSave().starterId),
    getOccluders: () => occluders,
    getMapInfo: () => ({ id, name: active.name, map: active, w: active.w, h: active.h, scale: WORLD_SCALE,
      bounds: { minX: -active.w * WORLD_SCALE / 2, maxX: active.w * WORLD_SCALE / 2, minZ: -active.h * WORLD_SCALE / 2, maxZ: active.h * WORLD_SCALE / 2 }, player: sourcePosition() }),
    getRoot: () => root, toWorld: at,
    setPerformanceMode: enabled => { performanceMode = enabled; staticBatches?.setOptimized(enabled); },
    getPerformanceStats: () => staticBatches?.getStats() ?? { optimized: performanceMode, objects: 0, baselineDraws: 0, optimizedDraws: 0, activeDraws: 0, cellSize: 16 },
    setInteractionHandler: fn => { interaction = fn; },
    setRoamingNpc, setStoryNpcs,
  };
}
