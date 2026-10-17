import type { DistrictTravel } from "./world";
import type { MapObj } from "./data/maps";
import { getSave, saveProgress } from "./save";
import { MACHINES, PAY, SYM_NAME, LINE_BET_MAX, stepBet, stakeTotal, type Machine, type Sym } from "./slot-rules";
import { readSlotState, settleSlotSpin, type SlotReceipt } from "./slot-state";
import { slotSymbol } from "./slot-symbols";
import "./slots.css";

const money = (n: number) => n.toLocaleString("de-DE");
/** Original three games, opened only at a real map cabinet; all bookings share the existing save. */
export function createSlotMachines(world: DistrictTravel) {
  const host = document.createElement("section"); host.className = "slot-overlay"; host.hidden = true;
  host.setAttribute("role", "dialog"); host.setAttribute("aria-modal", "true"); host.setAttribute("aria-labelledby", "slot-title");
  host.innerHTML = `<div class="slot-panel"><header><div><span class="slot-eyebrow">LOWTOWN · GLUTWALZE</span><h2 id="slot-title">Glutwalze</h2></div><button class="slot-close" type="button" aria-label="Glutwalze schließen">✕</button></header><p class="slot-wallet"></p><div class="slot-content"></div><p class="slot-note" role="status" aria-live="polite"></p></div>`;
  document.querySelector("#app")!.append(host);
  const content = host.querySelector<HTMLElement>(".slot-content")!, note = host.querySelector<HTMLElement>(".slot-note")!, wallet = host.querySelector<HTMLElement>(".slot-wallet")!;
  let location: { map: string; id: string } | undefined, machine: Machine | undefined;
  let bet = 1, lines = 1, busy = false, auto = false, hold = false, ownSave = false;
  let receipt: SlotReceipt | null = null, timer: ReturnType<typeof setTimeout> | undefined;
  let lastFocus: HTMLElement | null = null;
  let cells: HTMLElement[] = [], grid: HTMLElement | undefined, result: HTMLElement | undefined;
  const persist = () => { ownSave = true; try { return saveProgress(); } finally { ownSave = false; } };
  function inReach() {
    if (!location) return false;
    const info = world.getMapInfo(), obj = info.map.objs.find(obj => obj.id === location!.id && obj.id.startsWith("slot_") && obj.kind === "prop");
    if (info.id !== location.map || !obj) return false;
    const dx = Math.max(obj.x - info.player.x, 0, info.player.x - obj.x - obj.w);
    const dy = Math.max(obj.y - info.player.y, 0, info.player.y - obj.y - obj.h);
    return Math.hypot(dx, dy) * info.scale < 1.9;
  }
  const bank = () => readSlotState(getSave());
  const freeLeft = () => machine?.frees ? bank().freeLeft : 0;
  const locked = () => busy || auto || freeLeft() > 0;
  function clearTimer() { if (timer !== undefined) clearTimeout(timer); timer = undefined; }
  function stopAuto() { auto = false; hold = true; if (!busy) clearTimer(); syncControls(); }
  function close() {
    if (host.hidden) return;
    auto = false; hold = true; busy = false; clearTimer(); host.hidden = true;
    delete host.dataset.spinning; location = undefined;
    requestAnimationFrame(() => lastFocus?.focus());
  }
  function say(message: string) { note.textContent = message; }
  function syncControls() {
    wallet.textContent = `${money(busy && receipt ? receipt.balanceBefore - receipt.stake : getSave().gold)} Softcash${freeLeft() ? ` · ${freeLeft()} Freispiele` : ""}`;
    host.dataset.machine = machine?.id ?? "chooser";
    host.dataset.spinning = String(busy);
    if (!machine) return;
    const price = freeLeft() ? 0 : stakeTotal(lines, bet, machine.lines.length);
    for (const element of content.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>("[data-config]")) element.disabled = locked();
    const spin = content.querySelector<HTMLButtonElement>(".slot-spin")!;
    spin.disabled = busy || auto || (!freeLeft() && getSave().gold < price);
    spin.textContent = busy ? "Walzen laufen…" : freeLeft() ? `Freispiel · ${freeLeft()}` : getSave().gold < price ? "Zu wenig Softcash" : `Drehen · ${money(price)} Softcash`;
    const automatic = content.querySelector<HTMLButtonElement>(".slot-auto")!;
    const chaining = auto || (freeLeft() > 0 && !hold);
    automatic.textContent = chaining ? "Stop" : "Auto";
    automatic.disabled = !busy && !chaining && !freeLeft() && getSave().gold < price;
    content.querySelector<HTMLElement>(".slot-cost")!.textContent = `Gesamt: ${money(price)} Softcash · ${lines} ${lines === 1 ? "Linie" : "Linien"}${freeLeft() ? " · Freispiele zum gewonnenen Einsatz, Gewinn ×2" : ""}`;
  }
  function chooser() {
    machine = undefined; receipt = null; cells = []; grid = undefined; result = undefined;
    host.querySelector("h2")!.textContent = "Glutwalze";
    content.replaceChildren();
    const intro = document.createElement("p"); intro.textContent = "Drei Original-Automaten. Einsatz in Softcash pro Linie."; content.append(intro);
    const choices = document.createElement("div"); choices.className = "slot-choices";
    for (const m of MACHINES) {
      const button = document.createElement("button"); button.type = "button"; button.dataset.machine = m.id;
      const title = document.createElement("strong"), description = document.createElement("span");
      title.textContent = m.title; description.textContent = m.blurb + (m.frees && bank().freeLeft ? ` ${bank().freeLeft} Freispiele warten.` : "");
      button.append(title, description); button.onclick = () => selectMachine(m); choices.append(button);
    }
    content.append(choices); syncControls();
  }
  function selectMachine(m: Machine) {
    clearTimer(); auto = false; hold = true; busy = false; machine = m; lines = 1;
    const saved = bank();
    if (m.frees && saved.freeLeft) { bet = saved.freeBet; lines = saved.freeLines; }
    receipt = saved.last?.machine === m.id ? saved.last : null;
    // A prior receipt is read-only; it is never submitted for another payout.
    if (receipt && !saved.freeLeft) { bet = receipt.bet; lines = receipt.lines; }
    host.querySelector("h2")!.textContent = m.title;
    content.innerHTML = `<p class="slot-blurb"></p><div class="slot-grid" role="group" aria-label="Walzen"></div><div class="slot-result"></div><div class="slot-controls"><label>Einsatz pro Linie <span class="slot-bet"><button type="button" data-config data-step="-1" aria-label="Einsatz verringern">−</button><input data-config class="slot-bet-input" type="number" required min="1" max="1000000" step="1" aria-label="Softcash pro Linie"><button type="button" data-config data-step="1" aria-label="Einsatz erhöhen">+</button></span></label><label>Linien <select data-config class="slot-line-count" aria-label="Gewinnlinien"></select></label><div class="slot-presets"></div><p class="slot-cost"></p></div><details class="slot-pay"><summary>Gewinntabelle und Gewinnlinien</summary><div class="slot-pay-content"></div></details><div class="slot-actions"><button type="button" class="slot-spin"></button><button type="button" class="slot-auto">Auto</button><button type="button" class="slot-back">Andere Maschine</button></div><p class="slot-help">Von links: mindestens drei gleiche Symbole. Schließen verliert keinen gebuchten Gewinn. Freispiele bleiben am Freidreher.</p>`;
    content.querySelector(".slot-blurb")!.textContent = m.blurb;
    grid = content.querySelector<HTMLElement>(".slot-grid")!; grid.style.setProperty("--reels", String(m.reels));
    result = content.querySelector<HTMLElement>(".slot-result")!;
    cells = [];
    for (let row = 0; row < m.rows; row++) for (let reel = 0; reel < m.reels; reel++) {
      const cell = document.createElement("div"); cell.className = "slot-cell"; cell.dataset.reel = String(reel); cell.dataset.row = String(row); grid.append(cell); cells.push(cell);
    }
    const input = content.querySelector<HTMLInputElement>(".slot-bet-input")!, select = content.querySelector<HTMLSelectElement>(".slot-line-count")!;
    for (let n = 1; n <= m.lines.length; n++) { const option = document.createElement("option"); option.value = String(n); option.textContent = `${n} ${n === 1 ? "Linie" : "Linien"}`; select.append(option); }
    function config() { input.value = String(bet); select.value = String(lines); payTable(); syncControls(); }
    input.onchange = () => { if (!locked() && input.validity.valid) bet = Number(input.value); config(); };
    select.onchange = () => { if (!locked()) lines = Number(select.value); config(); };
    for (const button of content.querySelectorAll<HTMLButtonElement>("[data-step]")) button.onclick = () => { if (!locked()) bet = stepBet(bet, Number(button.dataset.step) as 1 | -1); config(); };
    for (const value of [1, 100, 1000, 10000, 100000, LINE_BET_MAX]) {
      const button = document.createElement("button"); button.type = "button"; button.dataset.config = ""; button.dataset.preset = String(value); button.textContent = money(value);
      button.onclick = () => { if (!locked()) bet = value; config(); }; content.querySelector(".slot-presets")!.append(button);
    }
    content.querySelector<HTMLButtonElement>(".slot-spin")!.onclick = startSpin;
    content.querySelector<HTMLButtonElement>(".slot-auto")!.onclick = () => {
      if (auto || (freeLeft() > 0 && !hold)) { stopAuto(); return; }
      auto = true; hold = false; if (!busy) startSpin(); syncControls();
    };
    content.querySelector<HTMLButtonElement>(".slot-back")!.onclick = () => { auto = false; hold = true; busy = false; clearTimer(); chooser(); say("Wähle deinen Automaten. Freispiele bleiben erhalten."); };
    config(); showCells(); showResult(); say(receipt ? "Letzter Dreh · bereits gutgeschrieben." : "Wähle Einsatz und Linien, dann drehe.");
  }
  function payTable() {
    if (!machine) return;
    const target = content.querySelector(".slot-pay-content")!; target.replaceChildren();
    for (const sym of machine.cycle.filter(sym => sym !== machine!.scatter && PAY[sym]?.[0] > 0)) {
      const row = document.createElement("p");
      row.textContent = `${SYM_NAME[sym]}: ${machine.reels === 3 ? `3 = ${money(PAY[sym][0] * bet)}` : PAY[sym].map((pay,i) => `${i+3} = ${money(pay*bet)}`).join(" · ")} Softcash`; target.append(row);
    }
    const info = document.createElement("p");
    info.textContent = `${machine.wild ? `${SYM_NAME[machine.wild]} ersetzt (außer Jack). ` : ""}${machine.scatter ? "Jack irgendwo: 3 ×3, 4 ×12, ab 5 ×40 auf den Gesamteinsatz. " : ""}${machine.frees ? "Zusätzlich ab 3/4/5 Jack: 6/8/10 Freispiele mit doppeltem Gewinn. " : ""}${machine.jackpot ? "Fünf 420 auf einer aktiven Linie: 10 Zero-Day-Samen und 10 Kronen-Chips, zusätzlich zum Softcash-Gewinn." : ""}`; target.append(info);
    const paths = document.createElement("div"); paths.className = "slot-paths";
    machine.lines.forEach((line, i) => {
      const p = document.createElement("p"); p.className = i < lines ? "active" : "";
      p.innerHTML = `<svg viewBox="0 0 ${machine!.reels * 20} 45" aria-hidden="true"><polyline points="${line.map((row,reel)=>`${reel*20+10},${row*15+7.5}`).join(' ')}"/></svg>`;
      p.append(`${i+1}. ${machine!.labels[i]}`); paths.append(p);
    }); target.append(paths);
  }
  function showCells(elapsed = Infinity) {
    if (!machine) return;
    const hot = new Set(receipt?.result.wins.flatMap(win => win.cells.map(([reel,row]) => `${reel}:${row}`)) ?? []);
    for (const cell of cells) {
      const reel = Number(cell.dataset.reel), row = Number(cell.dataset.row), stopped = elapsed >= 420 + reel * 280;
      const sym: Sym = stopped && receipt ? receipt.result.grid[reel][row] : machine.cycle[(Math.floor((Number.isFinite(elapsed) ? elapsed : 0) / 70) + reel * 3 + row) % machine.cycle.length];
      if (cell.dataset.symbol !== sym) { cell.innerHTML = slotSymbol(sym); const label = document.createElement("span"); label.textContent = SYM_NAME[sym]; cell.append(label); cell.dataset.symbol = sym; }
      cell.classList.toggle("rolling", !stopped); cell.classList.toggle("hot", stopped && (hot.has(`${reel}:${row}`) || !!receipt?.result.scatterPay && sym === machine.scatter));
    }
  }
  function showResult() {
    if (!result) return;
    result.replaceChildren();
    if (!receipt) { result.textContent = "Die Walzen warten."; return; }
    const r = receipt.result, heading = document.createElement("strong");
    heading.textContent = `${r.jackpot ? "JACKPOT · " : ""}${receipt.payout ? `Gewinn +${money(receipt.payout)} Softcash` : "Kein Gewinn"}${receipt.free ? " · Freispiel ×2" : ""}`; result.append(heading);
    const balance = document.createElement("p"), net = receipt.payout - receipt.stake;
    balance.textContent = `Einsatz ${money(receipt.stake)} · Saldo ${net >= 0 ? "+" : ""}${money(net)} Softcash${r.freeAward ? ` · +${r.freeAward} Freispiele` : ""}`; result.append(balance);
    if (r.jackpot) { const p = document.createElement("p"); p.textContent = "10 Zero-Day-Samen und 10 Kronen-Chips im Inventar."; result.append(p); }
    const wins = document.createElement("ul"), multiplier = receipt.free ? 2 : 1;
    for (const win of r.wins) { const li = document.createElement("li"); li.textContent = `${machine!.labels[win.line]} · ${win.count}× ${SYM_NAME[win.sym]} = ${money(win.pay * multiplier)} Softcash`; wins.append(li); }
    if (r.scatterPay) { const li = document.createElement("li"); li.textContent = `Jack ×${r.scatter} = ${money(r.scatterPay * multiplier)} Softcash`; wins.append(li); } result.append(wins);
  }
  function startSpin() {
    if (host.hidden || busy || !machine) return;
    if (!inReach()) { close(); return; }
    busy = true; clearTimer();
    const spin = settleSlotSpin(getSave(), machine.id, lines, bet, persist);
    if (!spin.ok) { busy = false; auto = false; hold = true; say(spin.reason); syncControls(); return; }
    receipt = spin.receipt; hold = false; result!.textContent = "Walzen laufen…"; say("Walzen laufen."); syncControls();
    const started = performance.now(), finishAt = 420 + (machine.reels - 1) * 280;
    const tick = () => {
      if (host.hidden || !machine || !inReach()) { close(); return; }
      const elapsed = performance.now() - started; showCells(elapsed);
      if (elapsed < finishAt) { timer = setTimeout(tick, 70); return; }
      timer = undefined; busy = false; showCells(); showResult();
      if (receipt!.result.jackpot) { auto = false; hold = true; }
      say(receipt!.result.jackpot ? "Jackpot gutgeschrieben." : "Dreh abgeschlossen."); syncControls();
      if (!hold && (auto || freeLeft() > 0)) {
        const price = freeLeft() ? 0 : stakeTotal(lines, bet, machine.lines.length);
        if (getSave().gold < price) { stopAuto(); return; }
        timer = setTimeout(startSpin, 480);
      }
    }; tick();
  }
  host.querySelector(".slot-close")!.addEventListener("click", close);
  host.addEventListener("click", event => { if (event.target === host) close(); });
  window.addEventListener("keydown", event => {
    if (host.hidden) return;
    if (event.code === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
    if (event.code === "Tab") {
      const targets = [...host.querySelectorAll<HTMLElement>("button:not(:disabled),input:not(:disabled),select:not(:disabled),summary")].filter(el => el.getClientRects().length);
      const index = targets.indexOf(document.activeElement as HTMLElement), next = (index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length;
      event.preventDefault(); event.stopImmediatePropagation(); targets[next]?.focus(); return;
    }
    if ((event.code === "Space" || event.code === "Enter") && !event.repeat && !(event.target as HTMLElement)?.closest("button,input,select,summary")) { event.preventDefault(); event.stopImmediatePropagation(); startSpin(); }
    if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyE","KeyT"].includes(event.code) && !(event.target as HTMLElement)?.matches("input,select")) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.addEventListener("420mon-district-change", close);
  window.addEventListener("pagehide", close);
  window.addEventListener("blur", stopAuto);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopAuto(); });
  window.addEventListener("420mon-save-changed", () => { if (!ownSave && !host.hidden) syncControls(); });
  return { open(obj: MapObj) {
    if (!host.hidden) return;
    location = { map: world.current(), id: obj.id }; if (!inReach()) { location = undefined; return; }
    lastFocus = document.activeElement as HTMLElement | null; host.hidden = false;
    auto = false; hold = true; busy = false; bet = 1; chooser(); say("Wähle deinen Automaten.");
    window.dispatchEvent(new Event("420mon-slot-opened")); host.querySelector<HTMLButtonElement>(".slot-close")!.focus();
  }, close };
}
