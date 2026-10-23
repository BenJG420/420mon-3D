import * as THREE from "three";

export type StreetPropKind = "bottle" | "can" | "cardboard" | "bicycle" | "cart";
export type StreetFinish = "glass" | "metal" | "rubber" | "cardboard";
export type StreetPropEmitter = (finish: StreetFinish, geometry: THREE.BufferGeometry) => void;
type Point = [number, number, number];

function box(emit: StreetPropEmitter, finish: StreetFinish, size: Point, position: Point, tilt = 0) {
  const geometry = new THREE.BoxGeometry(...size);
  if (tilt) geometry.rotateZ(tilt);
  geometry.translate(...position); emit(finish, geometry);
}

function rod(emit: StreetPropEmitter, finish: StreetFinish, a: Point, b: Point, radius = .015, segments = 6) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), segments, 1, true);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); emit(finish, geometry);
}

function ring(emit: StreetPropEmitter, finish: StreetFinish, radius: number, tube: number, position: Point, axis: "x" | "y" | "z", segments = 16) {
  const geometry = new THREE.TorusGeometry(radius, tube, 5, segments);
  if (axis === "x") geometry.rotateY(Math.PI / 2);
  if (axis === "y") geometry.rotateX(Math.PI / 2);
  geometry.translate(...position); emit(finish, geometry);
}

function bottle(emit: StreetPropEmitter) {
  // Continuous outer wall, open lip and inner neck: no liquid or transparency pass.
  const profile = [[0, 0], [.073, 0], [.09, .035], [.09, .23], [.065, .28],
    [.032, .32], [.032, .39], [.027, .4], [.021, .39], [.021, .32], [.072, .25], [.077, .04], [0, .04]];
  emit("glass", new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 12));
  const shadow = new THREE.CircleGeometry(.021, 10); shadow.rotateX(-Math.PI / 2);
  shadow.translate(0, .32, 0); emit("rubber", shadow);
}

function can(emit: StreetPropEmitter) {
  const profile = [[0, 0], [.072, 0], [.084, .025], [.077, .09], [.083, .17], [.073, .19]];
  const shell = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 12);
  shell.scale(1, 1, .9); emit("metal", shell);
  ring(emit, "metal", .073, .007, [0, .19, 0], "y", 12);
  const inside = new THREE.CircleGeometry(.069, 12); inside.rotateX(-Math.PI / 2);
  inside.translate(0, .173, 0); emit("rubber", inside);
  box(emit, "metal", [.025, .012, .06], [.023, .185, -.02]);
}

function cardboard(emit: StreetPropEmitter) {
  box(emit, "cardboard", [.4, .014, .34], [0, .007, 0]);
  for (const sign of [-1, 1]) {
    box(emit, "cardboard", [.014, .23, .34], [sign * .193, .115, 0]);
    box(emit, "cardboard", [.4, .23, .014], [0, .115, sign * .163]);
    // Open flaps lean outward; the empty box remains recognizable from above.
    box(emit, "cardboard", [.014, .1, .31], [sign * .211, .271, 0], -sign * .4);
    const flap = new THREE.BoxGeometry(.36, .1, .014);
    flap.rotateX(sign * .38); flap.translate(0, .273, sign * .181); emit("cardboard", flap);
  }
}

