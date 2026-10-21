import * as THREE from "three";
import { normalizeWardrobe, wardrobeKey, type Wardrobe } from "./wardrobe";

type Look = { skin: string; hair: string; jacket: string; pants: string; shoes: string };
type Surface = "skin" | "top" | "topSleeve" | "jacket" | "pants" | "pantsLower" | "bib" | "strap" | "metal" | "shoes" | "sole" | "trim";
const SURFACES: Surface[] = ["skin", "top", "topSleeve", "jacket", "pants", "pantsLower", "bib", "strap", "metal", "shoes", "sole", "trim"];
const TOP_COLORS: Record<string, string> = { top_shirt: "#c2c5bd", top_hoodie: "#454651", top_track: "#28374e" };
const JACKET_COLORS: Record<string, string> = { jacket_trashbag: "#292d30", jacket_bomber: "#54733c", jacket_vest: "#343941", jacket_leather: "#282023", jacket_coat: "#454153", jacket_rain: "#dbb630", jacket_lack: "#237d8e" };
const PANTS_COLORS: Record<string, string> = { pants_plain: "#333842", pants_track: "#243047", pants_overalls: "#765131" };
const SHOE_COLORS: Record<string, string> = { shoes_trainers: "#d4d3c9", shoes_work: "#775534" };

/** Clothing takes ownership of the original skin surface: one triangle, one outer layer.
 * No intersecting coats or hidden duplicate bodies are placed around an animated rig.
 * Bind-space samples are shared by every look; switching never changes bones or UVs. */
