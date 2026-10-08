import { DEX, DEX_ORDER, encountersFor, speciesById, dexNum } from "./data/dex";
import { xpToNext, MAX_LEVEL } from "./data/progress";
import { ELEMENT_COLOR, typeMod } from "./data/types";
import { getMove } from "./data/moves";
import * as THREE from "three";

type Species = { id?: string; name: string; color: number; glow: number; maxHp: number; catchRate: number };
type WildMon = { species: Species; mesh: THREE.Group; hp: number; alive: boolean; phase: number; level: number; respawn: number };
const species: Species[] = [
  { name: "Neonix", color: 0x27efb7, glow: 0x00ffc8, maxHp: 35, catchRate: 0.55 },
  { name: "Voltling", color: 0xf9d44a, glow: 0xffc000, maxHp: 42, catchRate: 0.44 },
  { name: "Noctra", color: 0xb96bff, glow: 0x9944ff, maxHp: 50, catchRate: 0.35 },
  { name: "Pyrox", color: 0xff6e57, glow: 0xff4224, maxHp: 47, catchRate: 0.39 },
];
const positions: [number, number][] = [
  [11, -9], [-11, -10], [10, 11], [-12, 10], [22, 5], [-23, -4],
  [5, 23], [-7, -23], [28, 20], [-27, 22], [23, -27], [-25, -25],
];
type TeamMon = { id?: string; name: string; level: number; xp: number; hp: number };
const monsters: WildMon[] = [];
const saved = (() => {
  try {
    const data = JSON.parse(localStorage.getItem("420mon-progress-v1") || "{}");
    return {
      captures: Number.isFinite(data.captures) ? Math.max(0, data.captures) : 0,
      wins: Number.isFinite(data.wins) ? Math.max(0, data.wins) : 0,
      balls: Number.isFinite(data.balls) ? Math.max(0, data.balls) : 12,
      team: Array.isArray(data.team) ? data.team.filter((m: TeamMon) => m && (!!m.id && !!DEX[m.id] || species.some(s => s.name === m.name))).slice(0, 6)  .map((m: TeamMon) => ({ ...m, hp: Number.isFinite(m.hp) ? Math.max(0, m.hp) : 35 })) as TeamMon[] : [] as TeamMon[],
      collection: Array.isArray(data.collection) ? data.collection.filter((x: unknown) => typeof x === "string").slice(0, 420) as string[] : [] as string[],
      box: Array.isArray(data.box) ? data.box as TeamMon[] : [] as TeamMon[],
      gold: Number.isFinite(data.gold) ? data.gold as number : 150,
      inventory: data.inventory && typeof data.inventory === "object" ? data.inventory as Record<string, number> : {} as Record<string, number>,
    };
  } catch { return { captures: 0, wins: 0, balls: 12, team: [] as TeamMon[], collection: [] as string[], box: [] as TeamMon[], gold: 150, inventory: {} as Record<string, number> }; }
})();
function save() { const current = JSON.parse(localStorage.getItem("420mon-progress-v1") || "{}"); localStorage.setItem("420mon-progress-v1", JSON.stringify({ ...current, ...saved })); window.dispatchEvent(new Event("420mon-save-changed")); }
const monsterRoot = new THREE.Group();
export function createMonsterGame(scene: THREE.Scene, player: THREE.Group) {
  scene.add(monsterRoot);
  window.addEventListener("420mon-save-changed", () => { try { Object.assign(saved, JSON.parse(localStorage.getItem("420mon-progress-v1") || "{}")); } catch { /* Keep active save. */ } });
  const sphere = new THREE.SphereGeometry(0.54, 14, 12);
  const ear = new THREE.ConeGeometry(0.24, 0.65, 6);
  const eye = new THREE.SphereGeometry(0.085, 8, 6);
  const white = new THREE.MeshStandardMaterial({ color: 0xf6fbff, emissive: 0x18202b });
  const dark = new THREE.MeshStandardMaterial({ color: 0x08101b });
  for (let i = 0; i < positions.length; i++) {
    const original = encountersFor("alley")[(i * 7 + 3) % encountersFor("alley").length];
    const wildLevel = 2 + i % 5;
    const mon = speciesById(original.id);
    const tint = new THREE.Color(ELEMENT_COLOR[mon.types[0]]).getHex();
    const kind: Species = { id: mon.id, name: mon.name, color: tint, glow: tint, maxHp: Math.max(15, Math.round(mon.base.hp * (0.45 + wildLevel * 0.035))), catchRate: mon.catch / 255 };
    const root = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: kind.color, emissive: kind.glow, emissiveIntensity: 0.32, roughness: 0.45 });
    const body = new THREE.Mesh(sphere, mat);
    body.position.y = 0.76;
    body.scale.set(kind.name === "Noctra" ? 0.86 : 1, kind.name === "Voltling" ? 0.8 : 1.15, kind.name === "Pyrox" ? 1.24 : 1);
    body.castShadow = true;
    root.add(body);
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(ear, mat);
      horn.position.set(side * 0.32, 1.36, 0);
      horn.rotation.z = side * -0.24;
      horn.castShadow = true;
      root.add(horn);
      const pupil = new THREE.Mesh(eye, white);
      pupil.position.set(side * 0.2, 0.85, 0.47);
      root.add(pupil);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), dark);
      iris.position.set(side * 0.2, 0.85, 0.546);
      root.add(iris);
    }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.85, 7), mat);
    tail.position.set(0, 0.7, -0.65);
    tail.rotation.x = -Math.PI / 2.8;
    tail.castShadow = true;
    root.add(tail);
    if (kind.name === "Noctra") {
      const wings = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.07, 0.52), mat);
      wings.position.set(0, 0.88, -0.2);
      root.add(wings);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 6, 28), new THREE.MeshBasicMaterial({ color: kind.glow }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    root.add(ring);
    root.position.set(positions[i][0], 0, positions[i][1]);
    monsterRoot.add(root);
    monsters.push({ species: kind, mesh: root, hp: kind.maxHp, alive: true, phase: i * 0.9, level: wildLevel, respawn: 0 });
  }

  window.addEventListener("420mon-district-change", (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    const pool = encountersFor(id);
    if (!pool.length) return;
    active = null;
    if (allyModel) { monsterRoot.remove(allyModel); allyModel = null; }
    for (let i = 0; i < monsters.length; i++) {
      const wild = monsters[i];
      const picked = pool[(i * 7 + 3) % pool.length];
      const original = speciesById(picked.id);
      const lv = Math.max(2, Math.min(420, (id === "alley" ? 2 : 7 + DISTRICT_LEVEL(id)) + i % 5));
      const color = new THREE.Color(ELEMENT_COLOR[original.types[0]]).getHex();
      wild.species = { id: original.id, name: original.name, color, glow: color, maxHp: Math.max(15, Math.round(original.base.hp * (0.45 + lv * 0.035))), catchRate: original.catch / 255 };
      wild.level = lv; wild.hp = wild.species.maxHp; wild.alive = true; wild.respawn = 0;
      wild.mesh.visible = true;
      wild.mesh.position.set(player.position.x + positions[i][0], 0, player.position.z + positions[i][1]);
      const body = wild.mesh.children[0] as THREE.Mesh;
      (body.material as THREE.MeshStandardMaterial).color.setHex(color);
      (body.material as THREE.MeshStandardMaterial).emissive.setHex(color);
    }
  });
  function DISTRICT_LEVEL(id: string): number {
    const rank = ["alley","yard","cable","ash","drain","chem","ring","labyrinth","nische","scrap"].indexOf(id);
    return Math.max(0, rank) * 4;
  }
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
  const lead = () => ally ?? saved.team[0];
  function awardXp(amount: number) {
    const mon = lead();
    if (!mon) return;
    mon.xp += amount;
    while (mon.level < MAX_LEVEL && mon.xp >= xpToNext(mon.level)) {
      mon.xp -= xpToNext(mon.level);
      mon.level++;
    }
  }
  const updateProgress = () => {
    get("monster-count").textContent = `GEFANGEN ${saved.captures} · SIEGE ${saved.wins} · KAPSELN ${saved.balls}`;
    get("monster-quest").textContent = `DEX ${new Set(saved.collection).size}/${DEX_ORDER.length} · QUEST ${Math.min(3, saved.captures)}/3`;
    get("monster-list").textContent = saved.collection.length ? saved.collection.join(" · ") : "Noch keine Monster gefangen.";
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
    if (allyModel) { monsterRoot.remove(allyModel); allyModel = null; }
    battle.hidden = true;
    cooldown = 1.5;
    updateProgress();
    save();
  }
  function spawnAlly() {
    if (allyModel) monsterRoot.remove(allyModel);
    allyModel = null;
    if (!ally) return;
    const original = ally.id ? speciesById(ally.id) : null;
    const originalColor = original ? new THREE.Color(ELEMENT_COLOR[original.types[0]]).getHex() : 0x27efb7;
    const kind = original ? { id: original.id, name: original.name, color: originalColor, glow: originalColor, maxHp: 50, catchRate: original.catch / 255 } : species.find(s => s.name === ally!.name) ?? species[0];
    const root = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: kind.color, emissive: kind.glow, emissiveIntensity: 0.45 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat);
    body.position.y = 0.75;
    root.add(body);
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 7), mat);
      horn.position.set(side * 0.34, 1.35, 0);
      root.add(horn);
    }
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
      active.alive = false;
      active.mesh.visible = false;
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
      if (!ally) { notify("DEIN TEAM IST K. O. – HEILE DEINE MONSTER!"); finish(); return; }
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
      saved.collection.push(active.species.name);
      // Capturing does not reduce HP to zero: preserve the actual remaining HP.
      const caught: TeamMon = { id: active.species.id, name: active.species.name, level: active.level, xp: 0, hp: active.hp };
      if (saved.team.length < 6) saved.team.push(caught); else saved.box.push(caught);
      awardXp(8);
      if (saved.captures === 3) saved.balls += 5;
      notify(`✓ ${active.species.name} GEFANGEN! ${active.hp} HP verbleiben`);
      active.alive = false;
      active.mesh.visible = false;
      finish();
      return;
    }
    if (ally) {
      ally.hp = Math.max(0, ally.hp - 8);
      if (ally.hp === 0) {
        ally = saved.team.find(mon => mon.hp > 0) ?? null;
        if (!ally) { notify("DEIN TEAM IST K. O."); finish(); return; }
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
    saved.team.forEach(mon => { mon.hp = mon.id ? Math.max(15, Math.round(speciesById(mon.id).base.hp * (0.45 + mon.level * 0.035))) : species.find(s => s.name === mon.name)?.maxHp ?? 35; });
    save(); updateProgress(); notify("✚ DEIN TEAM IST GEHEILT!");
  });
  get("monster-collection-toggle").addEventListener("click", () => { collection.hidden = !collection.hidden; });
  get("monster-collection-close").addEventListener("click", () => { collection.hidden = true; });
  window.addEventListener("keydown", e => { if (e.code === "KeyE" && !e.repeat && !active) start(); });
  return {
    get inBattle() { return active !== null; },
    update(dt: number) {
      time += dt;
      if (allyModel) allyModel.children[0].position.y = 0.75 + Math.sin(time * 3.5) * 0.09;
      cooldown = Math.max(0, cooldown - dt);
      nearest = null;
      let best = 3.2 * 3.2;
      for (const mon of monsters) {
        if (!mon.alive) { mon.respawn += dt; if (mon.respawn >= 90) { mon.respawn = 0; mon.alive = true; mon.hp = mon.species.maxHp; mon.mesh.visible = true; } continue; }
        mon.mesh.children[0].position.y = 0.76 + Math.sin(time * 2.3 + mon.phase) * 0.13;
        mon.mesh.rotation.y += dt * 0.36;
        const distance = mon.mesh.position.distanceToSquared(player.position);
        if (distance < best) { best = distance; nearest = mon; }
      }
      encounterButton.hidden = !nearest || !!active || cooldown > 0;
      if (nearest && !active) encounterButton.textContent = `⚡ ${nearest.species.name} BEGEGNEN`;
    },
  };
}
