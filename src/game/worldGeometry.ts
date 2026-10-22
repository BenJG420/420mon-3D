import type { MapDef, MapObj, Rect } from "./data/maps";
import { lootKind } from "./data/items";
import { isTakenStarter } from "./starter-state";

/** One original map pixel occupies six centimetres in the 3D world. */
export const WORLD_SCALE = 0.06;

type MapSize = Pick<MapDef, "w" | "h">;

export function mapToWorld(map: MapSize, x: number, y: number): { x: number; z: number } {
  return { x: (x - map.w / 2) * WORLD_SCALE, z: (y - map.h / 2) * WORLD_SCALE };
}

export function worldToMap(map: MapSize, x: number, z: number): { x: number; y: number } {
  return { x: x / WORLD_SCALE + map.w / 2, y: z / WORLD_SCALE + map.h / 2 };
}

// Original runtime isPassThrough() lets characters/wild monsters share the
// player's path even when their static map rectangle carries block:true.
// Searchable loot props (bins, lamps and mattresses) are passable as well.
const PASSABLE_OBJECTS = new Set(["door", "manhole", "sign", "wild", "npc", "shop", "stall", "bin", "lamp", "mattress"]);
const EPSILON = 1e-9;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Original one-time gate trainers vanish after their recorded victory. */
export function isDefeatedGate(object: Pick<MapObj, "id">, defeatedIds: readonly string[] = []): boolean {
  return object.id.startsWith("gate_") && defeatedIds.includes(object.id);
}

function blockers(map: MapDef, defeatedIds: readonly string[], starterId?: unknown): Rect[] {
  return [
    ...map.walls,
    ...map.objs.filter(object => object.block && !isDefeatedGate(object, defeatedIds) && !isTakenStarter(object, starterId) && !PASSABLE_OBJECTS.has(object.kind) && !(object.kind === "prop" && lootKind(object))),
  ].filter(rect => rect.w > 0 && rect.h > 0);
}

function blocked(map: MapSize, solids: Rect[], x: number, y: number, radius: number): boolean {
  if (![x, y, radius].every(Number.isFinite)) return true;
  // An opening in a boundary wall is still inside the map; the player cannot
  // escape through it while waiting for the door interaction.
  if (x < radius - EPSILON || y < radius - EPSILON || x > map.w - radius + EPSILON || y > map.h - radius + EPSILON) return true;
  return solids.some(rect => {
    const dx = x - clamp(x, rect.x, rect.x + rect.w);
    const dy = y - clamp(y, rect.y, rect.y + rect.h);
    if (radius === 0) return x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h;
    return dx * dx + dy * dy < radius * radius - EPSILON;
  });
}

/** Collides with the original map geometry, using a world-space player radius. */
export function collidesOnMap(map: MapDef, x: number, z: number, r = 0.45, defeatedIds: readonly string[] = [], starterId?: unknown): boolean {
  const point = worldToMap(map, x, z);
  return blocked(map, blockers(map, defeatedIds, starterId), point.x, point.y, Math.max(0, r) / WORLD_SCALE);
}

/**
 * Return source coordinates for a free spawn close to the intended arrival.
 * Old saves and original door targets sometimes overlap a wall or an NPC.
 * Candidate positions follow those exact blockers rather than a coarse grid,
 * so a narrow original doorway remains usable.
 */
export function safeSpawn(map: MapDef, desiredX: number, desiredY: number, r = 0.48, defeatedIds: readonly string[] = [], starterId?: unknown): { x: number; y: number } {
  const radius = Math.max(0, Number.isFinite(r) ? r : 0.48) / WORLD_SCALE;
  if (map.w < radius * 2 || map.h < radius * 2) throw new Error(`Map ${map.id} has no room for this player radius`);
  const solids = blockers(map, defeatedIds, starterId);
  const desired = {
    x: clamp(Number.isFinite(desiredX) ? desiredX : map.w / 2, radius, map.w - radius),
    y: clamp(Number.isFinite(desiredY) ? desiredY : map.h / 2, radius, map.h - radius),
  };
  if (!blocked(map, solids, desired.x, desired.y, radius)) return desired;

  // A tiny margin prevents rounding in map/world conversions from putting an
  // arrival back against the same wall on the first movement frame.
  const clearance = radius + 0.02;
  const xs = new Set([desired.x, clearance, map.w - clearance]);
  const ys = new Set([desired.y, clearance, map.h - clearance]);
  let best: { x: number; y: number } | undefined;
  let bestDistance = Infinity;
  const consider = (x: number, y: number) => {
    if (x < radius || y < radius || x > map.w - radius || y > map.h - radius) return;
    const distance = (x - desired.x) ** 2 + (y - desired.y) ** 2;
    if (distance >= bestDistance || blocked(map, solids, x, y, radius)) return;
    best = { x, y };
    bestDistance = distance;
  };
  for (const rect of solids) {
    const left = rect.x - clearance;
    const right = rect.x + rect.w + clearance;
    const top = rect.y - clearance;
    const bottom = rect.y + rect.h + clearance;
    xs.add(left); xs.add(right);
    ys.add(top); ys.add(bottom);
    consider(left, clamp(desired.y, rect.y, rect.y + rect.h));
    consider(right, clamp(desired.y, rect.y, rect.y + rect.h));
    consider(clamp(desired.x, rect.x, rect.x + rect.w), top);
    consider(clamp(desired.x, rect.x, rect.x + rect.w), bottom);
    // Circle/rectangle collision has rounded corners. Include the closest
    // corner arc, allowing a diagonal arrival without an oversized box gap.
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const cx = sx < 0 ? rect.x : rect.x + rect.w;
      const cy = sy < 0 ? rect.y : rect.y + rect.h;
      const dx = desired.x - cx;
      const dy = desired.y - cy;
      const length = Math.hypot(dx, dy);
      if (length && dx * sx >= 0 && dy * sy >= 0) consider(cx + dx / length * clearance, cy + dy / length * clearance);
    }
  }

  // At intersections, the nearest side projection can be inside a second
  // blocker. Intersect their expanded edges to find the nearest free corner.
  const orderedX = [...xs].filter(x => x >= radius && x <= map.w - radius).sort((a, b) => Math.abs(a - desired.x) - Math.abs(b - desired.x));
  const orderedY = [...ys].filter(y => y >= radius && y <= map.h - radius).sort((a, b) => Math.abs(a - desired.y) - Math.abs(b - desired.y));
  for (const x of orderedX) {
    const dx = (x - desired.x) ** 2;
    if (dx >= bestDistance) break;
    for (const y of orderedY) {
      if (dx + (y - desired.y) ** 2 >= bestDistance) break;
      consider(x, y);
    }
  }
  if (!best) throw new Error(`Map ${map.id} has no passable spawn`);
  return best;
}
