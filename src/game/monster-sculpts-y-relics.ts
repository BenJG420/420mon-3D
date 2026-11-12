import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],radius:number,steps=24,sides=5) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,radius,sides,false));
}

// A chalk stick is a single continuous volume. Its fractured top and underside
// follow the same irregular perimeter; neither is a billboard over a cylinder.
function chalkPoint(angle:number,v:number,radial=1):P {
  const rough=.008*Math.sin(angle*7)+.005*Math.sin(angle*13+v*5)+.003*Math.sin(angle*23);
  const radius=(.231+.017*v+rough)*radial;
  const low=.297+.024*Math.sin(angle*7)+.018*Math.cos(angle*13);
  const high=1.461+.019*Math.sin(angle*9)+.027*Math.cos(angle*5);
  return [.046*v+Math.sin(angle)*radius,low+(high-low)*v,Math.cos(angle)*radius*.9];
}
function chalkShell() {
  const vertices:number[]=[],indices:number[]=[],rings=28,segments=72;
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++)vertices.push(...chalkPoint(i/segments*Math.PI*2,j/rings));
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++) {
    const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function chalkEnd(top:boolean) {
  const vertices:number[]=[],indices:number[]=[],segments=72,rings=4;
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++) {
    const a=i/segments*Math.PI*2,r=j/rings,[x,y,z]=chalkPoint(a,top?1:0,r);
    vertices.push(x,(top?1.472:.291)*(1-r)+y*r+(top?.01:-.006)*Math.sin(a*6)*r*(1-r),z);
  }
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++) {
    const a=j*(segments+1)+i,b=a+segments+1;
    if(top)indices.push(a,b,a+1,a+1,b,b+1);else indices.push(a,a+1,b,a+1,b+1,b);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

/** #179: the original broken white chalk stick, with oval eyes and trailing dust. */
function chalk() {
  const s=new Sculpt({detail:"high"});
  s.surface("#daccea",chalkShell());s.surface("#f7efff",chalkEnd(true));s.surface("#ad92c8",chalkEnd(false));
  // Fine wavy powder ridges cover all sides, while larger longitudinal fractures
  // preserve the pale source silhouette without painting sprite pixels on it.
  for(let strand=0;strand<32;strand++) {
    const a=strand*Math.PI/16,points:P[]=[];
    for(let j=0;j<=18;j++)points.push(chalkPoint(a+.012*Math.sin(j*.7+strand),.055+j*.049,1.006));
    cord(s,strand%4?"#eadff5":"#b9a2d4",points,strand%4?.002:.0032,28,5);
  }
  for(const [a,v0,length] of [[1.3,.59,.29],[3.1,.14,.53],[4.4,.63,.29],[5.1,.10,.26]]) {
    const points:P[]=[];
    for(let j=0;j<=12;j++)points.push(chalkPoint(a+.026*Math.sin(j*1.4),v0+length*j/12,1.012));
    cord(s,"#927bb2",points,.0035,24,5);
  }
  for(const top of [false,true]) {
    const points:P[]=[];for(let i=0;i<=72;i++)points.push(chalkPoint(i*Math.PI/36,top?1:0,1.001));
    cord(s,top?"#d4bfe9":"#f3e7ff",points,.0045,72,5);
  }
  // Raised mineral flakes lie tangent to the curved wall, also on the rear.
  for(let i=0;i<42;i++) {
    const a=i*2.399963,v=.08+((i*17)%37)/43,p=chalkPoint(a,v,1.015);
    const normal=new THREE.Vector3(Math.sin(a),0,Math.cos(a)),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
    s.surface(i%4?"#f0e4fa":"#b8a0cf",new THREE.SphereGeometry(1,8,6).scale(.007+(i%3)*.002,.014+(i%5)*.004,.0025).applyQuaternion(q).translate(...p));
  }
  // Large dark eyes sit outside the near curved surface, with pale chip rims.
  for(const side of [-1,1]) {
    const x=side*.118+.011,y=.583,z=.204;
    oval(s,"#a58bbf",[x,y,z],[.083,.121,.027],24,16);
    oval(s,"#fbf5ff",[x,y,z+.021],[.069,.108,.018],24,16);
    oval(s,"#21172d",[x,y-.003,z+.034],[.054,.089,.018],24,16);
    oval(s,"#51415f",[x+.014,y-.031,z+.046],[.027,.045,.005],16,10);
    oval(s,"#fffaff",[x-.021,y+.047,z+.049],[.018,.024,.006],14,10);
    oval(s,"#d9c9ec",[x+.022,y+.065,z+.047],[.007,.011,.004],10,8);
  }
  // The first source pose sheds a diagonal powder trail instead of a new base.
  for(let i=0;i<15;i++) {
    const t=i/14,spread=Math.sin(i*2.2)*.047;
    oval(s,i%3?"#e8d8f7":"#fff4ff",[-.045-.37*t+spread,.253-.239*t,.052+Math.cos(i*1.8)*.065],
      [.008+(1-t)*.008,.006+(1-t)*.007,.009+(1-t)*.007],8,6);
  }
  for(let i=0;i<9;i++) {
    const a=i*Math.PI*2/9,p=chalkPoint(a,0,1.005);
    oval(s,i%2?"#f6eaff":"#baa0d2",[p[0],p[1]-.009,p[2]],[.018,.022,.013],10,8);
  }
  return s.finish();
}

const cuffTilt=.52;
function cuffPart(s:Sculpt,color:string,geometry:THREE.BufferGeometry,center:P,scale=1) {
  s.surface(color,geometry.scale(scale,scale,scale).rotateX(cuffTilt).translate(...center));
}
function cuffPosition(local:P,center:P,scale=1):P {
  return new THREE.Vector3(...local).multiplyScalar(scale).applyAxisAngle(new THREE.Vector3(1,0,0),cuffTilt).add(new THREE.Vector3(...center)).toArray() as P;
}
/** Closed annular section: outer wall, bevels, broad upper band and inward wall. */
function cuffRing(s:Sculpt,center:P,scale:number) {
  const profile:P[]=[[.445,-.115,0],[.475,-.09,0],[.485,-.045,0],[.485,.06,0],[.468,.108,0],[.43,.13,0],
    [.325,.13,0],[.287,.105,0],[.278,.06,0],[.278,-.06,0],[.298,-.108,0],[.335,-.124,0],[.445,-.115,0]];
  cuffPart(s,"#a99ebc",new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),64),center,scale);
  // Recessed violet inner enamel follows the bore; the whole centre stays open.
  const lining=[[.276,-.05],[.276,.05],[.283,.099],[.29,.103],[.287,.047],[.287,-.053],[.276,-.05]];
  cuffPart(s,"#bf299d",new THREE.LatheGeometry(lining.reverse().map(p=>new THREE.Vector2(...p as [number,number])),64),center,scale);
  for(const [r,y] of [[.455,.109],[.309,.12]])cuffPart(s,"#e0d5ee",new THREE.TorusGeometry(r,.006,5,64).rotateX(Math.PI/2).translate(0,y,0),center,scale);
  cuffPart(s,"#736580",new THREE.TorusGeometry(.477,.006,5,64).rotateX(Math.PI/2).translate(0,-.055,0),center,scale);
  // Radial fastening pins and their dark sockets articulate the thick metal band.
  const count=scale===1?12:8;
  for(let i=0;i<count;i++) {
    const a=i*Math.PI*2/count,r=.386,x=Math.sin(a)*r,z=Math.cos(a)*r;
    cuffPart(s,"#64586f",new THREE.SphereGeometry(1,10,6).scale(.021,.007,.021).translate(x,.133,z),center,scale);
    cuffPart(s,"#d5c9e5",new THREE.SphereGeometry(1,8,6).scale(.014,.005,.014).translate(x,.14,z),center,scale);
    cuffPart(s,"#8d7b9f",new THREE.BoxGeometry(.018,.002,.003).rotateY(a).translate(x,.145,z),center,scale);
  }
  for(let i=0;i<12;i++) {
    const a=.08+i*Math.PI/6,points:P[]=[];
    for(let j=0;j<5;j++){const r=.338+j*.022;points.push([Math.sin(a+.008*Math.sin(j+i))*r,.135,Math.cos(a)*r]);}
    const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),10,.0025,5,false);
    cuffPart(s,i%3?"#c8bbd9":"#776784",g,center,scale);
  }
  // Small cast imperfections on the outer circumference remain shallow relief.
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6,y=-.025+Math.sin(i*1.3)*.048,n=new THREE.Vector3(Math.sin(a),0,Math.cos(a));
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n);
    cuffPart(s,i%3?"#baaccd":"#81708e",new THREE.SphereGeometry(1,8,6).scale(.008,.018,.0025).applyQuaternion(q).translate(n.x*.486,y,n.z*.486),center,scale);
  }
}

