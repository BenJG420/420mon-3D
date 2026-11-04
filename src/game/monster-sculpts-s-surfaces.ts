import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=8) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function turn(s:Sculpt,color:string,profile:[number,number][],p:P=[0,0,0],segments=48) {
  s.surface(color,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),segments).translate(...p));
}

/** A softly tapered, closed bristle using the transported frame of a curved tube. */
function bristle(s:Sculpt,color:string,points:P[],radius:number,steps=14) {
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const tube=new THREE.TubeGeometry(path,steps,1,6,false),positions=tube.getAttribute("position");
  for(let ring=0;ring<=steps;ring++) {
    const t=ring/steps,c=path.getPointAt(t),r=radius*(.95-.73*t);
    for(let j=0;j<=6;j++) {
      const index=ring*7+j,p=new THREE.Vector3().fromBufferAttribute(positions,index).sub(c).multiplyScalar(r).add(c);
      positions.setXYZ(index,p.x,p.y,p.z);
    }
  }
  tube.computeVertexNormals();s.surface(color,tube);
  // Tiny rounded ends are sufficient at this scale; the hidden root stays inside the core.
  const end=points[points.length-1];oval(s,color,end,[radius*.23,radius*.23,radius*.23],6,4);
}

/** #140 — flared flowing cream bristles, shiny eyes and a long teal hanging handle. */
function loobrush() {
  const s=new Sculpt({detail:"high"});
  const cream=["#d7c8a3","#e9ddbf","#c4ae83","#f2e7ca","#bc9e70","#dfcda7"];
  // A dark compact root supports the individually curved bunches, including the back.
  oval(s,"#a38a62",[0,.432,-.012],[.294,.354,.262],28,18);
  oval(s,"#c4b18d",[0,.539,-.019],[.246,.271,.23],24,16);
  for(let layer=0;layer<4;layer++)for(let strand=0;strand<22;strand++) {
    const a=strand*Math.PI*2/22+layer*.17,t=layer/3;
    const startRadius=.048+.018*layer,endRadius=.317+.045*layer;
    const endY=.093+.049*Math.sin(strand*1.71+layer*.83)+.037*(3-layer);
    const bend=.06*Math.sin(strand*2.4+layer);
    const points:P[]=[
      [Math.sin(a)*startRadius,.797+.025*Math.sin(strand*1.4),Math.cos(a)*startRadius*.88],
      [Math.sin(a+bend)*(.137+t*.036),.697,Math.cos(a+bend)*(.128+t*.033)],
      [Math.sin(a-bend)*(.243+t*.043),.468,Math.cos(a-bend)*(.21+t*.048)],
      [Math.sin(a+bend)*endRadius,endY,Math.cos(a+bend)*endRadius*.78],
    ];
    // The prominent source eyes stay clear: front bristles curl around the sockets.
    if(Math.cos(a)>.58) {
      const p=points[2];
      for(const eyeX of [-.125,.125])if(Math.abs(p[0]-eyeX)<.083) {
        p[0]=eyeX+(p[0]<eyeX?-.096:.096);p[2]-=.028;
      }
    }
    bristle(s,cream[(strand+layer*2)%cream.length],points,.0115+(strand%3)*.002,12);
  }
  // Sparse shorter flyaway tufts at the crown keep the messy outline of the original.
  for(let i=0;i<14;i++) {
    const a=i*Math.PI/7,side=Math.sin(a),depth=Math.cos(a);
    bristle(s,i%2?"#f1e5c7":"#c4ae83",[[side*.05,.79,depth*.05],
      [side*.14,.879+(i%3)*.021,depth*.117],[side*.218,.833+(i%2)*.044,depth*.157]],.008,10);
  }
  for(const side of [-1,1]) {
    const x=side*.125;
    oval(s,"#685d48",[x,.394,.279],[.069,.089,.026],20,12);
    oval(s,"#171922",[x,.394,.301],[.055,.074,.022],24,16);
    oval(s,"#403b3b",[x+.007,.375,.321],[.035,.032,.006],16,10);
    oval(s,"#fff6dd",[x-.014,.421,.323],[.018,.024,.006],16,10);
    oval(s,"#d6d2c5",[x+.022,.375,.326],[.008,.01,.003],10,6);
    cord(s,"#e8d9b8",[[x-.056,.427,.301],[x-.041,.475,.288],[x+.025,.483,.28]],.008,16,6);
  }
  // Teal socket/collar joins a slightly leaning solid handle with an open eyelet.
  turn(s,"#145d69",[[0,.748],[.061,.748],[.085,.764],[.086,.823],[.064,.854],[0,.854]], [0,0,0],40);
  s.torus("#458c93",0,.809,0,.081,.008,Math.PI/2);
  const handle:P[]=[[.005,.833,-.009],[.059,1.075,-.016],[.12,1.313,-.02],[.181,1.568,-.022]];
  cord(s,"#096d7b",handle,.027,44,10);
  cord(s,"#42a7ae",handle.map(([x,y,z])=>[x-.013,y,z+.021]),.006,44,6);
  for(let i=0;i<7;i++) {
    const y=1.035+i*.071,x=.049+i*.018;
    s.surface("#0d5669",new THREE.TorusGeometry(.027,.004,6,16).rotateX(Math.PI/2).rotateZ(-.24).translate(x,y,-.018));
  }
  oval(s,"#105866",[.184,1.574,-.022],[.033,.034,.029],16,10);
  s.surface("#267f8d",new THREE.TorusGeometry(1,.22,8,32).scale(.036,.057,.027).rotateZ(-.23).translate(.2,1.639,-.022));
  s.surface("#4aa6ad",new THREE.TorusGeometry(1,.07,6,24).scale(.036,.057,.027).rotateZ(-.23).translate(.2,1.639,.002));
  return s.finish();
}

