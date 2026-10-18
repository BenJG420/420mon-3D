import * as THREE from "three";
import { Sculpt } from "./model-sculpt";
import { SCULPTS_H_OBJECTS } from "./monster-sculpts-h-objects";
type P = [number, number, number];
const ball = (s:Sculpt,c:string,p:P,r:P) => s.ellipsoid(c,...p,...r);
const line = (s:Sculpt,c:string,a:P,b:P,r=.015) => s.rod(c,a,b,r);

/** #73: a dark feathered crow, hooked beak, gripping feet and a hanging price tag. */
function pricecrow() {
 const s = new Sculpt(), feather='#202836', edge='#354050', dark='#131b27';
 ball(s,feather,[-.045,.63,0],[.25,.345,.205]);
 ball(s,dark,[-.015,.89,0],[.18,.24,.16]);
 ball(s,feather,[.035,1.115,.015],[.218,.226,.175]);
 // Swept crown and neck tufts follow the source silhouette.
 for(let i=0;i<7;i++) {
  const x=-.17+i*.042,y=1.24+Math.sin(i*.7)*.075;
  s.panel(i%2?edge:feather,[[x-.06,y-.08,.015],[x-.1,y+.09,.015],[x+.02,y+.015,.015],[x+.065,y-.12,.015]],.11);
 }
 for(const side of [-1,1]) {
  const z=side*.18;
  ball(s,edge,[-.14,.675,z],[.17,.255,.057]);
  for(let row=0;row<3;row++)for(let col=0;col<3;col++) {
   const x=-.24+col*.075-row*.022,y=.8-row*.12,zf=z+side*(.04+row*.004);
   s.panel(feather,[[x+.085,y+.035,zf],[x+.105,y-.05,zf],[x-.045,y-.22,zf],[x-.09,y-.185,zf],[x-.025,y-.05,zf]],.024);
   s.tube(edge,[[x+.07,y+.015,zf+side*.015],[x+.01,y-.1,zf+side*.018],[x-.05,y-.18,zf+side*.012]],.009,10);
  }
  for(let i=0;i<3;i++) {
   s.panel(dark,[[-.18,.46,z],[-.2-i*.045,.17-i*.02,z],[-.46-i*.045,.16-i*.025,z],[-.3,.49,z]],.03);
  }
  for(let i=0;i<4;i++) {
   const y=.91-i*.09;
   s.panel(feather,[[.08,y+.06,side*.15],[.19,y+.02,side*.15],[.12,y-.12,side*.15],[-.005,y-.04,side*.15]],.022);
  }
  // The near and far eye retain the same hooked brow and yellow iris.
  ball(s,dark,[.145,1.116,side*.15],[.069,.057,.025]);
  ball(s,'#d4a22a',[.153,1.11,side*.171],[.044,.039,.014]);
  ball(s,'#141923',[.167,1.108,side*.184],[.018,.03,.009]);
  ball(s,'#e9d396',[.149,1.126,side*.19],[.009,.01,.005]);
  line(s,feather,[.095,1.169,side*.171],[.206,1.133,side*.171],.026);
 }
 // Upper and lower beak meet in a sharp hooked profile, with a dark mouth seam.
 s.panel('#3a4350',[[.18,1.08,.035],[.29,1.11,.035],[.43,1.025,.035],[.47,.915,.035],[.36,.985,.035],[.21,1.015,.035]],.12);
 s.panel(dark,[[.19,1.01,.035],[.36,.979,.035],[.43,.923,.035],[.26,.956,.035]],.095);
 ball(s,'#111a25',[.29,1.06,.1],[.018,.013,.009]);
 for(const x of [-.12,.12]) {
  line(s,dark,[x,.34,0],[x+.025,.17,.04],.026);
  ball(s,edge,[x+.025,.15,.04],[.035,.035,.034]);
  for(let i=0;i<3;i++) {
   s.tube(feather,[[x+.025,.15,.04],[x+(i-1)*.045,.075,.13],[x+(i-1)*.075,.055,.21]],.015,10);
   line(s,'#151b24',[x+(i-1)*.075,.055,.21],[x+(i-1)*.08,.035,.24],.009);
  }
  line(s,edge,[x+.025,.14,.03],[x+.05,.065,-.09],.015);
 }
 s.tube('#846523',[[.438,.954,.055],[.465,.91,.09],[.48,.835,.13]],.01,12);
 s.panel('#cd9a15',[[.437,.85,.14],[.575,.887,.14],[.678,.606,.14],[.52,.56,.14]],.035);
 s.panel('#e5b727',[[.45,.842,.161],[.568,.872,.161],[.66,.614,.161],[.53,.577,.161]],.008);
 ball(s,'#59471f',[.485,.827,.17],[.012,.014,.006]);
 // Embossed source tag symbol; no font, external logo texture or runtime download.
 line(s,'#694c17',[.523,.768,.18],[.566,.637,.18],.009);
 line(s,'#694c17',[.545,.775,.18],[.588,.644,.18],.007);
 s.tube('#694c17',[[.52,.75,.182],[.574,.76,.182],[.599,.73,.182],[.549,.697,.182],[.607,.704,.182],[.622,.668,.182],[.559,.65,.182]],.01,26);
 return s.finish();
}

