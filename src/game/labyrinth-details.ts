import * as THREE from "three";

export type LabyrinthFinish = "stone" | "metal" | "rust" | "dark" | "paper" | "violet" | "glow" | "wood";
export type LabyrinthDetailEmitter = (finish: LabyrinthFinish, geometry: THREE.BufferGeometry, feature: string) => void;
type Point = [number, number, number];

function box(emit: LabyrinthDetailEmitter, finish: LabyrinthFinish, feature: string, size: Point, position: Point) {
  const geometry = new THREE.BoxGeometry(...size);
  geometry.translate(...position); emit(finish, geometry, feature);
}
function rod(emit: LabyrinthDetailEmitter, finish: LabyrinthFinish, feature: string, a: Point, b: Point, radius = .018) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  if (delta.lengthSq() < 1e-8) return;
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), 6);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); emit(finish, geometry, feature);
}

/** One local +Z wall face, with shallow fittings clear of the original narrow aisles. */
export function appendLabyrinthWallDetails(w: number, d: number, h: number, seed: number, emit: LabyrinthDetailEmitter) {
  const z = d / 2, bays = Math.max(1, Math.min(7, Math.floor(w / 2.3))), bay = w / bays;
  box(emit, "dark", "damp-plinth", [w, .16, .025], [0, .13, z + .016]);
  box(emit, "metal", "cap-flashing", [w, .05, .08], [0, h + .087, z + .027]);
  box(emit, "dark", "cap-channel", [w, .018, .038], [0, h + .12 - .009, z + .043]);
  rod(emit, "metal", "service-conduit", [-w / 2 + .06, Math.max(.35, h - .21), z + .066],
    [w / 2 - .06, Math.max(.35, h - .21), z + .066], .021);
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (i + .5) * bay, width = Math.min(1.45, bay * .72);
    box(emit, "stone", "plaster-repairs", [width, Math.min(.31, h * .32), .024], [x, .36, z + .016]);
    box(emit, "metal", "conduit-clamps", [.05, .1, .084], [x, Math.max(.35, h - .21), z + .05]);
    if (h < 1.5 || bay < .65) continue;
    const windowY = h - .52;
    box(emit, "dark", "clerestory-surrounds", [width, .39, .04], [x, windowY, z + .026]);
    box(emit, (seed + i) % 3 === 0 ? "glow" : "dark", "clerestory-panes", [width - .1, .29, .016], [x, windowY, z + .055]);
    for (const mx of [-.23, .23]) box(emit, "metal", "window-bars", [.022, .35, .026], [x + mx * width, windowY, z + .075]);
    box(emit, "metal", "window-sills", [width + .06, .045, .1], [x, windowY - .22, z + .055]);
    if ((seed + i) % 3 === 0) {
      box(emit, "dark", "shutter-frame", [width, .85, .04], [x, .92, z + .025]);
      for (let row = 0; row < 7; row++) box(emit, "metal", "corridor-shutters", [width - .08, .08, .027], [x, .58 + row * .112, z + .06]);
      box(emit, "metal", "shutter-handles", [Math.min(.21, width * .4), .035, .035], [x, .91, z + .089]);
    } else if ((seed + i) % 3 === 1) {
      box(emit, "dark", "vent-recesses", [width * .85, .44, .04], [x, 1.02, z + .025]);
      for (let row = 0; row < 4; row++) box(emit, "metal", "vent-grilles", [width * .78, .04, .035], [x, .86 + row * .105, z + .065]);
      box(emit, "metal", "runoff-streaks", [width * .15, .28, .014], [x + width * .18, .62, z + .023]);
    } else {
      const pw = Math.min(.43, width * .75);
      box(emit, "dark", "notice-backing", [pw + .05, .58, .022], [x, 1.04, z + .025]);
      box(emit, "paper", "corridor-notices", [pw, .52, .012], [x, 1.04, z + .044]);
      box(emit, "glow", "notice-heading", [pw * .82, .06, .008], [x, 1.22, z + .056]);
      for (let line = 0; line < 3; line++) box(emit, "dark", "notice-lines", [pw * (.76 - line * .1), .016, .008], [x, 1.06 - line * .07, z + .056]);
    }
  }
  if (h < 1.5 || w < .9) return;
  const inset = Math.min(.22, w * .18);
  for (const sign of [-1, 1]) {
    const x = sign * (w / 2 - inset);
    rod(emit, "metal", "drain-pipes", [x, .18, z + .067], [x, h - .24, z + .067], .027);
    for (const y of [.38, h - .43]) box(emit, "metal", "drain-clamps", [.085, .035, .09], [x, y, z + .05]);
  }
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-w / 2 + inset, h - .13, z + .061),
    new THREE.Vector3(0, h - .27, z + .071),
    new THREE.Vector3(w / 2 - inset, h - .13, z + .061),
  ]);
  emit("dark", new THREE.TubeGeometry(curve, 8, .012, 5, false), "sagging-cables");
  const stripW = Math.min(w * .45, 1.6);
  box(emit, "dark", "neon-casing", [stripW, .12, .055], [0, h - .075, z + .031]);
  box(emit, "glow", "violet-light-strip", [stripW - .1, .032, .016], [0, h - .075, z + .07]);
}

