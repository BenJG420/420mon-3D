import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function box(s:Sculpt,color:string,p:P,size:P,r=.01,segments=2) {
  s.surface(color,new RoundedBoxGeometry(...size,segments,r).translate(...p));
}
function line(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function rect(w:number,h:number,r:number,cx=0,cy=0) {
  const shape=new THREE.Shape(),x=cx-w/2,y=cy-h/2;
  shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);
  shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);
  shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);return shape;
}
function extrude(shape:THREE.Shape,z:number,depth:number,bevel=.006,curveSegments=12) {
  return new THREE.ExtrudeGeometry(shape,{depth,curveSegments,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3}).translate(0,0,z);
}

/** #165: thick laminated test cassette, two inset reagent fields and source eyes. */
function teststrip() {
  const s=new Sculpt({detail:"high"});
  const outer=rect(.614,1.34,.083,0,.866);
  s.surface("#b1a0bc",extrude(outer,-.119,.147,.012,16));
  const front=rect(.579,1.306,.07,0,.878);
  for(const y of [.439,.805])front.holes.push(rect(.364,.291,.024,0,y));
  s.surface("#eeeaf0",extrude(front,.027,.086,.011,16));
  // A continuous moulded side seam gives the full cassette thickness and rear structure.
  for(const side of [-1,1]) {
    line(s,"#d9d1e0",[[side*.288,.285,.038],[side*.307,.546,.037],[side*.306,1.264,.038],[side*.268,1.474,.038]],.009,38,6);
    line(s,"#fcf9fb",[[side*.259,.342,.128],[side*.269,.732,.128],[side*.266,1.368,.129]],.007,32,6);
  }
  // Raised purple bevels surround real recessed dark reagent surfaces.
  for(const [index,y] of [.439,.805].entries()) {
    const ring=rect(.392,.319,.029,0,y);ring.holes.push(rect(.359,.286,.023,0,y));
    s.surface(index?"#78539b":"#a13d9d",extrude(ring,.12,.012,.003,12));
    box(s,"#48324e",[0,y,.049],[.37,.296,.035],.024,3);
    box(s,index?"#392d4b":"#3b2343",[0,y,.071],[.331,.26,.011],.018,3);
    line(s,index?"#655476":"#744568",[[-.138,y-.104,.08],[.001,y-.108,.08],[.138,y-.104,.08]],.004,20,5);
    // Fine substrate texture remains low relief inside each field.
    for(let j=0;j<7;j++)box(s,index?"#40334e":"#432748",[-.129+j*.043,y+.055*(j%2?1:-1),.079],[.015,.048,.002],.002,1);
  }
  // Two tiny source eyes sit in the white upper section, including their socket rims.
  for(const x of [.105,.239]) {
    oval(s,"#9b8aab",[x,1.17,.127],[.03,.043,.013],20,12);
    oval(s,"#41314d",[x,1.17,.139],[.017,.028,.007],20,12);
    oval(s,"#fff7ff",[x-.005,1.181,.146],[.007,.01,.003],12,8);
  }
  // The folded top sampling tab has a thick curved cap and a recessed hinge.
  box(s,"#756283",[-.111,1.455,.135],[.258,.111,.039],.022,3);
  s.surface("#e6dcef",new RoundedBoxGeometry(.211,.103,.091,4,.033).rotateX(-.24).translate(-.115,1.487,.166));
  box(s,"#fff7ff",[-.132,1.522,.178],[.151,.028,.047],.012,3);
  line(s,"#bba8ce",[[-.205,1.457,.188],[-.117,1.446,.211],[-.027,1.458,.188]],.006,22,6);
  // Rear alignment ribs, batch panel and shallow scratches finish every side.
  box(s,"#cabed1",[0,.862,-.134],[.467,1.073,.025],.043,3);
  for(const x of [-.192,.192])box(s,"#ece4ef",[x,.857,-.153],[.016,.845,.011],.006,2);
  box(s,"#a89bb4",[0,.979,-.155],[.31,.25,.009],.013,2);
  for(let i=0;i<6;i++)s.box("#e4dce9",0,1.061-i*.031,-.162,.244-(i%3)*.04,.006,.003);
  for(let i=0;i<12;i++)s.box(i%3?"#887c98":"#dfd5e5",-.133+i*.024,.568,-.154,.008,.139-(i%3)*.014,.004);
  for(const y of [.367,1.346])oval(s,"#9b8cab",[0,y,-.157],[.023,.014,.004],14,8);
  // Original purple droplet floats below the cassette as a separate smooth volume.
  s.surface("#8e3fc1",new THREE.LatheGeometry([[0,-.073],[.025,-.062],[.037,-.026],[.029,.013],[.011,.061],[0,.087]].map(v=>new THREE.Vector2(...v)),40).translate(.025,.045,.012));
  oval(s,"#dfb9f4",[.012,.041,.042],[.015,.032,.009],18,12);
  oval(s,"#fff3ff",[.008,.052,.049],[.007,.016,.003],12,8);
  return s.finish();
}

