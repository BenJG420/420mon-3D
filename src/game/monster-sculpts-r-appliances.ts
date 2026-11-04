import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function cord(s:Sculpt,color:string,points:P[],radius:number,steps=28,sides=8) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,radius,sides,false));
}
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function turn(s:Sculpt,color:string,profile:[number,number][],p:P=[0,0,0],segments=48) {
  s.surface(color,new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),segments).translate(...p));
}
function smallBox(s:Sculpt,color:string,p:P,size:P,r=.006,rotation:P=[0,0,0]) {
  s.surface(color,new RoundedBoxGeometry(...size,2,r).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation))).translate(...p));
}
function rect(w:number,h:number,r:number,x=0,y=0) {
  const shape=new THREE.Shape(),l=x-w/2,b=y-h/2;
  shape.moveTo(l+r,b);shape.lineTo(l+w-r,b);shape.quadraticCurveTo(l+w,b,l+w,b+r);
  shape.lineTo(l+w,b+h-r);shape.quadraticCurveTo(l+w,b+h,l+w-r,b+h);
  shape.lineTo(l+r,b+h);shape.quadraticCurveTo(l,b+h,l,b+h-r);
  shape.lineTo(l,b+r);shape.quadraticCurveTo(l,b,l+r,b);return shape;
}

/** #137 — an open tapered can, rolled rim, perforated rose and original blue drip. */
function watercan() {
  const s=new Sculpt({detail:"high"}),green="#6d9c27",light="#9fbd48",dark="#355f20";
  // A closed wall section leaves a real deep fill cavity, including its floor.
  turn(s,green,[[0,.17],[.279,.17],[.324,.185],[.343,.221],[.34,.279],[.317,.55],
    [.284,.879],[.259,.972],[.24,1.002],[.224,.986],[.243,.891],[.286,.3],[.291,.231],[0,.231],[0,.17]], [0,0,0],64);
  turn(s,"#315c21",[[.22,.98],[.239,.888],[.282,.3],[.286,.237],[.18,.236],[0,.236]], [0,0,0],64);
  s.torus(light,0,.991,0,.239,.019,Math.PI/2);
  s.torus("#456d20",0,.965,0,.255,.009,Math.PI/2);
  turn(s,"#456c21",[[.301,.184],[.338,.184],[.356,.202],[.352,.228],[.327,.247],[.304,.237],[.301,.184]]);
  s.torus("#a0ba4c",0,.223,0,.344,.009,Math.PI/2);
  // Long open handle is attached at two bosses; its inside remains empty.
  const handle:P[]=[[.237,.866,-.018],[.365,1.053,-.035],[.545,1.06,-.039],
    [.619,.963,-.03],[.593,.756,-.013],[.452,.516,.008],[.321,.377,.02]];
  cord(s,"#456e21",handle,.034,52,12);
  cord(s,"#94b53c",handle.map(([x,y,z])=>[x-.007,y+.005,z+.027]),.009,52,6);
  for(const p of [handle[0],handle[handle.length-1]]) {
    oval(s,dark,p,[.045,.056,.043],16,10);
    oval(s,"#b3bf64",[p[0],p[1],p[2]+.039],[.013,.014,.005],12,8);
  }
  // Curved, genuinely tubular spout. Reversed winding makes the bore face inward.
  const points:P[]=[[-.274,.405,.016],[-.436,.559,.014],[-.605,.739,.011],[-.749,.86,.014]];
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  s.surface("#729e29",new THREE.TubeGeometry(path,36,.049,16,false));
  const inner=new THREE.TubeGeometry(path,36,.035,12,false),index=inner.getIndex()!;
  for(let i=0;i<index.count;i+=3){const a=index.getX(i);index.setX(i,index.getX(i+2));index.setX(i+2,a);}inner.computeVertexNormals();s.surface(dark,inner);
  cord(s,"#a0bb4b",points.map(([x,y,z])=>[x-.004,y+.01,z+.039]),.006,32,6);
  oval(s,"#4a7620",points[0],[.069,.071,.065],20,12);
  // A hollow flared rose with seven actual drilled apertures in its face plate.
  const roseOrigin=new THREE.Vector3(-.798,.921,.019),normal=new THREE.Vector3(-.64,.72,.27).normalize();
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
  const rose=(color:string,g:THREE.BufferGeometry)=>s.surface(color,g.applyQuaternion(rotation).translate(roseOrigin.x,roseOrigin.y,roseOrigin.z));
  rose("#527d24",new THREE.LatheGeometry([[.04,-.11],[.058,-.098],[.093,-.063],[.126,-.018],
    [.129,.009],[.115,.019],[.108,-.004],[.077,-.055],[.035,-.095],[.04,-.11]].map(v=>new THREE.Vector2(...v)),48).rotateX(Math.PI/2));
  const face=new THREE.Shape();face.absarc(0,0,.115,0,Math.PI*2,false);
  const holes:P[]=[[0,0,0]];
  for(let i=0;i<6;i++){const a=i*Math.PI/3;holes.push([Math.sin(a)*.069,Math.cos(a)*.069,0]);}
  for(const [x,y] of holes){const hole=new THREE.Path();hole.absarc(x,y,.018,0,Math.PI*2,true);face.holes.push(hole);}
  rose("#a9c958",new THREE.ExtrudeGeometry(face,{depth:.012,bevelEnabled:true,bevelSegments:2,bevelSize:.003,bevelThickness:.003,curveSegments:8}).translate(0,0,.012));
  rose("#bed46e",new THREE.TorusGeometry(.12,.008,8,48).translate(0,0,.02));
  for(const [x,y] of holes)rose("#537c23",new THREE.TorusGeometry(.018,.0027,6,16).translate(x,y,.023));
  // Deep green body seams and subtle embossed facets continue onto the back.
  for(let i=0;i<8;i++) {
    const a=.41+i*Math.PI/4;
    const pts:P[]=[];for(let j=0;j<=12;j++){const y=.29+j*.05,r=.338-(y-.28)*.091;pts.push([Math.sin(a)*r,y,Math.cos(a)*r]);}
    cord(s,i%3?"#648d26":"#89aa35",pts,.0045,20,6);
  }
  for(const side of [-1,1]) {
    const x=side*.116;
    oval(s,"#466b24",[x,.591,.289],[.057,.093,.028]);
    oval(s,"#b5c685",[x,.603,.312],[.038,.073,.015],18,12);
    oval(s,"#172617",[x,.589,.325],[.028,.057,.01],18,12);
    oval(s,"#f0efd8",[x-.007,.627,.335],[.013,.017,.003],12,8);
    oval(s,dark,[side*.199,.127,.018],[.104,.063,.116]);
    oval(s,"#80a82e",[side*.213,.126,.08],[.086,.05,.103]);
    s.rod("#a7bd59",[side*.213-.044,.142,.166],[side*.213+.044,.142,.166],.004);
  }
  // Original blue tear hangs beneath the rose; no new particle or light pass.
  turn(s,"#208ce2",[[0,0],[.027,.004],[.047,.025],[.047,.06],[.031,.086],[.012,.119],[0,.145]],[-.887,.459,.014],32);
  oval(s,"#6bd5ff",[-.896,.511,.048],[.022,.032,.012],16,10);
  oval(s,"#d1f6ff",[-.902,.528,.058],[.008,.016,.004],10,6);
  smallBox(s,"#4d7825",[0,.618,-.31],[.107,.043,.013],.006);
  for(let i=0;i<3;i++)s.box("#8ca741",0,.563-i*.026,-.319,.158-i*.027,.006,.004);
  const geometry=s.finish();
  geometry.userData.sculptFeatures=["deep open tapered fill cavity and rolled rim","open curved handle and hollow spout","seven actual rose perforations","green body seams, eyes and feet","sculpted blue drip"];
  return geometry;
}

