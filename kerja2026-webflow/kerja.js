/* Kerja 2026 — kerja.js
   Geladen: sitebreed, footer, na lenis.min.js
   Lenis, ankers, menu en scrollstatus, FAQ, split-hover, dots-lines, zigzag, woord-hover, logo, pagina-overgang en light/dark mode, cursor, coming soon, hero-gradient, scrollbalk, muziek, doorlopende navigatie, footer-gradient, work-cases.
   Bron: github.com/kerja2026/webflow-scripts, map kerja2026-webflow. Wijzig hier, niet in Webflow. */

/* Lenis smooth scroll */
(function () {
  if (typeof Lenis === 'undefined') return;
  var lenis = new Lenis({
    duration: 1.2,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    anchors: true
  });
  window.lenis = lenis;
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
})();

/* Links naar de homepage-secties (/#work enz.) buiten het menu:
   op de homepage zelf scrollen ze soepel via Lenis in plaats van te springen.
   Menulinks regelt het menuscript zelf (eerst inklappen, dan pas navigeren). */
(function () {
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var a = e.target.closest && e.target.closest('a[href^="/#"]');
    if (!a || location.pathname !== '/') return;
    var hash = a.getAttribute('href').slice(1);
    var target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    if (window.lenis) window.lenis.scrollTo(target); else target.scrollIntoView({ behavior: 'smooth' });
    history.pushState(null, '', hash);
  });
})();

/* Scrollstatus: html krijgt is-scrolling tijdens scrollen (scrollbar),
   het menu schuift uit beeld en komt terug bij stilstand.
   Menu: is-open op .menu_component start de blok-voor-blok animatie (CSS in de head).
   Sluiten met de knop, buiten het menu klikken of Escape gaat in omgekeerde volgorde.
   Bij scrollen sluit alles tegelijk (is-instant).
   Automatisch sluiten: wordt er AUTO_CLOSE ms na het openen geen keuze gemaakt, dan klapt het menu
   vanzelf in. Staat de muis op het menu of staat de toetsenbordfocus erin, dan wacht het; de tijd
   begint opnieuw zodra de muis het menu verlaat.
   Onderaan de pagina: staat de legal-navigatie van de footer (.footer_bottom) in beeld, dan komt
   de menuknop LIFT_GAP rem boven die navigatie terug (--menu-lift, CSS in de head).
   De hoogte wordt alleen bepaald als het scrollen stopt, terwijl de knop nog uit beeld is;
   zo blijft hij tijdens het scrollen volledig weg en schuift hij in één beweging naar zijn plek.
   Klik op een menulink: het menu klapt eerst helemaal in, daarna pas navigeren of scrollen.
   Naar een andere pagina gaat via de pagina-overgang (laatste script).
   Links die in een nieuw tabblad openen (Instagram, LinkedIn) gaan direct, anders blokkeert de browser ze.
   Passen: bij elke schermmaat blijft het uitgeklapte menu binnen het venster. Is er te weinig ruimte
   boven of naast de knop, dan verkleint fit() het blok met cellen (--menu-fit, CSS in de head) tot het
   past, met FIT_GAP rem marge tot de rand. Gemeten bij openen en bij het draaien van het scherm. */
(function () {
  var STOP_DELAY = 250; // ms zonder scroll = stilstand
  var AUTO_CLOSE = 5000; // ms zonder keuze, daarna klapt het menu vanzelf in
  var LIFT_GAP = 1.5; // rem tussen de onderkant van de menuknop en de legal-navigatie
  var MENU_BOTTOM = 40; // px, gelijk aan bottom van .menu_component in Webflow
  var FIT_GAP = 0.75; // rem marge tussen het uitgeklapte menu en de rand van het venster
  var root = document.documentElement;
  var menu = document.querySelector('[data-menu]');
  var toggle = document.querySelector('[data-menu-toggle]');
  var list = document.querySelector('[data-menu-list]');
  var faq = document.querySelector('[data-menu-faq]');
  var bottomRow = document.querySelector('.footer_bottom');
  var hasMenu = !!(menu && toggle && list && faq);
  var links = hasMenu
    ? Array.prototype.slice.call(list.querySelectorAll('a')).concat(Array.prototype.slice.call(faq.querySelectorAll('a')))
    : [];
  var autoTimer = null;
  var hovering = false;
  var timer = null;
  var scrolling = false;
  var lastY = window.scrollY;

  function isOpen() { return hasMenu && toggle.getAttribute('aria-expanded') === 'true'; }

  /* hoogte van de menuknop boven de legal-navigatie; niet tijdens het scrollen */
  var liftQueued = false;
  function lift() {
    liftQueued = false;
    if (!hasMenu || !bottomRow || scrolling) return;
    var cs = getComputedStyle(root);
    var fs = parseFloat(cs.fontSize) || 16;
    var off = parseFloat(cs.getPropertyValue('--kerja-bottom-offset')) || 0;
    var need = window.innerHeight - bottomRow.getBoundingClientRect().top + LIFT_GAP * fs;
    var l = Math.max(0, Math.round(need - MENU_BOTTOM - off));
    root.style.setProperty('--menu-lift', l + 'px');
  }
  function queueLift() {
    if (liftQueued) return;
    liftQueued = true;
    requestAnimationFrame(lift);
  }

  /* timer voor automatisch sluiten (opnieuw) starten */
  function armAuto() {
    clearTimeout(autoTimer);
    if (!isOpen()) return;
    autoTimer = setTimeout(function () {
      if (!isOpen()) return;
      if (hovering || menu.contains(document.activeElement) && document.activeElement !== toggle) { armAuto(); return; }
      setOpen(false);
    }, AUTO_CLOSE);
  }

  /* verklein het cellenblok als het niet in het venster past */
  function fit() {
    if (!hasMenu) return;
    var mask = list.closest('.menu_list-mask') || list.parentElement;
    var rem = parseFloat(getComputedStyle(root).fontSize) || 16, gap = FIT_GAP * rem;
    var m = mask.getBoundingClientRect();
    var top = m.bottom - mask.offsetHeight; // bovenkant op ware grootte (de schaal begint onderaan)
    var s = Math.min(1, (m.bottom - gap) / (m.bottom - top), (window.innerWidth - m.left - gap) / mask.offsetWidth);
    menu.style.setProperty('--menu-fit', Math.max(0.4, s).toFixed(3));
  }

  function setOpen(open, instant) {
    if (!hasMenu) return;
    if (open) fit();
    menu.classList.toggle('is-instant', !!instant);
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    links.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    if (open) armAuto(); else clearTimeout(autoTimer);
  }

  /* totale sluittijd in ms, uit de CSS-variabelen in de head: 6 x --menu-step + --menu-dur */
  function closeTime() {
    var cs = getComputedStyle(menu);
    var step = parseFloat(cs.getPropertyValue('--menu-step')) || 0;
    var dur = parseFloat(cs.getPropertyValue('--menu-dur')) || 0;
    return Math.round((step * 6 + dur) * 1000) + 50;
  }

  /* naar de link gaan: anker op dezelfde pagina = soepel scrollen, anders de pagina laden */
  function go(a) {
    var url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.hash) {
      var target = document.querySelector(url.hash);
      if (target) {
        if (window.lenis) window.lenis.scrollTo(target); else target.scrollIntoView({ behavior: 'smooth' });
        history.pushState(null, '', url.hash);
        return;
      }
    }
    if (window.kerjaPageTransition) window.kerjaPageTransition(a.href); else window.location.href = a.href;
  }

  if (hasMenu) {
    setOpen(false, true);
    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var newTab = a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
        if (newTab) { setOpen(false); return; }
        e.preventDefault();
        e.stopPropagation(); // voorkomt dat Lenis of het ankerscript al direct gaat scrollen
        setOpen(false);
        setTimeout(function () { go(a); }, closeTime());
      });
    });
    /* muis op het menu = de bezoeker kiest nog; alleen een echte muis telt (geen aanraking) */
    menu.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovering = true; });
    menu.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      hovering = false;
      armAuto();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) setOpen(false);
    });
    /* klik buiten het menu sluit het menu */
    document.addEventListener('click', function (e) {
      if (isOpen() && !menu.contains(e.target)) setOpen(false);
    });
    lift();
    window.addEventListener('resize', queueLift);
    window.addEventListener('resize', function () { if (isOpen()) fit(); });
    window.addEventListener('load', queueLift);
  }

  function onScroll() {
    var y = window.scrollY;
    if (Math.abs(y - lastY) < 1) return;
    lastY = y;
    if (!scrolling) {
      scrolling = true;
      root.classList.add('is-scrolling');
      if (hasMenu) {
        if (isOpen()) setOpen(false, true);
        menu.classList.add('is-hidden');
      }
    }
    clearTimeout(timer);
    timer = setTimeout(function () {
      scrolling = false;
      root.classList.remove('is-scrolling');
      if (!hasMenu) return;
      /* nieuwe hoogte zetten terwijl de knop nog uit beeld is, zonder animatie */
      menu.style.transition = 'none';
      lift();
      void menu.offsetWidth;
      menu.style.transition = '';
      /* een frame later terugschuiven, vanaf de juiste plek */
      requestAnimationFrame(function () {
        if (!scrolling) menu.classList.remove('is-hidden');
      });
    }, STOP_DELAY);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* FAQ: klik op een vraag om het antwoord uit te klappen.
   Er staat steeds maar één antwoord open: een nieuwe vraag sluit de vorige.
   Opnieuw klikken op de open vraag klapt hem dicht. Werkt ook met Enter en spatie.
   De animatie: .faq_answer (0fr, Style panel) en .faq_answer.is-open (1fr, head-code). */
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-faq-item]'));
  if (!items.length) return;

  function set(item, open) {
    var q = item.querySelector('[data-faq-question]');
    var a = item.querySelector('[data-faq-answer]');
    item.classList.toggle('is-open', open);
    a.classList.toggle('is-open', open);
    a.setAttribute('aria-hidden', open ? 'false' : 'true');
    q.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  items.forEach(function (item, i) {
    var q = item.querySelector('[data-faq-question]');
    var a = item.querySelector('[data-faq-answer]');
    if (!q || !a) return;
    a.id = 'faq-answer-' + (i + 1);
    q.setAttribute('role', 'button');
    q.setAttribute('tabindex', '0');
    q.setAttribute('aria-controls', a.id);
    set(item, false);

    function toggle() {
      var open = !item.classList.contains('is-open');
      items.forEach(function (other) { if (other !== item && other.classList.contains('is-open')) set(other, false); });
      set(item, open);
    }

    q.addEventListener('click', toggle);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
})();

/* Menu hover: het label splitst op een willekeurig punt in twee lettergroepen.
   Het rechterdeel schuift naar rechts tot dezelfde afstand van de rechterlijn
   als het label links van de linkerlijn staat. Elke hover kiest een nieuw splitspunt. */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  Array.prototype.forEach.call(document.querySelectorAll('.menu_cell'), function (cell) {
    var label = cell.querySelector('.menu_label');
    var frame = cell.querySelector('.menu_cell-frame');
    if (!label || !frame) return;

    var text = label.textContent.trim();
    if (text.length < 2) return;
    if (!cell.hasAttribute('aria-label')) cell.setAttribute('aria-label', text);

    label.textContent = '';
    label.setAttribute('aria-hidden', 'true');
    var letters = text.split('').map(function (ch) {
      var s = document.createElement('span');
      s.className = 'menu_label-letter';
      s.textContent = ch;
      label.appendChild(s);
      return s;
    });

    var last = -1;

    cell.addEventListener('mouseenter', function () {
      /* nieuw splitspunt: altijd minstens 1 letter links en rechts, en niet twee keer hetzelfde op rij */
      var k;
      do { k = 1 + Math.floor(Math.random() * (letters.length - 1)); }
      while (letters.length > 2 && k === last);
      last = k;

      /* posities zonder transforms: offsetLeft/offsetWidth negeren translate */
      var cs = getComputedStyle(frame);
      var borderLeft = parseFloat(cs.borderLeftWidth) || 0;
      var borderRight = parseFloat(cs.borderRightWidth) || 0;
      var lineLeftInner = frame.offsetLeft + borderLeft;
      var lineRightInner = frame.offsetLeft + frame.offsetWidth - borderRight;

      var firstLetter = letters[0];
      var lastLetter = letters[letters.length - 1];
      var textLeft = label.offsetLeft + firstLetter.offsetLeft;
      var textRight = label.offsetLeft + lastLetter.offsetLeft + lastLetter.offsetWidth;

      var gap = Math.max(0, textLeft - lineLeftInner); // zelfde ruimte als links
      var shift = Math.max(0, lineRightInner - gap - textRight);

      letters.forEach(function (l, i) {
        l.style.transform = i >= k ? 'translateX(' + shift + 'px)' : '';
      });
    });

    cell.addEventListener('mouseleave', function () {
      letters.forEach(function (l) { l.style.transform = ''; });
    });
  });
})();

/* Link hover: elke overige tekstlink splitst op één willekeurig punt binnen een woord.
   Alles rechts van dat punt schuift 15px naar rechts. Bij mouse-out terug.
   Ook de FAQ-vragen: hover op de hele vraag, de vraagtekst splitst.
   Overgeslagen: menuvakken, links met beeld, links in de woord-hover statements. */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var SHIFT = 0.9375; // rem, 15px op 1512

  /* trigger = waar de muis op komt, text = de tekst die splitst */
  var targets = [];
  Array.prototype.forEach.call(document.querySelectorAll('a'), function (link) {
    if (link.closest('.menu_cell') || link.closest('[data-word-hover]')) return;
    if (link.querySelector('img, svg, video, picture')) return;
    targets.push({ trigger: link, text: link });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-faq-question]'), function (q) {
    var h = q.querySelector('h1, h2, h3, h4, h5, h6');
    if (h) targets.push({ trigger: q, text: h });
  });

  targets.forEach(function (t) {
    var trigger = t.trigger, el = t.text;
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    if (text.length < 2) return;
    if (!trigger.hasAttribute('aria-label')) trigger.setAttribute('aria-label', text);

    var letters = [];
    var wordOf = [];
    var word = 0;

    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          var buffer = '';
          child.textContent.split('').forEach(function (ch) {
            if (/\s/.test(ch)) { buffer += ch; return; }
            if (buffer) { frag.appendChild(document.createTextNode(buffer)); buffer = ''; word++; }
            var s = document.createElement('span');
            s.className = 'link-split_letter';
            s.setAttribute('aria-hidden', 'true');
            s.textContent = ch;
            frag.appendChild(s);
            letters.push(s);
            wordOf.push(word);
          });
          if (buffer) { frag.appendChild(document.createTextNode(buffer)); word++; }
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          word++;
          split(child);
          word++;
        }
      });
    })(el);

    /* splitspunten: alleen tussen twee letters van hetzelfde woord */
    var points = [];
    for (var i = 1; i < letters.length; i++) {
      if (wordOf[i] === wordOf[i - 1]) points.push(i);
    }
    if (!points.length) return;

    var last = -1;

    trigger.addEventListener('mouseenter', function () {
      var k;
      do { k = points[Math.floor(Math.random() * points.length)]; }
      while (points.length > 1 && k === last);
      last = k;
      letters.forEach(function (l, j) {
        l.style.transform = j >= k ? 'translateX(' + SHIFT + 'rem)' : '';
      });
    });

    trigger.addEventListener('mouseleave', function () {
      letters.forEach(function (l) { l.style.transform = ''; });
    });
  });
})();

/* Dots-lines: groeien eenmalig van links naar rechts.
   In de hero direct na het laden, elders zodra ze volledig in beeld komen.
   Lijnen die tegelijk in beeld komen, starten 0.3s na elkaar, van boven naar beneden. */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('dl-anim')) return;
  var STAGGER = 0.3; // seconden tussen lijnen die samen in beeld komen
  var items = Array.prototype.slice.call(document.querySelectorAll('.dots-line_component'));
  if (!items.length) return;

  function grow(el, delay) {
    var line = el.querySelector('.dots-line_line');
    if (line) line.style.transitionDelay = delay + 's';
    el.classList.add('is-in');
  }

  /* Hero: meteen na laden. Twee frames wachten zodat de beginstand eerst getekend is. */
  var later = [];
  items.forEach(function (el) {
    if (el.closest('.section_hero')) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { grow(el, 0); }); });
    } else {
      later.push(el);
    }
  });

  var io = new IntersectionObserver(function (entries) {
    var visible = entries
      .filter(function (e) { return e.isIntersecting; })
      .map(function (e) { return e.target; })
      .sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    visible.forEach(function (el, i) {
      grow(el, i * STAGGER);
      io.unobserve(el);
    });
  }, { threshold: 1 });

  later.forEach(function (el) { io.observe(el); });
})();

/* Zigzag-lijnen: de afbeelding wordt vervangen door een inline SVG met dezelfde classes,
   zodat de lijn te animeren is. Drie verticalen (links, ergens in het midden, rechts),
   verbonden door schuine lijnen. De middelste verticaal schuift horizontaal van een
   willekeurige startpositie naar een willekeurige eindpositie (tussen 15% en 85% van de breedte).
   De richting van de schuine lijnen (omlaag of omhoog) is per zigzag willekeurig en vast:
   de lijnen schuiven, ze draaien niet.
   De beweging hangt aan het scrollen, met een ease die je zelf bedient:
   - de lijn start rustig zodra de bovenkant onderin beeld komt
   - rond het punt waar de bovenkant op 30% van het scherm staat is hij ruim 90% onderweg
   - daarna schuift hij steeds langzamer door richting de eindpositie, zonder harde stop
   - de lijn volgt het scrollen met wat naloop, dus hij remt zacht af als je stopt met scrollen
   Terugscrollen = terugschuiven. Bij 'reduced motion' staat hij direct in de eindpositie.
   De lijnkleur is var(--light), dus hij wisselt mee met light/dark mode.
   Hoeken: op elke hoek een hol bolletje, zoals bij de kaders van de cases en het menu (DOT_R, ring van
   1px), en de lijnen stoppen op DOT_GAP voor de hoek. De SVG tekent daarom in echte pixels (viewBox =
   eigen maat, opnieuw bij resize), anders zouden de bolletjes mee uitrekken tot ovalen.
   Classes: faq_visual (FAQ), work_visual en visual_image (Home, Connect), about-more_visual (About). */
