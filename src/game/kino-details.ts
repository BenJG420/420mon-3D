import * as THREE from "three";

export type KinoFinish = "frame" | "metal" | "fabric" | "wood" | "warm" | "cool" | "rubber";
export type KinoDetailEmitter = (finish: KinoFinish, geometry: THREE.BufferGeometry, feature: string) => void;
type Point = [number, number, number];

function box(emit: KinoDetailEmitter, finish: KinoFinish, feature: string, size: Point, position: Point) {
  const geometry = new THREE.BoxGeometry(...size); geometry.translate(...position); emit(finish, geometry, feature);
}
function cable(emit: KinoDetailEmitter, points: Point[], feature: string, radius = .018) {
  emit("rubber", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point))), 12, radius, 5, false), feature);
}
function speakerCone(emit: KinoDetailEmitter, x: number, y: number, z: number, radius: number) {
  const ring = new THREE.TorusGeometry(radius, .025, 5, 16);
  ring.translate(x, y, z); emit("metal", ring, "speaker-rims");
  const cone = new THREE.CylinderGeometry(radius * .9, radius * .4, .1, 16);
  cone.rotateX(Math.PI / 2); cone.translate(x, y, z - .03); emit("rubber", cone, "speaker-cones");
}

/** Acoustic panels and service hardware remain attached to the original walls. */
export function appendKinoWallDetails(w: number, d: number, h: number, emit: KinoDetailEmitter) {
  for (let side = 0; side < 4; side++) {
    const length = side % 2 ? d : w, depth = side % 2 ? w : d;
    const face: KinoDetailEmitter = (finish, geometry, feature) => {
      geometry.rotateY(side * Math.PI / 2); emit(finish, geometry, feature);
    };
    const z = depth / 2, bays = Math.min(12, Math.max(1, Math.floor(length / 2.8)));
    box(face, "wood", "scuffed-skirting", [Math.max(.08, length - .04), .16, .05], [0, .12, z + .026]);
    box(face, "metal", "skirting-trim", [Math.max(.08, length - .06), .022, .02], [0, .22, z + .055]);
    // Narrow end faces and the low southern wall do not receive oversized panels.
    if (length < .9 || h < 1) continue;
    box(face, "metal", "service-conduit", [length - .14, .035, .035], [0, h - .22, z + .055]);
    for (let bay = 0; bay < bays; bay++) {
      const x = -length / 2 + (bay + .5) * length / bays;
      const panelW = Math.min(1.55, length / bays - .24), panelH = Math.min(1.15, h - .8), y = .55 + panelH / 2;
      box(face, "frame", "acoustic-frames", [panelW + .08, panelH + .08, .06], [x, y, z + .04]);
      box(face, "fabric", "acoustic-panels", [panelW, panelH, .035], [x, y, z + .086]);
      for (let slat = 0; slat < 5; slat++) {
        box(face, "wood", "acoustic-grilles", [.018, panelH - .04, .025], [x + (slat - 2) * panelW / 5, y, z + .12]);
      }
      box(face, "metal", "conduit-brackets", [.1, .1, .055], [x, h - .22, z + .055]);
      if (bay % 3 === 0) {
        box(face, "frame", "wall-luminaires", [.42, .12, .09], [x, h - .48, z + .055]);
        box(face, "warm", "wall-luminaires", [.34, .035, .025], [x, h - .48, z + .115]);
      }
    }
  }
}

/** A shallow stage occupies the existing blocked projection rectangle. */
export function appendKinoStageDetails(w: number, d: number, h: number, emit: KinoDetailEmitter) {
  const front = d / 2;
  box(emit, "wood", "stage-fascia", [w - .1, Math.max(.1, h - .06), .045], [0, h / 2, front + .025]);
  box(emit, "metal", "stage-nosing", [w - .06, .035, .11], [0, h + .09, front - .015]);
  box(emit, "rubber", "stage-edge", [w - .16, .018, .06], [0, h + .112, front - .025]);
  for (let i = 0; i < 12; i++) {
    const x = -w / 2 + (i + .5) * w / 12;
    box(emit, "warm", "stage-markers", [.2, .035, .012], [x, h * .55, front + .054]);
  }
  for (const sign of [-1, 1]) {
    const x = sign * (w / 2 - .45);
    cable(emit, [[x, h + .13, -d * .35], [x - sign * .18, h + .13, 0], [x, h + .13, d * .35]], "stage-cables", .022);
    box(emit, "frame", "stage-patch-box", [.32, .12, .22], [x, h + .16, -d * .3]);
    box(emit, "cool", "stage-patch-status", [.055, .025, .015], [x, h + .18, -d * .3 + .12]);
  }
}

