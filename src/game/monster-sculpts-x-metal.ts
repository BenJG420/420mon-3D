import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function box(s:Sculpt,color:string,p:P,size:P,r=.012,segments=2) {
  s.surface(color,new RoundedBoxGeometry(...size,segments,r).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function plate(s:Sculpt,color:string,points:[number,number][],z:number,depth=.018,bevel=.004,segments=2) {
  s.surface(color,new THREE.ExtrudeGeometry(new THREE.Shape(points.map(p=>new THREE.Vector2(...p))),
    {depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:segments}).translate(0,0,z));
}
function screw(s:Sculpt,p:P,r=.024,back=false) {
  const d=back?-1:1;
  oval(s,"#343c3f",p,[r*1.18,r*1.18,.008],10,6);
  s.surface("#929b99",new THREE.CylinderGeometry(r,r,.016,12).rotateX(Math.PI/2).translate(p[0],p[1],p[2]+d*.008));
  s.box("#485051",p[0],p[1],p[2]+d*.018,r*1.2,.005,.003,0,0,.37);
}

/** #169: a thick toothed saw body, angry motor casing and a genuinely open handle. */
function circsaw() {
  const s=new Sculpt({detail:"high"}),cy=.684;
  // The circular forging has a complete thick rim and dished front/back covers.
  s.surface("#655b4a",new THREE.CylinderGeometry(.433,.433,.221,80).rotateX(Math.PI/2).translate(0,cy,0));
  for(const side of [-1,1]) {
    const profile:[number,number][]=[[0,0],[.19,0],[.348,.008],[.409,.026],[.432,.045],[.426,.066],[.4,.079],[.346,.073],[.185,.063],[0,.063]];
    s.surface(side>0?"#8b8b7d":"#6b6b61",new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),64)
      .rotateX(side>0?Math.PI/2:-Math.PI/2).translate(0,cy,side*.084));
  }
  // Twenty-four substantial swept teeth are separate bevelled solids, not a saw decal.
  for(let tooth=0;tooth<24;tooth++) {
    const a=tooth*Math.PI/12,shape:[number,number][]=[];
    for(const [r,t] of [[.423,-.048],[.501,.021],[.503,.056],[.456,.076],[.432,.143]])shape.push([Math.cos(a+t)*r,cy+Math.sin(a+t)*r]);
    plate(s,tooth%3?"#825f3d":"#a78053",shape,-.067,.134,.007,2);
    const tip:P=[Math.cos(a+.052)*.488,cy+Math.sin(a+.052)*.488,.079];
    cord(s,"#b8ac8b",[[Math.cos(a-.032)*.435,cy+Math.sin(a-.032)*.435,.079],tip],.003,6,5);
  }
  for(const side of [-1,1]) {
    s.surface(side>0?"#b2ac8f":"#8c8a74",new THREE.TorusGeometry(.401,.007,6,64).translate(0,cy,side*.159));
    s.surface("#585a4e",new THREE.TorusGeometry(.113,.012,8,40).translate(0,cy,side*.153));
    s.surface("#a58a61",new THREE.CylinderGeometry(.092,.099,.027,12).rotateX(Math.PI/2).translate(0,cy,side*.162));
    s.surface("#4f4b40",new THREE.TorusGeometry(.061,.008,6,32).translate(0,cy,side*.184));
    oval(s,"#927b55",[0,cy,side*.184],[.047,.047,.012],20,12);
    s.box("#423d34",0,cy,side*.198,.044,.009,.003,0,0,.62);
    // Pressed diagonal ribs and worn circular scratches follow the disk face.
    for(let i=0;i<4;i++) {
      const a=i*Math.PI/2+.71,points:P[]=[];
      for(let j=0;j<=14;j++) {const t=j/14,r=.158+.225*t,angle=a+.15*Math.sin(t*Math.PI);points.push([Math.cos(angle)*r,cy+Math.sin(angle)*r,side*(.15+.009*t)]);}
      cord(s,i%2?"#725d3f":"#a18b66",points,.012,22,6);
      cord(s,"#b6a581",points.map(([x,y,z])=>[x+.006,y+.003,z+side*.009]),.003,22,5);
    }
    for(let i=0;i<8;i++) {
      const radius=.185+i*.025,points:P[]=[];
      for(let j=0;j<=8;j++){const a=.25+i*.71+j*.04;points.push([Math.cos(a)*radius,cy+Math.sin(a)*radius,side*.162]);}
      cord(s,i%2?"#b4af92":"#766b53",points,.0025,10,5);
    }
  }
  // Full motor housing with a bevelled arched shoulder and a low retaining lip.
  const head:[number,number][]=[[-.353,1.063],[-.375,1.141],[-.37,1.305],[-.295,1.404],[-.188,1.434],
    [.203,1.43],[.31,1.39],[.371,1.302],[.371,1.146],[.34,1.063]];
  plate(s,"#755039",head,-.163,.348,.026,4);
  box(s,"#533e31",[0,1.065,.025],[.798,.073,.438],.022,3);
  box(s,"#b58351",[0,1.095,.233],[.733,.025,.033],.01,2);
  // The source eyes remain forward of the real curved housing.
  for(const side of [-1,1]) {
    const mirror=(points:[number,number][])=>points.map(([x,y]):[number,number]=>[x*side,y]);
    plate(s,"#2d2520",mirror([[.052,1.26],[.094,1.148],[.206,1.132],[.291,1.285],[.191,1.233]]),.19,.015,.006);
    plate(s,"#d7d1b8",mirror([[.079,1.245],[.119,1.172],[.191,1.159],[.258,1.26],[.187,1.216]]),.211,.012,.004);
    oval(s,"#231f1b",[side*.16,1.201,.235],[.027,.037,.01],20,12);
    oval(s,"#fff7dc",[side*.148,1.218,.245],[.009,.013,.003],12,8);
    cord(s,"#9b714a",[[side*.045,1.288,.197],[side*.16,1.26,.234],[side*.292,1.324,.194]],.01,24,6);
  }
  // Actual U-shaped carrying handle; its centre stays empty through the back.
  const handle:P[]=[[-.184,1.421,-.004],[-.169,1.573,-.003],[-.103,1.637,-.003],
    [.045,1.651,-.003],[.155,1.597,-.003],[.186,1.423,-.003]];
  cord(s,"#64432d",handle,.036,46,10);
  cord(s,"#a17b4f",handle.map(([x,y,z])=>[x-.008,y+.005,z+.031]),.006,46,6);
  for(const side of [-1,1]) {
    box(s,"#4e3f2e",[side*.184,1.429,-.004],[.128,.06,.162],.018,2);
    screw(s,[side*.185,1.43,.086],.018);
    s.rod("#604734",[side*.24,.278,-.022],[side*.3,.144,.005],.059);
    box(s,"#795536",[side*.31,.098,.054],[.238,.103,.257],.029,3);
    box(s,"#b08c5c",[side*.322,.129,.144],[.182,.03,.074],.011,2);
    for(let j=0;j<3;j++)s.box("#43372d",side*.31-.065+j*.065,.082,.186,.01,.035,.005);
  }
  // Rear access plate/vents and all-around cast rust keep the turned model complete.
  box(s,"#4d4b40",[0,1.247,-.191],[.537,.22,.025],.023,3);
  for(let i=0;i<7;i++)box(s,"#242f2d",[-.206+i*.069,1.247,-.21],[.022,.137,.011],.007,1);
  for(const side of [-1,1])for(const y of [1.155,1.342])screw(s,[side*.282,y,-.193],.018,true);
  for(const side of [-1,1])for(let i=0;i<20;i++) {
    const a=i*2.399963,r=.17+.208*Math.sqrt((i+.5)/20),x=Math.cos(a)*r,y=cy+Math.sin(a)*r;
    oval(s,i%3?"#9a7347":"#675641",[x,y,side*.163],[.014+(i%3)*.006,.023+(i%4)*.006,.0025],8,6);
  }
  for(let i=0;i<14;i++) {
    const x=-.31+i*.047,y=i%2?1.374:1.098;
    oval(s,i%3?"#a57848":"#b4a482",[x,y,.207],[.013,.009,.003],8,6);
  }
  return s.finish();
}

