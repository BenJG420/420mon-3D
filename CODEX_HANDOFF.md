> Prüfnotiz v33 Runde 2: Betroffene fünf Tests grün. Ein Spiel-Smoke bestätigt beide Körper beim Gehen/Laufen/Stillstand, drei geladene NPC-Rigs, Neuladen mit weiblicher Auswahl, schmales Layout und unveränderte HP0/XP ohne Browser-/Shaderfehler. Geh-/Laufbilder zeigen abgesenkte Arme; vollständige Kniezyklen und Übergänge sind zusätzlich mit echten GLTF-Bones/Skins geprüft. Keine weitere lokale Vollsuite. Runde 3 CI/Deployment folgt.

> Prüfnotiz v33 Runde 1: Build grün, 165/167 Tests grün. Zwei neue Haut-Budgetprüfungen verglichen FBX-Meshkoordinaten in Zentimetern mit Weltmetern; vor der Grenze wird jetzt die echte Mesh-Weltmatrix angewendet. Keine Grenzwerterhöhung. Runde 2 nur betroffene fünf Animationstests plus ein Spiel-Smoke, keine erneute volle Suite.
> PR #39 Live-Nachweis: Pages 39075552733, index-5UR8ogTy.js, unveränderter Root index-DWZ4yP_E.js sowie beide GLB-Hashes/MIT-Datei bestätigt. Abschluss beendet.

> Aktuell: PR #39 ist gemergt (cfb13ff); Abschlusslauf 162 Tests + Build und drei Modell-Smokes grün. Die Merge-Beschreibung enthielt eine historische Skip-CI-Markierung; Pages wurde deshalb explizit auf main ausgelöst (39075552733, grün). Exakte Live-Artefakte werden beim Abschluss notiert. Bens neue Liste ist verbindlich.
> Annahme Fix 1 / v33: v32 behebt die falsche Rest-Basis, aber statisches Idle reicht nicht als Bewegungsnachweis. Explizite Limb-Mappings, reine Joint-Rotationen und phasengleiche Walk/Run-Übergänge gelten für Spieler und NPCs gemeinsam. Alle gespeicherten Werte und Gameplay-Bewegungen bleiben erhalten.
> v33: Explizite Hip→Knee→Ankle-/Shoulder→Elbow→Wrist-Ketten und vollständige Clipbindungen werden geprüft; ungültige Rigs nutzen den bestehenden Lade-Fallback statt unbemerkt nur teilweise zu animieren. Gleiche Schrittphase und auf 1 normierte Mischgewichte vermeiden Sprint-Neustart/Bind-Pose-Sprünge; Körper-/Kopf-Skalierung und Ziellängen werden nicht aus FBX-Clips überschrieben. Geplanter Prüflauf 1 umfasst echte GLTF-Skelette, sämtliche Gait-Phasen, Kniepole, deformierte Haut und unabhängige NPC-Mixer.

> Abschlusslauf PR #39: Runde 1 alle 162 Tests + Build grün; Runde 2 Coinwraith/Racklurk/Slagjaw im Originalvergleich, Drehen/Zoom/Schließen, schmaler Bildschirm und HP0/XP ohne Browser-/Shaderfehler grün. Runde 3 CI/Deployment folgt. Bens Liste ersetzt die bisherige Reihenfolge; Walk/Knie separat prüfen, nicht aus dem statischen Idle ableiten.

> Nutzerauftrag 2026-10-17: PR #39 zuerst abschließen/mergen; danach Bens Fix-Liste aus docs/TEST_BUILD.md in dieser Reihenfolge und je Paket ein PR: Animations-Bug (T-Arme/Knie, Spieler + NPCs), Spielautomaten, größeres Aquarium mit schwimmenden eigenen Fischen, Gebäude-Occlusion, HD/4K-Monster (Detail/PBR/weich, keine Pixeloptik), danach übrige Arten. Ko-fi bleibt übersprungen.
> Annahme Fortsetzung: Der ausdrückliche Abschlussauftrag erlaubt für den bestehenden PR #39 einen neuen begrenzten Abschlusslauf (max. drei Runden); die neue Walk/Knie-Korrektur folgt separat im ersten Fix-PR. Keine Neuimplementierung vorhandener Systeme.

