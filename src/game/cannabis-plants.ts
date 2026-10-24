import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type CannabisPhase = "empty" | "sprout" | "grow" | "bloom" | "ready";
type Part = "stems" | "fan-leaves" | "leaf-veins" | "cotyledons" | "buds" | "pistils";
type Stage = Exclude<CannabisPhase, "empty">;
type Recipe = Map<Part, THREE.Matrix4[]>;

const leafHeight = (t: number) => .08 * Math.sin(t * Math.PI) - .045 * t * t;
const leafWidth = (t: number, tooth: number) => Math.pow(Math.sin(t * Math.PI), .8) * .125 * (tooth % 2 ? .78 : 1);

/** Curved lanceolate leaf, with an actual toothed outline and a raised central rib. */
function serratedLeaf() {
  const positions: number[] = [], colors: number[] = [], uv: number[] = [], indices: number[] = [];
  const steps = 24;
  for (let row = 0; row <= steps; row++) {
    const t = row / steps, halfWidth = leafWidth(t, row);
    for (const side of [-1, 0, 1]) {
      positions.push(side * halfWidth, leafHeight(t) - Math.abs(side) * halfWidth * .14, t);
      const shade = side ? .77 + .1 * Math.sin(t * 16) : 1;
      colors.push(shade * (.83 + .17 * t), shade, shade * .82);
      uv.push((side + 1) / 2, t);
    }
  }
  for (let row = 0; row < steps; row++) for (let side = 0; side < 2; side++) {
    const a = row * 3 + side, b = a + 3;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

/** One small reusable vein mesh per leaflet, sharing the curved leaf's surface. */
function leafVeins() {
  const pieces: THREE.BufferGeometry[] = [];
  const line = (points: THREE.Vector3[], radius: number, segments: number) =>
    pieces.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 3, false));
  line([0, .25, .5, .75, .95].map(t => new THREE.Vector3(0, leafHeight(t) + .004, t)), .005, 8);
  for (const row of [5, 9, 13, 17, 21]) {
    const t = row / 24;
    for (const side of [-1, 1]) {
      const end = Math.min(.97, t + .075), x = side * leafWidth(end, 0) * .84;
      line([new THREE.Vector3(0, leafHeight(t) + .005, t),
        new THREE.Vector3(x * .5, leafHeight(t + .04) + .003, t + .04),
        new THREE.Vector3(x, leafHeight(end) - Math.abs(x) * .14 + .004, end)], .0025, 2);
    }
  }
  const geometry = mergeGeometries(pieces, false)!;
  for (const piece of pieces) piece.dispose();
  return geometry;
}

function pistilPair() {
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const points = [new THREE.Vector3(), new THREE.Vector3(side * .2, .5, .05), new THREE.Vector3(side * .3, .8, .3)];
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 4, .028, 3, false));
  }
  const result = mergeGeometries(parts, false)!; parts.forEach(part => part.dispose()); return result;
}

