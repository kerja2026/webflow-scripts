/* =============================================================
   PRAKTIJK TROUW — HEAD
   Draait voordat de pagina zichtbaar wordt, daarom zonder defer in de
   head. Zet js-anim (beginstanden van de intro-animatie) en, als de
   bezoeker van een andere pagina komt, is-transitioning (de
   paginatransitie dekt de pagina af tot hij geladen is).
   ============================================================= */
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