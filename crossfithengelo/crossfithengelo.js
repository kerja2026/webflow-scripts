/* ═══════════════════════════════════════════════════════════
   CROSSFIT HENGELO — hoofdscript
   Vereist in <head>: GSAP 3.13+ + ScrollTrigger + SplitText
   Vereist in footer, vóór dit bestand: Lenis CDN (v1)
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Guard: zonder GSAP niets doen, maar wel de pagina tonen ───
     Zonder dit blijft alles met .anim-heading permanent op opacity:0
     staan als de CDN faalt. */
  if (typeof gsap === 'undefined') {
    document.documentElement.classList.add('no-gsap');
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var qsa = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  var ready = function (fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  };

  var navSection = null;
  var lenis = null;

  /* ═══════════════════════════════════════════════════════════
     DOM KLAAR
     ═══════════════════════════════════════════════════════════ */
  ready(function () {

    navSection = document.querySelector('.nav_section');

    /* ─── 1. Navbar kleurwissel op donkere secties ───
       toggleClass i.p.v. 4 losse callbacks: bij aangrenzende
       .nav-dark-bg secties kon de add/remove-volgorde flikkeren. */
    var navbarWrapper = document.querySelector('.navbar_component_wrapper');
    if (navbarWrapper) {
      qsa('.nav-dark-bg').forEach(function (section) {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          toggleClass: { targets: navbarWrapper, className: 'navbar--light' }
        });
      });
    }

    /* ─── 2. Heading-animatie (.anim-heading) ───
       SplitText.create() wacht zelf op font-loading, dus de
       setTimeout(500) is weg. autoSplit hersplitst bij resize
       (anders klopt de line-mask na een rotatie niet meer);
       de reveal speelt bewust maar één keer. */
    qsa('.anim-heading').forEach(function (heading) {
      var gespeeld = false;
      SplitText.create(heading, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: function (self) {
          gsap.set(heading, { opacity: 1 });
          if (gespeeld) return;
          gespeeld = true;
          return gsap.from(self.lines, {
            clipPath: 'inset(0 100% 0 0)',
            duration: 1,
            stagger: 0.1,
            ease: 'power4.inOut'
          });
          /* Wil je dit pas laten spelen zodra de heading in beeld komt,
             voeg dan toe: scrollTrigger: { trigger: heading, start: 'top 85%' } */
        }
      });
    });

    /* ─── 3. Line reveal ([data-line-reveal]) ─── */
    qsa('[data-line-reveal]').forEach(function (el) {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, {
            scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 60%', scrub: 1 },
            clipPath: 'inset(0 100% 0 0)',
            stagger: 0.15
          });
        }
      });
    });

    /* ─── 4. Nederlandse datumnotatie ───
       new Date() is veel te tolerant: "2024" → 1 jan 2024, "5" → 1 mei 2001.
       Met .text-block in de selector werd zo elk los getal of jaartal
       op de site herschreven. Daarom eerst een strikte vormcheck:
       alleen ISO (2024-03-12) of een maandnaam + 4-cijferig jaartal. */
    var DATUM_VORM = /^(\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{4})\b/;
    var NL_DATUM = { day: 'numeric', month: 'long', year: 'numeric' };

    qsa('.cms-datum, .blog_date, .text-block').forEach(function (el) {
      var raw = el.textContent.trim();
      if (!DATUM_VORM.test(raw)) return;

      var iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      /* Kale ISO-datums worden als UTC geparsed; lokaal opbouwen
         voorkomt een dag verschil in negatieve tijdzones. */
      var date = iso
        ? new Date(+iso[1], +iso[2] - 1, +iso[3])
        : new Date(raw);

      if (!isNaN(date.getTime())) el.textContent = date.toLocaleDateString('nl-NL', NL_DATUM);
    });

    /* ─── 5. Afbeeldingen: lazy loading ───
       Stond eerst in de load-handler, waar het per definitie te laat is:
       op dat moment zijn alle afbeeldingen al gedownload.
       De mobiele src-herschrijving is geschrapt — die matchte de huidige
       Webflow-CDN niet, verloor het van srcset, en veroorzaakte op de
       oude CDN een tweede download van elke afbeelding. */
    var vh = window.innerHeight;
    qsa('img').forEach(function (img) {
      if (!img.hasAttribute('loading') && img.getBoundingClientRect().top >= vh) {
        img.setAttribute('loading', 'lazy');
      }
      img.setAttribute('decoding', 'async');
    });

    /* ─── 6. Hero-tekst (.anim-line) ─── */
    qsa('.anim-line').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('visible'); }, 100 + i * 150);
    });
  });

  /* ═══════════════════════════════════════════════════════════
     PAGINA GELADEN
     ═══════════════════════════════════════════════════════════ */
  window.addEventListener('load', function () {

    /* ─── 7. Lenis smooth scroll ───
       normalizeWheel en smoothTouch bestaan niet meer in Lenis v1
       (smoothTouch heet nu syncTouch) — die werden stil genegeerd. */
    if (typeof Lenis !== 'undefined') {
      lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 0.7,
        gestureOrientation: 'vertical',
        syncTouch: false
      });
      window.lenis = lenis; /* zodat modals e.d. het scrollen kunnen pauzeren */

      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);

      /* ─── 8. Lenis start/stop-controls ─── */
      qsa('[data-lenis-start], [data-lenis-stop], [data-lenis-toggle]').forEach(function (el) {
        el.addEventListener('click', function () {
          if (el.hasAttribute('data-lenis-start')) lenis.start();
          else if (el.hasAttribute('data-lenis-stop')) lenis.stop();
          else {
            el.classList.toggle('stop-scroll');
            el.classList.contains('stop-scroll') ? lenis.stop() : lenis.start();
          }
        });
      });

      /* ─── 9. Navbar verbergen bij scrollen ───
         Let op: de timeout toont de navbar weer zodra je stopt met
         scrollen. Wil je hem verborgen houden tot je omhoog scrollt,
         haal dan het stopTimeout-blok weg. */
      var stopTimeout;
      lenis.on('scroll', function (e) {
        if (!navSection) return;
        clearTimeout(stopTimeout);
        if (e.direction === 1 && e.scroll > 10) navSection.classList.add('navbar--hidden');
        else if (e.direction === -1) navSection.classList.remove('navbar--hidden');
        stopTimeout = setTimeout(function () { navSection.classList.remove('navbar--hidden'); }, 300);
      });
    }

    /* ─── 10. Video autoplay-fix (Safari iOS) ───
       video.load() is weg: dat reset en herdownloadt elke video.
       Alleen video's die écht moeten autoplayen worden gemute —
       eerst kreeg ook een video mét geluid muted = true. */
    qsa('video').forEach(function (video) {
      video.setAttribute('playsinline', ''); /* hoort eigenlijk in de HTML */
    });
    qsa('video[autoplay], video[data-autoplay]').forEach(function (video) {
      video.muted = true;
      video.play().catch(function () {});
    });

    /* ─── 11. Parallax (.parallax-img) ─── */
    var mm = gsap.matchMedia();
    function setupParallax(yRange) {
      gsap.utils.toArray('.parallax-img').forEach(function (img) {
        gsap.fromTo(img, { y: -yRange }, {
          y: yRange, ease: 'none',
          scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 1 }
        });
      });
    }
    mm.add('(min-width: 768px)', function () { setupParallax(150); });
    mm.add('(max-width: 767px)', function () { setupParallax(40); });

    /* ─── 12. Cards stagger reveal (.anim-stagger) ─── */
    gsap.utils.toArray('.anim-stagger').forEach(function (parent) {
      gsap.from(parent.children, {
        scrollTrigger: { trigger: parent, start: 'top 25%' },
        opacity: 0, y: 36, duration: 1.5, stagger: 0.12, ease: 'power2.out'
      });
    });

    /* ─── 13. Stacked cards scroll (.sc-card) ───
       Eén ScrollTrigger per kaart i.p.v. twee identieke. */
    var stackedCards = qsa('.sc-card');
    stackedCards.forEach(function (card, i) {
      var next = stackedCards[i + 1];
      if (!next) return;
      var tl = gsap.timeline({
        scrollTrigger: { trigger: next, start: 'top 80%', end: 'top 30%', scrub: 1 }
      });
      tl.to(card, { scale: 0.95, ease: 'none' }, 0);
      var textEl = card.querySelector('.sc-card-text');
      if (textEl) tl.to(textEl, { backgroundColor: '#29421F', ease: 'none' }, 0);
    });

    /* ─── 14. Groene CTA-reveal (.anim-mask-section) ───
       Was één tween over álle secties, met de eerste als trigger:
       secties verderop waren al uitgeanimeerd voor je ze zag. */
    gsap.utils.toArray('.anim-mask-section').forEach(function (el) {
      gsap.fromTo(el,
        { clipPath: 'inset(100% 0 0 0)', y: 100 },
        { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none none' }
        }
      );
    });

    /* ─── 15. Posities herberekenen ───
       SplitText wikkelt regels in extra elementen en verandert daarmee
       hoogtes; zonder refresh rekenen bovenstaande triggers met
       verouderde start/end-waarden. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    } else {
      ScrollTrigger.refresh();
    }
  });

  /* ═══════════════════════════════════════════════════════════
     16. Kopieerbeveiliging op juridische pagina's
     ───────────────────────────────────────────────────────────
     Kanttekening: dit is in seconden te omzeilen (view-source,
     reader mode, JS uit) en geeft geen extra juridische bescherming,
     terwijl het hulpsoftware en normaal tekstselecteren hindert —
     juist op de pagina's waar mensen hun rechten willen overnemen.
     Overweeg het te schrappen. Functioneel hier ongewijzigd gelaten,
     alleen op <body> i.p.v. <html>.
     ═══════════════════════════════════════════════════════════ */
  (function () {
    var beschermd = ['/algemene-voorwaarden', '/privacy-policy', '/cookiebeleid', '/huisregels'];
    var pad = window.location.pathname.replace(/\/+$/, '') || '/';
    var match = beschermd.some(function (p) { return pad === p || pad.indexOf(p + '/') === 0; });
    if (!match) return;

    ready(function () {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    });
    ['copy', 'cut', 'contextmenu'].forEach(function (type) {
      document.addEventListener(type, function (e) { e.preventDefault(); });
    });
  })();

  /* ═══════════════════════════════════════════════════════════
     17. Cookiebot tonen na 3s
     ───────────────────────────────────────────────────────────
     Ongewijzigd gelaten omdat het werkt, met twee kanttekeningen:
     - `display: revert` valt terug op de user-agent-waarde (block).
       Heeft Cookiebot flex nodig, dan breekt de layout.
     - Controleer of er in die 3 seconden nog geen niet-noodzakelijke
       scripts laden — dát is het punt waar ePrivacy op let.
     ═══════════════════════════════════════════════════════════ */
  setTimeout(function () {
    var style = document.createElement('style');
    style.textContent = '#CybotCookiebotDialog, #CybotCookiebotDialogBodyUnderlay { display: revert !important; }';
    document.head.appendChild(style);
  }, 3000);

  /* ═══════════════════════════════════════════════════════════
     18. Promo-modal
     ═══════════════════════════════════════════════════════════ */
  ready(function () {
    var overlay = document.querySelector('.modal-overlay');
    var modal   = document.querySelector('.modal-wrap');
    if (!overlay || !modal) return;

    /* sessionStorage gooit in Safari privémodus / bij geblokkeerde
       cookies — zonder try/catch sloopte dat de hele modal. */
    var store = {
      get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
    };
    if (store.get('modalShown')) return;

    var closeBtn = document.querySelector('.modal-close');
    var triggered = false;

    /* Forceer z-index en klikbaarheid op sluitknop.
       Hoort eigenlijk in een Webflow-klasse; staat de knop nog steeds
       in de weg, dan is de oorzaak meestal een overlay eroverheen. */
    if (closeBtn) {
      Object.assign(closeBtn.style, {
        position: 'absolute', zIndex: '10001', cursor: 'pointer',
        minWidth: '44px', minHeight: '44px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'all', webkitTapHighlightColor: 'transparent'
      });
    }
    Object.assign(overlay.style, {
      transition: 'opacity 0.4s ease',
      backgroundColor: 'rgba(0,0,0,0.4)',
      zIndex: '9999'
    });
    Object.assign(modal.style, {
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      zIndex: '10000'
    });

    function onScroll() {
      if (window.scrollY >= 700) openModal();
    }

    function openModal() {
      if (triggered) return;
      triggered = true;
      store.set('modalShown', 'true');
      /* listener opruimen; die bleef eerst voor altijd meedraaien */
      window.removeEventListener('scroll', onScroll);
      if (window.lenis) window.lenis.stop();

      overlay.style.opacity = '0';
      overlay.style.display = 'block';
      modal.style.opacity   = '0';
      modal.style.display   = 'block';
      modal.style.transform = 'translate(-50%, -50%) scale(0.9)';

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          overlay.style.opacity = '1';
          modal.style.opacity   = '1';
          modal.style.transform = 'translate(-50%, -50%) scale(1)';
          if (closeBtn) closeBtn.focus({ preventScroll: true });
        });
      });
      document.addEventListener('keydown', onKeydown);
    }

    function closeModal() {
      document.removeEventListener('keydown', onKeydown);
      if (window.lenis) window.lenis.start();
      overlay.style.opacity = '0';
      modal.style.opacity   = '0';
      modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(function () {
        overlay.style.display = 'none';
        modal.style.display   = 'none';
      }, 400);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') closeModal();
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    if (closeBtn) {
      closeBtn.setAttribute('aria-label', closeBtn.getAttribute('aria-label') || 'Sluiten');
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeModal();
      });
      closeBtn.addEventListener('touchend', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      });
    }

    /* Alleen sluiten bij een klik op de overlay zelf — anders sloot
       elke klik binnen de modal (op tekst, op een link) het venster. */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
  });

})();
