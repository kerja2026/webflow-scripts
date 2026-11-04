/* Foto die uit het patroon tevoorschijn komt: elk element met data-photo-reveal (de wrapper rond een foto).
   Bij binnenkomst is de foto bijna helemaal bedekt; tijdens het scrollen vallen de tegels van onder naar boven weg,
   en groeit de foto naar data-photo-scale (standaard 1.25). Klaar als de foto voor 85% in beeld is (data-photo-end), dan helemaal zichtbaar.
   De foto wordt op een canvas in de wrapper getekend, dus kanteling en schaal van de wrapper werken gewoon mee. */
document.addEventListener("DOMContentLoaded",function(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  if(!window.gsap||!window.ScrollTrigger)return;gsap.registerPlugin(ScrollTrigger);
  var SH={5:"M 20.1,-8.4 l 0,-11.8 l -11.8,0 l -8.4,-8.4 l -8.4,8.4 l -11.8,0 l 0,11.8 L -28.6,0 l 8.4,8.4 l 0,11.8 l 11.8,0 l 8.4,8.4 l 8.4,-8.4 l 11.8,0 l 0,-11.8 l 8.4,-8.4 l -8.4,-8.4 Z M 10.7,4.4 l 0,6.3 l -6.3,0 l -4.4,4.4 l -4.4,-4.4 l -6.3,0 l 0,-6.3 l -4.4,-4.4 l 4.4,-4.4 l 0,-6.3 l 6.3,0 l 4.4,-4.4 l 4.4,4.4 l 6.3,0 l 0,6.3 l 4.4,4.4 l -4.4,4.4 Z",0:"M -7.2,-7.2 L 7.2,-7.2 L 7.2,7.2 L -7.2,7.2 Z",1:"M 8.2,-7.15 L -2,-7.15 L -8.2,0.05 L -2,7.15 L 8.2,7.15 Z",2:"M -8.2,7.15 L 2.1,7.15 L 8.2,0.05 L 2.1,-7.15 L -8.2,-7.15 Z",4:"M -7.2,-8.2 L -7.2,2.1 L 0,8.2 L 7.2,2.1 L 7.2,-8.2 Z",3:"M 7.2,8.2 L 7.2,-2.1 L 0,-8.2 L -7.2,-2.1 L -7.2,8.2 Z",6:"M 15.15,0 L 10.75,4.4 L 10.75,10.7 L 4.45,10.7 L 0.05,15.1 L -4.45,10.7 L -10.65,10.7 L -10.65,4.4 L -15.15,0 L -10.65,-4.4 L -10.65,-10.7 L -4.45,-10.7 L 0.05,-15.1 L 4.45,-10.7 L 10.75,-10.7 L 10.75,-4.4 Z",7:"M-10.3,-10.3h20.6v20.6h-20.6z"};
  var P2={};for(var k in SH)P2[k]=new Path2D(SH[k]);
  function hash(a,b){var r=Math.sin(a*127.1+b*311.7)*43758.5453;return r-Math.floor(r);}
  document.querySelectorAll("[data-photo-reveal]").forEach(function(w){
    var img=w.querySelector("img");if(!img)return;
    var scale=parseFloat(w.getAttribute("data-photo-scale"))||1.25,cv=document.createElement("canvas"),x=cv.getContext("2d"),G=null,prog=0;
    cv.setAttribute("aria-hidden","true");cv.style.cssText="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none";
    w.appendChild(cv);
    function layout(){
      var W=w.clientWidth,H=w.clientHeight,d=Math.min(window.devicePixelRatio||1,2),rem=parseFloat(getComputedStyle(document.documentElement).fontSize),P=1.75*rem,cells=[];
      cv.width=Math.round(W*d);cv.height=Math.round(H*d);
      for(var j=-1;j<=H/P+1;j++)for(var i=-1;i<=W/P+1;i++)cells.push([i*P,j*P,hash(i,j),hash(i+.6,j+.2)]);
      G={W:W,H:H,d:d,P:P,cells:cells,band:14*P,rim:2.5*P};/* band: hoe geleidelijk de tegels verdwijnen; breed, zodat het in hetzelfde tempo gaat als de andere patronen */draw();
    }
    function piece(c,P,s){var k=P/62.6*s;[[0,0,0],[-.3,0,1],[.3,0,2],[0,-.3,3],[0,.3,4],[.5,.5,c[3]<.48?5:c[3]<.69?6:7]].forEach(function(pc){
      x.save();x.translate(c[0]+pc[0]*P,c[1]+pc[1]*P);x.scale(k,k);x.fill(P2[pc[2]],"evenodd");x.restore();});}
    function draw(){
      if(!G||!img.complete||!img.naturalWidth)return;var g=G,P=g.P;
      var front=g.H+g.band*1.6-prog*(g.H+g.band*3.2);/* onder het beeld bij 0, boven het beeld bij 1 */
      x.setTransform(g.d,0,0,g.d,0,0);x.globalCompositeOperation="source-over";x.clearRect(0,0,g.W,g.H);x.fillStyle="#000";
      g.cells.forEach(function(c){var v=Math.min((c[1]-front)/g.band,(g.H-c[1])/g.rim+.6+prog*4)-c[2]*.8;/* front van onder naar boven; de rafelrand onderaan verdwijnt tegen het eind, zodat de foto dan helemaal zichtbaar is */
        if(v<=0)return;if(v>=1){x.fillRect(c[0]-P/2,c[1]-P/2,P+1,P+1);return;}var s=v*v*(3-2*v);piece(c,P,s);});
      /* de foto zelf, op zijn plek en uitsnede zoals in de Designer (object-fit: cover) */
      var ox=img.offsetLeft,oy=img.offsetTop,ow=img.offsetWidth,oh=img.offsetHeight,nw=img.naturalWidth,nh=img.naturalHeight,s=Math.max(ow/nw,oh/nh),dw=nw*s,dh=nh*s;
      x.globalCompositeOperation="source-in";x.drawImage(img,ox+(ow-dw)/2,oy+(oh-dh)/2,dw,dh);x.globalCompositeOperation="source-over";
    }
    img.style.visibility="hidden";
    if(img.complete)layout();else img.addEventListener("load",layout);
    var rt;window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(layout,200);});
    /* zonder groei: voortgang direct uit de zichtbare positie. Nodig voor foto's die een ander script verplaatst (de afsluiter),
       daar klopt een ScrollTrigger-meting niet en mag niemand anders aan de transform zitten */
    if(scale===1){var endF=(parseFloat(w.getAttribute("data-photo-end"))||85)/100;
      (function tick(){var r=w.getBoundingClientRect(),np=r.height?Math.min(1,Math.max(0,(innerHeight-r.top)/(endF*r.height))):0;if(np!==prog){prog=np;draw();}requestAnimationFrame(tick);})();return;}
    gsap.fromTo(w,{scale:1},{scale:scale,ease:"none",scrollTrigger:{trigger:w,start:"top bottom",end:w.getAttribute("data-photo-end")||"85% bottom",scrub:true,
      onUpdate:function(st){prog=st.progress;draw();},onRefresh:function(st){prog=st.progress;draw();}}});
  });
});
