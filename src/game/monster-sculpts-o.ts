import type { BufferGeometry } from "three";
import { SCULPTS_O_OBJECTS } from "./monster-sculpts-o-objects";
import { SCULPTS_O_HINGED } from "./monster-sculpts-o-hinged";
import { SCULPTS_O_INSTRUMENTS } from "./monster-sculpts-o-instruments";

/** Original-sprite detail pass, explicitly ordered as Dex #115–120. */
export const SCULPTS_O: Record<string,()=>BufferGeometry> = {
  mon_cigpack: SCULPTS_O_OBJECTS.mon_cigpack,
  mon_seatring: SCULPTS_O_HINGED.mon_seatring,
  mon_pipette: SCULPTS_O_OBJECTS.mon_pipette,
  mon_belltimer: SCULPTS_O_INSTRUMENTS.mon_belltimer,
  mon_compass: SCULPTS_O_INSTRUMENTS.mon_compass,
  mon_compact: SCULPTS_O_HINGED.mon_compact,
};
