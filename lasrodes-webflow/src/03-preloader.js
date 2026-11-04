/* Preloader: rood scherm, logo vult zich van onder naar boven met crème terwijl de pagina laadt,
   schuift dan naar zijn plek in de nav; daarna verschijnt ENTRAR. Na de klik lost het rode vlak op in tegels vanuit het midden,
   in hetzelfde tempo en met dezelfde curve als de olievlek. De olievlek start zodra 30% van het rode vlak is verdwenen. */
document.addEventListener("DOMContentLoaded",function(){
  var root=document.documentElement;if(!root.classList.contains("lr-pre"))return;
  var navLogo=document.querySelector(".nav_logo");
  var SH={5:"M 20.1,-8.4 l 0,-11.8 l -11.8,0 l -8.4,-8.4 l -8.4,8.4 l -11.8,0 l 0,11.8 L -28.6,0 l 8.4,8.4 l 0,11.8 l 11.8,0 l 8.4,8.4 l 8.4,-8.4 l 11.8,0 l 0,-11.8 l 8.4,-8.4 l -8.4,-8.4 Z M 10.7,4.4 l 0,6.3 l -6.3,0 l -4.4,4.4 l -4.4,-4.4 l -6.3,0 l 0,-6.3 l -4.4,-4.4 l 4.4,-4.4 l 0,-6.3 l 6.3,0 l 4.4,-4.4 l 4.4,4.4 l 6.3,0 l 0,6.3 l 4.4,4.4 l -4.4,4.4 Z",0:"M -7.2,-7.2 L 7.2,-7.2 L 7.2,7.2 L -7.2,7.2 Z",1:"M 8.2,-7.15 L -2,-7.15 L -8.2,0.05 L -2,7.15 L 8.2,7.15 Z",2:"M -8.2,7.15 L 2.1,7.15 L 8.2,0.05 L 2.1,-7.15 L -8.2,-7.15 Z",4:"M -7.2,-8.2 L -7.2,2.1 L 0,8.2 L 7.2,2.1 L 7.2,-8.2 Z",3:"M 7.2,8.2 L 7.2,-2.1 L 0,-8.2 L -7.2,-2.1 L -7.2,8.2 Z",6:"M 15.15,0 L 10.75,4.4 L 10.75,10.7 L 4.45,10.7 L 0.05,15.1 L -4.45,10.7 L -10.65,10.7 L -10.65,4.4 L -15.15,0 L -10.65,-4.4 L -10.65,-10.7 L -4.45,-10.7 L 0.05,-15.1 L 4.45,-10.7 L 10.75,-10.7 L 10.75,-4.4 Z",7:"M-10.3,-10.3h20.6v20.6h-20.6z"};
  var P2={};for(var k in SH)P2[k]=new Path2D(SH[k]);
  var red=getComputedStyle(root).getPropertyValue("--color--red").trim()||"#a70e10";
  var ov=document.createElement("div");ov.className="lr-pre";ov.setAttribute("aria-hidden","true");
  var cv=document.createElement("canvas");ov.appendChild(cv);
  var lg=document.createElement("div");lg.className="lr-pre_logo";
  var src=navLogo&&navLogo.src?'url("'+navLogo.src+'")':"none";
  lg.innerHTML='<i class="lr-pre_base"></i><i class="lr-pre_fill"></i>';
  [].forEach.call(lg.children,function(c){c.style.webkitMaskImage=c.style.maskImage=src;});
  document.body.appendChild(ov);document.body.appendChild(lg);
  var fill=lg.querySelector(".lr-pre_fill");
  /* laadvoortgang: afbeeldingen die direct laden, plus het load-event */
  var imgs=[].filter.call(document.images,function(i){return i.loading!=="lazy";}),loaded=false,p=0;
  window.addEventListener("load",function(){loaded=true;});if(document.readyState==="complete")loaded=true;
  function target(){if(loaded)return 1;var n=imgs.length?imgs.filter(function(i){return i.complete;}).length/imgs.length:.5;return .9*n;}
  var hero=null;function holdSpill(){/* olievlek blijft op nul tot genoeg van het rode vlak weg is */
    if(!hero&&window.LR)hero=window.LR.fields.find(function(f){return f.opts.intro;});if(hero)hero.opts.intro.s=performance.now();}
  var phase=0,front=-1,G=null,spill=false,SPILL_AT=.3;/* SPILL_AT: deel van het rode vlak dat weg moet zijn voor de olievlek start */
  function startSpill(){if(spill)return;spill=true;holdSpill();}/* zet de klok van de olievlek op nu, daarna loopt hij vrij */
  window.LR_PRE={dark:function(x,y){if(phase<2)return true;if(phase>2||!G)return false;var d=Math.hypot(x-G.cx,y-G.cy);return d>front-.5*G.band;}};
  (function load(){
    holdSpill();
    var t=target();p=Math.min(t,p+Math.max(.006,(t-p)*.06));
    fill.style.clipPath="inset("+((1-p)*100).toFixed(2)+"% 0 0 0)";
    if(p>=.999&&loaded){setTimeout(move,250);return;}
    requestAnimationFrame(load);})();
  function move(){
    phase=1;var r=navLogo?navLogo.getBoundingClientRect():null;
    (function hold(){if(phase<3&&!spill){holdSpill();requestAnimationFrame(hold);}})();
    if(!r||!window.gsap){land();return;}
    var s=lg.getBoundingClientRect();
    gsap.to(lg,{x:r.left-s.left,y:r.top-s.top,width:r.width,height:r.height,duration:1,ease:"power3.inOut",onComplete:land});
  }
  function land(){
    root.classList.add("lr-logo-in");lg.style.display="none";
    enter();
  }
  /* ENTRAR: verschijnt vanachter een masker met een kanteling van 10 naar 0 graden. Pas na de klik lost het rode vlak op.
     Die klik geeft de browser toestemming voor geluid, zodat de muziek direct mee start (zie 16-music.js). */
  function enter(){
    var b=document.createElement("button");b.type="button";b.className="lr-pre_enter";b.innerHTML='<span class="lr-pre_enter-text">Entrar</span>';
    document.body.appendChild(b);var t=b.firstChild,done=false;
    if(window.gsap)gsap.fromTo(t,{yPercent:130,rotation:10},{yPercent:0,rotation:0,duration:1.1,ease:"power3.out",delay:.15});else t.style.transform="none";
    function go(){if(done)return;done=true;
      document.dispatchEvent(new Event("lasrodes:enter"));/* binnen de klik: muziek mag nu starten */
      root.classList.remove("lr-pre");/* pagina zichtbaar onder het rode canvas */
      if(window.gsap)gsap.to(t,{yPercent:-130,rotation:-6,duration:.6,ease:"power3.in",onComplete:function(){b.remove();}});else b.remove();
      dissolve();}
    b.addEventListener("click",go);
  }
  function hash(a,b){var r=Math.sin(a*127.1+b*311.7)*43758.5453;return r-Math.floor(r);}
  function dissolve(){
    phase=2;var W=window.innerWidth,H=window.innerHeight,dpr=Math.min(window.devicePixelRatio||1,2),P=28*W/1512;
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ov.style.background="transparent";
    var x=cv.getContext("2d"),cx=W/2,cy=H/2,max=Math.hypot(cx,cy)+P,band=.45*max,cells=[];
    for(var j=-1;j<=H/P+1;j++)for(var i=-1;i<=W/P+1;i++)cells.push([i*P,j*P,Math.hypot(i*P-cx,j*P-cy),hash(i,j)]);
    /* zelfde duur en curve als de olievlek */
    G={cx:cx,cy:cy,band:band};var DUR=window.LR_SPILL_MS||5000,EASE=window.LR_SPILL_EASE||function(p){return 1-Math.pow(1-p,3)},t0=performance.now(),k=P/62.6;
    (function step(now){
      var q=Math.min(1,(now-t0)/DUR),e=EASE(q),gone=0;front=e*(max+band*1.6);
      x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);x.fillStyle=red;
      for(var n=0;n<cells.length;n++){var c=cells[n],t=(front-c[2])/band-c[3]*.8;/* willekeurig, maar vanuit het midden */
        if(t<=0){x.fillRect(c[0]-P/2,c[1]-P/2,P+1,P+1);continue;}
        if(t>=1){gone++;continue;}var s=1-t;s=s*s*(3-2*s);
        [[0,0,0],[-.3,0,1],[.3,0,2],[0,-.3,3],[0,.3,4],[.5,.5,hash(c[0],c[1])<.48?5:hash(c[0],c[1])<.69?6:7]].forEach(function(pc){
          x.save();x.translate(c[0]+pc[0]*P,c[1]+pc[1]*P);x.scale(k*s,k*s);x.fill(P2[pc[2]],"evenodd");x.restore();});}
      if(gone>=SPILL_AT*cells.length)startSpill();/* genoeg van het rode vlak is weg: olievlek begint */
      if(q<1)requestAnimationFrame(step);else{phase=3;ov.remove();lg.remove();startSpill();document.dispatchEvent(new Event("lasrodes:preloaded"));}
    })(t0);
  }
});
