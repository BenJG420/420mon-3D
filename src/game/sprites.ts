/** Complete original 2D sheets are retained locally; both UI and world use one pose. */
export const PNG_SPRITES = new Set([
  "budling", "neonpunx", "puffpuff",
  "kerboss", "kronkush", "rootkaiser", "glutarch", "rohrlethe",
  "vialith", "cagekaiser", "noxarch", "velouryx", "slagodon",
]);

/** Original sheets contain four 128 px frames in a 256 px, 2 × 2 atlas. */
export const SPRITE_FRAME = Object.freeze({
  repeatX: 0.5, repeatY: 0.5, offsetX: 0, offsetY: 0.5,
});

export function spriteUrl(slug: string, baseUrl = import.meta.env.BASE_URL): string {
  return `${baseUrl}game/sprites/${encodeURIComponent(slug)}.${PNG_SPRITES.has(slug) ? "png" : "svg"}`;
}