(function () {
  var imgs = Array.prototype.slice.call(document.querySelectorAll('.faq_visual, .work_visual, .visual_image, .about-more_visual'));
  if (!imgs.length) return;
  var NS = 'http://www.w3.org/2000/svg';
  var END_AT = 0.3;   // bovenkant op 30% van het scherm = ruim 90% onderweg
  var CURVE = 2.5;    // hoe snel de beweging uitloopt (hoger = eerder bijna stil)
  var FOLLOW = 0.1;   // naloop per frame (lager = zachter en trager volgen)
  var DOT_R = 0.1875;   // rem, straal van het bolletje (midden van de ring van 1px), 3px op 1512
  var DOT_GAP = 0.3125; // rem, lijnen stoppen zo ver voor de hoek (gelijk aan de kaders)
  function rem() { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* rustige start, daarna steeds langzamer: nadert 1 zonder hem hard te raken */
  function curve(p) { return p <= 0 ? 0 : 1 - Math.exp(-CURVE * Math.pow(p, 1.5)); }
  function randX() { return 0.15 + Math.random() * 0.7; }
  var items = [];

  function init(img) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', img.getAttribute('class'));
    svg.style.overflow = 'visible';
    var path = document.createElementNS(NS, 'path');
    path.style.stroke = 'var(--light, #EAE3DA)';
    path.setAttribute('stroke-width', '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(path);
    var dots = [];
    for (var i = 0; i < 6; i++) {
      var c = document.createElementNS(NS, 'circle');
      c.style.stroke = 'var(--light, #EAE3DA)';
      c.setAttribute('stroke-width', '1');
      svg.appendChild(c);
      dots.push(c);
    }
    /* zelfde maat als de afbeelding: verhouding van het bestand, breedte uit de layout */
    var rw = img.naturalWidth || img.offsetWidth || 1431, rh = img.naturalHeight || img.offsetHeight || 123;
    svg.style.height = 'auto';
    svg.style.aspectRatio = rw + ' / ' + rh;
    img.parentNode.replaceChild(svg, img);

    var down = Math.random() < 0.5; // richting van de schuine lijnen, vast per zigzag
    var start = randX(), end = randX();
    while (Math.abs(end - start) < 0.25) end = randX();
    var last = .5;

    function draw(x) {
      last = x;
      var r = svg.getBoundingClientRect(), W = r.width, H = r.height;
      if (!W || !H) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var pad = 0.5, top = pad, bot = H - pad, xl = pad, xr = W - pad;
      var ya = down ? bot : top, yb = down ? top : bot;
      var xm = pad + x * (W - 2 * pad);
      var pts = [[xl, ya], [xl, yb], [xm, ya], [xm, yb], [xr, ya], [xr, yb]];
      var g = DOT_GAP * rem(), d = '';
      for (var k = 0; k < 5; k++) {
        var a = pts[k], b = pts[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy);
        if (len <= 2 * g) continue;
        var ux = dx / len * g, uy = dy / len * g;
        d += 'M' + (a[0] + ux) + ' ' + (a[1] + uy) + 'L' + (b[0] - ux) + ' ' + (b[1] - uy);
      }
      path.setAttribute('d', d);
      var rr = DOT_R * rem();
      pts.forEach(function (pt, k) { dots[k].setAttribute('cx', pt[0]); dots[k].setAttribute('cy', pt[1]); dots[k].setAttribute('r', rr); });
    }
    if (window.ResizeObserver) new ResizeObserver(function () { draw(last); }).observe(svg);

    function target() {
      var vh = window.innerHeight;
      var t = svg.getBoundingClientRect().top;
      var p = (vh - t) / (vh * (1 - END_AT));
      return start + (end - start) * curve(p);
    }

    if (reduce) { draw(end); return; }

    var cur = target();
    draw(cur);
    items.push({
      /* één stap richting het doel; geeft true terug zolang hij nog beweegt */
      step: function () {
        var goal = target();
        var d = goal - cur;
        if (Math.abs(d) < 0.0002) { if (d) { cur = goal; draw(cur); } return false; }
        cur += d * FOLLOW;
        draw(cur);
        return true;
      }
    });
  }

  /* animatielus draait alleen zolang er iets beweegt */
  var running = false;
  function loop() {
    var moving = false;
    items.forEach(function (it) { if (it.step()) moving = true; });
    if (moving) requestAnimationFrame(loop); else running = false;
  }
  function kick() {
    if (running) return;
    running = true;
    requestAnimationFrame(loop);
  }
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);

  imgs.forEach(function (img) {
    if (img.complete && img.naturalWidth) init(img);
    else img.addEventListener('load', function () { init(img); }, { once: true });
  });
})();

/* Woord-hover op de statements: het woord onder de muis krijgt 20px ruimte aan beide kanten.
   Woorden schuiven alleen naar rechts, zodat de tekst links uitgelijnd blijft:
   - woorden ervoor blijven staan
   - het gehoverde woord schuift 20px (niet als het het eerste woord van de regel is)
   - woorden erna schuiven 20px verder dan het gehoverde woord
   Alleen woorden op dezelfde regel bewegen, zodat de tekst niet opnieuw afbreekt. */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var SHIFT = 1.25; // rem, 20px op 1512

  Array.prototype.forEach.call(document.querySelectorAll('[data-word-hover]'), function (block) {
    var words = [];

    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              var span = document.createElement('span');
              span.className = 'word-hover_word';
              span.textContent = part;
              frag.appendChild(span);
              words.push(span);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          split(child);
        }
      });
    })(block);

    function reset() {
      words.forEach(function (w) { w.style.transform = ''; });
    }

    words.forEach(function (word, i) {
      word.addEventListener('mouseenter', function () {
        var top = word.offsetTop;
        var firstOnLine = i === 0 || words[i - 1].offsetTop !== top;
        var own = firstOnLine ? 0 : SHIFT;
        words.forEach(function (other, j) {
          var amount = 0;
          if (other.offsetTop === top) {
            if (j === i) amount = own;
            else if (j > i) amount = own + SHIFT;
          }
          other.style.transform = amount ? 'translateX(' + amount + 'rem)' : '';
        });
      });
    });
    block.addEventListener('mouseleave', reset);
  });
})();

/* Logo (.hero_logo): de logo-afbeelding wordt vervangen door een inline SVG van het woordmerk
   (kerja-def-2026.svg), met als vulkleur var(--light). Zo wordt het logo blauw in light mode.
   In rust staan alleen de K en de punt. Mouse-over (of toetsenbordfocus op de link): de punt verdwijnt,
   de letters e, r, j en a verschijnen abrupt, elk op een willekeurig moment binnen LOGO_IN ms (zoals
   de teksten bij de pagina-overgang), en daarna staat de punt achter de a. Mouse-out: andersom.
   Tegelijk schaalt het hele logo naar LOGO_SCALE (75%) vanuit linksboven, in 0,5 s; bij mouse-out
   schaalt de K met de punt terug naar 100%. Het hover-vlak blijft op het volle formaat staan, zodat de
   muis er niet vanaf valt als het logo kleiner wordt (anders gaat het flikkeren).
   Alleen op apparaten met muis; bij 'reduced motion' staat het woord in een keer, zonder schalen. */
(function () {
  var img = document.querySelector('img.hero_logo');
  if (!img || !img.parentNode) return;
  var LOGO_IN = 400, LOGO_OUT = 300;   // ms waarin de letters verschijnen of verdwijnen
  var LOGO_SCALE = 0.75;               // formaat van het logo bij mouse-over (1 = niet schalen)
  var EASE = '0.5s cubic-bezier(0.65, 0, 0.35, 1)';
  var H = 145, W_K = 164, W_ALL = 708.1, DOT_K = 145, DOT_END = 689.1;   // maten in de viewBox
  var NS = 'http://www.w3.org/2000/svg';
  var SHAPES = [
    ['polygon', 'points', '131 142.6 104.2 142.6 49.6 88.1 49.3 88.5 19.8 122.7 19.8 142.6 .7 142.6 .7 -.5 19.8 -.5 19.8 93.6 100.8 -.5 126 -.5 62 73.6 131 142.6', 'k'],
    ['polygon', 'points', '162 18.5 162 61.5 241.9 61.5 241.9 80.5 162 80.5 162 123.5 267.1 123.5 267.1 142.6 143 142.6 143 -.5 267.1 -.5 267.1 18.5 162 18.5', 'e'],
    ['path', 'd', 'M415.7,48c0-26.8-21.8-48.6-48.5-48.6h-77.7v143.1h19v-46h54.3l28.1,46h22.3l-29.8-48.8c18.9-6.7,32.4-24.6,32.4-45.8ZM308.4,18.4h58.7c16.3,0,29.5,13.3,29.5,29.6s-13.3,29.5-29.5,29.5h-58.7V18.4Z', 'r'],
    ['path', 'd', 'M473.7,144.1h-6.9c-25.3,0-45.2-19.2-45.2-43.7v-6.4h19v6.4c0,14.1,11.3,24.7,26.2,24.7h6.9c14.4,0,26.2-11.7,26.2-26.2V18.5h-27.3V-.5h46.3v99.5c0,24.9-20.3,45.2-45.2,45.2Z', 'j'],
    ['path', 'd', 'M610.7-.5h-22.5l-64.4,143h20.8l15.9-35.3h77.9l15.9,35.3h20.8L610.7-.5ZM569,88.3l30.4-67.5,30.4,67.5h-60.8Z', 'a']
  ];
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', img.className);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', img.getAttribute('alt') || 'Kerja');
  svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
  var letters = [];
  SHAPES.forEach(function (s) {
    var el = document.createElementNS(NS, s[0]);
    el.setAttribute(s[1], s[2]);
    el.style.fill = 'var(--light, #EAE3DA)';
    if (s[3] !== 'k') { el.style.visibility = 'hidden'; letters.push(el); }
    svg.appendChild(el);
  });
  var dot = document.createElementNS(NS, 'rect');
  dot.setAttribute('y', '125.2'); dot.setAttribute('width', '19'); dot.setAttribute('height', '19');
  dot.style.fill = 'var(--light, #EAE3DA)';
  svg.appendChild(dot);
  /* onzichtbaar vlak dat bij mouse-over de volle hoogte van het logo bedekt, ook als het kleiner is */
  var pad = document.createElementNS(NS, 'rect');
  pad.setAttribute('x', '0'); pad.setAttribute('y', '-.5');
  pad.setAttribute('width', W_ALL); pad.setAttribute('height', H / LOGO_SCALE);
  pad.style.fill = 'none'; pad.style.pointerEvents = 'all'; pad.style.display = 'none';
  svg.appendChild(pad);
  /* hoogte zoals de oude afbeelding; de breedte volgt het deel van het woord dat te zien is */
  var h = img.getBoundingClientRect().height || 25;
  function frame(open) {
    var w = open ? W_ALL : W_K;
    svg.setAttribute('viewBox', '0 -.5 ' + w + ' ' + H);
    svg.style.width = (w / H * h / 16) + 'rem';
    svg.style.height = (h / 16) + 'rem';
    svg.style.overflow = 'visible';
  }
  dot.setAttribute('x', DOT_K);
  frame(false);
  img.parentNode.replaceChild(svg, img);

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* schalen via 'scale' (los van 'translate', waarmee het logo bij scrollen wegschuift); de overige
     overgangen uit kerja.css (translate, kleurwissel bij diapositief) gaan mee in dezelfde regel */
  svg.style.transformOrigin = '0 0';
  if (!reduce) svg.style.transition = 'translate ' + EASE + ', scale ' + EASE + ', --light 0.6s cubic-bezier(0.65, 0, 0.35, 1), --bright-blue 0.6s cubic-bezier(0.65, 0, 0.35, 1)';
  function size(small) { if (!reduce) svg.style.scale = small ? String(LOGO_SCALE) : ''; pad.style.display = small ? '' : 'none'; }
  var timers = [], open = false;
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function shuffle(list) { list = list.slice(); for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = list[i]; list[i] = list[j]; list[j] = t; } return list; }
  function show() {
    if (open) return; open = true; clear();
    frame(true);
    size(true);
    dot.style.visibility = 'hidden';
    if (reduce) { letters.forEach(function (l) { l.style.visibility = ''; }); dot.setAttribute('x', DOT_END); dot.style.visibility = ''; return; }
    var step = LOGO_IN / letters.length;
    shuffle(letters).forEach(function (l, i) { later(function () { l.style.visibility = ''; }, i * step + Math.random() * step * .8); });
    later(function () { dot.setAttribute('x', DOT_END); dot.style.visibility = ''; }, LOGO_IN + 40);
  }
  function hide() {
    if (!open) return; open = false; clear();
    size(false);
    dot.style.visibility = 'hidden';
    var done = function () { frame(false); dot.setAttribute('x', DOT_K); dot.style.visibility = ''; };
    if (reduce) { letters.forEach(function (l) { l.style.visibility = 'hidden'; }); done(); return; }
    var step = LOGO_OUT / letters.length;
    shuffle(letters).forEach(function (l, i) { later(function () { l.style.visibility = 'hidden'; }, i * step + Math.random() * step * .8); });
    later(done, LOGO_OUT + 40);
  }
  /* de muis telt op het zichtbare logo zelf (de link eromheen kan elders een eigen vlak hebben) */
  svg.addEventListener('mouseenter', show);
  svg.addEventListener('mouseleave', hide);
  var link = svg.closest('a');
  if (link) {
    link.addEventListener('focusin', function () { try { if (link.matches(':focus-visible')) show(); } catch (e) {} });
    link.addEventListener('focusout', hide);
  }
})();

/* Pagina-overgang tussen pagina's van de site, en de wissel tussen light en dark mode.
   Vertrek: na een klik verdwijnen alle onderdelen die op dat moment in beeld zijn abrupt,
   één voor één in willekeurige volgorde (OUT ms). Daarna laadt de volgende pagina.
   Aankomst: de nieuwe pagina start leeg (html.pt-enter, head-script) en bouwt de onderdelen
   die in beeld zijn abrupt weer op, één voor één in willekeurige volgorde (IN ms).
   Onderdelen buiten beeld doen niet mee: die staan meteen goed.
   Statements (STATEMENT: de grote koppen) gaan niet in één keer, maar per woordgroep.
   Een woordgroep is 3 of 4 willekeurige woorden uit dezelfde kop (niet per se naast elkaar);
   elke groep verdwijnt en verschijnt op een eigen willekeurig moment.
   Light/dark mode ([data-theme-toggle], rechtsboven):
   - dark is standaard; een keuze voor light wordt onthouden (localStorage kerja-theme)
   - het rechter bolletje toont de modus: blauw rechts = dark, licht rechts = light
   - mouse-over: de switch draait 180 graden met de klok mee en laat zo de andere modus zien;
     mouse-out: 180 graden terug
   - klik (of Enter/spatie): de modus wisselt. Met de muis erop staat de switch dan al goed,
     dus mouse-out draait niet meer terug. Via het toetsenbord draait hij eerst 180 graden (SPIN ms)
   - daarna dezelfde reeks als een pagina-overgang, maar zonder te navigeren: alles in beeld
     verdwijnt, de kleuren wisselen (html.theme-light), alles verschijnt weer
   - bij 'reduced motion' wisselen de kleuren direct
   Begroeting op Home ([data-greeting]):
   - eerste bezoek in de sessie: de tekst uit Webflow (Hello)
   - elke volgende keer op Home: een willekeurige begroeting uit HELLO
   - bij vertrek naar een andere pagina: direct een willekeurig afscheid uit BYE; dat blijft
     als laatste staan terwijl de rest verdwijnt
   - beide lijsten hebben één Japanse, één Arabische en één Russische tekst; LANG zet daarvoor
     lang en dir, zodat de head-CSS het juiste Noto Sans-font kiest
   - de Spaanse teksten staan in Articulat CF (Latijns schrift)
   - bij aankomst op Home verschijnt de begroeting als eerste, daarna pas de rest
   Nooit twee keer achter elkaar dezelfde tekst.
   Geldt voor links naar een andere pagina op dezelfde site (ook vanuit het menu).
   Ankers op dezelfde pagina, nieuwe tabbladen en mailto blijven zoals ze waren.
   Olievlek: bij aankomst (elke keer, ook bij vernieuwen) groeit de pagina als een
   olievlek van onder naar boven over de ondergrond in de andere kleur, daarna pas de opbouw.
   Bij het eerste bezoek in de sessie is die groei de preloader (kerjaHaze.preload, script hero-gradient). Bij
   vertrek en bij de light/dark-wissel trekt hij zich na het verdwijnen van de onderdelen terug van
   boven naar onder (script: hero-gradient en korrel). */
