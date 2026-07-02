gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin);
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
/* HORIZONTAL SCROLL */
const hTrack = document.getElementById("hscroll-track");
const hSection = document.getElementById("hscroll-section");
if (hTrack && hSection) {
  const getDistance = () => hTrack.scrollWidth - hSection.offsetWidth + 50;
  gsap.to(hTrack, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: hSection,
      start: "top 150px",
      end: () => `+=${getDistance()}`,
      scrub: 1, // was: true — absorbeert Lenis-jitter beter
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });
}
/* MARQUEE */
const mSection = document.getElementById("marquee-section");
const mTrack = document.getElementById("marquee-track");
if (mSection && mTrack) {
  const getMaxShift = () => -(mTrack.scrollWidth - mSection.offsetWidth + 100);
  let mDrag;
  gsap.timeline({
    scrollTrigger: {
      trigger: mSection,
      start: "top 85%",
      once: true
    }
  }).fromTo(mTrack,
    { x: "100vw" },
    {
      x: 0,
      ease: "power4.out",
      duration: 2,
      onComplete: () => {
        mDrag = Draggable.create(mTrack, {
          type: "x",
          bounds: { minX: getMaxShift(), maxX: 0 },
          edgeResistance: 0.65,
          inertia: true,
          cursor: "grab",
          activeCursor: "grabbing"
        })[0];
      }
    }
  );
  // Herbereken drag-bounds na resize/refresh (bv. laat ladende webfonts of orientatiewissel)
  ScrollTrigger.addEventListener("refresh", () => {
    if (mDrag) mDrag.applyBounds({ minX: getMaxShift(), maxX: 0 });
  });
}
/* CARD TILT */
document.querySelectorAll("[data-tilt]").forEach((card) => {
  const matrix = new DOMMatrix(window.getComputedStyle(card).transform);
  const originalRotation = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
  card.addEventListener("mouseenter", () => {
    gsap.to(card, { rotation: 0, scale: 1.1, zIndex: 10, ease: "power2.out", duration: 0.4 });
  });
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    gsap.to(card, { x: dx * 15, y: dy * 15, ease: "elastic.out(1,1)", duration: 1 });
  });
  card.addEventListener("mouseleave", () => {
    gsap.to(card, { x: 0, y: 0, rotation: originalRotation, scale: 1, zIndex: 1, ease: "elastic.out(1,0.3)", duration: 1 });
  });
});
/* INFO CARDS — offset + rotatie via script, binnen schuiven op scroll */
const infoSection2 = document.getElementById("info-section-2");
const cardConfig = [
  { el: document.getElementById("info-card-1"), x: 0,   y: 0,   rotation: -8, z: 1 },
  { el: document.getElementById("info-card-2"), x: 120, y: 60,  rotation: 5,  z: 2 },
  { el: document.getElementById("info-card-3"), x: 240, y: 140, rotation: -4, z: 3 }
];
if (infoSection2 && cardConfig.every(c => c.el)) {
  const cardsTl = gsap.timeline({
    scrollTrigger: {
  trigger: infoSection2,
  start: "top 90%",
  end: "top top",
  scrub: 1,
  invalidateOnRefresh: true
}
  });
  cardConfig.forEach((card, i) => {
    gsap.set(card.el, {
      y: card.y,
      rotation: card.rotation,
      zIndex: card.z
    });
    cardsTl.fromTo(card.el,
      { x: "110vw" },
      { x: card.x, ease: "power2.out", duration: 1 },
      i * 0.6
    );
  });
}
// Herbereken alle ScrollTrigger-posities zodra fonts/afbeeldingen volledig geladen zijn
window.addEventListener("load", () => ScrollTrigger.refresh());
