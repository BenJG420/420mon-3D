/** Original container/lamp loot, source 010807da77df8468a297adf33eaf1fb5c9a61c8b. */
import { ITEMS, MAP_UNIQUE, UNIQUE_FIND, lootKind, openLine, pickGeneric, uniqueChance } from "./data/items";
import type { MapObj } from "./data/maps";
import { battleGoldReward } from "./battle-rewards";
import type { Save } from "./save";

export type SearchResult = { lines: string[]; searched: boolean };
type Random = () => number;

const finite = (value: unknown, fallback = 0): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const playtime = (s: Save): number => Math.max(0, finite(s.playtime));
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

function timestamps(s: Save, key: "searchedBins" | "usedLamps"): Record<string, number> {
  const raw = s[key];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) s[key] = {};
  return s[key] as Record<string, number>;
}

function grant(s: Save, id: string) {
  if (!s.ach || typeof s.ach !== "object" || Array.isArray(s.ach)) s.ach = {};
  (s.ach as Record<string, string>)[id] = "done";
}

function add(s: Save, id: string) {
  s.inventory[id] = Math.max(0, finite(s.inventory[id])) + 1;
  const found = strings(s.foundLoot);
  if (UNIQUE_FIND.includes(id) && !found.includes(id)) found.push(id);
  s.foundLoot = found;
  if (UNIQUE_FIND.every(item => found.includes(item))) grant(s, "kiez_loot");
}

function addGold(s: Save, base: number, mapId: string): number {
  const amount = battleGoldReward({ ...s, map: mapId }, base);
  s.gold += amount;
  s.stats.goldEarned = Math.max(0, finite(s.stats.goldEarned)) + amount;
  if (s.stats.goldEarned >= 1000) grant(s, "gold_1000");
  return amount;
}

const DRESS_LUCK: Record<string, { maps: string[]; luck: number }> = {
  wear_trashbag: { maps: ["alley", "sewer"], luck: 1.08 },
  wear_overalls: { maps: ["scrap", "yard"], luck: 1.08 },
  wear_jacket: { maps: ["alley", "market"], luck: 1.1 },
  wear_coat: { maps: ["labyrinth", "nische", "cable"], luck: 1.08 },
};

function wearLuck(s: Save, mapId: string): number {
  let luck = ITEMS[s.outfit ?? ""]?.luckMul ?? 1;
  const dress = DRESS_LUCK[s.outfit ?? "nude"];
  if (dress?.maps.includes(mapId)) luck *= dress.luck;
  const until = finite(s.highLuckUntil, finite(s.highUntil));
  if (until > playtime(s)) luck *= Math.max(1, finite(s.highLuck, 1));
  return luck;
}

/** Mutates only game state. The interaction caller persists and displays it. */
export function giveLoot(s: Save, kind: string, mapId: string, random: Random = Math.random): string[] {
  const lines: string[] = [];
  let guaranteed = false;
  const luck = wearLuck(s, mapId);
  for (const id of MAP_UNIQUE[mapId] ?? []) {
    const unseen = !strings(s.foundLoot).includes(id);
    if ((unseen && !guaranteed) || random() < uniqueChance(mapId, kind) * luck) {
      add(s, id);
      lines.push(`${ITEMS[id]?.name ?? id}. ${(ITEMS[id]?.where ?? "Nur hier").replace(/\.$/, "")}.`);
      if (unseen) guaranteed = true;
    }
  }
  const generic = pickGeneric(random);
  if (generic.gold) {
    const [low, high] = generic.gold;
    const amount = addGold(s, low + Math.floor(random() * (high - low + 1)), mapId);
    lines.push(`${generic.line} +${amount} Softcash.`);
  } else if (generic.id) {
    if (ITEMS[generic.id]?.eddiOnly) {
      const amount = addGold(s, 8 + Math.floor(random() * 8), mapId);
      lines.push(`Münzen in der Ritze. +${amount} Softcash.`);
    } else {
      add(s, generic.id);
      lines.push(generic.line);
    }
  }
  if (mapId === "sewer" && random() < .25) {
    const id = random() < .45 ? "chip_wet" : "chip_junk";
    add(s, id);
    lines.push(id === "chip_wet" ? "Kanalbonus: +Nass-Chip." : "Kanalbonus: +Junk-Chip.");
  }
  if (random() < .012 * luck) {
    add(s, "chip_crown");
    lines.push("Kronen-Chip. Kalt, schwer, sitzt immer.");
  }
  return lines;
}

function left(s: Save, times: Record<string, number>, id: string, seconds: number): number {
  const last = times[id];
  return typeof last === "number" && Number.isFinite(last) ? Math.max(0, seconds - (playtime(s) - last)) : 0;
}

export function searchContainer(s: Save, obj: MapObj, mapId: string, random: Random = Math.random): SearchResult {
  const kind = lootKind(obj);
  if (!kind || kind === "lamp" || kind === "mattress") return { lines: ["Hier ist kein durchsuchbarer Behälter."], searched: false };
  const bins = timestamps(s, "searchedBins");
  const seconds = left(s, bins, obj.id, 75);
  if (seconds > .2) return { lines: [`${obj.label} leer. Noch ${Math.ceil(seconds)}s.`], searched: false };
  // Source counts timestamps >0. Keep a first search at playtime zero countable.
  bins[obj.id] = Math.max(Number.EPSILON, playtime(s));
  s.stats.binsSearched = Math.max(0, finite(s.stats.binsSearched)) + 1;
  grant(s, "bin_1");
  if (s.stats.binsSearched >= 50) grant(s, "bin_50");
  if (Object.values(bins).filter(time => Number.isFinite(time) && time > 0).length >= 3) {
    s.quests.q3_trash = "done";
    s.quest.q3_trash = true;
  } else if (s.quests.q3_trash !== "done") s.quests.q3_trash = "active";
  if (kind === "bin" && !s.stickFound && random() < .28) {
    s.stickFound = true;
    add(s, "key_stick");
    return { lines: ["In der Tonne: ein warmer Datenstick. Static in der Marktstraße will den."], searched: true };
  }
  return { lines: [`${openLine(kind)} ${giveLoot(s, kind, mapId, random).join(" ")}`], searched: true };
}

export function searchLamp(s: Save, obj: MapObj, mapId: string, random: Random = Math.random): SearchResult {
  if (lootKind(obj) !== "lamp") return { lines: ["Hier ist keine durchsuchbare Lampe."], searched: false };
  const lamps = timestamps(s, "usedLamps");
  const seconds = left(s, lamps, obj.id, 90);
  if (seconds > .2) return { lines: [`Die Röhre ist heiß. Noch ${Math.ceil(seconds)}s, dann flackert sie wieder.`], searched: false };
  lamps[obj.id] = Math.max(Number.EPSILON, playtime(s));
  const lit = strings(s.litLamps);
  if (!lit.includes(obj.id)) lit.push(obj.id);
  s.litLamps = lit;
  return { lines: [`${openLine("lamp")} ${giveLoot(s, "lamp", mapId, random).join(" ")}`], searched: true };
}
