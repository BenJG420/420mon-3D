import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { FishDef } from "./data/fish";

export type AquariumFishForm = "carp" | "perch" | "trout" | "eel" | "flatfish" | "catfish" | "shark" | "sturgeon" | "longfin" | "goby";

/** The original catalogue supplies identity/palette; names supply aquatic anatomy. */
export function aquariumFishForm(fish: FishDef): AquariumFishForm {
  const id = fish.id;
  if (/aal|muraene/.test(id)) return "eel";
  if (/hai/.test(id)) return "shark";
  if (/wels/.test(id)) return "catfish";
  if (/butt/.test(id)) return "flatfish";
  if (/stoer/.test(id)) return "sturgeon";
  if (/flosse/.test(id)) return "longfin";
  if (/forelle|lachs|dorsch/.test(id)) return "trout";
  if (/hecht|zander|barsch|glutschuppe/.test(id)) return "perch";
  if (/grundel|filterling|ploetze/.test(id)) return "goby";
  return "carp";
}

type Profile = { height: number; width: number; nose: number; tail: number; speed: number; bend: number };
const PROFILES: Record<AquariumFishForm, Profile> = {
  carp: { height: .19, width: .105, nose: .47, tail: -.4, speed: 5.8, bend: .9 },
  perch: { height: .15, width: .086, nose: .51, tail: -.4, speed: 6.8, bend: 1 },
  trout: { height: .125, width: .09, nose: .52, tail: -.4, speed: 6.3, bend: 1 },
  eel: { height: .075, width: .064, nose: .56, tail: -.61, speed: 4.7, bend: 1.4 },
  flatfish: { height: .052, width: .245, nose: .43, tail: -.38, speed: 4.3, bend: .65 },
  catfish: { height: .12, width: .14, nose: .48, tail: -.42, speed: 5.1, bend: 1 },
  shark: { height: .12, width: .105, nose: .54, tail: -.43, speed: 5.6, bend: 1 },
  sturgeon: { height: .105, width: .086, nose: .56, tail: -.42, speed: 5.1, bend: .8 },
  longfin: { height: .16, width: .075, nose: .42, tail: -.32, speed: 5, bend: 1 },
  goby: { height: .11, width: .1, nose: .45, tail: -.36, speed: 6.6, bend: 1.1 },
};

const clamp = THREE.MathUtils.clamp;
const point = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function hash(id: string) { let h = 0; for (const c of id) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; }

/** Three bounded material draws, smooth closed bodies and genuinely volumetric details.
 * All parts share one travelling bend, including the eyes, gills and fin roots.
 * No texture fetch, external model, canvas, cached ownership or per-frame geometry work.
 */
