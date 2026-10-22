/** Original shop sale rules used by physical NPC shops. */
import { ITEMS } from "./data/items";
import type { Save } from "./save";
import { battleGoldReward } from "./battle-rewards";
import { setQuestState } from "./quests";
export function salePrice(s: Save, id: string, sellMultiplier = 1): number {
  const item = Object.hasOwn(ITEMS, id) ? ITEMS[id] : undefined;
  if (!item?.sell || !Number.isFinite(sellMultiplier) || sellMultiplier <= 0) return 0;
  let base = Math.round(item.sell * sellMultiplier);
  if (item.sellPlus) base = Math.round(base * (1 + item.sellPlus));
  return battleGoldReward(s, base);
}
/** One confirmed unit price applies to the entire quantity; effects earned now affect the next trade. */
export function sellMerchantItem(s: Save, id: string, sellMultiplier = 1, quantity = 1): number {
  const price = salePrice(s, id, sellMultiplier), total = price * quantity;
  const owned = s.inventory[id], earned = s.stats.goldEarned ?? 0;
  const buds = s.stats.budsSold ?? 0, silk = s.budsSoldToSilk ?? 0;
  const amount = (n: unknown): n is number => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  if (!amount(quantity) || quantity < 1 || !amount(price) || price < 1 || !amount(total)
    || !amount(owned) || owned < quantity || !amount(s.gold) || !amount(s.gold + total)
    || !amount(earned) || !amount(earned + total)) return 0;
  if (id.startsWith("bud_") && (!amount(buds) || !amount(silk) || !amount(buds + quantity) || !amount(silk + quantity))) return 0;
  s.inventory[id] -= quantity; s.gold += total;
  s.stats.goldEarned = earned + total;
  if (!s.ach || typeof s.ach !== "object" || Array.isArray(s.ach)) s.ach = {};
  const ach = s.ach as Record<string, string>;
  if (s.stats.goldEarned >= 1000) ach.gold_1000 = "done";
  if (id.startsWith("bud_")) {
    s.stats.budsSold = buds + quantity;
    s.budsSoldToSilk = (silk as number) + quantity;
    if (s.stats.budsSold >= 100) ach.sold_100 = "done";
    if (id !== "bud_ordinary") ach.silk_deal = "done";
    setQuestState(s, "q5_silk", "done");
  }
  return total;
}