/** #74: chipped stone block, cracked capstones and dripping green/purple graffiti. */
function grafface() {
 const s = new Sculpt(), stone='#514b50', dark='#28252e', edge='#6d6265', purple='#741a91', lime='#7ebc00';
 s.panel(stone,[[-.43,.16,0],[.4,.16,0],[.49,.31,0],[.46,1.09,0],[.31,1.18,0],[-.35,1.18,0],[-.48,1.03,0]],.65);
 s.box(dark,-.42,.35,.015,.16,.22,.6,0,0,-.08);
 s.box(edge,.43,.49,-.06,.12,.2,.5,0,0,.04);
 // Broken surface plates and six slightly uneven capstones form a real deep block.
 for(let row=0;row<2;row++)for(let i=0;i<3;i++) {
  const x=-.29+i*.29,z=-.16+row*.3,y=1.15+((i+row)%2)*.025;
  s.box(dark,x,y,z,.277,.065,.283,0,0,(i-1)*.02);
  s.box(edge,x,y+.027,z,.258,.027,.26,0,0,(i-1)*.02);
 }
 for(const [x,y,r] of [[-.39,.91,.055],[.35,.89,.04],[-.3,.29,.045],[.37,.39,.06],[-.32,1.06,.05],[.1,1.12,.045]]) {
  ball(s,edge,[x,y,.328],[r,r*.7,.02]);
 }
 const cracks:P[][]=[[[0,1.18,.334],[-.06,1.08,.334],[-.015,.99,.334],[-.055,.91,.334]],
  [[-.41,1.08,.334],[-.32,1.02,.334],[-.34,.93,.334],[-.29,.86,.334]],
  [[.34,1.1,.334],[.28,1.02,.334],[.315,.94,.334],[.26,.875,.334]],
  [[-.38,.54,.334],[-.31,.49,.334],[-.37,.4,.334]],[[.35,.65,.334],[.4,.57,.334],[.36,.48,.334]]];
 for(const points of cracks)for(let i=0;i<points.length-1;i++)line(s,dark,points[i],points[i+1],.013);
 // Purple paint stays thin and close to the stone, including drips beyond its base.
 for(const a of [-1,1])for(let i=0;i<5;i++) {
  const x=a*(.29+i*.022),y=.94-i*.13;
  const pts:P[]=[[x,y,.34],[x-a*.06,y-.08,.34],[x+a*.025,y-.15,.34],[x-a*.04,y-.23,.34]];
  for(let j=0;j<pts.length-1;j++)line(s,i%2?'#9523b4':purple,pts[j],pts[j+1],.012+(i%2)*.005);
  if(i>2){line(s,purple,pts[3],[x-a*.025,.08+(i%2)*.04,.34],.013);ball(s,purple,[x-a*.025,.065+(i%2)*.04,.34],[.017,.03,.012]);}
 }
 // Actual raised paint strokes retain the source X-eyes and wide dripping grin.
 for(const a of [-1,1]) {
  line(s,lime,[a*.19-.075,.96,.345],[a*.19+.075,.805,.345],.023);
  line(s,lime,[a*.19+.075,.96,.345],[a*.19-.075,.805,.345],.023);
  line(s,'#a5d91b',[a*.19-.07,.957,.361],[a*.19+.07,.81,.361],.007);
  line(s,lime,[a*.19,.813,.345],[a*.19-.01,.75,.345],.012);
 }
 ball(s,'#14191d',[0,.56,.332],[.325,.15,.011]);
 s.tube(lime,[[-.325,.66,.351],[-.17,.603,.351],[.02,.58,.351],[.21,.605,.351],[.325,.68,.351]],.018,28);
 s.tube(lime,[[-.31,.625,.35],[-.18,.46,.35],[0,.428,.35],[.2,.485,.35],[.32,.655,.35]],.019,30);
 for(const [x,y,end] of [[-.2,.604,.51],[-.08,.584,.545],[.14,.59,.54],[.03,.43,.2],[.22,.49,.32]]) {
  line(s,lime,[x,y,.354],[x+.005,end,.354],.013);
  ball(s,lime,[x+.005,end,.354],[.014,.025,.009]);
 }
 for(let i=0;i<12;i++) {
  const x=(i%2?1:-1)*(.25+(i%3)*.045),y=.3+(i%5)*.125;
  ball(s,purple,[x,y,.35],[.008,.012,.005]);
 }
 return s.finish();
}

