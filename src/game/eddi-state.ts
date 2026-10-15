/** Eddi's original visitor movement, one-look harvest luck and physical-shop rules. */
import { EDDI_BOOST_CHANCE, EDDI_HOME, EDDI_LINES, EDDI_LOOK_T, EDDI_PAUSE_T, EDDI_SPEED, eddiActLabel, eddiStock, type EddiAct } from "./data/eddi";
import { ITEMS } from "./data/items";
import { MAPS, type MapObj } from "./data/maps";
import { slotOpen } from "./grow-state";
import type { Save } from "./save";

type EddiState = Save & {
  eddiX: number; eddiY: number; eddiFacing: number;
  eddiAct: EddiAct; eddiAnim: number; eddiPot: number;
};
export type EddiSession = { targetX: number; targetY: number; lookArmed: boolean };
export type EddiTick = { changed: boolean; boostedPot?: number };
const finite = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const pick = <T>(entries: T[], random: () => number): T => entries[Math.min(entries.length - 1, Math.max(0, Math.floor(random() * entries.length)))];
const ACTS: EddiAct[] = ["wander", "look", "pause"];

/** Keep original imported positions/actions; missing new fields use source defaults. */
export function ensureEddiState(s: Save): asserts s is EddiState {
  s.eddiX = finite(s.eddiX, EDDI_HOME.x);
  s.eddiY = finite(s.eddiY, EDDI_HOME.y);
  s.eddiFacing = Math.min(3, Math.max(0, Math.round(finite(s.eddiFacing, 2))));
  s.eddiAct = ACTS.includes(s.eddiAct as EddiAct) ? s.eddiAct : "wander";
  s.eddiAnim = Math.max(0, finite(s.eddiAnim, 0));
  s.eddiPot = Math.round(finite(s.eddiPot, -1));
}

/** Targets and the armed roll are transient in the source, so reload cannot reroll a look. */
export function createEddiSession(): EddiSession {
  return { targetX: EDDI_HOME.x, targetY: EDDI_HOME.y, lookArmed: false };
}

export function wakeEddi(s: Save, session?: EddiSession): void {
  Object.assign(s, { eddiIn: true, eddiX: EDDI_HOME.x, eddiY: EDDI_HOME.y, eddiFacing: 2, eddiAct: "wander", eddiAnim: 0, eddiPot: -1 });
  if (session) Object.assign(session, createEddiSession());
}

function potStand(index: number): { x: number; y: number } {
  const object = MAPS.capsule.objs.find(object => object.kind === "pot" && object.pot === index);
  return object ? { x: object.x + object.w / 2, y: object.y < 90 ? object.y + object.h + 14 : object.y - 10 } : EDDI_HOME;
}

function step(s: EddiState, session: EddiSession, seconds: number): boolean {
  const dx = session.targetX - s.eddiX, dy = session.targetY - s.eddiY;
  const distance = Math.hypot(dx, dy);
  if (distance < 1.4) {
    s.eddiX = session.targetX; s.eddiY = session.targetY;
    return true;
  }
  const stride = EDDI_SPEED * seconds;
  s.eddiFacing = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 2 : 3 : +(dy < 0);
  if (stride >= distance) {
    s.eddiX = session.targetX; s.eddiY = session.targetY;
    return true;
  }
  s.eddiX += dx / distance * stride;
  s.eddiY += dy / distance * stride;
  return false;
}

function pickTarget(s: EddiState, session: EddiSession, random: () => number): void {
  const all: number[] = [], unboosted: number[] = [];
  for (let index = 0; index < s.pots.length; index++) {
    const pot = s.pots[index];
    if (pot && pot.phase !== "empty" && slotOpen(s, index)) {
      all.push(index);
      if (!pot.eddiBoost) unboosted.push(index);
    }
  }
  const targets = unboosted.length ? unboosted : all;
  if (targets.length && random() < .74) {
    s.eddiPot = pick(targets, random);
    const target = potStand(s.eddiPot);
    session.targetX = target.x; session.targetY = target.y;
  } else {
    s.eddiPot = -1;
    const targets = [[90, 58], [140, 58], [190, 90], [250, 140], [70, 120], [160, 128], [248, 140], [220, 70]];
    [session.targetX, session.targetY] = pick(targets, random);
  }
  s.eddiAct = "wander";
}

