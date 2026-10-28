import type * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];

/** #97: the source's scarred welding shield, with its recessed amber viewing slit. */
function weldmask() {
  const s = new Sculpt({ detail: "high" });
  const steel = "#58616b", edge = "#8d9398", recess = "#242c35";
  // Rounded pressed-steel shell: the crown and lower shield have actual depth.
  s.roundedBox(steel, 0,.785,0,.79,.94,.54,.145);
  s.dome("#646c75",0,1.16,0,.405,.214,.281);
  s.roundedBox("#414952",0,.6,-.251,.63,.57,.048,.023);
  s.box("#313b45",0,.805,-.278,.52,.035,.014);
  for (const x of [-.264,.264]) s.rod("#7a838b",[x,.399,-.273],[x,.948,-.273],.009);
  // A folded front lip and the metal visor frame enclose a deep, dark recess.
  s.panel("#656e77",[[-.343,.361,.269],[-.389,.468,.269],[-.362,.623,.269],[.362,.623,.269],[.389,.468,.269],[.343,.361,.269]],.028);
  s.roundedBox("#313a43",0,.829,.295,.766,.323,.117,.035);
  s.roundedBox(edge,0,.839,.353,.719,.275,.058,.026);
  s.roundedBox(recess,0,.839,.388,.61,.185,.019,.012);
  s.box("#61340e",0,.839,.400,.565,.145,.009);
  s.box("#9d4808",0,.831,.407,.531,.106,.007);
  // Uneven amber weld-light belongs behind the glass, not in front of the frame.
  for (const [x,y,r,c] of [
    [-.204,.823,.038,"#c25c06"],[-.117,.836,.043,"#ee8b08"],[-.025,.813,.045,"#ffb20f"],
    [.068,.837,.042,"#ffca20"],[.151,.826,.041,"#ee9a0b"],[.219,.842,.028,"#ffce35"],
  ] as [number,number,number,string][]) s.ellipsoid(c,x,y,.414,r,r*.63,.006);
  s.box("#edba56",-.012,.891,.416,.508,.006,.004);
  s.box("#422e1b",0,.771,.412,.528,.009,.005);
  s.box("#b5a88e",-.265,.842,.417,.008,.112,.004);
  // The two temple hinges have metal brackets and recessed axle sockets.
  for (const side of [-1,1]) {
    s.roundedBox("#343e47",side*.432,.86,-.015,.123,.223,.215,.022);
    s.roundedBox("#7a828b",side*.488,.87,.008,.041,.15,.145,.014);
    s.rod("#27313d",[side*.506,.87,.008],[side*.514,.87,.008],.044);
    s.rod("#a1a7ac",[side*.514,.87,.008],[side*.52,.87,.008],.019);
    // Two short squared boots match the source, with clear space between them.
    s.roundedBox("#464e57",side*.23,.277,.067,.17,.183,.233,.028,0,0,-side*.13);
    s.roundedBox("#727b84",side*.242,.206,.112,.171,.08,.259,.023,0,0,-side*.08);
    s.box("#303943",side*.244,.171,.123,.145,.018,.232);
  }
  // Small bolt heads are turned geometry rather than oversized round bumps.
  for (const [x,y] of [[-.331,.473],[.331,.473],[-.328,1.032],[.328,1.032],[-.314,.944],[.314,.944],[-.314,.728],[.314,.728]]) {
    const z = y > 1 ? .224 : y > .69 && y < 1 ? .389 : .291;
    s.rod("#353f48",[x,y,z-.009],[x,y,z+.002],.019);
    s.rod("#a2a8aa",[x,y,z+.001],[x,y,z+.007],.011);
    s.box("#4b555d",x,y,z+.009,.014,.003,.003,0,0,.35);
  }
  // Fine irregular exposed-metal scars sit on the lower shield and crown.
  for (const [x,y,dx,dy] of [[-.255,.55,.036,.031],[-.114,.401,.052,.01],[.201,.442,-.027,.047],[.304,.546,-.033,-.012],[-.188,1.075,.048,.018],[.145,1.082,.027,-.018]]) {
    const z = y>1 ? .225 : .288;
    s.panel("#9b9a90",[[x,y,z],[x+dx*.36,y+dy+.004,z],[x+dx,y+dy,z],[x+dx*.69,y+dy*.43,z]],.0025);
  }
  for (const [x,z] of [[-.22,.03],[-.07,.12],[.19,-.08]]) {
    const y=1.16+.214*Math.sqrt(Math.max(0,1-(x/.405)**2-(z/.281)**2));
    s.rod("#a5a39a",[x-.022,y,z],[x+.017,y-.004,z+.011],.004);
  }
  const geometry = s.finish();
  geometry.userData.sculptFeatures = ["rounded-steel-shield", "recessed-amber-visor", "paired-temple-hinges", "rivets-and-metal-scars", "two-boots"];
  return geometry;
}

