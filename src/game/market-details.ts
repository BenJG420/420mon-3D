import * as THREE from "three";

export type MarketFinish = "frame" | "metal" | "brick" | "wood" | "fabric" | "warm" | "cool" | "leaf";
export type MarketDetailEmitter = (finish: MarketFinish, geometry: THREE.BufferGeometry, feature: string) => void;

function box(emit: MarketDetailEmitter, finish: MarketFinish, feature: string,
  w: number, h: number, d: number, x: number, y: number, z: number) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  geometry.translate(x, y, z); emit(finish, geometry, feature);
}

function cylinder(emit: MarketDetailEmitter, finish: MarketFinish, feature: string,
  radius: number, height: number, x: number, y: number, z: number, alongX = false) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 10);
  if (alongX) geometry.rotateZ(Math.PI / 2);
  geometry.translate(x, y, z); emit(finish, geometry, feature);
}

function cable(emit: MarketDetailEmitter, points: THREE.Vector3[], feature: string) {
  emit("frame", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, .018, 4, false), feature);
}

/** Four faces on the original northern shop masses; no replacement shell or footprint. */
export function appendMarketFacadeDetails(w: number, d: number, h: number, seed: number, emit: MarketDetailEmitter) {
  for (let side = 0; side < 4; side++) {
    const length = side % 2 ? d : w, depth = side % 2 ? w : d;
    const face: MarketDetailEmitter = (finish, geometry, feature) => {
      geometry.rotateY(side * Math.PI / 2); emit(finish, geometry, feature);
    };
    const z = depth / 2;
    // Flat damp course leaves the original lower graffiti band visible.
    box(face, "brick", "damp-course", length, .19, .045, 0, .12, z + .025);
    box(face, "metal", "gutters", length + .1, .045, .13, 0, h - .045, z + .045);
    box(face, "metal", "gutters", length + .1, .1, .025, 0, h - .025, z + .1);
    box(face, "frame", "gutters", length - .08, .018, .07, 0, h - .017, z + .04);
    box(face, "metal", "roof-flashing", length + .1, .06, .09, 0, h + .09, z);
    const columns = Math.min(3, Math.max(1, Math.floor(length / 1.65)));
    const rows = Math.min(4, Math.max(1, Math.floor((h - .45) / 1.55)));
    const paneW = Math.min(.94, length / columns - .48);
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const x = -length / 2 + (col + .5) * length / columns, y = 1.27 + row * 1.55;
      const shutter = row === 0 && (seed + side + col) % 3 === 0;
      box(face, "frame", shutter ? "shutters" : "windows", paneW + .14, 1.02, .055, x, y, z + .035);
      if (shutter) {
        for (let slat = 0; slat < 9; slat++) box(face, "metal", "shutters", paneW, .085, .035, x, y - .4 + slat * .1, z + .08);
        box(face, "frame", "shutters", .24, .04, .045, x, y - .25, z + .11);
      } else {
        const lit: MarketFinish = (seed + side * 3 + col + row * 2) % 5 === 0 ? "warm" : side % 2 ? "cool" : "frame";
        box(face, lit, "windows", paneW, .85, .025, x, y, z + .08);
        box(face, "wood", "window-frames", .045, .9, .045, x, y, z + .1);
        box(face, "wood", "window-frames", paneW + .03, .045, .045, x, y + .15, z + .1);
      }
      box(face, "brick", "window-sills", paneW + .23, .08, .19, x, y - .55, z + .06);
    }
    for (const sign of [-1, 1]) {
      const x = sign * (length / 2 - .12);
      box(face, "brick", "corner-piers", .14, h - .22, .06, x, h / 2, z + .025);
      if (side % 2 === 0) {
        box(face, "metal", "downpipes", .065, h - .15, .065, x + sign * .05, h / 2, z + .11);
        for (let y = .7; y < h - .15; y += 1.6) box(face, "frame", "pipe-clamps", .12, .035, .08, x + sign * .05, y, z + .12);
      }
    }
    cable(face, [new THREE.Vector3(-length / 2 + .2, h - .28, z + .07),
      new THREE.Vector3(0, h - .39, z + .09), new THREE.Vector3(length / 2 - .2, h - .28, z + .07)], "facade-cables");
    if (side === 0) {
      box(face, "frame", "shop-light", Math.min(1.2, length - .4), .12, .09, 0, h - .18, z + .04);
      box(face, seed % 2 ? "warm" : "cool", "shop-light", Math.min(1.05, length - .55), .035, .025, 0, h - .18, z + .1);
    }
  }
  // Restrained ivy on one outer corner, above the shared tag/sticker band.
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.SphereGeometry(.085, 6, 4);
    leaf.scale(1.35, .65, .3); leaf.rotateZ((i % 3 - 1) * .55);
    leaf.translate(-w / 2 + .23 + (i % 2 ? .055 : -.055), .74 + i * .13, d / 2 + .1);
    emit("leaf", leaf, "ivy");
  }
}

