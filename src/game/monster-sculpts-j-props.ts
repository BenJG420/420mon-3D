import type * as THREE from 'three';
import { Sculpt } from './model-sculpt';

type P = [number, number, number];

/** #85: four pale, bubbly tiers, with cream rims and hanging drops. */
function bubstack() {
  const s = new Sculpt();
  const tiers = [
    { y: .16, r: .43, h: .41, color: '#a3af7b' },
    { y: .55, r: .357, h: .365, color: '#b0bb87' },
    { y: .895, r: .292, h: .32, color: '#bdc597' },
    { y: 1.205, r: .239, h: .325, color: '#c4cba2' },
  ];
  for (let t = 0; t < tiers.length; t++) {
    const { y, r, h, color } = tiers[t];
    // Rounded shoulders narrow into the tier above; each shell is closed.
    s.lathe(color, [[0,0],[r*.71,0],[r*.96,h*.08],[r,h*.22],[r*.96,h*.4],[r*.84,h*.66],[r*.65,h*.86],[r*.39,h*.98],[0,h]],0,y,0);
    s.lathe('#7d8960',[[r*.72,-.012],[r*.94,.006],[r*1.012,.043],[r*.995,.061],[r*.958,.054],[r*.9,.025],[r*.72,-.012]],0,y,0);
    s.lathe('#e0dfae',[[r*.78,.013],[r*.947,.033],[r*1.009,.065],[r*1.009,.082],[r*.977,.09],[r*.944,.065],[r*.78,.013]],0,y,0);
    // Modest raised blisters continue around the unseen back without new anatomy.
    const count = t === 3 ? 8 : 10;
    for (let i = 0; i < count; i++) {
      const a = i*2.39996+t*.4, f = .28+(i%4)*.145;
      const radius = r*(1.045-f*.34), size = .023+(i%3)*.006;
      const x = Math.cos(a)*radius, z = Math.sin(a)*radius;
      if (t === 2 && z > .13 && Math.abs(x) < .2 && f < .69) continue;
      s.ellipsoid(i%3 === 0 ? '#8d9b66' : i%3 === 1 ? '#c9d1a1' : '#a4b27e',x,y+h*f,z,size,size*.94,size);
      if (i%3 === 0) s.ellipsoid('#d6dbb3',x-.005,y+h*f+.009,z+.009,size*.36,size*.26,size*.32);
    }
    // Cream foam overhangs each ring; the lower tier ends in little droplet feet.
    const drops = t === 3 ? 3 : t === 0 ? 6 : 5;
    for (let i = 0; i < drops; i++) {
      const a = i*Math.PI*2/drops+.31+t*.28, long = .035+(i%3)*.021;
      const x = Math.cos(a)*r*.963, z = Math.sin(a)*r*.963;
      const bottom = t === 0 ? -.093+(i%3)*.015 : -.025-long;
      s.lathe('#deddaa',[[0,bottom],[.016,bottom],[.024,bottom+.013],[.018,bottom+.034],[.014,.029],[.025,.067],[.019,.084],[0,.091]],x,y,z);
      s.ellipsoid('#ece8bb',x-.004,y+.06,z+.006,.022,.015,.019);
    }
  }
  // The second tier from the top carries the two small deep-set eyes.
  for (const side of [-1,1]) {
    const x = side*.083;
    s.ellipsoid('#8a9763',x,1.015,.263,.046,.067,.024);
    s.ellipsoid('#24221b',x,1.015,.282,.031,.052,.015);
    s.ellipsoid('#f2e8c8',x-.008,1.034,.295,.012,.015,.006);
    s.ellipsoid('#5a5337',x+.009,.988,.294,.008,.011,.005);
    s.ellipsoid('#c9cfa2',side*.169,1.001,.227,.029,.017,.016);
  }
  // The visible cream patches sit on the upper cap, following its rounded dome.
  s.ellipsoid('#dce0b5',-.075,1.439,.111,.063,.014,.033);
  s.ellipsoid('#e1e1b9',.042,1.478,.051,.05,.014,.042);
  s.ellipsoid('#9ca77a',.145,1.356,.142,.028,.036,.024);
  return s.finish();
}

