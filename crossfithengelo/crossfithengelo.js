/* ═══════════════════════════════════════════════════════════
   CROSSFIT HENGELO — hoofdscript
   Vereist in <head>: GSAP + ScrollTrigger + SplitText
   Vereist in footer, vóór dit bestand: Lenis CDN
   ═══════════════════════════════════════════════════════════ */

/* ─── Plugins één keer registreren ─────────────────────────── */
gsap.registerPlugin(ScrollTrigger, SplitText);

/* ─── Globale scope ────────────────────────────────────────── */
var navSection = document.querySelector('.nav_section');

/* ─── DOMContentLoaded ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {

  /* 1. Navbar kleurwissel op donkere secties */
  var navbarWrapper = document.querySelector('.navbar_component_wrapper');
  var darkSections  = document.querySelectorAll('.nav-dark-bg');
  if (navbarWrapper && darkSections.length) {
    darkSections.forEach(function (section) {
      ScrollTrigger.create({
        trigger: section, start: 'top top', end: 'bottom top',
        onEnter:     function () { navbarWrapper.classList.add('navbar--light'); },
        onLeave:     function () { navbarWrapper.classList.remove('navbar--light'); },
        onEnterBack: function () { navbarWrapper.classList.add('navbar--light'); },
        onLeaveBack: function () { navbarWrapper.classList.remove('navbar--light'); },
      });
    });
  }

  /* 2. Heading-animatie (.anim-heading) */
  setTimeout(function () {
    document.querySelectorAll('.anim-heading').forEach(function (heading) {
      var split = SplitText.create(heading, { type: 'lines', mask: 'lines' });
      gsap.set(heading, { opacity: 1 });
      gsap.from(split.lines, {
        clipPath: 'inset(0 100% 0 0)',
        duration: 1,
        stagger: 0.1,
        ease: 'power4.inOut'
      });
    });
  }, 500);

  /* 3. Line reveal ([data-line-reveal]) */
  document.querySelectorAll('[data-line-reveal]').forEach(function (el) {
    var split = new SplitText(el, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 60%', scrub: 1 },
      clipPath: 'inset(0 100% 0 0)',
      stagger: 0.15
    });
  });

  /* 4. Nederlandse datumnotatie */
  document.querySelectorAll('.cms-datum, .blog_date, .text-block').forEach(function (el) {
    var raw = el.textContent.trim();
    var date = new Date(raw);
    if (!isNaN(date)) {
      el.textContent = date.toLocaleDateString('nl-NL', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    }
  });
});

