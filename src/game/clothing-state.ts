/** Reusable original clothing, now with six independent visual equipment slots. */
import { ITEMS } from "./data/items";
import type { Save } from "./save";
import { DEFAULT_WARDROBE, GARMENTS, PRIMARY_GARMENT_BY_ITEM, WARDROBE_SLOTS, normalizeWardrobe, wardrobeKey } from "./wardrobe";
import type { Garment, Wardrobe, WardrobeSlot } from "./wardrobe";

export const CLOTHING_IDS: readonly string[] = Object.freeze(Object.values(ITEMS)
  .filter(item => item.cat === "wear" && item.use === "wear")
  .map(item => item.id));
const clothing = new Set(CLOTHING_IDS);
const aliases = new Set(["bag", "clothed"]);

export function clothingId(raw: unknown): string {
  if (typeof raw !== "string") return "nude";
  if (aliases.has(raw)) return "wear_trashbag";
  return clothing.has(raw) ? raw : "nude";
}

export function clothingLabel(raw: unknown): string {
  return ITEMS[clothingId(raw)]?.name ?? "Tanktop";
}

function owned(s: Save, id: string): boolean {
  const count = s.inventory?.[id];
  return typeof count === "number" && Number.isFinite(count) && count >= 1;
}

export function wardrobeForSave(s: Save): Wardrobe {
  return normalizeWardrobe(s.wardrobe, clothingId(s.outfit));
}

function wornItems(w: Wardrobe): string[] {
  return [...new Set(WARDROBE_SLOTS.flatMap(slot => GARMENTS[w[slot]].item ?? []))];
}

const sameHistory = (raw: unknown, next: string[]): boolean =>
  Array.isArray(raw) && raw.length === next.length && raw.every((id, index) => id === next[index]);
const sameWardrobe = (raw: unknown, next: Wardrobe): boolean =>
  !!raw && typeof raw === "object" && !Array.isArray(raw) && Object.keys(raw).length === WARDROBE_SLOTS.length &&
  WARDROBE_SLOTS.every(slot => Object.hasOwn(raw, slot) && (raw as Wardrobe)[slot] === next[slot]);

/** Keep exactly one currently worn original bonus and a deduplicated source history. */
export function normalizeClothing(s: Save): boolean {
  let changed = false;
  const w = wardrobeForSave(s);
  const items = wornItems(w);
  const old = clothingId(s.outfit);
  const outfit = items.includes(old) ? old : items.at(-1) ?? "nude";
  if (!sameWardrobe(s.wardrobe, w)) { s.wardrobe = w; changed = true; }
  if (s.outfit !== outfit) { s.outfit = outfit; changed = true; }
  const worn = [...new Set(Array.isArray(s.worn)
    ? s.worn.filter((id): id is string => typeof id === "string" && id.startsWith("wear_")) : [])];
  for (const item of items) if (!worn.includes(item)) worn.push(item);
  if (!sameHistory(s.worn, worn)) { s.worn = worn; changed = true; }
  return changed;
}

/** Existing unowned legacy pieces remain selectable only while actually worn. */
export function wardrobeChoices(s: Save, slot: WardrobeSlot): Garment[] {
  const w = wardrobeForSave(s);
  return Object.values(GARMENTS).filter(part => part.slot === slot && (!part.item || owned(s, part.item) || w[slot] === part.id));
}

export function isClothingItemEquipped(s: Save, item: string): boolean {
  const id = clothingId(item);
  return id !== "nude" && wornItems(wardrobeForSave(s)).includes(id);
}

/** Inventory toggles the main piece; a matching hat or shoe does not toggle a top. */
export function clothingInventoryAction(s: Save, item: string): "Anziehen" | "Ausziehen" {
  const id = clothingId(item);
  if (!Object.hasOwn(PRIMARY_GARMENT_BY_ITEM, id)) return "Anziehen";
  const primary = GARMENTS[PRIMARY_GARMENT_BY_ITEM[id]];
  return GARMENTS[wardrobeForSave(s)[primary.slot]].item === id ? "Ausziehen" : "Anziehen";
}

