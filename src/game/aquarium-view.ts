import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createAquariumHabitat } from "./aquarium-habitat";
import { createAquariumSchool } from "./aquarium-school";

/** One bounded, read-only renderer; the main scene pauses while this view is open. */
export function mountAquarium(viewport: HTMLElement, caught: Record<string, unknown>) {
  let renderer: THREE.WebGLRenderer | undefined;
  let observer: ResizeObserver | undefined;
  let habitat: ReturnType<typeof createAquariumHabitat> | undefined;
  let school: ReturnType<typeof createAquariumSchool> | undefined;
  let environment: THREE.WebGLRenderTarget | undefined;
  let frame = 0, disposed = false, elapsed = 0, previous = -Infinity;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  const dispose = () => {
    if (disposed) return; disposed = true;
    cancelAnimationFrame(frame); observer?.disconnect();
    school?.dispose(); habitat?.dispose(); environment?.dispose(); scene.clear();
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
  };
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x06151b);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    // One half-resolution refraction pass, independent of the game world.
    renderer.transmissionResolutionScale = .5;
    renderer.domElement.setAttribute("role", "img");
    viewport.append(renderer.domElement);
    scene.fog = new THREE.FogExp2(0x153d40, .028);
    scene.add(new THREE.HemisphereLight(0xdbf6ed, 0x39493e, 1.8));
    const light = new THREE.DirectionalLight(0xe8fff1, 3.2); light.position.set(-2, 7, 3); scene.add(light);
    const fill = new THREE.DirectionalLight(0x68bccc, 1.2); fill.position.set(5, 3, -2); scene.add(fill);
    // A soft reflection environment makes glass edges and wet scales legible.
    const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
    try { environment = pmrem.fromScene(room, .06); scene.environment = environment.texture; }
    finally { room.dispose(); pmrem.dispose(); }
    habitat = createAquariumHabitat(); school = createAquariumSchool(caught);
    scene.add(habitat.root, school.root);
    viewport.dataset.speciesCount = String(school.species.length);
    renderer.domElement.setAttribute("aria-label", `Bepflanztes 3D-Aquarium mit ${school.species.length} gefangenen Fischarten`);
    const resize = () => {
      if (disposed) return;
      const w = Math.max(1, viewport.clientWidth), h = Math.max(1, viewport.clientHeight);
      renderer!.setSize(w, h, false); camera.aspect = w / h;
      // Include the glass and frame even on narrow touch screens.
      const distance = Math.max(8.6, 5.65 / (Math.tan(THREE.MathUtils.degToRad(19)) * camera.aspect));
      camera.position.set(0, 3.2, distance + 2); camera.lookAt(0, 1.95, 0); camera.updateProjectionMatrix();
    };
    observer = new ResizeObserver(resize); observer.observe(viewport); resize();
    const animate = (time: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (document.hidden) { previous = time; return; }
      if (time - previous < 1000 / 30) return;
      elapsed += Number.isFinite(previous) ? Math.min((time - previous) / 1000, .1) : 0;
      previous = time;
      school!.update(elapsed); habitat!.update(elapsed);
      renderer!.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
  } catch {
    dispose(); viewport.textContent = "3D-Ansicht nicht verfügbar. Deine Fänge findest du im Katalog.";
  }
  return dispose;
}
