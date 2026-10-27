import * as THREE from "three";

export type NischeFinish = "stone" | "metal" | "dark" | "fabric" | "paper" | "glow" | "wood";
export type NischeDetailEmitter = (finish: NischeFinish, geometry: THREE.BufferGeometry, feature: string) => void;
type Point = [number, number, number];

function box(emit: NischeDetailEmitter, finish: NischeFinish, feature: string, size: Point, position: Point) {
  const geometry = new THREE.BoxGeometry(...size);
  geometry.translate(...position); emit(finish, geometry, feature);
}
function rod(emit: NischeDetailEmitter, finish: NischeFinish, feature: string, a: Point, b: Point, radius = .018) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  if (delta.lengthSq() < 1e-8) return;
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), 6);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); emit(finish, geometry, feature);
}

/** Shallow local +Z club/service facades, also suitable for narrow partition ends. */
export function appendNischeWallDetails(w: number, d: number, h: number, seed: number, emit: NischeDetailEmitter) {
  const z = d / 2, bays = Math.max(1, Math.min(6, Math.floor(w / 2.5))), bay = w / bays;
  box(emit, "dark", "scuffed-plinth", [w, .18, .025], [0, .13, z + .016]);
  box(emit, "metal", "cap-flashing", [w, .05, .09], [0, h + .087, z + .025]);
  box(emit, "dark", "cap-channel", [w, .016, .04], [0, h + .112, z + .041]);
  const pipeY = Math.max(.36, h - .24);
  rod(emit, "metal", "service-conduit", [-w / 2 + .055, pipeY, z + .065], [w / 2 - .055, pipeY, z + .065], .021);
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (i + .5) * bay, width = Math.min(1.5, bay * .7);
    box(emit, "stone", "plaster-repairs", [width, Math.min(.29, h * .3), .025], [x, .35, z + .018]);
    box(emit, "metal", "conduit-clamps", [.055, .1, .08], [x, pipeY, z + .048]);
    if (h < 1.5 || bay < .65) continue;
    if ((i + seed) % 3 === 0) {
      box(emit, "dark", "upholstered-panel-frame", [width, 1.04, .045], [x, 1.05, z + .028]);
      box(emit, "fabric", "upholstered-wall-panel", [width - .08, .95, .03], [x, 1.05, z + .064]);
      for (const sx of [-1, 1]) box(emit, "metal", "panel-piping", [.016, .88, .012], [x + sx * (width / 2 - .075), 1.05, z + .087]);
      for (const y of [.83, 1.27]) box(emit, "dark", "panel-buttons", [.034, .034, .012], [x, y, z + .087]);
    } else if ((i + seed) % 3 === 1) {
      box(emit, "dark", "vent-surround", [width * .82, .54, .035], [x, 1.2, z + .025]);
      for (let row = 0; row < 5; row++) box(emit, "metal", "vent-louvres", [width * .75, .055, .04], [x, 1 + row * .1, z + .063]);
      box(emit, "stone", "wall-patch", [width * .54, .13, .018], [x, .63, z + .022]);
    } else {
      const pw = Math.min(.47, width * .8);
      box(emit, "dark", "notice-frame", [pw + .05, .6, .025], [x, 1.08, z + .024]);
      box(emit, "stone", "club-notice", [pw, .54, .014], [x, 1.08, z + .047]);
      box(emit, "fabric", "notice-header", [pw * .8, .085, .008], [x, 1.25, z + .06]);
      for (let row = 0; row < 3; row++) box(emit, "dark", "notice-lines", [pw * (.75 - row * .1), .017, .008], [x, 1.08 - row * .07, z + .06]);
    }
    box(emit, "dark", "clerestory-frame", [width, .23, .04], [x, h - .5, z + .025]);
    box(emit, "glow", "rose-clerestory", [width - .08, .12, .016], [x, h - .5, z + .055]);
    box(emit, "metal", "window-mullion", [.026, .18, .03], [x, h - .5, z + .077]);
  }
  if (h < 1.5 || w < .9) return;
  const inset = Math.min(.22, w * .18);
  for (const sign of [-1, 1]) {
    const x = sign * (w / 2 - inset);
    rod(emit, "metal", "downpipes", [x, .18, z + .065], [x, h - .25, z + .065], .027);
    box(emit, "metal", "pipe-bracket", [.085, .04, .09], [x, .48, z + .049]);
  }
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-w / 2 + inset, h - .12, z + .062),
    new THREE.Vector3(0, h - .3, z + .07),
    new THREE.Vector3(w / 2 - inset, h - .12, z + .062),
  ]);
  emit("dark", new THREE.TubeGeometry(curve, 8, .012, 5, false), "service-cable");
  const strip = Math.min(1.6, w * .44);
  box(emit, "dark", "neon-housing", [strip, .1, .05], [0, h - .075, z + .03]);
  box(emit, "glow", "pink-neon-strip", [strip - .1, .027, .015], [0, h - .075, z + .065]);
}

