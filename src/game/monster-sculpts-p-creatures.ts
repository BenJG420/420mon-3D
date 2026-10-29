import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];

function oval(s: Sculpt, color: string, center: P, size: P, width = 20, height = 12) {
  s.surface(color, new THREE.SphereGeometry(1, width, height).scale(...size).translate(...center));
}

function cord(s: Sculpt, color: string, points: P[], radius: number, steps = 24, sides = 8) {
  const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  s.surface(color, new THREE.TubeGeometry(path, steps, radius, sides, false));
}

function turn(s: Sculpt, color: string, profile: [number, number][], center: P,
  rotation: P = [Math.PI / 2, 0, 0], segments = 48) {
  s.surface(color, new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), segments)
    .applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation))).translate(...center));
}

/** A small raised patch tangent to the original rounded body, including its back. */
function spot(s: Sculpt, color: string, center: THREE.Vector3, normal: THREE.Vector3, sx: number, sy: number, depth: number) {
  const g = new THREE.SphereGeometry(1, 10, 6).scale(sx, sy, depth);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal));
  s.surface(color, g.translate(center.x, center.y, center.z));
}

/** #122: the source's hunched wet imp holding its pitted float on a crooked stem. */
function floatball() {
  const s = new Sculpt({ detail: "high" });
  const skin = "#71617f", ridge = "#8d7b94", shade = "#514a5c", moss = "#7a8155";
  oval(s, shade, [.08, .38, -.025], [.245, .27, .19], 28, 18);
  oval(s, skin, [.075, .425, .015], [.22, .255, .18], 28, 18);
  // Broad drooping head remains a complete round volume on rotation.
  oval(s, skin, [.1, .665, .015], [.303, .32, .245], 32, 22);
  oval(s, "#81708b", [.072, .772, .003], [.22, .208, .222], 24, 16);
  oval(s, "#666950", [.09, .425, .135], [.16, .127, .071], 20, 12);
  for (const side of [-1, 1]) {
    const x = .07 + side * .19;
    // Separate crouched knees and palms give the creature its low stance.
    oval(s, shade, [x, .235, .025], [.119, .123, .124]);
    oval(s, ridge, [x + side * .035, .14, .13], [.092, .074, .123]);
    for (let finger = 0; finger < 3; finger++) {
      const spread = (finger - 1) * .061, start: P = [x + side * .028 + spread * .65, .117, .17];
      const end: P = [x + side * .052 + spread, .054 + .009 * Math.abs(finger - 1), .286 - .012 * Math.abs(finger - 1)];
      cord(s, skin, [start, [start[0] + spread * .25, .084, .236], end], .019, 12, 8);
      oval(s, "#a8a0a6", [end[0], end[1], end[2] + .008], [.013, .008, .023], 12, 8);
    }
  }
  // Low right arm folds against the flank; left arm curls upward to grip the stem.
  cord(s, shade, [[.314, .5, -.014], [.335, .362, .07], [.292, .306, .132]], .054, 20, 10);
  oval(s, ridge, [.286, .32, .15], [.058, .063, .05]);
  cord(s, skin, [[-.13, .5, .015], [-.222, .625, .035], [-.235, .83, .019]], .048, 24, 10);
  oval(s, ridge, [-.239, .853, .018], [.063, .068, .052]);
  for (let i = 0; i < 3; i++) {
    const y = .819 + i * .026;
    cord(s, "#a093a6", [[-.28, y, .01], [-.255, y + .012, .067], [-.217, y + .009, .058]], .01, 12, 6);
  }
  // Slender kinked metal stem reaches the float without thickening the silhouette.
  cord(s, "#666274", [[-.238, .872, .012], [-.279, 1.019, .013], [-.265, 1.1, .008],
    [-.104, 1.215, -.003], [-.1, 1.36, -.007]], .021, 32, 10);
  cord(s, "#bbb5b5", [[-.25, .891, .028], [-.286, 1.016, .028], [-.272, 1.093, .024], [-.111, 1.219, .012]], .005, 24, 6);
  for (const y of [1.006, 1.036]) turn(s, "#8e8991", [[0, -.012], [.031, -.012], [.033, .009], [0, .009]], [-.278, y, .014], [0, 0, 0], 20);
  // Large ivory float with an equatorial cast seam, small pores and brown deposits.
  const ball = new THREE.Vector3(-.105, 1.582, -.005), radii = new THREE.Vector3(.263, .28, .25);
  oval(s, "#d8d1b4", ball.toArray() as P, radii.toArray() as P, 32, 22);
  const seam: P[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = i / 48 * Math.PI * 2;
    seam.push([ball.x + Math.sin(a) * .263, ball.y - .006, ball.z + Math.cos(a) * .25]);
  }
  cord(s, "#c1b99d", seam, .004, 48, 6);
  for (let i = 0; i < 26; i++) {
    const y = 1 - 2 * (i + .5) / 26, r = Math.sqrt(1 - y * y), a = i * 2.399963;
    const normal = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const center = normal.clone().multiply(radii).add(ball);
    spot(s, i % 3 ? "#9f9676" : "#aaa186", center, normal, .016 + i % 3 * .004, .014 + i % 2 * .005, .003);
    spot(s, "#e8e2ca", center.clone().addScaledVector(normal, .003), normal, .009, .008, .002);
  }
  for (const side of [-1, 1]) {
    const x = ball.x + side * .115;
    oval(s, "#897e61", [x, 1.577, .218], [.043, .048, .011], 16, 10);
    oval(s, "#443e36", [x, 1.578, .228], [.022, .028, .007], 16, 10);
    oval(s, "#fbf7dd", [x - .009, 1.589, .234], [.008, .011, .003], 10, 6);
  }
  // Thin hanging stains and drops beneath the float are source-shaped geometry.
  for (let i = 0; i < 5; i++) {
    const x = ball.x - .17 + i * .085, y = 1.582 - .28 * Math.sqrt(1 - ((x - ball.x) / .263) ** 2);
    cord(s, i % 2 ? "#827989" : "#b7afa5", [[x, y + .04, .11], [x + .006, y - .028, .105], [x + .004, y - .09 - (i % 2) * .025, .103]], .0045, 12, 6);
    oval(s, "#8e8199", [x + .004, y - .1 - (i % 2) * .025, .103], [.007, .014, .007], 10, 6);
  }
  // Source eyes are large yellow rings set in deep purple sockets.
  for (const side of [-1, 1]) {
    const x = .09 + side * .14, y = side < 0 ? .684 : .622;
    oval(s, "#484057", [x, y, .222], [.094, .111, .043]);
    oval(s, "#bd9945", [x, y, .256], [.066, .083, .023]);
    oval(s, "#f4d86a", [x, y + .003, .276], [.046, .061, .012]);
    oval(s, "#342a34", [x + .003, y, .288], [.022, .041, .008], 16, 10);
    oval(s, "#fff2b4", [x - .014, y + .028, .295], [.01, .013, .003], 10, 6);
  }
  cord(s, "#48434d", [[-.09, .505, .219], [.025, .471, .239], [.137, .458, .24], [.243, .491, .204]], .013, 28, 8);
  for (let i = 0; i < 6; i++) {
    const x = -.055 + i * .05;
    s.rod("#9aa17b", [x, .498 - .018 * Math.sin(i / 5 * Math.PI), .237], [x + .007, .456 - .019 * Math.sin(i / 5 * Math.PI), .235], .005);
  }
  // Narrow moss trails follow the curved skull; rear streaks preserve full-volume detail.
  const trails: P[][] = [
    [[-.092, .94, .08], [-.057, .877, .165], [-.11, .813, .194], [-.082, .767, .223]],
    [[.088, .982, .033], [.038, .929, .126], [.091, .876, .191], [.05, .825, .225]],
    [[.219, .934, .067], [.253, .87, .125], [.2, .82, .202], [.242, .774, .209]],
    [[.353, .725, .091], [.349, .652, .155], [.324, .58, .156]],
    [[-.13, .776, -.13], [-.123, .681, -.184], [-.104, .577, -.143]],
    [[.17, .923, -.104], [.205, .811, -.188], [.143, .714, -.226], [.19, .611, -.187]],
  ];
  for (const points of trails) cord(s, moss, points, .009, 22, 6);
  cord(s, moss, [[.032, .37, .19], [.044, .29, .164], [.03, .228, .136]], .009, 16, 6);
  cord(s, "#545c42", [[.135, .375, .195], [.15, .299, .159], [.136, .261, .151]], .006, 14, 6);
  return s.finish();
}

