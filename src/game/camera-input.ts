type CameraGestures = {
  rotate(deltaYaw: number, deltaPitch: number): void;
  zoom(factor: number): void;
};
type Pointer = { x: number; y: number; kind: string };

/** World-canvas gestures only: HUD, joystick and modal pointers never enter this map. */
export function bindPlayerCameraInput(canvas: HTMLCanvasElement, camera: CameraGestures,
  isEnabled: () => boolean, host: Window = window) {
  const pointers = new Map<number, Pointer>();
  let span = 0;
  const height = () => Math.max(1, canvas.getBoundingClientRect().height);
  function pinchSpan() {
    if (pointers.size !== 2) return 0;
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function release(id: number) {
    // Delete before releasing capture: lostpointercapture may fire synchronously.
    pointers.delete(id);
    try { if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id); } catch { /* detached canvas */ }
    span = pinchSpan();
    canvas.classList.toggle("is-orbiting", pointers.size > 0);
  }
  function cancel() {
    for (const id of [...pointers.keys()]) release(id);
    span = 0;
  }
  function enabled() {
    if (isEnabled()) return true;
    cancel(); return false;
  }
  function down(event: PointerEvent) {
    if (event.defaultPrevented || !enabled() || pointers.size >= 2) return;
    if (event.pointerType !== "touch" && event.button !== 0 && event.button !== 2) return;
    // Two-finger zoom belongs to touch. A concurrent pen/mouse must not become a pinch.
    if (pointers.size && (event.pointerType !== "touch" || [...pointers.values()].some(p => p.kind !== "touch"))) return;
    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, kind: event.pointerType });
    try { canvas.setPointerCapture(event.pointerId); } catch { /* window release remains available */ }
    span = pinchSpan();
    canvas.classList.add("is-orbiting"); event.preventDefault();
  }
  function move(event: PointerEvent) {
    if (!enabled()) return;
    const previous = pointers.get(event.pointerId); if (!previous) return;
    if (previous.kind === "mouse" && event.buttons === 0) { release(event.pointerId); return; }
    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
    const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, kind: previous.kind });
    if (pointers.size === 2) {
      const next = pinchSpan();
      if (span > 2 && next > 2) camera.zoom(span / next);
      span = next;
    } else {
      camera.rotate(-dx / height() * Math.PI * 2, dy / height() * Math.PI);
    }
    event.preventDefault();
  }
  function up(event: PointerEvent) { if (pointers.has(event.pointerId)) release(event.pointerId); }
  function wheel(event: WheelEvent) {
    if (!enabled() || !Number.isFinite(event.deltaY)) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height() : 1;
    camera.zoom(Math.exp(Math.max(-1, Math.min(1, event.deltaY * unit * .001))));
    event.preventDefault();
  }
  function contextMenu(event: Event) { if (enabled()) event.preventDefault(); }
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("lostpointercapture", up);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("contextmenu", contextMenu);
  host.addEventListener("pointerup", up);
  host.addEventListener("pointercancel", up);
  host.addEventListener("blur", cancel);
  host.addEventListener("pagehide", cancel);
  return {
    cancel,
    dispose() {
      cancel();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", up);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("contextmenu", contextMenu);
      host.removeEventListener("pointerup", up);
      host.removeEventListener("pointercancel", up);
      host.removeEventListener("blur", cancel);
      host.removeEventListener("pagehide", cancel);
    },
  };
}
