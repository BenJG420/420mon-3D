import type { BufferGeometry } from 'three';
import { Sculpt } from './model-sculpt';

// Individually modelled from the retained original sheets, core Dex 13–24.
// +Z is the face; these are volumes, with their source details on all sides.
const TAU = Math.PI * 2;
type Point = [number, number, number];

function loop(s: Sculpt, color: number, centre: Point, rx: number, ry: number, thickness = .018) {
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12, b = (i + 1) * TAU / 12;
    s.rod(color, [centre[0] + Math.cos(a) * rx, centre[1] + Math.sin(a) * ry, centre[2]],
      [centre[0] + Math.cos(b) * rx, centre[1] + Math.sin(b) * ry, centre[2]], thickness);
  }
}

function cumulus(): BufferGeometry {
  const s = new Sculpt(), cloud = 0x65508b, light = 0x8870ad, shadow = 0x49375f;
  s.ellipsoid(cloud, 0, 1.02, -.02, .57, .57, .42);
  // The asymmetric rising thunderhead is the body, rather than an animal torso.
  const lobes: number[][] = [
    [-.51, .85, -.1, .25], [.49, .9, -.05, .27], [-.35, 1.4, -.08, .3],
    [.12, 1.56, -.08, .32], [.43, 1.3, -.14, .29], [-.1, 1.79, -.12, .2],
    [-.6, 1.15, .12, .19], [.61, 1.08, .12, .2], [-.34, .65, .14, .24],
    [.32, .67, .14, .25], [-.27, 1.16, -.36, .32], [.3, 1.2, -.37, .3],
    [-.42, .9, .31, .2], [.43, .89, .31, .21], [0, 1.47, .26, .24],
  ];
  lobes.forEach(([x, y, z, r], i) => s.ellipsoid(i % 3 === 0 ? light : cloud, x, y, z, r, r * .87, r));
  for (const side of [-1, 1]) {
    s.cone(light, side * .53, 1.4, .05, .11, .37, 0, 0, -side * .5);
    s.ellipsoid(shadow, side * .21, 1.13, .42, .19, .135, .055);
    s.ellipsoid(0xe5c24c, side * .21, 1.12, .47, .11, .067, .04);
    s.ellipsoid(0x191529, side * .19, 1.13, .505, .025, .064, .025);
    s.rod(shadow, [side * .08, 1.23, .49], [side * .34, 1.31, .4], .045);
    // Descending smoke curls replace feet.
    s.rod(cloud, [side * .39, .72, .11], [side * .5, .45, .17], .07);
    s.rod(light, [side * .5, .45, .17], [side * .4, .31, .24], .037);
    s.cone(cloud, side * .15, .4, -.03, .095, .47, Math.PI);
  }
  s.ellipsoid(0x241b31, 0, .89, .43, .25, .13, .065);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * .085;
    s.cone(0xd7cdbc, x, .94, .49, .042, .13, Math.PI);
    if (i % 2 === 0) s.cone(0xd7cdbc, x, .815, .49, .036, .09);
  }
  s.ellipsoid(light, -.065, 1.005, .5, .09, .06, .07);
  return s.finish();
}

