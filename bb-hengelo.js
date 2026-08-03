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
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 3
    }
  });
}

/* MARQUEE */
const mSection = document.getElementById("marquee-section");
const mTrack = document.getElementById("marquee-track");
if (mSection && mTrack) {
  const ENTRANCE_OFFSET = 40;
  const firstCard = mTrack.firstElementChild;

  // Natuurlijke positie vastleggen VOORDAT er enige transform op mTrack staat
  const naturalLeft = firstCard ? firstCard.getBoundingClientRect().left : 0;
  const restX = -(naturalLeft + ENTRANCE_OFFSET);

  const getMaxShift = () => -(mTrack.scrollWidth - mSection.offsetWidth + 100);

  let mDrag;

  gsap.set(mTrack, { x: "100vw" });

  gsap.timeline({
    scrollTrigger: {
      trigger: mSection,
      start: "top 10%",
      once: true,
      refreshPriority: 1
    }
  }).to(mTrack, {
    x: restX,
    ease: "power4.out",
    duration: 2,
    onComplete: () => {
      mDrag = Draggable.create(mTrack, {
        type: "x",
        bounds: { minX: getMaxShift(), maxX: restX },
        edgeResistance: 0.65,
        inertia: true,
        cursor: "grab",
        activeCursor: "grabbing"
      })[0];
    }
  });

  ScrollTrigger.addEventListener("refresh", () => {
    if (mDrag) mDrag.applyBounds({ minX: getMaxShift(), maxX: restX });
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

/* INFO CARDS — desktop: vanaf rechts, mobiel: van onder naar boven */
const infoSection2 = document.getElementById("info-section-2");
const infoCards = [
  { el: document.getElementById("info-card-1"), x: "18.75vw", y: "18vh", xMob: "5vw", yMob: "8vh",  rotation: -6, z: 1 },
  { el: document.getElementById("info-card-2"), x: "38.75vw", y: "12vh", xMob: "5vw", yMob: "10vh", rotation: -2, z: 2 },
  { el: document.getElementById("info-card-3"), x: "58.75vw", y: "16vh", xMob: "5vw", yMob: "12vh", rotation: 5,  z: 3 }
];

if (infoSection2 && infoCards.every(c => c.el)) {
  const mm = gsap.matchMedia();

  mm.add("(min-width: 768px)", () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: infoSection2,
        start: "top 10%",
        end: "+=150%",
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 2
      }
    });
    infoCards.forEach((card, i) => {
      gsap.set(card.el, { y: card.y, rotation: card.rotation, zIndex: card.z });
      tl.fromTo(card.el,
        { x: "110vw" },
        { x: card.x, ease: "power2.out", duration: 1 },
        i * 1.2
      );
    });
  });

  mm.add("(max-width: 767px)", () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: infoSection2,
        start: "top 10%",
        end: "+=150%",
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 2
      }
    });
    infoCards.forEach((card, i) => {
      gsap.set(card.el, { x: card.xMob, rotation: card.rotation, zIndex: card.z });
      tl.fromTo(card.el,
        { y: "110vh" },
        { y: card.yMob, ease: "power2.out", duration: 1 },
        i * 1.2
      );
    });
  });
}

/* INFO CARDS HOVER — alleen desktop */
gsap.matchMedia().add("(min-width: 768px)", () => {
  infoCards.forEach((card) => {
    if (!card.el) return;
    card.el.addEventListener("mouseenter", () => {
      gsap.to(card.el, { rotation: 0, scale: 1.1, zIndex: 10, ease: "power2.out", duration: 0.4 });
    });
    card.el.addEventListener("mousemove", (e) => {
      const rect = card.el.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      gsap.to(card.el, { xPercent: dx * 4, yPercent: dy * 4, ease: "elastic.out(1,1)", duration: 1 });
    });
    card.el.addEventListener("mouseleave", () => {
      gsap.to(card.el, { xPercent: 0, yPercent: 0, rotation: card.rotation, scale: 1, zIndex: card.z, ease: "elastic.out(1,0.3)", duration: 1 });
    });
  });
});

/* CUSTOM SUBMIT BUTTON */
document.querySelectorAll(".submit_btn_holder").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const form = btn.closest("form");
    if (form) form.requestSubmit();
  });
});

ScrollTrigger.sort();
window.addEventListener("load", () => {
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
});


/* ============================================================
   MESH GRADIENT BACKGROUND — scroll-driven
   Gebruikt de bestaande gsap.registerPlugin + Lenis bovenaan dit bestand.
   ============================================================ */
