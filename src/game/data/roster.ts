import type { Element } from "./types";

type Base = { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };

export type RosterMon = {
  id: string;
  name: string;
  types: Element[];
  base: Base;
  moves: string[];
  catch: number;
  evo?: { id: string; level: number };
  sprite: string;
  where: string;
  blurb: string;
  rarity: Rarity;
  legendary?: boolean;
  district?: string;
};

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export type LegendDef = {
  id: string;
  name: string;
  types: Element[];
  district: string;
  where: string;
  blurb: string;
  base: Base;
  moves: string[];
  sig: string;
};

export const LEGENDS: LegendDef[] = [
  {
    id: "mon_kerboss",
    name: "Kerboss",
    types: ["normal", "dark"],
    district: "alley",
    where: "Gasse A. Bordstein, wenn die Lampen sterben",
    blurb:
      "Die Gasse hat einen König, und er wohnt im Bordstein. Kerboss tritt, wo du herkommst. Werte sitzen bei 95–100 — Lowtown biegt sich, fängt ihn aber ungern.",
    base: { hp: 98, atk: 108, def: 96, spa: 72, spd: 90, spe: 104 },
    moves: ["move_curbstomp", "move_nightslash", "move_slash", "move_howl"],
    sig: "move_curbstomp",
  },
  {
    id: "mon_kronkush",
    name: "Kronkush",
    types: ["grass", "fairy"],
    district: "yard",
    where: "Grow-Hinterhöfe. Hinter dem letzten Topf",
    blurb:
      "Was Grower nie ernten sollten. Die Blüte trägt eine Krone aus Harz. Ein Zug, und du weißt, warum die Stadt sie versteckt. Werte 95–100, immer.",
    base: { hp: 110, atk: 78, def: 92, spa: 112, spd: 108, spe: 80 },
    moves: ["move_godbloom", "move_solar", "move_sleepspore", "move_drainkiss"],
    sig: "move_godbloom",
  },
  {
    id: "mon_rootkaiser",
    name: "Rootkaiser",
    types: ["digital", "steel"],
    district: "cable",
    where: "Kabelkeller. Am wärmsten Port",
    blurb:
      "Root mit Krone. Wer ihn fängt, fängt das Netz mit. Static nennt ihn einen Witz. Der Witz beißt zurück. Werte 95–100, kein Wurf.",
    base: { hp: 94, atk: 88, def: 110, spa: 108, spd: 96, spe: 90 },
    moves: ["move_kernelpanic", "move_hack", "move_ironbite", "move_harden"],
    sig: "move_kernelpanic",
  },
  {
    id: "mon_glutarch",
    name: "Glutarch",
    types: ["fire", "dark"],
    district: "ash",
    where: "Aschegang. Wo die Kippen nie ausgehen",
    blurb:
      "Die letzte Glut der Stadt. Atmet Teer, spuckt Krone. Cinder kniet, wenn er kommt. Werte 95–100 — heiß, und sie bleiben heiß.",
    base: { hp: 92, atk: 104, def: 86, spa: 110, spd: 88, spe: 100 },
    moves: ["move_ashstorm", "move_overheat", "move_flamefang", "move_howl"],
    sig: "move_ashstorm",
  },
  {
    id: "mon_rohrlethe",
    name: "Rohrlethe",
    types: ["water", "ghost"],
    district: "drain",
    where: "Abfluss. Unter den Deckeln, die atmen",
    blurb:
      "Vergessen, das tropft. Wer ins Rohr sieht, sieht sich später wieder — nass, und ohne Namen. Werte 95–100, kalt wie Klärschlamm.",
    base: { hp: 118, atk: 72, def: 100, spa: 108, spd: 112, spe: 70 },
    moves: ["move_undertow", "move_hydro", "move_shadowball", "move_drip"],
    sig: "move_undertow",
  },
  {
    id: "mon_vialith",
    name: "Vialith",
    types: ["poison", "fairy"],
    district: "chem",
    where: "Chemiegasse. Im gelben Dampf",
    blurb:
      "Ein Glas, das leben wollte. Der Inhalt lächelt. Vial hat aufgehört zu messen. Werte 95–100 — süß, und danach nichts.",
    base: { hp: 96, atk: 80, def: 88, spa: 114, spd: 102, spe: 98 },
    moves: ["move_chemflood", "move_sludge", "move_dazzle", "move_toxic"],
    sig: "move_chemflood",
  },
  {
    id: "mon_cagekaiser",
    name: "Cagekaiser",
    types: ["fighting", "steel"],
    district: "ring",
    where: "Ring. Im Käfig, wenn niemand zählt",
    blurb:
      "Unbesiegt, weil der Käfig mitkämpft. Tape an den Zähnen, Krone aus Gitter. Knuckle sagt, er sei ein Gerücht. Das Gerücht schlägt zurück. Werte 95–100.",
    base: { hp: 100, atk: 118, def: 108, spa: 62, spd: 86, spe: 96 },
    moves: ["move_lastround", "move_crush", "move_steelram", "move_howl"],
    sig: "move_lastround",
  },
  {
    id: "mon_noxarch",
    name: "Noxarch",
    types: ["dark", "ghost"],
    district: "labyrinth",
    where: "Labyrinth-Schatten. Die Ecke, die nicht da ist",
    blurb:
      "Das Labyrinth hat einen Herrn. Er trägt kein Gesicht, nur die Stellen, wo Licht aufhört. Hush flüstert seinen Namen nicht. Werte 95–100, schwarz.",
    base: { hp: 94, atk: 96, def: 88, spa: 112, spd: 104, spe: 92 },
    moves: ["move_voidmaw", "move_darkpulse", "move_shadowclaw", "move_leer"],
    sig: "move_voidmaw",
  },
  {
    id: "mon_velouryx",
    name: "Velouryx",
    types: ["fairy", "psychic"],
    district: "nische",
    where: "Sex-Nischen. Hinter dem letzten Vorhang",
    blurb:
      "Samt, der denkt. Ein Blick, und du bleibst. Mira sagt, sie sei älter als Pink. Werte 95–100 — weich, und sie lassen nicht los.",
    base: { hp: 102, atk: 74, def: 90, spa: 116, spd: 110, spe: 88 },
    moves: ["move_pinkvoid", "move_dazzle", "move_psybeam", "move_seduce"],
    sig: "move_pinkvoid",
  },
  {
    id: "mon_slagodon",
    name: "Slagodon",
    types: ["steel", "fire"],
    district: "scrap",
    where: "Schrotttor. Unter dem Stapel, der atmet",
    blurb:
      "Ein Tor, das laufen lernte. Schlacke als Haut, Glut im Maul. Coil hat aufgehört zu schweißen, als er kam. Werte 95–100, schwer.",
    base: { hp: 116, atk: 110, def: 118, spa: 78, spd: 92, spe: 66 },
    moves: ["move_scrapfall", "move_steelram", "move_flamethrower", "move_harden"],
    sig: "move_scrapfall",
  },
];

