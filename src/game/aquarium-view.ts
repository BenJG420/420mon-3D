import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createAquariumHabitat } from "./aquarium-habitat";
import { createAquariumSchool } from "./aquarium-school";
import { createAquariumCamera } from "./aquarium-camera";

/** One bounded, read-only renderer; the main scene pauses while this view is open. */
export function mountAquarium(viewport: HTMLElement, caught: Record<string, unknown>) {
  let renderer: THREE.WebGLRenderer | undefined;
  let observer: ResizeObserver | undefined;
  let habitat: ReturnType<typeof createAquariumHabitat> | undefined;
  let school: ReturnType<typeof createAquariumSchool> | undefined;
  let environment: THREE.WebGLRenderTarget | undefined;
  let frame = 0, disposed = false, elapsed = 0, previous = -Infinity;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, .1, 100);
  const cameraRig = createAquariumCamera(camera);
  const events = new AbortController();
  let controls: HTMLDivElement | undefined;
  let selected = 0, overview = false;
  const dispose = () => {
    if (disposed) return; disposed = true;
    cancelAnimationFrame(frame); observer?.disconnect(); events.abort(); controls?.remove();
    school?.dispose(); habitat?.dispose(); environment?.dispose(); scene.clear();
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
  };
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x06151b);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    // One half-resolution refraction pass, independent of the game world.
    renderer.transmissionResolutionScale = .5;
    renderer.domElement.setAttribute("role", "img");
    viewport.append(renderer.domElement);
    scene.fog = new THREE.FogExp2(0x17494d, .055);
    scene.add(new THREE.HemisphereLight(0xb5e2db, 0x223c34, .8));
    const light = new THREE.DirectionalLight(0xe8fff1, 3.6); light.position.set(-3, 7, 2); scene.add(light);
    const fill = new THREE.DirectionalLight(0x68c9d7, 1.5); fill.position.set(4, 4, -3); scene.add(fill);
    // A soft reflection environment makes glass edges and wet scales legible.
    const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
    try { environment = pmrem.fromScene(room, .06); scene.environment = environment.texture; scene.environmentIntensity = .65; }
    finally { room.dispose(); pmrem.dispose(); }
    habitat = createAquariumHabitat({ immersive: true }); school = createAquariumSchool(caught, { immersive: true });
    scene.add(habitat.root, school.root);
    viewport.dataset.speciesCount = String(school.species.length);
    renderer.domElement.setAttribute("aria-label", `Bepflanztes 3D-Aquarium mit ${school.species.length} gefangenen Fischarten`);
    controls = document.createElement("div"); controls.className = "aquarium-controls";
    controls.setAttribute("role", "group"); controls.setAttribute("aria-label", "Aquarium-Ansicht");
    const back = document.createElement("button"), next = document.createElement("button"), mode = document.createElement("button");
    const label = document.createElement("span"); label.className = "aquarium-focus"; label.setAttribute("aria-live", "polite");
    back.type = next.type = mode.type = "button";
    back.textContent = "‹"; next.textContent = "›";
    back.setAttribute("aria-label", "Vorherigen Fisch ansehen"); next.setAttribute("aria-label", "Nächsten Fisch ansehen");
    back.disabled = next.disabled = school.species.length < 2;
    const refresh = () => {
      label.textContent = school!.species.length ? school!.species[selected].name : "Dein Unterwassergarten";
      mode.textContent = overview ? "Nahansicht" : "Ganzes Becken";
      mode.setAttribute("aria-pressed", String(overview));
    };
    function select(offset: number) {
      if (!school!.species.length) return;
      selected = (selected + offset + school!.species.length) % school!.species.length;
      overview = false; cameraRig.setOverview(false); refresh();
    }
    back.addEventListener("click", () => select(-1), { signal: events.signal });
    next.addEventListener("click", () => select(1), { signal: events.signal });
    mode.addEventListener("click", () => { overview = !overview; cameraRig.setOverview(overview); refresh(); }, { signal: events.signal });
    controls.append(back, label, next, mode); viewport.append(controls); refresh();
    const canvas = renderer.domElement;
    let pointer: number | undefined, px = 0, py = 0;
    canvas.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0 || overview) return;
      pointer = event.pointerId; px = event.clientX; py = event.clientY; canvas.setPointerCapture(pointer);
    }, { signal: events.signal });
    canvas.addEventListener("pointermove", event => {
      if (event.pointerId !== pointer) return;
      cameraRig.pan((px - event.clientX) / Math.max(1, canvas.clientWidth), (event.clientY - py) / Math.max(1, canvas.clientHeight));
      px = event.clientX; py = event.clientY;
    }, { signal: events.signal });
    const release = () => { pointer = undefined; };
    canvas.addEventListener("pointerup", release, { signal: events.signal });
    canvas.addEventListener("pointercancel", release, { signal: events.signal });
    canvas.addEventListener("lostpointercapture", release, { signal: events.signal });
    const resize = () => {
      if (disposed) return;
      const w = Math.max(1, viewport.clientWidth), h = Math.max(1, viewport.clientHeight);
      renderer!.setSize(w, h, false); cameraRig.resize(w, h);
      cameraRig.update(0, school!.root.children[selected]?.position);
    };
    observer = new ResizeObserver(resize); observer.observe(viewport); resize();
    const animate = (time: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (document.hidden) { previous = time; return; }
      if (time - previous < 1000 / 30) return;
      const dt = Number.isFinite(previous) ? Math.min((time - previous) / 1000, .1) : 0;
      elapsed += dt;
      previous = time;
      school!.update(elapsed); habitat!.update(elapsed);
      cameraRig.update(dt, school!.root.children[selected]?.position);
      light.intensity = 3.6 + Math.sin(elapsed * .8) * .12;
      fill.intensity = 1.5 + Math.sin(elapsed * .57 + 1) * .08;
      renderer!.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
  } catch {
    dispose(); viewport.textContent = "3D-Ansicht nicht verfügbar. Deine Fänge findest du im Katalog.";
  }
  return dispose;
}
