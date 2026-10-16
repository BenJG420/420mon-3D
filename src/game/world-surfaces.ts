import * as THREE from "three";

/** Small, deterministic, local PBR tiles. No network textures or per-map copies. */
export type WorldSurface = "stone" | "wood" | "plaster" | "metal" | "asphalt";
const SIZE = 256;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const noise = (x: number, y: number, seed = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 51.13) * 43758.5453;
  return n - Math.floor(n);
};
type Tile = { color: THREE.CanvasTexture; roughness: THREE.CanvasTexture; normal: THREE.DataTexture };

function tile(kind: WorldSurface): Tile {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = SIZE;
  const roughCanvas = document.createElement("canvas"); roughCanvas.width = roughCanvas.height = SIZE;
  const context = canvas.getContext("2d")!;
  const roughContext = roughCanvas.getContext("2d")!;
  const pixels = context.createImageData(SIZE, SIZE), rough = roughContext.createImageData(SIZE, SIZE);
  const height = new Float32Array(SIZE * SIZE);
  // The neutral albedo multiplies the district's actual material color.
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = y * SIZE + x, p = i * 4;
    const grain = noise(x, y), coarse = noise(Math.floor(x / 8), Math.floor(y / 8), 1);
    let value = .71 + (grain - .5) * .13, h = .5 + (grain - .5) * .1, r = .72;
    if (kind === "stone") {
      const row = Math.floor(y / 43), bx = (x + (row % 2) * 26) % 64, by = y % 43;
      const seam = bx < 3 || by < 3 || bx > 61 || by > 40;
      const edge = Math.min(bx, 64 - bx, by, 43 - by);
      const stone = noise(Math.floor((x + (row % 2) * 26) / 64), row, 2);
      value = seam ? .27 + grain * .06 : .61 + stone * .21 + (grain - .5) * .12;
      h = seam ? .1 : .58 + Math.min(1, edge / 8) * .16 + (grain - .5) * .06;
      r = seam ? .88 : .48 + stone * .19;
    } else if (kind === "wood") {
      const seam = x % 64 < 3;
      const ring = Math.sin(x * .67 + Math.sin(y * .025) * 2 + Math.sin(y * .06 + x * .08));
      value = seam ? .24 : .62 + ring * .09 + grain * .12;
      h = seam ? .12 : .55 + ring * .05 + grain * .03; r = .76;
    } else if (kind === "plaster") {
      const row = Math.floor(y / 32), bx = (x + (row % 2) * 32) % 64;
      // Hairline masonry and mineral inclusions remain subtle below dirty paint.
      const seam = bx < 1.5 || y % 32 < 1.5;
      const damp = .1 * Math.sin(x * .03 + y * .012) + coarse * .07;
      value = .68 + grain * .15 - damp - (seam ? .13 : 0);
      h = .5 + grain * .06 - (seam ? .1 : 0); r = .9;
    } else if (kind === "metal") {
      const scratch = noise(x, Math.floor(y / 3), 7) > .983;
      const rust = coarse > .85 && grain > .3;
      value = .65 + grain * .1 + (scratch ? .19 : 0) - (rust ? .17 : 0);
      h = .5 + (scratch ? .035 : 0) + grain * .018; r = rust ? .93 : .37 + coarse * .2;
    } else {
      // Fine crushed aggregate and winding sealed cracks, rather than giant tiles.
      const crack = Math.abs(Math.sin(x * .032 + Math.sin(y * .041) * .9)) < .019;
      const aggregate = grain > .91 ? .13 : grain < .09 ? -.1 : 0;
      value = .52 + grain * .13 + aggregate - (crack ? .25 : 0);
      h = .5 + grain * .045 + aggregate * .15 - (crack ? .12 : 0);
      r = .62 + coarse * .18;
    }
    height[i] = h;
    const shade = Math.round(clamp(value) * 255);
    pixels.data[p] = shade; pixels.data[p + 1] = Math.round(shade * (kind === "wood" ? .92 : 1));
    pixels.data[p + 2] = Math.round(shade * (kind === "wood" ? .79 : 1)); pixels.data[p + 3] = 255;
    const rv = Math.round(clamp(r + (grain - .5) * .04) * 255);
    rough.data[p] = rough.data[p + 1] = rough.data[p + 2] = rv; rough.data[p + 3] = 255;
  }
  context.putImageData(pixels, 0, 0); roughContext.putImageData(rough, 0, 0);
  const normals = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    const dx = height[y * SIZE + (x + 1) % SIZE] - height[y * SIZE + (x + SIZE - 1) % SIZE];
    const dy = height[((y + 1) % SIZE) * SIZE + x] - height[((y + SIZE - 1) % SIZE) * SIZE + x];
    const nx = -dx * 3, ny = -dy * 3, inverseLength = 1 / Math.sqrt(nx * nx + ny * ny + 1);
    normals[i] = (nx * inverseLength * .5 + .5) * 255; normals[i + 1] = (ny * inverseLength * .5 + .5) * 255;
    normals[i + 2] = (inverseLength * .5 + .5) * 255; normals[i + 3] = 255;
  }
  const color = new THREE.CanvasTexture(canvas), roughness = new THREE.CanvasTexture(roughCanvas);
  const normal = new THREE.DataTexture(normals, SIZE, SIZE, THREE.RGBAFormat);
  color.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [color, roughness, normal]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 4;
    texture.generateMipmaps = true; texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
  }
  return { color, roughness, normal };
}

