import * as THREE from "three";

export type ScrapFinish = "stone" | "metal" | "rust" | "dark" | "yellow" | "glow" | "wood";
export type ScrapDetailEmitter = (finish: ScrapFinish, geometry: THREE.BufferGeometry, feature: string) => void;
type Point = [number, number, number];

function box(emit: ScrapDetailEmitter, finish: ScrapFinish, feature: string, size: Point, position: Point) {
  const geometry = new THREE.BoxGeometry(...size); geometry.translate(...position); emit(finish, geometry, feature);
}
function rod(emit: ScrapDetailEmitter, finish: ScrapFinish, feature: string, a: Point, b: Point, radius = .025, sides = 8) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  if (delta.lengthSq() < 1e-8) return;
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), sides);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); emit(finish, geometry, feature);
}
function cable(emit: ScrapDetailEmitter, points: Point[], radius = .018) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  emit("dark", new THREE.TubeGeometry(curve, 10, radius, 5, false), "salvage-cable");
}

/** A shallow +Z workshop frontage; callers split long faces into local chunks. */
export function appendScrapWallDetails(w: number, d: number, h: number, seed: number, emit: ScrapDetailEmitter) {
  const z = d / 2, bays = Math.max(1, Math.min(6, Math.floor(w / 2.8))), bay = w / bays;
  box(emit, "dark", "damp-plinth", [w, .19, .03], [0, .14, z + .018]);
  box(emit, "metal", "roof-flashing", [w, .045, .13], [0, h + .09, z + .02]);
  box(emit, "dark", "roof-channel", [w, .022, .06], [0, h + .125, z + .04]);
  rod(emit, "metal", "service-conduit", [-w / 2 + .06, Math.max(.34, h - .25), z + .075],
    [w / 2 - .06, Math.max(.34, h - .25), z + .075], .027);
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (i + .5) * bay, width = Math.min(1.7, bay * .72);
    box(emit, "stone", "masonry-repairs", [width, Math.min(.3, h * .32), .028], [x, .35, z + .02]);
    box(emit, "metal", "conduit-clamps", [.06, .11, .085], [x, Math.max(.34, h - .25), z + .06]);
    if (h < 1.5) continue;
    for (const sx of [-1, 1]) box(emit, "rust", "corrugated-cladding", [.045, Math.min(1.42, h - .8), .05], [x + sx * width * .4, 1.05, z + .055]);
    const rows = h > 5.4 ? 2 : 1;
    for (let row = 0; row < rows; row++) {
      const y = 2.35 + row * 1.65, paneH = Math.min(.92, h - y - .42);
      if (paneH < .25) continue;
      box(emit, "dark", "workshop-window-frame", [width, paneH + .12, .07], [x, y, z + .04]);
      box(emit, (seed + i + row) % 4 === 0 ? "glow" : "dark", "workshop-panes", [width - .12, paneH, .02], [x, y, z + .085]);
      box(emit, "metal", "window-mullions", [.035, paneH, .04], [x, y, z + .115]);
      box(emit, "metal", "window-mullions", [width - .12, .035, .04], [x, y, z + .115]);
      box(emit, "stone", "window-sills", [width + .12, .07, .16], [x, y - paneH / 2 - .1, z + .075]);
    }
    if ((seed + i) % 3 === 0) {
      box(emit, "dark", "shutter-surround", [width, 1.55, .045], [x, .98, z + .03]);
      for (let slat = 0; slat < 9; slat++) box(emit, "metal", "roller-shutter", [width - .1, .12, .04], [x, .35 + slat * .15, z + .08]);
      box(emit, "dark", "shutter-handle", [.23, .04, .04], [x, .73, z + .12]);
    } else {
      box(emit, "dark", "vent-housing", [width * .7, .53, .055], [x, 1.15, z + .035]);
      for (let slat = 0; slat < 5; slat++) box(emit, "metal", "vent-slats", [width * .63, .05, .035], [x, .96 + slat * .095, z + .087]);
      box(emit, "yellow", "service-warning", [.25, .19, .012], [x + width * .3, .58, z + .066]);
      box(emit, "dark", "warning-symbol", [.035, .11, .008], [x + width * .3, .59, z + .078]);
    }
  }
  if (h < 1.5) return;
  for (const sign of [-1, 1]) {
    const x = sign * (w / 2 - .2);
    rod(emit, "rust", "downpipes", [x, .16, z + .115], [x, h - .17, z + .115], .039);
    for (const y of [.4, h * .5, h - .35]) box(emit, "metal", "pipe-brackets", [.12, .035, .09], [x, y, z + .11]);
  }
  cable(emit, [[-w / 2 + .24, h - .48, z + .115], [0, h - .7, z + .13], [w / 2 - .24, h - .48, z + .115]]);
  const signW = Math.min(2.4, w * .5);
  box(emit, "dark", "workshop-sign-casing", [signW, .2, .08], [0, h - .28, z + .06]);
  box(emit, "glow", "amber-neon", [signW - .15, .035, .02], [0, h - .28, z + .113]);
}

