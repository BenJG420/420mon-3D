/** Side-view fish. Drawn at 4× so the tank stays sharp. */

const S = 4;
const CELL = 48 * S;

type Body = "koi" | "eel" | "flat" | "shark" | "betta" | "puff" | "tetra" | "ghost";

const BODY_OF: Record<string, Body> = {
  fish: "koi",
  eel: "eel",
  toad: "puff",
  slug: "flat",
  plant: "koi",
  ling: "tetra",
  slime: "puff",
  hound: "shark",
  fairy: "betta",
  ghost: "ghost",
  vial: "tetra",
  crow: "shark",
  spike: "puff",
  brute: "shark",
  moth: "betta",
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").slice(0, 6);
  return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexRgb(a);
  const [br, bg, bb] = hexRgb(b);
  const u = (x: number, y: number) => Math.max(0, Math.min(255, Math.round(x + (y - x) * t)));
  const r = u(ar, br);
  const g = u(ag, bg);
  const bl = u(ab, bb);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

function shade(hex: string, amt: number): string {
  const [r, g, b] = hexRgb(hex);
  const u = (n: number) => Math.max(0, Math.min(255, n + amt));
  return `#${u(r).toString(16).padStart(2, "0")}${u(g).toString(16).padStart(2, "0")}${u(b).toString(16).padStart(2, "0")}`;
}

const EMPTY = 0;
const INK = 1;
const BODY = 2;
const BELLY = 3;
const FIN = 4;
const MARK = 5;
const EYE = 6;
const PUPIL = 7;
const SHINE = 8;
const EXTRA = 9;

function pix(b: Uint8Array, x: number, y: number, c: number) {
  if (c === EMPTY || x < 1 || y < 1 || x >= CELL - 1 || y >= CELL - 1) return;
  b[y * CELL + x] = c;
}

function put(b: Uint8Array, x: number, y: number, c: number) {
  const X = Math.round(x * S);
  const Y = Math.round(y * S);
  for (let dy = 0; dy < S; dy++) {
    for (let dx = 0; dx < S; dx++) pix(b, X + dx, Y + dy, c);
  }
}

function disc(b: Uint8Array, cx: number, cy: number, rx: number, ry: number, c: number) {
  const CX = cx * S;
  const CY = cy * S;
  const RX = Math.max(0.8, rx) * S;
  const RY = Math.max(0.8, ry) * S;
  const rx2 = RX * RX;
  const ry2 = RY * RY;
  const x0 = Math.ceil(RX);
  const y0 = Math.ceil(RY);
  for (let y = -y0; y <= y0; y++) {
    for (let x = -x0; x <= x0; x++) {
      if ((x * x) / rx2 + (y * y) / ry2 <= 1) pix(b, Math.round(CX + x), Math.round(CY + y), c);
    }
  }
}

function tri(b: Uint8Array, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: number) {
  const ax = x0 * S;
  const ay = y0 * S;
  const bx = x1 * S;
  const by = y1 * S;
  const cx = x2 * S;
  const cy = y2 * S;
  const minX = Math.max(1, Math.floor(Math.min(ax, bx, cx)));
  const maxX = Math.min(CELL - 2, Math.ceil(Math.max(ax, bx, cx)));
  const minY = Math.max(1, Math.floor(Math.min(ay, by, cy)));
  const maxY = Math.min(CELL - 2, Math.ceil(Math.max(ay, by, cy)));
  const area = ax * (by - cy) + bx * (cy - ay) + cx * (ay - by) || 1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const w0 = (x * (by - cy) + bx * (cy - y) + cx * (y - by)) / area;
      const w1 = (ax * (y - cy) + x * (cy - ay) + cx * (ay - y)) / area;
      const w2 = (ax * (by - y) + bx * (y - ay) + x * (ay - by)) / area;
      if (w0 >= -0.02 && w1 >= -0.02 && w2 >= -0.02) pix(b, x, y, c);
    }
  }
}

function eye(b: Uint8Array, x: number, y: number, big: boolean) {
  disc(b, x, y, big ? 3.2 : 2.4, big ? 3.2 : 2.4, EYE);
  put(b, x + 1, y, PUPIL);
  put(b, x + 1, y + 1, PUPIL);
  put(b, x, y, PUPIL);
  put(b, x - 1, y - 1, SHINE);
}

function leaf(b: Uint8Array, x: number, y: number) {
  put(b, x, y, EXTRA);
  put(b, x - 1, y - 1, EXTRA);
  put(b, x + 1, y - 1, EXTRA);
  put(b, x, y - 2, EXTRA);
  put(b, x, y - 1, BELLY);
  put(b, x - 2, y, EXTRA);
  put(b, x + 2, y, EXTRA);
}

