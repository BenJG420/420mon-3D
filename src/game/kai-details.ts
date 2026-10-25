import * as THREE from "three";

export type KaiFinish = "frame" | "metal" | "stone" | "wood" | "rust" | "cyan" | "warm";
export type KaiEmitter = (finish: KaiFinish, geometry: THREE.BufferGeometry, feature: string) => void;
const box = (emit: KaiEmitter, finish: KaiFinish, feature: string, w: number, h: number, d: number, x: number, y: number, z: number) => {
  const geometry = new THREE.BoxGeometry(w, h, d); geometry.translate(x, y, z); emit(finish, geometry, feature);
};
function tube(emit: KaiEmitter, finish: KaiFinish, feature: string, points: THREE.Vector3[], radius = .025) {
  emit(finish, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, radius, 5, false), feature);
}
function ring(emit: KaiEmitter, finish: KaiFinish, feature: string, radius: number, thickness: number, x: number, y: number, z: number) {
  const geometry = new THREE.TorusGeometry(radius, thickness, 6, 12); geometry.translate(x, y, z); emit(finish, geometry, feature);
}

/** Service fronts and drainage stay on the original perimeter, without new houses. */
export function appendKaiWall(w: number, d: number, h: number, warehouse: boolean, emit: KaiEmitter) {
  const z = d / 2, bays = Math.min(10, Math.max(1, Math.floor(w / 4.8)));
  box(emit, "stone", "damp-course", w, .17, .07, 0, .12, z + .025);
  box(emit, "metal", "flashing", w, .065, .13, 0, h + .085, z);
  for (let i = 0; i < bays; i++) {
    const span = w / bays, x = -w / 2 + (i + .5) * span;
    box(emit, "stone", "masonry-piers", .17, h - .1, .1, x - span / 2 + .12, h / 2, z + .025);
    if (warehouse && h > 2) {
      const width = Math.min(2.8, span - .8), gate = i % 3 === 0;
      box(emit, "frame", gate ? "roller-doors" : "clerestory", width + .12, gate ? 1.93 : .74, .075, x, gate ? 1.15 : 1.96, z + .04);
      if (gate) {
        for (let slat = 0; slat < 14; slat++) box(emit, "metal", "roller-slats", width, .11, .045, x, .3 + slat * .13, z + .1);
        box(emit, "frame", "door-handles", .24, .05, .06, x, .75, z + .14);
      } else {
        box(emit, i % 2 ? "cyan" : "warm", "lit-glass", width - .08, .58, .025, x, 1.96, z + .09);
        for (const offset of [-.33, .33]) box(emit, "metal", "mullions", .045, .66, .05, x + width * offset, 1.96, z + .13);
        box(emit, "stone", "window-sills", width + .24, .08, .2, x, 1.55, z + .07);
      }
      box(emit, "rust", "downpipes", .075, h - .12, .075, x + span * .43, h / 2, z + .14);
      box(emit, "metal", "pipe-clamps", .16, .04, .11, x + span * .43, .65, z + .15);
      box(emit, "metal", "pipe-clamps", .16, .04, .11, x + span * .43, 2, z + .15);
      tube(emit, "frame", "service-cables", [new THREE.Vector3(x - span / 2 + .2, h - .24, z + .09), new THREE.Vector3(x, h - .4, z + .12), new THREE.Vector3(x + span / 2 - .2, h - .24, z + .09)], .018);
      box(emit, "frame", "neon-casing", 1.6, .17, .12, x, h - .12, z + .07);
      box(emit, "cyan", "neon-strips", 1.43, .045, .035, x, h - .12, z + .15);
    } else {
      box(emit, "rust", "service-conduit", span - .17, .045, .045, x, h - .2, z + .08);
      box(emit, "metal", "junctions", .18, Math.min(.25, h * .4), .09, x, h - .2, z + .06);
    }
  }
  if (warehouse) {
    box(emit, "metal", "gutter", w, .09, .18, 0, h - .015, z + .09);
    box(emit, "frame", "gutter-channel", w, .025, .1, 0, h + .015, z + .11);
  }
}