export function createAquariumFish(fish: FishDef, index: number) {
  const root = new THREE.Group();
  const form = aquariumFishForm(fish), profile = PROFILES[form], seed = hash(fish.id);
  root.name = `aquarium-fish-${fish.id}`;
  root.userData.fishId = fish.id; root.userData.form = form;
  root.userData.swimEnvelope = { length: 1.35, height: .8, depth: .8 };
  const base = new THREE.Color(fish.main), accent = new THREE.Color(fish.acc);
  const belly = base.clone().lerp(new THREE.Color(0xe5e0c3), .64);
  const dark = base.clone().multiplyScalar(.28), black = new THREE.Color(0x081014);
  const finColor = base.clone().lerp(accent, .57);
  const buckets: THREE.BufferGeometry[][] = [[], [], []];
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.MeshPhysicalMaterial[] = [];
  const clock = { value: 0 }, phase = (seed % 1000) / 91 + index * .17;
  const motion = { value: new THREE.Vector4(profile.speed, profile.bend, phase, seed % 19) };
  const pattern = { value: new THREE.Vector2(
    form === "eel" || form === "catfish" || form === "shark" ? .018 : .075,
    form === "trout" || form === "flatfish" || form === "eel" ? .24 : .06,
  ) };
  let disposed = false;

  function add(geometry: THREE.BufferGeometry, bucket: number, color: THREE.Color, fin = 0) {
    const positions = geometry.getAttribute("position");
    const colors = new Float32Array(positions.count * 3);
    const weights = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i++) {
      colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
      weights[i] = fin;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("finWeight", new THREE.BufferAttribute(weights, 1));
    if (!geometry.getAttribute("uv")) geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(positions.count * 2), 2));
    buckets[bucket].push(geometry);
    return geometry;
  }
  function ellipsoid(x: number, y: number, z: number, rx: number, ry: number, rz: number, color: THREE.Color, bucket = 0) {
    const g = new THREE.SphereGeometry(1, 12, 8); g.scale(rx, ry, rz); g.translate(x, y, z); add(g, bucket, color);
  }
  function line(points: THREE.Vector3[], radius: number, color: THREE.Color, bucket = 2, fin = 0) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = add(new THREE.TubeGeometry(curve, Math.max(4, points.length * 2), radius, 4, false), bucket, color, fin);
    const weights = geometry.getAttribute("finWeight"), uv = geometry.getAttribute("uv");
    for (let i = 0; i < weights.count; i++) weights.setX(i, fin * uv.getX(i));
  }

  // Closed elliptical ring body with a caudal peduncle and rounded snout.
  const rings = form === "eel" ? 40 : 32, sides = 24;
  const positions: number[] = [], uv: number[] = [], indices: number[] = [], bodyColors: number[] = [];
  const radiusAt = (t: number) => {
    if (form === "eel") return Math.pow(Math.sin(Math.PI * t), .48) * (.32 + .68 * t);
    const bell = Math.pow(Math.sin(Math.PI * t), .63);
    return bell * (.42 + .58 * Math.min(1, t * 2.6));
  };
  for (let r = 0; r <= rings; r++) {
    const t = r / rings, x = THREE.MathUtils.lerp(profile.tail, profile.nose, t);
    const radius = Math.max(.003, radiusAt(t));
    for (let s = 0; s <= sides; s++) {
      const a = s / sides * Math.PI * 2, up = Math.cos(a);
      const y = up * profile.height * radius, z = Math.sin(a) * profile.width * radius;
      positions.push(x, y, z); uv.push(t, s / sides);
      const color = up < 0 ? base.clone().lerp(belly, Math.pow(-up, .7) * .9) : base.clone().multiplyScalar(1 - up * .33);
      const stripe = Math.exp(-Math.pow((up - .12) * 7, 2));
      color.lerp(accent, stripe * (form === "trout" || fish.dress === "spark" ? .62 : .2));
      if (form === "perch") color.multiplyScalar(.77 + .23 * Math.pow(Math.sin(t * Math.PI * 7 + seed % 4), 2));
      bodyColors.push(color.r, color.g, color.b);
      if (r < rings && s < sides) {
        const n = r * (sides + 1) + s;
        indices.push(n, n + 1, n + sides + 1, n + 1, n + sides + 2, n + sides + 1);
      }
    }
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  body.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); body.setIndex(indices); body.computeVertexNormals();
  add(body, 0, base); body.setAttribute("color", new THREE.Float32BufferAttribute(bodyColors, 3));

  // Ribbed membrane fans: several radial strips, curved rather than flat triangles.
  function fan(origin: THREE.Vector3, outline: THREE.Vector3[], color = finColor, strength = 1) {
    const rays = outline.length, steps = 4;
    const p: number[] = [], u: number[] = [], ix: number[] = [];
    for (let ray = 0; ray < rays; ray++) for (let step = 0; step <= steps; step++) {
      const t = step / steps, end = outline[ray];
      p.push(THREE.MathUtils.lerp(origin.x, end.x, t), THREE.MathUtils.lerp(origin.y, end.y, t), THREE.MathUtils.lerp(origin.z, end.z, t) + Math.sin(t * Math.PI) * .008);
      u.push(ray / (rays - 1), t);
      if (ray < rays - 1 && step < steps) {
        const n = ray * (steps + 1) + step;
        ix.push(n, n + 1, n + steps + 1, n + 1, n + steps + 2, n + steps + 1);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(u, 2)); g.setIndex(ix); g.computeVertexNormals();
    add(g, 1, color, strength);
    const colors = g.getAttribute("color"), weights = g.getAttribute("finWeight");
    for (let ray = 0; ray < rays; ray++) for (let step = 0; step <= steps; step++) {
      const n = ray * (steps + 1) + step, t = step / steps;
      const c = color.clone().lerp(belly, .2 * t).multiplyScalar(.82 + .18 * t);
      colors.setXYZ(n, c.r, c.g, c.b); weights.setX(n, t * strength);
    }
    for (let ray = 0; ray < rays; ray += 2) {
      const end = outline[ray], middle = origin.clone().lerp(end, .55); middle.z += .008;
      line([origin, middle, end], .0019, color.clone().lerp(belly, .35), 1, strength);
    }
  }
  if (form === "eel") {
    for (const sign of [-1, 1]) {
      const outline = Array.from({ length: 15 }, (_, i) => {
        const t = .06 + i / 14 * .72, r = radiusAt(t);
        return point(THREE.MathUtils.lerp(profile.tail, profile.nose, t), sign * (profile.height * r + .038 * Math.sin(t * Math.PI)), 0);
      });
      fan(point(-.12, sign * .018, 0), outline, finColor, .6);
    }
  } else {
    const tailX = profile.tail - .22;
    const tailHeight = form === "longfin" ? .28 : form === "shark" ? .245 : .18;
    const outline = Array.from({ length: 11 }, (_, i) => {
      const a = (i / 10 - .5) * Math.PI;
      const fork = form === "longfin" || form === "goby" ? .05 * Math.cos(a) : -.075 * Math.cos(a);
      return point(tailX - fork, Math.sin(a) * tailHeight * (form === "shark" && a > 0 ? 1.14 : 1), 0);
    });
    fan(point(profile.tail + .035, 0, 0), outline);
    const dorsal = form === "shark" ? .19 : form === "longfin" ? .16 : form === "flatfish" ? .018 : .105;
    const outlineDorsal = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8, x = -.29 + t * .43;
      const y = profile.height * radiusAt((x - profile.tail) / (profile.nose - profile.tail));
      return point(x, y + Math.sin(t * Math.PI) * dorsal * (form === "perch" && i % 2 ? .75 : 1), 0);
    });
    fan(point(-.06, profile.height * .6, 0), outlineDorsal);
    fan(point(-.19, -profile.height * .58, 0), [point(-.31, -.11, 0), point(-.3, -profile.height - .07, 0), point(-.18, -profile.height - .08, 0), point(-.06, -profile.height * .85, 0)]);
  }
  for (const sign of [-1, 1]) {
    const x = .14, rootY = -profile.height * .3, rootZ = profile.width * .75 * sign;
    const spread = form === "shark" ? .28 : form === "flatfish" ? .3 : .23;
    fan(point(x, rootY, rootZ), [point(.13, rootY - .02, spread * sign), point(.04, rootY - .075, spread * sign), point(-.07, rootY - .09, (spread - .035) * sign), point(-.12, rootY - .04, rootZ)], finColor, 1.3);
    if (form !== "eel" && form !== "flatfish") fan(point(-.12, -.08, sign * .065), [point(-.2, -.17, sign * .14), point(-.29, -.18, sign * .13), point(-.26, -.1, sign * .07)], finColor, .6);
  }

  // Two inset irises with gloss pupils; flatfish eyes sit on the upper surface.
  for (const sign of [-1, 1]) {
    const ex = profile.nose - (form === "eel" ? .11 : .14);
    const eyeY = form === "flatfish" ? .047 : profile.height * .35;
    const eyeZ = (form === "flatfish" ? .08 : profile.width * .72) * sign;
    const radius = form === "eel" ? .022 : .027;
    ellipsoid(ex, eyeY, eyeZ, radius, radius, radius * .6, accent.clone().lerp(belly, .45));
    ellipsoid(ex + .003, eyeY + (form === "flatfish" ? .013 : 0), eyeZ + (form === "flatfish" ? 0 : sign * .013), radius * .57, radius * .62, radius * .6, black, 2);
    ellipsoid(ex + .009, eyeY + .01 + (form === "flatfish" ? .014 : 0), eyeZ + sign * .021, .0045, .0045, .003, new THREE.Color(0xe8ffff), 2);
    const gx = profile.nose - .255, gz = profile.width * .91 * sign;
    if (form === "shark") {
      for (let slit = 0; slit < 4; slit++) line([point(gx - slit * .025, .065, gz), point(gx - .015 - slit * .025, 0, gz * 1.08), point(gx - slit * .025, -.052, gz)], .003, dark);
    } else line([point(gx, profile.height * .65, gz * .66), point(gx - .033, .01, gz * 1.05), point(gx, -profile.height * .65, gz * .73)], .0034, dark);
    line([point(profile.nose - .018, -.008, .012 * sign), point(profile.nose - .05, -.021, profile.width * .38 * sign), point(profile.nose - .1, -.026, profile.width * .51 * sign)], .0028, dark);
  }
  if (form === "catfish" || /barbe|karpfen|stoer/.test(fish.id)) {
    for (const sign of [-1, 1]) for (let i = 0; i < (form === "catfish" ? 2 : 1); i++) {
      line([point(profile.nose - .055, -.015, sign * .04), point(profile.nose - .025, -.045 - i * .025, sign * .12), point(profile.nose - .15 - i * .06, -.085, sign * (form === "catfish" ? .26 : .17))], .0032, belly, 1, .4);
    }
  }
  if (form === "sturgeon") {
    for (let i = 0; i < 8; i++) {
      const x = -.3 + i * .07, y = profile.height * radiusAt((x - profile.tail) / (profile.nose - profile.tail));
      const g = new THREE.ConeGeometry(.026, .042, 5); g.translate(x, y + .012, 0); add(g, 0, accent.clone().lerp(base, .3));
    }
  }

  const bendGLSL = `
    uniform float aquariumTime;
    uniform vec4 aquariumMotion;
    attribute float finWeight;
    varying vec2 vAquariumUv;
    varying float vAquariumFin;
    vec2 aquariumBend(float x) {
      float u = clamp((0.38 - x) / 1.05, 0.0, 1.0);
      float angle = aquariumTime * aquariumMotion.x + aquariumMotion.z - u * 6.0;
      float amp = (0.004 + 0.06 * u * u) * aquariumMotion.y;
      float slope = (cos(angle) * 6.0 * amp - sin(angle) * 0.12 * u * aquariumMotion.y) / 1.05;
      return vec2(sin(angle) * amp, x > 0.38 ? 0.0 : slope);
    }
  `;
  for (let bucket = 0; bucket < buckets.length; bucket++) {
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, vertexColors: true, metalness: bucket === 0 ? .12 : .02,
      roughness: bucket === 2 ? .13 : bucket === 1 ? .49 : .36,
      clearcoat: bucket === 2 ? 1 : .5, clearcoatRoughness: .19,
      side: bucket === 1 ? THREE.DoubleSide : THREE.FrontSide,
      sheen: bucket === 1 ? .3 : .12, sheenColor: accent, sheenRoughness: .6,
    });
    material.name = `aquarium-${["skin", "fins", "eyes"][bucket]}`;
    material.onBeforeCompile = shader => {
      shader.uniforms.aquariumTime = clock;
      shader.uniforms.aquariumMotion = motion;
      shader.uniforms.aquariumPattern = pattern;
      shader.vertexShader = bendGLSL + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nobjectNormal.x -= aquariumBend(position.x).y * objectNormal.z;");
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
        transformed.z += aquariumBend(position.x).x;
        transformed.y += sin(aquariumTime * 7.4 + position.x * 13.0 + aquariumMotion.z) * finWeight * 0.011;
        vAquariumUv = uv; vAquariumFin = finWeight;
      `);
      shader.fragmentShader = "uniform vec4 aquariumMotion; uniform vec2 aquariumPattern; varying vec2 vAquariumUv; varying float vAquariumFin;\n" + shader.fragmentShader;
      if (bucket === 0) {
        shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
          vec2 scaleUv = vAquariumUv * vec2(42.0, 22.0);
          scaleUv.x += mod(floor(scaleUv.y), 2.0) * 0.5;
          vec2 cell = fract(scaleUv) - 0.5;
          float scaleRim = smoothstep(0.38, 0.47, length(cell * vec2(1.0, 1.3)));
          diffuseColor.rgb *= 1.0 - scaleRim * aquariumPattern.x;
          float fleck = sin(vAquariumUv.x * 149.0 + aquariumMotion.w) * sin(vAquariumUv.y * 97.0);
          diffuseColor.rgb *= 1.0 - smoothstep(0.82, 0.95, fleck) * aquariumPattern.y;
        `);
        shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + sin(vAquariumUv.x * 265.0) * sin(vAquariumUv.y * 138.0) * .035, .18, .7);");
      } else if (bucket === 1) shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= .94 + .06 * pow(abs(sin(vAquariumUv.x * 65.0)), 6.0);");
    };
    material.customProgramCacheKey = () => `aquarium-fish-v74-${bucket}`;
    const pieces = buckets[bucket], merged = mergeGeometries(pieces, false)!;
    for (const geometry of pieces) geometry.dispose();
    merged.computeBoundingBox(); merged.computeBoundingSphere();
    // Vertex shader bending must remain inside renderer culling bounds.
    merged.boundingBox!.expandByVector(new THREE.Vector3(0, .02, .10)); merged.boundingSphere!.radius += .14;
    const mesh = new THREE.Mesh(merged, material); mesh.name = material.name;
    mesh.castShadow = false; mesh.receiveShadow = false;
    root.add(mesh); geometries.push(merged); materials.push(material);
  }
  return {
    root,
    update(timeSeconds: number) { if (!disposed && Number.isFinite(timeSeconds)) clock.value = timeSeconds; },
    dispose() {
      if (disposed) return; disposed = true;
      root.removeFromParent(); root.clear();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
