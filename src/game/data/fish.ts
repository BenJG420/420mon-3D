import { ITEMS, smokeLine, type ItemDef } from "./items";

/** Eigene Karte. Kein Dex-Eintrag. */
export const FISH_AREA = "kai";
export const FISH_WHERE = "Neonkai";

export type FishRarity = "gewöhnlich" | "zäh" | "selten" | "bissig";
export type FishDress = "joint" | "drip" | "spark" | "flame" | "blush" | "visor";

export type FishDef = {
  id: string;
  name: string;
  blurb: string;
  rarity: FishRarity;
  /** Anteil des Rads, der trifft. Kleiner = schwerer. */
  zone: number;
  weight: number;
  /** Softcash beim letzten Treffer, vor Boni. */
  payout: number;
  area: typeof FISH_AREA;
  where: typeof FISH_WHERE;
  /** Silhouette aus dem Monster-Haut-Satz. */
  skin: string;
  main: string;
  acc: string;
  dress: FishDress;
};

const RARITY: Record<FishRarity, { zone: number; weight: number; payout: number }> = {
  gewöhnlich: { zone: 0.3, weight: 10, payout: 8 },
  zäh: { zone: 0.2, weight: 5, payout: 16 },
  selten: { zone: 0.12, weight: 2, payout: 28 },
  bissig: { zone: 0.07, weight: 1, payout: 48 },
};

type FishLook = { skin: string; main: string; acc: string; dress: FishDress };

const LOOK: Record<string, FishLook> = {
  neonbrasse: { skin: "fish", main: "#2f8a3a", acc: "#d6f5a4", dress: "drip" },
  gossenbarsch: { skin: "toad", main: "#4a5a28", acc: "#c4a35a", dress: "drip" },
  oelschleie: { skin: "slug", main: "#6a4a22", acc: "#e2c074", dress: "joint" },
  kippenaal: { skin: "eel", main: "#c4a574", acc: "#ff6a2a", dress: "flame" },
  rostbarbe: { skin: "fish", main: "#b89a3e", acc: "#fff0b4", dress: "drip" },
  sudkarpfen: { skin: "plant", main: "#8a9a28", acc: "#e7f2a8", dress: "joint" },
  pfuetzenploetze: { skin: "ling", main: "#3d9a4a", acc: "#9ad4c8", dress: "drip" },
  kanalgrundel: { skin: "fish", main: "#1f6a4a", acc: "#39ffb0", dress: "drip" },
  schlickbutt: { skin: "plant", main: "#d8c8a0", acc: "#3d9a4a", dress: "joint" },
  drahtforelle: { skin: "fish", main: "#39ffb0", acc: "#7af0ff", dress: "spark" },
  siffhecht: { skin: "eel", main: "#4a6a32", acc: "#c6f5a8", dress: "drip" },
  tropfbarsch: { skin: "slime", main: "#c47a22", acc: "#ffe14a", dress: "drip" },
  lache: { skin: "toad", main: "#2a6a48", acc: "#8fd48a", dress: "drip" },
  filterling: { skin: "ling", main: "#2a2e28", acc: "#8a9a72", dress: "joint" },
  glutschuppe: { skin: "hound", main: "#c44a22", acc: "#ffe14a", dress: "flame" },
  chembarbe: { skin: "slime", main: "#c6e020", acc: "#7af0ff", dress: "spark" },
  bitumenbutt: { skin: "fish", main: "#a86a18", acc: "#4a2a10", dress: "joint" },
  reusenaal: { skin: "eel", main: "#2a6a38", acc: "#d0d4c8", dress: "drip" },
  neonhecht: { skin: "fish", main: "#39ffb0", acc: "#ff4ad4", dress: "spark" },
  harzforelle: { skin: "fish", main: "#e07a32", acc: "#6a3a12", dress: "joint" },
  gullylachs: { skin: "eel", main: "#1a3a28", acc: "#6aaa58", dress: "drip" },
  scherbendorsch: { skin: "fish", main: "#9ee7f2", acc: "#f4fffc", dress: "spark" },
  samtflosse: { skin: "fairy", main: "#ff8ad4", acc: "#6a3a8a", dress: "blush" },
  saeurezander: { skin: "slime", main: "#d0f000", acc: "#f4ff6a", dress: "drip" },
  kabelwels: { skin: "plant", main: "#2f6a28", acc: "#c6a15a", dress: "joint" },
  teerbrasse: { skin: "slug", main: "#1c1e18", acc: "#5a6a40", dress: "drip" },
  kronenbarsch: { skin: "plant", main: "#e2c074", acc: "#39ffb0", dress: "joint" },
  glitchlachs: { skin: "ghost", main: "#7a5cff", acc: "#39ffb0", dress: "visor" },
  vialstoer: { skin: "vial", main: "#c6f5a8", acc: "#7a5cff", dress: "joint" },
  ascheaal: { skin: "crow", main: "#6a645c", acc: "#ff6a2a", dress: "flame" },
  pinkflosse: { skin: "fairy", main: "#ff4ad4", acc: "#ffd0ea", dress: "blush" },
  schrotthai: { skin: "spike", main: "#8a9098", acc: "#3faf4e", dress: "joint" },
  rohrforelle: { skin: "eel", main: "#5a6a62", acc: "#3d9a4a", dress: "drip" },
  nullbarsch: { skin: "ghost", main: "#d8dce4", acc: "#39ffb0", dress: "visor" },
  harpunenbutt: { skin: "fish", main: "#e8f6d8", acc: "#f8f4ec", dress: "spark" },
  leuchtzander: { skin: "moth", main: "#ffe14a", acc: "#39ffb0", dress: "spark" },
  slagstoer: { skin: "brute", main: "#5a4030", acc: "#ff6a2a", dress: "flame" },
  noxaal: { skin: "ghost", main: "#2a1848", acc: "#c6a0ff", dress: "visor" },
  rootwels: { skin: "plant", main: "#6a3a22", acc: "#3faf4e", dress: "joint" },
  velvetkarpfen: { skin: "fairy", main: "#6a2048", acc: "#ff8ad4", dress: "blush" },
  kaisermuraene: { skin: "brute", main: "#e2c074", acc: "#1a1c18", dress: "flame" },
  softcashhai: { skin: "fish", main: "#39ffb0", acc: "#ffe14a", dress: "spark" },
};

