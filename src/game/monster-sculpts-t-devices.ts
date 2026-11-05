import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function line(s:Sculpt,color:string,points:P[],r=.004,steps=20,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function box(s:Sculpt,color:string,p:P,size:P,r=.006,segments=2) {
  s.surface(color,new RoundedBoxGeometry(...size,segments,r).translate(...p));
}
function rect(w:number,h:number,r:number) {
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function plate(s:Sculpt,color:string,points:[number,number][],z:number,depth=.012,bevel=.003) {
  s.surface(color,new THREE.ExtrudeGeometry(new THREE.Shape(points.map(p=>new THREE.Vector2(...p))),
    {depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2}).translate(0,0,z));
}
function glow(g:THREE.BufferGeometry,palette:Record<string,number>) {
  const colors=g.getAttribute("color"),weights=new Float32Array(colors.count);
  const emit=Object.entries(palette).map(([color,value])=>({color:new THREE.Color(color),value}));
  for(let i=0;i<colors.count;i++)for(const {color:c,value} of emit) {
    if(Math.abs(colors.getX(i)-c.r)<1e-5&&Math.abs(colors.getY(i)-c.g)<1e-5&&Math.abs(colors.getZ(i)-c.b)<1e-5)weights[i]=value;
  }
  g.setAttribute("glowWeight",new THREE.BufferAttribute(weights,1));g.userData.glowSurface=true;return g;
}

/** #147 — three real glass domes in a complete worn signal cabinet. */
function stoplight() {
  const s=new Sculpt({detail:"high"}),metal="#51463b",edge="#88715a",dark="#292a24";
  box(s,metal,[0,.883,0],[.591,1.13,.426],.035,4);
  box(s,"#6a5844",[0,.892,.217],[.573,1.108,.037],.018,3);
  // Separate cast door flange; the body has its own worked rear and side walls.
  for(const x of [-.282,.282])box(s,"#3c352e",[x,.893,.242],[.018,1.071,.022],.006);
  for(const y of [.351,1.428])box(s,"#9d7d58",[0,y,.238],[.55,.019,.025],.006);
  const roof=new THREE.Shape([[-.348,1.444],[-.348,1.483],[-.2,1.548],[-.103,1.575],[.17,1.571],[.351,1.478],[.351,1.443]].map(v=>new THREE.Vector2(...v)));
  s.surface("#66503b",new THREE.ExtrudeGeometry(roof,{depth:.523,bevelEnabled:true,bevelSize:.012,bevelThickness:.011,bevelSegments:3}).translate(0,0,-.255));
  for(const z of [-.266,.282])line(s,"#a18868",[[-.344,1.484,z],[-.2,1.551,z],[-.101,1.583,z],[.165,1.579,z],[.348,1.48,z]],.006,28);
  line(s,"#3d342b",[[-.074,1.58,-.242],[-.069,1.58,-.1],[-.063,1.581,.048],[-.058,1.58,.263]],.006,20);
  line(s,"#94745a",[[.168,1.578,-.233],[.164,1.578,-.079],[.174,1.578,.084],[.168,1.578,.267]],.004,18);
  // Rolled bezels and domed prismatic glass retain the source's three colors.
  const ys=[1.237,.893,.549],glass=["#e33725","#d5a31a","#31a04a"],bright=["#f85235","#efc23e","#61bc57"];
  for(let i=0;i<3;i++) {
    const y=ys[i];
    oval(s,"#29291f",[0,y,.242],[.209,.209,.038],24,12);
    s.surface("#a38b63",new THREE.TorusGeometry(.185,.014,8,32).translate(0,y,.276));
    s.surface("#3a3427",new THREE.TorusGeometry(.166,.012,6,32).translate(0,y,.291));
    oval(s,glass[i],[0,y,.284],[.159,.159,.044],28,16);
    // Concentric raised optic rings and curved light ribs follow the actual dome.
    for(const r of [.052,.104,.143]) {
      const z=.284+.044*Math.sqrt(1-(r/.159)**2);
      s.surface(bright[i],new THREE.TorusGeometry(r,.0025,4,24).translate(0,y,z+.001));
    }
    for(let k=0;k<8;k++) {
      const a=k*Math.PI/4,path:P[]=[];
      for(let j=0;j<=12;j++) {const r=.018+j*.0105;path.push([Math.cos(a)*r,y+Math.sin(a)*r,.286+.044*Math.sqrt(1-(r/.159)**2)]);}
      line(s,bright[i],path,.002,12,4);
    }
    // Thick upper visor is an annular half-cylinder, open at its lower edge.
    const hood=new THREE.Shape();hood.absarc(0,0,.207,0,Math.PI,false);hood.absarc(0,0,.188,Math.PI,0,true);hood.closePath();
    s.surface(metal,new THREE.ExtrudeGeometry(hood,{depth:.083,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,curveSegments:12}).translate(0,y,.252));
    line(s,"#a18b6c",[[.2,y+.005,.34],[.168,y+.11,.34],[0,y+.201,.34],[-.168,y+.11,.34],[-.2,y+.005,.34]],.003,30,5);
    // Fixing lugs below each reflector remain shaded, unlike the lenses.
    for(const x of [-.22,.22]) {
      oval(s,"#30291f",[x,y-.121,.249],[.014,.018,.007],10,6);
      s.box("#b29871",x,y-.121,.257,.013,.003,.004,0,0,.28);
    }
  }
  // The angry face belongs to the red lens; white eyes sit forward of the glass.
  for(const side of [-1,1]) {
    const mirror=(points:[number,number][])=>points.map(([x,y]):[number,number]=>[x*side,y]);
    plate(s,"#491b18",mirror([[.017,1.249],[.044,1.186],[.109,1.203],[.122,1.273],[.07,1.249]]),.327,.012,.004);
    plate(s,"#fff4d3",mirror([[.033,1.245],[.054,1.204],[.096,1.215],[.104,1.254],[.069,1.237]]),.341,.009,.003);
    oval(s,"#1a241d",[side*.066,1.222,.355],[.014,.019,.006],14,10);
    oval(s,"#fffdf1",[side*.062,1.231,.361],[.005,.007,.002],8,6);
    line(s,"#661f17",[[side*.027,1.269,.34],[side*.066,1.278,.338],[side*.121,1.303,.324]],.009,18,6);
  }
  line(s,"#58231c",[[-.06,1.164,.328],[0,1.188,.339],[.061,1.164,.328]],.008,18,6);
  // Side ventilation recesses, rolled hinge knuckles and screw heads.
  for(const side of [-1,1]) {
    for(const y of [.479,1.219]) {
      box(s,"#282720",[side*.299,y,-.014],[.012,.215,.211],.004);
      for(let j=0;j<5;j++) {
        s.box("#978267",side*.308,y-.081+j*.041,-.014,.009,.008,.18);
        s.box("#493d30",side*.309,y-.069+j*.041,-.014,.008,.005,.171);
      }
    }
    for(const y of [.416,.855,1.365]) {
      s.rod("#41382d",[side*.285,y-.025,.226],[side*.285,y+.025,.226],.019);
      s.rod("#b29b78",[side*.285,y-.025,.226],[side*.285,y-.018,.226],.02);
    }
    // Short heavy boots and original squat stance.
    s.surface("#574c3a",new THREE.LatheGeometry([[0,.127],[.071,.127],[.078,.16],[.061,.233],[.063,.292],[.084,.319],[0,.319]].map(v=>new THREE.Vector2(...v)),32).translate(side*.176,0,0));
    oval(s,"#4e4637",[side*.18,.118,.025],[.101,.055,.129],24,14);
    oval(s,"#84765c",[side*.18,.132,.09],[.084,.032,.067],18,10);
    for(let j=0;j<3;j++)line(s,"#342d26",[[side*.18-.043+j*.043,.121,.133],[side*.18-.041+j*.041,.136,.127]],.003,5,5);
  }
  box(s,"#3d392e",[0,.886,-.222],[.451,.89,.023],.022,3);
  box(s,"#71614a",[0,.888,-.237],[.416,.843,.011],.013);
  for(const x of [-.175,.175])for(const y of [.526,1.25]) {
    s.rod("#b29d79",[x,y,-.241],[x,y,-.251],.013);s.box("#332a21",x,y,-.254,.014,.003,.003);
  }
  box(s,"#3d372d",[0,.849,-.25],[.25,.177,.014],.009);
  for(let i=0;i<5;i++)s.box("#a08d6b",0,.903-i*.025,-.26,.194-(i%2)*.043,.005,.003);
  // Shallow irregular rust scars finish front flange, sides and back.
  for(let i=0;i<18;i++) {
    const side=i%2?1:-1,y=.4+(i%9)*.12,x=side*(.249+.008*Math.sin(i*2));
    oval(s,i%3?"#845035":"#ac7450",[x,y,.262],[.008+(i%3)*.003,.013+(i%4)*.003,.0025],10,6);
  }
  for(let i=0;i<9;i++)line(s,i%2?"#4c3c2e":"#a17a53",[[-.18+i*.044,.571,-.248],[-.173+i*.044,.614,-.248],[-.18+i*.044,.653,-.248]],.003,9,5);
  const geometry=glow(s.finish(),{[glass[0]]:.28,[glass[1]]:.2,[glass[2]]:.2,[bright[0]]:.32,[bright[1]]:.28,[bright[2]]:.28});
  geometry.userData.sculptFeatures=["three domed prismatic lenses with isolated emission","open cast hoods and rolled bezels","angry original red-lens face","peaked weathered cap, ventilation and service back","short cast legs and rounded boots"];
  return geometry;
}

/** #150 — an inclined green drive with a real hollow gold USB-A connector. */
function usbstick() {
  const s=new Sculpt({detail:"high"}),black="#202522",green="#35592d",light="#4e753c",gold="#bf9024",edge="#e3bf4c";
  box(s,black,[0,.818,0],[.615,.939,.393],.045,4);
  box(s,green,[0,.853,.065],[.565,.823,.313],.032,4);
  // Wraparound rubber rails frame the green shell without flattening its profile.
  for(const x of [-.28,.28]) {
    box(s,"#18231b",[x,.843,.017],[.064,.83,.371],.018,3);
    line(s,light,[[x*.88,.515,.218],[x*.92,.844,.223],[x*.83,1.199,.207]],.005,26,6);
    for(let j=0;j<6;j++)s.box("#3c4b36",x*1.073,.665+j*.066,0,.01,.016,.209);
  }
  box(s,"#1b251b",[0,.402,.022],[.621,.178,.393],.023,3);
  box(s,"#2a3c24",[0,.452,.218],[.557,.025,.015],.006);
  // Gold connector: a closed thin wall profile around an actual empty aperture.
  const shell=rect(.463,.278,.013);shell.holes.push(rect(.391,.207,.008));
  const shellGeometry=new THREE.ExtrudeGeometry(shell,{depth:.334,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:3,curveSegments:8})
    .rotateX(-Math.PI/2).translate(0,.068,0);
  s.surface(gold,shellGeometry);
  const rim=rect(.467,.282,.014);rim.holes.push(rect(.39,.204,.007));
  s.surface(edge,new THREE.ExtrudeGeometry(rim,{depth:.017,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:8})
    .rotateX(-Math.PI/2).translate(0,.064,0));
  // Recessed tongue, four separated contacts and back connector floor.
  box(s,"#3f351b",[0,.255,-.048],[.343,.293,.061],.008);
  for(let i=0;i<4;i++) {
    const x=-.123+i*.082;
    box(s,"#e9c74e",[x,.222,-.013],[.045,.212,.014],.005);
    box(s,"#ffdb60",[x,.13,-.005],[.041,.033,.007],.003);
    s.box("#6a531e",x,.329,-.008,.021,.019,.005);
  }
  // Two pressed retention openings on the top of the plug are dark recesses.
  for(const x of [-.118,.118]) {
    box(s,"#765e1d",[x,.263,.142],[.089,.101,.008],.008);
    box(s,"#372f1e",[x,.266,.148],[.067,.079,.004],.005);
    s.box("#f2cf66",x,.217,.153,.087,.006,.005);
  }
  for(const x of [-.226,.226])line(s,"#d7ad3c",[[x,.097,.103],[x,.212,.104],[x,.371,.101]],.004,22,6);
  // Two inset square LED eyes occupy the front lip above the protruding plug.
  const emitGreen="#7dff26",emitHot="#ddff94";
  for(const x of [-.151,.151]) {
    box(s,"#0e1e0e",[x,.531,.224],[.145,.154,.027],.024,3);
    box(s,"#41731a",[x,.531,.243],[.118,.122,.013],.02,3);
    box(s,emitGreen,[x,.532,.255],[.088,.1,.013],.016,3);
    box(s,emitHot,[x-.011,.545,.265],[.042,.062,.007],.011,2);
    s.box("#467d1b",x,.477,.258,.083,.004,.004);
  }
  // Rounded removable end cap with a genuinely open molded lanyard slot.
  box(s,"#1d2522",[0,1.289,-.006],[.616,.129,.405],.021,3);
  const cap=rect(.445,.126,.027);cap.holes.push(rect(.291,.054,.013));
  s.surface("#282b2a",new THREE.ExtrudeGeometry(cap,{depth:.106,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,curveSegments:8}).translate(0,1.395,-.056));
  line(s,"#484d47",[[-.266,1.289,.199],[-.158,1.299,.206],[.159,1.299,.206],[.268,1.289,.199]],.005,25,6);
  // Raised, subtly scratched green face and full rear with label/hardware seams.
  box(s,"#3e6433",[0,.917,.224],[.433,.485,.017],.034,4);
  for(let i=0;i<5;i++)line(s,i%2?"#527841":"#2b4d27",[[-.147+i*.069,.731,.236],[-.154+i*.069,.883,.237],[-.15+i*.069,1.1,.236]],.0025,22,5);
  for(let i=0;i<7;i++) {
    const x=-.184+i*.058;
    line(s,"#68844b",[[x,.99+(i%2)*.03,.236],[x+.024,1.008+(i%2)*.03,.236]],.002,5,5);
  }
  box(s,"#293d27",[0,.843,-.205],[.464,.639,.018],.024,3);
  box(s,"#627356",[0,.864,-.219],[.323,.269,.011],.012,2);
  for(let i=0;i<6;i++)s.box("#34412d",0,.961-i*.033,-.228,.262-(i%3)*.043,.006,.004);
  for(let i=0;i<10;i++)s.box(i%2?"#a0a68b":"#3d4936",-.131+i*.029,.697,-.226,.009,.048,.004);
  for(const x of [-.209,.209])for(const y of [.576,1.115]) {
    s.rod("#65725b",[x,y,-.211],[x,y,-.226],.013);s.box("#20291e",x,y,-.23,.016,.003,.003,0,0,.4);
  }
  // The source has a diagonal silhouette. Rotate the completed volume, then
  // restore the shared 1.6-unit bound and ground after the rigid orientation.
  const geometry=s.finish();geometry.rotateX(-.18).rotateZ(-.52);geometry.computeBoundingBox();
  const bounds=geometry.boundingBox!,size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=1.6/Math.max(size.x,size.y,size.z);
  geometry.translate(-center.x,-bounds.min.y,-center.z).scale(scale,scale,scale).translate(0,-.8,0);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  glow(geometry,{[emitGreen]:.85,[emitHot]:.95});
  geometry.userData.sculptFeatures=["full inclined rubber-edged green shell","actual hollow gold USB connector and four contacts","two isolated green LED eyes","open lanyard eyelet","rear label, fasteners and molded seams"];
  return geometry;
}

export const SCULPTS_T_DEVICES:Record<string,()=>THREE.BufferGeometry>={mon_stoplight:stoplight,mon_usbstick:usbstick};