/** Open iron cages follow the whole source footprint; the trainer's source gap stays clear. */
export function appendLabyrinthFenceDetails(w: number, d: number, seed: number, emit: LabyrinthDetailEmitter) {
  const alongZ = d > w, length = Math.max(w, d), depth = Math.min(w, d);
  const panel: LabyrinthDetailEmitter = (finish, geometry, feature) => {
    if (alongZ) geometry.rotateY(Math.PI / 2);
    emit(finish, geometry, feature);
  };
  const halfL = length / 2 - .075, halfD = depth / 2 - .075;
  for (const sz of [-1, 1]) {
    const z = sz * halfD;
    for (const sx of [-1, 1]) {
      const x = sx * halfL;
      box(panel, "dark", "gate-post-feet", [.12, .055, .12], [x, .0275, z]);
      box(panel, "metal", "gate-posts", [.07, 1.5, .07], [x, .78, z]);
      box(panel, "rust", "gate-post-caps", [.1, .045, .1], [x, 1.5475, z]);
    }
    for (const y of [.29, 1.38]) box(panel, "dark", "gate-crossbars", [halfL * 2, .047, .055], [0, y, z]);
    const bars = Math.max(2, Math.floor(halfL * 2 / .22));
    for (let i = 1; i < bars; i++) box(panel, "metal", "iron-pickets", [.027, 1.22, .027], [-halfL + i * halfL * 2 / bars, .83, z]);
    const direction = (seed % 2 ? 1 : -1) * sz;
    rod(panel, "rust", "gate-braces", [-halfL + .1, direction > 0 ? .33 : 1.34, z], [halfL - .1, direction > 0 ? 1.34 : .33, z], .02);
  }
  for (const sx of [-1, 1]) {
    const x = sx * halfL;
    for (const y of [.29, 1.38]) box(panel, "dark", "gate-end-rails", [.055, .047, halfD * 2], [x, y, 0]);
    const bars = Math.max(1, Math.floor(halfD * 2 / .24));
    for (let i = 1; i < bars; i++) box(panel, "metal", "gate-end-pickets", [.027, 1.22, .027], [x, .83, -halfD + i * halfD * 2 / bars]);
  }
}

/** Fittings around the retained crate shell, with a low, closed wooden lid. */
export function appendLabyrinthCrateDetails(w: number, d: number, emit: LabyrinthDetailEmitter) {
  const planks = Math.max(2, Math.ceil(w / .22));
  for (let i = 0; i < planks; i++) box(emit, "wood", "crate-lid-planks", [w / planks - .012, .035, d - .055], [-w / 2 + (i + .5) * w / planks, .64, 0]);
  for (const sign of [-1, 1]) {
    box(emit, "metal", "crate-straps", [w - .05, .055, .03], [0, .18, sign * (d / 2 + .02)]);
    box(emit, "metal", "crate-straps", [w - .05, .055, .03], [0, .53, sign * (d / 2 + .02)]);
    for (const sx of [-1, 1]) {
      box(emit, "dark", "crate-corner-brackets", [.065, .5, .055], [sx * (w / 2 - .055), .35, sign * (d / 2 + .02)]);
      box(emit, "metal", "crate-rivets", [.025, .025, .012], [sx * (w / 2 - .055), .51, sign * (d / 2 + .055)]);
    }
  }
  box(emit, "paper", "crate-label", [Math.min(.32, w * .4), .19, .012], [0, .37, d / 2 + .029]);
  for (let line = 0; line < 3; line++) box(emit, "dark", "crate-label-lines", [Math.min(.25, w * .32) - line * .025, .013, .008], [0, .42 - line * .05, d / 2 + .041]);
}

/** Faint floor marks stay inset, flat and nonblocking in the four source shade zones. */
export function appendLabyrinthShadeDetails(w: number, d: number, seed: number, emit: LabyrinthDetailEmitter) {
  const margin = .3, stroke = .022;
  for (const sign of [-1, 1]) {
    box(emit, "violet", "shade-inset-lines", [w - margin * 2, .004, stroke], [0, .048, sign * (d / 2 - margin)]);
    box(emit, "violet", "shade-inset-lines", [stroke, .004, d - margin * 2], [sign * (w / 2 - margin), .048, 0]);
    box(emit, "stone", "shade-corner-marks", [.4, .004, .035], [sign * (w / 2 - .6), .048, -d / 2 + .47]);
  }
  for (let i = 0; i < 16; i++) {
    const x = ((i * 7 + seed * 3) % 17 / 17 - .5) * (w - 1.6);
    const z = ((i * 5 + seed * 2) % 19 / 19 - .5) * (d - 1.6);
    const crack = new THREE.BoxGeometry(.17 + (i % 4) * .07, .004, .018);
    crack.rotateY((i + seed) * .73); crack.translate(x, .046, z); emit("dark", crack, "floor-wear");
    if (i % 4 === 0) {
      const spur = new THREE.BoxGeometry(.13, .004, .016);
      spur.rotateY((i + seed) * .73 + .8); spur.translate(x + .04, .046, z + .035); emit("dark", spur, "floor-cracks");
    }
  }
}
