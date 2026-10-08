import { ELEMENT_LABEL, type Element } from "./types";

export type ItemCat = "key" | "wear" | "chip" | "seed" | "fert" | "bud" | "heal" | "smoke" | "fish" | "misc";
export type ItemUse = "heal" | "heal_all" | "smoke" | "wear";
export type StrainKind = "indica" | "sativa" | "hybrid";

export type ItemDef = {
  id: string;
  name: string;
  cat: ItemCat;
  desc: string;
  buy?: number;
  sell?: number;
  use?: ItemUse;
  healPct?: number;
  catchMul?: number;
  highTime?: number;
  vsType?: Element;
  vsMul?: number;
  where?: string;
  catchWorn?: number;
  goldMul?: number;
  luckMul?: number;
  encMul?: number;
  sprite?: string;
  strain?: StrainKind;
  yieldN?: number;
  budId?: string;
  speedMul?: number;
  goldHigh?: number;
  luckHigh?: number;
  hybridRolls?: number;
  xpMul?: number;
  sureCatch?: boolean;
  sellPlus?: number;
  eddiOnly?: boolean;
};

export type StrainDef = {
  id: string;
  seedName: string;
  budName: string;
  kind: StrainKind;
  seedDesc: string;
  budDesc: string;
  buy?: number;
  sellSeed: number;
  sellBud: number;
  yieldN: number;
  highTime: number;
  catchMul?: number;
  speedMul?: number;
  goldHigh?: number;
  luckHigh?: number;
  hybridRolls?: number;
  where?: string;
  sellPlus?: number;
  eddiOnly?: boolean;
};

export const STRAIN_LABEL: Record<StrainKind, string> = {
  indica: "Indica",
  sativa: "Sativa",
  hybrid: "Hybrid",
};

