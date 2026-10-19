import type * as THREE from 'three';
import { Sculpt } from './model-sculpt';

type P = [number, number, number];

/** #79: a squat golden candle, melted shoulders, pooled wax and a live wick. */
function fatcandle() {
  const s = new Sculpt(), wax = '#b69131', lit = '#d1ae43', dark = '#8a6a25';
  // A closed hollow shell gives the melted opening its own inner wall.
  s.lathe(wax, [[0,.12],[.31,.12],[.405,.16],[.435,.24],[.401,.4],[.37,.64],[.365,.88],[.342,.93],[.277,.925],[.253,.858],[.219,.827],[0,.82]], 0,0,0);
  s.lathe('#e0be50', [[.268,.875],[.303,.91],[.351,.925],[.377,.895],[.378,.865],[.351,.853],[.326,.88],[.29,.891],[.268,.875]], 0,0,0);
  s.lathe('#8e6e27', [[0,.822],[.16,.822],[.232,.837],[.248,.856],[.207,.867],[0,.864]], 0,0,0);
  s.lathe('#cba43d', [[0,.857],[.133,.857],[.205,.863],[.226,.871],[.197,.882],[0,.881]], 0,0,0);
  // Irregular shoulders and long rounded drips grow out of the upper wax rim.
  for (let i = 0; i < 13; i++) {
    const a = i*Math.PI*2/13, x = Math.cos(a), z = Math.sin(a);
    const bottom = [.64,.55,.68,.49,.72,.57,.63,.72,.52,.66,.6,.71,.58][i];
    const r = .035 + (i % 3)*.008, top = .873 + Math.sin(i*2.2)*.024;
    s.ellipsoid(lit, x*.337,top,z*.337,.068,.058,.068);
    s.lathe(i % 3 === 0 ? '#d8b74a' : lit, [[0,bottom-.014],[r*.64,bottom],[r,bottom+.025],[r*.88,bottom+.059],[r*.65,top-.026],[r*.95,top],[r*.7,top+.022],[0,top+.029]], x*.367,0,z*.367);
    if (z > .2) {
      s.tube('#edce68', [[x*.373,bottom+.035,z*.373+.018],[x*.369,(bottom+top)/2,z*.369+.018],[x*.353,top-.007,z*.353+.018]], .007, 12);
    }
  }
  // The lower silhouette breaks into heavy rounded pools, not a clean cylinder.
  for (let i = 0; i < 11; i++) {
    const a = i*Math.PI*2/11, r = .34 + (i % 2)*.025;
    s.ellipsoid(i % 3 === 0 ? '#b18a2d' : '#be9a35', Math.cos(a)*r,.176+(i%3)*.021,Math.sin(a)*r,.096,.075+(i%4)*.025,.093);
  }
  for (const side of [-1,1]) {
    s.ellipsoid(dark,side*.245,.128,.307,.077,.072,.089);
    s.ellipsoid(lit,side*.245,.142,.327,.058,.083,.067);
  }
  // Uneven wax ripples run down the lower sides and around the back.
  for (let i = 0; i < 18; i++) {
    const a = i*2.39996, y = .255+(i%5)*.075;
    if (Math.sin(a) > .72 && Math.abs(Math.cos(a)) < .6 && y > .32) continue;
    const r = .425-(y-.24)*.12;
    s.ellipsoid(i%2 ? '#c4a03a' : '#a68129', Math.cos(a)*r,y,Math.sin(a)*r,.025+(i%3)*.007,.044+(i%4)*.008,.025+(i%3)*.007);
  }
  for (const side of [-1,1]) {
    const x = side*.148, z = .386;
    s.ellipsoid(dark,x,.413,z,.052,.064,.021);
    s.ellipsoid('#342c15',x,.414,z+.015,.036,.045,.016);
    s.ellipsoid('#c7b45f',x-.006,.427,z+.029,.015,.018,.006);
    s.ellipsoid('#fff0af',x-.009,.432,z+.034,.008,.01,.004);
    s.ellipsoid('#856923',x+.009,.392,z+.029,.009,.008,.004);
    s.tube('#ab862c', [[side*.235,.34,.35],[side*.252,.275,.368],[side*.23,.207,.382]], .011, 14);
  }
  // Charred wick, a shallow molten pool and pointed nested flame volumes.
  s.ellipsoid('#6f4c20',0,.885,0,.049,.009,.049);
  s.tube('#302318', [[0,.879,0],[-.015,.923,.003],[.005,.969,0]], .013, 12);
  s.lathe('#cb490b', [[0,0],[.041,.014],[.068,.059],[.065,.109],[.043,.158],[.023,.222],[0,.265]], .004,.944,0,0,0,-.1);
  s.lathe('#f89412', [[0,0],[.034,.01],[.049,.052],[.038,.103],[.019,.147],[0,.199]], .007,.957,.024,0,0,-.1);
  s.lathe('#ffdb48', [[0,0],[.021,.016],[.03,.054],[.02,.084],[0,.137]], .012,.963,.044,0,0,-.1);
  return s.finish();
}