function kerbite(): BufferGeometry {
  const s = new Sculpt(), stone = 0x8c8d8c, edge = 0xa8a8a1, crack = 0x414243;
  s.box(stone, 0, 1.03, 0, 1.21, 1.5, .89);
  s.box(edge, -.16, 1.8, -.04, .83, .08, .73, 0, .03, .04);
  for (const side of [-1, 1]) {
    s.box(stone, side * .45, .19, .15, .3, .36, .45, 0, 0, side * .06);
    s.box(edge, side * .45, .04, .27, .33, .1, .5);
    s.box(stone, side * .69, .49, -.03, .22, .38, .32, 0, 0, side * .2);
    for (let j = 0; j < 2; j++) s.rod(crack, [side * .45 + (j - .5) * .1, .075, .52], [side * .45 + (j - .5) * .1, .16, .46], .013);
    s.ellipsoid(0x353735, side * .28, 1.26, .46, .19, .16, .035);
    s.ellipsoid(0xddc751, side * .28, 1.23, .5, .105, .11, .024);
    s.ellipsoid(0x211f1b, side * .25, 1.25, .52, .029, .078, .018);
    s.rod(edge, [side * .09, 1.48, .49], [side * .47, 1.61, .45], .07);
  }
  s.box(0x272a29, 0, .76, .456, .91, .4, .045);
  for (let i = 0; i < 6; i++) {
    const x = (i - 2.5) * .145;
    s.cone(0xbdbeb2, x, .9, .5, .075, .25, Math.PI);
    s.cone(0xbdbeb2, x + .04, .6, .5, .068, .22);
  }
  const cracks: Point[][] = [
    [[-.43, 1.79, .46], [-.19, 1.64, .46], [-.3, 1.51, .46]],
    [[.16, 1.79, .46], [.08, 1.63, .46], [.24, 1.54, .46], [.17, 1.4, .46]],
    [[-.56, 1.05, .46], [-.45, .95, .46], [-.51, .77, .46]],
    [[.58, .91, .46], [.48, .8, .46], [.51, .56, .46], [.36, .44, .46]],
    [[-.61, 1.59, .27], [-.61, 1.42, .12], [-.61, 1.18, .22]],
    [[.61, 1.75, -.25], [.61, 1.56, -.14], [.61, 1.45, -.3]],
    [[-.46, 1.8, -.3], [-.24, 1.8, -.15], [-.1, 1.8, -.34]],
    [[.09, 1.8, -.4], [.16, 1.8, -.14], [.41, 1.8, .03]],
    [[-.38, 1.41, -.456], [-.18, 1.29, -.456], [-.27, 1.08, -.456]],
    [[.25, 1.7, -.456], [.13, 1.46, -.456], [.33, 1.3, -.456]],
  ];
  for (const path of cracks) for (let i = 1; i < path.length; i++) s.rod(crack, path[i - 1], path[i], .018);
  return s.finish();
}

function moosling(): BufferGeometry {
  const s = new Sculpt(), green = 0x82b925, lime = 0xa0cd38, dark = 0x659a1c;
  s.ellipsoid(green, 0, .69, 0, .59, .62, .52);
  // Small uneven moss cushions surround the round seed body in three dimensions.
  for (let i = 0; i < 32; i++) {
    const a = i * 2.39996, yy = -1 + 2 * (i + .5) / 32, radial = Math.sqrt(1 - yy * yy);
    const x = Math.cos(a) * radial * .54, z = Math.sin(a) * radial * .48;
    // Leave the face unobstructed.
    if (z > .32 && yy > -.25 && yy < .5 && Math.abs(x) < .42) continue;
    s.ellipsoid(i % 3 ? lime : dark, x, .69 + yy * .57, z, .12, .1, .105);
  }
  for (const side of [-1, 1]) {
    s.ellipsoid(dark, side * .2, .78, .475, .105, .12, .04);
    s.ellipsoid(0x1c2512, side * .2, .78, .507, .073, .087, .037);
    s.ellipsoid(0xefecc9, side * .22, .81, .54, .025, .026, .014);
    s.ellipsoid(green, side * .25, .1, .05, .18, .11, .21);
  }
  s.rod(0x526f16, [0, 1.18, -.04], [.01, 1.58, -.04], .048);
  s.rod(0x648d19, [.01, 1.51, -.04], [-.2, 1.7, -.05], .033);
  s.rod(0x648d19, [.01, 1.49, -.04], [.22, 1.64, -.03], .033);
  s.ellipsoid(lime, -.24, 1.68, -.05, .22, .075, .14);
  s.ellipsoid(0x8fbe28, .25, 1.62, -.02, .22, .07, .14);
  s.rod(dark, [-.41, 1.69, -.04], [-.08, 1.68, -.04], .012);
  s.rod(dark, [.08, 1.63, 0], [.42, 1.62, 0], .012);
  return s.finish();
}

