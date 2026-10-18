import type * as THREE from "three";
import { Sculpt } from "./model-sculpt";
import { SCULPTS_G_CREATURES } from "./monster-sculpts-g-creatures";

type P = [number, number, number];
const ball = (s: Sculpt, c: string, p: P, r: P) => s.ellipsoid(c, ...p, ...r);
const line = (s: Sculpt, c: string, a: P, b: P, r = .02) => s.rod(c, a, b, r);
function ring(s: Sculpt, color: string, x: number, y: number, z: number, radius: number, width: number) {
  const profile: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const a = i * Math.PI / 4;
    profile.push([radius + Math.cos(a) * width, Math.sin(a) * width]);
  }
  s.lathe(color, profile, x, y, z, Math.PI / 2);
}

/** #67: a slumping lime spill with a single recessed eye and irregular wet drips. */
function spilleye() {
  const s = new Sculpt(), slime = '#799b0e', light = '#a0bb1c', dark = '#4f6710';
  // A continuous tapered core, not a stack of balls or a flat sprite slab.
  s.lathe(slime, [[0,.14],[.24,.14],[.43,.2],[.5,.29],[.47,.39],[.4,.51],[.33,.66],[.24,.8],[.15,.93],[.07,.985],[0,.97]], 0, 0, 0);
  ball(s, light, [.015,.89,0], [.16,.14,.14]);
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI * 2 / 10, r = .43 + Math.sin(i * 2.3) * .04;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    ball(s, i % 3 ? slime : light, [x,.29+(i%3)*.035,z], [.13,.11,.12]);
    if (i % 2 === 0) {
      s.tube(slime, [[x,.33,z],[x*1.1,.22,z*1.07],[x*1.03,.1+(i%3)*.035,z*1.12]], .03, 12);
      ball(s, light, [x*1.03,.035+(i%3)*.035,z*1.12], [.024,.035,.024]);
    }
  }
  // Drooping folds wrap both sides of the face and continue around the back.
  for (const a of [-1, 1]) {
    s.tube(light, [[a*.11,.86,.19],[a*.3,.64,.235],[a*.36,.4,.31],[a*.24,.25,.4]], .023, 22);
    s.tube(dark, [[a*.08,.8,-.2],[a*.22,.6,-.33],[a*.31,.32,-.36]], .014, 18);
    for (let i = 0; i < 4; i++) ball(s, '#b7cc36', [a*(.18+i*.06),.7-i*.11,.26+i*.035], [.023,.032,.017]);
  }
  // Thick green eyelids encircle the dark inset; the iris remains a separate lens.
  ball(s, dark, [0,.65,.31], [.245,.255,.12]);
  ball(s, '#a4ba2d', [0,.655,.365], [.211,.222,.083]);
  ball(s, '#3c501d', [0,.65,.422], [.158,.173,.04]);
  ball(s, '#7b982c', [0,.65,.445], [.133,.146,.025]);
  ball(s, '#19242a', [0,.648,.465], [.09,.116,.02]);
  ball(s, '#91a293', [-.032,.697,.48], [.023,.03,.009]);
  ball(s, '#d8e6a0', [-.043,.714,.486], [.009,.012,.006]);
  for (const [x,y,z] of [[-.12,.88,.08],[.19,.72,-.13],[-.29,.47,-.28],[.25,.42,.2],[-.19,.32,.3]]) {
    ball(s, '#8ca815', [x,y,z], [.043,.047,.035]);
  }
  return s.finish();
}

/** #68: a round brass gong, rolled rim, carry handle and hanging striker. */
function gongling() {
  const s = new Sculpt(), brass = '#b17c1e', edge = '#d3a43b', shadow = '#685023';
  const cy = .79;
  // Closed spun-metal shell: front dish, thick lip and a shallow rear cavity.
  s.lathe(brass, [[0,-.095],[.29,-.095],[.405,-.075],[.45,-.025],[.46,.045],[.435,.105],[.385,.125],[.35,.095],[0,.07]], 0, cy, 0, Math.PI/2);
  ring(s, edge, 0, cy, .07, .437, .022);
  ring(s, '#825b1c', 0, cy, .114, .375, .009);
  ring(s, '#c18f2c', 0, cy, .109, .353, .008);
  ring(s, shadow, 0, cy, -.092, .3, .012);
  s.tube(shadow, [[-.14,1.215,-.008],[-.12,1.3,-.008],[0,1.34,-.008],[.12,1.3,-.008],[.14,1.215,-.008]], .042, 24);
  s.tube(edge, [[-.13,1.23,.016],[-.1,1.3,.016],[0,1.325,.016],[.1,1.3,.016],[.13,1.23,.016]], .024, 24);
  for (const a of [-1, 1]) {
    ball(s, shadow, [a*.32,1.1,.058], [.027,.033,.022]);
    ball(s, edge, [a*.32,1.107,.077], [.017,.023,.012]);
    // Dark inset button eyes with a separate rolled brass bezel.
    ball(s, '#2e2c26', [a*.158,.835,.077], [.059,.065,.025]);
    ring(s, edge, a*.158,.835,.095,.053,.009);
    ball(s, '#514832', [a*.158,.832,.1], [.031,.037,.012]);
    ball(s, '#d0b56b', [a*.158-.01,.851,.111], [.008,.01,.005]);
    // Short articulated supports and broad curled metal feet, as in the first pose.
    line(s, shadow, [a*.22,.43,-.005], [a*.285,.28,.01], .055);
    ball(s, '#7c7150', [a*.283,.27,.01], [.06,.058,.055]);
    s.tube('#6e654a', [[a*.283,.27,.01],[a*.32,.18,.07],[a*.365,.17,.16]], .05, 12);
    ball(s, '#827756', [a*.35,.155,.14], [.095,.04,.075]);
    line(s, '#494737', [a*.3,.13,.2], [a*.4,.13,.2], .012);
  }
  // An actual attached striker, separated from the feet and front plate.
  ring(s, shadow, 0,.63,.1,.065,.018);
  ball(s, '#454232', [0,.63,.114], [.045,.047,.024]);
  line(s, shadow, [0,.63,.12], [-.015,.34,.3], .032);
  line(s, '#9d8853', [-.009,.59,.147], [-.022,.35,.317], .012);
  s.lathe('#665331', [[0,-.03],[.053,-.03],[.075,-.01],[.075,.045],[.054,.065],[0,.065]], -.015,.265,.32, Math.PI/2);
  ring(s, edge, -.015,.265,.35,.065,.011);
  ball(s, '#bda45f', [-.015,.265,.38], [.037,.034,.014]);
  return s.finish();
}

