import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

/** XY profiles are extruded toward the viewer; holes are real open geometry. */
function roundedRect(w: number, h: number, r: number, x = 0, y = 0) {
  const p = new THREE.Shape(), l = x - w / 2, b = y - h / 2, rr = Math.min(r, w / 2, h / 2);
  p.moveTo(l + rr, b); p.lineTo(l + w - rr, b);
  p.quadraticCurveTo(l + w, b, l + w, b + rr); p.lineTo(l + w, b + h - rr);
  p.quadraticCurveTo(l + w, b + h, l + w - rr, b + h); p.lineTo(l + rr, b + h);
  p.quadraticCurveTo(l, b + h, l, b + h - rr); p.lineTo(l, b + rr);
  p.quadraticCurveTo(l, b, l + rr, b);
  return p;
}

function plate(s: Sculpt, color: string, shape: THREE.Shape, z: number, depth: number, bevel = .006, curveSegments = 7) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, bevelEnabled: bevel > 0, bevelSegments: 3,
    bevelSize: bevel, bevelThickness: bevel, curveSegments,
  });
  g.translate(0, 0, z);
  s.surface(color, g);
}

function rim(s: Sculpt, color: string, x: number, y: number, z: number, w: number, h: number, r: number, width: number, depth = .018) {
  const shape = roundedRect(w, h, r, x, y);
  shape.holes.push(roundedRect(w - 2 * width, h - 2 * width, Math.max(.006, r - width), x, y));
  plate(s, color, shape, z, depth, .003);
}

function screw(s: Sculpt, x: number, y: number, z: number, radius = .012, back = false) {
  const direction = back ? -1 : 1;
  s.rod('#5b5d62', [x, y, z], [x, y, z + direction * .008], radius * 1.2);
  s.rod('#b1afb0', [x, y, z + direction * .008], [x, y, z + direction * .015], radius);
  s.box('#42434c', x, y, z + direction * .0155, radius * 1.25, .0035, .002, 0, 0, .35);
}

function meterOutline(inset = 0) {
  const p = new THREE.Shape(), sx = 1 - inset / .31, sy = 1 - inset / .46;
  const q = (x: number, y: number): [number, number] => [x * sx, 1.15 + (y - 1.15) * sy];
  p.moveTo(...q(-.206, .697)); p.lineTo(...q(.206, .697));
  p.bezierCurveTo(...q(.23, .70), ...q(.242, .75), ...q(.249, .81));
  p.lineTo(...q(.29, 1.24)); p.bezierCurveTo(...q(.315, 1.49), ...q(.14, 1.61), ...q(0, 1.61));
  p.bezierCurveTo(...q(-.14, 1.61), ...q(-.315, 1.49), ...q(-.29, 1.24));
  p.lineTo(...q(-.249, .81)); p.bezierCurveTo(...q(-.242, .75), ...q(-.23, .70), ...q(-.206, .697));
  return p;
}

