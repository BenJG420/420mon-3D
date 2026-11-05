import type { BufferGeometry } from "three";
import { SCULPTS_W_VESSELS } from "./monster-sculpts-w-vessels";
import { SCULPTS_W_FLEXIBLE } from "./monster-sculpts-w-flexible";
import { SCULPTS_W_SURFACES } from "./monster-sculpts-w-surfaces";

/** Original-sprite sculptures in catalogue order, Dex #163–168. */
export const SCULPTS_W:Record<string,()=>BufferGeometry>={
  mon_bong:SCULPTS_W_VESSELS.mon_bong,
  mon_ubend:SCULPTS_W_VESSELS.mon_ubend,
  mon_teststrip:SCULPTS_W_SURFACES.mon_teststrip,
  mon_heavybag:SCULPTS_W_FLEXIBLE.mon_heavybag,
  mon_mapscrap:SCULPTS_W_SURFACES.mon_mapscrap,
  mon_whip:SCULPTS_W_FLEXIBLE.mon_whip,
};
