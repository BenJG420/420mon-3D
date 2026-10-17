import { MACHINES, JACKPOT_CHIP, JACKPOT_N, JACKPOT_SEED, LINE_BET_MAX, LINE_BET_MIN, evalGrid, playSpin, stakeTotal, type Machine, type SpinResult, type Grid } from "./slot-rules";
import { UNIQUE_FIND } from "./data/items";
import type { Save } from "./save";

export type SlotReceipt = {
  machine: Machine["id"]; lines: number; bet: number; free: boolean;
  stake: number; payout: number; balanceBefore: number; result: SpinResult;
};
export type SlotState = {
  version: 1;
  freeLeft: number; freeBet: number; freeLines: number;
  last: SlotReceipt | null;
};
const record = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const integer = (v: unknown, low: number, high: number): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= low && v <= high;
const validBet = (v: unknown): v is number => integer(v, LINE_BET_MIN, LINE_BET_MAX);
const machineFor = (id: unknown) => MACHINES.find(m => m.id === id);

/** New isolated save field; legacy/original saves need no migration or payout replay. */
export function readSlotState(s: Save): SlotState {
  const raw = record(s.slotState), free = MACHINES.find(m => m.id === "free")!;
  const bankValid = raw.version === 1 && integer(raw.freeLeft, 0, Number.MAX_SAFE_INTEGER) && validBet(raw.freeBet) && integer(raw.freeLines, 1, free.lines.length);
  const state: SlotState = { version: 1, freeLeft: bankValid ? raw.freeLeft as number : 0, freeBet: bankValid ? raw.freeBet as number : 1, freeLines: bankValid ? raw.freeLines as number : 1, last: null };
  const last = record(raw.last), machine = machineFor(last.machine), result = record(last.result);
  if (!machine || !validBet(last.bet) || !integer(last.lines, 1, machine.lines.length) || typeof last.free !== "boolean" || last.free && machine.id !== "free") return state;
  const grid = result.grid;
  if (!Array.isArray(grid) || grid.length !== machine.reels || !grid.every(col => Array.isArray(col) && col.length === machine.rows && col.every(sym => machine.cycle.includes(sym)))) return state;
  const evaluated = evalGrid(machine, grid as Grid, last.lines, last.bet);
  if (last.free) evaluated.total *= 2;
  state.last = {
    machine: machine.id, lines: last.lines, bet: last.bet, free: last.free,
    stake: last.free ? 0 : stakeTotal(last.lines, last.bet, machine.lines.length), payout: evaluated.total,
    balanceBefore: typeof last.balanceBefore === "number" && Number.isFinite(last.balanceBefore) ? last.balanceBefore : 0,
    result: evaluated,
  };
  return state;
}

export type SlotSpin = { ok: true; receipt: SlotReceipt } | { ok: false; reason: string };
/** One synchronous booking before animation: exit/reload cannot lose or duplicate an outcome. */
export function settleSlotSpin(s: Save, id: unknown, lines: unknown, bet: unknown, persist: () => boolean, rng: () => number = Math.random): SlotSpin {
  const machine = machineFor(id);
  if (!machine || !validBet(bet) || !integer(lines, 1, machine.lines.length)) return { ok: false, reason: "Einsatz oder Linien ungültig." };
  const bank = readSlotState(s), free = machine.frees && bank.freeLeft > 0;
  if (free && (bet !== bank.freeBet || lines !== bank.freeLines)) return { ok: false, reason: "Freispiele bleiben beim gewonnenen Einsatz und denselben Linien." };
  const stake = free ? 0 : stakeTotal(lines, bet, machine.lines.length);
  if (typeof s.gold !== "number" || !Number.isFinite(s.gold) || s.gold < stake || s.gold < 0) return { ok: false, reason: "Nicht genug Softcash." };
  const result = playSpin(machine, lines, bet, rng);
  if (free) result.total *= 2;
  const balance = s.gold - stake + result.total;
  if (!Number.isFinite(balance) || balance > Number.MAX_SAFE_INTEGER) return { ok: false, reason: "Dieser Gewinn kann nicht sicher verbucht werden." };
  const before = { ...s }, draft = structuredClone(s);
  // Live battle/Grow systems retain these exact partner/pot references.
  draft.team = s.team; draft.box = s.box; draft.pots = s.pots;
  const receipt: SlotReceipt = { machine: machine.id, lines, bet, free, stake, payout: result.total, balanceBefore: s.gold, result };
  draft.gold = balance;
  draft.stats.goldEarned = Math.max(0, Number.isFinite(draft.stats.goldEarned) ? draft.stats.goldEarned : 0) + result.total;
  if (result.jackpot) {
    const found = Array.isArray(draft.foundLoot) ? [...draft.foundLoot] as string[] : [];
    for (const item of [JACKPOT_SEED, JACKPOT_CHIP]) {
      draft.inventory[item] = (draft.inventory[item] ?? 0) + JACKPOT_N;
      if (UNIQUE_FIND.includes(item) && !found.includes(item)) found.push(item);
    }
    draft.foundLoot = found;
  }
  if (machine.frees) {
    bank.freeLeft = bank.freeLeft - (free ? 1 : 0) + result.freeAward;
    bank.freeBet = bet; bank.freeLines = lines;
  }
  bank.last = receipt; draft.slotState = bank;
  Object.assign(s, draft);
  let saved = false;
  try { saved = persist(); } catch { /* The original balance and object references are restored below. */ }
  if (!saved) {
    for (const key of Object.keys(s)) if (!(key in before)) delete s[key];
    Object.assign(s, before);
    return { ok: false, reason: "Nicht gespeichert. Kein Einsatz abgebucht. Bitte Speicherplatz prüfen und erneut drehen." };
  }
  return { ok: true, receipt };
}