/** #111: the original oval coin-eater, still balanced on its narrow three-foot post. */
function parkmeter() {
  const s = new Sculpt({ detail: "high" });
  // The shell's two apertures pass through the metal to a separate rear casting.
  // ExtrudeGeometry orients both hole walls inward, with outward-facing shell caps.
  const body = meterOutline();
  body.holes.push(roundedRect(.382, .234, .058, 0, 1.286));
  body.holes.push(roundedRect(.348, .087, .035, 0, .997));
  plate(s, '#87868c', body, -.115, .249, .014, 10);
  plate(s, '#62636b', meterOutline(.013), -.179, .041, .014, 10);
  const seam = meterOutline(.007);
  seam.holes.push(meterOutline(.028));
  plate(s, '#45464f', seam, -.132, .008, .002, 10);
  const perimeter = meterOutline(.021);
  perimeter.holes.push(meterOutline(.039));
  plate(s, '#b0adb1', perimeter, .145, .014, .004, 10);

  // A deep black gasket, rounded pressed rim, and pale enamel display retain
  // the sprite's tiny vertical eyes in the top window instead of enlarging them.
  plate(s, '#292a32', roundedRect(.365, .219, .05, 0, 1.286), .027, .018, .004);
  rim(s, '#54545e', 0, 1.286, .151, .417, .268, .066, .023, .013);
  rim(s, '#c2bec2', 0, 1.286, .17, .378, .226, .051, .014, .014);
  plate(s, '#c8c8c5', roundedRect(.323, .17, .028, 0, 1.284), .082, .023, .006);
  s.box('#f0ebe0', -.009, 1.356, .112, .255, .009, .009);
  for (const side of [-1, 1]) {
    const x = side * .077;
    plate(s, '#6c6b71', roundedRect(.061, .097, .018, x, 1.285), .11, .007, .003);
    plate(s, '#171a24', roundedRect(.033, .073, .008, x, 1.286), .12, .008, .003);
    s.box('#eee9e0', x - .005, 1.309, .133, .012, .017, .004);
  }

  // A genuinely recessed horizontal coin mouth has a rear wall and lower tray.
  plate(s, '#24252e', roundedRect(.334, .078, .029, 0, .997), -.064, .012, .003);
  rim(s, '#474853', 0, .997, .149, .384, .121, .047, .022, .013);
  rim(s, '#aaa7ab', 0, .997, .166, .354, .09, .032, .012, .014);
  s.box('#5b5962', 0, .973, .015, .292, .012, .175);
  s.box('#c5bdba', 0, .969, .122, .287, .008, .025);
  // Cast lower panel, a small keyhole, and faint raised denomination marks.
  plate(s, '#77757f', roundedRect(.307, .118, .026, 0, .823), .137, .008, .003);
  for (const x of [-.104, -.052, 0, .052, .104]) {
    s.box('#a4a0a5', x, .846, .151, .018, .006, .005);
    s.box('#6d6975', x, .822, .151, .018, .018, .005);
  }
  s.rod('#42424b', [0, .764, .14], [0, .764, .16], .013);
  s.box('#30333d', 0, .753, .162, .009, .019, .004);
  for (const x of [-.204, .204]) for (const y of [.849, 1.119]) screw(s, x, y, .146, .009);
  screw(s, 0, 1.529, .15, .011);

  // Turned neck and fluted pole: the foot does not become an extra character.
  s.lathe('#62616d', [[0,.15],[.058,.15],[.066,.205],[.051,.26],[.043,.57],[.057,.65],[.069,.68],[.066,.72],[0,.72]], 0, 0, 0);
  s.lathe('#a09ba6', [[.046,.257],[.057,.257],[.061,.272],[.055,.293],[.046,.293],[.046,.257]], 0, 0, 0);
  s.lathe('#9c97a1', [[.049,.605],[.064,.605],[.07,.624],[.068,.641],[.052,.648],[.049,.605]], 0, 0, 0);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, r = .044;
    s.rod(i % 2 ? '#76717e' : '#98909e', [Math.sin(a)*r,.309,Math.cos(a)*r], [Math.sin(a)*r,.565,Math.cos(a)*r], .004);
  }
  s.lathe('#6e6875', [[0,.075],[.086,.075],[.098,.105],[.086,.15],[.062,.19],[0,.19]], 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3 + Math.PI, x = Math.sin(a) * .126, z = Math.cos(a) * .126;
    s.roundedBox('#726c7d', x, .059, z, .105, .095, .211, .018, 0, a, 0);
    s.roundedBox('#a39aa7', Math.sin(a)*.174, .099, Math.cos(a)*.174, .079, .027, .075, .011, 0, a, 0);
  }

  // The back has a separate maintenance door, pressed ribs and bolt heads.
  plate(s, '#77757e', roundedRect(.345, .517, .087, 0, 1.145), -.199, .014, .006);
  rim(s, '#494953', 0, 1.145, -.203, .321, .485, .071, .008, .003);
  for (const x of [-.127, .127]) for (const y of [.966, 1.324]) screw(s, x, y, -.208, .009, true);
  for (let i = 0; i < 4; i++) s.box('#5d5a67', 0, 1.147 + i*.032, -.216, .183, .008, .008);
  s.box('#aaa2ac', 0, 1.034, -.219, .117, .039, .009);
  for (const x of [-.042, 0, .042]) s.box('#55515f', x, 1.035, -.225, .012, .019, .003);
  const geometry = s.finish();
  geometry.userData.sculptFeatures = ['oval-bevelled-cast-shell', 'open-window-and-coin-mouth', 'inset-small-enamel-eyes', 'pressed-display-rims', 'coin-tray', 'keyhole', 'turned-fluted-post', 'three-foot-base', 'shell-seam', 'slotted-screws', 'rear-maintenance-door'];
  return geometry;
}

