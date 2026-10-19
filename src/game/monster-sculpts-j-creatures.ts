import type * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];
const ball = (s: Sculpt, color: string, p: P, r: P) => s.ellipsoid(color, ...p, ...r);

/** #88: a deep magenta arrow housing with inset cyan and white neon tubing. */
function neonarrow() {
  const s = new Sculpt(), edge = '#301a40', purple = '#5a1b71';
  const outline: P[] = [[-.76,.47,0],[-.76,.94,0],[.04,.94,0],[.04,1.27,0],[.69,.72,0],[.04,.16,0],[.04,.47,0]];
  // The closed metal case carries a recessed magenta face and a dark rear shell.
  s.panel(edge, outline, .25);
  s.panel('#44204f', outline.map(([x,y]): P => [x*.974,.72+(y-.72)*.974,-.132]), .025);
  const face: P[] = [[-.706,.524,.133],[-.706,.885,.133],[.098,.885,.133],[.098,1.155,.133],[.576,.72,.133],[.098,.284,.133],[.098,.524,.133]];
  s.panel('#a60b8a', face, .035);
  s.panel('#c413a6', [[-.66,.557,.156],[-.66,.846,.156],[.139,.846,.156],[.139,1.066,.156],[.492,.72,.156],[.139,.371,.156],[.139,.557,.156]], .018);
  const rim = outline.map(([x,y]): P => [x,y,.123]); rim.push(rim[0]);
  s.tube(purple,rim,.024,56);
  const back = outline.map(([x,y]): P => [x,y,-.14]); back.push(back[0]);
  s.tube('#21152d',back,.017,48);
  // The white perimeter and the cyan inner arrow are separate, round glass tubes.
  const white: P[] = [[-.717,.509,.171],[-.717,.898,.171],[.087,.898,.171],[.087,1.186,.171],[.607,.72,.171],[.087,.253,.171],[.087,.509,.171],[-.717,.509,.171]];
  s.tube('#855494',white,.027,62);
  s.tube('#f2e8f7',white.map(([x,y,z]): P=>[x,y,z+.016]),.012,62);
  const cyan: P[] = [[-.652,.563,.179],[.146,.563,.179],[.146,.382,.179],[.476,.72,.179],[.146,1.06,.179],[.146,.838,.179],[-.652,.838,.179]];
  s.tube('#126b97',cyan,.033,46);
  s.tube('#34dbed',cyan.map(([x,y,z]): P=>[x,y,z+.018]),.021,46);
  s.tube('#d6fbf6',cyan.map(([x,y,z]): P=>[x-.003,y+.004,z+.035]),.007,46);
  // Tiny collars hold the tubes above the painted fascia; recessed rear screws
  // and two mounting shoes give the sign a restrained, plausible reverse.
  for(const x of [-.59,-.35,-.105]) for(const y of [.505,.9]) {
    s.box('#5b456e',x,y,.146,.036,.067,.018);
    s.rod('#83c8df',[x,y-.022,.195],[x,y+.022,.195],.006);
  }
  for(const [x,y] of [[-.64,.58],[-.64,.83],[.17,.79],[.17,.65]]) {
    ball(s,'#75617c',[x,y,-.157],[.018,.018,.009]);
    s.rod('#241d30',[x-.009,y,-.165],[x+.009,y,-.165],.003);
  }
  for(const x of [-.47,.13]) s.box('#33233d',x,.72,-.169,.105,.17,.045);
  // Two square-ish light eyes stay clear of the tubes, in dark bevelled sockets.
  for(const x of [-.36,-.075]) {
    s.box('#531451',x,.717,.18,.147,.145,.035);
    s.box('#260f32',x,.717,.205,.121,.119,.03);
    ball(s,'#e6a8e7',[x,.717,.231],[.047,.046,.021]);
    ball(s,'#fff2f6',[x-.01,.727,.247],[.027,.03,.011]);
    ball(s,'#f4c7ef',[x+.021,.704,.247],[.012,.014,.008]);
  }
  for(const [x,y] of [[-.651,.758],[-.648,.662],[-.54,.64]]) ball(s,'#c9c5f0',[x,y,.18],[.013,.013,.009]);
  // Sparse electric motes follow the original's cool halo without enlarging it.
  for(const [x,y,axis] of [[-.817,.58,0],[-.61,1.001,1],[-.39,.439,1],[-.167,.999,1],[.002,1.112,0],[.477,.267,0],[.7,.953,1],[-.795,.991,0]]) {
    const dx=axis===0 ? .018 : .003,dy=axis===1 ? .022 : .003;
    s.rod('#73bde8',[x-dx,y-dy,.038],[x+dx,y+dy,.038],.007);
    ball(s,'#e7dff4',[x,y,.039],[.005,.005,.005]);
  }
  return s.finish();
}

