import type { DistrictTravel } from "./world";
import { DEX, DEX_ORDER, dexNum, speciesById } from "./data/dex";
import { DISTRICTS } from "./data/zones";
import { ITEMS, SHOP, STALL_CHIPS, STALL_THREADS, STALL_FENCE } from "./data/items";
import { xpToNext } from "./data/progress";
import { consumeFish, consumeSmoke, activeFishEffects } from "./fish-consumption";
import { questProgress } from "./quests";
import { salePrice, sellMerchantItem } from "./merchant-state";
import { QUEST_DEFS } from "./data/quests";

import { getSave, saveProgress, maxHp, healLiving, type Save } from "./save";
import { ensureIvs, ivScore, statsFor, statusName } from "./battle";
import { getMove } from "./data/moves";
import { spriteUrl } from "./sprites";
import { clothingId, clothingLabel, toggleClothing } from "./clothing-state";
const load = getSave;
export function createGameSystems(world: DistrictTravel, openGrowShop?: () => void, achievements?: { openJournal: () => void }) {
  const host = document.createElement("div");
  host.className = "systems-root";
  host.innerHTML = `<button class="systems-toggle" id="systems-open">☰ 420MON MENÜ</button><button class="world-map-shortcut" id="world-map-open">🗺 STADTPLAN</button>
  <section class="systems-panel" id="systems-panel" hidden>
    <header><strong>420MON · LOWTOWN</strong><button id="systems-close">✕</button></header>
    <nav id="systems-tabs"></nav>
    <div id="systems-content" class="systems-content"></div>
    <footer id="systems-footer"></footer>
  </section>`;
  document.querySelector("#app")!.append(host);
  const q = <T extends HTMLElement = HTMLElement>(id: string) => host.querySelector<T>("#" + id)!;
  const panel = q("systems-panel");
  let tab = "dex";
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
  const tabs = [["dex","📖 DEX"],["team","⚔ TEAM"],["box","▦ BOX"],["bag","🎒 INVENTAR"],["world","🗺 KARTE"],["quest","★ QUESTS"],["ach","♛ ERFOLGE"]] as const;
  const escape = (v: string) => v.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]!);
  const save = (v: Save) => { saveProgress(v); };
  const note = (msg: string) => { q("systems-footer").textContent = msg; };
  function render() {
    const s = load();
    const tabsHost = q("systems-tabs");
    tabsHost.replaceChildren();
    for (const [key, label] of tabs) {
      const b = document.createElement("button");
      b.textContent = label; b.className = tab === key ? "selected" : "";
      b.onclick = () => {
        if (key === "ach" && achievements) { panel.hidden = true; achievements.openJournal(); return; }
        tab = key; selected = ""; render();
      };
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
      row("ANGELEGT · " + clothingLabel(s.outfit), () => {
        if (document.querySelector(".monster-battle:not([hidden])")) { note("Nach dem Kampf verfügbar."); return; }
        panel.hidden = true; window.dispatchEvent(new Event("420mon-preview-clothes"));
      }, "Charakter ansehen und vorhandene Kleidung wechseln");
      const buffs = activeFishEffects(s);
      if (buffs.length) row(buffs.map(effect => effect.label).join(" · "));
      row("◉ STANDARD-KAPSEL ×" + s.balls, undefined, "Fangversuche im Kampf");
      for (const [id, amount] of Object.entries(s.inventory!)) {
        if (amount <= 0) continue;
        const it = ITEMS[id]; if (!it) continue;
        row(it.name + " ×" + amount, it.cat === "fish" ? () => {
          if (document.querySelector(".monster-battle:not([hidden])")) { note("Fisch nach dem Kampf essen."); return; }
          const result = consumeFish(s, id); if (result.ok) { save(s); render(); } note(result.lines.join(" "));
        } : it.use === "smoke" && ["smoke", "bud"].includes(it.cat) ? () => {
          if (document.querySelector(".monster-battle:not([hidden])")) { note("Im Kampf über Items konsumieren."); return; }
          const result = consumeSmoke(s, id, () => saveProgress(s));
          if (result.ok) render(); note(result.lines.join(" "));
        } : it.use === "heal" || it.use === "heal_all" ? () => {
          if (document.querySelector(".monster-battle:not([hidden])")) { note("Im Kampf nicht verfügbar."); return; }
          const living = s.team.filter(mon => mon.hp > 0 && mon.hp < maxHp(mon));
          const targets = it.use === "heal_all" ? living : living.sort((a, b) => (maxHp(b) - b.hp) - (maxHp(a) - a.hp)).slice(0, 1);
          const n = healLiving(targets, it.healPct ?? 0.5);
          if (!n) { note("Kein verletztes lebendes Monster. Item bleibt erhalten."); return; }
          s.inventory![id]--; save(s); render(); note(it.name + " verwendet.");
        } : it.use === "wear" ? () => {
          if (document.querySelector(".monster-battle:not([hidden])")) { note("Nach dem Kampf verfügbar."); return; }
          const result = toggleClothing(s, id);
          if (result.ok) { save(s); render(); }
          note(result.lines.join(" "));
        } : undefined, it.desc + (it.use === "smoke" ? " · Antippen: konsumieren" : "") + (it.use === "wear" ? (clothingId(s.outfit) === id ? " · Angelegt · Antippen: ablegen" : " · Antippen: anziehen") : ""));
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
  q("systems-open").onclick = () => { if (tab === "shop") tab = "world"; panel.hidden = false; render(); };
  q("world-map-open").onclick = () => { tab = "world"; panel.hidden = false; render(); };
  q("systems-close").onclick = () => { panel.hidden = true; };
  window.addEventListener("420mon-save-changed", () => { if (!panel.hidden) render(); });
  window.addEventListener("420mon-open-quests", () => { tab = "quest"; panel.hidden = false; render(); });
  render();
}