/** Conveyor equipment rests above the original .75 m blocked foundation. */
export function appendScrapBeltDetails(w: number, d: number, seed: number, emit: ScrapDetailEmitter) {
  const rollers = Math.min(18, Math.max(4, Math.floor(w / .72))), span = w - .45;
  for (let i = 0; i < rollers; i++) {
    const x = -span / 2 + (i + .5) * span / rollers;
    rod(emit, "metal", "conveyor-rollers", [x, .89, -d / 2 + .17], [x, .89, d / 2 - .17], .11);
    for (const sign of [-1, 1]) box(emit, "rust", "roller-bearings", [.17, .2, .11], [x, .88, sign * (d / 2 - .12)]);
  }
  box(emit, "dark", "rubber-conveyor", [w - .28, .045, d - .62], [0, 1.025, 0]);
  for (let i = 0; i < rollers; i++) box(emit, "dark", "belt-cleats", [.055, .025, d - .76], [-span / 2 + (i + .5) * span / rollers, 1.06, 0]);
  for (const sign of [-1, 1]) {
    box(emit, "yellow", "conveyor-sideguard", [w - .1, .12, .07], [0, 1.12, sign * (d / 2 - .06)]);
    for (let i = 0; i < 4; i++) box(emit, "metal", "guard-fasteners", [.04, .035, .025], [(-.375 + i * .25) * w, 1.145, sign * (d / 2 - .105)]);
  }
  const side = seed % 2 ? 1 : -1;
  box(emit, "rust", "drive-motor", [.62, .34, .43], [w / 2 - .5, 1.1, side * (d / 2 - .45)]);
  for (let i = 0; i < 5; i++) box(emit, "metal", "motor-cooling-fins", [.52, .025, .46], [w / 2 - .5, .97 + i * .06, side * (d / 2 - .45)]);
}

/** Folded sheets, steel beams and wheel rims dress only the existing scrap heaps. */
export function appendScrapPileDetails(w: number, d: number, seed: number, emit: ScrapDetailEmitter) {
  for (let i = 0; i < 3; i++) {
    const beam: ScrapDetailEmitter = (finish, geometry, feature) => {
      geometry.rotateY((i - 1) * .16); geometry.translate(0, .84 + i * .15, (i - 1) * d * .22); emit(finish, geometry, feature);
    };
    for (const y of [-.07, .07]) box(beam, i % 2 ? "metal" : "rust", "salvage-beam-flanges", [w * .67, .035, .24], [0, y, 0]);
    box(beam, "dark", "salvage-beam-web", [w * .67, .12, .045], [0, 0, 0]);
  }
  for (let i = 0; i < 3; i++) {
    const sheet = new THREE.BoxGeometry(w * .32, .035, d * .27, 6, 1, 5), positions = sheet.getAttribute("position");
    for (let v = 0; v < positions.count; v++) {
      const x = positions.getX(v), z = positions.getZ(v);
      positions.setY(v, positions.getY(v) + Math.abs(x) * .13 + Math.sin(z * 12) * .035);
    }
    sheet.computeVertexNormals(); sheet.rotateY((i - 1) * .43);
    sheet.translate((i - 1) * w * .2, 1.21 + (i % 2) * .2, (i % 2 ? 1 : -1) * d * .13);
    emit(i % 2 ? "metal" : "rust", sheet, "folded-corrugated-sheets");
  }
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * w * .23, y = 1.33, z = d * .24;
    const tire = new THREE.TorusGeometry(.37, .105, 6, 18); tire.translate(x, y, z); emit("dark", tire, "discarded-tires");
    const rim = new THREE.TorusGeometry(.265, .045, 6, 16); rim.translate(x, y, z + .05); emit("metal", rim, "wheel-rims");
    rod(emit, "rust", "wheel-hub", [x, y, z - .08], [x, y, z + .13], .073);
    for (let spoke = 0; spoke < 5; spoke++) {
      const angle = spoke * Math.PI * 2 / 5;
      rod(emit, "metal", "wheel-spokes", [x, y, z + .075], [x + Math.cos(angle) * .24, y + Math.sin(angle) * .24, z + .075], .017, 6);
    }
  }
  cable(emit, [[-w * .3, 1.05, -d * .22], [-w * .14, 1.3, -d * .15], [w * .12, 1.2, -d * .28], [w * .3, 1.02, -d * .18]], .025);
  box(emit, "yellow", "salvage-warning-plate", [.43, .01, .18], [seed % 2 ? .4 : -.4, 1.082, 0]);
}

