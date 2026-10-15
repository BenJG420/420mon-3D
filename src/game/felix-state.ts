import { FELIX_BUD_CAP, FELIX_CAGE_STAND, FELIX_CRATE_STAND, FELIX_CUT_T, FELIX_GRAB, FELIX_PLANT_T, FELIX_SEED_CAP, FELIX_SPEED, FELIX_STORE_T, bagCount, crateOk, felixCutN, type FelixAct } from "./data/felix";
import { OFFLINE_CAP, potYieldRaw, strainGrowBase, growTickSpeed } from "./data/grow";
import { FERT_RANK, ITEMS, UNIQUE_FIND, isGrowBox } from "./data/items";
import { MAPS } from "./data/maps";
import { emptyPot, growRemaining, previewGrowHarvest, slotOpen, type GrowState } from "./grow-state";

/** Original source: 420mon runtime.ts / data/felix.ts, revision 010807d. */
export type FelixState = GrowState & {
  felixMet: boolean; felixHired: boolean; felixSmoked: boolean;
  felixCrate: Record<string, number>; felixBag: Record<string, number>; felixHarvest: Record<string, number>;
  felixAct: FelixAct; felixX: number; felixY: number; felixFacing: number;
  felixPot: number; felixAnim: number; felixSeed: string; felixFert: string;
  felixCarry: string; felixCarryN: number;
};
export type FelixResult = { planted: number; harvested: number; buds: number; cut: number; changed: boolean };
const acts: FelixAct[] = ["idle", "tocage", "tocrate", "grab", "topot", "plant", "toharvest", "cut", "tostore", "store"];
const finite = (n: unknown, fallback: number) => typeof n === "number" && Number.isFinite(n) ? n : fallback;
const count = (n: unknown) => Math.max(0, Math.floor(finite(n, 0)));
const numBag = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const bag = value as Record<string, number>;
  for (const id of Object.keys(bag)) {
    const n = count(bag[id]);
    if (!ITEMS[id] || !n) delete bag[id]; else bag[id] = n;
  }
  return bag;
};
const add = (bag: Record<string, number>, id: string, n: number) => { if (id && n > 0) bag[id] = count(bag[id]) + n; };
const take = (bag: Record<string, number>, id: string, n: number): boolean => {
  if (!id || n < 1 || count(bag[id]) < n) return false;
  bag[id] -= n;
  if (!bag[id]) delete bag[id];
  return true;
};

/** Retain live bags and migrate the original pre-bag worker saves without losing stock. */
export function ensureFelixState(state: GrowState): FelixState {
  const s = state as FelixState;
  s.felixMet = s.felixMet === true;
  s.felixHired = s.felixHired === true;
  s.felixSmoked = s.felixSmoked === true;
  s.felixCrate = numBag(s.felixCrate); s.felixBag = numBag(s.felixBag); s.felixHarvest = numBag(s.felixHarvest);
  s.felixAct = acts.includes(s.felixAct) ? s.felixAct : "idle";
  s.felixX = Math.max(0, Math.min(320, finite(s.felixX, FELIX_CAGE_STAND.x)));
  s.felixY = Math.max(0, Math.min(180, finite(s.felixY, FELIX_CAGE_STAND.y)));
  s.felixFacing = Math.max(0, Math.min(3, Math.round(finite(s.felixFacing, 3))));
  s.felixPot = Math.round(finite(s.felixPot, -1));
  s.felixAnim = Math.max(0, finite(s.felixAnim, 0));
  // These fields held stock in early original saves. Empty them after migration.
  if (typeof s.felixSeed === "string" && ITEMS[s.felixSeed]?.cat === "seed") add(s.felixBag, s.felixSeed, 1);
  if (typeof s.felixFert === "string" && ITEMS[s.felixFert]?.cat === "fert") add(s.felixBag, s.felixFert, 1);
  if (typeof s.felixCarry === "string" && ITEMS[s.felixCarry]?.cat === "bud") add(s.felixHarvest, s.felixCarry, count(s.felixCarryN));
  s.felixSeed = ""; s.felixFert = ""; s.felixCarry = ""; s.felixCarryN = bagCount(s.felixHarvest);
  if (Array.isArray(s.felixJobs)) {
    for (const raw of s.felixJobs) {
      if (!raw || typeof raw !== "object") continue;
      const job = raw as { seed?: string; fert?: string };
      if (job.seed && ITEMS[job.seed]?.cat === "seed") add(s.felixCrate, job.seed, 1);
      if (job.fert && ITEMS[job.fert]?.cat === "fert") add(s.felixCrate, job.fert, 1);
    }
    delete s.felixJobs;
    snapCage(s);
  }
  return s;
}

