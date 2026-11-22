var PER=48,D=[],M={},SZ_MAP={},FAV={},NEWS={},hasNew=false,L=[],onlyFav=false,onlyNew=false,onlyDrop=false,onlyTop=false,onlyRE=false,tm,SZ={},BR={},BRN={},CAT="all",GEN="all",SYS="EU",CNT={},shownN=0,cur=null,pickedSize="",io=null,dirty=false,dirtyF=false,hs=0,ign=false,raf=0,topOn=false,picking=false,MAJ="",PROFIL_FILTER=false,onlyVisite=false,RELAX=false;
var PRIX_VISITE=null,VISITE_T=0,BAISSES={};
var IDX={},HIST={},HIST_LOAD=null,DETAIL_P=null,DETAIL_LOADED=false,DEDUP=true;
var BRLIST=[],BRNAME={},BRCNT={},BRQ="";
var PROF_KIND="haut",PROF_SYS="EU";
var RE_OK=["Laced Run"];
var CATS=[
  ["all","Tout",""],
  ["vet","Vêtements",""],
  ["chau","Chaussures",""],
  ["tee","T-shirts",""],
  ["sub","Sous-vêtements",""],
  ["acc","Accessoires",""]
];
var CL={vet:"Vêtements",chau:"Chaussures",tee:"T-shirts",sub:"Sous-vêtements",acc:"Accessoires"};
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
var COND=/(recond|refurb|neuf|new|occasion|used|seconde)/i;
var GEN_NAMES={femme:"Femme",homme:"Homme",mixte:"Unisexe"};
var GEN_F=/\b(women'?s?|womans?|wmns|femmes?|ladies|for women)\b|\b(bralettes?|panties|thongs?)\b/i;
var GEN_H=/\b(men'?s?|hommes?|for men)\b|\b(boxer briefs?|jockstraps?)\b/i;
var GEN_W=/(?:^|[\s(])W['’](?=\s|$)|(?:^|[\s(])W(?=\s)/;
var GEN_PF=/(?:^|[-/])(femmes?|women|womens|wmns|girls?)(?=[-/]|$)/i;
var GEN_PH=/(?:^|[-/])(hommes?|men|mens|boys?)(?=[-/]|$)/i;

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
function savePrefs(){ls("prefs",{cat:CAT,gen:GEN,tri:$("tri").value,sz:Object.keys(SZ),br:Object.keys(BR),b:$("boutique").value,r:+$("remise").value,pm:$("pmax").value,re:onlyRE,new:onlyNew,drop:onlyDrop,top:onlyTop,dup:DEDUP})}
function loadPrefs(){
var p=ls("prefs");
if(!p)return;
if(["all","vet","chau","tee","sub","acc"].indexOf(p.cat)>=0)CAT=p.cat;
if(["all","femme","homme","mixte"].indexOf(p.gen)>=0)GEN=p.gen;
if(["remise","prix","prixd","pepite"].indexOf(p.tri)>=0)$("tri").value=p.tri;
(p.sz||[]).forEach(function(s){SZ[s]=1});
(p.br||[]).forEach(function(b){BR[b]=1});
if(typeof p.b==="string")$("boutique").value=p.b;
if(p.r)$("remise").value=String(p.r);
if(p.pm!==undefined&&p.pm!==null)$("pmax").value=p.pm;
onlyRE=!!p.re;onlyNew=!!p.new;onlyDrop=!!p.drop;onlyTop=!!p.top;
if(typeof p.dup==="boolean")DEDUP=p.dup;
syncChips();
}
/* Genre : l'étiquette de la boutique fait foi, sinon son rayon (URL), sinon
   le titre. Aucun signal explicite : l'article reste avec les unisexes, plutôt
   que d'être rangé d'office dans un genre inventé. */
function genOf(x){
if(x._g)return x._g;
var tags=((x.cat||[]).join(" ")).toLowerCase();
var f=/gender:(womens?|woman|women|femme)/.test(tags);
var m=/gender:(mens?|man|men|homme)/.test(tags);
var g;
if(f&&m)g="mixte";
else if(f)g="femme";
else if(m)g="homme";
else if(/gender:(unisex|kids|enfant)/.test(tags))g="mixte";
else{
var s=x.nom||"";
var p=pathOf(x);
var fs=GEN_F.test(s)||GEN_W.test(s)||GEN_PF.test(p);
var ms=GEN_H.test(s)||GEN_PH.test(p);
if(fs&&ms)g="mixte";
else if(fs)g="femme";
else if(ms)g="homme";
else g="mixte";
}
x._g=g;return g;
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
function splitSizeLabel(raw){
var s=String(raw||"").trim();
if(s.indexOf("/")<0)return {taille:s,etat:""};
var parts=s.split("/").map(function(p){return p.trim()}).filter(Boolean);
for(var i=1;i<parts.length;i++){
if(COND.test(parts[i]))return {taille:parts.slice(0,i).join("/"),etat:normCond(parts[i])};
}
return {taille:s,etat:""};
}
function normCond(v){
var s=String(v).toLowerCase();
if(/recond|refurb/.test(s))return "Reconditionné";
if(/neuf|new/.test(s))return "Neuf";
if(/occasion|used|seconde/.test(s))return "Occasion";
return String(v);
}
function norm(s){
s=String(s).trim();
var sp=splitSizeLabel(s);
if(sp.etat)s=sp.taille;
s=s.toLowerCase().replace(/^(eu|fr)\s*/,"");
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
var idx=IDX[x.lien];
var src=(extra&&Array.isArray(extra.tailles)&&extra.tailles.length)?extra.tailles:((idx&&Array.isArray(idx.t)&&idx.t.length)?idx.t:(x.tailles||[]));
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
function sizeOfferList(x){
if(x._sol)return x._sol;
var by={};
function add(libelle,prix,ancien){
var pv=Number(prix);
if(!(pv>0))return false;
var sp=splitSizeLabel(libelle);
var key=norm(sp.taille)||String(sp.taille||"").toUpperCase();
if(!key)return false;
var list=by[key]||(by[key]=[]);
for(var i=0;i<list.length;i++)if(Math.abs(list[i].prix-pv)<0.01&&list[i].etat===sp.etat)return false;
var an=Number(ancien);
list.push({prix:pv,ancien:(an>pv?an:null),etat:sp.etat});
return true;
}
var extra=SZ_MAP[x.lien];
var got=0;
if(extra&&Array.isArray(extra.variantes)&&extra.variantes.length){
extra.variantes.forEach(function(v){if(v&&v.disponible!==false&&add(v.taille,v.prix,v.ancien_prix))got++});
}
if(!got&&extra&&extra.prix_par_taille&&typeof extra.prix_par_taille==="object"){
Object.keys(extra.prix_par_taille).forEach(function(k){if(add(k,extra.prix_par_taille[k],null))got++});
}
if(!got&&x.prix_par_taille&&typeof x.prix_par_taille==="object"){
Object.keys(x.prix_par_taille).forEach(function(k){add(k,x.prix_par_taille[k],null)});
}
if(!got&&IDX[x.lien]&&IDX[x.lien].p&&typeof IDX[x.lien].p==="object"){
Object.keys(IDX[x.lien].p).forEach(function(k){add(k,IDX[x.lien].p[k],null)});
}
Object.keys(by).forEach(function(k){by[k].sort(function(a,b){return a.prix-b.prix})});
x._sol=by;
return by;
}
function sizePriceMap(x){
if(x._spm)return x._spm;
var map={};
var by=sizeOfferList(x);
Object.keys(by).forEach(function(k){if(by[k].length)map[k]=by[k][0].prix});
uniqueRawSizes(x).forEach(function(sz){
if(map[sz]==null&&typeof x.prix==="number"&&x.prix>0)map[sz]=x.prix;
});
x._spm=map;
return map;
}
function allSizes(x){
var seen={},out=[];
uniqueRawSizes(x).forEach(function(t){if(!seen[t]){seen[t]=1;out.push(t)}});
Object.keys(sizeOfferList(x)).forEach(function(t){if(!seen[t]){seen[t]=1;out.push(t)}});
epuisees(x).forEach(function(t){if(!seen[t]){seen[t]=1;out.push(t)}});
return out.sort(function(a,b){
var na=val(a),nb=val(b);
var fa=isNaN(na),fb=isNaN(nb);
if(fa!==fb)return fa?1:-1;
if(!fa)return na-nb;
var ia=LET.indexOf(String(a).toUpperCase()),ib=LET.indexOf(String(b).toUpperCase());
if(ia>=0&&ib>=0)return ia-ib;
return String(a).localeCompare(String(b));
});
}
function shoePriceBounds(x){
if(x._sb)return x._sb;
var idx=IDX[x.lien];
if(idx&&typeof idx.min==="number"&&typeof idx.max==="number"&&idx.min>0){
x._sb={min:idx.min,max:idx.max};
return x._sb;
}
var min=0,max=0,has=false;
var by=sizeOfferList(x);
Object.keys(by).forEach(function(k){
var list=by[k];
if(!list||!list.length)return;
var lo=list[0].prix,hi=list[list.length-1].prix;
if(!(lo>0)||!(hi>0))return;
if(!has){min=lo;max=hi;has=true;return}
if(lo<min)min=lo;
if(hi>max)max=hi;
});
if(!has){
var p=Number(x.prix);
min=(p>0?p:0);
max=min;
}
x._sb={min:min,max:max};
return x._sb;
}
function priceRangeLabel(x){
var b=shoePriceBounds(x);
if(b.max>b.min+0.01)return f(b.min)+" – "+f(b.max);
return f(b.min);
}
function val(t){var n=parseFloat(t.replace(/^[A-Z]+\s*/,""));if(t.indexOf("1/3")>=0)n+=.33;if(t.indexOf("2/3")>=0)n+=.67;return n}
function fill(id,label,arr){
var el=$(id);
if(!arr.length){el.style.display="none";el.innerHTML="";return}
el.style.display="";
el.innerHTML='<div class="lbl">'+label+'</div><div class="tabs tabs-h">'+arr.map(function(t){return '<button class="chip sz'+(SZ[t]?" on":"")+'" data-s="'+t+'">'+t+'</button>'}).join("")+'</div>';
}
function pruneSZBR(){
var items=D.filter(function(x){return CAT==="all"||catOf(x)===CAT});
var availSZ={},availBR={};
items.forEach(function(x){
getT(x).forEach(function(t){availSZ[t]=1});
var k=bkey(x);
if(k)availBR[k]=1;
});
Object.keys(SZ).forEach(function(k){if(!availSZ[k])delete SZ[k]});
Object.keys(BR).forEach(function(k){if(!availBR[k])delete BR[k]});
syncProfFilter();
}
function profSizes(){
var p=getProfData(),out=[];
["haut","bas","chau"].forEach(function(k){
if(!p[k])return;
var n=norm(p[k])||p[k];
if(n&&out.indexOf(n)<0)out.push(n);
});
return out;
}
// Les trois tailles du profil restent filtrées même après un changement de catégorie.
function syncProfFilter(){
if(!PROFIL_FILTER)return;
var list=profSizes();
SZ={};
list.forEach(function(s){SZ[s]=1});
}
function buildSizes(){
var items=D.filter(function(x){return CAT==="all"||catOf(x)===CAT});
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
var items=D.filter(function(x){return CAT==="all"||catOf(x)===CAT});
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
var G={};
D.forEach(function(x){
x._gid="";
var k=nkey(x);
if(k.length>=12&&bkey(x))(G[bkey(x)+"|"+k]=G[bkey(x)+"|"+k]||[]).push(x);
});
Object.keys(G).forEach(function(k){
var grp=G[k];
if(grp.length<2)return;
var shops={};
grp.forEach(function(y){shops[y.boutique]=1});
if(Object.keys(shops).length<2)return;
var min=Math.min.apply(null,grp.map(function(y){return shoePriceBounds(y).min}));
grp.forEach(function(y){y._gid=k;y._grpN=Object.keys(shops).length;y._grpMin=min});
});
}
function renderCats(){
$("cats").innerHTML=CATS.map(function(c){
return '<button class="chip catb'+(c[0]===CAT?" on":"")+'" data-c="'+c[0]+'">'+c[1]+'</button>';
}).join("");
renderGens();
}
function renderGens(){
var el=$("gens");
if(!el)return;
var cnt={all:0,femme:0,homme:0,mixte:0};
D.forEach(function(x){
if(CAT!=="all"&&catOf(x)!==CAT)return;
cnt.all++;cnt[genOf(x)]++;
});
el.innerHTML=[["all","Tout"],["femme","Femme"],["homme","Homme"],["mixte","Unisexe"]].map(function(g){
return '<button class="chip genb'+(GEN===g[0]?" on":"")+'" data-g="'+g[0]+'">'+g[1]+'<span class="gcnt">'+cnt[g[0]]+'</span></button>';
}).join("");
}
function syncChips(){
var cv=$("cVisite");
if(cv)cv.className="chip"+(onlyVisite?" on":"");
$("cNew").className="chip"+(onlyNew?" on":"");
$("cDrop").className="chip"+(onlyDrop?" on":"");
$("cTop").className="chip"+(onlyTop?" on":"");
$("cRE").className="chip"+(onlyRE?" on":"");
var cd=$("cDup");
if(cd)cd.className="chip"+(DEDUP?" on":"");
}
function toggleDup(){DEDUP=!DEDUP;syncChips();apply()}
function setBd(id,n){var e=$(id);if(!e)return;e.textContent=n;e.style.display=n?"":"none"}
function actives(){
var a=[];
var q=$("q").value.trim();
if(q)a.push(["q","","“"+q+"”"]);
if(CAT!=="all")a.push(["cat","",CL[CAT]]);
if(GEN!=="all")a.push(["gen","",GEN_NAMES[GEN]]);
var b=$("boutique").value;if(b)a.push(["b","",b]);
var r=+$("remise").value;if(r)a.push(["r","","−"+r+" %+"]);
var pm=parseFloat($("pmax").value);if(!isNaN(pm))a.push(["pm","","≤ "+pm+" €"]);
Object.keys(SZ).forEach(function(s){a.push(["sz",s,s])});
Object.keys(BR).forEach(function(k){a.push(["br",k,BRN[k]||k])});
if(onlyRE)a.push(["re","","🇷🇪 Réunion"]);
if(onlyNew)a.push(["new","","Nouveautés"]);
if(onlyDrop)a.push(["drop","","Baisses"]);
if(onlyTop)a.push(["top","","Top 30"]);
if(onlyVisite)a.push(["vis","","Baissé depuis votre visite"]);
if(onlyFav)a.push(["fav","","Favoris"]);
if(PROFIL_FILTER)a.push(["prof","","Profil tailles"]);
return a;
}
function updShopTab(){
var b=$("bName"),sel=$("boutique"),tab=$("bBtn");
if(!b||!sel||!tab)return;
b.textContent=sel.value||"Toutes";
tab.className="shop-tab"+(sel.value?" on":"");
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
hb.className="sqbtn"+(hasAct?" on":"");
hb.title=hasAct?"Réinitialiser et revenir en haut":"Revenir en haut";
}
function updBtn(){
var n=0;
if(CAT!=="all")n++;
if(GEN!=="all")n++;
if($("boutique").value)n++;
if(+$("remise").value)n++;
if($("pmax").value)n++;
if(Object.keys(SZ).length)n++;
if(Object.keys(BR).length)n++;
if(onlyNew)n++;
if(onlyDrop)n++;
if(onlyTop)n++;
if(onlyRE)n++;
if(onlyVisite)n++;
if($("tri").value!=="remise")n++;
var fb=$("fBtn");
if(fb)fb.innerHTML="≡"+(n?'<b class="n">'+n+"</b>":"");
if(fb)fb.className="sqbtn"+(n?" on":"");
setBd("bd1",(CAT!=="all"?1:0)+(GEN!=="all"?1:0)+(onlyNew?1:0)+(onlyDrop?1:0)+(onlyTop?1:0)+(onlyRE?1:0)+(onlyVisite?1:0));
setBd("bd2",($("boutique").value?1:0)+(+$("remise").value?1:0)+($("pmax").value?1:0)+($("tri").value!=="remise"?1:0));
setBd("bd3",Object.keys(SZ).length+Object.keys(BR).length+(PROFIL_FILTER?1:0));
var pn=$("pmNote");
if(pn){var sk=Object.keys(SZ);pn.textContent=sk.length===1?"Prix de la taille "+sk[0]+" uniquement":""}
updShopTab();
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
// Ouvre la fiche : le focus part sur le bouton de fermeture, toujours visible.
function showSheet(label){
rememberFocus();
var s=$("sheet");
s.setAttribute("role","dialog");
s.setAttribute("aria-modal","true");
s.setAttribute("aria-label",label||"Fenêtre");
s.className="open";
document.body.style.overflow="hidden";
var bx=$("shClose");
if(bx&&bx.focus){try{bx.focus({preventScroll:true})}catch(e){}}
if(hs===0)pushO();
}
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
rememberFocus();
$("drawer").className="open";
$("fBtn").setAttribute("aria-expanded","true");
document.body.style.overflow="hidden";
$("panel").scrollTop=0;
renderProfileSection();
updBtn();
if(hs===0)pushO();
}
function hidePanel(forceTop){
$("drawer").className="";
$("fBtn").setAttribute("aria-expanded","false");
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
restoreFocus();
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
var visCnt=onlyVisite?0:Object.keys(BAISSES).length;
if(!newCnt&&!goneCnt&&!visCnt){
nb.style.display="none";
nb.innerHTML="";
return;
}
var txt=[];
if(visCnt)txt.push("<b>"+visCnt+"</b> baisse"+(visCnt>1?"s":"")+" depuis votre dernière visite");
if(newCnt)txt.push("<b>"+newCnt+"</b> nouveauté"+(newCnt>1?"s":""));
if(goneCnt)txt.push("<b>"+goneCnt+"</b> favori"+(goneCnt>1?"s retirés":" retiré"));
var btns=[];
if(visCnt)btns.push('<button type="button" class="nb-btn" id="nbVis">Voir les baisses</button>');
if(visCnt)btns.push('<button type="button" class="nb-btn" id="nbVisSkip">Ignorer</button>');
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
var sec=$("profBox");
if(!sec)return;
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

sec.innerHTML='<div class="prof-block">'+
'<div class="lbl">Mon profil tailles</div>'+
'<div class="s prof-line">'+(badges.length?esc(badges.join(" · ")):"Aucune taille enregistrée")+'</div>'+
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
'<div class="prow"><button type="button" class="chip'+(PROFIL_FILTER?" on":"")+'" id="profFilter">Filtrer tout le catalogue</button></div>'+
'</div>';
}

(function(){
var b=document.createElement("div");b.id="brands";
var sz=$("szLet");sz.parentNode.insertBefore(b,sz);
var w=document.createElement("div");w.id="warn";w.style.display="none";
var n=$("n");n.parentNode.insertBefore(w,n);

var drawerPanel=$("panel");
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
if(PROFIL_FILTER)syncProfFilter();
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
if(e.target.closest("#profFilter")){
PROFIL_FILTER=!PROFIL_FILTER;
ls("profFiltre",PROFIL_FILTER);
if(PROFIL_FILTER)syncProfFilter();
else if(!profSizes().length){SZ={};buildSizes()}
renderProfileSection();apply();
}
});

var savedProf=getProfData();
if(savedProf.chau){var nc=norm(savedProf.chau)||savedProf.chau;SZ[nc]=1}
if(savedProf.haut){var nh=norm(savedProf.haut)||savedProf.haut;SZ[nh]=1}
if(savedProf.bas){var nb=norm(savedProf.bas)||savedProf.bas;SZ[nb]=1}

$("newsBubble").addEventListener("click",function(e){
if(e.target.closest("#nbVis")){onlyVisite=true;onlyNew=false;onlyFav=false;syncChips();favCount();apply(true,true)}
if(e.target.closest("#nbVisSkip")){BAISSES={};PRIX_VISITE=null;VISITE_T=0;ls("prix_visite",null);ls("visite",0);updNewsAndFavBubble()}
if(e.target.closest("#nbNew")){onlyNew=true;onlyFav=false;syncChips();favCount();apply(true,true)}
if(e.target.closest("#nbGone")){onlyFav=true;onlyNew=false;syncChips();favCount();apply(true,true)}
});

var s=document.createElement("div");s.id="sheet";
s.innerHTML='<div class="sh-bg"></div><div class="sh-panel"><div class="sh-top"><button type="button" class="sh-x" id="shClose" aria-label="Fermer" onclick="closeSheet()">✕</button></div><div class="sh-body" id="shBody"></div></div>';
document.body.appendChild(s);
s.querySelector(".sh-bg").addEventListener("click",closeSheet);
s.addEventListener("click",function(e){
var szBtn=e.target.closest(".sz-item");
if(szBtn){
var t=szBtn.getAttribute("data-sz");
pickedSize=(pickedSize===t)?"":t;
  renderPickedSizePrice();
  if(cur)setHash(cur,pickedSize);
  return;
}
var rb=e.target.closest("[data-ret]");
if(rb){
var xx=M[cur]||FAV[cur];
if(xx)toggleRetour(xx,rb.getAttribute("data-ret"));
renderPickedSizePrice();
return;
}
var shopRow=e.target.closest(".shop-row");
if(shopRow){
$("boutique").value=shopRow.getAttribute("data-shop")||"";
closeSheet();
apply(true,true);
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
if(e.key==="Escape"){if(sheetOpen())closeSheet();else if(drawerOpen())closePanel();return}
if(sheetOpen())trapFocus(e,$("sheet"));
else if(drawerOpen())trapFocus(e,$("drawer"));
});
})();

function setDens(d){
ls("dens",d);
document.body.classList.toggle("dense",d===3);
Array.prototype.forEach.call(document.querySelectorAll(".dn"),function(b){
b.className="chip dn"+(+b.getAttribute("data-d")===d?" on":"");
});
}
(function(){
var dr=$("dens");
if(!dr)return;
dr.innerHTML='<button type="button" class="chip dn" data-d="2">▦ Normal</button><button type="button" class="chip dn" data-d="3">▩ Compact</button>';
dr.addEventListener("click",function(e){
var b=e.target.closest(".dn");
if(b)setDens(+b.getAttribute("data-d"));
});
setDens(ls("dens")===3?3:2);
})();

$("g").innerHTML=Array(9).join('<div class="card sk"><div class="ph"></div><div class="in"><div class="skl"></div><div class="skl s2"></div></div></div>');

function sig(){return JSON.stringify([curF(),onlyFav,onlyNew,onlyDrop,onlyTop,onlyVisite,$("tri").value])}
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

function fetchSizeIndex(){
return fetch("data/tailles_index.json?"+Date.now()).then(function(r){
if(!r.ok)return {};
return r.json();
}).catch(function(){return {}});
}
function applySizeIndex(j){
IDX={};
if(j&&j.by_link&&typeof j.by_link==="object")IDX=j.by_link;
D.forEach(function(x){delete x._ur;delete x._spm;delete x._sb;delete x._t;delete x._sol});
return IDX;
}
function loadSizeDetail(){
if(DETAIL_P)return DETAIL_P;
DETAIL_P=fetch("data/prix_tailles.json?"+Date.now()).then(function(r){
if(!r.ok)throw new Error("HTTP "+r.status);
return r.json();
}).then(function(j){
SZ_MAP={};
if(j&&j.by_link&&typeof j.by_link==="object"){
SZ_MAP=j.by_link;
}else if(j&&Array.isArray(j.articles)){
j.articles.forEach(function(a){if(a&&a.lien)SZ_MAP[a.lien]=a});
}
DETAIL_LOADED=true;
D.forEach(function(x){delete x._spm;delete x._sb;delete x._sol});
return SZ_MAP;
}).catch(function(){DETAIL_P=null;return {}});
return DETAIL_P;
}

function loadHistory(){
if(HIST_LOAD)return HIST_LOAD;
HIST_LOAD=fetch("data/history.json?"+Date.now()).then(function(r){
if(!r.ok)return {};
return r.json();
}).then(function(j){
HIST=(j&&typeof j==="object")?j:{};
return HIST;
}).catch(function(){HIST={};return HIST});
return HIST_LOAD;
}

function loadPromos(isAuto){
// Les deux fichiers partent ensemble : l'index n'attend plus le parsing des promos.
var idxP=fetchSizeIndex();
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
return idxP.then(applySizeIndex).then(function(){
buildDup();
FAV=ls("fav")||{};
var snap=ls("snap");
var links=D.map(function(x){return x.lien});
if(!snap){snap={maj:j.maj,links:links,prev:null};ls("snap",snap)}
else if(snap.maj!==j.maj){snap={maj:j.maj,links:links,prev:snap.links};ls("snap",snap)}
calcBaisses();
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
if(PROFIL_FILTER)syncProfFilter();
renderCats();renderProfileSection();buildSizes();buildBrands();favCount();
if(changed||!isAuto)apply(true);
updBell();
if(!isAuto)restoreView();
openFromHash();
if(!isAuto)importSharedFavs();
if(!isAuto)noterVisite();
document.dispatchEvent(new CustomEvent("promos:maj",{detail:{maj:j.maj}}));
annotateBasSuivi();
renderSelection();
});
});
}

/* L'historique (708 Ko) n'arrive qu'après la grille : badges 90 jours et sélection. */
(function(){
function run(){loadHistory().then(function(){annotateBasSuivi();renderSelection()})}
if("requestIdleCallback" in window)requestIdleCallback(run,{timeout:3500});
else setTimeout(run,1500);
})();

chargerVisite();
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
function toggleVisite(){onlyVisite=!onlyVisite;syncChips();apply()}

function resetAll(){
$("q").value="";$("pmax").value="";
$("boutique").value="";$("remise").value="0";$("tri").value="remise";
SZ={};BR={};CAT="all";GEN="all";SYS="EU";BRQ="";onlyFav=false;onlyNew=false;onlyDrop=false;onlyTop=false;onlyRE=false;onlyVisite=false;
syncChips();
renderCats();renderProfileSection();buildSizes();buildBrands();favCount();
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

$("pills").addEventListener("click",function(e){
var p=e.target.closest(".pl2");
if(!p)return;
var k=p.getAttribute("data-k"),v=p.getAttribute("data-v");
if(k==="all"){resetAll();return}
if(k==="q")$("q").value="";
else if(k==="cat"){CAT="all";pruneSZBR();renderCats();buildSizes();buildBrands()}
else if(k==="gen")GEN="all";
else if(k==="b")$("boutique").value="";
else if(k==="r")$("remise").value="0";
else if(k==="pm")$("pmax").value="";
else if(k==="sz"){delete SZ[v];buildSizes()}
else if(k==="br"){delete BR[v];buildBrands()}
else if(k==="re")onlyRE=false;
else if(k==="new")onlyNew=false;
else if(k==="drop")onlyDrop=false;
else if(k==="top")onlyTop=false;
else if(k==="vis")onlyVisite=false;
else if(k==="fav"){onlyFav=false;favCount()}
else if(k==="prof"){PROFIL_FILTER=false;ls("profFiltre",false);renderProfileSection()}
syncChips();
apply();
});

$("cats").addEventListener("click",function(e){
var b=e.target.closest(".catb");
if(!b)return;
CAT=b.getAttribute("data-c");
pruneSZBR();
renderCats();buildSizes();buildBrands();apply();
});
$("gens").addEventListener("click",function(e){
var b=e.target.closest(".genb");
if(!b)return;
GEN=b.getAttribute("data-g");
renderGens();
apply();
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

window.addEventListener("hashchange",function(){
if(location.hash.indexOf("#p=")===0){if(!sheetOpen())openFromHash()}
else if(sheetOpen())hideSheet();
});

/* Recherche tolérante : accents déjà retirés, pluriels ramenés au singulier,
   synonymes usuels du vestiaire, et un nombre cherché correspond aussi à une taille. */
var SYN={
"chaussure":"sneaker shoe basket trainer","chaussures":"sneaker shoe basket sneakers",
"basket":"chaussure sneaker shoe","baskets":"chaussure sneaker shoes",
"sneaker":"chaussure shoe basket","sneakers":"chaussure shoes baskets",
"trainer":"sneaker chaussure","trainers":"sneaker chaussure",
"tshirt":"tee shirt","teeshirt":"tshirt tee","tee":"tshirt shirt",
"sweat":"sweatshirt hoodie","sweatshirt":"sweat hoodie","hoodie":"sweat sweatshirt",
"pantalon":"pants trousers","pantalons":"pants trousers","jean":"denim jeans","jeans":"denim jean",
"veste":"jacket coat","manteau":"coat jacket parka","pull":"jumper sweater knit",
"casquette":"cap hat","bonnet":"beanie hat","chapeau":"hat cap",
"sac":"bag backpack","sacoche":"bag pouch","chaussettes":"socks","chaussette":"socks",
"ceinture":"belt","chemise":"shirt","short":"shorts","soulier":"sneaker chaussure"
};
function searchVariants(t){
var out=[t];
var st=(t.length>4&&/s$/.test(t))?t.slice(0,-1):t;
if(st!==t)out.push(st);
var syn=SYN[t]||SYN[st];
if(syn)syn.split(" ").forEach(function(a){if(a&&out.indexOf(a)<0)out.push(a)});
return out;
}
function searchScore(x,rawQ,relax){
var cq=cleanSearchStr(rawQ);
if(!cq)return 1;
var terms=cq.split(/\s+/).filter(Boolean);
var allStr=x._allClean||cleanSearchStr((x.marque||"")+" "+(x.nom||"")+" "+(x.boutique||""));
var titleStr=x._titleClean||cleanSearchStr((x.marque||"")+" "+(x.nom||""));
var sizes=null,hits=0;

for(var i=0;i<terms.length;i++){
var vars=searchVariants(terms[i]);
var hit=false;
for(var j=0;j<vars.length&&!hit;j++){
if(allStr.indexOf(vars[j])>=0)hit=true;
}
if(!hit&&/^\d{2}(?:[.,]5)?$/.test(terms[i])){
if(!sizes)sizes=getT(x).map(function(s){return String(s).toLowerCase()});
var n=terms[i].replace(",",".");
if(sizes.indexOf(n)>=0||sizes.indexOf(n+" 1/3")>=0)hit=true;
}
if(!hit){
if(relax)continue;
return 0;
}
hits++;
}
if(relax&&!hits)return 0;

var score=relax?0:1;
if(titleStr.indexOf(cq)>=0)score+=50;
terms.forEach(function(t){
var best=0;
searchVariants(t).forEach(function(v){
if((" "+titleStr+" ").indexOf(" "+v+" ")>=0)best=Math.max(best,15);
else if(titleStr.indexOf(v)>=0)best=Math.max(best,8);
});
score+=best||2;
});
return score;
}

function curF(){
var pm=parseFloat($("pmax").value);
return {q:$("q").value.trim(),cat:CAT,gen:GEN,b:$("boutique").value,r:+$("remise").value,pm:isNaN(pm)?null:pm,sz:Object.keys(SZ),br:Object.keys(BR),re:onlyRE};
}
function pass(x,F,relax){
if(F.cat!=="all"&&catOf(x)!==F.cat)return false;
if(F.gen&&F.gen!=="all"&&genOf(x)!==F.gen)return false;
if(F.b&&x.boutique!==F.b)return false;
if(x.remise<F.r)return false;
if(F.pm!=null){
if(pxOf(x)>F.pm)return false;
}
if(F.re&&RE_OK.indexOf(x.boutique)<0)return false;
if(F.br.length&&F.br.indexOf(bkey(x))<0)return false;
if(F.sz.length){
var t=getT(x);
if(!F.sz.some(function(s){return t.indexOf(s)>=0}))return false;
}
if(F.q){
var sc=searchScore(x,F.q,relax);
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
CAT=F.cat||"all";
GEN=(F.gen&&GEN_NAMES[F.gen])?F.gen:"all";
SZ={};(F.sz||[]).forEach(function(s){SZ[s]=1});
BR={};(F.br||[]).forEach(function(b){BR[b]=1});
onlyRE=!!F.re;onlyFav=false;onlyNew=false;onlyDrop=false;onlyTop=false;
syncChips();
renderCats();renderProfileSection();buildSizes();buildBrands();favCount();apply();
}
function compute(relax){
var F=curF();
var tri=$("tri").value;
var base=onlyFav?Object.keys(FAV).map(function(l){return M[l]||Object.assign({},FAV[l],{gone:true})}):D;
L=base.filter(function(x){
if(onlyNew&&!NEWS[x.lien])return false;
if(onlyDrop&&!isDrop(x))return false;
if(onlyTop&&x.inf)return false;
if(onlyVisite&&!BAISSES[x.lien])return false;
return pass(x,F,relax);
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
return pxOf(a)-pxOf(c);
}
if(tri==="prixd"){
return Object.keys(SZ).length===1?pxOf(c)-pxOf(a):shoePriceBounds(c).max-shoePriceBounds(a).max;
}
return c.remise-a.remise;
});
if(DEDUP){
var seenG={};
L=L.filter(function(x){
var g=x._gid;
if(!g)return true;
if(seenG[g])return false;
seenG[g]=1;
return true;
});
}
if(onlyTop)L=L.slice(0,30);
}
function updRes(){
var sr=$("showRes");
if(sr)sr.textContent="Voir "+L.length+" résultat"+(L.length>1?"s":"");
}
function draw(soft,forceTop){
compute();
var exact=L.length;
RELAX=false;
/* Aucun résultat exact : on propose les articles qui partagent au moins un
   terme plutôt qu'un écran vide. La requête reste notée comme infructueuse. */
if(!exact&&$("q").value.trim()){
compute(true);
RELAX=L.length>0;
logVide($("q").value);
}
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
if(x._grpN>1)tags+='<span class="tag tb">'+x._grpN+' BOUTIQUES</span>';
if(x.inf)tags+='<span class="tag tg">PRIX BARRÉ ?</span>';
else if(catOf(x)!=="chau"&&x.pmin&&x.pmin<x.prix-0.5&&!isDrop(x))tags+='<span class="tag tg">DÉJÀ À '+f(x.pmin)+'</span>';
}
tags+='<span class="tag tag-low" hidden></span>';
var uSizes=uniqueRawSizes(x);
var img=x.image?'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(thumb(x.image))+'" data-o="'+esc(x.image)+'" alt="" onerror="if(this.dataset.o&&this.src!==this.dataset.o){this.src=this.dataset.o;this.dataset.o=\'\'}else{this.style.visibility=\'hidden\'}">':'<div class="ph"></div>';
var href=/^https?:\/\//.test(x.lien)?esc(x.lien):"#";
return '<div class="card'+(x.gone?" gone":"")+'" data-l="'+esc(x.lien)+'"><button class="fav'+(fv?" on":"")+'" data-l="'+esc(x.lien)+'" aria-label="Favori">'+(fv?"♥":"♡")+'</button><a href="'+href+'" target="_blank" rel="noopener">'+(x.gone?"":'<span class="pct">−'+x.remise+' %</span>')+img+'<div class="in"><div class="b">'+esc(x.marque)+' · '+esc(x.boutique)+'</div><div class="t">'+esc(x.nom)+'</div><div><span class="now">'+priceRangeLabel(x)+'</span><span class="old">'+f(x.ancien_prix)+'</span></div><div class="s">'+esc(uSizes.join(", "))+'</div>'+tags+'</div></a></div>';
}

function render(){
var shown=L.slice(0,PER);
shownN=shown.length;
var parts=[];
if(CAT!=="all")parts.push(CL[CAT]);
if(GEN!=="all")parts.push(GEN_NAMES[GEN]);
if($("boutique").value)parts.push($("boutique").value);
if(Object.keys(BR).length)parts.push(Object.keys(BR).length+" marque"+(Object.keys(BR).length>1?"s":""));
if(onlyFav)parts.push("Favoris");
if(onlyNew)parts.push("Nouveautés");
if(onlyDrop)parts.push("Baisses");
if(onlyTop)parts.push("Top 30");
if(onlyRE)parts.push("La Réunion");
if(onlyVisite)parts.push("Baissé depuis votre visite");
var note="";
if(Object.keys(SZ).length)note=" · articles sans taille indiquée masqués";
if(onlyFav&&!L.length)note=" · touchez ♡ sur un article pour l’ajouter";
if(onlyVisite&&VISITE_T)note=" · depuis le "+new Date(VISITE_T).toLocaleDateString("fr-FR");
if(RELAX)note=" · aucun résultat exact, voici les plus proches";
$("n").textContent=L.length+" article"+(L.length>1?"s":"")+(parts.length?" · "+parts.join(" · "):"")+note;
updRes();
$("g").innerHTML=shown.map(function(x){return cardHtml(x)}).join("");
setMore();
initTraveller();
annotateBasSuivi();
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
annotateBasSuivi();
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
if(F.cat!=="all")p.push(CL[F.cat]);
if(F.gen&&F.gen!=="all")p.push(GEN_NAMES[F.gen]||F.gen);
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
$("cBell").textContent="Alertes"+(n?" ("+n+")":"");
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
setTimeout(function(){btn.textContent="Enregistrer cette recherche"},2000);
}
}
function openAlerts(){
var A=ls("alerts")||[];
var h='<div class="sh-t">Mes alertes</div>';
if(!A.length)h+='<div class="s">Aucune alerte enregistrée.</div>';
A.forEach(function(a,i){
var tot=0,nw=0;
D.forEach(function(x){if(pass(x,a.f)){tot++;if(NEWS[x.lien]||isDrop(x))nw++}});
h+='<div class="alrt"><div class="al-t">'+esc(a.name)+'</div><div class="s">'+tot+' article'+(tot>1?"s":"")+(nw?' · <b>'+nw+' nouveau'+(nw>1?"x":"")+' ou en baisse</b>':'')+'</div><div class="sh-act"><button class="go al-go" data-i="'+i+'">Voir</button><button class="fbtn al-del" data-i="'+i+'">Supprimer</button></div></div>';
});
/* Emplacement prévu pour la veille : veille.js le remplit s'il est chargé. */
h+='<div id="veilleSlot"></div>';
cur=null;pickedSize="";
$("shBody").innerHTML=h;
$("shBody").scrollTop=0;
showSheet("Mes alertes");
if(window.Veille&&window.Veille.majAlertes)window.Veille.majAlertes();
}

function openShops(){
var counts={},shops=[];
D.forEach(function(x){if(shops.indexOf(x.boutique)<0)shops.push(x.boutique);counts[x.boutique]=(counts[x.boutique]||0)+1});
shops.sort(function(a,b){return (counts[b]||0)-(counts[a]||0)});
var curB=$("boutique").value;
var h='<div class="sh-t">Boutiques</div><div class="s">Choisir une boutique, ou toutes.</div><div class="shop-list">';
h+='<button type="button" class="shop-row'+(curB?"":" on")+'" data-shop=""><span>Toutes les boutiques</span><b>'+D.length+'</b></button>';
shops.forEach(function(b){
h+='<button type="button" class="shop-row'+(curB===b?" on":"")+'" data-shop="'+esc(b)+'"><span>'+esc(b)+'</span><b>'+(counts[b]||0)+'</b></button>';
});
h+='</div>';
cur=null;pickedSize="";
$("shBody").innerHTML=h;
$("shBody").scrollTop=0;
showSheet("Boutiques");
}

/* Bloc de tailles : les pointures épuisées restent visibles, sans prix inventé,
   et peuvent être surveillées pour un retour en stock. */
function szListHtml(x){
var uSizes=allSizes(x);
if(!uSizes.length)return "";
var spm=sizePriceMap(x),off={};
epuisees(x).forEach(function(t){off[t]=1});
var items=uSizes.map(function(t){
var pv=spm[t],isOff=!pv&&off[t];
return '<button type="button" class="sz-item'+(pickedSize===t?" on":"")+(isOff?" off":"")+'" data-sz="'+esc(t)+'">'+esc(t)+(isOff?'<em>épuisée</em>':(pv?'<em>'+esc(f(pv))+'</em>':''))+'</button>';
}).join("");
var note=Object.keys(off).length?'<div class="sz-off-note">Touchez une taille épuisée pour être prévenu de son retour.</div>':"";
return '<div class="lbl">Tailles &amp; prix</div><div class="sz-list">'+items+'</div>'+note;
}
function szBlockHtml(x){
if(!allSizes(x).length)return '<div id="szWrap"></div>';
return '<div id="szWrap">'+szListHtml(x)+'</div>';
}
function renderSheetSizes(){
var x=M[cur]||FAV[cur];
var wrap=$("szWrap");
if(!x||!wrap)return;
wrap.innerHTML=szListHtml(x);
renderPickedSizePrice();
}
function setHash(l,t){
try{
var url=location.pathname+location.search+(l?("#p="+encodeURIComponent(l)+(t?"&t="+encodeURIComponent(t):"")):"");
history.replaceState(history.state||{o:1},"",url);
}catch(e){}
}
function deepLink(l,t){
return location.origin+location.pathname+"#p="+encodeURIComponent(l)+(t?"&t="+encodeURIComponent(t):"");
}
function openFromHash(){
var h=location.hash||"";
if(h.indexOf("#p=")!==0)return false;
var rest=h.slice(3),t="";
var i=rest.indexOf("&t=");
if(i>=0){t=decodeURIComponent(rest.slice(i+3));rest=rest.slice(0,i)}
var lien=decodeURIComponent(rest);
if(!M[lien])return false;
openSheet(lien);
if(t){pickedSize=t;renderPickedSizePrice();setHash(lien,t)}
return true;
}
function histStats(x){
var h=HIST[x.lien];
if(!h||!h.h||!h.h.length)return null;
var pts=[];
h.h.slice(-12).forEach(function(p){if(p&&typeof p[1]==="number"&&p[1]>0)pts.push(p)});
if(!pts.length)return null;
var min=pts[0][1],minD=pts[0][0],max=pts[0][1];
pts.forEach(function(p){if(p[1]<min){min=p[1];minD=p[0]}if(p[1]>max)max=p[1]});
return {min:min,minD:minD,max:max,pts:pts,n:pts.length};
}
function sparkline(pts){
if(pts.length<2)return "";
var vals=pts.map(function(p){return p[1]});
var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals);
var W=280,H=44,step=W/(pts.length-1);
var d=pts.map(function(p,i){var y=mx===mn?H/2:H-((p[1]-mn)/(mx-mn))*(H-8)-4;return (i?"L":"M")+Math.round(i*step)+" "+Math.round(y)}).join(" ");
return '<svg class="spark" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><path d="'+d+'" fill="none" stroke="#2C4A8F" stroke-width="1.5"/></svg>';
}
function renderHistBlock(x){
var el=$("histWrap");
if(!el||!x)return;
var s=histStats(x);
if(!s){el.innerHTML="";return}
var h='<div class="lbl">Historique</div><div class="hist-line">Plus bas vu : <b>'+f(s.min)+'</b> le '+fdate(s.minD)+'</div>'+sparkline(s.pts);
var real=s.max>0?Math.round((1-x.prix/s.max)*100):0;
if(s.n>=2&&real<x.remise-10)h+='<div class="hist-warn">Remise réelle sur les prix observés : <b>−'+real+' %</b> (affichée : −'+x.remise+' %)</div>';
if(x.ancien_prix&&s.max&&x.ancien_prix<=s.max*1.02)h+='<div class="hist-warn">Prix barré peu crédible : déjà vu à '+f(s.max)+'</div>';
el.innerHTML=h;
drawSpark();
}
function renderPickedSizePrice(){
var x=M[cur]||FAV[cur];
var box=$("szPickBox");
Array.prototype.forEach.call(document.querySelectorAll("#shBody .sz-item"),function(el){
el.classList.toggle("on",el.getAttribute("data-sz")===pickedSize);
});
if(!box)return;
if(!x||!pickedSize){box.style.display="none";box.innerHTML="";return}
var list=sizeOfferList(x)[pickedSize]||[];
box.style.display="";
if(!list.length){
if(epuisees(x).indexOf(pickedSize)<0){
box.innerHTML="Taille <b>"+esc(pickedSize)+"</b> · Prix site : <b>"+esc(priceRangeLabel(x))+"</b>";
}else{
var r=retours(),w=!!(r[cur]&&r[cur][pickedSize]);
box.innerHTML='<div class="sz-offer-h">Taille '+esc(pickedSize)+'</div>'+
'<div class="sz-offer"><span>Épuisée sur ce site</span><b>—</b></div>'+
'<div class="retour-row"><button type="button" class="fbtn'+(w?" on":"")+'" data-ret="'+esc(pickedSize)+'">'+(w?"Alerte de retour en place ✓":"Me prévenir si elle revient")+'</button></div>';
}
renderCmp();
return;
}
var etats={};
list.forEach(function(o){etats[o.etat||""]=1});
var multi=Object.keys(etats).length>1;
box.innerHTML='<div class="sz-offer-h">Taille '+esc(pickedSize)+'</div>'+list.map(function(o){
return '<div class="sz-offer">'+(multi?'<span>'+esc(o.etat||"Prix site")+'</span>':'')+'<b>'+f(o.prix)+'</b>'+(o.ancien?'<s>'+f(o.ancien)+'</s>':'')+'</div>';
}).join("");
renderCmp();
}

/* --- Prix de la taille, visites, retours en stock, focus -------------- */
/* Prix retenu par les filtres et le tri : celui de la seule taille choisie,
   sinon le plus bas de l'article. */
function pxOf(x){
var ks=Object.keys(SZ);
if(ks.length===1){
var v=sizePriceMap(x)[ks[0]];
if(v>0)return v;
}
return shoePriceBounds(x).min;
}
function median(vals){
var a=vals.filter(function(v){return v>0}).sort(function(p,q){return p-q});
if(!a.length)return null;
var m=Math.floor(a.length/2);
return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
/* Pointures connues mais indisponibles, publiées par l'index des tailles. */
function epuisees(x){
var e=IDX[x.lien];
return (e&&Array.isArray(e.e))?e.e:[];
}
function sizePrice(l,s){
var e=IDX[l];
return (e&&e.p&&e.p[s]>0)?e.p[s]:0;
}
window.sizePrice=sizePrice;
function retours(){
var r=ls("retours");
return (r&&typeof r==="object")?r:{};
}
function toggleRetour(x,size){
var r=retours();
r[x.lien]=r[x.lien]||{};
if(r[x.lien][size])delete r[x.lien][size];
else r[x.lien][size]={nom:x.nom,taille:size};
if(!Object.keys(r[x.lien]).length)delete r[x.lien];
ls("retours",r);
try{
if(window.Veille&&Veille.demander&&"Notification" in window&&Notification.permission==="default")Veille.demander();
}catch(e){}
}
/* Baisses depuis la dernière visite : une photo des prix est gardée d'une
   visite à l'autre, ce qui montre ce qui a réellement baissé depuis, sans
   dépendre de la granularité quotidienne de l'historique. */
function chargerVisite(){
PRIX_VISITE=ls("prix_visite");
VISITE_T=+ls("visite")||0;
}
function noterVisite(){
var snap={};
D.forEach(function(x){snap[x.lien]=Math.round(x.prix*100)});
ls("prix_visite",snap);
ls("visite",Date.now());
}
function calcBaisses(){
BAISSES={};
if(!PRIX_VISITE||typeof PRIX_VISITE!=="object")return;
D.forEach(function(x){
var old=PRIX_VISITE[x.lien];
if(!(old>0))return;
var avant=old/100;
if(x.prix<avant-0.5)BAISSES[x.lien]={avant:avant,ecart:avant-x.prix};
});
VISITE_T=+ls("visite")||VISITE_T;
}
/* Focus rendu à l'élément qui a ouvert une couche, et piégé dedans tant
   qu'elle est ouverte : au clavier, on ne sort plus de la fiche par erreur. */
var FOCUS_BACK=null;
function rememberFocus(){FOCUS_BACK=document.activeElement}
function restoreFocus(){
var el=FOCUS_BACK;FOCUS_BACK=null;
if(el&&el.focus&&document.contains(el)){try{el.focus({preventScroll:true})}catch(e){}}
}
function trapFocus(e,root){
if(e.key!=="Tab"||!root)return;
var all=root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
var list=[];
Array.prototype.forEach.call(all,function(el){if(el.offsetParent!==null||el===document.activeElement)list.push(el)});
if(!list.length)return;
var first=list[0],last=list[list.length-1];
if(e.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){e.preventDefault();last.focus()}
else if(!e.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){e.preventDefault();first.focus()}
}
/* --- Comparateur : la même paire, vue chez les autres boutiques -------- */
function cmpBlockHtml(x){
if(!M[x.lien]||!x._alt||!x._alt.length)return "";
var list=x._alt.slice().sort(function(a,b){return shoePriceBounds(a).min-shoePriceBounds(b).min});
var best=shoePriceBounds(list[0]).min;
var own=x.prix;
var med=median(list.map(function(y){return shoePriceBounds(y).min}));
var line='<div class="cmp-line">'+list.length+(list.length>1?" autres boutiques":" autre boutique")+
(best<own-0.01?" · dès "+f(best)+", soit "+f(own-best)+" de moins":" · aucun meilleur prix ce jour")+'</div>';
/* Le prix barré se juge sur les prix réellement pratiqués ailleurs. */
if(med&&x.ancien_prix>med*1.05){
line+='<div class="cmp-med">Prix médian ailleurs : '+f(med)+' · le prix barré ('+f(x.ancien_prix)+') est '+Math.round((x.ancien_prix/med-1)*100)+' % au-dessus</div>';
}
var rows=list.map(function(y){
var b=shoePriceBounds(y);
var szP=null;
if(pickedSize){
var offer=(sizeOfferList(y)||{})[pickedSize];
if(offer&&offer.length)szP=offer[0].prix;
}
var isBest=best<own-0.01&&Math.abs(b.min-best)<0.01;
return '<a class="altl'+(isBest?" is-best":"")+'" href="'+esc(y.lien)+'" target="_blank" rel="noopener"><span>'+esc(y.boutique)+
(szP!=null?'<i class="cmp-sz">'+esc(pickedSize)+" : "+f(szP)+'</i>':"")+
(isBest?'<i class="cmp-tag">meilleur prix</i>':"")+'</span><b>'+f(b.min)+(b.max>b.min+0.01?'<em> – '+f(b.max)+'</em>':"")+'</b></a>';
}).join("");
return '<div id="cmpWrap"><div class="lbl">Ailleurs</div>'+line+rows+'</div>';
}
function renderCmp(){
var wrap=$("cmpWrap");
var x=cur?(M[cur]||FAV[cur]):null;
if(!wrap||!x)return;
wrap.outerHTML=cmpBlockHtml(x);
}

/* --- Plus bas depuis le début du suivi, d'après notre propre historique -- */
/* L'ancienneté affichée est celle des relevés réellement collectés : 5 jours
   aujourd'hui, davantage plus tard. Aucun badge ne parle de 90 jours. */
function basSuivi(l){
var h=HIST[l];
if(!h||!h.h||!h.h.length)return null;
/* Moins de trois relevés : le « plus bas » ne veut rien dire, on se tait. */
if(h.h.length<3)return null;
var min=null,first=null;
/* « d » est la date de première observation, conservée même quand les points
   les plus anciens ont été élagués : l'ancienneté affichée reste vraie. */
if(h.d){var t0=new Date(h.d+"T00:00:00Z").getTime();if(!isNaN(t0))first=t0}
h.h.forEach(function(p){
if(!p||typeof p[1]!=="number"||!(p[1]>0))return;
var t=new Date(p[0]+"T00:00:00Z").getTime();
if(isNaN(t))return;
if(first===null||t<first)first=t;
if(min===null||p[1]<min)min=p[1];
});
if(first===null||!(min>0))return null;
return {min:min,days:Math.max(1,Math.ceil((Date.now()-first)/86400000))};
}
function annotateBasSuivi(){
if(!Object.keys(HIST).length)return;
var cards=document.querySelectorAll("#g .card[data-l]");
Array.prototype.forEach.call(cards,function(c){
var el=c.querySelector(".tag-low");
if(!el)return;
var l=c.getAttribute("data-l"),x=M[l];
if(!x||x.gone){el.hidden=true;return}
var lo=basSuivi(l);
if(lo===null||!(lo.min>0)){el.hidden=true;return}
if(x.prix<=lo.min+0.01){
var t="PLUS BAS · "+lo.days+" J";
if(el.textContent!==t)el.textContent=t;
el.className="tag tb tag-low";
el.hidden=false;
}else{
var t2="MIN "+lo.days+" J · "+f(lo.min);
if(el.textContent!==t2)el.textContent=t2;
el.className="tag tg tag-low";
el.hidden=false;
}
});
}
/* --- Sélection de la semaine : au plus bas depuis le début du suivi ---- */
function renderSelection(){
var box=$("selBlock");
if(!box)return;
if(!Object.keys(HIST).length)return;
if(actives().length||$("tri").value!=="remise"){box.hidden=true;box.innerHTML="";return}
var cand=[];
D.forEach(function(x){
var h=HIST[x.lien];
if(!h||!h.h||h.h.length<3)return;
var vals=h.h.map(function(p){return p[1]}).filter(function(v){return v>0});
if(vals.length<3)return;
var mn=Math.min.apply(null,vals);
if(!(mn>0))return;
if(x.prix>mn*1.02)return;
cand.push({x:x,low:mn});
});
cand.sort(function(a,b){return (b.x.remise||0)-(a.x.remise||0)});
cand=cand.slice(0,5);
if(cand.length<3){box.hidden=true;box.innerHTML="";return}
box.hidden=false;
box.innerHTML='<div class="sel-h"><span class="lbl">La sélection de la semaine</span><span class="sel-n">au plus bas depuis le début du suivi</span></div>'+cand.map(function(c){
var x=c.x;
return '<button type="button" class="sel-item" data-l="'+esc(x.lien)+'">'+
(x.image?'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(thumb(x.image,120))+'">':'')+
'<span class="sel-in"><b>'+esc(x.nom)+'</b><em>'+esc(x.marque)+' · '+esc(x.boutique)+'</em></span>'+
'<span class="sel-p"><b>'+f(x.prix)+'</b><em>−'+x.remise+' % · au plus bas</em></span></button>';
}).join("");
}
function logVide(q){
q=String(q||"").toLowerCase().trim();
if(!q)return;
var v=ls("vides")||[];
if(v.indexOf(q)>=0)return;
v.unshift(q);
ls("vides",v.slice(0,40));
}

/* --- Favoris partageables --------------------------------------------- */
function favsShareURL(){
var ks=Object.keys(FAV);
if(!ks.length)return "";
var b="";
try{b=btoa(unescape(encodeURIComponent(ks.join("\n"))))}catch(e){return ""}
b=b.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
return location.origin+location.pathname+"#f="+b;
}
function shareFavs(){
var url=favsShareURL();
if(!url){alert("Aucun favori à partager pour le moment.");return}
var n=Object.keys(FAV).length;
var txt=n+" favori"+(n>1?"s":"")+" streetwear repéré"+(n>1?"s":"")+" sur PROMOS.";
if(navigator.share){
navigator.share({title:"PROMOS.",text:txt,url:url}).catch(function(){});
}else if(navigator.clipboard){
navigator.clipboard.writeText(txt+"\n"+url).then(function(){
var el=$("cFav");
if(el){var old=el.textContent;el.textContent="lien copié ✓";setTimeout(function(){el.textContent=old},1600)}
}).catch(function(){});
}
}
function importSharedFavs(){
var h=location.hash||"";
if(h.indexOf("#f=")!==0)return false;
var s=h.slice(3).replace(/-/g,"+").replace(/_/g,"/");
var txt="";
try{txt=decodeURIComponent(escape(atob(s)))}catch(e){return false}
var links=txt.split(/[\n,]+/).filter(function(l){return /^https?:\/\//.test(l)});
if(!links.length)return false;
try{history.replaceState(history.state||{o:1},"",location.pathname+location.search)}catch(e){}
var known=links.filter(function(l){return !!M[l]}).length;
var nb=$("newsBubble");
if(!nb)return false;
nb.style.display="flex";
nb.innerHTML='<div><b>'+links.length+'</b> favori'+(links.length>1?"s":"")+' partagé'+(links.length>1?"s":"")+(known<links.length?" · "+known+" encore en promo":"")+'</div><div class="news-bubble-actions"><button type="button" class="nb-btn" id="nbImp">Importer</button><button type="button" class="nb-btn" id="nbSkip">Ignorer</button></div>';
var imp=$("nbImp"),skip=$("nbSkip");
if(imp)imp.addEventListener("click",function(){
links.forEach(function(l){if(M[l]&&!FAV[l])FAV[l]=Object.assign({},M[l])});
ls("fav",FAV);favCount();
if(onlyFav)draw(true);
else{syncFavs();updNewsAndFavBubble()}
});
if(skip)skip.addEventListener("click",function(){updNewsAndFavBubble()});
return true;
}

function openSheet(l){
var x=M[l]||FAV[l];
if(!x)return;
cur=l;
pickedSize="";
var szHtml=szBlockHtml(x)+'<div id="szPickBox" class="sz-pick-price" style="display:none"></div>';
var alt=cmpBlockHtml(x);
var seuil=window.Veille?Veille.ficheHtml(x):"";
var small=thumb(x.image),big=thumb(x.image,700);
var img=x.image?'<img class="sh-img" id="shImg" referrerpolicy="no-referrer" src="'+esc(small)+'" alt="" onerror="this.style.visibility=\'hidden\'">':"";
$("shBody").innerHTML=img+'<div class="b">'+esc(x.marque)+' · '+esc(x.boutique)+'</div><div class="sh-t">'+esc(x.nom)+'</div><div><span class="now big">'+priceRangeLabel(x)+'</span><span class="old">'+f(x.ancien_prix)+'</span><span class="pct2">−'+x.remise+' %</span></div>'+szHtml+'<div id="histWrap" class="hist"></div>'+alt+'<div class="sh-act"><a class="go" href="'+esc(x.lien)+'" target="_blank" rel="noopener">Voir sur le site</a><button class="fbtn" id="shFav" aria-label="Favori">'+(FAV[l]?"♥":"♡")+'</button><button class="fbtn" id="shShare">Partager</button></div>'+seuil;
$("shBody").scrollTop=0;
showSheet("Fiche produit");
setHash(l,"");
loadHistory().then(function(){if(cur===l)renderHistBlock(M[l]||FAV[l])});
if(!DETAIL_LOADED)loadSizeDetail().then(function(){if(cur===l)renderSheetSizes()});
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
setHash(null);
if(onlyFav){var y=window.scrollY;draw(true);window.scrollTo(0,y)}
else syncFavs();
restoreFocus();
}
function closeSheet(){
hideSheet();
popO();
}
function shareCur(){
var x=M[cur]||FAV[cur];
if(!x)return;
var txt=x.nom+" — "+priceRangeLabel(x)+" (−"+x.remise+" %) chez "+x.boutique;
var url=deepLink(cur,pickedSize);
if(navigator.share){
navigator.share({title:x.nom,text:txt,url:url}).catch(function(){});
}else if(navigator.clipboard){
navigator.clipboard.writeText(txt+"\n"+url).then(function(){var b=$("shShare");if(b)b.textContent="Copié ✓"}).catch(function(){});
}
}

var sb=$("selBlock");
if(sb)sb.addEventListener("click",function(e){
var it=e.target.closest(".sel-item");
if(it)openSheet(it.getAttribute("data-l"));
});

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
openSheet(a.closest(".card").getAttribute("data-l"));
}
});

window.addEventListener("scroll",function(){
if(raf)return;
raf=requestAnimationFrame(function(){
raf=0;
var s=window.scrollY>700;
if(s!==topOn){topOn=s;$("top").style.display=s?"block":"none"}
updTraveller();
var sp=document.querySelector(".wordmark-spread");
if(sp&&!REDUCED){
var vh=window.innerHeight||800;
var q=Math.max(0,Math.min(1,window.scrollY/vh));
sp.style.transform="translateY("+(16+q*22).toFixed(1)+"%)";
sp.style.opacity=(1-q*.55).toFixed(2);
}
});
},{passive:true});
window.addEventListener("resize",function(){updTraveller()},{passive:true});

/* --- Navigation ------------------------------------------------------- */
function backTop(){window.scrollTo({top:0,behavior:"smooth"})}
function goResults(){
var el=$("n"),bar=$("bar");
var y=el?el.getBoundingClientRect().top+window.scrollY-(bar?bar.offsetHeight:0)-10:0;
try{window.scrollTo({top:Math.max(0,y),behavior:"smooth"})}catch(e){window.scrollTo(0,Math.max(0,y))}
}

/* --- Produit voyageur : un seul article déplacé au défilement ---------- */
var TRAV=null,REDUCED=false;
try{REDUCED=window.matchMedia("(prefers-reduced-motion:reduce)").matches}catch(e){}
var TSTOPS=[[0,62,30,-7,1,1],[0.34,71,23,3,1.05,1],[0.62,53,15,-4,0.86,0.6],[0.86,43,8,2,0.66,0]];
function initTraveller(){
if(REDUCED||TRAV)return;
var el=$("traveller");
if(!el)return;
var pick=null;
for(var i=0;i<L.length;i++){if(L[i]&&L[i].image){pick=L[i];break}}
if(!pick)return;
var img=$("travImg");
if(!img)return;
img.src=thumb(pick.image,600);
TRAV=el;
updTraveller();
}
function updTraveller(){
if(!TRAV)return;
var vh=window.innerHeight||800;
var p=Math.max(0,Math.min(1,window.scrollY/(vh*0.95)));
var a=TSTOPS[0],b=TSTOPS[TSTOPS.length-1];
for(var i=0;i<TSTOPS.length-1;i++){
if(p>=TSTOPS[i][0]&&p<=TSTOPS[i+1][0]){a=TSTOPS[i];b=TSTOPS[i+1];break}
}
var t=(p-a[0])/((b[0]-a[0])||1);
t=t<0?0:t>1?1:t;
t=t*t*(3-2*t);
var x=a[1]+(b[1]-a[1])*t,y=a[2]+(b[2]-a[2])*t,r=a[3]+(b[3]-a[3])*t,s=a[4]+(b[4]-a[4])*t,o=a[5]+(b[5]-a[5])*t;
TRAV.style.transform="translate3d("+x.toFixed(2)+"vw,"+y.toFixed(2)+"vh,0) rotate("+r.toFixed(2)+"deg) scale("+s.toFixed(3)+")";
TRAV.style.opacity=o.toFixed(3);
TRAV.style.visibility=o<0.03?"hidden":"visible";
}

/* --- Courbe d'historique tracée à l'ouverture -------------------------- */
function drawSpark(){
var p=document.querySelector("#shBody .spark path");
if(!p||!p.getTotalLength)return;
try{
var len=p.getTotalLength();
p.style.strokeDasharray=len;
p.style.strokeDashoffset=len;
p.getBoundingClientRect();
p.style.transition="stroke-dashoffset 2s cubic-bezier(.2,.7,.3,1)";
p.style.strokeDashoffset=0;
}catch(e){}
}

function showVersionBanner(){
if($("verBar"))return;
var b=document.createElement("div");
b.id="verBar";
b.innerHTML="<span>Nouvelle version du site.</span><button type=\"button\">Recharger</button>";
b.querySelector("button").addEventListener("click",function(){location.reload()});
document.body.appendChild(b);
}
if("serviceWorker" in navigator){
window.addEventListener("load",function(){
var hadCtrl=!!navigator.serviceWorker.controller;
navigator.serviceWorker.register("sw.js").catch(function(){});
navigator.serviceWorker.addEventListener("controllerchange",function(){
if(hadCtrl)showVersionBanner();
hadCtrl=true;
});
});
}
