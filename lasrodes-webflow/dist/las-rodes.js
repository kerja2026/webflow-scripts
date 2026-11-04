/* Las Rodes — gebundelde scripts (Kerja). Bron: src/. Niet handmatig aanpassen, opnieuw bouwen met build.sh */

/* ===== 01-lenis.js ===== */
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

/* ===== 02-intro.js ===== */
/* Hero-intro: zodra de olievlek zijn eindvorm heeft, komen taalkeuze en MENU van boven (het logo staat er al via de preloader) */
document.addEventListener("DOMContentLoaded",function(){
  var root=document.documentElement;if(!root.classList.contains("lr-intro"))return;
  var done=false;
  function reveal(){
    if(done)return;done=true;root.classList.remove("lr-intro");root.classList.add("lr-logo-in");
    var els=document.querySelectorAll(".nav_lang,.nav_menu-button");
    if(els.length&&window.gsap)gsap.fromTo(els,{yPercent:-160},{yPercent:0,duration:0.8,ease:"power3.out"});
  }
  document.addEventListener("lasrodes:herodone",reveal);
  /* vangnet: na de preloader nog maximaal 10 seconden wachten */
  if(root.classList.contains("lr-pre"))document.addEventListener("lasrodes:preloaded",function(){setTimeout(reveal,10000);});
  else setTimeout(reveal,10000);
});

/* ===== 03-preloader.js ===== */
/* Preloader: rood scherm, logo vult zich van onder naar boven met crème terwijl de pagina laadt,
   schuift dan naar zijn plek in de nav; daarna lost het rode vlak op in tegels vanuit het midden,
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
    root.classList.remove("lr-pre");/* pagina zichtbaar onder het rode canvas */
    dissolve();
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

/* ===== 04-nav-color.js ===== */
/* Nav kleurt mee: taalkeuze, logo en MENU worden crème zodra er een donkere achtergrond onder ze ligt.
   Banden tellen alleen mee met hun dichte vlak, niet met de losse tegels; buiten de site gespiegeld zoals de banden zelf. */
