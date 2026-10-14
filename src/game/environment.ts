import * as THREE from "three";

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

function reflectionSky() {
  const faces = ["#82989e", "#89989c", "#a3b5bb", "#4c5147", "#adb1a0", "#788f97"];
  const images = faces.map(color => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 32);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "#878779");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 32, 32);
    return canvas;
  });
  const cube = new THREE.CubeTexture(images);
  cube.colorSpace = THREE.SRGBColorSpace;
  cube.needsUpdate = true;
  return cube;
}

export type GameEnvironment = {
  update: (player: THREE.Object3D, dt: number) => void;
  setIndoor: (indoor: boolean) => void;
  dispose: () => void;
};

/** Warm late-day light, blue sky fill and a shadow volume that follows the player. */
export function createEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer): GameEnvironment {
  const previous = { background: scene.background, fog: scene.fog, environment: scene.environment, intensity: scene.environmentIntensity };
  const root = new THREE.Group();
  root.name = "cinematic-environment";
  scene.add(root);
  scene.background = new THREE.Color(0x697f85);
  scene.fog = new THREE.Fog(0x81918e, 48, 145);
  const sky = reflectionSky();
  scene.environment = sky;
  scene.environmentIntensity = 0.55;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemi = new THREE.HemisphereLight(0x9fc1d3, 0x443b29, 1.6);
  const sun = new THREE.DirectionalLight(0xffdea3, 3.25);
  sun.castShadow = true;
  const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { near: 1, far: 125, left: -25, right: 25, top: 25, bottom: -25 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 2;
  const bounce = new THREE.AmbientLight(0x938675, 0.19);
  root.add(hemi, sun, sun.target, bounce);

  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(60 * 3);
  const random = randomSource(7159);
  for (let i = 0; i < particlePositions.length; i += 3) {
    particlePositions[i] = (random() - 0.5) * 27;
    particlePositions[i + 1] = 0.3 + random() * 6;
    particlePositions[i + 2] = (random() - 0.5) * 27;
  }
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({ color: 0xf6e4b8, size: 0.028, transparent: true, opacity: 0.31, depthWrite: false });
  const dust = new THREE.Points(particleGeometry, particleMaterial);
  dust.frustumCulled = false;
  root.add(dust);
  const sunOffset = new THREE.Vector3(-28, 39, 24);
  const shadowCenter = new THREE.Vector3();
  let indoor = false, initial = true, elapsed = 0;
  sun.position.copy(sunOffset);

  return {
    setIndoor(value) {
      if (indoor === value) return;
      indoor = value;
      // Roofless cutaway rooms still receive a gentle key light for readability.
      sun.intensity = indoor ? 1.45 : 3.25;
      hemi.intensity = indoor ? 1.3 : 1.6;
      scene.environmentIntensity = indoor ? 0.3 : 0.55;
      scene.fog = indoor ? null : new THREE.Fog(0x81918e, 48, 145);
      scene.background = new THREE.Color(indoor ? 0x151d20 : 0x697f85);
      particleMaterial.opacity = indoor ? 0.2 : 0.31;
    },
    update(player, dt) {
      elapsed += Math.min(Math.max(dt, 0), 0.1);
      if (initial || shadowCenter.distanceToSquared(player.position) > 300) {
        shadowCenter.copy(player.position);
        initial = false;
      } else shadowCenter.lerp(player.position, 1 - Math.exp(-4 * dt));
      sun.target.position.copy(shadowCenter);
      sun.position.copy(shadowCenter).add(sunOffset);
      dust.position.set(player.position.x + Math.sin(elapsed * 0.13) * 0.9, player.position.y, player.position.z + Math.cos(elapsed * 0.1) * 0.9);
      dust.rotation.y = Math.sin(elapsed * 0.02) * 0.08;
    },
    dispose() {
      scene.remove(root);
      particleGeometry.dispose();
      particleMaterial.dispose();
      sun.shadow.map?.dispose();
      sky.dispose();
      scene.background = previous.background;
      scene.fog = previous.fog;
      scene.environment = previous.environment;
      scene.environmentIntensity = previous.intensity;
    },
  };
}
