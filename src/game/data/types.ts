export const CORE_TYPES = [
  "normal",
  "grass",
  "fire",
  "water",
  "poison",
  "fighting",
  "dark",
  "fairy",
  "digital",
  "steel",
] as const;

export const ELEMENTS = [
  ...CORE_TYPES,
  "psychic",
  "bug",
  "ghost",
  "electric",
] as const;

export type Element = (typeof ELEMENTS)[number];
export type CoreType = (typeof CORE_TYPES)[number];

export const ELEMENT_LABEL: Record<Element, string> = {
  normal: "Normal",
  grass: "Pflanze",
  fire: "Feuer",
  water: "Wasser",
  digital: "Digital",
  fairy: "Fee",
  fighting: "Kampf",
  dark: "Unlicht",
  poison: "Gift",
  psychic: "Psycho",
  steel: "Stahl",
  bug: "Käfer",
  ghost: "Geist",
  electric: "Elektro",
};

export const ELEMENT_COLOR: Record<Element, string> = {
  normal: "#c4c4c8",
  grass: "#7cff6b",
  fire: "#ff6b4a",
  water: "#5aa8ff",
  digital: "#5cffd2",
  fairy: "#ff8ad4",
  fighting: "#d45a3a",
  dark: "#6a5a8a",
  poison: "#a85ad2",
  psychic: "#ff6aa8",
  steel: "#9aa4b4",
  bug: "#9ccc3a",
  ghost: "#7a6ab4",
  electric: "#ffe14a",
};

const CHART: Partial<Record<Element, Partial<Record<Element, number>>>> = {
  grass: { water: 2, fire: 0.5, grass: 0.5, poison: 0.5, bug: 0.5, steel: 0.5, digital: 0.5 },
  fire: { grass: 2, bug: 2, steel: 2, fire: 0.5, water: 0.5, digital: 0.5 },
  water: { fire: 2, digital: 0.5, grass: 0.5, water: 0.5 },
  digital: { steel: 2, electric: 2, digital: 0.5, bug: 0.5, fairy: 0.5 },
  fairy: { fighting: 2, dark: 2, poison: 0.5, steel: 0.5, digital: 0.5 },
  fighting: { normal: 2, dark: 2, steel: 2, fairy: 0.5, psychic: 0.5, ghost: 0, poison: 0.5, digital: 0.5 },
  dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
  poison: { grass: 2, fairy: 2, poison: 0.5, steel: 0, digital: 2, ghost: 0.5 },
  psychic: { fighting: 2, poison: 2, dark: 0, steel: 0.5, digital: 0.5 },
  steel: { fairy: 2, fire: 0.5, water: 0.5, steel: 0.5, digital: 0.5 },
  bug: { grass: 2, dark: 2, digital: 2, psychic: 2, fire: 0.5, fighting: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
  ghost: { ghost: 2, psychic: 2, normal: 0, dark: 0.5 },
  electric: { water: 2, digital: 2, electric: 0.5, grass: 0.5 },
  normal: { ghost: 0, steel: 0.5 },
};

export function typeMod(atk: Element, defTypes: Element[]): number {
  let m = 1;
  for (const d of defTypes) {
    m *= CHART[atk]?.[d] ?? 1;
  }
  return m;
}

export function matchupHint(atk: Element, defTypes: Element[]): { word: string; tone: "good" | "bad" | "ok" } {
  const m = typeMod(atk, defTypes);
  if (m === 0) return { word: "kein Effekt", tone: "bad" };
  if (m >= 2) return { word: "sehr effektiv", tone: "good" };
  if (m > 1) return { word: "effektiv", tone: "good" };
  if (m < 1) return { word: "schwach", tone: "bad" };
  return { word: "ok", tone: "ok" };
}
