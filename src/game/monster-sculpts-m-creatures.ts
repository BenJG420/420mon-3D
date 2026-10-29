import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type Point = [number, number, number];
type XY = [number, number];

function mesh(vertices: number[], indices: number[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function orb(s: Sculpt, color: string, p: Point, size: Point, segments = 20, rings = 14) {
  const geometry = new THREE.SphereGeometry(1, segments, rings);
  geometry.scale(...size).translate(...p);
  s.surface(color, geometry);
}

/** A capped, smoothly tapering anatomical sweep; its section follows the actual curve. */
function sweep(s: Sculpt, color: string, points: Point[], radii: number[], segments = 24, sides = 12, flatten = 1) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const frames = curve.computeFrenetFrames(segments, false);
  const vertices: number[] = [], indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, p = curve.getPointAt(t), ri = t * (radii.length - 1);
    const low = Math.min(radii.length - 2, Math.floor(ri));
    const radius = THREE.MathUtils.lerp(radii[low], radii[low + 1], ri - low);
    for (let j = 0; j < sides; j++) {
      const angle = j / sides * Math.PI * 2;
      const q = p.clone().addScaledVector(frames.normals[i], Math.cos(angle) * radius)
        .addScaledVector(frames.binormals[i], Math.sin(angle) * radius * flatten);
      vertices.push(q.x, q.y, q.z);
      if (i < segments) {
        const a = i * sides + j, b = i * sides + (j + 1) % sides;
        indices.push(a, b, a + sides, b, b + sides, a + sides);
      }
    }
  }
  const first = curve.getPointAt(0), last = curve.getPointAt(1);
  vertices.push(first.x, first.y, first.z, last.x, last.y, last.z);
  const start = (segments + 1) * sides, end = start + 1;
  for (let j = 0; j < sides; j++) {
    const k = (j + 1) % sides;
    indices.push(start, k, j, end, segments * sides + j, segments * sides + k);
  }
  s.surface(color, mesh(vertices, indices));
}

function bevel(s: Sculpt, color: string, outline: XY[], depth: number, position: Point, radius = .012, angle = 0) {
  const shape = new THREE.Shape(outline.map(p => new THREE.Vector2(...p)));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: radius, bevelSize: radius,
    bevelSegments: 3, steps: 1, curveSegments: 8,
  });
  geometry.translate(0, 0, -depth / 2).rotateZ(angle).translate(...position);
  s.surface(color, geometry);
}

function ellipseRim(s: Sculpt, color: string, center: Point, width: number, height: number, radius: number, segments = 64, sides = 12) {
  const vertices: number[] = [], indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a = i / segments * Math.PI * 2;
    for (let j = 0; j < sides; j++) {
      const b = j / sides * Math.PI * 2;
      vertices.push(center[0] + (width + radius * Math.cos(b)) * Math.cos(a),
        center[1] + (height + radius * Math.cos(b)) * Math.sin(a),
        center[2] + radius * Math.sin(b));
      const q = i * sides + j, n = i * sides + (j + 1) % sides;
      const r = ((i + 1) % segments) * sides + j, rn = ((i + 1) % segments) * sides + (j + 1) % sides;
      indices.push(q, r, n, n, r, rn);
    }
  }
  s.surface(color, mesh(vertices, indices));
}