/** #170: thick sluice frame, inset amber eyes, real bars and a deep purple water chamber. */
function tidegate() {
  const s=new Sculpt({detail:"high"});
  // Separate pillars/rails form a complete deep frame rather than a closed front box.
  for(const side of [-1,1]) {
    box(s,"#636e70",[side*.541,.868,0],[.173,1.337,.359],.025,3);
    box(s,"#8c9693",[side*.541,.873,.192],[.139,1.293,.034],.013,2);
    box(s,"#39464d",[side*.445,.779,-.043],[.038,1.021,.297],.009,2);
    for(const y of [.261,1.443])box(s,"#727e7d",[side*.541,y,.018],[.26,.239,.419],.027,2);
  }
  for(const y of [.218,1.479]) {
    box(s,"#5d6a6b",[0,y,-.019],[1.083,.174,.343],.022,2);
    box(s,"#8f9994",[0,y+.018,.177],[1.043,.067,.039],.014,2);
  }
  box(s,"#89938f",[0,1.502,.032],[.45,.224,.399],.023,2);
  // Eye rail has true diamond openings; the amber lenses are recessed within it.
  const eyeRail=new THREE.Shape([[-.441,1.139],[-.441,1.362],[.441,1.362],[.441,1.139]].map(p=>new THREE.Vector2(...p)));
  for(const x of [-.211,.211]) {
    const hole=new THREE.Path();hole.moveTo(x-.091,1.255);hole.lineTo(x,1.312);hole.lineTo(x+.091,1.255);hole.lineTo(x,1.198);hole.closePath();eyeRail.holes.push(hole);
  }
  s.surface("#525e61",new THREE.ExtrudeGeometry(eyeRail,{depth:.083,bevelEnabled:true,bevelSize:.007,bevelThickness:.007,bevelSegments:3}).translate(0,0,.124));
  for(const x of [-.211,.211]) {
    oval(s,"#1c2c30",[x,1.255,.128],[.093,.06,.021],24,14);
    oval(s,"#efb032",[x,1.255,.157],[.063,.039,.018],24,16);
    oval(s,"#ffd66f",[x-.002,1.257,.174],[.04,.024,.007],20,12);
    oval(s,"#fff0b7",[x-.01,1.265,.18],[.017,.012,.003],12,8);
  }
  for(const x of [-.391,0,.391])box(s,"#77827d",[x,1.252,.214],[.068,.177,.019],.009,2);
  // Four physical gate bars stand well ahead of the deep, finished purple rear wall.
  box(s,"#302639",[0,.718,-.19],[.886,.886,.065],.029,2);
  box(s,"#4e3054",[0,.735,-.148],[.831,.849,.021],.021,2);
  for(let i=0;i<7;i++) {
    const x=-.348+i*.116;
    cord(s,i%2?"#61416b":"#442e50",[[x,.344,-.131],[x+.012,.619,-.13],[x-.007,.881,-.132],[x+.006,1.107,-.13]],.008,22,6);
  }
  for(const x of [-.329,-.11,.11,.329]) {
    box(s,"#536469",[x,.729,.073],[.061,.865,.123],.02,2);
    box(s,"#9ba6a0",[x-.014,.738,.141],[.013,.821,.013],.005,1);
    box(s,"#36494e",[x+.022,.729,.124],[.012,.804,.012],.004,1);
  }
  for(const y of [.316,1.119]) {
    box(s,"#738384",[0,y,.147],[.904,.067,.057],.014,2);
    box(s,"#a3aeaa",[0,y+.022,.177],[.879,.012,.012],.004,1);
  }
  // Complete cast fasteners run along both sides and the crossrails, including the back.
  for(const side of [-1,1])for(const y of [.197,.323,.521,.81,1.084,1.371,1.503])screw(s,[side*.542,y,.242],.03);
  for(const x of [-.343,-.17,.17,.343])for(const y of [.216,1.499])screw(s,[x,y,.203],.023);
  for(const x of [-.182,.182])for(const y of [1.445,1.567])screw(s,[x,y,.248],.016);
  // Blue streams stay between/along the bars and spill over the lower metal lip.
  const flows:P[][]=[
    [[-.24,1.087,.014],[-.253,.902,.031],[-.245,.691,.049],[-.244,.428,.104],[-.28,.327,.19],[-.322,.288,.202]],
    [[.022,1.091,.028],[.011,.914,.037],[.034,.74,.048],[.014,.496,.061],[.027,.332,.186],[.115,.302,.212]],
    [[.246,1.086,.035],[.262,.939,.047],[.244,.811,.065],[.254,.598,.078],[.255,.387,.131],[.299,.322,.191]],
  ];
  for(let i=0;i<flows.length;i++) {
    cord(s,"#78abc2",flows[i],.012+(i===1?.004:0),32,7);
    cord(s,"#c1deea",flows[i].map(([x,y,z])=>[x-.004,y,z+.009]),.004,32,5);
  }
  for(const [x,root,end] of [[-.322,.301,.106],[-.182,.31,.207],[.115,.309,.042],[.3,.32,.171]]) {
    cord(s,"#8ebace",[[x,root,.222],[x+.005,(root+end)/2,.23],[x,end,.235]],.007,22,6);
    oval(s,"#b4d4df",[x,end,.235],[.012,.029,.012],14,10);
  }
  for(let i=0;i<7;i++)oval(s,"#b9d7de",[-.374+i*.12,.329+(i%2)*.012,.203],[.013,.02,.01],10,6);
  // The back has braced rails, a service plate and oxidation, not a blank surface.
  for(const side of [-1,1]) {
    box(s,"#3e4e53",[side*.416,.789,-.228],[.045,.994,.026],.009,2);
    for(const y of [.273,1.417])screw(s,[side*.538,y,-.214],.024,true);
  }
  box(s,"#5e696b",[0,.701,-.232],[.461,.286,.018],.022,2);
  for(let i=0;i<6;i++)s.box("#9aa49c",0,.804-i*.039,-.245,.362-(i%3)*.054,.007,.004);
  for(let i=0;i<24;i++) {
    const side=i%2?1:-1,y=.405+(i%10)*.09;
    oval(s,i%3?"#9a9d85":"#736a4e",[side*.548,y,.218],[.014+(i%3)*.004,.017+(i%4)*.005,.003],8,6);
  }
  const geometry=s.finish(),colors=geometry.getAttribute("color"),weights=new Float32Array(colors.count);
  const emit=["#efb032","#ffd66f","#fff0b7"].map(c=>new THREE.Color(c));
  for(let i=0;i<colors.count;i++)if(emit.some(c=>Math.abs(c.r-colors.getX(i))<1e-5&&Math.abs(c.g-colors.getY(i))<1e-5&&Math.abs(c.b-colors.getZ(i))<1e-5))weights[i]=.55;
  geometry.setAttribute("glowWeight",new THREE.BufferAttribute(weights,1));geometry.userData.glowSurface=true;
  return geometry;
}

export const SCULPTS_X_METAL:Record<string,()=>THREE.BufferGeometry>={mon_circsaw:circsaw,mon_tidegate:tidegate};
