import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type Point = [number, number, number];
type Profile = [number, number][];

function place(s: Sculpt, color: string, geometry: THREE.BufferGeometry, position: Point = [0, 0, 0], rotation: Point = [0, 0, 0]) {
  geometry.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)));
  geometry.translate(...position);
  s.surface(color, geometry);
}

/** Revolved profiles keep the rim, recess, barrel and rear cap genuinely separate. */
function turn(s: Sculpt, color: string, profile: Profile, position: Point = [0, 0, 0], rotation: Point = [Math.PI / 2, 0, 0], segments = 64) {
  place(s, color, new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), segments), position, rotation);
}

function bead(s: Sculpt, color: string, position: Point, scale: Point, segments = 16, rings = 10) {
  const geometry = new THREE.SphereGeometry(1, segments, rings);
  geometry.scale(...scale); place(s, color, geometry, position);
}

function line(s: Sculpt, color: string, points: Point[], radius: number, segments = 14) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  place(s, color, new THREE.TubeGeometry(curve, segments, radius, 6, false));
}

function screw(s: Sculpt, x: number, y: number, z: number, color: string, slot: string, rear = false, radius = .023) {
  const direction = rear ? -1 : 1;
  turn(s, color, [[0, -.007], [radius * .85, -.007], [radius, 0], [radius, .009], [radius * .75, .014], [0, .014]], [x, y, z], [direction * Math.PI / 2, 0, 0], 16);
  s.box(slot, x, y, z + direction * .015, radius * 1.3, .006, .002);
}

/** Extruded and bevelled outlines for eyebrows and a clock's sharp gaze. */
function relief(s: Sculpt, color: string, points: [number, number][], z: number, depth = .012, bevel = .005) {
  const shape = new THREE.Shape(points.map(p => new THREE.Vector2(...p)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 2,
    bevelSize: bevel, bevelThickness: bevel, curveSegments: 2, steps: 1 });
  place(s, color, geometry, [0, 0, z]);
}

