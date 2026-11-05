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
  /* menu-items: een menulijst op de pagina wordt gekopieerd; staat die er niet (meer), dan bouwt het script de lijst zelf */
  var src=document.querySelector(".coral_menu"),l;
  if(src){l=src.cloneNode(true);}
  else{l=document.createElement("div");l.className="coral_menu";
    [["#raices","Ra\u00edces"],["#voces","Las voces detr\u00e1s"],["#voz","Su propia voz"]].forEach(function(it){var a=document.createElement("a");a.className="coral_menu-link heading-style-h4";a.href=it[0];a.textContent=it[1];l.appendChild(a);});}
  l.classList.add("lr-menu_links");content.appendChild(l);
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
    var mob=window.innerWidth<992&&el.hasAttribute("data-scroll-offset-mobile");/* tablet en mobiel: eigen afstand, de opbouw is daar anders */
    y+=(parseFloat(el.getAttribute(mob?"data-scroll-offset-mobile":"data-scroll-offset"))||0)*parseFloat(getComputedStyle(root).fontSize);
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
