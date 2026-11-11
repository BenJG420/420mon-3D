import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=5) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function revolve(s:Sculpt,color:string,profile:[number,number][],steps=72) {
  s.surface(color,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),steps));
}
function ring(s:Sculpt,color:string,r:number,y:number,tube:number,segments=64,sides=6) {
  s.surface(color,new THREE.TorusGeometry(r,tube,sides,segments).rotateX(Math.PI/2).translate(0,y,0));
}

/** #175: the complete stacked metal grinder, with its face on the solid top lid. */
function grinder() {
  const s=new Sculpt({detail:"high"});
  // Closed lower shell: broad curved shoulders and several genuinely stepped tiers.
  revolve(s,"#69747a",[[0,.151],[.315,.151],[.407,.168],[.467,.207],[.5,.254],
    [.516,.329],[.524,.477],[.523,.614],[.509,.722],[.48,.786],[.42,.815],[0,.815]],80);
  ring(s,"#414d55",.516,.339,.012,64,5);
  ring(s,"#9ba6a8",.522,.361,.007,64,5);
  ring(s,"#3e4b54",.519,.628,.012,64,5);
  ring(s,"#b4bab7",.511,.661,.007,64,5);
  // Wide upper shoulder beneath the narrower, fluted hand-grip cylinder.
  revolve(s,"#86918f",[[.423,.773],[.465,.774],[.496,.802],[.496,.823],[.474,.85],
    [.444,.864],[.419,.864],[.419,.773]],80);
  s.surface("#273841",new THREE.CylinderGeometry(.437,.44,.218,80).translate(0,.968,0));
  // Actual separate rounded grip ribs leave deep vertical recesses around the full rim.
  for(let i=0;i<32;i++) {
    const a=i*Math.PI/16;
    s.surface(i%3?"#7e8b8d":"#949e9d",new RoundedBoxGeometry(.041,.201,.041,1,.006)
      .rotateY(a).translate(Math.sin(a)*.451,.974,Math.cos(a)*.451));
  }
  ring(s,"#a7b1ae",.448,.871,.014,64,6);
  ring(s,"#a9b2ac",.452,1.081,.013,64,6);
  // The top is solid and gently dished; the original grains and face rest on it.
  revolve(s,"#929a91",[[0,1.068],[.425,1.068],[.456,1.082],[.462,1.097],
    [.455,1.117],[.432,1.132],[.35,1.144],[.21,1.147],[0,1.147]],80);
  ring(s,"#bcc0aa",.437,1.128,.005,64,5);
  // Both dark eyes look upward and forward, rather than being hidden under the lid.
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(0,.88,.48).normalize());
  for(const side of [-1,1]) {
    const x=side*.185,p=new THREE.Vector3(x,1.143,.074),n=new THREE.Vector3(0,.88,.48).normalize();
    const eye=(color:string,size:P,offset:number,w=20,h=12)=>{
      const v=p.clone().addScaledVector(n,offset);
      s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).applyQuaternion(q).translate(v.x,v.y,v.z));
    };
    eye("#424e4b",[.083,.083,.016],.01,20,12);
    eye("#c0c9b3",[.069,.069,.017],.026,20,12);
    eye("#17211f",[.055,.059,.021],.044,24,16);
    eye("#030b0b",[.04,.045,.012],.059,20,12);
    const glint=p.clone().addScaledVector(n,.063).add(new THREE.Vector3(-.018,.015,-.009));
    s.surface("#f5ffde",new THREE.SphereGeometry(1,12,8).scale(.015,.016,.005).applyQuaternion(q).translate(glint.x,glint.y,glint.z));
  }
  // Two shallow, dark mouth slots and a silver lower edge match the neutral source face.
  for(const z of [.262,.302]) {
    s.surface("#34423e",new RoundedBoxGeometry(.21,.007,.019,1,.004).translate(0,1.147,z));
    cord(s,"#c4c6a8",[[-.098,1.151,z+.012],[0,1.152,z+.014],[.098,1.151,z+.012]],.0025,16,5);
  }
  // Individual beige granules retain the sprite's scattered texture as modeled relief.
  for(let i=0;i<38;i++) {
    const a=i*2.399963,r=.12+.287*Math.sqrt((i+.5)/38),x=Math.sin(a)*r,z=Math.cos(a)*r;
    if((Math.abs(x-.185)<.105||Math.abs(x+.185)<.105)&&Math.abs(z-.074)<.115)continue;
    if(Math.abs(x)<.13&&z>.22)continue;
    const y=1.147-Math.max(0,r-.21)*.0215-Math.max(0,r-.35)*.1248;
    s.surface(i%3?"#c6a66c":"#e6cb8b",new THREE.SphereGeometry(1,8,6)
      .scale(.012+(i%3)*.003,.007+(i%2)*.004,.011+(i%4)*.002).rotateY(a).translate(x,y+.006,z));
  }
  for(let i=0;i<27;i++) {
    const a=i*Math.PI*2/27,r=.466;
    oval(s,i%3?"#c5a773":"#e3c98f",[Math.sin(a)*r,.858,Math.cos(a)*r],[.015,.009,.013],8,6);
  }
  // Four stout original feet have rounded toes, soles and the same metal finish.
  for(const side of [-1,1])for(const z of [-.253,.253]) {
    oval(s,"#444f55",[side*.305,.141,z],[.113,.09,.135],16,10);
    oval(s,"#778386",[side*.314,.132,z+.021],[.102,.063,.122],18,10);
    s.surface("#38434a",new RoundedBoxGeometry(.147,.027,.17,1,.011).translate(side*.311,.076,z+.013));
  }
  // Small side lugs and fasteners are physically attached to the main shell.
  for(const side of [-1,1]) {
    oval(s,"#49565e",[side*.52,.547,0],[.026,.073,.071],16,10);
    s.surface("#a6adab",new THREE.CylinderGeometry(.028,.028,.012,16).rotateZ(Math.PI/2).translate(side*.547,.548,0));
    s.box("#3c4a50",side*.554,.548,0,.003,.031,.006);
  }
  // Fine wear follows the real curved shell all the way round, including the rear.
  for(let i=0;i<16;i++) {
    const a=i*2.399963,y=.398+(i%4)*.049,points:P[]=[];
    for(let j=0;j<=8;j++){const angle=a+j*.014;points.push([Math.sin(angle)*.525,y+.003*Math.sin(j),Math.cos(angle)*.525]);}
    cord(s,i%3?"#8e9a9c":"#4c5c64",points,.002,10,4);
  }
  // Underside service rings give the model a finished bottom when inspected in the Dex.
  ring(s,"#35444e",.289,.151,.006,48,5);
  ring(s,"#8d9999",.227,.148,.005,48,5);
  return s.finish();
}

