import * as THREE from "three";
import { Sculpt } from "./model-sculpt";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function turn(s:Sculpt,color:string,profile:[number,number][],p:P=[0,0,0],segments=48) {
  s.surface(color,new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),segments).translate(...p));
}
function plate(s:Sculpt,color:string,points:[number,number][],z:number,depth=.012) {
  s.surface(color,new THREE.ExtrudeGeometry(new THREE.Shape(points.map(v=>new THREE.Vector2(...v))),
    {depth,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2}).translate(0,0,z));
}

/** #159 — a full round iron post, open gooseneck and sleepy yellow lantern. */
function streetlamp() {
  const s=new Sculpt({detail:"high"}),iron="#515348",light="#777a62",dark="#30373a",poleX=-.105;
  turn(s,"#3b423b",[[0,.056],[.092,.056],[.115,.077],[.108,.117],[.078,.16],[.065,.214],[0,.224]],[poleX,0,0],48);
  for(const side of [-1,1]) {
    oval(s,side<0?"#484e41":"#5a604c",[poleX+side*.082,.075,.024],[.057,.055,.088],20,12);
    oval(s,"#7b7b5e",[poleX+side*.083,.09,.081],[.028,.028,.022],16,10);
  }
  turn(s,iron,[[0,.16],[.059,.16],[.062,.214],[.043,.261],[.035,.358],[.031,.875],
    [.038,1.048],[.047,1.083],[.041,1.113],[0,1.113]],[poleX,0,0],48);
  // Narrow axial casting ribs and spaced collars retain the source's slender shape.
  for(let i=0;i<7;i++) {
    const y=.263+i*.111;
    turn(s,i%2?"#686a54":"#3e473e",[[.025,y],[.043,y],[.048,y+.012],[.045,y+.031],[.028,y+.036],[.025,y]],[poleX,0,0],32);
  }
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    cord(s,i%2?"#76765c":"#38423c",[[poleX+Math.sin(a)*.044,.227,Math.cos(a)*.044],
      [poleX+Math.sin(a)*.035,.376,Math.cos(a)*.035],[poleX+Math.sin(a)*.031,.811,Math.cos(a)*.031],
      [poleX+Math.sin(a)*.037,1.047,Math.cos(a)*.037]],.0035,28,5);
  }
  // The bent casting is actual round tube around an empty, completely open gap.
  const hook:P[]=[[poleX,1.095,0],[-.177,1.203,0],[-.247,1.373,0],[-.241,1.568,0],
    [-.158,1.727,0],[-.013,1.786,0],[.162,1.783,0]];
  cord(s,iron,hook,.032,60,10);
  cord(s,"#81816a",hook.map(([x,y,z])=>[x-.011,y+.005,z+.026]),.005,60,5);
  oval(s,"#30363a",[.165,1.783,0],[.042,.041,.043],20,12);
  s.rod("#333b37",[.165,1.777,0],[.165,1.643,0],.019);
  for(const y of [1.678,1.711])s.surface("#777b60",new THREE.TorusGeometry(.02,.004,6,24).rotateX(Math.PI/2).translate(.165,y,0));
  // Heavy turned bonnet and lower retaining cup enclose the rounded glass body.
  const cx=.165;
  turn(s,dark,[[0,1.268],[.071,1.268],[.108,1.293],[.127,1.318],[.131,1.34],[.111,1.355],[0,1.355]],[cx,0,0],48);
  turn(s,"#79785c",[[.099,1.323],[.129,1.323],[.139,1.339],[.132,1.357],[.104,1.361],[.099,1.323]],[cx,0,0],40);
  turn(s,"#e4c73d",[[0,1.344],[.102,1.344],[.116,1.362],[.12,1.405],[.116,1.515],[.108,1.557],[0,1.557]],[cx,0,0],64);
  turn(s,"#424a43",[[0,1.548],[.109,1.548],[.137,1.562],[.141,1.58],[.124,1.6],[.105,1.612],
    [.091,1.637],[.048,1.659],[0,1.662]],[cx,0,0],48);
  turn(s,"#7e806a",[[.101,1.578],[.139,1.578],[.145,1.587],[.134,1.6],[.107,1.599],[.101,1.578]],[cx,0,0],40);
  // Raised lens ribs and warm glass glints wrap around the back too.
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    cord(s,i%3?"#f5dc5c":"#c4a32b",[[cx+Math.sin(a)*.109,1.365,Math.cos(a)*.109],
      [cx+Math.sin(a)*.12,1.422,Math.cos(a)*.12],[cx+Math.sin(a)*.113,1.54,Math.cos(a)*.113]],.0035,20,5);
  }
  // Sleepy source eyes: bronze rings, half lids and dark pupils stay ahead of glass.
  for(const side of [-1,1]) {
    const x=cx+side*.047;
    oval(s,"#8a6f1c",[x,1.45,.114],[.039,.048,.015],24,16);
    oval(s,"#f9e66e",[x,1.449,.128],[.03,.039,.009],24,16);
    oval(s,"#51461c",[x,1.445,.137],[.014,.024,.004],16,12);
    oval(s,"#f1cf3e",[x,1.47,.135],[.031,.019,.008],20,12);
    cord(s,"#6d5a1d",[[x-.029,1.469,.139],[x,1.465,.145],[x+.029,1.47,.139]],.004,14,6);
    cord(s,"#fff09a",[[x-.027,1.489,.122],[x,1.499,.129],[x+.024,1.487,.122]],.003,14,5);
  }
  // Fine cast wear and restrained verdigris across pole, bonnet and underside.
  for(let i=0;i<24;i++) {
    const a=i*2.399963,y=.294+(i%9)*.081,r=.035;
    s.surface(i%3?"#85836b":"#486756",new THREE.SphereGeometry(1,8,6).scale(.006,.014,.002)
      .rotateY(a).translate(poleX+Math.sin(a)*r,y,Math.cos(a)*r));
  }
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    oval(s,i%2?"#807b5d":"#6a7058",[cx+Math.sin(a)*.112,1.603,Math.cos(a)*.112],[.009,.005,.006],8,6);
  }
  // A rear service plate and two bolts make the narrow post finished from all angles.
  s.surface("#414a42",new RoundedBoxGeometry(.049,.111,.012,2,.007).translate(poleX,.467,-.034));
  for(const y of [.429,.504]) {
    oval(s,"#a0a187",[poleX,y,-.043],[.006,.006,.003],8,6);
    s.box("#394136",poleX,y,-.047,.008,.002,.001);
  }
  const geometry=s.finish(),colors=geometry.getAttribute("color"),weights=new Float32Array(colors.count);
  const emit=["#e4c73d","#f5dc5c","#f9e66e","#f1cf3e","#fff09a"].map(c=>new THREE.Color(c));
  for(let i=0;i<colors.count;i++)if(emit.some(c=>Math.abs(c.r-colors.getX(i))<1e-5&&Math.abs(c.g-colors.getY(i))<1e-5&&Math.abs(c.b-colors.getZ(i))<1e-5))weights[i]=.5;
  geometry.setAttribute("glowWeight",new THREE.BufferAttribute(weights,1));geometry.userData.glowSurface=true;
  return geometry;
}