/** All fittings stay inside the existing fence rectangles, including the two trainer gate sides. */
export function appendNischePartitionDetails(w: number, d: number, gate: boolean, seed: number, emit: NischeDetailEmitter) {
  const length = Math.max(w, d), depth = Math.min(w, d);
  const panel: NischeDetailEmitter = (finish, geometry, feature) => {
    if (d > w) geometry.rotateY(Math.PI / 2);
    emit(finish, geometry, feature);
  };
  const end = length / 2 - .08, side = gate ? depth / 2 - .08 : 0;
  const faces = gate ? [-side, side] : [0];
  for (const z of faces) {
    for (const sign of [-1, 1]) {
      box(panel, "dark", "partition-feet", [.13, .06, .13], [sign * end, .03, z]);
      box(panel, "metal", "partition-posts", [.065, 1.49, .065], [sign * end, .785, z]);
      box(panel, "metal", "post-finials", [.1, .04, .1], [sign * end, 1.55, z]);
    }
    for (const y of [.19, 1.51]) box(panel, "metal", "partition-rails", [end * 2, .055, .055], [0, y, z]);
    if (gate) {
      const bars = Math.max(2, Math.min(28, Math.floor(length / .22)));
      for (let i = 1; i < bars; i++) box(panel, "dark", "gate-pickets", [.03, 1.24, .03], [-end + i * end * 2 / bars, .85, z]);
      rod(panel, "metal", "gate-brace", [-end + .1, seed % 2 ? .27 : 1.4, z], [end - .1, seed % 2 ? 1.4 : .27, z], .018);
      box(panel, "glow", "gate-marker", [.19, .05, .018], [-end + .2, 1.51, z + .04]);
    }
  }
  if (gate) {
    for (const sign of [-1, 1]) for (const y of [.19, 1.51]) box(panel, "metal", "gate-end-rails", [.055, .055, side * 2], [sign * end, y, 0]);
    return;
  }
  // Closed, gently pleated cloth has normals on both sides, without alpha passes.
  const clothLength = length - .27, sections = Math.min(64, Math.max(8, Math.ceil(clothLength / .2)));
  const cloth = new THREE.BoxGeometry(clothLength, 1.17, .028, sections, 4, 1);
  const vertices = cloth.getAttribute("position"), waves = Math.max(3, Math.round(clothLength / .48));
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), phase = (x / clothLength + .5) * waves * Math.PI * 2;
    vertices.setZ(i, vertices.getZ(i) + Math.sin(phase) * .045);
    if (y < -.5) vertices.setY(i, y + .017 * Math.cos(phase));
  }
  cloth.computeVertexNormals(); cloth.translate(0, .845, 0); panel("fabric", cloth, "pleated-privacy-fabric");
  for (const sign of [-1, 1]) {
    box(panel, "dark", "fabric-hem", [clothLength, .022, .014], [0, .285, sign * .066]);
    const stitches = Math.min(32, Math.max(6, Math.floor(clothLength / .3)));
    for (let i = 0; i < stitches; i++) box(panel, "metal", "fabric-stitches", [.027, .009, .008], [-clothLength / 2 + (i + .5) * clothLength / stitches, .3, sign * .076]);
    box(panel, "glow", "booth-rail-accent", [Math.min(1.8, clothLength * .45), .022, .012], [0, 1.51, sign * .037]);
  }
}

/** Small hardware and worn plank lids on the three retained searchable crates. */
export function appendNischeCrateDetails(w: number, d: number, emit: NischeDetailEmitter) {
  const planks = Math.max(2, Math.ceil(w / .24));
  for (let i = 0; i < planks; i++) box(emit, "wood", "crate-lid-planks", [w / planks - .014, .04, d - .05], [-w / 2 + (i + .5) * w / planks, .65, 0]);
  for (const sign of [-1, 1]) {
    for (const y of [.18, .53]) box(emit, "metal", "crate-bands", [w - .05, .05, .03], [0, y, sign * (d / 2 + .02)]);
    for (const sx of [-1, 1]) {
      box(emit, "dark", "crate-corner-brackets", [.055, .5, .04], [sx * (w / 2 - .06), .35, sign * (d / 2 + .025)]);
      box(emit, "metal", "crate-rivets", [.023, .023, .012], [sx * (w / 2 - .06), .51, sign * (d / 2 + .052)]);
    }
  }
  box(emit, "paper", "crate-label", [Math.min(.32, w * .4), .19, .013], [0, .37, d / 2 + .03]);
  for (let i = 0; i < 3; i++) box(emit, "dark", "crate-label-lines", [Math.min(.25, w * .32) - i * .025, .014, .008], [0, .42 - i * .05, d / 2 + .042]);
}

/** Low textile edging and wear within each original pink encounter zone. */
export function appendNischeFloorDetails(w: number, d: number, seed: number, emit: NischeDetailEmitter) {
  const inset = .28;
  for (const sign of [-1, 1]) {
    box(emit, "fabric", "rug-binding", [w - 2 * inset, .004, .055], [0, .048, sign * (d / 2 - inset)]);
    box(emit, "fabric", "rug-binding", [.055, .004, d - 2 * inset], [sign * (w / 2 - inset), .048, 0]);
    for (let i = 0; i < 12; i++) box(emit, "paper", "rug-stitches", [.028, .004, .016], [(-.5 + (i + .5) / 12) * (w - .9), .048, sign * (d / 2 - .36)]);
  }
  for (let i = 0; i < 18; i++) {
    const x = ((i * 7 + seed * 3) % 19 / 19 - .5) * (w - 1.5), z = ((i * 5 + seed) % 17 / 17 - .5) * (d - 1.5);
    const scuff = new THREE.BoxGeometry(.16 + (i % 4) * .06, .004, .022);
    scuff.rotateY((i + seed) * .67); scuff.translate(x, .046, z); emit("dark", scuff, "rug-wear");
  }
}
