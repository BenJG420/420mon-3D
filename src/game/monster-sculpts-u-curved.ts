import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],r:number,steps=32,sides=8,closed=false) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed);
  s.surface(color,new THREE.TubeGeometry(curve,steps,r,sides,closed));
}
function turn(s:Sculpt,color:string,profile:[number,number][],segments=64) {
  s.surface(color,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),segments));
}

/** #153 — thick, genuinely hollow stone mortar with loose green herbs and pestle. */
function mortar() {
  const s=new Sculpt({detail:"high"});
  // One continuous wall follows the rounded outer bowl, lip, inner cavity and floor.
  turn(s,"#92969a",[[0,.082],[.257,.082],[.322,.105],[.389,.177],[.457,.292],
    [.506,.437],[.539,.598],[.552,.756],[.551,.863],[.532,.901],[.496,.917],
    [.457,.904],[.439,.879],[.436,.82],[.421,.693],[.388,.583],[.324,.503],
    [.234,.464],[0,.456]],80);
  // The inner bowl has its own darkened stone and continuous rounded lip.
  turn(s,"#5d6566",[[.438,.858],[.436,.824],[.422,.699],[.389,.59],
    [.324,.509],[.234,.469],[0,.462]],64);
  s.surface("#c4c7c5",new THREE.TorusGeometry(.496,.026,10,64).rotateX(Math.PI/2).translate(0,.899,0));
  s.surface("#676d70",new THREE.TorusGeometry(.294,.011,6,48).rotateX(Math.PI/2).translate(0,.092,0));
  // Rounded black source eyes sit on the actual curved front, not on a flat plate.
  for(const side of [-1,1]) {
    const x=side*.208;
    oval(s,"#575c5c",[x,.415,.457],[.083,.088,.027],24,14);
    oval(s,"#151a1a",[x,.415,.482],[.058,.064,.018],24,16);
    oval(s,"#38413b",[x+.01,.4,.496],[.034,.033,.005],16,10);
    oval(s,"#f3f0d5",[x-.017,.44,.499],[.021,.023,.006],16,10);
    oval(s,"#aebc9b",[x+.023,.394,.501],[.009,.01,.003],10,6);
  }
  // Fine uneven stone inclusions are tangent to the curved sides and back.
  const radii=(y:number)=>y<.29?.39+(y-.18)*.60:y<.6?.457+(y-.29)*.26:.538+(y-.6)*.04;
  const flecks=["#bdc0bb","#737a7c","#a7afab","#646d70","#d2d2c8"];
  for(let i=0;i<76;i++) {
    const y=.19+(i%13)*.05,a=i*2.399963,r=radii(y),x=Math.sin(a)*r,z=Math.cos(a)*r;
    // Keep the two eye silhouettes free of any added inclusions.
    if(z>.33&&Math.abs(y-.415)<.105&&Math.abs(Math.abs(x)-.208)<.10)continue;
    const normal=new THREE.Vector3(Math.sin(a),-.2,Math.cos(a)).normalize();
    const g=new THREE.SphereGeometry(1,8,6).scale(.009+(i%4)*.006,.012+(i%3)*.008,.0035)
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal)).translate(x,y,z);
    s.surface(flecks[i%flecks.length],g);
  }
  // Scuffed contact arcs and tiny chips follow the top rim, including its rear.
  for(let i=0;i<16;i++) {
    const a=i*Math.PI/8,r=.501,x=Math.sin(a)*r,z=Math.cos(a)*r;
    oval(s,i%3?"#dde0d6":"#6e7774",[x,.922,z],[.012+(i%3)*.006,.004,.012],10,6);
  }
  // A low bed and separated chopped leaves expose the cavity around the pestle.
  oval(s,"#687d17",[0,.699,0],[.387,.046,.366],32,12);
  const herbs=["#b4d92f","#d4ec4a","#8eb71b","#accb29","#dce65e"];
  for(let i=0;i<38;i++) {
    const a=i*2.399963,r=.052+.30*Math.sqrt((i+.5)/38),x=Math.sin(a)*r,z=Math.cos(a)*r;
    const g=new THREE.DodecahedronGeometry(1,0).scale(.031+(i%3)*.012,.018+(i%4)*.006,.025+(i%5)*.006)
      .rotateY(a).rotateZ(.16*Math.sin(i)).translate(x,.753+(i%3)*.014,z);
    s.surface(herbs[i%herbs.length],g);
    if(i%3===0)cord(s,"#e4ef74",[[x-.018,.783+(i%3)*.014,z],[x,.79+(i%3)*.014,z+.012],[x+.023,.781+(i%3)*.014,z+.021]],.003,6,5);
  }
  // The diagonal pestle is a full turned shaft with a broad rounded grinding end.
  const origin=new THREE.Vector3(-.025,.719,-.042),angle=-.49;
  const pestle=(color:string,g:THREE.BufferGeometry)=>s.surface(color,g.rotateZ(angle).translate(origin.x,origin.y,origin.z));
  const profile:[number,number][]=[[0,0],[.075,.009],[.119,.041],[.142,.103],[.137,.155],
    [.11,.21],[.088,.276],[.078,.572],[.087,.665],[.112,.693],[.128,.739],[.119,.788],[.079,.815],[0,.821]];
  pestle("#a4a9a9",new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),64));
  pestle("#d0d1cb",new THREE.TorusGeometry(.112,.011,8,40).rotateX(Math.PI/2).translate(0,.765,0));
  pestle("#757e7c",new THREE.TorusGeometry(.09,.007,6,32).rotateX(Math.PI/2).translate(0,.269,0));
  // Small brushed/grinding scars wrap around the rear of the handle as well.
  for(let i=0;i<26;i++) {
    const a=i*2.399963,y=.29+(i%9)*.043,r=.079+(y>.57?(y-.57)*.09:0);
    const normal=new THREE.Vector3(Math.sin(a),0,Math.cos(a));
    const g=new THREE.SphereGeometry(1,8,6).scale(.006+(i%2)*.003,.019+(i%3)*.006,.0025)
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal)).translate(Math.sin(a)*r,y,Math.cos(a)*r);
    pestle(i%3?"#c4c8c3":"#737d7c",g);
  }
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4,points:P[]=[];
    for(let j=0;j<6;j++) {const t=j/5,r=.095+.03*Math.sin(t*Math.PI);points.push([Math.sin(a)*r,.039+t*.133,Math.cos(a)*r]);}
    pestle("#7b8581",new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),10,.003,5,false));
  }
  return s.finish();
}

