/** Original roaming rival/runtime + raise.nimTeam, revision 010807da77df8468a297adf33eaf1fb5c9a61c8b. */
import { makeInst, type BattleInstance, type IVs } from "./battle";
import { DEX, speciesById } from "./data/dex";
import { MAPS, type MapObj, type Rect } from "./data/maps";
import { getMove } from "./data/moves";
import { clampLevel } from "./data/progress";
import { typeMod, type Element } from "./data/types";
import type { Partner, Save } from "./save";

export const NIM_MAPS = ["alley", "market", "yard", "kai", "sewer", "ash", "drain", "chem", "ring", "scrap"] as const;
export type NimRoam = { targetX: number; targetY: number; wait: number; stay: number };
export type NimTickOptions = {
  paused?: boolean;
  playerX?: number;
  playerY?: number;
  /** Current-map collision query in original 2D coordinates. */
  blocked?: (x: number, y: number) => boolean;
  random?: () => number;
};

const finite = (value: unknown, fallback = 0): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const roll = (random: () => number): number => Math.max(0, Math.min(1 - Number.EPSILON, finite(random())));
const living = (party: Partner[]) => party.filter(mon => mon.hp > 0 && !!mon.id && !!DEX[mon.id]);
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Keep imported positions and playtime cooldowns; a fresh rival first asks after 20 seconds. */
export function ensureNimState(s: Save): void {
  s.rivalMap = typeof s.rivalMap === "string" ? s.rivalMap : "";
  s.rivalX = finite(s.rivalX);
  s.rivalY = finite(s.rivalY);
  s.rivalFacing = Math.max(0, Math.min(3, Math.round(finite(s.rivalFacing, 2))));
  s.rivalCool = Math.max(0, finite(s.rivalCool, 20));
}

export function createNimRoam(s: Save): NimRoam {
  ensureNimState(s);
  return { targetX: finite(s.rivalX), targetY: finite(s.rivalY), wait: 0, stay: 90 };
}

