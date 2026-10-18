# v40 — individuelle Modelle Dex 49–54

Annahme v40: Ein fertiges Artenpaket umfasst die nächsten sechs Originalarten (Hawkerfox, Kiefhound, Puffwraith, Blazetail, Rootroach, Crackveil); verborgenes Volumen wird konservativ ergänzt. Die echten Erstposen bestimmen Anatomie, Gesichter, Farben und Accessoires; bestehende 48 Skulpturen/PBR/Mechaniken bleiben unverändert. Danach ab Dex #55.

- v40 Prüfungen 1/2: 188/188 + Build grün; ein Chromium-Touch-Smoke zeigt alle sechs als sculpted neben echter Erstpose, Drehen/Zoom/Schließen/Reload/HP0/XP17 und schmales Layout ohne Browser-/Shaderfehler. Aktuell 54 Skulpturen/366 Rekonstruktionen. Runde 3 CI/Pages folgt; keine weitere lokale Vollprüfung. Weiter ab Dex #55.

# Aktueller Wiedereinstieg — v39 / Monster-Oberflächen/PBR veröffentlicht

- **Fertig, gemergt, live:** PR #46, Spielcode 89291ccadcb37fabcb535904182c223133ba0e3a. Vorhandene 48 Skulpturen bekommen feinere Rundungen (12×8 Kugeln, 10er Kegel/Stäbe, unter 30k Dreiecken). Alle übrigen 372 laden glatte Marching-Cubes-Oberflächen aus den vorhandenen Original-Silhouetten-/Tiefendaten statt Pixel-Säulen (max.24k Dreiecke). Originalsprites, Quellenhashes, Legacy-Volumendateien und Dex-Porträts bleiben erhalten.
- **Ehrliche Art-Grenze:** 48 individuelle Skulpturen / 372 glatte Rekonstruktionen. Die Rekonstruktionen sehen im Bildvergleich weiterhin deutlich einfacher/weicher aus und haben keine individuell ausgearbeitete Anatomie/feinen Gesichter. Bilineare Originalfarben ersetzen den ersten Farb-Gaussfilter, sind aber keine neuen HD-Albedobilder. Nicht behaupten, alle 420 seien detaillierte HD-Skulpturen, native 4K verifiziert oder fotorealistisch fertig.
- **PBR:** monster-surface.ts erzeugt eigene deterministische Normal-/Roughness-Tiles (1024 Desktop /512 mobile), lineare Filter/Mips, UVs und gemeinsam genutzte organische/nasse/metallische Materialvarianten. Bezirks-IBL bleibt; Modellviewer hat eigene RoomEnvironment/PMREM-Reflexionen und gibt sie beim Schließen frei. Model-Cache/Lease/Stale/Fehler-Fallback behalten; nur kind der Rekonstruktionen heißt jetzt smooth-volume. Keine Gameplay-/Saveänderungen.
- **Drei Prüfrunden abgeschlossen:** 1: 185/185 + Build. 2: drei neue Tests für alle 372 glatten Meshes/Normalen/UV/Budget, 48 Skulpturen/UV/Budget und PBR-Maps/Varianten/Dispose; Build + ein Touch-Smoke Budling/Coinwraith/Hawkerfox, Originalvergleich, Drehen/Zoom/Schließen/Reload/HP0/XP17 ohne Browser-/Shaderfehler. 3: PR CI 39132161513, Main CI 39132260503 grün (188/188+Build), Pages 39132260547 grün; Live-Dateinamen/Inhalt/Hash bestätigt. Ein gezielter Live-Check der finalen Rekonstruktion mit Drehen/Zoom/Schließen/Reload/HP0/XP war grün. Keine weitere Vollschleife; physisches Android/native 4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-yFr7TIgT.js SHA256 bf28748298bdbd5823ac2abe07ce0d23b04ffbd1e4adb205bf48c91266f75d16; CSS index-tKfj-jno.css. Root unverändert index-DWZ4yP_E.js. Nicht als bytegleich zum ersten lokalen Build behaupten: finale bilineare Farbabtastung wurde in CI gebaut.
- **Nächstes Paket:** individuelle Original-Arten ab Dex #49 Hawkerfox (48 bestehende Skulpturen nicht neu bauen), Anatomie/Gesichter/Accessoires nach echter 2D-Erstpose ausarbeiten, PBR-Pipeline/Cache/UVs beibehalten. Aktuelle Rekonstruktion von Hawkerfox ist in /workspace/scratch/420mon-audit/v39-live-mon_hawkerfox.png im direkten Originalvergleich dokumentiert. Ein fertiges Artenpaket pro PR, max. drei Prüfblöcke. Alle Bezirke/Mechaniken/Spielstände und übersprungene Ko-fi/Zahlungsserver behalten.
- Abschließender Dokumentationscommit ist nur Status; veröffentlichter Spielcode bleibt 89291cc.

