import * as THREE from "three";
import { BOX_UNLOCK, GROW_SLOTS, ITEMS, POT_UNLOCK, STALL_GROW, STRAIN_LABEL, isGrowBox, strainOfItem } from "./data/items";
import { formatGrowLeft, potYieldRaw, strainGrowBase, wallLeft } from "./data/grow";
import { advanceGrow, buyGrowItem, buyNextSlot, ensureGrowState, growRemaining, harvestPot, plantPot, recordGrowCare, growCareBonus, previewGrowHarvest, sellGrowBud, sleepGrow, slotOpen } from "./grow-state";
import { getSave, saveProgress, type GrowPot } from "./save";
import "./grow.css";

type GrowWorld = {
  current(): string;
  getRoot(): THREE.Group;
  getMapInfo(): { id: string; w: number; h: number };
  toWorld(x: number, y: number): THREE.Vector3;
};
type PlantVisual = { index: number; group: THREE.Group; crown: THREE.Group; halo: THREE.Mesh; drop: THREE.Group };
const phaseLabel = { empty: "Leer", sprout: "Keimling", grow: "Wachstum", bloom: "Blüte", ready: "Erntebereit" };
const potName = (i: number) => isGrowBox(i) ? `Growbox ${i - 5}` : `Topf ${i + 1}`;
const safe = (v: string) => v.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Original Grow rules with growing 3D plants and an optional watering rhythm game. */
export function createGrowSystem(world: GrowWorld) {
  const state = getSave();
  ensureGrowState(state);
  const offline = advanceGrow(state);
  saveProgress();
  const host = document.createElement("div");
  host.className = "grow-root";
  host.innerHTML = `<button class="grow-shortcut" aria-label="Grow in der Kapsel öffnen">♧ <span>GROW</span></button>
    <div class="grow-backdrop" hidden><section class="grow-panel" role="dialog" aria-modal="true" aria-labelledby="grow-heading" tabindex="-1">
    <header class="grow-header"><div><span class="grow-eyebrow">DEIN KELLERGARTEN</span><h2 id="grow-heading">Kapsel · Grow</h2></div><button class="grow-close" aria-label="Grow schließen">✕</button></header>
    <nav class="grow-tabs" aria-label="Grow Bereich"><button data-tab="plants">Pflanzen</button><button data-tab="shop">Grow-Shop</button></nav>
    <div class="grow-content"></div><footer class="grow-footer" role="status" aria-live="polite"></footer></section></div>`;
  document.querySelector("#app")!.append(host);
  const backdrop = host.querySelector<HTMLElement>(".grow-backdrop")!;
  const panel = host.querySelector<HTMLElement>(".grow-panel")!;
  const content = host.querySelector<HTMLElement>(".grow-content")!;
  const footer = host.querySelector<HTMLElement>(".grow-footer")!;
  const shortcut = host.querySelector<HTMLButtonElement>(".grow-shortcut")!;
  let selected = 0, tab = "plants", shopAccess = false, lastTick = Date.now(), lastSave = Date.now(), ownSave = false;
  let lastFocus: HTMLElement | null = null;
  let seedSelection = "", fertSelection = "";
  let care: { round: number; hits: number; started: number; target: number; position: number } | null = null;
  let splashIndex = -1, splashUntil = 0;
  const plants = new THREE.Group(); plants.name = "original-grow-plants";
  const visuals: PlantVisual[] = [];
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x43a259, roughness: .65, side: THREE.DoubleSide });
  const newLeafMat = new THREE.MeshStandardMaterial({ color: 0x82c864, roughness: .62, side: THREE.DoubleSide });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x6b8749, roughness: .8 });
  const budMat = new THREE.MeshStandardMaterial({ color: 0xc29d7b, emissive: 0x472648, emissiveIntensity: .14, roughness: .85 });
  const dropMat = new THREE.MeshStandardMaterial({ color: 0x68dded, emissive: 0x34a9c6, transparent: true, opacity: .75, roughness: .12 });
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0); leafShape.lineTo(-.045, .1); leafShape.lineTo(-.09, .17); leafShape.lineTo(-.065, .2); leafShape.lineTo(-.12, .3); leafShape.lineTo(-.085, .34); leafShape.lineTo(-.1, .42); leafShape.lineTo(0, .7); leafShape.lineTo(.1, .42); leafShape.lineTo(.085, .34); leafShape.lineTo(.12, .3); leafShape.lineTo(.065, .2); leafShape.lineTo(.09, .17); leafShape.lineTo(.045, .1); leafShape.closePath();
  const leafGeometry = new THREE.ShapeGeometry(leafShape);
  const stemGeometry = new THREE.CylinderGeometry(.026, .04, 1.45, 6);
  const budGeometry = new THREE.IcosahedronGeometry(.14, 1);
  const dropGeometry = new THREE.SphereGeometry(.035, 6, 5);
  const haloGeometry = new THREE.RingGeometry(.48, .53, 32);
  const haloMaterial = new THREE.MeshBasicMaterial({ color: 0xd7df98, transparent: true, opacity: .7, side: THREE.DoubleSide });

  function note(message: string) { footer.textContent = message; }
  function persist() { ownSave = true; saveProgress(); ownSave = false; lastSave = Date.now(); }
  function sync() { ensureGrowState(state); advanceGrow(state); }
  function progress(p: GrowPot) { return p.phase === "empty" ? 0 : Math.max(0, Math.min(1, 1 - p.timeLeft / Math.max(1, p.total))); }

  function buildPlant(index: number): PlantVisual {
    const group = new THREE.Group(), crown = new THREE.Group(), drop = new THREE.Group();
    const coords = isGrowBox(index) ? [60 + 28 * (index - 6), 158] : [77 + 22 * index, 34];
    group.position.copy(world.toWorld(coords[0], coords[1]));
    crown.position.y = isGrowBox(index) ? .43 : .58;
    const stem = new THREE.Mesh(stemGeometry, stemMat); stem.position.y = .72; stem.castShadow = true; crown.add(stem);
    const grownLeaves: THREE.Matrix4[] = [], newLeaves: THREE.Matrix4[] = [], buds: THREE.Matrix4[] = [];
    for (let level = 0; level < 4; level++) for (let side = 0; side < 3; side++) {
      const branch = new THREE.Object3D(); branch.position.y = .28 + level * .29; branch.rotation.y = side * Math.PI * 2 / 3 + level * .7;
      branch.rotation.x = -.65;
      branch.updateMatrix();
      for (let finger = -2; finger <= 2; finger++) {
        const leaf = new THREE.Object3D();
        leaf.rotation.z = finger * .33;
        const scale = (1 - Math.abs(finger) * .13) * (1 - level * .12);
        leaf.scale.setScalar(scale); leaf.updateMatrix();
        (level === 3 ? newLeaves : grownLeaves).push(new THREE.Matrix4().multiplyMatrices(branch.matrix, leaf.matrix));
      }
      const bud = new THREE.Object3D();
      bud.position.set(Math.sin(branch.rotation.y) * .10, .38 + level * .29, Math.cos(branch.rotation.y) * .10);
      bud.scale.set(.72, 1.8, .72); bud.updateMatrix(); buds.push(bud.matrix.clone());
    }
    for (const [mat, matrices] of [[leafMat, grownLeaves], [newLeafMat, newLeaves], [budMat, buds]] as const) {
      const mesh = new THREE.InstancedMesh(mat === budMat ? budGeometry : leafGeometry, mat, matrices.length);
      matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
      mesh.castShadow = true; mesh.userData.bud = mat === budMat; crown.add(mesh);
    }
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.rotation.x = -Math.PI / 2; halo.position.y = .03;
    for (let i = 0; i < 14; i++) {
      const d = new THREE.Mesh(dropGeometry, dropMat); d.scale.y = 1.7; d.userData.phase = i / 14; drop.add(d);
    }
    group.add(crown, halo, drop); plants.add(group);
    return { index, group, crown, halo, drop };
  }
  function rebuild() {
    plants.removeFromParent();
    plants.traverse(o => { if (o instanceof THREE.InstancedMesh) o.dispose(); });
    plants.clear(); visuals.length = 0;
    if (world.current() === "capsule") {
      world.getRoot().add(plants);
      for (let i = 0; i < state.pots.length; i++) visuals.push(buildPlant(i));
    }
    shortcut.hidden = world.current() !== "capsule";
  }

  function renderPlants() {
    const pot = state.pots[selected];
    const available = Object.keys(state.inventory).filter(id => ITEMS[id]?.cat === "seed" && state.inventory[id] > 0);
    if (!available.includes(seedSelection)) seedSelection = available[0] ?? "";
    if (!(state.inventory[fertSelection] > 0)) fertSelection = "";
    const strain = strainOfItem(pot.seed || seedSelection);
    const rawYield = potYieldRaw(pot.phase === "empty" ? { seed: seedSelection, fert: fertSelection } : pot, isGrowBox(selected));
    const result = previewGrowHarvest(state, selected) ?? { ...rawYield, baseBuds: rawYield.buds, careBonusPercent: 0 };
    const bonus = Math.round(growCareBonus(pot) * 100);
    const extraBuds = result.buds - result.baseBuds;
    const unlocked = slotOpen(state, selected);
    content.innerHTML = `<div class="grow-summary"><span><b>${state.potsUnlocked}</b>/6 Töpfe · <b>${state.boxesUnlocked}</b>/6 Boxen</span><span>${state.gold} <small>SOFTCASH</small></span></div>
      <div class="grow-layout"><div class="grow-pot-grid" aria-label="Pflanzplätze">${state.pots.map((p, i) => `<button class="grow-pot ${i === selected ? "selected" : ""} ${p.phase === "ready" ? "ready" : ""} ${!slotOpen(state, i) ? "locked" : ""}" data-pot="${i}" aria-pressed="${i === selected}"><span class="grow-pot-icon">${!slotOpen(state, i) ? "♧" : p.phase === "empty" ? "♧" : p.phase === "ready" ? "✦" : "❧"}</span><b>${potName(i)}</b><small>${!slotOpen(state, i) ? "Gesperrt" : phaseLabel[p.phase]}</small><span class="grow-mini-progress"><i style="width:${progress(p) * 100}%" data-progress="${i}"></i></span></button>`).join("")}</div>
      <article class="grow-details"><div class="grow-detail-heading"><span class="grow-eyebrow">${isGrowBox(selected) ? "DOPPELTER GRUNDERTRAG" : "HANDGEMACHT IN LOWTOWN"}</span><h3>${potName(selected)}</h3></div>
      <div class="grow-plant-art ${pot.phase}"><div class="grow-illustrated-plant"><span>❧</span><span>❧</span><span>❧</span></div><div class="grow-illustrated-pot"></div><span class="grow-stage-tag">${unlocked ? phaseLabel[pot.phase] : "Noch verschlossen"}</span></div>
      ${!unlocked ? `<p>Mehr Platz für deine nächsten Cuts. Neue Plätze schaltest du beim Grow-Händler auf dem Markt frei.</p>${shopAccess ? '<button class="grow-primary" data-action="shop">Plätze freischalten</button>' : ''}` : pot.phase === "empty" ? `<label class="grow-field">Samen<select id="grow-seed" ${!available.length ? "disabled" : ""}>${available.length ? available.map(id => `<option value="${safe(id)}" ${id === seedSelection ? "selected" : ""}>${safe(ITEMS[id].name)} · ${state.inventory[id]}×</option>`).join("") : '<option>Keine Samen im Inventar</option>'}</select></label>
      <label class="grow-field">Dünger <small>optional</small><select id="grow-fert"><option value="">Ohne Dünger</option>${Object.keys(state.inventory).filter(id => ITEMS[id]?.cat === "fert" && state.inventory[id] > 0).map(id => `<option value="${safe(id)}" ${id === fertSelection ? "selected" : ""}>${safe(ITEMS[id].name)} · ${state.inventory[id]}×</option>`).join("")}</select></label>
      <div class="grow-facts"><span>${strain ? STRAIN_LABEL[strain.kind] : "—"}</span><span>${seedSelection ? formatGrowLeft(wallLeft(strainGrowBase(seedSelection), fertSelection, false, state.schnittTitle, state.eddiIn)) : "—"}</span><span>${result.buds} Buds${extraBuds ? ` · +${extraBuds} Pflege` : ""}</span></div><button class="grow-primary" data-action="plant" ${!available.length ? "disabled" : ""}>Samen einpflanzen</button>${shopAccess ? '<button class="grow-secondary" data-action="shop">Samen & Dünger kaufen</button>' : '<small class="grow-care-info">Samen und Dünger bekommst du beim Grow-Händler auf dem Markt.</small>'}` : `<h4>${safe(strain?.seedName ?? ITEMS[pot.seed]?.name ?? "Pflanze")}</h4><div class="grow-facts"><span>${strain ? STRAIN_LABEL[strain.kind] : "Hybrid"}</span><span>${result.buds} Buds${extraBuds ? ` · +${extraBuds} Pflege` : ""}</span><span>${pot.fert ? safe(ITEMS[pot.fert].name) : "Ohne Dünger"}</span></div>
      <div class="grow-bonus-card" data-care-bonus><span class="grow-eyebrow">PFLEGE LOHNT SICH</span><b>${bonus ? `−${bonus}% Restzeit · +${bonus}% Ertrag` : "Guter Rhythmus, größere Ernte"}</b><div class="grow-bonus-levels">${[1,2,3].map(n => `<span class="${(pot.careRewardHits ?? 0) >= n ? "earned" : ""}"><strong>${n}/3</strong> −${n * 10}% Zeit<br>+${n * 10}% Ertrag</span>`).join("")}</div><small>Dein bester Durchgang zählt für diese Pflanze. Bonus-Buds werden aufgerundet. Ein besseres Ergebnis verbessert den Bonus.</small></div>
      <div class="grow-progress"><i data-progress="${selected}" style="width:${progress(pot) * 100}%"></i></div><p class="grow-countdown" data-timer="${selected}">${pot.phase === "ready" ? "Die Schere wartet. Deine Pflanze ist reif." : `Noch ${formatGrowLeft(growRemaining(state, pot))} bis zur Ernte.`}</p>
      ${pot.phase === "ready" ? '<button class="grow-primary" data-action="harvest">✂ Jetzt ernten</button>' : `<button class="grow-primary" data-action="care">◉ Gieß-Rhythmus spielen</button><small class="grow-care-info">Freiwillige Pflege · ${pot.careRewardHits ? `Bonus: ${pot.careRewardHits}/3 Treffer · ` : ""}Wachstum läuft auch ohne Minispiel weiter.</small>`}`}
      </article></div><p class="grow-original-note">Keimling → Wachstum → Blüte → Ernte. Deine Pflanzen wachsen auch offline. Eine Pause auf der Matratze zieht 30 Minuten Grow-Zeit ab und stellt dein Team wieder her.</p>`;
    content.querySelectorAll<HTMLButtonElement>("[data-pot]").forEach(b => b.onclick = () => { selected = Number(b.dataset.pot); care = null; render(); });
    content.querySelector<HTMLSelectElement>("#grow-seed")?.addEventListener("change", e => { seedSelection = (e.target as HTMLSelectElement).value; render(); });
    content.querySelector<HTMLSelectElement>("#grow-fert")?.addEventListener("change", e => { fertSelection = (e.target as HTMLSelectElement).value; render(); });
    content.querySelector<HTMLButtonElement>('[data-action="shop"]')?.addEventListener("click", () => { if (shopAccess) { tab = "shop"; render(); } });
    content.querySelector<HTMLButtonElement>('[data-action="plant"]')?.addEventListener("click", () => {
      const plantedSeed = seedSelection;
      sync(); const planted = plantPot(state, selected, plantedSeed, fertSelection);
      if (!planted.ok) { note(planted.reason ?? "Pflanzen nicht möglich."); return; }
      persist(); render(); note(`${ITEMS[plantedSeed].name} eingepflanzt. +${planted.xp} XP. Dein Grow läuft.`);
    });
    content.querySelector<HTMLButtonElement>('[data-action="harvest"]')?.addEventListener("click", () => {
      sync(); const harvested = harvestPot(state, selected); if (!harvested.ok) return;
      persist(); render(); note(`Ernte: ${harvested.buds}× ${ITEMS[harvested.budId!].name}. +${harvested.xp} XP.${harvested.seedReturned ? " Ein Samen ist zurück im Inventar." : ""}`);
    });
    content.querySelector<HTMLButtonElement>('[data-action="care"]')?.addEventListener("click", startCare);
  }

  function renderShop() {
    const nextPot = POT_UNLOCK.find(p => p.slot === state.potsUnlocked + 1);
    const nextBox = BOX_UNLOCK.find(p => p.slot === state.boxesUnlocked + 1);
    const buds = Object.keys(state.inventory).filter(id => ITEMS[id]?.cat === "bud" && state.inventory[id] > 0);
    content.innerHTML = `<div class="grow-summary"><span>Indica beißt · Sativa läuft · Hybrid würfelt</span><span>${state.gold} <small>SOFTCASH</small></span></div>
      <div class="grow-upgrades">${[{ def: nextPot, box: false }, { def: nextBox, box: true }].map(({ def, box }) => `<article><span class="grow-eyebrow">${box ? "GROWBOXEN" : "TÖPFE"}</span><h3>${safe(def?.name ?? "Alle Plätze offen")}</h3><p>${safe(def?.blurb ?? "Deine Kapsel ist komplett ausgebaut.")}</p>${def ? `<button class="grow-primary" data-unlock="${box}" ${state.gold < def.price ? "disabled" : ""}>Freischalten · ${def.price}</button>` : ""}</article>`).join("")}</div>
      <h3 class="grow-shop-heading">Samen & Nährstoffe</h3><div class="grow-shop-list">${STALL_GROW.map(id => { const it = ITEMS[id]; const strain = strainOfItem(id); return `<article><div><b>${safe(it.name)}</b><small>${strain ? `${STRAIN_LABEL[strain.kind]} · ${formatGrowLeft(strainGrowBase(id))} · ${it.yieldN} Buds` : safe(it.desc)}</small><small>Im Inventar: ${state.inventory[id] ?? 0}</small></div><button data-buy="${safe(id)}" ${state.gold < it.buy! ? "disabled" : ""}>${it.buy} <span>+ Kaufen</span></button></article>`; }).join("")}</div>
      ${buds.length ? `<h3 class="grow-shop-heading">Deine Ernte verkaufen</h3><div class="grow-shop-list">${buds.map(id => `<article><div><b>${safe(ITEMS[id].name)}</b><small>${state.inventory[id]}× im Inventar</small></div><button data-sell="${safe(id)}">+${Math.max(1, Math.round(ITEMS[id].sell! * .95))} <span>1× verkaufen</span></button></article>`).join("")}</div>` : ""}`;
    content.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach(b => b.onclick = () => { const id = b.dataset.buy!; if (buyGrowItem(state, id)) { persist(); render(); note(`${ITEMS[id].name} gekauft.`); } });
    content.querySelectorAll<HTMLButtonElement>("[data-sell]").forEach(b => b.onclick = () => { const id = b.dataset.sell!, earned = sellGrowBud(state, id); if (earned) { persist(); render(); note(`1× ${ITEMS[id].name} verkauft. +${earned} Softcash.`); } });
    content.querySelectorAll<HTMLButtonElement>("[data-unlock]").forEach(b => b.onclick = () => { const box = b.dataset.unlock === "true"; if (buyNextSlot(state, box)) { persist(); render(); note(`${box ? "Growbox" : "Topf"} freigeschaltet. Der neue Platz wartet in der Kapsel.`); } });
  }

  function startCare() {
    sync();
    if (["empty", "ready"].includes(state.pots[selected].phase)) { render(); return; }
    care = { round: 0, hits: 0, started: performance.now(), target: .35 + Math.random() * .3, position: 1 }; render();
  }
  const markerPosition = (now: number) => care ? Math.abs(1 - ((now - care.started) / 950) % 2) : 0;
  function tapWater() {
    if (!care) return;
    // Score the position actually shown to the player, even on a slow device.
    if (Math.abs(care.position - care.target) <= .12) care.hits++;
    splashIndex = selected; splashUntil = performance.now() + 3200;
    care.round++;
    if (care.round >= 3) {
      const hits = care.hits;
      sync();
      const pot = state.pots[selected], previous = growCareBonus(pot), before = growRemaining(state, pot);
      const applied = recordGrowCare(state, selected, hits, true);
      const bonus = Math.round(growCareBonus(pot) * 100);
      const saved = Math.max(0, before - growRemaining(state, pot));
      care = null; persist(); render();
      if (!applied) note("Deine Pflanze ist bereits erntereif. Der bisherige Bonus bleibt erhalten.");
      else if (growCareBonus(pot) > previous) note(`${hits}/3 Treffer! +${bonus}% Ertrag.${saved > 0 ? ` ${formatGrowLeft(saved)} Zeit gespart (−${bonus}% Restzeit).` : " Deine Pflanze ist inzwischen erntereif; dein Ertragsbonus zählt."}`);
      else if (bonus) note(`${hits}/3 Treffer · Dein bester Bonus bleibt: −${bonus}% Restzeit und +${bonus}% Ertrag.`);
      else note("0/3 Treffer · Versuch es noch einmal: Jeder Treffer verkürzt die Zeit und bringt mehr Ertrag.");
    } else { care.started = performance.now(); care.target = .3 + Math.random() * .4; care.position = 1; render(); }
  }
  function renderCare() {
    if (!care) return;
    content.innerHTML = `<div class="grow-minigame"><span class="grow-eyebrow">PFLEGE · ${potName(selected).toUpperCase()}</span><h3>Ein Tropfen im richtigen Takt.</h3><p>Triff das helle Feld mit dem Zeiger. Tippen, Leertaste oder Enter.</p><div class="grow-care-plant">❧<span class="grow-care-drop">●</span></div><div class="grow-rhythm" role="progressbar" aria-label="Gieß-Rhythmus"><div class="grow-target" style="left:${(care.target - .12) * 100}%;width:24%"></div><div class="grow-marker"></div></div><div class="grow-rounds">${[0, 1, 2].map(i => `<i class="${i < care!.round ? "done" : ""}">${i < care!.round ? "✓" : "○"}</i>`).join("")}<span>${care.hits} Treffer</span></div><button class="grow-primary grow-water" data-water>◉ Jetzt gießen</button><button class="grow-secondary" data-back>Zur Pflanze</button><small>Jeder Treffer: 10% kürzere Restzeit und 10% mehr Ertrag. Maximal 30% pro Pflanze. Wiederholen verbessert nur deinen besten Bonus.</small></div>`;
    content.querySelector<HTMLButtonElement>("[data-water]")!.onclick = tapWater;
    content.querySelector<HTMLElement>(".grow-marker")!.style.left = `${care.position * 100}%`;
    content.querySelector<HTMLButtonElement>("[data-back]")!.onclick = () => { care = null; render(); };
    content.querySelector<HTMLButtonElement>("[data-water]")!.focus();
  }

  function render() {
    host.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach(b => { b.classList.toggle("selected", b.dataset.tab === tab); b.hidden = b.dataset.tab === "shop" ? !shopAccess : world.current() !== "capsule"; });
    if (care) renderCare(); else if (tab === "shop") renderShop(); else renderPlants();
  }
  function open(index = 0, allowShop = false) {
    if (!allowShop && world.current() !== "capsule") return;
    shopAccess = allowShop;
    selected = Number.isFinite(index) ? Math.max(0, Math.min(GROW_SLOTS - 1, Math.floor(index))) : 0; tab = "plants"; care = null;
    sync(); lastFocus = document.activeElement as HTMLElement;
    backdrop.hidden = false; render(); panel.focus();
    note(offline >= 25 ? `Deine Pflanzen sind ${formatGrowLeft(offline)} offline weitergewachsen.` : "Samen rein. Zeit geben. Schneiden. Dein eigener Grow in Lowtown.");
  }
  function close() { backdrop.hidden = true; care = null; shopAccess = false; persist(); lastFocus?.focus(); }
  host.querySelector<HTMLButtonElement>(".grow-close")!.onclick = close;
  shortcut.onclick = () => open();
  backdrop.addEventListener("click", e => { if (e.target === backdrop) close(); });
  host.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach(b => b.onclick = () => { if (b.dataset.tab === "shop" && !shopAccess) return; tab = b.dataset.tab!; care = null; render(); });
  window.addEventListener("keydown", e => {
    if (backdrop.hidden) return;
    if (e.code === "Escape") { e.preventDefault(); close(); return; }
    const focusedButton = e.target instanceof Element ? e.target.closest("button") : null;
    if (care && (e.code === "Space" || e.code === "Enter") && (!focusedButton || focusedButton.hasAttribute("data-water"))) {
      e.preventDefault(); if (!e.repeat) tapWater(); return;
    }
    if (e.key === "Tab") {
      const buttons = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled])'));
      const first = buttons[0], last = buttons.at(-1);
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  });
  window.addEventListener("420mon-map-change", () => { rebuild(); if (!backdrop.hidden) close(); });
  window.addEventListener("420mon-save-changed", () => { if (!ownSave) { ensureGrowState(state); if (!backdrop.hidden && !care) render(); } });
  window.addEventListener("pagehide", () => { advanceGrow(state); persist(); });
  document.addEventListener("visibilitychange", () => { advanceGrow(state); persist(); if (!backdrop.hidden && !care) render(); });
  rebuild();

  return {
    open,
    close,
    openShop() { open(0, true); tab = "shop"; render(); note("Grow-Shop · Originalsorten, Preise und Erweiterungen."); },
    sleep() { sync(); sleepGrow(state); persist(); if (!backdrop.hidden) render(); },
    isOpen: () => !backdrop.hidden,
    update(_dt: number, time = performance.now() / 1000) {
      const now = Date.now();
      if (now - lastTick >= 500) {
        const oldPhases = state.pots.map(p => p.phase).join(); advanceGrow(state); lastTick = now;
        if (state.pots.map(p => p.phase).join() !== oldPhases && !backdrop.hidden && !care) render();
        if (!backdrop.hidden && !care && tab === "plants") {
          content.querySelectorAll<HTMLElement>("[data-progress]").forEach(el => { el.style.width = `${progress(state.pots[Number(el.dataset.progress)]) * 100}%`; });
          content.querySelectorAll<HTMLElement>("[data-timer]").forEach(el => { const p = state.pots[Number(el.dataset.timer)]; el.textContent = p.phase === "ready" ? "Die Schere wartet. Deine Pflanze ist reif." : `Noch ${formatGrowLeft(growRemaining(state, p))} bis zur Ernte.`; });
        }
        if (now - lastSave >= 10000) persist();
      }
      if (care) {
        care.position = markerPosition(performance.now());
        content.querySelector<HTMLElement>(".grow-marker")!.style.left = `${care.position * 100}%`;
      }
      for (const v of visuals) {
        const p = state.pots[v.index], fraction = progress(p);
        v.group.visible = slotOpen(state, v.index) && p.phase !== "empty";
        const scale = (.17 + fraction * .83) * (isGrowBox(v.index) ? 1.18 : 1);
        v.crown.scale.setScalar(scale); v.crown.rotation.z = Math.sin(time * 1.3 + v.index) * .025;
        v.crown.children.forEach(c => { if (c.userData.bud) c.visible = p.phase === "bloom" || p.phase === "ready"; });
        v.halo.visible = p.phase === "ready"; if (v.halo.visible) v.halo.scale.setScalar(1 + Math.sin(time * 2 + v.index) * .06);
        v.drop.visible = splashIndex === v.index && performance.now() < splashUntil;
        if (v.drop.visible) v.drop.children.forEach(c => { const t = (time * .8 + c.userData.phase) % 1; c.position.set(Math.sin(c.userData.phase * 80) * .4, 1.9 - t * 1.7, Math.cos(c.userData.phase * 80) * .4); });
      }
    },
  };
}
