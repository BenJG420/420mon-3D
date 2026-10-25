import type { DistrictTravel } from "./world";
import { getSave, saveProgress } from "./save";
import { ITEMS, CAT_LABEL, CAT_ORDER, groupedInv } from "./data/items";
import { crateOk, felixActLabel, FELIX_LINES_WORK } from "./data/felix";
import { eddiStock } from "./data/eddi";
import { ensureFelixState, meetFelix, shareWithFelix, hireFelix, cratePut, crateTake, felixBusy, felixBagSeeds, felixHarvestN } from "./felix-state";
import { eddiBody, eddiDialogue, EDDI_ARRIVAL_LINES } from "./eddi-state";
import { salePrice } from "./merchant-state";
import { quoteTrade, executeTrade, type TradeOffer } from "./trade-state";
import { renderTradePicker } from "./trade-picker";
import { advanceStoryGrow } from "./story-grow";
import type { MapObj } from "./data/maps";
import "./inventory-menu.css";
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
  let trade: { offer: TradeOffer; label: string; action: "Kaufen" | "Verkaufen"; quantity: string } | null = null;
  const openCategories = new Set<string>(CAT_ORDER);
  let eddiLine = "";
  let eddiConversation: MapObj | null = null;
  const close = () => { overlay.hidden = true; mode = ""; trade = null; eddiConversation = null; lastFocus?.focus(); };
  function open(next: string) {
    advanceStoryGrow(s);
    if (overlay.hidden) lastFocus = document.activeElement as HTMLElement;
    mode = next; note = ""; trade = null; if (next === "eddi") eddiLine = eddiDialogue(); overlay.hidden = false; render();
    card.querySelector<HTMLButtonElement>("button")?.focus();
  }
  function nearby(obj: MapObj, map: string) {
    if (world.current() !== map) return false;
    const p = world.getMapInfo().player;
    return Math.hypot(Math.max(obj.x - p.x, 0, p.x - obj.x - obj.w), Math.max(obj.y - p.y, 0, p.y - obj.y - obj.h)) * .06 < 1.9;
  }
  const button = (label: string, action: () => void, parent: HTMLElement = card, disabled = false) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.disabled = disabled; b.onclick = action; parent.append(b); return b;
  };
  function paragraph(line: string, parent: HTMLElement = card) { const p = document.createElement("p"); p.textContent = line; parent.append(p); }
  function mutate(action: () => void) { advanceStoryGrow(s); action(); saveProgress(); render(); }
  function offer() {
    paragraph("Felix: Ich könnte Arbeit gebrauchen. Soll ich dir beim Growen helfen?");
    paragraph(`Felix: Samen und Dünger in die Kiste in der Kapsel. Ich lauf, ein Topf nach dem anderen. Gleiche Zeit wie du. Bis hundert Samen, vierhundertzwanzig Buds — eine Runde, dann erst die Kiste. ${s.felixSmoked ? "Fünf" : "Zehn"} vom Hundert behalte ich. Fair.`);
    button("Deal.", () => mutate(() => { hireFelix(s); note = "Felix: Deal. Kiste unten rechts. Käfig links. Hundert Samen, dann die Runde."; }));
    button("Nicht jetzt.", close);
  }
  function render() {
    const hadFocus = card.contains(document.activeElement);
    const focusKey = (document.activeElement as HTMLElement | null)?.dataset.eddiFocus;
    card.replaceChildren();
    card.classList.toggle("eddi-shop", mode === "eddi"); overlay.classList.toggle("eddi-shop-overlay", mode === "eddi");
    const header = document.createElement("header"), heading = document.createElement("h2");
    heading.textContent = mode === "crate" ? "Felix-Kiste" : mode === "cage" ? "Felix · Käfig" : mode === "eddi" ? "Eddi" : mode === "arrival" ? "Hundert Schnitte" : "Felix";
    header.append(heading); button("✕", close, header).setAttribute("aria-label", "Schließen"); card.append(header);
    if (mode === "arrival") { EDDI_ARRIVAL_LINES.forEach(line => paragraph(line)); button("Willkommen.", close); }
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
    } else if (mode === "eddi") renderEddi();
    const status = document.createElement("footer");
    const message = document.createElement("p"); message.setAttribute("role", "status"); message.textContent = note; status.append(message);
    if (mode === "eddi") button(trade ? "Zurück zum Sortiment" : "Zurück", () => { if (trade) { trade = null; render(); } else close(); }, status);
    card.append(status);
    if (mode === "eddi" && hadFocus) {
      const previous = [...card.querySelectorAll<HTMLElement>("[data-eddi-focus]")].find(element => element.dataset.eddiFocus === focusKey);
      (previous ?? card.querySelector<HTMLElement>("button"))?.focus();
    }
  }
  // Eddi continues his original Grow rounds during dialogue. Keep the physical
  // conversation valid at its starting point instead of chasing his moving body.
  function eddiNearby() { return !!s.eddiIn && !!eddiConversation && nearby(eddiConversation, "capsule"); }
  function renderEddi() {
    const body = document.createElement("div"); body.className = "eddi-shop-content"; card.append(body);
    paragraph(eddiLine, body);
    const wallet = document.createElement("p"); wallet.className = "eddi-wallet";
    wallet.textContent = `${s.gold.toLocaleString("de-DE")} ₲ · ${s.schnittTitle ? "Züchter-Titel aktiv" : "Eddis Sonderpreise"}`; body.append(wallet);
    const tabs = document.createElement("nav"); tabs.setAttribute("aria-label", "Eddis Handel"); body.append(tabs);
    for (const [id, label] of [["buy", "Kaufen"], ["sell", "Verkaufen"]]) {
      const tab = button(label, () => { view = id; trade = null; render(); }, tabs);
      tab.ariaPressed = String(view === id); tab.dataset.eddiTab = id;
      tab.dataset.eddiFocus = `tab:${id}`;
    }
    if (trade) {
      const draft = trade;
      renderTradePicker(body, {
        label: draft.label, action: draft.action, initialQuantity: draft.quantity,
        onQuantityChange: raw => { draft.quantity = raw; },
        quote: quantity => eddiNearby() ? quoteTrade(s, draft.offer, quantity)
          : { ok: false, max: 0, unitPrice: 0, total: 0, reason: "Sprich Eddi in deiner Nähe erneut an." },
        confirm: (quantity, unitPrice) => {
          advanceStoryGrow(s);
          if (!eddiNearby()) return { ok: false, message: "Sprich Eddi in deiner Nähe erneut an." };
          const result = executeTrade(s, draft.offer, quantity, unitPrice, () => saveProgress(s));
          if (result.ok) { trade = null; note = result.message; render(); }
          return result;
        },
        cancel: () => { trade = null; render(); },
      });
      return;
    }
    const selling = view === "sell";
    const inventory: Record<string, number> = selling
      ? Object.fromEntries(Object.entries(s.inventory).filter(([id, count]) => count > 0 && salePrice(s, id, 2) > 0))
      : Object.fromEntries(eddiStock(s.schnittTitle).map(id => [id, 1]));
    const groups = groupedInv(inventory);
    if (!groups.length) paragraph(selling ? "Nichts zu verkaufen." : "Nichts im Sortiment.", body);
    for (const group of groups) {
      const section = document.createElement("section"); section.className = "inventory-category"; section.dataset.category = group.cat;
      const expanded = openCategories.has(group.cat);
      const toggle = button("", () => { if (expanded) openCategories.delete(group.cat); else openCategories.add(group.cat); render(); }, section);
      toggle.className = "inventory-category-toggle"; toggle.setAttribute("aria-expanded", String(expanded));
      toggle.dataset.eddiFocus = `category:${group.cat}`;
      const name = document.createElement("span"); name.className = "inventory-category-name"; name.textContent = CAT_LABEL[group.cat];
      const count = document.createElement("span"); count.className = "inventory-category-count";
      count.textContent = `${group.rows.length} Arten${selling ? ` · ×${group.rows.reduce((sum, row) => sum + row.n, 0)}` : ""}`;
      const arrow = document.createElement("span"); arrow.className = "inventory-category-arrow"; arrow.textContent = expanded ? "▾" : "▸"; arrow.setAttribute("aria-hidden", "true");
      toggle.append(name, count, arrow);
      if (expanded) {
        const list = document.createElement("ul");
        for (const { id, def } of group.rows) {
          const offer: TradeOffer = { kind: selling ? "eddi-sell" : "eddi-buy", id };
          const quote = quoteTrade(s, offer);
          const li = document.createElement("li"); li.dataset.item = id;
          const info = document.createElement("div"); info.className = "inventory-item-info";
          const title = document.createElement("strong"); title.textContent = def.name;
          const desc = document.createElement("small"); desc.textContent = def.desc;
          const price = document.createElement("small"); price.className = "eddi-price";
          price.textContent = `${selling ? "+" : ""}${quote.unitPrice.toLocaleString("de-DE")} ₲ / Stück`;
          info.append(title, desc, price);
          const owned = document.createElement("span"); owned.className = "inventory-item-count";
          owned.textContent = `×${s.inventory[id] ?? 0}`; owned.setAttribute("aria-label", `${s.inventory[id] ?? 0} Stück im Inventar`);
          li.append(info, owned);
          const action = selling ? "Verkaufen" : "Kaufen";
          const choose = button(action, () => {
            if (!eddiNearby()) { note = "Sprich Eddi in deiner Nähe erneut an."; render(); return; }
            trade = { offer, label: def.name, action, quantity: "1" }; render();
            card.querySelector<HTMLInputElement>("[data-trade-quantity]")?.focus();
          }, li, !quote.ok);
          choose.className = "inventory-use"; choose.setAttribute("aria-label", `${def.name}: Menge zum ${action} wählen`);
          choose.dataset.eddiTrade = id;
          choose.dataset.eddiFocus = `item:${id}`;
          list.append(li);
        }
        section.append(list);
      }
      body.append(section);
    }
  }
  window.addEventListener("keydown", event => {
    if (overlay.hidden) return;
    if (event.code === "Escape") { event.preventDefault(); if (trade) { trade = null; render(); } else close(); }
    if (event.code === "Tab") {
      const elements = [...card.querySelectorAll<HTMLElement>("button:not([disabled]),input:not([disabled]),select:not([disabled])")], first = elements[0], last = elements.at(-1);
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
    openEddi(obj: MapObj) {
      const body = eddiBody(s);
      if (s.eddiIn && obj.id === body.id && nearby(body, "capsule")) {
        view = "buy"; eddiConversation = body; open("eddi");
      }
    },
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