export function createRigWardrobe(model: THREE.Object3D) {
  const body: THREE.SkinnedMesh[] = [], hair: THREE.Mesh[] = [], heads: THREE.SkinnedMesh[] = [];
  model.traverse(object => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    const material = (Array.isArray(object.material) ? object.material[0] : object.material) as THREE.MeshStandardMaterial;
    if (/opacity/i.test(material.name)) hair.push(object);
    else if (/head/i.test(material.name)) heads.push(object);
    else body.push(object);
  });
  if (!body.length || !heads.length) throw new Error("Wardrobe needs a complete licensed body and head skin");
  // The source positions are in GLTF bind space, independent of the imported scene transform.
  const headBounds = new THREE.Box3();
  for (const mesh of heads) {
    mesh.geometry.computeBoundingBox(); headBounds.union(mesh.geometry.boundingBox!);
  }
  const stature = headBounds.max.y;
  const headCenter = headBounds.getCenter(new THREE.Vector3());
  const headSize = headBounds.getSize(new THREE.Vector3());
  const resources: THREE.Material[] = [], extras: THREE.SkinnedMesh[] = [];
  const headIndex = body[0].skeleton.bones.findIndex(bone => /(?:^|_)Head$/i.test(bone.name));
  const neckIndex = body[0].skeleton.bones.findIndex(bone => /(?:^|_)Neck$/i.test(bone.name));
  if (headIndex < 0 || neckIndex < 0) throw new Error("Wardrobe needs mapped head and neck bones");
  const states = body.map(mesh => {
    const source = mesh.geometry;
    const original = mesh.material;
    const originalMaterial = (Array.isArray(original) ? original[0] : original) as THREE.MeshStandardMaterial;
    // Clip at garment edges before assigning materials: no sawtooth bibs, straps or lapels.
    const geometry = subdivideSkin(source, stature);
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const normal = geometry.getAttribute("normal") as THREE.BufferAttribute;
    const bindPositions = new Float32Array(position.array);
    const skinIndex = geometry.getAttribute("skinIndex"), weights = geometry.getAttribute("skinWeight");
    const triangles: Triangle[] = [];
    const p = new THREE.Vector3(), n = new THREE.Vector3();
    for (let vertex = 0; vertex < position.count; vertex += 3) {
      p.set(0, 0, 0); n.set(0, 0, 0); const influences = new Map<number, number>();
      for (let j = 0; j < 3; j++) {
        p.add(new THREE.Vector3().fromBufferAttribute(position, vertex + j));
        n.add(new THREE.Vector3().fromBufferAttribute(normal, vertex + j));
        for (let k = 0; k < 4; k++) {
          const index = skinIndex.getComponent(vertex + j, k);
          influences.set(index, (influences.get(index) ?? 0) + weights.getComponent(vertex + j, k));
        }
      }
      p.multiplyScalar(1 / 3); n.normalize();
      const strongest = [...influences].sort((a, b) => b[1] - a[1])[0][0];
      const bone = mesh.skeleton.bones[strongest]?.name ?? "";
      triangles.push({ vertex, x: p.x / stature, y: p.y / stature, z: p.z / stature, nz: n.z, bone });
    }
    const materials = SURFACES.map(surface => {
      const material = originalMaterial.clone(); material.name = `wardrobe-${surface}`;
      // Reuse the source atlas as subtle fabric relief, never as printed skin or old clothing.
      // Face/hair materials remain untouched; all six wardrobe slots get their own clean color.
      material.map = null;
      if (surface !== "skin" && surface !== "metal") { material.bumpMap = originalMaterial.map; material.bumpScale = .0012; }
      material.roughness = .87; material.metalness = 0;
      resources.push(material); return material;
    });
    mesh.geometry = geometry; mesh.material = materials;
    const indices = new Uint32Array(position.count); geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    return { mesh, source, original, geometry, bindPositions, triangles, materials, indices, key: "" };
  });
  const headMaterial = new THREE.MeshStandardMaterial({ color: "#36383e", roughness: .92, side: THREE.DoubleSide });
  const collarMaterial = new THREE.MeshStandardMaterial({ color: "#302626", roughness: .64, metalness: .18 });
  resources.push(headMaterial, collarMaterial);
  function attached(geometry: THREE.BufferGeometry, material: THREE.MeshStandardMaterial, bone: number, name: string) {
    const count = geometry.getAttribute("position").count;
    const indices = new Uint16Array(count * 4), weights = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) { indices[i * 4] = bone; weights[i * 4] = 1; }
    geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
    geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
    const mesh = new THREE.SkinnedMesh(geometry, material), base = body[0];
    mesh.name = name; mesh.position.copy(base.position); mesh.quaternion.copy(base.quaternion); mesh.scale.copy(base.scale);
    mesh.bind(base.skeleton, base.bindMatrix); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    base.parent!.add(mesh); extras.push(mesh); return mesh;
  }
  const capRadius = headSize.x * .58;
  const capBottom = headBounds.max.y - headSize.y * .32;
  const cap = new THREE.LatheGeometry([
    new THREE.Vector2(capRadius * .96, capBottom), new THREE.Vector2(capRadius * 1.03, capBottom + stature * .018),
    new THREE.Vector2(capRadius, headBounds.max.y - stature * .006), new THREE.Vector2(capRadius * .76, headBounds.max.y + stature * .025),
    new THREE.Vector2(capRadius * .38, headBounds.max.y + stature * .038), new THREE.Vector2(0, headBounds.max.y + stature * .043),
  ], 32);
  cap.scale(1, 1, headSize.z / headSize.x * .87); cap.translate(headCenter.x, 0, headCenter.z);
  const beanie = attached(cap, headMaterial, headIndex, "wardrobe-head-beanie");
  // Open at the face: the hood uses the back 270 degrees, not a sphere over the eyes.
  const hood = new THREE.SphereGeometry(1, 32, 20, Math.PI * .75, Math.PI * 1.5, 0, Math.PI * .76);
  hood.scale(headSize.x * .66, headSize.y * .61, headSize.z * .63);
  hood.translate(headCenter.x, headCenter.y + headSize.y * .06, headCenter.z - stature * .008);
  const rainhood = attached(hood, headMaterial, headIndex, "wardrobe-head-rainhood");
  // Neck bind center derives from inverse bind matrices, not animated world coordinates.
  const neck = new THREE.Vector3().setFromMatrixPosition(body[0].skeleton.boneInverses[neckIndex].clone().invert());
  const ring = new THREE.TorusGeometry(stature * .037, stature * .007, 8, 32); ring.rotateX(Math.PI / 2);
  ring.scale(1, 1, .85); ring.translate(neck.x, neck.y + stature * .012, neck.z);
  const collar = attached(ring, collarMaterial, neckIndex, "wardrobe-accessory-collar");
  let current = normalizeWardrobe(undefined), disposed = false;
  function apply(raw: Wardrobe, look: Look) {
    if (disposed) return;
    current = normalizeWardrobe(raw);
    const key = `${current.top}/${current.jacket}/${current.pants}/${current.shoes}`;
    for (const state of states) {
      if (state.key !== key) {
        const buckets = SURFACES.map(() => [] as number[]);
        for (const triangle of state.triangles) {
          const surface = coverage(triangle, current);
          const bucket = buckets[SURFACES.indexOf(surface)];
          bucket.push(triangle.vertex, triangle.vertex + 1, triangle.vertex + 2);
        }
        state.geometry.clearGroups(); let offset = 0;
        buckets.forEach((bucket, index) => { state.indices.set(bucket, offset); state.geometry.addGroup(offset, bucket.length, index); offset += bucket.length; });
        state.geometry.index!.needsUpdate = true;
        // Continuous thickness: adjacent copies of a bind vertex receive the same displacement.
        // At most 8 mm, following the exact original weights, with a smooth transition at hems.
        const positions = state.geometry.getAttribute("position") as THREE.BufferAttribute;
        const normals = state.geometry.getAttribute("normal");
        for (let i = 0; i < positions.count; i++) {
          const x = state.bindPositions[i * 3], y = state.bindPositions[i * 3 + 1], z = state.bindPositions[i * 3 + 2];
          const thickness = clothThickness(x / stature, y / stature, current);
          positions.setXYZ(i, x + normals.getX(i) * thickness, y + normals.getY(i) * thickness, z + normals.getZ(i) * thickness);
        }
        positions.needsUpdate = true; state.geometry.computeBoundingBox(); state.geometry.computeBoundingSphere(); state.key = key;
      }
      state.materials.forEach((material, i) => {
        const surface = SURFACES[i];
        material.color.set(surface === "skin" ? look.skin : ["top", "topSleeve"].includes(surface) ? TOP_COLORS[current.top] ?? look.jacket
          : surface === "jacket" ? JACKET_COLORS[current.jacket] ?? look.jacket
          : ["pants", "pantsLower", "bib", "strap"].includes(surface) ? PANTS_COLORS[current.pants] ?? look.pants
          : surface === "metal" ? "#b8a174" : surface === "shoes" ? SHOE_COLORS[current.shoes] ?? look.shoes
          : surface === "sole" ? "#26292a" : "#d0ccc2");
        material.roughness = surface === "jacket" && current.jacket === "jacket_lack" ? .24
          : surface === "jacket" && current.jacket === "jacket_leather" ? .43
          : surface === "jacket" && current.jacket === "jacket_rain" ? .51
          : surface === "metal" ? .32 : surface === "shoes" ? .66 : surface === "sole" ? .95 : surface === "skin" ? .93 : .87;
        material.metalness = surface === "metal" ? .7 : 0;
      });
    }
    beanie.visible = current.head === "head_beanie";
    rainhood.visible = current.head === "head_rainhood";
    collar.visible = current.accessory === "accessory_collar";
    headMaterial.color.set(current.head === "head_rainhood" ? "#d1ad25" : "#393f48");
    hair.forEach(mesh => { mesh.visible = current.head === "head_none"; });
    model.userData.wardrobe = { ...current }; model.userData.wardrobeKey = wardrobeKey(current);
  }
  return {
    apply,
    /** Exposes actual drawable meshes for CPU deformation and resource ownership checks. */
    inspect: () => ({ body: states.map(state => state.mesh), extras: [...extras], hair: [...hair], wardrobe: { ...current } }),
    dispose() {
      if (disposed) return; disposed = true;
      for (const state of states) { state.mesh.geometry = state.source; state.mesh.material = state.original; state.geometry.dispose(); }
      for (const mesh of extras) { mesh.removeFromParent(); mesh.geometry.dispose(); }
      for (const material of resources) material.dispose();
      hair.forEach(mesh => { mesh.visible = true; });
      delete model.userData.wardrobe; delete model.userData.wardrobeKey;
    },
  };
}

