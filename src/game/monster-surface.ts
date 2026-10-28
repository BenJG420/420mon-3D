import * as THREE from "three";

export type MonsterSurface = ReturnType<typeof createMonsterSurface>;

/** Reserve 4K for a capable desktop; unknown memory uses the bounded 2K tier. */
export function monsterStudioSurfaceSize(maxTextureSize: number, deviceMemory?: number, mobile = false): number {
  const max = Number.isFinite(maxTextureSize) ? Math.max(1, Math.floor(maxTextureSize)) : 1024;
  const memory = typeof deviceMemory === "number" && Number.isFinite(deviceMemory) ? deviceMemory : 0;
  const requested = mobile || (memory > 0 && memory <= 2) ? 1024 : memory >= 8 ? 4096 : 2048;
  return Math.min(requested, 2 ** Math.floor(Math.log2(max)));
}

/** Studio normal RGB + roughness A: one texture and mip chain, not two 4K allocations. */
function studioPixels(size: number) {
  const height = new Uint8Array(size * size), packed = new Uint8Array(size * size * 4);
  const hash = (x: number, y: number) => {
    let h = Math.imul(x ^ 0x1b873593, 0x85ebca6b) ^ Math.imul(y ^ 0x9e3779b9, 0xc2b2ae35);
    h = Math.imul(h ^ h >>> 16, 0x7feb352d); h ^= h >>> 15;
    return (h >>> 0) / 4294967295;
  };
  // Seamless slow cast/wear variation is sampled separately from genuine fine grain.
  const field = new Float32Array(33 * 33);
  for (let y = 0; y <= 32; y++) for (let x = 0; x <= 32; x++) field[y * 33 + x] = hash(x % 32, y % 32);
  const columns = new Uint16Array(size), blend = new Float32Array(size), brushing = new Float32Array(size);
  for (let x = 0; x < size; x++) {
    const coordinate = x / size * 32; columns[x] = Math.floor(coordinate);
    const f = coordinate - columns[x]; blend[x] = f * f * (3 - 2 * f);
    brushing[x] = Math.sin(x / size * Math.PI * 2 * 173) * 1.5;
  }
  for (let y = 0; y < size; y++) {
    const cy = columns[y], fy = blend[y];
    const scratch = hash(Math.floor(y / size * 2048), 791) > .997 ? 5 : 0;
    for (let x = 0; x < size; x++) {
      const cx = columns[x], fx = blend[x], row = cy * 33 + cx;
      const a = field[row] + (field[row + 1] - field[row]) * fx;
      const b = field[row + 33] + (field[row + 34] - field[row + 33]) * fx;
      const cast = a + (b - a) * fy, grain = hash(x, y);
      const wear = scratch * (hash(cx, cy + 91) > .45 ? 1 : 0);
      const i = y * size + x;
      height[i] = Math.round(115 + cast * 15 + grain * 5 + brushing[x] - wear);
      packed[i * 4 + 3] = Math.round(181 + cast * 26 + grain * 13 - wear * 2);
    }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, left = y * size + (x + size - 1) % size, right = y * size + (x + 1) % size;
    const below = ((y + size - 1) % size) * size + x, above = ((y + 1) % size) * size + x;
    const nx = (height[left] - height[right]) * .032, ny = (height[below] - height[above]) * .032;
    const length = Math.sqrt(nx * nx + ny * ny + 1), offset = i * 4;
    packed[offset] = Math.round((nx / length * .5 + .5) * 255);
    packed[offset + 1] = Math.round((ny / length * .5 + .5) * 255);
    packed[offset + 2] = Math.round((1 / length * .5 + .5) * 255);
  }
  return packed;
}

/** Only meshes with an explicit per-vertex mask use this material. */
function glowMaterial(source: THREE.MeshStandardMaterial) {
  const glow = source.clone(); glow.name = `${source.name}-masked-glow`;
  glow.onBeforeCompile = (shader, renderer) => {
    source.onBeforeCompile(shader, renderer);
    shader.vertexShader = "attribute float glowWeight; varying float vMonsterGlow;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvMonsterGlow = clamp(glowWeight, 0.0, 1.0);");
    shader.fragmentShader = "varying float vMonsterGlow;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vMonsterGlow * 1.7;");
  };
  glow.customProgramCacheKey = () => source.customProgramCacheKey() + "-masked-glow-v76";
  return glow;
}

/** Owned, deterministic PBR tiles; no sprite pixels or external texture downloads.
 * Default generation remains the existing world look; the studio opts into fine cast grain.
 */
