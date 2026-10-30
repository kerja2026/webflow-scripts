/* =============================================================
   PRAKTIJK TROUW — HEAD
   Draait voordat de pagina zichtbaar wordt, daarom zonder defer in de
   head. Zet js-anim (beginstanden van de intro-animatie), en
   is-transitioning als de bezoeker van een andere pagina komt (de
   paginatransitie dekt de pagina af tot hij geladen is), of
   is-preloading bij het eerste bezoek in een sessie (de preloader met
   logo en wisselende foto's dekt de pagina af).
   ============================================================= */
(function () {
  var html = document.documentElement;
  html.classList.add('js-anim');
  try {
    if (sessionStorage.getItem('trouw-transition') === '1') {
      html.classList.add('is-transitioning');
      setTimeout(function () { html.classList.remove('is-transitioning'); }, 5000);
    } else if (sessionStorage.getItem('trouw-visited') !== '1') {
      /* Eerste bezoek in deze sessie: de preloader dekt de pagina af
         tot hij geladen is. Vangnet: na 10 seconden altijd weg. */
      html.classList.add('is-preloading');
      sessionStorage.setItem('trouw-visited', '1');
      setTimeout(function () { html.classList.remove('is-preloading'); }, 10000);
    }
  } catch (e) {}
})();