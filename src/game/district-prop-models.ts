import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type DistrictPropFinish = "metal" | "wood" | "rubber" | "paint";
export type DistrictPropKind =
  | "parcelcrate" | "spraykit" | "seedtray" | "hosereel"
  | "cablespool" | "toolcase" | "producecrate" | "scales"
  | "filmreel" | "ticketstand" | "buoy" | "ropecoil"
  | "drainbasket" | "pipebundle" | "ashbucket" | "charredwood"
  | "pumpfilter" | "valvebox" | "safetycan" | "spillkit"
  | "dumbbells" | "watercrate" | "candlecluster" | "maprolls"
  | "velvetstool" | "heartplaque" | "batterybank" | "gearbundle";

export const DISTRICT_PROP_KINDS: Record<string, readonly DistrictPropKind[]> = {
  alley: ["parcelcrate", "spraykit"], yard: ["seedtray", "hosereel"],
  cable: ["cablespool", "toolcase"], market: ["producecrate", "scales"],
  kino: ["filmreel", "ticketstand"], kai: ["buoy", "ropecoil"],
  sewer: ["drainbasket", "pipebundle"], ash: ["ashbucket", "charredwood"],
  drain: ["pumpfilter", "valvebox"], chem: ["safetycan", "spillkit"],
  ring: ["dumbbells", "watercrate"], labyrinth: ["candlecluster", "maprolls"],
  nische: ["velvetstool", "heartplaque"], scrap: ["batterybank", "gearbundle"],
};

// Placement uses these conservative circles, including handles and projecting details.
export const DISTRICT_PROP_RADIUS: Record<DistrictPropKind, number> = {
  parcelcrate: .5, spraykit: .42, seedtray: .46, hosereel: .48,
  cablespool: .37, toolcase: .49, producecrate: .53, scales: .43,
  filmreel: .42, ticketstand: .4, buoy: .36, ropecoil: .53,
  drainbasket: .44, pipebundle: .57, ashbucket: .37, charredwood: .58,
  pumpfilter: .42, valvebox: .48, safetycan: .37, spillkit: .48,
  dumbbells: .56, watercrate: .51, candlecluster: .44, maprolls: .48,
  velvetstool: .4, heartplaque: .42, batterybank: .52, gearbundle: .5,
};

type Point = [number, number, number];
type Emit = (finish: DistrictPropFinish, geometry: THREE.BufferGeometry) => void;

// The caller owns every emitted geometry. Uniform attributes/indexing allow all
// parts sharing one finish to merge into a single reusable instancing prototype.
function part(emit: Emit, finish: DistrictPropFinish, geometry: THREE.BufferGeometry) {
  const plain = geometry.index ? geometry.toNonIndexed() : geometry;
  if (plain !== geometry) geometry.dispose();
  emit(finish, plain);
}

function box(emit: Emit, finish: DistrictPropFinish, size: Point, position: Point, rounded = true, tilt = 0) {
  const geometry = rounded
    ? new RoundedBoxGeometry(...size, 1, Math.min(...size) * .16)
    : new THREE.BoxGeometry(...size);
  if (tilt) geometry.rotateZ(tilt);
  geometry.translate(...position); part(emit, finish, geometry);
}

function cylinder(emit: Emit, finish: DistrictPropFinish, radius: number, height: number, position: Point, axis: "x" | "y" | "z" = "y", top = radius, segments = 12) {
  const geometry = new THREE.CylinderGeometry(top, radius, height, segments);
  if (axis === "x") geometry.rotateZ(Math.PI / 2);
  if (axis === "z") geometry.rotateX(Math.PI / 2);
  geometry.translate(...position); part(emit, finish, geometry);
}

function rod(emit: Emit, finish: DistrictPropFinish, a: Point, b: Point, radius = .018) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), direction = to.clone().sub(from);
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 8);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); part(emit, finish, geometry);
}

function ring(emit: Emit, finish: DistrictPropFinish, radius: number, tube: number, position: Point, axis: "x" | "y" | "z" = "y", segments = 20) {
  const geometry = new THREE.TorusGeometry(radius, tube, 6, segments);
  if (axis === "x") geometry.rotateY(Math.PI / 2);
  if (axis === "y") geometry.rotateX(Math.PI / 2);
  geometry.translate(...position); part(emit, finish, geometry);
}