const SCRAP_OUTLINE:[number,number][]=[[-.54,.17],[-.59,.25],[-.525,.32],[-.64,.38],[-.578,.47],[-.635,.57],[-.558,.66],[-.62,.75],[-.548,.84],[-.622,.93],[-.548,1.015],[-.605,1.11],[-.515,1.147],[-.548,1.247],[-.443,1.212],[-.404,1.319],[-.319,1.269],[-.26,1.416],[-.173,1.335],[-.114,1.258],[-.039,1.354],[.03,1.277],[.113,1.338],[.174,1.251],[.255,1.34],[.3,1.251],[.385,1.295],[.423,1.198],[.518,1.253],[.505,1.15],[.612,1.177],[.567,1.073],[.631,1.019],[.555,.94],[.62,.875],[.549,.792],[.632,.716],[.562,.64],[.616,.565],[.536,.505],[.596,.409],[.513,.37],[.555,.274],[.455,.281],[.411,.185],[.331,.243],[.258,.155],[.172,.231],[.09,.16],[.022,.226],[-.06,.163],[-.119,.24],[-.211,.163],[-.283,.238],[-.365,.175],[-.423,.252]];
const LEFT_EYE:[number,number][]=[[-.376,.862],[-.322,.84],[-.212,.785],[-.176,.715],[-.26,.669],[-.326,.698]];
function polygon(points:[number,number][]) {return new THREE.Shape(points.map(p=>new THREE.Vector2(...p)));}
function bend(x:number,y:number) {return .085*Math.sin(3*x)+.067*Math.cos(4*y)+.036*Math.sin(4*x*y);}
function derivatives(x:number,y:number) {
  return [.255*Math.cos(3*x)+.144*y*Math.cos(4*x*y),-.268*Math.sin(4*y)+.144*x*Math.cos(4*x*y)];
}
/** Subdivide cap triangles before curling; transform the authored normals analytically. */
function curled(source:THREE.BufferGeometry,levels=0) {
  const plain=source.index?source.toNonIndexed():source,p=plain.getAttribute("position"),n=plain.getAttribute("normal"),positions:number[]=[],normals:number[]=[];
  const emit=(v:THREE.Vector3,normal:THREE.Vector3)=>{
    positions.push(v.x,v.y,v.z+bend(v.x,v.y));const [dx,dy]=derivatives(v.x,v.y);
    const q=new THREE.Vector3(normal.x-dx*normal.z,normal.y-dy*normal.z,normal.z).normalize();normals.push(q.x,q.y,q.z);
  };
  const triangle=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,na:THREE.Vector3,nb:THREE.Vector3,nc:THREE.Vector3,level:number)=>{
    if(!level){emit(a,na);emit(b,nb);emit(c,nc);return;}
    const ab=a.clone().lerp(b,.5),bc=b.clone().lerp(c,.5),ca=c.clone().lerp(a,.5),nab=na.clone().add(nb).normalize(),nbc=nb.clone().add(nc).normalize(),nca=nc.clone().add(na).normalize();
    triangle(a,ab,ca,na,nab,nca,level-1);triangle(ab,b,bc,nab,nb,nbc,level-1);triangle(ca,bc,c,nca,nbc,nc,level-1);triangle(ab,bc,ca,nab,nbc,nca,level-1);
  };
  for(let i=0;i<p.count;i+=3) {
    const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);
    const na=new THREE.Vector3().fromBufferAttribute(n,i),nb=new THREE.Vector3().fromBufferAttribute(n,i+1),nc=new THREE.Vector3().fromBufferAttribute(n,i+2);
    triangle(a,b,c,na,nb,nc,Math.abs(na.z)>.999?levels:0);
  }
  if(plain!==source)plain.dispose();source.dispose();
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));return g;
}

