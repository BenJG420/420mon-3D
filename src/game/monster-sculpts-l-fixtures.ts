import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];

/** #100: the source's red cast-iron hydrant, with capped outlets and brass eyes. */
function hydrant() {
  const s = new Sculpt({ detail: "high" });
  const red = '#9f2520', edge = '#651b1d', lit = '#c14831', iron = '#6c322b';
  // A turned, thick-walled casting joins the two feet, barrel and domed head.
  s.lathe(red, [[0,.12],[.26,.12],[.292,.17],[.295,.29],[.28,.99],[.248,1.095],[0,1.095]],0,0,0);
  s.lathe(edge, [[0,.135],[.307,.135],[.326,.16],[.329,.216],[.309,.241],[.286,.243],[0,.243]],0,0,0);
  s.lathe(lit, [[.29,.223],[.318,.223],[.324,.237],[.305,.253],[.29,.247],[.29,.223]],0,0,0);
  s.lathe('#8b211f', [[0,1.005],[.268,1.005],[.31,1.048],[.325,1.103],[.315,1.148],[.268,1.173],[0,1.173]],0,0,0);
  s.lathe('#c04931', [[.268,1.155],[.307,1.145],[.325,1.15],[.327,1.177],[.309,1.194],[.267,1.188],[.268,1.155]],0,0,0);
  s.lathe(red, [[0,1.18],[.25,1.18],[.27,1.224],[.249,1.329],[.192,1.411],[.105,1.456],[0,1.458]],0,0,0);
  // Six actual flat wrench faces sit on the cap; the crown above remains rounded.
  for (let i=0;i<6;i++) {
    const angle=i*Math.PI/3, r=.245;
    s.box(i%2 ? '#b43b2b' : '#90231f',Math.sin(angle)*r,1.274,Math.cos(angle)*r,.244,.192,.018,0,angle);
    s.rod('#ce5940',[Math.sin(angle)*r,1.354,Math.cos(angle)*r],[Math.sin(angle+.12)*r,1.354,Math.cos(angle+.12)*r],.006);
  }
  s.lathe('#b43d29', [[0,1.432],[.103,1.432],[.123,1.448],[.11,1.473],[.066,1.486],[0,1.486]],0,0,0);
  // Symmetric horizontal side bosses include collars, flange bolts and capped bores.
  for (const side of [-1,1]) {
    const rz=-side*Math.PI/2;
    s.rod(iron,[side*.235,.755,0],[side*.454,.755,0],.145);
    s.lathe('#78201e', [[0,-.035],[.14,-.035],[.177,-.02],[.185,.012],[.177,.065],[.142,.081],[0,.081]],side*.375,.755,0,0,0,rz);
    s.lathe(lit, [[.141,.035],[.17,.035],[.183,.047],[.183,.071],[.161,.086],[.141,.078],[.141,.035]],side*.375,.755,0,0,0,rz);
    s.lathe(red, [[0,0],[.135,0],[.146,.018],[.144,.075],[.114,.102],[0,.104]],side*.466,.755,0,0,0,rz);
    s.rod('#74221f',[side*.564,.755,0],[side*.603,.755,0],.069);
    for (let i=0;i<6;i++) {
      const a=i*Math.PI/3, y=.755+Math.sin(a)*.157, z=Math.cos(a)*.157;
      s.rod('#b5593d',[side*.43,y,z],[side*.458,y,z],.018);
    }
    // Original compact flat feet emerge from the casting, not new humanoid legs.
    s.roundedBox('#6f2b25',side*.214,.106,.045,.17,.145,.276,.018);
    s.box('#b34831',side*.214,.117,.188,.13,.053,.022);
  }
  // The original has two small brass-ring eyes, set directly into the red barrel.
  for (const side of [-1,1]) {
    const x=side*.146, z=.25;
    s.rod('#4e291d',[x,.642,z],[x,.642,z+.033],.078);
    s.torus('#986b20',x,.642,z+.046,.061,.014);
    s.torus('#d8a32c',x,.646,z+.054,.052,.009);
    s.rod('#382415',[x,.642,z+.034],[x,.642,z+.057],.035);
    s.box('#f4d46e',x-.021,.674,z+.065,.017,.009,.006,0,0,-.3);
  }
  // The blue leak under the cap and its falling drop retain the first-pose motif.
  s.ellipsoid('#1676a7',0,1.024,.267,.074,.079,.027);
  s.ellipsoid('#53cde8',-.014,1.03,.289,.038,.047,.012);
  s.ellipsoid('#b6f4fa',-.023,1.048,.3,.016,.023,.006);
  s.cone('#268cbe',0,.921,.293,.031,.071);
  s.ellipsoid('#31a5d7',0,.886,.295,.033,.032,.022);
  // Sparse raised rust scars, paint chips and a rear inspection hatch.
  s.roundedBox('#84241f',0,.606,-.278,.27,.34,.029,.015);
  for (const x of [-.106,.106]) for (const y of [.467,.744]) s.rod('#bb6146',[x,y,-.285],[x,y,-.302],.009);
  for (let i=0;i<17;i++) {
    const a=.21+i*2.39996, y=.29+(i%6)*.111, radius=.286;
    const p:P=[Math.cos(a)*radius,y,Math.sin(a)*radius];
    const q:P=[Math.cos(a+.07)*radius,y+.017+(i%3)*.008,Math.sin(a+.07)*radius];
    s.rod(i%3 ? '#b35835' : '#663321',p,q,.005+(i%2)*.002);
  }
  const geometry=s.finish();
  geometry.userData.sculptFeatures=['cast-iron-barrel','hex-cap','two-bolted-side-outlets','brass-ring-eyes','blue-leak','paint-wear','rear-inspection-hatch'];
  return geometry;
}

