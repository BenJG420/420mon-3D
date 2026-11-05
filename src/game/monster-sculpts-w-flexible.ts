import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6,closed=false) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),steps,r,sides,closed));
}
function turn(s:Sculpt,color:string,profile:[number,number][],segments=64) {
  s.surface(color,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),segments));
}
function plate(s:Sculpt,color:string,points:[number,number][],z:number,depth=.012) {
  s.surface(color,new THREE.ExtrudeGeometry(new THREE.Shape(points.map(p=>new THREE.Vector2(...p))),
    {depth,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2}).translate(0,0,z));
}

/** #166: a complete hanging leather bag with stitched panels and genuinely open chain links. */
function heavybag() {
  const s=new Sculpt({detail:"high"});
  const profile:[number,number][]=[[0,.127],[.192,.127],[.264,.143],[.301,.191],[.315,.27],
    [.319,.462],[.321,.756],[.318,1.025],[.309,1.154],[.282,1.201],[.219,1.225],[0,1.23]];
  turn(s,"#a82026",profile,80);
  turn(s,"#ce2930",[[0,1.193],[.217,1.193],[.278,1.211],[.286,1.225],[.247,1.244],[.174,1.253],[0,1.254]],64);
  turn(s,"#5f2125",[[.2,.126],[.272,.126],[.305,.15],[.315,.184],[.302,.213],[.273,.203],[.2,.17],[.2,.126]],48);
  s.surface("#dc4d46",new THREE.TorusGeometry(.282,.011,8,48).rotateX(Math.PI/2).translate(0,1.213,0));
  s.surface("#e14b44",new THREE.TorusGeometry(.299,.007,6,48).rotateX(Math.PI/2).translate(0,.221,0));
  // Six fully wrapped panel seams follow the real curved sides and back.
  for(let seam=0;seam<6;seam++) {
    const a=seam*Math.PI/3+.49,points:P[]=[];
    for(let j=0;j<=20;j++) {
      const t=j/20,y=.231+t*.925,r=.316+.005*Math.sin(t*Math.PI),angle=a+.018*Math.sin(t*8);
      points.push([Math.sin(angle)*r,y,Math.cos(angle)*r]);
    }
    cord(s,"#681e26",points,.008,32,6);
    cord(s,"#d9473c",points.map(([x,y,z])=>[x*1.01,y,z*1.01]),.003,32,5);
    for(let stitch=0;stitch<15;stitch++) {
      const y=.258+stitch*.059,r=.321,da=.033;
      cord(s,"#c17860",[[Math.sin(a-da)*r,y-.007,Math.cos(a-da)*r],
        [Math.sin(a+da)*r,y+.007,Math.cos(a+da)*r]],.0024,2,5);
    }
  }
  // Raised angry enamel-like eyes are in front of the round leather body.
  for(const side of [-1,1]) {
    const mirror=(points:[number,number][])=>points.map(([x,y]):[number,number]=>[x*side,y]);
    plate(s,"#321c20",mirror([[.025,.879],[.094,.77],[.181,.751],[.241,.854],[.15,.811]]),.292,.018);
    plate(s,"#e7ce91",mirror([[.054,.854],[.103,.792],[.17,.776],[.21,.835],[.146,.81]]),.315,.013);
    oval(s,"#231b1b",[side*.133,.811,.34],[.025,.034,.011],20,12);
    oval(s,"#fff3be",[side*.124,.826,.351],[.008,.011,.003],12,8);
    cord(s,"#641d26",[[side*.018,.896,.297],[side*.126,.853,.333],[side*.241,.89,.285]],.014,24,8);
    cord(s,"#df483e",[[side*.024,.917,.287],[side*.123,.878,.323],[side*.232,.911,.276]],.005,24,6);
  }
  // Local leather wrinkles and rubbed patches remain subtle curved relief.
  for(let i=0;i<36;i++) {
    const a=i*2.399963,y=.282+(i%11)*.074,r=.32;
    if(Math.cos(a)>.3&&y>.72&&y<.96)continue;
    const g=new THREE.SphereGeometry(1,8,6).scale(.013+(i%3)*.007,.028+(i%4)*.012,.0025)
      .rotateY(a).translate(Math.sin(a)*r,y,Math.cos(a)*r);
    s.surface(i%3?"#bf3132":"#7f2328",g);
  }
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4,points:P[]=[];
    for(let j=0;j<7;j++) {
      const t=j/6,r=.303+.014*Math.sin(t*Math.PI),angle=a+.06*Math.sin(t*Math.PI);
      points.push([Math.sin(angle)*r,.246+t*.172,Math.cos(angle)*r]);
    }
    cord(s,"#8c222a",points,.0045,14,5);
  }
  // Rear lacing joins the back panels, with separate eyelet holes and crossed cord.
  for(let i=0;i<7;i++)for(const side of [-1,1]) {
    const x=side*.059,y=.53+i*.071;
    s.surface("#5b2428",new THREE.TorusGeometry(.012,.004,5,16).translate(x,y,-.319));
    if(i<6)cord(s,"#d0a17c",[[x,y,-.325],[-x,y+.071,-.328]],.0035,7,5);
  }
  // Steel swivel and seven alternating oval chain links leave real negative space.
  turn(s,"#443b3a",[[0,1.249],[.048,1.249],[.059,1.264],[.045,1.283],[0,1.288]],32);
  s.surface("#777270",new THREE.TorusGeometry(.035,.008,8,28).translate(0,1.29,0));
  for(let link=0;link<7;link++) {
    const y=1.329+link*.06,points:P[]=[];
    for(let j=0;j<32;j++) {
      const a=j*Math.PI/16,x=Math.cos(a)*.021,z=0,yy=y+Math.sin(a)*.038;
      const angle=link%2?Math.PI/2:.13;
      points.push([x*Math.cos(angle)-z*Math.sin(angle),yy,x*Math.sin(angle)+z*Math.cos(angle)]);
    }
    cord(s,link%2?"#535152":"#777271",points,.0058,32,6,true);
  }
  for(const side of [-1,1]) {
    oval(s,"#4b2026",[side*.177,.091,.042],[.055,.055,.063],20,12);
    oval(s,"#8d2a2b",[side*.179,.107,.076],[.04,.027,.036],16,10);
  }
  return s.finish();
}

