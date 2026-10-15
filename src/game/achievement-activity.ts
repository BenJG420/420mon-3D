type ActivityState = { outfit?: unknown; stats?: unknown };

const nonnegativeFinite = (value: unknown): number => typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;

/** Original activity counters; the caller supplies actual movement in 2D pixels. */
export function recordAchievementActivity(s: ActivityState, dt: number, distanceInSourcePixels: number): void {
  if (!s.stats || typeof s.stats !== "object" || Array.isArray(s.stats)) s.stats = {};
  const stats = s.stats as Record<string, unknown>;
  if (s.outfit === "nude") {
    stats.nudeSeconds = Math.min(Number.MAX_VALUE, nonnegativeFinite(stats.nudeSeconds) + nonnegativeFinite(dt));
  }
  // The source records one step per frame with actual movement, including diagonal movement.
  if (Number.isFinite(distanceInSourcePixels) && distanceInSourcePixels > .04) {
    stats.steps = Math.min(Number.MAX_VALUE, nonnegativeFinite(stats.steps) + 1);
  }
}
