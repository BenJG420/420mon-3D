import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type Point = [number, number, number];
type Profile = [number, number][];

/** Authored castings, pressed panels, and surface-mounted details for the two machines. */
function place(s: Sculpt, color: string, geometry: THREE.BufferGeometry, position: Point = [0, 0, 0], rotation: Point = [0, 0, 0]) {
  geometry.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)));
  geometry.translate(...position);
  s.surface(color, geometry);
}

function casting(s: Sculpt, color: string, profile: Profile, position: Point, segments = 48, rotation: Point = [0, 0, 0]) {
  place(s, color, new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), segments), position, rotation);
}

function bead(s: Sculpt, color: string, position: Point, scale: Point, segments = 16, rings = 10, rotation: Point = [0, 0, 0]) {
  const geometry = new THREE.SphereGeometry(1, segments, rings);
  geometry.scale(...scale);
  place(s, color, geometry, position, rotation);
}

function ring(s: Sculpt, color: string, position: Point, radius: number, thickness: number, rotation: Point = [Math.PI / 2, 0, 0], segments = 40) {
  place(s, color, new THREE.TorusGeometry(radius, thickness, 8, segments), position, rotation);
}

function cylinder(s: Sculpt, color: string, from: Point, to: Point, radius: number, radiusEnd = radius, segments = 16) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), axis = b.clone().sub(a);
  const geometry = new THREE.CylinderGeometry(radiusEnd, radius, axis.length(), segments);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize()));
  place(s, color, geometry, a.add(b).multiplyScalar(.5).toArray() as Point);
}

function cable(s: Sculpt, color: string, points: Point[], radius: number, segments: number, radialSegments = 8) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  place(s, color, new THREE.TubeGeometry(curve, segments, radius, radialSegments, false));
  for (const point of [points[0], points[points.length - 1]]) bead(s, color, point, [radius, radius, radius], 8, 6);
}

function roundedShape(width: number, height: number, radius: number) {
  const x = -width / 2, y = -height / 2, r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y); shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r); shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function pressed(s: Sculpt, color: string, width: number, height: number, depth: number, radius: number, bevel: number, position: Point, rotation: Point = [0, 0, 0]) {
  const geometry = new THREE.ExtrudeGeometry(roundedShape(width, height, radius), {
    depth, bevelEnabled: bevel > 0, bevelSegments: 2, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 4,
  });
  geometry.translate(0, 0, -depth / 2);
  place(s, color, geometry, position, rotation);
}