/** #80: a fizzy green crown-cap, golden lip, crimped skirt and tiny feet. */
function fizzcap() {
  const s = new Sculpt(), green = '#8cb52d', gold = '#d2b93b';
  s.lathe(green, [[0,.19],[.24,.19],[.305,.23],[.345,.37],[.393,.52],[.376,.66],[.323,.755],[.255,.79],[0,.79]], 0,0,0);
  // Each fluted lobe follows the cap wall and ends in a different crimp height.
  for (let i = 0; i < 14; i++) {
    const a = i*Math.PI*2/14, r = .326;
    const bottom = .23 + (i%3)*.024, x = Math.cos(a)*r, z = Math.sin(a)*r;
    s.lathe(i%3 === 0 ? '#a8c73d' : i%3 === 1 ? '#8aaf2d' : '#779b29', [[0,bottom],[.041,bottom],[.064,bottom+.035],[.065,bottom+.08],[.044,.47],[.033,.57],[0,.61]], x,0,z);
    s.rod('#b7cd49',[Math.cos(a)*.374,bottom+.055,Math.sin(a)*.374],[Math.cos(a)*.38,.48,Math.sin(a)*.38],.007);
  }
  // The green inner top is broad and domed with a jagged, raised rear crown.
  s.dome('#a8c63b',0,.645,0,.353,.149,.353);
  s.panel('#97b932', [[-.328,.688,-.13],[-.3,.797,-.13],[-.232,.824,-.13],[-.195,.802,-.13],[-.14,.909,-.13],[-.056,.925,-.13],[-.008,.807,-.13],[.061,.854,-.13],[.143,.834,-.13],[.157,.766,-.13],[.246,.829,-.13],[.296,.791,-.13],[.33,.697,-.13]], .13);
  s.ellipsoid('#b5d04a',-.105,.805,-.132,.071,.091,.084);
  s.ellipsoid('#aac83c',.114,.782,-.106,.07,.057,.075);
  const lip: P[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = i*Math.PI*2/40, r = .369+.009*Math.sin(a*6);
    lip.push([Math.cos(a)*r,.668+.018*Math.sin(a*4+.4),Math.sin(a)*r]);
  }
  s.tube('#8d812a',lip.map(([x,y,z]) => [x,y-.018,z] as P),.025,64);
  s.tube(gold,lip,.024,64);
  s.tube('#efda62',lip.map(([x,y,z]) => [x,y+.012,z] as P),.009,64);
  // Fine gold edges trace the visible original notches at the back.
  s.tube('#dcc648',[[-.306,.797,-.064],[-.234,.829,-.064],[-.195,.81,-.064],[-.139,.915,-.064],[-.057,.931,-.064],[-.006,.811,-.064]],.014,26);
  s.tube('#d5c044',[[.014,.819,-.064],[.062,.86,-.064],[.141,.84,-.064],[.16,.774,-.064],[.246,.835,-.064],[.296,.798,-.064]],.013,26);
  for (const [x,y,z,sx,sy,sz] of [[-.12,.784,.05,.05,.007,.022],[-.2,.756,.116,.03,.008,.014],[.089,.779,.03,.036,.007,.015],[.196,.735,.139,.024,.007,.016]]) {
    s.ellipsoid('#c4d957',x,y,z,sx,sy,sz);
  }
  // Two dark, upright eyes are below the gold cap rim, with the original glints.
  for (const side of [-1,1]) {
    const x = side*.132;
    s.ellipsoid('#a8c646',x,.388,.327,.049,.082,.028);
    s.ellipsoid('#2b2732',x,.389,.344,.035,.063,.018);
    s.ellipsoid('#f0f1cb',x-.01,.411,.36,.014,.023,.007);
    s.ellipsoid('#b5bb91',x+.009,.362,.36,.008,.012,.005);
    s.rod('#5d7e22',[side*.174,.225,.055],[side*.178,.145,.099],.028);
    s.ellipsoid('#6c8d25',side*.182,.132,.131,.084,.028,.066);
    s.ellipsoid('#a8bd37',side*.188,.148,.154,.069,.022,.045);
  }
  // A few airy bubbles surround the cap exactly as in its first-pose silhouette.
  const bubbles: [number,number,number,number][] = [[-.49,.73,.005,.036],[-.375,.943,-.035,.05],[-.206,1.128,-.022,.047],[.271,1.069,-.022,.043],[.498,.863,.004,.052],[-.438,.233,.05,.043],[.474,.201,.026,.031]];
  for (const [x,y,z,r] of bubbles) {
    s.ellipsoid('#a0d5ba',x,y,z,r,r*1.06,r);
    s.ellipsoid('#e1f1da',x-.007,y+.008,z+.012,r*.7,r*.76,r*.7);
    s.ellipsoid('#f5fff1',x-.013,y+.019,z+.026,r*.25,r*.28,r*.2);
  }
  return s.finish();
}

