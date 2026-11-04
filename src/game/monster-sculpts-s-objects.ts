import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function oval(s:Sculpt,color:string,p:P,size:P,w=16,h=10) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function slab(s:Sculpt,color:string,outline:[number,number][],z:number,depth=.015,bevel=.006) {
  const shape=new THREE.Shape(outline.map(p=>new THREE.Vector2(...p)));
  s.surface(color,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3}).translate(0,0,z));
}

/** A thin, closed paper leaf with actual curl, front/back and fine torn upper edge. */
function rollingLeaf() {
  const points:number[]=[],indices:number[]=[],rows=26,cols=18,layer=(rows+1)*(cols+1);
  for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++) {
    const v=j/rows,u=i/cols*2-1,width=.115+.028*Math.sin(v*Math.PI)+.018*v;
    const x=-.251+u*width-.267*v+.034*Math.sin(v*Math.PI*1.4);
    const y=.746+.481*v+.02*u*Math.sin(v*Math.PI)+Math.pow(v,10)*.013*Math.sin(u*8.7);
    const z=-.061+.108*Math.sin(v*Math.PI)-.045*v+.025*u*u+(side===0?.004:-.004);
    points.push(x,y,z);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++) {
    const a=j*(cols+1)+i,b=a+cols+1;
    indices.push(a,a+1,b,a+1,b+1,b,layer+a,layer+b,layer+a+1,layer+a+1,layer+b,layer+b+1);
  }
  const edge=(a:number,b:number)=>indices.push(a,layer+a,b,b,layer+a,layer+b);
  for(let i=0;i<cols;i++){edge(i+1,i);edge(rows*(cols+1)+i,rows*(cols+1)+i+1);}
  for(let j=0;j<rows;j++){edge(j*(cols+1),(j+1)*(cols+1));edge((j+1)*(cols+1)+cols,j*(cols+1)+cols);}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(points,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

/** #139: orange folded packet, stacked leaves and one curled white rolling paper. */
function rizla() {
  const s=new Sculpt({detail:"high"}),orange="#ef861f",shade="#b55c24",edge="#ffb746";
  s.surface(orange,new RoundedBoxGeometry(.9,.558,.57,5,.038).translate(0,.462,0));
  s.roundedBox(shade,0,.198,0,.88,.049,.551,.018);
  // Individual paper edges sit inside the orange wrap along both side openings.
  for(const side of [-1,1]) {
    s.roundedBox("#d2c8b5",side*.439,.477,-.005,.024,.431,.468,.011);
    for(let i=0;i<9;i++)s.box(i%2?"#f0e4c9":"#b9ac90",side*.453,.298+i*.043,-.005,.005,.008,.432);
    s.roundedBox(orange,side*.457,.428,-.009,.028,.306,.497,.013);
    cord(s,edge,[[side*.464,.305,.235],[side*.465,.473,.242],[side*.457,.62,.235]],.006,20,6);
    // Folded lower corner and narrow glued rear seam have real bevels.
    slab(s,side<0?"#d47726":"#f29b32",[[side*.367,.214],[side*.474,.255],[side*.463,.357],[side*.37,.31]],.225,.022,.007);
    oval(s,"#443154",[side*.287,.128,.006],[.11,.039,.1]);
    oval(s,"#69506f",[side*.289,.136,.065],[.07,.018,.047],12,8);
  }
  // The paper-white front folds down around the lower bevel, with unequal edges.
  slab(s,"#ddd9ce",[[-.396,.265],[-.414,.622],[-.311,.655],[-.149,.641],[.068,.662],[.383,.661],[.398,.281],[.21,.257],[-.07,.249]],.286,.026,.012);
  slab(s,"#f2eee5",[[-.374,.299],[-.387,.604],[-.295,.623],[-.09,.61],[.13,.639],[.36,.637],[.371,.306],[.139,.282],[-.099,.276]],.315,.009,.006);
  // Two top folded panels expose the diagonal crease and a small paper slit.
  s.surface("#f39224",new RoundedBoxGeometry(.413,.032,.505,3,.012).rotateZ(-.045).translate(-.215,.747,-.002));
  s.surface("#ffa636",new RoundedBoxGeometry(.432,.032,.501,3,.012).rotateZ(.042).translate(.211,.748,-.002));
  cord(s,"#cf6d1c",[[-.139,.773,-.224],[-.091,.773,-.104],[.024,.767,.018],[.087,.768,.151],[.179,.768,.222]],.007,28,6);
  cord(s,"#ffc56b",[[-.12,.776,-.22],[-.068,.777,-.106],[.039,.771,.009],[.102,.774,.146]],.004,26,6);
  s.roundedBox("#b98042",-.246,.776,-.061,.281,.012,.045,.006);
  s.surface("#f5f2ea",rollingLeaf());
  // Fine ribs follow the sheet's actual curl; only the narrow back fold is shaded.
  for(const u of [-.82,.74]) {
    const path:P[]=[];
    for(let i=0;i<=16;i++) {
      const v=i/16,width=.115+.028*Math.sin(v*Math.PI)+.018*v;
      path.push([-.251+u*width-.267*v+.034*Math.sin(v*Math.PI*1.4),.746+.481*v+.02*u*Math.sin(v*Math.PI),-.055+.108*Math.sin(v*Math.PI)-.045*v+.025*u*u]);
    }
    cord(s,u<0?"#d4d3cf":"#fffdf8",path,.0025,24,5);
  }
  // Original dark angular eyes are sharp cut-paper forms with a subtle relief.
  for(const side of [-1,1]) {
    const mirror=(p:[number,number][])=>p.map(([x,y]):[number,number]=>[x*side,y]);
    slab(s,"#b8b6c1",mirror([[.048,.487],[.112,.386],[.248,.43],[.294,.566],[.222,.539],[.135,.477]]),.329,.007,.003);
    slab(s,"#293048",mirror([[.077,.48],[.133,.411],[.23,.443],[.266,.542],[.211,.513],[.137,.461]]),.342,.009,.004);
    slab(s,"#4e5470",mirror([[.058,.501],[.176,.579],[.264,.591],[.239,.551],[.145,.518],[.091,.473]]),.35,.007,.003);
    oval(s,"#f8f5ec",[side*.168,.465,.361],[.013,.012,.003],10,6);
  }
  // Back paper texture strips and the retained orange folded flap remain visible.
  s.roundedBox("#cd6f23",0,.435,-.294,.754,.344,.024,.015);
  for(let i=0;i<7;i++)s.box(i%2?"#f2b35c":"#a45b27",0,.321+i*.037,-.31,.611-(i%3)*.086,.007,.004);
  cord(s,"#9c5724",[[-.398,.291,-.302],[-.41,.495,-.299],[-.36,.704,-.296],[.334,.714,-.295]],.005,30,6);
  return s.finish();
}

/** #141: a complete steel laboratory burner with an isolated sculpted blue flame. */
function bunsen() {
  const s=new Sculpt({detail:"high"}),steel="#a8b1b6",dark="#535b63",light="#d7dee0";
  const turn=(color:string,p:[number,number][],origin:P=[0,0,0],n=48)=>s.surface(color,new THREE.LatheGeometry(p.map(v=>new THREE.Vector2(...v)),n).translate(...origin));
  s.surface("#7a7e88",new RoundedBoxGeometry(.773,.143,.605,5,.037).translate(0,.142,0));
  s.roundedBox("#aab0b6",0,.203,0,.702,.035,.539,.016);
  for(const x of [-.27,.27])for(const z of [-.197,.197]) {
    oval(s,"#424653",[x,.065,z],[.056,.018,.051],12,8);
    turn("#60656d",[[0,0],[.017,0],[.02,.009],[.015,.015],[0,.015]],[x,.222,z],16);
  }
  turn(dark,[[0,.205],[.18,.205],[.208,.226],[.216,.275],[.206,.32],[.187,.339],[0,.339]]);
  turn(steel,[[0,.288],[.179,.288],[.195,.315],[.2,.372],[.2,.848],[.19,.89],[.163,.914],[0,.914]]);
  // Rolled retaining rims, fine axial flutes and a rear air adjustment collar.
  for(const y of [.327,.862]) {
    s.torus("#6c747b",0,y,0,.197,.009,Math.PI/2);
    s.torus(light,0,y+.014,0,.193,.006,Math.PI/2);
  }
  for(let i=0;i<16;i++) {
    const a=i*Math.PI/8,r=.201;
    s.rod(i%3?"#8d969e":"#c5ced0",[Math.sin(a)*r,.372,Math.cos(a)*r],[Math.sin(a)*r,.835,Math.cos(a)*r],.003);
  }
  for(let i=0;i<5;i++) {
    const a=Math.PI/2+i*Math.PI/4,x=Math.sin(a)*.203,z=Math.cos(a)*.203;
    const g=new RoundedBoxGeometry(.027,.09,.007,2,.003).rotateY(a).translate(x,.378,z);s.surface("#343d48",g);
  }
  turn("#747d86",[[.1,.888],[.141,.888],[.16,.907],[.147,.937],[.115,.947],[.084,.937],[.08,.916],[.1,.888]]);
  // The upper metal nozzle is a true tube with a dark inside below the flame.
  turn("#bdc9d0",[[.076,.931],[.094,.931],[.101,.957],[.093,1.026],[.077,1.041],[.061,1.033],[.066,.962],[.076,.931]]);
  s.torus("#e2e6e2",0,1.03,0,.077,.006,Math.PI/2);
  // Side gas inlet and short curved black hose retain the source's right tail.
  s.rod("#737981",[.176,.344,-.026],[.312,.344,-.026],.047);
  for(let i=0;i<3;i++)s.surface("#b1b6bc",new THREE.TorusGeometry(.046,.007,6,24).rotateY(Math.PI/2).translate(.22+i*.031,.344,-.026));
  const hose:P[]=[[.307,.344,-.026],[.424,.328,-.017],[.508,.25,.004],[.522,.151,.023],[.479,.108,.041]];
  cord(s,"#4c4b57",hose,.031,44,10);
  cord(s,"#777580",hose.map(([x,y,z])=>[x,y+.005,z+.025]),.004,44,6);
  oval(s,"#343540",hose[hose.length-1],[.034,.025,.036],16,10);
  for(const side of [-1,1]) {
    const x=side*.081;
    oval(s,"#303743",[x,.525,.186],[.039,.061,.019],20,12);
    oval(s,"#171b26",[x,.523,.202],[.028,.045,.009],20,12);
    oval(s,"#e7e8de",[x-.009,.548,.211],[.014,.019,.004],12,8);
    oval(s,"#7c8695",[x+.006,.501,.211],[.011,.008,.003],10,6);
  }
  // Rounded flame volumes curve independently; only these blue/cyan surfaces emit.
  const flameColors=["#075fdc","#168fed","#43c9fa","#c4f3ff"];
  const flame=(color:string,p:[number,number][],origin:P,scale:P,lean:number)=>{
    const g=new THREE.LatheGeometry(p.map(v=>new THREE.Vector2(...v)),48),pos=g.getAttribute("position");
    for(let i=0;i<pos.count;i++) {const y=pos.getY(i);pos.setX(i,pos.getX(i)+lean*y*y+.018*Math.sin(y*12));}
    g.computeVertexNormals();s.surface(color,g.scale(...scale).translate(...origin));
  };
  const profile:[number,number][]=[[0,0],[.055,.015],[.102,.082],[.148,.176],[.149,.24],[.108,.316],[.066,.393],[.043,.478],[.012,.551],[0,.599]];
  flame(flameColors[0],profile,[0,1.015,0],[1,1,1],.11);
  flame(flameColors[1],profile,[-.003,1.031,.07],[.77,.82,.65],-.075);
  flame(flameColors[2],profile,[-.004,1.036,.113],[.52,.59,.43],.04);
  flame(flameColors[3],profile,[.001,1.039,.141],[.29,.4,.23],-.06);
  flame(flameColors[0],profile,[-.114,1.131,-.002],[.39,.53,.45],-.42);
  flame(flameColors[1],profile,[.105,1.105,-.002],[.35,.52,.43],.37);
  // Small rear service fastener and understated cast marks finish the rotated view.
  s.rod("#626b74",[0,.673,-.197],[0,.673,-.213],.025);
  s.box("#c5cbd0",0,.673,-.22,.026,.004,.004);
  for(let i=0;i<4;i++)s.box("#747e87",0,.55+i*.025,-.203,.107-(i%2)*.024,.006,.004);
  const geometry=s.finish(),colors=geometry.getAttribute("color"),weights=new Float32Array(colors.count),emit=flameColors.map(c=>new THREE.Color(c));
  for(let i=0;i<colors.count;i++)if(emit.some(c=>Math.abs(c.r-colors.getX(i))<1e-5&&Math.abs(c.g-colors.getY(i))<1e-5&&Math.abs(c.b-colors.getZ(i))<1e-5))weights[i]=.8;
  geometry.setAttribute("glowWeight",new THREE.BufferAttribute(weights,1));geometry.userData.glowSurface=true;
  return geometry;
}

export const SCULPTS_S_OBJECTS:Record<string,()=>THREE.BufferGeometry>={mon_rizla:rizla,mon_bunsen:bunsen};
