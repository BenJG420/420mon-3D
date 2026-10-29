import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P=[number,number,number];
function cord(s:Sculpt,color:string,points:P[],radius:number,steps=24,sides=8) {
  s.surface(color,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,radius,sides,false));
}
function oval(s:Sculpt,color:string,center:P,scale:P,w=20,h=12) {
  s.surface(color,new THREE.SphereGeometry(1,w,h).scale(...scale).translate(...center));
}
function panel(s:Sculpt,color:string,outline:[number,number][],z:number,depth=.014,surfaceZ?:(x:number,y:number)=>number) {
  const shape=new THREE.Shape(outline.map(p=>new THREE.Vector2(...p)));
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:3}).translate(0,0,z);
  if(surfaceZ){const positions=geometry.getAttribute("position");for(let i=0;i<positions.count;i++)positions.setZ(i,positions.getZ(i)+surfaceZ(positions.getX(i),positions.getY(i)));geometry.computeVertexNormals();}
  s.surface(color,geometry);
}

/** #130 — round pear leather bag, source's angry eyes and actual hanging eyelet. */
function speedbag() {
  const s=new Sculpt({detail:"high"});
  const profile=new THREE.SplineCurve([
    [0,.12],[.19,.135],[.345,.19],[.455,.3],[.492,.45],[.47,.61],
    [.393,.79],[.289,.974],[.18,1.139],[.091,1.272],[.064,1.325],[0,1.329],
  ].map(p=>new THREE.Vector2(...p))).getPoints(72);
  const body=new THREE.LatheGeometry(profile,64).scale(1,1,.84);
  s.surface("#c9162c",body);
  const radiusAt=(y:number)=>{
    for(let i=1;i<profile.length;i++)if(profile[i].y>=y&&profile[i-1].y<=y){
      const a=profile[i-1],b=profile[i],t=(y-a.y)/(b.y-a.y||1);return a.x+(b.x-a.x)*t;
    }
    return .065;
  };
  const frontZ=(x:number,y:number)=>.84*Math.sqrt(Math.max(.002,radiusAt(y)**2-x*x));
  // A closed rolled underside follows the actual pear base rather than a flat disc.
  const bottom: P[]=[];
  for(let i=0;i<=64;i++){const a=i*Math.PI/32;bottom.push([Math.sin(a)*.335,.188,Math.cos(a)*.281]);}
  cord(s,"#681b31",bottom,.014,64,8);
  cord(s,"#94243a",bottom.map(([x,y,z])=>[x*1.015,y+.019,z*1.015]),.007,64,6);

  // Six sculpted panel seams and paired stitches extend around the complete bag.
  for(let seam=0;seam<6;seam++) {
    const angle=.73+seam*Math.PI/3,points:P[]=[];
    for(let j=0;j<=27;j++){
      const y=.25+j/27*1.02,r=radiusAt(y)+.003;
      points.push([Math.sin(angle)*r,y,Math.cos(angle)*r*.84]);
    }
    cord(s,seam%2?"#a61129":"#e32a3c",points,.0045,32,6);
    for(let j=0;j<11;j++){
      const y=.3+j*.083,r=radiusAt(y)+.006;
      // Tiny diagonal stitch bars wrap the curved skin, not floating in a plane.
      s.rod("#b5444a",[Math.sin(angle-.017)*r,y-.005,Math.cos(angle-.017)*r*.84],
        [Math.sin(angle+.017)*r,y+.007,Math.cos(angle+.017)*r*.84],.0024);
    }
  }
  // Original white angular eyes remain readable against deep red sockets.
  for(const side of [-1,1]) {
    const reflect=(points:[number,number][])=>points.map(([x,y]):[number,number]=>[x*side,y]);
    panel(s,"#6d1528",reflect([[.058,.587],[.115,.48],[.253,.46],[.331,.54],[.31,.707],[.223,.66],[.151,.616]]),.006,.017,frontZ);
    panel(s,"#e9e9e1",reflect([[.085,.585],[.132,.5],[.237,.49],[.295,.549],[.285,.674],[.206,.635],[.145,.592]]),.026,.019,frontZ);
    oval(s,"#282331",[side*.178,.566,frontZ(side*.178,.566)+.055],[.046,.059,.015],20,12);
    oval(s,"#fff8ee",[side*.16,.594,frontZ(side*.16,.594)+.068],[.014,.019,.004],12,8);
    cord(s,"#84102a",[[side*.068,.625,frontZ(side*.068,.625)+.045],[side*.165,.654,frontZ(side*.165,.654)+.045],[side*.313,.748,frontZ(side*.313,.748)+.02]],.016,24,8);
  }
  // Rear lacing is a separate narrow leather tongue with crossed thread loops.
  const lace:P[]=[];for(let j=0;j<16;j++){const y=.784+j*.025;lace.push([0,y,-radiusAt(y)*.84-.008]);}
  cord(s,"#7c1d31",lace,.025,28,8);
  for(let j=0;j<8;j++){
    const y=.803+j*.043,z=-radiusAt(y)*.84-.022,zz=-radiusAt(y+.025)*.84-.022;
    s.rod("#d98972",[-.023,y,z],[.023,y+.025,zz],.0035);
    s.rod("#a6675e",[.023,y,z],[-.023,y+.025,zz],.0035);
  }
  // Rolled neck, machined swivel and hollow elliptical suspension eye.
  s.lathe("#601b2c",[[0,1.27],[.073,1.27],[.077,1.31],[.064,1.347],[0,1.347]],0,0,0);
  s.lathe("#6f7480",[[0,1.325],[.084,1.325],[.094,1.343],[.092,1.379],[.075,1.395],[0,1.395]],0,0,0);
  s.torus("#b5bcc4",0,1.376,0,.087,.008,Math.PI/2);
  s.rod("#4e5463",[0,1.391,0],[0,1.447,0],.031);
  s.surface("#9cabb6",new THREE.TorusGeometry(1,.21,12,40).scale(.047,.076,.034).translate(0,1.503,0));
  s.surface("#d9d9df",new THREE.TorusGeometry(1,.07,6,32).scale(.046,.075,.035).translate(0,1.503,.007));
  s.rod("#6a6c7b",[-.038,1.43,0],[.038,1.43,0],.015);
  return s.finish();
}

