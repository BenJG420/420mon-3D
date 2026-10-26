import * as THREE from "three";

export type ChemFinish = "stone" | "metal" | "rust" | "dark" | "yellow" | "green" | "glass" | "wood";
export type ChemDetailEmitter = (finish: ChemFinish, geometry: THREE.BufferGeometry, feature: string) => void;
type Point = [number, number, number];

function box(emit: ChemDetailEmitter, finish: ChemFinish, feature: string, size: Point, position: Point) {
  const geometry = new THREE.BoxGeometry(...(size.map(value => Math.max(.004, value)) as Point));
  geometry.translate(...position); emit(finish, geometry, feature);
}
function rod(emit: ChemDetailEmitter, finish: ChemFinish, feature: string, a: Point, b: Point, radius = .025) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  if (delta.lengthSq() < 1e-8) return;
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), 8);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); emit(finish, geometry, feature);
}
function ring(emit: ChemDetailEmitter, finish: ChemFinish, feature: string, radius: number, tube: number, position: Point, axis: "x" | "y" | "z" = "z") {
  const geometry = new THREE.TorusGeometry(radius, tube, 5, 16);
  if (axis === "x") geometry.rotateY(Math.PI / 2);
  if (axis === "y") geometry.rotateX(-Math.PI / 2);
  geometry.translate(...position); emit(finish, geometry, feature);
}
function cable(emit: ChemDetailEmitter, points: Point[]) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  emit("dark", new THREE.TubeGeometry(curve, 10, .019, 5, false), "service-cables");
}
function warning(emit: ChemDetailEmitter, x: number, y: number, z: number) {
  const diamond = new THREE.BoxGeometry(.15, .15, .018);
  diamond.rotateZ(Math.PI / 4); diamond.translate(x, y, z); emit("yellow", diamond, "chemical-warning");
  box(emit, "dark", "warning-symbol", [.026, .075, .012], [x, y + .013, z + .016]);
  box(emit, "dark", "warning-symbol", [.026, .02, .012], [x, y - .047, z + .016]);
}

/** Four-sided laboratory/service fronts retain their original solid footprints. */
export function appendChemFacadeDetails(w: number, d: number, h: number, seed: number, emit: ChemDetailEmitter) {
  for (let side = 0; side < 4; side++) {
    const length = side % 2 ? d : w, depth = side % 2 ? w : d, z = depth / 2;
    const face: ChemDetailEmitter = (finish, geometry, feature) => { geometry.rotateY(side * Math.PI / 2); emit(finish, geometry, feature); };
    const bays = Math.min(9, Math.max(1, Math.floor(length / 3))), bay = length / bays;
    box(face, "dark", "sealed-plinth", [length, .2, .04], [0, .15, z + .022]);
    box(face, "stone", "roof-edge", [length, .13, .18], [0, h + .12, z]);
    box(face, "metal", "gutter", [length, .08, .17], [0, h - .025, z + .08]);
    box(face, "dark", "gutter-channel", [length, .018, .095], [0, h + .02, z + .1]);
    for (const sign of [-1, 1]) {
      const x = sign * (length / 2 - .24);
      rod(face, "rust", "downpipes", [x, .18, z + .13], [x, h - .03, z + .13], .047);
      for (const y of [.45, h * .5, h - .27]) box(face, "metal", "pipe-clamps", [.14, .035, .11], [x, y, z + .13]);
      box(face, "stone", "runoff-stains", [.18, .31, .018], [x, .22, z + .037]);
    }
    for (let i = 0; i < bays; i++) {
      const x = -length / 2 + (i + .5) * bay, width = Math.max(.3, Math.min(1.55, bay - .55));
      box(face, "stone", "masonry-repairs", [width * .88, .31, .03], [x, .42, z + .024]);
      const rows = h > 5.4 ? 2 : 1;
      for (let row = 0; row < rows; row++) {
        const y = 2.25 + row * 1.64, paneH = Math.min(.98, h - y - .42);
        if (paneH < .32) continue;
        box(face, "dark", "sealed-window-surround", [width + .13, paneH + .13, .08], [x, y, z + .04]);
        box(face, (i + row + side + seed) % 4 === 0 ? "green" : "glass", "laboratory-glass", [width, paneH, .025], [x, y, z + .094]);
        for (const offset of [-.24, .24]) box(face, "metal", "window-mullions", [.032, paneH, .04], [x + width * offset, y, z + .12]);
        box(face, "metal", "window-mullions", [width, .035, .04], [x, y, z + .12]);
        box(face, "stone", "window-sills", [width + .22, .07, .2], [x, y - paneH / 2 - .075, z + .07]);
      }
      if ((i + seed + side) % 3 === 0) {
        box(face, "dark", "service-door-surround", [width + .12, 1.68, .08], [x, .97, z + .04]);
        box(face, "metal", "service-door", [width, 1.54, .035], [x, .97, z + .1]);
        box(face, "dark", "door-handle", [.055, .19, .06], [x + width * .3, .95, z + .15]);
        warning(face, x, 1.3, z + .13);
      } else {
        box(face, "dark", "extractor-recess", [width * .78, .53, .07], [x, 1.18, z + .04]);
        for (let louvre = 0; louvre < 5; louvre++) box(face, "metal", "extractor-louvres", [width * .73, .055, .06], [x, .99 + louvre * .095, z + .1]);
      }
    }
    cable(face, [[-length / 2 + .28, h - .47, z + .12], [0, h - .69, z + .16], [length / 2 - .28, h - .47, z + .12]]);
    const labelW = Math.min(2.4, length * .5);
    box(face, "dark", "facility-sign-casing", [labelW, .23, .12], [0, h - .28, z + .065]);
    box(face, "green", "facility-neon", [labelW - .16, .035, .025], [0, h - .28, z + .141]);
  }
}

