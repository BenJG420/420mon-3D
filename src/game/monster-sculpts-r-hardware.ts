import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
type XY=[number,number];
function cord(s:Sculpt,color:string,points:P[],radius:number,steps=24,sides=8) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,radius,sides,false));
}
function oval(s:Sculpt,color:string,center:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...center));
}
function plate(s:Sculpt,color:string,shape:THREE.Shape,z:number,depth:number,bevel=.012,segments=10,bevelSegments=3) {
  s.surface(color,new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:bevel,
    bevelThickness:bevel,bevelSegments,curveSegments:segments}).translate(0,0,z));
}
function polygon(points:XY[]) { return new THREE.Shape(points.map(p=>new THREE.Vector2(...p))); }
function turn(s:Sculpt,color:string,profile:XY[],p:P,segments=32) {
  s.surface(color,new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),segments).rotateX(Math.PI/2).translate(...p));
}
function bolt(s:Sculpt,x:number,y:number,z:number,r=.029,back=false) {
  const sign=back?-1:1;
  const g=new THREE.CylinderGeometry(r,r,.023,16).rotateX(Math.PI/2).translate(x,y,z);
  s.surface("#685141",g);
  oval(s,"#b69670",[x-.003,y+.004,z+sign*.014],[r*.69,r*.69,.006],12,8);
  s.box("#3f342d",x,y,z+sign*.022,r*1.02,.004,.003,0,0,.5);
}
function flake(s:Sculpt,x:number,y:number,z:number,r:number,index:number,color:string) {
  const points:XY[]=[];
  for(let j=0;j<7;j++) {
    const a=j*Math.PI*2/7,k=.72+.28*Math.sin(j*2.7+index);
    points.push([x+Math.cos(a)*r*k,y+Math.sin(a)*r*k]);
  }
  plate(s,color,polygon(points),z,.003,.001,1,1);
}

