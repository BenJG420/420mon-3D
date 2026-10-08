/** 420 Erfolge. Keine Ostereier — nur Dinge, die man in Lowtown wirklich tut. */

import { DEX, DEX_ORDER, LEGENDARY_IDS, speciesById } from "./dex";
import { itemName, MAP_UNIQUE, STRAINS, UNIQUE_FIND } from "./items";
import { windowLabel, legendByMon } from "./legend";
import { DISTRICTS } from "./zones";

export type AchChap = "Start" | "Kampf" | "Dex" | "Straßen" | "Grow" | "Kohle" | "Geheim";

export type AchDef = {
  id: string;
  name: string;
  hint: string;
  tip: string;
  chap: AchChap;
  price: number;
  secret?: boolean;
};

export type AchSnap = {
  caught?: string[];
  seen?: string[];
  visitedMaps?: string[];
  deadWild?: string[];
  quests?: Record<string, string>;
  stats?: {
    battlesWon?: number;
    monsCaught?: number;
    binsSearched?: number;
    budsSold?: number;
    plantsHarvested?: number;
    goldEarned?: number;
    steps?: number;
    nudeSeconds?: number;
    sexEvents?: number;
    chipsUsed?: number;
  };
  trainerLv?: number;
  party?: { id?: string; level?: number; ivs?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number } }[];
  box?: { id?: string; level?: number; ivs?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number } }[];
  gold?: number;
  potsUnlocked?: number;
  boxesUnlocked?: number;
  harvestedSeeds?: string[];
  catchPerm?: number;
  stickFound?: boolean;
  flagLowtown?: boolean;
  leftCapsuleNude?: boolean;
  felixHired?: boolean;
  eddiIn?: boolean;
  schnittTitle?: boolean;
  starterId?: string;
  playtime?: number;
  foundLoot?: string[];
  worn?: string[];
  outfit?: string;
  budsSoldToSilk?: number;
};

type Test = (s: AchSnap) => boolean;
type Built = AchDef & { ok: Test };

const TESTS = new Map<string, Test>();

function owns(s: AchSnap, id: string): boolean {
  if (s.caught?.includes(id)) return true;
  if (s.party?.some((p) => p.id === id)) return true;
  return !!s.box?.some((p) => p.id === id);
}

function seen(s: AchSnap, id: string): boolean {
  return !!s.seen?.includes(id) || owns(s, id);
}

function caughtN(s: AchSnap): number {
  const ids = new Set<string>();
  for (const id of s.caught ?? []) ids.add(id);
  for (const p of s.party ?? []) if (p.id) ids.add(p.id);
  for (const p of s.box ?? []) if (p.id) ids.add(p.id);
  return ids.size;
}

function access(s: AchSnap): number {
  let lv = s.trainerLv ?? 1;
  for (const p of s.party ?? []) lv = Math.max(lv, p.level ?? 1);
  return lv;
}

function bestLv(s: AchSnap): number {
  let lv = 0;
  for (const p of [...(s.party ?? []), ...(s.box ?? [])]) lv = Math.max(lv, p.level ?? 0);
  return lv;
}

function ivOf(p: { ivs?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number } }): number {
  const iv = p.ivs;
  if (!iv) return 0;
  return Math.round((iv.hp + iv.atk + iv.def + iv.spa + iv.spd + iv.spe) / 6);
}

function bestIv(s: AchSnap): number {
  let n = 0;
  for (const p of [...(s.party ?? []), ...(s.box ?? [])]) n = Math.max(n, ivOf(p));
  return n;
}

function stat(s: AchSnap, k: keyof NonNullable<AchSnap["stats"]>): number {
  return s.stats?.[k] ?? 0;
}

function visited(s: AchSnap, id: string): boolean {
  return !!s.visitedMaps?.includes(id);
}

function quest(s: AchSnap, id: string): boolean {
  return s.quests?.[id] === "done";
}

function questsDone(s: AchSnap): number {
  let n = 0;
  for (const v of Object.values(s.quests ?? {})) if (v === "done") n += 1;
  return n;
}

function distName(id: string): string {
  return DISTRICTS.find((d) => d.id === id || d.map === id)?.name ?? id;
}

const REAL = DEX_ORDER.filter((id) => {
  const sp = DEX[id];
  return !!sp && !sp.legendary && !sp.blurb.startsWith("Nachzügler");
});

