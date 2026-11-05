import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function box(s:Sculpt,color:string,p:P,size:P,r=.01,segments=2) {
  s.surface(color,new RoundedBoxGeometry(...size,segments,r).translate(...p));
}
function line(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function rect(w:number,h:number,r:number,cx=0,cy=0) {
  const shape=new THREE.Shape(),x=cx-w/2,y=cy-h/2;
  shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);
  shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);
  shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);return shape;
}
function extrude(s:Sculpt,color:string,shape:THREE.Shape,z:number,depth:number,bevel=.008) {
  s.surface(color,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,
    bevelThickness:bevel,bevelSegments:3,curveSegments:10}).translate(0,0,z));
}

/** #161: a full green meter, recessed seven-segment LCD and rounded glass probe. */
function phmeter() {
  const s=new Sculpt({detail:"high"}),green="#718c39",shade="#3c522a",dark="#384452";
  const body=new THREE.Shape();body.moveTo(-.288,.19);body.quadraticCurveTo(-.444,.23,-.451,.429);
  body.lineTo(-.473,1.107);body.quadraticCurveTo(-.463,1.262,-.323,1.282);
  body.lineTo(.302,1.282);body.quadraticCurveTo(.441,1.266,.457,1.13);
  body.lineTo(.45,.438);body.quadraticCurveTo(.432,.234,.289,.193);body.closePath();
  extrude(s,dark,body,-.185,.349,.025);
  const face=body.clone();
  s.surface(green,new THREE.ExtrudeGeometry(face,{depth:.035,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:4,curveSegments:14})
    .scale(.906,.921,1).translate(0,.049,.169));
  // Rubber shoulder bumper and side ribs finish the full handheld casing.
  box(s,"#515c64",[0,1.264,-.015],[.683,.111,.397],.043,3);
  for(const side of [-1,1]) {
    box(s,"#2e3747",[side*.42,1.139,-.008],[.079,.207,.39],.028,3);
    line(s,"#91a455",[[side*.36,.346,.212],[side*.398,.565,.211],[side*.4,.865,.207],[side*.361,1.17,.209]],.006,30);
    for(let i=0;i<5;i++)box(s,"#566445",[side*.465,.563+i*.095,-.008],[.018,.032,.233],.007,1);
    box(s,"#34414c",[side*.241,.163,.014],[.148,.09,.186],.021,2);
    box(s,"#5e6d60",[side*.246,.174,.078],[.105,.018,.073],.007,1);
  }
  // A bevelled bezel has an actual opening down to the recessed LCD plane.
  const bezel=rect(.684,.461,.039,0,.904);bezel.holes.push(rect(.563,.35,.023,0,.904));
  extrude(s,"#3c4c40",bezel,.221,.038,.009);
  box(s,"#b7c8a7",[0,.904,.219],[.574,.364,.024],.024,3);
  box(s,"#a9bd96",[0,.904,.235],[.532,.324,.008],.017,2);
  // LCD eyebrow-like source marks are physical dark segments within the window.
  for(const side of [-1,1]) {
    const x=side*.164;
    box(s,"#435843",[x,1.014,.244],[.075,.022,.003],.004,1);
    box(s,"#435843",[x+.012,1.03,.244],[.043,.016,.003],.004,1);
  }
  // The original reads 7.02; all characters are tiny raised geometry, no font/texture fetch.
  const segments:Record<string,number[]>={"7":[0,1,2],"0":[0,1,2,3,4,5],"2":[0,1,6,4,3]};
  const digits=[{glyph:"7",x:-.185},{glyph:"0",x:.012},{glyph:"2",x:.165}];
  for(const {glyph,x} of digits) {
    const cx=x,cy=.86,wide=.078,tall=.145,t=.011;
    const slots:[number,number,number,number][]=[
      [cx,cy+tall/2,wide,t],[cx+wide/2,cy+tall/4,t,tall/2-.011],[cx+wide/2,cy-tall/4,t,tall/2-.011],
      [cx,cy-tall/2,wide,t],[cx-wide/2,cy-tall/4,t,tall/2-.011],[cx-wide/2,cy+tall/4,t,tall/2-.011],[cx,cy,wide,t],
    ];
    for(const segment of segments[glyph]) {
      const [a,b,w,h]=slots[segment];box(s,"#293f34",[a,b,.246],[w,h,.004],.003,1);
    }
  }
  oval(s,"#293f34",[-.089,.79,.248],[.013,.013,.003],12,8);
  // Three rubber buttons and their shallow seats sit below the LCD.
  for(const [x,w] of [[-.196,.139],[0,.079],[.184,.139]]) {
    box(s,"#46592f",[x,.582,.215],[w+.025,.105,.018],.023,2);
    box(s,"#384a59",[x,.59,.233],[w,.072,.027],.018,3);
    box(s,"#6c7980",[x-.012,.609,.249],[w*.64,.012,.004],.004,1);
  }
  // Probe connection is a real angled gland and a full cylindrical electrode.
  const start=new THREE.Vector3(.425,.508,.019),end=new THREE.Vector3(.709,.079,.067);
  const axis=end.clone().sub(start).normalize(),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
  const part=(color:string,g:THREE.BufferGeometry,p:THREE.Vector3)=>s.surface(color,g.applyQuaternion(q).translate(p.x,p.y,p.z));
  part("#4b5c60",new THREE.LatheGeometry([[0,-.076],[.071,-.076],[.093,-.04],[.095,.021],[.075,.066],[0,.066]].map(p=>new THREE.Vector2(...p)),40),start);
  part("#798b83",new THREE.TorusGeometry(.081,.012,8,32).rotateX(Math.PI/2),start.clone().addScaledVector(axis,.04));
  const length=end.distanceTo(start),middle=start.clone().add(end).multiplyScalar(.5);
  part("#b7c7ba",new THREE.CylinderGeometry(.047,.051,length,32),middle);
  const front=new THREE.Vector3(0,0,1).applyQuaternion(q);
  const glintStart=start.clone().addScaledVector(axis,.079).addScaledVector(front,.047),glintEnd=end.clone().addScaledVector(axis,-.054).addScaledVector(front,.051);
  line(s,"#f2f3df",[glintStart.toArray() as P,glintEnd.toArray() as P],.009,26,8);
  for(let i=0;i<5;i++)part(i%2?"#879c89":"#e1e7cb",new THREE.TorusGeometry(.05,.004,5,24).rotateX(Math.PI/2),start.clone().lerp(end,.28+i*.13));
  oval(s,"#b5c9a6",end.toArray() as P,[.079,.079,.077],28,18);
  oval(s,"#e1edca",[end.x-.016,end.y+.015,end.z+.057],[.039,.048,.024],20,12);
  part("#77937e",new THREE.TorusGeometry(.059,.006,6,32).rotateX(Math.PI/2),end.clone().addScaledVector(axis,-.034));
  // Rear battery compartment, seal, screws and moulded certification lines.
  box(s,"#2f4034",[0,.68,-.201],[.629,.754,.023],.036,3);
  box(s,"#607941",[0,.682,-.218],[.582,.704,.014],.031,3);
  for(const x of [-.24,.24])for(const y of [.405,.958]) {
    oval(s,"#9b9e83",[x,y,-.231],[.017,.017,.005],12,8);
    s.box("#34463b",x,y,-.237,.022,.004,.003);
  }
  box(s,"#465939",[0,.678,-.231],[.38,.246,.007],.015,2);
  for(let i=0;i<6;i++)s.box("#9eac83",0,.768-i*.032,-.238,.291-(i%3)*.049,.005,.003);
  for(let i=0;i<5;i++)s.box("#283f32",0,.328+i*.022,-.232,.294,.008,.005);
  return s.finish();
}

