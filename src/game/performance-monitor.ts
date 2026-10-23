import { PerformanceCapture, type CaptureAbortReason, type PerformanceComparison, type PerformanceContext } from "./performance-metrics";
import "./performance-monitor.css";

interface PerformanceMonitorOptions {
  setOptimized: (enabled: boolean) => void;
  getOptimized: () => boolean;
  getContext: () => PerformanceContext;
}

const otherOverlays = ".systems-panel:not([hidden]),.monster-battle:not([hidden]),.monster-collection:not([hidden]),.home-dialog:not([hidden]),.fish-overlay:not([hidden]),.grow-backdrop:not([hidden]),.monster-model-overlay:not([hidden]),.slot-overlay:not([hidden]),.achievement-overlay:not([hidden]),.story-overlay:not([hidden]),.radio-overlay:not([hidden]),.support-overlay:not([hidden]),.studio-panel.is-open";
const abortMessages: Record<CaptureAbortReason, string> = {
  hidden: "Tab oder App war im Hintergrund.",
  blocked: "Ein anderes Menü oder eine Spielsituation hat die Ansicht geändert.",
  context: "Bezirk, Grafikstufe oder Bildschirmgröße hat sich geändert.",
  movement: "Der Spieler hat sich bewegt.",
  camera: "Die Kameraansicht hat sich geändert.",
  "invalid-context": "Die aktuelle Szene konnte nicht zuverlässig erfasst werden.",
  "invalid-frame": "Ein Frame konnte nicht zuverlässig gemessen werden.",
  "sample-limit": "Die maximale Zahl von Messwerten wurde erreicht.",
  "too-few-frames": "Für eine verlässliche Auswertung wurden zu wenige Frames gerendert.",
};

