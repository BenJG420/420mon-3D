import * as THREE from "three";

export type YardFinish = "frame" | "metal" | "brick" | "wood" | "leaf" | "warm" | "cool";
export type YardDetailEmitter = (finish: YardFinish, geometry: THREE.BufferGeometry, feature: string) => void;
const seeded = (n: number) => { const value = Math.sin(n * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };

function box(emit: YardDetailEmitter, finish: YardFinish, feature: string,
  w: number, h: number, d: number, x: number, y: number, z: number) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  geometry.translate(x, y, z); emit(finish, geometry, feature);
}

function leaf(emit: YardDetailEmitter, x: number, y: number, z: number, seed: number) {
  const geometry = new THREE.SphereGeometry(.085, 6, 4);
  geometry.scale(1.35, .6, .3); geometry.rotateZ((seeded(seed) - .5) * 1.8);
  geometry.translate(x, y, z); emit("leaf", geometry, "ivy");
}

/** Repairs and fixtures on the three original solid sheds, with no new footprint. */
export function appendYardShedDetails(w: number, d: number, h: number, seed: number, emit: YardDetailEmitter) {
  const front = d / 2, rear = -d / 2;
  for (const sign of [-1, 1]) {
    box(emit, "metal", "gutters", w, .045, .12, 0, h - .05, sign * (front + .035));
    box(emit, "metal", "gutters", w, .1, .025, 0, h - .025, sign * (front + .085));
    box(emit, "frame", "gutters", w - .1, .015, .06, 0, h - .019, sign * (front + .025));
    box(emit, "metal", "roof-flashing", .09, .09, d + .16, sign * (w / 2), h + .065, 0);
    box(emit, "brick", "damp-course", w - .12, .3, .04, 0, .24, sign * (front + .015));
    box(emit, "wood", "corner-posts", .11, h - .18, .08, sign * (w / 2 - .07), h / 2, front + .035);
    box(emit, "metal", "downpipes", .07, h - .13, .07, sign * (w / 2 - .16), h / 2, rear - .045);
    for (const y of [.45, 1.25, h - .25]) box(emit, "frame", "downpipes", .13, .04, .07, sign * (w / 2 - .16), y, rear - .055);
  }
  // A closed storage shutter is decorative: original doors and interactions stay elsewhere.
  const shutterW = Math.min(1.35, w * .36), shutterX = -w * .22;
  box(emit, "frame", "storage-shutter", shutterW + .15, 1.75, .05, shutterX, .97, front + .025);
  for (let slat = 0; slat < 11; slat++) box(emit, "metal", "storage-shutter", shutterW, .13, .045, shutterX, .22 + slat * .147, front + .065);
  box(emit, "frame", "storage-shutter", .32, .055, .06, shutterX, .75, front + .085);
  for (let plank = 0; plank < 5; plank++) box(emit, "wood", "cladding-repairs", .11, .85 + (plank % 2) * .12, .045, w * .22 - .26 + plank * .13, .75, front + .03);
  // Side panes and rear vents make every camera-facing side read as a small workshop.
  for (const sign of [-1, 1]) {
    const x = sign * (w / 2 + .02);
    box(emit, "frame", "windows", .045, .8, .96, x, 1.35, 0);
    box(emit, (seed + sign) % 2 ? "warm" : "cool", "windows", .025, .62, .78, x + sign * .035, 1.35, 0);
    box(emit, "wood", "windows", .03, .68, .04, x + sign * .055, 1.35, 0);
    box(emit, "wood", "windows", .03, .04, .84, x + sign * .055, 1.35, 0);
    box(emit, "metal", "windows", .15, .06, 1.02, x, .95, 0);
  }
  box(emit, "frame", "ventilation", 1.05, .48, .045, .2, 1.65, rear - .025);
  for (let slat = 0; slat < 5; slat++) box(emit, "metal", "ventilation", .93, .045, .06, .2, 1.49 + slat * .08, rear - .055);
  const cable = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-w / 2 + .2, h - .28, rear - .06),
    new THREE.Vector3(0, h - .48, rear - .06),
    new THREE.Vector3(w / 2 - .2, h - .28, rear - .06),
  ]);
  emit("frame", new THREE.TubeGeometry(cable, 12, .018, 4, false), "cables");
  box(emit, "frame", "grow-light", .94, .14, .09, w * .22, 1.85, front + .025);
  box(emit, "cool", "grow-light", .8, .045, .02, w * .22, 1.85, front + .08);
  for (let i = 0; i < 10; i++) leaf(emit, -w / 2 + .3 + (i % 2 ? .08 : -.08), .3 + i * .16, rear - .045, seed + i);
}