function pebble(emit: Emit, finish: DistrictPropFinish, size: Point, position: Point) {
  const geometry = new THREE.SphereGeometry(1, 10, 6);
  geometry.scale(...size); geometry.translate(...position); part(emit, finish, geometry);
}

function vessel(emit: Emit, finish: DistrictPropFinish, profile: Point[], position: Point, axis: "y" | "z" = "y") {
  const geometry = new THREE.LatheGeometry(profile.map(([radius, y]) => new THREE.Vector2(radius, y)), 16);
  if (axis === "z") geometry.rotateX(Math.PI / 2);
  geometry.translate(...position); part(emit, finish, geometry);
}

function curve(emit: Emit, finish: DistrictPropFinish, points: Point[], radius = .025, segments = 20) {
  const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  part(emit, finish, new THREE.TubeGeometry(path, segments, radius, 6, false));
}

function crate(emit: Emit, width: number, depth: number, height: number, finish: DistrictPropFinish = "wood") {
  box(emit, finish, [width, .045, depth], [0, .025, 0], false);
  for (const x of [-width / 2 + .025, width / 2 - .025]) {
    for (const z of [-depth / 2 + .025, depth / 2 - .025]) {
      box(emit, finish, [.05, height, .05], [x, height / 2 + .025, z]);
    }
    for (const y of [height * .35, height * .75]) box(emit, finish, [.025, height * .25, depth], [x, y, 0], false);
  }
  for (const z of [-depth / 2 + .015, depth / 2 - .015]) {
    for (const y of [height * .35, height * .75]) box(emit, finish, [width, height * .25, .025], [0, y, z], false);
  }
}

function parcelcrate(emit: Emit) {
  crate(emit, .76, .5, .4);
  box(emit, "wood", [.45, .19, .32], [0, .42, 0]);
  box(emit, "paint", [.045, .195, .325], [0, .422, 0], false);
  box(emit, "paint", [.16, .075, .009], [-.1, .44, .165], false);
  for (const x of [-.26, .26]) box(emit, "metal", [.035, .39, .008], [x, .22, .256], false);
}

function spraykit(emit: Emit) {
  box(emit, "metal", [.65, .06, .43], [0, .03, 0]);
  for (const [x, z, h] of [[-.23, -.1, .25], [-.07, -.1, .31], [.1, -.1, .28], [.23, .09, .22], [-.13, .1, .21]]) {
    cylinder(emit, "paint", .054, h, [x, .06 + h / 2, z]);
    cylinder(emit, "metal", .047, .025, [x, .075 + h, z]);
    box(emit, "rubber", [.035, .025, .027], [x, .097 + h, z]);
  }
  rod(emit, "metal", [-.28, .06, .15], [-.28, .48, .15]);
  rod(emit, "metal", [.28, .06, .15], [.28, .48, .15]);
  rod(emit, "rubber", [-.28, .48, .15], [.28, .48, .15], .025);
}

function seedtray(emit: Emit) {
  box(emit, "paint", [.72, .09, .49], [0, .045, 0]);
  box(emit, "rubber", [.65, .025, .42], [0, .096, 0], false);
  for (const x of [-.22, 0, .22]) for (const z of [-.11, .11]) {
    cylinder(emit, "wood", .065, .055, [x, .12, z], "y", .075, 8);
    rod(emit, "paint", [x, .15, z], [x, .24, z], .009);
    pebble(emit, "paint", [.059, .018, .028], [x - .035, .21, z]);
    pebble(emit, "paint", [.059, .018, .028], [x + .035, .235, z]);
  }
}

function hosereel(emit: Emit) {
  for (const z of [-.16, .16]) ring(emit, "metal", .265, .018, [0, .43, z], "z");
  for (const z of [-.1, -.033, .033, .1]) ring(emit, "rubber", .207, .034, [0, .43, z], "z");
  rod(emit, "metal", [0, .43, -.23], [0, .43, .23], .045);
  for (const x of [-.22, .22]) {
    rod(emit, "metal", [x, .025, -.23], [0, .43, -.18]);
    rod(emit, "metal", [x, .025, .23], [0, .43, .18]);
    rod(emit, "metal", [x, .025, -.23], [x, .025, .23]);
  }
  curve(emit, "rubber", [[.13, .32, .1], [.25, .17, .13], [.34, .05, .18], [.24, .035, .25]], .025, 12);
  rod(emit, "paint", [0, .43, .24], [.13, .43, .24], .024);
}

