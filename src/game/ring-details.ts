import * as THREE from "three";

export type RingFinish = "stone" | "metal" | "rust" | "dark" | "red" | "cream" | "wood" | "glow";
export type RingDetailEmitter = (finish: RingFinish, geometry: THREE.BufferGeometry, feature: string) => void;
type Point = [number, number, number];

function box(emit: RingDetailEmitter, finish: RingFinish, feature: string, size: Point, position: Point) {
  const geometry = new THREE.BoxGeometry(...(size.map(value => Math.max(.004, value)) as Point));
  geometry.translate(...position); emit(finish, geometry, feature);
}
function rod(emit: RingDetailEmitter, finish: RingFinish, feature: string, a: Point, b: Point, radius = .025, sides = 8) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  if (delta.lengthSq() < 1e-8) return;
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), sides);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); emit(finish, geometry, feature);
}
function cable(emit: RingDetailEmitter, points: Point[]) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  emit("dark", new THREE.TubeGeometry(curve, 10, .019, 5, false), "service-cables");
}
function poster(emit: RingDetailEmitter, x: number, y: number, z: number) {
  box(emit, "dark", "poster-backing", [.4, .58, .025], [x, y, z]);
  box(emit, "cream", "fight-poster", [.34, .51, .012], [x, y, z + .02]);
  box(emit, "red", "poster-heading", [.26, .075, .009], [x, y + .16, z + .032]);
  for (let line = 0; line < 3; line++) box(emit, "dark", "poster-lines", [.23 - line * .035, .017, .009], [x, y - .01 - line * .075, z + .032]);
}

/** Worn gym/service fronts on the four faces of each retained building mass. */
export function appendRingFacadeDetails(w: number, d: number, h: number, seed: number, emit: RingDetailEmitter) {
  for (let side = 0; side < 4; side++) {
    const length = side % 2 ? d : w, depth = side % 2 ? w : d, z = depth / 2;
    const face: RingDetailEmitter = (finish, geometry, feature) => { geometry.rotateY(side * Math.PI / 2); emit(finish, geometry, feature); };
    const bays = Math.min(8, Math.max(1, Math.floor(length / 3.1))), bay = length / bays;
    box(face, "dark", "rain-darkened-plinth", [length, .19, .04], [0, .14, z + .022]);
    box(face, "stone", "roof-edge", [length, .14, .18], [0, h + .12, z]);
    box(face, "metal", "gutter", [length, .08, .18], [0, h - .025, z + .08]);
    box(face, "dark", "gutter-channel", [length, .02, .1], [0, h + .018, z + .105]);
    for (const sign of [-1, 1]) {
      const x = sign * (length / 2 - .24);
      rod(face, "rust", "downpipes", [x, .18, z + .13], [x, h - .03, z + .13], .047);
      for (const y of [.46, h * .5, h - .29]) box(face, "metal", "pipe-clamps", [.14, .035, .11], [x, y, z + .13]);
      box(face, "stone", "runoff-stains", [.17, .31, .018], [x, .22, z + .035]);
    }
    for (let i = 0; i < bays; i++) {
      const x = -length / 2 + (i + .5) * bay, width = Math.min(1.65, bay - .5);
      box(face, "stone", "repaired-masonry", [width * .9, .28, .035], [x, .42, z + .026]);
      const rows = h > 5.4 ? 2 : 1;
      for (let row = 0; row < rows; row++) {
        const y = 2.25 + row * 1.65, paneH = Math.min(.96, h - y - .4);
        if (paneH < .3) continue;
        box(face, "dark", "window-surrounds", [width + .14, paneH + .13, .08], [x, y, z + .04]);
        box(face, (i + row + side + seed) % 3 === 0 ? "glow" : "dark", "gym-windows", [width, paneH, .025], [x, y, z + .094]);
        box(face, "metal", "window-mullions", [.035, paneH, .04], [x, y, z + .121]);
        box(face, "metal", "window-mullions", [width, .035, .04], [x, y, z + .121]);
        box(face, "stone", "window-sills", [width + .22, .075, .2], [x, y - paneH / 2 - .08, z + .07]);
      }
      if ((i + side + seed) % 3 === 0) {
        box(face, "dark", "shutter-surround", [width + .12, 1.63, .08], [x, .96, z + .043]);
        for (let slat = 0; slat < 10; slat++) box(face, "metal", "roller-shutter", [width, .12, .04], [x, .27 + slat * .145, z + .104]);
        box(face, "dark", "shutter-handle", [.23, .04, .055], [x, .75, z + .151]);
        box(face, "red", "door-stripe", [width, .07, .015], [x, 1.45, z + .135]);
      } else if ((i + side) % 2 === 0) {
        box(face, "dark", "vent-recess", [width * .75, .53, .065], [x, 1.18, z + .04]);
        for (let slat = 0; slat < 5; slat++) box(face, "metal", "vent-louvres", [width * .7, .055, .06], [x, .99 + slat * .095, z + .1]);
      } else poster(face, x, 1.2, z + .065);
    }
    cable(face, [[-length / 2 + .28, h - .47, z + .12], [0, h - .7, z + .15], [length / 2 - .28, h - .47, z + .12]]);
    const signW = Math.min(2.5, length * .5);
    box(face, "dark", "gym-sign-casing", [signW, .23, .12], [0, h - .29, z + .065]);
    box(face, "red", "gym-sign-band", [signW - .1, .14, .018], [0, h - .29, z + .136]);
    box(face, "glow", "gym-neon", [signW - .23, .035, .02], [0, h - .29, z + .158]);
  }
}

