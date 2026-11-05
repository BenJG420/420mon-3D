import type { BufferGeometry } from "three";
import { SCULPTS_X_METAL } from "./monster-sculpts-x-metal";
import { SCULPTS_X_MATERIALS } from "./monster-sculpts-x-materials";
import { SCULPTS_X_DEVICES } from "./monster-sculpts-x-devices";

/** Original-sprite sculptures in catalogue order, Dex #169–174. */
export const SCULPTS_X:Record<string,()=>BufferGeometry>={
  mon_circsaw:SCULPTS_X_METAL.mon_circsaw,
  mon_tidegate:SCULPTS_X_METAL.mon_tidegate,
  mon_sawhorse:SCULPTS_X_MATERIALS.mon_sawhorse,
  mon_gutter:SCULPTS_X_MATERIALS.mon_gutter,
  mon_growtimer:SCULPTS_X_DEVICES.mon_growtimer,
  mon_mouse:SCULPTS_X_DEVICES.mon_mouse,
};