const YARN_CENTER=new THREE.Vector3(0,.71,0);
const YARN_SIZE=new THREE.Vector3(.49,.5,.425);
function eyeOpening(x:number,y:number,z:number,margin=1) {
  return z>.19&&[-.168,.168].some(cx=>((x-cx)/(.082*margin))**2+((y-.726)/(.112*margin))**2<1);
}

/** The outer core itself is open at the sockets; dark insets lie behind the yarn. */
function yarnCore() {
  const geometry=new THREE.SphereGeometry(1,56,32).scale(YARN_SIZE.x,YARN_SIZE.y,YARN_SIZE.z).translate(YARN_CENTER.x,YARN_CENTER.y,YARN_CENTER.z);
  const pos=geometry.getAttribute("position"),old=geometry.getIndex()!,indices:number[]=[];
  for(let i=0;i<old.count;i+=3){
    const a=old.getX(i),b=old.getX(i+1),c=old.getX(i+2);
    const x=(pos.getX(a)+pos.getX(b)+pos.getX(c))/3,y=(pos.getY(a)+pos.getY(b)+pos.getY(c))/3,z=(pos.getZ(a)+pos.getZ(b)+pos.getZ(c))/3;
    if(!eyeOpening(x,y,z))indices.push(a,b,c);
  }
  geometry.setIndex(indices);return geometry;
}

/** #131 — layered crossed yarn, inset eye sockets, small tufts and a loose trailing end. */
function yarnball() {
  const s=new Sculpt({detail:"high"});
  s.surface("#80629d",yarnCore());
  const shades=["#ad8ac9","#9872b6","#b698cd","#8765a7","#c0a0d5","#a380c1"];
  // Three different wrapping directions form small-circle courses over the entire
  // solid. Front strands are split around the eye apertures, leaving actual depth.
  for(let group=0;group<3;group++) {
    const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(.47+group*.77,.31+group*.63,.67+group*.89));
    for(let course=0;course<8;course++) {
      const offset=-.69+course*.197,radial=Math.sqrt(1-offset*offset),points:P[]=[];
      for(let j=0;j<=52;j++) {
        const angle=j*Math.PI*2/52,p=new THREE.Vector3(Math.cos(angle)*radial,offset,Math.sin(angle)*radial).applyQuaternion(rotation);
        const rise=1.018+.012*Math.sin(angle*3+course+group*2);
        p.multiply(YARN_SIZE).multiplyScalar(rise).add(YARN_CENTER);points.push(p.toArray() as P);
      }
      let fragment:P[]=[];
      const flush=()=>{
        if(fragment.length>2)cord(s,shades[(group*2+course)%shades.length],fragment,.012+(course%3)*.002,Math.max(3,fragment.length-1),6);
        fragment=[];
      };
      for(const p of points){if(eyeOpening(...p,1.24))flush();else fragment.push(p);}
      flush();
    }
  }
  for(const cx of [-.168,.168]) {
    // Dark cavity volume is physically behind the outer ball, with a soft oval lip.
    oval(s,"#30203f",[cx,.726,.286],[.078,.107,.033],20,12);
    oval(s,"#130e20",[cx,.726,.31],[.065,.091,.012],20,12);
    const rim:P[]=[];
    for(let j=0;j<=40;j++) {
      const a=j*Math.PI/20,x=cx+Math.cos(a)*.087,y=.726+Math.sin(a)*.117;
      const z=.425*Math.sqrt(Math.max(.02,1-(x/.49)**2-((y-.71)/.5)**2))+.006;
      rim.push([x,y,z]);
    }
    cord(s,"#c0a0d5",rim,.012,40,8);
    cord(s,"#694d86",rim.map(([x,y,z])=>[x,y,z-.019]),.011,40,6);
  }
  // Short loose loops are scattered around the silhouette, with occasional split tips.
  for(let i=0;i<15;i++) {
    const a=.24+i*Math.PI*2/15,x=Math.cos(a)*.492,y=.71+Math.sin(a)*.5;
    const outward=new THREE.Vector3(Math.cos(a),Math.sin(a),.05);
    const p=new THREE.Vector3(x,y,-.028+(i%3)*.021),q=p.clone().addScaledVector(outward,.072);
    cord(s,shades[i%shades.length],[p.toArray() as P,[q.x-.012*Math.sin(a),q.y+.012*Math.cos(a),q.z+.014],q.toArray() as P],.009,10,6);
    oval(s,"#b090cb",q.toArray() as P,[.012,.012,.012],8,6);
  }
  // The original long end falls to the lower right in three soft bends.
  const tail:P[]=[[.418,.47,-.015],[.56,.401,.004],[.573,.265,.015],[.516,.178,.029],
    [.599,.081,.027],[.681,.034,.023],[.656,-.055,.018],[.733,-.091,.014]];
  cord(s,"#a781c5",tail,.014,56,8);
  cord(s,"#c0a0d4",tail.map(([x,y,z])=>[x-.003,y,z+.012]),.003,56,5);
  oval(s,"#ad88c8",tail[tail.length-1],[.014,.014,.014],10,6);
  return s.finish();
}

export const SCULPTS_Q_SOFT:Record<string,()=>THREE.BufferGeometry>={mon_speedbag:speedbag,mon_yarnball:yarnball};