type Triangle = { vertex: number; x: number; y: number; z: number; nz: number; bone: string };
function coverage(t: Triangle, w: Wardrobe): Surface {
  const { x, y, nz, bone } = t, ax = Math.abs(x), front = nz > .18;
  if (/Finger|Hand|Head/i.test(bone)) return "skin";
  if (/Foot|Toe/i.test(bone)) return y < .024 ? "sole" : "shoes";
  if (/Calf|Thigh|Pelvis/i.test(bone)) {
    if (w.shoes === "shoes_work" && y < .12) return y < .024 ? "sole" : "shoes";
    if (w.pants === "pants_shorts" && y < .365) return "skin";
    if (w.pants === "pants_track" && ax > .085 && ax < .103) return "trim";
    return /Calf/i.test(bone) ? "pantsLower" : "pants";
  }
  const arm = /UpperArm|Forearm/i.test(bone);
  const longJacket = !["jacket_none", "jacket_vest", "jacket_trashbag"].includes(w.jacket);
  if (arm) {
    if (longJacket) return ax > .28 && ax < .295 ? "trim" : "jacket";
    if (w.top === "top_tanktop" || (w.top === "top_shirt" && (ax > .17 || /Forearm/i.test(bone)))) return "skin";
    return w.top === "top_track" && y > .73 && y < .75 ? "trim" : "topSleeve";
  }
  if (y > .835) return "skin";
  // The open front deliberately shows any independently equipped top, bib and straps.
  const opening = .053 + Math.max(0, y - .68) * .16;
  const jacket = w.jacket !== "jacket_none" && (!front || ax > opening);
  if (jacket) return "jacket";
  if (w.pants === "pants_overalls") {
    const strap = ax > .039 && ax < .059 && y > .66 && y < .82;
    const bib = ax < .078 && y > .51 && y < .7;
    if (strap && (front || nz < -.15)) return y > .682 && y < .697 ? "metal" : "strap";
    if (bib && (front || nz < -.15)) return "bib";
  }
  if (w.top === "top_tanktop" && y > .8 && ax < .045) return "skin";
  return w.top === "top_track" && ax > .07 && ax < .081 ? "trim" : "top";
}
function clothThickness(x: number, y: number, wardrobe: Wardrobe) {
  const smooth = (a: number, b: number, value: number) => THREE.MathUtils.smoothstep(value, a, b);
  const torso = smooth(.48, .56, y) * (1 - smooth(.81, .85, y));
  const arms = smooth(.11, .17, Math.abs(x)) * (1 - smooth(.28, .33, Math.abs(x))) * smooth(.59, .72, y);
  const jacket = wardrobe.jacket !== "jacket_none" ? .007 : .002;
  const trouser = (wardrobe.pants === "pants_overalls" ? .004 : .002) * smooth(.08, .15, y) * (1 - smooth(.48, .57, y));
  return Math.max(torso * jacket, arms * (wardrobe.jacket === "jacket_none" ? .001 : .004), trouser);
}

