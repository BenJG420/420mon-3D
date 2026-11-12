import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function line(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function box(s:Sculpt,color:string,p:P,size:P,r=.01,segments=2) {
  s.surface(color,new RoundedBoxGeometry(...size,segments,r).translate(...p));
}
function pin(s:Sculpt,color:string,a:P,b:P,r=.003) {
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),d=end.clone().sub(start),mid=start.add(end).multiplyScalar(.5);
  s.surface(color,new THREE.CylinderGeometry(r,r,d.length(),6)
    .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())).translate(mid.x,mid.y,mid.z));
}

/** #176 — the original lime creature holds a full wet metal squeegee above its head. */
function squeegee() {
  const s=new Sculpt({detail:"high"}),green="#74ac16",light="#a0ce27",dark="#416923";
  oval(s,"#68951d",[.015,.531,-.015],[.259,.385,.21],36,24);
  oval(s,green,[.026,.865,.005],[.253,.316,.208],32,22);
  oval(s,"#8ebb1f",[.005,.464,.148],[.198,.26,.087],28,18);
  // The raised left arm wraps a wooden handle; the other fist hangs at the flank.
  line(s,green,[[-.192,.606,.031],[-.251,.848,.032],[-.214,1.121,.033],[-.155,1.361,.024]],.07,38,10);
  oval(s,light,[-.157,1.355,.041],[.081,.09,.069],22,14);
  line(s,"#67951c",[[.211,.748,.005],[.284,.62,.032],[.3,.453,.053]],.071,24,10);
  oval(s,"#83ae23",[.286,.43,.087],[.092,.1,.08],22,14);
  for(let i=0;i<3;i++) {
    line(s,"#4e7b1d",[[.245+i*.031,.426,.155],[.246+i*.031,.473,.155]],.003,9,5);
    line(s,"#c1dd53",[[-.211+i*.028,1.383,.079],[-.209+i*.027,1.342,.102]],.004,10,5);
  }
  for(const side of [-1,1]) {
    oval(s,"#558125",[side*.16,.167,.009],[.086,.135,.089],20,12);
    box(s,"#7fae26",[side*.162,.075,.066],[.168,.084,.225],.031,3);
    line(s,"#b2d345",[[side*.162-.054,.09,.174],[side*.162,.107,.185],[side*.162+.054,.09,.174]],.004,16,5);
  }
  // The source's asymmetric eyes sit on the curved head, clear of the raised arm.
  for(const side of [-1,1]) {
    const x=side<0?-.13:.118,y=side<0?.913:.947,k=side<0?.62:1;
    oval(s,dark,[x,y,.185],[.075*k,.106*k,.036],24,16);
    oval(s,"#e4ead1",[x,y,.216],[.054*k,.081*k,.017],24,16);
    oval(s,"#243943",[x+.008,y-.003,.232],[.026*k,.053*k,.012],22,14);
    oval(s,"#fcfff0",[x+.001,y+.023*k,.244],[.011*k,.02*k,.004],12,8);
    line(s,"#abd239",[[x-.063*k,y+.078*k,.203],[x,y+.102*k,.214],[x+.06*k,y+.084*k,.206]],.009,20,6);
  }
  oval(s,"#9ac926",[-.079,.754,.219],[.092,.142,.103],28,18);
  line(s,"#3a631f",[[-.011,.745,.293],[.04,.706,.228],[.019,.662,.227],[.078,.623,.199]],.012,24,7);
  oval(s,"#bad94c",[-.105,.794,.308],[.021,.048,.009],16,10);
  // Handle grain, bracket and a real dark rubber blade under the pressed steel rail.
  line(s,"#865929",[[-.14,1.17,.02],[-.066,1.406,-.015],[.012,1.635,-.026]],.036,30,10);
  for(let i=0;i<3;i++)line(s,i===1?"#bd8c42":"#68421f",[[-.154+i*.014,1.202,.048],[-.082+i*.014,1.414,.019],[-.011+i*.014,1.608,.012]],.0025,26,5);
  box(s,"#745325",[.009,1.624,.005],[.186,.163,.106],.024,3);
  oval(s,"#b59c65",[.008,1.633,.066],[.025,.025,.008],16,10);
  pin(s,"#534b38",[-.006,1.634,.076],[.021,1.634,.076],.003);
  box(s,"#626d75",[0,1.744,0],[1.065,.131,.167],.022,4);
  box(s,"#b8c1c5",[-.011,1.789,.058],[1.079,.063,.061],.015,3);
  box(s,"#e0e2dd",[-.013,1.817,.045],[1.018,.012,.071],.005,2);
  box(s,"#344944",[0,1.677,.012],[1.031,.027,.137],.007,2);
  box(s,"#87a79b",[0,1.694,.094],[.982,.018,.012],.004,2);
  for(const side of [-1,1]) {
    box(s,"#8b949a",[side*.52,1.748,-.009],[.036,.127,.178],.012,2);
    oval(s,"#495962",[side*.464,1.744,.087],[.012,.012,.005],12,8);
  }
  // Runoff is rounded translucent-looking color relief, not extra transparent passes.
  for(const [x,len] of [[-.454,.22],[-.326,.062],[.32,.164],[.421,.059]] as [number,number][]) {
    line(s,"#85c41d",[[x-.032,1.689,.092],[x,1.658,.115],[x+.006,1.648-len*.65,.11],[x,1.646-len,.106]],.015,24,7);
    oval(s,"#a6d73b",[x,1.646-len,.106],[.019,.028,.02],16,10);
  }
  for(let i=0;i<10;i++) {
    const x=-.4+i*.089;
    pin(s,i%2?"#edf1df":"#718184",[x,1.775,.094],[x+.025,1.769,.094],.0018);
  }
  // Raised damp skin speckles and folds follow front and rear volume.
  for(let i=0;i<20;i++) {
    const a=i*2.39996,y=.34+(i%7)*.076;
    const ring=Math.sqrt(Math.max(.05,1-((y-.531)/.385)**2));
    oval(s,i%3?"#6b971e":"#9cc13b",[.015+Math.sin(a)*.26*ring,y,-.015+Math.cos(a)*.213*ring],[.013,.022,.01],8,6);
  }
  line(s,"#527d1e",[[-.135,.356,-.17],[-.164,.522,-.194],[-.1,.72,-.17],[.009,.8,-.19]],.004,30,5);
  return s.finish();
}

