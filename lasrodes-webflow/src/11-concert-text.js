/* Concerttekst: crème waar de tekst over de foto valt + Tarará per regel op scroll */
document.addEventListener("DOMContentLoaded",function(){
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var w=document.querySelector(".concert_image-wrapper"),comp=document.querySelector(".concert_component");
  if(w&&comp){
    /* crème kopie van alle tekst in de sectie (kop, eyebrow, jaartal), alleen zichtbaar binnen de foto */
    var texts=[].filter.call(comp.children,function(e){return e!==w&&e.textContent.trim();});
    var box=document.createElement("div");box.setAttribute("aria-hidden","true");
    box.style.cssText="position:absolute;overflow:hidden;pointer-events:none;z-index:3";
    var pairs=texts.map(function(t){var c=document.createElement("div");c.className=t.className;c.innerHTML=t.innerHTML;
      c.style.cssText="position:absolute;margin:0;color:var(--color--cream)";
      [].forEach.call(c.querySelectorAll("*"),function(x){x.style.color="var(--color--cream)";});
      box.appendChild(c);return [t,c];});
    comp.appendChild(box);
    (function sync(){
      var cr=comp.getBoundingClientRect(),wr=w.getBoundingClientRect();
      box.style.left=(wr.left-cr.left)+"px";box.style.top=(wr.top-cr.top)+"px";
      box.style.width=wr.width+"px";box.style.height=wr.height+"px";
      pairs.forEach(function(p){var r=p[0].getBoundingClientRect(),s=p[1].style;
        s.left=(r.left-wr.left)+"px";s.top=(r.top-wr.top)+"px";s.width=r.width+"px";s.height=r.height+"px";});
      requestAnimationFrame(sync);
    })();
  }
  if(reduce||!window.gsap||!window.SplitText||!window.ScrollTrigger)return;
  gsap.registerPlugin(SplitText,ScrollTrigger);
  /* Tarará: per regel schuiven hele woorden van onder omhoog, licht na elkaar; volledig leesbaar zodra de regel op 75% van het venster staat */
  document.querySelectorAll(".voz_tarara").forEach(function(t){
    var prev=[];
    SplitText.create(t,{type:"lines,words",mask:"lines",autoSplit:true,onSplit:function(s){
      /* masker ruimer dan de regelhoogte, zodat de onderkant van de letters zichtbaar blijft */
      (s.masks||[]).forEach(function(m){m.style.paddingTop=".12em";m.style.paddingBottom=".25em";m.style.marginTop="-.12em";m.style.marginBottom="-.25em";});
      prev.forEach(function(a){a.scrollTrigger&&a.scrollTrigger.kill();a.kill();});
      prev=s.lines.map(function(line){
        var words=s.words.filter(function(w){return line.contains(w);});
        return gsap.fromTo(words,{yPercent:140},{yPercent:0,ease:"none",stagger:0.25,
          scrollTrigger:{trigger:line,start:"top bottom",end:"top 75%",scrub:true}});
      });
    }});
  });
});
