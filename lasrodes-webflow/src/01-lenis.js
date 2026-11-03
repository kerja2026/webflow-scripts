/* Smooth scroll: Lenis, gesynchroniseerd met GSAP ScrollTrigger */
document.addEventListener("DOMContentLoaded",function(){
  if(!window.Lenis||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var lenis=new Lenis({lerp:0.1,anchors:true});
  window.lenis=lenis;
  if(window.gsap&&window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    lenis.on("scroll",ScrollTrigger.update);
    gsap.ticker.add(function(t){lenis.raf(t*1000);});
    gsap.ticker.lagSmoothing(0);
  }else{
    (function raf(t){lenis.raf(t);requestAnimationFrame(raf);})(performance.now());
  }
});