function fish(id: string, name: string, rarity: FishRarity, blurb: string): FishDef {
  const r = RARITY[rarity];
  const look = LOOK[id];
  if (!look) throw new Error(`Fisch ohne Haut: ${id}`);
  return {
    id: `fish_${id}`,
    name,
    blurb,
    rarity,
    zone: r.zone,
    weight: r.weight,
    payout: r.payout,
    area: FISH_AREA,
    where: FISH_WHERE,
    skin: look.skin,
    main: look.main,
    acc: look.acc,
    dress: look.dress,
  };
}

export const FISH: FishDef[] = [
  fish("neonbrasse", "Kushbrasse", "gewöhnlich", "Fett und grün. Der Kopf klebt am Neon."),
  fish("gossenbarsch", "Gossenkush", "gewöhnlich", "Beißt alles, was harzt."),
  fish("oelschleie", "Hashschleie", "gewöhnlich", "Schmeckt nach Keller, nicht nach Öl."),
  fish("kippenaal", "Jointaal", "gewöhnlich", "Filter im Maul, trotzdem hungrig."),
  fish("rostbarbe", "Kiefbarbe", "gewöhnlich", "Schuppen wie Trichome."),
  fish("sudkarpfen", "Sudbud", "gewöhnlich", "Gelb, langsam, klebt an den Fingern."),
  fish("pfuetzenploetze", "Pfützenpot", "gewöhnlich", "Klein. Lebt in einer Pfütze und meint den Topf ernst."),
  fish("kanalgrundel", "Kanalgrün", "gewöhnlich", "Der Standard unter der Luke."),
  fish("schlickbutt", "Deckblatt", "gewöhnlich", "Platt wie ein Paper."),
  fish("drahtforelle", "Ventiforelle", "gewöhnlich", "Zuckt, wenn der Lüfter mitläuft."),
  fish("siffhecht", "Siffhaze", "gewöhnlich", "Maul wie eine Gosse, Duft wie ein Grow."),
  fish("tropfbarsch", "Tropfharz", "gewöhnlich", "Kommt aus dem Rohr, nicht aus dem Fluss."),
  fish("lache", "Lachekush", "gewöhnlich", "Heißt nach der Pfütze und dem Rausch."),
  fish("filterling", "Kohleling", "gewöhnlich", "Hängt am Filter und lässt nicht los."),
  fish("glutschuppe", "Glutkush", "zäh", "Warm. Gehört nicht ins Wasser."),
  fish("chembarbe", "Chemhaze", "zäh", "Bart aus Kristall."),
  fish("bitumenbutt", "Harzbutt", "zäh", "Klebt an der Rute."),
  fish("reusenaal", "Reusenkush", "zäh", "Kennt den Steg besser als du."),
  fish("neonhecht", "Neonhaze", "zäh", "Sieht dich, bevor du wirfst."),
  fish("harzforelle", "Harzforelle", "zäh", "Riecht nach Grow, nicht nach Bach."),
  fish("gullylachs", "Gullykush", "zäh", "Wandert nur von Luke zu Luke."),
  fish("scherbendorsch", "Bongdorsch", "zäh", "Flosse aus Glas."),
  fish("samtflosse", "Samthaze", "zäh", "Pinklicht auf den Buds."),
  fish("saeurezander", "Säurehaze", "zäh", "Das Wasser wird dünn, wo er steht."),
  fish("kabelwels", "Stielwels", "zäh", "Bart aus Stiel und Litze."),
  fish("teerbrasse", "Teerkush", "selten", "Schwarz, schwer, sinkt nicht."),
  fish("kronenbarsch", "Kronenkush", "selten", "Trägt Harz, kein Gold."),
  fish("glitchlachs", "Glitchhaze", "selten", "Ist kurz an zwei Stellen."),
  fish("vialstoer", "Vialstör", "selten", "Aus dem Glas, nicht aus dem Laich."),
  fish("ascheaal", "Aschejoint", "selten", "Noch warm vom Hof."),
  fish("pinkflosse", "Pinkkush", "selten", "Nur, wo das Licht falsch ist."),
  fish("schrotthai", "Schrotthai", "selten", "Zu viele Blätter für den Kanal."),
  fish("rohrforelle", "Rohrkush", "selten", "Kommt aus dem Deckel im Becken."),
  fish("nullbarsch", "Nullhaze", "selten", "Kein Schatten, trotzdem Gewicht."),
  fish("harpunenbutt", "Trichombutt", "selten", "Der Haken kennt die Kristalle schon."),
  fish("leuchtzander", "Leuchthaze", "selten", "Die Pose ohne Angel. Er ist das Licht."),
  fish("slagstoer", "Slagkush", "bissig", "Aus dem Stapel, der atmet."),
  fish("noxaal", "Noxhaze", "bissig", "Die Ecke im Wasser, die nicht da ist."),
  fish("rootwels", "Rootkush", "bissig", "Warm wie ein Port."),
  fish("velvetkarpfen", "Velvetbud", "bissig", "Samt, nass, teuer."),
  fish("kaisermuraene", "Kaiserkush", "bissig", "Der Kanal hat einen König. Der zählt nicht im Dex."),
  fish("softcashhai", "Cashkush", "bissig", "Beißt nur, was glänzt. Das Geld bleibt an Land."),
];

