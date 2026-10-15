/** Original 2D wearOn/toggleBag rules, with safe legacy outfit normalization. */
import { ITEMS } from "./data/items";
import type { Save } from "./save";

export const CLOTHING_IDS: readonly string[] = Object.freeze(Object.values(ITEMS)
  .filter(item => item.cat === "wear" && item.use === "wear")
  .map(item => item.id));
const clothing = new Set(CLOTHING_IDS);
const aliases = new Set(["bag", "clothed"]);

/** Missing/malformed outfits use the original tanktop; aliases keep old saves. */
export function clothingId(raw: unknown): string {
  if (typeof raw !== "string") return "nude";
  if (aliases.has(raw)) return "wear_trashbag";
  return clothing.has(raw) ? raw : "nude";
}

export function clothingLabel(raw: unknown): string {
  return ITEMS[clothingId(raw)]?.name ?? "Tanktop";
}

const sameHistory = (raw: unknown, next: string[]): boolean =>
  Array.isArray(raw) && raw.length === next.length && raw.every((id, index) => id === next[index]);

/** Keep original wear_* history, including older extensions, without giving items. */
export function normalizeClothing(s: Save): boolean {
  let changed = false;
  const outfit = clothingId(s.outfit);
  if (s.outfit !== outfit) { s.outfit = outfit; changed = true; }
  const worn = [...new Set(Array.isArray(s.worn)
    ? s.worn.filter((id): id is string => typeof id === "string" && id.startsWith("wear_")) : [])];
  if (outfit !== "nude" && !worn.includes(outfit)) worn.push(outfit);
  if (!sameHistory(s.worn, worn)) { s.worn = worn; changed = true; }
  return changed;
}

export type ClothingResult = { ok: boolean; outfit: string; lines: string[] };

// Source wearOn uses these acknowledgement lines regardless of the current map.
const dressLines: Record<string, string> = {
  wear_trashbag: "Die Gasse nimmt die Tüte.",
  wear_collar: "Halsband klickt. Pink hört zu.",
  wear_hoodie: "Kapuze. Weniger Augen.",
  wear_track: "Streifen im Käfig.",
  wear_rain: "Gelb hält den Sud ab.",
  wear_overalls: "Latz zahlt sich aus.",
  wear_jacket: "Neon. Bolt nickt.",
  wear_vest: "Weste. Der Schlag sitzt.",
  wear_coat: "Mantel schluckt Licht.",
};

function owned(s: Save, id: string): boolean {
  const count = s.inventory?.[id];
  return typeof count === "number" && Number.isFinite(count) && count >= 1;
}

/** Equip/unequip an owned original item; clothing is reusable, never consumed. */
export function toggleClothing(s: Save, raw: unknown): ClothingResult {
  const current = clothingId(s.outfit);
  const valid = typeof raw === "string" && (raw === "nude" || aliases.has(raw) || clothing.has(raw));
  if (!valid) return { ok: false, outfit: current, lines: ["Das ist keine Kleidung."] };
  const id = clothingId(raw);
  if (id !== "nude" && !owned(s, id)) return { ok: false, outfit: current, lines: ["Nichts da."] };
  const outfit = id === current ? "nude" : id;
  normalizeClothing(s);
  s.outfit = outfit;
  normalizeClothing(s);
  return {
    ok: true, outfit,
    lines: [outfit === "nude" ? "Ausgezogen." : `${clothingLabel(outfit)} sitzt.${dressLines[outfit] ? ` ${dressLines[outfit]}` : ""}`],
  };
}

/** Original T shortcut: remove any outfit, otherwise put on the owned trashbag. */
export function toggleBag(s: Save): ClothingResult {
  if (clothingId(s.outfit) !== "nude") return toggleClothing(s, "nude");
  if (!owned(s, "wear_trashbag")) return { ok: false, outfit: "nude", lines: ["Keine Tüte."] };
  const result = toggleClothing(s, "wear_trashbag");
  return { ...result, lines: ["Tüte sitzt."] };
}
