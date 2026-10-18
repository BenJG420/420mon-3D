import type { DistrictTravel } from "./world";
import { DEX, DEX_ORDER, dexNum, speciesById } from "./data/dex";
import { DISTRICTS } from "./data/zones";
import { ITEMS, CAT_LABEL, groupedInv, itemUseLabel, SHOP, STALL_CHIPS, STALL_THREADS, STALL_FENCE } from "./data/items";
import { xpToNext } from "./data/progress";
import { consumeFish, consumeSmoke, activeFishEffects } from "./fish-consumption";
import { questProgress } from "./quests";
import { salePrice, sellMerchantItem } from "./merchant-state";
import { QUEST_DEFS } from "./data/quests";

import { getSave, saveProgress, maxHp, healLiving, type Save } from "./save";
import { ensureIvs, ivScore, statsFor, statusName } from "./battle";
import { getMove } from "./data/moves";
import { spriteUrl } from "./sprites";
import { clothingId, clothingLabel, toggleClothing, toggleBag } from "./clothing-state";
import { healInventoryItem, PAUSE_ENTRIES } from "./inventory-actions";
import "./inventory-menu.css";
const load = getSave;
export function createGameSystems(world: DistrictTravel, openGrowShop?: () => void, achievements?: { openJournal: () => void }) {
  const host = document.createElement("div");
  host.className = "systems-root";
  host.innerHTML = `<button class="systems-toggle" id="systems-open">☰ 420MON MENÜ</button><button class="world-map-shortcut" id="world-map-open">🗺 STADTPLAN</button>
  <div class="systems-scrim" aria-hidden="true"></div><section class="systems-panel original-menu" id="systems-panel" role="dialog" aria-modal="true" aria-label="420mon Menü" hidden>
    <header><strong>420MON · LOWTOWN</strong><button id="systems-close" aria-label="Schließen">✕</button></header>
    <nav id="systems-tabs"></nav>
    <div id="systems-content" class="systems-content"></div>
    <footer id="systems-footer"></footer>
  </section>`;
  document.querySelector("#app")!.append(host);
  const q = <T extends HTMLElement = HTMLElement>(id: string) => host.querySelector<T>("#" + id)!;
  const panel = q("systems-panel");
  let tab = "pause";
  let healPick = "";
  const openCats = new Set<string>();
  let selected = "";
  let merchant = "LOWTOWN · SHOP";
  let merchantItems: string[] = SHOP;
  let merchantSellMultiplier = 1;
  world.openShop(obj => {
    if (obj?.stall === "grow" && openGrowShop) { openGrowShop(); return; }
    merchant = obj?.label ?? "LOWTOWN · SHOP";
    merchantSellMultiplier = obj?.stall === "chips" ? .9 : obj?.stall === "threads" ? .85 : obj?.stall === "fence" ? 1.15 : 1;
    merchantItems = obj?.stall === "chips" ? STALL_CHIPS : obj?.stall === "threads" ? STALL_THREADS : obj?.stall === "fence" ? STALL_FENCE : SHOP;
    tab = "shop"; panel.hidden = false; render();
  });
  const escape = (v: string) => v.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]!);
  const save = (v: Save) => { saveProgress(v); };
  const note = (msg: string) => { q("systems-footer").textContent = msg; };
  function render() {
    const s = load();
    panel.dataset.view = tab;
    const tabsHost = q("systems-tabs");
    tabsHost.replaceChildren();
    if (tab !== "pause") {
      const back = document.createElement("button"); back.textContent = healPick ? "← Zurück zum Inventar" : "← Zurück";
      back.onclick = () => { if (healPick) healPick = ""; else tab = "pause"; render(); }; tabsHost.append(back);
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
    if (tab === "pause") {
      title("Pause");
      const label = document.createElement("label"); label.className = "menu-display"; label.textContent = "Anzeige · Grafik ";
      const graphics = document.querySelector<HTMLSelectElement>('[aria-label="Grafikqualität"]');
      if (graphics) {
        const select = graphics.cloneNode(true) as HTMLSelectElement; select.removeAttribute("id"); select.setAttribute("aria-label", "Anzeige im Menü"); select.value = graphics.value;
        select.onchange = () => { graphics.value = select.value; graphics.dispatchEvent(new Event("change")); }; label.append(select);
      }
      body.append(label);
      for (const [key, name] of PAUSE_ENTRIES) row(name, () => {
        if (key === "home") { world.travel("capsule"); close(); return; }
        if (key === "ach" && achievements) { close(); achievements.openJournal(); return; }
        tab = key; selected = ""; healPick = ""; openCats.clear(); render();
      });
      const mute = document.querySelector<HTMLButtonElement>(".radio-mute-dock");
      row(mute?.getAttribute("aria-pressed") === "true" ? "Ton an" : "Stumm", () => { mute?.click(); render(); });
      row("Mit Freund:innen teilen", () => {
        const url = location.href;
        if (navigator.share) void navigator.share({title:"420mon",url}).catch(() => note("Teilen geschlossen."));
        else if (navigator.clipboard) void navigator.clipboard.writeText(url).then(() => note("Link kopiert."), () => note(url));
        else note(url);
      });
      row("Konto · 2D-Original", () => {tab="net";render();});
      row("Weiter", close);
    } else if (["help", "net", "post", "log", "feedback"].includes(tab)) {
      const titles: Record<string,string> = {help:"Hilfe",net:"Leute & Chat",post:"Nachrichten",log:"Änderungen",feedback:"Feedback"};
      title(titles[tab]);
      if (tab === "help") {
        row("Unterwegs", undefined, "WASD/Pfeile oder Stick laufen · E/Touch untersuchen · Shift sprinten · I Inventar · B Dex · M Karte · H Hilfe · Esc zurück.");
        row("Inventar", undefined, "Kategorie aufklappen, Menge lesen und Benutzen wählen. Heilitems öffnen die Partnerauswahl. k.o. bleibt k.o.; eine physische Matratze belebt wieder.");
        row("Grow und Angeln", undefined, "Grow am Topf pflegen für kürzere Zeiten und mehr Ertrag. Am Neonkai mit Weed-Samen angeln; Fischsammlung im Aquarium ansehen.");
        row("Charakter ansehen", () => { close(); window.dispatchEvent(new Event("420mon-preview-clothes")); });
      } else {
        const p = document.createElement("p");
        p.textContent = tab === "net" || tab === "post" ? "Online-Funktionen laufen im 2D-Original. Der 3D-Test hat keinen Chat-/Nachrichtenserver und überträgt keine Spielstände dorthin." : "Projektinformationen und Rückmeldungen auf GitHub."; body.append(p);
        const link = document.createElement("a");
        link.href = tab === "net" || tab === "post" ? "https://benjg420.github.io/420mon/" : tab === "log" ? "https://github.com/BenJG420/420mon-3D/commits/main/" : "https://github.com/BenJG420/420mon-3D/issues/new";
        link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = tab === "net" || tab === "post" ? "2D-Original öffnen" : tab === "log" ? "Änderungen ansehen" : "Feedback schreiben"; body.append(link);
      }
    } else if (tab === "dex") {
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
          // Original 2D assets are 256 × 256 sprite sheets containing four 128 × 128 frames.
          // Crop to the first (top-left) frame for a proper single-monster portrait.
          // Keep the original sheet unchanged on disk for future 3D modelling.
          const portrait = document.createElement("span");
          portrait.className = "dex-sprite-frame";
          const image = document.createElement("img");
          image.className = "dex-original-sprite";
          image.src = spriteUrl(sp.sprite);
          image.alt = sp.name + " · Original 2D";
          image.loading = "lazy";
          image.decoding = "async";
          image.onerror = () => {
            const fallback = document.createElement("span");
            fallback.className = "dex-original-missing";
            fallback.textContent = "◈";
            fallback.title = "Original-Sprite noch nicht verfügbar: " + sp.sprite;
            portrait.replaceChildren(fallback);
          };
          portrait.append(image);
          item.append(portrait);
          const details = document.createElement("span");
          details.textContent = index + " · " + (owned ? sp.name : "???") + " · " + sp.types.join("/") + (owned ? " · 3D ansehen" : "");
          item.append(details);
          item.onclick = () => {
            note(owned ? sp.blurb + " · " + sp.where : "Noch nicht gefangen · Fundort: " + sp.where);
            if (owned) window.dispatchEvent(new CustomEvent("420mon-open-model", { detail: { id } }));
          };
          list.append(item);
        }
      };
      search.oninput = () => { selected = search.value; show(); }; show();
    } else if (tab === "team" || tab === "box") {
      const team = tab === "team"; const arr = team ? s.team : s.box!;
      title(team ? "DEIN TEAM · " + s.team.length + "/6" : "LAGERBOX · " + s.box!.length + " MONSTER");
      row(team ? "Lagerbox öffnen" : "Zur Party", () => { tab = team ? "box" : "team"; render(); });
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
        }, [team ? "Antippen: in Lagerbox verschieben" : "Antippen: ins Team holen", `EP ${m.xp}/${xpToNext(m.level)}`, ...(m.id && DEX[m.id] ? (() => { const ivs = ensureIvs(m.ivs), st = statsFor(m.id!, m.level, ivs); return [`Wert ${ivScore(ivs)} · ATK ${st.atk} · DEF ${st.def} · SP.A ${st.spa} · SP.D ${st.spd} · TEMPO ${st.spe}`, (m.moves?.length ? m.moves : DEX[m.id!].moves).map(id => getMove(id).name).join(" · ")]; })() : []), ...(m.status ? [statusName(m.status)] : [])].join(" · "));
      });
      if (team) row("✚ TEAM HEILEN", () => { if (document.querySelector(".monster-battle:not([hidden])")) { note("Nicht während eines Kampfes."); return; } const n = healLiving(s.team); save(s); render(); note(n ? "Lebende Teammonster geheilt." : "Kein verletztes lebendes Monster im Team."); }, "Heilstation · außerhalb des Kampfes");
    } else if (tab === "bag") {
      title("INVENTAR · " + s.gold + " ₲");
      const buffs = activeFishEffects(s);
      if (buffs.length) row(buffs.map(effect => effect.label).join(" · "));
      const use = (id: string, uid?: string) => {
        const it = ITEMS[id]; if (!it) return;
        if (document.querySelector(".monster-battle:not([hidden])")) { note("Im Kampf über Items benutzen."); return; }
        if (it.use === "heal" && uid === undefined && s.team.length > 1) {
          if (!s.team.some(m => m.hp > 0 && m.hp < maxHp(m))) { note("Niemand braucht Heilung."); return; }
          healPick = id; render(); return;
        }
        if (it.use === "heal" || it.use === "heal_all") {
          const result = healInventoryItem(s,id,uid); if (result.ok) { healPick = ""; save(s); render(); } note(result.message);
        } else if (it.cat === "fish") {
          const result = consumeFish(s,id); if (result.ok) { save(s); render(); } note(result.lines.join(" "));
        } else if (it.use === "smoke") {
          const result = consumeSmoke(s,id,() => saveProgress(s)); if (result.ok) render(); note(result.lines.join(" "));
        } else if (it.use === "wear") {
          const result = toggleClothing(s,id); if (result.ok) { save(s); render(); } note(result.lines.join(" "));
        }
      };
      if (healPick && !ITEMS[healPick]) healPick = "";
      if (healPick) {
        title("Wen heilen mit " + ITEMS[healPick].name + "?");
        for (const mon of s.team) {
          const down = mon.hp <= 0, full = mon.hp >= maxHp(mon);
          row(`${mon.name} · Lv.${mon.level} · ${mon.hp}/${maxHp(mon)} · ${down ? "k.o." : full ? "voll" : "Heilen"}`, down || full ? undefined : () => use(healPick,mon.uid));
        }
      } else {
        const groups = groupedInv(s.inventory);
        if (!groups.length) row("Leer. Tonnen, Fässer, Kisten, Racks, Lampen, Matratzen.");
        for (const group of groups) {
          const section = document.createElement("section"); section.className = "inventory-category"; section.dataset.category = group.cat;
          const toggle = document.createElement("button"); toggle.className = "inventory-category-toggle";
          const expanded = openCats.has(group.cat); toggle.setAttribute("aria-expanded", String(expanded));
          toggle.textContent = `${CAT_LABEL[group.cat]} · ${group.rows.length} · ×${group.rows.reduce((n,r) => n+r.n,0)} ${expanded ? "▾" : "▸"}`;
          toggle.onclick = () => { if (expanded) openCats.delete(group.cat); else openCats.add(group.cat); render(); }; section.append(toggle);
          if (expanded) {
            const list = document.createElement("ul");
            for (const {id,n,def} of group.rows) {
              const li = document.createElement("li"); li.dataset.item = id;
              const glyph = document.createElement("span"); glyph.className = "inventory-glyph"; glyph.setAttribute("aria-hidden","true"); glyph.textContent = ({heal:"✚",smoke:"≈",bud:"♧",fish:"◁",wear:"♙",chip:"◉",seed:"•",fert:"▧",key:"⚿",misc:"◇"})[group.cat];
              const info = document.createElement("div"), name = document.createElement("strong"), desc = document.createElement("small");
              name.textContent = `${def.name} ×${n}`; desc.textContent = def.desc + (def.where ? ` · ${def.where}` : ""); info.append(name,desc); li.append(glyph,info);
              const action = itemUseLabel(def,clothingId(s.outfit));
              if (action) { const button = document.createElement("button"); button.textContent = action; button.setAttribute("aria-label",`${def.name}: ${action}`); button.onclick = () => use(id); li.append(button); }
              list.append(li);
            }
            section.append(list);
          }
          body.append(section);
        }
        const extra = document.createElement("details"); extra.className = "inventory-legacy";
        const summary = document.createElement("summary"); summary.textContent = "3D-Ausrüstung"; extra.append(summary);
        const capsule = document.createElement("p"); capsule.textContent = `Standard-Kapsel ×${s.balls} · Angelegt: ${clothingLabel(s.outfit)}`; extra.append(capsule);
        const preview = document.createElement("button"); preview.textContent = "Charakter ansehen"; preview.onclick = () => { close(); window.dispatchEvent(new Event("420mon-preview-clothes")); }; extra.append(preview); body.append(extra);
      }
    } else if (tab === "shop") {
      title(merchant.toUpperCase() + " · " + s.gold + " ₲");
      row("◉ FANGKAPSEL ×1 · 25 ₲", () => {
        if (!world.shopNearby()) { panel.hidden = true; return; }
        if (s.gold! < 25) { note("Nicht genug Geld."); return; }
        s.gold! -= 25; s.balls++; save(s); render(); note("Fangkapsel gekauft.");
      });
      for (const id of merchantItems) {
        const it = ITEMS[id]; if (!it.buy || it.cat === "key") continue;
        row(it.name + " · " + it.buy + " ₲", () => {
          if (!world.shopNearby()) { panel.hidden = true; return; }
          if (s.gold! < it.buy!) { note("Nicht genug Geld."); return; }
          s.gold! -= it.buy!; s.inventory![id] = (s.inventory![id] ?? 0) + 1;
          save(s); render(); note(it.name + " gekauft.");
        }, it.desc);
      }
      title("VERKAUFEN · DEIN INVENTAR");
      for (const [id, count] of Object.entries(s.inventory)) {
        const price = salePrice(s, id, merchantSellMultiplier); if (count < 1 || !price) continue;
        row(`${ITEMS[id].name} ×${count} · +${price} ₲`, () => {
          if (!world.shopNearby()) { panel.hidden = true; return; }
          const earned = sellMerchantItem(s, id, merchantSellMultiplier);
          if (earned) { save(s); render(); note(`${ITEMS[id].name} verkauft · +${earned} Softcash.`); }
        }, "Ein Stück verkaufen");
      }
    } else if (tab === "world") {
      title("LOWTOWN · STADTPLAN");
      row("⌂ KAPSEL · DEIN ZUHAUSE", () => { world.travel("capsule"); panel.hidden = true; }, "Töpfe, Schlafplatz und dein erster Partner");
      row("↓ KELLER · RAJKOS STUDIO", () => { world.travel("studio"); panel.hidden = true; }, "Growboxen und das ursprüngliche Studio");
      const map = document.createElement("div"); map.className = "district-map";
      for (const d of DISTRICTS) {
        const btn = document.createElement("button"); btn.className = "district-map-pin";
        if (world.current() === d.id) btn.classList.add("active");
        btn.textContent = d.name + " · LV " + d.minLv + "+";
        btn.title = d.hint;
        btn.onclick = () => {
          const level = Math.max(Number(s.trainerLv) || 1, ...s.team.map(mon => mon.level));
          if (d.id !== "alley" && s.quests.q1_bolt !== "done") { note("Bolt in der Gasse zuerst helfen. Kanal-Luken bleiben als ursprünglicher Nebenweg offen."); return; }
          if (level < d.minLv) { note("Für dieses Gebiet brauchst du Stufe " + d.minLv + "."); return; }
          world.travel(d.id); panel.hidden = true;
        };
        map.append(btn);
      }
      body.append(map);
      row("↩ ZURÜCK NACH LOWTOWN / GASSE A", () => { world.travel("alley"); panel.hidden = true; }, "Zurück in die ursprüngliche Gasse");
      row("Aktueller Ort: " + world.getMapInfo().name, undefined, "Türen, Luken und Stadtplan verbinden Lowtown.");
    } else if (tab === "quest") {
      const completed = QUEST_DEFS.filter(quest => s.quests[quest.id] === "done").length;
      title(`AUFTRÄGE · ${completed}/${QUEST_DEFS.length} ABGESCHLOSSEN`);
      for (const quest of QUEST_DEFS) {
        const state = s.quests[quest.id] ?? "inactive";
        const progress = questProgress(s, quest), done = progress.done;
        row((done ? "✓ " : state === "active" ? "● " : "○ ") + quest.name, undefined,
          `${progress.current}/${progress.target} · ${quest.giver ? quest.giver + " · " : ""}${quest.place ?? "Lowtown"}${!progress.eligible && !done ? ` · Ab Stufe ${quest.minLv}` : ""} · ${quest.hint}`);
      }

    }
  }
  function close() { panel.hidden = true; healPick = ""; q("systems-open").focus(); }
  function open(next: string) {
    if (document.querySelector(".monster-battle:not([hidden]),.home-dialog:not([hidden]),.fish-overlay:not([hidden]),.grow-backdrop:not([hidden]),.monster-model-overlay:not([hidden]),.slot-overlay:not([hidden]),.achievement-overlay:not([hidden]),.story-overlay:not([hidden]),.radio-overlay:not([hidden]),.studio-panel.is-open")) return;
    tab = next; healPick = ""; openCats.clear(); panel.hidden = false; render();
    window.dispatchEvent(new Event("420mon-menu-opened")); q("systems-close").focus();
  }
  q("systems-open").onclick = () => open("pause");
  q("world-map-open").onclick = () => open("world");
  q("systems-close").onclick = close;
  host.querySelector<HTMLElement>(".systems-scrim")!.onclick = close;
  window.addEventListener("keydown", event => {
    // The Dex model studio owns Escape/focus while it sits above this menu.
    if (!panel.hidden && document.querySelector(".monster-model-overlay:not([hidden])")) return;
    if (event.repeat || event.defaultPrevented) return;
    if ((event.target as HTMLElement)?.closest("input,select,textarea,[contenteditable=true]") && event.code !== "Escape" && event.key !== "Tab") return;
    if (!panel.hidden) {
      event.stopImmediatePropagation();
      if (event.key === "Tab") {
        const controls = [...panel.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],select,input")].filter(b => b.getClientRects().length);
        const first = controls[0], last = controls[controls.length-1];
        if (event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
        else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
      }
      if (event.code === "Escape") { event.preventDefault(); if (healPick) { healPick="";render(); } else if (tab!=="pause") {tab="pause";render();} else close(); }
      else if (event.code === "KeyT") {event.preventDefault();const result=toggleBag(load());if(result.ok){saveProgress();render();}note(result.lines.join(" "));}
      else if (event.code === "KeyI") {event.preventDefault();if(tab==="bag")close();else{tab="bag";healPick="";render();}}
      return;
    }
    const next: Record<string,string> = {KeyI:"bag",KeyB:"dex",KeyM:"world",KeyH:"help",Escape:"pause"};
    if (next[event.code]) {open(next[event.code]);if(!panel.hidden)event.preventDefault();}
  }, true);
  window.addEventListener("420mon-save-changed", () => { if (!panel.hidden) render(); });
  window.addEventListener("420mon-open-quests", () => open("quest"));
  render();
}