/** #86: a suspended brass-brown scale with a real open hook and two hollow pans. */
function hangscale() {
  const s = new Sculpt(), brown = '#71432d', worn = '#9a6340', dark = '#422a26';
  // The hook has an open throat and continues into a turned spindle above the body.
  const hook: P[] = [[0,1.19,0],[0,1.37,0],[.055,1.45,0],[.121,1.53,0],[.123,1.612,0],[.067,1.677,0],[-.022,1.684,0],[-.1,1.634,0],[-.126,1.556,0]];
  s.tube(dark,hook,.031,32);
  s.tube('#965934',hook.map(([x,y,z]) => [x-.005,y+.005,z+.02] as P),.012,32);
  s.lathe(worn,[[0,1.17],[.058,1.17],[.074,1.201],[.072,1.226],[.05,1.247],[.042,1.285],[.036,1.301],[0,1.301]],0,0,0);
  s.lathe('#a97147',[[.043,1.243],[.071,1.249],[.086,1.265],[.082,1.278],[.058,1.289],[.043,1.283],[.043,1.243]],0,0,0);
  // Thick cast circular body; the dial faces +Z, not upward.
  s.lathe(brown,[[0,-.091],[.166,-.091],[.217,-.068],[.252,-.013],[.253,.048],[.226,.102],[.191,.126],[0,.126]],0,.969,0,Math.PI/2);
  s.lathe('#a76e44',[[.209,.089],[.235,.076],[.243,.088],[.231,.115],[.203,.134],[.194,.12],[.209,.089]],0,.969,0,Math.PI/2);
  s.lathe('#4c3027',[[0,.127],[.138,.127],[.151,.143],[.144,.163],[0,.163]],0,.949,0,Math.PI/2);
  s.lathe('#b57b4c',[[.106,.159],[.129,.154],[.137,.169],[.131,.18],[.111,.181],[.101,.17],[.106,.159]],0,.949,0,Math.PI/2);
  s.lathe('#845735',[[0,.163],[.096,.163],[.108,.174],[.096,.186],[0,.186]],0,.949,0,Math.PI/2);
  for (let i = 0; i < 10; i++) {
    const a = i*Math.PI*2/10;
    s.rod('#d0a36b',[Math.sin(a)*.087,.949+Math.cos(a)*.087,.188],[Math.sin(a)*.101,.949+Math.cos(a)*.101,.188],.0045);
  }
  s.tube('#3b2a24',[[.004,.889,.196],[-.037,.91,.196],[-.046,.957,.196],[-.018,.994,.196],[.025,.981,.196],[.034,.949,.196],[.011,.938,.196]],.011,22);
  s.rod('#d5ad6d',[.003,.949,.207],[.028,.997,.207],.007);
  s.ellipsoid('#d3a666',.003,.949,.208,.015,.015,.009);
  for (const side of [-1,1]) {
    s.ellipsoid(dark,side*.172,1.042,.119,.05,.055,.03);
    s.ellipsoid('#e5b954',side*.172,1.043,.143,.034,.043,.016);
    s.ellipsoid('#ffe3a0',side*.177-.007,1.056,.157,.012,.017,.005);
    s.ellipsoid('#c48c4c',side*.1,1.145,.058,.02,.025,.027);
    // Bent support arms, with cast joints and a highlight on the upper edge.
    const arm: P[] = [[side*.231,.988,0],[side*.372,.994,0],[side*.486,1.027,0],[side*.609,1.029,0]];
    s.tube(brown,arm,.027,18);
    s.tube('#b47b4b',arm.map(([x,y,z]) => [x,y+.012,z+.014] as P),.008,18);
    s.ellipsoid('#583527',side*.257,.989,0,.038,.039,.04);
    s.ellipsoid(worn,side*.6,1.031,0,.04,.047,.034);
    // Rounded oval links alternate orientation, preserving the gaps between them.
    for (let j = 0; j < 4; j++) {
      const yc = 1.014-j*.067, points: P[] = [];
      for (let k = 0; k <= 12; k++) {
        const a = k*Math.PI*2/12;
        points.push(j%2 ? [side*.609+Math.sin(a)*.012,yc+Math.cos(a)*.044,Math.sin(a)*.022] : [side*.609+Math.sin(a)*.027,yc+Math.cos(a)*.044,0]);
      }
      s.tube(j%2 ? '#75472e' : '#99603b',points,.009,12);
    }
    const centerX = side*.609, baseY = side < 0 ? .15 : .207;
    // Each pan is one closed shell around a genuinely open concave interior.
    s.lathe('#6a412b',[[0,0],[.071,0],[.143,.033],[.196,.086],[.226,.143],[.224,.159],[.207,.164],[.188,.111],[.142,.062],[.068,.027],[0,.027],[0,0]],centerX,baseY,0);
    s.lathe('#ad7646',[[.209,.145],[.229,.145],[.237,.156],[.233,.169],[.217,.174],[.203,.164],[.209,.145]],centerX,baseY,0);
    s.lathe('#94603b',[[0,.028],[.064,.028],[.109,.042],[.129,.06],[.115,.057],[.06,.04],[0,.04]],centerX,baseY,0);
    s.lathe('#815232',[[.065,.006],[.133,.03],[.175,.065],[.176,.073],[.124,.041],[.065,.014],[.065,.006]],centerX,baseY,0);
    // Three narrow sling chains hang below the vertical links to the pan rim.
    for (const a of [Math.PI*.08,Math.PI*.92,Math.PI*1.5]) {
      const target: P = [centerX+Math.cos(a)*.213,baseY+.164,Math.sin(a)*.213];
      const start: P = [centerX,.765,0], middle: P = [(start[0]+target[0])*.5,.765+(target[1]-.765)*.5,(start[2]+target[2])*.5];
      s.tube('#67402d',[start,middle,target],.009,12);
      for (let j = 1; j <= 5; j++) {
        const f = j/6, x = start[0]+(target[0]-start[0])*f, y = start[1]+(target[1]-start[1])*f, z = start[2]+(target[2]-start[2])*f;
        s.ellipsoid('#a06b43',x,y,z,.012,.016,.012);
      }
      s.ellipsoid('#b07b4d',...target,.02,.017,.019);
    }
    // Small casting marks on the sides and back keep the material visibly worn.
    for (const [x,y,z] of [[side*.206,.886,.06],[side*.124,1.137,-.042],[side*.164,.817,-.012]]) s.ellipsoid('#a27047',x,y,z,.018,.011,.012);
  }
  return s.finish();
}