function joint(b: Uint8Array, x: number, y: number) {
  for (let i = 0; i < 6; i++) put(b, x - i, y, EXTRA);
  put(b, x - 6, y, SHINE);
  put(b, x - 5, y - 1, SHINE);
}

function shadeBody(b: Uint8Array) {
  for (let y = 2; y < CELL - 2; y++) {
    for (let x = 2; x < CELL - 2; x++) {
      const i = y * CELL + x;
      if (b[i] !== BODY && b[i] !== BELLY) continue;
      const up = b[(y - 1) * CELL + x] ?? 0;
      if (b[i] === BODY && (up === EMPTY || up === FIN)) b[i] = 11;
      else if ((x + y * 2) % 5 === 0) b[i] = 10;
      else if (x % 4 === 0 && y % 3 === 1 && b[i] === BODY) b[i] = 10;
    }
  }
}

function inkAround(src: Uint8Array): Uint8Array {
  const o = new Uint8Array(src);
  for (let y = 1; y < CELL - 1; y++) {
    for (let x = 1; x < CELL - 1; x++) {
      if (src[y * CELL + x]) continue;
      let touch = false;
      for (let dy = -1; dy <= 1 && !touch; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (src[(y + dy) * CELL + x + dx]) touch = true;
        }
      }
      if (touch) o[y * CELL + x] = INK;
    }
  }
  return o;
}

function sugarTail(b: Uint8Array, x: number, y: number, wag: number) {
  tri(b, x, y, x + 13, y - 6 + wag, x + 7, y - 1, FIN);
  tri(b, x, y, x + 15, y + wag * 0.3, x + 8, y, FIN);
  tri(b, x, y, x + 13, y + 6 + wag, x + 7, y + 1, FIN);
  tri(b, x + 1, y - 1, x + 10, y - 11 + wag, x + 5, y - 1, MARK);
  tri(b, x + 1, y + 1, x + 10, y + 11 + wag, x + 5, y + 1, MARK);
}

function nug(b: Uint8Array, x: number, y: number) {
  disc(b, x, y, 3.1, 2.4, MARK);
  disc(b, x + 4, y + 1, 2.4, 2, BODY);
  disc(b, x - 3, y + 1, 2.2, 1.8, MARK);
  put(b, x - 1, y - 4, EXTRA);
  put(b, x + 2, y - 5, EXTRA);
  put(b, x + 4, y - 3, EXTRA);
  put(b, x + 1, y - 6, EXTRA);
}

function crystals(b: Uint8Array, x: number, y: number, n: number) {
  for (let i = 0; i < 5; i++) {
    disc(b, x + ((n >> (i * 2)) % 9), y + (i % 3) - 1, 0.65, 0.65, SHINE);
  }
}

