import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=8) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function box(s:Sculpt,color:string,p:P,size:P,r=.012,segments=2) {
  s.surface(color,new RoundedBoxGeometry(...size,segments,r).translate(...p));
}
function turn(s:Sculpt,color:string,profile:[number,number][],p:P=[0,0,0],segments=40) {
  s.surface(color,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),segments).translate(...p));
}
function screw(s:Sculpt,p:P,r=.025,back=false) {
  const z=back?-1:1;
  oval(s,"#505253",p,[r*1.15,r*1.15,.008],12,8);
  oval(s,"#b6b9b0",[p[0],p[1],p[2]+z*.006],[r,r,.009],12,8);
  s.box("#4a4843",p[0],p[1],p[2]+z*.016,r*1.3,.004,.003,0,0,.35);
}

/** #151: round silver clamp creature, immense eyes and two toothed jaws. */
function roachclip() {
  const s=new Sculpt({detail:"high"}),steel="#858b89",light="#bfc4bd",dark="#494e50";
  oval(s,steel,[0,.765,0],[.374,.375,.289],32,22);
  oval(s,"#666e6e",[.029,.615,-.008],[.328,.239,.276],26,16);
  // Raised forehead casting and side cheeks follow the round shell, not a flat mask.
  oval(s,"#acb0a5",[-.071,1.015,.045],[.238,.19,.245],24,16);
  for(const side of [-1,1]) {
    const x=side*.226;
    oval(s,dark,[x,.883,.228],[.166,.184,.071],24,16);
    oval(s,light,[x,.885,.269],[.148,.165,.068],24,16);
    oval(s,"#f2efd7",[x,.885,.308],[.12,.14,.049],28,18);
    oval(s,"#2d2a21",[x-side*.009,.886,.351],[.045,.057,.014],20,12);
    oval(s,"#86764e",[x-side*.003,.866,.362],[.027,.028,.004],12,8);
    oval(s,"#fffbe7",[x-side*.018,.91,.365],[.014,.02,.005],12,8);
    cord(s,"#dce0d0",[[x-side*.098,.953,.294],[x,.995,.304],[x+side*.083,.968,.284]],.007,18,6);
    oval(s,"#6f7777",[side*.316,.678,.116],[.109,.159,.153],20,12);
    screw(s,[side*.333,.681,.242],.029);
  }
  // Deep open mouth: a hollow lip around the clamp's pivot supports two separate jaws.
  s.surface("#404747",new THREE.TorusGeometry(.133,.027,8,36).scale(1,1.2,1).rotateY(-.4).translate(-.155,.59,.288));
  oval(s,"#242a29",[-.154,.588,.272],[.12,.14,.035],20,12);
  const jaws:P[][]=[
    [[-.15,.668,.322],[-.299,.622,.36],[-.466,.545,.413],[-.572,.481,.441]],
    [[-.165,.482,.322],[-.307,.425,.376],[-.475,.371,.426],[-.586,.397,.446]],
  ];
  for(let jaw=0;jaw<2;jaw++) {
    cord(s,jaw?"#838f8b":"#a9b4ad",jaws[jaw],.035,34,10);
    cord(s,"#d1d9cc",jaws[jaw].map(([x,y,z])=>[x,y+.009,z+.028]),.007,28,6);
    for(let i=0;i<6;i++) {
      const t=(i+.5)/6,x=-.235-t*.3,y=jaw?.449-t*.053:.629-t*.12;
      const tooth=new THREE.ConeGeometry(.018,.035,6).rotateZ(jaw?-.27:Math.PI-.27).translate(x,y,jaw?.4:.39);
      s.surface(jaw?"#c6cec0":"#d7dbcd",tooth);
    }
  }
  // Warm paper/tobacco stub held between the jaws, with a dark actual end ring.
  const stubStart=new THREE.Vector3(-.156,.579,.32),stubEnd=new THREE.Vector3(-.625,.447,.448),axis=stubEnd.clone().sub(stubStart).normalize();
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
  const len=stubEnd.distanceTo(stubStart),mid=stubEnd.clone().add(stubStart).multiplyScalar(.5);
  s.surface("#704021",new THREE.CylinderGeometry(.052,.071,len,28).applyQuaternion(q).translate(mid.x,mid.y,mid.z));
  for(let i=0;i<7;i++) {
    const p=stubStart.clone().lerp(stubEnd,(i+.5)/8);
    s.surface(i%2?"#a16932":"#8b552b",new THREE.TorusGeometry(.059-i*.001,.004,5,20).rotateX(Math.PI/2).applyQuaternion(q).translate(p.x,p.y,p.z));
  }
  const front=stubEnd.clone().addScaledVector(axis,.006);
  s.surface("#302d25",new THREE.CylinderGeometry(.045,.047,.012,24).applyQuaternion(q).translate(front.x,front.y,front.z));
  s.surface("#a9aaa0",new THREE.TorusGeometry(.05,.007,6,28).rotateX(Math.PI/2).applyQuaternion(q).translate(front.x,front.y,front.z));
  // Jointed legs retain the source's four supports and little steel boots.
  for(const side of [-1,1])for(const rear of [false,true]) {
    const depth=rear?-.162:.113,x=side*(rear?.31:.227),hip:P=[x,.475,depth];
    const knee:P=[x+side*.07,.31,depth+.006],ankle:P=[x+side*.025,.145,depth+.021];
    oval(s,"#555d60",hip,[.075,.081,.074],16,10);
    cord(s,rear?"#657072":"#88928f",[hip,knee,ankle],.036,18,8);
    oval(s,"#a0aaa1",knee,[.052,.051,.049],14,10);
    box(s,"#515963",[ankle[0]-.007,.113,depth+.056],[.15,.07,.177],.019,2);
    box(s,"#8b9693",[ankle[0]-.013,.137,depth+.108],[.121,.018,.059],.008,1);
    for(let i=0;i<3;i++)s.box("#343c46",ankle[0]-.044+i*.037,.107,depth+.146,.006,.025,.004);
  }
  // Thick brown diagonal handle with stepped collars, grooves and metal end pin.
  const h0=new THREE.Vector3(.041,1.054,-.014),h1=new THREE.Vector3(.438,1.661,-.032),hd=h1.clone().sub(h0).normalize();
  const hq=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),hd),hm=h0.clone().add(h1).multiplyScalar(.5);
  s.surface("#825026",new THREE.CylinderGeometry(.085,.128,h0.distanceTo(h1),24).applyQuaternion(hq).translate(hm.x,hm.y,hm.z));
  for(let i=0;i<10;i++) {
    const p=h0.clone().lerp(h1,(i+.3)/11),r=.123-i*.0035;
    s.surface(i%3?"#a56931":"#5b3824",new THREE.TorusGeometry(r,.008,5,20).rotateX(Math.PI/2).applyQuaternion(hq).translate(p.x,p.y,p.z));
  }
  for(let i=0;i<5;i++) {
    const a=i*Math.PI*2/5,offset=new THREE.Vector3(Math.cos(a)*.087,0,Math.sin(a)*.087).applyQuaternion(hq);
    const a0=h0.clone().lerp(h1,.28).add(offset),a1=h0.clone().lerp(h1,.88).add(offset);
    cord(s,i%2?"#b17c3e":"#533b28",[a0.toArray() as P,a1.toArray() as P],.005,14,6);
  }
  oval(s,"#3f3b32",h1.toArray() as P,[.074,.071,.076],18,12);
  screw(s,[.432,1.671,.039],.023);
  // Rear shell plate, pivot slot, cast seams and small all-around wear.
  oval(s,"#737c7b",[.007,.789,-.284],[.263,.248,.025],24,16);
  for(const x of [-.17,.17])screw(s,[x,.784,-.304],.027,true);
  box(s,"#424b4d",[0,.721,-.31],[.135,.054,.015],.012,2);
  for(let i=0;i<5;i++)s.box("#b0b8ab",-.044+i*.022,.722,-.321,.005,.033,.004);
  cord(s,"#555f5c",[[-.25,.972,-.17],[-.071,1.087,-.199],[.169,1.03,-.195],[.314,.852,-.153]],.008,32,6);
  for(let i=0;i<22;i++) {
    const a=i*2.399963,y=.61+(i%5)*.07,r=.3;
    if(Math.cos(a)>.25)continue;
    oval(s,i%2?"#b7b8a2":"#59615f",[Math.sin(a)*r,y,Math.cos(a)*.278],[.014,.021,.005],8,6);
  }
  return s.finish();
}

