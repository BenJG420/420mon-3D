import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=16,h=10) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],radius:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,radius,sides,false));
}
function turn(s:Sculpt,color:string,profile:[number,number][],p:P,scale:P=[1,1,1],rotation:P=[0,0,0],segments=48) {
  s.surface(color,new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),segments).scale(...scale)
    .applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation))).translate(...p));
}
function plate(s:Sculpt,color:string,outline:[number,number][],z:number,depth=.012,front?:(x:number,y:number)=>number) {
  const shape=new THREE.Shape(outline.map(p=>new THREE.Vector2(...p)));
  const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.006,bevelThickness:.005,bevelSegments:3}).translate(0,0,z);
  if(front){const a=g.getAttribute("position");for(let i=0;i<a.count;i++)a.setZ(i,a.getZ(i)+front(a.getX(i),a.getY(i)));g.computeVertexNormals();}
  s.surface(color,g);
}
function stitch(s:Sculpt,color:string,from:P,to:P,r=.0025) {
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),d=b.clone().sub(a);
  const center=a.add(b).multiplyScalar(.5);
  s.surface(color,new THREE.CylinderGeometry(r,r,d.length(),6).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())).translate(center.x,center.y,center.z));
}

/** #142 — full padded red leather glove, separate thumb and an open stitched cuff. */
function boxglove() {
  const s=new Sculpt({detail:"high"}),red="#cd142b",dark="#760f25",light="#e33740";
  oval(s,"#a70d27",[.015,.681,-.01],[.405,.47,.304],32,22);
  oval(s,red,[.024,.739,.019],[.386,.423,.31],32,22);
  oval(s,"#df1c31",[.026,.853,.032],[.335,.304,.283],28,18);
  // The folded palm at the bottom and the projecting left thumb remain separate.
  oval(s,dark,[-.048,.304,.003],[.281,.15,.252],24,16);
  oval(s,"#bd1028",[-.087,.292,.052],[.25,.109,.243],24,16);
  oval(s,"#aa1029",[-.374,.586,.008],[.13,.224,.196],24,16);
  oval(s,"#d42435",[-.405,.638,.072],[.101,.165,.143],20,12);
  cord(s,"#700b25",[[-.297,.786,.179],[-.299,.633,.222],[-.259,.473,.216],[-.188,.377,.23]],.014,32,8);
  cord(s,"#eb4650",[[-.322,.756,.195],[-.33,.61,.211],[-.291,.473,.206]],.006,24,6);
  cord(s,"#850e25",[[-.253,.273,.17],[-.115,.235,.233],[.088,.246,.222],[.225,.314,.186]],.014,28,8);
  // Cuff is an annular leather section with a deep interior and rolled upper lip.
  turn(s,"#9d1228",[[0,0],[.22,0],[.273,.021],[.293,.071],[.286,.149],[.265,.179],
    [.211,.179],[.198,.15],[.198,.049],[0,.049]],[0,1.124,-.023],[1,1,.72]);
  turn(s,"#e22c3a",[[.215,.142],[.27,.142],[.293,.158],[.289,.187],[.268,.2],
    [.216,.199],[.203,.183],[.208,.158],[.215,.142]],[0,1.124,-.023],[1,1,.72]);
  oval(s,"#4c1629",[0,1.185,-.023],[.198,.01,.143],24,12);
  s.roundedBox("#bb152a",-.027,1.229,.191,.55,.119,.045,.021);
  s.roundedBox("#da2938",-.165,1.23,.22,.2,.092,.027,.017);
  for(let i=0;i<5;i++) {
    const x=-.222+i*.1;
    oval(s,"#5a1625",[x,1.231,.229],[.018,.019,.005],10,6);
    oval(s,"#b16b65",[x-.003,1.237,.234],[.007,.008,.003],8,6);
  }
  for(let i=0;i<15;i++) {
    const x=-.251+i*.035;
    stitch(s,"#e66d67",[x,1.196,.219],[x+.011,1.208,.223]);
    stitch(s,"#891427",[x,1.267,.218],[x+.012,1.277,.219]);
  }
  // Curved eye plates follow the main cushion and retain the source's sharp glare.
  const face=(x:number,y:number)=>.019+.31*Math.sqrt(Math.max(.02,1-((x-.024)/.386)**2-((y-.739)/.423)**2));
  for(const side of [-1,1]) {
    const mirror=(pts:[number,number][])=>pts.map(([x,y]):[number,number]=>[x*side,y]);
    plate(s,"#641021",mirror([[.045,.745],[.103,.613],[.218,.59],[.295,.647],[.294,.849],[.192,.792],[.113,.75]]),.006,.015,face);
    plate(s,"#f0eee3",mirror([[.076,.727],[.125,.633],[.21,.624],[.26,.663],[.267,.807],[.185,.766],[.119,.733]]),.024,.014,face);
    oval(s,"#231e29",[side*.166,.696,face(side*.166,.696)+.047],[.038,.056,.012],20,12);
    oval(s,"#fff9f0",[side*.15,.729,face(side*.15,.729)+.057],[.012,.019,.004],12,8);
    cord(s,"#880e24",[[side*.047,.772,face(side*.047,.772)+.028],[side*.151,.804,face(side*.151,.804)+.031],[side*.286,.876,face(side*.286,.876)+.018]],.018,28,8);
  }
  // Long stitched panel boundaries wrap the back and join below the padded fingers.
  for(const side of [-1,1]) {
    const seam:P[]=[[side*.183,1.095,-.077],[side*.306,.928,-.158],[side*.348,.7,-.153],[side*.287,.463,-.169],[side*.148,.301,-.202]];
    cord(s,"#78152a",seam,.008,38,6);
    for(let i=0;i<11;i++) {
      const t=i/10,y=.42+t*.58,x=side*(.28+.045*Math.sin(t*Math.PI)),z=-.162-.018*Math.sin(t*5);
      stitch(s,"#b96262",[x-side*.012,y-.005,z],[x+side*.011,y+.007,z]);
    }
  }
  oval(s,"#a7182b",[.012,.615,-.278],[.208,.281,.039],24,16);
  cord(s,"#671327",[[-.044,.437,-.305],[-.051,.626,-.32],[-.025,.843,-.286]],.021,28,8);
  for(let i=0;i<8;i++) {
    const y=.472+i*.043,z=-.317+.027*(i/7)**2;
    stitch(s,"#dd9b85",[-.073,y,z],[-.015,y+.025,z+.002],.0035);
    stitch(s,"#ac6057",[-.015,y,z],[-.072,y+.025,z+.002],.0035);
  }
  // Soft highlight islands and small wear strokes stay on the curved leather.
  oval(s,"#ef4148",[-.109,1.008,.236],[.084,.022,.013],20,10);
  for(let i=0;i<7;i++) {
    const x=.245+i*.012,y=.47+i*.039,z=face(x,y)+.007;
    stitch(s,i%2?"#ee7b76":"#92152a",[x,y,z],[x+.012,y+.019,face(x+.012,y+.019)+.008],.0023);
  }
  return s.finish();
}

