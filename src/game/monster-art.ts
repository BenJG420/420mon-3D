import * as THREE from "three";
import { DEX } from "./data/dex";
import { SPRITE_FRAME, spriteUrl } from "./sprites";

// Reuse one decoded texture and material per species across encounters and allies.
// These are authentic original poses in the 3D world; distinct mesh models can
// later replace the sprite without changing battle or world ownership.
const materials = new Map<string, THREE.SpriteMaterial>();
const loader = new THREE.TextureLoader();
const shadowGeometry = new THREE.CircleGeometry(0.48, 20);
const haloGeometry = new THREE.TorusGeometry(0.57, 0.012, 4, 32);
let missingArt: THREE.Texture | undefined;

function missingTexture(): THREE.Texture {
  if (missingArt) return missingArt;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "#63dfd5";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(64, 14); ctx.lineTo(108, 64);
  ctx.lineTo(64, 114); ctx.lineTo(20, 64); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = "#cffcf5"; ctx.textAlign = "center";
  ctx.font = "bold 42px sans-serif"; ctx.fillText("?", 64, 78);
  missingArt = new THREE.CanvasTexture(canvas);
  missingArt.colorSpace = THREE.SRGBColorSpace;
  return missingArt;
}

function materialFor(speciesId: string): THREE.SpriteMaterial {
  const sp = DEX[speciesId];
  const key = sp?.sprite ?? "__missing__";
  const cached = materials.get(key);
  if (cached) return cached;
  const material = new THREE.SpriteMaterial({
    map: missingTexture(), transparent: true, alphaTest: 0.06, depthWrite: false,
    toneMapped: false,
  });
  materials.set(key, material);
  if (sp) {
    loader.load(spriteUrl(sp.sprite), texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.repeat.set(SPRITE_FRAME.repeatX, SPRITE_FRAME.repeatY);
      // Three.js flips uploaded image Y, so offsetY = .5 selects the top row.
      texture.offset.set(SPRITE_FRAME.offsetX, SPRITE_FRAME.offsetY);
      texture.minFilter = texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      material.map = texture;
      material.needsUpdate = true;
    }, undefined, () => {
      // Keep an explicit missing-art token if the request fails.
      material.map = missingTexture(); material.needsUpdate = true;
    });
  }
  return material;
}

export function createMonsterArt(speciesId: string, glow = 0x56ead0): THREE.Group {
  const group = new THREE.Group();
  const art = new THREE.Sprite(materialFor(speciesId));
  art.position.y = 0.82;
  art.scale.set(1.7, 1.7, 1);
  group.add(art);
  const shadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({
    color: 0x030a0c, transparent: true, opacity: 0.38, depthWrite: false,
  }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.016;
  group.add(shadow);
  const halo = new THREE.Mesh(haloGeometry, new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.64, depthWrite: false,
  }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = 0.03;
  group.add(halo);
  group.userData.speciesId = speciesId;
  return group;
}

export function setMonsterArt(group: THREE.Group, speciesId: string, glow = 0x56ead0): void {
  const art = group.children[0] as THREE.Sprite;
  art.material = materialFor(speciesId);
  const halo = group.children[2] as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  halo.material.color.setHex(glow);
  group.userData.speciesId = speciesId;
}

export function disposeMonsterArt(group: THREE.Group): void {
  // Sprite textures/materials and geometries remain shared; dispose only the
  // per-instance ground materials when an ally is removed.
  for (const child of group.children) {
    if (child instanceof THREE.Mesh) (child.material as THREE.Material).dispose();
  }
  group.removeFromParent();
}
