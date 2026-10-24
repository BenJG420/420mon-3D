import * as THREE from "three";

export type CableFinish = "shell" | "cap" | "metal" | "rubber" | "copper" | "green" | "amber";
export type CableDetailEmitter = (finish: CableFinish, geometry: THREE.BufferGeometry, feature: string) => void;
type Point = [number, number, number];
const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

function box(emit: CableDetailEmitter, finish: CableFinish, feature: string,
  size: Point, position: Point, turn = 0) {
  const geometry = new THREE.BoxGeometry(...size);
  if (turn) geometry.rotateZ(turn);
  geometry.translate(...position); emit(finish, geometry, feature);
}
function rod(emit: CableDetailEmitter, finish: CableFinish, feature: string, a: Point, b: Point, radius = .035) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), 8);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); emit(finish, geometry, feature);
}
function cable(emit: CableDetailEmitter, finish: CableFinish, feature: string, points: Point[], radius = .022) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  emit(finish, new THREE.TubeGeometry(curve, 12, radius, 5, false), feature);
}

/** The original solid rectangles become service racks; low teeth stay low. */
export function appendCableRackDetails(w: number, d: number, h: number, seed: number, emit: CableDetailEmitter) {
  const tall = h > 1, rows = tall ? 6 : 2;
  box(emit, "shell", "cabinet-body", [w, h, d], [0, h / 2, 0]);
  box(emit, "cap", "service-roof", [w, .07, d], [0, h + .035, 0]);
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    box(emit, "metal", "corner-rails", [.09, h - .06, .09], [x * (w / 2 - .035), h / 2, z * (d / 2 + .015)]);
  }
  for (const sign of [-1, 1]) {
    const face = sign * (d / 2 + .035);
    for (let row = 0; row < rows; row++) {
      const y = tall ? .38 + row * .38 : .24 + row * .28;
      box(emit, "rubber", "rack-slots", [w - .3, tall ? .25 : .19, .055], [0, y, face]);
      for (const x of [-1, 1]) box(emit, "metal", "rack-handles", [.12, .035, .055], [x * (w / 2 - .3), y, face + sign * .04]);
      box(emit, "green", "status-lights", [.065, .045, .025], [w * .22, y, face + sign * .04]);
      box(emit, "amber", "status-lights", [.1, .025, .025], [-w * .2, y, face + sign * .04]);
    }
    // Recessed side doors and short louvers keep the long cabinet sides readable.
    const side = sign * (w / 2 + .025);
    box(emit, "rubber", "side-panels", [.04, h - .22, Math.max(.3, d - .4)], [side, h / 2, 0]);
    box(emit, "metal", "side-panels", [.035, h - .3, .045], [side + sign * .025, h / 2, 0]);
    for (let slat = 0; slat < (tall ? 5 : 3); slat++) {
      box(emit, "metal", "ventilation", [.035, .035, Math.min(1.2, d * .55)], [side + sign * .025, .24 + slat * .105, -.15]);
    }
    for (const y of [.15, h - .14]) box(emit, "metal", "fasteners", [.04, .045, .045], [side + sign * .026, y, d / 2 - .2]);
  }
  // Small fan rings/blades sit on the upper front, within the cabinet silhouette.
  if (tall) for (const x of [-w * .22, w * .22]) {
    const fan = new THREE.TorusGeometry(.17, .021, 5, 12);
    fan.translate(x, h - .3, d / 2 + .055); emit("metal", fan, "cooling-fans");
    for (let blade = 0; blade < 3; blade++) box(emit, "rubber", "cooling-fans", [.26, .055, .025], [x, h - .3, d / 2 + .05], blade * Math.PI / 3);
  }
  for (let i = 0; i < 2; i++) {
    const x = -w * .12 + i * w * .2, top = tall ? h - .55 : .63, bottom = tall ? top - .58 : .35;
    const face = -d / 2 - .065;
    cable(emit, i ? "copper" : "rubber", "patch-cables", [[x, top, face], [x - .13, bottom, face], [x + .23, bottom - .015, face], [x + .29, top - .08, face]]);
    box(emit, "metal", "patch-connectors", [.09, .075, .035], [x, top, face]);
  }
  // Lid seams and a flush inspection plate use the dedicated PBR cap finish.
  box(emit, "rubber", "lid-seams", [.025, .012, d - .12], [0, h + .078, 0]);
  for (const z of [-1, 1]) box(emit, "metal", "lid-fasteners", [w - .3, .015, .04], [0, h + .079, z * (d / 2 - .15)]);
  const labelX = (seeded(seed) - .5) * w * .4;
  box(emit, "amber", "inspection-label", [.24, .012, .12], [labelX, h + .079, d * .23]);
}

