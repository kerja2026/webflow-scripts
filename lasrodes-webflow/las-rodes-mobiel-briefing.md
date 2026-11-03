# Las Rodes — briefing mobiel en tablet

Projectsamenvatting voor een nieuwe chat, volledig gericht op het ontwerp (en daarna de bouw) van de mobiele en tablet-versie van de Las Rodes tribute-site. De desktopversie is af en live op staging.

## Doel van deze chat

1. Mobiele (390) en tablet (834) versies ontwerpen in Figma, sectie voor sectie, op basis van het bestaande desktopontwerp.
2. Per sectie vastleggen hoe de animaties zich gedragen op touch en kleine schermen.
3. Daarna bouwen: styles in Webflow per breakpoint, gedrag in de scripts op GitHub.

Eerst ontwerpen, dan bouwen. Niet bouwen op aannames.

## Project

- Zelfgeïnitieerd Kerja-project: tribute-onepager voor Las Rodes, Spaans zangduo (de zussen Amara en Coral). Geen klant.
- Figma: https://www.figma.com/design/LDOxT1ncLjQac6jXHGTBfd/Las-Rodes (fileKey `LDOxT1ncLjQac6jXHGTBfd`). Desktopframe 1512 breed. Mobiele en tablet-frames bestaan nog niet.
- Webflow-site: `las-rodes`, site ID `6ae4913cbd8a2e883953ad49`, homepagina ID `6ae4913ebd8a2e883953ad50`.
- Staging: https://las-rodes.webflow.io/
- Code: GitHub-repo `webflow-scripts`, map `lasrodes-webflow/`, geladen via jsDelivr met tag `lasrodes-v1.0.0`.

## Werkafspraken

- Client-First naamgeving strikt: `section_[naam] > padding-global > container > padding-section > [naam]_component`. Custom classes met underscore-folders.
- Alle maten in rem (px / 16). Geen px, vw of vh voor maatvoering, behalve volledige schermhoogte of -breedte.
- Figma is de bron van waarheid. Teksten letterlijk overnemen.
- Ontwerpkeuzes die afwijken: noteren met reden.

## Schaling: Osmo Scaling System

- Root-variant in `styles.css`: `--size-container-ideal: 1512`, min 320px, max 1920px. De root font-size schaalt mee met de vensterbreedte.
- Nu schaalt de desktop gewoon mee naar beneden. Op 390 breed wordt alles 26% van de desktopmaat: onleesbaar.
- **Te beslissen**: per breakpoint een eigen ontwerpbreedte in Osmo (bijvoorbeeld tablet 834, mobiel 390), zodat rem-waarden uit de mobiele Figma-frames direct kloppen. Dat is de aanbevolen route.
- Webflow-breakpoints: tablet ≤991, mobiel liggend ≤767, mobiel staand ≤478. Boven 1920 lopen kleurvlakken en banden door tot de vensterrand.

## Ontwerpsysteem

Kleuren (Webflow-variabelen, collectie `collection-3003d2be-be1b-06cf-aaac-24c92f14127f`):
- `color/cream` #F2ECE1 (achtergrond)
- `color/dark` #2C252B (tekst, afsluiter, footer)
- `color/red` #A70E10 (Las Voces, preloader, menu)
- `color/purple` #390506 (Su Propia Voz; de naam is historisch, de kleur is donker bordeaux)

Typografie:
- **Norman**: koppen, display. Gewicht 320 waar Figma niets aangeeft.
- **Alan Sans Light (300)**: lopende tekst, via Google Fonts.

Beeldtaal:
- Moorse tegelpatronen (vierkantjes, pijlvormen, sterren) als banden, maskers over foto's en overgangen.
- Patronen eindigen altijd gerafeld, nooit recht afgesneden.
- Gekantelde foto's (tussen 4 en 9 graden) die rechttrekken tijdens het scrollen.
- Dunne verticale middenlijnen die zich uittekenen tijdens het scrollen.

## Secties (van boven naar beneden)

