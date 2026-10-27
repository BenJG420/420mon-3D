# Aktuelle Arbeit — Nischen v72

Annahme v72: Die neun Original-Nischen erhalten gefaltete Sichtschutz-Trennwände auf ihren bestehenden Zaunflächen; die beiden Gitter bei Glow und alle Eingänge bleiben offen wie im 2D-Grundriss, ohne neue Möbel oder Kollisionen.

- Branch `feat/nischen-details-v72`: neun eigene Metall-/Teerpappenkappen, lokale Gangdetails mit Polstern/Lüftung/Leitungen/rosa Neon, 23 Stoff-Trennwände und zwei Eisengitter, zehn Teppichzonen, drei Kisten, Kanalluke und zwei Wegweiser. Spieler/NPCs, Originalwege, Interaktionen und Saves unverändert. Wandteile ≤16 m/≤5 Materialien, Trennwände ≤4 Materialien, Gitter ≤3 Materialien; drei zusätzliche instanzierte Pfützen (35 insgesamt). Keine zusätzlichen Punktlichter/Detailschatten; vorhandenes Street-Instancing, Graffiti und Flackerlampen bleiben erhalten.
- Ein Build + 10/10 direkte Nischen-/Weltgeometrie-Tests in einer lokalen Runde grün; keine Browserläufe. Ben prüft Optik/FPS. Eigener PR und Merge folgen. Danach Schrotttor. **Monster erst nach Freigabe** durch Ben; Ko-fi/Zahlungsserver bleiben übersprungen.

## Vorheriger Stand

# Aktueller Wiedereinstieg — Labyrinth v71 veröffentlicht; Nischen als Nächstes

Annahme v71: Das Labyrinth bleibt ein offener Einblick in die originalen Innenkorridore; alle Wandhöhen und Wege bleiben erhalten, Details ragen höchstens 12 cm aus Wandflächen, und beide Gitter folgen vollständig ihren gesperrten Originalrechtecken ohne Hushs schmalen Durchgang zu verengen.

- PR #79 gemergt/live: 17 eigene Metall-/Teerpappenkappen, lokale Gangfassaden mit Oberlichtern/Gittern/Rollläden, Leitungen/Kabeln, Reparaturen/Notizen/violetten Leuchtstreifen. Zwei vollständige Eisengitter, vier flache Schattenzonen-Details, vier Kisten, Kanalluke und zwei Neon-Wegweiser. Drei Zusatzpfützen (35 insgesamt); vorhandene vier Lampen/zwei Flackerlampen, Nebel/Post-Processing/Graffiti/instanziertes Straßeninventar erhalten. Wandteile ≤16 m/≤5 Materialien, keine zusätzlichen Punktlichter/Detailschatten.
- Build + 10/10 direkte Labyrinth-/Weltgeometrie-Tests über zwei lokale Runden grün. Der erste gezielte Test fand die falsch gewählte Stirnseite der seitlichen Außenwände; Ausrichtung korrigiert, danach nur Build/Labyrinth-Test wiederholt. Keine Browserläufe; Ben prüft Optik/FPS. Originalwege/Kollisionen/Begegnungen/Interaktionen/Saves und Spieler/NPCs erhalten. Nächster eigener Bezirks-PR: **Nischen (`nische`)**, danach Schrotttor. Ko-fi/Zahlungsserver bleiben übersprungen. **Monster erst nach Freigabe** durch Ben, auch nach allen Bezirken.

- Source `95726928960a8221527bf12de2779cbfa0fa27d7`; PR CI40395872325/Main CI40396048596/Pages40396048815 grün. Live JS `index-pxEy-3q7.js`, SHA256 `40a05c5bde3c89f72ffb3b5e5c0ef634e20e2d92a578f9c617624727c8fac03b`; JS/CSS/fonts bytegleich, Stable unverändert (`v71-deploy-proof.json`).

## Vorheriger Stand

# Aktueller Wiedereinstieg — Ring v70 veröffentlicht; Labyrinth als Nächstes

Annahme v70: Der Käfig folgt vollständig den neun originalen Zaunsegmenten samt Zugängen; die bisherige zusätzliche Mini-Ring-Dekoration auf nur einem Segment entfällt, und der Arena-Belag bleibt flach auf der Originalfläche.

- PR #78 gemergt/live: vier eigene PBR-Dächer/Gym-Fassaden, fünf Wandkappen mit lokalen Leitungs-/Poster-/Reparaturdetails, neun korrekt längs ausgerichtete Käfigzäune mit Drahtgitter, flacher Arena-Belag/zwei Kreidemarkierungen, vier Bankdetails, drei Kisten, Kanalluke und zwei Neon-Wegweiser. Drei Zusatzpfützen (35 insgesamt); vorhandene drei Lampen/zwei Flackerlampen, Wetter/Graffiti/Straßeninventar erhalten. Keine zusätzlichen Punktlichter/Detailschatten.
- Build + 10/10 direkte Ring-/Weltgeometrie-Tests über zwei lokale Runden grün. Dünnen Arena-Belag gezielt an der 15-mm-Mindesthöhe des gemeinsamen Box-Helfers vorbeigeführt, damit er unter der Kreide bleibt; danach nur Build/Ring-Test wiederholt. Keine Browserläufe; Ben prüft Optik/FPS. Originalwege/Kollisionen/Begegnungen/Interaktionen/Saves und Spieler/NPCs erhalten. Nächster eigener Bezirks-PR: **Labyrinth (`labyrinth`)**, danach Nischen. **Monster erst nach Freigabe** durch Ben, auch nach allen Bezirken; Ko-fi/Zahlungsserver bleiben übersprungen.

- Source `538dc80fc4d9fce75bdca85fafef1d7aca0d68f7`; PR CI40351086283/Main CI40395073925/Pages40395074001 grün. Live JS `index-Cb0vq53h.js`, SHA256 `22dc05f389155f19a3650938473ac36b2068f602aaa172aab66bd7134ffbbc64`; JS/CSS/fonts bytegleich, Stable unverändert (`v70-deploy-proof.json`).

## Vorheriger Stand

# Aktueller Wiedereinstieg — Chemiegasse v69 veröffentlicht; Ring als Nächstes

- PR #77 gemergt/live: drei eigene PBR-Dächer/Laborfassaden, 13 Wandkappen mit lokalen Leitungs-/Reparaturdetails, sechs offene Chemiebecken mit Flüssigkeit/Armaturen/Manometern/Warnrändern, sechs flache Markierungen in den Original-Dampfzonen, ein Serviceblock, sechs Prop-Details, Kanalluke und zwei Neon-Wegweiser. Drei Zusatzpfützen (35 insgesamt); vorhandene drei Lampen/zwei Flackerlampen, Wetter/Graffiti/Straßeninventar erhalten. Keine zusätzlichen Punktlichter/Detailschatten.
- Ein Build + 10/10 direkte Chemiegasse-/Weltgeometrie-Tests in einer lokalen Runde grün. Keine Browserläufe; Ben prüft Optik/FPS. Spieler/NPCs, Originalwege/Kollisionen/Begegnungen/Interaktionen/Saves erhalten.
- Source `c713c6004a9dd12e3c7b3227e7f1fd613d95d454`; PR CI40307972359/Main CI40340191480/Pages40340191279 grün. Live JS `index-DtXC8vGI.js`, SHA256 `f41a816f3947ce428256cefd6673ee516b551c75369fedbff9494049cf65f51d`; JS/CSS/fonts bytegleich, Stable unverändert (`v69-deploy-proof.json`).
- **NÄCHSTER eigener Bezirks-PR: Ring (`ring`)**, danach Labyrinth laut TEST_BUILD.md. Nur Build + direkt betroffene Tests. **Monster erst nach Freigabe** durch Ben, auch nach Abschluss aller Bezirke; Ko-fi/Zahlungsserver bleiben übersprungen.

Annahme v69: Die sechs originalen gesperrten Becken behalten ihre .75 m hohen Sockel und erhalten sichtbare Flüssigkeit/Armaturen; flache Warnmarkierungen bleiben in den bestehenden Dampf-Begegnungszonen ohne neue Hindernisse oder Effekte.

## Vorheriger Stand

# Aktueller Wiedereinstieg — Abfluss v68 veröffentlicht; Chemiegasse als Nächstes

- PR #76 gemergt/live: vier eigene PBR-Dächer/Pumpenhausfassaden, 19 Wandkappen mit lokal gebündelten Details, neun niedrige Wasserbecken, sechs Rohre/sechs Ventile/drei Toiletten/zwei Original-Pumpensockel, sieben Prop-Details, Lukendetails und zwei Neon-Wegweiser. Vier Zusatzpfützen (36 insgesamt); vorhandene vier Lampen/zwei Flackerlampen, Wetter/Graffiti/Straßeninventar erhalten. Keine zusätzlichen Punktlichter/Detailschatten.
- Ein Build + 10/10 direkte Abfluss-/Weltgeometrie-Tests über zwei lokale Runden grün. Nur NPC-Testposition oberhalb des breiten Sluice-Gates korrigiert, kein Produktfix/erneuter Build. Keine Browserläufe; Ben prüft Optik/FPS. Spieler/NPCs, Originalwege/Kollisionen/Interaktionen/Saves erhalten.
- Source `eccc05890367c48727042077f2f451f1fbcbac66`; PR CI40300156779/Main CI40300345523/Pages40300345642 grün. Live JS `index-C_K4SfOm.js`, SHA256 `09974d80b1ba688dccf00bf304b1c9b6a4576e1d5b238866c9e2327a7daba4af`; JS/CSS/fonts bytegleich, Stable unverändert (`v68-deploy-proof.json`).
- **NÄCHSTER eigener Bezirks-PR: Chemiegasse (`chem`)**, danach Ring laut TEST_BUILD.md. Nur Build + direkt betroffene Tests. **Monster erst nach Freigabe**; Ko-fi/Zahlungsserver bleiben übersprungen.

Annahme v68: Die neun gesperrten Original-Wasserflächen werden als niedrige Becken statt hoher Mauern dargestellt; die zwei darin liegenden Original-Pumpensockel werden sichtbar, ohne neue Wege oder Kollisionen einzuführen.

## Vorheriger Stand

# Aktueller Wiedereinstieg — Aschegang v67 veröffentlicht; Abfluss als Nächstes

- PR #75 gemergt/live: sechs eigene PBR-Dächer/Industriefassaden, neun Wandkappen und drei Blockdetails, acht niedrige Glutbecken, acht Prop-Details, zwei Neon-Wegweiser, sechs zusätzliche instanzierte Pfützen (38 insgesamt). Gemeinsame Gebäude-Verdeckung, gebündelte Geometrie; kein zusätzliches Punktlicht/Detailschatten. Wetter, Street-Inventar, Graffiti und Flackerlampen erhalten.
- Originalwege/Kollisionen/Interaktionen/Saves und Spieler/NPCs unverändert. Ein Build + 10/10 direkte Aschegang-/Weltgeometrie-Tests in einer lokalen Runde grün; keine Browserläufe. Ben prüft Optik/FPS.
- Source `15ac7a0c59f03dbf8d27fd6ee8fddc7b403cf1cf`; PR CI40269542632/Main CI40269672806/Pages40269672708 grün. Live JS `index-DZ7w_bjp.js`, SHA256 `34cee28bcdcac43e8d75724f695cd6759b3fb06f8238116a5fa32d6126ef4210`; JS/CSS/fonts bytegleich, Stable unverändert (`v67-deploy-proof.json`).
- **NÄCHSTER eigener Bezirks-PR: Abfluss (`drain`)**, danach Chemiegasse laut TEST_BUILD.md. Nur Build + direkt betroffene Tests. **Monster erst nach Freigabe**; Ko-fi/Zahlungsserver bleiben übersprungen.

Annahme v67: Alle acht gesperrten Original-Glutflächen werden als niedrige Glutbecken statt teilweise als Gebäudeblöcke dargestellt; Wege, Kollisionen, Figuren und Interaktionen bleiben unverändert.