/** Local +Z service-wall details; bounded chunks follow the retained source walls. */
export function appendChemBoundaryDetails(w: number, d: number, h: number, seed: number, emit: ChemDetailEmitter) {
  const z = d / 2, bays = Math.min(10, Math.max(1, Math.ceil(w / 3.2))), bay = w / bays;
  box(emit, "dark", "wall-damp-course", [w, .15, .035], [0, .14, z + .02]);
  box(emit, "metal", "wall-flashing", [w, .035, .12], [0, h + .076, z]);
  const y = Math.max(.34, h - .28);
  rod(emit, "rust", "service-pipe", [-w / 2 + .04, y, z + .1], [w / 2 - .04, y, z + .1], .04);
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (i + .5) * bay;
    box(emit, "stone", "wall-repairs", [Math.min(1.3, bay * .8), Math.min(.28, h * .3), .03], [x, .35, z + .025]);
    box(emit, "metal", "pipe-brackets", [.07, .13, .1], [x, y, z + .1]);
    if (h < 1.5 || bay < .65) continue;
    if ((i + seed) % 3 === 0) {
      box(emit, "metal", "junction-casing", [.36, .5, .12], [x, 1.15, z + .07]);
      box(emit, "dark", "junction-cover", [.29, .41, .025], [x, 1.15, z + .143]);
      warning(emit, x, 1.18, z + .17);
    } else if ((i + seed) % 3 === 1) {
      box(emit, "dark", "service-light-housing", [.6, .12, .12], [x, h - .6, z + .065]);
      box(emit, "green", "service-light-strip", [.49, .035, .018], [x, h - .6, z + .137]);
    }
  }
}

/** Original .75 m source blocks become readable open vats without extending into paths. */
export function appendChemVatDetails(w: number, d: number, seed: number, emit: ChemDetailEmitter) {
  const rim = .22, innerW = w - rim * 2, innerD = d - rim * 2;
  box(emit, "green", "vat-liquid", [innerW, .016, innerD], [0, .767, 0]);
  for (const sign of [-1, 1]) {
    box(emit, "metal", "vat-rim", [w, .18, rim], [0, .84, sign * (d / 2 - rim / 2)]);
    box(emit, "metal", "vat-rim", [rim, .18, innerD], [sign * (w / 2 - rim / 2), .84, 0]);
    box(emit, "dark", "vat-seal", [w - .12, .025, .045], [0, .948, sign * (d / 2 - .1)]);
    for (let i = 0; i < 8; i++) {
      const x = -w / 2 + (i + .5) * w / 8;
      // Put fasteners/paint above the lip: inward-facing strips on the solid shell would be hidden.
      box(emit, "rust", "vat-panel-rivets", [.045, .016, .045], [x + .23, .942, sign * (d / 2 - .11)]);
      box(emit, i % 2 ? "dark" : "yellow", "vat-warning-stripe", [.36, .006, .14], [x, .935, sign * (d / 2 - .11)]);
    }
  }
  // A rail on the rear rim suggests servicing access while the entire vat remains blocked.
  for (const sign of [-1, 1]) rod(emit, "metal", "vat-rail-post", [sign * (w / 2 - .38), .91, -d / 2 + .11], [sign * (w / 2 - .38), 1.34, -d / 2 + .11], .025);
  rod(emit, "metal", "vat-service-rail", [-w / 2 + .38, 1.34, -d / 2 + .11], [w / 2 - .38, 1.34, -d / 2 + .11], .027);
  const feedX = -w / 2 + .5, feedZ = -d / 2 + .48;
  rod(emit, "rust", "vat-feed-riser", [feedX, .76, feedZ], [feedX, 1.43, feedZ], .075);
  rod(emit, "rust", "vat-feed-nozzle", [feedX, 1.43, feedZ], [feedX + .62, 1.43, feedZ], .075);
  ring(emit, "metal", "feed-flange", .095, .019, [feedX, 1.04, feedZ], "y");
  ring(emit, "rust", "feed-valve-wheel", .14, .023, [feedX, 1.18, feedZ + .18]);
  rod(emit, "metal", "feed-valve-stem", [feedX, 1.18, feedZ], [feedX, 1.18, feedZ + .18], .025);
  rod(emit, "metal", "feed-valve-spokes", [feedX - .12, 1.18, feedZ + .18], [feedX + .12, 1.18, feedZ + .18], .015);
  const controlX = w / 2 - .48, controlZ = d / 2 - .25;
  box(emit, "metal", "vat-control-box", [.57, .4, .22], [controlX, 1.13, controlZ]);
  box(emit, "dark", "vat-control-face", [.48, .32, .023], [controlX, 1.13, controlZ + .121]);
  ring(emit, "metal", "vat-gauge-rim", .085, .014, [controlX - .09, 1.19, controlZ + .145]);
  const gauge = new THREE.CylinderGeometry(.075, .075, .012, 16);
  gauge.rotateX(Math.PI / 2); gauge.translate(controlX - .09, 1.19, controlZ + .148); emit("glass", gauge, "vat-gauge-face");
  rod(emit, "dark", "vat-gauge-needle", [controlX - .09, 1.19, controlZ + .158], [controlX - .055, 1.235, controlZ + .158], .009);
  box(emit, "green", "vat-control-status", [.06, .06, .015], [controlX + .15, 1.21, controlZ + .145]);
  warning(emit, controlX + .08, 1.03, controlZ + .146);
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * innerW * .19, z = ((i + seed) % 3 - 1) * innerD * .21;
    const ripple = new THREE.TorusGeometry(.2 + (i % 2) * .07, .008, 4, 16, Math.PI * 1.65);
    ripple.rotateX(-Math.PI / 2); ripple.scale(1.5, .3, .7); ripple.rotateY(seed * .3 + i);
    ripple.translate(x, .783, z); emit("glass", ripple, "liquid-ripples");
  }
}