/** Clip bind-space triangles at actual garment edges. UVs/normals/weights use barycentric
 * interpolation, so neighboring pieces share an identical edge throughout animation. */
function subdivideSkin(source: THREE.BufferGeometry, stature: number) {
  const result = new THREE.BufferGeometry();
  const originalIndex = source.index, position = source.getAttribute("position");
  const count = originalIndex?.count ?? position.count;
  type Vertex = { b: number[]; x: number; y: number };
  type Plane = [number, number, number];
  const planes: Plane[] = [];
  // Include every straight garment edge once, for every wardrobe combination.
  for (const x of [.039, .045, .053, .059, .07, .078, .081, .085, .103, .17, .28, .295]) {
    planes.push([1, 0, x], [1, 0, -x]);
  }
  for (const y of [.024, .12, .365, .51, .66, .68, .682, .697, .7, .73, .75, .8, .82, .835]) planes.push([0, 1, y]);
  // Open lapels widen towards the shoulders; split both sides at precisely the same line.
  planes.push([1, -.16, .053 - .68 * .16], [-1, -.16, .053 - .68 * .16]);
  function cut(polygon: Vertex[], [nx, ny, d]: Plane): Vertex[][] {
    const distances = polygon.map(v => v.x * nx + v.y * ny - d);
    if (distances.every(value => value >= -1e-9) || distances.every(value => value <= 1e-9)) return [polygon];
    const positive: Vertex[] = [], negative: Vertex[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length];
      const da = distances[i], db = distances[(i + 1) % polygon.length];
      if (da >= -1e-9) positive.push(a);
      if (da <= 1e-9) negative.push(a);
      if ((da > 1e-9 && db < -1e-9) || (da < -1e-9 && db > 1e-9)) {
        const t = da / (da - db);
        const point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, b: a.b.map((v, k) => v + (b.b[k] - v) * t) };
        positive.push(point); negative.push(point);
      }
    }
    return [positive, negative].filter(piece => piece.length >= 3);
  }
  const attributes = Object.entries(source.attributes).filter(([name]) => name !== "skinIndex" && name !== "skinWeight");
  const arrays = attributes.map(() => [] as number[]);
  const joints: number[] = [], weights: number[] = [];
  const oldJoints = source.getAttribute("skinIndex"), oldWeights = source.getAttribute("skinWeight");
  for (let triangle = 0; triangle < count; triangle += 3) {
    const input = [0, 1, 2].map(i => originalIndex ? originalIndex.getX(triangle + i) : triangle + i);
    let pieces: Vertex[][] = [input.map((vertex, corner) => ({
      b: [Number(corner === 0), Number(corner === 1), Number(corner === 2)],
      x: position.getX(vertex) / stature, y: position.getY(vertex) / stature,
    }))];
    for (const plane of planes) pieces = pieces.flatMap(piece => cut(piece, plane));
    for (const polygon of pieces) for (let fan = 1; fan < polygon.length - 1; fan++) {
      for (const { b: barycentric } of [polygon[0], polygon[fan], polygon[fan + 1]]) {
        attributes.forEach(([, attribute], a) => {
          for (let k = 0; k < attribute.itemSize; k++) {
            arrays[a].push(input.reduce((sum, vertex, corner) => sum + attribute.getComponent(vertex, k) * barycentric[corner], 0));
          }
        });
        const boneWeights = new Map<number, number>();
        input.forEach((vertex, corner) => {
          for (let k = 0; k < 4; k++) {
            const joint = oldJoints.getComponent(vertex, k), weight = oldWeights.getComponent(vertex, k) * barycentric[corner];
            boneWeights.set(joint, (boneWeights.get(joint) ?? 0) + weight);
          }
        });
        const strongest = [...boneWeights].sort((a, b) => b[1] - a[1]).slice(0, 4);
        const total = strongest.reduce((sum, [, weight]) => sum + weight, 0);
        for (let k = 0; k < 4; k++) {
          joints.push(strongest[k]?.[0] ?? 0);
          weights.push(total > 0 ? (strongest[k]?.[1] ?? 0) / total : Number(k === 0));
        }
      }
    }
  }
  attributes.forEach(([name, attribute], a) => result.setAttribute(name, new THREE.Float32BufferAttribute(arrays[a], attribute.itemSize)));
  result.normalizeNormals();
  result.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(joints, 4));
  result.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
  return result;
}