export function meetFelix(state: GrowState): boolean {
  const s = ensureFelixState(state), first = !s.felixMet;
  s.felixMet = true;
  return first;
}

/** The original sets the lower cut even when the offered puff finds no bud. */
export function shareWithFelix(state: GrowState, share: boolean): { shared: boolean; bud?: string } {
  const s = ensureFelixState(state);
  if (s.felixHired) return { shared: false };
  s.felixMet = true; s.felixSmoked = share;
  if (!share) return { shared: false };
  const bud = Object.keys(s.inventory).find(id => ITEMS[id]?.cat === "bud" && count(s.inventory[id]) > 0);
  if (bud) s.inventory[bud]--;
  return { shared: !!bud, bud };
}

export function hireFelix(state: GrowState): boolean {
  const s = ensureFelixState(state);
  if (s.felixHired) return false;
  s.felixHired = true; s.felixMet = true;
  snapCage(s);
  return true;
}

/** Both directions are atomic; only the physical crate UI should expose them. */
export function cratePut(state: GrowState, id: string, amount = 1): number {
  const s = ensureFelixState(state), n = Math.floor(amount);
  if (!s.felixHired || !Number.isFinite(amount) || n < 1 || !crateOk(id, ITEMS[id]?.cat) || count(s.inventory[id]) < n) return 0;
  s.inventory[id] -= n; add(s.felixCrate, id, n);
  return n;
}

export function crateTake(state: GrowState, id: string, amount = 1): number {
  const s = ensureFelixState(state), n = Math.min(count(amount), count(s.felixCrate[id]));
  if (!s.felixHired || n < 1 || !ITEMS[id] || !take(s.felixCrate, id, n)) return 0;
  add(s.inventory, id, n);
  if (UNIQUE_FIND.includes(id)) {
    const found = Array.isArray(s.foundLoot) ? s.foundLoot.filter((v): v is string => typeof v === "string") : [];
    if (!found.includes(id)) found.push(id);
    s.foundLoot = found;
  }
  return n;
}

export const felixBagSeeds = (state: GrowState): number => Object.entries(ensureFelixState(state).felixBag).reduce((n, [id, amount]) => n + (ITEMS[id]?.cat === "seed" ? amount : 0), 0);
export const felixHarvestN = (state: GrowState): number => bagCount(ensureFelixState(state).felixHarvest);
const empty = (s: FelixState): number => s.pots.findIndex((p, index) => slotOpen(s, index) && p.phase === "empty");
const ready = (s: FelixState): number => s.pots.findIndex(p => p.phase === "ready" && !!p.byFelix);
const seedInCrate = (s: FelixState): string => Object.keys(s.felixCrate).find(id => ITEMS[id]?.cat === "seed" && s.felixCrate[id] > 0) ?? "";
const fertInCrate = (s: FelixState): string => FERT_RANK.find(id => s.felixCrate[id] > 0) ?? "";
const bagTakeCat = (s: FelixState, cat: "seed" | "fert"): string => {
  const keys = cat === "fert" ? FERT_RANK : Object.keys(s.felixBag);
  const id = keys.find(id => ITEMS[id]?.cat === cat && s.felixBag[id] > 0) ?? "";
  if (id) take(s.felixBag, id, 1);
  return id;
};

export function potStand(index: number): { x: number; y: number } {
  const pot = MAPS.capsule.objs.find(o => o.kind === "pot" && o.pot === index);
  return pot ? { x: pot.x + pot.w / 2, y: pot.y < 90 ? pot.y + pot.h + 14 : pot.y - 10 } : FELIX_CAGE_STAND;
}

export function felixBusy(state: GrowState): boolean {
  const s = ensureFelixState(state);
  return s.felixHired && ((s.felixAct !== "idle" && s.felixAct !== "tocage") || bagCount(s.felixHarvest) > 0 || ready(s) >= 0 || (empty(s) >= 0 && (felixBagSeeds(s) > 0 || !!seedInCrate(s))));
}

function snapCage(s: FelixState): void {
  s.felixAct = "idle"; s.felixX = FELIX_CAGE_STAND.x; s.felixY = FELIX_CAGE_STAND.y;
  s.felixFacing = 3; s.felixAnim = 0; s.felixPot = -1;
}

