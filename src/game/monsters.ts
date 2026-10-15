import { DEX_ORDER, encountersFor, speciesById, dexNum, type EncMon } from "./data/dex";
import { xpToNext, MAX_LEVEL } from "./data/progress";
import { ELEMENT_COLOR, ELEMENT_LABEL, matchupHint } from "./data/types";
import { getMove } from "./data/moves";
import * as THREE from "three";
import { getSave, saveProgress, healLiving, maxHp, type Partner } from "./save";
import { createMonsterArt, setMonsterArt, disposeMonsterArt } from "./monster-art";
import type { DistrictTravel } from "./world";
import { legendByMon, windowOpen } from "./data/legend";
import { ITEMS } from "./data/items";
import { spriteUrl } from "./sprites";
import { makeInst, toFighter, turnSpe, execMove, tickStatus, pickEnemyMove, xpFor, tryLevel, tryTrainerLevel, catchChance, statusName, ivScore, type Fighter } from "./battle";
import { battleXpBoost, battleCatchBoost, battleGoldReward } from "./battle-rewards";
import { normalizePartnerForBattle, type BattleInstance } from "./battle-instance";
import { createTrainerAttempt, settleTrainer, type TrainerAttempt } from "./trainers";
import { beginNimDuel } from "./nim";

type Species = { id?: string; name: string; color: number; glow: number; maxHp: number; catchRate: number };
type WildMon = { inst: BattleInstance; species: Species; mesh: THREE.Group; hp: number; alive: boolean; phase: number; level: number; respawn: number; pool: EncMon[]; spot?: string; respawnAllowed: boolean };
const positions: [number, number][] = [
  [11, -9], [-11, -10], [10, 11], [-12, 10], [22, 5], [-23, -4],
  [5, 23], [-7, -23], [28, 20], [-27, 22], [23, -27], [-25, -25],
];
type TeamMon = Partner;
const monsters: WildMon[] = [];
const saved = getSave();
const save = saveProgress;

/** The original game weights each entry, then rolls inside its level band. */
export function pickEncounter(pool: EncMon[], random = Math.random): EncMon | undefined {
  const total = pool.reduce((sum, mon) => sum + Math.max(0, mon.w), 0);
  if (!pool.length || total <= 0) return undefined;
  let roll = Math.max(0, Math.min(1 - Number.EPSILON, random())) * total;
  for (const mon of pool) {
    roll -= Math.max(0, mon.w);
    if (roll < 0) return mon;
  }
  return pool[pool.length - 1];
}

