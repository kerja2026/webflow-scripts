# Kerja 2026 — Webflow scripts

Externe CSS en JavaScript voor de Kerja-site (Webflow-project "kerja 2026"),
geserveerd via jsDelivr en vast op een release-tag (`kerja2026-vX.Y.Z`).

Tot en met deze versie stond alle code in de Custom Code van Webflow. De
inhoud van deze bestanden is daar een-op-een uit overgenomen; alleen de
kopteksten per bestand en het script "ComingSoon" (eerst een los
geregistreerd script) zijn erbij gekomen.

## Bestanden

| Bestand | Waar geladen | Wat het doet |
|---|---|---|
| `osmo.css` | sitebreed, head, als eerste | Osmo Scaling System (root-variant). Designbreedte 1512, tablet 834, mobiel liggend 550, mobiel 390 |
| `kerja-head.js` | sitebreed, head, zonder `defer` | zet `dl-anim`, `pt-enter` en `theme-light` op `html` voor de eerste paint en meet `--kerja-bottom-offset` op mobiel |
| `kerja.css` | sitebreed, head | light/dark mode, menu-animatie, Lenis, scrollbalk, split-hover, dots-lines, woord-hover, pagina-overgang, fonts voor de begroetingen |
| `kerja.js` | sitebreed, footer, na Lenis | Lenis, ankers, menu en scrollstatus, FAQ, split-hover, dots-lines, zigzag, woord-hover, logo, pagina-overgang en light/dark mode, cursor, coming soon |
| `services.js` | alleen pagina Services, footer | services-vlakken met hover, reviews met vorige/volgende |

Opmaak en layout horen in het Style-panel van Webflow. Deze bestanden bevatten
alleen gedrag, en de standen die alleen een script zet (Webflow ruimt combo
classes op die op geen enkel element staan).

## Webflow: Site settings › Custom code

### Head code

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@TAG/kerja2026-webflow/osmo.min.css">
<script src="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@TAG/kerja2026-webflow/kerja-head.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@TAG/kerja2026-webflow/kerja.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400&family=Noto+Sans+Arabic:wght@400&family=Noto+Sans+JP:wght@400&text=%20%21%D0%9F%D0%B0%D0%B2%D0%B5%D0%B8%D0%BA%D0%BE%D1%80%D1%82%D8%A7%D8%A8%D8%A9%D8%AD%D8%B1%D8%B3%D8%B9%D9%84%D9%85%E3%81%93%E3%81%9F%E3%81%A1%E3%81%AB%E3%81%AD%E3%81%AF%E3%81%BE%E3%82%93&display=swap">
```

`kerja-head.js` staat bewust zonder `defer`: het moet de classes op `html`
zetten voordat de pagina zichtbaar wordt, anders flitsen lijnen en teksten.

### Footer code

```html
<script defer src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@TAG/kerja2026-webflow/kerja.min.js"></script>
```

## Webflow: Page settings

### Services (`6b00459b48fe968f9b994c21`) › Before `</body>` tag

```html
<script defer src="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@TAG/kerja2026-webflow/services.min.js"></script>
```

### Site › Scripts

Het geregistreerde script "ComingSoon" kan weg zodra de nieuwe footer-code
live is: het zit nu in `kerja.js`.

## Een wijziging live zetten

1. Pas het bestand aan, `node --check` op elk gewijzigd JS-bestand, commit.
2. Maak een nieuwe release, bijvoorbeeld `kerja2026-v1.1.0`.
3. Controleer dat
   `https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@<tag>/kerja2026-webflow/kerja.js`
   de nieuwe inhoud levert.
4. Zet alle links in Webflow (head, footer, pagina Services) op de nieuwe tag.
5. Publiceer in Webflow en loop de site na.
