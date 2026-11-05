import * as THREE from "three";
import { Sculpt } from "./model-sculpt";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=16,h=10) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function bevelBox(s:Sculpt,color:string,p:P,size:P,radius:number,rz=0,segments=1) {
  s.surface(color,new RoundedBoxGeometry(...size,segments,radius).rotateZ(rz).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],radius:number,steps=24,sides=8) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,radius,sides,false));
}
function plate(s:Sculpt,color:string,shape:THREE.Shape,depth:number,z:number,bevel=.012) {
  s.surface(color,new THREE.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:24,
    bevelEnabled:true,bevelSegments:4,bevelSize:bevel,bevelThickness:bevel}).translate(0,0,z-depth/2));
}
function edgeShape(points:[number,number][]) {
  const shape=new THREE.Shape();shape.moveTo(...points[0]);
  for(const p of points.slice(1))shape.lineTo(...p);
  shape.closePath();return shape;
}
function bolt(s:Sculpt,x:number,y:number,z:number,r=.031,back=false) {
  const direction=back?-1:1;
  s.surface("#4d362b",new THREE.CylinderGeometry(r*1.22,r*1.22,.014,16).rotateX(Math.PI/2).translate(x,y,z));
  s.surface("#b49c70",new THREE.CylinderGeometry(r,r,.023,6).rotateX(Math.PI/2).translate(x,y,z+direction*.011));
  oval(s,"#d3c39a",[x-.004,y+.004,z+direction*.024],[r*.63,r*.63,.005],10,6);
  s.box("#5a4632",x,y,z+direction*.03,r*1.1,.006,.003,0,0,-.31);
}

