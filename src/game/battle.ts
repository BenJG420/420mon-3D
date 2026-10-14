/** Port of original 2D battle.ts, source revision 010807da77df8468a297adf33eaf1fb5c9a61c8b. */
import { speciesById } from "./data/dex";
import { getMove, type StatusId } from "./data/moves";
import { typeMod } from "./data/types";
import { CHIP_RATE, ITEMS } from "./data/items";
import { MAX_LEVEL, clampLevel, xpToNext } from "./data/progress";
import { ensureIvs, instanceUid, statsFor, type IVs, type BattleInstance } from "./battle-instance";

export { MAX_LEVEL, xpToNext, clampLevel } from "./data/progress";
export { ensureIvs, instanceUid, ivScore, statsFor, normalizePartnerForBattle } from "./battle-instance";
export type { IVs, BattleInstance } from "./battle-instance";

export type Fighter = {
  inst: BattleInstance;
  wild: boolean;
  stages: { atk: number; def: number; spa: number; spd: number; spe: number };
  sleepTurns: number;
};

export type BattleEvent = { text: string; dmgTo?: "player" | "enemy"; heal?: number };

export function rollIvs(kind: "wild" | "starter" | "legendary" = "wild"): IVs {
  const pack = (one: () => number): IVs => ({ hp: one(), atk: one(), def: one(), spa: one(), spd: one(), spe: one() });
  if (kind === "legendary") return pack(() => 95 + Math.floor(Math.random() * 6));
  if (kind === "starter") return pack(() => 40 + Math.floor(Math.random() * 51));
  if (Math.random() < 0.24) return pack(() => 90 + Math.floor(Math.random() * 11));
  return pack(() => 48 + Math.floor(Math.pow(Math.random(), 0.55) * 53));
}

export function makeInst(id: string, level: number, ivs?: IVs | null): BattleInstance {
  const sp = speciesById(id);
  const rolled = ensureIvs(ivs ?? rollIvs(sp.legendary ? "legendary" : "wild"));
  const lv = clampLevel(level);
  const st = statsFor(id, lv, rolled);
  return {
    uid: instanceUid(),
    id,
    level: lv,
    xp: 0,
    hp: st.hp,
    hpMax: st.hp,
    moves: sp.moves.slice(0, 4),
    status: "",
    ivs: rolled,
  };
}

export function toFighter(inst: BattleInstance, wild: boolean): Fighter {
  return {
    inst: { ...inst, moves: [...inst.moves], ivs: { ...inst.ivs } },
    wild,
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    sleepTurns: inst.status === "sleep" ? 2 : 0,
  };
}

function stageMul(s: number): number {
  const t = Math.max(-6, Math.min(6, s));
  return t >= 0 ? (2 + t) / 2 : 2 / (2 - t);
}

/** Original initiative including stat stages; the player wins a tie in the UI. */
export function turnSpe(f: Fighter): number {
  return Math.max(1, Math.round(statsFor(f.inst.id, f.inst.level, f.inst.ivs).spe * stageMul(f.stages.spe)));
}

function canMove(f: Fighter): { ok: boolean; text?: string } {
  const st = f.inst.status as StatusId;
  if (st === "sleep") {
    f.sleepTurns -= 1;
    if (f.sleepTurns <= 0) {
      f.inst.status = "";
      return { ok: true, text: `${speciesById(f.inst.id).name} wacht auf.` };
    }
    return { ok: false, text: `${speciesById(f.inst.id).name} schläft.` };
  }
  if (st === "lust" && Math.random() < 0.5) return { ok: false, text: `${speciesById(f.inst.id).name} ist abgelenkt.` };
  if (st === "glitch" && Math.random() < 0.3) return { ok: false, text: `${speciesById(f.inst.id).name} glitcht und setzt aus.` };
  if (st === "high" && Math.random() < 0.2) return { ok: false, text: `${speciesById(f.inst.id).name} starrt in die Wolke.` };
  return { ok: true };
}

