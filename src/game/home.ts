import type { DistrictTravel } from "./world";
import type { MapObj } from "./data/maps";
import { DEX, STARTERS } from "./data/dex";
import { getSave, saveProgress } from "./save";
import { createPartner } from "./save";
import { restTeam } from "./rest";
import { NPC_DIALOGUES } from "./data/npc-dialogues";
import { lootKind } from "./data/items";
import { searchContainer, searchLamp } from "./loot";
import { talkBolt, talkStatic, giveSilkStick, mattressQuest, acknowledgeBen } from "./npc-actions";
import { setQuestState } from "./quests";
import { liveWindow, staticRumor } from "./data/legend";
import { speciesById } from "./data/dex";
import { spriteUrl } from "./sprites";
import { trainerById, trainerPages, trainerStatus } from "./trainers";
import { nimDialogue, declineNim } from "./nim";
import { achievementCounts } from "./achievements";

type FishingActions = { openFishing: (obj: MapObj) => void; openTank: (obj: MapObj) => void };

type GrowActions = { open: (id: number) => void; sleep: () => void };
type TrainerActions = { startTrainer: (mapId: string, id: string) => boolean; startNim: () => boolean };
type AchievementActions = { openCan: (obj: MapObj) => void };
type StoryActions = {
  openFelix(obj: MapObj): void; openCrate(obj: MapObj): void; openCage(obj: MapObj): void;
  openEddi(obj: MapObj): void; openRadio(): void;
};