/** Separate service block retains the original shell; root supplies its independent cap. */
export function appendChemBlockDetails(w: number, d: number, emit: ChemDetailEmitter) {
  for (const sign of [-1, 1]) {
    box(emit, "rust", "service-block-brace", [.06, .65, .055], [sign * (w / 2 - .08), .39, d / 2 + .02]);
    for (let i = 0; i < 5; i++) box(emit, "dark", "service-block-vents", [w * .53, .032, .018], [0, .2 + i * .085, sign * (d / 2 + .012)]);
  }
  rod(emit, "metal", "service-block-handle", [-.13, .84, 0], [.13, .84, 0], .025);
  for (const x of [-.13, .13]) box(emit, "metal", "handle-mounts", [.04, .05, .06], [x, .81, 0]);
  warning(emit, 0, .65, d / 2 + .028);
}

/** Existing small props receive the same chemical-store markings and reusable hardware. */
export function appendChemPropDetails(w: number, d: number, kind: "barrel" | "crate", emit: ChemDetailEmitter) {
  if (kind === "barrel") {
    for (const y of [.22, .73]) ring(emit, "metal", "barrel-hoops", w * .445, .023, [0, y, 0], "y");
    const lid = new THREE.CylinderGeometry(w * .395, w * .395, .025, 16);
    lid.translate(0, .96, 0); emit("dark", lid, "barrel-lid");
    box(emit, "metal", "barrel-bung", [.1, .025, .1], [w * .17, .985, 0]);
    warning(emit, 0, .51, w * .432);
    box(emit, "green", "barrel-residue", [.12, .16, .012], [w * .14, .27, w * .415]);
  } else {
    for (const sign of [-1, 1]) {
      for (const y of [.16, .41]) box(emit, "wood", "crate-planks", [w - .1, .07, .035], [0, y, sign * (d / 2 + .025)]);
      for (const x of [-w * .32, w * .32]) box(emit, "metal", "crate-rivets", [.035, .035, .025], [x, .52, sign * (d / 2 + .05)]);
    }
    warning(emit, 0, .36, d / 2 + .052);
  }
}

/** Flat corner paint sits inside the original steam/encounter apron, never a new curb. */
export function appendChemVatMarkings(w: number, d: number, emit: ChemDetailEmitter) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (w / 2 + .5), z = sz * (d / 2 + .5);
    box(emit, "dark", "apron-undercoat", [.8, .004, .12], [x, .043, sz * (d / 2 + .78)]);
    box(emit, "dark", "apron-undercoat", [.12, .004, .8], [sx * (w / 2 + .78), .043, z]);
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * .24;
      box(emit, "yellow", "apron-warning-paint", [.13, .004, .08], [x + offset, .047, sz * (d / 2 + .78)]);
      box(emit, "yellow", "apron-warning-paint", [.08, .004, .13], [sx * (w / 2 + .78), .047, z + offset]);
    }
  }
}
