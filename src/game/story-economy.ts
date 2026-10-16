import type { DistrictTravel } from "./world";
import { getSave, saveProgress } from "./save";
import { ITEMS } from "./data/items";
import { crateOk, felixActLabel, FELIX_LINES_WORK } from "./data/felix";
import { eddiStock } from "./data/eddi";
import { ensureFelixState, meetFelix, shareWithFelix, hireFelix, cratePut, crateTake, felixBusy, felixBagSeeds, felixHarvestN } from "./felix-state";
import { eddiBody, eddiDialogue, eddiBuyPrice, buyEddiItem, EDDI_ARRIVAL_LINES } from "./eddi-state";
import { salePrice, sellMerchantItem } from "./merchant-state";
import { advanceStoryGrow } from "./story-grow";
import type { MapObj } from "./data/maps";
import "./story.css";

/** Physical helper conversations and inventory; no remotely accessible shop tab. */
export function createStoryEconomy(world: DistrictTravel) {
  const s = getSave(); ensureFelixState(s);
  const overlay = document.createElement("section");
  overlay.className = "story-overlay"; overlay.hidden = true;
  overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Lowtown Helfer");
  const card = document.createElement("div"); card.className = "story-card";
  overlay.append(card); document.querySelector("#app")!.append(overlay);
  let mode = "", view = "seeds", note = "", arrivalPending = false, lastFocus: HTMLElement | null = null;
  const close = () => { overlay.hidden = true; mode = ""; lastFocus?.focus(); };
  function open(next: string) {
    advanceStoryGrow(s);
    if (overlay.hidden) lastFocus = document.activeElement as HTMLElement;
    mode = next; note = ""; overlay.hidden = false; render();
    card.querySelector<HTMLButtonElement>("button")?.focus();
  }
  function nearby(obj: MapObj, map: string) {
    if (world.current() !== map) return false;
    const p = world.getMapInfo().player;
    return Math.hypot(Math.max(obj.x - p.x, 0, p.x - obj.x - obj.w), Math.max(obj.y - p.y, 0, p.y - obj.y - obj.h)) * .06 < 1.9;
  }
  const button = (label: string, action: () => void, parent: HTMLElement = card, disabled = false) => {
    const b = document.createElement("button"); b.textContent = label; b.disabled = disabled; b.onclick = action; parent.append(b); return b;
  };
  function paragraph(line: string) { const p = document.createElement("p"); p.textContent = line; card.append(p); }
  function mutate(action: () => void) { advanceStoryGrow(s); action(); saveProgress(); render(); }
  function offer() {
    paragraph("Felix: Ich könnte Arbeit gebrauchen. Soll ich dir beim Growen helfen?");
    paragraph(`Felix: Samen und Dünger in die Kiste in der Kapsel. Ich lauf, ein Topf nach dem anderen. Gleiche Zeit wie du. Bis hundert Samen, vierhundertzwanzig Buds — eine Runde, dann erst die Kiste. ${s.felixSmoked ? "Fünf" : "Zehn"} vom Hundert behalte ich. Fair.`);
    button("Deal.", () => mutate(() => { hireFelix(s); note = "Felix: Deal. Kiste unten rechts. Käfig links. Hundert Samen, dann die Runde."; }));
    button("Nicht jetzt.", close);
  }
  function render() {
    card.replaceChildren();
    const header = document.createElement("header"), heading = document.createElement("h2");
    heading.textContent = mode === "crate" ? "Felix-Kiste" : mode === "cage" ? "Felix · Käfig" : mode === "eddi" ? "Eddi" : mode === "arrival" ? "Hundert Schnitte" : "Felix";
    header.append(heading); button("✕", close, header).setAttribute("aria-label", "Schließen"); card.append(header);
    if (mode === "arrival") { EDDI_ARRIVAL_LINES.forEach(paragraph); button("Willkommen.", close); }
    else if (mode === "felix") {
      if (s.felixHired) {
        paragraph(felixBusy(s) ? FELIX_LINES_WORK[Math.floor(Math.random() * FELIX_LINES_WORK.length)] : "Felix: Nix Reifes, keine Samen. Käfig. Dünger darf liegen bleiben.");
        paragraph(`${felixBagSeeds(s)}/100 Samen im Beutel · ${felixHarvestN(s)}/420 Buds unterwegs · ${s.felixSmoked ? 5 : 10}% Anteil.`);
        button("Weiterarbeiten.", close);
      } else if (view === "first") {
        paragraph("Felix: Ist das Marihuana? Darf ich mal ziehen?");
        for (const share of [true, false]) button(share ? "Ein Zug." : "Lass.", () => mutate(() => {
          const result = shareWithFelix(s, share); view = "offer";
          note = !share ? "Felix: Egal. Riecht so." : result.bud ? `Felix: …ja. ${ITEMS[result.bud].name}. Schwer. Gut.` : "Felix: Hast keins. Riecht trotzdem so.";
        }));
      } else offer();
    } else if (mode === "crate") {
      if (!s.felixHired) paragraph("Felix wartet in der Gasse. Sprich mit ihm, bevor du seine Kiste benutzt.");
      else {
        paragraph("Samen, Dünger und Buds lagern hier. Felix nimmt bis zu 100 Samen mit und legt seine Ernte nach seinem Anteil zurück. Dein Inventar und die Kiste sind getrennt.");
        const tabs = document.createElement("nav"); card.append(tabs);
        for (const [id, label] of [["put", "Einlagern"], ["take", "Entnehmen"]]) button(label, () => { view = id; render(); }, tabs).ariaPressed = String(view === id);
        const state = ensureFelixState(s), inventory = view === "take" ? state.felixCrate : s.inventory;
        const list = document.createElement("div"); list.className = "story-list"; card.append(list);
        let count = 0;
        for (const [id, amount] of Object.entries(inventory)) {
          if (amount <= 0 || !ITEMS[id] || !crateOk(id, ITEMS[id].cat)) continue;
          count++;
          const row = document.createElement("div"); row.className = "story-row";
          const label = document.createElement("span"); label.textContent = `${ITEMS[id].name} · ${amount}×`; row.append(label);
          for (const n of [1, 10, amount]) {
            if (n > amount || (n === amount && (amount === 1 || amount === 10))) continue;
            button(n === amount ? "Alle" : `${n}×`, () => mutate(() => {
              const moved = (view === "take" ? crateTake : cratePut)(s, id, n);
              note = `${moved}× ${ITEMS[id].name} ${view === "take" ? "ins Inventar" : "in der Kiste"}.`;
            }), row);
          }
          // Single items still need a transfer action.
          if (amount === 1 || amount === 10) button("Alle", () => mutate(() => { const moved = (view === "take" ? crateTake : cratePut)(s, id, amount); note = `${moved}× ${ITEMS[id].name} übertragen.`; }), row);
          list.append(row);
        }
        if (!count) paragraph(view === "take" ? "Die Kiste ist leer." : "Keine passenden Gegenstände im Inventar.");
      }
    } else if (mode === "cage") {
      paragraph(s.felixHired ? `${felixActLabel(ensureFelixState(s).felixAct, felixHarvestN(s), felixBagSeeds(s))}. ${felixBagSeeds(s)} Samen im Beutel, ${felixHarvestN(s)} Buds unterwegs. Seine Kiste steht unten rechts.` : "Der Käfig ist leer. Felix wartet in der Gasse.");
    } else if (mode === "eddi") {
      paragraph(eddiDialogue()); paragraph(`${s.gold} Softcash · ${s.schnittTitle ? "Züchter-Titel aktiv · doppeltes Grow-Tempo." : "Titel extra. Felix arbeitet bei mir doppelt so schnell."}`);
      const tabs = document.createElement("nav"); card.append(tabs);
      for (const [id, label] of [["seeds", "Samen"], ["fert", "Dünger"], ["extra", "Chips & Titel"], ["sell", "Verkaufen"]]) button(label, () => { view = id; render(); }, tabs).ariaPressed = String(view === id);
      const list = document.createElement("div"); list.className = "story-list"; card.append(list);
      if (view === "sell") {
        for (const [id, amount] of Object.entries(s.inventory)) {
          const price = salePrice(s, id, 2);
          if (amount <= 0 || !price) continue;
          button(`${ITEMS[id].name} · ${amount}× · +${price} Softcash`, () => mutate(() => { const earned = sellMerchantItem(s, id, 2); note = earned ? `Verkauft: +${earned} Softcash.` : "Schon weg."; }), list);
        }
        if (!list.childElementCount) paragraph("Nichts zu verkaufen.");
      } else for (const id of eddiStock(s.schnittTitle)) {
        const item = ITEMS[id], category = item.cat === "seed" ? "seeds" : item.cat === "fert" ? "fert" : "extra";
        if (view !== category) continue;
        const price = eddiBuyPrice(s, id);
        button(`${item.name} · ${price} Softcash${s.inventory[id] ? ` · ${s.inventory[id]}×` : ""}`, () => mutate(() => { const result = buyEddiItem(s, id); note = result.ok ? `${item.name} gekauft.` : result.reason ?? "Nicht verfügbar."; }), list, s.gold < price);
      }
    }
    const status = document.createElement("footer"); status.setAttribute("role", "status"); status.textContent = note; card.append(status);
  }
  window.addEventListener("keydown", event => {
    if (overlay.hidden) return;
    if (event.code === "Escape") { event.preventDefault(); close(); }
    if (event.code === "Tab") {
      const elements = [...card.querySelectorAll<HTMLButtonElement>("button:not([disabled])")], first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  window.addEventListener("420mon-map-change", close);
  window.addEventListener("420mon-eddi-arrived", () => { arrivalPending = true; });
  return {
    openFelix(obj: MapObj) { if (!nearby(obj, obj.id === "felix" ? "alley" : "capsule")) return; view = meetFelix(s) ? "first" : "offer"; saveProgress(); open("felix"); },
    openCrate(obj: MapObj) { if (nearby(obj, "capsule")) { view = "put"; open("crate"); } },
    openCage(obj: MapObj) { if (nearby(obj, "capsule")) open("cage"); },
    openEddi(obj: MapObj) { if (s.eddiIn && nearby(obj, "capsule")) { view = "seeds"; open("eddi"); } },
    close,
    update() {
      const worker = ensureFelixState(s), bodies: MapObj[] = [];
      if (world.current() === "capsule") {
        if (s.felixHired) bodies.push({ id: "felix_body", kind: "npc", x: worker.felixX - 8, y: worker.felixY - 16, w: 16, h: 22, sprite: "npc_felix", label: felixActLabel(worker.felixAct, felixHarvestN(s), felixBagSeeds(s)), block: false });
        if (s.eddiIn) bodies.push(eddiBody(s));
      }
      world.setStoryNpcs(bodies);
      if (arrivalPending && world.current() === "capsule" && !document.querySelector(".systems-panel:not([hidden]),.grow-backdrop:not([hidden]),.monster-battle:not([hidden]),.home-dialog:not([hidden]),.story-overlay:not([hidden]),.support-overlay:not([hidden]),.radio-overlay:not([hidden]),.fish-overlay:not([hidden]),.achievement-overlay:not([hidden]),.monster-model-overlay:not([hidden]),.studio-panel.is-open")) {
        arrivalPending = false; open("arrival");
      }
    },
  };
}
