import { DEX } from "./data/dex";
import { clampLevel } from "./data/progress";
import { ensureFishState } from "./fishing-state";
import { syncQuests } from "./quests";
import { syncAchievements } from "./achievements";
import { normalizeClothing } from "./clothing-state";
import type { Wardrobe } from "./wardrobe";
import { makeInst, rollIvs } from "./battle";
import { GROW_SLOTS, POT_START, POT_MAX, BOX_MAX } from "./data/items";

const LEGACY_3D_KEY = "420mon-progress-v1";
export const saveKeyForBase = (base = "") => base.endsWith("/test/") ? "420mon-test-progress-v1" : LEGACY_3D_KEY;
export const SAVE_KEY = saveKeyForBase(import.meta.env?.BASE_URL);
const ORIGINAL_KEY = "420mon_save_v1";
const LEGACY_HP: Record<string, number> = { Neonix: 35, Voltling: 42, Noctra: 50, Pyrox: 47 };

export type Partner = {
  uid?: string;
  id?: string;
  name: string;
  level: number;
  xp: number;
  hp: number;
  hpMax?: number;
  moves?: string[];
  status?: string;
  ivs?: Record<string, number>;
  [key: string]: unknown;
};

export type GrowPot = {
  id: number;
  seed: string;
  fert: string;
  phase: "empty" | "sprout" | "grow" | "bloom" | "ready";
  timeLeft: number;
  total: number;
  byFelix?: boolean;
  eddiBoost?: boolean;
  careBest?: number;
  /** Earned bonus for this planting; legacy cosmetic scores do not award it. */
  careRewardHits?: number;
};

export type Save = {
  version: number;
  captures: number;
  wins: number;
  balls: number;
  team: Partner[];
  box: Partner[];
  collection: string[];
  gold: number;
  inventory: Record<string, number>;
  quest: Record<string, boolean>;
  quests: Record<string, string>;
  pots: GrowPot[];
  potsUnlocked: number;
  boxesUnlocked: number;
  harvestedSeeds: string[];
  boxHarvests: number;
  stats: Record<string, number>;
  schnittTitle: boolean;
  eddiIn: boolean;
  lastGrowAt: number;
  growInitialized?: boolean;
  eddiSeed?: boolean;
  outfit?: string;
  wardrobe?: Wardrobe;
  flagLowtown?: boolean;
  deadWild: string[];
  fishCaught?: Record<string, number>;
  fishStocked?: boolean;
  map?: string;
  x?: number;
  y?: number;
  [key: string]: unknown;
};

const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const nonnegative = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : fallback;
const integer = (value: unknown, fallback = 0) => Math.floor(nonnegative(value, fallback));
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && !!entry) : [];
const counts = (value: unknown): Record<string, number> => Object.fromEntries(Object.entries(object(value)).filter(([, amount]) => typeof amount === "number" && Number.isFinite(amount) && amount >= 0).map(([id, amount]) => [id, amount as number]));
const speciesNames = new Map(Object.values(DEX).map(species => [species.name, species.id]));

export function maxHp(mon: Partner): number {
  // Original 2D instances already carry their calculated HP, including IVs.
  if (typeof mon.hpMax === "number" && Number.isFinite(mon.hpMax) && mon.hpMax > 0) return Math.max(1, Math.floor(mon.hpMax));
  const original = mon.id ? DEX[mon.id] : undefined;
  return original ? Math.max(15, Math.round(original.base.hp * (0.45 + clampLevel(mon.level) * 0.035))) : LEGACY_HP[mon.name] ?? 35;
}

/** Restore living monsters only. Returns the number whose HP changed. */
export function healLiving(team: Partner[], fraction = 1): number {
  if (!Number.isFinite(fraction) || fraction <= 0) return 0;
  let changed = 0;
  for (const mon of team) {
    if (mon.hp <= 0) continue;
    const maximum = maxHp(mon);
    const healed = Math.min(maximum, mon.hp + Math.max(1, Math.ceil(maximum * fraction)));
    if (healed > mon.hp) { mon.hp = healed; changed++; }
  }
  return changed;
}

