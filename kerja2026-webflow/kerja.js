/* Kerja 2026 — kerja.js
   Geladen: sitebreed, footer, na lenis.min.js
   Lenis, ankers, menu en scrollstatus, FAQ, split-hover, dots-lines, zigzag, woord-hover, logo, pagina-overgang en light/dark mode, cursor, coming soon, hero-gradient, scrollbalk.
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
   Links die in een nieuw tabblad openen (Instagram, LinkedIn) gaan direct, anders blokkeert de browser ze. */
(function () {
  var STOP_DELAY = 250; // ms zonder scroll = stilstand
  var AUTO_CLOSE = 5000; // ms zonder keuze, daarna klapt het menu vanzelf in
  var LIFT_GAP = 1.5; // rem tussen de onderkant van de menuknop en de legal-navigatie
  var MENU_BOTTOM = 40; // px, gelijk aan bottom van .menu_component in Webflow
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

  function setOpen(open, instant) {
    if (!hasMenu) return;
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
   Classes: faq_visual (FAQ), work_visual en visual_image (Home, Connect), about-more_visual (About). */
(function () {
  var imgs = Array.prototype.slice.call(document.querySelectorAll('.faq_visual, .work_visual, .visual_image, .about-more_visual'));
  if (!imgs.length) return;
  var NS = 'http://www.w3.org/2000/svg';
  var END_AT = 0.3;   // bovenkant op 30% van het scherm = ruim 90% onderweg
  var CURVE = 2.5;    // hoe snel de beweging uitloopt (hoger = eerder bijna stil)
  var FOLLOW = 0.1;   // naloop per frame (lager = zachter en trager volgen)
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* rustige start, daarna steeds langzamer: nadert 1 zonder hem hard te raken */
  function curve(p) { return p <= 0 ? 0 : 1 - Math.exp(-CURVE * Math.pow(p, 1.5)); }
  function randX() { return 0.15 + Math.random() * 0.7; }
  var items = [];

  function init(img) {
    var W = img.naturalWidth || 1431;
    var H = img.naturalHeight || Math.round(W * img.offsetHeight / Math.max(1, img.offsetWidth));
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', img.getAttribute('class'));
    svg.style.overflow = 'visible';
    var path = document.createElementNS(NS, 'path');
    path.style.stroke = 'var(--light, #EAE3DA)';
    path.setAttribute('stroke-width', '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(path);
    img.parentNode.replaceChild(svg, img);

    var pad = 0.5, top = pad, bot = H - pad, xl = pad, xr = W - pad;
    var down = Math.random() < 0.5; // richting van de schuine lijnen, vast per zigzag
    var ya = down ? bot : top, yb = down ? top : bot;
    var start = randX(), end = randX();
    while (Math.abs(end - start) < 0.25) end = randX();

    function draw(x) {
      var xm = pad + x * (W - 2 * pad);
      path.setAttribute('d', 'M' + xl + ' ' + ya + 'V' + yb + 'L' + xm + ' ' + ya + 'V' + yb + 'L' + xr + ' ' + ya + 'V' + yb);
    }

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

/* Logo in de themakleur: de logo-afbeelding (.hero_logo) wordt vervangen door dezelfde SVG inline,
   met als vulkleur var(--light). Zo wordt het logo blauw in light mode.
   Lukt het ophalen niet, dan blijft de gewone afbeelding staan. */
(function () {
  var img = document.querySelector('img.hero_logo');
  if (!img || !window.fetch || !window.DOMParser) return;
  fetch(img.currentSrc || img.src)
    .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
    .then(function (text) {
      var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      var svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg' || !img.parentNode) return;
      svg = document.importNode(svg, true);
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.removeAttribute('style');
      svg.setAttribute('class', img.className);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', img.getAttribute('alt') || 'Kerja');
      Array.prototype.forEach.call(svg.querySelectorAll('[fill]'), function (el) {
        if (el.getAttribute('fill') === 'none') return;
        el.removeAttribute('fill');
        el.style.fill = 'var(--light, #EAE3DA)';
      });
      img.parentNode.replaceChild(svg, img);
    })
    .catch(function () {});
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
   Olievlek: bij aankomst (elke keer, ook bij een eerste bezoek of vernieuwen) groeit de pagina als een
   olievlek van onder naar boven over de ondergrond in de andere kleur, daarna pas de opbouw. Bij
   vertrek en bij de light/dark-wissel trekt hij zich na het verdwijnen van de onderdelen terug van
   boven naar onder (script: hero-gradient en korrel). */
(function () {
  var root = document.documentElement;
  var KEY = 'kerja-pt';
  var THEME_KEY = 'kerja-theme';
  var SEL = 'h1,h2,h3,h4,h5,h6,p,img,svg,a,.dots-line_component,.menu_component,.text-size-tiny,[data-greeting],.hero_payoff,.theme-switch_component';
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
    if (reduce) { window.location.href = url; return; }
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
        sink(function () { window.location.href = url; });
      }, greetShown ? GREET_HOLD : 0);
    });
  }
  window.kerjaPageTransition = leave;

  /* aankomst na een overgang: alles verborgen; bij statements de woorden, zodat de kop zelf zichtbaar kan zijn */
  if (root.classList.contains('pt-enter')) {
    try { sessionStorage.removeItem(KEY); } catch (err) {}
    items().forEach(function (el) { el.classList.add('pt-hide'); });
    root.classList.remove('pt-enter');
    window.kerjaPtEnter = true; // voor de hero-gradient: start weggezakt
    busy = true;
    setTimeout(function () { grow(build); }, 100);
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
   - korrel over de hele pagina, op elke pagina: achtergrond van body (loopt ook onder de scrollbalk)
     met dezelfde korrel op de achtergrondkleur. Vier tegels per thema, ±12 keer per seconde gewisseld.
   - data-haze="subtle" (vervolgpagina's): zelfde gradient, maar het licht is zwak en zit bovenaan
     en de basis is donkerder (L_AMT, L_Y, L_W, GLOW, BASE)
   - olievlek bij de pagina-overgang: zie kerjaHaze.grow/sink (OIL ms)
   - parallax: de gradient scrolt trager dan de pagina (PARALLAX); de korrel op body staat stil
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
  /* De korrel staat als achtergrond op body. Die achtergrond loopt door onder de scrollbalk (een vaste
     laag deed dat niet: daar bleef rechts een vlakke blauwe strook staan). Elke korrel is precies een
     blok hele schermpixels, zodat het beeld scherp blijft zonder image-rendering (dat zou erven). */
  var TILE = 128, tiles = { dark: [], light: [] };
  var gdpr = window.devicePixelRatio || 1, CELL = Math.max(1, Math.round(1.5 * gdpr));
  ['dark', 'light'].forEach(function (mode) {
    for (var k = 0; k < 4; k++) {
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
  var bodyStyle = document.body.style;
  bodyStyle.backgroundSize = (TILE * CELL / gdpr) + 'px ' + (TILE * CELL / gdpr) + 'px';
  bodyStyle.backgroundAttachment = 'fixed';
  bodyStyle.backgroundRepeat = 'repeat';
  var grainFrame = 0;
  function grain() {
    var t = tiles[light() ? 'light' : 'dark'][grainFrame % 4];
    if (t) bodyStyle.backgroundImage = t;
  }
  if (!reduce) setInterval(function () { grainFrame++; grain(); }, 83);
  new MutationObserver(grain).observe(root, { attributes: true, attributeFilter: ['class'] });

  /* zonder gradient op de pagina: overgang zonder olievlek (zie verderop voor de echte) */
  window.kerjaHaze = {
    dia: function () { return false; },
    grow: function (done) { if (done) done(); },
    sink: function (done) { if (done) done(); },
    show: function () {}
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
    Array.prototype.forEach.call(hero.querySelectorAll('[data-greeting], .heading-style-h6, .dots-line_component, .text-size-small, .email_link, p:not(.statement_heading)'), function (el) {
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
    var br = Math.sin(t * .29) * .5 + .5, br2 = Math.sin(t * .19 + 1.7);
    var d = blob(px, py, .52 * a + (mmx - .52 * a) * FOLLOW_LOW[0], -.18 + (mmy - .5) * FOLLOW_LOW[1], .62 * a * (1 + .05 * br), .62 * (1 + .05 * br)) * 1.15;
    d += blob(px, py, .4 * a + (mmx - .4 * a) * FOLLOW + .035 * Math.sin(t * .21), .5 + (mmy - .5) * FOLLOW + .035 * Math.cos(t * .17), .26 * (1 + .07 * br2), .28 * (1 + .07 * br2)) * .85;
    d += blob(px, py, -.05 * a + .04 * Math.sin(t * .13), .45 + .04 * Math.cos(t * .11), .38 * a, .7) * .55;
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
      'uniform vec2 res;uniform float t;uniform vec2 m;uniform float seed;uniform float grain;uniform float flip;uniform float frac;uniform float fadeFrom;uniform vec4 lt;uniform float base;uniform vec4 bx[10];uniform float soft;uniform float shade;uniform vec2 lc;uniform vec2 gc;uniform float heroA;uniform float oilOn;uniform float oilP;uniform float oilUnder;uniform float hostTop;uniform float hostH;',
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
      '  float br=sin(t*.29)*.5+.5;float br2=sin(t*.19+1.7);',
      '  float d=blob(p,vec2(.52*a,-.18)+(mm-vec2(.52*a,.5))*vec2(' + FOLLOW_LOW[0].toFixed(3) + ',' + FOLLOW_LOW[1].toFixed(3) + '),vec2(.62*a,.62)*(1.+.05*br))*1.15;',
      '  d+=blob(p,vec2(.4*a,.5)+(mm-vec2(.4*a,.5))*' + FOLLOW.toFixed(3) + '+.035*vec2(sin(t*.21),cos(t*.17)),vec2(.26,.28)*(1.+.07*br2))*.85;',
      '  d+=blob(p,vec2(-.05*a,.45)+.04*vec2(sin(t*.13),cos(t*.11)),vec2(.38*a,.7))*.55;',
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
      ['res', 't', 'm', 'seed', 'grain', 'flip', 'frac', 'fadeFrom', 'lt', 'base', 'soft', 'shade', 'bx', 'lc', 'gc', 'heroA', 'oilOn', 'oilP', 'oilUnder', 'hostTop', 'hostH'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    }
  }
  if (!gl) {
    canvas.style.background = 'radial-gradient(60% 60% at 75% 25%, #eef0ff, #aeb6fa 40%, #2e0cf2 75%, #160686)';
  }

  var dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    var from = oilP, t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / OIL);
      oilP = from + (to - from) * inOut(k);
      if (k < 1) { requestAnimationFrame(step); return; }
      if (to >= 1) oilMode(false);
      if (done) done();
    })(t0);
  }
  /* ondergrond: 'opposite' = de andere kleur dan het huidige thema, 'same' = de eigen achtergrond */
  function under(mode) { var l = light(); return (mode === 'same' ? l : !l) ? 1 : 0; }
  window.kerjaHaze.grow = function (done, mode) { runOil(1, under(mode || 'opposite'), done); };
  window.kerjaHaze.sink = function (done) { runOil(0, under('opposite'), done); };
  window.kerjaHaze.show = function () { oilP = 1; oilMode(false); };
  /* aankomst: meteen alleen de ondergrond, de groei start vanuit de pagina-overgang */
  if (window.kerjaPtEnter && !reduce && gl) { oilP = 0; oilUnder = under('opposite'); oilMode(true); }
  else root.classList.remove('pt-oil');

  var visible = true, running = false, start = performance.now(), lastSeed = 0, lastUpdate = 0, seed = 7;
  function frame(now) {
    running = false;
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
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (reduce || now - lastUpdate > 120) { update(); lastUpdate = now; }
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
