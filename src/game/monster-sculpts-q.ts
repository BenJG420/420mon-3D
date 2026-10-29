import type { BufferGeometry } from "three";
import { SCULPTS_Q_OBJECTS } from "./monster-sculpts-q-objects";
import { SCULPTS_Q_CREATURES } from "./monster-sculpts-q-creatures";
import { SCULPTS_Q_SOFT } from "./monster-sculpts-q-soft";

/** Original-sprite sculptures in catalogue order, Dex #127–132. */
export const SCULPTS_Q:Record<string,()=>BufferGeometry>={
  mon_matchbook:SCULPTS_Q_OBJECTS.mon_matchbook,
  mon_shutoff:SCULPTS_Q_OBJECTS.mon_shutoff,
  mon_goggles:SCULPTS_Q_CREATURES.mon_goggles,
  mon_speedbag:SCULPTS_Q_SOFT.mon_speedbag,
  mon_yarnball:SCULPTS_Q_SOFT.mon_yarnball,
  mon_choker:SCULPTS_Q_CREATURES.mon_choker,
};
