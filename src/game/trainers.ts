/** Trainer rules/dialogue from the original 2D runtime, revision 010807da77df. */
import { MAPS, type MapObj } from "./data/maps";
import { DEX } from "./data/dex";
import { battleGoldReward } from "./battle-rewards";
import type { Save } from "./save";

export const KIEZ_TRAINERS = ["cinder", "tide", "vial", "knuckle", "hush", "glow", "coil"] as const;

export type TrainerDef = {
  id: string;
  mapId: string;
  label: string;
  mon: string;
  level: number;
  daily: boolean;
  obj: MapObj;
};
export type TrainerAttempt = { trainer: TrainerDef; resolved: boolean };
export type TrainerOutcome = "win" | "caught" | "lose" | "flee";

/** Existing source objects are the roster; do not make duplicate world NPCs. */
export const TRAINERS: TrainerDef[] = Object.values(MAPS).flatMap(map =>
  map.objs.filter(obj => obj.kind === "npc" && !!obj.mon).map(obj => ({
    id: obj.id, mapId: map.id, label: obj.label, mon: obj.mon!,
    level: obj.lvl ?? 7, daily: (KIEZ_TRAINERS as readonly string[]).includes(obj.id), obj,
  })),
);

const TRAINER_TALK: Record<string, string[]> = {
  cinder: ["Cinder hat Asche an den Zähnen.", "Cinder: Jointail tanzt auf Glut. Wer nicht brennt, verliert."],
  tide: ["Tide tropft vom Kinn. Die Stimme ist nass.", "Tide: Cumulus hängt. Du auch, wenn du verlierst."],
  vial: ["Vial hält ein Glas, das nicht leer sein darf.", "Vial: Cracksprite flüstert Preise. Meiner ist ein Kampf."],
  knuckle: ["Knuckle wickelt Tape. Schon rot.", "Knuckle: Im Käfig zählt nur Neonpunx. Tritt oder geh."],
  hush: ["Hush spricht kaum. Die Dunkelheit spricht für ihn.", "Hush: Datawhore kennt deinen Namen. Ich will nur den Knockout."],
  glow: ["Glow lächelt zu lange. Pink bleibt an den Zähnen.", "Glow: Glitchbitch flirtet härter. Ich auch."],
  coil: ["> COIL: PORT OFFEN. FIREWALLF HUNGRIG.", "> KAMPF ODER ABMELDEN."],
};

// Source dressLine is dialogue only; reward multipliers remain centralized in
// battle-rewards so fishing, combat and trainer bonuses keep the same rules.
const DRESS: Record<string, { maps: string[]; line: string; off: string }> = {
  nude: { maps: ["alley"], line: "Nur Tanktop. Die Gasse zählt das.", off: "Nur Tanktop. Hier zählt die Stadt lauter." },
  wear_trashbag: { maps: ["alley", "sewer"], line: "Die Gasse nimmt die Tüte.", off: "Tüte. Hier will man Stoff." },
  wear_collar: { maps: ["nische", "market"], line: "Halsband klickt. Pink hört zu.", off: "Halsband klickt. Hier ist es nur laut." },
  wear_hoodie: { maps: ["ash", "cable", "labyrinth"], line: "Kapuze. Weniger Augen.", off: "Kapuze. Hier sieht man dich trotzdem." },
  wear_track: { maps: ["ring"], line: "Streifen im Käfig.", off: "Streifen. Der Käfig ist woanders." },
  wear_rain: { maps: ["drain", "sewer", "chem"], line: "Gelb hält den Sud ab.", off: "Gelb. Hier regnet es nicht." },
  wear_overalls: { maps: ["scrap", "yard"], line: "Latz zahlt sich aus.", off: "Latz. Hier zahlt niemand Schicht." },
  wear_jacket: { maps: ["alley", "market"], line: "Neon. Bolt nickt.", off: "Neon. Hier nickt niemand." },
  wear_vest: { maps: ["ring", "scrap"], line: "Weste. Der Schlag sitzt.", off: "Weste. Hier ist kein Käfig." },
  wear_coat: { maps: ["labyrinth", "nische", "cable"], line: "Mantel schluckt Licht.", off: "Mantel. Hier ist es hell." },
};

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;

export function trainerById(mapId: string, id: string): TrainerDef | undefined {
  return TRAINERS.find(trainer => trainer.mapId === mapId && trainer.id === id);
}

/** Deliberately local calendar dates, without UTC conversion or zero padding. */
export function trainerDay(date = new Date()): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function trainerStatus(s: Save, trainer: TrainerDef, date = new Date()): "ready" | "today" | "done" {
  if (trainer.daily) return record(s.bossDay)[trainer.id] === trainerDay(date) ? "today" : "ready";
  return s.deadWild.includes(trainer.id) ? "done" : "ready";
}

export function trainerPages(s: Save, trainer: TrainerDef, date = new Date()): string[] {
  const status = trainerStatus(s, trainer, date);
  if (status === "today") return [`${trainer.label}: Heute reicht. Morgen wieder.`];
  if (status === "done") return [`${trainer.label}: Der Weg ist frei.`];
  const outfit = s.outfit || "nude";
  const look = outfit === "nude" ? "Der Blick hängt einen Schlag zu lang. Dann Prügel." :
    outfit === "wear_trashbag" || outfit === "bag" ? "Tüte raschelt. Egal. Kampf." : "Stoff. Immer noch Knockout.";
  const dress = DRESS[outfit];
  return [
    ...(TRAINER_TALK[trainer.id] ?? [`${trainer.label} stellt sich quer.`]), look,
    ...(dress ? [dress.maps.includes(s.map ?? "") ? dress.line : dress.off] : []),
  ];
}

/** Starting a challenge spends no item, gold, HP or progress. */
export function createTrainerAttempt(s: Save, mapId: string, id: string, date = new Date()): TrainerAttempt | null {
  const trainer = trainerById(mapId, id);
  if (!trainer || trainerStatus(s, trainer, date) !== "ready" ||
      !s.team.some(mon => mon.id && DEX[mon.id] && Number.isFinite(mon.hp) && mon.hp > 0)) return null;
  return { trainer, resolved: false };
}

/** Combat owns its ordinary XP/catch/gold. This pays only source bonus(18). */
export function settleTrainer(s: Save, attempt: TrainerAttempt, outcome: TrainerOutcome, date = new Date()): {
  gold: number; lines: string[]; changed: boolean;
} {
  const unchanged = { gold: 0, lines: [], changed: false };
  if (attempt.resolved) return unchanged;
  attempt.resolved = true;
  const trainer = trainerById(attempt.trainer.mapId, attempt.trainer.id);
  if (!trainer || (outcome !== "win" && outcome !== "caught") || trainerStatus(s, trainer, date) !== "ready") return unchanged;
  if (!s.deadWild.includes(trainer.id)) s.deadWild.push(trainer.id);
  if (trainer.daily) s.bossDay = { ...record(s.bossDay), [trainer.id]: trainerDay(date) };
  const ach = { ...record(s.ach) };
  if (KIEZ_TRAINERS.every(id => s.deadWild.includes(id))) ach.trainer_7 = "done";
  const gold = battleGoldReward(s, 18);
  s.gold = finite(s.gold) + gold;
  s.stats.goldEarned = finite(s.stats.goldEarned) + gold;
  if (s.stats.goldEarned >= 1000) ach.gold_1000 = "done";
  s.ach = ach;
  return { gold, lines: [`Trainer fällt. Bonus. +${gold} Softcash.`], changed: true };
}