export const STRAINS: StrainDef[] = [
  {
    id: "kush",
    seedName: "Gossen-Kush",
    budName: "Gossen-Kush Bud",
    kind: "indica",
    seedDesc: "Schwer. Bleibt in der Lunge. Fangbonus.",
    budDesc: "Dicht. Fang +50% für 55s. Stapelt Dauer. Mehr Wild auf der Straße.",
    buy: 28,
    sellSeed: 9,
    sellBud: 16,
    yieldN: 6,
    highTime: 55,
    catchMul: 1.5,
  },
  {
    id: "better",
    seedName: "Better Seed",
    budName: "Better Bud",
    kind: "indica",
    seedDesc: "Dichter. Silk mag den Smoke.",
    budDesc: "Silk zahlt dafür. Fangchance +55% für 70s.",
    buy: 36,
    sellSeed: 12,
    sellBud: 20,
    yieldN: 7,
    highTime: 70,
    catchMul: 1.55,
  },
  {
    id: "afghan",
    seedName: "Keller-Afghan",
    budName: "Keller-Afghan Bud",
    kind: "indica",
    seedDesc: "Alt, harzig. Chips beißen danach härter.",
    budDesc: "Harz an den Fingern. Fangchance +62% für 70s.",
    buy: 44,
    sellSeed: 14,
    sellBud: 24,
    yieldN: 7,
    highTime: 70,
    catchMul: 1.62,
  },
  {
    id: "northern",
    seedName: "Neon-Lights",
    budName: "Neon-Lights Bud",
    kind: "indica",
    seedDesc: "Kalt und fett. Der klassische Fang-Cut.",
    budDesc: "Kalter Stein. Fangchance +75% für 88s.",
    buy: 60,
    sellSeed: 20,
    sellBud: 32,
    yieldN: 8,
    highTime: 88,
    catchMul: 1.75,
  },
  {
    id: "hashplant",
    seedName: "Asphalt-Hash",
    budName: "Asphalt-Hash Bud",
    kind: "indica",
    seedDesc: "Schwerster Cut. Fast schon Klebstoff.",
    budDesc: "Klebt. Fangchance +90% für 100s.",
    buy: 82,
    sellSeed: 26,
    sellBud: 40,
    yieldN: 9,
    highTime: 100,
    catchMul: 1.9,
  },
  {
    id: "moss",
    seedName: "Moos-Steckling",
    budName: "Hinterhof-Bud",
    kind: "indica",
    seedDesc: "Hinterhof. Wird Hinterhof-Bud. Silk hat den nicht.",
    budDesc: "Aus Moos-Steckling. Nasser Smoke. Fang +65%.",
    sellSeed: 14,
    sellBud: 24,
    yieldN: 7,
    highTime: 80,
    catchMul: 1.65,
    where: "Nur Grow-Hinterhöfe",
    buy: 48,
  },
  {
    id: "haze",
    seedName: "Kabel-Haze",
    budName: "Kabel-Haze Bud",
    kind: "sativa",
    seedDesc: "Dünn, elektrisch. Tempo nach dem Zug.",
    budDesc: "Kopf geht auf. Tempo +18% für 55s. Stapelt Dauer. Läuft neben Fang.",
    buy: 28,
    sellSeed: 9,
    sellBud: 15,
    yieldN: 5,
    highTime: 55,
    speedMul: 1.18,
  },
  {
    id: "jack",
    seedName: "Jack-Flash",
    budName: "Jack-Flash Bud",
    kind: "sativa",
    seedDesc: "Springt fast allein. Sativa, klar.",
    budDesc: "Beine leichter. Laufgeschwindigkeit +25% für 70s.",
    buy: 40,
    sellSeed: 13,
    sellBud: 22,
    yieldN: 6,
    highTime: 70,
    speedMul: 1.25,
  },
  {
    id: "diesel",
    seedName: "Sour-Gasse",
    budName: "Sour-Gasse Bud",
    kind: "sativa",
    seedDesc: "Riecht nach Tankstelle. Läuft danach.",
    budDesc: "Scharf. Laufgeschwindigkeit +32% für 80s.",
    buy: 54,
    sellSeed: 18,
    sellBud: 28,
    yieldN: 7,
    highTime: 80,
    speedMul: 1.32,
  },
  {
    id: "thai",
    seedName: "Thai-Stick",
    budName: "Thai-Stick Bud",
    kind: "sativa",
    seedDesc: "Lang, dünn, illegal importiert.",
    budDesc: "Kopf frei. Laufgeschwindigkeit +40% für 90s.",
    buy: 70,
    sellSeed: 22,
    sellBud: 34,
    yieldN: 7,
    highTime: 90,
    speedMul: 1.4,
  },
  {
    id: "durban",
    seedName: "Durban-Gift",
    budName: "Durban-Gift Bud",
    kind: "sativa",
    seedDesc: "Scharfster Cut. Die Gasse bleibt hinter dir.",
    budDesc: "Giftgrün. Laufgeschwindigkeit +48% für 100s.",
    buy: 90,
    sellSeed: 28,
    sellBud: 42,
    yieldN: 8,
    highTime: 100,
    speedMul: 1.48,
  },
  {
    id: "ordinary",
    seedName: "Ordinary Seed",
    budName: "Ordinary Bud",
    kind: "hybrid",
    seedDesc: "Keimt überall. Auch im Aschebecher. Hybrid würfelt.",
    budDesc: "Gassenware. Hybrid würfelt. Stapelt auf das, was schon sitzt.",
    buy: 14,
    sellSeed: 4,
    sellBud: 9,
    yieldN: 4,
    highTime: 42,
    catchMul: 1.35,
    speedMul: 1.12,
    goldHigh: 1.12,
    luckHigh: 1.15,
    hybridRolls: 1,
  },
  {
    id: "widow",
    seedName: "White Widow",
    budName: "Widow-Bud",
    kind: "hybrid",
    seedDesc: "Klassiker. Ein Buff, aber sitzt.",
    budDesc: "Weiß bestäubt. Hybrid: ein Zufalls-Buff für 70s.",
    buy: 46,
    sellSeed: 15,
    sellBud: 24,
    yieldN: 7,
    highTime: 70,
    catchMul: 1.45,
    speedMul: 1.18,
    goldHigh: 1.18,
    luckHigh: 1.2,
    hybridRolls: 1,
  },
  {
    id: "premium",
    seedName: "Premium Seed",
    budName: "Premium Bud",
    kind: "hybrid",
    seedDesc: "Laborleck. Klebrig. Zwei Buffs auf einmal.",
    budDesc: "Gold in Grün. Hybrid: zwei Zufalls-Buffs für 100s.",
    buy: 72,
    sellSeed: 24,
    sellBud: 36,
    yieldN: 9,
    highTime: 100,
    catchMul: 1.7,
    speedMul: 1.28,
    goldHigh: 1.25,
    luckHigh: 1.28,
    hybridRolls: 2,
  },
  {
    id: "gelato",
    seedName: "Gelato-Neon",
    budName: "Gelato-Bud",
    kind: "hybrid",
    seedDesc: "Süß, teuer, würfelt zweimal.",
    budDesc: "Dessert-Cut. Hybrid: zwei Zufalls-Buffs für 80s.",
    buy: 64,
    sellSeed: 21,
    sellBud: 33,
    yieldN: 8,
    highTime: 80,
    catchMul: 1.55,
    speedMul: 1.22,
    goldHigh: 1.22,
    luckHigh: 1.25,
    hybridRolls: 2,
  },
  {
    id: "zkittlez",
    seedName: "Zkit-Beutel",
    budName: "Zkit-Bud",
    kind: "hybrid",
    seedDesc: "Bunt. Der Laden mag den nicht, du schon. Zwei Buffs.",
    budDesc: "Frucht, Lüge. Hybrid: zwei Zufalls-Buffs für 90s.",
    buy: 78,
    sellSeed: 25,
    sellBud: 38,
    yieldN: 8,
    highTime: 90,
    catchMul: 1.65,
    speedMul: 1.28,
    goldHigh: 1.28,
    luckHigh: 1.3,
    hybridRolls: 2,
  },
  {
    id: "eddi",
    seedName: "Zero-Day-Samen",
    budName: "Zero-Day-Kush",
    kind: "hybrid",
    seedDesc: "Zero-Day-Kush. Drei Buffs auf einmal. Nicht im Müll.",
    budDesc: "Fang, Tempo, Gold gleichzeitig. Verkauf zahlt extra.",
    buy: 420,
    sellSeed: 60,
    sellBud: 90,
    yieldN: 12,
    highTime: 140,
    catchMul: 2,
    speedMul: 1.55,
    goldHigh: 1.5,
    hybridRolls: 3,
    sellPlus: 0.5,
    eddiOnly: true,
  },
];

export const STRAIN_BY_ID: Record<string, StrainDef> = Object.fromEntries(STRAINS.map((s) => [s.id, s]));

export function strainIdOf(itemId: string): string | null {
  if (itemId.startsWith("seed_")) return itemId.slice(5);
  if (itemId.startsWith("bud_")) return itemId.slice(4);
  return null;
}

export function strainOfItem(itemId: string): StrainDef | undefined {
  const id = strainIdOf(itemId);
  return id ? STRAIN_BY_ID[id] : undefined;
}