export function createPerformanceMonitor(options: PerformanceMonitorOptions) {
  const overlay = document.createElement("div");
  overlay.className = "performance-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `<section class="performance-panel" role="dialog" aria-modal="true" aria-labelledby="performance-title">
    <header><h2 id="performance-title">FPS vergleichen</h2><button data-action="close" aria-label="Schließen">✕</button></header>
    <p>Vergleiche dieselbe Szene vor und nach den Performance-Optimierungen. Stelle dich dafür ruhig an einen Ort im Bezirk.</p>
    <p class="performance-note">Je 2 Sekunden aufwärmen und 10 Sekunden messen; insgesamt etwa 24 Sekunden. Bitte stehen bleiben, Kamera und Grafikstufe nicht ändern und den Tab geöffnet lassen. Die Spielwelt läuft weiter.</p>
    <p class="performance-note">Auto und Sparsam verwenden nach der Optimierung eine kleinere Schattenauflösung. Hoch behält die bisherige Schattenauflösung für einen Vergleich bei gleicher Schattenqualität.</p>
    <div data-results></div><p data-status role="status">Noch keine Messung. Die Werte entstehen erst auf deinem Gerät.</p>
    <div class="performance-actions"><button data-action="start" class="performance-primary">Vorher / Nachher messen</button><button data-action="copy" hidden>JSON kopieren</button></div>
    <textarea data-export hidden readonly aria-label="FPS-Messung als JSON"></textarea>
  </section>`;
  const running = document.createElement("div");
  running.className = "performance-running";
  running.hidden = true;
  running.innerHTML = `<span data-progress role="status" aria-live="polite"></span><button>Abbrechen</button>`;
  (document.querySelector("#app") ?? document.body).append(overlay, running);
  const closeButton = overlay.querySelector<HTMLButtonElement>('[data-action="close"]')!;
  const startButton = overlay.querySelector<HTMLButtonElement>('[data-action="start"]')!;
  const copyButton = overlay.querySelector<HTMLButtonElement>('[data-action="copy"]')!;
  const status = overlay.querySelector<HTMLElement>("[data-status]")!;
  const results = overlay.querySelector<HTMLElement>("[data-results]")!;
  const exportField = overlay.querySelector<HTMLTextAreaElement>("[data-export]")!;
  const progress = running.querySelector<HTMLElement>("[data-progress]")!;
  let capture: PerformanceCapture | null = null;
  let previousMode = true;
  let returnFocus: HTMLElement | null = null;
  let reportJson = "";
  let progressTimeMs = 0;
  let disposed = false;

  function open() {
    if (disposed || capture || document.querySelector(otherOverlays) || options.getContext().blocked) return;
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlay.hidden = false;
    window.dispatchEvent(new Event("420mon-menu-opened"));
    closeButton.focus();
  }
  function close(restoreFocus = true) {
    overlay.hidden = true;
    if (restoreFocus && returnFocus?.isConnected && returnFocus.getClientRects().length) returnFocus.focus();
  }
  function restoreMode() {
    capture = null;
    running.hidden = true;
    options.setOptimized(previousMode);
  }
  function abort(reason: string) {
    if (!capture) return;
    restoreMode();
    status.textContent = `Messung abgebrochen: ${reason} Es wurde kein neuer Vergleich erstellt.`;
    // Do not cover a battle/menu that interrupted the capture. The message stays in Help.
    if (!document.hidden) open();
  }
  function updateProgress() {
    if (!capture) return;
    const p = capture.getProgress();
    const label = p.run === "before" ? "Vorher" : "Nachher";
    progress.textContent = `${label}: ${p.stage === "warmup" ? "aufwärmen" : "messen"} · ${Math.ceil(p.remainingMs / 1000)} s · stehen bleiben`;
  }
  function start() {
    if (capture || document.hidden || document.querySelector(otherOverlays)) return;
    close(false);
    previousMode = options.getOptimized();
    options.setOptimized(false);
    capture = new PerformanceCapture(options.getContext());
    exportField.hidden = true;
    running.hidden = false;
    progressTimeMs = 0;
    updateProgress();
  }
  const number = (value: number, decimals = 1) => value.toLocaleString("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  function showResults(comparison: PerformanceComparison) {
    const { before, after } = comparison;
    const device = { userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency ?? null, maxTouchPoints: navigator.maxTouchPoints ?? 0 };
    reportJson = JSON.stringify({ schema: "420mon-performance-v1", capturedAt: new Date().toISOString(), warmupMs: 2000, requestedMeasurementMs: 10000, device, ...comparison }, null, 2);
    results.replaceChildren();
    const table = document.createElement("table");
    table.className = "performance-result-table";
    const head = table.createTHead().insertRow();
    for (const label of ["Messwert", "Vorher", "Nachher"]) { const th = document.createElement("th"); th.scope = "col"; th.textContent = label; head.append(th); }
    const body = table.createTBody();
    const rows: [string, string, string][] = [
      ["Ø FPS", number(before.metrics.meanFps), number(after.metrics.meanFps)],
      ["1% Low FPS", number(before.metrics.onePercentLowFps), number(after.metrics.onePercentLowFps)],
      ["p95 Framezeit", `${number(before.metrics.p95FrameMs)} ms`, `${number(after.metrics.p95FrameMs)} ms`],
      ["Ø Draw Calls", number(before.metrics.meanDrawCalls, 0), number(after.metrics.meanDrawCalls, 0)],
      ["Ø Dreiecke", number(before.metrics.meanTriangles, 0), number(after.metrics.meanTriangles, 0)],
      ["Frames", number(before.metrics.frames, 0), number(after.metrics.frames, 0)],
      ["Messdauer", `${number(before.metrics.durationMs / 1000)} s`, `${number(after.metrics.durationMs / 1000)} s`],
      ["Schattenauflösung", `${before.context.shadowSize}²`, `${after.context.shadowSize}²`],
    ];
    for (const [label, first, second] of rows) {
      const row = body.insertRow(); const th = document.createElement("th"); th.scope = "row"; th.textContent = label; row.append(th);
      row.insertCell().textContent = first; row.insertCell().textContent = second;
    }
    const context = document.createElement("p");
    context.className = "performance-context";
    context.textContent = `${before.context.map} · Grafik: ${before.context.quality} · ${before.context.width} × ${before.context.height} · DPR ${number(before.context.pixelRatio, 2)} · ${device.maxTouchPoints ? "Touch" : "Desktop"} · ${device.hardwareConcurrency ?? "?"} logische CPU-Kerne`;
    const browser = document.createElement("details"); browser.className = "performance-context";
    const summary = document.createElement("summary"); summary.textContent = "Browser / Gerät";
    const agent = document.createElement("p"); agent.textContent = device.userAgent; browser.append(summary, agent);
    const note = document.createElement("p"); note.className = "performance-note";
    note.textContent = "Ø FPS = 1000 / mittlere Framezeit. 1% Low: die langsamsten 1% der Frames; p95: 95% der Frames waren schneller. Wetter und laufende Figuren können schwanken; Bildschirm-Limits können FPS begrenzen. Das ist eine lokale Momentaufnahme.";
    results.append(table, context, browser, note);
    const difference = (after.metrics.meanFps / before.metrics.meanFps - 1) * 100;
    status.textContent = `Vergleich abgeschlossen. Ø FPS: ${difference > 0 ? "+" : ""}${number(difference)} %. Die vorherige Grafik-Einstellung ist wieder aktiv.`;
    copyButton.hidden = false;
    open();
  }
  async function copy() {
    if (!reportJson) return;
    try {
      await navigator.clipboard.writeText(reportJson);
      status.textContent = "Messung als JSON kopiert. Es werden keine Daten gesendet.";
    } catch {
      exportField.value = reportJson; exportField.hidden = false; exportField.focus(); exportField.select();
      status.textContent = "Automatisches Kopieren ist hier gesperrt. Markierten Text über das Kopiermenü kopieren.";
    }
  }
  function onVisibility() { if (document.hidden) abort(abortMessages.hidden); }
  function onMenuOpen() { if (capture) abort(abortMessages.blocked); }
  function onKey(event: KeyboardEvent) {
    if (capture && event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); abort("Von dir beendet."); return; }
    if (overlay.hidden) return;
    event.stopImmediatePropagation();
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key === "Tab") {
      const focusable = [...overlay.querySelectorAll<HTMLElement>("button,summary,textarea")].filter(e => !e.hidden && e.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !overlay.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
  }
  closeButton.onclick = () => close();
  startButton.onclick = start;
  copyButton.onclick = () => { void copy(); };
  running.querySelector("button")!.onclick = () => abort("Von dir beendet.");
  overlay.addEventListener("pointerdown", event => { event.stopPropagation(); if (event.target === overlay) close(); });
  window.addEventListener("420mon-open-performance", open);
  window.addEventListener("420mon-menu-opened", onMenuOpen);
  window.addEventListener("keydown", onKey, true);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    recordFrame(deltaMs: number, renderInfo: { calls: number; triangles: number }) {
      if (!capture) return;
      const event = capture.recordFrame(deltaMs, renderInfo, options.getContext(), !document.hidden);
      if (event?.kind === "abort") { abort(abortMessages[event.reason]); return; }
      if (event?.kind === "switch") { options.setOptimized(true); updateProgress(); return; }
      if (event?.kind === "complete") { restoreMode(); showResults(event.comparison); return; }
      progressTimeMs += deltaMs;
      if (progressTimeMs >= 250) { progressTimeMs = 0; updateProgress(); }
    },
    isOpen: () => !overlay.hidden,
    dispose() {
      disposed = true;
      if (capture) restoreMode();
      window.removeEventListener("420mon-open-performance", open);
      window.removeEventListener("420mon-menu-opened", onMenuOpen);
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("visibilitychange", onVisibility);
      overlay.remove(); running.remove();
    },
  };
}