export function wardrobeLabel(s: Save): string {
  const w = wardrobeForSave(s);
  return WARDROBE_SLOTS.filter(slot => !w[slot].endsWith("_none")).map(slot => GARMENTS[w[slot]].label).join(" · ");
}

export type ClothingResult = { ok: boolean; outfit: string; lines: string[] };

/** A failed storage write must not leave a different visible outfit or newly earned clothing flag. */
export function persistClothingChange(s: Save, change: () => ClothingResult, persist: () => boolean): ClothingResult {
  const fields = ["wardrobe", "outfit", "worn", "ach", "achTips", "achClaimed"] as const;
  const snapshot = fields.map(key => ({ key, present: Object.hasOwn(s, key), value: structuredClone(s[key]) }));
  const restore = () => {
    const writable = s as Record<string, unknown>;
    for (const entry of snapshot) {
      if (entry.present) writable[entry.key] = entry.value;
      else delete writable[entry.key];
    }
  };
  try {
    const result = change();
    if (!result.ok) { restore(); return result; }
    if (persist()) return result;
  } catch { /* Restore exactly the pre-change equipment; callers render the returned error. */ }
  restore();
  return { ok: false, outfit: clothingId(s.outfit), lines: ["Kleidung konnte nicht gespeichert werden. Die bisherige Kombination bleibt angezogen."] };
}

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

/** Replace one slot, never consume an item or reset another piece. */
export function equipGarment(s: Save, slot: WardrobeSlot, id: string): ClothingResult {
  const current = clothingId(s.outfit);
  if (!WARDROBE_SLOTS.includes(slot) || !Object.hasOwn(GARMENTS, id) || GARMENTS[id].slot !== slot)
    return { ok: false, outfit: current, lines: ["Dieses Teil passt nicht in den Slot."] };
  const part = GARMENTS[id];
  const w = wardrobeForSave(s);
  if (part.item && !owned(s, part.item) && w[slot] !== id)
    return { ok: false, outfit: current, lines: ["Nichts da."] };
  normalizeClothing(s);
  w[slot] = id;
  if (!sameWardrobe(s.wardrobe, w)) s.wardrobe = w;
  if (part.item) s.outfit = part.item;
  normalizeClothing(s);
  return { ok: true, outfit: clothingId(s.outfit), lines: [`${part.label} sitzt.`] };
}

/** Inventory buttons replace the original item's main slot; T can reset the whole set. */
export function toggleClothing(s: Save, raw: unknown): ClothingResult {
  const current = clothingId(s.outfit);
  const valid = typeof raw === "string" && (raw === "nude" || aliases.has(raw) || clothing.has(raw));
  if (!valid) return { ok: false, outfit: current, lines: ["Das ist keine Kleidung."] };
  const id = clothingId(raw);
  if (id === "nude") {
    normalizeClothing(s);
    s.wardrobe = { ...DEFAULT_WARDROBE };
    s.outfit = "nude";
    normalizeClothing(s);
    return { ok: true, outfit: "nude", lines: ["Ausgezogen."] };
  }
  const primary = GARMENTS[PRIMARY_GARMENT_BY_ITEM[id]];
  const w = wardrobeForSave(s);
  const removing = GARMENTS[w[primary.slot]].item === id;
  if (!removing && !owned(s, id)) return { ok: false, outfit: current, lines: ["Nichts da."] };
  const result = equipGarment(s, primary.slot, removing ? DEFAULT_WARDROBE[primary.slot] : primary.id);
  if (result.ok) result.lines = [removing ? `${clothingLabel(id)} abgelegt.` : `${clothingLabel(id)} sitzt.${dressLines[id] ? ` ${dressLines[id]}` : ""}`];
  return result;
}

/** Original T shortcut: reset all slots, otherwise put on the owned trashbag. */
export function toggleBag(s: Save): ClothingResult {
  if (wardrobeKey(wardrobeForSave(s)) !== wardrobeKey(DEFAULT_WARDROBE)) return toggleClothing(s, "nude");
  if (!owned(s, "wear_trashbag")) return { ok: false, outfit: "nude", lines: ["Keine Tüte."] };
  const result = toggleClothing(s, "wear_trashbag");
  return { ...result, lines: ["Tüte sitzt."] };
}