export const POT_MAX = 6;
export const POT_START = 2;
export const BOX_MAX = 6;
export const GROW_SLOTS = POT_MAX + BOX_MAX;
export const POT_UNLOCK: { slot: number; price: number; name: string; blurb: string }[] = [
  { slot: 3, price: 70, name: "Ton-Topf", blurb: "Dritter Schnitt. Steht in der Kapsel." },
  { slot: 4, price: 140, name: "Stoff-Topf", blurb: "Vierter. Mehr Grün, weniger Warten." },
  { slot: 5, price: 240, name: "Neon-Topf", blurb: "Fünfter. Die Matte reicht nicht mehr." },
  { slot: 6, price: 380, name: "Labor-Topf", blurb: "Sechster. Volle Bank." },
];
export const BOX_UNLOCK: { slot: number; price: number; name: string; blurb: string }[] = [
  { slot: 1, price: 420, name: "Holz-Box", blurb: "Erste Growbox. Unten in der Kapsel." },
  { slot: 2, price: 840, name: "Blech-Box", blurb: "Zweite. Wärmer als der Topf." },
  { slot: 3, price: 1260, name: "Stoff-Box", blurb: "Dritte. Die Wand wird eng." },
  { slot: 4, price: 2100, name: "Neon-Box", blurb: "Vierte. Licht von innen." },
  { slot: 5, price: 3360, name: "Labor-Box", blurb: "Fünfte. Die Matte reicht nicht mehr." },
  { slot: 6, price: 5040, name: "Kern-Box", blurb: "Sechste. Volle Bank." },
];

export function isGrowBox(idx: number): boolean {
  return idx >= POT_MAX;
}

export function boxSlot(idx: number): number {
  return idx - POT_MAX;
}

export const FERT_RANK = ["fert_eddi", "fert_synth", "fert_premium", "fert_good", "fert_normal"] as const;

export const FERT_SPEED: Record<string, number> = {
  fert_normal: 1.1,
  fert_good: 1.25,
  fert_premium: 1.45,
  fert_synth: 1.6,
  fert_eddi: 1.8,
};

export const FERT_YIELD: Record<string, number> = {
  fert_normal: 2,
  fert_good: 4,
  fert_premium: 6,
  fert_synth: 8,
  fert_eddi: 10,
};

export const FERT_XP: Record<string, number> = {
  fert_normal: 1.12,
  fert_good: 1.28,
  fert_premium: 1.45,
  fert_synth: 1.55,
  fert_eddi: 1.7,
};

function strainItems(): Record<string, ItemDef> {
  const out: Record<string, ItemDef> = {};
  for (const s of STRAINS) {
    out[`seed_${s.id}`] = {
      id: `seed_${s.id}`,
      name: s.seedName,
      cat: "seed",
      desc: s.seedDesc,
      buy: s.buy,
      sell: s.sellSeed,
      strain: s.kind,
      yieldN: s.yieldN,
      budId: `bud_${s.id}`,
      catchMul: s.catchMul,
      speedMul: s.speedMul,
      goldHigh: s.goldHigh,
      luckHigh: s.luckHigh,
      hybridRolls: s.hybridRolls,
      highTime: s.highTime,
      where: s.where,
      sellPlus: s.sellPlus,
      eddiOnly: s.eddiOnly,
    };
    out[`bud_${s.id}`] = {
      id: `bud_${s.id}`,
      name: s.budName,
      cat: "bud",
      desc: s.budDesc,
      sell: s.sellBud,
      use: "smoke",
      strain: s.kind,
      catchMul: s.catchMul,
      speedMul: s.speedMul,
      goldHigh: s.goldHigh,
      luckHigh: s.luckHigh,
      hybridRolls: s.hybridRolls,
      highTime: s.highTime,
      where: s.where ? `Nur aus ${s.seedName}` : undefined,
      sellPlus: s.sellPlus,
      eddiOnly: s.eddiOnly,
    };
  }
  return out;
}