/** #145 — a substantial open-jawed rusty forging, with its face down the diagonal handle. */
function wrench() {
  const s=new Sculpt({detail:"high"});
  // The concave inner contour is actual empty space through the whole forging.
  const body=new THREE.Shape();body.moveTo(-.365,1.535);
  body.quadraticCurveTo(-.285,1.61,-.16,1.575);
  body.bezierCurveTo(.015,1.53,.163,1.366,.165,1.215);
  body.quadraticCurveTo(.165,1.097,.098,1.002);
  body.lineTo(.705,.256);body.quadraticCurveTo(.778,.17,.749,.112);
  body.quadraticCurveTo(.717,.047,.645,.074);body.lineTo(.529,.113);
  body.lineTo(-.126,.837);body.quadraticCurveTo(-.36,.766,-.506,.87);
  body.bezierCurveTo(-.64,.945,-.721,1.095,-.704,1.254);
  body.lineTo(-.621,1.147);body.quadraticCurveTo(-.54,1.04,-.383,1.011);
  body.quadraticCurveTo(-.247,1.06,-.127,1.244);
  body.quadraticCurveTo(-.147,1.346,-.251,1.439);
  body.lineTo(-.365,1.493);body.closePath();
  plate(s,"#86462a",body,.23,0,.025);
  // Curved raised flash/rim follows the broad front and back; it never bridges the jaw.
  const outer:P[]=[[-.342,1.54,.145],[-.18,1.55,.145],[.018,1.398,.145],
    [.131,1.222,.145],[.062,1.016,.145],[.364,.637,.145],[.687,.201,.145],[.695,.112,.145]];
  const lower:P[]=[[.624,.122,.145],[.313,.456,.145],[-.137,.865,.145],[-.367,.833,.145],
    [-.533,.945,.145],[-.646,1.123,.145]];
  const inner:P[]=[[-.64,1.155,.145],[-.539,1.069,.145],[-.389,1.041,.145],[-.254,1.103,.145],
    [-.151,1.249,.145],[-.193,1.356,.145],[-.277,1.437,.145]];
  for(const side of [-1,1]) {
    const flip=(points:P[])=>points.map(([x,y,z])=>[x,y,z*side] as P);
    cord(s,side>0?"#b37748":"#9a5c36",flip(outer),.013,56,8);
    cord(s,"#bb8c5c",flip(lower),.011,44,8);
    cord(s,"#c1a37a",flip(inner),.014,36,8);
  }
  // Forged inset handle faces carry diagonal shoulders and a worn central spine.
  const inset=edgeShape([[-.045,.929],[.076,.92],[.646,.214],[.638,.157],[.547,.188],[-.038,.838]]);
  for(const side of [-1,1]) {
    plate(s,side>0?"#9b5a36":"#78412c",inset,.012,side*.142,.007);
    cord(s,"#c59868",[[.042,.864,side*.157],[.248,.594,side*.157],[.552,.25,side*.157]],.007,28,6);
    cord(s,"#583a2e",[[.003,.833,side*.156],[.238,.56,side*.156],[.552,.216,side*.156]],.006,28,6);
  }
  // Source's two off-white, dark-rimmed bolt eyes are offset down the handle.
  for(const [x,y] of [[.047,.816],[.287,.56]]) {
    oval(s,"#4c3025",[x,y,.171],[.077,.078,.025],24,16);
    s.surface("#bbb29a",new THREE.CylinderGeometry(.057,.066,.025,8).rotateX(Math.PI/2).translate(x,y,.193));
    oval(s,"#ece4c9",[x-.006,y+.009,.21],[.044,.047,.01],20,12);
    oval(s,"#6d6253",[x+.011,y-.006,.219],[.019,.022,.006],16,10);
    oval(s,"#fff4dc",[x-.018,y+.025,.22],[.012,.014,.004],12,8);
    cord(s,"#b97c49",[[x-.07,y+.053,.193],[x-.02,y+.079,.192],[x+.047,y+.053,.186]],.009,16,6);
  }
  // Irregular small oxide scales and polished edge scars occur on both sides.
  for(const side of [-1,1])for(let i=0;i<28;i++) {
    const t=(i+.5)/28,x=.017+t*.59,y=.873-t*.676;
    const offset=((i%4)-1.5)*.022;
    if(side>0&&[.047,.287].some(cx=>Math.abs(x+offset-cx)<.07))continue;
    oval(s,i%3===0?"#51372b":i%2?"#b9713d":"#d09a5d",
      [x+offset,y+offset*.6,side*.157],[.009+(i%3)*.004,.013+(i%4)*.003,.003],8,6);
  }
  for(const side of [-1,1])for(let i=0;i<18;i++) {
    const a=-.9+i*.145,x=-.277+Math.cos(a)*.36,y=1.205+Math.sin(a)*.285;
    // Only the right-hand metal arc is sampled, preserving the negative jaw.
    if(x<-.18&&y<1.39)continue;
    oval(s,i%3?"#b66a38":"#534334",[x,y,side*.143],[.015+(i%3)*.003,.025,.004],10,6);
  }
  bolt(s,.457,.367,-.161,.023,true);
  bolt(s,-.054,1.233,-.154,.026,true);
  // Short bent ankles and wide cast feet match the two supports in the sprite.
  for(const [x,y] of [[.211,.188],[.594,.155]]) {
    s.rod("#71432d",[x+.026,y,.025],[x-.012,.069,.032],.052);
    s.roundedBox("#8d5032",x-.023,.046,.033,.182,.086,.22,.026,0,0,-.08);
    s.roundedBox("#b47743",x-.035,.077,.108,.139,.025,.035,.01);
    for(let j=0;j<3;j++)s.box("#594033",x-.07+j*.037,.032,.147,.007,.024,.006);
  }
  return s.finish();
}

