import { drawGraffitiSymbol, GRAFFITI_SUBJECTS } from "./graffiti-symbols";

export const GRAFFITI_DISTRICTS = ["alley", "yard", "cable", "market", "kino", "kai", "sewer", "ash", "drain", "chem", "ring", "labyrinth", "nische", "scrap"] as const;
export type GraffitiDistrict = typeof GRAFFITI_DISTRICTS[number];
type Palette = readonly [string, string, string, string];
export type GraffitiMotif = Readonly<{
  id: number; district: GraffitiDistrict; subject: typeof GRAFFITI_SUBJECTS[number];
  composition: number; title: string; tag: string; phrase: string; palette: Palette;
}>;

// Original vector illustrations, combined with ten authored mural compositions.
// Each district owns three subjects and thirty designs, not palette swaps of one tag.
const THEMES: readonly { palette: Palette; tags: readonly string[]; phrase: string }[] = [
  { palette: ["#141d27", "#efe3bd", "#f26d4c", "#71cbc4"], tags: ["SOHLEN", "STADTVOGEL", "BASSLINE"], phrase: "KIEZ BLEIBT" },
  { palette: ["#18302b", "#e7e6b3", "#9cd065", "#f8b65b"], tags: ["WURZELWERK", "GIEßKOLLEKTIV", "SONNENSEITE"], phrase: "GROW ZUSAMMEN" },
  { palette: ["#17192e", "#ceeae8", "#a78aee", "#f7a73c"], tags: ["NETZAUGE", "B-SEITE", "UNTER STROM"], phrase: "KEIN SIGNAL" },
  { palette: ["#322127", "#fff0c7", "#eb9471", "#a7c978"], tags: ["REIFE SACHE", "KAFFEEKREIS", "FAIR TEILEN"], phrase: "MARKT FÜR ALLE" },
  { palette: ["#24213d", "#f2e2d6", "#f15f84", "#b0a5ec"], tags: ["LICHTSPIEL", "ABSPANN", "POPCORN"], phrase: "NACHTVORSTELLUNG" },
  { palette: ["#142d37", "#e6e4cc", "#57c4c3", "#ec9d63"], tags: ["LEUCHTFEUER", "ANKERPLATZ", "WELLENREITER"], phrase: "IMMER AM KAI" },
  { palette: ["#25302a", "#e6e4bf", "#a8bb67", "#dc9872"], tags: ["KANALRATTE", "GRÄTENCLUB", "UNTER UNS"], phrase: "TIEF IM KIEZ" },
  { palette: ["#33272a", "#f7dcc0", "#ed814e", "#b8a8ac"], tags: ["ASCHEVOGEL", "ZÜNDFUNKE", "SCHORNSTEIN"], phrase: "AUS ASCHE NEU" },
  { palette: ["#18323b", "#d9ece2", "#79bbcd", "#d9ac71"], tags: ["ACHT ARME", "ROHRPOST", "REGENFREI"], phrase: "ALLES IM FLUSS" },
  { palette: ["#242b31", "#e0edc3", "#b1cf67", "#d993cb"], tags: ["VERSUCHSLABOR", "VERBINDUNG", "ATEMSCHUTZ"], phrase: "REAKTION IM KIEZ" },
  { palette: ["#302433", "#f7e0c5", "#e66b65", "#eac271"], tags: ["FAUSTPFAND", "POKALNACHT", "LETZTE RUNDE"], phrase: "STEH WIEDER AUF" },
  { palette: ["#25283b", "#e8e3ce", "#a69cd8", "#64bfba"], tags: ["UMWEGE", "SCHLÜSSELKIND", "NACHTFALTER"], phrase: "FINDE DEINEN WEG" },
  { palette: ["#322536", "#f1dece", "#e792ae", "#a5c4b1"], tags: ["HERZPLATZ", "BETONROSE", "MONDRUHE"], phrase: "PLATZ FÜR DICH" },
  { palette: ["#2b2d30", "#e7dfc5", "#d79059", "#8eb8b1"], tags: ["RESTROBOTER", "ZAHN DER ZEIT", "ANZIEHUNG"], phrase: "NICHTS IST MÜLL" },
];
const COMPOSITIONS = ["Strahlenwand", "Zweiteiler", "Wildstyle-Schild", "Schablonenreihe", "Kiezsiegel", "Pinselzug", "Doppelbild", "Wegweiser", "Bogenwand", "Dachlinie"] as const;