export const ITEMS: Record<string, ItemDef> = {
  key_dex: { id: "key_dex", name: "Dex", cat: "key", desc: "Kaputter Dex. Zählt trotzdem." },
  key_stick: { id: "key_stick", name: "Datenstick", cat: "key", desc: "Static will den. Warm und voller Logs." },
  key_silkstick: {
    id: "key_silkstick",
    name: "Silk-Stick",
    cat: "key",
    desc: "Dealer-Log. Silk hat den verloren. Markt.",
    sell: 4,
    where: "Nur Markt",
  },
  title_schnitt: {
    id: "title_schnitt",
    name: "Züchter-Titel",
    cat: "key",
    desc: "Blech an der Brust. Die Pflanzen ticken schneller.",
    buy: 20_000,
  },
  wear_trashbag: {
    id: "wear_trashbag",
    name: "Mülltüte",
    cat: "wear",
    desc: "Zerfetzt. Sitzt trotzdem. T wechselt.",
    buy: 6,
    sell: 1,
    use: "wear",
    luckMul: 1.12,
    sprite: "player_bag",
  },
  wear_collar: {
    id: "wear_collar",
    name: "Halsband",
    cat: "wear",
    desc: "Klickt zu. Chips beißen etwas härter.",
    buy: 24,
    sell: 8,
    use: "wear",
    catchWorn: 1.05,
    sprite: "player_collar",
  },
  wear_jacket: {
    id: "wear_jacket",
    name: "Neon-Jacke",
    cat: "wear",
    desc: "Giftgrün. Fang dauerhaft +8%, solange sie sitzt.",
    buy: 48,
    sell: 16,
    use: "wear",
    catchWorn: 1.08,
    sprite: "player_jacket",
  },
  wear_vest: {
    id: "wear_vest",
    name: "Lederweste",
    cat: "wear",
    desc: "Narbenleder. Loot-Gold +15%.",
    buy: 36,
    sell: 12,
    use: "wear",
    goldMul: 1.15,
    sprite: "player_vest",
  },
  wear_coat: {
    id: "wear_coat",
    name: "Asphalt-Mantel",
    cat: "wear",
    desc: "Lang. Weniger Begegnungen, etwas mehr Kiez-Kram.",
    buy: 58,
    sell: 18,
    use: "wear",
    encMul: 0.72,
    luckMul: 1.1,
    sprite: "player_coat",
  },
  wear_hoodie: {
    id: "wear_hoodie",
    name: "Kapuze",
    cat: "wear",
    desc: "Schwarz, zu groß. Die Gasse fragt weniger.",
    buy: 32,
    sell: 10,
    use: "wear",
    encMul: 0.88,
    luckMul: 1.06,
    sprite: "player_hoodie",
  },
  wear_track: {
    id: "wear_track",
    name: "Trainingsanzug",
    cat: "wear",
    desc: "Streifen an den Beinen. Chips sitzen etwas besser.",
    buy: 40,
    sell: 12,
    use: "wear",
    catchWorn: 1.04,
    sprite: "player_track",
  },
  wear_rain: {
    id: "wear_rain",
    name: "Regenjacke",
    cat: "wear",
    desc: "Gelb, nass, laut. Wild bleibt öfter liegen.",
    buy: 44,
    sell: 14,
    use: "wear",
    encMul: 0.8,
    sprite: "player_rain",
  },
  wear_overalls: {
    id: "wear_overalls",
    name: "Latzhose",
    cat: "wear",
    desc: "Schrotttor-Schnitt. Taschen voller Kleingeld.",
    buy: 38,
    sell: 12,
    use: "wear",
    goldMul: 1.08,
    luckMul: 1.05,
    sprite: "player_overalls",
  },
  wear_lack: {
    id: "wear_lack",
    name: "Lackjacke",
    cat: "wear",
    desc: "Schwarzer Lack, cyan Kante, goldene Naht. Fang +6% und etwas Glück, solange sie sitzt.",
    buy: 0,
    sell: 80,
    use: "wear",
    catchWorn: 1.06,
    luckMul: 1.08,
    sprite: "player_lack",
  },
  chip_junk: { id: "chip_junk", name: "Junk-Chip", cat: "chip", desc: "Billiger Fangchip. Kratzt.", buy: 12, sell: 4 },
  chip_street: { id: "chip_street", name: "Street-Chip", cat: "chip", desc: "Gassenware. Hält besser.", buy: 28, sell: 10 },
  chip_silk: { id: "chip_silk", name: "Silk-Chip", cat: "chip", desc: "Von Silk persönlich kalibriert.", buy: 55, sell: 18 },
  chip_neon: { id: "chip_neon", name: "Neon-Chip", cat: "chip", desc: "Selten. Beißt fast immer.", buy: 95, sell: 30 },
  chip_crown: {
    id: "chip_crown",
    name: "Kronen-Chip",
    cat: "chip",
    desc: "Legendär. Sitzt immer. Silk nimmt 1.000.000. Manchmal im Müll.",
    buy: 1_000_000,
    sell: 220_000,
    sureCatch: true,
  },
  chip_gutter: {
    id: "chip_gutter",
    name: "Gossen-Chip",
    cat: "chip",
    desc: "Aus der Gasse. Besser gegen Gift.",
    sell: 8,
    vsType: "poison",
    vsMul: 1.45,
    where: "Nur Gasse A",
  },
  chip_port: {
    id: "chip_port",
    name: "Port-Chip",
    cat: "chip",
    desc: "Warmer Port. Beißt Digital.",
    sell: 16,
    vsType: "digital",
    vsMul: 1.5,
    where: "Nur Kabelkeller",
  },
  chip_shade: {
    id: "chip_shade",
    name: "Schatten-Chip",
    cat: "chip",
    desc: "Kein Licht. Besser gegen Unlicht.",
    sell: 16,
    vsType: "dark",
    vsMul: 1.5,
    where: "Nur Labyrinth-Schatten",
  },
  chip_plate: {
    id: "chip_plate",
    name: "Blech-Chip",
    cat: "chip",
    desc: "Rostiger Biss. Besser gegen Stahl.",
    sell: 18,
    vsType: "steel",
    vsMul: 1.5,
    where: "Nur Schrotttor",
  },
  chip_wet: {
    id: "chip_wet",
    name: "Nass-Chip",
    cat: "chip",
    desc: "Tropft noch. Besser gegen Wasser.",
    sell: 10,
    vsType: "water",
    vsMul: 1.45,
    where: "Nur Kanal",
  },
  chip_leaf: {
    id: "chip_leaf",
    name: "Blatt-Chip",
    cat: "chip",
    desc: "Grünes Metall. Besser gegen Pflanze.",
    sell: 14,
    vsType: "grass",
    vsMul: 1.5,
    where: "Nur Grow-Hinterhöfe",
  },
  fert_normal: { id: "fert_normal", name: "Dünger", cat: "fert", desc: "Riecht nach Keller. Tempo +10%.", buy: 10, sell: 3 },
  fert_good: { id: "fert_good", name: "Guter Dünger", cat: "fert", desc: "Schneller und fetter. Tempo +25%.", buy: 22, sell: 7 },
  fert_premium: { id: "fert_premium", name: "Premium-Dünger", cat: "fert", desc: "Illegal gemischt. Tempo +45%.", buy: 40, sell: 12 },
  fert_synth: { id: "fert_synth", name: "Synth-Dünger", cat: "fert", desc: "Laborstaub. Tempo +60%.", buy: 90, sell: 28 },
  fert_eddi: { id: "fert_eddi", name: "Eddis Mische", cat: "fert", desc: "Seine Mische. Tempo +80%. Nicht im Müll.", buy: 420, sell: 80, eddiOnly: true },

  potion_patch: { id: "potion_patch", name: "Pflaster-Trunk", cat: "heal", desc: "Heilt ~45% HP eines Partners.", buy: 16, sell: 5, use: "heal", healPct: 0.45 },
  potion_vial: { id: "potion_vial", name: "Neon-Vial", cat: "heal", desc: "Einen Partner voll heilen.", buy: 38, sell: 12, use: "heal", healPct: 1 },
  potion_kit: { id: "potion_kit", name: "Street-Kit", cat: "heal", desc: "Ganze Party voll. Teuer, rettet Läufe.", buy: 72, sell: 22, use: "heal_all", healPct: 1 },
  vial_murk: {
    id: "vial_murk",
    name: "Klär-Phiole",
    cat: "heal",
    desc: "Milchig. Heilt ~70% eines Partners.",
    sell: 11,
    use: "heal",
    healPct: 0.7,
    where: "Nur Abfluss",
  },
  vial_fume: {
    id: "vial_fume",
    name: "Gelber Sud",
    cat: "heal",
    desc: "Beißt in der Nase. Heilt die Party ~45%.",
    sell: 16,
    use: "heal_all",
    healPct: 0.45,
    where: "Nur Chemiegasse",
  },
  tape_knuckle: {
    id: "tape_knuckle",
    name: "Käfig-Tape",
    cat: "heal",
    desc: "Wickeln, nicht küssen. Einen Partner voll.",
    sell: 14,
    use: "heal",
    healPct: 1,
    where: "Nur Ring",
  },
  chip_fist: {
    id: "chip_fist",
    name: "Knöchel-Chip",
    cat: "chip",
    desc: "Dellt sich nicht. Besser gegen Kampf.",
    sell: 16,
    vsType: "fighting",
    vsMul: 1.5,
    where: "Nur Ring",
  },
  vial_velvet: {
    id: "vial_velvet",
    name: "Samt-Tropfen",
    cat: "heal",
    desc: "Pink, süß, lügt. Heilt ~60%.",
    sell: 12,
    use: "heal",
    healPct: 0.6,
    where: "Nur Sex-Nischen",
  },
  chip_blush: {
    id: "chip_blush",
    name: "Scham-Chip",
    cat: "chip",
    desc: "Warm in der Hand. Besser gegen Fee.",
    sell: 16,
    vsType: "fairy",
    vsMul: 1.5,
    where: "Nur Sex-Nischen",
  },
  joint_street: { id: "joint_street", name: "Gassen-Joint", cat: "smoke", desc: "Rauch. Fang +35% für 42s. Stapelt. Mehr Wild.", buy: 14, sell: 5, use: "smoke", catchMul: 1.35, highTime: 42 },
  joint_fat: { id: "joint_fat", name: "Fetter Joint", cat: "smoke", desc: "Dicker Zug. Fang +55% für 70s. Stapelt. Mehr Wild.", buy: 32, sell: 11, use: "smoke", catchMul: 1.55, highTime: 70 },
  joint_gold: { id: "joint_gold", name: "Gold-Joint", cat: "smoke", desc: "Laborleck. Fang +80% für 100s. Stapelt. Mehr Wild.", buy: 58, sell: 18, use: "smoke", catchMul: 1.8, highTime: 100 },
  coal_ember: {
    id: "coal_ember",
    name: "Glutkohle",
    cat: "smoke",
    desc: "Noch warm. Fang +50% für 55s. Stapelt. Mehr Wild.",
    sell: 10,
    use: "smoke",
    catchMul: 1.5,
    highTime: 55,
    where: "Nur Aschegang",
  },
  chip_cinder: {
    id: "chip_cinder",
    name: "Glut-Chip",
    cat: "chip",
    desc: "Heiß am Rand. Besser gegen Feuer.",
    sell: 16,
    vsType: "fire",
    vsMul: 1.5,
    where: "Nur Aschegang",
  },
  joint_silkcut: {
    id: "joint_silkcut",
    name: "Silk-Schnitt",
    cat: "smoke",
    desc: "Marktware ohne Preisschild. Fang +70% für 88s. Stapelt. Mehr Wild.",
    sell: 20,
    use: "smoke",
    catchMul: 1.7,
    highTime: 88,
    where: "Nur Markt",
  },
  chew_xp: {
    id: "chew_xp",
    name: "Gossen-Kau",
    cat: "smoke",
    desc: "Klebriger Kaugummi. XP +80% für 90s. Stapelt Dauer.",
    buy: 26,
    sell: 8,
    use: "smoke",
    xpMul: 1.8,
    highTime: 90,
  },
  bar_xp: {
    id: "bar_xp",
    name: "Level-Riegel",
    cat: "smoke",
    desc: "Zu süß. XP +150% für 140s. Stapelt. Sitzt neben Fang und Tempo.",
    buy: 54,
    sell: 16,
    use: "smoke",
    xpMul: 2.5,
    highTime: 140,
  },
  serum_xp: {
    id: "serum_xp",
    name: "Root-Serum",
    cat: "smoke",
    desc: "Kabelkeller-Leck. XP +300% für 200s. Der starke Schnitt.",
    buy: 110,
    sell: 32,
    use: "smoke",
    xpMul: 4,
    highTime: 200,
  },
  slag_core: {
    id: "slag_core",
    name: "Schlacke-Kern",
    cat: "smoke",
    desc: "Noch warm vom Tor. XP +220% für 160s.",
    sell: 22,
    use: "smoke",
    xpMul: 3.2,
    highTime: 160,
    where: "Nur Schrotttor",
  },
  drop_cut: {
    id: "drop_cut",
    name: "Schnitt-Tropfen",
    cat: "misc",
    desc: "Eine Stufe. Entwicklung zählt mit. An der Schnittbank.",
    buy: 40,
    sell: 10,
  },
  vial_cut: {
    id: "vial_cut",
    name: "Schnitt-Phiole",
    cat: "misc",
    desc: "Fünf Stufen auf einmal. An der Schnittbank.",
    buy: 180,
    sell: 40,
  },
  amp_cut: {
    id: "amp_cut",
    name: "Schnitt-Ampulle",
    cat: "misc",
    desc: "Zwanzig Stufen. Kommt aus hohem Schnitt, nicht aus dem Laden.",
    sell: 90,
  },
  resin_hp: { id: "resin_hp", name: "Harz · HP", cat: "misc", desc: "Wert HP +4, bis 100. An der Schnittbank.", buy: 32, sell: 8 },
  resin_atk: { id: "resin_atk", name: "Harz · ATK", cat: "misc", desc: "Wert ATK +4, bis 100. An der Schnittbank.", buy: 32, sell: 8 },
  resin_def: { id: "resin_def", name: "Harz · DEF", cat: "misc", desc: "Wert DEF +4, bis 100. An der Schnittbank.", buy: 32, sell: 8 },
  resin_spa: { id: "resin_spa", name: "Harz · SPA", cat: "misc", desc: "Wert SPA +4, bis 100. An der Schnittbank.", buy: 32, sell: 8 },
  resin_spd: { id: "resin_spd", name: "Harz · SPD", cat: "misc", desc: "Wert SPD +4, bis 100. An der Schnittbank.", buy: 32, sell: 8 },
  resin_spe: { id: "resin_spe", name: "Harz · SPE", cat: "misc", desc: "Wert SPE +4, bis 100. An der Schnittbank.", buy: 32, sell: 8 },
  ...strainItems(),
};

