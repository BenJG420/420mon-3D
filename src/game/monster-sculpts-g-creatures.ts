import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];
const ball = (s: Sculpt, color: string, p: P, size: P) => s.ellipsoid(color, ...p, ...size);
const line = (s: Sculpt, color: string, a: P, b: P, r = .018) => s.rod(color, a, b, r);

/** #70: the original glossy pink krait, with an S-neck and a genuine ground coil. */
function lipkrait() {
 const s = new Sculpt(), pink = '#dd285b', light = '#f24977', seam = '#9e1746';
 const path: P[] = [
  [-.16,1.34,.02],[.055,1.26,-.025],[.145,1.075,-.025],[.09,.88,.015],
  [-.11,.69,.07],[-.22,.5,.13],[-.18,.32,.19],[.02,.22,.23],
  [.25,.17,.24],[.4,.15,.08],[.37,.14,-.16],[.16,.135,-.31],
  [-.14,.13,-.3],[-.36,.13,-.12],[-.38,.13,.15],[-.18,.13,.38],
  [.13,.13,.4],[.37,.14,.23]
 ];
 s.tube(pink,path,.112,100);
 // A finer inner curl completes the coil without giving it a stack of bead joints.
 s.tube(pink,[[.37,.14,.23],[.26,.18,-.025],[.04,.2,-.12],[-.1,.2,-.02],[-.02,.21,.13],[.12,.215,.14]],.086,40);
 s.tube(light,[[.12,.215,.14],[.19,.22,.09],[.17,.22,.025]],.055,16);
 const curve = new THREE.CatmullRomCurve3(path.map(p => new THREE.Vector3(...p)));
 for (let i = 1; i < 31; i++) {
  const t = i/31, p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),tangent));
  s.lathe(seam,[[.109,-.004],[.115,-.004],[.118,0],[.115,.004],[.109,.004],[.109,-.004]],p.x,p.y,p.z,e.x,e.y,e.z);
 }
 // Broad belly scutes sit against the neck, while the body itself stays continuous.
 for (let i = 1; i < 10; i++) {
  const t = .035+i*.024, p = curve.getPointAt(t);
  ball(s,light,[p.x,p.y,p.z+.1],[.062,.025,.015]);
 }
 ball(s,seam,[-.19,1.365,.09],[.22,.175,.18]);
 ball(s,pink,[-.23,1.415,.11],[.222,.168,.178]);
 ball(s,light,[-.31,1.47,.155],[.12,.085,.135]);
 ball(s,pink,[-.355,1.315,.185],[.135,.078,.125]);
 ball(s,'#f96086',[-.31,1.277,.19],[.143,.035,.105]);
 s.tube('#7f163d',[[-.475,1.293,.195],[-.38,1.267,.277],[-.26,1.277,.275],[-.15,1.32,.226]],.01,22);
 for (const side of [-1,1]) {
  const z = .11+side*.155;
  ball(s,'#5f1b37',[-.17,1.364,z],[.048,.063,.023]);
  ball(s,'#edc546',[-.174,1.37,z+side*.018],[.032,.048,.014]);
  ball(s,'#291d28',[-.177,1.37,z+side*.029],[.009,.04,.008]);
  ball(s,'#fff1bc',[-.183,1.388,z+side*.035],[.01,.013,.006]);
 }
 ball(s,'#8a1d42',[-.445,1.335,.242],[.013,.016,.008]);
 s.tube('#d32c65',[[-.468,1.286,.222],[-.53,1.21,.235],[-.6,1.14,.255]],.012,20);
 s.tube('#ea407b',[[-.6,1.14,.255],[-.67,1.145,.257],[-.69,1.155,.263]],.008,12);
 s.tube('#ea407b',[[-.6,1.14,.255],[-.63,1.09,.263],[-.665,1.075,.27]],.008,12);
 return s.finish();
}

