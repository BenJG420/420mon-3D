import type * as THREE from "three";
import { Sculpt } from "./model-sculpt";
import { SCULPTS_F_AQUATIC } from "./monster-sculpts-f-aquatic";

type P = [number, number, number];
const ball = (s: Sculpt, c: string, p: P, r: P) => s.ellipsoid(c, ...p, ...r);
const line = (s: Sculpt, c: string, a: P, b: P, r = .02) => s.rod(c, a, b, r);

/** #61: amber resin shell, pointed face, leaf crown and dripping purple roots. */
function harzback() {
  const s = new Sculpt(), amber = '#bd7c0c', gold = '#cf9213', shade = '#855012', root = '#522d61';
  ball(s, root, [0, .58, -.015], [.32, .38, .25]);
  ball(s, amber, [0, .8, 0], [.35, .36, .27]);
  // Raised resin nodules follow the round shell, leaving the lower face clear.
  for (let row = 0; row < 4; row++) for (let i = 0; i < 13; i++) {
    const a = i * Math.PI * 2 / 13 + row * .23, y = .65 + row * .115;
    const width = Math.sqrt(1 - ((y - .8) / .39) ** 2);
    if (Math.sin(a) > .35 && y < .9) continue;
    const p: P = [Math.cos(a) * .329 * width, y, Math.sin(a) * .254 * width];
    ball(s, (i + row) % 3 ? gold : shade, p, [.043, .055, .036]);
    if (i % 3 === 0) ball(s, '#ffe58c', [p[0] - .01, y + .019, p[2] + .019], [.012, .017, .008]);
  }
  // A raised V brow and tapering amber snout form the source's heart-shaped mask.
  for (const a of [-1, 1]) {
    ball(s, gold, [a * .15, .72, .215], [.175, .22, .087]);
    line(s, amber, [a * .29, .83, .24], [a * .08, .91, .29], .037);
    line(s, shade, [a * .28, .72, .26], [a * .06, .47, .28], .023);
    ball(s, shade, [a * .143, .72, .295], [.09, .104, .038]);
    ball(s, '#f7cf55', [a * .143, .72, .322], [.073, .085, .018]);
    ball(s, '#242331', [a * .143, .72, .337], [.057, .067, .022]);
    ball(s, '#0c1721', [a * .142, .71, .353], [.035, .043, .009]);
    ball(s, '#e5e0c8', [a * .143 - .018, .744, .359], [.015, .019, .009]);
  }
  s.panel(gold, [[-.13, .65, .3], [0, .43, .3], [.13, .65, .3], [0, .77, .3]], .075);
  line(s, '#ffcf43', [0, .68, .344], [0, .49, .344], .019);
  // Individual hanging roots curl and taper; the purple skirt is real volume.
  for (let i = 0; i < 11; i++) {
    const a = i * Math.PI * 2 / 11, x = Math.cos(a) * .29, z = Math.sin(a) * .21;
    const end = .19 + (i % 3) * .055;
    const points: P[] = [[x, .62, z], [x * 1.13, .46, z * 1.1], [x * .97, .34, z * 1.2], [x * 1.1, end, z * 1.12]];
    for (let j = 0; j < points.length - 1; j++) {
      line(s, j % 2 ? '#734378' : root, points[j], points[j + 1], .03 - j * .006);
      ball(s, root, points[j + 1], [.028 - j * .005, .035, .027 - j * .005]);
    }
  }
  // Serrated leaves fan out from the central crown, with separate midribs.
  for (const [x, y, z, lean] of [[0, 1.44, -.03, .09], [-.28, 1.31, 0, -.12], [.3, 1.31, -.01, .1], [-.16, 1.4, -.1, -.07], [.19, 1.47, -.09, .08]]) {
    const bx = lean * .2, by = 1.055, mid = (x + bx) * .5, my = (y + by) * .5;
    s.panel('#647d18', [[bx - .025, by, z], [mid - .065, my - .03, z], [mid - .058, my + .035, z], [x - .055, y - .07, z], [x, y, z], [x + .015, y - .1, z], [mid + .065, my + .025, z], [mid + .048, my - .035, z], [bx + .025, by, z]], .028);
    line(s, '#a8ac31', [bx, by, z + .021], [x, y - .04, z + .021], .009);
  }
  return s.finish();
}

/** #62: closed amber jellyfish bell, lamp eyes and thin violet tendrils. */
function lampjell() {
  const s = new Sculpt(), gold = '#bc781b', rim = '#cf8a24', purple = '#652674';
  s.dome(gold, 0, 1.02, 0, .4, .43, .3);
  ball(s, '#b27327', [0, 1.015, 0], [.401, .045, .301]);
  ball(s, rim, [0, 1.04, 0], [.41, .035, .31]);
  // Fine ribs and small resin highlights trace the bell's curved contour.
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9;
    for (let j = 0; j < 6; j++) {
      const t = j * Math.PI / 13, u = (j + 1) * Math.PI / 13;
      const point = (v: number): P => [Math.cos(a) * .402 * Math.sin(v), 1.02 + .433 * Math.cos(v), Math.sin(a) * .302 * Math.sin(v)];
      line(s, i % 2 ? '#b97619' : '#d39530', point(t), point(u), .006);
    }
  }
  for (const a of [-1, 1]) {
    ball(s, '#ab6a1e', [a * .15, 1.17, .266], [.065, .079, .025]);
    ball(s, '#f6d82e', [a * .15, 1.17, .286], [.047, .061, .018]);
    ball(s, '#fff4a5', [a * .15, 1.174, .302], [.028, .039, .01]);
  }
  // Independently curved tentacles carry amber tips; no flat lightning sprite.
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9, length = .49 + (i % 3) * .105;
    let prev: P = [Math.cos(a) * .26, 1.005, Math.sin(a) * .2];
    for (let j = 1; j <= 9; j++) {
      const t = j / 9, sway = Math.sin(t * 6 + i * .8) * .075 * t;
      const next: P = [Math.cos(a) * (.26 + Math.sin(t * 5 + i) * .1) + sway, 1.005 - t * length, Math.sin(a) * (.2 + Math.sin(t * 4) * .08)];
      const radius = .017 - t * .009;
      line(s, purple, prev, next, radius);
      ball(s, purple, next, [radius, radius, radius]);
      if (j === 4 || j === 7) ball(s, '#dd9270', next, [.013, .021, .013]);
      prev = next;
    }
    ball(s, '#ffdb6a', prev, [.028, .038, .025]);
    ball(s, '#fff0b8', [prev[0] - .006, prev[1] + .009, prev[2] + .018], [.009, .015, .009]);
    if (i % 3 === 0) ball(s, rim, [prev[0] + .025, prev[1] - .085, prev[2]], [.013, .019, .013]);
  }
  return s.finish();
}

