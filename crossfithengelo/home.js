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