function pickWork(s: FelixState): void {
  const cut = ready(s), slot = empty(s), seeds = felixBagSeeds(s), harvest = bagCount(s.felixHarvest);
  if (harvest >= FELIX_BUD_CAP) s.felixAct = "tostore";
  else if (cut >= 0) { s.felixPot = cut; s.felixAct = "toharvest"; }
  else if (seeds > 0 && slot >= 0) { s.felixPot = slot; s.felixAct = "topot"; }
  else if (slot >= 0 && seedInCrate(s) && seeds < FELIX_SEED_CAP) s.felixAct = "tocrate";
  else if (harvest > 0) s.felixAct = "tostore";
  else if (Math.hypot(s.felixX - FELIX_CAGE_STAND.x, s.felixY - FELIX_CAGE_STAND.y) < 4) snapCage(s);
  else s.felixAct = "tocage";
}

function step(s: FelixState, target: { x: number; y: number }, dt: number): boolean {
  const x = target.x - s.felixX, y = target.y - s.felixY, distance = Math.hypot(x, y);
  if (distance > 0) s.felixFacing = Math.abs(x) > Math.abs(y) ? (x < 0 ? 2 : 3) : +(y < 0);
  const reach = distance < 1.4 || FELIX_SPEED * dt >= distance;
  if (reach) { s.felixX = target.x; s.felixY = target.y; }
  else { s.felixX += x / distance * FELIX_SPEED * dt; s.felixY += y / distance * FELIX_SPEED * dt; }
  return reach;
}

function grab(s: FelixState): void {
  const capacity = FELIX_SEED_CAP - felixBagSeeds(s);
  if (capacity <= 0 || empty(s) < 0) return;
  for (let i = 0; i < capacity; i++) {
    const seed = seedInCrate(s);
    if (!seed) break;
    take(s.felixCrate, seed, 1); add(s.felixBag, seed, 1);
    const fert = fertInCrate(s);
    if (fert) { take(s.felixCrate, fert, 1); add(s.felixBag, fert, 1); }
  }
}

function plant(s: FelixState, result: FelixResult): void {
  let index = s.felixPot;
  if (!s.pots[index] || s.pots[index].phase !== "empty" || !slotOpen(s, index)) index = empty(s);
  if (index < 0 || !felixBagSeeds(s)) return;
  const seed = bagTakeCat(s, "seed");
  if (!seed) return;
  const fert = bagTakeCat(s, "fert"), total = strainGrowBase(seed);
  Object.assign(s.pots[index], emptyPot(index), { seed, fert, total, timeLeft: total, phase: "sprout", byFelix: true, eddiBoost: false });
  delete s.pots[index].careBest; delete s.pots[index].careRewardHits;
  s.quest.q7_grow = true; s.quests.q7_grow = "done"; s.felixPot = index; result.planted++;
}

function cut(s: FelixState, result: FelixResult, random: () => number): void {
  const index = s.felixPot, p = s.pots[index];
  if (!p || p.phase !== "ready" || !p.byFelix) return;
  const harvest = previewGrowHarvest(s, index);
  if (!harvest) return;
  if (random() < .35) add(felixBagSeeds(s) < FELIX_SEED_CAP ? s.felixBag : s.felixCrate, p.seed, 1);
  if (!s.harvestedSeeds.includes(p.seed)) s.harvestedSeeds.push(p.seed);
  s.stats.plantsHarvested = count(s.stats.plantsHarvested) + 1;
  s.quest.q2_harvest = true; s.quests.q2_harvest = "done";
  if (isGrowBox(index)) { s.boxHarvests++; if (s.boxHarvests >= 100) s.eddiIn = true; }
  add(s.felixHarvest, harvest.budId, harvest.buds);
  s.felixCarryN = bagCount(s.felixHarvest); s.pots[index] = emptyPot(index);
  result.harvested++;
  // Like the original worker, automatic tending grants no player/partner XP.
}

export function flushFelixHarvest(state: GrowState): { buds: number; cut: number } {
  const s = ensureFelixState(state);
  let buds = 0, cut = 0;
  for (const [id, amount] of Object.entries(s.felixHarvest)) {
    const fee = felixCutN(amount, s.felixSmoked ? .05 : .1), keep = amount - fee;
    add(s.felixCrate, id, keep); buds += keep; cut += fee;
  }
  s.felixHarvest = {}; s.felixCarry = ""; s.felixCarryN = 0;
  return { buds, cut };
}