export function createMonsterSurface(size = 512, options: { studio?: boolean; anisotropy?: number } = {}) {
  if (!Number.isInteger(size) || size < 1 || size > 4096) throw new Error("Ungültige Monster-Texturgröße");
  const studio = options.studio === true;
  if (studio) return createStudioSurface(size, options.anisotropy ?? 1);
  const normal = new Uint8Array(size * size * 4), rough = new Uint8Array(size * size * 4);
  const noise = (x: number, y: number) => {
    const a = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return a - Math.floor(a);
  };
  for (let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const i=(y*size+x)*4, grain=noise(x,y);
    normal.set([Math.round(128+(noise((x+1)%size,y)-grain)*17),Math.round(128+(noise(x,(y+1)%size)-grain)*17),255,255],i);
    const value=Math.round(185+grain*38);rough.set([value,value,value,255],i);
  }
  const texture=(data:Uint8Array)=>{const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
  const normalMap=texture(normal),roughnessMap=texture(rough);
  const material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:false,roughness:.88,metalness:.08,normalMap,roughnessMap,normalScale:new THREE.Vector2(.38,.38)});
  material.name="original-monster-pbr";
  const metal=material.clone();metal.name="monster-oxidized-metal";metal.metalness=.62;metal.roughness=.55;
  const wet=material.clone();wet.name="monster-wet-skin";wet.metalness=.03;wet.roughness=.48;wet.normalScale.setScalar(.2);
  const glow = glowMaterial(material);
  let disposed = false;
  return {material,metal,wet,glow,normalMap,roughnessMap,textureSize:size,dispose(){if(disposed)return;disposed=true;material.dispose();metal.dispose();wet.dispose();glow.dispose();normalMap.dispose();roughnessMap.dispose();}};
}

function createStudioSurface(size: number, anisotropy: number) {
  const packed = new THREE.DataTexture(studioPixels(size), size, size, THREE.RGBAFormat);
  packed.name = "monster-studio-normal-roughness";
  packed.wrapS = packed.wrapT = THREE.RepeatWrapping;
  packed.magFilter = THREE.LinearFilter; packed.minFilter = THREE.LinearMipmapLinearFilter;
  packed.generateMipmaps = true; packed.anisotropy = Math.max(1, Math.min(8, Math.floor(anisotropy) || 1)); packed.needsUpdate = true;
  packed.userData = { channels: "normal-rgb/roughness-a", textureSize: size };
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: .88, metalness: .08,
    normalMap: packed, roughnessMap: packed, normalScale: new THREE.Vector2(.38, .38) });
  material.name = "monster-studio-pbr";
  const metal = material.clone(); metal.name = "monster-studio-oxidized-metal"; metal.metalness = .62; metal.roughness = .55;
  const wet = material.clone(); wet.name = "monster-studio-wet-skin"; wet.metalness = .03; wet.roughness = .48; wet.normalScale.setScalar(.2);
  for (const value of [material, metal, wet]) {
    value.userData.textureSize = size;
    value.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", `
        float roughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
          roughnessFactor *= texture2D(roughnessMap, vRoughnessMapUv).a;
        #endif
      `);
    };
    value.customProgramCacheKey = () => "monster-studio-packed-v76";
  }
  const glow = glowMaterial(material);
  let disposed = false;
  return { material, metal, wet, glow, normalMap: packed, roughnessMap: packed, textureSize: size, dispose() {
    if (disposed) return; disposed = true;
    material.dispose(); metal.dispose(); wet.dispose(); glow.dispose(); packed.dispose();
  } };
}

/** Per-triangle dominant-axis UVs avoid stretching on eyes, plates and membranes. */
export function addMonsterSurfaceUvs(geometry:THREE.BufferGeometry) {
  const p=geometry.getAttribute("position"),n=geometry.getAttribute("normal");
  const uv=new Float32Array(p.count*2);
  for(let start=0;start<p.count;start+=3){
    const normal=new THREE.Vector3();for(let k=0;k<3;k++)normal.add(new THREE.Vector3(n.getX(start+k),n.getY(start+k),n.getZ(start+k)));
    const axis=Math.abs(normal.x)>Math.abs(normal.y)&&Math.abs(normal.x)>Math.abs(normal.z)?0:Math.abs(normal.y)>Math.abs(normal.z)?1:2;
    for(let k=0;k<3;k++){const i=start+k;uv[i*2]=(axis===0?p.getZ(i):p.getX(i))*2;uv[i*2+1]=(axis===1?p.getZ(i):p.getY(i))*2;}
  }
  geometry.setAttribute("uv",new THREE.BufferAttribute(uv,2));
  geometry.userData.surface="smooth-pbr";
  return geometry;
}
