import type { BufferGeometry } from "three";
import { SCULPTS_U_METAL } from "./monster-sculpts-u-metal";
import { SCULPTS_U_CURVED } from "./monster-sculpts-u-curved";
import { SCULPTS_U_CREATURES } from "./monster-sculpts-u-creatures";

/** Original-sprite sculptures in catalogue order, Dex #151–156. */
export const SCULPTS_U:Record<string,()=>BufferGeometry>={
  mon_roachclip:SCULPTS_U_METAL.mon_roachclip,
  mon_faucet:SCULPTS_U_METAL.mon_faucet,
  mon_mortar:SCULPTS_U_CURVED.mon_mortar,
  mon_jumprope:SCULPTS_U_CURVED.mon_jumprope,
  mon_lantern:SCULPTS_U_CREATURES.mon_lantern,
  mon_fishnet:SCULPTS_U_CREATURES.mon_fishnet,
};
