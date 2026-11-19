var PER=48,D=[],M={},SZ_MAP={},FAV={},NEWS={},hasNew=false,L=[],onlyFav=false,onlyNew=false,onlyDrop=false,onlyTop=false,onlyRE=false,tm,SZ={},BR={},BRN={},CAT="all",GEN="all",SYS="EU",CNT={},shownN=0,cur=null,pickedSize="",io=null,dirty=false,dirtyF=false,hs=0,ign=false,raf=0,topOn=false,picking=false,MAJ="",DENS=2;
var BRLIST=[],BRNAME={},BRCNT={},BRQ="";
var PROF_KIND="haut",PROF_SYS="EU";
var RE_OK=["Laced Run"];
var CATS=[
  ["all","Tout","⚡"],
  ["vet","Vêtements","🧥"],
  ["chau","Chaussures","👟"],
  ["tee","T-shirts","👕"],
  ["sub","Sous-vêtements","🩲"],
  ["acc","Accessoires","🧢"]
];
var GENS=[["all","Tous"],["h","Homme"],["f","Femme"]];
var GL={h:"Homme",f:"Femme"},CL={vet:"Vêtements",chau:"Chaussures",tee:"T-shirts",sub:"Sous-vêtements",acc:"Accessoires"};
var LET=["XXS","XS","S","M","L","XL","XXL","XXXL"];
var TOP_SIZES=["XS","S","M","L","XL","XXL"];
var PANT_SIZES={
  EU:["34","36","38","40","42","44","46","48","50","52"],
  UK:["6","8","10","12","14","16","18","20"],
  US:["26","28","29","30","31","32","33","34","36","38","40"]
};
var SHOE_SIZES=["36","37","38","39","40","40.5","41","42","42.5","43","44","44.5","45","46","47"];
var LM={"xxs":"XXS","x-small":"XS","xs":"XS","extra small":"XS","small":"S","s":"S","medium":"M","m":"M","large":"L","l":"L","x-large":"XL","xl":"XL","extra large":"XL","xx-large":"XXL","xxl":"XXL","2xl":"XXL","xxx-large":"XXXL","xxxl":"XXXL","3xl":"XXXL"};
var SUB=/\b(boxers?|briefs?|thongs?|tanga|culottes?|caleçons?|calecons?|underwear|undies|lingerie|bras?|bralettes?|soutien[\s-]?gorges?|sous[\s-]?v[eê]tements?|panties)\b/;
var TEE=/\b(t[\s-]?shirts?|tees?|tshirts?)\b/;
var ACC=/\b(bags?|backpack|sacs?|tote|caps?|hats?|beanie|bonnet|casquette|bob|scarf|echarpe|écharpe|gloves?|gants?|socks?|chaussettes?|belt|ceinture|wallet|portefeuille|keyring|sunglasses|lunettes|watch|montre|bottle|towel|serviette|hip ?bag|pouch|trousse|lanyard|laces|lacets|cardholder|headband|bandana)\b/;
var SHOE=/\b(sneakers?|shoes?|boots?|sandals?|sandales?|slides?|clogs?|loafers?|trainers?|mules?|chaussures?|baskets?|footwear|air (max|force|jordan|liquid|rift|zoom|presto|vapormax)|jordan \d+|dunk|samba|gazelle|campus|superstar|stan smith|yeezy|ultraboost|chuck|old skool|sk8|authentic|slip[\s-]?on|runner|cortez|vomero|pegasus|clifton|bondi|speedcross|xt[\s]?6|gel[\s-]\w+|boston|arizona|birki|new balance \d)\b/;
var APP=/\b(hoodies?|hoody|sweats?|sweatshirts?|jackets?|vestes?|pants?|pantalons?|shorts?|jeans?|joggers?|cargos?|coats?|manteaux?|parkas?|fleeces?|shirts?|chemises?|polos?|dress|robes?|skirts?|jupes?|leggings?|tights|tops?|jumpers?|knits?|pulls?|cardigans?|vests?|gilets?|bombers?|windbreakers?|anoraks?|tracksuits?|crewnecks?|pullovers?|trousers?|denim|overshirts?|shackets?|swim|maillot|bodysuit|jersey|sweatpants?|chinos?|overalls?|dungarees?)\b/;
var SHOEB=/\b(birkenstock|crocs|vans|converse|hoka|salomon|asics|saucony|mizuno|dr\.? martens|clarks)\b/;