export const CHIP_RATE: Record<string, number> = {
  chip_junk: 1,
  chip_gutter: 1.35,
  chip_street: 1.6,
  chip_wet: 1.55,
  chip_leaf: 2.15,
  chip_silk: 2.2,
  chip_cinder: 2.2,
  chip_blush: 2.2,
  chip_fist: 2.25,
  chip_shade: 2.3,
  chip_port: 2.4,
  chip_plate: 2.45,
  chip_neon: 3,
  chip_crown: 99,
};

export const MAP_UNIQUE: Record<string, string[]> = {
  alley: ["chip_gutter"],
  yard: ["seed_moss", "chip_leaf"],
  cable: ["chip_port"],
  ash: ["coal_ember", "chip_cinder"],
  drain: ["vial_murk"],
  chem: ["vial_fume"],
  ring: ["tape_knuckle", "chip_fist"],
  labyrinth: ["chip_shade"],
  nische: ["vial_velvet", "chip_blush"],
  scrap: ["chip_plate", "slag_core"],
  sewer: ["chip_wet"],
  market: ["joint_silkcut", "key_silkstick"],
};

export const UNIQUE_FIND = [...new Set([...Object.values(MAP_UNIQUE).flat(), "bud_moss"])];

export const CAT_ORDER: ItemCat[] = ["heal", "smoke", "chip", "seed", "fert", "bud", "fish", "wear", "key", "misc"];

