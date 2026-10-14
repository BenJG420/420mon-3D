/** Grow pacing, wall-clock helpers. */

import { FERT_SPEED, FERT_XP, FERT_YIELD, isGrowBox, strainOfItem, type StrainDef } from "./items";

export const GROW_PACE = 5;
export const OFFLINE_CAP = 72 * 3600;
export const OFFLINE_MIN = 25;

/** Conceptual seconds before GROW_PACE. T1=1m → 5m, T2=4m → 20m, T3=24m → 2h. */
const TIER_BASE = [0, 60, 240, 1440] as const;

export function growTier(st: StrainDef | undefined): 1 | 2 | 3 {
  if (!st) return 1;
  if (st.eddiOnly) return 3;
  const b = st.buy ?? 0;
  if (b <= 32) return 1;
  if (b <= 50) return 2;
  return 3;
}

export function strainGrowBase(seed: string): number {
  const st = strainOfItem(seed);
  const tier = growTier(st);
  let raw: number = TIER_BASE[tier];
  if (st?.eddiOnly) raw = 2160;

  return raw * GROW_PACE;
}

export function fertSpeed(fert: string): number {
  return FERT_SPEED[fert] ?? 1;
}

export function fertYieldBonus(fert: string): number {
  return FERT_YIELD[fert] ?? 0;
}

export function fertXpMul(fert: string): number {
  return FERT_XP[fert] ?? 1;
}

export function growTickSpeed(fert: string, byFelix: boolean, schnitt: boolean, eddiIn: boolean): number {
  let s = fertSpeed(fert);
  if (schnitt || (byFelix && eddiIn)) s *= 2;
  return s;
}

export function wallLeft(timeLeft: number, fert: string, byFelix: boolean, schnitt: boolean, eddiIn: boolean): number {
  const spd = growTickSpeed(fert, byFelix, schnitt, eddiIn);
  return timeLeft / Math.max(0.01, spd);
}

export function formatGrowLeft(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r ? `${m}m ${r}s` : `${m}m`;
  }
  return `${s}s`;
}

export function formatClock(ms = Date.now()): string {
  const d = new Date(ms);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function potYieldRaw(
  pot: { seed: string; fert: string; eddiBoost?: boolean },
  box: boolean,
): { buds: number; budId: string; boosted: boolean; fertMul: number; fromBox: boolean } {
  const st = strainOfItem(pot.seed);
  let buds = st?.yieldN ?? 4;
  buds += fertYieldBonus(pot.fert);
  if (box) buds *= 2;
  const boosted = !!pot.eddiBoost;
  if (boosted) buds *= 3;
  return {
    buds,
    budId: st?.id ? `bud_${st.id}` : "bud_ordinary",
    boosted,
    fertMul: fertXpMul(pot.fert),
    fromBox: box,
  };
}
