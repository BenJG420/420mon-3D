import type * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];
const ball = (s: Sculpt, color: string, p: P, r: P) => s.ellipsoid(color, ...p, ...r);

/** #76: an open, chipped terracotta pot with soil, a two-leaf sprout and clay feet. */
function pothead() {
  const s = new Sculpt(), clay = '#a95d2e', rim = '#bf713d', shadow = '#643b24';
  // The whole vessel is a closed lathed shell, including its inner wall and base.
  s.lathe(clay, [[0,.19],[.23,.19],[.285,.22],[.32,.3],[.36,.53],[.4,.77],[.39,.8],[.343,.8],[.319,.55],[.277,.3],[0,.3]], 0, 0, 0);
  s.lathe(rim, [[.344,.725],[.405,.725],[.438,.75],[.442,.83],[.42,.863],[.355,.863],[.333,.836],[.334,.79],[.344,.725]], 0, 0, 0);
  s.lathe('#d78b50', [[.351,.847],[.415,.847],[.43,.858],[.415,.868],[.354,.868],[.345,.858],[.351,.847]], 0, 0, 0);
  // Recessed soil remains visibly below the opening; small clods have real depth.
  s.lathe('#39271a', [[0,.74],[.32,.74],[.337,.763],[.323,.791],[0,.794]], 0, 0, 0);
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39996, r = .287 * Math.sqrt((i + .5) / 22);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const shade = ['#62402a', '#50341f', '#785035'][i % 3];
    ball(s, shade, [x,.79 + (i % 3) * .006,z], [.037 + (i % 3) * .01,.027,.032 + (i % 4) * .006]);
  }
  // Small chips and cracks follow the curved ceramic wall instead of floating.
  const faceZ = (x: number, y: number) => Math.sqrt(Math.max(.002, (.286 + (y - .23) * .207) ** 2 - x * x));
  const crack = (points: [number, number][]) => {
    const p: P[] = points.map(([x,y]) => [x,y,faceZ(x,y) + .004]);
    for (let i = 0; i < p.length - 1; i++) s.rod(shadow, p[i], p[i + 1], .008);
  };
  crack([[-.29,.65],[-.27,.59],[-.285,.55],[-.26,.49]]);
  crack([[.22,.5],[.18,.43],[.22,.39],[.16,.32],[.16,.26]]);
  crack([[.18,.43],[.26,.44],[.285,.49]]);
  crack([[-.13,.25],[-.11,.29],[-.14,.34]]);
  for (const [x,y] of [[-.3,.61],[.25,.35],[.27,.51],[-.19,.28]]) {
    ball(s, '#c27a45', [x,y,faceZ(x,y)], [.025,.039,.012]);
  }
  s.panel('#854729', [[-.24,.85,.351],[-.2,.826,.351],[-.21,.77,.351],[-.17,.75,.351],[-.18,.81,.351],[-.2,.86,.351]], .018);
  s.panel('#99502c', [[.3,.846,.296],[.27,.814,.296],[.295,.775,.296],[.314,.785,.296],[.3,.823,.296],[.32,.846,.296]], .018);
  // Glossy dark inset eyes sit directly in the front wall, with tiny clay lids.
  for (const side of [-1, 1]) {
    const x = side * .128, z = faceZ(x,.52);
    ball(s, shadow, [x,.52,z], [.047,.072,.024]);
    ball(s, '#171c14', [x,.52,z + .015], [.032,.053,.017]);
    ball(s, '#bbc9a3', [x - .006,.546,z + .031], [.01,.015,.007]);
    ball(s, '#5b6f45', [x + .008,.495,z + .027], [.006,.008,.005]);
    ball(s, rim, [x,.588,z - .001], [.038,.012,.016]);
    ball(s, '#8e4929', [side*.236,.174,.005], [.117,.071,.155]);
    ball(s, '#b86a37', [side*.257,.17,.061], [.11,.052,.12]);
    s.tube(shadow, [[side*.185,.137,.12],[side*.24,.13,.164],[side*.3,.139,.143]], .008, 10);
  }
  // The stem bends out of the soil and visibly forks into the original two leaves.
  s.tube('#387b21', [[.035,.79,.025],[.017,.94,.02],[-.04,1.075,.006],[-.085,1.18,.005]], .025, 22);
  s.tube('#589b25', [[.027,.8,.045],[.006,.955,.042],[-.045,1.075,.028]], .009, 16);
  s.tube('#428329', [[-.04,1.06,.004],[.025,1.19,-.002],[.135,1.285,-.005]], .018, 16);
  // Thin leaves are closed extrusions with fleshy centers and veins on both sides.
  s.panel('#4f961d', [[-.055,1.085,.016],[-.185,1.217,.016],[-.27,1.225,.016],[-.34,1.188,.016],[-.375,1.13,.016],[-.3,1.142,.016],[-.245,1.09,.016],[-.16,1.075,.016]], .045);
  ball(s, '#64ae27', [-.228,1.153,.015], [.103,.044,.031]);
  s.panel('#5da320', [[.016,1.177,.01],[.04,1.315,.01],[.105,1.403,.01],[.193,1.438,.01],[.265,1.42,.01],[.235,1.34,.01],[.156,1.26,.01],[.07,1.202,.01]], .045);
  ball(s, '#78bb30', [.128,1.327,.01], [.066,.067,.029]);
  for (const z of [-.018, .046]) {
    s.tube('#86bf35', [[-.06,1.096,z],[-.19,1.156,z],[-.331,1.158,z]], .009, 14);
    s.tube('#93c839', [[.021,1.185,z],[.113,1.315,z],[.23,1.407,z]], .009, 16);
    for (const [a,b,c,d] of [[-.17,1.148,-.21,1.205],[-.23,1.157,-.285,1.2],[.092,1.283,.082,1.35],[.14,1.338,.19,1.34]]) {
      s.rod('#75b22e', [a,b,z], [c,d,z], .0045);
    }
  }
  return s.finish();
}