/** All dressing surrounds, rather than replaces, the retained 33×3.9 screen. */
export function appendKinoScreenDetails(emit: KinoDetailEmitter) {
  for (const x of [-16.55, 16.55]) box(emit, "frame", "screen-frame", [.18, 4.03, .2], [x, 2.1, .18]);
  for (const y of [.115, 4.085]) box(emit, "frame", "screen-frame", [33.28, .12, .2], [0, y, .18]);
  box(emit, "metal", "curtain-track", [38.1, .07, .12], [0, 4.19, .1]);
  box(emit, "wood", "screen-plinth-trim", [33.3, .12, .12], [0, .39, .22]);
  for (const sign of [-1, 1]) {
    // Smooth, corrugated cloth geometry reads as folded velvet, not box strips.
    const curtain = new THREE.PlaneGeometry(2.22, 3.75, 24, 6);
    const positions = curtain.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i);
      positions.setZ(i, .13 * Math.cos((x / 2.22 + .5) * Math.PI * 12) + .025 * Math.sin(y * 1.5));
    }
    curtain.computeVertexNormals(); curtain.translate(sign * 17.78, 2.285, .3); emit("fabric", curtain, "pleated-curtains");
    box(emit, "warm", "curtain-ties", [2.17, .055, .025], [sign * 17.78, 1.4, .47]);
    const x = sign * 19.45;
    box(emit, "frame", "speaker-feet", [.69, .12, .4], [x, .41, .02]);
    box(emit, "frame", "speaker-cabinets", [.78, 2.08, .48], [x, 1.5, .02]);
    for (const y of [1, 1.98]) speakerCone(emit, x, y, .29, .27);
    for (let bar = 0; bar < 9; bar++) {
      box(emit, "metal", "speaker-grilles", [.64, .014, .02], [x, .67 + bar * .2, .33]);
    }
    box(emit, "cool", "speaker-status", [.055, .025, .015], [x + .22, .56, .27]);
    cable(emit, [[x, .58, -.24], [x + sign * .22, .43, -.25], [sign * 18.9, .42, -.4], [sign * 18.8, .42, -1.6]], "speaker-leads", .025);
  }
}

/** Existing player-operated terminals and slot machine keep their original shells. */
export function appendKinoDeviceDetails(w: number, d: number, slot: boolean, emit: KinoDetailEmitter) {
  const side = slot ? w * .4 : w / 2, depth = slot ? d * .6 : .82, h = slot ? 1.6 : .73;
  for (const sign of [-1, 1]) {
    box(emit, "metal", "device-corner-rails", [.035, h - .08, .04], [sign * (side - .02), h / 2, depth / 2 + .025]);
    for (let vent = 0; vent < 4; vent++) {
      box(emit, "rubber", "device-vents", [.018, .025, depth * .43], [sign * (side + .012), .17 + vent * .09, -.04]);
    }
    box(emit, "rubber", "device-feet", [.12, .07, .22], [sign * (side - .1), .04, depth / 2 - .14]);
  }
  box(emit, "frame", "device-service-panel", [w * .42, .24, .025], [0, .27, depth / 2 + .025]);
  box(emit, "metal", "device-service-lock", [.055, .065, .018], [w * .13, .28, depth / 2 + .048]);
  if (slot) {
    box(emit, "frame", "coin-return", [.3, .12, .045], [w * .2, .76, depth / 2 + .035]);
    box(emit, "metal", "coin-slot", [.14, .02, .02], [w * .2, .78, depth / 2 + .065]);
    box(emit, "warm", "coin-status", [.045, .025, .012], [w * .2 - .1, .78, depth / 2 + .065]);
  } else {
    for (let port = 0; port < 3; port++) {
      box(emit, "metal", "device-connectors", [.085, .055, .035], [(port - 1) * .16, .58, depth / 2 + .025]);
    }
    box(emit, "cool", "device-status", [.045, .025, .012], [w * .3, .59, depth / 2 + .055]);
  }
  cable(emit, [[w * .25, .58, -depth / 2 - .02], [w * .3, .2, -depth / 2 - .04], [0, .075, -depth / 2 - .08]], "device-power-lead");
}