/** A smoothly tapering curved limb/tail, with radial normal detail retained. */
function taper(s:Sculpt,color:string,points:P[],radius:(t:number)=>number,steps=48,sides=10) {
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const geometry=new THREE.TubeGeometry(path,steps,1,sides,false),p=geometry.getAttribute("position");
  for(let i=0;i<=steps;i++) {
    const t=i/steps,c=path.getPointAt(t),r=radius(t);
    for(let j=0;j<=sides;j++){const k=i*(sides+1)+j;const v=new THREE.Vector3().fromBufferAttribute(p,k).sub(c).multiplyScalar(r).add(c);p.setXYZ(k,v.x,v.y,v.z);}
  }
  geometry.computeVertexNormals();s.surface(color,geometry);return path;
}

/** #144 — purple horned creature with curled banded tail and fitted garter hardware. */
function garter() {
  const s=new Sculpt({detail:"high"}),skin="#9860b9",shade="#673b8b",light="#b77bd0",dark="#39234f";
  oval(s,shade,[0,.477,-.036],[.246,.316,.207],20,12);
  oval(s,skin,[-.018,.485,.013],[.242,.298,.209],28,18);
  oval(s,"#b888c7",[-.033,.494,.188],[.168,.213,.043],20,12);
  oval(s,skin,[-.04,1.037,-.015],[.32,.302,.258],32,20);
  oval(s,"#a56ac0",[-.071,1.151,-.009],[.252,.19,.236],20,12);
  // Flattened pointed ears, short crown tufts and cheek spikes keep its feline edge.
  for(const side of [-1,1]) {
    const x=side*.273-.04;
    plate(s,shade,[[x-side*.043,1.105],[x+side*.104,1.182],[x+side*.057,.995]],-.075,.09);
    plate(s,"#c18cd3",[[x,1.1],[x+side*.074,1.151],[x+side*.045,1.031]],.018,.017);
    for(let i=0;i<2;i++)plate(s,i%2?skin:shade,[[x-side*.017,.986-i*.079],[x+side*.1,.978-i*.064],[x+side*.012,.922-i*.07]],.006,.05);
    const horn:P[]=[[side*.202-.04,1.236,-.044],[side*.258-.04,1.352,-.047],
      [side*.273-.04,1.452,-.042],[side*.22-.04,1.519,-.029]];
    const hornPath=taper(s,side<0?"#7946a2":"#a36bc5",horn,t=>.057*(1-t)+.004,28,10);
    for(let i=0;i<4;i++) {
      const t=.2+i*.17,p=hornPath.getPointAt(t),axis=hornPath.getTangentAt(t),r=.057*(1-t)+.006;
      s.surface(side<0?"#5b3184":"#c38bda",new THREE.TorusGeometry(r,.005,6,16).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),axis)).translate(p.x,p.y,p.z));
    }
    oval(s,"#c08ad0",[side*.212-.04,1.282,.006],[.025,.033,.009],12,8);
  }
  for(const [x,y,lean] of [[-.168,1.29,.25],[-.053,1.322,-.1],[.055,1.28,-.3]]) {
    s.cone(skin,x,y+.043,-.014,.034,.153,0,0,lean);
  }
  // Arms, fingers, bent haunches and individual pale claws form full rounded limbs.
  for(const side of [-1,1]) {
    const x=side*.21;
    cord(s,side<0?shade:skin,[[x,.703,-.006],[side*.31,.578,.04],[side*.317,.434,.119]],.059,24,10);
    oval(s,light,[side*.316,.429,.124],[.061,.077,.058]);
    for(let i=0;i<3;i++) {
      const xx=side*(.282+i*.035),y=.387+(i%2)*.012;
      oval(s,skin,[xx,y,.15],[.022,.04,.033],12,8);
      s.cone("#e4d9cf",xx,y-.025,.176,.011,.043,-.7,0,side*.1);
    }
    oval(s,shade,[side*.159,.236,-.004],[.104,.136,.111]);
    oval(s,skin,[side*.18,.13,.067],[.095,.091,.125]);
    oval(s,light,[side*.184,.097,.142],[.096,.047,.091]);
    for(let i=0;i<3;i++) {
      const xx=side*.184+(i-1)*.057;
      oval(s,"#eadfd1",[xx,.065,.219],[.013,.014,.029],10,6);
      stitch(s,shade,[xx-.016,.113,.174],[xx+.014,.112,.18],.0026);
    }
  }
  // The original tail curls to the right behind the body and tapers to a point.
  const tailPoints:P[]=[[.166,.313,-.112],[.343,.278,-.114],[.525,.296,-.089],[.65,.418,-.067],[.662,.553,-.059],[.608,.646,-.047]];
  const tailRadius=(t:number)=>.086*Math.pow(1-t,.48)+.006;
  const tail=taper(s,"#8348a5",tailPoints,tailRadius,64,12);
  for(const t of [.22,.43,.63,.81]) {
    const p=tail.getPointAt(t),axis=tail.getTangentAt(t),r=tailRadius(t)+.002;
    s.surface("#b477cb",new THREE.TorusGeometry(r,.014,6,20).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),axis)).translate(p.x,p.y,p.z));
  }
  oval(s,"#9f64bb",tail.getPointAt(1).toArray() as P,[.008,.009,.008],8,6);
  // Half-closed golden cat eyes, dark upper lids and a small muzzle/nose.
  for(const side of [-1,1]) {
    const x=-.04+side*.135;
    oval(s,dark,[x,1.017,.229],[.103,.073,.03],20,12);
    oval(s,"#d5ac43",[x,1.008,.252],[.079,.05,.015],20,12);
    oval(s,"#f4db70",[x-side*.008,1.008,.265],[.049,.036,.008],16,10);
    oval(s,"#2c1e3c",[x+side*.002,1.012,.274],[.012,.036,.005],12,8);
    oval(s,"#fff4bb",[x-side*.016,1.029,.279],[.008,.011,.0025],10,6);
    cord(s,shade,[[-.04+side*.033,1.058,.252],[-.04+side*.125,1.061,.276],[-.04+side*.239,1.115,.196]],.022,24,8);
    cord(s,light,[[-.04+side*.044,1.084,.251],[-.04+side*.134,1.09,.265],[-.04+side*.218,1.129,.208]],.006,20,6);
    oval(s,"#ad78c5",[-.04+side*.065,.911,.246],[.075,.042,.042],20,12);
  }
  plate(s,"#4c2c65",[[-.074,.944],[-.006,.944],[-.04,.912]],.283,.013);
  cord(s,dark,[[-.04,.918,.295],[-.041,.888,.292],[-.096,.879,.27]],.004,16,6);
  cord(s,dark,[[-.041,.888,.292],[.001,.881,.278],[.025,.892,.261]],.004,14,6);
  // Small pale collar tag at the throat, as in the first pose.
  cord(s,"#4a285e",[[-.18,.828,.163],[-.047,.811,.229],[.095,.828,.173]],.014,28,8);
  plate(s,"#d8d3c8",[[-.073,.82],[-.028,.837],[.008,.799],[-.023,.766]],.23,.016);
  plate(s,"#776a88",[[-.053,.812],[-.029,.817],[-.008,.798],[-.027,.785]],.25,.006);
  // The diagonal garter is a complete annular band fitted around the waist.
  const beltAngle=.26,beltY=.499;
  const beltPoint=(x:number,y:number,z:number):P=>[x*Math.cos(beltAngle)-y*Math.sin(beltAngle),beltY+x*Math.sin(beltAngle)+y*Math.cos(beltAngle),z];
  turn(s,"#68275e",[[.91,-.037],[1.02,-.037],[1.045,-.023],[1.045,.032],[1.01,.046],[.92,.046],[.90,.025],[.91,-.037]],
    [0,beltY,0],[.266,1,.223],[0,0,beltAngle],48);
  for(const y of [-.031,.039]) {
    const loop:P[]=[];for(let i=0;i<=48;i++){const a=i*Math.PI/24;loop.push(beltPoint(Math.sin(a)*.277,y,Math.cos(a)*.232));}
    cord(s,y>0?"#f28ac6":"#cf53a4",loop,.009,48,6);
  }
  for(let i=0;i<22;i++) {
    const a=i*Math.PI/11,x=Math.sin(a)*.278,z=Math.cos(a)*.233;
    stitch(s,"#e5a6cf",beltPoint(x,-.017,z),beltPoint(x+.009,.001,z),.0023);
  }
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6,p=beltPoint(Math.sin(a)*.28,.015,Math.cos(a)*.234);
    oval(s,i%2?"#ae3a91":"#ee79be",p,[.011,.012,.006],8,6);
  }
  // Open metal buckle, short hanging strap and sprung clip are individually shaped.
  const buckleCenter=beltPoint(.129,.007,.237);
  s.surface("#b6a8ba",new THREE.TorusGeometry(1,.19,6,24).scale(.039,.047,.035).rotateZ(beltAngle).translate(...buckleCenter));
  stitch(s,"#4b2854",[buckleCenter[0]-.021,buckleCenter[1],buckleCenter[2]+.01],[buckleCenter[0]+.02,buckleCenter[1]+.008,buckleCenter[2]+.01],.005);
  cord(s,"#9b3c88",[[.143,.519,.246],[.158,.445,.249],[.176,.384,.243]],.018,22,8);
  s.surface("#b9b1bc",new THREE.TorusGeometry(1,.2,6,24).scale(.028,.045,.028).rotateZ(.17).translate(.177,.371,.247));
  s.surface("#65576e",new RoundedBoxGeometry(.05,.074,.027,2,.009).rotateZ(.17).translate(.183,.322,.246));
  s.surface("#b8b2bd",new RoundedBoxGeometry(.03,.048,.011,2,.005).rotateZ(.17).translate(.183,.327,.265));
  stitch(s,"#e2d7e4",[.172,.333,.272],[.192,.311,.272],.003);
  // Soft back folds and small crown marks continue the original skin treatment.
  cord(s,shade,[[-.119,.664,-.174],[-.018,.685,-.221],[.098,.652,-.186]],.005,24,6);
  for(let i=0;i<7;i++) {
    const x=-.19+i*.045,y=1.21+.019*Math.sin(i),z=.189-Math.abs(x+.04)*.18;
    oval(s,i%2?"#c08bd1":"#864eaa",[x,y,z],[.009,.016,.004],10,6);
  }
  return s.finish();
}

export const SCULPTS_S_CREATURES:Record<string,()=>THREE.BufferGeometry>={mon_boxglove:boxglove,mon_garter:garter};