function cablespool(emit: Emit) {
  for (const y of [.04, .58]) cylinder(emit, "wood", .34, .07, [0, y, 0]);
  cylinder(emit, "rubber", .215, .47, [0, .31, 0]);
  for (const y of [.12, .21, .3, .39, .48]) ring(emit, "rubber", .22, .027, [0, y, 0]);
  cylinder(emit, "metal", .055, .016, [0, .623, 0]);
  for (const x of [-.22, .22]) cylinder(emit, "metal", .019, .012, [x, .62, 0], "y", .019, 8);
}

function toolcase(emit: Emit) {
  box(emit, "paint", [.8, .27, .5], [0, .155, 0]);
  box(emit, "rubber", [.81, .022, .51], [0, .25, 0], false);
  box(emit, "paint", [.8, .08, .5], [0, .3, 0]);
  for (const x of [-.24, .24]) box(emit, "metal", [.08, .1, .026], [x, .27, .265]);
  for (const x of [-.12, .12]) rod(emit, "metal", [x, .34, 0], [x, .43, 0]);
  rod(emit, "rubber", [-.12, .43, 0], [.12, .43, 0], .03);
  for (const x of [-.32, .32]) for (const z of [-.19, .19]) box(emit, "metal", [.09, .045, .09], [x, .055, z]);
}

function producecrate(emit: Emit) {
  crate(emit, .82, .58, .32);
  for (const x of [-.24, 0, .24]) for (const z of [-.15, .15]) {
    pebble(emit, "paint", [.105, .1, .105], [x, .32, z]);
    rod(emit, "wood", [x, .4, z], [x + .015, .445, z], .012);
  }
  box(emit, "paint", [.24, .11, .02], [0, .19, .304]);
}

function scales(emit: Emit) {
  box(emit, "metal", [.55, .12, .46], [0, .07, 0]);
  box(emit, "paint", [.32, .34, .3], [0, .26, -.035]);
  cylinder(emit, "metal", .16, .055, [0, .31, .146], "z");
  cylinder(emit, "wood", .135, .013, [0, .31, .181], "z");
  rod(emit, "rubber", [0, .31, .193], [.075, .385, .193], .01);
  box(emit, "metal", [.6, .025, .48], [0, .455, 0]);
  for (const z of [-.23, .23]) box(emit, "metal", [.6, .045, .018], [0, .477, z], false);
}

function filmreel(emit: Emit) {
  box(emit, "wood", [.58, .09, .43], [0, .045, 0]);
  cylinder(emit, "rubber", .24, .16, [0, .36, 0], "z");
  for (const z of [-.105, .105]) {
    ring(emit, "metal", .29, .023, [0, .36, z], "z");
    cylinder(emit, "metal", .075, .025, [0, .36, z], "z");
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      rod(emit, "metal", [Math.cos(angle) * .07, .36 + Math.sin(angle) * .07, z], [Math.cos(angle) * .28, .36 + Math.sin(angle) * .28, z], .025);
    }
  }
  curve(emit, "rubber", [[.21, .22, .02], [.31, .13, .08], [.27, .11, .2], [.12, .105, .24]], .025, 12);
}

function ticketstand(emit: Emit) {
  box(emit, "metal", [.5, .06, .4], [0, .03, 0]);
  box(emit, "metal", [.08, .67, .08], [0, .38, 0]);
  box(emit, "paint", [.52, .39, .17], [0, .785, 0]);
  box(emit, "rubber", [.4, .045, .014], [0, .72, .091]);
  box(emit, "wood", [.31, .16, .018], [0, .85, .094]);
  for (const x of [-.11, 0, .11]) box(emit, "paint", [.055, .035, .024], [x, .825, .108], false);
  box(emit, "metal", [.56, .035, .22], [0, .999, 0]);
  box(emit, "wood", [.14, .1, .013], [.08, .665, .1], false);
}

function buoy(emit: Emit) {
  vessel(emit, "paint", [[0, .025, 0], [.22, .025, 0], [.29, .14, 0], [.28, .42, 0], [.13, .59, 0], [.06, .64, 0], [0, .64, 0]], [0, 0, 0]);
  ring(emit, "wood", .281, .025, [0, .3, 0]);
  ring(emit, "metal", .063, .016, [0, .7, 0], "z", 16);
  for (const x of [-.18, .18]) rod(emit, "rubber", [x, .08, .08], [x * .5, .56, .08], .018);
}

