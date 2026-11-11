import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function beam(s:Sculpt,color:string,a:P,b:P,width:number,depth:number) {
  const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),axis=to.clone().sub(from);
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.clone().normalize()),middle=from.add(to).multiplyScalar(.5);
  s.surface(color,new RoundedBoxGeometry(width,axis.length(),depth,3,.018).applyQuaternion(q).translate(middle.x,middle.y,middle.z));
}

/** Closed thin hanging cloth: softly folded front/back, side and lower hems. */
function cloth() {
  const points:number[]=[],indices:number[]=[],rows=18,cols=14,layer=(rows+1)*(cols+1);
  for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++) {
    const v=j/rows,u=i/cols*2-1,w=.292-.105*v;
    points.push(u*w,1.047-v*.67+.008*Math.sin(u*4)*v,
      -.054+.018*Math.sin(u*7+v*1.7)+.012*Math.sin(v*4)+(side===0?.007:-.007));
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++) {
    const a=j*(cols+1)+i,b=a+cols+1;
    indices.push(a,b,a+1,a+1,b,b+1,layer+a,layer+a+1,layer+b,layer+a+1,layer+b+1,layer+b);
  }
  const edge=(a:number,b:number)=>indices.push(a,b,layer+a,b,layer+b,layer+a);
  for(let i=0;i<cols;i++){edge(i,i+1);edge(rows*(cols+1)+i+1,rows*(cols+1)+i);}
  for(let j=0;j<rows;j++){edge((j+1)*(cols+1),j*(cols+1));edge(j*(cols+1)+cols,(j+1)*(cols+1)+cols);}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(points,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

/** #171: full wooden trestle, a rounded cross-log and the source's magenta cloth. */
function sawhorse() {
  const s=new Sculpt({detail:"high"}),wood="#95672e",light="#c29b57",dark="#66451f";
  s.surface(wood,new THREE.CylinderGeometry(.126,.132,1.08,48,1,false).rotateZ(Math.PI/2).translate(0,1.15,0));
  // The rear of the cross-log receives the same long grain as its visible face.
  for(let strand=0;strand<12;strand++) {
    const a=strand*Math.PI/6,points:P[]=[];
    for(let j=0;j<=16;j++) {
      const x=-.51+j*.06375,angle=a+.06*Math.sin(x*9+strand);
      points.push([x,1.15+Math.sin(angle)*.131,Math.cos(angle)*.131]);
    }
    cord(s,strand%3?"#bb8f45":"#684b26",points,strand%3?.0035:.005,28,5);
  }
  for(const side of [-1,1]) {
    // End-grain rings remain true raised wood relief on both round cut ends.
    s.surface("#b58a44",new THREE.CircleGeometry(.118,48).rotateY(side*Math.PI/2).translate(side*.546,1.15,0));
    for(let ring=0;ring<5;ring++) {
      const r=.02+ring*.019;
      s.surface(ring%2?"#725122":"#d1a966",new THREE.TorusGeometry(r,.0028,5,32)
        .rotateY(Math.PI/2).translate(side*.549,1.15,0));
    }
    cord(s,dark,[[side*.551,1.148,0],[side*.551,1.114,.036],[side*.551,1.078,.068]],.003,12,5);
  }
  s.surface("#d71992",cloth());
  // Four separate splayed rails give the A-frame full front-to-back depth.
  for(const side of [-1,1])for(const rear of [false,true]) {
    const top:P=[side*.331,1.083,rear?-.084:.077],bottom:P=[side*(rear?.434:.527),.103,rear?-.295:.263];
    beam(s,rear?"#7f5727":"#a57836",bottom,top,.112,.117);
    const a=new THREE.Vector3(...bottom),b=new THREE.Vector3(...top),axis=b.clone().sub(a).normalize();
    const across=new THREE.Vector3(1,0,0).addScaledVector(axis,-axis.x).normalize();
    // Raised wavy fibers run down each of the four wooden legs, including their rear faces.
    for(const face of [-1,1])for(let strand=0;strand<4;strand++) {
      const pts:P[]=[];
      for(let j=0;j<=14;j++) {
        const t=.035+j*.066,p=a.clone().lerp(b,t).addScaledVector(across,(strand-1.5)*.022+.004*Math.sin(t*12+strand));
        p.z+=face*.06;pts.push(p.toArray() as P);
      }
      cord(s,strand%2?"#c49b56":"#6e4b23",pts,.0027,18,5);
    }
    // Rounded endgrain and a short cut line complete each foot without invented shoes.
    oval(s,"#735022",[bottom[0],.083,bottom[2]],[.063,.017,.066],16,10);
    for(let i=0;i<3;i++)cord(s,"#bc944c",[[bottom[0]-.039+i*.037,.096,bottom[2]+.061],
      [bottom[0]-.033+i*.035,.145,bottom[2]+.058]],.003,7,5);
  }
  for(const rear of [false,true]) {
    const z=rear?-.217:.191;
    beam(s,rear?"#795526":"#a67e3c",[-.465,.352,z],[.459,.352,z],.078,.083);
    cord(s,"#d3ae67",[[-.439,.381,z+.044],[-.12,.379,z+.047],[.19,.38,z+.045],[.434,.378,z+.045]],.004,30,5);
    for(const x of [-.396,.397]) {
      oval(s,"#5b5542",[x,.353,z+(rear?-.05:.05)],[.021,.021,.006],12,8);
      s.box("#b8ad89",x,.355,z+(rear?-.057:.057),.02,.004,.003);
    }
  }
  // Source sleepy eyes are embedded in the round front of the log.
  for(const x of [-.195,.184]) {
    oval(s,"#5c421f",[x,1.144,.123],[.089,.068,.023],24,16);
    oval(s,"#dbc895",[x,1.139,.144],[.069,.047,.012],24,16);
    oval(s,"#322c1e",[x,1.131,.154],[.028,.03,.009],20,12);
    oval(s,"#f3dfae",[x-.009,1.145,.161],[.009,.012,.003],12,8);
    oval(s,"#b58c49",[x,1.174,.145],[.082,.027,.022],24,12);
    cord(s,"#6d4d25",[[x-.077,1.165,.148],[x,1.158,.17],[x+.077,1.165,.148]],.006,22,6);
    cord(s,"#d5b777",[[x-.069,1.208,.097],[x,1.223,.11],[x+.064,1.207,.097]],.005,20,5);
  }
  // Cloth hem and corner pegs are restrained relief on its actual folded surface.
  for(const side of [-1,1]) {
    cord(s,"#9e186f",[[side*.291,1.041,-.038],[side*.251,.81,-.042],[side*.218,.579,-.032],[side*.187,.383,-.04]],.004,24,5);
    oval(s,"#503d26",[side*.274,1.061,.013],[.015,.018,.006],12,8);
  }
  cord(s,"#eb43b0",[[-.18,.385,-.036],[-.06,.383,-.051],[.06,.385,-.026],[.18,.388,-.041]],.004,28,5);
  return s.finish();
}

type Ring=[number,number,number];
function contour(a:number,rx:number,rz:number) {
  const c=Math.cos(a),q=Math.sin(a),wav=1+.008*Math.sin(a*11)+.004*Math.sin(a*19);
  return [Math.sign(c)*Math.abs(c)**.36*rx*wav,Math.sign(q)*Math.abs(q)**.59*rz*wav];
}
/** Continuous rounded rectangle bowl profile; ring order gives inward-facing inner walls. */
function trough(profile:Ring[],segments=96) {
  const points:number[]=[],indices:number[]=[];
  for(const [rx,rz,y] of profile)for(let j=0;j<=segments;j++) {
    const a=j/segments*Math.PI*2,[x,z]=contour(a,rx,rz);
    const rough=(rx>0?.008*Math.sin(a*7)+.005*Math.sin(a*13):0)*(y>.67?1:.2);
    points.push(x,y+rough,z);
  }
  for(let ring=0;ring<profile.length-1;ring++)for(let j=0;j<segments;j++) {
    const a=ring*(segments+1)+j,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(points,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function leaf(s:Sculpt,color:string,p:P,angle:number,size:number,bend:number) {
  // Closed pointed curled leaf with a raised central vein and thinner side edges.
  const points=[0,.014,-.07,-.037,0,-.025,-.043,.001,.028,0,.022,.08,.042,.002,.031,.034,0,-.027,
    0,-.003,-.07,-.037,-.005,-.025,-.043,-.004,.028,0,.013,.08,.042,-.003,.031,.034,-.005,-.027,0,.016,.005];
  for(let i=0;i<points.length;i+=3){points[i]*=size;points[i+1]=(points[i+1]+bend*points[i+2]**2)*size;points[i+2]*=size;}
  const faces=[0,12,1,1,12,2,2,12,3,3,12,4,4,12,5,5,12,0,6,7,9,7,8,9,6,9,11,9,10,11];
  for(let i=0;i<6;i++){const j=(i+1)%6;faces.push(i,j,i+6,j,j+6,i+6);}
  for(let i=0;i<faces.length;i+=3){const a=faces[i];faces[i]=faces[i+2];faces[i+2]=a;}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(points,3));g.setIndex(faces);g.computeVertexNormals();g.rotateY(angle).translate(...p);s.surface(color,g);
  const vein=[new THREE.Vector3(0,.02*size,-.049*size),new THREE.Vector3(0,.022*size,.052*size)]
    .map(v=>v.applyAxisAngle(new THREE.Vector3(0,1,0),angle).add(new THREE.Vector3(...p)).toArray() as P);
  cord(s,"#b5914e",vein,.0025,5,5);
}

/** #172: a genuinely hollow weathered stone trough with individual fallen leaves. */
function gutter() {
  const s=new Sculpt({detail:"high"});
  s.surface("#8e8b79",trough([[0,0,.281],[.572,.231,.281],[.638,.274,.304],[.675,.292,.366],
    [.69,.309,.659],[.689,.308,.718],[.668,.286,.751],[.619,.246,.746],[.594,.229,.715],
    [.578,.217,.546],[.543,.19,.443],[.48,.165,.413],[0,0,.413]],112));
  s.surface("#343a32",trough([[.593,.228,.713],[.577,.216,.55],[.542,.189,.448],[.479,.164,.417],[0,0,.417]],96));
  // Narrow worn lip highlights follow the uneven real stone rim all around.
  const lip:P[]=[],outer:P[]=[];
  for(let i=0;i<=80;i++) {
    const a=i*Math.PI/40,[x,z]=contour(a,.649,.268),[xx,zz]=contour(a,.691,.309);
    lip.push([x,.751+.008*Math.sin(a*7)+.005*Math.sin(a*13),z]);outer.push([xx,.664+.002*Math.sin(a*7),zz]);
  }
  cord(s,"#c8bda0",lip,.012,80,7);cord(s,"#656955",outer,.006,80,5);
  // Rough mineral inclusions follow tangent planes, avoiding both angry eye sockets.
  for(let i=0;i<102;i++) {
    const y=.331+(i%12)*.03,a=i*2.399963,rx=.673+(y-.36)*.055,rz=.292+(y-.36)*.057;
    const [x,z]=contour(a,rx,rz),[x0,z0]=contour(a-.001,rx,rz),[x1,z1]=contour(a+.001,rx,rz);
    if(z>.22&&Math.abs(y-.469)<.1&&Math.abs(Math.abs(x)-.197)<.12)continue;
    const normal=new THREE.Vector3(z1-z0,-.0001,-(x1-x0)).normalize();
    const g=new THREE.SphereGeometry(1,8,6).scale(.009+(i%4)*.007,.011+(i%3)*.008,.003)
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal)).translate(x,y,z);
    s.surface(i%4===0?"#c2bda6":i%3===0?"#5b6254":"#a3a28d",g);
  }
  for(let i=0;i<20;i++) {
    const a=i*Math.PI/10,[x,z]=contour(a,.653,.271);
    oval(s,i%3?"#d0c6a6":"#787c65",[x,.76+.006*Math.sin(a*7),z],[.014,.003,.009+(i%3)*.004],10,6);
  }
  // Individual curled leaf litter sits below the lip, retaining visible deep interior.
  const palette=["#7e582d","#a87837","#8d6c31","#b28b43","#67512b"];
  for(let i=0;i<31;i++) {
    const a=i*2.399963,r=Math.sqrt((i+.5)/31),x=Math.cos(a)*.509*r,z=Math.sin(a)*.154*r;
    leaf(s,palette[i%palette.length],[x,.452+(i%4)*.012,z],a,.65+(i%4)*.17,2+(i%3));
  }
  for(let i=0;i<8;i++) {
    const x=-.475+i*.133,z=(i%2?1:-1)*.112;
    cord(s,"#584a2b",[[x-.029,.454,z],[x,.467,z+.019],[x+.035,.459,z-.006]],.005,10,5);
  }
  // Source's sharp sleepy/angry eyes remain ahead of the rough front face.
  for(const side of [-1,1]) {
    const x=side*.197;
    oval(s,"#34332c",[x,.47,.305],[.102,.061,.024],24,16);
    oval(s,"#d7d3ba",[x,.458,.327],[.065,.032,.011],24,14);
    oval(s,"#171e1c",[x+side*.007,.462,.338],[.028,.034,.009],20,12);
    oval(s,"#f6f5dd",[x-side*.006,.479,.345],[.01,.013,.003],12,8);
    cord(s,"#505346",[[x-side*.089,.518,.31],[x,.491,.344],[x+side*.089,.533,.308]],.012,24,7);
    cord(s,"#b3af96",[[x-side*.094,.542,.304],[x,.516,.33],[x+side*.092,.552,.304]],.006,24,5);
  }
  // A small dark falling droplet is a full pointed volume below the drain.
  s.surface("#30232f",new THREE.LatheGeometry([[0,.075],[.022,.08],[.032,.106],[.025,.134],[.01,.174],[0,.205]]
    .map(v=>new THREE.Vector2(...v)),40).translate(0,0,.028));
  oval(s,"#87728c",[-.009,.112,.052],[.009,.016,.004],14,10);
  // Low chipped support pads and a small rear repair line complete the underside.
  for(const x of [-.47,.47])oval(s,"#636653",[x,.278,-.026],[.116,.02,.149],20,12);
  cord(s,"#585e50",[[-.43,.473,-.307],[-.25,.434,-.308],[-.103,.465,-.31],[.018,.431,-.309]],.005,32,5);
  return s.finish();
}

export const SCULPTS_X_MATERIALS:Record<string,()=>THREE.BufferGeometry>={mon_sawhorse:sawhorse,mon_gutter:gutter};
