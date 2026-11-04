import type { BufferGeometry } from "three";
import { SCULPTS_S_OBJECTS } from "./monster-sculpts-s-objects";
import { SCULPTS_S_SURFACES } from "./monster-sculpts-s-surfaces";
import { SCULPTS_S_CREATURES } from "./monster-sculpts-s-creatures";

/** Original-sprite sculptures in catalogue order, Dex #139–144. */
export const SCULPTS_S:Record<string,()=>BufferGeometry>={
  mon_rizla:SCULPTS_S_OBJECTS.mon_rizla,
  mon_loobrush:SCULPTS_S_SURFACES.mon_loobrush,
  mon_bunsen:SCULPTS_S_OBJECTS.mon_bunsen,
  mon_boxglove:SCULPTS_S_CREATURES.mon_boxglove,
  mon_doorknob:SCULPTS_S_SURFACES.mon_doorknob,
  mon_garter:SCULPTS_S_CREATURES.mon_garter,
};
