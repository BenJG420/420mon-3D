/** PayPal-QR von Benjamin Glötzl. Betrag tippt der Zahler bei PayPal. */
export const DONATE_URL = "https://www.paypal.com/qrcodes/p2pqrc/MJE6PGP5FAHFW";

export type SupportGift = { id: string; n: number };

export type SupportTier = {
  id: string;
  name: string;
  eur: number;
  items: SupportGift[];
};

/** Feste Pakete. Kein Zufall, damit es keine Glücksspiel-Kiste ist. */
export const SUPPORT: SupportTier[] = [
  {
    id: "klein",
    name: "Kleine Kasse",
    eur: 3,
    items: [
      { id: "potion_vial", n: 2 },
      { id: "chip_street", n: 3 },
      { id: "seed_kush", n: 1 },
      { id: "drop_cut", n: 1 },
    ],
  },
  {
    id: "runde",
    name: "Runde",
    eur: 8,
    items: [
      { id: "vial_cut", n: 1 },
      { id: "resin_atk", n: 1 },
      { id: "resin_spe", n: 1 },
      { id: "chip_neon", n: 2 },
      { id: "seed_haze", n: 1 },
      { id: "joint_gold", n: 1 },
    ],
  },
  {
    id: "keller",
    name: "Keller",
    eur: 20,
    items: [
      { id: "amp_cut", n: 1 },
      { id: "chip_crown", n: 1 },
      { id: "resin_hp", n: 1 },
      { id: "resin_spa", n: 1 },
      { id: "serum_xp", n: 1 },
      { id: "seed_widow", n: 1 },
      { id: "wear_lack", n: 1 },
    ],
  },
];

export function donateLink(eur: number): string {
  const url = DONATE_URL.trim();
  if (!url) return "";
  if (url.includes("paypal.me")) return `${url.replace(/\/$/, "")}/${eur}EUR`;
  return url;
}