function gumguard() {
  const s = new Sculpt({ detail: "high" });
  const teal = "#2c9da8", lit = "#45b3b8", shade = "#1b7082";
  // A substantial pear-shaped torso, with a rounded occiput and a projecting muzzle.
  const vertices: number[] = [], indices: number[] = [], sides = 40, rings = 32;
  for (let i = 0; i <= rings; i++) {
    const a = i / rings * Math.PI, y = Math.cos(a) * .57;
    const waist = 1 + .075 * Math.cos(a) - .055 * Math.cos(a * 2);
    for (let j = 0; j <= sides; j++) {
      const b = j / sides * Math.PI * 2;
      vertices.push(Math.sin(a) * Math.cos(b) * .48 * waist, y,
        Math.sin(a) * Math.sin(b) * .345 * (1 + .06 * Math.cos(a)));
      if (i < rings && j < sides) {
        const q = i * (sides + 1) + j;
        indices.push(q, q + 1, q + sides + 1, q + 1, q + sides + 2, q + sides + 1);
      }
    }
  }
  s.surface(teal, mesh(vertices, indices));
  orb(s, lit, [0, -.31, .225], [.35, .22, .115], 28, 18);
  orb(s, "#247f8d", [0, .06, -.303], [.31, .41, .065], 24, 18);
  sweep(s, "#318f9d", [[0, -.32, -.35], [0, .02, -.382], [0, .36, -.32]], [.014, .019, .008], 26, 8);

  for (const side of [-1, 1]) {
    sweep(s, shade, [[side * .28, .44, -.025], [side * .32, .59, -.025], [side * .36, .73, .005]], [.092, .063, .003], 28, 14);
    sweep(s, lit, [[side * .275, .485, .033], [side * .315, .595, .026], [side * .355, .70, .018]], [.035, .025, .002], 18, 8);
    sweep(s, shade, [[side * .38, -.03, -.03], [side * .51, -.16, .005], [side * .53, -.36, .09]], [.13, .115, .085], 22, 14);
  }
  // The left fist is thrust out; the right arm drops to a heavy, three-fingered hand.
  sweep(s, teal, [[-.48, -.13, .075], [-.60, -.20, .13], [-.65, -.19, .16]], [.105, .09, .09], 18, 12);
  sweep(s, lit, [[.49, -.12, .08], [.59, -.28, .10], [.56, -.41, .16]], [.102, .105, .10], 22, 12);
  for (const [x, y] of [[-.66, -.19], [.56, -.43]]) {
    orb(s, teal, [x, y, .16], [.115, .13, .12]);
    for (let finger = 0; finger < 3; finger++) {
      const fy = y + .065 - finger * .063;
      orb(s, lit, [x - .015, fy, .24], [.082, .035, .043], 16, 10);
    }
    orb(s, teal, [x + (x < 0 ? .075 : -.075), y + .018, .255], [.043, .065, .045], 16, 10);
  }
  for (const side of [-1, 1]) {
    sweep(s, shade, [[side * .235, -.43, -.005], [side * .25, -.59, .015]], [.10, .078], 12, 12);
    orb(s, teal, [side * .25, -.627, .085], [.145, .075, .15], 20, 12);
    for (let toe = 0; toe < 3; toe++) {
      const x = side * .25 + (toe - 1) * .075;
      orb(s, lit, [x, -.652, .205], [.044, .047, .087], 16, 10);
      sweep(s, shade, [[x - .023, -.619, .231], [x, -.613, .243], [x + .023, -.62, .231]], [.006, .006, .006], 8, 6);
    }
  }
  orb(s, "#a5268b", [.482, .26, .08], [.087, .088, .065], 24, 14);
  orb(s, "#eb59ba", [.504, .272, .123], [.062, .062, .03], 20, 12);
  orb(s, "#fc8dcb", [.513, .29, .147], [.021, .025, .008], 12, 8);

  // The crimson mouth is a complete projecting gum rim around a recessed oral cavity.
  orb(s, "#8d2940", [0, -.088, .31], [.42, .284, .147], 32, 20);
  orb(s, "#451b32", [0, -.075, .431], [.355, .213, .037], 32, 18);
  ellipseRim(s, "#d54b62", [0, -.074, .422], .375, .235, .039, 64, 12);
  sweep(s, "#ef7585", [[-.33, -.197, .435], [-.23, -.292, .438], [0, -.32, .45], [.24, -.276, .438], [.34, -.182, .431]], [.012, .016, .018, .015, .009], 38, 8);
  const toothShape: XY[] = [[-.032, .06], [.032, .06], [.038, .031], [.032, -.047], [.019, -.061], [-.018, -.061], [-.032, -.047], [-.038, .031]];
  for (let i = 0; i < 8; i++) {
    const x = (i - 3.5) * .081, curve = Math.pow(Math.abs(x) / .30, 1.5);
    const z = .482 - .064 * curve;
    bevel(s, i % 3 === 0 ? "#fff8d9" : "#fffcee", toothShape, .067, [x, -.006 + .071 * curve, z], .008, -x * .20);
    bevel(s, "#e8ebdf", toothShape.map(([a, b]) => [a * .94, b * .80]), .061,
      [x, -.191 + .062 * curve, z - .006], .008, x * .18);
  }
  // Small inset eyes remain readable above the exaggerated teeth.
  for (const side of [-1, 1]) {
    const eye: XY[] = [[-.115, .063], [.104, -.015], [.078, -.105], [-.011, -.119], [-.088, -.062]];
    const oriented = eye.map(([x, y]) => [x * -side, y] as XY);
    bevel(s, "#164c63", oriented, .028, [side * .215, .32, .315], .014);
    bevel(s, "#f2f8e4", oriented.map(([x, y]) => [x * .76, y * .72]), .027, [side * .215, .309, .342], .009);
    orb(s, "#153b52", [side * .179, .271, .375], [.032, .054, .018], 18, 12);
    orb(s, "#ffffff", [side * .169, .29, .392], [.009, .015, .006], 12, 8);
    sweep(s, teal, [[side * .335, .388, .295], [side * .226, .342, .35], [side * .115, .307, .356]], [.024, .028, .020], 18, 10);
  }
  const geometry = s.finish();
  geometry.userData.sculptFeatures = ["rounded teal body and rear nape seam", "curved twin horns and pink temple disc", "recessed crimson mouth with sixteen bevelled teeth", "angry inset eyes", "separate fists, fingers and three-toed feet"];
  return geometry;
}

