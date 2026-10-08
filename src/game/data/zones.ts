import type { Element } from "./types";
import { encountersFor, type EncMon } from "./dex";
import { STAGE, type Stage } from "./progress";

export type { EncMon };

export type District = {
  id: string;
  map?: string;
  name: string;
  type: Element;
  also?: Element[];
  look: string;
  mons: EncMon[];
  unlock?: string;
  soon?: boolean;
  hint: string;
  tier: number;
  minLv: number;
  stage: Stage;
};

function stageBits(id: string): Pick<District, "tier" | "minLv" | "stage"> {
  const stage = STAGE[id] ?? STAGE.alley;
  return { tier: stage.tier, minLv: stage.minLv, stage };
}

export const DISTRICTS: District[] = [
  {
    id: "alley",
    map: "alley",
    name: "Gasse A",
    type: "normal",
    also: ["poison"],
    look: "Mischzone. Trash, Neon, Allerweltsköter.",
    mons: encountersFor("alley"),
    hint: "Start. Puffpuff hustet, Hashound folgt dem Rauch. Kerboss wohnt im Bordstein.",
    ...stageBits("alley"),
  },
  {
    id: "yard",
    map: "yard",
    name: "Grow-Hinterhöfe",
    type: "grass",
    look: "Töpfe, Neon-Unkraut, nasser Beton.",
    mons: encountersFor("yard"),
    unlock: "q1_bolt",
    hint: "Hinter Bolts Gitter. Budling keimt. Kronkush trägt die letzte Blüte.",
    ...stageBits("yard"),
  },
  {
    id: "cable",
    map: "cable",
    name: "Kabelkeller",
    type: "digital",
    look: "Racks, Funkenboden, warme Ports.",
    mons: encountersFor("cable"),
    unlock: "q1_bolt",
    hint: "Luke bei Hex. Kalte Gänge. Rootkaiser am PDU.",
    ...stageBits("cable"),
  },
  {
    id: "ash",
    map: "ash",
    name: "Aschegang",
    type: "fire",
    look: "Hof, Glutinseln, Kippenstreifen.",
    mons: encountersFor("ash"),
    unlock: "q1_bolt",
    hint: "Jointail-Heimat. Glutarch ist die Kippe, die nicht ausgeht.",
    ...stageBits("ash"),
  },
  {
    id: "drain",
    map: "drain",
    name: "Abfluss",
    type: "water",
    look: "Rohre, Klos, Hähne. Milchiger Dunst.",
    mons: encountersFor("drain"),
    unlock: "q1_bolt",
    hint: "Ein Steg. Cumulus an den Rohren. Rohrlethe auf dem Deckel im Becken.",
    ...stageBits("drain"),
  },
  {
    id: "chem",
    map: "chem",
    name: "Chemiegasse",
    type: "poison",
    look: "Wannen, gelber Dampf, trockene Gänge.",
    mons: encountersFor("chem"),
    unlock: "q1_bolt",
    hint: "Wannenhalle. Cracksprite im Dampf. Vialith lächelt aus dem Glas.",
    ...stageBits("chem"),
  },
  {
    id: "ring",
    map: "ring",
    name: "Ring",
    type: "fighting",
    look: "Käfig, Kreide, stotternde Lampen.",
    mons: encountersFor("ring"),
    unlock: "q1_bolt",
    hint: "Umgang trocken. Pit zählt. Cagekaiser Freitagabend.",
    ...stageBits("ring"),
  },
  {
    id: "labyrinth",
    map: "labyrinth",
    name: "Labyrinth-Schatten",
    type: "dark",
    look: "Enge Ecken. Eine fehlt.",
    mons: encountersFor("labyrinth"),
    unlock: "q1_bolt",
    hint: "Immer knicken. Noxarch in der Ecke, die nicht da ist.",
    ...stageBits("labyrinth"),
  },
  {
    id: "nische",
    map: "nische",
    name: "Sex-Nischen",
    type: "fairy",
    look: "Vorhänge, Pinklicht, letzter Samt.",
    mons: encountersFor("nische"),
    unlock: "q1_bolt",
    hint: "Gang trocken. Kabinen beißen. Velouryx hinter dem letzten Vorhang.",
    ...stageBits("nische"),
  },
  {
    id: "scrap",
    map: "scrap",
    name: "Schrotttor",
    type: "steel",
    look: "Zwei Höfe, Band, Stapel der atmet.",
    mons: encountersFor("scrap"),
    unlock: "q1_bolt",
    hint: "Coil auf dem Band. Slagodon Freitagfrüh unter dem Stapel.",
    ...stageBits("scrap"),
  },
];

export function districtByMap(map: string): District | undefined {
  return DISTRICTS.find((d) => d.map === map);
}

export function districtById(id: string): District | undefined {
  return DISTRICTS.find((d) => d.id === id);
}

export const PLAYABLE_MAPS = DISTRICTS.filter((d) => d.map).map((d) => d.map!) as string[];
