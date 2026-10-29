import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];
function cord(s: Sculpt, color: string, points: P[], radius: number, steps = 24, sides = 8) {
  s.surface(color, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), steps, radius, sides, false));
}
function oval(s: Sculpt, color: string, p: P, scale: P, w = 20, h = 12) {
  s.surface(color, new THREE.SphereGeometry(1,w,h).scale(...scale).translate(...p));
}
function profile(s: Sculpt, color: string, points: [number,number][], p: P, rotation: P = [0,0,0], segments = 48) {
  s.surface(color,new THREE.LatheGeometry(points.map(v => new THREE.Vector2(...v)),segments)
    .applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation))).translate(...p));
}
function relief(s: Sculpt, color: string, outline: [number,number][], z: number, depth = .006) {
  const shape = new THREE.Shape(outline.map(p => new THREE.Vector2(...p)));
  s.surface(color,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.005,bevelThickness:.003,bevelSegments:2}).translate(0,0,z));
}

/** #115: an open worn cardboard pack, sleepy eyes and the two source filter stubs. */
function cigpack() {
  const s = new Sculpt({detail:"high"});
  const paper="#b1a4c7", dark="#625675", edge="#c6c0ce";
  // Separate walls leave a genuine opening: the inner liner, bottom and cigarettes
  // are visible down through the mouth rather than drawn on a solid box top.
  s.roundedBox(dark,0,.13,0,.72,.12,.43,.025);
  s.roundedBox("#4d4a56",0,.64,-.183,.72,.94,.064,.025);
  for(const side of [-1,1]) {
    s.roundedBox("#80718f",side*.339,.61,0,.064,.92,.42,.021);
    s.roundedBox("#a8a2ae",side*.304,.665,0,.014,.8,.345,.006);
    s.rod(edge,[side*.345,1.058,-.16],[side*.345,1.058,.188],.012);
    // Folded side gussets and seams carry relief around the whole pack.
    cord(s,"#51455e",[[side*.376,.22,.12],[side*.375,.42,-.02],[side*.375,.62,.09],[side*.373,.83,-.06],[side*.367,1.015,.07]],.008,24,6);
    cord(s,"#b6a8c8",[[side*.374,.28,-.1],[side*.375,.43,.065],[side*.375,.62,-.13],[side*.372,.8,.05]],.012,24,6);
    s.rod("#d2c5d8",[side*.301,.205,.222],[side*.315,.945,.222],.008);
  }
  s.roundedBox(paper,0,.595,.186,.725,.87,.058,.023);
  s.roundedBox("#898393",0,.655,.151,.65,.76,.012,.005);
  // The shallow irregular violet patches are raised folded print, not pixel cubes.
  for(const side of [-1,1]) {
    const mirror=(pts:[number,number][])=>pts.map(([x,y]):[number,number]=>[x*side,y]);
    relief(s,"#817096",mirror([[.04,.995],[.14,1.028],[.2,.97],[.31,1.016],[.34,.92],[.26,.88],[.17,.95],[.09,.92]]),.218);
    relief(s,"#88749e",mirror([[.14,.3],[.22,.38],[.29,.345],[.345,.43],[.332,.27],[.265,.2],[.2,.236]]),.218);
    relief(s,"#d0c7d7",mirror([[.035,.56],[.115,.585],[.15,.54],[.21,.515],[.255,.45],[.16,.467],[.115,.517]]),.223);
    cord(s,"#665477",[[side*.274,.6,.225],[side*.32,.55,.23],[side*.287,.48,.232]],.008,12,6);
    cord(s,"#766284",[[side*.266,.834,.23],[side*.32,.791,.232],[side*.305,.721,.232]],.008,12,6);
  }
  s.rod(edge,[-.35,1.03,.2],[.35,1.03,.2],.014);
  // Crinkled inner foil is behind the stubs and leaves the main cavity exposed.
  for(let i=0;i<9;i++) {
    const x=-.27+i*.067,y=1.01+.018*Math.sin(i*2.7);
    s.box(i%2?"#9f9ba8":"#cac7ce",x,y,-.123,.064,.125,.018,-.13,0,.08*Math.sin(i));
    s.rod("#676472",[x-.018,y-.035,-.105],[x+.015,y+.044,-.108],.003);
  }
  // Flip lid tilts backwards, with a grey recessed interior, side folds and hinge.
  const tilt=-.4, lidOrigin=new THREE.Vector3(0,1.055,-.18);
  const lidPoint=(x:number,y:number,z:number):P=>new THREE.Vector3(x,y,z).applyAxisAngle(new THREE.Vector3(1,0,0),tilt).add(lidOrigin).toArray() as P;
  s.roundedBox("#89808f",...lidPoint(0,.19,0),.74,.39,.043,.021,tilt);
  s.roundedBox("#555660",...lidPoint(0,.19,.027),.644,.3,.013,.009,tilt);
  for(const side of [-1,1]) {
    s.rod(edge,lidPoint(side*.351,.025,.025),lidPoint(side*.351,.357,.025),.012);
    s.roundedBox("#a19aaa",...lidPoint(side*.326,.175,.051),.034,.305,.09,.012,tilt);
  }
  s.rod(edge,lidPoint(-.34,.37,.012),lidPoint(.34,.37,.012),.012);
  s.rod("#39373e",[-.3,1.049,-.155],[.3,1.049,-.155],.016);
  for(let i=0;i<3;i++)s.rod("#c0b7c8",[-.29+i*.21,1.052,-.15],[-.2+i*.21,1.052,-.15],.018);
  // Two tilted, individually rolled paper/filter cylinders with recessed ash ends.
  for(const [x,y,lean] of [[-.15,.91,.23],[.055,.92,.17]]) {
    const at=(dy:number):P=>[x-Math.sin(lean)*dy,y+Math.cos(lean)*dy,.025];
    profile(s,"#e1ded6",[[0,0],[.046,0],[.049,.015],[.049,.196],[.046,.21],[0,.21]],[x,y,.025],[0,0,lean],32);
    profile(s,"#c79753",[[0,.2],[.048,.2],[.05,.215],[.05,.363],[.046,.375],[0,.375]],[x,y,.025],[0,0,lean],32);
    profile(s,"#eee9dc",[[0,.374],[.033,.374],[.039,.378],[.032,.382],[0,.382]],[x,y,.025],[0,0,lean],24);
    for(let k=0;k<7;k++) {
      const dy=.224+k*.02,p=at(dy);
      s.rod(k%2?"#ad7b45":"#e0b776",[p[0]-.025,p[1],.067],[p[0]+.012,p[1]+.006,.071],.0032);
    }
    const p=at(.379);oval(s,"#655558",[p[0],p[1],p[2]],[.026,.005,.027],16,8);
  }
  // Narrow sculpted smoke curl keeps the source silhouette without a particle pass.
  cord(s,"#aaa5b4",[[-.44,1.11,-.06],[-.55,1.22,-.06],[-.49,1.31,-.05],[-.61,1.41,-.04],[-.48,1.52,-.03],[-.51,1.62,-.04]],.014,42,8);
  for(const side of [-1,1]) {
    const x=side*.174;
    oval(s,"#594862",[x,.749,.235],[.132,.13,.035]);
    oval(s,"#d8cbdc",[x,.729,.264],[.102,.084,.018]);
    oval(s,"#312534",[x,.731,.283],[.039,.064,.009],20,12);
    oval(s,"#f2e6e5",[x-.014,.754,.291],[.012,.018,.004],12,8);
    // Heavy upper eyelids partially cover the iris, as in the sleepy original.
    s.roundedBox("#8b74a9",x,.8,.276,.226,.084,.036,.035,0,0,side*-.1);
    cord(s,"#493749",[[x-.105,.765,.286],[x,.775,.299],[x+.105,.76,.285]],.012,16,8);
    oval(s,"#766c72",[side*.238,.06,.04],[.108,.055,.12]);
    s.rod("#b9aaa7",[side*.238-.064,.061,.144],[side*.238+.064,.061,.144],.008);
  }
  cord(s,"#66516c",[[-.07,.585,.23],[0,.603,.24],[.065,.579,.23]],.011,18,8);
  // Rear folded-paper seam and embossed warning bands are visible on rotation.
  s.rod("#62596d",[-.06,.23,-.22],[-.06,.98,-.22],.007);
  for(let i=0;i<6;i++)s.box(i%2?"#b6adbf":"#8e819e",.07,.29+i*.058,-.221,.31-i*.019,.016,.007);
  const geometry=s.finish();
  geometry.userData.sculptFeatures=["open cardboard cavity with liner and folded foil", "tilted hinged lid with recessed inside", "two rolled filter stubs with ash ends", "raised violet paper folds and rear seams", "sleepy eyes and sculpted smoke curl"];
  return geometry;
}