## Vorheriger Stand

# Aktueller Wiedereinstieg — Kanal v66 veröffentlicht; Aschegang als Nächstes

- PR #74 gemergt/live: eigene Metall-PBR-Abdeckungen, feuchtes Mauerwerk/Rohre/Ventile/Kästen, 14 Lukendetails/Neon-Wegweiser, flache Rinnen und 14 Zusatzpfützen. 34 lokale Wandgruppen mit Frustum-/Entfernungsausblendung; sechs instanzierte Street-Cluster über den ganzen Kanal. Figuren, Originalwege/Kollisionen/Interaktionen/Saves erhalten.
- Ein Build + 12/12 direkte Tests in einer lokalen Runde grün; keine Browserläufe. Ben prüft Optik/FPS im Testbuild.
- Source `fcb82df69c8ca42e111e73887fc289519a7b45a7`; PR CI40240562565/Main CI40240669084/Pages40240669085 grün. Live JS `index-DzmyxMmc.js`, SHA256 `de732d97e80faa8cd553cbd847d42d015bcbabee7e8c579e4acf178ac630ed01`; JS/CSS/fonts bytegleich, Stable unverändert (`v66-deploy-proof.json`).
- **NÄCHSTER eigener Bezirks-PR: Aschegang (`ash`)**, danach Abfluss laut TEST_BUILD.md. Nur Build + direkt betroffene Tests. **Monster erst nach Freigabe**; Ko-fi/Zahlungsserver bleiben übersprungen.

## Vorheriger Stand

# Aktuelle Arbeit — Kanal v66

Annahme v66: Der lange Originalkanal erhält Mauerabdeckungen und flache Entwässerungsdetails am freien Rand; kein neuer Wassergraben, keine Decke oder Änderung an Wegen, Ausstiegen und Kollisionen.

- Branch `feat/kanal-details-v66`: vier eigene Metall-PBR-Kappen, feuchter Steinboden/Mauerwerk, Rohrflansche/Ventile/Halter/Kästen/Moos/Leuchtstreifen in 34 kurzen Wandgruppen. 14 Original-Luken mit Beschlägen, 14 vorhandene Wegweiser mit Neonrahmen, 14 flache Rinnen und 14 Zusatzpfützen (46 insgesamt). Neue Detailgruppen lokal/frustum- und entfernungsbegrenzt; gemeinsame Originalwand-Verdeckung.
- Bestehende 13 Lampen (zwei flackernd), Graffiti und instanziertes Straßeninventar erhalten; dessen sechs Kanal-Cluster decken jetzt die ganze Länge ab. Keine zusätzlichen Punktlichter/Detailschatten, Figuren/Spielregeln/Saves unverändert. Ein Build + 12/12 direkt betroffene Kanal-/Weltgeometrie-/Street-Tests in einer lokalen Runde grün, keine Browserläufe. Eigener PR/Merge folgt; nächster Bezirk Aschegang. **Monster erst nach Freigabe**.

## Vorheriger Stand

# Aktueller Wiedereinstieg — Eddi-Kauf, Kino und Neonkai gemergt/live

- Eddi-Kauf-Fix PR #71 veröffentlicht: Unterhaltung bleibt trotz Eddis Bewegung am Gesprächsort nutzbar; echte Mengenwahl/Buchung und Zugangsgrenzen getestet. Ein Build + 5 direkte Tests.
- Kino v64 PR #72 veröffentlicht: Bühne/eigene Kappen, Vorhänge/Leinwand/Lautsprecher, Wand- und Gerätedetails, instanziertes Kleininventar. Ein Build + 10 direkte Tests.
- Neonkai v65 PR #73 veröffentlicht: Lagerfront/Kaimauer/eigene Metallkappen, Angelgeräte/Wasser/Neon/Pfützen, instanzierte Straßenrequisiten. Ein Build + 14 direkte Tests über zwei lokale Runden; nur alte Instancing-Erwartung nach CI-Hinweis angepasst, kein erneuter Build.
- v64 PR #72: Source `41cba85fe71a67cf2ba720ad5220ac7db3475c8b`, PR CI40211330822, Main CI40211478261, Pages40211478306; live `index-BXYyAYsO.js`, SHA256 `49ce1ad61733bad6023924d21b39266b1fa6a7eb705af14247ab493cd9d1028f`. JS/CSS/fonts bytegleich, Stable unverändert (`v64-deploy-proof.json`).
- v65 PR #73: Source `7cc915096eed0ba5e64a5bbf2c2f8f1f9db7423b`, PR CI40211639596, Main CI40211745081, Pages40211745026; live `index-Dk3ZcoWr.js`, SHA256 `7013611d790bc0c5cfd4dda68d9b32e3d528a52c99789097c6b2ba09a937b6bd`. JS/CSS/fonts bytegleich, Stable unverändert (`v65-deploy-proof.json`).
- Finale PR-CI, Main-CI und Pages aller drei Pakete grün; Veröffentlichungsnachweis in TEST_BUILD.md. Keine Browserläufe; Ben prüft Optik/FPS. Spieler/NPCs, Originalwege/Interaktionen und Saves erhalten.
- **NÄCHSTER eigener Bezirks-PR: Kanal (`sewer`)** nach TEST_BUILD.md, dann Aschegang usw. Nur Build + direkt betroffene Tests. **Monster erst nach Freigabe** durch Ben; Ko-fi/Zahlungsserver bleiben übersprungen.

## Vorheriger Stand

# Aktueller Stand — Neonkai v65 fertig, eigener PR nach Kino

Annahme v65: Neonkai bleibt der originale offene Angelkai; die gesperrte Kaimauer wird nur visuell niedriger, Lagerfassaden schmücken die vorhandene Nordwand und dekoratives Straßeninventar liegt abseits der bestehenden Zugänge.

- Fünf eigene Metall-PBR-Kappen, niedrige Brüstung mit Festmacherringen/Bollards, Lagerfront mit Rolltoren/Oberlichtern/Rinnen/Neon, vier Angelplätze und Glutwalze detailliert. Wasser und Kapsel-Pad nutzen getrennte Oberflächen, zwei zusammengefasste Wasserreflex-/Wellenbatches; fünf Zusatzpfützen (37 insgesamt). Neun instanzierte Requisiten (Flaschen/Dosen/Kartons/Rad) in sieben Materialbatches. Eine bestehende flackernde Laterne, keine zusätzlichen Punktlichter/Detailschatten.
- Originalwege/Kollisionen, Interaktionen, Spieler/NPCs und Saves erhalten. Ein Build und 14/14 direkte Tests in zwei lokalen Runden grün: zuerst 11 Kai-/Kino-/Weltgeometrie-Tests, nach CI-Hinweis drei Instancing-Tests mit aktualisierter Pfützen-Erwartung (37 statt 32). Kein weiterer Build nötig; Kino-Test deckt die Integration beider Pakete im gemeinsamen Renderer ab. Keine Browserläufe. PR/Merge/Pages folgen nach Kino PR #72. Danach Kanal als nächster Bezirks-PR. **Monster erst nach Freigabe**.

## Vorheriger Stand

# Aktueller Stand — Kino v64 fertig, PR/Merge folgt

Annahme v64: Die originale gesperrte Leinwandfläche wird als niedriger Bühnensockel gerendert; Kollisionen, Geräte und Durchgänge bleiben unverändert.

- Sechs eigene PBR-Kappen (Filz/Metall), Wandpaneele/Akustikleisten/Leitungen, Bühne, gewellte Vorhänge, Leinwandrahmen und Lautsprecher. Original-Leinwand und fünf Geräte erhalten gemeinsam ausgeblendete Ausstattung/lesbare Bedienelemente. Teppichgang, zwei instanzierte Eintrittspfützen und instanzierte Dosen/Tickets, Bestandslicht flackert. Keine zusätzlichen Lichter/Schatten der Details.
- Ein Build + 10/10 direkte Kino-/Weltgeometrie-Tests grün (Originalkollisionen/Interaktionen, Verdeckung, Ressourcenfreigabe und Saves/Figuren). Keine Browserläufe; Ben prüft Optik. Eddi-Kauf-Fix PR #71 gemergt/live, Beleg unten. Danach Neonkai v65 als eigener PR; **Monster erst nach Freigabe**.

## Vorheriger Stand

# Vorrangiger Bugfix — Eddi-Kauf (v60)

Annahme: Eine am echten Eddi gestartete Unterhaltung bleibt am Gesprächsort gültig, während er seine unveränderten Grow-Runden fortsetzt; Kartenwechsel/Schließen löschen die Unterhaltung, außerhalb dieses Orts ist kein Handel möglich.

- Ursache: Die Mengenwahl und Bestätigung prüften wiederholt Eddis inzwischen bewegte Position und schlossen das Menü ohne Meldung. Die Unterhaltung bindet sich jetzt beim Öffnen an den echten Gesprächsort; Fehler bleiben sichtbar, Kauf/Verkauf nutzen unverändert die atomare Mengenbuchung.
- Eigener Fix-PR vor Kino v64 und Neonkai. Nur Build und gezielte Shop-/Handelstests; keine Browserläufe. Ein Build und 5/5 direkte Shop-/Handelstests grün; PR #71 gemergt (`a7f8ce973370f81bdadab35baa5b2f451fea206f`), PR CI40185942418 grün. Main CI40186027775/Pages40186027808 grün; live `index-4rP0pLyZ.js`, SHA256 `934f3f4e84482289593bdf134819d94acc9ca71e93f3197f10811ef47df3a8f8`, JS/CSS/fonts bytegleich und Stable unverändert (`veddi-buy-deploy-proof.json`). Figuren und deren Verhalten unverändert. **Monster erst nach Freigabe**.

## Vorheriger Stand

# Aktuelle Arbeit — v64 Kino; Bens vier Wünsche gemergt

Annahme v64: Kino bleibt ein geschützter Innenraum; das gesperrte Leinwandrechteck wird als niedriger Bühnensockel mit eigener Filzabdeckung dargestellt, damit es die Leinwand nicht verdeckt. Originalkollisionen/Interaktionen bleiben erhalten.

- v60 Shop PR #67, v61 Rauchen PR #68 und v62 Pflanzen PR #69 gemergt/live. v62 Source `bcb94d88667fe91cba5ceda910c28b2ff700e624`, Build+17 Tests und PR CI40142788933/Main CI40142893865/Pages40142893730 grün; Live JS `index-Dub-lcq6.js`, SHA256 `2d20dede67d6c940a294fa1e02ba7b9a046a4a1f59f4282be68eb1c55eaab522`, Bytevergleich/Stable grün (`v62-deploy-proof.json`).
- v63 heller Kabelkeller PR #70 gemergt, Source `445b720623ef408071723b21aa5180f999394d5e`; ein Build+7 Tests und PR CI40142934014 grün. Main CI40143069012/Pages40143068974 grün. Live JS `index-BZ21YNr0.js`, SHA256 `a0bcbbdee13133d7d37f02f30beae75ea643a4ccdfec6f1cc5dc9769bee2b3c1` bytegleich, Stable unverändert (`v63-deploy-proof.json`).
- Branch `feat/kino-details-v64`: Kino wird jetzt mit Bühne/Kappen, Leinwandrahmen/Vorhängen/Lautsprechern, Wänden, Geräten/Labels, Gang/Eintrittsspur und instanziertem Bühnenkleinkram detailliert. Noch keine lokale Prüfung. Spieler/NPCs, Originalwege/Saves bleiben erhalten. Danach Neonkai. **Monster erst nach Freigabe**. Nur Build+direkte Tests, Ben prüft Optik.

## Vorheriger Stand

# Aktuelle Arbeit — v63 Kabelkeller heller, PR ausstehend

Annahme v63: Die bessere Lesbarkeit kommt aus vorhandenen Haupt-/Füll-/Umgebungslichtern und klarerem Nebel; keine zusätzlichen Punktlichter oder veränderten Figuren.