export function partnerUid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `mon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createPartner(id: string, level = 1, hp?: number): Partner {
  const original = DEX[id];
  if (!original) throw new Error(`Unbekanntes Original-Monster: ${id}`);
  const inst = makeInst(id, level, rollIvs("starter"));
  const mon: Partner = { ...inst, uid: partnerUid(), name: original.name };
  if (hp !== undefined) mon.hp = Math.min(inst.hpMax, nonnegative(hp));
  return mon;
}

function partners(value: unknown, prefix: string): Partner[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    const raw = object(entry);
    const id = typeof raw.id === "string" && DEX[raw.id] ? raw.id : typeof raw.name === "string" ? speciesNames.get(raw.name) : undefined;
    const name = id ? DEX[id].name : typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) return [];
    const mon: Partner = {
      ...raw,
      uid: typeof raw.uid === "string" && raw.uid ? raw.uid : `${prefix}-${index}-${id ?? name}`,
      ...(id ? { id } : {}),
      name,
      level: clampLevel(typeof raw.level === "number" ? raw.level : 1),
      xp: nonnegative(raw.xp),
      hp: nonnegative(raw.hp, 1),
    };
    if (typeof raw.hpMax !== "number" || !Number.isFinite(raw.hpMax) || raw.hpMax <= 0) delete mon.hpMax;
    // A legacy save may have more HP than an old approximation allowed. Preserve it.
    if (mon.hp > maxHp(mon)) mon.hpMax = Math.ceil(mon.hp);
    if (Array.isArray(raw.moves)) mon.moves = strings(raw.moves);
    return [mon];
  });
}

function collection(value: unknown, owned: Partner[]): string[] {
  return [...new Set([...strings(value), ...owned.map(mon => mon.id ?? mon.name)].map(id => speciesNames.get(id) ?? id))];
}

function pots(value: unknown): GrowPot[] {
  const source = Array.isArray(value) ? value : [];
  return Array.from({ length: GROW_SLOTS }, (_, id) => {
    const raw = object(source.find(entry => object(entry).id === id));
    const seed = typeof raw.seed === "string" ? raw.seed : "";
    const phase = ["sprout", "grow", "bloom", "ready"].includes(String(raw.phase)) && seed ? raw.phase as GrowPot["phase"] : "empty";
    return { ...raw, id, seed, fert: typeof raw.fert === "string" ? raw.fert : "", phase, timeLeft: nonnegative(raw.timeLeft), total: nonnegative(raw.total) } as GrowPot;
  });
}

function normalize(raw: Record<string, unknown>, fresh = false, original = false): Save {
  const originalStats = counts(raw.stats);
  const allTeam = partners(raw.team ?? (original ? raw.party : undefined), "team");
  const team = allTeam.slice(0, 6);
  const box = [...partners(raw.box, "box"), ...allTeam.slice(6)];
  const inventory = counts(raw.inventory ?? raw.inv);
  if (fresh) Object.assign(inventory, { key_dex: 1, wear_trashbag: 1, chip_junk: 3, seed_ordinary: 1, potion_patch: 2, joint_street: 1 });
  return {
    ...raw,
    version: 2,
    captures: integer(raw.captures, originalStats.monsCaught ?? 0),
    wins: integer(raw.wins, originalStats.battlesWon ?? 0),
    balls: integer(raw.balls, 12),
    team, box,
    collection: collection(raw.collection ?? raw.caught, [...team, ...box]),
    gold: integer(raw.gold, fresh ? 40 : 150), inventory,
    quest: Object.fromEntries(Object.entries(object(raw.quest)).filter(([, done]) => typeof done === "boolean")) as Record<string, boolean>,
    quests: Object.fromEntries(Object.entries(object(raw.quests)).filter(([, state]) => typeof state === "string")) as Record<string, string>,
    pots: pots(raw.pots),
    potsUnlocked: Math.max(POT_START, Math.min(POT_MAX, integer(raw.potsUnlocked, POT_START))),
    boxesUnlocked: Math.min(BOX_MAX, integer(raw.boxesUnlocked)),
    harvestedSeeds: [...new Set(strings(raw.harvestedSeeds))],
    boxHarvests: integer(raw.boxHarvests),
    stats: originalStats,
    schnittTitle: raw.schnittTitle === true,
    eddiIn: raw.eddiIn === true,
    deadWild: [...new Set(strings(raw.deadWild))],
    lastGrowAt: nonnegative(raw.lastGrowAt, typeof raw.lastUnix === "number" && raw.lastUnix > 0 ? raw.lastUnix * 1000 : Date.now()),
    ...(original ? { migratedFrom: ORIGINAL_KEY } : {}),
  };
}

function readSlot(key: string): Record<string, unknown> | null {
  try {
    const raw = object(JSON.parse(localStorage.getItem(key) ?? "null"));
    return Object.keys(raw).length && ["team", "party", "gold", "balls", "pots", "captures"].some(field => field in raw) ? raw : null;
  } catch { return null; }
}

let current: Save | undefined;

/** One shared object keeps active battle references alive when menus save. */
export function getSave(): Save {
  if (!current) {
    const legacy = readSlot(SAVE_KEY) ?? readSlot(`${SAVE_KEY}_bak`)
      ?? (SAVE_KEY !== LEGACY_3D_KEY ? readSlot(LEGACY_3D_KEY) ?? readSlot(`${LEGACY_3D_KEY}_bak`) : null);
    const original = legacy ? null : readSlot(ORIGINAL_KEY) ?? readSlot(`${ORIGINAL_KEY}_bak`);
    current = normalize(legacy ?? original ?? {}, !legacy && !original, !!original);
    normalizeClothing(current);
    ensureFishState(current);
    syncQuests(current);
    syncAchievements(current);
  }
  return current;
}

/** Persist the current shared state, preserving fields owned by other systems. */
export function saveProgress(next?: Partial<Save>): boolean {
  const save = getSave();
  if (next && next !== save) Object.assign(save, next);
  normalizeClothing(save);
  const unique = collection(save.collection, [...save.team, ...save.box]);
  save.collection.splice(0, save.collection.length, ...unique);
  syncQuests(save);
  syncAchievements(save);
  try {
    const json = JSON.stringify(save);
    const previous = localStorage.getItem(SAVE_KEY);
    // Keep a recoverable prior save without ever overwriting the original 2D slot.
    if (previous && previous !== json && readSlot(SAVE_KEY)) localStorage.setItem(`${SAVE_KEY}_bak`, previous);
    localStorage.setItem(SAVE_KEY, json);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("420mon-save-changed"));
    return true;
  } catch {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("420mon-save-error"));
    return false;
  }
}