(() => {
  const mesh = document.getElementById("bbh-mesh");
  if (!mesh) return;

  const root   = document.documentElement;
  const blobs  = gsap.utils.toArray("#bbh-mesh .bbh-blob");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TRAVEL = 2.5;   // reisafstand 250%
  const SCRUB  = 2.5;   // scrub-lag 2.5s

  /* Per blob twee etappes, zodat het pad krom is en de blobs
     langs elkaar heen bewegen in plaats van als één blok. */
  const PATHS = [
    { sel: ".bbh-blob.b1", a: { yPercent:   8, xPercent:   5, scale: 1.10 }, b: { yPercent:  20, xPercent:  16, scale: 1.22 } },
    { sel: ".bbh-blob.b2", a: { yPercent:  14, xPercent: -12, scale: 1.14 }, b: { yPercent:  34, xPercent:  -4, scale: 0.92 } },
    { sel: ".bbh-blob.b3", a: { yPercent: -16, xPercent:  14, scale: 1.18 }, b: { yPercent: -34, xPercent:  34, scale: 1.32 } },
    { sel: ".bbh-blob.b4", a: { yPercent: -26, xPercent:  -8, scale: 1.20 }, b: { yPercent: -58, xPercent: -22, scale: 1.55 } },
    { sel: ".bbh-blob.b5", a: { yPercent: -10, xPercent:  18, scale: 0.90 }, b: { yPercent: -26, xPercent:   6, scale: 1.16 } }
  ];

  /* Kleuren komen uit de CSS-variabelen in :root, de tinten leidt GSAP
     eruit af. Wijzig je de merkkleuren in de CSS, dan volgt dit mee.
     De gradient kantelt bij het scrollen: bovenin dieper aubergine,
     onderin frisser teal. */
  const css = getComputedStyle(root);
  const C   = n => css.getPropertyValue("--bbh-" + n).trim();
  const mix = (a, b, t) => gsap.utils.interpolate(a, b, t);

  const AUB = C("aubergine"), PLUM = C("plum"), NAVY = C("navy"), TEAL = C("teal");
  const BLACK = "#000000", WHITE = "#ffffff";

  const STOPS_START = {
    top:    mix(AUB, BLACK, 0.30),
    upper:  AUB,
    mid:    PLUM,
    lower:  NAVY,
    bottom: TEAL
  };
  const STOPS_END = {
    top:    mix(AUB, BLACK, 0.46),
    upper:  mix(AUB, PLUM, 0.35),
    mid:    mix(PLUM, WHITE, 0.10),
    lower:  mix(NAVY, TEAL, 0.32),
    bottom: mix(TEAL, WHITE, 0.16)
  };

  const scale = v => ({
    yPercent: v.yPercent * TRAVEL,
    xPercent: v.xPercent * TRAVEL,
    scale: 1 + (v.scale - 1) * TRAVEL
  });

  const tl = gsap.timeline({
    defaults: { ease: "none", duration: 0.5 },
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: SCRUB,
      invalidateOnRefresh: true,
      refreshPriority: -1        // ná de gepinde secties herberekenen
    }
  });

  PATHS.forEach(p => {
    tl.to(p.sel, scale(p.a), 0);
    tl.to(p.sel, scale(p.b), 0.5);
  });

  const stops = { ...STOPS_START };
  tl.to(stops, {
    ...STOPS_END,
    duration: 1,
    onUpdate() {
      root.style.setProperty("--bbh-c-top",    stops.top);
      root.style.setProperty("--bbh-c-upper",  stops.upper);
      root.style.setProperty("--bbh-c-mid",    stops.mid);
      root.style.setProperty("--bbh-c-lower",  stops.lower);
      root.style.setProperty("--bbh-c-bottom", stops.bottom);
    }
  }, 0);

  /* Idle drift — heel langzaam, zodat de achtergrond stil ook leeft */
  if (!reduce) {
    blobs.forEach((el, i) => {
      gsap.to(el, {
        x: gsap.utils.random(-40, 40),
        y: gsap.utils.random(-40, 40),
        duration: gsap.utils.random(14, 22),
        repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.6
      });
    });
  }

  /* Reactie op scrollsnelheid — korte saturatie-flare, max +28% */
  const satTo = gsap.quickTo(root, "--bbh-sat", { duration: 0.6, ease: "power2.out" });
  ScrollTrigger.create({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    onUpdate(self) {
      if (reduce) return;
      const v = Math.min(Math.abs(self.getVelocity()) / 2400, 1);
      satTo(1 + v * 0.28);
    }
  });

  if (reduce) root.style.setProperty("--bbh-intensity", 0.6);

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
