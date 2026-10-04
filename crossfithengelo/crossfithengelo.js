/* ═══════════════════════════════════════════════════════════
   CROSSFIT HENGELO — hoofdscript
   Vereist in <head>: GSAP 3.13+ + ScrollTrigger + SplitText
   Vereist in footer, vóór dit bestand: Lenis CDN (v1)

   Bewegingsvoorkeur: bij prefers-reduced-motion blijft alles
   werken en zichtbaar. Alleen de beweging vervalt (Lenis,
   parallax, reveals, hover op de navbar-verberging).
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var root = document.documentElement;

  /* ─── Guard: ontbreekt GSAP, ScrollTrigger of SplitText, dan
     tonen we de pagina zonder animatie. De klasse no-gsap haalt
     in crossfithengelo.css de beginstaten weg. ─── */
  if (typeof gsap === 'undefined' ||
      typeof ScrollTrigger === 'undefined' ||
      typeof SplitText === 'undefined') {
    root.classList.add('no-gsap');
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Wachttijd voor animaties die direct bij het laden spelen, zodat ze
     zichtbaar zijn nadat het overgangs-overlay is weggeveegd. */
  var INTRO_DELAY = 0.7;
  var CARD_TEXT_ACTIVE = '#29421F';

  /* Startpunt voor scroll-animaties.
     Gewoon 'top 90%', met twee vangnetten:
     - Staat het element bij het laden al in beeld, dan ligt het startpunt
       vóór 0 en speelt de animatie direct. (clamp() zette het startpunt
       precies op 0, en dan wacht ScrollTrigger op de eerste scroll.)
     - Ligt het startpunt voorbij het einde van de pagina, dan schuift het
       net daarvoor, zodat ook secties onderaan altijd afspelen. */
  var startBij = function (el, procent) {
    return function () {
      var top = el.getBoundingClientRect().top + window.pageYOffset;
      var start = top - window.innerHeight * procent / 100;
      var max = ScrollTrigger.maxScroll(window) - 1;
      return Math.min(start, max);
    };
  };

  var qsa = function (sel, root_) {
    return Array.prototype.slice.call((root_ || document).querySelectorAll(sel));
  };
  var ready = function (fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  };

  var navSection = null;
  var lenis = null;

  /* ═══════════════════════════════════════════════════════════
     DOM KLAAR
     Alles staat hier, niet meer in window.load. Wachten op load
     (alle afbeeldingen en video's) zorgde voor een flits van
     zichtbare inhoud die daarna verdween. ScrollTrigger ververst
     zijn posities zelf bij load en na het laden van de fonts.
     ═══════════════════════════════════════════════════════════ */
  ready(function () {

    navSection = document.querySelector('.nav_section');

    /* ─── 1. Navbar kleurwissel op donkere secties ─── */
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
       Speelt zodra de heading in beeld komt. Staat hij al in beeld bij het
       laden, dan wacht hij tot het overgangs-overlay weg is.
       Wil je het oude gedrag terug (alles meteen bij laden), haal dan het
       scrollTrigger-blok weg. */
    qsa('.anim-heading').forEach(function (heading) {
      if (reduceMotion) { gsap.set(heading, { opacity: 1 }); return; }

      var gespeeld = false;
      SplitText.create(heading, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: function (self) {
          gsap.set(heading, { opacity: 1 });
          if (gespeeld) return;
          var inBeeld = heading.getBoundingClientRect().top < window.innerHeight * 0.9;
          return gsap.from(self.lines, {
            clipPath: 'inset(0 100% 0 0)',
            duration: 1,
            stagger: 0.1,
            ease: 'power4.inOut',
            delay: inBeeld ? INTRO_DELAY : 0,
            scrollTrigger: { trigger: heading, start: startBij(heading, 90), once: true },
            onComplete: function () { gespeeld = true; }
          });
        }
      });
    });

    /* ─── 3. Line reveal ([data-line-reveal]) ─── */
    if (!reduceMotion) {
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
    }

    /* ─── 4. Nederlandse datumnotatie ───
       Alleen strikte vormen (ISO of maandnaam + 4-cijferig jaar), zodat
       los getal of jaartal in .text-block niet wordt herschreven. */
    var DATUM_VORM = /^(\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{4})\b/;
    var NL_DATUM = { day: 'numeric', month: 'long', year: 'numeric' };

    qsa('.cms-datum, .blog_date, .text-block').forEach(function (el) {
      var raw = el.textContent.trim();
      if (!DATUM_VORM.test(raw)) return;

      var iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      /* Kale ISO-datums lokaal opbouwen voorkomt een dag verschil */
      var date = iso
        ? new Date(+iso[1], +iso[2] - 1, +iso[3])
        : new Date(raw);

      if (!isNaN(date.getTime())) el.textContent = date.toLocaleDateString('nl-NL', NL_DATUM);
    });

    /* ─── 5. Afbeeldingen ───
       Lazy loading is hier weggehaald: op dit moment heeft de browser de
       afbeeldingen al opgevraagd, dus het deed niets. Webflow zet
       loading="lazy" standaard op afbeeldingen. Zet de hero-afbeelding in
       de Designer op Eager. */
    qsa('img').forEach(function (img) {
      img.setAttribute('decoding', 'async');
    });

    /* ─── 6. Hero-tekst (.anim-line) ─── */
    qsa('.anim-line').forEach(function (el, i) {
      if (reduceMotion) { el.classList.add('visible'); return; }
      setTimeout(function () { el.classList.add('visible'); }, INTRO_DELAY * 1000 + i * 150);
    });

    /* ─── 7. Lenis smooth scroll ───
       Uit bij prefers-reduced-motion: dan scrolt de pagina native. */
    if (!reduceMotion && typeof Lenis !== 'undefined') {
      lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 0.7,
        gestureOrientation: 'vertical',
        syncTouch: false
      });
      window.lenis = lenis; /* handig voor debuggen in de console */

      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);

      /* Menu-overlay: Lenis laat wiel en aanraking daar met rust. Het menu
         scrolt dan zelf, en de pagina erachter beweegt niet mee. Dit werkt
         ook zonder dat er ergens een is-menu-open klasse gezet wordt. */
      qsa('.menu-overlay, .menu-panel').forEach(function (el) {
        el.setAttribute('data-lenis-prevent', '');
      });

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
    }

    /* ─── 9. Navbar verbergen bij scrollen ───
       Los van Lenis, dus het werkt ook als Lenis niet laadt. De timeout toont
       de navbar weer zodra je stopt met scrollen. Wil je hem verborgen houden
       tot je omhoog scrolt, haal dan het stopTimeout-blok weg.
       Bij prefers-reduced-motion blijft de navbar altijd zichtbaar. */
    if (navSection && !reduceMotion) {
      var stopTimeout;
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: function (self) {
          clearTimeout(stopTimeout);
          if (self.direction === 1 && self.scroll() > 10) navSection.classList.add('navbar--hidden');
          else if (self.direction === -1) navSection.classList.remove('navbar--hidden');
          stopTimeout = setTimeout(function () { navSection.classList.remove('navbar--hidden'); }, 300);
        }
      });
    }

    /* ─── 10. Video autoplay-fix (Safari iOS) ───
       Alleen video's die moeten autoplayen worden gemute. */
    qsa('video').forEach(function (video) {
      video.setAttribute('playsinline', '');
    });
    qsa('video[autoplay], video[data-autoplay]').forEach(function (video) {
      video.muted = true;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    });

    if (!reduceMotion) {

      /* ─── 11. Parallax (.parallax-img) ─── */
      var mm = gsap.matchMedia();
      var setupParallax = function (yRange) {
        gsap.utils.toArray('.parallax-img').forEach(function (img) {
          gsap.fromTo(img, { y: -yRange }, {
            y: yRange, ease: 'none',
            scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 1 }
          });
        });
      };
      mm.add('(min-width: 768px)', function () { setupParallax(150); });
      mm.add('(max-width: 767px)', function () { setupParallax(40); });

      /* ─── 12. Cards stagger reveal (.anim-stagger) ───
         startBij() zorgt dat ook secties onderaan de pagina nog afspelen. */
      gsap.utils.toArray('.anim-stagger').forEach(function (parent) {
        gsap.from(parent.children, {
          scrollTrigger: { trigger: parent, start: startBij(parent, 25) },
          opacity: 0, y: 36, duration: 1.5, stagger: 0.12, ease: 'power2.out'
        });
      });

      /* ─── 13. Stacked cards scroll (.sc-card) ─── */
      var stackedCards = qsa('.sc-card');
      stackedCards.forEach(function (card, i) {
        var next = stackedCards[i + 1];
        if (!next) return;
        var tl = gsap.timeline({
          scrollTrigger: { trigger: next, start: 'top 80%', end: 'top 30%', scrub: 1 }
        });
        tl.to(card, { scale: 0.95, ease: 'none' }, 0);
        var textEl = card.querySelector('.sc-card-text');
        if (textEl) tl.to(textEl, { backgroundColor: CARD_TEXT_ACTIVE, ease: 'none' }, 0);
      });

      /* ─── 14. Groene CTA-reveal (.anim-mask-section) ─── */
      gsap.utils.toArray('.anim-mask-section').forEach(function (el) {
        gsap.fromTo(el,
          { clipPath: 'inset(100% 0 0 0)', y: 100 },
          { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: startBij(el, 95), toggleActions: 'play none none none' }
          }
        );
      });
    }

    /* ─── 15. Posities herberekenen na het laden van de fonts ───
       SplitText verandert hoogtes; zonder refresh rekenen de triggers
       met verouderde start/end-waarden. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  });

  /* ═══════════════════════════════════════════════════════════
     16. Cookiebot
     ───────────────────────────────────────────────────────────
     De dialoog blijft tijdens de intro-overgang onzichtbaar via
     de klasse cfh-intro (zie transition.css). Er worden geen
     display-regels meer geforceerd, dus Cookiebot kan de dialoog
     en de underlay na een keuze gewoon zelf weghalen.

     Vangnet: na een keuze zorgen we dat scrollen nooit geblokkeerd
     blijft, en laten we Lenis de dialoog met rust.
     ═══════════════════════════════════════════════════════════ */
  function cookiebotDialoogKlaar() {
    var dialoog = document.getElementById('CybotCookiebotDialog');
    if (dialoog) dialoog.setAttribute('data-lenis-prevent', '');
  }
  function scrollVrijgeven() {
    if (lenis && lenis.isStopped) lenis.start();
  }
  window.addEventListener('CookiebotOnDialogInit', cookiebotDialoogKlaar);
  window.addEventListener('CookiebotOnDialogDisplay', cookiebotDialoogKlaar);
  ['CookiebotOnAccept', 'CookiebotOnDecline', 'CookiebotOnConsentReady'].forEach(function (naam) {
    window.addEventListener(naam, scrollVrijgeven);
  });

})();