/** #178 — brown creature inside a padded red boxing headguard, retaining both eye pairs. */
function headgear() {
  const s=new Sculpt({detail:"high"}),red="#bd1825",light="#df3440",dark="#70121d";
  oval(s,"#625145",[0,.486,0],[.285,.384,.241],32,22);
  oval(s,"#817064",[0,.434,.177],[.225,.263,.093],24,16);
  oval(s,"#6e5a4b",[0,.998,.008],[.334,.309,.281],28,20);
  oval(s,"#88715d",[0,.897,.226],[.206,.13,.065],24,16);
  // Thick hind legs, bent arms, individual claws and a smooth tapering rear tail.
  for(const side of [-1,1]) {
    oval(s,"#57483d",[side*.22,.25,.055],[.123,.211,.133],18,12);
    oval(s,"#79624e",[side*.228,.084,.129],[.114,.073,.151],20,12);
    line(s,"#5b493b",[[side*.252,.646,.026],[side*.347,.46,.034],[side*.334,.324,.102]],.072,24,8);
    oval(s,"#6d5744",[side*.337,.32,.112],[.066,.084,.069],20,12);
    for(let i=0;i<3;i++) {
      const x=side*.228+(i-1)*.055;
      oval(s,"#c8ac7f",[x,.064,.259],[.016,.019,.045],14,10);
      oval(s,"#c5a77c",[side*.337+(i-1)*.03,.279,.16],[.011,.027,.014],12,8);
    }
  }
  const tail=new THREE.CatmullRomCurve3([new THREE.Vector3(.1,.274,-.14),new THREE.Vector3(.299,.245,-.271),new THREE.Vector3(.438,.289,-.27),new THREE.Vector3(.515,.389,-.24)]);
  const tg=new THREE.TubeGeometry(tail,36,1,10,false),tp=tg.getAttribute("position");
  for(let i=0;i<=36;i++)for(let j=0;j<=10;j++) {
    const t=i/36,k=i*11+j,c=tail.getPointAt(t),v=new THREE.Vector3().fromBufferAttribute(tp,k).sub(c).multiplyScalar(.07*(1-t)+.003).add(c);tp.setXYZ(k,v.x,v.y,v.z);
  }
  tg.computeVertexNormals();s.surface("#5f4b3b",tg);
  // Smooth crown with thick ear cups and separate long cheek cushions.
  s.surface(red,new THREE.SphereGeometry(1,36,22,0,Math.PI*2,0,1.95).scale(.415,.37,.32).translate(0,1.29,.017));
  s.surface(dark,new THREE.LatheGeometry([[.349,1.141],[.383,1.141],[.388,1.154],[.384,1.168],
    [.352,1.168],[.349,1.156],[.349,1.141]].map(p=>new THREE.Vector2(...p)),48).scale(1,1,.77).translate(0,0,.017));
  for(const side of [-1,1]) {
    oval(s,dark,[side*.383,1.122,.005],[.099,.145,.119],20,12);
    oval(s,red,[side*.421,1.126,.016],[.055,.114,.095],20,12);
    s.surface("#e04443",new THREE.TorusGeometry(.073,.012,8,32).rotateY(Math.PI/2).scale(1,1.18,1).translate(side*.458,1.126,.016));
    oval(s,dark,[side*.3,1.048,.165],[.119,.24,.131],20,12);
    oval(s,red,[side*.305,1.065,.19],[.097,.224,.119],20,12);
    line(s,light,[[side*.342,1.246,.227],[side*.373,1.108,.246],[side*.323,.917,.24],[side*.263,.877,.228]],.008,28,6);
  }
  // Upper angry eyes belong to the red guard, lower eyes to its brown wearer.
  for(const side of [-1,1])for(const upper of [true,false]) {
    const x=side*(upper?.166:.145),y=upper?1.27:.991,z=upper?.311:.272,k=upper?1:.83;
    oval(s,upper?dark:"#483a30",[x,y,z],[.133*k,.116*k,.056],20,12);
    oval(s,"#dec291",[x,y-.01,z+.044],[.092*k,.081*k,.022],20,12);
    oval(s,"#c18726",[x+side*.009,y-.012,z+.063],[.049*k,.061*k,.012],16,10);
    oval(s,"#241d20",[x+side*.009,y-.01,z+.075],[.025*k,.045*k,.009],16,10);
    oval(s,upper?"#fff0cd":"#fff6df",[x-side*.006,y+.011,z+.085],[.01*k,.018*k,.003],12,8);
    line(s,upper?red:"#5f4a38",[[x-side*.116*k,y+.076*k,z+.009],[x,y+.052*k,z+.071],[x+side*.106*k,y+.125*k,z+.004]],upper?.022:.012,20,6);
  }
  // Fitted front piping leaves all four eyes unobscured.
  line(s,"#a71524",[[-.306,1.201,.278],[-.213,1.137,.323],[0,1.133,.346],[.213,1.137,.323],[.306,1.201,.278]],.031,36,8);
  line(s,light,[[-.276,1.148,.306],[0,1.113,.348],[.276,1.148,.306]],.006,30,6);
  // Crown panel seams track the ellipsoid, with individual stitches and fine scuffs.
  const crown=(x:number,y:number,back=false)=>.017+(back?-1:1)*.32*Math.sqrt(Math.max(.001,1-(x/.415)**2-((y-1.29)/.37)**2));
  for(const side of [-1,1]) {
    const pts:P[]=[];
    for(let i=0;i<=20;i++) {
      const t=i/20,y=1.415+t*.2,x=side*(.308-.185*t);pts.push([x,y,crown(x,y)+.004]);
    }
    line(s,"#90121e",pts,.005,26,6);
    for(let i=0;i<9;i++) {
      const t=i/9,y=1.425+t*.173,x=side*(.298-.16*t);
      pin(s,"#e06c58",[x-.007,y-.004,crown(x-.007,y-.004)+.008],[x+.007,y+.004,crown(x+.007,y+.004)+.008],.0021);
    }
  }
  line(s,"#7e1620",[[-.235,1.23,-.244],[-.172,1.42,-.261],[0,1.605,-.151],[.172,1.42,-.261],[.235,1.23,-.244]],.008,38,6);
  box(s,"#8e1723",[0,1.159,-.29],[.277,.211,.036],.028,2);
  for(let i=0;i<6;i++) {
    const y=1.09+i*.027;
    pin(s,"#d6a184",[-.067,y,-.314],[.062,y+.02,-.314],.0034);
    pin(s,"#ba775e",[.067,y,-.315],[-.062,y+.02,-.315],.0034);
  }
  for(let i=0;i<8;i++) {
    const x=-.255+i*.069,y=1.49+(i%3)*.025;
    pin(s,i%2?"#e68c63":"#a63730",[x,y,crown(x,y)+.007],[x+.015,y+.014,crown(x+.015,y+.014)+.007],.0025);
  }
  // Small belly folds and knuckle creases keep the brown body fully sculpted.
  line(s,"#5d4b3e",[[-.152,.34,.244],[0,.299,.267],[.152,.34,.244]],.005,28,6);
  line(s,"#9c8270",[[-.093,.59,.241],[0,.618,.249],[.093,.59,.241]],.004,22,5);
  return s.finish();
}

export const SCULPTS_Y_CREATURES:Record<string,()=>THREE.BufferGeometry>={mon_squeegee:squeegee,mon_headgear:headgear};
