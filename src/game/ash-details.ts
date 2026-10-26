import * as THREE from "three";

export type AshFinish = "frame" | "metal" | "brick" | "wood" | "soot" | "amber" | "cool";
export type AshDetailEmitter = (finish: AshFinish, geometry: THREE.BufferGeometry, feature: string) => void;
type Point = [number, number, number];

function box(emit: AshDetailEmitter, finish: AshFinish, feature: string, size: Point, position: Point) {
  const geometry = new THREE.BoxGeometry(...size); geometry.translate(...position); emit(finish, geometry, feature);
}
function rod(emit: AshDetailEmitter, finish: AshFinish, feature: string, a: Point, b: Point, radius = .025) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), 8);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); emit(finish, geometry, feature);
}
function cable(emit: AshDetailEmitter, points: Point[]) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  emit("soot", new THREE.TubeGeometry(curve, 10, .022, 5, false), "sagging-cables");
}

/** Four-sided scorched warehouse dressing; the source solid remains the building. */
export function appendAshFacadeDetails(w: number, d: number, h: number, seed: number, emit: AshDetailEmitter) {
  for (let side = 0; side < 4; side++) {
    const length = side % 2 ? d : w, depth = side % 2 ? w : d, z = depth / 2;
    const face: AshDetailEmitter = (finish, geometry, feature) => {
      geometry.rotateY(side * Math.PI / 2); emit(finish, geometry, feature);
    };
    const bays = Math.min(8, Math.max(1, Math.floor(length / 2.8))), bay = length / bays;
    box(face, "soot", "rain-darkened-plinth", [length, .23, .055], [0, .16, z + .028]);
    box(face, "brick", "roof-edge", [length, .16, .21], [0, h + .13, z]);
    box(face, "metal", "gutter", [length, .09, .17], [0, h - .04, z + .09]);
    box(face, "frame", "gutter-channel", [length, .025, .1], [0, h + .015, z + .11]);
    for (const sign of [-1, 1]) {
      const x = sign * Math.max(.15, length / 2 - .28);
      rod(face, "metal", "downpipes", [x, .21, z + .17], [x, h - .04, z + .17], .048);
      for (const y of [.55, h * .53, h - .34]) box(face, "frame", "pipe-clamps", [.16, .045, .11], [x, y, z + .17]);
      box(face, "brick", "corner-repairs", [.23, h - .12, .08], [x + sign * .16, h / 2, z + .025]);
    }
    const rows = h > 5.3 ? 2 : 1;
    for (let i = 0; i < bays; i++) {
      const x = -length / 2 + (i + .5) * bay, paneW = Math.max(.3, Math.min(1.32, bay - .56));
      for (let row = 0; row < rows; row++) {
        const y = 2.42 + row * 1.78, paneH = Math.min(1.08, h - y - .36);
        if (paneH < .35) continue;
        box(face, "frame", "window-surrounds", [paneW + .16, paneH + .15, .075], [x, y, z + .035]);
        const lit = (i + row + seed + side) % 5;
        box(face, lit === 0 ? "amber" : lit === 3 ? "cool" : "soot", "warehouse-panes", [paneW, paneH, .025], [x, y, z + .087]);
        box(face, "metal", "window-mullions", [.035, paneH, .04], [x, y, z + .113]);
        box(face, "metal", "window-mullions", [paneW, .035, .04], [x, y, z + .113]);
        box(face, "brick", "window-sills", [paneW + .24, .08, .21], [x, y - paneH / 2 - .08, z + .08]);
        if ((i + side + seed) % 4 === 1) {
          const board = new THREE.BoxGeometry(paneW * 1.02, .16, .045);
          board.rotateZ(.16); board.translate(x, y, z + .15); face("wood", board, "boarded-panes");
        }
      }
      if ((i + side + seed) % 3 === 0 && bay > 2) {
        const gateW = Math.min(1.7, bay - .55);
        box(face, "frame", "service-door-surround", [gateW + .14, 1.78, .08], [x, .97, z + .045]);
        for (let slat = 0; slat < 10; slat++) box(face, "metal", "roller-shutters", [gateW, .13, .045], [x, .24 + slat * .145, z + .11]);
        box(face, "frame", "shutter-handles", [.22, .045, .065], [x, .74, z + .15]);
        box(face, "amber", "door-warning", [.18, .13, .014], [x + gateW * .3, 1.42, z + .14]);
      } else {
        box(face, "brick", "repaired-masonry", [Math.min(1.3, bay - .25), .32, .035], [x, .48, z + .035]);
        for (let seam = 0; seam < 3; seam++) box(face, "soot", "mortar-repairs", [.018, .3, .012], [x + (seam - 1) * .36, .48, z + .058]);
      }
    }
    cable(face, [[-length / 2 + .35, h - .55, z + .13], [0, h - .82, z + .17], [length / 2 - .35, h - .55, z + .13]]);
    const signW = Math.min(2.4, length * .55);
    box(face, "frame", "industrial-sign-casing", [signW, .23, .12], [0, h - .36, z + .08]);
    box(face, "amber", "industrial-neon", [signW - .16, .035, .025], [0, h - .36, z + .155]);
  }
}

