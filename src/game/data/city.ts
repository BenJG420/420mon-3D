import type { Deco, MapDef, MapObj, Rect } from "./maps";

export type Ledge = Rect & { dir: "n" | "s" | "e" | "w" };

export type Building = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: string;
  name?: string;
  side: "n" | "s";
  variant: number;
};

export type Obstacle = Rect & { kind: "median" | "block" | "fence" | "pipe" | "toilet" | "valve" | "ember" | "rack" };

export type CityLayout = {
  walls: Rect[];
  buildings: Building[];
  ledges: Ledge[];
  deco: Deco[];
  obstacles: Obstacle[];
};

const N_Y = 36;
const N_H = 160;
const WALK_N0 = 196;
const WALK_N1 = 248;
const LEDGE_N_Y = 248;
const LEDGE_H = 8;
const LANE_N0 = 256;
const LANE_N1 = 356;
const MEDIAN_Y = 368;
const MEDIAN_H = 20;
const LANE_S0 = 388;
const LEDGE_S_Y = 462;
const WALK_S0 = 470;
const S_Y = 524;
const S_H = 160;

export const CITY = {
  N_Y,
  N_H,
  WALK_N0,
  WALK_N1,
  LEDGE_N_Y,
  LEDGE_H,
  LANE_N0,
  LANE_N1,
  MEDIAN_Y,
  MEDIAN_H,
  LANE_S0,
  LEDGE_S_Y,
  WALK_S0,
  S_Y,
  S_H,
};

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function mergeSpans(spans: { x: number; w: number }[], minW = 40): { x: number; w: number }[] {
  const s = [...spans].filter((a) => a.w >= minW).sort((a, b) => a.x - b.x);
  const out: { x: number; w: number }[] = [];
  for (const a of s) {
    const last = out[out.length - 1];
    if (last && a.x <= last.x + last.w + 8) {
      last.w = Math.max(last.x + last.w, a.x + a.w) - last.x;
    } else out.push({ ...a });
  }
  return out;
}

function invert(len: number, gaps: { x: number; w: number }[]): { x: number; w: number }[] {
  const g = mergeSpans(gaps, 8);
  const segs: { x: number; w: number }[] = [];
  let c = 8;
  for (const gap of g) {
    const gx = Math.max(8, gap.x);
    if (gx > c + 24) segs.push({ x: c, w: gx - c });
    c = Math.max(c, gx + gap.w);
  }
  if (len - 8 > c + 24) segs.push({ x: c, w: len - 8 - c });
  return segs;
}

function splitSpan(s: { x: number; w: number }, seed: number): { x: number; w: number }[] {
  if (s.w < 160) return [s];
  const out: { x: number; w: number }[] = [];
  let x = s.x;
  let i = 0;
  while (x < s.x + s.w) {
    const remain = s.x + s.w - x;
    if (remain <= 180) {
      out.push({ x, w: remain });
      break;
    }
    const w = 108 + Math.floor(hash(seed + i * 17) * 96);
    const take = Math.min(w, remain - 96);
    out.push({ x, w: take });
    x += take;
    i += 1;
  }
  return out;
}

const TONES_N = ["#c8c8ce", "#6ec8ff", "#ff8ad4", "#ffd27a", "#7cff6b", "#b48aff"];
const TONES_S = ["#8a909c", "#4aa8c8", "#d46a9a", "#c8a050", "#4a9a62", "#7a6ab0"];

