import { ITEMS } from "./data/items";
import { healLiving, maxHp, type Save } from "./save";

/** Original beginUse/useItem: explicit partner selection never revives defeated HP. */
export function healInventoryItem(s: Save, id: string, uid?: string) {
  const item = ITEMS[id];
  if (!item || !["heal", "heal_all"].includes(item.use ?? "") || !(s.inventory[id] >= 1)) return { ok: false, message: "Kein passendes Heilitem im Inventar." };
  const living = s.team.filter(mon => mon.hp > 0 && mon.hp < maxHp(mon));
  const targets = item.use === "heal_all" ? living : uid
    ? living.filter(mon => mon.uid === uid)
    : living.sort((a,b) => maxHp(b)-b.hp-(maxHp(a)-a.hp)).slice(0,1);
  if (!healLiving(targets, item.healPct ?? .45)) return { ok:false, message:"Niemand braucht Heilung. Item bleibt erhalten." };
  s.inventory[id]--;
  return { ok:true, message:`${item.name}: ${targets.map(mon => `${mon.name} ${mon.hp}/${maxHp(mon)}`).join(" · ")}.` };
}

// Original Pause order; the existing 3D editor/box remain reachable through Party.
export const PAUSE_ENTRIES = [
  ["help", "Hilfe"], ["net", "Leute & Chat"], ["post", "Nachrichten"],
  ["log", "Änderungen"], ["bag", "Inventar"], ["dex", "Dex"],
  ["quest", "Quests"], ["ach", "Erfolge"], ["team", "Party"],
  ["world", "Weltkarte"], ["home", "Kapsel"], ["feedback", "Feedback"],
] as const;