/** Low partitions and perimeter repairs, facing local positive Z. */
export function appendAshBoundaryDetails(w: number, d: number, h: number, seed: number, emit: AshDetailEmitter) {
  const z = d / 2, bays = Math.min(12, Math.max(1, Math.ceil(w / 3.5))), bay = w / bays;
  box(emit, "soot", "soot-plinth", [w, .16, .035], [0, .13, z + .02]);
  box(emit, "metal", "wall-flashing", [w, .045, .12], [0, h + .075, z]);
  rod(emit, "metal", "wall-conduit", [-w / 2 + .05, Math.max(.3, h - .2), z + .065], [w / 2 - .05, Math.max(.3, h - .2), z + .065], .025);
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (i + .5) * bay, width = Math.max(.08, Math.min(1.25, bay - .13));
    box(emit, "brick", "wall-patches", [width, Math.min(.28, h * .35), .04], [x, .37, z + .026]);
    box(emit, "metal", "conduit-brackets", [.09, .11, .065], [x, Math.max(.3, h - .2), z + .065]);
    if (h > 1.5 && (i + seed) % 3 === 0) {
      box(emit, "frame", "junction-casing", [.32, .46, .12], [x, 1.05, z + .07]);
      box(emit, "metal", "junction-cover", [.26, .37, .025], [x, 1.05, z + .145]);
      box(emit, "amber", "junction-warning", [.12, .08, .015], [x, 1.1, z + .164]);
    }
  }
}

/** Charcoal beds and iron rims stay low inside the original blocked hot areas. */
export function appendAshEmberDetails(w: number, d: number, seed: number, emit: AshDetailEmitter) {
  box(emit, "soot", "ember-bed", [w, .12, d], [0, .06, 0]);
  for (const sign of [-1, 1]) {
    box(emit, "metal", "fire-bed-rim", [w, .12, .08], [0, .16, sign * (d / 2 - .04)]);
    box(emit, "metal", "fire-bed-rim", [.08, .12, d], [sign * (w / 2 - .04), .16, 0]);
  }
  const cols = Math.min(10, Math.max(2, Math.floor(w / .85))), rows = Math.min(6, Math.max(1, Math.floor(d / .8)));
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const x = -w / 2 + (col + .5) * w / cols, z = -d / 2 + (row + .5) * d / rows;
    const lump = new THREE.DodecahedronGeometry(.19 + ((col + row + seed) % 3) * .035, 0);
    // Polyhedra are non-indexed; use matching attributes for the shared box/rock batch.
    lump.setIndex(Array.from({ length: lump.getAttribute("position").count }, (_, index) => index));
    lump.scale(1.25, .44, .9); lump.rotateY(col * .8 + row); lump.translate(x, .19, z); emit("soot", lump, "charred-clinker");
    if ((row + col + seed) % 3 !== 0) box(emit, "amber", "ember-seams", [Math.min(.34, w / cols * .6), .018, .045], [x, .15, z + .18]);
  }
  // Iron cross straps read as heat-worn containment, without adding a tall fence.
  for (let i = 0; i < Math.min(7, Math.ceil(w / 2.8)); i++) {
    const x = -w / 2 + (i + .5) * w / Math.min(7, Math.ceil(w / 2.8));
    box(emit, "frame", "heat-bed-straps", [.055, .045, d - .12], [x, .242, 0]);
  }
}

/** Small original furnishings gain fittings without replacing their interaction shells. */
export function appendAshPropDetails(w: number, d: number, kind: "barrel" | "crate" | "terminal", emit: AshDetailEmitter) {
  if (kind === "barrel") {
    const radius = w * .445;
    for (const y of [.23, .72]) {
      const hoop = new THREE.TorusGeometry(radius, .025, 5, 16); hoop.rotateX(Math.PI / 2); hoop.translate(0, y, 0); emit("metal", hoop, "barrel-hoops");
    }
    const lid = new THREE.CylinderGeometry(w * .395, w * .395, .025, 16); lid.translate(0, .96, 0); emit("soot", lid, "ash-stained-lid");
    box(emit, "metal", "barrel-bung", [.12, .025, .12], [w * .18, .985, 0]);
    box(emit, "amber", "barrel-marking", [.2, .12, .02], [0, .48, w * .432]);
  } else if (kind === "crate") {
    for (const sign of [-1, 1]) {
      box(emit, "wood", "crate-slats", [w - .12, .075, .035], [0, .2, sign * (d / 2 + .025)]);
      box(emit, "wood", "crate-slats", [w - .12, .075, .035], [0, .43, sign * (d / 2 + .025)]);
      for (const x of [-w * .32, w * .32]) box(emit, "metal", "crate-rivets", [.035, .035, .025], [x, .51, sign * (d / 2 + .05)]);
    }
    box(emit, "soot", "crate-stencil", [.26, .14, .015], [0, .38, d / 2 + .052]);
  } else {
    for (const sign of [-1, 1]) {
      for (let vent = 0; vent < 4; vent++) box(emit, "soot", "terminal-vents", [.018, .035, .3], [sign * (w / 2 + .015), .18 + vent * .09, -.02]);
      box(emit, "metal", "terminal-side-rail", [.035, .64, .06], [sign * (w / 2 - .03), .37, .42]);
    }
    box(emit, "metal", "terminal-service-cover", [w * .35, .22, .025], [0, .27, .425]);
    box(emit, "amber", "terminal-warning", [.12, .08, .015], [0, .29, .447]);
    cable(emit, [[w * .25, .6, -.43], [w * .3, .16, -.5], [-w * .2, .07, -.53]]);
  }
}