(function () {
  var root = document.documentElement;
  var KEY = 'kerja-pt';
  var THEME_KEY = 'kerja-theme';
  /* .work-cases_visual: de case als geheel (foto, halftone-canvas en kader), anders blijft de halftone staan */
  var SEL = 'h1,h2,h3,h4,h5,h6,p,img,svg,a,.dots-line_component,.menu_component,.text-size-tiny,[data-greeting],.hero_payoff,.theme-switch_component,.work-cases_visual';
  var STATEMENT = '[data-word-hover], .statement_heading, .footer_heading, .about_heading';
  var OUT = 1000, IN = 1000; // ms waarin alles in beeld verdwijnt of verschijnt
  var SPIN = 500; // ms dat de switch draait voordat de wissel begint (gelijk aan de transition in Webflow)
  var GREET_HOLD = 400; // ms dat begroeting of afscheid alleen in beeld staat
  var HELLO = [
    'Sup, mate?', "G'day, legend!", 'Alright, mate?', 'Heya!', "What's up homie!",
    'Ahoy, matey!', 'Yarr, how be ye?', 'Ahoy there!', 'Good tidings, ye scallywag!', 'What cheer, me hearty?',
    '¿Qué pasó, carnal?', '¡Buenas! ¿Cómo andas?',
    'こんにちは', 'مرحبا', 'Привет!'
  ];
  var BYE = [
    'See you later!', 'Catch ya later, mate!', 'Later!', 'See ya!', 'Cheerio!', 'Ta-ta for now!',
    'Fair winds, matey!', 'Till we cross paths on the high seas!', 'Take care!',
    '¡Nos vemos!', '¡Hasta luego!',
    'またね', 'مع السلامة', 'Пока!'
  ];
  var LANG = {
    'こんにちは': 'ja', 'مرحبا': 'ar', 'Привет!': 'ru',
    'またね': 'ja', 'مع السلامة': 'ar', 'Пока!': 'ru'
  };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false;
  var greet = document.querySelector('[data-greeting]');
  window.kerjaGreetings = { hello: HELLO, lang: LANG }; // ook voor de preloader (script hero-gradient)

  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (err) { return null; } }
  /* willekeurig uit de lijst, nooit dezelfde als de vorige keer */
  function pick(list, k) {
    var last = store(k);
    var opts = list.filter(function (x) { return x !== last; });
    var v = opts[Math.floor(Math.random() * opts.length)];
    store(k, v);
    return v;
  }
  /* tekst zetten, met taal en leesrichting voor de teksten in een ander schrift */
  function say(t) {
    greet.textContent = t;
    var l = LANG[t];
    if (l) greet.setAttribute('lang', l); else greet.removeAttribute('lang');
    if (l === 'ar') greet.setAttribute('dir', 'rtl'); else greet.removeAttribute('dir');
  }

  /* begroeting zetten zodra de pagina laadt */
  if (greet) {
    if (store('kerja-greeted')) say(pick(HELLO, 'kerja-hello'));
    else store('kerja-greeted', '1');
  }

  /* woorden van een statement als losse spans. Bij statements met woord-hover (op apparaten met muis)
     bestaan ze al (.word-hover_word); anders maakt dit script ze zelf (.pt-word, gewone inline spans). */
  function words(block) {
    var ws = block.querySelectorAll('.word-hover_word, .pt-word');
    if (ws.length) return Array.prototype.slice.call(ws);
    var out = [];
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'pt-word';
            s.textContent = part;
            frag.appendChild(s);
            out.push(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          split(child);
        }
      });
    })(block);
    return out;
  }
  /* hero-gradient (script verderop): eerst groeien, dan pas opbouwen; bij vertrek eerst wegzakken.
     Zonder gradient op de pagina gaat het meteen door. */
  function grow(next, mode) { if (window.kerjaHaze && window.kerjaHaze.grow) window.kerjaHaze.grow(next, mode); else next(); }
  function sink(next) { if (window.kerjaHaze && window.kerjaHaze.sink) window.kerjaHaze.sink(next); else next(); }
  function isWord(el) { return el.classList.contains('word-hover_word') || el.classList.contains('pt-word'); }

  /* alle onderdelen, alleen de buitenste (een link met een titel erin telt als één).
     Een statement wordt vervangen door zijn losse woorden. */
  function items() {
    var list = Array.prototype.slice.call(document.querySelectorAll(SEL)).filter(function (el) {
      var p = el.parentElement;
      while (p && p !== document.body) { if (p.matches(SEL)) return false; p = p.parentElement; }
      return true;
    });
    var out = [];
    list.forEach(function (el) {
      if (el.matches(STATEMENT)) out = out.concat(words(el));
      else out.push(el);
    });
    return out;
  }
  /* staat het onderdeel (deels) in beeld? werkt ook als het verborgen is (visibility houdt de plek vast) */
  function inView(el) {
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return false;
    return r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
  }
  /* eenheden die samen verdwijnen of verschijnen: gewone onderdelen los,
     woorden van een statement gehusseld en in groepen van 3 of 4 */
  function units(list) {
    var out = [], blocks = [], byBlock = [];
    list.forEach(function (el) {
      if (!isWord(el)) { out.push([el]); return; }
      var b = el.closest(STATEMENT), i = blocks.indexOf(b);
      if (i < 0) { blocks.push(b); byBlock.push([el]); } else byBlock[i].push(el);
    });
    byBlock.forEach(function (ws) {
      for (var i = ws.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = ws[i]; ws[i] = ws[j]; ws[j] = t; }
      for (var k = 0; k < ws.length;) { var n = Math.random() < 0.5 ? 3 : 4; out.push(ws.slice(k, k + n)); k += n; }
    });
    return out;
  }
  /* abrupt verbergen of tonen, elke eenheid op een willekeurig moment binnen dur ms */
  function scatter(list, hide, dur, done) {
    units(list).forEach(function (unit) {
      setTimeout(function () {
        unit.forEach(function (el) { el.classList.toggle('pt-hide', hide); });
      }, Math.random() * dur);
    });
    setTimeout(done || function () {}, dur + 20);
  }

  /* opbouwen: alles wat verborgen is; buiten beeld meteen, in beeld willekeurig; begroeting eerst */
  function build() {
    var hidden = Array.prototype.slice.call(document.querySelectorAll('.pt-hide'));
    var lead = 0;
    if (greet && hidden.indexOf(greet) > -1) {
      greet.classList.remove('pt-hide');
      hidden = hidden.filter(function (el) { return el !== greet; });
      if (inView(greet)) lead = GREET_HOLD;
    }
    var vis = hidden.filter(inView);
    hidden.forEach(function (el) { if (vis.indexOf(el) < 0) el.classList.remove('pt-hide'); });
    setTimeout(function () {
      scatter(vis, false, IN, function () { busy = false; });
    }, lead);
  }

  /* vertrek: alles in beeld verdwijnt willekeurig, het afscheid als laatste, dan de volgende pagina */
  function leave(url) {
    if (busy) return;
    if (reduce) { nav(url); return; }
    busy = true;
    var list = items().filter(inView);
    var greetShown = greet && inView(greet);
    if (greet) {
      say(pick(BYE, 'kerja-bye'));
      list = list.filter(function (el) { return el !== greet; });
    }
    scatter(list, true, OUT, function () {
      setTimeout(function () {
        if (greet) greet.classList.add('pt-hide');
        store(KEY, '1');
        /* muziek: speelt hij door (doorlopende navigatie), dan niet uitfaden; anders uitfaden met de olievlek */
        if (window.kerjaMusic && !(window.kerjaNav && window.kerjaNav.keeps())) window.kerjaMusic.leave();
        sink(function () { nav(url); });
      }, greetShown ? GREET_HOLD : 0);
    });
  }
  /* naar de volgende pagina: via de doorlopende navigatie (script na de muziek), anders gewoon laden */
  function nav(url) { if (window.kerjaNav) window.kerjaNav.go(url); else window.location.href = url; }
  window.kerjaPageTransition = leave;

  /* aankomst na een overgang: alles verborgen; bij statements de woorden, zodat de kop zelf zichtbaar kan zijn */
  if (root.classList.contains('pt-enter')) {
    try { sessionStorage.removeItem(KEY); } catch (err) {}
    items().forEach(function (el) { el.classList.add('pt-hide'); });
    root.classList.remove('pt-enter');
    window.kerjaPtEnter = true; // voor de hero-gradient: start weggezakt
    busy = true;
    /* eerste bezoek in de sessie: preloader (olievlek stijgt mee met het laden, zie kerjaHaze.preload) */
    var first = !store('kerja-seen');
    store('kerja-seen', '1');
    setTimeout(function () {
      if (first && window.kerjaHaze && window.kerjaHaze.preload) window.kerjaHaze.preload(build);
      else grow(build);
    }, first ? 0 : 100);
  }

  /* light/dark mode */
  var sw = document.querySelector('[data-theme-toggle]');
  var base = 0;      // draaiing die bij de huidige modus hoort (0 = dark, 180 = light, en zo verder)
  var hover = false; // muis op de switch: 180 graden extra
  function isLight() { return root.classList.contains('theme-light'); }
  function turn() { if (sw) sw.style.transform = 'rotate(' + (base + (hover ? 180 : 0)) + 'deg)'; }
  function syncSwitch() {
    if (!sw) return;
    sw.setAttribute('aria-checked', isLight() ? 'true' : 'false');
  }
  function setTheme(light) {
    root.classList.toggle('theme-light', light);
    try { localStorage.setItem(THEME_KEY, light ? 'light' : 'dark'); } catch (err) {}
    syncSwitch();
  }
  if (sw) {
    base = isLight() ? 180 : 0;
    turn();
    sw.setAttribute('role', 'switch');
    sw.setAttribute('tabindex', '0');
    sw.setAttribute('aria-label', 'Light mode');
    syncSwitch();

    var flip = function () {
      if (busy) return;
      var spun = hover; // met de muis erop is de switch al 180 graden gedraaid
      base += 180;
      hover = false;
      turn();
      var light = !isLight();
      if (reduce) { setTheme(light); return; }
      busy = true;
      setTimeout(function () {
        scatter(items().filter(inView), true, OUT, function () {
          sink(function () {
            setTheme(light); // kleuren wisselen als alles in beeld verdwenen is en de gradient weg is
            grow(build, 'same');
          });
        });
      }, spun ? 0 : SPIN);
    };
    sw.addEventListener('click', flip);
    sw.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
    /* mouse-over: 180 graden met de klok mee; mouse-out: terug. Alleen met een echte muis. */
    sw.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || busy) return;
      hover = true;
      turn();
    });
    sw.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse' || !hover) return;
      hover = false;
      turn();
    });
  }

  /* klikken op links naar een andere pagina */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    var here = location.pathname.replace(/\/$/, ''), there = url.pathname.replace(/\/$/, '');
    if (here === there) return; // anker of dezelfde pagina: niets doen
    e.preventDefault();
    leave(url.href);
  });

  /* terug-knop met browsercache: alles weer zichtbaar, met een nieuwe begroeting en het actuele thema */
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    Array.prototype.forEach.call(document.querySelectorAll('.pt-hide'), function (el) { el.classList.remove('pt-hide'); });
    if (greet) say(pick(HELLO, 'kerja-hello'));
    if (window.kerjaHaze && window.kerjaHaze.show) window.kerjaHaze.show();
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) {}
    root.classList.toggle('theme-light', saved === 'light');
    if (sw) {
      base = isLight() ? 180 : 0;
      hover = false;
      sw.style.transition = 'none';
      turn();
      void sw.offsetWidth;
      sw.style.transition = '';
      syncSwitch();
    }
    busy = false;
  });
})();

/* Cursor: de gewone muispijl wordt vervangen door een open bolletje (CURSOR rem straal) in var(--light),
   precies op de muispositie, dus wisselt mee met light/dark mode.
   Boven iets klikbaars (CLICKABLE: links, knoppen, menu, switch, FAQ-vragen) vult het bolletje zich
   vanuit het midden: een gevulde cirkel groeit van 0 tot de volle maat in FILL ms (ease-out).
   Bij het verlaten krimpt de vulling op dezelfde manier terug. De buitenmaat blijft altijd gelijk.
   De pijl verdwijnt pas als het script draait (html.has-dot-cursor); valt het script weg,
   dan blijft de gewone cursor staan. Muis buiten het venster: bolletje weg.
   Alleen op apparaten met een muis. Het canvas vangt geen klikken op. */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var CURSOR = 0.3125; // rem, straal van het cursorbolletje
  var FILL = 250;      // ms voor vullen of leeglopen
  var CLICKABLE = 'a[href], button, [role="button"], [role="switch"], [data-theme-toggle], [data-menu-toggle], [data-faq-question], label[for], summary, select, input[type="submit"], input[type="button"]';

  var root = document.documentElement;
  var css = document.createElement('style');
  css.textContent = 'html.has-dot-cursor, html.has-dot-cursor * { cursor: none !important; }';
  document.head.appendChild(css);

  var canvas = document.createElement('canvas');
  canvas.className = 'cursor-dot';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var dpr = 1, W = 0, H = 0, rem = 16;
  var px = 0, py = 0, inside = false, queued = false;
  /* vulling: fill loopt van 0 (open) tot 1 (gevuld); from/goal/start voor de lopende ease */
  var fill = 0, from = 0, goal = 0, start = 0;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    rem = parseFloat(getComputedStyle(root).fontSize) || 16;
    queue();
  }

  function setGoal(g) {
    if (g === goal) return;
    from = fill; goal = g; start = performance.now();
    queue();
  }
  /* staat de cursor boven iets klikbaars? */
  function check(el) {
    setGoal(el && el.closest && el.closest(CLICKABLE) ? 1 : 0);
  }

  function draw(now) {
    queued = false;
    var animating = false;
    if (fill !== goal) {
      var t = Math.min(1, (now - start) / FILL);
      fill = from + (goal - from) * easeOut(t);
      if (t < 1) animating = true; else fill = goal;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (inside) {
      /* op het lichte deel van de hero-gradient wordt het bolletje diapositief */
      var dia = window.kerjaHaze && window.kerjaHaze.dia(px, py);
      var c = getComputedStyle(root).getPropertyValue(dia ? '--bright-blue' : '--light').trim() || (dia ? '#2e0cf2' : '#eae3da');
      var r = CURSOR * rem;
      if (fill > 0) {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(px, py, r * fill, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = c;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
    }
    if (animating) queue();
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(draw); } }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    px = e.clientX; py = e.clientY;
    if (!inside) { inside = true; root.classList.add('has-dot-cursor'); }
    check(e.target);
    queue();
  }, { passive: true });
  /* bij scrollen schuift de pagina onder een stilstaande cursor door: opnieuw kijken wat eronder ligt */
  window.addEventListener('scroll', function () {
    if (inside) check(document.elementFromPoint(px, py));
  }, { passive: true });
  document.addEventListener('mouseleave', function () { inside = false; setGoal(0); fill = 0; queue(); });
  /* kleur bijwerken als light/dark mode wisselt terwijl de muis stilstaat */
  new MutationObserver(queue).observe(root, { attributes: true, attributeFilter: ['class'] });
  /* de hero-gradient meldt het als de kleur onder de cursor omslaat */
  window.addEventListener('kerja-haze', queue);
})();

/* Coming soon: menuknop met data-coming-soon (nu: work).
   Een klik doet niets (het menu blijft open). Met een muis volgt een vlakje in de stijl van de
   menuknop de cursor, rechtsonder, met de tekst "coming soon" (zelfde classes als het reviews-label).
   Zonder muis staat dat vlakje vast onderin de knop.
   Weer laten werken: haal data-coming-soon weg van de link in het Menu-component. */
(function () {
  var a = document.querySelector('[data-coming-soon]');
  if (!a) return;
  a.setAttribute('aria-disabled', 'true');
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-coming-soon]')) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  var OFFSET = 0.75; // rem rechtsonder de cursor
  var l = document.createElement('div');
  l.className = 'reviews_label';
  l.setAttribute('aria-hidden', 'true');
  l.innerHTML = '<div class="menu_cell-frame"></div><div class="menu_cell-dot is-tl"></div><div class="menu_cell-dot is-tr"></div>' +
    '<div class="menu_cell-dot is-bl"></div><div class="menu_cell-dot is-br"></div><span class="menu_label">coming soon</span>';
  // Zonder muis (telefoon, tablet): het vlakje staat vast onderin de knop en gaat mee met het menu.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    l.style.cssText = 'position:absolute;left:0;top:auto;bottom:0;z-index:2;opacity:1;transform:none';
    a.appendChild(l);
    return;
  }
  document.body.appendChild(l);
  function rem() { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; }
  a.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var o = OFFSET * rem();
    l.style.transform = 'translate3d(' + (e.clientX + o) + 'px,' + (e.clientY + o) + 'px,0)';
    l.style.opacity = '1';
  });
  a.addEventListener('pointerleave', function () { l.style.opacity = '0'; });
  window.addEventListener('scroll', function () { l.style.opacity = '0'; }, { passive: true });
})();