export function encounterLevel(mon: EncMon, random = Math.random): number {
  const [low, high] = mon.lvl;
  return Math.max(1, Math.min(MAX_LEVEL, low + Math.floor(Math.max(0, Math.min(1 - Number.EPSILON, random())) * (high - low + 1))));
}
const monsterRoot = new THREE.Group();
export function createMonsterGame(scene: THREE.Scene, player: THREE.Group, world?: DistrictTravel) {
  scene.add(monsterRoot);
  function spawn(pool: EncMon[], x: number, z: number, spot?: string, fixedLevel?: number) {
    const picked = pickEncounter(pool);
    if (!picked) return;
    const original = speciesById(picked.id);
    const wildLevel = fixedLevel ?? encounterLevel(picked);
    const inst = makeInst(original.id, wildLevel);
    const tint = new THREE.Color(ELEMENT_COLOR[original.types[0]]).getHex();
    const kind: Species = { id: original.id, name: original.name, color: tint, glow: tint, maxHp: inst.hpMax, catchRate: original.catch / 255 };
    const root = createMonsterArt(original.id, tint);
    root.position.set(x, 0, z);
    monsterRoot.add(root);
    monsters.push({ inst, species: kind, mesh: root, hp: kind.maxHp, alive: true, phase: monsters.length * 0.9, level: wildLevel, respawn: 0, pool, spot, respawnAllowed: !spot });
  }
  function changeMap(id: string) {
    finish();
    nearest = null;
    encounterButton.hidden = true;
    for (const mon of monsters) disposeMonsterArt(mon.mesh);
    monsters.length = 0;
    if (!world) {
      if (["capsule", "studio", "kino"].includes(id)) return;
      for (const [x, z] of positions) spawn(encountersFor(id), player.position.x + x, player.position.z + z);
      return;
    }
    const { map } = world.getMapInfo();
    if (["capsule", "studio", "kino"].includes(id)) return;
    for (const obj of map.objs) {
      if (obj.kind !== "wild" || !obj.mon) continue;
      const spot = `${id}:${obj.id}`;
      if (saved.deadWild.includes(spot) || saved.deadWild.includes(obj.id)) continue;
      const legendary = legendByMon(obj.mon);
      const override = saved.legendCoordsId === obj.mon && typeof saved.legendCoordsUntil === "number" && saved.legendCoordsUntil > Date.now() / 1000;
      if (legendary && !windowOpen(legendary) && !override) continue;
      const point = world.toWorld(obj.x + obj.w / 2, obj.y + obj.h / 2);
      spawn([{ id: obj.mon, lvl: [obj.lvl ?? 1, obj.lvl ?? 1], w: 1 }], point.x, point.z, spot, obj.lvl);
    }
    // Each habitat uses its own original weighted encounter list and level range.
    for (const zone of map.zones) {
      for (const fraction of [0.32, 0.68]) {
        const point = world.toWorld(zone.x + zone.w * fraction, zone.y + zone.h * 0.5);
        if (!world.collides(point.x, point.z, 0.3)) spawn(zone.mons, point.x, point.z);
      }
    }
  }
  window.addEventListener("420mon-district-change", (event: Event) => changeMap((event as CustomEvent<string>).detail));
  const ui = document.createElement("div");
  ui.className = "monster-ui";
  ui.innerHTML = `
    <div id="monster-toast" class="monster-toast" hidden></div>
    <div class="monster-progress"><strong>420MON // ORIGINAL DEX</strong><div id="monster-count"></div><div id="monster-quest"></div></div>
    <button type="button" class="monster-interact" id="monster-interact" hidden>⚡ BEGEGNEN</button>
    <div class="monster-battle" id="monster-battle" role="dialog" aria-modal="true" aria-labelledby="monster-battle-title" hidden>
      <section class="monster-battle-card">
        <header class="monster-battle-heading"><div><span id="monster-battle-kind">LOWTOWN · WILDE BEGEGNUNG</span><strong id="monster-battle-title">DEIN NÄCHSTER ZUG</strong></div><span id="monster-turn">RUNDE 1</span></header>
        <div class="battle-fighters">
          <div class="battle-fighter battle-ally"><div class="battle-portrait dex-sprite-frame" id="monster-ally-art"></div><div><div id="monster-team-status"></div><div class="monster-hp"><div id="monster-ally-hp-bar"></div></div><small id="monster-ally-detail"></small></div></div>
          <div class="battle-fighter battle-enemy"><div class="battle-portrait dex-sprite-frame" id="monster-enemy-art"></div><div><div id="monster-name"></div><div class="monster-hp"><div id="monster-hp-bar"></div></div><small id="monster-enemy-detail"></small></div></div>
        </div>
        <div id="monster-message" class="battle-log" aria-live="polite" aria-atomic="true"></div>
        <div class="battle-moves" id="monster-moves">
          <button type="button" id="monster-attack"></button><button type="button" id="monster-special"></button>
          <button type="button" id="monster-move-2"></button><button type="button" id="monster-move-3"></button>
        </div>
        <div class="monster-actions">
          <button type="button" id="monster-catch">◉ FANGEN</button><button type="button" id="monster-party">⇄ TEAM</button>
          <button type="button" id="monster-items">✚ ITEMS</button><button type="button" id="monster-run">↩ FLIEHEN</button>
        </div>
        <div class="battle-catch-choice" id="monster-catch-choice"><label for="monster-chip">Fangmittel</label><select id="monster-chip"></select><span id="monster-chance"></span></div>
        <div class="battle-submenu" id="monster-party-list" hidden></div>
        <div class="battle-submenu" id="monster-item-list" hidden></div>
        <small class="battle-help" id="monster-battle-help">Tempo bestimmt die Reihenfolge · Teamwechsel kostet einen Zug</small>
      </section>
    </div>
    <button type="button" class="monster-heal" id="monster-heal">✚ TEAM HEILEN</button>
    <button type="button" class="monster-collection-toggle" id="monster-collection-toggle">◈ SAMMLUNG</button>
    <div class="monster-collection" id="monster-collection" hidden><strong>DEINE 420MON</strong><div id="monster-list"></div><div id="monster-team-list"></div><button type="button" id="monster-collection-close">SCHLIESSEN</button></div>`;
  document.querySelector("#app")!.appendChild(ui);
  const get = (id: string) => ui.querySelector<HTMLElement>("#" + id)!;
  const encounterButton = get("monster-interact") as HTMLButtonElement;
  const battle = get("monster-battle");
  const collection = get("monster-collection");
  let active: WildMon | null = null;
  let nearest: WildMon | null = null;
  let cooldown = 0;
  let time = 0;
  let ally: TeamMon | null = null;
  let allyModel: THREE.Group | null = null;
  let messageTimer: ReturnType<typeof setTimeout> | undefined;
  function notify(message: string) {
    const toast = get("monster-toast");
    toast.textContent = message;
    toast.hidden = false;
    if (messageTimer !== undefined) clearTimeout(messageTimer);
    messageTimer = setTimeout(() => { toast.hidden = true; }, 2800);
  }
  let fighter: Fighter | null = null;
  let enemy: Fighter | null = null;
  let phase: "choose" | "win" | "caught" | "lose" = "choose";
  let turn = 1;
  let selectedChip = "legacy_capsule";
  let trainerAttempt: TrainerAttempt | null = null;
  let challenge: "trainer" | "nim" | null = null;
  let challengeMon: WildMon | null = null;
  let enemyQueue: BattleInstance[] = [];
  let duelCount = 0;
  const log: string[] = [];
  const moveButtons = ["monster-attack", "monster-special", "monster-move-2", "monster-move-3"];
  const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]!);
  const finite = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const available = (mon: Partner) => mon.hp > 0 && !!mon.id && !!DEX_ORDER.includes(mon.id);
  const addLog = (...lines: string[]) => { log.push(...lines); if (log.length > 18) log.splice(0, log.length - 18); };
  function syncFighters() {
    if (ally && fighter) {
      Object.assign(ally, fighter.inst, { name: speciesById(fighter.inst.id).name });
      if (!saved.collection.includes(fighter.inst.id)) saved.collection.push(fighter.inst.id);
    }
    if (active && enemy) {
      active.inst = enemy.inst; active.hp = enemy.inst.hp;
    }
  }
  function grant(id: string) {
    const achievements = saved.ach && typeof saved.ach === "object" ? saved.ach as Record<string, string> : {};
    achievements[id] = "done"; saved.ach = achievements;
  }
  function awardVictory() {
    if (!active || !fighter || !enemy || phase !== "choose") return;
    const amount = Math.max(1, Math.round(xpFor(enemy, fighter.inst.level) * battleXpBoost(saved)));
    const levels: string[] = [];
    if (fighter.inst.hp > 0) { fighter.inst.xp += amount; levels.push(...tryLevel(fighter.inst)); }
    syncFighters();
    for (const mon of saved.team) {
      if (mon === ally || !available(mon)) continue;
      const inst = normalizePartnerForBattle(mon);
      inst.xp += Math.max(1, Math.floor(amount * .5));
      levels.push(...tryLevel(inst));
      Object.assign(mon, inst, { name: speciesById(inst.id).name });
    }
    const trainer = tryTrainerLevel(finite(saved.trainerLv, 1), finite(saved.trainerXp) + amount);
    saved.trainerLv = trainer.lv; saved.trainerXp = trainer.xp;
    levels.push(...trainer.lines);
    const gold = battleGoldReward(saved, 2 + active.level);
    saved.wins++; saved.gold += gold;
    saved.stats.battlesWon = Math.max(saved.wins, finite(saved.stats.battlesWon) + 1);
    saved.stats.goldEarned = finite(saved.stats.goldEarned) + gold;
    if (saved.stats.goldEarned >= 1000) grant("gold_1000");
    saved.quests.q4_fight = "done"; saved.quest.q4_fight = true;
    grant("first_fight"); if (saved.stats.battlesWon >= 10) grant("fight_10");
    for (const lv of [50, 100, 420]) if (Math.max(finite(saved.trainerLv), ...saved.team.map(mon => mon.level)) >= lv) grant(`lv_${lv}`);
    retireWild(active); phase = "win";
    addLog(`${active.species.name} besiegt. +${amount} EP · +${gold} Softcash.`, ...levels);
    if (trainerAttempt) addLog(...settleTrainer(saved, trainerAttempt, "win").lines);
    if (levels.length) spawnAlly();
  }
  function advanceDuel() {
    if (challenge !== "nim" || !enemyQueue.length || !active || !enemy || !fighter) return false;
    const amount = Math.max(1, Math.round(xpFor(enemy, fighter.inst.level) * battleXpBoost(saved)));
    const gone = active.species.name, levels: string[] = [];
    if (fighter.inst.hp > 0) { fighter.inst.xp += amount; levels.push(...tryLevel(fighter.inst)); }
    syncFighters();
    const trainer = tryTrainerLevel(finite(saved.trainerLv, 1), finite(saved.trainerXp) + amount);
    saved.trainerLv = trainer.lv; saved.trainerXp = trainer.xp; levels.push(...trainer.lines);
    const next = enemyQueue.shift()!;
    enemy = toFighter(next, false);
    const sp = speciesById(next.id), tint = new THREE.Color(ELEMENT_COLOR[sp.types[0]]).getHex();
    active.inst = next; active.hp = next.hp; active.level = next.level;
    active.species = { id: sp.id, name: sp.name, color: tint, glow: tint, maxHp: next.hpMax, catchRate: sp.catch / 255 };
    setMonsterArt(active.mesh, sp.id, tint);
    addLog(`${gone} k.o. +${amount} EP.`, `Nim: ${sp.name} (Lv.${next.level}) kommt rein. Noch ${enemyQueue.length + 1}.`, ...levels);
    if (fighter.inst.hp <= 0) {
      const replacement = saved.team.find(available);
      if (replacement) { ally = replacement; fighter = toFighter(normalizePartnerForBattle(replacement), false); }
      else { phase = "lose"; addLog("Dein Team ist am Ende. Besiegte Partner brauchen eine Matratze."); }
    }
    spawnAlly();
    return true;
  }
  const updateProgress = () => {
    get("monster-count").textContent = `GEFANGEN ${saved.captures} · SIEGE ${saved.wins} · TRAINER LV ${finite(saved.trainerLv, 1)}`;
    get("monster-quest").textContent = `DEX ${new Set(saved.collection).size}/${DEX_ORDER.length} · AUFTRÄGE ${Object.values(saved.quests).filter(value => value === "done").length}`;
    get("monster-list").textContent = saved.collection.length ? saved.collection.map(id => id.startsWith("mon_") ? speciesById(id).name : id).join(" · ") : "Noch keine Monster gefangen.";
    const teamList = get("monster-team-list");
    teamList.replaceChildren();
    const heading = document.createElement("h4");
    heading.textContent = "DEIN TEAM (MAX. 6) – TIPPE ZUM WECHSELN";
    teamList.appendChild(heading);
    saved.team.forEach((mon, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${index === 0 ? "★ " : ""}${mon.name} · LV ${mon.level} · HP ${mon.hp} · ${mon.xp}/${xpToNext(mon.level)} EP`;
      button.addEventListener("click", () => {
        if (active) return;
        saved.team.splice(index, 1);
        saved.team.unshift(mon);
        save();
        updateProgress();
      });
      teamList.appendChild(button);
    });
  };
  updateProgress();
  window.addEventListener("420mon-save-changed", updateProgress);
  function portrait(host: HTMLElement, id: string) {
    const image = document.createElement("img");
    image.className = "dex-original-sprite"; image.src = spriteUrl(speciesById(id).sprite); image.alt = speciesById(id).name;
    host.replaceChildren(image);
  }
  const ownedChips = () => Object.keys(saved.inventory).filter(id => ITEMS[id]?.cat === "chip" && saved.inventory[id] >= 1);
  const chipsAvailable = () => [...(saved.balls > 0 ? ["legacy_capsule"] : []), ...ownedChips()];
  function updateBattle() {
    if (!active || !enemy || !fighter) return;
    const choosing = phase === "choose";
    get("monster-battle-kind").textContent = challenge === "nim" ? `NIM · DUELL ${duelCount - enemyQueue.length}/${duelCount}` : trainerAttempt ? `${trainerAttempt.trainer.label.toUpperCase()} · TRAINERKAMPF` : "LOWTOWN · WILDE BEGEGNUNG";
    get("monster-battle-title").textContent = choosing ? "DEIN NÄCHSTER ZUG" : phase === "win" ? "SIEG" : phase === "caught" ? "GEFANGEN" : "TEAM BESIEGT";
    get("monster-turn").textContent = `RUNDE ${turn}`;
    const mine = fighter.inst, foe = enemy.inst;
    get("monster-team-status").textContent = `${speciesById(mine.id).name} · LV ${mine.level} · ${mine.hp}/${mine.hpMax} HP`;
    get("monster-name").textContent = `${dexNum(foe.id)} ${active.species.name} · LV ${foe.level} · ${foe.hp}/${foe.hpMax} HP`;
    get("monster-hp-bar").style.width = `${100 * foe.hp / foe.hpMax}%`;
    get("monster-ally-hp-bar").style.width = `${100 * mine.hp / mine.hpMax}%`;
    get("monster-ally-detail").textContent = `${speciesById(mine.id).types.map(t => ELEMENT_LABEL[t]).join(" / ")} · WERT ${ivScore(mine.ivs)}${mine.status ? ` · ${statusName(mine.status)}` : ""}`;
    get("monster-enemy-detail").textContent = `${speciesById(foe.id).types.map(t => ELEMENT_LABEL[t]).join(" / ")}${foe.status ? ` · ${statusName(foe.status)}` : ""} · ${turnSpe(fighter) >= turnSpe(enemy) ? "Du bist schneller" : "Gegner ist schneller"}`;
    portrait(get("monster-ally-art"), mine.id); portrait(get("monster-enemy-art"), foe.id);
    get("monster-message").textContent = log.slice(-6).join("\n");
    get("monster-message").scrollTop = get("monster-message").scrollHeight;
    moveButtons.forEach((id, index) => {
      const button = get(id) as HTMLButtonElement;
      const moveId = mine.moves[index]; button.hidden = !moveId; button.disabled = !choosing;
      if (!moveId) return;
      const move = getMove(moveId), hint = matchupHint(move.type, speciesById(foe.id).types);
      button.style.setProperty("--move-color", ELEMENT_COLOR[move.type]);
      button.innerHTML = `<strong>${escape(move.name)}</strong><small>${escape(ELEMENT_LABEL[move.type])} · ${move.kind === "stat" ? "Status" : move.kind === "phys" ? "Physisch" : "Spezial"} · ${move.acc}%</small><span>${move.power ? `Stärke ${move.power} · ${hint.word}` : escape(move.desc)}</span>`;
      button.title = move.desc;
    });
    const options = chipsAvailable();
    if (!options.includes(selectedChip)) selectedChip = options[0] ?? "";
    const chipSelect = get("monster-chip") as HTMLSelectElement;
    chipSelect.innerHTML = options.map(id => `<option value="${id}">${escape(id === "legacy_capsule" ? `Standard-Kapsel ×${saved.balls}` : `${ITEMS[id].name} ×${saved.inventory[id]}`)}</option>`).join("");
    chipSelect.value = selectedChip; chipSelect.disabled = !choosing || !options.length;
    const chance = selectedChip ? catchChance(enemy, selectedChip === "legacy_capsule" ? "chip_junk" : selectedChip, battleCatchBoost(saved)) : 0;
    get("monster-chance").textContent = `${Math.round(chance * 100)}% Fangchance`;
    (get("monster-catch") as HTMLButtonElement).disabled = challenge === "nim" || !choosing || !options.length || foe.hp <= 0;
    get("monster-catch").textContent = challenge === "nim" ? "◉ KEIN FANG" : "◉ FANGEN";
    (get("monster-party") as HTMLButtonElement).disabled = !choosing || !saved.team.some(mon => mon !== ally && available(mon));
    (get("monster-items") as HTMLButtonElement).disabled = !choosing;
    get("monster-run").textContent = choosing ? "↩ FLIEHEN" : "✓ WEITER";
    get("monster-moves").hidden = !choosing; get("monster-catch-choice").hidden = !choosing || challenge === "nim";
    get("monster-battle-help").textContent = choosing ? challenge === "nim" ? "Nims Team bleibt bei Nim · Teamwechsel kostet einen Zug" : "Tempo bestimmt die Reihenfolge · Teamwechsel kostet einen Zug" : phase === "lose" ? challenge ? "Weiter: zurück zur Kapsel · −8 Softcash · Matratze zum Wiederbeleben benutzen." : "Besiegte Partner brauchen eine Matratze. Deine Pflanzen wachsen während des Kampfes weiter." : "Fortschritt gespeichert · Weiter zurück nach Lowtown";
  }
  function finish() {
    const lostChallenge = !!challenge && phase === "lose";
    if (trainerAttempt) settleTrainer(saved, trainerAttempt, phase === "choose" ? "flee" : phase);
    syncFighters();
    active = null;
    ally = null; fighter = null; enemy = null;
    trainerAttempt = null; challenge = null; enemyQueue = []; duelCount = 0;
    if (challengeMon) { monsterRoot.remove(challengeMon.mesh); disposeMonsterArt(challengeMon.mesh); challengeMon = null; }
    if (allyModel) { monsterRoot.remove(allyModel); disposeMonsterArt(allyModel); allyModel = null; }
    battle.hidden = true;
    cooldown = 1.5;
    updateProgress();
    if (lostChallenge) {
      saved.gold = Math.max(0, saved.gold - 8);
      world?.travel("capsule");
      notify("ZURÜCK AUF DER MATTE · −8 SOFTCASH. BENUTZE DIE MATRATZE ZUM WIEDERBELEBEN.");
    }
    save();
  }
  function spawnAlly() {
    if (allyModel) { monsterRoot.remove(allyModel); disposeMonsterArt(allyModel); }
    allyModel = null;
    if (!ally) return;
    const original = speciesById(ally.id ?? "mon_puffpuff");
    const color = new THREE.Color(ELEMENT_COLOR[original.types[0]]).getHex();
    const root = createMonsterArt(original.id, color);
    root.position.copy(player.position).add(new THREE.Vector3(1.5, 0, -1.5));
    monsterRoot.add(root);
    allyModel = root;
  }
  function begin(mon: WildMon, opening: string, wild = true) {
    ally = saved.team.find(available) ?? null;
    if (!ally) { notify("WÄHLE DEINEN STARTER ODER RUH DEIN TEAM AUF EINER MATRATZE AUS."); return false; }
    active = mon; fighter = toFighter(normalizePartnerForBattle(ally), false); enemy = toFighter(active.inst, wild);
    phase = "choose"; turn = 1; log.length = 0;
    addLog(opening, `${ally.name}, du bist dran.`);
    const seen = Array.isArray(saved.seen) ? saved.seen as string[] : []; if (!seen.includes(active.inst.id)) seen.push(active.inst.id); saved.seen = seen;
    collection.hidden = true; get("monster-party-list").hidden = true; get("monster-item-list").hidden = true;
    spawnAlly(); battle.hidden = false; encounterButton.hidden = true;
    save(); updateBattle(); get("monster-attack").focus?.();
    return true;
  }
  function start() {
    if (!nearest || active || cooldown > 0 || nearest.hp <= 0) return;
    begin(nearest, `Ein wildes ${nearest.species.name} taucht auf!`);
  }
  function challengeCreature(inst: BattleInstance) {
    const sp = speciesById(inst.id), tint = new THREE.Color(ELEMENT_COLOR[sp.types[0]]).getHex();
    const mesh = createMonsterArt(sp.id, tint);
    mesh.position.copy(player.position).add(new THREE.Vector3(-1.5, 0, -1.5)); monsterRoot.add(mesh);
    challengeMon = { inst, species: { id: sp.id, name: sp.name, color: tint, glow: tint, maxHp: inst.hpMax, catchRate: sp.catch / 255 }, mesh, hp: inst.hp, alive: true, phase: 0, level: inst.level, respawn: 0, pool: [], respawnAllowed: false };
    return challengeMon;
  }
  function startTrainer(mapId: string, id: string) {
    if (active || !world || world.current() !== mapId) return false;
    const attempt = createTrainerAttempt(saved, mapId, id);
    if (!attempt) { notify("HEUTE SCHON BESIEGT ODER KEIN STEHENDES TEAM. EINE MATRATZE HILFT."); return false; }
    const p = world.getMapInfo().player, o = attempt.trainer.obj;
    if (Math.hypot(Math.max(o.x-p.x,0,p.x-o.x-o.w),Math.max(o.y-p.y,0,p.y-o.y-o.h)) * world.getMapInfo().scale >= 1.9) return false;
    trainerAttempt = attempt; challenge = "trainer";
    return begin(challengeCreature(makeInst(attempt.trainer.mon, attempt.trainer.level)), `${attempt.trainer.label}: ${speciesById(attempt.trainer.mon).name} (Lv.${attempt.trainer.level}).`);
  }
  function startNim() {
    if (active || !world || world.current() !== saved.rivalMap) return false;
    const p = world.getMapInfo().player;
    if (Math.hypot(p.x - finite(saved.rivalX), p.y - finite(saved.rivalY)) >= 38) return false;
    const team = beginNimDuel(saved);
    if (!team.length) return false;
    challenge = "nim"; duelCount = team.length; enemyQueue = team.slice(1);
    const first = team[0];
    return begin(challengeCreature(first), `Nim: ${speciesById(first.id).name} (Lv.${first.level}). ${team.length} gegen dich.`, false);
  }
  function retireWild(mon: WildMon) {
    mon.alive = false;
    mon.mesh.visible = false;
    mon.respawn = 0;
    if (mon.spot && !saved.deadWild.includes(mon.spot)) saved.deadWild.push(mon.spot);
  }
  function resolveKnockout(): boolean {
    if (!enemy || !fighter || !active) return true;
    syncFighters();
    // A simultaneous poison KO rewards the victory without reviving the defeated partner.
    if (enemy.inst.hp <= 0) { if (!advanceDuel()) awardVictory(); return true; }
    if (fighter.inst.hp <= 0) {
      addLog(`${ally?.name ?? "Dein Partner"} ist besiegt.`);
      ally = saved.team.find(available) ?? null;
      if (!ally) { spawnAlly(); phase = "lose"; addLog("Dein Team ist am Ende. Eine Matratze bringt es wieder auf die Beine."); return true; }
      fighter = toFighter(normalizePartnerForBattle(ally), false);
      spawnAlly(); addLog(`${ally.name} übernimmt.`); return true;
    }
    return false;
  }
  function closeSubmenus() { get("monster-party-list").hidden = true; get("monster-item-list").hidden = true; }
  function commitTurn() {
    syncFighters(); turn++; save(); updateProgress(); updateBattle();
  }
  function statusRound() {
    if (!fighter || !enemy) return;
    addLog(...tickStatus(fighter).map(e => e.text), ...tickStatus(enemy).map(e => e.text));
    resolveKnockout();
  }
  function enemyTurn() {
    if (!fighter || !enemy || phase !== "choose") return;
    addLog(...execMove(enemy, fighter, pickEnemyMove(enemy)).map(e => e.text));
    if (!resolveKnockout()) statusRound();
  }
  function attack(index: number) {
    if (!active || !fighter || !enemy || phase !== "choose") return;
    const moveId = fighter.inst.moves[index]; if (!moveId) return;
    closeSubmenus();
    const enemyMove = pickEnemyMove(enemy);
    const first = turnSpe(fighter) >= turnSpe(enemy);
    const mine = () => addLog(...execMove(fighter!, enemy!, moveId).map(e => e.text));
    const theirs = () => addLog(...execMove(enemy!, fighter!, enemyMove).map(e => e.text));
    if (first) mine(); else theirs();
    if (!resolveKnockout()) {
      if (first) theirs(); else mine();
      if (!resolveKnockout()) statusRound();
    }
    commitTurn();
  }
  function capture() {
    if (!active || !enemy || challenge === "nim" || phase !== "choose" || enemy.inst.hp <= 0) return;
    const selected = (get("monster-chip") as HTMLSelectElement).value || selectedChip;
    if (!chipsAvailable().includes(selected)) return;
    closeSubmenus();
    if (selected === "legacy_capsule") saved.balls--; else saved.inventory[selected]--;
    saved.stats.chipsUsed = finite(saved.stats.chipsUsed) + 1;
    const chance = catchChance(enemy, selected === "legacy_capsule" ? "chip_junk" : selected, battleCatchBoost(saved));
    const chipName = selected === "legacy_capsule" ? "Standard-Kapsel" : ITEMS[selected].name;
    if (Math.random() < chance) {
      syncFighters(); saved.captures++;
      const caught: TeamMon = { ...enemy.inst, moves: [...enemy.inst.moves], ivs: { ...enemy.inst.ivs }, name: speciesById(enemy.inst.id).name };
      const intoTeam = saved.team.length < 6;
      if (intoTeam) saved.team.push(caught); else saved.box.push(caught);
      if (!saved.collection.includes(caught.id!)) saved.collection.push(caught.id!);
      saved.stats.monsCaught = Math.max(saved.captures, finite(saved.stats.monsCaught) + 1); grant("catch_1");
      retireWild(active); phase = "caught";
      addLog(`${caught.name} gefangen! Wert ${ivScore(enemy.inst.ivs)} · ${caught.hp} HP. ${intoTeam ? "Ins Team." : "Team voll – in die Box."}`);
      if (trainerAttempt) addLog(...settleTrainer(saved, trainerAttempt, "caught").lines);
    } else { addLog(`${chipName}: ausgebrochen!`); enemyTurn(); }
    commitTurn();
  }
  function showParty() {
    if (!active || phase !== "choose") return;
    get("monster-item-list").hidden = true;
    const host = get("monster-party-list"); host.hidden = !host.hidden; host.replaceChildren();
    saved.team.forEach(mon => {
      const button = document.createElement("button"); button.type = "button";
      button.textContent = `${mon.name} · LV ${mon.level} · ${mon.hp}/${maxHp(mon)} HP${mon === ally ? " · Aktiv" : ""}`;
      button.disabled = mon === ally || !available(mon);
      button.addEventListener("click", () => {
        if (phase !== "choose" || mon === ally || !available(mon)) return;
        syncFighters(); ally = mon; fighter = toFighter(normalizePartnerForBattle(mon), false);
        spawnAlly(); closeSubmenus(); addLog(`${mon.name} übernimmt.`); enemyTurn(); commitTurn();
      }); host.appendChild(button);
    });
  }
  function showItems() {
    if (!active || phase !== "choose") return;
    get("monster-party-list").hidden = true;
    const host = get("monster-item-list"); host.hidden = !host.hidden; host.replaceChildren();
    const items = Object.keys(saved.inventory).filter(id => saved.inventory[id] >= 1 && ["heal", "heal_all"].includes(ITEMS[id]?.use ?? ""));
    if (!items.length) { const empty = document.createElement("p"); empty.textContent = "Keine Heilitems im Inventar. Händler verkaufen Nachschub."; host.appendChild(empty); }
    for (const id of items) {
      const it = ITEMS[id], button = document.createElement("button"); button.type = "button"; button.textContent = `${it.name} ×${saved.inventory[id]} · ${it.desc}`;
      button.addEventListener("click", () => {
        if (phase !== "choose" || saved.inventory[id] < 1) return;
        syncFighters();
        const living = saved.team.filter(mon => mon.hp > 0 && mon.hp < maxHp(mon));
        const targets = it.use === "heal_all" ? living : living.sort((a, b) => (maxHp(b) - b.hp) - (maxHp(a) - a.hp)).slice(0, 1);
        if (!healLiving(targets, it.healPct ?? .45)) { addLog("Kein verletzter lebender Partner. Das Item bleibt erhalten."); updateBattle(); return; }
        saved.inventory[id]--;
        if (fighter && ally) fighter.inst.hp = ally.hp;
        closeSubmenus(); addLog(`${it.name}: ${targets.map(mon => mon.name).join(", ")} geheilt.`);
        // As in the original, healing items do not consume a combat turn.
        save(); updateBattle();
      }); host.appendChild(button);
    }
  }
  encounterButton.addEventListener("click", start);
  moveButtons.forEach((id, index) => get(id).addEventListener("click", () => attack(index)));
  get("monster-party").addEventListener("click", showParty);
  get("monster-items").addEventListener("click", showItems);
  get("monster-chip").addEventListener("change", () => { selectedChip = (get("monster-chip") as HTMLSelectElement).value; updateBattle(); });
  get("monster-catch").addEventListener("click", capture);
  get("monster-run").addEventListener("click", finish);
  get("monster-heal").addEventListener("click", () => {
    if (active) return;
    const healed = healLiving(saved.team);
    save(); updateProgress(); notify(healed ? "✚ LEBENDE PARTNER GEHEILT. BESIEGTE PARTNER BRAUCHEN EINE MATRATZE." : "KEIN LEBENDES MONSTER BENÖTIGT HEILUNG.");
  });
  get("monster-collection-toggle").addEventListener("click", () => { collection.hidden = !collection.hidden; });
  get("monster-collection-close").addEventListener("click", () => { collection.hidden = true; });
  window.addEventListener("keydown", e => {
    const target = e.target as HTMLElement | null;
    if (e.defaultPrevented || target?.closest("input,textarea,select,[contenteditable=true]")) return;
    if (document.querySelector(".systems-panel:not([hidden]),.grow-backdrop:not([hidden]),.home-dialog:not([hidden]),.fish-overlay:not([hidden]),.studio-panel.is-open")) return;
    if (e.code === "KeyE" && !e.repeat && !active) start();
  });
  return {
    startTrainer, startNim,
    get inBattle() { return active !== null; },
    refreshMap: () => changeMap(world?.current() ?? "alley"),
    update(dt: number) {
      time += dt;
      saved.playtime = Math.max(0, finite(saved.playtime)) + Math.max(0, dt);
      if (allyModel) allyModel.children[0].position.y = 0.82 + Math.sin(time * 3.5) * 0.09;
      if (challengeMon) challengeMon.mesh.children[0].position.y = 0.82 + Math.sin(time * 2.3) * 0.13;
      cooldown = Math.max(0, cooldown - dt);
      nearest = null;
      let best = 3.2 * 3.2;
      for (const mon of monsters) {
        if (!mon.alive) {
          if (mon === active) continue;
          if (!mon.respawnAllowed) continue;
          mon.respawn += dt;
          if (mon.respawn >= 90) {
            // A fresh wild individual enters the habitat; defeated team HP stays zero.
            const picked = pickEncounter(mon.pool);
            if (picked) {
              const original = speciesById(picked.id);
              const level = encounterLevel(picked);
              const color = new THREE.Color(ELEMENT_COLOR[original.types[0]]).getHex();
              mon.inst = makeInst(original.id, level);
              mon.species = { id: original.id, name: original.name, color, glow: color, maxHp: mon.inst.hpMax, catchRate: original.catch / 255 };
              mon.level = level; mon.respawn = 0; mon.alive = true; mon.hp = mon.species.maxHp; mon.mesh.visible = true;
              setMonsterArt(mon.mesh, original.id, color);
            }
          }
          continue;
        }
        mon.mesh.children[0].position.y = 0.82 + Math.sin(time * 2.3 + mon.phase) * 0.13;
        const distance = mon.mesh.position.distanceToSquared(player.position);
        if (distance < best) { best = distance; nearest = mon; }
      }
      encounterButton.hidden = !nearest || !!active || cooldown > 0;
      if (nearest && !active) encounterButton.textContent = `⚡ ${nearest.species.name} BEGEGNEN`;
    },
  };
}