/** #77: deep purple fan housing, curved rotor, magenta coils, grille and hub eyes. */
function rackfan() {
  const s = new Sculpt(), frame = '#62596f', edge = '#81718f', dark = '#272334';
  // A genuine open-front cabinet, with a rear wall, side walls and beveled corners.
  s.box(dark, 0,.75,-.19,.94,.98,.065);
  for (const side of [-1, 1]) {
    s.box(frame, side*.49,.75,-.015,.115,.99,.42);
    s.box(frame, 0,.75+side*.49,-.015,.92,.115,.42);
    s.panel(edge, [[side*.435,.315,.2],[side*.435,1.185,.2],[side*.49,1.235,.2],[side*.53,1.19,.2],[side*.53,.31,.2],[side*.49,.265,.2]], .065);
    s.box(edge, 0,.75+side*.485,.215,.89,.057,.062);
    // Rear panel ribs and fasteners remain visible when the cabinet is rotated.
    s.box('#3a3347', side*.34,.75,-.232,.043,.79,.02);
    for (const y of [.37,1.13]) {
      ball(s, '#494152', [side*.475,y,.253], [.015,.015,.012]);
      s.rod('#a098a8', [side*.475-.008,y,.264], [side*.475+.008,y,.264], .0025);
    }
    s.panel('#42374e', [[side*.35,.31,.04],[side*.54,.31,.04],[side*.575,.23,.04],[side*.55,.13,.04],[side*.49,.105,.04],[side*.37,.12,.04],[side*.325,.2,.04]], .28);
    ball(s, '#63536f', [side*.448,.2,.105], [.106,.065,.066]);
  }
  // Four copper-purple winding bundles behind the impeller, leaving visible gaps.
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    const center = quadrant * Math.PI / 2 + Math.PI / 4;
    for (let j = 0; j < 3; j++) {
      const points: P[] = [];
      for (let k = 0; k <= 12; k++) {
        const a = center - .45 + k * .075, r = .357 + j*.024;
        points.push([Math.cos(a)*r,.75+Math.sin(a)*r,-.115]);
      }
      s.tube(j === 1 ? '#a42bb4' : '#672276', points, .013, 18);
    }
    const a = center + .45;
    s.tube('#8b259e', [[Math.cos(a)*.36,.75+Math.sin(a)*.36,-.115],[Math.cos(a)*.405,.75+Math.sin(a)*.405,-.09],[Math.cos(a+.09)*.409,.75+Math.sin(a+.09)*.409,-.07]], .009, 10);
  }
  // Distinct swept, closed blades: each has a curved outline and a raised spine.
  for (let i = 0; i < 4; i++) {
    const angle = i*Math.PI/2, c = Math.cos(angle), n = Math.sin(angle);
    const at = (x: number, y: number, z: number): P => [x*c-y*n,.75+x*n+y*c,z];
    const outline: [number,number][] = [[.065,.065],[.11,.205],[.095,.325],[.018,.415],[-.1,.41],[-.18,.365],[-.135,.29],[-.062,.22],[-.035,.12]];
    s.panel(i % 2 ? '#4f587a' : '#454e70', outline.map(([x,y]) => at(x,y,-.027)), .055);
    s.tube('#65718d', [at(.012,.105,.007),at(.035,.21,.009),at(.007,.32,.011),at(-.072,.39,.009)], .016, 18);
    s.tube('#32394e', [at(-.032,.12,-.06),at(-.068,.23,-.06),at(-.136,.325,-.06)], .012, 12);
  }
  // Protective square grille sits in front of the rotating assembly, behind its hub.
  for (const y of [.49,.75,1.015]) {
    s.box('#3d354b', 0,y,.143,.92,.037,.035);
    s.box('#7a6088', 0,y+.008,.164,.91,.009,.009);
  }
  for (const x of [-.252,.252]) {
    s.box('#4c405d', x,.75,.15,.034,.91,.036);
    s.box('#8a6e98', x-.009,.75,.172,.008,.9,.009);
  }
  // Round octagonal-looking hub with the original two rectangular inset eyes.
  s.lathe('#4c4664', [[0,-.045],[.12,-.045],[.172,-.019],[.187,.018],[.177,.058],[.13,.08],[0,.08]], 0,.75,.163, Math.PI/2);
  ball(s, '#65607d', [0,.75,.225], [.166,.163,.035]);
  for (const side of [-1, 1]) {
    s.box('#201d2d', side*.13,.765,.253,.075,.112,.028);
    s.box('#a246b8', side*.13,.765,.272,.044,.074,.014);
    s.box('#e2a3e7', side*.13-.009,.784,.282,.018,.029,.008);
  }
  // The rear has a restrained motor cover, not an invented second face.
  ball(s, '#393144', [0,.75,-.232], [.21,.21,.055]);
  for (let i = 0; i < 5; i++) s.box('#1f1c29', 0,.65+i*.05,-.285,.24,.011,.009);
  return s.finish();
}

