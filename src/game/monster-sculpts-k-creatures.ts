import type * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];

/** #94: a substantial white tape roll, with a real hollow cardboard core. */
function taperoll() {
  const s = new Sculpt(), paper = '#e1dedf', light = '#f4f0ee', edge = '#bdb5c7';
  // The closed annular profile leaves the centre open from top to bottom.
  s.lathe(paper, [[.267,.36],[.408,.36],[.449,.39],[.469,.45],[.469,1.085],[.46,1.145],[.429,1.178],[.276,1.178],[.26,1.151],[.26,.39],[.267,.36]], 0,0,0);
  s.lathe('#af8b60', [[.255,.375],[.273,.375],[.273,1.157],[.26,1.172],[.233,1.145],[.233,.405],[.255,.375]], 0,0,0);
  s.lathe('#866040', [[.234,.412],[.238,.412],[.238,1.125],[.234,1.125],[.234,.412]], 0,0,0);
  // Fine concentric winding rings follow the upper face, without filling its hole.
  for (let i=0;i<8;i++) {
    const r=.289+i*.02, y=1.178-(r>.419 ? (r-.419)*.3 : 0);
    s.lathe(i%3===0 ? '#c9c1ca' : '#ded8df', [[r,y-.001],[r+.003,y],[r+.003,y+.003],[r,y+.003],[r,y-.001]],0,0,0);
  }
  s.lathe(light, [[.272,1.16],[.28,1.174],[.29,1.178],[.282,1.184],[.272,1.177],[.272,1.16]],0,0,0);
  // Slightly staggered winding edges are narrow, rounded paper ridges.
  for (const [y,r] of [[.45,.47],[.655,.472],[.858,.471],[1.055,.468]]) {
    s.lathe(edge, [[r-.006,y-.014],[r+.001,y-.008],[r+.003,y],[r,y+.008],[r-.007,y+.015],[r-.006,y-.014]],0,0,0);
    s.lathe(light, [[r-.004,y+.009],[r+.001,y+.014],[r-.001,y+.022],[r-.006,y+.024],[r-.004,y+.009]],0,0,0);
  }
  // The inside has a subtle glued seam and fibres at its exposed upper lip.
  s.rod('#6c4d35',[.143,.455,.184],[.143,1.117,.184],.006);
  for(let i=0;i<13;i++) {
    const a=i*2*Math.PI/13, r=.257;
    s.rod(i%2 ? '#c7a67d' : '#896744',[Math.sin(a)*r,1.164,Math.cos(a)*r],[Math.sin(a+.023)*(r+.011),1.166,Math.cos(a+.023)*(r+.011)],.004);
  }
  for(const side of [-1,1]) {
    const x=side*.18, z=Math.sqrt(.469*.469-x*x);
    s.ellipsoid('#bcb5c2',x,.705,z+.003,.087,.094,.019);
    s.ellipsoid('#1c1920',x,.711,z+.022,.076,.082,.024);
    s.ellipsoid('#09090d',x,.708,z+.039,.059,.067,.012);
    s.ellipsoid('#fff9ee',x-.021,.744,z+.05,.025,.022,.007);
    s.ellipsoid('#dedce4',x+.029,.677,z+.048,.012,.014,.006);
    s.ellipsoid('#3a273e',side*.24,.337,-.035,.097,.054,.139);
    s.ellipsoid('#614460',side*.24,.352,.025,.07,.025,.1);
  }
  // Short overlapping sections form a continuous, curved paper ribbon in space.
  // It peels off the front, descends leftwards and curls upward at its loose tip.
  const path: P[]=[];
  const anchors:P[]=[[-.154,.502,.457],[-.202,.418,.537],[-.247,.302,.607],[-.304,.205,.667],[-.376,.17,.702],[-.439,.197,.718],[-.482,.259,.711]];
  for(let i=0;i<anchors.length-1;i++) {
    const p=anchors[Math.max(0,i-1)],a=anchors[i],b=anchors[i+1],q=anchors[Math.min(anchors.length-1,i+2)];
    for(let j=0;j<6;j++) {
      const t=j/6;
      path.push(a.map((v,k)=>.5*(2*v+(-p[k]+b[k])*t+(2*p[k]-5*v+4*b[k]-q[k])*t*t+(-p[k]+3*v-3*b[k]+q[k])*t*t*t)) as P);
    }
  }
  path.push(anchors[anchors.length-1]);
  for(let i=0;i<path.length-1;i++) {
    const a=path[i],b=path[i+1],dy=b[1]-a[1],dz=b[2]-a[2],dx=b[0]-a[0];
    // A strip spans sideways while its local length follows the peel trajectory.
    s.box(i>26 ? '#eee9ee' : light,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,.21+Math.abs(dx),Math.hypot(dy,dz)+.009,.018,Math.atan2(dz,dy));
  }
  s.tube('#c6bdcf',path.map(([x,y,z]):P=>[x-.105,y,z-.003]),.006,38);
  s.tube('#fff9f4',path.map(([x,y,z]):P=>[x+.103,y,z+.004]),.004,38);
  // Pitch this figure toward the shared low camera so the original open core
  // remains visible; refit the rotated mesh to the same cache bounds and floor.
  const geometry=s.finish().rotateX(.42);
  geometry.computeBoundingBox();
  const b=geometry.boundingBox!, scale=1.6/Math.max(b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z);
  geometry.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);
  geometry.scale(scale,scale,scale); geometry.translate(0,-.8,0);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