export const GRAFFITI_CATALOG: readonly GraffitiMotif[] = Object.freeze(GRAFFITI_DISTRICTS.flatMap((district, districtIndex) => {
  const theme = THEMES[districtIndex];
  return theme.tags.flatMap((tag, subjectIndex) => COMPOSITIONS.map((compositionName, composition) => Object.freeze({
    id: districtIndex * 30 + subjectIndex * 10 + composition + 1,
    district, subject: GRAFFITI_SUBJECTS[districtIndex * 3 + subjectIndex], composition,
    title: `${tag} · ${compositionName}`, tag, phrase: theme.phrase, palette: theme.palette,
  })));
}));
const BY_DISTRICT = new Map<string, readonly GraffitiMotif[]>(GRAFFITI_DISTRICTS.map(district => [district, Object.freeze(GRAFFITI_CATALOG.filter(motif => motif.district === district))]));

export function districtGraffiti(id: string): readonly GraffitiMotif[] {
  return BY_DISTRICT.get(id) ?? BY_DISTRICT.get("alley")!;
}

function polygon(ctx: CanvasRenderingContext2D, points: readonly (readonly [number, number])[], fill: string, stroke?: string, width = 3) {
  ctx.beginPath(); points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function line(ctx: CanvasRenderingContext2D, points: readonly (readonly [number, number])[], color: string, width = 3) {
  ctx.beginPath(); points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, outline?: string, width = 3) {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = width; ctx.stroke(); }
}
function lettering(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number, fill: string, outline: string, angle = 0, align: CanvasTextAlign = "center") {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.font = `italic 900 ${size}px sans-serif`; ctx.lineWidth = Math.max(2, size * .13); ctx.strokeStyle = outline;
  ctx.strokeText(text, 0, 0, maxWidth); ctx.fillStyle = fill; ctx.fillText(text, 0, 0, maxWidth); ctx.restore();
}
function symbol(ctx: CanvasRenderingContext2D, motif: GraffitiMotif, x: number, y: number, size: number, rotation = 0, mirror = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(mirror ? -size : size, size);
  drawGraffitiSymbol(ctx, motif.subject, motif.palette[1], motif.palette[2]); ctx.restore();
}

