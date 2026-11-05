import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],radius:number,steps=24,sides=6) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  s.surface(color,new THREE.TubeGeometry(curve,steps,radius,sides,false));
}
function turned(s:Sculpt,color:string,profile:[number,number][],p:P=[0,0,0],segments=64) {
  s.surface(color,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),segments).translate(...p));
}

/** #146: a complete cast drain cover with deep openings and eyes behind the bars. */
function gratecover() {
  const s=new Sculpt({detail:"high"}),tilt=-.66,centerY=.59;
  const local=(color:string,g:THREE.BufferGeometry)=>s.surface(color,g.rotateX(tilt).translate(0,centerY,0));
  const ring=(outer:number,inner:number,depth:number,bevel:number,z:number,color:string)=>{
    const shape=new THREE.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);
    const hole=new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);
    local(color,new THREE.ExtrudeGeometry(shape,{depth,curveSegments:40,bevelEnabled:true,
      bevelSize:bevel,bevelThickness:bevel,bevelSegments:2}).translate(0,0,z));
  };
  ring(.678,.537,.086,.012,-.015,"#8e8982");
  ring(.635,.57,.014,.006,.079,"#b6afa4");
  ring(.671,.551,.028,.008,-.102,"#5e5b59");
  // A recessed dished backing leaves genuine air/depth between the bars and bowl.
  const bowl=new THREE.LatheGeometry([[0,-.215],[.35,-.215],[.51,-.196],[.548,-.151],
    [.555,-.054],[.543,-.043],[.526,-.144],[.49,-.176],[.34,-.193],[0,-.193]].map(p=>new THREE.Vector2(...p)),64);
  local("#33343a",bowl.rotateX(Math.PI/2));
  for(let i=-3;i<=3;i++) {
    const x=i*.143,height=2*Math.sqrt(.55**2-x*x);
    local(i%2?"#777875":"#92918b",new RoundedBoxGeometry(.055,height,.115,3,.013).translate(x,0,.002));
    local("#c0b9a9",new RoundedBoxGeometry(.013,height-.025,.009,2,.004).translate(x-.014,0,.063));
    // Casting scars run across actual front and back edges, not over the openings.
    for(let k=0;k<4;k++) {
      const y=(k/3-.5)*(height-.11);
      local(k%2?"#6b5f52":"#aca08b",new THREE.SphereGeometry(1,8,6).scale(.017,.009,.003).translate(x+.004,y,.063));
    }
  }
  local("#96958d",new RoundedBoxGeometry(1.075,.054,.114,3,.013).translate(0,.019,.005));
  local("#bbb5aa",new RoundedBoxGeometry(1.05,.011,.009,2,.004).translate(0,.035,.068));
  for(const side of [-1,1]) {
    const x=side*.215;
    local("#17171f",new THREE.SphereGeometry(1,24,16).scale(.105,.079,.034).translate(x,-.17,-.09));
    local("#87235e",new THREE.SphereGeometry(1,24,16).scale(.065,.039,.017).translate(x,-.179,-.05));
    local("#dc4abb",new THREE.SphereGeometry(1,20,12).scale(.045,.021,.009).translate(x,-.178,-.033));
    local("#ffc4f4",new THREE.SphereGeometry(1,12,8).scale(.019,.008,.004).translate(x-side*.012,-.174,-.023));
    const brow=new THREE.CatmullRomCurve3([[x-side*.065,-.105,-.035],[x,-.13,-.022],[x+side*.061,-.133,-.04]].map(p=>new THREE.Vector3(...p)));
    local("#282330",new THREE.TubeGeometry(brow,14,.013,6,false));
  }
  // Stamped rim grooves, recessed screws and irregular oxidation on both sides.
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6,x=Math.cos(a)*.605,y=Math.sin(a)*.605;
    local("#514d49",new THREE.SphereGeometry(1,12,8).scale(.015,.015,.005).translate(x,y,.1));
    const groove=new THREE.BoxGeometry(.018,.003,.002).rotateZ(a+.4).translate(x,y,.106);local("#c2bba9",groove);
  }
  for(let i=0;i<32;i++) {
    const a=i*2.399963,r=.65+(i%3)*.004;
    local(i%3?"#6f665a":"#c2b7a5",new THREE.SphereGeometry(1,8,6).scale(.008,.018,.003)
      .rotateZ(a).translate(Math.cos(a)*r,Math.sin(a)*r,.078));
  }
  // Legs follow the low squat source silhouette and remain separate from the ring.
  for(const side of [-1,1]) {
    s.rod("#625c59",[side*.46,.3,.2],[side*.49,.095,.25],.028);
    oval(s,"#8c8780",[side*.49,.075,.25],[.048,.03,.047],16,10);
    s.rod("#474348",[side*.3,.28,-.32],[side*.32,.12,-.35],.033);
    oval(s,"#716b66",[side*.33,.101,-.35],[.068,.035,.072],16,10);
  }
  // Rear foundry stamp and reinforcing beads complete the hidden side.
  local("#5a5550",new RoundedBoxGeometry(.39,.14,.018,3,.015).translate(0,.19,-.214));
  for(let i=0;i<6;i++)local("#8c8170",new RoundedBoxGeometry(.024,.079,.004,2,.003).translate(-.145+i*.058,.19,-.225));
  return s.finish();
}