/** A bent newspaper has visible thickness and individually raised printed strokes. */
function newspaper(s: Sculpt) {
  const page = new THREE.Shape();
  page.moveTo(-.252,.725); page.lineTo(.228,.712); page.lineTo(.266,1.128);
  page.lineTo(-.209,1.143); page.closePath();
  plate(s, '#bcb18d', page, .127, .012, .004);
  const inset = new THREE.Shape();
  inset.moveTo(-.232,.744); inset.lineTo(.211,.732); inset.lineTo(.244,1.109);
  inset.lineTo(-.192,1.122); inset.closePath();
  plate(s, '#d7caa0', inset, .145, .006, .002);
  // Headline relief deliberately remains tiny newspaper marks, as in the art.
  s.box('#645e4b', .021, 1.077, .158, .362, .012, .006, 0, 0, -.027);
  const glyphs = [
    [1,0,1,1,1,1,1,0,1], [1,1,1,1,0,0,1,1,1],
    [1,0,1,1,0,1,1,1,1], [1,1,1,1,1,0,0,1,1],
  ];
  glyphs.forEach((glyph, i) => glyph.forEach((on, j) => {
    if (on) s.box('#6b624b', -.129 + i*.091 + (j%3)*.019, 1.029 - Math.floor(j/3)*.021, .159, .014, .017, .005);
  }));
  // A geometric thumbnail, caption and two separated text columns.
  s.box('#83785b', -.126, .904, .158, .117, .123, .006, 0, 0, -.027);
  s.box('#b8aa7e', -.126, .91, .163, .091, .094, .006, 0, 0, -.027);
  const scene = new THREE.Shape();
  scene.moveTo(-.171,.872); scene.lineTo(-.136,.918); scene.lineTo(-.112,.885); scene.lineTo(-.09,.908); scene.lineTo(-.081,.87); scene.closePath();
  plate(s, '#746b53', scene, .167, .004, 0, 1);
  for (let i = 0; i < 6; i++) {
    s.box('#847859', .074, .946 - i*.025, .16, .173 - (i%3)*.016, .007, .005, 0, 0, -.027);
    if (i < 3) s.box('#8d805e', -.131, .828 - i*.025, .161, .117 - (i%2)*.016, .006, .005, 0, 0, -.027);
  }
  s.box('#9b8e6a', .004, .764, .163, .366, .007, .004, 0, 0, -.027);
  // The folded lower corner protrudes toward the viewer as a real paper flap.
  const flap = new THREE.BufferGeometry();
  flap.setAttribute('position', new THREE.Float32BufferAttribute([
    .171,.736,.158, .211,.732,.157, .217,.789,.175,
    .171,.736,.155, .217,.789,.172, .211,.732,.154,
    .171,.736,.155, .171,.736,.158, .217,.789,.175,
    .171,.736,.155, .217,.789,.175, .217,.789,.172,
    .211,.732,.154, .217,.789,.172, .217,.789,.175,
    .211,.732,.154, .217,.789,.175, .211,.732,.157,
    .171,.736,.155, .211,.732,.154, .211,.732,.157,
    .171,.736,.155, .211,.732,.157, .171,.736,.158,
  ], 3));
  flap.computeVertexNormals(); s.surface('#e0d3aa', flap);
}

