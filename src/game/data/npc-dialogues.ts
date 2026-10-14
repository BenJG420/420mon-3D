// Dialogue copied from the original 2D talkNpc/talk* methods.
// Source: BenJG420/420mon src/game/runtime.ts:1074–1289 and 2631–2641 (010807da77df).
// Quest rewards and interactive choices are handled by the caller. These lines
// do not implement trainers, radio, support payments or Can's achievement book.
export type NpcDialogue = {
  name?: string;
  lines: string[];
  questIds?: string[];
};

export const NPC_DIALOGUES: Record<string, NpcDialogue> = {
  "bolt": {
    "name": "Bolt",
    "lines": [
      "Bolt mustert deine Taschen.",
      "Bolt: Willst durch zum Markt, zahl mit einem Junk-Chip. Ich schließ den Riegel.",
      "Bolt: Und bleib weg von den Gullis. Da unten kommt keiner sauber wieder raus."
    ],
    "questIds": [
      "q1_bolt",
      "q3_trash"
    ]
  },
  "static": {
    "name": "Static",
    "lines": [
      "> STATIC: ICH BRAUCH DEN STICK AUS DEN TONNEN.",
      "> FINDE IHN. DANN REDE."
    ],
    "questIds": [
      "q9_static",
      "q_leg"
    ]
  },
  "felix": {
    "name": "Felix",
    "lines": [
      "Felix: Ist das Marihuana? Darf ich mal ziehen?",
      "Felix: Ich könnte Arbeit gebrauchen. Soll ich dir beim Growen helfen?"
    ]
  },
  "rajko": {
    "name": "Rajko",
    "lines": [
      "Rajko dreht am Filter. Der Bass aus den Türmen frisst die Kapselwand.",
      "Rajko: Neuer Takt läuft draußen. Lowtown liegt auf dem anderen Kanal — wenn du den alten willst."
    ]
  },
  "can": {
    "name": "Can",
    "lines": [
      "Can lehnt am Regal. Die Krone sitzt schief, das Buch nicht.",
      "Can: Ich bin der Erfolge-König. Vierhundertzwanzig Seiten. Ich kenn jede."
    ]
  },
  "ben": {
    "name": "Ben",
    "lines": [
      "Ben: Kasse im Keller.",
      "Freiwillig. Kein Zufall. Die Items stehen vorher fest."
    ],
    "questIds": [
      "q_ben"
    ]
  },
  "silk_den": {
    "name": "Silk",
    "lines": [
      "Silk lächelt zu breit. Goldzahn.",
      "Silk: Mein Stick. Markt — Kisten, Fässer, Stände. Bring ihn. Dann kalibrier ich deine Chips. Für immer. Kronen-Chip eine Million, sitzt immer. Oder verkauf Bud, der nicht Ordinary heißt."
    ],
    "questIds": [
      "q5_silk",
      "q_v_market"
    ]
  },
  "raze": {
    "name": "Raze",
    "lines": [
      "Raze sitzt zwischen Fässern. Die Bude stinkt nach Glut.",
      "Raze: Junk-Chips liegen in den Tonnen. Bolt nimmt einen als Maut.",
      "Raze: Gossen-Chip nur in der Gasse. Silk hat den nicht.",
      "Raze: Silk sucht den eigenen Stick am Markt. Static den aus den Tonnen. Nicht denselben.",
      "Raze: Zu faul für Bolt? Gullideckel. Unter der Straße hängen alle Kieze."
    ]
  },
  "mira": {
    "name": "Mira",
    "lines": [
      "Mira sitzt auf der Matte. Die Tür fällt ins Schloss.",
      "Mira: Matratzen zahlen. Pinke Nischen weiter ost, wenn Bolt nickt.",
      "Mira: Wer ohne Stoff läuft, den zählt die Stadt anders. Mehr sag ich nicht."
    ],
    "questIds": [
      "q8_mattress",
      "q_k_nische"
    ]
  },
  "drip": {
    "name": "Drip",
    "lines": [
      "Drip schüttelt Wasser aus dem Ärmel.",
      "Drip: Abfluss südlich. Maul, dann runter. Gulli erst ganz hinten."
    ],
    "questIds": [
      "q_k_drain"
    ]
  },
  "vex": {
    "name": "Vex",
    "lines": [
      "Vex knackt die Finger.",
      "Vex: Ring südlich. Neonpunx tanzt, wenn die Lampen stottern. Tritt oder geh."
    ]
  },
  "nox": {
    "name": "Nox",
    "lines": [
      "Nox riecht nach Lösungsmittel.",
      "Nox: Chemiegasse. Gelber Dampf. Fässer nicht küssen."
    ]
  },
  "cherry": {
    "name": "Cherry",
    "lines": [
      "Cherry zwinkert zu langsam. Innen ist es warmer als draußen.",
      "Cherry: Sex-Nischen. Pink. Matratzen, Samt-Tropfen, Scham-Chip. Gucken kostet."
    ]
  },
  "kite": {
    "name": "Kite",
    "lines": [
      "Kite zeigt mit dem Kinn die Gasse runter.",
      "Kite: Schilder vor den Löchern. Jeder Typ eine Straße. Mini-Map kennt sie."
    ]
  },
  "ash": {
    "name": "Ash",
    "lines": [
      "Ash klopft Asche vom Stiefel.",
      "Ash: Aschegang glimmt. Glutkohle und Glut-Chip in den Fässern. Nicht pusten."
    ]
  },
  "hex": {
    "name": "Hex",
    "lines": [
      "> HEX: KELLERLUKE HIER. WARME PORTS.",
      "> KALTE GÄNGE. HEISSE RACKS. SÜDEN FUNKT — UNTER DEN BODEN, WENN DU MUSST.",
      "> PORT-CHIP IN DEN TERMINALS. ROOTKAISER AM PDU, MONTAG ABEND."
    ],
    "questIds": [
      "q_k_alley",
      "q_k_3",
      "q_k_cable"
    ]
  },
  "nix": {
    "name": "Nix",
    "lines": [
      "Nix versperrt halb den Gang. Narben wie Stempel.",
      "Nix: Silk vorne — will ihren Stick. Static Mitte, Cherry hinten. Vex will Prügel."
    ]
  },
  "jax": {
    "name": "Jax",
    "lines": [
      "Jax klopft gegen Blech.",
      "Jax: Schrotttor. Firewallf beißt Ports. Blech-Chip im Rack."
    ],
    "questIds": [
      "q_k_scrap"
    ]
  },
  "lumen": {
    "name": "Lumen",
    "lines": [
      "Lumen hat Erde unter den Nägeln.",
      "Lumen: Hinterhof. Töpfe. Moos-Steckling und Blatt-Chip im Dreck, nicht bei Silk."
    ]
  },
  "pex": {
    "name": "Pex",
    "lines": [
      "Pex hustet gelb.",
      "Pex: Chemiegasse. Gelber Sud in den Fässern. Bleib nicht lange."
    ]
  },
  "sable": {
    "name": "Sable",
    "lines": [
      "Sable steht, wo kein Licht hinwill.",
      "Sable: Labyrinth. Schatten-Chip in den Kisten. Wer folgt, wird Log."
    ]
  },
  "rook": {
    "name": "Rook",
    "lines": [
      "Rook hat Tape an den Knöcheln.",
      "Rook: Ring. Käfig-Tape wickelt Wunden. Knöchel-Chip in den Kisten."
    ]
  },
  "moss": {
    "name": "Moss",
    "lines": [
      "Moss wäscht sich die Hände an einem Blatt. Grün bleibt.",
      "Moss: Töpfe, Unkraut, Budling. Wer schneidet, bleibt. Wer wartet, wird Lustleaf.",
      "Moss: Moos-Steckling und Blatt-Chip in den Töpfen. Silk hat die nicht.",
      "Moss: Der Rest steht am Markt. Grow-Shop. Indica beißt, Sativa läuft, Hybrid würfelt."
    ],
    "questIds": [
      "q_k_yard"
    ]
  },
  "root": {
    "name": "Root",
    "lines": [
      "> ROOT: PAKETE STERBEN HIER.",
      "> ROACH FRISST KABEL. PORT-CHIP IN DEN TERMINALS.",
      "> OST-LUKE: KANAL. WEST: GASSE. PDU NORDEN — WARMSTER PORT."
    ]
  },
  "grate": {
    "name": "Grime",
    "lines": [
      "Grime tropft vom Gitter.",
      "Grime: Jede Luke ein Schild. Nass-Chip nur hier unten. Bolt sieht dich nicht."
    ]
  },
  "ember": {
    "name": "Ember",
    "lines": [
      "Ember dreht eine Kippe an einem Gitter an. Der Filter glüht zu lang.",
      "Ember: Drei Wege. Mitte will Prügel. Links wird kalt. Rechts bleiben die Fässer heiß.",
      "Ember: Jointail nur wo's glimmt. Glutkohle in den Fässern. Nicht pusten, wenn der Rost atmet."
    ],
    "questIds": [
      "q_k_ash"
    ]
  },
  "murk": {
    "name": "Murk",
    "lines": [
      "Murk tropft. Die Stimme kommt aus einem Rohr.",
      "Murk: Treppe runter. Ein Steg, nicht drei. Die anderen liegen im Wasser.",
      "Murk: Tide am Süd-Ufer. Gulli erst im Pumpenhaus. Klär-Phiole in den Nassfässern."
    ]
  },
  "leck": {
    "name": "Leck",
    "lines": [
      "Jemand hockt hinterm Rechen. Nasse Haare, kein Name.",
      "Leck: Tide sieht nach Osten. Wer im Schlick kriecht, den sieht er nicht.",
      "Leck: Der Deckel in der Mitte atmet. Nicht hineinfallen. Hineinsehen reicht."
    ]
  },
  "fume": {
    "name": "Fume",
    "lines": [
      "Fume hat gelbe Zähne und lacht nicht.",
      "Fume: Gänge sind trocken. Dampf beißt. Ost ist Glas — da ist nichts Gelbes, außer dem Schild.",
      "Fume: Vial vor der Destille. Sud in den West-Fässern. Gulli hier vorn, wenn dir die Nase reicht."
    ]
  },
  "cage": {
    "name": "Cage",
    "lines": [
      "Cage lehnt am Gitter. Narben wie Sticker.",
      "Cage: Umgang ist trocken. Drin ist Kreide. Ost ist Treppe — da zählt Knuckle nicht.",
      "Cage: Tape und Chip in der Umkleide. Gulli unter der Dusche. Freitagabend: nicht zählen."
    ]
  },
  "shade": {
    "name": "Shade",
    "lines": [
      "Shade steht, wo kein Licht hinwill.",
      "Shade: Immer Ecken. Nie gerade. Hush steht in der Ost-Säule — West rum, wenn du ihn nicht willst.",
      "Shade: Die Ecke oben rechts ist nicht da. Samstagfrüh ist sie da. Chip in den Kisten."
    ]
  },
  "velvet": {
    "name": "Velvet",
    "lines": [
      "Velvet zieht den Vorhang einen Fingerbreit. Pink.",
      "Velvet: Kabinen links, Kabinen rechts. Gang ist trocken. Letzter Vorhang ganz hinten — Samstagabend denkt er.",
      "Velvet: Glow steht davor. Personalgang untenrum, wenn du nicht gucken willst. Tropfen unter den Matratzen."
    ]
  },
  "weld": {
    "name": "Weld",
    "lines": [
      "Weld klopft gegen ein Blech. Es antwortet nicht.",
      "Weld: Zwei Höfe. Band in der Mitte. Coil steht drauf — Funken. West unter dem Band durch, Luke da.",
      "Weld: Der Stapel oben atmet. Freitagfrüh, wenn niemand schweißt. Chip in den Terminals."
    ]
  },
};

// Source map IDs referring to the same person share that person's dialogue.
NPC_DIALOGUES.lumen_m = NPC_DIALOGUES.lumen!;
NPC_DIALOGUES.hex_m = NPC_DIALOGUES.hex!;
NPC_DIALOGUES.nix_a = NPC_DIALOGUES.nix!;
NPC_DIALOGUES.rook_a = NPC_DIALOGUES.rook!;
NPC_DIALOGUES.cherry_den = NPC_DIALOGUES.cherry!;
NPC_DIALOGUES.moss_den = NPC_DIALOGUES.moss!;
NPC_DIALOGUES.felix_work = NPC_DIALOGUES.felix!;
NPC_DIALOGUES.felix_cage = NPC_DIALOGUES.felix!;
NPC_DIALOGUES.felix_body = NPC_DIALOGUES.felix!;
