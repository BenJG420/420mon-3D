import { FISH, FISH_BY_ID, fishForBait, tankSpecies, tankFull, tankGrowLabel } from "./data/fish";
import { ITEMS } from "./data/items";
import { getSave, saveProgress } from "./save";
import { createFishSession, startCast, readyFish, fishMarker, hookFish, abortFish, recoverInterruptedCast } from "./fishing-state";
import { fishPortrait } from "./fish-art";
import { activeFishEffects, consumeFish } from "./fish-consumption";
import type { DistrictTravel } from "./world";
import type { MapObj } from "./data/maps";
import "./fishing.css";
import { mountAquarium } from "./aquarium-view";

/** Fishing and the aquarium share the original catalogue and the existing save. */
export function createFishingSystem(world: DistrictTravel) {
  const state = getSave();
  if (recoverInterruptedCast(state)) saveProgress();
  const host = document.createElement("section"); host.className = "fish-overlay"; host.hidden = true;
  host.setAttribute("role", "dialog"); host.setAttribute("aria-modal", "true"); host.setAttribute("aria-labelledby", "fish-title");
  host.innerHTML = `<div class="fish-panel"><header><div><span class="fish-eyebrow">LOWTOWN · AM WASSER</span><h2 id="fish-title">Neonkai</h2></div><button class="fish-close" aria-label="Schließen">✕</button></header><nav class="fish-tabs"><button data-tab="tank" hidden>BECKEN</button><button data-tab="cast">ANGELN</button><button data-tab="catalog">KATALOG</button><button data-tab="bag">FISCHBEUTEL</button></nav><div class="fish-content"></div><footer class="fish-note" aria-live="polite"></footer></div>`;
  document.querySelector("#app")!.appendChild(host);
  const content = host.querySelector<HTMLElement>(".fish-content")!;
  const note = host.querySelector<HTMLElement>(".fish-note")!;
  let session = createFishSession(), tab: "cast" | "catalog" | "bag" | "tank" = "cast";
  let location = "", tank = false, ownSave = false, lastFocus: HTMLElement | null = null;
  let shownPosition = 0, lastBuffSecond = -1;
  const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]!);
  const persist = () => { ownSave = true; const saved = saveProgress(); ownSave = false; return saved; };
  const running = () => session.phase === "wait" || session.phase === "wheel";
  const say = (lines: string[]) => { note.textContent = lines.join(" "); };
  let disposeAquarium: (() => void) | undefined;
  function clearAquarium() { disposeAquarium?.(); disposeAquarium = undefined; delete host.dataset.aquarium; }
  function close() {
    clearAquarium();
    const result = abortFish(state, session);
    if (result.changed) persist();
    host.hidden = true; lastFocus?.focus();
  }
  host.querySelector(".fish-close")!.addEventListener("click", close);
  host.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach(button => button.onclick = () => {
    if (running()) { say(["Erst einholen oder den Wurf beenden. Dein Samen geht beim Schließen nicht verloren."]); return; }
    tab = button.dataset.tab as typeof tab; render();
  });
  function resultView() {
    const card = document.createElement("div"); card.className = "fish-result";
    const title = document.createElement("h3");
    title.textContent = session.hit && session.target ? session.target.name : "Ein Samen zurück";
    card.appendChild(title);
    if (session.hit && session.target) {
      card.prepend(fishPortrait(session.target));
      const p = document.createElement("p"); p.textContent = `${session.target.blurb} +${session.paid} Softcash. Im Beutel und im Becken.`; card.appendChild(p);
    } else { const p = document.createElement("p"); p.textContent = session.missId; card.appendChild(p); }
    content.appendChild(card);
  }
  function seedPicker() {
    const intro = document.createElement("p"); intro.className = "fish-intro";
    intro.textContent = "Ein Weed-Samen als Köder. Jede Sorte lockt ihre eigenen Fische, Zero-Day lockt alle. Nach 2–8 Sekunden beißt es: Triff den grünen Bogen. Fehlwurf: ein Samen zurück.";
    content.appendChild(intro);
    const seeds = Object.entries(state.inventory).filter(([id, n]) => n >= 1 && ITEMS[id]?.cat === "seed" && fishForBait(id).length).sort(([a], [b]) => ITEMS[a].name.localeCompare(ITEMS[b].name, "de"));
    const list = document.createElement("div"); list.className = "fish-baits";
    for (const [id, count] of seeds) {
      const school = fishForBait(id), button = document.createElement("button"); button.type = "button"; button.dataset.bait = id;
      button.innerHTML = `<strong>${esc(ITEMS[id].name)} <span>×${count}</span></strong><small>${school.length === 42 ? "Lockt alle 42 Fische" : esc(school.map(fish => fish.name).join(" · "))}</small>`;
      button.onclick = () => {
        if (tank || world.current() !== "kai" || !location) return;
        const started = startCast(state, session, id, performance.now());
        if (!started.ok) { say([started.reason ?? "Kein Wurf möglich."]); return; }
        if (!persist()) {
          abortFish(state, session); say(["Der Spielstand konnte nicht gespeichert werden. Der Samen bleibt bei dir."]); render(); return;
        }
        say(["Rute raus. Warte auf den Biss."]); render();
      };
      list.appendChild(button);
    }
    if (!seeds.length) { const p = document.createElement("p"); p.textContent = "Keine passenden Samen im Beutel. Grow oder Markt sorgen für Köder."; list.appendChild(p); }
    content.appendChild(list);
  }
  function wheelView() {
    const zone = session.zone, from = session.zone0, to = from + zone;
    const point = (pos: number) => { const a = pos * Math.PI * 2 - Math.PI / 2; return `${120 + Math.cos(a) * 94} ${120 + Math.sin(a) * 94}`; };
    const ticks = Array.from({length:24}, (_, i) => {const a=i*Math.PI/12;return `<path d="M ${120+Math.sin(a)*110} ${120-Math.cos(a)*110} L ${120+Math.sin(a)*115} ${120-Math.cos(a)*115}"/>`;}).join("");
    const wrap = document.createElement("div"); wrap.className = "fish-wheel-wrap";
    wrap.innerHTML = `<p class="fish-bite">BISS · DER STRICH LÄUFT</p><button class="fish-wheel" type="button" aria-label="Haken"><svg viewBox="0 0 240 240" aria-label="Timing-Rad"><g class="fish-ticks">${ticks}</g><circle class="fish-track" cx="120" cy="120" r="94"/><path class="fish-zone" d="M ${point(from)} A 94 94 0 ${zone > .5 ? 1 : 0} 1 ${point(to)}"/><g class="fish-needle"><path d="M 120 12 L 120 43"/><circle cx="120" cy="120" r="6"/></g></svg><span>HAKEN</span></button><p>Tippen, Leertaste oder Enter</p>`;
    wrap.querySelector("button")!.addEventListener("click", hook);
    content.appendChild(wrap); shownPosition = 0;
  }
  function render() {
    clearAquarium();
    content.replaceChildren();
    const count = tankSpecies(state.fishCaught as Record<string, number>).length;
    host.querySelector("h2")!.textContent = tank ? `Dein Becken · ${count}/42 Arten` : "Neonkai";
    host.querySelector<HTMLButtonElement>('[data-tab="cast"]')!.hidden = tank;
    host.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach(button => { button.classList.toggle("selected", button.dataset.tab === tab); button.disabled = running(); });
    host.querySelector<HTMLButtonElement>('[data-tab="tank"]')!.hidden = !tank;
    if (tab === "tank") {
      const stage = document.createElement("div"); stage.className = "aquarium-stage"; content.append(stage);
      host.dataset.aquarium = "open";
      disposeAquarium = mountAquarium(stage, state.fishCaught as Record<string, unknown>);
      const hint = document.createElement("p"); hint.className = "fish-intro";
      hint.textContent = count ? "Jede gefangene Art schwimmt hier einmal. Katalog und Fischbeutel bleiben oben erreichbar." : "Dein Becken wartet auf die ersten Fänge vom Neonkai."; content.append(hint);
    } else if (tab === "cast") {
      if (session.phase === "wait") {
        const wait = document.createElement("div"); wait.className = "fish-wait";
        wait.innerHTML = `<div class="fish-water"><i></i><span class="fish-float"></span><b class="fish-wait-number"></b></div><p>Die Rute steht. Gleich beißt es.</p><button type="button" data-abort>Einholen · Samen zurück</button>`;
        wait.querySelector("button")!.onclick = () => { const result = abortFish(state, session); if(result.changed)persist();say(result.lines);render(); };
        content.appendChild(wait);
      } else if (session.phase === "wheel") wheelView();
      else { if (session.phase === "done") resultView(); seedPicker(); }
    } else if (tab === "catalog") {
      const intro = document.createElement("p"); intro.className = "fish-intro";
      intro.textContent = `${count}/42 Arten im Becken. Fänge bleiben hier vermerkt, auch wenn du den Fisch isst. ${tankFull(state.fishCaught as Record<string, number>) ? `Vollständig: ${tankGrowLabel()} Grow-Tempo, solange du in der Kapsel bist.` : `Alle 42 Arten geben ${tankGrowLabel()} Grow-Tempo in der Kapsel.`}`;
      content.appendChild(intro);
      const grid = document.createElement("div"); grid.className = "fish-catalog";
      for (const fish of FISH) {
        const caught = (state.fishCaught as Record<string, number>)[fish.id] ?? 0;
        const card = document.createElement("article"); card.className = "fish-species" + (caught ? " caught" : "");
        const art = document.createElement("div"); art.className = "fish-art";
        if (caught) art.appendChild(fishPortrait(fish)); else { art.textContent = "?"; art.setAttribute("aria-label", "Noch nicht gefangen"); }
        const details = document.createElement("div"); details.innerHTML = `<strong>${esc(fish.name)}</strong><small>${esc(fish.rarity)} · ${caught} gefangen</small><p>${esc(fish.blurb)}</p>`;
        card.append(art,details); grid.appendChild(card);
      }
      content.appendChild(grid);
    } else {
      const effects = activeFishEffects(state), status = document.createElement("p"); status.className = "fish-active-effects";
      status.textContent = effects.length ? effects.map(effect => effect.label).join(" · ") : "Fisch essen: Original-Boni für Fang, Tempo, Gold, Loot oder EP.";
      content.appendChild(status);
      const list = document.createElement("div"); list.className = "fish-baits";
      for (const fish of FISH) {
        const count = state.inventory[fish.id] ?? 0; if (count < 1) continue;
        const row = document.createElement("div"); row.className = "fish-food"; row.appendChild(fishPortrait(fish));
        const button = document.createElement("button"); button.type = "button"; button.dataset.eat = fish.id;
        button.innerHTML = `<strong>${esc(fish.name)} ×${count} · Essen</strong><small>${esc(ITEMS[fish.id].desc)}</small>`;
        button.onclick = () => {const result = consumeFish(state, fish.id);if(result.ok)persist();say(result.lines);render();};
        row.appendChild(button); list.appendChild(row);
      }
      if (!list.childElementCount) { const p = document.createElement("p"); p.textContent = "Kein Fisch im Beutel. Die Angelstellen warten am Neonkai."; list.appendChild(p); }
      content.appendChild(list);
    }
  }
  function hook() {
    if (host.hidden) return;
    const result = hookFish(state, session, performance.now(), shownPosition);
    if (!result.ok) return;
    navigator.vibrate?.(10); persist(); say(result.lines); render();
  }
  function open(obj: MapObj, aquarium = false) {
    if (document.querySelector(".monster-battle:not([hidden])")) return;
    if (aquarium ? world.current() !== "capsule" || obj.id !== "tank" : world.current() !== "kai" || !obj.id.startsWith("kai_cast")) return;
    if (world.getMapInfo().map.objs.every(item => item.id !== obj.id)) return;
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    tank = aquarium; location = obj.id; session = createFishSession(); tab = tank ? "tank" : "cast";
    say([tank ? "Deine Fänge schwimmen im Glas. Der Katalog zählt Arten, der Beutel einzelne Fische." : "Wähle einen Weed-Samen als Köder."]); host.hidden = false; render();
    window.dispatchEvent(new CustomEvent("420mon-fish-opened"));
    host.querySelector<HTMLButtonElement>(".fish-close")!.focus();
  }
  window.addEventListener("keydown", event => {
    if (host.hidden || event.defaultPrevented || event.repeat) return;
    if (event.key === "Tab") {
      const buttons = [...host.querySelectorAll<HTMLButtonElement>("button:not([disabled])")].filter(b => b.getClientRects().length);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest("input,select,textarea")) return;
    if (event.code === "Escape") { event.preventDefault(); close(); }
    else if (session.phase === "wheel" && ["Space","Enter","KeyE"].includes(event.code)) { event.preventDefault(); hook(); }
  });
  window.addEventListener("420mon-save-changed", () => { if (!ownSave && !host.hidden && !running()) render(); });
  window.addEventListener("420mon-district-change", () => { if (!host.hidden) close(); });
  window.addEventListener("pagehide", () => { clearAquarium(); if (abortFish(state, session).changed) persist(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && !host.hidden) { const result = abortFish(state, session); if(result.changed){persist();say(result.lines);render();} } });
  return {
    openFishing: (obj: MapObj) => open(obj), openTank: (obj: MapObj) => open(obj, true),
    update(_dt: number) {
      if (host.hidden) return;
      const now = performance.now();
      if (readyFish(session, now)) { say(["Biss. Triff den grünen Bogen."]);render(); }
      if (session.phase === "wheel") {
        shownPosition = fishMarker(session, now);
        const wheel = content.querySelector<HTMLElement>(".fish-wheel");
        if (wheel) { wheel.dataset.position = String(shownPosition); wheel.dataset.zone = String(session.zone); wheel.dataset.start = String(session.zone0); }
        content.querySelector(".fish-needle")?.setAttribute("transform", `rotate(${shownPosition * 360} 120 120)`);
      } else if (session.phase === "wait") {
        const countdown = content.querySelector(".fish-wait-number");
        if(countdown)countdown.textContent = `${Math.max(0, (session.waitMs - (now - session.t0)) / 1000).toFixed(1)} s`;
      } else if (tab === "bag" && Math.floor(Number(state.playtime ?? 0)) !== lastBuffSecond) {
        lastBuffSecond = Math.floor(Number(state.playtime ?? 0));
        const status = content.querySelector(".fish-active-effects");
        if(status)status.textContent = activeFishEffects(state).map(effect => effect.label).join(" · ") || "Keine aktiven Fisch-Boni.";
      }
    }
  };
}