/** #69: fractured ivory mask over a violet wisp, with deep bright eye sockets. */
function maskwisp() {
  const s = new Sculpt(), violet = '#552282', dark = '#251236', ivory = '#c6c1a6';
  ball(s, violet, [0,1.01,-.025], [.31,.39,.15]);
  ball(s, ivory, [0,1.11,.005], [.3,.335,.15]);
  // A tapered lower mask edge breaks into three distinct teeth over the spirit.
  s.panel(ivory, [[-.265,1.04,.083],[-.17,.77,.083],[-.11,.87,.083],[-.05,.73,.083],[.005,.95,.083],[-.045,1.06,.083]], .085);
  s.panel('#b4ad98', [[.045,1.02,.09],[.065,.75,.09],[.14,.87,.09],[.22,.83,.09],[.285,1.09,.09]], .075);
  // Sockets are asymmetrical and backed by dark, recessed volumes.
  for (const [x,y,r] of [[-.145,1.045,.087],[.14,1.14,.081]]) {
    ball(s, dark, [x,y,.128], [r,r*1.17,.046]);
    ball(s, '#542078', [x,y,.164], [r*.67,r*.74,.022]);
    ball(s, '#aa42e3', [x,y,.182], [r*.4,r*.45,.017]);
    ball(s, '#efd6ff', [x-.004,y+.008,.196], [r*.15,r*.19,.008]);
  }
  // Cracks follow the convex front so they read as fractures, not floating wire.
  const crack = (points: [number, number][]) => {
    const p: P[] = points.map(([x,y]) => [x,y,.006+.151*Math.sqrt(Math.max(.03,1-(x/.3)**2-((y-1.11)/.335)**2))]);
    for (let i=0;i<p.length-1;i++) line(s, '#625c61', p[i], p[i+1], .008);
  };
  crack([[.055,1.436],[.045,1.35],[.087,1.32],[.06,1.25],[.096,1.21]]);
  crack([[-.2,1.35],[-.16,1.28],[-.17,1.22],[-.13,1.18],[-.15,1.13]]);
  crack([[.265,1.27],[.22,1.24],[.235,1.2],[.21,1.18]]);
  s.panel(violet, [[-.057,1.02,.16],[-.02,.945,.16],[-.05,.9,.16],[.005,.82,.16],[.015,.95,.16]], .012);
  // Continuous curving smoke strands curl into an open, tapering tail.
  s.tube(violet, [[0,.83,-.02],[-.08,.64,0],[.04,.5,.02],[-.085,.37,.015],[.04,.23,.01]], .052, 36);
  s.tube('#71329e', [[.18,.85,-.03],[.12,.68,.04],[-.04,.56,.09],[.025,.41,.09],[-.045,.26,.05]], .028, 32);
  s.tube('#43205e', [[-.18,.85,-.04],[-.21,.68,-.01],[-.09,.57,-.03],[.03,.51,-.06]], .021, 24);
  s.tube('#7939ad', [[.04,.24,.01],[.085,.19,0],[.03,.12,0]], .017, 14);
  for (const [x,y] of [[-.25,.74],[.2,.62],[-.13,.32]]) {
    s.tube(violet, [[x,y,-.01],[x+.04,y-.04,.015],[x+.02,y-.07,.02]], .008, 8);
  }
  return s.finish();
}

export const SCULPTS_G: Record<string, () => THREE.BufferGeometry> = {
  mon_spilleye: spilleye, mon_gongling: gongling, mon_maskwisp: maskwisp,
  ...SCULPTS_G_CREATURES,
};
