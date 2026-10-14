import { districtByMap } from "./zones";
import { encountersFor, mixEnc, DEX, DEX_ORDER } from "./dex";
import { stageAt, stageKey } from "./progress";
import {
  ALLEY_ONEWAY,
  ALLEY_TWOWAY,
  houseDoor,
  makeDen,
  streetCity,
  type Building,
  type Ledge,
  type Obstacle,
} from "./city";

export type Rect = { x: number; y: number; w: number; h: number };

export type MapObj = {
  id: string;
  kind: "prop" | "npc" | "door" | "wild" | "pot" | "bed" | "bin" | "shop" | "starter" | "lamp" | "mattress" | "manhole" | "stall" | "sign";
  x: number;
  y: number;
  w: number;
  h: number;
  sprite?: string;
  label: string;
  block?: boolean;
  once?: boolean;
  door?: string;
  dx?: number;
  dy?: number;
  lock?: string;
  mon?: string;
  lvl?: number;
  pot?: number;
  stall?: string;
};

export type EncounterZone = Rect & { mons: { id: string; lvl: [number, number]; w: number }[] };

export type Deco = { x: number; y: number; w: number; h: number; fill: string };

export type MapDef = {
  id: string;
  name: string;
  w: number;
  h: number;
  bg: string;
  walls: Rect[];
  objs: MapObj[];
  zones: EncounterZone[];
  deco?: Deco[];
  buildings?: Building[];
  ledges?: Ledge[];
  obstacles?: Obstacle[];
  indoor?: boolean;
};

const B = 10;
export const WORLD_W = 2560;
export const WORLD_H = 1760;

export const ALLEY_WALK: Rect[] = [
  { x: 640, y: 400, w: 1120, h: 112 },
  { x: 1648, y: 400, w: 112, h: 640 },
  { x: 640, y: 920, w: 1120, h: 132 },
  { x: 640, y: 400, w: 112, h: 640 },
  { x: 752, y: 680, w: 896, h: 96 },
  { x: 1120, y: 512, w: 96, h: 416 },
  { x: 8, y: 680, w: 648, h: 112 },
  { x: 1760, y: 680, w: 792, h: 112 },
  { x: 200, y: 8, w: 480, h: 140 },
  { x: 568, y: 8, w: 112, h: 404 },
  { x: 1088, y: 8, w: 160, h: 404 },
  { x: 1680, y: 8, w: 240, h: 140 },
  { x: 1680, y: 8, w: 112, h: 404 },
  { x: 2040, y: 8, w: 400, h: 140 },
  { x: 2160, y: 8, w: 112, h: 684 },
  { x: 160, y: 1040, w: 240, h: 712 },
  { x: 160, y: 1040, w: 520, h: 112 },
  { x: 960, y: 1040, w: 160, h: 712 },
  { x: 1400, y: 1040, w: 160, h: 712 },
  { x: 1648, y: 1040, w: 480, h: 112 },
  { x: 1960, y: 1040, w: 160, h: 712 },
];

export const ALLEY_GRASS: Rect[] = [
  { x: 220, y: 40, w: 280, h: 40 },
  { x: 180, y: 1400, w: 200, h: 80 },
  { x: 980, y: 1400, w: 120, h: 80 },
  { x: 1420, y: 1400, w: 120, h: 80 },
  { x: 1980, y: 1400, w: 120, h: 80 },
  { x: 2060, y: 40, w: 280, h: 40 },
  { x: 780, y: 700, w: 200, h: 56 },
];
export const MARKET_W = 640;
export const MARKET_H = 480;
export const KINO_W = 720;
export const KINO_H = 196;
export const KINO_SCREEN = { x: 20, y: 8, w: 680, h: 94 };
export const SEWER_W = 6400;
export const SEWER_H = 360;
export const YARD_W = 2400;
export const YARD_H = 640;
export const CABLE_W = 2000;
export const CABLE_H = 800;

const CABLE_NORTH_X = [320, 400, 480, 560, 640, 720, 800, 1120, 1200, 1280, 1360, 1440, 1520, 1600];
const CABLE_SOUTH_X = [480, 560, 640, 720, 800, 880, 960, 1040, 1120, 1200, 1280, 1360, 1440];

export const CABLE_RACKS: Rect[] = [
  ...CABLE_NORTH_X.map((x) => ({ x, y: 88, w: 56, h: 100 })),
  ...CABLE_SOUTH_X.map((x) => ({ x, y: 368, w: 56, h: 100 })),
];

export const CABLE_TEETH: Rect[] = [
  { x: 480, y: 188, w: 48, h: 28 },
  { x: 720, y: 188, w: 48, h: 28 },
  { x: 1280, y: 188, w: 48, h: 28 },
  { x: 600, y: 340, w: 48, h: 28 },
  { x: 1100, y: 340, w: 48, h: 28 },
  { x: 1500, y: 340, w: 48, h: 28 },
];

export const CABLE_LIVE: Rect[] = [{ x: 480, y: 480, w: 1020, h: 88 }];

export const CABLE_FILL: Rect[] = [
  { x: 848, y: 36, w: 62, h: 140 },
  { x: 1090, y: 36, w: 38, h: 140 },
  { x: 848, y: 176, w: 120, h: 20 },
  { x: 1048, y: 176, w: 80, h: 20 },
];

export const CABLE_WALK: Rect[] = [
  { x: 16, y: 80, w: 280, h: 684 },
  { x: 1704, y: 80, w: 280, h: 684 },
  { x: 280, y: 192, w: 1440, h: 176 },
  { x: 848, y: 36, w: 280, h: 160 },
  { x: 220, y: 576, w: 1560, h: 188 },
  { x: 280, y: 368, w: 200, h: 220 },
  { x: 1500, y: 368, w: 220, h: 220 },
];

export const CABLE_CABLE: Rect[] = [
  { x: 300, y: 452, w: 180, h: 48 },
  { x: 1500, y: 452, w: 180, h: 48 },
  { x: 400, y: 600, w: 240, h: 80 },
  { x: 880, y: 620, w: 300, h: 70 },
  { x: 1320, y: 600, w: 240, h: 80 },
  { x: 600, y: 300, w: 200, h: 28 },
  { x: 1100, y: 300, w: 200, h: 28 },
];
export const KIEZ_W = 1600;
export const KIEZ_H = 480;

function rng(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function along(start: number, end: number, step: number, jitter = 0): number[] {
  const xs: number[] = [];
  let n = 0;
  for (let x = start; x < end; x += step) {
    const j = jitter ? Math.round((rng(n + start) - 0.5) * jitter) : 0;
    xs.push(Math.max(40, Math.min(end - 20, x + j)));
    n += 1;
  }
  return xs;
}

function place(
  kind: MapObj["kind"],
  prefix: string,
  sprite: string,
  label: string,
  xs: number[],
  y: number,
  w: number,
  h: number,
  extra: Partial<MapObj> = {},
): MapObj[] {
  return xs.map((x, i) => ({
    id: `${prefix}${i}`,
    kind,
    x,
    y,
    w,
    h,
    sprite,
    label,
    block: false,
    ...extra,
  }));
}

function coverZones(
  w: number,
  h: number,
  cols: number,
  rows: number,
  mons: EncounterZone["mons"],
): EncounterZone[] {
  const padX = 80;
  const padY = 48;
  const cw = Math.floor((w - padX * 2) / cols);
  const ch = Math.floor((h - padY * 2) / rows);
  const z: EncounterZone[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      z.push({ x: padX + c * cw, y: padY + r * ch, w: cw - 12, h: ch - 12, mons });
    }
  }
  return z;
}

export const MAP_LABEL: Record<string, string> = {
  capsule: "Kapsel",
  studio: "Studio",
  alley: "Gasse",
  yard: "Hinterhof",
  cable: "Keller",
  market: "Markt",
  kino: "Kino",
  sewer: "Kanal",
  kai: "Neonkai",
  ash: "Asche",
  drain: "Abfluss",
  chem: "Chemie",
  ring: "Ring",
  labyrinth: "Schatten",
  nische: "Nischen",
  scrap: "Schrott",
  den_mira: "Mira",
  den_raze: "Raze",
  den_static: "Static",
  den_moss: "Moss",
  den_silk: "Silk-Hinten",
  den_cherry: "Cherry",
};

function hatch(id: string, x: number, y: number, dest: string, dx: number, dy: number, extra: Partial<MapObj> = {}): MapObj {
  const down = dest === "sewer";
  const name = MAP_LABEL[dest] ?? dest;
  return {
    id,
    kind: "manhole",
    x,
    y,
    w: 22,
    h: 18,
    sprite: "manhole",
    label: down ? `Gulli · ${name}` : `Luke · ${name}`,
    block: false,
    door: dest,
    dx,
    dy,
    ...extra,
  };
}

function gate(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  dest: string,
  dx: number,
  dy: number,
  extra: Partial<MapObj> = {},
): MapObj {
  return {
    id,
    kind: "door",
    x,
    y,
    w,
    h,
    label: extra.label ?? MAP_LABEL[dest] ?? dest,
    door: dest,
    dx,
    dy,
    ...extra,
  };
}

function neonSign(id: string, x: number, y: number, dest: string, extra: Partial<MapObj> = {}): MapObj {
  const name = extra.label ?? MAP_LABEL[dest] ?? dest;
  return {
    id,
    kind: "sign",
    x,
    y,
    w: Math.max(22, name.length * 5 + 8),
    h: 28,
    label: name,
    door: dest,
    block: false,
    ...extra,
  };
}

function notNear(objs: MapObj[], xs: number[], r: number): MapObj[] {
  return objs.filter((o) => xs.every((x) => Math.abs(o.x - x) > r));
}

function stall(id: string, x: number, y: number, label: string, stallId: string): MapObj {
  return {
    id,
    kind: "stall",
    x,
    y,
    w: 22,
    h: 18,
    sprite: "vendor",
    label,
    block: true,
    stall: stallId,
  };
}

function ringPos(cx: number, cy: number, rx: number, deg: number, w = 22, h = 18, ry = rx) {
  const a = (deg * Math.PI) / 180;
  return { x: Math.round(cx + Math.cos(a) * rx - w / 2), y: Math.round(cy + Math.sin(a) * ry - h / 2) };
}

function boxFrame(w: number, h: number): Rect[] {
  return [
    { x: 0, y: 0, w, h: 36 },
    { x: 0, y: h - 36, w, h: 36 },
    { x: 0, y: 0, w: 8, h },
    { x: w - 8, y: 0, w: 8, h },
  ];
}

function frame(w: number, h: number, eastDoor: boolean, north?: { x: number; w: number }): Rect[] {
  const gapY = 320;
  const gapH = 88;
  const walls: Rect[] = [];
  if (north) {
    walls.push(
      { x: 0, y: 0, w: north.x, h: 36 },
      { x: north.x + north.w, y: 0, w: w - (north.x + north.w), h: 36 },
    );
  } else {
    walls.push({ x: 0, y: 0, w, h: 36 });
  }
  walls.push({ x: 0, y: h - 36, w, h: 36 });
  walls.push({ x: 0, y: 0, w: 8, h: gapY }, { x: 0, y: gapY + gapH, w: 8, h: h - (gapY + gapH) });
  if (eastDoor) {
    walls.push({ x: w - 8, y: 0, w: 8, h: gapY }, { x: w - 8, y: gapY + gapH, w: 8, h: h - (gapY + gapH) });
  } else {
    walls.push({ x: w - 8, y: 0, w: 8, h });
  }
  return walls;
}

function southGap(w: number, h: number, doorX: number, doorW: number): Rect[] {
  return [
    { x: 0, y: 0, w, h: 36 },
    { x: 0, y: 0, w: 8, h },
    { x: w - 8, y: 0, w: 8, h },
    { x: 0, y: h - 36, w: doorX, h: 36 },
    { x: doorX + doorW, y: h - 36, w: w - (doorX + doorW), h: 36 },
  ];
}

function westGap(w: number, h: number, doorY: number, doorH: number): Rect[] {
  return [
    { x: 0, y: 0, w, h: 36 },
    { x: 0, y: h - 36, w, h: 36 },
    { x: w - 8, y: 0, w: 8, h },
    { x: 0, y: 0, w: 8, h: doorY },
    { x: 0, y: doorY + doorH, w: 8, h: h - (doorY + doorH) },
  ];
}

function alleyFrame(
  w: number,
  h: number,
  north: { x: number; w: number }[],
  south: { x: number; w: number }[],
  west: { y: number; h: number }[],
  east: { y: number; h: number }[],
): Rect[] {
  const walls: Rect[] = [];
  for (const s of wallSegs(w, north)) if (s.w > 4) walls.push({ x: s.x, y: 0, w: s.w, h: 36 });
  for (const s of wallSegs(w, south)) if (s.w > 4) walls.push({ x: s.x, y: h - 36, w: s.w, h: 36 });
  for (const s of wallSegs(h, west.map((g) => ({ x: g.y, w: g.h })))) if (s.w > 4) walls.push({ x: 0, y: s.x, w: 8, h: s.w });
  for (const s of wallSegs(h, east.map((g) => ({ x: g.y, w: g.h })))) if (s.w > 4) walls.push({ x: w - 8, y: s.x, w: 8, h: s.w });
  return walls;
}

