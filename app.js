var PER=60,D=[],M={},FAV={},NEWS={},hasNew=false,page=1,L=[],onlyFav=false,onlyNew=false,tm,SZ={},CAT="all",GEN="all",SYS="EU",CNT={};
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
function thumb(u){
if(!u)return u;
if(/cdn\.shopify\.com|\/cdn\/shop\//.test(u)){
try{var o=new URL(u);o.searchParams.set("width","400");return o.toString()}catch(e){}
}
return u;
}
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
if(onlyNew)n++;
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

fetch("data/promos.json?"+Date.now()).then(function(r){return r.json()}).then(function(j){
D=j.items;
CNT={all:D.length,vet:0,chau:0,tee:0,acc:0};
D.forEach(function(x){M[x.lien]=x;CNT[catOf(x)]++});
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
loadPrefs();
renderGens();renderCats();buildSizes();favCount();apply();
}).catch(function(){$("maj").textContent="Données introuvables : connectez-vous ou lancez la tâche dans Actions."});

function favCount(){$("cFav").textContent="♥ "+Object.keys(FAV).length;$("cFav").className="fbtn"+(onlyFav?" on":"")}
function onSearch(){clearTimeout(tm);tm=setTimeout(apply,150)}
function apply(){page=1;updBtn();savePrefs();draw()}
function toggleFav2(){onlyFav=!onlyFav;favCount();apply()}
function toggleNew(){onlyNew=!onlyNew;$("cNew").className="chip"+(onlyNew?" on":"");apply()}
function resetAll(){
$("q").value="";$("pmax").value="";
$("boutique").value="";$("remise").value="0";$("tri").value="remise";
SZ={};CAT="all";GEN="all";SYS="EU";onlyFav=false;onlyNew=false;
$("cNew").className="chip";
renderGens();renderCats();buildSizes();favCount();apply();
}
$("gens").addEventListener("click",function(e){
var b=e.target.closest(".gen");
if(!b)return;
GEN=b.getAttribute("data-g");SZ={};
renderGens();buildSizes();apply();
});
$("cats").addEventListener("click",function(e){
var b=e.target.closest(".cat");
if(!b)return;
CAT=b.getAttribute("data-c");SZ={};
renderCats();buildSizes();apply();
});
$("panel").addEventListener("click",function(e){
var s=e.target.closest(".sz");
if(s){
var k=s.getAttribute("data-s");
if(SZ[k]){delete SZ[k];s.classList.remove("on")}else{SZ[k]=1;s.classList.add("on")}
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
var base;
if(onlyFav){
base=Object.keys(FAV).map(function(l){return M[l]||Object.assign({},FAV[l],{gone:true})});
}else{base=D}
L=base.filter(function(x){
if(CAT!=="all"&&catOf(x)!==CAT)return false;
if(!genOk(x))return false;
if(onlyNew&&!NEWS[x.lien])return false;
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
else if(fv&&fv.prix-x.prix>0.01)tags+='<span class="tag td">↓ −'+f(fv.prix-x.prix)+'</span>';
var img=x.image?'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(thumb(x.image))+'" data-o="'+esc(x.image)+'" alt="" onerror="if(this.dataset.o&&this.src!==this.dataset.o){this.src=this.dataset.o;this.dataset.o=\'\'}else{this.style.visibility=\'hidden\'}">':'<div class="ph"></div>';
var href=/^https?:\/\//.test(x.lien)?esc(x.lien):"#";
return '<div class="card'+(x.gone?" gone":"")+'"><button class="fav'+(fv?" on":"")+'" data-l="'+esc(x.lien)+'" aria-label="Favori">'+(fv?"♥":"♡")+'</button><a href="'+href+'" target="_blank" rel="noopener">'+(x.gone?"":'<span class="pct">−'+x.remise+' %</span>')+img+'<div class="in"><div class="b">'+esc(x.marque)+' · '+esc(x.boutique)+'</div><div class="t">'+esc(x.nom)+'</div><div><span class="now">'+f(x.prix)+'</span><span class="old">'+f(x.ancien_prix)+'</span></div><div class="s">'+esc((x.tailles||[]).join(", "))+'</div>'+tags+'</div></a></div>';
}
function render(){
var shown=L.slice(0,page*PER);
var note="";
if(Object.keys(SZ).length)note=" · articles sans taille indiquée masqués";
if(onlyFav&&!L.length)note=" · touchez ♡ sur un article pour l’ajouter";
$("n").textContent=L.length+" article"+(L.length>1?"s":"")+note;
var sr=$("showRes");
if(sr)sr.textContent="Voir "+L.length+" résultat"+(L.length>1?"s":"");
$("g").innerHTML=shown.map(cardHtml).join("");
var rest=L.length-shown.length;
$("moreWrap").innerHTML=rest>0?'<button class="more" onclick="page++;render()">Voir plus ('+rest+' restants)</button>':"";
}
$("g").addEventListener("click",function(e){
var btn=e.target.closest(".fav");
if(!btn)return;
var l=btn.getAttribute("data-l");
if(FAV[l]){delete FAV[l]}
else if(M[l]){FAV[l]=Object.assign({},M[l])}
ls("fav",FAV);favCount();
if(onlyFav){var y=window.scrollY;draw();window.scrollTo(0,y)}
else{btn.className="fav"+(FAV[l]?" on":"");btn.textContent=FAV[l]?"♥":"♡"}
});
window.addEventListener("scroll",function(){$("top").style.display=window.scrollY>700?"block":"none"});
if("serviceWorker" in navigator){
window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
}
