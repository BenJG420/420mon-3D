import { normalizePartnerForBattle, tryLevel } from "./battle";
import { tankGrowMul } from "./data/fish";
import { DEX } from "./data/dex";
import { BOX_MAX, BOX_UNLOCK, GROW_SLOTS, ITEMS, POT_MAX, POT_START, POT_UNLOCK, STALL_GROW, isGrowBox } from "./data/items";
import { OFFLINE_CAP, growTickSpeed, potYieldRaw, strainGrowBase, wallLeft } from "./data/grow";
import { MAX_LEVEL, xpToNext } from "./data/progress";
import type { GrowPot } from "./save";

export type GrowState = {
  pots: GrowPot[]; potsUnlocked: number; boxesUnlocked: number;
  inventory: Record<string, number>; gold: number; harvestedSeeds: string[];
  boxHarvests: number; stats: Record<string, number>; schnittTitle: boolean;
  eddiIn: boolean; lastGrowAt: number; quest: Record<string, boolean>;
  quests: Record<string, string>; team: { id?: string; name: string; level: number; xp: number; hp: number; hpMax?: number }[];
  [key: string]: unknown;
};

export const emptyPot = (id: number): GrowPot => ({ id, seed: "", fert: "", phase: "empty", timeLeft: 0, total: 0 });
const finite = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const hasItem = (s: GrowState, id: string): boolean => typeof s.inventory[id] === "number" && Number.isFinite(s.inventory[id]) && s.inventory[id] >= 1;
const addItem = (s: GrowState, id: string, count: number): void => { s.inventory[id] = Math.max(0, finite(s.inventory[id], 0)) + count; };

/** Accept both the original save's pot IDs and old 3D saves without Grow fields. */
export function ensureGrowState(s: GrowState, now = Date.now()): void {
  const old = Array.isArray(s.pots) ? s.pots : [];
  s.pots = Array.from({ length: GROW_SLOTS }, (_, id) => {
    const p = old.find(p => p?.id === id);
    if (!p || !ITEMS[p.seed] || ITEMS[p.seed].cat !== "seed") return emptyPot(id);
    const total = Math.max(1, finite(p.total, strainGrowBase(p.seed)));
    // Retain live pot references when another system saves or opens a menu.
    Object.assign(p, { id, total, timeLeft: clamp(finite(p.timeLeft, total), 0, total), fert: ITEMS[p.fert]?.cat === "fert" ? p.fert : "" });
    if (p.careBest !== undefined) p.careBest = Math.floor(clamp(finite(p.careBest, 0), 0, 3));
    // Existing cosmetic best scores do not grant a reward until care is played again.
    if (p.careRewardHits !== undefined) p.careRewardHits = careHits(p.careRewardHits);
    refreshPot(p);
    return p;
  });
  s.potsUnlocked = Math.floor(clamp(finite(s.potsUnlocked, POT_START), POT_START, POT_MAX));
  s.boxesUnlocked = Math.floor(clamp(finite(s.boxesUnlocked, 0), 0, BOX_MAX));
  s.harvestedSeeds = Array.isArray(s.harvestedSeeds) ? s.harvestedSeeds.filter(id => typeof id === "string") : [];
  s.boxHarvests = Math.max(0, finite(s.boxHarvests, 0));
  s.stats ??= {};
  s.stats.plantsHarvested = Math.max(0, finite(s.stats.plantsHarvested, 0));
  s.inventory ??= {};
  s.quest ??= {};
  s.quests ??= {};
  s.schnittTitle = !!s.schnittTitle;
  s.eddiIn = !!s.eddiIn;
  const oldUnix = finite(s.lastUnix, 0) * 1000;
  s.lastGrowAt = finite(s.lastGrowAt, oldUnix || now) || oldUnix || now;
  if (s.growInitialized !== true) {
    const hasGrowHistory = old.some(p => p?.seed) || s.stats.plantsHarvested > 0 || s.harvestedSeeds.length > 0;
    const hasSeed = Object.keys(s.inventory).some(id => ITEMS[id]?.cat === "seed" && s.inventory[id] > 0);
    if (!hasGrowHistory && !hasSeed && !s.migratedFrom) s.inventory.seed_ordinary = 1;
    s.growInitialized = true;
  }
  if (s.team.length && s.eddiSeed !== true) {
    addItem(s, "seed_eddi", 1);
    s.eddiSeed = true;
  }
}

export function refreshPot(p: GrowPot): void {
  if (!p.seed) { p.phase = "empty"; return; }
  if (p.timeLeft <= 0) { p.timeLeft = 0; p.phase = "ready"; return; }
  const fraction = 1 - p.timeLeft / Math.max(1, p.total);
  p.phase = fraction + Number.EPSILON >= .66 ? "bloom" : fraction + Number.EPSILON >= .33 ? "grow" : "sprout";
}

