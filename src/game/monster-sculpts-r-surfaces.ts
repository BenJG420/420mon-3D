import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function oval(s:Sculpt,color:string,p:P,size:P,w=16,h=10) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...size).translate(...p));
}
function cord(s:Sculpt,color:string,points:P[],r:number,steps=24,sides=6) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,sides,false));
}
function turn(s:Sculpt,color:string,profile:[number,number][],p:P=[0,0,0],segments=56) {
  s.surface(color,new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),segments).translate(...p));
}

/** #134: a worn ivory soap block, branching fissures and a softened dripping edge. */
function soapbar() {
  const s=new Sculpt({detail:"high"});
  s.surface("#d4cfc1",new RoundedBoxGeometry(1.08,.8,.65,9,.15).translate(0,.57,0));
  // Thin branching crack inlays wrap over the crown and down the rounded edges.
  // Both projections follow the real bevel instead of floating over a flat face.
  const topY=(x:number,z:number)=>.82+Math.sqrt(Math.max(.001,.15**2-Math.max(0,Math.abs(x)-.39)**2-Math.max(0,Math.abs(z)-.175)**2));
  const faceZ=(x:number,y:number)=>.175+Math.sqrt(Math.max(.001,.15**2-Math.max(0,Math.abs(x)-.39)**2-Math.max(0,Math.abs(y-.57)-.25)**2));
  const topCracks:[number,number][][]=[
    [[-.42,-.23],[-.29,-.16],[-.19,-.02],[-.24,.11],[-.34,.23]],
    [[-.19,-.02],[-.08,-.11],[.02,-.2],[.025,-.28]],
    [[-.19,-.02],[-.08,.04],[.01,.1]],
    [[.18,-.28],[.22,-.16],[.3,-.04],[.22,.04],[.28,.17],[.39,.23]],
    [[.3,-.04],[.42,-.08],[.48,-.01]],
    [[.22,.04],[.13,.09],[.1,.16]],
    [[-.34,.23],[-.4,.19],[-.47,.26]],
  ];
  for(let i=0;i<topCracks.length;i++) {
    const points=topCracks[i].map(([x,z]):P=>[x,topY(x,z)+.001,z]);
    cord(s,i%2?"#ada394":"#938879",points,.0055,20,6);
    cord(s,"#eee9db",points.map(([x,y,z])=>[x+.008,y+.001,z]),.003,20,5);
  }
  const cracks:[number,number][][]=[
    [[-.345,.916],[-.323,.83],[-.412,.75],[-.44,.625],[-.406,.55],[-.43,.401],[-.376,.255]],
    [[-.323,.83],[-.231,.791],[-.185,.704]],
    [[-.44,.625],[-.49,.57],[-.499,.45]],
    [[.389,.918],[.42,.803],[.346,.744],[.42,.649],[.44,.51],[.4,.38],[.316,.245]],
    [[.346,.744],[.253,.705],[.261,.642]],
    [[.4,.38],[.481,.329]],
    [[-.16,.254],[-.105,.32],[-.064,.36]],
  ];
  for(let i=0;i<cracks.length;i++) {
    const points=cracks[i].map(([x,y]):P=>[x,y,faceZ(x,y)+.002]);
    cord(s,i%2?"#b3a995":"#998c7c",points,.005,22,6);
    cord(s,"#eee9d9",points.map(([x,y,z])=>[x+.009,y,z+.001]),.003,22,5);
  }
  // Small smooth erosion pockets and chalky islands follow the sides and back.
  for(let i=0;i<26;i++) {
    const a=i*2.399963,y=.33+(i%5)*.105,x=Math.sin(a)*.514,z=Math.cos(a)*.28;
    const normal=new THREE.Vector3(Math.sin(a),0,Math.cos(a));
    const shape=new THREE.SphereGeometry(1,10,6).scale(.012+(i%3)*.009,.012+(i%2)*.014,.0025)
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal)).translate(x,y,z);
    s.surface(i%3?"#e7e0d0":"#b9af9b",shape);
  }
  for(const side of [-1,1]) {
    const x=side*.225;
    oval(s,"#afa593",[x,.54,.325],[.145,.111,.028],24,16);
    oval(s,"#f1ebdb",[x,.539,.348],[.119,.085,.018],24,16);
    oval(s,"#292731",[x,.537,.365],[.09,.063,.012],24,16);
    oval(s,"#8f8b8b",[x-side*.01,.526,.376],[.049,.038,.008],20,12);
    oval(s,"#25232d",[x-side*.01,.531,.384],[.027,.036,.005],16,10);
    oval(s,"#faf8ec",[x-.024,.55,.391],[.018,.015,.004],12,8);
    oval(s,"#e6e0cd",[x+.038,.513,.383],[.009,.008,.003],10,6);
    // Heavy softened eyelids preserve the original tired expression.
    cord(s,"#c6bfad",[[x-.125,.589,.351],[x-.03,.596,.375],[x+.114,.606,.351]],.022,22,8);
    cord(s,"#857e70",[[x-.111,.568,.371],[x,.575,.389],[x+.112,.585,.368]],.006,22,6);
    oval(s,"#a19d91",[side*.355,.148,.053],[.072,.037,.087]);
    oval(s,"#d2caba",[side*.357,.158,.09],[.047,.018,.044],12,8);
  }
  // A thick drooping lower lip becomes the source's long ivory droplet.
  cord(s,"#e9e0cd",[[.015,.236,.28],[.097,.207,.285],[.119,.154,.29],[.119,.081,.292]],.025,26,10);
  oval(s,"#f2ebdc",[.119,.065,.293],[.035,.048,.028],20,12);
  oval(s,"#fff8e6",[.108,.073,.316],[.009,.021,.004],12,8);
  cord(s,"#b1a58e",[[-.22,.72,-.326],[-.14,.63,-.328],[-.18,.514,-.327],[-.09,.422,-.326]],.006,24,6);
  cord(s,"#bdb29d",[[.27,.776,-.322],[.19,.705,-.329],[.24,.595,-.329],[.17,.455,-.327]],.005,24,6);
  return s.finish();
}