function portcrab(): BufferGeometry {
  const s = new Sculpt(), shell = 0x4d536a, joint = 0x2e3441, steel = 0x8a91a1;
  s.ellipsoid(shell, 0, .82, -.02, .64, .46, .49);
  s.box(0x252a34, 0, 1.18, -.04, .42, .055, .32);
  s.box(steel, 0, 1.24, -.04, .32, .09, .24);
  s.box(joint, 0, 1.295, -.03, .21, .025, .15);
  s.box(steel, 0, 1.32, -.09, .19, .065, .04);
  for (const side of [-1, 1]) {
    s.ellipsoid(joint, side * .23, .83, .43, .16, .17, .08);
    s.ellipsoid(0xd62b41, side * .23, .83, .5, .095, .104, .05);
    s.ellipsoid(0xffa1a1, side * .25, .86, .54, .026, .036, .014);
    for (let i = 0; i < 3; i++) {
      const z = .1 - i * .29, knee: Point = [side * (.76 + i * .03), .49, z + .05];
      s.rod(joint, [side * .45, .79, z], knee, .095);
      s.ellipsoid(steel, knee[0], knee[1], knee[2], .11, .105, .1);
      s.rod(shell, knee, [side * (.87 + i * .02), .12, z + .2], .065);
      s.cone(steel, side * (.87 + i * .02), .1, z + .2, .075, .19, Math.PI);
    }
    // Two genuinely open mechanical pincers, separate from the six walking legs.
    s.rod(shell, [side * .46, .64, .3], [side * .7, .37, .62], .1);
    s.ellipsoid(joint, side * .72, .35, .65, .14, .13, .14);
    s.rod(steel, [side * .72, .35, .65], [side * .91, .3, .83], .065);
    s.rod(steel, [side * .91, .3, .83], [side * .86, .21, 1.03], .055);
    s.rod(steel, [side * .72, .35, .65], [side * .59, .3, .85], .065);
    s.rod(steel, [side * .59, .3, .85], [side * .65, .21, 1.03], .055);
    for (let i = 0; i < 4; i++) {
      const a = .35 + i * .53;
      s.ellipsoid(steel, side * Math.sin(a) * .6, .85 + Math.cos(a) * .34, .25 - i * .16, .033, .035, .033);
    }
  }
  s.box(steel, 0, .52, .41, .15, .12, .08);
  s.box(joint, 0, .54, .46, .07, .035, .02);
  return s.finish();
}