export const slotOpen = (s: GrowState, index: number): boolean => Number.isInteger(index) && index >= 0 && index < GROW_SLOTS && (isGrowBox(index) ? index - POT_MAX < s.boxesUnlocked : index < s.potsUnlocked);
const tankSpeed = (s: GrowState) => tankGrowMul(typeof s.map === "string" ? s.map : "", s.fishCaught as Record<string, number> | undefined);
export const growRemaining = (s: GrowState, p: GrowPot): number => wallLeft(p.timeLeft, p.fert, !!p.byFelix, s.schnittTitle, s.eddiIn) / tankSpeed(s);
const careHits = (value: unknown): number => Math.floor(clamp(finite(value, 0), 0, 3));
/** Each earned hit gives this planting 10% shorter growth and 10% more buds. */
export const growCareBonus = (p: GrowPot): number => careHits(p.careRewardHits) / 10;

/** Shared by the plant preview and actual harvest, including original loot bonuses. */
export function previewGrowHarvest(s: GrowState, index: number) {
  const p = s.pots[index];
  if (!p || !slotOpen(s, index) || !p.seed || ITEMS[p.seed]?.cat !== "seed") return undefined;
  const yielded = potYieldRaw(p, isGrowBox(index));
  let bonus = 1 + (s.outfit === "nude" ? .1 : 0) + (s.flagLowtown ? .05 : 0);
  const clothing = typeof s.outfit === "string" ? ITEMS[s.outfit]?.goldMul : 0;
  if (clothing && clothing > 1) bonus *= clothing;
  if (finite(s.highGoldUntil, 0) > finite(s.playtime, 0)) bonus *= Math.max(1, finite(s.highGold, 1));
  const baseBuds = Math.max(1, Math.round(yielded.buds * bonus));
  const hits = careHits(p.careRewardHits);
  // Round the extra buds up so even a small harvest earns a real reward.
  const buds = baseBuds + Math.ceil(baseBuds * hits / 10);
  return { ...yielded, buds, baseBuds, careBonusPercent: hits * 10 };
}

/** Real elapsed time, including closed tabs; original offline cap is 72 hours. */
export function advanceGrow(s: GrowState, now = Date.now()): number {
  if (!Number.isFinite(now) || !Number.isFinite(s.lastGrowAt)) return 0;
  const elapsed = Math.min(OFFLINE_CAP, Math.max(0, (now - s.lastGrowAt) / 1000));
  if (now <= s.lastGrowAt) return 0;
  s.lastGrowAt = now;
  for (const p of s.pots) {
    if (p.phase === "empty" || p.phase === "ready") continue;
    p.timeLeft = Math.max(0, p.timeLeft - elapsed * growTickSpeed(p.fert, !!p.byFelix, s.schnittTitle, s.eddiIn) * tankSpeed(s));
    refreshPot(p);
  }
  return elapsed;
}

function grantXp(s: GrowState, amount: number): number {
  const lv = finite(s.trainerLv, 1);
  const baseXp = Math.max(8, Math.round(xpToNext(lv) * amount));
  const xpBoost = finite(s.highXpUntil, 0) > finite(s.playtime, 0) ? Math.max(1, finite(s.highXp, 1)) : 1;
  const xp = Math.max(1, Math.round(baseXp * xpBoost));
  let trainerLevel = lv, trainerXp = finite(s.trainerXp, 0) + xp;
  while (trainerLevel < MAX_LEVEL && trainerXp >= xpToNext(trainerLevel)) { trainerXp -= xpToNext(trainerLevel); trainerLevel++; }
  s.trainerLv = trainerLevel; s.trainerXp = trainerXp;
  for (const mon of s.team) {
    if (mon.hp <= 0) continue;
    if (mon.id && DEX[mon.id]) {
      const inst = normalizePartnerForBattle(mon);
      inst.xp += xp; tryLevel(inst);
      Object.assign(mon, inst, { name: DEX[inst.id].name });
    } else {
      // Preserve unrelated legacy prototype records without assigning a new species.
      mon.xp += xp;
      while (mon.level < MAX_LEVEL && mon.xp >= xpToNext(mon.level)) { mon.xp -= xpToNext(mon.level); mon.level++; }
    }
  }
  return xp;
}

function quest(s: GrowState, id: string): void { s.quest[id] = true; s.quests[id] = "done"; }