function sprinkler() {
  const s = new Sculpt({ detail: "high" });
  const gold = "#d6a72f", lightGold = "#f1c651", ochre = "#ac7820", bronze = "#76551c", dark = "#3c321d";

  // A closed, cast foot: the little machine has volume behind its four bolted toes.
  casting(s, bronze, [[0, -.59], [.23, -.59], [.30, -.565], [.325, -.525], [.325, -.45], [.29, -.415], [0, -.415]], [0, 0, 0]);
  casting(s, gold, [[0, -.565], [.26, -.565], [.305, -.535], [.31, -.49], [.29, -.46], [.22, -.45], [0, -.45]], [0, 0, 0]);
  ring(s, lightGold, [0, -.458, 0], .28, .015);
  for (const x of [-.235, .235]) for (const z of [-.17, .17]) {
    bead(s, ochre, [x, -.568, z], [.13, .077, .132]);
    casting(s, gold, [[0, -.062], [.087, -.062], [.11, -.04], [.113, .012], [.095, .045], [0, .045]], [x, -.53, z], 24);
    casting(s, bronze, [[0, 0], [.052, 0], [.052, .012], [0, .012]], [x, -.481, z], 20);
    casting(s, lightGold, [[0, 0], [.035, 0], [.035, .025], [0, .025]], [x, -.466, z], 6);
    s.box(ochre, x, -.439, z, .038, .005, .008);
  }
  // Concentric seals and turned shoulders wrap the central spindle on every side.
  casting(s, ochre, [[0, -.45], [.19, -.45], [.215, -.42], [.215, -.31], [.18, -.285], [.18, -.23], [0, -.23]], [0, 0, 0]);
  casting(s, lightGold, [[0, -.416], [.205, -.416], [.224, -.397], [.224, -.368], [.207, -.351], [0, -.351]], [0, 0, 0]);
  ring(s, bronze, [0, -.303, 0], .18, .012);
  casting(s, gold, [[0, -.29], [.165, -.29], [.185, -.265], [.185, -.075], [.16, -.045], [.16, .31], [.18, .335], [0, .335]], [0, 0, 0]);
  casting(s, lightGold, [[0, -.122], [.18, -.122], [.204, -.104], [.204, -.071], [.18, -.05], [0, -.05]], [0, 0, 0]);
  ring(s, bronze, [0, -.22, 0], .185, .009);
  ring(s, ochre, [0, .065, 0], .162, .013);
  ring(s, lightGold, [0, .102, 0], .164, .011);
  // Narrow casting ribs, and the round service plug visible between the front toes.
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5;
    cylinder(s, ochre, [Math.sin(a) * .185, -.266, Math.cos(a) * .185], [Math.sin(a) * .185, -.15, Math.cos(a) * .185], .008, .009, 8);
  }
  cylinder(s, bronze, [0, -.366, .19], [0, -.366, .236], .061, .057, 24);
  cylinder(s, lightGold, [0, -.366, .237], [0, -.366, .249], .043, .043, 12);
  s.box(ochre, 0, -.366, .252, .053, .009, .004);

  // Two black eyes sit under the cap, following the round spindle rather than a flat face.
  for (const side of [-1, 1]) {
    bead(s, bronze, [side * .074, .233, .145], [.046, .066, .022]);
    bead(s, "#161e21", [side * .074, .235, .161], [.028, .047, .014]);
    bead(s, "#e8e7d1", [side * .068, .255, .173], [.008, .013, .004], 10, 6);
  }
  cylinder(s, lightGold, [-.11, .17, .124], [.11, .17, .124], .012, .012, 12);

  // Eight rounded cap sectors are separated by the dark casting underneath.
  const underCap = new THREE.SphereGeometry(1, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  underCap.scale(.478, .347, .478);
  place(s, bronze, underCap, [0, .332, 0]);
  place(s, ochre, new THREE.CircleGeometry(.476, 48), [0, .332, 0], [Math.PI / 2, 0, 0]);
  const capColors = ["#dfb640", "#e5bc44", "#d6a333", "#d9a93b", "#cba036", "#d7ad40", "#e9bf47", "#ecc34c"];
  for (let i = 0; i < 8; i++) {
    const sector = new THREE.SphereGeometry(1, 7, 12, i * Math.PI / 4 + .012, Math.PI / 4 - .024, .06, Math.PI / 2 - .075);
    sector.scale(.487, .355, .487);
    place(s, capColors[i], sector, [0, .337, 0]);
  }
  ring(s, ochre, [0, .336, 0], .465, .029, [Math.PI / 2, 0, 0], 48);
  ring(s, lightGold, [0, .358, 0], .476, .014, [Math.PI / 2, 0, 0], 48);
  // The horizontal seam across the dome is also a physical, shallow bronze groove.
  ring(s, ochre, [0, .54, 0], .394, .0075, [Math.PI / 2, 0, 0], 48);
  bead(s, lightGold, [0, .688, 0], [.081, .016, .081], 20, 8);

  // Separate side outlets have tightening collars, hollow-looking mouths and feed elbows.
  for (const side of [-1, 1]) {
    cylinder(s, bronze, [side * .15, .015, 0], [side * .24, .015, 0], .071, .071, 20);
    cylinder(s, gold, [side * .195, .015, 0], [side * .38, .055, .012], .049, .045, 20);
    cylinder(s, lightGold, [side * .23, .022, .002], [side * .268, .03, .004], .063, .063, 12);
    cable(s, ochre, [[side * .34, .048, .012], [side * .415, .09, .014], [side * .45, .105, .018]], .044, 10, 10);
    // Profile is closed along the axis; the dark recessed aperture remains visible within its lip.
    casting(s, gold, [[0, 0], [.044, 0], [.058, .022], [.059, .054], [.039, .073], [.039, .105], [.049, .115], [.049, .139], [0, .139]], [side * .425, .101, .018], 24, [0, 0, -side * Math.PI / 2]);
    cylinder(s, dark, [side * .566, .101, .018], [side * .573, .101, .018], .034, .034, 20);
    ring(s, lightGold, [side * .576, .101, .018], .04, .009, [0, Math.PI / 2, 0], 24);
    // Discontinuous fans of clear blue droplets retain the tiny source sprite's spray silhouette.
    for (const slope of [-.72, .08, .89]) {
      const base: Point = [side * .586, .104, .018];
      const end: Point = [side * .713, .104 + .127 * slope, .025];
      cable(s, "#64c9f4", [base, [side * .65, .104 + .064 * slope, .021], end], .012, 7, 6);
      for (let i = 0; i < 3; i++) {
        const distance = .18 + i * .123;
        const point: Point = [side * (.574 + distance), .104 + distance * slope, .022 + .009 * i];
        const angle = -side * Math.atan2(1, slope);
        bead(s, i === 2 ? "#88d9ff" : "#65bde9", point, [.023 + i * .003, .041 + i * .003, .025], 12, 8, [0, 0, angle]);
        bead(s, "#d8f6ff", [point[0] - side * .007, point[1] + .012, point[2] + .02], [.009, .019, .006], 8, 6, [0, 0, angle]);
      }
    }
  }
  const geometry = s.finish();
  geometry.userData.sculptFeatures = ["eight segmented domed brass cap panels", "turned spindle with two inset dark eyes", "concentric metal seals and casting ribs", "paired collared side spray nozzles", "individual blue water jets and highlighted droplets", "four bolted toes on a broad golden foot", "front service plug"];
  return geometry;
}

