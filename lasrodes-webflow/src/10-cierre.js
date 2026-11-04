/* Afsluiter: de kop scrolt gewoon in beeld en blijft staan zodra hij voor 95% zichtbaar is. Dan pas komen de zussen,
   die over de kop heen scrollen. Is de foto voor 10% boven het venster verdwenen, dan scrollt alles door; de foto iets trager. */
document.addEventListener("DOMContentLoaded",function(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var sec=document.querySelector(".section_cierre"),comp=sec&&sec.querySelector(".cierre_component"),h=sec&&sec.querySelector(".cierre_heading");
  if(!sec||!comp||!h)return;
  var img=sec.querySelector(".cierre_image-wrapper");if(img)img.removeAttribute("data-parallax");
  var pinned=[h,sec.querySelector(".cierre_line")].filter(Boolean);
  var lower=[img,sec.querySelector(".cierre_band-small"),sec.querySelector(".cierre_band"),sec.querySelector(".cierre_text")].filter(Boolean);
  var grow=[sec,comp,sec.querySelector(".cierre_bg")].filter(Boolean);
  var K=.9,st=null;
  function measure(){
    pinned.concat(lower).forEach(function(e){e.style.transform="";});grow.forEach(function(e){e.style.minHeight="";});
    var y=window.scrollY,vh=window.innerHeight,hr=h.getBoundingClientRect(),ir=img?img.getBoundingClientRect():hr;
    /* de tekst loopt buiten het tekstvak, dus meet de werkelijke regels */
    var rg=document.createRange();rg.selectNodeContents(h);var rs=[].slice.call(rg.getClientRects());
    var Ht=(rs.length?Math.min.apply(null,rs.map(function(q){return q.top;})):hr.top)+y,Hb=(rs.length?Math.max.apply(null,rs.map(function(q){return q.bottom;})):hr.bottom)+y,Hh=Hb-Ht;
    var It=ir.top+y,Ih=ir.height;
    /* kop voor 95% in beeld; past hij niet in het venster, dan zodra de laatste regel volledig in beeld staat */
    var sP=Hh<=vh?Ht+.95*Hh-vh:Hb-.95*vh;
    /* tablet en mobiel: de kop blijft hoger in het venster staan (onderkant op 70%), zodat hij helemaal leesbaar is voordat de zussen komen */
    if(window.innerWidth<992)sP=Math.max(Ht-.2*vh,Hb-.7*vh);
    var D=Math.max(0,vh+sP-It);/* foto start precies onder de onderrand van het venster */
    var L=vh+.1*Ih;/* vasthouden tot de foto voor 10% boven het venster is verdwenen */
    st={sP:sP,D:D,L:L};
    grow.forEach(function(e){e.style.minHeight=(e.getBoundingClientRect().height+Math.max(D,L)+.15*vh)+"px";});
    window.ScrollTrigger&&ScrollTrigger.refresh();
  }
  function frame(){
    if(st){var y=window.scrollY,hold=Math.min(st.L,Math.max(0,y-st.sP)),drift=Math.max(0,y-st.sP-st.L)*(1-K);
      pinned.forEach(function(e){e.style.transform="translate3d(0,"+hold+"px,0)";});
      lower.forEach(function(e){e.style.transform="translate3d(0,"+(st.D+(e===img?drift:0))+"px,0)";});}
    requestAnimationFrame(frame);
  }
  window.addEventListener("load",measure);
  var rt;window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(measure,200);});
  measure();requestAnimationFrame(frame);
});