/** #89: two worn wooden clothespin cheeks, a real spring and a chewed green leaf. */
function clipin() {
  const s = new Sculpt(), wood='#af783c', pale='#d4a45d', endgrain='#80562d';
  const cheek: [number,number][]=[[-.355,.173],[-.416,.24],[-.424,.455],[-.405,.96],[-.385,1.246],[-.32,1.409],[-.309,1.477],[-.154,1.477],[-.147,1.386],[-.091,1.303],[-.088,1.083],[-.047,.967],[-.135,.826],[-.139,.592],[-.17,.406],[-.235,.249],[-.289,.173]];
  for(const side of [-1,1]) {
    const at=(x:number,y:number,z:number): P=>[side*x,y+(side<0 ? -.042 : 0),z];
    // Thick closed jaws leave the central top notch and lower V genuinely open.
    const points=cheek.map(([x,y]): P=>at(x,y,0));
    s.panel(wood,points,.286);
    const front=cheek.map(([x,y]): P=>at(x,y,.145)); front.push(front[0]);
    s.tube(pale,front,.021,40);
    const rear=cheek.map(([x,y]): P=>at(x,y,-.143)); rear.push(rear[0]);
    s.tube(endgrain,rear,.016,36);
    // Raised longitudinal grain follows each cheek's taper and rounded toe.
    s.tube('#c59250',[at(-.364,.274,.15),at(-.374,.55,.154),at(-.357,.828,.157),at(-.342,1.12,.155),at(-.295,1.367,.15)],.016,30);
    s.tube('#8f602e',[at(-.297,.255,.154),at(-.264,.45,.156),at(-.23,.642,.154),at(-.239,.822,.155)],.008,22);
    s.tube('#d6aa67',[at(-.292,.302,.156),at(-.282,.474,.16),at(-.29,.65,.159),at(-.3,.865,.158)],.008,22);
    s.tube('#97652f',[at(-.186,1.425,.15),at(-.197,1.32,.158),at(-.18,1.209,.157),at(-.187,1.124,.157)],.006,18);
    s.rod('#e1b779',at(-.287,1.47,.157),at(-.17,1.47,.157),.011);
    s.rod('#724825',at(-.398,.624,.149),at(-.368,.677,.153),.008);
    s.rod('#8a582a',at(-.371,.68,.157),at(-.343,.723,.159),.005);
    // Small knots and end-grain rings add wood detail without pixel-like patches.
    ball(s,'#91602f',at(-.329,.39,.155),[.021,.049,.005]);
    ball(s,'#bd8947',at(-.331,.397,.16),[.011,.034,.004]);
    s.rod('#704b2a',at(-.384,.26,-.146),at(-.333,.238,-.146),.004);
    s.rod('#d1a469',at(-.31,1.474,-.09),at(-.17,1.474,.065),.004);
    // Black glossy eyes are seated on the upper cheeks, away from the spring.
    const eye=at(-.246,1.142,.18);
    ball(s,'#76552e',eye,[.113,.119,.043]);
    ball(s,'#e8d9af',[eye[0],eye[1]+.008,.216],[.094,.099,.034]);
    ball(s,'#151713',[eye[0]+side*.007,eye[1]+.002,.244],[.072,.077,.033]);
    ball(s,'#fff6df',[eye[0]-.02,eye[1]+.033,.271],[.027,.027,.009]);
    ball(s,'#8a9b90',[eye[0]+.029,eye[1]-.024,.269],[.009,.013,.006]);
  }
  // A dark spring well is recessed behind the metal coils and split wooden jaws.
  s.box('#3c382c',0,.811,-.045,.269,.338,.09);
  const helix:P[]=[];
  for(let i=0;i<=120;i++) {
    const t=i/120, a=t*Math.PI*8;
    helix.push([.139*Math.cos(a),.654+t*.337,.064+.135*Math.sin(a)]);
  }
  s.tube('#6e7270',helix,.029,120);
  // Four thin front arcs catch light on the same physical spring windings.
  for(let turn=0;turn<4;turn++) {
    const glint:P[]=[];
    for(let j=0;j<=10;j++) {
      const a=.2+j*.12, t=(turn+a/(Math.PI*2))/4;
      glint.push([.139*Math.cos(a),.654+t*.337+.007,.064+.135*Math.sin(a)+.023]);
    }
    s.tube('#bec3bb',glint,.008,10);
  }
  s.tube('#797d76',[[.139,.991,.064],[.19,1.008,.075],[.221,.953,.092]],.02,12);
  s.tube('#676d67',[[.139,.654,.064],[.177,.62,.075],[.172,.571,.077]],.02,12);
  // The broad green leaf projects down-left from the mouth. Its closed backing,
  // curved midrib and raised veins give both front and reverse an organic form.
  const leaf:P[]=[[.006,.829,.259],[-.113,.804,.259],[-.204,.786,.259],[-.291,.714,.259],[-.367,.659,.259],[-.423,.568,.259],[-.516,.455,.259],[-.574,.292,.259],[-.432,.332,.259],[-.327,.363,.259],[-.214,.453,.259],[-.142,.545,.259],[-.088,.667,.259]];
  s.panel('#416b1b',leaf,.047);
  s.panel('#6e9d22',[[0,.816,.288],[-.146,.75,.288],[-.284,.674,.288],[-.402,.529,.288],[-.548,.319,.288],[-.406,.364,.288],[-.282,.447,.288],[-.184,.557,.288],[-.09,.705,.288]],.018);
  const mid:P[]=[[.007,.834,.32],[-.124,.703,.335],[-.295,.511,.327],[-.535,.337,.3]];
  s.tube('#9abd36',mid,.013,24);
  for(const [a,b,c] of [
    [[-.1,.727,.33],[-.177,.764,.31],[-.221,.758,.292]],
    [[-.186,.631,.332],[-.283,.668,.311],[-.351,.65,.291]],
    [[-.278,.53,.326],[-.367,.546,.312],[-.428,.525,.292]],
    [[-.143,.681,.332],[-.127,.621,.314],[-.151,.553,.294]],
    [[-.243,.567,.329],[-.218,.502,.312],[-.251,.428,.293]],
    [[-.344,.473,.319],[-.335,.422,.305],[-.394,.363,.292]],
  ] as [P,P,P][]) s.tube('#87ad2c',[a,b,c],.007,10);
  return s.finish();
}