/** A flat raised conductor with mitered bends and bevelled edges, built in local XY. */
function trace(s: Sculpt, color: string, points: [number, number][], position: Point, rotation: Point, width = .012) {
  const left: THREE.Vector2[] = [], right: THREE.Vector2[] = [];
  for (let i = 0; i < points.length; i++) {
    const point = new THREE.Vector2(...points[i]);
    const before = new THREE.Vector2(...points[Math.max(0, i - 1)]);
    const after = new THREE.Vector2(...points[Math.min(points.length - 1, i + 1)]);
    const incoming = (i === 0 ? after.clone().sub(point) : point.clone().sub(before)).normalize();
    const outgoing = (i === points.length - 1 ? point.clone().sub(before) : after.clone().sub(point)).normalize();
    const n1 = new THREE.Vector2(-incoming.y, incoming.x), n2 = new THREE.Vector2(-outgoing.y, outgoing.x);
    const miter = n1.clone().add(n2).normalize();
    miter.multiplyScalar(width / 2 / Math.max(.35, miter.dot(n1)));
    left.push(point.clone().add(miter)); right.push(point.clone().sub(miter));
  }
  const outline = [...left, ...right.reverse()];
  const shape = new THREE.Shape(outline);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .004, steps: 1, bevelEnabled: true, bevelThickness: .0015, bevelSize: .0015, bevelSegments: 1, curveSegments: 1 });
  place(s, color, geometry, position, rotation);
}

function circuitPad(s: Sculpt, color: string, x: number, y: number, position: Point, rotation: Point, size = .018) {
  const geometry = new THREE.CylinderGeometry(size, size, .006, 12);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(x, y, .004);
  place(s, color, geometry, position, rotation);
}