/** Gate cabinets stay inset: Coil's 16-pixel source passage cannot lose any width. */
export function appendScrapGateDetails(w: number, d: number, seed: number, emit: ScrapDetailEmitter) {
  const cabinetW = Math.min(1.1, w - .35);
  box(emit, "dark", "gate-service-cabinet", [cabinetW, .43, .64], [0, 1.025, 0]);
  box(emit, "metal", "cabinet-front", [cabinetW - .1, .35, .025], [0, 1.025, .335]);
  const wheel = new THREE.TorusGeometry(.145, .022, 6, 16); wheel.translate(.18, 1.07, .38); emit("rust", wheel, "gate-handwheel");
  rod(emit, "rust", "gate-wheel-hub", [.18, 1.07, .33], [.18, 1.07, .42], .037);
  for (const sign of [-1, 1]) {
    box(emit, "yellow", "gate-edge-bumper", [.09, .13, d - .22], [sign * (w / 2 - .075), .89, 0]);
    for (let i = 0; i < 5; i++) box(emit, "dark", "gate-hazard-bands", [.095, .018, .16], [sign * (w / 2 - .075), .962, (-.32 + i * .16) * d]);
  }
  for (let i = 0; i < 3; i++) box(emit, i === seed % 3 ? "yellow" : "dark", "cabinet-indicators", [.045, .045, .015], [-.25 + i * .09, 1.12, .357]);
}

/** Correctly oriented wire panels on all five source enclosure rectangles. */
export function appendScrapFenceDetails(w: number, d: number, seed: number, emit: ScrapDetailEmitter) {
  const length = Math.max(w, d), depth = Math.min(w, d);
  const panel: ScrapDetailEmitter = (finish, geometry, feature) => { if (d > w) geometry.rotateY(Math.PI / 2); emit(finish, geometry, feature); };
  const left = -length / 2 + .09, right = length / 2 - .09, bays = Math.max(1, Math.ceil(length / 3.1));
  for (let i = 0; i <= bays; i++) {
    const x = left + (right - left) * i / bays;
    box(panel, "dark", "fence-foot", [.15, .06, Math.min(.16, depth - .04)], [x, .03, 0]);
    rod(panel, "metal", "fence-post", [x, .06, 0], [x, 1.53, 0], .04);
    box(panel, "rust", "fence-cap", [.1, .035, .1], [x, 1.5475, 0]);
  }
  for (const y of [.22, 1.48]) rod(panel, "metal", "fence-rails", [left, y, 0], [right, y, 0], .03);
  const span = right - left - .1, rise = 1.12, step = Math.max(.52, (span + rise) / 44), start = left + .05;
  for (let offset = -rise; offset < span; offset += step) {
    const x0 = Math.max(0, offset), x1 = Math.min(span, offset + rise);
    if (x1 <= x0) continue;
    rod(panel, "metal", "fence-wire", [start + x0, .29 + x0 - offset, -.008], [start + x1, .29 + x1 - offset, -.008], .008, 5);
    rod(panel, "metal", "fence-wire", [start + x0, 1.41 - x0 + offset, .008], [start + x1, 1.41 - x1 + offset, .008], .008, 5);
  }
  box(panel, "rust", "fence-repair-strap", [.13, .18, .09], [(seed % 2 ? left : right), .68, 0]);
}

