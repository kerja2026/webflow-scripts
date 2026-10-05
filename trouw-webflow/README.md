# Praktijk Trouw — Webflow scripts

Externe CSS en JavaScript voor www.praktijktrouw.nl, geserveerd via jsDelivr.

## Bestanden

| Bestand | Waar geladen | Wat het doet |
|---|---|---|
| `css/trouw.css` | sitebreed, head | scrollbalk, header-toestanden, menu, transitie, beginstanden van animaties |
| `js/trouw.js` | sitebreed, footer | smooth scroll, header, menu, paginatransitie, intro, specialisaties, schuivende secties, achtergrond, parallax, footer |
| `js/contact.js` | alleen Contact | geeft de klik op de zichtbare knop door aan de verborgen verzendknop |
| `css/404.css` | alleen 404 | lichte header en tekst over de gif |

## Wat in Webflow blijft

- Het kleine script in de head dat `js-anim` zet. Het moet draaien voordat de pagina zichtbaar wordt.
- De Code Embed in het Header-component (Osmo-schaling, lettertype, keuzerondje). De Designer toont alleen die CSS, geen externe bestanden.

## Webflow: Project Settings › Custom Code

### Head Code

```html
<script>
(function () {
  var html = document.documentElement;
  html.classList.add('js-anim');
  try {
    if (sessionStorage.getItem('trouw-transition') === '1') {
      html.classList.add('is-transitioning');
      setTimeout(function () { html.classList.remove('is-transitioning'); }, 5000);
    }
  } catch (e) {}
})();
</script>
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/JOUWNAAM/trouw-webflow@v1.0.0/css/trouw.css">
```

### Footer Code

```html
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/JOUWNAAM/trouw-webflow@v1.0.0/js/trouw.js"></script>
```

## Webflow: Page Settings

### Contact › Before </body> tag

```html
<script defer src="https://cdn.jsdelivr.net/gh/JOUWNAAM/trouw-webflow@v1.0.0/js/contact.js"></script>
```

### 404 › Inside <head> tag

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/JOUWNAAM/trouw-webflow@v1.0.0/css/404.css">
```

## Een wijziging live zetten

1. Pas het bestand aan en commit.
2. Maak een nieuwe release, bijvoorbeeld `v1.0.1`.
3. Vervang in Webflow overal `@v1.0.0` door `@v1.0.1`.
4. Publiceer.

Gebruik altijd een versienummer, nooit `@main`: jsDelivr bewaart een branch tot twaalf uur in de cache.