/** #95: chipped enamel road sign, its red band and two simple black eyes intact. */
function deadend() {
  const s=new Sculpt(), enamel='#e3e0d6', steel='#55525a';
  const outline:P[]=[[-.558,1.445,0],[.558,1.445,0],[.579,1.423,0],[.579,.797,0],[.56,.779,0],[-.56,.779,0],[-.579,.8,0],[-.579,1.423,0]];
  s.panel('#56515a',outline,.089);
  const face=outline.map(([x,y]):P=>[x*.976,1.111+(y-1.111)*.954,.052]);
  s.panel(enamel,face,.022);
  s.tube('#93888a',[...outline,outline[0]].map(([x,y]):P=>[x,y,.047]),.012,40);
  s.box('#bd252e',0,1.244,.069,1.119,.197,.012);
  s.box('#d23a39',-.008,1.332,.077,1.101,.013,.006);
  s.box('#8f2129',0,1.15,.076,1.112,.009,.005);
  // Small irregular chips expose dull metal at the perimeter; no pixel grid.
  const chips:[number,number,number,number][]=[[-.535,1.408,.045,.045],[-.297,1.411,.036,.028],[-.058,1.42,.043,.021],[.338,1.402,.058,.043],[.532,1.4,.037,.037],[-.543,1.126,.027,.083],[-.529,.933,.035,.039],[-.503,.828,.052,.045],[-.275,.809,.043,.037],[-.13,.817,.032,.03],[.202,.811,.05,.035],[.375,.831,.042,.052],[.535,.836,.037,.07],[.548,1.005,.027,.032]];
  for(let i=0;i<chips.length;i++) {
    const [x,y,w,h]=chips[i],z=.083;
    s.panel(i%3===0 ? '#817467' : '#a79c88',[[x-w,y+h*.3,z],[x-w*.45,y+h,z],[x+w*.12,y+h*.43,z],[x+w,y+h*.67,z],[x+w*.6,y-h*.4,z],[x+w*.1,y-h,z],[x-w*.55,y-h*.3,z]],.003);
    if(i%3===0) s.rod('#c6b9a0',[x-w*.3,y+h*.3,z+.003],[x+w*.3,y-h*.45,z+.003],.004);
  }
  // Broad areas remain white; fine wear in the red paint follows its flat plane.
  for(const [x,y] of [[-.4,1.225],[-.08,1.193],[.265,1.281],[.503,1.206]]) {
    s.rod('#922e31',[x-.008,y+.024,.084],[x-.012,y-.019,.084],.004);
    s.rod('#d74e45',[x+.007,y+.017,.085],[x+.004,y-.012,.085],.003);
  }
  for(const x of [-.216,.216]) {
    s.box('#aaa79f',x,1.009,.077,.132,.168,.013);
    for(const y of [.925,1.093]) s.ellipsoid('#aaa79f',x,y,.077,.066,.043,.013);
    s.box('#13131a',x,1.011,.088,.102,.152,.012);
    for(const y of [.935,1.087]) s.ellipsoid('#13131a',x,y,.088,.051,.034,.012);
    s.rod('#35323a',[x-.038,.953,.101],[x-.038,1.069,.101],.003);
  }
  // A rear support and fasteners make the otherwise quiet reverse plausible.
  s.box('#65616a',0,1.09,-.071,.099,.624,.05);
  s.box('#77707a',0,.888,-.065,1.01,.052,.03);
  s.box('#77707a',0,1.351,-.065,1.01,.052,.03);
  for(const x of [-.489,.489]) for(const y of [.888,1.351]) {
    s.ellipsoid('#38383f',x,y,-.09,.018,.018,.009);
    s.rod('#aaa0a4',[x-.008,y,-.099],[x+.008,y,-.099],.0025);
  }
  s.box('#36353e',0,.435,-.019,.128,.723,.119);
  s.box(steel,-.033,.438,.046,.037,.69,.018);
  s.box('#25252d',.057,.435,.042,.013,.702,.021);
  for(let i=0;i<8;i++) {
    const y=.136+i*.079,x=i%2 ? -.015 : .022;
    s.rod(i%3 ? '#69636b' : '#2a2931',[x,y,.059],[x-.007,y+.031,.059],.006);
  }
  s.box('#312b37',0,.079,-.015,.238,.038,.191);
  s.box('#6c536c',-.008,.098,.065,.224,.012,.017);
  s.box('#443e49',0,.129,-.015,.158,.083,.143);
  return s.finish();
}

