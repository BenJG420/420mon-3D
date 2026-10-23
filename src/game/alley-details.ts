import * as THREE from "three";
import type { MapDef } from "./data/maps";
import type { StaticDecoration } from "./static-batches";

export type AlleyFinish = "frame" | "stone" | "metal" | "brick" | "neon" | "leaf" | "paper" | "bag";
export type AlleyDetailEmitter = (finish: AlleyFinish, geometry: THREE.BufferGeometry, feature: string) => void;
const seeded = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

/** Own roof tiles; deterministic choice does not read or write save state. */
export function alleyRoofKind(variant: number): "roof-tile" | "roof-metal" | "roof-felt" {
  return (["roof-tile", "roof-metal", "roof-felt"] as const)[Math.abs(Math.floor(variant)) % 3];
}

function cuboid(emit: AlleyDetailEmitter, finish: AlleyFinish, feature: string,
  w: number, h: number, d: number, x: number, y: number, z: number, angle = 0) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  if (angle) geometry.rotateY(angle);
  geometry.translate(x, y, z); emit(finish, geometry, feature);
}

/** Small geometry submitted to the existing per-building material batches. */
export function appendAlleyBuildingDetails(w: number, d: number, h: number, seed: number, emit: AlleyDetailEmitter) {
  const box = (finish: AlleyFinish, feature: string, width: number, height: number, depth: number, x: number, y: number, z: number) => cuboid(emit, finish, feature, width, height, depth, x, y, z);
  // Raised channel lips give gutters actual depth without another surface texture.
  for (const sign of [-1, 1]) {
    box("metal", "gutters", w + .4, .055, .28, 0, h - .08, sign * (d / 2 + .15));
    box("metal", "gutters", w + .4, .14, .04, 0, h - .035, sign * (d / 2 + .28));
    box("frame", "gutters", w + .25, .018, .15, 0, h - .045, sign * (d / 2 + .15));
    box("metal", "roof-flashing", .15, .07, d + .5, sign * (w / 2 + .18), h + .39, 0);
    // Rear downpipes complement the original front pipework.
    const x = sign * (w / 2 - .42);
    box("metal", "downpipes", .12, h - .25, .12, x, h / 2, -d / 2 - .17);
    for (let y = .65; y < h; y += 1.7) box("frame", "downpipes", .24, .055, .15, x, y, -d / 2 - .15);
    box("metal", "downpipes", .12, .1, .42, x, .19, -d / 2 - .28);
  }
  // Low brick damp courses and vertical repairs read as masonry, not floor tiles.
  for (const sign of [-1, 1]) {
    box("brick", "brickwork", w - .6, .43, .075, 0, .39, sign * (d / 2 + .055));
    box("brick", "brickwork", .075, .43, d - .6, sign * (w / 2 + .055), .39, 0);
  }
  // Restrained shutters on upper windows: keep ground-level original door access clear.
  for (let side = 0; side < 4; side++) {
    const cross = side === 1 || side === 2, negative = side === 1 || side === 3;
    const length = cross ? d : w;
    const count = Math.min(cross ? 8 : 12, Math.max(cross ? 1 : 2, Math.floor(length / (cross ? 2.2 : 2.1))));
    const column = Math.floor(seeded(seed * 13 + side) * count);
    const u = -length / 2 + (column + .5) * length / count;
    const y = h >= 4.3 ? 2.85 : 1.2;
    // Only off-centre ground windows receive shutters, away from named house doors.
    if (y === 1.2 && Math.abs(u) < 1.3) continue;
    for (let slat = 0; slat < 7; slat++) {
      const x = cross ? (negative ? -1 : 1) * (w / 2 + .13) : u;
      const z = cross ? u : (negative ? -1 : 1) * (d / 2 + .13);
      box("metal", "shutters", cross ? .04 : .79, .085, cross ? .79 : .04, x, y - .29 + slat * .1, z);
    }
  }
  // A sagging service cable, conduit and junction box stay tight to the rear facade.
  const cableY = Math.min(h - .62, 3.15), rear = -d / 2 - .19;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-w / 2 + .5, cableY, rear),
    new THREE.Vector3(-w * .2, cableY - .27, rear - .02),
    new THREE.Vector3(w * .15, cableY - .19, rear - .02),
    new THREE.Vector3(w / 2 - .5, cableY + .05, rear),
  ]);
  emit("frame", new THREE.TubeGeometry(curve, 16, .026, 4, false), "cables");
  box("metal", "service-boxes", .48, .63, .2, w * .24, 1.61, rear);
  box("frame", "service-boxes", .035, 1.1, .035, w * .24, 2.45, rear - .04);
  for (let slot = 0; slot < 4; slot++) box("frame", "service-boxes", .28, .025, .025, w * .24, 1.43 + slot * .09, rear - .115);
  // Existing cool window material doubles as a narrow neon strip; no point lights.
  const neonLength = Math.min(3.2, w * .42);
  box("frame", "neon", neonLength + .18, .16, .13, -w * .2, h - .7, d / 2 + .12);
  box("neon", "neon", neonLength, .042, .025, -w * .2, h - .7, d / 2 + .197);
  // Sparse ivy at the rear corner adds depth, held out of all walkable routes.
  const vineX = -w / 2 + .2;
  box("frame", "vegetation", .028, Math.min(2.3, h - .7), .025, vineX, 1.2, rear);
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.SphereGeometry(.11, 5, 3);
    leaf.scale(1.35, .6, .32); leaf.rotateZ((seeded(seed + i) - .5) * 1.6);
    leaf.translate(vineX + (i % 2 ? .1 : -.1), .35 + i * .22, rear - .035);
    emit("leaf", leaf, "vegetation");
  }
}

