import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function cord(s:Sculpt,color:string,points:P[],radius:number,steps=24,sides=8) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,radius,sides,false));
}
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function slab(s:Sculpt,color:string,outline:[number,number][],z:number,depth:number,bevel=.008) {
  const shape=new THREE.Shape(outline.map(p=>new THREE.Vector2(...p)));
  s.surface(color,new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3}).translate(0,0,z));
}

/** #127: a folded open matchbook, four distinct match heads and sleepy paper eyes. */
function matchbook() {
  const s=new Sculpt({detail:"high"});
  const tan="#b9ad86", paper="#e3d5ac", shadow="#776649", red="#7f3026";
  // Actual separated front/back leaves, with thickness and a U-shaped lower fold.
  const front:[number,number][]=[[-.33,.22],[.32,.22],[.355,.89],[.16,.886],[-.04,.868],[-.34,.831]];
  slab(s,tan,front,.135,.041,.015);
  slab(s,"#d0c09a",[[-.306,.253],[-.315,.812],[.316,.861],[.291,.254]],.18,.006,.005);
  slab(s,shadow,[[-.347,.231],[-.345,1.022],[.285,1.046],[.313,.228]],-.114,.035,.014);
  slab(s,red,[[-.311,.277],[-.31,.987],[.25,1.013],[.272,.269]],-.072,.014,.008);
  s.roundedBox("#83734f",0,.21,.027,.663,.082,.285,.026);
  s.roundedBox("#c5b38d",0,.188,.035,.637,.037,.265,.014);
  for(const side of [-1,1]) {
    const x=side*.302;
    cord(s,paper,[[x,.245,.197],[x,.207,.161],[x,.184,.023],[x,.209,-.092],[x,.976,-.097]],.009,32,6);
    oval(s,"#655571",[side*.234,.126,.031],[.086,.041,.083],16,10);
    oval(s,"#85778e",[side*.237,.132,.074],[.055,.019,.041],12,8);
  }
  // The upper cover hinges back and slightly sideways, exposing a red lining.
  // It is made in its own frame so both paper layers and folded edges agree.
  const transform=new THREE.Matrix4().compose(new THREE.Vector3(-.018,1.015,-.098),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-.61,-.08,-.12)),new THREE.Vector3(1,1,1));
  const local=(p:P)=>new THREE.Vector3(...p).applyMatrix4(transform).toArray() as P;
  const lidShape=new THREE.Shape();
  lidShape.moveTo(-.324,0);lidShape.lineTo(.324,0);lidShape.lineTo(.332,.49);lidShape.lineTo(.214,.483);
  lidShape.lineTo(.197,.456);lidShape.lineTo(.058,.462);lidShape.lineTo(.032,.437);lidShape.lineTo(-.132,.45);
  lidShape.lineTo(-.151,.421);lidShape.lineTo(-.322,.413);lidShape.closePath();
  s.surface("#bfac86",new THREE.ExtrudeGeometry(lidShape,{depth:.034,bevelEnabled:true,bevelSize:.01,bevelThickness:.009,bevelSegments:3}).translate(0,0,-.018).applyMatrix4(transform));
  const lining=new THREE.Shape([[-.296,.033],[.296,.033],[.3,.45],[-.292,.383]].map(p=>new THREE.Vector2(...p)));
  s.surface("#6e2b25",new THREE.ExtrudeGeometry(lining,{depth:.008,bevelEnabled:true,bevelSize:.005,bevelThickness:.004,bevelSegments:2}).translate(0,0,.022).applyMatrix4(transform));
  cord(s,paper,[[-.32,.01,.026],[-.32,.39,.026],[-.149,.416,.026],[-.127,.441,.026],[.031,.429,.026],[.061,.454,.026],[.198,.448,.026],[.217,.475,.026],[.328,.483,.026]].map(p=>local(p as P)),.009,36,6);
  cord(s,"#9f8861",[local([-.298,.038,-.032]),local([-.294,.368,-.032]),local([.29,.436,-.032])],.005,22,6);
  s.rod("#d1b893",[-.321,1.017,-.1],[.304,1.017,-.1],.013);
  // Four individually splayed matchsticks rise from the recessed stapled comb.
  const matches:{base:P;tip:P;r:number}[]=[
    {base:[-.205,.48,.012],tip:[-.25,1.105,.027],r:.044},
    {base:[-.083,.485,-.001],tip:[.035,1.223,.021],r:.041},
    {base:[.048,.49,-.015],tip:[.258,1.376,-.006],r:.039},
    {base:[.166,.492,-.027],tip:[.441,1.223,.014],r:.037},
  ];
  s.roundedBox("#b5a279",0,.481,-.014,.49,.068,.047,.012);
  for(let i=0;i<matches.length;i++) {
    const {base,tip,r}=matches[i],axis=new THREE.Vector3(...tip).sub(new THREE.Vector3(...base)).normalize();
    const end=new THREE.Vector3(...tip).addScaledVector(axis,-r*.5).toArray() as P;
    s.rod("#cfbc87",base,end,.017);
    s.rod("#f0dca2",[base[0]-.006,base[1],base[2]+.012],[end[0]-.006,end[1],end[2]+.012],.004);
    s.rod("#8d794f",[base[0]+.01,base[1]+.04,base[2]],[end[0]+.011,end[1]-.025,end[2]],.003);
    const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
    s.surface("#a62d23",new THREE.SphereGeometry(1,24,16).scale(r,r*1.55,r*.85).applyQuaternion(rotation).translate(...tip));
    oval(s,"#d64a31",[tip[0]-.008,tip[1]+.014,tip[2]+r*.68],[r*.52,r*.85,r*.22],16,10);
    for(let k=0;k<4;k++) {
      const a=k*1.9+i,x=tip[0]+Math.sin(a)*r*.57,y=tip[1]+Math.cos(a)*r*.9;
      oval(s,k%2?"#ec6840":"#72241e",[x,y,tip[2]+r*.76],[.004,.006,.0025],8,6);
    }
  }
  // Front eyes and wear are thin raised paper details, not a solid rectangular face.
  for(const side of [-1,1]) {
    const x=side*.132,y=.521+side*.017;
    s.roundedBox("#8b815e",x,y,.194,.088,.16,.013,.032);
    s.roundedBox("#1e2530",x,y,.204,.052,.123,.017,.019);
    oval(s,"#e2e0d5",[x-.009,y+.037,.215],[.014,.023,.004],12,8);
    cord(s,"#e8dcb6",[[side*.274,.286,.202],[side*.278,.515,.204],[side*.29,.776,.202]],.006,24,6);
    for(let i=0;i<5;i++)s.rod("#a89871",[side*(.2+i*.017),.298+i*.085,.201],[side*(.188+i*.018),.322+i*.085,.201],.0025);
  }
  // Small staple, striking strip and its coarse crosshatching on the rear leaf.
  cord(s,"#6e6b65",[[-.072,.24,-.131],[-.072,.271,-.14],[.072,.271,-.14],[.072,.24,-.131]],.006,16,6);
  s.roundedBox("#6a4232",0,.377,-.13,.5,.105,.015,.014);
  for(let i=0;i<15;i++)s.rod(i%2?"#a87852":"#3f302a",[-.228+i*.032,.337,-.14],[-.205+i*.032,.414,-.14],.0025);
  for(let i=0;i<5;i++)s.box("#9b8565",0,.618+i*.046,-.139,.332-(i%3)*.057,.012,.004);
  return s.finish();
}