document.addEventListener("DOMContentLoaded",function(){
  var nav=document.querySelector(".nav_component");if(!nav)return;
  var items=[".nav_lang",".nav_logo",".nav_menu-button"].map(function(s){return nav.querySelector(s);}).filter(Boolean);
  var ctx=document.createElement("canvas").getContext("2d"),paths=new WeakMap(),darkBgs=[];
  function rgb(c){var m=(c||"").match(/[\d.]+/g);return m?m.map(parseFloat):null;}
  function isDark(c){var v=rgb(c);if(!v||(v.length>3&&v[3]<.5))return null;return (.2126*v[0]+.7152*v[1]+.0722*v[2])/255<.5;}
  function collect(){darkBgs=[];document.querySelectorAll(".main-wrapper *, .footer_component").forEach(function(e){
    if(e.closest(".band_component,.nav_component,.lr-menu"))return;
    if(e.offsetWidth<40||e.offsetHeight<40)return;/* dunne lijnen tellen niet */
    if(isDark(getComputedStyle(e).backgroundColor))darkBgs.push(e);});}
  function rotated(e){var t=getComputedStyle(e).transform;return t&&t!=="none"&&parseFloat(t.slice(7))<0;}
  function bandColor(x,y){/* kleur van het dichte vlak van een band op dit punt, of null */
    var fs=(window.LR&&window.LR.fields)||[];
    for(var i=0;i<fs.length;i++){var f=fs[i],b=f.el;
      if(!f.data||!f.data.solids||!f.data.solids.length||!f.opts.color||b.closest(".lr-menu"))continue;
      var r=b.parentElement.getBoundingClientRect();if(y<r.top||y>r.bottom||!r.width)continue;
      var u=(x-r.left)/r.width,v=(y-r.top)/r.height;u=u<0?-u:u>1?2-u:u;if(rotated(b.parentElement)!==rotated(b)){u=1-u;v=1-v;}
      var p=paths.get(f.data);if(!p){p=new Path2D(f.data.solids.join(" "));paths.set(f.data,p);}
      if(ctx.isPointInPath(p,u*f.data.W,v*f.data.H))return f.opts.color;}
    return null;}
  function bandAt(x,y){var c=bandColor(x,y);if(!c)return -1;return (.2126*c[0]+.7152*c[1]+.0722*c[2])<.5?1:0;}
  /* achtergrondkleur onder een punt van de nav, voor het menu (MENU verschijnt vanachter tegels in die kleur) */
  function bgAt(x,y){
    var c=bandColor(x,y);if(c)return "rgb("+Math.round(c[0]*255)+","+Math.round(c[1]*255)+","+Math.round(c[2]*255)+")";
    var cw=document.querySelector(".concert_image-wrapper");
    if(cw){var r=cw.getBoundingClientRect();if(getComputedStyle(cw).visibility!=="hidden"&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return getComputedStyle(document.documentElement).getPropertyValue("--color--dark").trim()||"#2c252b";}
    var els=document.elementsFromPoint(x,y);
    for(var i=0;i<els.length;i++){var e=els[i];if(e.tagName==="CANVAS"||e.closest(".nav_component,.lr-menu,.band_component"))continue;
      var v=rgb(getComputedStyle(e).backgroundColor);if(v&&(v.length<4||v[3]>=.5))return "rgb("+v[0]+","+v[1]+","+v[2]+")";}
    for(i=0;i<darkBgs.length;i++){var q=darkBgs[i].getBoundingClientRect();if(y>=q.top&&y<=q.bottom)return getComputedStyle(darkBgs[i]).backgroundColor;}/* doorgetrokken vlak buiten 1920 */
    return getComputedStyle(document.documentElement).getPropertyValue("--color--cream").trim()||"#f2ece1";}
  window.LR_NAV={bgAt:bgAt};
  function darkAt(x,y){
    if(window.LR_PRE&&window.LR_PRE.dark(x,y))return true;/* rood vlak van de preloader */
    var b=bandAt(x,y);if(b>=0)return b===1;
    var cw=document.querySelector(".concert_image-wrapper");
    if(cw){var r=cw.getBoundingClientRect();if(getComputedStyle(cw).visibility!=="hidden"&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return true;}
    for(var i=0;i<darkBgs.length;i++){var q=darkBgs[i].getBoundingClientRect();if(y>=q.top&&y<=q.bottom)return true;}/* kleurvlakken lopen door tot de vensterrand */
    return false;}
  (function tick(){
    items.forEach(function(el){var r=el.getBoundingClientRect();el.classList.toggle("lr-on-dark",darkAt(r.left+r.width/2,r.top+r.height/2));});
    requestAnimationFrame(tick);})();
  collect();window.addEventListener("load",collect);
  var t;window.addEventListener("resize",function(){clearTimeout(t);t=setTimeout(collect,200);});
});

/* ===== 05-lines.js ===== */
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

/* ===== 06-menu-hover.js ===== */
/* Menu-hover: vanaf het punt waar de muis het woord binnenkomt groeien een paar clusters tegels over het woord.
   Naast de letters zijn de tegels in de tekstkleur, over de letters snijden ze de letter weg (negatief).
   Daarna lossen ze weer op. Patronen blijven binnen de eigen regel. Geldt voor de menulijst in Coral en het menu-overlay. */
document.addEventListener("DOMContentLoaded",function(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var SH={5:"M 20.1,-8.4 l 0,-11.8 l -11.8,0 l -8.4,-8.4 l -8.4,8.4 l -11.8,0 l 0,11.8 L -28.6,0 l 8.4,8.4 l 0,11.8 l 11.8,0 l 8.4,8.4 l 8.4,-8.4 l 11.8,0 l 0,-11.8 l 8.4,-8.4 l -8.4,-8.4 Z M 10.7,4.4 l 0,6.3 l -6.3,0 l -4.4,4.4 l -4.4,-4.4 l -6.3,0 l 0,-6.3 l -4.4,-4.4 l 4.4,-4.4 l 0,-6.3 l 6.3,0 l 4.4,-4.4 l 4.4,4.4 l 6.3,0 l 0,6.3 l 4.4,4.4 l -4.4,4.4 Z",0:"M -7.2,-7.2 L 7.2,-7.2 L 7.2,7.2 L -7.2,7.2 Z",1:"M 8.2,-7.15 L -2,-7.15 L -8.2,0.05 L -2,7.15 L 8.2,7.15 Z",2:"M -8.2,7.15 L 2.1,7.15 L 8.2,0.05 L 2.1,-7.15 L -8.2,-7.15 Z",4:"M -7.2,-8.2 L -7.2,2.1 L 0,8.2 L 7.2,2.1 L 7.2,-8.2 Z",3:"M 7.2,8.2 L 7.2,-2.1 L 0,-8.2 L -7.2,-2.1 L -7.2,8.2 Z",6:"M 15.15,0 L 10.75,4.4 L 10.75,10.7 L 4.45,10.7 L 0.05,15.1 L -4.45,10.7 L -10.65,10.7 L -10.65,4.4 L -15.15,0 L -10.65,-4.4 L -10.65,-10.7 L -4.45,-10.7 L 0.05,-15.1 L 4.45,-10.7 L 10.75,-10.7 L 10.75,-4.4 Z",7:"M-10.3,-10.3h20.6v20.6h-20.6z"};
  var P2={};for(var k in SH)P2[k]=new Path2D(SH[k]);
  var cv=document.createElement("canvas");cv.setAttribute("aria-hidden","true");
  cv.style.cssText="position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:95";
  document.body.appendChild(cv);var x=cv.getContext("2d"),anims=[],running=false,BUILD=800,FADE=1000;/* duur opbouwen en oplossen in ms */
  var SIZE=.45,CLUSTERS=4;/* tegelmaat als deel van de lettergrootte, aantal clusters per woord */
  function hash(a,b){var r=Math.sin(a*127.1+b*311.7)*43758.5453;return r-Math.floor(r);}
  function ease(q){return -(Math.cos(Math.PI*q)-1)/2;}/* zacht in en uit */
  function size(){var d=Math.min(window.devicePixelRatio||1,2);cv.width=Math.round(innerWidth*d);cv.height=Math.round(innerHeight*d);cv._d=d;}
  size();window.addEventListener("resize",size);
  function textRect(a){/* de werkelijke letters, niet het (soms ruimere) linkvak */
    var rg=document.createRange();rg.selectNodeContents(a);var rs=[].slice.call(rg.getClientRects()).filter(function(q){return q.width>0;});
    if(!rs.length)return a.getBoundingClientRect();
    var l=Math.min.apply(null,rs.map(function(q){return q.left;})),t=Math.min.apply(null,rs.map(function(q){return q.top;})),
        r=Math.max.apply(null,rs.map(function(q){return q.right;})),b=Math.max.apply(null,rs.map(function(q){return q.bottom;}));
    return {left:l,top:t,width:r-l,height:b-t};}
  function textOf(a,cs){var s=a.textContent.replace(/\s+/g," ").trim();var tt=cs.textTransform;
    return tt==="uppercase"?s.toUpperCase():tt==="lowercase"?s.toLowerCase():s;}
  function start(a,ex,ey){
    if(a._lrBusy)return;a._lrBusy=true;
    var cs=getComputedStyle(a),fs=parseFloat(cs.fontSize),r=textRect(a),P=SIZE*fs,pad=2*P,W=r.width+2*pad,H=r.height+2*pad,seed=Math.random()*100;
    /* een paar clusters op willekeurige plekken langs het woord */
    var cl=[];for(var c=0;c<CLUSTERS+(r.width>9*fs?1:0);c++)cl.push([pad+r.width*(.08+.84*hash(seed+c,1.3)),pad+r.height*(.05+.9*hash(seed+c,7.1)),P*(1.3+1.6*hash(seed+c,3.7))]);
    /* patronen blijven binnen de eigen regel: de grens ligt halverwege tussen de middens van de regels erboven en eronder */
    var cyA=r.top+r.height/2,lim0=cyA-r.height*.7,lim1=cyA+r.height*.7;[].forEach.call(document.querySelectorAll(".coral_menu-link"),function(o){if(o===a||o.closest(".lr-menu")!==a.closest(".lr-menu"))return;
      var q=textRect(o),cyB=q.top+q.height/2;if(!q.width||Math.abs(cyB-cyA)<1)return;
      if(cyB<cyA)lim0=Math.max(lim0,(cyA+cyB)/2);else lim1=Math.min(lim1,(cyA+cyB)/2);});
    var sx=ex-r.left+pad,sy=ey-r.top+pad,cells=[],max=0;
    for(var j=0;j<=H/P;j++)for(var i=0;i<=W/P;i++){var cx=i*P,cy=j*P,inC=false;
      for(var q=0;q<cl.length;q++){var dd=Math.hypot(cx-cl[q][0],cy-cl[q][1]);if(dd<cl[q][2]*(.65+.7*hash(i+seed,j)))inC=true;}
      if(!inC)continue;
      var gy=r.top-pad+cy;if(gy-P<lim0||gy+P>lim1)continue;/* hele tegels die over de grens zouden vallen, komen niet: geen rechte snijlijn */
      var d=Math.hypot(cx-sx,cy-sy);max=Math.max(max,d);cells.push([cx,cy,d,hash(i+seed,j+.5),hash(i+.2,j+.9+seed)]);}
    var font=[cs.fontStyle,cs.fontWeight,cs.fontSize,cs.fontFamily].join(" ");
    anims.push({a:a,pad:pad,P:P,cells:cells,max:max+P,band:.8*(max+P),t0:performance.now(),col:cs.color,font:font,ls:cs.letterSpacing,text:textOf(a,cs),prev:a.style.color});
    a.style.color="transparent";/* de echte tekst even onzichtbaar; het canvas tekent hem exact na */
    if(!running){running=true;requestAnimationFrame(loop);}
  }
  function piece(c,P,s){var k=P/62.6*s;[[0,0,0],[-.3,0,1],[.3,0,2],[0,-.3,3],[0,.3,4],[.5,.5,c[4]<.48?5:c[4]<.69?6:7]].forEach(function(pc){
      x.save();x.translate(c[0]+pc[0]*P,c[1]+pc[1]*P);x.scale(k,k);x.fill(P2[pc[2]],"evenodd");x.restore();});}
  function end(an){an.a.style.color=an.prev;an.a._lrBusy=false;}
  function loop(now){
    var d=cv._d;x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,innerWidth,innerHeight);
    anims=anims.filter(function(an){
      var el=now-an.t0;if(el>BUILD+FADE){end(an);return false;}
      var r=textRect(an.a);if(!r.width||getComputedStyle(an.a).visibility==="hidden"){end(an);return false;}
      /* eigen laag per woord: eerst de tekst, dan de tegels met uitsnijding waar ze de letters raken */
      if(!an.layer){an.layer=document.createElement("canvas");}
      var L=an.layer,lw=Math.ceil((r.width+2*an.pad)*d),lh=Math.ceil((r.height+2*an.pad)*d);if(L.width!==lw||L.height!==lh){L.width=lw;L.height=lh;}
      var y=L.getContext("2d");y.setTransform(d,0,0,d,0,0);y.clearRect(0,0,lw,lh);y.globalCompositeOperation="source-over";
      y.fillStyle=an.col;y.font=an.font;if("letterSpacing" in y)y.letterSpacing=an.ls==="normal"?"0px":an.ls;y.textBaseline="alphabetic";
      var m=y.measureText(an.text),asc=m.fontBoundingBoxAscent||m.actualBoundingBoxAscent;
      y.fillText(an.text,an.pad,an.pad+asc);
      y.globalCompositeOperation="xor";
      var build=el<BUILD,q=build?el/BUILD:(el-BUILD)/FADE,front=ease(q)*(an.max+an.band*1.6),P=an.P,X=x;x=y;
      an.cells.forEach(function(c){var t=(front-c[2])/an.band-c[3]*.8,s;
        if(build){if(t<=0)return;s=Math.min(1,t);}else{if(t>=1)return;s=Math.min(1,1-Math.max(0,t));}
        s=s*s*(3-2*s);piece(c,P,s);});
      x=X;x.drawImage(L,r.left-an.pad,r.top-an.pad,lw/d,lh/d);return true;});
    if(anims.length)requestAnimationFrame(loop);else{running=false;x.clearRect(0,0,innerWidth,innerHeight);}
  }
  document.addEventListener("mouseover",function(e){var a=e.target.closest&&e.target.closest(".coral_menu-link");
    if(!a||(e.relatedTarget&&a.contains(e.relatedTarget)))return;start(a,e.clientX,e.clientY);});
});

/* ===== 07-menu.js ===== */
/* Menu: het rode vlak bouwt zich van boven op uit tegels; sluiten breekt het van onder af */
document.addEventListener("DOMContentLoaded",function(){
  var btn=document.querySelector(".nav_menu-button");if(!btn)return;
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root=document.documentElement,label=btn.textContent;
  var SH={5:"M 20.1,-8.4 l 0,-11.8 l -11.8,0 l -8.4,-8.4 l -8.4,8.4 l -11.8,0 l 0,11.8 L -28.6,0 l 8.4,8.4 l 0,11.8 l 11.8,0 l 8.4,8.4 l 8.4,-8.4 l 11.8,0 l 0,-11.8 l 8.4,-8.4 l -8.4,-8.4 Z M 10.7,4.4 l 0,6.3 l -6.3,0 l -4.4,4.4 l -4.4,-4.4 l -6.3,0 l 0,-6.3 l -4.4,-4.4 l 4.4,-4.4 l 0,-6.3 l 6.3,0 l 4.4,-4.4 l 4.4,4.4 l 6.3,0 l 0,6.3 l 4.4,4.4 l -4.4,4.4 Z",0:"M -7.2,-7.2 L 7.2,-7.2 L 7.2,7.2 L -7.2,7.2 Z",1:"M 8.2,-7.15 L -2,-7.15 L -8.2,0.05 L -2,7.15 L 8.2,7.15 Z",2:"M -8.2,7.15 L 2.1,7.15 L 8.2,0.05 L 2.1,-7.15 L -8.2,-7.15 Z",4:"M -7.2,-8.2 L -7.2,2.1 L 0,8.2 L 7.2,2.1 L 7.2,-8.2 Z",3:"M 7.2,8.2 L 7.2,-2.1 L 0,-8.2 L -7.2,-2.1 L -7.2,8.2 Z",6:"M 15.15,0 L 10.75,4.4 L 10.75,10.7 L 4.45,10.7 L 0.05,15.1 L -4.45,10.7 L -10.65,10.7 L -10.65,4.4 L -15.15,0 L -10.65,-4.4 L -10.65,-10.7 L -4.45,-10.7 L 0.05,-15.1 L 4.45,-10.7 L 10.75,-10.7 L 10.75,-4.4 Z",7:"M-10.3,-10.3h20.6v20.6h-20.6z"};
  var P2={};for(var k in SH)P2[k]=new Path2D(SH[k]);
  var ov=document.createElement("div");ov.className="lr-menu";ov.id="lr-menu";
  ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");ov.setAttribute("aria-label","Menu");
  var cv=document.createElement("canvas");cv.className="lr-menu_fill";cv.setAttribute("aria-hidden","true");ov.appendChild(cv);
  var host=document.createElement("div");host.className="lr-menu_band";
  var band=document.createElement("div");band.className="band_component is-large is-red";
  band.setAttribute("data-color","red");band.setAttribute("data-manual","");
  host.appendChild(band);ov.appendChild(host);
  var content=document.createElement("nav");content.className="lr-menu_content";content.setAttribute("aria-label","Secciones");
  var src=document.querySelector(".coral_menu");if(src){var l=src.cloneNode(true);l.classList.add("lr-menu_links");content.appendChild(l);}
  var so=document.querySelector(".footer_social");if(so){var s2=so.cloneNode(true);s2.classList.add("lr-menu_social");content.appendChild(s2);
    /* in het rode menu het Spotify-logo met rode strepen; de footer houdt de donkere */
    [].forEach.call(s2.querySelectorAll("img"),function(i){if(/icon-spotify-dark/.test(i.src)){i.removeAttribute("srcset");i.src="https://cdn.prod.website-files.com/6ae4913cbd8a2e883953ad49/6ae8bbb175f1a3563f863b3e_icon-spotify.svg";}});}
  /* elke menuregel en de social icons achter een eigen masker */
  content.querySelectorAll(".coral_menu-link").forEach(function(a){var sp=document.createElement("span");sp.className="lr-menu_line";while(a.firstChild)sp.appendChild(a.firstChild);a.appendChild(sp);});
  if(s2){var sm=document.createElement("div");sm.className="lr-menu_smask";content.insertBefore(sm,s2);sm.appendChild(s2);}
  var items=content.querySelectorAll(".lr-menu_line, .lr-menu_smask > *");
  ov.appendChild(content);document.body.appendChild(ov);
  btn.setAttribute("aria-controls","lr-menu");btn.setAttribute("aria-expanded","false");
  var open=false,busy=false,field=null,red=getComputedStyle(root).getPropertyValue("--color--red").trim()||"#a70e10";
  function getField(){if(!field&&window.LR){field=window.LR.fields.find(function(f){return f.el===band;});if(field){field.opts.idle=.05;field.opts.noBias=true;}}return field;}
  function setOpenUI(on){root.classList.toggle("lr-menu-open",on);btn.textContent=on?"Close":label;btn.setAttribute("aria-expanded",on?"true":"false");}
  function hash(a,b){var r=Math.sin(a*127.1+b*311.7)*43758.5453;return r-Math.floor(r);}
  /* CLOSE verdwijnt achter tegels in het rood van het menu; MENU verschijnt vanachter tegels in de kleur van de pagina eronder */
  var fx=document.createElement("canvas");fx.setAttribute("aria-hidden","true");
  fx.style.cssText="position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:101";document.body.appendChild(fx);
  var FX_MS=600,FX_SIZE=.45;/* duur in ms, tegelmaat als deel van de lettergrootte */
  function textRect(a){var rg=document.createRange();rg.selectNodeContents(a);var rs=[].slice.call(rg.getClientRects()).filter(function(q){return q.width>0;});
    if(!rs.length)return a.getBoundingClientRect();
    var l=Math.min.apply(null,rs.map(function(q){return q.left;})),t=Math.min.apply(null,rs.map(function(q){return q.top;})),
        r=Math.max.apply(null,rs.map(function(q){return q.right;})),b=Math.max.apply(null,rs.map(function(q){return q.bottom;}));
    return {left:l,top:t,width:r-l,height:b-t};}
  function wordFx(el,col,cover,ex,ey,cb,first){
    var r=textRect(el),fs=parseFloat(getComputedStyle(el).fontSize),P=FX_SIZE*fs,pad=P,W=r.width+2*pad,H=r.height+2*pad,cells=[],max=0;
    if(ex==null){ex=r.left+r.width/2;ey=r.top+r.height/2;}
    var sx=ex-r.left+pad,sy=ey-r.top+pad;
    for(var j=0;j<=H/P;j++)for(var i=0;i<=W/P;i++){var cx=i*P,cy=j*P,edge=cx<P||cy<P||cx>W-P||cy>H-P;
      if(edge&&hash(i+.7,j+.3)<.45)continue;/* gerafelde rand */
      var d=Math.hypot(cx-sx,cy-sy);max=Math.max(max,d);cells.push([cx,cy,d,hash(i,j),edge,hash(i+.2,j+.9)]);}
    max+=P;var band=.6*max,x=fx.getContext("2d"),dpr=Math.min(window.devicePixelRatio||1,2),t0=performance.now(),k=P/62.6;
    fx.width=Math.round(innerWidth*dpr);fx.height=Math.round(innerHeight*dpr);
    function piece(c,s){var kk=k*s;[[0,0,0],[-.3,0,1],[.3,0,2],[0,-.3,3],[0,.3,4],[.5,.5,c[5]<.48?5:c[5]<.69?6:7]].forEach(function(pc){
      x.save();x.translate(c[0]+pc[0]*P,c[1]+pc[1]*P);x.scale(kk,kk);x.fill(P2[pc[2]],"evenodd");x.restore();});}
    (function step(now){
      var q=Math.min(1,(now-t0)/FX_MS),e=-(Math.cos(Math.PI*q)-1)/2,front=e*(max+band*1.6);
      x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,innerWidth,innerHeight);x.save();x.translate(r.left-pad,r.top-pad);x.fillStyle=col;
      cells.forEach(function(c){var t=(front-c[2])/band-c[3]*.8,cov=cover?t:1-t,s;/* cov: mate van bedekking van deze tegel */
        if(cov<=0)return;if(cov>=1&&!c[4]){x.fillRect(c[0]-P/2,c[1]-P/2,P+1,P+1);return;}s=Math.min(1,cov);s=s*s*(3-2*s);piece(c,s);});
      x.restore();if(first){first();first=null;}
      if(q<1)requestAnimationFrame(step);else{if(cover){el.style.transition="none";el.style.color="transparent";}/* zonder overgang: anders vervaagt de tekst traag en komt hij na de tegels weer tevoorschijn */x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,fx.width,fx.height);cb&&cb();}
    })(t0);
  }
  var G=null;/* raster van het rode vlak */
  function layout(){
    var rem=parseFloat(getComputedStyle(root).fontSize),W=ov.clientWidth,Bh=W*878/1514;
    var Fh=content.offsetTop+content.offsetHeight+rem,f=getField();
    var P=f&&f.data?f.data.pitch*W/f.data.W:28*W/1512,dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.round(W*dpr);cv.height=Math.round(Fh*dpr);cv.style.height=Fh+"px";
    host.style.top=(Fh-1)+"px";host.style.height=Bh+"px";ov.style.height=(Fh+Bh)+"px";
    var cols=Math.ceil(W/P)+1,rows=Math.ceil(Fh/P)+1,cells=[];
    for(var j=0;j<rows;j++)for(var i=0;i<cols;i++){var cx=i*P,cy=j*P,h=hash(i,j);
      cells.push([cx,cy,0,hash(i+.1,j)],[cx-.3*P,cy,1,hash(i+.2,j)],[cx+.3*P,cy,2,hash(i+.3,j)],[cx,cy-.3*P,3,hash(i+.4,j)],[cx,cy+.3*P,4,hash(i+.5,j)],
        [cx+.5*P,cy+.5*P,h<.48?5:h<.69?6:7,hash(i+.6,j)]);}
    var colOff=[];for(var c=0;c<cols;c++)colOff.push(hash(c,99)*2.5*P);
    G={W:W,Fh:Fh,Bh:Bh,P:P,dpr:dpr,cells:cells,colOff:colOff,ctx:cv.getContext("2d"),contentBottom:Fh-rem};
  }
  function draw(front){
    var g=G,x=g.ctx,P=g.P,k=P/62.6;x.setTransform(g.dpr,0,0,g.dpr,0,0);x.clearRect(0,0,g.W,g.Fh);x.fillStyle=red;
    /* dicht rood, enkele tegelrijen achter het front, getrapt per kolom */
    for(var c=0;c<g.colOff.length;c++){var y=Math.min(g.Fh,front-6*P-g.colOff[c]);if(y>0)x.fillRect(c*P-.5*P,0,P+1,y);}
    /* tegels rond het front: verschijnen willekeurig en schalen zacht op */
    for(var n=0;n<g.cells.length;n++){var t=g.cells[n],d=front-t[1]-t[3]*5*P;if(d<=0||d>9*P)continue;
      var s=Math.min(1,d/(1.2*P));s=s*s*(3-2*s);x.save();x.translate(t[0],t[1]);x.scale(k*s,k*s);x.fill(P2[t[2]],"evenodd");x.restore();}
  }
  function finish(on,cb){busy=false;if(!on){ov.style.visibility="hidden";var f=getField();if(f){f.opts.build=null;f.near=false;f.stop();window.LR.update();}}cb&&cb();}
  function run(on,cb){
    busy=true;var f=getField();ov.style.visibility="visible";
    if(!on)gsap.to(content,{autoAlpha:0,duration:.25,ease:"power2.out"});
    var go=function(){
      layout();var g=G;
      if(reduce||!f||!f.data){draw(1e6);band.style.clipPath="";gsap.set(content,{autoAlpha:on?1:0});gsap.set(items,{yPercent:0});if(!on)ov.style.visibility="hidden";finish(on,cb);return;}
      var total=g.Fh+g.Bh,m=.15*g.Bh,from=on?-g.P:total+m,to=on?total+m:-g.P,DUR=on?2200:1400,shown=!on;
      f.opts.build={s:-1,t0:0,f:function(F){var N=performance.now();this.t0||(this.t0=N);var Pr=Math.min(1,(N-this.t0)/DUR),K=1-Math.pow(1-Pr,3);
        var front=from+(to-from)*K;draw(front);
        if(on&&!shown&&front-7*g.P>g.contentBottom){shown=true;gsap.set(content,{autoAlpha:1});gsap.fromTo(items,{yPercent:115},{yPercent:0,duration:.9,ease:"power3.out",stagger:.12});}
        /* band is 180 graden gedraaid: visueel boven = elementcoordinaat Bh; getrapte rand per kolom, nooit een rechte lijn */
        var cur=g.Bh-(front-g.Fh),pts=["0px "+g.Bh+"px"];for(var c=0;c<g.colOff.length;c++){var yy=Math.max(0,Math.min(g.Bh,cur+4*g.P+g.colOff[c]));pts.push(c*g.P+"px "+yy+"px",(c+1)*g.P+"px "+yy+"px");}pts.push(g.W+"px "+g.Bh+"px");band.style.clipPath="polygon("+pts.join(",")+")";
        if(Pr>=1&&!this.done){this.done=!0;band.style.clipPath="";if(on){f.opts.build=null;finish(true,cb);}else finish(false,cb);}
        return cur;}};
      f.opts.build.f(f);/* eerste beeld direct tekenen: layout() wist het canvas, anders zie je één frame de pagina erdoor */
      window.LR.update();
    };
    if(f){f.near=true;f.prepare().then(go).catch(function(){f=null;go();});}else go();
    if(on)setOpenUI(true);
  }
  /* scroll naar een sectie: de bovenkant van de sectie plus data-scroll-offset (in rem, in Webflow per sectie instelbaar).
     Gemeten op de opmaak zonder transforms, zodat parallax de eindpositie niet laat verspringen. */
  function goTo(hash){var el=document.querySelector(hash);if(!el)return;var y=0;for(var n=el;n;n=n.offsetParent)y+=n.offsetTop;
    y+=(parseFloat(el.getAttribute("data-scroll-offset"))||0)*parseFloat(getComputedStyle(root).fontSize);
    window.lenis?window.lenis.scrollTo(y,{duration:1.4}):window.scrollTo({top:y,behavior:"smooth"});}
  function openMenu(){if(open||busy)return;open=true;gsap.set(content,{autoAlpha:0});gsap.set(items,{yPercent:115});run(true,function(){var a=content.querySelector("a");a&&a.focus({preventScroll:true});});window.lenis&&window.lenis.stop();}
  function closeMenu(target,ex,ey){if(!open||busy)return;open=false;busy=true;
    var done=function(){btn.focus({preventScroll:true});};
    function go(){busy=false;window.lenis&&window.lenis.start();
      if(target)goTo(target);
      run(false,function(){
        if(reduce){setOpenUI(false);btn.style.color="";btn.style.transition="";done();return;}
        /* MENU: eerst volledig onder tegels in de kleur van de pagina onder de knop, die lossen op */
        btn.style.transition="none";setOpenUI(false);
        var r=btn.getBoundingClientRect(),bg=window.LR_NAV?window.LR_NAV.bgAt(r.left+r.width/2,r.top+r.height/2):"#f2ece1";
        wordFx(btn,bg,false,null,null,function(){btn.style.transition="";done();},function(){btn.style.color="";});
      });}
    /* CLOSE: eerst volledig bedekt door tegels in het rood van het menu, pas dan sluit het menu */
    if(reduce){go();return;}
    wordFx(btn,red,true,ex,ey,go);}
  btn.addEventListener("click",function(e){e.preventDefault();open?closeMenu(null,e.clientX,e.clientY):openMenu();});
  /* menulinks in de pagina zelf (Coral) landen op dezelfde plek als die in het menu */
  document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest(".coral_menu a[href^='#']");if(!a||a.closest(".lr-menu"))return;e.preventDefault();goTo(a.getAttribute("href"));});
  content.addEventListener("click",function(e){var a=e.target.closest("a[href^='#']");if(!a)return;e.preventDefault();closeMenu(a.getAttribute("href"));});
  document.addEventListener("keydown",function(e){if(!open)return;if(e.key==="Escape")closeMenu();
    if(e.key==="Tab"){var fs=[btn].concat([].slice.call(content.querySelectorAll("a"))),i=fs.indexOf(document.activeElement);
      if(e.shiftKey&&i<=0){e.preventDefault();fs[fs.length-1].focus();}else if(!e.shiftKey&&i===fs.length-1){e.preventDefault();fs[0].focus();}}});
});