function invertWalk(w: number, h: number, walks: Rect[], step = 16): Rect[] {
  const nx = Math.ceil(w / step);
  const ny = Math.ceil(h / step);
  const g: Uint8Array[] = Array.from({ length: ny }, () => new Uint8Array(nx).fill(1));
  for (const r of walks) {
    const x0 = Math.max(0, Math.floor(r.x / step));
    const y0 = Math.max(0, Math.floor(r.y / step));
    const x1 = Math.min(nx, Math.ceil((r.x + r.w) / step));
    const y1 = Math.min(ny, Math.ceil((r.y + r.h) / step));
    for (let y = y0; y < y1; y++) g[y].fill(0, x0, x1);
  }
  const used: Uint8Array[] = Array.from({ length: ny }, () => new Uint8Array(nx));
  const out: Rect[] = [];
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      if (!g[y][x] || used[y][x]) continue;
      let wdt = 1;
      while (x + wdt < nx && g[y][x + wdt] && !used[y][x + wdt]) wdt += 1;
      let hgt = 1;
      outer: while (y + hgt < ny) {
        for (let i = 0; i < wdt; i++) if (!g[y + hgt][x + i] || used[y + hgt][x + i]) break outer;
        hgt += 1;
      }
      for (let yy = 0; yy < hgt; yy++) used[y + yy].fill(1, x, x + wdt);
      if (wdt * step >= 8 && hgt * step >= 8) out.push({ x: x * step, y: y * step, w: wdt * step, h: hgt * step });
    }
  }
  return out;
}

function northGap(w: number, h: number, doorX: number, doorW: number): Rect[] {
  return [
    { x: 0, y: h - 36, w, h: 36 },
    { x: 0, y: 0, w: 8, h },
    { x: w - 8, y: 0, w: 8, h },
    { x: 0, y: 0, w: doorX, h: 36 },
    { x: doorX + doorW, y: 0, w: w - (doorX + doorW), h: 36 },
  ];
}

function wallSegs(len: number, gaps: { x: number; w: number }[]): { x: number; w: number }[] {
  const g = [...gaps].sort((a, b) => a.x - b.x);
  const segs: { x: number; w: number }[] = [];
  let cursor = 0;
  for (const gap of g) {
    const gx = Math.max(0, gap.x);
    if (gx > cursor) segs.push({ x: cursor, w: gx - cursor });
    cursor = Math.max(cursor, gx + gap.w);
  }
  if (cursor < len) segs.push({ x: cursor, w: len - cursor });
  return segs;
}

function streetFrame(
  w: number,
  h: number,
  eastDoor: boolean,
  north: { x: number; w: number }[] = [],
  south: { x: number; w: number }[] = [],
): Rect[] {
  const walls: Rect[] = [];
  for (const s of wallSegs(w, north)) walls.push({ x: s.x, y: 0, w: s.w, h: 36 });
  for (const s of wallSegs(w, south)) walls.push({ x: s.x, y: h - 36, w: s.w, h: 36 });
  const gapY = 320;
  const gapH = 88;
  walls.push({ x: 0, y: 0, w: 8, h: gapY }, { x: 0, y: gapY + gapH, w: 8, h: h - (gapY + gapH) });
  if (eastDoor) {
    walls.push({ x: w - 8, y: 0, w: 8, h: gapY }, { x: w - 8, y: gapY + gapH, w: 8, h: h - (gapY + gapH) });
  } else {
    walls.push({ x: w - 8, y: 0, w: 8, h });
  }
  return walls;
}

function kiezWild(prefix: string, id: string, sprite: string, x: number, y: number, t = 0.4): MapObj {
  const lvl = stageAt(stageKey(prefix), Math.max(0, Math.min(1, t <= 1 ? t : t / 20)));
  return {
    id: `${prefix}_${sprite}_${x}`,
    kind: "wild",
    x,
    y,
    w: 18,
    h: 18,
    sprite,
    label: "Wild",
    once: true,
    mon: id,
    lvl,
  };
}

function kiezLegend(prefix: string, id: string, x: number, y: number, _lvl?: number): MapObj {
  return {
    id: `${prefix}_legend`,
    kind: "wild",
    x,
    y,
    w: 22,
    h: 22,
    sprite: id.replace(/^mon_/, ""),
    label: "Legendär",
    once: false,
    mon: id,
    lvl: stageAt(stageKey(prefix), 0.55, true),
  };
}

function kiezProp(id: string, sprite: string, label: string, x: number, y: number, extra: Partial<MapObj> = {}): MapObj {
  return {
    id,
    kind: "prop",
    x,
    y,
    w: extra.w ?? 16,
    h: extra.h ?? 16,
    sprite,
    label,
    block: false,
    ...extra,
  };
}

function npc(id: string, sprite: string, label: string, x: number, y: number): MapObj {
  return { id, kind: "npc", x, y, w: 24, h: 30, sprite, label, block: true };
}

function trainer(id: string, sprite: string, label: string, x: number, y: number, mon: string, lvl: number): MapObj {
  return { id, kind: "npc", x, y, w: 24, h: 30, sprite, label, block: true, mon, lvl };
}

function kiezDoors(
  id: string,
  w: number,
  h: number,
  alleyX: number,
  alleySide: "north" | "south",
  sewerX: number,
  hatchY?: number,
): { walls: Rect[]; doors: MapObj[]; doorX: number; hatchX: number; hatchY: number } {
  const fromSouth = alleySide === "south";
  const doorX = Math.floor(w / 2) - 24;
  const alleyY = fromSouth ? 640 : 92;
  const hx = 80;
  const hy = hatchY ?? 200;
  const back = fromSouth
    ? gate(`${id}_back`, doorX, 8, 48, 36, "alley", alleyX + 24, alleyY)
    : gate(`${id}_back`, doorX, h - 40, 48, 32, "alley", alleyX + 24, alleyY);
  const backSign = neonSign(`${id}_sign`, doorX + 8, fromSouth ? 52 : h - 88, "alley");
  return {
    walls: fromSouth ? northGap(w, h, doorX - 8, 80) : southGap(w, h, doorX - 8, 80),
    doors: [
      back,
      backSign,
      hatch(`${id}_gully`, hx, hy, "sewer", sewerX, 230),
      neonSign(`${id}_kanal`, hx - 8, hy - 28, "sewer"),
    ],
    doorX,
    hatchX: hx,
    hatchY: hy,
  };
}

function kiezLoot(
  id: string,
  w: number,
  h: number,
  opts: { lamps?: number; mats?: number; bins?: number; matY?: number } = {},
): MapObj[] {
  const binStep = Math.max(240, Math.floor((w - 160) / Math.max(3, opts.bins ?? 6)));
  const lampStep = Math.max(280, Math.floor((w - 200) / Math.max(2, opts.lamps ?? 5)));
  const matStep = Math.max(420, Math.floor((w - 400) / Math.max(1, opts.mats ?? 2)));
  return [
    ...place("bin", `${id}b`, "dumpster", "Tonne", along(80, w - 80, binStep, 18), 58, 18, 18),
    ...(opts.lamps === 0 ? [] : place("lamp", `${id}l`, "lamp", "Lampe", along(160, w - 80, lampStep, 14), 42, 12, 22)),
    ...(opts.mats === 0
      ? []
      : place("mattress", `${id}m`, "mattress", "Matratze", along(400, w - 180, matStep, 20), opts.matY ?? h - 150, 28, 16)),
  ];
}

function canalWalls(w: number): Rect[] {
  const y1 = 256;
  const y2 = 356;
  const t = 12;
  const bridges = [460, 960, 1460];
  const bw = 96;
  const segs: Rect[] = [];
  const edges = [8, ...bridges.flatMap((b) => [b, b + bw]), w - 8];
  for (let i = 0; i < edges.length - 1; i += 2) {
    const a = edges[i];
    const b = edges[i + 1];
    if (b - a > 10) {
      segs.push({ x: a, y: y1, w: b - a, h: t });
      segs.push({ x: a, y: y2, w: b - a, h: t });
    }
  }
  return segs;
}

function cageWalls(): Rect[] {
  const x0 = 360;
  const y0 = 220;
  const x1 = 720;
  const y1 = 500;
  const t = 12;
  const g = 56;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  return [
    { x: x0, y: y0, w: mx - g / 2 - x0, h: t },
    { x: mx + g / 2, y: y0, w: x1 - (mx + g / 2), h: t },
    { x: x0, y: y1 - t, w: mx - g / 2 - x0, h: t },
    { x: mx + g / 2, y: y1 - t, w: x1 - (mx + g / 2), h: t },
    { x: x0, y: y0, w: t, h: my - g / 2 - y0 },
    { x: x0, y: my + g / 2, w: t, h: y1 - (my + g / 2) },
    { x: x1 - t, y: y0, w: t, h: my - g / 2 - y0 },
    { x: x1 - t, y: my + g / 2, w: t, h: y1 - (my + g / 2) },
  ];
}

function alcoveWalls(w: number, h: number): Rect[] {
  const y = 500;
  const t = 14;
  const booths = [80, 500, 920, 1340];
  const bw = 280;
  const walls: Rect[] = [];
  const gaps = booths.map((b) => ({ x: b + 110, w: 56 }));
  for (const s of wallSegs(w, gaps)) {
    if (s.w > 8) walls.push({ x: s.x, y, w: s.w, h: t });
  }
  for (const b of booths) {
    walls.push({ x: b, y, w: t, h: h - 36 - y });
    walls.push({ x: b + bw, y, w: t, h: h - 36 - y });
  }
  return walls;
}

export const LAB_W = 1760;
export const LAB_H = 880;

export const LAB_WALK: Rect[] = [
  { x: 180, y: 688, w: 1400, h: 156 },
  { x: 180, y: 160, w: 88, h: 580 },
  { x: 16, y: 280, w: 200, h: 140 },
  { x: 180, y: 548, w: 1240, h: 100 },
  { x: 1080, y: 200, w: 88, h: 540 },
  { x: 280, y: 300, w: 1120, h: 100 },
  { x: 180, y: 160, w: 1360, h: 88 },
  { x: 1480, y: 36, w: 240, h: 212 },
  { x: 200, y: 80, w: 160, h: 100 },
];

export const LAB_SHADE: Rect[] = [
  { x: 16, y: 280, w: 200, h: 140 },
  { x: 200, y: 80, w: 160, h: 100 },
  { x: 1480, y: 36, w: 240, h: 212 },
  { x: 820, y: 300, w: 200, h: 100 },
];

function labWalls(): Rect[] {
  return [
    ...southGap(LAB_W, LAB_H, 856, 64),
    { x: 8, y: 36, w: 192, h: 44 },
    { x: 8, y: 80, w: 192, h: 200 },
    { x: 360, y: 36, w: 1120, h: 124 },
    { x: 1720, y: 36, w: 32, h: 212 },
    { x: 268, y: 248, w: 812, h: 44 },
    { x: 1168, y: 248, w: 312, h: 44 },
    { x: 268, y: 400, w: 812, h: 148 },
    { x: 1168, y: 400, w: 412, h: 148 },
    { x: 268, y: 648, w: 812, h: 40 },
    { x: 1168, y: 648, w: 412, h: 40 },
    { x: 1580, y: 248, w: 172, h: 596 },
    { x: 8, y: 420, w: 172, h: 424 },
    { x: 1080, y: 436, w: 14, h: 56 },
    { x: 1116, y: 436, w: 52, h: 56 },
  ];
}

