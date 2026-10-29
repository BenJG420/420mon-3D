import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=16,h=10) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],radius:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,radius,sides,false));
}
function turn(s:Sculpt,color:string,profile:[number,number][],p:P,rotation:P=[0,0,0],scale:P=[1,1,1],segments=40) {
  const geometry=new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),segments);
  geometry.scale(...scale).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation))).translate(...p);
  s.surface(color,geometry);
}

/** #129: a purple imp wearing fogged yellow safety goggles, not a floating mask. */
function goggles() {
  const s=new Sculpt({detail:"high"});
  const skin="#55229a", light="#713ab1", shade="#351a66", rim="#edc527";
  oval(s,shade,[0,.408,-.024],[.297,.321,.24],20,12);
  oval(s,skin,[0,.43,.014],[.297,.303,.244],28,18);
  oval(s,skin,[0,.745,-.009],[.354,.344,.273],32,20);
  // Short asymmetric ear-like horns continue the rounded crown silhouette.
  for(const side of [-1,1]) {
    turn(s,side<0?light:skin,[[0,0],[.09,0],[.093,.035],[.074,.11],[.045,.18],[.02,.225],[0,.237]],
      [side*.226,.972,-.017],[0,0,-side*.27],[1,1,.75],32);
    oval(s,light,[side*.246,1.024,.028],[.06,.084,.047],16,10);
    oval(s,shade,[side*.3,.54,-.016],[.094,.135,.1]);
    cord(s,skin,[[side*.287,.56,.004],[side*.379,.448,.024],[side*.402,.344,.075]],.068,22,10);
    oval(s,light,[side*.398,.353,.072],[.062,.076,.067]);
    for(let i=0;i<3;i++) {
      const x=side*(.369+i*.031);
      oval(s,skin,[x,.303+(i%2)*.011,.095],[.024,.046,.032],14,8);
    }
    oval(s,shade,[side*.211,.193,.012],[.114,.105,.117]);
    oval(s,light,[side*.231,.144,.091],[.109,.074,.136]);
    for(let i=0;i<3;i++) {
      const x=side*.23+(i-1)*.069;
      oval(s,i%2?skin:light,[x,.102,.208-Math.abs(i-1)*.011],[.038,.036,.068],16,10);
      cord(s,shade,[[x-.02,.132,.208],[x,.139,.23],[x+.02,.13,.21]],.0035,8,6);
    }
  }
  // The actual elastic strap wraps behind the head with a broad cross-section.
  const belt:P[]=[];
  for(let i=0;i<=64;i++) {
    const a=i/64*Math.PI*2;
    belt.push([Math.sin(a)*.354,.738+.012*Math.cos(a),Math.cos(a)*.268]);
  }
  const beltGeometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(belt.map(p=>new THREE.Vector3(...p))),64,.036,8,false);
  s.surface("#26232d",beltGeometry);
  for(const dy of [-.027,.027])cord(s,"#79717d",belt.map(([x,y,z])=>[x,y+dy,z]),.004,64,6);
  s.roundedBox("#4c4753",0,.741,-.292,.142,.082,.029,.015);
  s.roundedBox("#8b8290",0,.742,-.31,.096,.046,.012,.009);
  s.box("#302a39",0,.742,-.318,.066,.021,.004);
  // Separate deeply bevelled lens cups, rubber seal and softly crowned white glass.
  for(const side of [-1,1]) {
    const x=side*.181;
    turn(s,"#775b18",[[.116,-.033],[.159,-.033],[.18,-.016],[.184,.024],[.166,.053],[.123,.056],[.113,.035],[.116,-.033]],
      [x,.744,.252],[Math.PI/2,0,0],[1,1,1.02]);
    turn(s,rim,[[.127,.031],[.168,.031],[.177,.052],[.171,.072],[.151,.082],[.123,.073],[.117,.051],[.127,.031]],
      [x,.744,.252],[Math.PI/2,0,0],[1,1,1.02]);
    turn(s,"#f9e264",[[.139,.071],[.158,.071],[.164,.083],[.155,.091],[.138,.087],[.139,.071]],
      [x,.744,.252],[Math.PI/2,0,0],[1,1,1.02],32);
    oval(s,"#88819b",[x,.744,.314],[.125,.129,.031],24,16);
    oval(s,"#ccc7df",[x,.744,.337],[.108,.113,.032],28,18);
    oval(s,"#e8e5f5",[x-.014,.768,.361],[.07,.074,.013],20,12);
    oval(s,"#fffaff",[x-.038,.789,.371],[.023,.03,.005],14,10);
    cord(s,"#b3accb",[[x+.066,.69,.354],[x+.085,.729,.354],[x+.074,.782,.349]],.004,16,6);
    s.roundedBox("#d4ab1f",side*.339,.754,.221,.068,.113,.082,.017,0,side*.27);
    s.rod("#66521d",[side*.363,.752,.241],[side*.371,.752,.255],.012);
    // Yellow condensation runs from the lower rim in several unequal lengths.
    for(let j=0;j<3;j++) {
      const dx=(j-1)*.052,y=.602-Math.abs(j-1)*.012,length=.052+(j===1?.046:0);
      cord(s,j===1?"#f2ca29":"#d2ad1e",[[x+dx,y,.289],[x+dx-.005,y-length*.5,.3],[x+dx+.002,y-length,.296]],.009,14,6);
      oval(s,"#efcf3b",[x+dx+.002,y-length,.296],[.011,.014,.01],10,6);
    }
  }
  cord(s,"#bb8f1b",[[-.066,.775,.304],[0,.797,.307],[.066,.775,.304]],.022,18,8);
  cord(s,"#ffe771",[[-.065,.783,.32],[0,.807,.324],[.065,.783,.32]],.009,18,6);
  s.roundedBox(shade,0,.486,.256,.069,.015,.014,.005);
  // Small soft geometric steam puffs retain the source's upper-left wisp.
  for(const [x,y,z,size] of [[-.364,1.081,.002,.019],[-.416,1.143,.005,.028],[-.478,1.215,.008,.055],[-.524,1.244,.008,.062],[-.487,1.282,.005,.057],[-.549,1.279,-.003,.033]]) {
    oval(s,y>1.23?"#d5bde8":"#bda3d7",[x,y,z],[size,size*.8,size*.64],14,10);
  }
  // Subtle creases/shading patches continue across the back and flanks.
  cord(s,shade,[[-.1,.34,.242],[-.04,.326,.263],[.039,.337,.261]],.0045,16,6);
  cord(s,light,[[-.2,.838,-.218],[-.089,.883,-.261],[.08,.87,-.263],[.218,.811,-.214]],.006,28,6);
  for(let i=0;i<6;i++) {
    const a=2+i*.33,x=Math.sin(a)*.263,z=-Math.abs(Math.cos(a)*.237);
    oval(s,i%2?"#6330a2":"#482185",[x,.36+(i%3)*.09,z],[.027,.018,.007],12,8);
  }
  return s.finish();
}

