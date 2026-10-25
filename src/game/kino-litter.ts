import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { appendStreetProp, type StreetFinish } from "./street-prop-models";

/** A few discarded cans/tickets on the original blocked stage, never in the aisle. */
export function createKinoLitter(parent: THREE.Group, at: (x: number, y: number) => THREE.Vector3,
  materials: Record<"metal" | "rubber" | "paper", THREE.Material>) {
  const root = new THREE.Group(); root.name = "kino-stage-litter"; parent.add(root);
  const batches = new Map<StreetFinish | "paper", THREE.BufferGeometry[]>();
  appendStreetProp("can", (finish, geometry) => {
    const pieces = batches.get(finish) ?? []; pieces.push(geometry); batches.set(finish, pieces);
  });
  batches.set("paper", [new THREE.BoxGeometry(.21, .008, .13)]);
  const parts: THREE.InstancedMesh[] = [], dummy = new THREE.Object3D();
  for (const [finish, pieces] of batches) {
    const geometry = mergeGeometries(pieces, false); for (const piece of pieces) piece.dispose();
    if (!geometry) continue;
    const paper = finish === "paper", count = paper ? 8 : 6;
    const part = new THREE.InstancedMesh(geometry, materials[finish as keyof typeof materials], count);
    part.name = `kino-stage-litter:${finish}`; part.castShadow = false; part.receiveShadow = true;
    for (let i = 0; i < count; i++) {
      dummy.position.copy(at(92 + i * (paper ? 74 : 91), paper ? 96 : 98)); dummy.position.y = paper ? .359 : .351;
      dummy.rotation.set(0, i * 1.7, 0); dummy.updateMatrix(); part.setMatrixAt(i, dummy.matrix);
    }
    part.instanceMatrix.needsUpdate = true; part.computeBoundingSphere(); root.add(part); parts.push(part);
  }
  let disposed = false;
  return { dispose() {
    if (disposed) return; disposed = true;
    for (const part of parts) { part.dispose(); part.geometry.dispose(); }
    root.removeFromParent();
  } };
}