/** #101: an amber grow lamp, threaded metal neck, open hanging links and tiny claws. */
function growbulb() {
  const s = new Sculpt({ detail: "high" });
  // A continuous pear-shaped envelope preserves the source's rounded flame silhouette.
  s.lathe('#ba5b0b', [[0,.225],[.055,.244],[.139,.313],[.217,.415],[.278,.549],[.298,.681],[.282,.812],[.245,.941],[.192,1.057],[.139,1.151],[.127,1.21],[0,1.214]],0,0,0);
  s.lathe('#eb8a0b', [[0,.251],[.072,.28],[.159,.372],[.222,.489],[.26,.618],[.262,.747],[.231,.889],[.177,1.016],[.126,1.128],[.114,1.199],[0,1.2]],0,0,.038);
  // Bulb/core colors are fully rounded geometry. The localized glow mask below lights
  // only the warm glass; metallic socket, hanging chain and feet remain non-emissive.
  s.ellipsoid('#ffb71c',0,.675,.224,.216,.333,.118);
  s.ellipsoid('#ffdf38',-.008,.668,.306,.156,.242,.066);
  s.ellipsoid('#fff4a3',-.014,.672,.352,.091,.145,.027);
  s.ellipsoid('#fff9bd',-.031,.715,.373,.039,.064,.009);
  // Two curved reflected highlights follow the envelope, leaving its orange rim visible.
  s.tube('#ffc954',[[-.086,1.094,.137],[-.153,.99,.183],[-.207,.855,.207],[-.229,.721,.214]],.009,22);
  s.tube('#f4ad2b',[[.157,.426,.187],[.216,.558,.208],[.239,.684,.205],[.226,.797,.198]],.006,18);
  s.lathe('#61462c', [[0,1.164],[.128,1.164],[.157,1.179],[.166,1.211],[.162,1.274],[.135,1.29],[0,1.29]],0,0,0);
  s.lathe('#a36e37', [[0,1.24],[.137,1.24],[.157,1.261],[.152,1.313],[.128,1.335],[0,1.335]],0,0,0);
  // Four separate screw-thread ridges are rounded metal, not painted horizontal lines.
  for (let i=0;i<4;i++) s.torus(i%2 ? '#b88346' : '#806041',0,1.203+i*.032,0,.154-i*.004,.011,Math.PI/2);
  s.lathe('#d28d3e', [[0,1.317],[.109,1.317],[.132,1.331],[.125,1.348],[.079,1.36],[0,1.36]],0,0,0);
  s.rod('#51483f',[0,1.349,0],[0,1.405,0],.027);
  for (let i=0;i<3;i++) s.torus(i%2 ? '#8d7d72' : '#665a53',0,1.405+i*.085,0,.05,.013,0,i%2*Math.PI/2);
  s.rod('#a29a8b',[-.012,1.573,.041],[-.012,1.603,.041],.005);
  // Four short claw toes match the two small orange feet in the source artwork.
  for (const side of [-1,1]) {
    s.roundedBox('#9d510d',side*.142,.225,.05,.085,.128,.114,.018,0,0,-side*.2);
    for (const toe of [-1,1]) {
      const x=side*.142+toe*.032;
      s.rod('#c6760c',[side*.142,.205,.07],[x,.157,.133],.019);
      s.cone('#e69916',x,.143,.147,.022,.062,.45,0,side*.18);
    }
  }
  const geometry=s.finish(), colors=geometry.getAttribute('color');
  const glowWeight=new Float32Array(colors.count);
  for(let i=0;i<colors.count;i++) {
    const r=colors.getX(i),g=colors.getY(i),b=colors.getZ(i);
    // Vertex colors are linear. This excludes all brown metal/orange claw colors.
    glowWeight[i]=r>.7 && g>.22 && b<.7 ? Math.min(1,(g-.22)/.65) : 0;
  }
  geometry.setAttribute('glowWeight',new THREE.BufferAttribute(glowWeight,1));
  geometry.userData.glowSurface=true;
  geometry.userData.sculptFeatures=['pear-shaped-amber-envelope','rounded-luminous-core','threaded-metal-socket','three-open-hanging-links','four-claw-toes'];
  return geometry;
}

