/* Muziek: start bij de klik op ENTRAR na de preloader (of zodra de site geladen is als er geen preloader is) en speelt door tot de bezoeker hem zelf uitzet.
   Browsers blokkeren geluid dat vanzelf start tot de bezoeker iets op de pagina doet; dan start hij bij de eerste klik, tik of toets.
   Knop rechtsonder met de eigen play- en pause-iconen. Uitgezet blijft uit tot het tabblad sluit. */
document.addEventListener("DOMContentLoaded",function(){
  var CDN="https://cdn.prod.website-files.com/6ae4913cbd8a2e883953ad49/",
      SRC=CDN+"6aeb69732f639e79020bc23b_Las%20Rodes%20-%20Nada%20Na.mp3",
      ICON_PLAY=CDN+"6aeb69419cbbd0df5b67e0ee_play-btn.svg",ICON_PAUSE=CDN+"6aeb69422456d0728bd15362_pause-btn.svg",
      VOL=.7,FADE=2000,KEY="lr-music-off";
  var root=document.documentElement,audio=new Audio();audio.src=SRC;audio.loop=true;audio.preload="auto";audio.volume=0;
  var btn=document.createElement("button");btn.type="button";btn.className="lr-music";
  var img=document.createElement("img");img.alt="";img.width=60;img.height=60;btn.appendChild(img);document.body.appendChild(btn);
  new Image().src=ICON_PLAY;new Image().src=ICON_PAUSE;/* beide iconen vooraf laden */
  var off=false,fadeT=null;/* uitgezet blijft alleen uit binnen dit bezoek (tabblad); een nieuw bezoek start weer met muziek bij ENTRAR */
  try{localStorage.removeItem(KEY);off=sessionStorage.getItem(KEY)==="1";}catch(e){}
  function ui(){var on=!audio.paused;img.src=on?ICON_PAUSE:ICON_PLAY;btn.setAttribute("aria-pressed",on?"true":"false");btn.setAttribute("aria-label",on?"Muziek uitzetten":"Muziek aanzetten");}
  function fade(to,cb){clearInterval(fadeT);var from=audio.volume,t0=performance.now();
    fadeT=setInterval(function(){var q=Math.min(1,(performance.now()-t0)/FADE);audio.volume=from+(to-from)*q;if(q>=1){clearInterval(fadeT);cb&&cb();}},30);}
  function play(){if(off)return;var p=audio.play();if(p&&p.then)p.then(function(){fade(VOL);ui();}).catch(function(){waitForGesture();});else{fade(VOL);ui();}}
  function waitForGesture(){/* geblokkeerd door de browser: start bij de eerste klik, tik of toets */
    var ev=["pointerdown","keydown","touchstart"];function go(e){if(btn.contains(e.target))return;ev.forEach(function(n){document.removeEventListener(n,go,true);});play();}
    ev.forEach(function(n){document.addEventListener(n,go,true);});}
  btn.addEventListener("click",function(){
    if(audio.paused){off=false;try{sessionStorage.removeItem(KEY);}catch(e){}audio.play().then(function(){fade(VOL);ui();}).catch(function(){});}
    else{off=true;try{sessionStorage.setItem(KEY,"1");}catch(e){}fade(0,function(){audio.pause();ui();});ui();img.src=ICON_PLAY;}});
  /* tabblad op de achtergrond: muziek pauzeert, en gaat verder als je terugkomt */
  var wasOn=false;document.addEventListener("visibilitychange",function(){if(document.hidden){wasOn=!audio.paused;if(wasOn)audio.pause();}else if(wasOn&&!off){audio.play().catch(function(){});}ui();});
  audio.addEventListener("play",ui);audio.addEventListener("pause",ui);ui();
  /* knop kleurt mee: licht op donkere achtergronden, net als de nav */
  (function tone(){var r=btn.getBoundingClientRect(),c=window.LR_NAV&&window.LR_NAV.bgAt(r.left+r.width/2,r.top+r.height/2);
    if(c){var v=(c.match(/[\d.]+/g)||[]).map(parseFloat),hex=/^#/.test(c)?[parseInt(c.substr(1,2),16),parseInt(c.substr(3,2),16),parseInt(c.substr(5,2),16)]:v;
      btn.classList.toggle("lr-on-dark",(.2126*hex[0]+.7152*hex[1]+.0722*hex[2])/255<.5);}
    setTimeout(function(){requestAnimationFrame(tone);},120);})();
  function start(){root.classList.add("lr-music-ready");if(audio.paused)play();}
  /* klik op ENTRAR: start direct, binnen de klik, zodat de browser het geluid toestaat */
  document.addEventListener("lasrodes:enter",function(){root.classList.add("lr-music-ready");if(!off&&audio.paused){audio.play().then(function(){fade(VOL);ui();}).catch(function(){waitForGesture();});}});
  /* pas na de preloader (de hele site geladen); zonder preloader na het load-event */
  if(root.classList.contains("lr-pre"))document.addEventListener("lasrodes:preloaded",start);
  else if(document.readyState==="complete")start();else window.addEventListener("load",start);
});