> STOP v32 / PR #39 offen (2026-10-17): Drei Prüfrunden ausgeschöpft. Letzter PR-CI-Lauf 39066240154: 161/162 grün; nur mon_coinwraith überschreitet 15k Dreiecke. Vor dem Stop Münzen von 18 auf 13 reduziert (weniger Geometrie, Grenzwert unverändert), Kopf-Editorform nach Mixer-Update erhalten; nicht erneut getestet. Asset-/Handhaltungstest war grün. PR #39 bleibt Draft, NICHT gemergt/deployed. Nächster Lauf: vorhandenen PR #39 fertig prüfen, keine neue Monster-PR beginnen. Aktuell live bleibt v31 / PR #38.

> Prüfnotiz v32: Prüflauf 1 erzeugte den lokalen Build index-Ana-Z6BT.js; beim Umgebungswechsel ging die Ausgabe im temporären Verzeichnis verloren, daher kein unbelegter lokaler Test-Erfolgsanspruch. Prüflauf 2 bestätigt sechs neue Skulpturen im Vergleichs-Viewer, Drehen/Zoom/Schließen, schmales Layout und HP0/XP ohne Browser-/Shaderfehler. Racklurks sichtbare Kupferspiralen und das im v31-Livebild erkannte Arm-Retargeting werden vor dem dritten CI-/Deploy-Check korrigiert; kein weiterer voller Smoke-Lauf.

> Annahme v32: Ein spielbares Modellpaket ergänzt die nächsten 24 Original-Arten (Dex 25–48); Rückseiten werden konservativ ergänzt, 372 weitere individuelle Skulpturen bleiben ausdrücklich offen ab Dex #49.
> v32: Coinbat–Slagjaw einzeln anhand der lokalen ersten 2D-Pose modelliert, mit geschlossenen Flügelmembranen, Münzen, Deckeln/Gittern, Rohren, Fell, Bandagen, Moos und Lavaplaten. Vorhandene 420 Dateien, Cache/Slots/Viewer und Spielmechaniken bleiben erhalten.
> v31: PR #38 gemergt (1d72d2b), PR-CI 162 Tests/Build grün; Main-CI/Pages grün; Live-JS index-CZwokPcC.js, beide GLB-Hashes und Lizenzdatei bestätigt. Gezielter Live-Check bestätigt drei Keller-Rigs, Can → Buch, Editor, schmales Layout, HP0/XP und keine Browserfehler. Nahansicht zeigt abgespreizte Arme: v32 korrigiert die unterschiedlichen FBX-Rest-Basen per absoluter Posenübertragung (keine Mechanikänderung).

> Annahme v31: Mira/Cherry/Silk/Velvet nutzen das weibliche Rig; weitere NPCs das männliche, mit stabiler Sprite-ID-Palette. Identität, Quelle-Koordinaten, Tags, Quests und Shops bleiben unverändert.
> v30: PR #37 gemergt (328f3e8), PR-CI mit 162 Tests grün; Main-CI und Pages grün; Live-JS index-Bth2vcda.js, beide GLB-SHA256 und MIT-Datei bestätigt, stabiler Root unverändert.
> Prüfnotiz v31: Pass 1 mit 162 Tests + Build grün. Pass 2 bestätigt drei geladene Keller-NPC-Rigs ohne Browserfehler; danach Timeout im Prüfskript, weil bei Can vor der Buchprüfung der Dialogknopf „Buch“ fehlte. Kein voller Smoke-Neulauf; gezielte Live-Interaktion und finale gemeinsame Kleiderkorrekturen folgen in Pass 3.
> v31: NPCs erhalten unabhängige Skelette/Mixer aus denselben zwei MIT-Vorlagen, Idle-Phasen und Animation nur für Quellbewegung; Entfernung pausiert die Darstellung, Kartenwechsel/Entfernen verwirft verspätete Ladeergebnisse. Gemeinsame Kleidung hat freie Arme/Unterschenkel für originale kurze Schnitte.

