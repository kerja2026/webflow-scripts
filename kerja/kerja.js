/* CURSOR BLOB */
(function () {
  const blob = document.querySelector('.cursor-blob');
  if (!blob) return;

  // Volg de muis soepel met GSAP
  window.addEventListener('mousemove', (e) => {
    gsap.to(blob, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.5,
      ease: 'power3.out'
    });
  });

  // Blur op hover van interactieve elementen
  const hoverTargets = document.querySelectorAll('a, button, [data-hover]');
  hoverTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => blob.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => blob.classList.remove('is-hovering'));
  });
})();

/* BLUR ON SCROLL */
(function () {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 65vh;
    pointer-events: none;
    z-index: 9990;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
    transition: backdrop-filter 0.4s ease, -webkit-backdrop-filter 0.4s ease;
    -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
  `;
  document.body.appendChild(overlay);

  let lastScrollY = window.scrollY;
  const THRESHOLD = 50;

  window.addEventListener("scroll", () => {
    const currentScrollY = Math.max(0, window.scrollY);
    const delta = currentScrollY - lastScrollY;

    if (Math.abs(delta) < THRESHOLD) return;

    const scrollingDown = delta > 0;

    if (scrollingDown && currentScrollY > 50) {
      overlay.style.backdropFilter = "blur(6px)";
      overlay.style.webkitBackdropFilter = "blur(6px)";
    } else {
      overlay.style.backdropFilter = "blur(0px)";
      overlay.style.webkitBackdropFilter = "blur(0px)";
    }

    lastScrollY = currentScrollY;
  }, { passive: true });
})();

/* SMOOTH SCROLL */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true
});

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

/* BLURRED TEXT */
(function () {
  const words = [
    { holder: ".reshaping_holder",   text: ".reshaping_heading"   },
    { holder: ".rebranding_holder",  text: ".rebranding_heading"  },
    { holder: ".reinventing_holder", text: ".reinventing_heading" }
  ];

  function initBlur({ holder: holderSel, text: textSel }) {
    const holder = document.querySelector(holderSel);
    if (!holder) return;

    const textEl = holder.querySelector(textSel);
    if (!textEl) return;

    const originalText = textEl.textContent.trim();
    textEl.innerHTML = originalText
      .split("")
      .map(char => `<span style="display:inline;">${char === " " ? "&nbsp;" : char}</span>`)
      .join("");

    const spans = Array.from(textEl.querySelectorAll("span"));

    gsap.set(spans, { filter: "blur(20px)" });
    return spans;
  }

  function ambientFlicker(span) {
    const delay  = 2 + Math.random() * 4;
    const blur   = 2 + Math.random() * 4;
    const hold   = 0.3 + Math.random() * 1;
    const inDur  = 0.3 + Math.random() * 0.5;
    const outDur = 0.5 + Math.random() * 1;
    gsap.timeline({ delay })
      .to(span, {
        filter: `blur(${blur}px)`,
        duration: inDur,
        ease: "sine.inOut"
      })
      .to(span, {
        filter: "blur(0px)",
        duration: outDur,
        ease: "sine.inOut",
        delay: hold,
        onComplete: () => ambientFlicker(span)
      });
  }

  function addHover(span) {
    span.addEventListener("mouseenter", () => {
      gsap.killTweensOf(span);
      gsap.to(span, {
        filter: "blur(18px)",
        duration: 0.5,
        ease: "sine.inOut"
      });
    });
    span.addEventListener("mouseleave", () => {
      gsap.to(span, {
        filter: "blur(0px)",
        duration: 1.2,
        ease: "sine.inOut",
        onComplete: () => ambientFlicker(span)
      });
    });
  }

  function initReachingOut() {
    const link = document.querySelector(".reaching-out");
    if (!link) return;
    gsap.set(link, { filter: "blur(0px)" });
    link.addEventListener("mouseenter", () => {
      gsap.killTweensOf(link);
      gsap.to(link, {
        filter: "blur(6px)",
        duration: 0.6,
        ease: "sine.inOut"
      });
    });
    link.addEventListener("mouseleave", () => {
      gsap.to(link, {
        filter: "blur(0px)",
        duration: 1.5,
        ease: "sine.inOut"
      });
    });
  }

  function init() {
    if (typeof gsap === "undefined") {
      console.warn("GSAP niet geladen");
      return;
    }

    const allSpans = [];
    words.forEach(word => {
      const spans = initBlur(word);
      if (spans) allSpans.push(...spans);
    });

    gsap.to(allSpans, {
      filter: "blur(0px)",
      duration: 2.5,
      ease: "power2.out",
      stagger: { amount: 1.5, from: "random" },
      onComplete: () => {
        allSpans.forEach(span => {
          addHover(span);
          gsap.delayedCall(Math.random() * 2, () => ambientFlicker(span));
        });
      }
    });

    initReachingOut();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
