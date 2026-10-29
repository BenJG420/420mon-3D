import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=8) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function oval(s:Sculpt,color:string,p:P,size:P,w=16,h=10) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function lathe(s:Sculpt,color:string,profile:[number,number][],p:P=[0,0,0],n=64) {
  s.surface(color,new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),n).translate(...p));
}
function patch(s:Sculpt,color:string,outline:[number,number][],z:number) {
  const shape=new THREE.Shape(outline.map(p=>new THREE.Vector2(...p)));
  s.surface(color,new THREE.ExtrudeGeometry(shape,{depth:.003,bevelEnabled:true,bevelSegments:2,bevelSize:.004,bevelThickness:.002}).translate(0,0,z));
}

/** #121: a pressed olive can with a truly open carry handle and crooked spout. */
function jerrycan() {
  const s=new Sculpt({detail:"high"});
  const olive="#777139", rust="#89512d", edge="#a0924e", dark="#494733";
  // Broad subtly crowned face, curved shoulders and fully rounded side panels.
  s.surface(olive,new RoundedBoxGeometry(.94,1.02,.43,6,.065).translate(0,.675,0));
  s.roundedBox(dark,0,.166,0,.88,.043,.4,.018);
  s.roundedBox("#93834a",0,.2,0,.935,.025,.414,.012);
  for(const side of [-1,1]) {
    s.roundedBox("#685239",side*.353,.126,.016,.13,.047,.225,.012);
    // A bent welded seam follows the perimeter, around both sides and the back.
    const seam:P[]=[[side*.426,.224,.192],[side*.451,.42,.192],[side*.449,.85,.19],[side*.422,1.11,.18],[side*.31,1.171,.169]];
    cord(s,rust,seam,.013,30,8);
    cord(s,edge,seam.map(([x,y,z])=>[x-side*.014,y,z+.006]),.005,30,6);
    cord(s,"#504b32",[[side*.446,.26,-.179],[side*.453,.7,-.187],[side*.43,1.104,-.177]],.008,24,6);
    s.roundedBox("#625d37",side*.461,.66,-.017,.014,.6,.24,.007);
    for(let i=0;i<3;i++)s.rod("#8c7a3f",[side*.473,.42+i*.22,-.09],[side*.473,.49+i*.22,.06],.005);
  }
  // Separate front/back wall of the carry loop, with an actual rectangular hole.
  const ring=new THREE.Shape();
  ring.moveTo(-.215,1.155);ring.lineTo(-.215,1.369);ring.quadraticCurveTo(-.215,1.418,-.164,1.418);
  ring.lineTo(.164,1.418);ring.quadraticCurveTo(.215,1.418,.215,1.369);ring.lineTo(.215,1.155);ring.closePath();
  const hole=new THREE.Path();
  hole.moveTo(-.139,1.215);hole.lineTo(.139,1.215);hole.lineTo(.139,1.331);hole.quadraticCurveTo(.139,1.351,.119,1.351);
  hole.lineTo(-.119,1.351);hole.quadraticCurveTo(-.139,1.351,-.139,1.331);hole.closePath();ring.holes.push(hole);
  s.surface("#81713a",new THREE.ExtrudeGeometry(ring,{depth:.145,bevelEnabled:true,bevelSegments:4,bevelSize:.012,bevelThickness:.01,curveSegments:12}).translate(0,0,-.072));
  cord(s,"#b49a54",[[-.199,1.194,.085],[-.199,1.369,.085],[-.163,1.404,.085],[.163,1.404,.085],[.199,1.369,.085],[.199,1.194,.085]],.007,38,6);
  for(let i=0;i<5;i++)s.rod("#65542d",[-.11+i*.055,1.412,-.032],[-.11+i*.055,1.412,.027],.004);
  // Right-side filler neck with thread ridges, cap lugs and a small sealing gasket.
  lathe(s,"#4c4830",[[0,0],[.061,0],[.071,.012],[.071,.05],[.056,.058],[0,.058]],[.331,1.166,0],32);
  lathe(s,"#a18b46",[[0,0],[.067,0],[.074,.013],[.071,.048],[.054,.059],[0,.059]],[.331,1.215,0],40);
  for(const y of [1.217,1.239])s.torus("#615733",.331,y,0,.069,.005,Math.PI/2);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;s.rod(edge,[.331+Math.sin(a)*.069,1.229,Math.cos(a)*.069],[.331+Math.sin(a)*.069,1.254,Math.cos(a)*.069],.006);}
  // A hollow bent outlet: the dark smaller inner tube is visible beyond its lip.
  const path=new THREE.CatmullRomCurve3([[-.39,1.095,0],[-.51,1.185,0],[-.623,1.31,0],[-.746,1.242,0],[-.841,1.136,0]].map(p=>new THREE.Vector3(...p)));
  s.surface("#96875a",new THREE.TubeGeometry(path,44,.048,16,false));
  const inner=new THREE.TubeGeometry(path,44,.035,16,false);
  // Inner surface needs the opposite winding so its bore faces into the opening.
  const index=inner.getIndex()!;for(let i=0;i<index.count;i+=3){const a=index.getX(i);index.setX(i,index.getX(i+2));index.setX(i+2,a);}inner.computeVertexNormals();
  s.surface("#454331",inner);
  const tip=path.getPoint(1),direction=path.getTangent(1),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),direction);
  s.surface("#c1a369",new THREE.TorusGeometry(.0415,.0065,8,32).applyQuaternion(rotation).translate(tip.x,tip.y,tip.z));
  s.torus(rust,-.435,1.13,0,.052,.007,Math.PI/2,0,.7);
  // Magenta drip retains the source's silhouette and hue, without a new glow pass.
  lathe(s,"#bb159a",[[0,0],[.023,.003],[.041,.02],[.043,.049],[.027,.08],[.012,.112],[0,.135]],[-.85,.778,0],40);
  oval(s,"#f176dc",[-.863,.827,.032],[.008,.022,.006]);
  oval(s,"#d82db9",[-.851,.952,0],[.009,.02,.009],12,8);
  for(const side of [-1,1]) {
    const x=side*.183;
    s.roundedBox("#5a492a",x,.765,.224,.177,.19,.038,.027);
    s.roundedBox("#b38e46",x,.762,.248,.137,.149,.022,.023);
    s.roundedBox("#f5df85",x,.765,.262,.095,.113,.017,.024);
    s.roundedBox("#342c24",x+.018,.755,.275,.027,.067,.009,.009);
    oval(s,"#fff8c5",[x-.018,.797,.276],[.016,.021,.004],12,8);
  }
  // Contiguous irregular oxidation patches along the rolled borders and shoulders.
  for(let i=0;i<20;i++) {
    const side=i%2?1:-1, x=side*(.385-.02*Math.sin(i)), y=.29+(i>>1)*.083;
    patch(s,i%3?rust:"#a36c35",[[x-.018,y-.037],[x+.021,y-.027],[x+.028,y+.007],[x+.009,y+.027],[x-.012,y+.016],[x-.026,y+.032]],.213);
  }
  for(let i=0;i<12;i++) {
    const x=-.31+i*.057,y=.254+.019*Math.sin(i*2);
    patch(s,i%2?"#a06432":"#655537",[[x-.02,y],[x+.021,y+.016],[x+.015,y+.049],[x-.009,y+.031]],.216);
    const top=1.115-.025*Math.cos(i);
    s.rod("#89713a",[x,top,.21],[x+.008,top-.03-(i%3)*.018,.218],.005);
  }
  // The back has stamped reinforcing ribs and shallow centre embossing.
  for(const sign of [-1,1]) {
    cord(s,"#5e5c35",[[-.3,.35,-.219],[-.09,.59,-.239],[.08,.77,-.237],[.3,1.03,-.219]].map(([x,y,z])=>[x*sign,y,z] as P),.023,28,8);
    cord(s,"#a28a4e",[[-.28,.36,-.228],[-.07,.6,-.254],[.09,.78,-.252],[.29,1.02,-.226]].map(([x,y,z])=>[x*sign,y,z] as P),.006,28,6);
  }
  s.roundedBox("#72703e",0,.69,-.239,.17,.12,.026,.025);
  for(let i=0;i<4;i++)s.box("#4e4d32",-.09+i*.06,.414,-.224,.021,.007,.004);
  return s.finish();
}

