/** The six visual slots are independent; original item effects stay in Save.outfit. */
export const WARDROBE_SLOTS = ["top", "jacket", "pants", "shoes", "head", "accessory"] as const;
export type WardrobeSlot = typeof WARDROBE_SLOTS[number];
export type Wardrobe = Record<WardrobeSlot, string>;
export type Garment = Readonly<{ id: string; slot: WardrobeSlot; label: string; item?: string }>;

export const WARDROBE_SLOT_LABELS: Readonly<Record<WardrobeSlot, string>> = Object.freeze({
  top: "Oberteil", jacket: "Jacke", pants: "Hose", shoes: "Schuhe", head: "Kopf", accessory: "Accessoires",
});

const garment = (id: string, slot: WardrobeSlot, label: string, item?: string): Garment =>
  Object.freeze({ id, slot, label, ...(item ? { item } : {}) });
export const GARMENTS: Readonly<Record<string, Garment>> = Object.freeze(Object.fromEntries([
  garment("top_tanktop", "top", "Tanktop"),
  garment("top_shirt", "top", "T-Shirt"),
  garment("top_hoodie", "top", "Hoodie", "wear_hoodie"),
  garment("top_track", "top", "Trainingsoberteil", "wear_track"),
  garment("jacket_none", "jacket", "Ohne Jacke"),
  garment("jacket_trashbag", "jacket", "Mülltüte", "wear_trashbag"),
  garment("jacket_bomber", "jacket", "Neon-Jacke", "wear_jacket"),
  garment("jacket_vest", "jacket", "Lederweste", "wear_vest"),
  garment("jacket_leather", "jacket", "Lederjacke", "wear_vest"),
  garment("jacket_coat", "jacket", "Asphalt-Mantel", "wear_coat"),
  garment("jacket_rain", "jacket", "Regenjacke", "wear_rain"),
  garment("jacket_lack", "jacket", "Lackjacke", "wear_lack"),
  garment("pants_shorts", "pants", "Shorts"),
  garment("pants_plain", "pants", "Stoffhose"),
  garment("pants_track", "pants", "Trainingshose", "wear_track"),
  garment("pants_overalls", "pants", "Latzhose", "wear_overalls"),
  garment("shoes_basic", "shoes", "Alltagsschuhe"),
  garment("shoes_trainers", "shoes", "Trainingsschuhe", "wear_track"),
  garment("shoes_work", "shoes", "Arbeitsstiefel", "wear_overalls"),
  garment("head_none", "head", "Ohne Kopfbedeckung"),
  garment("head_beanie", "head", "Mütze", "wear_hoodie"),
  garment("head_rainhood", "head", "Regenkapuze", "wear_rain"),
  garment("accessory_none", "accessory", "Ohne Accessoire"),
  garment("accessory_collar", "accessory", "Halsband", "wear_collar"),
].map(entry => [entry.id, entry])));

export const DEFAULT_WARDROBE: Readonly<Wardrobe> = Object.freeze({
  top: "top_tanktop", jacket: "jacket_none", pants: "pants_shorts", shoes: "shoes_basic", head: "head_none", accessory: "accessory_none",
});

/** Inventory use affects the item's main slot, keeping the other five choices. */
export const PRIMARY_GARMENT_BY_ITEM: Readonly<Record<string, string>> = Object.freeze({
  wear_trashbag: "jacket_trashbag", wear_collar: "accessory_collar", wear_jacket: "jacket_bomber",
  wear_vest: "jacket_vest", wear_coat: "jacket_coat", wear_hoodie: "top_hoodie", wear_track: "top_track",
  wear_rain: "jacket_rain", wear_overalls: "pants_overalls", wear_lack: "jacket_lack",
});

/** Import a previously visible whole outfit without creating inventory items. */
export function legacyWardrobe(raw: unknown): Wardrobe {
  const w = { ...DEFAULT_WARDROBE };
  const item = raw === "bag" || raw === "clothed" ? "wear_trashbag" : raw;
  if (typeof item !== "string" || !Object.hasOwn(PRIMARY_GARMENT_BY_ITEM, item)) return w;
  const primary = GARMENTS[PRIMARY_GARMENT_BY_ITEM[item]];
  w[primary.slot] = primary.id;
  if (["wear_hoodie", "wear_coat", "wear_lack"].includes(item)) w.pants = "pants_plain";
  if (item === "wear_hoodie") w.head = "head_beanie";
  if (item === "wear_track") { w.pants = "pants_track"; w.shoes = "shoes_trainers"; }
  if (item === "wear_rain") w.head = "head_rainhood";
  if (item === "wear_overalls") w.shoes = "shoes_work";
  return w;
}

/** Reject unknown IDs and IDs in the wrong slot. Every result is a fresh six-slot value. */
export function normalizeWardrobe(raw: unknown, fallbackOutfit?: unknown): Wardrobe {
  const w = legacyWardrobe(fallbackOutfit);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return w;
  for (const slot of WARDROBE_SLOTS) {
    const id = Object.hasOwn(raw, slot) ? (raw as Record<string, unknown>)[slot] : undefined;
    if (typeof id === "string" && Object.hasOwn(GARMENTS, id) && GARMENTS[id].slot === slot) w[slot] = id;
  }
  return w;
}

export function wardrobeKey(w: Wardrobe): string {
  const normalized = normalizeWardrobe(w);
  return WARDROBE_SLOTS.map(slot => normalized[slot]).join("|");
}
