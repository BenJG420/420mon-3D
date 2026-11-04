import type { BufferGeometry } from "three";
import { SCULPTS_R_HARDWARE } from "./monster-sculpts-r-hardware";
import { SCULPTS_R_SURFACES } from "./monster-sculpts-r-surfaces";
import { SCULPTS_R_APPLIANCES } from "./monster-sculpts-r-appliances";

/** Original-sprite sculptures in catalogue order, Dex #133–138. */
export const SCULPTS_R:Record<string,()=>BufferGeometry>={
  mon_vicegrip:SCULPTS_R_HARDWARE.mon_vicegrip,
  mon_soapbar:SCULPTS_R_SURFACES.mon_soapbar,
  mon_padlock:SCULPTS_R_HARDWARE.mon_padlock,
  mon_drumcan:SCULPTS_R_SURFACES.mon_drumcan,
  mon_watercan:SCULPTS_R_APPLIANCES.mon_watercan,
  mon_powerbrick:SCULPTS_R_APPLIANCES.mon_powerbrick,
};
