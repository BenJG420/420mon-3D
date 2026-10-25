import * as THREE from "three";

export type SewerFinish = "stone" | "metal" | "rust" | "dark" | "moss" | "cyan" | "amber";
export type SewerDetailEmitter = (finish: SewerFinish, geometry: THREE.BufferGeometry, feature: string) => void;
type Point = [number, number, number];

function box(emit: SewerDetailEmitter, finish: SewerFinish, feature: string, size: Point, position: Point) {
  const geometry = new THREE.BoxGeometry(...size); geometry.translate(...position); emit(finish, geometry, feature);
}
function rod(emit: SewerDetailEmitter, finish: SewerFinish, feature: string, a: Point, b: Point, radius: number) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), 10);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...from.add(to).multiplyScalar(.5).toArray()); emit(finish, geometry, feature);
}
function ring(emit: SewerDetailEmitter, finish: SewerFinish, feature: string, radius: number, tube: number, position: Point, axis: "x" | "y" | "z") {
  const geometry = new THREE.TorusGeometry(radius, tube, 5, 12);
  if (axis === "x") geometry.rotateY(Math.PI / 2);
  if (axis === "y") geometry.rotateX(-Math.PI / 2);
  geometry.translate(...position); emit(finish, geometry, feature);
}

/** Called per short wall segment so details cull locally along the 384 m corridor. */
export function appendSewerWallDetails(w: number, d: number, h: number, seed: number, emit: SewerDetailEmitter) {
  const z = d / 2, tall = h > 1, bays = Math.min(8, Math.max(1, Math.ceil(w / 3.4)));
  const rows = tall ? 3 : 1, columns = Math.min(24, Math.max(1, Math.floor(w / .85)));
  box(emit, "dark", "damp-course", [w, .14, .035], [0, .13, z + .018]);
  box(emit, "metal", "cap-flashing", [w, .045, .12], [0, h + .075, z]);
  // Slightly uneven projecting repair courses leave the cached masonry underneath visible.
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    if ((col + row + seed) % 4 === 0) continue;
    const width = w / columns, offset = row % 2 ? width * .2 : 0;
    const x = -w / 2 + (col + .5) * width + offset;
    if (x + width * .43 > w / 2) continue;
    box(emit, "stone", "repair-masonry", [width * .86, tall ? .21 : .16, .035], [x, .35 + row * .39, z + .022]);
  }
  const pipeY = tall ? h - .51 : h - .24;
  rod(emit, "rust", "main-pipe", [-w / 2, pipeY, z + .17], [w / 2, pipeY, z + .17], tall ? .095 : .06);
  if (tall) rod(emit, "metal", "service-pipe", [-w / 2, h - .23, z + .12], [w / 2, h - .23, z + .12], .035);
  for (let bay = 0; bay < bays; bay++) {
    const x = -w / 2 + (bay + .5) * w / bays;
    box(emit, "metal", "pipe-brackets", [.08, tall ? .34 : .22, .18], [x, pipeY, z + .07]);
    ring(emit, "metal", "pipe-collars", tall ? .105 : .069, .015, [x + .12, pipeY, z + .17], "x");
    for (const sign of [-1, 1]) box(emit, "rust", "bracket-bolts", [.035, .035, .025], [x, pipeY + sign * (tall ? .13 : .08), z + .174]);
    // Damp trails are low and narrow, leaving source wall art readable above them.
    box(emit, "moss", "mineral-streaks", [.14 + ((bay + seed) % 3) * .06, .14 + (bay % 2) * .1, .012], [x + .35, .23, z + .043]);
    if (!tall) continue;
    if ((bay + seed) % 3 === 0) {
      box(emit, "metal", "inspection-cabinet", [.48, .58, .13], [x, 1.45, z + .07]);
      box(emit, "dark", "inspection-inset", [.37, .46, .025], [x, 1.45, z + .15]);
      box(emit, "metal", "inspection-lock", [.045, .09, .025], [x + .11, 1.44, z + .18]);
      box(emit, "amber", "inspection-warning", [.14, .09, .012], [x - .05, 1.57, z + .17]);
      rod(emit, "metal", "cabinet-feed", [x, 1.74, z + .1], [x, pipeY, z + .1], .025);
    } else if ((bay + seed) % 3 === 1) {
      rod(emit, "rust", "valve-stem", [x, pipeY, z + .17], [x, pipeY, z + .37], .035);
      ring(emit, "rust", "valve-wheel", .16, .023, [x, pipeY, z + .39], "z");
      rod(emit, "metal", "valve-spokes", [x - .13, pipeY, z + .39], [x + .13, pipeY, z + .39], .014);
      rod(emit, "metal", "valve-spokes", [x, pipeY - .13, z + .39], [x, pipeY + .13, z + .39], .014);
    }
    if (bay % 2 === 0) {
      box(emit, "dark", "service-light-housing", [.68, .13, .13], [x, h - .78, z + .08]);
      box(emit, "cyan", "service-light-strip", [.54, .035, .018], [x, h - .78, z + .16]);
    }
  }
}

/** Low mechanical dressing around each retained manhole disc; no ladder obstruction. */
export function appendSewerHatchDetails(_w: number, _d: number, emit: SewerDetailEmitter) {
  ring(emit, "metal", "hatch-rim", .79, .025, [0, .085, 0], "y");
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4, x = Math.cos(angle) * .79, z = Math.sin(angle) * .79;
    const bolt = new THREE.CylinderGeometry(.025, .03, .025, 6);
    bolt.translate(x, .119, z); emit("rust", bolt, "hatch-fasteners");
  }
  rod(emit, "metal", "hatch-hinge", [-.16, .13, -.69], [.16, .13, -.69], .045);
  for (const x of [-.21, .21]) box(emit, "metal", "hinge-leaves", [.08, .025, .2], [x, .112, -.68]);
  for (const sign of [-1, 1]) box(emit, "amber", "hatch-edge-markers", [.14, .009, .07], [sign * .55, .126, .55]);
}

/** Flush service drainage on the existing spare floor strip; never a new water barrier. */
export function appendSewerDrainDetails(w: number, d: number, seed: number, emit: SewerDetailEmitter) {
  const span = Math.min(.55, d - .06), bays = Math.min(12, Math.max(1, Math.ceil(w / 2.2)));
  box(emit, "dark", "drain-bed", [w, .008, span], [0, .04, 0]);
  for (const sign of [-1, 1]) box(emit, "metal", "drain-rim", [w, .012, .035], [0, .046, sign * (span / 2 + .015)]);
  for (let bay = 0; bay < bays; bay++) {
    const width = w / bays, x = -w / 2 + (bay + .5) * width;
    box(emit, "metal", "drain-divider", [.035, .012, span + .06], [x - width / 2 + .02, .046, 0]);
    for (let bar = 0; bar < 5; bar++) {
      box(emit, "metal", "drain-grating", [.035, .012, span - .025], [x + (bar - 2) * Math.min(.14, width / 6), .049, 0]);
    }
    if ((bay + seed) % 3 === 0) box(emit, "moss", "drain-residue", [.24, .006, span * .7], [x + width * .25, .046, .01]);
  }
}