/** Source spawn test: a 10×8 foot box, four-pixel map margin, walls and blocking objects. */
export function nimOpen(mapId: string, x: number, y: number): boolean {
  const map = MAPS[mapId];
  if (!map || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const feet = { x: x - 5, y: y - 4, w: 10, h: 8 };
  if (feet.x < 4 || feet.y < 4 || feet.x + feet.w > map.w - 4 || feet.y + feet.h > map.h - 4) return false;
  return !map.walls.some(wall => overlaps(feet, wall)) && !map.objs.some(obj => obj.block && overlaps(feet, obj));
}

/** Source has no district-level unlock filter for Nim. He never immediately picks the same map. */
export function hopNim(s: Save, roam: NimRoam, random = Math.random): void {
  const pool = NIM_MAPS.filter(map => map !== s.rivalMap);
  const mapId = pool[Math.floor(roll(random) * pool.length)] ?? "alley";
  const map = MAPS[mapId];
  let x = map.w * .5, y = map.h * .5;
  for (let i = 0; i < 40; i++) {
    const nextX = 24 + roll(random) * Math.max(8, map.w - 48);
    const nextY = 24 + roll(random) * Math.max(8, map.h - 48);
    if (nimOpen(mapId, nextX, nextY)) { x = nextX; y = nextY; break; }
  }
  s.rivalMap = mapId; s.rivalX = x; s.rivalY = y;
  roam.targetX = x; roam.targetY = y; roam.stay = 80 + roll(random) * 70;
}

export function nimBody(s: Save): MapObj {
  return { id: "nim_body", kind: "npc", x: finite(s.rivalX) - 8, y: finite(s.rivalY) - 18, w: 16, h: 22, label: "Nim", block: false };
}

/** Returns true when the source automatic proximity challenge should open. */
export function tickNim(s: Save, roam: NimRoam, elapsed: number, options: NimTickOptions = {}): boolean {
  if (!s.team.length) return false;
  const dt = Math.max(0, finite(elapsed));
  const random = options.random ?? Math.random;
  if (!NIM_MAPS.includes(s.rivalMap as typeof NIM_MAPS[number])) hopNim(s, roam, random);
  else { roam.stay -= dt; if (roam.stay <= 0) hopNim(s, roam, random); }
  if (s.map !== s.rivalMap || options.paused) return false;
  const map = MAPS[s.map ?? ""];
  if (!map) return false;
  const px = finite(options.playerX, finite(s.x)), py = finite(options.playerY, finite(s.y));
  const blocked = options.blocked ?? ((x: number, y: number) => !nimOpen(map.id, x, y));
  roam.wait -= dt;
  if (roam.wait <= 0) {
    let found = false;
    for (let i = 0; i < 16; i++) {
      const x = 18 + roll(random) * Math.max(8, map.w - 36);
      const y = 18 + roll(random) * Math.max(8, map.h - 36);
      if (!blocked(x, y) && Math.hypot(x - px, y - py) > 28) { roam.targetX = x; roam.targetY = y; found = true; break; }
    }
    if (!found) { roam.targetX = px + (roll(random) < .5 ? -46 : 46); roam.targetY = py; }
    roam.wait = 1.8 + roll(random) * 2.4;
  }
  const x = finite(s.rivalX), y = finite(s.rivalY);
  const dx = roam.targetX - x, dy = roam.targetY - y, distance = Math.hypot(dx, dy);
  if (distance >= 2) {
    const step = Math.min(distance, 34 * dt);
    let nextX = x + dx / distance * step, nextY = y + dy / distance * step;
    if (blocked(nextX, y)) nextX = x;
    if (blocked(x, nextY)) nextY = y;
    if ((nextX === x && nextY === y) || Math.hypot(nextX - px, nextY - py) < 14) roam.wait = .45;
    else {
      s.rivalX = nextX; s.rivalY = nextY;
      s.rivalFacing = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 2 : 3 : dy < 0 ? 0 : 1;
    }
  }
  return finite(s.rivalCool) <= Math.max(0, finite(s.playtime)) && living(s.team).length > 0 &&
    Math.hypot(finite(s.rivalX) - px, finite(s.rivalY) - py) < 38;
}

export function nimDialogue(s: Save): string[] {
  const up = living(s.team), first = up[0];
  if (!first) return ["Nim: Ohne stehendes Team red ich nicht."];
  const strongest = Math.max(...s.team.map(mon => mon.level));
  return [`Nim mustert ${speciesById(first.id!).name}.`, `Lv.${first.level}. Dein Stärkstes ist ${strongest}. Ich stell ${Math.min(3, up.length)} dagegen.`];
}

export function declineNim(s: Save): void { s.rivalCool = Math.max(0, finite(s.playtime)) + 50; }

function threat(types: Element[], moves: string[], defender: Element[]): number {
  let best = 0;
  for (const id of moves) {
    const move = getMove(id);
    if (!move || move.kind === "stat" || !move.power) continue;
    best = Math.max(best, typeMod(move.type, defender) * (types.includes(move.type) ? 1.5 : 1) * move.power);
  }
  return best;
}

/** Counter-team to the first living partner; highest living level, at most three distinct species. */
export function nimTeam(party: Partner[], random = Math.random): BattleInstance[] {
  const up = living(party);
  if (!up.length) return [];
  const best = Math.max(...up.map(mon => mon.level));
  const lead = speciesById(up[0].id!);
  const count = Math.min(3, up.length);
  const all = Object.values(DEX).filter(species => !species.legendary);
  const pool = all.filter(species => best < 16 || !species.evo);
  const ranked = (pool.length > 12 ? pool : all)
    .map(species => ({ species, threat: threat(species.types, species.moves, lead.types) }))
    .sort((a, b) => b.threat - a.threat || a.species.id.localeCompare(b.species.id));
  const bag = ranked.slice(0, 14), picked: string[] = [];
  while (picked.length < count && bag.length) {
    const row = bag.splice(Math.floor(roll(random) * Math.min(8, bag.length)), 1)[0];
    if (row) picked.push(row.species.id);
  }
  const ivs = (): IVs => {
    const one = () => 58 + Math.floor(roll(random) * 18);
    return { hp: one(), atk: one(), def: one(), spa: one(), spd: one(), spe: one() };
  };
  return picked.map(id => makeInst(id, clampLevel(best), ivs()));
}

/** Root battle UI owns the queue and sets enemy.wild=false / duel=true: Nims Team bleibt bei Nim. */
export function beginNimDuel(s: Save, random = Math.random): BattleInstance[] {
  const team = nimTeam(s.team, random);
  if (!team.length) return team;
  s.rivalCool = Math.max(0, finite(s.playtime)) + 75;
  const seen = Array.isArray(s.seen) ? s.seen.filter((id): id is string => typeof id === "string") : [];
  s.seen = [...new Set([...seen, ...team.map(mon => mon.id)])];
  return team;
}