function ashrat(): BufferGeometry {
  const s = new Sculpt(), fur = 0x676364, dark = 0x403d40, light = 0x888182;
  s.ellipsoid(fur, 0, .58, -.18, .44, .43, .67);
  s.ellipsoid(dark, 0, .64, .4, .34, .32, .36);
  s.ellipsoid(fur, 0, .48, .7, .22, .18, .28);
  s.ellipsoid(0x201b1c, 0, .5, .935, .08, .06, .04);
  for (const side of [-1, 1]) {
    s.ellipsoid(fur, side * .29, .45, -.55, .24, .31, .29);
    s.rod(dark, [side * .25, .43, .27], [side * .3, .13, .45], .085);
    s.ellipsoid(light, side * .3, .09, .54, .1, .06, .18);
    s.ellipsoid(fur, side * .37, .09, -.49, .13, .065, .2);
    for (let i = -1; i <= 1; i++) {
      s.rod(0xaca5a0, [side * .3 + i * .047, .07, .6], [side * .3 + i * .047, .06, .73], .014);
      s.rod(0xaca5a0, [side * .37 + i * .055, .06, -.4], [side * .37 + i * .055, .06, -.27], .014);
    }
    s.cone(dark, side * .25, .99, .31, .15, .42, -.12, 0, -side * .19);
    s.cone(0x927a82, side * .25, .99, .37, .087, .27, -.12, 0, -side * .19);
    s.ellipsoid(0x221d1b, side * .22, .7, .65, .095, .087, .055);
    s.ellipsoid(0xe56327, side * .22, .7, .69, .046, .051, .027);
    s.ellipsoid(0xffda6c, side * .225, .715, .71, .015, .02, .01);
    for (let i = 0; i < 3; i++) s.rod(light, [side * .13, .46, .83], [side * (.4 + i * .04), .45 + i * .065, .85], .009);
  }
  for (let i = 0; i < 6; i++) s.cone(light, 0, .94 - i * .022, .2 - i * .16, .068, .25, -.55);
  s.rod(dark, [0, .48, -.73], [.42, .29, -.94], .055);
  s.rod(fur, [.42, .29, -.94], [.73, .18, -.77], .046);
  s.rod(0xd43b16, [.73, .18, -.77], [.84, .21, -.58], .046);
  s.ellipsoid(0xf86813, .84, .25, -.55, .11, .13, .1);
  s.cone(0xffbd25, .84, .37, -.55, .075, .3, 0, 0, -.25);
  s.cone(0xf16110, .93, .33, -.57, .055, .22, 0, 0, -.5);
  s.cone(0xffe47f, .82, .3, -.49, .045, .17);
  return s.finish();
}

function schlickpup(): BufferGeometry {
  const s = new Sculpt(), sludge = 0x727329, moss = 0x929335, shade = 0x50531c;
  s.ellipsoid(sludge, 0, .62, -.05, .56, .59, .47);
  s.ellipsoid(sludge, 0, 1.03, .08, .45, .43, .36);
  for (const side of [-1, 1]) {
    s.ellipsoid(shade, side * .37, .2, -.16, .26, .21, .31);
    s.ellipsoid(moss, side * .3, .09, .34, .22, .1, .22);
    for (let i = 0; i < 3; i++) s.ellipsoid(sludge, side * .3 + (i - 1) * .085, .075, .47, .06, .06, .085);
    // Long ears fold over, then hang down with heavy wet tips.
    s.rod(moss, [side * .3, 1.3, .03], [side * .57, 1.4, .08], .11);
    s.rod(sludge, [side * .57, 1.4, .08], [side * .7, 1.13, .14], .095);
    s.rod(shade, [side * .7, 1.13, .14], [side * .68, .88, .2], .064);
    s.cone(moss, side * .68, .83, .2, .071, .18, Math.PI);
    s.ellipsoid(moss, side * .2, 1.02, .425, .14, .15, .055);
    s.ellipsoid(0x111608, side * .2, 1.02, .468, .095, .11, .045);
    s.ellipsoid(0xe8e4ab, side * .22, 1.065, .5, .031, .034, .016);
    s.ellipsoid(0xc8c671, side * .18, .985, .508, .012, .015, .009);
  }
  s.ellipsoid(shade, 0, .85, .46, .075, .055, .041);
  s.rod(shade, [0, .82, .477], [-.09, .77, .455], .012);
  s.rod(shade, [0, .82, .477], [.09, .77, .455], .012);
  // Wet, lumpy source texture wraps the back as well as the face.
  for (let i = 0; i < 35; i++) {
    const a = i * 2.39996, y = -.9 + (i % 11) * .17, r = Math.sqrt(1 - y * y);
    const x = Math.cos(a) * r * .52, z = Math.sin(a) * r * .44;
    if (z > .24 && y > .1) continue;
    s.ellipsoid(i % 4 ? moss : shade, x, .65 + y * .5, z, .065, .085, .06);
  }
  s.ellipsoid(moss, 0, 1.35, -.03, .13, .15, .16);
  return s.finish();
}