- Nur Kabelkeller-Grafikprofil: Hauptlicht 1,45→3, Fülllicht 0,8→1,8, Umgebung 0,44→0,95, Belichtung 1,1→1,25; hellere Lichtfarben, Nebeldichte 0,035→0,018, weniger Kontrast/Vignette/Bloom. Grundriss, Racks/Details, Spieler/NPCs, Spielregeln, Saves und Schattenbudget bleiben erhalten.
- Ein Build und 7/7 direkt betroffene Grafik-/Kabelkeller-Tests grün. Keine Browserläufe, Ben prüft Helligkeit. v62 Pflanzen PR #69 gemergt (`bcb94d8`), CI/Pages läuft. Danach Kino als nächster eigener Bezirks-PR. **Monster erst nach Freigabe**.

## Vorheriger Stand

# Aktuelle Arbeit — v62 Cannabis-Pflanzen fertig, PR ausstehend

Annahme v62: Alle vorhandenen Sorten nutzen dieselbe botanische Phasenanatomie; Sortenregeln, Zeiten, Ertrag und Pflege bleiben unverändert.

- Angefangene Pflanzen fortgesetzt: eigene Keimlingsform mit Keimblättern, verzweigte Pflanzen mit gekrümmten/gezackten 5–7-fingrigen Blättern und Adern, kompakte grüne Blüten mit hellen bzw. reifen amberfarbenen Pistillen. Gilt für Töpfe und Growboxen; bisherige Positionen, Halo/Gießeffekt und Saves erhalten.
- Gemeinsame Geometrien/Materialien, maximal fünf instanzierte Materialgruppen und weniger als 30k dargestellte Dreiecke pro Pflanze; nur Stiele werfen zusätzliche Schatten. Instanzpuffer werden bei Phasen-/Kartenwechsel freigegeben, gemeinsame Assets bleiben erhalten.
- Ein Build und 17/17 direkt betroffene Tests bereits grün, keine Wiederholung nötig/keine Browserläufe. v60 PR #67 und v61 PR #68 gemergt, CI/Pages grün. Danach v63 Kabelkeller heller, dann Kino. **Monster erst nach Freigabe**.

## Vorheriger Stand

# Aktuelle Arbeit — v61 Eddi-Rauchanimation

Annahme v61: Eddi hält den Joint am Mund; pulsierende Glut und zeitgesteuertes Ausatmen ergänzen seine Pausen, ohne Arm-/Laufanimationen oder Spielregeln umzubauen.

- Nur Eddi erhält den Effekt, an den echten Lippen-/Mund-Bones verankert, auch nach Modell-Laden. Zwölf instanzierte Rauchpartikel; keine neuen Lichter/Schatten, keine neuen Ressourcen pro Frame. Ziehen/Ausatmen passt in seine kürzeste Originalpause (1,05s); beim Gehen/aus der Nähe unterbrochen. Ressourcen werden beim Kartenwechsel einmal freigegeben.
- Ein Build und 8/8 direkt betroffene Tests grün (echte GLB-Mundposition, kurze Pause, unveränderte Bones, Ressourcen sowie Eddi-Regeln). Keine Browserläufe. PR/Merge ausstehend. v60 PR #67 ist gemergt, Pages läuft. Danach v62 Pflanzen, v63 heller Kabelkeller, Kino. **Monster erst nach Freigabe**.

## Vorheriger Stand

# Aktuelle Arbeit — v60 Eddi-Shop

Annahme v60: Eddi behält seine originalen Sonderpreise/Titelregeln; Kauf und Verkauf nutzen dieselbe atomare Mengenwahl wie normale Händler und prüfen bei Bestätigung seine aktuelle Nähe.

- Kategorien/Items wie Inventar, Beschreibungen/Bestand/Stückpreis, gemeinsamer Mengenregler mit +/−/Max/Eingabefeld/Gesamtpreis/einer Bestätigung, feste Kopf-/Fußzeile und Touch-Ansicht. Originalpreise/Saves erhalten; Titel bleibt einmaliges Flag. 21/21 direkte Handels-/Eddi-Tests grün. Erster Build fand den Begrüßungs-Callback mit neuem optionalen Elternparameter; korrigiert, nur Build erneut. Veröffentlichung ausstehend.
- Danach v61 Eddi-Rauch, v62 Cannabis-Pflanzen, v63 Kabelkeller heller, dann Kino. **Monster erst nach Freigabe**. Ben prüft Optik, keine Browserläufe.

## Vorheriger Stand

# Aktueller Wiedereinstieg — v59 Markt veröffentlicht; Bens vier Wünsche zuerst

- Markt / Silk / Static als PR #66 gemergt/live, Source `91286d17ddbd778d59ab0bfbdbf088c353a6cd63`. Eigene PBR-Dächer, Fassaden/Hofmauern, sechs Standdetails, Neon/Türbeschläge, neun Zusatzpfützen und beide Hinterzimmer. Figuren, Grundriss, Kollisionen, Spielregeln und Saves erhalten.
- Ein Build; 11/11 betroffene Tests grün über drei lokale Runden (Markt-Lichtleisten-Nachtest; CI fand alte Gasse-Testannahme ohne Marktdächer, korrigiert und gezielt grün). Finale PR CI40094281231/Main CI40094361416/Pages40094361402 grün. Live JS `index-B8mZxlyP.js`, SHA256 `cfe3bf74c300d9eccaca1d5eb53c9e99d64976a042ce7535c3e7fdf0a9746604`; JS/CSS/fonts bytegleich, Stable unverändert. Nachweis `v59-deploy-proof.json`. Keine Browserläufe.
- **NEUE Reihenfolge vor Kino/weiteren Bezirken (Ben 2026-10-24), je eigener PR:** (1) Eddi-Shop wie Inventar/normaler Shop mit Mengenwahl für Kauf/Verkauf, (2) Eddi-Rauchanimation, (3) echte Cannabis-Optik für jede Grow-Pflanzenphase, (4) Kabelkeller deutlich heller. Danach Kino. Nur Build + direkt betroffene Tests; Ben prüft Optik/FPS. **Monster erst nach Freigabe**; Ko-fi/Zahlungen übersprungen.

## Vorheriger Stand

# Aktuelle Arbeit — v59 Markt / Silk / Static

Annahme v59: Die vier originalen Nordfassaden erhalten eigene Dächer; Marktstände werden nur an ihren bestehenden Überdachungen/Theken dekoriert, Silk/Static erhalten hohe Wandregale ohne neue Hindernisse oder Änderungen an Figuren.

- Branch `feat/market-details-v59`: Markt als eigener Bezirks-PR fertig implementiert. Originalgrundriss, Händler/NPCs, Spieler, Interaktionen, Kollisionen und Saves bleiben erhalten. Vier eigene Dachflächen, Fassaden/Hofmauern, sechs bestehende Verkaufsstände, Neon/Türbeschläge, neun instanzierte Zusatzpfützen und beide Hinterzimmer fertig. Kleine Details sind materialweise zusammengefasst, ohne neue Schattenwerfer/Punktlichter; Originalverdeckung bleibt erhalten.
- Ein Build und 11/11 direkt betroffene Tests grün über drei lokale Runden: Erstlauf 10/10, finaler Lichtleisten-Nachtest Markt grün; CI fand eine alte Gasse-Testannahme ohne Marktdächer, Erwartung aktualisiert und nur Gasse-Test erneut grün. Finaler Build enthält die korrigierten Höhen. Keine Browser-/Gesamtsuite. PR/Merge/Pages noch ausstehend. Ben prüft Optik/FPS im Testbuild. Danach Kino. **Monster erst nach Freigabe** durch Ben; Ko-fi/Zahlungen übersprungen.

## Vorheriger Stand

# Aktueller Wiedereinstieg — v58 Kabelkeller veröffentlicht; Markt als Nächstes

- PR #65 gemergt/live, Source `21f7ac8ee0a8dc794688db8bc863d4c2496ee546`: 27 hohe Racks und sechs niedrige Verteiler mit eigener PBR-Metallkappe, Paneelen/Lüftern/Patchkabeln/LEDs; max. sieben Materialbatches pro Schrank, gemeinsame Verdeckung. Zehn Servicewände, vier Terminals, Neon-Wegweiser und der ursprüngliche gesperrte Stromstreifen detailliert; feuchter Steinboden/Wege-Markierungen/drei instanzierte Zusatzpfützen.
- Spieler/NPCs, Originalgrundriss, Kollisionen, Interaktionen und Saves unverändert. Street-Details/Graffiti und bestehende flackernde Laternen bleiben erhalten; keine neuen Punktlichter.
- Build und 12/12 direkt betroffene Tests grün über zwei lokale Runden: neuer Kabel-Test brauchte aktualisierte Elternmatrizen und stabile Occluder-Liste im Fixture; gezielter Recheck grün, kein Produktfix/erneuter Build. PR CI40070568787/Main CI40070663853/Pages40070663930 grün. Live JS `index-CE5_O_4F.js`, SHA256 `0ae8f9294d8034db404b0afd48201b9186f8d3d0b10c38701d7dd8e9bb7dbc91`; JS/CSS/fonts bytegleich, Stable unverändert. Nachweis `/workspace/scratch/420mon-audit/v58-deploy-proof.json`. Keine Browserdurchläufe, Ben prüft Optik/FPS.
- **NÄCHSTER eigener Bezirks-PR: Markt (`market`) detaillieren.** Danach Kino, Neonkai usw. laut TEST_BUILD.md. Gemeinsame Detail-Systeme und Figuren beibehalten. **Monster erst nach Freigabe** durch Ben. Ko-fi/Zahlungen übersprungen.

## Vorheriger Stand

# Aktuelle Arbeit — v58 Kabelkeller

Annahme v58: Der unterirdische Kabelkeller erhält eigene Metallabdeckungen auf den bestehenden Server-/Verteilerschränken statt zusätzlicher Außendächer; der originale gesperrte Stromstreifen wird als elektrische Kabeltrasse dargestellt, Kollision/Spielregeln bleiben erhalten.

- Branch `feat/cable-details-v58`: 27 hohe Racks und 6 niedrige Verteiler vollständig auf ihren Originalflächen detailliert, maximal 7 Materialbatches pro Schrank statt vieler Einzelteile. Eigene PBR-Metallkappen, Lüfter/Paneele/Griffe, Patchkabel, grün/amber LEDs. Sämtliche Teile gemeinsam mit dem Schrank ausgeblendet.
- Zehn originale Wandflächen erhalten Leitungen, Halter, Verteiler und Warnmarker; vier Terminals sichtbare Anschlüsse/Leitungen, Originalschilder Neonrahmen. Feuchter Steinboden, flache Markierungen auf bestehenden Wegen und drei zusätzliche instanzierte Pfützen. Street-Details/Graffiti/flackernde Bestandslampen bleiben erhalten; keine neuen Punktlichter.
- Spieler/NPCs, ursprüngliche Wege/Kollisionen, Interaktionen und Saves bleiben unverändert. Build grün; 12/12 betroffene Tests grün über zwei lokale Runden. Neuer Kabel-Test benötigte aktualisierte Elternmatrizen und eine stabile Occluder-Liste im Fixture; danach 1/1 gezielter Recheck grün, kein Produktfix/erneuter Build. PR/Merge/Pages noch ausstehend; keine Browserdurchläufe. Danach Markt. **Monster erst nach Freigabe** durch Ben; Ko-fi/Zahlungen übersprungen.

## Vorheriger Stand

# Aktueller Wiedereinstieg — v57 Wandbilder/Laternen veröffentlicht; Kabelkeller als Nächstes