/* Hero-gradient en korrel: een abstracte, korrelige gradient achter de hero ([data-haze]).
   - WebGL: drie donkere massa's en een lichtvlek, met korrel die ±12 keer per seconde ververst
   - ademen: de vormen zwellen langzaam op en af, elk in een eigen tempo (± 20 s)
   - volgen: de middelste massa en een zachte lichtvlek volgen de muis, met veel vertraging (EASE)
   - light mode (html.theme-light): de gradient draait om in ± 0,8 s; de lichtste toon wordt creme
   - diapositief: logo, payoff, switch, begroeting, lijnen, teksten en elk woord van de kop kijken
     wat er onder hun midden ligt. Op het lichte deel krijgen ze is-haze-dia (kleuren omgewisseld,
     zie kerja.css). Ook het cursorbolletje doet mee (window.kerjaHaze.dia).
   - alleen tekenen als de hero in beeld is; bij 'reduced motion' een stilstaand beeld
   - zonder WebGL: een gewone CSS-gradient
   - doorloop: [data-haze] steekt in Webflow onder de hero uit (bottom negatief). De vormen blijven
     op de hero afgestemd; onderaan lost de gradient op in de korrelige achtergrond
   - korrel over de hele pagina, op elke pagina: een vaste laag (.haze-grain) met dezelfde korrel
     op de achtergrondkleur. Vier tegels per thema, ±12 keer per seconde gewisseld.
   - data-haze="subtle" (vervolgpagina's): zelfde gradient, maar het licht is zwak en zit bovenaan
     en de basis is donkerder (L_AMT, L_Y, L_W, GLOW, BASE)
   - olievlek bij de pagina-overgang: zie kerjaHaze.grow/sink (OIL ms)
   - parallax: de gradient scrolt trager dan de pagina (PARALLAX); de korrel op body staat stil
   - uitvloeien: tijdens het scrollen breidt de vlek zelf vloeiend uit (SPR_*, VEL_WARP), naast de parallax
   - op de maat: speelt de muziek, dan krijgt de vlek op elke tel een duw in een willekeurige richting en
     veert hij na als vloeistof (BEAT_KICK, BEAT_SWELL, BEAT_WARP2, BEAT_PHASE, BEAT_STIFF, BEAT_DAMP, BEAT_SPREAD)
   - wegduwen: de lichtvlek en de muisgloed schuiven weg van de tekstblokken (PUSH, PUSH_R, PUSH_EASE).
     Staat uit (PUSH = 0), net als de donkere ondergrond (TEXT_SHADE = 0): de vrije gradient is gekozen,
     leesbaarheid komt van diapositief. Zet ze op 1 om ze weer aan te zetten.
   - leesbaarheid: onder de tekstblokken (BLOCKS, FIXED_BLOCKS) legt de gradient een zachte donkere
     massa (TEXT_SHADE); het licht wijkt daardoor uit naar de lege delen. In light mode wordt dat licht.
     (FADE_FROM: waar het oplossen begint, in hero-hoogtes vanaf de onderkant van de hero)
   Aanpassen: de vormen staan twee keer, in de shader en in field(). Houd die gelijk. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var light = function () { return root.classList.contains('theme-light'); };
  var GRAIN = .14;           // sterkte van de korrel, op de gradient en op de achtergrond (was .24)
  var G = GRAIN.toFixed(3);  // dezelfde waarde als tekst, voor in de shader

  /* korrel over de hele pagina: tegels met precies de kleuren van de shader */
  function ramp(v, light) {
    var c0 = light ? [.918, .89, .855] : [.933, .941, 1], c1 = [.682, .714, .98], c2 = [.298, .235, .949], c3 = [.18, .047, .949], c4 = [.086, .024, .525];
    var m = function (a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };
    if (v < .35) return m(c0, c1, v / .35);
    if (v < .62) return m(c1, c2, (v - .35) / .27);
    if (v < .82) return m(c2, c3, (v - .62) / .2);
    return m(c3, c4, (v - .82) / .18);
  }
  /* De korrel ligt op een vaste laag achter alles (.haze-grain). Eén tegel per thema; de laag
     verspringt ±12 keer per seconde een willekeurig stukje (transform). Dat doet de videokaart zonder
     opnieuw te tekenen, en het ziet eruit als steeds nieuwe ruis. (Eerder stond de korrel als vaste
     achtergrond op body: die moest bij elke scrollstap opnieuw getekend worden en maakte de site traag.)
     Elke korrel is precies een blok hele schermpixels, zodat het beeld scherp blijft. */
  var TILE = 128, tiles = { dark: [], light: [] };
  var gdpr = window.devicePixelRatio || 1, CELL = Math.max(1, Math.round(1.5 * gdpr));
  ['dark', 'light'].forEach(function (mode) {
    for (var k = 0; k < 1; k++) {
      var small = document.createElement('canvas'); small.width = small.height = TILE;
      var sx = small.getContext('2d'), img = sx.createImageData(TILE, TILE);
      for (var i = 0; i < TILE * TILE; i++) {
        var n = Math.random();
        var v = mode === 'light' ? Math.max(0, (n - .5) * GRAIN) : .82 + (n - .5) * GRAIN;
        var col = ramp(v, mode === 'light');
        img.data[i * 4] = col[0] * 255; img.data[i * 4 + 1] = col[1] * 255; img.data[i * 4 + 2] = col[2] * 255; img.data[i * 4 + 3] = 255;
      }
      sx.putImageData(img, 0, 0);
      var big = document.createElement('canvas'); big.width = big.height = TILE * CELL;
      var bx2 = big.getContext('2d'); bx2.imageSmoothingEnabled = false;
      bx2.drawImage(small, 0, 0, TILE * CELL, TILE * CELL);
      tiles[mode].push(null);
      (function (m, idx) {
        big.toBlob(function (blob) { if (blob) { tiles[m][idx] = 'url(' + URL.createObjectURL(blob) + ')'; grain(); } });
      })(mode, k);
    }
  });
  /* doorzichtige korrel voor het matglas van het menu (kerja.css: --kerja-grain) */
  (function () {
    var N = 128, c = document.createElement('canvas'); c.width = c.height = N;
    var x = c.getContext('2d'), img = x.createImageData(N, N);
    for (var i = 0; i < N * N; i++) {
      var n = Math.random(), lightDot = n > .5;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = lightDot ? 255 : 0;
      img.data[i * 4 + 3] = Math.round(Math.abs(n - .5) * 2 * 255 * GRAIN * .55);
    }
    x.putImageData(img, 0, 0);
    c.toBlob(function (blob) { if (blob) root.style.setProperty('--kerja-grain', 'url(' + URL.createObjectURL(blob) + ')'); });
  })();
  var TS = TILE * CELL / gdpr;   // maat van een tegel in CSS-pixels
  var grainLayer = document.createElement('div');
  grainLayer.className = 'haze-grain';
  grainLayer.setAttribute('aria-hidden', 'true');
  grainLayer.style.cssText = 'position:fixed;top:' + (-TS) + 'px;left:' + (-TS) + 'px;right:0;bottom:0;z-index:-2;pointer-events:none;will-change:transform;background-repeat:repeat;background-size:' + TS + 'px ' + TS + 'px;';
  document.body.insertBefore(grainLayer, document.body.firstChild);
  function grain() {
    var t = tiles[light() ? 'light' : 'dark'][0];
    if (t) grainLayer.style.backgroundImage = t;
  }
  var STEP = CELL / gdpr;   // verspringen in hele korrels, zodat het scherp blijft
  if (!reduce) setInterval(function () {
    var n = TILE;
    grainLayer.style.transform = 'translate3d(' + (Math.floor(Math.random() * n) * STEP) + 'px,' + (Math.floor(Math.random() * n) * STEP) + 'px,0)';
  }, 83);
  new MutationObserver(grain).observe(root, { attributes: true, attributeFilter: ['class'] });

  /* zonder gradient op de pagina: overgang zonder olievlek (zie verderop voor de echte) */
  window.kerjaHaze = {
    dia: function () { return false; },
    grow: function (done) { if (done) done(); },
    sink: function (done) { if (done) done(); },
    show: function () {},
    preload: function (done) { if (done) done(); }
  };

  var host = document.querySelector('[data-haze]');
  if (!host) { root.classList.remove('pt-oil'); return; }
  var hero = host.parentElement;
  /* Home: volle gradient. data-haze="subtle" (vervolgpagina's): het licht alleen zwak, bovenaan */
  var SUBTLE = host.getAttribute('data-haze') === 'subtle';
  var L_AMT = SUBTLE ? .45 : 1.05, L_Y = SUBTLE ? 1.02 : .7, L_W = SUBTLE ? .55 : .42, GLOW = SUBTLE ? .1 : .28;
  var BASE = SUBTLE ? .68 : .5;   // hoger = donkerder basis
  var mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var EASE = 0.035;          // volgsnelheid per frame (lager = trager; was .025)
  var FOLLOW = 0.24;         // hoe ver de middelste massa de muis volgt (was .16)
  var FOLLOW_LOW = [0.1, 0.05]; // idem voor de onderste massa, x en y (was .07 en .03)
  var REST = [0.62, 0.48];   // rustpositie van het volgpunt (0-1 in de hero, y van onder)
  var PARALLAX = 0.55;      // gradient blijft 55% achter bij het scrollen (0 = uit)
  /* uitvloeien bij scrollen: de olievlek zelf breidt uit, bovenop de parallax.
     spr (0-1) volgt de scrollpositie: na SPR_DIST schermhoogtes is hij helemaal uitgevloeid.
     vel volgt de scrollsnelheid en geeft een extra golving die rustig wegebt als je stilstaat. */
  var SPR_DIST = 1.2;       // schermhoogtes scroll tot volledig uitgevloeid
  var SPR_GROW = 0.7;       // de donkere massa wordt tot 70% groter en schuift naar buiten
  var SPR_WARP = 0.075;     // vloeiende vervorming van de vorm bij uitvloeien
  var VEL_WARP = 0.055;     // extra golving tijdens het scrollen
  var SPR_EASE = 0.05;      // hoe traag de vlek de scroll volgt (per beeld, 30 per seconde)
  var spr = 0, vel = 0, lastSY = window.scrollY;
  /* op de maat: als de muziek speelt, zwelt de donkere massa op elke tel kort op (BEAT_GROW) en vloeit
     terug. De tellen komen uit het muziekscript (kerjaMusic.pulse, vooraf berekende maat). */
  /* zelf af te stellen: BEAT_GROW = opzwellen per tel (.08 = 8%), BEAT_WARP = vervormen per tel; 0 = niet.
     De footer heeft eigen waarden (FOOT_BEAT_GROW, FOOT_BEAT_WARP); naklinken = BEAT_DECAY in het muziekscript. */
  var BEAT_GROW = 0, BEAT_WARP = 0, beat = 0;   // oude, gelijkmatige pomp: uit (was .1 en .02)
  /* op de maat, organisch: elke tel geeft de vlek een duw in een willekeurige richting. Zware bastellen
     duwen harder. De drie delen van de vlek reageren elk met een kleine vertraging en een eigen richting,
     en veren na als vloeistof (een veer met demping). Afgesteld in de Beat Tuner-preview.
     BEAT_KICK   = hoe ver de vlek per tel verschuift (deel van de hero-hoogte); 0 = niet
     BEAT_SWELL  = hoeveel groter een deel per tel even wordt (.3 = 30%)
     BEAT_WARP2  = hoe sterk de rand per tel golft
     BEAT_PHASE  = hoe anders de vorm per tel vervormt (toeval)
     BEAT_STIFF  = veerkracht: hoger = sneller terug, strakker
     BEAT_DAMP   = demping: lager = langer nazwiepen
     BEAT_SPREAD = hoe los de drie delen van elkaar reageren (vertraging en richting) */
  var BEAT_KICK = 0.14, BEAT_SWELL = 0.3, BEAT_WARP2 = 0.08, BEAT_PHASE = 1.2, BEAT_STIFF = 28, BEAT_DAMP = 3.2, BEAT_SPREAD = 0.6;
  var bD = [[0, 0], [0, 0], [0, 0]], bV = [[0, 0], [0, 0], [0, 0]], bS = [0, 0, 0], bSV = [0, 0, 0];
  var bW = 0, bWV = 0, bPH = 0, bPV = 0, bQueue = [], bLast = -1, bTime = 0;
  function beatHit(str, now) {
    var th = Math.random() * Math.PI * 2, w = Math.sqrt(BEAT_STIFF);
    for (var k = 0; k < 3; k++) bQueue.push({ at: now + k * BEAT_SPREAD * 140, k: k, th: th + (Math.random() - .5) * BEAT_SPREAD * Math.PI * 1.4, s: str * (.6 + .8 * Math.random()) * (k ? .85 : 1) });
    bWV += BEAT_WARP2 * str * (.5 + Math.random()) * w;
    bPV += (Math.random() - .5) * 2 * BEAT_PHASE * str * w * .6;
  }
  function beatPhysics(dt, now) {
    var w = Math.sqrt(BEAT_STIFF);
    for (var q = bQueue.length - 1; q >= 0; q--) {
      var e = bQueue[q]; if (now < e.at) continue; bQueue.splice(q, 1);
      bV[e.k][0] += Math.cos(e.th) * BEAT_KICK * e.s * w; bV[e.k][1] += Math.sin(e.th) * BEAT_KICK * e.s * w;
      bSV[e.k] += BEAT_SWELL * e.s * w;
    }
    var n = 6, h = dt / n;
    for (var j = 0; j < n; j++) {
      for (var k = 0; k < 3; k++) {
        for (var c = 0; c < 2; c++) { bV[k][c] += (-BEAT_STIFF * bD[k][c] - BEAT_DAMP * bV[k][c]) * h; bD[k][c] += bV[k][c] * h; }
        bSV[k] += (-BEAT_STIFF * bS[k] - BEAT_DAMP * bSV[k]) * h; bS[k] += bSV[k] * h;
      }
      bWV += (-BEAT_STIFF * bW - BEAT_DAMP * bWV) * h; bW += bWV * h;
      bPV *= Math.exp(-1.5 * h); bPH += bPV * h;
    }
  }
  var PUSH = 0;             // hoe ver het licht wijkt (0 = uit; 1 = tot de rand van de vlek het blok raakt)
  var PUSH_R = .9;           // welk deel van de vlek als 'rand' telt (lager = licht mag dichterbij)
  var PUSH_EASE = .04;       // hoe snel het licht wegschuift
  var TEXT_SHADE = 0;        // hoe sterk de gradient onder tekst donker (light: licht) wordt (0 = uit, 1 = aan)
  var FADE_FROM = 0.2;       // oplossen begint 20% van de hero-hoogte boven de onderkant van de hero

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  host.appendChild(canvas);
  var gl = canvas.getContext('webgl', { antialias: false });

  /* doelen voor diapositief: woorden van de kop als losse spans (zelfde classes als de pagina-overgang) */
  function words(block) {
    var ws = block.querySelectorAll('.word-hover_word, .pt-word');
    if (ws.length) return Array.prototype.slice.call(ws);
    var out = [];
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'pt-word';
            s.textContent = part;
            frag.appendChild(s);
            out.push(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') split(child);
      });
    })(block);
    return out;
  }
  var targets = [];
  function collect() {
    targets = [];
    Array.prototype.forEach.call(document.querySelectorAll('.hero_logo, .hero_payoff, .theme-switch_component'), function (el) { targets.push(el); });
    Array.prototype.forEach.call(hero.querySelectorAll('.statement_heading'), function (h) { targets = targets.concat(words(h)); });
    Array.prototype.forEach.call(hero.querySelectorAll('[data-greeting], .heading-style-h6, .dots-line_component, .text-size-small, .email_link, .volume_component, p:not(.statement_heading)'), function (el) {
      if (targets.indexOf(el) < 0 && !el.querySelector('.pt-word, .word-hover_word')) targets.push(el);
    });
    targets.forEach(function (el) { el.classList.add('haze-target'); });
  }
  collect();
  /* het logo wordt vervangen door inline SVG en de pagina-overgang knipt de kop opnieuw in woorden:
     zodra een doel niet meer op de pagina staat, opnieuw verzamelen (zie update) */
  function stale() { for (var i = 0; i < targets.length; i++) if (!targets[i].isConnected) return true; return false; }

  /* tekstblokken waar de gradient voor uitwijkt: onder deze blokken komt een zachte donkere massa
     (in light mode een lichte), zodat tekst altijd op een rustige ondergrond staat */
  var NB = 10, PAD = 12, SOFT = 150;  // max. aantal blokken, marge en uitloop van de zachte vlek in px
  var BLOCKS = '.statement_heading, .section-title_component, .hero_statement, .email_link, .services-hero_content, .connect-hero_content, .faq-hero_nav';
  var FIXED_BLOCKS = '.hero_logo, .hero_payoff';
  var boxGoal = new Float32Array(NB * 4), box = new Float32Array(NB * 4), soft = .08;
  for (var bi = 0; bi < NB; bi++) { boxGoal[bi * 4 + 2] = -1; box[bi * 4 + 2] = -1; }
  function measureBoxes(r) {
    var els = Array.prototype.slice.call(document.querySelectorAll(FIXED_BLOCKS)).concat(Array.prototype.slice.call(hero.querySelectorAll(BLOCKS)));
    var n = 0, H = r.height || 1;
    soft = SOFT / H;
    for (var i = 0; i < els.length && n < NB; i++) {
      var b = els[i].getBoundingClientRect();
      if (!b.width || !b.height || b.bottom < r.top || b.top > r.bottom) continue;
      var o = n * 4;
      boxGoal[o] = (b.left + b.width / 2 - r.left) / H;
      boxGoal[o + 1] = 1 - (b.top + b.height / 2 - r.top) / H;
      boxGoal[o + 2] = b.width / 2 / H + PAD / H;
      boxGoal[o + 3] = b.height / 2 / H + PAD / H;
      if (box[o + 2] < 0) { box[o] = boxGoal[o]; box[o + 1] = boxGoal[o + 1]; box[o + 2] = boxGoal[o + 2]; box[o + 3] = boxGoal[o + 3]; }
      n++;
    }
    for (; n < NB; n++) { boxGoal[n * 4 + 2] = -1; box[n * 4 + 2] = -1; }
  }
  /* wegduwen: de lichtvlek (en de muisgloed) schuift weg van de tekstblokken, als een magneet die
     afstoot. rx/ry = straal van de vlek; overlapt die een blok, dan schuift het midden zo ver weg
     dat de rand het blok net raakt (PUSH). Drie rondes, zodat meerdere blokken samen tellen. */
  var lc = [0, 0], gc = [0, 0], pushStarted = false;
  function push(x, y, rx, ry) {
    for (var it = 0; it < 3; it++) {
      for (var i = 0; i < NB; i++) {
        var o = i * 4; if (box[o + 2] <= 0) continue;
        var nx = Math.min(Math.max(x, box[o] - box[o + 2]), box[o] + box[o + 2]);
        var ny = Math.min(Math.max(y, box[o + 1] - box[o + 3]), box[o + 1] + box[o + 3]);
        var dx = (x - nx) / rx, dy = (y - ny) / ry, len = Math.sqrt(dx * dx + dy * dy);
        if (len >= 1) continue;
        if (len < 1e-4) { dx = x - box[o]; dy = y - box[o + 1]; len = Math.sqrt(dx * dx + dy * dy) || 1; dx /= len; dy /= len; len = 0; }
        else { dx /= len; dy /= len; }
        x += dx * (1 - len) * rx * PUSH; y += dy * (1 - len) * ry * PUSH;
      }
    }
    return [x, y];
  }
  function boxShade(px, py) {
    var m = 0;
    for (var i = 0; i < NB; i++) {
      var o = i * 4; if (box[o + 2] <= 0) continue;
      /* een ronde, zachte vlek (geen rechthoek): ellips met de maat van het blok plus de uitloop */
      var u = (px - box[o]) / (box[o + 2] + soft), w = (py - box[o + 1]) / (box[o + 3] + soft), e = u * u + w * w;
      m = Math.max(m, Math.exp(-e * e * 2.2));
    }
    return m;
  }

  /* veld: dezelfde wiskunde als de shader, zonder korrel. Donkerte op een punt (0 licht, 1 donker) */
  function blob(px, py, cx, cy, sx, sy) { var dx = (px - cx) / sx, dy = (py - cy) / sy; return Math.exp(-(dx * dx + dy * dy)); }
  function field(ux, uy, a, t, mx, my, f) {
    var px = ux * a, py = uy, mmx = mx * a, mmy = my;
    /* uitvloeien: vervormen, groeien en naar buiten schuiven (zelfde wiskunde als de shader) */
    var wk = SPR_WARP * spr + VEL_WARP * vel + BEAT_WARP * beat + bW, tw = t + bPH;
    var wx = Math.sin(py * 2.3 + tw * .21 + spr * 2.6) + .6 * Math.sin(py * 4.1 - tw * .13);
    var wy = Math.cos(px * 1.9 - tw * .17 + spr * 2.1) + .6 * Math.cos(px * 3.7 + tw * .11);
    px += wx * wk; py += wy * wk;
    var gs = 1 + SPR_GROW * spr + .06 * vel + BEAT_GROW * beat, go = SPR_GROW * .4 * spr, ox = .5 * a, oy = .45;
    var br = Math.sin(t * .29) * .5 + .5, br2 = Math.sin(t * .19 + 1.7);
    var c1x = .52 * a + (mmx - .52 * a) * FOLLOW_LOW[0] + bD[0][0] * a, c1y = -.18 + (mmy - .5) * FOLLOW_LOW[1] + bD[0][1];
    var c2x = .4 * a + (mmx - .4 * a) * FOLLOW + .035 * Math.sin(t * .21) + bD[1][0] * a, c2y = .5 + (mmy - .5) * FOLLOW + .035 * Math.cos(t * .17) + bD[1][1];
    var c3x = -.05 * a + .04 * Math.sin(t * .13) + bD[2][0] * a, c3y = .45 + .04 * Math.cos(t * .11) + bD[2][1];
    var g1 = gs * (1 + bS[0]), g2 = gs * (1 + bS[1]), g3 = gs * (1 + bS[2]);
    var d = blob(px, py, c1x + (c1x - ox) * go, c1y + (c1y - oy) * go, .62 * a * (1 + .05 * br) * g1, .62 * (1 + .05 * br) * g1) * 1.15;
    d += blob(px, py, c2x + (c2x - ox) * go, c2y + (c2y - oy) * go, .26 * (1 + .07 * br2) * g2, .28 * (1 + .07 * br2) * g2) * .85;
    d += blob(px, py, c3x + (c3x - ox) * go, c3y + (c3y - oy) * go, .38 * a * g3, .7 * g3) * .55;
    d += boxShade(px, py) * TEXT_SHADE;
    var l = blob(px, py, lc[0], lc[1], L_W * a * (1 + .06 * br), .36 * (1 + .06 * br)) * L_AMT;
    var s = Math.min(1, Math.max(0, (ux * .6 + uy * .4 - .2) / .8)); l += (SUBTLE ? 0 : .25) * s * s * (3 - 2 * s);
    l += GLOW * blob(px, py, gc[0], gc[1], .42, .42);
    var v = Math.min(1, Math.max(0, BASE + d * .82 - l * .72));
    return v + (1 - 2 * v) * f;
  }

  var U = {};
  if (gl) {
    var fs = [
      'precision highp float;',
      'uniform vec2 res;uniform float t;uniform vec2 m;uniform float seed;uniform float grain;uniform float flip;uniform float frac;uniform float fadeFrom;uniform vec4 lt;uniform float base;uniform vec4 bx[10];uniform float soft;uniform float shade;uniform vec2 lc;uniform vec2 gc;uniform float heroA;uniform float oilOn;uniform float oilP;uniform float oilUnder;uniform float hostTop;uniform float hostH;uniform float sp;uniform float sv;uniform float bt;uniform vec2 o1;uniform vec2 o2;uniform vec2 o3;uniform vec3 sg;uniform float bw;uniform float ph;',
      'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
      'float blob(vec2 p,vec2 c,vec2 s){vec2 d=(p-c)/s;return exp(-dot(d,d));}',
      'vec3 ramp(float v,float cr){',
      '  vec3 c0=mix(vec3(.933,.941,1.),vec3(.918,.89,.855),cr),c1=vec3(.682,.714,.98),c2=vec3(.298,.235,.949),c3=vec3(.18,.047,.949),c4=vec3(.086,.024,.525);',
      '  if(v<.35)return mix(c0,c1,v/.35);',
      '  if(v<.62)return mix(c1,c2,(v-.35)/.27);',
      '  if(v<.82)return mix(c2,c3,(v-.62)/.2);',
      '  return mix(c3,c4,(v-.82)/.18);}',
      // scene: de gradient op een punt van de laag (cv: 0-1 over de hele laag, y van onder).
      // Geeft de waarde v (0 licht, 1 donker, al omgedraaid in light mode) en het oplossen f onderaan.
      'float scene(vec2 cv,out float f){',
      '  vec2 uv=vec2(cv.x,(cv.y-(1.-frac))/frac);float a=heroA;vec2 p=vec2(uv.x*a,uv.y);vec2 mm=vec2(m.x*a,m.y);',
      // uitvloeien bij scrollen (sp = positie, sv = snelheid): vervormen, groeien, naar buiten schuiven
      '  float wk=' + SPR_WARP.toFixed(3) + '*sp+' + VEL_WARP.toFixed(3) + '*sv+' + BEAT_WARP.toFixed(3) + '*bt+bw;float tw=t+ph;',
      '  p+=vec2(sin(p.y*2.3+tw*.21+sp*2.6)+.6*sin(p.y*4.1-tw*.13),cos(p.x*1.9-tw*.17+sp*2.1)+.6*cos(p.x*3.7+tw*.11))*wk;',
      '  float gs=1.+' + SPR_GROW.toFixed(3) + '*sp+.06*sv+' + BEAT_GROW.toFixed(3) + '*bt;float go=' + (SPR_GROW * .4).toFixed(3) + '*sp;vec2 O=vec2(.5*a,.45);',
      '  float br=sin(t*.29)*.5+.5;float br2=sin(t*.19+1.7);',
      '  vec2 c1=vec2(.52*a,-.18)+(mm-vec2(.52*a,.5))*vec2(' + FOLLOW_LOW[0].toFixed(3) + ',' + FOLLOW_LOW[1].toFixed(3) + ')+o1*vec2(a,1.);',
      '  vec2 c2=vec2(.4*a,.5)+(mm-vec2(.4*a,.5))*' + FOLLOW.toFixed(3) + '+.035*vec2(sin(t*.21),cos(t*.17))+o2*vec2(a,1.);',
      '  vec2 c3=vec2(-.05*a,.45)+.04*vec2(sin(t*.13),cos(t*.11))+o3*vec2(a,1.);',
      '  float d=blob(p,c1+(c1-O)*go,vec2(.62*a,.62)*(1.+.05*br)*gs*(1.+sg.x))*1.15;',
      '  d+=blob(p,c2+(c2-O)*go,vec2(.26,.28)*(1.+.07*br2)*gs*(1.+sg.y))*.85;',
      '  d+=blob(p,c3+(c3-O)*go,vec2(.38*a,.7)*gs*(1.+sg.z))*.55;',
      // onder tekstblokken (bx = midden en halve maat) een zachte donkere massa
      '  float tb=0.;for(int i=0;i<10;i++){vec4 b=bx[i];if(b.z>0.){vec2 q=(p-b.xy)/(b.zw+soft);float e=dot(q,q);tb=max(tb,exp(-e*e*2.2));}}',
      '  d+=tb*shade;',
      // lt = (sterkte, hoogte, breedte, gloed van de muis); lc en gc = midden van lichtvlek en muisgloed
      '  float l=blob(p,lc,vec2(lt.z*a,.36)*(1.+.06*br))*lt.x;',
      '  l+=(lt.x<.5?0.:.25)*smoothstep(.2,1.,uv.x*.6+uv.y*.4);',
      '  l+=lt.w*blob(p,gc,vec2(.42,.42));',
      '  float v=clamp(base+d*.82-l*.72,0.,1.);',
      '  v=mix(v,1.-v,flip);',
      '  float ext=(1.-frac)/frac;',
      '  f=ext>0.?clamp((fadeFrom-uv.y)/(fadeFrom+ext),0.,1.):0.;',
      '  f=f*f*(3.-2.*f);',
      '  return v;}',
      // de rand van de olievlek: vloeiende golven, sommige delen lopen voor
      'float front(float x){',
      '  return (.55*sin(x*5.1+t*1.3)+.35*sin(x*9.7-t*1.9+1.3)+.25*sin(x*2.3+t*.7+2.1)+.15*sin(x*17.-t*2.6))*.09;}',
      'void main(){',
      '  vec2 cell=floor(gl_FragCoord.xy/grain);float g=hash(cell+seed);',
      '  float bv=flip>.5?max(0.,(hash(cell*2.9+seed)-.5)*' + G + '):.82+(hash(cell*2.9+seed)-.5)*' + G + ';',
      '  if(oilOn<.5){',
      // gewone stand: de laag ligt in de hero
      '    float f;float v=scene(gl_FragCoord.xy/res,f);',
      '    v=clamp(v+(g-.5)*' + G + ',0.,1.);',
      '    vec3 col=ramp(v,flip)*(1.+(hash(cell*1.7+seed+3.1)-.5)*.05);',
      '    f=clamp(f+(hash(cell*2.3+seed+7.7)-.5)*.5*f*(1.-f)*4.,0.,1.);',
      '    gl_FragColor=vec4(mix(col,ramp(bv,flip),f),1.);return;}',
      // olievlek: de laag beslaat het hele venster; de pagina is de vloeistof
      '  vec2 s=gl_FragCoord.xy/res;float A=res.x/res.y;',
      '  float H=oilP*1.35-.2+front(s.x*A)*(1.-abs(oilP*2.-1.)*.6);',
      // binnen de vlek: alles wat in beeld was, samengedrukt tot de hoogte van de vlek
      '  float sy=s.y/max(min(H,1.),.001);',
      '  float top=(1.-sy)*res.y-hostTop;',
      '  vec2 cv=vec2(s.x,1.-top/hostH);',
      '  float f=1.;float v=(cv.y>=0.&&cv.y<=1.)?scene(cv,f):0.;',
      '  float pagebg=flip>.5?0.:.82;',
      '  v=mix(v,pagebg,f);',
      // rand: geen lijn, de vloeistof gaat via zijn eigen kleuren over in de ondergrond
      '  float uv0=oilUnder>.5?0.:.82;',
      '  float e=smoothstep(H-.16,H+.02,s.y+(g-.5)*.06);',
      '  float vv=clamp(mix(v,uv0,e)+(g-.5)*' + G + ',0.,1.);',
      '  float cr=oilUnder>.5?mix(flip,1.,e):flip;',
      '  gl_FragColor=vec4(ramp(vv,cr)*(1.+(hash(cell*1.7+seed+3.1)-.5)*.05),1.);}'
    ].join('\n');
    var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) gl = null;
    else {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['res', 't', 'm', 'seed', 'grain', 'flip', 'frac', 'fadeFrom', 'lt', 'base', 'soft', 'shade', 'bx', 'lc', 'gc', 'heroA', 'oilOn', 'oilP', 'oilUnder', 'hostTop', 'hostH', 'sp', 'sv', 'bt', 'o1', 'o2', 'o3', 'sg', 'bw', 'ph'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    }
  }
  if (!gl) {
    canvas.style.background = 'radial-gradient(60% 60% at 75% 25%, #eef0ff, #aeb6fa 40%, #2e0cf2 75%, #160686)';
  }

  var dpr = 1;
  function size() {
    dpr = 1;   // op CSS-pixels rekenen, niet op Retina: 4x minder werk, de korrel blijft even groot
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }
  size();

  var target = REST.slice(), cur = REST.slice();
  var flip = light() ? 1 : 0, flipGoal = flip, t = 0;
  var cx = -1, cy = -1, cursorDia = false;

  if (mouse && !reduce) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      cx = e.clientX; cy = e.clientY;
      var r = heroRect();
      if (cy < r.top || cy > r.bottom) return;
      target = [(cx - r.left) / r.width, 1 - (cy - r.top) / r.height];
    }, { passive: true });
    document.addEventListener('mouseleave', function () { target = REST.slice(); cx = cy = -1; });
  } else if (mouse) {
    window.addEventListener('pointermove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });
  }
  new MutationObserver(function () { flipGoal = light() ? 1 : 0; if (reduce || (oilOn && oilP < .01)) { flip = flipGoal; kick(); } })
    .observe(root, { attributes: true, attributeFilter: ['class'] });

  /* donkerte op een schermpunt, of -1 als het punt niet op de hero ligt */
  function at(x, y, r) {
    if (y < r.top || y > r.bottom || x < r.left || x > r.right) return -1;
    return field((x - r.left) / r.width, 1 - (y - r.top) / r.height, r.width / r.height, t, cur[0], cur[1], flip);
  }
  window.kerjaHaze.dia = function () { return cursorDia; };
  /* de rechthoek van het hero-deel van de gradient: schuift door de parallax mee met de laag */
  function heroRect() {
    var h = host.getBoundingClientRect(), H = hero.offsetHeight;
    return { left: h.left, right: h.right, width: h.width, top: h.top, bottom: h.top + H, height: H };
  }

  /* diapositief nodig? dark mode: tekst is licht, dus omslaan op licht (v laag).
     light mode: tekst is blauw, dus omslaan op donker (v hoog). Met marge tegen flikkeren. */
  function wantDia(v, on) {
    if (v < 0) return false;
    var other = flip > .5 ? v : 1 - v;   // hoe sterk de ondergrond afwijkt van de gewone achtergrond
    return on ? other > .44 : other > .56;
  }
  function update() {
    if (stale()) collect();
    var r = heroRect();
    measureBoxes(r);
    if (!pushStarted) {
      pushStarted = true;
      var asp0 = r.width / Math.max(1, r.height);
      lc = push(.74 * asp0, L_Y, L_W * asp0 * PUSH_R, .36 * PUSH_R);
      gc = push(cur[0] * asp0 + .08, cur[1] + .06, .42 * PUSH_R, .42 * PUSH_R);
    }
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i], b = el.getBoundingClientRect();
      var v = at(b.left + b.width / 2, b.top + b.height / 2, r);
      var on = el.classList.contains('is-haze-dia');
      var want = wantDia(v, on);
      if (want !== on) el.classList.toggle('is-haze-dia', want);
    }
    var c = cx < 0 ? -1 : at(cx, cy, r);
    var next = wantDia(c, cursorDia);
    if (next !== cursorDia) { cursorDia = next; window.dispatchEvent(new Event('kerja-haze')); }
  }

  /* Olievlek (pagina-overgang): de gradient zelf is de vloeistof. Tijdens de overgang wordt de laag
     even vast over het hele venster gelegd (oilOn). Bij vertrek loopt de pagina als vloeistof weg naar
     de onderrand: alles in beeld wordt samengedrukt tot de hoogte van de vlek, en aan de golvende rand
     gaat de gradient via zijn eigen kleuren over in de ondergrond (in dark mode creme, in light mode
     blauw). Bij aankomst welt hij van onderen op en stroomt naar zijn plek. Bij de light/dark-wissel
     groeit de nieuwe pagina terug over een ondergrond in de eigen achtergrondkleur.
     OIL ms per beweging. */
  var OIL = 1200;
  var oilOn = false, oilP = 1, oilUnder = 1;
  function oilMode(on) {
    if (on === oilOn) return;
    oilOn = on;
    if (on) {
      canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:9990;pointer-events:none;';
      document.body.appendChild(canvas);
    } else {
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
      host.appendChild(canvas);
    }
    size();
  }
  function inOut(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function runOil(to, under, done) {
    oilUnder = under;
    if (reduce || !gl) { oilP = to; oilMode(false); root.classList.remove('pt-oil'); if (done) done(); return; }
    oilMode(true);
    kick();
    /* tijd per beeld begrensd (max 50 ms): hapert de browser even (bijvoorbeeld zware WebGL op de
       pagina), dan loopt de olievlek even trager in plaats van in een keer naar het eind te springen */
    var from = oilP, el = 0, last = performance.now();
    (function step(now) {
      el += Math.min(Math.max(now - last, 0), 50); last = now;
      var k = Math.min(1, el / OIL);
      oilP = from + (to - from) * inOut(k);
      if (k < 1) { requestAnimationFrame(step); return; }
      if (to >= 1) { oilMode(false); window.dispatchEvent(new Event('kerja-oil-done')); }
      if (done) done();
    })(last);
  }
  /* ondergrond: 'opposite' = de andere kleur dan het huidige thema, 'same' = de eigen achtergrond */
  function under(mode) { var l = light(); return (mode === 'same' ? l : !l) ? 1 : 0; }
  window.kerjaHaze.grow = function (done, mode) { runOil(1, under(mode || 'opposite'), done); };
  window.kerjaHaze.sink = function (done) { runOil(0, under('opposite'), done); };
  window.kerjaHaze.show = function () { oilP = 1; oilMode(false); };

  /* Preloader (eerste bezoek in de sessie): de olievlek stijgt zo hoog als de pagina geladen is.
     Een browser kent geen totaal percentage, dus de teller telt echte onderdelen af:
     - de lettertypes (document.fonts.ready)
     - elke afbeelding die bij het laden in beeld staat
     - de volledige pagina (window load)
     De gradient zelf is dan al klaar (dit script draait). Tussen twee afgevinkte onderdelen loopt de
     vlek zacht door, nooit sneller dan PRE_MIN ms voor de hele weg; na PRE_MAX ms gaat hij hoe dan ook door.
     Teller linksonder op de plek van de menuknop (.kerja-preload, kerja.css), met ernaast de wisselende
     begroetingen van Home (GREET_STEP ms); samen wisselen ze van kleur als de olie ze passeert. Op 100: teller weg, de vlek stroomt door tot het scherm vol is (OIL ms),
     dan de opbouw van de pagina. Bij 'reduced motion' of zonder WebGL: meteen door. */
  var PRE_MIN = 1200, PRE_MAX = 10000;
  window.kerjaHaze.preload = function (done) {
    if (reduce || !gl) { window.kerjaHaze.grow(done); return; }
    oilUnder = under('opposite'); oilP = 0; oilMode(true); kick();
    var box = document.createElement('div');
    box.className = 'kerja-preload';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<p class="kerja-preload_count">0</p><p class="kerja-preload_greet">Hello</p>';
    document.body.appendChild(box);
    var count = box.firstChild, greetEl = box.lastChild;

    /* begroetingen naast de teller: eerst Hello, dan om de GREET_STEP ms een willekeurige uit HELLO
       (paginaovergang), nooit twee keer dezelfde achter elkaar. Stopt op 100. */
    var G = window.kerjaGreetings || { hello: [], lang: {} }, gLast = 'Hello', GREET_STEP = 320;
    var gTimer = G.hello.length > 1 ? setInterval(function () {
      var opts = G.hello.filter(function (x) { return x !== gLast; });
      gLast = opts[Math.floor(Math.random() * opts.length)];
      greetEl.textContent = gLast;
      var l = G.lang[gLast];
      if (l) greetEl.setAttribute('lang', l); else greetEl.removeAttribute('lang');
      if (l === 'ar') greetEl.setAttribute('dir', 'rtl'); else greetEl.removeAttribute('dir');
    }, GREET_STEP) : null;

    var total = 2, ready = 0;
    function tick() { ready++; }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(tick, tick); else tick();
    if (document.readyState === 'complete') tick(); else window.addEventListener('load', tick, { once: true });
    Array.prototype.forEach.call(document.images, function (img) {
      var r = img.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight || (!r.width && !r.height)) return;
      total++;
      if (img.complete) tick(); else { img.addEventListener('load', tick, { once: true }); img.addEventListener('error', tick, { once: true }); }
    });

    var t0 = performance.now(), last = t0, shown = 0;
    (function step(now) {
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      var loaded = now - t0 > PRE_MAX ? 1 : ready / total;
      var goal = Math.max(0, Math.min(loaded, (now - t0) / PRE_MIN));
      /* zacht naar het doel, maar met een minimumtempo, zodat hij niet blijft hangen op 99 */
      if (goal > shown) shown = Math.min(goal, shown + Math.max((goal - shown) * Math.min(1, dt * 5), dt * .2));
      oilP = (shown + .2) / 1.35;   // zet de rand van de vlek op hoogte 'shown'
      count.textContent = String(Math.floor(shown * 100 + .0001));
      var cr = count.getBoundingClientRect();
      box.classList.toggle('is-on-ground', window.innerHeight * (1 - shown) > cr.top + cr.height / 2);
      if (shown < 1) { requestAnimationFrame(step); return; }
      count.textContent = '100';
      clearInterval(gTimer);
      box.classList.add('is-gone');
      setTimeout(function () { box.remove(); }, 600);
      runOil(1, oilUnder, done);
    })(t0);
  };
  /* aankomst: meteen alleen de ondergrond, de groei start vanuit de pagina-overgang */
  /* kerjaOilIn: de olievlek groeit zo op (de Work-cases wachten daarop, zie work-cases) */
  if (window.kerjaPtEnter && !reduce && gl) { oilP = 0; oilUnder = under('opposite'); oilMode(true); window.kerjaOilIn = true; }
  else root.classList.remove('pt-oil');

  var lastDraw = 0, visible = true, running = false, start = performance.now(), lastSeed = 0, lastUpdate = 0, seed = 7;
  function frame(now) {
    running = false;
    /* hooguit 30 beelden per seconde: ademen en volgen zijn traag genoeg */
    if (!reduce && now - lastDraw < 32) { if (visible || oilOn) kick(); return; }
    lastDraw = now;
    t = reduce ? 4 : (now - start) / 1000;
    var k = reduce ? 1 : EASE;
    cur[0] += (target[0] - cur[0]) * k; cur[1] += (target[1] - cur[1]) * k;
    for (var bj = 0; bj < NB * 4; bj++) box[bj] += (boxGoal[bj] - box[bj]) * (reduce ? 1 : .2);
    var asp = hero.offsetWidth / Math.max(1, hero.offsetHeight);
    var lGoal = push(.74 * asp + .05 * Math.sin(t * .09), L_Y + .05 * Math.cos(t * .12), L_W * asp * PUSH_R, .36 * PUSH_R);
    var gGoal = push(cur[0] * asp + .08, cur[1] + .06, .42 * PUSH_R, .42 * PUSH_R);
    var pk = reduce ? 1 : PUSH_EASE;
    lc[0] += (lGoal[0] - lc[0]) * pk; lc[1] += (lGoal[1] - lc[1]) * pk;
    gc[0] += (gGoal[0] - gc[0]) * pk; gc[1] += (gGoal[1] - gc[1]) * pk;
    flip += (flipGoal - flip) * (reduce ? 1 : 0.06);
    if (!reduce) {
      var sy = window.scrollY, vh = window.innerHeight || 1;
      spr += (Math.min(1, sy / (vh * SPR_DIST)) - spr) * SPR_EASE;
      vel += (Math.min(1, Math.abs(sy - lastSY) / (vh * .04)) - vel) * .12;
      lastSY = sy;
      var bp = window.kerjaMusic && window.kerjaMusic.pulse ? window.kerjaMusic.pulse() : 0;
      beat += (bp - beat) * .6;
      var bh = window.kerjaMusic && window.kerjaMusic.hit ? window.kerjaMusic.hit() : null;
      if (bh && bh.i !== bLast && !bh.late) beatHit(bh.s, now);
      bLast = bh ? bh.i : -1;
      beatPhysics(Math.min(.05, bTime ? (now - bTime) / 1000 : .033), now);
      bTime = now;
    }
    if (Math.abs(flipGoal - flip) < .001) flip = flipGoal;
    if (!reduce && now - lastSeed > 83) { seed = Math.random() * 100; lastSeed = now; }
    if (gl) {
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.t, t);
      gl.uniform2f(U.m, cur[0], cur[1]);
      gl.uniform1f(U.seed, seed);
      gl.uniform1f(U.grain, 1.5 * dpr);
      gl.uniform1f(U.flip, flip);
      gl.uniform1f(U.frac, Math.min(1, hero.offsetHeight / Math.max(1, host.offsetHeight)));
      gl.uniform1f(U.heroA, hero.offsetWidth / Math.max(1, hero.offsetHeight));
      gl.uniform1f(U.oilOn, oilOn ? 1 : 0);
      gl.uniform1f(U.oilP, oilP);
      gl.uniform1f(U.oilUnder, oilUnder);
      if (oilOn) {
        gl.uniform1f(U.hostTop, host.getBoundingClientRect().top * dpr);
        gl.uniform1f(U.hostH, host.offsetHeight * dpr);
      }
      gl.uniform1f(U.fadeFrom, FADE_FROM);
      gl.uniform4f(U.lt, L_AMT, L_Y, L_W, GLOW);
      gl.uniform1f(U.base, BASE);
      gl.uniform4fv(U.bx, box);
      gl.uniform1f(U.soft, soft);
      gl.uniform1f(U.shade, TEXT_SHADE);
      gl.uniform2f(U.lc, lc[0], lc[1]);
      gl.uniform2f(U.gc, gc[0], gc[1]);
      gl.uniform1f(U.sp, spr);
      gl.uniform1f(U.sv, vel);
      gl.uniform1f(U.bt, beat);
      gl.uniform2f(U.o1, bD[0][0], bD[0][1]); gl.uniform2f(U.o2, bD[1][0], bD[1][1]); gl.uniform2f(U.o3, bD[2][0], bD[2][1]);
      gl.uniform3f(U.sg, bS[0], bS[1], bS[2]); gl.uniform1f(U.bw, bW); gl.uniform1f(U.ph, bPH);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (reduce || now - lastUpdate > 250) { update(); lastUpdate = now; }
    if (oilOn && root.classList.contains('pt-oil')) root.classList.remove('pt-oil');
    if (!reduce && (visible || oilOn)) kick();
  }
  /* parallax: de gradient schuift mee met de pagina, maar trager (PARALLAX = deel van de scroll dat
     hij achterblijft). De laag steekt onder de hero uit, dus er komt geen rand in beeld. */
  function parallax() {
    if (reduce) return;
    host.style.transform = 'translate3d(0,' + (window.scrollY * PARALLAX).toFixed(1) + 'px,0)';
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }

  /* buiten beeld niet tekenen; de vaste onderdelen (logo, switch) wel terugzetten */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible) kick(); else update();
    }).observe(host);
  }
  window.addEventListener('scroll', function () { parallax(); if (!visible || reduce) update(); }, { passive: true });
  parallax();
  window.addEventListener('resize', function () { size(); kick(); });
  kick();
})();

