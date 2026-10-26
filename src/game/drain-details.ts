import * as THREE from "three";

export type DrainFinish = "stone" | "metal" | "rust" | "dark" | "moss" | "cyan" | "amber" | "wood" | "porcelain";
export type DrainDetailEmitter = (finish: DrainFinish, geometry: THREE.BufferGeometry, feature: string) => void;
type Point = [number, number, number];

function box(emit: DrainDetailEmitter, finish: DrainFinish, feature: string, size: Point, position: Point) {
  const geometry = new THREE.BoxGeometry(...(size.map(value => Math.max(.004, value)) as Point));
  geometry.translate(...position); emit(finish, geometry, feature);
}
function rod(emit: DrainDetailEmitter, finish: DrainFinish, feature: string, a: Point, b: Point, radius = .025) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  if (delta.lengthSq() < 1e-8) return;
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), 8);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); emit(finish, geometry, feature);
}
function ring(emit: DrainDetailEmitter, finish: DrainFinish, feature: string, radius: number, tube: number, position: Point, axis: "x" | "y" | "z" = "z") {
  const geometry = new THREE.TorusGeometry(radius, tube, 5, 16);
  if (axis === "x") geometry.rotateY(Math.PI / 2);
  if (axis === "y") geometry.rotateX(-Math.PI / 2);
  geometry.translate(...position); emit(finish, geometry, feature);
}
function cable(emit: DrainDetailEmitter, points: Point[]) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  emit("dark", new THREE.TubeGeometry(curve, 10, .018, 5, false), "service-cables");
}

/** Pump-house fronts dress the four faces of existing solids, without changing access. */
export function appendDrainFacadeDetails(w: number, d: number, h: number, seed: number, emit: DrainDetailEmitter) {
  for (let side = 0; side < 4; side++) {
    const length = side % 2 ? d : w, depth = side % 2 ? w : d, z = depth / 2;
    const face: DrainDetailEmitter = (finish, geometry, feature) => { geometry.rotateY(side * Math.PI / 2); emit(finish, geometry, feature); };
    const bays = Math.min(10, Math.max(1, Math.floor(length / 3.1))), bay = length / bays;
    box(face, "dark", "damp-plinth", [length, .19, .04], [0, .13, z + .022]);
    box(face, "stone", "roof-parapet", [length, .14, .18], [0, h + .12, z]);
    box(face, "metal", "gutter", [length, .075, .18], [0, h - .03, z + .08]);
    box(face, "dark", "gutter-channel", [length, .018, .1], [0, h + .016, z + .1]);
    for (const sign of [-1, 1]) {
      const x = sign * (length / 2 - .24);
      rod(face, "rust", "downpipes", [x, .19, z + .12], [x, h - .035, z + .12], .047);
      for (const y of [.45, h * .48, h - .3]) box(face, "metal", "pipe-brackets", [.14, .035, .11], [x, y, z + .12]);
      box(face, "moss", "downpipe-stains", [.21, .3, .014], [x, .22, z + .04]);
    }
    for (let i = 0; i < bays; i++) {
      const x = -length / 2 + (i + .5) * bay, width = Math.min(1.7, bay - .5);
      box(face, "stone", "masonry-piers", [.17, h - .13, .07], [x - bay / 2 + .12, h / 2, z + .025]);
      const rows = h > 5.5 ? 2 : 1;
      for (let row = 0; row < rows; row++) {
        const y = 2.27 + row * 1.65, panelH = Math.min(.92, h - y - .5);
        if (panelH < .3) continue;
        box(face, "dark", "window-surround", [width + .12, panelH + .14, .08], [x, y, z + .04]);
        box(face, (i + row + side + seed) % 4 === 0 ? "amber" : "cyan", "pump-house-glass", [width, panelH, .025], [x, y, z + .094]);
        box(face, "metal", "window-mullions", [.035, panelH, .04], [x, y, z + .121]);
        box(face, "metal", "window-mullions", [width, .035, .04], [x, y, z + .121]);
        box(face, "stone", "window-sills", [width + .24, .075, .2], [x, y - panelH / 2 - .09, z + .07]);
      }
      if ((i + side + seed) % 3 === 0) {
        box(face, "dark", "service-shutter-surround", [width + .1, 1.53, .07], [x, .94, z + .043]);
        for (let slat = 0; slat < 9; slat++) box(face, "metal", "service-shutter-slats", [width, .12, .04], [x, .29 + slat * .15, z + .101]);
        box(face, "dark", "service-shutter-handle", [.23, .035, .045], [x, .74, z + .14]);
      } else {
        box(face, "dark", "vent-recess", [width * .7, .54, .07], [x, 1.13, z + .04]);
        for (let slat = 0; slat < 5; slat++) box(face, "metal", "vent-louvres", [width * .66, .055, .065], [x, .94 + slat * .095, z + .1]);
        box(face, "stone", "patched-masonry", [width * .8, .28, .025], [x, .42, z + .022]);
      }
      box(face, "moss", "mineral-streaks", [.12 + (i % 3) * .045, .27 + (i % 2) * .12, .012], [x + width * .32, .25, z + .045]);
    }
    cable(face, [[-length / 2 + .25, h - .43, z + .12], [0, h - .69, z + .15], [length / 2 - .25, h - .43, z + .12]]);
    const labelW = Math.min(2.2, length * .5);
    box(face, "dark", "service-sign-casing", [labelW, .23, .12], [0, h - .29, z + .06]);
    box(face, "cyan", "pump-house-neon", [labelW - .15, .035, .025], [0, h - .29, z + .136]);
  }
}

