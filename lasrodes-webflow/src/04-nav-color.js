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