/** #75: a deep violet stone well-mouth, open rim, inset eyes and inward fangs. */
function pitmaw() {
 const s = new Sculpt(), tilt=Math.PI*.23;
 const point=(x:number,y:number,z:number):P=>[x,.47+y*Math.cos(tilt)-z*Math.sin(tilt),y*Math.sin(tilt)+z*Math.cos(tilt)];
 // A closed bowl with a recessed floor, turned up toward the viewer like the source.
 s.lathe('#29203d',[[0,-.21],[.32,-.21],[.365,-.11],[.36,.07],[.315,.07],[.29,-.045],[.24,-.12],[0,-.13]],0,.47,0,tilt);
 s.lathe('#3d2d58',[[.302,-.035],[.31,-.04],[.326,-.02],[.329,0],[.315,.012],[.302,-.035]],0,.47,0,tilt);
 for(let i=0;i<16;i++) {
  const a=i*Math.PI/8,p=point(Math.cos(a)*.42,.07,Math.sin(a)*.42);
  s.box('#373544',...p,.205,.17,.155,tilt,-a,0);
  const cap=point(Math.cos(a)*.42,.156,Math.sin(a)*.42);
  s.box(i%3?'#6a6b7e':'#777786',...cap,.185,.025,.136,tilt,-a,0);
  if(i%3===0) {
   const chip=point(Math.cos(a)*.47,.172,Math.sin(a)*.47);
   ball(s,'#92909a',chip,[.022,.012,.022]);
  }
 }
 const fang=(a:number,r:number,length:number)=>{
  const base=new THREE.Vector3(...point(Math.cos(a)*r,-.01,Math.sin(a)*r));
  const tip=new THREE.Vector3(...point(Math.cos(a)*(r-.085),length,Math.sin(a)*(r-.085)));
  const d=tip.clone().sub(base),mid=base.clone().add(tip).multiplyScalar(.5);
  const e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()));
  s.cone('#c5b99a',mid.x,mid.y,mid.z,.045,d.length(),e.x,e.y,e.z);
 };
 for(const a of [.1,.85,1.55,2.25,3.05,3.85,5.5])fang(a,.29,.1+(Math.sin(a)*.5+.5)*.045);
 // Set the eyes deeper across the bowl and above its floor, clear of the front rim.
 for(const x of [-.13,.13]) {
  ball(s,'#171326',point(x,-.015,-.06),[.068,.057,.057]);
  ball(s,'#cb7c0b',point(x,.015,-.055),[.047,.044,.044]);
  ball(s,'#ffd048',point(x,.042,-.045),[.028,.029,.03]);
  ball(s,'#fff2bd',point(x-.005,.06,-.037),[.011,.015,.012]);
 }
 return s.finish();
}

export const SCULPTS_H:Record<string,()=>THREE.BufferGeometry>={
 mon_pricecrow:pricecrow,mon_grafface:grafface,mon_pitmaw:pitmaw,...SCULPTS_H_OBJECTS,
};