/** Original Kapsel starter and Bolt route; all mutations use the shared save. */
export function createHomeInteractions(world: DistrictTravel, grow: GrowActions, fishing?: FishingActions, combat?: TrainerActions, achievements?: AchievementActions, story?: StoryActions) {
  const dialog = document.createElement("section");
  dialog.className = "home-dialog"; dialog.hidden = true;
  dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true");
  dialog.innerHTML = `<div class="home-dialog-card"><header><span class="home-eyebrow">LOWTOWN</span><button class="home-close" aria-label="Schließen">✕</button></header><h2></h2><div class="home-copy"></div><div class="home-actions"></div></div>`;
  document.querySelector("#app")!.append(dialog);
  let nimTalking = false;
  const close = () => {
    dialog.hidden = true;
    if (nimTalking) { nimTalking = false; declineNim(getSave()); saveProgress(); }
  };
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
  const openQuests = () => { close(); window.dispatchEvent(new Event("420mon-open-quests")); };
  function npc(title: string, lines: string[], actions: { label: string; run: () => void }[] = []) {
    show(title, lines, [...actions, { label: "Aufträge ansehen", run: openQuests }, { label: "Gehen", run: close }]);
  }
  function silk(obj: MapObj) {
    const s = getSave(); setQuestState(s, "q5_silk", "active"); saveProgress();
    const calibrated = typeof s.catchPerm === "number" && s.catchPerm >= 1.08;
    const lines = ["Silk lächelt zu breit. Goldzahn.", calibrated ? "Silk: Stick ist drin. Deine Chips beißen dauerhaft härter. Buds kauf ich weiter. Kiez-Kram auch." : "Silk: Mein Stick. Markt — Kisten, Fässer, Stände. Bring ihn. Dann kalibrier ich deine Chips. Für immer. Oder verkauf Bud, der nicht Ordinary heißt."];
    const actions = [{ label: "Shop öffnen", run: () => { close(); world.shopAt(obj); } }];
    if (!calibrated && s.inventory.key_silkstick >= 1) actions.unshift({ label: "Stick geben", run: () => { const result = giveSilkStick(getSave()); saveProgress(); npc("Silk", result, [{ label: "Shop öffnen", run: () => { close(); world.shopAt(obj); } }]); } });
    npc("Silk", lines, actions);
  }
  function trainer(obj: MapObj, mapId: string) {
    const definition = trainerById(mapId, obj.id);
    if (!definition || !combat) return;
    const s = getSave(), ready = trainerStatus(s, definition) === "ready";
    const standing = s.team.some(mon => mon.id && DEX[mon.id] && mon.hp > 0);
    const lines = [...trainerPages(s, definition)];
    if (ready) lines.push(`${speciesById(definition.mon).name} · Lv.${definition.level} · ${definition.daily ? "Jeden Tag erneut herausforderbar." : "Einmalige Herausforderung."}`, "Sieg oder Fang: zusätzlicher Trainer-Bonus. Fliehen bleibt möglich.");
    if (ready && !standing) lines.push("Dein Team steht nicht mehr. Benutze eine Matratze, bevor du kämpfst.");
    show(definition.label, lines, [
      ...(ready && standing ? [{ label: "Kämpfen", image: spriteUrl(speciesById(definition.mon).sprite), run: () => { close(); combat.startTrainer(mapId, obj.id); } }] : []),
      { label: "Gehen", run: close },
    ]);
  }
  function openNim() {
    if (!combat || world.current() !== getSave().rivalMap || !dialog.hidden) return;
    const s = getSave(); nimTalking = true;
    const standing = s.team.some(mon => mon.id && DEX[mon.id] && mon.hp > 0);
    show("Nim · Rivale", nimDialogue(s), [
      ...(standing ? [{ label: "Duell", run: () => { nimTalking = false; close(); combat.startNim(); } }] : []),
      { label: "Später", run: close },
    ]);
  }
  function interact(obj: MapObj, mapId: string): boolean | void {
    if (story) {
      if (obj.id === "felix" || obj.id === "felix_body") { close(); story.openFelix(obj); return true; }
      if (obj.id === "felix_crate") { close(); story.openCrate(obj); return true; }
      if (obj.id === "felix_cage_box") { close(); story.openCage(obj); return true; }
      if (obj.id === "eddi_body") { close(); story.openEddi(obj); return true; }
      if (obj.id === "rajko" || obj.id === "st_desk") { close(); story.openRadio(); return true; }
    }
    if (obj.id === "can" && achievements) {
      saveProgress(); const counts = achievementCounts(getSave());
      show("Can · Erfolge-König", [
        "Can lehnt am Regal. Die Krone sitzt schief, das Buch nicht.",
        "Can: Ich bin der Erfolge-König. Vierhundertzwanzig Seiten. Ich kenn jede.",
        `Can: ${counts.done} von 420. Ein Teil bleibt leer, bis du ihn verdienst.`,
        "Can: Hinweis umsonst. Der Weg kostet Softcash. Der Tipp bleibt im Buch.",
        `Can: ${counts.claimable} Belohnungen warten. Zehn Softcash pro Erfolg, fünfundzwanzig für einen geheimen. Einmal pro Seite.`,
      ], [{ label: "Buch", run: () => { close(); achievements.openCan(obj); } }, { label: "Später", run: close }]); return;
    }
    if (obj.id === "nim_body") { openNim(); return; }
    if (obj.kind === "npc" && obj.mon) { trainer(obj, mapId); return; }
    if (obj.id.startsWith("kai_cast") && fishing) { close(); fishing.openFishing(obj); return; }
    if (obj.id === "tank" && fishing) { close(); fishing.openTank(obj); return; }
    if (obj.kind === "pot") { grow.open(obj.pot ?? 0); return; }
    if (obj.kind === "starter") { starter(); return; }
    if (obj.kind === "bed" || obj.kind === "mattress") {
      const story = mattressQuest(getSave(), obj, mapId);
      const { revived, healed } = restTeam(getSave().team); grow.sleep(); saveProgress();
      const lines = ["Deine Pflanzen rücken um dreißig Minuten vor."];
      if (revived) lines.push(`${revived} besiegte${revived === 1 ? "r Partner ist" : " Partner sind"} wieder auf den Beinen. HP vollständig aufgefüllt.`);
      if (healed) lines.push(`${healed} verletzte${healed === 1 ? "r Partner ist" : " Partner sind"} vollständig geheilt.`);
      if (!revived && !healed) lines.push(getSave().team.length ? "Deine Partner sind bereits ausgeruht." : "Der Raum wird ruhig. Zeit für einen neuen Anfang.");
      lines.push(...story);
      show("Ausgeruht auf der Matratze", lines); return;
    }
    if (obj.id === "term") {
      close(); document.querySelector<HTMLButtonElement>("#systems-open")?.click(); return;
    }
    if (obj.id === "silk" && obj.kind === "shop") { silk(obj); return true; }
    if (obj.kind === "shop" || obj.kind === "stall") return false;
    if (obj.id === "bolt") { const lines = talkBolt(getSave()); saveProgress(); npc("Bolt", lines); return; }
    if (obj.id === "static") {
      const s = getSave(), lines = talkStatic(s), now = Math.floor(Date.now() / 1000);
      const rumors = staticRumor(liveWindow(), typeof s.legendCoordsId === "string" ? s.legendCoordsId : "", Math.max(0, Number(s.legendCoordsUntil ?? 0) - now), id => id, id => speciesById(id).name);
      if (rumors.grant) { s.legendCoordsId = rumors.grant.id; s.legendCoordsUntil = now + 86400; }
      saveProgress(); npc("Static", [...lines, ...rumors.pages]); return;
    }
    if (obj.id === "ben") {
      const s = getSave();
      npc("Ben", ["Ben: Keller, von der Kapsel aus.", "Ab Trainerstufe 10. Ben steht in Rajkos Keller. Von der Kapsel durch die Tür Keller."], [
        ...(Number(s.trainerLv ?? 1) >= 10 && !s.benRead ? [{ label: "Gelesen. Ich weiß, wo Ben steht.", run: () => { acknowledgeBen(getSave()); saveProgress(); npc("Ben", ["Ben: Keller, von der Kapsel aus."]); } }] : []),
      ]); return;
    }
    if (lootKind(obj) === "lamp") { const result = searchLamp(getSave(), obj, mapId); saveProgress(); show(obj.label, result.lines); return; }
    if (lootKind(obj) && lootKind(obj) !== "mattress") { const result = searchContainer(getSave(), obj, mapId); saveProgress(); show(obj.label, result.lines); return; }
    const original = NPC_DIALOGUES[obj.id];
    if (original && obj.kind === "npc") { npc(original.name ?? obj.label, original.lines); return; }
    if (obj.kind === "npc" || obj.kind === "sign" || obj.kind === "prop") show(obj.label, [obj.label + " · " + world.getMapInfo().name]);
  }
  world.setInteractionHandler(interact);
  return { show, close, openNim };
}
