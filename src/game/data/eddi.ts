/** Original capsule visitor and stock. Source: BenJG420/420mon, 010807da77df. */
import { STRAINS } from "./items";

export const EDDI_LINES: string[] = [
  "Eddi: Wer erntet, lügt nicht. Wer redet, schon.",
  "Eddi: Erde lügt nicht. Dealer schon.",
  "Eddi: Die Box ist wärmer als Silk's Lächeln.",
  "Eddi: Dünger ist Geduld in Pulver.",
  "Eddi: Ordinary bleibt Ordinary. Auch hinter der Scheibe.",
  "Eddi: Wenn's duftet, nicht warten. Die Stadt wartet auch nicht.",
  "Eddi: Ich zahl doppelt, weil ich doppelt nehme. Fair.",
  "Eddi: Titel ist Blech. Blech macht Tempo. Tempo macht Schnitt.",
  "Eddi: Töpfe sind für Anfänger. Boxen sind für Leute mit Matte.",
  "Eddi: Indica beißt. Sativa läuft. Hybrid lügt freundlich.",
  "Eddi: Silk nimmt Provision. Ich nehm Ernte.",
  "Eddi: Nicht rauchen was du verkaufen kannst. Außer du musst.",
  "Eddi: Die Kapsel stinkt. Gut. Stank ist Inventar.",
  "Eddi: Wer oft genug schneidet, hat keine Ausreden mehr.",
  "Eddi: Rabatt ist kein Geschenk. Rabatt ist, dass du bleibst.",
  "Eddi: Neon-Topf ist Theater. Growbox ist Arbeit.",
  "Eddi: Wenn Bolt fragt: du hast nie geerntet.",
  "Eddi: Schnitt, zählen, wieder rein. Der Rest ist Gerede.",
  "Eddi: Meine Sorte. Drei auf einmal. Vierhundertzwanzig. Nicht im Müll.",
  "Eddi: Verkaufst du meinen Schnitt, kommt Plus. Fair ist fair.",
];

export const EDDI_STOCK_EXTRA = ["title_schnitt"] as const;
export const EDDI_SPEED = 30;
export const EDDI_LOOK_T = 2.15;
export const EDDI_PAUSE_T = 1.05;
export const EDDI_BOOST_CHANCE = 0.34;
export const EDDI_HOME = { x: 248, y: 140 };
export type EddiAct = "wander" | "look" | "pause";

export function eddiActLabel(act: EddiAct | undefined): string {
  return act === "look" ? "Eddi · schaut" : "Eddi";
}

export function eddiStock(hasTitle: boolean): string[] {
  const seeds = STRAINS.map(s => `seed_${s.id}`);
  const fert = ["fert_normal", "fert_good", "fert_premium", "fert_synth", "fert_eddi"];
  const chips = ["chip_silk", "chip_neon", "chip_crown"];
  return [...seeds, ...fert, ...chips, ...(hasTitle ? [] : EDDI_STOCK_EXTRA)];
}