/** #102: blue Ethernet cable in a genuine open helix with detailed RJ45 heads. */
function patchcoil() {
  const s = new Sculpt({ detail: "high" });
  const turns=3.25, start=Math.PI/2, main:P[]=[], seam:P[]=[];
  for (let i=0;i<=192;i++) {
    const t=i/192, a=start+t*Math.PI*2*turns, radius=.405+.024*Math.sin(t*Math.PI);
    main.push([Math.cos(a)*radius,.235+t*.86,Math.sin(a)*radius*.86]);
    seam.push([Math.cos(a)*(radius+.047),.246+t*.86,Math.sin(a)*(radius*.86+.047)]);
  }
  // A single continuous cable has open air between its turns and a visible hollow centre.
  s.tube('#2056a8',main,.057,192);
  s.tube('#538bdf',seam,.005,128);
  const tilt=-.66, c=Math.cos(tilt), n=Math.sin(tilt);
  const plug=(x:number,y:number,z:number):P=>[-.323+x*c-y*n,.44+x*n+y*c,.489+z];
  const entering=plug(0,.238,0);
  s.tube('#245aa9',[main[0],[.036,.304,.434],[-.06,.53,.465],entering],.054,24);
  // Tapered boot, ribbed strain relief and bevelled silver housing.
  s.roundedBox('#2d64ad',...plug(0,.185,0),.214,.135,.17,.025,0,0,tilt);
  s.roundedBox('#a7b2c0',...plug(0,-.006,0),.225,.328,.176,.018,0,0,tilt);
  s.roundedBox('#e1e4e7',...plug(0,-.034,.085),.191,.271,.027,.009,0,0,tilt);
  for(let i=0;i<4;i++) s.box(i%2 ? '#326ec0' : '#153d80',...plug(0,.151+i*.021,.09),.185,.01,.012,0,0,tilt);
  // A recessed contact mouth contains eight separate gold/copper contact fingers.
  s.box('#34455d',...plug(0,-.115,.105),.154,.122,.017,0,0,tilt);
  for(let i=0;i<8;i++) {
    const x=-.063+i*.018;
    s.box(i%2 ? '#cfb678' : '#ead59c',...plug(x,-.133,.119),.008,.073,.008,0,0,tilt);
  }
  s.box('#d7e4ee',...plug(0,-.182,.106),.18,.016,.026,0,0,tilt);
  for (const side of [-1,1]) {
    s.rod('#526a8c',plug(side*.1,-.154,.105),plug(side*.1,.112,.105),.008);
    const eye=plug(side*.048,.076,.113);
    s.rod('#253930',[eye[0],eye[1],eye[2]-.01],[eye[0],eye[1],eye[2]+.006],.034);
    s.ellipsoid('#8cda2f',eye[0],eye[1],eye[2]+.016,.025,.026,.012);
    s.box('#e9ffbc',eye[0]-.006,eye[1]+.009,eye[2]+.029,.01,.01,.004);
  }
  // The sprung latch lies on the back of the front plug, with an open heel beneath.
  s.box('#8395ad',...plug(0,-.013,-.105),.107,.17,.021,.18,0,tilt);
  s.box('#c8d5df',...plug(0,.077,-.114),.104,.025,.036,0,0,tilt);
  // A second descending cable end at the back/right carries the smaller silver plug.
  const last=main[main.length-1];
  s.tube('#224e95',[last,[.468,.904,-.085],[.537,.594,-.129],[.566,.354,-.027]],.043,24);
  s.roundedBox('#9babc0',.566,.293,-.01,.123,.173,.12,.013);
  s.box('#dce4e8',.566,.24,.057,.096,.051,.018);
  s.box('#375986',.566,.386,-.009,.104,.044,.105);
  for (let i=0;i<4;i++) s.box('#bca674',.532+i*.022,.244,.069,.009,.031,.006);
  // The source has small metal support feet, partly tucked under the lowest turn.
  for(const [x,z] of [[-.23,-.17],[.22,-.14],[.05,.28]]) {
    s.roundedBox('#889bb1',x,.135,z,.143,.071,.136,.012);
    s.box('#c5d0dd',x,.127,z+.066,.109,.023,.011);
  }
  const geometry=s.finish();
  geometry.userData.sculptFeatures=['continuous-open-blue-helix','raised-insulation-seam','ribbed-strain-relief','front-RJ45-eight-contacts','two-green-connector-eyes','rear-RJ45','sprung-connector-latch'];
  return geometry;
}

export const SCULPTS_L_FIXTURES: Record<string, () => THREE.BufferGeometry> = {
  mon_hydrant: hydrant,
  mon_growbulb: growbulb,
  mon_patchcoil: patchcoil,
};
