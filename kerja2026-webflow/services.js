/* Kerja 2026 — services.js
   Geladen: alleen pagina Services, footer
   Services-vlakken met hover en de reviews.
   Bron: github.com/kerja2026/webflow-scripts, map kerja2026-webflow. Wijzig hier, niet in Webflow. */

/* Services (alleen deze pagina, [data-services]):
   - mouse-out: vier gelijke vlakken (Webflow, .services_item flex 1)
   - hover over een vlak: dat vlak groeit naar GROW keer de breedte van de andere (is-active),
     de andere vlakken schuiven opzij en worden smal; de verschuiving duurt DUR ms (ease-out)
   - de tekst in het actieve vlak ([data-services-text]) verschijnt zoals bij een pagina-overgang:
     willekeurige groepjes van 3 of 4 woorden, abrupt, binnen DUR ms; in het vorige vlak verdwijnt hij zo
   - alleen op desktop met een muis (MQ); tablet en mobiel: vlakken onder elkaar, tekst altijd zichtbaar
   is-active en svc-hide worden alleen door dit script gezet; de CSS staat hieronder. */
(function () {
  var list = document.querySelector('[data-services]');
  if (!list) return;
  var DUR = 600;   // ms voor verschuiven en tekst
  var GROW = 5.25; // breedte van het actieve vlak t.o.v. de andere
  var MQ = window.matchMedia('(min-width: 992px) and (hover: hover) and (pointer: fine)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = Array.prototype.slice.call(list.querySelectorAll('[data-services-item]'));

  var css = document.createElement('style');
  css.textContent = '@media (min-width: 992px){.services_item{transition:flex-grow ' + (reduce ? 0 : DUR) + 'ms cubic-bezier(.22,1,.36,1)}' +
    '.services_item.is-active{flex-grow:' + GROW + '}}.svc-hide{visibility:hidden}';
  document.head.appendChild(css);

  /* tekst in losse woorden */
  items.forEach(function (it) {
    var p = it.querySelector('[data-services-text]');
    it._words = [];
    it._timers = [];
    if (!p) return;
    var frag = document.createDocumentFragment();
    p.textContent.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
      var s = document.createElement('span');
      s.textContent = part;
      frag.appendChild(s);
      it._words.push(s);
    });
    p.textContent = '';
    p.appendChild(frag);
  });

  /* woorden gehusseld, in groepjes van 3 of 4 */
  function groups(ws) {
    ws = ws.slice();
    for (var i = ws.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = ws[i]; ws[i] = ws[j]; ws[j] = t; }
    var out = [];
    for (var k = 0; k < ws.length;) { var n = Math.random() < 0.5 ? 3 : 4; out.push(ws.slice(k, k + n)); k += n; }
    return out;
  }
  function show(it, on, dur) {
    it._timers.forEach(clearTimeout);
    it._timers = [];
    if (reduce || !dur) { it._words.forEach(function (w) { w.classList.toggle('svc-hide', !on); }); return; }
    groups(it._words).forEach(function (g) {
      it._timers.push(setTimeout(function () {
        g.forEach(function (w) { w.classList.toggle('svc-hide', !on); });
      }, Math.random() * dur));
    });
  }

  var active = null;
  function activate(it) {
    if (it === active) return;
    if (active) { active.classList.remove('is-active'); show(active, false, DUR / 2); }
    active = it;
    if (it) { it.classList.add('is-active'); show(it, true, DUR); }
  }

  /* desktop: tekst verborgen tot hover; anders: alles zichtbaar */
  function setup() {
    activate(null);
    items.forEach(function (it) { show(it, !MQ.matches, 0); });
  }
  setup();
  if (MQ.addEventListener) MQ.addEventListener('change', setup); else if (MQ.addListener) MQ.addListener(setup);

  items.forEach(function (it) {
    it.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'mouse' && MQ.matches) activate(it);
    });
  });
  list.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse' && MQ.matches) activate(null);
  });
})();

/* Reviews (alleen deze pagina, [data-reviews]): er staat steeds één review in beeld.
   - klik op de linkerhelft: vorige review; rechterhelft: volgende; na de laatste komt de eerste
   - pijltjestoetsen links/rechts doen hetzelfde (de review is met Tab te bereiken)
   - wisselen: quote en naam verdwijnen in woordgroepen van 3 of 4 (OUT ms), daarna verschijnen
     de nieuwe op dezelfde manier (IN ms), net als bij de pagina-overgang
   - met een muis volgt een vlakje in de stijl van de menuknop ([data-reviews-label]) de cursor,
     LABEL_OFFSET rem rechtsonder; het toont Previous of Next, afhankelijk van de helft.
     role=button zorgt dat het cursorbolletje (site-code) zich vult boven de review
   - de eerste review staat ook in Webflow, zodat de pagina zonder script klopt
   De woorden krijgen de class pt-word, zodat de pagina-overgang ze ook per woordgroep afhandelt. */