/** #168: a continuous four-level braided coil, dark raised head and looped loose end. */
function whip() {
  const s=new Sculpt({detail:"high"}),points:P[]=[],turns=3.8,start=Math.PI-turns*Math.PI*2;
  for(let i=0;i<=240;i++) {
    const t=i/240,a=start+t*Math.PI*2*turns,r=.445-.163*t;
    points.push([Math.cos(a)*r,.178+t*.733,Math.sin(a)*r*.88]);
  }
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  s.surface("#3d263e",new THREE.TubeGeometry(path,256,.075,12,false));
  // Rounded individual braid cells follow the whole coil, including the hidden back.
  const palette=["#994473","#a94c7d","#873b68","#a34576"];
  for(let cell=0;cell<84;cell++) {
    const begin=(cell+.095)/84,end=(cell+.905)/84,local:P[]=[];
    for(let j=0;j<=5;j++)local.push(path.getPoint(begin+(end-begin)*j/5).toArray() as P);
    const curve=new THREE.CatmullRomCurve3(local.map(p=>new THREE.Vector3(...p)));
    const g=new THREE.TubeGeometry(curve,5,1,10,false),p=g.getAttribute("position");
    for(let ring=0;ring<=5;ring++) {
      const t=ring/5,c=curve.getPointAt(t),r=.075+.009*Math.sin(t*Math.PI);
      for(let j=0;j<=10;j++) {
        const index=ring*11+j,v=new THREE.Vector3().fromBufferAttribute(p,index).sub(c).multiplyScalar(r).add(c);
        p.setXYZ(index,v.x,v.y,v.z);
      }
    }
    g.computeVertexNormals();s.surface(palette[cell%palette.length],g);
  }
  // Fine crossing threads create a restrained leather braid rather than a painted grid.
  const frames=path.computeFrenetFrames(256,false);
  for(const side of [-1,1]) {
    const ridge:P[]=[];
    for(let i=0;i<=256;i++) {
      const t=i/256,c=path.getPointAt(t),a=t*Math.PI*2*18+side*Math.PI/2;
      c.addScaledVector(frames.normals[i],Math.cos(a)*.083).addScaledVector(frames.binormals[i],Math.sin(a)*.083);
      ridge.push(c.toArray() as P);
    }
    cord(s,side>0?"#c56b99":"#622b55",ridge,.003,256,4);
  }
  for(const p of [points[0],points[points.length-1]])oval(s,"#593050",p,[.076,.076,.076],16,10);
  // The uncoiled upper section bends into the lifted dark head.
  const neck:P[]=[points[points.length-1],[-.246,1.037,-.012],[-.161,1.188,.004],
    [-.036,1.291,.035],[.13,1.325,.084],[.192,1.279,.12]];
  cord(s,"#452b43",neck,.065,44,10);
  for(let i=0;i<8;i++) {
    const t=(i+.4)/8,curve=new THREE.CatmullRomCurve3(neck.map(p=>new THREE.Vector3(...p))),c=curve.getPoint(t),axis=curve.getTangent(t);
    s.surface(i%2?"#8f416d":"#5b2b50",new THREE.TorusGeometry(.065,.007,5,20)
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),axis)).translate(c.x,c.y,c.z));
  }
  s.surface("#50363e",new RoundedBoxGeometry(.286,.222,.243,4,.063).rotateZ(-.24).translate(.191,1.298,.134));
  oval(s,"#66404a",[.18,1.349,.087],[.124,.079,.111],24,16);
  for(const side of [-1,1]) {
    const x=.191+side*.081;
    const shape=(color:string,z:number,dy=0)=>plate(s,color,
      [[x-side*.035,1.313+dy],[x+side*.041,1.279+dy],[x+side*.027,1.247+dy],[x-side*.025,1.275+dy]],z,.008);
    shape("#211925",.258);
    shape("#f5b836",.27,.002);
    oval(s,"#de7a27",[x+side*.01,1.278,.282],[.012,.014,.004],12,8);
    cord(s,"#36222f",[[x-side*.044,1.334,.244],[x,1.301,.275],[x+side*.046,1.287,.253]],.009,16,6);
  }
  cord(s,"#2b1e2b",[[.111,1.226,.244],[.178,1.202,.259],[.249,1.217,.237]],.006,20,6);
  // Original brown handle rises behind the head; wrapped grip and ferrules are complete.
  const h0=new THREE.Vector3(-.07,1.253,-.064),h1=new THREE.Vector3(-.235,1.602,-.089),axis=h1.clone().sub(h0).normalize();
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis),mid=h0.clone().add(h1).multiplyScalar(.5);
  s.surface("#774d35",new THREE.CylinderGeometry(.067,.084,h0.distanceTo(h1),24).applyQuaternion(q).translate(mid.x,mid.y,mid.z));
  for(let i=0;i<8;i++) {
    const c=h0.clone().lerp(h1,(i+.3)/8),r=.083-i*.002;
    s.surface(i%2?"#a16b43":"#51392d",new THREE.TorusGeometry(r,.007,5,24).rotateX(Math.PI/2).applyQuaternion(q).translate(c.x,c.y,c.z));
  }
  oval(s,"#4f3534",h1.toArray() as P,[.073,.065,.075],20,12);
  // The separate narrowing loose end curls below the right side without filling the coil.
  const tail:P[]=[points[0],[.291,.137,-.273],[.469,.116,-.024],[.534,.096,.214],
    [.489,.072,.311],[.397,.078,.316],[.382,.103,.246],[.438,.128,.222]];
  const tailPath=new THREE.CatmullRomCurve3(tail.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(tailPath,64,1,8,false),pos=g.getAttribute("position");
  for(let ring=0;ring<=64;ring++) {
    const t=ring/64,c=tailPath.getPointAt(t),r=.026*(1-.62*t);
    for(let j=0;j<=8;j++){const k=ring*9+j,p=new THREE.Vector3().fromBufferAttribute(pos,k).sub(c).multiplyScalar(r).add(c);pos.setXYZ(k,p.x,p.y,p.z);}
  }
  g.computeVertexNormals();s.surface("#86426d",g);
  oval(s,"#b3628c",tail[tail.length-1],[.01,.01,.01],10,6);
  return s.finish();
}

export const SCULPTS_W_FLEXIBLE:Record<string,()=>THREE.BufferGeometry>={mon_heavybag:heavybag,mon_whip:whip};