function ls(k,v){try{if(v===undefined){return JSON.parse(localStorage.getItem(k))}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function f(n){return Number(n).toFixed(2).replace(".",",")+" €"}
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
function cleanSearchStr(s){
return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
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
if(["remise","prix","prixd","pepite"].indexOf(p.tri)>=0)$("tri").value=p.tri;
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
if(!x._t){x._t=[];uniqueRawSizes(x).forEach(function(s){var n=norm(s)||s;if(x._t.indexOf(n)<0)x._t.push(n)})}
return x._t;
}
function uniqueRawSizes(x){
if(x._ur)return x._ur;
var seen={},out=[];
var extra=SZ_MAP[x.lien];
var src=(extra&&Array.isArray(extra.tailles)&&extra.tailles.length)?extra.tailles:(x.tailles||[]);
src.forEach(function(s){
var raw=String(s||"").trim();
if(!raw)return;
var valNorm=norm(raw)||raw.toUpperCase();
var key=valNorm.toUpperCase();
if(!seen[key]){seen[key]=1;out.push(valNorm)}
});
x._ur=out;
return out;
}
function sizePriceMap(x){
if(x._spm)return x._spm;
var map={};
var extra=SZ_MAP[x.lien];
if(extra&&extra.prix_par_taille&&typeof extra.prix_par_taille==="object"){
Object.keys(extra.prix_par_taille).forEach(function(k){
var nk=norm(k)||String(k).toUpperCase();
var pv=Number(extra.prix_par_taille[k]);
if(!isNaN(pv)&&pv>0)map[nk]=pv;
});
}
if(x.prix_par_taille&&typeof x.prix_par_taille==="object"){
Object.keys(x.prix_par_taille).forEach(function(k){
var nk=norm(k)||String(k).toUpperCase();
var pv=Number(x.prix_par_taille[k]);
if(!isNaN(pv)&&pv>0&&map[nk]==null)map[nk]=pv;
});
}
uniqueRawSizes(x).forEach(function(sz){
if(map[sz]==null&&typeof x.prix==="number"&&x.prix>0)map[sz]=x.prix;
});
x._spm=map;
return map;
}
function shoePriceBounds(x){
if(x._sb)return x._sb;
var nums=[];
function pushNum(v){var n=Number(v);if(!isNaN(n)&&n>0)nums.push(n)}
var extra=SZ_MAP[x.lien];
if(extra){pushNum(extra.prix_min);pushNum(extra.prix_max)}
var spm=sizePriceMap(x);
Object.keys(spm).forEach(function(k){pushNum(spm[k])});
pushNum(x.prix);pushNum(x.pmin);pushNum(x.pmax);
var min=nums.length?Math.min.apply(null,nums):Number(x.prix||0);
var max=nums.length?Math.max.apply(null,nums):Number(x.prix||0);
x._sb={min:min,max:max};
return x._sb;
}
function priceRangeLabel(x){
if(catOf(x)==="chau"){
var b=shoePriceBounds(x);
if(b.max>b.min+0.01)return f(b.min)+" – "+f(b.max);
return f(b.min);
}
return f(x.prix);
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
function renderQuickNav(){
var qn=$("quickNav");
if(!qn)return;
var gHtml=GENS.slice(1).map(function(g){
return '<button class="chip qgen'+(g[0]===GEN?" on":"")+'" data-g="'+g[0]+'">'+g[1]+'</button>';
}).join("");
var curShop=$("boutique").value;
var shops=[];
D.forEach(function(x){if(shops.indexOf(x.boutique)<0)shops.push(x.boutique)});
var sHtml=shops.map(function(b){
return '<button class="chip qshop'+(curShop===b?" on":"")+'" data-shop="'+esc(b)+'">'+esc(b)+'</button>';
}).join("");
qn.innerHTML=gHtml+'<span class="qsep"></span>'+sHtml;
}
function renderCats(){
$("cats").innerHTML=CATS.map(function(c){
var cnt=CNT[c[0]]!==undefined?CNT[c[0]]:0;
return '<button class="cat-btn'+(c[0]===CAT?" on":"")+'" data-c="'+c[0]+'"><span class="cat-ico">'+c[2]+'</span><span class="cat-name">'+c[1]+'</span><span class="cat-cnt">'+cnt+'</span></button>';
}).join("");
renderQuickNav();
}
function renderGens(){
$("gens").innerHTML=GENS.map(function(g){
return '<button class="chip gen'+(g[0]===GEN?" on":"")+'" data-g="'+g[0]+'">'+g[1]+'</button>';
}).join("");
$("gens").className="tabs tabs-h";
renderQuickNav();
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
function updHomeBtn(){
var hb=$("hBtn");
if(!hb)return;
var hasAct=actives().length>0||$("tri").value!=="remise";
hb.className="fbtn"+(hasAct?" on":"");
hb.title=hasAct?"Réinitialiser et revenir en haut":"Revenir en haut";
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
updHomeBtn();
}
function smartHome(){
if(sheetOpen())closeSheet();
if(drawerOpen())closePanel();
var hasAct=actives().length>0||$("tri").value!=="remise";
if(hasAct){
resetAll();
}
window.scrollTo({top:0,behavior:"smooth"});
}
function keepView(force){
var el=$("n");
if(!el)return;
var top=el.getBoundingClientRect().top+window.scrollY-$("bar").offsetHeight-6;
if(top<0)top=0;
if(force||window.scrollY>top)window.scrollTo(0,top);
}
function scrollToTopResults(){
try{localStorage.removeItem("view")}catch(e){}
var el=$("bar");
var target=el?Math.max(0,el.offsetTop-4):0;
window.scrollTo({top:target,behavior:"instant"});
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
renderProfileSection();
updBtn();
if(hs===0)pushO();
}
function hidePanel(forceTop){
$("drawer").className="";
document.body.style.overflow="";
updBtn();
if(dirty){
var fz=dirtyF||!!forceTop;
dirty=false;dirtyF=false;
render();
if(forceTop)scrollToTopResults();
else keepView(fz);
}else if(forceTop){
scrollToTopResults();
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

function updNewsAndFavBubble(){
var nb=$("newsBubble");
if(!nb)return;
var newCnt=Object.keys(NEWS).length;
var goneCnt=goneFavCount();
if(!newCnt&&!goneCnt){
nb.style.display="none";
nb.innerHTML="";
return;
}
var txt=[];
if(newCnt)txt.push("✨ <b>"+newCnt+"</b> nouveauté"+(newCnt>1?"s":""));
if(goneCnt)txt.push("💔 <b>"+goneCnt+"</b> favori"+(goneCnt>1?"s retirés":" retiré"));
var btns=[];
if(newCnt)btns.push('<button type="button" class="nb-btn" id="nbNew">Voir nouveautés</button>');
if(goneCnt)btns.push('<button type="button" class="nb-btn" id="nbGone">Voir favoris retirés</button>');
nb.style.display="flex";
nb.innerHTML='<div>'+txt.join(" · ")+'</div><div class="news-bubble-actions">'+btns.join("")+'</div>';
}

function getProfData(){
var p=ls("myProf2");
if(p&&typeof p==="object")return {haut:p.haut||"",bas:p.bas||"",chau:p.chau||""};
return {haut:"",bas:"",chau:""};
}

function renderProfileSection(){
var sec=$("profSec");
if(!sec)return;
var wasOpen=sec.open;
var saved=getProfData();
var list=PROF_KIND==="haut"?TOP_SIZES:(PROF_KIND==="bas"?PANT_SIZES[PROF_SYS]:SHOE_SIZES);
var activeVal=saved[PROF_KIND]||"";

var badges=[];
if(saved.haut)badges.push("Haut "+saved.haut);
if(saved.bas)badges.push("Bas "+saved.bas);
if(saved.chau)badges.push("Chaussures "+saved.chau);

var sysHtml="";
if(PROF_KIND==="bas"){
sysHtml='<div class="prof-sys-tabs">'+
["EU","UK","US"].map(function(sys){
return '<button type="button" class="chip'+(PROF_SYS===sys?" on":"")+'" data-psys="'+sys+'">'+sys+'</button>';
}).join("")+
'</div>';
}

sec.innerHTML='<summary><span>👤 Mon profil tailles'+(badges.length?' <i class="bdg">'+esc(badges.join(" · "))+'</i>':'')+'</span></summary>'+
'<div class="sec-body">'+
'<div class="prof-sub-tabs">'+
'<button type="button" class="chip'+(PROF_KIND==="haut"?" on":"")+'" data-pkind="haut">👕 Hauts</button>'+
'<button type="button" class="chip'+(PROF_KIND==="bas"?" on":"")+'" data-pkind="bas">👖 Bas</button>'+
'<button type="button" class="chip'+(PROF_KIND==="chau"?" on":"")+'" data-pkind="chau">👟 Chaussures</button>'+
'</div>'+
sysHtml+
'<div class="prof-presets">'+
list.map(function(v){
var fullVal=(PROF_KIND==="bas"&&PROF_SYS!=="EU")?(PROF_SYS+" "+v):v;
var isOn=(activeVal===fullVal||activeVal===v);
return '<button type="button" class="chip'+(isOn?" on":"")+'" data-pval="'+esc(fullVal)+'">'+esc(v)+'</button>';
}).join("")+
'</div>'+
(activeVal?'<div class="prow"><button type="button" class="chip" id="clearProf">Effacer ('+esc(activeVal)+')</button></div>':'')+
'</div>';
if(wasOpen)sec.open=true;
}

(function(){
var b=document.createElement("div");b.id="brands";
var sz=$("szLet");sz.parentNode.insertBefore(b,sz);
var w=document.createElement("div");w.id="warn";w.style.display="none";
var n=$("n");n.parentNode.insertBefore(w,n);

var profSec=document.createElement("details");
profSec.className="sec";
profSec.id="profSec";
var drawerPanel=$("panel");
drawerPanel.insertBefore(profSec,drawerPanel.firstChild);
renderProfileSection();

drawerPanel.addEventListener("click",function(e){
var pk=e.target.closest("[data-pkind]");
if(pk){PROF_KIND=pk.getAttribute("data-pkind");renderProfileSection();return}
var ps=e.target.closest("[data-psys]");
if(ps){PROF_SYS=ps.getAttribute("data-psys");renderProfileSection();return}
var pv=e.target.closest("[data-pval]");
if(pv){
var valP=pv.getAttribute("data-pval");
var prof=getProfData();
var same=(prof[PROF_KIND]===valP);
prof[PROF_KIND]=same?"":valP;
ls("myProf2",prof);
SZ={};
if(!same){
var normP=norm(valP)||valP;
SZ[normP]=1;
if(PROF_KIND==="chau")CAT="chau";
else if(CAT==="chau")CAT="vet";
}
buildSizes();renderCats();renderProfileSection();apply();
return;
}
if(e.target.closest("#clearProf")){
var prof=getProfData();
var prevVal=prof[PROF_KIND];
prof[PROF_KIND]="";
ls("myProf2",prof);
if(prevVal){
delete SZ[prevVal];
var np=norm(prevVal);
if(np)delete SZ[np];
}
buildSizes();renderProfileSection();apply();
}
});

var savedProf=getProfData();
if(savedProf.chau){var nc=norm(savedProf.chau)||savedProf.chau;SZ[nc]=1}
if(savedProf.haut){var nh=norm(savedProf.haut)||savedProf.haut;SZ[nh]=1}
if(savedProf.bas){var nb=norm(savedProf.bas)||savedProf.bas;SZ[nb]=1}

$("newsBubble").addEventListener("click",function(e){
if(e.target.closest("#nbNew")){onlyNew=true;onlyFav=false;syncChips();favCount();apply(true,true)}
if(e.target.closest("#nbGone")){onlyFav=true;onlyNew=false;syncChips();favCount();apply(true,true)}
});

var s=document.createElement("div");s.id="sheet";
s.innerHTML='<div class="sh-bg"></div><div class="sh-body" id="shBody"></div>';
document.body.appendChild(s);
s.querySelector(".sh-bg").addEventListener("click",closeSheet);
s.addEventListener("click",function(e){
var szBtn=e.target.closest(".sz-item");
if(szBtn){
var t=szBtn.getAttribute("data-sz");
pickedSize=(pickedSize===t)?"":t;
renderPickedSizePrice();
return;
}
if(e.target.closest("#shFav")){
toggleFavL(cur);
var bt=$("shFav");
if(bt){bt.textContent=FAV[cur]?"♥":"♡"}
return;
}
if(e.target.closest("#shShare")){shareCur();return}
var g=e.target.closest(".al-go");
if(g){
var A=ls("alerts")||[];
var a=A[+g.getAttribute("data-i")];
if(a){closeSheet();applyF(a.f)}
return;
}
var d=e.target.closest(".al-del");
if(d){
var B=ls("alerts")||[];
B.splice(+d.getAttribute("data-i"),1);
ls("alerts",B);
updBell();
openAlerts();
}
});
document.addEventListener("keydown",function(e){
if(e.key==="Escape"){if(sheetOpen())closeSheet();else if(drawerOpen())closePanel()}
});
})();

function setDens(d){
DENS=d;
ls("dens",d);
document.body.classList.toggle("dense",d===3);
Array.prototype.forEach.call(document.querySelectorAll(".dn"),function(b){
b.className="chip dn"+(+b.getAttribute("data-d")===d?" on":"");
});
}
(function(){
var dr=document.createElement("div");
dr.innerHTML='<div class="lbl" style="margin-top:4px">Affichage</div><div class="tabs"><button class="chip dn" data-d="2">▦ Normal</button><button class="chip dn" data-d="3">▩ Compact</button></div>';
var pn=$("panel");
pn.insertBefore(dr,pn.firstChild);
dr.addEventListener("click",function(e){
var b=e.target.closest(".dn");
if(b)setDens(+b.getAttribute("data-d"));
});
setDens(ls("dens")===3?3:2);
})();

$("g").innerHTML=Array(9).join('<div class="card sk"><div class="ph"></div><div class="in"><div class="skl"></div><div class="skl s2"></div></div></div>');

function sig(){return JSON.stringify([curF(),onlyFav,onlyNew,onlyDrop,onlyTop,$("tri").value])}
function saveView(){
if(!MAJ)return;
ls("view",{t:Date.now(),y:window.scrollY,n:shownN,s:sig(),m:MAJ});
}
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")saveView()});
window.addEventListener("pagehide",saveView);
function restoreView(){
var v=ls("view");
if(!v||Date.now()-v.t>1800000||v.m!==MAJ||v.s!==sig())return;
if(!(v.y>300))return;
var guard=0;
while(shownN<v.n&&shownN<L.length&&guard<60){more();guard++}
setTimeout(function(){window.scrollTo(0,v.y)},80);
}

function loadSizePrices(){
return fetch("data/prix_tailles.json?"+Date.now()).then(function(r){
if(!r.ok)return {};
return r.json();
}).then(function(j){
SZ_MAP={};
if(j&&j.by_link&&typeof j.by_link==="object"){
SZ_MAP=j.by_link;
}else if(j&&Array.isArray(j.articles)){
j.articles.forEach(function(a){if(a&&a.lien)SZ_MAP[a.lien]=a});
}
D.forEach(function(x){delete x._ur;delete x._spm;delete x._sb;delete x._t});
return SZ_MAP;
}).catch(function(){return {}});
}

function loadPromos(isAuto){
return fetch("data/promos.json?"+Date.now()).then(function(r){return r.json()}).then(function(j){
var changed=!MAJ||MAJ!==j.maj;
D=j.items||[];
MAJ=j.maj;
CNT={all:D.length,vet:0,chau:0,tee:0,sub:0,acc:0};
M={};
D.forEach(function(x){
M[x.lien]=x;
CNT[catOf(x)]++;
BRN[bkey(x)]=brandOf(x);
x._titleClean=cleanSearchStr((x.marque||"")+" "+(x.nom||""));
x._allClean=cleanSearchStr((x.marque||"")+" "+(x.nom||"")+" "+(x.boutique||"")+" "+((x.cat||[]).join(" ")));
});
return loadSizePrices().then(function(){
buildDup();
FAV=ls("fav")||{};
var snap=ls("snap");
var links=D.map(function(x){return x.lien});
if(!snap){snap={maj:j.maj,links:links,prev:null};ls("snap",snap)}
else if(snap.maj!==j.maj){snap={maj:j.maj,links:links,prev:snap.links};ls("snap",snap)}
NEWS={};
if(snap.prev){
hasNew=true;
var p={};snap.prev.forEach(function(l){p[l]=1});
D.forEach(function(x){if(!p[x.lien])NEWS[x.lien]=1});
}
var d=new Date(j.maj);
$("maj").textContent="Mis à jour le "+d.toLocaleDateString("fr-FR")+" à "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})+" · Auto 1h";
if(!isAuto){
var bs=[];D.forEach(function(x){if(bs.indexOf(x.boutique)<0)bs.push(x.boutique)});
bs.forEach(function(b){var o=document.createElement("option");o.value=b;o.textContent=b;$("boutique").appendChild(o)});
}
if(!hasNew)$("cNew").style.display="none";
showWarn(j);
updNewsAndFavBubble();
if(!isAuto)loadPrefs();
renderGens();renderCats();renderProfileSection();buildSizes();buildBrands();favCount();
if(changed||!isAuto)apply(true);
updBell();
if(!isAuto)restoreView();
});
});
}

loadPromos(false).catch(function(){
$("g").innerHTML="";
$("maj").textContent="Données introuvables : connectez-vous ou lancez la tâche dans Actions.";
});

setInterval(function(){
if(document.visibilityState==="visible"&&!drawerOpen()&&!sheetOpen()){
loadPromos(true).catch(function(){});
}
},3600000);

function favCount(){$("cFav").textContent="♥ "+Object.keys(FAV).length;$("cFav").className="fbtn"+(onlyFav?" on":"")}
function onSearch(){clearTimeout(tm);tm=setTimeout(function(){apply(true)},100)}
function apply(soft,forceTop){updBtn();savePrefs();draw(soft,forceTop)}
function toggleFav2(){onlyFav=!onlyFav;favCount();apply()}
function toggleNew(){onlyNew=!onlyNew;syncChips();apply()}
function toggleDrop(){onlyDrop=!onlyDrop;syncChips();apply()}
function toggleTop(){onlyTop=!onlyTop;syncChips();apply()}
function toggleRE(){onlyRE=!onlyRE;syncChips();apply()}

function resetAll(){
$("q").value="";$("pmax").value="";
$("boutique").value="";$("remise").value="0";$("tri").value="remise";
SZ={};BR={};CAT="all";GEN="all";SYS="EU";BRQ="";onlyFav=false;onlyNew=false;onlyDrop=false;onlyTop=false;onlyRE=false;
syncChips();
renderGens();renderCats();renderProfileSection();buildSizes();buildBrands();favCount();
if(drawerOpen()){
dirty=true;dirtyF=true;
updBtn();savePrefs();compute();updRes();
hidePanel(true);
popO();
}else{
apply(true,true);
scrollToTopResults();
}
}

$("quickNav").addEventListener("click",function(e){
var g=e.target.closest(".qgen");
if(g){
var valG=g.getAttribute("data-g");
GEN=(GEN===valG)?"all":valG;
pruneSZBR();renderGens();buildSizes();buildBrands();apply();
return;
}
var sh=e.target.closest(".qshop");
if(sh){
var valSh=sh.getAttribute("data-shop");
var curB=$("boutique").value;
$("boutique").value=(curB===valSh)?"":valSh;
renderQuickNav();
apply();
}
});

$("pills").addEventListener("click",function(e){
var p=e.target.closest(".pl2");
if(!p)return;
var k=p.getAttribute("data-k"),v=p.getAttribute("data-v");
if(k==="all"){resetAll();return}
if(k==="q")$("q").value="";
else if(k==="gen"){GEN="all";pruneSZBR();renderGens();buildSizes();buildBrands()}
else if(k==="cat"){CAT="all";pruneSZBR();renderCats();buildSizes();buildBrands()}
else if(k==="b")$("boutique").value="";
else if(k==="r")$("remise").value="0";
else if(k==="pm")$("pmax").value="";
else if(k==="sz"){delete SZ[v];buildSizes()}
else if(k==="br"){delete BR[v];buildBrands()}
else if(k==="re")onlyRE=false;
else if(k==="new")onlyNew=false;
else if(k==="drop")onlyDrop=false;
else if(k==="top")onlyTop=false;
else if(k==="fav"){onlyFav=false;favCount()}
syncChips();
apply();
});

$("gens").addEventListener("click",function(e){
var b=e.target.closest(".gen");
if(!b)return;
GEN=b.getAttribute("data-g");
pruneSZBR();
renderGens();buildSizes();buildBrands();apply();
});
$("cats").addEventListener("click",function(e){
var b=e.target.closest(".cat-btn");
if(!b)return;
CAT=b.getAttribute("data-c");
pruneSZBR();
renderCats();buildSizes();buildBrands();apply();
});
$("panel").addEventListener("click",function(e){
var s=e.target.closest(".sz");
if(s){
var k=s.getAttribute("data-s");
if(SZ[k]){delete SZ[k];s.classList.remove("on")}else{SZ[k]=1;s.classList.add("on")}
apply();return;
}
var br=e.target.closest(".brand-row");
if(br){
var bk=br.getAttribute("data-b");
if(BR[bk]){delete BR[bk]}else{BR[bk]=1}
renderBrandList();
apply();return;
}
var y=e.target.closest(".sys");
if(y){SYS=y.getAttribute("data-y");buildSizes();}
});
$("panel").addEventListener("input",function(e){
if(e.target.id==="brandSearch"){
BRQ=e.target.value;
renderBrandList();
}
});

function searchScore(x,rawQ){
var cq=cleanSearchStr(rawQ);
if(!cq)return 1;
var terms=cq.split(/\s+/).filter(Boolean);
var allStr=x._allClean||cleanSearchStr((x.marque||"")+" "+(x.nom||"")+" "+(x.boutique||""));
var titleStr=x._titleClean||cleanSearchStr((x.marque||"")+" "+(x.nom||""));

for(var i=0;i<terms.length;i++){
var t=terms[i];
if(allStr.indexOf(t)<0)return 0;
}

var score=1;
if(titleStr.indexOf(cq)>=0)score+=50;
terms.forEach(function(t){
if((" "+titleStr+" ").indexOf(" "+t+" ")>=0)score+=15;
else if(titleStr.indexOf(t)>=0)score+=8;
else score+=2;
});
return score;
}

function curF(){
var pm=parseFloat($("pmax").value);
return {q:$("q").value.trim(),gen:GEN,cat:CAT,b:$("boutique").value,r:+$("remise").value,pm:isNaN(pm)?null:pm,sz:Object.keys(SZ),br:Object.keys(BR),re:onlyRE};
}
function pass(x,F){
if(F.cat!=="all"&&catOf(x)!==F.cat)return false;
if(!genOkG(x,F.gen))return false;
if(F.b&&x.boutique!==F.b)return false;
if(x.remise<F.r)return false;
if(F.pm!=null){
var minP=(catOf(x)==="chau")?shoePriceBounds(x).min:x.prix;
if(minP>F.pm)return false;
}
if(F.re&&RE_OK.indexOf(x.boutique)<0)return false;
if(F.br.length&&F.br.indexOf(bkey(x))<0)return false;
if(F.sz.length){
var t=getT(x);
if(!F.sz.some(function(s){return t.indexOf(s)>=0}))return false;
}
if(F.q){
var sc=searchScore(x,F.q);
if(!sc)return false;
x._qScore=sc;
}else{
x._qScore=0;
}
return true;
}
function applyF(F){
$("q").value=F.q||"";
$("pmax").value=F.pm==null?"":F.pm;
$("boutique").value=F.b||"";
$("remise").value=String(F.r||0);
GEN=F.gen||"all";CAT=F.cat||"all";
SZ={};(F.sz||[]).forEach(function(s){SZ[s]=1});
BR={};(F.br||[]).forEach(function(b){BR[b]=1});
onlyRE=!!F.re;onlyFav=false;onlyNew=false;onlyDrop=false;onlyTop=false;
syncChips();
renderGens();renderCats();renderProfileSection();buildSizes();buildBrands();favCount();apply();
}
function compute(){
var F=curF();
var tri=$("tri").value;
var base=onlyFav?Object.keys(FAV).map(function(l){return M[l]||Object.assign({},FAV[l],{gone:true})}):D;
L=base.filter(function(x){
if(onlyNew&&!NEWS[x.lien])return false;
if(onlyDrop&&!isDrop(x))return false;
if(onlyTop&&x.inf)return false;
return pass(x,F);
});
L.sort(function(a,c){
if(F.q&&(c._qScore||0)!==(a._qScore||0)){
return (c._qScore||0)-(a._qScore||0);
}
if(tri==="pepite"){
return (c.remise*1.5-(c.prix/10))-(a.remise*1.5-(a.prix/10));
}
if(onlyTop)return c.remise-a.remise;
if(tri==="prix"){
var pa=(catOf(a)==="chau")?shoePriceBounds(a).min:a.prix;
var pc=(catOf(c)==="chau")?shoePriceBounds(c).min:c.prix;
return pa-pc;
}
if(tri==="prixd"){
var pa2=(catOf(a)==="chau")?shoePriceBounds(a).max:a.prix;
var pc2=(catOf(c)==="chau")?shoePriceBounds(c).max:c.prix;
return pc2-pa2;
}
return c.remise-a.remise;
});
if(onlyTop)L=L.slice(0,30);
}
function updRes(){
var sr=$("showRes");
if(sr)sr.textContent="Voir "+L.length+" résultat"+(L.length>1?"s":"");
}
function draw(soft,forceTop){
compute();
updRes();
if(drawerOpen()){
dirty=true;
if(!soft)dirtyF=true;
return;
}
render();
if(forceTop)scrollToTopResults();
else keepView(!soft);
}

function cardHtml(x){
var fv=FAV[x.lien];
var tags="";
if(NEWS[x.lien])tags+='<span class="tag tn">NOUVEAU</span>';
if(x.gone)tags+='<span class="tag tg">PLUS EN PROMO</span>';
else{
if(isDrop(x))tags+='<span class="tag td">↓ −'+f(x.prec-x.prix)+'</span>';
if(fv&&fv.prix-x.prix>0.01)tags+='<span class="tag td">↓ −'+f(fv.prix-x.prix)+'</span>';
if(x._alt)tags+=x._best?'<span class="tag tb">MEILLEUR PRIX</span>':'<span class="tag tg">MOINS CHER AILLEURS</span>';
if(x.inf)tags+='<span class="tag tg">PRIX BARRÉ ?</span>';
else if(catOf(x)!=="chau"&&x.pmin&&x.pmin<x.prix-0.5&&!isDrop(x))tags+='<span class="tag tg">DÉJÀ À '+f(x.pmin)+'</span>';
}
var uSizes=uniqueRawSizes(x);
var img=x.image?'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(thumb(x.image))+'" data-o="'+esc(x.image)+'" alt="" onerror="if(this.dataset.o&&this.src!==this.dataset.o){this.src=this.dataset.o;this.dataset.o=\'\'}else{this.style.visibility=\'hidden\'}">':'<div class="ph"></div>';
var href=/^https?:\/\//.test(x.lien)?esc(x.lien):"#";
return '<div class="card'+(x.gone?" gone":"")+'" data-l="'+esc(x.lien)+'"><button class="fav'+(fv?" on":"")+'" data-l="'+esc(x.lien)+'" aria-label="Favori">'+(fv?"♥":"♡")+'</button><a href="'+href+'" target="_blank" rel="noopener">'+(x.gone?"":'<span class="pct">−'+x.remise+' %</span>')+img+'<div class="in"><div class="b">'+esc(x.marque)+' · '+esc(x.boutique)+'</div><div class="t">'+esc(x.nom)+'</div><div><span class="now">'+priceRangeLabel(x)+'</span><span class="old">'+f(x.ancien_prix)+'</span></div><div class="s">'+esc(uSizes.join(", "))+'</div>'+tags+'</div></a></div>';
}

function render(){
var shown=L.slice(0,PER);
shownN=shown.length;
var parts=[];
if(GEN!=="all")parts.push(GL[GEN]);
if(CAT!=="all")parts.push(CL[CAT]);
if($("boutique").value)parts.push($("boutique").value);
if(Object.keys(BR).length)parts.push(Object.keys(BR).length+" marque"+(Object.keys(BR).length>1?"s":""));
if(onlyFav)parts.push("Favoris");
if(onlyNew)parts.push("Nouveautés");
if(onlyDrop)parts.push("Baisses");
if(onlyTop)parts.push("Top 30");
if(onlyRE)parts.push("La Réunion");
var note="";
if(Object.keys(SZ).length)note=" · articles sans taille indiquée masqués";
if(onlyFav&&!L.length)note=" · touchez ♡ sur un article pour l’ajouter";
$("n").textContent=L.length+" article"+(L.length>1?"s":"")+(parts.length?" · "+parts.join(" · "):"")+note;
updRes();
$("g").innerHTML=shown.map(function(x){return cardHtml(x)}).join("");
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
$("g").insertAdjacentHTML("beforeend",next.map(function(x){return cardHtml(x)}).join(""));
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
if(!io)io=new IntersectionObserver(function(en){if(en[0].isIntersecting)more()},{rootMargin:"1200px"});
io.disconnect();
io.observe(s);
}
function toggleFavL(l){
if(!l)return;
if(FAV[l]){delete FAV[l]}
else if(M[l]){FAV[l]=Object.assign({},M[l])}
ls("fav",FAV);favCount();updNewsAndFavBubble();
}
function syncFavs(){
Array.prototype.forEach.call(document.querySelectorAll("#g .fav"),function(b){
var on=!!FAV[b.getAttribute("data-l")];
b.className="fav"+(on?" on":"");
b.textContent=on?"♥":"♡";
});
}
function alertName(F){
var p=[];
if(F.q)p.push(F.q);
if(F.gen!=="all")p.push(GL[F.gen]);
if(F.cat!=="all")p.push(CL[F.cat]);
if(F.br.length)p.push(F.br.map(function(k){return BRN[k]||k}).join("/"));
if(F.sz.length)p.push("taille "+F.sz.join("/"));
if(F.b)p.push(F.b);
if(F.pm!=null)p.push("≤ "+F.pm+" €");
if(F.r)p.push("−"+F.r+" %+");
if(F.re)p.push("La Réunion");
return p.length?p.join(" · "):"Toutes les promos";
}
function updBell(){
var A=ls("alerts")||[];
var n=0;
A.forEach(function(a){
D.forEach(function(x){if((NEWS[x.lien]||isDrop(x))&&pass(x,a.f))n++});
});
$("cBell").textContent="🔔"+(n?" "+n:"");
$("cBell").className="fbtn"+(n?" on":"");
}
function saveAlert(){
var A=ls("alerts")||[];
var btn=$("cSave");
if(A.length>=10){if(btn)btn.textContent="10 alertes max";return}
var F=curF();
A.push({name:alertName(F),f:F});
ls("alerts",A);
updBell();
if(btn){
btn.textContent="Alerte enregistrée ✓";
setTimeout(function(){btn.textContent="🔔 Enregistrer cette recherche"},2000);
}
}
function openAlerts(){
var A=ls("alerts")||[];
var h='<button class="sh-x" onclick="closeSheet()">✕</button><div class="sh-t">🔔 Mes alertes</div>';
if(!A.length)h+='<div class="s">Aucune alerte enregistrée.</div>';
A.forEach(function(a,i){
var tot=0,nw=0;
D.forEach(function(x){if(pass(x,a.f)){tot++;if(NEWS[x.lien]||isDrop(x))nw++}});
h+='<div class="alrt"><div class="al-t">'+esc(a.name)+'</div><div class="s">'+tot+' article'+(tot>1?"s":"")+(nw?' · <b>'+nw+' nouveau'+(nw>1?"x":"")+' ou en baisse</b>':'')+'</div><div class="sh-act"><button class="go al-go" data-i="'+i+'">Voir</button><button class="fbtn al-del" data-i="'+i+'">Supprimer</button></div></div>';
});
cur=null;pickedSize="";
$("shBody").innerHTML=h;
$("shBody").scrollTop=0;
$("sheet").className="open";
document.body.style.overflow="hidden";
if(hs===0)pushO();
}

function renderPickedSizePrice(){
var x=M[cur]||FAV[cur];
var box=$("szPickBox");
Array.prototype.forEach.call(document.querySelectorAll("#shBody .sz-item"),function(el){
el.classList.toggle("on",el.getAttribute("data-sz")===pickedSize);
});
if(!box)return;
if(!x||!pickedSize){box.style.display="none";box.innerHTML="";return}
var spm=sizePriceMap(x);
var pr=spm[pickedSize];
var priceTxt=(typeof pr==="number"&&pr>0)?f(pr):priceRangeLabel(x);
box.style.display="";
box.innerHTML="Taille <b>"+esc(pickedSize)+"</b> · Prix site : <b>"+esc(priceTxt)+"</b>";
}

function openSheet(l){
var x=M[l]||FAV[l];
if(!x)return;
cur=l;
pickedSize="";
var uSizes=uniqueRawSizes(x);
var szHtml=uSizes.length?'<div class="lbl">Tailles disponibles</div><div class="sz-list">'+uSizes.map(function(t){return '<button type="button" class="sz-item" data-sz="'+esc(t)+'">'+esc(t)+'</button>'}).join("")+'</div><div id="szPickBox" class="sz-pick-price" style="display:none"></div>':'';
var alt="";
if(M[l]&&x._alt){
alt='<div class="lbl">Aussi chez</div>'+x._alt.map(function(y){return '<a class="altl" href="'+esc(y.lien)+'" target="_blank" rel="noopener"><span>'+esc(y.boutique)+'</span><b>'+f(y.prix)+'</b></a>'}).join("");
}
var small=thumb(x.image),big=thumb(x.image,700);
var img=x.image?'<img class="sh-img" id="shImg" referrerpolicy="no-referrer" src="'+esc(small)+'" alt="" onerror="this.style.visibility=\'hidden\'">':"";
$("shBody").innerHTML='<button class="sh-x" onclick="closeSheet()">✕</button>'+img+'<div class="b">'+esc(x.marque)+' · '+esc(x.boutique)+'</div><div class="sh-t">'+esc(x.nom)+'</div><div><span class="now big">'+priceRangeLabel(x)+'</span><span class="old">'+f(x.ancien_prix)+'</span><span class="pct2">−'+x.remise+' %</span></div>'+szHtml+alt+'<div class="sh-act"><a class="go" href="'+esc(x.lien)+'" target="_blank" rel="noopener">Voir sur le site</a><button class="fbtn" id="shFav" aria-label="Favori">'+(FAV[l]?"♥":"♡")+'</button><button class="fbtn" id="shShare">Partager</button></div>';
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

function hideSheet(){
$("sheet").className="";
document.body.style.overflow="";
cur=null;pickedSize="";
if(onlyFav){var y=window.scrollY;draw(true);window.scrollTo(0,y)}
else syncFavs();
}
function closeSheet(){
hideSheet();
popO();
}
function shareCur(){
var x=M[cur]||FAV[cur];
if(!x)return;
var txt=x.nom+" — "+priceRangeLabel(x)+" (−"+x.remise+" %) chez "+x.boutique;
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
if(onlyFav){var y=window.scrollY;draw(true);window.scrollTo(0,y)}
else{
btn.className="fav"+(FAV[l]?" on":"");
btn.textContent=FAV[l]?"♥":"♡";
}
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
},180);
}
});

window.addEventListener("scroll",function(){
if(raf)return;
raf=requestAnimationFrame(function(){
raf=0;
var s=window.scrollY>700;
if(s!==topOn){topOn=s;$("top").style.display=s?"block":"none"}
});
},{passive:true});

if("serviceWorker" in navigator){
window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
}
