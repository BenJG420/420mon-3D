import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];
type XY = [number, number];

function mesh(points: number[], indices: number[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
function cord(s: Sculpt, color: string, points: P[], radius: number, segments = 24, sides = 8) {
  const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  s.surface(color, new THREE.TubeGeometry(path, segments, radius, sides, false));
}
function oval(s: Sculpt, color: string, center: P, size: P, width = 20, height = 12) {
  s.surface(color, new THREE.SphereGeometry(1, width, height).scale(...size).translate(...center));
}
function plate(s: Sculpt, color: string, points: XY[], z: number, depth: number, bevel = .01) {
  const shape = new THREE.Shape(points.map(p => new THREE.Vector2(...p)));
  s.surface(color, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true,
    bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, steps: 1 }).translate(0, 0, z));
}

// A real torn aperture in the can wall; the recessed maroon interior sits behind it.
const MOUTH: XY[] = [[-.318,.67],[-.238,.822],[-.137,.681],[-.025,.847],[.074,.687],
  [.207,.823],[.318,.664],[.319,.342],[.215,.505],[.117,.352],[.003,.534],[-.12,.369],[-.228,.528],[-.322,.343]];
function insideMouth(x: number, y: number) {
  let inside = false;
  for (let i = 0, j = MOUTH.length - 1; i < MOUTH.length; j = i++) {
    const a = MOUTH[i], b = MOUTH[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function canRadius(y: number) {
  return .405 + .032 * Math.cos((y - .25) * Math.PI * 2) - .044 * Math.exp(-Math.pow((y - .73) / .19, 2));
}
function canPoint(a: number, y: number): P {
  const middle = Math.sin((y - .19) / 1.09 * Math.PI);
  const r = canRadius(y) + .024 * Math.sin(a * 5 + y * 8) * middle + .013 * Math.cos(a * 9 - y * 4);
  return [Math.sin(a) * r, y + .012 * Math.sin(a * 3 + y * 3) * middle, Math.cos(a) * r * .88];
}
function canWall() {
  const points: number[] = [], indices: number[] = [], rings = 54, sectors = 80;
  for (let i = 0; i <= rings; i++) for (let j = 0; j <= sectors; j++) points.push(...canPoint(j / sectors * Math.PI * 2, .19 + i / rings * 1.09));
  const triangle = (a: number, b: number, c: number) => {
    const x = (points[a*3] + points[b*3] + points[c*3]) / 3;
    const y = (points[a*3+1] + points[b*3+1] + points[c*3+1]) / 3;
    const z = (points[a*3+2] + points[b*3+2] + points[c*3+2]) / 3;
    if (z < 0 || !insideMouth(x, y)) indices.push(a,b,c);
  };
  for (let i = 0; i < rings; i++) for (let j = 0; j < sectors; j++) {
    const a = i * (sectors + 1) + j, b = a + sectors + 1;
    triangle(a,a+1,b); triangle(a+1,b+1,b);
  }
  return mesh(points, indices);
}
function frontZ(x: number, y: number) {
  const r = canRadius(y);
  return Math.sqrt(Math.max(.018, r*r - x*x)) * .88 + .026;
}

/** #109: compressed, torn silver sheet metal with the original amber glare. */
function crushcan() {
  const s = new Sculpt({ detail: "high" });
  s.surface("#a0a2aa", canWall());
  // Rolled seams bend with the crushed cylindrical body, including the rear.
  for (const [y, color, radius] of [[.21,"#666976",.023],[.235,"#d0d0d2",.018],[1.265,"#665c58",.027],[1.294,"#d7d4d0",.018]] as const) {
    const loop: P[] = [];
    for (let i=0;i<=64;i++) {
      const p = canPoint(i/64*Math.PI*2,y);
      p[1] += Math.sin(i/64*Math.PI*6)*.025; loop.push(p);
    }
    cord(s,color,loop,radius,64,10);
  }
  // Crumpled closed lid: alternating raised folds and a genuine open ring pull.
  const lid: number[] = [0,1.285,0], face: number[] = [], n=64, layers=7;
  for(let i=1;i<=layers;i++) for(let j=0;j<n;j++) {
    const a=j/n*Math.PI*2, t=i/layers, p=canPoint(a,1.276);
    lid.push(p[0]*t,1.282+.027*Math.sin(a*6+t*8)*t-.045*Math.sin(t*Math.PI),p[2]*t);
  }
  for(let j=0;j<n;j++) face.push(0,1+j,1+(j+1)%n);
  for(let i=0;i<layers-1;i++)for(let j=0;j<n;j++) {
    const a=1+i*n+j,b=1+(i+1)*n+j,c=1+i*n+(j+1)%n,d=1+(i+1)*n+(j+1)%n;
    face.push(a,b,c,c,b,d);
  }
  s.surface("#aeb0b7",mesh(lid,face));
  s.lathe("#72747e",[[0,.164],[.24,.164],[.34,.185],[.38,.211],[0,.211]],0,0,0);
  const pull=new THREE.TorusGeometry(1,.19,10,36).scale(.071,.13,.049).rotateX(Math.PI/2).rotateZ(-.32).translate(.095,1.315,.015);
  s.surface("#ddd9d1",pull);
  s.rod("#62656b",[.053,1.285,.11],[.043,1.331,.11],.024);
  for(let i=0;i<7;i++) {
    const a=.3+i*.88;
    cord(s,i%2?"#e0ded9":"#737781",[[Math.sin(a)*.105,1.272,Math.cos(a)*.09],
      [Math.sin(a+.17)*.225,1.3,Math.cos(a+.17)*.19],[Math.sin(a)*.35,1.292,Math.cos(a)*.285]],.007,18,6);
  }
  // Recessed cavity and bright torn perimeter, following the actual mouth cutout.
  plate(s,"#301619",MOUTH,.168,.014,.004);
  const lip=MOUTH.map(([x,y]):P=>[x,y,frontZ(x,y)]);lip.push(lip[0]);
  // Straight edge segments preserve the sharp torn-tooth silhouette.
  for(let i=0;i<lip.length-1;i++) {
    s.rod(i%3?"#e2d8ca":"#b78859",lip[i],lip[i+1],.017);
    const a=lip[i],b=lip[i+1];
    s.rod("#67554a",[a[0]*1.035,a[1],a[2]-.009],[b[0]*1.035,b[1],b[2]-.009],.008);
  }
  for(const side of [-1,1]) {
    // Angled brow folds and deep amber eyes are the source's dominant expression.
    const x=side*.208;
    oval(s,"#655244",[x,.991,.294],[.139,.115,.054]);
    oval(s,"#d7a15b",[x,.984,.335],[.104,.074,.032]);
    oval(s,"#e8d5a4",[x,.991,.357],[.067,.058,.02]);
    oval(s,"#242027",[x-side*.016,.988,.378],[.031,.047,.01]);
    oval(s,"#fff3cb",[x-side*.027,1.01,.389],[.011,.014,.004],12,8);
    cord(s,"#e3ddd4",[[side*.059,1.046,.369],[side*.184,1.115,.342],[side*.333,1.163,.263]],.027,24,10);
    cord(s,"#765748",[[side*.075,1.027,.369],[side*.194,1.087,.35],[side*.32,1.137,.268]],.012,22,8);
    // Folded side walls buckle inward, with local oxidised scratches along the creases.
    const fold:P[]=[[side*.381,1.12,.06],[side*.445,.99,.07],[side*.377,.86,.104],
      [side*.449,.716,.09],[side*.386,.566,.128],[side*.447,.405,.083],[side*.352,.265,.12]];
    cord(s,"#c4c1bb",fold,.027,40,10);
    cord(s,"#865d43",fold.map(([a,b,c])=>[a-side*.017,b,c+.019]),.009,36,6);
    oval(s,"#73717a",[side*.285,.121,.04],[.124,.062,.118]);
    oval(s,"#b8aaa1",[side*.286,.137,.078],[.084,.031,.072],16,10);
  }
  for(let i=0;i<18;i++) {
    const a=.4+i*2.39996,y=.31+(i%7)*.123,p=canPoint(a,y),q=canPoint(a+.04,y+.045);
    if(p[2]>0&&insideMouth(p[0],p[1]))continue;
    p[0]*=1.012;p[2]*=1.012;q[0]*=1.012;q[2]*=1.012;
    s.rod(i%3?"#aa744c":"#d1cbc2",p,q,.005);
  }
  const geometry=s.finish();
  geometry.userData.sculptFeatures=["crumpled cylindrical sheet metal", "actual jagged mouth aperture and recessed interior", "rolled irregular rims", "folded lid with open ring pull", "amber eyes and heavy brows", "oxidised side folds and small metal feet"];
  return geometry;
}

/** #110: split timber gauge, wrapped calibrated bands, low blue eyes and wet root ends. */
function tidegauge() {
  const s=new Sculpt({detail:"high"});
  // Individually curved staves leave small dark gaps and a genuinely splintered crown.
  const staves: {x:number;z:number;top:number;lean:number}[]=[
    {x:-.082,z:.013,top:1.59,lean:-.017},{x:-.036,z:.061,top:1.66,lean:.012},
    {x:.018,z:.066,top:1.61,lean:.009},{x:.068,z:.018,top:1.63,lean:.018},
    {x:.053,z:-.049,top:1.65,lean:.009},{x:-.025,z:-.058,top:1.58,lean:-.013},
  ];
  for(let k=0;k<staves.length;k++) {
    const {x,z,top,lean}=staves[k], points:number[]=[],indices:number[]=[],rings=36,sectors=12;
    for(let i=0;i<=rings;i++) {
      const t=i/rings,y=.17+t*(top-.17),r=.036*(.83+.17*Math.sin(t*Math.PI))*(i===rings?.16:1);
      for(let j=0;j<sectors;j++) {
        const a=j/sectors*Math.PI*2;
        points.push(x+lean*t+Math.cos(a)*r,y+(i===rings?Math.cos(a)*.026:0),z+Math.sin(a)*r*.87+.006*Math.sin(t*8+k));
        if(i<rings){const q=i*sectors+j,n=i*sectors+(j+1)%sectors;indices.push(q,q+sectors,n,n,q+sectors,n+sectors);}
      }
    }
    // Thin tapered cut tips and uneven root ends are closed with small collars.
    const count=points.length/3;points.push(x,.17,z,x+lean,top,z+.006*Math.sin(8+k));
    for(let j=0;j<sectors;j++)indices.push(count,j,(j+1)%sectors,count+1,rings*sectors+(j+1)%sectors,rings*sectors+j);
    s.surface(k%2?"#81704a":"#a58b59",mesh(points,indices));
    const grain:P[]=[];for(let i=0;i<=12;i++){const t=i/12;grain.push([x+lean*t-.012,.2+t*(top-.22),z+.031+.003*Math.sin(t*12+k)]);}
    cord(s,k%2?"#514a34":"#c2a670",grain,.0028,24,5);
    s.cone("#c7ad77",x+lean,top+.014,z,.013,.082,0,0,lean*6);
    const root:P[]=[[x,.25,z],[x*1.15,.163,z*1.15],[x*1.3,.105-(k%3)*.015,z*1.35]];
    cord(s,k%2?"#606242":"#94835a",root,.012,12,8);
  }
  // Calibrated strips wrap around the stave bundle, with alternating enamel paint.
  const front=.111;
  for(let i=0;i<17;i++) {
    const y=.335+i*.067;
    s.surface(i%4<2?"#ddd5ad":"#c83c30",new RoundedBoxGeometry(.099,.048,.014,1,.004).translate(-.008,y,front));
    s.box(i%4<2?"#b8382c":"#f0e4bb",-.013,y+.009,front+.01,.063,.011,.007);
    s.box("#514c39",.042,y-.008,front+.004,.008,.022,.01);
    // Graduation notches extend into the wood to the side of the central strip.
    s.rod("#e3d4a3",[-.088,y+.003,.081],[-.052,y+.003,.104],.0038);
  }
  for(const y of [.303,.825,1.476]) {
    const loop:P[]=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI*2;loop.push([Math.sin(a)*.106,y+Math.sin(a*2)*.004,Math.cos(a)*.095]);}
    cord(s,"#655f46",loop,.009,32,8);
    cord(s,"#bdab7b",loop.map(([x,y,z])=>[x,y+.014,z]),.004,32,6);
    s.roundedBox("#a69a6c",-.056,y+.01,.082,.028,.035,.025,.005);
  }
  for(const side of [-1,1]) {
    const x=side*.055;
    oval(s,"#293c3a",[x,.875,.109],[.034,.048,.021],20,12);
    oval(s,"#2998bc",[x,.875,.127],[.024,.035,.012],18,12);
    oval(s,"#092b42",[x,.87,.139],[.012,.023,.008],16,10);
    oval(s,"#b2ecf2",[x-.006,.89,.146],[.008,.01,.003],12,8);
  }
  for(let i=0;i<8;i++) {
    const x=-.095+(i%4)*.06,z=i<4?.043:-.031,y=.075-(i%3)*.024;
    oval(s,i%2?"#50b6ce":"#246d9c",[x,y,z],[.008,.022,.008],12,10);
    s.cone("#3a93b8",x,y+.026,z,.006,.031);
    oval(s,"#b7e5dc",[x-.002,y+.005,z+.007],[.002,.006,.002],10,6);
  }
  for(let i=0;i<6;i++) {
    const side=i%2?1:-1,y=.19+i*.052;
    cord(s,"#53694a",[[side*.07,y,.035],[side*.095,y+.025,.04],[side*.087,y+.047,.027]],.004,10,6);
  }
  const geometry=s.finish();
  geometry.userData.sculptFeatures=["six curved split timber staves", "splintered crown and exposed wood grain", "seventeen wrapped red ivory calibration bands", "three rope bindings", "low blue glassy eyes", "wet root ends and eight droplets"];
  return geometry;
}

export const SCULPTS_N_SALVAGE: Record<string,()=>THREE.BufferGeometry> = {
  mon_crushcan:crushcan,
  mon_tidegauge:tidegauge,
};