/** #132: stocky horned purple creature with a fitted studded collar and real lock. */
function choker() {
  const s=new Sculpt({detail:"high"});
  const skin="#9567ae", shade="#624175", light="#b28ac4", dark="#422a50";
  oval(s,shade,[0,.455,-.015],[.284,.352,.235],20,12);
  oval(s,skin,[0,.481,.025],[.271,.328,.23],28,18);
  oval(s,"#b7a69c",[0,.43,.205],[.19,.238,.059],24,16);
  oval(s,"#c8bcb0",[-.017,.465,.25],[.127,.151,.02],20,12);
  oval(s,skin,[0,1.035,-.013],[.361,.335,.281],32,22);
  oval(s,"#a375ba",[-.022,1.154,.014],[.275,.211,.248],24,16);
  for(const side of [-1,1]) {
    turn(s,"#9e8e87",[[0,0],[.073,0],[.074,.029],[.052,.09],[.028,.16],[0,.216]],
      [side*.249,1.274,-.03],[0,0,-side*.41],[1,1,.84],32);
    turn(s,"#e2d7bf",[[0,.032],[.067,.032],[.044,.109],[.022,.177],[0,.219]],
      [side*.249,1.274,-.03],[0,0,-side*.41],[1,1,.84],32);
    oval(s,shade,[side*.244,.651,-.004],[.111,.12,.128]);
    cord(s,skin,[[side*.247,.637,.018],[side*.347,.538,.081],[side*.354,.417,.156]],.078,24,10);
    oval(s,light,[side*.353,.416,.165],[.078,.088,.073]);
    for(let i=0;i<3;i++) {
      const x=side*(.314+i*.039),y=.362+(i%2)*.014;
      oval(s,skin,[x,y,.194],[.027,.049,.04],14,10);
      s.cone("#e1d3b9",x,y-.024,.23,.016,.057,-.55,0,side*.1);
    }
    oval(s,skin,[side*.183,.206,.026],[.115,.154,.119]);
    oval(s,shade,[side*.218,.098,.106],[.123,.071,.148]);
    oval(s,light,[side*.225,.113,.143],[.098,.049,.124]);
    for(let i=0;i<3;i++) {
      const x=side*.224+(i-1)*.067;
      oval(s,skin,[x,.07,.216],[.033,.028,.052],14,8);
      s.cone("#dfd4b9",x,.064,.264,.017,.053,Math.PI/2,0,0);
    }
  }
  // Continuous open neckband follows the full neck, with layered rolled edges.
  turn(s,"#39263e",[[.91,-.045],[1,-.045],[1.027,-.023],[1.027,.035],[.995,.058],[.91,.058],[.89,.031],[.91,-.045]],
    [0,.728,0],[0,0,0],[.31,1,.231],64);
  for(const y of [.689,.781]) {
    const loop:P[]=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;loop.push([Math.sin(a)*.311,y,Math.cos(a)*.232]);}
    cord(s,"#7b366b",loop,.008,48,6);
  }
  for(let i=0;i<10;i++) {
    const a=i*Math.PI/5,x=Math.sin(a)*.319,z=Math.cos(a)*.239;
    const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(Math.sin(a),0,Math.cos(a)));
    s.surface("#c94e9e",new THREE.SphereGeometry(1,10,6).scale(.022,.027,.009).applyQuaternion(rotation).translate(x,.736,z));
  }
  // Angled sockets, golden irises and strong sculpted brows keep the source glare.
  for(const side of [-1,1]) {
    const x=side*.156;
    oval(s,dark,[x,1.088,.249],[.117,.082,.034]);
    oval(s,"#edbb43",[x,1.079,.278],[.083,.052,.017]);
    oval(s,"#ffe18b",[x-side*.013,1.08,.291],[.042,.039,.009],16,10);
    oval(s,"#2f2135",[x+side*.009,1.08,.297],[.017,.038,.006],14,10);
    oval(s,"#fff2bf",[x-side*.017,1.096,.303],[.009,.012,.003],10,6);
    cord(s,shade,[[side*.059,1.089,.293],[side*.144,1.16,.284],[side*.271,1.186,.208]],.044,22,10);
    cord(s,light,[[side*.067,1.112,.301],[side*.156,1.183,.282],[side*.245,1.198,.224]],.009,20,6);
  }
  // Upper muzzle and separate lower jaw expose a dark mouth with individual teeth.
  oval(s,"#a67ab7",[0,.961,.28],[.278,.11,.131],28,18);
  oval(s,shade,[0,.86,.301],[.261,.071,.111],24,16);
  oval(s,"#382237",[0,.895,.368],[.244,.054,.044],24,14);
  cord(s,"#be95c9",[[-.248,.921,.355],[-.161,.868,.409],[0,.847,.419],[.165,.875,.409],[.245,.929,.346]],.015,36,8);
  for(let i=0;i<11;i++) {
    const x=-.218+i*.0436,arc=Math.sqrt(Math.max(0,1-(x/.25)**2));
    const y=.888-.009*arc,z=.367+.047*arc;
    oval(s,i%3?"#dfd2b5":"#f2e7ce",[x,y,z],[.0135,.019,.011],10,6);
  }
  for(const side of [-1,1]) {
    oval(s,shade,[side*.09,.985,.399],[.02,.014,.012],14,8);
    oval(s,"#c6a1cf",[side*.18,1.005,.379],[.027,.018,.006],14,8);
  }
  // Lock hangs freely ahead of the belly; its shackle retains a visible opening.
  s.torus("#535259",0,.669,.286,.053,.013);
  s.torus("#c1b6ac",0,.674,.294,.049,.008);
  s.roundedBox("#6f6a6c",0,.563,.311,.173,.182,.079,.032);
  s.roundedBox("#b3aaa4",0,.565,.355,.145,.154,.026,.023);
  s.roundedBox("#d1c4b7",-.038,.579,.371,.025,.102,.006,.009);
  oval(s,"#403044",[0,.581,.372],[.019,.022,.006],14,10);
  s.box("#3a293f",0,.554,.376,.016,.04,.008);
  s.box("#b25c9a",0,.552,.382,.006,.025,.004);
  for(const x of [-.056,.056])oval(s,"#71676c",[x,.512,.371],[.006,.006,.003],10,6);
  // Shoulder folds and back dimples finish the creature from every viewer angle.
  cord(s,shade,[[-.13,.582,-.21],[0,.616,-.249],[.135,.581,-.208]],.006,24,6);
  for(let i=0;i<10;i++) {
    const a=1.9+i*.23,x=Math.sin(a)*.283,z=-Math.abs(Math.cos(a)*.249),y=.96+(i%3)*.072;
    oval(s,i%2?"#a77cb8":"#86599d",[x,y,z],[.022,.014,.006],8,6);
  }
  return s.finish();
}

export const SCULPTS_Q_CREATURES:Record<string,()=>THREE.BufferGeometry>={mon_goggles:goggles,mon_choker:choker};