function vialworm(): BufferGeometry {
  const s = new Sculpt(), lime = 0xa9d922, dark = 0x6f9c18, glass = 0xede1d6;
  // A descending segmented body; the head is visibly enclosed by a pale vial lip.
  const segments = [
    [-.3, .94, .26, .38], [-.05, .6, -.04, .36], [.23, .37, -.3, .3], [.43, .24, -.54, .23],
  ];
  segments.forEach(([x, y, z, r], i) => {
    s.ellipsoid(i % 2 ? lime : 0xb9e52f, x, y, z, r, r * .92, r);
    for (let j = 0; j < 10; j++) {
      const a = j * TAU / 10, b = (j + 1) * TAU / 10;
      s.rod(dark, [x + Math.cos(a) * r, y + Math.sin(a) * r * .89, z - r * .15],
        [x + Math.cos(b) * r, y + Math.sin(b) * r * .89, z - r * .15], .021);
    }
    if (i > 0) for (const side of [-1, 1]) s.ellipsoid(0xb29ba5, x + side * r * .7, .08, z, .11, .065, .095);
  });
  s.ellipsoid(glass, -.39, 1.27, .44, .35, .43, .25);
  s.ellipsoid(0xc7e64a, -.39, 1.23, .615, .29, .32, .115);
  loop(s, 0xfff5eb, [-.39, 1.27, .66], .325, .39, .027);
  s.rod(0xffffff, [-.64, 1.39, .65], [-.59, 1.55, .615], .023);
  s.rod(0xffffff, [-.59, 1.55, .615], [-.48, 1.62, .57], .021);
  s.rod(0x977c74, [-.67, 1.05, .58], [-.4, .91, .58], .028);
  for (const side of [-1, 1]) {
    s.ellipsoid(0x25271b, -.39 + side * .13, 1.22, .731, .072, .078, .03);
    s.ellipsoid(0xfbffe0, -.39 + side * .13 - .017, 1.247, .756, .024, .025, .012);
  }
  s.rod(dark, [-.45, 1.08, .72], [-.35, 1.07, .72], .012);
  return s.finish();
}

function tapepup(): BufferGeometry {
  const s = new Sculpt(), tan = 0x9b744a, brown = 0x6e4a2d, cream = 0xd8c49b, tape = 0xe4d6c1;
  s.ellipsoid(tan, 0, .64, -.02, .31, .42, .26);
  s.ellipsoid(cream, 0, .7, .225, .2, .3, .055);
  s.ellipsoid(tan, 0, 1.27, .05, .4, .37, .31);
  for (const side of [-1, 1]) {
    s.cone(brown, side * .28, 1.72, .015, .175, .63, 0, 0, -side * .23);
    s.cone(cream, side * .29, 1.72, .08, .105, .4, 0, 0, -side * .23);
    s.rod(brown, [side * .2, .49, -.03], [side * .28, .18, .09], .13);
    s.ellipsoid(cream, side * .28, .1, .2, .15, .09, .22);
    for (let i = 0; i < 2; i++) s.rod(brown, [side * .28 + (i - .5) * .07, .12, .32], [side * .28 + (i - .5) * .07, .09, .39], .011);
    s.rod(brown, [side * .27, .91, .02], [side * .43, .66, .12], .13);
    s.rod(tan, [side * .43, .66, .12], [side * .32, .92, .38], .12);
    s.ellipsoid(tape, side * .32, .98, .4, .19, .22, .18);
    // Five wrapped bands travel around each raised boxing fist.
    for (let j = 0; j < 5; j++) {
      const y = .83 + j * .069, r = .16 * Math.sqrt(Math.max(.2, 1 - ((y - .98) / .23) ** 2));
      for (let k = 0; k < 8; k++) {
        const a = k * TAU / 8, b = (k + 1) * TAU / 8;
        s.rod(0xa99b85, [side * .32 + Math.cos(a) * r, y, .4 + Math.sin(a) * r],
          [side * .32 + Math.cos(b) * r, y + .012, .4 + Math.sin(b) * r], .009);
      }
    }
    s.ellipsoid(0xeee5c9, side * .16, 1.3, .32, .13, .115, .047);
    s.ellipsoid(0x2c261b, side * .15, 1.3, .36, .065, .077, .027);
    s.ellipsoid(0xfdf8df, side * .16 - .018, 1.33, .38, .019, .02, .012);
    s.rod(brown, [side * .06, 1.43, .35], [side * .29, 1.52, .27], .031);
    s.ellipsoid(cream, side * .105, 1.13, .36, .145, .12, .12);
    s.rod(brown, [side * .07, 1.6, .3], [side * .2, 1.45, .33], .026);
  }
  s.ellipsoid(0x34291f, 0, 1.18, .47, .083, .057, .043);
  s.rod(brown, [0, 1.14, .47], [0, 1.075, .46], .016);
  s.rod(tan, [0, .54, -.25], [.38, .58, -.42], .09);
  s.rod(cream, [.38, .58, -.42], [.47, .83, -.34], .073);
  return s.finish();
}

