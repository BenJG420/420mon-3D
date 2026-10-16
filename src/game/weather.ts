import * as THREE from "three";

type WeatherStyle = {
  rain: number;
  fill: THREE.ColorRepresentation;
  accent: THREE.ColorRepresentation;
  indoor: boolean;
};

/** The seeds stay on the GPU; neither rain nor splashes allocate in the frame loop. */
function instancedQuad(count: number, salt: number) {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0,
  ], 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  const seeds = new Float32Array(count * 4);
  let state = salt | 0;
  for (let i = 0; i < seeds.length; i++) {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    seeds[i] = (state >>> 0) / 4294967296;
  }
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
  geometry.instanceCount = count;
  return geometry;
}

const weatherVertexHeader = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform vec3 uAnchor;
  varying vec2 vUv;
  varying float vFade;
`;

const rainVertex = weatherVertexHeader + /* glsl */ `
  void main() {
    vUv = position.xy + .5;
    float height = mod(aSeed.z * 17.0 - uTime * (10.0 + aSeed.w * 5.0), 17.0);
    vec2 worldXZ = mod(aSeed.xy * 42.0 - uAnchor.xz + 21.0, 42.0) - 21.0 + uAnchor.xz;
    vec3 center = vec3(worldXZ.x, height + .15, worldXZ.y);
    center.x += height * .12;
    vec3 cameraRight = vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]);
    float streakLength = .28 + aSeed.w * .5;
    vec3 worldPosition = center + cameraRight * position.x * .028;
    worldPosition += vec3(.12, 1.0, .025) * position.y * streakLength;
    vFade = smoothstep(0.0, .7, height) * (1.0 - smoothstep(14.0, 17.0, height));
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
  }
`;

const rainFragment = /* glsl */ `
  uniform vec3 uTint;
  uniform float uAmount;
  varying vec2 vUv;
  varying float vFade;
  void main() {
    float edge = smoothstep(0.0, .35, vUv.x) * (1.0 - smoothstep(.65, 1.0, vUv.x));
    float tail = smoothstep(0.0, .45, vUv.y) * (1.0 - smoothstep(.8, 1.0, vUv.y));
    gl_FragColor = vec4(uTint, edge * tail * vFade * uAmount * .56);
    #include <colorspace_fragment>
  }
`;

const rippleVertex = weatherVertexHeader + /* glsl */ `
  void main() {
    vUv = position.xy * 2.0;
    float phase = fract(uTime * (.7 + aSeed.w * .5) + aSeed.z);
    float radius = .06 + phase * (.24 + aSeed.w * .17);
    vec2 worldXZ = mod(aSeed.xy * 33.0 - uAnchor.xz + 16.5, 33.0) - 16.5 + uAnchor.xz;
    vec3 center = vec3(worldXZ.x, .026, worldXZ.y);
    vec3 worldPosition = center + vec3(position.x * radius * 2.0, 0.0, position.y * radius * 2.0);
    vFade = (1.0 - phase) * (1.0 - phase);
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
  }
`;

const rippleFragment = /* glsl */ `
  uniform vec3 uTint;
  uniform float uAmount;
  varying vec2 vUv;
  varying float vFade;
  void main() {
    float ring = 1.0 - smoothstep(.035, .1, abs(length(vUv) - .72));
    float splash = (1.0 - smoothstep(.04, .11, length(vUv))) * pow(vFade, 5.0);
    float opacity = (ring * .32 + splash * .7) * vFade * uAmount;
    if (opacity < .004) discard;
    gl_FragColor = vec4(uTint, opacity);
    #include <colorspace_fragment>
  }
`;

const mistVertex = weatherVertexHeader + /* glsl */ `
  void main() {
    vUv = position.xy + .5;
    vec2 worldXZ = mod(aSeed.xy * 44.0 - uAnchor.xz + 22.0, 44.0) - 22.0 + uAnchor.xz;
    vec3 center = vec3(worldXZ.x, .38 + aSeed.w * .65, worldXZ.y);
    center.x += sin(uTime * .09 + aSeed.z * 6.28) * 2.0;
    center.z += cos(uTime * .06 + aSeed.w * 6.28) * 1.3;
    vec3 right = vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]);
    vec3 worldPosition = center + right * position.x * (5.0 + aSeed.w * 7.0);
    worldPosition.y += position.y * (1.0 + aSeed.z * .7);
    vFade = .65 + sin(uTime * .12 + aSeed.z * 6.28) * .35;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
  }
