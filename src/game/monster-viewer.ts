import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { DEX, dexNum } from "./data/dex";
import { createMonsterArt, disposeMonsterArt } from "./monster-art";
import { spriteUrl } from "./sprites";
import { createMonsterSurface, monsterStudioSurfaceSize, type MonsterSurface } from "./monster-surface";
import "./monster-viewer.css";

export type MonsterViewer = {
  open: (speciesId: string) => void;
  close: () => void;
  isOpen: () => boolean;
};

/** A single temporary studio: the game keeps its own scene, save and monster. */
export function createMonsterViewer(): MonsterViewer {
  let overlay: HTMLDivElement | undefined;
  let renderer: THREE.WebGLRenderer | undefined;
  let scene: THREE.Scene | undefined;
  let reflection: THREE.WebGLRenderTarget | undefined;
  let studioSurface: MonsterSurface | undefined;
  let camera: THREE.PerspectiveCamera | undefined;
  let monster: THREE.Group | undefined;
  let viewport: HTMLDivElement | undefined;
  let status: HTMLParagraphElement | undefined;
  let heading: HTMLHeadingElement | undefined;
  let original: HTMLDivElement | undefined;
  let description: HTMLParagraphElement | undefined;
  let zoomInput: HTMLInputElement | undefined;
  let previousFocus: HTMLElement | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let frame = 0;
  let lastRender = -Infinity;
  let yaw = 0.35;
  let zoom = 1;
  let fitDistance = 4;
  let modelKind = "";
  let modelState = "";
  let pointerId: number | undefined;
  let pointerX = 0;
  const target = new THREE.Vector3(0, 0.9, 0);
  const bounds = new THREE.Box3();
  const size = new THREE.Vector3();
  const stageResources: (THREE.Material | THREE.BufferGeometry)[] = [];

  function updateCamera(): void {
    if (!camera) return;
    const distance = fitDistance / zoom;
    camera.position.set(target.x, target.y + distance * 0.13, target.z + distance);
    camera.lookAt(target);
  }

  function fitModel(): void {
    if (!monster || !camera) return;
    // Fit the unturned creature, so changing its pose never shifts the camera.
    const rotation = monster.rotation.y;
    monster.rotation.y = 0;
    monster.updateMatrixWorld(true);
    bounds.setFromObject(monster);
    monster.rotation.y = rotation;
    monster.updateMatrixWorld(true);
    if (bounds.isEmpty()) return;
    bounds.getCenter(target);
    bounds.getSize(size);
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    fitDistance = Math.max(
      Math.max(size.y, 1.1) / (2 * Math.tan(halfFov)),
      Math.max(size.x, 1.1) / (2 * Math.tan(halfFov) * camera.aspect),
    ) * 1.2 + size.z * 0.5;
    updateCamera();
  }

  function resize(): void {
    if (!renderer || !camera || !viewport) return;
    const width = Math.max(1, viewport.clientWidth);
    const height = Math.max(1, viewport.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fitModel();
  }

  function readModelStatus(): void {
    if (!monster || !status || !overlay) return;
    const nextKind = String(monster.userData.modelKind ?? "fallback");
    const nextState = String(monster.userData.modelStatus ?? "loading");
    if (nextKind === modelKind && nextState === modelState) return;
    modelKind = nextKind;
    modelState = nextState;
    overlay.dataset.modelKind = modelKind;
    overlay.dataset.modelStatus = modelState;
    status.textContent = modelKind === "sculpted"
      ? "Eigene Skulptur · PBR-Oberfläche"
      : modelKind === "smooth-volume"
        ? "Glatte 3D-Rekonstruktion · PBR-Oberfläche"
        : modelState === "error" ? "Originalbild · 3D-Modell gerade nicht verfügbar" : "Originalbild · Modell lädt";
    fitModel();
  }

  function animate(time: number): void {
    if (!overlay || !renderer || !scene || !camera) return;
    frame = requestAnimationFrame(animate);
    readModelStatus();
    if (monster) monster.rotation.y = yaw;
    // The studio does not need a second full-speed world renderer on phones.
    if (time - lastRender < 1000 / 30) return;
    lastRender = time;
    renderer.render(scene, camera);
  }

  function rotate(amount: number): void {
    yaw = (yaw + amount) % (Math.PI * 2);
  }

  function reset(): void {
    yaw = 0.35;
    zoom = 1;
    if (zoomInput) zoomInput.value = "1";
    updateCamera();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!overlay) return;
    // A focused studio control must not also move the player underneath it.
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault(); close(); return;
    }
    if (event.key === "Tab") {
      const controls = [...overlay.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex="0"]',
      )].filter(control => control.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !overlay.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
      return;
    }
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault(); rotate(event.key === "ArrowLeft" ? -0.18 : 0.18);
    } else if (event.key === "Home") {
      event.preventDefault(); reset();
    }
  }

  function close(): void {
    if (!overlay) return;
    cancelAnimationFrame(frame);
    frame = 0;
    resizeObserver?.disconnect();
    resizeObserver = undefined;
    window.removeEventListener("resize", resize);
    window.removeEventListener("keydown", onKeyDown, true);
    if (monster) disposeMonsterArt(monster);
    monster = undefined;
    studioSurface?.dispose(); studioSurface = undefined;
    for (const resource of stageResources) resource.dispose();
    stageResources.length = 0;
    reflection?.dispose(); reflection = undefined;
    scene?.clear();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer = undefined;
    scene = undefined;
    camera = undefined;
    overlay.remove();
    overlay = undefined;
    viewport = undefined;
    status = undefined;
    heading = undefined;
    original = undefined;
    description = undefined;
    zoomInput = undefined;
    pointerId = undefined;
    const focus = previousFocus;
    previousFocus = undefined;
    if (focus?.isConnected) focus.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent("420mon-model-closed"));
  }

  function button(label: string, action: () => void, className?: string): HTMLButtonElement {
    const control = document.createElement("button");
    control.type = "button";
    control.textContent = label;
    if (className) control.className = className;
    control.onclick = action;
    return control;
  }

  function buildStudio(): void {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    overlay = document.createElement("div");
    overlay.className = "monster-model-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "monster-model-title");
    const panel = document.createElement("section");
    panel.className = "monster-model-panel";
    const header = document.createElement("header");
    header.className = "monster-model-header";
    heading = document.createElement("h2");
    heading.id = "monster-model-title";
    const closeButton = button("Schließen", close, "monster-model-close");
    header.append(heading, closeButton);
    const compare = document.createElement("div");
    compare.className = "monster-model-compare";
    const source = document.createElement("figure");
    source.className = "monster-model-source";
    original = document.createElement("div");
    original.className = "monster-model-original";
    const caption = document.createElement("figcaption");
    caption.textContent = "Original · 2D";
    source.append(original, caption);
    const rendered = document.createElement("div");
    rendered.className = "monster-model-rendered";
    viewport = document.createElement("div");
    viewport.className = "monster-model-viewport";
    status = document.createElement("p");
    status.className = "monster-model-status";
    status.setAttribute("role", "status");
    rendered.append(viewport, status);
    compare.append(source, rendered);
    const controls = document.createElement("div");
    controls.className = "monster-model-controls";
    const left = button("↶ Links", () => rotate(-Math.PI / 6));
    const right = button("Rechts ↷", () => rotate(Math.PI / 6));
    const resetButton = button("Zurücksetzen", reset);
    const zoomLabel = document.createElement("label");
    zoomLabel.className = "monster-model-zoom";
    zoomLabel.textContent = "Zoom";
    zoomInput = document.createElement("input");
    zoomInput.type = "range";
    zoomInput.min = "0.7";
    zoomInput.max = "1.5";
    zoomInput.step = "0.05";
    zoomInput.value = "1";
    zoomInput.setAttribute("aria-label", "Modell vergrößern");
    zoomInput.oninput = () => {
      zoom = Math.min(1.5, Math.max(0.7, Number(zoomInput?.value) || 1));
      updateCamera();
    };
    zoomLabel.append(zoomInput);
    controls.append(left, right, resetButton, zoomLabel);
    const hint = document.createElement("p");
    hint.className = "monster-model-hint";
    hint.textContent = "Zum Drehen ziehen oder ← / → drücken. Esc schließt die Ansicht.";
    description = document.createElement("p");
    description.className = "monster-model-description";
    panel.append(header, compare, controls, hint, description);
    overlay.append(panel);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    overlay.addEventListener("keyup", event => event.stopPropagation());
    document.body.append(overlay);
    window.addEventListener("keydown", onKeyDown, true);
    closeButton.focus({ preventScroll: true });

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.setClearColor(0x081619);
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent) || window.matchMedia("(pointer: coarse)").matches;
      const surfaceSize = monsterStudioSurfaceSize(renderer.capabilities.maxTextureSize, memory, mobile);
      studioSurface = createMonsterSurface(surfaceSize, { studio: true, anisotropy: renderer.capabilities.getMaxAnisotropy() });
      overlay.dataset.surfaceTextureSize = String(surfaceSize);
      const canvas = renderer.domElement;
      canvas.className = "monster-model-canvas";
      canvas.tabIndex = 0;
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", "Drehbare 3D-Ansicht des Monsters");
      viewport.append(canvas);
      canvas.addEventListener("pointerdown", event => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (pointerId !== undefined) return;
        event.preventDefault();
        pointerId = event.pointerId;
        pointerX = event.clientX;
        canvas.focus({ preventScroll: true });
        canvas.setPointerCapture(event.pointerId);
      });
      canvas.addEventListener("pointermove", event => {
        if (event.pointerId !== pointerId) return;
        rotate((event.clientX - pointerX) * 0.012);
        pointerX = event.clientX;
      });
      const endDrag = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        pointerId = undefined;
      };
      canvas.addEventListener("pointerup", endDrag);
      canvas.addEventListener("pointercancel", endDrag);
      canvas.addEventListener("lostpointercapture", () => { pointerId = undefined; });
      scene = new THREE.Scene();
      const room = new RoomEnvironment(), generator = new THREE.PMREMGenerator(renderer);
      try { reflection = generator.fromScene(room, .05); scene.environment = reflection.texture; scene.environmentIntensity = .75; }
      finally { room.dispose(); generator.dispose(); }
      camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
      scene.add(new THREE.HemisphereLight(0xe9fff7, 0x284348, 2.3));
      const key = new THREE.DirectionalLight(0xffffff, 3.3);
      key.position.set(-3, 5, 4); scene.add(key);
      const rim = new THREE.DirectionalLight(0x71e5e1, 2.2);
      rim.position.set(3, 2, -4); scene.add(rim);
      const geometry = new THREE.CircleGeometry(2.6, 64);
      const material = new THREE.MeshStandardMaterial({ color: 0x102b2e, roughness: 0.93 });
      stageResources.push(geometry, material);
      const floor = new THREE.Mesh(geometry, material);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.012;
      scene.add(floor);
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(viewport);
      window.addEventListener("resize", resize);
      lastRender = -Infinity;
      frame = requestAnimationFrame(animate);
    } catch {
      // The authentic portrait remains useful if the device cannot open WebGL.
      studioSurface?.dispose(); studioSurface = undefined;
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer = undefined;
      viewport.textContent = "Die 3D-Vorschau ist auf diesem Gerät gerade nicht verfügbar.";
      status.textContent = "Originalbild";
      controls.hidden = true;
      hint.hidden = true;
    }
  }

  function open(speciesId: string): void {
    const species = DEX[speciesId];
    if (!species) return;
    if (!overlay) buildStudio();
    if (!heading || !original || !description || !overlay) return;
    heading.textContent = `${dexNum(speciesId)} · ${species.name}`;
    description.textContent = species.blurb;
    overlay.dataset.speciesId = speciesId;
    original.replaceChildren();
    const image = document.createElement("img");
    image.src = spriteUrl(species.sprite);
    image.alt = `${species.name} · Originalpose`;
    image.decoding = "async";
    image.onerror = () => { if (original?.contains(image)) original.textContent = "Originalbild nicht verfügbar"; };
    original.append(image);
    if (monster) disposeMonsterArt(monster);
    monster = undefined;
    modelKind = "";
    modelState = "";
    reset();
    if (renderer && scene) {
      monster = createMonsterArt(speciesId, 0x56ead0, { surface: studioSurface });
      scene.add(monster);
      monster.rotation.y = yaw;
      readModelStatus();
      resize();
    }
    window.dispatchEvent(new CustomEvent("420mon-model-opened", { detail: { id: speciesId } }));
  }

  window.addEventListener("420mon-open-model", event => {
    const detail: unknown = (event as CustomEvent<unknown>).detail;
    if (typeof detail === "string") open(detail);
    else if (detail && typeof detail === "object" && "id" in detail && typeof detail.id === "string") open(detail.id);
  });

  return { open, close, isOpen: () => overlay !== undefined };
}
