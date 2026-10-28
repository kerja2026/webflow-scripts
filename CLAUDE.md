# webflow-scripts — werkafspraken

Deze repository bevat de scripts en stijlen voor de Webflow-sites van Kerja.
Elke site heeft een eigen map. Webflow laadt de bestanden via jsDelivr, vast
op een release-tag. Een wijziging is pas live als er een nieuwe tag is en
Webflow naar die tag verwijst.

Antwoord in het Nederlands.

## Mappen

| Map | Site | Tags |
|---|---|---|
| `trouw-webflow/` | Praktijk Trouw (trouw-manueel-therapie.webflow.io) | `trouw-vX.Y.Z` |

Wijzig alleen bestanden in de map van de site waar de opdracht over gaat.
Zet nooit bestanden van een andere site in die map, en niets in de hoofdmap.

## Praktijk Trouw

- Webflow site-ID: `6a7990118653bed4eca8c876`
- Bestanden: `trouw-head.js`, `trouw.css`, `trouw.js`, `contact.js`, `404.css`
- Scriptlinks in Webflow staan op vier plekken:
  1. Site, head: `trouw-head.js` en `trouw.css`
  2. Site, footer: GSAP, ScrollTrigger, SplitText, Lenis en `trouw.js`
  3. Pagina Contact (`6aba434800ade4d528c29128`), footer: `contact.js`
  4. Pagina 404 (`6abd0eafd0c35da0fc37cebe`), head: `404.css`
- Alle vier verwijzen altijd naar dezelfde tag.
- Opmaak en layout horen in het Style-panel van Webflow. Code alleen voor
  beweging en gedrag. Maten in em (Osmo-schaling), niet in px.

## Proces bij elke wijziging

1. `git pull` en controleer dat `main` gelijk is aan de nieuwste tag van de
   site. Wijkt het af, meld dat eerst.
2. Wijzig het bestand. Houd de commentaarblokken per sectie bij.
3. Controleer: `node --check` op elk gewijzigd JS-bestand.
4. Test waar mogelijk in een headless browser, ook op telefoonformaat
   (390 × 844) en met `prefers-reduced-motion`.
5. Laat de wijziging zien en wacht op akkoord voordat je commit.
6. Commit met een korte Nederlandse omschrijving en push naar `main`.
7. Tag en release:
   - patch (`X.Y.Z+1`): reparatie of kleine aanpassing
   - minor (`X.Y+1.0`): nieuw effect of nieuwe functie
   - `gh release create trouw-vX.Y.Z --title "trouw-vX.Y.Z" --notes "..."`
8. Controleer de release: de bestanden in de tag zijn gelijk aan wat je
   wilde uitbrengen, en
   `https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@<tag>/trouw-webflow/trouw.js`
   levert de nieuwe inhoud.
9. Zet de vier scriptlinks in Webflow om naar de nieuwe tag.
10. Meld wat er veranderd is en wat Peter na publiceren moet nalopen.
    Publiceer de Webflow-site niet zelf.

## Niet doen

- Geen tags verplaatsen of verwijderen; een fout herstel je met een nieuwe tag.
- Geen `@main` of `@latest` in de scriptlinks.
- Geen wachtwoorden, tokens of API-sleutels in bestanden of commits.
- Niet publiceren in Webflow zonder expliciete opdracht.