if (FISH.length !== 42) throw new Error(`Fische ${FISH.length}, sollen 42 sein`);
if (new Set(FISH.map((f) => f.id)).size !== FISH.length) throw new Error("Fisch-Ids nicht eindeutig");
if (FISH.some((f) => f.area !== FISH_AREA || f.where !== FISH_WHERE)) throw new Error("Fisch außerhalb vom Neonkai");

/** Volles Becken, nur solange du in der Kapsel stehst. */
export const TANK_GROW = 1.2;

export function tankSpecies(caught: Record<string, number> | undefined | null): FishDef[] {
  const bag = caught && typeof caught === "object" && !Array.isArray(caught) ? caught : {};
  return FISH.filter((f) => (bag[f.id] ?? 0) > 0);
}

export function tankFull(caught: Record<string, number> | undefined | null): boolean {
  return tankSpecies(caught).length >= FISH.length;
}

export function tankGrowMul(map: string, caught: Record<string, number> | undefined | null): number {
  return map === "capsule" && tankFull(caught) ? TANK_GROW : 1;
}

export function tankGrowLabel(): string {
  return `+${Math.round((TANK_GROW - 1) * 100)}%`;
}

export const FISH_BY_ID: Record<string, FishDef> = Object.fromEntries(FISH.map((f) => [f.id, f]));

