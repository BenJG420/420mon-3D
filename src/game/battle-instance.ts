/** Original 2D state/battle formulas, source revision 010807da77df8468a297adf33eaf1fb5c9a61c8b. */
import { DEX, speciesById } from "./data/dex";
import { clampLevel } from "./data/progress";
import type { Partner } from "./save";

export type IVs = { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };

export type BattleInstance = {
  uid: string;
  id: string;
  level: number;
  xp: number;
  hp: number;
  hpMax: number;
  moves: string[];
  status: string;
  ivs: IVs;
};

/** Persistent instance identity shared by original battles and saved partners. */
export function instanceUid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `mon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function clampIv(n: unknown): number {
  const value = typeof n === "number" && Number.isFinite(n) ? n : 50;
  return Math.max(1, Math.min(100, Math.round(value)));
}

export function ensureIvs(raw?: Partial<IVs> | null): IVs {
  return {
    hp: clampIv(raw?.hp),
    atk: clampIv(raw?.atk),
    def: clampIv(raw?.def),
    spa: clampIv(raw?.spa),
    spd: clampIv(raw?.spd),
    spe: clampIv(raw?.spe),
  };
}

export function ivScore(ivs: IVs): number {
  return Math.round((ivs.hp + ivs.atk + ivs.def + ivs.spa + ivs.spd + ivs.spe) / 6);
}

export function statsFor(id: string, level: number, ivs?: IVs | null) {
  const sp = speciesById(id);
  const b = sp.base;
  const v = ensureIvs(ivs);
  const ivMul = (iv: number) => 0.4 + (Math.max(1, Math.min(100, iv)) / 100) * 1.2;
  const bulk = sp.legendary ? 1.18 : 1;
  const bite = sp.legendary ? 1.12 : 1;
  const sc = (base: number, iv: number, lean: number) =>
    Math.max(1, Math.floor((Math.floor((base * 2 * level) / 100) + 5) * ivMul(iv) * lean));
  return {
    hp: Math.max(1, Math.floor((Math.floor((b.hp * 2 * level) / 100) + level + 10) * ivMul(v.hp) * bulk)),
    atk: sc(b.atk, v.atk, bite),
    def: sc(b.def, v.def, bulk),
    spa: sc(b.spa, v.spa, bite),
    spd: sc(b.spd, v.spd, bulk),
    spe: sc(b.spe, v.spe, bite),
  };
}

/** Add original battle fields to a saved partner without replacing the shared record. */
export function normalizePartnerForBattle(partner: Partner): BattleInstance {
  const id = partner.id && DEX[partner.id] ? partner.id : Object.values(DEX).find(sp => sp.name === partner.name)?.id;
  if (!id) throw new Error(`Kein Original-Kampfprofil für ${partner.name}.`);
  const level = clampLevel(partner.level);
  const ivs = ensureIvs(partner.ivs);
  const st = statsFor(id, level, ivs);
  const hp = typeof partner.hp === "number" && Number.isFinite(partner.hp) ? Math.max(0, partner.hp) : 1;
  const hpMax = typeof partner.hpMax === "number" && Number.isFinite(partner.hpMax) && partner.hpMax > 0 ? partner.hpMax : Math.max(st.hp, hp);
  const moves = Array.isArray(partner.moves) ? partner.moves.filter(move => typeof move === "string" && !!move).slice(0, 4) : [];
  const instance: BattleInstance = {
    uid: partner.uid || instanceUid(),
    id,
    level,
    xp: typeof partner.xp === "number" && Number.isFinite(partner.xp) ? Math.max(0, partner.xp) : 0,
    hp,
    hpMax,
    moves: moves.length ? moves : DEX[id].moves.slice(0, 4),
    status: typeof partner.status === "string" ? partner.status : "",
    ivs,
  };
  Object.assign(partner, instance, { moves: [...instance.moves], ivs: { ...partner.ivs, ...ivs } });
  return { ...instance, moves: [...instance.moves], ivs: { ...ivs } };
}
