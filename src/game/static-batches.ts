import * as THREE from "three";

/** Only non-interactive floor decoration belongs here; map objects keep their owners. */
export type StaticDecoration = {
  kind: "grass"; position: THREE.Vector3; height: number; lean: number;
} | {
  kind: "puddle"; position: THREE.Vector3; size: number; angle: number; stretch: number;
};
export type StaticBatchStats = {
  optimized: boolean; objects: number; baselineDraws: number; optimizedDraws: number;
  /** Potential main-pass calls, before frustum culling; not GPU/FPS measurements. */
  activeDraws: number; cellSize: number;
};

const CELL_SIZE = 16;

/** Instancing preserves the original topology, UVs and inverse-transformed normals. */
export function createStaticBatches(
  parent: THREE.Object3D,
  decorations: readonly StaticDecoration[],
  materials: { grass: THREE.Material; puddle: THREE.Material },
  initiallyOptimized = true,
) {
  const root = new THREE.Group(); root.name = "static-district-decorations"; parent.add(root);
  const cells = new Map<string, { x: number; z: number; items: StaticDecoration[] }>();
  for (const item of decorations) {
    const x = Math.floor(item.position.x / CELL_SIZE), z = Math.floor(item.position.z / CELL_SIZE);
    const key = `${item.kind}:${x}:${z}`;
    let cell = cells.get(key);
    if (!cell) { cell = { x, z, items: [] }; cells.set(key, cell); }
    cell.items.push(item);
  }
  const ownedGeometries = new Set<THREE.BufferGeometry>();
  let optimized = initiallyOptimized, disposed = false;

  function clear() {
    // InstancedMesh owns its GPU instance attributes. Materials and their shared
    // surface/alpha textures belong to the district world and are never disposed here.
    for (const node of root.children) if (node instanceof THREE.InstancedMesh) node.dispose();
    root.clear();
    for (const geometry of ownedGeometries) geometry.dispose();
    ownedGeometries.clear();
  }
  function own<T extends THREE.BufferGeometry>(geometry: T) { ownedGeometries.add(geometry); return geometry; }
  function configure(node: THREE.Mesh, kind: StaticDecoration["kind"]) {
    node.name = kind === "grass" ? "district-grass" : "rain-puddle";
    node.castShadow = false; node.receiveShadow = true;
    root.add(node);
  }
  function build() {
    if (!optimized) {
      // Allocate the actual v51 individual geometry only for Ben's A/B comparison.
      for (const item of decorations) {
        const geometry = own(item.kind === "grass"
          ? new THREE.ConeGeometry(.1, item.height, 5)
          : new THREE.PlaneGeometry(item.size, item.size));
        const node = new THREE.Mesh(geometry, materials[item.kind]);
        node.position.copy(item.position);
        if (item.kind === "grass") node.rotation.z = item.lean;
        else { node.rotation.set(-Math.PI / 2, 0, item.angle); node.scale.y = item.stretch; }
        configure(node, item.kind);
      }
      return;
    }
    const geometryByKind = new Map<StaticDecoration["kind"], THREE.BufferGeometry>();
    const transform = new THREE.Object3D();
    for (const cell of cells.values()) {
      const kind = cell.items[0].kind;
      let geometry = geometryByKind.get(kind);
      if (!geometry) {
        geometry = own(kind === "grass" ? new THREE.ConeGeometry(.1, 1, 5) : new THREE.PlaneGeometry(1, 1));
        geometryByKind.set(kind, geometry);
      }
      const node = new THREE.InstancedMesh(geometry, materials[kind], cell.items.length);
      // Local cell coordinates retain precision and give each small batch its own bounds.
      node.position.set((cell.x + .5) * CELL_SIZE, 0, (cell.z + .5) * CELL_SIZE);
      for (let i = 0; i < cell.items.length; i++) {
        const item = cell.items[i];
        transform.position.copy(item.position).sub(node.position);
        if (item.kind === "grass") { transform.rotation.set(0, 0, item.lean); transform.scale.set(1, item.height, 1); }
        else { transform.rotation.set(-Math.PI / 2, 0, item.angle); transform.scale.set(item.size, item.size * item.stretch, 1); }
        transform.updateMatrix(); node.setMatrixAt(i, transform.matrix);
      }
      node.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      node.instanceMatrix.needsUpdate = true;
      node.computeBoundingBox(); node.computeBoundingSphere();
      configure(node, kind);
    }
  }
  build();
  return {
    setOptimized(enabled: boolean) {
      if (disposed || optimized === enabled) return;
      clear(); optimized = enabled; build();
    },
    getStats(): StaticBatchStats {
      const objects = disposed ? 0 : decorations.length, batches = disposed ? 0 : cells.size;
      return { optimized, objects, baselineDraws: objects, optimizedDraws: batches,
        activeDraws: optimized ? batches : objects, cellSize: CELL_SIZE };
    },
    dispose() {
      if (disposed) return;
      clear(); root.removeFromParent(); cells.clear(); disposed = true;
    },
  };
}