(function () {
  var box = document.querySelector('[data-reviews]');
  if (!box) return;
  var quote = box.querySelector('[data-reviews-quote]');
  var author = box.querySelector('[data-reviews-author]');
  var label = box.querySelector('[data-reviews-label]');
  var labelText = label && label.querySelector('.menu_label');
  if (!quote || !author) return;
  var OUT = 600, IN = 600; // ms
  var LABEL_OFFSET = 0.75; // rem rechtsonder de cursor
  var REVIEWS = [
    { q: "Kerja has the ability to understand exactly what feeling we want to convey to our clients. It translates a conceptual idea effortlessly into a result that is spot-on and unique, every single time.", a: "Paul Ensink, CompetenSYS" },
    { q: "Kerja gave Jokidé a fresh, modern look that reflects our core values. Our vision was translated into a warm, inviting identity that appeals to both parents and children.", a: "Stefan ten Veen, Jokidé" },
    { q: "With patience and creativity, Kerja designed a logo that perfectly reflects my vision and the core values of IT Efficiency. I'm really happy with the result and the pleasant collaboration!", a: "Marieke van Gent, IT Efficiency" },
    { q: "With Kerja's guidance, we sharpened and strengthened our identity. Our proposition was translated impressively into a visual identity that perfectly reflects our core values.", a: "Iris Nicolaas, Fundaments" },
    { q: "Kerja is a great partner to work with. Quick to respond, always keeps its promises and delivers quality. On top of that, incredibly creative! What more could you want?", a: "Leonie van Davenhorst, TSN Zorg" },
    { q: "We're happy with our identity, in which Kerja visualised our core values perfectly. Thanks to Kerja's understanding and good collaboration, the design fits seamlessly with who we are.", a: "Cristel Rhemrev, Fortis" },
    { q: "Working with Kerja goes smoothly. It thinks along, goes the extra mile, and combines creativity with TIP Group's corporate guidelines. Its original, high-quality work is received enthusiastically across the whole organisation.", a: "Rick ter Weele, TIP Group" },
    { q: "With positive and creative energy, Kerja turned my wishes into a beautiful, fitting logo. It made for a fun, smooth collaboration and motivated me at the start of my own project.", a: "Isabelle Walter, Mission Solo" }
  ];
  var index = 0, busy = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  box.setAttribute('role', 'button');
  box.setAttribute('aria-label', 'Reviews. Click left for the previous review, right for the next. Arrow keys work too.');
  box.removeAttribute('aria-roledescription');

  var css = document.createElement('style');
  css.textContent = '.rv-hide{visibility:hidden}';
  document.head.appendChild(css);

  /* tekst in losse woorden zetten (pt-word) en de spans teruggeven */
  function fill(el, text) {
    el.textContent = '';
    var out = [];
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(part)); return; }
      var s = document.createElement('span');
      s.className = 'pt-word';
      s.textContent = part;
      el.appendChild(s);
      out.push(s);
    });
    return out;
  }
  /* bestaande woorden ophalen; staat er nog gewone tekst, dan eerst splitsen */
  function current(el) {
    var ws = el.querySelectorAll('.pt-word, .word-hover_word');
    return ws.length ? Array.prototype.slice.call(ws) : fill(el, el.textContent.replace(/\s+/g, ' ').trim());
  }
  function groups(ws) {
    ws = ws.slice();
    for (var i = ws.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = ws[i]; ws[i] = ws[j]; ws[j] = t; }
    var out = [];
    for (var k = 0; k < ws.length;) { var n = Math.random() < 0.5 ? 3 : 4; out.push(ws.slice(k, k + n)); k += n; }
    return out;
  }
  function scatter(ws, hide, dur, done) {
    groups(ws).forEach(function (g) {
      setTimeout(function () { g.forEach(function (w) { w.classList.toggle('rv-hide', hide); }); }, Math.random() * dur);
    });
    setTimeout(done, dur + 20);
  }

  function go(dir) {
    if (busy) return;
    var next = (index + dir + REVIEWS.length) % REVIEWS.length;
    if (reduce) {
      index = next;
      fill(quote, REVIEWS[index].q);
      fill(author, REVIEWS[index].a);
      return;
    }
    busy = true;
    var old = current(quote).concat(current(author));
    scatter(old, true, OUT, function () {
      index = next;
      var fresh = fill(quote, REVIEWS[index].q).concat(fill(author, REVIEWS[index].a));
      fresh.forEach(function (w) { w.classList.add('rv-hide'); });
      scatter(fresh, false, IN, function () { busy = false; });
    });
  }

  function side(x) {
    var r = box.getBoundingClientRect();
    return x < r.left + r.width / 2 ? -1 : 1;
  }

  box.addEventListener('click', function (e) { go(side(e.clientX)); });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  });

  /* vlakje dat met de cursor meebeweegt */
  if (label && fine) {
    var rem = function () { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; };
    var lx = 0, ly = 0, on = false;
    var place = function () {
      var o = LABEL_OFFSET * rem();
      label.style.transform = 'translate3d(' + (lx + o) + 'px,' + (ly + o) + 'px,0)';
      if (labelText) labelText.textContent = side(lx) < 0 ? 'Previous' : 'Next';
    };
    box.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      lx = e.clientX; ly = e.clientY;
      place();
      if (!on) { on = true; label.style.opacity = '1'; }
    });
    box.addEventListener('pointerleave', function () { on = false; label.style.opacity = '0'; });
    /* bij scrollen: verdwijnen als de cursor niet meer boven de review staat */
    window.addEventListener('scroll', function () {
      if (!on) return;
      var r = box.getBoundingClientRect();
      if (lx < r.left || lx > r.right || ly < r.top || ly > r.bottom) { on = false; label.style.opacity = '0'; }
      else place();
    }, { passive: true });
  }
})();