/** Gewöhnlich 1, zäh 2, selten 3, bissig 4. */
export function fishHitsNeeded(rarity: FishRarity): number {
  if (rarity === "zäh") return 2;
  if (rarity === "selten") return 3;
  if (rarity === "bissig") return 4;
  return 1;
}

/** Jeder Samen ködert nur seine Fische. Zero-Day ködert alle. */
const BAIT: Record<string, readonly string[]> = {
  seed_ordinary: ["fish_neonbrasse", "fish_kanalgrundel", "fish_pfuetzenploetze"],
  seed_kush: ["fish_gossenbarsch", "fish_lache", "fish_glutschuppe"],
  seed_better: ["fish_rostbarbe", "fish_filterling", "fish_rohrforelle"],
  seed_afghan: ["fish_oelschleie", "fish_sudkarpfen", "fish_teerbrasse"],
  seed_northern: ["fish_drahtforelle", "fish_neonhecht", "fish_leuchtzander"],
  seed_hashplant: ["fish_kippenaal", "fish_bitumenbutt", "fish_ascheaal"],
  seed_moss: ["fish_schlickbutt", "fish_siffhecht", "fish_rootwels"],
  seed_haze: ["fish_kabelwels", "fish_chembarbe", "fish_saeurezander"],
  seed_jack: ["fish_harzforelle", "fish_glitchlachs"],
  seed_diesel: ["fish_gullylachs", "fish_reusenaal"],
  seed_thai: ["fish_schrotthai", "fish_kaisermuraene"],
  seed_durban: ["fish_tropfbarsch", "fish_slagstoer"],
  seed_widow: ["fish_samtflosse", "fish_pinkflosse", "fish_velvetkarpfen"],
  seed_premium: ["fish_kronenbarsch", "fish_harpunenbutt", "fish_softcashhai"],
  seed_gelato: ["fish_scherbendorsch", "fish_nullbarsch"],
  seed_zkittlez: ["fish_vialstoer", "fish_noxaal"],
};

{
  const seen = new Set<string>();
  for (const ids of Object.values(BAIT)) {
    for (const id of ids) {
      if (seen.has(id)) throw new Error(`Fisch an zwei Samen: ${id}`);
      seen.add(id);
    }
  }
  for (const f of FISH) {
    if (!seen.has(f.id)) throw new Error(`Fisch ohne Samen: ${f.id}`);
  }
}

export function fishForBait(seedId: string): FishDef[] {
  if (seedId === "seed_eddi" || ITEMS[seedId]?.eddiOnly) return FISH;
  const ids = BAIT[seedId];
  if (!ids) return [];
  return ids.map((id) => FISH_BY_ID[id]).filter((f): f is FishDef => !!f);
}

/** Teurer Samen verschiebt nur die Gewichte. Jeder Weed-Samen ködert. */
export function rollFish(seedId: string, random: () => number = Math.random): FishDef {
  const school = fishForBait(seedId);
  const pool: FishDef[] = [];
  for (const f of school) {
    for (let i = 0; i < f.weight; i++) pool.push(f);
  }
  return pool[Math.floor(random() * pool.length)] ?? school[0] ?? FISH[0]!;
}

const CANAL_TRASH = [
  { id: "chip_junk", w: 4, line: "Junk-Chip, verbogen." },
  { id: "fert_normal", w: 2, line: "Nasser Dünger." },
  { id: "potion_patch", w: 2, line: "Pflaster-Trunk, noch halb voll." },
  { id: "joint_street", w: 2, line: "Ein nasser Gassen-Joint." },
  { id: "chew_xp", w: 1, line: "Gossen-Kau. Noch weich." },
  { id: "chip_street", w: 1, line: "Street-Chip aus dem Schlamm." },
];

/** Müll aus dem Kanal. Kein Samen. */
export function canalTrash(): { id: string; line: string } {
  const sum = CANAL_TRASH.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * sum;
  for (const row of CANAL_TRASH) {
    r -= row.w;
    if (r <= 0) return row;
  }
  return CANAL_TRASH[0]!;
}

/** Anteil Müll, festgelegt beim Wurf. Zero-Day fast nie. */
export function trashOdds(seedId: string): number {
  if (seedId === "seed_eddi" || ITEMS[seedId]?.eddiOnly) return 0.12;
  const price = ITEMS[seedId]?.buy ?? 20;
  if (price >= 70) return 0.22;
  if (price >= 36) return 0.32;
  return 0.42;
}