/** #112: the squat gray vending box, with the sprite's newspaper and low-set eyes. */
function newsbox() {
  const s = new Sculpt({ detail: "high" });
  // Five folded sheet-metal panels surround the recessed display and door.
  s.roundedBox('#72747b', -.356, .724, -.034, .073, 1.093, .525, .019);
  s.roundedBox('#5d626c', .356, .724, -.034, .073, 1.093, .525, .019);
  s.roundedBox('#636870', 0, .725, -.276, .674, 1.075, .069, .02);
  s.roundedBox('#686c75', 0, .212, -.015, .724, .094, .569, .019);
  s.roundedBox('#9b9b9c', 0, 1.25, -.014, .736, .067, .577, .017);
  const front = roundedRect(.655, .975, .021, 0, .727);
  front.holes.push(roundedRect(.542, .467, .015, 0, .946));
  front.holes.push(roundedRect(.079, .09, .008, -.16, .497));
  front.holes.push(roundedRect(.079, .09, .008, .16, .497));
  plate(s, '#888b8e', front, .23, .031, .009);
  // Real inner sill, reveal walls and a dark back define the display depth.
  plate(s, '#30363d', roundedRect(.557, .482, .017, 0, .946), .081, .018, .004);
  rim(s, '#53565e', 0, .946, .267, .594, .523, .022, .023, .015);
  rim(s, '#a8a5a0', 0, .946, .284, .55, .48, .014, .013, .012);
  s.box('#9b998e', 0, .714, .193, .52, .013, .16);
  s.box('#696b67', -.262, .947, .191, .015, .436, .169);
  s.box('#74746c', .262, .947, .191, .015, .436, .169);
  s.box('#686b64', 0, 1.176, .192, .52, .017, .164);
  newspaper(s);
  // The sprite's small square eyes remain low on the metal door.
  for (const side of [-1, 1]) {
    const x = side*.16;
    plate(s, '#252b34', roundedRect(.073, .084, .009, x, .497), .17, .015, .004);
    rim(s, '#b2b2b0', x, .497, .265, .09, .101, .011, .009, .009);
    s.box('#e3e8e1', x-.009, .514, .191, .02, .026, .005);
    s.box('#505b65', x+.014, .477, .191, .016, .009, .004);
  }
  // Two tiny pressed chevrons and an indented pull lip belong to the original door.
  for (const side of [-1, 1]) {
    s.rod('#454a52', [side*.265-.012,.574,.274], [side*.265,.556,.274], .005);
    s.rod('#454a52', [side*.265,.556,.274], [side*.265+.012,.574,.274], .005);
    s.rod('#4d535a', [side*.264-.012,.355,.274], [side*.264,.34,.274], .005);
    s.rod('#4d535a', [side*.264,.34,.274], [side*.264+.012,.355,.274], .005);
  }
  s.box('#4a505a', 0, .298, .273, .388, .012, .014);
  s.roundedBox('#aaa9a5', 0, .288, .287, .36, .026, .03, .009);
  for (const x of [-.294, .294]) for (const y of [.292, 1.162]) screw(s, x, y, .274, .009);

  // Slanted, overhanging roof; the ribs are actual rounded metal pressings.
  const slope = .112;
  s.roundedBox('#575d66', 0, 1.293, -.039, .821, .051, .674, .013, slope);
  s.roundedBox('#a8a7a1', 0, 1.325, -.041, .807, .047, .664, .013, slope);
  for (let i = 0; i < 9; i++) {
    const x = -.326 + i*.0815;
    const rib = new THREE.CapsuleGeometry(.009, .584, 3, 10);
    rib.scale(1, 1, .8); rib.rotateX(Math.PI/2 + slope); rib.translate(x, 1.354, -.046);
    s.surface(i%2 ? '#bbb8ad' : '#b1afa8', rib);
  }
  s.roundedBox('#d0cac0', 0, 1.318, .29, .811, .023, .027, .008);
  s.box('#5a5d64', 0, 1.281, .293, .76, .012, .013);

  // The right edge carries a raised service plate, key cylinder and split hinge.
  s.roundedBox('#424852', .401, .772, .035, .025, .312, .104, .008);
  s.roundedBox('#9c9e9b', .417, .774, .034, .018, .278, .078, .006);
  s.rod('#525862', [.424,.835,.036], [.443,.835,.036], .029);
  const keyRing = new THREE.TorusGeometry(.023, .006, 8, 24);
  keyRing.rotateY(Math.PI/2); keyRing.translate(.445,.835,.036); s.surface('#b9b6a9', keyRing);
  s.box('#252e38', .451, .834, .036, .003, .023, .005);
  s.box('#303843', .431, .722, .036, .008, .077, .013);
  s.box('#c4bfb0', .438, .727, .024, .01, .066, .008);
  for (const y of [.675, .877]) s.rod('#d2cec1', [.427,y,.035], [.438,y,.035], .008);
  for (const y of [.49, 1.037]) {
    s.roundedBox('#626773', -.336, y, .259, .037, .119, .057, .011);
    for (let j = 0; j < 3; j++) s.rod(j%2 ? '#a1a3a2' : '#777d84', [-.351,y-.049+j*.035,.279], [-.351,y-.023+j*.035,.279], .018);
  }

  // Two short feet and darker rear supports preserve the source's square stance.
  for (const side of [-1, 1]) {
    s.roundedBox('#525565', side*.269, .122, .125, .164, .15, .278, .012);
    s.roundedBox('#939095', side*.269, .079, .213, .169, .057, .123, .011);
    s.box('#3c414e', side*.269, .045, .18, .151, .018, .207);
    s.box('#555764', side*.274, .117, -.201, .116, .151, .109);
  }
  // Back folds, screws, vent slots and a stamped maintenance label are fully modeled.
  s.roundedBox('#757a7f', 0, .76, -.321, .544, .793, .021, .011);
  for (const x of [-.244, .244]) for (const y of [.4, 1.12]) screw(s, x, y, -.334, .01, true);
  for (let i = 0; i < 6; i++) {
    s.box('#3b424d', 0, .483+i*.038, -.337, .34, .012, .006);
    s.box('#929398', 0, .491+i*.038, -.342, .34, .005, .008);
  }
  s.box('#a7a49a', 0, .937, -.338, .188, .105, .007);
  for (let i = 0; i < 4; i++) s.box('#60646a', -.013, .909+i*.018, -.344, .128-(i%2)*.037, .005, .004);
  s.box('#49505c', -.389, .731, -.117, .007, .863, .012);
  s.box('#a0a0a0', -.391, .277, -.03, .01, .013, .421);
  const geometry = s.finish();
  geometry.userData.sculptFeatures = ['folded-metal-box', 'slanted-ribbed-roof', 'deep-open-newspaper-window', 'raised-headline-and-text-columns', 'folded-paper-corner', 'low-inset-square-eyes', 'pressed-door-chevrons', 'pull-lip', 'side-key-cylinder', 'split-barrel-hinges', 'short-square-feet', 'rear-vents-and-service-label', 'slotted-screws'];
  return geometry;
}

export const SCULPTS_N_STREET: Record<string, () => THREE.BufferGeometry> = {
  mon_parkmeter: parkmeter,
  mon_newsbox: newsbox,
};