/* ===== 08-tilt.js ===== */
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

/* ===== 09-concert.js ===== */
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

/* ===== 10-cierre.js ===== */
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

/* ===== 11-concert-text.js ===== */
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

/* ===== 13-line-tilt.js ===== */
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

/* ===== 14-logo-scale.js ===== */
/* Logo in de nav: verkleint naar 65% zodra je naar beneden scrolt (vanaf 40px), en blijft klein tot je weer helemaal bovenaan bent.
   De maat en de duur (1 seconde) staan in styles.css bij html.lr-logo-small .nav_logo. */
document.addEventListener("DOMContentLoaded",function(){
  var root=document.documentElement,START=40,small=false;
  function check(){var y=window.scrollY||document.documentElement.scrollTop;
    if(!small&&y>START){small=true;root.classList.add("lr-logo-small");}
    else if(small&&y<=1){small=false;root.classList.remove("lr-logo-small");}}
  window.addEventListener("scroll",check,{passive:true});check();
});

/* ===== 15-photo-reveal.js ===== */
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
      G={W:W,H:H,d:d,P:P,cells:cells,band:6*P,rim:2.5*P};draw();
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

/* ===== 16-music.js ===== */
/* Muziek: start automatisch zodra de site geladen is (na de preloader) en speelt door tot de bezoeker hem zelf uitzet.
   Browsers blokkeren geluid dat vanzelf start tot de bezoeker iets op de pagina doet; dan start hij bij de eerste klik, tik of toets.
   Knop rechtsonder met de eigen play- en pause-iconen. Uitgezet blijft uit, ook bij een volgend bezoek. */
