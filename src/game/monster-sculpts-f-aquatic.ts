import type * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];
const ball = (s: Sculpt, c: string, p: P, r: P) => s.ellipsoid(c, ...p, ...r);
const line = (s: Sculpt, c: string, a: P, b: P, r = .025) => s.rod(c, a, b, r);

/** #64: an uneven tar dome, glowing fissures, long black eye stalks and a drip. */
function tarslug() {
 const s = new Sculpt(), tar = '#252934', shade = '#171d27', ridge = '#343946';
 ball(s, tar, [0,.34,0], [.59,.31,.43]);
 ball(s, shade, [0,.13,.02], [.6,.13,.43]);
 // The low scalloped foot and overlapping tar folds are continuous volumes.
 for (let i = 0; i < 13; i++) {
  const a = i*Math.PI*2/13, x = Math.cos(a)*.5, z = Math.sin(a)*.34;
  ball(s, i%3 ? tar : ridge, [x,.115+(i%2)*.025,z], [.13,.09,.12]);
 }
 for (let i = 0; i < 8; i++) {
  const x = -.46+i*.13, y = .22+Math.sin(i*1.7)*.025;
  const z = .43*Math.sqrt(Math.max(0,1-(x/.62)**2));
  line(s, ridge, [x-.04,y+.08,z-.025], [x+.04,y,z+.025], .027);
  line(s, shade, [x+.04,y,z+.035], [x+.095,y+.025,z], .014);
 }
 // Branching cracks hug the dome instead of floating over it as flat decals.
 const surface = (x: number, y: number, side: number): P => [x,y,side*(.43*Math.sqrt(Math.max(.015,1-(x/.59)**2-((y-.34)/.31)**2))+.008)];
 const cracks: [number,number,number,number][] = [
  [-.38,.4,.039,1],[-.23,.49,.045,1],[-.06,.52,.041,1],[.14,.53,.048,1],
  [.34,.43,.041,1],[.04,.38,.052,1],[-.17,.32,.036,1],[.24,.3,.035,1],
  [-.37,.29,.028,1],[.39,.3,.03,1],[-.08,.625,.027,1],[.08,.595,.03,1],
  [-.22,.49,.035,-1],[.18,.46,.043,-1],[.37,.3,.028,-1]
 ];
 for (const [x,y,r,side] of cracks) {
  for (let arm = 0; arm < 4; arm++) {
   const a = arm*Math.PI/2+.3, bx = x+Math.cos(a)*r, by = y+Math.sin(a)*r;
   line(s, '#a63814', surface(x,y,side), surface(bx,by,side), .018);
   line(s, '#f46b20', surface(x,y,side), surface(bx,by,side), .01);
   if (arm%2 === 0) line(s, '#d84c16', surface(bx,by,side), surface(bx+r*.28,by-r*.35,side), .009);
  }
  const p = surface(x,y,side);
  ball(s, '#ff9a38', [p[0],p[1],p[2]+side*.007], [.013,.014,.009]);
 }
 for (const side of [-1,1]) {
  const base: P = [side*.27,.54,.1], bend: P = [side*.36,.73,.14], tip: P = [side*.41,.91,.18];
  line(s, shade, base, bend, .044); line(s, tar, bend, tip, .032);
  ball(s, ridge, tip, [.057,.067,.055]);
  ball(s, '#10141d', [tip[0],tip[1],tip[2]+.044], [.035,.046,.02]);
  ball(s, '#b5b5c2', [tip[0]-.009,tip[1]+.015,tip[2]+.06], [.01,.013,.008]);
 }
 line(s, shade, [.035,.085,.37], [.035,-.025,.39], .013);
 ball(s, '#393343', [.035,-.078,.395], [.027,.047,.027]);
 return s.finish();
}

