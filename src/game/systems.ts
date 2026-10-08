import type { DistrictTravel } from "./world";
import { DEX, DEX_ORDER, dexNum, speciesById } from "./data/dex";
import { DISTRICTS } from "./data/zones";
import { ITEMS } from "./data/items";
import { xpToNext } from "./data/progress";

type Partner = { id?: string; name: string; level: number; xp: number; hp: number };
type Save = { captures: number; wins: number; balls: number; collection: string[]; team: Partner[]; box?: Partner[]; gold?: number; inventory?: Record<string, number>; quest?: Record<string, boolean> };
const KEY = "420mon-progress-v1";
const load = (): Save => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { captures: raw.captures ?? 0, wins: raw.wins ?? 0, balls: raw.balls ?? 12, collection: raw.collection ?? [], team: raw.team ?? [], box: raw.box ?? [], gold: raw.gold ?? 150, inventory: raw.inventory ?? {}, quest: raw.quest ?? {} };
  } catch { return { captures: 0, wins: 0, balls: 12, collection: [], team: [], box: [], gold: 150, inventory: {}, quest: {} }; }
};
const maxHp = (m: Partner) => m.id ? Math.max(15, Math.round(speciesById(m.id).base.hp * (0.45 + m.level * 0.035))) : 35;
export function createGameSystems(world: DistrictTravel) {
  const host = document.createElement("div");
  host.className = "systems-root";
  host.innerHTML = `<button class="systems-toggle" id="systems-open">☰ 420MON MENÜ</button>
  <section class="systems-panel" id="systems-panel" hidden>
    <header><strong>420MON // LOWTOWN</strong><button id="systems-close">✕</button></header>
    <nav id="systems-tabs"></nav>
    <div id="systems-content" class="systems-content"></div>
    <footer id="systems-footer"></footer>
  </section>`;
  document.querySelector("#app")!.append(host);
  const q = <T extends HTMLElement = HTMLElement>(id: string) => host.querySelector<T>("#" + id)!;
  const panel = q("systems-panel");
  let tab = "dex";
  let selected = "";
  world.openShop(() => { tab = "shop"; panel.hidden = false; render(); });
  const tabs = [["dex","📖 DEX"],["team","⚔ TEAM"],["box","▦ BOX"],["bag","🎒 INVENTAR"],["world","🗺 KARTE"],["quest","★ QUESTS"]] as const;
  const escape = (v: string) => v.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]!);
  const save = (v: Save) => { localStorage.setItem(KEY, JSON.stringify(v)); window.dispatchEvent(new Event("420mon-save-changed")); };
  const note = (msg: string) => { q("systems-footer").textContent = msg; };
  function render() {
    const s = load();
    const tabsHost = q("systems-tabs");
    tabsHost.replaceChildren();
    for (const [key, label] of tabs) {
      const b = document.createElement("button");
      b.textContent = label; b.className = tab === key ? "selected" : "";
      b.onclick = () => { tab = key; selected = ""; render(); };
      tabsHost.append(b);
    }
    const body = q("systems-content");
    body.replaceChildren();
    const title = (t: string) => { const h = document.createElement("h3"); h.textContent = t; body.append(h); };
    const row = (label: string, action?: () => void, description?: string) => {
      const b = document.createElement("button"); b.className = "systems-row";
      const strong = document.createElement("strong"); strong.textContent = label; b.append(strong);
      if (description) { const small = document.createElement("small"); small.textContent = description; b.append(small); }
      if (action) b.onclick = action; else b.disabled = true;
      body.append(b);
    };
    const known = new Set(s.collection);
    if (tab === "dex") {
      title("ORIGINAL 420MON DEX · " + known.size + "/" + DEX_ORDER.length);
      const search = document.createElement("input"); search.placeholder = "Monstername oder Nummer suchen"; search.value = selected;
      body.append(search);
      const list = document.createElement("div"); body.append(list);
      const show = () => {
        list.replaceChildren();
        const query = search.value.trim().toLowerCase();
        for (const id of DEX_ORDER) {
          const sp = DEX[id]; const index = dexNum(id);
          if (query && !(sp.name.toLowerCase().includes(query) || index.toLowerCase().includes(query))) continue;
          const item = document.createElement("button"); item.className = "systems-row";
          const owned = known.has(sp.name) || known.has(id);
          const image = document.createElement("img");
          image.className = "dex-original-sprite";
          image.src = "https://raw.githubusercontent.com/BenJG420/420mon/main/public/game/sprites/" + encodeURIComponent(sp.sprite) + ".png";
          image.alt = sp.name + " · Original 2D"; image.loading = "lazy";
          image.onerror = () => { image.style.display = "none"; };
          item.append(image);
          const details = document.createElement("span");
          details.textContent = index + " · " + (owned ? sp.name : "???") + " · " + sp.types.join("/");
          item.append(details);
          item.onclick = () => note(owned ? sp.blurb + " · " + sp.where : "Noch nicht gefangen · Fundort: " + sp.where);
          list.append(item);
        }
      };
      search.oninput = () => { selected = search.value; show(); }; show();
    } else if (tab === "team" || tab === "box") {
      const team = tab === "team"; const arr = team ? s.team : s.box!;
      title(team ? "DEIN TEAM · " + s.team.length + "/6" : "LAGERBOX · " + s.box!.length + " MONSTER");
      arr.forEach((m, index) => {
        row(m.name + " · LV " + m.level + " · HP " + m.hp + "/" + maxHp(m), () => {
          if (document.querySelector(".monster-battle:not([hidden])")) { note("Nicht während eines Kampfes."); return; }
          if (team) {
            if (s.team.length <= 1) { note("Mindestens ein Teammonster behalten."); return; }
            s.box!.push(...s.team.splice(index, 1));
          } else {
            if (s.team.length >= 6) { note("Team voll. Erst ein Monster einlagern."); return; }
            s.team.push(...s.box!.splice(index, 1));
          }
          save(s); render(); note("Monster übertragen.");
        }, team ? "Antippen: in Lagerbox verschieben · EP " + m.xp + "/" + xpToNext(m.level) : "Antippen: ins Team holen");
      });
      if (team) row("✚ TEAM HEILEN", () => { s.team.forEach(m => m.hp = maxHp(m)); save(s); render(); note("Alle Teammonster geheilt."); }, "Heilstation · außerhalb des Kampfes");
    } else if (tab === "bag") {
      title("INVENTAR · " + s.gold + " ₲");
      row("◉ STANDARD-KAPSEL ×" + s.balls, undefined, "Fangversuche im Kampf");
      for (const [id, amount] of Object.entries(s.inventory!)) {
        if (amount <= 0) continue;
        const it = ITEMS[id]; if (!it) continue;
        row(it.name + " ×" + amount, it.use === "heal" || it.use === "heal_all" ? () => {
          if (document.querySelector(".monster-battle:not([hidden])")) { note("Im Kampf nicht verfügbar."); return; }
          const targets = it.use === "heal_all" ? s.team : s.team.slice(0, 1);
          targets.forEach(m => m.hp = Math.min(maxHp(m), m.hp + Math.max(1, Math.floor(maxHp(m) * (it.healPct ?? 0.5)))));
          s.inventory![id]--; save(s); render(); note(it.name + " verwendet.");
        } : undefined, it.desc);
      }
    } else if (tab === "shop") {
      title("EDDIS SHOP · " + s.gold + " ₲");
      row("◉ FANGKAPSEL ×1 · 25 ₲", () => {
        if (s.gold! < 25) { note("Nicht genug Geld."); return; }
        s.gold! -= 25; s.balls++; save(s); render(); note("Fangkapsel gekauft.");
      });
      for (const id of Object.keys(ITEMS)) {
        const it = ITEMS[id]; if (!it.buy || it.cat === "key") continue;
        row(it.name + " · " + it.buy + " ₲", () => {
          if (s.gold! < it.buy!) { note("Nicht genug Geld."); return; }
          s.gold! -= it.buy!; s.inventory![id] = (s.inventory![id] ?? 0) + 1;
          save(s); render(); note(it.name + " gekauft.");
        }, it.desc);
      }
    } else if (tab === "world") {
      title("LOWTOWN · ORIGINAL-VIERTEL");
      for (const d of DISTRICTS) row(d.name + " · LV " + d.minLv + "+", () => {
        note(d.hint + " · " + d.mons.length + " wilde Arten · 3D-Gebiet noch nicht freigeschaltet");
      }, d.look);
    } else if (tab === "quest") {
      title("AUFTRÄGE & FORTSCHRITT");
      const goals = [
        ["Erste Begegnung", s.captures >= 1, s.captures + "/1 gefangen"],
        ["Drei wilde 420mon", s.captures >= 3, Math.min(s.captures,3) + "/3 gefangen"],
        ["Kampferfahrung", s.wins >= 5, Math.min(s.wins,5) + "/5 Siege"],
        ["Sammler", known.size >= 10, Math.min(known.size,10) + "/10 Arten"],
        ["420mon-Meister", known.size >= 420, known.size + "/420 Arten"]
      ] as const;
      for (const [name, done, progress] of goals) row((done ? "✓ " : "○ ") + name, undefined, progress);
      row("Original-Story", undefined, "NPC-Dialoge und Original-Quests werden noch in die 3D-Welt portiert.");
    }
  }
  q("systems-open").onclick = () => { if (tab === "shop") tab = "world"; panel.hidden = false; render(); };
  q("systems-close").onclick = () => { panel.hidden = true; };
  window.addEventListener("420mon-save-changed", () => { if (!panel.hidden) render(); });
  render();
}
