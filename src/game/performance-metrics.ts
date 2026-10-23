export interface PerformanceContext {
  map: string;
  quality: string;
  width: number;
  height: number;
  pixelRatio: number;
  x: number;
  z: number;
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  shadowSize: number;
  postProcessing?: string;
  blocked?: boolean;
  [key: string]: unknown;
}

export interface FrameSample { ms: number; calls: number; triangles: number }
export interface FrameMetrics {
  frames: number;
  durationMs: number;
  meanFrameMs: number;
  meanFps: number;
  p95FrameMs: number;
  onePercentLowFps: number;
  meanDrawCalls: number;
  meanTriangles: number;
}
export interface PerformanceRun { context: PerformanceContext; metrics: FrameMetrics }
export interface PerformanceComparison { before: PerformanceRun; after: PerformanceRun }
export type CaptureAbortReason = "hidden" | "blocked" | "context" | "movement" | "camera" | "invalid-context" | "invalid-frame" | "sample-limit" | "too-few-frames";
export type CaptureEvent = { kind: "switch" } | { kind: "complete"; comparison: PerformanceComparison } | { kind: "abort"; reason: CaptureAbortReason };
export interface CaptureProgress { run: "before" | "after"; stage: "warmup" | "measure"; remainingMs: number }

/** FPS is elapsed time divided by frame count, not a mean of instantaneous FPS. */
export function summarizeFrames(samples: readonly FrameSample[]): FrameMetrics {
  if (!samples.length || samples.some(s => !Number.isFinite(s.ms) || s.ms <= 0 || !Number.isFinite(s.calls) || s.calls < 0 || !Number.isFinite(s.triangles) || s.triangles < 0)) {
    throw new RangeError("Frame samples must contain positive finite durations and valid render counts.");
  }
  const durations = samples.map(s => s.ms).sort((a, b) => a - b);
  const durationMs = durations.reduce((sum, ms) => sum + ms, 0);
  const meanFrameMs = durationMs / samples.length;
  const slowCount = Math.max(1, Math.ceil(samples.length * .01));
  const slowMean = durations.slice(-slowCount).reduce((sum, ms) => sum + ms, 0) / slowCount;
  return {
    frames: samples.length, durationMs, meanFrameMs, meanFps: 1000 / meanFrameMs,
    p95FrameMs: durations[Math.ceil(samples.length * .95) - 1], onePercentLowFps: 1000 / slowMean,
    meanDrawCalls: samples.reduce((sum, s) => sum + s.calls, 0) / samples.length,
    meanTriangles: samples.reduce((sum, s) => sum + s.triangles, 0) / samples.length,
  };
}

const changedPosition = (a: PerformanceContext, b: PerformanceContext) => Math.hypot(a.x - b.x, a.z - b.z) > .03;
const changedCamera = (a: PerformanceContext, b: PerformanceContext) => Math.hypot(a.cameraX - b.cameraX, a.cameraY - b.cameraY, a.cameraZ - b.cameraZ) > .08;
const changedContext = (a: PerformanceContext, b: PerformanceContext) => a.map !== b.map || a.quality !== b.quality || a.width !== b.width || a.height !== b.height || Math.abs(a.pixelRatio - b.pixelRatio) > .001 || a.postProcessing !== b.postProcessing;
const validContext = (c: PerformanceContext) => typeof c.map === "string" && typeof c.quality === "string"
  && [c.width, c.height, c.pixelRatio, c.shadowSize].every(n => Number.isFinite(n) && n > 0)
  && [c.x, c.z, c.cameraX, c.cameraY, c.cameraZ].every(Number.isFinite);

/** Pure capture state; no timer, renderer, save data or gameplay mutations. */
export class PerformanceCapture {
  private readonly initial: PerformanceContext;
  private readonly warmupMs: number;
  private readonly measureMs: number;
  private readonly minFrames: number;
  private readonly maxSamples: number;
  private run: "before" | "after" = "before";
  private stage: "warmup" | "measure" = "warmup";
  private elapsedMs = 0;
  private samples: FrameSample[] = [];
  private measuredContext: PerformanceContext | null = null;
  private before: PerformanceRun | null = null;
  private finished = false;

  constructor(context: PerformanceContext, options: { warmupMs?: number; measureMs?: number; minFrames?: number; maxSamples?: number } = {}) {
    this.initial = { ...context };
    this.warmupMs = options.warmupMs ?? 2000;
    this.measureMs = options.measureMs ?? 10000;
    this.minFrames = options.minFrames ?? 30;
    this.maxSamples = options.maxSamples ?? 16384;
  }

  getProgress(): CaptureProgress {
    return { run: this.run, stage: this.stage, remainingMs: Math.max(0, (this.stage === "warmup" ? this.warmupMs : this.measureMs) - this.elapsedMs) };
  }

  recordFrame(ms: number, render: { calls: number; triangles: number }, context: PerformanceContext, visible = true): CaptureEvent | null {
    if (this.finished) return null;
    const abort = (reason: CaptureAbortReason): CaptureEvent => { this.finished = true; this.samples = []; return { kind: "abort", reason }; };
    if (!visible) return abort("hidden");
    if (context.blocked) return abort("blocked");
    if (!validContext(this.initial) || !validContext(context)) return abort("invalid-context");
    if (changedContext(this.initial, context)) return abort("context");
    if (changedPosition(this.initial, context)) return abort("movement");
    if (!Number.isFinite(ms) || ms <= 0 || !Number.isFinite(render.calls) || render.calls < 0 || !Number.isFinite(render.triangles) || render.triangles < 0) return abort("invalid-frame");
    if (this.stage === "warmup") {
      this.elapsedMs += ms;
      if (this.elapsedMs >= this.warmupMs) {
        // Let the follow camera settle, but compare both runs from the same view.
        if (this.before && changedCamera(this.before.context, context)) return abort("camera");
        this.measuredContext = { ...context };
        this.stage = "measure";
        this.elapsedMs = 0;
      }
      // The boundary frame still includes warmup work and is never a sample.
      return null;
    }
    if (changedCamera(this.measuredContext!, context)) return abort("camera");
    if (this.samples.length >= this.maxSamples) return abort("sample-limit");
    this.samples.push({ ms, calls: render.calls, triangles: render.triangles });
    this.elapsedMs += ms;
    if (this.elapsedMs < this.measureMs) return null;
    if (this.samples.length < this.minFrames) return abort("too-few-frames");
    const result: PerformanceRun = { context: this.measuredContext!, metrics: summarizeFrames(this.samples) };
    this.samples = [];
    if (this.run === "before") {
      this.before = result;
      this.run = "after";
      this.stage = "warmup";
      this.elapsedMs = 0;
      this.measuredContext = null;
      return { kind: "switch" };
    }
    this.finished = true;
    return { kind: "complete", comparison: { before: this.before!, after: result } };
  }
}