const PARTS: Record<string, { pre: string[]; suf: string[]; t: Element; also: Element }> = {
  alley: {
    t: "normal",
    also: "poison",
    pre: [
      "Curb", "Trash", "Bin", "Neon", "Lamp", "Stick", "Pigeon", "Gutter", "Hood", "Block",
      "Graff", "Street", "Dump", "Alley", "Stray", "Slab", "Brick", "Grime", "Stain", "Crate",
    ],
    suf: ["rat", "ling", "pup", "mite", "bat", "fox", "hound", "cat", "worm", "slug", "moth", "brat", "punk", "bug", "spawn"],
  },
  yard: {
    t: "grass",
    also: "bug",
    pre: [
      "Sprout", "Thorn", "Spore", "Mold", "Resin", "Kief", "Haze", "Kush", "Soil", "Vine",
      "Bloom", "Sticky", "Green", "Bud", "Leaf", "Fern", "Moss", "Root", "Pod", "Weed",
    ],
    suf: ["rat", "ling", "pup", "mite", "bat", "fox", "hound", "cat", "worm", "slug", "moth", "bloom", "bud", "bug", "sprout"],
  },
  cable: {
    t: "digital",
    also: "electric",
    pre: [
      "Bit", "Byte", "Port", "Chip", "Glitch", "Hack", "Wire", "Ping", "Kernel", "Pixel",
      "Crash", "Packet", "Bot", "Virus", "Node", "Rack", "Plug", "Codec", "Cache", "Daemon",
    ],
    suf: ["rat", "ling", "pup", "mite", "bat", "fox", "hound", "cat", "bug", "bot", "node", "spark", "glitch", "worm", "spawn"],
  },
  ash: {
    t: "fire",
    also: "dark",
    pre: [
      "Ash", "Ember", "Cinder", "Burn", "Tar", "Smoke", "Coal", "Glow", "Spark", "Blaze",
      "Soot", "Match", "Flame", "Heat", "Scorch", "Kipp", "Brand", "Pyre", "Char", "Fume",
    ],
    suf: ["rat", "ling", "pup", "mite", "bat", "fox", "hound", "cat", "worm", "moth", "spark", "fang", "brat", "bug", "spawn"],
  },
  drain: {
    t: "water",
    also: "poison",
    pre: [
      "Drip", "Pipe", "Sludge", "Fog", "Murk", "Eel", "Carp", "Leak", "Drain", "Wet",
      "Sewer", "Foam", "Milk", "Damp", "Grate", "Tide", "Sump", "Rill", "Puddle", "Valve",
    ],
    suf: ["rat", "ling", "pup", "mite", "bat", "fox", "hound", "cat", "eel", "toad", "slug", "moth", "drip", "bug", "spawn"],
  },
  chem: {
    t: "poison",
    also: "bug",
    pre: [
      "Vial", "Fume", "Acid", "Toxin", "Slime", "Crack", "Spill", "Yellow", "Flask", "Synth",
      "Lab", "Rash", "Waste", "Goop", "Fizz", "Gunk", "Dreg", "Vape", "Mist", "Brew",
    ],
    suf: ["rat", "ling", "pup", "mite", "bat", "fox", "hound", "cat", "worm", "slug", "moth", "ooze", "bug", "spawn", "brat"],
  },
  ring: {
    t: "fighting",
    also: "dark",
    pre: [
      "Fist", "Kick", "Tape", "Cage", "Scar", "Punch", "Bruise", "Pit", "Blood", "Knuck",
      "Jaw", "Rib", "Crowd", "Belt", "Hook", "Guard", "Chin", "Brawl", "Lock", "Slam",
    ],
    suf: ["rat", "ling", "pup", "mite", "bat", "fox", "hound", "cat", "fist", "kick", "brat", "punk", "bug", "spawn", "jaw"],
  },
  labyrinth: {
    t: "dark",
    also: "ghost",
    pre: [
      "Shade", "Dusk", "Void", "Mask", "Deal", "Crow", "Night", "Whisper", "Blade", "Fog",
      "Silent", "Gloom", "Hush", "Wraith", "Hex", "Murk", "Veil", "Crypt", "Dread", "Hollow",
    ],
    suf: ["rat", "ling", "pup", "mite", "bat", "fox", "hound", "cat", "wraith", "shade", "moth", "bug", "spawn", "veil", "crow"],
  },
  nische: {
    t: "fairy",
    also: "psychic",
    pre: [
      "Velvet", "Kiss", "Lip", "Pink", "Lust", "Silk", "Lace", "Scent", "Moan", "Pulse",
      "Soft", "Heat", "Gaze", "Veil", "Sugar", "Blush", "Satin", "Rouge", "Honey", "Muse",
    ],
    suf: ["rat", "ling", "pup", "mite", "bat", "fox", "hound", "cat", "kiss", "veil", "moth", "bug", "spawn", "gaze", "bloom"],
  },
  scrap: {
    t: "steel",
    also: "electric",
    pre: [
      "Rust", "Slag", "Bolt", "Gear", "Scrap", "Plate", "Nail", "Wire", "Magnet", "Can",
      "Junk", "Chrome", "Weld", "Spike", "Iron", "Cog", "Rivet", "Tin", "Forge", "Clamp",
    ],
    suf: ["rat", "ling", "pup", "mite", "bat", "fox", "hound", "cat", "cog", "spike", "bug", "spawn", "claw", "worm", "brat"],
  },
};

