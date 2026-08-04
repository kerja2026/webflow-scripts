/* ==========================================================
   BBH — Drag cursor voor de marquee
   Standalone: injecteert zijn eigen CSS, geen dependencies.

   - opent als cirkel en schaalt horizontaal uit naar de pill
   - pijltjes reageren op de richting van de muisbeweging
   - boven links krimpt hij terug naar cirkel en komt het handje
   ========================================================== */
(function () {
  'use strict';

  var CONFIG = {
    // LET OP: niet .marquee_track — die wordt getransformeerd door de
    // marquee-animatie, waardoor zijn hitbox onder de muis wegschuift.
    // .marquee_inner is 4080px breed en dekt de kaartenstrook altijd.
    target: '.marquee_inner',        // element dat de drag-cursor krijgt
    links: 'a, [role="link"]',       // hier weer het handje tonen
    label: 'Drag',
    from: '#5c6f61',                 // gradient links
    to: '#e9a81e',                   // gradient rechts
    ease: 0.2,                       // 0.1 = traag/zwaar, 1 = exact op de muis

    circleSize: 54,                  // px — diameter van de beginstand
    expandDur: 420,                  // ms — cirkel → volledige breedte
    openDelay: 60,                   // ms — cirkel eerst zien, dan pas openen
    collapseLead: 140,               // ms — eerst dichtklappen, dan pas faden
    handDelay: 260,                  // ms — na het dichtklappen komt het handje

    arrowShift: 6,                   // px — max uitslag van een pijltje
    arrowSpeed: 18,                  // px/frame muissnelheid = volle uitslag
    arrowEase: 0.25                  // demping van de richtingsuitslag
  };

  if (window.__bbhDragCursor) return;
  window.__bbhDragCursor = true;

  var S = CONFIG.circleSize;

  var CSS = [
    CONFIG.target + ',',
    CONFIG.target + ' * { cursor: none !important; }',
    /* .bbh-hand wint op specificiteit van de regel hierboven */
    CONFIG.target + ' .bbh-hand,',
    CONFIG.target + ' .bbh-hand * { cursor: pointer !important; }',

    '#bbh-drag-cursor {',
    '  position: fixed; top: 0; left: 0; z-index: 9999;',
    '  pointer-events: none; will-change: transform;',
    '}',

    '#bbh-drag-cursor .bbh-drag-cursor__pill {',
    '  box-sizing: border-box;',
    '  display: flex; align-items: center; justify-content: center; gap: 14px;',
    '  width: ' + S + 'px; height: ' + S + 'px; padding: 0 24px;',
    '  border-radius: 999px; overflow: hidden;',
    '  background: linear-gradient(90deg, ' + CONFIG.from + ' 0%, ' + CONFIG.to + ' 100%);',
    '  color: #fff; font-size: 19px; line-height: 1; letter-spacing: .01em;',
    '  white-space: nowrap; opacity: 0;',
    '  transform: translate(-50%, -50%) scale(.5);',
    '  transition: opacity .2s ease,',
    '              transform .3s cubic-bezier(.2,.8,.2,1),',
    '              width ' + CONFIG.expandDur + 'ms cubic-bezier(.2,.8,.2,1);',
    '  will-change: width, transform;',
    '}',

    /* inhoud staat er al, maar is pas zichtbaar als hij opengaat */
    '#bbh-drag-cursor .bbh-drag-cursor__pill > * {',
    '  flex: none; opacity: 0; transition: opacity .2s ease;',
    '}',

    '#bbh-drag-cursor .bbh-drag-cursor__pill.is-visible {',
    '  opacity: 1; transform: translate(-50%, -50%) scale(1);',
    '}',

    /* --w wordt in JS gemeten en gezet */
    '#bbh-drag-cursor .bbh-drag-cursor__pill.is-open { width: var(--w, 180px); }',
    '#bbh-drag-cursor .bbh-drag-cursor__pill.is-open > * { opacity: 1; transition-delay: .12s; }',

    '#bbh-drag-cursor .bbh-drag-cursor__pill.is-visible.is-down {',
    '  transform: translate(-50%, -50%) scale(.88);',
    '}',

    '#bbh-drag-cursor svg { width: 28px; height: 15px; will-change: transform; }',

    '@media (hover: none), (pointer: coarse) {',
    '  #bbh-drag-cursor { display: none; }',
    '  ' + CONFIG.target + ',',
    '  ' + CONFIG.target + ' * { cursor: auto !important; }',
    '}'
  ].join('\n');

  var ARROW_L = '<svg class="bbh-arrow-l" viewBox="0 0 30 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M29 8H1.5M8.5 1L1.5 8l7 7"/></svg>';
  var ARROW_R = '<svg class="bbh-arrow-r" viewBox="0 0 30 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8h27.5M21.5 1l7 7-7 7"/></svg>';

  function init() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var targets = document.querySelectorAll(CONFIG.target);
    if (!targets.length) return;

    var style = document.createElement('style');
    style.setAttribute('data-bbh', 'drag-cursor');
    style.textContent = CSS;
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.id = 'bbh-drag-cursor';
    wrap.innerHTML =
      '<div class="bbh-drag-cursor__pill">' +
      ARROW_L + '<span>' + CONFIG.label + '</span>' + ARROW_R +
      '</div>';
    document.body.appendChild(wrap);

    var pill = wrap.firstChild;
    var arrowL = pill.querySelector('.bbh-arrow-l');
    var arrowR = pill.querySelector('.bbh-arrow-r');

    var mx = 0, my = 0, cx = 0, cy = 0, lastMx = 0, vel = 0;
    var raf = null;
    var hideTimer = null, handTimer = null, openTimer = null, fadeTimer = null;
    var currentLink = null;

    /* ---- eindbreedte meten op een kloon, zodat de echte pill
       geen transitie meepakt. Achter fonts.ready, anders meten
       we de fallback-font en klopt de eindstand niet. ---- */
    function measure() {
      var ghost = pill.cloneNode(true);
      ghost.style.cssText =
        'position:absolute; visibility:hidden; width:auto; opacity:0; transition:none; transform:none;';
      wrap.appendChild(ghost);
      var w = Math.ceil(ghost.getBoundingClientRect().width);
      wrap.removeChild(ghost);
      pill.style.setProperty('--w', (w || 180) + 'px');
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    } else {
      measure();
    }

    function render() {
      wrap.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
    }

    function loop() {
      cx += (mx - cx) * CONFIG.ease;
      cy += (my - cy) * CONFIG.ease;
      render();

      // horizontale snelheid → uitslag van de pijltjes
      var dx = mx - lastMx;
      lastMx = mx;
      vel += (dx - vel) * CONFIG.arrowEase;

      var n = vel / CONFIG.arrowSpeed;
      if (n > 1) n = 1; else if (n < -1) n = -1;

      arrowL.style.transform = 'translateX(' + (Math.min(0, n) * CONFIG.arrowShift).toFixed(2) + 'px)';
      arrowR.style.transform = 'translateX(' + (Math.max(0, n) * CONFIG.arrowShift).toFixed(2) + 'px)';

      raf = requestAnimationFrame(loop);
    }

    function show() {
      clearTimeout(fadeTimer);
      pill.classList.add('is-visible');
      clearTimeout(openTimer);
      openTimer = setTimeout(function () {
        pill.classList.add('is-open');
      }, CONFIG.openDelay);
    }

    // eerst dichtklappen naar cirkel, dan pas wegfaden
    function hide() {
      clearTimeout(openTimer);
      pill.classList.remove('is-open');
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(function () {
        pill.classList.remove('is-visible', 'is-down');
      }, CONFIG.collapseLead);
    }

    function clearHand() {
      clearTimeout(handTimer);
      if (currentLink) currentLink.classList.remove('bbh-hand');
      currentLink = null;
    }

    function linkFrom(node) {
      return node && node.closest ? node.closest(CONFIG.links) : null;
    }

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });

    Array.prototype.forEach.call(targets, function (el) {

      el.addEventListener('mouseenter', function (e) {
        clearTimeout(hideTimer);
        // meteen op de cursorpositie zetten, anders vliegt hij in beeld
        mx = cx = lastMx = e.clientX;
        my = cy = e.clientY;
        vel = 0;
        render();
        if (!linkFrom(e.target)) show();
        if (!raf) raf = requestAnimationFrame(loop);
      });

      el.addEventListener('mouseleave', function () {
        clearHand();
        hide();
        hideTimer = setTimeout(function () {
          if (raf) { cancelAnimationFrame(raf); raf = null; }
        }, 600);
      });

      // link binnen: eerst dichtklappen naar cirkel, dan het handje
      el.addEventListener('mouseover', function (e) {
        var link = linkFrom(e.target);
        if (!link || !el.contains(link) || link === currentLink) return;
        clearHand();
        currentLink = link;
        hide();
        handTimer = setTimeout(function () {
          link.classList.add('bbh-hand');
        }, CONFIG.handDelay);
      });

      // link verlaten: handje weg, pill opent weer
      el.addEventListener('mouseout', function (e) {
        if (!currentLink) return;
        var to = e.relatedTarget;
        if (to && currentLink.contains(to)) return; // nog steeds binnen de link
        clearHand();
        if (to && el.contains(to)) show();
      });

      el.addEventListener('mousedown', function () {
        if (!currentLink) pill.classList.add('is-down');
      });
    });

    document.addEventListener('mouseup', function () {
      pill.classList.remove('is-down');
    });

    window.addEventListener('blur', function () {
      clearHand();
      hide();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