/** #87: a scuffed orange traffic cone, reflective white band and purple eyes. */
function curbcone() {
  const s = new Sculpt(), orange = '#e66c0a';
  // A broad square rubber/plastic base, with rolled edges and an inset upper pad.
  s.box('#653a30',0,.063,0,1.04,.094,.86);
  s.box('#c2570b',0,.105,0,1.015,.095,.84);
  s.box('#e77a10',0,.149,0,.957,.056,.79);
  const base: P[] = [[-.467,.143,-.374],[.467,.143,-.374],[.494,.143,-.347],[.494,.143,.347],[.467,.143,.374],[-.467,.143,.374],[-.494,.143,.347],[-.494,.143,-.347],[-.467,.143,-.374]];
  s.tube('#f18b1c',base,.018,40);
  s.box('#d4660a',0,.177,0,.883,.04,.716);
  // A broad flared heel transitions to the long straight, smoothly shaded taper.
  s.lathe('#b65008',[[0,.16],[.414,.16],[.474,.187],[.49,.214],[.48,.232],[.444,.25],[0,.25]],0,0,0);
  s.lathe(orange,[[0,.213],[.452,.213],[.469,.24],[.451,.283],[.402,.42],[.345,.58],[.286,.75],[.221,.94],[.156,1.13],[.088,1.33],[.055,1.42],[.045,1.46],[0,1.46]],0,0,0);
  s.lathe('#f48b16',[[.454,.238],[.465,.248],[.452,.271],[.441,.275],[.442,.263],[.454,.238]],0,0,0);
  // The white band wraps completely around the cone and has its own thin edges.
  s.lathe('#e7e4d7',[[.353,.565],[.357,.577],[.313,.707],[.269,.836],[.263,.846],[.258,.838],[.305,.701],[.35,.568],[.353,.565]],0,0,0);
  s.lathe('#f5f0dc',[[.26,.834],[.269,.834],[.267,.849],[.258,.849],[.26,.834]],0,0,0);
  s.lathe('#bfbeb5',[[.35,.564],[.357,.567],[.355,.579],[.347,.579],[.35,.564]],0,0,0);
  // Eye sockets rise only slightly out of the band; their inward brows are angry.
  for (const side of [-1,1]) {
    const x = side*.142;
    s.ellipsoid('#ece9dd',x,.713,.288,.116,.089,.056);
    const outline: P[] = [[side*.048,.735,.336],[side*.099,.716,.336],[side*.17,.667,.336],[side*.224,.696,.336],[side*.237,.797,.336],[side*.175,.772,.336]];
    if (side > 0) outline.reverse();
    s.panel('#2d1737',outline,.035);
    s.ellipsoid('#623c81',side*.161,.72,.358,.039,.047,.014);
    s.ellipsoid('#22142a',side*.149,.716,.369,.018,.037,.007);
    s.ellipsoid('#fff8ed',side*.167-.008,.742,.373,.016,.022,.006);
    s.ellipsoid('#b18ac3',side*.176,.694,.371,.008,.01,.004);
    s.tube('#f2eee0',[[side*.058,.747,.34],[side*.136,.771,.34],[side*.226,.809,.31]],.009,16);
  }
  // The short flattened tip and its moulding seam stay orange, like the sprite.
  s.lathe('#ec7910',[[0,1.451],[.043,1.451],[.048,1.463],[.044,1.48],[.024,1.487],[0,1.487]],0,0,0);
  s.ellipsoid('#ffd35f',-.014,1.442,.037,.019,.03,.012);
  // Broad irregular grey abrasions, rather than a pixelated texture substitute.
  // This abrasion follows the narrowing cone instead of hovering beside it.
  s.panel('#7b7d7c',[[-.173,.983,.112],[-.16,1.006,.112],[-.135,1.079,.112],[-.121,1.102,.112],[-.116,1.064,.112],[-.141,1.032,.112],[-.14,1.013,.112],[-.155,.982,.112]],.027);
  s.panel('#a3a29a',[[-.15,1.016,.126],[-.133,1.058,.126],[-.125,1.069,.126],[-.121,1.042,.126],[-.136,1.018,.126]],.012);
  s.panel('#828484',[[-.262,.055,.432],[-.226,.057,.432],[-.228,.098,.432],[-.249,.109,.432],[-.263,.088,.432]],.016);
  s.panel('#777b7e',[[.245,.047,.432],[.285,.048,.432],[.282,.099,.432],[.271,.119,.432],[.247,.105,.432]],.016);
  s.panel('#8d9290',[[.363,.049,.432],[.403,.054,.432],[.4,.089,.432],[.382,.102,.432],[.374,.074,.432]],.016);
  // Fine mould lines and a few restrained scratches continue around the back.
  for (const a of [Math.PI,Math.PI*1.49]) {
    const points: P[] = [[Math.cos(a)*.448,.29,Math.sin(a)*.448],[Math.cos(a)*.286,.75,Math.sin(a)*.286],[Math.cos(a)*.091,1.33,Math.sin(a)*.091]];
    s.tube('#ca5b09',points,.004,20);
  }
  s.rod('#ff9f29',[-.193,.98,.115],[-.143,1.119,.101],.006);
  s.rod('#bd540a',[.174,.37,.382],[.205,.399,.354],.005);
  return s.finish();
}

export const SCULPTS_J_PROPS: Record<string, () => THREE.BufferGeometry> = {
  mon_bubstack: bubstack,
  mon_hangscale: hangscale,
  mon_curbcone: curbcone,
};
