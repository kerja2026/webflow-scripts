/* Concert: foto groeit vanuit zijn midden van de ontwerpmaat naar schermvullend (10px rondom vrij), blijft staan terwijl de tekst eroverheen scrolt,
   en scrolt mee zodra de laatste regel op 10% boven de onderrand van de foto staat */
document.addEventListener("DOMContentLoaded",function(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var sec=document.querySelector(".section_concert"),w=document.querySelector(".concert_image-wrapper"),h=document.querySelector(".concert_heading");
  if(!sec||!w||!h)return;
  w.removeAttribute("data-parallax");
  var nat=null,secH0=0,K=.85;/* K: de foto scrolt 15% trager mee dan de tekst */
  function measure(){
    w.style.cssText="";sec.style.minHeight="";
    var r=w.getBoundingClientRect(),hr=h.getBoundingClientRect(),sr=sec.getBoundingClientRect(),y=window.scrollY,vh=window.innerHeight;
    nat={l:r.left,t:r.top+y,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+y+r.height/2,last:hr.bottom+y,secTop:sr.top+y};secH0=sr.height;
    nat.s0=nat.cy-vh/2;nat.D=.8*vh;nat.sR=Math.max(nat.last-.9*vh,nat.s0+nat.D);
    var need=nat.sR+vh*(1+(1-K)/K)-nat.secTop;if(need>secH0)sec.style.minHeight=need+"px";
    /* tekst en jaartal boven de vaste foto */
    [].forEach.call(w.parentElement.children,function(c){if(c!==w)c.style.zIndex=c.style.zIndex||"2";});
    w.style.position="fixed";w.style.zIndex="1";w.style.margin="0";w.style.transform="none";
    window.ScrollTrigger&&ScrollTrigger.refresh();
  }
  function frame(){
    if(nat){var y=window.scrollY,m=.625*parseFloat(getComputedStyle(document.documentElement).fontSize),vw=document.documentElement.clientWidth-2*m,vh=window.innerHeight-2*m,x0,y0,ww,hh;/* eindmaat: 10px (0,625rem) rondom vrij */
      if(y<nat.s0){ww=nat.w;hh=nat.h;x0=nat.l;y0=nat.t-nat.s0-(y-nat.s0)*K;}
      else if(y<nat.s0+nat.D){var p=(y-nat.s0)/nat.D;p=p*p*(3-2*p);ww=nat.w+(vw-nat.w)*p;hh=nat.h+(vh-nat.h)*p;x0=nat.cx+(m+vw/2-nat.cx)*p-ww/2;y0=m+(vh-hh)/2;}
      else if(y<nat.sR){ww=vw;hh=vh;x0=m;y0=m;}
      else{ww=vw;hh=vh;x0=m;y0=m-(y-nat.sR)*K;}
      w.style.left=x0+"px";w.style.top=y0+"px";w.style.width=ww+"px";w.style.height=hh+"px";
      w.style.visibility=(y0>vh+2*m||y0+hh<0)?"hidden":"visible";}
    requestAnimationFrame(frame);
  }
  window.addEventListener("load",measure);
  var rt;window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(measure,200);});
  measure();requestAnimationFrame(frame);
});
