import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type Point = [number, number, number];

function roundedRect(w: number, h: number, r: number, x = 0, y = 0) {
  const p = new THREE.Shape(), l = x - w / 2, b = y - h / 2;
  r = Math.min(r,w/2,h/2);
  p.moveTo(l+r,b); p.lineTo(l+w-r,b); p.quadraticCurveTo(l+w,b,l+w,b+r);
  p.lineTo(l+w,b+h-r); p.quadraticCurveTo(l+w,b+h,l+w-r,b+h);
  p.lineTo(l+r,b+h); p.quadraticCurveTo(l,b+h,l,b+h-r);
  p.lineTo(l,b+r); p.quadraticCurveTo(l,b,l+r,b);
  return p;
}
function plate(s: Sculpt, color: string, shape: THREE.Shape, z: number, depth: number, bevel = .006, segments = 6, bevelSegments = 3) {
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,
    bevelSegments,bevelSize:bevel,bevelThickness:bevel,curveSegments:segments});
  s.surface(color,geometry.translate(0,0,z));
}
function rim(s: Sculpt, color: string, x: number, y: number, z: number, w: number, h: number, r: number, width: number) {
  const shape=roundedRect(w,h,r,x,y);
  shape.holes.push(roundedRect(w-width*2,h-width*2,Math.max(.004,r-width),x,y));
  plate(s,color,shape,z,.014,.002,5,2);
}
function line(s: Sculpt, color: string, points: Point[], radius: number, segments = 18) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  s.surface(color,new THREE.TubeGeometry(curve,segments,radius,6,false));
}
function oval(s: Sculpt, color: string, p: Point, scale: Point, width = 16, height = 10) {
  s.surface(color,new THREE.SphereGeometry(1,width,height).scale(...scale).translate(...p));
}
function screw(s: Sculpt, x: number, y: number, z: number, back = false) {
  const sign=back?-1:1;
  s.rod("#383439",[x,y,z],[x,y,z+sign*.012],.019);
  s.rod("#8c8075",[x,y,z+sign*.012],[x,y,z+sign*.018],.013);
  s.box("#242127",x,y,z+sign*.019,.017,.003,.002,0,0,.25);
}
function arch(inset = 0) {
  const p=new THREE.Shape(), width=.386-inset, bottom=.18+inset, shoulder=1.03;
  p.moveTo(-width,bottom); p.lineTo(width,bottom); p.lineTo(width,shoulder);
  p.bezierCurveTo(width,1.23-inset,.18,1.42-inset,0,1.425-inset);
  p.bezierCurveTo(-.18,1.42-inset,-width,1.23-inset,-width,shoulder);
  p.lineTo(-width,bottom); p.closePath(); return p;
}

