/** Original 2D runtime battle reward rules, source revision 010807da77df8468a297adf33eaf1fb5c9a61c8b. */
import { ITEMS } from "./data/items";
import { SEWER_LOOT } from "./data/maps";
import type { Save } from "./save";

type HighEffect = "highCatch" | "highSpeed" | "highGold" | "highLuck" | "highXp";
type HighField = HighEffect | `${HighEffect}Until` | "highMul" | "highUntil";

/** Accept the shared save or just the fields needed to calculate a reward. */
export type BattleRewardState = Pick<Save, "map" | "outfit" | "flagLowtown"> &
  Partial<Record<HighField | "playtime" | "catchPerm", unknown>>;

const finite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const multiplier = (value: unknown): number => Math.max(1, finite(value, 1));

// Only DRESS entries with original catch/gold bonuses participate here.
const DRESS: Record<string, { maps: string[]; catch?: number; gold?: number }> = {
  wear_collar: { maps: ["nische", "market"], catch: 1.06 },
  wear_track: { maps: ["ring"], catch: 1.08 },
  wear_overalls: { maps: ["scrap", "yard"], gold: 1.12 },
  wear_vest: { maps: ["ring", "scrap"], catch: 1.06, gold: 1.06 },
};

function dressHere(s: BattleRewardState) {
  const dress = DRESS[s.outfit ?? "nude"];
  return dress?.maps.includes(s.map ?? "") ? dress : undefined;
}

function effectDeadline(s: BattleRewardState, effect: HighEffect): number {
  const deadline = s[`${effect}Until`];
  // Older saves stored one shared deadline. Explicit modern deadlines remain
  // authoritative so an unrelated longer effect cannot restart an expired one.
  return typeof deadline === "number" && Number.isFinite(deadline)
    ? Math.max(0, deadline)
    : Math.max(0, finite(s.highUntil, 0));
}

function activeEffect(s: BattleRewardState, effect: HighEffect): number {
  if (effectDeadline(s, effect) <= Math.max(0, finite(s.playtime, 0))) return 1;
  return multiplier(s[effect]);
}

/** Pure equivalent of expireHigh/highActive/highBoost, including legacy highMul. */
function highBoost(s: BattleRewardState): number {
  const catching = activeEffect(s, "highCatch");
  const legacy = effectDeadline(s, "highCatch") > Math.max(0, finite(s.playtime, 0))
    ? multiplier(s.highMul) : 1;
  const active = catching > 1 || legacy > 1 ||
    (["highSpeed", "highGold", "highLuck", "highXp"] as const).some(effect => activeEffect(s, effect) > 1);
  return active ? catching > 1 ? catching : legacy : 1;
}

export function battleXpBoost(s: BattleRewardState): number {
  return activeEffect(s, "highXp");
}

export function battleCatchBoost(s: BattleRewardState): number {
  return highBoost(s) * multiplier(s.catchPerm) *
    multiplier(ITEMS[s.outfit ?? ""]?.catchWorn) * multiplier(dressHere(s)?.catch);
}

/** Original runtime.bonus: additive city/sewer bonuses, then outfit and high. */
export function battleGoldReward(s: BattleRewardState, base: number): number {
  let bonus = 1 + (s.outfit === "nude" ? .1 : 0) + (s.flagLowtown ? .05 : 0) +
    (s.map === "sewer" ? SEWER_LOOT - 1 : 0);
  bonus *= multiplier(ITEMS[s.outfit ?? ""]?.goldMul) * multiplier(dressHere(s)?.gold);
  bonus *= activeEffect(s, "highGold");
  return Math.max(1, Math.round(finite(base, 0) * bonus));
}