function noxling(): BufferGeometry {
  const s = new Sculpt(), edge = 0x6916b2, glow = 0x8428d5, dark = 0x1d073f;
  // Serrated purple silhouette around a near-black, pointed floating spectre.
  s.ellipsoid(edge, 0, 1.02, -.025, .5, .65, .32);
  s.cone(edge, 0, .48, -.015, .4, .74, Math.PI);
  s.ellipsoid(dark, 0, 1.04, .03, .445, .57, .32);
  s.cone(dark, 0, .51, .035, .345, .65, Math.PI);
  s.cone(glow, -.09, 1.65, -.04, .14, .37, 0, 0, -.3);
  s.cone(edge, .13, 1.62, -.05, .13, .32, 0, 0, .45);
  for (const side of [-1, 1]) {
    for (let j = 0; j < 5; j++) {
      const y = .6 + j * .21, x = .38 + Math.sin(j * .65) * .085;
      s.cone(j % 2 ? edge : glow, side * x, y, -.015, .078, .24, 0, 0, -side * 1.2);
    }
    s.rod(edge, [side * .41, .85, .01], [side * .61, .74, .06], .057);
    s.rod(glow, [side * .61, .74, .06], [side * .69, .84, .09], .041);
    s.ellipsoid(0x9553e9, side * .16, 1.18, .345, .057, .1, .027);
    s.ellipsoid(0xe0c1ff, side * .16, 1.19, .368, .035, .066, .019);
    s.rod(edge, [side * .2, .33, 0], [side * .35, .17, .02], .037);
    s.rod(glow, [side * .35, .17, .02], [side * .43, .23, .05], .024);
  }
  // Back silhouette remains a fully shaped cloud, not a front-facing plaque.
  s.ellipsoid(edge, -.2, 1.09, -.28, .2, .32, .13);
  s.ellipsoid(edge, .17, .78, -.27, .2, .25, .13);
  return s.finish();
}

