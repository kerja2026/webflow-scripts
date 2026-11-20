/* Kerja 2026 — kerja.js
   Geladen: sitebreed, footer, na lenis.min.js
   Lenis, ankers, menu en scrollstatus, FAQ, split-hover, dots-lines, zigzag, woord-hover, logo, pagina-overgang en light/dark mode, cursor, coming soon.
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
   Ankers op dezelfde pagina, nieuwe tabbladen en mailto blijven zoals ze waren. */
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
        window.location.href = url;
      }, greetShown ? GREET_HOLD : 0);
    });
  }
  window.kerjaPageTransition = leave;

  /* aankomst na een overgang: alles verborgen; bij statements de woorden, zodat de kop zelf zichtbaar kan zijn */
  if (root.classList.contains('pt-enter')) {
    try { sessionStorage.removeItem(KEY); } catch (err) {}
    items().forEach(function (el) { el.classList.add('pt-hide'); });
    root.classList.remove('pt-enter');
    busy = true;
    setTimeout(build, 100);
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
          setTheme(light); // kleuren wisselen als alles in beeld verdwenen is
          build();
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
      var c = getComputedStyle(root).getPropertyValue('--light').trim() || '#eae3da';
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
