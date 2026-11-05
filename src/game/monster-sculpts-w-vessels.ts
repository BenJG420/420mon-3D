import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function turn(s:Sculpt,color:string,profile:[number,number][],p:P=[0,0,0],segments=56) {
  s.surface(color,new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),segments).translate(...p));
}

/** #163 — a full lavender glass vessel with long open neck and a hollow side bowl. */
function bong() {
  const s=new Sculpt({detail:"high"});
  // Complete pear reservoir/head casting, with a broad polished rounded foot.
  turn(s,"#b8a0df",[[0,.079],[.205,.079],[.29,.098],[.338,.135],[.352,.198],[.34,.264],
    [.296,.324],[.222,.401],[.174,.476],[.176,.535],[.21,.589],[.224,.66],[.207,.735],
    [.154,.798],[.103,.832],[.096,.862],[0,.862]], [0,0,0],72);
  turn(s,"#d9c9f3",[[.224,.084],[.291,.091],[.343,.123],[.367,.162],[.359,.193],
    [.342,.199],[.332,.168],[.302,.139],[.248,.122],[.224,.084]],[0,0,0],64);
  turn(s,"#8874b0",[[0,.064],[.2,.064],[.287,.079],[.3,.097],[.274,.109],[0,.109]],[0,0,0],48);
  // The long slightly leaning neck has actual outer wall, rolled lip and inner bore.
  const neckOrigin=new THREE.Vector3(.007,.81,-.006),neckAngle=-.12;
  const neck=(color:string,g:THREE.BufferGeometry)=>s.surface(color,g.rotateZ(neckAngle).translate(neckOrigin.x,neckOrigin.y,neckOrigin.z));
  const neckProfile:[number,number][]=[[.064,.002],[.096,.002],[.104,.037],[.097,.092],[.081,.515],
    [.105,.533],[.111,.552],[.104,.574],[.081,.582],[.055,.573],[.053,.55],[.059,.509],[.073,.09],[.064,.002]];
  neck("#cbb8ed",new THREE.LatheGeometry(neckProfile.map(v=>new THREE.Vector2(...v)),64));
  // Recessed inner violet surface makes the opening read deeply from above.
  neck("#807197",new THREE.LatheGeometry([[.056,.55],[.06,.503],[.073,.094],[.065,.043]].map(v=>new THREE.Vector2(...v)),48));
  neck("#ece0ff",new THREE.TorusGeometry(.081,.009,8,40).rotateX(Math.PI/2).translate(0,.576,0));
  neck("#f7f0ff",new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.055,.095,.066),new THREE.Vector3(-.05,.26,.063),new THREE.Vector3(-.046,.492,.06)]),38,.009,8,false));
  neck("#a18bc9",new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(.068,.078,-.044),new THREE.Vector3(.067,.283,-.043),new THREE.Vector3(.059,.512,-.038)]),34,.005,6,false));
  // Sleepy source face with rounded sockets, narrow dark pupils and soft upper lids.
  for(const side of [-1,1]) {
    const x=side*.087,y=.656;
    oval(s,"#8f76b6",[x,y,.199],[.079,.065,.023],24,16);
    oval(s,"#e3d6f5",[x,y-.004,.219],[.066,.048,.014],24,14);
    oval(s,"#43335e",[x,y-.006,.233],[.034,.032,.009],20,12);
    oval(s,"#7655a2",[x+.006,y-.017,.24],[.02,.015,.003],12,8);
    oval(s,"#eee2ff",[x-.012,y+.005,.242],[.011,.012,.003],12,8);
    oval(s,"#b7a0db",[x,y+.028,.23],[.071,.026,.017],24,12);
    cord(s,"#765d9e",[[x-.064,y+.017,.236],[x,y+.014,.251],[x+.063,y+.018,.236]],.005,18,6);
    cord(s,"#e9dafe",[[x-.059,y+.055,.212],[x,y+.071,.218],[x+.053,y+.054,.21]],.005,20,6);
  }
  // Water-blue meniscus and broad pale reflected arcs conform to the rounded lower bowl.
  const water:P[]=[],reflection:P[]=[],back:P[]=[];
  for(let i=0;i<=36;i++) {
    const a=-1.2+i/36*2.4;
    water.push([Math.sin(a)*.338,.226+.005*Math.cos(a),Math.cos(a)*.338]);
    reflection.push([Math.sin(a)*.315,.167+.012*Math.cos(a),Math.cos(a)*.315]);
    back.push([Math.sin(a)*.336,.216,-Math.cos(a)*.336]);
  }
  cord(s,"#a5cbee",water,.013,40,8);
  cord(s,"#f1e7ff",reflection,.01,40,8);
  cord(s,"#c9c5ef",back,.006,36,6);
  for(const side of [-1,1])cord(s,"#eadfff",[[side*.293,.14,.176],[side*.325,.212,.131],
    [side*.286,.3,.119],[side*.213,.383,.115]],.009,28,8);
  // Angled tube and bowl are full round pieces; the bowl's mouth remains empty.
  const stemStart=new THREE.Vector3(-.141,.269,.229),stemEnd=new THREE.Vector3(-.365,.524,.249);
  const axis=stemEnd.clone().sub(stemStart).normalize(),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
  const middle=stemStart.clone().add(stemEnd).multiplyScalar(.5),length=stemStart.distanceTo(stemEnd);
  s.surface("#9b8ac4",new THREE.CylinderGeometry(.043,.052,length,32).applyQuaternion(q).translate(middle.x,middle.y,middle.z));
  const highlight=new THREE.Vector3(0,0,.04).applyQuaternion(q);
  cord(s,"#e7ddf6",[stemStart.clone().add(highlight).toArray() as P,stemEnd.clone().add(highlight).toArray() as P],.006,24,6);
  const bowl=(color:string,g:THREE.BufferGeometry)=>s.surface(color,g.applyQuaternion(q).translate(stemEnd.x,stemEnd.y,stemEnd.z));
  const bowlProfile:[number,number][]=[[.023,-.033],[.044,-.033],[.062,.008],[.075,.063],[.084,.086],
    [.084,.107],[.069,.119],[.047,.111],[.043,.09],[.037,.041],[.023,.021],[.023,-.033]];
  bowl("#b9a3dc",new THREE.LatheGeometry(bowlProfile.map(v=>new THREE.Vector2(...v)),48));
  bowl("#f0e4b9",new THREE.TorusGeometry(.066,.008,8,32).rotateX(Math.PI/2).translate(0,.111,0));
  bowl("#4d4264",new THREE.LatheGeometry([[.043,.092],[.037,.043],[.023,.023],[0,.018]].map(v=>new THREE.Vector2(...v)),40));
  // Small original floating diamond bubble has smooth bevels and a bright edge.
  const bubble=new THREE.OctahedronGeometry(.075,2).scale(1,.98,.67).rotateZ(.12).translate(.267,1.525,-.008);
  s.surface("#d7b8f0",bubble);
  cord(s,"#faf1ff",[[.212,1.527,.008],[.254,1.581,.01],[.31,1.542,.009]],.005,22,6);
  oval(s,"#eee5ff",[.247,1.544,.039],[.017,.022,.006],14,10);
  // Minor maker's marks and smooth inclusions finish the actual back surface.
  for(let i=0;i<12;i++) {
    const a=1.8+i*.25,y=.146+(i%4)*.027,r=.329;
    oval(s,i%3?"#b9a5dd":"#d6c7ed",[Math.sin(a)*r,y,Math.cos(a)*r],[.008,.013,.003],8,6);
  }
  for(const x of [-.192,.192])oval(s,"#8e77b3",[x,.075,.077],[.071,.023,.075],16,10);
  return s.finish();
}