const WANDER_SEWER = [
  "Grimerat", "Pipeworm", "Sludgetoad", "Drainslug", "Murkeel", "Foampup", "Dampmite", "Wetbat",
  "Leakfox", "Sewermoth", "Grimehound", "Pipebug", "Sludgeling", "Drainfox", "Murkbat", "Foamling",
  "Dampfox", "Wetling", "Sewerpup", "Grateworm", "Clagrats", "Sumpmite", "Valvebat", "Rillfox",
];

const WANDER_MARKET = [
  "Stallrat", "Vendorpup", "Coinmite", "Goldbat", "Dealercat", "Stallhound", "Vendorling", "Coinbat",
  "Goldmite", "Dealermite", "Stallfox", "Vendorbat", "Coinhound", "Goldling", "Stallmite", "Vendorfox", "Coinpup",
  "Hawkerpup", "Tinkmite", "Stallbug", "Barterfox",
];

const TAKEN = new Set([
  "budling", "lustleaf", "glitchbitch", "datawhore", "neonpunx", "gridbruiser", "hashound",
  "puffpuff", "jointail", "hackroach", "cracksprite", "firewallf", "cumulus",
  "kerbite", "moosling", "portcrab", "ashrat", "schlickpup", "vialworm",
  "tapepup", "noxling", "velvetfox", "rusttooth", "graterat", "coinbat",
  "dumpsterpup", "harzling", "wiremite", "glutmoth", "rohrling", "fumemoth",
  "knuckrat", "shadefox", "lacebat", "slagpup", "foambat", "stallfox",
  "kerbstomp", "binmaw", "moosback", "cinderfang", "schlickhound", "tapedog",
  "racklurk", "knuckbrute", "gratehound", "coinwraith", "slagjaw", "hawkerfox",
  "kiefhound", "puffwraith", "blazetail", "rootroach", "crackveil", "portwolf",
  "fogbank", "dockclaw", "flaskwyrm", "velourfox", "rustmaw", "harzback",
  "lampjell", "curbowl", "tarslug", "plugeel", "lidtoad", "spilleye",
  "gongling", "maskwisp", "lipkrait", "magtick", "valvekoi", "pricecrow",
  "grafface", "pitmaw", "pothead", "rackfan", "matchimp", "fatcandle",
  "fizzcap", "stoolpad", "keywisp", "boothdrape", "anvilant", "bubstack", "hangscale",
  "curbcone", "neonarrow", "clipin", "heatsink", "ashpan", "ypipe",
  "glovepair", "taperoll", "deadend", "spotlamp", "weldmask", "drainplug",
  "callbox", "hydrant", "growbulb", "patchcoil", "flicker", "plunger",
  "beakerling", "gumguard", "shardtile", "heelsole", "crushcan", "tidegauge",
  "parkmeter", "newsbox", "sprinkler", "bladeu", "cigpack", "seatring",
  "pipette", "belltimer", "compass", "compact", "jerrycan", "floatball",
  "letterbox", "bollard", "shears", "switchbox", "matchbook", "shutoff",
  "goggles", "speedbag", "yarnball", "choker", "vicegrip", "soapbar",
  "padlock", "drumcan", "watercan", "powerbrick", "rizla", "loobrush",
  "bunsen", "boxglove", "doorknob", "garter", "wrench", "gratecover",
  "stoplight", "ladder", "humidifier", "usbstick", "roachclip", "faucet",
  "mortar", "jumprope", "lantern", "fishnet", "bolt", "sumpump",
  "streetlamp", "spraycan", "phmeter", "keycap", "bong", "ubend",
  "teststrip", "heavybag", "mapscrap", "whip", "circsaw", "tidegate",
  "sawhorse", "gutter", "growtimer", "mouse", "grinder", "squeegee",
  "funnel", "headgear", "chalk", "cuff", "weldtorch", "lifering",
  "cautiontape", "pallet", "co2tank", "webcam", "rolltray", "mop",
  "stirrer", "ringrope", "hourglass", "eyeliner", "crowbar", "anchor",
  "milkcrate", "bikechain", "carbonfilter", "harddrive", "dugout", "stopper",
  "centrifuge", "mouthguard", "skeletonkey", "hairpin", "hammer", "barnacle",
  "shoppingcart", "cinderblock", "hygrometer", "modem", "dispo", "bucket",
  "tongs", "whistle", "mirror", "perfume", "metalfile", "mussel",
  "trashbag", "bicycle", "soilbag", "upsbox", "smokepipe", "drainsnake",
  "hotplate", "rosin", "keyring", "blindfold", "screwdriver", "tire",
  "scaffold", "brokenbottle", "netpot", "ramstick", "doobtube", "bleach",
  "clamp", "kneepad", "footprint", "handfan", "drill", "hook",
  "barricade", "shoppingbag", "clonedome", "pcicard", "lighterfluid", "hairclump",
  "condenser", "handwrap", "cobweb", "lacetrim", "rivetgun", "pipeflange",
  "styrofoam", "graffstencil", "rockwool", "cmosbat", "hempwick", "limescale",
  "watchglass", "icepack", "dustbunny", "stocking", "magnet", "sludge",
  "cardboard", "umbrella", "nutribottle", "cddrive", "cigbutt", "sponge",
  "spatula", "towel", "mousetrap", "nailpolish", "gear", "leech",
  "pizzabox", "ulock", "airpump", "keyboard", "zippo", "showerhead",
  "crucible", "turnbuckle", "hinge", "hairdryer", "calipers", "driftwood",
  "takeoutbox", "hubcap", "spraybottle", "floppy", "cigarcutter", "toiletpaper",
  "gradcylinder", "titlebelt", "flashlight", "eyelashcurler", "sparkplug", "buoy",
  "newspaper", "satdish", "trowel", "cassette", "snustin", "toothpaste",
  "petridish", "kettlebell", "knocker", "hairbrush", "oilcan", "manhole",
  "licenseplate", "boxfan", "seedtray", "powerstrip", "rollmachine", "razor",
  "blisterpack", "dumbbell", "pocketwatch", "sunglasses", "hacksaw", "wellie",
  "wiperblade", "awning", "airstone", "vhs", "filtertip", "bathbomb",
  "ampoule", "weightplate", "loupe", "curlingiron", "allenkey", "oar",
  "kickstand", "brick", "trellis", "headset", "butanecan", "loofah",
  "desiccator", "focusmitt", "metronome", "martini", "chisel", "cleat",
  "bikebell", "windowac", "thermometer", "cpu", "cigarbox", "rubberduck",
  "reagent", "roundcard", "spyglass", "lipstick", "mallet", "flipflop",
  "rebar", "clothespin", "hosereel", "rj45", "clipper", "nailclipper",
  "burette", "medicineball", "inkwell", "powderpuff", "tapemeasure", "seaweed",
  "shutter", "radiator", "bamboo", "dongle", "eliquid", "deodorant",
  "separatory", "shaker", "locket", "comb", "anglegrinder", "bobber",
  "wheelclamp", "downspout", "heatmat", "crt", "boxmod", "qtip",
  "dewar", "sweatband", "waxseal", "wig", "level", "gaff",
  "tarp", "antenna", "yoyohanger", "ribboncable", "pipetool", "floss",
  "eyewash", "shinpad", "quill", "boa", "greasegun", "clamshell",
  ...LEGENDS.map((l) => l.name.toLowerCase()),
]);

