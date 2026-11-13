import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: 'export { bindPlayerCameraInput } from "./src/game/camera-input.ts";', resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { bindPlayerCameraInput } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);

function event(type, values = {}) {
  const e = new Event(type, { cancelable: true });
  for (const [name, value] of Object.entries(values)) Object.defineProperty(e, name, { value });
  return e;
}
function pointer(target, type, values = {}) {
  const e = event(type, { pointerId: 1, pointerType: "mouse", button: 0, buttons: 1, clientX: 100, clientY: 100, ...values });
  target.dispatchEvent(e); return e;
}
class Canvas extends EventTarget {
  captures = new Set();
  classes = new Set();
  classList = {
    add: name => this.classes.add(name),
    toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name),
  };
  getBoundingClientRect() { return { height: 400 }; }
  setPointerCapture(id) { this.captures.add(id); }
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) {
    if (this.captures.delete(id)) this.dispatchEvent(event("lostpointercapture", { pointerId: id }));
  }
}
function fixture() {
  const canvas = new Canvas(), host = new EventTarget(), rotations = [], zooms = [];
  let enabled = true;
  const binding = bindPlayerCameraInput(canvas, {
    rotate: (yaw, pitch) => rotations.push([yaw, pitch]), zoom: factor => zooms.push(factor),
  }, () => enabled, host);
  return { canvas, host, rotations, zooms, binding, enable(value) { enabled = value; } };
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} ≈ ${expected}`);

test("left and right mouse drags orbit at viewport scale; stray pointers and released buttons cannot move the camera", () => {
  const f = fixture();
  try {
    const ignored = pointer(f.canvas, "pointerdown", { button: 1 });
    assert.equal(ignored.defaultPrevented, false); assert.equal(f.canvas.captures.size, 0);
    assert.equal(pointer(f.canvas, "pointerdown").defaultPrevented, true);
    assert.ok(f.canvas.captures.has(1));
    pointer(f.canvas, "pointermove", { pointerId: 99, clientX: 300 });
    assert.equal(f.rotations.length, 0);
    pointer(f.canvas, "pointermove", { clientX: 140, clientY: 120 });
    near(f.rotations[0][0], -Math.PI * .2); near(f.rotations[0][1], Math.PI * .05);
    pointer(f.host, "pointerup");
    assert.equal(f.canvas.captures.size, 0); assert.ok(!f.canvas.classes.has("is-orbiting"));
    pointer(f.canvas, "pointerdown", { pointerId: 3, button: 2, buttons: 2, clientX: 20, clientY: 20 });
    pointer(f.canvas, "pointermove", { pointerId: 3, buttons: 2, clientX: 10, clientY: 0 });
    near(f.rotations[1][0], Math.PI * .05); near(f.rotations[1][1], -Math.PI * .05);
    pointer(f.canvas, "pointermove", { pointerId: 3, buttons: 0, clientX: 300 });
    assert.equal(f.rotations.length, 2); assert.equal(f.canvas.captures.size, 0);
  } finally { f.binding.dispose(); }
});

test("two touch points pinch without orbiting and releasing one resumes drag from its current position", () => {
  const f = fixture(), touch = { pointerType: "touch" };
  try {
    pointer(f.canvas, "pointerdown", touch);
    pointer(f.canvas, "pointerdown", { ...touch, pointerId: 2, clientX: 200 });
    const third = pointer(f.canvas, "pointerdown", { ...touch, pointerId: 3, clientX: 250 });
    assert.equal(third.defaultPrevented, false); assert.equal(f.canvas.captures.size, 2);
    pointer(f.canvas, "pointermove", { ...touch, pointerId: 2, clientX: 300 });
    assert.deepEqual(f.zooms, [.5]); assert.equal(f.rotations.length, 0);
    pointer(f.canvas, "pointerup", { ...touch, pointerId: 2 });
    pointer(f.canvas, "pointermove", { ...touch, clientX: 120, clientY: 110 });
    near(f.rotations[0][0], -Math.PI * .1); near(f.rotations[0][1], Math.PI * .025);
    assert.equal(f.zooms.length, 1); assert.ok(f.canvas.captures.has(1));
  } finally { f.binding.dispose(); }
});

test("HUD and joystick touches stay independent while another finger drags on the world canvas", () => {
  const f = fixture(), touch = { pointerType: "touch" };
  try {
    pointer(f.host, "pointerdown", { ...touch, pointerId: 20 });
    pointer(f.host, "pointermove", { ...touch, pointerId: 20, clientX: 200 });
    assert.equal(f.canvas.captures.size, 0); assert.equal(f.rotations.length, 0);
    pointer(f.canvas, "pointerdown", { ...touch, pointerId: 30 });
    pointer(f.host, "pointermove", { ...touch, pointerId: 20, clientX: 300 });
    pointer(f.canvas, "pointermove", { ...touch, pointerId: 30, clientX: 120 });
    assert.equal(f.rotations.length, 1); assert.equal(f.zooms.length, 0);
    pointer(f.host, "pointerup", { ...touch, pointerId: 20 });
    assert.ok(f.canvas.captures.has(30), "unrelated control release cannot terminate camera drag");
    pointer(f.canvas, "pointermove", { ...touch, pointerId: 30, clientX: 130 });
    assert.equal(f.rotations.length, 2); assert.equal(f.zooms.length, 0);
  } finally { f.binding.dispose(); }
});

test("wheel pixel, line and page units zoom consistently, clamp spikes and leave disabled modal scrolling alone", () => {
  const f = fixture();
  const wheel = (deltaY, deltaMode = 0) => {
    const e = event("wheel", { deltaY, deltaMode }); f.canvas.dispatchEvent(e); return e;
  };
  try {
    for (const [delta, mode] of [[100, 0], [3, 1], [.5, 2], [1e6, 0], [-1e6, 0]]) assert.equal(wheel(delta, mode).defaultPrevented, true);
    [.1, .048, .2, 1, -1].forEach((exponent, i) => near(f.zooms[i], Math.exp(exponent)));
    assert.equal(wheel(Number.NaN).defaultPrevented, false); assert.equal(f.zooms.length, 5);
    const menu = event("contextmenu"); f.canvas.dispatchEvent(menu); assert.equal(menu.defaultPrevented, true);
    f.enable(false);
    assert.equal(wheel(120).defaultPrevented, false); assert.equal(f.zooms.length, 5);
    const disabledMenu = event("contextmenu"); f.canvas.dispatchEvent(disabledMenu); assert.equal(disabledMenu.defaultPrevented, false);
  } finally { f.binding.dispose(); }
});

test("modal blocking, capture loss, cancellation and page focus changes release gestures; disposal removes all handlers", () => {
  const f = fixture();
  try {
    pointer(f.canvas, "pointerdown");
    f.enable(false);
    const move = pointer(f.canvas, "pointermove", { clientX: 300 });
    assert.equal(move.defaultPrevented, false); assert.equal(f.canvas.captures.size, 0);
    f.enable(true);
    pointer(f.canvas, "pointermove", { clientX: 350 });
    assert.equal(f.rotations.length, 0, "closing a modal cannot revive an old drag");
    for (const signal of ["lostpointercapture", "pointercancel", "blur", "pagehide", "cancel"]) {
      pointer(f.canvas, "pointerdown");
      if (signal === "lostpointercapture") f.canvas.releasePointerCapture(1);
      else if (signal === "cancel") f.binding.cancel();
      else if (signal === "pointercancel") pointer(f.canvas, signal);
      else f.host.dispatchEvent(event(signal));
      assert.equal(f.canvas.captures.size, 0, signal); assert.ok(!f.canvas.classes.has("is-orbiting"), signal);
      pointer(f.canvas, "pointermove", { clientX: 400 });
      assert.equal(f.rotations.length, 0, signal);
    }
    pointer(f.canvas, "pointerdown"); f.binding.dispose(); f.binding.dispose();
    assert.equal(f.canvas.captures.size, 0);
    assert.equal(pointer(f.canvas, "pointerdown").defaultPrevented, false);
    pointer(f.canvas, "pointermove", { clientX: 200 });
    const wheel = event("wheel", { deltaY: 100, deltaMode: 0 }); f.canvas.dispatchEvent(wheel);
    assert.equal(wheel.defaultPrevented, false); assert.equal(f.rotations.length, 0); assert.equal(f.zooms.length, 0);
  } finally { f.binding.dispose(); }
});
