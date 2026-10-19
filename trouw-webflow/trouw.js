/* =============================================================
   PRAKTIJK TROUW — SCRIPTt
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
  var header = document.querySelector('.navbar_component');
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

  var menu = document.querySelector('.mobile-menu_component');
  var panel = menu ? menu.querySelector('.mobile-menu_panel') : null;
  var scrim = menu ? menu.querySelector('.mobile-menu_scrim') : null;
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
    if (e.target.closest('.navbar_toggle')) { e.preventDefault(); openMenu(); return; }
    if (e.target.closest('.mobile-menu_close') || e.target.closest('.mobile-menu_scrim')) { e.preventDefault(); closeMenu(); return; }
    if (menuOpen && e.target.closest('.mobile-menu_link')) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- 4b. SPECIALISATIES-MENU ----------
     Een klik op "Specialisaties" (.navbar_link.is-mega) opent het paneel
     .mega-menu_component in de header. De opbouw gaat in vaste volgorde, met een
     kleine overlap zodat het geheel rond de 1,5 seconde blijft:

       1. Het beige kader rond de menulinks groeit vanuit zijn midden uit
          tot het volle paneel, en blijft daarbij beige.
          (Het groeien is een clip-path op het paneel.)
       2. De specialisaties verschijnen kort na elkaar: elke kaart hangt
          aan zijn bovenrand en kantelt subtiel omlaag tot hij recht staat.
       3. Het paneel verkleurt van beige naar groen: de beige laag
          .mega-menu_beige vervaagt, en de tekst op de kaarten gaat mee van
          donker naar licht (.is-mega-green op de header, kleuren in
          trouw.css).
       4. Logo, menulinks, contactregel en knop verkleuren naar licht
          (.is-mega-light op de header, kleuren in trouw.css).

     Sluiten gaat precies omgekeerd. Sluiten kan door opnieuw te
     klikken, buiten het paneel of op de waas te klikken, met Escape,
     of door het venster te verkleinen.

     Zolang het paneel open is, staat de pagina op slot (.mega-open,
     alleen op html: op body zou de sticky header wegspringen) en ligt
     er een waas over de pagina (.mega-menu_scrim, kleur in het
     Style-panel). Alleen vanaf 992px, waar het menu zichtbaar is.

     Tijden in seconden, vanaf de klik:
     grow    = duur van het uitgroeien
     cardsAt = start van de kaarten, each = vertraging per kaart
     tilt    = hoeveel graden een kaart begint gekanteld, perspective = diepte
     greenAt = start van beige naar groen, green = duur daarvan
     lightAt = start van logo, links en knop naar licht
               (de duur daarvan, .4s, staat in trouw.css)
     radius  = afronding van het kader, round = afronding van het paneel */
  var MEGA = {
    grow: 0.5, cardsAt: 0.35, cards: 0.6, each: 0.06, tilt: 20, perspective: 1000,
    greenAt: 0.75, green: 0.5, lightAt: 1.1,
    easeOpen: 'expo.out', easeClose: 'power3.inOut',
    radius: 0.9375, round: 0.5
  };

  var mega = document.querySelector('.mega-menu_component');
  var megaTrigger = document.querySelector('.navbar_link.is-mega');
  var navMenu = document.querySelector('.navbar_menu');
  var megaScrim = document.querySelector('.mega-menu_scrim');
  var megaOpen = false;
  var closeMega = function () {};

  if (mega && megaTrigger && navMenu && header) {
    var megaCards = gsap.utils.toArray(mega.querySelectorAll('.mega-menu_card'));
    var megaBeige = mega.querySelector('.mega-menu_beige');
    var megaTl = null;
    var emPx = function (n) { return n * parseFloat(getComputedStyle(mega).fontSize); };
    var at = function (n) { return reduced ? 0 : n; };

    var closedClip = function () {
      var p = mega.getBoundingClientRect();
      var r = navMenu.getBoundingClientRect();
      var rad = emPx(MEGA.radius);
      return 'inset(' + (r.top - p.top) + 'px ' + (p.right - r.right) + 'px ' +
        (p.bottom - r.bottom) + 'px ' + (r.left - p.left) + 'px round ' +
        rad + 'px ' + rad + 'px ' + rad + 'px ' + rad + 'px)';
    };
    var openClip = function () {
      var b = emPx(MEGA.round);
      return 'inset(0px 0px 0px 0px round ' + b + 'px ' + b + 'px ' + b + 'px ' + b + 'px)';
    };
    var setClass = function (name, on) { header.classList.toggle(name, on); };

    megaTrigger.setAttribute('aria-expanded', 'false');

    var openMega = function () {
      if (megaOpen) return;
      megaOpen = true;
      megaTrigger.setAttribute('aria-expanded', 'true');
      if (megaTl) megaTl.kill();

      mega.style.display = 'block';
      gsap.set(mega, { clipPath: closedClip() });
      if (megaBeige) gsap.set(megaBeige, { autoAlpha: 1 });
      gsap.set(megaCards, { autoAlpha: 0, rotationX: -MEGA.tilt, transformOrigin: '50% 0%', transformPerspective: MEGA.perspective });
      setClass('is-mega', true);
      html.classList.add('mega-open');
      if (lenis) lenis.stop();
      if (megaScrim) { megaScrim.style.display = 'block'; gsap.set(megaScrim, { autoAlpha: 0 }); }

      megaTl = gsap.timeline();
      /* 1. uitgroeien, nog beige */
      megaTl.to(mega, { clipPath: openClip(), duration: at(MEGA.grow), ease: MEGA.easeOpen }, 0);
      if (megaScrim) megaTl.to(megaScrim, { autoAlpha: 1, duration: at(MEGA.grow), ease: 'power2.out' }, 0);
      /* 2. de specialisaties */
      megaTl.to(megaCards, { autoAlpha: 1, rotationX: 0, duration: at(MEGA.cards), ease: 'power3.out', stagger: at(MEGA.each) }, at(MEGA.cardsAt));
      /* 3. van beige naar groen, tekst op de kaarten mee naar licht */
      if (megaBeige) megaTl.to(megaBeige, { autoAlpha: 0, duration: at(MEGA.green), ease: 'power1.inOut' }, at(MEGA.greenAt));
      megaTl.call(function () { setClass('is-mega-green', true); }, null, at(MEGA.greenAt));
      /* 4. logo, links, contactregel en knop naar licht */
      megaTl.call(function () { setClass('is-mega-light', true); }, null, at(MEGA.lightAt));
    };

    closeMega = function () {
      if (!megaOpen) return;
      megaOpen = false;
      megaTrigger.setAttribute('aria-expanded', 'false');
      if (megaTl) megaTl.kill();

      megaTl = gsap.timeline({
        onComplete: function () {
          mega.style.display = 'none';
          if (megaScrim) megaScrim.style.display = 'none';
          setClass('is-mega', false);
          html.classList.remove('mega-open');
          if (lenis) lenis.start();
        }
      });
      /* omgekeerd: 4. eerst logo, links en knop terug naar donker */
      megaTl.call(function () { setClass('is-mega-light', false); }, null, 0);
      /* 3. groen terug naar beige */
      megaTl.call(function () { setClass('is-mega-green', false); }, null, at(0.25));
      if (megaBeige) megaTl.to(megaBeige, { autoAlpha: 1, duration: at(0.4), ease: 'power1.inOut' }, at(0.25));
      /* 2. kaarten weg */
      megaTl.to(megaCards.slice().reverse(), { autoAlpha: 0, rotationX: -MEGA.tilt * 0.6, duration: at(0.25), ease: 'power2.in', stagger: at(0.03) }, at(0.5));
      /* 1. krimpen naar het kader */
      megaTl.to(mega, { clipPath: closedClip(), duration: at(0.45), ease: MEGA.easeClose }, at(0.75));
      if (megaScrim) megaTl.to(megaScrim, { autoAlpha: 0, duration: at(0.45), ease: 'power2.inOut' }, at(0.75));
    };

    /* In de capture-fase, zodat de paginatransitie de klik op
       "Specialisaties" niet als paginawissel oppakt. */
    document.addEventListener('click', function (e) {
      if (e.target.closest('.navbar_link.is-mega')) {
        if (getComputedStyle(navMenu).display === 'none') return;
        e.preventDefault();
        e.stopPropagation();
        if (megaOpen) closeMega(); else openMega();
        return;
      }
      if (megaOpen && !e.target.closest('.mega-menu_component')) closeMega();
    }, true);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMega();
    });
  }

  /* ---------- 5. PAGINATRANSITIE ---------- */
  var KEY = 'trouw-transition';
  var overlay = document.querySelector('.transition_component');
  var cols = overlay ? gsap.utils.toArray('.transition_column') : [];
  var pageWrap = document.querySelector('.page-wrapper');
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
    tl.to('.navbar_topbar', { opacity: 1, duration: .6 })
      .to('.navbar_container',    { opacity: 1, duration: .6 }, '-=.45');

    if (exists('.eyebrow_wrapper')) tl.to('.eyebrow_wrapper', { opacity: 1, duration: .6 }, '-=.3');

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

    if (exists('.home-hero_media')) tl.to('.home-hero_media', { opacity: 1, duration: 1.1, ease: 'power2.out' }, '-=.7');
    if (exists('h1 + p'))       tl.to('h1 + p',       { opacity: 1, duration: .8 }, '-=.6');
  });

  /* ---------- 7. SPECIALISATIES ----------
     Vanaf 768px: .spec_component ligt vast (sticky in het Style-panel) binnen
     .spec_track. De foto's schuiven van onderaf over elkaar, en
     nummer, titel, tekst en knop schuiven door een eigen onzichtbaar
     kader. LET OP: de Gap van .spec_text en .spec_text.is-active
     moet gelijk zijn, anders verspringt de tekst.

     Op mobiel staat .spec-mobile_component: vijf kaarten gewoon onder elkaar. Elke
     kaart komt iets lager binnen en schuift tijdens het scrollen naar
     zijn plek. Geen overlap.
     mobileShift = hoeveel lager een kaart binnenkomt
     mobileEnd   = waar in het scherm hij op zijn plek ligt

     Kantelen (vanaf 768px): foto's en tekst draaien om hun bovenrand.
     Wat binnenkomt staat eerst met de onderkant naar achteren
     gekanteld en kantelt omlaag tot het recht staat; tekst die vertrekt
     kantelt een fractie de andere kant op.
     tilt        = hoeveel graden, perspective = diepte (lager is sterker) */
  var SPEC = {
    cardEase: 'power2.out',
    duration: 0.8,
    each: 0.05,
    ease: 'power2.inOut',
    mobileShift: '3em',
    mobileEnd: 'top 70%',
    tilt: 20,
    perspective: 1000
  };

  var specMobile = window.matchMedia('(max-width: 767px)').matches;

  /* --- mobiel --- */
  if (specMobile && !reduced) {
    gsap.utils.toArray('.spec-mobile_card').forEach(function (card) {
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
  var specTrack = document.querySelector('.spec_track');
  var spec = document.querySelector('.spec_component');
  if (!specMobile && specTrack && spec && !reduced) {
    var specCards = gsap.utils.toArray('.spec_card');
    var specTexts = gsap.utils.toArray('.spec_text');
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
    var tiltFor = function (k) { return k === current ? 0 : (k < current ? SPEC.tilt * 0.5 : -SPEC.tilt); };

    var markActive = function (next) {
      specTexts.forEach(function (block, k) {
        block.classList.toggle('is-active', k === next);
        block.style.pointerEvents = k === next ? 'auto' : 'none';
      });
    };

    specTexts.forEach(function (block, k) {
      block.style.transition = 'none';
      gsap.set(block, { autoAlpha: 1 });
      gsap.set(parts[k], {
        yPercent: place(k),
        rotationX: tiltFor(k),
        transformOrigin: '50% 0%',
        transformPerspective: SPEC.perspective
      });
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
            rotationX: tiltFor(k),
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
          {
            y: function () { return window.innerHeight; },
            rotationX: -SPEC.tilt,
            transformOrigin: '50% 0%',
            transformPerspective: SPEC.perspective
          },
          { y: 0, rotationX: 0, ease: SPEC.cardEase, duration: 1, immediateRender: true }
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
    sections: '.section_intro, .section_praktijk, .section_team, .section_feature, .section_contract, .section_rates, .section_legal, .section_contact',
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
     Een sectie die bij het laden al in beeld is, begint zijn beweging
     op nul (clamp), zodat de kolommen dan in hun beginstand staan.
     Elke .background_stripes wordt opgedeeld in kolommen die verschuiven en
     draaien terwijl hun eigen sectie door beeld scrolt. Waar de
     kolommen beginnen, komt uit Background position in het
     Style-panel. Elke orb (.background_blob en .background_orb) zakt en groeit
     licht mee. */
  var BG = {
    columns: 8,
    travel: 33.3,
    turn: 45,
    orbShift: 12,
    orbScale: 1.12
  };

  var sectionOf = function (el) { return el.closest('section') || el.parentElement; };

  /* De orb (.background_blob) toont alleen zijn linkerhelft. Zijn rechterrand
     wordt hier op de dichtstbijzijnde kolomrand gelegd, zodat er nooit
     een strook tussen orb en kolom zit. Opnieuw bij elke resize. */
  var bgSnaps = [];

  if (!reduced) {
    gsap.utils.toArray('.background_stripes').forEach(function (stripes) {
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
      var addCol = function () {
        var col = document.createElement('div');
        col.className = 'bg__col';
        var grad = document.createElement('div');
        grad.className = 'bg__grad';
        grad.style.backgroundImage = gradient;
        col.appendChild(grad);
        wrap.appendChild(col);
        grads.push(grad);
        return col;
      };

      /* Genoeg kolommen voor de volle breedte, ook op een breed scherm:
         meet een kolom en vul de sectie, met twee extra als marge. */
      stripes.style.backgroundImage = 'none';
      stripes.appendChild(wrap);
      var colWidth = addCol().offsetWidth || 1;
      var needed = Math.max(BG.columns, Math.ceil(stripes.offsetWidth / colWidth) + 2);
      for (var i = 1; i < needed; i++) addCol();

      var bgLayer = stripes.parentElement;
      var blobs = bgLayer ? Array.prototype.slice.call(bgLayer.querySelectorAll('.background_blob')) : [];
      blobs.forEach(function (blob) {
        var snap = function () {
          blob.style.left = '';
          var half = blob.offsetWidth / 2;
          var edge = blob.offsetLeft + half;
          var step = wrap.firstChild ? wrap.firstChild.offsetWidth : 0;
          if (!step) return;
          var n = Math.round((edge - wrap.offsetLeft) / step);
          blob.style.left = (wrap.offsetLeft + n * step - half) + 'px';
        };
        snap();
        bgSnaps.push(snap);
      });
      gsap.set(stripes, { '--bg-turn': '0deg' });

      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sectionOf(stripes),
          start: 'clamp(top bottom)',
          end: 'bottom top',
          scrub: true
        }
      })
        .to(grads, { xPercent: BG.travel }, 0)
        .to(stripes, { '--bg-turn': BG.turn + 'deg' }, 0);
    });

    gsap.utils.toArray('.background_blob, .background_orb').forEach(function (blob) {
      gsap.fromTo(blob,
        { yPercent: -BG.orbShift, scale: 1 },
        {
          yPercent: BG.orbShift,
          scale: BG.orbScale,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionOf(blob),
            start: 'clamp(top bottom)',
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
    frames: '.home-hero_media, .steps_media, .feature_media, .contract_media, .spec-card_media, .spec-detail_hero-media, .spec-detail_item-media, .spec-detail_other-media'
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
     De footer (.footer_component) ligt vast onderin het scherm. De pagina krijgt
     onderaan net zoveel ruimte als de footer hoog is. Alleen de
     inhoud van de footer schuift licht mee. */
  var FOOTER = { shift: 20 };

  var siteFooter = document.querySelector('.footer_component');
  var footerInner = siteFooter ? siteFooter.querySelector('.padding-global') : null;

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
      closeMega();
      bgSnaps.forEach(function (fn) { fn(); });
      fitFooter();
      ScrollTrigger.refresh();
    }, 200);
  });
})();