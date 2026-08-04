/* ==========================================================
   BBH — Drag cursor voor de marquee
   Standalone: injecteert zijn eigen CSS, geen dependencies.
   ========================================================== */
(function () {
  'use strict';

  var CONFIG = {
    target: '.marquee_track',   // element dat de drag-cursor krijgt
    label: 'Drag',
    from: '#5c6f61',            // gradient links
    to: '#e9a81e',              // gradient rechts
    ease: 0.2                   // 0.1 = traag/zwaar, 1 = exact op de muis
  };

  if (window.__bbhDragCursor) return;
  window.__bbhDragCursor = true;

  var CSS = [
    CONFIG.target + ',',
    CONFIG.target + ' * { cursor: none !important; }',
    '#bbh-drag-cursor {',
    '  position: fixed; top: 0; left: 0; z-index: 9999;',
    '  pointer-events: none; will-change: transform;',
    '}',
    '#bbh-drag-cursor .bbh-drag-cursor__pill {',
    '  display: flex; align-items: center; gap: 14px;',
    '  padding: 15px 24px; border-radius: 999px;',
    '  background: linear-gradient(90deg, ' + CONFIG.from + ' 0%, ' + CONFIG.to + ' 100%);',
    '  color: #fff; font-size: 19px; line-height: 1; letter-spacing: .01em;',
    '  white-space: nowrap; opacity: 0;',
    '  transform: translate(-50%, -50%) scale(.5);',
    '  transition: opacity .25s ease, transform .35s cubic-bezier(.2,.8,.2,1);',
    '}',
    '#bbh-drag-cursor .bbh-drag-cursor__pill.is-visible {',
    '  opacity: 1; transform: translate(-50%, -50%) scale(1);',
    '}',
    '#bbh-drag-cursor .bbh-drag-cursor__pill.is-visible.is-down {',
    '  transform: translate(-50%, -50%) scale(.88);',
    '}',
    '#bbh-drag-cursor svg { width: 28px; height: 15px; flex: none; }',
    '@media (hover: none), (pointer: coarse) {',
    '  #bbh-drag-cursor { display: none; }',
    '  ' + CONFIG.target + ',',
    '  ' + CONFIG.target + ' * { cursor: auto !important; }',
    '}'
  ].join('\n');

  var ARROW_L = '<svg viewBox="0 0 30 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M29 8H1.5M8.5 1L1.5 8l7 7"/></svg>';
  var ARROW_R = '<svg viewBox="0 0 30 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8h27.5M21.5 1l7 7-7 7"/></svg>';

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
    var mx = 0, my = 0, cx = 0, cy = 0;
    var raf = null, hideTimer = null;

    function render() {
      wrap.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
    }

    function loop() {
      cx += (mx - cx) * CONFIG.ease;
      cy += (my - cy) * CONFIG.ease;
      render();
      raf = requestAnimationFrame(loop);
    }

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });

    Array.prototype.forEach.call(targets, function (el) {
      el.addEventListener('mouseenter', function (e) {
        clearTimeout(hideTimer);
        // meteen op de cursorpositie zetten, anders vliegt hij in beeld
        mx = cx = e.clientX;
        my = cy = e.clientY;
        render();
        pill.classList.add('is-visible');
        if (!raf) raf = requestAnimationFrame(loop);
      });

      el.addEventListener('mouseleave', function () {
        pill.classList.remove('is-visible', 'is-down');
        hideTimer = setTimeout(function () {
          if (raf) { cancelAnimationFrame(raf); raf = null; }
        }, 400);
      });

      el.addEventListener('mousedown', function () {
        pill.classList.add('is-down');
      });
    });

    document.addEventListener('mouseup', function () {
      pill.classList.remove('is-down');
    });

    window.addEventListener('blur', function () {
      pill.classList.remove('is-visible', 'is-down');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
