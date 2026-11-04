/* Gekantelde afbeeldingen: starten op hun hoek uit de Designer en staan recht zodra ze midden in beeld staan (of op data-tilt-end) */
document.addEventListener("DOMContentLoaded",function(){
  if(!window.gsap||!window.ScrollTrigger)return;gsap.registerPlugin(ScrollTrigger);
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".main-wrapper *").forEach(function(el){
    if(el.closest(".band_component,.lr-menu")||el.tagName==="CANVAS")return;
    var cs=getComputedStyle(el),ang=0,r=cs.rotate;
    if(r&&r!=="none"){var mm=r.match(/(-?[\d.]+)deg/);ang=mm?parseFloat(mm[1]):0;if(ang)el.style.rotate="0deg";}
    else if(cs.transform&&cs.transform!=="none"){var n=cs.transform.match(/\(([^)]+)\)/)[1].split(",").map(parseFloat);ang=Math.atan2(n[1],n[0])*180/Math.PI;}
    if(Math.abs(ang)<.5||Math.abs(ang)>45)return;
    if(reduce){gsap.set(el,{rotation:0});return;}
    gsap.fromTo(el,{rotation:ang},{rotation:0,ease:"none",scrollTrigger:{trigger:el,start:"top bottom",end:el.getAttribute("data-tilt-end")||"center center",scrub:true}});
  });
});