export function plantPot(s: GrowState, index: number, seed: string, fert = ""): { ok: boolean; xp?: number; reason?: string } {
  const p = s.pots[index];
  if (!p || !slotOpen(s, index)) return { ok: false, reason: "Dieser Platz ist noch nicht freigeschaltet." };
  if (p.phase !== "empty") return { ok: false, reason: "Hier wächst bereits eine Pflanze." };
  if (ITEMS[seed]?.cat !== "seed" || !hasItem(s, seed)) return { ok: false, reason: "Der Samen fehlt im Inventar." };
  if (fert && (ITEMS[fert]?.cat !== "fert" || !hasItem(s, fert))) return { ok: false, reason: "Der Dünger fehlt im Inventar." };
  s.inventory[seed]--;
  if (fert) s.inventory[fert]--;
  const total = strainGrowBase(seed);
  Object.assign(p, emptyPot(index), { seed, fert, total, timeLeft: total, phase: "sprout" });
  delete p.careBest;
  delete p.careRewardHits;
  quest(s, "q7_grow");
  return { ok: true, xp: grantXp(s, .08) };
}

export function harvestPot(s: GrowState, index: number, random = Math.random): { ok: boolean; buds?: number; budId?: string; seedReturned?: boolean; xp?: number } {
  const p = s.pots[index];
  if (!p || !slotOpen(s, index) || p.phase !== "ready") return { ok: false };
  const yielded = previewGrowHarvest(s, index);
  if (!yielded) return { ok: false };
  const buds = yielded.buds;
  addItem(s, yielded.budId, buds);
  const seedReturned = random() < .35;
  if (seedReturned) addItem(s, p.seed, 1);
  if (!s.harvestedSeeds.includes(p.seed)) s.harvestedSeeds.push(p.seed);
  if (isGrowBox(index)) s.boxHarvests++;
  s.stats.plantsHarvested++;
  quest(s, "q2_harvest");
  if (s.boxHarvests >= 100) s.eddiIn = true;
  s.pots[index] = emptyPot(index);
  return { ok: true, buds, budId: yielded.budId, seedReturned, xp: grantXp(s, .2 * yielded.fertMul) };
}

/** The original mattress removes 30 minutes of conceptual Grow time. */
export function sleepGrow(s: GrowState): void {
  for (const p of s.pots) if (p.phase !== "empty" && p.phase !== "ready") { p.timeLeft = Math.max(0, p.timeLeft - 1800); refreshPot(p); }
}

/** Only improvements to this plant's earned score shorten its clock again. */
export function recordGrowCare(s: GrowState, index: number, hits: number, finishedGrowingRun = false): boolean {
  const p = s.pots[index];
  if (!p || !slotOpen(s, index) || p.phase === "empty" || (p.phase === "ready" && !finishedGrowingRun) || ITEMS[p.seed]?.cat !== "seed" || !Number.isFinite(hits)
    || !Number.isFinite(p.timeLeft) || p.timeLeft < 0 || !Number.isFinite(p.total) || p.total <= 0) return false;
  const score = careHits(hits);
  const previous = careHits(p.careRewardHits);
  p.careBest = Math.max(careHits(p.careBest), score);
  if (score > previous) {
    // Preserve the current growth fraction, including previous care reductions.
    // Persist both adjusted clocks and the earned score; normalization never reapplies it.
    const factor = (10 - score) / (10 - previous);
    p.total *= factor;
    p.timeLeft *= factor;
    p.careRewardHits = score;
    refreshPot(p);
  }
  return true;
}

export function buyGrowItem(s: GrowState, id: string): boolean {
  const def = ITEMS[id];
  if (!STALL_GROW.includes(id) || !def?.buy || !Number.isFinite(s.gold) || s.gold < def.buy) return false;
  s.gold -= def.buy; addItem(s, id, 1);
  return true;
}

export function buyNextSlot(s: GrowState, box: boolean): boolean {
  const next = (box ? BOX_UNLOCK : POT_UNLOCK).find(p => p.slot === (box ? s.boxesUnlocked : s.potsUnlocked) + 1);
  if (!next || !Number.isFinite(s.gold) || s.gold < next.price) return false;
  s.gold -= next.price;
  if (box) s.boxesUnlocked++; else s.potsUnlocked++;
  return true;
}

export function sellGrowBud(s: GrowState, id: string): number {
  const def = ITEMS[id];
  if (def?.cat !== "bud" || !def.sell || !hasItem(s, id) || !Number.isFinite(s.gold)) return 0;
  // Original Grow-shop sell multiplier, rounded the same as the original shop.
  const price = Math.max(1, Math.round(def.sell * .95));
  s.inventory[id]--; s.gold += price;
  s.stats.budsSold = (s.stats.budsSold ?? 0) + 1;
  s.stats.goldEarned = (s.stats.goldEarned ?? 0) + price;
  return price;
}