function ropecoil(emit: Emit) {
  for (let i = 0; i < 5; i++) ring(emit, "wood", .18 + i * .047, .024, [0, .035 + (i % 2) * .009, 0]);
  curve(emit, "wood", [[.38, .043, 0], [.43, .033, .17], [.33, .033, .31], [.14, .033, .39]], .024, 14);
  cylinder(emit, "metal", .09, .26, [0, .14, 0]);
  ring(emit, "metal", .095, .02, [0, .28, 0]);
}

function drainbasket(emit: Emit) {
  cylinder(emit, "rubber", .28, .04, [0, .025, 0]);
  for (const y of [.07, .24, .42]) ring(emit, "metal", .29, .016, [0, y, 0]);
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    rod(emit, "metal", [Math.cos(angle) * .29, .06, Math.sin(angle) * .29], [Math.cos(angle) * .29, .42, Math.sin(angle) * .29], .012);
  }
  for (const [x, z] of [[-.1, -.07], [.11, .08], [-.08, .14]]) pebble(emit, "wood", [.1, .06, .06], [x, .09, z]);
  for (const x of [-.32, .32]) box(emit, "metal", [.08, .035, .13], [x, .42, 0]);
}

function pipebundle(emit: Emit) {
  const profile: Point[] = [[.085, -.4, 0], [.085, .4, 0], [.06, .4, 0], [.06, -.4, 0], [.085, -.4, 0]];
  for (const [x, y] of [[-.2, .12], [0, .12], [.2, .12], [-.1, .29], [.1, .29]]) vessel(emit, "metal", profile, [x, y, 0], "z");
  for (const z of [-.23, .23]) {
    box(emit, "wood", [.65, .045, .08], [0, .025, z]);
    box(emit, "rubber", [.47, .025, .04], [0, .375, z], false);
    for (const x of [-.25, .25]) box(emit, "rubber", [.025, .32, .04], [x, .2, z], false);
  }
}

function ashbucket(emit: Emit) {
  vessel(emit, "metal", [[0, .015, 0], [.22, .015, 0], [.27, .42, 0], [.245, .42, 0], [.2, .055, 0], [0, .055, 0]], [0, 0, 0]);
  ring(emit, "metal", .265, .015, [0, .42, 0]);
  cylinder(emit, "rubber", .23, .02, [0, .345, 0]);
  curve(emit, "metal", [[-.275, .3, 0], [-.29, .53, 0], [0, .66, 0], [.29, .53, 0], [.275, .3, 0]], .013, 16);
  for (const x of [-.12, .05]) box(emit, "wood", [.2, .045, .08], [x, .39, .05], false, x * 2);
}

function charredwood(emit: Emit) {
  for (const [x, y, z, angle] of [[0, .1, -.18, .07], [-.08, .105, .15, -.11], [.02, .22, 0, .19]]) {
    const geometry = new THREE.CylinderGeometry(.075, .095, .86, 9);
    geometry.rotateZ(Math.PI / 2); geometry.rotateY(angle); geometry.translate(x, y, z); part(emit, "rubber", geometry);
    for (const sign of [-1, 1]) {
      const end = new THREE.CylinderGeometry(.063, .063, .012, 9);
      end.rotateZ(Math.PI / 2); end.rotateY(angle);
      end.translate(x + sign * .424 * Math.cos(angle), y, z - sign * .424 * Math.sin(angle)); part(emit, "wood", end);
    }
  }
  for (const z of [-.22, .2]) rod(emit, "wood", [-.24, .31, z], [.29, .3, z * .4], .022);
}

function pumpfilter(emit: Emit) {
  cylinder(emit, "metal", .26, .07, [0, .045, 0]);
  cylinder(emit, "paint", .21, .46, [0, .31, 0]);
  for (const y of [.12, .5]) ring(emit, "metal", .215, .021, [0, y, 0]);
  cylinder(emit, "metal", .25, .055, [0, .565, 0]);
  cylinder(emit, "metal", .06, .2, [.25, .36, 0], "x");
  ring(emit, "rubber", .063, .018, [.35, .36, 0], "x", 12);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    rod(emit, "metal", [.215 * Math.cos(a), .13, .215 * Math.sin(a)], [.215 * Math.cos(a), .49, .215 * Math.sin(a)], .009);
  }
  cylinder(emit, "rubber", .07, .08, [0, .63, 0]);
}