/** #78: a fine wooden match-stick imp, curved limbs and a layered, pointed flame. */
function matchimp() {
  const s = new Sculpt(), wood = '#68401b', litWood = '#8d5925';
  // Match-sized slender body and bent limbs; no generic bulky humanoid underneath.
  s.tube(wood, [[0,.45,-.005],[-.012,.63,0],[.006,.82,0],[0,.95,0]], .022, 24);
  s.tube(litWood, [[.009,.47,.018],[.006,.66,.022],[.014,.85,.017]], .007, 14);
  for (const side of [-1, 1]) {
    s.tube(wood, [[side*.012,.8,0],[side*.103,.674,.005],[side*.176,.51,.015]], .014, 22);
    ball(s, '#51301a', [side*.177,.499,.018], [.024,.035,.021]);
    s.tube(litWood, [[side*.036,.771,.014],[side*.105,.664,.019],[side*.169,.529,.028]], .005, 16);
    s.tube(wood, [[side*.008,.463,0],[side*.067,.334,.005],[side*.11,.157,.026]], .016, 22);
    ball(s, '#51321b', [side*.111,.145,.043], [.044,.017,.037]);
    s.tube(litWood, [[side*.02,.448,.013],[side*.075,.323,.02],[side*.104,.17,.038]], .005, 18);
    s.rod('#392715', [side*.155,.134,.049], [side*.087,.134,.067], .005);
  }
  // A smoothly revolved flame volume narrows all the way to a distinct high tip.
  s.lathe('#c72d0c', [[0,.865],[.076,.87],[.142,.921],[.18,1.005],[.17,1.095],[.126,1.186],[.082,1.253],[.065,1.326],[.024,1.385],[0,1.434]], 0,0,0);
  s.lathe('#e5530c', [[0,.888],[.085,.894],[.142,.958],[.154,1.034],[.126,1.125],[.087,1.19],[.047,1.254],[0,1.294]], -.008,0,.035);
  s.lathe('#f2a018', [[0,.91],[.086,.929],[.125,.987],[.127,1.059],[.091,1.129],[.047,1.183],[0,1.235]], 0,0,.077);
  // Three pointed side tongues continue the main fire, with depth on both faces.
  s.lathe('#b9230a', [[0,-.105],[.045,-.086],[.064,-.03],[.04,.035],[.025,.095],[0,.15]], -.153,1.075,-.008,0,0,-.32);
  s.lathe('#d73a0a', [[0,-.09],[.043,-.07],[.052,-.005],[.032,.052],[0,.117]], .148,1.122,-.004,0,0,.29);
  s.lathe('#d7410c', [[0,-.085],[.028,-.075],[.042,-.025],[.02,.038],[0,.108]], -.068,1.322,-.006,0,0,.32);
  s.lathe('#ea710e', [[0,-.06],[.022,-.055],[.032,-.015],[.016,.034],[0,.087]], -.137,1.073,.039,0,0,-.32);
  // Warm central face, sunk into the fire rather than a separate floating mask.
  ball(s, '#f2b92b', [0,1.027,.156], [.117,.096,.032]);
  for (const side of [-1, 1]) {
    ball(s, '#231e13', [side*.059,1.05,.179], [.029,.04,.017]);
    ball(s, '#e3d38a', [side*.058,1.056,.19], [.016,.028,.007]);
    ball(s, '#201e12', [side*.049,1.047,.198], [.01,.02,.006]);
    ball(s, '#fff0ad', [side*.055-.005,1.07,.199], [.004,.006,.004]);
    s.tube('#60320b', [[side*.025,1.08,.184],[side*.058,1.108,.172],[side*.086,1.102,.163]], .009, 12);
  }
  s.tube('#572907', [[-.061,.994,.181],[-.03,.977,.187],[.006,.974,.189],[.044,.984,.182],[.066,1.004,.172]], .009, 18);
  s.tube('#f4d061', [[-.037,.97,.184],[.002,.959,.185],[.037,.971,.18]], .005, 12);
  // A small rear orange tongue keeps the rounded fire readable from behind.
  s.lathe('#d9480c', [[0,-.09],[.051,-.075],[.067,-.02],[.043,.05],[.024,.105],[0,.16]], .024,1.11,-.091,0,0,.12);
  return s.finish();
}

export const SCULPTS_H_OBJECTS: Record<string, () => THREE.BufferGeometry> = {
  mon_pothead: pothead,
  mon_rackfan: rackfan,
  mon_matchimp: matchimp,
};