/** Paint one bounded decal. Logical 400×240 art can be stored in a square atlas tile. */
export function paintGraffiti(ctx: CanvasRenderingContext2D, motif: GraffitiMotif, width: number, height: number): void {
  if (!(width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height))) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.clip(); ctx.scale(width / 400, height / 240);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const [dark, paper, accent, secondary] = motif.palette;
  let seed = Math.imul(motif.id, 0x45d9f3b) >>> 0;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };

  // Sparse overspray gives a painted edge without an image per motif or per-frame work.
  ctx.fillStyle = accent;
  for (let i = 0; i < 30; i++) {
    ctx.globalAlpha = .15 + random() * .3;
    const x = 23 + random() * 354, y = 23 + random() * 194, radius = .6 + random() * 2.4;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  switch (motif.composition) {
    case 0: { // Central illustration, explosive rays and a large low handwritten tag.
      polygon(ctx, [[33, 73], [90, 62], [93, 21], [152, 44], [198, 18], [243, 44], [310, 25], [307, 72], [375, 90], [338, 132], [360, 187], [274, 179], [210, 208], [130, 186], [46, 198], [61, 142]], dark, secondary, 5);
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        line(ctx, [[200 + Math.cos(a) * 76, 104 + Math.sin(a) * 58], [200 + Math.cos(a) * 145, 104 + Math.sin(a) * 87]], accent, i % 2 ? 3 : 7);
      }
      symbol(ctx, motif, 200, 103, .94, -.1);
      lettering(ctx, motif.tag, 200, 190, 39, 330, paper, dark, -.035);
      line(ctx, [[65, 215], [211, 204], [329, 212]], secondary, 6); break;
    }
    case 1: { // Offset split-panel, big illustration left and stacked stencil right.
      polygon(ctx, [[18, 27], [183, 19], [176, 211], [28, 218]], dark, paper, 3);
      polygon(ctx, [[187, 40], [367, 24], [381, 204], [187, 214]], accent, dark, 5);
      for (let i = 0; i < 7; i++) line(ctx, [[201 + i * 24, 45], [184 + i * 24, 72]], dark, 5);
      symbol(ctx, motif, 104, 115, .93, -.13);
      const words = motif.tag.split(" ");
      lettering(ctx, words[0], 281, words.length > 1 ? 109 : 125, 35, 165, paper, dark, .05);
      if (words.length > 1) lettering(ctx, words.slice(1).join(" "), 281, 148, 32, 164, paper, dark, -.04);
      lettering(ctx, motif.phrase, 281, 185, 16, 164, dark, accent);
      line(ctx, [[39, 190], [85, 196], [160, 182]], secondary, 6); break;
    }
    case 2: { // Angular wildstyle shield with cut-out arrows and oversized icon.
      polygon(ctx, [[20, 149], [79, 108], [38, 71], [139, 65], [174, 18], [215, 57], [326, 34], [300, 95], [383, 123], [315, 165], [355, 209], [257, 189], [208, 226], [158, 189], [49, 213]], secondary, dark, 8);
      polygon(ctx, [[54, 132], [120, 89], [192, 43], [268, 91], [346, 130], [271, 176], [193, 200], [121, 168]], dark, paper, 3);
      line(ctx, [[43, 91], [102, 83], [86, 99]], paper, 5);
      line(ctx, [[307, 187], [350, 196], [337, 176]], paper, 5);
      symbol(ctx, motif, 194, 115, 1.04, .11);
      lettering(ctx, motif.tag, 200, 199, 34, 291, accent, dark, -.08); break;
    }
    case 3: { // Three individually rotated stencils on a torn protest-poster strip.
      polygon(ctx, [[19, 42], [61, 49], [77, 33], [112, 42], [154, 31], [190, 43], [239, 28], [287, 41], [328, 34], [379, 49], [371, 196], [328, 184], [301, 204], [251, 190], [219, 208], [168, 192], [115, 206], [74, 190], [25, 202]], paper, dark, 5);
      ctx.fillStyle = dark; ctx.fillRect(33, 64, 334, 91);
      symbol(ctx, motif, 83, 109, .52, -.14);
      symbol(ctx, motif, 199, 107, .58);
      symbol(ctx, motif, 317, 112, .49, .16, true);
      for (let i = 0; i < 7; i++) line(ctx, [[45 + i * 48, 155], [29 + i * 48, 176]], accent, 8);
      lettering(ctx, motif.tag, 200, 188, 27, 326, dark, paper);
      lettering(ctx, motif.phrase, 200, 49, 15, 320, dark, paper); break;
    }
    case 4: { // Round neighbourhood seal flanked by leaves/chevrons.
      circle(ctx, 200, 118, 102, dark, secondary, 7);
      ctx.beginPath(); ctx.arc(200, 118, 85, 0, Math.PI * 2); ctx.strokeStyle = paper; ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8;
        circle(ctx, 200 + Math.cos(a) * 94, 118 + Math.sin(a) * 94, 2.3, accent);
      }
      for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
        const x = 200 + side * (119 + i * 9), y = 83 + i * 24;
        polygon(ctx, [[x, y], [x + side * 19, y - 14], [x + side * 12, y + 7], [x, y + 14]], secondary);
      }
      symbol(ctx, motif, 200, 108, .74);
      polygon(ctx, [[61, 164], [339, 164], [325, 199], [75, 199]], accent, dark, 4);
      lettering(ctx, motif.tag, 200, 180, 27, 270, paper, dark);
      lettering(ctx, "KIEZKOLLEKTIV", 200, 37, 14, 154, paper, dark); break;
    }
    case 5: { // Three broad dry-brush strokes with a tall central illustration.
      for (let i = 0; i < 3; i++) {
        const y = 49 + i * 52;
        polygon(ctx, [[19 + i * 12, y + 15], [362 - i * 5, y - 9], [383 - i * 8, y + 21], [348, y + 30], [370 - i * 8, y + 39], [40, y + 54], [55, y + 39], [17, y + 42]], i === 1 ? accent : dark);
      }
      for (let i = 0; i < 9; i++) line(ctx, [[48 + i * 10, 44], [29 + i * 10, 72]], secondary, 3);
      symbol(ctx, motif, 241, 108, 1.03, .12);
      lettering(ctx, motif.tag, 175, 191, 41, 302, paper, dark, -.075);
      lettering(ctx, motif.phrase, 118, 98, 15, 141, paper, dark, -.12);
      line(ctx, [[55, 218], [227, 204], [328, 215]], accent, 6); break;
    }
    case 6: { // Paired mirrored emblems joined by a bold diagonal word ribbon.
      polygon(ctx, [[17, 49], [72, 25], [109, 41], [164, 21], [199, 42], [239, 25], [290, 42], [339, 23], [380, 54], [356, 102], [378, 160], [333, 196], [279, 182], [224, 213], [177, 188], [121, 212], [73, 188], [24, 202], [44, 141]], dark, accent, 5);
      circle(ctx, 105, 107, 73, secondary); circle(ctx, 296, 112, 73, accent);
      symbol(ctx, motif, 101, 105, .78, -.19);
      symbol(ctx, motif, 298, 111, .78, .19, true);
      polygon(ctx, [[45, 168], [341, 143], [360, 191], [63, 218]], paper, dark, 5);
      lettering(ctx, motif.tag, 203, 183, 35, 282, dark, paper, -.085);
      line(ctx, [[160, 65], [199, 50], [240, 68]], paper, 5); break;
    }
    case 7: { // Diamond wayfinding artwork, crossing arrows and corner tape.
      polygon(ctx, [[200, 14], [344, 117], [200, 222], [56, 117]], dark, paper, 6);
      polygon(ctx, [[200, 34], [319, 117], [200, 201], [81, 117]], secondary, accent, 4);
      line(ctx, [[26, 158], [60, 117], [36, 112], [60, 117], [65, 145]], accent, 9);
      line(ctx, [[374, 80], [340, 117], [365, 122], [340, 117], [337, 92]], accent, 9);
      symbol(ctx, motif, 200, 112, .88, -.04);
      for (const [x, y, rotation] of [[71, 45, -.5], [325, 186, -.5]] as const) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.fillStyle = paper; ctx.fillRect(-30, -8, 60, 16);
        line(ctx, [[-22, -4], [22, 4]], dark, 2); ctx.restore();
      }
      lettering(ctx, motif.tag, 200, 204, 28, 293, paper, dark);
      break;
    }
    case 8: { // Architectural arches, halftone panel and off-centre emblem.
      polygon(ctx, [[31, 196], [31, 85], [58, 45], [99, 25], [161, 28], [204, 65], [232, 30], [337, 39], [374, 198]], dark, paper, 3);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(134, 109, 79 - i * 13, Math.PI, 0); ctx.lineTo(213 - i * 13, 193);
        ctx.strokeStyle = i % 2 ? secondary : accent; ctx.lineWidth = 8; ctx.stroke();
      }
      for (let x = 260; x <= 350; x += 18) for (let y = 58; y <= 160; y += 18) circle(ctx, x, y, 2 + (x - 260) / 45, secondary);
      symbol(ctx, motif, 129, 129, .81, -.12);
      const words = motif.tag.split(" ");
      lettering(ctx, words[0], 290, 110, 33, 160, paper, dark, -.12);
      if (words.length > 1) lettering(ctx, words.slice(1).join(" "), 288, 145, 28, 160, paper, dark, -.12);
      polygon(ctx, [[37, 185], [370, 173], [359, 218], [46, 213]], accent, dark, 4);
      lettering(ctx, motif.phrase, 200, 197, 21, 313, paper, dark, -.035); break;
    }
    default: { // Floating illustration above a miniature skyline and roof tags.
      circle(ctx, 214, 102, 83, secondary, dark, 6);
      circle(ctx, 264, 53, 19, paper, dark, 3);
      line(ctx, [[48, 56], [120, 32], [161, 42]], accent, 6);
      line(ctx, [[278, 136], [345, 115], [371, 128]], accent, 5);
      symbol(ctx, motif, 209, 100, .91, .06);
      const skyline: [number, number][] = [[18, 221], [18, 154], [48, 154], [48, 129], [79, 129], [79, 172], [111, 172], [111, 147], [139, 147], [139, 175], [276, 175], [276, 148], [310, 148], [310, 130], [346, 130], [346, 164], [380, 164], [380, 221]];
      polygon(ctx, skyline, dark, paper, 2);
      ctx.fillStyle = accent;
      for (const x of [30, 55, 117, 284, 317, 351]) { ctx.fillRect(x, 180, 8, 12); ctx.fillRect(x, 200, 8, 10); }
      lettering(ctx, motif.tag, 208, 188, 35, 308, paper, dark, -.03);
      line(ctx, [[84, 221], [236, 213], [317, 218]], accent, 5); break;
    }
  }

  // Paint runs and small weathering scratches differ deterministically by motif.
  for (let i = 0; i < 4; i++) {
    const x = 63 + random() * 275, y = 192 + random() * 13, length = 8 + random() * 19;
    line(ctx, [[x, y], [x - .7, y + length]], i % 2 ? accent : dark, 1.2 + random() * 2);
    circle(ctx, x - .7, y + length, 1.8, i % 2 ? accent : dark);
  }
  ctx.globalAlpha = .3;
  for (let i = 0; i < 10; i++) {
    const x = 45 + random() * 310, y = 45 + random() * 152;
    line(ctx, [[x, y], [x + 3 + random() * 8, y - 1]], paper, .7);
  }
  ctx.restore();
}