function valvebox(emit: Emit) {
  box(emit, "paint", [.61, .43, .48], [0, .23, 0]);
  box(emit, "metal", [.65, .04, .52], [0, .465, 0]);
  cylinder(emit, "metal", .045, .11, [0, .54, 0]);
  ring(emit, "paint", .19, .021, [0, .61, 0]);
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    rod(emit, "metal", [0, .61, 0], [.18 * Math.cos(angle), .61, .18 * Math.sin(angle)], .015);
  }
  for (const x of [-.18, .18]) box(emit, "metal", [.065, .065, .018], [x, .34, .251]);
  for (let i = 0; i < 4; i++) box(emit, "rubber", [.24, .016, .012], [0, .13 + i * .037, .247], false);
}

function safetycan(emit: Emit) {
  box(emit, "paint", [.44, .49, .31], [0, .27, 0]);
  for (const z of [-.163, .163]) {
    box(emit, "metal", [.3, .027, .015], [0, .25, z], false, .65);
    box(emit, "metal", [.3, .027, .015], [0, .25, z], false, -.65);
  }
  for (const x of [-.1, .1]) rod(emit, "paint", [x, .51, 0], [x, .63, 0], .027);
  rod(emit, "paint", [-.1, .63, 0], [.1, .63, 0], .027);
  cylinder(emit, "metal", .048, .035, [.16, .54, .05]);
  box(emit, "wood", [.12, .09, .014], [0, .39, .165], false);
}

function spillkit(emit: Emit) {
  box(emit, "paint", [.65, .46, .5], [0, .25, 0]);
  box(emit, "rubber", [.69, .075, .54], [0, .51, 0]);
  box(emit, "wood", [.25, .19, .015], [0, .31, .26]);
  box(emit, "paint", [.035, .12, .018], [0, .31, .271], false);
  box(emit, "paint", [.12, .035, .018], [0, .31, .272], false);
  for (const x of [-.36, .36]) box(emit, "metal", [.045, .04, .17], [x, .41, 0]);
  for (const x of [-.2, .2]) cylinder(emit, "rubber", .055, .035, [x, .07, -.22], "z");
}

function dumbbells(emit: Emit) {
  box(emit, "rubber", [.92, .04, .6], [0, .025, 0]);
  for (const z of [-.17, .17]) {
    rod(emit, "metal", [-.3, .16, z], [.3, .16, z], .024);
    for (const x of [-.25, .25]) {
      cylinder(emit, "rubber", .13, .12, [x, .16, z], "x", .13, 12);
      cylinder(emit, "metal", .055, .018, [x + Math.sign(x) * .07, .16, z], "x");
    }
  }
}

function watercrate(emit: Emit) {
  crate(emit, .76, .54, .24, "paint");
  for (const x of [-.23, 0, .23]) for (const z of [-.13, .13]) {
    vessel(emit, "metal", [[0, 0, 0], [.073, 0, 0], [.073, .23, 0], [.035, .28, 0], [.035, .34, 0], [0, .34, 0]], [x, .055, z]);
    cylinder(emit, "paint", .039, .03, [x, .41, z], "y", .039, 8);
    cylinder(emit, "wood", .076, .075, [x, .22, z], "y", .076, 8);
  }
}

function candlecluster(emit: Emit) {
  cylinder(emit, "metal", .34, .04, [0, .025, 0]);
  for (const [x, z, h] of [[-.17, -.1, .3], [.04, -.12, .48], [.18, .07, .24], [-.06, .12, .36]]) {
    cylinder(emit, "wood", .068, h, [x, .05 + h / 2, z]);
    cylinder(emit, "rubber", .008, .035, [x, .065 + h, z], "y", .008, 6);
    pebble(emit, "paint", [.019, .044, .019], [x, .108 + h, z]);
    for (const side of [-1, 1]) pebble(emit, "wood", [.016, .045, .016], [x + side * .061, h + .01, z]);
  }
}

function maprolls(emit: Emit) {
  crate(emit, .65, .5, .22);
  for (const [x, z, h] of [[-.19, -.1, .48], [0, -.1, .62], [.19, -.1, .52], [-.1, .1, .43], [.12, .1, .57]]) {
    vessel(emit, "wood", [[.06, 0, 0], [.06, h, 0], [.043, h, 0], [.043, 0, 0], [.06, 0, 0]], [x, .05, z]);
    cylinder(emit, "paint", .062, .035, [x, .27, z], "y", .062, 8);
  }
  box(emit, "paint", [.23, .1, .012], [0, .16, .26], false);
}

