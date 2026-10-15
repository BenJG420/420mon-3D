import { ACH_DEFS, achMet } from "./data/achievements";
import type { AchDef, AchSnap } from "./data/achievements";
import { DEX_ORDER } from "./data/dex";
import type { Save } from "./save";

const definitions = new Map(ACH_DEFS.map(def => [def.id, def]));
const species = new Set(DEX_ORDER);
const statKeys = ["battlesWon", "monsCaught", "binsSearched", "budsSold", "plantsHarvested", "goldEarned", "steps", "nudeSeconds", "sexEvents", "chipsUsed"] as const;
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && !!entry) : [];
const unique = (value: unknown): string[] => [...new Set(strings(value))];
const amount = (value: unknown, fallback = 0): number => typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : fallback;
const sameArray = (value: unknown, next: string[]) => Array.isArray(value) && value.length === next.length && value.every((entry, i) => entry === next[i]);

/** Normalize only achievement-owned state; unknown save extensions remain intact. */
export function ensureAchievementState(s: Save): boolean {
  let changed = false;
  const raw = record(s.ach);
  const ach = Object.fromEntries(Object.entries(raw).filter(([id, value]) => !definitions.has(id) || value === "done" || value === "locked"));
  if (s.ach !== raw || Object.keys(raw).length !== Object.keys(ach).length) {
    s.ach = ach;
    changed = true;
  }
  for (const key of ["achTips", "achClaimed"] as const) {
    const next = unique(s[key]).filter(id => definitions.has(id));
    if (!sameArray(s[key], next)) { s[key] = next; changed = true; }
  }
  const worn = unique(s.worn).filter(id => id.startsWith("wear_"));
  const outfit = typeof s.outfit === "string" ? s.outfit === "bag" || s.outfit === "clothed" ? "wear_trashbag" : s.outfit : undefined;
  if (outfit?.startsWith("wear_") && !worn.includes(outfit)) worn.push(outfit);
  if (!sameArray(s.worn, worn)) { s.worn = worn; changed = true; }
  return changed;
}

function party(value: unknown): NonNullable<AchSnap["party"]> {
  if (!Array.isArray(value)) return [];
  return value.flatMap(entry => {
    const mon = record(entry);
    if (typeof mon.id !== "string" || !species.has(mon.id)) return [];
    const iv = record(mon.ivs);
    const keys = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
    const ivs = keys.every(key => typeof iv[key] === "number" && Number.isFinite(iv[key]) && Number(iv[key]) >= 0)
      ? Object.fromEntries(keys.map(key => [key, iv[key]])) as NonNullable<NonNullable<AchSnap["party"]>[number]["ivs"]>
      : undefined;
    return [{ id: mon.id, level: amount(mon.level, 1), ...(ivs ? { ivs } : {}) }];
  });
}

/** Read-only bridge between current 3D saves and the unchanged 2D predicates. */
export function achievementSnapshot(s: Save): AchSnap {
  const ownedParty = party(Array.isArray(s.team) ? s.team : s.party);
  const box = party(s.box);
  const caught = [...new Set([
    ...strings(s.collection), ...strings(s.caught),
    ...ownedParty.map(mon => mon.id!), ...box.map(mon => mon.id!),
  ].filter(id => species.has(id)))];
  const seen = [...new Set([...strings(s.seen), ...caught].filter(id => species.has(id)))];
  const rawStats = record(s.stats);
  const stats = Object.fromEntries(statKeys.map(key => [key, amount(rawStats[key])])) as NonNullable<AchSnap["stats"]>;
  stats.battlesWon = Math.max(stats.battlesWon ?? 0, amount(s.wins));
  stats.monsCaught = Math.max(stats.monsCaught ?? 0, amount(s.captures));
  const quests = Object.fromEntries(Object.entries(record(s.quests)).filter(([, value]) => typeof value === "string")) as Record<string, string>;
  const worn = unique(s.worn).filter(id => id.startsWith("wear_"));
  const outfit = typeof s.outfit === "string" ? s.outfit === "bag" || s.outfit === "clothed" ? "wear_trashbag" : s.outfit : undefined;
  return {
    caught, seen, party: ownedParty, box, stats, quests,
    visitedMaps: unique(s.visitedMaps), deadWild: unique(s.deadWild),
    trainerLv: amount(s.trainerLv, 1), gold: amount(s.gold),
    potsUnlocked: amount(s.potsUnlocked, 2), boxesUnlocked: amount(s.boxesUnlocked),
    harvestedSeeds: unique(s.harvestedSeeds), catchPerm: amount(s.catchPerm, 1),
    stickFound: s.stickFound === true, flagLowtown: s.flagLowtown === true,
    leftCapsuleNude: s.leftCapsuleNude === true, felixHired: s.felixHired === true,
    eddiIn: s.eddiIn === true, schnittTitle: s.schnittTitle === true,
    starterId: typeof s.starterId === "string" && species.has(s.starterId) ? s.starterId : "",
    playtime: amount(s.playtime), foundLoot: unique(s.foundLoot), worn, outfit,
    budsSoldToSilk: amount(s.budsSoldToSilk),
  };
}

