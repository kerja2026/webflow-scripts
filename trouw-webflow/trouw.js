/* =============================================================
   PRAKTIJK TROUW — SCRIPT
   Smooth scroll, scrollbalk, header, mobiel menu, paginatransitie,
   intro, specialisaties, schuivende secties, achtergrond, parallax
   en footer. Geladen met defer, na GSAP, ScrollTrigger, SplitText
   en Lenis.
   ============================================================= */
(function () {
  'use strict';
  var html = document.documentElement;

  if (!window.gsap || !window.ScrollTrigger) {
    html.classList.remove('js-anim', 'is-transitioning');
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lenis = null;
  var header = document.querySelector('.header');
  var exists = function (sel) { return document.querySelector(sel) !== null; };

  var stuckHeight = function () {
    if (!header) return 0;
    return header.offsetHeight + parseFloat(getComputedStyle(header).top || 0);
  };

  var scrollToHash = function (hash) {
    var target = hash && hash.length > 1 ? document.querySelector(hash) : null;
    if (!target) return false;
    if (lenis) lenis.scrollTo(target, { offset: -stuckHeight() });
    else target.scrollIntoView();
    return true;
  };

  /* ---------- 1. LENIS SMOOTH SCROLL ---------- */
  if (window.Lenis && !reduced) {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- 2. EIGEN SCROLLBALK ---------- */
  var BAR = { hold: 800, min: 40 };

  var bar = document.createElement('div');
  bar.className = 'scrollbar';
  var thumb = document.createElement('div');
  thumb.className = 'scrollbar__thumb';
  bar.appendChild(thumb);
  document.body.appendChild(bar);

  var barTimer = null;

  var drawBar = function (y) {
    var doc = document.documentElement.scrollHeight;
    var view = window.innerHeight;
    if (doc <= view + 4) { bar.classList.remove('is-visible'); return; }

    var track = bar.clientHeight;
    var size = Math.max(BAR.min, track * (view / doc));
    var max = doc - view;
    var progress = Math.min(1, Math.max(0, y / max));

    thumb.style.height = size + 'px';
    thumb.style.transform = 'translateY(' + (progress * (track - size)) + 'px)';

    bar.classList.add('is-visible');
    clearTimeout(barTimer);
    barTimer = setTimeout(function () { bar.classList.remove('is-visible'); }, BAR.hold);
  };

  /* ---------- 3. STICKY HEADER ---------- */
  if (header) {
    var THRESHOLD = 30;
    var TOLERANCE = 6;
    var lastY = window.scrollY;

    var update = function (y) {
      header.classList.toggle('is-stuck', y > THRESHOLD);
      if (y <= 1) {
        header.classList.remove('is-up');
        lastY = y;
        return;
      }
      var delta = y - lastY;
      if (Math.abs(delta) < TOLERANCE) return;
      header.classList.toggle('is-up', delta < 0);
      lastY = y;
    };

    if (lenis) lenis.on('scroll', function (e) { update(e.scroll); drawBar(e.scroll); });
    else window.addEventListener('scroll', function () { update(window.scrollY); drawBar(window.scrollY); }, { passive: true });
    update(window.scrollY);
  } else if (lenis) {
    lenis.on('scroll', function (e) { drawBar(e.scroll); });
  } else {
    window.addEventListener('scroll', function () { drawBar(window.scrollY); }, { passive: true });
  }

  /* ---------- 4. MOBIEL MENU ---------- */
  var MENU = { duration: 0.7, ease: 'power2.inOut', shift: 20 };

  var menu = document.querySelector('.menu');
  var panel = menu ? menu.querySelector('.menu__panel') : null;
  var scrim = menu ? menu.querySelector('.menu__scrim') : null;
  var menuOpen = false;

  var openMenu = function () {
    if (!menu || menuOpen) return;
    menuOpen = true;
    menu.classList.add('is-open');
    html.classList.add('menu-open');
    if (lenis) lenis.stop();

    gsap.set(menu, { '--p': 0 });
    gsap.to(scrim, { opacity: 1, duration: MENU.duration * .6, ease: 'none' });
    gsap.fromTo(panel, { x: -MENU.shift }, { x: 0, duration: MENU.duration, ease: MENU.ease });
    gsap.to(menu, { '--p': 1, duration: MENU.duration, ease: MENU.ease });
  };

  var closeMenu = function () {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    gsap.to(scrim, { opacity: 0, duration: MENU.duration * .6, ease: 'none' });
    gsap.to(panel, { x: -MENU.shift, duration: MENU.duration, ease: MENU.ease });
    gsap.to(menu, {
      '--p': 0,
      duration: MENU.duration,
      ease: MENU.ease,
      onComplete: function () {
        menu.classList.remove('is-open');
        html.classList.remove('menu-open');
        if (lenis) lenis.start();
      }
    });
  };

  document.addEventListener('click', function (e) {
    if (e.target.closest('.nav__toggle')) { e.preventDefault(); openMenu(); return; }
    if (e.target.closest('.menu__close') || e.target.closest('.menu__scrim')) { e.preventDefault(); closeMenu(); return; }
    if (menuOpen && e.target.closest('.menu__link')) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- 5. PAGINATRANSITIE ---------- */
  var KEY = 'trouw-transition';
  var overlay = document.querySelector('.transition');
  var cols = overlay ? gsap.utils.toArray('.transition__col') : [];
  var pageWrap = document.querySelector('.l-page');
  var busy = false;

  var TR = {
    inDuration: 0.8,
    outDuration: 0.8,
    ease: 'power2.inOut',
    shift: 20,
    maxWait: 2500
  };

  var leave = function (url) {
    if (busy) return;
    busy = true;
    if (lenis) lenis.stop();
    overlay.style.pointerEvents = 'auto';

    if (pageWrap && !reduced) {
      gsap.to(pageWrap, { x: TR.shift, duration: TR.inDuration, ease: TR.ease });
    }

    gsap.set(cols, { '--p': 0 });
    gsap.to(cols, {
      '--p': 1,
      duration: TR.inDuration,
      ease: TR.ease,
      onComplete: function () {
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
        window.location.href = url;
      }
    });
  };

  var arrive = function () {
    return new Promise(function (resolve) {
      if (!overlay || !html.classList.contains('is-transitioning')) { resolve(); return; }
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      gsap.set(cols, { '--p': 1 });
      html.classList.remove('is-transitioning');
      overlay.style.pointerEvents = 'none';

      if (pageWrap && !reduced) {
        gsap.fromTo(pageWrap,
          { x: -TR.shift },
          { x: 0, duration: TR.outDuration, ease: TR.ease, clearProps: 'transform' }
        );
      }

      gsap.to(cols, {
        '--p': 2,
        duration: TR.outDuration,
        ease: TR.ease,
        onComplete: resolve
      });
    });
  };

  var pageReady = new Promise(function (resolve) {
    if (document.readyState === 'complete') { resolve(); return; }
    window.addEventListener('load', resolve, { once: true });
    setTimeout(resolve, TR.maxWait);
  });

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href === '#') return;

    var url = new URL(a.href, location.href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (url.origin !== location.origin) return;

    if (url.pathname === location.pathname && url.search === location.search) {
      e.preventDefault();
      if (url.hash) { scrollToHash(url.hash); return; }
      if (lenis) lenis.scrollTo(0); else window.scrollTo(0, 0);
      return;
    }

    if (!overlay || reduced || a.hasAttribute('data-no-transition')) return;
    e.preventDefault();
    leave(url.href);
  });

  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    busy = false;
    html.classList.remove('is-transitioning', 'menu-open');
    if (overlay) overlay.style.pointerEvents = 'none';
    gsap.set(cols, { '--p': 0 });
    if (pageWrap) gsap.set(pageWrap, { clearProps: 'transform' });
    if (lenis) lenis.start();
  });

  /* ---------- 6. INTRO ---------- */
  var comingIn = html.classList.contains('is-transitioning');
  var gate = comingIn ? pageReady.then(arrive) : Promise.resolve();

  gate.then(function () { return document.fonts.ready; }).then(function () {
    if (reduced) return;

    if (location.hash) scrollToHash(location.hash);

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.topbar', { opacity: 1, duration: .6 })
      .to('.nav',    { opacity: 1, duration: .6 }, '-=.45');

    if (exists('.eyebrow')) tl.to('.eyebrow', { opacity: 1, duration: .6 }, '-=.3');

    var title = document.querySelector('h1');
    if (!title) return;

    var SLACK = 0.2;
    var split = new SplitText(title, { type: 'words', mask: 'words' });
    split.words.forEach(function (word) {
      word.style.paddingBottom = SLACK + 'em';
      var mask = word.parentNode;
      if (mask && mask !== title) {
        mask.style.marginBottom = '-' + SLACK + 'em';
        mask.style.verticalAlign = 'top';
      }
    });
    gsap.set(title, { visibility: 'visible' });

    tl.from(split.words, { yPercent: 110, opacity: 0, duration: 1, stagger: 0.06 }, '-=.3');

    if (exists('.hero__media')) tl.to('.hero__media', { opacity: 1, duration: 1.1, ease: 'power2.out' }, '-=.7');
    if (exists('h1 + p'))       tl.to('h1 + p',       { opacity: 1, duration: .8 }, '-=.6');
  });

  /* ---------- 7. SPECIALISATIES ----------
     Vanaf 768px: .spec ligt vast (sticky in het Style-panel) binnen
     .spec__track. De foto's schuiven van onderaf over elkaar, en
     nummer, titel, tekst en knop schuiven door een eigen onzichtbaar
     kader. LET OP: de Gap van .spec__text en .spec__text.is-active
     moet gelijk zijn, anders verspringt de tekst.

     Op mobiel staat .spec-m: vijf kaarten gewoon onder elkaar. Elke
     kaart komt iets lager binnen en schuift tijdens het scrollen naar
     zijn plek. Geen overlap.
     mobileShift = hoeveel lager een kaart binnenkomt
     mobileEnd   = waar in het scherm hij op zijn plek ligt */
  var SPEC = {
    cardEase: 'power2.out',
    duration: 0.8,
    each: 0.05,
    ease: 'power2.inOut',
    mobileShift: '3em',
    mobileEnd: 'top 70%'
  };

  var specMobile = window.matchMedia('(max-width: 767px)').matches;

  /* --- mobiel --- */
  if (specMobile && !reduced) {
    gsap.utils.toArray('.spec-m__card').forEach(function (card) {
      gsap.fromTo(card,
        { y: SPEC.mobileShift },
        {
          y: '0em',
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            end: SPEC.mobileEnd,
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );
    });
  }

  /* --- vanaf 768px --- */
  var specTrack = document.querySelector('.spec__track');
  var spec = document.querySelector('.spec');
  if (!specMobile && specTrack && spec && !reduced) {
    var specCards = gsap.utils.toArray('.spec__card');
    var specTexts = gsap.utils.toArray('.spec__text');
    var specSteps = specCards.length - 1;

    var stickTop = function () { return parseFloat(getComputedStyle(spec).top) || 0; };

    var current = 0;
    var MASK_SLACK = 0.18;
    var parts = specTexts.map(function (block) {
      return Array.prototype.slice.call(block.children).map(function (child) {
        var mask = document.createElement('div');
        mask.style.overflow = 'hidden';
        mask.style.paddingBottom = MASK_SLACK + 'em';
        mask.style.marginBottom = '-' + MASK_SLACK + 'em';
        block.insertBefore(mask, child);
        mask.appendChild(child);
        return child;
      });
    });

    var place = function (k) { return k === current ? 0 : (k < current ? -110 : 110); };

    var markActive = function (next) {
      specTexts.forEach(function (block, k) {
        block.classList.toggle('is-active', k === next);
        block.style.pointerEvents = k === next ? 'auto' : 'none';
      });
    };

    specTexts.forEach(function (block, k) {
      block.style.transition = 'none';
      gsap.set(block, { autoAlpha: 1 });
      gsap.set(parts[k], { yPercent: place(k) });
    });
    markActive(current);

    var showText = function (next) {
      if (next === current) return;
      var down = next > current;
      current = next;

      specTexts.forEach(function (block, k) {
        var target = place(k);
        var moving = parts[k].some(function (p) {
          return Math.abs(gsap.getProperty(p, 'yPercent') - target) > 0.5;
        });
        if (moving) {
          var list = down ? parts[k] : parts[k].slice().reverse();
          gsap.to(list, {
            yPercent: target,
            duration: SPEC.duration,
            ease: SPEC.ease,
            stagger: SPEC.each,
            overwrite: 'auto'
          });
        }
      });
      markActive(next);
    };

    if (specSteps > 0) {
      gsap.set(specCards.slice(1), { autoAlpha: 0 });

      var specTl = gsap.timeline({
        scrollTrigger: {
          trigger: specTrack,
          start: function () { return 'top ' + stickTop() + 'px'; },
          end: function () { return 'bottom ' + (stickTop() + spec.offsetHeight) + 'px'; },
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            showText(Math.min(specTexts.length - 1, Math.round(self.progress * specSteps)));
          }
        }
      });

      specCards.slice(1).forEach(function (card) {
        specTl.fromTo(card,
          { y: function () { return window.innerHeight; } },
          { y: 0, ease: SPEC.cardEase, duration: 1, immediateRender: true }
        );
        specTl.set(card, { autoAlpha: 1 }, '<');
      });
    }
  }

  /* ---------- 8. SECTIES SCHUIVEN OVER ELKAAR ----------
     Een nieuwe sectie laten meedoen: zet hem in deze lijst, in de
     lijst in trouw.css, en geef hem margin-top -7.25em (op mobiel
     -1.25em) in het Style-panel. Alleen vanaf 768px. */
  var SLIDE = {
    shift: '6em',
    sections: '.s-intro, .s-praktijk, .s-team, .s-feature, .s-contract, .s-rates, .s-legal, .s-contact',
    start: 'top bottom',
    end: 'top 40%'
  };

  if (!reduced) {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', function () {
      gsap.utils.toArray(SLIDE.sections).forEach(function (section) {
        gsap.fromTo(section,
          { y: SLIDE.shift },
          {
            y: '0em',
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: SLIDE.start,
              end: SLIDE.end,
              scrub: true,
              invalidateOnRefresh: true
            }
          }
        );
      });
    });
  }

  /* ---------- 9. BEWEGENDE ACHTERGROND, PER SECTIE ----------
     Elke .bg__stripes wordt opgedeeld in kolommen die verschuiven en
     draaien terwijl hun eigen sectie door beeld scrolt. Waar de
     kolommen beginnen, komt uit Background position in het
     Style-panel. Elke orb (.bg__blob en .bg__orb) zakt en groeit
     licht mee. */
  var BG = {
    columns: 8,
    travel: 33.3,
    turn: 45,
    orbShift: 12,
    orbScale: 1.12
  };

  var sectionOf = function (el) { return el.closest('section') || el.parentElement; };

  if (!reduced) {
    gsap.utils.toArray('.bg__stripes').forEach(function (stripes) {
      var cs = getComputedStyle(stripes);
      var gradient = cs.backgroundImage;
      if (!gradient || gradient === 'none') return;
      var startX = (cs.backgroundPositionX || '0px').split(',')[0].trim();

      gradient = gradient.replace(
        /linear-gradient\(\s*(-?[\d.]+deg)\s*,/,
        'linear-gradient(calc($1 + var(--bg-turn, 0deg)),'
      );

      var wrap = document.createElement('div');
      wrap.className = 'bg__cols';
      wrap.style.left = 'calc(' + startX + ' - var(--col))';
      var grads = [];
      for (var i = 0; i < BG.columns; i++) {
        var col = document.createElement('div');
        col.className = 'bg__col';
        var grad = document.createElement('div');
        grad.className = 'bg__grad';
        grad.style.backgroundImage = gradient;
        col.appendChild(grad);
        wrap.appendChild(col);
        grads.push(grad);
      }

      stripes.style.backgroundImage = 'none';
      stripes.appendChild(wrap);
      gsap.set(stripes, { '--bg-turn': '0deg' });

      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sectionOf(stripes),
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      })
        .to(grads, { xPercent: BG.travel }, 0)
        .to(stripes, { '--bg-turn': BG.turn + 'deg' }, 0);
    });

    gsap.utils.toArray('.bg__blob, .bg__orb').forEach(function (blob) {
      gsap.fromTo(blob,
        { yPercent: -BG.orbShift, scale: 1 },
        {
          yPercent: BG.orbShift,
          scale: BG.orbScale,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionOf(blob),
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );
    });
  }

  /* ---------- 10. PARALLAX OP BEELDEN ---------- */
  var PX = {
    shift: 4,
    zoom: 1.1,
    frames: '.hero__media, .steps__media, .feature__media, .contract__media'
  };

  if (!reduced) {
    gsap.utils.toArray(PX.frames).forEach(function (frame) {
      var img = frame.querySelector('img');
      if (!img) return;

      gsap.fromTo(img,
        { yPercent: -PX.shift, scale: PX.zoom },
        {
          yPercent: PX.shift,
          scale: PX.zoom,
          ease: 'none',
          scrollTrigger: {
            trigger: frame,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );
    });
  }

  /* ---------- 11. FOOTER ----------
     De footer (.ft) ligt vast onderin het scherm. De pagina krijgt
     onderaan net zoveel ruimte als de footer hoog is. Alleen de
     inhoud van de footer schuift licht mee. */
  var FOOTER = { shift: 20 };

  var siteFooter = document.querySelector('.ft');
  var footerInner = siteFooter ? siteFooter.querySelector('.l-container') : null;

  var fitFooter = function () {
    if (!pageWrap || !siteFooter) return;
    pageWrap.style.marginBottom = siteFooter.offsetHeight + 'px';
  };

  if (pageWrap && siteFooter) {
    fitFooter();
    window.addEventListener('load', function () { fitFooter(); ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { fitFooter(); ScrollTrigger.refresh(); });
    }

    if (!reduced && footerInner) {
      gsap.fromTo(footerInner,
        { yPercent: FOOTER.shift },
        {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: pageWrap,
            start: 'bottom bottom',
            end: function () { return '+=' + siteFooter.offsetHeight; },
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );
    }
  }

  /* ---------- 12. RESIZE ---------- */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      fitFooter();
      ScrollTrigger.refresh();
    }, 200);
  });
})();
