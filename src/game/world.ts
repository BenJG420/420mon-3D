import * as THREE from "three";
import { MAPS, mapSketch, CAPSULE_SPAWN_X, CAPSULE_SPAWN_Y, type MapDef, type MapObj, type Rect } from "./data/maps";
import { WORLD_SCALE, mapToWorld, worldToMap, collidesOnMap, safeSpawn } from "./worldGeometry";
import { getSave, saveProgress } from "./save";
import { stageOf } from "./data/progress";

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
  openShop: (fn: (obj?: MapObj) => void) => void;
  update: () => void;
  collides: (x: number, z: number, radius?: number) => boolean;
  getOccluders: () => THREE.Mesh[];
  getMapInfo: () => MapInfo;
  getRoot: () => THREE.Group;
  toWorld: (x: number, y: number) => THREE.Vector3;
  setInteractionHandler: (fn: (obj: MapObj, mapId: string) => void) => void;
};

const palette = {
  plaster: 0x888072, stone: 0x4a4941, wood: 0x594732, dark: 0x202826,
  brass: 0x9c8050, linen: 0xc0aa86, rust: 0x70513e, soil: 0x231c16,
  green: 0x507462, glow: 0xd7a459, blue: 0x638b96,
};
const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

/** Canvas textures stay local, so a public build has no private asset requests. */
function wornTexture(kind: "stone" | "wood" | "plaster" | "metal"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const base = kind === "stone" ? [95, 95, 87] : kind === "wood" ? [99, 76, 51] : kind === "plaster" ? [146, 140, 119] : [75, 81, 76];
  ctx.fillStyle = `rgb(${base.join(",")})`; ctx.fillRect(0, 0, 512, 512);
  if (kind === "stone") {
    for (let row = 0; row < 8; row++) for (let col = -1; col < 9; col++) {
      const jitter = seeded(row * 50 + col + 40) * 26 - 13;
      ctx.fillStyle = `rgb(${base.map(v => Math.round(v + jitter)).join(",")})`;
      const x = col * 64 + (row % 2) * 32;
      ctx.fillRect(x + 2, row * 64 + 2, 60, 60);
      ctx.strokeStyle = "rgba(195,191,162,.14)"; ctx.strokeRect(x + 3, row * 64 + 3, 58, 58);
    }
  } else if (kind === "wood") {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `rgba(18,13,6,${.14 + seeded(i) * .2})`; ctx.fillRect(i * 64, 0, 3, 512);
      for (let j = 0; j < 18; j++) {
        ctx.strokeStyle = j % 3 ? "rgba(33,21,10,.12)" : "rgba(186,149,92,.11)";
        ctx.beginPath(); ctx.moveTo(i * 64 + 5 + j * 3, 0);
        ctx.bezierCurveTo(i * 64 + j * 3 + 14, 200, i * 64 + j * 3 - 2, 360, i * 64 + j * 3 + 8, 512); ctx.stroke();
      }
    }
  }
  for (let i = 0; i < 2400; i++) {
    const x = seeded(i + 10) * 512, y = seeded(i + 6500) * 512;
    ctx.fillStyle = i % 2 ? "rgba(12,16,12,.06)" : "rgba(240,233,202,.055)";
    ctx.fillRect(x, y, 1 + seeded(i + 20) * 5, 1 + seeded(i + 30) * 3);
  }
  for (let i = 0; i < 26; i++) {
    const x = seeded(i + 730) * 512, y = seeded(i + 910) * 512;
    const radius = 4 + seeded(i + 1200) * 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, "rgba(24,30,18,.17)"); g.addColorStop(1, "rgba(24,30,18,0)");
    ctx.fillStyle = g; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const tex = new THREE.CanvasTexture(canvas); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.repeat.set(3, 3); return tex;
}