| Sectie | Class | Desktop | Aandachtspunt mobiel |
|---|---|---|---|
| Nav | `nav_component` | Vast. ES/EN links, LR-logo midden, MENU rechts. Kleurt crème op donkere achtergrond | Blijft vast; ruimte voor drie elementen op 390 |
| Hero | `section_hero` | Foto van de zussen, zichtbaar via tegelmasker. Olievlek-intro na de preloader. Crème kop op crème | Beeldverhouding van de foto; kop leesbaar op klein scherm |
| Coral | `section_coral` | Gekanteld portret (6,7°), namen CORAL en AMARA met parallax. Bevat de menulijst (bron voor het menu-overlay) | Namen en portret stapelen; menulijst wordt groot |
| Raíces | `section_raices` | Kop, podiumfoto (-8,2°), lopende tekst, middenlijnen | Eenvoudige stapeling |
| Las Voces | `section_voces` | Rode achtergrond, tegelbanden boven en onder, kop "Las voces / Antes del foco / Detrás" met parallax, 3 foto's, groepsfoto met tegelmasker | Drukste sectie; kopopbouw en fotovolgorde herzien |
| Su Propia Voz | `section_voz` | Bordeaux achtergrond, banden, kop "Tarará llegó al top…" met woord-voor-woord onthulling, twee gekantelde foto's | Zeer grote kop (ca. 210px desktop) |
| Concert | `section_concert` | Concertfoto groeit van klein naar schermvullend, tekst scrolt er crème overheen | Pin- en groeieffect op touch |
| Cierre | `section_cierre` | Donkere achtergrond, kop "Esto solo acaba de empezar" blijft staan, uitsnede van de zussen scrolt eroverheen | Kop past nu al nauwelijks op desktop |
| Footer | `footer_component` | Donker, logo, middenlijn, Spotify- en Instagram-icoon | Eenvoudig |

Menu-overlay: wordt door het script opgebouwd uit `.coral_menu` en `.footer_social`. Rood vlak bouwt op uit tegels, menu-items 115px, hover met tegelclusters.

## Animaties: wat er nu draait

Alles staat in `lasrodes-webflow/src/`, één bestand per onderdeel:

| Bestand | Wat | Vraag voor mobiel |
|---|---|---|
| 03-preloader.js | Rood scherm, logo vult zich, lost op in tegels | Houden; korter? |
| 12-patterns.js | WebGL-banden, fotomaskers, olievlek, parallax (`data-parallax`) | Prestaties op oudere telefoons; parallax staat nu uit onder 768px |
| 04-nav-color.js | Nav-kleur volgt de achtergrond | Houden |
| 05-lines.js | Middenlijnen tekenen uit | Houden |
| 06-menu-hover.js | Tegelclusters bij hover | Vervalt op touch |
| 07-menu.js | Menu-overlay | Menu-items moeten passen op 390 |
| 08-tilt.js | Gekantelde foto's trekken recht | Houden of vast recht? |
| 09-concert.js | Concertfoto groeit en pint | Alternatief op touch? |
| 10-cierre.js | Kop pint, foto scrolt eroverheen | Alternatief op touch? |
| 11-concert-text.js | Crème tekst over foto, Tarará per regel | Werkt met andere regelafbreking |

Alle animaties respecteren prefers-reduced-motion.

## Beslissingen die vóór het ontwerpen genomen moeten worden

1. Osmo per breakpoint: ontwerpbreedte 834 en 390?
2. Welke animaties blijven op mobiel, welke worden eenvoudiger, welke vervallen?
3. Tegelbanden op mobiel: zelfde patroon kleiner, of uitsnede van het desktoppatroon?
4. Grote koppen (Tarará, Cierre, Las Voces): andere regelafbreking, kleiner, of beide?
5. Volgorde en aantal foto's in Las Voces en Su Propia Voz.

## Bekende afwijkingen en open punten

- Tekstfouten letterlijk uit Figma overgenomen: "influyentesy", "empeza.", "Cordoba" (zonder accent).
- Spotify- en Instagram-links zijn nog plaatshouders.
- Alt-tekst van het Spotify-icoon staat nog op "Social".
- ES/EN-knop werkt nog niet; een Engelse versie (Webflow Localization of aparte pagina) is nog niet besloten.

## Werkwijze voor scripts

1. Pas een bestand aan in `src/` of `styles.css`.
2. Draai `build.sh` (of upload de gewijzigde bestanden in `dist/`).
3. Nieuwe release op GitHub met een hoger nummer, bijvoorbeeld `lasrodes-v1.0.1`.
4. Versienummer aanpassen in de twee jsDelivr-regels in de head code van Webflow, publiceren.