/** Service layers on the room-facing side; the original wall remains the solid. */
export function appendCableWallDetails(w: number, d: number, h: number, emit: CableDetailEmitter) {
  const face = d / 2, top = Math.max(.35, h - .28), bays = Math.min(12, Math.max(1, Math.floor(w / 4)));
  box(emit, "rubber", "damp-course", [Math.max(.1, w - .06), .18, .035], [0, .2, face + .02]);
  rod(emit, "copper", "service-conduit", [-w / 2 + .1, top, face + .06], [w / 2 - .1, top, face + .06]);
  if (h > 1) rod(emit, "metal", "service-conduit", [-w / 2 + .1, top - .18, face + .055], [w / 2 - .1, top - .18, face + .055], .024);
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (i + .5) * w / bays;
    box(emit, "metal", "pipe-brackets", [.11, .16, .065], [x, top, face + .055]);
    if (h > 1 && i % 3 === 0) {
      const y = Math.min(1.35, h - .5);
      box(emit, "metal", "junction-boxes", [.42, .5, .12], [x, y, face + .035]);
      box(emit, "rubber", "junction-boxes", [.33, .38, .025], [x, y, face + .105]);
      box(emit, "amber", "warning-markers", [.16, .1, .015], [x, y + .07, face + .125]);
      rod(emit, "copper", "service-conduit", [x, y + .25, face + .055], [x, top, face + .055], .025);
    }
    if (i % 2 === 0) box(emit, "amber", "warning-markers", [.26, .035, .025], [x + Math.min(.3, w / 8), .38, face + .045]);
  }
}

/** Electrical trench stays inside the original blocked rectangle and low to the floor. */
export function appendCableLiveDetails(w: number, d: number, emit: CableDetailEmitter) {
  box(emit, "shell", "electrical-trench", [w, .12, d], [0, .06, 0]);
  const bays = Math.min(20, Math.max(1, Math.ceil(w / 3.2))), bay = w / bays;
  for (const sign of [-1, 1]) {
    box(emit, "rubber", "warning-edge", [w, .025, .24], [0, .136, sign * (d / 2 - .12)]);
    for (let i = 0; i < bays; i++) box(emit, "amber", "warning-edge", [Math.min(.7, bay * .5), .012, .2], [-w / 2 + (i + .5) * bay, .154, sign * (d / 2 - .12)]);
  }
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (i + .5) * bay;
    box(emit, "metal", "trench-separators", [.065, .16, d - .5], [x - bay / 2 + .08, .14, 0]);
    for (let row = 0; row < 3; row++) {
      const z = (row - 1) * Math.min(.8, d * .2);
      rod(emit, "copper", "live-conduits", [x - bay * .42, .2, z], [x + bay * .42, .2, z], .045);
      box(emit, "green", "live-core", [bay * .62, .025, .035], [x, .251, z]);
    }
  }
}

/** Connectors and trailing leads dress the four existing interactive terminals. */
export function appendCableTerminalDetails(w: number, _d: number, emit: CableDetailEmitter) {
  // The existing terminal body is .82 deep regardless of its source object rectangle.
  const side = w * .42, rear = -.45;
  for (const sign of [-1, 1]) {
    box(emit, "metal", "terminal-rails", [.045, .58, .04], [sign * side, .98, -.15]);
    for (let slot = 0; slot < 4; slot++) box(emit, "rubber", "terminal-vents", [.025, .035, .2], [sign * (w / 2 + .013), .2 + slot * .07, .08]);
  }
  cable(emit, "rubber", "terminal-lead", [[w * .3, .8, rear], [w * .37, .4, rear], [w * .22, .11, rear], [-w * .13, .1, rear]], .018);
  for (let plug = 0; plug < 3; plug++) {
    box(emit, "metal", "terminal-ports", [.09, .075, .04], [-w * .2 + plug * .16, .62, .435]);
    box(emit, "green", "terminal-status", [.035, .025, .012], [-w * .2 + plug * .16, .64, .46]);
  }
}