/** Inward-facing repairs, trim and service conduit on existing perimeter walls. */
export function appendMarketBoundaryDetails(w: number, d: number, h: number, emit: MarketDetailEmitter) {
  const z = d / 2;
  box(emit, "brick", "wall-repairs", w - .06, .13, .045, 0, .12, z + .02);
  box(emit, "metal", "wall-capping", w, .06, Math.min(d + .1, .5), 0, h + .07, z - Math.min(d, .4) / 2);
  const bays = Math.min(10, Math.max(1, Math.floor(w / 4.7)));
  for (let bay = 0; bay < bays; bay++) {
    const x = -w / 2 + (bay + .5) * w / bays;
    box(emit, "brick", "repair-piers", .17, h - .13, .06, x, h / 2, z + .02);
    if (h > 1) {
      box(emit, "metal", "service-conduit", w / bays - .12, .035, .035, x, h - .22, z + .07);
      box(emit, "frame", "junction-boxes", .23, .25, .085, x, h - .23, z + .04);
      if (bay % 2 === 0) {
        box(emit, "frame", "wall-light", .7, .12, .09, x + .48, h - .48, z + .04);
        box(emit, "warm", "wall-light", .57, .03, .025, x + .48, h - .48, z + .1);
      }
    }
  }
}

/** Trim stays on the existing canopy/counter: original NPC and counter meshes are untouched. */
export function appendMarketStallDetails(kind: string, emit: MarketDetailEmitter) {
  for (let stripe = 0; stripe < 7; stripe++) {
    const x = -1.23 + stripe * .41;
    box(emit, "fabric", "awning-stripes", .19, .025, 1.7, x, 3.044, .73);
    box(emit, "fabric", "awning-valance", .37, .12 + (stripe % 2) * .035, .025, x, 2.97, 1.594);
  }
  for (const z of [-.145, 1.605]) box(emit, "metal", "awning-hem", 2.95, .045, .045, 0, 3.047, z);
  for (const x of [-1.475, 1.475]) box(emit, "metal", "awning-hem", .045, .045, 1.79, x, 3.047, .73);
  box(emit, "frame", "counter-light", 2.35, .065, .08, 0, 2.92, 1.47);
  box(emit, kind === "grow" || kind === "fence" ? "cool" : "warm", "counter-light", 2.17, .02, .035, 0, 2.89, 1.47);
  for (const sign of [-1, 1]) box(emit, "metal", "counter-trim", .06, .68, .065, sign * 1.32, .48, 1.52);
  box(emit, "metal", "counter-trim", 2.7, .055, .035, 0, .19, 1.51);
  // Original jars stay in the centre. Small trade-specific stock occupies only the two free ends.
  const x = 1.13, z = 1.13;
  if (kind === "threads" || kind === "silk") {
    for (let i = 0; i < 3; i++) {
      cylinder(emit, "fabric", "cloth-rolls", .075, .35, x, 1.065 + i * .13, z, true);
      cylinder(emit, "metal", "cloth-roll-cores", .027, .36, x, 1.065 + i * .13, z, true);
    }
  } else if (kind === "noodles") {
    cylinder(emit, "metal", "noodle-pot", .16, .23, x, 1.1, z);
    cylinder(emit, "frame", "noodle-pot-lid", .17, .025, x, 1.23, z);
    box(emit, "metal", "noodle-pot-handles", .4, .035, .055, x, 1.15, z);
    for (let i = 0; i < 3; i++) box(emit, "fabric", "napkin-stack", .2, .015, .2, -x, .995 + i * .018, z);
  } else if (kind === "grow") {
    for (let i = 0; i < 3; i++) {
      box(emit, "fabric", "seed-packets", .16, .22, .025, x - i * .11, 1.1, z + i * .06);
      box(emit, "cool", "packet-labels", .08, .07, .01, x - i * .11, 1.12, z + i * .06 + .018);
    }
  } else if (kind === "chips") {
    for (let i = 0; i < 3; i++) for (let stack = 0; stack < 4; stack++) cylinder(emit,
      i % 2 ? "metal" : "fabric", "chip-stacks", .075, .025, x - i * .16, .995 + stack * .03, z);
  } else {
    box(emit, "frame", "trade-radio", .36, .22, .2, x, 1.1, z);
    box(emit, "metal", "trade-radio-grille", .18, .15, .015, x - .05, 1.1, z + .11);
    box(emit, "cool", "trade-radio-dial", .055, .075, .015, x + .1, 1.13, z + .11);
  }
}