/* Zwevende scrollbalk: vervangt de echte scrollbalk (verborgen in kerja.css), zodat er rechts geen
   strook meer is. Positie en lengte volgen de pagina; zichtbaar tijdens scrollen (is-scrolling). */
(function () {
  var bar = document.createElement('div');
  bar.className = 'kerja-scrollbar';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var queued = false;
  function place() {
    queued = false;
    var vh = window.innerHeight, dh = document.documentElement.scrollHeight;
    if (dh <= vh + 1) { bar.style.display = 'none'; return; }
    bar.style.display = '';
    var h = Math.max(32, vh * vh / dh);
    var y = window.scrollY / (dh - vh) * (vh - h);
    bar.style.height = h + 'px';
    bar.style.transform = 'translateY(' + y + 'px)';
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(place); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  if ('ResizeObserver' in window) new ResizeObserver(queue).observe(document.body);
  queue();
})();

/* Muziek ([data-volume]): een eigen vakje rechts tegen de menuknop (Volume-component in de Menu-component),
   dus op elke pagina, en verdwijnt tijdens scrollen mee met het menu. Opent het menu, dan schuift het
   vakje een cel naar rechts en komt de FAQ-knop op zijn plek (CSS in de head).
   - de muziek staat standaard uit: vier stompjes van 3px. Een klik zet hem aan: 2-late.mp3 in een lus,
     fade-in (FADE_IN ms, ease-in), en de vier lijntjes gaan als een equalizer willekeurig op en neer.
     Nog een klik: fade-out (FADE_OUT ms, ease-out), terug naar de stompjes.
   - mouse-over (alleen met een muis): de equalizer beweegt zolang de muis erboven zweeft, ook als de
     muziek uit staat; muis weg en muziek uit: terug naar de stompjes
   - doorspelen: speelt de muziek en ga je naar een andere pagina, dan blijft hij zonder onderbreking
     spelen (zie Doorlopende navigatie hieronder). Het geluid zelf (de kern) zit dan in het bovenste
     venster; de pagina's daarbinnen gebruiken die kern en tonen alleen de knop.
   - de keuze 'aan' en het tijdstip gelden voor het hele bezoek (sessionStorage). Laadt een pagina toch
     opnieuw (verversen, muziek uit tijdens het klikken, of geen doorlopende navigatie mogelijk), dan
     fadet hij uit met de olievlek (LEAVE ms) en speelt hij op de nieuwe pagina verder vanaf hetzelfde punt.
     Laat de browser het geluid daar nog niet toe, dan start hij bij de eerste klik, tik of toets.
   - volume via Web Audio (ook op iPhone in te faden); lukt dat niet, dan via audio.volume
   - bij 'reduced motion' staat de equalizer stil */
(function () {
  var btn = document.querySelector('[data-volume]');
  if (!btn) return;
  var TICK = 170;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bars = Array.prototype.slice.call(btn.querySelectorAll('.volume_bar'));

  /* kern: van het bovenste venster als deze pagina daarin draait, anders een eigen kern */
  var core = null, framed = false;
  try {
    if (window.parent !== window && window.parent.kerjaShell && window.parent.kerjaMusicCore) {
      core = window.parent.kerjaMusicCore;
      framed = true;
    }
  } catch (e) { core = null; }
  if (!core) core = window.kerjaMusicCore = musicCore();
  window.kerjaMusic = core; // leave, pulse en hit, voor de pagina-overgang, de hero en de footer

  btn.setAttribute('role', 'button');
  btn.setAttribute('tabindex', '0');
  btn.setAttribute('aria-label', 'Music');

  /* equalizer: per lijntje een niveau 0 (stompje van 3px) tot 1 (volle hoogte), CSS in de head */
  function level(bar, lvl) { bar.style.setProperty('--lvl', lvl.toFixed(3)); }
  /* de equalizer beweegt als de muziek speelt, en ook zolang de muis boven de knop zweeft (alleen
     apparaten met een muis): een voorproefje, zonder geluid. Muis weg: terug naar de stompjes. */
  var eq = null, shown = false, hover = false;
  function ui(on) {
    shown = on;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    render();
  }
  function render() {
    var on = shown || hover;
    btn.classList.toggle('is-off', !on);
    clearInterval(eq); eq = null;
    if (!on) { bars.forEach(function (b) { level(b, 0); }); return; }
    if (reduce) { bars.forEach(function (b, i) { level(b, [.55, .9, .7, .45][i % 4]); }); return; }
    var tick = function () { bars.forEach(function (b) { level(b, .25 + Math.random() * .75); }); };
    tick();
    eq = setInterval(tick, TICK);
  }
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    btn.addEventListener('mouseenter', function () { if (hover) return; hover = true; if (!shown) render(); });
    btn.addEventListener('mouseleave', function () { hover = false; if (!shown) render(); });
  }
  btn.addEventListener('click', function (e) { e.preventDefault(); core.toggle(); });
  btn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); core.toggle(); }
  });

  /* de knop volgt de kern; bij vertrek van deze pagina afmelden (terug uit de browsercache: weer aanmelden) */
  var off = core.on(ui);
  window.addEventListener('pagehide', function () { off(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) { off(); off = core.on(ui); } });
  /* op een pagina in het bovenste venster: een klik of tik hier telt ook als toestemming voor het geluid */
  if (framed) {
    ['pointerdown', 'keydown', 'touchend'].forEach(function (t) {
      document.addEventListener(t, function (e) { if (!btn.contains(e.target)) core.nudge(); }, true);
    });
  }
  if (!framed) core.init();

  /* het geluid zelf */
  function musicCore() {
    var SRC = 'https://cdn.prod.website-files.com/69fb0ba3e84d63f239880b74/6b0216f1946d00316c778c65_2-late.mp3';
    var VOL = 0.6, FADE_IN = 1600, FADE_OUT = 1000, LEAVE = 1200;
    var KEY_T = 'kerja-music-t-2late', KEY_ON = 'kerja-music-on'; // KEY_T per nummer: geen tijdstip van een ander nummer
    function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

    /* wie luistert er mee (de knop van elke pagina) */
    var subs = [];
    function emit(on) {
      subs.slice().forEach(function (fn) {
        try { fn(on); } catch (e) { subs = subs.filter(function (f) { return f !== fn; }); } // pagina bestaat niet meer
      });
    }

    var audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    var ctx = null, gain = null, triedCors = false;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { audio.crossOrigin = 'anonymous'; triedCors = true; }
    audio.src = SRC;
    audio.addEventListener('error', function () {
      /* Web Audio vraagt CORS; geeft de server dat niet, dan zonder (volume via audio.volume) */
      if (!triedCors || ctx) return;
      triedCors = false;
      audio.removeAttribute('crossorigin');
      audio.src = SRC;
      if (want) start();
    });
    function graph() {
      if (ctx || !triedCors) return;
      try {
        ctx = new AC();
        gain = ctx.createGain();
        gain.gain.value = 0;
        ctx.createMediaElementSource(audio).connect(gain);
        gain.connect(ctx.destination);
      } catch (e) { ctx = null; gain = null; }
    }
    var vol = 0;
    function setVol(v) { vol = v; if (gain) gain.gain.value = v; else audio.volume = Math.max(0, Math.min(1, v)); }
    var fadeId = 0;
    function fade(to, dur, ease, done) {
      var id = ++fadeId, from = vol, t0 = performance.now();
      (function step(now) {
        if (id !== fadeId) return;
        var k = Math.min(1, (now - t0) / dur);
        setVol(from + (to - from) * ease(k));
        if (k < 1) requestAnimationFrame(step); else if (done) done();
      })(t0);
    }
    function easeIn(k) { return k * k * k; }
    function easeOut(k) { return 1 - Math.pow(1 - k, 3); }

    var want = store(KEY_ON) === '1';  // heeft de bezoeker de muziek aangezet? Standaard uit.
    var playing = false, waiting = false, wake = null;
    var resumeAt = parseFloat(store(KEY_T)) || 0;
    audio.addEventListener('loadedmetadata', function () {
      if (resumeAt && resumeAt < audio.duration) { try { audio.currentTime = resumeAt; } catch (e) {} }
    });
    function save() { if (audio.currentTime) store(KEY_T, String(audio.currentTime)); }
    setInterval(function () { if (playing) save(); }, 1000);
    window.addEventListener('pagehide', save);

    function start() {
      graph();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      if (!vol) setVol(0);
      var p = audio.play();
      if (p && p.then) p.then(started, blocked); else started();
    }
    function started() {
      playing = true; waiting = false;
      emit(true);
      fade(VOL, FADE_IN, easeIn);
    }
    /* geblokkeerd: wachten op de eerste handeling van de bezoeker */
    function blocked() {
      if (waiting) return;
      waiting = true;
      emit(false);
      wake = function (e) {
        if (e && e.target && e.target.closest && e.target.closest('[data-volume]')) return; // een klik op de knop zelf regelt de knop
        ['pointerdown', 'keydown', 'touchend'].forEach(function (t) { document.removeEventListener(t, wake, true); });
        waiting = false;
        if (want && !playing) start();
      };
      ['pointerdown', 'keydown', 'touchend'].forEach(function (t) { document.addEventListener(t, wake, true); });
    }
    function stop() {
      playing = false;
      emit(false);
      fade(0, FADE_OUT, easeOut, function () { if (!playing) { audio.pause(); save(); } });
    }

    /* maat van 2-late.mp3 (80,75 BPM), vooraf berekend uit het bestand (librosa beat_track):
       BEATS = tijdstip van elke tel in ms, BEAT_S = kracht van de bas op die tel (0-9).
       Nieuw nummer? Dan deze twee lijsten opnieuw laten berekenen. */
    var BEATS = [766,1533,2276,3065,3738,4412,5085,5805,6571,7291,8057,8800,9543,10286,11029,11773,12516,13259,14002,14745,15488,16231,16997,17740,18483,19226,19969,20712,21455,22175,22941,23684,24451,25194,25913,26657,27376,28143,28909,29652,30372,31115,31881,32601,33367,34110,34853,35596,36339,37082,37825,38568,39311,40054,40821,41564,42307,43050,43770,44536,45279,45999,46765,47508,48274,48994,49737,50457,51200,51966,52709,53429,54195,54938,55705,56424,57191,57934,58677,59420,60163,60906,61649,62392,63135,63878,64644,65364,66130,66873,67617,68360];
    var BEAT_S = '10000083739292839293839382939382828283849393928382838383810382828383839483838282828383738282';
    var BEAT_DECAY = 0.2;   // s: hoe snel een tel uitdooft (lager = korte tik, hoger = lange golf); geldt voor hero en footer
    function beat() {
      if (!playing || audio.paused || !BEATS.length) return -1;
      var ms = audio.currentTime * 1000, lo = 0, hi = BEATS.length - 1;
      if (ms < BEATS[0]) return -1;
      while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (BEATS[mid] <= ms) lo = mid; else hi = mid - 1; }
      return lo;
    }

    return {
      init: function () { if (want && !playing) start(); },
      toggle: function () {
        if (playing) { want = false; store(KEY_ON, ''); stop(); }
        else { want = true; store(KEY_ON, '1'); start(); }
      },
      /* klik of tik op een pagina in het bovenste venster: telt als toestemming */
      nudge: function () { if (waiting && wake) wake(null); },
      playing: function () { return playing; },
      on: function (fn) {
        subs.push(fn);
        fn(playing);
        return function () { subs = subs.filter(function (f) { return f !== fn; }); };
      },
      /* vertrek met een gewone paginalading: uitfaden tegelijk met de olievlek (de keuze 'aan' blijft
         staan, zodat de muziek op de volgende pagina weer infadet) */
      leave: function () {
        if (!playing) return;
        save();
        fade(0, LEAVE, easeOut, save);
      },
      /* pulse(): 0-1, piekt op elke tel en dooft uit; geschaald met het volume, zodat hij mee in- en uitfadet */
      pulse: function () {
        var lo = beat();
        if (lo < 0) return 0;
        var dt = (audio.currentTime * 1000 - BEATS[lo]) / 1000;
        var amp = .6 + .4 * (+BEAT_S.charAt(lo) / 9);
        var attack = Math.min(1, dt / .04);
        return amp * attack * Math.exp(-dt / BEAT_DECAY) * Math.min(1, vol / VOL);
      },
      /* hit(): de tel die nu klinkt, { i: volgnummer, s: kracht 0-1 }, of null als er niets speelt.
         De hero gebruikt dit om op elke nieuwe tel de vlek een duw te geven. */
      hit: function () {
        var lo = beat();
        if (lo < 0) return null;
        if (audio.currentTime * 1000 - BEATS[lo] > 150) return { i: lo, s: 0, late: true };
        return { i: lo, s: (.55 + .45 * (+BEAT_S.charAt(lo) / 9)) * Math.min(1, vol / VOL) };
      }
    };
  }
})();