function velvetfox(): BufferGeometry {
  const s = new Sculpt(), velvet = 0x382440, purple = 0x754075, bright = 0xa15b9a, gold = 0xd8ab42;
  s.ellipsoid(velvet, 0, .6, -.05, .29, .45, .29);
  for (const side of [-1, 1]) {
    s.ellipsoid(velvet, side * .24, .26, -.11, .22, .24, .27);
    s.rod(purple, [side * .12, .62, .2], [side * .13, .12, .24], .068);
    s.ellipsoid(bright, side * .13, .08, .32, .1, .055, .15);
    s.cone(purple, side * .22, 1.1, .14, .17, .28, 0, 0, -side * 1.05);
  }
  // The large bushy tail curls around the sitting fox's right flank.
  s.rod(velvet, [.1, .32, -.27], [.43, .24, -.37], .15);
  s.ellipsoid(purple, .53, .35, -.13, .28, .27, .37);
  s.ellipsoid(velvet, .53, .22, .19, .29, .18, .33);
  s.ellipsoid(bright, .42, .16, .44, .21, .11, .22);
  for (let j = 0; j < 4; j++) s.cone(purple, .54 + (j % 2) * .1, .39 + j * .07, -.22 + j * .11, .055, .2, 0, 0, -.7);
  s.ellipsoid(velvet, 0, 1.13, .03, .34, .32, .27);
  for (const side of [-1, 1]) {
    s.cone(velvet, side * .28, 1.66, -.015, .175, .79, 0, 0, -side * .3);
    s.cone(bright, side * .29, 1.65, .055, .104, .5, 0, 0, -side * .3);
    s.cone(velvet, side * .36, 1.1, .07, .12, .29, 0, 0, -side * 1.03);
    s.ellipsoid(0xd8be6e, side * .16, 1.19, .276, .075, .055, .03);
    s.ellipsoid(0x170f22, side * .16, 1.2, .303, .02, .047, .013);
    s.rod(bright, [side * .07, 1.32, .25], [side * .26, 1.38, .19], .025);
    loop(s, gold, [side * .38, 1.46, .13], .047, .069, .014);
    s.ellipsoid(bright, side * .075, 1.005, .29, .104, .065, .095);
  }
  s.ellipsoid(0x1c1323, 0, 1.05, .386, .051, .035, .031);
  s.cone(bright, 0, .72, .255, .17, .36, Math.PI);
  for (const side of [-1, 1]) s.cone(purple, side * .13, .78, .26, .075, .22, 0, 0, -side * .6);
  return s.finish();
}

function rusttooth(): BufferGeometry {
  const s = new Sculpt(), rust = 0xa84f2a, dark = 0x65341f, clay = 0xc06436;
  s.ellipsoid(dark, 0, .84, -.08, .62, .73, .54);
  // Rounded terracotta blocks form the shell, separated by dark mortar seams.
  for (let band = 0; band < 4; band++) {
    const y = .53 + band * .27, r = [.56, .62, .55, .39][band];
    for (let j = 0; j < 10; j++) {
      const a = (j + (band % 2) * .5) * TAU / 10;
      const x = Math.cos(a) * r, z = -.08 + Math.sin(a) * r * .84;
      if (z > .2 && y < 1.2 && Math.abs(x) < .49) continue;
      s.box((j + band) % 3 ? rust : clay, x, y, z, .28, .24, .22, 0, -a, (j % 3 - 1) * .08);
    }
  }
  s.ellipsoid(0x24180f, 0, .68, .452, .49, .4, .13);
  for (const side of [-1, 1]) {
    s.ellipsoid(clay, side * .35, 1.13, .39, .15, .14, .12);
    s.ellipsoid(0xe8b36d, side * .35, 1.13, .48, .084, .087, .045);
    s.ellipsoid(0x2c2319, side * .35, 1.13, .52, .04, .045, .023);
    s.ellipsoid(rust, side * .65, .63, -.12, .19, .22, .2);
    s.ellipsoid(clay, side * .7, .4, .01, .17, .16, .18);
    s.ellipsoid(rust, side * .7, .22, .12, .19, .12, .23);
    s.ellipsoid(clay, side * .37, .09, .07, .24, .11, .27);
    s.rod(dark, [side * .49, .12, .25], [side * .29, .12, .25], .016);
  }
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * .128, edge = Math.abs(i - 3) / 3;
    s.cone(0xdec08b, x, .91 - edge * .08, .56, .069, .27, Math.PI, 0, (i % 2 ? -.08 : .08));
    s.cone(0xd8b581, x + .025, .42 + edge * .055, .56, .065, .25, 0, 0, i % 2 ? .1 : -.1);
  }
  s.box(clay, -.83, .49, .19, .16, .09, .15, .2, .4, .4);
  return s.finish();
}