> Annahme v30: Rocketbox MIT (Revision 0943055) liefert beide Körper und drei passende Clips; gespeicherte Editorwerte bleiben erhalten, Kleidung folgt dem echten Skinning statt den alten Box-Pivots.
> v30: Rigged-Spieler integriert; lokale Lizenz/Quellhashes, Idle/Walk/Run, unveränderte Bewegung und Fallback bei Ladefehler. Pass 1: 161 Tests + Build grün; Pass 2: Desktop-/Touch-Layout-Smoke mit beiden geladenen Rigs, Idle/Walk/Run, T und Reload grün, HP0/XP erhalten, keine Browser-/Shaderfehler. Neuer Asset-Integritätstest und finale Basisfarb-Anpassung werden im dritten CI-/Deploy-Lauf geprüft.

# 420mon → 420mon-3D — Codex handoff (2026-10-12)

> v29 Grafik-Paket 1: Bezirksprofile, dunkle PBR-Kachelmaterialien/Nassglanz, nahe Lampen/Fassaden, HDR-PMREM, GPU-Regen/Bodenringe/Haze und Composer mit Hoch-Bloom/Grading/FXAA sind integriert. Grafikpräferenz ist getrennt vom Spielstand. Keine neuen Spieler-/NPC-Assets; nächstes Paket ist der lizenzierte Rigged-Spieler, dann NPCs, dann Monster. Ko-fi ist übersprungen und im Spiel nicht mehr erreichbar.
>
> Prüfnotiz v29: Lauf 1 mit 161 Tests und Build grün. Lauf 2 bestätigt Gasse/Handy-Automatik/Regen/DPR3-Budget ohne Shader-/Browserfehler; Hoch/HDR/Bloom aktiviert, dann Screenshot-Timeout bei emuliertem DPR3 und 1280×800. Nachfolgende Indoor-/Save-/Ben-/Viewer-Schritte nicht erreicht; keine volle Wiederholung. Sichtbare mobile Grafikschalter-Überlappung in CSS korrigiert. Lauf 3 bestanden: PR-/Main-CI 161/161 und Pages grün; PR #36 veröffentlicht (c82f7c8), Live index-CUSOzd0g.js/CSS index-B22-BWfz.css bestätigt. Gezielter Live-Check bei DPR1 bestätigt Hoch/HDR/Bloom, trockenen Keller, Sparsam-Präferenz/Reload, übersprungene Kasse, HP0/XP/Gold/Inventar und korrigierte mobile Grafikschalterposition ohne Shader-/Browserfehler. Kein voller Smoke-Neulauf; Hoch-DPR/4K bleibt Gerätetest.
>

> Nutzerwechsel v29 (2026-10-16): Ko-fi/Zahlungsserver sind **übersprungen**, nicht mehr blockiert/offen. Grafik-Reihenfolge jetzt: 1. Bezirkslicht/Materialien/Wetter/Post-Processing nach README/Bildvorlage, 2. realistischer frei lizenzierter Rigged-Spieler samt Animationen (Lizenz in docs/ASSET_ATTRIBUTION.md), 3. NPCs, 4. individuelle Monster nach 2D. Mechaniken bleiben außer nötigen Grafik-Anpassungen erhalten; ein PR und höchstens drei Prüfläufe je Paket.
>
> Annahme v29: Die README-Prosabeschreibung und die zugängliche frühere Google-Photos-Vorlage bestimmen dunkle Industriehöfe mit warmweiß/bernsteinfarbenen Reflexen, kühlen Schatten, Bodenhaze und dünnem Regen; Innenräume bleiben trocken. Die Vorlage wird nur angesehen, nicht als ungeklärtes Spiel-Asset übernommen.
>