/** One source worker frame; caller advances the shared Grow clock separately. */
export function tickFelix(state: GrowState, dt: number, random = Math.random): FelixResult {
  const result: FelixResult = { planted: 0, harvested: 0, buds: 0, cut: 0, changed: false };
  if (!Number.isFinite(dt) || dt <= 0) return result;
  const s = ensureFelixState(state);
  if (!s.felixHired) return result;
  const before = s.felixAct;
  if (before === "idle") pickWork(s);
  else if (before === "tocage") { pickWork(s); if (s.felixAct === "tocage" && step(s, FELIX_CAGE_STAND, dt)) snapCage(s); }
  else if (before === "tocrate") { if (step(s, FELIX_CRATE_STAND, dt)) { s.felixFacing = 0; s.felixAct = "grab"; s.felixAnim = FELIX_GRAB; } }
  else if (before === "grab") { s.felixAnim -= dt; if (s.felixAnim <= 0) { grab(s); pickWork(s); } }
  else if (before === "topot") {
    if (step(s, potStand(s.felixPot), dt)) {
      const p = s.pots[s.felixPot];
      if (!p || p.phase !== "empty" || !slotOpen(s, s.felixPot)) pickWork(s);
      else { s.felixAct = "plant"; s.felixAnim = FELIX_PLANT_T; }
    }
  } else if (before === "plant") { s.felixAnim -= dt; if (s.felixAnim <= 0) { plant(s, result); pickWork(s); } }
  else if (before === "toharvest") {
    if (step(s, potStand(s.felixPot), dt)) {
      const p = s.pots[s.felixPot];
      if (!p || p.phase !== "ready" || !p.byFelix) pickWork(s);
      else { s.felixAct = "cut"; s.felixAnim = FELIX_CUT_T; }
    }
  } else if (before === "cut") { s.felixAnim -= dt; if (s.felixAnim <= 0) { cut(s, result, random); pickWork(s); } }
  else if (before === "tostore") { if (step(s, FELIX_CRATE_STAND, dt)) { s.felixFacing = 0; s.felixAct = "store"; s.felixAnim = FELIX_STORE_T; } }
  else if (before === "store") { s.felixAnim -= dt; if (s.felixAnim <= 0) { Object.assign(result, flushFelixHarvest(s)); pickWork(s); } }
  result.changed = before !== s.felixAct || result.planted > 0 || result.harvested > 0 || result.buds > 0 || result.cut > 0;
  return result;
}

type Cycle = { indexes: number[]; seeds: string[]; ferts: string[]; plantT: number; growT: number; harvestT: number; total: number };
const walkTime = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) / FELIX_SPEED;
function harvestTime(s: FelixState, indexes: number[], seeds?: string[], ferts?: string[]): number {
  let at = FELIX_CRATE_STAND, seconds = 0, buds = 0;
  indexes.forEach((index, i) => {
    const stand = potStand(index), p = s.pots[index];
    seconds += walkTime(at, stand) + FELIX_CUT_T; at = stand;
    const raw = potYieldRaw({ seed: seeds?.[i] ?? p.seed, fert: ferts?.[i] ?? p.fert, eddiBoost: !!p.eddiBoost }, isGrowBox(index));
    let bonus = 1 + (s.outfit === "nude" ? .1 : 0) + (s.flagLowtown ? .05 : 0);
    const clothing = typeof s.outfit === "string" ? ITEMS[s.outfit]?.goldMul : 0;
    if (clothing && clothing > 1) bonus *= clothing;
    if (finite(s.highGoldUntil, 0) > finite(s.playtime, 0)) bonus *= Math.max(1, finite(s.highGold, 1));
    buds += Math.max(1, Math.round(raw.buds * bonus));
  });
  const back = walkTime(at, FELIX_CRATE_STAND);
  seconds += back + FELIX_STORE_T;
  seconds += (Math.max(1, Math.ceil(Math.max(buds, 1) / FELIX_BUD_CAP)) - 1) * (back * 2 + FELIX_STORE_T);
  return seconds;
}

