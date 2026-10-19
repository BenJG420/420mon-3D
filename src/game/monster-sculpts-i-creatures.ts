import type * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];
const ball = (s: Sculpt, color: string, p: P, r: P) => s.ellipsoid(color, ...p, ...r);

/** #82: an oval iron escutcheon, a recessed violet keyhole spirit and three teeth. */
function keywisp() {
  const s = new Sculpt(), iron = '#696572', lit = '#99929e', dark = '#393541';
  const outer = (angle: number, z: number): P => [.435 * Math.cos(angle), .93 + .625 * Math.sin(angle), z];
  // The two closed side plates leave a real key-shaped opening through the frame.
  // Its round upper chamber narrows into the rounded lower stem of the keyway.
  const inner: P[] = [];
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI / 2 - i * (Math.PI * 5 / 6) / 20;
    inner.push([.285 * Math.cos(a), 1.035 + .345 * Math.sin(a), .115]);
  }
  inner.push([.13,.69,.115], [.13,.55,.115]);
  for (let i = 1; i <= 10; i++) {
    const a = -i * Math.PI / 20;
    inner.push([.13 * Math.cos(a), .55 + .13 * Math.sin(a), .115]);
  }
  for (const side of [-1, 1]) {
    const outside: P[] = [];
    for (let i = 0; i <= 32; i++) outside.push(outer(-Math.PI / 2 + i * Math.PI / 32, .02));
    const strip = [...outside, ...inner].map(([x,y]): P => [side*x,y,.02]);
    s.panel(iron, strip, .2);
    // A smoothly rounded lip bounds the actual opening; the rear has a darker rim.
    s.tube(lit, inner.map(([x,y]): P => [side*x,y,.121]), .025, 42);
    s.tube(dark, inner.map(([x,y]): P => [side*x,y,-.089]), .025, 42);
    const edge: P[] = [];
    for (let i = 0; i <= 32; i++) edge.push(outer(-Math.PI/2+i*Math.PI/32,.04));
    s.tube('#514b5d', edge.map(([x,y,z]): P => [side*x,y,z]), .038, 40);
    s.tube('#8a8291', edge.slice(10,30).map(([x,y]): P => [side*(x-.013),y,.109]), .017, 24);
    // Subtle worn streaks run over the metal rather than replacing its silhouette.
    s.tube('#77707e', [[side*.36,.76,.121],[side*.383,.88,.125],[side*.376,1.02,.122]], .019, 20);
    s.tube('#47414e', [[side*.344,.59,.126],[side*.375,.68,.128],[side*.391,.79,.125]], .009, 14);
  }
  // A dark, deep-backed spirit fills the chamber behind its thick metal mouth.
  ball(s, '#28104b', [0,1.025,-.015], [.302,.363,.082]);
  ball(s, '#471078', [0,1.015,.046], [.259,.309,.036]);
  ball(s, '#5d108e', [.014,.905,.063], [.183,.235,.028]);
  ball(s, '#6510a4', [0,.638,.022], [.135,.219,.067]);
  ball(s, '#8b15cb', [.006,.607,.074], [.099,.157,.026]);
  ball(s, '#a522e2', [.018,.604,.092], [.057,.099,.017]);
  for (const side of [-1,1]) {
    ball(s, '#200c35', [side*.034,.574,.109], [.012,.02,.008]);
    ball(s, '#bf4aee', [side*.032-.003,.584,.114], [.003,.004,.003]);
  }
  // Three uneven key teeth are attached below the oval by a short metal shank.
  s.box(dark, 0,.263,.008,.13,.13,.14);
  s.box(iron, 0,.207,.018,.352,.093,.16);
  s.box('#8b8393', 0,.242,.11,.32,.025,.018);
  for (const [x,y,h] of [[-.137,.12,.155],[0,.147,.105],[.137,.123,.149]]) {
    s.box('#5d5667', x,y,.023,.085,h,.145);
    s.box('#918798', x-.014,y+.007,.103,.021,h-.021,.019);
    s.box('#3c3546', x+.031,y,.097,.013,h-.014,.015);
  }
  return s.finish();
}

