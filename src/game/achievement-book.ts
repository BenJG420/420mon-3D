import { ACH_CHAPS, ACH_DEFS, type AchDef } from "./data/achievements";
import { achievementCounts, achievementReward, buyAchievementTip, claimAchievementReward, claimAchievementRewards, syncAchievements } from "./achievements";
import { getSave, saveProgress } from "./save";
import type { DistrictTravel } from "./world";
import type { MapObj } from "./data/maps";
import "./achievement-book.css";

type Filter = "all" | "open" | "done" | "claimable" | "secret";
const FILTERS: [Filter, string][] = [["all", "Alle"], ["open", "Offen"], ["done", "Fertig"], ["claimable", "Abholbereit"], ["secret", "Geheim"]];
const PAGE_SIZE = 8;

/** Can sells the original clues; only his physical counter pays out rewards. */
export function createAchievementBook(world: DistrictTravel) {
  const state = getSave();
  const host = document.createElement("section");
  host.className = "achievement-overlay"; host.hidden = true;
  host.setAttribute("role", "dialog"); host.setAttribute("aria-modal", "true");
  host.setAttribute("aria-labelledby", "achievement-title");
  host.innerHTML = `<div class="achievement-panel"><header class="achievement-header"><div><span class="achievement-eyebrow">LOWTOWN · DEINE GESCHICHTE</span><h2 id="achievement-title">Erfolgsbuch</h2></div><button class="achievement-close" type="button" aria-label="Erfolgsbuch schließen">✕</button></header><div class="achievement-summary"><div class="achievement-total"></div><div class="achievement-progress" role="progressbar" aria-label="Erfüllte Erfolge" aria-valuemin="0" aria-valuemax="420"><i></i></div><p class="achievement-counts"></p><p class="achievement-location"></p><button class="achievement-claim-all" type="button" hidden></button></div><div class="achievement-controls"><div class="achievement-filters" role="group" aria-label="Erfolge filtern"></div><div class="achievement-chapters" role="group" aria-label="Kapitel"></div><label class="achievement-search-label" for="achievement-search">Suchen in aufgedeckten Erfolgen</label><input class="achievement-search" id="achievement-search" type="search" placeholder="Name oder Hinweis …" autocomplete="off" autocapitalize="off" spellcheck="false" /></div><div class="achievement-scroll"><p class="achievement-results" role="status"></p><ul class="achievement-list"></ul><div class="achievement-empty" hidden>Hier ist noch nichts. Wähle einen anderen Filter oder Suchbegriff.</div></div><nav class="achievement-pagination" aria-label="Seiten im Erfolgsbuch"><button type="button" class="achievement-prev">← Zurück</button><span class="achievement-page"></span><button type="button" class="achievement-next">Weiter →</button></nav><footer class="achievement-note" aria-live="polite"></footer></div>`;
  document.querySelector("#app")!.appendChild(host);
  const list = host.querySelector<HTMLUListElement>(".achievement-list")!;
  const search = host.querySelector<HTMLInputElement>(".achievement-search")!;
  const note = host.querySelector<HTMLElement>(".achievement-note")!;
  const scroll = host.querySelector<HTMLElement>(".achievement-scroll")!;
  const previous = host.querySelector<HTMLButtonElement>(".achievement-prev")!;
  const next = host.querySelector<HTMLButtonElement>(".achievement-next")!;
  const claimAll = host.querySelector<HTMLButtonElement>(".achievement-claim-all")!;
  let filter: Filter = "open", chapter = "alle", page = 0, canMode = false, ownSave = false;
  let lastFocus: HTMLElement | null = null, rangeClock = 0;

  const done = (def: AchDef) => (state.ach as Record<string, string> | undefined)?.[def.id] === "done";
  const tips = () => Array.isArray(state.achTips) ? state.achTips as string[] : [];
  const claims = () => Array.isArray(state.achClaimed) ? state.achClaimed as string[] : [];
  const hidden = (def: AchDef) => !!def.secret && !done(def) && !tips().includes(def.id);
  const battleOpen = () => !!document.querySelector(".monster-battle:not([hidden])");
  const anotherOverlayOpen = () => !!document.querySelector(".systems-panel:not([hidden]),.grow-backdrop:not([hidden]),.home-dialog:not([hidden]),.fish-overlay:not([hidden]),.studio-panel.is-open");
  const money = (amount: number) => Math.max(0, Math.floor(amount)).toLocaleString("de-DE");
  function canNearby() {
    if (world.current() !== "studio") return false;
    const info = world.getMapInfo();
    const can = info.map.objs.find(obj => obj.id === "can" && obj.kind === "npc");
    if (!can || info.id !== "studio") return false;
    const dx = Math.max(can.x - info.player.x, 0, info.player.x - can.x - can.w);
    const dy = Math.max(can.y - info.player.y, 0, info.player.y - can.y - can.h);
    return Math.hypot(dx, dy) * info.scale < 1.9;
  }
  function persist() {
    ownSave = true;
    try { return saveProgress(); }
    finally { ownSave = false; }
  }
  function close() {
    if (host.hidden) return;
    host.hidden = true;
    if (lastFocus?.isConnected) lastFocus.focus();
  }
  function mutationAllowed() {
    if (host.hidden || !canMode || !canNearby() || battleOpen() || anotherOverlayOpen()) { close(); return false; }
    return true;
  }
  function act(kind: "tip" | "claim", def: AchDef) {
    if (!mutationAllowed()) return;
    const result = kind === "tip" ? buyAchievementTip(state, def.id) : claimAchievementReward(state, def.id);
    note.textContent = result.lines.join(" ");
    if (result.ok && !persist()) note.textContent += " Der Spielstand konnte gerade nicht gespeichert werden.";
    render();
  }
  claimAll.onclick = () => {
    if (!mutationAllowed()) return;
    const result = claimAchievementRewards(state);
    note.textContent = result.lines.join(" ");
    // One engine transaction and one durable save for the whole snapshot.
    if (result.ok && !persist()) note.textContent += " Der Spielstand konnte gerade nicht gespeichert werden.";
    render();
  };

  const filterHost = host.querySelector<HTMLElement>(".achievement-filters")!;
  for (const [id, label] of FILTERS) {
    const button = document.createElement("button"); button.type = "button"; button.dataset.achFilter = id;
    button.textContent = label;
    button.onclick = () => { filter = id; page = 0; render(); scroll.scrollTop = 0; };
    filterHost.appendChild(button);
  }
  const chapters = host.querySelector<HTMLElement>(".achievement-chapters")!;
  for (const id of ["alle", ...ACH_CHAPS]) {
    const button = document.createElement("button"); button.type = "button"; button.dataset.achChapter = id;
    button.textContent = id === "alle" ? "Alle Kapitel" : id;
    button.onclick = () => { chapter = id; page = 0; render(); scroll.scrollTop = 0; };
    chapters.appendChild(button);
  }
  search.addEventListener("input", () => { page = 0; render(); scroll.scrollTop = 0; });
  previous.onclick = () => { page = Math.max(0, page - 1); render(); scroll.scrollTop = 0; };
  next.onclick = () => { page += 1; render(); scroll.scrollTop = 0; };
  host.querySelector(".achievement-close")!.addEventListener("click", close);
  host.addEventListener("click", event => { if (event.target === host) close(); });

  function card(def: AchDef) {
    const complete = done(def), paid = tips().includes(def.id), claimed = claims().includes(def.id), concealed = hidden(def);
    const row = document.createElement("li");
    row.className = `achievement-card${complete ? " is-done" : ""}${concealed ? " is-secret" : ""}${claimed ? " is-claimed" : ""}`;
    const header = document.createElement("div"); header.className = "achievement-card-heading";
    const emblem = document.createElement("span"); emblem.className = "achievement-emblem"; emblem.setAttribute("aria-hidden", "true"); emblem.textContent = complete ? "✓" : concealed ? "?" : "◇";
    const title = document.createElement("h3"); title.textContent = concealed ? "????" : def.name;
    const status = document.createElement("span"); status.className = "achievement-badge";
    status.textContent = complete ? claimed ? "Abgeholt" : "Abholbereit" : concealed ? "Geheim" : "Offen";
    header.append(emblem, title, status); row.appendChild(header);
    if (!concealed) {
      const chapterLabel = document.createElement("p"); chapterLabel.className = "achievement-chapter";
      chapterLabel.textContent = `${def.chap}${def.secret ? " · Geheimer Erfolg" : ""}`; row.appendChild(chapterLabel);
    }
    const body = document.createElement("p"); body.className = "achievement-hint";
    body.textContent = concealed ? "Leer." : complete ? paid ? `${def.hint} ${def.tip}` : def.hint : paid ? def.tip : def.hint;
    row.appendChild(body);
    const bottom = document.createElement("div"); bottom.className = "achievement-card-bottom";
    const reward = document.createElement("p"); reward.className = "achievement-reward";
    const amount = achievementReward(def);
    reward.textContent = claimed ? `${money(amount)} Softcash abgeholt` : `${money(amount)} Softcash bei Can${complete ? " abholbereit" : " nach Abschluss"}`;
    bottom.appendChild(reward);
    if (canMode && complete && !claimed) {
      const button = document.createElement("button"); button.type = "button"; button.className = "achievement-claim";
      button.textContent = `${money(amount)} Softcash abholen`; button.onclick = () => act("claim", def); bottom.appendChild(button);
    } else if (canMode && !complete && !paid) {
      const button = document.createElement("button"); button.type = "button"; button.className = "achievement-tip";
      button.textContent = `Tipp kaufen · ${money(def.price)} Softcash`;
      button.disabled = state.gold < def.price; button.onclick = () => act("tip", def); bottom.appendChild(button);
      if (button.disabled) {
        const missing = document.createElement("small"); missing.className = "achievement-missing";
        missing.textContent = `Es fehlen ${money(def.price - state.gold)} Softcash.`; bottom.appendChild(missing);
      }
    } else if (paid && !complete) {
      const paidLabel = document.createElement("span"); paidLabel.className = "achievement-tip-owned"; paidLabel.textContent = "Tipp gekauft"; bottom.appendChild(paidLabel);
    }
    row.appendChild(bottom); return row;
  }

  /** Controls stay mounted so save notifications never steal the search caret. */
  function render() {
    const counts = achievementCounts(state);
    host.querySelector("h2")!.textContent = canMode ? "Can · Erfolge-König" : "Dein Erfolgsbuch";
    host.querySelector(".achievement-total")!.textContent = `${counts.done} / ${counts.total} Erfolge`;
    const progress = host.querySelector<HTMLElement>(".achievement-progress")!;
    progress.setAttribute("aria-valuenow", String(counts.done)); progress.setAttribute("aria-valuemax", String(counts.total));
    progress.querySelector<HTMLElement>("i")!.style.width = `${counts.total ? counts.done / counts.total * 100 : 0}%`;
    host.querySelector(".achievement-counts")!.textContent = `${counts.claimable} abholbereit · ${counts.claimed} belohnt · ${counts.tips} Tipps · ${money(state.gold)} Softcash`;
    host.querySelector(".achievement-location")!.textContent = canMode
      ? "Kostenlose Hinweise im Buch. Can verkauft genaue Tipps und zahlt jede Belohnung einmal aus: 10 Softcash, bei geheimen Erfolgen 25."
      : "Hinweise kostenlos lesen. Tipps kaufen und Belohnungen abholen: bei Can in Rajkos Keller, durch die Keller-Tür deiner Kapsel.";
    const allGold = ACH_DEFS.filter(def => done(def) && !claims().includes(def.id)).reduce((sum, def) => sum + achievementReward(def), 0);
    claimAll.hidden = !canMode || counts.claimable === 0;
    claimAll.disabled = !canMode || counts.claimable === 0;
    claimAll.textContent = canMode ? `Alle ${counts.claimable} Belohnungen abholen · ${money(allGold)} Softcash` : "";
    if (claimAll.hidden && document.activeElement === claimAll) host.querySelector<HTMLButtonElement>(".achievement-close")!.focus();
    host.querySelectorAll<HTMLButtonElement>("[data-ach-filter]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.achFilter === filter)));
    host.querySelectorAll<HTMLButtonElement>("[data-ach-chapter]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.achChapter === chapter)));
    const query = search.value.trim().toLocaleLowerCase("de");
    const rows = ACH_DEFS.filter(def => {
      const complete = done(def);
      if (filter === "open" && complete || filter === "done" && !complete || filter === "claimable" && (!complete || claims().includes(def.id)) || filter === "secret" && !def.secret) return false;
      if (chapter !== "alle" && def.chap !== chapter) return false;
      if (!query) return true;
      // Unrevealed secrets are absent from search and never enter DOM text/ARIA.
      if (hidden(def)) return false;
      return `${def.name} ${def.hint} ${tips().includes(def.id) ? def.tip : ""}`.toLocaleLowerCase("de").includes(query);
    });
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)); page = Math.min(page, pages - 1);
    list.replaceChildren(...rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map(card));
    host.querySelector<HTMLElement>(".achievement-empty")!.hidden = rows.length > 0;
    host.querySelector(".achievement-results")!.textContent = `${rows.length} ${rows.length === 1 ? "Erfolg" : "Erfolge"} in dieser Auswahl`;
    host.querySelector(".achievement-page")!.textContent = `Seite ${page + 1} / ${pages}`;
    previous.disabled = page === 0; next.disabled = page >= pages - 1;
  }

  function open(pay: boolean, obj?: MapObj) {
    if (battleOpen() || anotherOverlayOpen() || pay && (obj?.id !== "can" || !canNearby())) return;
    const fresh = syncAchievements(state);
    if (fresh.length) persist();
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    canMode = pay; rangeClock = 0;
    note.textContent = pay ? "Can: Kein Zufall. 420 Dinge, die du hier wirklich tun kannst." : "Dein Fortschritt bleibt im Buch. Can wartet im Keller.";
    host.hidden = false; render();
    host.querySelector<HTMLButtonElement>(".achievement-close")!.focus();
  }
  host.addEventListener("keydown", event => {
    if (host.hidden) return;
    // E and movement shortcuts must not escape the modal while typing/searching.
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab") return;
    const focusable = Array.from(host.querySelectorAll<HTMLElement>("button:not(:disabled), input, [tabindex='0']")).filter(el => !el.hidden && el.getClientRects().length > 0);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  window.addEventListener("keydown", event => { if (!host.hidden && event.key === "Escape") { event.preventDefault(); close(); } });
  window.addEventListener("420mon-save-changed", () => { if (!ownSave && !host.hidden) render(); });
  window.addEventListener("420mon-district-change", close);
  return {
    openCan: (obj: MapObj) => open(true, obj), openJournal: () => open(false), close,
    update(dt: number) {
      if (host.hidden) return;
      rangeClock += dt;
      if (rangeClock < .15) return;
      rangeClock = 0;
      if (battleOpen() || anotherOverlayOpen() || canMode && !canNearby()) close();
    },
  };
}