const TYPE_MOVES: Record<Element, { phys: string[]; spec: string[]; stat: string[] }> = {
  normal: { phys: ["move_tackle", "move_scratch", "move_slash"], spec: ["move_hyperbeam"], stat: ["move_leer", "move_growl"] },
  grass: { phys: ["move_thornjab", "move_seedshot"], spec: ["move_solar", "move_seedshot"], stat: ["move_sleepspore"] },
  fire: { phys: ["move_flamefang"], spec: ["move_ember", "move_flamethrower", "move_overheat"], stat: ["move_howl"] },
  water: { phys: ["move_aquajaw"], spec: ["move_drip", "move_bubble", "move_hydro"], stat: ["move_leer"] },
  poison: { phys: ["move_poisonjab"], spec: ["move_smogbreath", "move_acid", "move_sludge", "move_highcloud"], stat: ["move_toxic"] },
  fighting: { phys: ["move_punch", "move_crush", "move_streetkick", "move_crownkick"], spec: ["move_ember"], stat: ["move_howl"] },
  dark: { phys: ["move_bite", "move_nightslash", "move_streetkick"], spec: ["move_darkpulse", "move_voidmaw"], stat: ["move_leer"] },
  fairy: { phys: ["move_playrough"], spec: ["move_drainkiss", "move_dazzle"], stat: ["move_flirt", "move_seduce"] },
  digital: { phys: ["move_scratch"], spec: ["move_glitchgaze", "move_hack", "move_overflow"], stat: ["move_leer"] },
  steel: { phys: ["move_ironbite", "move_gridslam", "move_steelram"], spec: ["move_hack"], stat: ["move_harden"] },
  psychic: { phys: ["move_scratch"], spec: ["move_psybeam", "move_mindbreak"], stat: ["move_flirt"] },
  bug: { phys: ["move_bugbite", "move_mandible"], spec: ["move_bugbuzz"], stat: ["move_leer"] },
  ghost: { phys: ["move_shadowclaw", "move_hexbite"], spec: ["move_shadowball"], stat: ["move_leer"] },
  electric: { phys: ["move_sparkfist"], spec: ["move_staticshock", "move_shock", "move_discharge"], stat: ["move_agility"] },
};