/** #71: a machined horseshoe magnet; its opening remains empty from front to back. */
function magtick() {
 const s = new Sculpt(), steel = '#929aa8', edge = '#5d6677', dark = '#343e51', shine = '#c3c7cf';
 const horseshoe = (outer: number, inner: number, bottom: number, z: number): P[] => {
  const points: P[] = [[-outer,bottom,z],[-outer,.65,z]];
  for (let i = 1; i <= 24; i++) {
   const a = Math.PI-i*Math.PI/24;
   points.push([Math.cos(a)*outer,.65+Math.sin(a)*outer,z]);
  }
  points.push([outer,bottom,z],[inner,bottom,z],[inner,.65,z]);
  for (let i = 1; i <= 24; i++) {
   const a = i*Math.PI/24;
   points.push([Math.cos(a)*inner,.65+Math.sin(a)*inner,z]);
  }
  points.push([-inner,bottom,z]);
  return points;
 };
 s.panel(dark,horseshoe(.53,.285,.43,-.025),.32);
 s.panel(steel,horseshoe(.515,.3,.445,.15),.035);
 s.panel(edge,horseshoe(.515,.3,.445,-.2),.025);
 const rim: P[] = [[-.52,.45,.174],[-.52,.65,.174]];
 for (let i = 1; i <= 24; i++) {
  const a = Math.PI-i*Math.PI/24;
  rim.push([Math.cos(a)*.52,.65+Math.sin(a)*.52,.174]);
 }
 rim.push([.52,.45,.174]);
 s.tube(shine,rim,.012,48);
 // The dark inset face occupies the top of the hole, leaving the central gap open.
 s.panel(dark,[[-.235,.81,.012],[-.14,.93,.012],[.12,.94,.012],[.235,.82,.012],[.19,.72,.012],[-.19,.72,.012]],.19);
 for (const side of [-1,1]) {
  ball(s,'#bcc0cb',[side*.113,.828,.119],[.062,.075,.025]);
  ball(s,'#202a3c',[side*.113,.828,.142],[.042,.055,.014]);
  ball(s,'#8198b4',[side*.113-.006,.84,.156],[.018,.034,.007]);
  s.box(edge,side*.407,.47,.193,.21,.14,.065,0,0,side*.035);
  s.box(shine,side*.407,.472,.231,.145,.105,.018);
  for (const [x,y] of [[.38,.88],[.45,.69],[.39,.56],[.16,1.1]]) {
   ball(s,edge,[side*x,y,.174],[.026,.026,.012]);
   ball(s,shine,[side*x-.005,y+.006,.184],[.014,.014,.009]);
  }
  // Two articulated walking feet on each flank, with the sprite's purple toe tips.
  for (let foot = 0; foot < 2; foot++) {
   const z = foot ? .08 : -.22, x = side*(foot ? .34 : .46);
   const hip: P = [x,.49,z], knee: P = [x+side*.08,.27,z+.04], ankle: P = [x+side*.075,.1,z+.12];
   line(s,dark,hip,knee,.044); line(s,edge,knee,ankle,.034);
   ball(s,steel,knee,[.052,.052,.052]); ball(s,steel,ankle,[.043,.034,.05]);
   s.tube(edge,[ankle,[x+side*.14,.055,z+.18],[x+side*.17,.055,z+.23]],.036,12);
   line(s,'#b44c9b',[x+side*.17,.055,z+.23],[x+side*.2,.06,z+.25],.013);
  }
  // Curved mechanical forearms and separate hooked prongs remain visibly open.
  const arm: P[] = [[side*.405,.47,.25],[side*.465,.39,.36],[side*.51,.29,.5],[side*.49,.19,.59]];
  s.tube(edge,arm,.039,28);
  for (const p of [arm[0],arm[1],arm[2]]) ball(s,shine,p,[.05,.045,.045]);
  for (const finger of [-1,1]) {
   s.tube(shine,[[side*.49,.19,.59],[side*(.49+finger*.065),.17,.65],[side*(.49+finger*.065),.205,.74],[side*.49,.245,.77]],.018,22);
  }
  const spark: P[] = [[side*.46,.42,.37],[side*.52,.4,.42],[side*.48,.35,.48],[side*.56,.29,.54],[side*.52,.265,.6]];
  for (let i = 0; i < spark.length-1; i++) line(s,'#64c8ff',spark[i],spark[i+1],.009);
  for (let i = 0; i < 4; i++) {
   const y = .46-i*.08, z = .39+i*.09;
   line(s,'#a8e9ff',[side*.58,y,z],[side*(.61+i%2*.025),y+.012,z+.007],.007);
  }
 }
 // Subtle seam plates across the crown add structure without obstructing the hole.
 for (const side of [-1,1]) {
  line(s,edge,[side*.18,1.126,.176],[side*.23,.958,.176],.009);
  line(s,shine,[side*.186,1.126,.181],[side*.236,.958,.181],.004);
 }
 return s.finish();
}

