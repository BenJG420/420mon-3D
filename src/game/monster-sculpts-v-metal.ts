import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],radius:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,radius,sides,false));
}
function turn(s:Sculpt,color:string,profile:[number,number][],p:P=[0,0,0],segments=48) {
  s.surface(color,new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),segments).translate(...p));
}
function box(s:Sculpt,color:string,p:P,size:P,r=.012,segments=2) {
  s.surface(color,new RoundedBoxGeometry(...size,segments,r).translate(...p));
}
function screw(s:Sculpt,p:P,r=.02,back=false) {
  const direction=back?-1:1;
  oval(s,"#555348",p,[r*1.22,r*1.22,.006],12,8);
  oval(s,"#b9b59c",[p[0],p[1],p[2]+direction*.007],[r,r,.007],12,8);
  s.box("#49483d",p[0],p[1],p[2]+direction*.015,r*1.3,.004,.003,0,0,.32);
}
function hex(s:Sculpt,color:string,r:number,h:number,y:number) {
  const shape=new THREE.Shape();
  for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*r,z=Math.sin(a)*r;i?shape.lineTo(x,z):shape.moveTo(x,z);}
  shape.closePath();
  s.surface(color,new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSize:.018,
    bevelThickness:.014,bevelSegments:3}).rotateX(-Math.PI/2).translate(0,y-h/2,0));
}

/** #157 — a worn two-hex bolt creature with a real continuous screw thread. */
function bolt() {
  const s=new Sculpt({detail:"high"}),rust="#94522f",bright="#bf946b";
  // Separate upper head, eye neck and lower collar leave the source face visible.
  hex(s,rust,.432,.207,1.378);
  hex(s,"#b37b4c",.42,.021,1.494);
  hex(s,"#8f4c2a",.443,.218,.909);
  hex(s,"#b17e50",.431,.019,1.027);
  turn(s,"#77432b",[[0,1.003],[.259,1.003],[.285,1.028],[.288,1.27],[.273,1.298],[0,1.298]],[0,0,0],56);
  turn(s,"#9a704b",[[0,.193],[.179,.193],[.208,.22],[.224,.283],[.225,.805],[0,.805]],[0,0,0],56);
  // Six full screw turns are geometry wrapped around the actual cylindrical core.
  const helix:P[]=[];
  for(let i=0;i<=240;i++) {
    const t=i/240,a=t*Math.PI*12.6;
    helix.push([Math.sin(a)*.233,.24+t*.53,Math.cos(a)*.233]);
  }
  cord(s,"#b19470",helix,.025,240,8);
  cord(s,"#d0b491",helix.map(([x,y,z])=>[x*1.034,y+.008,z*1.034]),.005,240,5);
  // Rounded ends bury the start/end into the shaft instead of leaving open tube caps.
  for(const p of [helix[0],helix[helix.length-1]])oval(s,"#b19470",p,[.025,.025,.025],12,8);
  s.surface("#65513c",new THREE.TorusGeometry(.212,.011,6,40).rotateX(Math.PI/2).translate(0,.209,0));
  for(const side of [-1,1]) {
    const x=side*.139,y=1.161;
    oval(s,"#49382a",[x,y,.247],[.081,.07,.025],24,16);
    oval(s,"#dcd4b4",[x,y,.272],[.059,.049,.015],24,14);
    oval(s,"#292b22",[x+side*.006,y+.001,.286],[.027,.032,.009],20,12);
    oval(s,"#faf3d5",[x-side*.012,y+.017,.294],[.011,.013,.003],12,8);
    cord(s,"#b17843",[[x-side*.073,y+.043,.255],[x,y+.071,.261],[x+side*.06,y+.055,.255]],.01,18,6);
    // Jointed short arms follow the sloping source pose, with separate fingers.
    oval(s,"#71412a",[side*.345,.757,.015],[.076,.081,.083],18,12);
    cord(s,"#8c4d2b",[[side*.345,.766,.024],[side*.427,.632,.046],[side*.456,.486,.07]],.047,24,8);
    oval(s,"#a26136",[side*.436,.585,.055],[.056,.057,.054],16,10);
    oval(s,"#9e5b32",[side*.46,.461,.08],[.058,.063,.05],18,12);
    for(let j=0;j<3;j++)cord(s,j===0?"#ba7442":"#79432b",[[side*(.424+j*.025),.466,.104],
      [side*(.426+j*.027),.421,.115],[side*(.442+j*.023),.411,.111]],.012,10,6);
    // Bent metal ankles and rounded capped boots retain the source stance.
    s.rod("#735035",[side*.145,.24,.007],[side*.183,.113,.024],.052);
    oval(s,"#8a613d",[side*.198,.079,.059],[.108,.054,.125],24,14);
    oval(s,"#ad8558",[side*.204,.098,.13],[.079,.025,.057],18,10);
    for(let j=0;j<3;j++)s.box("#55412f",side*.198-.047+j*.047,.062,.175,.009,.026,.005);
  }
  // Thin polished lines follow every hex edge, including the rear corners.
  for(const [r,y] of [[.435,1.489],[.438,1.267],[.444,1.021],[.443,.798]])for(let i=0;i<6;i++) {
    const a=i*Math.PI/3,b=(i+1)*Math.PI/3;
    s.rod(bright,[Math.cos(a)*r,y,Math.sin(a)*r],[Math.cos(b)*r,y,Math.sin(b)*r],.005);
  }
  // Irregular rust on the actual flat top and six sides, avoiding the eye neck.
  for(const y of [1.51,1.046])for(let i=0;i<20;i++) {
    const a=i*2.399963,r=.045+.3*Math.sqrt((i+.5)/20);
    oval(s,i%3?"#a56236":"#d4bc96",[Math.cos(a)*r,y,Math.sin(a)*r],
      [.021+(i%4)*.012,.003,.017+(i%3)*.011],10,6);
  }
  for(const y of [1.378,.909])for(let face=0;face<6;face++)for(let i=0;i<3;i++) {
    const a=(face+.5)*Math.PI/3,n=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
    const tangent=new THREE.Vector3(-Math.sin(a),0,Math.cos(a));
    const p=n.clone().multiplyScalar(y>1?.376:.386).addScaledVector(tangent,(i-1)*.12);p.y=y+(i%2?-.035:.035);
    const g=new THREE.SphereGeometry(1,8,6).scale(.027+(i%2)*.013,.037,.0028)
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n)).translate(p.x,p.y,p.z);
    s.surface(i%2?"#bcb194":"#77452e",g);
  }
  // A recessed rear maker's stamp and subtle shaft scuffs finish the turned view.
  box(s,"#5f4632",[0,1.161,-.289],[.17,.075,.008],.009,2);
  for(let i=0;i<5;i++)s.box("#ad8e62",-.062+i*.031,1.163,-.295,.009,.041,.003);
  return s.finish();
}