const BLURB: Record<string, string[]> = {
  normal: [
    "Gassenvieh. Frisst Rest und Gerücht. Lowtown zählt es nicht.",
    "Zu gewöhnlich für einen Namen, zu hart für den Bordstein.",
    "Läuft, wo die Lampen sterben. Beißt, wo niemand guckt.",
  ],
  grass: [
    "Keimt im Beton. Lowtown gießt mit Bier und vergisst zu schneiden.",
    "Grün, wo nichts wachsen darf. Der Duft bleibt in der Jacke.",
    "Eine Pflanze mit Zähnen. Grower fluchen, Fänger auch.",
  ],
  fire: [
    "Glimmt wie eine schlecht gedrehte Kippe. Nicht pusten.",
    "Asche an den Zähnen, Glut im Blick. Die Gasse wird warm.",
    "Ein Funke mit Beinen. Cinder kennt die Familie.",
  ],
  water: [
    "Nass auf die falsche Art. Tropft, wo Deckel fehlen.",
    "Kommt aus Rohren, die atmen. Bleibt klebrig.",
    "Die Kläranlage hat Haustiere. Das hier ist eins.",
  ],
  poison: [
    "Gelber Dampf mit Augen. Die Gasse hustet mit.",
    "Klebt. Wer fasst, schmeckt Metall bis morgen.",
    "Ein Husten, der laufen lernte. Fume nickt anerkennend.",
  ],
  fighting: [
    "Tape an den Knöcheln, Licht in den Rissen. Tritt zuerst.",
    "Der Ring spuckt solche raus. Manche kommen wieder.",
    "Narben wie Sticker. Bolt mag ihn nicht. Die Straße schon.",
  ],
  dark: [
    "Wohnt in der Ecke, die nicht auf der Karte steht.",
    "Folgt dem, der zu leise geht. Die Zähne sind höflich.",
    "Unlicht pur. Wer folgt, wird mitgezählt.",
  ],
  fairy: [
    "Zu weich für die Gasse, zu scharf für das Bett.",
    "Pinklicht mit Zähnen. Mira sagt, nicht anfassen. Zu spät.",
    "Ein Kuss, und der Dex setzt einen Takt aus.",
  ],
  digital: [
    "Frisst Kabel, spuckt Exploit. Static hat schon schlimmere gesehen.",
    "Wohnt in toten Ports. Ein Blick, und der Screen lügt.",
    "Hex in Laufschritten. Bolt zertritt ihn. Er kommt wieder.",
  ],
  steel: [
    "Blech, das beißt. Das Schrotttor kennt den Klang.",
    "Schrauben statt Zähne. Füttern mit fremden Schlüsseln.",
    "Rost ist nur eine Meinung. Die Kante bleibt.",
  ],
  psychic: [
    "Denkt lauter als du. Die Stirn wird warm.",
    "Ein Gedanke mit Beinen. Silk würde ihn verkaufen.",
    "Kennt den Namen, den du nie eingegeben hast.",
  ],
  bug: [
    "Krabbelt, wo es knackt. Lowtown hat viele Beine.",
    "Panzer aus Dreck. Zertritt ihn — er hat Cousins.",
    "Summt in Frequenzen, die Zähne kitzeln.",
  ],
  ghost: [
    "War schon da, bevor der Deckel zu war.",
    "Keine Haut, nur die Stelle, wo Licht aufhört.",
    "Folgt durch Wände. Die Matratze merkt sich das.",
  ],
  electric: [
    "Kurzschluss mit Augen. Die Laterne stottert, wenn er kommt.",
    "Ein Funke, der nicht nach Hause will.",
    "Beißt in Ports. Static nennt das Teamarbeit.",
  ],
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: T[], n: number): T {
  return arr[Math.abs(n) % arr.length]!;
}

