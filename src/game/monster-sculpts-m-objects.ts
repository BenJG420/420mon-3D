import * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number, number, number];
type Ring = { r: number; y: number; x?: number; z?: number; depth?: number };

/** Closed, smooth volumes with a movable centre line; the flame and rubber drops
 * are round at the back as well as at the illustrated front. */
function roundVolume(profile: Ring[], segments = 40) {
  const points: number[] = [], indices: number[] = [];
  for (const ring of profile) for (let j = 0; j < segments; j++) {
    const a = j / segments * Math.PI * 2;
    points.push((ring.x ?? 0) + Math.cos(a) * ring.r, ring.y, (ring.z ?? 0) + Math.sin(a) * ring.r * (ring.depth ?? 1));
  }
  for (let i = 0; i < profile.length - 1; i++) for (let j = 0; j < segments; j++) {
    const a = i * segments + j, b = a + segments, c = i * segments + (j + 1) % segments, d = c + segments;
    indices.push(a, b, c, c, b, d);
  }
  for (const top of [false, true]) {
    const ring = profile[top ? profile.length - 1 : 0], start = top ? (profile.length - 1) * segments : 0;
    const center = points.length / 3;
    points.push(ring.x ?? 0, ring.y, ring.z ?? 0);
    for (let j = 0; j < segments; j++) {
      const a = start + j, b = start + (j + 1) % segments;
      indices.push(...(top ? [center, b, a] : [center, a, b]));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function oval(s: Sculpt, color: string, p: P, radii: P, width = 20, height = 12, rotation: P = [0, 0, 0]) {
  const g = new THREE.SphereGeometry(1, width, height);
  g.scale(...radii).rotateX(rotation[0]).rotateY(rotation[1]).rotateZ(rotation[2]).translate(...p);
  s.surface(color, g);
}

/** Small rounded detail, with the ends buried in the adjoining casting. */
function cord(s: Sculpt, color: string, points: P[], radius: number, segments = 20, sides = 8) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  s.surface(color, new THREE.TubeGeometry(curve, segments, radius, sides, false));
}

function transformed(g: THREE.BufferGeometry, position: P, rz = 0) {
  return g.rotateZ(rz).translate(...position);
}

/** Thick, rounded rectangular walls. The profile doubles back down the inside,
 * leaving a genuine opening in the lighter lid. */
function lidWalls() {
  const profile = [
    [-.265, .151, .186, .029], [-.249, .164, .199, .037],
    [.239, .164, .199, .037], [.262, .151, .186, .032],
    [.237, .127, .162, .025], [-.243, .127, .162, .025],
    [-.265, .137, .172, .025], [-.265, .151, .186, .029],
  ];
  const vertices: number[] = [], indices: number[] = [], n = 36;
  for (const [y, w, d, r] of profile) for (let corner = 0; corner < 4; corner++) {
    const cx = corner === 0 || corner === 3 ? w - r : -w + r;
    const cz = corner < 2 ? d - r : -d + r;
    for (let j = 0; j <= 8; j++) {
      const a = corner * Math.PI / 2 + j * Math.PI / 16;
      vertices.push(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r);
    }
  }
  for (let i = 0; i < profile.length - 1; i++) for (let j = 0; j < n; j++) {
    const a = i * n + j, b = a + n, c = i * n + (j + 1) % n, d = c + n;
    indices.push(a, b, c, c, b, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}

/** #103: the original silver flip-top lighter, including its angled open lid. */
function flicker() {
  const s = new Sculpt({ detail: "high" });
  const silver = "#a8a9b0", pale = "#d8d8dc", seam = "#656773";
  s.roundedBox("#787b87", 0, .421, 0, .63, .756, .376, .055);
  s.roundedBox(silver, 0, .43, .012, .594, .722, .378, .045);
  s.roundedBox("#bfc0c7", 0, .429, .199, .526, .654, .014, .018);
  s.roundedBox("#9699a3", 0, .429, -.192, .515, .646, .013, .018);
  // A rolled lower edge and the source's little rectangular bottom catch.
  s.roundedBox("#d2d3d7", 0, .075, .014, .573, .054, .348, .019);
  s.roundedBox(seam, 0, .092, .207, .186, .091, .024, .009);
  s.roundedBox("#c8c9cf", 0, .097, .222, .154, .07, .018, .008);
  s.rod("#f0eff0", [-.065, .123, .233], [.065, .123, .233], .004);
  // The cap is a metal shell, open underneath; its rounded roof closes the far end.
  const lid: P = [-.465, 1.113, -.006], angle = -.43;
  const lp = (x: number, y: number, z: number): P => [lid[0] + x * Math.cos(angle) - y * Math.sin(angle), lid[1] + x * Math.sin(angle) + y * Math.cos(angle), lid[2] + z];
  s.surface("#a4a5ae", transformed(lidWalls(), lid, angle));
  s.roundedBox("#c7c7ce", ...lp(0, .247, 0), .304, .038, .365, .016, 0, 0, angle);
  s.roundedBox("#6b6d77", ...lp(0, .224, 0), .241, .016, .311, .007, 0, 0, angle);
  s.roundedBox("#bfc0c7", ...lp(0, -.002, .201), .258, .455, .012, .009, 0, 0, angle);
  s.rod("#ecebf0", lp(-.137, -.211, .193), lp(-.137, .214, .193), .006);
  s.rod("#e1e0e5", lp(-.108, .244, .187), lp(.108, .244, .187), .005);
  s.rod("#6b6d77", lp(.143, -.22, .19), lp(.143, .21, .19), .004);
  // Three hinge knuckles, their axle, and the sprung linkage between lid and body.
  s.rod("#555862", [-.327, .806, -.194], [-.327, .806, .203], .031);
  for (let i = 0; i < 3; i++) s.rod(i % 2 ? "#92959f" : "#c6c7cc", [-.327, .806, -.173 + i * .124], [-.327, .806, -.075 + i * .124], .046);
  s.rod("#d0d1d6", [-.333, .814, -.08], lp(.125, -.234, -.08), .022);
  s.rod("#777b87", [-.333, .814, .09], lp(.125, -.234, .09), .017);
  // Open, punched windscreen: the small dark bores are real holes through metal.
  const guard = new THREE.Shape();
  guard.moveTo(-.135, .801); guard.lineTo(.203, .801); guard.lineTo(.203, .904);
  guard.quadraticCurveTo(.203, .925, .184, .925); guard.lineTo(-.117, .925);
  guard.quadraticCurveTo(-.135, .925, -.135, .906); guard.closePath();
  for (const y of [.834, .885]) for (const x of [-.094, -.024, .046, .116, .175]) {
    const hole = new THREE.Path(); hole.absarc(x, y, .0105, 0, Math.PI * 2, true); guard.holes.push(hole);
  }
  const screen = new THREE.ExtrudeGeometry(guard, { depth: .012, bevelEnabled: true, bevelSize: .003, bevelThickness: .003, bevelSegments: 2, curveSegments: 8 });
  s.surface("#c9cbd0", screen.translate(0, 0, -.098));
  s.roundedBox("#737780", .036, .808, .015, .365, .034, .251, .012);
  s.rod("#48494c", [.035, .821, .021], [.035, .951, .021], .023);
  s.rod("#ab9b7c", [.035, .907, .021], [.035, .957, .021], .015);
  s.rod("#555b63", [-.184, .857, -.099], [-.184, .857, .111], .062);
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2, x = -.184 + Math.cos(a) * .062, y = .857 + Math.sin(a) * .062;
    s.rod(i % 2 ? "#979ba3" : "#c6c8cc", [x, y, -.102], [x, y, .112], .006);
  }
  s.rod("#dedfe1", [-.184, .857, .114], [-.184, .857, .126], .023);
  // The flame is a collection of tapered, rounded tongues, not a flat silhouette.
  s.surface("#f57810", roundVolume([
    { r: .016, y: .937, x: .036 }, { r: .053, y: .963, x: .035 },
    { r: .079, y: 1.005, x: .031, depth: .75 }, { r: .069, y: 1.053, x: .025, depth: .68 },
    { r: .052, y: 1.101, x: .032, depth: .62 }, { r: .033, y: 1.145, x: .049, depth: .62 },
    { r: .015, y: 1.188, x: .056 }, { r: .002, y: 1.235, x: .043 },
  ]));
  s.surface("#ff9e16", roundVolume([
    { r: .028, y: .968, x: -.018, z: .009 }, { r: .031, y: 1.019, x: -.029 },
    { r: .023, y: 1.069, x: -.048 }, { r: .002, y: 1.124, x: -.062 },
  ], 28));
  s.surface("#ffad19", roundVolume([
    { r: .027, y: .97, x: .08 }, { r: .025, y: 1.021, x: .091 },
    { r: .017, y: 1.062, x: .112 }, { r: .002, y: 1.106, x: .108 },
  ], 28));
  s.surface("#ffd62f", roundVolume([
    { r: .013, y: .946, x: .034, z: .038 }, { r: .045, y: .985, x: .034, z: .044, depth: .6 },
    { r: .041, y: 1.027, x: .032, z: .046, depth: .57 }, { r: .025, y: 1.076, x: .042, z: .038, depth: .54 },
    { r: .003, y: 1.149, x: .054, z: .025 },
  ], 32));
  s.surface("#fff3a0", roundVolume([
    { r: .009, y: .951, x: .032, z: .062 }, { r: .022, y: .984, x: .029, z: .067, depth: .42 },
    { r: .016, y: 1.023, x: .034, z: .065, depth: .44 }, { r: .002, y: 1.066, x: .04, z: .058 },
  ], 24));
  // Flat, dark eyes belong to the lower case, with tiny white source-art glints.
  for (const side of [-1, 1]) {
    const x = side * .132;
    oval(s, "#666974", [x, .449, .208], [.074, .09, .015]);
    oval(s, "#202128", [x, .449, .221], [.058, .072, .021]);
    oval(s, "#f0f1ec", [x - .017, .477, .24], [.021, .025, .007], 16, 10);
    oval(s, "#9b9ca2", [x + .014, .422, .24], [.011, .009, .004], 12, 8);
  }
  // Brushed seams and short, irregular scratches wrap onto the side and rear.
  for (const side of [-1, 1]) {
    s.rod("#e0e0e4", [side * .265, .158, .204], [side * .265, .706, .204], .0035);
    for (let i = 0; i < 5; i++) {
      const y = .182 + i * .112;
      s.rod(i % 2 ? "#c2c3ca" : "#828693", [side * .307, y, -.082], [side * .307, y + .033, -.028], .003);
    }
  }
  for (let i = 0; i < 13; i++) {
    const x = -.23 + ((i * 7) % 13) * .037, y = .173 + (i % 4) * .147;
    s.rod(i % 3 ? "#d8d8dd" : "#92959e", [x, y, .208], [x + .012 + (i % 3) * .007, y + .024, .208], .0027);
  }
  for (let i = 0; i < 5; i++) s.rod("#b1b4bd", [-.19 + i * .083, .307, -.2], [-.165 + i * .083, .362, -.2], .003);
  const geometry = s.finish(), colors = geometry.getAttribute("color"), glow = new Float32Array(colors.count);
  for (let i = 0; i < colors.count; i++) {
    const r = colors.getX(i), g = colors.getY(i), b = colors.getZ(i);
    glow[i] = r > .9 && g < .93 && b < .4 && r > g * 1.03 ? .35 + g * .65 : 0;
  }
  geometry.setAttribute("glowWeight", new THREE.Float32BufferAttribute(glow, 1));
  geometry.userData.glowSurface = true;
  geometry.userData.sculptFeatures = ["open-angled-hollow-silver-lid", "three-knuckle-hinge", "punched-windscreen", "knurled-striker-wheel", "round-local-glow-flame", "two-case-eyes", "brushed-metal-scratches", "bottom-catch"];
  return geometry;
}

/** #104: an open red suction cup carried by its narrow, knotted red handle. */
function plunger() {
  const s = new Sculpt({ detail: "high" });
  // Closed wall profile follows the exterior, rounded lip, basin and underside.
  s.lathe("#98281f", [[0,.823],[.119,.823],[.196,.851],[.274,.907],[.353,1.002],[.414,1.115],[.457,1.239],[.477,1.327],[.47,1.36],[.449,1.368],[.428,1.341],[.423,1.275],[.382,1.153],[.312,1.05],[.209,.977],[.105,.946],[0,.943]], 0, 0, 0);
  s.lathe("#bc3528", [[.009,.949],[.106,.951],[.209,.982],[.31,1.056],[.378,1.158],[.419,1.279],[.425,1.34]], 0, 0, 0);
  s.torus("#da4b32", 0, 1.35, 0, .45, .022, Math.PI / 2);
  s.torus("#6b221e", 0, 1.306, 0, .469, .01, Math.PI / 2);
  s.torus("#b93929", 0, 1.291, 0, .461, .008, Math.PI / 2);
  // Raised irregular rubber inside the bowl is visible through its open top.
  for (let i = 0; i < 15; i++) {
    const a = i * 2.39996, radius = .085 + (i % 4) * .07;
    const y = .96 + Math.pow(radius / .42, 1.9) * .32;
    oval(s, i % 3 ? "#c83d2b" : "#e05134", [Math.cos(a) * radius, y, Math.sin(a) * radius], [.033 + (i % 2) * .009, .011, .027], 12, 8);
  }
  // The original red handle has organic folds, rather than a separate wooden pole.
  s.surface("#8a241e", roundVolume([
    { r: .074, y: .155, depth: .88 }, { r: .093, y: .231, depth: .86 },
    { r: .118, y: .302, x: -.014, depth: .76 }, { r: .097, y: .378, x: -.01, depth: .82 },
    { r: .072, y: .451, x: .009 }, { r: .079, y: .544, x: .011, depth: .87 },
    { r: .088, y: .649, x: -.009, depth: .88 }, { r: .098, y: .735, x: -.007 },
    { r: .143, y: .83, depth: .82 }, { r: .17, y: .862, depth: .83 },
  ], 48));
  for (const side of [-1, 1]) {
    cord(s, "#b33425", [[side*.128,.836,.04],[side*.081,.707,.074],[side*.048,.602,.085],[side*.058,.484,.076],[side*.093,.371,.051]], .021, 24);
    cord(s, "#511d1c", [[side*.051,.77,.096],[side*.033,.664,.095],[side*.039,.567,.091],[side*.021,.474,.075]], .007, 20);
    cord(s, "#bc3b28", [[side*.049,.39,.09],[side*.111,.321,.051],[side*.084,.252,.069],[side*.12,.199,.04]], .02, 16);
    cord(s, "#5d201d", [[side*.048,.797,-.103],[side*.071,.651,-.077],[side*.041,.509,-.074],[side*.072,.366,-.065]], .008, 20);
    // Two feet emerge directly from the stem; three stubby toes on each match the art.
    oval(s, "#71251f", [side*.156,.113,.021], [.126,.069,.135]);
    oval(s, "#a63224", [side*.147,.145,.017], [.102,.048,.106]);
    for (let toe = 0; toe < 3; toe++) {
      const x = side*.158 + (toe-1)*.051;
      oval(s, toe === 1 ? "#a63325" : "#8b2b22", [x,.098,.123+(toe===1?.014:0)], [.036,.036,.063], 16, 10);
      s.rod("#4e211c", [x-.015,.119,.166], [x+.014,.117,.173], .0035);
    }
  }
  // Uneven little rubber drips remain attached to the lower edge of the cup.
  const drips: [number, number, number, number][] = [[-.363,1.035,.187,.173],[-.226,.927,.229,.158],[.116,.867,.178,.132],[.341,1.007,.215,.214],[-.283,.963,-.217,.113],[.282,.963,-.222,.146]];
  for (let i = 0; i < drips.length; i++) {
    const [x,y,z,length] = drips[i];
    s.surface(i%2 ? "#b43526" : "#8b251f", roundVolume([
      { r:.007, y:y-length, x:x+.006, z }, { r:.017, y:y-length+.021, x:x+.005, z:z+.004 },
      { r:.011, y:y-length+.053, x, z:z+.004 }, { r:.012, y:y-.037, x:x-.007, z },
      { r:.024, y, x, z:z-.009 },
    ], 20));
  }
  // Moulded folds track the rounded cup, continuing around the back.
  for (let i = 0; i < 13; i++) {
    const a = i / 13 * Math.PI * 2;
    const at = (r: number, y: number, offset = 0): P => [Math.cos(a+offset)*r,y,Math.sin(a+offset)*r];
    cord(s, i % 3 ? "#b53525" : "#6d231e", [at(.451,1.236),at(.413,1.123,.012),at(.349,1.008,-.018),at(.273,.914,.009)], .006, 16);
  }
  for (const side of [-1, 1]) {
    const x = side * .207;
    const rotation: P = [.43,side*.26,0];
    const eyePoint=(dx:number,dy:number,depth:number):P=>new THREE.Vector3(dx,dy,depth).applyAxisAngle(new THREE.Vector3(1,0,0),rotation[0]).applyAxisAngle(new THREE.Vector3(0,1,0),rotation[1]).add(new THREE.Vector3(x,1.113,.356)).toArray() as P;
    // The eyes follow the sloping bowl wall; their lower edges stay attached.
    oval(s, "#571e18", eyePoint(0,0,0), [.086,.1,.035],20,12,rotation);
    oval(s, "#b88345", eyePoint(0,0,.027), [.065,.077,.018],20,12,rotation);
    oval(s, "#171413", eyePoint(0,0,.044), [.051,.063,.018],20,12,rotation);
    oval(s, "#ffdf9c", eyePoint(-.014,.025,.061), [.019,.021,.006],16,10,rotation);
    oval(s, "#8f6940", eyePoint(.012,-.027,.061), [.008,.01,.004],12,8,rotation);
    cord(s,"#c13a29",[[x-side*.076,1.196,.329],[x,1.218,.344],[x+side*.069,1.195,.313]],.009,14);
  }
  // Shallow red scuffs retain the rubber material without adding alien metal fittings.
  for (let i=0;i<12;i++) {
    const a=.34+i*2.39996, r=.461, y=1.261+(i%3)*.012;
    s.rod(i%3 ? "#d2462e" : "#7d241f",[Math.cos(a)*r,y,Math.sin(a)*r],[Math.cos(a+.045)*r,y+.005,Math.sin(a+.045)*r],.003);
  }
  const geometry = s.finish();
  geometry.userData.sculptFeatures = ["deep-open-red-suction-basin", "rounded-rubber-lip", "textured-inner-bowl", "two-rimmed-cup-eyes", "six-attached-rubber-drips", "folded-red-handle", "two-three-toed-feet", "rear-moulded-folds"];
  return geometry;
}

/** A thick glass wall around the sides and back leaves the clear front sightline
 * open, so the existing single opaque PBR draw can show the liquid inside. */
function glassWall() {
  const profile = [[.327,.224],[.341,.255],[.345,1.14],[.339,1.17],[.323,1.17],[.326,1.135],[.323,.263],[.313,.244]];
  const vertices:number[]=[], indices:number[]=[], n=64, start=1.31, extent=Math.PI*2-start*2;
  for(const [r,y] of profile) for(let j=0;j<=n;j++) {
    const a=start+j/n*extent;
    vertices.push(Math.sin(a)*r,y,Math.cos(a)*r);
  }
  for(let i=0;i<profile.length;i++) for(let j=0;j<n;j++) {
    const a=i*(n+1)+j,b=((i+1)%profile.length)*(n+1)+j,c=a+1,d=b+1;
    indices.push(a,c,b,c,d,b);
  }
  // Close both narrow exposed vertical edges of the thick wall.
  for(const right of [false,true]) {
    const row=right?n:0;
    for(let i=1;i<profile.length-1;i++) {
      const a=row,b=i*(n+1)+row,c=(i+1)*(n+1)+row;
      indices.push(...(right?[a,c,b]:[a,b,c]));
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function pouringRim() {
  const vertices:number[]=[],indices:number[]=[],n=80,m=10;
  for(let j=0;j<n;j++) {
    const a=j/n*Math.PI*2,spout=.094*Math.pow(Math.max(0,-Math.cos(a)),28);
    for(let k=0;k<m;k++) {
      const b=k/m*Math.PI*2,r=.347+spout+Math.cos(b)*.026;
      vertices.push(Math.cos(a)*r,1.181+Math.sin(b)*.02+spout*.11,Math.sin(a)*r);
    }
  }
  for(let j=0;j<n;j++)for(let k=0;k<m;k++) {
    const a=j*m+k,b=((j+1)%n)*m+k,c=j*m+(k+1)%m,d=((j+1)%n)*m+(k+1)%m;
    indices.push(a,c,b,c,d,b);
  }
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function liquidTop() {
  const vertices:number[]=[],indices:number[]=[],n=64,rings=8;
  const height=(a:number,r:number)=>.802+.023*Math.sin(a*2+.5)*(r/.308)+.007*Math.cos(a*3)*(r/.308);
  vertices.push(0,.802,0);
  for(let i=1;i<=rings;i++)for(let j=0;j<n;j++) {
    const a=j/n*Math.PI*2,r=i/rings*.308;
    vertices.push(Math.cos(a)*r,height(a,r),Math.sin(a)*r);
  }
  for(let j=0;j<n;j++)indices.push(0,1+(j+1)%n,1+j);
  for(let i=0;i<rings-1;i++)for(let j=0;j<n;j++) {
    const a=1+i*n+j,b=1+(i+1)*n+j,c=1+i*n+(j+1)%n,d=1+(i+1)*n+(j+1)%n;
    indices.push(a,c,b,c,d,b);
  }
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

/** #105: a pale glass measuring beaker, green fill and two tiny glass feet. */
function beakerling() {
  const s=new Sculpt({detail:"high"});
  for(const side of [-1,1]) {
    oval(s,"#8e96b7",[side*.263,.105,.008],[.133,.051,.151]);
    oval(s,"#d3dff0",[side*.266,.132,.016],[.12,.045,.137]);
    oval(s,"#f0f4f4",[side*.282,.145,.068],[.084,.024,.084],16,10);
    cord(s,"#b7c8e5",[[side*.315,.166,.015],[side*.258,.176,.032],[side*.198,.168,.039]],.008,12);
  }
  s.surface("#b2cae0",glassWall());
  // A substantial, closed glass heel under the green volume gives the vessel depth.
  s.lathe("#93accb",[[0,.195],[.278,.195],[.321,.214],[.337,.241],[.333,.265],[.312,.281],[.29,.252],[0,.252]],0,0,0);
  s.lathe("#d8e8ec",[[.29,.225],[.322,.226],[.337,.242],[.332,.259],[.315,.268],[.306,.253],[.29,.225]],0,0,0);
  s.surface("#7fc313",roundVolume([
    {r:.259,y:.245},{r:.289,y:.256},{r:.307,y:.281},{r:.308,y:.346},
    {r:.308,y:.495},{r:.308,y:.647},{r:.307,y:.772},
  ],64));
  s.lathe("#6bb40e",[[.001,.248],[.263,.248],[.291,.262],[.306,.285],[.308,.307]],0,0,0);
  // A wavy meniscus has an actual top surface and a closed skirt to the liquid.
  const liquid=liquidTop();
  s.surface("#a1d72b",liquid);
  const skirt:number[]=[],faces:number[]=[],n=64;
  for(let i=0;i<n;i++) {
    const a=i/n*Math.PI*2,x=Math.cos(a)*.308,z=Math.sin(a)*.308,y=.802+.023*Math.sin(a*2+.5)+.007*Math.cos(a*3);
    skirt.push(x,.77,z,x,y,z);
  }
  for(let i=0;i<n;i++) {
    const a=i*2,b=((i+1)%n)*2;
    faces.push(a,a+1,b,b,a+1,b+1);
  }
  const skirtGeometry=new THREE.BufferGeometry();skirtGeometry.setAttribute("position",new THREE.Float32BufferAttribute(skirt,3));skirtGeometry.setIndex(faces);skirtGeometry.computeVertexNormals();s.surface("#92cf1c",skirtGeometry);
  const meniscus:P[]=[];
  for(let i=0;i<=32;i++) {
    const a=.04+i/32*(Math.PI-.08),y=.802+.023*Math.sin(a*2+.5)+.007*Math.cos(a*3);
    meniscus.push([Math.cos(a)*.309,y+.003,Math.sin(a)*.309]);
  }
  cord(s,"#d5ed69",meniscus,.007,40,8);
  s.surface("#c7c8e2",pouringRim());
  // The lip follows the left pouring spout, rather than a circular decorative hoop.
  const lip:P[]=[];
  for(let i=0;i<=80;i++) {
    const a=i/80*Math.PI*2,spout=.094*Math.pow(Math.max(0,-Math.cos(a)),28),r=.353+spout;
    lip.push([Math.cos(a)*r,1.198+spout*.11,Math.sin(a)*r]);
  }
  cord(s,"#f0f4f7",lip,.0075,80,8);
  for(const side of [-1,1]) {
    s.rod("#e4f2f4",[side*.329,.285,.086],[side*.333,1.146,.088],.011);
    s.rod("#7fa1c5",[side*.343,.288,.037],[side*.346,1.145,.037],.0045);
    s.rod("#f5f8f5",[side*.286,.92,.18],[side*.286,1.097,.18],.009);
    s.rod("#c9e8e9",[side*.304,.596,.112],[side*.304,.718,.112],.004);
  }
  // Fine white graduations sit on the front wall and follow the cylindrical depth.
  const frontZ=(x:number)=>Math.sqrt(.322*.322-x*x)+.008;
  s.rod("#f0f3d6",[-.243,.466,frontZ(-.243)],[-.243,.91,frontZ(-.243)],.0045);
  for(let i=0;i<7;i++) {
    const y=.476+i*.065,x1=-.244,x2=i%2?-.193:-.166;
    cord(s,i>4?"#ecf4ef":"#e5efa1",[[x1,y,frontZ(x1)],[(x1+x2)/2,y,frontZ((x1+x2)/2)],[x2,y,frontZ(x2)]],.0045,8,8);
  }
  // Two unobtrusive bubbles and pale glass scuffs add depth without obscuring the eyes.
  oval(s,"#abd843",[.166,.672,.242],[.015,.018,.009],12,8);
  oval(s,"#d0e98b",[.169,.679,.25],[.005,.006,.003],12,8);
  oval(s,"#99d025",[-.037,.571,.302],[.01,.012,.005],12,8);
  for(const side of [-1,1]) {
    const x=side*.126,z=.292;
    oval(s,"#4f781e",[x,.387,z],[.066,.075,.019]);
    oval(s,"#1d2419",[x,.389,z+.015],[.052,.061,.019]);
    oval(s,"#ffffdc",[x-.015,.411,z+.033],[.02,.021,.006],16,10);
    oval(s,"#8da73e",[x+.013,.365,z+.033],[.009,.011,.004],12,8);
  }
  for(let i=0;i<5;i++) {
    const x=-.2+i*.095;
    s.rod("#d3e3eb",[x,.965,-Math.sqrt(.345*.345-x*x)-.001],[x+.017,1.023,-Math.sqrt(.345*.345-(x+.017)*(x+.017))-.001],.0025);
  }
  const geometry=s.finish();
  geometry.userData.sculptFeatures=["thick-pale-glass-vessel", "left-pouring-spout", "open-clear-front-sightline", "green-volume-with-wavy-meniscus", "seven-raised-measure-ticks", "two-low-liquid-eyes", "two-pale-glass-feet", "glass-edge-reflections"];
  return geometry;
}

export const SCULPTS_M_OBJECTS: Record<string, () => THREE.BufferGeometry> = {
  mon_flicker: flicker,
  mon_plunger: plunger,
  mon_beakerling: beakerling,
};