type Bite = {
  t: number;
  catch?: number;
  speed?: number;
  gold?: number;
  luck?: number;
  xp?: number;
};

/** Ein Fisch, ein Buff. Zahlen stapeln wie ein Joint. */
const BITE: Record<string, Bite> = {
  fish_neonbrasse: { t: 45, catch: 1.22 },
  fish_gossenbarsch: { t: 45, catch: 1.28 },
  fish_oelschleie: { t: 45, speed: 1.22 },
  fish_kippenaal: { t: 45, xp: 1.25 },
  fish_rostbarbe: { t: 45, luck: 1.22 },
  fish_sudkarpfen: { t: 50, gold: 1.2 },
  fish_pfuetzenploetze: { t: 45, xp: 1.2 },
  fish_kanalgrundel: { t: 40, catch: 1.18 },
  fish_schlickbutt: { t: 40, speed: 1.18 },
  fish_drahtforelle: { t: 50, speed: 1.28 },
  fish_siffhecht: { t: 40, luck: 1.18 },
  fish_tropfbarsch: { t: 45, gold: 1.18 },
  fish_lache: { t: 40, xp: 1.18 },
  fish_filterling: { t: 50, catch: 1.25 },
  fish_glutschuppe: { t: 70, catch: 1.35 },
  fish_chembarbe: { t: 70, xp: 1.4 },
  fish_bitumenbutt: { t: 75, catch: 1.32 },
  fish_reusenaal: { t: 70, luck: 1.35 },
  fish_neonhecht: { t: 75, catch: 1.4 },
  fish_harzforelle: { t: 80, catch: 1.38 },
  fish_gullylachs: { t: 70, speed: 1.35 },
  fish_scherbendorsch: { t: 65, luck: 1.32 },
  fish_samtflosse: { t: 75, gold: 1.3, luck: 1.2 },
  fish_saeurezander: { t: 70, xp: 1.35 },
  fish_kabelwels: { t: 75, speed: 1.32, xp: 1.2 },
  fish_teerbrasse: { t: 95, gold: 1.4, catch: 1.25 },
  fish_kronenbarsch: { t: 90, gold: 1.45 },
  fish_glitchlachs: { t: 95, speed: 1.4, xp: 1.3 },
  fish_vialstoer: { t: 100, xp: 1.5 },
  fish_ascheaal: { t: 95, catch: 1.45 },
  fish_pinkflosse: { t: 90, luck: 1.45 },
  fish_schrotthai: { t: 100, catch: 1.5 },
  fish_rohrforelle: { t: 95, luck: 1.35, gold: 1.3 },
  fish_nullbarsch: { t: 95, xp: 1.4, catch: 1.25 },
  fish_harpunenbutt: { t: 100, catch: 1.48 },
  fish_leuchtzander: { t: 95, speed: 1.4, xp: 1.35 },
  fish_slagstoer: { t: 130, catch: 1.6, luck: 1.35 },
  fish_noxaal: { t: 130, speed: 1.55, xp: 1.45 },
  fish_rootwels: { t: 140, xp: 1.6, catch: 1.35 },
  fish_velvetkarpfen: { t: 130, gold: 1.55, luck: 1.4 },
  fish_kaisermuraene: { t: 140, catch: 1.65, speed: 1.3 },
  fish_softcashhai: { t: 150, gold: 1.7, luck: 1.35 },
};

if (Object.keys(BITE).length !== FISH.length) throw new Error(`Fisch-Buffs ${Object.keys(BITE).length}, sollen ${FISH.length} sein`);

for (const f of FISH) {
  const b = BITE[f.id];
  if (!b) throw new Error(`Fisch ohne Buff: ${f.id}`);
  const it: ItemDef = {
    id: f.id,
    name: f.name,
    cat: "fish",
    desc: f.blurb,
    use: "smoke",
    where: FISH_WHERE,
    highTime: b.t,
    catchMul: b.catch,
    speedMul: b.speed,
    goldHigh: b.gold,
    luckHigh: b.luck,
    xpMul: b.xp,
  };
  const line = smokeLine(it);
  it.desc = line ? `${f.blurb} Essen: ${line}.` : f.blurb;
  ITEMS[f.id] = it;
}
