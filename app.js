// app.js — modifications pour copier le lien et graphique de prix
// (le reste du fichier est inchangé, seuls les blocs modifiés sont montrés)

// … (toutes les fonctions et variables existantes sont conservées) …

// 1. Nouvelle fonction : génération du mini graphique SVG
function miniChart(x){
  var pts=[];
  if(x.prec!=null) pts.push({v:x.prec, t:"préc."});
  if(x.pmin!=null) pts.push({v:x.pmin, t:"min"});
  pts.push({v:x.prix, t:"maint."});
  if(pts.length<2) return "";
  var max=Math.max.apply(null,pts.map(function(p){return p.v}));
  var min=Math.min.apply(null,pts.map(function(p){return p.v}));
  var span=max-min||1;
  var w=120,h=32,px=w/(pts.length-1);
  var pol=pts.map(function(p,i){return (i*px).toFixed(1)+","+(h-((p.v-min)/span*(h-8))+4).toFixed(1)}).join(" ");
  return '<div class="mini-chart"><svg viewBox="0 0 '+w+' '+h+'"><polyline points="'+pol+'" fill="none" stroke="#4fe0d6" stroke-width="2"/></svg></div>';
}

// 2. cardHtml : ajout du bouton copier
function cardHtml(x,i){
  var fv=FAV[x.lien];
  var tags="";
  if(NEWS[x.lien])tags+='<span class="tag tn">NOUVEAU</span>';
  if(x.gone)tags+='<span class="tag tg">PLUS EN PROMO</span>';
  else{
    if(isDrop(x))tags+='<span class="tag td">↓ −'+f(x.prec-x.prix)+'</span>';
    if(fv&&fv.prix-x.prix>0.01)tags+='<span class="tag td">↓ −'+f(fv.prix-x.prix)+' depuis l’ajout</span>';
    if(x._alt)tags+=x._best?'<span class="tag tb">MEILLEUR PRIX</span>':'<span class="tag tg">MOINS CHER AILLEURS</span>';
    if(x.inf)tags+='<span class="tag tg">PRIX BARRÉ ?</span>';
    else if(x.pmin&&x.pmin<x.prix-0.5&&!isDrop(x))tags+='<span class="tag tg">DÉJÀ À '+f(x.pmin)+'</span>';
  }
  var img=x.image?'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(thumb(x.image))+'" data-o="'+esc(x.image)+'" alt="" onerror="if(this.dataset.o&&this.src!==this.dataset.o){this.src=this.dataset.o;this.dataset.o=\'\'}else{this.style.visibility=\'hidden\'}">':'<div class="ph"></div>';
  var href=/^https?:\/\//.test(x.lien)?esc(x.lien):"#";
  return '<div class="card'+(x.gone?" gone":"")+'" data-l="'+esc(x.lien)+'" style="--i:'+((i||0)%12)+'">'
    +'<button class="fav'+(fv?" on":"")+'" data-l="'+esc(x.lien)+'" aria-label="Favori">'+(fv?"♥":"♡")+'</button>'
    +'<button class="copy" data-l="'+esc(x.lien)+'" aria-label="Copier le lien">⧉</button>'
    +'<a href="'+href+'" target="_blank" rel="noopener">'+(x.gone?"":'<span class="pct">−'+x.remise+' %</span>')+img
    +'<div class="in"><div class="b">'+esc(x.marque)+' · '+esc(x.boutique)+'</div>'
    +'<div class="t">'+esc(x.nom)+'</div>'
    +'<div><span class="now">'+f(x.prix)+'</span><span class="old">'+f(x.ancien_prix)+'</span></div>'
    +'<div class="s">'+esc((x.tailles||[]).join(", "))+'</div>'+tags+'</div></a></div>';
}

// 3. openSheet : ajout du graphique après les prix
function openSheet(l){
  var x=M[l]||FAV[l];
  if(!x)return;
  cur=l;
  var tl=(x.tailles||[]).map(function(t){return '<span class="pill">'+esc(t)+'</span>'}).join("");
  var alt="";
  if(M[l]&&x._alt){
    alt='<div class="lbl">Aussi chez</div>'+x._alt.map(function(y){return '<a class="altl" href="'+esc(y.lien)+'" target="_blank" rel="noopener"><span>'+esc(y.boutique)+'</span><b>'+f(y.prix)+'</b></a>'}).join("");
  }
  var hist="";
  if(x.prec!=null&&x.chg)hist+='<div class="s">Prix précédent : '+f(x.prec)+' (changé le '+fdate(x.chg)+')</div>';
  if(x.inf)hist+='<div class="s" style="color:#f0a8bc">⚠ Prix barré à confirmer : il était à '+f(x.inf)+' lors d’un relevé précédent, il affiche '+f(x.ancien_prix)+' aujourd’hui.</div>';
  if(x.pmin&&x.pmin<x.prix-0.5)hist+='<div class="s">Déjà vu à '+f(x.pmin)+' lors d’un relevé précédent (taille différente possible).</div>';
  var chart=miniChart(x);
  var small=thumb(x.image),big=thumb(x.image,700);
  var img=x.image?'<img class="sh-img" id="shImg" referrerpolicy="no-referrer" src="'+esc(small)+'" alt="" onerror="this.style.visibility=\'hidden\'">':"";
  $("shBody").innerHTML='<button class="sh-x" onclick="closeSheet()">✕</button>'+img
    +'<div class="b">'+esc(x.marque)+' · '+esc(x.boutique)+'</div>'
    +'<div class="sh-t">'+esc(x.nom)+'</div>'
    +'<div><span class="now big">'+f(x.prix)+'</span><span class="old">'+f(x.ancien_prix)+'</span><span class="pct2">−'+x.remise+' %</span></div>'
    +chart+hist+(tl?'<div class="lbl">Tailles disponibles</div><div class="pills">'+tl+'</div>':'')+alt
    +'<div class="sh-act"><a class="go" href="'+esc(x.lien)+'" target="_blank" rel="noopener">Voir sur le site</a>'
    +'<button class="fbtn" id="shFav" aria-label="Favori">'+(FAV[l]?"♥":"♡")+'</button>'
    +'<button class="fbtn" id="shShare">Partager</button></div>';
  $("shBody").scrollTop=0;
  $("sheet").className="open";
  document.body.style.overflow="hidden";
  if(hs===0)pushO();
  if(x.image&&big&&big!==small){
    var im=new Image();
    im.referrerPolicy="no-referrer";
    im.onload=function(){var el=$("shImg");if(el&&cur===l)el.src=big};
    im.src=big;
  }
}

// 4. Gestion du clic sur le bouton copier (dans l'écouteur de la grille)
$("g").addEventListener("click",function(e){
  var btn=e.target.closest(".fav");
  if(btn){
    var l=btn.getAttribute("data-l");
    toggleFavL(l);
    if(onlyFav){var y=window.scrollY;draw(true);window.scrollTo(0,y)}
    else{
      btn.className="fav"+(FAV[l]?" on":"");
      btn.textContent=FAV[l]?"♥":"♡";
      btn.classList.add("pop");
      setTimeout(function(){btn.classList.remove("pop")},420);
    }
    return;
  }
  var cp=e.target.closest(".copy");
  if(cp){
    var l=cp.getAttribute("data-l");
    if(navigator.clipboard){
      navigator.clipboard.writeText(l).then(function(){
        cp.textContent="✓";
        cp.classList.add("pop");
        setTimeout(function(){cp.textContent="⧉";cp.classList.remove("pop")},800);
      }).catch(function(){});
    }
    e.preventDefault();
    return;
  }
  var a=e.target.closest(".card a");
  if(a){
    e.preventDefault();
    if(picking)return;
    picking=true;
    var c=a.closest(".card");
    var id=c.getAttribute("data-l");
    c.classList.add("pick");
    setTimeout(function(){
      c.classList.remove("pick");
      picking=false;
      openSheet(id);
    },110);
  }
});