import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { getDistrictGraphics } from "./graphics-profile";

export type PostProcessingQuality = "auto" | "high" | "low";

/** Bloom is deliberately softer and much cheaper than a second full-size scene. */
class BoundedBloomPass extends UnrealBloomPass {
  override setSize(width: number, height: number) {
    const scale = Math.min(1, 960 / width, 540 / height);
    super.setSize(Math.max(32, Math.round(width * scale)), Math.max(32, Math.round(height * scale)));
  }
}

// All grading happens in linear light. OutputPass applies ACES and the sRGB
// transfer exactly once afterwards; DOM menus and the minimap remain untouched.
const gradeShader = {
  name: "DistrictCinematicGrade",
  uniforms: {
    tDiffuse: { value: null },
    uContrast: { value: 1.04 },
    uSaturation: { value: .92 },
    uVignette: { value: .17 },
    uGrain: { value: .003 },
    uTime: { value: 0 },
    uAspect: { value: 1 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uTime;
    uniform float uAspect;
    varying vec2 vUv;
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      vec3 color = max(source.rgb, vec3(0.0));
      float luminance = dot(color, vec3(.2126, .7152, .0722));
      color = mix(vec3(luminance), color, uSaturation);
      // A pivot near photographic middle-grey keeps dark alleys readable.
      color = max(vec3(0.0), (color - .18) * uContrast + .18);
      vec2 edge = (vUv - .5) * vec2(min(uAspect, 1.5), 1.0);
      float vignette = smoothstep(.22, .9, length(edge));
      color *= 1.0 - uVignette * vignette;
      // Fine, luminance-scaled grain rather than a grey veil over the blacks.
      float grain = noise(gl_FragCoord.xy + vec2(uTime * 31.0, uTime * 17.0)) - .5;
      color += grain * uGrain * (.12 + sqrt(max(luminance, 0.0)));
      gl_FragColor = vec4(max(color, vec3(0.0)), source.a);
    }
  `,
};

export type PostProcessingDiagnostics = {
  mode: "high" | "low" | "direct";
  hdr: boolean;
  bloom: boolean;
  width: number;
  height: number;
};

/** One world composer, reused across every original district and camera view. */
export function createPostProcessing(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const hdrAvailable = renderer.extensions.has("EXT_color_buffer_float");
  let preference: PostProcessingQuality = "auto";
  let district = "capsule";
  let size = renderer.getSize(new THREE.Vector2());
  let pixelRatio = renderer.getPixelRatio();
  let composer: EffectComposer | undefined;
  let bloom: BoundedBloomPass | undefined;
  let grade: ShaderPass | undefined;
  let output: OutputPass | undefined;
  let antialias: ShaderPass | undefined;
  let activeMode: "high" | "low" = "low";
  let elapsed = 0;
  let disposed = false;

  const automaticQuality = (): "high" | "low" => {
    const coarse = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency : 8;
    return coarse || (cores > 0 && cores <= 4) ? "low" : "high";
  };

  function releaseComposer() {
    bloom?.dispose();
    grade?.dispose();
    output?.dispose();
    antialias?.dispose();
    composer?.dispose();
    bloom = undefined;
    grade = undefined;
    output = undefined;
    antialias = undefined;
    composer = undefined;
  }

  function applyDistrict() {
    const profile = getDistrictGraphics(district);
    renderer.toneMappingExposure = profile.exposure;
    if (bloom) {
      bloom.strength = profile.bloom.strength;
      bloom.radius = profile.bloom.radius;
      bloom.threshold = profile.bloom.threshold;
    }
    if (grade) {
      grade.uniforms.uContrast.value = profile.contrast;
      grade.uniforms.uSaturation.value = profile.saturation;
      grade.uniforms.uVignette.value = profile.vignette;
      grade.uniforms.uGrain.value = profile.grain;
      grade.uniforms.uAspect.value = size.x / Math.max(1, size.y);
    }
  }

  function sizePasses() {
    if (!composer) return;
    composer.setPixelRatio(pixelRatio);
    composer.setSize(size.x, size.y);
    antialias?.uniforms.resolution.value.set(1 / (size.x * pixelRatio), 1 / (size.y * pixelRatio));
    if (grade) grade.uniforms.uAspect.value = size.x / Math.max(1, size.y);
  }

  function buildComposer() {
    releaseComposer();
    activeMode = preference === "auto" ? automaticQuality() : preference;
    // Unsupported floating-point framebuffers automatically use the cheap path.
    if (!hdrAvailable) activeMode = "low";
    try {
      const target = new THREE.WebGLRenderTarget(1, 1, {
        type: activeMode === "high" ? THREE.HalfFloatType : THREE.UnsignedByteType,
        depthBuffer: true,
        stencilBuffer: false,
      });
      target.texture.name = "420mon.cinematic-world";
      composer = new EffectComposer(renderer, target);
      composer.addPass(new RenderPass(scene, camera));
      if (activeMode === "high") {
        bloom = new BoundedBloomPass(new THREE.Vector2(32, 32), .35, .5, 1.1);
        composer.addPass(bloom);
      }
      grade = new ShaderPass(gradeShader);
      grade.material.toneMapped = false;
      composer.addPass(grade);
      output = new OutputPass();
      composer.addPass(output);
      // The scene now draws to a target, where canvas antialiasing cannot help.
      // FXAA takes the already encoded image, following Three's OutputPass rule.
      antialias = new ShaderPass(FXAAShader);
      antialias.material.toneMapped = false;
      composer.addPass(antialias);
      sizePasses();
      applyDistrict();
    } catch {
      // A constrained driver must still leave the game playable.
      releaseComposer();
      renderer.setRenderTarget(null);
    }
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  buildComposer();

  return {
    render(dt: number) {
      if (disposed || renderer.getContext().isContextLost()) return;
      elapsed = (elapsed + Math.max(0, Math.min(dt, .1))) % 10000;
      if (grade) grade.uniforms.uTime.value = elapsed;
      if (composer) composer.render(Math.max(0, dt));
      else renderer.render(scene, camera);
    },
    resize(width: number, height: number, nextPixelRatio = renderer.getPixelRatio()) {
      if (disposed) return;
      size = new THREE.Vector2(Math.max(1, width), Math.max(1, height));
      pixelRatio = Math.max(.25, Math.min(2, nextPixelRatio));
      sizePasses();
    },
    setDistrict(id: string) {
      if (disposed) return;
      district = id;
      applyDistrict();
    },
    setQuality(quality: PostProcessingQuality) {
      if (disposed || preference === quality) return;
      const previous = activeMode;
      preference = quality;
      const next = quality === "auto" ? automaticQuality() : quality;
      if ((hdrAvailable ? next : "low") !== previous) buildComposer();
    },
    getDiagnostics(): PostProcessingDiagnostics {
      return {
        mode: composer ? activeMode : "direct",
        hdr: !!composer && activeMode === "high",
        bloom: !!bloom,
        width: Math.round(size.x * pixelRatio),
        height: Math.round(size.y * pixelRatio),
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      releaseComposer();
    },
  };
}
