import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { MapDef, Rect } from "./data/maps";
import { WORLD_SCALE, mapToWorld } from "./worldGeometry";
import { projectSurfaceUvs } from "./world-surfaces";
import { appendStreetProp, type StreetFinish, type StreetPropKind } from "./street-prop-models";

export type StreetPropPlacement = { kind: StreetPropKind; x: number; z: number; angle: number };
export const STREET_PROP_RADIUS: Record<StreetPropKind, number> = { bottle: .14, can: .12, cardboard: .36, bicycle: 1, cart: .72 };
const DISTRICTS = new Set(["alley", "yard", "cable", "market", "kino", "kai", "sewer", "ash", "drain", "chem", "ring", "labyrinth", "nische", "scrap"]);
export const isDetailedDistrict = (id: string) => DISTRICTS.has(id);
const CELL_SIZE = 16, VIEW_DISTANCE = 48;
const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

function distanceToRect(map: MapDef, x: number, z: number, rect: Rect) {
  const a = mapToWorld(map, rect.x, rect.y), b = mapToWorld(map, rect.x + rect.w, rect.y + rect.h);
  return Math.hypot(Math.max(a.x - x, 0, x - b.x), Math.max(a.z - z, 0, z - b.z));
}

/** Decorative only: no source objects, collision rectangles or save state are added. */
export function planStreetDetails(map: MapDef): StreetPropPlacement[] {
  if (!DISTRICTS.has(map.id)) return [];
  const placements: StreetPropPlacement[] = [];
  const availableBins = map.objs.filter(obj => obj.kind === "bin");
  // The long Kanal needs the same six clusters spread over its full route.
  const bins = map.id === "sewer" && availableBins.length > 6
    ? Array.from({ length: 6 }, (_, i) => availableBins[Math.round(i * (availableBins.length - 1) / 5)])
    : availableBins.slice(0, 6);
  for (const [index, bin] of bins.entries()) {
    const centre = mapToWorld(map, bin.x + bin.w / 2, bin.y + bin.h / 2);
    const kinds: StreetPropKind[] = ["cardboard", "bottle", "bottle", "bottle", "can", "can"];
    // A crowded first bin must not suppress carts for the whole district.
    if (!map.indoor && !placements.some(prop => prop.kind === "cart")) kinds.unshift("cart");
    if (!map.indoor && (index === 1 || index === 3)) kinds.unshift("bicycle");
    for (const [item, kind] of kinds.entries()) {
      const radius = STREET_PROP_RADIUS[kind];
      for (let attempt = 0; attempt < 32; attempt++) {
        const angle = seeded(index * 97 + item * 23) * Math.PI * 2 + attempt * Math.PI / 4;
        const reach = .9 + radius + Math.floor(attempt / 8) * .42;
        const x = centre.x + Math.cos(angle) * reach, z = centre.z + Math.sin(angle) * reach;
        // Keep doors/hatches/NPCs and their approach free, including nonblocking originals.
        if (Math.abs(x) + radius + .1 >= map.w * WORLD_SCALE / 2 || Math.abs(z) + radius + .1 >= map.h * WORLD_SCALE / 2) continue;
        if (map.walls.some(rect => distanceToRect(map, x, z, rect) < radius + .08)) continue;
        if (map.objs.some(obj => distanceToRect(map, x, z, obj) < radius + (obj === bin ? .08 : .65))) continue;
        if (placements.some(prop => Math.hypot(prop.x - x, prop.z - z) < radius + STREET_PROP_RADIUS[prop.kind] + .08)) continue;
        placements.push({ kind, x, z, angle: angle + Math.PI / 2 }); break;
      }
    }
  }
  return placements;
}

/** Share each small model by material and spatial cell, with independent culling bounds. */
export function createStreetDetails(parent: THREE.Object3D, map: MapDef, materials: Record<StreetFinish, THREE.Material>) {
  const root = new THREE.Group(); root.name = "street-details"; parent.add(root);
  const placements = planStreetDetails(map), geometryCache = new Map<StreetPropKind, Map<StreetFinish, THREE.BufferGeometry>>();
  const cells = new Map<string, { x: number; z: number; kind: StreetPropKind; items: StreetPropPlacement[] }>();
  for (const prop of placements) {
    const x = Math.floor(prop.x / CELL_SIZE), z = Math.floor(prop.z / CELL_SIZE), key = `${x}:${z}:${prop.kind}`;
    const cell = cells.get(key) ?? { x, z, kind: prop.kind, items: [] }; cell.items.push(prop); cells.set(key, cell);
  }
  const instances: THREE.InstancedMesh[] = [], transform = new THREE.Object3D();
  for (const cell of cells.values()) {
    let parts = geometryCache.get(cell.kind);
    if (!parts) {
      const pieces = new Map<StreetFinish, THREE.BufferGeometry[]>();
      appendStreetProp(cell.kind, (finish, geometry) => {
        const batch = pieces.get(finish) ?? []; batch.push(geometry); pieces.set(finish, batch);
      });
      parts = new Map();
      for (const [finish, batch] of pieces) {
        const geometry = mergeGeometries(batch, false); for (const source of batch) source.dispose();
        if (geometry) { projectSurfaceUvs(geometry, materials[finish]); parts.set(finish, geometry); }
      }
      geometryCache.set(cell.kind, parts);
    }
    for (const [finish, geometry] of parts) {
      const mesh = new THREE.InstancedMesh(geometry, materials[finish], cell.items.length);
      mesh.name = `street-${cell.kind}:${finish}`; mesh.userData.propKind = cell.kind;
      mesh.position.set((cell.x + .5) * CELL_SIZE, .055, (cell.z + .5) * CELL_SIZE);
      for (const [i, prop] of cell.items.entries()) {
        transform.position.set(prop.x - mesh.position.x, 0, prop.z - mesh.position.z);
        transform.rotation.set(0, prop.angle, 0); transform.updateMatrix(); mesh.setMatrixAt(i, transform.matrix);
      }
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage); mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox(); mesh.computeBoundingSphere(); mesh.castShadow = false; mesh.receiveShadow = true;
      root.add(mesh); instances.push(mesh);
    }
  }
  root.userData.propCount = placements.length;
  let disposed = false;
  return {
    root,
    update(position: THREE.Vector3) {
      for (const mesh of instances) {
        const sphere = mesh.boundingSphere!;
        const distance = Math.hypot(mesh.position.x + sphere.center.x - position.x, mesh.position.z + sphere.center.z - position.z);
        mesh.visible = distance <= VIEW_DISTANCE + sphere.radius;
      }
    },
    dispose() {
      if (disposed) return; disposed = true;
      for (const mesh of instances) mesh.dispose();
      for (const parts of geometryCache.values()) for (const geometry of parts.values()) geometry.dispose();
      instances.length = 0; geometryCache.clear(); root.clear(); root.removeFromParent();
    },
  };
}