/** #160 — curved pink aerosol can, real nozzle cavity and flaking paint all around. */
function spraycan() {
  const s=new Sculpt({detail:"high"}),pink="#ca5a93",dark="#483147",light="#e28bb3";
  turn(s,"#71465e",[[0,.153],[.23,.153],[.274,.174],[.293,.216],[.294,1.101],[.276,1.137],[.23,1.153],[0,1.153]],[0,0,0],80);
  turn(s,pink,[[0,.204],[.275,.204],[.292,.229],[.294,.468],[.292,.805],[.293,1.066],[.278,1.111],[0,1.111]],[0,0,0],80);
  turn(s,dark,[[.243,.166],[.282,.166],[.301,.18],[.302,.205],[.285,.22],[.26,.211],[.243,.166]],[0,0,0],48);
  turn(s,"#db7ea5",[[.259,1.084],[.292,1.084],[.302,1.104],[.296,1.128],[.269,1.132],[.259,1.084]],[0,0,0],48);
  turn(s,"#696b6e",[[0,1.106],[.256,1.106],[.27,1.123],[.239,1.153],[.2,1.185],[.183,1.221],[.14,1.246],[0,1.246]],[0,0,0],64);
  turn(s,"#a4a5a6",[[.132,1.219],[.181,1.219],[.193,1.234],[.177,1.254],[.137,1.262],[.132,1.219]],[0,0,0],48);
  // A thick pink actuator surrounds a genuine front-to-back aperture with a dark recess.
  const button=new THREE.Shape();button.moveTo(-.073,1.252);button.lineTo(.073,1.252);
  button.lineTo(.073,1.382);button.quadraticCurveTo(.073,1.401,.05,1.402);button.lineTo(-.05,1.402);
  button.quadraticCurveTo(-.073,1.401,-.073,1.382);button.closePath();
  const hole=new THREE.Path();hole.absellipse(0,1.333,.024,.032,0,Math.PI*2,true,0);button.holes.push(hole);
  s.surface("#ca72a0",new THREE.ExtrudeGeometry(button,{depth:.117,curveSegments:24,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:3}).translate(0,0,-.048));
  oval(s,"#2b1b2e",[0,1.333,-.031],[.023,.031,.004],24,16);
  s.surface("#6d3658",new THREE.TorusGeometry(1,.12,6,32).scale(.025,.033,.019).translate(0,1.333,.076));
  s.box("#f0b1d1",-.006,1.396,.021,.085,.008,.067);
  // Source eyes are separate bevelled enamel forms, laid ahead of the curved shell.
  for(const side of [-1,1]) {
    const mirror=(points:[number,number][])=>points.map(([x,y]):[number,number]=>[x*side,y]);
    plate(s,"#342330",mirror([[.031,.842],[.09,.745],[.179,.731],[.241,.797],[.215,.859],[.136,.814]]),.274,.018);
    plate(s,"#ecd6dc",mirror([[.055,.824],[.102,.767],[.174,.752],[.214,.793],[.197,.821],[.134,.788]]),.295,.011);
    oval(s,"#221c29",[side*.137,.78,.319],[.027,.031,.011],20,12);
    oval(s,"#fff4ec",[side*.127,.793,.33],[.009,.012,.003],12,8);
    cord(s,"#502a41",[[side*.023,.864,.286],[side*.124,.831,.321],[side*.237,.887,.27]],.014,24,8);
    cord(s,"#e38db4",[[side*.04,.888,.277],[side*.123,.854,.311],[side*.235,.91,.26]],.006,24,6);
  }
  // Tangent islands follow the cylinder, with extra chips behind and along the shoulder.
  const colors=["#663449","#974161","#e08ab2","#ae507d","#f1a0c3"];
  for(let i=0;i<72;i++) {
    const a=i*2.399963,y=.242+(i%15)*.055,x=Math.sin(a)*.295,z=Math.cos(a)*.295;
    if(z>.13&&y>.69&&y<.94)continue;
    const geometry=new THREE.SphereGeometry(1,8,6).scale(.01+(i%4)*.005,.017+(i%3)*.01,.003)
      .rotateY(a).rotateZ(.14*Math.sin(i)).translate(x,y,z);
    s.surface(colors[i%colors.length],geometry);
  }
  // Long dried runs start at the shoulder and curve over the rounded wall.
  for(const [a,end] of [[.72,.82],[-.84,.91],[2.5,.69],[-2.14,.59],[3.05,.86]]) {
    const points:P[]=[];
    for(let i=0;i<=15;i++) {
      const t=i/15,angle=a+.022*Math.sin(t*8),r=.296;
      points.push([Math.sin(angle)*r,1.105-(1.105-end)*t,Math.cos(angle)*r]);
    }
    cord(s,"#4d3247",points,.009,24,6);
    const p=points[points.length-1];oval(s,"#55344a",p,[.012,.021,.01],12,8);
  }
  // Rolled rear seam, worn label fragments and can crimp tooling remain volumetric.
  cord(s,"#8d476c",[[.034,.235,-.294],[.032,.607,-.295],[.034,1.073,-.292]],.004,40,6);
  for(let i=0;i<9;i++)s.box("#bc7095",-.143+i*.035,.579,-.297,.012,.14+(i%3)*.019,.004);
  for(let i=0;i<24;i++) {
    const a=i*Math.PI/12;
    s.rod("#8d5670",[Math.sin(a)*.294,.183,Math.cos(a)*.294],[Math.sin(a)*.294,.208,Math.cos(a)*.294],.003);
  }
  for(const side of [-1,1]) {
    oval(s,"#4d354d",[side*.191,.13,.021],[.103,.055,.114],24,14);
    oval(s,"#7d4e70",[side*.2,.146,.098],[.08,.028,.049],18,10);
    cord(s,"#34283d",[[side*.19-.055,.124,.107],[side*.19,.113,.133],[side*.19+.055,.124,.107]],.005,12,6);
  }
  // Small soft sculpted puff from the source, with distinct rounded depth and wisps.
  oval(s,"#d8d0d8",[-.647,.621,.026],[.107,.121,.073],24,16);
  oval(s,"#e4dee4",[-.655,.727,.013],[.066,.098,.06],20,14);
  oval(s,"#eae4e7",[-.706,.631,.053],[.079,.068,.048],20,12);
  oval(s,"#c9c0cf",[-.601,.596,.003],[.078,.058,.05],18,12);
  oval(s,"#ded5df",[-.653,.533,.028],[.06,.064,.051],18,12);
  cord(s,"#d9d0dc",[[-.576,.612,.022],[-.527,.603,.018],[-.47,.593,.009]],.018,20,8);
  return s.finish();
}

export const SCULPTS_V_STREET:Record<string,()=>THREE.BufferGeometry>={mon_streetlamp:streetlamp,mon_spraycan:spraycan};