export const CAT_LABEL: Record<ItemCat, string> = {
  heal: "Heilen",
  smoke: "Rausch",
  chip: "Chips",
  seed: "Samen",
  fert: "Dünger",
  bud: "Buds",
  fish: "Fische",
  wear: "Kleidung",
  key: "Keys",
  misc: "Rest",
};

export const SHOP = [
  "potion_patch",
  "potion_vial",
  "potion_kit",
  "joint_street",
  "joint_fat",
  "joint_gold",
  "chew_xp",
  "bar_xp",
  "serum_xp",
  "drop_cut",
  "vial_cut",
  "resin_hp",
  "resin_atk",
  "resin_def",
  "resin_spa",
  "resin_spd",
  "resin_spe",
  "seed_ordinary",
  "seed_better",
  "seed_kush",
  "seed_haze",
  "fert_normal",
  "fert_good",
  "fert_premium",
  "fert_synth",
  "chip_junk",
  "chip_street",
  "chip_silk",
  "chip_neon",
  "chip_crown",
  "wear_collar",
  "wear_jacket",
  "wear_vest",
  "wear_coat",
  "wear_hoodie",
  "wear_track",
  "wear_rain",
  "wear_overalls",
];

export const STALL_CHIPS = ["chip_junk", "chip_street", "chip_silk"];
export const STALL_GROW = [
  ...STRAINS.filter((s) => s.buy && !s.where && !s.eddiOnly).map((s) => `seed_${s.id}`),
  "fert_normal",
  "fert_good",
  "fert_premium",
  "fert_synth",
];
export const STALL_THREADS = ["wear_trashbag", "wear_collar", "wear_jacket", "wear_vest", "wear_coat", "wear_hoodie", "wear_track", "wear_rain", "wear_overalls"];
export const STALL_FENCE = ["chip_junk", "chip_street", "seed_ordinary", "seed_kush", "fert_normal", "potion_patch", "joint_street", "chew_xp"];