/** High northern shelves clear the original couch and all actors/furniture below. */
export function appendMarketInteriorDetails(w: number, d: number, kind: "silk" | "static", emit: MarketDetailEmitter) {
  const north = -d / 2 + 1.39;
  box(emit, "metal", "interior-conduit", w - 2.2, .045, .045, 0, 2.72, north);
  for (const side of [-1, 1]) {
    const x = side * w * .28;
    box(emit, "wood", "wall-shelves", 2.6, .085, .38, x, 2.1, north + .12);
    for (const offset of [-1, 1]) box(emit, "metal", "shelf-brackets", .06, .22, .27, x + offset, 2.21, north + .06);
    if (kind === "silk") {
      for (let roll = 0; roll < 5; roll++) {
        const cx = x - .95 + roll * .46;
        cylinder(emit, roll % 2 ? "fabric" : "wood", "fabric-rolls", .14, .35, cx, 2.32, north + .15);
        cylinder(emit, "metal", "fabric-cores", .045, .37, cx, 2.32, north + .15);
        box(emit, "fabric", "roll-labels", .1, .055, .015, cx, 2.32, north + .295);
      }
    } else {
      for (let radio = 0; radio < 3; radio++) {
        const cx = x - .83 + radio * .83;
        box(emit, "frame", "radio-cases", .64, .35, .29, cx, 2.32, north + .13);
        for (let slot = 0; slot < 4; slot++) box(emit, "metal", "radio-grilles", .3, .025, .025, cx - .12, 2.22 + slot * .06, north + .29);
        box(emit, "cool", "radio-dials", .17, .08, .02, cx + .19, 2.39, north + .29);
        cylinder(emit, "metal", "radio-aerials", .015, .21, cx + .2, 2.6, north + .05);
      }
    }
  }
  box(emit, "frame", "interior-light", 2.8, .13, .1, 0, 2.55, north + .025);
  box(emit, kind === "silk" ? "warm" : "cool", "interior-light", 2.6, .035, .025, 0, 2.53, north + .09);
  cable(emit, [new THREE.Vector3(-w * .28, 2.64, north + .045), new THREE.Vector3(0, 2.79, north + .04),
    new THREE.Vector3(w * .28, 2.64, north + .045)], "interior-cables");
}
