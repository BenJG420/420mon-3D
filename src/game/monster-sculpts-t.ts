import type { BufferGeometry } from "three";
import { SCULPTS_T_HARDWARE } from "./monster-sculpts-t-hardware";
import { SCULPTS_T_FIXTURES } from "./monster-sculpts-t-fixtures";
import { SCULPTS_T_DEVICES } from "./monster-sculpts-t-devices";

/** Original-sprite sculptures in catalogue order, Dex #145–150. */
export const SCULPTS_T:Record<string,()=>BufferGeometry>={
  mon_wrench:SCULPTS_T_HARDWARE.mon_wrench,
  mon_gratecover:SCULPTS_T_FIXTURES.mon_gratecover,
  mon_stoplight:SCULPTS_T_DEVICES.mon_stoplight,
  mon_ladder:SCULPTS_T_HARDWARE.mon_ladder,
  mon_humidifier:SCULPTS_T_FIXTURES.mon_humidifier,
  mon_usbstick:SCULPTS_T_DEVICES.mon_usbstick,
};