function paintFrame(id: string, main: string, acc: string, dress: string, skin: string, frame: number): HTMLCanvasElement {
  const b = new Uint8Array(CELL * CELL);
  const n = hash(id);
  const body: Body = BODY_OF[skin] ?? "koi";
  const wag = frame === 1 ? -2 : frame === 3 ? 2 : frame === 2 ? 1 : 0;
  const bob = frame === 2 ? 1 : 0;
  const cy = 26 + bob;

  if (body === "eel") {
    for (let i = 0; i < 26; i++) {
      const y = cy + Math.sin(i * 0.42 + wag * 0.35) * (1.4 + i * 0.06);
      disc(b, 7 + i, y, 2.4, 3.2 - i * 0.05, i % 4 === 0 ? MARK : BODY);
    }
    sugarTail(b, 32, cy + wag * 0.4, wag);
    nug(b, 18, cy - 2);
    eye(b, 12, cy - 1, false);
  } else if (body === "flat") {
    disc(b, 22, cy + 1, 15, 6.5, BODY);
    disc(b, 22, cy + 3, 11, 3, BELLY);
    sugarTail(b, 34, cy, wag);
    tri(b, 14, cy - 5, 20, cy - 13, 26, cy - 5, FIN);
    tri(b, 18, cy - 5, 24, cy - 12, 29, cy - 4, MARK);
    nug(b, 24, cy - 4);
    eye(b, 13, cy - 1, true);
    eye(b, 19, cy - 2, false);
  } else if (body === "shark") {
    tri(b, 8, cy + 1, 28, cy - 7, 28, cy + 8, BODY);
    disc(b, 27, cy, 11, 7, BODY);
    disc(b, 25, cy + 3, 8, 3, BELLY);
    sugarTail(b, 34, cy, wag);
    tri(b, 20, cy - 6, 26, cy - 15, 31, cy - 5, FIN);
    nug(b, 22, cy - 5);
    eye(b, 16, cy - 2, false);
  } else if (body === "betta") {
    disc(b, 18, cy, 9, 6, BODY);
    disc(b, 18, cy + 2, 6, 3, BELLY);
    sugarTail(b, 24, cy, wag);
    tri(b, 22, cy - 1, 40, cy - 13 + wag, 34, cy, FIN);
    tri(b, 22, cy + 1, 38, cy + 13 + wag, 32, cy + 1, FIN);
    nug(b, 16, cy - 5);
    eye(b, 13, cy - 1, true);
  } else if (body === "puff") {
    disc(b, 22, cy, 10, 9, BODY);
    disc(b, 22, cy + 3, 7, 4, BELLY);
    disc(b, 16, cy - 2, 5, 4, MARK);
    disc(b, 26, cy - 1, 5, 4.2, MARK);
    sugarTail(b, 30, cy, wag);
    nug(b, 21, cy - 8);
    eye(b, 15, cy - 1, true);
  } else if (body === "tetra") {
    disc(b, 18, cy, 8, 4.6, BODY);
    disc(b, 18, cy + 2, 5, 2.2, BELLY);
    sugarTail(b, 24, cy, wag);
    tri(b, 14, cy - 3, 19, cy - 10, 24, cy - 3, FIN);
    nug(b, 18, cy - 4);
    eye(b, 13, cy - 1, false);
  } else if (body === "ghost") {
    disc(b, 21, cy, 12, 6.5, BODY);
    disc(b, 21, cy + 2, 8, 3, BELLY);
    sugarTail(b, 30, cy, wag);
    nug(b, 20, cy - 5);
    for (let i = 0; i < 5; i++) put(b, 14 + i * 3, cy - 1, SHINE);
    eye(b, 14, cy - 1, true);
  } else {
    disc(b, 20, cy, 12, 7, BODY);
    disc(b, 20, cy + 3, 9, 3.4, BELLY);
    sugarTail(b, 30, cy, wag);
    tri(b, 14, cy - 5, 20, cy - 13, 26, cy - 5, FIN);
    tri(b, 16, cy + 4, 12, cy + 10, 22, cy + 4, FIN);
    nug(b, 18, cy - 6);
    eye(b, 12, cy - 2, true);
  }

  crystals(b, body === "eel" ? 14 : 16, cy + 1, n);
  if (dress === "joint") joint(b, body === "shark" ? 10 : 8, cy + 1);
  if (dress === "flame") tri(b, 38, cy - 2, 46, cy - 8 - wag, 44, cy + 2, EXTRA);
  if (dress === "visor") {
    for (let i = 0; i < 7; i++) put(b, 10 + i, cy - 2, EXTRA);
  }

  shadeBody(b);

  const inked = inkAround(b);
  const colors = [
    "rgba(0,0,0,0)",
    "#14110e",
    shade(main, 8),
    mix(main, "#f3ecd4", 0.55),
    acc,
    shade(acc, -18),
    "#f4f7f2",
    "#14110e",
    "#fffef8",
    dress === "flame" ? "#ff6a2a" : dress === "joint" ? "#e7d3a1" : mix(acc, "#3faf4e", 0.45),
    shade(main, -36),
    mix(main, "#fff6d8", 0.35),
  ];
  const c = document.createElement("canvas");
  c.width = CELL;
  c.height = CELL;
  const g = c.getContext("2d");
  if (!g) return c;
  const img = g.createImageData(CELL, CELL);
  for (let i = 0; i < inked.length; i++) {
    const col = colors[inked[i]!] ?? colors[0]!;
    const [r, gv, bl, a] = col.startsWith("rgba") ? [0, 0, 0, 0] : [...hexRgb(col), 255];
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = gv;
    img.data[i * 4 + 2] = bl;
    img.data[i * 4 + 3] = a;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function paintFishSheet(id: string, main: string, acc: string, dress: string, skin: string): HTMLCanvasElement {
  const sheet = document.createElement("canvas");
  sheet.width = CELL * 2;
  sheet.height = CELL * 2;
  const g = sheet.getContext("2d");
  if (!g) return sheet;
  g.imageSmoothingEnabled = false;
  for (let i = 0; i < 4; i++) {
    g.drawImage(paintFrame(id, main, acc, dress, skin, i), (i % 2) * CELL, Math.floor(i / 2) * CELL);
  }
  return sheet;
}