/** Low quay cap exposes the source water; fittings stay within the original barrier. */
export function appendKaiQuay(w: number, d: number, h: number, emit: KaiEmitter) {
  for (const sign of [-1, 1]) {
    const face: KaiEmitter = (finish, geometry, feature) => { if (sign < 0) geometry.rotateY(Math.PI); emit(finish, geometry, feature); };
    const z = d / 2;
    box(face, "rust", "quay-rubbing-strip", w, .12, .045, 0, .31, z + .02);
    box(face, "stone", "waterline-stains", w, .13, .035, 0, .1, z + .02);
    box(face, "cyan", "navigation-strip", w - .3, .025, .025, 0, h - .1, z + .04);
    for (let i = 0; i < 14; i++) {
      const x = -w / 2 + (i + .5) * w / 14;
      box(face, "metal", "quay-braces", .1, h - .1, .085, x, h / 2, z + .035);
      box(face, "frame", "fender-mount", .28, .2, .07, x + .35, .37, z + .04);
      ring(face, "rust", "mooring-rings", .1, .023, x + .35, .35, z + .12);
    }
  }
  for (let i = 0; i < 8; i++) {
    const x = -w / 2 + (i + .5) * w / 8;
    box(emit, "metal", "bollard-base", .32, .05, .34, x, h + .1, 0);
    const stem = new THREE.CylinderGeometry(.065, .085, .19, 10); stem.translate(x, h + .21, 0); emit("rust", stem, "bollards");
    box(emit, "metal", "bollard-crossbar", .27, .08, .08, x, h + .3, 0);
  }
}

/** Existing rods and slot machine remain the interactive source objects. */
export function appendKaiDevice(w: number, d: number, fishing: boolean, emit: KaiEmitter) {
  if (fishing) {
    box(emit, "metal", "rod-holder", .08, .48, .08, -.36, .34, .03);
    ring(emit, "metal", "reel", .11, .026, -.23, .72, .05);
    box(emit, "wood", "plank-seams", .58, .015, .025, 0, .258, -.15);
    box(emit, "wood", "plank-seams", .58, .015, .025, 0, .258, .15);
    tube(emit, "frame", "fishing-line", [new THREE.Vector3(.55, 2.15, 0), new THREE.Vector3(.75, 1.5, 1.5), new THREE.Vector3(.8, .05, 3)], .006);
    for (const x of [-.2, .2]) box(emit, "metal", "fixings", .04, .025, .04, x, .27, .22);
  } else {
    box(emit, "metal", "rain-hood", w * .86, .08, d * .75, 0, 2.04, .03);
    box(emit, "frame", "hood-edge", w * .86, .13, .06, 0, 2, d * .39);
    box(emit, "cyan", "slot-neon", w * .7, .035, .04, 0, 1.91, d * .4);
    for (let row = 0; row < 7; row++) box(emit, "frame", "vents", w * .43, .04, .025, 0, .13 + row * .05, d * .305);
    box(emit, "metal", "coin-surround", .22, .15, .045, w * .25, .84, d * .32);
    box(emit, "frame", "coin-slot", .12, .025, .025, w * .25, .84, d * .35);
    tube(emit, "frame", "power-cable", [new THREE.Vector3(-w * .2, .15, -d * .3), new THREE.Vector3(-w * .22, .06, -d * .35), new THREE.Vector3(-w * .3, .05, -d * .4)]);
  }
}

/** Restrained broken reflections in the original water rectangle; no extra pass. */
export function appendKaiWater(w: number, d: number, emit: KaiEmitter) {
  for (let i = 0; i < 24; i++) {
    const x = -w / 2 + (i + .5) * w / 24, z = -d / 2 + .4 + (i % 5) * .32;
    box(emit, i % 4 ? "cyan" : "warm", "broken-reflections", .18 + (i % 3) * .14, .004, .045 + (i % 4) * .025, x, .043, z);
    box(emit, "cyan", "water-ripples", .6 + (i % 3) * .27, .003, .018, x + .2, .043, z + 1.35);
  }
}