/** #96: magenta stage lamp with a recessed gold lens, ribbed neck and tripod. */
function spotlamp() {
  const s=new Sculpt(), pink='#94415f', dark='#542940', gold='#ac7d2f', cy=1.055;
  const axial=(c:string,p:[number,number][])=>s.lathe(c,p,0,cy,0,Math.PI/2);
  // The cast shell wraps around a real lens chamber; the reverse is a rounded cap.
  axial(pink,[[0,-.245],[.24,-.245],[.325,-.22],[.38,-.158],[.411,-.066],[.414,.034],[.397,.112],[.359,.153],[.309,.153],[.288,.114],[.284,-.094],[0,-.094]]);
  axial(dark,[[.337,-.197],[.358,-.174],[.365,-.145],[.349,-.145],[.333,-.185],[.337,-.197]]);
  axial('#bd6a80',[[.367,.09],[.392,.109],[.385,.14],[.359,.163],[.309,.163],[.299,.147],[.313,.135],[.351,.135],[.367,.09]]);
  axial('#6d343d',[[.274,.111],[.295,.108],[.314,.143],[.311,.174],[.286,.181],[.274,.158],[.274,.111]]);
  axial('#bd862d',[[.271,.126],[.284,.142],[.289,.172],[.277,.194],[.26,.194],[.255,.18],[.267,.171],[.271,.126]]);
  axial('#f2bd47',[[.252,.166],[.267,.178],[.271,.192],[.263,.207],[.248,.205],[.245,.192],[.252,.166]]);
  // A convex lens sits behind the stepped bezel. Its highlights follow the glass.
  axial('#f4bd2c',[[0,.215],[.08,.212],[.16,.202],[.213,.185],[.249,.167],[.249,.14],[0,.14]]);
  s.ellipsoid('#ffdb50',-.018,cy+.016,.211,.163,.172,.011);
  s.panel('#fff194',[[-.111,cy+.081,.224],[-.02,cy+.166,.224],[.084,cy+.066,.224],[-.004,cy-.023,.224]],.003);
  s.ellipsoid('#ffe76a',-.109,cy+.115,.216,.036,.044,.006);
  s.ellipsoid('#f8d451',.105,cy-.1,.205,.075,.058,.006);
  // Six brass screws sit outside the lens and have tiny dark screwdriver slots.
  for(let i=0;i<6;i++) {
    const a=Math.PI/6+i*Math.PI/3,x=Math.sin(a)*.346,y=cy+Math.cos(a)*.346;
    s.ellipsoid('#784b3b',x,y,.158,.022,.022,.009);
    s.ellipsoid('#d0a25b',x,y,.167,.015,.016,.006);
    s.rod('#6e4938',[x-.007,y-.004,.174],[x+.007,y+.004,.174],.0025);
  }
  for(const side of [-1,1]) {
    // Housing seams and rear cooling slits remain secondary to the round front.
    s.tube('#6d3049',[[side*.284,cy+.272,-.188],[side*.352,cy+.181,-.176],[side*.391,cy+.055,-.152]],.009,14);
    for(let i=0;i<3;i++) s.rod('#54283e',[side*(.18+i*.046),cy+.169,-.222],[side*(.19+i*.046),cy+.075,-.232],.009);
    s.rod('#754e24',[side*.365,cy-.017,-.011],[side*.478,cy-.017,-.011],.058);
    s.ellipsoid('#d0a34b',side*.464,cy-.017,-.011,.028,.053,.054);
    s.ellipsoid('#8f632c',side*.49,cy-.017,-.011,.017,.033,.035);
    // The yoke curves around the back and descends to the neck pivot.
    s.tube('#745128',[[side*.456,cy-.017,-.049],[side*.461,.76,-.095],[side*.374,.61,-.13],[side*.19,.562,-.125]],.036,20);
    s.tube('#c49741',[[side*.459,cy-.014,-.013],[side*.458,.77,-.063],[side*.367,.635,-.095],[side*.19,.587,-.09]],.015,20);
  }
  // Brass mounting tab at the top is pierced by a dark recess.
  s.panel('#aa7a34',[[-.099,1.46,-.02],[-.079,1.502,-.02],[.063,1.502,-.02],[.101,1.464,-.02],[.09,1.429,-.02],[-.095,1.429,-.02]],.13);
  s.box('#d1a358',-.013,1.488,.055,.139,.014,.018);
  s.ellipsoid('#604729',-.018,1.461,.05,.032,.027,.012);
  s.ellipsoid('#d4a75a',-.018,1.461,.065,.013,.012,.006);
  // Accordion-like neck: smooth, rounded ridges rather than square stacked blocks.
  s.lathe(dark,[[0,.311],[.117,.311],[.128,.34],[.127,.659],[.109,.685],[0,.685]],0,0,-.072);
  for(let i=0;i<6;i++) {
    const y=.351+i*.047;
    s.lathe(i%2 ? '#a34d70' : pink,[[.119,y-.016],[.137,y-.009],[.145,y+.003],[.14,y+.016],[.122,y+.025],[.119,y-.016]],0,0,-.072);
    s.lathe('#c16b86',[[.136,y+.005],[.143,y+.007],[.14,y+.013],[.135,y+.015],[.136,y+.005]],0,0,-.072);
  }
  s.lathe(gold,[[0,.278],[.132,.278],[.15,.292],[.15,.326],[.132,.344],[0,.344]],0,0,-.072);
  // Three separately planted feet radiate from the hub; their pads have flat bases.
  for(const a of [0,2*Math.PI/3,4*Math.PI/3]) {
    const x=Math.sin(a)*.438,z=-.072+Math.cos(a)*.438;
    const start:P=[Math.sin(a)*.106,.3,-.072+Math.cos(a)*.106],end:P=[x,.073,z];
    s.rod('#714a2e',start,end,.046);
    s.rod('#c1943d',[start[0],start[1]+.025,start[2]],[x,.099,z],.024);
    s.lathe('#5b3940',[[0,.025],[.062,.025],[.075,.04],[.072,.071],[.055,.085],[0,.085]],x,0,z);
    s.lathe('#b78a3a',[[.06,.069],[.073,.068],[.073,.082],[.057,.09],[.06,.069]],x,0,z);
  }
  // The source's sloping front plate and small purple inset sit above the front leg.
  const plate=(c:string,w:number,ya:number,yb:number,z:number,depth:number)=>s.panel(c,[[-w,ya,z],[w,ya,z],[w*.68,yb,z],[-w*.68,yb,z]],depth);
  plate('#c99a48',.121,.068,.292,.245,.055);
  plate('#81405b',.097,.087,.275,.278,.014);
  s.panel('#d9ac68',[[-.045,.159,.29],[.004,.205,.29],[.05,.167,.29],[.003,.124,.29]],.007);
  s.panel('#bc5878',[[-.026,.158,.299],[.002,.183,.299],[.03,.162,.299],[.002,.139,.299]],.004);
  return s.finish();
}

export const SCULPTS_K_CREATURES: Record<string, () => THREE.BufferGeometry> = {
  mon_taperoll: taperoll,
  mon_deadend: deadend,
  mon_spotlamp: spotlamp,
};