/** #136: dented blue steel drum, rolled hoops, rust islands and a folded blue face. */
function drumcan() {
  const s=new Sculpt({detail:"high"});
  const blue="#426c8a", rust="#9b5b35", dark="#263f57";
  const radiusAt=(y:number)=>.405+.013*Math.cos((y-.12)*Math.PI*2)-.012*Math.exp(-Math.pow((y-.63)/.19,2));
  const point=(a:number,y:number,lift=0):P=>{
    const r=radiusAt(y)+.007*Math.sin(a*5+y*8)*Math.sin((y-.12)/1.18*Math.PI)+lift;
    return [Math.sin(a)*r,y,Math.cos(a)*r];
  };
  const positions:number[]=[],indices:number[]=[],rings=36,sectors=72;
  for(let i=0;i<=rings;i++)for(let j=0;j<=sectors;j++)positions.push(...point(j/sectors*Math.PI*2,.13+i/rings*1.13));
  for(let i=0;i<rings;i++)for(let j=0;j<sectors;j++) {
    const a=i*(sectors+1)+j,b=a+sectors+1;
    indices.push(a,a+1,b,a+1,b+1,b);
  }
  const shell=new THREE.BufferGeometry();shell.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));shell.setIndex(indices);shell.computeVertexNormals();s.surface(blue,shell);
  // Closed dished lid/underside and the rolled top, mid-body and bottom chimes.
  turn(s,"#536d80",[[0,1.219],[.32,1.219],[.39,1.232],[.407,1.254],[.39,1.267],[.34,1.251],[0,1.245]]);
  turn(s,dark,[[0,.092],[.33,.092],[.393,.112],[.409,.136],[.388,.16],[0,.16]]);
  for(const y of [.145,.583,1.267]) {
    turn(s,dark,[[.394,-.026],[.421,-.026],[.441,-.009],[.442,.015],[.427,.032],[.399,.032],[.391,.012],[.394,-.026]],[0,y,0]);
    s.torus("#b9956a",0,y+.017,0,.433,.01,Math.PI/2);
    s.torus("#829bab",0,y+.031,0,.419,.006,Math.PI/2);
  }
  // Ragged patches are curved embossed islands matching the bowed sheet metal.
  for(let i=0;i<47;i++) {
    const a=.23+i*2.399963,y=.218+(i%11)*.085;
    if(Math.cos(a)>.65 && y>.648 && y<.916)continue;
    const width=.045+(i%4)*.033,height=.022+(i%3)*.023,n=11;
    const points:number[]=[...point(a,y,.003)],faces:number[]=[];
    for(let j=0;j<n;j++) {
      const t=j/n*Math.PI*2,r=1+.23*Math.sin(i+j*3.3);
      points.push(...point(a+Math.cos(t)*width*r,y+Math.sin(t)*height*r,.004));
    }
    for(let j=0;j<n;j++)faces.push(0,j+1,1+(j+1)%n);
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(points,3));g.setIndex(faces);g.computeVertexNormals();
    s.surface(i%3?rust:"#bd7846",g);
  }
  // Broad rust bloom on the recessed lid has a curved perimeter and layered pits.
  const lidShape=new THREE.Shape();
  for(let i=0;i<20;i++){const a=i*Math.PI/10,r=.219+.025*Math.sin(i*2.7);if(i===0)lidShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);else lidShape.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
  lidShape.closePath();s.surface(rust,new THREE.ExtrudeGeometry(lidShape,{depth:.004,bevelEnabled:true,bevelSize:.008,bevelThickness:.003,bevelSegments:2}).rotateX(-Math.PI/2).translate(0,1.251,0));
  for(let i=0;i<14;i++){const a=i*2.399963,r=.04+(i%4)*.04;oval(s,i%2?"#7d4931":"#b46e3e",[Math.sin(a)*r,1.261,Math.cos(a)*r],[.017,.003,.013],10,6);}
  for(let i=0;i<21;i++) {
    const a=i*Math.PI*2/21;
    cord(s,i%2?"#ba723d":"#d3ad76",[point(a,1.269,.024),point(a+.025,1.282,.023),point(a+.042,1.266,.021)],.008,6,6);
  }
  // Seams and scratched paint continue around the sides/back, preserving face space.
  for(let i=0;i<16;i++) {
    const a=1.1+i*.25,y=.24+(i%6)*.15;
    cord(s,i%3?"#7692a0":"#c48651",[point(a,y,.005),point(a+.019,y+.051,.006),point(a+.026,y+.079,.004)],.003,12,6);
  }
  for(const side of [-1,1]) {
    const x=side*.143;
    oval(s,"#263241",[x,.813,.378],[.048,.079,.023],24,16);
    oval(s,"#bbb7a4",[x-.004,.831,.4],[.021,.04,.011],20,12);
    oval(s,"#eee6c2",[x-.01,.848,.411],[.01,.014,.003],12,8);
    oval(s,"#26394d",[side*.29,.076,.033],[.114,.054,.128],20,12);
    cord(s,"#9e5c37",[[side*.29-.065,.062,.125],[side*.29,.051,.146],[side*.29+.065,.063,.126]],.009,14,6);
  }
  // The source's cyan Y fold is thick sculpted metal, with a deep central crease.
  for(const side of [-1,1]) {
    cord(s,"#214965",[[side*.253,.635,.326],[side*.124,.576,.391],[0,.515,.426],[0,.402,.423]],.021,28,8);
    cord(s,"#6fa9c1",[[side*.248,.653,.343],[side*.12,.598,.414],[side*.017,.527,.447],[side*.012,.444,.444]],.014,28,8);
    cord(s,"#9dc9d3",[[side*.221,.66,.351],[side*.117,.612,.426],[side*.025,.553,.45]],.005,20,6);
  }
  return s.finish();
}

export const SCULPTS_R_SURFACES:Record<string,()=>THREE.BufferGeometry>={mon_soapbar:soapbar,mon_drumcan:drumcan};