function graterat(): BufferGeometry {
  const s = new Sculpt(), fur = 0x786247, brown = 0x51422f, pink = 0xb88070, metal = 0x96989a;
  s.ellipsoid(fur, 0, .5, -.13, .4, .37, .61);
  s.ellipsoid(brown, 0, .46, .43, .29, .28, .32);
  s.ellipsoid(fur, 0, .35, .7, .18, .15, .24);
  s.ellipsoid(0x3d2c25, 0, .37, .9, .058, .042, .04);
  for (const side of [-1, 1]) {
    s.ellipsoid(fur, side * .3, .3, -.42, .21, .22, .25);
    s.rod(brown, [side * .23, .35, .34], [side * .24, .09, .49], .063);
    s.ellipsoid(pink, side * .24, .065, .55, .09, .05, .14);
    s.ellipsoid(pink, side * .33, .06, -.32, .12, .048, .16);
    for (let j = -1; j <= 1; j++) {
      s.rod(pink, [side * .24 + j * .04, .055, .6], [side * .24 + j * .04, .04, .73], .015);
      s.rod(pink, [side * .33 + j * .05, .05, -.25], [side * .33 + j * .05, .04, -.11], .015);
    }
    s.ellipsoid(brown, side * .21, .75, .35, .13, .17, .06);
    s.ellipsoid(pink, side * .21, .76, .39, .082, .11, .028);
    s.ellipsoid(0xc3b188, side * .18, .52, .658, .07, .075, .033);
    s.ellipsoid(0x11100c, side * .18, .52, .682, .045, .05, .026);
    s.ellipsoid(0xf2e5c6, side * .19, .54, .705, .013, .016, .01);
    for (let j = 0; j < 3; j++) s.rod(0xbbae89, [side * .1, .35, .79], [side * (.38 + j * .025), .3 + j * .08, .83], .008);
  }
  // Four metal corner posts support an open 4-by-4 drainage grate.
  for (const x of [-.38, .38]) for (const z of [-.51, .24]) s.rod(brown, [x * .8, .64, z], [x, .94, z], .035);
  for (let i = 0; i < 5; i++) {
    const v = -.38 + i * .19;
    s.rod(metal, [v, .96, -.51], [v, .96, .25], .029);
    s.rod(metal, [-.38, .965, -.51 + i * .19], [.38, .965, -.51 + i * .19], .029);
  }
  s.rod(0xc2c2be, [-.4, .99, -.53], [.4, .99, -.53], .04);
  s.rod(0xc2c2be, [-.4, .99, .27], [.4, .99, .27], .04);
  s.rod(0xc2c2be, [-.4, .99, -.53], [-.4, .99, .27], .04);
  s.rod(0xc2c2be, [.4, .99, -.53], [.4, .99, .27], .04);
  s.rod(pink, [0, .3, -.69], [.39, .21, -.86], .035);
  s.rod(pink, [.39, .21, -.86], [.64, .17, -.57], .029);
  s.rod(pink, [.64, .17, -.57], [.57, .14, -.29], .022);
  // The source's hovering blue drip is recognisable in silhouette and profile.
  s.ellipsoid(0x66b9df, 0, 1.31, -.1, .075, .105, .07);
  s.cone(0x90d4ee, 0, 1.43, -.1, .063, .25);
  s.ellipsoid(0xe2faff, -.02, 1.34, -.05, .018, .04, .015);
  return s.finish();
}

export const SCULPTS_B: Record<string, () => BufferGeometry> = {
  mon_cumulus: cumulus,
  mon_kerbite: kerbite,
  mon_moosling: moosling,
  mon_portcrab: portcrab,
  mon_ashrat: ashrat,
  mon_schlickpup: schlickpup,
  mon_vialworm: vialworm,
  mon_tapepup: tapepup,
  mon_noxling: noxling,
  mon_velvetfox: velvetfox,
  mon_rusttooth: rusttooth,
  mon_graterat: graterat,
};