/** #117: tapered violet rubber bulb, glass sidewall, measured liquid and hanging drop. */
function pipette() {
  const s=new Sculpt({detail:"high"});
  // A continuous revolved profile makes the pointed pear cap round from every angle.
  profile(s,"#71448c",[[0,.89],[.105,.89],[.172,.93],[.205,1.02],[.211,1.12],
    [.191,1.22],[.157,1.31],[.116,1.38],[.086,1.45],[.056,1.53],[.027,1.58],[0,1.595]],[0,0,0], [0,0,0],64);
  profile(s,"#4e325f",[[0,.808],[.099,.808],[.112,.824],[.112,.871],[.1,.894],[0,.894]],[0,0,0]);
  for(const [y,r] of [[.82,.105],[.859,.112],[.899,.108]])s.torus("#9a6eae",0,y,0,r,.009,Math.PI/2);
  for(let i=0;i<12;i++) {
    const a=i/12*Math.PI*2;
    s.rod("#35233f",[Math.sin(a)*.111,.83,Math.cos(a)*.111],[Math.sin(a)*.111,.853,Math.cos(a)*.111],.0035);
  }
  // Glass remains open toward the camera: the sides/back surround actual green
  // liquid and a visible meniscus. No opaque cylinder hiding a flat painted fill.
  const wall=new THREE.LatheGeometry([[.024,.257],[.05,.303],[.062,.365],[.062,.813],
    [.048,.813],[.048,.37],[.038,.314],[.016,.27]].map(p=>new THREE.Vector2(...p)),48,.36,Math.PI*2-.72);
  s.surface("#b8c9db",wall);
  profile(s,"#80ba4e",[[0,.267],[.024,.276],[.041,.322],[.046,.37],[.046,.573],[.044,.585],[.035,.577],[0,.577]],[0,0,0]);
  s.torus("#c4dc81",0,.577,0,.04,.004,Math.PI/2);
  // Raised specular streaks/sidewalls and calibration are actual small surfaces.
  for(const side of [-1,1]) {
    cord(s,side<0?"#e9f3ff":"#8a9fbc",[[side*.017,.282,.02],[side*.048,.346,.034],[side*.052,.55,.034],[side*.052,.8,.034]],.0045,30,8);
    cord(s,"#afc8d9",[[side*.02,.278,-.014],[side*.055,.366,-.018],[side*.055,.792,-.018]],.003,24,6);
    oval(s,"#6f3e86",[side*.102,.105,.016],[.063,.026,.045]);
    profile(s,"#9163a4",[[0,0],[.019,0],[.019,.045],[.013,.058],[0,.058]],[side*.113,.117,.013],[0,0,side*-.14],20);
  }
  for(let i=0;i<8;i++) {
    const y=.385+i*.05;
    s.rod(i<4?"#e2eebc":"#e3edf7",[-.039,y,.051],[i%2?-.005:.022,y,.053],.0026);
  }
  for(let i=0;i<4;i++) {
    const y=.35+i*.058;
    oval(s,"#c4e387",[.012*Math.sin(i*2),y,.035],[.006,.009,.004],12,8);
  }
  // Distinct teardrop between the tip and the two violet feet.
  profile(s,"#a0cf5a",[[0,0],[.019,.003],[.031,.018],[.032,.035],[.023,.051],[.009,.072],[0,.09]],[0,.121,0], [0,0,0],32);
  oval(s,"#e8f5b8",[-.01,.155,.027],[.005,.012,.003],12,8);
  for(const side of [-1,1]) {
    const x=side*.106;
    oval(s,"#36213e",[x,1.035,.177],[.057,.076,.027]);
    oval(s,"#21152c",[x,1.043,.199],[.039,.055,.014],20,12);
    oval(s,"#f0e4f7",[x-.01,1.066,.211],[.018,.025,.006],16,10);
    oval(s,"#ab83ba",[x+.009,1.018,.214],[.013,.009,.005],12,8);
    cord(s,"#b58acb",[[x-.042,.993,.194],[x,.977,.201],[x+.04,.995,.192]],.004,18,6);
  }
  // The source's pale highlights follow the rubber curvature, leaving rounded dark sides.
  cord(s,"#9770b0",[[-.03,1.53,.044],[-.057,1.43,.065],[-.111,1.329,.09],[-.15,1.24,.105]],.007,28,8);
  cord(s,"#845498",[[.154,1.21,-.105],[.13,1.31,-.09],[.08,1.413,-.068]],.004,22,6);
  const geometry=s.finish();
  geometry.userData.sculptFeatures=["continuous pear-shaped rubber cap", "ribbed retaining collar", "open front glass sidewall and tapered tip", "green liquid volume with concave meniscus and eight graduations", "separate suspended drop and purple feet", "rounded bright eyes and cap highlights"];
  return geometry;
}

export const SCULPTS_O_OBJECTS: Record<string,()=>THREE.BufferGeometry>={mon_cigpack:cigpack,mon_pipette:pipette};