/** #98: broad rubber stopper with round eyes, a loose hollow chain and four drops. */
function drainplug() {
  const s = new Sculpt({ detail: "high" });
  s.lathe("#30323b",[[0,.245],[.21,.245],[.34,.273],[.419,.322],[.446,.398],[.441,.505],[.406,.593],[.365,.661],[.347,.694],[0,.694]],0,0,0);
  s.lathe("#24262f",[[.367,.573],[.403,.583],[.417,.609],[.415,.634],[.401,.65],[.36,.65],[.367,.573]],0,0,0);
  s.lathe("#52545d",[[0,.644],[.351,.644],[.39,.657],[.405,.686],[.405,.733],[.384,.762],[.331,.778],[0,.778]],0,0,0);
  s.lathe("#282c35",[[.329,.758],[.366,.756],[.389,.739],[.396,.718],[.384,.708],[.37,.734],[.335,.748],[.329,.758]],0,0,0);
  s.lathe("#64666e",[[.035,.777],[.325,.777],[.353,.769],[.357,.778],[.333,.789],[.035,.789],[.035,.777]],0,0,0);
  // The chain base is a separate metal eye seated in the central recess.
  s.lathe("#272c35",[[0,.777],[.11,.777],[.131,.791],[.129,.813],[.103,.826],[0,.826]],0,0,-.015);
  s.torus("#8b8b92",0,.836,-.015,.092,.022,Math.PI/2);
  s.torus("#b1afb1",0,.838,-.015,.065,.012,Math.PI/2);
  // Alternating link planes retain holes along the diagonal loop seen in the pose.
  const chain: P[] = [[.025,.924,-.025],[.106,1.027,-.025],[.192,1.129,-.02],[.279,1.23,-.015],[.378,1.314,-.01],[.487,1.304,-.005],[.556,1.212,0],[.548,1.097,.008],[.478,.993,.012],[.378,.907,.015]];
  for (let i=0;i<chain.length;i++) {
    const [x,y,z]=chain[i], turn=i%2 ? 1.03 : .13;
    s.torus(i%3 ? "#7f8288" : "#a0a1a5",x,y,z,.083,.022,0,turn,-.42);
  }
  for (const side of [-1,1]) {
    const x=side*.165,y=.421,z=.404;
    s.ellipsoid("#171b22",x,y,z,.062,.073,.028);
    s.ellipsoid("#080d16",x,y,z+.018,.047,.061,.018);
    s.ellipsoid("#eee9ef",x-.013,y+.025,z+.034,.019,.022,.005);
    s.ellipsoid("#8190a5",x+.016,y-.025,z+.033,.008,.012,.004);
  }
  // Four narrow water drops preserve the original lower silhouette.
  for (const [x,y,z] of [[-.369,.264,.201],[-.174,.155,.329],[.172,.155,.329],[.374,.262,.198]]) {
    s.cone("#555c89",x,y+.052,z,.022,.116);
    s.ellipsoid("#666d9d",x,y,z,.026,.045,.024);
    s.rod("#aaaac5",[x-.008,y-.006,z+.021],[x-.006,y+.03,z+.017],.003);
  }
  const geometry = s.finish();
  geometry.userData.sculptFeatures = ["rubber-stopper", "raised-sealing-rings", "hollow-chain-eye", "ten-open-chain-links", "paired-gloss-eyes", "four-water-drops"];
  return geometry;
}

