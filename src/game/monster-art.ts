import * as THREE from "three";
import { createMonsterSurface } from "./monster-surface";
import { DEX } from "./data/dex";
import { SPRITE_FRAME, spriteUrl } from "./sprites";
import { acquireMonsterModel, type MonsterModelLease } from "./monster-models";

const surface = createMonsterSurface(typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent) ? 512 : 1024);
function materialFor(id: string) {
  const types=DEX[id]?.types ?? [];
  return types.includes("steel") ? surface.metal : types.some(t=>t==="water"||t==="poison") ? surface.wet : surface.material;
}
const shadowGeometry = new THREE.CircleGeometry(.48, 20);
const haloGeometry = new THREE.TorusGeometry(.57, .012, 4, 32);
const loader = new THREE.TextureLoader();
const FALLBACK_UNUSED_LIMIT = 24;
type Fallback = { refs: number; used: number; material: THREE.SpriteMaterial; texture?: THREE.Texture; removed?: boolean };
const fallbackMaterials = new Map<string, Fallback>();
let clock = 0;
let missingArt: THREE.DataTexture | undefined;

function missingTexture(): THREE.Texture {
  if (!missingArt) {
    // An explicit missing-art token, independent of browser canvas availability.
    const pixels = new Uint8Array(16 * 16 * 4);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (Math.abs(Math.abs(x - 7.5) + Math.abs(y - 7.5) - 6) > 1) continue;
      pixels.set([99, 223, 213, 255], (y * 16 + x) * 4);
    }
    missingArt = new THREE.DataTexture(pixels, 16, 16);
    missingArt.colorSpace = THREE.SRGBColorSpace; missingArt.needsUpdate = true;
  }
  return missingArt;
}

function acquireFallback(speciesId: string): { material: THREE.SpriteMaterial; release(): void } {
  const species = DEX[speciesId];
  const key = species?.sprite ?? "__missing__";
  let entry = fallbackMaterials.get(key);
  if (!entry) {
    entry = { refs: 0, used: ++clock, material: new THREE.SpriteMaterial({ map: missingTexture(), transparent: true, alphaTest: .06, depthWrite: false, toneMapped: false }) };
    fallbackMaterials.set(key, entry);
    const created = entry;
    if (species) loader.load(spriteUrl(species.sprite), texture => {
      if (created.removed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.repeat.set(SPRITE_FRAME.repeatX, SPRITE_FRAME.repeatY);
      texture.offset.set(SPRITE_FRAME.offsetX, SPRITE_FRAME.offsetY);
      texture.minFilter = texture.magFilter = THREE.NearestFilter; texture.generateMipmaps = false;
      created.texture = texture; created.material.map = texture; created.material.needsUpdate = true;
    }, undefined, () => { /* The marker remains visible when the original pose also fails. */ });
  }
  entry.refs++; entry.used = ++clock;
  const retained = entry;
  let released = false;
  return {
    material: retained.material,
    release() {
      if (released) return;
      released = true; retained.refs--; retained.used = ++clock;
      const idle = [...fallbackMaterials.entries()].filter(([, value]) => !value.refs).sort((a, b) => a[1].used - b[1].used);
      for (const [slug, value] of idle.slice(0, Math.max(0, idle.length - FALLBACK_UNUSED_LIMIT))) {
        value.removed = true; value.texture?.dispose(); value.material.dispose(); fallbackMaterials.delete(slug);
      }
    },
  };
}

type ArtState = { generation: number; disposed: boolean; lease?: MonsterModelLease; fallback?: { release(): void }; pivot: THREE.Group };
const states = new WeakMap<THREE.Group, ArtState>();

function clearArt(state: ArtState): void {
  state.pivot.clear(); state.lease?.release(); state.lease = undefined;
  state.fallback?.release(); state.fallback = undefined;
}

/** The first child remains the same animation pivot throughout async loads. */
export function createMonsterArt(speciesId: string, glow = 0x56ead0): THREE.Group {
  const group = new THREE.Group();
  const pivot = new THREE.Group(); pivot.position.y = .82; pivot.name = "monster-animation-pivot";
  group.add(pivot);
  const shadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({ color: 0x030a0c, transparent: true, opacity: .38, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .016; group.add(shadow);
  const halo = new THREE.Mesh(haloGeometry, new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: .64, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = .03; group.add(halo);
  states.set(group, { generation: 0, disposed: false, pivot });
  setMonsterArt(group, speciesId, glow);
  return group;
}

export function setMonsterArt(group: THREE.Group, speciesId: string, glow = 0x56ead0): void {
  const state = states.get(group);
  if (!state || state.disposed) return;
  const generation = ++state.generation;
  clearArt(state);
  const halo = group.children[2] as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  halo.material.color.setHex(glow);
  Object.assign(group.userData, { speciesId, sourceSprite: DEX[speciesId]?.sprite ?? "", sourceHash: "", modelStatus: "loading", mode: "sprite-fallback", modelKind: "sprite-fallback" });
  const fallback = acquireFallback(speciesId);
  state.fallback = fallback;
  const pose = new THREE.Sprite(fallback.material); pose.scale.set(1.7, 1.7, 1); pose.name = "temporary-original-pose";
  state.pivot.add(pose);
  void acquireMonsterModel(speciesId).then(lease => {
    if (state.disposed || state.generation !== generation) { lease.release(); return; }
    clearArt(state); state.lease = lease;
    const mesh = new THREE.Mesh(lease.geometry, materialFor(speciesId));
    mesh.name = `monster-model-${speciesId}`; mesh.castShadow = true; mesh.receiveShadow = false;
    state.pivot.add(mesh);
    Object.assign(group.userData, { modelStatus: "ready", mode: "source-volume", modelKind: lease.kind, sourceSprite: lease.data.sourceSprite, sourceHash: lease.data.sourceHash });
  }).catch(() => {
    if (state.disposed || state.generation !== generation) return;
    Object.assign(group.userData, { modelStatus: "error", mode: "sprite-fallback", modelKind: "sprite-fallback" });
    pose.name = "error-original-pose";
  });
}

export function disposeMonsterArt(group: THREE.Group): void {
  const state = states.get(group);
  if (!state || state.disposed) return;
  state.disposed = true; state.generation++; clearArt(state);
  // Shared model/ground geometries, model material and fallback leases have their
  // own cache owners. Only these two ground materials belong to this instance.
  for (const child of group.children.slice(1)) if (child instanceof THREE.Mesh) (child.material as THREE.Material).dispose();
  group.removeFromParent(); group.userData.modelStatus = "disposed";
}
