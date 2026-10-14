import type { Save } from "./save";
import { DEX } from "./data/dex";
import { DISTRICTS } from "./data/zones";
import { QUEST_DEFS, type QuestDef } from "./data/quests";

export type QuestState = "inactive" | "active" | "done";
export type QuestProgress = { current: number; target: number; eligible: boolean; done: boolean };

const LOWTOWN_THREADS = ["q1_bolt", "q2_harvest", "q3_trash", "q4_fight", "q5_silk", "q6_nude", "q7_grow", "q8_mattress", "q9_static"];
const SPECIES_NAMES = new Map(Object.values(DEX).map(species => [species.name, species.id]));
const finite = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const isDone = (s: Save, id: string) => s.quests?.[id] === "done" || s.quest?.[id] === true;

/** The original board uses owned species' home district, not the capture map. */
function caughtSpecies(s: Save): Set<string> {
  const ids = [...strings(s.caught), ...s.collection, ...s.team.map(mon => mon.id ?? mon.name), ...s.box.map(mon => mon.id ?? mon.name)];
  return new Set(ids.map(id => SPECIES_NAMES.get(id) ?? id).filter(id => !!DEX[id]));
}

function openedContainers(s: Save): number {
  // The source counts distinct container IDs with a positive search timestamp.
  return Object.values(record(s.searchedBins)).filter(time => finite(time) > 0).length;
}

function grantFlag(s: Save, id: string): boolean {
  const achievements = record(s.ach);
  if (achievements[id] === "done") return false;
  achievements[id] = "done";
  s.ach = achievements;
  return true;
}

function completeLowtown(s: Save): boolean {
  if (!s.flagLowtown && !isDone(s, "q10_lowtown") && !LOWTOWN_THREADS.every(id => isDone(s, id))) return false;
  let changed = false;
  if (s.quests.q10_lowtown !== "done") { s.quests.q10_lowtown = "done"; changed = true; }
  if (s.quest.q10_lowtown !== true) { s.quest.q10_lowtown = true; changed = true; }
  if (!s.flagLowtown) { s.flagLowtown = true; changed = true; }
  return grantFlag(s, "lowtown_all") || changed;
}

/** Keep the original string states and legacy 3D completion booleans in sync. */
export function setQuestState(s: Save, id: string, state: QuestState): boolean {
  s.quests ??= {};
  s.quest ??= {};
  // Existing completed progress is never lost through dialogue or migration.
  const next = isDone(s, id) ? "done" : state;
  let changed = false;
  if (s.quests[id] !== next) { s.quests[id] = next; changed = true; }
  if (s.quest[id] !== (next === "done")) { s.quest[id] = next === "done"; changed = true; }
  return completeLowtown(s) || changed;
}

/** Source conditions plus counters for the 3D quest journal. No state mutation. */
export function questProgress(s: Save, def: QuestDef): QuestProgress {
  const completed = isDone(s, def.id);
  const level = def.id === "q_ben" ? finite(s.trainerLv, 1) : Math.max(1, finite(s.trainerLv, 1), ...s.team.map(mon => finite(mon.level, 1)));
  const eligible = level >= (def.minLv ?? 1);
  let current = completed ? 1 : 0;
  let target = 1;
  if (def.need) {
    const owned = caughtSpecies(s);
    if (def.need === "catch") current = [...owned].filter(id => DEX[id].district === def.district && !DEX[id].legendary).length;
    else if (def.need === "legend") current = [...owned].filter(id => DEX[id].legendary).length;
    else if (def.need === "visit") current = strings(s.visitedMaps).includes(def.district ?? "") || s.map === def.district ? 1 : 0;
    else if (def.need === "kinds") { current = owned.size; target = def.n ?? 3; }
  } else if (def.id === "q3_trash") { current = openedContainers(s); target = 3; }
  else if (def.id === "q10_lowtown") { current = LOWTOWN_THREADS.filter(id => isDone(s, id)).length; target = LOWTOWN_THREADS.length; }
  else if (def.id === "q2_harvest") current = finite(s.stats.plantsHarvested);
  else if (def.id === "q4_fight") current = Math.max(s.wins, finite(s.stats.battlesWon));
  else if (def.id === "q7_grow") current = s.pots.some(pot => !!pot.seed && pot.phase !== "empty") || finite(s.stats.plantsHarvested) > 0 ? 1 : 0;
  if (completed) current = Math.max(current, target);
  return { current: Math.min(current, target), target, eligible, done: completed };
}

/**
 * Recover existing source progress, then settle board quests exactly once.
 * The source board completes satisfied conditions even below the displayed
 * recommended level, and its 15 + round(minLv / 2) gold reward is unmultiplied.
 */
export function syncQuests(s: Save): boolean {
  let changed = false;
  s.quests ??= {};
  s.quest ??= {};
  for (const def of QUEST_DEFS) {
    const state = s.quests[def.id];
    const next = isDone(s, def.id) ? "done" : state === "active" ? "active" : "inactive";
    if (s.quests[def.id] !== next) { s.quests[def.id] = next; changed = true; }
    if (s.quest[def.id] !== (next === "done")) { s.quest[def.id] = next === "done"; changed = true; }
  }

  const recover = (id: string, condition: boolean) => {
    if (condition) changed = setQuestState(s, id, "done") || changed;
  };
  const containers = openedContainers(s);
  if (containers > 0) changed = setQuestState(s, "q3_trash", containers >= 3 ? "done" : "active") || changed;
  recover("q2_harvest", finite(s.stats.plantsHarvested) > 0);
  recover("q4_fight", Math.max(s.wins, finite(s.stats.battlesWon)) > 0);
  recover("q5_silk", finite(s.catchPerm, 1) >= 1.08 || finite(s.budsSoldToSilk) > 0);
  recover("q6_nude", s.leftCapsuleNude === true);
  recover("q7_grow", s.pots.some(pot => !!pot.seed && pot.phase !== "empty") || finite(s.stats.plantsHarvested) > 0);
  recover("q8_mattress", finite(s.stats.sexEvents) > 0);
  recover("q_ben", s.benRead === true);
  if (!isDone(s, "q_ben") && finite(s.trainerLv, 1) >= 10) changed = setQuestState(s, "q_ben", "active") || changed;

  for (const def of QUEST_DEFS) {
    if (!def.need || isDone(s, def.id)) continue;
    const progress = questProgress(s, def);
    if (progress.current >= progress.target) {
      changed = setQuestState(s, def.id, "done") || changed;
      s.gold += 15 + Math.round((def.minLv ?? 1) / 2);
      changed = true;
    } else if (progress.eligible && s.quests[def.id] === "inactive") {
      changed = setQuestState(s, def.id, "active") || changed;
    }
  }
  return completeLowtown(s) || changed;
}

/** Record a reached map and the original three-/ten-district achievement flags. */
export function recordVisit(s: Save, mapId: string): boolean {
  const existing = strings(s.visitedMaps);
  let changed = !Array.isArray(s.visitedMaps);
  if (!Array.isArray(s.visitedMaps)) s.visitedMaps = existing;
  if (!existing.includes(mapId)) {
    (s.visitedMaps as string[]).push(mapId);
    changed = true;
  }
  const visited = strings(s.visitedMaps);
  if (["alley", "yard", "cable"].every(id => visited.includes(id))) changed = grantFlag(s, "kiez_3") || changed;
  const districts = DISTRICTS.map(district => district.map).filter((map): map is string => !!map);
  if (districts.every(id => visited.includes(id))) changed = grantFlag(s, "kiez_10") || changed;
  return syncQuests(s) || changed;
}