/** #177: a true open lime funnel, continuous inner wall, open throat and source drops. */
function funnel() {
  const s=new Sculpt({detail:"high"});
  const outer:[number,number][]=[[.069,.297],[.076,.33],[.076,.448],[.086,.513],[.108,.567],
    [.14,.628],[.18,.709],[.224,.798],[.268,.891],[.311,.986],[.35,1.081],[.388,1.175],
    [.423,1.267],[.456,1.356],[.466,1.399]];
  const inner:[number,number][]=[[.438,1.399],[.432,1.356],[.402,1.267],[.367,1.175],
    [.329,1.081],[.29,.986],[.247,.891],[.203,.798],[.159,.709],[.119,.628],
    [.087,.567],[.057,.513],[.046,.448],[.046,.33],[.045,.297]];
  // Ascending outer and descending inner profiles have outward/inward normals respectively.
  // Neither profile meets radius zero: the opening runs through to the hollow outlet.
  revolve(s,"#acc52c",outer,96);
  revolve(s,"#758d20",inner,96);
  revolve(s,"#bed43b",[[.466,1.399],[.496,1.409],[.509,1.427],[.508,1.445],
    [.493,1.458],[.474,1.461],[.452,1.452],[.44,1.432],[.438,1.399]],96);
  revolve(s,"#c8d544",[[.045,.297],[.048,.285],[.063,.285],[.069,.297]],64);
  ring(s,"#e3ec64",.482,1.453,.006,96,8);
  ring(s,"#8d9e22",.467,1.389,.005,80,6);
  ring(s,"#5e731d",.055,.326,.005,48,6);
  // Soft internal moulding rings descend into the hollow cone, emphasizing actual depth.
  for(const [r,y] of [[.397,1.267],[.324,1.081],[.242,.891],[.154,.709]])ring(s,"#819624",r,y,.003,64,5);
  // Tangent-space eye lenses sit outside the cone; no front disk flattens the face.
  for(const side of [-1,1]) {
    const x=side*.129,y=1.04,r=.333,z=Math.sqrt(r*r-x*x),p=new THREE.Vector3(x,y,z);
    const n=new THREE.Vector3(x/r,-.42,z/r).normalize();
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n);
    const eye=(color:string,size:P,offset:number,w=20,h=14)=>{
      const center=p.clone().addScaledVector(n,offset);
      s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).applyQuaternion(q).translate(center.x,center.y,center.z));
    };
    eye("#819326",[.052,.079,.012],.002,24,16);
    eye("#6e501b",[.039,.065,.014],.015,24,16);
    eye("#403811",[.027,.049,.01],.027,20,14);
    const light=p.clone().addScaledVector(n,.04).add(new THREE.Vector3(-.008,.022,.009));
    s.surface("#fff0b2",new THREE.SphereGeometry(1,14,10).scale(.012,.019,.005).applyQuaternion(q).translate(light.x,light.y,light.z));
    // Low cheek ridge follows the plastic's sloping profile, without an invented mouth.
    cord(s,"#c9db43",[[side*.19,.989,.261],[side*.18,.949,.246],[side*.155,.915,.237]],.003,16,5);
  }
  // Two original lower flanges turn outward from the narrow neck; softly bevelled solids.
  for(const side of [-1,1]) {
    const shape=new THREE.Shape();
    shape.moveTo(side*.061,.56);shape.quadraticCurveTo(side*.111,.514,side*.153,.432);
    shape.quadraticCurveTo(side*.194,.376,side*.224,.328);shape.quadraticCurveTo(side*.201,.311,side*.167,.333);
    shape.quadraticCurveTo(side*.092,.373,side*.051,.448);shape.closePath();
    s.surface("#99b52a",new THREE.ExtrudeGeometry(shape,{depth:.055,steps:1,curveSegments:12,bevelEnabled:true,
      bevelSize:.009,bevelThickness:.009,bevelSegments:3}).translate(0,0,-.022));
    cord(s,"#c3d747",[[side*.078,.52,.045],[side*.123,.434,.049],[side*.191,.346,.044]],.005,24,6);
  }
  // Two suspended yellow drops occupy space below the outlet, never closing the throat.
  oval(s,"#e3eb65",[0,.218,.006],[.028,.045,.029],24,16);
  oval(s,"#fff5b5",[-.008,.229,.027],[.008,.017,.004],12,8);
  oval(s,"#e6eb67",[0,.087,.009],[.018,.038,.018],20,14);
  oval(s,"#ffffc4",[-.005,.096,.022],[.005,.012,.003],10,8);
  // Continuous restrained mould seams and fine polished scratches wrap the whole vessel.
  for(let i=0;i<6;i++) {
    const a=i*Math.PI/3+.53,points:P[]=[];
    for(let j=3;j<outer.length-1;j++) {
      const [r,y]=outer[j],angle=a+.009*Math.sin(y*8);
      points.push([Math.sin(angle)*(r+.0015),y,Math.cos(angle)*(r+.0015)]);
    }
    cord(s,i%2?"#b8ce37":"#9bb52a",points,.0017,38,5);
  }
  for(let i=0;i<20;i++) {
    const a=i*2.399963,r=.477,points:P[]=[];
    for(let j=0;j<=5;j++){const q=a+j*.006;points.push([Math.sin(q)*r,1.461+Math.sin(j*.6)*.001,Math.cos(q)*r]);}
    cord(s,i%3?"#d3de51":"#9fae2a",points,.0015,8,4);
  }
  return s.finish();
}

export const SCULPTS_Y_VESSELS:Record<string,()=>THREE.BufferGeometry>={mon_grinder:grinder,mon_funnel:funnel};
