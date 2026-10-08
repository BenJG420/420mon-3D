import * as THREE from "three";

type Species = { name: string; color: number; glow: number; maxHp: number; catchRate: number };
type WildMon = { species: Species; mesh: THREE.Group; hp: number; alive: boolean; phase: number };
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
type TeamMon = { name: string; level: number; xp: number };
const monsters: WildMon[] = [];
const saved = (() => {
  try {
    const data = JSON.parse(localStorage.getItem("420mon-progress-v1") || "{}");
    return {
      captures: Number.isFinite(data.captures) ? Math.max(0, data.captures) : 0,
      wins: Number.isFinite(data.wins) ? Math.max(0, data.wins) : 0,
      balls: Number.isFinite(data.balls) ? Math.max(0, data.balls) : 12,
      team: Array.isArray(data.team) ? data.team.filter((m: TeamMon) => m && species.some(s => s.name === m.name)).slice(0, 6) as TeamMon[] : [] as TeamMon[],
      collection: Array.isArray(data.collection) ? data.collection.filter((x: unknown) => typeof x === "string").slice(0, 200) as string[] : [] as string[],
    };
  } catch { return { captures: 0, wins: 0, balls: 12, team: [] as TeamMon[], collection: [] as string[] }; }
})();
function save() { localStorage.setItem("420mon-progress-v1", JSON.stringify(saved)); }
const monsterRoot = new THREE.Group();
export function createMonsterGame(scene: THREE.Scene, player: THREE.Group) {
  scene.add(monsterRoot);
  const sphere = new THREE.SphereGeometry(0.54, 14, 12);
  const ear = new THREE.ConeGeometry(0.24, 0.65, 6);
  const eye = new THREE.SphereGeometry(0.085, 8, 6);
  const white = new THREE.MeshStandardMaterial({ color: 0xf6fbff, emissive: 0x18202b });
  const dark = new THREE.MeshStandardMaterial({ color: 0x08101b });
  for (let i = 0; i < positions.length; i++) {
    const kind = species[i % species.length];
    const root = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: kind.color, emissive: kind.glow, emissiveIntensity: 0.32, roughness: 0.45 });
    const body = new THREE.Mesh(sphere, mat);
    body.position.y = 0.76;
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
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 6, 28), new THREE.MeshBasicMaterial({ color: kind.glow }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    root.add(ring);
    root.position.set(positions[i][0], 0, positions[i][1]);
    monsterRoot.add(root);
    monsters.push({ species: kind, mesh: root, hp: kind.maxHp, alive: true, phase: i * 0.9 });
  }

  const ui = document.createElement("div");
  ui.className = "monster-ui";
  ui.innerHTML = `
    <div class="monster-progress"><strong>420MON // WILD ZONE</strong><div id="monster-count"></div><div id="monster-quest"></div></div>
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
  let heroHp = 100;
  let energy = 3;
  const lead = () => saved.team[0];
  function awardXp(amount: number) {
    const mon = lead();
    if (!mon) return;
    mon.xp += amount;
    while (mon.level < 50 && mon.xp >= mon.level * 20) {
      mon.xp -= mon.level * 20;
      mon.level++;
    }
  }
  const updateProgress = () => {
    get("monster-count").textContent = `GEFANGEN ${saved.captures} · SIEGE ${saved.wins} · KAPSELN ${saved.balls}`;
    get("monster-quest").textContent = saved.captures >= 3 ? "✓ QUEST: 3 MONSTER GEFANGEN" : `QUEST: FANGE 3 MONSTER (${Math.min(3, saved.captures)}/3)`;
    get("monster-list").textContent = saved.collection.length ? saved.collection.join(" · ") : "Noch keine Monster gefangen.";
  };
  updateProgress();
  const updateBattle = (message: string) => {
    if (!active) return;
    get("monster-name").textContent = `${active.species.name} · HP ${active.hp}/${active.species.maxHp} · DEINE HP ${heroHp}/100`;
    get("monster-hp-bar").style.width = `${100 * active.hp / active.species.maxHp}%`;
    get("monster-message").textContent = message;
    (get("monster-catch") as HTMLButtonElement).disabled = saved.balls <= 0;
  };
  function finish() {
    active = null;
    battle.hidden = true;
    cooldown = 1.5;
    updateProgress();
    save();
  }
  function start() {
    if (!nearest || active || cooldown > 0) return;
    active = nearest;
    heroHp = 100;
    battle.hidden = false;
    encounterButton.hidden = true;
    updateBattle("Wähle ANGRIFF, FANGEN oder FLIEHEN.");
  }
  function attack() {
    if (!active) return;
    active.hp = Math.max(0, active.hp - (10 + Math.floor(Math.random() * 13)));
    if (active.hp === 0) {
      active.alive = false;
      active.mesh.visible = false;
      saved.wins++;
      saved.balls += 2;
      get("monster-message").textContent = "SIEG! +1 KAMPF GEWONNEN";
      finish();
      return;
    }
    heroHp = Math.max(0, heroHp - (5 + Math.floor(Math.random() * 13)));
    if (heroHp === 0) { finish(); return; }
    updateBattle("Treffer! Das wilde Monster schlägt zurück.");
  }
  function capture() {
    if (!active || saved.balls <= 0) return;
    saved.balls--;
    const chance = Math.min(0.94, active.species.catchRate + (1 - active.hp / active.species.maxHp) * 0.55);
    if (Math.random() < chance) {
      saved.captures++;
      saved.collection.push(active.species.name);
      if (saved.captures === 3) saved.balls += 5;
      active.alive = false;
      active.mesh.visible = false;
      finish();
      return;
    }
    heroHp = Math.max(0, heroHp - 8);
    if (heroHp === 0) { finish(); return; }
    updateBattle("Ausgebrochen! Schwäche das Monster für bessere Fangchancen.");
    updateProgress();
    save();
  }
  encounterButton.addEventListener("click", start);
  get("monster-attack").addEventListener("click", attack);
  get("monster-catch").addEventListener("click", capture);
  get("monster-run").addEventListener("click", finish);
  get("monster-collection-toggle").addEventListener("click", () => { collection.hidden = !collection.hidden; });
  get("monster-collection-close").addEventListener("click", () => { collection.hidden = true; });
  window.addEventListener("keydown", e => { if (e.code === "KeyE" && !e.repeat && !active) start(); });
  return {
    get inBattle() { return active !== null; },
    update(dt: number) {
      time += dt;
      cooldown = Math.max(0, cooldown - dt);
      nearest = null;
      let best = 3.2 * 3.2;
      for (const mon of monsters) {
        if (!mon.alive) continue;
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
