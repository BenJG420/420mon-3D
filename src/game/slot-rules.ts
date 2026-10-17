/** Original 2D rules, src/game/slot.ts, revision 010807da77df8468a297adf33eaf1fb5c9a61c8b; unchanged payout/strip logic. */
/** Drei Automaten. Einsatz ist Softcash, pro Linie. */

export const LINE_BET_MIN = 1;
export const LINE_BET_MAX = 1_000_000;

export type Sym =
  | "joint"
  | "bud"
  | "seed"
  | "fish"
  | "chip"
  | "neon"
  | "kaiser"
  | "four"
  | "wild"
  | "scatter"
  | "cherry"
  | "lemon"
  | "orange"
  | "plum"
  | "grape"
  | "melon"
  | "bell"
  | "star";

export const SYM_NAME: Record<string, string> = {
  joint: "Ordinary",
  bud: "Kush",
  seed: "Haze",
  fish: "Gelato",
  chip: "Diesel",
  neon: "Widow",
  kaiser: "Thai",
  four: "420",
  wild: "Zkit",
  scatter: "Jack",
  cherry: "Kirsche",
  lemon: "Zitrone",
  orange: "Orange",
  plum: "Pflaume",
  grape: "Traube",
  melon: "Melone",
  bell: "Glocke",
  star: "Stern",
};

export const SYM_ITEM: Record<string, string> = {
  joint: "bud_ordinary",
  bud: "bud_kush",
  seed: "bud_haze",
  fish: "bud_gelato",
  chip: "bud_diesel",
  neon: "bud_widow",
  kaiser: "bud_thai",
  four: "bud_eddi",
  wild: "bud_zkittlez",
  scatter: "bud_jack",
};

export const JACKPOT_SEED = "seed_eddi";
export const JACKPOT_CHIP = "chip_crown";
export const JACKPOT_N = 10;

type Pay = [number, number, number];

export const PAY: Record<string, Pay> = {
  joint: [10, 22, 60],
  bud: [12, 28, 80],
  seed: [15, 40, 110],
  fish: [22, 55, 180],
  chip: [28, 80, 280],
  neon: [40, 120, 450],
  kaiser: [60, 200, 800],
  four: [120, 500, 2500],
  wild: [80, 300, 1500],
  scatter: [0, 0, 0],
  cherry: [8, 8, 8],
  lemon: [12, 12, 12],
  orange: [16, 16, 16],
  plum: [24, 24, 24],
  grape: [40, 40, 40],
  melon: [80, 80, 80],
  bell: [160, 160, 160],
  star: [100, 100, 100],
};

/** 20 Linien auf 3×5. */
export const LINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [0, 1, 2, 2, 1],
];

const LINE_LABEL_20 = [
  "Mitte", "Oben", "Unten", "V", "Dach",
  "Zelt", "Wanne", "Haken", "Haken 2", "Stufe",
  "Stufe 2", "Zick", "Zack", "Treppe", "Treppe 2",
  "Kamm", "Kamm 2", "Fluss", "Gegenfluss", "Sprung",
];

const FRUIT_LINES: number[][] = [
  [1, 1, 1],
  [0, 0, 0],
  [2, 2, 2],
  [0, 1, 2],
  [2, 1, 0],
];

export type Machine = {
  id: "buds" | "fruit" | "free";
  title: string;
  blurb: string;
  reels: number;
  rows: number;
  lines: number[][];
  labels: string[];
  strip: Sym[];
  cycle: Sym[];
  wild: Sym | "";
  scatter: Sym | "";
  jackpot: boolean;
  frees: boolean;
};

const BUD_STRIP: Sym[] = [
  "joint", "bud", "seed", "joint", "fish", "bud", "joint", "seed", "joint", "bud",
  "seed", "joint", "fish", "bud", "chip", "joint", "seed", "bud", "neon", "joint",
  "fish", "bud", "seed", "joint", "kaiser", "bud", "chip", "seed", "joint", "fish",
  "bud", "wild", "seed", "joint", "neon", "bud", "fish", "seed", "joint", "chip",
  "scatter", "joint", "bud", "seed", "fish", "joint", "bud", "four", "seed", "joint",
  "bud", "chip", "seed", "joint", "fish", "bud", "kaiser", "seed", "joint", "neon",
];

const FRUIT_STRIP: Sym[] = [
  "cherry", "lemon", "cherry", "orange", "cherry", "lemon", "plum", "cherry", "lemon", "orange",
  "cherry", "grape", "lemon", "cherry", "orange", "plum", "cherry", "lemon", "melon", "cherry",
  "orange", "lemon", "cherry", "star", "plum", "cherry", "lemon", "grape", "orange", "cherry",
  "bell", "lemon", "cherry", "orange", "plum", "cherry",
];

const FREE_STRIP: Sym[] = [
  ...BUD_STRIP.slice(0, 20),
  "scatter",
  ...BUD_STRIP.slice(20),
];

const BUD_CYCLE: Sym[] = ["joint", "bud", "seed", "fish", "chip", "neon", "kaiser", "four", "wild", "scatter"];
const FRUIT_CYCLE: Sym[] = ["cherry", "lemon", "orange", "plum", "grape", "melon", "bell", "star"];

