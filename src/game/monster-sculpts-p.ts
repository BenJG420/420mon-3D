import type { BufferGeometry } from "three";
import { SCULPTS_P_METAL } from "./monster-sculpts-p-metal";
import { SCULPTS_P_BOXES } from "./monster-sculpts-p-boxes";
import { SCULPTS_P_CREATURES } from "./monster-sculpts-p-creatures";

/** Original-sprite sculptures in catalogue order, Dex #121–126. */
export const SCULPTS_P:Record<string,()=>BufferGeometry>={
  mon_jerrycan:SCULPTS_P_METAL.mon_jerrycan,
  mon_floatball:SCULPTS_P_CREATURES.mon_floatball,
  mon_letterbox:SCULPTS_P_BOXES.mon_letterbox,
  mon_bollard:SCULPTS_P_METAL.mon_bollard,
  mon_shears:SCULPTS_P_CREATURES.mon_shears,
  mon_switchbox:SCULPTS_P_BOXES.mon_switchbox,
};