- PR #64 gemergt/live, Source `e0047192c99720b2e0a15eddd65aa8d7e43caee9`: Graffiti/Tags, Sticker und Plakate über eine gemeinsame Atlastextur auf Originalwänden, inklusive Gasse A. Maximal 24 Wandbatches mit Gebäudeverdeckung. Bis zu zwei bestehende Laternen pro Bezirk dimmen kurz und weich; eigenes Leuchtmaterial/Lichtpfütze, keine neuen Lichter/Schattenwerfer.
- Build und alle 6 direkt betroffenen Tests grün über zwei lokale Runden (ein ungültiges Save-Fixture korrigiert, danach 2/2 gezielte Wall-Art-Tests grün; kein erneuter Build). PR CI40049888375/Main CI40049999013/Pages40049999049 grün. Live JS `index-Cd30CJG2.js`, SHA256 `36148a66949426912d8051931d181dd44feb673708f680ea4ab9e48024b0210d`; JS/CSS/fonts bytegleich, Stable unverändert. Nachweis `/workspace/scratch/420mon-audit/v57-deploy-proof.json`. Keine Browserdurchläufe, Ben prüft Optik/FPS.
- Spieler/NPCs, Originalwege/Kollisionen, Spielregeln und Saves unverändert. Vorherige Pakete v55 Grow-Hinterhöfe/Moss PR #62 und v56 Street-Details PR #63 ebenfalls veröffentlicht.
- **NÄCHSTER eigener Bezirks-PR: Kabelkeller (`cable`) detaillieren.** Gemeinsame Street-Details und Wandbilder/Lampen beibehalten; danach Bezirke einzeln laut TEST_BUILD.md. **Monster erst nach Freigabe** durch Ben. Ko-fi/Zahlungen übersprungen.

## Vorheriger Stand

# Aktuelle Arbeit — v57 Wandbilder und flackernde Laternen

Annahme v57: Graffiti/Tags/Sticker/Plakate nutzen freie untere Fassadenbänder und vorhandene Hofmauern; maximal zwei bestehende Laternen pro Bezirk flackern kurz und weich, ohne neue Lichter oder Spielregeln.

- Angefangenen Branch `feat/wall-art-lamps-v57` fortgesetzt. Eine gemeinsame 1024×512-Atlastextur, maximal 24 zusammengefasste Wand-Meshes pro Bezirk, gemeinsam mit der jeweiligen Originalwand ausgeblendet. Bestehende Fensterbänder bleiben frei.
- Flackern ändert nur Intensität, eigenes Leuchtmaterial und vorhandene Lichtpfütze; Lichtauswahl und Schattenbudget bleiben erhalten. Spieler/NPCs, Wege/Kollisionen, Mechaniken und Saves unverändert.
- Build grün, alle 6 direkt betroffenen Tests grün über zwei lokale Runden: erster Lauf 5/6, ungültiges Test-Save-Fixture um Gold-Feld ergänzt, danach 2/2 Wall-Art-Tests grün. Kein Produktfehler, keine erneute Build-/Gesamtsuite. PR/Merge/Pages noch ausstehend, keine Browserdurchläufe. Danach Kabelkeller als nächster eigener Bezirks-PR. **Monster erst nach Freigabe** durch Ben, Ko-fi/Zahlungen übersprungen.

## Vorheriger Stand

# Aktueller Wiedereinstieg — v56 Street-Details veröffentlicht; Wanddetails/Lampen ergänzen

- PR #63 gemergt/live, Source `ed853d82dcf99ef7d3a7924cd6c25b695b9fd2fa`: gemeinsame instanzierte Flaschen/Dosen/Kartons/Fahrräder/Einkaufswagen in 14 Bezirks-/Verbindungskarten, inklusive Gasse A. Originalwege, Figuren, Kollisionen und Saves unverändert; kleine Instanzzellen/Distanz-Ausblendung, keine zusätzlichen Schattenwerfer/Lichter.
- Zwei lokale Runden: Builds grün, Alley/Yard-Regressionschecks grün; Street-Tests 2/2 nach korrigiertem Ausweichplatz für Einkaufswagen grün. PR CI40020045721/Main CI40020249737/Pages40020249742 grün. Live JS `index-CtT5N5H2.js`, SHA256 `f14f40613bb514aa5a60b231091730b78eda84c4898fc0fda6b7c0ab4be4f39d`, JS/CSS/fonts bytegleich, Stable unverändert. Nachweis v56-deploy-proof.json. Keine Browserprüfung.
- Ben ergänzt jetzt Graffiti/Tags/Sticker/Plakate und einzelne flackernde Laternen für alle Bezirke, Gasse A nachrüsten. Als eigener nächster kleiner PR, weil #63 bereits gemergt ist. Danach Kabelkeller. **Monster erst nach Freigabe** durch Ben, Ko-fi/Zahlungen übersprungen.

## Vorheriger Stand

# Aktuelle Arbeit — v56 Street-Details in den Bezirken

Annahme v56: Straßenkleinkram wird bei bestehenden Tonnen platziert; Fahrräder/Einkaufswagen stehen nur im Freien, Innenbezirke erhalten Flaschen/Dosen/Kartons. Reine Kulisse ohne neue Kollisions- oder Speicherobjekte.

- Bens Ergänzung nach bereits gemergtem PR #62: gemeinsame instanzierte Flaschen, Dosen, offene Kartons, Fahrräder und Einkaufswagen für alle 14 Bezirks-/Verbindungskarten mit Tonnen, einschließlich Gasse A und Grow-Hinterhöfen. Originalobjekte, Türen/NPC-Zugänge und gesperrte Flächen werden bei der Platzierung ausgespart.
- Kleine 16m-Instanzzellen, gemeinsam verwendete Modelle/Materialien, Distanz-Ausblendung hinter 48m plus Zellenradius, keine zusätzlichen Schattenwerfer/Lichter. Spieler/NPCs unverändert. Zwei lokale Prüfrunden: beide Builds grün; Alley/Yard-Regressionschecks grün. Street-Test fand fehlenden Einkaufswagen am überfüllten ersten Alley-Standort; Ausweichplatz ergänzt, 2/2 Street-Tests final grün (alle 14 Karten, Instancing/Culling/Disposal). PR/Veröffentlichung stehen aus; keine Browserprüfung.
- Danach Kabelkeller als eigener Bezirks-PR; weitere Bezirke einzeln. **Monster erst nach Freigabe** durch Ben. Ko-fi/Zahlungen übersprungen.

## Vorheriger Stand

# Aktueller Wiedereinstieg — v55 Grow-Hinterhöfe veröffentlicht; Street-Details ergänzen

- Grow-Hinterhöfe/Moss PR #62 gemergt und live, Source `da473611a0dad18c703f5e1db7033cc9ae7d2026`: drei eigene PBR-Schuppendächer, Fassaden/Rinnen/Hofmauern, Vegetation, Neon/Müll, instanzierte Grünflächen/Pfützen und Moss-Wanddetails. Grundriss, Spieler/NPCs, Kollisionen, Spielregeln/Saves unverändert.
- Eine lokale Prüfrunde: Build + 14/14 direkt betroffene Tests grün. PR CI40018866793/Main CI40019032929/Pages40019032930 grün. Live JS `index-Draa-8EJ.js`, SHA256 `364debcd0e8a2391f61a54c1356ebbb3ca1e166e093513594cc2e071634a8ad7`; JS/CSS/fonts bytegleich, Stable unverändert. Nachweis `/workspace/scratch/420mon-audit/v55-deploy-proof.json`. Ben prüft Optik/FPS, keine Browserdurchläufe.
- Ben ergänzt während Veröffentlichung: mehr leere Flaschen, Fahrräder, Dosen, Kartons/Einkaufswagen für alle Bezirke, Gasse A nachrüsten, Instancing beachten. Als eigener nächster kleiner PR, weil #62 bereits gemergt ist; danach Kabelkeller. **Monster erst nach Freigabe**, Ko-fi/Zahlungen übersprungen.

Annahme v55: Drei kleine gesperrte Originalrechtecke sind Geräteschuppen; grüne Dekoflächen bleiben begehbar, Moss’ vorhandenes Hinterzimmer gehört zum Bezirkspaket.

## Vorheriger Stand

# Aktueller Wiedereinstieg — v54 Gasse A veröffentlicht; Grow-Hinterhöfe als Nächstes

- Gasse A als PR #61 gemergt, Source `15d104ff5b172966b2a3e3108539805bebfb8d97`: eigene Ziegel-/Blech-/Teerpappe-Dächer, vollständige Fassaden/Rinnen/Kabel, Neon/Schilder/Türdetails, Müll/Efeu und sechs weitere Pfützen. Benannte Hausfronten korrekt zugeordnet, einschließlich Raze/Cherry am Kartenrand; Gebäude-Verdeckung beibehalten.
- Drei lokale Runden verbraucht: Builds grün, 15 weitere betroffene Tests grün; Alley-Test fand zwei korrigierte Renderzuordnungen und zuletzt legitimen Erstbesuchsquest im Fixture. Fixture korrigiert, keine vierte lokale Runde. Finale PR CI39970548173 bestätigt alle Tests+Build grün. Main CI39970741718/Pages39970741771 ebenfalls grün. Live JS `index-DzV-Bttf.js`, SHA256 `d0fe002d13c68bc11de0f5984367d57c51bae105bc15c486fd528c61f5075838`; CSS/Fonts bytegleich zum lokalen Build, Stable unverändert. Nachweis `/workspace/scratch/420mon-audit/v54-deploy-proof.json`. Keine neue Browserprüfung, Ben testet selbst.
- Buff-HUD PR #60 sowie Performance/FPS PR #59 ebenfalls gemergt/live. Die bestehenden Save-/Buff-/Kleidungsregeln und Spieler/NPCs bleiben erhalten.
- **NÄCHSTER eigener PR: Grow-Hinterhöfe (`yard`) nach der Referenz detaillieren.** Danach weitere Bezirke einzeln, Originalgrundrisse/Kollision/Spieler/NPCs erhalten. Nur Build + direkt betroffene Tests, Ben prüft Optik/FPS. **Monster erst nach Freigabe** durch Ben, Ko-fi/Zahlungen übersprungen.

## Vorheriger Stand

# Aktuelle Arbeit — v54 Gasse A

Annahme v54: Gasse A ist das erste Bezirks-Paket; Details bleiben reine Darstellung auf dem Originalgrundriss, vorhandene Licht-/Schatten-/Wetterbudgets und Figuren bleiben erhalten.

- Buff-HUD PR #60 ist zuerst gemergt und live. Angefangene Gasse A übernommen, nicht neu gebaut; Branch nach Integration des Buff-Fixes `feat/alley-details-v54`.
- Drei eigene PBR-Dachtypen (Ziegel/Blech/Teerpappe) mit Farb-/Rauheits-/Normalmaps, bedarfsweise Textur-Cache; vier Fassadenseiten mit Rinnen/Leitungen/Kabeln/Rollläden/Vegetation, Hausnamenschilder in Gebäudeverdeckung, Neonrahmen, Haustürdetails, Müllgruppen und sechs zusätzliche gebündelte Pfützen.
- Kein neuer Spieler/NPC/Save-/Mechanikpfad. Fassaden max. acht Materialbatches plus Hausname, Müll drei Meshes/Tonne, keine neuen Punktlichter. Nur Build + direkt betroffene Tests; Ben prüft die Optik im Testbuild.
- Prüfbudget v54 ausgeschöpft: Build grün in allen drei Runden; 15 übrige direktbetroffene Tests grün. Alley-Test deckte fehlende Hauszuordnung und Randhaus-Klassifikation auf (korrigiert); dritter Lauf erreichte Ressourcenprüfung und scheiterte erst an legitimem 18-Gold-Erstbesuchsquest im Fixture. Fixture jetzt bereits belohnter Marktbesuch, keine vierte lokale Runde; bestehende PR-CI bestätigt finalen Stand.
- Danach Grow-Hinterhöfe (`yard`) als eigener PR, übrige Bezirke einzeln. **Monster erst nach Freigabe** durch Ben. Ko-fi/Zahlungen bleiben übersprungen.

