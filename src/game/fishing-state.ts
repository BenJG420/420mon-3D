/** Fishing rules from the 2D fishPlay/fishSession implementation.
 * A failed cast returns its bait seed under the latest user rule.
 */
import { battleGoldReward } from "./battle-rewards";
import { fishForBait, rollFish, tankFull, trashOdds, type FishDef } from "./data/fish";
import { ITEMS } from "./data/items";
import type { Save } from "./save";

export type FishPhase = "pick" | "wait" | "wheel" | "done";
export type PendingFishCast = { token: string; bait: string };
export type FishSession = {
  phase: FishPhase;
  target: FishDef | null;
  bait: string;
  junk: boolean;
  zone: number;
  zone0: number;
  spin: number;
  t0: number;
  waitMs: number;
  hit: boolean;
  hits: number;
  missId: string;
  paid: number;
  hookAt: number;
  token: string;
};

export function createFishSession(): FishSession {
  return { phase: "pick", target: null, bait: "", junk: false, zone: .2, zone0: 0,
    spin: .55, t0: 0, waitMs: 0, hit: false, hits: 0, missId: "", paid: 0,
    hookAt: -Infinity, token: "" };
}

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const count = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
const usableBait = (id: string): boolean => ITEMS[id]?.cat === "seed" && fishForBait(id).length > 0;
let castSerial = 0;

/** Original migration: historical aquarium catches become inventory once. */
export function ensureFishState(s: Save): void {
  s.fishCaught = Object.fromEntries(Object.entries(record(s.fishCaught)).map(([id, amount]) => [id, count(amount)]));
  if (s.fishStocked !== true) {
    for (const [id, amount] of Object.entries(s.fishCaught as Record<string, number>)) {
      if (!id.startsWith("fish_") || amount <= 0) continue;
      s.inventory[id] = count(s.inventory[id]) + Math.min(99, amount);
    }
    s.fishStocked = true;
  }
}

function pendingCast(s: Save): PendingFishCast | undefined {
  const pending = record(s.pendingFishCast);
  if (typeof pending.token !== "string" || !pending.token || typeof pending.bait !== "string" || !usableBait(pending.bait)) return undefined;
  return { token: pending.token, bait: pending.bait };
}

/** Call once when opening the game, never when opening the fishing panel. */
export function recoverInterruptedCast(s: Save): boolean {
  const pending = pendingCast(s);
  if (!pending) {
    if (s.pendingFishCast !== undefined) { delete s.pendingFishCast; return true; }
    return false;
  }
  // Clear ownership before returning the seed, so repeated calls cannot pay twice.
  delete s.pendingFishCast;
  s.inventory[pending.bait] = count(s.inventory[pending.bait]) + 1;
  return true;
}

/** Caller persists immediately after success, before showing the waiting cast. */
export function startCast(s: Save, session: FishSession, seedId: string, now: number, random: () => number = Math.random): { ok: boolean; reason?: string } {
  if (session.phase === "wait" || session.phase === "wheel" || pendingCast(s)) return { ok: false, reason: "Die Rute ist schon draußen." };
  if (!Number.isFinite(now)) return { ok: false, reason: "Der Wurf konnte nicht starten." };
  if (ITEMS[seedId]?.cat !== "seed") return { ok: false, reason: "Köder ist ein Weed-Samen." };
  if (!fishForBait(seedId).length) return { ok: false, reason: "Der Samen ködert hier nichts." };
  if (count(s.inventory[seedId]) < 1) return { ok: false, reason: "Kein Samen." };
  const sample = () => Math.min(1 - Number.EPSILON, Math.max(0, Number(random()) || 0));
  const junk = sample() < trashOdds(seedId);
  const target = junk ? null : rollFish(seedId, sample);
  const zone = junk ? .24 : target?.zone ?? .2;
  const token = globalThis.crypto?.randomUUID?.() ?? `fish-${Date.now().toString(36)}-${++castSerial}`;
  const zone0 = sample() * (1 - zone);
  const waitMs = 2000 + Math.floor(sample() * 6001);
  // One save contains both the paid seed and its recoverable pending cast.
  s.pendingFishCast = { token, bait: seedId };
  s.inventory[seedId] = count(s.inventory[seedId]) - 1;
  Object.assign(session, createFishSession(), { phase: "wait", target, bait: seedId, junk,
    zone, zone0, spin: .55, t0: now, waitMs, token });
  return { ok: true };
}

