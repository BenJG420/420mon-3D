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
function glow(g:THREE.BufferGeometry,palette:string[]) {
  const colors=g.getAttribute("color"),weights=new Float32Array(colors.count),emit=palette.map(c=>new THREE.Color(c));
  for(let i=0;i<colors.count;i++)if(emit.some(c=>Math.abs(c.r-colors.getX(i))<1e-5&&Math.abs(c.g-colors.getY(i))<1e-5&&Math.abs(c.b-colors.getZ(i))<1e-5))weights[i]=.7;
  g.setAttribute("glowWeight",new THREE.BufferAttribute(weights,1));g.userData.glowSurface=true;return g;
}

/** #173: cream timer housing, a complete tilted analogue dial and a loose cable. */
function growtimer() {
  const s=new Sculpt({detail:"high"}),cream="#bcb699",edge="#eee5c7",shade="#8c8b73";
  box(s,shade,[0,.514,0],[.879,.579,.682],.047,5);
  box(s,cream,[0,.533,.016],[.855,.541,.68],.034,4);
  box(s,"#d7cfaf",[0,.833,0],[.931,.131,.731],.032,4);
  box(s,edge,[0,.89,-.008],[.853,.034,.649],.015,3);
  // Moulded panel rims, screws and four broad cast feet finish the whole housing.
  box(s,"#d8d0af",[0,.529,.365],[.776,.455,.027],.027,3);
  for(const side of [-1,1]) {
    line(s,"#787c6d",[[side*.446,.31,-.21],[side*.446,.512,-.21],[side*.446,.763,-.21]],.005,25,5);
    for(const z of [-.232,.232]) {
      box(s,"#666f68",[side*.309,.205,z],[.178,.103,.166],.022,2);
      box(s,"#92977e",[side*.311,.232,z+.028],[.141,.025,.121],.009,2);
    }
  }
  for(const x of [-.336,.336])for(const y of [.361,.709]) {
    oval(s,"#858a73",[x,y,.388],[.013,.013,.005],12,8);
    s.box("#ded8b8",x,y,.394,.015,.003,.003);
  }
  const emit=["#76f34a","#b9ff82","#efffd5"];
  for(const x of [-.205,.205]) {
    oval(s,"#596747",[x,.544,.388],[.076,.093,.025],24,16);
    oval(s,"#355b30",[x,.544,.409],[.055,.073,.016],24,14);
    oval(s,emit[0],[x,.544,.423],[.042,.058,.013],24,16);
    oval(s,emit[1],[x-.009,.554,.435],[.025,.036,.005],18,12);
    oval(s,emit[2],[x-.015,.565,.44],[.012,.017,.003],12,8);
  }
  // Everything in the dial shares a local front-facing XY plane, tilted towards the viewer.
  const local=(color:string,g:THREE.BufferGeometry)=>s.surface(color,g.rotateX(-.75).translate(0,1.085,-.005));
  const disk=(color:string,r:number,depth:number,z:number)=>local(color,new THREE.CylinderGeometry(r,r,depth,64).rotateX(Math.PI/2).translate(0,0,z));
  disk("#666f6a",.274,.084,0);
  local("#303d46",new THREE.TorusGeometry(.254,.021,10,64).translate(0,0,.045));
  disk("#a69f7f",.238,.016,.039);
  disk("#e9dfb7",.225,.013,.052);
  local("#f6ebc9",new THREE.TorusGeometry(.221,.004,6,48).translate(0,0,.062));
  // Sixty tiny engraved indices, twelve larger source hour markers and four numbers.
  for(let i=0;i<60;i++) {
    const a=i*Math.PI/30,r=i%5?.206:.196,h=i%5?.011:.029;
    local(i%5?"#8e8a70":"#35434a",new RoundedBoxGeometry(i%5?.003:.008,h,.003,1,.001)
      .rotateZ(-a).translate(Math.sin(a)*r,Math.cos(a)*r,.061));
  }
  const digit=(value:string,x:number,y:number)=>{
    const segments:Record<string,number[]>={"1":[1,2],"2":[0,1,6,4,3],"3":[0,1,6,2,3],"6":[0,5,6,4,2,3],"9":[0,1,2,3,5,6]};
    const w=.021,h=.039,t=.003,slots:[number,number,number,number][]=[
      [x,y+h/2,w,t],[x+w/2,y+h/4,t,h/2],[x+w/2,y-h/4,t,h/2],[x,y-h/2,w,t],
      [x-w/2,y-h/4,t,h/2],[x-w/2,y+h/4,t,h/2],[x,y,w,t],
    ];
    for(const segment of segments[value]) {
      const [a,b,sx,sy]=slots[segment];local("#4b5552",new THREE.BoxGeometry(sx,sy,.002).translate(a,b,.064));
    }
  };
  digit("1",-.015,.155);digit("2",.015,.155);digit("3",.155,0);digit("6",0,-.155);digit("9",-.155,0);
  // The source's strong diagonal hand remains obvious above the detailed clock face.
  const hand=(color:string,points:[number,number][],z:number)=>local(color,new THREE.ExtrudeGeometry(new THREE.Shape(points.map(v=>new THREE.Vector2(...v))),
    {depth:.007,bevelEnabled:true,bevelSize:.003,bevelThickness:.002,bevelSegments:2}).translate(0,0,z));
  hand("#344654",[[-.024,-.01],[.116,.142],[.142,.16],[.139,.123],[.012,-.027]],.07);
  hand("#465c68",[[-.025,.014],[-.123,-.113],[-.133,-.145],[-.104,-.137],[.024,-.014]],.079);
  local("#7d8a85",new THREE.SphereGeometry(1,20,12).scale(.027,.027,.009).translate(0,0,.091));
  local("#253642",new THREE.SphereGeometry(1,16,10).scale(.012,.012,.005).translate(0,0,.101));
  // Dial fastener and a modest curved glare highlight supply depth without another pass.
  local("#b8b491",new THREE.SphereGeometry(1,14,10).scale(.017,.012,.007).translate(0,.276,0));
  const glint:P[]=[];for(let i=0;i<=20;i++){const a=.18+i*.033;glint.push([Math.sin(a)*.229,Math.cos(a)*.229,.067]);}
  local("#fff3d6",new THREE.TubeGeometry(new THREE.CatmullRomCurve3(glint.map(p=>new THREE.Vector3(...p))),24,.003,5,false));
  // Long original cable hangs free on the left and curls around an open plug loop.
  oval(s,"#525f60",[-.454,.608,-.023],[.049,.058,.068],24,14);
  const cable:P[]=[[-.455,.603,.008],[-.582,.576,.03],[-.611,.454,.047],[-.738,.307,.065],
    [-.809,.189,.085],[-.78,.099,.111],[-.677,.084,.127],[-.609,.139,.14],[-.655,.18,.145],[-.714,.155,.145]];
  line(s,"#505c60",cable,.023,70,8);
  line(s,"#96a19a",cable.map(([x,y,z])=>[x-.005,y+.006,z+.017]),.005,70,5);
  oval(s,"#ab388e",[-.711,.155,.147],[.029,.021,.028],18,12);
  // Recessed rear access, vent grooves and label relief make rotation fully finished.
  box(s,"#777f70",[0,.521,-.354],[.636,.359,.017],.024,3);
  box(s,"#c2bda0",[0,.521,-.367],[.602,.322,.01],.019,2);
  for(const x of [-.255,.255])for(const y of [.41,.633]) {
    oval(s,"#636f65",[x,y,-.377],[.014,.014,.004],12,8);s.box("#e2d7b5",x,y,-.383,.017,.003,.003);
  }
  for(let i=0;i<6;i++)s.box("#747e6c",0,.592-i*.026,-.377,.354-(i%3)*.05,.005,.003);
  for(let i=0;i<7;i++)box(s,"#596d63",[.443,.399+i*.044,-.042],[.009,.008,.197],.003,1);
  return glow(s.finish(),emit);
}