/** Wall-facing decoration; the original low perimeter walls remain low and solid. */
export function appendYardBoundaryDetails(w: number, d: number, h: number, emit: YardDetailEmitter) {
  const face = d / 2, bays = Math.min(20, Math.max(1, Math.floor(w / 5.5)));
  const bayW = w / bays;
  box(emit, "brick", "masonry", w - .08, .18, .045, 0, .21, face + .02);
  box(emit, "metal", "wall-capping", w, .06, Math.min(d + .12, .65), 0, h + .045, face - Math.min(d, .5) / 2);
  for (let bay = 0; bay < bays; bay++) {
    const x = -w / 2 + (bay + .5) * bayW;
    box(emit, "brick", "masonry", .22, h - .13, .06, x - bayW * .4, h / 2, face + .015);
    box(emit, "brick", "pier-caps", .32, .08, .13, x - bayW * .4, h + .045, face - .015);
    for (let row = 0; row < (h > 1 ? 3 : 1); row++) {
      const count = Math.min(8, Math.floor(bayW / .55));
      for (let brick = 0; brick < count; brick++) box(emit, "brick", "masonry", .44, .12, .035,
        x - count * .25 + brick * .5 + (row % 2 ? .12 : 0), .38 + row * .18, face + .025);
    }
    if (h > 1) {
      box(emit, "metal", "conduit", Math.min(bayW - .1, 7), .035, .035, x, h - .35, face + .045);
      if (bay % 3 === 0) {
        box(emit, "frame", "wall-light", .52, .16, .09, x, h - .45, face + .025);
        box(emit, bay % 2 ? "warm" : "cool", "wall-light", .4, .05, .02, x, h - .45, face + .08);
      }
    }
    if (bay % 2 === 0) for (let i = 0; i < (h > 1 ? 8 : 3); i++) leaf(emit, x + .6 + (i % 2 ? .07 : -.07), .24 + i * .18, face + .045, bay * 17 + i);
  }
}

/** High wall storage in Moss's original room, clear of NPCs and existing furniture. */
export function appendMossInteriorDetails(w: number, d: number, emit: YardDetailEmitter) {
  // makeDen's north wall is 22 source pixels (1.32 world units) deep.
  const north = -d / 2 + 1.39;
  box(emit, "metal", "interior-conduit", w - 1.6, .07, .07, 0, 2.73, north);
  for (let x = -w / 2 + 1.2; x < w / 2 - 1; x += 2.6) box(emit, "frame", "interior-conduit", .15, .21, .1, x, 2.73, north);
  for (const side of [-1, 1]) {
    const x = side * w * .28;
    box(emit, "wood", "seed-shelves", 2.5, .09, .38, x, 2.2, north + .12);
    for (const offset of [-1, 1]) box(emit, "metal", "seed-shelves", .06, .23, .27, x + offset, 2.31, north + .06);
    for (let i = 0; i < 6; i++) {
      const jar = new THREE.CylinderGeometry(.11, .105, .26, 8);
      jar.translate(x - .98 + i * .39, 2.385, north + .15); emit(i % 2 ? "leaf" : "brick", jar, "seed-jars");
      const lid = new THREE.CylinderGeometry(.115, .115, .035, 8);
      lid.translate(x - .98 + i * .39, 2.53, north + .15); emit("metal", lid, "seed-jars");
    }
  }
  box(emit, "frame", "interior-grow-light", 3.15, .15, .11, 0, 2.53, north + .04);
  box(emit, "warm", "interior-grow-light", 2.95, .035, .025, 0, 2.51, north + .105);
}
