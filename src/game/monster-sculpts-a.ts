import type * as THREE from 'three';
import { Sculpt } from './model-sculpt';

// Individually sculpted from the retained first-frame original sprites. Front is +Z.
// Hidden surfaces use the same anatomy and palette; none of these replaces Dex art.
type Point = [number, number, number];
const ball = (s: Sculpt, c: string, p: Point, size: Point) => s.ellipsoid(c, ...p, ...size);
const link = (s: Sculpt, c: string, a: Point, b: Point, r = .04) => s.rod(c, a, b, r);
function eyes(s: Sculpt, x: number, y: number, z: number, color: string, size = .065) {
  for (const side of [-1, 1]) {
    ball(s, '#15121b', [side * x, y, z], [size * 1.32, size, .035]);
    ball(s, color, [side * x, y, z + .028], [size * .76, size * .63, .018]);
    ball(s, '#111316', [side * x, y, z + .046], [size * .24, size * .48, .009]);
  }
}
function finger(s: Sculpt, c: string, a: Point, b: Point, tip: Point, r = .028) {
  link(s, c, a, b, r); link(s, c, b, tip, r * .7);
}
function budling() {
  const s = new Sculpt();
  const green = '#567a23', shadow = '#344d1c', leaf = '#75982a', rim = '#a2ad32';
  ball(s, shadow, [0, .72, 0], [.31, .4, .22]);
  for (const side of [-1, 1]) {
    link(s, green, [side * .19, .57, 0], [side * .27, .22, .03], .095);
    ball(s, shadow, [side * .28, .1, .12], [.13, .085, .18]);
    for (let n = 0; n < 3; n++) s.cone(rim, side * .28 + (n - 1) * .068, .075, .28, .028, .12, Math.PI / 2);
    link(s, green, [side * .26, .84, 0], [side * .44, .58, .07], .073);
    for (let n = 0; n < 3; n++) finger(s, green, [side * .44, .6, .09], [side * (.48 + n * .045), .42, .14], [side * (.42 + n * .06), .36, .2]);
  }
  ball(s, green, [0, 1.09, .03], [.34, .32, .28]);
  // Overlapping upright serrated leaf crown is the defining Budling silhouette.
  for (let row = 0; row < 4; row++) {
    const width = [.34, .31, .23, .13][row];
    for (let n = -2; n <= 2; n++) {
      const x = n * width / 2;
      s.cone(n % 2 ? leaf : green, x, 1.23 + row * .16, -.035 - row * .015, .105 - row * .009, .42, -.12, .15 * n, -.3 * n);
      link(s, rim, [x, 1.12 + row * .16, .055], [x - n * .025, 1.41 + row * .16, .015], .009);
    }
  }
  for (const side of [-1, 1]) for (let n = 0; n < 3; n++) s.cone(leaf, side * (.29 + n * .025), 1.03 - n * .1, .01, .1, .3, .1, 0, side * -1.1);
  eyes(s, .125, 1.07, .283, '#edc548', .06);
  for (const side of [-1, 1]) link(s, shadow, [side * .04, 1.17, .294], [side * .23, 1.21, .23], .035);
  s.box('#303d19', 0, .93, .284, .13, .025, .018);
  return s.finish();
}
function lustleaf() {
  const s = new Sculpt();
  const green = '#567923', dark = '#344c23', lime = '#9aaa35', vine = '#6f7e26', pink = '#9c4f72';
  ball(s, dark, [0, 1.05, 0], [.16, .39, .13]);
  ball(s, green, [0, 1.54, .025], [.18, .22, .15]);
  for (const side of [-1, 1]) {
    link(s, green, [side * .11, .8, 0], [side * .12, .42, .02], .065);
    link(s, vine, [side * .12, .42, .02], [side * .18, .09, .1], .045);
    for (let n = 0; n < 3; n++) link(s, lime, [side * .18, .09, .1], [side * (.1 + .08 * n), .025, .18], .019);
    link(s, green, [side * .15, 1.37, 0], [side * .29, 1.04, .015], .048);
    link(s, vine, [side * .29, 1.04, .015], [side * .33, .75, .14], .035);
    for (let n = 0; n < 3; n++) finger(s, lime, [side * .33, .77, .14], [side * (.35 + n * .032), .65, .18], [side * (.3 + n * .045), .57, .14], .015);
    // Long looping leaf hair and vine dress, rather than a humanoid reskin.
    for (let n = 0; n < 4; n++) {
      const x = side * (.12 + n * .045), back = -.04 - n * .04;
      link(s, n % 2 ? vine : green, [x, 1.68 - n * .035, back], [side * (.25 + n * .025), 1.13, back], .032);
      link(s, n % 2 ? vine : green, [side * (.25 + n * .025), 1.13, back], [side * (.18 + n * .05), .48 - n * .035, back + .08], .028);
      s.cone(lime, side * (.18 + n * .05), .6 - n * .035, back + .09, .055, .29, 0, .2, side * -.4);
    }
    for (let n = 0; n < 4; n++) s.cone(green, side * (.08 + n * .035), 1.53 + n * .07, -.035, .07, .34, 0, 0, side * -.72);
    ball(s, pink, [side * .115, 1.25, .109], [.055, .14, .045]);
  }
  s.cone(lime, 0, 1.87, -.02, .085, .3);
  for (let n = 0; n < 7; n++) {
    const angle = n * Math.PI * 2 / 7;
    link(s, lime, [0, 1.82, 0], [Math.cos(angle) * .23, 1.84 + Math.sin(angle) * .1, Math.sin(angle) * .12], .024);
    ball(s, pink, [Math.cos(angle) * .2, 1.84 + Math.sin(angle) * .09, Math.sin(angle) * .1], [.055, .033, .04]);
  }
  eyes(s, .065, 1.57, .172, '#e1b746', .029);
  link(s, pink, [0, 1.37, .14], [0, .87, .135], .025);
  return s.finish();
}
function glitchbitch() {
  const s = new Sculpt();
  const skin = '#9677c1', light = '#b19ed1', dark = '#302145', armor = '#58396f', neon = '#be55c7';
  ball(s, dark, [0, 1.04, 0], [.2, .3, .135]);
  ball(s, skin, [0, 1.23, .015], [.21, .17, .14]);
  ball(s, skin, [0, .8, .01], [.23, .17, .16]);
  for (const side of [-1, 1]) {
    link(s, skin, [side * .13, .78, .015], [side * .19, .45, .035], .08);
    link(s, dark, [side * .19, .45, .035], [side * .23, .13, .055], .06);
    ball(s, armor, [side * .23, .075, .15], [.09, .065, .17]);
    s.box(armor, side * .16, .55, .12, .105, .18, .065, 0, 0, side * -.22);
    link(s, skin, [side * .2, 1.3, 0], [side * .34, 1.02, .04], .055);
    link(s, armor, [side * .34, 1.02, .04], [side * .42, .82, .16], .045);
    ball(s, dark, [side * .42, .8, .16], [.06, .07, .045]);
    for (let n = 0; n < 3; n++) finger(s, skin, [side * .42, .8, .18], [side * (.46 + n * .026), .7, .21], [side * (.46 + n * .03), .65, .23], .017);
    s.cone(armor, side * .24, 1.36, -.005, .1, .22, 0, 0, side * -.9);
    ball(s, neon, [side * .1, 1.17, .15], [.045, .09, .025]);
    link(s, dark, [side * .18, .83, .11], [side * .065, .93, .14], .045);
  }
  ball(s, light, [0, 1.59, .015], [.14, .19, .125]);
  for (let n = 0; n < 11; n++) {
    const a = n * Math.PI * 2 / 11;
    const x = Math.cos(a) * .14, z = Math.sin(a) * .1;
    s.cone(n % 2 ? dark : armor, x, 1.78, z, .04, .24 + (n % 3) * .035, .1, 0, -x * 2.2);
    if (z < .06) {
      link(s, dark, [x, 1.7, z], [x * 1.7, 1.37, z - .08], .027);
      ball(s, neon, [x * 1.7, 1.37, z - .08], [.022, .028, .022]);
    }
  }
  eyes(s, .06, 1.61, .143, '#72cfda', .028);
  s.box(dark, 0, 1.49, .132, .065, .018, .015);
  // Broken floating pixel fragments echo the source glitch halo.
  for (let n = 0; n < 8; n++) s.box(n % 2 ? neon : armor, (n % 2 ? -1 : 1) * (.24 + (n % 3) * .045), 1.4 + n * .075, -.07, .024, .025, .025, .3, .2, .4);
  return s.finish();
}
function datawhore() {
  const s = new Sculpt();
  const black = '#211e3d', blue = '#343c7b', purple = '#714799', pink = '#d528a2', skin = '#7766ad';
  ball(s, black, [0, 1.11, 0], [.175, .29, .13]);
  ball(s, purple, [0, 1.29, .025], [.2, .15, .14]);
  ball(s, purple, [0, .83, .01], [.22, .16, .16]);
  link(s, pink, [0, .98, .137], [0, 1.31, .15], .025);
  for (const side of [-1, 1]) {
    link(s, purple, [side * .13, .8, 0], [side * .19, .5, .04], .075);
    link(s, black, [side * .19, .5, .04], [side * .24, .14, .015], .064);
    ball(s, blue, [side * .24, .085, .13], [.085, .07, .17]);
    s.box(pink, side * .19, .46, .101, .045, .24, .022, 0, 0, side * -.1);
    link(s, black, [side * .19, 1.34, 0], [side * .3, 1.08, .07], .056);
    link(s, purple, [side * .3, 1.08, .07], [side * .37, .88, .2], .048);
    ball(s, pink, [side * .37, .91, .19], [.07, .06, .065]);
    for (let n = 0; n < 3; n++) finger(s, skin, [side * .37, .86, .2], [side * (.39 + n * .023), .75, .24], [side * (.38 + n * .028), .72, .26], .013);
  }
  ball(s, skin, [0, 1.61, .025], [.145, .19, .14]);
  ball(s, blue, [0, 1.76, -.015], [.18, .13, .16]);
  // Thick, individually curved blue-purple data cables stream past the hips.
  for (let n = 0; n < 12; n++) {
    const side = n % 2 ? -1 : 1, row = Math.floor(n / 2), z = -.02 - row * .035;
    const c = n % 3 === 0 ? pink : n % 3 === 1 ? blue : black;
    const a: Point = [side * (.06 + row * .021), 1.79 - row * .025, z];
    const b: Point = [side * (.28 + row * .028), 1.52 - row * .055, z - .06];
    const d: Point = [side * (.32 + row * .025), 1.02 - row * .035, z - .1];
    const e: Point = [side * (.22 + row * .035), .64 - row * .037, z + .04];
    link(s, c, a, b, .024); link(s, c, b, d, .024); link(s, c, d, e, .02);
    link(s, pink, e, [e[0] + side * .065, e[1] - .1, e[2] + .05], .015);
  }
  eyes(s, .065, 1.63, .165, '#ec73e0', .03);
  s.box(black, 0, 1.51, .159, .06, .019, .015);
  return s.finish();
}
function neonpunx() {
  const s = new Sculpt();
  const skin = '#5f5265', dark = '#332f3b', vest = '#402d48', pink = '#bb227c', gold = '#b49b53';
  ball(s, skin, [0, .92, 0], [.38, .42, .24]);
  ball(s, vest, [0, 1.11, -.01], [.41, .26, .24]);
  ball(s, skin, [0, 1.5, .1], [.235, .24, .22]);
  ball(s, dark, [0, 1.4, .24], [.18, .1, .115]);
  for (const side of [-1, 1]) {
    link(s, dark, [side * .22, .69, 0], [side * .31, .35, .04], .14);
    link(s, skin, [side * .31, .35, .04], [side * .36, .13, .12], .11);
    ball(s, dark, [side * .38, .075, .22], [.17, .075, .21]);
    ball(s, skin, [side * .39, 1.12, 0], [.2, .23, .2]);
    link(s, skin, [side * .42, 1.12, .01], [side * .5, .8, .16], .13);
    link(s, skin, [side * .5, .8, .16], [side * .51, .58, .3], .11);
    ball(s, dark, [side * .52, .56, .3], [.135, .13, .12]);
    s.box(gold, side * .52, .56, .4, .21, .095, .055, -.15);
    for (let n = 0; n < 3; n++) ball(s, '#e2c67b', [side * .52 + (n - 1) * .067, .565, .439], [.023, .032, .022]);
    s.box(dark, side * .5, .75, .2, .25, .08, .18, -.2);
    for (let n = 0; n < 3; n++) s.cone(gold, side * .51 + (n - 1) * .07, .83, .17, .025, .105);
    ball(s, pink, [side * .17, 1.1, .224], [.1, .12, .025]);
    link(s, dark, [side * .06, 1.55, .286], [side * .19, 1.61, .245], .036);
    ball(s, gold, [side * .226, 1.47, .1], [.03, .05, .026]);
  }
  // A narrow, high magenta mohawk; chest stays broad and hunched like the sprite.
  for (let n = 0; n < 7; n++) s.cone(pink, 0, 1.77 + Math.sin(n / 6 * Math.PI) * .075, .22 - n * .065, .055, .24, n * -.11, 0, 0);
  eyes(s, .09, 1.51, .304, '#ddc546', .041);
  for (let n = 0; n < 4; n++) s.box('#c5b59c', (n - 1.5) * .049, 1.375, .346, .03, .031, .019);
  s.box('#15131a', 0, .7, .235, .56, .08, .045);
  s.box(gold, 0, .7, .266, .1, .09, .025);
  return s.finish();
}
function gridbruiser() {
  const s = new Sculpt();
  const skin = '#8c6c58', blue = '#274b80', navy = '#202b48', light = '#4676a3', black = '#20232d', neon = '#6288eb';
  ball(s, black, [0, 1.13, 0], [.33, .35, .2]);
  ball(s, skin, [0, 1.58, .015], [.17, .21, .15]);
  for (const side of [-1, 1]) {
    link(s, navy, [side * .17, .85, 0], [side * .21, .48, .015], .115);
    link(s, blue, [side * .21, .48, .015], [side * .24, .16, .03], .1);
    ball(s, black, [side * .24, .09, .145], [.13, .08, .2]);
    s.box(light, side * .21, .42, .112, .16, .2, .045, 0, 0, side * -.08);
    ball(s, light, [side * .34, 1.36, 0], [.19, .16, .19]);
    link(s, skin, [side * .34, 1.28, .015], [side * .41, 1.02, .04], .095);
    link(s, navy, [side * .41, 1.02, .04], [side * .45, .77, .14], .09);
    for (let n = 0; n < 3; n++) s.box(n % 2 ? light : blue, side * .44, .84 + n * .065, .14, .19, .045, .18, -.2);
    ball(s, black, [side * .45, .7, .15], [.105, .115, .09]);
    for (let n = 0; n < 3; n++) s.box(light, side * .45 + (n - 1) * .05, .71, .23, .035, .07, .025);
    s.box(blue, side * .22, 1.12, .186, .1, .36, .055, 0, 0, side * -.07);
    for (let n = 0; n < 4; n++) s.box(neon, side * .13, 1.24 - n * .07, .216, .035, .018, .014);
  }
  s.box(navy, 0, .86, .19, .5, .08, .065);
  s.box(light, 0, .86, .235, .1, .09, .03);
  // Tall electric-blue brush, exposed face, dark visor and separate armored pads.
  for (let n = 0; n < 7; n++) s.cone(n % 2 ? neon : blue, (n - 3) * .038, 1.85 + (3 - Math.abs(n - 3)) * .018, -.02, .038, .27, -.1, 0, (n - 3) * -.14);
  s.box(black, 0, 1.61, .159, .26, .062, .045);
  s.box('#6651b8', 0, 1.616, .187, .2, .027, .01);
  ball(s, skin, [0, 1.52, .174], [.075, .05, .045]);
  return s.finish();
}
function hashound() {
  const s = new Sculpt();
  const fur = '#575c31', dark = '#353d26', light = '#7c7c45', red = '#b94e58';
  ball(s, fur, [0, .73, -.1], [.32, .33, .61]);
  ball(s, dark, [0, 1.02, .37], [.34, .39, .3]);
  ball(s, fur, [0, 1.17, .49], [.28, .3, .23]);
  ball(s, light, [0, .99, .75], [.19, .15, .22]);
  ball(s, '#272b23', [0, 1.07, .92], [.12, .075, .065]);
  for (const side of [-1, 1]) {
    for (const z of [-.43, .33]) {
      link(s, fur, [side * .22, .68, z], [side * .24, .35, z + .025], .09);
      link(s, dark, [side * .24, .35, z + .025], [side * .25, .1, z + .09], .06);
      ball(s, fur, [side * .25, .065, z + .15], [.1, .06, .13]);
      for (let n = 0; n < 3; n++) s.cone('#8c8150', side * .25 + (n - 1) * .045, .055, z + .26, .02, .07, Math.PI / 2);
    }
    ball(s, dark, [side * .245, 1.12, .44], [.11, .3, .13]);
    for (let n = 0; n < 3; n++) s.cone(light, side * (.2 + n * .045), .91 - n * .035, .51, .075, .37, .1, 0, side * -.14);
  }
  // Long layered dreadlike coat and beard, not an ordinary smooth dog body.
  for (let n = 0; n < 7; n++) for (const side of [-1, 1]) {
    s.cone(n % 2 ? fur : light, side * (.15 + (n % 3) * .055), .69, -.45 + n * .13, .065, .45, .16, 0, side * -.17);
    link(s, dark, [side * .23, .95, -.44 + n * .13], [side * .31, .59, -.4 + n * .13], .015);
  }
  for (let n = 0; n < 5; n++) s.cone(n % 2 ? light : dark, (n - 2) * .065, .74, .67, .06, .43, -.16);
  eyes(s, .115, 1.2, .704, red, .047);
  link(s, dark, [0, .86, -.62], [.25, .73, -.94], .063);
  link(s, fur, [.25, .73, -.94], [.3, .4, -1.07], .047);
  // The source carries a short brown roll; its ember is visible at the muzzle.
  link(s, '#8b6a34', [-.11, .94, .84], [-.41, .9, 1.02], .043);
  ball(s, '#df8338', [-.42, .9, 1.025], [.038, .04, .035]);
  return s.finish();
}
function puffpuff() {
  const s = new Sculpt();
  const greens = ['#92aa7b', '#a4b98d', '#789568', '#b2c49a'];
  // Unequal overlapping billows form an asymmetric hovering cloud, with no legs.
  const puffs: [number, number, number, number][] = [
    [0,.88,0,.34],[-.28,.82,-.01,.22],[.31,.86,-.02,.24],[-.15,1.17,-.04,.23],
    [.14,1.27,-.03,.25],[.32,1.09,-.08,.18],[-.34,1.06,-.03,.16],[-.05,1.43,-.06,.17],
    [.08,.56,-.04,.19],[.28,.64,-.02,.16],[-.23,.61,-.01,.16],[-.03,.9,.21,.28],
  ];
  puffs.forEach(([x,y,z,r], n) => ball(s, greens[n % greens.length], [x,y,z], [r,r*.93,r*.8]));
  ball(s, '#a0b889', [0,.9,.27], [.27,.21,.12]);
  for (const side of [-1, 1]) {
    ball(s, '#3e593b', [side * .1,.93,.374], [.078,.043,.026]);
    ball(s, '#c3cb85', [side * .1,.921,.396], [.052,.024,.012]);
    ball(s, '#29352a', [side * .09,.918,.407], [.023,.021,.008]);
    link(s, '#607749', [side * .035,.974,.397], [side * .17,.987,.356], .026);
  }
  link(s, '#49653e', [-.09,.789,.373], [.07,.776,.379], .013);
  const curls: Point[][] = [
    [[-.32,.73,0],[-.52,.59,.015],[-.62,.63,.02],[-.62,.77,.035],[-.52,.8,.04]],
    [[.16,1.4,-.02],[.3,1.59,-.03],[.44,1.57,-.01],[.47,1.47,0],[.4,1.43,.02]],
    [[-.06,.55,0],[-.16,.39,.04],[-.34,.38,.04],[-.39,.48,.04]],
  ];
  curls.forEach((points,n) => points.slice(1).forEach((p,i) => { link(s, greens[n], points[i], p, .038); ball(s, greens[n], p, [.044,.044,.044]); }));
  return s.finish();
}
function jointail() {
  const s = new Sculpt();
  const green = '#729b29', dark = '#3a6522', light = '#a0b337', flame = '#ed6c17', hot = '#ffcb3c';
  ball(s, green, [0,.48,-.03], [.23,.22,.48]);
  ball(s, light, [0,.41,.03], [.19,.13,.4]);
  link(s, green, [0,.52,.29], [0,.7,.55], .16);
  ball(s, green, [0,.72,.62], [.18,.15,.29]);
  ball(s, dark, [0,.65,.84], [.16,.065,.14]);
  for (const side of [-1, 1]) {
    for (const z of [-.25,.25]) {
      link(s, dark, [side*.17,.49,z], [side*.3,.27,z-.04], .068);
      link(s, green, [side*.3,.27,z-.04], [side*.3,.1,z+.1], .045);
      for (let n=0;n<3;n++) link(s, light, [side*.3,.1,z+.1], [side*(.25+n*.055),.06,z+.22], .018);
    }
    ball(s, '#a8be3f', [side*.13,.79,.64], [.047,.047,.05]);
    ball(s, '#171c13', [side*.145,.79,.676], [.019,.03,.015]);
    link(s, dark, [side*.04,.83,.71], [side*.17,.84,.57], .022);
  }
  // Long tail coils upward into the bright orange loop of the original.
  const tail: Point[] = [[0,.48,-.42],[.17,.42,-.74],[.44,.49,-.94],[.58,.75,-.88],[.55,.98,-.73],[.38,1.07,-.64],[.27,.95,-.68]];
  tail.slice(1).forEach((p,i)=>link(s, green, tail[i], p, .105-i*.012));
  for (let n=0;n<8;n++) s.cone(flame, 0,.75, .4-n*.12,.045,.17, 0,0,0);
  tail.slice(2).forEach((p,i)=> { ball(s, flame, p, [.055,.073,.055]); s.cone(hot,p[0],p[1]+.08,p[2],.035,.16,0,0,-.35); if(i%2===0)s.cone(flame,p[0]+.04,p[1]+.055,p[2],.04,.21,0,0,-.8); });
  link(s, flame, [0,.67,.95], [-.035,.66,1.23], .055);
  for(let n=0;n<5;n++) s.cone(n%2?hot:flame,(n-2)*.035,.66+(n%2)*.035,1.23+n*.018,.05,.23, Math.PI/2,0,(n-2)*.25);
  // Dark scale patches give the back a layered reptile reading.
  for(let n=0;n<4;n++)for(const side of[-1,1])ball(s,dark,[side*.15,.6,-.3+n*.17],[.06,.04,.08]);
  return s.finish();
}
function hackroach() {
  const s = new Sculpt();
  const shell = '#303a36', edge = '#586154', dark = '#1e2527', lime = '#99be43', wire = '#a23189';
  ball(s, dark, [0,.58,0], [.38,.29,.49]);
  // Three heavy armor segments, longitudinal seam and green data studs.
  for(let n=0;n<3;n++) {
    ball(s, n%2?edge:shell,[0,.68,-.27+n*.24],[.38-n*.025,.26,.205]);
    s.box(dark,0,.905,-.27+n*.24,.025,.022,.3);
    for(const side of[-1,1]) {
      s.box(lime,side*.25,.81,-.29+n*.24,.055,.07,.06,0,0,side*-.35);
      link(s,dark,[side*.08,.89,-.38+n*.24],[side*.32,.72,-.41+n*.24],.015);
    }
  }
  ball(s,shell,[0,.52,.46],[.24,.2,.2]);
  ball(s,dark,[0,.45,.62],[.16,.12,.1]);
  for(const side of[-1,1]) {
    for(let n=0;n<3;n++) {
      const z=-.31+n*.3;
      const knee:Point=[side*(.5+(n===1?.05:0)),.32,z-.1];
      link(s,edge,[side*.29,.59,z],knee,.067);
      link(s,shell,knee,[side*.63,.065,z+.08],.045);
      ball(s,dark,[side*.64,.045,z+.13],[.09,.04,.1]);
      s.box(lime,side*.39,.46,z-.04,.04,.075,.06,0,0,side*-.6);
    }
    const antenna:Point[]=[[side*.13,.65,.54],[side*.21,1.04,.69],[side*.42,1.22,.7],[side*.54,1.14,.67]];
    antenna.slice(1).forEach((p,i)=>link(s,wire,antenna[i],p,.012));
    link(s,dark,[side*.09,.46,.64],[side*.2,.31,.75],.04);
    link(s,wire,[side*.2,.31,.75],[side*.1,.24,.83],.022);
    ball(s,lime,[side*.105,.55,.643],[.038,.04,.025]);
    link(s,wire,[side*.28,.4,.3],[side*.36,.19,.45],.015);
    link(s,wire,[side*.36,.19,.45],[side*.25,.08,.49],.012);
  }
  return s.finish();
}
function cracksprite() {
  const s = new Sculpt();
  const skin = '#aaa0cf', purple = '#7950a3', dark = '#493057', pale = '#c8b4e1', glow = '#b066d2';
  ball(s,skin,[0,.94,.04],[.135,.28,.1]);
  ball(s,purple,[0,.76,.015],[.17,.17,.11]);
  ball(s,pale,[0,1.48,.055],[.17,.21,.13]);
  for(const side of[-1,1]) {
    link(s,skin,[side*.11,1.13,.02],[side*.24,.94,.08],.04);
    link(s,pale,[side*.24,.94,.08],[side*.23,.76,.19],.027);
    for(let n=0;n<3;n++)link(s,pale,[side*.23,.76,.19],[side*(.2+n*.025),.66,.22+n*.012],.011);
    s.cone(purple,side*.11,.47,.03,.075,.53,0,0,side*.18);
    s.cone(skin,side*.19,1.52,.005,.065,.29,0,0,side*-.9);
    // Each wing is a real open, branching prism lattice, not a billboard.
    const wing:Point[]=[[side*.12,1.15,-.07],[side*.39,1.49,-.14],[side*.72,1.75,-.18],[side*.64,1.3,-.2],[side*.39,.99,-.18]];
    for(let n=0;n<wing.length;n++)link(s,dark,wing[n],wing[(n+1)%wing.length],.018);
    link(s,glow,wing[0],wing[2],.015);link(s,glow,wing[1],wing[3],.013);link(s,glow,wing[2],wing[4],.013);
    for(let n=0;n<4;n++) {
      const x=side*(.28+n*.085),y=1.16+n*.105;
      s.cone(purple,x,y,-.17,.07,.2,0,0,side*-.7);
    }
    const lower:Point[]=[[side*.12,1.03,-.08],[side*.51,.91,-.2],[side*.42,.68,-.18],[side*.22,.78,-.12]];
    for(let n=0;n<lower.length;n++)link(s,purple,lower[n],lower[(n+1)%lower.length],.016);
    link(s,glow,lower[0],lower[2],.012);
    link(s,glow,[side*.065,1.62,.05],[side*.26,1.82,-.04],.016);
  }
  // Wispy pointed hair and trailing magical strands mirror the spectral sprite.
  for(let n=0;n<7;n++)s.cone(n%2?purple:pale,(n-3)*.04,1.72+(n%3)*.035,-.015,.036,.22,0,0,(n-3)*-.25);
  for(let n=0;n<5;n++) {
    const side=n%2?1:-1,x=(n-2)*.05;
    link(s,purple,[x,.67,0],[x+side*.08,.4,-.015],.025);
    link(s,glow,[x+side*.08,.4,-.015],[x-side*.015,.2,-.005],.014);
  }
  eyes(s,.068,1.49,.188,'#54416f',.034);
  link(s,purple,[-.043,1.39,.177],[.036,1.39,.179],.01);
  return s.finish();
}
function firewallf() {
  const s = new Sculpt();
  const fur = '#3f434d', dark = '#252e37', light = '#697279', orange = '#f2761d', hot = '#ffca37';
  ball(s,fur,[0,.69,-.04],[.26,.26,.52]);
  link(s,dark,[0,.75,.3],[0,1.07,.5],.21);
  ball(s,fur,[0,1.16,.55],[.21,.22,.22]);
  ball(s,light,[0,1.09,.77],[.135,.1,.22]);
  ball(s,dark,[0,1.12,.95],[.085,.06,.06]);
  s.box('#141b20',0,1.025,.81,.22,.054,.23,.08);
  for(const side of[-1,1]) {
    for(const z of[-.38,.3]) {
      link(s,fur,[side*.18,.65,z],[side*.22,.34,z-.04],.07);
      link(s,dark,[side*.22,.34,z-.04],[side*.24,.09,z+.065],.045);
      ball(s,light,[side*.24,.05,z+.13],[.09,.045,.14]);
      for(let n=0;n<3;n++)link(s,'#9e9e8c',[side*.24+(n-1)*.04,.05,z+.2],[side*.24+(n-1)*.04,.04,z+.26],.012);
      link(s,orange,[side*.215,.61,z+.015],[side*.265,.32,z+.04],.016);
    }
    s.cone(dark,side*.15,1.38,.47,.075,.31,0,0,side*-.16);
    s.cone(orange,side*.15,1.39,.49,.04,.2,0,0,side*-.16);
    ball(s,'#f9b747',[side*.115,1.2,.733],[.043,.034,.018]);
    link(s,dark,[side*.06,1.26,.75],[side*.185,1.28,.65],.025);
    for(let n=0;n<3;n++)s.cone('#e6d5ad',side*(.055+n*.035),1.015,.84,.014,.07,Math.PI);
    // Flame mane rises in a jagged collar and streams over both shoulders.
    for(let n=0;n<6;n++) {
      const y=.77+n*.1,z=.32+n*.024,x=side*(.24-n*.018);
      s.cone(orange,x,y,z,.075,.33,0,0,side*-.65);
      s.cone(hot,x,y+.03,z+.012,.035,.23,0,0,side*-.65);
    }
    for(let n=0;n<5;n++) {
      const z=-.42+n*.16;
      link(s,orange,[side*.23,.73,z],[side*.28,.5,z+.09],.018);
      link(s,orange,[side*.28,.5,z+.09],[side*.24,.44,z+.16],.014);
    }
  }
  for(let n=0;n<7;n++)s.cone(n%2?orange:hot,0,1.02-n*.032,.25-n*.12,.05,.28,-.25);
  const tail:Point[]=[[0,.71,-.5],[.16,.7,-.76],[.28,.57,-1.03],[.31,.35,-1.21]];
  tail.slice(1).forEach((p,i)=>link(s,fur,tail[i],p,.07-i*.014));
  for(const side of[-1,1])for(let n=0;n<4;n++) {
    const a:Point=[.2+side*n*.025,.65-n*.045,-.85],b:Point=[.38+side*n*.035,.39-n*.025,-1.23];
    link(s,orange,a,b,.025);
    s.cone(n%2?orange:hot,b[0],b[1]-.035,b[2]-.04,.035,.2,.5,0,-.5);
  }
  return s.finish();
}

export const SCULPTS_A: Record<string, () => THREE.BufferGeometry> = {
  mon_budling: budling,
  mon_lustleaf: lustleaf,
  mon_glitchbitch: glitchbitch,
  mon_datawhore: datawhore,
  mon_neonpunx: neonpunx,
  mon_gridbruiser: gridbruiser,
  mon_hashound: hashound,
  mon_puffpuff: puffpuff,
  mon_jointail: jointail,
  mon_hackroach: hackroach,
  mon_cracksprite: cracksprite,
  mon_firewallf: firewallf,
};