/** #148 — four open crosspieces, bent rusty rails and a round-eyed top plate. */
function ladder() {
  const s=new Sculpt({detail:"high"});
  const left=(y:number)=>-.447+y*.092,right=(y:number)=>.426+y*.063;
  const z=.008;
  // Two thick rectangular rail castings with continuous lighter rolled shoulders.
  for(const side of [-1,1]) {
    const x=side<0?left(.77):right(.77),tilt=side<0?-.092:-.063;
    s.roundedBox("#874323",x,.77,z,.126,1.46,.16,.025,0,0,tilt);
    for(const depth of [-.081,.095]) {
      cord(s,"#b56e3d",[[side<0?left(.11):right(.11),.11,depth],
        [side<0?left(.78):right(.78),.78,depth],[side<0?left(1.44):right(1.44),1.44,depth]],.013,34,8);
      cord(s,"#583b2c",[[x-.033,.14,depth],[x-.005,.8,depth],[x+.035,1.39,depth]],.006,24,6);
    }
  }
  // Three exposed rounded steps plus the substantial eye bar are the four crosspieces.
  for(const y of [.39,.699,1.008]) {
    const xl=left(y),xr=right(y),mid=(xl+xr)/2;
    bevelBox(s,"#96512c",[mid,y,.014],[xr-xl+.095,.095,.19],.022,-.025,2);
    bevelBox(s,"#be8050",[mid,y+.035,.033],[xr-xl-.01,.016,.133],.006,-.025);
    // Pressed traction ribs lie on top; the bay below remains open all the way through.
    for(let j=0;j<14;j++) {
      const x=xl+.085+j*(xr-xl-.17)/13;
      s.rod("#6c432a",[x,y+.043,-.014],[x+.008,y+.043,.091],.004);
    }
    for(const x of [xl,xr]) {
      bevelBox(s,"#71391f",[x,y,-.057],[.17,.149,.038],.012);
      bolt(s,x,y,.119,.022);
      bolt(s,x,y,-.093,.019,true);
    }
    cord(s,"#573c2f",[[xl+.09,y-.024,.117],[mid,y-.034,.117],[xr-.09,y-.041,.117]],.006,20,6);
  }
  // Slightly irregular corners and a substantial turned-under lower lip finish the face.
  const face=new THREE.Shape();face.moveTo(-.383,1.293);
  face.quadraticCurveTo(-.414,1.315,-.401,1.458);face.quadraticCurveTo(-.409,1.565,-.329,1.566);
  face.lineTo(.493,1.539);face.quadraticCurveTo(.569,1.542,.568,1.475);
  face.lineTo(.554,1.296);face.quadraticCurveTo(.53,1.259,.475,1.273);
  face.lineTo(-.383,1.293);face.closePath();
  plate(s,"#a2522c",face,.208,.004,.019);
  for(const depth of [-.128,.139]) {
    cord(s,"#c07e4b",[[-.379,1.32,depth],[-.185,1.298,depth],[.104,1.296,depth],[.356,1.281,depth],[.531,1.296,depth]],.012,40,8);
    cord(s,"#c38555",[[-.359,1.546,depth],[-.127,1.538,depth],[.162,1.533,depth],[.493,1.524,depth]],.009,36,8);
  }
  for(const x of [-.09,.177]) {
    oval(s,"#673c28",[x,1.418,.133],[.083,.087,.024],24,16);
    oval(s,"#191b1c",[x,1.418,.156],[.063,.067,.023],24,16);
    oval(s,"#423e32",[x+.009,1.401,.176],[.038,.032,.006],16,10);
    oval(s,"#f4ecd4",[x-.018,1.443,.179],[.019,.021,.006],16,10);
    oval(s,"#b7b9ad",[x+.022,1.4,.18],[.008,.009,.003],10,6);
  }
  // Irregular oxide blooms and shallow scraped islands follow actual solid surfaces.
  for(const side of [-1,1])for(let i=0;i<22;i++) {
    const y=.15+i*.06,rail=i%2?left(y):right(y),x=rail+((i%5)-2)*.012;
    oval(s,i%4===0?"#64422d":i%3===0?"#c98c58":"#a66032",[x,y,side>0?.103:-.09],
      [.012+(i%3)*.005,.018+(i%4)*.004,.003],8,4);
  }
  for(const side of [-1,1])for(let i=0;i<16;i++) {
    const x=-.34+i*.054,y=i%2?1.337:1.509;
    oval(s,i%3?"#c48551":"#6e4028",[x,y,side>0?.139:-.13],[.017,.009+(i%4)*.003,.003],8,4);
    if(i%4===0)cord(s,"#d0a074",[[x-.012,y-.006,side>0?.143:-.134],[x+.012,y+.014,side>0?.143:-.134]],.003,4,6);
  }
  // Low repair plates and capped feet give the frame a finished rear and underside.
  for(const y of [.175,1.19])for(const rail of [left,right]) {
    const x=rail(y);
    bevelBox(s,"#6f422b",[x,y,-.104],[.111,.12,.027],.009);
    bolt(s,x,y,-.125,.016,true);
  }
  for(const rail of [left,right]) {
    const x=rail(.073);
    bevelBox(s,"#5c3a2a",[x,.074,.01],[.17,.13,.215],.02,0,2);
    bevelBox(s,"#a65e32",[x,.025,.046],[.197,.05,.234],.014,0,2);
    for(let j=0;j<4;j++)s.box("#3d3127",x-.066+j*.044,.021,.166,.01,.026,.004);
    bolt(s,x,.081,.123,.021);
  }
  return s.finish();
}

export const SCULPTS_T_HARDWARE:Record<string,()=>THREE.BufferGeometry>={mon_wrench:wrench,mon_ladder:ladder};
