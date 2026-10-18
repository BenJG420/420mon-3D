import * as THREE from "three";
import { FISH } from "./data/fish";
import { getFishSheet } from "./fish-art";

/** Read-only aquarium stage. Every caught species gets one swimmer, never one per catch. */
export function mountAquarium(viewport: HTMLElement, caught: Record<string, unknown>) {
  const species = FISH.filter(f => typeof caught[f.id] === "number" && Number(caught[f.id]) > 0);
  viewport.dataset.speciesCount = String(species.length);
  const resources: (THREE.Material | THREE.BufferGeometry | THREE.Texture)[] = [];
  let renderer: THREE.WebGLRenderer | undefined;
  let observer: ResizeObserver | undefined;
  let frame = 0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  const swimmers: { sprite: THREE.Sprite; texture: THREE.Texture; index: number }[] = [];
  const dispose = () => {
    cancelAnimationFrame(frame); observer?.disconnect();
    resources.forEach(resource => resource.dispose()); scene.clear();
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
  };
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x081e27);
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", `Aquarium mit ${species.length} gefangenen Fischarten`);
    viewport.append(renderer.domElement);
    scene.fog = new THREE.FogExp2(0x123d43, .035);
    scene.add(new THREE.HemisphereLight(0xd4fff0, 0x233426, 3));
    const light = new THREE.DirectionalLight(0xffdea4, 3); light.position.set(-3, 6, 4); scene.add(light);
    function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number) {
      const geometry = new THREE.BoxGeometry(w, h, d);
      const material = new THREE.MeshStandardMaterial({ color, roughness: .65 });
      resources.push(geometry, material);
      const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); scene.add(mesh);
    }
    box(10, .3, 4, 0x877b59, 0, -.15, 0);
    box(10, 4, .12, 0x173d3e, 0, 2, -2);
    for (const x of [-5, 5]) box(.12, 4.2, 4, 0x66796d, x, 2, 0);
    box(10.2, .12, 4.2, 0xa39062, 0, 4.1, 0);
    for (let i = 0; i < 19; i++) {
      const geo = new THREE.ConeGeometry(.12, .65 + i % 4 * .25, 7);
      const mat = new THREE.MeshStandardMaterial({ color: i % 2 ? 0x426e46 : 0x68864b });
      resources.push(geo, mat);
      const plant = new THREE.Mesh(geo, mat); plant.position.set(-4.6 + i * .5, .4, -1.5 + i % 3 * .3); scene.add(plant);
    }
    for (const [index, fish] of species.entries()) {
      const texture = new THREE.CanvasTexture(getFishSheet(fish));
      texture.colorSpace = THREE.SRGBColorSpace; texture.magFilter = THREE.NearestFilter;
      texture.repeat.set(.5, .5); texture.offset.set(0, .5);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, alphaTest: .08, depthWrite: false });
      resources.push(texture, mat);
      const sprite = new THREE.Sprite(mat); sprite.scale.setScalar(.65 + index % 3 * .08); scene.add(sprite);
      swimmers.push({ sprite, texture, index });
    }
    const resize = () => {
      const w = Math.max(1, viewport.clientWidth), h = Math.max(1, viewport.clientHeight);
      renderer!.setSize(w, h, false); camera.aspect = w / h;
      const distance = Math.max(7, 5.6 / (Math.tan(THREE.MathUtils.degToRad(19)) * camera.aspect));
      camera.position.set(0, 3.5, distance); camera.lookAt(0, 2, 0); camera.updateProjectionMatrix();
    };
    observer = new ResizeObserver(resize); observer.observe(viewport); resize();
    let previous = -Infinity;
    const animate = (time: number) => {
      frame = requestAnimationFrame(animate);
      if (document.hidden || time - previous < 1000 / 30) return;
      previous = time;
      for (const { sprite, texture, index } of swimmers) {
        const phase = time * (.00019 + index % 5 * .000018) + index * 2.4;
        sprite.position.set(Math.sin(phase) * 4.25, .65 + index % 6 * .47 + Math.sin(phase * 1.7) * .12, Math.cos(phase * .7 + index) * 1.3);
        const right = Math.cos(phase) > 0;
        texture.repeat.x = right ? -.5 : .5; texture.offset.x = right ? .5 : 0;
      }
      renderer!.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
  } catch {
    dispose(); viewport.textContent = "3D-Ansicht nicht verfügbar. Deine Fänge findest du im Katalog.";
  }
  return dispose;
}
