var PER=48,D=[],M={},FAV={},NEWS={},hasNew=false,L=[],onlyFav=false,onlyNew=false,onlyDrop=false,onlyTop=false,onlyRE=false,tm,SZ={},BR={},BRN={},CAT="all",GEN="all",SYS="EU",CNT={},shownN=0,cur=null,io=null,dirty=false,dirtyF=false,hs=0,ign=false,raf=0,topOn=false,picking=false,MAJ="",DENS=2;
var BRLIST=[],BRNAME={},BRCNT={},BRQ="";
var RE_OK=["Laced Run"];
var CATS=[["all","Tout"],["vet","Vêtements"],["chau","Chaussures"],["tee","T-shirts"],["sub","Sous-vêtements"],["acc","Accessoires"]];
var GENS=[["all","Tous"],["h","Homme"],["f","Femme"]];
var GL={h:"Homme",f:"Femme"},CL={vet:"Vêtements",chau:"Chaussures",tee:"T-shirts",sub:"Sous-vêtements",acc:"Accessoires"};
var LET=["XXS","XS","S","M","L","XL","XXL","XXXL"];
var LM={"xxs":"XXS","x-small":"XS","xs":"XS","extra small":"XS","small":"S","s":"S","medium":"M","m":"M","large":"L","l":"L","x-large":"XL","xl":"XL","extra large":"XL","xx-large":"XXL","xxl":"XXL","2xl":"XXL","xxx-large":"XXXL","xxxl":"XXXL","3xl":"XXXL"};
var SUB=/\b(boxers?|briefs?|thongs?|tanga|culottes?|caleçons?|calecons?|underwear|undies|lingerie|bras?|bralettes?|soutien[\s-]?gorges?|sous[\s-]?v[eê]tements?|panties)\b/;
var TEE=/\b(t[\s-]?shirts?|tees?|tshirts?)\b/;
var ACC=/\b(bags?|backpack|sacs?|tote|caps?|hats?|beanie|bonnet|casquette|bob|scarf|echarpe|écharpe|gloves?|gants?|socks?|chaussettes?|belt|ceinture|wallet|portefeuille|keyring|sunglasses|lunettes|watch|montre|bottle|towel|servette|hip ?bag|pouch|trousse|lanyard|laces|lacets|cardholder|headband|bandana)\b/;
var SHOE=/\b(sneakers?|shoes?|boots?|sandals?|sandales?|slides?|clogs?|loafers?|trainers?|mules?|chaussures?|baskets?|footwear|air (max|force|jordan|liquid|rift|zoom|presto|vapormax)|jordan \d+|dunk|samba|gazelle|campus|superstar|stan smith|yeezy|ultraboost|chuck|old skool|sk8|authentic|slip[\s-]?on|runner|cortez|vomero|pegasus|clifton|bondi|speedcross|xt[\s-]?6|gel[\s-]\w+|boston|arizona|birki|new balance \d)\b/;
var APP=/\b(hoodies?|hoody|sweats?|sweatshirts?|jackets?|vestes?|pants?|pantalons?|shorts?|jeans?|joggers?|cargos?|coats?|manteaux?|parkas?|fleeces?|shirts?|chemises?|polos?|dress|robes?|skirts?|jupes?|leggings?|tights|tops?|jumpers?|knits?|pulls?|cardigans?|vests?|gilets?|bombers?|windbreakers?|anoraks?|tracksuits?|crewnecks?|pullovers?|trousers?|denim|overshirts?|shackets?|swim|maillot|bodysuit|jersey|sweatpants?|chinos?|overalls?|dungarees?)\b/;
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
function pathOf(x){
var p=(x.lien||"").replace(/^https?:\/\/[^\/]+/,"");
try{p=decodeURIComponent(p)}catch(e){}
return p;
}
function toks(x){
var s=(pathOf(x)+" "+(x.nom||"")).toLowerCase();
var m=s.match(/[a-z0-9]{6,}/g)||[];
var o=[];
m.forEach(function(t){if(/[a-z]/.test(t)&&/\d/.test(t)&&o.indexOf(t)<0)o.push(t)});
return o;
}
function savePrefs(){ls("prefs",{gen:GEN,cat:CAT,tri:$("tri").value})}
function loadPrefs(){
var p=ls("prefs");
if(!p)return;
if(["all","h","f"].indexOf(p.gen)>=0)GEN=p.gen;
if(["all","vet","chau","tee","sub","acc"].indexOf(p.cat)>=0)CAT=p.cat;
if(["remise","prix","prixd"].indexOf(p.tri)>=0)$("tri").value=p.tri;
}
function catOf(x){
if(x._c)return x._c;
var cat=((x.cat||[]).join(" ")).toLowerCase();
var txt=((x.nom||"")+" "+pathOf(x).replace(/[-_\/.]/g," ")).toLowerCase();
var c;
if(/underwear|lingerie|sous-v|boxers?|briefs?/.test(cat))c="sub";
else if(/footwear|shoes|sneaker/.test(cat))c="chau";
else if(/accessor|headwear|\bbags?\b|socks|\bhats?\b/.test(cat))c="acc";
else if(/apparel|clothing/.test(cat))c=SUB.test(txt)?"sub":((TEE.test(cat)||TEE.test(txt))?"tee":"vet");
else if(SUB.test(txt))c="sub";
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
function genOkG(x,g){
if(g==="all")return true;
var o=genOf(x);
return o===g||o==="u";
}
function genOk(x){return genOkG(x,GEN)}
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
el.innerHTML='<div class="lbl">'+label+'</div><div class="tabs tabs-h">'+arr.map(function(t){return '<button class="chip sz'+(SZ[t]?" on":"")+'" data-s="'+t+'">'+t+'</button>'}).join("")+'</div>';
}
function pruneSZBR(){
var items=D.filter(function(x){return (CAT==="all"||catOf(x)===CAT)&&genOk(x)});
var availSZ={},availBR={};
items.forEach(function(x){
getT(x).forEach(function(t){availSZ[t]=1});
var k=bkey(x);
if(k)availBR[k]=1;
});
Object.keys(SZ).forEach(function(k){if(!availSZ[k])delete SZ[k]});
Object.keys(BR).forEach(function(k){if(!availBR[k])delete BR[k]});
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
se.innerHTML='<div class="lbl">Système de pointures</div><div class="tabs tabs-h">'+sys.map(function(k){return '<button class="chip sys'+(k===SYS?" on":"")+'" data-y="'+k+'">'+k+'</button>'}).join("")+'</div>';
}else{se.style.display="none";se.innerHTML=""}
fill("szNum",(CAT==="chau"?"Pointures":"Pointures / pantalons")+" ("+SYS+")",av[SYS]);
}
function buildBrands(){
var items=D.filter(function(x){return (CAT==="all"||catOf(x)===CAT)&&genOk(x)});
var c={},name={};
items.forEach(function(x){var k=bkey(x);if(!k)return;c[k]=(c[k]||0)+1;name[k]=brandOf(x)});
var ks=Object.keys(c);
Object.keys(BR).forEach(function(k){if(ks.indexOf(k)<0&&c[k])ks.push(k)});
BRLIST=ks;BRNAME=name;BRCNT=c;
var el=$("brands");
if(!ks.length){el.style.display="none";el.innerHTML="";return}
el.style.display="";
el.innerHTML='<div class="lbl">Marques</div><input id="brandSearch" placeholder="Rechercher une marque…" value="'+esc(BRQ||"")+'"><div class="brand-list" id="brandList"></div>';
renderBrandList();
}
function renderBrandList(){
var box=$("brandList");
if(!box)return;
var q=(BRQ||"").toLowerCase().trim();
var ks=BRLIST.filter(function(k){return !q||k.indexOf(q)>=0});
ks=ks.slice().sort(function(a,b){
var sa=BR[a]?1:0,sb=BR[b]?1:0;
if(sa!==sb)return sb-sa;
return (BRCNT[b]||0)-(BRCNT[a]||0);
});
box.innerHTML=ks.length?ks.map(function(k){
return '<div class="brand-row'+(BR[k]?" on":"")+'" data-b="'+esc(k)+'"><span>'+esc(BRNAME[k]||k)+'</span><span class="cnt">'+(BRCNT[k]||0)+'</span></div>';
}).join(""):'<div class="s">Aucune marque trouvée</div>';
}
function buildDup(){
var T={},N={};
D.forEach(function(x){
x._k=toks(x);
x._k.forEach(function(t){(T[t]=T[t]||[]).push(x)});
var k=nkey(x);
if(k.length>=8)(N[k]=N[k]||[]).push(x);
});
D.forEach(function(x){
var seen={},alt=[];
function add(y){if(y!==x&&y.boutique!==x.boutique&&!seen[y.lien]){seen[y.lien]=1;alt.push(y)}}
x._k.forEach(function(t){(T[t]||[]).forEach(add)});
var k=nkey(x);
if(k.length>=8)(N[k]||[]).forEach(add);
if(alt.length){
x._alt=alt;
var min=Math.min.apply(null,alt.map(function(y){return y.prix}));
x._best=x.prix<=min;
}
});
}
function renderCats(){
$("cats").innerHTML=CATS.map(function(c){
return '<button class="chip cat'+(c[0]===CAT?" on":"")+'" data-c="'+c[0]+'">'+c[1]+(CNT[c[0]]!==undefined?" ("+CNT[c[0]]+")":"")+'</button>';
}).join("");
$("cats").className="tabs tabs-h";
}
function renderGens(){
$("gens").innerHTML=GENS.map(function(g){
return '<button class="chip gen'+(g[0]===GEN?" on":"")+'" data-g="'+g[0]+'">'+g[1]+'</button>';
}).join("");
$("gens").className="tabs tabs-h";
}
function syncChips(){
$("cNew").className="chip"+(onlyNew?" on":"");
$("cDrop").className="chip"+(onlyDrop?" on":"");
$("cTop").className="chip"+(onlyTop?" on":"");
$("cRE").className="chip"+(onlyRE?" on":"");
}
function setBd(id,n){var e=$(id);if(!e)return;e.textContent=n;e.style.display=n?"":"none"}
function actives(){
var a=[];
var q=$("q").value.trim();
if(q)a.push(["q","","“"+q+"”"]);
if(GEN!=="all")a.push(["gen","",GL[GEN]]);
if(CAT!=="all")a.push(["cat","",CL[CAT]]);
var b=$("boutique").value;if(b)a.push(["b","",b]);
var r=+$("remise").value;if(r)a.push(["r","","−"+r+" %+"]);
var pm=parseFloat($("pmax").value);if(!isNaN(pm))a.push(["pm","","≤ "+pm+" €"]);
Object.keys(SZ).forEach(function(s){a.push(["sz",s,s])});
Object.keys(BR).forEach(function(k){a.push(["br",k,BRN[k]||k])});
if(onlyRE)a.push(["re","","🇷🇪 Réunion"]);
if(onlyNew)a.push(["new","","Nouveautés"]);
if(onlyDrop)a.push(["drop","","Baisses"]);
if(onlyTop)a.push(["top","","Top 30"]);
if(onlyFav)a.push(["fav","","Favoris"]);
return a;
}
function renderPills(){
var a=actives(),el=$("pills");
if(!a.length){el.style.display="none";el.innerHTML="";return}
el.style.display="flex";
el.innerHTML='<button class="pl2 clr" data-k="all">✕ Tout effacer</button>'+a.map(function(p){return '<button class="pl2" data-k="'+p[0]+'" data-v="'+esc(p[1])+'">'+esc(p[2])+'</button>'}).join("");
}
function updBtn(){
var n=0;
if(GEN!=="all")n++;
if(CAT!=="all")n++;
if($("boutique").value)n++;
if(+$("remise").value)n++;
if($("pmax").value)n++;
if(Object.keys(SZ).length)n++;
if(Object.keys(BR).length)n++;
if(onlyNew)n++;
if(onlyDrop)n++;
if(onlyTop)n++;
if(onlyRE)n++;
if($("tri").value!=="remise")n++;
$("fBtn").textContent=n?"☰ "+n:"☰";
$("fBtn").className="fbtn"+(n?" on":"");
setBd("bd1",(GEN!=="all"?1:0)+(CAT!=="all"?1:0));
setBd("bd2",(onlyNew?1:0)+(onlyDrop?1:0)+(onlyTop?1:0)+(onlyRE?1:0));
setBd("bd3",($("boutique").value?1:0)+(+$("remise").value?1:0)+($("pmax").value?1:0)+($("tri").value!=="remise"?1:0));
setBd("bd4",Object.keys(SZ).length+Object.keys(BR).length);
renderPills();
}
function keepView(force){
var el=$("n");
if(!el)return;
var top=el.getBoundingClientRect().top+window.scrollY-$("bar").offsetHeight-6;
if(top<0)top=0;
if(force||window.scrollY>top)window.scrollTo(0,top);
}
function drawerOpen(){return $("drawer").className==="open"}
function sheetOpen(){return $("sheet").className==="open"}
function pushO(){try{history.pushState({o:1},"");hs=1}catch(e){}}
function popO(){
if(hs>0){
hs=0;ign=true;
try{history.back()}catch(e){ign=false}
setTimeout(function(){ign=false},600);
}
}
window.addEventListener("popstate",function(){
if(ign){ign=false;return}
hs=0;
if(sheetOpen())hideSheet();
else if(drawerOpen())hidePanel();
});
function togglePanel(){
$("drawer").className="open";
document.body.style.overflow="hidden";
$("panel").scrollTop=0;
updBtn();
if(hs===0)pushO();
}
function hidePanel(){
$("drawer").className="";
document.body.style.overflow="";
updBtn();
if(dirty){
var fz=dirtyF;
dirty=false;dirtyF=false;
render();
keepView(fz);
}
}
function closePanel(){
hidePanel();
popO();
}
function openAlertsFromPanel(){hidePanel();openAlerts()}
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
function goneFavCount(){
var n=0;
Object.keys(FAV).forEach(function(l){if(!M[l])n++});
return n;
}
function updGoneBanner(){
var el=$("goneBar");
if(!el)return;
var n=goneFavCount();
if(n>0){
el.style.display="";
el.innerHTML="⚠ "+n+" favori"+(n>1?"s ne sont":" n’est")+" plus en promo <button class=\"pl2\" id=\"goneGo\">Voir</button>";
}else{
el.style.display="