/** Call once per real play frame, even indoors, in menus or during battles, like 2D. */
export function tickEddi(s: Save, session: EddiSession, seconds: number, random = Math.random): EddiTick {
  if (!s.eddiIn || !Number.isFinite(seconds) || seconds <= 0) return { changed: false };
  ensureEddiState(s);
  if (!s.eddiX && !s.eddiY) { s.eddiX = EDDI_HOME.x; s.eddiY = EDDI_HOME.y; }
  const before = [s.eddiAct, s.eddiX, s.eddiY, s.eddiFacing, s.eddiPot];
  let boostedPot: number | undefined;
  if (s.eddiAct === "wander") {
    if (step(s, session, seconds)) {
      const pot = s.eddiPot >= 0 ? s.pots[s.eddiPot] : undefined;
      if (pot && pot.phase !== "empty") {
        s.eddiAct = "look"; s.eddiAnim = EDDI_LOOK_T; session.lookArmed = true;
        s.eddiFacing = +(potStand(s.eddiPot).y < s.eddiY);
      } else {
        s.eddiAct = "pause"; s.eddiAnim = EDDI_PAUSE_T + random() * .8;
      }
    }
  } else if (s.eddiAct === "look") {
    s.eddiAnim -= seconds;
    if (session.lookArmed) {
      session.lookArmed = false;
      const pot = s.pots[s.eddiPot];
      if (pot && pot.phase !== "empty" && !pot.eddiBoost && random() < EDDI_BOOST_CHANCE) {
        pot.eddiBoost = true; boostedPot = s.eddiPot;
      }
    }
    if (s.eddiAnim <= 0) pickTarget(s, session, random);
  } else {
    s.eddiAnim -= seconds;
    if (s.eddiAnim <= 0) pickTarget(s, session, random);
  }
  const after = [s.eddiAct, s.eddiX, s.eddiY, s.eddiFacing, s.eddiPot];
  return { changed: boostedPot !== undefined || before.some((value, index) => value !== after[index]), ...(boostedPot !== undefined ? { boostedPot } : {}) };
}

export function eddiBody(s: Save): MapObj {
  ensureEddiState(s);
  return { id: "eddi_body", kind: "npc", x: s.eddiX - 8, y: s.eddiY - 16, w: 16, h: 22, sprite: "npc_eddi", label: eddiActLabel(s.eddiAct), block: false };
}

export function eddiDialogue(random = Math.random): string {
  return pick(EDDI_LINES, random);
}

export const EDDI_ARRIVAL_LINES = [
  "Die Growbox knackt. Jemand sitzt auf der Kante.",
  "Eddi: Hundert Schnitte. Ich zahl doppelt. Du zahlst die Hälfte. Titel extra. Mund halten.",
];

export function eddiBuyPrice(s: Save, id: string): number {
  if (!eddiStock(s.schnittTitle).includes(id)) return 0;
  const item = ITEMS[id];
  return item?.buy ? Math.max(1, item.eddiOnly ? item.buy : Math.round(item.buy * .5)) : 0;
}

/** Caller must also enforce proximity to the real Eddi NPC, as for other shops. */
export function buyEddiItem(s: Save, id: string, count = 1): { ok: boolean; price?: number; reason?: string } {
  if (!s.eddiIn) return { ok: false, reason: "Eddi ist noch nicht eingezogen." };
  const unit = eddiBuyPrice(s, id);
  if (!unit || !Number.isFinite(count) || count < 1 || !Number.isFinite(s.gold)) return { ok: false, reason: "Nicht im Sortiment." };
  const quantity = id === "title_schnitt" ? 1 : Math.floor(count);
  const price = unit * quantity;
  if (!Number.isSafeInteger(price) || s.gold < price) return { ok: false, reason: "Zu arm." };
  s.gold -= price;
  if (id === "title_schnitt") s.schnittTitle = true;
  else s.inventory[id] = Math.max(0, Math.floor(finite(s.inventory[id], 0))) + quantity;
  return { ok: true, price };
}
