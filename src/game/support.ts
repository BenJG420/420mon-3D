import { SUPPORT } from "./data/donate";
import { ITEMS } from "./data/items";
import { createSupportClient, KOFI_URL, type SupportResult } from "./support-state";
import { getSave, saveProgress } from "./save";
import type { DistrictTravel } from "./world";
import type { MapObj } from "./data/maps";
import "./support.css";

/** Ben's counter remains attached to his real cellar NPC. */
export function createSupportSystem(world: DistrictTravel) {
  const state = getSave(), client = createSupportClient(state, saveProgress);
  const host = document.createElement("section"); host.className = "support-overlay"; host.hidden = true;
  host.setAttribute("role", "dialog"); host.setAttribute("aria-modal", "true"); host.setAttribute("aria-labelledby", "support-title");
  host.innerHTML = `<div class="support-panel"><header><div><span>RAJKOS KELLER</span><h2 id="support-title">Ben · Kasse</h2></div><button type="button" class="support-close" aria-label="Kasse schließen">✕</button></header><div class="support-scroll"><p>Freiwillige Unterstützung über Ko-fi. Der Betrag bestimmt die festen Items: Kleine Kasse ab 3 €, Runde ab 8 €, Keller ab 20 €.</p><p class="support-availability"></p><section class="support-payment"><p>Hole ein Kassenwort und schreibe es in die private Ko-fi-Nachricht. Erst die Bestätigung vom Zahlungsserver gibt dein Paket frei.</p><output class="support-word">Noch kein Wort</output><button type="button" class="support-arm">Wort holen</button><a class="support-kofi" href="${KOFI_URL}" target="_blank" rel="noopener noreferrer" hidden>Ko-fi öffnen ↗</a><button type="button" class="support-claim">Zahlung prüfen</button><form class="support-code"><label for="support-code">Support-Code</label><input id="support-code" name="support-code" type="text" maxlength="100" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Dein Code von Ben"/><button type="submit">Code einlösen</button></form></section><ul class="support-tiers"></ul><p class="support-history"></p></div><footer class="support-status" role="status" aria-live="polite"></footer></div>`;
  document.querySelector("#app")!.append(host);
  const status = host.querySelector<HTMLElement>(".support-status")!;
  const arm = host.querySelector<HTMLButtonElement>(".support-arm")!;
  const claim = host.querySelector<HTMLButtonElement>(".support-claim")!;
  const kofi = host.querySelector<HTMLAnchorElement>(".support-kofi")!;
  const codeForm = host.querySelector<HTMLFormElement>(".support-code")!;
  const codeInput = host.querySelector<HTMLInputElement>("#support-code")!;
  let focus: HTMLElement | null = null, tick = 0, poll = 0, openSequence = 0;
  function nearby() {
    const info = world.getMapInfo();
    if (info.id !== "studio") return false;
    const ben = info.map.objs.find(obj => obj.id === "ben" && obj.kind === "npc");
    if (!ben) return false;
    const dx = Math.max(ben.x - info.player.x, 0, info.player.x - ben.x - ben.w);
    const dy = Math.max(ben.y - info.player.y, 0, info.player.y - ben.y - ben.h);
    return Math.hypot(dx, dy) * info.scale < 1.9;
  }
  function close() {
    if (host.hidden) return;
    openSequence++; host.hidden = true;
    if (host.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    if (focus?.isConnected) focus.focus();
  }
  function render() {
    const word = client.word(), busy = client.busy();
    host.querySelector<HTMLElement>(".support-word")!.textContent = word || "Noch kein Wort";
    host.querySelector<HTMLElement>(".support-availability")!.textContent = client.configured
      ? "Dein Paket wird nach bestätigtem Eingang einmalig in diesen Spielstand übernommen."
      : "Die automatische Kasse ist noch nicht freigeschaltet. Deshalb sind Zahlung und Code-Einlösung hier derzeit geschlossen. Es werden keine Zahlungsbelohnungen versprochen.";
    arm.disabled = !client.configured || busy; claim.disabled = !client.configured || !word || busy;
    arm.textContent = word ? "Wort bestätigen" : "Wort holen";
    kofi.hidden = !client.configured || !word || !client.ready() || busy;
    codeInput.disabled = !client.configured || busy;
    codeForm.querySelector<HTMLButtonElement>("button")!.disabled = !client.configured || busy;
    const support = Array.isArray(state.support) ? state.support.filter(id => typeof id === "string") : [];
    const historicalWords = Array.isArray(state.supportPreviousWords) ? state.supportPreviousWords.filter(word => typeof word === "string" && /^420-[a-f0-9]{8}$/.test(word)) : [];
    host.querySelector<HTMLElement>(".support-history")!.textContent = (support.length ? `${support.length} bestätigte Pakete in diesem Spielstand.` : "Noch kein bestätigtes Paket.")
      + (historicalWords.length ? ` Frühere Kassenwörter bleiben erhalten: ${historicalWords.join(", ")}. Zahlungen im Originalspiel bleiben bei dessen Kasse.` : "");
  }
  async function act(action: () => Promise<SupportResult>, silent = false) {
    if (host.hidden || !nearby() || client.busy()) return;
    const sequence = openSequence;
    if (!silent) status.textContent = "Ben prüft …";
    const task = action(); render();
    const result = await task;
    if (!host.hidden && sequence === openSequence) {
      if (!silent || result.ok) status.textContent = result.message;
      if (result.ok && action === redeem) codeInput.value = "";
      render();
    }
  }
  const redeem = () => client.redeemCode(codeInput.value);
  arm.onclick = () => { void act(client.armWord); };
  claim.onclick = () => { void act(client.claimPayment); };
  codeForm.onsubmit = event => { event.preventDefault(); void act(redeem); };
  kofi.onclick = event => { if (!client.configured || !client.word() || !client.ready() || !nearby() || host.hidden) event.preventDefault(); };
  host.querySelector(".support-close")!.addEventListener("click", close);
  host.addEventListener("click", event => { if (event.target === host) close(); });
  host.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const controls = Array.from(host.querySelectorAll<HTMLElement>("button:not(:disabled),a[href],input:not(:disabled)")).filter(element => element.offsetParent !== null);
    if (!controls.length) { event.preventDefault(); return; }
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !host.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener("keydown", event => { if (!host.hidden && event.code === "Escape") { event.preventDefault(); close(); } });
  window.addEventListener("420mon-map-change", close);
  const tiers = host.querySelector<HTMLElement>(".support-tiers")!;
  for (const tier of SUPPORT) {
    const li = document.createElement("li"), title = document.createElement("h3"), items = document.createElement("ul");
    title.textContent = `${tier.name} · ab ${tier.eur} €`;
    for (const item of tier.items) { const row = document.createElement("li"); row.textContent = `${item.n}× ${ITEMS[item.id]?.name ?? item.id}`; items.append(row); }
    li.append(title, items); tiers.append(li);
  }
  return {
    openBen: (obj?: MapObj) => {
      if (obj && obj.id !== "ben" || !nearby()) return;
      if (document.querySelector(".monster-battle:not([hidden])")) return;
      focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      openSequence++; tick = poll = 0; status.textContent = ""; render(); host.hidden = false;
      host.querySelector<HTMLButtonElement>(".support-close")!.focus();
    },
    close,
    update: (dt: number) => {
      if (host.hidden) return;
      tick += dt; poll += dt;
      if (tick >= 0.4) { tick = 0; if (!nearby() || document.querySelector(".monster-battle:not([hidden])")) { close(); return; } }
      if (poll >= 4) { poll = 0; if (client.configured && client.word() && !client.busy()) void act(client.claimPayment, true); }
    },
  };
}