## Historischer Verlauf — ältere Next-Angaben überholt

# v39 — HD/PBR-Monster-Pass

Annahme v39: Ein kompletter Rendering-Pass ergänzt alle 420 Modelle um glatte Oberflächen und eigene PBR-Texturen; 48 Skulpturen werden höher aufgelöst, 372 bleiben ehrlich als glatte Original-Silhouettenrekonstruktionen gekennzeichnet. Individuelle Anatomie aller übrigen Arten bleibt das Folgepaket; HD/4K bedeutet keine pauschale 4K-Textur-/DPR-Pflicht auf Handys.

- v39 Runde 1: 185/185 + Build grün. Runde 2: drei neue Tests (alle 372 glatten Rekonstruktionen, 48 Skulpturen/UV/Budget, Texturen/Varianten/Dispose) + Build und ein Touch-Modell-Smoke Budling/Coinwraith/Hawkerfox inklusive Drehen/Zoom/Schließen/Reload/HP0/XP17 ohne Browser-/Shaderfehler grün. Bildvergleich zeigt die Rekonstruktion weiter deutlich einfacher als eine Skulptur; vor CI Farbabtastung auf bilinear umgestellt, um Augen/Zeichnungen weniger zu verwaschen. Keine weitere lokale Vollprüfung; finaler CI-/Deploy-Check folgt.

# Aktueller Wiedereinstieg — v38 / Menü-Inventar Paket 7 veröffentlicht

- **Fertig, gemergt, live:** PR #45 (Merge 49c45aea0bf32c1a569c30edd44c95ea8f8ee4fb), finale Spielquelle d647027b92da544a4603cfb7f3071af5f1a6abe0 mit kleinem Escape-Follow-up auf main. Originalvorlage: overlays.tsx Pause/Inventory + src/styles.css, 2D-Revision 010807da77df8468a297adf33eaf1fb5c9a61c8b.
- **Menü:** originale Pause-Reihenfolge, dunkle Originalpalette, 360/520px-Fenster mit 80dvh-Limit. Vorhandene Box/3D-Editor/Kapseln/Grafik bleiben erreichbar; Händler bleiben am physischen NPC. Hilfe, Änderungen/Feedback, Ton/Teilen, Karte, Quests, Erfolge, Party und Kapsel sind angebunden. **Leute/Chat, Nachrichten/Konto sind ausdrücklich Links zum 2D-Original**: kein eigener 3D-Server/Auth-/Save-Transfer. Dies ist eine dokumentierte Abgrenzung, keine behauptete native Online-Funktion.
- **Inventar:** originale groupedInv/CAT_ORDER/CAT_LABEL/itemUseLabel, eingeklappte Kategorien, Mengen, deutsche Namenssortierung, Itembeschreibungen und getrennte Benutzen-Knöpfe. Unbekannte Alt-Items unter Sonstiges; explizite Heilzielauswahl sperrt KO/volle Partner, verbraucht bei ungültigem Ziel kein Item. Konsum und Kleidung bleiben erhalten. I/B/M/H/T/Escape, Fokusfalle und Außenklick integriert; Kamera-/Touch-Bewegung beim Öffnen geleert. Der überlagerte Dex-Modellviewer behält Escape/Fokus (abschließender kleiner Main-Fix).
- **Drei Prüfrunden:** 1: 182 vorhandene Tests + Build grün. 2: drei neue gezielte Tests + Build, ein Touch-Smoke für Pause-Reihenfolge, Kategorien/Anzahl/Benutzen, Zielheilung/HP0, Konsum, Box, I/Escape/Fremdmodal, Reload/Legacy-Item und schmales Layout ohne Browser-/Shaderfehler. 3: PR CI 39127549873 und finale Main CI 39127707317 grün (185/185 + Build), Pages 39127707316 grün; Live-Dateinamen/Inhalt/Hashes bestätigt. Gezielt am Live-Deploy finale Maße, T und Dex-Escape ohne Browser-/Shaderfehler geprüft. Keine weitere lokale Vollsuite/Smoke-Schleife; Android/4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-CwOCArVd.js SHA256 5bb3baf5da4f56472be387b5d1f6e58c73e6d8122490ddd43453ba8754eb6f92; CSS index-tKfj-jno.css. Root unverändert index-DWZ4yP_E.js. Nicht als bytegleich zum früheren lokalen Build ausgeben: finale Maße/T/Escape wurden in CI gebaut.
- **Nächster Punkt 5:** HD/4K-Monster-Pass (detaillierte Meshes/PBR/weiche Schattierung, keine Pixel-Weltoptik), danach restliche Originalarten. Vorhandene 48 Skulpturen/372 Rekonstruktionen, Pipeline/Cache/Originalporträts und alle Mechaniken/Speicherstände behalten. Paket 6/7 nicht neu beginnen. Ko-fi/Zahlungsserver übersprungen. Ein PR, max. drei fokussierte Prüfblöcke je Paket.
- Abschließender Dokumentationscommit aktualisiert nur den Status; veröffentlichter Spielcode bleibt d647027.