/** Facing local positive Z; root rotates each original wall/chunk toward its walkway. */
export function appendDrainBoundaryDetails(w: number, d: number, h: number, seed: number, emit: DrainDetailEmitter) {
  const z = d / 2, bays = Math.min(12, Math.max(1, Math.ceil(w / 3.2))), bay = w / bays;
  box(emit, "dark", "wall-waterline", [w, .14, .035], [0, .13, z + .02]);
  box(emit, "metal", "cap-flashing", [w, .035, .12], [0, h + .076, z]);
  const conduitY = Math.max(.35, h - .29);
  rod(emit, "rust", "wall-pipe", [-w / 2 + .035, conduitY, z + .09], [w / 2 - .035, conduitY, z + .09], .04);
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (i + .5) * bay, width = Math.min(1.4, bay * .82);
    box(emit, "stone", "wall-repairs", [width, Math.min(.28, h * .28), .03], [x, .36, z + .022]);
    box(emit, "metal", "conduit-clamps", [.07, .14, .09], [x, conduitY, z + .09]);
    box(emit, "moss", "wet-wall-stains", [Math.min(.18, bay * .2), .14 + (i % 2) * .08, .013], [x + width * .28, .22, z + .046]);
    if (h < 1.5 || bay < .7) continue;
    if ((i + seed) % 3 === 0) {
      box(emit, "metal", "inspection-box", [.36, .48, .13], [x, 1.13, z + .07]);
      box(emit, "dark", "inspection-cover", [.29, .37, .025], [x, 1.13, z + .148]);
      box(emit, "amber", "inspection-warning", [.11, .07, .012], [x, 1.2, z + .17]);
    } else if ((i + seed) % 3 === 1) {
      box(emit, "dark", "wall-lamp-housing", [.51, .12, .11], [x, h - .6, z + .06]);
      box(emit, "cyan", "wall-light-strip", [.42, .035, .018], [x, h - .6, z + .129]);
    }
  }
}

