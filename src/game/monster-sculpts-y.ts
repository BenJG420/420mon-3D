import type { BufferGeometry } from "three";
import { SCULPTS_Y_VESSELS } from "./monster-sculpts-y-vessels";
import { SCULPTS_Y_CREATURES } from "./monster-sculpts-y-creatures";
import { SCULPTS_Y_RELICS } from "./monster-sculpts-y-relics";

/** Original-sprite sculptures in catalogue order, Dex #175–180. */
export const SCULPTS_Y:Record<string,()=>BufferGeometry>={
  mon_grinder:SCULPTS_Y_VESSELS.mon_grinder,
  mon_squeegee:SCULPTS_Y_CREATURES.mon_squeegee,
  mon_funnel:SCULPTS_Y_VESSELS.mon_funnel,
  mon_headgear:SCULPTS_Y_CREATURES.mon_headgear,
  mon_chalk:SCULPTS_Y_RELICS.mon_chalk,
  mon_cuff:SCULPTS_Y_RELICS.mon_cuff,
};
