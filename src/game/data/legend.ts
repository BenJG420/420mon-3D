/** Real-time legendary windows. Local clock, weekly rotation. */

export const LEGEND_COOLDOWN = 5 * 60;
export const LEGEND_BUFF = 24 * 3600;

const DAY_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"] as const;

export type LegendWindow = {
  id: string;
  district: string;
  day: number;
  startH: number;
  endH: number;
};

export type LegendPhase = "idle" | "soon" | "today" | "live";

export const LEGEND_WINDOWS: LegendWindow[] = [
  { id: "mon_kronkush", district: "yard", day: 0, startH: 8, endH: 12 },
  { id: "mon_kerboss", district: "alley", day: 0, startH: 18, endH: 22 },
  { id: "mon_rootkaiser", district: "cable", day: 1, startH: 18, endH: 22 },
  { id: "mon_glutarch", district: "ash", day: 2, startH: 18, endH: 22 },
  { id: "mon_rohrlethe", district: "drain", day: 3, startH: 18, endH: 22 },
  { id: "mon_vialith", district: "chem", day: 4, startH: 18, endH: 22 },
  { id: "mon_slagodon", district: "scrap", day: 5, startH: 8, endH: 12 },
  { id: "mon_cagekaiser", district: "ring", day: 5, startH: 18, endH: 22 },
  { id: "mon_noxarch", district: "labyrinth", day: 6, startH: 8, endH: 12 },
  { id: "mon_velouryx", district: "nische", day: 6, startH: 18, endH: 22 },
];

const SHIFT_X = [0, 64, -52, 40, 28];
const SHIFT_Y = [0, -32, 40, 24, -48];

export function clockParts(ms = Date.now()) {
  const d = new Date(ms);
  return {
    day: d.getDay(),
    h: d.getHours(),
    m: d.getMinutes(),
    hm: d.getHours() + d.getMinutes() / 60,
    unix: Math.floor(ms / 1000),
    date: d,
  };
}

export function windowLabel(w: LegendWindow): string {
  const a = `${String(w.startH).padStart(2, "0")}:00`;
  const b = `${String(w.endH).padStart(2, "0")}:00`;
  return `${DAY_DE[w.day]} ${a}–${b}`;
}

export function windowOpen(w: LegendWindow, t = clockParts()): boolean {
  return t.day === w.day && t.hm >= w.startH && t.hm < w.endH;
}

export function daysUntilWindow(w: LegendWindow, t = clockParts()): number {
  if (windowOpen(w, t)) return 0;
  if (t.day === w.day && t.hm < w.startH) return 0;
  let d = (w.day - t.day + 7) % 7;
  if (d === 0) d = 7;
  return d;
}

export function legendPhase(w: LegendWindow, t = clockParts()): LegendPhase {
  if (windowOpen(w, t)) return "live";
  if (t.day === w.day && t.hm < w.startH) return "today";
  const d = daysUntilWindow(w, t);
  if (d >= 1 && d <= 3) return "soon";
  return "idle";
}

export function legendForMap(map: string): LegendWindow | undefined {
  return LEGEND_WINDOWS.find((w) => w.district === map);
}

export function legendByMon(id: string): LegendWindow | undefined {
  return LEGEND_WINDOWS.find((w) => w.id === id);
}

export function liveWindow(t = clockParts()): LegendWindow | undefined {
  return LEGEND_WINDOWS.find((w) => windowOpen(w, t));
}

export function slotKey(w: LegendWindow, t = clockParts()): string {
  const start = windowStartUnix(w, t);
  return `${w.id}:${start}`;
}

