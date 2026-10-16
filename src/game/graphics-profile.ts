/** Presentation only: these profiles never change map geometry or gameplay. */
export type GraphicsQuality = "auto" | "high" | "low";
export type DistrictGraphics = {
  id: string; indoor: boolean; background: string; fog: { color: string; density: number };
  keyColor: string; fillColor: string; accent: string;
  keyIntensity: number; fillIntensity: number; environmentIntensity: number;
  rain: number; wetness: number; exposure: number;
  bloom: { strength: number; radius: number; threshold: number };
  contrast: number; saturation: number; vignette: number; grain: number;
};
const NIGHT: Omit<DistrictGraphics, "id"> = {
  indoor: false, background: "#030811", fog: { color: "#0d1b28", density: .027 },
  keyColor: "#ffe0b2", fillColor: "#50778d", accent: "#84adb1",
  keyIntensity: 2.1, fillIntensity: .65, environmentIntensity: .8,
  rain: .9, wetness: .9, exposure: 1.04,
  bloom: { strength: .5, radius: .55, threshold: 1.12 },
  contrast: 1.09, saturation: .9, vignette: .23, grain: .012,
};
const PROFILES: Record<string, Partial<DistrictGraphics>> = {
  alley: { accent: "#8cb6b8", fog: { color: "#102331", density: .024 } },
  yard: { accent: "#9ab86a", fillColor: "#426869", fog: { color: "#122729", density: .032 }, wetness: .79, rain: .72 },
  cable: { accent: "#45dfb9", fillColor: "#355c75", fog: { color: "#0d2225", density: .035 }, rain: .45 },
  market: { accent: "#ffb46a", keyColor: "#d4d7df", fog: { color: "#25202a", density: .025 }, rain: .8 },
  sewer: { accent: "#6ed6b3", fillColor: "#3b6c61", fog: { color: "#10231f", density: .042 }, rain: 0, wetness: 1 },
  ash: { accent: "#ff7a43", fillColor: "#686178", fog: { color: "#2b1b23", density: .034 }, rain: .68, wetness: .78 },
  drain: { accent: "#57b9eb", fillColor: "#48758f", fog: { color: "#0b202f", density: .032 }, rain: 1, wetness: 1 },
  chem: { accent: "#b3de68", fillColor: "#486a69", fog: { color: "#1b2a22", density: .032 }, rain: .86 },
  ring: { accent: "#ffb566", fillColor: "#656584", fog: { color: "#211c2b", density: .026 }, rain: .85 },
  labyrinth: { accent: "#ae8df5", fillColor: "#4a4f7a", fog: { color: "#18172e", density: .038 }, rain: .68 },
  nische: { accent: "#ef78b5", fillColor: "#665282", fog: { color: "#29172c", density: .028 }, rain: .78 },
  scrap: { accent: "#f3a457", fillColor: "#5a7781", fog: { color: "#1a252c", density: .03 }, rain: 1, wetness: .95 },
  kai: { accent: "#64d2dd", keyColor: "#a5cce7", fog: { color: "#102835", density: .03 }, rain: 1, wetness: 1 },
};
const INTERIOR: Partial<DistrictGraphics> = {
  indoor: true,
  background: "#070d13", fog: { color: "#141d24", density: 0 },
  keyColor: "#efcca0", fillColor: "#687c8c", accent: "#e4ae64",
  keyIntensity: 1.45, fillIntensity: .8, environmentIntensity: .44,
  rain: 0, wetness: .08, exposure: 1.1,
  bloom: { strength: .28, radius: .4, threshold: 1.25 }, vignette: .15, grain: .008,
};
const INTERIOR_IDS = new Set(["capsule", "studio", "kino", "cable", "labyrinth", "nische"]);
export function getDistrictGraphics(id: string, indoor = INTERIOR_IDS.has(id) || id.startsWith("den_")): DistrictGraphics {
  const cozy = ["capsule", "studio", "kino"].includes(id) || id.startsWith("den_");
  const interior = indoor ? { ...INTERIOR, ...(!cozy ? PROFILES[id] ?? {} : {}), rain: 0, wetness: cozy ? .08 : .3 } : {};
  const profile = { ...NIGHT, ...(PROFILES[id] ?? {}), ...interior, id };
  return { ...profile, fog: { ...profile.fog }, bloom: { ...profile.bloom } };
}

/** Preserve useful detail without multiplying native 4K by a phone's pixel ratio. */
export function graphicsPixelRatio(width: number, height: number, nativeRatio: number, quality: GraphicsQuality, mobile: boolean): number {
  const budget = quality === "high" ? 8_294_400 : quality === "low" ? 1_200_000 : mobile ? 1_600_000 : 3_686_400;
  const cap = quality === "high" ? 2 : quality === "low" ? 1 : mobile ? 1.35 : 1.7;
  const pixels = Math.max(1, width) * Math.max(1, height);
  return Math.max(.25, Math.min(Math.max(1, nativeRatio || 1), cap, Math.sqrt(budget / pixels)));
}
