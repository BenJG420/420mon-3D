import * as THREE from "three";
import { FISH } from "./data/fish";
import { createAquariumFish } from "./aquarium-fish";

/** A read-only view of collection history, shared by the room and close view. */
export function createAquariumSchool(caught: Record<string, unknown>) {
  const species = FISH.filter(fish => typeof caught[fish.id] === "number" &&
    Number.isFinite(caught[fish.id]) && Number(caught[fish.id]) > 0);
  const root = new THREE.Group(); root.name = "aquarium-school";
  const swimmers = species.map(fish => {
    // Catalogue index, not catch order: existing fish retain their route on a new catch.
    const index = FISH.indexOf(fish), model = createAquariumFish(fish, index);
    root.add(model.root);
    return { model, index };
  });
  let disposed = false;
  function update(seconds: number) {
    if (disposed || !Number.isFinite(seconds)) return;
    for (const { model, index } of swimmers) {
      // Ellipses turn through depth instead of snapping to a mirrored image.
      const speed = .17 + index % 7 * .011;
      const phase = seconds * speed + index * 2.399963;
      const width = 3.45 + index % 3 * .12, depth = .52 + index % 4 * .07;
      const vertical = phase * 2 + index;
      const y = 1.2 + index % 6 * .34 + Math.sin(vertical) * .085;
      const dx = Math.cos(phase) * width, dz = -Math.sin(phase) * depth;
      const dy = Math.cos(vertical) * .17;
      model.root.position.set(Math.sin(phase) * width, y, .55 + Math.cos(phase) * depth);
      model.root.rotation.set(0, -Math.atan2(dz, dx), Math.atan2(dy, Math.hypot(dx, dz)), "YXZ");
      model.update(seconds);
    }
  }
  update(0);
  return { root, species, update, dispose() {
    if (disposed) return; disposed = true;
    for (const { model } of swimmers) model.dispose();
    root.removeFromParent(); root.clear();
  } };
}
