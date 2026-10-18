/** Original 2D fish-food buffs: independent playtime clocks, strongest value,
 * and at most 600 seconds when an active effect is extended. */
import { FISH_BY_ID } from "./data/fish";
import { ITEMS } from "./data/items";
import type { Save } from "./save";

export type FishEffectId = "catch" | "speed" | "gold" | "luck" | "xp";
type EffectKey = "highCatch" | "highSpeed" | "highGold" | "highLuck" | "highXp";
type ItemEffectKey = "catchMul" | "speedMul" | "goldHigh" | "luckHigh" | "xpMul";

const EFFECTS: readonly { id: FishEffectId; key: EffectKey; item: ItemEffectKey; name: string }[] = [
  { id: "catch", key: "highCatch", item: "catchMul", name: "Fang" },
  { id: "speed", key: "highSpeed", item: "speedMul", name: "Tempo" },
  { id: "gold", key: "highGold", item: "goldHigh", name: "Gold" },
  { id: "luck", key: "highLuck", item: "luckHigh", name: "Loot" },
  { id: "xp", key: "highXp", item: "xpMul", name: "XP" },
];
const HIGH_STACK = 600;
const finite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const now = (s: Save): number => Math.max(0, finite(s.playtime, 0));

function deadline(s: Save, key: EffectKey): number {
  // Preserve old saves that used one clock until this effect gets its own.
  return Math.max(0, finite(s[`${key}Until`], finite(s.highUntil, 0)));
}

function multiplier(s: Save, key: EffectKey): number {
  const value = Math.max(1, finite(s[key], 1));
  return key === "highCatch" && value <= 1 ? Math.max(1, finite(s.highMul, 1)) : value;
}

/** Read active buffs without changing the save or restarting an expired clock. */
export function activeFishEffects(s: Save): {
  id: FishEffectId; name: string; multiplier: number; left: number; label: string;
}[] {
  const time = now(s);
  return EFFECTS.flatMap(effect => {
    const value = multiplier(s, effect.key);
    const left = Math.max(0, Math.ceil(deadline(s, effect.key) - time));
    return value > 1 && left > 0 ? [{
      id: effect.id, name: effect.name, multiplier: value, left,
      label: `${effect.name} +${Math.round((value - 1) * 100)}% ${left}s`,
    }] : [];
  });
}

export function fishEffectMultiplier(s: Save, effect: FishEffectId): number {
  return activeFishEffects(s).find(entry => entry.id === effect)?.multiplier ?? 1;
}

/** Consume an owned catalogue fish once. Catch history and party HP are untouched. */
function consumeBuffItem(s: Save, id: string, smoke: boolean, random = Math.random): { ok: boolean; lines: string[] } {
  const item = ITEMS[id];
  if (smoke ? !item || !["smoke", "bud"].includes(item.cat) || item.use !== "smoke" : !Object.prototype.hasOwnProperty.call(FISH_BY_ID, id) || item?.cat !== "fish" || item.use !== "smoke") {
    return { ok: false, lines: ["Dieses Item ist hier nicht konsumierbar."] };
  }
  const owned = finite(s.inventory[id], 0);
  if (owned < 1) return { ok: false, lines: ["Dieses Item hast du nicht im Beutel."] };

  const time = now(s);
  // Materialize separate legacy deadlines before highUntil is recomputed.
  const clocks = EFFECTS.map(effect => ({ ...effect, until: deadline(s, effect.key) }));
  for (const effect of clocks) {
    const active = effect.until > time;
    s[effect.key] = active ? multiplier(s, effect.key) : 1;
    s[`${effect.key}Until`] = active ? effect.until : 0;
  }
  s.highMul = s.highCatch;

  const duration = Math.max(0, finite(item.highTime, 42));
  const applied: string[] = [];
  const add = (effect: typeof EFFECTS[number], value: number) => {
    const previous = finite(s[effect.key], 1);
    const until = finite(s[`${effect.key}Until`], 0);
    const stacking = until > time && previous > 1;
    s[effect.key] = stacking ? Math.max(previous, value) : value;
    s[`${effect.key}Until`] = time + (stacking ? Math.min(HIGH_STACK, until - time + duration) : duration);
    if (effect.id === "catch") s.highMul = s.highCatch;
    const left = Math.max(1, Math.ceil(finite(s[`${effect.key}Until`], 0) - time));
    applied.push(`${effect.name} +${Math.round((finite(s[effect.key], 1) - 1) * 100)}% ${left}s`);
  };
  if (smoke && item.strain === "hybrid") {
    const choices = [...EFFECTS.slice(0, 4)];
    if ((item.hybridRolls ?? 1) < 3) {
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.max(0, Math.min(1 - Number.EPSILON, finite(random(), 0))) * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
    }
    const count = (item.hybridRolls ?? 1) >= 3 ? 3 : Math.max(1, Math.min(4, item.hybridRolls ?? 1));
    const defaults = [1.4, 1.2, 1.18, 1.2];
    for (const effect of choices.slice(0, count)) add(effect, finite(item[effect.item], defaults[EFFECTS.indexOf(effect)]));
  } else {
    for (const effect of EFFECTS) {
      const value = finite(item[effect.item], 1);
      if (value > 1) add(effect, value);
    }
  }
  // Matches applySmoke's catch fallback; every original fish has explicit buffs.
  if (!applied.length) add(EFFECTS[0], 1.4);

  s.highUntil = Math.max(...EFFECTS.map(effect => finite(s[`${effect.key}Until`], 0)));
  if (owned === 1) delete s.inventory[id];
  else s.inventory[id] = owned - 1;
  const catchNote = applied.some(line => line.startsWith("Fang")) ? " Mehr Wild auf der Straße." : "";
  return { ok: true, lines: [`${item.name} ${smoke ? "geraucht" : "gegessen"}. ${applied.join(" · ")}.${catchNote}`] };
}

/** Original runtime.useItem/applySmoke, revision 010807da77df8468a297adf33eaf1fb5c9a61c8b. */
export function consumeSmoke(s: Save, id: string, persist: () => boolean = () => true, random = Math.random) {
  const fields = ["highMul", "highUntil", ...EFFECTS.flatMap(e => [e.key, `${e.key}Until`])];
  const before = new Map(fields.map(key => [key, s[key]]));
  const owned = s.inventory[id];
  const result = consumeBuffItem(s, id, true, random);
  if (!result.ok) return result;
  let saved = false;
  try { saved = persist(); } catch { /* Roll back consumption if storage is unavailable. */ }
  if (!saved) {
    for (const [key, value] of before) { if (value === undefined) delete s[key]; else s[key] = value; }
    if (owned === undefined) delete s.inventory[id]; else s.inventory[id] = owned;
    return { ok: false, lines: ["Speichern fehlgeschlagen. Das Item bleibt erhalten."] };
  }
  return result;
}
export function consumeFish(s: Save, id: string) { return consumeBuffItem(s, id, false); }