/** #72: orange/white ornamental koi, lobed fan fins and an open metal valve wheel. */
function valvekoi() {
 const s = new Sculpt(), orange = '#df691e', light = '#f18a36', white = '#e7dfc8', shade = '#a94918';
 ball(s,orange,[0,.49,0],[.565,.285,.235]);
 ball(s,orange,[-.385,.405,.025],[.285,.245,.225]);
 ball(s,shade,[.445,.53,-.005],[.22,.15,.155]);
 // Solid thin membranes have scalloped white rims on both sides.
 const fin = (points: P[], center: [number,number], z: number, depth = .025) => {
  s.panel(white,points.map(([x,y]) => [x,y,z] as P),depth);
  for (const side of [-1,1]) s.panel(light,points.map(([x,y]) =>
   [center[0]+(x-center[0])*.85,center[1]+(y-center[1])*.87,z+side*(depth/2+.003)] as P),.008);
 };
 const tail: P[] = [[.435,.5,0],[.57,.76,0],[.84,1.01,0],[.79,.81,0],[1,.94,0],[.9,.7,0],[1.015,.69,0],[.89,.575,0],[1.01,.45,0],[.83,.46,0],[.96,.275,0],[.76,.32,0],[.59,.43,0]];
 fin(tail,[.49,.53],-.015,.045);
 for (const [x,y] of [[.84,.96],[.955,.89],[.95,.68],[.96,.46],[.9,.32]]) {
  for (const side of [-1,1]) s.tube(shade,[[.48,.53,side*.014],[.66,(y+.53)/2,side*.017],[x,y,side*.015]],.009,18);
 }
 fin([[.03,.735,0],[.125,.89,0],[.25,1.005,0],[.225,.845,0],[.425,.955,0],[.4,.71,0]],[.19,.73],-.02,.035);
 for (const side of [-1,1]) {
  const z = side*.195;
  fin([[-.24,.37,z],[-.18,.19,z],[.035,.095,z],[-.005,.16,z],[.095,.155,z],[.015,.235,z],[-.12,.37,z]],[-.2,.34],z);
  for (const [x,y] of [[.025,.12],[.06,.17],[.005,.225]]) line(s,shade,[-.18,.32,z+side*.018],[x,y,z+side*.018],.007);
  fin([[.24,.35,z],[.36,.245,z],[.53,.26,z],[.44,.32,z],[.53,.35,z],[.37,.4,z]],[.29,.36],side*.14);
 }
 // Uneven broad patches wrap around the actual curved body, not a floating decal.
 ball(s,white,[.19,.497,0],[.095,.273,.223]);
 ball(s,white,[.125,.655,.025],[.084,.12,.19]);
 ball(s,orange,[.12,.48,.211],[.055,.085,.025]);
 ball(s,orange,[.25,.585,.181],[.035,.06,.025]);
 ball(s,white,[.415,.525,0],[.049,.176,.164]);
 ball(s,white,[-.375,.579,.045],[.085,.094,.18]);
 ball(s,orange,[-.36,.62,.12],[.05,.033,.07]);
 ball(s,white,[-.544,.28,.03],[.17,.085,.195]);
 ball(s,white,[-.571,.367,.04],[.113,.125,.202]);
 for (const side of [-1,1]) {
  const z = side*.197+.025;
  ball(s,white,[-.455,.427,z],[.115,.13,.031]);
  ball(s,'#614026',[-.463,.429,z+side*.025],[.075,.092,.02]);
  ball(s,'#161b1c',[-.472,.436,z+side*.041],[.055,.072,.013]);
  ball(s,'#fff9dc',[-.49,.468,z+side*.053],[.023,.027,.008]);
  s.tube(shade,[[-.28,.53,side*.215],[-.24,.46,side*.233],[-.265,.38,side*.208]],.012,20);
  s.tube(white,[[-.666,.301,side*.09],[-.69,.27,side*.15],[-.66,.235,side*.19]],.014,18);
  for (let i = 0; i < 5; i++) {
   const x = -.15+i*.073, y = .64-i%2*.046;
   s.tube('#bc551b',[[x-.025,y+.025,side*.192],[x,y,side*.216],[x+.026,y+.02,side*.193]],.007,10);
  }
 }
 s.tube('#90633c',[[-.684,.312,-.045],[-.699,.287,.035],[-.684,.304,.119]],.011,18);
 // The wheel has a real central opening, four spokes, a hub and its valve stem.
 const valveX = -.105, valveY = 1.075, tilt = Math.PI/6;
 const wheelPoint = (x: number, y: number, z: number): P =>
  [valveX+x,valveY+y*Math.cos(tilt)-z*Math.sin(tilt),y*Math.sin(tilt)+z*Math.cos(tilt)];
 s.lathe('#707277',[[0,0],[.11,0],[.115,.02],[.095,.06],[.062,.07],[0,.07]],valveX,.753,0);
 s.lathe('#939598',[[0,0],[.058,0],[.058,.24],[.05,.26],[0,.26]],valveX,.81,0);
 s.lathe('#b0b0ac',[[.18,-.025],[.215,-.025],[.232,0],[.215,.029],[.18,.029],[.166,0],[.18,-.025]],valveX,valveY,0,tilt);
 s.lathe('#5c5d67',[[.175,-.005],[.195,-.005],[.202,.011],[.192,.019],[.175,.019],[.175,-.005]],...wheelPoint(0,.012,0),tilt);
 for (let i = 0; i < 4; i++) {
  const a = i*Math.PI/2+.22;
  line(s,'#888992',wheelPoint(0,0,0),wheelPoint(Math.cos(a)*.19,0,Math.sin(a)*.19),.021);
 }
 s.lathe('#adaeac',[[0,-.026],[.061,-.026],[.061,.026],[.045,.04],[0,.04]],valveX,valveY,0,tilt);
 s.lathe('#514b58',[[0,0],[.026,0],[.026,.012],[0,.012]],...wheelPoint(0,.041,0),tilt);
 return s.finish();
}

export const SCULPTS_G_CREATURES: Record<string, () => THREE.BufferGeometry> = {
 mon_lipkrait: lipkrait,
 mon_magtick: magtick,
 mon_valvekoi: valvekoi,
};
