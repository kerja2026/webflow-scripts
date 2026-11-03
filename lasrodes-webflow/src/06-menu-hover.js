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