/** #123 — heavy curved postbox, its real letter aperture above the watching door. */
function letterbox() {
  const s=new Sculpt({detail:"high"});
  const steel="#656365", iron="#3e3c40", rust="#885333", rustLight="#ad744b";
  const body=arch();
  body.holes.push(roundedRect(.614,.105,.017,0,.934));
  body.holes.push(roundedRect(.625,.567,.034,0,.562));
  plate(s,steel,body,-.154,.36,.019,10);
  plate(s,"#4e4c50",arch(.016),-.224,.045,.014,10);
  const seam=arch(.008);seam.holes.push(arch(.035));
  plate(s,"#794b36",seam,-.175,.013,.003,10);
  const outline=arch(.026);outline.holes.push(arch(.047));
  plate(s,"#9a7760",outline,.22,.012,.004,10);

  // Nothing seals the slot at the front: recessed rear wall, sloping tray and
  // separate overhanging rain lip produce an actual narrow mouth.
  plate(s,"#15171e",roundedRect(.6,.102,.012,0,.934),-.102,.014,.002);
  s.box("#4d494a",0,.889,.065,.579,.014,.255,.075);
  s.roundedBox("#938a7c",0,.881,.202,.598,.029,.055,.008);
  s.roundedBox("#343135",0,1.016,.214,.676,.038,.071,.011,.08);
  rim(s,"#3a3437",0,.934,.219,.667,.154,.029,.022);
  rim(s,"#aaa093",0,.933,.24,.622,.111,.015,.009);
  for(let i=0;i<7;i++) s.box("#8f8174",-.253+i*.084,.977,.247,.026,.007,.004);

  // The broad recessed service door has two punched square eyes and a key slot.
  plate(s,"#27272e",roundedRect(.62,.56,.033,0,.562),-.02,.025,.006);
  const door=roundedRect(.582,.523,.028,0,.562);
  for(const x of [-.143,.143])door.holes.push(roundedRect(.097,.101,.01,x,.679));
  plate(s,"#746c65",door,.121,.039,.009);
  rim(s,"#3b3435",0,.563,.17,.605,.547,.034,.013);
  for(const x of [-.143,.143]) {
    plate(s,"#262120",roundedRect(.091,.095,.008,x,.679),.078,.012,.002);
    rim(s,"#b8a36a",x,.679,.166,.105,.109,.014,.011);
    plate(s,"#e0cc45",roundedRect(.071,.074,.006,x,.679),.127,.012,.002);
    s.box("#332c22",x,.678,.143,.025,.043,.009);
    s.box("#fff4aa",x-.018,.697,.146,.014,.013,.005);
    for(const y of [.326,.794])screw(s,x*1.7,y,.169);
  }
  s.rod("#3a3030",[0,.359,.168],[0,.359,.185],.023);
  s.box("#241d24",0,.344,.188,.009,.028,.003);
  for(const y of [.402,.743]) {
    s.roundedBox("#4b3c37",-.322,y,.193,.045,.117,.058,.012);
    for(let j=0;j<3;j++)s.rod(j%2?"#9a7352":"#74615a",[-.333,y-.044+j*.031,.222],[-.333,y-.02+j*.031,.222],.018);
  }

  // Raised curved canopy seam and shallow crown wear follow the dome silhouette.
  line(s,"#302e34",[[-.354,1.064,.229],[-.26,1.151,.24],[0,1.219,.248],[.26,1.151,.24],[.354,1.064,.229]],.012,36);
  line(s,"#9e8b78",[[-.342,1.076,.235],[-.252,1.166,.245],[0,1.228,.25],[.252,1.166,.245],[.342,1.076,.235]],.006,36);
  // Irregular, low-profile oxidation flakes remain small and non-pixelated.
  for(let i=0;i<47;i++) {
    const x=Math.sin(i*2.399)*(.315-(i%3)*.018), y=.245+(i%13)*.078;
    if(y>.853 && y<1.042)continue;
    if(y>.615 && y<.749 && Math.abs(Math.abs(x)-.143)<.073)continue;
    const z=y<.835?.17:.223, radius=.009+(i%4)*.005;
    const flake=new THREE.Shape();
    for(let j=0;j<7;j++) {
      const a=j/7*Math.PI*2,r=radius*(.78+.22*Math.sin(j*4.1+i));
      if(!j)flake.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);else flake.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);
    }
    flake.closePath();plate(s,i%3?rust:rustLight,flake,z,.003,.001,1);
  }
  for(const side of [-1,1]) {
    for(let i=0;i<8;i++) {
      const y=.28+i*.108,z=-.105+(i%3)*.101;
      oval(s,i%2?rust:rustLight,[side*.392,y,z],[.003,.025,.014],8,6);
    }
    s.roundedBox("#4b3935",side*.235,.109,.005,.163,.106,.225,.023);
    s.roundedBox("#8a6c55",side*.235,.117,.102,.119,.067,.035,.012);
    s.rod("#604735",[side*.235,.084,.122],[side*.235,.14,.122],.005);
  }
  // The source's little right-hand crank has a short shaft and bent grip.
  s.rod("#4f3730",[.378,.827,-.014],[.566,.827,-.014],.047);
  s.rod("#9b6e45",[.394,.827,-.014],[.434,.827,-.014],.061);
  s.roundedBox("#6a4b36",.567,.791,-.014,.057,.145,.081,.016);
  s.rod("#372d2c",[.554,.74,-.014],[.63,.74,-.014],.031);
  oval(s,"#8c6543",[.634,.74,-.014],[.025,.034,.034]);
  // Back plate and drain/bolt fittings prevent an unfinished rear view.
  rim(s,"#353137",0,.66,-.248,.548,.835,.04,.012);
  for(const x of [-.234,.234])for(const y of [.305,1.014])screw(s,x,y,-.251,true);
  for(let i=0;i<6;i++)s.box("#29282e",-.16+i*.064,.36,-.259,.031,.012,.005);
  s.box("#8b7d69",0,.925,-.26,.207,.075,.011);
  for(let i=0;i<4;i++)s.box("#544a44",0,.901+i*.014,-.267,.157-(i%2)*.034,.004,.003);
  const geometry=s.finish();
  geometry.userData.sculptFeatures=["arched cast shell with actual letter slot", "recessed eye-punched service door", "curved rain lip and deep tray", "rust flakes around full body", "hinges, lock, side crank and rear fittings"];
  return geometry;
}