document.addEventListener("DOMContentLoaded",function(){
  var CDN="https://cdn.prod.website-files.com/6ae4913cbd8a2e883953ad49/",
      SRC=CDN+"6aeb69732f639e79020bc23b_Las%20Rodes%20-%20Nada%20Na.mp3",
      ICON_PLAY=CDN+"6aeb69419cbbd0df5b67e0ee_play-btn.svg",ICON_PAUSE=CDN+"6aeb69422456d0728bd15362_pause-btn.svg",
      VOL=.7,FADE=2000,KEY="lr-music-off";
  var root=document.documentElement,audio=new Audio();audio.src=SRC;audio.loop=true;audio.preload="auto";audio.volume=0;
  var btn=document.createElement("button");btn.type="button";btn.className="lr-music";
  var img=document.createElement("img");img.alt="";img.width=60;img.height=60;btn.appendChild(img);document.body.appendChild(btn);
  new Image().src=ICON_PLAY;new Image().src=ICON_PAUSE;/* beide iconen vooraf laden */
  var off=false,fadeT=null;try{off=localStorage.getItem(KEY)==="1";}catch(e){}
  function ui(){var on=!audio.paused;img.src=on?ICON_PAUSE:ICON_PLAY;btn.setAttribute("aria-pressed",on?"true":"false");btn.setAttribute("aria-label",on?"Muziek uitzetten":"Muziek aanzetten");}
  function fade(to,cb){clearInterval(fadeT);var from=audio.volume,t0=performance.now();
    fadeT=setInterval(function(){var q=Math.min(1,(performance.now()-t0)/FADE);audio.volume=from+(to-from)*q;if(q>=1){clearInterval(fadeT);cb&&cb();}},30);}
  function play(){if(off)return;var p=audio.play();if(p&&p.then)p.then(function(){fade(VOL);ui();}).catch(function(){waitForGesture();});else{fade(VOL);ui();}}
  function waitForGesture(){/* geblokkeerd door de browser: start bij de eerste klik, tik of toets */
    var ev=["pointerdown","keydown","touchstart"];function go(e){if(btn.contains(e.target))return;ev.forEach(function(n){document.removeEventListener(n,go,true);});play();}
    ev.forEach(function(n){document.addEventListener(n,go,true);});}
  btn.addEventListener("click",function(){
    if(audio.paused){off=false;try{localStorage.removeItem(KEY);}catch(e){}audio.play().then(function(){fade(VOL);ui();}).catch(function(){});}
    else{off=true;try{localStorage.setItem(KEY,"1");}catch(e){}fade(0,function(){audio.pause();ui();});ui();img.src=ICON_PLAY;}});
  /* tabblad op de achtergrond: muziek pauzeert, en gaat verder als je terugkomt */
  var wasOn=false;document.addEventListener("visibilitychange",function(){if(document.hidden){wasOn=!audio.paused;if(wasOn)audio.pause();}else if(wasOn&&!off){audio.play().catch(function(){});}ui();});
  audio.addEventListener("play",ui);audio.addEventListener("pause",ui);ui();
  function start(){root.classList.add("lr-music-ready");play();}
  /* pas na de preloader (de hele site geladen); zonder preloader na het load-event */
  if(root.classList.contains("lr-pre"))document.addEventListener("lasrodes:preloaded",start);
  else if(document.readyState==="complete")start();else window.addEventListener("load",start);
});