function title(pre: string, suf: string): string {
  return pre + suf.charAt(0).toUpperCase() + suf.slice(1);
}

function namesFor(district: string, need: number): string[] {
  const p = PARTS[district];
  const out: string[] = [];
  const seen = new Set<string>();
  let i = 0;
  while (out.length < need && i < 800) {
    const pre = p.pre[i % p.pre.length]!;
    const suf = p.suf[Math.floor(i / p.pre.length + i * 3) % p.suf.length]!;
    const name = title(pre, suf);
    const slug = name.toLowerCase();
    i += 1;
    if (slug.length < 5 || slug.length > 14) continue;
    if (TAKEN.has(slug) || seen.has(slug)) continue;
    if (pre.toLowerCase() === suf) continue;
    seen.add(slug);
    TAKEN.add(slug);
    out.push(name);
  }
  let extra = 0;
  while (out.length < need) {
    extra += 1;
    const pretty = `${district.charAt(0).toUpperCase()}${district.slice(1)}kin${extra}`;
    const slug = pretty.toLowerCase();
    if (TAKEN.has(slug)) continue;
    TAKEN.add(slug);
    out.push(pretty);
    if (extra > 200) break;
  }
  return out;
}

function movesFor(types: Element[], rarity: Rarity, slug: string): string[] {
  const a = TYPE_MOVES[types[0]!] ?? TYPE_MOVES.normal;
  const b = TYPE_MOVES[types[1] ?? types[0]!] ?? a;
  const n = hash(slug);
  const phys = pick([...a.phys, ...b.phys], n);
  const spec = pick([...a.spec, ...b.spec], n >> 3);
  const stat = pick([...a.stat, ...b.stat], n >> 7);
  const extra =
    rarity === "rare" || rarity === "legendary"
      ? pick([...a.spec, ...b.phys, "move_slash"], n >> 11)
      : pick(["move_tackle", "move_scratch", "move_leer"], n >> 11);
  const uniq = Array.from(new Set([phys, spec, stat, extra]));
  while (uniq.length < 4) uniq.push("move_tackle");
  return uniq.slice(0, 4);
}

