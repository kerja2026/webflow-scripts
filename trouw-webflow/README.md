# Praktijk Trouw — Webflow scripts

Externe CSS en JavaScript voor www.praktijktrouw.nl, geserveerd via jsDelivr
en vast op een release-tag (`trouw-vX.Y.Z`).

## Bestanden

| Bestand | Waar geladen | Wat het doet |
|---|---|---|
| `trouw-head.js` | sitebreed, head | zet `js-anim`, `is-transitioning` of `is-preloading` voordat de pagina zichtbaar wordt |
| `trouw.css` | sitebreed, head | scrollbalk, header-toestanden, menu's, tekstlinks, transitie, preloader, beginstanden van animaties |
| `trouw.js` | sitebreed, footer | smooth scroll, header, menu's, paginatransitie, preloader, intro, specialisaties, schuivende secties, achtergrond, parallax, footer |
| `contact.js` | alleen Contact | geeft de klik op de zichtbare knop door aan de verborgen verzendknop |
| `404.css` | alleen 404 | lichte header en tekst over de gif |

## GSAP

Webflow laadt GSAP zelf (versie 3.15.0) omdat de site Webflow-interacties
gebruikt. Wij laden daarom alleen de plugins ScrollTrigger en SplitText, in
dezelfde versie. Werkt Webflow GSAP bij, zet de plugins dan op dezelfde
versie. Zonder GSAP doet `trouw.js` niets en blijft de pagina gewoon
zichtbaar.

## Webflow: Project Settings › Custom Code

### Head Code

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<script src="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@TAG/trouw-webflow/trouw-head.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@TAG/trouw-webflow/trouw.css">
```

### Footer Code

```html
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@TAG/trouw-webflow/trouw.js"></script>
```

## Webflow: Page Settings

### Contact › Before </body> tag

```html
<script defer src="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@TAG/trouw-webflow/contact.js"></script>
```

### 404 › Inside <head> tag

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@TAG/trouw-webflow/404.css">
```

## Een wijziging live zetten

1. Pas het bestand aan en commit.
2. Maak een nieuwe release, bijvoorbeeld `trouw-v2.12.0`.
3. Zet op alle vier plekken `@TAG` op die nieuwe tag.
4. Publiceer.

Gebruik altijd een versienummer, nooit `@main`: jsDelivr bewaart een branch
tot twaalf uur in de cache.
