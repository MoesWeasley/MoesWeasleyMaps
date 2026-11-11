# MoesWeasley Maps (MoesWeasley™)

Navigatie-app voor Android met Nederlandse gesproken aanwijzingen, flitsmelder en verkeersinfo.
Helemaal gratis: geen API-sleutels nodig.

| Onderdeel | Bron |
|---|---|
| Kaart | OpenFreeMap (OpenStreetMap) |
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

## Live verkeer met TomTom en HERE (optioneel)

Beide zijn gratis zonder creditcard. Maak een sleutel aan en plak hem in de app bij Instellingen > Live verkeer
(of zet hem in `config.js` bij `tomtomKey` / `hereKey`).

- TomTom: developer.tomtom.com > account > API key. Gratis: 2.500 verzoeken + 50.000 kaarttegels per dag.
- HERE: platform.here.com > Access Manager > API key. Gratis plan: 1.000 verzoeken per dag.

De app vraagt meldingen op bij het kiezen van een route en daarna elke 5 minuten tijdens het rijden.
Let op: een sleutel in de app is uit de APK te halen. Gebruik daarom een gratis account zonder betaalgegevens.

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
