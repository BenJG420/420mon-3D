import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type Point = [number, number, number];
type Frame = THREE.Matrix4;

function frame(position: Point, rotation: Point = [0, 0, 0]): Frame {
  return new THREE.Matrix4().compose(new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(1, 1, 1));
}

/** Model in an object's own XY face plane; the hinge frame gives it real depth. */
function part(s: Sculpt, color: number, geometry: THREE.BufferGeometry, f: Frame,
  position: Point = [0, 0, 0], scale: Point = [1, 1, 1]) {
  geometry.scale(...scale).translate(...position).applyMatrix4(f);
  s.surface(color, geometry);
}

function bead(s: Sculpt, color: number, f: Frame, position: Point, scale: Point, detail = 12) {
  part(s, color, new THREE.SphereGeometry(1, detail, Math.max(6, Math.floor(detail * .65))), f, position, scale);
}

function shell(s: Sculpt, color: number, f: Frame, profile: [number, number][], sx: number, sy: number, segments = 64) {
  const geometry = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), segments);
  geometry.rotateX(Math.PI / 2);
  part(s, color, geometry, f, [0, 0, 0], [sx, sy, 1]);
}

function line(s: Sculpt, color: number, f: Frame, points: Point[], radius: number, segments = 16) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  part(s, color, new THREE.TubeGeometry(curve, segments, radius, 6, false), f);
}

function rim(s: Sculpt, color: number, f: Frame, radius: number, tube: number, z: number, sx = 1, sy = 1) {
  part(s, color, new THREE.TorusGeometry(radius, tube, 8, 64), f, [0, 0, z], [sx, sy, 1]);
}

function hinge(s: Sculpt, f: Frame, x: number, y: number, z: number, color: number) {
  for (let i = -1; i <= 1; i++) {
    const barrel = new THREE.CylinderGeometry(.038, .038, .052, 16);
    barrel.rotateZ(Math.PI / 2);
    part(s, i === 0 ? 0x776754 : color, barrel, f, [x + i * .057, y, z]);
  }
  for (const sign of [-1, 1]) {
    bead(s, 0xc6b584, f, [x + sign * .086, y, z], [.012, .027, .027]);
  }
}