/** Never revoke legacy or explicitly granted flags (including Silk's source grant). */
export function syncAchievements(s: Save): string[] {
  ensureAchievementState(s);
  const ach = s.ach as Record<string, unknown>;
  const snapshot = achievementSnapshot(s);
  const newlyDone: string[] = [];
  for (const def of ACH_DEFS) {
    if (ach[def.id] === "done" || !achMet(snapshot, def.id)) continue;
    ach[def.id] = "done";
    newlyDone.push(def.id);
  }
  return newlyDone;
}

/** User-requested claim reward; source tip prices and predicates stay unchanged. */
export function achievementReward(defOrId: AchDef | string): number {
  const def = definitions.get(typeof defOrId === "string" ? defOrId : defOrId.id);
  return def ? def.secret ? 25 : 10 : 0;
}

export function achievementCounts(s: Save): { done: number; total: number; claimable: number; claimed: number; tips: number } {
  const ach = record(s.ach);
  const claimed = new Set(strings(s.achClaimed).filter(id => definitions.has(id)));
  const done = ACH_DEFS.filter(def => ach[def.id] === "done");
  return {
    done: done.length, total: ACH_DEFS.length,
    claimable: done.filter(def => !claimed.has(def.id)).length,
    claimed: claimed.size,
    tips: new Set(strings(s.achTips).filter(id => definitions.has(id))).size,
  };
}

export function buyAchievementTip(s: Save, id: string): { ok: boolean; lines: string[] } {
  syncAchievements(s);
  const def = definitions.get(id);
  if (!def) return { ok: false, lines: ["Can: Diese Seite gibt es nicht."] };
  if ((s.ach as Record<string, unknown>)[id] === "done") return { ok: false, lines: ["Can: Den hast du schon."] };
  const tips = s.achTips as string[];
  if (tips.includes(id)) return { ok: false, lines: ["Can: Den Tipp hast du schon."] };
  if (amount(s.gold) < def.price) return { ok: false, lines: [`Can: Zu wenig Softcash. Der Tipp kostet ${def.price}.`] };
  s.gold -= def.price;
  tips.push(id);
  return { ok: true, lines: [`Can: ${def.price} Softcash. Der Tipp liegt im Buch.`] };
}

export function claimAchievementReward(s: Save, id: string): { ok: boolean; gold: number; lines: string[] } {
  syncAchievements(s);
  const def = definitions.get(id);
  if (!def) return { ok: false, gold: 0, lines: ["Can: Diese Seite gibt es nicht."] };
  if ((s.ach as Record<string, unknown>)[id] !== "done") return { ok: false, gold: 0, lines: ["Can: Diese Seite musst du erst verdienen."] };
  const claimed = s.achClaimed as string[];
  if (claimed.includes(id)) return { ok: false, gold: 0, lines: ["Can: Die Belohnung hast du schon."] };
  const gold = settleRewards(s, [id]);
  return { ok: true, gold, lines: [`Can: ${def.name}. ${gold} Softcash für dich.`] };
}

function settleRewards(s: Save, ids: string[]): number {
  const gold = ids.reduce((total, id) => total + achievementReward(id), 0);
  // Mark the complete snapshot before paying. Repeated callbacks cannot pay
  // these pages again, and newly met earning thresholds require another claim.
  (s.achClaimed as string[]).push(...ids);
  s.gold = amount(s.gold) + gold;
  const stats = record(s.stats);
  s.stats = { ...stats, goldEarned: amount(stats.goldEarned) + gold } as Record<string, number>;
  syncAchievements(s);
  return gold;
}

/** Claim the pages available at this visit's click, without recursive payouts. */
export function claimAchievementRewards(s: Save): { ok: boolean; gold: number; count: number; lines: string[] } {
  syncAchievements(s);
  const ach = s.ach as Record<string, unknown>;
  const claimed = new Set(s.achClaimed as string[]);
  const ids = ACH_DEFS.filter(def => ach[def.id] === "done" && !claimed.has(def.id)).map(def => def.id);
  if (!ids.length) return { ok: false, gold: 0, count: 0, lines: ["Can: Alle verdienten Belohnungen sind schon bei dir."] };
  const gold = settleRewards(s, ids);
  return { ok: true, gold, count: ids.length, lines: [`Can: ${ids.length} Belohnungen. ${gold} Softcash für dich.`] };
}
