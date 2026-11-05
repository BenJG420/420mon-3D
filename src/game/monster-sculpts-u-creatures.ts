import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function line(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function turn(s:Sculpt,color:string,profile:[number,number][],p:P=[0,0,0],segments=48) {
  s.surface(color,new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),segments).translate(...p));
}
function plate(s:Sculpt,color:string,points:[number,number][],z:number,depth=.012) {
  s.surface(color,new THREE.ExtrudeGeometry(new THREE.Shape(points.map(v=>new THREE.Vector2(...v))),
    {depth,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2}).translate(0,0,z));
}

/** #155: weathered brass cage, an open viewing chamber and a complete ghost flame. */
function lantern() {
  const s=new Sculpt({detail:"high"}),brass="#8b4c2b",edge="#bc7c4d",shade="#533327";
  // Turned pedestal and capped reservoir are closed volumes, including the underside.
  turn(s,shade,[[0,.08],[.22,.08],[.283,.1],[.321,.136],[.318,.165],[.281,.187],[0,.187]]);
  turn(s,brass,[[0,.14],[.264,.14],[.287,.173],[.245,.218],[.214,.261],[.241,.292],[.278,.313],[.27,.345],[0,.345]]);
  turn(s,edge,[[.242,.307],[.281,.307],[.293,.325],[.286,.347],[.265,.359],[.244,.343],[.242,.307]]);
  for(const side of [-1,1]) {
    oval(s,"#6c3f2c",[side*.248,.102,.072],[.075,.044,.085],20,12);
    oval(s,"#b98053",[side*.257,.119,.109],[.047,.025,.044],16,10);
  }
  // A deeper violet back and corner rails surround clear negative viewing space.
  const rear=new THREE.Shape();rear.moveTo(-.22,.377);rear.quadraticCurveTo(-.271,.407,-.247,.524);
  rear.lineTo(-.151,.967);rear.lineTo(.151,.967);rear.lineTo(.247,.524);
  rear.quadraticCurveTo(.271,.407,.22,.377);rear.closePath();
  s.surface("#514364",new THREE.ExtrudeGeometry(rear,{depth:.019,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:2,curveSegments:18}).translate(0,0,-.192));
  for(const side of [-1,1])for(const back of [-1,1]) {
    line(s,back>0?brass:shade,[[side*.232,.354,back*.152],[side*.275,.444,back*.143],
      [side*.238,.642,back*.128],[side*.173,.945,back*.103],[side*.17,1.006,back*.09]],.022,36,8);
    line(s,edge,[[side*.238,.373,back*.168],[side*.264,.454,back*.162],
      [side*.224,.646,back*.146],[side*.164,.953,back*.123]],.005,28,5);
  }
  // Narrow convex pane-edge glints retain the source glass outline without a new pass.
  for(const side of [-1,1]) {
    line(s,"#c8b8e2",[[side*.216,.403,.159],[side*.232,.474,.164],[side*.196,.682,.149],[side*.146,.914,.123]],.007,32,6);
    line(s,"#eee5f6",[[side*.211,.66,.157],[side*.186,.796,.149],[side*.152,.923,.128]],.009,26,6);
  }
  // The purple flame is a curved 3D pear with a tapered tip, not a flat sprite.
  const flame=(color:string,profile:[number,number][],p:P,size:P,bend:number)=>{
    const g=new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),48),pos=g.getAttribute("position");
    for(let i=0;i<pos.count;i++){const y=pos.getY(i);pos.setX(i,pos.getX(i)+bend*y*y+.016*Math.sin(y*10));}
    g.computeVertexNormals();s.surface(color,g.scale(...size).translate(...p));
  };
  const profile:[number,number][]=[[0,0],[.081,.016],[.135,.064],[.164,.142],[.154,.212],
    [.11,.294],[.069,.357],[.081,.398],[.039,.443],[0,.487]];
  flame("#8431c8",profile,[0,.369,.005],[1,1,.77],-.17);
  flame("#a64bea",profile,[.009,.379,.067],[.77,.86,.6],-.08);
  flame("#bd6cfa",profile,[.017,.39,.115],[.46,.64,.35],-.05);
  for(const side of [-1,1]) {
    oval(s,"#4a187d",[side*.063,.527,.157],[.036,.057,.022],24,16);
    oval(s,"#21103d",[side*.063,.53,.177],[.022,.038,.009],20,12);
    oval(s,"#6b3099",[side*.057,.513,.185],[.011,.015,.003],12,8);
  }
  // Burner tray and wick stay visible underneath the floating source flame.
  turn(s,"#49352f",[[0,.343],[.124,.343],[.139,.357],[.136,.377],[.1,.391],[0,.391]],[0,0,0],40);
  // Upper vented bonnet and a broad turned cap have separate stepped edges.
  turn(s,brass,[[0,.965],[.183,.965],[.209,.986],[.197,1.018],[.171,1.033],[.165,1.16],[.132,1.196],[0,1.196]]);
  for(let i=0;i<14;i++) {
    const a=i*Math.PI/7,x=Math.sin(a)*.17,z=Math.cos(a)*.17;
    const slot=new THREE.SphereGeometry(1,10,6).scale(.012,.037,.004).rotateY(a).translate(x,1.094,z);
    s.surface(shade,slot);
  }
  turn(s,edge,[[0,1.179],[.149,1.179],[.204,1.202],[.213,1.226],[.172,1.253],[.106,1.279],[0,1.281]]);
  turn(s,"#6b3c2b",[[.146,1.192],[.2,1.192],[.218,1.209],[.217,1.222],[.196,1.227],[.146,1.211],[.146,1.192]]);
  oval(s,"#bf8961",[-.018,1.267,.022],[.096,.016,.061],24,12);
  // The original broad side handle joins at both ends and remains genuinely open.
  const handle:P[]=[[-.154,1.139,-.022],[-.331,1.12,-.023],[-.453,.966,-.021],[-.526,.676,-.019],
    [-.527,.444,-.016],[-.437,.322,-.008],[-.254,.312,0]];
  line(s,shade,handle,.043,54,10);
  line(s,"#a4633b",handle.map(([x,y,z])=>[x-.005,y,z+.03]),.023,54,8);
  line(s,"#ce9260",handle.map(([x,y,z])=>[x-.011,y,z+.049]),.0045,54,5);
  for(const y of [.326,1.13]) {
    s.rod("#623a25",[-.262,y,.015],[-.262,y,.078],.026);
    oval(s,"#be8551",[-.262,y,.084],[.018,.018,.005],12,8);
  }
  oval(s,shade,[.167,.239,.186],[.055,.052,.022],24,14);
  oval(s,edge,[.167,.241,.207],[.04,.037,.013],20,12);
  s.box("#66432f",.167,.241,.223,.035,.006,.004,0,0,.5);
  // Hammered dents and patina are small curved relief, including the back.
  for(let i=0;i<24;i++) {
    const a=i*2.399963,y=.186+(i%3)*.025,r=.267-(y-.186)*.72;
    oval(s,i%3?"#985a35":"#c28a58",[Math.sin(a)*r,y,Math.cos(a)*r],[.009,.012,.006],8,6);
  }
  for(let i=0;i<7;i++)s.box("#91785d",-.102+i*.034,.228,-.238,.011,.034,.004);
  const geometry=s.finish(),colors=geometry.getAttribute("color"),weights=new Float32Array(colors.count);
  const emit=["#8431c8","#a64bea","#bd6cfa"].map(c=>new THREE.Color(c));
  for(let i=0;i<colors.count;i++)if(emit.some(c=>Math.abs(c.r-colors.getX(i))<1e-5&&Math.abs(c.g-colors.getY(i))<1e-5&&Math.abs(c.b-colors.getZ(i))<1e-5))weights[i]=.6;
  geometry.setAttribute("glowWeight",new THREE.BufferAttribute(weights,1));geometry.userData.glowSurface=true;
  return geometry;
}

