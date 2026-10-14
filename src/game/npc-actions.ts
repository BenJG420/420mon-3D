/** Original quest turn-ins and mattress rewards (2D runtime revision 010807da77df). */
import type { Save } from "./save";
import type { MapObj } from "./data/maps";
import { setQuestState } from "./quests";
import { battleGoldReward } from "./battle-rewards";
import { giveLoot } from "./loot";

const finite = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
function grant(s: Save, id: string) {
  if (!s.ach || typeof s.ach !== "object" || Array.isArray(s.ach)) s.ach = {};
  (s.ach as Record<string, string>)[id] = "done";
}
function take(s: Save, id: string): boolean {
  if (finite(s.inventory[id]) < 1) return false;
  s.inventory[id]--; return true;
}
function gold(s: Save, base: number) {
  const amount = battleGoldReward(s, base);
  s.gold += amount; s.stats.goldEarned = finite(s.stats.goldEarned) + amount;
  if (s.stats.goldEarned >= 1000) grant(s, "gold_1000");
  return amount;
}
export function talkBolt(s: Save): string[] {
  if (s.quests.q1_bolt === "done" || s.quest.q1_bolt) return ["Bolt: Markt, Hinterhof, Keller — und der Rest. Schilder in der Gasse. Jeder Typ eine Straße.", "Bolt: Gulli kennt sie alle, falls du faul bist."];
  if (s.quests.q1_bolt === "active") {
    if (!take(s, "chip_junk")) return ["Bolt: Immer noch keinen Junk-Chip? Mülltonnen, Kind."];
    setQuestState(s, "q1_bolt", "done"); grant(s, "bolt_out");
    return ["Bolt schnappt den Junk-Chip.", "Bolt: Durchlass frei. Schilder an. Gulli auch."];
  }
  setQuestState(s, "q1_bolt", "active");
  return ["Bolt mustert deine Taschen.", "Bolt: Willst durch zum Markt, zahl mit einem Junk-Chip. Ich schließ den Riegel.", "Bolt: Und bleib weg von den Gullis. Da unten kommt keiner sauber wieder raus."];
}
export function giveSilkStick(s: Save): string[] {
  if (finite(s.catchPerm, 1) >= 1.08) return ["Silk: Kalibriert. Acht Prozent. Für immer."];
  if (!take(s, "key_silkstick")) return ["Silk: Kein Stick. Markt — Kisten, Fässer, Stände."];
  s.catchPerm = 1.08; setQuestState(s, "q5_silk", "done"); grant(s, "silk_stick");
  const amount = gold(s, 28);
  return ["Silk steckt den Stick in einen Port unter der Theke. Ein Piepen, dann Stille.", `Silk: Kalibriert. Deine Chips beißen ab jetzt dauerhaft härter. +${amount} Softcash.`, "Silk: Acht Prozent. Für immer. Buds kauf ich trotzdem."];
}
export function talkStatic(s: Save): string[] {
  if (s.quests.q9_static === "done" || s.quest.q9_static) return ["> STATIC: TICKET USED. BLEIB SAUBER."];
  setQuestState(s, "q9_static", "active");
  if (!take(s, "key_stick")) return ["> STATIC: ICH BRAUCH DEN STICK AUS DEN TONNEN.", "> FINDE IHN. DANN REDE."];
  setQuestState(s, "q9_static", "done"); grant(s, "hack_1");
  const amount = gold(s, 40); s.inventory.chip_neon = finite(s.inventory.chip_neon) + 1;
  return ["> STICK ACK. ROOT OK.", `Static wirft dir einen Neon-Chip zu. +${amount} Softcash.`];
}
/** Story payout has the original 110s cooldown; physical healing stays available. */
export function mattressQuest(s: Save, obj: MapObj, mapId: string, random = Math.random): string[] {
  if (obj.kind !== "mattress") return [];
  if (!s.usedMattress || typeof s.usedMattress !== "object" || Array.isArray(s.usedMattress)) s.usedMattress = {};
  const used = s.usedMattress as Record<string, number>, time = Math.max(0, finite(s.playtime));
  const previous = used[obj.id];
  if (typeof previous === "number" && Number.isFinite(previous) && time - previous < 109.8) return ["Der Schlafplatz bringt dich auf die Beine. Für die nächste Matratzen-Belohnung braucht Lowtown noch Zeit."];
  used[obj.id] = time;
  const first = s.quests.q8_mattress !== "done" && !s.quest.q8_mattress;
  setQuestState(s, "q8_mattress", "done"); grant(s, "sex_1");
  s.stats.sexEvents = finite(s.stats.sexEvents) + 1;
  const amount = gold(s, first ? 56 : 38);
  return [`${first ? "Der Faden zur Nische ist zu." : "Lowtown wiederholt sich — du auch."} +${amount} Softcash.`, ...giveLoot(s, "mattress", mapId, random)];
}
export function acknowledgeBen(s: Save): boolean {
  if (finite(s.trainerLv, 1) < 10 || s.benRead) return false;
  s.benRead = true; setQuestState(s, "q_ben", "done"); return true;
}