export const LOOT_SPRITES = new Set(["barrel", "crate", "terminal", "pot_empty", "pot_plant"]);

export type GenericDrop = { id?: string; gold?: [number, number]; w: number; line: string };

const GENERIC: GenericDrop[] = [
  { id: "chip_junk", w: 4, line: "Junk-Chip, verbogen." },
  { id: "seed_ordinary", w: 3, line: "Ein Samen. Klebrig." },
  { id: "seed_kush", w: 1, line: "Gossen-Kush. Schwer." },
  { id: "seed_haze", w: 1, line: "Kabel-Haze. Dünn." },
  { id: "fert_normal", w: 2, line: "Dünger. Kellergeruch." },
  { id: "potion_patch", w: 3, line: "Pflaster-Trunk, noch halb voll." },
  { id: "joint_street", w: 2, line: "Gassen-Joint." },
  { id: "chew_xp", w: 1, line: "Gossen-Kau. Noch weich." },
  { gold: [6, 14], w: 4, line: "Münzen in der Ritze." },
  { id: "chip_street", w: 1, line: "Street-Chip. Selten im Dreck." },
];

export function pickGeneric(): GenericDrop {
  const sum = GENERIC.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * sum;
  for (const g of GENERIC) {
    r -= g.w;
    if (r <= 0) return g;
  }
  return GENERIC[0];
}

export function uniqueChance(map: string, kind: string): number {
  let c = 0.28;
  if (kind === "crate") c = 0.38;
  if (kind === "terminal") c = 0.42;
  if (kind === "barrel") c = 0.34;
  if (kind === "pot_empty" || kind === "pot_plant") c = 0.46;
  if (kind === "mattress") c = map === "nische" ? 0.55 : 0.34;
  if (kind === "lamp") c = 0.3;
  if (map === "yard" && (kind === "pot_empty" || kind === "pot_plant")) c = 0.58;
  if (map === "scrap" && kind === "terminal") c = 0.48;
  if (map === "cable" && kind === "terminal") c = 0.48;
  if (map === "ash" && kind === "barrel") c = 0.44;
  if (map === "chem" && kind === "barrel") c = 0.44;
  if (map === "drain" && kind === "barrel") c = 0.42;
  if (map === "ring" && kind === "crate") c = 0.46;
  return c;
}

export function lootKind(o: { kind: string; sprite?: string; id: string }): string | null {
  if (o.id === "felix_crate" || o.id === "felix_cage_box") return null;
  if (o.id === "term" || o.id === "bag" || o.id === "kino_booth" || o.id === "kino_play" || o.id === "kino_pause" || o.id === "kino_next") return null;
  if (o.kind === "bin" || o.kind === "lamp" || o.kind === "mattress") return o.kind;
  if (o.kind === "prop" && o.sprite && LOOT_SPRITES.has(o.sprite)) return o.sprite;
  return null;
}

export function openLine(kind: string): string {
  if (kind === "barrel") return "Deckel vom Fass. Es stinkt.";
  if (kind === "crate") return "Kiste aufgebrochen.";
  if (kind === "terminal") return "Logs. Jemand hat den Port nicht zugemacht.";
  if (kind === "pot_empty" || kind === "pot_plant") return "Die Erde krümelt. Finger rein.";
  if (kind === "lamp") return "Fassung auf. Neon auf der Haut.";
  if (kind === "mattress") return "Unter dem Stoff.";
  return "Deckel auf. Hände rein.";
}

export function itemName(id: string): string {
  return ITEMS[id]?.name ?? id;
}

export function itemUseLabel(it: ItemDef, outfit?: string): string | null {
  if (it.cat === "fish") return "Essen";
  if (it.use === "heal") return "Heilen";
  if (it.use === "heal_all") return "Party heilen";
  if (it.use === "smoke") return it.xpMul ? "Nehmen" : "Rauchen";
  if (it.use === "wear") {
    const on = outfit === it.id || (it.id === "wear_trashbag" && outfit === "bag");
    return on ? "Ausziehen" : "Anziehen";
  }
  return null;
}

export function groupedInv(inv: Record<string, number>): { cat: ItemCat; rows: { id: string; n: number; def: ItemDef }[] }[] {
  const by: Partial<Record<ItemCat, { id: string; n: number; def: ItemDef }[]>> = {};
  for (const [id, n] of Object.entries(inv)) {
    if (n <= 0) continue;
    const def = ITEMS[id] ?? { id, name: id, cat: "misc" as const, desc: "" };
    const cat = def.cat;
    (by[cat] ??= []).push({ id, n, def });
  }
  return CAT_ORDER.flatMap((cat) => {
    const rows = by[cat];
    if (!rows?.length) return [];
    rows.sort((a, b) => a.def.name.localeCompare(b.def.name, "de"));
    return [{ cat, rows }];
  });
}