/** #99: battered ivory payphone, exposed handset/cord, three-by-four keypad and eyes. */
function callbox() {
  const s = new Sculpt({ detail: "high" });
  const shell="#b2aca0", edge="#75736e", rust="#78604c", dark="#282e36";
  s.roundedBox(edge,0,.847,-.022,.72,1.32,.404,.045);
  s.roundedBox(shell,0,.855,.19,.655,1.207,.053,.025);
  s.roundedBox("#9b978d",0,1.505,-.017,.689,.102,.391,.025);
  s.box("#d0c9b9",0,1.532,.036,.601,.014,.22);
  s.box("#5b5752",0,.249,.198,.6,.026,.022);
  for (const side of [-1,1]) {
    s.roundedBox("#79756f",side*.244,.176,.013,.186,.168,.397,.027);
    s.box("#4a4847",side*.244,.098,.031,.158,.018,.344);
    s.rod("#635e55",[side*.315,.329,.223],[side*.315,1.409,.223],.008);
    s.rod("#d0c6af",[side*.297,.35,.223],[side*.297,1.393,.223],.004);
  }
  // A recessed coin receiver, with a thin bright upper edge.
  s.roundedBox("#686b6c",0,1.36,.231,.363,.085,.027,.016);
  s.box("#202832",0,1.36,.248,.297,.035,.009);
  s.box("#a9afb1",0,1.382,.253,.296,.006,.004);
  // The source face is a pair of cream eye-rings directly above the keypad.
  s.box("#35383a",0,1.187,.232,.421,.19,.022);
  for (const side of [-1,1]) {
    const x=side*.106;
    s.torus("#d9d4c5",x,1.198,.26,.064,.016);
    s.ellipsoid("#151c23",x,1.198,.265,.047,.05,.013);
    s.ellipsoid("#ede8df",x-.013,1.216,.278,.014,.017,.004);
    s.rod("#a9a69d",[x-.061,1.127,.254],[x+.059,1.127,.254],.004);
  }
  s.roundedBox("#42494e",0,.923,.234,.375,.355,.061,.022);
  s.box("#727c7e",0,.923,.268,.324,.307,.01);
  // Bevelled little keycaps use shaped extrusions, keeping tiny parts economical.
  for (let row=0;row<4;row++) for (let column=0;column<3;column++) {
    const x=(column-1)*.098,y=1.036-row*.076,w=.038,h=.028,b=.006,z=.286;
    s.panel("#333b43",[[x-w-b,y+h+b,z-.01],[x+w+b,y+h+b,z-.01],[x+w+b,y-h-b,z-.01],[x-w-b,y-h-b,z-.01]],.014);
    s.panel(row===3 ? "#8d9598" : "#b5b6ae",[[x-w+b,y+h,z],[x+w-b,y+h,z],[x+w,y+h-b,z],[x+w,y-h+b,z],[x+w-b,y-h,z],[x-w+b,y-h,z],[x-w,y-h+b,z],[x-w,y+h-b,z]],.018);
    s.box("#d1d0c5",x,y+h-.004,z+.012,.052,.004,.004);
    s.box("#737c82",x-.008,y+.002,z+.012,.014,.004,.004);
    s.box("#737c82",x+.003,y-.008,z+.012,.004,.012,.004);
  }
  // Rounded telephone grip with wider ear and mouth pieces, mounted on the left.
  s.tube("#242d39",[[-.421,1.244,.143],[-.455,1.17,.143],[-.462,1.011,.144],[-.44,.906,.153]],.046,22);
  s.ellipsoid("#404b5b",-.417,1.25,.145,.081,.097,.067);
  s.ellipsoid("#35414f",-.441,.889,.155,.084,.087,.066);
  s.ellipsoid("#202a37",-.423,1.251,.204,.05,.067,.018);
  s.ellipsoid("#1b2633",-.446,.891,.211,.057,.052,.017);
  s.rod("#68717d",[-.461,1.222,.171],[-.48,1.058,.166],.005);
  // A three-dimensional coiled handset cable forms the hanging source loop.
  const cord:P[]=[];
  for(let i=0;i<=100;i++) {
    const t=i/100,a=t*Math.PI*2,coil=t*Math.PI*2*16;
    cord.push([-.449+.075*Math.sin(a)+.009*Math.cos(coil),.706+.168*Math.cos(a)+.009*Math.sin(coil),.141+.025*Math.sin(a)+.008*Math.cos(coil)]);
  }
  s.tube("#333249",cord,.009,100);
  s.rod("#565265",[-.445,.87,.146],[-.442,.905,.146],.015);
  // The reverse keeps a service seam, hinge and four screw heads.
  s.box("#5c5b58",0,.873,-.231,.56,.97,.015);
  s.box("#89857b",0,.873,-.243,.535,.944,.014);
  for (const x of [-.237,.237]) for(const y of [.452,1.287]) {
    s.rod("#34363b",[x,y,-.252],[x,y,-.261],.014);
    s.box("#c3baaa",x,y,-.266,.018,.003,.004);
  }
  s.box("#484a4b",.374,1.033,-.02,.035,.31,.102);
  s.box("#8b8781",.395,1.033,-.02,.015,.239,.065);
  // Sparse irregular rust blooms and scratches, following the old ivory shell.
  for (let i=0;i<31;i++) {
    const x=-.278+((i*37)%101)/101*.556, y=.32+((i*29)%97)/97*1.065;
    if (Math.abs(x)<.214 && y>.729 && y<1.413) continue;
    const w=.009+(i%4)*.004,h=.012+(i%5)*.005,z=.222;
    s.panel(i%3 ? rust : "#8e7056",[[x-w,y+h*.33,z],[x-w*.4,y+h,z],[x+w*.23,y+h*.47,z],[x+w,y+h*.12,z],[x+w*.39,y-h,z],[x-w*.55,y-h*.38,z]],.003);
    if (i%3===0) s.rod("#d8ceb7",[x-.003,y+.013,z+.003],[x+.002,y-.01,z+.003],.0025);
  }
  for (const x of [-.22,-.075,.15,.259]) s.rod("#6e5b49",[x,1.512,.184],[x+.018,1.524,.108],.006);
  const geometry = s.finish();
  geometry.userData.sculptFeatures = ["weathered-payphone-shell", "coin-slot", "two-cream-eye-rings", "twelve-bevelled-keys", "left-handset", "coiled-hanging-cord", "rear-service-panel"];
  return geometry;
}

export const SCULPTS_L_MACHINES: Record<string, () => THREE.BufferGeometry> = {
  mon_weldmask: weldmask,
  mon_drainplug: drainplug,
  mon_callbox: callbox,
};