function bladeu() {
  const s = new Sculpt({ detail: "high" });
  const housing = "#302841", edge = "#665080", board = "#231c33", traceColor = "#8860bc", dark = "#12131e";
  const top: Point = [0, .343, 0], topRotation: Point = [-Math.PI / 2, 0, 0];

  // A deep, closed server enclosure with soft pressed seams and recessed panels on every face.
  s.roundedBox(housing, 0, -.025, 0, 1.08, .69, 1.01, .048);
  pressed(s, edge, 1.035, .965, .021, .035, .009, [0, .327, 0], topRotation);
  pressed(s, board, .986, .916, .015, .023, .004, top, topRotation);
  pressed(s, "#463358", 1.012, .584, .02, .025, .006, [0, -.047, .504]);
  pressed(s, dark, .918, .373, .012, .016, .005, [0, -.077, .522]);
  // Long seams and rounded rails make the box read as a metal blade chassis, not a cube.
  for (const side of [-1, 1]) {
    pressed(s, "#4c3864", .905, .534, .012, .025, .005, [side * .539, -.029, 0], [0, side * Math.PI / 2, 0]);
    pressed(s, board, .852, .477, .008, .016, .003, [side * .548, -.029, 0], [0, side * Math.PI / 2, 0]);
    s.box("#80609d", side * .513, .294, 0, .017, .013, .91);
    s.box("#201a2c", side * .513, -.328, 0, .025, .018, .92);
  }
  pressed(s, "#453452", .99, .537, .015, .028, .005, [0, -.033, -.506], [0, Math.PI, 0]);

  // The visible top face reproduces the purple maze of branched PCB tracks.
  const topTracks: [number, number][][] = [
    [[-.426, .36], [-.22, .36], [-.22, .294], [-.105, .294]],
    [[-.425, .265], [-.32, .265], [-.32, .199], [-.169, .199], [-.169, .083]],
    [[-.422, .12], [-.272, .12], [-.272, .014], [-.362, .014], [-.362, -.083]],
    [[-.426, -.183], [-.23, -.183], [-.23, -.296], [-.132, -.296], [-.132, -.391]],
    [[-.425, -.37], [-.334, -.37], [-.334, -.277]],
    [[-.074, .401], [-.074, .333], [.032, .333], [.032, .192], [.117, .192]],
    [[.031, .404], [.122, .404], [.122, .277], [.212, .277], [.212, .166], [.33, .166]],
    [[.234, .402], [.408, .402], [.408, .328], [.309, .328]],
    [[.264, .255], [.42, .255], [.42, .071], [.319, .071]],
    [[.431, -.027], [.24, -.027], [.24, .081], [.115, .081], [.115, -.034], [.012, -.034]],
    [[-.091, .145], [-.091, .015], [-.169, .015], [-.169, -.1], [-.049, -.1], [-.049, -.211]],
    [[.032, .128], [.032, .059]],
    [[.047, -.116], [.154, -.116], [.154, -.267], [.276, -.267], [.276, -.393]],
    [[.424, -.138], [.321, -.138], [.321, -.214], [.426, -.214], [.426, -.394]],
    [[-.027, -.4], [-.027, -.294], [.064, -.294], [.064, -.389]],
    [[-.439, -.047], [-.425, -.047]],
  ];
  for (const points of topTracks) {
    trace(s, traceColor, points, [0, .356, 0], topRotation);
    const first = points[0], last = points[points.length - 1];
    circuitPad(s, "#9b78c8", ...first, [0, .356, 0], topRotation, .015);
    circuitPad(s, "#9b78c8", ...last, [0, .356, 0], topRotation, .017);
  }
  // Small drilled-looking pad centres interrupt the otherwise continuous printed metal.
  for (const [x, z] of [[-.425, .265], [-.334, -.277], [.117, .192], [.309, .328], [.319, .071], [.064, -.389]]) {
    circuitPad(s, "#463451", x, z, [0, .365, 0], topRotation, .006);
  }

  for (const side of [-1, 1]) {
    const pos: Point = [side * .558, -.027, 0], rotation: Point = [0, side * Math.PI / 2, 0];
    const paths: [number, number][][] = [
      [[-.39, .189], [-.23, .189], [-.23, .095], [-.092, .095], [-.092, -.024]],
      [[.009, .189], [.009, .042], [.161, .042], [.161, -.082], [.363, -.082]],
      [[.118, .189], [.315, .189], [.315, .117], [.39, .117]],
      [[-.388, .041], [-.316, .041], [-.316, -.098], [-.216, -.098], [-.216, -.196]],
      [[-.388, -.18], [-.322, -.18]],
      [[-.105, -.196], [-.105, -.122], [.036, -.122], [.036, -.197], [.22, -.197]],
      [[.386, .02], [.277, .02]],
    ];
    for (const points of paths) {
      trace(s, side === -1 ? "#705098" : "#75529e", points, pos, rotation, .011);
      circuitPad(s, traceColor, ...points[points.length - 1], pos, rotation, .014);
    }
  }

  // An upper row of nine pink-white LEDs forms the source character's eyes; the end cell is green.
  pressed(s, "#715287", .963, .114, .021, .012, .004, [0, .225, .523]);
  pressed(s, "#151624", .927, .079, .013, .008, .002, [0, .225, .541]);
  const pink = "#ff87db", white = "#fff0fd", green = "#8fffa4";
  for (let i = 0; i < 9; i++) {
    const x = -.407 + i * .1018;
    pressed(s, i === 8 ? green : pink, .071, .055, .012, .006, .002, [x, .227, .554]);
    pressed(s, i === 8 ? "#d4ffce" : white, .042, .043, .006, .003, .001, [x - .003, .23, .563]);
  }
  // A real recessed intake: black depth between shallow bronze-purple louvres.
  for (let i = 0; i < 9; i++) {
    const y = .12 - i * .035;
    s.box(i % 2 ? "#302739" : "#3c2e4c", 0, y, .539, .677, .009, .022, .12, 0, 0);
  }
  for (const x of [-.338, -.17, 0, .17, .338]) s.box("#1c1826", x, -.023, .547, .009, .279, .009);
  for (const side of [-1, 1]) {
    const sideTrace: [number, number][] = [[side * .415, .121], [side * .376, .121], [side * .376, .039], [side * .428, .039], [side * .428, -.075], [side * .382, -.075], [side * .382, -.203]];
    trace(s, traceColor, sideTrace, [0, 0, .543], [0, 0, 0], .016);
    circuitPad(s, "#ab80d7", side * .415, .121, [0, 0, .543], [0, 0, 0], .018);
    s.box("#795b98", side * .46, -.263, .531, .045, .025, .023);
  }
  // The deep U pull has rounded bends, a dark inner opening, and two cylindrical fasteners.
  for (const side of [-1, 1]) {
    pressed(s, "#705582", .087, .135, .034, .017, .004, [side * .271, -.126, .561]);
    cylinder(s, dark, [side * .271, -.085, .582], [side * .271, -.085, .591], .019, .019, 12);
    s.box("#aa95bc", side * .271, -.085, .595, .023, .004, .004);
    cylinder(s, "#56445f", [side * .272, -.156, .575], [side * .272, -.156, .631], .03, .03, 16);
  }
  cable(s, "#82738e", [[-.273, -.14, .626], [-.273, -.24, .635], [-.231, -.272, .644], [0, -.276, .644], [.231, -.272, .644], [.273, -.24, .635], [.273, -.14, .626]], .027, 36, 12);
  cable(s, "#b3a5bd", [[-.234, -.261, .66], [0, -.266, .666], [.234, -.261, .66]], .007, 16, 6);

  // Four squat hardware feet and the understated rear service details complete the volume.
  for (const x of [-.426, .426]) for (const z of [-.375, .375]) {
    pressed(s, "#44374e", .126, .112, .139, .015, .006, [x, -.386, z]);
    s.box("#1d1926", x, -.445, z, .112, .018, .124);
    s.box("#755988", x, -.37, z + .073, .085, .012, .006);
  }
  pressed(s, dark, .654, .201, .013, .016, .003, [0, .048, -.521], [0, Math.PI, 0]);
  for (let i = 0; i < 8; i++) s.box("#665474", -.276 + i * .079, .048, -.532, .014, .159, .017);
  pressed(s, "#211d2a", .409, .075, .015, .008, .002, [0, -.208, -.524], [0, Math.PI, 0]);
  for (let i = 0; i < 10; i++) s.box("#a58c6d", -.174 + i * .039, -.209, -.536, .017, .047, .006);
  for (const x of [-.462, .462]) for (const y of [-.267, .24]) {
    cylinder(s, "#1d1729", [x, y, -.519], [x, y, -.529], .021, .021, 12);
    s.box("#90789d", x, y, -.532, .025, .005, .005);
  }

  const geometry = s.finish();
  // Select LED colours after merging so every housing vertex has an explicit zero glow weight.
  const emissiveColors = [pink, white, green, "#d4ffce"].map(color => new THREE.Color(color));
  const colors = geometry.getAttribute("color");
  const glowWeight = new Float32Array(colors.count);
  for (let i = 0; i < colors.count; i++) {
    if (emissiveColors.some(color => Math.abs(colors.getX(i) - color.r) < .00001 && Math.abs(colors.getY(i) - color.g) < .00001 && Math.abs(colors.getZ(i) - color.b) < .00001)) glowWeight[i] = .8;
  }
  geometry.setAttribute("glowWeight", new THREE.BufferAttribute(glowWeight, 1));
  geometry.userData.glowSurface = true;
  geometry.userData.sculptFeatures = ["full-depth bevelled purple server blade enclosure", "raised branching circuits and drilled pads across top and both sides", "nine separate pink-white and green LED eyes", "recessed front intake with individual louvres", "projecting U pull handle with fasteners", "four short feet", "rear ventilation and contacts", "vertex-isolated LED glow"];
  return geometry;
}

export const SCULPTS_N_MECHANISMS: Record<string, () => THREE.BufferGeometry> = {
  mon_sprinkler: sprinkler,
  mon_bladeu: bladeu,
};