const BY_DIST = new Map<string, string[]>();
for (const id of REAL) {
  const d = DEX[id]?.district;
  if (!d) continue;
  const list = BY_DIST.get(d) ?? [];
  list.push(id);
  BY_DIST.set(d, list);
}

function inDist(s: AchSnap, dist: string): number {
  const pool = BY_DIST.get(dist) ?? [];
  let n = 0;
  for (const id of pool) if (owns(s, id)) n += 1;
  return n;
}

const LOOT_WHERE: Record<string, string> = {};
for (const [map, ids] of Object.entries(MAP_UNIQUE)) {
  const name = distName(map);
  for (const id of ids) LOOT_WHERE[id] = name;
}

const TRAINERS = ["cinder", "tide", "vial", "knuckle", "hush", "glow", "coil"];
const LOWTOWN_Q = ["q1_bolt", "q2_harvest", "q3_trash", "q4_fight", "q5_silk", "q6_nude", "q7_grow", "q8_mattress", "q9_static", "q10_lowtown"];

function build(): Built[] {
  const out: Built[] = [];
  const ids = new Set<string>();
  const add = (a: Omit<Built, "price" | "chap"> & { price?: number; chap?: AchChap }) => {
    if (ids.has(a.id) || out.length >= 420) return;
    ids.add(a.id);
    const secret = !!a.secret;
    const row: Built = {
      id: a.id,
      name: a.name,
      hint: a.hint,
      tip: a.tip,
      secret,
      chap: secret ? "Geheim" : (a.chap ?? "Start"),
      price: a.price ?? (secret ? 75 : a.chap === "Start" ? 24 : 32),
      ok: a.ok,
    };
    out.push(row);
    TESTS.set(a.id, a.ok);
  };

  add({ id: "first_step", name: "Barfuß in Lowtown", chap: "Start", hint: "Die Tür der Kapsel ist kein Schloss.", tip: "Links aus der Kapsel in die Gasse. Oder in den Keller. Hauptsache raus.", ok: (s) => (s.visitedMaps ?? []).some((m) => m !== "capsule") });
  add({ id: "first_fight", name: "Erste Beule", chap: "Kampf", hint: "Einer muss liegen bleiben.", tip: "Ein Kampf gewinnen. Wild auf der Straße oder ein Trainer. Flucht zählt nicht.", ok: (s) => stat(s, "battlesWon") >= 1 });
  add({ id: "fight_10", name: "Gassenprügel", chap: "Kampf", hint: "Zehnmal nicht verlieren.", tip: "Zehn Siege. Niederlagen zählen nicht. Trainer und Wild schon.", ok: (s) => stat(s, "battlesWon") >= 10 });
  add({ id: "catch_1", name: "Erster Chip", chap: "Dex", hint: "Wirf Metall. Hoffe auf Klick.", tip: "Ein Monster fangen. Chip im Kampf, nicht nur besiegen.", ok: (s) => stat(s, "monsCaught") >= 1 || caughtN(s) >= 1 });
  add({ id: "catch_12", name: "Erste Zwölf", chap: "Dex", hint: "Zwölf Namen im Dex. Der Rest der Stadt wartet.", tip: "Zwölf verschiedene Arten besitzen. Party und Box zählen.", ok: (s) => caughtN(s) >= 12 });
  add({ id: "catch_50", name: "Halbe Gasse", chap: "Dex", hint: "Fünfzig Arten. Lowtown wird voll.", tip: "Fünfzig verschiedene Arten. Nicht fünfzig Kämpfe.", ok: (s) => caughtN(s) >= 50 });
  add({ id: "catch_100", name: "Hundert Fäden", chap: "Dex", hint: "Hundert Namen. Die Stadt merkt sich dich.", tip: "Hundert verschiedene Arten im Dex, gefangen.", ok: (s) => caughtN(s) >= 100 });
  add({ id: "catch_420", name: "Dex voll", chap: "Dex", hint: "Alle 420. Lowtown hat keine leere Seite mehr.", tip: "Jede Art im Dex einmal besitzen. Legendäre eingeschlossen.", price: 90, ok: (s) => caughtN(s) >= DEX_ORDER.length });
  add({ id: "legend_1", name: "Erster König", chap: "Dex", secret: true, hint: "Ein Legendäres. Werte 95–100, keine Würfel.", tip: "Ein Legendäres fangen. Es steht nur im Zeitfenster seines Kiezes auf der Straße.", ok: (s) => LEGENDARY_IDS.some((id) => owns(s, id)) });
  add({ id: "legend_10", name: "Zehn Kronen", chap: "Dex", secret: true, hint: "Jedes Viertel hat eins. Alle zehn.", tip: "Alle zehn Legendären fangen. Jedes hat einen Wochentag und ein Uhrfenster.", ok: (s) => LEGENDARY_IDS.every((id) => owns(s, id)) });
  add({ id: "lv_50", name: "Fünfzig", chap: "Kampf", hint: "Trainer oder Partner Lv.50. Die Stadt wird steiler.", tip: "Trainer-Level oder ein Monster auf 50. Kämpfe geben XP.", ok: (s) => access(s) >= 50 });
  add({ id: "lv_100", name: "Hundert", chap: "Kampf", hint: "Lv.100. Lowtown zählt mit.", tip: "Trainer oder stärkstes Monster auf 100.", ok: (s) => access(s) >= 100 });
  add({ id: "lv_420", name: "420", chap: "Kampf", secret: true, hint: "Max. Mehr Level gibt es nicht.", tip: "Trainer-Level oder ein Partner auf 420. Das ist die Decke.", ok: (s) => access(s) >= 420 });
  add({ id: "bin_1", name: "Mülltaucher", chap: "Kohle", hint: "Deckel auf. Hände rein.", tip: "Eine Tonne, ein Fass oder eine Kiste durchsuchen.", ok: (s) => stat(s, "binsSearched") >= 1 });
  add({ id: "bin_50", name: "Tonne-süchtig", chap: "Kohle", hint: "Fünfzigmal im Dreck. Die Stadt zählt mit.", tip: "Fünfzig Behälter durchsuchen. Nach dem Timeout geht derselbe wieder.", ok: (s) => stat(s, "binsSearched") >= 50 });
  add({ id: "harvest_1", name: "Erster Schnitt", chap: "Grow", hint: "Wenn der Topf duftet, nicht warten.", tip: "Eine Pflanze in der Kapsel ernten. Samen rein, warten, schneiden.", ok: (s) => stat(s, "plantsHarvested") >= 1 });
  add({ id: "harvest_25", name: "Gärtner von Lowtown", chap: "Grow", hint: "Fünfundzwanzig Ernten. Die Töpfe kennen dich.", tip: "25 Ernten. Schlaf auf der Matte zieht Zeit ab.", ok: (s) => stat(s, "plantsHarvested") >= 25 });
  add({ id: "sold_100", name: "Kleiner Dealer", chap: "Kohle", hint: "Hundert Beutel raus. Silk lächelt dann.", tip: "100 Buds verkaufen. Silk am Markt zahlt besser als der Kapsel-PC.", ok: (s) => stat(s, "budsSold") >= 100 });
  add({ id: "gold_1000", name: "Softcash-Stapel", chap: "Kohle", hint: "Tausend Münzen. Egal woher.", tip: "1000 Softcash insgesamt verdient, nicht auf einmal in der Tasche.", ok: (s) => stat(s, "goldEarned") >= 1000 });
  add({ id: "nude_start", name: "Wie geboren", chap: "Start", secret: true, hint: "Die Tüte bleibt. Die Tür nicht.", tip: "Die Kapsel nackt verlassen. Tüte aus, dann durch die Tür.", ok: (s) => !!s.leftCapsuleNude });
  add({ id: "nude_walk", name: "Lange Schicht", chap: "Start", secret: true, hint: "Ein langer Gang. Nichts sitzt. Die Stadt zählt.", tip: "Zehn Minuten Spielzeit nackt laufen. Die Tüte ausziehen und draußen bleiben.", ok: (s) => stat(s, "nudeSeconds") >= 600 });
  add({ id: "bag_life", name: "Tüten-Chic", chap: "Start", hint: "Müll kann sitzen wie ein Mantel.", tip: "Die Mülltüte anziehen. Liegt am Start im Inventar. Taste Tüte.", ok: (s) => s.outfit === "wear_trashbag" || s.outfit === "bag" || (s.worn ?? []).includes("wear_trashbag") });
  add({ id: "silk_deal", name: "Silk's Test", chap: "Kohle", hint: "Nicht Ordinary. Silk kennt den Unterschied.", tip: "Silk einen Bud verkaufen, der nicht Ordinary ist. Better, Kush, Haze, alles darüber.", ok: () => false });
  add({ id: "silk_stick", name: "Kalibriert", chap: "Kohle", hint: "Silk-Stick vom Markt. Danach beißen Chips dauerhaft härter.", tip: "Den Silk-Stick kaufen. Markt, Silk, wenn sie dich ranlässt. Der liegt nicht in der Tonne.", ok: (s) => (s.catchPerm ?? 1) > 1 });
  add({ id: "bolt_out", name: "Durchlass", chap: "Straßen", hint: "Bolt will Metall. Dann geht die Tür.", tip: "Bolt in der Gasse einen Junk-Chip geben. Danach gehen die Straßentore.", ok: (s) => quest(s, "q1_bolt") });
  add({ id: "lowtown_all", name: "Lowtown durch", chap: "Straßen", hint: "Zehn Fäden. Alle zuziehen.", tip: "Die zehn alten Fäden schließen: Bolt, Ernte, Müll, Kampf, Silk, Nackt, Grow, Matratze, Static, Lowtown.", ok: (s) => !!s.flagLowtown || LOWTOWN_Q.every((id) => quest(s, id)) });
  add({ id: "sex_1", name: "Erste Nische", chap: "Straßen", hint: "Mira zeigt auf eine Matratze. Der Rest ist Atem.", tip: "Eine Matratze benutzen. Die Nischen und ein paar Höfe haben welche.", ok: (s) => stat(s, "sexEvents") >= 1 });
  add({ id: "hack_1", name: "Static's Stick", chap: "Straßen", hint: "Warm aus der Tonne. Kalt in Statics Hand.", tip: "Static den Stick bringen, den du aus dem Müll ziehst. Sein Laden sitzt am Markt.", ok: (s) => quest(s, "q9_static") });
  add({ id: "kiez_3", name: "Drei Kieze", chap: "Straßen", hint: "Gasse, Hinterhof, Keller. Lowtown hat Schichten.", tip: "Gasse, Grow-Hinterhof und Kabelkeller einmal betreten.", ok: (s) => ["alley", "yard", "cable"].every((id) => visited(s, id)) });
  add({ id: "kiez_10", name: "Zehn Kieze", chap: "Straßen", hint: "Jeder Typ hat eine Straße. Alle einmal betreten.", tip: "Jeden Kiez mit eigener Karte einmal betreten. Gulli zählt als Weg, nicht als Ersatz.", ok: (s) => DISTRICTS.every((d) => !d.map || visited(s, d.map)) });
  add({ id: "trainer_7", name: "Sieben Schläge", chap: "Kampf", hint: "Jeder neue Kiez hat jemanden, der schlägt. Alle sieben.", tip: "Die sieben Kiez-Trainer schlagen: Cinder, Tide, Vial, Knuckle, Hush, Glow, Coil.", ok: (s) => TRAINERS.every((id) => (s.deadWild ?? []).includes(id)) });
  add({ id: "kiez_loot", name: "Kiez-Kram", chap: "Kohle", hint: "Jedes Viertel hortet was. Nicht im Shop. Alles finden.", tip: "Jeden Kiez-Fund einmal aus einem Behälter ziehen. Shops verkaufen den Kram nicht.", ok: (s) => UNIQUE_FIND.every((id) => (s.foundLoot ?? []).includes(id)) });
  add({ id: "pots_full", name: "Sechs Töpfe", chap: "Grow", hint: "Grow-Shop am Markt. Alle Töpfe offen.", tip: "Alle sechs Töpfe freikaufen. Grow-Stand am Markt.", ok: (s) => (s.potsUnlocked ?? 2) >= 6 });
  add({ id: "strain_5", name: "Fünf Cuts", chap: "Grow", hint: "Fünf verschiedene Sorten geerntet. Indica, Sativa, Hybrid.", tip: "Fünf verschiedene Samen einmal durchziehen und ernten.", ok: (s) => new Set(s.harvestedSeeds ?? []).size >= 5 });

  const caughtMarks = [2, 3, 5, 8, 15, 20, 25, 35, 40, 60, 75, 90, 120, 150, 180, 220, 260, 300, 340, 380];
  for (const n of caughtMarks) {
    add({
      id: `catch_n_${n}`,
      name: n >= 300 ? `${n} Namen` : `${n} im Glas`,
      chap: "Dex",
      secret: n >= 300,
      hint: n >= 300 ? "Der Dex wird schwer." : `${n} verschiedene Arten. Gesehen reicht nicht.`,
      tip: `${n} verschiedene Monster fangen. Duplikate zählen nicht.`,
      ok: (s) => caughtN(s) >= n,
    });
  }

  for (const n of [10, 25, 40, 70, 100, 140, 180, 220, 280, 340, 400]) {
    add({
      id: `seen_n_${n}`,
      name: `${n} Gesichter`,
      chap: "Dex",
      hint: "Sehen reicht. Fangen kommt später.",
      tip: `${n} verschiedene Arten im Dex gesehen. Ein Kampf oder ein ? auf der Straße zählt.`,
      ok: (s) => new Set([...(s.seen ?? []), ...(s.caught ?? [])]).size >= n,
    });
  }

  for (const [dist, pool] of BY_DIST) {
    const name = distName(dist);
    if (!pool.length) continue;
    add({
      id: `dist_${dist}_1`,
      name: `${name}: erster Fang`,
      chap: "Straßen",
      hint: `Ein Monster aus ${name}.`,
      tip: `In ${name} ein wildes Monster dieser Straße fangen. Nicht irgendeins aus der Box.`,
      ok: (s) => inDist(s, dist) >= 1,
    });
    if (pool.length >= 5) {
      add({
        id: `dist_${dist}_5`,
        name: `${name}: fünf`,
        chap: "Straßen",
        hint: `Fünf Arten aus ${name}.`,
        tip: `Fünf verschiedene Arten fangen, die in ${name} stehen.`,
        ok: (s) => inDist(s, dist) >= 5,
      });
    }
    add({
      id: `dist_${dist}_all`,
      name: `${name} leer`,
      chap: "Straßen",
      secret: true,
      hint: "Der Kiez hat keine gewöhnliche Lücke mehr.",
      tip: `Alle gewöhnlichen Arten aus ${name} fangen. Legendäre zählen nicht mit.`,
      ok: (s) => inDist(s, dist) >= pool.length,
    });
  }

  for (const id of LEGENDARY_IDS) {
    const sp = speciesById(id);
    const w = legendByMon(id);
    add({
      id: `crown_${id}`,
      name: sp.name,
      secret: true,
      hint: "Ein König. Nicht dauernd draußen.",
      tip: w ? `${sp.name} fangen. Fenster: ${windowLabel(w)}. Kiez: ${distName(w.district)}.` : `${sp.name} fangen, wenn es auf der Straße steht.`,
      ok: (s) => owns(s, id),
    });
  }

  for (const n of [5, 10, 15, 20, 25, 30, 40, 60, 75, 90, 120, 150, 180, 200, 250, 300, 350, 400]) {
    add({
      id: `lv_n_${n}`,
      name: `Stufe ${n}`,
      chap: "Kampf",
      secret: n >= 250,
      hint: "Trainer oder Partner. Die Straße wird steiler.",
      tip: `Trainer-Level oder ein Monster auf ${n} bringen. Kämpfe, nicht der Shop.`,
      ok: (s) => access(s) >= n,
    });
  }

  for (const n of [8, 16, 24, 32, 40, 70, 140, 180, 250]) {
    add({
      id: `mon_lv_${n}`,
      name: `Partner ${n}`,
      chap: "Kampf",
      secret: n >= 250,
      hint: "Ein Monster, nicht du.",
      tip: `Ein Monster in Party oder Box auf Level ${n}.`,
      ok: (s) => bestLv(s) >= n,
    });
  }

  for (const n of [1, 3, 5, 25, 40, 60, 75, 100, 150, 200, 250, 300, 420]) {
    add({
      id: `win_${n}`,
      name: n === 1 ? "Erster Sieg" : `${n} Siege`,
      chap: "Kampf",
      secret: n >= 300,
      hint: "Gewinnen. Liegenbleiben zählt nicht.",
      tip: `${n} Kämpfe gewinnen.`,
      ok: (s) => stat(s, "battlesWon") >= n,
    });
  }

  for (const n of [5, 15, 30, 60, 160, 250, 400]) {
    add({
      id: `chips_${n}`,
      name: `${n} Klicks`,
      chap: "Dex",
      hint: "Chips, die sitzen. Nicht Würfe ins Leere.",
      tip: `${n} erfolgreiche Fänge insgesamt. Dieselbe Art mehrmals zählt.`,
      ok: (s) => stat(s, "monsCaught") >= n,
    });
  }

  for (const n of [5, 10, 20, 30, 40, 75, 100, 150, 250]) {
    add({
      id: `bin_n_${n}`,
      name: `${n} Deckel`,
      chap: "Kohle",
      secret: n >= 250,
      hint: "Müll, Fässer, Kisten.",
      tip: `${n} Behälter durchsuchen.`,
      ok: (s) => stat(s, "binsSearched") >= n,
    });
  }

  for (const n of [3, 8, 12, 20, 40, 60, 80, 120]) {
    add({
      id: `cut_${n}`,
      name: `${n} Schnitte`,
      chap: "Grow",
      secret: n >= 80,
      hint: "Töpfe in der Kapsel.",
      tip: `${n} Pflanzen ernten.`,
      ok: (s) => stat(s, "plantsHarvested") >= n,
    });
  }

  for (const n of [1, 5, 15, 30, 60, 150, 250, 400]) {
    add({
      id: `sold_n_${n}`,
      name: n === 1 ? "Erster Beutel" : `${n} Beutel`,
      chap: "Kohle",
      hint: "Buds raus, Münzen rein.",
      tip: `${n} Buds verkaufen. Silk oder der PC.`,
      ok: (s) => stat(s, "budsSold") >= n,
    });
  }

  for (const n of [100, 400, 800, 2000, 4000, 8000, 20000, 50000, 100000]) {
    add({
      id: `earn_${n}`,
      name: n >= 1000 ? `${Math.round(n / 1000)}k verdient` : `${n} verdient`,
      chap: "Kohle",
      secret: n >= 50000,
      hint: "Was reinkam. Nicht was noch in der Tasche liegt.",
      tip: `${n} Softcash insgesamt verdienen. Ausgeben löscht den Zähler nicht.`,
      ok: (s) => stat(s, "goldEarned") >= n,
    });
  }

  for (const n of [100, 400, 800, 1500, 3000, 6000, 12000, 25000, 50000]) {
    add({
      id: `steps_${n}`,
      name: n >= 1000 ? `${Math.round(n / 1000)}k Schritte` : `${n} Schritte`,
      chap: "Start",
      secret: n >= 25000,
      hint: "Laufen. Die Stadt ist groß.",
      tip: `${n} Schritte laufen. Stehenbleiben zählt nicht.`,
      ok: (s) => stat(s, "steps") >= n,
    });
  }

  for (const min of [5, 15, 30, 60, 120, 240, 480]) {
    add({
      id: `time_${min}`,
      name: min >= 60 ? `${Math.round(min / 60)} Stunden` : `${min} Minuten`,
      chap: "Start",
      secret: min >= 240,
      hint: "Zeit in Lowtown. Nicht an der Uhr draußen.",
      tip: `${min} Minuten Spielzeit. Pause und Menü zählen mit, solange das Spiel läuft.`,
      ok: (s) => (s.playtime ?? 0) >= min * 60,
    });
  }

  const visits: [string, string, string][] = [
    ["market", "Wochenmarkt", "Den Markt betreten. Ab der passenden Stufe durch Bolts Tor oder den Gulli."],
    ["kino", "Vorstellung", "Das Kino am Markt betreten."],
    ["studio", "Rajkos Keller", "Aus der Kapsel links in den Keller."],
    ["sewer", "Unter der Platte", "Eine Luke in den Kanal. Geht ohne Bolt."],
    ["yard", "Hinter dem Gitter", "Die Grow-Hinterhöfe betreten."],
    ["drain", "Abfluss", "Den Abfluss betreten."],
    ["ash", "Asche", "Den Aschegang betreten."],
    ["chem", "Sud", "Die Chemiegasse betreten."],
    ["cable", "Port", "Den Kabelkeller betreten."],
    ["ring", "Käfig", "Den Ring betreten."],
    ["nische", "Vorhang", "Die Sex-Nischen betreten."],
    ["labyrinth", "Schatten", "Das Labyrinth betreten."],
    ["scrap", "Schrott", "Das Schrotttor betreten."],
    ["den_mira", "Miras Tür", "Miras Wohnung betreten. Tür in der Fassade."],
    ["den_raze", "Razes Tür", "Razes Bude betreten."],
    ["den_static", "Statics Hinterzimmer", "Statics Hinterzimmer betreten."],
    ["den_silk", "Hinter Silk", "Silks Hinterzimmer betreten."],
    ["den_cherry", "Cherry", "Cherrys Zimmer betreten."],
    ["den_moss", "Moss", "Moss' Raum betreten."],
  ];
  for (const [id, name, tip] of visits) {
    add({
      id: `visit_${id}`,
      name,
      chap: "Straßen",
      hint: "Einmal da gewesen reicht.",
      tip,
      ok: (s) => visited(s, id),
    });
  }

  for (const n of [1, 3, 8, 12, 16]) {
    add({
      id: `faden_${n}`,
      name: n === 1 ? "Erster Faden" : `${n} Fäden`,
      chap: "Straßen",
      hint: "Quests. Die Tafel lügt nicht.",
      tip: `${n} Quests abschließen.`,
      ok: (s) => questsDone(s) >= n,
    });
  }

  for (const n of [2, 3, 4, 5, 6]) {
    add({
      id: `party_${n}`,
      name: `Party ${n}`,
      chap: "Dex",
      hint: "Plätze neben dem ersten.",
      tip: `${n} Monster gleichzeitig in der Party. Maximum ist 6, der Rest in die Box.`,
      ok: (s) => (s.party?.length ?? 0) >= n,
    });
  }

  for (const n of [1, 4, 8, 12, 20]) {
    add({
      id: `box_${n}`,
      name: n === 1 ? "Erste Box" : `Box ${n}`,
      chap: "Dex",
      hint: "Was nicht mitläuft, liegt hinten.",
      tip: `${n} Monster in der Box haben.`,
      ok: (s) => (s.box?.length ?? 0) >= n,
    });
  }

  for (const n of [3, 4, 5]) {
    add({
      id: `pot_${n}`,
      name: `${n} Töpfe`,
      chap: "Grow",
      hint: "Grow-Shop. Münzen auf den Tresen.",
      tip: `${n} Töpfe freischalten. Stand am Markt.`,
      ok: (s) => (s.potsUnlocked ?? 2) >= n,
    });
  }

  for (const n of [1, 2, 3]) {
    add({
      id: `gbox_${n}`,
      name: n === 1 ? "Erste Growbox" : `${n} Growboxen`,
      chap: "Grow",
      hint: "Die großen Kästen. Auch am Markt.",
      tip: `${n} Growboxen kaufen.`,
      ok: (s) => (s.boxesUnlocked ?? 0) >= n,
    });
  }

  for (const n of [60, 75, 85, 95]) {
    add({
      id: `wert_${n}`,
      name: `Wert ${n}`,
      chap: "Dex",
      secret: n >= 85,
      hint: "Die Zahlen unter dem Level. Nicht das Level.",
      tip: `Ein Monster mit Wert ${n} oder höher besitzen. Wert ist der Schnitt der sechs Anlagen. Fangen und hoffen, nicht trainieren.`,
      ok: (s) => bestIv(s) >= n,
    });
  }

  for (const n of [1, 3, 8, 15, 30, 60]) {
    add({
      id: `throw_${n}`,
      name: n === 1 ? "Erster Wurf" : `${n} Würfe`,
      chap: "Dex",
      hint: "Chips aus der Tasche, nicht nur im Regal.",
      tip: `${n} Chips im Kampf benutzen. Treffer und Nieten zählen beide.`,
      ok: (s) => stat(s, "chipsUsed") >= n,
    });
  }

  for (const n of [2, 4, 8]) {
    add({
      id: `mat_${n}`,
      name: `${n} Matratzen`,
      chap: "Straßen",
      hint: "Nicht die in der Kapsel.",
      tip: `${n} Mal eine Matratze draußen benutzen.`,
      ok: (s) => stat(s, "sexEvents") >= n,
    });
  }

  for (const n of [2, 3, 8, 12, STRAINS.length]) {
    add({
      id: `cuts_${n}`,
      name: n === STRAINS.length ? "Alle Sorten" : `${n} Sorten`,
      chap: "Grow",
      secret: n >= 12,
      hint: "Verschiedene Samen, nicht dieselbe Ernte fünfmal.",
      tip: n === STRAINS.length ? "Jede Sorte einmal ernten. Samen kaufen oder finden, Topf, warten, Schnitt." : `${n} verschiedene Samen-Sorten ernten.`,
      ok: (s) => new Set(s.harvestedSeeds ?? []).size >= n,
    });
  }

  for (const st of STRAINS) {
    const seed = `seed_${st.id}`;
    add({
      id: `strain_${st.id}`,
      name: st.seedName,
      chap: "Grow",
      hint: "Eine Sorte bis zum Schnitt.",
      tip: `${st.seedName} anbauen und ernten. ${st.seedDesc}`,
      ok: (s) => (s.harvestedSeeds ?? []).includes(seed),
    });
  }

  for (const id of UNIQUE_FIND) {
    const where = id === "bud_moss" ? "Hinterhof, aus dem Schnitt" : (LOOT_WHERE[id] ?? "ein Kiez");
    add({
      id: `loot_${id}`,
      name: itemName(id),
      secret: true,
      hint: "Liegt nicht im Regal.",
      tip: id === "bud_moss" ? "Moss-Bud ernten oder finden. Silk kauft ihn, der Shop verkauft ihn nicht." : `${itemName(id)} in ${where} aus einem Behälter ziehen.`,
      ok: (s) => (s.foundLoot ?? []).includes(id),
    });
  }

  for (const id of ["wear_collar", "wear_hoodie", "wear_jacket", "wear_track", "wear_rain", "wear_overalls", "wear_coat", "wear_vest"]) {
    add({
      id: `fit_${id}`,
      name: itemName(id),
      chap: "Start",
      hint: "Anziehen. Die Tüte ist nicht alles.",
      tip: `${itemName(id)} anziehen. Kaufen am Markt oder finden, dann im Inventar benutzen.`,
      ok: (s) => s.outfit === id || (s.worn ?? []).includes(id),
    });
  }

  add({ id: "starter_open", name: "Koffer auf", chap: "Start", hint: "Neben der Matte surrt eine Kiste.", tip: "In der Kapsel den Koffer öffnen und einen Partner nehmen.", ok: (s) => !!s.starterId });
  add({ id: "felix_hire", name: "Felix bleibt", chap: "Start", secret: true, hint: "Jemand will Arbeit.", tip: "Felix in der Gasse anheuern. Er steht nah an der Kapsel.", ok: (s) => !!s.felixHired });
  add({ id: "eddi_home", name: "Eddi drin", chap: "Start", secret: true, hint: "Die Kapsel wird enger.", tip: "Eddi in die Kapsel holen. Erst draußen treffen, dann mitnehmen.", ok: (s) => !!s.eddiIn });
  add({ id: "schnitt_on", name: "Züchter", chap: "Grow", secret: true, hint: "Ein Titel, kein Samen.", tip: "Den Züchter-Titel kaufen. Eddi verkauft ihn, wenn du weit genug bist.", ok: (s) => !!s.schnittTitle });
  add({ id: "pocket_2k", name: "Taschen voll", chap: "Kohle", hint: "Münzen, die du noch nicht ausgegeben hast.", tip: "2000 Softcash auf einmal besitzen.", ok: (s) => (s.gold ?? 0) >= 2000 });
  add({ id: "pocket_10k", name: "Bündel", chap: "Kohle", secret: true, hint: "Viel auf einmal. Nicht über die Jahre.", tip: "10.000 Softcash gleichzeitig in der Tasche haben.", ok: (s) => (s.gold ?? 0) >= 10000 });

  for (const id of REAL) {
    if (out.length >= 420) break;
    const sp = DEX[id];
    if (!sp) continue;
    add({
      id: `see_${id}`,
      name: `Gesehen: ${sp.name}`,
      chap: "Dex",
      hint: "Ein neues Gesicht. Fangen muss nicht sein.",
      tip: `${sp.name} sehen. ${sp.where}`,
      ok: (s) => seen(s, id),
    });
  }

  if (out.length !== 420) {
    throw new Error(`Erfolge ${out.length}, sollen 420 sein`);
  }
  return out;
}

const BUILT = build();

export const ACH_DEFS: AchDef[] = BUILT.map(({ ok: _ok, ...def }) => def);

export const ACH_CHAPS: AchChap[] = ["Start", "Kampf", "Dex", "Straßen", "Grow", "Kohle", "Geheim"];

export function achMet(s: AchSnap, id: string): boolean {
  return TESTS.get(id)?.(s) ?? false;
}
