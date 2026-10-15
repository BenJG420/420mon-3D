/** One wall clock for plants and the original helpers; never advances playtime. */
import { advanceGrowSeconds, type GrowState } from "./grow-state";
import { OFFLINE_CAP, OFFLINE_MIN } from "./data/grow";
import { ensureFelixState, simulateFelixOffline, tickFelix } from "./felix-state";
import { createEddiSession, ensureEddiState, tickEddi, wakeEddi, type EddiSession } from "./eddi-state";
import type { Save } from "./save";

const sessions = new WeakMap<GrowState, { eddi: EddiSession; present: boolean }>();
export function advanceStoryGrow(s: Save, now = Date.now()): number {
  let session = sessions.get(s);
  if (!session) {
    ensureFelixState(s); ensureEddiState(s);
    session = { eddi: createEddiSession(), present: s.eddiIn };
    sessions.set(s, session);
  }
  function arrival() {
    if (!session!.present && s.eddiIn) {
      wakeEddi(s, session!.eddi);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("420mon-eddi-arrived"));
    }
    session!.present = s.eddiIn;
  }
  arrival();
  if (!Number.isFinite(now) || !Number.isFinite(s.lastGrowAt) || now <= s.lastGrowAt) return 0;
  const elapsed = Math.min(OFFLINE_CAP, (now - s.lastGrowAt) / 1000);
  s.lastGrowAt = now;
  if (elapsed >= OFFLINE_MIN) {
    simulateFelixOffline(s, elapsed, seconds => advanceGrowSeconds(s, seconds));
  } else {
    let left = elapsed;
    while (left > .000001) {
      const seconds = Math.min(.05, left);
      advanceGrowSeconds(s, seconds);
      tickFelix(s, seconds);
      arrival();
      tickEddi(s, session.eddi, seconds);
      left -= seconds;
    }
  }
  arrival();
  return elapsed;
}
