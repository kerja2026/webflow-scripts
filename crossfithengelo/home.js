/* ═══════════════════════════════════════════════════════════
   CROSSFIT HENGELO — Home-pagina
   Alleen op de homepage laden (page footer), NIET site-breed.
   Vereist: GSAP + ScrollTrigger (site-breed in <head> geladen).
   Let op: video-autoplay staat al in crossfithengelo.js — hier weggelaten.
   ═══════════════════════════════════════════════════════════ */

/* ─── Hero text mask ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  var lines = document.querySelectorAll('.line-mask .line-inner');
  gsap.from(lines, {
    clipPath: 'inset(0 100% 0 0)',
    duration: 1,
    stagger: 0.2,
    ease: 'power4.inOut',
    delay: 0.3,
  });
});

/* ─── Marquee ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  var wrapper = document.querySelector('.scrolling-text-wrapper');
  var original = document.querySelector('.scrolling-text');
  if (!wrapper || !original) return;

  wrapper.appendChild(original.cloneNode(true));

  var xPos = 0;
  var currentSpeed = 0;
  var baseSpeed = -1.5;
  var targetSpeed = baseSpeed;
  var itemWidth = original.offsetWidth;

  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: function (self) {
      var vel = self.getVelocity();
      targetSpeed = gsap.utils.clamp(-30, 30, vel * -0.04);
    },
  });

  gsap.ticker.add(function () {
    currentSpeed += (targetSpeed - currentSpeed) * 0.08;
    targetSpeed += (baseSpeed - targetSpeed) * 0.03;
    xPos += currentSpeed;
    if (xPos <= -itemWidth) xPos += itemWidth;
    if (xPos >= 0) xPos -= itemWidth;
    gsap.set(wrapper, { x: xPos });
  });
});

/* ─── Zwevende proefles-knop ───────────────────────────────── */
(function () {
  var btn = document.getElementById('proefles-btn');
  if (!btn) return;
  var img = btn.querySelector('img');
  const FLOAT_RANGE      = 10;
  const FLOAT_SPEED      = 0.001;
  const TILT_RANGE       = 12;
  const TILT_SPEED       = 0.001;
  const SCROLL_INFLUENCE = 40;
  const ATTRACT_RADIUS   = 700;
  const ATTRACT_STRENGTH = 0.5;
  const centerY    = window.innerHeight * 0.5 - 100;
  const centerX    = window.innerWidth - 60;
  let currentY     = -220;
  let entered      = false;
  let startTime    = null;
  let targetShift  = 0;
  let currentShift = 0;
  let lastScrollY  = window.scrollY;
  // Cursor aantrekking
  let mouseX = -1000;
  let mouseY = -1000;
  let attractX = 0;
  let attractY = 0;
  let currentAttractX = 0;
  let currentAttractY = 0;
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  window.addEventListener('scroll', function () {
    if (!entered) return;
    const delta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    targetShift += delta * 0.4;
    targetShift = Math.max(-SCROLL_INFLUENCE, Math.min(SCROLL_INFLUENCE, targetShift));
  });
  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const t = timestamp - startTime;
    const floatOffset = Math.sin(t * FLOAT_SPEED) * FLOAT_RANGE;
    const tiltAngle   = Math.sin(t * TILT_SPEED)  * TILT_RANGE;
    if (!entered) {
      currentY += (centerY - currentY) * 0.07;
      if (Math.abs(centerY - currentY) < 0.5) {
        currentY = centerY;
        entered  = true;
      }
    } else {
      // Scroll shift
      currentShift += (targetShift - currentShift) * 0.04;
      targetShift  *= 0.92;
      currentY = centerY + currentShift;
      // Cursor aantrekking
      const btnY = currentY + floatOffset;
      const dx = mouseX - centerX;
      const dy = mouseY - btnY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ATTRACT_RADIUS) {
        const strength = (1 - dist / ATTRACT_RADIUS) * ATTRACT_STRENGTH;
        attractX = dx * strength;
        attractY = dy * strength;
      } else {
        attractX = 0;
        attractY = 0;
      }
      // Ease naar attractie, ease terug naar 0
      currentAttractX += (attractX - currentAttractX) * 0.04;
      currentAttractY += (attractY - currentAttractY) * 0.04;
    }
    btn.style.top   = (currentY + floatOffset + currentAttractY) + 'px';
    btn.style.right = (60 - currentAttractX) + 'px';
    img.style.transform = `rotate(${tiltAngle}deg)`;
    requestAnimationFrame(loop);
  }
  setTimeout(function () {
    btn.style.opacity = '1';
    requestAnimationFrame(loop);
  }, 1500);
})();