/** Closed softly curved button skin follows the full ellipsoidal mouse shell. */
function mouseButton(side:number) {
  const vertices:number[]=[],indices:number[]=[],rows=20,cols=14,layer=(rows+1)*(cols+1);
  for(let face=0;face<2;face++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++) {
    const z=-.065+.552*j/rows,width=.44*Math.sqrt(1-((z+.01)/.6)**2)*.89;
    const x=side*(.021+i/cols*(width-.021));
    const y=.43+.3*Math.sqrt(Math.max(.001,1-(x/.44)**2-((z+.01)/.6)**2))+.009-face*.021;
    vertices.push(x,y,z);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++) {
    const a=j*(cols+1)+i,b=a+cols+1;
    if(side>0)indices.push(a,b,a+1,a+1,b,b+1,layer+a,layer+a+1,layer+b,layer+a+1,layer+b+1,layer+b);
    else indices.push(a,a+1,b,a+1,b+1,b,layer+a,layer+b,layer+a+1,layer+a+1,layer+b,layer+b+1);
  }
  const edge=(a:number,b:number)=>side>0?indices.push(a,b,layer+a,b,layer+b,layer+a):indices.push(a,layer+a,b,b,layer+a,layer+b);
  for(let i=0;i<cols;i++){edge(i,i+1);edge(rows*(cols+1)+i+1,rows*(cols+1)+i);}
  for(let j=0;j<rows;j++){edge((j+1)*(cols+1),j*(cols+1));edge(j*(cols+1)+cols,(j+1)*(cols+1)+cols);}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

/** #174: a full ergonomic dark mouse with separate buttons, wheel, LED eyes and cable tail. */
function mouse() {
  const s=new Sculpt({detail:"high"});
  oval(s,"#20282d",[0,.207,0],[.451,.119,.625],40,24);
  oval(s,"#353e43",[0,.43,-.01],[.44,.3,.6],48,32);
  s.surface("#4b5358",mouseButton(-1));s.surface("#424c51",mouseButton(1));
  // Narrow rear mould seam follows the actual shell; button edges remain separate.
  const seam:P[]=[];for(let i=0;i<=64;i++){const a=i*Math.PI/32;seam.push([Math.sin(a)*.436,.295,Math.cos(a)*.582]);}
  line(s,"#131e25",seam,.006,64,6);
  line(s,"#667078",[[-.367,.552,-.092],[-.22,.667,-.087],[0,.719,-.083],[.22,.667,-.087],[.367,.552,-.092]],.004,40,5);
  // The scroll wheel is a genuine round cylinder and grooved tread above a dark seat.
  box(s,"#19252b",[0,.711,.192],[.117,.022,.232],.025,3);
  s.surface("#1e292e",new THREE.CylinderGeometry(.076,.076,.069,32).rotateZ(Math.PI/2).translate(0,.696,.192));
  for(let i=-3;i<=3;i++)s.surface(i%2?"#566065":"#38464c",new THREE.TorusGeometry(.076,.003,5,32).rotateY(Math.PI/2).translate(i*.009,.696,.192));
  for(const side of [-1,1])s.surface("#727c7a",new THREE.CylinderGeometry(.021,.021,.006,16).rotateZ(Math.PI/2).translate(side*.039,.696,.192));
  const emit=["#5bfa40","#a2ff83","#e7ffda"];
  for(const side of [-1,1]) {
    const x=side*.20,y=.35,z=-.01+.6*Math.sqrt(1-(x/.44)**2-((y-.43)/.3)**2);
    const center=new THREE.Vector3(x,y,z),normal=new THREE.Vector3(x/(.44*.44),(y-.43)/(.3*.3),(z+.01)/(.6*.6)).normalize();
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
    const lens=(color:string,size:P,offset:number,r:number)=>{
      const p=center.clone().addScaledVector(normal,offset);
      s.surface(color,new RoundedBoxGeometry(...size,3,r).applyQuaternion(q).translate(p.x,p.y,p.z));
    };
    lens("#13251b",[.129,.146,.025],.013,.025);
    lens("#34773c",[.105,.119,.014],.029,.019);
    lens(emit[0],[.079,.092,.013],.042,.015);
    lens(emit[1],[.055,.072,.007],.052,.011);
    lens(emit[2],[.029,.047,.004],.058,.008);
  }
  // Subtle moulded underside, sensor well, skate pads and tiny screws.
  box(s,"#1b272d",[0,.12,-.015],[.556,.043,.846],.049,3);
  for(const z of [-.391,.379])box(s,"#7b898a",[0,.095,z],[.336,.013,.099],.028,3);
  box(s,"#35444a",[0,.09,0],[.168,.027,.215],.028,3);
  box(s,"#121e26",[0,.075,0],[.093,.011,.129],.018,2);
  oval(s,"#534654",[0,.065,.012],[.03,.008,.043],20,12);
  for(const x of [-.16,.16])for(const z of [-.251,.255]) {
    oval(s,"#899391",[x,.089,z],[.012,.004,.012],12,8);s.box("#1b292f",x,.084,z,.014,.002,.003);
  }
  // Rubber cable tail follows the original upward curl behind the body.
  const cable:P[]=[[0,.36,-.571],[.082,.409,-.684],[.253,.567,-.772],[.401,.811,-.77],[.494,1.082,-.727],[.581,1.234,-.734]];
  line(s,"#1e222b",cable,.018,68,8);
  line(s,"#53525d",cable.map(([x,y,z])=>[x-.004,y+.004,z+.013]),.003,68,5);
  for(let i=0;i<6;i++) {
    const p=new THREE.Vector3(0,.36,-.571).lerp(new THREE.Vector3(.082,.409,-.684),i/8);
    s.surface("#33313e",new THREE.TorusGeometry(.024,.004,5,20).rotateY(-.45).rotateX(-.3).translate(p.x,p.y,p.z));
  }
  oval(s,"#34303d",cable[cable.length-1],[.023,.023,.022],14,10);
  // Fine smooth rub marks follow the back rather than adding angular surface noise.
  for(let i=0;i<16;i++) {
    const a=2.1+i*.067,x=Math.sin(a)*.25,z=Math.cos(a)*.5,y=.43+.3*Math.sqrt(Math.max(.01,1-(x/.44)**2-((z+.01)/.6)**2));
    const n=new THREE.Vector3(x/.1936,(y-.43)/.09,(z+.01)/.36).normalize();
    s.surface(i%3?"#465157":"#687277",new THREE.SphereGeometry(1,8,6).scale(.007,.018,.002)
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n)).translate(x,y+.002,z));
  }
  return glow(s.finish(),emit);
}

export const SCULPTS_X_DEVICES:Record<string,()=>THREE.BufferGeometry>={mon_growtimer:growtimer,mon_mouse:mouse};
