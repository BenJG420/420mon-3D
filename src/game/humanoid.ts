import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

export type HumanLook = {
  choice: "man" | "woman"; skin: string; hair: string; hairStyle: string; face: string;
  jacket: string; pants: string; shoes: string; height: number; build: number;
};
const templates = new Map<string, Promise<GLTF>>();
function template(choice: string) {
  const file = choice === "woman" ? "female" : "male";
  let pending = templates.get(file);
  if (!pending) {
    pending = new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}game/characters/${file}.glb`);
    templates.set(file, pending);
    pending.catch(() => templates.delete(file));
  }
  return pending;
}
export const OUTFIT_PALETTES: Record<string, [string, string]> = {
  nude: ["#607848", "#181818"], wear_trashbag: ["#303030", "#181818"],
  wear_collar: ["#306030", "#181818"], wear_jacket: ["#60b818", "#181818"],
  wear_vest: ["#202023", "#181818"], wear_coat: ["#303048", "#181818"],
  wear_hoodie: ["#303030", "#181830"], wear_track: ["#181830", "#181830"],
  wear_rain: ["#f0c018", "#181818"], wear_overalls: ["#603018", "#784830"],
  wear_lack: ["#30a8c0", "#181818"],
};
type Region = "shirt" | "pants" | "shoes" | "skin" | "hair" | "upperArm" | "forearm" | "calf";
/** Semantic skin-weight regions keep clothing on the actual deforming mesh. */
export function clothingRegion(names: string[]): Region {
  if (names.some(n => /Finger|Hand/i.test(n))) return "skin";
  if (names.some(n => /Foot|Toe/i.test(n))) return "shoes";
  if (names.some(n => /Calf/i.test(n))) return "calf";
  if (names.some(n => /Thigh|Pelvis/i.test(n))) return "pants";
  if (names.some(n => /Forearm/i.test(n))) return "forearm";
  if (names.some(n => /UpperArm/i.test(n))) return "upperArm";
  return "shirt";
}

/** Two shared immutable GLTF templates; each actor owns its mixer, skeleton and wardrobe. */
export function createHumanoid(parent: THREE.Object3D, onReady?: (ready: boolean) => void) {
  const root = new THREE.Group(); root.name = "licensed-rocketbox-human"; parent.add(root);
  let generation = 0, disposed = false, selected = "", outfit = "nude";
  let look: HumanLook | undefined;
  let model: THREE.Object3D | undefined, mixer: THREE.AnimationMixer | undefined;
  let active: THREE.AnimationAction | undefined;
  let actions: Record<string, THREE.AnimationAction> = {};
  const ownedMaterials: { material: THREE.MeshStandardMaterial; region: Region; base: THREE.Texture | null }[] = [];
  const ownedGeometry: THREE.BufferGeometry[] = [];
  const hairAccessories: THREE.Mesh[] = [];
  function clear() {
    mixer?.stopAllAction(); if (model) mixer?.uncacheRoot(model);
    model?.traverse(o => { if (o instanceof THREE.SkinnedMesh) o.skeleton.dispose(); });
    for (const item of ownedMaterials) item.material.dispose(); ownedMaterials.length = 0;
    for (const g of ownedGeometry) g.dispose(); ownedGeometry.length = 0;
    for (const m of hairAccessories) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); }
    hairAccessories.length = 0; root.clear(); model = undefined; mixer = undefined; active = undefined; actions = {};
  }
  function applyAppearance() {
    if (!look) return;
    const colors = (outfit === "nude" || outfit === "npc") ? [look.jacket, look.pants] : OUTFIT_PALETTES[outfit] ?? OUTFIT_PALETTES.nude;
    for (const { material, region, base } of ownedMaterials) {
      const bareArm = (region === "upperArm" || region === "forearm") && ["nude", "wear_vest", "wear_overalls"].includes(outfit);
      const bareCalf = region === "calf" && ["nude", "wear_trashbag", "wear_collar"].includes(outfit);
      const bare = bareArm || bareCalf;
      const color = bare ? look.skin : region === "skin" ? look.skin : region === "hair" ? look.hair : region === "shoes" ? look.shoes : (region === "pants" || region === "calf") ? colors[1] : colors[0];
      // Vertex/texture detail remains visible, including eyes, seams and fabric folds.
      material.color.set(color);
      if (region === "skin") material.color.lerp(new THREE.Color(0xffffff), .64);
      material.roughness = outfit === "wear_lack" && region === "shirt" ? .22 : region === "shoes" ? .7 : .86;
      material.metalness = outfit === "wear_lack" && region === "shirt" ? .35 : 0;
      const map = bare ? null : base;
      if (material.map !== map) { material.map = map; material.needsUpdate = true; }
    }
    root.scale.set(look.build * (look.choice === "woman" ? .94 : 1), look.height, look.build);
    for (const accessory of hairAccessories) {
      accessory.visible = accessory.name === look.hairStyle;
      (accessory.material as THREE.MeshStandardMaterial).color.set(look.hair);
    }
    if (model) {
      const head = model.getObjectByName("Bip01_Head") ?? model.getObjectByName("Bip01 Head");
      head?.scale.set(look.face === "soft" ? 1.04 : look.face === "sharp" ? .95 : 1, look.face === "sharp" ? 1.04 : 1, 1);
    }
    root.userData.outfit = outfit;
  }
  async function load(choice: string) {
    selected = choice; const token = ++generation;
    root.userData.status = "loading";
    try {
      const gltf = await template(choice);
      if (disposed || token !== generation) return;
      clear(); model = clone(gltf.scene);
      const container = new THREE.Group(); container.add(model); root.add(container);
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const factor = 2.4 / (bounds.max.y - bounds.min.y);
      container.scale.setScalar(factor);
      container.position.y = -bounds.min.y * factor;
      model.traverse(o => {
        if (!(o instanceof THREE.SkinnedMesh)) return;
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        const sources = Array.isArray(o.material) ? o.material : [o.material];
        const original = sources[0] as THREE.MeshStandardMaterial;
        const baseRegion: Region = /head/i.test(original.name) ? "skin" : /opacity/i.test(original.name) ? "hair" : "shirt";
        if (baseRegion !== "shirt") {
          const material = original.clone(); o.material = material;
          ownedMaterials.push({ material, region: baseRegion, base: material.map });
          return;
        }
        // Reassign triangles by weighted bone influence, preserving UVs and skinning.
        const geometry = o.geometry.clone(); ownedGeometry.push(geometry); o.geometry = geometry;
        const idx = geometry.index, skinIndex = geometry.getAttribute("skinIndex"), weight = geometry.getAttribute("skinWeight");
        const regions: Region[] = ["shirt", "pants", "shoes", "skin", "upperArm", "forearm", "calf"];
        const materials = regions.map(region => {
          const material = original.clone(); ownedMaterials.push({ material, region, base: material.map }); return material;
        });
        const indices: number[][] = regions.map(() => []);
        const count = idx?.count ?? geometry.getAttribute("position").count;
        for (let i = 0; i < count; i += 3) {
          const vertices = [0, 1, 2].map(j => idx ? idx.getX(i + j) : i + j);
          const influences = new Map<string, number>();
          for (const v of vertices) for (let k = 0; k < 4; k++) {
            const name = o.skeleton.bones[skinIndex.getComponent(v, k)]?.name ?? "";
            influences.set(name, (influences.get(name) ?? 0) + weight.getComponent(v, k));
          }
          const names = [...influences].sort((a,b) => b[1]-a[1]).slice(0, 2).map(([name]) => name);
          indices[regions.indexOf(clothingRegion(names))].push(...vertices);
        }
        geometry.clearGroups(); let offset = 0; const combined: number[] = [];
        indices.forEach((part, i) => { geometry.addGroup(offset, part.length, i); offset += part.length; combined.push(...part); });
        geometry.setIndex(combined); o.material = materials;
      });
      mixer = new THREE.AnimationMixer(model);
      for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
      active = actions.Idle; active?.play();
      // Head-bone hair options follow animation and preserve the existing editor keys.
      const head = model.getObjectByName("Bip01_Head") ?? model.getObjectByName("Bip01 Head");
      if (head) for (const style of ["long", "mohawk"]) {
        const geometry = new THREE.CapsuleGeometry(style === "long" ? .07 : .035, style === "long" ? .22 : .12, 4, 8);
        const accessory = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ roughness: .95 }));
        accessory.name = style; accessory.position.set(0, .12, -.08); accessory.castShadow = true;
        head.add(accessory); hairAccessories.push(accessory);
      }
      applyAppearance(); root.userData.status = "ready"; root.userData.license = "MIT"; onReady?.(true);
    } catch {
      if (disposed || token !== generation) return;
      clear(); root.userData.status = "error"; onReady?.(false);
    }
  }
  return {
    root,
    setLook(next: HumanLook, nextOutfit: string) {
      look = next; outfit = nextOutfit; applyAppearance();
      if (selected !== next.choice || root.userData.status === "error") void load(next.choice);
    },
    update(dt: number, speed = 0, sprint = false) {
      const key = speed > .35 ? sprint ? "Run" : "Walk" : "Idle";
      const action = actions[key];
      if (action && action !== active) { active?.fadeOut(.18); action.reset().fadeIn(.18).play(); active = action; }
      if (active) active.timeScale = key === "Idle" ? 1 : THREE.MathUtils.clamp(speed / (key === "Run" ? 7 : 4.2), .55, 1.5);
      mixer?.update(dt); root.userData.animation = key;
    },
    dispose() { disposed = true; generation++; clear(); root.removeFromParent(); },
  };
}