/** #126 — sloping switch enclosure with six true RJ45 cavities and two green eyes. */
function switchbox() {
  const s=new Sculpt({detail:"high"});
  const black="#29272e", dark="#14151c", bevel="#4c4a53", green="#8ff72b", lime="#d9ff72";
  // Five individual panels enclose a full-depth hollow chassis. The sloped roof
  // holds the source's two LED eyes; the six front sockets remain open.
  s.roundedBox(black,0,.217,0,1.334,.066,.687,.025);
  s.roundedBox("#302e36",0,.617,-.305,1.276,.79,.066,.023);
  for(const side of [-1,1]) {
    const shape=new THREE.Shape();
    shape.moveTo(-.323,.24);shape.lineTo(.303,.24);shape.lineTo(.303,.984);
    shape.lineTo(.253,1.012);shape.lineTo(-.323,.581);shape.closePath();
    const sideWall=new THREE.ExtrudeGeometry(shape,{depth:.038,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.012,bevelThickness:.009});
    sideWall.rotateY(Math.PI/2).translate(side<0?-.643:.605,0,0);s.surface(side<0?"#3b3943":"#24232b",sideWall);
  }
  const slope=.642, centerY=.809;
  s.roundedBox("#34323b",0,centerY,-.011,1.276,.058,.825,.026,slope);
  s.roundedBox("#4b4851",0,.556,.331,1.328,.04,.04,.01);
  s.box("#11121a",0,.533,.338,1.26,.009,.012);
  // Slot holes run through the whole face sheet, with dark cavities far behind.
  const panel=roundedRect(1.311,.307,.035,0,.385);
  for(let i=0;i<6;i++)panel.holes.push(roundedRect(.157,.158,.012,-.509+i*.204,.392));
  plate(s,"#55525c",panel,.321,.026,.009,6);
  for(let i=0;i<6;i++) {
    const x=-.509+i*.204;
    plate(s,"#080d14",roundedRect(.154,.156,.008,x,.392),.139,.013,.002);
    rim(s,"#918c92",x,.392,.354,.174,.175,.015,.009);
    rim(s,"#24262d",x,.392,.372,.151,.151,.008,.007);
    // Deep side walls and stepped latch recess keep recognizable socket anatomy.
    s.box("#3b3b43",x-.07,.393,.253,.012,.133,.19);
    s.box("#2c2e36",x+.07,.393,.253,.012,.133,.19);
    s.box("#44444a",x,.32,.259,.13,.013,.178);
    s.box("#232831",x,.461,.252,.13,.012,.18);
    s.box("#10141c",x,.34,.182,.053,.029,.045);
    s.box("#4e5159",x,.323,.194,.052,.008,.07);
    for(let j=0;j<8;j++) {
      const px=x-.049+j*.014;
      s.rod(j%2?"#b1a477":"#847961",[px,.438,.172],[px,.409,.285],.0028);
    }
    // Small molded port indices below the metal lip, represented as thin relief.
    for(let j=0;j<=i%3;j++)s.box("#88848d",x-.013+j*.013,.274,.359,.006,.014,.004);
  }
  // Lenses lie flush on the inclined lid; the emission mask is limited to glass.
  const normal=new THREE.Vector3(0,Math.cos(slope),Math.sin(slope));
  const roofPoint=(x:number,z:number,height:number):Point=>[x,centerY-Math.tan(slope)*(z+.011)+normal.y*height,z+normal.z*height];
  for(const x of [-.235,.235]) {
    const rotation=-Math.PI/2+slope;
    s.roundedBox("#15151c",...roofPoint(x,.03,.033),.151,.151,.029,.021,rotation);
    s.roundedBox("#555744",...roofPoint(x,.03,.05),.117,.117,.018,.013,rotation);
    s.roundedBox(green,...roofPoint(x,.03,.063),.09,.09,.017,.01,rotation);
    s.roundedBox(lime,...roofPoint(x-.015,.01,.074),.034,.033,.009,.006,rotation);
    // Small cast depressions under each eye remain unlit.
    s.roundedBox("#26242f",...roofPoint(x,.162,.032),.076,.011,.012,.004,rotation);
  }
  // Cooling seams, side fasteners and feet add depth without more render passes.
  for(const side of [-1,1]) {
    for(let i=0;i<9;i++) {
      const z=-.242+i*.052,y=.424+(i<5?.035:0);
      s.box("#11131c",side*.664,y,z,.006,.092,.013);
      s.box("#57525e",side*.668,y-.053,z,.006,.007,.018);
    }
    for(const z of [-.229,.225]) {
      oval(s,dark,[side*.49,.133,z],[.101,.071,.101]);
      oval(s,"#48434d",[side*.49,.109,z],[.074,.032,.074]);
    }
    s.rod("#34313d",[side*.651,.507,-.22],[side*.672,.507,-.22],.02);
  }
  s.roundedBox("#1c1b24",0,.546,-.347,.81,.304,.028,.022);
  for(let i=0;i<10;i++)s.box("#55505c",-.326+i*.072,.553,-.365,.014,.201,.005);
  s.roundedBox("#14151d",.453,.401,-.347,.13,.1,.039,.016);
  s.rod("#68616e",[.453,.4,-.369],[.453,.4,-.377],.028);
  s.rod("#0a0e16",[.453,.4,-.378],[.453,.4,-.382],.017);
  for(const x of [-.555,.555])for(const y of [.29,.847])screw(s,x,y,-.347,true);
  s.box("#5d5762",-.322,.291,-.348,.259,.034,.006);
  for(let i=0;i<8;i++)s.box("#17151d",-.42+i*.028,.291,-.353,.008,.019,.005);
  const geometry=s.finish(), colors=geometry.getAttribute("color");
  const emissiveColors=[green,lime].map(color=>new THREE.Color(color));
  const glowWeight=new Float32Array(colors.count);
  for(let i=0;i<colors.count;i++)if(emissiveColors.some(c=>Math.abs(colors.getX(i)-c.r)<.00001&&Math.abs(colors.getY(i)-c.g)<.00001&&Math.abs(colors.getZ(i)-c.b)<.00001))glowWeight[i]=.8;
  geometry.setAttribute("glowWeight",new THREE.BufferAttribute(glowWeight,1));
  geometry.userData.glowSurface=true;
  geometry.userData.sculptFeatures=["deep sloping steel chassis", "six recessed eight-contact RJ45 socket cavities", "two flush green LED eyes with isolated emission", "side ventilation slots, four rubber feet and rear service fittings"];
  return geometry;
}

export const SCULPTS_P_BOXES: Record<string,()=>THREE.BufferGeometry>={mon_letterbox:letterbox,mon_switchbox:switchbox};