function bicycle(emit: StreetPropEmitter) {
  for (const x of [-.53, .53]) {
    ring(emit, "rubber", .29, .03, [x, .32, 0], "z", 20);
    ring(emit, "metal", .262, .012, [x, .32, 0], "z", 16);
    for (let spoke = 0; spoke < 6; spoke++) {
      const angle = spoke * Math.PI / 3;
      rod(emit, "metal", [x, .32, 0], [x + Math.cos(angle) * .255, .32 + Math.sin(angle) * .255, 0], .006, 4);
    }
    rod(emit, "metal", [x, .32, -.06], [x, .32, .06], .027);
  }
  const rear: Point = [-.53, .32, 0], crank: Point = [-.08, .34, 0];
  const seat: Point = [-.19, .77, 0], head: Point = [.38, .76, 0], front: Point = [.53, .32, 0];
  for (const [a, b] of [[rear, crank], [rear, seat], [crank, seat], [seat, head], [head, crank]] as [Point, Point][]) rod(emit, "metal", a, b, .025);
  for (const side of [-1, 1]) {
    rod(emit, "metal", [head[0], head[1], side * .055], [front[0], front[1], side * .055], .018);
    rod(emit, "metal", [-.08, .34, side * .08], [side < 0 ? -.19 : .03, .34, side * .08], .014);
    box(emit, "rubber", [.1, .045, .065], [side < 0 ? -.19 : .03, .34, side * .11]);
  }
  ring(emit, "metal", .075, .012, [-.08, .34, .045], "z", 12);
  rod(emit, "metal", seat, [-.22, .89, 0], .021);
  box(emit, "rubber", [.24, .075, .15], [-.23, .91, 0], -.06);
  rod(emit, "metal", head, [.33, 1.04, 0], .02);
  rod(emit, "metal", [.33, 1.04, -.2], [.33, 1.04, .2], .018);
  for (const side of [-1, 1]) rod(emit, "rubber", [.33, 1.04, side * .13], [.33, 1.04, side * .22], .024);
  // Narrow rear rack and deployed kickstand help it read as a parked bicycle.
  rod(emit, "metal", [-.76, .69, -.075], [-.34, .69, -.075], .012);
  rod(emit, "metal", [-.76, .69, .075], [-.34, .69, .075], .012);
  rod(emit, "metal", [-.63, .69, -.075], [-.53, .32, -.05], .012);
  rod(emit, "metal", [-.08, .35, -.045], [-.18, .015, -.2], .012);
}

function cart(emit: StreetPropEmitter) {
  for (const x of [-.25, .25]) for (const z of [-.35, .35]) {
    ring(emit, "rubber", .065, .025, [x, .09, z], "x", 12);
    rod(emit, "metal", [x, .09, z], [x, .26, z], .022);
  }
  for (const side of [-1, 1]) {
    rod(emit, "metal", [side * .25, .23, -.39], [side * .25, .23, .39], .025);
    rod(emit, "metal", [side * .25, .23, .35], [side * .29, .99, .46], .024);
    rod(emit, "metal", [side * .25, .23, -.35], [side * .23, .5, -.32], .02);
  }
  rod(emit, "rubber", [-.29, .99, .46], [.29, .99, .46], .029);
  // An open wire basket: no opaque solid box or costly alpha material.
  for (const y of [.5, .69, .89]) {
    const width = y === .5 ? .23 : .31, front = y === .5 ? -.32 : -.43;
    for (const x of [-width, width]) rod(emit, "metal", [x, y, front], [x, y, .34], .012, 4);
    for (const z of [front, .34]) rod(emit, "metal", [-width, y, z], [width, y, z], .012, 4);
  }
  for (let i = 0; i < 5; i++) {
    const u = i / 4;
    for (const side of [-1, 1]) rod(emit, "metal", [side * .23, .5, -.32 + u * .66], [side * .31, .89, -.43 + u * .77], .009, 4);
    for (const end of [-1, 1]) rod(emit, "metal", [-.23 + u * .46, .5, end < 0 ? -.32 : .34], [-.31 + u * .62, .89, end < 0 ? -.43 : .34], .009, 4);
    rod(emit, "metal", [-.23 + u * .46, .5, -.32], [-.23 + u * .46, .5, .34], .009, 4);
  }
}

/** Project-authored prototypes; caller merges by finish and instances spatial cells. */
export function appendStreetProp(kind: StreetPropKind, emit: StreetPropEmitter) {
  ({ bottle, can, cardboard, bicycle, cart })[kind](emit);
}