## Vorheriger Stand

# Aktueller Wiedereinstieg — v53 Buff-HUD veröffentlicht; Gasse A fortsetzen

- PR #60 gemergt/live, Source `1ae40091bc6f925aad3ee4e19286db3ca8dc875a`. Buffsymbole/Restzeit im Cash-HUD; getrennt einklappbar und über Haupt-HUD versteckbar. Bestehende Spielzeit-/Outfitregeln erhalten.
- Build + 3/3 gezielte Tests, PR CI39931342196/Main CI39931435161/Pages39931435097 grün. JS `index-CLGU9YtK.js`, SHA256 `19c29ccde341233742134454bb52fa70f783a5c3b003e9edfabbc4f1cb525597`; CSS `index-DAJEILXa.css` und Fonts bytegleich zum lokalen Build; Stable unverändert. Nachweis v53-buff-deploy-proof.json. Keine Browserprüfung, Ben testet selbst.
- Als Nächstes angefangene Gasse A (Dächer/Fassaden/Schilder/Neon/Müll/Pfützen) als v54/eigener PR fertigstellen. Vorhandene Arbeit auf feat/alley-details-v53 in /workspace/420mon-3D beibehalten und mit main zusammenführen. Danach Bezirke einzeln, Spieler/NPCs nicht verändern. **Monster erst nach Freigabe**.

## Vorheriger Stand

# Aktuelle Arbeit — v53 Buff-HUD vor den Bezirken

Annahme v53: Zeitliche Buffs zeigen die bestehenden Spielzeitsekunden; der einzige aktive Outfitbonus zeigt ∞ (solange getragen), permanente Silk-/Züchterboni ∞. Sichtbare Kleidungsslots werden nicht zu neuen Boni addiert.

- Bens GUI-Priorität: Buffsymbole/Restzeit oben links innerhalb desselben Cash-/Zeit-/Level-HUD. Native einklappbare Buffliste, Status als separate UI-Präferenz, Haupt-HUD-Schalter blendet beide aus. Keine Save-/Buff-/Kleidungsmechaniken geändert.
- 2D-Quellabgleich aus 010807da: overlays.tsx Hud()/runtime.highList()/outfitHud; Reihenfolge/Farben und Sekunden übernommen. Icons ergänzen Bens ausdrücklichen Symbolwunsch. Keine neue Browserprüfung der Live-Referenz; Ben prüft im Testbuild.
- v52 PR #59 gemergt/live, Source `7127acf592e3dcca910ae45c8266c5d083738e68`. Build+26Tests/PR CI39899369123/Main CI39899470712/Pages39899470729 grün. JS index-BPGswZVk.js SHA256 685563e2d2444b1154ef4e9d90367e89b73502b34449bcd567e070de664c249f; JS/CSS/Fonts bytegleich zum Build, Stable unverändert.
- Build + 3/3 gezielte HUD-Tests grün; keine Browser-/Vollsuite.
- Danach Gasse A als v54/eigener PR fortsetzen. Uncommitted Arbeit liegt auf feat/alley-details-v53 in /workspace/420mon-3D; nicht neu beginnen. Dieser GUI-Fix ist isoliert in /workspace/420mon-hud-buffs. Nur Build+direkt betroffene Tests, Ben testet selbst. **Monster erst nach Freigabe**.

## Vorheriger Stand

# Aktuelle Arbeit — v52 Performance/FPS

Annahme v52: Ohne weitere Browserläufe werden keine FPS erfunden; Ben misst im Testbuild denselben Standort über Hilfe → FPS vergleichen, während Node-Tests nur Geometrie/Draw-Call-Potenzial belegen.

- Branch `perf/static-district-v52`: Gras/Pfützen in räumlich begrenzten Instanzen, Schattenbudget nach Grafikstufe; Hoch behält v51-Auflösung. Kein Spieler-/NPC-/Mechanik-/Save-Umbau.
- FPS-Vergleich: je 2s Aufwärmen + 10s Messung, echte ungekappte RAF-Zeiten, Ø FPS/1% Low/p95/Draw Calls, Kontext/JSON lokal. Bewegung, fremde Overlays, Größen-/Kartenwechsel oder Hintergrundtab brechen ab. Standard bleibt optimiert.
- Build + 26/26 direkt betroffene Tests grün (18 Welt/Grafik + 8 FPS-Auswertung); keine neue Browser-/Vollsuite. Nach eigenem PR/Merge folgt Gasse A als erster Bezirks-PR; weitere Bezirke einzeln. Monster erst nach Bens ausdrücklicher Freigabe, Ko-fi/Zahlungen übersprungen.

## Vorheriger Stand

# Aktueller Wiedereinstieg — v51 veröffentlicht; Performance/FPS v52 als Nächstes

- GUI PR #58 gemergt/live, Source `095856c1e558c2ccfcc830a8eb5b961db128e37d`. Grow-Aktionen direkt unter Auswahl, Menü/Inventar/HUD nach tatsächlich besuchter 2D-Vorlage. Existierende Itemglyphen behalten; kein Import illustrierter Itembilder behaupten.
- Build + 28 direktbetroffene Tests grün, keine neue Browser-/Kombinations-/Vollsuite. PR CI 39828716546/Main CI39828751359/Pages39828751392 ebenfalls grün. Live JS `index-DHW3W9Wh.js`, SHA256 `3ebf0b02af182387731afaca713267bc64f663202dfc66d9191df76ca26c5264`, CSS `index-CDjTSEA-.css` und beide lokalen OFL-Fonts bytegleich zu lokalem Build; Stable unverändert. Pages-Logabruf leer, daher Nachweis über Workflowstatus und Livebytes. `/workspace/scratch/420mon-audit/v51-deploy-proof.json`.
- Ben 2026-10-23: nächster Punkt Performance/FPS, danach Bezirke einzeln/eigener PR, eigene Dächer/Fassaden/Schilder/Neon/Müll/Pfützen; Spieler/NPCs nicht verändern. Nur Build+betroffene Tests, Ben prüft im Testbuild. Monster erst nach Bens ausdrücklicher Freigabe.

## Historischer Verlauf

# Aktuelle Arbeit — v51 GUI nach Live-2D und Grow-Aktionen oben

Annahme v51: Die beobachtete 2D-Menüstruktur/Farben/Schriften/Touch-Bottomsheets werden auf vorhandene 3D-Funktionen übertragen; Handy/Leiste ist eine separate UI-Einstellung, bestehende Item-Glyphen bleiben bis echte Originalillustrationen übernommen werden.

- v50 PR #57 jetzt live, Main CI 39827460352/Pages 39827460331 grün, Assets geprüft. v49 PR #56 ebenfalls veröffentlicht.
- GUI: feste Header/Footer, geordnete Inventarzähler/Aktionen, weniger HUD-Überlappung, Daten links/Minimap rechts, Shortcuts unten; Funktionen bleiben über Menüs zugänglich. Lokale OFL-Schriften in public/fonts + ASSET_ATTRIBUTION.
- Grow: Auswahl → Eingaben/Pflanzen oder Gieß-Rhythmus/Ernten → Illustration/lange Details. Keine Regel-/Bonus-/Handelsänderungen.
- Neue Sparregel gilt: nur Build + direkt betroffene Tests, keine Browser-/Kombinations-/Vollsuite. Ben prüft selbst im Testbuild. v51 Build + 28/28 betroffene Tests (inventory-menu, grow, trade-state) grün; keine Browserrunde/Vollsuite. PR/Merge/Deploy als Nächstes. Danach Performance/Bezirke; Monster erst nach Bens ausdrücklicher Freigabe.

# Aktueller Wiedereinstieg — v50 gemergt; weiter mit GUI v51

- Starter-Koffer PR #57, Source `97e68c9c9904ebb4d4e8668b25306bf6b62e2e1d`, gemergt. 214 Tests + korrigierter Build; bereits gestarteter Smoke abgeschlossen, keine neuen Browserläufe. PR CI 39827322232 grün, Pages 39827460331 noch zu bestätigen.
- NEUE Regel Ben: nur Build + direkt betroffene Tests, keine breiten Suiten/Kombinationsprüfungen/Browserdurchläufe. Ben testet im Testbuild. Bestehende automatische CI darf laufen.
- Als Nächstes eigener GUI-PR: echte 2D-Live-Referenz bereits angesehen, Notizen `/workspace/scratch/420mon-audit/v51-reference-notes.md`; feste Header/Footer, Handy/Leiste getrennt von Grafik, kompakteres HUD/Inventar. Grow: Gieß-Rhythmus und Pflanzaktionen direkt unter Topf-/Growbox-Auswahl. Monster erst nach Bens ausdrücklicher Freigabe.

## Historischer Verlauf

# Aktuelle Arbeit — v50 Starter-Koffer

Annahme v50: Wie 2D runtime.objLive gilt ausschließlich ein nichtleerer gespeicherter starterId als abgeschlossene Wahl; Team/Box/eddiSeed allein beweisen keine Starterwahl und dürfen den Koffer nicht entfernen.

- PR #56 / v49 ist gemergt und live. Jetzt Koffer nach Wahl aus Darstellung, Minimap, Interaktion und Kollision entfernen; reguläre alte 3D-/2D-Saves enthalten starterId bereits. Keine neuen Rewards/Migrationen.
- v50: vor neuer Sparregel bereits 214/214 Tests bestanden; erster Build TS-Weak-Type-Fehler, korrigierter Build bestanden. Bereits gestarteter kurzer Browsercheck fertig: echte Wahl/Reload und alter 2D-Save auf Touch erfolgreich, HP0/XP17/Originalslot erhalten, keine Browser-/Shaderfehler. Keine weitere Browserprüfung. PR/Merge jetzt.
- NEUE Sparregel Ben 2026-10-22: nur Build und direkt betroffene Tests; keine breiten Suiten/Kombinationsläufe/Browser-Runden mehr. Ben testet selbst im Testbuild. Für GUI Grow-Pflege-/Pflanzaktionen direkt unter Topf-/Growbox-Auswahl platzieren.

# Aktueller Wiedereinstieg — v49 gemergt und live; nächster Schritt Starter-Koffer

- PR #56 fertig, Source `a10f5a42779bbe03d1a7535b2be1d8a7a6ae7133`. Mengenwahl für NPC/Grow/Kapseln, Originalpreise, einmalige Buchung und vollständiger Rollback bei Speicherfehlern.
- Drei Prüfblöcke abgeschlossen: 211/211 + Build; Desktop-Smoke mit Bildprüfung (Grow-Position im Harness durch pagehide überschrieben); finale PR CI 39781120478/Main CI 39781292426/Pages 39781292473 grün. Gezielter Live-Grow-Touchcheck 320px inklusive Kaufen/Max-Verkaufen/Reload/HP0/XP17/Original- und Stable-Save bestanden, keine Browser-/Shaderfehler, Bild angesehen.
- Live JS `index-DuDgF1N1.js`, SHA256 `0ad2e8415d1abacc411e88b75e6b7c24b5c34d68a1f954c4548127dd0935adbd`, CSS `index-BC8t3waH.css`; Pages-Dateinamen/Hashes bestätigt, Stable unverändert. Nachweise `/workspace/scratch/420mon-audit/v49-*`.
- Nächster eigener PR: Starter-Koffer. Danach direkt GUI nach tatsächlich besuchter 2D-Referenz; Notizen `/workspace/scratch/420mon-audit/v51-reference-notes.md` und Screenshots vorhanden. Dann Performance und Bezirke. **Monster erst nach Freigabe** durch Ben, keine automatische Freigabe nach Bezirken.

## Historischer Arbeitsverlauf

# Aktuelle Arbeit — v49 Mengenwahl, danach Starter-Koffer und GUI

Annahme v49: Mengenhandel gilt für NPC-Shops, Fangkapseln und Grow-Shop; einmalige Topf-/Boxfreischaltungen bleiben Einzelkäufe, Original-Stückpreise und Boni bleiben unverändert; bestätigter Stückpreis gilt für die Gesamtmenge, durch den Verkauf neu freigeschaltete Boni ab dem nächsten Vorgang.