function baseFor(rarity: Rarity, role: number, slug: string): RosterMon["base"] {
  const n = hash(slug);
  const spread = (i: number, mid: number, w: number) => mid + ((n >> (i * 3)) % (w * 2 + 1)) - w;
  if (rarity === "common") {
    const bag = [spread(0, 48, 8), spread(1, 52, 10), spread(2, 46, 8), spread(3, 50, 10), spread(4, 48, 8), spread(5, 50, 12)];
    bag[role % 6] += 8;
    return { hp: bag[0]!, atk: bag[1]!, def: bag[2]!, spa: bag[3]!, spd: bag[4]!, spe: bag[5]! };
  }
  if (rarity === "uncommon") {
    const bag = [spread(0, 58, 8), spread(1, 62, 10), spread(2, 56, 8), spread(3, 60, 10), spread(4, 58, 8), spread(5, 62, 12)];
    bag[role % 6] += 10;
    return { hp: bag[0]!, atk: bag[1]!, def: bag[2]!, spa: bag[3]!, spd: bag[4]!, spe: bag[5]! };
  }
  const bag = [spread(0, 72, 8), spread(1, 78, 10), spread(2, 70, 8), spread(3, 76, 10), spread(4, 72, 8), spread(5, 74, 12)];
  bag[role % 6] += 12;
  return { hp: bag[0]!, atk: bag[1]!, def: bag[2]!, spa: bag[3]!, spd: bag[4]!, spe: bag[5]! };
}

function catchFor(rarity: Rarity): number {
  if (rarity === "legendary") return 6;
  if (rarity === "rare") return 28;
  if (rarity === "uncommon") return 45;
  return 62;
}

function whereFor(district: string, rarity: Rarity): string {
  const names: Record<string, string> = {
    alley: "Gasse A",
    yard: "Grow-Hinterhöfe",
    cable: "Kabelkeller",
    ash: "Aschegang",
    drain: "Abfluss",
    chem: "Chemiegasse",
    ring: "Ring",
    labyrinth: "Labyrinth-Schatten",
    nische: "Sex-Nischen",
    scrap: "Schrotttor",
    sewer: "Kanal",
    market: "Markt",
  };
  const n = names[district] ?? district;
  if (rarity === "legendary") return `${n}. Legendär — Werte 95–100`;
  if (rarity === "rare") return `${n}. Selten, oft nach der Evolution`;
  return n;
}

function blurbFor(types: Element[], slug: string): string {
  const pool = BLURB[types[0]!] ?? BLURB.normal;
  return pick(pool, hash(slug));
}

function makeOne(
  name: string,
  district: string,
  types: Element[],
  rarity: Rarity,
  role: number,
): RosterMon {
  const slug = name.toLowerCase();
  return {
    id: `mon_${slug}`,
    name,
    types,
    base: baseFor(rarity, role, slug),
    moves: movesFor(types, rarity, slug),
    catch: catchFor(rarity),
    sprite: slug,
    where: whereFor(district, rarity),
    blurb: blurbFor(types, slug),
    rarity,
    legendary: rarity === "legendary",
    district,
  };
}