export const MACHINES: Machine[] = [
  {
    id: "buds",
    title: "420",
    blurb: "3×5, bis 20 Linien. 5× 420 ist der Jackpot.",
    reels: 5,
    rows: 3,
    lines: LINES,
    labels: LINE_LABEL_20,
    strip: BUD_STRIP,
    cycle: BUD_CYCLE,
    wild: "wild",
    scatter: "scatter",
    jackpot: true,
    frees: false,
  },
  {
    id: "fruit",
    title: "Obststand",
    blurb: "3×3, fünf Linien. Nur Früchte. Stern ersetzt.",
    reels: 3,
    rows: 3,
    lines: FRUIT_LINES,
    labels: ["Mitte", "Oben", "Unten", "V", "Dach"],
    strip: FRUIT_STRIP,
    cycle: FRUIT_CYCLE,
    wild: "star",
    scatter: "",
    jackpot: false,
    frees: false,
  },
  {
    id: "free",
    title: "Freidreher",
    blurb: "3×5, neun Linien. 3× Jack gibt Freispiele, die zählen doppelt.",
    reels: 5,
    rows: 3,
    lines: LINES.slice(0, 9),
    labels: LINE_LABEL_20.slice(0, 9),
    strip: FREE_STRIP,
    cycle: BUD_CYCLE,
    wild: "wild",
    scatter: "scatter",
    jackpot: false,
    frees: true,
  },
];

export function machineById(id: Machine["id"]): Machine {
  return MACHINES.find((m) => m.id === id) ?? MACHINES[0]!;
}

export const LINE_MAX = LINES.length;

const BET_LADDER = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000];

export function stepBet(n: number, dir: 1 | -1): number {
  const cur = Math.max(LINE_BET_MIN, Math.min(LINE_BET_MAX, Math.floor(n)));
  if (dir > 0) return BET_LADDER.find((s) => s > cur) ?? LINE_BET_MAX;
  return [...BET_LADDER].reverse().find((s) => s < cur) ?? LINE_BET_MIN;
}

export type Grid = Sym[][];

export type LineWin = {
  line: number;
  sym: Sym;
  count: number;
  pay: number;
  cells: [number, number][];
};

export type SpinResult = {
  grid: Grid;
  wins: LineWin[];
  scatter: number;
  scatterPay: number;
  total: number;
  jackpot: boolean;
  /** Neue Freispiele aus diesem Dreh. */
  freeAward: number;
};

export function spinGrid(machine: Machine, rng: () => number = Math.random): Grid {
  const grid: Grid = [];
  for (let reel = 0; reel < machine.reels; reel++) {
    const start = Math.floor(rng() * machine.strip.length);
    const col: Sym[] = [];
    for (let row = 0; row < machine.rows; row++) col.push(machine.strip[(start + row) % machine.strip.length]!);
    grid.push(col);
  }
  return grid;
}

function linePay(sym: Sym, count: number): number {
  if (count < 3 || sym === "scatter") return 0;
  return PAY[sym]?.[count - 3] ?? 0;
}

export function evalGrid(machine: Machine, grid: Grid, lineCount: number, lineBet: number): SpinResult {
  const wins: LineWin[] = [];
  let total = 0;
  const n = Math.max(1, Math.min(machine.lines.length, lineCount));
  const bet = Math.max(LINE_BET_MIN, Math.min(LINE_BET_MAX, lineBet));
  for (let i = 0; i < n; i++) {
    const rows = machine.lines[i]!;
    const cells: [number, number][] = [];
    let sym: Sym | null = null;
    let count = 0;
    for (let reel = 0; reel < machine.reels; reel++) {
      const row = rows[reel]!;
      const s = grid[reel]?.[row];
      if (!s || (machine.scatter && s === machine.scatter)) break;
      if (machine.wild && s === machine.wild) {
        cells.push([reel, row]);
        count += 1;
        continue;
      }
      if (!sym) sym = s;
      if (s !== sym) break;
      cells.push([reel, row]);
      count += 1;
    }
    const paySym: Sym = sym ?? (machine.wild || "wild");
    const pay = linePay(paySym, count) * bet;
    if (pay > 0) {
      wins.push({ line: i, sym: paySym, count, pay, cells });
      total += pay;
    }
  }
  let scatter = 0;
  if (machine.scatter) {
    for (const col of grid) for (const s of col) if (s === machine.scatter) scatter += 1;
  }
  const scatterMul = scatter >= 5 ? 40 : scatter === 4 ? 12 : scatter === 3 ? 3 : 0;
  const scatterPay = scatterMul * bet * n;
  total += scatterPay;
  const jackpot = machine.jackpot && wins.some((w) => w.sym === "four" && w.count === 5);
  const freeAward = machine.frees && scatter >= 3 ? (scatter >= 5 ? 10 : scatter === 4 ? 8 : 6) : 0;
  return { grid, wins, scatter, scatterPay, total, jackpot, freeAward };
}

/** Nur der Obststand: ein Teil der Nieten wird ein kleiner Dreier. */
function nudgeFruit(machine: Machine, grid: Grid, lineCount: number, lineBet: number, rng: () => number): SpinResult {
  const first = evalGrid(machine, grid, lineCount, lineBet);
  if (machine.id !== "fruit" || first.total > 0 || rng() > 0.12) return first;
  const n = Math.max(1, Math.min(machine.lines.length, lineCount));
  const cheap = machine.cycle.find((s) => s !== machine.wild && s !== "bell") ?? "cherry";
  const line = machine.lines[Math.floor(rng() * n)]!;
  for (let reel = 0; reel < machine.reels; reel++) {
    const row = line[reel] ?? 1;
    const col = grid[reel];
    if (col && col[row] !== undefined) col[row] = cheap;
  }
  return evalGrid(machine, grid, lineCount, lineBet);
}

export function playSpin(machine: Machine, lineCount: number, lineBet: number, rng: () => number = Math.random): SpinResult {
  return nudgeFruit(machine, spinGrid(machine, rng), lineCount, lineBet, rng);
}

export function stakeTotal(lineCount: number, lineBet: number, lineMax = LINE_MAX): number {
  const n = Math.max(1, Math.min(lineMax, lineCount));
  const bet = Math.max(LINE_BET_MIN, Math.min(LINE_BET_MAX, lineBet));
  return n * bet;
}