/** #158 — squat oxidized sump tank, a corrugated hose and a recessed side valve. */
function sumpump() {
  const s=new Sculpt({detail:"high"});
  turn(s,"#8c8970",[[0,.22],[.298,.22],[.356,.246],[.377,.296],[.37,.426],[.355,.69],
    [.362,.873],[.376,.922],[.358,.973],[.303,1.036],[.215,1.085],[.117,1.103],[0,1.103]],[0,0,0],64);
  turn(s,"#69694f",[[.316,.228],[.382,.228],[.397,.255],[.392,.305],[.372,.326],[.321,.311],[.316,.228]],[0,0,0],56);
  turn(s,"#b5ad87",[[.342,.873],[.376,.873],[.386,.891],[.38,.912],[.361,.919],[.342,.9],[.342,.873]],[0,0,0],56);
  // Open upper throat and dark recessed bottom are genuinely separate surfaces.
  turn(s,"#665f4b",[[.067,1.072],[.107,1.072],[.121,1.095],[.117,1.176],[.105,1.195],[.069,1.193],[.067,1.072]],[0,0,0],48);
  turn(s,"#b0aa91",[[.068,1.176],[.115,1.176],[.127,1.187],[.125,1.202],[.107,1.211],[.066,1.204],[.068,1.176]],[0,0,0],48);
  turn(s,"#2f342e",[[0,1.113],[.065,1.113],[.066,1.12],[0,1.12]],[0,0,0],32);
  // Pressed seam lines and four ribbed feet on the original squat silhouette.
  for(const side of [-1,1]) {
    cord(s,"#b2a781",[[side*.31,.348,.193],[side*.304,.64,.186],[side*.311,.867,.173]],.007,28,6);
    for(const back of [-1,1]) {
      box(s,"#65614c",[side*.276,.135,back*.196],[.19,.114,.19],.018,2);
      box(s,"#8c8566",[side*.28,.181,back*.196],[.157,.035,.171],.009,1);
      for(let j=0;j<3;j++)s.box("#494c39",side*.276-.052+j*.052,.117,back*.292,.009,.059,.005);
    }
  }
  for(const side of [-1,1]) {
    const x=side*.174;
    oval(s,"#595945",[x,.661,.309],[.104,.117,.033],24,14);
    oval(s,"#d1c8a5",[x,.661,.339],[.086,.098,.025],24,14);
    oval(s,"#30382d",[x,.662,.362],[.053,.065,.016],20,12);
    oval(s,"#a29564",[x+.008,.644,.376],[.028,.028,.004],12,8);
    oval(s,"#fff6cf",[x-.015,.687,.378],[.017,.024,.004],12,8);
  }
  // Green algae strands drip from the lower rim with rounded weighted tips.
  for(let i=0;i<5;i++) {
    const x=-.273+i*.125,y=.124+(i%3)*.021;
    cord(s,i%2?"#526e21":"#789037",[[x,.302,.285],[x+.008,.224,.297],[x-.006,y,.301]],.013+(i%2)*.003,20,6);
    oval(s,"#607b27",[x-.006,y-.009,.301],[.02,.034,.018],12,8);
    cord(s,"#a0ad55",[[x-.004,.28,.301],[x+.002,.219,.311]],.003,10,5);
  }
  // A true transported tube has 22 moulded corrugations along its entire curve.
  const hosePoints:P[]=[[.343,.852,.001],[.52,.8,.015],[.702,.635,.038],[.731,.399,.071],
    [.637,.229,.124],[.473,.26,.184],[.361,.413,.224]];
  const path=new THREE.CatmullRomCurve3(hosePoints.map(p=>new THREE.Vector3(...p))),steps=176,sides=10;
  const hose=new THREE.TubeGeometry(path,steps,1,sides,false),positions=hose.getAttribute("position");
  for(let ring=0;ring<=steps;ring++) {
    const t=ring/steps,c=path.getPointAt(t),r=.061+.011*(.5+.5*Math.cos(t*Math.PI*44));
    for(let j=0;j<=sides;j++) {
      const k=ring*(sides+1)+j,p=new THREE.Vector3().fromBufferAttribute(positions,k).sub(c).multiplyScalar(r).add(c);positions.setXYZ(k,p.x,p.y,p.z);
    }
  }
  hose.computeVertexNormals();s.surface("#5c5c50",hose);
  for(let i=0;i<22;i++) {
    const t=(i+.5)/22,c=path.getPointAt(t),axis=path.getTangentAt(t),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),axis);
    s.surface(i%3?"#93907b":"#aaa38b",new THREE.TorusGeometry(.071,.004,4,12).applyQuaternion(q).translate(c.x,c.y,c.z));
  }
  // Tank flange and lower inlet have rolled lips around recessed actual throats.
  for(const [x,y,z,r] of [[.342,.853,.001,.089],[.347,.415,.245,.101]]) {
    oval(s,"#585d49",[x,y,z],[r*1.2,r*1.19,.05],16,10);
    s.surface("#b3ac8c",new THREE.TorusGeometry(r,.015,8,32).translate(x,y,z+.049));
    oval(s,"#363e35",[x,y,z+.044],[r*.78,r*.78,.016],16,10);
  }
  // The source's wine-red control wheel is visible inside the hose loop.
  const vx=.526,vy=.49,vz=.008;
  s.rod("#655943",[.336,vy,-.071],[vx,vy,-.071],.034);
  s.surface("#51283e",new THREE.TorusGeometry(.091,.022,8,36).translate(vx,vy,vz));
  for(let i=0;i<5;i++) {
    const a=i*Math.PI*2/5;s.rod("#8c435d",[vx,vy,vz],[vx+Math.cos(a)*.08,vy+Math.sin(a)*.08,vz],.015);
  }
  oval(s,"#b36c78",[vx,vy,.017],[.042,.042,.016],20,12);
  oval(s,"#dac0a1",[vx,vy,.035],[.022,.022,.006],14,10);
  oval(s,"#433e31",[vx,vy,.042],[.009,.009,.003],10,6);
  // Rounded oxidized flakes follow the cylindrical wall and dome all around.
  for(let i=0;i<52;i++) {
    const y=.355+(i%10)*.057,a=i*2.399963,r=.368-(y-.355)*.02;
    const x=Math.sin(a)*r,z=Math.cos(a)*r;
    if(z>.23&&Math.abs(y-.661)<.134&&Math.abs(Math.abs(x)-.174)<.12)continue;
    const n=new THREE.Vector3(Math.sin(a),0,Math.cos(a)),g=new THREE.SphereGeometry(1,8,4)
      .scale(.014+(i%3)*.008,.021+(i%4)*.006,.003).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n)).translate(x,y,z);
    s.surface(i%3?"#a9a48a":"#666a4d",g);
  }
  for(let i=0;i<16;i++) {
    const a=i*2.399963,r=.14+(i%4)*.052,y=1.105-r*.32;
    oval(s,i%3?"#bbb390":"#777855",[Math.sin(a)*r,y,Math.cos(a)*r],[.018,.004,.027],8,4);
  }
  // Rear access plate and slotted screws are part of the full rotated sculpture.
  box(s,"#676b58",[0,.572,-.362],[.225,.229,.014],.025,3);
  for(const x of [-.077,.077])for(const y of [.505,.639])screw(s,[x,y,-.371],.014,true);
  for(let i=0;i<6;i++)s.box("#c1b897",-.071+i*.028,.574,-.375,.007,.079,.003);
  return s.finish();
}

export const SCULPTS_V_METAL:Record<string,()=>THREE.BufferGeometry>={mon_bolt:bolt,mon_sumpump:sumpump};