export function streetCity(opts: {
  w: number;
  h: number;
  tone: string;
  twoWay: { x: number; w: number }[];
  oneWay: { x: number; w: number }[];
  chicanes?: boolean;
  names?: { x: number; name: string; side: "n" | "s" }[];
}): CityLayout {
  const w = opts.w;
  const two = mergeSpans(opts.twoWay, 48);
  const one = mergeSpans(opts.oneWay, 32);
  const openN = mergeSpans([...two, ...one], 32);
  const northSpans = invert(w, openN);
  const southSpans = invert(w, two);
  const blocked = invert(w, two);

  const buildings: Building[] = [];
  let i = 0;
  for (const s of northSpans) {
    for (const f of splitSpan(s, i + 3)) {
      if (f.w < 72) continue;
      const named = opts.names?.find((n) => n.side === "n" && n.x >= f.x && n.x <= f.x + f.w);
      buildings.push({
        id: `bn${i}`,
        x: f.x,
        y: N_Y,
        w: f.w,
        h: N_H,
        tone: named ? opts.tone : TONES_N[i % TONES_N.length] ?? opts.tone,
        name: named?.name,
        side: "n",
        variant: Math.floor(hash(i + f.x) * 6),
      });
      i += 1;
    }
  }
  for (const s of southSpans) {
    for (const f of splitSpan(s, i + 9)) {
      if (f.w < 72) continue;
      const named = opts.names?.find((n) => n.side === "s" && n.x >= f.x && n.x <= f.x + f.w);
      buildings.push({
        id: `bs${i}`,
        x: f.x,
        y: S_Y,
        w: f.w,
        h: S_H,
        tone: named ? opts.tone : TONES_S[i % TONES_S.length] ?? opts.tone,
        name: named?.name,
        side: "s",
        variant: Math.floor(hash(i + f.x) * 6),
      });
      i += 1;
    }
  }

  const obstacles: Obstacle[] = [];
  for (const s of blocked) {
    if (s.w < 40) continue;
    obstacles.push({ x: s.x, y: MEDIAN_Y, w: s.w, h: MEDIAN_H, kind: "median" });
  }

  if (opts.chicanes !== false) {
    let k = 0;
    for (const s of blocked) {
      if (s.w < 340) continue;
      const a = s.x + 70;
      obstacles.push({ x: a, y: LANE_N0 + 4, w: 72, h: 36, kind: "block" });
      const b = s.x + 210;
      if (b + 72 < s.x + s.w - 40) obstacles.push({ x: b, y: LANE_N0 + 4, w: 72, h: 36, kind: "block" });
      const c = s.x + 90;
      obstacles.push({ x: c, y: LANE_S0 + 6, w: 80, h: 32, kind: k % 2 === 0 ? "fence" : "block" });
      if (s.w > 560) {
        const d = s.x + Math.floor(s.w * 0.62);
        obstacles.push({ x: d, y: LANE_N0 + 4, w: 64, h: 34, kind: "fence" });
        obstacles.push({ x: d + 120, y: LANE_S0 + 6, w: 72, h: 32, kind: "block" });
      }
      k += 1;
    }
  }

  const walls: Rect[] = [
    ...buildings.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h })),
    ...obstacles.map((o) => ({ x: o.x, y: o.y, w: o.w, h: o.h })),
  ];

  const ledges: Ledge[] = [];
  for (const s of blocked) {
    if (s.w < 20) continue;
    ledges.push({ x: s.x, y: LEDGE_N_Y, w: s.w, h: LEDGE_H, dir: "s" });
    ledges.push({ x: s.x, y: LEDGE_S_Y, w: s.w, h: LEDGE_H, dir: "n" });
    if (s.w >= 100) {
      ledges.push({ x: s.x + 10, y: LANE_N0, w: 8, h: 52, dir: "e" });
      ledges.push({ x: s.x + s.w - 18, y: LANE_S0, w: 8, h: 44, dir: "w" });
    }
    if (s.w > 480) {
      ledges.push({ x: s.x + Math.floor(s.w / 2), y: LANE_N0, w: 8, h: 52, dir: "e" });
      ledges.push({ x: s.x + Math.floor(s.w / 2) - 8, y: LANE_S0, w: 8, h: 44, dir: "w" });
    }
  }

  const deco: Deco[] = [];
  for (let x = 40; x < w; x += 380) {
    deco.push({ x, y: 292, w: 70 + (x % 40), h: 16, fill: "rgba(90,190,255,0.07)" });
    deco.push({ x: x + 160, y: 418, w: 54, h: 14, fill: "rgba(255,90,170,0.06)" });
  }
  for (const gap of two) {
    deco.push({ x: gap.x + 8, y: N_Y, w: Math.max(16, gap.w - 16), h: N_H, fill: "rgba(6,6,8,0.42)" });
    deco.push({ x: gap.x + 8, y: S_Y, w: Math.max(16, gap.w - 16), h: S_H, fill: "rgba(6,6,8,0.42)" });
  }
  for (const gap of one) {
    deco.push({ x: gap.x, y: N_Y, w: gap.w, h: N_H, fill: "rgba(8,8,10,0.5)" });
  }

  return { walls, buildings, ledges, deco, obstacles };
}

