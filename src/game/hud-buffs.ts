import { activeFishEffects, type FishEffectId } from "./fish-consumption";
import { ITEMS } from "./data/items";
import { clothingId } from "./clothing-state";
import type { Save } from "./save";

export type HudBuff = { id: string; icon: string; label: string; time: string; title: string; left: number | null };
const ICONS: Record<FishEffectId, string> = { catch: "🎯", speed: "⚡", gold: "💰", luck: "🍀", xp: "✦" };
const percent = (value: number) => `${value > 1 ? "+" : ""}${Math.round((value - 1) * 100)}%`;

/** Read the existing clocks and the one active outfit bonus; never mutate saves. */
export function activeHudBuffs(save: Save): HudBuff[] {
  const buffs: HudBuff[] = activeFishEffects(save).map(effect => ({
    id: `high:${effect.id}`, icon: ICONS[effect.id], label: `${effect.name} ${percent(effect.multiplier)}`,
    time: `${effect.left}s`, left: effect.left,
    title: `${effect.name} ${percent(effect.multiplier)} · noch ${effect.left} Sekunden${effect.id === "catch" ? " · mehr Wild" : ""}`,
  }));
  const item = ITEMS[clothingId(save.outfit)];
  if (item?.cat === "wear") {
    const benefits = ([
      ["Fang", item.catchWorn], ["Gold", item.goldMul], ["Loot", item.luckMul], ["Begegnungen", item.encMul],
    ] as const).flatMap(([name, value]) => typeof value === "number" && Number.isFinite(value) && value > 0 && value !== 1 ? [`${name} ${percent(value)}`] : []);
    if (benefits.length) buffs.push({ id: `wear:${item.id}`, icon: "👕", label: benefits.join(" · "), time: "∞", left: null,
      title: `${item.name}: ${benefits.join(" · ")} · solange getragen` });
  }
  if (typeof save.catchPerm === "number" && Number.isFinite(save.catchPerm) && save.catchPerm > 1)
    buffs.push({ id: "permanent:silk", icon: "🎯", label: `Silk ${percent(save.catchPerm)}`, time: "∞", left: null, title: `Silk: Fang ${percent(save.catchPerm)} · dauerhaft` });
  if (save.schnittTitle)
    buffs.push({ id: "permanent:breeder", icon: "🌱", label: "Züchter ×2", time: "∞", left: null, title: "Züchter: Grow-Tempo ×2 · dauerhaft" });
  return buffs;
}

const EXPANDED_KEY = "420mon-hud-buffs-expanded";

/** Nested inside the existing Cash/clock/level HUD, so its main toggle hides both. */
export function createHudBuffs(parent: HTMLElement) {
  const details = document.createElement("details"); details.className = "hud-buffs";
  details.open = true;
  try { details.open = localStorage.getItem(EXPANDED_KEY) !== "false"; } catch { /* session display remains usable */ }
  const summary = document.createElement("summary"); summary.textContent = "Buffs";
  const list = document.createElement("ul"); list.className = "hud-buff-list"; list.setAttribute("aria-label", "Aktive Buffs");
  details.append(summary, list); parent.append(details);
  details.addEventListener("toggle", () => {
    try { localStorage.setItem(EXPANDED_KEY, String(details.open)); } catch { /* keep session preference */ }
  });
  let previous = "";
  return {
    update(save: Save) {
      const buffs = activeHudBuffs(save), signature = JSON.stringify(buffs);
      if (signature === previous) return; previous = signature;
      details.hidden = buffs.length === 0;
      summary.textContent = `Buffs (${buffs.length})`;
      list.replaceChildren(...buffs.map(buff => {
        const row = document.createElement("li"); row.title = buff.title; row.dataset.effect = buff.id.split(":")[1]; row.setAttribute("aria-label", buff.title);
        const icon = document.createElement("span"); icon.className = "hud-buff-icon"; icon.setAttribute("aria-hidden", "true"); icon.textContent = buff.icon;
        const label = document.createElement("span"); label.className = "hud-buff-label"; label.textContent = buff.label;
        const time = document.createElement("span"); time.className = "hud-buff-time"; time.textContent = buff.time;
        if (buff.left === null) time.setAttribute("aria-label", buff.id.startsWith("wear:") ? "Solange getragen" : "Dauerhaft");
        row.append(icon, label, time); return row;
      }));
    },
  };
}