`;

const mistFragment = /* glsl */ `
  uniform vec3 uTint;
  uniform float uAmount;
  uniform float uTime;
  varying vec2 vUv;
  varying float vFade;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float edge = max(0.0, 1.0 - dot(p, p));
    float curls = .65 + .2 * sin(p.x * 9.0 + sin(p.y * 8.0 + uTime * .2))
      + .15 * sin(p.x * 17.0 - p.y * 6.0 - uTime * .13);
    float opacity = edge * edge * curls * vFade * uAmount * .085;
    gl_FragColor = vec4(uTint, opacity);
    #include <colorspace_fragment>
  }
`;

export function createDistrictWeather(parent: THREE.Object3D, mobile: boolean) {
  const root = new THREE.Group(); root.name = "district-rain-and-ground-mist";
  parent.add(root);
  const anchor = new THREE.Vector3();
  const time = { value: 0 };
  const amount = { value: 0 };
  const mistAmount = { value: 0 };
  const tint = { value: new THREE.Color(0xadc9df) };
  const mistTint = { value: new THREE.Color(0x3d667c) };
  const common = { uTime: time, uAnchor: { value: anchor }, uAmount: amount, uTint: tint };
  const rainGeometry = instancedQuad(mobile ? 420 : 1100, 19793);
  const rippleGeometry = instancedQuad(mobile ? 48 : 96, 58391);
  const mistGeometry = instancedQuad(mobile ? 10 : 18, 32749);
  const material = (vertexShader: string, fragmentShader: string, mist = false) => new THREE.ShaderMaterial({
    uniforms: mist ? { ...common, uTint: mistTint, uAmount: mistAmount } : common,
    vertexShader, fragmentShader, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, blending: mist ? THREE.NormalBlending : THREE.AdditiveBlending,
    toneMapped: false,
  });
  const rainMaterial = material(rainVertex, rainFragment);
  const rippleMaterial = material(rippleVertex, rippleFragment);
  const mistMaterial = material(mistVertex, mistFragment, true);
  const rain = new THREE.Mesh(rainGeometry, rainMaterial);
  const ripples = new THREE.Mesh(rippleGeometry, rippleMaterial);
  const mist = new THREE.Mesh(mistGeometry, mistMaterial);
  rain.name = "gpu-rain-streaks"; ripples.name = "gpu-rain-splashes"; mist.name = "ground-haze";
  for (const mesh of [rain, ripples, mist]) { mesh.frustumCulled = false; mesh.renderOrder = 2; root.add(mesh); }
  root.visible = false;
  let strength = 0;
  let outside = false;

  return {
    setStyle(style: WeatherStyle) {
      strength = style.indoor ? 0 : THREE.MathUtils.clamp(style.rain, 0, 1);
      outside = !style.indoor;
      root.visible = outside;
      rain.visible = ripples.visible = strength > 0;
      amount.value = strength;
      mistAmount.value = outside ? .45 + strength * .55 : 0;
      tint.value.set(style.fill).lerp(new THREE.Color(0xd8e8ed), .65);
      mistTint.value.set(style.fill).lerp(new THREE.Color(style.accent), .2);
      rainGeometry.instanceCount = Math.ceil((mobile ? 420 : 1100) * strength);
      rippleGeometry.instanceCount = Math.ceil((mobile ? 48 : 96) * strength);
    },
    update(player: THREE.Object3D, dt: number) {
      time.value = (time.value + Math.min(Math.max(dt, 0), .1)) % 4096;
      anchor.set(player.position.x, 0, player.position.z);
    },
    getDiagnostics() {
      return { rainDrops: strength > 0 ? rainGeometry.instanceCount : 0,
        rippleCount: strength > 0 ? rippleGeometry.instanceCount : 0,
        mistPatches: outside ? mistGeometry.instanceCount : 0 };
    },
    dispose() {
      parent.remove(root);
      rainGeometry.dispose(); rippleGeometry.dispose(); mistGeometry.dispose();
      rainMaterial.dispose(); rippleMaterial.dispose(); mistMaterial.dispose();
    },
  };
}