/* ===== 99-patterns.js ===== */
/* Patroonbanden, fotomaskers, hero-olievlek en parallax (WebGL).
   Leest elk band_component (data-color) en elke .hero_bg / [data-pattern-photo], tekent de tegels uit het SVG-masker.
   Op schermen breder dan de site lopen banden en hero door tot de vensterrand: extra tegels als spiegeling van de rand.
   Waar een patroon wordt afgesneden (eigen vlak of sectierand) rafelt het willekeurig uit; nergens een rechte snijlijn.
   Stelt window.LR beschikbaar ({fields, update}) voor preloader, nav-kleur en menu. */
!function(){"use strict";var SOLID_RIM=3;/* breedte in tegels waarin het dichte vlak van de grote banden uitrafelt */var t=1.25,e=0,r=.4,a=.14,i=.15,o=3,n=!0,u=4,c=2,l=992,Q=3,s={5:"M 20.1,-8.4 l 0,-11.8 l -11.8,0 l -8.4,-8.4 l -8.4,8.4 l -11.8,0 l 0,11.8 L -28.6,0 l 8.4,8.4 l 0,11.8 l 11.8,0 l 8.4,8.4 l 8.4,-8.4 l 11.8,0 l 0,-11.8 l 8.4,-8.4 l -8.4,-8.4 Z M 10.7,4.4 l 0,6.3 l -6.3,0 l -4.4,4.4 l -4.4,-4.4 l -6.3,0 l 0,-6.3 l -4.4,-4.4 l 4.4,-4.4 l 0,-6.3 l 6.3,0 l 4.4,-4.4 l 4.4,4.4 l 6.3,0 l 0,6.3 l 4.4,4.4 l -4.4,4.4 Z",0:"M -7.2,-7.2 L 7.2,-7.2 L 7.2,7.2 L -7.2,7.2 Z",1:"M 8.2,-7.15 L 1.1,-7.15 L -2,-7.15 L -8.2,0.05 L -2,7.15 L 1.1,7.15 L 8.2,7.15 L 8.2,0.05 L 8.2,-7.15 Z",2:"M -8.2,7.15 L -1,7.15 L 2.1,7.15 L 8.2,0.05 L 2.1,-7.15 L -1,-7.15 L -8.2,-7.15 L -8.2,0.05 L -8.2,7.15 Z",4:"M -7.2,-8.2 L -7.2,-1 L -7.2,2.1 L 0,8.2 L 7.2,2.1 L 7.2,-1 L 7.2,-8.2 L 0,-8.2 L -7.2,-8.2 Z",3:"M 7.2,8.2 L 7.2,1 L 7.2,-2.1 L 0,-8.2 L -7.2,-2.1 L -7.2,1 L -7.2,8.2 L 0,8.2 L 7.2,8.2 Z",6:"M 15.15,0 L 10.75,4.4 L 10.75,10.7 L 4.45,10.7 L 0.05,15.1 L -4.45,10.7 L -10.65,10.7 L -10.65,4.4 L -15.15,0 L -10.65,-4.4 L -10.65,-10.7 L -4.45,-10.7 L 0.05,-15.1 L 4.45,-10.7 L 10.75,-10.7 L 10.75,-4.4 L 15.15,0 Z",7:"M-10.3,-10.3h20.6v20.6h-20.6z",8:"M-17,-17h34v34h-34z"}/* 8: volle tegel, bouwt de rand van het dichte vlak op */,h=window.matchMedia("(prefers-reduced-motion: reduce)").matches;function f(t,e){var r=43758.5453*Math.sin(127.1*t+311.7*e);return r-Math.floor(r)}function v(t){var e=(new DOMParser).parseFromString(t,"image/svg+xml"),r=e.documentElement,a=(r.getAttribute("viewBox")||"").split(/[\s,]+/).map(Number),i=a[2]||parseFloat(r.getAttribute("width")),o=a[3]||parseFloat(r.getAttribute("height")),n=[],Sd=[];return e.querySelectorAll("path").forEach(function(t){if(!t.closest("clipPath,mask,defs")){var Db=function(t){for(var e,r=[],a=/([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g,i=[];e=a.exec(t);)i.push(e[1]||parseFloat(e[2]));var o=0,n="M",u=0,c=0,l=0,s=0,h=null;function f(t,e){h?(t<h[0]&&(h[0]=t),e<h[1]&&(h[1]=e),t>h[2]&&(h[2]=t),e>h[3]&&(h[3]=e)):h=[t,e,t,e]}function v(){h&&r.push(h),h=null}function m(){return i[o++]}for(;o<i.length;){"string"==typeof i[o]&&(n=i[o++]);var p=n===n.toLowerCase(),d=n.toUpperCase();if("Z"!==d)if("M"!==d)if("L"!==d&&"T"!==d)if("H"!==d)if("V"!==d){var g="C"===d?3:"S"===d||"Q"===d?2:"A"===d?0:1;if("A"!==d)for(var E=0;E<g;E++){var w=(p?u:0)+m(),M=(p?c:0)+m();f(w,M),E===g-1&&(u=w,c=M)}else o+=5,f(u=(p?u:0)+m(),c=(p?c:0)+m())}else f(u,c=(p?c:0)+m());else f(u=(p?u:0)+m(),c);else f(u=(p?u:0)+m(),c=(p?c:0)+m());else v(),l=u=(p?u:0)+m(),s=c=(p?c:0)+m(),f(u,c),n=p?"l":"L";else u=l,c=s}return v(),r}(t.getAttribute("d")||"");Db.some(function(q){return q[2]-q[0]>.2*i})?Sd.push(t.getAttribute("d")):n=n.concat(Db)}}),e.querySelectorAll("rect").forEach(function(t){if(!t.closest("clipPath,mask,defs")){var e=+t.getAttribute("x")||0,r=+t.getAttribute("y")||0,a=+t.getAttribute("width"),o=+t.getAttribute("height"),u=t.getAttribute("transform");if(u&&/matrix|rotate/.test(u)){var c=.7071*Math.max(a,o);n.push([e+a/2-c,r+o/2-c,e+a/2+c,r+o/2+c])}else a>=.9*i||n.push([e,r,e+a,r+o])}}),e.querySelectorAll("polygon,polyline").forEach(function(t){for(var e=(t.getAttribute("points")||"").trim().split(/[\s,]+/).map(Number),r=null,a=0;a+1<e.length;a+=2){var i=e[a],o=e[a+1];r?(r[0]=Math.min(r[0],i),r[1]=Math.min(r[1],o),r[2]=Math.max(r[2],i),r[3]=Math.max(r[3],o)):r=[i,o,i,o]}r&&n.push(r)}),{W:i,H:o,boxes:n,solids:Sd}}var m=["attribute vec2 aCorner; attribute vec4 aPiece;","uniform vec2 uView; uniform vec2 uScale; uniform vec2 uOrigin;","uniform float uTime,uAmp,uFlick,uRate,uFreq,uPitch,uShape,uSoft,uBias;","uniform float uIR; uniform vec2 uIO; uniform float uFR,uFS; uniform vec2 uClip;","varying vec2 vUv; varying vec2 vScreen;","float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}","float h31(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}","float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);","return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),","mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}","void main(){"," vec2 lat=aPiece.xy/uPitch;"," float n=vn(vec3(lat*uFreq,uTime))*0.65+vn(vec3(lat*uFreq*2.3,uTime*1.3+7.0))*0.35;"," float r=h21(aPiece.xy); float f=h21(vec2(r*91.7,floor(uTime*uRate*4.0+r*13.0)));"," float am=aPiece.z>7.5?0.25:1.0; float v=aPiece.w+am*(uAmp*(n*2.0-1.0)*1.6+uFlick*(f*2.0-1.0)+uBias);",/* volle tegels bewegen nauwelijks mee: ze houden de rand van het vlak gesloten */" if(uIR>=0.0){float dd=distance(uOrigin+aPiece.xy*uScale,uIO); float nn=(vn(vec3(lat*0.09,4.0))*0.7+vn(vec3(lat*0.3,9.0))*0.3)*2.0-1.0; v=min(v,(uIR-dd)/(uPitch*uScale.x)+nn*6.0+(r*2.0-1.0)*2.5);}"," if(uFR>-1e5){float py=(uOrigin+aPiece.xy*uScale).y; float n2=vn(vec3(lat*0.2,11.0))*2.0-1.0; v=min(v,uFS*(uFR-py)/(uPitch*uScale.y)+n2*2.0+(r*2.0-1.0)*2.5);}"," {float py3=(uOrigin+aPiece.xy*uScale).y; float de=min(py3-uClip.x,uClip.y-py3)/(uPitch*uScale.y); float n3=vn(vec3(lat*0.35,17.0))*2.0-1.0; v=min(v,de-2.9+n3*1.2+(r*2.0-1.0)*1.0);}",
" float s=uSoft>0.5?smoothstep(0.0,0.35,v):step(0.0,v);"," vec2 px=uOrigin+aPiece.xy*uScale+aCorner*32.0*uShape*uScale*s;"," vScreen=px; vec2 c=px/uView*2.0-1.0;"," gl_Position= s<=0.0 ? vec4(2.0,2.0,2.0,1.0) : vec4(c.x,-c.y,0.0,1.0);"," vUv=vec2((aPiece.z+aCorner.x*0.5+0.5)/16.0,aCorner.y*0.5+0.5);","}"].join("\n"),p=["precision mediump float; varying vec2 vUv; varying vec2 vScreen;","uniform sampler2D uAtlas,uPhoto; uniform vec3 uColor; uniform float uMode; uniform vec4 uPhotoRect;","void main(){ float a=texture2D(uAtlas,vUv).a; if(a<0.004) discard; vec3 col=uColor;"," if(uMode>0.5){ vec2 uv=(vScreen-uPhotoRect.xy)/uPhotoRect.zw; uv=1.0-abs(1.0-mod(uv,2.0)); vec4 ph=texture2D(uPhoto,uv); col=mix(uColor,ph.rgb,ph.a); }"," gl_FragColor=vec4(col*a,a); }"].join("\n"),d=null;function g(t,e,r){var a=t.createShader(e);if(t.shaderSource(a,r),t.compileShader(a),!t.getShaderParameter(a,t.COMPILE_STATUS))throw new Error(t.getShaderInfoLog(a));return a}var E=0,w=window.scrollY,M=performance.now();window.addEventListener("scroll",function(){var t=performance.now(),e=Math.max(t-M,1);E=Math.min(4,Math.max(E,Math.abs(window.scrollY-w)/e)),w=window.scrollY,M=t},{passive:!0});var L={};function x(t){return L[t]||(L[t]=fetch(t,{mode:"cors"}).then(function(t){if(!t.ok)throw new Error(t.status);return t.text()}).then(function(t){return function(t){var e=t.boxes.map(function(t){return{x:(t[0]+t[2])/2,y:(t[1]+t[3])/2,w:t[2]-t[0],h:t[3]-t[1]}}).filter(function(t){return t.w>.5&&t.h>.5});if(e.length<20)return null;var r=e.filter(function(t){return Math.abs(t.w-t.h)<.06*t.w}).map(function(t){return t.w}).sort(function(t,e){return t-e}),a=r[Math.floor(.1*r.length)]||6,i=e.filter(function(t){return Math.abs(t.w-t.h)<.06*t.w&&Math.abs(t.w-a)<.12*a});if(i.length<4)return null;var o=[];i.slice(0,400).forEach(function(t){var e=1e9;i.forEach(function(r){if(t!==r){var i=Math.hypot(t.x-r.x,t.y-r.y);i>a&&i<e&&(e=i)}}),o.push(e)}),o.sort(function(t,e){return t-e});var n=o[Math.floor(o.length/2)];function u(t){return t.sort(function(t,e){return t-e}),t[Math.floor(t.length/2)]}var c=u(i.map(function(t){return(t.x%n+n)%n})),l=u(i.map(function(t){return(t.y%n+n)%n})),s={},h={};e.forEach(function(t){var e=(t.x-c)/n,r=(t.y-l)/n,a=Math.round(e),i=Math.round(r),o=e-a,u=r-i,f=Math.max(t.w,t.h)/n;if(f<.3){var v=-1;if(Math.abs(o)<.13&&Math.abs(u)<.13?v=0:Math.abs(u)<.13&&Math.abs(Math.abs(o)-.3)<.13?v=o<0?1:2:Math.abs(o)<.13&&Math.abs(Math.abs(u)-.3)<.13&&(v=u<0?3:4),v>=0)return void(s[a+","+i+","+v]=1)}var m=Math.floor(e)+","+Math.floor(r),p=f>.7?5:f>.42?6:7;(!h[m]||5===p||6===p&&7===h[m])&&(h[m]=p)});for(var v=[[0,0],[-.3,0],[.3,0],[0,-.3],[0,.3]],m0=Math.floor(-c/n)-1,p0=Math.ceil((t.W-c)/n)+1,m=m0-(p0-m0),p=p0+(p0-m0),d=Math.floor(-l/n)-1,g=Math.ceil((t.H-l)/n)+1,E=[],w=m;w<=p;w++)for(var M=d;M<=g;M++){var q=w<m0?1:w>p0?2:0,ww=q==1?Math.round(-2*c/n-w):q==2?Math.round(2*(t.W-c)/n-w):w,wd=q==1?Math.round(-2*c/n-w-1):q==2?Math.round(2*(t.W-c)/n-w-1):w;for(var L=0;L<5;L++){var LL=q&&(L==1||L==2)?3-L:L;E.push([c+(w+v[L][0])*n,l+(M+v[L][1])*n,L,s[ww+","+M+","+LL]?1:0])}var x=wd+","+M,A=f(w,M),y=h[x]||(A<.48?5:A<.69?6:7);E.push([c+(w+.5)*n,l+(M+.5)*n,y,h[x]?1:0])}var b=n,S={};E.forEach(function(t,e){var r=Math.floor(t[0]/b)+","+Math.floor(t[1]/b);(S[r]=S[r]||[]).push(e)});var R=new Float32Array(4*E.length);return E.forEach(function(t,e){for(var r=Math.floor(t[0]/b),a=Math.floor(t[1]/b),i=4*n,o=-4;o<=4;o++)for(var u=-4;u<=4;u++){var c=S[r+o+","+(a+u)];if(c)for(var l=0;l<c.length;l++){var s=E[c[l]];if(s[3]!==t[3]){var h=Math.hypot(s[0]-t[0],s[1]-t[1]);h<i&&(i=h)}}}var f=i/n;f=t[3]?f-.15:-(f-.15),R[4*e]=t[0],R[4*e+1]=t[1],R[4*e+2]=t[2],R[4*e+3]=f}),function(){if(t.solids.length){/* dicht vlak: tegels diep in het vlak altijd aan; in een rand van een paar tegels breed steeds willekeuriger uitgedund,
  zodat de rechte randen en hoeken uit Figma nergens zichtbaar zijn. Randen van het SVG-kader (onder, boven, spiegelnaden) tellen niet als rand.
  Snel: het vlak wordt één keer op een grof raster getekend, daarna een afstandskaart in twee doorgangen (geen duizenden puntmetingen). */
  var RIM=SOLID_RIM,gs=n/4,gw=Math.ceil(t.W/gs)+1,gh=Math.ceil(t.H/gs)+1,cv=document.createElement("canvas");cv.width=gw;cv.height=gh;
  var cx=cv.getContext("2d");cx.scale(1/gs,1/gs);cx.fill(new Path2D(t.solids.join(" ")));
  var px=cx.getImageData(0,0,gw,gh).data,INF=1e9,D=new Float32Array(gw*gh),SQ=[];
  for(var q=0;q<gw*gh;q++)D[q]=px[4*q+3]>127?INF:0;
  /* afstand tot de dichtstbijzijnde lege cel; buiten het kader geldt alles als vol */
  function g(xx,yy){return xx<0||yy<0||xx>=gw||yy>=gh?INF:D[yy*gw+xx]}
  for(var yy=0;yy<gh;yy++)for(var xx=0;xx<gw;xx++){var k=yy*gw+xx;if(!D[k])continue;D[k]=Math.min(D[k],g(xx-1,yy)+1,g(xx,yy-1)+1,g(xx-1,yy-1)+1.414,g(xx+1,yy-1)+1.414)}
  for(yy=gh-1;yy>=0;yy--)for(xx=gw-1;xx>=0;xx--){k=yy*gw+xx;if(!D[k])continue;D[k]=Math.min(D[k],g(xx+1,yy)+1,g(xx,yy+1)+1,g(xx+1,yy+1)+1.414,g(xx-1,yy+1)+1.414)}
  function dist(X,Y){X=X<0?-X:X>t.W?2*t.W-X:X;var xi=Math.min(gw-1,Math.max(0,Math.round(X/gs))),yi=Math.min(gh-1,Math.max(0,Math.round(Y/gs)));return D[yi*gw+xi]*gs/n}
  for(var zz=0;zz<E.length;zz++){var X=R[4*zz],Y=R[4*zz+1],de=dist(X,Y);if(de<.25)continue;
    var hh=f(X*.137+3.1,Y*.211+7.7);R[4*zz+3]=Math.max(R[4*zz+3],de>RIM?2:1.2*de-1.6+(hh*2-1)*.7);
    if(R[4*zz+2]===0)for(var qx=-1;qx<=1;qx+=2)for(var qy=-1;qy<=1;qy+=2){var SX=X+qx*.25*n,SY=Y+qy*.25*n,ds=dist(SX,SY);if(ds<.1)continue;SQ.push(SX,SY,8,ds>RIM?6:4*ds-3.2+(f(SX*.071+1.3,SY*.093+5.1)*2-1)*2.6)}}/* volle halve tegels: getrapte, gerafelde rand */
  if(SQ.length){var R2=new Float32Array(R.length+SQ.length);R2.set(R);R2.set(SQ,R.length);R=R2}}}(),{data:R,count:R.length/4,pitch:n,W:t.W,H:t.H,solids:t.solids}}(v(t))})),L[t]}function A(t,e){this.el=t,this.opts=e,this.t=20*Math.random(),this.active=!1,this.near=!1,this.data=null}A.prototype.prepare=function(){var t=this;if(this.loading)return this.loading;var e,r,a,i=(e=this.opts.maskEl,r=getComputedStyle(e),(a=(r.maskImage||r.webkitMaskImage||"").match(/url\(["']?([^"')]+)["']?\)/))?a[1]:null);return i?(this.loading=x(i).then(function(e){if(!e)throw new Error("vorm niet herkend");return t.data=e,e}),this.loading):Promise.reject(new Error("geen masker"))},A.prototype.start=function(){if(!this.active&&this.data){var t=this.el,e=this.opts,r=document.createElement("canvas");r.setAttribute("aria-hidden","true"),r.style.cssText="position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0";var a=r.getContext("webgl",{premultipliedAlpha:!0,alpha:!0,antialias:!1}),i=a&&a.getExtension("ANGLE_instanced_arrays");if(a&&i){try{var o=a.createProgram();a.attachShader(o,g(a,a.VERTEX_SHADER,m)),a.attachShader(o,g(a,a.FRAGMENT_SHADER,p)),a.linkProgram(o),a.useProgram(o)}catch(t){return void console.warn("[las-rodes] shader",t)}var n={};["uView","uScale","uOrigin","uTime","uAmp","uFlick","uRate","uFreq","uPitch","uShape","uSoft","uBias","uIR","uIO","uFR","uFS","uClip","uAtlas","uPhoto","uColor","uMode","uPhotoRect"].forEach(function(t){n[t]=a.getUniformLocation(o,t)});var u=a.createBuffer();a.bindBuffer(a.ARRAY_BUFFER,u),a.bufferData(a.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),a.STATIC_DRAW);var c=a.getAttribLocation(o,"aCorner");a.enableVertexAttribArray(c),a.vertexAttribPointer(c,2,a.FLOAT,!1,0,0);var l=a.createBuffer();a.bindBuffer(a.ARRAY_BUFFER,l),a.bufferData(a.ARRAY_BUFFER,this.data.data,a.STATIC_DRAW);var h=a.getAttribLocation(o,"aPiece");if(a.enableVertexAttribArray(h),a.vertexAttribPointer(h,4,a.FLOAT,!1,0,0),i.vertexAttribDivisorANGLE(h,1),f(0,function(){if(d)return d;var t=256,e=document.createElement("canvas");e.width=4096,/* macht van twee: nodig voor mipmaps in WebGL1 */e.height=t;var r=e.getContext("2d");r.fillStyle="#000";for(var a=0;a<9;a++){var i=s[a];i&&(r.save(),r.translate(a*t+128,128),r.scale(4,4),r.fill(new Path2D(i),"evenodd"),r.restore())}return d=e}(),!0),a.uniform1i(n.uAtlas,0),a.uniform1i(n.uPhoto,1),e.photo)try{f(1,e.photo,!1)}catch(t){return void console.warn("[las-rodes] foto zonder CORS",t)}a.enable(a.BLEND),a.blendFunc(a.ONE,a.ONE_MINUS_SRC_ALPHA),this.gl=a,this.ext=i,this.U=n,this.cv=r,this.active=!0,(e.host||t).appendChild(r),e.onStart&&e.onStart(),function(F){for(var q=r.parentElement,ce=[],fl=0;q&&q!==document.body;q=q.parentElement){var cs=getComputedStyle(q);cs.overflowY!=="visible"&&ce.push(q);var tm=cs.transform;tm&&"none"!==tm&&parseFloat(tm.slice(7))<0&&(fl^=1)}F.clipEls=ce,F.flip=fl}(this),this.resize()}}function f(t,e,r){var i=a.createTexture();a.activeTexture(a.TEXTURE0+t),a.bindTexture(a.TEXTURE_2D,i),a.texImage2D(a.TEXTURE_2D,0,a.RGBA,a.RGBA,a.UNSIGNED_BYTE,e),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),r?(a.generateMipmap(a.TEXTURE_2D),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR_MIPMAP_LINEAR)):a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,a.LINEAR)}},A.prototype.stop=function(){if(this.active){var t=this.gl.getExtension("WEBGL_lose_context");t&&t.loseContext(),this.cv.remove(),this.active=!1,this.gl=null,this.opts.onStop&&this.opts.onStop()}},A.prototype.resize=function(){if(this.active){var t=Math.min(window.devicePixelRatio||1,c),hb=this.opts.host||this.el,rr=hb.getBoundingClientRect(),vw=document.documentElement.clientWidth;this.ex=this.opts.full?Math.max(0,Math.round(Math.max(rr.left,vw-rr.right))):0;this.cv.style.left=-this.ex+"px",this.cw=hb.clientWidth+2*this.ex,this.cv.style.width=this.cw+"px",this.opts.onResize&&this.opts.onResize(this.ex),this.ch=this.el.clientHeight,this.cv.width=Math.round(this.cw*t),this.cv.height=Math.round(this.ch*t),this.gl.viewport(0,0,this.cv.width,this.cv.height)}},A.prototype.draw=function(u){if(this.active){var c=this.gl,l=this.U,s=this.data,f=this.opts;this.t+=u*(f.idle||e)*(1+E*r);var v=f.box(s);if(c.clearColor(0,0,0,0),c.clear(c.COLOR_BUFFER_BIT),c.uniform2f(l.uView,this.cw,this.ch),c.uniform2f(l.uScale,v.w/s.W,v.h/s.H),c.uniform2f(l.uOrigin,v.x+(this.ex||0),v.y),c.uniform1f(l.uTime,this.t),c.uniform1f(l.uAmp,h?0:t),c.uniform1f(l.uFlick,h?0:i),c.uniform1f(l.uRate,o),c.uniform1f(l.uFreq,a),c.uniform1f(l.uSoft,n&&!h?1:0),c.uniform1f(l.uBias,h||f.noBias?0:Q*(function(Z){var Y=window.innerHeight;return Math.min(1,Math.max(0,(Y-Z.top)/(Y+Z.height)))}((f.host||this.el).getBoundingClientRect())-.5)*2),c.uniform1f(l.uIR,f.intro?f.intro.r(this):-1),c.uniform2f(l.uIO,f.intro?f.intro.ox:0,f.intro?f.intro.oy:0),c.uniform1f(l.uFR,f.build?f.build.f(this):-1e6),c.uniform1f(l.uFS,f.build?f.build.s:1),function(F){for(var CR=F.cv.getBoundingClientRect(),y0=0,y1=F.ch,ci=0;ci<(F.clipEls||[]).length;ci++){var AR=F.clipEls[ci].getBoundingClientRect(),a0=F.flip?CR.bottom-AR.bottom:AR.top-CR.top,a1=F.flip?CR.bottom-AR.top:AR.bottom-CR.top;y0=Math.max(y0,a0),y1=Math.min(y1,a1)}c.uniform2f(l.uClip,y0,y1)}(this),c.uniform1f(l.uPitch,s.pitch),c.uniform1f(l.uShape,s.pitch/62.6),f.photo){c.uniform1f(l.uMode,1),c.uniform3f(l.uColor,.949,.925,.882);var m=f.photoRect();c.uniform4f(l.uPhotoRect,m.x+(this.ex||0),m.y,m.w,m.h)}else{c.uniform1f(l.uMode,0);var p=f.color;c.uniform3f(l.uColor,p[0],p[1],p[2])}this.ext.drawArraysInstancedANGLE(c.TRIANGLES,0,6,s.count)}};var y=[];function b(){document.querySelectorAll(".band_component[data-color]").forEach(function(t){var e,r,a,i=(a="--color--"+t.getAttribute("data-color"),e=getComputedStyle(document.documentElement).getPropertyValue(a).trim()||"#000000",(r=e.replace("#","").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i))?[parseInt(r[1],16)/255,parseInt(r[2],16)/255,parseInt(r[3],16)/255]:[0,0,0]),o=t.parentElement,n=t.classList.contains("is-large"),u=new A(t,{maskEl:t,color:i,host:o,full:!0,box:function(t){var e=o.clientWidth;return t.solids.length?{x:0,y:0,w:e,h:o.clientHeight}:{x:0,y:0,w:e,h:e*t.H/t.W}},onStart:function(){u.applyExt=function(ex){var e=u.data,hw=o.clientWidth;t.style.marginLeft=-ex+"px";t.style.width=hw+2*ex+"px";if(e.solids.length){var ps=e.solids.map(function(z){return'<path d="'+z+'"/>'}).join(""),W=e.W,H=e.H,K=e.pitch,mir=ps+'<g transform="scale(-1,1)">'+ps+'</g><g transform="translate('+2*W+',0) scale(-1,1)">'+ps+"</g>",strips='<rect x="'+-W+'" y="-1" width="'+3*W+'" height="'+(K+1)+'"/><rect x="'+-W+'" y="'+(H-K)+'" width="'+3*W+'" height="'+(K+1)+'"/><rect x="'+-K+'" y="0" width="'+2*K+'" height="'+H+'"/><rect x="'+(W-K)+'" y="0" width="'+2*K+'" height="'+H+'"/>';/* wit = dicht; zwarte lijn langs de rand krimpt het vlak in; langs kader en spiegelnaden blijft het vol, zodat het aansluit op de achtergrond */var U='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+-W+" 0 "+3*W+" "+H+'" preserveAspectRatio="none"><defs><clipPath id="b">'+strips+'</clipPath><filter id="e" filterUnits="userSpaceOnUse" x="'+-W+'" y="-1" width="'+3*W+'" height="'+(H+2)+'"><feMorphology operator="erode" radius="'+K+'"/></filter><mask id="m" maskUnits="userSpaceOnUse" x="'+-W+'" y="-1" width="'+3*W+'" height="'+(H+2)+'"><g filter="url(#e)"><g fill="#fff" stroke="#fff" stroke-width="1.5">'+mir+'</g></g><g clip-path="url(#b)" fill="#fff" stroke="#fff" stroke-width="1.5">'+mir+'</g></mask></defs><rect x="'+-W+'" y="-1" width="'+3*W+'" height="'+(H+2)+'" fill="#000" mask="url(#m)"/></svg>')+'")';t.style.maskImage=t.style.webkitMaskImage=U;t.style.maskSize=t.style.webkitMaskSize=3*hw+"px 100%";t.style.maskPosition=t.style.webkitMaskPosition=ex-hw+"px 0";t.style.maskRepeat=t.style.webkitMaskRepeat="no-repeat";return}var r=hw*e.H/e.W,a=Math.max(0,o.clientHeight-r);n?(t.style.maskImage=t.style.webkitMaskImage="linear-gradient(#000,#000)",t.style.maskSize=t.style.webkitMaskSize="100% "+a+"px",t.style.maskPosition=t.style.webkitMaskPosition="bottom"):t.style.visibility="hidden"};u.applyExt(u.ex||0)},onResize:function(ex){u.applyExt&&u.applyExt(ex)},onStop:function(){["maskImage","webkitMaskImage","maskSize","webkitMaskSize","maskPosition","webkitMaskPosition","maskRepeat","webkitMaskRepeat","visibility","marginLeft","width"].forEach(function(e){t.style[e]=""})}});y.push(u)})}function S(t){var e=t.querySelector("img");if(e){var r=new Image;r.crossOrigin="anonymous",r.src=e.currentSrc||e.src;var a=new A(t,{maskEl:t,photo:null,box:function(){var e=getComputedStyle(t),r=(e.maskPosition||"0 0").split(" "),a=(e.maskSize||"").split(" ");function i(t,e){return t&&"auto"!==t?/%$/.test(t)?parseFloat(t)/100*e:parseFloat(t):null}var o=i(a[0],t.clientWidth)||t.clientWidth,n=i(a[1],t.clientHeight)||t.clientHeight;return{x:i(r[0],t.clientWidth-o)||0,y:i(r[1],t.clientHeight-n)||0,w:o,h:n}},photoRect:function(){var a=t.getBoundingClientRect(),i=e.getBoundingClientRect(),o=r.naturalWidth,n=r.naturalHeight,u=Math.max(i.width/o,i.height/n),c=o*u,l=n*u;return{x:i.left-a.left+(i.width-c)/2,y:i.top-a.top+(i.height-l)/2,w:c,h:l}},onStart:function(){t.style.maskImage="none",t.style.webkitMaskImage="none",e.style.visibility="hidden",t.style.visibility="visible",a.opts.full&&(t.style.overflow="visible")},onStop:function(){t.style.maskImage="",t.style.webkitMaskImage="",e.style.visibility=""}});a.opts.full=t.classList.contains("hero_bg"),document.documentElement.classList.contains("lr-intro")&&t.classList.contains("hero_bg")&&(a.opts.intro={s:0,done:!1,ox:0,oy:0,r:function(F){var N=performance.now();this.s||(this.s=N);var P=Math.min(1,(N-this.s)/(window.LR_SPILL_MS||5e3)),K=(window.LR_SPILL_EASE||function(p){return 1-Math.pow(1-p,3)})(P);this.ox=.5*F.cw,this.oy=.6*F.ch;if(!this.R){for(var B=F.opts.box(F.data),sx=B.w/F.data.W,sy=B.h/F.data.H,D=F.data.data,mx=0,j=0;j<D.length;j+=4)D[j+3]>0&&(F.ex||0)+B.x+D[j]*sx>=0&&(F.ex||0)+B.x+D[j]*sx<=F.cw&&(mx=Math.max(mx,Math.hypot((F.ex||0)+B.x+D[j]*sx-this.ox,B.y+D[j+1]*sy-this.oy)));this.R=mx+9*F.data.pitch*sx}return P>=(window.LR_SPILL_DONE||.8)&&!this.done&&(this.done=!0,document.dispatchEvent(new Event("lasrodes:herodone"))),P>=1?-1:K*this.R}}),r.onload=function(){a.opts.photo=r,y.push(a),R.observe(a.el)}}}var R=new IntersectionObserver(function(t){t.forEach(function(t){var e=y.find(function(e){return e.el===t.target});e&&(e.near=t.isIntersecting,e.near?e.prepare().then(T).catch(function(t){console.warn("[las-rodes] patroon valt terug op CSS-masker:",t.message)}):e.stop(),T())})},{rootMargin:"50% 0px"});function T(){var t=y.filter(function(t){return t.near&&t.data}),e=window.innerHeight;t.sort(function(t,r){var a=t.el.getBoundingClientRect(),i=r.el.getBoundingClientRect();return Math.abs(a.top+a.height/2-e/2)-Math.abs(i.top+i.height/2-e/2)}),t.forEach(function(t,e){e<u?t.start():t.stop()})}var P=performance.now();function _(t){var e=Math.min((t-P)/1e3,.05);P=t,E*=Math.pow(.04,e);for(var r=0;r<y.length;r++)y[r].active&&y[r].draw(e);requestAnimationFrame(_)}function k(){if(!h&&window.gsap&&window.ScrollTrigger&&(gsap.registerPlugin(ScrollTrigger),gsap.matchMedia().add("(min-width: "+l+"px)",function(){document.querySelectorAll("[data-parallax]").forEach(function(t){var e=parseFloat(t.getAttribute("data-parallax"))||.1;gsap.fromTo(t,{y:function(){return window.innerHeight*e}},{y:function(){return-window.innerHeight*e},ease:"none",scrollTrigger:{trigger:t,start:"top bottom",end:"bottom top",scrub:!0,invalidateOnRefresh:!0}})})})),!h){var t;b(),document.querySelectorAll(".hero_bg, [data-pattern-photo]").forEach(S),window.LR={fields:y,update:T},y.forEach(function(t){t.el.hasAttribute("data-manual")||R.observe(t.el)}),window.addEventListener("resize",function(){clearTimeout(t),t=setTimeout(function(){y.forEach(function(t){t.resize()})},150)});var e=!1;window.addEventListener("scroll",function(){e||(e=!0,requestAnimationFrame(function(){e=!1,T()}))},{passive:!0}),requestAnimationFrame(_)}}/* bewust na alle andere DOMContentLoaded-handlers: het menu maakt eerst zijn eigen band aan */"complete"===document.readyState?k():document.addEventListener("DOMContentLoaded",k)}();
