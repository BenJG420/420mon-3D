import * as THREE from "three";
import { createHumanoid, type HumanLook } from "./humanoid";
import type { MapObj } from "./data/maps";
import { createEddiSmoke } from "./eddi-smoke";

/** Rendering identity only: quest IDs, interaction bounds and source motion stay in world.ts. */
export function npcLook(obj: Pick<MapObj, "id" | "sprite">): HumanLook {
  const key = obj.sprite ?? obj.id;
  const seed = Array.from(key).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const woman = /mira|cherry|silk/.test(key) || obj.id === "velvet";
  return {
    choice: woman ? "woman" : "man",
    skin: ["#c09d77", "#8c6b4d", "#cfb18f"][seed % 3],
    hair: ["#252422", "#594335", "#77756f", "#261b2b"][seed % 4],
    hairStyle: woman ? "long" : seed % 5 === 0 ? "mohawk" : "short",
    face: ["classic", "sharp", "soft"][seed % 3],
    jacket: ["#596a59", "#786047", "#59536a", "#597580", "#8a6256"][seed % 5],
    pants: "#2e3431", shoes: "#272820",
    height: .87 + (seed % 5) * .025, build: .88 + (seed % 4) * .055,
  };
}
export function createNpcHuman(obj: MapObj, group: THREE.Group, fallback: THREE.Group) {
  const actor = createHumanoid(group, ready => { fallback.visible = !ready; group.userData.npcModel = ready ? "rocketbox-rigged" : "fallback"; });
  actor.root.userData.npcId = obj.id;
  actor.setLook(npcLook(obj), "npc");
  const smoking = obj.id === "eddi_body" || obj.sprite === "npc_eddi" ? createEddiSmoke(group, actor.root) : undefined;
  const previous = group.position.clone();
  let idlePhase = Array.from(obj.id).reduce((n,c) => n+c.charCodeAt(0),0) / 100;
  return {
    update(dt: number, player: THREE.Vector3) {
      const near = group.position.distanceToSquared(player) < 45 * 45;
      actor.root.visible = near;
      const distance = group.position.distanceTo(previous);
      const walking = distance > .005 && distance < 1;
      if (near) {
        // Source moves Nim/Felix/Eddi; visual locomotion follows those positions only.
        if (walking) group.rotation.y = Math.atan2(group.position.x-previous.x, group.position.z-previous.z);
        if (idlePhase && actor.root.userData.status === "ready") { actor.update(idlePhase); idlePhase = 0; }
        actor.update(dt, walking ? 2.4 : 0);
      }
      smoking?.update(dt, walking, near);
      previous.copy(group.position);
    },
    dispose() { smoking?.dispose(); actor.dispose(); },
  };
}
