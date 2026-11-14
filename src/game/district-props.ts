import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { MapDef, MapObj, Rect } from "./data/maps";
import { WORLD_SCALE, mapToWorld } from "./worldGeometry";
import { projectSurfaceUvs } from "./world-surfaces";
import { planStreetDetails, STREET_PROP_RADIUS } from "./street-details";
import {
  appendDistrictProp, DISTRICT_PROP_KINDS, DISTRICT_PROP_RADIUS,
  type DistrictPropFinish, type DistrictPropKind,
} from "./district-prop-models";

export { DISTRICT_PROP_KINDS, DISTRICT_PROP_RADIUS } from "./district-prop-models";
export type DistrictPropPlacement = { kind: DistrictPropKind; x: number; z: number; angle: number; anchorId: string };
const CELL_SIZE = 16, VIEW_DISTANCE = 48;
const serviceAnchor = (object: MapObj) => object.kind === "bin" || object.kind === "lamp" || object.kind === "sign";
const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

function worldRect(map: MapDef, rect: Rect) {
  const a = mapToWorld(map, rect.x, rect.y), b = mapToWorld(map, rect.x + rect.w, rect.y + rect.h);
  return { minX: a.x, maxX: b.x, minZ: a.z, maxZ: b.z };
}

function distanceToRect(x: number, z: number, rect: ReturnType<typeof worldRect>) {
  return Math.hypot(Math.max(rect.minX - x, 0, x - rect.maxX), Math.max(rect.minZ - z, 0, z - rect.maxZ));
}

/** Local set dressing only: retain every original object, collision and interaction. */
export function planDistrictProps(map: MapDef): DistrictPropPlacement[] {
  const kinds = DISTRICT_PROP_KINDS[map.id];
  if (!kinds) return [];
  const serviceAnchors = map.objs.filter(serviceAnchor);
  // Kino has no bins, lamps or signs. Its original fixtures are landmarks only;
  // even the chosen fixture retains the full interaction approach clearance.
  const originals = serviceAnchors.length ? serviceAnchors : map.id === "kino" ? map.objs.filter(object => object.kind === "prop") : [];
  if (!originals.length) return [];
  const axis = map.w >= map.h ? "x" : "z";
  const anchors = originals.map(object => ({ object, ...mapToWorld(map, object.x + object.w / 2, object.y + object.h / 2) }))
    .sort((a, b) => a[axis] - b[axis] || a.object.id.localeCompare(b.object.id));
  const walls = map.walls.map(rect => worldRect(map, rect));
  const objects = map.objs.map(object => ({ object, rect: worldRect(map, object) }));
  const streetProps = planStreetDetails(map), placements: DistrictPropPlacement[] = [];
  const countPerKind = Math.max(map.w, map.h) * WORLD_SCALE >= 96 ? 4 : 3;
  const total = countPerKind * kinds.length, first = anchors[0][axis], last = anchors[anchors.length - 1][axis];
  const seed = [...map.id].reduce((sum, letter) => sum * 31 + letter.charCodeAt(0), 0) % 100000;
  for (let slot = 0; slot < total; slot++) {
    const kind = kinds[slot % kinds.length], radius = DISTRICT_PROP_RADIUS[kind];
    const target = first + (last - first) * slot / (total - 1);
    // Try the nearest route landmarks first, instead of exhausting only the
    // first bins on very long districts such as the Kanal.
    const preferred = [...anchors].sort((a, b) => Math.abs(a[axis] - target) - Math.abs(b[axis] - target));
    let placed = false;
    for (const [anchorIndex, anchor] of preferred.entries()) {
      const clearance = serviceAnchor(anchor.object) ? .08 : .65;
      const reach = Math.hypot(anchor.object.w, anchor.object.h) * WORLD_SCALE / 2 + radius + clearance + .04;
      // Eight rings of sixteen directions: bounded even in crowded maps, with
      // no fallback that relaxes a wall, actor, fixture or existing prop margin.
      for (let attempt = 0; attempt < 128; attempt++) {
        const angle = seeded(seed + slot * 97 + anchorIndex * 23) * Math.PI * 2 + attempt % 16 * Math.PI / 8;
        const distance = reach + Math.floor(attempt / 16) * .4;
        const x = anchor.x + Math.cos(angle) * distance, z = anchor.z + Math.sin(angle) * distance;
        if (Math.abs(x) + radius + .1 >= map.w * WORLD_SCALE / 2 || Math.abs(z) + radius + .1 >= map.h * WORLD_SCALE / 2) continue;
        if (walls.some(rect => distanceToRect(x, z, rect) < radius + .08)) continue;
        if (objects.some(({ object, rect }) => distanceToRect(x, z, rect) < radius + (object === anchor.object ? clearance : .65))) continue;
        if (streetProps.some(prop => Math.hypot(prop.x - x, prop.z - z) < radius + STREET_PROP_RADIUS[prop.kind] + .08)) continue;
        if (placements.some(prop => Math.hypot(prop.x - x, prop.z - z) < radius + DISTRICT_PROP_RADIUS[prop.kind] + .08)) continue;
        placements.push({ kind, x, z, angle: angle + Math.PI / 2, anchorId: anchor.object.id });
        placed = true; break;
      }
      if (placed) break;
    }
  }
  return placements;
}

/** One geometry per model finish, instanced in bounded spatial culling cells. */
export function createDistrictProps(parent: THREE.Object3D, map: MapDef, materials: Record<DistrictPropFinish, THREE.Material>) {
  const root = new THREE.Group(); root.name = "district-props"; root.userData.district = map.id; parent.add(root);
  const placements = planDistrictProps(map), geometryCache = new Map<DistrictPropKind, Map<DistrictPropFinish, THREE.BufferGeometry>>();
  const cells = new Map<string, { x: number; z: number; kind: DistrictPropKind; items: DistrictPropPlacement[] }>();
  for (const prop of placements) {
    const x = Math.floor(prop.x / CELL_SIZE), z = Math.floor(prop.z / CELL_SIZE), key = `${x}:${z}:${prop.kind}`;
    const cell = cells.get(key) ?? { x, z, kind: prop.kind, items: [] }; cell.items.push(prop); cells.set(key, cell);
  }
  const instances: THREE.InstancedMesh[] = [], transform = new THREE.Object3D();
  for (const cell of cells.values()) {
    let parts = geometryCache.get(cell.kind);
    if (!parts) {
      const pieces = new Map<DistrictPropFinish, THREE.BufferGeometry[]>();
      appendDistrictProp(cell.kind, (finish, geometry) => {
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
      mesh.name = `district-${cell.kind}:${finish}`; mesh.userData.propKind = cell.kind; mesh.userData.finish = finish;
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
