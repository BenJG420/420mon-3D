// Original quest definitions from BenJG420/420mon src/game/state.ts.
export type QuestNeed = "catch" | "legend" | "visit" | "kinds";

export type QuestDef = {
  id: string;
  name: string;
  hint: string;
  secret?: boolean;
  giver?: string;
  place?: string;
  minLv?: number;
  district?: string;
  need?: QuestNeed;
  n?: number;
};

export const QUEST_DEFS: QuestDef[] = [
  { id: "q1_bolt", name: "Bolt's Maut", hint: "Junk-Chip aus der Tonne. Bolt in der Gasse nimmt ihn als Durchlass.", giver: "Bolt", place: "Gasse A", minLv: 1 },
  { id: "q2_harvest", name: "Erster Schnitt", hint: "Samen in den Kapsel-Topf. Warten. Schneiden. Schlaf auf der Matte zieht dreißig Minuten ab.", giver: "Kapsel", place: "Kapsel", minLv: 1 },
  { id: "q3_trash", name: "Drei Deckel", hint: "Drei Behälter auf. Tonne, Fass, Kiste — zählt alles.", giver: "Bolt", place: "Gasse A", minLv: 1 },
  { id: "q4_fight", name: "Erste Beule", hint: "Ein Kampf zu Ende. Wild oder Trainer.", giver: "Gasse", place: "Gasse A", minLv: 1 },
  { id: "q5_silk", name: "Silk's Stick", hint: "Silk-Stick liegt am Markt. Silk kalibriert danach deine Chips. Oder verkauf Bud, der nicht Ordinary heißt.", giver: "Silk", place: "Markt", minLv: 6 },
  { id: "q6_nude", name: "????", hint: "Die Tüte bleibt. Die Tür nicht.", secret: true, minLv: 1 },
  { id: "q7_grow", name: "Keim", hint: "Etwas in die Erde. Die Töpfe in der Kapsel.", giver: "Kapsel", place: "Kapsel", minLv: 1 },
  { id: "q8_mattress", name: "Nische", hint: "Mira zeigt auf eine Matratze. Der Rest ist Atem.", giver: "Mira", place: "Nischen", minLv: 1 },
  { id: "q9_static", name: "Static's Stick", hint: "Datenstick aus den Tonnen. Static am Markt.", giver: "Static", place: "Markt", minLv: 6 },
  { id: "q10_lowtown", name: "Zehn Fäden", hint: "Die anderen zuziehen. Dann ist Lowtown durch.", giver: "Lowtown", place: "Stadt", minLv: 1 },
  { id: "q_k_alley", name: "Gassenfang", hint: "Fang ein Monster in der Gasse. Irgendeins. Nicht den König.", giver: "Hex", place: "Gasse A", minLv: 1, district: "alley", need: "catch" },
  { id: "q_k_3", name: "Drei Namen", hint: "Drei verschiedene Arten fangen. Gesehen zählt nicht.", giver: "Hex", place: "Gasse A", minLv: 1, need: "kinds", n: 3 },
  { id: "q_v_market", name: "Wochenmarkt", hint: "Einmal auf den Markt. Silk steht auf dem Platz, Stände an der Südwand.", giver: "Silk", place: "Markt", minLv: 6, district: "market", need: "visit" },
  { id: "q_k_yard", name: "Hofkeim", hint: "Fang ein Monster in den Grow-Hinterhöfen.", giver: "Moss", place: "Hinterhof", minLv: 8, district: "yard", need: "catch" },
  { id: "q_k_drain", name: "Nasser Fang", hint: "Fang ein Monster im Abfluss.", giver: "Drip", place: "Abfluss", minLv: 16, district: "drain", need: "catch" },
  { id: "q_leg", name: "Erster König", hint: "Fang ein Legendäres. Es steht nicht dauernd auf der Straße — Zeitfenster.", giver: "Static", place: "Sein Kiez", minLv: 18, need: "legend" },
  { id: "q_k_ash", name: "Glutfang", hint: "Fang ein Monster im Aschegang.", giver: "Ember", place: "Aschegang", minLv: 22, district: "ash", need: "catch" },
  { id: "q_k_chem", name: "Sudfang", hint: "Fang ein Monster in der Chemiegasse.", giver: "Vial", place: "Chemiegasse", minLv: 32, district: "chem", need: "catch" },
  { id: "q_k_cable", name: "Portfang", hint: "Fang ein Monster im Kabelkeller.", giver: "Hex", place: "Kabelkeller", minLv: 42, district: "cable", need: "catch" },
  { id: "q_k_ring", name: "Käfigfang", hint: "Fang ein Monster im Ring.", giver: "Knuckle", place: "Ring", minLv: 58, district: "ring", need: "catch" },
  { id: "q_k_nische", name: "Vorhangfang", hint: "Fang ein Monster in den Sex-Nischen.", giver: "Mira", place: "Nischen", minLv: 72, district: "nische", need: "catch" },
  { id: "q_k_lab", name: "Schattenfang", hint: "Fang ein Monster im Labyrinth.", giver: "Hush", place: "Labyrinth", minLv: 95, district: "labyrinth", need: "catch" },
  { id: "q_k_scrap", name: "Schrottfang", hint: "Fang ein Monster am Schrotttor.", giver: "Jax", place: "Schrotttor", minLv: 130, district: "scrap", need: "catch" },
  { id: "q_ben", name: "Bens Kasse", hint: "Ab Stufe 10. Ben steht in Rajkos Keller. Kapsel, Tür Keller. Spende über Ko-fi, das Wort aus der Kasse in die Nachricht.", giver: "Ben", place: "Keller", minLv: 10 },
];
