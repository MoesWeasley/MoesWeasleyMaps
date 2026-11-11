# MoesWeasley Maps (MoesWeasley™)

Navigatie-app voor Android met Nederlandse gesproken aanwijzingen, flitsmelder en verkeersinfo.
Helemaal gratis: geen API-sleutels nodig.

| Onderdeel | Bron |
|---|---|
| Kaart | Mapbox Standard in 3D (met gratis sleutel), anders OpenFreeMap (OpenStreetMap) |
| Routes en afslagen | OSRM (routing.openstreetmap.de, reserve: project-osrm.org) |
| Adres zoeken | Photon (reserve: Nominatim) |
| Flitsers | OpenStreetMap, elke nacht via GitHub (`flitsers.py`) + eigen meldingen |
| Files, ongevallen, afsluitingen | NDW open data, elk uur via GitHub (`ndw.py`) |
| Live files, ongevallen, drukte op de kaart | TomTom Traffic API en HERE Traffic API (optioneel, gratis sleutel) |
| Gedeelde flitsermeldingen | Firebase (optioneel, zelfde project als sprintje) |

## Wat de app doet

- Zoeken op adres of plaats, of lang drukken op de kaart om een punt te kiezen.
- Tot 4 routes met reistijd en aankomsttijd. Met "Drukte vermijden" kiest de app de route met de minste files, ongevallen en afsluitingen.
- Navigeren met grote afslagpijl, "daarna"-hint, Nederlandse stem en automatisch herberekenen als je van de route raakt.
- "Let op flitser" met afstand en maximumsnelheid; de snelheid kleurt rood als je te hard rijdt.
- Waarschuwing voor ongevallen, files en afsluitingen op je route.
- Flitser melden (mobiel, controle, flitspaal); blijft 3 uur staan.
- Rit simuleren (Instellingen) om thuis te testen.

## APK laten bouwen door GitHub

De build "APK bouwen" start vanzelf bij elke push. Na 5 tot 10 minuten staat onder **Actions** een groen vinkje;
download onderaan **moesweasley-maps-apk** en installeer de APK op je telefoon.

Rood kruis? Open de stap met het kruis en stuur de foutmelding naar Claude.

## Let op: verse verkeersdata en een privé-repo

De app haalt flitsers en verkeer op via `raw.githubusercontent.com`. Dat werkt alleen als deze repo **Public** is.
Is de repo Private, dan gebruikt de app de bestanden die bij het bouwen in de APK zijn gestopt
(flitsers prima, verkeer zo oud als de APK).

## Zelf bouwen met Android Studio

Nodig: Node.js 22 en Android Studio.

```
npm install --legacy-peer-deps
npm run setup:android
npm run icons
npm run sync
npm run open
```

## 3D-kaart met Mapbox (optioneel, aanrader)

Maak een gratis account op account.mapbox.com en kopieer je standaardsleutel (begint met `pk.`).
Plak hem in de app bij Instellingen > 3D-kaart (of in `config.js` bij `mapboxToken`).
Je krijgt dan Mapbox Standard: 3D-bomen, belichte gebouwen, monumenten en licht dat meegaat met de tijd van de dag.
Gratis tot 50.000 kaartladingen per maand. Zonder sleutel gebruikt de app de gratis open kaart.

## Live verkeer met TomTom en HERE (optioneel)

Beide zijn gratis zonder creditcard. Maak een sleutel aan en plak hem in de app bij Instellingen > Live verkeer
(of zet hem in `config.js` bij `tomtomKey` / `hereKey`).

- TomTom: developer.tomtom.com > account > API key. Gratis: 2.500 verzoeken + 50.000 kaarttegels per dag.
- HERE: platform.here.com > Access Manager > API key. Gratis plan: 1.000 verzoeken per dag.

De app vraagt meldingen op bij het kiezen van een route en daarna elke 5 minuten tijdens het rijden.
Let op: een sleutel in de app is uit de APK te halen. Gebruik daarom een gratis account zonder betaalgegevens.

## Hulpdienstdetector (MoesDetector, optioneel)

Een klein bordje dat waarschuwt als er hulpdiensten in de buurt zijn, zoals de Target Blu Eye. Het meet alleen hoe sterk
er op de C2000-frequenties van de voertuigen (380–386,5 MHz) wordt uitgezonden. Er wordt niets ontvangen, opgeslagen of ontcijferd.

**Nodig:** Heltec WiFi LoRa 32 V3 in de **433 MHz-versie** (bijv. Tinytronics), USB-C-kabel en autolader.
Voor meer bereik: een TETRA-antenne voor 380–400 MHz met SMA-male aansluiting.

**Installeren:** open `https://moesweasley.github.io/MoesWeasleyMaps/flash/` op een computer in Chrome of Edge,
sluit het bordje aan en klik op "Installeren op het bordje". Het programma staat in `detector/` (PlatformIO) en wordt
door GitHub automatisch gebouwd (ook te downloaden als `moesdetector-firmware` onder Actions).

**Koppelen:** in de app bij Instellingen > Hulpdienstdetector > Koppelen. Met "Testen" zie je hoe een melding eruitziet.
Gevoeligheid stel je in de app in of met de PRG-knop op het bordje.

Let op: dit is een experiment. De juiste gevoeligheid moet met testritten worden gevonden, en het telt alle
C2000-gebruikers in de buurt, niet alleen voertuigen met zwaailicht.

## Gedeelde flitsermeldingen (optioneel)

Vul in `config.js` bij `firebase` dezelfde gegevens in als bij sprintje. Dan zien beide apps elkaars meldingen
(collectie `reports`, dezelfde beveiligingsregels).

## Bij de eerste start

- Locatie: kies "Nauwkeurig" en "Tijdens gebruik van de app".
- Stem: Instellingen > Stem testen. Hoor je niets, installeer dan de Nederlandse stem via
  Android-instellingen > Systeem > Talen > Tekst-naar-spraak.

De gratis routeplanners zijn bedoeld voor licht gebruik; voor één persoon is dat prima.
Deze versie is nog niet op een echt toestel getest.

MoesWeasley™


## Snelheidslimiet

De limiet staat altijd in beeld, ook zonder route en zonder sleutel. Hij komt van de weg waar je rijdt in OpenStreetMap (gratis, via Overpass). Rond je positie worden de wegen in één keer opgehaald (ongeveer elke 450 m opnieuw), daarna wordt lokaal de weg onder je gezocht, in je rijrichting. Tijdsgebonden limieten zoals 100 overdag / 130 's avonds worden meegenomen. Met een Mapbox-route gaat de limiet van de route voor; bij een flitser de limiet van de flitser.

## Verkeerslichten

Stoplichten komen uit OpenStreetMap (gratis, via Overpass) en verschijnen als je inzoomt (zoom 14+). Ze worden per vak van ongeveer 2 km opgehaald en lampen op hetzelfde kruispunt worden samengevoegd. Aan/uit in Instellingen.