/** #154 — fully wrapped lavender rope bundle, two red grips and a separate loose loop. */
function jumprope() {
  const s=new Sculpt({detail:"high"}),centerY=.744;
  oval(s,"#45435d",[0,centerY,0],[.449,.574,.392],28,18);
  const palette=["#696582","#77718f","#514e6d","#827d9b","#605b7b"];
  // Individual continuous wraps cross the front and continue around the full back.
  // Their subtle undulation retains the uneven wound silhouette of the source.
  for(let band=0;band<13;band++) {
    const base=.224+band*.083,points:P[]=[],highlight:P[]=[];
    for(let j=0;j<48;j++) {
      const a=j/48*Math.PI*2,phase=band<7?.63:-.72;
      const y=base+(.083+.019*Math.sin(band))*Math.sin(a+phase),v=(y-centerY)/.601;
      const radius=Math.sqrt(Math.max(.055,1-v*v));
      const x=Math.cos(a)*.458*radius,z=Math.sin(a)*.403*radius;
      points.push([x,y,z]);
      highlight.push([x+Math.cos(a)*.018,y+.019,z+Math.sin(a)*.018]);
    }
    cord(s,palette[band%palette.length],points,.037+(band%3)*.002,52,8,true);
    if(band%2===0)cord(s,"#9b94ad",highlight,.004,44,5,true);
  }
  // Two oblique top courses fold over the crown rather than ending at its silhouette.
  for(const side of [-1,1]) {
    const points:P[]=[];
    for(let j=0;j<48;j++) {
      const a=j/48*Math.PI*2;
      points.push([Math.cos(a)*.267,1.096+Math.sin(a)*.144,.241*Math.sin(a)+side*.026]);
    }
    cord(s,side>0?"#756e8d":"#5e5876",points,.032,40,8,true);
  }
  // Two short cloth-like feet remain visible below the winding.
  for(const side of [-1,1]) {
    oval(s,"#494658",[side*.269,.167,.054],[.105,.066,.142],24,14);
    oval(s,"#6b657c",[side*.276,.18,.133],[.079,.035,.074],18,10);
    cord(s,"#363446",[[side*.269-.047,.164,.18],[side*.269,.176,.197],[side*.269+.046,.166,.181]],.005,12,6);
  }
  // Each red grip has a hollow collar, turned rubber body, ridges and a rounded cap.
  for(const side of [-1,1]) {
    const angle=-side*.49,position=new THREE.Vector3(side*.282,1.114,.069);
    const handle=(color:string,g:THREE.BufferGeometry)=>s.surface(color,g.rotateZ(angle).translate(position.x,position.y,position.z));
    const profile:[number,number][]=[[0,0],[.074,0],[.089,.021],[.09,.056],[.079,.075],
      [.077,.249],[.064,.275],[.062,.332],[.046,.365],[0,.37]];
    handle("#d51d2d",new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),40));
    handle("#f74448",new THREE.LatheGeometry([[0,.272],[.058,.272],[.068,.289],[.064,.332],[.045,.359],[0,.366]].map(p=>new THREE.Vector2(...p)),32));
    for(let i=0;i<5;i++)handle(i===0?"#9a172c":"#ed353f",new THREE.TorusGeometry(.078,.006,6,24).rotateX(Math.PI/2).translate(0,.094+i*.033,0));
    handle("#8a182b",new THREE.TorusGeometry(.075,.009,6,28).rotateX(Math.PI/2).translate(0,.035,0));
    for(const a of [-.6,.65]) {
      const points:P[]=[];for(let j=0;j<=8;j++)points.push([Math.sin(a)*.079,.084+j*.019,Math.cos(a)*.079]);
      handle("#ff5d58",new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),12,.003,5,false));
    }
  }
  // Loose red cable hangs freely to the left and under the bundle, returning behind it.
  const loose:P[]=[[-.436,1.431,.085],[-.586,1.159,.086],[-.655,.79,.115],[-.594,.427,.198],
    [-.357,.219,.327],[-.012,.143,.384],[.313,.213,.329],[.507,.519,-.17],[.532,.995,-.231],[.436,1.431,.085]];
  cord(s,"#bc1731",loose,.021,100,8);
  cord(s,"#f5484c",loose.map(([x,y,z])=>[x-.006,y+.007,z+.013]),.005,100,5);
  for(const p of [loose[0],loose[loose.length-1]])oval(s,"#a71a30",p,[.024,.027,.024],12,8);
  return s.finish();
}

export const SCULPTS_U_CURVED:Record<string,()=>THREE.BufferGeometry>={mon_mortar:mortar,mon_jumprope:jumprope};