/** #83: gathered magenta drapery, half-lidded eyes and scalloped gold passementerie. */
function boothdrape() {
  const s = new Sculpt(), cloth = '#83134f', shade = '#4e1035', gold = '#b58a39';
  // A closed continuous cloth backing joins the projecting, rounded fabric folds.
  // The hanging shape widens below the three gathered points and has a scalloped hem.
  const edge: P[] = [[-.432,1.43,-.045],[.432,1.43,-.045],[.466,1.02,-.045],[.55,.26,-.045]];
  for (let i=0;i<=40;i++) {
    const x=.55-i*1.1/40;
    edge.push([x,.225-.055*Math.cos(x/.11*Math.PI),-.045]);
  }
  edge.push([-.466,1.02,-.045]);
  s.panel(shade, edge, .24);
  // Each meridian is a soft fold, attached throughout its length to the cloth sheet.
  // Their wider lower edges produce the source's characteristic five-lobed hem.
  for (let i=-2;i<=2;i++) {
    const x=i*.207, lean=-i*.039, h=1.19-Math.abs(i)*.026;
    s.lathe(i%2===0 ? cloth : '#961557', [[0,0],[.071,.016],[.118,.065],[.124,.15],[.105,.34],[.082,.66],[.075,.92],[.076,h-.08],[.045,h],[0,h+.02]], x,.174,.086,0,0,lean);
    s.tube('#ab1b64', [[x-.028,.268,.208],[x-.029,.48,.202],[x-.02,.74,.178],[x+i*.023,1.12,.157],[x+i*.026,1.345,.15]], .014, 24);
    s.rod('#66103e', [x+.061,.283,.186], [x+.052,.55,.175], .01);
    s.rod('#66103e', [x+.052,.55,.175], [x+.048,.82,.147], .01);
  }
  // Side folds turn round the edge and continue onto the quiet, darker reverse.
  for (const side of [-1,1]) {
    s.tube('#771046', [[side*.434,1.39,-.04],[side*.454,1.11,.005],[side*.496,.7,.018],[side*.531,.284,.005]], .04, 16);
    s.tube('#68103f', [[side*.355,1.37,-.16],[side*.38,.91,-.174],[side*.439,.264,-.168]], .025, 16);
  }
  // Two recessed sleepy eyes sit in folded cloth sockets, without an added mouth.
  for (const side of [-1,1]) {
    const at=(x:number,y:number,z:number): P => [side*x,y,z];
    ball(s, '#741044', at(.205,.99,.155), [.16,.165,.071]);
    ball(s, cloth, at(.207,1.069,.212), [.153,.081,.073]);
    s.panel('#370b2a', [at(.068,1.007,.231),at(.128,1.034,.231),at(.238,1.075,.231),at(.337,1.039,.231),at(.297,.932,.231),at(.216,.889,.231),at(.137,.931,.231)], .047);
    ball(s, '#bca6a6', at(.211,.981,.261), [.085,.049,.015]);
    ball(s, '#6e2253', at(.195,.977,.279), [.035,.04,.012]);
    ball(s, '#1c1020', at(.188,.979,.291), [.015,.025,.006]);
    ball(s, '#e6d8cc', at(.178,.991,.298), [.007,.008,.004]);
    // The upper fold occludes the upper eye; lower folds form its drooping socket.
    s.panel('#991853', [at(.067,1.011,.289),at(.157,1.086,.289),at(.275,1.151,.289),at(.355,1.075,.289),at(.303,1.033,.289),at(.214,1.017,.289),at(.127,.991,.289)], .038);
    s.tube('#be256d', [at(.076,1.028,.314),at(.163,1.099,.312),at(.267,1.145,.308),at(.335,1.087,.305)], .016, 14);
    s.tube('#aa1a61', [at(.09,.963,.268),at(.17,.881,.267),at(.249,.89,.261),at(.317,.949,.254)], .021, 14);
    s.tube('#62103e', [at(.101,.91,.215),at(.143,.794,.218),at(.197,.67,.211),at(.216,.432,.205)], .012, 12);
    s.tube('#a81a5d', [at(.058,1.298,.173),at(.091,1.17,.226),at(.058,1.044,.274),at(.04,.865,.231)], .021, 16);
  }
  // Double scalloped cords hang between the three top medallions and side tips.
  const supports=[-.452,-.3,0,.3,.452];
  for(let row=0;row<2;row++) {
    for(let i=0;i<supports.length-1;i++) {
      const a=supports[i],b=supports[i+1], points: P[]=[];
      for(let j=0;j<=12;j++) {
        const t=j/12, x=a+(b-a)*t;
        const sag=(b-a>.2 ? .105 : .062)*Math.sin(t*Math.PI);
        points.push([x,1.454-row*.166-sag,.184]);
      }
      s.tube(row===0 ? '#d0a348' : gold,points,.019,10);
      if(row===1) for(let j=2;j<12;j+=3) {
        const p=points[j];
        s.rod('#d2aa51',p,[p[0],p[1]-.035,p[2]+.003],.008);
        s.cone('#dfb85b',p[0],p[1]-.04,p[2]+.005,.009,.018);
      }
    }
  }
  for(const x of [-.3,0,.3]) {
    ball(s, '#725325', [x,1.453,.189], [.035,.048,.018]);
    ball(s, '#d4aa4e', [x,1.459,.206], [.025,.039,.013]);
    ball(s, '#8d5e25', [x,1.455,.218], [.01,.021,.006]);
    ball(s, '#e7c270', [x-.007,1.475,.219], [.006,.009,.005]);
  }
  // The gold hem follows all five scallops, including their depth and rear return.
  for(const offset of [0,.045]) {
    const hem: P[]=[];
    for(let i=0;i<=60;i++) {
      const x=-.532+i*1.064/60;
      const wave=Math.cos(x/.207*Math.PI*2);
      hem.push([x,.223-.04*wave+offset,.151+.051*wave]);
    }
    s.tube(offset===0 ? '#bb8c39' : '#cda447',hem,.011,40);
    s.tube('#8e672c',[[-.532,.252+offset,.15],[-.548,.26+offset,-.015],[-.482,.254+offset,-.167],[0,.222+offset,-.184],[.482,.254+offset,-.167],[.548,.26+offset,-.015],[.532,.252+offset,.15]],.01,24);
  }
  return s.finish();
}