/** Hardware complements the original searchable crate, barrel and terminal shells. */
export function appendScrapPropDetails(w: number, d: number, kind: "crate" | "barrel" | "terminal", emit: ScrapDetailEmitter) {
  if (kind === "barrel") {
    const lid = new THREE.CylinderGeometry(w * .39, w * .39, .025, 18); lid.translate(0, .9625, 0); emit("metal", lid, "barrel-lid");
    const seam = new THREE.TorusGeometry(w * .365, .018, 6, 18); seam.rotateX(Math.PI / 2); seam.translate(0, .979, 0); emit("dark", seam, "barrel-lid-seam");
    const bung = new THREE.CylinderGeometry(.065, .065, .025, 10); bung.translate(w * .19, .99, 0); emit("rust", bung, "barrel-bung");
    box(emit, "yellow", "barrel-warning", [.22, .18, .015], [0, .47, w * .425]);
    return;
  }
  if (kind === "terminal") {
    box(emit, "metal", "terminal-screen-trim", [w * .84, .035, .055], [0, 1.32, -.09]);
    for (const sign of [-1, 1]) box(emit, "metal", "terminal-screen-trim", [.035, .59, .055], [sign * w * .42, 1.035, -.09]);
    box(emit, "dark", "terminal-keyboard", [w * .76, .025, .3], [0, .76, .17]);
    for (let i = 0; i < 7; i++) box(emit, "metal", "terminal-keys", [.06, .014, .06], [-w * .29 + i * w * .095, .782, .18]);
    for (let i = 0; i < 3; i++) box(emit, i === 0 ? "glow" : "yellow", "terminal-status", [.045, .045, .02], [-w * .25 + i * .09, .54, .42]);
    box(emit, "metal", "terminal-service-cover", [w * .58, .22, .018], [0, .24, .42]);
    return;
  }
  const planks = Math.max(2, Math.ceil(w / .24));
  for (let i = 0; i < planks; i++) box(emit, "wood", "crate-lid-planks", [w / planks - .015, .035, d - .05], [-w / 2 + (i + .5) * w / planks, .65, 0]);
  for (const sign of [-1, 1]) {
    for (const y of [.18, .52]) box(emit, "metal", "crate-bands", [w - .06, .055, .025], [0, y, sign * (d / 2 + .02)]);
    for (const sx of [-1, 1]) box(emit, "dark", "crate-corners", [.06, .48, .04], [sx * (w / 2 - .055), .35, sign * (d / 2 + .02)]);
  }
  box(emit, "yellow", "crate-stencil", [.28, .16, .012], [0, .35, d / 2 + .04]);
  for (let i = 0; i < 3; i++) box(emit, "dark", "crate-stencil-lines", [.2 - i * .03, .015, .008], [0, .4 - i * .045, d / 2 + .052]);
}

/** Flat oil/rust scuffs remain inside the five original encounter rectangles. */
export function appendScrapRustDetails(w: number, d: number, seed: number, emit: ScrapDetailEmitter) {
  const inset = .25;
  for (const sign of [-1, 1]) box(emit, "yellow", "rust-zone-edge", [w - inset * 2, .004, .03], [0, .048, sign * (d / 2 - inset)]);
  for (let i = 0; i < 22; i++) {
    const x = ((i * 7 + seed * 3) % 23 / 23 - .5) * (w - 1.3), z = ((i * 5 + seed) % 19 / 19 - .5) * (d - .9);
    const mark = new THREE.BoxGeometry(.16 + (i % 4) * .07, .004, .035 + (i % 3) * .018);
    mark.rotateY((i + seed) * .61); mark.translate(x, .046, z); emit(i % 3 ? "rust" : "dark", mark, "oil-rust-flakes");
  }
}