function fmtMul(n: number): string {
  const s = n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${s}×`;
}

function pctOff(n: number): string {
  return `+${Math.round((n - 1) * 100)}%`;
}

export function smokeLine(it: ItemDef): string {
  const bits: string[] = [];
  if (it.xpMul && it.xpMul > 1) bits.push(`XP ${pctOff(it.xpMul)}`);
  if (it.strain === "hybrid") bits.push((it.hybridRolls ?? 1) >= 3 ? "Fang · Tempo · Gold auf einmal" : (it.hybridRolls ?? 1) > 1 ? "2 Zufalls-Buffs" : "Zufalls-Buff");
  else {
    if (it.catchMul && it.catchMul > 1) bits.push(`Fang ${pctOff(it.catchMul)} · mehr Wild`);
    if (it.speedMul && it.speedMul > 1) bits.push(`Tempo ${pctOff(it.speedMul)}`);
    if (it.goldHigh && it.goldHigh > 1) bits.push(`Gold ${pctOff(it.goldHigh)}`);
    if (it.luckHigh && it.luckHigh > 1) bits.push(`Loot ${pctOff(it.luckHigh)}`);
  }
  if (it.highTime) bits.push(`${it.highTime}s stapelbar`);
  return bits.join(" · ");
}

export function itemEffect(it: ItemDef): string {
  const parts: string[] = [];
  if (it.cat === "chip") {
    const r = CHIP_RATE[it.id] ?? 1;
    if (it.sureCatch) parts.push("Fang 100%");
    else {
      parts.push(`Fang ${fmtMul(r)}`);
      if (it.vsType && it.vsMul) {
        parts.push(`gegen ${ELEMENT_LABEL[it.vsType]} ${fmtMul(r * it.vsMul)}`);
      }
    }
  }
  if (it.use === "heal") parts.push(`Einen Partner: ${Math.round((it.healPct ?? 0) * 100)}% HP`);
  if (it.use === "heal_all") parts.push(`Ganze Party: ${Math.round((it.healPct ?? 1) * 100)}% HP`);
  if (it.use === "smoke") {
    const line = smokeLine(it);
    if (line) parts.push(it.cat === "fish" ? `Essen: ${line}` : `Rauch: ${line}`);
  }
  if (it.use === "wear") {
    const bits: string[] = [];
    if (it.catchWorn && it.catchWorn !== 1) bits.push(`Fang ${pctOff(it.catchWorn)} solange an`);
    if (it.goldMul && it.goldMul !== 1) bits.push(`Gold ${pctOff(it.goldMul)}`);
    if (it.luckMul && it.luckMul !== 1) bits.push(`Kiez-Kram ${pctOff(it.luckMul)}`);
    if (it.encMul && it.encMul < 1) bits.push(`Weniger Begegnungen`);
    if (it.encMul && it.encMul > 1) bits.push(`Mehr Begegnungen`);
    parts.push(bits.length ? bits.join(" · ") : "Anziehen.");
  }
  if (it.cat === "seed") {
    const st = strainOfItem(it.id);
    if (st) {
      parts.push(STRAIN_LABEL[st.kind]);
      parts.push(`Topf → ${st.budName} ×${st.yieldN}`);
      const preview: ItemDef = { ...it, cat: "bud", use: "smoke", strain: st.kind };
      const line = smokeLine(preview);
      if (line) parts.push(`Rauch: ${line}`);
    } else {
      parts.push("Topf → Bud");
    }
  }
  if (it.cat === "fert") {
    const spd = FERT_SPEED[it.id];
    const y = FERT_YIELD[it.id];
    if (spd && spd > 1) parts.push(`Wuchs +${Math.round((spd - 1) * 100)}% Tempo`);
    if (y) parts.push(`Ernte +${y}`);
  }

  if (it.id === "key_stick") parts.push("Quest: Static am Markt");
  if (it.id === "key_silkstick") parts.push("Quest: Silk. Dauerhaft Fang +8%");
  if (it.id === "key_dex") parts.push("Immer dabei");
  if (it.buy) parts.push(`Kauf ${it.buy.toLocaleString("de-DE")}`);
  else if (it.where) parts.push(it.where);
  if (it.sell) parts.push(`Verkauf ${it.sell}`);
  if (it.sellPlus) parts.push(`Verkauf +${Math.round(it.sellPlus * 100)}% extra`);
  return parts.join(" · ");
}

export type ChipRank = {
  id: string;
  rate: number;
  vsType?: Element;
  vsMul?: number;
  vsRate?: number;
};

export const CHIP_RANK: ChipRank[] = Object.keys(CHIP_RATE)
  .map((id) => {
    const it = ITEMS[id];
    const rate = CHIP_RATE[id] ?? 1;
    const vsRate = it?.vsType && it.vsMul ? rate * it.vsMul : undefined;
    return { id, rate, vsType: it?.vsType, vsMul: it.vsMul, vsRate };
  })
  .sort((a, b) => b.rate - a.rate);

export const HELP_ITEM_IDS: string[] = [
  "potion_patch",
  "potion_vial",
  "potion_kit",
  "vial_murk",
  "vial_velvet",
  "vial_fume",
  "tape_knuckle",
  "joint_street",
  "joint_fat",
  "coal_ember",
  "joint_silkcut",
  "joint_gold",
  "chew_xp",
  "bar_xp",
  "serum_xp",
  "slag_core",
  "fert_normal",
  "fert_good",
  "fert_premium",
  "fert_synth",
  "wear_trashbag",
  "wear_collar",
  "wear_jacket",
  "wear_vest",
  "wear_coat",
  "wear_hoodie",
  "wear_track",
  "wear_rain",
  "wear_overalls",
  "chip_crown",
  "key_dex",
  "key_stick",
  "key_silkstick",
];
