import { SCULPTS_K_PROPS } from "./monster-sculpts-k-props";
import { SCULPTS_K_CREATURES } from "./monster-sculpts-k-creatures";

/** Original first-pose sculptures #91–96; the shared cache owns the finished meshes. */
export const SCULPTS_K = { ...SCULPTS_K_PROPS, ...SCULPTS_K_CREATURES };