## Historischer Verlauf — ältere Next-Angaben überholt

# v38 — Menü/Inventar Paket 7

Annahme v38: 2D-Pause-Reihenfolge und Inventar aus overlays.tsx werden übernommen; bestehende Box/3D-Editor/Kapseln bleiben als Unteraktionen erreichbar. Leute/Chat und Nachrichten verweisen ausdrücklich auf das 2D-Original, weil der 3D-Port keinen Online-Server hat; kein neuer Server/Auth-/Zahlungsumfang.

- Prüfung v38: Runde 1 182/182 + Build. Runde 2 drei neue gezielte Tests + Build und ein Touch-Smoke grün: originale Reihenfolge, Kategorien/Anzahl/Benutzen, Zielheilung/HP0, Konsum, Lagerbox, I/Escape, Fremdmodal, Reload/Legacy-Item und schmales Layout ohne Browser-/Shaderfehler. Vor CI noch CSS-Fenstermaße an 360/520px/80dvh angeglichen und T-Tütenkürzel im Inventar freigegeben; finaler CI-/Deploy-Check prüft endgültigen Stand, keine weitere lokale Vollrunde.

# Aktueller Wiedereinstieg — v37 / Konsum-Paket 6 fertig

- **Fertig, gemergt, veröffentlicht:** PR #44, Spielcode 43f9f741be087bb28814283e79d9949c41086dee. Joint/Bud sind im Inventar und im Kampf nutzbar. Authentisches runtime.useItem/applySmoke (2D 010807da77df8468a297adf33eaf1fb5c9a61c8b): genau ein Item, stärkster Wert, unabhängige Spielzeit-Uhren, 600s Verlängerungs-Cap; Hybrid 1/2 verschiedene Zufallseffekte, Zero-Day Fang/Tempo/Gold. Konsum kostet im Kampf keinen Zug; HP0/EP/Teamreferenzen bleiben erhalten.
- **Integration:** fish-consumption.ts teilt die vorhandene Effektbasis; consumeSmoke persistiert einmal und rollt bei Speicherfehlern Verbrauch/Effektfelder zurück. Fang-, Tempo-, Gold-, Loot- und EP-Verbraucher verwenden vorhandene high*-Felder. Mehr Wild im existierenden 3D-Habitat = entsprechend schnellerer gewöhnlicher Wild-Respawn, kein neu gebautes Begegnungssystem. systems.ts Inventar + monsters.ts Kampf-Items öffnen denselben Konsum. Bestehende Fischboni/Sammlung bleiben erhalten.
- **Drei Prüfrunden abgeschlossen:** 1: 182/182 Tests + Build. Vier neue Prüfungen für alle Joint/Bud-Items, Dauer/Stärke/Cap/Ablauf, Hybrid, Zero-Day, XP/Gold, Legacy-Uhren, Fisch-Koexistenz, Speicherrollback und HP0/Referenzen. 2: ein Chromium-Touch-Smoke bestätigt Joint/Bud, stärksten Fangbonus, Reload, Kampf ohne Zug/HP-Verlust, HP0/XP17, schmales Layout ohne Browser-/Shaderfehler. 3: PR CI 39123262088, Main CI 39123329918 und Pages 39123329846 grün; Live-JS/CSS bytegleich zum lokalen Build. Kein vierter Lauf; physisches Android/4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-CYah1Lss.js SHA256 bcbf4f4c11c0a9ddd5abe7d2d1c0e8f2d9aa51ea9018b9e7f1a78fe17207dfe5; CSS index-BW3ctqqL.css. Root unverändert index-DWZ4yP_E.js; Speicherplätze behalten.
- **Nächstes Paket 7:** Menü und Inventar optisch/funktional direkt nach BenJG420/420mon (gleiche Menüstruktur, Kategorien, Reihenfolge, Anzahl, Benutzen). Danach Paket 5 HD/PBR-Monster, dann restliche Arten. Vorhandene Mechaniken, 48 Skulpturen/372 Rekonstruktionen, Cache/Pipeline und Originalporträts behalten. Ko-fi/Zahlungen übersprungen. Ein PR und max. drei Prüfrunden je Paket.
- Abschließender Dokumentationscommit ist nur Status; veröffentlichter Spielcode bleibt 43f9f74.

