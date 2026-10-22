/** Quantity trades preserve the original per-piece prices, rewards and shop restrictions. */
import { ITEMS, STALL_GROW } from "./data/items";
import { buyGrowItem, sellGrowBud } from "./grow-state";
import { salePrice, sellMerchantItem } from "./merchant-state";
import type { Save } from "./save";

export type TradeOffer = {
  kind: "buy" | "sell" | "capsule" | "grow-buy" | "grow-sell";
  id: string;
  items?: readonly string[];
  sellMultiplier?: number;
};
export type TradeQuote = { ok: boolean; max: number; unitPrice: number; total: number; reason?: string };
export type TradeResult = { ok: boolean; message: string; total: number };
const MAX = Number.MAX_SAFE_INTEGER;
const amount = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const buying = (kind: TradeOffer["kind"]) => kind === "buy" || kind === "grow-buy" || kind === "capsule";
const stock = (s: Save, id: string): unknown => Object.hasOwn(s.inventory, id) ? s.inventory[id] : 0;

/** Read-only quote. Max never includes fractional, unaffordable or unrepresentable units. */
export function quoteTrade(s: Save, offer: TradeOffer, quantity = 1): TradeQuote {
  let unitPrice = 0, max = 0;
  const reject = (reason: string, total = 0): TradeQuote => ({ ok: false, max, unitPrice, total, reason });
  if (!offer || typeof offer.id !== "string" || !["buy", "sell", "capsule", "grow-buy", "grow-sell"].includes(offer.kind)) return reject("Kein gültiges Angebot.");
  if (!amount(s.gold)) return reject("Der Geldbestand ist ungültig.");
  if (offer.kind === "capsule") {
    if (offer.id !== "capsule" || !amount(s.balls)) return reject("Kein gültiges Kapselangebot.");
    unitPrice = 25;
    max = Math.min(Math.floor(s.gold / unitPrice), MAX - s.balls);
  } else {
    const item = Object.hasOwn(ITEMS, offer.id) ? ITEMS[offer.id] : undefined;
    if (!item) return reject("Dieses Item wird nicht gehandelt.");
    const count = stock(s, offer.id);
    if (!amount(count)) return reject("Der Itembestand ist ungültig.");
    if (buying(offer.kind)) {
      const offered = offer.kind === "grow-buy" ? STALL_GROW.includes(offer.id) : Array.isArray(offer.items) && offer.items.includes(offer.id);
      if (!offered || item.cat === "key" || !amount(item.buy) || item.buy < 1) return reject("Dieses Item gibt es hier nicht zu kaufen.");
      unitPrice = item.buy;
      max = Math.min(Math.floor(s.gold / unitPrice), MAX - count);
    } else {
      if (offer.kind === "grow-sell" && item.cat !== "bud") return reject("Hier kannst du nur Buds verkaufen.");
      if (!amount(item.sell) || item.sell < 1) return reject("Dieses Item ist nicht verkäuflich.");
      unitPrice = offer.kind === "grow-sell" ? Math.max(1, Math.round(item.sell * .95)) : salePrice(s, offer.id, offer.sellMultiplier ?? 1);
      if (!amount(unitPrice) || unitPrice < 1) { unitPrice = 0; return reject("Der Verkaufspreis ist ungültig."); }
      const earned = s.stats.goldEarned ?? 0;
      if (!amount(earned)) return reject("Der Einnahmenzähler ist ungültig.");
      max = Math.min(count, Math.floor((MAX - s.gold) / unitPrice), Math.floor((MAX - earned) / unitPrice));
      if (offer.kind === "grow-sell" || offer.id.startsWith("bud_")) {
        const buds = s.stats.budsSold ?? 0;
        if (!amount(buds)) return reject("Der Verkaufszähler ist ungültig.");
        max = Math.min(max, MAX - buds);
        if (offer.kind === "sell") {
          const silk = s.budsSoldToSilk ?? 0;
          if (!amount(silk)) return reject("Der Verkaufszähler ist ungültig.");
          max = Math.min(max, MAX - silk);
        }
      }
    }
  }
  if (!amount(quantity) || quantity < 1) return reject("Bitte eine ganze Menge ab 1 wählen.");
  const total = unitPrice * quantity;
  if (!amount(total)) return reject("Diese Gesamtmenge ist zu groß.");
  if (quantity > max) return reject(buying(offer.kind) ? "Nicht genug Geld oder Platz für diese Menge." : "Diese Menge ist nicht verfügbar oder der Geldbestand ist voll.", total);
  return { ok: true, max, unitPrice, total };
}