/** Low litter hugs existing bin footprints; it never becomes a new gameplay object. */
export function appendAlleyBinDetails(emit: AlleyDetailEmitter, seed: number) {
  for (let i = 0; i < 2; i++) {
    const x = (i ? 1 : -1) * .69, z = -.21 + i * .29;
    const bag = new THREE.SphereGeometry(.27, 8, 6);
    bag.scale(1, .85, .86); bag.rotateY(seeded(seed + i) * Math.PI); bag.translate(x, .25, z);
    emit("bag", bag, "rubbish-bags");
    const tie = new THREE.ConeGeometry(.065, .12, 5); tie.translate(x, .49, z); emit("bag", tie, "rubbish-bags");
  }
  for (let i = 0; i < 5; i++) {
    const x = (seeded(seed * 11 + i) - .5) * 1.65, z = .6 + seeded(seed * 19 + i) * .42;
    cuboid(emit, "paper", "litter", .18 + seeded(i) * .14, .012, .12 + seeded(i + 2) * .09, x, .075, z, seeded(i + 31) * Math.PI);
  }
  for (let i = 0; i < 3; i++) {
    const can = new THREE.CylinderGeometry(.055, .055, .16, 7); can.rotateZ(1.35);
    can.translate(-.65 + i * .16, .1, .63 + seeded(seed + i) * .13); emit("metal", can, "cans");
  }
}

/** One extra wet runoff patch per original bin, batched by the v52 floor renderer. */
export function alleyRunoffPuddles(map: MapDef, toWorld: (x: number, y: number) => THREE.Vector3): StaticDecoration[] {
  if (map.id !== "alley") return [];
  return map.objs.filter(obj => obj.kind === "bin").map((obj, i) => {
    const position = toWorld(obj.x + obj.w / 2, obj.y + obj.h + 9); position.y = .059;
    return { kind: "puddle", position, size: 1.3 + seeded(i + 481) * .55, angle: seeded(i + 351) * Math.PI, stretch: .38 + seeded(i + 81) * .19 };
  });
}