/** #81: red padded round stool; its top face follows the seat's gentle tilt. */
function stoolpad() {
  const s = new Sculpt(), tilt = .34, c = Math.cos(tilt), n = Math.sin(tilt);
  const seat = (x: number, y: number, z: number): P => [x,.81+y*c-z*n,y*n+z*c];
  // A deep cushion, welted seam and steel pan all share the same inclined seat.
  s.lathe('#5b5261',[[0,-.111],[.43,-.111],[.526,-.082],[.558,-.046],[.552,-.015],[.523,-.006],[0,-.006]],0,.81,0,tilt);
  s.lathe('#948b94',[[.526,-.067],[.558,-.055],[.568,-.038],[.558,-.022],[.539,-.024],[.526,-.067]],0,.81,0,tilt);
  s.lathe('#971925',[[0,-.039],[.48,-.039],[.545,-.012],[.571,.035],[.562,.082],[.516,.122],[.408,.144],[0,.151]],0,.81,0,tilt);
  s.lathe('#b62231',[[0,.124],[.411,.124],[.505,.117],[.542,.089],[.544,.07],[.51,.096],[.408,.133],[0,.142]],0,.81,0,tilt);
  s.lathe('#d14049',[[.518,.095],[.537,.091],[.545,.076],[.54,.064],[.532,.072],[.518,.095]],0,.81,0,tilt);
  // Narrow stitched dashes run around the top welt, separated from the red face.
  for (let i = 0; i < 42; i++) {
    const a = i*Math.PI*2/42, b = a+.052, r = .501;
    s.rod(i%3 ? '#cd5360' : '#dd6971',seat(Math.cos(a)*r,.126,Math.sin(a)*r),seat(Math.cos(b)*r,.126,Math.sin(b)*r),.0045);
  }
  // Four splayed steel legs with rounded feet and a lower rectangular brace.
  const feet: P[] = [], tops: P[] = [];
  for (const [x,z] of [[-.31,-.28],[.31,-.28],[.31,.28],[-.31,.28]]) {
    const top = seat(x,-.09,z), foot: P = [Math.sign(x)*.437,.09,Math.sign(z)*.393];
    tops.push(top); feet.push(foot);
    const knee: P = [x*1.16,top[1]*.53,z*1.16];
    s.tube('#756f7a',[top,knee,[foot[0],.13,foot[2]]],.035,16);
    s.tube('#a39ca8',[[top[0]-.013,top[1]-.016,top[2]+.022],[knee[0]-.013,knee[1],knee[2]+.022],[foot[0]-.013,.148,foot[2]+.022]],.009,16);
    s.lathe('#47404d',[[0,.044],[.037,.044],[.053,.055],[.057,.083],[.051,.112],[.035,.121],[0,.121]],foot[0],0,foot[2]);
    s.lathe('#aaa1aa',[[.037,.104],[.049,.104],[.047,.125],[.035,.13],[.037,.104]],foot[0],0,foot[2]);
    s.ellipsoid('#504856',top[0],top[1]-.01,top[2],.053,.04,.052);
  }
  for (let i = 0; i < 4; i++) {
    const j = (i+1)%4;
    const atBrace = (k: number): P => [tops[k][0]+(feet[k][0]-tops[k][0])*.7,.29,tops[k][2]+(feet[k][2]-tops[k][2])*.7];
    const a = atBrace(i), b = atBrace(j);
    s.rod('#655b6b',a,b,.021);
    s.rod('#a094a3',[a[0],a[1]+.01,a[2]+.008],[b[0],b[1]+.01,b[2]+.008],.006);
  }
  // Whites, black pupils and inward-lowered brows sit on the padded top itself.
  for (const side of [-1,1]) {
    const p = seat(side*.201,.15,.12);
    s.box('#291c25',...p,.2,.014,.133,tilt);
    const white = seat(side*.201,.159,.125);
    s.box('#e7dfdd',...white,.162,.009,.104,tilt);
    const pupil = seat(side*.168,.168,.148);
    s.box('#2b242c',...pupil,.061,.009,.08,tilt);
    const glint = seat(side*.171-.012,.174,.13);
    s.box('#fff8ec',...glint,.019,.006,.026,tilt);
    s.tube('#321b25',[seat(side*.098,.175,.142),seat(side*.19,.174,.085),seat(side*.305,.165,.027)],.016,16);
    s.tube('#7b1926',[seat(side*.108,.17,.17),seat(side*.2,.164,.191),seat(side*.285,.15,.182)],.008,14);
  }
  // Shallow edge creases reinforce the upholstery rather than adding new anatomy.
  for (const a of [.4,1.2,2.5,3.4,4.3,5.3]) {
    s.rod('#791520',seat(Math.cos(a)*.54,.071,Math.sin(a)*.54),seat(Math.cos(a+.025)*.554,.034,Math.sin(a+.025)*.554),.006);
  }
  return s.finish();
}

export const SCULPTS_I_PROPS: Record<string, () => THREE.BufferGeometry> = {
  mon_fatcandle: fatcandle,
  mon_fizzcap: fizzcap,
  mon_stoolpad: stoolpad,
};