function belltimer() {
  const s = new Sculpt({ detail: "high" });
  const iron = "#616467", steel = "#898c8e", edge = "#b4b8b8", charcoal = "#303235", dark = "#17151c";
  const red = "#b41529", scarlet = "#e32b3b", shadowRed = "#7d1121";

  // Deep pressed case, with its curved rear and a physically open front bezel.
  turn(s, iron, [[0, -.205], [.32, -.205], [.46, -.182], [.525, -.14], [.55, -.075], [.555, .09],
    [.542, .145], [.515, .175], [.455, .175], [.45, .08], [.455, -.115], [0, -.13]]);
  turn(s, charcoal, [[.434, .115], [.505, .115], [.518, .16], [.512, .197], [.487, .215], [.447, .215], [.434, .19], [.434, .115]]);
  turn(s, steel, [[.464, .185], [.508, .185], [.529, .203], [.528, .23], [.512, .245], [.475, .247], [.458, .23], [.458, .202], [.464, .185]]);
  turn(s, edge, [[.501, .238], [.514, .238], [.519, .245], [.513, .251], [.501, .251], [.501, .238]]);
  turn(s, dark, [[0, .105], [.434, .105], [.444, .135], [.444, .172], [.431, .186], [0, .186]]);
  // Red enamel is set below the rim; its very shallow crown has rounded shoulders.
  turn(s, shadowRed, [[0, .15], [.405, .15], [.429, .165], [.43, .181], [.417, .195], [0, .195]]);
  turn(s, red, [[0, .183], [.385, .183], [.415, .193], [.413, .202], [.365, .209], [.25, .216], [0, .218]]);

  // Casting lugs and a narrow case seam continue all around, including the rear.
  for (let i = 0; i < 20; i++) {
    const a = i * Math.PI / 10, x = Math.sin(a), y = Math.cos(a);
    s.box(i % 2 ? steel : iron, x * .547, y * .547, -.005, .027, .043, .15, 0, 0, -a);
  }
  turn(s, charcoal, [[.541, -.09], [.553, -.09], [.553, -.074], [.541, -.074], [.541, -.09]]);
  turn(s, steel, [[0, -.214], [.343, -.214], [.385, -.198], [.39, -.179], [0, -.179]]);
  turn(s, charcoal, [[.292, -.215], [.307, -.215], [.307, -.22], [.292, -.22], [.292, -.215]]);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    screw(s, Math.sin(a) * .355, Math.cos(a) * .355, -.212, edge, charcoal, true);
  }
  s.roundedBox(charcoal, 0, -.04, -.226, .23, .125, .018, .01);
  for (let i = 0; i < 5; i++) s.box(iron, -.075 + i * .037, -.04, -.237, .012, .077, .004);
  s.box(edge, 0, .17, -.222, .13, .012, .003);
  s.box(iron, 0, .135, -.222, .085, .008, .003);

  // Minute marks read as small engravings without hiding the original face.
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12, major = i % 6 === 0;
    s.box(i === 12 ? scarlet : shadowRed, Math.sin(a) * .394, Math.cos(a) * .394, .207,
      major ? .012 : .006, major ? .035 : .014, .004, 0, 0, -a);
  }
  for (const side of [-1, 1]) {
    const eye: [number, number][] = [[.06, -.018], [.095, -.13], [.2, -.16], [.255, -.086], [.278, .056], [.212, .021], [.175, -.025], [.12, -.048]];
    relief(s, dark, eye.map(([x, y]) => [side * x, y]), .222, .013, .007);
    bead(s, iron, [side * .137, -.084, .249], [.023, .032, .009], 12, 8);
    bead(s, "#d3d2d2", [side * .126, -.059, .258], [.008, .014, .003], 10, 6);
    relief(s, dark, [[side * .07, .025], [side * .115, -.02], [side * .27, .083], [side * .262, .13], [side * .17, .052]], .232, .017, .007);
  }
  // A single long red stroke at six o'clock is visible in the source sheet.
  s.roundedBox(scarlet, 0, -.371, .245, .022, .143, .021, .007);

  // Wound spring neck and a domed red stop button; side pins are separate fittings.
  turn(s, charcoal, [[0, -.055], [.102, -.055], [.112, -.032], [.11, .021], [.081, .052], [0, .052]], [0, .576, 0], [0, 0, 0], 32);
  turn(s, steel, [[0, -.035], [.069, -.035], [.078, -.018], [.078, .07], [.057, .085], [0, .085]], [0, .63, 0], [0, 0, 0], 32);
  for (let i = 0; i < 3; i++) turn(s, iron, [[.071, 0], [.081, 0], [.081, .01], [.071, .01], [.071, 0]], [0, .633 + i * .02, 0], [0, 0, 0], 24);
  turn(s, shadowRed, [[0, -.06], [.115, -.06], [.137, -.043], [.142, .017], [.13, .043], [.09, .066], [0, .071]], [0, .76, 0], [0, 0, 0], 48);
  turn(s, red, [[0, -.018], [.136, -.018], [.135, .028], [.118, .05], [.075, .069], [0, .073]], [0, .76, 0], [0, 0, 0], 48);
  bead(s, scarlet, [-.05, .807, .052], [.042, .014, .04], 12, 8);
  for (const side of [-1, 1]) {
    turn(s, charcoal, [[0, -.04], [.061, -.04], [.067, -.023], [.066, .028], [.055, .043], [0, .043]], [side * .563, 0, -.02], [0, 0, -side * Math.PI / 2], 24);
    turn(s, steel, [[0, -.02], [.041, -.02], [.048, -.007], [.048, .025], [0, .025]], [side * .606, 0, -.02], [0, 0, -side * Math.PI / 2], 24);
    bead(s, charcoal, [side * .315, -.545, -.005], [.128, .074, .137]);
    bead(s, iron, [side * .32, -.582, .035], [.135, .055, .17]);
    bead(s, steel, [side * .324, -.566, .106], [.089, .023, .092], 16, 8);
    s.roundedBox(charcoal, side * .32, -.617, .028, .236, .025, .27, .012);
  }
  return s.finish();
}