/** A soft tapered volume transported along the original steam silhouette. */
function vapor(s:Sculpt,color:string,points:P[],radius:number) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps=26,sides=14;
  const g=new THREE.TubeGeometry(curve,steps,1,sides,false),p=g.getAttribute("position");
  for(let i=0;i<=steps;i++) {
    const t=i/steps,c=curve.getPointAt(t),r=radius*(.12+.88*Math.sin(Math.PI*t)**.7);
    for(let j=0;j<=sides;j++) {
      const k=i*(sides+1)+j,v=new THREE.Vector3().fromBufferAttribute(p,k).sub(c).multiplyScalar(r).add(c);
      p.setXYZ(k,v.x,v.y,v.z);
    }
  }
  g.computeVertexNormals();s.surface(color,g);
  for(const point of [points[0],points[points.length-1]])oval(s,color,point,[radius*.12,radius*.12,radius*.12],10,6);
}

/** #149: porcelain/mint reservoir, sleepy face, open nozzle and sculpted steam. */
function humidifier() {
  const s=new Sculpt({detail:"high"});
  turned(s,"#b5dfc5",[[0,.09],[.175,.09],[.27,.12],[.354,.185],[.402,.28],[.416,.388],[.412,.446],[0,.446]]);
  turned(s,"#eceff0",[[0,.444],[.413,.444],[.41,.51],[.38,.62],[.333,.729],[.255,.837],
    [.159,.908],[.113,.925],[0,.925]]);
  turned(s,"#e0f6e7",[[.401,.423],[.42,.433],[.426,.448],[.419,.462],[.411,.464],[.406,.449],[.401,.423]]);
  turned(s,"#78ac99",[[0,.086],[.16,.086],[.252,.106],[.26,.123],[.226,.134],[0,.134]], [0,0,0],48);
  for(const x of [-.208,.208]) {
    oval(s,"#7a9b98",[x,.089,.09],[.055,.023,.065],16,10);
    oval(s,"#a9c6bc",[x,.098,.111],[.042,.009,.039],12,8);
  }
  // A truly open concentric outlet, with a dark inner throat below the steam.
  turned(s,"#84b39c",[[.065,.894],[.126,.894],[.137,.922],[.13,.951],[.101,.969],[.064,.96],[.065,.894]],[0,0,0],64);
  turned(s,"#d5efcf",[[.066,.953],[.104,.953],[.112,.969],[.103,.981],[.063,.979],[.055,.968],[.066,.953]],[0,0,0],48);
  turned(s,"#385e59",[[0,.915],[.065,.915],[.066,.95],[.055,.952],[.05,.927],[0,.927]],[0,0,0],40);
  const eyeY=.639;
  for(const side of [-1,1]) {
    const x=side*.164,z=.321;
    oval(s,"#a6b6bc",[x,eyeY,z],[.096,.075,.026],24,16);
    oval(s,"#fafdf6",[x,eyeY-.008,z+.022],[.078,.052,.018],24,16);
    oval(s,"#2b394a",[x,eyeY-.011,z+.038],[.044,.035,.008],20,12);
    oval(s,"#6a9b99",[x,eyeY-.02,z+.044],[.027,.018,.003],16,10);
    oval(s,"#effbf2",[x-.012,eyeY+.002,z+.046],[.012,.013,.003],12,8);
    // Half-lidded white eyelids and bowed grey brows retain the original expression.
    oval(s,"#e0e8e6",[x,eyeY+.03,z+.033],[.086,.031,.025],24,12);
    cord(s,"#849698",[[x-.074,eyeY+.022,z+.044],[x,eyeY+.014,z+.058],[x+.074,eyeY+.025,z+.044]],.006,18);
    cord(s,"#718388",[[x-.054,.751,.26],[x,.76,.277],[x+.045,.748,.27]],.009,18);
  }
  // A recessed water-drop badge follows the curved front of the mint reservoir.
  const drop=new THREE.Shape();drop.moveTo(0,.386);drop.bezierCurveTo(-.018,.35,-.065,.319,-.058,.282);
  drop.bezierCurveTo(-.05,.228,.049,.225,.06,.28);drop.bezierCurveTo(.067,.311,.022,.351,0,.386);
  s.surface("#557f80",new THREE.ExtrudeGeometry(drop,{depth:.008,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:3,curveSegments:20}).translate(0,0,.402));
  const inner=drop.clone();s.surface("#ddf4d6",new THREE.ExtrudeGeometry(inner,{depth:.007,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:20}).scale(.69,.69,1).translate(0,.094,.417));
  oval(s,"#fffdf0",[-.019,.304,.431],[.008,.018,.003],12,8);
  // Tiny smooth droplets and moulded highlights sit on the shell's actual surface.
  for(let i=0;i<12;i++) {
    const a=.8+i*.43,y=.21+(i%4)*.045,r=.375+(y-.21)*.18;
    oval(s,i%2?"#d5eede":"#99cdb7",[Math.sin(a)*r,y,Math.cos(a)*r],[.012,.019,.009],10,6);
  }
  // Rear moulding seam, ventilation and a real recessed power inlet/short cable.
  cord(s,"#c6d0cc",[[0,.888,-.175],[0,.76,-.313],[0,.595,-.394],[0,.467,-.417]],.004,28);
  for(let i=0;i<5;i++)s.roundedBox("#889e9b",0,.523+i*.036,-.394+i*.013,.19-i*.014,.011,.012,.005);
  s.roundedBox("#7ea897",.18,.246,-.337,.107,.074,.022,.016,0,-.42);
  s.roundedBox("#354b51",.18,.245,-.352,.061,.036,.016,.011,0,-.42);
  cord(s,"#677e7c",[[.182,.242,-.365],[.22,.19,-.431],[.311,.132,-.449],[.35,.103,-.425]],.012,20,8);
  oval(s,"#829c96",[.35,.103,-.425],[.018,.015,.018],12,8);
  // Volumetric pale curls follow the source; no particle, transparency or light pass.
  vapor(s,"#dff4e4",[[0,.964,0],[-.025,1.07,.005],[.037,1.148,-.008],[.01,1.239,-.008]],.055);
  vapor(s,"#e9f7e8",[[.006,1.169,-.009],[-.074,1.256,.005],[-.044,1.325,.013],[.067,1.368,-.006],[.046,1.451,-.013]],.086);
  vapor(s,"#dcf0df",[[.035,1.359,-.012],[.115,1.423,-.025],[.073,1.509,-.025],[-.021,1.546,-.017]],.08);
  vapor(s,"#edf9ec",[[-.02,1.477,-.01],[-.082,1.558,.002],[-.026,1.627,.009],[.023,1.671,0]],.07);
  return s.finish();
}

export const SCULPTS_T_FIXTURES:Record<string,()=>THREE.BufferGeometry>={mon_gratecover:gratecover,mon_humidifier:humidifier};