export function createDistrictWorld(scene: THREE.Scene, player: THREE.Group): DistrictTravel {
  const root = new THREE.Group(); root.name = "original-map-world"; scene.add(root);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const textures = { stone: wornTexture("stone"), wood: wornTexture("wood"), plaster: wornTexture("plaster"), metal: wornTexture("metal") };
  const mat = (color: THREE.ColorRepresentation, kind?: keyof typeof textures, emissive?: THREE.ColorRepresentation) => {
    const key = `${new THREE.Color(color).getHexString()}-${kind ?? ""}-${emissive === undefined ? "" : new THREE.Color(emissive).getHexString()}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
      color, map: kind ? textures[kind] : null, roughness: kind === "metal" ? .53 : .87,
      metalness: kind === "metal" ? .45 : .04, emissive: emissive ?? 0, emissiveIntensity: emissive ? .8 : 0,
    }));
    return materials.get(key)!;
  };
  let id = "capsule";
  let active = MAPS[id];
  let occluders: THREE.Mesh[] = [];
  let interaction: ((obj: MapObj, mapId: string) => void) | undefined;
  let shopFn: ((obj?: MapObj) => void) | undefined;
  let nearby: MapObj | undefined;
  let interactionMessage: { id: string; text: string; until: number } | undefined;
  let lamps = 0;
  let lastSave = 0;
  let lastPosition = { x: NaN, y: NaN };
  const glowing: { mesh: THREE.Mesh; phase: number }[] = [];

  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, x: number, y: number, z: number, shadow = true) {
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
    if (lamps++ < 5) {
      const light = new THREE.PointLight(color, strength, 11, 2); light.position.set(x, y - .2, z); parent.add(light);
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
    g.position.copy(at(obj.x + obj.w / 2, obj.y + obj.h / 2)); root.add(g); return g;
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
    if (obj.kind === "wild") return; // Monster renderer uses authentic species and these coordinates.
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
      const m = region(r, height, mat(outside ? new THREE.Color(building?.tone ?? "#686c5d").lerp(new THREE.Color(0x746c56), .62) : palette.plaster, "plaster"));
      m.name = `original-wall:${i}`; occluder(m);
      // Dark plinth and narrow cap keep the rooms readable as a cutaway diorama.
      region(r, .16, mat(palette.stone, "stone"), .08);
      region(r, .1, mat(outside ? 0x494c41 : 0xb29e76, "stone"), height + .02);
      if (outside && r.w > 100 && r.h > 80) {
        const group = new THREE.Group(); group.position.copy(at(r.x + r.w / 2, r.y + r.h / 2)); root.add(group);
        const w = r.w * WORLD_SCALE, d = r.h * WORLD_SCALE;
        const count = Math.min(12, Math.floor(w / 2.2));
        for (let row = 0; row < Math.floor(height / 1.8); row++) for (let j = 0; j < count; j++) {
          const x = -w / 2 + (j + .5) * w / count;
          box(group, .78, .88, .055, mat(0x1d2d28, undefined, (row + j + i) % 4 ? 0x4c4b28 : 0x1e413d), x, 1.25 + row * 1.7, d / 2 + .03);
          box(group, .82, .08, .14, mat(0xa39470), x, .78 + row * 1.7, d / 2 + .07);
        }
        if (w < 23 && d < 23) {
          box(group, w * .4, .7, d * .35, mat(0x424d43, "metal"), -w * .17, height + .48);
          for (let k = 0; k < 3; k++) box(group, .07, .18, d * .4, mat(0x796c54, "metal"), w * .15 + k * .23, height + .12);
        }
        if (building?.name) { const n = tag(group, building.name.toUpperCase(), Math.min(4, w * .8), 2.9, "#d7b778", d / 2 + .11); n.name = "house-name"; }
      }
    }
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
    const floor = mesh(new THREE.PlaneGeometry(w, d), mat(id === "capsule" || id === "studio" ? 0xc3b898 : id === "yard" ? 0x6d7453 : 0x898979, id === "capsule" ? "wood" : "stone"), root, 0, .002, 0);
    floor.rotation.x = -Math.PI / 2;
    const sketch = mapSketch(id);
    if (!active.indoor) for (const r of sketch.walk) {
      const m = region(r, .045, mat(id === "yard" ? 0x596d4d : 0x9c9987, "stone"), .007);
      m.name = "original-walkway";
    }
    for (const { r, fill } of sketch.extras) {
      const water = id === "drain" || id === "kai";
      const color = new THREE.Color(fill);
      const m = region(r, .025, mat(color.lerp(new THREE.Color(water ? 0x426c62 : 0x6d7246), .4), water ? "metal" : "stone"), .025);
      if (water) (m.material as THREE.MeshStandardMaterial).roughness = .24;
      if (id === "alley" || id === "yard") {
        const amount = Math.min(55, Math.round(r.w * r.h / 1000));
        for (let i = 0; i < amount; i++) {
          const p = at(r.x + seeded(i + r.x) * r.w, r.y + seeded(i + r.y + 8) * r.h);
          const leaf = mesh(new THREE.ConeGeometry(.1, .26 + seeded(i) * .22, 5), mat(0x586c3d), root, p.x, .17, p.z, false);
          leaf.rotation.z = (seeded(i + 22) - .5) * .4;
        }
      }
    }
    // Small irregular wet patches catch the warm lamps without adding colliders.
    if (!active.indoor || id === "cable") for (let i = 0; i < 24; i++) {
      const r = sketch.walk[i % Math.max(1, sketch.walk.length)]; if (!r) continue;
      const p = at(r.x + seeded(i + 712) * r.w, r.y + seeded(i + 309) * r.h);
      const material = new THREE.MeshStandardMaterial({ color: 0x2f463e, roughness: .17, metalness: .42, transparent: true, opacity: .32 }); material.userData.local = true;
      const puddle = mesh(new THREE.CircleGeometry(.2 + seeded(i) * .85, 9), material, root, p.x, .058, p.z, false);
      puddle.rotation.x = -Math.PI / 2; puddle.scale.y = .35 + seeded(i + 69) * .5;
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

  function disposeMap() {
    root.traverse(object => {
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
    root.clear(); occluders = []; lamps = 0; glowing.length = 0;
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
    saveLocation(); id = next; active = MAPS[id];
    disposeMap(); buildFloor(); buildWalls(); active.objs.forEach(renderObject); mapDetails();
    const desired = x !== undefined && y !== undefined ? { x, y }
      : id === "capsule" ? { x: CAPSULE_SPAWN_X, y: CAPSULE_SPAWN_Y }
      : id === "studio" ? { x: 440, y: 140 }
      : id === "alley" ? { x: 80, y: 740 }
      : (() => {
        const exit = active.objs.find(o => o.kind === "door" || o.kind === "manhole");
        return exit ? { x: exit.x + exit.w / 2, y: exit.y + exit.h / 2 } : { x: active.w / 2, y: active.h / 2 };
      })();
    const spawn = safeSpawn(active, desired.x, desired.y, .48);
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
      ".systems-panel:not([hidden]), .grow-backdrop:not([hidden]), .monster-battle:not([hidden]), .home-dialog:not([hidden]), .studio-panel.is-open"
    );
  }
  function closestInteraction() {
    const p = sourcePosition();
    let best: MapObj | undefined, closest = 1.9;
    for (const object of active.objs) {
      if (object.kind === "wild" || object.kind === "sign") continue;
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
    if ((obj.kind === "shop" || obj.kind === "stall") && shopFn) shopFn(obj);
    else if (interaction) interaction(obj, id);
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
  function update() {
    const time = performance.now();
    if (time - lastSave > 1800) { saveLocation(); lastSave = time; }
    nearby = closestInteraction();
    const overlay = overlayOpen();
    prompt.hidden = !nearby || overlay;
    if (nearby) {
      const action = nearby.door ? "BETRETEN" : nearby.kind === "pot" ? "PFLEGEN" : nearby.kind === "npc" || nearby.kind === "shop" || nearby.kind === "stall" ? "ANSPRECHEN" : "BENUTZEN";
      const reason = lockMessage(nearby);
      prompt.textContent = interactionMessage?.id === nearby.id && time < interactionMessage.until ? interactionMessage.text
        : `${reason ? "🔒 " : ""}${nearby.label.toUpperCase()} · ${action} [E]`;
      prompt.dataset.object = nearby.id;
    }
    for (const glow of glowing) (glow.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = .55 + Math.sin(time / 1800 + glow.phase) * .08;
  }
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
    openShop: fn => { shopFn = fn; }, update,
    collides: (x, z, radius = .48) => collidesOnMap(active, x, z, radius),
    getOccluders: () => occluders,
    getMapInfo: () => ({ id, name: active.name, map: active, w: active.w, h: active.h, scale: WORLD_SCALE,
      bounds: { minX: -active.w * WORLD_SCALE / 2, maxX: active.w * WORLD_SCALE / 2, minZ: -active.h * WORLD_SCALE / 2, maxZ: active.h * WORLD_SCALE / 2 }, player: sourcePosition() }),
    getRoot: () => root, toWorld: at,
    setInteractionHandler: fn => { interaction = fn; },
  };
}
