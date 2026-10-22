/** The original 2D save marker survives evolution, boxing and defeated HP. */
export function hasChosenStarter(state: { starterId?: unknown; [key: string]: unknown }): boolean {
  return typeof state.starterId === "string" && state.starterId.trim().length > 0;
}

/** Shared by the room, interaction, collision, spawn and minimap paths. */
export function isTakenStarter(object: { id: string; kind?: string }, starterId: unknown): boolean {
  return (object.kind === "starter" || object.id === "starter") && hasChosenStarter({ starterId });
}