function applyStatus(f: Fighter, s: StatusId): boolean {
  if (!s || f.inst.status || f.inst.hp <= 0) return false;
  f.inst.status = s;
  if (s === "sleep") f.sleepTurns = 1 + Math.floor(Math.random() * 2);
  return true;
}

export function execMove(atk: Fighter, def: Fighter, moveId: string): BattleEvent[] {
  if (atk.inst.hp <= 0 || def.inst.hp <= 0) return [];
  const mv = getMove(moveId);
  const an = speciesById(atk.inst.id).name;
  const dn = speciesById(def.inst.id).name;
  const gate = canMove(atk);
  const out: BattleEvent[] = [];
  if (gate.text) out.push({ text: gate.text });
  if (!gate.ok) return out;

  let acc = mv.acc;
  if (atk.inst.status === "high") acc -= 20;
  if (Math.random() * 100 > acc) {
    out.push({ text: `${an} setzt ${mv.name} ein… daneben!` });
    return out;
  }

  if (mv.kind === "stat") {
    if (mv.status) {
      const applied = applyStatus(def, mv.status);
      out.push({ text: applied ? `${an}: ${mv.name}! ${dn} ist jetzt ${statusName(mv.status)}.` : `${an}: ${mv.name}! ${dn} behält seinen Status.` });
    }
    if (mv.stat && mv.statDelta) {
      // Bug fix: original positive self boosts affected the opponent instead.
      const target = mv.statDelta > 0 ? atk : def;
      const before = target.stages[mv.stat];
      target.stages[mv.stat] = Math.max(-6, Math.min(6, before + mv.statDelta));
      const name = speciesById(target.inst.id).name;
      const change = target.stages[mv.stat] === before ? "bleibt am Limit" : mv.statDelta > 0 ? "steigt" : "fällt";
      out.push({ text: `${an}: ${mv.name}! ${name}s ${mv.stat.toUpperCase()} ${change}.` });
    }
    return out;
  }

  const spA = speciesById(atk.inst.id);
  const spD = speciesById(def.inst.id);
  const stA = statsFor(atk.inst.id, atk.inst.level, atk.inst.ivs);
  const stD = statsFor(def.inst.id, def.inst.level, def.inst.ivs);
  const off = mv.kind === "phys" ? stA.atk * stageMul(atk.stages.atk) : stA.spa * stageMul(atk.stages.spa);
  const defn = mv.kind === "phys" ? stD.def * stageMul(def.stages.def) : stD.spd * stageMul(def.stages.spd);
  const stab = spA.types.includes(mv.type) ? 1.5 : 1;
  const tmod = typeMod(mv.type, spD.types);
  if (tmod === 0) {
    out.push({ text: `${an} setzt ${mv.name} ein! Kein Effekt.` });
    return out;
  }
  const rand = 0.85 + Math.random() * 0.15;
  const offIv = mv.kind === "phys" ? (atk.inst.ivs?.atk ?? 1) : (atk.inst.ivs?.spa ?? 1);
  const ivEdge = offIv >= 90 ? 1.12 : 1;
  let dmg = Math.floor(((((2 * atk.inst.level) / 5 + 2) * mv.power * (off / Math.max(1, defn))) / 50 + 2) * stab * tmod * rand * ivEdge);
  if (spD.legendary && !spA.legendary) dmg = Math.floor(dmg * 0.72);
  dmg = Math.max(1, dmg);
  def.inst.hp = Math.max(0, def.inst.hp - dmg);
  const eff = tmod > 1 ? " Sehr effektiv!" : tmod < 1 ? " Nicht sehr effektiv…" : "";
  out.push({ text: `${an} setzt ${mv.name} ein! −${dmg}.${eff}`, dmgTo: def.wild ? "enemy" : "player" });
  if (mv.drain) atk.inst.hp = Math.min(atk.inst.hpMax, atk.inst.hp + Math.floor(dmg * mv.drain));
  if (mv.status && Math.random() < (mv.statusChance ?? 0) && applyStatus(def, mv.status)) {
    out.push({ text: `${dn} ist ${statusName(mv.status)}!` });
  }
  return out;
}