/** #84: six-legged black ant carrying an oxidised, waisted anvil as its abdomen. */
function anvilant() {
  const s = new Sculpt(), shell='#24242a', joint='#15161b', rust='#824529';
  // A diagonal ant axis matches the original side pose while retaining full anatomy.
  const at=(side:number,y:number,forward:number): P => [.05+.78*side-.625*forward,y,-.08+.625*side+.78*forward];
  ball(s,shell,at(0,.415,.02),[.155,.125,.17]);
  ball(s,'#303036',at(0,.452,.22),[.137,.137,.143]);
  ball(s,joint,at(0,.434,.35),[.085,.085,.085]);
  ball(s,'#29292e',at(0,.435,.52),[.205,.163,.203]);
  // All six legs have a separate coxa, raised knee, lower joint and planted foot.
  for(const side of [-1,1]) {
    for(let i=0;i<3;i++) {
      const f=.235-i*.205, spread=.25+(i===1 ? .055 : 0), reach=.50-i*.43;
      const hip=at(side*.105,.405,f), knee=at(side*spread,.305,f+.07);
      const ankle=at(side*(spread+.07),.105,reach), foot=at(side*(spread+.126),.052,reach+.055);
      s.rod(shell,hip,knee,.026);
      ball(s,'#3b3a3e',hip,[.042,.04,.042]);
      ball(s,joint,knee,[.037,.04,.038]);
      s.rod('#28272d',knee,ankle,.022);
      ball(s,'#353338',ankle,[.025,.026,.025]);
      s.tube('#27252b',[ankle,at(side*(spread+.09),.059,reach+.016),foot],.016,12);
      s.rod('#5d4c47',foot,at(side*(spread+.153),.05,reach+.073),.009);
    }
    // Warm compound eyes and small bronze mandibles distinguish the black head.
    const eye=at(side*.122,.484,.635);
    ball(s,'#0f1117',eye,[.057,.065,.046]);
    ball(s,'#a94015',[eye[0],eye[1]+.003,eye[2]+.028],[.033,.041,.022]);
    ball(s,'#e2782b',[eye[0]-.009,eye[1]+.013,eye[2]+.043],[.015,.024,.008]);
    ball(s,'#f6c06b',[eye[0]-.013,eye[1]+.025,eye[2]+.049],[.006,.008,.004]);
    s.tube('#242126',[at(side*.073,.344,.638),at(side*.093,.313,.72),at(side*.051,.282,.77)],.023,16);
    s.rod('#a5632f',at(side*.071,.301,.747),at(side*.039,.277,.778),.012);
    // Long, elbowed antennae sweep forward and out, with tapered terminal tips.
    s.tube('#2c2730',[at(side*.081,.563,.554),at(side*.122,.711,.60),at(side*.235,.837,.666),at(side*.336,.818,.738)],.017,26);
    s.tube('#483440',[at(side*.336,.818,.738),at(side*.384,.773,.796),at(side*.399,.739,.812)],.01,12);
    ball(s,'#17171d',at(side*.081,.563,.554),[.025,.026,.025]);
  }
  s.tube('#464044',[at(0,.576,.456),at(0,.586,.527),at(0,.539,.652)],.009,16);
  // Real anvil cross-section: top face, projecting horn/heel, narrow waist and foot.
  const profile: [number,number][]=[[-.54,1.045],[.605,1.045],[.636,.955],[.49,.889],[.334,.76],[.272,.576],[.365,.457],[.562,.349],[.511,.315],[-.254,.315],[-.317,.372],[-.122,.509],[-.086,.697],[-.187,.854],[-.464,.936]];
  s.panel(rust,profile.map(([x,y]): P=>[x,y,-.19]),.435);
  // Dark inner waist and warm, worn bevels make the cast metal readable in depth.
  s.panel('#653822',[[-.157,.858,.033],[-.043,.721,.033],[-.074,.518,.033],[-.231,.381,.033],[.455,.347,.033],[.292,.465,.033],[.209,.594,.033],[.272,.786,.033],[.46,.906,.033]],.012);
  s.box('#a96339',.042,1.052,-.19,1.09,.035,.446);
  s.box('#b47e56',.031,1.073,-.19,1.04,.014,.411);
  // The anvil's horn is tapered in plan and elevation, not a rectangular appendage.
  s.cone('#9b5831',-.588,.985,-.19,.118,.375,0,0,Math.PI/2);
  s.cone('#bc7a46',-.593,1.008,-.19,.064,.334,0,0,Math.PI/2);
  for(const z of [.035,-.415]) {
    const rim: P[]=[[-.516,1.04,z],[.594,1.04,z],[.623,.96,z],[.482,.895,z],[.328,.757,z],[.267,.576,z],[.36,.457,z],[.547,.351,z]];
    s.tube(z>0 ? '#b87543' : '#77452d',rim,.014,40);
    s.tube('#a96537',[[-.459,.944,z],[-.187,.863,z],[-.08,.704,z],[-.116,.51,z],[-.295,.372,z],[-.248,.327,z],[.506,.327,z]],.013,35);
    // Sparse thin casting scratches follow the flank, retaining broad metal planes.
    for(const [x,y,dx,dy] of [[.18,.875,-.062,-.119],[.332,.897,-.106,-.185],[-.04,.822,.055,-.104],[.189,.475,.053,-.071],[-.108,.407,.094,.043]]) {
      s.rod('#432c24',[x,y,z+.003],[x+dx,y+dy,z+.003],.005);
      s.rod('#aa6f43',[x+.012,y,z+.006],[x+dx+.012,y+dy,z+.006],.0035);
    }
  }
  // Scattered oxidation patches and shallow scoring lie on the real upper face.
  for(let i=0;i<13;i++) {
    const x=-.422+(i%5)*.213+(i%2)*.024, z=-.34+Math.floor(i/5)*.142;
    ball(s,i%3===0 ? '#694735' : '#995732',[x,1.082,z],[.037+(i%3)*.014,.004,.025+(i%2)*.018]);
  }
  for(const x of [-.31,-.02,.26,.46]) s.rod('#c0936b',[x,1.088,-.345],[x+.052,1.088,-.079],.0035);
  return s.finish();
}

export const SCULPTS_I_CREATURES: Record<string, () => THREE.BufferGeometry> = {
  mon_keywisp: keywisp,
  mon_boothdrape: boothdrape,
  mon_anvilant: anvilant,
};
