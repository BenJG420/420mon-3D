import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { appendStreetProp, type StreetFinish, type StreetPropKind } from "./street-prop-models";
import { projectSurfaceUvs } from "./world-surfaces";

/** Small, fixed dock-edge clusters; they never become gameplay objects/colliders. */
export function createKaiLitter(parent: THREE.Object3D, at: (x: number, y: number) => THREE.Vector3,
  materials: Record<StreetFinish, THREE.Material>) {
  const root = new THREE.Group(); root.name = "kai-edge-litter"; parent.add(root);
  const placements: { kind: StreetPropKind; x: number; y: number; height: number; angle: number }[] = [
    { kind: "bicycle", x: 650, y: 54, height: .055, angle: 0 },
    { kind: "cardboard", x: 700, y: 48, height: .055, angle: .2 },
    { kind: "cardboard", x: 718, y: 48, height: .055, angle: -.12 },
    ...[120, 440, 790].flatMap((x, i) => [
      { kind: "bottle" as const, x, y: 214, height: .725, angle: i * .7 },
      { kind: "can" as const, x: x + 5, y: 216, height: .725, angle: i * .9 },
    ]),
  ];
  const instances: THREE.InstancedMesh[] = [], geometries: THREE.BufferGeometry[] = [];
  const transform = new THREE.Object3D();
  for (const kind of [...new Set(placements.map(item => item.kind))]) {
    const items = placements.filter(item => item.kind === kind), batches = new Map<StreetFinish, THREE.BufferGeometry[]>();
    appendStreetProp(kind, (finish, geometry) => { const batch = batches.get(finish) ?? []; batch.push(geometry); batches.set(finish, batch); });
    for (const [finish, pieces] of batches) {
      const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      projectSurfaceUvs(geometry, materials[finish]); geometries.push(geometry);
      const mesh = new THREE.InstancedMesh(geometry, materials[finish], items.length);
      mesh.name = `kai-${kind}:${finish}`; mesh.userData.propKind = kind;
      for (const [index, item] of items.entries()) {
        transform.position.copy(at(item.x, item.y)); transform.position.y = item.height;
        transform.rotation.set(0, item.angle, 0); transform.updateMatrix(); mesh.setMatrixAt(index, transform.matrix);
      }
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage); mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox(); mesh.computeBoundingSphere(); mesh.castShadow = false; mesh.receiveShadow = true;
      root.add(mesh); instances.push(mesh);
    }
  }
  root.userData.propCount = placements.length;
  let disposed = false;
  return { root, dispose() {
    if (disposed) return; disposed = true;
    for (const mesh of instances) mesh.dispose();
    for (const geometry of geometries) geometry.dispose();
    root.clear(); root.removeFromParent();
  } };
}
