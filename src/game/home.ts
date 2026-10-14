import type { DistrictTravel } from "./world";
import type { MapObj } from "./data/maps";
import { DEX, STARTERS } from "./data/dex";
import { getSave, saveProgress, healLiving } from "./save";
import { createPartner } from "./save";
import { spriteUrl } from "./sprites";

type GrowActions = { open: (id: number) => void; sleep: () => void };

/** Original Kapsel starter and Bolt route; all mutations use the shared save. */
export function createHomeInteractions(world: DistrictTravel, grow: GrowActions) {
  const dialog = document.createElement("section");
  dialog.className = "home-dialog"; dialog.hidden = true;
  dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true");
  dialog.innerHTML = `<div class="home-dialog-card"><header><span class="home-eyebrow">LOWTOWN</span><button class="home-close" aria-label="Schließen">✕</button></header><h2></h2><div class="home-copy"></div><div class="home-actions"></div></div>`;
  document.querySelector("#app")!.append(dialog);
  const close = () => { dialog.hidden = true; };
  dialog.querySelector(".home-close")!.addEventListener("click", close);
  window.addEventListener("keydown", event => { if (event.code === "Escape") close(); });
  function show(title: string, lines: string[], actions: { label: string; run: () => void; image?: string }[] = []) {
    dialog.querySelector("h2")!.textContent = title;
    const body = dialog.querySelector(".home-copy")!; body.replaceChildren();
    for (const line of lines) { const p = document.createElement("p"); p.textContent = line; body.append(p); }
    const host = dialog.querySelector(".home-actions")!; host.replaceChildren();
    for (const action of actions) {
      const button = document.createElement("button");
      if (action.image) {
        const frame = document.createElement("span"); frame.className = "dex-sprite-frame";
        const image = document.createElement("img"); image.className = "dex-original-sprite";
        image.src = action.image; image.alt = ""; frame.append(image); button.append(frame);
      }
      const label = document.createElement("span"); label.textContent = action.label; button.append(label);
      button.onclick = action.run; host.append(button);
    }
    if (!actions.length) { const b = document.createElement("button"); b.textContent = "WEITER"; b.onclick = close; host.append(b); }
    dialog.hidden = false;
  }
  function starter() {
    const s = getSave();
    if (s.starterId) { show("Der Koffer", ["Die Kiste ist leer. Dein Partner läuft schon mit."]); return; }
    show("Dein erster Partner", ["Drei Original-420mon warten im Koffer. Wähle deinen Partner für Lowtown."], STARTERS.map(id => ({
      label: DEX[id].name + " · LV 5", image: spriteUrl(DEX[id].sprite),
      run: () => {
        const current = getSave(); if (current.starterId) return;
        const mon = createPartner(id, 5);
        (current.team.length < 6 ? current.team : current.box).push(mon);
        current.starterId = id;
        current.collection = [...new Set([...current.collection, id])];
        current.inventory.seed_eddi = (current.inventory.seed_eddi ?? 0) + 1;
        current.eddiSeed = true; saveProgress();
        show(DEX[id].name, [DEX[id].name + " (Lv.5) ist jetzt deins. Es riecht nach Regen und Strom.", "Ganz unten lag noch ein Samen."]);
      }
    })));
  }
  function bolt() {
    const s = getSave();
    if (s.quests.q1_bolt === "done") {
      show("Bolt", ["Bolt: Markt, Hinterhof, Keller — und der Rest. Schilder in der Gasse. Jeder Typ eine Straße.", "Bolt: Gulli kennt sie alle, falls du faul bist."]); return;
    }
    if (s.quests.q1_bolt === "active") {
      if ((s.inventory.chip_junk ?? 0) > 0) {
        s.inventory.chip_junk--; s.quests.q1_bolt = "done"; saveProgress();
        show("Bolt", ["Bolt schnappt den Junk-Chip.", "Bolt: Durchlass frei. Schilder an. Gulli auch."]);
      } else show("Bolt", ["Bolt: Immer noch keinen Junk-Chip? Mülltonnen, Kind."]);
      return;
    }
    s.quests.q1_bolt = "active"; saveProgress();
    show("Bolt", ["Bolt mustert deine Taschen.", "Bolt: Willst durch zum Markt, zahl mit einem Junk-Chip. Ich schließ den Riegel.", "Bolt: Und bleib weg von den Gullis. Da unten kommt keiner sauber wieder raus."]);
  }
  function interact(obj: MapObj) {
    if (obj.kind === "pot") { grow.open(obj.pot ?? 0); return; }
    if (obj.kind === "starter") { starter(); return; }
    if (obj.kind === "bed") {
      const n = healLiving(getSave().team); grow.sleep(); saveProgress();
      show("Eine Pause auf der Matte", ["Deine Pflanzen rücken um dreißig Minuten vor.", n ? "Deine lebenden Partner sind ausgeruht." : "Der Raum wird ruhig. Besiegte Partner bleiben bei 0 HP."]); return;
    }
    if (obj.id === "term") {
      close(); document.querySelector<HTMLButtonElement>("#systems-open")?.click(); return;
    }
    if (obj.id === "bolt") { bolt(); return; }
    if (obj.id === "rajko") {
      show("Rajko", ["Rajko dreht am Filter. Der Bass aus den Türmen frisst die Kapselwand.", "Rajko: Neuer Takt läuft draußen. Lowtown liegt auf dem anderen Kanal — wenn du den alten willst."]); return;
    }
    if (obj.id === "can") {
      show("Can", ["Can lehnt am Regal. Die Krone sitzt schief, das Buch nicht.", "Can: Ich bin der Erfolge-König. Vierhundertzwanzig Seiten. Ich kenn jede.", "Can: Hinweis umsonst. Der Weg kostet Softcash. Keine versteckten Spielereien. Nur Sachen, die du in Lowtown wirklich tun kannst."]); return;
    }
    if (obj.id === "ben") {
      show("Ben", ["Ben steht in Rajkos Keller.", "Bens Kasse öffnet sich ab Stufe 10."]); return;
    }
    if (obj.kind === "npc" || obj.kind === "sign" || obj.kind === "prop") show(obj.label, [obj.label + " · " + world.getMapInfo().name]);
  }
  world.setInteractionHandler(interact);
  return { show, close };
}