> v28 (2026-10-16): Alle 420 Arten haben individuelle lokale Sprite-Volumen; die ersten 24 (Budling–Graterat, AUTHORED_MONSTER_IDS) bevorzugte eigens modellierte Körper. Welt, Kampfpartner und Gegnerwechsel nutzen dieselben bestehenden Modell-Slots. Dex-/Kampfansicht mit Drehung, Zoom und Originalvergleich ist integriert. Nächste Kunst-Arbeit sind die 396 noch nicht einzeln modellierten Arten; Pipeline/Cache/Viewer nicht neu bauen. Bens Betrieb bleibt extern blockiert. Details: [docs/MONSTER_MODELS.md](docs/MONSTER_MODELS.md).
>
> Prüfnotiz v28: Lauf 1: 156/156 Tests grün, Build an TS-Typnarrowing im neuen Validator gestoppt und korrigiert. Lauf 2: Build und ein Touch-Smoke mit sechs Skulpturen/zwei Volumen, Drehung/Zoom, Handy/Desktop/Reload und Trainer-Gegnermodell/Fang bestanden; HP0/XP/Inventar/Gold bleiben erhalten. Lauf 3 bestanden: PR-/Main-CI mit 156/156, Build und Pages grün; PR #35 veröffentlicht (861750b). Live-Bundle index-CaFS25C1.js entspricht exakt dem geprüften Build, 420er-Manifest und Modellstichproben entsprechen lokalen Hashes, stabiler Root bleibt v18. Keine weiteren Vollprüfungen.
>

> Annahme v28 (2026-10-16): Eine einzelne Originalpose legt die Rückseite nicht fest; 24 Arten erhalten nach dieser Vorlage modellierte Körper, die übrigen Arten individuelle abgerundete Sprite-Volumen mit ausdrücklich rekonstruierter Rückseite. Original-Sheets und sämtliche Spiel-/Speicherdaten bleiben unverändert; Bens externer Betrieb bleibt mangels Zugang blockiert.
>

> v27 (2026-10-15): Radio mit beiden lokalen Original-MP3s, Felix-Kiste/Automation/Offline-Produktion und Eddis Besuche, Sterne, Handel/Titel sind integriert. Bens sichere Node/SQLite-Kasse ist geliefert, aber ohne HTTPS-Backend/Ko-fi-Zugang geschlossen; dieser Betrieb bleibt der nächste offene Punkt vor Monster-Modellen. Einrichtung: [server/support-README.md](server/support-README.md).
>
> Annahme v27 (2026-10-15): Die statische Testseite nutzt einen separat konfigurierbaren Zahlungsserver mit neuen ausschließlich serverseitigen Geheimnissen; der private 2D-Server, seine Schlüssel und alte Signatur-Codes werden nicht in das öffentliche 3D-Spiel übernommen. Fehlt der externe Betriebszugang weiter, bleibt Ben ausdrücklich blockiert; das nächste umsetzbare Paket sind dann die Monster-Modelle, ohne die fertige Kasse erneut zu bauen.
>
> Prüfnotiz v27: Prüflauf 1 bestanden (148 Tests plus Test-Build). Ein Touch-Smoke bestätigt echte MP3-Wiedergabe, Sender/Stumm/Reload, URL-Schutz, Felix-Anheuern/Offline-Ernte/Kistentransfers, Eddi-Preise/Titel/Verkauf und die ohne Backend geschlossene Ben-Kasse; HP0/XP bleiben erhalten, keine Browserfehler. Prüflauf 3: PR-/Main-CI mit 148/148 sowie Pages grün; PR #34 veröffentlicht (c4c1ab2). Erste Live-Dateinamen-Erwartung entsprach dem lokalen Build, Pages erzeugt mit seiner öffentlichen Buildvariable index-CDtlnkfY.js; tatsächliche CI-/Live-Dateien und beide MP3-Originalhashes bestätigt, stabiler Root weiter index-DWZ4yP_E.js. Kein weiterer Build oder Smoke-Lauf.
>