export function statusName(s: string): string {
  const names: Record<string, string> = { poison: "vergiftet", high: "high", glitch: "glitch", lust: "lustern", sleep: "eingeschlafen" };
  return names[s] ?? s;
}

export function tickStatus(f: Fighter): BattleEvent[] {
  if (f.inst.hp <= 0) return [];
  if (f.inst.status === "poison") {
    const d = Math.max(1, Math.floor(f.inst.hpMax / 8));
    f.inst.hp = Math.max(0, f.inst.hp - d);
    return [{ text: `${speciesById(f.inst.id).name} leidet unter Gift.`, dmgTo: f.wild ? "enemy" : "player" }];
  }
  return [];
}

export function pickEnemyMove(f: Fighter): string {
  const opts = f.inst.moves.filter(Boolean);
  if (!opts.length) return "move_tackle";
  const bag = opts.flatMap(id => Array.from({ length: Math.max(1, Math.round(getMove(id).power / 25)) }, () => id));
  return bag[Math.floor(Math.random() * bag.length)] ?? opts[0]!;
}

export function xpFor(enemy: Fighter, atkLevel = 1): number {
  const sp = speciesById(enemy.inst.id);
  const base = enemy.inst.level * 7 + 14;
  const ratio = enemy.inst.level / Math.max(1, atkLevel);
  const scale = Math.max(0.14, Math.min(1.4, ratio));
  return Math.max(1, Math.round(base * scale * (sp.legendary ? 2.4 : 1)));
}

export function tryLevel(inst: BattleInstance): string[] {
  const lines: string[] = [];
  const defeated = inst.hp <= 0;
  while (inst.level < MAX_LEVEL) {
    const need = xpToNext(inst.level);
    if (inst.xp < need) break;
    inst.xp -= need;
    inst.level += 1;
    const st = statsFor(inst.id, inst.level, inst.ivs);
    inst.hpMax = st.hp;
    inst.hp = defeated ? 0 : st.hp;
    lines.push(`${speciesById(inst.id).name} erreicht Lv.${inst.level}! ${defeated ? "HP bleiben bei 0." : "HP voll."}`);
    const sp = speciesById(inst.id);
    if (sp.evo && inst.level >= sp.evo.level) {
      inst.id = sp.evo.id;
      const ns = statsFor(inst.id, inst.level, inst.ivs);
      inst.hpMax = ns.hp;
      inst.hp = defeated ? 0 : ns.hp;
      inst.moves = speciesById(inst.id).moves.slice(0, 4);
      lines.push(`…evolviert zu ${speciesById(inst.id).name}!`);
    }
  }
  if (inst.level >= MAX_LEVEL) inst.xp = 0;
  return lines;
}

export function tryTrainerLevel(lv: number, xp: number): { lv: number; xp: number; lines: string[] } {
  const lines: string[] = [];
  let level = clampLevel(lv);
  let cur = Math.max(0, xp);
  while (level < MAX_LEVEL) {
    const need = xpToNext(level);
    if (cur < need) break;
    cur -= need;
    level += 1;
    lines.push(`Trainer-Lv.${level}.`);
  }
  if (level >= MAX_LEVEL) cur = 0;
  return { lv: level, xp: cur, lines };
}

export function catchChance(enemy: Fighter, chipId: string, boost = 1): number {
  // Even guaranteed chips cannot catch a defeated wild monster.
  if (enemy.inst.hp <= 0 || enemy.inst.hpMax <= 0) return 0;
  const sp = speciesById(enemy.inst.id);
  const it = ITEMS[chipId];
  if (it?.sureCatch) return 1;
  let chip = CHIP_RATE[chipId] ?? 1;
  if (it?.vsType && sp.types.includes(it.vsType)) chip *= it.vsMul ?? 1.4;
  const max = enemy.inst.hpMax;
  const statusB = enemy.inst.status ? 1.4 : 1;
  const a = ((3 * max - 2 * enemy.inst.hp) * sp.catch * chip * statusB * Math.max(1, boost)) / (3 * max);
  return Math.min(0.95, Math.max(0.04, a / 255));
}
