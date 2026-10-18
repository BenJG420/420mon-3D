import * as THREE from "three";
import { FISH, type FishDef } from "./data/fish";
import { paintFishSheet } from "./fishArt";
import { getSave } from "./save";
import type { DistrictTravel } from "./world";

// Keep the original four-pose artwork intact; portraits and sprites select one
// cell rather than showing the complete sheet as a single fish.
const sheets = new Map<string, HTMLCanvasElement>();
const fishMaterials = new Map<string, THREE.SpriteMaterial>();

function artKey(fish: FishDef): string {
  return [fish.id, fish.main, fish.acc, fish.dress, fish.skin].join(":");
}

export function getFishSheet(fish: FishDef): HTMLCanvasElement {
  const key = artKey(fish);
  let sheet = sheets.get(key);
  if (!sheet) {
    sheet = paintFishSheet(fish.id, fish.main, fish.acc, fish.dress, fish.skin);
    sheets.set(key, sheet);
  }
  return sheet;
}

export function fishPortrait(fish: FishDef): HTMLCanvasElement {
  const sheet = getFishSheet(fish);
  const canvas = document.createElement("canvas");
  canvas.width = sheet.width / 2;
  canvas.height = sheet.height / 2;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", fish.name);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

function fishMaterial(fish: FishDef, right: boolean): THREE.SpriteMaterial {
  const key = `${artKey(fish)}:${right ? "right" : "left"}`;
  let material = fishMaterials.get(key);
  if (!material) {
    const texture = new THREE.CanvasTexture(getFishSheet(fish));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    // The first pose is top-left. A negative repeat mirrors only that cell.
    texture.repeat.set(right ? -.5 : .5, .5);
    texture.offset.set(right ? .5 : 0, .5);
    material = new THREE.SpriteMaterial({ map: texture, transparent: true,
      alphaTest: .08, depthWrite: false, toneMapped: false });
    fishMaterials.set(key, material);
  }
  return material;
}

type FishingWorld = Pick<DistrictTravel, "current" | "getRoot" | "getMapInfo" | "toWorld">;
type Swimmer = { sprite: THREE.Sprite; fish: FishDef; index: number; width: number; depth: number };

/** Adds owned details to the existing map. The caller owns the frame loop. */
export function createFishingWorld(world: FishingWorld): { update: (dt: number) => void; dispose: () => void } {
  let root = new THREE.Group();
  root.name = "fishing-details";
  let key = "";
  let elapsed = 0;
  let disposed = false;
  const swimmers: Swimmer[] = [];
  const geometry = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  function clear() {
    root.removeFromParent();
    root.clear();
    swimmers.length = 0;
    for (const value of geometry) value.dispose();
    for (const value of materials) value.dispose();
    geometry.clear();
    materials.clear();
  }

  function mesh(shape: THREE.BufferGeometry, material: THREE.Material, point: THREE.Vector3): THREE.Mesh {
    geometry.add(shape);
    const object = new THREE.Mesh(shape, material);
    object.position.copy(point);
    object.castShadow = true;
    root.add(object);
    return object;
  }

  function rodMaterial(color: number, metalness = .1): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({ color, roughness: .65, metalness });
    materials.add(material);
    return material;
  }

  function pole(start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) {
    const direction = end.clone().sub(start);
    const object = mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material,
      start.clone().add(end).multiplyScalar(.5));
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  }

  function addRods() {
    const wood = rodMaterial(0x91613e);
    const metal = rodMaterial(0x323e3d, .65);
    const red = rodMaterial(0xdd704e);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xc8d5c4, transparent: true, opacity: .6 });
    materials.add(lineMaterial);
    for (const spot of world.getMapInfo().map.objs.filter(obj => obj.id.startsWith("kai_cast"))) {
      const base = world.toWorld(spot.x + spot.w / 2, spot.y + spot.h / 2); base.y = .26;
      const tip = world.toWorld(spot.x + spot.w / 2 + 13, 220); tip.y = 1.7;
      const bobber = world.toWorld(spot.x + spot.w / 2 + 22, 253); bobber.y = .15;
      pole(base, tip, .022, wood);
      pole(base.clone().add(new THREE.Vector3(-.18, -.2, .1)), base, .025, metal);
      pole(base.clone().add(new THREE.Vector3(.18, -.2, .1)), base, .025, metal);
      const reel = mesh(new THREE.TorusGeometry(.09, .025, 6, 12), metal,
        base.clone().lerp(tip, .18).add(new THREE.Vector3(.06, 0, 0)));
      reel.rotation.y = Math.PI / 2;
      const middle = tip.clone().lerp(bobber, .5); middle.y -= .18;
      const thread = new THREE.BufferGeometry().setFromPoints([tip, middle, bobber]);
      geometry.add(thread);
      root.add(new THREE.Line(thread, lineMaterial));
      mesh(new THREE.SphereGeometry(.065, 8, 6), red, bobber);
    }
  }

  function rebuild(species: FishDef[]) {
    clear();
    root = new THREE.Group(); root.name = "fishing-details";
    world.getRoot().add(root);
    if (world.current() === "kai") addRods();
    if (world.current() !== "capsule") return;
    const tank = world.getMapInfo().map.objs.find(obj => obj.id === "tank");
    if (!tank) return;
    const center = world.toWorld(tank.x + tank.w / 2, tank.y + tank.h / 2);
    const scale = world.getMapInfo().scale;
    // The collection UI contains all 42 species; the enlarged tank shows all 42
    // distinct caught species to keep the water readable and draw calls bounded.
    for (const [index, fish] of species.entries()) {
      const sprite = new THREE.Sprite(fishMaterial(fish, false));
      sprite.scale.setScalar(.4 + index % 3 * .035);
      const holder = new THREE.Group(); holder.position.copy(center); holder.add(sprite); root.add(holder);
      swimmers.push({ sprite, fish, index, width: tank.w * scale * .39, depth: tank.h * scale * .25 });
    }
  }

  function update(dt: number) {
    if (disposed) return;
    elapsed += Number.isFinite(dt) ? Math.max(0, Math.min(dt, .1)) : 0;
    const caught = getSave().fishCaught;
    const counts = caught && typeof caught === "object" ? caught as Record<string, unknown> : {};
    const species = FISH.filter(fish => typeof counts[fish.id] === "number" && Number(counts[fish.id]) > 0);
    const nextKey = `${world.current()}:${world.current() === "capsule" ? species.map(fish => fish.id).join(",") : ""}`;
    if (key !== nextKey || root.parent !== world.getRoot()) { key = nextKey; rebuild(species); }
    for (const swimmer of swimmers) {
      const { sprite, fish, index, width, depth } = swimmer;
      const phase = elapsed * (.24 + index % 4 * .025) + index * 2.4;
      sprite.position.set(Math.sin(phase) * width, .65 + index % 5 * .27 + Math.sin(phase * 1.7 + index) * .06,
        Math.cos(phase * .7 + index) * depth);
      sprite.material = fishMaterial(fish, Math.cos(phase) > 0);
    }
  }

  return { update, dispose() { if (disposed) return; disposed = true; clear(); } };
}