/** A thick mirror fragment: smooth bevels surround gently crowned front and back faces. */
function mirrorShard(s: Sculpt, outline: XY[], z: number, tilt: number, face: string) {
  // Consistent counterclockwise outlines keep both silvered faces and fracture
  // bevels outward-facing, regardless of the hand-drawn fragment's point order.
  const area = outline.reduce((sum, p, i) => {
    const next = outline[(i + 1) % outline.length];
    return sum + p[0] * next[1] - next[0] * p[1];
  }, 0);
  if (area < 0) outline = [...outline].reverse();
  const center: XY = [outline.reduce((sum, p) => sum + p[0], 0) / outline.length,
    outline.reduce((sum, p) => sum + p[1], 0) / outline.length];
  const contour: XY[] = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    for (let j = 0; j < 6; j++) contour.push([THREE.MathUtils.lerp(a[0], b[0], j / 6), THREE.MathUtils.lerp(a[1], b[1], j / 6)]);
  }
  const bodyLevels: XY[] = [];
  for (let i = 0; i <= 5; i++) bodyLevels.push([i / 5 * .93, -.057 - .008 * Math.sin(i / 5 * Math.PI / 2)]);
  for (let i = 1; i <= 6; i++) {
    const a = i / 6 * Math.PI / 2;
    bodyLevels.push([.93 + Math.sin(a) * .07, -.043 - Math.cos(a) * .022]);
  }
  bodyLevels.push([1, .04]);
  for (let i = 1; i <= 6; i++) {
    const a = i / 6 * Math.PI / 2;
    bodyLevels.push([.93 + Math.cos(a) * .07, .04 + Math.sin(a) * .025]);
  }
  for (let i = 1; i <= 5; i++) bodyLevels.push([.93 * (1 - i / 5), .065 + .007 * Math.sin(i / 5 * Math.PI / 2)]);
  const vertices: number[] = [], indices: number[] = [], count = contour.length;
  for (let i = 0; i < bodyLevels.length; i++) {
    const [scale, depth] = bodyLevels[i];
    for (const [x, y] of contour) vertices.push(center[0] + (x - center[0]) * scale, center[1] + (y - center[1]) * scale,
      z + depth + (x - center[0]) * tilt);
    if (i) for (let j = 0; j < count; j++) {
      const q = (i - 1) * count + j, n = (i - 1) * count + (j + 1) % count;
      indices.push(q, n, q + count, n, n + count, q + count);
    }
  }
  s.surface("#8973ae", mesh(vertices, indices));
  // A silver-lavender silvered face is inset within the darker fracture bevel.
  const top: number[] = [], topIndices: number[] = [], topRings = 6;
  for (let i = 0; i <= topRings; i++) {
    const scale = i / topRings * .927;
    for (const [x, y] of contour) top.push(center[0] + (x - center[0]) * scale, center[1] + (y - center[1]) * scale,
      z + .073 - .007 * Math.pow(scale / .927, 2) + (x - center[0]) * tilt);
    if (i) for (let j = 0; j < count; j++) {
      const q = (i - 1) * count + j, n = (i - 1) * count + (j + 1) % count;
      topIndices.push(q, q + count, n, n, q + count, n + count);
    }
  }
  s.surface(face, mesh(top, topIndices));
  const a = outline[0], b = outline[1];
  sweep(s, "#f2e8ff", [[a[0] * .96 + center[0] * .04, a[1] * .96 + center[1] * .04, z + .063 + (a[0] - center[0]) * tilt],
    [b[0] * .96 + center[0] * .04, b[1] * .96 + center[1] * .04, z + .063 + (b[0] - center[0]) * tilt]], [.008, .005], 8, 6);
}

