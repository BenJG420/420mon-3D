export const MAX_LEVEL = 420;

export type Stage = {
  tier: number;
  minLv: number;
  wild: [number, number];
  legend: [number, number];
  title: string;
};

/** Escalating district bands. minLv = Zugang (Trainer oder stärkstes Team). */
export const STAGE: Record<string, Stage> = {
  capsule: { tier: 0, minLv: 1, wild: [1, 1], legend: [1, 1], title: "Start" },
  alley: { tier: 1, minLv: 1, wild: [2, 12], legend: [18, 28], title: "Stufe 1" },
  sewer: { tier: 1, minLv: 1, wild: [4, 16], legend: [20, 32], title: "Stufe 1" },
  kai: { tier: 1, minLv: 1, wild: [1, 1], legend: [1, 1], title: "Angeln" },
  market: { tier: 2, minLv: 6, wild: [8, 24], legend: [28, 42], title: "Stufe 2" },
  kino: { tier: 2, minLv: 6, wild: [1, 1], legend: [1, 1], title: "Stufe 2" },
  yard: { tier: 2, minLv: 8, wild: [8, 22], legend: [26, 40], title: "Stufe 2" },
  drain: { tier: 3, minLv: 16, wild: [16, 34], legend: [38, 55], title: "Stufe 3" },
  ash: { tier: 3, minLv: 22, wild: [22, 42], legend: [46, 66], title: "Stufe 3" },
  chem: { tier: 4, minLv: 32, wild: [32, 58], legend: [62, 88], title: "Stufe 4" },
  cable: { tier: 4, minLv: 42, wild: [42, 72], legend: [78, 108], title: "Stufe 4" },
  ring: { tier: 5, minLv: 58, wild: [58, 95], legend: [100, 135], title: "Stufe 5" },
  nische: { tier: 5, minLv: 72, wild: [72, 115], legend: [120, 160], title: "Stufe 5" },
  labyrinth: { tier: 6, minLv: 95, wild: [95, 155], legend: [165, 215], title: "Stufe 6" },
  scrap: { tier: 7, minLv: 130, wild: [140, 280], legend: [300, 420], title: "Stufe 7" },
};

const ALIAS: Record<string, string> = {
  lab: "labyrinth",
  nis: "nische",
  scr: "scrap",
};

export function stageKey(id: string): string {
  return ALIAS[id] ?? id;
}

export function stageOf(map: string): Stage {
  return STAGE[stageKey(map)] ?? STAGE.alley;
}

export function clampLevel(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_LEVEL, Math.round(n)));
}

/** t 0..1 within the district band. */
export function stageAt(map: string, t: number, legend = false): number {
  const s = stageOf(map);
  const [a, b] = legend ? s.legend : s.wild;
  const u = Math.max(0, Math.min(1, t));
  return clampLevel(a + (b - a) * u);
}

export function xpToNext(level: number): number {
  const lv = clampLevel(level);
  return Math.floor(8 * lv + 0.01 * lv * lv + 18);
}

export const TIER_ORDER = [1, 2, 3, 4, 5, 6, 7] as const;

export const TIER_LABEL: Record<number, string> = {
  0: "Start",
  1: "Stufe 1 · Gasse",
  2: "Stufe 2 · Hof & Markt",
  3: "Stufe 3 · Asche & Abfluss",
  4: "Stufe 4 · Chemie & Keller",
  5: "Stufe 5 · Ring & Nischen",
  6: "Stufe 6 · Labyrinth",
  7: "Stufe 7 · Schrott",
};

const HUB_MAPS = new Set(["capsule", "sewer"]);

export function mapsInTier(tier: number): string[] {
  return Object.entries(STAGE)
    .filter(([id, s]) => s.tier === tier && !HUB_MAPS.has(id))
    .sort((a, b) => a[1].minLv - b[1].minLv || a[0].localeCompare(b[0]))
    .map(([id]) => id);
}

export function nextGate(have: number): { id: string; minLv: number; title: string } | null {
  const rows = Object.entries(STAGE)
    .filter(([id]) => !HUB_MAPS.has(id))
    .sort((a, b) => a[1].minLv - b[1].minLv);
  for (const [id, s] of rows) {
    if (have < s.minLv) return { id, minLv: s.minLv, title: s.title };
  }
  return null;
}