/** Four closed triangular faces make a raised lance, with distinct lit/shadow facets. */
function needle(s: Sculpt, tip: Point, left: Point, right: Point, ridge: Point, light: string, shadow: string) {
  const vertices: Point[][] = [[left, tip, ridge], [tip, right, ridge], [right, left, ridge], [tip, left, right]];
  const center = [tip, left, right, ridge].reduce((sum, p) => sum.add(new THREE.Vector3(...p)), new THREE.Vector3()).multiplyScalar(.25);
  for (let i = 0; i < vertices.length; i++) {
    const face = vertices[i];
    const [a, b, c] = face.map(p => new THREE.Vector3(...p));
    const normal = b.clone().sub(a).cross(c.clone().sub(a));
    if (normal.dot(a.clone().add(b).add(c).multiplyScalar(1 / 3).sub(center)) < 0) face.reverse();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(face.flat(), 3));
    g.computeVertexNormals(); s.surface(i === 0 ? light : shadow, g);
  }
}

function compass() {
  const s = new Sculpt({ detail: "high" });
  const brass = "#b89026", gold = "#e1b945", edge = "#f5d469", brown = "#70521d", seam = "#45351e";
  const purple = "#622c9b", deepPurple = "#362049", violet = "#9553c8";
  const dialY = .06;

  // Full cast brass case: turned outer shoulder and a deep violet dial reveal.
  turn(s, brass, [[0, -.2], [.35, -.2], [.49, -.17], [.56, -.11], [.58, -.045], [.577, .085], [.552, .16],
    [.495, .199], [.417, .199], [.408, .137], [.413, -.115], [0, -.135]], [0, dialY, 0]);
  turn(s, brown, [[.411, .119], [.493, .119], [.514, .17], [.504, .22], [.45, .237], [.412, .204], [.411, .119]], [0, dialY, 0]);
  turn(s, gold, [[.42, .192], [.452, .192], [.478, .212], [.48, .242], [.467, .268], [.442, .279], [.421, .269], [.414, .246], [.414, .216], [.42, .192]], [0, dialY, 0]);
  turn(s, edge, [[.447, .267], [.46, .267], [.465, .276], [.46, .283], [.447, .283], [.447, .267]], [0, dialY, 0]);
  turn(s, deepPurple, [[0, .127], [.397, .127], [.412, .149], [.411, .188], [.396, .202], [0, .202]], [0, dialY, 0]);
  turn(s, purple, [[0, .191], [.365, .191], [.396, .2], [.389, .211], [.31, .218], [0, .221]], [0, dialY, 0]);

  // Fine engraved divisions and a subdued sixteen-point rose sit behind the needle.
  for (let i = 0; i < 48; i++) {
    const a = i * Math.PI / 24, major = i % 6 === 0;
    s.box(major ? "#b58c9b" : "#7a469c", Math.sin(a) * .374, dialY + Math.cos(a) * .374, .221,
      major ? .009 : .004, major ? .032 : .013, .003, 0, 0, -a);
  }
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, length = i % 2 ? .19 : .275;
    const rotate = (x: number, y: number): [number, number] => [x * Math.cos(a) + y * Math.sin(a), dialY - x * Math.sin(a) + y * Math.cos(a)];
    relief(s, i % 2 ? "#6b3798" : "#815099", [rotate(-.017, .057), rotate(0, length), rotate(.017, .057)], .224, .003, .001);
  }
  // Original diagonal copper/rose needle has a proper ridge, underside and pivot bearing.
  const axis = new THREE.Vector2(.71, .704), cross = new THREE.Vector2(-axis.y, axis.x);
  for (const side of [-1, 1]) {
    const point = (along: number, across: number, z: number): Point => [axis.x * along * side + cross.x * across, dialY + axis.y * along * side + cross.y * across, z];
    needle(s, point(.357, 0, .263), point(.01, .052, .263), point(.01, -.052, .263), point(.125, 0, .303), side > 0 ? "#efd0ab" : "#d9ac9e", side > 0 ? "#a77457" : "#925b53");
  }
  turn(s, brown, [[0, -.018], [.064, -.018], [.075, -.006], [.074, .019], [.057, .032], [0, .032]], [0, dialY, .294], [Math.PI / 2, 0, 0], 32);
  bead(s, gold, [0, dialY, .33], [.046, .046, .022]);
  bead(s, edge, [-.011, dialY + .012, .349], [.013, .016, .005], 10, 6);

  // Separate lower jewel sockets, each inset into its own stepped brass collar.
  for (const side of [-1, 1]) {
    turn(s, brown, [[0, -.024], [.072, -.024], [.083, -.007], [.081, .021], [.061, .036], [0, .036]], [side * .285, -.359, .155], [Math.PI / 2, 0, 0], 32);
    turn(s, gold, [[.051, .012], [.072, .012], [.076, .025], [.067, .04], [.052, .04], [.048, .027], [.051, .012]], [side * .285, -.359, .165], [Math.PI / 2, 0, 0], 32);
    bead(s, purple, [side * .285, -.359, .204], [.049, .049, .032]);
    bead(s, violet, [side * .297, -.345, .232], [.019, .022, .005], 12, 8);
    bead(s, "#efcdfb", [side * .303, -.339, .237], [.008, .01, .003], 8, 6);
    bead(s, brown, [side * .32, -.53, -.015], [.115, .09, .115]);
    bead(s, brass, [side * .335, -.579, .055], [.14, .074, .158]);
    bead(s, gold, [side * .348, -.563, .116], [.094, .043, .086]);
    s.box(brown, side * .335, -.629, .044, .209, .014, .23);
  }

  // Pocket ring, hollow suspension bail and fluted crown retain real negative space.
  turn(s, brown, [[0, -.045], [.098, -.045], [.109, -.021], [.104, .034], [.076, .05], [0, .05]], [0, .61, 0], [0, 0, 0], 32);
  turn(s, brass, [[0, -.031], [.074, -.031], [.083, -.012], [.082, .036], [.06, .052], [0, .052]], [0, .662, 0], [0, 0, 0], 32);
  s.torus(brown, 0, .735, -.015, .092, .032);
  s.torus(gold, 0, .741, .003, .086, .022);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    s.rod(gold, [Math.sin(a) * .082, .648, Math.cos(a) * .082], [Math.sin(a) * .082, .686, Math.cos(a) * .082], .004);
  }

  // Closed back, concentric tooling marks, screws and small scattered worn edges.
  turn(s, brown, [[0, -.213], [.364, -.213], [.41, -.193], [.417, -.17], [0, -.17]], [0, dialY, 0]);
  turn(s, brass, [[0, -.223], [.319, -.223], [.362, -.212], [.371, -.191], [0, -.191]], [0, dialY, 0]);
  turn(s, gold, [[.259, -.225], [.269, -.225], [.269, -.228], [.259, -.228], [.259, -.225]], [0, dialY, 0]);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    screw(s, Math.sin(a) * .323, dialY + Math.cos(a) * .323, -.22, gold, brown, true, .019);
  }
  for (let i = 0; i < 8; i++) {
    const a = .35 + i * .73;
    line(s, i % 2 ? gold : brown, [[Math.sin(a) * .56, dialY + Math.cos(a) * .56, -.02],
      [Math.sin(a + .04) * .564, dialY + Math.cos(a + .04) * .564, .013],
      [Math.sin(a + .075) * .557, dialY + Math.cos(a + .075) * .557, .047]], .004, 4);
  }
  // Raised maker's lozenge and fine radial lines only on the back.
  relief(s, brown, [[0, dialY + .135], [-.07, dialY], [0, dialY - .135], [.07, dialY]], -.237, .004, .002);
  for (let i = 0; i < 5; i++) s.box(brown, 0, dialY - .16 - i * .009, -.228, .13 - i * .012, .003, .003);
  return s.finish();
}

export const SCULPTS_O_INSTRUMENTS = { mon_belltimer: belltimer, mon_compass: compass };