- Ben 2026-10-22: Mengenwahl als eigenes Paket/PR fertigstellen, danach Starter-Koffer, danach GUI. v49: Prüfblock 1 erfolgreich (211/211 Tests + Build). Prüfblock 2: NPC-Handel/Desktop inklusive Speicherfehler/Rücksetzen erfolgreich, Bild geprüft; Grow-Touch stoppte im Harness, weil pagehide die vor Reload gesetzte Position überschrieb. Kein Browser-/Shaderfehler. Max-Umbruch/Bestätigungsfarbe korrigiert; Block 3 ist PR/CI/Deploy plus gezielter Grow-Touch-Livecheck. Kein weiterer Volltest.
- GUI-Referenz live https://coral-nova-gem-pearl.grok.me/ ohne E-Mail ansehen; Menü, Inventar, HUD nachbauen und Sichtbefund in TEST_BUILD.md dokumentieren. Isolierter Gastkontext, keine bestehenden 2D-Spielstände ändern.
- **Monster erst nach Freigabe**: keine weiteren Sculpts ohne Bens ausdrückliche Zustimmung. Vorher Fehler/Performance sowie sämtliche Bezirksgrafik/-details abschließen; Abschluss dieser Arbeiten ist keine automatische Freigabe.

## Letzter veröffentlichter Stand

# Aktueller Wiedereinstieg — v48 Kleidung fertig, gemergt, live

Annahme v48: Vorhandene Kleidungsitems schalten passende Einzelteile frei; sechs Slots kombinieren sie auf den bestehenden Rigs. Alte Outfits werden in Slots überführt, Originalboni bleiben bei einem aktiven Kleidungsitem ohne Addition; keine neuen Käufe oder Änderungen an NPCs/Animationen.