/** #128: a worn red handwheel with open spoke spaces above a full cast valve. */
function shutoff() {
  const s=new Sculpt({detail:"high"}), red="#a33529", dark="#4c4a4b", edge="#c35639";
  const turn=(color:string,points:[number,number][],p:P=[0,0,0],segments=48)=>s.surface(color,
    new THREE.LatheGeometry(points.map(v=>new THREE.Vector2(...v)),segments).translate(...p));
  turn(dark,[[0,.09],[.26,.09],[.314,.128],[.328,.2],[.312,.3],[.29,.74],[.256,.81],[.182,.84],[0,.84]]);
  turn("#6e6863",[[0,.115],[.293,.115],[.318,.139],[.322,.174],[.3,.195],[0,.195]]);
  turn("#7c392c",[[.286,.176],[.322,.176],[.334,.193],[.333,.22],[.314,.233],[.287,.233],[.286,.176]]);
  turn("#7c756d",[[0,.768],[.27,.768],[.298,.789],[.3,.834],[.279,.86],[.226,.874],[0,.874]]);
  turn(red,[[.254,.845],[.285,.845],[.308,.859],[.3,.886],[.276,.901],[.251,.884],[.254,.845]]);
  turn("#403c3a",[[0,.83],[.103,.83],[.122,.854],[.12,.988],[.092,1.012],[0,1.012]], [0,0,-.033],40);
  for(const y of [.895,.925,.955])s.torus("#a17e61",0,y,-.033,.118,.009,Math.PI/2);
  // Vertical cast ribs, rough red corrosion and bolts continue around the rear.
  for(let i=0;i<10;i++) {
    const a=i*Math.PI/5,front=(r:number,y:number):P=>[Math.sin(a)*r,y,Math.cos(a)*r];
    cord(s,i%2?"#81766b":"#665d54",[front(.318,.25),front(.314,.35),front(.298,.655),front(.289,.74)],.018,16,8);
    cord(s,i%3?"#9c3c2c":"#6b352a",[front(.321,.25),front(.32,.36),front(.298,.57),front(.291,.735)],.01,18,6);
    oval(s,"#9f4c33",front(.325,.164),[.031,.026,.031],12,8);
    turn("#423632",[[0,0],[.021,0],[.026,.012],[.022,.031],[0,.035]],front(.288,.076),16);
  }
  const wheel=new THREE.Matrix4().compose(new THREE.Vector3(0,1.012,.044),new THREE.Quaternion().setFromEuler(new THREE.Euler(-.49,0,0)),new THREE.Vector3(1,1,1));
  const at=(p:P)=>new THREE.Vector3(...p).applyMatrix4(wheel).toArray() as P;
  const part=(color:string,g:THREE.BufferGeometry)=>s.surface(color,g.applyMatrix4(wheel));
  // A closed, stepped annular cross-section has no disk across the openings.
  const profile:[number,number][]=[[.424,-.035],[.47,-.048],[.506,-.022],[.521,.014],[.512,.046],
    [.486,.069],[.451,.075],[.425,.055],[.413,.024],[.414,-.009],[.424,-.035]];
  part(red,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),64).rotateX(Math.PI/2));
  part("#cc5e41",new THREE.TorusGeometry(.485,.011,10,64).translate(0,0,.06));
  part("#6b2520",new THREE.TorusGeometry(.428,.009,8,64).translate(0,0,.035));
  for(let i=0;i<6;i++) {
    const a=i*Math.PI/3;
    const points:P[]=[[Math.sin(a)*.106,Math.cos(a)*.106,-.012],[Math.sin(a+.055)*.258,Math.cos(a+.055)*.258,.008],[Math.sin(a)*.447,Math.cos(a)*.447,.018]];
    cord(s,red,points.map(at),.031,22,10);
    cord(s,edge,points.map(([x,y,z])=>at([x-.004,y,z+.028])),.007,22,6);
  }
  // Shallow hammer pits/paint flakes follow the wheel rather than filling its holes.
  for(let i=0;i<18;i++) {
    const a=i*Math.PI/9,r=.472+(i%2)*.024;
    oval(s,i%3?"#75392c":"#b66e4a",at([Math.sin(a)*r,Math.cos(a)*r,.067]),[.012,.012,.008],10,6);
  }
  // A full oval hub plate and two raised socket eyes, all in the wheel frame.
  part("#302c2b",new THREE.SphereGeometry(1,24,16).scale(.195,.124,.052).translate(0,0,.061));
  part("#736e69",new THREE.SphereGeometry(1,24,16).scale(.18,.108,.035).translate(0,0,.094));
  part("#403c3a",new THREE.TorusGeometry(1,.05,8,48).scale(.175,.101,.16).translate(0,0,.102));
  for(const side of [-1,1]) {
    const x=side*.082;
    part("#353331",new THREE.SphereGeometry(1,20,12).scale(.066,.067,.035).translate(x,.028,.117));
    part("#aaa49b",new THREE.TorusGeometry(.046,.011,10,32).translate(x,.03,.143));
    part("#292929",new THREE.SphereGeometry(1,16,10).scale(.034,.037,.012).translate(x,.031,.151));
    part("#eee6cf",new THREE.SphereGeometry(1,12,8).scale(.016,.014,.004).translate(x-.009,.046,.161));
  }
  for(const side of [-1,1]) {
    const x=side*.251;
    cord(s,"#b24630",[[x,.77,.175],[x+side*.023,.66,.179],[x+side*.021,.522,.187],[x+side*.029,.408,.183]],.009,20,6);
    oval(s,"#843c2c",[x+side*.03,.385,.184],[.012,.026,.012],12,8);
  }
  return s.finish();
}

export const SCULPTS_Q_OBJECTS:Record<string,()=>THREE.BufferGeometry>={mon_matchbook:matchbook,mon_shutoff:shutoff};