/** #65: a curved, ring-plated copper eel with a two-prong plug and lightning belly. */
function plugeel() {
 const s = new Sculpt(), copper = '#ba6332', light = '#dc8c4e', dark = '#663821';
 const path: P[] = [
  [-.4,1.12,0],[-.27,1.11,-.005],[-.14,1.075,-.02],[-.025,1.01,-.03],
  [.075,.91,-.04],[.15,.79,-.04],[.195,.65,-.025],[.23,.51,0],
  [.28,.385,.025],[.37,.285,.05],[.48,.215,.07],[.57,.15,.085],
  [.605,.07,.09],[.58,-.005,.09],[.515,-.065,.08],[.46,-.1,.065]
 ];
 for (let i = 0; i < path.length-1; i++) {
  const p = path[i], q = path[i+1], r = .115*(1-i/(path.length+1))+.014;
  line(s, copper, p, q, r);
  ball(s, copper, q, [r*.96,r*.96,r*.96]);
  const dx = q[0]-p[0], dy = q[1]-p[1], length = Math.hypot(dx,dy), nx = -dy/length, ny = dx/length;
  // Round seam bands run all around the body, including its unseen underside.
  for (let j = 0; j < 12; j++) {
   const a = j*Math.PI/6, b = (j+1)*Math.PI/6;
   line(s, dark,
    [p[0]+nx*r*Math.cos(a),p[1]+ny*r*Math.cos(a),p[2]+r*Math.sin(a)],
    [p[0]+nx*r*Math.cos(b),p[1]+ny*r*Math.cos(b),p[2]+r*Math.sin(b)], .009);
  }
  line(s, light, [p[0]+nx*r*.64,p[1]+ny*r*.64,p[2]+r*.73], [q[0]+nx*r*.55,q[1]+ny*r*.55,q[2]+r*.69], .012);
 }
 // Yellow zigzag follows the concave underside; each bend remains in 3D.
 const lightning: P[] = [];
 for (let i = 1; i < path.length-3; i++) {
  const p = path[i], q = path[i+1], dx = q[0]-p[0], dy = q[1]-p[1], length = Math.hypot(dx,dy);
  const r = .115*(1-i/(path.length+1))+.014, inset = i%2 ? .10 : .035;
  lightning.push([p[0]+dy/length*inset,p[1]-dx/length*inset,p[2]+r*.82+.018]);
 }
 for (let i = 0; i < lightning.length-1; i++) {
  line(s, '#e3ac27', lightning[i], lightning[i+1], .025);
  line(s, '#fff27b', lightning[i], lightning[i+1], .012);
 }
 // Broad copper housing, raised rim, two actual rectangular metal prongs.
 s.box(dark,-.45,1.095,.015,.32,.3,.27,0,.06,0);
 s.box(copper,-.45,1.115,.045,.285,.265,.28,0,.06,0);
 s.box(light,-.45,1.245,.045,.3,.035,.29);
 for (const x of [-.54,-.365]) {
  s.box(dark,x,1.265,.03,.075,.035,.09);
  s.box(light,x,1.37,.03,.042,.22,.052);
  s.box('#e7bd91',x-.009,1.385,.059,.014,.19,.008);
  ball(s, '#efcfaa', [x,1.48,.03], [.023,.012,.028]);
  s.box('#382d28',x,1.13,.192,.095,.1,.018);
  s.box('#42cdeb',x,1.13,.205,.055,.067,.012);
  s.box('#bdffff',x-.01,1.145,.214,.017,.023,.005);
 }
 line(s, dark, [-.55,1.01,.195], [-.38,1.01,.2], .012);
 for (const x of [-.53,-.38]) line(s, light, [x,1.055,.194], [x,1.015,.2], .01);
 return s.finish();
}

