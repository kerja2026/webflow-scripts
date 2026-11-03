/* Logo in de nav: verkleint naar 65% zodra je naar beneden scrolt (vanaf 40px), en blijft klein tot je weer helemaal bovenaan bent.
   De maat en de duur (1 seconde) staan in styles.css bij html.lr-logo-small .nav_logo. */
document.addEventListener("DOMContentLoaded",function(){
  var root=document.documentElement,START=40,small=false;
  function check(){var y=window.scrollY||document.documentElement.scrollTop;
    if(!small&&y>START){small=true;root.classList.add("lr-logo-small");}
    else if(small&&y<=1){small=false;root.classList.remove("lr-logo-small");}}
  window.addEventListener("scroll",check,{passive:true});check();
});