/** #116 — the source's open ivory seat, pink well and upright watching lid. */
function seatring() {
  const s = new Sculpt({ detail: "high" });
  const seat = frame([0, -.34, .09], [-.48, 0, 0]);
  const lid = frame([0, .38, -.23], [-.07, 0, 0]);
  const world = frame([0, 0, 0]);

  // A closed annular ceramic cross-section. The central aperture contains no
  // hidden cap: its separately recessed well remains visible from above/front.
  shell(s, 0xd8d0b8, seat, [[.97, -.10], [1.02, -.055], [1.025, .015], [.99, .065],
    [.94, .087], [.68, .087], [.61, .06], [.585, .015], [.59, -.07], [.65, -.10], [.97, -.10]], .53, .40);
  rim(s, 0xf0e9d5, seat, .93, .018, .08, .53, .40);
  shell(s, 0x615367, seat, [[.605, -.065], [.59, -.12], [.48, -.20], [.20, -.255], [0, -.258]], .53, .40);
  shell(s, 0xb90a8b, seat, [[.48, -.205], [.38, -.225], [0, -.23]], .53, .40);
  bead(s, 0xe326ac, seat, [-.035, -.015, -.224], [.18, .115, .008], 24);
  line(s, 0xe54cb7, seat, [[-.16, .025, -.218], [-.08, .065, -.218], [.055, .068, -.218]], .008, 12);
  // The underside has an independent cast lip and four little rubber supports.
  rim(s, 0x8c8190, seat, .92, .018, -.097, .53, .40);
  for (const x of [-.32, .32]) {
    bead(s, 0x685874, world, [x, -.64, .025], [.095, .105, .12], 20);
    bead(s, 0x968f83, world, [x, -.72, .095], [.105, .065, .135], 20);
    line(s, 0x726b68, world, [[x - .06, -.724, .175], [x, -.732, .19], [x + .06, -.724, .175]], .008, 10);
  }

  // Thick domed lid with a separately rolled perimeter and finished back.
  shell(s, 0xb2aa9b, lid, [[0, -.09], [.72, -.085], [.93, -.06], [1, -.02], [1.02, .015],
    [.98, .06], [.86, .075], [0, .075]], .43, .50);
  shell(s, 0xe8e4da, lid, [[0, .082], [.82, .082], [.91, .072], [.94, .06]].reverse() as [number, number][], .43, .50);
  rim(s, 0xc8baa0, lid, .96, .012, .066, .43, .50);
  // Glaze wear follows the rim rather than covering it with a flat texture.
  for (let i = 0; i < 15; i++) {
    const a = i * 2.399, r = .79 + .08 * Math.sin(i * 1.7);
    const x = Math.cos(a) * .53 * r, y = Math.sin(a) * .40 * r;
    bead(s, i % 3 === 0 ? 0xa99b7d : 0xc4b494, seat, [x, y, .091], [.025 + (i % 3) * .008, .022, .004], 8);
    if (i % 3 === 0) line(s, 0xa89d86, seat,
      [[x, y, .09], [x + .007, y - .027, .092], [x - .002, y - .045, .092]], .005, 8);
  }
  for (let i = 0; i < 7; i++) {
    const x = -.31 + i * .10, y = Math.sqrt(1 - (x / .43) ** 2) * .48;
    line(s, i % 2 ? 0xb5a68c : 0xc6b99e, lid,
      [[x, y, .068], [x + .008, y - .09, .084], [x + .004, y - .20 + .02 * (i % 3), .087]], .007, 14);
  }
  // The expressive pale eyes sit on the actual lid, not on the lower seat.
  for (const x of [-.17, .17]) {
    bead(s, 0x777781, lid, [x, -.18, .085], [.072, .09, .025], 20);
    bead(s, 0xe8edf1, lid, [x, -.174, .106], [.052, .067, .022], 20);
    bead(s, 0x172032, lid, [x + .004, -.18, .124], [.023, .037, .012], 16);
    bead(s, 0xffffff, lid, [x - .008, -.16, .135], [.01, .014, .005], 10);
    line(s, 0x938c84, lid, [[x - .045, -.27, .084], [x, -.28, .087], [x + .045, -.26, .085]], .006, 12);
  }
  for (const x of [-.17, .17]) {
    hinge(s, world, x, -.115, -.19, 0xa99c85);
    s.roundedBox(0xbeb39d, x, -.15, -.19, .075, .15, .055, .018);
  }
  // Back stamp and reinforcing ridge are visible when the viewer rotates it.
  rim(s, 0x988f80, lid, .79, .008, -.087, .43, .50);
  part(s, 0xbeb8ab, new THREE.BoxGeometry(.12, .035, .008), lid, [0, -.22, -.092]);
  return s.finish();
}