/* Doorlopende navigatie: de muziek speelt door als je van pagina wisselt.
   Een gewone paginalading stopt alle geluid, en op telefoons mag het daarna pas weer na een tik.
   Daarom, alleen als de muziek speelt bij een klik naar een andere pagina van deze site:
   - deze pagina blijft staan (met het geluid) en de nieuwe pagina laadt eroverheen in een venster
     over het hele scherm (iframe .kerja-shell_frame, CSS in kerja.css). De nieuwe pagina laadt
     daarin volledig en gewoon, met alle scripts, dus alles werkt zoals bij een gewone lading.
   - volgende klikken laden binnen dat venster; de muziek blijft in het bovenste venster spelen
   - adresbalk en paginatitel volgen de pagina in het venster; terug en vooruit werken
   - links naar een andere site openen in het hele tabblad, niet in het venster
   - speelt de muziek niet, of lukt het venster niet, dan gewoon de volgende pagina laden zoals altijd
   - verversen laadt de pagina gewoon opnieuw (zonder venster)
   Uitzetten: SHELL = false. */
(function () {
  var SHELL = true;
  var WAIT = 20000; // ms: is de nieuwe pagina dan nog niet geladen, gewoon navigeren
  var root = document.documentElement;
  function plain(url) { window.location.href = url; }

  /* deze pagina draait in het venster: alleen de adresbalk bijwerken en links naar buiten in het hele tabblad */
  var shell = null;
  try { if (window.parent !== window && window.parent.kerjaShell) shell = window.parent.kerjaShell; } catch (e) { shell = null; }
  if (shell) {
    var sync = function () { try { shell.sync(location.href, document.title); } catch (e) {} };
    sync();
    ['hashchange', 'popstate', 'pageshow'].forEach(function (t) { window.addEventListener(t, sync); });
    ['pushState', 'replaceState'].forEach(function (m) {
      var orig = history[m];
      history[m] = function () { var r = orig.apply(history, arguments); sync(); return r; };
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self')) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) a.target = '_top';
    }, true);
    window.kerjaNav = { keeps: function () { return true; }, go: plain };
    return;
  }
  if (!SHELL || window.parent !== window) { window.kerjaNav = { keeps: function () { return false; }, go: plain }; return; }

  var frame = null;
  function playing() { return !!(window.kerjaMusicCore && window.kerjaMusicCore.playing()); }

  function open(url) {
    var done = false;
    var fail = function () { if (done) return; done = true; plain(url); };
    try {
      frame = document.createElement('iframe');
      frame.className = 'kerja-shell_frame';
      frame.setAttribute('title', document.title);
      frame.setAttribute('allow', 'autoplay; fullscreen; clipboard-write');
      var timer = setTimeout(fail, WAIT);
      frame.addEventListener('load', function () {
        if (done) return;
        var ok = false;
        try { ok = !!(frame.contentDocument && frame.contentDocument.body && frame.contentWindow.location.href !== 'about:blank'); } catch (e) { ok = false; }
        if (!ok) { clearTimeout(timer); fail(); return; }
        done = true;
        clearTimeout(timer);
        root.classList.add('kerja-shell');
        if (window.lenis) window.lenis.stop();
        try { frame.contentWindow.focus(); } catch (e) {}
      });
      frame.src = url;
      document.body.appendChild(frame);
      history.pushState({ kerjaShell: 1 }, '', url);
    } catch (e) { fail(); }
  }

  window.kerjaShell = {
    sync: function (href, title) {
      if (!frame) return;
      if (href !== location.href) { try { history.replaceState(history.state, '', href); } catch (e) {} }
      if (title) { document.title = title; frame.setAttribute('title', title); }
    }
  };
  /* terug tot voorbij de eerste pagina in het venster: die pagina in het venster laden */
  window.addEventListener('popstate', function (e) {
    if (!frame || (e.state && e.state.kerjaShell)) return;
    try { frame.contentWindow.location.replace(location.href); } catch (err) { location.reload(); }
  });
  window.kerjaNav = {
    keeps: function () { return !!frame || playing(); },
    go: function (url) { if (frame || !playing()) plain(url); else open(url); }
  };
})();