## Historischer Verlauf — ältere Next-Angaben überholt

# v37 — Konsum-Paket 6

Annahme v37: Die bestehende gemeinsame Fisch-/Rausch-Effektbasis wird nach runtime.useItem/applySmoke (2D 010807da77df8468a297adf33eaf1fb5c9a61c8b) für Joint/Bud ergänzt; mehr Wild wird im vorhandenen 3D-Habitat als entsprechend schnellerer Wild-Respawn umgesetzt, statt Begegnungsmechanik neu zu bauen. Konsum im Kampf kostet originalgetreu keinen Zug; HP0 bleibt unverändert.

- v37 Runde 1: 182/182 Tests + Build grün. Runde 2: ein Chromium-Touch-Smoke bestätigt Joint/Bud-Verbrauch, stärksten gestapelten Fangbonus, Reload, Kampfkonsum ohne Zug/HP-Verlust, HP0/XP17 und schmales Layout ohne Browser-/Shaderfehler. Runde 3 CI/Pages folgt; kein weiterer Voll-Smoke. Nächstes Paket: 7 Menü/Inventar nach 2D.

# Neue Reihenfolge — Nutzerauftrag 2026-10-18

- Gebäude-Verdeckung ist abgeschlossen (PR #43, live v36). Nächstes Paket **6: Joint und Bud konsumierbar machen, mit Effekten aus BenJG420/420mon**. Danach **7: Menü/Inventar optisch und funktional nach 2D** (gleiche Struktur, Kategorien, Reihenfolge, Anzahl, Benutzen). Erst danach **5: HD/PBR-Monster**, dann restliche Arten. Je spielbarem Paket ein separater PR; keine neue Implementierung in dieser reinen Planaktualisierung.
- Annahme Reihenfolge: Die IDs 6/7 bleiben zur Zuordnung erhalten und werden vor den bisherigen Monster-Punkt 5 gezogen; aktuelle Nutzerreihenfolge hat Vorrang vor älteren Next-Angaben.
- Regeln bleiben: zuerst nur die drei Übergabedateien, dann nur benötigte Original-/Zieldateien; keine Rückfragen; höchstens drei Prüfrunden pro Paket. Spielstände und bewusste HP0-/Matratzen-Ausnahme behalten. Ko-fi/Zahlungsserver weiter übersprungen.

# Aktueller Wiedereinstieg — v36 / Gebäude-Verdeckung veröffentlicht

- **Fertig, gemergt, live:** PR #43, Spielcode 3532ec2a2acaf427d0b556628a3445dca5f994e1. Zusammengehörige Wände/Sockel/Dach/Fassade blenden weich auf 6% Deckkraft aus, sobald der Sichtkorridor Kopf/Rumpf/Füße/Schultern trifft. Kamera innerhalb eines Hauses wird erkannt. Kurze Haltezeit verhindert Flackern; originale Material-/Schattenwerte kehren zurück, wenn der Weg frei wird oder die Karte wechselt.
- **Korrektur vor Merge:** transparent/opaque setzt material.needsUpdate für die richtige Shader-Variante; im Hotpath keine neuen Vector3 pro Abtastpunkt. Materialien bleiben pro Mesh isoliert, statische Gruppen-Grenzen pro Karte gecacht. Kamera, Originalgeometrie, Kollision, Interaktionen und Saves unverändert.
- **Drei Runden abgeschlossen:** 1: 178/178 + Build. 2: ein Chromium-Touch-Smoke bestätigt aktive Ausblendung an zwei Häusern, Kapsel/Gasse-Wechsel, Aquarium, HP0/XP17, Layout ohne Browser-/Shaderfehler. Das frühe Bild entstand im Kamera-Anlauf. 3: finale PR-CI 39117667491, Main-CI 39117726567 und Pages 39117726554 grün; Live-Dateinamen passen zum Pages-Log, Inhalt/Hashes bestätigt. Kein weiterer Testlauf.
- **Offene Sichtprüfung:** zusätzliche Live-Nahansicht wartete auf 100 Software-Frames und wurde nach etwa 100 Sekunden beendet; kein belastbares ruhiges Livebild, kein Retry. Nutzer-/Gerätetest für Sichtqualität an Hauskanten sowie physisches Android/native 4K bleibt. Automatische Gruppen-/Korridor-/Rückstelltests und lokaler Touch-Smoke sind grün.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-Bmtng7Cy.js SHA256 3ed33641a58320822223138317f222796b29643cc43d6ed44931a55d8d157844; CSS index-BW3ctqqL.css. Root unverändert index-DWZ4yP_E.js. Nicht als bytegleich zum früheren lokalen Build behaupten: finale Shaderkorrektur wurde in CI gebaut.
- **Bisherige Reihenfolge (durch Auftrag oben überholt):** HD/4K-Pass für Monster (detaillierte Meshes, PBR, weiche Schattierung, keine Pixel-Weltoptik), dann restliche Originalarten. Vorhandene Pipeline/48 Skulpturen/372 Rekonstruktionen/Dex-Bilder behalten. Kein neues Spiel, keine weiteren Aquarium-/Slot-Pakete. Ko-fi/Zahlungsserver bleiben übersprungen. Ein PR und max. drei Prüfrunden pro Paket.
- Abschließender Dokumentationscommit aktualisiert nur Status; veröffentlichter Spielcode bleibt 3532ec2.

## Historischer Verlauf — ältere Next-/Stop-Angaben überholt

> v36 Abschlusskorrektur vor Merge: Wechsel opaque/transparent setzt explizit material.needsUpdate für die passende Three.js-Shader-Variante (auch bei Wiederherstellung); keine Vector3-Allokationen im Sichtkorridor. Dritter CI-/Deploy-Check prüft den endgültigen Stand, keine neue lokale Vollsuite.

# v36 — Gebäude-Verdeckung

Annahme v36: Zusammengehörige Wand-, Sockel-, Dach- und Fassadenteile werden als ein Haus weich ausgeblendet, sobald der Sichtkorridor Kopf/Rumpf/Füße verdeckt; Geometrie, Kamera, Kollision und Saves bleiben unverändert.

- Prüfung 1: 178/178 Tests + Build grün. Prüfung 2: ein Touch-Smoke bestätigt aktive Ausblendung an zwei Häusern, Kartenwechsel Kapsel/Gasse, Aquarium weiterhin erreichbar, HP0/XP17 und kein Layout-/Browser-/Shaderfehler. Das erste Bild entstand während des Kamera-Anlaufs und ist kein belastbarer Nahbildnachweis; in Runde 3 gezielte Live-Ansicht nach Kameraberuhigung prüfen. Keine weitere Voll-Smoke-Schleife. Nächstes Paket: HD/PBR-Monster.

# Aktueller Wiedereinstieg — v35 / Aquarium fertig

- **Fertig, gemergt, veröffentlicht:** PR #42, Spielcode 95e056b8096779f82d5aa8b32929357dc5f718cd. Höheres physisches Aquarium bei gleicher Grundfläche/Kollision; Interaktion öffnet beleuchtete 3D-Ansicht mit schwimmenden Originalsprites aller gefangenen Arten (maximal 42). Kein neues Fischmodell-Asset oder geänderte Spielregel. Katalog/Fischbeutel bleiben erreichbar, Grow-Vollbonus und Fänge erhalten.
- **Nächster Punkt:** verdeckende Gebäude transparent machen oder Spieler-Silhouette. Danach HD/4K-PBR-Monster und restliche Arten. Ein PR pro Paket. Ko-fi/Zahlungen bleiben übersprungen.
- **Drei Prüfrunden abgeschlossen:** 175/175 + Build; ein Chromium-Touch-Smoke (0/1/42 Arten, Millionen-Fangzahl begrenzt, Katalog/Vollbonus, Tabs/Wiederöffnen, Layout, HP0/XP17, keine Browser-/Shaderfehler); PR CI 39097040432, Main CI 39104090164 und Pages 39104090179 grün. Live-JS/CSS bytegleich zum lokalen Build. Kein vierter Prüflauf; physisches Android/4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; index-Cs1fdZ-d.js SHA256 733e529cda780e26c0f319c7911e178a0e0f6ffc5385a813a132b9424b6ba9be; CSS index-BW3ctqqL.css. Root unverändert index-DWZ4yP_E.js. Alle Speicherplätze bleiben erhalten.
- Rendering: aquarium-view.ts besitzt temporären Renderer/Materialien/Geometrien/Texturen, 30fps/DPR1.5-Limit; dispose bei Schließen/Tabwechsel, Haupt-Rendering währenddessen pausiert. Gemeinsame Spritesheets bleiben im vorhandenen Cache. Grafik verwendet Original-Fischbilder auf Sprites, keine individuellen Fisch-Meshes.
- Abschließender Dokumentationscommit ist nur Status; veröffentlichter Spielcode ist 95e056b.

## Historischer Verlauf — ältere Next-/Stop-Angaben überholt

# Aquarium v35 — fertig, Veröffentlichung folgt

Annahme v35: Das Aquarium wird bei gleicher Grundfläche höher; ursprüngliche Kollision und Interaktion bleiben erhalten. Eine Art pro Fangnachweis schwimmt sichtbar, unabhängig von der Fangmenge; Originalsprites und alle 42 Regeln/Bonusse bleiben erhalten.

- v35 Prüfung 1: 175/175 Tests und Build grün. Prüfung 2: ein Chromium-Touch-Smoke bestätigt 0/1/42 Arten, begrenzte Schwimmer trotz Millionen-Fangzahl, Katalog/Vollbonus, Tab-Wechsel/Wiederöffnen, schmales Layout, HP0/XP17; keine Browser-/Shaderfehler. Physisches Android nicht geprüft. Prüfung 3: PR/Main/Pages folgt. Nächstes Paket: Gebäude-Occlusion.

# Aktueller Wiedereinstieg — v34 / Spielautomaten fertig

- **Fertig, gemergt und veröffentlicht:** PR #41, Spielcode a587f9945e6919230beacbcb1ac6f5176931e2b7. Alle drei physischen Glutwalzen (Keller/Kino/Neonkai) öffnen jetzt 420, Obststand und Freidreher; vorher war es nur Platzhaltertext. Keine offenen Draft-Arbeiten an v34.
- **Nächster Punkt:** Aquarium vergrößern und beim Anklicken/Interagieren eine Ansicht mit schwimmenden gefangenen Fischen. Danach Gebäude-Transparenz/Silhouette, HD/4K-Monster mit detaillierten Meshes/PBR/weicher Schattierung ohne Pixeloptik, dann restliche Arten. Je Paket ein PR; Ko-fi/Zahlungsserver bleiben übersprungen.
- **Originalregeln:** src/game/slot-rules.ts ist die unveränderte 2D-slot.ts aus Revision 010807da77df8468a297adf33eaf1fb5c9a61c8b plus Quellenhinweis. 20/5/9 Linien, Stakes 1–1.000.000 pro Linie, Wild/Scatter, Obst-Nudge, Freispiele ×2, Jackpot 10 seed_eddi + 10 chip_crown. Softcash wird wie im Original ohne Outfit-/Fischbonus ausgezahlt; goldEarned zählt brutto.
- **Buchungsfix:** Einsatz/Gewinn/Jackpot/Freispielbank sind vor der reinen Animation zusammen gespeichert. Schließen/Reload zahlt niemals erneut aus; Speicherfehler rollen vollständig zurück. Neues isoliertes slotState speichert ungenutzte Freispiele mit gesperrtem Ursprungseinsatz/-linien und lesbare letzte Quittung. Team-/Box-/Pottreferenzen und HP/XP bleiben erhalten. Physische Ortsprüfung, Modal-/Encounter-/Rivalen-Sperre und Fokus/Touch sind integriert.
- **Prüflimit: drei Runden.** 1: Build grün, 174/175 Tests; nur Jackpot-Fixture erwartete fälschlich einen einzigartigen Kronen-Fund (Original-UNIQUE_FIND schließt Kronen-Chips/Zero-Day aus). 2: acht betroffene Tests und ein Touch-Smoke grün: alle Standorte, Budget, Close mitten im Spin ohne Verlust/Doppelzahlung, Reload, Auto/Stop, kostenlose/gesperrte Freispiele über Reload, HP0/XP, Layout, keine Browser-/Shaderfehler. 3: PR-CI 39079498789, Main-CI 39079548638 (175/175+Build), Pages 39079548649 grün; exakte Live-JS/CSS bytegleich zum lokalen Build. Keine vierte Vollprüfung.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; index-CwP6WDhZ.js, SHA256 115bfe8bd1119077fcd7af7eab6230a95791f0f428335cac53ecf09fb1d95cca; CSS index-Cf6YlD54.css. Stabiler Root unverändert index-DWZ4yP_E.js. Android/4K bleiben physische Gerätetests.
- Vorherige Pakete behalten: PR #39 = 48 Skulpturen / 372 Sprite-Volumen; PR #40 = Spieler-/NPC-Animation. Nicht neu bauen. Diese abschließende Aktualisierung ist Dokumentation ([skip ci]); veröffentlichter Spielcode ist a587f99.

## Historischer Verlauf — frühere Status-/Stopangaben sind überholt

> Prüfnotiz v34 Runde 2: Alle acht betroffenen Tests grün. Ein Chromium-Touch-Smoke bestätigt Keller/Kino/Neonkai, 20/5/9 Linien, Budget-Sperre, Schließen während des Drehens ohne Verlust/Doppelbuchung, Reload ohne zweite Auszahlung, Auto/Stop, kostenlose und einsatzgesperrte Freispiele inklusive Reload, Fokus, schmales Layout, HP0/XP und keine Browser-/Shaderfehler. Runde 3 CI/Pages folgt; keine zusätzliche Vollprüfung.

> Prüfnotiz v34 Runde 1: Build grün, 174/175 Tests grün. Die neue Jackpot-Fixture hatte Kronen-Chips fälschlich als einzigartigen Kiez-Fund erwartet; die Original-UNIQUE_FIND-Liste schließt Kronen-Chips und Zero-Day-Samen aus. Nur diese Erwartung berichtigt, keine Auszahlungsregel geändert. Runde 2 beschränkt sich auf acht Slot-Tests und einen kurzen Browser-Smoke; keine erneute Vollsuite.

# Aktueller Lauf — Spielautomaten v34

- Annahme v34: Alle drei physischen Glutwalzen öffnen wie im Original denselben Wähler (420/Obststand/Freidreher). Originale Streifen, Gewinnlinien, Einsätze, Wild/Scatter, Obst-Nudge und Jackpot unverändert aus src/game/slot.ts (2D-Revision 010807da77df8468a297adf33eaf1fb5c9a61c8b).
- Bugfix-Annahme v34: Einsatz und fertiger Gewinn werden vor der reinen Walzenanimation zusammen gespeichert; Schließen/Reload darf weder verlieren noch erneut auszahlen. Ungenutzte Freispiele bleiben am Freidreher mit festem Ursprungseinsatz/Linien gespeichert (neues isoliertes slotState); keine Übertragung auf andere Maschinen. Original-Softcash-Auszahlung ist ohne Kleider-/Fischbonus, goldEarned und Jackpot-Entdeckung werden mitgeführt. Speicherfehler rollen den vollständigen Buchungsversuch zurück, Team-/Box-/Pottreferenzen bleiben stabil.
- Aktuell implementiert, Prüfung folgt: alle drei Automaten, animierte Walzen mit Gewinnfeldern, Gewinn-/Linientabelle, Einsatzstaffel 1–1.000.000 pro Linie, Auto/Stop, fortsetzbare Freispiele ×2, einmalige Jackpot-Buchung 10 seed_eddi + 10 chip_crown. Escape/Fokus/Touch, Ortsprüfung und Spiel-/Rivalen-/Begegnungs-Pause sind integriert. Kein Menü-Shop oder Zahlungssystem wurde aktiviert.
- Nächstes Paket nach diesem PR: Aquarium vergrößern und eine Ansicht schwimmender eigener Fische öffnen. Weiterhin höchstens drei Runden: Tests+Build, kurzer Smoke, CI/Deployment.

# Aktueller Wiedereinstieg — v33 / Bens Fix-Liste

- **Fertig und veröffentlicht:** angefangener PR #39 (v32, cfb13ff) und Fix 1 als PR #40 (v33, 159f9a6). Keine offenen Draft-Arbeiten an diesen Paketen, nichts neu beginnen.
- **Nächster Punkt:** Spielautomaten reparieren, danach größeres Aquarium mit eigener Ansicht schwimmender gefangener Fische, dann Gebäude-Transparenz/Silhouette, dann HD/4K-Monster mit Details/PBR/weicher Schattierung ohne Pixeloptik, danach restliche Arten. Je Paket ein PR; die verbindliche Reihenfolge steht in docs/TEST_BUILD.md. Ko-fi/Zahlungsserver bleiben übersprungen.
- **Animation:** v32 überträgt absolute Posen in die korrekte Ziel-Rest-Basis; v33 prüft explizite Limb-Ketten und Clipbindungen, animiert nur Joint-Rotationen und mischt Walk/Run in gemeinsamer Schrittphase mit Gewichtssumme 1. Beide Körper und alle NPC-Klone nutzen denselben Controller. Kopf-Editor, Kleidung, Bewegung und Saves bleiben erhalten.
- **Modellstand:** 48 eigene Skulpturen / 372 Sprite-Volumen. Der HD/PBR-Pass ist noch offen und geht vor weiteren Arten. Pipeline/Cache/Viewer behalten.
- **Prüflimit eingehalten:** v32-Abschluss drei Runden (162 Tests+Build, kurzer Modell-Smoke, CI/Pages). v33 Runde 1: Build und 165/167; zwei neue Hautprüfungen nutzten falsche Einheiten, mit echter Mesh-Weltmatrix korrigiert. Runde 2: fünf betroffene Tests + ein Spiel-Smoke für Mann/Frau, Walk/Run/Idle, drei NPC-Rigs, Reload, schmales Layout, HP0/XP, keine Browser-/Shaderfehler. Runde 3: PR-CI 39076302644, Main-CI 39076375384 (167/167+Build), Pages 39076375374 grün. Keine zusätzliche Vollprüfung.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-MWpIP3YV.js, SHA256 7d8cedcd6534600e60f429d7f940265af6c507b3b58b871616b8fc8daa2af067, bytegleich zum lokalen Build; beide GLB-Hashes und MIT-Datei bestätigt. Stabiler Root unverändert index-DWZ4yP_E.js. Physisches Android/4K bleibt Nutzer-/Gerätetest.
- Diese abschließende Aktualisierung ist nur Dokumentation ([skip ci]); veröffentlichter Spielcode ist der Merge 159f9a6.

## Historische Übergaben — frühere Stop-/Draft-Status sind überholt

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