/** #133: full-depth locking pliers, genuinely separated toothed jaws and linkage. */
function vicegrip() {
  const s=new Sculpt({detail:"high"}), rust="#815a37", warm="#a47b50", dark="#4c3b2d", steel="#b39774";
  // The two forged arms are distinct curved slabs, leaving the source's open jaws
  // and spread handle gap clear all the way through the tool.
  const fixed=new THREE.Shape();
  fixed.moveTo(-.69,1.23);fixed.lineTo(-.61,1.365);fixed.lineTo(-.32,1.245);
  fixed.bezierCurveTo(-.12,1.19,.005,.995,.063,.8);
  fixed.bezierCurveTo(.36,.722,.574,.43,.609,.241);
  fixed.quadraticCurveTo(.634,.153,.555,.125);fixed.lineTo(.469,.15);
  fixed.bezierCurveTo(.385,.349,.302,.505,.099,.55);
  fixed.lineTo(-.072,.689);fixed.lineTo(-.234,.984);fixed.lineTo(-.456,1.146);fixed.closePath();
  plate(s,rust,fixed,-.083,.144,.026,20);
  const moving=new THREE.Shape();
  moving.moveTo(-.759,1.027);moving.lineTo(-.688,1.094);moving.lineTo(-.523,.977);
  moving.lineTo(-.358,.988);moving.quadraticCurveTo(-.155,.901,.074,.713);
  moving.quadraticCurveTo(.195,.6,.12,.449);moving.quadraticCurveTo(.029,.232,-.125,.117);
  moving.quadraticCurveTo(-.193,.058,-.301,.086);moving.lineTo(-.271,.184);
  moving.quadraticCurveTo(-.135,.361,-.086,.492);moving.quadraticCurveTo(-.032,.632,-.147,.716);
  moving.lineTo(-.428,.844);moving.lineTo(-.644,.867);moving.closePath();
  plate(s,"#765032",moving,.059,.112,.024,20);
  // Inner forged recesses and narrow polished perimeter ribs remain rounded.
  cord(s,warm,[[-.583,1.314,.085],[-.336,1.203,.089],[-.169,1.017,.089],[-.054,.79,.086],[.256,.62,.085],[.462,.355,.087],[.55,.201,.085]],.012,54,8);
  cord(s,"#ac845b",[[-.664,.928,.193],[-.438,.899,.198],[-.212,.799,.198],[.036,.615,.198],[-.004,.415,.198],[-.196,.16,.195]],.012,48,8);
  cord(s,dark,[[.131,.634,.094],[.28,.547,.104],[.423,.353,.103],[.475,.252,.098]],.022,30,8);
  cord(s,dark,[[-.11,.683,.201],[-.013,.59,.211],[-.097,.4,.208],[-.19,.257,.201]],.018,28,8);
  // Actual small triangular teeth point into the open bite, never across it.
  for(let i=0;i<6;i++) {
    const x=-.663+i*.039,y=1.217-i*.018;
    plate(s,steel,polygon([[x-.014,y+.018],[x+.023,y+.002],[x+.009,y-.036],[x-.009,y-.02]]),-.073,.123,.003,1);
    const xx=-.691+i*.039,yy=.983-i*.019;
    plate(s,"#b18e64",polygon([[xx-.019,yy-.027],[xx+.021,yy-.046],[xx+.019,yy+.004],[xx-.001,yy+.018]]),.056,.108,.003,1);
  }
  // Jaw root ribs, rivets and a locking spring reveal the mechanical construction.
  for(let i=0;i<4;i++) {
    s.rod("#5d422d",[-.357+i*.038,1.174-i*.025,.088],[-.29+i*.033,1.057-i*.024,.091],.006);
    s.rod("#ad865c",[-.529+i*.04,.904-i*.01,.192],[-.51+i*.04,.858-i*.008,.191],.004);
  }
  for(const [x,y,z,r] of [[-.163,.846,.199,.038],[.019,.599,.207,.045],[.265,.514,.089,.03],[.522,.257,.089,.023]])bolt(s,x,y,z,r);
  const linkage=polygon([[-.033,.771],[.075,.806],[.294,.623],[.245,.569],[.045,.725],[-.059,.709]]);
  plate(s,"#aa8052",linkage,.203,.033,.011);
  bolt(s,.065,.756,.246,.033);bolt(s,.245,.61,.246,.026);
  const spring:P[]=[];
  for(let i=0;i<=80;i++) {
    const t=i/80,a=t*Math.PI*14;
    spring.push([.074+t*.2+Math.cos(a)*.016,.5-t*.185+Math.sin(a)*.016,.02]);
  }
  cord(s,"#5b5145",spring,.004,80,6);
  s.rod("#887257",[.061,.508,.018],[.1,.49,.018],.01);
  s.rod("#887257",[.269,.32,.018],[.304,.311,.018],.01);
  // The rounded source head is a heavy pivot cap with its own rear casing.
  turn(s,dark,[[0,-.09],[.15,-.09],[.192,-.062],[.215,-.017],[.212,.076],[.181,.112],[0,.112]],[.278,1.034,.055],48);
  oval(s,"#8b623e",[.278,1.034,.169],[.189,.198,.045],28,18);
  s.torus("#b18a5b",.278,1.035,.166,.188,.008);
  for(const side of [-1,1]) {
    const x=.278+side*.077;
    oval(s,"#3e3028",[x,1.025,.208],[.068,.067,.019],20,12);
    oval(s,"#c78228",[x,1.016,.225],[.047,.045,.009],16,10);
    oval(s,"#f2b44c",[x-side*.009,1.016,.233],[.027,.032,.005],14,8);
    oval(s,"#231f23",[x+side*.008,1.017,.238],[.011,.028,.004],12,8);
    oval(s,"#fff0b9",[x-side*.015,1.031,.24],[.007,.01,.003],10,6);
    cord(s,dark,[[.278+side*.016,1.048,.222],[.278+side*.082,1.084,.221],[.278+side*.151,1.143,.178]],.018,20,8);
    cord(s,"#ba9163",[[.278+side*.032,1.074,.223],[.278+side*.108,1.119,.203]],.005,16,6);
  }
  // Irregular corrosion islands and scratches track each broad forged arm.
  for(let i=0;i<16;i++) {
    const t=i/15,x=-.574+t*.46,y=1.29-t*.38;
    flake(s,x+.014*Math.sin(i),y,.084,.013+(i%3)*.005,i,i%2?"#6e482d":"#bb9367");
  }
  for(let i=0;i<13;i++) {
    const t=i/12,x=.141+t*.409,y=.699-t*.479;
    flake(s,x,y,.088,.013+(i%2)*.009,i+7,i%3?"#68442c":"#aa8052");
  }
  for(let i=0;i<8;i++) {
    const t=i/7;flake(s,-.576+t*.46,.89-t*.13,.198,.012,i,"#b28959");
  }
  // Closed rear hardware and long forged moulding seams finish its back.
  for(const [x,y] of [[-.122,.843],[.025,.638],[.278,1.034]])bolt(s,x,y,-.11,.033,true);
  cord(s,"#6b5038",[[-.59,1.29,-.111],[-.34,1.19,-.112],[-.145,.96,-.111],[.065,.734,-.108],[.405,.411,-.111]],.007,46,6);
  s.roundedBox(dark,.52,.129,.017,.202,.047,.193,.013);
  s.roundedBox("#8a623d",.521,.151,.029,.178,.031,.175,.012);
  return s.finish();
}

