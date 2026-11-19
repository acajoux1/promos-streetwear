var PER=48,D=[],M={},FAV={},NEWS={},hasNew=false,L=[],onlyFav=false,onlyNew=false,onlyDrop=false,onlyTop=false,onlyRE=false,onlyPepite=false,tm,SZ={},BR={},BRN={},CAT="all",GEN="all",SYS="EU",CNT={},shownN=0,cur=null,io=null,dirty=false,dirtyF=false,hs=0,ign=false,raf=0,topOn=false,picking=false,MAJ="",DENS=2;
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
if(!x._t){x._t=[];(x.tailles||[]).forEach(function(s){var n=norm(s);if(n&&x._t.indexOf(n)<0)x._t.push(n)})}
return x._t;
}
function uniqueRawSizes(x){
if(x._ur)return x._ur;
var seen={},out=[];
(x.tailles||[]).forEach(function(s){
var raw=String(s||"").trim();
if(!raw)return;
var key=(norm(raw)||raw).toUpperCase();
if(!seen[key]){
seen[key]=1;
out.push(norm(raw)||raw);
}
});
x._ur=out;
return out;
}
function priceDisplay(x){
if(catOf(x)==="chau"&&x.pmin&&x.pmin>0&&x.pmin<x.prix-0.01){
return f(x.pmin)+" – "+f(x.prix);
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
var cHtml=CATS.map(function(c){
return '<button class="chip qcat'+(c[0]===CAT?" on":"")+'" data-c="'+c[0]+'">'+c[2]+' '+c[1]+'</button>';
}).join("");
var curShop=$("boutique").value;
var shops=[];
D.forEach(function(x){if(shops.indexOf(x.boutique)<0)shops.push(x.boutique)});
var sHtml=shops.map(function(b){
return '<button class="chip qshop'+(curShop===b?" on":"")+'" data-shop="'+esc(b)+'">'+esc(b)+'</button>';
}).join("");
qn.innerHTML=gHtml+'<span class="qsep"></span>'+cHtml+'<span class="qsep"></span>'+sHtml;
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
function updGoneBanner(){
var el=$("goneBar");
if(!el)return;
var n=goneFavCount();
if(n>0){
el.style.display="";
el.innerHTML="⚠ "+n+" favori"+(n>1?"s ne sont":" n’est")+" plus en promo <button class=\"pl2\" id=\"goneGo\">Voir</button>";
}else{
el.style.display="none";
el.innerHTML="";
}
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
if(pk){
PROF_KIND=pk.getAttribute("data-pkind");
renderProfileSection();
return;
}
var ps=e.target.closest("[data-psys]");
if(ps){
PROF_SYS=ps.getAttribute("data-psys");
renderProfileSection();
return;
}
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
else if(PROF_KIND==="haut"&&CAT==="chau")CAT="vet";
else if(PROF_KIND==="bas"&&CAT==="chau")CAT="vet";
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

var gb=document.createElement("div");gb.id="goneBar";gb.style.display="none";gb.style.cssText="background:rgba(79,176,189,.14);border:1px solid rgba(79,176,189,.45);color:#d8f2f4;border-radius:8px;padding:8px 10px;font-size:12px;margin:0 0 8px;line-height:1.5;display:flex;align-items:center;justify-content:space-between;gap:8px";
w.parentNode.insertBefore(gb,n);
gb.addEventListener("click",function(e){
if(e.target.closest("#goneGo")){
onlyFav=true;favCount();apply();
}
});
var s=document.createElement("div");s.id="sheet";
s.innerHTML='<div class="sh-bg"></div><div class="sh-body" id="shBody"></div>';
document.body.appendChild(s);
s.querySelector(".sh-bg").addEventListener("click",closeSheet);
s.addEventListener("click",function(e){
if(e.target.closest("#shFav")){
toggleFavL(cur);
var bt=$("shFav");
if(bt){bt.textContent=FAV[cur]?"♥":"♡";bt.classList.add("pop");setTimeout(function(){bt.classList.remove("pop")},380)}
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

(function(){
var sb=$("shBody"),y0=0,dy=0,on=false;
sb.addEventListener("touchstart",function(e){
if(window.innerWidth>=900)return;
if(sb.scrollTop<=0){y0=e.touches[0].clientY;dy=0;on=true}else on=false;
},{passive:true});
sb.addEventListener("touchmove",function(e){
if(!on)return;
var d=e.touches[0].clientY-y0;
if(d>0&&sb.scrollTop<=0){
dy=d;
sb.style.transition="none";
sb.style.transform="translateY("+d+"px)";
if(e.cancelable)e.preventDefault();
}else if(d<=0&&dy===0){on=false}
},{passive:false});
sb.addEventListener("touchend",function(){
if(!on)return;
on=false;
if(dy>110){
sb.style.transition="transform .28s ease, opacity .28s ease";
sb.style.transform="translateY(100%)";
sb.style.opacity="0";
setTimeout(function(){closeSheet();sb.style.transition="";sb.style.transform="";sb.style.opacity=""},280);
}else{
sb.style.transition="";
sb.style.transform="";
sb.style.opacity="";
}
dy=0;
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

fetch("data/promos.json?"+Date.now()).then(function(r){return r.json()}).then(function(j){
D=j.items;
MAJ=j.maj;
CNT={all:D.length,vet:0,chau:0,tee:0,sub:0,acc:0};
D.forEach(function(x){M[x.lien]=x;CNT[catOf(x)]++;BRN[bkey(x)]=brandOf(x)});
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
updGoneBanner();
loadPrefs();
renderGens();renderCats();renderProfileSection();buildSizes();buildBrands();favCount();apply(true);
updBell();
restoreView();
}).catch(function(){$("g").innerHTML="";$("maj").textContent="Données introuvables : connectez-vous ou lancez la tâche dans Actions."});

function favCount(){$("cFav").textContent="♥ "+Object.keys(FAV).length;$("cFav").className="fbtn"+(onlyFav?" on":"")}
function onSearch(){clearTimeout(tm);tm=setTimeout(function(){apply(true)},120)}
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
var c=e.target.closest(".qcat");
if(c){
CAT=c.getAttribute("data-c");
pruneSZBR();renderCats();buildSizes();buildBrands();apply();
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
function curF(){
var pm=parseFloat($("pmax").value);
return {q:$("q").value.toLowerCase().trim(),gen:GEN,cat:CAT,b:$("boutique").value,r:+$("remise").value,pm:isNaN(pm)?null:pm,sz:Object.keys(SZ),br:Object.keys(BR),re:onlyRE};
}
function pass(x,F){
if(F.cat!=="all"&&catOf(x)!