export function houseDoor(id: string, x: number, y: number, dest: string, dx: number, dy: number, label: string): MapObj {
  return {
    id,
    kind: "door",
    x,
    y,
    w: 20,
    h: 22,
    label,
    door: dest,
    dx,
    dy,
    block: false,
  };
}

export function makeDen(opts: {
  id: string;
  name: string;
  bg: string;
  back: string;
  bx: number;
  by: number;
  npc?: MapObj;
  extras?: MapObj[];
}): MapDef {
  const w = 400;
  const h = 240;
  const doorX = 184;
  return {
    id: opts.id,
    name: opts.name,
    w,
    h,
    bg: opts.bg,
    indoor: true,
    walls: [
      { x: 0, y: 0, w, h: 22 },
      { x: 0, y: h - 18, w: doorX - 8, h: 18 },
      { x: doorX + 40, y: h - 18, w: w - (doorX + 40), h: 18 },
      { x: 0, y: 0, w: 16, h },
      { x: w - 16, y: 0, w: 16, h },
      { x: 28, y: 78, w: 78, h: 12 },
      { x: 292, y: 78, w: 78, h: 12 },
    ],
    deco: [
      { x: 40, y: 40, w: 320, h: 160, fill: "rgba(18,12,16,0.28)" },
      { x: 120, y: 110, w: 160, h: 70, fill: "rgba(90,40,60,0.18)" },
    ],
    objs: [
      {
        id: `${opts.id}_out`,
        kind: "door",
        x: doorX,
        y: h - 22,
        w: 32,
        h: 20,
        label: "Raus",
        door: opts.back,
        dx: opts.bx,
        dy: opts.by,
      },
      ...(opts.npc ? [opts.npc] : []),
      ...(opts.extras ?? []),
    ],
    zones: [],
  };
}

export const ALLEY_TWOWAY: { x: number; w: number }[] = [
  { x: 0, w: 220 },
  { x: 720, w: 100 },
  { x: 1460, w: 100 },
  { x: 2140, w: 120 },
  { x: 2640, w: 110 },
  { x: 3360, w: 120 },
  { x: 3840, w: 110 },
  { x: 4340, w: 120 },
  { x: 5240, w: 110 },
  { x: 6140, w: 120 },
  { x: 7020, w: 180 },
];

export const ALLEY_ONEWAY: { x: number; w: number }[] = [
  { x: 400, w: 52 },
  { x: 1080, w: 52 },
  { x: 1800, w: 52 },
  { x: 2480, w: 52 },
  { x: 3100, w: 52 },
  { x: 3700, w: 52 },
  { x: 4800, w: 52 },
  { x: 5680, w: 52 },
  { x: 6600, w: 52 },
];

export const MARKET_TWOWAY: { x: number; w: number }[] = [
  { x: 0, w: 200 },
  { x: 900, w: 90 },
  { x: 1900, w: 90 },
  { x: 2900, w: 90 },
  { x: 3900, w: 90 },
  { x: 4900, w: 90 },
  { x: 5900, w: 90 },
  { x: 7000, w: 200 },
];

export const MARKET_ONEWAY: { x: number; w: number }[] = [
  { x: 520, w: 48 },
  { x: 1400, w: 48 },
  { x: 2400, w: 48 },
  { x: 3400, w: 48 },
  { x: 4400, w: 48 },
  { x: 5400, w: 48 },
  { x: 6400, w: 48 },
];
