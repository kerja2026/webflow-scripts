# Las Rodes — scripts en stijlen

Tribute-onepager voor Las Rodes (Kerja). Webflow-site: `las-rodes` (staging: las-rodes.webflow.io).
Alle code die buiten de Webflow Designer valt staat hier, en wordt via jsDelivr geladen.

## Structuur

```
las-rodes/
  styles.css            stijlen: Osmo scaling (1512), preloader, menu, nav, brede schermen
  src/                  bron, één bestand per onderdeel (volgorde = laadvolgorde)
    01-lenis.js         smooth scroll, gekoppeld aan ScrollTrigger
    02-intro.js         taalkeuze en MENU komen binnen na de olievlek
    03-preloader.js     rood scherm, logo vult zich, lost op in tegels (SPILL_AT)
    04-nav-color.js     nav wordt crème op donkere achtergronden
    05-lines.js         middenlijnen tekenen zich uit tijdens scrollen
    06-menu-hover.js    tegelclusters over menu-items (SIZE, CLUSTERS, BUILD, FADE)
    07-menu.js          menu-overlay dat zich opbouwt uit tegels
    08-tilt.js          gekantelde foto's staan recht in het midden van het venster
    09-concert.js       concertfoto groeit naar schermvullend
    10-cierre.js        afsluiter: kop blijft staan, zussen scrollen eroverheen
    11-concert-text.js  crème tekst over de concertfoto, Tarará per regel
    13-line-tilt.js     regels die rechttrekken tijdens scrollen (attribuut data-line-tilt)
    14-logo-scale.js    logo verkleint naar 65% bij scrollen, terug bovenaan
    15-photo-reveal.js  foto komt uit het patroon tevoorschijn en groeit (attribuut data-photo-reveal)
    16-music.js         muziek met knop rechtsonder, start na de preloader
    99-patterns.js      WebGL-patronen: banden, fotomaskers, olievlek, parallax (moet als laatste)
  dist/                 gebouwde bestanden, deze laadt Webflow
    las-rodes.js        alle src-bestanden achter elkaar
    las-rodes.min.js    geminificeerd
    styles.min.css      geminificeerd
  build.sh              bouwt dist/ opnieuw
  webflow-head.html     de code voor Webflow > Site Settings > Custom Code > Head code
```

## Aanpassen en publiceren

1. Pas een bestand in `src/` of `styles.css` aan.
2. Draai `./build.sh` (vraagt Node.js; haalt terser en clean-css zelf op).
3. Commit en push, en maak een nieuwe tag, bijvoorbeeld `lasrodes-v1.0.1`:
   ```
   git tag lasrodes-v1.0.1 && git push --tags
   ```
4. Zet in Webflow het nieuwe versienummer in de twee jsDelivr-regels van de head code, en publiceer.

Werk met tags, niet met `@main`: jsDelivr bewaart een branch tot 7 dagen in de cache, een tag is direct en blijvend.

## Instellingen die je vaak bijstelt

| Bestand | Waarde | Betekenis |
|---|---|---|
| 03-preloader.js | `SPILL_AT=.3` | deel van het rode vlak dat weg is voor de olievlek start |
| 06-menu-hover.js | `SIZE=.45` | tegelmaat als deel van de lettergrootte |
| 06-menu-hover.js | `CLUSTERS=4` | aantal tegelclusters per menu-item |
| 06-menu-hover.js | `BUILD=800,FADE=1000` | duur opbouwen en oplossen in ms |
| 09-concert.js | `K=.85` | snelheid van de concertfoto t.o.v. de tekst |
| 10-cierre.js | `K=.9` | snelheid van de zussenfoto na het loslaten |
| Webflow (attribuut) | `data-parallax` | parallaxsterkte per element, zonder code aan te passen |
| Webflow (attribuut) | `data-line-tilt` | starthoek per regel in graden, bijvoorbeeld `-3`; recht in het midden van het venster |

## Afhankelijkheden

GSAP 3.13.0 (met ScrollTrigger en SplitText) en Lenis 1.1.14, geladen vanaf jsDelivr in `webflow-head.html`.