/** #124: leaning yellow cast-iron bollard, chipped enamel, rolled cap and base. */
function bollard() {
  const s=new Sculpt({detail:"high"});
  // Build upright first so cast profiles and painted wear share one curved surface.
  const bodyColor="#e1bb20";
  const body=new THREE.LatheGeometry([[0,.1],[.33,.1],[.356,.14],[.341,.2],[.313,.25],[.305,.35],
    [.304,.94],[.318,1.09],[.335,1.13],[.326,1.16],[0,1.16]].map(p=>new THREE.Vector2(...p)),80);
  s.surface(bodyColor,body);
  lathe(s,"#343538",[[0,.064],[.33,.064],[.38,.081],[.399,.116],[.4,.177],[.38,.215],[.329,.236],[.323,.206],[0,.206]]);
  lathe(s,"#676666",[[.342,.208],[.379,.208],[.389,.223],[.379,.236],[.345,.236],[.342,.208]]);
  lathe(s,"#4c4c4d",[[0,1.085],[.327,1.085],[.358,1.108],[.37,1.135],[.367,1.178],[.349,1.201],[.29,1.212],[0,1.213]]);
  lathe(s,"#888784",[[.3,1.191],[.347,1.191],[.358,1.204],[.352,1.213],[.312,1.216],[.3,1.191]]);
  // Shallow concentric casting on top and actual screw plugs in the broad base.
  s.torus("#38383b",0,1.215,0,.228,.005,Math.PI/2);
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4,x=Math.sin(a)*.35,z=Math.cos(a)*.35;
    lathe(s,"#939087",[[0,0],[.021,0],[.024,.007],[.017,.016],[0,.016]],[x,.231,z],16);
    s.rod("#414144",[x-.012,.247,z],[x+.012,.247,z],.0025);
  }
  // Paint loss consists of curved irregular islands mapped onto the cylindrical
  // wall, never flat squares. Irregular rims reveal dark iron below the enamel.
  const patchOnWall=(angle:number,y:number,width:number,height:number,i:number)=>{
    const count=10,points:number[]=[Math.sin(angle)*.312,y,Math.cos(angle)*.312],faces:number[]=[];
    for(let j=0;j<count;j++) {
      const a=j/count*Math.PI*2,r=1+.24*Math.sin(j*2.7+i),theta=angle+Math.cos(a)*width*r;
      const yy=y+Math.sin(a)*height*r;
      const radius=.309+.017*Math.pow(Math.max(0,(yy-.94)/.19),2)+.002*Math.sin(j*3+i);
      points.push(Math.sin(theta)*radius,yy,Math.cos(theta)*radius);
    }
    // Right-to-up boundary order gives the outward radial face normal.
    for(let j=0;j<count;j++)faces.push(0,1+j,1+(j+1)%count);
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(points,3));g.setIndex(faces);g.computeVertexNormals();s.surface(i%4?"#37393a":"#6d6959",g);
  };
  for(let i=0;i<50;i++) {
    const a=i*2.399963,y=.3+(i%11)*.074;
    // Preserve clear enamel behind the two contrasting round eyes.
    if(Math.cos(a)>.6 && y>.61 && y<.86)continue;
    patchOnWall(a,y,.05+(i%4)*.034,.022+(i%3)*.014,i);
  }
  for(let i=0;i<13;i++) {
    const a=i*.483,y=i%2?.13:1.15,r=i%2?.403:.372;
    const points:P[]=[];for(let j=0;j<4;j++)points.push([Math.sin(a+j*.027)*r,y+Math.sin(j+i)*.014,Math.cos(a+j*.027)*r]);
    cord(s,"#b9a229",points,.009,10,6);
  }
  for(const side of [-1,1]) {
    const x=side*.134,z=.285;
    oval(s,"#494842",[x,.717,z],[.086,.09,.024],24,16);
    oval(s,"#bcb9a2",[x,.717,z+.019],[.066,.071,.018],24,16);
    oval(s,"#302e2e",[x,.715,z+.034],[.027,.037,.012],20,12);
    oval(s,"#eee6c7",[x-.011,.738,z+.042],[.009,.012,.004],12,8);
  }
  // Tiny cast pits and runnels down the back/sides round out the worn metal.
  for(let i=0;i<16;i++) {
    const a=1.05+i*.249,y=.37+(i%7)*.094;
    cord(s,i%3?"#a8962d":"#807440",[[Math.sin(a)*.309,y,Math.cos(a)*.309],
      [Math.sin(a+.018)*.311,y-.024,Math.cos(a+.018)*.311],[Math.sin(a+.007)*.311,y-.051,Math.cos(a+.007)*.311]],.003,10,6);
  }
  const geometry=s.finish();
  // Source leans gently right: rotate the whole solid, then reground it once.
  geometry.rotateZ(-.16);geometry.computeBoundingBox();
  const bounds=geometry.boundingBox!,size=bounds.getSize(new THREE.Vector3()),scale=1.6/Math.max(size.x,size.y,size.z),center=bounds.getCenter(new THREE.Vector3());
  geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.scale(scale,scale,scale);geometry.translate(0,-.8,0);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

export const SCULPTS_P_METAL:Record<string,()=>THREE.BufferGeometry>={mon_jerrycan:jerrycan,mon_bollard:bollard};
