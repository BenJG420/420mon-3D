/** Auto-grow helper. Visible from game start. Walks pots one by one. */

export const FELIX_CUT_MIN = 0.05;
export const FELIX_CUT_MAX = 0.1;
export const FELIX_SPEED = 46;
export const FELIX_GRAB = 0.9;
export const FELIX_PLANT_T = 1.35;
export const FELIX_CUT_T = 1.35;
export const FELIX_STORE_T = 0.65;
export const FELIX_SEED_CAP = 100;
export const FELIX_BUD_CAP = 420;

export const FELIX_CAGE = { x: 8, y: 136, w: 34, h: 32 };
export const FELIX_CAGE_STAND = { x: 24, y: 156 };
export const FELIX_CRATE_STAND = { x: 241, y: 140 };

export type FelixAct =
  | "idle"
  | "tocage"
  | "tocrate"
  | "grab"
  | "topot"
  | "plant"
  | "toharvest"
  | "cut"
  | "tostore"
  | "store";

export const FELIX_LINES_WORK = [
  "Felix: Ein Topf. Dann der nächste. Ich bin kein Zauberer.",
  "Felix: Gleiche Zeit wie du. Ich lauf nur mit.",
  "Felix: Hundert Samen auf einmal. Dann die Runde. Nicht für jeden Topf zur Kiste.",
  "Felix: Vierhundertzwanzig Buds, dann abladen. Schnelle Sorten kriegen mich nicht.",
  "Felix: Dünger zuerst, wenn welcher da ist. Ich bin nicht doof.",
  "Felix: Käfig ist Pause. Reif ist Arbeit.",
];

export function crateOk(id: string, cat?: string): boolean {
  return cat === "seed" || cat === "fert" || cat === "bud";
}

export function bagCount(bag: Record<string, number> | undefined): number {
  if (!bag) return 0;
  let n = 0;
  for (const v of Object.values(bag)) if (typeof v === "number" && v > 0) n += v;
  return n;
}

export function felixCutRate(): number {
  return FELIX_CUT_MIN + Math.random() * (FELIX_CUT_MAX - FELIX_CUT_MIN);
}

export function felixCutN(buds: number, rate?: number): number {
  const r = rate ?? felixCutRate();
  return Math.max(0, Math.floor(buds * r));
}

export function felixActLabel(act: FelixAct | undefined, carryN: number, seedN = 0): string {
  if (act === "tocrate" || act === "grab") return seedN ? `Felix · holt ${seedN}` : "Felix · Kiste";
  if (act === "topot" || act === "plant") return seedN ? `Felix · pflanzt · ${seedN}` : "Felix · pflanzt";
  if (act === "toharvest" || act === "cut") return "Felix · schneidet";
  if (act === "tostore" || act === "store") return carryN ? `Felix · ${carryN}× weg` : "Felix · Kiste";
  if (act === "tocage") return "Felix · Käfig";
  return "Felix · Käfig";
}