/** #138 — complete adapter housing, recessed amber eyes and curved USB-ended cable. */
function powerbrick() {
  const s=new Sculpt({detail:"high"}),black="#29272c",shade="#14141b",edge="#4d4b53",amber="#ffbd37",hot="#ffeb98";
  // Thick two-part shell and stepped lip keep a real visible case depth.
  s.surface(black,new RoundedBoxGeometry(1.019,.68,.574,5,.046).translate(0,.616,-.024));
  s.roundedBox("#35323b",0,.296,-.012,1.035,.113,.598,.031);
  s.roundedBox("#15151c",0,.354,-.012,1.036,.023,.602,.008);
  s.roundedBox("#48454d",0,.373,.278,1.005,.018,.026,.007);
  // The front eye panel has actual apertures and bevelled lens surrounds.
  const panel=rect(.988,.496,.032,0,.653);
  for(const x of [-.269,.269])panel.holes.push(rect(.19,.194,.018,x,.645));
  s.surface("#3c3942",new THREE.ExtrudeGeometry(panel,{depth:.022,bevelEnabled:true,bevelSegments:3,bevelSize:.006,bevelThickness:.006,curveSegments:6}).translate(0,0,.267));
  for(const x of [-.269,.269]) {
    smallBox(s,shade,[x,.645,.265],[.184,.189,.035],.012);
    const frame=rect(.188,.191,.017,x,.645);frame.holes.push(rect(.138,.144,.012,x,.645));
    s.surface("#6e5a36",new THREE.ExtrudeGeometry(frame,{depth:.019,bevelEnabled:true,bevelSegments:2,bevelSize:.004,bevelThickness:.004,curveSegments:5}).translate(0,0,.285));
    smallBox(s,"#aa762d",[x,.645,.299],[.137,.143,.016],.01);
    s.roundedBox(amber,x,.646,.309,.108,.118,.018,.014);
    smallBox(s,hot,[x-.014,.657,.322],[.052,.079,.009],.007);
    s.box("#d09234",x,.581,.322,.092,.007,.004);
  }
  // Vents under the eyes, tapered edge mouldings and fine corner screws.
  for(const side of [-1,1]) {
    for(let i=0;i<3;i++) {
      const x=side*.301+(i-1)*.063;
      smallBox(s,shade,[x,.293,.292],[.038,.041,.019],.006);
      s.box("#58525f",x,.271,.306,.038,.004,.003);
    }
    for(const z of [-.213,.19]) {
      oval(s,"#15111b",[side*.351,.172,z],[.095,.047,.101],16,10);
      oval(s,"#443648",[side*.351,.151,z+.004],[.068,.023,.071],16,10);
    }
    for(const y of [.435,.869]) {
      s.rod("#1a1820",[side*.462,y,.291],[side*.462,y,.302],.013);
      s.box("#77707b",side*.462,y,.305,.015,.003,.003,0,0,.4);
    }
  }
  // An integral strain relief feeds the full curved cable; no floating cable ends.
  s.rod(shade,[.485,.534,-.035],[.61,.534,-.035],.046);
  for(let i=0;i<4;i++)s.surface(edge,new THREE.TorusGeometry(.044,.007,6,20).rotateY(Math.PI/2).translate(.513+i*.025,.534,-.035));
  const cable:P[]=[[.607,.534,-.035],[.766,.485,-.025],[.9,.374,.001],[.928,.246,.02],[.838,.149,.04],[.737,.128,.052]];
  cord(s,"#19151e",cable,.023,56,10);
  cord(s,"#47404c",cable.map(([x,y,z])=>[x,y+.005,z+.018]),.004,56,6);
  // Detailed USB-like rectangular connector with an actual open front shell.
  smallBox(s,"#25212c",[.711,.128,.052],[.151,.102,.118],.014);
  smallBox(s,"#4c4652",[.718,.129,.101],[.087,.051,.013],.007);
  const connector=rect(.115,.085,.007,0,0);connector.holes.push(rect(.087,.055,.004,0,0));
  const plugRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,-Math.PI/2,0));
  s.surface("#aaa3ac",new THREE.ExtrudeGeometry(connector,{depth:.088,bevelEnabled:true,bevelSegments:2,bevelSize:.002,bevelThickness:.002,curveSegments:4})
    .applyQuaternion(plugRotation).translate(.645,.128,.052));
  s.box("#1a1821",.615,.122,.052,.053,.012,.073);
  for(let i=0;i<4;i++)s.box("#b6a16d",.601,.131,.026+i*.017,.03,.004,.007);
  // Rear inset service plate, molded label, two connector recesses and cooling ribs.
  s.roundedBox("#1c1a23",0,.623,-.322,.735,.409,.026,.021);
  smallBox(s,"#5a5560",[-.08,.66,-.342],[.432,.202,.013],.012);
  for(let i=0;i<7;i++)s.box("#29252f",-.08,.724-i*.022,-.35,.359-(i%3)*.041,.005,.004);
  for(let i=0;i<12;i++)s.box(i%2?"#77707c":"#34303a",-.242+i*.027,.583,-.351,.009,.023,.004);
  for(const x of [-.273,.273])for(const y of [.471,.779]) {
    s.rod("#736c78",[x,y,-.338],[x,y,-.351],.013);
    s.box("#29232e",x,y,-.353,.015,.003,.003);
  }
  for(let i=0;i<8;i++) {
    const z=-.227+i*.062;
    s.box("#14131a",-.518,.531,z,.008,.181,.018);
    s.box("#55505b",-.524,.428,z,.004,.012,.019);
  }
  // Longitudinal shell ridges remain shallow; soft top highlights retain source shape.
  for(const x of [-.394,.394])cord(s,"#55505b",[[x,.925,-.248],[x,.961,-.169],[x,.961,.133],[x,.929,.222]],.005,26,6);
  s.box("#1b1821",.18,.89,-.325,.1,.019,.006);
  const geometry=s.finish(),colors=geometry.getAttribute("color"),weights=new Float32Array(colors.count);
  const emit=[amber,hot].map(c=>new THREE.Color(c));
  for(let i=0;i<colors.count;i++)if(emit.some(c=>Math.abs(colors.getX(i)-c.r)<.00001&&Math.abs(colors.getY(i)-c.g)<.00001&&Math.abs(colors.getZ(i)-c.b)<.00001))weights[i]=.85;
  geometry.setAttribute("glowWeight",new THREE.BufferAttribute(weights,1));geometry.userData.glowSurface=true;
  geometry.userData.sculptFeatures=["full two-part beveled adapter shell","recessed amber LED lenses with isolated emission","lower vents and back plate ribs","curved cable with strain relief","open metal plug shell and four contacts"];
  return geometry;
}

export const SCULPTS_R_APPLIANCES:Record<string,()=>THREE.BufferGeometry>={mon_watercan:watercan,mon_powerbrick:powerbrick};