/** #167: a curled thick torn parchment, real recessed eye cuts and raised fracture lines. */
function mapscrap() {
  const s=new Sculpt({detail:"high"});
  const paper=polygon(SCRAP_OUTLINE),left=polygon(LEFT_EYE),right=new THREE.Path();right.absellipse(.225,.771,.124,.13,0,Math.PI*2,true,0);paper.holes.push(left,right);
  s.surface("#c9bfa2",curled(extrude(paper,-.022,.045,.004,12),2));
  // The purple perimeter is a narrow actual ring, not another full sheet or billboard.
  const aura=polygon(SCRAP_OUTLINE.map(([x,y])=>[x*1.035,.78+(y-.78)*1.035]));aura.holes.push(polygon(SCRAP_OUTLINE));
  s.surface("#784795",curled(extrude(aura,-.029,.051,.004,12)));
  // Dark recessed interiors sit behind genuine openings through the thick paper.
  s.surface("#301d36",curled(extrude(polygon(LEFT_EYE),-.085,.012,.003,12),2));
  const rightBack=new THREE.Shape();rightBack.absellipse(.225,.771,.122,.128,0,Math.PI*2,false,0);
  s.surface("#29182f",curled(extrude(rightBack,-.085,.012,.003,16),1));
  const on=(points:[number,number][],z=.032):P[]=>points.map(([x,y])=>[x,y,bend(x,y)+z]);
  line(s,"#9978a5",on([...LEFT_EYE,LEFT_EYE[0]],.023),.009,42,6);
  const ring:[number,number][]=[];for(let i=0;i<=40;i++){const a=i*Math.PI/20;ring.push([.225+Math.cos(a)*.127,.771+Math.sin(a)*.133]);}
  line(s,"#876493",on(ring,.024),.009,40,6);
  // Branching old fold/fracture paths match the source, staying clear of both eyes.
  const cracks:[number,number][][]=[
    [[-.51,1.17],[-.383,1.028],[-.277,1.095],[-.184,1.199],[-.259,1.354]],
    [[-.383,1.028],[-.329,.927],[-.442,.901],[-.562,.97]],
    [[-.184,1.199],[-.102,1.083],[.014,1.054],[.119,1.174],[.095,1.29]],
    [[.014,1.054],[.106,.955],[.234,1.005],[.3,1.13],[.405,1.237]],
    [[.234,1.005],[.342,.948],[.444,1.029],[.559,1.14]],
    [[.342,.948],[.398,.84],[.536,.827],[.581,.92]],
    [[-.56,.799],[-.438,.779],[-.408,.637],[-.473,.551],[-.564,.573]],
    [[-.408,.637],[-.296,.56],[-.184,.598],[-.105,.74],[-.155,.887],[-.277,1.095]],
    [[-.105,.74],[.005,.698],[.07,.567],[.002,.454],[-.133,.42],[-.184,.598]],
    [[.07,.567],[.22,.566],[.339,.671],[.438,.638],[.55,.709]],
    [[.22,.566],[.276,.43],[.403,.41],[.519,.503]],
    [[.276,.43],[.199,.313],[.087,.246]],
    [[.403,.41],[.449,.305],[.417,.216]],
    [[-.133,.42],[-.262,.391],[-.365,.456],[-.473,.551]],
    [[-.262,.391],[-.306,.287],[-.224,.203]],
    [[-.365,.456],[-.441,.352],[-.533,.326]],
    [[-.133,.42],[-.071,.314],[-.101,.215]],
  ];
  for(let i=0;i<cracks.length;i++) {
    line(s,i%3?"#5d503d":"#736248",on(cracks[i]),.006,cracks[i].length*7,5);
    line(s,"#e0d5b4",on(cracks[i].map(([x,y])=>[x+.011,y+.007]),.03),.003,cracks[i].length*6,4);
    // Reverse creases establish the folded paper's identity when rotated.
    if(i%2===0)line(s,"#a08e70",on(cracks[i],-.028),.004,cracks[i].length*6,5);
  }
  // Small torn edge fibers and warm worn patches are tangent to the curved sheet.
  for(let i=0;i<SCRAP_OUTLINE.length;i+=2) {
    const [x,y]=SCRAP_OUTLINE[i],toward=new THREE.Vector2(-x,.78-y).normalize().multiplyScalar(.03);
    line(s,i%4?"#e3d7b4":"#b4a280",on([[x,y],[x+toward.x,y+toward.y]],.026),.003,5,5);
  }
  return s.finish();
}

export const SCULPTS_W_SURFACES:Record<string,()=>THREE.BufferGeometry>={mon_teststrip:teststrip,mon_mapscrap:mapscrap};