/** #152: a complete worn tap casting with a genuinely open arch and downturned outlet. */
function faucet() {
  const s=new Sculpt({detail:"high"}),silver="#a5a69b",rust="#936841";
  // The cast pipe wraps the hole rather than covering it with a back plate.
  const points:P[]=[[.224,.256,0],[.22,.505,0],[.229,.812,0],[.168,1.052,0],
    [-.041,1.179,0],[-.283,1.095,0],[-.438,.898,0],[-.464,.718,0]];
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  s.surface(silver,new THREE.TubeGeometry(path,64,.118,20,false));
  oval(s,"#9f9d8b",[.226,.358,0],[.178,.252,.146],28,18);
  // Full slanted lower cheek has genuine thickness, leaving the entire upper arch free.
  const cheek=new THREE.Shape();cheek.moveTo(-.305,.688);cheek.quadraticCurveTo(-.208,.593,-.08,.581);
  cheek.lineTo(.329,.505);cheek.quadraticCurveTo(.381,.322,.29,.179);cheek.quadraticCurveTo(.173,.13,.089,.213);
  cheek.quadraticCurveTo(-.044,.341,-.158,.485);cheek.lineTo(-.305,.688);cheek.closePath();
  s.surface("#96998d",new THREE.ExtrudeGeometry(cheek,{depth:.269,curveSegments:18,bevelEnabled:true,bevelSize:.016,bevelThickness:.016,bevelSegments:3}).translate(0,0,-.128));
  for(const z of [-.152,.16])cord(s,"#bfc1b0",[[-.286,.653,z],[-.168,.534,z],[.035,.344,z],[.176,.2,z],[.282,.218,z]],.009,32,6);
  // A stepped hollow nozzle points down, with a visible dark recessed throat.
  turn(s,"#777c70",[[.068,.597],[.098,.597],[.111,.619],[.111,.707],[.094,.722],[.068,.71],[.068,.597]],[-.464,0,0],48);
  turn(s,"#c1bc9d",[[.065,.646],[.128,.646],[.138,.663],[.135,.704],[.119,.718],[.066,.714],[.065,.646]],[-.464,0,0],48);
  turn(s,"#d0cbb3",[[.066,.665],[.139,.665],[.142,.675],[.137,.685],[.067,.685],[.066,.665]],[-.464,0,0],40);
  turn(s,"#364440",[[0,.692],[.067,.692],[.067,.704],[0,.704]],[-.464,0,0],32);
  for(let i=0;i<16;i++) {
    const a=i*Math.PI/8,x=-.464+Math.cos(a)*.112,z=Math.sin(a)*.112;
    s.rod(i%2?"#827b5f":"#b1ab88",[x,.619,z],[x,.644,z],.003);
  }
  // A rounded hanging drop has a narrow neck, fuller belly and pale highlight.
  const drop=new THREE.LatheGeometry([[0,.268],[.025,.278],[.047,.309],[.048,.349],[.032,.384],[.013,.437],[0,.504]].map(p=>new THREE.Vector2(...p)),40);
  s.surface("#85bbdf",drop.translate(-.464,0,.001));
  cord(s,"#c2e1ec",[[-.48,.306,.035],[-.487,.338,.036],[-.478,.384,.024],[-.471,.439,.012]],.004,20,6);
  // Neck, packing nut and original cross-handle with polished rounded tips.
  turn(s,"#8b7c5f",[[0,1.1],[.086,1.1],[.101,1.141],[.088,1.204],[.062,1.244],[0,1.244]],[-.048,0,0],40);
  turn(s,"#c0b89a",[[0,1.235],[.083,1.235],[.091,1.25],[.083,1.267],[.037,1.276],[.034,1.373],[0,1.373]],[-.048,0,0],40);
  for(const y of [1.286,1.312,1.337])s.surface("#756d57",new THREE.TorusGeometry(.034,.004,5,24).rotateX(Math.PI/2).translate(-.048,y,0));
  cord(s,"#aaa38a",[[-.195,1.397,.003],[-.111,1.422,0],[-.041,1.424,0],[.049,1.399,.006]],.037,26,10);
  for(const x of [-.199,.053])oval(s,"#dad7bf",[x,1.397,.006],[.045,.041,.045],20,12);
  oval(s,"#887960",[-.048,1.418,0],[.067,.047,.058],20,12);
  screw(s,[-.048,1.421,.05],.023);
  // Source eyes on the low slanted face remain forward of the full metal cheek.
  for(const [x,y] of [[-.053,.492],[.177,.478]]) {
    oval(s,"#53564d",[x,y,.153],[.096,.113,.026],24,16);
    oval(s,"#d7d8c5",[x,y,.176],[.08,.095,.025],24,16);
    oval(s,"#252e2d",[x,y+.001,.197],[.051,.063,.018],20,12);
    oval(s,"#b6c2b4",[x-.015,y+.023,.214],[.018,.023,.005],12,8);
    oval(s,"#fffdeb",[x-.021,y+.033,.218],[.008,.011,.003],10,6);
  }
  for(const x of [.083,.335]) {
    oval(s,"#7d7256",[x,.121,.005],[.09,.057,.092],20,12);
    turn(s,"#9b8864",[[0,.068],[.077,.068],[.095,.082],[.087,.112],[.063,.128],[0,.128]],[x,0,.019],32);
    cord(s,"#ccc2a2",[[x-.057,.114,.073],[x,.127,.086],[x+.057,.114,.073]],.005,14,6);
  }
  // Rust islands conform to the curved tube, including its rear; no patch spans the arch.
  const frames=path.computeFrenetFrames(48,false);
  for(let i=0;i<48;i++) {
    const t=(i+.3)/48,c=path.getPointAt(t),a=i*2.399963;
    const normal=frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a)).normalize();
    const p=c.addScaledVector(normal,.119),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
    s.surface(i%3?rust:"#c8b98e",new THREE.SphereGeometry(1,8,6).scale(.019+(i%3)*.005,.023+(i%4)*.005,.0025).applyQuaternion(q).translate(p.x,p.y,p.z));
  }
  for(let i=0;i<16;i++) {
    const x=.04+(i%4)*.065,y=.246+Math.floor(i/4)*.066;
    if(y>.38&&x<.25)continue;
    for(const z of [-.149,.157])oval(s,i%2?"#a57943":"#c3b18b",[x,y,z],[.018,.024,.003],8,6);
  }
  // Back inspection plug, cast seam and raised foundry mark finish the rotation.
  s.surface("#756b55",new THREE.TorusGeometry(.076,.011,6,28).translate(.223,.36,-.155));
  oval(s,"#c4b898",[.223,.36,-.168],[.066,.066,.015],20,12);
  s.box("#685e4b",.223,.36,-.184,.083,.011,.004,0,0,-.17);
  for(let i=0;i<4;i++)s.box("#687267",.116+i*.03,.527,-.151,.009,.045,.004);
  return s.finish();
}

export const SCULPTS_U_METAL:Record<string,()=>THREE.BufferGeometry>={mon_roachclip:roachclip,mon_faucet:faucet};
