var PER=60,D=[],M={},FAV={},NEWS={},hasNew=false,L=[],onlyFav=false,onlyNew=false,onlyDrop=false,tm,SZ={},BR={},CAT="all",GEN="all",SYS="EU",CNT={},shownN=0,cur=null,io=null;
var CATS=[["all","Tout"],["vet","Vêtements"],["chau","Chaussures"],["tee","T-shirts"],["acc","Accessoires"]];
var GENS=[["all","Tous"],["h","Homme"],["f","Femme"]];
var LET=["XXS","XS","S","M","L","XL","XXL","XXXL"];
var LM={"xxs":"XXS","x-small":"XS","xs":"XS","extra small":"XS","small":"S","s":"S","medium":"M","m":"M","large":"L","l":"L","x-large":"XL","xl":"XL","extra large":"XL","xx-large":"XXL","xxl":"XXL","2xl":"XXL","xxx-large":"XXXL","xxxl":"XXXL","3xl":"XXXL"};
var TEE=/\b(t[\s-]?shirts?|tees?|tshirts?)\b/;
var ACC=/\b(bags?|backpack|sacs?|tote|caps?|hats?|beanie|bonnet|casquette|bob|scarf|echarpe|écharpe|gloves?|gants?|socks?|chaussettes?|belt|ceinture|wallet|portefeuille|keyring|sunglasses|lunettes|watch|montre|bottle|towel|serviette|hip ?bag|pouch|trousse|lanyard|laces|lacets|cardholder|headband|bandana)\b/;
var SHOE=/\b(sneakers?|shoes?|boots?|sandals?|sandales?|slides?|clogs?|loafers?|trainers?|mules?|chaussures?|baskets?|footwear|air (max|force|jordan|liquid|rift|zoom|presto|vapormax)|jordan \d+|dunk|samba|gazelle|campus|superstar|stan smith|yeezy|ultraboost|chuck|old skool|sk8|authentic|slip[\s-]?on|runner|cortez|vomero|pegasus|clifton|bondi|speedcross|xt[\s-]?6|gel[\s-]\w+|boston|arizona|birki|new balance \d)\b/;
var APP=/\b(hoodies?|hoody|sweats?|sweatshirts?|jackets?|vestes?|pants?|pantalons?|shorts?|jeans?|joggers?|cargos?|coats?|manteaux?|parkas?|fleeces?|shirts?|chemises?|polos?|dress|robes?|skirts?|jupes?|leggings?|tights|tops?|jumpers?|knits?|pulls?|cardigans?|vests?|gilets?|bombers?|windbreakers?|anoraks?|tracksuits?|boxers?|briefs?|bras?|crewnecks?|pullovers?|trousers?|denim|overshirts?|shackets?|swim|maillot|bodysuit|jersey|sweatpants?|chinos?|overalls?|dungarees?)\b/;
var SHOEB=/\b(birkenstock|crocs|vans|converse|hoka|salomon|asics|saucony|mizuno|dr\.? martens|clarks)\b/;
function ls(k,v){try{if(v===undefined){return JSON.parse(localStorage.getItem(k))}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function f(n){return n.toFixed(2).replace(".",",")+" €"}
function $(id){return document.getElementById(id)}
function fdate(s){var d=new Date(s);return isNaN(d)?"?":d.toLocaleDateString("fr-FR")}
function thumb(u,w){
if(!u)return u;
if(/cdn\.shopify\.com|\/cdn\/shop\//.test(u)){
try{var o=new URL(u);o.searchParams.set("width",String(w||400));return o.toString()}catch(e){}
}
return u;
}
function recent(d,n){
if(!d)return false;
var t=new Date(d+"T00:00:00Z").getTime();
return (Date.now()-t)<=(n+1)*86400000;
}
function isDrop(x){return x.prec!=null&&x.prec>x.prix+0.01&&recent(x.chg,7)}
function brandOf(x){return (x.marque||"").trim()}
function bkey(x){return brandOf(x).toLowerCase()}
function nkey(x){return (x.nom||"").toLowerCase().replace(/[^a-z0-9]+/g,"")}
function savePrefs(){ls("prefs",{gen:GEN,cat:CAT,tri:$("tri").value})}
function loadPrefs(){
var p=ls("prefs");
if(!p)return;
if(["all","h","f"].indexOf(p.gen)>=0)GEN=p.gen;
if(["all","vet","chau","tee","acc"].indexOf(p.cat)>=0)CAT=p.cat;
if(["remise","prix","prixd"].indexOf(p.tri)>=0)$("tri").value=p.tri;
}
function pathOf(x){
var p=(x.lien||"").replace(/^https?:\/\/[^\/]+/,"");
try{p=decodeURIComponent(p)}catch(e){}
return p;
}
function catOf(x){
if(x._c)return x._c;
var cat=((x.cat||[]).join(" ")).toLowerCase();
var txt=((x.nom||"")+" "+pathOf(x).replace(/[-_\/.]/g," ")).toLowerCase();
var c;
if(/footwear|shoes|sneaker/.test(cat))c="chau";
else if(/accessor|headwear|\bbags?\b|socks|\bhats?\b/.test(cat))c="acc";
else if(/apparel|clothing/.test(cat))c=(TEE.test(cat)||TEE.test(txt))?"tee":"vet";
else if(TEE.test(txt))c="tee";
else if(ACC.test(txt))c="acc";
else if(SHOE.test(txt))c="chau";
else if(APP.test(txt))c="vet";
else if(SHOEB.test(txt))c="chau";
else c="vet";
x._c=c;return c;
}
function genOf(x){
if(x._g)return x._g;
var tg=((x.cat||[]).join(" ")).toLowerCase();
var nom=(x.nom||"").toLowerCase();
var txt=(nom+" "+pathOf(x).replace(/[-_\/.]/g," ")).toLowerCase();
var g=null;
var m=tg.match(/gender:\s*([a-z]+)/);
if(m){
var v=m[1];
if(/^(womens?|women|female|femme)/.test(v))g="f";
else if(/^(mens?|men|male|homme)/.test(v))g="h";
else if(/^unisex/.test(v))g="u";
else if(/^(kids?|boys?|girls?|junior|youth|infant)/.test(v))g="k";
}
if(!g){
if(/\b(kids?|enfants?|junior|infant|toddler|gs|ps|td)\b/.test(txt))g="k";
else if(/\b(wmns|wmn|womens?|women|femmes?|ladies|lady|ws)\b/.test(txt)||/(^|\s)w's\b/.test(txt)||/^w\s/.test(nom))g="f";
else if(/\b(mens?|hommes?)\b/.test(txt)||/(^|\s)m's\b/.test(txt))g="h";
else g="u";
}
x._g=g;return g;
}
function genOk(x){
if(GEN==="all")return true;
var g=genOf(x);
return g===GEN||g==="u";
}
function norm(s){
s=String(s).trim().toLowerCase().replace(/^(eu|fr)\s*/,"");
if(LM[s])return LM[s];
var m=s.match(/^(\d{2}(?:[.,]5)?)(?:\s*(1\/3|2\/3))?$/);
if(m)return m[1].replace(",",".")+(m[2]?" "+m[2]:"");
var u=s.match(/^(uk|us)\s*(\d{1,2}(?:\.5)?)$/);
if(u)return u[1].toUpperCase()+" "+u[2];
return null;
}
function getT(x){
if(!x._t){x._t=[];(x.tailles||[]).forEach(function(s){var n=norm(s);if(n&&x._t.indexOf(n)<0)x._t.push(n)})}
return x._t;
}
function val(t){var n=parseFloat(t.replace(/^[A-Z]+\s*/,""));if(t.indexOf("1/3")>=0)n+=.33;if(t.indexOf("2/3")>=0)n+=.67;return n}
function fill(id,label,arr){
var el=$(id);
if(!arr.length){el.style.display="none";el.innerHTML="";return}
el.style.display="";
el.innerHTML='<div class="lbl">'+label+'</div><div class="tabs">'+arr.map(function(t){return '<button class="chip sz'+(SZ[t]?" on":"")+'" data-s="'+t+'">'+t+'</button>'}).join("")+'</div>';
}
function buildSizes(){
var items=D.filter(function(x){return (CAT==="all"||catOf(x)===CAT)&&genOk(x)});
var all={};
items.forEach(function(x){getT(x).forEach(function(t){all[t]=1})});
var keys=Object.keys(all);
var lt=LET.filter(function(t){return all[t]});
var eu=keys.filter(function(t){return /^\d/.test(t)}).sort(function(a,b){return val(a)-val(b)});
var uk=keys.filter(function(t){return /^UK/.test(t)}).sort(function(a,b){return val(a)-val(b)});
var us=keys.filter(function(t){return /^US/.test(t)}).sort(function(a,b){return val(a)-val(b)});
var av={EU:eu,UK:uk,US:us};
if(!av[SYS].length){SYS=eu.length?"EU":uk.length?"UK":us.length?"US":"EU"}
fill("szLet","Tailles vêtements",CAT==="chau"?[]:lt);
var sys=["EU","UK","US"].filter(function(k){return av[k].length});
var se=$("szSys");
if(sys.length>1){
se.style.display="";
se.innerHTML='<div class="lbl">Système de pointures</div><div class="tabs">'+sys.map(function(k){return '<button class="chip sys'+(k===SYS?" on":"")+'" data-y="'+k+'">'+k+'</button>'}).join("")+'</div>';
}else{se.style.display="none";se.innerHTML=""}
fill("szNum",(CAT==="chau"?"Pointures":"Pointures / pantalons")+" ("+SYS+")",av[SYS]);
}
function buildBrands(){
var items=D.filter(function(x){return (CAT==="all"||catOf(x)===CAT)&&genOk(x)});
var c={},name={};
items.forEach(function(x){var k=bkey(x);if(!k)return;c[k]=(c[k]||0)+1;name[k]=brandOf(x)});
var ks=Object.keys(c).sort(function(a,b){return c[b]-c[a]}).slice(0,30);
var el=$("brands");
if(!ks.length){el.style.display="none";el.innerHTML="";return}
el.style.display="";
el.innerHTML='<div class="lbl">Marques</div><div class="tabs">'+ks.map(function(k){return '<button class="chip br'+(BR[k]?" on":"")+'" data-b="'+esc(k)+'">'+esc(name[k])+' ('+c[k]+')</button>'}).join("")+'</div>';
}
function buildDup(){
var g={};
D.forEach(function(x){var k=nkey(x);if(k.length<8)return;(g[k]=g[k]||[]).push(x)});
Object.keys(g).forEach(function(k){
var a=g[k];
var bs={};a.forEach(function(x){bs[x.boutique]=1});
if(Object.keys(bs).length<2)return;
var min=Math.min.apply(null,a.map(function(y){return y.prix}));
a.forEach(function(x){
x._alt=a.filter(function(y){return y.boutique!==x.boutique});
x._best=x.prix<=min;
});
});
}
function renderCats(){
$("cats").innerHTML=CATS.map(function(c){
return '<button class="chip cat'+(c[0]===CAT?" on":"")+'" data-c="'+c[0]+'">'+c[1]+(CNT[c[0]]!==undefined?" ("+CNT[c[0]]+")":"")+'</button>';
}).join("");
}
function renderGens(){
$("gens").innerHTML=GENS.map(function(g){
return '<button class="chip gen'+(g[0]===GEN?" on":"")+'" data-g="'+g[0]+'">'+g[1]+'</button>';
}).join("");
}
function updBtn(){
var n=0;
if($("boutique").value)n++;
if(+$("remise").value)n++;
if($("pmax").value)n++;
if(Object.keys(SZ).length)n++;
if(Object.keys(BR).length)n++;
if(onlyNew)n++;
if(onlyDrop)n++;
if($("tri").value!=="remise")n++;
$("fBtn").textContent="⚙ Filtres"+(n?" · "+n:"");
$("fBtn").className="fbtn"+($("panel").className.indexOf("open")>=0||n?" on":"");
}
function togglePanel(){
var p=$("panel");
p.className=p.className.indexOf("open")>=0?"panel":"panel open";
updBtn();
}
function closePanel(){
$("panel").className="panel";
updBtn();
window.scrollTo({top:0,behavior:"smooth"});
}
function showWarn(j){
var msgs=[];
var st=j.statut||{};
Object.keys(st).forEach(function(k){
if(st[k].ok===false)msgs.push(k+" n’a pas pu être mis à jour (données du "+fdate(st[k].depuis)+")");
});
var age=(Date.now()-new Date(j.maj).getTime())/3600000;
if(age>40){var jr=Math.floor(age/24);msgs.push("Données anciennes ("+jr+" jour"+(jr>1?"s":"")+") : la mise à jour automatique semble en panne")}
var w=$("warn");
if(msgs.length){w.style.display="";w.innerHTML="⚠ "+msgs.map(esc).join("<br>⚠ ")}
else{w.style.display="none"}
}

(function(){
var b=document.createElement("div");b.id="brands";
var sz=$("szLet");sz.parentNode.insertBefore(b,sz);
var drop=document.createElement("button");drop.className="chip";drop.id="cDrop";drop.textContent="↓ Baisses récentes";drop.onclick=toggleDrop;
var nb=$("cNew");nb.parentNode.insertBefore(drop,nb);
var w=document.createElement("div");w.id="warn";w.style.display="none";
var n=$("n");n.parentNode.insertBefore(w,n);
var s=document.createElement("div");s.id="sheet";
s.innerHTML='<div class="sh-bg"></div><div class="sh-body" id="shBody"></div>';
document.body.appendChild(s);
s.querySelector(".sh-bg").addEventListener("click",closeSheet);
s.addEventListener("click",function(e){
if(e.target.closest("#shFav")){
toggleFavL(cur);
var bt=$("shFav");if(bt)bt.textContent=FAV[cur]?"♥":"♡";
}else if(e.target.closest("#shShare")){shareCur()}
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&cur)closeSheet()});
})();

fetch("data/promos.json?"+Date.now()).then(function(r){return r.json()}).then(function(j){
D=j.items;
CNT={all:D.length,vet:0,chau:0,tee:0,acc:0};
D.forEach(function(x){M[x.lien]=x;CNT[catOf(x)]++});
buildDup();
FAV=ls("fav")||{};
var snap=ls("snap");
var links=D.map(function(x){return x.lien});
if(!snap){snap={maj:j.maj,links:links,prev:null};ls("snap",snap)}
else if(snap.maj!==j.maj){snap={maj:j.maj,links:links,prev:snap.links};ls("snap",snap)}
if(snap.prev){
hasNew=true;
var p={};snap.prev.forEach(function(l){p[l]=1});
D.forEach(function(x){if(!p[x.lien])NEWS[x.lien]=1});
}
var d=new Date(j.maj);
$("maj").textContent="Mis à jour le "+d.toLocaleDateString("fr-FR")+" à "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
var bs=[];D.forEach(function(x){if(bs.indexOf(x.boutique)<0)bs.push(x.boutique)});
bs.forEach(function(b){var o=document.createElement("option");o.value=b;o.textContent=b;$("boutique").appendChild(o)});
if(!hasNew)$("cNew").style.display="none";
showWarn(j);
loadPrefs();
renderGens();renderCats();buildSizes();buildBrands();favCount();apply();
}).catch(function(){$("maj").textContent="Données introuvables : connectez-vous ou lancez la tâche dans Actions."});

function favCount(){$("cFav").textContent="♥ "+Object.keys(FAV).length;$("cFav").className="fbtn"+(onlyFav?" on":"")}
function onSearch(){clearTimeout(tm);tm=setTimeout(apply,150)}
function apply(){updBtn();savePrefs();draw()}
function toggleFav2(){onlyFav=!onlyFav;favCount();apply()}
function toggleNew(){onlyNew=!onlyNew;$("cNew").className="chip"+(onlyNew?" on":"");apply()}
function toggleDrop(){onlyDrop=!onlyDrop;$("cDrop").className="chip"+(onlyDrop?" on":"");apply()}
function resetAll(){
$("q").value="";$("pmax").value="";
$("boutique").value="";$("remise").value="0";$("tri").value="remise";
SZ={};BR={};CAT="all";GEN="all";SYS="EU";onlyFav=false;onlyNew=false;onlyDrop=false;
$("cNew").className="chip";$("cDrop").className="chip";
renderGens();renderCats();buildSizes();buildBrands();favCount();apply();
}
$("gens").addEventListener("click",function(e){
var b=e.target.closest(".gen");
if(!b)return;
GEN=b.getAttribute("data-g");SZ={};BR={};
renderGens();buildSizes();buildBrands();apply();
});
$("cats").addEventListener("click",function(e){
var b=e.target.closest(".cat");
if(!b)return;
CAT=b.getAttribute("data-c");SZ={};BR={};
renderCats();buildSizes();buildBrands();apply();
});
$("panel").addEventListener("click",function(e){
var s=e.target.closest(".sz");
if(s){
var k=s.getAttribute("data-s");
if(SZ[k]){delete SZ[k];s.classList.remove("on")}else{SZ[k]=1;s.classList.add("on")}
apply();return;
}
var br=e.target.closest(".br");
if(br){
var bk=br.getAttribute("data-b");
if(BR[bk]){delete BR[bk];br.classList.remove("on")}else{BR[bk]=1;br.classList.add("on")}
apply();return;
}
var y=e.target.closest(".sys");
if(y){SYS=y.getAttribute("data-y");buildSizes();}
});
function tailleOk(x){
if(!Object.keys(SZ).length)return true;
return getT(x).some(function(t){return SZ[t]});
}
function draw(){
var q=$("q").value.toLowerCase().trim();
var b=$("boutique").value;
var r=+$("remise").value;
var pm=parseFloat($("pmax").value);
var tri=$("tri").value;
var hasBr=Object.keys(BR).length>0;
var base;
if(onlyFav){
base=Object.keys(FAV).map(function(l){return M[l]||Object.assign({},FAV[l],{gone:true})});
}else{base=D}
L=base.filter(function(x){
if(CAT!=="all"&&catOf(x)!==CAT)return false;
if(!genOk(x))return false;
if(onlyNew&&!NEWS[x.lien])return false;
if(onlyDrop&&!isDrop(x))return false;
if(hasBr&&!BR[bkey(x)])return false;
if(b&&x.boutique!==b)return false;
if(x.remise<r)return false;
if(!isNaN(pm)&&x.prix>pm)return false;
if(!tailleOk(x))return false;
if(q){
var txt=(x.marque+" "+x.nom+" "+x.boutique).toLowerCase();
return q.split(/\s+/).every(function(w){return txt.indexOf(w)>=0});
}
return true;
});
L.sort(function(a,c){
if(tri==="prix")return a.prix-c.prix;
if(tri==="prixd")return c.prix-a.prix;
return c.remise-a.remise;
});
render();
}
function cardHtml(x){
var fv=FAV[x.lien];
var tags="";
if(NEWS[x.lien])tags+='<span class="tag tn">NOUVEAU</span>';
if(x.gone)tags+='<span class="tag tg">PLUS EN PROMO</span>';
else{
if(isDrop(x))tags+='<span class="tag td">↓ −'+f(x.prec-x.prix)+'</span>';
if(fv&&fv.prix-x.prix>0.01)tags+='<span class="tag td">↓ −'+f(fv.prix-x.prix)+' depuis l’ajout</span>';
if(x._alt)tags+=x._best?'<span class="tag tb">MEILLEUR PRIX</span>':'<span class="tag tg">MOINS CHER AILLEURS</span>';
}
var img=x.image?'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(thumb(x.image))+'" data-o="'+esc(x.image)+'" alt="" onerror="if(this.dataset.o&&this.src!==this.dataset.o){this.src=this.dataset.o;this.dataset.o=\'\'}else{this.style.visibility=\'hidden\'}">':'<div class="ph"></div>';
var href=/^https?:\/\//.test(x.lien)?esc(x.lien):"#";
return '<div class="card'+(x.gone?" gone":"")+'" data-l="'+esc(x.lien)+'"><button class="fav'+(fv?" on":"")+'" data-l="'+esc(x.lien)+'" aria-label="Favori">'+(fv?"♥":"♡")+'</button><a href="'+href+'" target="_blank" rel="noopener">'+(x.gone?"":'<span class="pct">−'+x.remise+' %</span>')+img+'<div class="in"><div class="b">'+esc(x.marque)+' · '+esc(x.boutique)+'</div><div class="t">'+esc(x.nom)+'</div><div><span class="now">'+f(x.prix)+'</span><span class="old">'+f(x.ancien_prix)+'</span></div><div class="s">'+esc((x.tailles||[]).join(", "))+'</div>'+tags+'</div></a></div>';
}
function render(){
var shown=L.slice(0,PER);
shownN=shown.length;
var note="";
if(Object.keys(SZ).length)note=" · articles sans taille indiquée masqués";
if(onlyFav&&!L.length)note=" · touchez ♡ sur un article pour l’ajouter";
$("n").textContent=L.length+" article"+(L.length>1?"s":"")+note;
var sr=$("showRes");
if(sr)sr.textContent="Voir "+L.length+" résultat"+(L.length>1?"s":"");
$("g").innerHTML=shown.map(cardHtml).join("");
setMore();
}
function setMore(){
var rest=L.length-shownN;
$("moreWrap").innerHTML=rest>0?'<div id="sentinel" class="sentinel">Chargement…</div>':"";
watch();
}
function more(){
if(shownN>=L.length)return;
var next=L.slice(shownN,shownN+PER);
$("g").insertAdjacentHTML("beforeend",next.map(cardHtml).join(""));
shownN+=next.length;
setMore();
}
function watch(){
var s=$("sentinel");
if(!s)return;
if(!("IntersectionObserver" in window)){
s.outerHTML='<button class="more" onclick="more()">Voir plus</button>';
return;
}
if(!io)io=new IntersectionObserver(function(en){if(en[0].isIntersecting)more()},{rootMargin:"700px"});
io.disconnect();
io.observe(s);
}
function toggleFavL(l){
if(!l)return;
if(FAV[l]){delete FAV[l]}
else if(M[l]){FAV[l]=Object.assign({},M[l])}
ls("fav",FAV);favCount();
}
function syncFavs(){
Array.prototype.forEach.call(document.querySelectorAll("#g .fav"),function(b){
var on=!!FAV[b.getAttribute("data-l")];
b.className="fav"+(on?" on":"");
b.textContent=on?"♥":"♡";
});
}
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
if(x.prec!=null&&x.chg)hist='<div class="s">Prix précédent : '+f(x.prec)+' (changé le '+fdate(x.chg)+')</div>';
var img=x.image?'<img class="sh-img" referrerpolicy="no-referrer" src="'+esc(thumb(x.image,700))+'" alt="" onerror="this.style.display=\'none\'">':"";
$("shBody").innerHTML='<button class="sh-x" onclick="closeSheet()">✕</button>'+img+'<div class="b">'+esc(x.marque)+' · '+esc(x.boutique)+'</div><div class="sh-t">'+esc(x.nom)+'</div><div><span class="now big">'+f(x.prix)+'</span><span class="old">'+f(x.ancien_prix)+'</span><span class="pct2">−'+x.remise+' %</span></div>'+hist+(tl?'<div class="lbl">Tailles disponibles</div><div class="pills">'+tl+'</div>':'')+alt+'<div class="sh-act"><a class="go" href="'+esc(x.lien)+'" target="_blank" rel="noopener">Voir sur le site</a><button class="fbtn" id="shFav" aria-label="Favori">'+(FAV[l]?"♥":"♡")+'</button><button class="fbtn" id="shShare">Partager</button></div>';
$("shBody").scrollTop=0;
$("sheet").className="open";
document.body.style.overflow="hidden";
}
function closeSheet(){
$("sheet").className="";
document.body.style.overflow="";
cur=null;
if(onlyFav){var y=window.scrollY;draw();window.scrollTo(0,y)}
else syncFavs();
}
function shareCur(){
var x=M[cur]||FAV[cur];
if(!x)return;
var txt=x.nom+" — "+f(x.prix)+" (−"+x.remise+" %) chez "+x.boutique;
if(navigator.share){
navigator.share({title:x.nom,text:txt,url:x.lien}).catch(function(){});
}else if(navigator.clipboard){
navigator.clipboard.writeText(txt+" "+x.lien).then(function(){var b=$("shShare");if(b)b.textContent="Copié ✓"}).catch(function(){});
}
}
$("g").addEventListener("click",function(e){
var btn=e.target.closest(".fav");
if(btn){
var l=btn.getAttribute("data-l");
toggleFavL(l);
if(onlyFav){var y=window.scrollY;draw();window.scrollTo(0,y)}
else{btn.className="fav"+(FAV[l]?" on":"");btn.textContent=FAV[l]?"♥":"♡"}
return;
}
var a=e.target.closest(".card a");
if(a){
e.preventDefault();
var c=a.closest(".card");
openSheet(c.getAttribute("data-l"));
}
});
window.addEventListener("scroll",function(){$("top").style.display=window.scrollY>700?"block":"none"});
if("serviceWorker" in navigator){
window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
}
