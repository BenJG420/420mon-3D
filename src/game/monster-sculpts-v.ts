import type { BufferGeometry } from "three";
import { SCULPTS_V_METAL } from "./monster-sculpts-v-metal";
import { SCULPTS_V_STREET } from "./monster-sculpts-v-street";
import { SCULPTS_V_DEVICES } from "./monster-sculpts-v-devices";

/** Original-sprite sculptures in catalogue order, Dex #157–162. */
export const SCULPTS_V:Record<string,()=>BufferGeometry>={
  mon_bolt:SCULPTS_V_METAL.mon_bolt,
  mon_sumpump:SCULPTS_V_METAL.mon_sumpump,
  mon_streetlamp:SCULPTS_V_STREET.mon_streetlamp,
  mon_spraycan:SCULPTS_V_STREET.mon_spraycan,
  mon_phmeter:SCULPTS_V_DEVICES.mon_phmeter,
  mon_keycap:SCULPTS_V_DEVICES.mon_keycap,
};
