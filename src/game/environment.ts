import * as THREE from "three";
import { getDistrictGraphics, type DistrictGraphics } from "./graphics-profile";
import { createDistrictWeather } from "./weather";

export type SurfaceKind = "floor" | "wall" | "metal" | "wood";

const materialCache = new Map<string, THREE.MeshStandardMaterial>();
const sourceTextures = new Map<SurfaceKind, { color: THREE.CanvasTexture; roughness: THREE.CanvasTexture }>();
const tiledTextures = new Map<string, { color: THREE.CanvasTexture; roughness: THREE.CanvasTexture }>();
const detailBox = new THREE.BoxGeometry(1, 1, 1);

// A fixed seed keeps the texture/detail layout identical on every device/save.
function randomSource(seed: number) {
  let value = seed | 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

function canvasTexture(canvas: HTMLCanvasElement, color: boolean) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function generateSurface(kind: SurfaceKind) {
  const cached = sourceTextures.get(kind);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const roughness = document.createElement("canvas");
  roughness.width = roughness.height = 512;
  const rough = roughness.getContext("2d")!;
  const random = randomSource({ floor: 4831, wall: 8157, metal: 9661, wood: 2089 }[kind]);

  ctx.fillStyle = kind === "metal" ? "#92958e" : "#c9c7bd";
  ctx.fillRect(0, 0, 512, 512);
  rough.fillStyle = kind === "floor" ? "#dadada" : "#e8e8e8";
  rough.fillRect(0, 0, 512, 512);

  if (kind === "floor" || kind === "wall") {
    const width = kind === "floor" ? 32 : 96;
    const height = kind === "floor" ? 32 : 32;
    ctx.fillStyle = "#77796f";
    ctx.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 512 / height; row++) {
      const offset = kind === "wall" && row % 2 ? -width / 2 : 0;
      for (let x = offset; x < 512; x += width) {
        const value = Math.floor(170 + random() * 53);
        ctx.fillStyle = `rgb(${value},${value - 2},${value - 8})`;
        ctx.fillRect(x + 1.5, row * height + 1.5, width - 3, height - 3);
        ctx.strokeStyle = "rgba(247,239,213,.15)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2.5, row * height + 2.5, width - 5, height - 5);
        if (random() > 0.64) {
          ctx.strokeStyle = "rgba(69,71,62,.32)";
          ctx.beginPath();
          ctx.moveTo(x + width * random(), row * height + 1);
          ctx.lineTo(x + width * random(), row * height + height * 0.45);
          ctx.lineTo(x + width * random(), row * height + height * 0.75);
          ctx.stroke();
        }
      }
    }
  }

  if (kind === "wood") {
    for (let x = 0; x < 512; x += 64) {
      const value = Math.floor(140 + random() * 40);
      ctx.fillStyle = `rgb(${value + 31},${value + 20},${value})`;
      ctx.fillRect(x + 1, 0, 62, 512);
      for (let line = 0; line < 19; line++) {
        const lx = x + 3 + random() * 57;
        ctx.strokeStyle = `rgba(81,64,39,${0.08 + random() * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.bezierCurveTo(lx - 5, 155, lx + 7, 320, lx, 512);
        ctx.stroke();
      }
      ctx.fillStyle = "#6e6a58";
      ctx.fillRect(x, 0, 1.5, 512);
    }
  }

  // Broad, translucent mineral stains sit under the finer surface grain.
  for (let i = 0; i < (kind === "metal" ? 58 : 32); i++) {
    const x = random() * 512, y = random() * 512;
    const radius = 8 + random() * 67;
    const stain = ctx.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, kind === "metal" ? "rgba(110,71,38,.22)" : "rgba(62,70,51,.14)");
    stain.addColorStop(1, "rgba(62,70,51,0)");
    ctx.fillStyle = stain;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    const wet = rough.createRadialGradient(x, y, 0, x, y, radius);
    wet.addColorStop(0, kind === "floor" ? "rgba(35,35,35,.72)" : "rgba(130,130,130,.22)");
    wet.addColorStop(1, "rgba(130,130,130,0)");
    rough.fillStyle = wet;
    rough.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const pixels = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const noise = Math.round((random() - 0.5) * (kind === "metal" ? 23 : 16));
    pixels.data[i] += noise;
    pixels.data[i + 1] += noise;
    pixels.data[i + 2] += noise;
  }
  ctx.putImageData(pixels, 0, 0);
  if (kind === "metal") {
    ctx.strokeStyle = "rgba(231,233,213,.2)";
    for (let i = 0; i < 80; i++) {
      const x = random() * 512, y = random() * 512;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3 + random() * 45, y + random() * 3); ctx.stroke();
    }
  }

  const textures = { color: canvasTexture(canvas, true), roughness: canvasTexture(roughness, false) };
  sourceTextures.set(kind, textures);
  return textures;
}

/** Shared weathered surfaces; textureScale allows smaller indoor rooms to use larger tiles. */
export function surfaceMaterial(kind: SurfaceKind, color?: THREE.ColorRepresentation, textureScale = 1) {
  const defaults = { floor: 0xaaa897, wall: 0xc4b79e, metal: 0x60665f, wood: 0x9e8765 };
  const tint = new THREE.Color(color ?? defaults[kind]);
  const key = `${kind}:${tint.getHexString()}:${textureScale}`;
  const cached = materialCache.get(key);
  if (cached) return cached;
  const textureKey = `${kind}:${textureScale}`;
  let textures = tiledTextures.get(textureKey);
  if (!textures) {
    const source = generateSurface(kind);
    const repeat = (kind === "floor" ? 8 : 1) * Math.max(0.05, textureScale);
    textures = { color: source.color.clone(), roughness: source.roughness.clone() };
    textures.color.repeat.set(repeat, repeat);
    textures.roughness.repeat.copy(textures.color.repeat);
    textures.color.needsUpdate = textures.roughness.needsUpdate = true;
    tiledTextures.set(textureKey, textures);
  }
  const material = new THREE.MeshStandardMaterial({
    color: tint,
    map: textures.color,
    roughnessMap: textures.roughness,
    bumpMap: textures.color,
    bumpScale: kind === "floor" ? 0.035 : kind === "wall" ? 0.045 : 0.012,
    roughness: kind === "metal" ? 0.76 : kind === "floor" ? 0.91 : 0.94,
    metalness: kind === "metal" ? 0.58 : kind === "floor" ? 0.07 : 0.015,
    envMapIntensity: kind === "floor" ? 0.55 : 0.32,
  });
  material.name = `weathered-${kind}`;
  materialCache.set(key, material);
  return material;
}

const windowDark = new THREE.MeshStandardMaterial({ color: 0x243538, roughness: 0.33, metalness: 0.3, envMapIntensity: 0.7 });
const windowWarm = new THREE.MeshStandardMaterial({ color: 0xa28c62, emissive: 0xa97939, emissiveIntensity: 0.45, roughness: 0.5 });
const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x514f44, roughness: 0.87, metalness: 0.12 });

type DetailPart = { position: THREE.Vector3; scale: THREE.Vector3; angle: number };
function instanceParts(group: THREE.Group, material: THREE.Material, parts: DetailPart[], shadow = false) {
  if (!parts.length) return;
  const mesh = new THREE.InstancedMesh(detailBox, material, parts.length);
  const transform = new THREE.Object3D();
  parts.forEach((part, i) => {
    transform.position.copy(part.position);
    transform.scale.copy(part.scale);
    transform.rotation.set(0, part.angle, 0);
    transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  group.add(mesh);
}

/** Small, instanced facade details. The group origin must be at the building's base. */
export function dressBuilding(group: THREE.Group, width: number, depth: number, height: number, seed = 1) {
  if (Math.min(width, depth, height) < 0.7) return;
  const random = randomSource(seed * 7919 + 31);
  const metal: DetailPart[] = [], frames: DetailPart[] = [], dark: DetailPart[] = [], lit: DetailPart[] = [];
  const add = (parts: DetailPart[], x: number, y: number, z: number, w: number, h: number, d: number, angle = 0) => {
    parts.push({ position: new THREE.Vector3(x, y, z), scale: new THREE.Vector3(w, h, d), angle });
  };
  const roof = height - 0.13;
  add(metal, 0, roof, depth / 2 + 0.035, width + 0.15, 0.16, 0.13);
  add(metal, 0, roof, -depth / 2 - 0.035, width + 0.15, 0.16, 0.13);
  add(metal, width / 2 + 0.035, roof, 0, 0.13, 0.16, depth + 0.15);
  add(metal, -width / 2 - 0.035, roof, 0, 0.13, 0.16, depth + 0.15);

  // Drainpipes and their straps add human scale without individual meshes.
  const pipeX = width / 2 - Math.min(0.35, width / 8);
  add(metal, pipeX, height / 2, depth / 2 + 0.13, 0.09, height - 0.12, 0.09);
  for (let y = 0.5; y < height - 0.5; y += 1.6) add(metal, pipeX, y, depth / 2 + 0.08, 0.19, 0.06, 0.14);
  add(metal, pipeX - 0.13, 0.16, depth / 2 + 0.14, 0.32, 0.09, 0.09);

  const storeys = Math.min(5, Math.floor((height - 0.65) / 2.1));
  if (width > 2.5 && depth > 2.5) {
    for (const side of [0, 1, 2, 3]) {
      const faceWidth = side % 2 ? depth : width;
      const columns = Math.min(5, Math.max(1, Math.floor((faceWidth - 1) / 1.8)));
      const windowWidth = Math.min(0.85, (faceWidth - 1.2) / columns * 0.58);
      for (let floor = 0; floor < storeys; floor++) {
        for (let column = 0; column < columns; column++) {
          const horizontal = (column - (columns - 1) / 2) * (faceWidth - 1.1) / columns;
          const y = 1.45 + floor * 2.1;
          const facing = side * Math.PI / 2;
          const x = side === 1 ? width / 2 + 0.032 : side === 3 ? -width / 2 - 0.032 : horizontal;
          const z = side === 0 ? depth / 2 + 0.032 : side === 2 ? -depth / 2 - 0.032 : horizontal;
          add(frames, x, y, z, windowWidth + 0.16, 1.02, 0.08, facing);
          const outside = new THREE.Vector3(Math.sin(facing), 0, Math.cos(facing)).multiplyScalar(0.05);
          add(random() > 0.82 ? lit : dark, x + outside.x, y, z + outside.z, windowWidth, 0.86, 0.035, facing);
          add(metal, x + outside.x * 1.7, y - 0.51, z + outside.z * 1.7, windowWidth + 0.24, 0.07, 0.24, facing);
        }
      }
    }
  }

  if (width > 3 && depth > 3) {
    // A low rooftop ventilation housing, separate dark opening and iron cap.
    const x = -width * 0.2, z = -depth * 0.19;
    add(metal, x, height + 0.23, z, Math.min(1.1, width * 0.22), 0.46, Math.min(0.9, depth * 0.22));
    add(metal, x, height + 0.48, z, Math.min(1.3, width * 0.25), 0.07, Math.min(1.1, depth * 0.26));
    add(dark, x, height + 0.22, z + Math.min(0.9, depth * 0.22) / 2 + 0.008, 0.56, 0.22, 0.025);
  }
  instanceParts(group, surfaceMaterial("metal"), metal, true);
  instanceParts(group, frameMaterial, frames);
  instanceParts(group, windowDark, dark);
  instanceParts(group, windowWarm, lit);
}

/** Linear HDR light cards provide genuine roughness-filtered reflections on wet paving. */
function districtReflection(generator: THREE.PMREMGenerator, profile: DistrictGraphics, indoor: boolean) {
  const probeScene = new THREE.Scene();
  const resources: { dispose: () => void }[] = [];
  const shellGeometry = new THREE.BoxGeometry(60, 60, 60);
  const shellMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(profile.fillColor).multiplyScalar(indoor ? .16 : .09),
    side: THREE.BackSide,
  });
  probeScene.add(new THREE.Mesh(shellGeometry, shellMaterial));
  resources.push(shellGeometry, shellMaterial);
  const panelGeometry = new THREE.PlaneGeometry(1, 1);
  resources.push(panelGeometry);
  const origin = new THREE.Vector3();
  const panel = (color: string, brightness: number, x: number, y: number, z: number, width: number, height: number) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(brightness), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(panelGeometry, material);
    mesh.position.set(x, y, z); mesh.scale.set(width, height, 1); mesh.lookAt(origin);
    resources.push(material); probeScene.add(mesh);
  };
  // A broad white/amber opening, cool sky slit and restrained district-colored sign.
  panel(profile.keyColor, indoor ? 3.3 : 5.5, -15, 12, 10, 15, 8);
  panel(profile.fillColor, indoor ? .9 : 1.8, 14, 8, -12, 7, 12);
  panel(profile.accent, indoor ? 1.1 : 2.4, 9, 2.2, 15, 7, 1.4);
  panel(profile.keyColor, indoor ? 1.2 : 2.6, -11, 2.5, -14, 4, 1.2);
  const target = generator.fromScene(probeScene, .045, .1, 100, { size: 128 });
  for (const resource of resources) resource.dispose();
  return target;
}

export type GameEnvironment = {
  update: (player: THREE.Object3D, dt: number) => void;
  setIndoor: (indoor: boolean) => void;
  setDistrict: (mapId: string, indoor?: boolean) => void;
  getDiagnostics: () => {
    district: string; indoor: boolean; rainDrops: number; rippleCount: number;
    mistPatches: number; lights: number; reflection: string;
  };
  dispose: () => void;
};

/** Amber key, blue shadow fill, wet reflections and bounded rain for the current map. */
export function createEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer): GameEnvironment {
  const previous = {
    background: scene.background, fog: scene.fog, environment: scene.environment,
    intensity: scene.environmentIntensity, toneMapping: renderer.toneMapping,
    exposure: renderer.toneMappingExposure, shadows: renderer.shadowMap.enabled,
    shadowType: renderer.shadowMap.type,
  };
  const root = new THREE.Group(); root.name = "cinematic-district-environment"; scene.add(root);
  const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760;
  const skyFill = new THREE.HemisphereLight(0x50778d, 0x211b15, .65);
  const key = new THREE.DirectionalLight(0xffe0b2, 2.1);
  const rim = new THREE.DirectionalLight(0x7596ad, .45);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { near: 1, far: 105, left: -23, right: 23, top: 23, bottom: -23 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -.00018; key.shadow.normalBias = .035; key.shadow.radius = 2;
  root.add(skyFill, key, key.target, rim, rim.target);
  const keyOffset = new THREE.Vector3(-24, 30, 17);
  const rimOffset = new THREE.Vector3(17, 12, -19);
  const shadowCenter = new THREE.Vector3();
  const fog = new THREE.FogExp2(0x102331, .024);
  const background = new THREE.Color();
  const generator = new THREE.PMREMGenerator(renderer);
  let reflection: THREE.WebGLRenderTarget | undefined;
  const weather = createDistrictWeather(root, mobile);

  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array((mobile ? 28 : 48) * 3);
  const random = randomSource(7159);
  for (let i = 0; i < dustPositions.length; i += 3) {
    dustPositions[i] = (random() - .5) * 18;
    dustPositions[i + 1] = .3 + random() * 4.5;
    dustPositions[i + 2] = (random() - .5) * 18;
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: 0xe7c99f, size: .023, transparent: true, opacity: .19, depthWrite: false,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.name = "interior-dust"; dust.frustumCulled = false; root.add(dust);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  let district = "", indoor = true, initial = true, elapsed = 0;

  const setDistrict = (mapId: string, indoorValue?: boolean) => {
    // The animation loop calls this every frame; unchanged maps do absolutely no GPU work.
    if (district === mapId && (indoorValue === undefined || indoor === indoorValue)) return;
    const resolvedIndoor = indoorValue ?? getDistrictGraphics(mapId).indoor;
    district = mapId; indoor = resolvedIndoor;
    const profile = getDistrictGraphics(mapId, indoor);
    background.set(profile.background); scene.background = background;
    fog.color.set(profile.fog.color); fog.density = profile.fog.density;
    scene.fog = profile.fog.density > 0 ? fog : null;
    renderer.toneMappingExposure = profile.exposure;
    key.color.set(profile.keyColor); key.intensity = profile.keyIntensity;
    skyFill.color.set(profile.fillColor); skyFill.intensity = profile.fillIntensity;
    rim.color.set(profile.fillColor).lerp(new THREE.Color(profile.accent), .12);
    rim.intensity = indoor ? .28 : .48;
    scene.environmentIntensity = profile.environmentIntensity;
    const nextReflection = districtReflection(generator, profile, indoor);
    scene.environment = nextReflection.texture;
    reflection?.dispose(); reflection = nextReflection;
    weather.setStyle({ rain: profile.rain, fill: profile.fillColor, accent: profile.accent, indoor });
    dust.visible = indoor;
    dustMaterial.color.set(profile.keyColor);
    initial = true;
  };
  setDistrict("capsule", true);

  return {
    setDistrict,
    setIndoor(value) { setDistrict(district, value); },
    getDiagnostics() {
      return { district, indoor, ...weather.getDiagnostics(), lights: 3, reflection: "hdr-pmrem" };
    },
    update(player, dt) {
      const step = Math.min(Math.max(dt, 0), .1);
      elapsed = (elapsed + step) % 4096;
      if (initial || shadowCenter.distanceToSquared(player.position) > 300) {
        shadowCenter.copy(player.position); initial = false;
      } else shadowCenter.lerp(player.position, 1 - Math.exp(-4 * step));
      key.target.position.copy(shadowCenter); key.position.copy(shadowCenter).add(keyOffset);
      rim.target.position.copy(shadowCenter); rim.position.copy(shadowCenter).add(rimOffset);
      dust.position.set(player.position.x + Math.sin(elapsed * .13) * .9, 0, player.position.z + Math.cos(elapsed * .1) * .9);
      dust.rotation.y = Math.sin(elapsed * .02) * .08;
      weather.update(player, step);
    },
    dispose() {
      weather.dispose(); scene.remove(root);
      dustGeometry.dispose(); dustMaterial.dispose();
      key.dispose(); rim.dispose(); skyFill.dispose();
      reflection?.dispose(); generator.dispose();
      scene.background = previous.background; scene.fog = previous.fog;
      scene.environment = previous.environment; scene.environmentIntensity = previous.intensity;
      renderer.toneMapping = previous.toneMapping; renderer.toneMappingExposure = previous.exposure;
      renderer.shadowMap.enabled = previous.shadows; renderer.shadowMap.type = previous.shadowType;
    },
  };
}
