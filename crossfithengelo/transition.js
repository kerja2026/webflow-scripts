/* ═══════════════════════════════════════════════════════════
   CROSSFIT HENGELO — pagina-overgang
   Vereist: GSAP (in <head>) + de #page-overlay injector (in <head>).
   De overgang zelf is ongewijzigd: zelfde overlay, logo en timing.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.documentElement;
  var overlay = document.getElementById('page-overlay');

  /* Geen overlay (prefers-reduced-motion of injector mislukt):
     niets te doen, Cookiebot vrijgeven. */
  if (!overlay) {
    root.classList.remove('cfh-intro');
    return;
  }

  /* Zonder GSAP zou het zwarte overlay voor altijd blijven staan.
     Dus: weghalen en de pagina gewoon tonen. */
  if (typeof gsap === 'undefined') {
    overlay.remove();
    root.classList.remove('cfh-intro');
    return;
  }

  var logo = overlay.querySelector('img');
  var navigating = false;

  /* Meldt aan de noodrem in de head dat dit script het overlay beheert. */
  overlay.setAttribute('data-ready', '1');

  function revealPage() {
    navigating = false;
    gsap.set(overlay, { clipPath: 'inset(0 0 0% 0)', pointerEvents: 'auto' });
    if (logo) gsap.set(logo, { scale: 1 });

    var tl = gsap.timeline({
      delay: 0.2,
      onComplete: function () { root.classList.remove('cfh-intro'); }
    });
    if (logo) tl.to(logo, { scale: 0.88, duration: 0.3, ease: 'power2.in' });
    tl.to(overlay, { clipPath: 'inset(100% 0 0% 0)', duration: 0.9, ease: 'expo.inOut' }, logo ? '<0.1' : 0)
      .set(overlay, { pointerEvents: 'none' });
  }

  revealPage();

  /* Terug/vooruit-navigatie (bfcache) */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) revealPage();
  });

  /* Overgang tonen bij links. Eén listener op document, dus ook links
     die later in de pagina komen (CMS-lijsten, menu) werken. */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    /* Cmd/Ctrl/Shift/Alt-klik: de browser opent een nieuw tabblad of venster */
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    var url;
    try { url = new URL(link.href, window.location.href); } catch (err) { return; }

    /* mailto:, tel:, whatsapp:, javascript: enzovoort */
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    /* Anker op dezelfde pagina */
    if (url.pathname === window.location.pathname &&
        url.search === window.location.search && url.hash) return;

    e.preventDefault();
    if (navigating) return;
    navigating = true;

    var gaNaar = function () { window.location.href = url.href; };

    gsap.set(overlay, { pointerEvents: 'auto' });
    var tl = gsap.timeline();
    if (logo) tl.set(logo, { scale: 0.88 });
    tl.fromTo(overlay,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.inOut', onComplete: gaNaar }
    );
    if (logo) tl.to(logo, { scale: 1, duration: 0.6, ease: 'power2.out' }, '-=0.4');

    /* Vangnet: stokt de animatie, dan gaat de bezoeker alsnog door. */
    setTimeout(gaNaar, 1800);
  });
})();