/** Low containment/ripple detail stays within each original impassable water rectangle. */
export function appendDrainWaterDetails(w: number, d: number, seed: number, emit: DrainDetailEmitter) {
  const rim = Math.min(.14, w * .08, d * .08);
  for (const sign of [-1, 1]) {
    box(emit, "stone", "basin-rim", [w, .18, rim], [0, .09, sign * (d / 2 - rim / 2)]);
    box(emit, "stone", "basin-rim", [rim, .18, Math.max(.02, d - rim * 2)], [sign * (w / 2 - rim / 2), .09, 0]);
    box(emit, "moss", "basin-waterline", [w - rim * 2, .055, .018], [0, .068, sign * (d / 2 - rim - .009)]);
  }
  const bays = Math.min(14, Math.max(1, Math.ceil(w / 4.8)));
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (i + .5) * w / bays, z = (i % 2 ? 1 : -1) * (d / 2 - rim * .5);
    box(emit, "metal", "rim-fasteners", [.055, .012, rim * .6], [x, .186, z]);
    const radius = Math.min(.2 + ((i + seed) % 3) * .035, (w / bays - rim * 2) * .25, (d - rim * 2) * .22);
    const ripple = new THREE.TorusGeometry(radius, .008, 4, 16, Math.PI * 1.6);
    ripple.rotateX(-Math.PI / 2); ripple.scale(1.5, .35, .7); ripple.rotateY((i + seed) * .7);
    ripple.translate(x, .047, (i % 3 - 1) * (d - rim * 2) * .15); emit("porcelain", ripple, "water-ripples");
    if ((i + seed) % 2 === 0) {
      box(emit, "moss", "floating-residue", [Math.min(.28, w / bays * .2), .006, Math.min(.09, d * .05)], [x, .044, -d / 2 + rim + .1]);
    }
  }
}