function roundedRect(w:number,h:number,r:number,x=0,y=0) {
  const p=new THREE.Shape(),l=x-w/2,b=y-h/2;
  p.moveTo(l+r,b);p.lineTo(l+w-r,b);p.quadraticCurveTo(l+w,b,l+w,b+r);
  p.lineTo(l+w,b+h-r);p.quadraticCurveTo(l+w,b+h,l+w-r,b+h);
  p.lineTo(l+r,b+h);p.quadraticCurveTo(l,b+h,l,b+h-r);p.lineTo(l,b+r);p.quadraticCurveTo(l,b,l+r,b);return p;
}
function keyhole() {
  const p=new THREE.Shape();
  p.moveTo(Math.cos(4.31)*.067,.535+Math.sin(4.31)*.067);
  p.absarc(0,.535,.067,4.31,5.11,true);p.lineTo(.047,.35);p.lineTo(-.047,.35);p.closePath();return p;
}

/** #135: thick rusted lock case, real recessed keyway and genuinely open shackle. */
function padlock() {
  const s=new Sculpt({detail:"high"}), steel="#797a76", rust="#89542f", dark="#3e3b36";
  // A closed back and open-faced cast shell put the keyway deep inside the lock.
  s.roundedBox("#525858",0,.622,-.09,.776,.756,.162,.035);
  const front=roundedRect(.77,.752,.035,0,.622);front.holes.push(keyhole());
  plate(s,steel,front,-.065,.259,.021,12);
  // Raised irregular perimeter seam is kept separate from the cast front face.
  const frame=roundedRect(.753,.735,.03,0,.622);frame.holes.push(roundedRect(.697,.68,.021,0,.622));
  plate(s,"#8c6a4e",frame,.213,.009,.004,8);
  plate(s,"#1e2427",keyhole(),.006,.012,.001,12);
  const outerKey=polygon(keyhole().getPoints(24).map(p=>[p.x*1.15,.5+(p.y-.5)*1.1] as XY));
  outerKey.holes.push(keyhole());plate(s,"#a39478",outerKey,.216,.008,.003,10);
  // Long U-shaped solid shackle, with an unobstructed centre and polished front.
  const bow:P[]=[[-.239,.974,-.017],[-.24,1.267,-.017],[-.217,1.402,-.017],[-.134,1.503,-.017],
    [0,1.551,-.017],[.142,1.49,-.017],[.224,1.379,-.017],[.243,1.217,-.017],[.243,.98,-.017]];
  cord(s,"#77756c",bow,.055,72,16);
  cord(s,"#b6ad95",bow.map(([x,y,z])=>[x-.014,y,z+.046]),.01,64,8);
  cord(s,"#675545",bow.map(([x,y,z])=>[x+.032,y,z-.012]),.006,64,6);
  for(const side of [-1,1]) {
    // Recessed circular sockets and polished barrel ends locate the legs in the lid.
    s.torus(dark,side*.24,.993,-.017,.066,.012,Math.PI/2);
    s.torus("#a49473",side*.24,1.004,-.017,.064,.006,Math.PI/2);
    for(let i=0;i<5;i++) {
      const y=1.052+i*.082,x=side*(.24-(i>2?.011*(i-2):0));
      oval(s,i%2?rust:"#a17048",[x+.021,y,.031],[.014,.025,.005],10,6);
    }
  }
  // Angular eye recesses carry small pale irises below heavy steel brows.
  for(const side of [-1,1]) {
    const mirror=(pts:XY[])=>pts.map(([x,y]):XY=>[x*side,y]);
    plate(s,"#303331",polygon(mirror([[.066,.784],[.112,.664],[.207,.659],[.254,.761],[.232,.811],[.143,.754]])),.212,.016,.008);
    plate(s,"#c4c1a5",polygon(mirror([[.091,.765],[.128,.687],[.196,.684],[.223,.75],[.209,.78],[.146,.737]])),.235,.012,.005);
    oval(s,"#24272a",[side*.157,.722,.259],[.022,.04,.008],16,10);
    oval(s,"#f4ecd3",[side*.143,.744,.267],[.009,.014,.003],12,8);
    cord(s,"#454940",[[side*.058,.79,.236],[side*.145,.813,.237],[side*.271,.891,.218]],.02,24,8);
    cord(s,"#a3a18b",[[side*.071,.811,.24],[side*.166,.844,.239],[side*.264,.903,.217]],.006,24,6);
    // Splayed feet retain the small source stance beneath the heavy rectangular body.
    oval(s,"#444b47",[side*.237,.169,.011],[.089,.085,.099],20,12);
    oval(s,"#696f62",[side*.263,.12,.079],[.119,.05,.127],20,12);
    for(let i=0;i<3;i++)s.rod("#8c8b75",[side*.263+(i-1)*.042,.128,.149],[side*.263+(i-1)*.046,.1,.186],.005);
    for(const y of [.299,.942])bolt(s,side*.318,y,.229,.026);
  }
  // Small rust flakes surround the front perimeter while keeping eyes/keyway clear.
  for(let i=0;i<31;i++) {
    const side=i%2?1:-1,x=side*(.27+.046*Math.sin(i*2.4)),y=.32+(i%11)*.058;
    flake(s,x,y,.22,.011+(i%4)*.006,i,i%3?rust:"#ad7850");
  }
  for(let i=0;i<11;i++) {
    const x=-.283+i*.056;
    flake(s,x,.966-.008*Math.sin(i),.22,.014+(i%3)*.005,i+9,rust);
    flake(s,x,.285+.007*Math.cos(i),.22,.012,i+3,"#735036");
  }
  // Side panel seams, shallow scores and rear service rivets remain fully modelled.
  for(const side of [-1,1]) {
    cord(s,"#454d48",[[side*.39,.312,-.071],[side*.39,.63,-.072],[side*.39,.918,-.071]],.005,24,6);
    for(let i=0;i<8;i++)oval(s,i%2?rust:"#a47850",[side*.388,.35+i*.075,.055],[.004,.018,.014],10,6);
  }
  s.roundedBox("#676d65",0,.622,-.18,.641,.611,.026,.028);
  for(const x of [-.26,.26])for(const y of [.371,.878])bolt(s,x,y,-.202,.023,true);
  s.roundedBox("#3f4844",0,.625,-.202,.266,.182,.014,.012);
  for(let i=0;i<6;i++)s.box("#878975",0,.568+i*.022,-.212,.208-(i%3)*.031,.007,.003);
  for(let i=0;i<9;i++) {
    const x=-.276+i*.068;
    s.rod("#737663",[x,.341,-.199],[x+.023,.39,-.201],.0025);
  }
  return s.finish();
}

export const SCULPTS_R_HARDWARE:Record<string,()=>THREE.BufferGeometry>={mon_vicegrip:vicegrip,mon_padlock:padlock};
