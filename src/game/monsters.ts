import { DEX_ORDER, encountersFor, speciesById, dexNum, type EncMon } from "./data/dex";
import { xpToNext, MAX_LEVEL } from "./data/progress";
import { ELEMENT_COLOR, typeMod } from "./data/types";
import { getMove } from "./data/moves";
import * as THREE from "three";
import { getSave, saveProgress, healLiving, partnerUid, type Partner } from "./save";
import { createMonsterArt, setMonsterArt, disposeMonsterArt } from "./monster-art";
import type { DistrictTravel } from "./world";
import { legendByMon, windowOpen } from "./data/legend";

type Species = { id?: string; name: string; color: number; glow: number; maxHp: number; catchRate: number };
type WildMon = { species: Species; mesh: THREE.Group; hp: number; alive: boolean; phase: number; level: number; respawn: number; pool: EncMon[]; spot?: string; respawnAllowed: boolean };
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
    const tint = new THREE.Color(ELEMENT_COLOR[original.types[0]]).getHex();
    const kind: Species = { id: original.id, name: original.name, color: tint, glow: tint, maxHp: Math.max(15, Math.round(original.base.hp * (0.45 + wildLevel * 0.035))), catchRate: original.catch / 255 };
    const root = createMonsterArt(original.id, tint);
    root.position.set(x, 0, z);
    monsterRoot.add(root);
    monsters.push({ species: kind, mesh: root, hp: kind.maxHp, alive: true, phase: monsters.length * 0.9, level: wildLevel, respawn: 0, pool, spot, respawnAllowed: !spot });
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
      if (legendary && !windowOpen(legendary)) continue;
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
    <div class="monster-battle" id="monster-battle" hidden>
      <div class="monster-battle-title">⚡ WILDE BEGEGNUNG</div>
      <div id="monster-name"></div><div id="monster-team-status"></div>
      <div class="monster-hp"><div id="monster-hp-bar"></div></div>
      <div id="monster-message" aria-live="polite"></div>
      <div class="monster-actions">
        <button type="button" id="monster-attack">⚔ ATTACKE</button><button type="button" id="monster-special">✦ SPEZIAL</button>
        <button type="button" id="monster-catch">◉ FANGEN</button>
        <button type="button" id="monster-run">↩ FLIEHEN</button>
      </div>
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
  let energy = 3;
  const lead = () => ally ?? saved.team.find(mon => mon.hp > 0);
  function awardXp(amount: number) {
    const mon = lead();
    if (!mon || mon.hp <= 0) return;
    mon.xp += amount;
    while (mon.level < MAX_LEVEL && mon.xp >= xpToNext(mon.level)) {
      mon.xp -= xpToNext(mon.level);
      mon.level++;
    }
  }
  const updateProgress = () => {
    get("monster-count").textContent = `GEFANGEN ${saved.captures} · SIEGE ${saved.wins} · KAPSELN ${saved.balls}`;
    get("monster-quest").textContent = `DEX ${new Set(saved.collection).size}/${DEX_ORDER.length} · QUEST ${Math.min(3, saved.captures)}/3`;
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
  const updateBattle = (message: string) => {
    if (!active) return;
    get("monster-team-status").textContent = ally
      ? `DEIN ${ally!.name} · LV ${ally!.level} · HP ${ally!.hp} · ENERGIE ${energy}/3`
      : `KEIN KAMPFFÄHIGES MONSTER – NUR FANGEN`; 
    (get("monster-special") as HTMLButtonElement).disabled = energy < 2 || !ally;
    (get("monster-attack") as HTMLButtonElement).disabled = !ally;
    get("monster-name").textContent = `${active.species.id ? dexNum(active.species.id) : ""} ${active.species.name} · LV ${active.level} · HP ${active.hp}/${active.species.maxHp}`;
    get("monster-hp-bar").style.width = `${100 * active.hp / active.species.maxHp}%`;
    get("monster-message").textContent = message;
    (get("monster-catch") as HTMLButtonElement).disabled = saved.balls <= 0 || active.hp <= 0;
  };
  function finish() {
    active = null;
    ally = null;
    if (allyModel) { monsterRoot.remove(allyModel); disposeMonsterArt(allyModel); allyModel = null; }
    battle.hidden = true;
    cooldown = 1.5;
    updateProgress();
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
  function start() {
    if (!nearest || active || cooldown > 0) return;
    active = nearest;
    ally = saved.team.find(mon => mon.hp > 0) ?? null;
    spawnAlly();
    energy = 3;
    battle.hidden = false;
    encounterButton.hidden = true;
    updateBattle(ally ? `${ally.name}, ich wähle dich!` : "Fange dein erstes Monster mit einer Kapsel!");
  }
  function retireWild(mon: WildMon) {
    mon.alive = false;
    mon.mesh.visible = false;
    mon.respawn = 0;
    if (mon.spot && !saved.deadWild.includes(mon.spot)) saved.deadWild.push(mon.spot);
  }
  function attack(special = false) {
    if (!active || !ally) return;
    if (special && energy < 2) return;
    energy = special ? energy - 2 : Math.min(3, energy + 1);
    const attacker = ally.id ? speciesById(ally.id) : null;
    const move = getMove(attacker?.moves[special ? 1 : 0] ?? "move_tackle");
    const modifier = typeMod(move.type, active.species.id ? speciesById(active.species.id).types : ["normal"]);
    if (Math.random() * 100 >= move.acc) { updateBattle(move.name + " ging daneben!"); return; }
    const damage = move.power === 0 ? 0 : Math.max(1, Math.floor((move.power / 8 + ally.level * 0.7 + (attacker?.base.atk ?? 45) / 16) * modifier * (0.85 + Math.random() * 0.3)));
    active.hp = Math.max(0, active.hp - damage);
    if (active.hp === 0) {
      retireWild(active);
      saved.wins++;
      saved.gold += 15 + active.level * 2;
      awardXp(15);
      saved.balls += 2;
      notify("⚔ SIEG! +15 EP · +2 KAPSELN");
      finish();
      return;
    }
    ally.hp = Math.max(0, ally.hp - (5 + Math.floor(Math.random() * 13)));
    if (ally.hp === 0) {
      ally = saved.team.find(mon => mon.hp > 0) ?? null;
      if (!ally) { notify("DEIN TEAM IST BESIEGT – RUH DICH AUF EINER MATRATZE AUS!"); finish(); return; }
      spawnAlly();
      notify("MONSTERWECHSEL: " + ally.name);
    }
    save();
    updateBattle(`${ally?.name ?? "420mon"} nutzt ${move.name}! ${damage} Schaden${modifier >= 2 ? " · SEHR EFFEKTIV!" : modifier < 1 ? " · wenig effektiv" : ""}.`);
  }
  function capture() {
    if (!active || saved.balls <= 0 || active.hp <= 0) return;
    saved.balls--;
    const chance = Math.min(0.95, Math.max(0.04, ((3 * active.species.maxHp - 2 * active.hp) * (active.species.catchRate * 255)) / (3 * active.species.maxHp * 255)));
    if (Math.random() < chance) {
      saved.captures++;
      const speciesKey = active.species.id ?? active.species.name;
      if (!saved.collection.includes(speciesKey)) saved.collection.push(speciesKey);
      // Capturing does not reduce HP to zero: preserve the actual remaining HP.
      const caught: TeamMon = { uid: partnerUid(), id: active.species.id, name: active.species.name, level: active.level, xp: 0, hp: active.hp, hpMax: active.species.maxHp, moves: active.species.id ? speciesById(active.species.id).moves.slice(0, 4) : [] };
      if (saved.team.length < 6) saved.team.push(caught); else saved.box.push(caught);
      awardXp(8);
      if (saved.captures === 3) saved.balls += 5;
      notify(`✓ ${active.species.name} GEFANGEN! ${active.hp} HP verbleiben`);
      retireWild(active);
      finish();
      return;
    }
    if (ally) {
      ally.hp = Math.max(0, ally.hp - 8);
      if (ally.hp === 0) {
        ally = saved.team.find(mon => mon.hp > 0) ?? null;
        if (!ally) { notify("DEIN TEAM IST BESIEGT – DIE MATRATZE STELLT DEIN TEAM WIEDER HER."); finish(); return; }
        spawnAlly();
      }
    }
    updateBattle("Ausgebrochen! Schwäche das Monster für bessere Fangchancen.");
    updateProgress();
    save();
  }
  encounterButton.addEventListener("click", start);
  get("monster-attack").addEventListener("click", () => attack(false));
  get("monster-special").addEventListener("click", () => attack(true));
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
    if (document.querySelector(".systems-panel:not([hidden]),.grow-backdrop:not([hidden]),.home-dialog:not([hidden]),.studio-panel.is-open")) return;
    if (e.code === "KeyE" && !e.repeat && !active) start();
  });
  return {
    get inBattle() { return active !== null; },
    refreshMap: () => changeMap(world?.current() ?? "alley"),
    update(dt: number) {
      time += dt;
      if (allyModel) allyModel.children[0].position.y = 0.82 + Math.sin(time * 3.5) * 0.09;
      cooldown = Math.max(0, cooldown - dt);
      nearest = null;
      let best = 3.2 * 3.2;
      for (const mon of monsters) {
        if (!mon.alive) {
          if (!mon.respawnAllowed) continue;
          mon.respawn += dt;
          if (mon.respawn >= 90) {
            // A fresh wild individual enters the habitat; defeated team HP stays zero.
            const picked = pickEncounter(mon.pool);
            if (picked) {
              const original = speciesById(picked.id);
              const level = encounterLevel(picked);
              const color = new THREE.Color(ELEMENT_COLOR[original.types[0]]).getHex();
              mon.species = { id: original.id, name: original.name, color, glow: color, maxHp: Math.max(15, Math.round(original.base.hp * (0.45 + level * 0.035))), catchRate: original.catch / 255 };
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