/** #125: two distinct curved, bevelled steel blades above green grips and a leaf. */
function shears() {
  const s = new Sculpt({ detail: "high" });
  const silver = "#b3bec9", bright = "#e0e7ec", steel = "#677886", dark = "#3b4954";
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(side * .035, .735);
    shape.bezierCurveTo(side * .295, .91, side * .505, 1.306, side * .487, 1.695);
    shape.bezierCurveTo(side * .467, 1.732, side * .44, 1.605, side * .406, 1.503);
    shape.bezierCurveTo(side * .328, 1.309, side * .197, 1.129, side * .057, .956);
    shape.lineTo(side * .035, .735);
    const blade = new THREE.ExtrudeGeometry(shape, {depth:.067, bevelEnabled:true,
      bevelSegments:3, bevelSize:.014, bevelThickness:.012, curveSegments:24, steps:1});
    s.surface(silver, blade.translate(0, 0, -.042));
    // Narrow curved cutting edge and the thicker rear spine catch different light.
    cord(s, bright, [[side * .077, .97, .03], [side * .228, 1.183, .031],
      [side * .359, 1.408, .031], [side * .463, 1.677, .026]], .008, 40, 6);
    cord(s, steel, [[side * .095, .82, -.046], [side * .312, 1.05, -.048],
      [side * .445, 1.376, -.046], [side * .48, 1.665, -.04]], .012, 40, 8);
    // Polished shallow groove follows the blade's bend, not a straight overlaid stripe.
    cord(s, "#91a0ae", [[side * .16, 1.008, .036], [side * .294, 1.22, .035], [side * .408, 1.48, .034]], .005, 28, 6);
    for (let i = 0; i < 4; i++) {
      const t = i / 3, x = side * (.16 + .16 * t), y = 1.03 + .27 * t;
      s.rod("#d2dce2", [x, y, .037], [x + side * .035, y + .037, .037], .0025);
    }
    // The green handle is a contoured stalk-like grip, with rounded cut end and ribs.
    const handle: P[] = [[side * .068, .685, -.006], [side * .137, .536, -.007],
      [side * .217, .338, -.004], [side * .281, .14, .014]];
    cord(s, "#478930", handle, .066, 38, 12);
    oval(s, "#38702c", [side * .279, .128, .02], [.082, .071, .065]);
    cord(s, "#75b83c", [[side * .091, .635, .05], [side * .156, .488, .051], [side * .222, .31, .053], [side * .262, .184, .06]], .016, 28, 8);
    for (let i = 0; i < 6; i++) {
      const t = i / 5, x = side * (.137 + .12 * t), y = .536 - .337 * t;
      cord(s, i % 2 ? "#588e2c" : "#92c843", [[x - .037, y + .019, .045], [x, y + .009, .063], [x + .037, y - .001, .045]], .006, 10, 6);
    }
    // Small splayed green toes close the grips rather than leaving open tube ends.
    cord(s, "#4d8b2d", [[side * .28, .118, .025], [side * .321, .074, .069], [side * .363, .055, .075]], .027, 16, 8);
    oval(s, "#689e36", [side * .361, .055, .075], [.033, .018, .026], 12, 8);
    oval(s, "#8cbf4d", [side * .118, .599, .052], [.035, .042, .012], 12, 8);
  }
  // Rivet plate has a stepped circular face and rear bearing, with two tiny eyes.
  turn(s, dark, [[0, -.06], [.125, -.06], [.17, -.032], [.177, .015], [.157, .052], [0, .052]], [0, .775, 0]);
  turn(s, steel, [[0, .045], [.132, .045], [.16, .055], [.156, .083], [.126, .099], [0, .099]], [0, .775, 0]);
  turn(s, silver, [[0, .096], [.114, .096], [.135, .102], [.13, .12], [.1, .128], [0, .128]], [0, .775, 0]);
  turn(s, "#8a989f", [[0, -.083], [.09, -.083], [.113, -.067], [.108, -.053], [0, -.053]], [0, .775, 0]);
  s.box(dark, 0, .775, -.085, .082, .012, .008, 0, 0, -.35);
  for (const side of [-1, 1]) {
    oval(s, dark, [side * .06, .791, .128], [.028, .048, .013], 16, 10);
    oval(s, "#eaf3f4", [side * .06, .793, .139], [.014, .034, .006], 14, 8);
    oval(s, "#283544", [side * .057, .782, .145], [.009, .023, .004], 12, 8);
    oval(s, bright, [side * .065, .81, .147], [.005, .01, .002], 10, 6);
  }
  // A closed serrated lamina, softly arched along the midrib, between the blades.
  const leaf = new THREE.Shape();
  const leafPoints: [number, number][] = [[.11,1.048],[.047,1.195],[-.018,1.304],[-.105,1.377],[-.205,1.401],
    [-.187,1.377],[-.26,1.383],[-.239,1.354],[-.306,1.35],[-.282,1.32],[-.341,1.304],
    [-.297,1.267],[-.239,1.218],[-.155,1.183],[-.073,1.154],[.002,1.126]];
  leaf.moveTo(...leafPoints[0]); for (const p of leafPoints.slice(1)) leaf.lineTo(...p); leaf.closePath();
  const lamina = new THREE.ExtrudeGeometry(leaf, {depth:.022,bevelEnabled:true,bevelSize:.006,bevelThickness:.008,bevelSegments:3});
  s.surface("#72b82e", lamina.translate(0, 0, .005));
  cord(s, "#355f25", [[.118,1.029,.01],[.054,1.156,.041],[-.087,1.268,.047],[-.291,1.326,.034]], .01, 30, 8);
  for (let i = 0; i < 5; i++) {
    const t = i / 4, x = .026 - .225 * t, y = 1.174 + .125 * t;
    cord(s, "#95ce45", [[x,y,.04],[x-.031,y+.047,.041],[x-.053,y+.064,.035]], .0035, 10, 6);
    cord(s, "#528b29", [[x,y,.04],[x-.006,y-.033,.04],[x-.025,y-.055,.033]], .003, 10, 6);
  }
  return s.finish();
}

export const SCULPTS_P_CREATURES: Record<string, () => THREE.BufferGeometry> = {
  mon_floatball: floatball,
  mon_shears: shears,
};
