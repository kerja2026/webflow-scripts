/* ═══════════════════════════════════════════════════════════
   CROSSFIT HENGELO — Home-pagina
   Alleen op de homepage laden (page footer), NIET site-breed.
   Vereist: GSAP + ScrollTrigger (site-breed in <head> geladen).
   Let op: video-autoplay staat al in crossfithengelo.js.
   Bij prefers-reduced-motion beweegt er niets. De tekst, de marquee en
   de proefles-knop blijven gewoon zichtbaar.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var hasGsap = typeof gsap !== 'undefined';
  var hasScrollTrigger = typeof ScrollTrigger !== 'undefined';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Zelfde wachttijd als in crossfithengelo.js: eerst het overgangs-overlay. */
  var INTRO_DELAY = 0.7;

  var ready = function (fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  };
  var debounce = function (fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  };

  /* ─── Hero text mask ───────────────────────────────────────── */
  ready(function () {
    if (!hasGsap || reduceMotion) return;
    var lines = document.querySelectorAll('.line-mask .line-inner');
    if (!lines.length) return;
    gsap.from(lines, {
      clipPath: 'inset(0 100% 0 0)',
      duration: 1,
      stagger: 0.2,
      ease: 'power4.inOut',
      delay: INTRO_DELAY
    });
  });

  /* ─── Marquee ──────────────────────────────────────────────── */
  ready(function () {
    var wrapper = document.querySelector('.scrolling-text-wrapper');
    var original = document.querySelector('.scrolling-text');
    if (!wrapper || !original) return;

    var itemWidth = 0;

    /* Kopieën maken we één keer, direct bij het laden. Dat moet vóór de
       Webflow-interacties starten: daarna kopieer je ook hun tijdelijke
       beginstaat (bijvoorbeeld opacity 0), en blijven de kopieën onzichtbaar.
       Daarom nooit opnieuw kopiëren, alleen opnieuw meten.
       We maken genoeg kopieën voor het breedste scherm van dit apparaat.
       Kopieën zijn verborgen voor schermlezers. */
    function measure() {
      itemWidth = original.getBoundingClientRect().width;
    }

    measure();
    if (itemWidth) {
      var breedste = Math.max(window.innerWidth, window.screen.width || 0, window.screen.height || 0);
      var copies = Math.max(1, Math.ceil(breedste / itemWidth)) + 1;
      for (var i = 0; i < copies; i++) {
        var clone = original.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('data-marquee-clone', '');
        wrapper.appendChild(clone);
      }
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('load', measure);
    window.addEventListener('resize', debounce(measure, 150));

    /* Reduced motion: statische band, geen beweging */
    if (reduceMotion || !hasGsap) return;

    var xPos = 0;
    var currentSpeed = 0;
    var baseSpeed = -1.5;      /* px per frame bij 60 fps */
    var targetSpeed = baseSpeed;
    var inView = true;
    var setX = gsap.quickSetter(wrapper, 'x', 'px');

    /* Scrollsnelheid stuurt de marquee */
    if (hasScrollTrigger) {
      ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: function (self) {
          targetSpeed = gsap.utils.clamp(-30, 30, self.getVelocity() * -0.04);
        }
      });
    }

    /* Niet rekenen als de band buiten beeld staat */
    var section = wrapper.closest('.scrolling_text_section') || wrapper;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
      }).observe(section);
    }

    /* Snelheid per tijd, niet per frame: gelijk op 60 en 120 Hz schermen */
    gsap.ticker.add(function (time, deltaTime) {
      if (!inView || !itemWidth) return;
      var f = Math.min(deltaTime, 100) / 16.667;
      currentSpeed += (targetSpeed - currentSpeed) * (1 - Math.pow(1 - 0.08, f));
      targetSpeed += (baseSpeed - targetSpeed) * (1 - Math.pow(1 - 0.03, f));
      xPos += currentSpeed * f;
      if (xPos <= -itemWidth) xPos += itemWidth;
      if (xPos >= 0) xPos -= itemWidth;
      setX(xPos);
    });
  });

  /* ─── Zwevende proefles-knop ───────────────────────────────────
     Positie, maat en fade-in staan in crossfithengelo.css. Dit script
     voegt alleen beweging toe met transform (geen layout per frame).
     Zonder dit script staat de knop er nog steeds. */
  ready(function () {
    var btn = document.getElementById('proefles-btn');
    if (!btn || reduceMotion) return;

    var img = btn.querySelector('img');

    var FLOAT_RANGE      = 10;
    var FLOAT_SPEED      = 0.001;
    var TILT_RANGE       = 12;
    var TILT_SPEED       = 0.001;
    var SCROLL_INFLUENCE = 40;
    var ATTRACT_RADIUS   = 700;
    var ATTRACT_STRENGTH = 0.5;

    var restCX = 0, restCY = 0, btnTop = 0, btnHeight = 0;
    var lastTx = 0, lastTy = 0;

    var offY = 0;              /* verticale afstand tot de ruststand */
    var entered = false;
    var startTime = null;
    var lastTime = null;
    var targetShift = 0;
    var currentShift = 0;
    var lastScrollY = window.scrollY;
    var mouseX = -1000;
    var mouseY = -1000;
    var currentAttractX = 0;
    var currentAttractY = 0;

    /* Het echte midden van de knop, ook na resize of rotatie.
       De huidige transform rekenen we eruit. */
    function measure() {
      var r = btn.getBoundingClientRect();
      restCX = r.left + r.width / 2 - lastTx;
      restCY = r.top + r.height / 2 - lastTy;
      btnTop = r.top - lastTy;
      btnHeight = r.height;
    }

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    window.addEventListener('scroll', function () {
      var delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      if (!entered) return;
      targetShift += delta * 0.4;
      targetShift = Math.max(-SCROLL_INFLUENCE, Math.min(SCROLL_INFLUENCE, targetShift));
    }, { passive: true });

    window.addEventListener('resize', debounce(measure, 150));

    function loop(timestamp) {
      if (startTime === null) { startTime = timestamp; lastTime = timestamp; }
      var dt = Math.min(timestamp - lastTime, 100);
      lastTime = timestamp;
      var f = dt / 16.667;   /* 1 bij 60 fps */

      var t = timestamp - startTime;
      var floatOffset = Math.sin(t * FLOAT_SPEED) * FLOAT_RANGE;
      var tiltAngle   = Math.sin(t * TILT_SPEED)  * TILT_RANGE;

      if (!entered) {
        offY += (0 - offY) * (1 - Math.pow(1 - 0.07, f));
        if (Math.abs(offY) < 0.5) {
          offY = 0;
          entered = true;
        }
      } else {
        /* Scroll shift */
        currentShift += (targetShift - currentShift) * (1 - Math.pow(1 - 0.04, f));
        targetShift  *= Math.pow(0.92, f);
        offY = currentShift;

        /* Cursor aantrekking, gemeten vanaf het echte midden van de knop */
        var dx = mouseX - restCX;
        var dy = mouseY - (restCY + offY + floatOffset);
        var dist = Math.sqrt(dx * dx + dy * dy);
        var attractX = 0;
        var attractY = 0;
        if (dist < ATTRACT_RADIUS) {
          var strength = (1 - dist / ATTRACT_RADIUS) * ATTRACT_STRENGTH;
          attractX = dx * strength;
          attractY = dy * strength;
        }
        var k = 1 - Math.pow(1 - 0.04, f);
        currentAttractX += (attractX - currentAttractX) * k;
        currentAttractY += (attractY - currentAttractY) * k;
      }

      lastTx = currentAttractX;
      lastTy = offY + floatOffset + currentAttractY;
      btn.style.transform = 'translate3d(' + lastTx + 'px,' + lastTy + 'px,0)';
      if (img) img.style.transform = 'rotate(' + tiltAngle + 'deg)';
      requestAnimationFrame(loop);
    }

    /* Zelfde start als voorheen: 1,5 s na het laden, tegelijk met de fade-in */
    setTimeout(function () {
      measure();
      offY = -(btnTop + btnHeight + 20);   /* net boven het scherm */
      requestAnimationFrame(loop);
    }, 1500);
  });
})();