/** Local +Z repairs, posters and conduit on short perimeter-wall chunks. */
export function appendRingBoundaryDetails(w: number, d: number, h: number, seed: number, emit: RingDetailEmitter) {
  const z = d / 2, bays = Math.min(10, Math.max(1, Math.ceil(w / 3.3))), bay = w / bays;
  box(emit, "dark", "wall-plinth", [w, .15, .035], [0, .14, z + .02]);
  box(emit, "metal", "wall-flashing", [w, .035, .12], [0, h + .076, z]);
  const pipeY = Math.max(.34, h - .27);
  rod(emit, "rust", "wall-conduit", [-w / 2 + .04, pipeY, z + .08], [w / 2 - .04, pipeY, z + .08], .035);
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (i + .5) * bay;
    box(emit, "stone", "wall-patches", [Math.min(1.3, bay * .8), Math.min(.28, h * .3), .03], [x, .35, z + .025]);
    box(emit, "metal", "conduit-brackets", [.07, .12, .1], [x, pipeY, z + .08]);
    if (h < 1.5 || bay < .7) continue;
    if ((i + seed) % 3 === 0) poster(emit, x, 1.25, z + .063);
    else if ((i + seed) % 3 === 1) {
      box(emit, "dark", "wall-light-housing", [.62, .12, .12], [x, h - .6, z + .065]);
      box(emit, "glow", "wall-light-strip", [.5, .035, .018], [x, h - .6, z + .138]);
    }
  }
}

/** Each original cage rectangle becomes one correctly oriented, see-through wire panel. */
export function appendRingFenceDetails(w: number, d: number, seed: number, emit: RingDetailEmitter) {
  const length = Math.max(w, d), depth = Math.min(w, d), alongZ = d > w;
  const panel: RingDetailEmitter = (finish, geometry, feature) => { if (alongZ) geometry.rotateY(Math.PI / 2); emit(finish, geometry, feature); };
  const bays = Math.min(8, Math.max(1, Math.ceil(length / 3.1))), start = -length / 2 + .08, end = length / 2 - .08;
  for (let i = 0; i <= bays; i++) {
    const x = start + i * (end - start) / bays;
    box(panel, "metal", "fence-foot", [.16, .08, Math.min(.2, depth - .04)], [x, .04, 0]);
    rod(panel, "metal", "fence-post", [x, .08, 0], [x, 1.55, 0], .045);
    box(panel, "metal", "post-cap", [.115, .035, .115], [x, 1.565, 0]);
    for (const y of [.24, 1.47]) box(panel, "rust", "fence-fasteners", [.04, .035, .026], [x, y, .055]);
    if (i === 0 || i === bays) {
      box(panel, "red", "corner-padding", [.13, .54, .17], [x, .88, 0]);
      for (const y of [.72, 1.04]) box(panel, "dark", "padding-straps", [.135, .035, .176], [x, y, 0]);
    } else if ((i + seed) % 2 === 0) box(panel, "rust", "post-repair-sleeve", [.11, .18, .11], [x, .52, 0]);
  }
  for (const y of [.22, 1.5]) rod(panel, "metal", "fence-crossbar", [start, y, 0], [end, y, 0], .035);
  const left = -length / 2 + .13, span = length - .26, low = .27, high = 1.44, rise = high - low;
  const step = Math.max(.42, (span + rise) / 58);
  // Clip both diagonal families to the panel, rather than constructing hundreds of diamonds.
  for (let offset = -rise; offset <= span; offset += step) {
    const x0 = Math.max(0, offset), x1 = Math.min(span, offset + rise);
    if (x1 <= x0) continue;
    rod(panel, "metal", "diamond-wire", [left + x0, low + x0 - offset, -.006], [left + x1, low + x1 - offset, -.006], .008, 6);
    rod(panel, "metal", "diamond-wire", [left + x0, high - x0 + offset, .006], [left + x1, high - x1 + offset, .006], .008, 6);
  }
}