/** #90: deep parallel aluminium cooling fins, orange eyes and violet discharges. */
function heatsink() {
  const s = new Sculpt(), steel='#7f8796', shadow='#3b424e', lit='#c4c9d3';
  // A solid rear casting connects all nine projecting fins into a full-depth body.
  s.box('#59616e',0,.83,-.147,.82,1.025,.16);
  s.box('#727987',0,.72,-.246,.784,.792,.046);
  for(const x of [-.278,0,.278]) {
    s.box('#444b59',x,.76,-.277,.126,.659,.025);
    s.rod('#969dab',[x-.047,.451,-.292],[x-.047,1.068,-.292],.006);
  }
  s.box('#474d59',0,.347,.023,.86,.31,.416);
  s.box('#727886',0,.263,.061,.666,.088,.38);
  s.box('#535967',0,.19,.044,.296,.114,.282);
  // Each fin is a closed, slightly tapered metal blade with a rounded front lip;
  // actual deep gaps expose the darker connecting plate behind the extrusion.
  for(let i=0;i<9;i++) {
    const x=-.384+i*.096, y0=.465+(i%2)*.016, y1=1.31-(Math.abs(i-4)===4 ? .033 : 0);
    const fin:P[]=[[x-.031,y0+.042,0],[x-.028,y1-.035,0],[x-.02,y1,0],[x+.021,y1,0],[x+.029,y1-.035,0],[x+.032,y0+.042,0],[x+.023,y0,0],[x-.022,y0,0]];
    s.panel(i%2===0 ? '#9ba2af' : '#838d9e',fin,.465);
    s.tube(lit,[[x-.015,y0+.025,.235],[x-.019,.72,.237],[x-.017,1.03,.237],[x-.014,y1-.018,.233]],.011,20);
    s.rod('#666f80',[x+.022,y0+.022,.236],[x+.023,y1-.034,.236],.007);
    s.rod('#d8dce0',[x-.015,y1-.003,-.209],[x-.014,y1-.003,.206],.006);
    // Fine surface machining stays on the blade face, never filling the grooves.
    for(let j=0;j<3;j++) s.rod(j%2===0 ? '#aeb4c0' : '#747d8c',[x+.005,.57+j*.218,.236],[x+.004,.68+j*.218,.236],.003);
  }
  // The short bright cap in the source sits above, and joins, the central fins.
  s.box(steel,0,1.34,-.008,.608,.15,.462);
  s.box('#adb3c0',0,1.383,.226,.585,.052,.024);
  s.rod('#e1e0e7',[-.276,1.414,.21],[.276,1.414,.21],.012);
  s.rod('#bcc4d2',[-.299,1.368,.238],[.299,1.368,.238],.009);
  s.rod('#686c7c',[-.289,1.29,.238],[.289,1.29,.238],.007);
  for(const x of [-.212,-.107,0,.107,.212]) {
    ball(s,'#c5c7d2',[x,1.391,.244],[.019,.012,.008]);
    s.rod('#858b99',[x-.011,1.334,.237],[x+.012,1.335,.237],.004);
  }
  for(const side of [-1,1]) {
    // External side columns and horizontal heat fins create the stepped silhouette.
    s.box(shadow,side*.471,.781,-.041,.146,1.08,.375);
    s.rod('#a5a8b5',[side*.453,.291,.172],[side*.453,1.315,.172],.023);
    s.rod('#5d6472',[side*.511,.285,.152],[side*.511,1.296,.152],.018);
    s.box('#a5a8b4',side*.467,1.286,-.037,.133,.071,.37);
    for(let i=0;i<6;i++) {
      const y=.447+i*.13, x=side*(.538+(i%2)*.012);
      s.box('#69717e',x,y,-.058,.118,.06,.315);
      s.rod('#acafbb',[side*.52,y+.03,.105],[side*.597,y+.03,.105],.009);
    }
    // Low-set hot eyes sit in inset sockets below the blades and above the feet.
    ball(s,'#272a34',[side*.26,.346,.248],[.118,.111,.042]);
    ball(s,'#a73a12',[side*.26,.346,.281],[.079,.076,.022]);
    ball(s,'#ee6c16',[side*.26,.354,.299],[.055,.057,.014]);
    ball(s,'#ffbd3e',[side*.25,.365,.312],[.034,.043,.011]);
    ball(s,'#fff0a0',[side*.244,.381,.322],[.016,.021,.006]);
    s.tube('#83858f',[[side*.16,.412,.244],[side*.219,.438,.249],[side*.307,.433,.245],[side*.35,.389,.241]],.015,14);
    // Broad dark feet carry three subtle transverse tread lines and metal toes.
    s.box('#3f434f',side*.477,.119,.031,.241,.156,.383);
    s.box('#636672',side*.477,.063,.058,.263,.057,.417);
    s.rod('#9c97ab',[side*.582,.11,.254],[side*.369,.11,.254],.012);
    for(const y of [.074,.129,.173]) s.rod('#777685',[side*.579,y,.229],[side*.373,y,.229],.005);
    // Each discharge is a branching violet tube, grounded to a real side fin.
    const arcs:P[][]=[
      [[side*.571,.23,.06],[side*.637,.342,.093],[side*.59,.405,.11],[side*.679,.499,.084],[side*.612,.558,.087],[side*.664,.655,.055]],
      [[side*.59,.716,-.003],[side*.665,.806,.035],[side*.605,.87,.052],[side*.664,.972,.018],[side*.613,1.032,.027]],
    ];
    for(const arc of arcs) {
      // Straight connected segments preserve the source's electrical zigzags.
      for(let j=0;j<arc.length-1;j++) {
        s.rod('#8d51ba',arc[j],arc[j+1],.018);
        const a=arc[j].map((v,k)=>k===2 ? v+.011 : v) as P;
        const b=arc[j+1].map((v,k)=>k===2 ? v+.011 : v) as P;
        s.rod('#e2b9f5',a,b,.007);
      }
      for(const p of arc) ball(s,'#c692e6',p,[.019,.019,.017]);
    }
    for(const [x,y] of [[.625,.592],[.68,1.117],[.585,1.405],[.556,1.483]]) {
      s.rod('#bb83d7',[side*x,y,.011],[side*(x+.018),y+.028,.011],.006);
      ball(s,'#e7c8f3',[side*x,y,.011],[.008,.008,.007]);
    }
  }
  return s.finish();
}

export const SCULPTS_J_CREATURES: Record<string, () => THREE.BufferGeometry> = {
  mon_neonarrow: neonarrow,
  mon_clipin: clipin,
  mon_heatsink: heatsink,
};