function shardtile() {
  const s = new Sculpt({ detail: "high" });
  const shards: { points: XY[]; z: number; tilt: number; color: string }[] = [
    { points: [[-.105, .48], [0, .735], [.135, .48], [.012, .345]], z: -.01, tilt: .14, color: "#ddd2ed" },
    { points: [[-.245, .322], [-.112, .49], [.012, .345], [-.125, .177]], z: .045, tilt: -.11, color: "#b9a4d6" },
    { points: [[.02, .35], [.143, .48], [.29, .275], [.12, .113]], z: -.025, tilt: -.08, color: "#d7c6eb" },
    { points: [[-.397, .422], [-.247, .323], [-.132, .182], [-.287, .128]], z: -.005, tilt: .13, color: "#e4d6f3" },
    { points: [[.284, .278], [.389, .447], [.365, .218], [.251, .105]], z: .045, tilt: .12, color: "#cbb7e0" },
    { points: [[-.287, .125], [-.132, .173], [-.215, -.027], [-.417, -.181], [-.566, .013]], z: -.035, tilt: -.10, color: "#d0bce6" },
    { points: [[.248, .103], [.365, .215], [.565, -.01], [.374, -.186], [.217, -.033]], z: -.005, tilt: .11, color: "#d9caeb" },
    { points: [[-.121, .181], [.014, .336], [.119, .118], [.046, .076], [-.047, .086]], z: .057, tilt: -.15, color: "#c2aedb" },
    { points: [[-.414, -.187], [-.214, -.032], [-.127, -.17], [-.247, -.34], [-.43, -.329]], z: .025, tilt: .09, color: "#bfa7db" },
    { points: [[.218, -.04], [.374, -.195], [.428, -.338], [.244, -.358], [.126, -.18]], z: .04, tilt: -.13, color: "#c9b6e2" },
    { points: [[-.24, -.347], [-.125, -.178], [-.003, -.287], [-.003, -.546], [-.122, -.48]], z: -.005, tilt: -.09, color: "#ded0ee" },
    { points: [[.005, -.286], [.126, -.183], [.24, -.364], [.005, -.551]], z: -.04, tilt: .14, color: "#bba5d5" },
    { points: [[-.118, -.484], [.003, -.558], [.132, -.473], [.003, -.707]], z: .01, tilt: -.11, color: "#cdb6e2" },
  ];
  for (const shard of shards) mirrorShard(s, shard.points, shard.z, shard.tilt, shard.color);
  // The eye floats in a true opening between the offset fragments.
  orb(s, "#5c247f", [0, .004, .092], [.213, .145, .108], 28, 18);
  orb(s, "#ddbcf3", [0, .003, .178], [.188, .108, .036], 28, 16);
  ellipseRim(s, "#9f58cf", [0, .003, .192], .195, .116, .018, 56, 10);
  orb(s, "#9e2ed0", [0, .002, .211], [.092, .105, .046], 28, 18);
  ellipseRim(s, "#cb75ec", [0, .002, .243], .069, .086, .009, 40, 8);
  orb(s, "#32104e", [0, .002, .258], [.023, .086, .011], 18, 12);
  orb(s, "#fff1ff", [-.027, .048, .259], [.016, .023, .008], 16, 10);
  // Backing of the same jewel and differently aligned mirror edges remain dimensional from behind.
  orb(s, "#9271b2", [0, .003, -.075], [.157, .109, .046], 24, 14);
  ellipseRim(s, "#b7a0d0", [0, .003, -.105], .13, .088, .009, 40, 8);
  const geometry = s.finish();
  geometry.userData.sculptFeatures = ["thirteen separate thick lavender mirror shards", "silvered crowned faces and bevelled fracture edges", "staggered diamond silhouette with open cracks", "floating purple slit eye", "finished mirror backs and rear eye setting"];
  return geometry;
}