/** Existing machinery keeps its shell and collision; fittings reveal its industrial purpose. */
export function appendDrainObstacleDetails(w: number, d: number, kind: "pipe" | "valve" | "toilet" | "block", emit: DrainDetailEmitter) {
  if (kind === "pipe") {
    const length = Math.max(w, d), radius = Math.min(w, d) * .48, alongX = w > d;
    const part: DrainDetailEmitter = (finish, geometry, feature) => { if (!alongX) geometry.rotateY(Math.PI / 2); emit(finish, geometry, feature); };
    for (const sign of [-1, 1]) {
      const x = sign * Math.max(.02, length / 2 - .07);
      ring(part, "rust", "pipe-flanges", radius, .045, [x, .7, 0], "x");
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        rod(part, "metal", "flange-bolts", [x - .035, .7 + Math.cos(angle) * radius, Math.sin(angle) * radius], [x + .035, .7 + Math.cos(angle) * radius, Math.sin(angle) * radius], .021);
      }
    }
    box(part, "dark", "pipe-band", [Math.min(.12, length * .15), .08, .025], [0, .7 + radius - .02, radius * .19]);
  } else if (kind === "valve") {
    // Equal source width/depth keeps the original cylinder vertical at y=.7.
    const length = Math.max(w, d), radius = Math.min(w, d) * .48, top = .7 + length / 2;
    for (const sign of [-1, 1]) {
      const y = .7 + sign * Math.max(.02, length / 2 - .035);
      ring(emit, "rust", "valve-flanges", radius, .04, [0, y, 0], "y");
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3, x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
        rod(emit, "metal", "valve-flange-bolts", [x, y - .035, z], [x, y + .035, z], .02);
      }
    }
    const wheelY = top + .27, wheelRadius = Math.min(.2, w * .24);
    rod(emit, "metal", "valve-stem", [0, top, 0], [0, wheelY, 0], .033);
    ring(emit, "rust", "valve-wheel", wheelRadius, .028, [0, wheelY, 0]);
    rod(emit, "metal", "valve-spokes", [-wheelRadius * .85, wheelY, 0], [wheelRadius * .85, wheelY, 0], .018);
    rod(emit, "metal", "valve-spokes", [0, wheelY - wheelRadius * .85, 0], [0, wheelY + wheelRadius * .85, 0], .018);
    box(emit, "amber", "valve-direction-marker", [.09, .045, .015], [wheelRadius * .6, wheelY + .08, .026]);
    box(emit, "dark", "valve-service-label", [.12, .09, .018], [0, .71, radius + .008]);
  } else if (kind === "toilet") {
    const radius = Math.min(w * .34, d * .24), z = d * .13;
    // Dark inset covers the retained top face; the oval seat reads as an open bowl.
    const inset = new THREE.CylinderGeometry(radius, radius, .016, 18);
    inset.scale(1, 1, 1.3); inset.translate(0, .791, z); emit("dark", inset, "bowl-opening");
    const seat = new THREE.TorusGeometry(radius, .055, 6, 20);
    seat.rotateX(-Math.PI / 2); seat.scale(1, .65, 1.3); seat.translate(0, .821, z); emit("porcelain", seat, "toilet-seat");
    box(emit, "porcelain", "toilet-cistern", [w * .8, .53, d * .21], [0, 1.02, -d * .32]);
    box(emit, "porcelain", "cistern-lid", [w * .84, .045, d * .24], [0, 1.305, -d * .32]);
    box(emit, "metal", "flush-handle", [.12, .035, .04], [w * .26, 1.13, -d * .2]);
    for (const sign of [-1, 1]) rod(emit, "rust", "toilet-fasteners", [sign * w * .32, .77, d * .29], [sign * w * .32, .81, d * .29], .026);
  } else {
    // Root provides the independent PBR cap, so only its handle/fixings are added here.
    rod(emit, "metal", "pump-block-handle", [-.13, .84, 0], [.13, .84, 0], .025);
    for (const x of [-.13, .13]) box(emit, "metal", "pump-block-handle-feet", [.045, .045, .06], [x, .81, 0]);
    for (const sign of [-1, 1]) {
      box(emit, "rust", "block-edge-braces", [.065, .65, .08], [sign * (w / 2 - .07), .39, d / 2 + .02]);
      for (let i = 0; i < 4; i++) box(emit, "dark", "pump-block-vents", [w * .63, .035, .018], [0, .25 + i * .1, sign * (d / 2 + .012)]);
    }
    box(emit, "amber", "pump-block-warning", [Math.min(.3, w * .25), .13, .015], [0, .63, d / 2 + .026]);
  }
}

/** Damp original barrels/crates gain reusable hardware; interaction shells remain unchanged. */
export function appendDrainPropDetails(w: number, d: number, kind: "barrel" | "crate", emit: DrainDetailEmitter) {
  if (kind === "barrel") {
    for (const y of [.22, .73]) ring(emit, "metal", "barrel-hoops", w * .445, .023, [0, y, 0], "y");
    const lid = new THREE.CylinderGeometry(w * .395, w * .395, .025, 16);
    lid.translate(0, .96, 0); emit("dark", lid, "wet-barrel-lid");
    box(emit, "metal", "barrel-bung", [.1, .025, .1], [w * .17, .985, 0]);
    box(emit, "moss", "barrel-residue", [.16, .22, .018], [0, .5, w * .432]);
    box(emit, "amber", "barrel-label", [.13, .1, .018], [-w * .13, .61, w * .415]);
  } else {
    for (const sign of [-1, 1]) {
      for (const y of [.16, .4]) box(emit, "wood", "crate-planks", [w - .1, .07, .035], [0, y, sign * (d / 2 + .025)]);
      for (const x of [-w * .32, w * .32]) box(emit, "metal", "crate-rivets", [.032, .032, .025], [x, .52, sign * (d / 2 + .05)]);
    }
    box(emit, "moss", "crate-waterline", [w * .65, .07, .012], [0, .11, d / 2 + .049]);
    box(emit, "dark", "crate-stencil", [.25, .11, .012], [0, .38, d / 2 + .049]);
  }
}