function makeLabyrinth(): MapDef {
  const w = LAB_W;
  const h = LAB_H;
  const mons = enc("labyrinth");
  return {
    id: "labyrinth",
    name: "Labyrinth-Schatten",
    w,
    h,
    bg: "/game/maps/labyrinth.png",
    indoor: true,
    walls: labWalls(),
    obstacles: [
      { x: 1080, y: 436, w: 14, h: 56, kind: "fence" },
      { x: 1116, y: 436, w: 52, h: 56, kind: "fence" },
    ],
    deco: [
      ...LAB_SHADE.map((r) => ({ ...r, fill: "rgba(40,20,60,0.22)" })),
      { x: 1480, y: 36, w: 240, h: 212, fill: "rgba(8,6,12,0.55)" },
    ],
    objs: [
      gate("lab_back", 856, 840, 48, 32, "alley", 1784, 80),
      neonSign("lab_sign", 864, 800, "alley"),
      hatch("lab_gully", 110, 340, "sewer", 3920, 230),
      neonSign("lab_kanal", 94, 312, "sewer"),
      npc("shade", "npc_sable", "Shade", 240, 180),
      trainer("hush", "npc_hex", "Hush", 1100, 460, "mon_datawhore", stageAt("labyrinth", 0.85)),
      kiezLegend("labyrinth", "mon_noxarch", 1600, 120, 14),
      kiezWild("labyrinth", "mon_hackroach", "hackroach", 360, 200, 4),
      kiezWild("labyrinth", "mon_datawhore", "datawhore", 820, 330, 6),
      kiezWild("labyrinth", "mon_glitchbitch", "glitchbitch", 1280, 200, 5),
      kiezWild("labyrinth", "mon_hackroach", "hackroach", 480, 560, 5),
      kiezWild("labyrinth", "mon_datawhore", "datawhore", 1400, 640, 7),
      kiezWild("labyrinth", "mon_glitchbitch", "glitchbitch", 200, 700, 6),
      kiezProp("lb_c1", "crate", "Kiste", 300, 120),
      kiezProp("lb_c2", "crate", "Kiste", 1600, 80),
      kiezProp("lb_c3", "crate", "Kiste", 900, 700),
      kiezProp("lb_c4", "crate", "Kiste", 40, 300),
      { id: "lbb0", kind: "bin", x: 220, y: 780, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "lbb1", kind: "bin", x: 1500, y: 700, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "lbb2", kind: "bin", x: 40, y: 380, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "lbl0", kind: "lamp", x: 400, y: 700, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "lbl1", kind: "lamp", x: 400, y: 180, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "lbl2", kind: "lamp", x: 900, y: 330, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "lbl3", kind: "lamp", x: 1520, y: 80, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "lbm0", kind: "mattress", x: 40, y: 360, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
    ],
    zones: LAB_SHADE.map((r) => ({ ...r, mons })),
  };
}

export const ASH_W = 1440;
export const ASH_H = 960;
export const ASH_SPAWN = { x: 720, y: 88 };
export const ASH_HATCH_LAND = { x: 110, y: 350 };

export const ASH_WALK: Rect[] = [
  { x: 480, y: 36, w: 480, h: 130 },
  { x: 200, y: 148, w: 1040, h: 352 },
  { x: 16, y: 156, w: 264, h: 640 },
  { x: 16, y: 700, w: 480, h: 100 },
  { x: 1160, y: 156, w: 264, h: 640 },
  { x: 960, y: 700, w: 464, h: 100 },
  { x: 400, y: 548, w: 640, h: 376 },
  { x: 672, y: 480, w: 96, h: 90 },
];

export const ASH_HOT: Rect[] = [
  { x: 340, y: 220, w: 160, h: 100 },
  { x: 620, y: 280, w: 200, h: 110 },
  { x: 940, y: 210, w: 170, h: 120 },
  { x: 500, y: 640, w: 140, h: 48 },
  { x: 800, y: 640, w: 140, h: 48 },
  { x: 500, y: 856, w: 440, h: 48 },
  { x: 500, y: 688, w: 108, h: 168 },
  { x: 832, y: 688, w: 108, h: 168 },
];

export const ASH_KIPPEN: Rect[] = [
  { x: 300, y: 198, w: 240, h: 26 },
  { x: 300, y: 316, w: 240, h: 24 },
  { x: 600, y: 258, w: 240, h: 26 },
  { x: 600, y: 386, w: 240, h: 24 },
  { x: 920, y: 188, w: 220, h: 26 },
  { x: 920, y: 326, w: 220, h: 24 },
  { x: 1168, y: 220, w: 248, h: 460 },
  { x: 480, y: 560, w: 480, h: 72 },
];

function ashWalls(): Rect[] {
  return [
    ...northGap(ASH_W, ASH_H, 688, 64),
    ...ASH_HOT,
    { x: 8, y: 36, w: 472, h: 112 },
    { x: 960, y: 36, w: 472, h: 112 },
    { x: 280, y: 500, w: 392, h: 16 },
    { x: 768, y: 500, w: 392, h: 16 },
    { x: 280, y: 516, w: 120, h: 184 },
    { x: 1040, y: 516, w: 120, h: 184 },
    { x: 672, y: 512, w: 40, h: 28 },
    { x: 736, y: 512, w: 32, h: 28 },
    { x: 1240, y: 300, w: 72, h: 20 },
    { x: 1300, y: 480, w: 80, h: 18 },
    { x: 160, y: 420, w: 36, h: 48 },
    { x: 500, y: 70, w: 14, h: 40 },
    { x: 926, y: 70, w: 14, h: 40 },
    { x: 1080, y: 800, w: 352, h: 124 },
    { x: 8, y: 800, w: 392, h: 124 },
  ];
}

function makeAsh(): MapDef {
  const w = ASH_W;
  const h = ASH_H;
  const mons = enc("ash");
  return {
    id: "ash",
    name: "Aschegang",
    w,
    h,
    bg: "/game/maps/ash.png",
    walls: ashWalls(),
    ledges: [{ x: 1180, y: 620, w: 100, h: 8, dir: "s" }],
    obstacles: [
      { x: 340, y: 220, w: 160, h: 100, kind: "ember" },
      { x: 620, y: 280, w: 200, h: 110, kind: "ember" },
      { x: 940, y: 210, w: 170, h: 120, kind: "ember" },
      { x: 1240, y: 300, w: 72, h: 20, kind: "block" },
      { x: 1300, y: 480, w: 80, h: 18, kind: "block" },
      { x: 160, y: 420, w: 36, h: 48, kind: "block" },
      { x: 500, y: 70, w: 14, h: 40, kind: "fence" },
      { x: 926, y: 70, w: 14, h: 40, kind: "fence" },
    ],
    deco: [
      ...ASH_HOT.map((r) => ({ ...r, fill: "rgba(196,90,24,0.42)" })),
      ...ASH_KIPPEN.map((r) => ({ ...r, fill: "rgba(200,176,144,0.18)" })),
      { x: 16, y: 156, w: 264, h: 640, fill: "rgba(18,20,24,0.35)" },
      { x: 608, y: 688, w: 224, h: 168, fill: "rgba(90,42,16,0.45)" },
    ],
    objs: [
      gate("ash_back", 696, 8, 48, 36, "alley", 304, 1660),
      neonSign("ash_sign", 704, 52, "alley"),
      hatch("ash_gully", 80, 348, "sewer", 1040, 230),
      neonSign("ash_kanal", 64, 320, "sewer"),
      npc("ember", "npc_raze", "Ember", 540, 70),
      trainer("cinder", "npc_ash", "Cinder", 716, 508, "mon_jointail", stageAt("ash", 0.85)),
      { id: "gate_soot", kind: "npc", x: 480, y: 118, w: 480, h: 22, sprite: "npc_ash", label: "Soot", block: true, mon: "mon_hashound", lvl: stageAt("ash", 0.55) },
      kiezLegend("ash", "mon_glutarch", 700, 740, 14),
      kiezWild("ash", "mon_jointail", "jointail", 380, 210, 5),
      kiezWild("ash", "mon_jointail", "jointail", 700, 268, 6),
      kiezWild("ash", "mon_jointail", "jointail", 980, 200, 7),
      kiezWild("ash", "mon_jointail", "jointail", 1210, 250, 5),
      kiezWild("ash", "mon_jointail", "jointail", 1280, 500, 6),
      kiezWild("ash", "mon_jointail", "jointail", 560, 580, 7),
      kiezWild("ash", "mon_hashound", "hashound", 70, 430, 4),
      kiezWild("ash", "mon_hashound", "hashound", 140, 580, 5),
      kiezProp("ash_b1", "barrel", "Aschefass", 1280, 360),
      kiezProp("ash_b2", "barrel", "Aschefass", 1340, 520),
      kiezProp("ash_b3", "barrel", "Aschefass", 1240, 780),
      kiezProp("ash_b4", "barrel", "Aschefass", 200, 700),
      kiezProp("ash_c1", "crate", "Kiste", 40, 200),
      kiezProp("ash_c2", "crate", "Kiste", 1360, 180),
      kiezProp("ash_c3", "crate", "Kiste", 1080, 780),
      kiezProp("ash_t1", "terminal", "Glut-Log", 1320, 180),
      { id: "ashb0", kind: "bin", x: 460, y: 48, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "ashb1", kind: "bin", x: 920, y: 48, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "ashb2", kind: "bin", x: 48, y: 180, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "ashl0", kind: "lamp", x: 500, y: 44, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "ashl1", kind: "lamp", x: 928, y: 44, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "ashm0", kind: "mattress", x: 40, y: 280, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
    ],
    zones: ASH_KIPPEN.map((r) => ({ ...r, mons })),
  };
}

export const DRAIN_W = 1600;
export const DRAIN_H = 880;
export const DRAIN_SPAWN = { x: 800, y: 88 };
export const DRAIN_HATCH_LAND = { x: 168, y: 760 };

export const DRAIN_WALK: Rect[] = [
  { x: 16, y: 40, w: 904, h: 108 },
  { x: 400, y: 148, w: 120, h: 62 },
  { x: 700, y: 140, w: 68, h: 72 },
  { x: 16, y: 200, w: 1494, h: 66 },
  { x: 48, y: 250, w: 128, h: 170 },
  { x: 1408, y: 250, w: 96, h: 170 },
  { x: 200, y: 408, w: 1310, h: 68 },
  { x: 16, y: 408, w: 192, h: 436 },
  { x: 16, y: 680, w: 324, h: 164 },
  { x: 220, y: 488, w: 1000, h: 148 },
  { x: 1140, y: 468, w: 80, h: 28 },
  { x: 520, y: 468, w: 80, h: 28 },
  { x: 1248, y: 468, w: 52, h: 200 },
  { x: 700, y: 660, w: 600, h: 48 },
  { x: 1252, y: 660, w: 48, h: 200 },
  { x: 700, y: 812, w: 600, h: 48 },
  { x: 700, y: 660, w: 48, h: 200 },
  { x: 840, y: 700, w: 180, h: 112 },
  { x: 748, y: 744, w: 92, h: 40 },
];

export const DRAIN_WATER: Deco[] = [
  { x: 16, y: 148, w: 384, h: 52, fill: "rgba(10,28,36,0.78)" },
  { x: 520, y: 148, w: 180, h: 52, fill: "rgba(10,28,36,0.78)" },
  { x: 768, y: 148, w: 824, h: 52, fill: "rgba(10,28,36,0.78)" },
  { x: 16, y: 266, w: 32, h: 142, fill: "rgba(8,22,30,0.88)" },
  { x: 176, y: 266, w: 1232, h: 142, fill: "rgba(8,22,30,0.88)" },
  { x: 1504, y: 266, w: 88, h: 142, fill: "rgba(8,22,30,0.88)" },
  { x: 748, y: 708, w: 92, h: 36, fill: "rgba(8,30,34,0.84)" },
  { x: 748, y: 784, w: 92, h: 28, fill: "rgba(8,30,34,0.84)" },
  { x: 1020, y: 708, w: 232, h: 104, fill: "rgba(8,30,34,0.84)" },
];

export const DRAIN_TOILETS: Rect[] = [
  { x: 48, y: 100, w: 18, h: 24 },
  { x: 1330, y: 214, w: 18, h: 24 },
  { x: 292, y: 798, w: 18, h: 24 },
];

export const DRAIN_VALVES: Rect[] = [
  { x: 220, y: 206, w: 12, h: 12 },
  { x: 580, y: 206, w: 12, h: 12 },
  { x: 980, y: 206, w: 12, h: 12 },
  { x: 1438, y: 330, w: 12, h: 12 },
  { x: 90, y: 710, w: 12, h: 12 },
  { x: 1418, y: 268, w: 12, h: 12 },
];

export const DRAIN_PIPES: Rect[] = [
  { x: 16, y: 186, w: 1494, h: 14 },
  { x: 40, y: 36, w: 20, h: 70 },
  { x: 640, y: 36, w: 18, h: 80 },
  { x: 1100, y: 186, w: 22, h: 90 },
  { x: 20, y: 668, w: 90, h: 16 },
  { x: 300, y: 668, w: 16, h: 80 },
];

function drainWalls(): Rect[] {
  return [
    ...northGap(DRAIN_W, DRAIN_H, 768, 64),
    ...DRAIN_WATER.map(({ x, y, w, h }) => ({ x, y, w, h })),
    { x: 920, y: 36, w: 672, h: 112 },
    { x: 200, y: 476, w: 320, h: 14 },
    { x: 600, y: 476, w: 540, h: 14 },
    { x: 1220, y: 476, w: 28, h: 14 },
    { x: 1300, y: 476, w: 292, h: 368 },
    { x: 208, y: 488, w: 12, h: 32 },
    { x: 208, y: 580, w: 12, h: 56 },
    { x: 220, y: 636, w: 1028, h: 24 },
    { x: 1220, y: 488, w: 28, h: 172 },
    { x: 208, y: 636, w: 492, h: 24 },
    { x: 340, y: 660, w: 360, h: 184 },
    { x: 208, y: 668, w: 132, h: 14 },
    { x: 340, y: 680, w: 12, h: 164 },
    { x: 830, y: 408, w: 48, h: 24 },
    { x: 830, y: 456, w: 48, h: 20 },
    { x: 1408, y: 268, w: 8, h: 140 },
    { x: 1496, y: 268, w: 8, h: 140 },
    { x: 1510, y: 200, w: 82, h: 66 },
    { x: 236, y: 40, w: 12, h: 40 },
    { x: 236, y: 118, w: 12, h: 30 },
    { x: 200, y: 220, w: 40, h: 20 },
    { x: 860, y: 222, w: 72, h: 40 },
    { x: 1270, y: 200, w: 14, h: 28 },
    { x: 1270, y: 246, w: 14, h: 20 },
    { x: 250, y: 820, w: 48, h: 36 },
    { x: 40, y: 800, w: 40, h: 36 },
    ...DRAIN_TOILETS,
    ...DRAIN_VALVES,
  ];
}

function makeDrain(): MapDef {
  const w = DRAIN_W;
  const h = DRAIN_H;
  const mons = enc("drain");
  return {
    id: "drain",
    name: "Abfluss",
    w,
    h,
    bg: "/game/maps/drain.png",
    walls: drainWalls(),
    ledges: [{ x: 400, y: 196, w: 120, h: 8, dir: "s" }],
    obstacles: [
      { x: 236, y: 40, w: 12, h: 40, kind: "fence" },
      { x: 236, y: 118, w: 12, h: 30, kind: "fence" },
      { x: 200, y: 220, w: 40, h: 20, kind: "pipe" },
      { x: 860, y: 222, w: 72, h: 40, kind: "pipe" },
      { x: 1270, y: 200, w: 14, h: 28, kind: "pipe" },
      { x: 1270, y: 246, w: 14, h: 20, kind: "pipe" },
      { x: 250, y: 820, w: 48, h: 36, kind: "pipe" },
      { x: 40, y: 800, w: 40, h: 36, kind: "pipe" },
      { x: 500, y: 292, w: 72, h: 88, kind: "block" },
      { x: 920, y: 292, w: 80, h: 88, kind: "block" },
      ...DRAIN_TOILETS.map((r) => ({ ...r, kind: "toilet" as const })),
      ...DRAIN_VALVES.map((r) => ({ ...r, kind: "valve" as const })),
    ],
    deco: [
      ...DRAIN_WATER,
      { x: 220, y: 488, w: 1000, h: 148, fill: "rgba(32,52,24,0.38)" },
      { x: 16, y: 218, w: 1494, h: 10, fill: "rgba(36,88,48,0.22)" },
      { x: 700, y: 676, w: 600, h: 10, fill: "rgba(36,88,48,0.18)" },
      { x: 752, y: 44, w: 40, h: 8, fill: "rgba(70,210,220,0.32)" },
      { x: 500, y: 280, w: 72, h: 112, fill: "rgba(90,42,24,0.35)" },
      { x: 920, y: 280, w: 80, h: 112, fill: "rgba(90,42,24,0.35)" },
      { x: 16, y: 186, w: 1494, h: 14, fill: "rgba(90,56,32,0.28)" },
      { x: 48, y: 100, w: 18, h: 24, fill: "rgba(138,140,130,0.4)" },
    ],
    objs: [
      gate("drain_back", 776, 8, 48, 36, "alley", 1016, 1660),
      neonSign("drain_sign", 784, 52, "alley"),
      hatch("drain_gully", 132, 744, "sewer", 2000, 230),
      neonSign("drain_kanal", 116, 716, "sewer"),
      npc("murk", "npc_drip", "Murk", 620, 96),
      npc("leck", "npc_hex", "Leck", 80, 88),
      trainer("tide", "npc_lumen", "Tide", 848, 432, "mon_cumulus", stageAt("drain", 0.85)),
      { id: "gate_sluice", kind: "npc", x: 16, y: 116, w: 904, h: 24, sprite: "npc_drip", label: "Sluice", block: true, mon: "mon_puffpuff", lvl: stageAt("drain", 0.55) },
      kiezLegend("drain", "mon_rohrlethe", 910, 748, 14),
      kiezWild("drain", "mon_cumulus", "cumulus", 300, 222, 5),
      kiezWild("drain", "mon_cumulus", "cumulus", 640, 228, 6),
      kiezWild("drain", "mon_cumulus", "cumulus", 1040, 218, 7),
      kiezWild("drain", "mon_puffpuff", "puffpuff", 380, 540, 4),
      kiezWild("drain", "mon_puffpuff", "puffpuff", 900, 552, 5),
      kiezWild("drain", "mon_cumulus", "cumulus", 1360, 430, 6),
      kiezProp("dr_b1", "barrel", "Nassfass", 140, 120),
      kiezProp("dr_b2", "barrel", "Nassfass", 710, 780),
      kiezProp("dr_b3", "barrel", "Nassfass", 1100, 824),
      kiezProp("dr_b4", "barrel", "Nassfass", 280, 770),
      kiezProp("dr_c1", "crate", "Kiste", 180, 58),
      kiezProp("dr_c2", "crate", "Kiste", 1388, 210),
      kiezProp("dr_c3", "crate", "Kiste", 200, 786),
      { id: "drainb0", kind: "bin", x: 52, y: 52, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "drainb1", kind: "bin", x: 700, y: 600, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "drainb2", kind: "bin", x: 1450, y: 210, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "drainb3", kind: "bin", x: 240, y: 700, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "drainl0", kind: "lamp", x: 480, y: 44, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "drainl1", kind: "lamp", x: 1100, y: 202, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "drainl2", kind: "lamp", x: 1440, y: 318, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "drainl3", kind: "lamp", x: 40, y: 690, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "drainm0", kind: "mattress", x: 480, y: 580, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
    ],
    zones: [
      { x: 16, y: 200, w: 1388, h: 66, mons },
      { x: 220, y: 488, w: 1000, h: 148, mons },
      { x: 700, y: 660, w: 600, h: 48, mons },
      { x: 920, y: 408, w: 480, h: 68, mons },
    ],
  };
}

export const CHEM_W = 1360;
export const CHEM_H = 1040;
export const CHEM_SPAWN = { x: 688, y: 980 };
export const CHEM_HATCH_LAND = { x: 80, y: 960 };

export const CHEM_VATS: Rect[] = [
  { x: 260, y: 700, w: 160, h: 120 },
  { x: 580, y: 700, w: 160, h: 120 },
  { x: 900, y: 700, w: 160, h: 120 },
  { x: 260, y: 440, w: 160, h: 120 },
  { x: 580, y: 440, w: 160, h: 120 },
  { x: 900, y: 440, w: 160, h: 120 },
];

export const CHEM_WALK: Rect[] = [
  { x: 200, y: 848, w: 960, h: 156 },
  { x: 16, y: 848, w: 220, h: 156 },
  { x: 200, y: 316, w: 960, h: 544 },
  { x: 16, y: 200, w: 220, h: 660 },
  { x: 1140, y: 80, w: 204, h: 800 },
  { x: 860, y: 80, w: 300, h: 90 },
  { x: 400, y: 36, w: 560, h: 280 },
  { x: 640, y: 260, w: 80, h: 70 },
];

export const CHEM_STEAM: Rect[] = CHEM_VATS.map((v) => ({
  x: v.x - 16,
  y: v.y - 16,
  w: v.w + 32,
  h: v.h + 32,
}));

export const CHEM_FILL: Rect[] = [
  { x: 500, y: 48, w: 280, h: 24 },
  { x: 500, y: 72, w: 80, h: 140 },
  { x: 740, y: 72, w: 40, h: 140 },
  { x: 500, y: 212, w: 70, h: 36 },
  { x: 710, y: 212, w: 70, h: 36 },
];

function chemWalls(): Rect[] {
  return [
    ...southGap(CHEM_W, CHEM_H, 656, 64),
    ...CHEM_VATS,
    ...CHEM_FILL,
    { x: 8, y: 36, w: 392, h: 164 },
    { x: 960, y: 36, w: 180, h: 44 },
    { x: 1140, y: 36, w: 212, h: 44 },
    { x: 200, y: 300, w: 440, h: 16 },
    { x: 720, y: 300, w: 420, h: 16 },
    { x: 640, y: 292, w: 32, h: 24 },
    { x: 688, y: 292, w: 32, h: 24 },
    { x: 160, y: 420, w: 36, h: 48 },
    { x: 1160, y: 880, w: 192, h: 124 },
  ];
}

function makeChem(): MapDef {
  const w = CHEM_W;
  const h = CHEM_H;
  const mons = enc("chem");
  return {
    id: "chem",
    name: "Chemiegasse",
    w,
    h,
    bg: "/game/maps/chem.png",
    walls: chemWalls(),
    ledges: [{ x: 500, y: 560, w: 80, h: 8, dir: "s" }],
    obstacles: [
      ...CHEM_VATS.map((r) => ({ ...r, kind: "block" as const })),
      { x: 160, y: 420, w: 36, h: 48, kind: "block" },
      { x: 640, y: 292, w: 32, h: 24, kind: "fence" },
      { x: 688, y: 292, w: 32, h: 24, kind: "fence" },
    ],
    deco: [
      ...CHEM_VATS.map((r) => ({ ...r, fill: "rgba(200,210,50,0.28)" })),
      ...CHEM_STEAM.map((r) => ({ ...r, fill: "rgba(200,210,50,0.10)" })),
      { x: 16, y: 200, w: 220, h: 660, fill: "rgba(26,32,24,0.40)" },
      { x: 1140, y: 80, w: 204, h: 800, fill: "rgba(40,70,55,0.18)" },
      { x: 580, y: 72, w: 160, h: 140, fill: "rgba(184,192,64,0.35)" },
    ],
    objs: [
      gate("chem_back", 656, 1004, 48, 32, "alley", 1144, 80),
      neonSign("chem_sign", 664, 968, "alley"),
      hatch("chem_gully", 64, 952, "sewer", 2480, 230),
      neonSign("chem_kanal", 48, 924, "sewer"),
      npc("fume", "npc_nox", "Fume", 400, 920),
      trainer("vial", "npc_pex", "Vial", 672, 290, "mon_cracksprite", stageAt("chem", 0.85)),
      { id: "gate_dose", kind: "npc", x: 16, y: 864, w: 1144, h: 22, sprite: "npc_nox", label: "Dose", block: true, mon: "mon_cracksprite", lvl: stageAt("chem", 0.55) },
      kiezLegend("chem", "mon_vialith", 640, 130, 14),
      kiezWild("chem", "mon_cracksprite", "cracksprite", 250, 690, 5),
      kiezWild("chem", "mon_cracksprite", "cracksprite", 570, 690, 6),
      kiezWild("chem", "mon_cracksprite", "cracksprite", 890, 690, 7),
      kiezWild("chem", "mon_cracksprite", "cracksprite", 250, 430, 5),
      kiezWild("chem", "mon_cracksprite", "cracksprite", 890, 430, 6),
      kiezWild("chem", "mon_cracksprite", "cracksprite", 1200, 200, 7),
      kiezWild("chem", "mon_puffpuff", "puffpuff", 80, 280, 4),
      kiezWild("chem", "mon_puffpuff", "puffpuff", 140, 500, 5),
      kiezProp("ch_b1", "barrel", "Giftfass", 60, 220),
      kiezProp("ch_b2", "barrel", "Giftfass", 180, 600),
      kiezProp("ch_b3", "barrel", "Giftfass", 820, 180),
      kiezProp("ch_b4", "barrel", "Giftfass", 300, 900),
      kiezProp("ch_c1", "crate", "Kiste", 40, 880),
      kiezProp("ch_c2", "crate", "Kiste", 1100, 900),
      { id: "chemb0", kind: "bin", x: 220, y: 860, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "chemb1", kind: "bin", x: 1100, y: 860, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "chemb2", kind: "bin", x: 40, y: 860, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "cheml0", kind: "lamp", x: 340, y: 620, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "cheml1", kind: "lamp", x: 660, y: 620, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "cheml2", kind: "lamp", x: 980, y: 620, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "chemm0", kind: "mattress", x: 40, y: 240, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
    ],
    zones: CHEM_STEAM.map((r) => ({ ...r, mons })),
  };
}

export const RING_W = 1120;
export const RING_H = 960;

export const RING_WALK: Rect[] = [
  { x: 200, y: 36, w: 720, h: 250 },
  { x: 760, y: 280, w: 280, h: 400 },
  { x: 200, y: 640, w: 720, h: 284 },
  { x: 16, y: 200, w: 250, h: 400 },
  { x: 372, y: 292, w: 376, h: 336 },
  { x: 740, y: 420, w: 40, h: 80 },
];

export const RING_CAGE: Rect[] = [
  { x: 360, y: 280, w: 160, h: 12 },
  { x: 600, y: 280, w: 160, h: 12 },
  { x: 360, y: 628, w: 120, h: 12 },
  { x: 600, y: 628, w: 160, h: 12 },
  { x: 360, y: 280, w: 12, h: 360 },
  { x: 748, y: 280, w: 12, h: 140 },
  { x: 748, y: 500, w: 12, h: 140 },
];

export const RING_CHALK: Rect[] = [
  { x: 400, y: 320, w: 320, h: 280 },
  { x: 220, y: 48, w: 280, h: 40 },
];

function ringWalls(): Rect[] {
  return [
    ...northGap(RING_W, RING_H, 536, 64),
    ...RING_CAGE,
    { x: 520, y: 268, w: 32, h: 24 },
    { x: 568, y: 268, w: 32, h: 24 },
    { x: 40, y: 240, w: 36, h: 80 },
    { x: 40, y: 360, w: 36, h: 80 },
    { x: 40, y: 480, w: 36, h: 80 },
    { x: 200, y: 220, w: 24, h: 28 },
    { x: 8, y: 36, w: 192, h: 164 },
    { x: 920, y: 36, w: 192, h: 244 },
    { x: 920, y: 680, w: 192, h: 244 },
    { x: 8, y: 600, w: 192, h: 324 },
  ];
}

function makeRing(): MapDef {
  const w = RING_W;
  const h = RING_H;
  const mons = enc("ring");
  return {
    id: "ring",
    name: "Ring",
    w,
    h,
    bg: "/game/maps/ring.png",
    walls: ringWalls(),
    ledges: [{ x: 480, y: 636, w: 120, h: 8, dir: "n" }],
    obstacles: [
      ...RING_CAGE.map((r) => ({ ...r, kind: "fence" as const })),
      { x: 520, y: 268, w: 32, h: 24, kind: "fence" },
      { x: 568, y: 268, w: 32, h: 24, kind: "fence" },
      { x: 40, y: 240, w: 36, h: 80, kind: "block" },
      { x: 40, y: 360, w: 36, h: 80, kind: "block" },
      { x: 40, y: 480, w: 36, h: 80, kind: "block" },
      { x: 200, y: 220, w: 24, h: 28, kind: "block" },
    ],
    deco: [
      { x: 372, y: 292, w: 376, h: 336, fill: "rgba(212,90,58,0.14)" },
      { x: 400, y: 320, w: 320, h: 280, fill: "rgba(200,192,168,0.10)" },
      { x: 16, y: 200, w: 250, h: 400, fill: "rgba(16,14,12,0.40)" },
      { x: 760, y: 420, w: 80, h: 80, fill: "rgba(42,34,24,0.35)" },
    ],
    objs: [
      gate("ring_back", 536, 8, 48, 32, "alley", 1448, 1660),
      neonSign("ring_sign", 544, 48, "alley"),
      hatch("ring_gully", 110, 360, "sewer", 3440, 230),
      neonSign("ring_kanal", 94, 332, "sewer"),
      npc("cage", "npc_vex", "Cage", 220, 100),
      trainer("knuckle", "npc_rook", "Knuckle", 552, 270, "mon_neonpunx", stageAt("ring", 0.85)),
      kiezLegend("ring", "mon_cagekaiser", 540, 420, 14),
      kiezWild("ring", "mon_neonpunx", "neonpunx", 400, 360, 5),
      kiezWild("ring", "mon_neonpunx", "neonpunx", 680, 400, 6),
      kiezWild("ring", "mon_neonpunx", "neonpunx", 500, 540, 7),
      kiezWild("ring", "mon_neonpunx", "neonpunx", 140, 280, 5),
      kiezWild("ring", "mon_gridbruiser", "gridbruiser", 800, 200, 6),
      kiezWild("ring", "mon_gridbruiser", "gridbruiser", 400, 720, 5),
      kiezWild("ring", "mon_gridbruiser", "gridbruiser", 900, 500, 7),
      kiezProp("rg_c1", "crate", "Kiste", 90, 520),
      kiezProp("rg_c2", "crate", "Kiste", 880, 400),
      kiezProp("rg_c3", "crate", "Kiste", 500, 160),
      { id: "ringb0", kind: "bin", x: 220, y: 50, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "ringb1", kind: "bin", x: 880, y: 80, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "ringb2", kind: "bin", x: 240, y: 700, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "ringl0", kind: "lamp", x: 300, y: 80, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "ringl1", kind: "lamp", x: 800, y: 80, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "ringl2", kind: "lamp", x: 540, y: 200, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "ringm0", kind: "mattress", x: 80, y: 540, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
    ],
    zones: RING_CHALK.map((r) => ({ ...r, mons })),
  };
}

export const NISCHE_W = 1840;
export const NISCHE_H = 880;
export const NISCHE_NORTH_X = [320, 560, 1080, 1320];
export const NISCHE_SOUTH_X = [320, 560, 800, 1080, 1320];
const NISCHE_BW = 200;

export const NISCHE_WALK: Rect[] = [
  { x: 800, y: 36, w: 240, h: 200 },
  { x: 280, y: 200, w: 1280, h: 208 },
  { x: 16, y: 80, w: 280, h: 560 },
  ...NISCHE_NORTH_X.map((x) => ({ x: x + 12, y: 48, w: 176, h: 160 })),
  ...NISCHE_SOUTH_X.map((x) => ({ x: x + 12, y: 400, w: 176, h: 208 })),
  { x: 1560, y: 180, w: 260, h: 300 },
  { x: 16, y: 640, w: 1804, h: 204 },
  { x: 1560, y: 480, w: 260, h: 180 },
];

export const NISCHE_PINK: Rect[] = [
  ...NISCHE_NORTH_X.map((x) => ({ x: x + 12, y: 48, w: 176, h: 160 })),
  ...NISCHE_SOUTH_X.map((x) => ({ x: x + 12, y: 400, w: 176, h: 160 })),
  { x: 1580, y: 200, w: 220, h: 240 },
];

function nischeBoothWalls(): Rect[] {
  const walls: Rect[] = [];
  for (const x of NISCHE_NORTH_X) {
    walls.push({ x, y: 36, w: 12, h: 176 });
    walls.push({ x: x + NISCHE_BW - 12, y: 36, w: 12, h: 176 });
  }
  for (const x of NISCHE_SOUTH_X) {
    walls.push({ x, y: 400, w: 12, h: 220 });
    walls.push({ x: x + NISCHE_BW - 12, y: 400, w: 12, h: 220 });
    walls.push({ x, y: 608, w: NISCHE_BW, h: 12 });
  }
  return walls;
}

function nischeWalls(): Rect[] {
  return [
    ...northGap(NISCHE_W, NISCHE_H, 896, 64),
    ...nischeBoothWalls(),
    { x: 1472, y: 200, w: 28, h: 92 },
    { x: 1472, y: 314, w: 28, h: 86 },
    { x: 320, y: 620, w: 1240, h: 20 },
    { x: 1520, y: 36, w: 40, h: 164 },
    { x: 1040, y: 36, w: 40, h: 164 },
    { x: 760, y: 36, w: 40, h: 164 },
  ];
}

function makeNische(): MapDef {
  const w = NISCHE_W;
  const h = NISCHE_H;
  const mons = enc("nische");
  return {
    id: "nische",
    name: "Sex-Nischen",
    w,
    h,
    bg: "/game/maps/nische.png",
    indoor: true,
    walls: nischeWalls(),
    obstacles: [
      { x: 1472, y: 200, w: 28, h: 92, kind: "fence" },
      { x: 1472, y: 314, w: 28, h: 86, kind: "fence" },
      ...nischeBoothWalls().map((r) => ({ ...r, kind: "fence" as const })),
    ],
    deco: [
      ...NISCHE_PINK.map((r) => ({ ...r, fill: "rgba(255,138,212,0.14)" })),
      { x: 16, y: 640, w: 1804, h: 140, fill: "rgba(20,8,16,0.40)" },
      { x: 1560, y: 180, w: 260, h: 300, fill: "rgba(255,106,173,0.16)" },
    ],
    objs: [
      gate("nische_back", 896, 8, 48, 32, "alley", 2008, 1660),
      neonSign("nische_sign", 904, 48, "alley"),
      hatch("nische_gully", 110, 340, "sewer", 4880, 230),
      neonSign("nische_kanal", 94, 312, "sewer"),
      npc("velvet", "npc_cherry", "Velvet", 200, 160),
      trainer("glow", "npc_nix", "Glow", 1476, 292, "mon_glitchbitch", stageAt("nische", 0.85)),
      kiezLegend("nische", "mon_velouryx", 1680, 280, 14),
      kiezWild("nische", "mon_glitchbitch", "glitchbitch", 420, 120, 5),
      kiezWild("nische", "mon_cracksprite", "cracksprite", 640, 120, 6),
      kiezWild("nische", "mon_lustleaf", "lustleaf", 1200, 120, 5),
      kiezWild("nische", "mon_glitchbitch", "glitchbitch", 500, 480, 7),
      kiezWild("nische", "mon_cracksprite", "cracksprite", 1400, 480, 6),
      kiezWild("nische", "mon_lustleaf", "lustleaf", 860, 480, 4),
      kiezWild("nische", "mon_glitchbitch", "glitchbitch", 1680, 500, 6),
      kiezProp("ni_c1", "crate", "Kiste", 40, 200),
      kiezProp("ni_c2", "crate", "Kiste", 1700, 220),
      kiezProp("ni_c3", "crate", "Kiste", 900, 700),
      { id: "nib0", kind: "bin", x: 40, y: 280, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "nib1", kind: "bin", x: 40, y: 700, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "nib2", kind: "bin", x: 1760, y: 700, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "nil0", kind: "lamp", x: 400, y: 220, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "nil1", kind: "lamp", x: 920, y: 220, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "nil2", kind: "lamp", x: 1320, y: 220, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "nim0", kind: "mattress", x: 360, y: 520, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
      { id: "nim1", kind: "mattress", x: 600, y: 520, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
      { id: "nim2", kind: "mattress", x: 840, y: 520, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
      { id: "nim3", kind: "mattress", x: 1120, y: 520, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
      { id: "nim4", kind: "mattress", x: 1360, y: 520, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
    ],
    zones: NISCHE_PINK.map((r) => ({ ...r, mons })),
  };
}

export const SCRAP_W = 1760;
export const SCRAP_H = 880;

export const SCRAP_WALK: Rect[] = [
  { x: 160, y: 520, w: 1440, h: 324 },
  { x: 160, y: 36, w: 1440, h: 370 },
  { x: 16, y: 280, w: 264, h: 280 },
  { x: 840, y: 400, w: 120, h: 120 },
  { x: 736, y: 88, w: 306, h: 164 },
];

export const SCRAP_BELT: Rect[] = [
  { x: 280, y: 400, w: 560, h: 72 },
  { x: 960, y: 400, w: 520, h: 72 },
];

export const SCRAP_PILES: Rect[] = [
  { x: 300, y: 580, w: 160, h: 100 },
  { x: 980, y: 680, w: 200, h: 80 },
  { x: 1200, y: 560, w: 180, h: 120 },
  { x: 300, y: 120, w: 140, h: 90 },
  { x: 1300, y: 100, w: 160, h: 110 },
];

export const SCRAP_RUST: Rect[] = [
  { x: 280, y: 560, w: 200, h: 40 },
  { x: 960, y: 760, w: 240, h: 36 },
  { x: 1180, y: 680, w: 220, h: 40 },
  { x: 720, y: 280, w: 320, h: 40 },
  { x: 736, y: 88, w: 306, h: 164 },
];

function scrapPileRing(): Rect[] {
  return [
    { x: 700, y: 70, w: 360, h: 18 },
    { x: 700, y: 252, w: 140, h: 18 },
    { x: 960, y: 252, w: 100, h: 18 },
    { x: 700, y: 70, w: 18, h: 200 },
    { x: 1042, y: 70, w: 18, h: 200 },
  ];
}

function scrapWalls(): Rect[] {
  return [
    ...southGap(SCRAP_W, SCRAP_H, 856, 64),
    ...SCRAP_BELT,
    ...SCRAP_PILES,
    ...scrapPileRing(),
    { x: 840, y: 400, w: 48, h: 72 },
    { x: 904, y: 400, w: 56, h: 72 },
    { x: 8, y: 36, w: 152, h: 244 },
    { x: 8, y: 560, w: 152, h: 284 },
    { x: 1600, y: 36, w: 152, h: 484 },
    { x: 1600, y: 520, w: 152, h: 324 },
    { x: 1480, y: 400, w: 272, h: 120 },
  ];
}

function makeScrap(): MapDef {
  const w = SCRAP_W;
  const h = SCRAP_H;
  const mons = enc("scrap");
  return {
    id: "scrap",
    name: "Schrotttor",
    w,
    h,
    bg: "/game/maps/scrap.png",
    walls: scrapWalls(),
    obstacles: [
      ...SCRAP_BELT.map((r) => ({ ...r, kind: "block" as const })),
      ...SCRAP_PILES.map((r) => ({ ...r, kind: "block" as const })),
      ...scrapPileRing().map((r) => ({ ...r, kind: "fence" as const })),
      { x: 840, y: 400, w: 48, h: 72, kind: "block" },
      { x: 904, y: 400, w: 56, h: 72, kind: "block" },
    ],
    deco: [
      { x: 280, y: 400, w: 1200, h: 72, fill: "rgba(90,70,40,0.28)" },
      ...SCRAP_RUST.map((r) => ({ ...r, fill: "rgba(154,90,40,0.16)" })),
      { x: 736, y: 88, w: 306, h: 164, fill: "rgba(180,70,30,0.14)" },
    ],
    objs: [
      gate("scrap_back", 856, 844, 48, 32, "alley", 2184, 80),
      neonSign("scrap_sign", 864, 800, "alley"),
      hatch("scrap_gully", 110, 360, "sewer", 5360, 230),
      neonSign("scrap_kanal", 94, 332, "sewer"),
      npc("weld", "npc_jax", "Weld", 240, 220),
      trainer("coil", "npc_hex", "Coil", 888, 420, "mon_firewallf", stageAt("scrap", 0.85)),
      kiezLegend("scrap", "mon_slagodon", 880, 160, 14),
      kiezWild("scrap", "mon_firewallf", "firewallf", 400, 280, 5),
      kiezWild("scrap", "mon_hackroach", "hackroach", 640, 180, 4),
      kiezWild("scrap", "mon_firewallf", "firewallf", 1300, 330, 7),
      kiezWild("scrap", "mon_hackroach", "hackroach", 560, 540, 5),
      kiezWild("scrap", "mon_firewallf", "firewallf", 1500, 240, 6),
      kiezWild("scrap", "mon_hackroach", "hackroach", 200, 480, 6),
      kiezProp("sc_c1", "crate", "Kiste", 180, 400),
      kiezProp("sc_c2", "crate", "Kiste", 1500, 600),
      kiezProp("sc_b1", "barrel", "Fass", 820, 300),
      kiezProp("sc_t1", "terminal", "Kran-Log", 480, 160),
      kiezProp("sc_t2", "terminal", "Presse", 1400, 600),
      { id: "scb0", kind: "bin", x: 200, y: 700, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "scb1", kind: "bin", x: 1100, y: 700, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "scb2", kind: "bin", x: 40, y: 400, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "scl0", kind: "lamp", x: 500, y: 540, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "scl1", kind: "lamp", x: 1100, y: 180, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "scl2", kind: "lamp", x: 880, y: 480, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "scm0", kind: "mattress", x: 40, y: 480, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
    ],
    zones: SCRAP_RUST.map((r) => ({ ...r, mons })),
  };
}

const CABLE_WILDS: MapObj[] = [
  { id: "c_roach", kind: "wild", x: 360, y: 250, w: 18, h: 18, sprite: "hackroach", label: "Wild", once: true, mon: "mon_hackroach", lvl: stageAt("cable", 0.15) },
  { id: "c_glitch", kind: "wild", x: 820, y: 250, w: 18, h: 18, sprite: "glitchbitch", label: "Wild", once: true, mon: "mon_glitchbitch", lvl: stageAt("cable", 0.4) },
  { id: "c_data", kind: "wild", x: 500, y: 640, w: 18, h: 18, sprite: "datawhore", label: "Wild", once: true, mon: "mon_datawhore", lvl: stageAt("cable", 0.7) },
  { id: "c_fire", kind: "wild", x: 400, y: 500, w: 18, h: 18, sprite: "firewallf", label: "Wild", once: true, mon: "mon_firewallf", lvl: stageAt("cable", 0.85) },
  { id: "c_roach2", kind: "wild", x: 560, y: 280, w: 18, h: 18, sprite: "hackroach", label: "Wild", once: true, mon: "mon_hackroach", lvl: stageAt("cable", 0.3) },
  { id: "c_glitch2", kind: "wild", x: 1200, y: 250, w: 18, h: 18, sprite: "glitchbitch", label: "Wild", once: true, mon: "mon_glitchbitch", lvl: stageAt("cable", 0.55) },
  { id: "c_data2", kind: "wild", x: 1400, y: 640, w: 18, h: 18, sprite: "datawhore", label: "Wild", once: true, mon: "mon_datawhore", lvl: stageAt("cable", 0.75) },
  { id: "c_fire2", kind: "wild", x: 1760, y: 220, w: 18, h: 18, sprite: "firewallf", label: "Wild", once: true, mon: "mon_firewallf", lvl: stageAt("cable", 0.9) },
  kiezLegend("cable", "mon_rootkaiser", 980, 90),
];

function cableWalls(): Rect[] {
  return [
    ...boxFrame(CABLE_W, CABLE_H),
    ...CABLE_RACKS,
    ...CABLE_TEETH,
    ...CABLE_LIVE,
    ...CABLE_FILL,
    { x: 296, y: 36, w: 552, h: 52 },
    { x: 1128, y: 36, w: 576, h: 52 },
  ];
}

function enc(map: string): EncounterZone["mons"] {
  return districtByMap(map)?.mons ?? [{ id: "mon_puffpuff", lvl: [2, 3], w: 1 }];
}

const ALLEY_MASSES = invertWalk(WORLD_W, WORLD_H, ALLEY_WALK);
const BLOCK_TONES = ["#6a6a74", "#3a6a88", "#8a4a6a", "#8a6a38", "#3a6a44", "#5a4a78", "#7a4a52", "#6a5a3a"];

function alleyBuildings(): Building[] {
  const named: { name: string; x: number; y: number; tone: string; side: "n" | "s" }[] = [
    { name: "Mira", x: 980, y: 600, tone: "#6ec8ff", side: "n" },
    { name: "Raze", x: 430, y: 920, tone: "#c8a050", side: "n" },
    { name: "Cherry", x: 1860, y: 1280, tone: "#ff8ad4", side: "s" },
  ];
  return ALLEY_MASSES.filter((r) => r.w >= 56 && r.h >= 56).map((r, i) => {
    const hit = named.find((n) => n.x >= r.x && n.x < r.x + r.w && n.y >= r.y && n.y < r.y + r.h);
    let x = r.x;
    let y = r.y;
    let w = r.w;
    let h = r.h;
    if (hit) {
      w = Math.min(r.w, 280);
      h = Math.min(r.h, 180);
      x = Math.max(r.x, Math.min(r.x + r.w - w, hit.x - Math.floor(w / 2)));
      y = hit.side === "n" ? r.y + r.h - h : r.y;
    }
    return {
      id: `ab${i}`,
      x,
      y,
      w,
      h,
      tone: hit?.tone ?? BLOCK_TONES[i % BLOCK_TONES.length]!,
      name: hit?.name,
      side: hit?.side ?? (r.y >= 1000 ? "s" : "n"),
      variant: i % 6,
    };
  });
}

function doorOnHouse(id: string, b: Building, dest: string, label: string): MapObj {
  const w = 18;
  const h = 24;
  const x = b.x + Math.floor((b.w - w) / 2);
  const y = b.side === "n" ? b.y + b.h - 8 : b.y - 10;
  return houseDoor(id, x, y, dest, 200, 190, label);
}

const ALLEY_HOUSES = alleyBuildings();
function namedHouse(name: string, fallback: Building): Building {
  const hit = ALLEY_HOUSES.find((b) => b.name === name);
  if (hit) return hit;
  ALLEY_HOUSES.push(fallback);
  ALLEY_MASSES.push({ x: fallback.x, y: fallback.y, w: fallback.w, h: fallback.h });
  return fallback;
}
const HOUSE_MIRA = namedHouse("Mira", {
  id: "b_mira",
  x: 780,
  y: 520,
  w: 300,
  h: 160,
  tone: "#6ec8ff",
  name: "Mira",
  side: "n",
  variant: 1,
});
const HOUSE_RAZE = namedHouse("Raze", {
  id: "b_raze",
  x: 280,
  y: 800,
  w: 280,
  h: 240,
  tone: "#c8a050",
  name: "Raze",
  side: "n",
  variant: 2,
});
const HOUSE_CHERRY = namedHouse("Cherry", {
  id: "b_cherry",
  x: 1720,
  y: 1152,
  w: 240,
  h: 220,
  tone: "#ff8ad4",
  name: "Cherry",
  side: "s",
  variant: 3,
});

const ALLEY_CITY = {
  walls: ALLEY_MASSES,
  buildings: ALLEY_HOUSES,
  ledges: [] as Ledge[],
  deco: ALLEY_GRASS.map((r) => ({ ...r, fill: "rgba(90,190,255,0.08)" })),
  obstacles: [] as Obstacle[],
};

const ALLEY_NPCS: MapObj[] = [
  npc("bolt", "npc_bolt", "Bolt", 120, 720),
  npc("kite", "npc_kite", "Kite", 280, 720),
  npc("lumen", "npc_lumen", "Lumen", 400, 80),
  npc("nox", "npc_nox", "Nox", 1140, 80),
  npc("sable", "npc_sable", "Sable", 1760, 80),
  npc("jax", "npc_jax", "Jax", 2180, 80),
  npc("ash", "npc_ash", "Ash", 280, 1500),
  npc("drip", "npc_drip", "Drip", 1020, 1500),
  npc("vex", "npc_vex", "Vex", 1460, 1500),
  npc("rook", "npc_rook", "Rook", 1500, 1480),
  npc("nix", "npc_nix", "Nix", 2020, 1480),
  npc("hex", "npc_hex", "Hex", 1160, 740),
  npc("pex", "npc_pex", "Pex", 1300, 740),
];

const CAP_POTS: MapObj[] = [
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    id: `pot${i}`,
    kind: "pot" as const,
    x: 70 + i * 22,
    y: 26,
    w: 14,
    h: 16,
    sprite: "pot_empty",
    label: `Topf ${i + 1}`,
    block: true,
    pot: i,
  })),
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    id: `box${i}`,
    kind: "pot" as const,
    x: 48 + i * 28,
    y: 148,
    w: 24,
    h: 20,
    sprite: "pot_empty",
    label: `Box ${i + 1}`,
    block: true,
    pot: 6 + i,
  })),
];

export const MAPS: Record<string, MapDef> = {
  capsule: {
    id: "capsule",
    name: "Kapsel",
    w: 320,
    h: 180,
    bg: "/game/maps/capsule.png",
    indoor: true,
    walls: [
      { x: 0, y: 0, w: 320, h: B },
      { x: 0, y: 170, w: 320, h: 10 },
      { x: 0, y: 0, w: B, h: 70 },
      { x: 0, y: 110, w: B, h: 70 },
      { x: 310, y: 0, w: 10, h: 70 },
      { x: 310, y: 110, w: 10, h: 70 },
    ],
    objs: [
      { id: "bed", kind: "bed", x: 18, y: 20, w: 36, h: 22, sprite: "bed", label: "Matte", block: true },
      ...CAP_POTS,
      { id: "tank", kind: "prop", x: 206, y: 18, w: 90, h: 40, label: "Becken", block: true },
      { id: "starter", kind: "starter", x: 146, y: 72, w: 32, h: 24, sprite: "crate", label: "Koffer", block: true },
      { id: "felix_cage_box", kind: "prop", x: 8, y: 136, w: 34, h: 32, sprite: "crate", label: "Käfig", block: true },
      { id: "felix_crate", kind: "prop", x: 228, y: 146, w: 26, h: 22, sprite: "crate", label: "Felix-Kiste", block: true },
      { id: "term", kind: "prop", x: 280, y: 146, w: 24, h: 18, sprite: "terminal", label: "Kapsel-PC", block: true },
      gate("door_alley", 300, 70, 18, 40, "alley", 80, 740, { label: "Gasse" }),
      gate("door_studio", 2, 70, 18, 40, "studio", 440, 140, { label: "Keller" }),
      neonSign("sign_studio", 8, 48, "studio", { label: "Keller" }),
      gate("pad_kai", 220, 78, 36, 16, "kai", 240, 128, { label: "Angel" }),
    ],
    zones: [],
  },
  studio: {
    id: "studio",
    name: "Rajkos Keller",
    w: 480,
    h: 280,
    bg: "/game/maps/capsule.png",
    indoor: true,
    walls: [
      { x: 0, y: 0, w: 480, h: 22 },
      { x: 0, y: 262, w: 480, h: 18 },
      { x: 0, y: 0, w: 16, h: 280 },
      { x: 464, y: 0, w: 16, h: 118 },
      { x: 464, y: 178, w: 16, h: 102 },
      { x: 18, y: 26, w: 70, h: 108 },
      { x: 392, y: 26, w: 70, h: 88 },
      { x: 18, y: 198, w: 86, h: 58 },
      { x: 376, y: 198, w: 86, h: 58 },
      { x: 108, y: 48, w: 248, h: 78 },
    ],
    deco: [],
    objs: [
      gate("studio_back", 462, 118, 16, 60, "capsule", 28, 90, { label: "Kapsel" }),
      neonSign("studio_sign", 400, 100, "capsule"),
      { id: "rajko", kind: "npc", x: 188, y: 136, w: 24, h: 30, sprite: "npc_rajko", label: "Rajko", block: true },
      { id: "can", kind: "npc", x: 152, y: 196, w: 24, h: 30, sprite: "npc_can", label: "Can", block: true },
      { id: "st_desk", kind: "prop", x: 196, y: 110, w: 48, h: 20, sprite: "terminal", label: "Mischpult", block: false },
      { id: "st_lamp", kind: "lamp", x: 240, y: 28, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "slot_keller", kind: "prop", x: 308, y: 156, w: 34, h: 38, label: "Glutwalze", block: true },
      { id: "ben", kind: "npc", x: 248, y: 206, w: 24, h: 30, label: "Ben", block: true },
    ],
    zones: [],
  },
  alley: {
    id: "alley",
    name: "Gasse A",
    w: WORLD_W,
    h: WORLD_H,
    bg: "/game/maps/alley.png",
    walls: [
      ...alleyFrame(
        WORLD_W,
        WORLD_H,
        [
          { x: 352, w: 64 },
          { x: 1104, w: 64 },
          { x: 1744, w: 64 },
          { x: 2144, w: 64 },
        ],
        [
          { x: 268, w: 64 },
          { x: 976, w: 64 },
          { x: 1404, w: 64 },
          { x: 1968, w: 64 },
        ],
        [{ y: 680, h: 112 }],
        [{ y: 680, h: 112 }],
      ),
      ...ALLEY_CITY.walls,
    ],
    buildings: ALLEY_CITY.buildings,
    ledges: ALLEY_CITY.ledges,
    obstacles: ALLEY_CITY.obstacles,
    deco: ALLEY_CITY.deco,
    objs: [
      gate("back_cap", 2, 680, 16, 72, "capsule", 270, 90, { label: "Kapsel" }),
      { id: "felix", kind: "npc", x: 128, y: 712, w: 24, h: 30, sprite: "npc_felix", label: "Felix", block: false },
      gate("to_market", WORLD_W - 18, 680, 16, 72, "market", 48, 248, { lock: "q1_bolt", label: "Markt" }),
      gate("to_yard", 360, 8, 48, 36, "yard", 1180, 540, { lock: "q1_bolt", label: "Hinterhof" }),
      gate("to_chem", 1120, 8, 48, 36, "chem", 688, 980, { lock: "q1_bolt" }),
      gate("to_labyrinth", 1760, 8, 48, 36, "labyrinth", 880, 810, { lock: "q1_bolt" }),
      gate("to_scrap", 2160, 8, 48, 36, "scrap", 880, 650, { lock: "q1_bolt" }),
      gate("to_ash", 280, WORLD_H - 40, 48, 32, "ash", 720, 88, { lock: "q1_bolt" }),
      gate("to_drain", 992, WORLD_H - 40, 48, 32, "drain", 800, 88, { lock: "q1_bolt" }),
      gate("to_ring", 1424, WORLD_H - 40, 48, 32, "ring", 540, 70, { lock: "q1_bolt" }),
      gate("to_nische", 1984, WORLD_H - 40, 48, 32, "nische", 920, 70, { lock: "q1_bolt" }),
      doorOnHouse("house_mira", HOUSE_MIRA, "den_mira", "Mira"),
      doorOnHouse("house_raze", HOUSE_RAZE, "den_raze", "Raze"),
      doorOnHouse("house_cherry", HOUSE_CHERRY, "den_cherry", "Cherry"),
      neonSign("sign_cap", 28, 652, "capsule"),
      neonSign("sign_yard", 332, 52, "yard", { lock: "q1_bolt" }),
      neonSign("sign_chem", 1092, 52, "chem", { lock: "q1_bolt" }),
      neonSign("sign_labyrinth", 1732, 52, "labyrinth", { lock: "q1_bolt" }),
      neonSign("sign_scrap", 2132, 52, "scrap", { lock: "q1_bolt" }),
      neonSign("sign_ash", 252, 1688, "ash", { lock: "q1_bolt" }),
      neonSign("sign_drain", 964, 1688, "drain", { lock: "q1_bolt" }),
      neonSign("sign_ring", 1396, 1688, "ring", { lock: "q1_bolt" }),
      neonSign("sign_nische", 1956, 1688, "nische", { lock: "q1_bolt" }),
      neonSign("sign_market", WORLD_W - 90, 652, "market", { lock: "q1_bolt" }),
      hatch("agully_w", 200, 780, "sewer", 80, 230),
      hatch("agully_m", 1160, 1000, "sewer", 2960, 230),
      hatch("agully_e", 2100, 760, "sewer", 4400, 230),
      neonSign("sign_agully_w", 172, 752, "sewer"),
      neonSign("sign_agully_m", 1132, 972, "sewer"),
      neonSign("sign_agully_e", 2072, 732, "sewer"),
      hatch("acable", 1160, 700, "cable", 90, 200, {
        lock: "q1_bolt",
        label: "Kellerluke · Kabelkeller",
        w: 24,
        h: 20,
      }),
      neonSign("sign_cable", 1120, 672, "cable", { lock: "q1_bolt", label: "Keller" }),
      ...ALLEY_NPCS,
      { id: "abin0", kind: "bin", x: 80, y: 700, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "abin1", kind: "bin", x: 640, y: 440, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "abin2", kind: "bin", x: 1680, y: 440, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "abin3", kind: "bin", x: 640, y: 960, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "abin4", kind: "bin", x: 1680, y: 960, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "abin5", kind: "bin", x: 2400, y: 700, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "alamp0", kind: "lamp", x: 400, y: 680, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "alamp1", kind: "lamp", x: 1120, y: 400, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "alamp2", kind: "lamp", x: 1648, y: 680, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "alamp3", kind: "lamp", x: 1120, y: 920, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "alamp4", kind: "lamp", x: 280, y: 1400, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "alamp5", kind: "lamp", x: 2160, y: 80, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "amat0", kind: "mattress", x: 200, y: 1100, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
      { id: "amat1", kind: "mattress", x: 2000, y: 1100, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
    ],
    zones: ALLEY_GRASS.map((r) => ({ ...r, mons: enc("alley") })),
  },
  yard: {
    id: "yard",
    name: "Grow-Hinterhöfe",
    w: YARD_W,
    h: YARD_H,
    bg: "/game/maps/yard.png",
    walls: [
      ...southGap(YARD_W, YARD_H, 1156, 80),
      { x: 400, y: 180, w: 64, h: 40 },
      { x: 900, y: 280, w: 72, h: 44 },
      { x: 1500, y: 200, w: 60, h: 48 },
    ],
    deco: [
      { x: 80, y: 200, w: 200, h: 80, fill: "rgba(90,150,50,0.14)" },
      { x: 1100, y: 180, w: 160, h: 300, fill: "rgba(60,120,40,0.12)" },
    ],
    objs: [
      gate("yard_back", 1156, YARD_H - 40, 48, 32, "alley", 384, 80),
      neonSign("yard_sign", 1164, YARD_H - 88, "alley"),
      hatch("yard_gully", 310, 500, "sewer", 560, 230),
      neonSign("yard_kanal", 294, 472, "sewer"),
      npc("lumen_m", "npc_lumen", "Lumen", 400, 240),
      npc("moss", "npc_lumen", "Moss", 1600, 300),
      kiezLegend("yard", "mon_kronkush", 1800, 280, 14),
      kiezWild("yard", "mon_budling", "budling", 500, 260, 4),
      kiezWild("yard", "mon_lustleaf", "lustleaf", 900, 400, 5),
      kiezWild("yard", "mon_budling", "budling", 1400, 240, 6),
      kiezWild("yard", "mon_hashound", "hashound", 700, 500, 5),
      kiezWild("yard", "mon_lustleaf", "lustleaf", 2000, 400, 7),
      houseDoor("house_moss", 200, 80, "den_moss", 200, 190, "Moss"),
      ...kiezLoot("yard", YARD_W, YARD_H, { bins: 6, lamps: 4, mats: 2 }),
    ],
    zones: coverZones(YARD_W, YARD_H, 4, 2, enc("yard")),
  },
  cable: {
    id: "cable",
    name: "Kabelkeller",
    w: CABLE_W,
    h: CABLE_H,
    bg: "/game/maps/cable.png",
    indoor: true,
    walls: cableWalls(),
    obstacles: [
      ...CABLE_RACKS.map((r) => ({ ...r, kind: "rack" as const })),
      ...CABLE_TEETH.map((r) => ({ ...r, kind: "rack" as const })),
      ...CABLE_LIVE.map((r) => ({ ...r, kind: "ember" as const })),
    ],
    deco: [
      ...CABLE_RACKS.map((r) => ({ ...r, fill: "rgba(80,220,210,0.16)" })),
      ...CABLE_LIVE.map((r) => ({ ...r, fill: "rgba(80,220,255,0.22)" })),
      { x: 220, y: 576, w: 1560, h: 188, fill: "rgba(8,12,16,0.45)" },
      { x: 910, y: 36, w: 180, h: 140, fill: "rgba(80,220,210,0.28)" },
    ],
    objs: [
      hatch("cable_gully", 1860, 210, "sewer", 1520, 230),
      neonSign("cable_kanal", 1844, 182, "sewer"),
      hatch("cable_alley", 90, 200, "alley", 1160, 740),
      neonSign("cable_sign", 74, 172, "alley", { label: "Gasse" }),
      npc("hex_m", "npc_hex", "Hex", 180, 180),
      npc("root", "npc_hex", "Root", 1400, 200),
      ...CABLE_WILDS,
      kiezProp("cb_t1", "terminal", "Port", 300, 220),
      kiezProp("cb_t2", "terminal", "Port", 860, 250),
      kiezProp("cb_t3", "terminal", "Port", 1600, 250),
      kiezProp("cb_t4", "terminal", "Port", 240, 620),
      kiezProp("cb_c1", "crate", "Kiste", 40, 120),
      kiezProp("cb_c2", "crate", "Kiste", 1760, 280),
      kiezProp("cb_c3", "crate", "Kiste", 900, 640),
      { id: "cbin0", kind: "bin", x: 40, y: 300, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "cbin1", kind: "bin", x: 1900, y: 300, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "cbin2", kind: "bin", x: 220, y: 700, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
      { id: "clamp0", kind: "lamp", x: 500, y: 210, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "clamp1", kind: "lamp", x: 1000, y: 210, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "clamp2", kind: "lamp", x: 1500, y: 210, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "cmat0", kind: "mattress", x: 40, y: 640, w: 28, h: 16, sprite: "mattress", label: "Matratze", block: false },
    ],
    zones: CABLE_CABLE.map((r) => ({ ...r, mons: enc("cable") })),
  },
  market: {
    id: "market",
    name: "Markt",
    w: MARKET_W,
    h: MARKET_H,
    bg: "/game/maps/market.png",
    walls: [
      { x: 0, y: 0, w: MARKET_W, h: 28 },
      { x: 0, y: MARKET_H - 28, w: MARKET_W, h: 28 },
      { x: 0, y: 0, w: 8, h: 200 },
      { x: 0, y: 280, w: 8, h: MARKET_H - 280 },
      { x: MARKET_W - 8, y: 0, w: 8, h: 168 },
      { x: MARKET_W - 8, y: 248, w: 8, h: MARKET_H - 248 },
      { x: 36, y: 28, w: 28, h: 56 },
      { x: 84, y: 28, w: 92, h: 56 },
      { x: 468, y: 28, w: 32, h: 56 },
      { x: 520, y: 28, w: 88, h: 56 },
    ],
    deco: [
      { x: 56, y: 348, w: 480, h: 6, fill: "rgba(255,210,122,0.14)" },
    ],
    objs: [
      gate("market_back", 0, 208, 18, 64, "alley", 2480, 740, { label: "Gasse" }),
      gate("market_kino", MARKET_W - 18, 176, 18, 64, "kino", 36, 142, { label: "Kino" }),
      neonSign("market_kino_sign", 548, 128, "kino"),
      hatch("market_gully", 72, 408, "sewer", 6120, 230),
      neonSign("market_kanal", 40, 380, "sewer"),
      houseDoor("house_silk", 64, 36, "den_silk", 200, 190, "Silk"),
      houseDoor("house_static", 500, 36, "den_static", 200, 190, "Static"),
      {
        id: "silk",
        kind: "shop",
        x: 304,
        y: 168,
        w: 16,
        h: 22,
        sprite: "npc_silk",
        label: "Silk",
        block: true,
      },
      stall("st_chips", 64, 356, "Chips", "chips"),
      stall("st_grow", 176, 356, "Grow", "grow"),
      stall("st_threads", 288, 356, "Stoff", "threads"),
      stall("st_fence", 400, 356, "Hehler", "fence"),
      stall("st_noodles", 512, 356, "Nudeln", "noodles"),
      { id: "mlamp0", kind: "lamp", x: 128, y: 300, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "mlamp1", kind: "lamp", x: 240, y: 300, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "mlamp2", kind: "lamp", x: 352, y: 300, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "mlamp3", kind: "lamp", x: 464, y: 300, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "mbin2", kind: "bin", x: 548, y: 408, w: 18, h: 18, sprite: "dumpster", label: "Tonne", block: false },
    ],
    zones: [
      {
        x: 36,
        y: 388,
        w: 500,
        h: 52,
        mons: encountersFor("market").filter((e) => !DEX[e.id]?.where.startsWith("Nur Evolution")),
      },
    ],
  },
  kino: {
    id: "kino",
    name: "Kino",
    w: KINO_W,
    h: KINO_H,
    bg: "/game/maps/labyrinth.png",
    indoor: true,
    walls: [
      { x: 0, y: 0, w: KINO_W, h: 8 },
      { x: 0, y: KINO_H - 10, w: KINO_W, h: 10 },
      { x: KINO_W - 10, y: 0, w: 10, h: KINO_H },
      { x: 0, y: 0, w: 8, h: 112 },
      { x: 0, y: 172, w: 8, h: KINO_H - 172 },
      { x: 16, y: 8, w: 688, h: 94 },
    ],
    deco: [],
    objs: [
      gate("kino_back", 0, 114, 14, 54, "market", 588, 208, { label: "Markt" }),
      { id: "kino_booth", kind: "prop", x: 48, y: 104, w: 28, h: 18, sprite: "terminal", label: "URL", block: true },
      { id: "kino_play", kind: "prop", x: 283, y: 108, w: 46, h: 16, label: "Play", block: false },
      { id: "kino_pause", kind: "prop", x: 337, y: 108, w: 46, h: 16, label: "Pause", block: false },
      { id: "kino_next", kind: "prop", x: 391, y: 108, w: 46, h: 16, label: "Weiter", block: false },
      { id: "slot_kino", kind: "prop", x: 640, y: 118, w: 34, h: 38, label: "Glutwalze", block: true },
    ],
    zones: [],
  },
  kai: {
    id: "kai",
    name: "Neonkai",
    w: 960,
    h: 400,
    bg: "/game/maps/sewer.png",
    walls: [...boxFrame(960, 400), { x: 8, y: 206, w: 944, h: 18 }],
    deco: [
      { x: 16, y: 220, w: 928, h: 144, fill: "rgba(12,58,68,0.55)" },
      { x: 16, y: 216, w: 928, h: 4, fill: "rgba(57,255,176,0.35)" },
    ],
    objs: [
      hatch("kai_back", 48, 140, "sewer", 5680, 230),
      neonSign("kai_sign", 78, 112, "sewer", { label: "Kanal" }),
      gate("pad_cap", 300, 72, 40, 16, "capsule", 220, 124, { label: "Kapsel" }),
      { id: "kai_cast0", kind: "prop", x: 200, y: 168, w: 26, h: 28, label: "Angel", block: false },
      { id: "kai_cast1", kind: "prop", x: 380, y: 168, w: 26, h: 28, label: "Angel", block: false },
      { id: "kai_cast2", kind: "prop", x: 560, y: 168, w: 26, h: 28, label: "Angel", block: false },
      { id: "kai_cast3", kind: "prop", x: 740, y: 168, w: 26, h: 28, label: "Angel", block: false },
      { id: "kailamp0", kind: "lamp", x: 140, y: 64, w: 12, h: 22, sprite: "lamp", label: "Lampe", block: false },
      { id: "slot_kai", kind: "prop", x: 820, y: 96, w: 34, h: 38, label: "Glutwalze", block: true },
    ],
    zones: [],
  },
  sewer: {
    id: "sewer",
    name: "Kanal",
    w: SEWER_W,
    h: SEWER_H,
    bg: "/game/maps/sewer.png",
    walls: boxFrame(SEWER_W, SEWER_H),
    objs: [
      hatch("sgully_alley_w", 80, 178, "alley", 200, 780),
      hatch("sgully_yard", 560, 178, "yard", 310, 500),
      hatch("sgully_ash", 1040, 178, "ash", 110, 350),
      hatch("sgully_cable", 1520, 178, "cable", 1860, 210),
      hatch("sgully_drain", 2000, 178, "drain", 168, 760),
      hatch("sgully_chem", 2480, 178, "chem", 80, 960),
      hatch("sgully_alley_m", 2960, 178, "alley", 1160, 1000),
      hatch("sgully_ring", 3440, 178, "ring", 110, 360),
      hatch("sgully_labyrinth", 3920, 178, "labyrinth", 110, 340),
      hatch("sgully_alley_e", 4400, 178, "alley", 2100, 760),
      hatch("sgully_nische", 4880, 178, "nische", 110, 340),
      hatch("sgully_scrap", 5360, 178, "scrap", 110, 360),
      hatch("sgully_market", 6120, 178, "market", 48, 248),
      hatch("sgully_kai", 5680, 178, "kai", 96, 150),
      neonSign("sign_s_alley_w", 108, 206, "alley"),
      neonSign("sign_s_yard", 588, 206, "yard"),
      neonSign("sign_s_ash", 1068, 206, "ash"),
      neonSign("sign_s_cable", 1548, 206, "cable", { label: "Keller" }),
      neonSign("sign_s_drain", 2028, 206, "drain"),
      neonSign("sign_s_chem", 2508, 206, "chem"),
      neonSign("sign_s_alley_m", 2988, 206, "alley"),
      neonSign("sign_s_ring", 3468, 206, "ring"),
      neonSign("sign_s_labyrinth", 3948, 206, "labyrinth"),
      neonSign("sign_s_alley_e", 4428, 206, "alley"),
      neonSign("sign_s_nische", 4908, 206, "nische"),
      neonSign("sign_s_scrap", 5388, 206, "scrap"),
      neonSign("sign_s_market", 6150, 206, "market"),
      neonSign("sign_s_kai", 5708, 206, "kai"),
      { id: "grate", kind: "npc", x: 3000, y: 150, w: 24, h: 30, sprite: "npc_ash", label: "Grime", block: true },
      { id: "roach_s1", kind: "wild", x: 400, y: 200, w: 18, h: 18, sprite: "hackroach", label: "Wild", once: true, mon: "mon_hackroach", lvl: stageAt("sewer", 0.15) },
      { id: "roach_s2", kind: "wild", x: 2200, y: 196, w: 18, h: 18, sprite: "hackroach", label: "Wild", once: true, mon: "mon_hackroach", lvl: stageAt("sewer", 0.3) },
      ...place("bin", "sbin", "dumpster", "Tonne", along(200, 6200, 420, 16), 80, 18, 18),
      ...place("lamp", "slamp", "lamp", "Lampe", along(280, 6100, 480, 12), 50, 12, 22),
    ],
    zones: coverZones(SEWER_W, SEWER_H, 4, 1, mixEnc(["sewer", "drain", "cable", "chem", "labyrinth"], { map: "sewer" })),
  },
  ash: makeAsh(),
  drain: makeDrain(),
  chem: makeChem(),
  ring: makeRing(),
  labyrinth: makeLabyrinth(),
  nische: makeNische(),
  scrap: makeScrap(),
  den_mira: makeDen({
    id: "den_mira",
    name: "Mira",
    bg: "/game/maps/den_mira.png",
    back: "alley",
    bx: HOUSE_MIRA.x + Math.floor(HOUSE_MIRA.w / 2),
    by: HOUSE_MIRA.y + HOUSE_MIRA.h + 16,
    npc: npc("mira", "npc_mira", "Mira", 200, 110),
  }),
  den_raze: makeDen({
    id: "den_raze",
    name: "Raze",
    bg: "/game/maps/den_raze.png",
    back: "alley",
    bx: HOUSE_RAZE.x + Math.floor(HOUSE_RAZE.w / 2),
    by: HOUSE_RAZE.y + HOUSE_RAZE.h + 16,
    npc: npc("raze", "npc_raze", "Raze", 200, 110),
  }),
  den_static: makeDen({
    id: "den_static",
    name: "Static",
    bg: "/game/maps/den_static.png",
    back: "market",
    bx: 490,
    by: 110,
    npc: npc("static", "npc_static", "Static", 200, 110),
  }),
  den_silk: makeDen({
    id: "den_silk",
    name: "Silk-Hinten",
    bg: "/game/maps/den_silk.png",
    back: "market",
    bx: 90,
    by: 110,
    npc: npc("silk_den", "npc_silk", "Silk", 200, 110),
  }),
  den_cherry: makeDen({
    id: "den_cherry",
    name: "Cherry",
    bg: "/game/maps/den_cherry.png",
    back: "alley",
    bx: HOUSE_CHERRY.x + Math.floor(HOUSE_CHERRY.w / 2),
    by: HOUSE_CHERRY.y - 24,
    npc: npc("cherry", "npc_cherry", "Cherry", 200, 110),
  }),
  den_moss: makeDen({
    id: "den_moss",
    name: "Moss",
    bg: "/game/maps/den_moss.png",
    back: "yard",
    bx: 220,
    by: 110,
    npc: npc("moss_den", "npc_lumen", "Moss", 200, 110),
  }),
};

export type MapSketch = {
  walk: Rect[];
  fill: string;
  extras: { r: Rect; fill: string }[];
};

export function mapSketch(id: string): MapSketch {
  if (id === "alley") return { walk: ALLEY_WALK, fill: "#2a2a32", extras: ALLEY_GRASS.map((r) => ({ r, fill: "#2a3a28" })) };
  if (id === "drain") return { walk: DRAIN_WALK, fill: "#243038", extras: DRAIN_WATER.map((r) => ({ r, fill: "#1a3a48" })) };
  if (id === "ash") return { walk: ASH_WALK, fill: "#2a2018", extras: ASH_HOT.map((r) => ({ r, fill: "#5a2810" })) };
  if (id === "chem") return { walk: CHEM_WALK, fill: "#243018", extras: CHEM_VATS.map((r) => ({ r, fill: "#4a5a18" })) };
  if (id === "cable") return { walk: CABLE_WALK, fill: "#142028", extras: [...CABLE_RACKS.map((r) => ({ r, fill: "#1a3a3a" })), ...CABLE_LIVE.map((r) => ({ r, fill: "#3a1810" }))] };
  if (id === "ring") return { walk: RING_WALK, fill: "#241c18", extras: [...RING_CAGE.map((r) => ({ r, fill: "#3a2018" })), ...RING_CHALK.map((r) => ({ r, fill: "#4a1810" }))] };
  if (id === "nische") return { walk: NISCHE_WALK, fill: "#241820", extras: NISCHE_PINK.map((r) => ({ r, fill: "#4a2038" })) };
  if (id === "labyrinth") return { walk: LAB_WALK, fill: "#16121c", extras: LAB_SHADE.map((r) => ({ r, fill: "#28143a" })) };
  if (id === "scrap") return { walk: SCRAP_WALK, fill: "#1c1814", extras: [...SCRAP_BELT.map((r) => ({ r, fill: "#3a2a14" })), ...SCRAP_PILES.map((r) => ({ r, fill: "#3a3428" }))] };
  if (id === "yard") return { walk: [{ x: 16, y: 36, w: YARD_W - 32, h: YARD_H - 72 }], fill: "#1a2418", extras: [] };
  if (id === "sewer") return { walk: [{ x: 16, y: 80, w: SEWER_W - 32, h: 180 }], fill: "#14201c", extras: [] };
  if (id === "market") return { walk: [{ x: 20, y: 96, w: MARKET_W - 40, h: 300 }], fill: "#1c1812", extras: [{ r: { x: 48, y: 340, w: 544, h: 36 }, fill: "#3a2a18" }, { r: { x: 36, y: 28, w: 140, h: 52 }, fill: "#2a2118" }, { r: { x: 468, y: 28, w: 140, h: 52 }, fill: "#1a2424" }] };
  if (id === "kino") return { walk: [{ x: 20, y: 108, w: KINO_W - 40, h: 72 }], fill: "#100c14", extras: [{ r: KINO_SCREEN, fill: "#07060a" }] };
  if (id === "kai")
    return {
      walk: [{ x: 16, y: 40, w: 928, h: 176 }],
      fill: "#10161c",
      extras: [
        { r: { x: 16, y: 220, w: 928, h: 144 }, fill: "#0c3a44" },
        { r: { x: 300, y: 72, w: 40, h: 16 }, fill: "#1f8f68" },
      ],
    };
  if (id === "capsule")
    return {
      walk: [{ x: 12, y: 20, w: 296, h: 140 }],
      fill: "#1c1820",
      extras: [{ r: { x: 220, y: 78, w: 36, h: 16 }, fill: "#1f8f68" }],
    };
  if (id === "studio")
    return {
      walk: [{ x: 16, y: 22, w: 448, h: 240 }],
      fill: "#14241e",
      extras: [
        { r: { x: 18, y: 26, w: 70, h: 108 }, fill: "#1a1a20" },
        { r: { x: 392, y: 26, w: 70, h: 88 }, fill: "#1a1a20" },
        { r: { x: 18, y: 198, w: 86, h: 58 }, fill: "#141418" },
        { r: { x: 376, y: 198, w: 86, h: 58 }, fill: "#141418" },
        { r: { x: 108, y: 48, w: 248, h: 78 }, fill: "#243028" },
      ],
    };
  const m = MAPS[id];
  if (m) return { walk: [{ x: 16, y: 16, w: m.w - 32, h: m.h - 32 }], fill: "#1a1c20", extras: [] };
  return { walk: [], fill: "#121416", extras: [] };
}

const SKIP_STAND = new Set(["capsule", "studio", "market", "kino", "kai"]);

function spreadDistrict(mapId: string) {
  const m = MAPS[mapId];
  if (!m || SKIP_STAND.has(mapId) || mapId.startsWith("den_")) return;
  const walk = mapSketch(mapId).walk;
  const have = new Set(m.objs.filter((o) => o.mon).map((o) => o.mon!));
  const species = DEX_ORDER.map((id) => DEX[id]).filter((sp) => sp && sp.district === mapId && !sp.legendary && !have.has(sp.id));
  for (let i = species.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = species[i]!;
    species[i] = species[j]!;
    species[j] = a;
  }
  const raw: { x: number; y: number }[] = [];
  for (const r of walk) {
    if (r.w < 80 || r.h < 36) continue;
    if (r.w >= r.h) {
      const y = r.y + Math.round(r.h / 2) - 12;
      const step = Math.max(220, Math.min(460, Math.round(r.w / 7)));
      for (let x = r.x + 40; x < r.x + r.w - 36; x += step) raw.push({ x, y });
    } else {
      const x = r.x + Math.round(r.w / 2) - 10;
      const step = Math.max(200, Math.min(380, Math.round(r.h / 6)));
      for (let y = r.y + 40; y < r.y + r.h - 36; y += step) raw.push({ x, y });
    }
  }
  const kept: { x: number; y: number }[] = [];
  const busy = m.objs.map((o) => ({ x: o.x - 8, y: o.y - 8, w: o.w + 16, h: o.h + 16 }));
  const free = (s: { x: number; y: number }) =>
    !busy.some((o) => s.x < o.x + o.w && s.x + 22 > o.x && s.y < o.y + o.h && s.y + 26 > o.y) &&
    !kept.some((p) => Math.abs(p.x - s.x) < 190 && Math.abs(p.y - s.y) < 150);
  for (const s of raw) if (free(s)) kept.push(s);
  const cap = mapId === "sewer" ? 12 : mapId === "alley" ? 14 : 9;
  const spots =
    kept.length <= cap
      ? kept
      : Array.from({ length: cap }, (_, i) => kept[Math.min(kept.length - 1, Math.floor(((i + 0.5) * kept.length) / cap))]!);
  spots.forEach((s, i) => {
    const sp = species[i];
    if (!sp) return;
    m.objs.push({
      id: `stand_${sp.id}`,
      kind: "wild",
      x: s.x,
      y: s.y,
      w: 22,
      h: 26,
      sprite: sp.sprite,
      label: sp.name,
      block: true,
      once: true,
      mon: sp.id,
      lvl: stageAt(stageKey(mapId), 0.2 + (i % 5) * 0.15),
    });
  });
}

for (const id of Object.keys(MAPS)) spreadDistrict(id);

export const VIEW_W = 320;
export const VIEW_H = 180;
export const PLAYER_SPEED = 66;
export const PLAYER_HW = 5;
export const PLAYER_HH = 4;
export const BIN_COOLDOWN = 75;
export const LAMP_COOLDOWN = 90;
export const MATTRESS_COOLDOWN = 110;
export const ENCOUNTER_STEP = 84;
export const ENCOUNTER_CHANCE = 0.07;
export const SEWER_ENCOUNTER_STEP = 120;
export const SEWER_ENCOUNTER_CHANCE = 0.05;
export const FLEE_GRACE = 3.4;
export const CAPSULE_SPAWN_X = 150;
export const CAPSULE_SPAWN_Y = 130;
export const SEWER_LOOT = 1.25;