function velvetstool(emit: Emit) {
  for (const x of [-.2, .2]) for (const z of [-.2, .2]) {
    rod(emit, "metal", [x * 1.1, .025, z * 1.1], [x, .43, z], .022);
  }
  for (const z of [-.2, .2]) rod(emit, "metal", [-.21, .17, z], [.21, .17, z], .014);
  box(emit, "wood", [.54, .06, .49], [0, .44, 0]);
  box(emit, "paint", [.57, .16, .52], [0, .53, 0]);
  for (const x of [-.15, .15]) for (const z of [-.13, .13]) pebble(emit, "rubber", [.016, .006, .016], [x, .612, z]);
}

function heartplaque(emit: Emit) {
  box(emit, "metal", [.57, .045, .4], [0, .025, 0]);
  rod(emit, "metal", [0, .05, 0], [0, .48, 0], .025);
  const shape = new THREE.Shape();
  shape.moveTo(0, -.22);
  shape.bezierCurveTo(-.07, -.13, -.31, .02, -.28, .18);
  shape.bezierCurveTo(-.26, .36, -.07, .39, 0, .23);
  shape.bezierCurveTo(.07, .39, .26, .36, .28, .18);
  shape.bezierCurveTo(.31, .02, .07, -.13, 0, -.22);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .055, steps: 1, bevelEnabled: true, bevelSegments: 1, bevelSize: .012, bevelThickness: .012, curveSegments: 8 });
  geometry.translate(0, .56, -.0275); part(emit, "paint", geometry);
  ring(emit, "metal", .045, .01, [0, .58, .048], "z", 12);
}

function batterybank(emit: Emit) {
  box(emit, "wood", [.82, .055, .55], [0, .03, 0]);
  for (const x of [-.2, .2]) {
    box(emit, "rubber", [.34, .36, .43], [x, .24, 0]);
    box(emit, "paint", [.36, .055, .45], [x, .435, 0]);
    for (const z of [-.12, .12]) cylinder(emit, "metal", .029, .055, [x, .49, z], "y", .029, 8);
    box(emit, "wood", [.19, .1, .012], [x, .27, .223], false);
  }
  curve(emit, "paint", [[-.2, .52, -.12], [-.12, .6, -.12], [.12, .6, .12], [.2, .52, .12]], .017, 12);
  curve(emit, "rubber", [[-.2, .52, .12], [-.3, .57, .22], [.29, .57, .22], [.2, .52, -.12]], .017, 14);
}

function gearbundle(emit: Emit) {
  box(emit, "wood", [.68, .055, .5], [0, .03, 0]);
  for (const [radius, y, x] of [[.26, .12, -.05], [.19, .235, .07], [.13, .34, -.05]]) {
    ring(emit, "metal", radius * .69, radius * .22, [x, y, 0], "y", 16);
    for (let i = 0; i < 10; i++) {
      const angle = i * Math.PI / 5;
      const geometry = new THREE.BoxGeometry(radius * .25, .065, radius * .34);
      geometry.rotateY(-angle); geometry.translate(x + Math.cos(angle) * radius * .88, y, Math.sin(angle) * radius * .88);
      part(emit, "metal", geometry);
    }
    cylinder(emit, "rubber", radius * .29, .025, [x, y - .035, 0]);
  }
  rod(emit, "metal", [-.3, .075, .2], [.28, .075, .2], .025);
}

const builders: Record<DistrictPropKind, (emit: Emit) => void> = {
  parcelcrate, spraykit, seedtray, hosereel, cablespool, toolcase, producecrate,
  scales, filmreel, ticketstand, buoy, ropecoil, drainbasket, pipebundle,
  ashbucket, charredwood, pumpfilter, valvebox, safetycan, spillkit, dumbbells,
  watercrate, candlecluster, maprolls, velvetstool, heartplaque, batterybank, gearbundle,
};

/** Authored non-solid set dressing; no textures, lights, scene state or gameplay. */
export function appendDistrictProp(kind: DistrictPropKind, emit: Emit): void {
  builders[kind](emit);
}