// saveProgress also normalizes clothing/collection and can settle board quests. Roll back
// those fields too, keeping the original mutable containers used by the running game.
const BOOKING_FIELDS = ["gold", "balls", "inventory", "stats", "quest", "quests", "ach", "achTips", "achClaimed",
  "budsSoldToSilk", "flagLowtown", "foundLoot", "wardrobe", "outfit", "worn", "collection"] as const;
function restoreContainer(original: unknown, snapshot: unknown): unknown {
  if (Array.isArray(original) && Array.isArray(snapshot)) {
    for (let i = 0; i < snapshot.length; i++) original[i] = restoreContainer(original[i], snapshot[i]);
    original.length = snapshot.length; return original;
  }
  if (original && snapshot && typeof original === "object" && typeof snapshot === "object" && !Array.isArray(original) && !Array.isArray(snapshot)) {
    const target = original as Record<string, unknown>, saved = snapshot as Record<string, unknown>;
    for (const key of Object.keys(target)) if (!Object.hasOwn(saved, key)) delete target[key];
    for (const [key, value] of Object.entries(saved)) Object.defineProperty(target, key, {
      value: restoreContainer(Object.hasOwn(target, key) ? target[key] : undefined, value), writable: true, enumerable: true, configurable: true,
    });
    return target;
  }
  return snapshot;
}
const booking = new WeakSet<Save>();

/** Revalidate once, book the whole quantity once, and persist once; never partially fill a request. */
export function executeTrade(s: Save, offer: TradeOffer, quantity: number, expectedUnitPrice: number, persist: () => boolean): TradeResult {
  const fail = (message: string): TradeResult => ({ ok: false, message, total: 0 });
  if (booking.has(s)) return fail("Dieser Handel wird bereits gespeichert.");
  const quote = quoteTrade(s, offer, quantity);
  if (!quote.ok) return fail(quote.reason ?? "Handel nicht möglich.");
  if (expectedUnitPrice !== quote.unitPrice) return fail("Der Stückpreis hat sich geändert. Bitte die Menge erneut bestätigen.");
  const fields = BOOKING_FIELDS.map(key => ({ key, present: Object.hasOwn(s, key), original: s[key], saved: structuredClone(s[key]) }));
  const restore = () => {
    const target = s as Record<string, unknown>;
    for (const field of fields) {
      if (field.present) target[field.key] = restoreContainer(field.original, field.saved);
      else delete target[field.key];
    }
  };
  booking.add(s);
  try {
    let accepted = true;
    if (offer.kind === "capsule") { s.gold -= quote.total; s.balls += quantity; }
    else if (offer.kind === "buy") { s.gold -= quote.total; s.inventory[offer.id] = (stock(s, offer.id) as number) + quantity; }
    else if (offer.kind === "grow-buy") accepted = buyGrowItem(s, offer.id, quantity);
    else if (offer.kind === "grow-sell") accepted = sellGrowBud(s, offer.id, quantity) === quote.total;
    else accepted = sellMerchantItem(s, offer.id, offer.sellMultiplier ?? 1, quantity) === quote.total;
    if (!accepted) { restore(); return fail("Das Angebot ist nicht mehr verfügbar."); }
    if (!persist()) { restore(); return fail("Handel konnte nicht gespeichert werden. Geld und Items bleiben unverändert."); }
    const name = offer.kind === "capsule" ? "Fangkapsel" : ITEMS[offer.id].name;
    return { ok: true, total: quote.total, message: `${quantity}× ${name} ${buying(offer.kind) ? "gekauft" : "verkauft"} · ${buying(offer.kind) ? "−" : "+"}${quote.total} Softcash.` };
  } catch {
    restore(); return fail("Handel konnte nicht gespeichert werden. Geld und Items bleiben unverändert.");
  } finally { booking.delete(s); }
}