/* ─── Load ─────────────────────────────────────────────────── */
window.addEventListener('load', function () {

  /* 5. Hero-tekst (.anim-line) */
  setTimeout(function () {
    document.querySelectorAll('.anim-line').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('visible'); }, i * 150);
    });
  }, 100);

  /* 6. Lenis smooth scroll */
  var lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 0.7,
    gestureOrientation: 'vertical',
    normalizeWheel: false,
    smoothTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  /* 7. Lenis start/stop-controls */
  document.querySelectorAll('[data-lenis-start], [data-lenis-stop], [data-lenis-toggle]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (el.hasAttribute('data-lenis-start'))     lenis.start();
      else if (el.hasAttribute('data-lenis-stop')) lenis.stop();
      else {
        el.classList.toggle('stop-scroll');
        el.classList.contains('stop-scroll') ? lenis.stop() : lenis.start();
      }
    });
  });

  /* 8. Afbeeldingen optimaliseren */
  var isMobile = window.innerWidth <= 768;
  document.querySelectorAll('img').forEach(function (img) {
    if (img.getBoundingClientRect().top >= window.innerHeight) img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    if (isMobile) {
      var src = img.getAttribute('src');
      if (src && src.includes('webflow') && !src.includes('?'))
        img.setAttribute('src', src + '?w=800&q=70&auto=format,compress');
    }
  });

  /* 9. Video autoplay-fix (Safari iOS) */
  document.querySelectorAll('video').forEach(function (video) {
    video.setAttribute('playsinline', '');
    video.muted = true;
    video.load();
    video.play().catch(function () {});
  });

  /* 10. Parallax (.parallax-img) */
  var mm = gsap.matchMedia();
  var parallaxItems = gsap.utils.toArray('.parallax-img');
  function setupParallax(yRange) {
    parallaxItems.forEach(function (img) {
      gsap.fromTo(img, { y: -yRange }, {
        y: yRange, ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });
  }
  mm.add('(min-width: 768px)', function () { setupParallax(150); });
  mm.add('(max-width: 767px)', function () { setupParallax(40); });

  /* 11. Cards stagger reveal (.anim-stagger) */
  gsap.utils.toArray('.anim-stagger').forEach(function (parent) {
    gsap.from(parent.children, {
      scrollTrigger: { trigger: parent, start: 'top 25%' },
      opacity: 0, y: 36, duration: 1.5, stagger: 0.12, ease: 'power2.out'
    });
  });

  /* 12. Stacked cards scroll (.sc-card) */
  var stackedCards = document.querySelectorAll('.sc-card');
  if (stackedCards.length) {
    stackedCards.forEach(function (card, i) {
      if (i === stackedCards.length - 1) return;
      var textEl = card.querySelector('.sc-card-text');
      gsap.to(card, {
        scale: 0.95, ease: 'none',
        scrollTrigger: { trigger: stackedCards[i + 1], start: 'top 80%', end: 'top 30%', scrub: 1 }
      });
      if (textEl) {
        gsap.to(textEl, {
          backgroundColor: '#29421F', ease: 'none',
          scrollTrigger: { trigger: stackedCards[i + 1], start: 'top 80%', end: 'top 30%', scrub: 1 }
        });
      }
    });
  }

  /* 13. Navbar verbergen bij scrollen */
  var stopTimeout;
  lenis.on('scroll', function (e) {
    clearTimeout(stopTimeout);
    if (navSection) {
      if (e.direction === 1 && e.scroll > 10) navSection.classList.add('navbar--hidden');
      else if (e.direction === -1)            navSection.classList.remove('navbar--hidden');
      stopTimeout = setTimeout(function () { navSection.classList.remove('navbar--hidden'); }, 300);
    }
  });
});

/* ─── Kopieerbeveiliging op juridische pagina's ────────────── */
var beschermdePaginas = ['/algemene-voorwaarden', '/privacy-policy', '/cookiebeleid', '/huisregels'];
if (beschermdePaginas.some(function (pad) { return window.location.pathname.startsWith(pad); })) {
  document.documentElement.style.userSelect = 'none';
  document.addEventListener('copy', function (e) { e.preventDefault(); });
  document.addEventListener('cut', function (e) { e.preventDefault(); });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}

/* ─── Groene CTA-reveal (.anim-mask-section) ───────────────── */
gsap.fromTo('.anim-mask-section',
  { clipPath: 'inset(100% 0 0 0)', y: 100 },
  { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.anim-mask-section', start: 'top 95%', toggleActions: 'play none none none' }
  }
);

/* ─── Cookiebot tonen na 3s ────────────────────────────────── */
setTimeout(function () {
  var style = document.createElement('style');
  style.textContent = '#CybotCookiebotDialog, #CybotCookiebotDialogBodyUnderlay { display: revert !important; }';
  document.head.appendChild(style);
}, 3000);

/* ─── Promo-modal ──────────────────────────────────────────── */
(function () {
  var overlay = document.querySelector('.modal-overlay');
  var modal = document.querySelector('.modal-wrap');
  var closeBtn = document.querySelector('.modal-close');
  var triggered = false;
  if (!overlay || !modal) return;
  if (sessionStorage.getItem('modalShown')) return;
  overlay.style.transition = 'opacity 0.4s ease';
  modal.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.4)';
  function openModal() {
    if (triggered) return;
    triggered = true;
    sessionStorage.setItem('modalShown', 'true');
    overlay.style.opacity = '0';
    overlay.style.display = 'block';
    modal.style.opacity = '0';
    modal.style.display = 'block';
    modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(function () {
      overlay.style.opacity = '1';
      modal.style.opacity = '1';
      modal.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 20);
  }
  function closeModal() {
    overlay.style.opacity = '0';
    modal.style.opacity = '0';
    modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(function () {
      overlay.style.display = 'none';
      modal.style.display = 'none';
    }, 400);
  }
  window.addEventListener('scroll', function () {
    if (window.scrollY >= 700) openModal();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
})();