function peekCycle(s: FelixState): Cycle | undefined {
  const slots = s.pots.flatMap((p, index) => slotOpen(s, index) && p.phase === "empty" ? [index] : []);
  const stock = { ...s.felixCrate }, seeds: string[] = [], ferts: string[] = [];
  for (const id of Object.keys(stock)) if (ITEMS[id]?.cat === "seed") {
    while (stock[id] > 0 && seeds.length < slots.length) { seeds.push(id); stock[id]--; }
    if (seeds.length >= slots.length) break;
  }
  if (!seeds.length) return;
  const indexes = slots.slice(0, seeds.length);
  let plantT = FELIX_GRAB, growT = 0, at = FELIX_CRATE_STAND;
  for (let i = 0; i < indexes.length; i++) {
    const fert = FERT_RANK.find(id => stock[id] > 0) ?? "";
    if (fert) stock[fert]--;
    ferts.push(fert);
    const stand = potStand(indexes[i]); plantT += walkTime(at, stand) + FELIX_PLANT_T; at = stand;
    growT = Math.max(growT, strainGrowBase(seeds[i]) / Math.max(.01, growTickSpeed(fert, true, s.schnittTitle, s.eddiIn)));
  }
  const harvestT = harvestTime(s, indexes, seeds, ferts);
  return { indexes, seeds, ferts, plantT, growT, harvestT, total: plantT + growT + harvestT };
}

/** Original capped offline cycles. advancePots must move only existing plant clocks. */
export function simulateFelixOffline(state: GrowState, seconds: number, advancePots: (seconds: number) => void, random = Math.random): FelixResult {
  const result: FelixResult = { planted: 0, harvested: 0, buds: 0, cut: 0, changed: false };
  if (!Number.isFinite(seconds) || seconds <= 0) return result;
  const s = ensureFelixState(state);
  let remaining = Math.min(OFFLINE_CAP, seconds);
  const advance = (n: number) => { const dt = Math.min(remaining, Math.max(0, n)); if (dt > 0) advancePots(dt); remaining -= dt; };
  if (!s.felixHired) { advance(remaining); return result; }
  for (const [id, n] of Object.entries(s.felixBag)) add(s.felixCrate, id, n);
  s.felixBag = {};
  const flush = () => { const stored = flushFelixHarvest(s); result.buds += stored.buds; result.cut += stored.cut; };
  flush();
  const readyIndexes = () => s.pots.flatMap((p, index) => p.phase === "ready" && p.byFelix ? [index] : []);
  const harvest = () => {
    for (const index of readyIndexes()) { s.felixPot = index; cut(s, result, random); if (bagCount(s.felixHarvest) >= FELIX_BUD_CAP) flush(); }
    flush();
  };
  const plantCycle = (cycle: Cycle) => {
    cycle.indexes.forEach((index, i) => {
      const seed = cycle.seeds[i], fert = cycle.ferts[i], p = s.pots[index];
      if (p.phase !== "empty" || !slotOpen(s, index) || !take(s.felixCrate, seed, 1)) return;
      if (fert) take(s.felixCrate, fert, 1);
      const total = strainGrowBase(seed);
      Object.assign(p, emptyPot(index), { seed, fert, phase: "sprout", total, timeLeft: total, byFelix: true, eddiBoost: false });
      delete p.careBest; delete p.careRewardHits;
      result.planted++;
    });
    s.quest.q7_grow = true; s.quests.q7_grow = "done";
  };
  let wait = 0;
  for (const p of s.pots) if (p.byFelix && p.phase !== "empty" && p.phase !== "ready") wait = Math.max(wait, growRemaining(s, p));
  advance(wait);
  const initialReady = readyIndexes();
  if (initialReady.length) { advance(harvestTime(s, initialReady)); harvest(); }
  for (let round = 0; remaining > 0 && round < 8000; round++) {
    const cycle = peekCycle(s);
    if (!cycle || cycle.total <= 0 || remaining + 1e-6 < cycle.total) break;
    advance(cycle.plantT); plantCycle(cycle); advance(cycle.growT); advance(cycle.harvestT); harvest();
  }
  if (remaining >= 1) {
    const cycle = peekCycle(s);
    if (cycle) {
      advance(cycle.plantT); plantCycle(cycle);
      if (remaining > 0) advance(cycle.growT);
      if (remaining > 0 && readyIndexes().length) { advance(harvestTime(s, readyIndexes())); harvest(); }
    }
  }
  advance(remaining); snapCage(s);
  result.changed = result.planted > 0 || result.harvested > 0 || result.buds > 0 || result.cut > 0;
  return result;
}
