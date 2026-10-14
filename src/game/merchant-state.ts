/** Original shop sale rules used by physical NPC shops. */
import { ITEMS } from "./data/items";
import type { Save } from "./save";
import { battleGoldReward } from "./battle-rewards";
import { setQuestState } from "./quests";
export function salePrice(s: Save, id: string, sellMultiplier = 1): number {
  const item = ITEMS[id]; if (!item?.sell) return 0;
  let base = Math.round(item.sell * sellMultiplier);
  if (item.sellPlus) base = Math.round(base * (1 + item.sellPlus));
  return battleGoldReward(s, base);
}
export function sellMerchantItem(s: Save, id: string, sellMultiplier = 1): number {
  const price = salePrice(s, id, sellMultiplier);
  if (!price || !Number.isFinite(s.inventory[id]) || s.inventory[id] < 1) return 0;
  s.inventory[id]--; s.gold += price;
  s.stats.goldEarned = (s.stats.goldEarned ?? 0) + price;
  if (!s.ach || typeof s.ach !== "object" || Array.isArray(s.ach)) s.ach = {};
  const ach = s.ach as Record<string, string>;
  if (s.stats.goldEarned >= 1000) ach.gold_1000 = "done";
  if (id.startsWith("bud_")) {
    s.stats.budsSold = (s.stats.budsSold ?? 0) + 1;
    s.budsSoldToSilk = (typeof s.budsSoldToSilk === "number" ? s.budsSoldToSilk : 0) + 1;
    if (s.stats.budsSold >= 100) ach.sold_100 = "done";
    if (id !== "bud_ordinary") ach.silk_deal = "done";
    setQuestState(s, "q5_silk", "done");
  }
  return price;
}