/** Retained low blocks gain bench planks and rails above the separately supplied cap. */
export function appendRingBlockDetails(w: number, d: number, emit: RingDetailEmitter) {
  const length = Math.max(w, d), depth = Math.min(w, d), alongZ = d > w;
  const bench: RingDetailEmitter = (finish, geometry, feature) => { if (alongZ) geometry.rotateY(Math.PI / 2); emit(finish, geometry, feature); };
  const plankD = (depth - .16) / 3;
  for (let i = 0; i < 3; i++) box(bench, "wood", "bench-seat-planks", [length - .12, .04, plankD - .025], [0, .826, -depth / 2 + .08 + (i + .5) * plankD]);
  for (const sign of [-1, 1]) {
    const x = sign * (length / 2 - .16);
    rod(bench, "metal", "bench-back-supports", [x, .81, -depth / 2 + .09], [x, 1.24, -depth / 2 + .09], .025);
    for (const z of [-depth / 2 + .16, depth / 2 - .16]) box(bench, "rust", "bench-bolts", [.035, .015, .035], [x, .857, z]);
  }
  box(bench, "wood", "bench-backrest", [length - .18, .19, .045], [0, 1.1, -depth / 2 + .09]);
  rod(bench, "metal", "bench-top-rail", [-length / 2 + .16, 1.24, -depth / 2 + .09], [length / 2 - .16, 1.24, -depth / 2 + .09], .025);
}

/** Small crate fittings keep each existing interaction shell visible. */
export function appendRingCrateDetails(w: number, d: number, emit: RingDetailEmitter) {
  for (const sign of [-1, 1]) {
    for (const y of [.17, .42]) box(emit, "wood", "crate-planks", [w - .1, .07, .035], [0, y, sign * (d / 2 + .025)]);
    for (const x of [-w * .32, w * .32]) {
      box(emit, "metal", "crate-rivets", [.035, .035, .025], [x, .52, sign * (d / 2 + .05)]);
      box(emit, "metal", "crate-top-corners", [.1, .025, .1], [x, .65, sign * (d / 2 - .1)]);
    }
  }
  box(emit, "cream", "crate-stencil-card", [.31, .17, .012], [0, .36, d / 2 + .053]);
  for (let line = 0; line < 3; line++) box(emit, "dark", "crate-stencil-lines", [.23 - line * .035, .015, .008], [0, .405 - line * .045, d / 2 + .066]);
}

/** Chalk, corner paint and wear sit flat inside the original encounter rectangles. */
export function appendRingFloorDetails(w: number, d: number, seed: number, emit: RingDetailEmitter) {
  const margin = .2;
  for (const sign of [-1, 1]) {
    box(emit, "cream", "chalk-outline", [w - margin * 2, .004, .035], [0, .048, sign * (d / 2 - margin)]);
    box(emit, "cream", "chalk-outline", [.035, .004, d - margin * 2], [sign * (w / 2 - margin), .048, 0]);
  }
  if (seed === 0) {
    const radius = Math.min(w, d) * .18;
    const circle = new THREE.RingGeometry(radius - .035, radius, 48);
    circle.rotateX(-Math.PI / 2); circle.translate(0, .049, 0); emit("cream", circle, "arena-centre-circle");
    box(emit, "red", "arena-centre-mark", [1.1, .004, .055], [0, .048, 0]);
    box(emit, "red", "arena-centre-mark", [.055, .004, 1.1], [0, .048, 0]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(emit, "red", "arena-corner-paint", [.75, .004, .06], [sx * (w / 2 - .65), .048, sz * (d / 2 - .36)]);
      box(emit, "red", "arena-corner-paint", [.06, .004, .75], [sx * (w / 2 - .36), .048, sz * (d / 2 - .65)]);
    }
  } else {
    const bays = Math.min(10, Math.max(2, Math.floor(w / 1.8)));
    for (let i = 1; i < bays; i++) box(emit, "cream", "training-lane-lines", [.035, .004, d - .6], [-w / 2 + i * w / bays, .048, 0]);
    box(emit, "red", "training-strip", [w - .7, .004, .06], [0, .048, 0]);
  }
  for (let i = 0; i < 12; i++) {
    const x = ((i * 7 + seed * 3) % 13 / 13 - .5) * (w - 1.2), z = ((i * 5 + seed) % 11 / 11 - .5) * (d - .9);
    const scuff = new THREE.BoxGeometry(.16 + (i % 3) * .07, .004, .024);
    scuff.rotateY((i + seed) * .61); scuff.translate(x, .046, z); emit("dark", scuff, "canvas-scuffs");
  }
}
