/* Regels die rechttrekken: elk element met data-line-tilt (bijvoorbeeld "-3") wordt per regel gesplitst.
   Elke regel start op die hoek en staat recht zodra hij midden in het venster staat. Werkt naast data-parallax op hetzelfde element. */
document.addEventListener("DOMContentLoaded",function(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  if(!window.gsap||!window.SplitText||!window.ScrollTrigger)return;
  gsap.registerPlugin(SplitText,ScrollTrigger);
  document.querySelectorAll("[data-line-tilt]").forEach(function(el){
    var ang=parseFloat(el.getAttribute("data-line-tilt"))||-3,prev=[];
    SplitText.create(el,{type:"lines",autoSplit:true,onSplit:function(s){
      prev.forEach(function(a){a.scrollTrigger&&a.scrollTrigger.kill();a.kill();});
      prev=s.lines.map(function(line){
        return gsap.fromTo(line,{rotation:ang},{rotation:0,ease:"none",transformOrigin:"50% 50%",
          scrollTrigger:{trigger:line,start:"top bottom",end:"center center",scrub:true}});
      });
    }});
  });
});