const KNOB_CENTER=new THREE.Vector3(0,.815,0),KNOB_SIZE=new THREE.Vector3(.49,.515,.39);
function eyeHole(x:number,y:number,z:number,margin=1) {
  return z>.17&&[-.175,.175].some(cx=>((x-cx)/(.098*margin))**2+((y-.78)/(.117*margin))**2<1);
}
function knobFront(x:number,y:number) {
  return .39*Math.sqrt(Math.max(.015,1-(x/.49)**2-((y-.815)/.515)**2));
}

/** #143 — a worn round brass knob, deeply open eye sockets and a turned pedestal. */
function doorknob() {
  const s=new Sculpt({detail:"high"});
  const body=new THREE.SphereGeometry(1,80,44).scale(.49,.515,.39).translate(0,.815,0);
  const positions=body.getAttribute("position"),original=body.getIndex()!,indices:number[]=[];
  for(let i=0;i<original.count;i+=3) {
    const a=original.getX(i),b=original.getX(i+1),c=original.getX(i+2);
    const x=(positions.getX(a)+positions.getX(b)+positions.getX(c))/3;
    const y=(positions.getY(a)+positions.getY(b)+positions.getY(c))/3;
    const z=(positions.getZ(a)+positions.getZ(b)+positions.getZ(c))/3;
    if(!eyeHole(x,y,z))indices.push(a,b,c);
  }
  body.setIndex(indices);s.surface("#b48a2f",body);
  for(const cx of [-.175,.175]) {
    // The socket wall runs backwards from the actual cut-out edge to a small
    // dark interior. Its winding faces into the cavity and toward the viewer.
    const points:number[]=[],faces:number[]=[],steps=40,rings=4;
    for(let ring=0;ring<=rings;ring++)for(let j=0;j<=steps;j++) {
      const t=ring/rings,a=j/steps*Math.PI*2,rx=.104-t*.022,ry=.124-t*.021;
      const x=cx+Math.cos(a)*rx,y=.78+Math.sin(a)*ry;
      points.push(x,y,knobFront(x,y)*(1-t)+.227*t);
    }
    for(let i=0;i<rings;i++)for(let j=0;j<steps;j++) {
      const a=i*(steps+1)+j,b=a+steps+1;faces.push(a,a+1,b,a+1,b+1,b);
    }
    const wall=new THREE.BufferGeometry();wall.setAttribute("position",new THREE.Float32BufferAttribute(points,3));wall.setIndex(faces);wall.computeVertexNormals();s.surface("#71501e",wall);
    oval(s,"#4b2d0f",[cx,.78,.216],[.084,.106,.025],24,16);
    oval(s,"#362008",[cx,.78,.236],[.069,.088,.009],20,12);
    const lip:P[]=[];for(let j=0;j<=40;j++) {
      const a=j/40*Math.PI*2,x=cx+Math.cos(a)*.105,y=.78+Math.sin(a)*.125;
      lip.push([x,y,knobFront(x,y)+.004]);
    }
    cord(s,"#d1a44a",lip,.008,40,8);
  }
  // Fine irregular cast wear sits tangent to the full sphere, including its back.
  for(let i=0;i<56;i++) {
    const y=1-2*(i+.5)/56,r=Math.sqrt(1-y*y),a=i*2.399963;
    const unit=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
    const point=unit.clone().multiply(KNOB_SIZE).add(KNOB_CENTER);
    if(eyeHole(point.x,point.y,point.z,1.55))continue;
    const normal=unit.clone().divide(KNOB_SIZE).normalize();
    const patch=new THREE.SphereGeometry(1,10,6).scale(.013+(i%3)*.007,.012+(i%4)*.005,.0027)
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal)).translate(point.x,point.y,point.z);
    s.surface(i%4===0?"#876629":i%3?"#cba043":"#e6bd61",patch);
  }
  // A shallow crown and concentric pedestal castings retain the original silhouette.
  turn(s,"#c5a04f",[[0,1.294],[.112,1.294],[.13,1.308],[.123,1.33],[0,1.33]], [0,0,0],48);
  turn(s,"#71521c",[[0,.214],[.147,.214],[.18,.241],[.182,.307],[.151,.368],[0,.379]], [0,0,0],48);
  turn(s,"#b68d36",[[0,.079],[.256,.079],[.32,.103],[.354,.139],[.351,.176],[.315,.201],
    [.246,.215],[.182,.211],[.155,.239],[0,.242]], [0,0,0],64);
  turn(s,"#d5ac55",[[.254,.181],[.319,.181],[.339,.192],[.322,.209],[.275,.217],[.254,.203],[.254,.181]], [0,0,0],48);
  s.torus("#71541e",0,.122,0,.339,.007,Math.PI/2);
  // Four small screws and tooled arcs finish the pedestal without changing its footprint.
  for(let i=0;i<4;i++) {
    const a=Math.PI/4+i*Math.PI/2,x=Math.sin(a)*.282,z=Math.cos(a)*.282;
    turn(s,"#8a6525",[[0,0],[.023,0],[.028,.007],[.022,.017],[0,.019]],[x,.201,z],16);
    s.rod("#e0b96b",[x-.015,.221,z],[x+.015,.221,z],.0028);
  }
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6,pts:P[]=[];
    for(let j=0;j<5;j++){const t=a+j*.025;pts.push([Math.sin(t)*.338,.161+.005*Math.sin(j),Math.cos(t)*.338]);}
    cord(s,i%2?"#e2b865":"#8d6b29",pts,.004,8,6);
  }
  // Rear spindle cover and slotted fasteners make rotation reveal a finished object.
  s.surface("#896726",new THREE.TorusGeometry(.12,.01,8,40).translate(0,.73,-.374));
  oval(s,"#a17c2b",[0,.73,-.383],[.108,.108,.018],24,16);
  for(const x of [-.055,.055]) {
    oval(s,"#d9b368",[x,.73,-.402],[.017,.017,.006],12,8);
    s.box("#72511d",x,.73,-.408,.021,.004,.003);
  }
  return s.finish();
}

export const SCULPTS_S_SURFACES:Record<string,()=>THREE.BufferGeometry>={mon_loobrush:loobrush,mon_doorknob:doorknob};