/** Closed concave key top: softly dished crown, flat underside and solid edge walls. */
function keyCrown() {
  const positions:number[]=[],indices:number[]=[],nx=26,nz=20,layer=(nx+1)*(nz+1);
  for(let side=0;side<2;side++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++) {
    const u=i/nx*2-1,v=j/nz*2-1,x=.538*u*Math.sqrt(1-.14*v*v),z=.409*v*Math.sqrt(1-.14*u*u);
    positions.push(x,side===0?1.225-.055*(1-u*u)*(1-v*v):1.152,z);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++) {
    const a=j*(nx+1)+i,b=a+nx+1;
    indices.push(a,b,a+1,a+1,b,b+1,layer+a,layer+a+1,layer+b,layer+a+1,layer+b+1,layer+b);
  }
  const edge=(a:number,b:number)=>indices.push(a,b,layer+a,b,layer+b,layer+a);
  for(let i=0;i<nx;i++){edge(i,i+1);edge(nz*(nx+1)+i+1,nz*(nx+1)+i);}
  for(let j=0;j<nz;j++){edge((j+1)*(nx+1),j*(nx+1));edge(j*(nx+1)+nx,(j+1)*(nx+1)+nx);}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

/** #162: a thick hollow keycap shell, dished top, recessed luminous eyes and jointed feet. */
function keycap() {
  const s=new Sculpt({detail:"high"});
  const front=rect(1.032,.735,.037,0,.857);
  for(const x of [-.234,.234])front.holes.push(rect(.177,.225,.025,x,.804));
  extrude(s,"#696c70",front,.367,.047,.014);
  box(s,"#4d5358",[-.5,.858,0],[.063,.725,.786],.027,3);
  box(s,"#565c61",[.5,.858,0],[.063,.725,.786],.027,3);
  box(s,"#42494e",[0,.857,-.382],[.984,.721,.065],.03,3);
  s.surface("#94989b",keyCrown());
  // Soft top perimeter mouldings bridge the dish to the full front/back side walls.
  for(const z of [-.384,.399])box(s,z>0?"#b1b3b2":"#7b8285",[0,1.192,z],[.981,.048,.061],.018,3);
  for(const x of [-.508,.508])box(s,"#8d9495",[x,1.19,0],[.047,.048,.708],.017,3);
  const under=rect(1.016,.773,.035);under.holes.push(rect(.819,.585,.028));
  s.surface("#343b42",new THREE.ExtrudeGeometry(under,{depth:.045,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2,curveSegments:12}).rotateX(Math.PI/2).translate(0,.514,0));
  // Inner ribs and an open cross-shaped switch socket finish the underside.
  for(const x of [-.28,.28])box(s,"#535b60",[x,.809,0],[.035,.602,.608],.009,2);
  const socket=rect(.238,.238,.025);const cross=new THREE.Path();
  cross.moveTo(-.037,-.094);cross.lineTo(.037,-.094);cross.lineTo(.037,-.037);cross.lineTo(.094,-.037);
  cross.lineTo(.094,.037);cross.lineTo(.037,.037);cross.lineTo(.037,.094);cross.lineTo(-.037,.094);
  cross.lineTo(-.037,.037);cross.lineTo(-.094,.037);cross.lineTo(-.094,-.037);cross.lineTo(-.037,-.037);cross.closePath();socket.holes.push(cross);
  s.surface("#7c8387",new THREE.ExtrudeGeometry(socket,{depth:.284,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,curveSegments:8}).rotateX(Math.PI/2).translate(0,1.139,0));
  const emit=["#c031c8","#ed66f0","#ffd2ff"];
  for(const x of [-.234,.234]) {
    // Dark well is behind the real front-panel aperture, with a smaller bright lens.
    box(s,"#221f2c",[x,.804,.298],[.187,.236,.037],.025,3);
    oval(s,emit[0],[x,.804,.319],[.061,.091,.021],24,16);
    oval(s,emit[1],[x,.805,.34],[.043,.072,.012],24,16);
    oval(s,emit[2],[x-.005,.815,.351],[.025,.048,.006],20,12);
    line(s,"#85818b",[[x-.103,.711,.433],[x-.106,.82,.434],[x-.092,.918,.432]],.004,18,5);
  }
  // Jointed black stems and worn steel boots retain the simple two-legged source stance.
  for(const side of [-1,1]) {
    const x=side*.292;
    box(s,"#252d34",[x,.378,-.014],[.189,.253,.25],.023,3);
    box(s,"#424a50",[x,.337,.112],[.155,.179,.027],.014,2);
    box(s,"#30373d",[x,.184,.063],[.272,.184,.389],.028,3);
    box(s,"#65442d",[x,.111,.072],[.263,.035,.37],.01,2);
    for(let j=0;j<3;j++) {
      box(s,j===1?"#9a9d96":"#727a79",[x+(j-1)*.071,.168,.266],[.043,.057,.009],.006,1);
      s.box("#18232b",x+(j-1)*.071,.226,.263,.006,.031,.007);
    }
    oval(s,"#7e8380",[x,.384,.134],[.024,.024,.006],14,10);
  }
  // Fine mould seam, restrained wear and rear recessed nameplate survive rotation.
  for(const side of [-1,1])line(s,"#303b42",[[side*.538,.549,-.295],[side*.538,.824,-.295],[side*.538,1.131,-.295]],.004,26,5);
  for(let i=0;i<16;i++) {
    const x=-.435+i*.057,y=i%2?1.112:.555;
    box(s,i%3?"#909797":"#424e56",[x,y,.433],[.023+(i%3)*.008,.005,.003],.001,1);
  }
  box(s,"#252f37",[0,.838,-.421],[.536,.28,.012],.024,3);
  box(s,"#626d73",[0,.838,-.43],[.501,.247,.008],.019,2);
  for(let i=0;i<7;i++)s.box("#99a2a0",0,.926-i*.029,-.437,.39-(i%3)*.054,.005,.003);
  const geometry=s.finish(),colors=geometry.getAttribute("color"),weights=new Float32Array(colors.count),palette=emit.map(c=>new THREE.Color(c));
  for(let i=0;i<colors.count;i++)if(palette.some(c=>Math.abs(c.r-colors.getX(i))<1e-5&&Math.abs(c.g-colors.getY(i))<1e-5&&Math.abs(c.b-colors.getZ(i))<1e-5))weights[i]=.75;
  geometry.setAttribute("glowWeight",new THREE.BufferAttribute(weights,1));geometry.userData.glowSurface=true;
  return geometry;
}

export const SCULPTS_V_DEVICES:Record<string,()=>THREE.BufferGeometry>={mon_phmeter:phmeter,mon_keycap:keycap};
