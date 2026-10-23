import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
after(() => server.close());
const { PerformanceCapture, summarizeFrames } = await server.ssrLoadModule('/src/game/performance-metrics.ts');
const context = (overrides = {}) => ({ map: 'lowtown', quality: 'auto', width: 1280, height: 720, pixelRatio: 1.25, x: 1, z: 2, cameraX: 3, cameraY: 4, cameraZ: 5, shadowSize: 2048, postProcessing: 'bloom', ...overrides });
const render = { calls: 200, triangles: 10000 };
const sample = (ms, calls = 200, triangles = 10000) => ({ ms, calls, triangles });

test('FPS uses total frame time; p95 and 1% low retain visible stalls', () => {
  const metrics = summarizeFrames([...Array.from({ length: 198 }, () => sample(10)), sample(100, 400), sample(200, 600)]);
  assert.equal(metrics.frames, 200);
  assert.equal(metrics.durationMs, 2280);
  assert.equal(metrics.meanFrameMs, 11.4);
  assert.equal(metrics.meanFps, 1000 / 11.4);
  assert.equal(metrics.p95FrameMs, 10);
  assert.equal(metrics.onePercentLowFps, 1000 / 150);
  assert.equal(metrics.meanDrawCalls, 203);
  assert.equal(metrics.meanTriangles, 10000);
  assert.throws(() => summarizeFrames([]), RangeError);
  assert.throws(() => summarizeFrames([sample(NaN)]), RangeError);
  assert.throws(() => summarizeFrames([sample(0)]), RangeError);
});

test('warmup excludes transition frames; both measured runs retain their own shadow and draw-call context', () => {
  const capture = new PerformanceCapture(context(), { warmupMs: 100, measureMs: 100, minFrames: 2 });
  const settled = context({ cameraX: 3.5 });
  assert.equal(capture.recordFrame(40, render, context()), null);
  assert.equal(capture.recordFrame(70, render, settled), null);
  assert.deepEqual(capture.getProgress(), { run: 'before', stage: 'measure', remainingMs: 100 });
  assert.equal(capture.recordFrame(10, render, settled), null);
  assert.deepEqual(capture.recordFrame(200, render, settled), { kind: 'switch' });
  assert.deepEqual(capture.getProgress(), { run: 'after', stage: 'warmup', remainingMs: 100 });
  const optimized = { ...settled, shadowSize: 1024, optimized: true };
  assert.equal(capture.recordFrame(100, render, optimized), null);
  assert.equal(capture.recordFrame(50, { ...render, calls: 80 }, optimized), null);
  const result = capture.recordFrame(50, { ...render, calls: 80 }, optimized);
  assert.equal(result.kind, 'complete');
  assert.equal(result.comparison.before.metrics.durationMs, 210);
  assert.equal(result.comparison.before.metrics.onePercentLowFps, 5);
  assert.equal(result.comparison.after.metrics.meanFps, 20);
  assert.equal(result.comparison.before.metrics.frames, 2);
  assert.equal(result.comparison.before.context.shadowSize, 2048);
  assert.equal(result.comparison.after.context.shadowSize, 1024);
  assert.equal(result.comparison.after.metrics.meanDrawCalls, 80);
  assert.equal(capture.recordFrame(50, render, optimized), null);
});

test('default comparison actually requires 2s warmup plus 10s and at least 30 frames in each run', () => {
  const capture = new PerformanceCapture(context());
  assert.equal(capture.recordFrame(2000, render, context()), null);
  for (let i = 0; i < 99; i++) assert.equal(capture.recordFrame(100, render, context()), null);
  assert.deepEqual(capture.recordFrame(100, render, context()), { kind: 'switch' });
  assert.equal(capture.recordFrame(2000, render, context({ shadowSize: 1024 })), null);
  for (let i = 0; i < 99; i++) assert.equal(capture.recordFrame(100, render, context({ shadowSize: 1024 })), null);
  const result = capture.recordFrame(100, render, context({ shadowSize: 1024 }));
  assert.equal(result.kind, 'complete');
  assert.equal(result.comparison.before.metrics.durationMs, 10000);
  assert.equal(result.comparison.after.metrics.frames, 100);
});

test('map, quality, viewport, DPR and renderer fallback changes abort even during warmup', () => {
  for (const change of [{ map: 'neonkai' }, { quality: 'low' }, { width: 1000 }, { height: 1000 }, { pixelRatio: 1 }, { postProcessing: 'fallback' }]) {
    const capture = new PerformanceCapture(context());
    assert.deepEqual(capture.recordFrame(16, render, context(change)), { kind: 'abort', reason: 'context' });
    assert.equal(capture.recordFrame(16, render, context()), null);
  }
});

test('moving, hidden tabs and blocked gameplay invalidate both warmup and measurement', () => {
  for (const warmed of [false, true]) {
    for (const [changes, visible, reason] of [[{ x: 2 }, true, 'movement'], [{ z: 3 }, true, 'movement'], [{ blocked: true }, true, 'blocked'], [{}, false, 'hidden']]) {
      const capture = new PerformanceCapture(context());
      if (warmed) capture.recordFrame(2000, render, context());
      assert.deepEqual(capture.recordFrame(16, render, context(changes), visible), { kind: 'abort', reason });
    }
  }
});

test('camera can settle during warmup but both captures require the same settled view', () => {
  const settled = context({ cameraX: 3.5 });
  const capture = new PerformanceCapture(context(), { warmupMs: 10, measureMs: 10, minFrames: 1 });
  assert.equal(capture.recordFrame(10, render, settled), null);
  assert.deepEqual(capture.recordFrame(10, render, settled), { kind: 'switch' });
  assert.deepEqual(capture.recordFrame(10, render, context()), { kind: 'abort', reason: 'camera' });
  const duringMeasure = new PerformanceCapture(context(), { warmupMs: 10 });
  duringMeasure.recordFrame(10, render, context());
  assert.deepEqual(duringMeasure.recordFrame(16, render, settled), { kind: 'abort', reason: 'camera' });
});

test('nonfinite scene coordinates and frame times abort rather than export invalid metrics', () => {
  for (const invalid of [{ cameraX: NaN }, { z: Infinity }, { pixelRatio: 0 }, { width: NaN }, { height: -1 }, { shadowSize: Infinity }]) {
    const capture = new PerformanceCapture(context());
    assert.deepEqual(capture.recordFrame(16, render, context(invalid)), { kind: 'abort', reason: 'invalid-context' });
  }
  const invalidInitial = new PerformanceCapture(context({ x: NaN }));
  assert.deepEqual(invalidInitial.recordFrame(16, render, context()), { kind: 'abort', reason: 'invalid-context' });
  for (const ms of [NaN, Infinity, 0, -10]) {
    const capture = new PerformanceCapture(context());
    assert.deepEqual(capture.recordFrame(ms, render, context()), { kind: 'abort', reason: 'invalid-frame' });
  }
});

test('captures reject insufficient samples and stop at a bounded sample count without dropping stalls', () => {
  const sparse = new PerformanceCapture(context());
  sparse.recordFrame(2000, render, context());
  assert.deepEqual(sparse.recordFrame(10000, render, context()), { kind: 'abort', reason: 'too-few-frames' });
  const bounded = new PerformanceCapture(context(), { warmupMs: 10, maxSamples: 2 });
  bounded.recordFrame(10, render, context());
  bounded.recordFrame(10, render, context());
  bounded.recordFrame(10, render, context());
  assert.deepEqual(bounded.recordFrame(10, render, context()), { kind: 'abort', reason: 'sample-limit' });
});
