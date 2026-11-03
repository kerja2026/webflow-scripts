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