> Prüfnotiz v26 (2026-10-15): Pass 1 hatte 112/114 grüne Tests; zwei Geld-Erwartungen in Fixtures ignorierten Tanktop-/Questbelohnungen und wurden berichtigt. Pass 2: beide betroffenen Dateien mit 17 Tests und Build grün; ein Touch-Smoke bestätigt alle elf Erscheinungen, T, Inventar, sichtbare Vorschau sowie HP0/XP/Inventar/Gold nach Reload. Der anschließende simulierte Lauf lieferte keinen gespeicherten Schritt; Editor-Fokus wird beim Schließen explizit freigegeben. Kein voller Smoke-Neulauf. Pass 3: CI mit 114/114 Tests, Build und Pages grün, PR #33 veröffentlicht (4c450bd). Live-Fokusfreigabe und Laufen/Schrittzuwachs bestätigt; danach stoppte eine Inventar-Erwartung am legitimen Grow-Startbonus seed_ordinary:1. Desktop-Vorschau wurde nicht mehr erreicht und bleibt Nutzerprüfung. Keine vierte Prüfung; abschließende Notiz ist eine reine Dokumentationsänderung.
>
> Annahme Kleidung (2026-10-15): Fehlende oder unbekannte Outfit-IDs werden zur Original-Tanktop-Basis normalisiert; gültig angelegte Stücke bleiben auch ohne Restbestand erhalten. Original-Spritefarben und -Schnitte bestimmen die Kleidung, bestehende Editorfarben gelten für die Basis darunter und bleiben gespeichert.
>
> Prüfnotiz v25 (2026-10-15): Prüflauf 1 mit 100 Tests und Build bestanden; ein Chromium-Touch-Smoke bestätigt Can im Keller, 420 Seiten, Filter/Blättern, Geheimnis-Suche, 75-Softcash-Tipp, 10-Softcash-Einzel- und Sammelabholung, Reload ohne doppelte Auszahlung sowie das nur lesbare Journal außerhalb des Kellers. HP0, XP und Inventar bleiben unverändert. Dritter Prüflauf erfolgreich: CI/Pages und Live-Artefakte bestätigt, PR #32 veröffentlicht (bdaa013).
>
> Annahme Can (2026-10-15): Das Original kennt 420 Erfolge und kostenpflichtige Tipps, aber keine Auszahlung; gemäß Nutzerwunsch zahlt Can zusätzlich jeden erfüllten Erfolg einmalig mit 10 Softcash bzw. 25 bei geheimen Erfolgen aus, auch übernommene fertige Erfolge, getrennt in achClaimed gespeichert und nur persönlich im Keller abholbar.
>
> Prüfnotiz v24 (2026-10-15): Prüflauf 1 mit 83 Tests und Build bestanden; ein Touch-Smoke bestätigt Tagestrainer/Sieg/Bonus/Sperre, Tor-Trainer-Fang und Reload, Nims drei Gegner ohne Fang sowie Niederlage mit −8/Kapsel und HP0 bis zur physischen Matratze. Dritter Prüflauf erfolgreich: CI/Pages und Live-Artefakte bestätigt, PR #31 veröffentlicht (9e74595).
>
> Annahme Trainer (2026-10-15): Die fangbaren Standard-Trainer und Nims fanggesperrte Team-Duelle folgen dem 2D-Laufzeitcode; eine Trainer-Niederlage kostet wie dort 8 Softcash und führt zur Kapsel, belebt aber gemäß Nutzerregel niemanden automatisch wieder.
>
> Prüfnotiz v23 (2026-10-15): Automatik 65 Tests + Build bestanden; ein Touch-Smoke bestätigt Angelstelle, Timing-Fang, Essen, Fehlwurf-/Abbruch-Erstattung und Reload. Die Becken-Testposition (251,72) wählte das nähere originale pad_kai; das Aquarium von rechts bei (280,68) ansprechen. Keine Wiederholung des ganzen Smoke-Laufs; der abschließende Live-Deploy-Check bestätigte das physische Becken, 42 Arten und Touch-Layout ohne Browserfehler (PR #30).
>
> Annahme Angeln (2026-10-15): Fehlwurf, ursprüngliches Müll-Ergebnis, Abbruch und unterbrochener Wurf erstatten genau denselben verbrauchten Samen einmalig; Original-Ködergewichte, 2–8 s Wartezeit und ein erfolgreicher Haken pro Fisch bleiben erhalten (die ungenutzte Mehrtreffer-Tabelle wird nicht aktiviert).
>
> Annahme (2026-10-15): Paket 1 verbindet Questfortschritt, Dialoge, Abgaben und Beute; Felix/Eddi-Automation und Bens Kasse gehören zur Story-Wirtschaft in Paket 6, Can/Radio/Trainer zu ihren ausdrücklich folgenden Paketen. Board-Aufträge werden ab der empfohlenen Stufe aktiv angezeigt; originale Erfüllung und Belohnung bleiben davon unabhängig.
>
> Prüfnotiz v22 (2026-10-15): 56 Tests und Build bestanden; Touch-Smoke bestätigt Silk-Abgabe und NPC-Shop-Verkauf. Der anschließende Static-Standortwechsel per Test-localStorage wurde beim Reload durch den bestehenden pagehide-Save überschrieben und lief in einen Timeout; kein zusätzlicher Smoke-Lauf. Static ist durch die echten Modulprüfungen abgedeckt, seine Browserbedienung bleibt zur Nutzerprüfung offen.
>
> Latest user update (2026-10-14): mattresses revive defeated team partners, and Grow care gives real time/yield bonuses. These override the historical 0-HP and cosmetic-only rules below.
>
> Historical handoff below. v18 was merged through PR #25 on 2026-10-13. The
> current v29 implementation and remaining work are documented in
> [docs/TEST_BUILD.md](docs/TEST_BUILD.md). Its runtime Dex has 420 local original
> sheets; its world uses the original MAPS. Old branch/count statements below
> are preserved as history and must not drive new merge decisions.

## User's goal (must not reinterpret)
German original: **"eine komplette Kopie nur auf 3d und 4k mit Verbesserungen nicht alles von anfang"** and **"Bau jetzt soweit alles fertig das wir eine richtige Lösung haben und nicht 100 mal das der nächste Punkt der ist"**.
The existing 2D game is the specification. Reuse all authentic data and gameplay; port the game systems to a polished **3D, 4K-capable, touch-friendly** experience for Android and desktop. Do not rebuild from scratch, substitute fake monsters, or claim completion while important features are missing. The user wants larger integrated implementations, functioning deploys, and less repetitive planning.

## Repository and delivery links
- Original source (private, read access required): https://github.com/BenJG420/420mon
- 3D target (public): https://github.com/BenJG420/420mon-3D
- GitHub Pages: https://benjg420.github.io/420mon-3D/
- CI + Deploy: https://github.com/BenJG420/420mon-3D/actions
- 3D main checked 2026-10-12: `1144f154da2dcb87b9a1393d60b9d889acfa9137`; both latest main build and Pages deploy **success** at that commit (2026-10-08); not the latest WIP assets.
- WIP v18: `fix/dex-single-frame-v18` at `42e9174a6e8c6b47f995cba5fcfae71c166737d7` (as checked 2026-10-12). Its changes are not in `main`. **Re-check remote heads before working.**
- Previous WIP: `fix/local-original-sprites-v17`; superseded for most purposes by v18.
- No open PRs at last check.

## Technical state of 3D repository
- Stack: Three.js ^0.180, TypeScript ^5.9, Vite ^7; `npm install`, `npm run build` (= `tsc -b && vite build`).
- Entry and city + input: `src/main.ts`; third-person movement, 3D block/neon city, collision, character customisation, mobile controls.
- Wild encounters, minimal capture/combat, EXP + current save: `src/game/monsters.ts`.
- Main game menu, searchable Dex, team/box transfers, items, shop screen, district selection: `src/game/systems.ts`.
- 10 themed 3D placeholder district spaces, NPC "Eddi" and shop proximity: `src/game/world.ts`. Current regions are approximate detached geometric environments, not faithful translations of the original maps. The user complained maps/districts were missing or visually unchanged.
- CSS: `src/styles.css`.
- Canonical 2D data previously copied: `src/game/data/dex.ts`, `roster.ts`, `types.ts`, `progress.ts`, `moves.ts`, `items.ts`, `zones.ts`, `achievements.ts`, `legend.ts`. Some is only partially wired to gameplay.
- Original 2D major code: `src/game/runtime.ts` (~153K chars), `src/game/state.ts` (~33K chars), `src/game/battle.ts` (~13K chars), `src/game/data/dex.ts` (~229K chars), and other files. Port functionality deliberately; copying the React runtime straight into Three.js without integration will not work.
- Current 3D save key: `420mon-progress-v1`; original 2D save: `420mon_save_v1`; assess migration and maintain save compatibility.

## Important live bug: Dex art / sprite sheets
Recent screenshot showed four sprites together in each Dex thumbnail (2×2 sprite sheet). It also showed intermittent empty icons. These are *not a user setting*.

1. The original 2D repo is **private**. Linking `https://raw.githubusercontent.com/BenJG420/420mon/main/public/game/sprites/...png` in the public 3D site returns inaccessible resources to unauthenticated players. Do not use this at runtime.
2. The original has 410 explicitly declared sprite paths in `src/game/data/dex.ts`, with actual PNG assets in original `public/game/sprites/`. 420 Dex entries include some auto-generated entries that may require actual sprite creation or a documented fallback.
3. In current `main`, only 226/410 of the canonical 2D sprites exist locally in `public/game/sprites/` (227 files including duplicate/extra). In `fix/dex-single-frame-v18`, 362/410 are present (363 files). **48 canonical sprites still missing in v18.** Recount after checkout; other commits may have changed this.
4. The WIP branch v18 updates `src/game/systems.ts` and `src/styles.css` to display only the **top-left 128×128** section of each 256×256 sheet inside a 64×64 thumbnail using a clipped container and a 200%-sized child image. Test that this actually works on Android and does not distort 4K/UI scaling.
5. WIP graphics were copied as `.svg` files containing an embedded base64 source PNG in `<image>` (plus three `.png` files: Budling, Neonpunx, Puffpuff). Although the pixels are original, this is a stopgap. Prefer authentic PNGs and a clear asset pipeline without unexpectedly inflating build size; preserve the complete 2D spritesheets for 3D-modelling reference.
6. `src/game/systems.ts` on main chooses `.png` for `neonpunx`/`puffpuff`, `.svg` for others, and on failures displays an outline diamond instead of removing the image. In v18 `budling` is also a PNG (fix extension mapping).
7. For species with no actual art, show a clear placeholder and mark it missing; do not display a sheet with four sprites or pretend a generated generic model is the true 2D artwork.

## User game rules and expected systems
- Level cap 420, original XP formula, 14 elemental types/effectiveness and original attack/move catalog.
- User rule: **0 HP means truly defeated/dead and cannot be caught or brought back by healing**. A later wearable protective ring is allowed to prevent fatal damage (survive with 1 HP). Current 3D `TEAM HEILEN` and item healing violate this; correct behavior consistently without corrupting preexisting saves.
- Team capacity 6, storage box (with safe full-team capture behavior), original 420-species Dex, battles, captures, status/IV/evolutions, inventory, quest system, achievements, economy, NPC dialogs, shops, growth/strains, fishing/minigames, other original mechanics.
- Shop should **only open by talking to a physical shop NPC** (named Eddi in current 3D code), not via globally accessible ordinary menu; Dex may stay in main game menu.
- True in-world map + all original districts: `alley`, `yard`, `cable`, `ash`, `drain`, `chem`, `ring`, `labyrinth`, `nische`, `scrap` and other original hub/market/sewer as present in original code. Use original 2D `public/game/maps/` resources and `src/game/data/zones.ts` to plan recognizable topology/landmarks, transitions and spawn points, not merely ten teleports into repetitive colored buildings. Enforce original story gating and appropriate encounters instead of all areas being unrestricted.
- Distinctive 3D monsters should **follow their individual original 2D visual identity**; model them from source art, not random generic spheres or repeated placeholders. Create an extensible model registry and conversion workflow.
- Support both Android touch and desktop keyboard/mouse, stable camera/collision, appropriate frame rates, good UI, responsive/full-HD/4K-capable rendering. Do not force native 4K on mobile at cost of playability.

## Recommended implementation sequence (execute, don't stop at reporting the plan)
**P0 — Finish and ship Dex display with tests.** Integrate WIP v18 back onto latest main, import the remaining 48 original asset sheets from the user's private 2D repo, fix PNG/SVG paths, crop one frame, test at least several species and fallback cases. Run local build then PR/merge and verify Pages deploy. Keep source art as model references.
**P1 — Faithful world and NPCs.** Inspect original 2D maps + zone layout; implement functioning in-world navigation/minimap, enterable 3D versions of all main districts, encounters and district transitions; shop via Eddi proximity and dialogue, no global shop.
**P2 — Feature parity.** Reuse original data and logic for battles (four moves/status/types/IV), evolutions, healing/death semantics, party/box/quests/achievements/inventory/economy and other 2D gameplay. Provide reliable save migration and tests.
**P3 — Authentic models and polish.** Build distinct 3D-model pipeline with source-sheet links/metadata, memorable design for each species; optimize device graphics settings for mobile/desktop/4K; HUD, sounds, controls, camera and gameplay tests.

These are milestones of a *single complete 3D port*, not an invitation to repeatedly ask the user for the next small step. Commit substantial working deliverables with tests. If time/resources mean incomplete, state accurate scope and preserve a working build.

## Acceptance checklist
- [ ] `npm install && npm run build` succeeds, and GitHub Actions/Pages success is verified for the merged commit.
- [ ] Dex shows **one** recognisable original 2D monster pose per species; images do not disappear; missing art is deliberately tracked.
- [ ] All original source 2D sprite files used by Dex accessible from **public 3D build**, no private-repo image URLs.
- [ ] 10 districts plus relevant hub areas visible, enterable, distinctive; appropriate original encounters and NPCs.
- [ ] Shop interaction requires NPC; inventory/gold and team/box updates persist after reload.
- [ ] Rules: original 420 level progression, actual moves and stats/statuses/evolutions; 0-HP no capture and no accidental revival.
- [ ] Character movement/collision, camera and mobile joystick all work; no overlay blocking touch controls.
- [ ] Regression checks on fresh save and an older 3D save; no silent wipe or unreachable party.
- [ ] Do not describe partial systems or dummy art as 'complete game'. Clearly say what is genuinely ported.

## Prior conversation links / relevant merged PRs
- PR #15: copied original moves, levels and element effectiveness (foundation).
- PR #16: copied original 420 Dex and first integrated encounters.
- PR #17: copied original items, achievements and districts; added box, shop UI, quests summary.
- PR #18/#19: CI missing lockfile and missing `legend.ts` dependencies fixed.
- PR #20: initial 3D themed districts/NPC and original sprite URL Dex attempt.
- PR #21: made map shortcut visible on HUD.
- Subsequent main commit `1144f154...` bundled *partial* local monster assets (226/410), with Build/Pages success. V18 is separate.

## Coding and communication requirements
1. Inspect repositories and Git history before making claims; do not guess file paths or missing resources.
2. Prefer actual code changes, tests and builds over small unverified code snippets.
3. Preserve functional existing user features and avoid risky sweeping rewrites unless required by robust integration.
4. Deliver whole files/working features and practical testing links. Inform the user in German; short, substantive progress reports only.
5. Keep private credentials and user data out of public 3D repo. Access to the private original repo must be explicitly configured in Codex Cloud/desktop.