/** #156: a round magenta creature inside actual interlaced, all-around net strands. */
function fishnet() {
  const s=new Sculpt({detail:"high"}),center=.72,rx=.465,ry=.612,rz=.359;
  oval(s,"#b62c89",[0,center,0],[rx,ry,rz],40,28);
  // Two counter-wound families lie on the complete volume, including the back.
  // Alternating tiny radial offsets make their crossings look woven, not painted.
  for(const hand of [-1,1])for(let strand=0;strand<10;strand++) {
    const points:P[]=[];
    for(let j=0;j<=52;j++) {
      const theta=.16+(Math.PI-.32)*j/52,phi=strand*Math.PI/5+hand*theta*2.05;
      const offset=.007+.0025*Math.sin(theta*20+strand*Math.PI)*hand;
      points.push([Math.sin(theta)*Math.cos(phi)*(rx+offset),center+Math.cos(theta)*(ry+offset),Math.sin(theta)*Math.sin(phi)*(rz+offset)]);
    }
    line(s,hand>0?"#30203b":"#3f2348",points,.011,52,6);
    // Fine purple edge threads keep the dark lattice readable under angled light.
    if(strand%2===0)line(s,"#713063",points.map(([x,y,z])=>[x*1.007,center+(y-center)*1.005,z*1.007]),.003,52,4);
  }
  for(const side of [-1,1]) {
    const x=side*.182,y=.896;
    // Deep dark sockets and sharp lids sit ahead of the wrapping strands.
    oval(s,"#34142f",[x,y,.339],[.115,.089,.034],24,16);
    const mirror=(v:[number,number][])=>v.map(([a,b]):[number,number]=>[a*side,b]);
    plate(s,"#e9bedf",mirror([[.079,.928],[.121,.861],[.2,.855],[.271,.922],[.222,.893],[.167,.885]]),.369,.012);
    oval(s,"#190f22",[side*.173,.891,.392],[.035,.037,.012],20,12);
    oval(s,"#f8dbef",[side*.165,.904,.403],[.011,.014,.003],12,8);
    line(s,"#29152d",[[side*.075,.944,.375],[side*.17,.912,.408],[side*.274,.952,.373]],.014,24,8);
    line(s,"#d946a0",[[side*.083,.963,.362],[side*.175,.937,.393],[side*.27,.973,.355]],.009,24,6);
  }
  // Folded knot/flaps at the crown have real thickness and raised dark seam edges.
  plate(s,"#501a48",[[-.26,1.229],[-.289,1.314],[-.153,1.407],[.023,1.376],[.136,1.301],[.082,1.228]],.046,.07);
  plate(s,"#c23994",[[-.242,1.268],[-.249,1.31],[-.143,1.377],[.008,1.351],[.091,1.293],[.046,1.261]],.122,.022);
  plate(s,"#682054",[[-.194,1.277],[-.15,1.32],[-.079,1.281],[-.025,1.32],[.081,1.244],[.05,1.198],[-.054,1.249],[-.107,1.218]],.157,.034);
  line(s,"#ed56b0",[[-.234,1.307,.151],[-.143,1.362,.153],[-.036,1.337,.151],[.046,1.282,.151]],.009,28,6);
  line(s,"#2b1933",[[-.214,1.283,.168],[-.151,1.327,.201],[-.076,1.269,.202],[-.024,1.311,.201],[.067,1.238,.202]],.012,30,6);
  line(s,"#9b2e7c",[[.076,1.29,-.078],[.174,1.271,-.051],[.217,1.17,-.055],[.152,1.105,-.093]],.035,24,8);
  line(s,"#391f3c",[[.078,1.304,-.054],[.187,1.27,-.025],[.233,1.174,-.032]],.009,20,6);
  // Six short toes and the original squat stance support the hanging rounded bag.
  for(const side of [-1,1]) {
    oval(s,"#3b293e",[side*.246,.115,.016],[.112,.065,.116],20,12);
    for(let toe=0;toe<3;toe++) {
      const x=side*.246+(toe-1)*.057;
      oval(s,"#473148",[x,.082,.103],[.032,.035,.052],14,10);
      line(s,"#241d2b",[[x-.018,.082,.142],[x,.077,.153],[x+.018,.082,.142]],.003,8,5);
    }
  }
  return s.finish();
}

export const SCULPTS_U_CREATURES:Record<string,()=>THREE.BufferGeometry>={mon_lantern:lantern,mon_fishnet:fishnet};