/** Shared GPU assets and deterministic stage recipes; no geometry is built per frame. */
export function createCannabisLibrary() {
  const leaf = serratedLeaf(), veins = leafVeins();
  const cotyledon = new THREE.SphereGeometry(1, 8, 5);
  const stem = new THREE.CylinderGeometry(.72, 1, 1, 6);
  const calyx = new THREE.SphereGeometry(1, 8, 6);
  const pistil = pistilPair();
  const geometries: Record<Part, THREE.BufferGeometry> = {
    stems: stem, "fan-leaves": leaf, "leaf-veins": veins, cotyledons: cotyledon, buds: calyx, pistils: pistil,
  };
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x4b8137, vertexColors: true, roughness: .78, side: THREE.DoubleSide });
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x69854a, roughness: .83 });
  const veinMaterial = new THREE.MeshStandardMaterial({ color: 0x729452, roughness: .84 });
  const babyMaterial = new THREE.MeshStandardMaterial({ color: 0x78a44e, roughness: .73 });
  const budMaterial = new THREE.MeshStandardMaterial({ color: 0x587746, roughness: .9 });
  const ripeMaterial = new THREE.MeshStandardMaterial({ color: 0x66784b, roughness: .86 });
  const whitePistil = new THREE.MeshStandardMaterial({ color: 0xc9c7a0, roughness: .9 });
  const amberPistil = new THREE.MeshStandardMaterial({ color: 0xb9824c, roughness: .92 });
  const materials: Record<Part, THREE.Material> = {
    stems: stemMaterial, "fan-leaves": leafMaterial, "leaf-veins": veinMaterial,
    cotyledons: babyMaterial, buds: budMaterial, pistils: whitePistil,
  };
  const recipes = new Map<Stage, Recipe>();
  const plants = new Set<ReturnType<typeof create>>();
  let disposed = false;

  function recipe(stage: Stage) {
    const cached = recipes.get(stage); if (cached) return cached;
    const parts: Recipe = new Map();
    const add = (part: Part, matrix: THREE.Matrix4) => {
      const list = parts.get(part) ?? []; list.push(matrix); parts.set(part, list);
    };
    const pose = (part: Part, at: THREE.Vector3, scale: THREE.Vector3, rotation = new THREE.Euler()) => {
      const matrix = new THREE.Matrix4().compose(at, new THREE.Quaternion().setFromEuler(rotation), scale);
      add(part, matrix); return matrix;
    };
    const twig = (a: THREE.Vector3, b: THREE.Vector3, radius: number) => {
      const direction = new THREE.Vector3().subVectors(b, a), length = direction.length();
      const matrix = new THREE.Matrix4().compose(new THREE.Vector3().addVectors(a, b).multiplyScalar(.5),
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()), new THREE.Vector3(radius, length, radius));
      add("stems", matrix);
    };
    const fan = (at: THREE.Vector3, angle: number, count: number, length: number, pitch: number) => {
      const middle = (count - 1) / 2;
      for (let i = 0; i < count; i++) {
        const offset = i - middle, size = length * (1 - Math.abs(offset) * .16);
        const matrix = new THREE.Matrix4().compose(at,
          new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, angle + offset * .36, Math.sin(offset) * .07, "YXZ")),
          new THREE.Vector3(size, size, size));
        add("fan-leaves", matrix); add("leaf-veins", matrix);
      }
    };
    if (stage === "sprout") {
      twig(new THREE.Vector3(), new THREE.Vector3(.012, .46, .005), .012);
      for (const side of [-1, 1]) {
        pose("cotyledons", new THREE.Vector3(side * .085, .18, 0), new THREE.Vector3(.1, .012, .043), new THREE.Euler(0, 0, side * .12));
        const angle = side * Math.PI / 2;
        const end = new THREE.Vector3(side * .045, .32, 0);
        twig(new THREE.Vector3(.008, .3, 0), end, .005);
        fan(end, angle, 1, .22, -.13);
        fan(new THREE.Vector3(.012, .44, 0), side > 0 ? 0 : Math.PI, 3, .115, -.2);
      }
    } else {
      const top = new THREE.Vector3(.025, 1.38, -.012);
      twig(new THREE.Vector3(), new THREE.Vector3(-.01, .68, .015), .023);
      twig(new THREE.Vector3(-.01, .68, .015), top, .016);
      const tips: THREE.Vector3[] = [top];
      for (let level = 0; level < 4; level++) for (const side of [-1, 1]) {
        const angle = level * 1.25 + (side < 0 ? Math.PI : 0), h = .31 + level * .25;
        const reach = .2 - level * .022, start = new THREE.Vector3(0, h, 0);
        const end = new THREE.Vector3(Math.sin(angle) * reach, h + .12, Math.cos(angle) * reach);
        twig(start, end, .009 - level * .001);
        fan(end, angle, level < 3 ? 7 : 5, .42 - level * .046, -.18 + level * .025);
        if (level > 0) {
          const tip = end.clone().multiplyScalar(.64); tip.y = h + .24;
          twig(start, tip, .007); tips.push(tip);
        }
      }
      fan(top, .7, 5, .2, -.32);
      if (stage === "bloom" || stage === "ready") {
        const ripe = stage === "ready", fullness = ripe ? 1 : .69;
        for (const [i, tip] of tips.entries()) {
          // Overlapping green calyces make compact colas, rather than a single brown sphere.
          const tiers = i === 0 ? 4 : 3;
          for (let tier = 0; tier < tiers; tier++) for (let petal = 0; petal < 3; petal++) {
            const angle = petal * Math.PI * 2 / 3 + tier * 1.17 + i;
            const radius = (.049 - tier * .006) * fullness;
            const at = tip.clone().add(new THREE.Vector3(Math.sin(angle) * radius, tier * .058 - .025, Math.cos(angle) * radius));
            pose("buds", at, new THREE.Vector3(.047, .073, .046).multiplyScalar(fullness), new THREE.Euler(.12, angle, .12));
            const hair = at.clone().add(new THREE.Vector3(Math.sin(angle) * .036, .035, Math.cos(angle) * .036));
            pose("pistils", hair, new THREE.Vector3(.055, ripe ? .042 : .062, .055), new THREE.Euler(.35, angle, .3));
          }
          fan(tip.clone().add(new THREE.Vector3(0, .025, 0)), i * 1.7, 3, ripe ? .115 : .14, -.35);
        }
      }
    }
    recipes.set(stage, parts); return parts;
  }

  function create() {
    if (disposed) throw new Error("Cannabis library is disposed");
    const root = new THREE.Group(); root.name = "cannabis-plant"; root.userData.growthStage = "empty";
    let stage: CannabisPhase = "empty", removed = false;
    const clear = () => {
      for (const node of root.children) if (node instanceof THREE.InstancedMesh) node.dispose();
      root.clear();
    };
    const visual = {
      root,
      setStage(next: CannabisPhase) {
        if (removed || stage === next) return;
        clear(); stage = next; root.userData.growthStage = next;
        if (next === "empty") return;
        for (const [part, matrices] of recipe(next)) {
          const material = part === "buds" && next === "ready" ? ripeMaterial
            : part === "pistils" && next === "ready" ? amberPistil : materials[part];
          const mesh = new THREE.InstancedMesh(geometries[part], material, matrices.length);
          mesh.name = `cannabis-${part}`;
          matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
          mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingBox(); mesh.computeBoundingSphere();
          // Only the main stem casts another shadow; dense leaf/flower submissions stay cheap.
          mesh.castShadow = part === "stems"; mesh.receiveShadow = true;
          root.add(mesh);
        }
      },
      dispose() {
        if (removed) return;
        removed = true; clear(); root.removeFromParent(); plants.delete(visual);
      },
    };
    plants.add(visual); return visual;
  }
  return {
    create,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const plant of [...plants]) plant.dispose();
      for (const geometry of Object.values(geometries)) geometry.dispose();
      for (const material of [...Object.values(materials), ripeMaterial, amberPistil]) material.dispose();
      recipes.clear();
    },
  };
}

/** Stage-relative growth avoids shrinking a seedling model as if it were an adult. */
export function cannabisGrowthScale(phase: CannabisPhase, fraction: number) {
  const progress = Number.isFinite(fraction) ? THREE.MathUtils.clamp(fraction, 0, 1) : 0;
  if (phase === "empty") return 0;
  if (phase === "sprout") return .45 + .65 * THREE.MathUtils.clamp(progress / .33, 0, 1);
  if (phase === "grow") return .365 + .635 * THREE.MathUtils.clamp((progress - .33) / .33, 0, 1);
  return 1 + .06 * THREE.MathUtils.clamp((progress - .66) / .34, 0, 1);
}