export function readyFish(session: FishSession, now: number): boolean {
  if (session.phase !== "wait" || !Number.isFinite(now) || now - session.t0 < session.waitMs) return false;
  session.phase = "wheel";
  session.t0 = now;
  return true;
}

export function fishMarker(session: FishSession, now: number): number {
  if (session.phase !== "wheel" || !Number.isFinite(now)) return 0;
  const turns = Math.max(0, now - session.t0) / 1000 * session.spin;
  return turns - Math.floor(turns);
}

export function fishInZone(session: FishSession, pos: number): boolean {
  if (!Number.isFinite(pos) || session.zone <= 0) return false;
  const relative = ((pos - session.zone0) % 1 + 1) % 1;
  return relative < session.zone;
}

function ownsCast(s: Save, session: FishSession): boolean {
  const pending = pendingCast(s);
  return !!pending && pending.token === session.token && pending.bait === session.bait;
}

function finish(session: FishSession): void {
  session.phase = "done";
  session.hit = false;
  session.hits = 0;
  session.missId = "";
  session.paid = 0;
}

function returnBait(s: Save, session: FishSession, line: string): string[] {
  delete s.pendingFishCast;
  s.inventory[session.bait] = count(s.inventory[session.bait]) + 1;
  finish(session);
  session.missId = line;
  return [line, `Ein ${ITEMS[session.bait]?.name ?? "Weed-Samen"} zurück in der Tasche.`];
}

export function hookFish(s: Save, session: FishSession, now: number, shownPosition?: number): { ok: boolean; lines: string[] } {
  if (session.phase !== "wheel" || !ownsCast(s, session) || !Number.isFinite(now) || now - session.hookAt < 280) return { ok: false, lines: [] };
  if (!session.junk && !session.target) return { ok: false, lines: [] };
  session.hookAt = now;
  const position = shownPosition ?? fishMarker(session, now);
  if (!fishInZone(session, position)) return { ok: true, lines: returnBait(s, session, "Daneben. Der Samen kommt zurück.") };
  if (session.junk) return { ok: true, lines: returnBait(s, session, "Kein Fisch am Haken. Ein Samen statt Müll.") };
  const target = session.target!;
  ensureFishState(s);
  const caught = s.fishCaught as Record<string, number>;
  const first = count(caught[target.id]) === 0;
  // Claim the pending cast before awarding inventory/gold; duplicate hooks do nothing.
  delete s.pendingFishCast;
  caught[target.id] = count(caught[target.id]) + 1;
  s.inventory[target.id] = count(s.inventory[target.id]) + 1;
  const gold = battleGoldReward(s, target.payout);
  s.gold += gold;
  s.stats.goldEarned = count(s.stats.goldEarned) + gold;
  if (s.stats.goldEarned >= 1000) s.ach = { ...record(s.ach), gold_1000: "done" };
  finish(session);
  session.hit = true;
  session.hits = 1;
  session.paid = gold;
  const lines = [`${target.name}. +${gold} Softcash.`, first ? "In der Tasche und im Becken." : "In der Tasche."];
  if (first && tankFull(caught)) lines.push("Das Becken ist voll. In der Kapsel ticken die Töpfe schneller.");
  return { ok: true, lines };
}

export function abortFish(s: Save, session: FishSession): { changed: boolean; lines: string[] } {
  if (session.phase !== "wait" && session.phase !== "wheel") return { changed: false, lines: [] };
  if (!ownsCast(s, session)) { finish(session); return { changed: false, lines: [] }; }
  return { changed: true, lines: returnBait(s, session, "Rute eingeholt. Der Samen kommt zurück.") };
}
