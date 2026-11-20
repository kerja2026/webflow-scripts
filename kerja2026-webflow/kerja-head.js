/* Kerja 2026 — kerja-head.js
   Geladen: sitebreed, head, NIET defer/async: moet voor de eerste paint draaien
   Zet dl-anim, pt-enter en theme-light op html en meet --kerja-bottom-offset op mobiel.
   Bron: github.com/kerja2026/webflow-scripts, map kerja2026-webflow. Wijzig hier, niet in Webflow. */

/* Startstand zetten voor de eerste paint, zodat de lijnen niet eerst vol in beeld flitsen */
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('dl-anim');
}
/* Pagina-overgang: komt deze pagina na een overgang, dan alles verborgen starten */
try { if (sessionStorage.getItem('kerja-pt') === '1') document.documentElement.classList.add('pt-enter'); } catch (e) {}
/* Thema: dark is standaard, ook als de computer op licht staat. Alleen een eigen keuze voor light wordt onthouden. */
try { if (localStorage.getItem('kerja-theme') === 'light') document.documentElement.classList.add('theme-light'); } catch (e) {}
/* Mobiel: meten hoeveel het vaste beeld verder loopt dan het zichtbare scherm (zie de CSS bij --kerja-bottom-offset).
   Twee onzichtbare meetpunten: de onderkant van het vaste beeld en 100svh. Het verschil is de offset.
   Alleen bij laden en bij draaien van het scherm, niet tijdens scrollen, zodat het menu niet verspringt.
   Alleen op mobiel (tot 767px); op grotere schermen blijft het 0. */
(function () {
  var root = document.documentElement;
  function measure() {
    if (!document.body) return;
    if (!window.matchMedia('(max-width: 767px)').matches) { root.style.setProperty('--kerja-bottom-offset', '0px'); return; }
    var css = 'position:fixed;left:0;width:0;visibility:hidden;pointer-events:none;';
    var a = document.createElement('div');
    var b = document.createElement('div');
    a.style.cssText = css + 'bottom:0;height:0;';
    b.style.cssText = css + 'top:0;height:100svh;';
    document.body.appendChild(a);
    document.body.appendChild(b);
    var off = Math.round(a.getBoundingClientRect().top - b.getBoundingClientRect().bottom);
    a.remove(); b.remove();
    root.style.setProperty('--kerja-bottom-offset', (off > 0 ? off : 0) + 'px');
  }
  document.addEventListener('DOMContentLoaded', measure);
  window.addEventListener('orientationchange', function () { setTimeout(measure, 300); });
})();
