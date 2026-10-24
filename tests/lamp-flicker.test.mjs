import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  entryPoints: [fileURLToPath(new URL("../src/game/lamp-flicker.ts", import.meta.url))],
  bundle: true, write: false, platform: "node", format: "esm",
});
const { lampFlicker } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);

test("lamp brightness is deterministic, bounded and smooth without depending on frame rate", () => {
  const times = [-20, 0, .01, 5.2, 50, 3610];
  const first = times.map(time => lampFlicker(17, time));
  assert.deepEqual(times.map(time => lampFlicker(17, time)), first);
  assert.notDeepEqual(times.map(time => lampFlicker(41, time)), first, "separate fixtures have independent phases");
  assert.equal(lampFlicker(0, NaN), 1);
  for (const seed of [0, 17, 91]) {
    let previous = lampFlicker(seed, 0), darkest = 1;
    for (let frame = 1; frame <= 7200; frame++) {
      const brightness = lampFlicker(seed, frame / 60);
      assert.ok(Number.isFinite(brightness) && brightness >= .35 && brightness <= 1);
      assert.ok(Math.abs(brightness - previous) < .07, "brightness changes softly between ordinary render frames");
      darkest = Math.min(darkest, brightness); previous = brightness;
    }
    assert.ok(darkest < .6, "the occasional dimming remains visibly different from steady light");
  }
});

test("short lamp dips are separated by long steady periods instead of continuous strobing", () => {
  const starts = [];
  let low = false, dimFrames = 0, steadyFrames = 0, longestSteady = 0;
  for (let frame = 0; frame < 7200; frame++) {
    const dim = lampFlicker(17, frame / 60) < .88;
    if (dim && !low) starts.push(frame / 60);
    if (dim) { dimFrames++; steadyFrames = 0; }
    else { steadyFrames++; longestSteady = Math.max(longestSteady, steadyFrames); }
    low = dim;
  }
  assert.ok(starts.length >= 8 && starts.length <= 28, "only occasional short electrical dips occur over two minutes");
  assert.ok(dimFrames / 7200 < .1, "the lamp stays close to normal brightness for most of the scene");
  assert.ok(longestSteady / 60 > 6, "visible flicker groups have long calm gaps");
  for (let i = 2; i < starts.length; i++) assert.ok(starts[i] - starts[i - 2] > 8.8, "no third rapid dip follows a flicker pair");
});