/** A hollow transported U with real inner walls and annular faces at both ends. */
function hollowU(path:THREE.CatmullRomCurve3) {
  const steps=88,sides=20,outer=new THREE.TubeGeometry(path,steps,1,sides,false),inner=outer.clone();
  for(const [g,inside] of [[outer,false],[inner,true]] as const) {
    const positions=g.getAttribute("position");
    for(let i=0;i<=steps;i++) {
      const t=i/steps,c=path.getPointAt(t),r=inside?.108+.018*Math.sin(t*Math.PI):.148+.034*Math.sin(t*Math.PI);
      for(let j=0;j<=sides;j++) {
        const k=i*(sides+1)+j,p=new THREE.Vector3().fromBufferAttribute(positions,k).sub(c).multiplyScalar(r).add(c);
        positions.setXYZ(k,p.x,p.y,p.z);
      }
    }
    if(inside) {
      const indices=g.getIndex()!;
      for(let i=0;i<indices.count;i+=3){const a=indices.getX(i);indices.setX(i,indices.getX(i+2));indices.setX(i+2,a);}
    }
    g.computeVertexNormals();
  }
  return {outer,inner};
}

/** #164 — complete thick metal trap, two deeply open mouths and hanging green slime. */
function ubend() {
  const s=new Sculpt({detail:"high"});
  const points:P[]=[[-.498,1.171,0],[-.493,.922,0],[-.416,.661,0],[-.234,.465,0],
    [0,.402,0],[.234,.465,0],[.416,.661,0],[.493,.922,0],[.498,1.171,0]];
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),tube=hollowU(path);
  s.surface("#aaa89a",tube.outer);s.surface("#484c46",tube.inner);
  // Thick rolled mouth profiles connect the inner and outer pipe walls at each end.
  for(const x of [-.498,.498]) {
    turn(s,"#706d61",[[.109,1.078],[.159,1.078],[.177,1.101],[.18,1.198],[.163,1.218],[.113,1.213],[.109,1.078]],[x,0,0],40);
    turn(s,"#c6c2ae",[[.111,1.182],[.174,1.182],[.191,1.195],[.194,1.223],[.174,1.244],
      [.13,1.25],[.11,1.238],[.106,1.216],[.111,1.182]],[x,0,0],40);
    s.surface("#e0d9c2",new THREE.TorusGeometry(.148,.009,6,32).rotateX(Math.PI/2).translate(x,1.244,0));
    for(let i=0;i<12;i++) {
      const a=i*Math.PI/6;
      cord(s,i%2?"#a49b83":"#5f6259",[[x+Math.sin(a)*.181,1.116,Math.cos(a)*.181],
        [x+Math.sin(a)*.181,1.177,Math.cos(a)*.181]],.003,6,5);
    }
  }
  // Two green-rimmed source eyes sit clear of the metal and slime on the front bend.
  for(const side of [-1,1]) {
    const x=side*.189,y=.454;
    oval(s,"#555c44",[x,y,.154],[.101,.092,.026],24,16);
    oval(s,"#1d2722",[x,y,.18],[.079,.074,.024],24,16);
    oval(s,"#88b237",[x,y-.002,.203],[.057,.055,.011],24,14);
    oval(s,"#17241c",[x+side*.003,y+.002,.215],[.032,.037,.007],20,12);
    oval(s,"#e5edd2",[x-.01,y+.02,.223],[.014,.019,.003],12,8);
    cord(s,"#c6c3a7",[[x-.082,y+.06,.169],[x-.012,y+.098,.174],[x+.07,y+.064,.166]],.008,22,6);
  }
  // Moist green runs hug both outside pipe shoulders and the underside of the U.
  for(const side of [-1,1]) {
    cord(s,"#5b812c",[[side*.574,.94,.078],[side*.557,.806,.108],[side*.462,.598,.141],
      [side*.321,.395,.14],[side*.118,.269,.124]],.014,32,6);
    cord(s,"#92aa45",[[side*.582,.913,.081],[side*.551,.805,.118],[side*.457,.613,.153]],.004,20,6);
    oval(s,"#689231",[side*.511,.916,.143],[.029,.045,.007],16,10);
    oval(s,"#86a443",[side*.516,.899,.15],[.014,.024,.004],12,8);
    s.rod("#74715b",[side*.378,.376,.014],[side*.448,.165,.012],.05);
    oval(s,"#969275",[side*.457,.125,.04],[.103,.05,.112],24,14);
    oval(s,"#c0b893",[side*.464,.148,.099],[.066,.024,.053],18,10);
    for(let i=0;i<3;i++)oval(s,"#7d972e",[side*.451+(i-1)*.065,.118,.132],[.029,.009,.019],10,6);
  }
  for(let i=0;i<5;i++) {
    const x=-.25+i*.125,root=.227+.13*Math.abs(x),end=i===2?.008:.12+(i%2)*.025;
    cord(s,i%2?"#708b2e":"#8aa23b",[[x,root+.026,.121],[x+.008,root-.04,.13],[x-.002,end+.021,.136]],i===2?.019:.011,20,6);
    oval(s,"#8da83d",[x-.002,end,.137],[i===2?.035:.017,i===2?.052:.027,.017],16,10);
    if(i===2)cord(s,"#b4c66a",[[-.014,.061,.152],[-.015,.012,.153]],.004,10,5);
  }
  // Small tangent oxidation islands cover the whole curved casting, including the back.
  const frames=path.computeFrenetFrames(44,false);
  for(let i=0;i<44;i++) {
    const t=(i+.4)/44,a=i*2.399963,c=path.getPointAt(t),r=.149+.034*Math.sin(t*Math.PI);
    const n=frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a)).normalize();
    const p=c.addScaledVector(n,r);
    if(p.z>.1&&p.y<.57&&Math.abs(Math.abs(p.x)-.189)<.13)continue;
    s.surface(i%3?"#887758":"#d5c8a6",new THREE.SphereGeometry(1,8,4)
      .scale(.016+(i%3)*.009,.021+(i%4)*.007,.003).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n)).translate(p.x,p.y,p.z));
  }
  // Cast rear marks are a shallow relief on the closed back of the lower bend.
  for(let i=0;i<5;i++)s.box("#706e5d",-.067+i*.034,.397,-.183,.012,.049,.005);
  return s.finish();
}

export const SCULPTS_W_VESSELS:Record<string,()=>THREE.BufferGeometry>={mon_bong:bong,mon_ubend:ubend};