export function windowStartUnix(w: LegendWindow, t = clockParts()): number {
  const d = new Date(t.date);
  d.setSeconds(0, 0);
  d.setMilliseconds(0);
  let add = (w.day - t.day + 7) % 7;
  if (add === 0 && t.hm >= w.endH) add = 7;
  d.setDate(d.getDate() + add);
  d.setHours(w.startH, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export function legendShiftPos(x: number, y: number, shift: number): { x: number; y: number } {
  const i = ((shift % SHIFT_X.length) + SHIFT_X.length) % SHIFT_X.length;
  return { x: x + (SHIFT_X[i] ?? 0), y: y + (SHIFT_Y[i] ?? 0) };
}

export function isLegendObj(o: { kind?: string; label?: string; id?: string; mon?: string }): boolean {
  if (o.kind !== "wild") return false;
  if (o.label === "Legendär") return true;
  if (typeof o.id === "string" && o.id.endsWith("_legend")) return true;
  return false;
}

const SOON: Record<string, string> = {
  alley: "Am Wochenende liegt wieder was unter dem Bordstein. Die Lampen sterben dann früher.",
  yard: "Die Töpfe zucken nachts. Am Wochenende soll hier was blühen, das niemand erntet.",
  cable: "Warme Ports. In ein paar Tagen wird der Keller laut, sagen die Racks.",
  ash: "Die Kippen gehen diese Woche nicht aus. Cinder kniet schon.",
  drain: "Die Deckel atmen. Mitte der Woche soll es tropfen, wo kein Wasser ist.",
  chem: "Der Dampf lächelt merkwürdig. Bald. Bleib nicht in der gelben Wolke.",
  ring: "Knuckle sagt, der Käfig sei leer. Der Käfig lügt am Wochenende.",
  labyrinth: "Eine Ecke fehlt. Am Wochenende ist sie wieder da, und sie beißt.",
  nische: "Hinter dem Vorhang atmet Samt. Samstagabend soll er denken.",
  scrap: "Unter dem Stapel, der sich bewegt. Freitag früh, wenn niemand schweißt.",
};

const TODAY: Record<string, string> = {
  alley: "Heute Abend wird die Gasse gefährlich. Nicht ohne Chip an den Bordstein.",
  yard: "Heute Vormittag. Hinter dem letzten Topf. Kronkush, wenn die Uhr stimmt.",
  cable: "Heute Abend. Wärmster Port. Rootkaiser kommt, wenn die Racks singen.",
  ash: "Heute Abend. Wo die Kippen nie ausgehen. Nicht pusten.",
  drain: "Heute Abend. Unter den Deckeln, die atmen. Nass werden ist das kleinere Problem.",
  chem: "Heute Abend. Im gelben Dampf. Vial hat aufgehört zu messen.",
  ring: "Heute Abend. Im Käfig, wenn niemand zählt. Tape reicht nicht.",
  labyrinth: "Heute früh. Die Ecke, die nicht da ist. Hush flüstert den Namen nicht.",
  nische: "Heute Abend. Letzter Vorhang. Wer hinsieht, bleibt.",
  scrap: "Heute früh. Unter dem Stapel. Coil schweißt nicht, wenn es kommt.",
};

const LIVE: Record<string, string> = {
  alley: "Da. Goldener Körper am Bordstein. Kerboss. Nicht Gras — die Straße.",
  yard: "Es steht hinter den Töpfen. Kronkush. Die Blüte trägt eine Krone. Lauf oder wirf.",
  cable: "Am wärmsten Port. Rootkaiser. Die Racks schreien. Chip raus.",
  ash: "Die letzte Glut läuft. Glutarch. Heiß, und sie bleibt heiß.",
  drain: "Es tropft aufrecht. Rohrlethe. Wer hinsieht, sieht sich später wieder.",
  chem: "Im Dampf ein Glas, das lebt. Vialith lächelt. Danach nichts.",
  ring: "Der Käfig kämpft mit. Cagekaiser. Unbesiegt, weil das Gitter mittritt.",
  labyrinth: "Kein Gesicht. Noxarch. Die Ecke ist da, und sie will dich.",
  nische: "Samt denkt. Velouryx. Ein Blick, und du bleibst. Wirf jetzt.",
  scrap: "Das Tor läuft. Slagodon. Schlacke als Haut. Nicht unter den Stapel.",
};

export const NPC_KIEZ: Record<string, string> = {
  bolt: "alley",
  kite: "alley",
  jax: "scrap",
  drip: "drain",
  hex: "cable",
  hex_m: "cable",
  ash: "ash",
  lumen: "yard",
  lumen_m: "yard",
  pex: "chem",
  sable: "labyrinth",
  rook: "ring",
  rook_a: "ring",
  nix: "nische",
  nix_a: "nische",
  vex: "ring",
  nox: "chem",
  moss: "yard",
  raze: "ash",
  mira: "nische",
  cherry: "nische",
  root: "cable",
  grate: "drain",
  ember: "ash",
  murk: "drain",
  leck: "drain",
  fume: "chem",
  cage: "ring",
  shade: "labyrinth",
  velvet: "nische",
  weld: "scrap",
};

export function kiezRumor(map: string, t = clockParts()): string | null {
  const w = legendForMap(map);
  if (!w) return null;
  const p = legendPhase(w, t);
  if (p === "live") return LIVE[w.district] ?? "Es ist hier. Goldener Körper. Jetzt.";
  if (p === "today") return TODAY[w.district] ?? `Heute. ${windowLabel(w)}. Nicht verschlafen.`;
  if (p === "soon") return SOON[w.district] ?? "In ein paar Tagen passieren hier seltsame Dinge.";
  return null;
}

export function staticRumor(
  live: LegendWindow | undefined,
  buffId: string,
  buffLeft: number,
  kiezName: (id: string) => string,
  monName: (id: string) => string,
  t = clockParts(),
): { pages: string[]; grant: LegendWindow | null } {
  if (live) {
    const kiez = kiezName(live.district);
    const name = monName(live.id);
    return {
      pages: [
        `> STATIC: FREQ LOCK. ${name.toUpperCase()} IN ${kiez.toUpperCase()}.`,
        "> 24H OVERRIDE. ICH HAB DIE KOORDINATEN. FENSTER ZU? DANN BLEIBT ES TROTZDEM. FÜR DICH.",
      ],
      grant: live,
    };
  }
  if (buffId && buffLeft > 0) {
    const w = legendByMon(buffId);
    const kiez = w ? kiezName(w.district) : "?";
    const name = monName(buffId);
    const h = Math.max(1, Math.ceil(buffLeft / 3600));
    return {
      pages: [`> STATIC: OVERRIDE LÄUFT. ${name.toUpperCase()} NOCH ${h}H IN ${kiez.toUpperCase()}.`],
      grant: null,
    };
  }
  const today = LEGEND_WINDOWS.find((w) => legendPhase(w, t) === "today");
  if (today) {
    return {
      pages: [`> STATIC: HEUTE. ${windowLabel(today).toUpperCase()}. ${kiezName(today.district).toUpperCase()}. NICHT VERSCHLAFEN.`],
      grant: null,
    };
  }
  const soon = LEGEND_WINDOWS.find((w) => legendPhase(w, t) === "soon");
  if (soon) {
    return {
      pages: ["> STATIC: GERÜCHT IM NETZ. WOCHENPLAN. FRAG DIE KIEZE. GOLDENE KÖRPER KOMMEN NICHT ZUFÄLLIG."],
      grant: null,
    };
  }
  return { pages: [], grant: null };
}