/* Gradient onder de footer ([section_footer], elke pagina even sterk): onderaan de pagina komt linksonder
   subtiel de lichte kleur van de gradient terug, zodat de pagina niet in vlak blauw eindigt.
   - een eigen klein canvas (.footer_haze, kerja.css) achter de footer, dat FOOT_RISE schermhoogtes boven
     de footer begint en daar doorzichtig uitloopt in de korrelige achtergrond
   - zelfde kleuren en korrel als de hero; het licht blijft subtiel: nooit lichter dan FOOT_MIN op de
     kleurschaal (middenblauw), zodat de creme tekst erop leesbaar blijft
   - ademt, volgt de muis een beetje en pulseert op de maat van de muziek (kerjaMusic.pulse)
   - light mode: omgedraaid (creme ondergrond, blauwige gloed), zoals de hero
   - tekent alleen als de footer in beeld is, max 30 beelden per seconde; 'reduced motion': stilstaand */
(function () {
  var footer = document.querySelector('.section_footer');
  if (!footer) return;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FOOT_MIN = 0.5;    // lichtste waarde op de kleurschaal (0 = wit, .82 = de blauwe basis)
  var FOOT_AMT = 1.0;    // hoeveelheid licht
  var GRAIN = 0.14;
  /* op de maat van de muziek (zelf af te stellen):
     FOOT_BEAT_GROW = hoeveel het licht per tel opzwelt (.08 = 8%); 0 = niet
     FOOT_BEAT_WARP = hoeveel de vorm per tel vervormt (.02 = licht golvend); 0 = niet
     hoe lang een tel naklinkt staat in het muziekscript: BEAT_DECAY (geldt voor hero en footer) */
  var FOOT_BEAT_GROW = 0.08;
  var FOOT_BEAT_WARP = 0.02;
  var host = document.createElement('div');
  host.className = 'footer_haze';
  host.setAttribute('aria-hidden', 'true');
  footer.insertBefore(host, footer.firstChild);
  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  host.appendChild(canvas);
  var gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return;
  var fs = [
    'precision mediump float;',
    'uniform vec2 res;uniform float t;uniform vec2 m;uniform float seed;uniform float flip;uniform float bt;uniform float rise;',
    'float hash(vec2 q){q=fract(q*vec2(123.34,456.21));q+=dot(q,q+45.32);return fract(q.x*q.y);}',
    'float blob(vec2 q,vec2 c,vec2 s){vec2 d=(q-c)/s;return exp(-dot(d,d));}',
    'vec3 ramp(float v,float cr){',
    '  vec3 c0=mix(vec3(.933,.941,1.),vec3(.918,.89,.855),cr),c1=vec3(.682,.714,.98),c2=vec3(.298,.235,.949),c3=vec3(.18,.047,.949),c4=vec3(.086,.024,.525);',
    '  if(v<.35)return mix(c0,c1,v/.35);if(v<.62)return mix(c1,c2,(v-.35)/.27);if(v<.82)return mix(c2,c3,(v-.62)/.2);return mix(c3,c4,(v-.82)/.18);}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/res;float a=res.x/res.y;vec2 q=vec2(uv.x*a,uv.y);',
    '  float br=sin(t*.27)*.5+.5;float g=1.+.06*br+' + FOOT_BEAT_GROW.toFixed(3) + '*bt;',
    '  q+=vec2(sin(q.y*2.1+t*.19),cos(q.x*1.7-t*.15))*(.03+' + FOOT_BEAT_WARP.toFixed(3) + '*bt);',
    '  float l=blob(q,vec2(.06*a,-.08)+.03*vec2(sin(t*.13),cos(t*.11)),vec2(.5*a,.55)*g)*.9;',
    '  l+=blob(q,vec2(.3*a,.08)+.04*vec2(sin(t*.17+1.),cos(t*.09)),vec2(.28*a,.3)*g)*.45;',
    '  l+=blob(q,vec2(m.x*a,m.y),vec2(.22,.22))*.18;',
    '  l=clamp(l*' + FOOT_AMT.toFixed(2) + ',0.,1.)*smoothstep(0.,rise,1.-uv.y+.02);',
    '  vec2 cell=floor(gl_FragCoord.xy/1.5);float n=hash(cell+seed);',
    '  float x=l*(.82-' + FOOT_MIN.toFixed(2) + ');',
    '  float v=mix(.82-x,x*.6,flip);',   // dark: van blauw naar lichter; light: van creme naar iets blauwer (zwakker)
    '  v=clamp(v+(n-.5)*' + GRAIN.toFixed(2) + ',0.,1.);',
    '  float al=smoothstep(.0,.18,l);',
    '  gl_FragColor=vec4(ramp(v,flip)*al,al);}'
  ].join('\n');
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p2;void main(){gl_Position=vec4(p2,0.,1.);}'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { host.remove(); return; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p2'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['res', 't', 'm', 'seed', 'flip', 'bt', 'rise'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

  function size() {
    var r = host.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width)); canvas.height = Math.max(1, Math.round(r.height));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  size();
  window.addEventListener('resize', size);

  var target = [.2, .2], cur = [.2, .2], visible = false, raf = 0, last = 0, start = performance.now(), seed = 1, lastSeed = 0, beat = 0, flip = 0;
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      target = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    }, { passive: true });
  }
  function frame(now) {
    raf = 0;
    if (!visible) return;
    if (!reduce) raf = requestAnimationFrame(frame);
    if (!reduce && now - last < 33) return;
    last = now;
    cur[0] += (target[0] - cur[0]) * .035; cur[1] += (target[1] - cur[1]) * .035;
    if (now - lastSeed > 83) { seed = Math.random() * 100; lastSeed = now; }
    var bp = !reduce && window.kerjaMusic && window.kerjaMusic.pulse ? window.kerjaMusic.pulse() : 0;
    beat += (bp - beat) * .6;
    var goal = root.classList.contains('theme-light') ? 1 : 0;
    flip += (goal - flip) * (reduce ? 1 : .06);
    var rise = host.offsetHeight ? Math.min(1, window.innerHeight * .5 / host.offsetHeight + .15) : .6;
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.t, reduce ? 0 : (now - start) / 1000);
    gl.uniform2f(U.m, cur[0], cur[1]);
    gl.uniform1f(U.seed, seed);
    gl.uniform1f(U.flip, flip);
    gl.uniform1f(U.bt, beat);
    gl.uniform1f(U.rise, rise);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { size(); kick(); } }).observe(host);
  new MutationObserver(kick).observe(root, { attributes: true, attributeFilter: ['class'] });
})();

/* Work-cases (.work-cases_item met data-work-case, pagina Work): de foto (.work-cases_image) wordt getoond
   als halftone van ringen in var(--light) (in light mode dus blauw); tussen de ringen is de case
   doorzichtig, zodat de achtergrond van de pagina erdoor te zien is. Het raster wordt uit de foto zelf
   gemaakt en is voor elke case gelijk: WORK_PITCH ringen over de breedte van een case. Lichte delen
   van de foto blijven leeg, en over de buitenste WORK_EDGE lopen de ringen grillig naar de rand uit.
   Mouse-over: de bolletjes gedragen zich als een negatieve magneet. Ze gaan de cursor uit de weg, zodat
   er rond de cursor een lege cirkel van PUSH_CLEAR rem ontstaat; de bolletjes die daar stonden schuiven
   gelijkmatig naar buiten. Het effect reikt tot PUSH_RADIUS rem en loopt naar buiten
   toe zacht af. De plek volgt de cursor met wat naloop (PUSH_FOLLOW); bij binnenkomen en weggaan
   wijken de bolletjes in PUSH_FADE ms uit en gaan ze terug. Er is geen kleurenfoto meer.
   Labels: projectnaam en werkzaamheden springen bij mouse-over uit het cursorbolletje, aan lijnen
   (zie makeLabels). Daarom staan titel en werkzaamheden onder de cases alleen op apparaten zonder
   muis (kerja.css). data-work-focus="x y" (0-1) bepaalt welk deel van de foto in beeld blijft bij het
   bijsnijden (standaard het midden).
   Groeien (alleen met een muis, vanaf 768px): de case onder de cursor wordt 3.125rem breder, de andere
   cases op dezelfde rij elk de helft smaller (is-active en is-shrink, CSS in kerja.css). Rijen van drie. De hoogte blijft gelijk. De foto schaalt niet
   mee: de uitsnede wordt breder. Het raster hangt aan het midden van de case en de rondjes houden hun
   maat (gerekend op de breedte in rust, WORK_RATIO).
   Telefoon en tablet (geen muis) en reduced motion: alleen de halftone, zonder golven.
   Lukt WebGL of het laden van de foto niet, dan blijft gewoon de foto staan. */