/** #63: carved gray owl, scalloped feathers, round yellow eyes and hooked beak. */
function curbowl() {
  const s = new Sculpt(), stone = '#939496', light = '#bfc0bd', dark = '#555a62';
  ball(s, dark, [0, .58, -.025], [.34, .47, .26]);
  // Each feather is a raised overlapping scale; lower tips form the chest edge.
  for (let row = 0; row < 5; row++) for (let col = -2; col <= 2; col++) {
    const y = .27 + row * .125, x = col * .105 + (row % 2 ? .025 : -.025);
    const z = .02 + .245 * Math.sqrt(Math.max(.1, 1 - (x / .36) ** 2));
    ball(s, dark, [x, y, z], [.072, .103, .042]);
    ball(s, (col + row) % 3 ? light : stone, [x, y + .012, z + .012], [.062, .085, .035]);
  }
  // Draped wings have long overlapping primary feathers, modeled on both sides.
  for (const a of [-1, 1]) {
    ball(s, stone, [a * .275, .6, -.02], [.14, .3, .22]);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
      const x = a * (.27 + Math.sin(row * .7) * .055), y = .8 - row * .135, z = .13 - col * .12;
      ball(s, dark, [x, y, z], [.079, .114, .064]);
      ball(s, col % 2 ? light : stone, [x + a * .012, y + .012, z + .01], [.067, .096, .053]);
    }
    for (let i = 0; i < 3; i++) {
      ball(s, stone, [a * .155 + (i - 1) * .05, .105, .14], [.031, .056, .067]);
      s.cone('#595752', a * .155 + (i - 1) * .05, .09, .208, .016, .06, Math.PI / 2);
    }
  }
  ball(s, stone, [0, 1.06, -.035], [.335, .33, .25]);
  // Concentric facial discs sit proud of the head and frame deep dark sockets.
  for (const a of [-1, 1]) {
    ball(s, dark, [a * .145, 1.03, .178], [.177, .215, .075]);
    ball(s, light, [a * .145, 1.035, .204], [.154, .19, .063]);
    for (let i = 0; i < 16; i++) {
      const t = i * Math.PI * 2 / 16, x = a * .145 + Math.cos(t) * .137, y = 1.035 + Math.sin(t) * .169;
      line(s, '#84898c', [x, y, .232], [a * .145 + Math.cos(t) * .116, 1.035 + Math.sin(t) * .144, .26], .008);
    }
    ball(s, '#343a43', [a * .143, 1.047, .261], [.091, .107, .026]);
    ball(s, '#dfbf2f', [a * .143, 1.047, .282], [.069, .084, .018]);
    ball(s, '#131e27', [a * .143, 1.047, .297], [.039, .062, .012]);
    ball(s, '#fff4cd', [a * .143 - .017, 1.078, .308], [.012, .017, .007]);
    line(s, light, [a * .29, 1.2, .188], [a * .04, 1.145, .25], .027);
  }
  // The crown's engraved chevrons meet above the beak, as in the source.
  for (let row = 0; row < 5; row++) for (const a of [-1, 1]) {
    const y = 1.18 + row * .035, reach = .27 - row * .045;
    const point = (t: number, offset: number): P => {
      const x = a * reach * t, py = y - .035 + t * .06 + offset;
      return [x, py, -.035 + .254 * Math.sqrt(Math.max(.01, 1 - (x / .337) ** 2 - ((py - 1.06) / .333) ** 2))];
    };
    for (let i = 0; i < 8; i++) {
      line(s, dark, point(i / 8, 0), point((i + 1) / 8, 0), .009);
      line(s, light, point(i / 8, .014), point((i + 1) / 8, .014), .008);
    }
  }
  s.panel(dark, [[0, 1.022, .3], [-.055, .94, .3], [0, .855, .3], [.055, .94, .3]], .075);
  s.panel('#a4a7a4', [[0, 1.007, .344], [-.033, .943, .344], [0, .878, .344], [.017, .948, .344]], .02);
  // A short layered tail completes the otherwise unseen rear conservatively.
  for (let i = -1; i <= 1; i++) ball(s, stone, [i * .075, .25, -.25], [.055, .17, .08]);
  return s.finish();
}

export const SCULPTS_F: Record<string, () => THREE.BufferGeometry> = {
  mon_harzback: harzback, mon_lampjell: lampjell, mon_curbowl: curbowl,
  ...SCULPTS_F_AQUATIC,
};