/** #120 — hinged gilt compact with a crowned mirror and deep pink powder pan. */
function compact() {
  const s = new Sculpt({ detail: "high" });
  const base = frame([.12, -.29, .10], [-.58, 0, -.05]);
  const lid = frame([-.29, .41, -.18], [-.13, -.12, -.40]);
  const world = frame([0, 0, 0]);
  shell(s, 0x8f346b, base, [[0, -.12], [.70, -.12], [.92, -.10], [.995, -.055], [1.01, 0],
    [.99, .045], [.93, .055], [.87, .027], [.85, -.015], [0, -.015]], .55, .48);
  shell(s, 0xe763a1, base, [[.98, -.08], [1.017, -.055], [1.027, -.012], [1.013, .022], [.99, .035]], .55, .48);
  rim(s, 0xc69b45, base, .95, .031, .046, .55, .48);
  rim(s, 0xffdf86, base, .955, .010, .073, .55, .48);
  rim(s, 0x71345d, base, .91, .009, .025, .55, .48);
  // Shallowly crowned powder is a full volume; micro-grain complements the
  // existing packed PBR normal/roughness map rather than introducing a pass.
  bead(s, 0xf583b7, base, [0, 0, .012], [.48, .415, .056], 40);
  for (let i = 0; i < 68; i++) {
    const a = i * 2.399963, r = .14 + .71 * Math.sqrt((i + .5) / 68);
    const x = Math.cos(a) * .48 * r, y = Math.sin(a) * .415 * r;
    // Keep the expression clear of granules.
    if (Math.abs(y + .01) < .14 && Math.abs(x) < .32) continue;
    const z = .012 + .056 * Math.sqrt(1 - r * r);
    bead(s, i % 3 ? 0xff9ecb : 0xd66e9c, base, [x, y, z + .001], [.005 + i % 3 * .002, .0045, .0018], 6);
  }
  for (const sign of [-1, 1]) {
    const x = sign * .19;
    bead(s, 0x682d57, base, [x, -.035, .065], [.12, .10, .021], 20);
    bead(s, 0xffe6de, base, [x, -.047, .082], [.091, .067, .014], 20);
    bead(s, 0xe7b136, base, [x - sign * .01, -.046, .095], [.038, .06, .010], 16);
    bead(s, 0x25172d, base, [x - sign * .01, -.045, .103], [.014, .049, .006], 12);
    bead(s, 0xfff4d8, base, [x - sign * .022, -.022, .11], [.01, .014, .004], 10);
    // Thick curved upper lids and swept lashes preserve the original look.
    line(s, 0x7c3269, base, [[x - .106, .002, .092], [x, .018, .101], [x + .103, -.006, .091]], .018, 16);
    line(s, 0xb75390, base, [[x - .10, .116, .065], [x, .145, .061], [x + .09, .105, .069]], .018, 16);
    line(s, 0x53254c, base, [[x + sign * .09, .003, .09], [x + sign * .125, .023, .09], [x + sign * .14, .057, .085]], .009, 10);
  }
  line(s, 0xc86094, base, [[-.04, -.20, .064], [0, -.216, .065], [.045, -.195, .064]], .006, 12);

  // The open lid is separately curved on both sides and held by a real hinge.
  shell(s, 0xab7632, lid, [[0, -.075], [.78, -.071], [.95, -.047], [1.005, -.012], [1.005, .024],
    [.96, .056], [.88, .063], [.84, .027], [0, .027]], .39, .48);
  rim(s, 0xf4cf6d, lid, .965, .017, .049, .39, .48);
  rim(s, 0x9d622d, lid, .87, .009, .045, .39, .48);
  bead(s, 0xb779ad, lid, [0, 0, .025], [.337, .415, .028], 40);
  // Broad curved reflection accents stay attached to the crowned mirror.
  line(s, 0xe6b8de, lid, [[-.23, -.23, .041], [-.08, -.08, .053], [.08, .09, .052], [.21, .25, .042]], .012, 28);
  line(s, 0xd79bce, lid, [[-.15, -.30, .040], [.015, -.14, .052], [.19, .05, .047]], .022, 24);
  line(s, 0xffe8f7, lid, [[-.22, .17, .045], [-.17, .25, .046], [-.105, .30, .044]], .023, 16);
  rim(s, 0xdba34e, lid, .75, .007, -.072, .39, .48);
  // Cast back engraving: fine concentric ornament, no flat back placeholder.
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    line(s, 0xc38c43, lid, [[0, 0, -.078], [Math.cos(a - .2) * .12, Math.sin(a - .2) * .14, -.076],
      [Math.cos(a) * .23, Math.sin(a) * .28, -.073]], .006, 14);
  }
  hinge(s, world, -.17, .07, -.17, 0xeac777);
  s.roundedBox(0xa1743c, -.17, .015, -.18, .15, .12, .07, .02, 0, 0, -.25);
  // Gilt clasp at the lower rim and two tiny side closure pins.
  bead(s, 0xa86e32, base, [0, -.48, .015], [.077, .09, .05], 20);
  bead(s, 0xffd97d, base, [0, -.474, .05], [.05, .061, .032], 20);
  bead(s, 0x935d2d, base, [0, -.47, .077], [.018, .028, .008], 12);
  for (const x of [-.548, .548]) bead(s, 0xea81ae, base, [x, 0, -.02], [.029, .056, .03], 16);
  return s.finish();
}

export const SCULPTS_O_HINGED: Record<string, () => THREE.BufferGeometry> = {
  mon_seatring: seatring,
  mon_compact: compact,
};
