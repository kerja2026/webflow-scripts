/* ==========================================================================
   PAGE TRANSITION — skyline
   De skyline valt uiteen in losse gebouwen die elk op hun eigen snelheid
   omhoog schuiven. Ze sluiten samen het scherm af, en lopen op de nieuwe
   pagina weer in eigen tempo naar boven weg.
   Vereist: GSAP 3.
   ========================================================================== */
(function () {
  'use strict';

  const CONFIG = {
    /* Alleen deze paden krijgen de transitie. Al het andere navigeert gewoon
       direct. Losse links kun je forceren of uitsluiten met
       data-transition="true" / data-transition="false" op de link (of op een
       parent, bijv. een hele footer). */
    include: [
      /^\/$/,                 // home
      /^\/work\/?$/,          // hoofdpagina's
      /^\/studio\/?$/,
      /^\/contact\/?$/,
      /^\/work\/[^/]+\/?$/    // CMS projectpagina's
    ],

    color:          '#F23610',
    coverDuration:  0.8,      // duur van het traagste gebouw
    revealDuration: 0.9,
    ease:           'power3.inOut',
    depth:          0.26,     // hoogte van de skyline t.o.v. de viewport

    buildingWidth:  88,       // richtbreedte van één gebouw in px
    spread:         0.65,     // snelste gebouw t.o.v. traagste (1 = gelijk)

    seedTop:        1207,     // verander voor een ander silhouet
    seedBottom:     8431,
    seedSpeed:      5150,     // verander voor een ander ritme

    revealOnLoad:   'always', // 'always' | 'after-transition'
    debug:          false     // logt interne links die zijn overgeslagen
  };

  const root    = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let panel, svg, geo = null, buildings = [], busy = false;

  /* ---------- ruis -------------------------------------------------------- */

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- silhouet ---------------------------------------------------- */

  /* Boven- en onderrand delen dezelfde kolomgrenzen, zodat elk gebouw zijn
     eigen boven- én ondervorm meeneemt als het beweegt. */
  function height(rnd, wide) {
    let v = 0.10 + Math.pow(rnd(), 1.6) * 0.55;
    if (!wide && rnd() < 0.16) v = 0.72 + rnd() * 0.28;
    return v;
  }

  function skyline(width, depth) {
    const rw = rng(CONFIG.seedTop);
    const rt = rng(CONFIG.seedTop ^ 0x9E3779B9);
    const rb = rng(CONFIG.seedBottom);
    const scale = Math.min(1.2, Math.max(0.55, width / 1920));
    const cols = [];
    let x = 0;

    while (x < width) {
      const wide = rw() < 0.28;
      let w = (wide ? 22 + rw() * 40 : 5 + rw() * 16) * scale;
      if (x + w > width) w = width - x;
      cols.push({
        x: x,
        w: w,
        top: depth * height(rt, wide),
        bot: depth * height(rb, wide)
      });
      x += w;
    }
    return cols;
  }

  /* Eén gesloten pad voor de kolommen from..to: skyline boven, massief
     midden, gespiegelde skyline onder. `pad` verbreedt de rechterrand een
     fractie, zodat aangrenzende gebouwen elkaar overlappen — anders laat de
     antialiasing een haarfijne naad op elke gebouwgrens achter. Bij het
     laatste gebouw valt de overlap buiten de viewBox en knipt de SVG hem weg. */
  function pathFor(cols, from, to, depth, vh, pad) {
    const floor = depth + vh;
    let d = '';

    for (let i = from; i <= to; i++) {
      const c = cols[i];
      const y = (depth - c.top).toFixed(1);
      d += (i === from ? 'M' + c.x.toFixed(1) + ' ' + y : ' V' + y);
      d += ' H' + (c.x + c.w + (i === to ? pad : 0)).toFixed(1);
    }
    for (let i = to; i >= from; i--) {
      const c = cols[i];
      d += ' V' + (floor + c.bot).toFixed(1) + ' H' + c.x.toFixed(1);
    }
    return d + ' Z';
  }

  /* ---------- ritme ------------------------------------------------------- */

  /* Vloeiende ruis: buren krijgen verwante snelheden, zodat de skyline golft
     in plaats van ritselt. Na normalisatie loopt het traagste gebouw op 1 en
     het snelste op CONFIG.spread. */
  function speeds(n, seed, spread) {
    const rnd = rng(seed);
    const steps = Math.max(3, Math.round(n / 4));
    const ctrl = [];
    for (let i = 0; i <= steps; i++) ctrl.push(rnd());

    const raw = [];
    for (let i = 0; i < n; i++) {
      const p  = n > 1 ? (i / (n - 1)) * steps : 0;
      const i0 = Math.floor(p);
      const f  = p - i0;
      const s  = f * f * (3 - 2 * f);
      const a  = ctrl[i0];
      const b  = ctrl[Math.min(i0 + 1, steps)];
      raw.push(a + (b - a) * s + (rnd() - 0.5) * 0.2);
    }

    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) {
      if (raw[i] < lo) lo = raw[i];
      if (raw[i] > hi) hi = raw[i];
    }
    const span = (hi - lo) || 1;

    return raw.map(function (v) {
      return 1 - ((v - lo) / span) * (1 - spread);
    });
  }

  /* ---------- paneel ------------------------------------------------------ */

  function build() {
    const w     = root.clientWidth;
    const vh    = window.innerHeight;
    const depth = Math.round(Math.min(320, Math.max(70, vh * CONFIG.depth)));
    const h     = vh + depth * 2;

    /* below = net onder beeld · cover = precies dekkend · above = net erboven */
    geo = { w: w, vh: vh, h: h, below: vh, cover: -depth, above: -h };

    panel.style.height = h + 'px';
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);

    const cols  = skyline(w, depth);
    const count = Math.max(6, Math.min(34, Math.round(w / CONFIG.buildingWidth)));
    const step  = w / count;

    /* Kolommen bundelen tot gebouwen die als blok bewegen */
    const spans = [];
    let slot = -1;
    for (let i = 0; i < cols.length; i++) {
      const b = Math.min(count - 1, Math.floor(cols[i].x / step));
      if (b !== slot) { spans.push({ from: i, to: i }); slot = b; }
      else spans[spans.length - 1].to = i;
    }

    const factors = speeds(spans.length, CONFIG.seedSpeed, CONFIG.spread);

    while (svg.firstChild) svg.removeChild(svg.firstChild);
    buildings = [];

    for (let i = 0; i < spans.length; i++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('class', 'kj-pt__shape');
      el.setAttribute('d', pathFor(cols, spans[i].from, spans[i].to, depth, vh, 1));
      svg.appendChild(el);
      buildings.push({ el: el, factor: factors[i] });
    }
  }

  function create() {
    panel = document.createElement('div');
    panel.className = 'kj-pt';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML =
      '<svg class="kj-pt__svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"></svg>';
    document.body.appendChild(panel);
    svg = panel.firstChild;
    build();
  }

  /* Lenis stilzetten tijdens de transitie. Werkt zodra kerja.js de instance
     als window.lenis beschikbaar maakt; zo niet, dan slaan we dit over. */
  function scroll(on) {
    const l = window.lenis;
    if (!l) return;
    if (on && typeof l.start === 'function') l.start();
    if (!on && typeof l.stop === 'function') l.stop();
  }

  /* Alle gebouwen van `from` naar `to`, elk op eigen snelheid. De callback
     volgt pas als het traagste gebouw klaar is — dus als de dekking dicht is. */
  function move(from, to, base, done) {
    let open = buildings.length;
    for (let i = 0; i < buildings.length; i++) {
      gsap.set(buildings[i].el, { y: from });
      gsap.to(buildings[i].el, {
        y: to,
        duration: base * buildings[i].factor,
        ease: CONFIG.ease,
        onComplete: function () { if (--open === 0 && done) done(); }
      });
    }
  }

  function place(y) {
    for (let i = 0; i < buildings.length; i++) gsap.set(buildings[i].el, { y: y });
  }

  /* ---------- de twee helften -------------------------------------------- */

  function reveal() {
    busy = true;
    panel.classList.add('is-active');
    place(geo.cover);
    root.removeAttribute('data-kj-pt');   // overdracht van de CSS-dekking
    try { sessionStorage.removeItem('kj-pt'); } catch (e) {}

    if (reduced) { finish(); return; }

    scroll(false);
    move(geo.cover, geo.above, CONFIG.revealDuration, finish);
  }

  function finish() {
    panel.classList.remove('is-active');
    scroll(true);
    busy = false;
    build();
  }

  function cover(url) {
    busy = true;
    panel.classList.add('is-active');
    place(geo.below);
    try { sessionStorage.setItem('kj-pt', '1'); } catch (e) {}

    scroll(false);
    move(geo.below, geo.cover, CONFIG.coverDuration, function () {
      window.location.href = url;
    });
  }

  /* ---------- welke links ------------------------------------------------- */

  const UI = '.w-tab-link, .w-dropdown-toggle, .w-lightbox, .w-slider-arrow,' +
             '.w-pagination-next, .w-pagination-previous, .w-nav-button';

  function match(e) {
    if (e.defaultPrevented || e.button !== 0) return null;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;

    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return null;
    if (a.hasAttribute('download')) return null;
    if (a.target && a.target !== '_self') return null;
    if (a.matches(UI)) return null;

    const flag = a.closest('[data-transition]');
    if (flag && flag.getAttribute('data-transition') === 'false') return null;

    const href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return null;

    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return null; }

    if (url.origin !== location.origin) return null;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.pathname === location.pathname && url.search === location.search) return null;

    if (flag && flag.getAttribute('data-transition') === 'true') return url.href;

    for (let i = 0; i < CONFIG.include.length; i++) {
      if (CONFIG.include[i].test(url.pathname)) return url.href;
    }
    if (CONFIG.debug) console.info('[kj-pt] overgeslagen:', url.pathname);
    return null;
  }

  /* ---------- init -------------------------------------------------------- */

  function init() {
    if (typeof gsap === 'undefined') {
      root.removeAttribute('data-kj-pt');
      console.warn('[kj-pt] GSAP niet geladen — page transition uit');
      return;
    }

    create();

    document.addEventListener('click', function (e) {
      const url = match(e);
      if (!url) return;
      e.preventDefault();
      if (busy) return;
      if (reduced) { window.location.href = url; return; }
      cover(url);
    });

    let timer, lastW = geo.w, lastH = geo.vh;
    window.addEventListener('resize', function () {
      const w = root.clientWidth;
      const h = window.innerHeight;
      /* op mobiel verspringt innerHeight door de adresbalk — die negeren we */
      if (busy || (w === lastW && Math.abs(h - lastH) < 120)) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        lastW = root.clientWidth;
        lastH = window.innerHeight;
        build();
      }, 150);
    });

    /* Terug-knop: de pagina komt uit de bfcache met het paneel nog dekkend */
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      for (let i = 0; i < buildings.length; i++) gsap.killTweensOf(buildings[i].el);
      build();
      reveal();
    });

    if (root.getAttribute('data-kj-pt') === 'enter') reveal();
    else root.removeAttribute('data-kj-pt');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