/** #180: two genuine open cuff castings and an interlocking chain, never discs. */
function cuff() {
  const s=new Sculpt({detail:"high"}),front:P=[-.22,.427,.091],rear:P=[.558,.841,-.26];
  cuffRing(s,front,1);cuffRing(s,rear,.64);
  // Small feet retain the source's lavender pebbles; no invented humanoid body.
  for(const p of [[-.62,.112,.297],[-.02,.105,.444],[-.55,.195,-.134],[.216,.255,.151]] as P[]) {
    oval(s,"#a28ab8",p,[.068,.086,.071],18,12);
    oval(s,"#d6c1e9",[p[0]-.011,p[1]+.015,p[2]+.055],[.035,.042,.013],12,8);
  }
  // Angry eye lenses are tangent to the foreground rim, beyond its outer shell.
  for(const side of [-1,1]) {
    const a=side*.42,local:P=[Math.sin(a)*.485,.005,Math.cos(a)*.485];
    const p=cuffPosition(local,front),normal=new THREE.Vector3(Math.sin(a),0,Math.cos(a)).applyAxisAngle(new THREE.Vector3(1,0,0),cuffTilt);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
    const eye=(color:string,size:P,offset:number,w:number,h:number)=>{
      const at=new THREE.Vector3(...p).addScaledVector(normal,offset);
      s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).rotateZ(side*-.31).applyQuaternion(q).translate(at.x,at.y,at.z));
    };
    eye("#6a547a",[.092,.057,.015],.002,24,14);
    eye("#24172f",[.066,.043,.012],.018,24,14);
    eye("#68427c",[.037,.022,.004],.03,16,10);
    const glint=new THREE.Vector3(-.021,.012,.034).applyQuaternion(q).add(new THREE.Vector3(...p));
    oval(s,"#eee0fc",glint.toArray() as P,[.009,.012,.005],12,8);
  }
  // Six truly interlocking oval links join the hinge lugs behind the main bore.
  const chain:P[]=[[-.533,.691,-.199],[-.408,.802,-.229],[-.268,.902,-.254],[-.106,.971,-.276],[.065,1.001,-.296],[.221,.967,-.304]];
  for(let i=0;i<chain.length;i++) {
    const p=chain[i],q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.16,i%2?1.06:.12,-.6+i*.14));
    s.surface(i%2?"#8a7b9b":"#b4a7c9",new THREE.TorusGeometry(.061,.017,8,28).scale(1.35,.78,1).applyQuaternion(q).translate(...p));
    s.surface("#dfd0eb",new THREE.TorusGeometry(.061,.003,5,20).scale(1.35,.78,1).translate(0,0,.015).applyQuaternion(q).translate(...p));
  }
  for(const [p,rotation] of [[[-.541,.641,-.204],-.4],[[.271,.911,-.29],.37]] as [P,number][]) {
    s.surface("#8f809f",new RoundedBoxGeometry(.143,.091,.122,2,.025).rotateZ(rotation).translate(...p));
    oval(s,"#ded0eb",[p[0],p[1],p[2]+.069],[.027,.027,.009],14,10);
  }
  // The small rear cuff has a raised lock barrel and a real keyhole inset.
  const lock=cuffPosition([-.335,.175,.142],rear,.64);
  oval(s,"#cbbbdc",lock,[.065,.045,.051],20,12);
  oval(s,"#52445e",[lock[0],lock[1]+.006,lock[2]+.046],[.012,.012,.004],12,8);
  s.box("#52445e",lock[0],lock[1]-.008,lock[2]+.049,.008,.018,.004);
  return s.finish();
}

export const SCULPTS_Y_RELICS:Record<string,()=>THREE.BufferGeometry>={mon_chalk:chalk,mon_cuff:cuff};
