import type { DistrictTravel } from "./world";
import { createNimRoam, tickNim, nimBody } from "./nim";
import { getSave } from "./save";

/** Nim uses the existing map renderer, collision and animation loop. */
export function createRivalSystem(world: DistrictTravel, talk: () => void) {
  const saved = getSave(), roam = createNimRoam(saved);
  return {
    update(dt: number) {
      const p = world.getMapInfo().player;
      const paused = document.body.classList.contains("menu-open") || !!document.querySelector(
        ".systems-panel:not([hidden]),.grow-backdrop:not([hidden]),.monster-battle:not([hidden]),.home-dialog:not([hidden]),.fish-overlay:not([hidden]),.achievement-overlay:not([hidden]),.monster-model-overlay:not([hidden]),.story-overlay:not([hidden]),.radio-overlay:not([hidden]),.support-overlay:not([hidden]),.studio-panel.is-open"
      );
      const challenge = tickNim(saved, roam, dt, {
        paused, playerX: p.x, playerY: p.y,
        blocked: (x, y) => { const point = world.toWorld(x, y); return world.collides(point.x, point.z, .3); },
      });
      world.setRoamingNpc(saved.team.length && world.current() === saved.rivalMap ? nimBody(saved) : undefined);
      if (challenge) talk();
    },
  };
}