export function createWorldSurfaces() {
  const tiles = Object.fromEntries((["stone", "wood", "plaster", "metal", "asphalt"] as const).map(kind => [kind, tile(kind)])) as Record<WorldSurface, Tile>;
  const materials = new Map<string, THREE.MeshPhysicalMaterial>();
  let wetness = 0;
  const apply = (material: THREE.MeshPhysicalMaterial) => {
    const kind = material.userData.surface as WorldSurface | undefined;
    const wet = kind === "wood" ? wetness * .16 : kind === "plaster" ? wetness * .34 : wetness;
    material.roughness = kind === "metal" ? .72 - wet * .32 : .98 - wet * .32;
    material.clearcoat = kind ? wet * .76 : 0;
    material.clearcoatRoughness = .18 + (1 - wet) * .3;
  };
  return {
    material(color: THREE.ColorRepresentation, kind?: WorldSurface, emissive?: THREE.ColorRepresentation) {
      const key = `${new THREE.Color(color).getHexString()}-${kind ?? ""}-${emissive === undefined ? "" : new THREE.Color(emissive).getHexString()}`;
      let material = materials.get(key);
      if (!material) {
        const t = kind ? tiles[kind] : undefined;
        material = new THREE.MeshPhysicalMaterial({
          color, map: t?.color ?? null, roughnessMap: t?.roughness ?? null, normalMap: t?.normal ?? null,
          normalScale: new THREE.Vector2(kind === "stone" ? .65 : .3, kind === "stone" ? .65 : .3),
          metalness: kind === "metal" ? .68 : .015,
          emissive: emissive ?? 0, emissiveIntensity: emissive === undefined ? 0 : 2.4,
        });
        material.userData.surface = kind; material.userData.surfaceTile = kind ? (kind === "asphalt" ? 2.4 : kind === "stone" ? 2.8 : 1.8) : 0;
        apply(material); materials.set(key, material);
      }
      return material;
    },
    setWetness(value: number) { wetness = clamp(value); for (const material of materials.values()) apply(material); },
    // Texture lifetime belongs to this world, never to a single map transition.
    dispose() { for (const material of materials.values()) material.dispose(); for (const t of Object.values(tiles)) { t.color.dispose(); t.roughness.dispose(); t.normal.dispose(); } },
  };
}

/** Meter-scaled UVs avoid a different texture/cache entry for every wall size. */
export function projectSurfaceUvs(geometry: THREE.BufferGeometry, material: THREE.Material) {
  const scale = material.userData.surfaceTile as number | undefined;
  if (!scale) return;
  const position = geometry.getAttribute("position"), normal = geometry.getAttribute("normal"), uv = geometry.getAttribute("uv");
  if (!position || !normal || !uv) return;
  for (let i = 0; i < position.count; i++) {
    const x = Math.abs(normal.getX(i)), y = Math.abs(normal.getY(i)), z = Math.abs(normal.getZ(i));
    const u = y > x && y > z ? position.getX(i) : x > z ? position.getZ(i) : position.getX(i);
    const v = y > x && y > z ? position.getZ(i) : position.getY(i);
    uv.setXY(i, u / scale, v / scale);
  }
  uv.needsUpdate = true;
}