/** #66: squat warty toad, pale throat, spread toes and a radial cast-iron lid. */
function lidtoad() {
 const s = new Sculpt(), green = '#768e34', moss = '#536b29', light = '#a3b952', cream = '#b9aa7c';
 ball(s, moss, [0,.42,-.11], [.46,.35,.44]);
 for (const side of [-1,1]) {
  ball(s, green, [side*.355,.27,-.25], [.225,.24,.26]);
  ball(s, moss, [side*.43,.11,-.09], [.13,.1,.2]);
  ball(s, green, [side*.33,.39,.23], [.15,.2,.17]);
  line(s, green, [side*.34,.33,.28], [side*.41,.13,.4], .09);
  ball(s, light, [side*.41,.09,.44], [.1,.06,.1]);
  for (let toe = 0; toe < 3; toe++) {
   const x = side*(.35+toe*.055);
   line(s, light, [x,.09,.45], [x+side*(toe-1)*.025,.045,.57+(toe%2)*.035], .024);
   line(s, cream, [x+side*(toe-1)*.025,.045,.57+(toe%2)*.035], [x+side*(toe-1)*.03,.035,.61+(toe%2)*.035], .015);
   line(s, green, [side*.43,.07,-.07], [side*(.4+toe*.06),.035,.04+(toe%2)*.04], .024);
  }
  for (let row = 0; row < 3; row++) for (let j = 0; j < 3; j++) {
   const x = side*(.38+Math.sin(j*1.3)*.09), y = .3+row*.09, z = -.35+j*.13;
   ball(s, (j+row)%2 ? light : green, [x,y,z], [.035,.035,.039]);
  }
 }
 ball(s, green, [0,.54,.28], [.39,.24,.31]);
 ball(s, cream, [0,.285,.425], [.285,.225,.16]);
 ball(s, '#cec098', [0,.36,.52], [.245,.105,.075]);
 // Sculpted muzzle and a curved mouth, above the broad throat pouch.
 ball(s, light, [0,.49,.46], [.285,.125,.18]);
 const mouth: P[] = [[-.275,.455,.525],[-.19,.413,.588],[0,.398,.625],[.19,.413,.588],[.275,.455,.525]];
 for (let i = 0; i < mouth.length-1; i++) line(s, '#454a2b', mouth[i], mouth[i+1], .012);
 for (const side of [-1,1]) {
  ball(s, green, [side*.25,.7,.34], [.135,.15,.135]);
  ball(s, '#3b4626', [side*.25,.705,.455], [.103,.11,.039]);
  ball(s, '#b7c35d', [side*.25,.71,.485], [.076,.083,.025]);
  ball(s, '#303a26', [side*.25,.712,.507], [.052,.059,.014]);
  ball(s, '#f5edc2', [side*.25-.016,.738,.521], [.019,.024,.008]);
  ball(s, '#3f5026', [side*.09,.535,.616], [.018,.021,.009]);
  for (const [x,y,z] of [[.3,.54,.46],[.35,.48,.35],[.19,.59,.54]]) ball(s, moss, [side*x,y,z], [.025,.024,.018]);
 }
 // Tilt the whole closed lid toward the face so its radial slots remain visible.
 // Its lower rim sinks into the back instead of hovering above the shoulders.
 const tilt = 34*Math.PI/180, lidY = .78, lidZ = -.15;
 const lidPoint = (x: number, y: number, z: number): P =>
  [x,lidY+y*Math.cos(tilt)-z*Math.sin(tilt),lidZ+y*Math.sin(tilt)+z*Math.cos(tilt)];
 line(s, '#4d493e', lidPoint(0,-.075,0), lidPoint(0,.025,0), .36);
 line(s, '#897e6c', lidPoint(0,.025,0), lidPoint(0,.045,0), .345);
 for (let i = 0; i < 24; i++) {
  const a = i*Math.PI/12, b = (i+1)*Math.PI/12;
  line(s, '#b1a18a', lidPoint(Math.cos(a)*.345,.047,Math.sin(a)*.345), lidPoint(Math.cos(b)*.345,.047,Math.sin(b)*.345), .016);
  line(s, '#60584b', lidPoint(Math.cos(a)*.36,-.055,Math.sin(a)*.36), lidPoint(Math.cos(b)*.36,-.055,Math.sin(b)*.36), .014);
 }
 for (let i = 0; i < 12; i++) {
  const a = i*Math.PI/6;
  line(s, '#403d34', lidPoint(Math.cos(a)*.115,.047,Math.sin(a)*.115), lidPoint(Math.cos(a)*.28,.047,Math.sin(a)*.28), .024);
  ball(s, '#c1ad8f', lidPoint(Math.cos(a)*.315,.05,Math.sin(a)*.315), [.013,.013,.013]);
 }
 line(s, '#b0a087', lidPoint(0,.044,0), lidPoint(0,.058,0), .077);
 line(s, '#3a372f', lidPoint(0,.058,0), lidPoint(0,.064,0), .052);
 return s.finish();
}

export const SCULPTS_F_AQUATIC: Record<string, () => THREE.BufferGeometry> = {
 mon_tarslug: tarslug,
 mon_plugeel: plugeel,
 mon_lidtoad: lidtoad,
};