function secondType(district: string, i: number): Element {
  const p = PARTS[district];
  if (!p) return "normal";
  return i % 3 === 0 ? p.t : i % 3 === 1 ? p.also : p.t;
}

function buildDistrict(district: string): RosterMon[] {
  const names = namesFor(district, 36);
  const p = PARTS[district]!;
  const out: RosterMon[] = [];
  // 7 pairs (14), 2 triples (6), 16 standalone
  const used = new Set<number>();
  const take = (i: number, rarity: Rarity, types: Element[]) => {
    used.add(i);
    return makeOne(names[i]!, district, types, rarity, i);
  };

  for (let k = 0; k < 7; k++) {
    const a = k * 2;
    const b = a + 1;
    const types: Element[] = k % 2 === 0 ? [p.t] : [p.t, p.also];
    const baby = take(a, "common", types);
    const evo = take(b, "rare", types.length > 1 ? types : [p.t, p.also]);
    baby.evo = { id: evo.id, level: 16 + (k % 4) };
    out.push(baby, evo);
  }
  for (let t = 0; t < 2; t++) {
    const a = 14 + t * 3;
    const types: Element[] = [p.t, p.also];
    const baby = take(a, "common", [p.t]);
    const mid = take(a + 1, "uncommon", types);
    const fin = take(a + 2, "rare", types);
    baby.evo = { id: mid.id, level: 14 };
    mid.evo = { id: fin.id, level: 30 };
    out.push(baby, mid, fin);
  }
  for (let i = 0; i < 36; i++) {
    if (used.has(i)) continue;
    const rarity: Rarity = i % 5 === 0 ? "uncommon" : "common";
    out.push(take(i, rarity, [secondType(district, i)]));
  }
  return out;
}

function wanderers(): RosterMon[] {
  const out: RosterMon[] = [];
  for (const name of WANDER_SEWER) {
    const slug = name.toLowerCase();
    if (TAKEN.has(slug)) continue;
    TAKEN.add(slug);
    const types: Element[] = hash(slug) % 2 === 0 ? ["water", "poison"] : ["poison", "dark"];
    out.push(makeOne(name, "sewer", types, hash(slug) % 4 === 0 ? "uncommon" : "common", hash(slug)));
  }
  for (const name of WANDER_MARKET) {
    const slug = name.toLowerCase();
    if (TAKEN.has(slug)) continue;
    TAKEN.add(slug);
    const bag: Element[] = ["normal", "fairy", "dark", "fighting", "digital"];
    const types: Element[] = [pick(bag, hash(slug)), pick(bag, hash(slug) >> 4)];
    if (types[0] === types[1]) types.pop();
    out.push(makeOne(name, "market", types, hash(slug) % 3 === 0 ? "uncommon" : "common", hash(slug)));
  }
  return out;
}

function legendRosterMon(): RosterMon[] {
  return LEGENDS.map((l) => ({
    id: l.id,
    name: l.name,
    types: l.types,
    base: l.base,
    moves: l.moves,
    catch: 6,
    sprite: l.id.replace("mon_", ""),
    where: l.where,
    blurb: l.blurb,
    rarity: "legendary" as const,
    legendary: true,
    district: l.district,
  }));
}

export function buildRoster(): RosterMon[] {
  const districts = Object.keys(PARTS);
  const list: RosterMon[] = [];
  for (const d of districts) list.push(...buildDistrict(d));
  list.push(...wanderers());
  list.push(...legendRosterMon());
  const ids = new Set(list.map((s) => s.id));
  if (ids.size !== list.length) throw new Error("roster: duplicate ids");
  return list;
}

export const LEGENDARY_IDS = LEGENDS.map((l) => l.id);

export const DISTRICT_HOME: Record<string, string> = {
  alley: "Gasse A",
  yard: "Grow-Hinterhöfe",
  cable: "Kabelkeller",
  ash: "Aschegang",
  drain: "Abfluss",
  chem: "Chemiegasse",
  ring: "Ring",
  labyrinth: "Labyrinth-Schatten",
  nische: "Sex-Nischen",
  scrap: "Schrotttor",
  sewer: "Kanal",
  market: "Markt",
};