(function () {
  var items = document.querySelectorAll('.work-cases_item[data-work-case]');
  if (!items.length) return;
  var WORK_PITCH = 72;
  var WORK_EDGE = 0.06;   // deel van het vlak (per kant) waarover de ringen naar de rand uitlopen
  var WORK_RATIO = 463 / 470;   // breedte/hoogte van een case in rust (gelijk aan aspect-ratio in Webflow)
  var WORK_SEEDS = [3.1, 7.7, 12.4];   // eigen korrel van de rand per case (op volgorde)
  /* Uitwijken rond de cursor (maten in rem, zodat ze meeschalen): */
  var PUSH_CLEAR = 0.75;    // straal van de lege cirkel rond de cursor (12px op 1512)
  var PUSH_RADIUS = 7;      // tot hoe ver rond de cursor de bolletjes uitwijken (minstens 1,5 x PUSH_CLEAR)
  var PUSH_FOLLOW = 0.22;   // naloop per beeld (lager = zachter en trager volgen)
  var PUSH_FADE = 300;      // ms om bij binnenkomen en weggaan uit te wijken en terug te gaan
  var hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var FS = [
    'precision highp float;',
    'uniform sampler2D tc;uniform vec3 paper;uniform vec2 res;',
    'uniform vec2 sc;uniform vec2 off;uniform float cellpx;uniform float seed;',
    /* cursor: xy = plek (px, vanuit het midden van het vlak, y omhoog), z = bereik (px), w = lege cirkel
       (px, al maal de sterkte) */
    'uniform vec4 cur;varying vec2 v;',
    'float h(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 q){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(q);q=q*2.03+17.;a*=.5;}return s;}',
    'vec3 img(vec2 u){return texture2D(tc,off+clamp(u,0.,1.)*sc).rgb;}',
    /* negatieve magneet: een bolletje op afstand r van de cursor komt op sqrt(r*r + w*w). Zo ontstaat een lege
       cirkel met straal w en schuiven de bolletjes gelijkmatig naar buiten (de dichtheid blijft gelijk, geen
       ster- of klontvorm). Richting z (het bereik) loopt het effect uit tot nul.
       src() zoekt voor een pixel terug welke plek daar terechtkomt, zodat we de goede cellen tekenen. */
    'float push(float r){return (sqrt(r*r+cur.w*cur.w)-r)*(1.-smoothstep(cur.z*.4,cur.z,r));}',
    'vec2 moved(vec2 c){vec2 dv=c-cur.xy;float r=length(dv);return cur.xy+dv/max(r,.001)*(r+push(r));}',
    'vec2 src(vec2 q){vec2 dv=q-cur.xy;float rp=length(dv);float r=rp;',
    '  for(int i=0;i<8;i++){r=max(0.,rp-push(r));}',
    '  return cur.xy+dv/max(rp,.001)*r;}',
    'void main(){vec2 uv=v;',
    /* raster van ringen, 45 graden gedraaid; bij uitwijken ook de buurpunten, want een verschoven bolletje
       kan over de rand van zijn eigen cel heen komen */
    '  vec2 px=(uv-.5)*res;float cell=max(cellpx,1.);float ca=.7071;mat2 R=mat2(ca,-ca,ca,ca);mat2 Ri=mat2(ca,ca,-ca,ca);',
    '  bool on=cur.w>.01;vec2 c0=floor(R*(on?src(px):px)/cell)+.5;float aa=1.2/cell;float cov=0.;',
    '  for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){',
    '    if(!on&&(i!=0||j!=0))continue;',
    '    vec2 ci=c0+vec2(float(i),float(j));vec2 cpx=Ri*ci*cell;',
    '    vec2 f=R*(px-(on?moved(cpx):cpx))/cell;',
    '    vec2 cc=cpx/res+.5;vec3 sc0=img(cc);',
    /* lichte delen van de foto blijven leeg (meer ruimte tussen het onderwerp) */
    '    float lum=dot(sc0,vec3(.299,.587,.114));float dk=clamp((1.-lum-.32)*1.6,0.,1.);',
    /* rand: over de buitenste WORK_EDGE worden de ringen kleiner en vallen punten weg, grillig en korrelig */
    '    vec2 cq=vec2(cc.x*res.x/res.y,cc.y);',
    '    float ed=min(min(cc.x,1.-cc.x),min(cc.y,1.-cc.y));float en=ed+(fbm(cq*5.+seed*3.1)-.5)*.1;',
    '    float fall=smoothstep(0.,' + WORK_EDGE.toFixed(3) + ',en);dk*=mix(.3,1.,fall);float keep=step(h(ci+seed*1.3),fall*1.25);',
    '    float rad=.14+.34*dk;float wid=.06+.14*dk;float dd=length(f);',
    '    float ring=smoothstep(rad-wid*.5-aa,rad-wid*.5,dd)*(1.-smoothstep(rad+wid*.5,rad+wid*.5+aa,dd));',
    '    float fill=(1.-smoothstep(rad-aa,rad,dd))*smoothstep(.82,1.,dk);',
    '    cov=max(cov,max(ring,fill)*step(.03,dk)*keep);',
    '  }}',
    /* alles tussen de ringen is doorzichtig: daar is de achtergrond van de pagina te zien.
       Premultiplied (kleur maal dekking): Safari op iPhone gaat niet goed om met premultipliedAlpha:false */
    '  gl_FragColor=vec4(paper*cov,cov);}'
  ].join('\n');
  function rgb(str, fb) {
    var m = (str || '').match(/[\d.]+/g);
    if (m && m.length >= 3 && str.indexOf('rgb') > -1) return [m[0] / 255, m[1] / 255, m[2] / 255];
    var hx = (str || '').trim().replace('#', '');
    if (/^[0-9a-f]{6}$/i.test(hx)) return [parseInt(hx.slice(0, 2), 16) / 255, parseInt(hx.slice(2, 4), 16) / 255, parseInt(hx.slice(4, 6), 16) / 255];
    return fb;
  }

  /* Labels (alleen met een muis): bij mouse-over komen uit het cursorbolletje labels met de projectnaam
     en de werkzaamheden, met een snelle ease-in-out (LBL_IN ms, kort na elkaar: LBL_STAGGER). Elk label
     hangt met een lijn van 1px aan het cursorbolletje: van de rand van het bolletje naar de dichtstbijzijnde
     hoek van het label. De lijnen bewegen mee met de cursor.
     - Projectnaam: linksboven, LBL_PAD rem van boven en links, en staat daarna stil.
     - Werkzaamheden: elke mouse-over op andere plekken in de case, met minstens LBL_GAP rem ruimte tussen
       de labels en LBL_EDGE rem tot de rand; daarna zweven ze licht (LBL_FLOAT rem uitslag).
     Mouse-out: de labels zijn meteen weg (geen fade), de lijnen schieten in LBL_BACK ms terug naar het
     cursorbolletje. Tekst komt uit de case zelf (Section Title en .work-cases_services), dus aanpassen in
     Webflow. Opmaak: .work-cases_label in kerja.css, kaders met de classes van de menuknop. */
  var LBL_PAD = 2.5, LBL_GAP = 1.25, LBL_EDGE = 1, LBL_FLOAT = 0.3;
  var LBL_IN = 420, LBL_STAGGER = 45, LBL_BACK = 160;
  var CUR_R = 0.3125;   // rem, straal van het cursorbolletje (gelijk aan de cursor)
  var DOT_R = 0.21875;  // rem, de lijn stopt aan de buitenkant van het hoekbolletje
  var NS = 'http://www.w3.org/2000/svg';
  function remPx() { return parseFloat(getComputedStyle(root).fontSize) || 16; }
  function txt(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function makeLabels(item, box) {
    var layer = document.createElement('div');
    layer.className = 'work-cases_labels';
    layer.setAttribute('aria-hidden', 'true');
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'work-cases_lines');
    layer.appendChild(svg);
    box.appendChild(layer);
    var defs = [{ t: txt(item.querySelector('.section-title_component h1, .section-title_component h2, .section-title_component h3, .section-title_component .heading-style-h6')), name: true }];
    Array.prototype.forEach.call(item.querySelectorAll('.work-cases_services li'), function (li) { defs.push({ t: txt(li) }); });
    var L = defs.filter(function (d) { return d.t; }).map(function (d, i) {
      var el = document.createElement('div');
      el.className = 'work-cases_label' + (d.name ? ' is-name' : '');
      el.innerHTML = '<div class="menu_cell-frame"></div><div class="menu_cell-dot is-tl"></div><div class="menu_cell-dot is-tr"></div>' +
        '<div class="menu_cell-dot is-bl"></div><div class="menu_cell-dot is-br"></div><span class="work-cases_label-text"></span>';
      el.querySelector('span').textContent = d.t;
      layer.appendChild(el);
      var ln = document.createElementNS(NS, 'line');
      svg.appendChild(ln);
      return { el: el, ln: ln, name: !!d.name, i: i, x: 0, y: 0, sx: 0, sy: 0, s: 0, fx: 0, fy: 0, w: 0, h: 0, ph: Math.random() * 6.283, sp: .7 + Math.random() * .5, ex: 0, ey: 0 };
    });
    var on = false, back = 0, raf = 0, t0 = 0, last = 0, cx = 0, cy = 0, W = 1, H = 1, rem = 16;

    function measure() { var r = box.getBoundingClientRect(); W = r.width; H = r.height; rem = remPx(); }
    /* plekken: projectnaam vast; werkzaamheden willekeurig, best-of-N zodat ze goed verspreid liggen */
    function place() {
      var pad = LBL_PAD * rem, gap = LBL_GAP * rem, edge = LBL_EDGE * rem, rects = [];
      L.forEach(function (l) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; });
      L.forEach(function (l) {
        if (l.name) { l.fx = (pad + l.w / 2) / W; l.fy = (pad + l.h / 2) / H; rects.push([pad, pad, l.w, l.h]); return; }
        var best = null, bestD = -1;
        for (var k = 0; k < 40; k++) {
          var x = edge + Math.random() * Math.max(1, W - l.w - 2 * edge), y = edge + Math.random() * Math.max(1, H - l.h - 2 * edge);
          var ok = true, d = 1e9;
          rects.forEach(function (r) {
            if (x < r[0] + r[2] + gap && x + l.w + gap > r[0] && y < r[1] + r[3] + gap && y + l.h + gap > r[1]) ok = false;
            var dx = (x + l.w / 2) - (r[0] + r[2] / 2), dy = (y + l.h / 2) - (r[1] + r[3] / 2);
            d = Math.min(d, dx * dx + dy * dy);
          });
          if (ok && d > bestD) { bestD = d; best = [x, y]; }
        }
        if (!best) best = [edge + Math.random() * Math.max(1, W - l.w - 2 * edge), edge + Math.random() * Math.max(1, H - l.h - 2 * edge)];
        rects.push([best[0], best[1], l.w, l.h]);
        l.fx = (best[0] + l.w / 2) / W; l.fy = (best[1] + l.h / 2) / H;
      });
    }
    /* lijn van de rand van het cursorbolletje naar de dichtstbijzijnde hoek (buitenkant van het hoekbolletje) */
    function line(l, ex, ey) {
      var dx = ex - cx, dy = ey - cy, len = Math.sqrt(dx * dx + dy * dy) || 1, r0 = CUR_R * rem, r1 = l.name || l.s > .5 ? DOT_R * rem : 0;
      if (len <= r0 + r1) { l.ln.setAttribute('visibility', 'hidden'); return; }
      l.ln.setAttribute('visibility', 'visible');
      l.ln.setAttribute('x1', cx + dx / len * r0); l.ln.setAttribute('y1', cy + dy / len * r0);
      l.ln.setAttribute('x2', ex - dx / len * r1); l.ln.setAttribute('y2', ey - dy / len * r1);
    }
    /* hoek = midden van het hoekbolletje (0.21875rem binnen de rand van het label, zie .menu_cell-dot) */
    function corner(l) {
      var hw = (l.w / 2 - DOT_R * rem) * l.s, hh = (l.h / 2 - DOT_R * rem) * l.s;
      return [l.x + (cx < l.x ? -hw : hw), l.y + (cy < l.y ? -hh : hh)];
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      measure();
      var t = (now - t0) / 1000, busy = false;
      L.forEach(function (l) {
        if (on) {
          var tx = l.fx * W, ty = l.fy * H;
          if (!l.name && !reduce) { tx += Math.sin(t * l.sp + l.ph) * LBL_FLOAT * rem; ty += Math.cos(t * l.sp * .8 + l.ph * 1.3) * LBL_FLOAT * rem; }
          var k = reduce ? 1 : Math.min(1, Math.max(0, (now - t0 - l.i * LBL_STAGGER) / LBL_IN));
          var e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;   // ease-in-out
          l.x = l.sx + (tx - l.sx) * e; l.y = l.sy + (ty - l.sy) * e; l.s = e;
          l.el.style.transform = 'translate3d(' + (l.x - l.w / 2) + 'px,' + (l.y - l.h / 2) + 'px,0) scale(' + Math.max(0, l.s) + ')';
          var c = corner(l); l.ex = c[0]; l.ey = c[1];
          line(l, l.ex, l.ey);
          busy = true;
        } else if (back) {
          /* terugschieten: het eindpunt van de lijn loopt in LBL_BACK ms naar het cursorbolletje */
          var k = Math.min(1, (now - back) / LBL_BACK), e = k * k;
          if (k < 1) { line(l, l.ex + (cx - l.ex) * e, l.ey + (cy - l.ey) * e); busy = true; }
          else l.ln.setAttribute('visibility', 'hidden');
        }
      });
      if (!on && back && now - back >= LBL_BACK) back = 0;
      if (busy) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function point(e) { var r = box.getBoundingClientRect(); cx = e.clientX - r.left; cy = e.clientY - r.top; }
    return {
      show: function (e) {
        point(e); measure();
        on = true; back = 0; t0 = performance.now();
        L.forEach(function (l) { l.el.classList.add('is-on'); l.x = l.sx = cx; l.y = l.sy = cy; l.s = 0; });
        place();
        kick();
      },
      move: function (e) { point(e); kick(); },
      hide: function (e) {
        if (e) point(e);
        on = false;
        L.forEach(function (l) { l.el.classList.remove('is-on'); });
        if (reduce) { L.forEach(function (l) { l.ln.setAttribute('visibility', 'hidden'); }); return; }
        back = performance.now(); kick();
      }
    };
  }

  /* Aankomst met olievlek: de cases pas opzetten als de vlek is opgegroeid (event kerja-oil-done uit de
     hero-gradient). Het opzetten van drie WebGL-beelden kost de browser even rekenwerk en zou de vlek
     laten haperen. De cases zijn tijdens de groei toch verborgen; de foto blijft tot dan onzichtbaar.
     Vangnet: na 12 s hoe dan ook (eerste bezoek met preloader kan lang duren). */
  if (window.kerjaOilIn) {
    Array.prototype.forEach.call(items, function (item) {
      var im = item.querySelector('.work-cases_image');
      if (im) im.style.opacity = '0';
    });
    var started = false;
    var start = function () { if (started) return; started = true; setup(); };
    window.addEventListener('kerja-oil-done', start, { once: true });
    setTimeout(start, 12000);
  } else setup();

  /* groeien per rij: de andere cases op dezelfde rij (zelfde hoogte op de pagina) worden smaller (is-shrink) */
  function row(item, on) {
    var top = item.offsetTop;
    Array.prototype.forEach.call(items, function (o) {
      o.classList.toggle('is-shrink', on && o !== item && Math.abs(o.offsetTop - top) < 2);
    });
  }
  function setup() {
  Array.prototype.forEach.call(items, function (item, idx) {
    var box = item.querySelector('.work-cases_visual');
    var img = item.querySelector('.work-cases_image');
    if (!box || !img) return;
    var seed = WORK_SEEDS[idx % WORK_SEEDS.length];
    var focus = (item.getAttribute('data-work-focus') || '.5 .5').split(/\s+/).map(parseFloat);
    if (!(focus[0] >= 0)) focus[0] = .5;
    if (!(focus[1] >= 0)) focus[1] = .5;
    var cv = document.createElement('canvas');
    cv.className = 'work-cases_canvas';
    cv.setAttribute('aria-hidden', 'true');
    var gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: true });
    if (!gl) { img.style.opacity = ''; return; }
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var al = gl.getAttribLocation(pr, 'a');
    gl.enableVertexAttribArray(al);
    gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['tc', 'paper', 'res', 'sc', 'off', 'cellpx', 'seed', 'cur'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    gl.uniform1i(U.tc, 0);
    gl.uniform1f(U.seed, seed);

    var iw = 1, ih = 1, ready = false, raf = 0;
    var tx = 0, ty = 0, cx = 0, cy = 0, str = 0, goal = 0, last = 0;   // cursor (CSS-px in het vlak), sterkte
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() {
      var r = box.getBoundingClientRect();
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, cv.width, cv.height);
      /* rust: de foto vult de case (cover) rond data-work-focus. Breder: zelfde schaal en zelfde midden,
         alleen een bredere uitsnede */
      var bw = cv.height * WORK_RATIO, bh = cv.height;
      var s = Math.max(bw / iw, bh / ih);
      var sxB = bw / (iw * s), sy = bh / (ih * s);
      var mid = focus[0] * (1 - sxB) + sxB / 2;
      var sx = Math.min(1, cv.width / (iw * s));
      gl.uniform2f(U.sc, sx, sy);
      gl.uniform2f(U.off, Math.min(Math.max(mid - sx / 2, 0), 1 - sx), (1 - focus[1]) * (1 - sy));
      gl.uniform1f(U.cellpx, bw / WORK_PITCH);
    }
    function draw() {
      if (!ready) return;
      var cs = getComputedStyle(box);
      gl.uniform3fv(U.paper, rgb(cs.getPropertyValue('--light'), [.918, .89, .855]));
      gl.uniform2f(U.res, cv.width, cv.height);
      /* cursor naar de shader: in canvas-px, vanuit het midden, y omhoog */
      var k = dpr * remPx();
      gl.uniform4f(U.cur, (cx - cv.width / dpr / 2) * dpr, (cv.height / dpr / 2 - cy) * dpr, PUSH_RADIUS * k, PUSH_CLEAR * k * str);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    /* volgen en in/uitfaden; stopt zodra alles stilstaat */
    function loop(now) {
      var dt = Math.min(50, now - last); last = now;
      cx += (tx - cx) * PUSH_FOLLOW; cy += (ty - cy) * PUSH_FOLLOW;
      str = goal > str ? Math.min(goal, str + dt / PUSH_FADE) : Math.max(goal, str - dt / PUSH_FADE);
      draw();
      var busy = str !== goal || Math.abs(tx - cx) > .2 || Math.abs(ty - cy) > .2;
      raf = busy ? requestAnimationFrame(loop) : 0;
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
    function aim(e, jump) {
      var r = box.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (jump) { cx = tx; cy = ty; }
    }
    /* kleur volgen bij light/dark mode en diapositief (de variabelen hebben een overgang van 0,6 s) */
    var follow = 0;
    function recolor() {
      var until = performance.now() + 700;
      cancelAnimationFrame(follow);
      (function step() { draw(); if (performance.now() < until) follow = requestAnimationFrame(step); })();
    }

    var src = new Image();
    src.crossOrigin = 'anonymous';
    src.onload = function () {
      iw = src.naturalWidth; ih = src.naturalHeight;
      var tx = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); } catch (err) { img.style.opacity = ''; return; }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      ready = true;
      box.appendChild(cv);
      img.style.opacity = '0'; // de foto zelf alleen nog als terugval zonder WebGL
      size(); draw();
      if (window.ResizeObserver) new ResizeObserver(function () { size(); draw(); }).observe(box);
      else window.addEventListener('resize', function () { size(); draw(); });
      new MutationObserver(recolor).observe(root, { attributes: true, attributeFilter: ['class'] });
      new MutationObserver(recolor).observe(box, { attributes: true, attributeFilter: ['class'] });
    };
    src.onerror = function () { img.style.opacity = ''; };
    function load() { src.src = img.currentSrc || img.src; }
    if (img.complete && (img.currentSrc || img.src)) load(); else img.addEventListener('load', load, { once: true });

    if (hover) {
      var labels = makeLabels(item, box);
      var push = !reduce;
      item.addEventListener('mouseenter', function (e) { item.classList.add('is-active'); row(item, true); labels.show(e); if (push && ready) { aim(e, true); goal = 1; kick(); } });
      item.addEventListener('mousemove', function (e) { labels.move(e); if (push && ready) { aim(e); kick(); } });
      item.addEventListener('mouseleave', function (e) { item.classList.remove('is-active'); row(item, false); labels.hide(e); if (push && ready) { aim(e); goal = 0; kick(); } });
    }
  });
  }
})();