- **Fertig:** [PR #55](https://github.com/BenJG420/420mon-3D/pull/55), veröffentlichter Spielcode `8e21282590e35edda1564a96ea8b2dae9c803b4a`. Oberteil/Jacke/Hose/Schuhe/Kopf/Accessoires frei kombinierbar, Latzhose + Lederjacke, Inventar-/T-Verhalten, Legacy-Migration und Rollback bei Speicherfehler. Eigene beleuchtete Vorschau verhindert Verdeckung durch Zimmerobjekte. Original-GLBs/Lizenzen/Bones/Animationen und NPC-Pfad unverändert.
- **Dateien:** wardrobe.ts Katalog/Normalisierung; clothing-state.ts Besitz, sechs Slots, Originalbonus und Transaktion; wardrobe-rig.ts exklusive zugeschnittene Skin-Flächen/Headwear; wardrobe-preview.ts dieselbe Spielfigur vor freiem Hintergrund; clothing-visuals.ts Fallback; main.ts/systems.ts/Save/CSS Integration. Kein neuer Spielstandschlüssel. Materialoberflächen folgen der vorhandenen Körpergeometrie, keine neue Cloth-Simulation.
- **Drei Prüfblöcke verbraucht:** 1. 201/201 Tests + Build; 2. lokaler Desktop/Touch-Smoke: Vorschaupfad/Selektor im Harness korrigiert, Slots/Migration/Tausch/Speicherfehler bestätigt, fünf Bilder angesehen; Stop an Walk-Erwartung (Kellerposition blieb Idle), keine Browser-/Shaderfehler. Verdeckung und grobe Stoffkanten danach gezielt korrigiert, kein weiterer lokaler Lauf. 3. PR CI `39678627491`, Main CI `39678879707`, Pages `39678879875` grün; finale CI bestätigt alle 2.304 Kombinationen je echtem Rig, Fallback/State, Animationen/Körperextreme/Resourcen. Abschließender fokussierter Liveblick bestätigt freie Vorschau beider Rigs, Hut/Kapuze/Drehen/Tausch, Desktop/Touch, Reload, Inventar, T, HP0/XP17 und Original-/Stable-Saves, ohne Browser-/Shaderfehler. Alle vier Livebilder angesehen. Keine weitere Schleife; Browser-Walk nicht als bestanden behaupten, echte GLB-Walk/Run-Tests grün; physisches Android bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS `index-DdlI5VEC.js`, SHA256 `db469815262c217f4360ddb310a64d8536d56953f1b2ce809ab8ae73143c794f`; CSS `index--XBrvHKG.css`. Dateinamen/Inhalt/Hashes zu Pages bestätigt, Root weiter `index-DWZ4yP_E.js`. Nicht bytegleich zum älteren lokalen Smoke-Build behaupten, da finale Korrekturen in CI gebaut.
- **NÄCHSTE Pakete (Ben 2026-10-21), je eigener PR:** 1. Mengenwahl Kaufen/Verkaufen mit Slider oder +/-/Max/Eingabe, Live-Gesamtpreis, einmalige Gesamtbestätigung, Desktop/Touch und Tests. 2. Starter-Koffer nach Wahl ausblenden, einschließlich Reload/Altsaves mit Test. 3. GUI. 4. Performance mit FPS vorher/nachher. 5. Bezirke einzeln mit eigener Dachgestaltung/Details (Spieler/NPCs unverändert). Danach Monster ab Dex #97. Diese Reihenfolge steht in TEST_BUILD.md vor den Monstern; Ko-fi/Zahlungsserver bleiben übersprungen.
- PR #54 / Dex #91–96 ebenfalls abgeschlossen; 96 eigene Skulpturen / 324 Rekonstruktionen. Ypipe-Ansichtsrest bleibt zurückgestellt. Bestehende Mechaniken/Saves beibehalten. Weiterhin nur relevante Dateien lesen, keine Rückfragen, maximal drei Prüfblöcke pro Paket.
- Nachweise: `/workspace/scratch/420mon-audit/v48-tests.log`, `v48-build.log`, `v48-smoke-results.json`, `v48-preview-start-failure.json`, `v48-smoke-selector-failure.json`, `v48-live-proof.json`, `v48-live-*.png`, CI/Pages-Protokolle, `v48-deploy-proof.json`. Dieser abschließende Dokumentationscommit ändert keinen Spielcode.

## Vorheriger veröffentlichter Stand

# Aktueller Wiedereinstieg — v47 veröffentlicht; NEU Kleidung vor weiteren Monstern

- **Fertig, gemergt, live:** PR #54, Spielcode 1e46dcd91dd7e1db31d4cf32c9f39de2a5cf4324. Ashpan, Ypipe, Glovepair, Taperoll, Deadend und Spotlamp nach echten lokalen Erstposen. Stand **96 eigene Skulpturen / 324 glatte Rekonstruktionen**. Zuvor Dex #85–90 als PR #53 vollständig veröffentlicht. Vorherige 90 Geometrien, Quellen/Hashes, PBR/UV/Cache, Toolkit, Renderer und sämtliche Mechaniken/Saves bleiben erhalten.
- **Dateien/Merkmale:** monster-sculpts-k.ts registriert monster-sculpts-k-props.ts und monster-sculpts-k-creatures.ts. Konkaver Ascher/Stummel, offene Y-Rohre, zehn Handschuhfinger, offener Pappkern/Bandlasche, verwittertes Schild und Scheinwerfer/Dreifuß. Nach Bildvergleich Ypipe-Zweige und Taperoll vorwärts geneigt; finaler Liveblick bestätigt den sichtbaren Taperoll-Kern. Ypipe: rechte Öffnung im Startwinkel flach sichtbar, Teile der Augen durch die geneigten Rohre verdeckt; optischer Restpunkt dokumentiert, keine vierte Prüfrunde. Alle unter 30k Dreiecken.
- **Drei Prüfblöcke abgeschlossen:** 1: 188/188 Tests + Testkanal-Build. 2: ein Chromium-Touch-Smoke aller sechs neben Originalpose, Drehen/Zoom/Schließen/Reload/HP0/XP17 und schmales Layout ohne Browser-/Shaderfehler; sechs Bilder geprüft. 3: finale PR CI 39218634304 und Main CI 39253739794 grün (188 + Build), Pages 39253739612 grün; Live-Dateinamen/Inhalt/Hashes bestätigt. Gezielter finaler Liveblick Ypipe/Taperoll samt Drehen/Zoom/Schließen/Reload/HP0/XP ohne Browser-/Shaderfehler grün. Keine weitere Vollschleife; physisches Android/native 4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-dJgNAn4W.js, SHA256 53ee7409945212a459e4c2e3b62bd41b6c44f44c222165f40329b4b803ed1ba4; CSS index-tKfj-jno.css. Root unverändert index-DWZ4yP_E.js. Nicht als bytegleich zum ersten lokalen Build behaupten: finale Neigungen wurden in CI gebaut.
- **NEUE Nutzerpriorität (2026-10-19), je Paket ein PR:** 1. frei kombinierbare Kleidungsslots Oberteil/Jacke/Hose/Schuhe/Kopf/Accessoires, inklusive Latzhose + Lederjacke, sauberer Tausch/Passform/Persistenz und Tests aller Kombinationen; 2. GUI/HUD/Menüs für Desktop/Touch aufräumen; 3. Performance mit FPS vorher/nachher, Instancing/LOD/Culling/Texturen/Shader/Schattenbudget; 4. Bezirke einzeln nach Vorlage detaillieren, ein PR pro Bezirk, 2D-Grundstruktur erhalten, eigene Dachmaterialien/Kanten/Rinnen sowie Fassaden/Fenster/Türen/Schilder/Neon/Müll/Kabel/Pfützen/Props/Vegetation/PBR/Licht/Nebel/Post. Spieler und NPCs bei Bezirkspaketen nicht verändern. Kleidung nutzt bestehende Rigs.
- **Monster zurückgestellt:** individuelle Originalarten ab Dex #97 erst nach den neuen Prioritäten; vorhandene 96 behalten. Nächstes Paket ist Kleidung. Gleiche drei Prüfblöcke, keine Rückfragen, Annahmen einzeilig dokumentieren. Ko-fi/Zahlungsserver bleiben übersprungen.
- Annahme v47: Sechs Arten bilden ein fertiges Paket; verdeckte Rückseiten führen sichtbare Formen/Farben konservativ fort. Dieses Paket Ashpan bis Spotlamp; Fortsetzung der Monster ab #97 ist jetzt zurückgestellt.
- Nachweise /workspace/scratch/420mon-audit/v47-originals.png, v47-mon_*.png, v47-live-mon_*.png, v47-tests/build/smoke/CI/Pages-Protokolle, v47-live-proof.json und v47-deploy-proof.json. Abschließender Dokumentationscommit ändert nur Status; Spielcode bleibt 1e46dcd.

## Historischer Verlauf — ältere Next-Angaben überholt

# Aktueller Wiedereinstieg — v46 / Dex 85–90 veröffentlicht

- **Fertig, gemergt, live:** PR #53, Spielcode 0829c7690eb74a597ace5c61d232e0a627ae92a8. Bubstack, Hangscale, Curbcone, Neonarrow, Clipin und Heatsink nach echten lokalen Erstposen. Stand **90 eigene Skulpturen / 330 glatte Rekonstruktionen**. Vorherige 84 Geometrien, Quellen/Hashes, PBR/UV/Cache, Toolkit, Renderer und sämtliche Mechaniken/Saves bleiben erhalten.
- **Dateien/Merkmale:** monster-sculpts-j.ts registriert monster-sculpts-j-props.ts und monster-sculpts-j-creatures.ts. Vier tropfende Blasenschichten, offene Waage/Haken/Ketten, Kegel mit Wickelband, Neonröhren-Pfeil, Holzklammer/Feder/Blatt, Kühlkörper/Lamellen/Entladungen. Alle unter 30k Dreiecken; keine Geometrieänderung nach Browser-Smoke.
- **Drei Prüfblöcke abgeschlossen:** 1: Build grün, 186/188 Tests; beide Fehler betrafen Bubstacks 30k-Budget. Kleine Blasen/Tropfen reduziert. 2: Budget aller sechs und korrigierter Build grün (Bubstack 27408, Hangscale 29528); ein Chromium-Touch-Smoke aller sechs neben Originalpose, Drehen/Zoom/Schließen/Reload/HP0/XP17 und schmales Layout ohne Browser-/Shaderfehler; sechs Bilder geprüft. 3: finale PR CI 39217287883 und Main CI 39217407067 grün (188 + Build), Pages 39217407079 grün. Live-JS/CSS bytegleich zum korrigierten Smoke-Build, Namen im Pages-Protokoll bestätigt. Keine weitere Vollschleife; physisches Android/native 4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-DKWyXFaG.js, SHA256 429be189d6260988d5795925ff71671f1d63511752336ccc9a2bce28129b48fe; CSS index-tKfj-jno.css. Root unverändert index-DWZ4yP_E.js. Keine Behauptung, übrige 330 Rekonstruktionen seien individuelle HD-Anatomien.
- **Nächstes Paket:** individuelle Originalarten **ab Dex #91**, vorhandene 90 behalten. Neueste Nutzeranweisung: nach Abschluss von #85–90 direkt nächstes offenes Paket liefern, eigener PR/max. drei fokussierte Prüfblöcke, keine Rückfragen. Mechaniken/Saves bleiben; Ko-fi/Zahlungsserver übersprungen.
- Annahme v46: Sechs Arten bilden ein fertiges Paket; verdeckte Rückseiten führen sichtbare Formen/Farben konservativ fort. Echte Erstposen bestimmen das Design. Dieses Paket Bubstack bis Heatsink, danach weiter ab Dex #91.
- Nachweise /workspace/scratch/420mon-audit/v46-originals.png, v46-mon_*.png, v46-tests/build/budget/smoke/CI/Pages-Protokolle und v46-deploy-proof.json. Abschließender Dokumentationscommit ändert nur Status; veröffentlichter Spielcode bleibt 0829c76.

## Historischer Verlauf — ältere Next-Angaben überholt

# Aktueller Wiedereinstieg — v45 / Dex 79–84 veröffentlicht

- **Fertig, gemergt, live:** PR #52, Spielcode a26c28c0dd0da3d90262914917be1b83f69b4f2e. Fatcandle, Fizzcap, Stoolpad, Keywisp, Boothdrape und Anvilant nach echten lokalen Erstposen. Stand **84 eigene Skulpturen / 336 glatte Rekonstruktionen**. Vorherige 78 Geometrien, Quellen/Hashes, PBR/UV/Cache, Toolkit, Renderer und sämtliche Mechaniken/Saves bleiben erhalten.
- **Dateien/Merkmale:** monster-sculpts-i.ts registriert monster-sculpts-i-props.ts und monster-sculpts-i-creatures.ts. Wachs/Drips/Flamme, sprudelnde Kappe, gepolsterter Hocker, vertiefter Schlüsselgeist, Vorhangfalten/Goldschnüre und sechsbeinige Ambossameise. Alle unter 30k Dreiecken. Keine Geometrieänderungen nach lokalem Bildvergleich.
- **Drei Prüfblöcke abgeschlossen:** 1: 188/188 Tests + Testkanal-Build. 2: ein Chromium-Touch-Smoke aller sechs neben Originalpose, Drehen/Zoom/Schließen/Reload/HP0/XP17 und schmales Layout ohne Browser-/Shaderfehler; sechs Screenshots geprüft. 3: PR CI 39190885592, Main CI 39190979906 und Pages 39190979866 grün. Live-JS/CSS bytegleich zum lokal im Smoke geprüften Build und Dateinamen im Pages-Protokoll bestätigt. Keine weitere Vollschleife; physisches Android/native 4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-DLI_qK9P.js, SHA256 1e08da89be982c1cb8e362eb5828261e216b1d133e92aef646a772d92d768390; CSS index-tKfj-jno.css. Root unverändert index-DWZ4yP_E.js. Keine Behauptung, die übrigen 336 Rekonstruktionen seien individuelle HD-Anatomien.
- **Nächstes Paket:** individuelle Originalarten **ab Dex #85**, vorhandene 84 behalten. Ein PR/max. drei fokussierte Prüfblöcke, keine Rückfragen. Mechaniken/Saves bleiben; Ko-fi/Zahlungsserver übersprungen.
- Annahme v45: Sechs Arten bilden ein fertiges Paket; verdeckte Rückseiten führen die sichtbaren Formen/Farben konservativ fort. Echte Erstposen bestimmen das Design. Dieses Paket Fatcandle bis Anvilant, danach weiter ab Dex #85.
- Nachweise /workspace/scratch/420mon-audit/v45-originals.png, v45-mon_*.png, v45-tests/build/smoke/CI/Pages-Protokolle und v45-deploy-proof.json. Abschließender Dokumentationscommit ändert nur Status; veröffentlichter Spielcode bleibt a26c28c.

## Historischer Verlauf — ältere Next-Angaben überholt

# Aktueller Wiedereinstieg — v44 / Dex 73–78 veröffentlicht

- **Fertig, gemergt, live:** PR #51, Spielcode 9cbb0cfbf1ee0e058b7f4c29b03f1f0fbdc5ac0e. Pricecrow, Grafface, Pitmaw, Pothead, Rackfan und Matchimp aus den echten lokalen Erstposen. Stand **78 eigene Skulpturen / 342 glatte Rekonstruktionen**. Die vorherigen 72 Geometrien, Originalsprites/Hashes, PBR/UV/Cache, Toolkit, Renderer, Mechaniken und Saves bleiben erhalten. Zuvor wurde Dex #67–72 vollständig als PR #50 veröffentlicht.
- **Dateien/Merkmale:** monster-sculpts-h.ts und monster-sculpts-h-objects.ts: Gefieder/Preisschild, rissiger Graffiti-Stein, vertieftes Brunnenmaul/Zähne, offener Pflanztopf/Erde/Sprössling, Lüftergehäuse/Rotor/Gitter und Streichholzfigur/Flammenkopf. Nach Bildvergleich vor CI Pitmaws Augen innerhalb der Mulde versetzt, sodass der vordere Steinrand beide frei lässt; finaler Liveblick bestätigt die sichtbaren Augen.
- **Drei Prüfblöcke abgeschlossen:** 1: 188/188 + Build. 2: ein Chromium-Touch-Smoke aller sechs neben Originalpose, Drehen/Zoom/Schließen/Reload/HP0/XP17 und schmales Layout ohne Browser-/Shaderfehler; sechs Screenshots angesehen. 3: finale PR CI 39165042607 und Main CI 39165152120 grün (188 + Build), Pages 39165152009 grün. Live-Dateinamen/Inhalt/Hashes bestätigt; gezielter finaler Pitmaw-Liveblick samt Drehen/Zoom/Schließen/Reload/HP0/XP ohne Browser-/Shaderfehler grün. Ergebnisse über Umgebungspause erhalten; keine Prüfungen wiederholt. Physisches Android/native 4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-CnlEILwF.js, SHA256 bf6d2dd88f7eae045455e722f727381bf69ed2a910c0df7ae4589035e5e5003e; CSS index-tKfj-jno.css. Root unverändert index-DWZ4yP_E.js. Nicht als bytegleich zum ersten lokalen Build behaupten: finale Augenpositionen wurden in CI gebaut.
- **Nächstes Paket:** individuelle Originalarten **ab Dex #79**, vorhandene 78 behalten. Neueste Nutzeranweisung (2026-10-19): nächsten offenen Punkt mit gleichen Regeln fortsetzen. Echte Erstposen lesen, je Paket ein PR/max. drei fokussierte Prüfblöcke, keine Rückfragen. Mechaniken/Saves bleiben; Ko-fi/Zahlungsserver übersprungen.
- Annahme v44: Sechs Arten bilden ein fertiges Paket; verdeckte Rückseiten führen sichtbare Formen/Farben konservativ fort. Dieses Paket: Pricecrow bis Matchimp; nächster Einstieg Dex #79.
- Nachweise /workspace/scratch/420mon-audit/v44-originals.png, v44-mon_*.png, v44-live-mon_pitmaw.png und v44-tests/build/smoke/live/deploy/CI-Protokolle. Abschließender Dokumentationscommit ändert nur Status; veröffentlichter Spielcode bleibt 9cbb0cf.

## Historischer Verlauf — ältere Next-Angaben überholt

# Aktueller Wiedereinstieg — v43 / Dex 67–72 veröffentlicht

- **Fertig, gemergt, live:** PR #50, Spielcode dbc608c90f9b6b6d92f0e5ebde94990320148162. Spilleye, Gongling, Maskwisp, Lipkrait, Magtick und Valvekoi nach echten lokalen Erstposen. Stand **72 eigene Skulpturen / 348 glatte Rekonstruktionen**. Die bisherigen 66 Geometrien, Originalsprites/Hashes, PBR/UV/Cache, Mechaniken und Saves bleiben erhalten.
- **Dateien/Merkmale:** monster-sculpts-g.ts und monster-sculpts-g-creatures.ts: Schleimauge/Tropfen, Metallgong/Klöppel, gebrochene Maske/Rauch, eingerollte Schlange/Zunge, offenes Hufeisen-Magnetinsekt/Greifer, Koi/Flossen/Ventilrad. Zwei zusätzliche Sculpt-Helfer erzeugen glatte geschlossene Kurven und gedrehte Profile; alte Methoden bleiben unverändert. Valvekoi-Rad vor erster Prüfung geneigt und mit durchgehendem Ventilschaft verbunden.
- **Drei Prüfblöcke abgeschlossen:** 1: 188/188 + Build. 2: ein Chromium-Touch-Smoke aller sechs neben Originalpose, Drehen/Zoom/Schließen/Reload/HP0/XP17 und schmales Layout ohne Browser-/Shaderfehler; alle Screenshots angesehen. 3: PR CI 39164319743 und Main CI 39164396855 grün, Pages 39164396884 grün. Live-JS/CSS bytegleich zum lokal im Smoke geprüften Build; Dateinamen auch im Pages-Protokoll bestätigt. Keine weitere Vollschleife; physisches Android/native 4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-C4Xwl2Ib.js, SHA256 ee64b949d34de301d374baaafb19d1ef67675eb0d830c9e72213e18305358a45; CSS index-tKfj-jno.css. Root unverändert index-DWZ4yP_E.js. Keine Behauptung, alle 420 seien individuelle HD-Modelle/native 4K geprüft.
- **Nächstes Paket:** individuelle Originalarten **ab Dex #73**; bestehende 72 behalten. Neueste Nutzeranweisung: nach Abschluss von Dex #67–72 direkt dieses nächste Paket liefern, eigener PR/max. drei Prüfblöcke. Originalerstposen lesen; alle Mechaniken/Saves behalten; Ko-fi/Zahlungsserver übersprungen.
- Annahme v43: Sechs Arten bilden ein Paket; verdeckte Rückseiten führen die sichtbaren Formen/Farben konservativ fort. Dieses Paket: Spilleye bis Valvekoi; nächster Einstieg Dex #73.
- Nachweise /workspace/scratch/420mon-audit/v43-originals.png, v43-mon_*.png, v43-tests.log/build.log/smoke-results.json/deploy-proof.json und CI-Protokolle. Abschließender Dokumentationscommit ändert nur Status; veröffentlichter Spielcode bleibt dbc608c.

## Historischer Verlauf — ältere Next-Angaben überholt

# Aktueller Wiedereinstieg — v42 / Dex 61–66 veröffentlicht

- **Fertig, gemergt, live:** PR #49, Spielcode b3eff54157f6683a007147a5ad98cd98e230147c. Sechs eigene Modelle nach echten lokalen Erstposen: Harzback, Lampjell, Curbowl, Tarslug, Plugeel und Lidtoad. Stand **66 eigene Skulpturen / 354 glatte Rekonstruktionen**. Die bisherigen 60 Geometrien, Originalsprites/Hashes, PBR/UV/Cache sowie sämtliche Mechaniken/Saves bleiben erhalten. Keine Behauptung, alle 420 seien individuelle HD-Modelle oder native 4K geprüft.
- **Dateien/Merkmale:** monster-sculpts-f.ts und monster-sculpts-f-aquatic.ts ergänzen Harzpanzer/Blattkrone/Wurzeln, geschlossene Quallenglocke/Tentakel, Eulengefieder/Stirnrillen, Teerkuppel/Glutrisse/Augenstiele, segmentierten Steckeraal/Blitzunterseite und Kröte/Kanaldeckel. Ein neuer geschlossener Halbkugel-Baustein dient nur der Quallenglocke. Nach Bildvergleich vor CI Goldtöne vertieft, Tentakel dünner/rund verbunden, Stirnrillen an die Kopfwölbung gelegt und Deckel geneigt/abgesenkt. Die bisherigen Sculpt-Methoden und Renderer bleiben unverändert.
- **Drei Prüfblöcke abgeschlossen:** 1: 188/188 + Build. 2: ein Chromium-Touch-Smoke aller sechs neben echter Erstpose, Drehen/Zoom/Schließen/Reload/HP0/XP17 und schmales Layout ohne Browser-/Shaderfehler. Bestehende echte Quellen-/Geometrie-/Normal-/UV-/Budget-/Cachetests erfassen alle 66/354; keine Definitionsspiegeltests ergänzt. 3: finale PR CI 39145731155 und Main CI 39145817743 grün (188 + Build), Pages 39145817734 grün; Live-Dateinamen/Inhalt/Hashes bestätigt. Gezielte finale Live-Ansichten Harzback/Lampjell/Curbowl/Lidtoad samt Drehen/Zoom/Schließen/Reload/HP0/XP ohne Browser-/Shaderfehler grün. Keine weitere Vollschleife; physisches Android/native 4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-D8iUjs8C.js, SHA256 e8f1a31aada1fd18adf8a9b86dfe4fc1474a015f0ee2b9ffd4fb88a6b3e38e39; CSS index-tKfj-jno.css. Root unverändert index-DWZ4yP_E.js. Nicht als bytegleich zum ersten lokalen Build behaupten: finale Grafik-Korrekturen wurden in CI gebaut.
- **Nächstes Paket:** individuelle Originalarten **ab Dex #67**. Bestehende 66 Skulpturen nicht neu bauen. Echte lokale Erstposen lesen, Anatomie/Gesichter/Accessoires nach Vorlage ausarbeiten und PBR/UV/Cache behalten. Ein PR/max. drei fokussierte Prüfblöcke; keine Rückfragen. Alle Bezirke/Mechaniken/Saves behalten, Ko-fi/Zahlungsserver übersprungen.
- Annahme v42: Sechs Arten bilden ein fertiges Paket; verdeckte Rückseiten werden konservativ ergänzt, die echten Erstposen bestimmen Formen/Farben. Dieses Paket umfasst Harzback bis Lidtoad, nächster Einstieg Dex #67.
- Bildnachweise /workspace/scratch/420mon-audit/v42-mon_*.png, Kontaktbogen v42-originals.png, finale v42-live-mon_*.png; Tests-/Build-/Smoke-/CI-/Deploy-Protokolle und JSON-Nachweise im selben Ordner. Abschließender Dokumentationscommit ist nur Status; veröffentlichter Spielcode bleibt b3eff54.

## Historischer Verlauf — ältere Next-Angaben überholt

# Aktueller Wiedereinstieg — v41 / Dex 55–60 veröffentlicht

- **Fertig, gemergt, live:** PR #48, Spielcode 21ad071fbb83e525cafcf8f7cf35ca74ba037dc5. Sechs eigene Modelle nach echten lokalen Erstposen: Portwolf, Fogbank, Dockclaw, Flaskwyrm, Velourfox, Rustmaw. Stand **60 eigene Skulpturen / 360 glatte Rekonstruktionen**. Vorherige 54 Geometrien, Originalsprites/Hashes, PBR/UV/Cache und sämtliche Mechaniken/Saves bleiben erhalten. Keine Behauptung, alle 420 seien individuelle HD-Modelle oder native 4K geprüft.
- **Dateien/Merkmale:** monster-sculpts-e.ts ergänzt heulenden Kabelwolf/Mähne, Nebelbank/gelbe Augen/Schwaden, Frachtpanzer-Krabbe/rote Lichter/offene Scheren, limettengrüne Segmentraupe/Tropfenhelm, sitzenden violetten Fuchs/Goldreifen/Schwanz und rostigen Platten-Vierbeiner/getrennte Zahnkiefer. monster-authored.ts bevorzugt sie mit Originalhash. Verdeckte Rückseiten konservativ ergänzt. Nach Bildvergleich vor CI Rustmaws Innenkugel durch zurückgesetzte Maulrückwand ersetzt und Fogbanks Puffs leicht versetzt; keine Änderungen am bisherigen Renderer/ACES/PBR.
- **Drei Prüfblöcke abgeschlossen:** 1: 188/188 + Build. Bestehende reale Geometrie-/Quellen-/Normal-/UV-/Budget-/Cachetests erfassen alle 60/360. 2: ein Chromium-Touch-Smoke aller sechs neben echter Erstpose, Drehen/Zoom/Schließen/Reload/HP0/XP17 und schmales Layout ohne Browser-/Shaderfehler. 3: PR CI 39140950620, Main CI 39141065969 grün (188 + Build), Pages 39141065725 grün; Live-Dateinamen/Inhalt/Hash bestätigt. Gezielte finale Live-Ansichten Rustmaw/Fogbank mit Drehen/Zoom/Schließen/Reload/HP0/XP grün. Keine weitere Vollschleife; physisches Android/native 4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-VN5AuQnw.js SHA256 fb72bd5ea8c863fb2d8641eea9a55a18180d3967f9f0769e646d22bc9ba59270; CSS index-tKfj-jno.css. Root unverändert index-DWZ4yP_E.js. Nicht als bytegleich zum ersten lokalen Build behaupten: finale Maul-/Puffkorrektur wurde in CI gebaut.
- **Nächstes Paket:** individuelle Originalarten **ab Dex #61**. Bestehende 60 Skulpturen nicht neu bauen. Echte lokale Erstposen lesen, Anatomie/Gesichter/Accessoires nach Vorlage ausarbeiten und PBR/UV/Cache behalten. Sechs Arten pro Paket ist die bisherige Annahme, ein PR/max. drei fokussierte Prüfblöcke; keine Rückfragen. Alle Bezirke/Mechaniken/Saves behalten, Ko-fi/Zahlungsserver übersprungen.
- Bildnachweise /workspace/scratch/420mon-audit/v41-mon_*.png, Kontaktbogen v41-originals.png, finale v41-live-mon_rustmaw.png/v41-live-mon_fogbank.png. Abschließender Dokumentationscommit ist nur Status; veröffentlichter Spielcode bleibt 21ad071.

## Historischer Verlauf — ältere Next-Angaben überholt

# v41 — individuelle Originalmodelle Dex 55–60

Annahme v41: Das nächste fertige Artenpaket umfasst sechs Arten, Portwolf bis Rustmaw; verdeckte Rückseiten werden konservativ ergänzt. Die echten Erstposen bestimmen Formen, Farben und Merkmale; bestehende 54 Skulpturen, PBR und Mechaniken bleiben erhalten. Weiter ab Dex #61.

- v41 Runden 1/2: 188/188 Tests + Build und ein Touch-Smoke aller sechs als sculpted neben Erstpose, Drehen/Zoom/Schließen/Reload/HP0/XP17 ohne Browser-/Shaderfehler grün. Bildvergleich: Rustmaws Innenraum vor CI als zurückgesetzte Maulrückwand statt glänzender Kugel korrigiert; Fogbank-Wolken leicht versetzt. Endstand folgt in Runde 3 CI/Deploy, keine weitere lokale Vollschleife. Stand 60/360, weiter Dex #61.

# Aktueller Wiedereinstieg — v40 / Dex 49–54 veröffentlicht

- **Fertig, gemergt, live:** PR #47, Spielcode 9ffca8db35b4b0244079fee49ce5224ce1427cb2. Sechs eigene Modelle aus den echten lokalen Erstposen: Hawkerfox, Kiefhound, Puffwraith, Blazetail, Rootroach, Crackveil. Source-Hashes, vollständige Sprites, bisherigen 48 Skulpturen, PBR/UV/Cache und alle Mechaniken/Saves bleiben erhalten. Stand **54 eigene Skulpturen / 366 glatte Rekonstruktionen**; keine Behauptung, alle 420 seien individuell oder in 4K geprüft.
- **Dateien:** monster-sculpts-d.ts enthält die sechs individuellen Formen; monster-authored.ts bevorzugt sie und führt deren Original-Hashes. Fuchsgesicht/Mantel/Kragen, Moos-Vierbeiner/rote Augen, Wolkenschädel/Raucharme, geschuppte Echse/Flammenschwanz, gerippter Sechsbein-Panzer/Ports, gespaltenes Leuchtherz/Schleier/Blitze sind echte Geometrie, unter 30k Dreiecken. Verdeckte Rückseiten konservativ ergänzt. Studio bekam vor Merge ACES-Tonemapping gegen ausgebrannte helle PBR-Flächen.
- **Drei Prüfblöcke abgeschlossen:** 1: 188/188 Tests + Build. 2: ein Chromium-Touch-Smoke für alle sechs als sculpted neben echter Erstpose, Drehen/Zoom/Schließen/Reload, HP0/XP17, schmales Layout ohne Browser-/Shaderfehler. Bestehende echte Geometrie-/Normal-/UV-/Budget-/Quellen-/Cachetests erfassen alle 54/366; keine reinen Definitionsspiegeltests ergänzt. 3: finale PR CI 39136428487, Main CI 39136524912 grün (188 + Build), Pages 39136524933 grün, Live-Dateinamen/Inhalt/Hash bestätigt. Gezielter Live-Puffwraith-Check nach Tonemapping grün. Keine weitere Vollschleife; Android/native 4K bleibt Gerätetest.
- **Live:** https://benjg420.github.io/420mon-3D/test/ ; JS index-BD6a5M5q.js SHA256 fe210d67957f7424d24b6bc89521db255e3402ebc4e4860fa38d16952f4e6f4d; CSS index-tKfj-jno.css. Root unverändert index-DWZ4yP_E.js. Nicht als bytegleich zum ersten lokalen Build behaupten: finale Tonemapping-Zeilen wurden in CI gebaut.
- **Nächstes Paket:** individuelle Originalarten **ab Dex #55**, davor 54 Skulpturen nicht neu bauen. Echte Erstposen lesen, Anatomie/Gesichter/Accessoires nach Vorlage erstellen und PBR/UV/Cache behalten. v40-Annahme: sechs Arten bilden ein fertiges Paket; keine Pflicht, wieder 24 auf einmal zu machen. Ein PR, max. drei Prüfblöcke, keine Rückfragen. Alle Bezirke/Mechaniken/Speicherstände und übersprungene Ko-fi/Zahlungsserver behalten.
- Bildnachweise /workspace/scratch/420mon-audit/v40-mon_*.png, Originalkontaktbogen v40-originals.png und v40-live-mon_puffwraith.png. Abschließender Dokumentationscommit ändert nur Status; veröffentlichter Spielcode bleibt 9ffca8d.

## Historischer Verlauf — ältere Next-Angaben überholt

> v40 vor Merge: Studio-Renderer nutzt ACES-Tonemapping gegen überstrahlte helle PBR-Flächen. Finale CI/Pages und ein gezieltes Livebild prüfen dies im dritten Block; keine weitere lokale Vollsuite. Vorherige 48 Geometrien bleiben unverändert.

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
