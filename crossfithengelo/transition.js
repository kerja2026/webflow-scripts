/* ═══════════════════════════════════════════════════════════
   CROSSFIT HENGELO — pagina-overgang
   Vereist: GSAP (in <head>) + de #page-overlay injector (in <head>).
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  var overlay = document.querySelector('#page-overlay');
  var logo = document.querySelector('#page-overlay img');
  if (!overlay) return;

  function revealPage() {
    gsap.set(overlay, { clipPath: 'inset(0 0 0% 0)', pointerEvents: 'auto' });
    gsap.set(logo, { scale: 1 });
    gsap.timeline({ delay: 0.2 })
      .to(logo, { scale: 0.88, duration: 0.3, ease: 'power2.in' })
      .to(overlay, { clipPath: 'inset(100% 0 0% 0)', duration: 0.9, ease: 'expo.inOut' }, '<0.1')
      .set(overlay, { pointerEvents: 'none' });
  }

  revealPage();

  /* Terug/vooruit-navigatie (bfcache) */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) revealPage();
  });

  /* Overgang tonen bij interne links */
  document.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto') && !href.startsWith('tel') && link.target !== '_blank') {
        e.preventDefault();
        gsap.set(overlay, { pointerEvents: 'auto' });
        gsap.timeline()
          .set(logo, { scale: 0.88 })
          .fromTo(overlay,
            { clipPath: 'inset(0 0 100% 0)' },
            { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.inOut',
              onComplete: function () { window.location.href = href; } }
          )
          .to(logo, { scale: 1, duration: 0.6, ease: 'power2.out' }, '-=0.4');
      }
    });
  });
});
