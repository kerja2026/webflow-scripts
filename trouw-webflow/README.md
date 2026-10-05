# Praktijk Trouw — Webflow scripts

Externe CSS en JavaScript voor www.praktijktrouw.nl, geserveerd via jsDelivr.

## Bestanden

| Bestand | Waar geladen | Wat het doet |
|---|---|---|
| `trouw.css` | sitebreed, head | scrollbalk, header-toestanden, menu, transitie, beginstanden van animaties |
| `trouw.js` | sitebreed, footer | smooth scroll, header, menu, paginatransitie, intro, specialisaties, schuivende secties, achtergrond, parallax, footer |
| `contact.js` | alleen Contact | geeft de klik op de zichtbare knop door aan de verborgen verzendknop |
| `404.css` | alleen 404 | lichte header en tekst over de gif |

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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@trouw-v1.0.1/trouw-webflow/trouw.css">
```

### Footer Code

```html
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@trouw-v1.0.1/trouw-webflow/trouw.js"></script>
```

## Webflow: Page Settings

### Contact › Before </body> tag

```html
<script defer src="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@trouw-v1.0.1/trouw-webflow/contact.js"></script>
```

### 404 › Inside <head> tag

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kerja2026/webflow-scripts@trouw-v1.0.1/trouw-webflow/404.css">
```

## Een wijziging live zetten

1. Pas het bestand aan en commit.
2. Maak een nieuwe release, bijvoorbeeld `trouw-v1.0.2`.
3. Vervang in Webflow overal `@trouw-v1.0.1` door `@trouw-v1.0.2`.
4. Publiceer.

Gebruik altijd een versienummer, nooit `@main`: jsDelivr bewaart een branch tot twaalf uur in de cache.