// Longitudinal sections of a real pump: x, sole height, collar height, half-width.
const SHOE_PROFILE = [
  [-.73, -.595, -.515, 0], [-.635, -.635, -.432, .104], [-.47, -.635, -.347, .194],
  [-.29, -.587, -.276, .235], [-.085, -.398, -.045, .208], [.105, -.12, .262, .177],
  [.29, .115, .535, .155], [.445, .17, .705, .137], [.553, .225, .61, .095], [.607, .405, .405, 0],
];
function shoeProfile(t: number) {
  const q = THREE.MathUtils.clamp(t, 0, 1) * (SHOE_PROFILE.length - 1), i = Math.min(SHOE_PROFILE.length - 2, Math.floor(q)), u = q - i;
  const values = [0, 1, 2, 3].map(axis => {
    const a = SHOE_PROFILE[Math.max(0, i - 1)][axis], b = SHOE_PROFILE[i][axis];
    const c = SHOE_PROFILE[i + 1][axis], d = SHOE_PROFILE[Math.min(SHOE_PROFILE.length - 1, i + 2)][axis];
    return .5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  });
  values[3] = Math.max(0, values[3]);
  return values;
}
function shoePoint(t: number, angle: number, inside = false): Point {
  const [x, base, rim, width] = shoeProfile(t);
  const w = inside ? Math.max(0, width - .019) : width;
  const bottom = base + (inside ? .034 : 0), top = rim - (inside ? .012 : 0);
  return [x, bottom + (top - bottom) * Math.pow(1 - Math.cos(angle), 2), w * Math.sin(angle)];
}
function shoeShell(s: Sculpt, color: string, inside: boolean) {
  const vertices: number[] = [], indices: number[] = [], length = inside ? 68 : 80, cross = 32;
  for (let i = 0; i <= length; i++) {
    const t = inside ? .25 + .75 * i / length : i / length;
    for (let j = 0; j <= cross; j++) {
      vertices.push(...shoePoint(t, -Math.PI / 2 + Math.PI * j / cross, inside));
      if (i < length && j < cross) {
        const q = i * (cross + 1) + j;
        const face = [q, q + cross + 1, q + 1, q + 1, q + cross + 1, q + cross + 2];
        indices.push(...(inside ? [face[0], face[2], face[1], face[3], face[5], face[4]] : face));
      }
    }
  }
  s.surface(color, mesh(vertices, indices));
}

