/* Middenlijnen tekenen zich uit tijdens het scrollen: de punt van de lijn staat steeds op 70% van de vensterhoogte */
document.addEventListener("DOMContentLoaded",function(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var lines=[].slice.call(document.querySelectorAll(".raices_line,.raices_line-bottom,.voces_line,.voces_line-bottom,.voces_line-extra,.voz_line,.voz_line-bottom,.cierre_line,.footer_line"));
  if(!lines.length)return;
  (function tick(){
    var tip=.7*window.innerHeight;
    lines.forEach(function(l){var r=l.getBoundingClientRect();if(!r.height)return;
      var f=Math.min(1,Math.max(0,(tip-r.top)/r.height));
      l.style.clipPath="inset(0 0 "+((1-f)*100).toFixed(2)+"% 0)";});
    requestAnimationFrame(tick);})();
});
