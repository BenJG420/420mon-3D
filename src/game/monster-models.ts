import * as THREE from "three";
import { DEX } from "./data/dex";
import { authoredMonsterGeometry } from "./monster-authored";

/** Source-derived columns are solid, rounded volumes, never a textured plane. */
export type MonsterModelData = {
  version: 1;
  id: string;
  sourceSprite: string;
  sourceHash: string;
  grid: [number, number];
  cellSize: number;
  columns: [number, number, number, number][];
  palette: [number, number, number][];
};

export function validateMonsterModel(value: unknown): MonsterModelData {
  const data = value as MonsterModelData;
  if (!data || data.version !== 1 || typeof data.id !== "string" || typeof data.sourceSprite !== "string" || typeof data.sourceHash !== "string") throw new Error("Unbekanntes Monster-Modell");
  const [w, h] = Array.isArray(data.grid) ? data.grid : [];
  if (typeof w !== "number" || typeof h !== "number" || !Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 36 || h > 36 || !Number.isFinite(data.cellSize) || data.cellSize <= 0 || data.cellSize > 2) throw new Error("Ungültiges Monster-Raster");
  if (!Array.isArray(data.palette) || !data.palette.length || data.palette.length > 1296 || Array.from(data.palette).some(color => !Array.isArray(color) || color.length !== 3 || Array.from(color).some(n => !Number.isInteger(n) || n < 0 || n > 255))) throw new Error("Ungültige Monster-Farben");
  if (!Array.isArray(data.columns) || !data.columns.length || data.columns.length > w * h) throw new Error("Ungültige Monster-Säulen");
  const used = new Set<number>();
  for (const column of data.columns) {
    if (!Array.isArray(column) || column.length !== 4 || Array.from(column).some(n => !Number.isInteger(n))) throw new Error("Ungültige Monster-Säule");
    const [x, y, d, color] = column;
    const cell = y * w + x;
    if (x < 0 || x >= w || y < 0 || y >= h || d < 1 || d > 7 || color < 0 || color >= data.palette.length || used.has(cell)) throw new Error("Ungültige Monster-Säule");
    used.add(cell);
  }
  return data;
}

/** Only outside faces are emitted, including the steps between unequal depths. */
export function buildMonsterGeometry(input: MonsterModelData): THREE.BufferGeometry {
  const data = validateMonsterModel(input);
  const [width, height] = data.grid;
  const depths = new Uint8Array(width * height);
  for (const [x, y, depth] of data.columns) depths[y * width + x] = depth;
  const positions: number[] = [], normals: number[] = [], colors: number[] = [], indices: number[] = [];
  const palette = data.palette.map(([r, g, b]) => new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace));
  const scale = data.cellSize;
  const centerX = (width - 1) / 2;
  const face = (points: number[][], normal: number[], color: THREE.Color) => {
    const start = positions.length / 3;
    for (const [x, y, z] of points) {
      positions.push((x - centerX) * scale, y * scale - .8, z * scale);
      normals.push(...normal); colors.push(color.r, color.g, color.b);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };
  for (const [x, y, depth, paletteIndex] of data.columns) {
    const l = x - .5, r = x + .5, b = y, t = y + 1, d = depth - .5;
    const color = palette[paletteIndex];
    face([[l,b,d], [r,b,d], [r,t,d], [l,t,d]], [0,0,1], color);
    face([[r,b,-d], [l,b,-d], [l,t,-d], [r,t,-d]], [0,0,-1], color);
    // A neighbor with less volume hides only the middle of this side.
    const side = (neighbor: number, draw: (from: number, to: number) => void) => {
      if (neighbor >= depth) return;
      if (!neighbor) draw(-d, d);
      else { const n = neighbor - .5; draw(-d, -n); draw(n, d); }
    };
    side(x ? depths[y * width + x - 1] : 0, (a, z) => face([[l,b,a], [l,b,z], [l,t,z], [l,t,a]], [-1,0,0], color));
    side(x + 1 < width ? depths[y * width + x + 1] : 0, (a, z) => face([[r,b,z], [r,b,a], [r,t,a], [r,t,z]], [1,0,0], color));
    side(y ? depths[(y - 1) * width + x] : 0, (a, z) => face([[l,b,a], [r,b,a], [r,b,z], [l,b,z]], [0,-1,0], color));
    side(y + 1 < height ? depths[(y + 1) * width + x] : 0, (a, z) => face([[l,t,z], [r,t,z], [r,t,a], [l,t,a]], [0,1,0], color));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometry.userData = { speciesId: data.id, sourceSprite: data.sourceSprite, sourceHash: data.sourceHash, mode: "source-volume" };
  return geometry;
}

export const MONSTER_MODEL_CACHE_UNUSED_LIMIT = 24;
type ModelInfo = Pick<MonsterModelData, "id" | "sourceSprite" | "sourceHash">;
type ModelKind = "sculpted" | "voxel-volume";
type ModelEntry = { refs: number; used: number; geometry?: THREE.BufferGeometry; data?: ModelInfo; kind?: ModelKind; promise: Promise<void> };
const models = new Map<string, ModelEntry>();
let clock = 0;
export type MonsterModelLease = { geometry: THREE.BufferGeometry; data: ModelInfo; kind: ModelKind; release(): void };

function trimModels(): void {
  const idle = [...models.entries()].filter(([, entry]) => entry.refs === 0 && entry.geometry).sort((a, b) => a[1].used - b[1].used);
  for (const [id, entry] of idle.slice(0, Math.max(0, idle.length - MONSTER_MODEL_CACHE_UNUSED_LIMIT))) {
    entry.geometry!.dispose(); models.delete(id);
  }
}

/** References survive asynchronous species changes; stale consumers release on resolve. */
export async function acquireMonsterModel(speciesId: string): Promise<MonsterModelLease> {
  const species = DEX[speciesId];
  if (!species) throw new Error("Unbekannte Monster-Art");
  let entry = models.get(speciesId);
  if (!entry) {
    const created: ModelEntry = { refs: 0, used: ++clock, promise: Promise.resolve() };
    models.set(speciesId, created);
    created.promise = (async () => {
      const authored = authoredMonsterGeometry(speciesId);
      if (authored) {
        created.geometry = authored;
        created.data = { id: speciesId, sourceSprite: species.sprite, sourceHash: String(authored.userData.sourceHash ?? "") };
        created.kind = "sculpted";
        return;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}game/models/${encodeURIComponent(species.sprite)}.json`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Monster-Modell nicht erreichbar: ${response.status}`);
        const data = validateMonsterModel(await response.json());
        if (data.id !== speciesId || data.sourceSprite !== species.sprite) throw new Error("Monster-Modell gehört zu anderer Art");
        created.geometry = buildMonsterGeometry(data); created.data = data; created.kind = "voxel-volume";
      } finally { clearTimeout(timeout); }
    })().catch(error => { if (models.get(speciesId) === created) models.delete(speciesId); throw error; });
    entry = created;
  }
  entry.refs++; entry.used = ++clock;
  try { await entry.promise; }
  catch (error) { entry.refs--; throw error; }
  let released = false;
  return {
    geometry: entry.geometry!, data: entry.data!, kind: entry.kind!,
    release() {
      if (released) return;
      released = true; entry.refs--; entry.used = ++clock; trimModels();
    },
  };
}

/** A small diagnostic used by the viewer and resource-ownership regression checks. */
export function monsterModelCacheInfo(): { entries: number; active: number; unused: number } {
  const entries = [...models.values()];
  return { entries: entries.length, active: entries.filter(entry => entry.refs > 0).length, unused: entries.filter(entry => !entry.refs && entry.geometry).length };
}