function heelsole() {
  const s = new Sculpt({ detail: "high" });
  shoeShell(s, "#ce348a", false);
  shoeShell(s, "#251326", true);
  // The arched outsole is a closed, thin oval section all the way from pointed toe to heel seat.
  const sole: number[] = [], soleIndices: number[] = [], sections = 76, sides = 24;
  for (let i = 0; i <= sections; i++) {
    const [x, base, , width] = shoeProfile(i / sections);
    for (let j = 0; j < sides; j++) {
      const a = j / sides * Math.PI * 2;
      sole.push(x, base - .016 + .027 * Math.sin(a), width * .79 * Math.cos(a));
      if (i < sections) {
        const q = i * sides + j, n = i * sides + (j + 1) % sides;
        soleIndices.push(q, q + sides, n, n, q + sides, n + sides);
      }
    }
  }
  s.surface("#581b4d", mesh(sole, soleIndices));
  // The toe box is genuinely closed above; its crescent back edge opens into the dark foot cavity.
  const vamp: number[] = [], vampIndices: number[] = [], longitudinal = 34, transverse = 26;
  for (let i = 0; i <= longitudinal; i++) {
    for (let j = 0; j <= transverse; j++) {
      const u = j / transverse * 2 - 1, end = .355 - .064 * (1 - u * u), t = i / longitudinal * end;
      const [x, , rim, width] = shoeProfile(t);
      vamp.push(x, rim + .037 * Math.sin(Math.PI * i / longitudinal) * (1 - u * u), width * u);
      if (i < longitudinal && j < transverse) {
        const q = i * (transverse + 1) + j;
        vampIndices.push(q, q + 1, q + transverse + 1, q + 1, q + transverse + 2, q + transverse + 1);
      }
    }
  }
  s.surface("#e34b9e", mesh(vamp, vampIndices));
  // Rolled collar connects outer leather to the lining on both sides, including the back counter.
  for (const side of [-1, 1]) {
    const edge: Point[] = [], lining: number[] = [], liningIndices: number[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = .355 + i / 60 * .645;
      const outer = shoePoint(t, side * Math.PI / 2), inner = shoePoint(t, side * Math.PI / 2, true);
      edge.push([outer[0], outer[1] + .002, outer[2]]);
      lining.push(...outer, ...inner);
      if (i < 60) {
        const q = i * 2;
        liningIndices.push(...(side > 0 ? [q, q + 2, q + 1, q + 1, q + 2, q + 3] : [q, q + 1, q + 2, q + 1, q + 3, q + 2]));
      }
    }
    s.surface("#ef69b4", mesh(lining, liningIndices));
    sweep(s, "#f379bd", edge.filter((_, i) => i % 4 === 0), [.011, .012, .010], 58, 8);
  }
  const collar: Point[] = [];
  for (let j = 0; j <= 20; j++) {
    const u = j / 20 * 2 - 1, t = .355 - .064 * (1 - u * u), [x, , rim, width] = shoeProfile(t);
    collar.push([x, rim + .003, width * u]);
  }
  sweep(s, "#f77dbf", collar, [.012, .012, .012], 36, 8);
  // Curved side inset and its seam travel over the shoe volume rather than forming a flat panel.
  for (const side of [-1, 1]) {
    const panel: number[] = [], panelIndices: number[] = [], seam: Point[] = [];
    for (let i = 0; i <= 52; i++) {
      const t = .07 + .84 * i / 52;
      for (let j = 0; j <= 5; j++) {
        const angle = side * (1.22 + j / 5 * .25), p = shoePoint(t, angle);
        p[2] += side * .004;
        panel.push(...p);
        if (j === 0 && i % 4 === 0) seam.push(p);
        if (i < 52 && j < 5) {
          const q = i * 6 + j;
          panelIndices.push(...(side > 0 ? [q, q + 6, q + 1, q + 1, q + 6, q + 7] : [q, q + 1, q + 6, q + 1, q + 7, q + 6]));
        }
      }
    }
    s.surface(side > 0 ? "#f35aaa" : "#b92d7e", mesh(panel, panelIndices));
    sweep(s, "#9f286f", seam, [.004, .005, .004], 42, 6);
  }
  sweep(s, "#a72573", [[.46, .23, 0], [.472, .015, 0], [.494, -.355, 0], [.501, -.655, 0]], [.071, .053, .029, .025], 38, 16, .85);
  sweep(s, "#e44399", [[.473, .148, .044], [.483, -.12, .029], [.505, -.602, .019]], [.018, .013, .009], 28, 8);
  orb(s, "#321b32", [.501, -.66, 0], [.032, .023, .034], 20, 12);
  // Raised gold eye fittings echo the two asymmetric marks on the reference toe.
  const eye: XY[] = [[-.108, .042], [.106, .075], [.077, -.018], [.015, -.065], [-.066, -.035]];
  bevel(s, "#683054", eye.map(([x, y]) => [x * 1.10, y * 1.10]), .015, [-.337, -.425, .226], .008, .05);
  bevel(s, "#f8d15b", eye, .024, [-.337, -.425, .241], .008, .05);
  orb(s, "#29243c", [-.321, -.419, .264], [.026, .042, .011], 20, 12);
  orb(s, "#fff7bf", [-.333, -.399, .276], [.009, .011, .004], 12, 8);
  bevel(s, "#ffdf70", [[-.034, -.021], [-.027, .026], [.012, .043], [.034, .01], [.022, -.025]], .022,
    [-.581, -.437, .123], .007, -.22);
  orb(s, "#372740", [-.579, -.432, .143], [.011, .017, .007], 14, 10);
  const geometry = s.finish();
  geometry.userData.sculptFeatures = ["volumetric pointed pump with closed toe box", "open foot cavity with dark inner lining", "curved arched outsole and narrow tapered stiletto", "rolled pink collar and curved side seams", "raised asymmetric gold eye fittings"];
  return geometry;
}

export const SCULPTS_M_CREATURES: Record<string, () => THREE.BufferGeometry> = {
  mon_gumguard: gumguard,
  mon_shardtile: shardtile,
  mon_heelsole: heelsole,
};
