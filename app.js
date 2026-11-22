var PER=48,D=[],M={},SZ_MAP={},FAV={},NEWS={},hasNew=false,L=[],onlyFav=false,onlyNew=false,onlyDrop=false,onlyTop=false,onlyRE=false,tm,SZ={},BR={},BRN={},CAT="all",GEN="all",TYPE="all",SYS="EU",shownN=0,cur=null,pickedSize="",io=null,dirty=false,dirtyF=false,hs=0,ign=false,PROFILE_TAB=false,raf=0,topOn=false,MAJ="",PROFIL_FILTER=false,onlyVisite=false,RELAX=false;
var PRIX_VISITE=null,VISITE_T=0,BAISSES={};
var IDX={},HIST={},HIST_LOAD=null,DETAIL_P=null,DETAIL_LOADED=false,DEDUP=true;
var BRLIST=[],BRNAME={},BRCNT={},BRQ="";
var PROF_KIND="haut",PROF_SYS="EU";
PROFIL_FILTER=!!ls("profFiltre");
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
/* Types d'article : de la famille la plus large au détail le plus fin. L'ordre
   compte — « sweatpants » doit être un pantalon avant d'être un sweat, un
   « t-shirt » ne doit pas tomber dans les chemises. */
var TYPES=[
["sous-vetement","Sous-vêtements",/\b(underwear|lingerie|boxers?|briefs?|trunks?|cale[çc]ons?|thongs?|strings?|bralettes?|panties|slips?)\b/],
["chaussettes","Chaussettes",/\b(socks?|chaussettes?)\b/],
["maillot","Maillots de bain",/\b(swimwear|swimsuits?|swim|maillots?|bikinis?|boardshorts?|baignade)\b/],
["robe-jupe","Robes & jupes",/\b(dresses?|robes?|skirts?|jupes?)\b/],
["tshirt","T-shirts",/\b(t[\s-]?shirts?|tshirts?|tees?|jerseys?|short[\s-]?sleeve)\b/],
["debardeur","Débardeurs",/\b(tanks?|debardeurs?|débardeurs?|camisoles?|singlets?|vest[\s-]?tops?|sleeveless)\b/],
["top","Tops & blouses",/\b(tops?|blouses?|camis?|tunics?|bodysuits?|henleys?|midlayers?|base[\s-]?layers?)\b/],
["polo","Polos",/\bpolos?\b/],
["chemise","Chemises",/\b(overshirts?|shackets?|chemises?|shirts?|flannels?)\b/],
["manteau","Manteaux",/\b(coats?|manteaux?|parkas?|trench|doudounes?|puffer|down[\s-]?jackets?|anoraks?|capes?|nuptse|jkt)\b/],
["veste","Vestes",/\b(jackets?|jacke|vestes?|blousons?|bombers?|windbreakers?|blazers?|gilets?|vests?|softshell|hardshell|fleece[\s-]?jackets?|outerwear|coach)\b/],
["survetement","Survêtements",/\b(tracksuits?|track[\s-]?suits?|surv[eê]tements?|two[\s-]?piece)\b/],
["sweat","Sweats",/\b(hoodies?|hoody|sweatshirts?|sweats?|crewnecks?|pullovers?|zip[\s-]?ups?|q(?:uarter)?[\s-]?zip|track[\s-]?tops?|warm[\s-]?ups?|fleeces?)\b/],
["pull","Pulls",/\b(jumpers?|knitwear|knits?|cardigans?|sweaters?|pulls?|mohair)\b/],
["short","Shorts",/\b(shorts?|bermudas?)\b/],
["pantalon","Pantalons",/\b(pants?|pantalons?|trousers?|jeans?|denim|chinos?|cargos?|joggers?|jogging|sweatpants?|workpants?|snopants?|leggings?|tights|overalls?|dungarees?|bottoms?|carpenter|ribcage|straight|wide[\s-]?legs?|baggy|501|550|568|874)\b/],
["botte","Bottes",/\b(boots?|bottes?|bottines?|booties?)\b/],
["sandale","Sandales",/\b(sandals?|sandales?|slides?|mules?|claquettes?|tongs?|flip[\s-]?flops?)\b/],
["ville","Mocassins & derbies",/\b(loafers?|mocassins?|derbies?|derby|richelieu|oxfords?|boat[\s-]?shoes?|espadrilles?|ballerines?|heels?|talons?|wallabee)\b/],
["chausson","Chaussons & clogs",/\b(clogs?|crocs|slippers?|chaussons?|birkenstocks?)\b/],
["sneaker","Sneakers",/\b(sneakers?|shoes?|trainers?|baskets?|footwear|runners?|jordan\s?\d|dunk|air[\s-]?max|air[\s-]?force|samba|gazelle|campus|superstar|yeezy|ultraboost|vomero|pegasus|gel[\s-])\b/],
["couvre-chef","Casquettes & bonnets",/\b(caps?|hats?|beanies?|bonnets?|casquettes?|chapeaux?|bucket[\s-]?hats?|headbands?|bandanas?|balaclavas?|brimmers?|5[\s-]?panel)\b/],
["maison","Maison & cuisine",/\b(kettles?|cooksets?|cookware|ladles?|bowls?|dispensers?|benches?|tool[\s-]?sets?|barista|flasks?|candles?|incense|ashtrays?|grinders?|vases?|candlesticks?|placemats?|lamps?|mirrors?|clocks?|tumblers?|quencher)\b/],
["skate","Skate",/\b(decks?|wheels?|trucks?|griptapes?|skateboards?|bearings?)\b/],
["sac","Sacs",/\b(bags?|backpacks?|totes?|sacs?|pouches?|sacoches?|hip[\s-]?bags?|bum[\s-]?bags?|luggage|valises?)\b/],
["ceinture","Ceintures",/\b(belts?|ceintures?)\b/],
["portefeuille","Portefeuilles",/\b(wallets?|cardholders?|portefeuilles?|card[\s-]?holders?)\b/],
["lunettes","Lunettes",/\b(sunglasses|lunettes|eyewear)\b/],
["bijou","Montres & bijoux",/\b(watches|montres?|jewell?ery|bracelets?|necklaces?|colliers?|earrings?|rings?|bagues?|cha[iî]nes?)\b/],
["echarpe-gants","Écharpes & gants",/\b(scarfs?|scarves|écharpes?|echarpes?|gloves?|gants?|mittens?|moufles?)\b/]
];
var TY_NAME={};
TYPES.forEach(function(t){TY_NAME[t[0]]=t[1]});
TY_NAME["autre-vet"]="Autres vêtements";TY_NAME["autre-chau"]="Autres chaussures";
TY_NAME["autre-acc"]="Autres accessoires";TY_NAME["autre-sub"]="Autres sous-vêtements";
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

/* Stockage local : une écriture refusée (quota plein, navigation privée) ne
   doit pas passer sous silence. On libère d'abord ce qui est reconstruit au
   relevé suivant, on réessaie, puis on prévient visiblement si ça échoue. */
var STORAGE_WARN=false;
function storageWarn(){
if(STORAGE_WARN)return;
STORAGE_WARN=true;
var w=document.getElementById("warn");
if(!w)return;
w.style.display="";
w.innerHTML+=(w.innerHTML?"<br>":"")+"⚠ Mémoire du navigateur pleine : favoris, alertes et préférences ne sont plus enregistrés.";
}
function ls(k,v){
if(v===undefined){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
try{localStorage.setItem(k,JSON.stringify(v))}
catch(e){
try{
localStorage.removeItem("snap");
localStorage.removeItem("view");
localStorage.setItem(k,JSON.stringify(v));
}catch(e2){storageWarn();return null}
}
}
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
function savePrefs(){ls("prefs",{cat:CAT,gen:GEN,ty:TYPE,tri:$("tri").value,sz:Object.keys(SZ),br:Object.keys(BR),b:$("boutique").value,r:+$("remise").value,pm:$("pmax").value,re:onlyRE,new:onlyNew,drop:onlyDrop,top:onlyTop,vis:onlyVisite,dup:DEDUP})}
function loadPrefs(){
var p=ls("prefs");
if(!p)return;
if(["all","vet","chau","tee","sub","acc"].indexOf(p.cat)>=0)CAT=p.cat;
if(["all","femme","homme","mixte"].indexOf(p.gen)>=0)GEN=p.gen;
if(typeof p.ty==="string")TYPE=p.ty;
if(["remise","prix","prixd","pepite"].indexOf(p.tri)>=0)$("tri").value=p.tri;
(p.sz||[]).forEach(function(s){SZ[s]=1});
(p.br||[]).forEach(function(b){BR[b]=1});
if(typeof p.b==="string")$("boutique").value=p.b;
if(p.r)$("remise").value=String(p.r);
if(p.pm!==undefined&&p.pm!==null)$("pmax").value=p.pm;
onlyRE=!!p.re;onlyNew=!!p.new;onlyDrop=!!p.drop;onlyTop=!!p.top;onlyVisite=!!p.vis;
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
/* Type fin d'un article, déduit du titre, du rayon et des étiquettes de la
   boutique. Aucun signal : « Autres … » plutôt qu'un type inventé. */
function typeCat(x){
var t=((x.cat||[]).join(" ")).toLowerCase();
if(/footwear|shoes|sneakers?/.test(t))return "chau";
if(/accessor|headwear|bags?|socks|caps?|hats?/.test(t))return "acc";
if(/underwear|lingerie/.test(t))return "sub";
return "vet";
}
function typeOf(x){
if(x._ty)return x._ty;
var txt=((x.nom||"")+" "+pathOf(x).replace(/[-_\/.]/g," ")+" "+((x.cat||[]).join(" "))).toLowerCase();
var ty=null;
for(var i=0;i<TYPES.length&&!ty;i++)if(TYPES[i][2].test(txt))ty=TYPES[i][0];
if(!ty)ty="autre-"+typeCat(x);
x._ty=ty;return ty;
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
/* Prix par taille. Un prix de taille n'est repris du prix de l'article que si
   aucune variante n'en donne : sinon toutes les tailles sembleraient au même
   prix, alors que la boutique les vend à des prix différents. */
function sizePriceMap(x){
if(x._spm)return x._spm;
var map={},has=false;
var by=sizeOfferList(x);
Object.keys(by).forEach(function(k){if(by[k].length){map[k]=by[k][0].prix;has=true}});
if(!has&&typeof x.prix==="number"&&x.prix>0){
uniqueRawSizes(x).forEach(function(sz){map[sz]=x.prix});
}
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
el.innerHTML='<div class="lbl">'+label+'</div><div class="tabs tabs-h">'+arr.map(function(t){return '<button type="button" class="chip sz'+(SZ[t]?" on":"")+'" data-s="'+t+'" aria-pressed="'+(SZ[t]?"true":"false")+'">'+t+'</button>'}).join("")+'</div>';
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
se.innerHTML='<div class="lbl">Système de pointures</div><div class="tabs tabs-h">'+sys.map(function(k){return '<button type="button" class="chip sys'+(k===SYS?" on":"")+'" data-y="'+k+'" aria-pressed="'+(k===SYS)+'">'+k+'</button>'}).join("")+'</div>';
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
return '<button type="button" class="brand-row'+(BR[k]?" on":"")+'" data-b="'+esc(k)+'" aria-pressed="'+(BR[k]?"true":"false")+'"><span>'+esc(BRNAME[k]||k)+'</span><span class="cnt">'+(BRCNT[k]||0)+'</span></button>';
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
return '<button type="button" class="chip catb'+(c[0]===CAT?" on":"")+'" data-c="'+c[0]+'" aria-pressed="'+(c[0]===CAT)+'">'+c[1]+'</button>';
}).join("");
renderTypes();
renderGens();
}
function typeCounts(){
var c={};
D.forEach(function(x){
if(CAT!=="all"&&catOf(x)!==CAT)return;
var t=typeOf(x);
c[t]=(c[t]||0)+1;
});
return c;
}
/* Seuls les types les plus fournis restent affichés : le tiroir doit rester
   court. Le type choisi reste visible même replié, et une puce ouvre le reste. */
var TYPE_MORE=false,TYPE_MAIN=8;
function renderTypes(){
var el=$("types");
if(!el)return;
var c=typeCounts();
if(TYPE!=="all"&&!c[TYPE])TYPE="all";
var ks=Object.keys(c).sort(function(a,b){return c[b]-c[a]});
if(!ks.length){el.innerHTML="";return}
var main=ks.slice(0,TYPE_MAIN);
if(TYPE!=="all"&&main.indexOf(TYPE)<0)main.push(TYPE);
var hidden=ks.filter(function(k){return main.indexOf(k)<0});
var shown=TYPE_MORE?ks:main;
var tot=0;ks.forEach(function(k){tot+=c[k]});
var h='<button type="button" class="chip tyb'+(TYPE==="all"?" on":"")+'" data-t="all" aria-pressed="'+(TYPE==="all")+'">Tout<span class="gcnt">'+tot+'</span></button>';
h+=shown.map(function(k){
return '<button type="button" class="chip tyb'+(TYPE===k?" on":"")+'" data-t="'+k+'" aria-pressed="'+(TYPE===k)+'">'+esc(TY_NAME[k]||k)+'<span class="gcnt">'+c[k]+'</span></button>';
}).join("");
if(hidden.length){
h+='<button type="button" class="chip ty-more" id="tyMore" aria-expanded="'+TYPE_MORE+'">'+(TYPE_MORE?"Moins de types":"Plus de types ("+hidden.length+")")+'</button>';
}
el.innerHTML=h;
var more=$("tyMore");
if(more)more.addEventListener("click",function(){TYPE_MORE=!TYPE_MORE;renderTypes();var b=$("tyMore");if(b&&b.focus)b.focus()});
}
function renderGens(){
var el=$("gens");
if(!el)return;
var cnt={all:0,femme:0,homme:0,mixte:0};
D.forEach(function(x){
if(CAT!=="all"&&catOf(x)!==CAT)return;
if(TYPE!=="all"&&typeOf(x)!==TYPE)return;
cnt.all++;cnt[genOf(x)]++;
});
el.innerHTML=[["all","Tout"],["femme","Femme"],["homme","Homme"],["mixte","Unisexe"]].map(function(g){
return '<button type="button" class="chip genb'+(GEN===g[0]?" on":"")+'" data-g="'+g[0]+'" aria-pressed="'+(GEN===g[0])+'">'+g[1]+'<span class="gcnt">'+cnt[g[0]]+'</span></button>';
}).join("");
}
function syncChips(){
[["cVisite",onlyVisite],["cNew",onlyNew],["cDrop",onlyDrop],["cTop",onlyTop],["cRE",onlyRE],["cDup",DEDUP]].forEach(function(p){
var el=$(p[0]);
if(!el)return;
el.className="chip"+(p[1]?" on":"");
el.setAttribute("aria-pressed",p[1]?"true":"false");
});
}
function toggleDup(){DEDUP=!DEDUP;syncChips();apply()}
function setBd(id,n){var e=$(id);if(!e)return;e.textContent=n;e.style.display=n?"":"none"}
function actives(){
var a=[];
var q=$("q").value.trim();
if(q)a.push(["q","","“"+q+"”"]);
if(CAT!=="all")a.push(["cat","",CL[CAT]]);
if(TYPE!=="all")a.push(["type","",TY_NAME[TYPE]||TYPE]);
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
if(TYPE!=="all")n++;
if(GEN!=="all")n++;
if($("boutique").value)n++;
if(+$("remise").value)n++;
if($("pmax").value)n++;
if(Object.keys(SZ).length)n++;
if(Object.keys(BR).length)n++;
if(onlyFav)n++;
if(onlyNew)n++;
if(onlyDrop)n++;
if(onlyTop)n++;
if(onlyRE)n++;
if(onlyVisite)n++;
if($("tri").value!=="remise")n++;
var fb=$("fBtn");
if(fb)fb.innerHTML="≡"+(n?'<b class="n">'+n+"</b>":"");
if(fb)fb.className="sqbtn"+(n?" on":"");
syncQuick();
updTabs();
setBd("bd1",(CAT!=="all"?1:0)+(TYPE!=="all"?1:0)+(GEN!=="all"?1:0)+(onlyFav?1:0)+(onlyNew?1:0)+(onlyDrop?1:0)+(onlyTop?1:0)+(onlyRE?1:0)+(onlyVisite?1:0));
setBd("bd2",($("boutique").value?1:0)+(+$("remise").value?1:0)+($("pmax").value?1:0)+($("tri").value!=="remise"?1:0));
setBd("bd3",Object.keys(SZ).length+Object.keys(BR).length+(PROFIL_FILTER?1:0));
var pn=$("pmNote");
if(pn){var sk=Object.keys(SZ);pn.textContent=sk.length===1?"Prix de la taille "+sk[0]+" uniquement":""}
renderPills();
updHomeBtn();
}
function smartHome(){
if(sheetOpen())closeSheet();
if(drawerOpen())closePanel();
var hasAct=actives().length>0||$("tri").value!=="remise";
if(hasAct){
resetAll();
/* resetAll amène aux résultats : on remonte d'un coup, sans animer depuis
   le bas de la page. */
window.scrollTo({top:0,behavior:"auto"});
}else{
window.scrollTo({top:0,behavior:"smooth"});
}
}
function keepView(force){
var el=$("n");
if(!el)return;
var top=el.getBoundingClientRect().top+window.scrollY-$("bar").offsetHeight-6;
if(top<0)top=0;
if(force||window.scrollY>top)window.scrollTo(0,top);
}
/* Après un filtre, une recherche ou un changement d'onglet, amener les
   résultats sous les yeux : le repère est le titre « Toutes les promos »,
   pas le haut de l'accueil, qui laisse les sections éditoriales au-dessus. */
function scrollToTopResults(){
try{localStorage.removeItem("view")}catch(e){}
var el=$("resH"),bar=$("bar");
if(!el){window.scrollTo(0,0);return}
var target=Math.max(0,el.getBoundingClientRect().top+window.scrollY-(bar?bar.offsetHeight:0)-8);
window.scrollTo({top:target,behavior:"auto"});
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
PROFILE_TAB=false;
$("drawer").className="open";
$("fBtn").setAttribute("aria-expanded","true");
document.body.style.overflow="hidden";
$("panel").scrollTop=0;
renderProfileSection();
updBtn();
if(hs===0)pushO();
}
function hidePanel(forceTop){
PROFILE_TAB=false;
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
M={};
D.forEach(function(x){
M[x.lien]=x;
catOf(x);
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
renderCats();renderProfileSection();buildSizes();buildBrands();favCount();renderHome();
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
function run(){loadHistory().then(function(){annotateBasSuivi();renderSelection();renderTrending()})}
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
/* Une recherche se lit dans la grille : on y va dès qu'un mot est saisi,
   sinon le champ, collé en haut, semble ne rien faire. */
function onSearch(){clearTimeout(tm);tm=setTimeout(function(){apply(true,!!$("q").value.trim())},100)}
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
SZ={};BR={};CAT="all";GEN="all";TYPE="all";TYPE_MORE=false;SYS="EU";BRQ="";onlyFav=false;onlyNew=false;onlyDrop=false;onlyTop=false;onlyRE=false;onlyVisite=false;
PROFIL_FILTER=false;ls("profFiltre",false);
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
else if(k==="cat"){CAT="all";TYPE_MORE=false;pruneSZBR();renderCats();buildSizes();buildBrands()}
else if(k==="gen")GEN="all";
else if(k==="type"){TYPE="all";renderCats()}
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
TYPE_MORE=false;
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
var ty=e.target.closest(".tyb");
if(ty){TYPE=ty.getAttribute("data-t")||"all";renderCats();apply();return}
var s=e.target.closest(".sz");
if(s){
var k=s.getAttribute("data-s");
if(SZ[k]){delete SZ[k];s.classList.remove("on")}else{SZ[k]=1;s.classList.add("on")}
s.setAttribute("aria-pressed",SZ[k]?"true":"false");
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
return {q:$("q").value.trim(),cat:CAT,type:TYPE,gen:GEN,b:$("boutique").value,r:+$("remise").value,pm:isNaN(pm)?null:pm,sz:Object.keys(SZ),br:Object.keys(BR),re:onlyRE};
}
function pass(x,F,relax){
if(F.cat!=="all"&&catOf(x)!==F.cat)return false;
if(F.type&&F.type!=="all"&&typeOf(x)!==F.type)return false;
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
TYPE=(F.type&&TY_NAME[F.type])?F.type:"all";
GEN=(F.gen&&GEN_NAMES[F.gen])?F.gen:"all";
SZ={};(F.sz||[]).forEach(function(s){SZ[s]=1});
BR={};(F.br||[]).forEach(function(b){BR[b]=1});
onlyRE=!!F.re;onlyFav=false;onlyNew=false;onlyDrop=false;onlyTop=false;onlyVisite=false;
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

/* =====================================================================
   Éditorial : stories de la semaine, tuiles de catégories, trending et
   histoires des marques. Aucune donnée inventée côté prix : tout vient de
   data/promos.json. Les textes d'histoire sont des repères de culture
   streetwear, rattachés à la marque quand on la connaît, sinon au type.
   ===================================================================== */
var STORIES=[
{img:"img/story-vente.jpg",tag:"Black Friday",t:"Jusqu’à −70 % sur le stock",p:"Les cinq boutiques vident les rayons. Sneakers, doudounes, hoodies : on a trié les remises qui tiennent vraiment debout, pas les prix barrés de façade.",cta:"Foncer sur les remises",f:{r:50}},
{img:"img/story-rue.jpg",tag:"Sneakers",t:"La paire qui fait le look",p:"Une silhouette, une semelle, et tout le reste suit. Les runners et les basses sont descendues sous les 100 € chez plusieurs boutiques — de quoi changer de paire sans pleurer.",cta:"Voir les sneakers en promo",f:{cat:"chau",type:"sneaker",r:20}},
{img:"img/story-basket.jpg",tag:"Basket & ciné",t:"Du parquet à la rue",p:"Jordan a fait d’une chaussure de basket un objet de cinéma. Les rééditions sont là, et certaines ne resteront pas longtemps à ce prix.",cta:"Le vestiaire Jordan",f:{q:"jordan"}},
{img:"img/story-anime.jpg",tag:"Manga & néon",t:"Tokyo dans tes pieds",p:"Les runners japonaises ont la cote dans les mangas et les clips. Gel, mesh, coloris gris : la paire parfaite pour les journées où tu ne veux pas choisir.",cta:"Explorer le Japon",f:{q:"asics"}},
{img:"img/story-skate.jpg",tag:"Skate",t:"Le béton n’est pas mort",p:"Planches, casquettes et bas larges : le skate garde son vocabulaire. Les promos sont discrètes, mais les pièces solides valent le détour.",cta:"Voir le skate",f:{type:"skate"}}
];
var TILES=[
["chau","sneaker","Sneakers"],
["vet","veste","Vestes"],
["vet","manteau","Manteaux"],
["vet","pantalon","Pantalons"],
["tee","tshirt","T-shirts"],
["vet","sweat","Sweats"],
["vet","chemise","Chemises"],
["acc","sac","Sacs"],
["acc","couvre-chef","Casquettes"],
["chau","botte","Bottes"]
];
var HISTOIRES={
"nike":{w:"Nike n’est pas née dans un bureau mais sur une piste d’athlétisme, à Eugene, avec un coach qui voulait de meilleures chaussures pour ses coureurs.",who:"Phil Knight et Bill Bowerman, 1964. La virgule arrive en 1971, dessinée par Carolyn Davidson.",what:"Basket, running, skate, cinéma : une Air Max se raconte autant par sa bulle visible que par les clips rap des années 2000.",t:[[1964,"Blue Ribbon"],[1972,"Cortez"],[1987,"Air Max 1"]],q:"« Just do it » n’a jamais été une promesse de victoire : juste un ordre de se lever.",m:"Running & culture"},
"jordan":{w:"Une marque créée pour un joueur qui n’avait pas le droit de porter ses propres couleurs en NBA. La polémique a fait le reste.",who:"Nike et Michael Jordan, 1984. Tinker Hatfield signe ensuite une grande partie des silhouettes qui comptent.",what:"Basket, skate, manga : la Air Jordan 1 est devenue une toile blanche pour les collabs, les clips et les terrains extérieurs.",t:[[1984,"Contrat Nike"],[1985,"Air Jordan 1"],[2020,"Rééditions"]],q:"« Interdite par la NBA » : la légende a mieux marché que la chaussure. Les historiens accusent plutôt l’Air Ship.",m:"Basket & rue"},
"adidas":{w:"Trois bandes nées dans une petite ville bavaroise, devenues l’uniforme du hip-hop puis du football.",who:"Adi Dassler, 1949. La famille s’est séparée : Puma est née de l’autre côté de la rivière.",what:"Run-DMC signe avec la marque en 1986 sans porter de logo, juste des Superstar et des lacets sans boucle. Le rap fait le reste.",t:[[1949,"Création"],[1969,"Superstar"],[2022,"Retour Samba"]],q:"« My Adidas » : un groupe de rap a transformé une chaussure de basket en hymne, et la marque a signé.",m:"Hip-hop & terrain"},
"new balance":{w:"Une marque de Boston qui a mis trente ans à devenir cool sans changer de discours : du confort, des largeurs, pas de hype.",who:"Fondée en 1906 sous le nom New Balance Arch Company ; la 990 arrive en 1982, fabriquée aux États-Unis.",what:"Running, dad-shoe assumée, cinéma indé : la 990 et la 1906R sont devenues des pièces de costume pour personnages sérieux.",t:[[1906,"Boston"],[1982,"990"],[2022,"1906R"]],q:"Le gris New Balance n’est pas une couleur, c’est un argument : il va avec tout, même un manteau trop grand.",m:"Running & cinéma"},
"asics":{w:"Asics vient d’un homme qui fabriquait des chaussures de basket dans son salon à Kobe, en 1949.",who:"Kihachiro Onitsuka. Le nom vient de la phrase latine « Anima Sana In Corpore Sano ».",what:"Japon, manga et running : la Gel-Kayano naît en 1993, la Gel-NYC ramène les codes 2000 dans la rue.",t:[[1949,"Kobe"],[1993,"Gel-Kayano"],[2023,"Gel-NYC"]],q:"La semelle Gel était une innovation de course avant d’être un accessoire de style. Personne ne l’a vue venir.",m:"Japon & running"},
"salomon":{w:"Une marque de ski d’Annecy qui a inventé une chaussure de trail, puis l’a vue débarquer dans les looks techwear.",who:"Georges Salomon, 1947, Annecy. Le XT-6 sort en 2013 comme chaussure de trail, puis revient en 2018 dans la gamme Sportstyle.",what:"Randonnée, techno, manga : la silhouette anguleuse plaît aux jeux vidéo et aux clips, sans campagne publicitaire.",t:[[1947,"Annecy"],[2013,"S/LAB XT-6"],[2018,"Sportstyle"]],q:"Personne n’avait prévu qu’une chaussure de trail devienne un signe de reconnaissance en boîte.",m:"Trail & techwear"},
"hoka":{w:"Deux Français installés en Californie voulaient courir plus vite en descente. Ils ont fait des semelles énormes.",who:"Jean-Luc Diard et Nicolas Mermoud, 2009. Le nom vient du maori : « hoka » pour voler, « one one » pour la terre.",what:"Ultra-trail, marche urbaine, uniforme de lycéen américain : la Clifton est devenue une chaussure de tous les jours.",t:[[2009,"Création"],[2014,"Clifton"],[2023,"Bondi en ville"]],q:"La Hoka ressemble à une blague. Puis tu la portes une journée et tu comprends.",m:"Trail & ville"},
"converse":{w:"Une marque de caoutchouc de 1908 devenue la chaussure des salles de basket, puis des groupes de rock.",who:"Marquis Mills Converse. Chuck Taylor, vendeur puis ambassadeur depuis 1922, signe la All Star en 1934.",what:"Punk, grunge, skate, cinéma : la Chuck 70 est sur scène depuis plus longtemps que la plupart des groupes.",t:[[1908,"Création"],[1934,"Signature Chuck"],[2013,"Chuck 70"]],q:"La All Star n’a jamais été une chaussure de performance. C’est une chaussure de scène.",m:"Rock & skate"},
"the north face":{w:"Deux alpinistes de San Francisco voulaient du matériel qui tienne en haute altitude. Le nom vient de la face la plus froide d’une montagne.",who:"Douglas Tompkins, 1966. La Nuptse sort en 1992 et devient une veste de rue dix ans plus tard.",what:"Rap new-yorkais des 90’s, ski, cinéma : la doudoune oversize est devenue un uniforme d’hiver.",t:[[1966,"San Francisco"],[1992,"Nuptse"],[2020,"Retour puffer"]],q:"Une veste d’expédition devenue veste de clip : c’est la meilleure publicité jamais payée par personne.",m:"Montagne & hip-hop"},
"carhartt wip":{w:"Carhartt habille les chantiers américains depuis 1889. La version européenne, WIP, a pris le vêtement de travail et l’a coupé plus près du corps.",who:"Hamilton Carhartt, 1889 ; Work In Progress naît en 1994 à Paris.",what:"Skate, rap, techno : le Detroit Jacket et le pantalon double genou sont devenus des pièces de vestiaire, pas de déguisement.",t:[[1889,"Détroit"],[1994,"WIP"],[2010,"Detroit Jacket"]],q:"La toile est si rigide au début qu’elle tient debout toute seule. C’est exactement le but.",m:"Chantier & skate"},
"dickies":{w:"Un pantalon de travail texan de 1922, devenu le pantalon des skateurs de Los Angeles parce qu’il ne coûtait rien et ne cassait pas.",who:"C.N. Williamson et E.E. Dickie, 1922. Le 874 arrive en 1967.",what:"Skate, rap West Coast, cinéma : le 874 est le pantalon le plus discret du dressing streetwear.",t:[[1922,"Texas"],[1967,"874"],[1990,"Skate"]],q:"Le 874 n’a jamais été pensé pour le style. C’est peut-être pour ça qu’il a traversé cinquante ans.",m:"Skate & travail"},
"puma":{w:"Puma est née d’une brouille de famille : deux frères, une usine, deux marques concurrentes.",who:"Rudolf Dassler, 1948. La Suede sort en 1968, la Speedcat vient du sport automobile.",what:"Basket, hip-hop, F1 : la Mostro et la Speedcat reviennent par les clips et les podiums.",t:[[1948,"Création"],[1968,"Suede"],[2024,"Speedcat"]],q:"Deux frères fâchés ont créé deux empires. La ville de Herzogenaurach en parle encore.",m:"Sport & clips"},
"birkenstock":{w:"Une chaussure orthopédique allemande de 1774 devenue l’objet le plus copié du vestiaire cool.",who:"Famille Birkenstock. L’Arizona date de 1973, le Boston est devenu un incontournable en 2020.",what:"Rock, skate, paparazzi : Kate Moss en chaussettes dans des Birkenstock a suffi à changer la réputation.",t:[[1774,"Allemagne"],[1973,"Arizona"],[2020,"Boston"]],q:"Le confort a mis deux siècles à devenir tendance. Maintenant, tout le monde marche dessus.",m:"Confort & rue"},
"ugg":{w:"Des bottes en peau de mouton portées par les surfeurs californiens pour se réchauffer après l’eau.",who:"Brian Smith, 1978, à Santa Monica. Le nom viendrait de « ugly ».",what:"Surf, paparazzi des années 2000, retour en 2022 : la Classic est passée de la plage au tapis rouge.",t:[[1978,"Californie"],[2000,"Paparazzi"],[2022,"Retour"]],q:"On l’appelait « ugly ». Trente ans plus tard, tout le monde en porte.",m:"Surf & pop"},
"levi's":{w:"Un tailleur de San Francisco et un drapier ont ajouté des rivets à un pantalon de travail. Le jean était né.",who:"Levi Strauss et Jacob Davis, brevet en 1873. Le 501 est devenu le modèle de référence.",what:"Western, rock, hip-hop : le 501 est le seul vêtement qui a traversé tous les genres musicaux sans changer.",t:[[1873,"Brevet"],[1890,"501"],[1936,"Red Tab"]],q:"Un pantalon de mineur devenu uniforme de rock star. Aucune marque n’a fait mieux avec moins.",m:"Denim & musique"},
"stone island":{w:"Massimo Osti voulait teindre des tissus militaires et en faire des vêtements. La boussole est devenue un signe de reconnaissance.",who:"Massimo Osti, 1982, Bologne. L’Ice Jacket change de couleur avec la température.",what:"Casuals anglais, rap, techwear : le badge amovible se collectionne autant que la veste.",t:[[1982,"Bologne"],[1989,"Ice Jacket"],[2011,"Ghost"]],q:"Le badge s’enlève. C’est justement pour ça que tout le monde le reconnaît.",m:"Casuals & techwear"},
"cp company":{w:"Chester Perry devient C.P. Company en 1978 : des vêtements d’ouvrier teints à la main, puis des pièces techniques.",who:"Massimo Osti encore lui, puis les équipes de la marque. La Mille Miglia date de 1988.",what:"Casuals, football, photographie italienne : les vestes aux lunettes intégrées sont devenues culte.",t:[[1971,"Chester Perry"],[1978,"C.P. Company"],[1988,"Mille Miglia"]],q:"Des vestes conçues pour observer : c’est presque une déclaration d’intention.",m:"Casuals & Italie"},
"off-white":{w:"Virgil Abloh a transformé un site de mode en marque, avec des guillemets comme signature.",who:"Virgil Abloh, 2012. « The Ten » avec Nike en 2017 a changé la façon dont les sneakers se racontent.",what:"Rap, design, architecture : le zip-tie et le texte entre guillemets sont devenus un langage.",t:[[2012,"Milan"],[2017,"The Ten"],[2021,"Héritage"]],q:"Mettre un mot entre guillemets, c’était déjà une façon de dire que tout est une citation.",m:"Mode & rap"},
"essentials":{w:"La ligne plus simple de Fear of God, pensée pour porter large sans réfléchir.",who:"Jerry Lorenzo, 2018, Los Angeles. Fear of God est née en 2013.",what:"Rap californien, tunnel walk NBA, gym : le hoodie beige est devenu un uniforme.",t:[[2013,"Fear of God"],[2018,"Essentials"],[2023,"Rééditions"]],q:"Une ligne sans logo, et pourtant reconnaissable à dix mètres. C’est fort.",m:"Rap & basket"},
"casablanca":{w:"Une marque française qui mélange le tennis, le luxe et les couleurs des années 70.",who:"Charaf Tajer, 2018, Paris. Le nom vient de la ville natale de sa famille.",what:"Tennis, cinéma, jet-set : les maillots en soie sont faits pour les clips et les vacances.",t:[[2018,"Paris"],[2020,"Tennis"],[2022,"Maison"]],q:"Le tennis country-club, mais version après-minuit. C’est toute la blague.",m:"Tennis & luxe"},
"gramicci":{w:"Un grimpeur californien voulait un pantalon qui ne le bloque pas quand il lève la jambe.",who:"Mike Graham, grimpeur des Stonemasters, 1982, Ventura (Californie). La G-Pant arrive en 1988 avec sa ceinture intégrée.",what:"Grimpe, skate, Japon : la G-Pant est devenue un basique du vestiaire outdoor.",t:[[1982,"Yosemite"],[1988,"G-Pant"],[2020,"Retour"]],q:"La ceinture tissée vient d’une contrainte d’escalade. Aujourd’hui, c’est un détail de style.",m:"Outdoor & skate"},
"balenciaga":{w:"Une maison de couture espagnole transformée en laboratoire de la mode de rue par Demna.",who:"Cristóbal Balenciaga, 1917 ; Demna arrive en 2015. La Triple S sort en 2017.",what:"Rap, paparazzi, jeux vidéo : la sneaker la plus lourde du marché est devenue un mème assumé.",t:[[1917,"Couture"],[2015,"Demna"],[2017,"Triple S"]],q:"Faire une chaussure volontairement trop grosse, c’était une blague. Puis tout le monde a suivi.",m:"Couture & rue"},
"dior":{w:"La maison du New Look a mis des années avant de faire des sneakers, puis a rattrapé le temps très vite.",who:"Christian Dior, 1947. La B23 et la B30 arrivent avec Kim Jones, de 2018 à aujourd’hui.",what:"Musique, art, cinéma : les sneakers de maison sont devenues des pièces de soirée.",t:[[1947,"New Look"],[2018,"B23"],[2021,"B30"]],q:"Le tailleur-bar a fait la maison. La sneaker a fait la file d’attente.",m:"Couture & musique"},
"louis vuitton":{w:"Un malletier parisien de 1854 devenu, avec Virgil Abloh, la maison la plus regardée du rap.",who:"Louis Vuitton, 1854 ; Virgil Abloh dirige le prêt-à-porter de 2018 à 2021.",what:"Rap, basket, art contemporain : le monogramme est un fond d’écran avant d’être un logo.",t:[[1854,"Malle"],[2018,"Virgil"],[2021,"Héritage"]],q:"Le monogramme a traversé deux siècles, y compris les clips où il n’avait pas le droit d’apparaître.",m:"Luxe & rap"},
"ami paris":{w:"Une marque parisienne qui voulait habiller les gens dans la rue, pas sur un podium.",who:"Alexandre Mattiussi, 2011, Paris. Le logo est un cœur avec un A.",what:"Cinéma, photo de rue : la maille et la veste en jean ont remplacé le costume.",t:[[2011,"Paris"],[2013,"Cœur A"],[2020,"International"]],q:"Un cœur dessiné à la main sur un sweat : c’est tout le programme.",m:"Paris & cinéma"},
"jacquemus":{w:"Une marque née d’un hommage familial, devenue la plus solaire du vestiaire français.",who:"Simon Porte Jacquemus, 2008, Marseille. Les mini-sacs ont fait le tour du monde.",what:"Photo, clips, Provence : les défilés dans les champs de lavande sont devenus des images.",t:[[2008,"Marseille"],[2018,"Mini sac"],[2023,"Provence"]],q:"Faire défiler dans un champ, c’était moins cher qu’un studio et beaucoup plus mémorable.",m:"Provence & photo"},
"billionaire boys club":{w:"Pharrell et Nigo ont fait une marque qui ressemble à un vaisseau spatial et à un magazine de skate.",who:"Pharrell Williams et Nigo, 2003. Ice Cream est la ligne sœur.",what:"Rap, skate, manga : le logo astronaute est devenu un signe des années 2000.",t:[[2003,"BBC"],[2004,"Ice Cream"],[2020,"Retour"]],q:"Une marque de rap avec des motifs de dessin animé : personne ne faisait ça en 2003.",m:"Rap & manga"},
"skims":{w:"De la lingerie pensée pour toutes les morphologies, devenue une marque de superpositions.",who:"Kim Kardashian, 2019. Le nom a remplacé « Kimono » après une polémique.",what:"Télé-réalité, sport, tapis rouge : la robe gainante est devenue une pièce de tous les jours.",t:[[2019,"Lancement"],[2021,"Sport"],[2023,"Homme"]],q:"Le vêtement qui se porte sous tout a fini par se porter comme tout.",m:"Pop & silhouette"},
"type:sneaker":{w:"La sneaker est née sur les pistes d’athlétisme avant de devenir la chaussure de tous les jours. Sa forme raconte une époque : la course, le basket, le skate.",who:"Chaque marque a sa lignée : running américain, basket, trail français. La silhouette dit souvent d’où elle vient.",what:"Le rap l’a mise en vitrine, le skate l’a usée, le cinéma l’a rendue iconique.",t:[[1917,"Caoutchouc"],[1987,"Bulle visible"],[2020,"Retour runner"]],q:"Une sneaker se juge d’abord à sa semelle. Le reste, c’est de la littérature.",m:"Running & rue"},
"type:veste":{w:"La veste est la pièce qui protège et qui signe une silhouette. Une épaule, une poche, et tout change.",who:"Du blouson d’aviateur à la veste de travail, chaque modèle vient d’un besoin concret.",what:"Cinéma, musique, skate : la veste est le vêtement qu’on remarque avant le visage.",t:[[1931,"Aviateur"],[1980,"Workwear"],[2020,"Techwear"]],q:"Une bonne veste ne se choisit pas à sa couleur mais à ce qu’elle fait de tes épaules.",m:"Extérieur & cinéma"},
"type:manteau":{w:"Le manteau est né d’un problème de froid, pas d’un problème de style. C’est ce qui le rend si facile à porter.",who:"Parkas militaires, doudounes d’alpinisme, trenchs de ville : trois écoles, trois façons de se couvrir.",what:"Le hip-hop des années 90 a fait de la doudoune oversize un uniforme, et le cinéma n’a jamais arrêté de filmer des trenchs.",t:[[1914,"Trench"],[1992,"Nuptse"],[2020,"Puffer"]],q:"Un manteau trop grand, c’est un manteau qui a de la place pour l’histoire.",m:"Hiver & hip-hop"},
"type:sweat":{w:"Le sweat vient du sport universitaire américain : une maille épaisse pour transpirer, puis pour traîner.",who:"Les équipements d’athlétisme des années 30, puis le hoodie, devenu uniforme de la rue.",what:"Rock, skate, rap : le hoodie est le vêtement le plus politique du dressing, et le plus confortable.",t:[[1930,"Sport"],[1970,"Hoodie"],[1990,"Rue"]],q:"Le hoodie a été interdit dans des centres commerciaux. Ça en dit long sur son pouvoir.",m:"Sport & rue"},
"type:tshirt":{w:"Le t-shirt est un sous-vêtement militaire devenu la première surface d’expression du siècle.",who:"Les soldats américains l’ont ramené d’Europe ; les marques l’ont imprimé dans les années 50.",what:"Punk, rap, manga : un t-shirt est un flyer qu’on porte.",t:[[1913,"Sous-vêtement"],[1950,"Imprimé"],[1990,"Logo"]],q:"Un t-shirt coûte trois fois rien et dit tout de toi. C’est le meilleur rapport qualité-prix de la culture.",m:"Musique & logos"},
"type:pantalon":{w:"Le pantalon de travail est la base de tout vestiaire streetwear : solide, large, avec des poches utiles.",who:"Carhartt, Dickies, Levi’s : trois héritages ouvriers devenus des références de style.",what:"Skate, rap West Coast, chantier : le pantalon raconte ce qu’on fait de sa journée.",t:[[1873,"Denim"],[1967,"874"],[1990,"Skate"]],q:"Un pantalon de travail porte ses traces. C’est pour ça qu’on les collectionne.",m:"Travail & skate"},
"type:short":{w:"Le short est né du sport et de la chaleur. Sa longueur dit presque tout de la décennie.",who:"Basket, running, surf : chaque discipline a imposé sa coupe.",what:"Basket des 90’s, skate, cinéma d’été : le short long est revenu, puis le court aussi.",t:[[1930,"Sport"],[1990,"Baggy"],[2020,"Retour court"]],q:"La longueur du short est le seul vrai indicateur de l’époque où une photo a été prise.",m:"Sport & été"},
"type:chemise":{w:"La chemise est un vêtement de bureau que le streetwear a emprunté pour le porter ouvert, froissé, trop grand.",who:"Flanelle, oxford, overshirt : trois épaisseurs pour trois saisons.",what:"Grunge, hip-hop, cinéma : la chemise ouverte sur un t-shirt est un classique qui ne meurt pas.",t:[[1920,"Oxford"],[1990,"Grunge"],[2020,"Overshirt"]],q:"Une chemise trop grande vaut mieux qu’une chemise trop sage.",m:"Grunge & rue"},
"type:sac":{w:"Le sac est le seul accessoire qui accompagne vraiment la journée : il doit tenir, pas seulement briller.",who:"Du sac de cours au sac technique, chaque forme vient d’un usage.",what:"Skate, voyage, cinéma : le logo sur une bandoulière est devenu un signe de reconnaissance.",t:[[1950,"Écolier"],[1980,"Banane"],[2020,"Mini sac"]],q:"On juge un sac à ce qu’il contient, mais on le choisit à ce qu’il raconte.",m:"Rue & voyage"},
"type:couvre-chef":{w:"La casquette protège du soleil avant d’être un logo. Sa forme raconte un sport ou un quartier.",who:"Béret militaire, casquette de baseball, bonnet de chantier : trois héritages.",what:"Rap, skate, cinéma : la casquette est devenue une signature, portée à l’envers ou vissée.",t:[[1900,"Baseball"],[1980,"Rap"],[2020,"Y2K"]],q:"Une casquette ne va pas à tout le monde. C’est justement pour ça qu’on la remarque.",m:"Sport & rap"},
"edwin":{w:"Un importateur de jeans américains d’Ueno a fini par couper ses propres denims, parce que les modèles US étaient trop rigides et trop chers pour le marché japonais.",who:"M. Tsunemi, 1947, Tokyo. Le premier jean Edwin sort en 1961 ; le stone wash est développé dans les années 80.",what:"Denim japonais, coupe droite, selvedge arc-en-ciel : Edwin est un pilier du workwear nippon et une référence pour les amateurs de brut.",t:[[1947,"Ueno"],[1961,"Premier jean"],[1980,"Stone wash"]],q:"Le Japon a appris le denim chez les Américains, puis l’a retissé plus dense et plus précis.",m:"Denim & Japon"},
"palm angels":{w:"Un livre photo sur les skateurs de Venice Beach, transformé en marque de streetwear de luxe fabriquée en Italie.",who:"Francesco Ragazzi, 2015, entre Milan et Los Angeles. Le livre « Decoding Palm Culture » date de 2014.",what:"Skate, rap, podiums : la chemise palmée et le sweat au logo oversize sont devenus des pièces de clip.",t:[[2014,"Livre"],[2015,"Marque"],[2019,"Podiums"]],q:"Le skate n’y est pas une tendance : c’est le point de départ du dossier.",m:"Skate & luxe"},
"calvin klein":{w:"Une marque new-yorkaise qui a compris avant les autres qu’un vêtement se vend aussi par la photo qui le montre.",who:"Calvin Klein et Barry Schwartz, 1968, New York. L’underwear arrive en 1982, CK One en 1994.",what:"Noir et blanc, Kate Moss, boxers apparents : Calvin Klein a inventé la mode qu’on montre en dessous.",t:[[1968,"New York"],[1982,"Underwear"],[1994,"CK One"]],q:"Le minimalisme américain, c’est une coupe propre et une photo qui ne pardonne pas.",m:"Minimal & pub"},
"universal works":{w:"Un designer qui a grandi dans le workwear du samedi et les sous-cultures des années 80 voulait des vêtements simples, bien coupés, pas surdesignés.",who:"David Keyte, 2009, Nottingham — première collection montée sur sa table de cuisine.",what:"Chore jackets, pantalons larges, tissus japonais : le vestiaire ouvrier britannique, sans nostalgie.",t:[[2009,"Nottingham"],[2013,"Soho"],[2020,"Boro"]],q:"Faire simple est plus difficile que faire compliqué. Universal Works en a fait une méthode.",m:"Workwear & Midlands"},
"vans":{w:"Deux frères ont ouvert une usine de chaussures en Californie et vendu leur première paire le jour de l’ouverture.",who:"Paul Van Doren et ses associés, 1966, Anaheim. La Era arrive en 1976, la Old Skool en 1977.",what:"Skate, punk, cinéma : la Old Skool et la Slip-On sont devenues des uniformes de lycée et de spot.",t:[[1966,"Anaheim"],[1976,"Era"],[1990,"Skate"]],q:"La semelle gaufrée était une question d’adhérence. Elle est devenue une signature.",m:"Skate & Californie"},
"patagonia":{w:"Un grimpeur qui forgeait ses propres pitons a fini par faire des vêtements pour ne pas abîmer les falaises.",who:"Yvon Chouinard, 1973, Ventura. Chouinard Equipment existe depuis 1957.",what:"Alpinisme, surf, cinéma : la Synchilla et la Retro-X sont devenues des vestes de ville.",t:[[1957,"Pitons"],[1973,"Patagonia"],[2011,"Don’t buy"]],q:"La meilleure veste est celle qu’on garde vingt ans. La marque l’a écrit dans une pub.",m:"Alpinisme & écologie"},
"clarks":{w:"Une marque de chaussures de campagne anglaise qui a copié une botte aperçue au Caire pour en faire un basique de la rue.",who:"Cyrus et James Clark, 1825, Street (Somerset). La Desert Boot arrive en 1950, la Wallabee en 1967.",what:"Mods, britpop, hip-hop : la Wallabee est passée du désert aux clips sans perdre sa semelle crêpe.",t:[[1825,"Somerset"],[1950,"Desert Boot"],[1967,"Wallabee"]],q:"Une semelle en crêpe et deux lacets : personne n’a fait mieux depuis 1950.",m:"Angleterre & hip-hop"},
"a.p.c.":{w:"Un atelier parisien qui a fait du jean brut et du minimalisme une position, pas un style.",who:"Jean Touitou, 1987, Paris. Premier magasin à Tokyo en 1991, à New York en 1993.",what:"Denim japonais, sac demi-lune, musique : A.P.C. habille les gens qui n’aiment pas qu’on les remarque.",t:[[1987,"Paris"],[1991,"Tokyo"],[2018,"Demi-lune"]],q:"Pas de logo, pas de saison spectaculaire : juste une coupe qui tient.",m:"Minimal & denim"},
"supreme":{w:"Une boutique de skate de Lafayette Street devenue la référence de la hype mondiale, sans changer de quartier.",who:"James Jebbia, 1994, New York. Le box logo arrive la même année.",what:"Skate, art, rap : les collabs et les drops du jeudi ont changé la façon dont on achète des vêtements.",t:[[1994,"Lafayette"],[2002,"Collabs"],[2020,"VF Corp"]],q:"Le box logo est un rectangle rouge. C’est aussi l’un des signes les plus puissants du siècle.",m:"Skate & hype"},
"denim tears":{w:"Une marque qui utilise le vêtement pour raconter l’histoire noire américaine, avec une couronne de coton comme emblème.",who:"Tremaine Emory, 2019, New York.",what:"Levi’s, coton, diaspora : chaque collection est un chapitre, pas une saison.",t:[[2019,"New York"],[2020,"Levi’s"],[2023,"Héritage"]],q:"La couronne de coton n’est pas un logo : c’est une phrase.",m:"Histoire & denim"},
"on":{w:"Un triathlète et deux amis ont bricolé une semelle avec des tuyaux d’arrosage pour amortir sans écraser le pied.",who:"Olivier Bernhard, David Allemann et Caspar Coppetti, 2010, Zurich. Roger Federer devient actionnaire en 2019.",what:"Running, tennis, bureau : la Cloud est devenue une chaussure de tous les jours, portée avec un pantalon large.",t:[[2010,"Zurich"],[2019,"Federer"],[2023,"Cloud en ville"]],q:"La semelle ressemble à un nuage. Le nom n’a pas été choisi au hasard.",m:"Running & Suisse"},
"umbro":{w:"Deux frères de Manchester ont habillé le football anglais, puis le football tout court.",who:"Harold et Wallace Humphreys, 1924, Manchester. L’Angleterre gagne la Coupe du monde 1966 en Umbro.",what:"Terrain, casuals, rap : le double losange a traversé les tribunes et les clips.",t:[[1924,"Manchester"],[1966,"Mondial"],[2020,"Retour casual"]],q:"Un maillot de football est le seul vêtement qui porte une date.",m:"Football & tribunes"},
"saucony":{w:"Une marque de running de Pennsylvanie nommée d’après une rivière, devenue une valeur sûre des looks rétro.",who:"Fondée en 1898 à Kutztown ; la Jazz arrive en 1979, la Grid en 1991.",what:"Marathons, dad-shoe, collabs : la Shadow et la Jazz sont devenues des pièces de vestiaire.",t:[[1898,"Pennsylvanie"],[1979,"Jazz"],[1991,"Grid"]],q:"Saucony n’a jamais cherché à être cool. C’est peut-être pour ça que ça a marché.",m:"Running & rétro"},
"cole buxton":{w:"Un designer de sportswear technique qui a décidé de faire des hoodies simples, coupés juste, vendus directement.",who:"Cole Buxton, 2014, Londres ; Jonny Wilson rejoint l’aventure en 2018.",what:"Gym, sortie, Instagram : la marque a bâti son image sur le drop et le vêtement de tous les jours.",t:[[2014,"Londres"],[2018,"Jonny Wilson"],[2020,"Soho"]],q:"Un hoodie bien coupé vaut mieux que dix logos.",m:"Sportswear & Londres"},
"a bathing ape":{w:"Un designer japonais a fait de Tokyo un laboratoire de la culture pop, avec un singe et des collabs en série.",who:"Nigo, 1993, Ura-Harajuku. La Bapesta arrive en 2000, le shark hoodie en 2004.",what:"Hip-hop, manga, sneakers : BAPE est le repère absolu des années 2000, du clip au terrain de skate.",t:[[1993,"Tokyo"],[2000,"Bapesta"],[2004,"Shark"]],q:"BAPE a compris avant tout le monde qu’un vêtement pouvait être un personnage.",m:"Tokyo & pop"},
"patta":{w:"Deux amis d’Amsterdam ont ouvert une boutique pour vendre les marques qu’ils rapportaient déjà dans leurs valises.",who:"Guillaume Schmidt et Edson Sabajo, 2004, Amsterdam.",what:"Air Max, rap, photo : les collabs Patta x Nike sont devenues des pièces de collection.",t:[[2004,"Amsterdam"],[2009,"Air Max"],[2015,"Collabs"]],q:"Une boutique de quartier devenue une marque globale, sans quitter Amsterdam.",m:"Air Max & Amsterdam"},
"gucci":{w:"Une marque de bagages florentine devenue le symbole du luxe italien, puis l’une des premières maisons à comprendre le pouvoir du rap.",who:"Guccio Gucci, 1921, Florence. Le mocassin Horsebit arrive en 1953 ; Tom Ford relance la maison en 1995.",what:"Hip-hop, cinéma, jet-set : le monogramme GG et le mors ont habité les clips avant les podiums.",t:[[1921,"Florence"],[1953,"Horsebit"],[1995,"Tom Ford"]],q:"Le monogramme a été copié partout, y compris là où la maison n’avait rien vendu.",m:"Luxe & rap"},
"damson madder":{w:"Une créatrice londonienne fatiguée des mauvaises pratiques de l’industrie a monté sa marque avec des tissus recyclés et des couleurs franches.",who:"Emma Hill, printemps 2020, Londres.",what:"Jeans léopard, blouses à volants, imprimés : une mode féminine assumée, produite en petites séries.",t:[[2020,"Londres"],[2024,"New York"],[2025,"5 ans"]],q:"Le nom vient de deux teintes testées au début : « damson » (prune) et « madder » (garance).",m:"Londres & couleur"},
"mki":{w:"Un concept-store de Leeds qui a fini par produire sa propre ligne, inspirée par une tribu de Tokyo des années 60.",who:"Vik Tailor, 2010, Leeds. Le nom vient des Miyuki-Zoku, jeunes de Ginza qui ont importé le style ivy league en 1964.",what:"Vestes en cuir, pantalons larges, maille épaisse : du menswear britannique fabriqué avec des tissus japonais.",t:[[1964,"Miyuki-Zoku"],[2010,"Leeds"],[2020,"International"]],q:"Le nom est japonais, la coupe est anglaise, l’adresse est dans le Yorkshire.",m:"Leeds & Tokyo"},
"amiri":{w:"Un designer de Los Angeles qui a commencé par des pièces de scène uniques pour des musiciens, puis a fait du denim destroy un produit de luxe.",who:"Mike Amiri, 2014, Los Angeles. Premier défilé à Paris en 2018.",what:"Skate, rock, rap : le jean MX1 et les vestes en cuir brodées ont défini le luxe streetwear américain.",t:[[2014,"Los Angeles"],[2018,"Paris"],[2023,"OTB"]],q:"Une pièce de scène faite à la main, multipliée en collection : c’est toute l’histoire d’Amiri.",m:"Rock & Los Angeles"},
"lanvin":{w:"La plus ancienne maison de couture française encore en activité, née d’un chapeau et d’une couleur bleue inventée pour une fille.",who:"Jeanne Lanvin, 1889, Paris. Alber Elbaz dirige la maison de 2001 à 2015.",what:"Couture, parfum Arpège, sneakers à bride : la maison a traversé les époques sans jamais se figer.",t:[[1889,"Paris"],[1927,"Arpège"],[2001,"Elbaz"]],q:"Le bleu Lanvin vient d’un portrait de famille. C’est peut-être la plus belle origine de couleur du vestiaire.",m:"Couture & Paris"},
"peachy den":{w:"Une marque londonienne née d’un manque dans le dressing d’une bande d’amies : des pantalons et des combinaisons qui tiennent sans serrer.",who:"Isabella Weatherby, janvier 2019, Londres. D’abord un side hustle expédié à l’heure du déjeuner, aujourd’hui une équipe d’une douzaine de femmes dans l’East London.",what:"Combinaison Kernel, pantalon Mimi, cardigan Celeste : des pièces en séries courtes, fabriquées à Londres, pensées pour se porter du matin au soir.",t:[[2019,"Londres"],[2020,"Kernel"],[2026,"Soho"]],q:"« Peachy » n’est pas un fruit : c’est l’état dans lequel on est censé se sentir en portant la pièce.",m:"Londres & quotidien"},
"kardo":{w:"Un Londres-Punjab : des chemises coupées à la main en Inde, avec les tissus que l’industrie du prêt-à-porter laisse aux artisans.",who:"Rikki Kher, 2013, New Delhi. Né à Londres de parents punjabis, il dirigeait le sourcing textile avant de monter son atelier avec un tailleur et une machine.",what:"Block print du Rajasthan, ikat d’Andhra Pradesh, indigo naturel, chikankari : chaque pièce est cousue de bout en bout par un seul tailleur, la règle « ONExONE ».",t:[[2013,"New Delhi"],[2023,"Dix ans"],[2025,"Boutique"]],q:"Le tissu vient d’un village, la couture d’une seule paire de mains : la traçabilité n’est pas un argument, c’est la méthode.",m:"Artisanat & Inde"},
"entire studios":{w:"Deux stylistes néo-zélandais passés par Yeezy ont lancé une marque unisexe avec une seule doudoune, et aucun logo.",who:"Dylan Richards Diaz et Sebastian Hunt, 2020, Los Angeles. Rencontrés ados sur Tumblr, ils ont stylé Kanye West pendant quatre ans avant de se lancer.",what:"Doudoune PFD, hoodies boxy, jersey lourd : des volumes larges et des couleurs décalées, portés par les clips et les paparazzi.",t:[[2020,"Los Angeles"],[2022,"Puffer PFD"],[2023,"Selfridges"]],q:"Une doudoune, pas de logo, et pourtant reconnaissable en une seconde : c’est la silhouette qui fait le travail.",m:"Los Angeles & volume"},
"homecore":{w:"La première marque de streetwear française est née d’un Parisien nourri de hip-hop qui ne trouvait aucun vêtement racontant cette culture.",who:"Alexandre Guarneri et Steph Cop, 1992, Paris. Avant, ils imprimaient des t-shirts de graffiti au lycée, dès 1987.",what:"Valeurs Zulu Nation (« Peace, Love, Unity and Having Fun »), survêtements larges, puis tailoring discret : la ligne rouge dans le dos est devenue la signature.",t:[[1987,"T-shirts"],[1992,"Homecore"],[2024,"Trois décennies"]],q:"Homecore a habillé le hip-hop français avant que la mode ne sache qu’il existait.",m:"Hip-hop & Paris"},
"staple":{w:"Un étudiant en design a imprimé un t-shirt pour lui, est entré dans une boutique de downtown Manhattan et en est ressorti avec une commande de douze pièces.",who:"Jeff Staple, 1997, New York. Le pigeon, oiseau le plus commun de la ville, devient son emblème.",what:"T-shirts, hoodies, collabs : le Nike SB Dunk « Pigeon » de 2005 a fait entrer la culture sneaker dans le grand public.",t:[[1997,"New York"],[2005,"Pigeon Dunk"],[2022,"25 ans"]],q:"Choisir le pigeon plutôt que l’aigle : c’est toute la blague, et toute la ville.",m:"New York & sneakers"},
"club 1984":{w:"Un label londonien qui mélange le football du samedi, l’Amérique des années 80 et des visuels de souvenirs de vacances.",who:"Louis Brown, 2020, Londres ; Nathan Malcolm rejoint la direction en 2022. Les collections sont produites au Portugal et en Turquie.",what:"Hoodies lavés épais, t-shirts à graphismes, chemises cubaines : des drops limités, sans restock, vendus d’abord sur un site ouvert quelques jours par mois.",t:[[2020,"Londres"],[2022,"Direction"],[2024,"30 Under 30"]],q:"1984 n’est pas une année de naissance : c’est un point de repère culturel, et la marque le revendique.",m:"Football & nostalgie"},
"__defaut":{w:"Chaque pièce a une raison d’exister : un besoin, un sport, un uniforme détourné. C’est cette origine qui la rend intéressante.",who:"La marque, le designer ou la collab raconte souvent plus que la fiche produit.",what:"Musique, cinéma, jeu vidéo, skate : le streetwear se nourrit d’images avant de faire des vêtements.",t:[[1950,"Origine"],[1990,"Détournement"],[2020,"Réédition"]],q:"La mode passe, les uniformes restent. C’est pour ça qu’on regarde les uniformes.",m:"Culture & vêtements"}
};
HISTOIRES["adidas originals"]=HISTOIRES["adidas"];
HISTOIRES["air jordan"]=HISTOIRES["jordan"];
HISTOIRES["icecream"]=HISTOIRES["billionaire boys club"];
HISTOIRES["billionaire boys club/ice cream"]=HISTOIRES["billionaire boys club"];
HISTOIRES["fear of god essentials"]=HISTOIRES["essentials"];
HISTOIRES["hoka®"]=HISTOIRES["hoka"];
HISTOIRES["levis"]=HISTOIRES["levi's"];
function histoireOf(x){
var k=bkey(x);
return HISTOIRES[k]||HISTOIRES["type:"+typeOf(x)]||HISTOIRES.__defaut;
}
function drawScribble(){
return '<svg class="scribble" viewBox="0 0 300 160" aria-hidden="true"><path d="M18 96c34-46 62-58 84-38 18 16 6 48-16 50-24 2-22-38 8-56 32-19 74-6 98 18 20 20 44 12 72-14"/><path d="M212 36c14-8 30-12 44-6"/></svg>';
}
function renderStories(){
var el=$("stories");
if(!el)return;
if(el.getAttribute("data-ready")==="1")return;
el.innerHTML=STORIES.map(function(s,i){
return '<button type="button" class="story" data-i="'+i+'" aria-label="'+esc(s.t)+' : '+esc(s.cta)+'">'+drawScribble()+
'<img src="'+esc(s.img)+'" alt="'+esc(s.tag)+" — "+esc(s.t)+'" loading="lazy" decoding="async">'+
'<span class="story-arrow" aria-hidden="true">↗</span>'+
'<span class="story-in"><span class="story-tag">'+esc(s.tag)+'</span><span class="story-t">'+esc(s.t)+'</span><span class="story-p">'+esc(s.p)+'</span><span class="story-cta">'+esc(s.cta)+' ↗</span></span></button>';
}).join("");
for(var i=0;i<STORIES.length;i++){el.children[i].addEventListener("click",storyGo.bind(null,i))}
}
function storyGo(i){
var s=STORIES[i];if(!s)return;
if(s.f.tri)$("tri").value=s.f.tri;
applyF({q:s.f.q||"",cat:s.f.cat||"all",type:s.f.type||"all",gen:"all",b:"",r:s.f.r||0,pm:null,sz:[],br:s.f.br||[],re:false});
goResults();
}
function firstImg(cat,type){
for(var i=0;i<D.length;i++){var x=D[i];if(x.image&&catOf(x)===cat&&typeOf(x)===type)return x.image}
return "";
}
function renderCatTiles(){
var el=$("catTiles");
if(!el)return;
el.innerHTML=TILES.map(function(t){
var n=0;D.forEach(function(x){if(catOf(x)===t[0]&&typeOf(x)===t[1])n++});
var img=firstImg(t[0],t[1]);
return '<button type="button" class="tile'+(CAT===t[0]&&TYPE===t[1]?" on":"")+'" data-c="'+t[0]+'" data-t="'+t[1]+'" aria-pressed="'+(CAT===t[0]&&TYPE===t[1])+'">'+
(img?'<img src="'+esc(thumb(img,300))+'" alt="" loading="lazy" decoding="async">':"")+
'<span>'+esc(t[2])+'<em>'+n+' articles</em></span></button>';
}).join("");
Array.prototype.forEach.call(el.querySelectorAll(".tile"),function(b){
b.addEventListener("click",function(){homeFilter(b.getAttribute("data-c"),b.getAttribute("data-t"))});
});
}
function homeFilter(cat,type){
TYPE_MORE=false;
applyF({q:"",cat:cat||"all",type:type||"all",gen:"all",b:"",r:0,pm:null,sz:[],br:[],re:false});
$("tri").value="remise";
goResults();
}
function renderTrending(){
var el=$("trending");
if(!el)return;
var seen={},top=[];
D.slice().sort(function(a,b){return (b.remise||0)-(a.remise||0)}).forEach(function(x){
if(top.length>=10||!x.image||x.inf)return;
var k=bkey(x)+"|"+typeOf(x);
if(seen[k])return;
seen[k]=1;top.push(x);
});
el.innerHTML=top.map(function(x,i){
var lo=basSuivi(x.lien);
var note=lo&&x.prix<=lo.min+0.01?"plus bas depuis "+lo.days+" j":"−"+x.remise+" %";
return '<button type="button" class="trend-item" data-l="'+esc(x.lien)+'">'+
'<span class="trend-img"><img src="'+esc(thumb(x.image,420))+'" alt="'+esc((x.marque||"")+" "+(x.nom||""))+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="trend-rank">'+(i+1)+'</span><span class="trend-badge">−'+x.remise+' %</span></span>'+
'<span class="trend-in"><span class="trend-b">'+esc(x.marque)+" · "+esc(x.boutique)+'</span><span class="trend-t">'+esc(x.nom)+'</span>'+
'<span class="trend-p"><b>'+f(shoePriceBounds(x).min)+'</b><s>'+f(x.ancien_prix)+'</s></span>'+
'<span class="trend-go">'+esc(note)+' ↗</span></span></button>';
}).join("");
}
function renderHome(){
renderStories();
renderCatTiles();
renderTrending();
}
function dealSignal(x){
var out=[];
var lo=basSuivi(x.lien);
if(lo&&lo.min>0){
if(x.prix<=lo.min+0.01)out.push(["low","Au plus bas depuis "+lo.days+" j"]);
else out.push(["note","Mini vu : "+f(lo.min)+" sur "+lo.days+" j"]);
}
var offer=sizeOfferList(x),dispo=0,total=0;
Object.keys(offer).forEach(function(k){total++;if(offer[k]&&offer[k].length)dispo++});
if(dispo&&dispo<=2&&total>=3)out.push(["stock","Stock limité : "+dispo+" taille"+(dispo>1?"s":"")]);
else if(epuisees(x).length)out.push(["stock",epuisees(x).length+" taille"+(epuisees(x).length>1?"s":"")+" épuisée"+(epuisees(x).length>1?"s":"")]);
else if(x.remise>=50)out.push(["hot","Grosse remise : −"+x.remise+" %"]);
return out.map(function(d){return '<span class="ds '+d[0]+'">'+esc(d[1])+'</span>'}).join("");
}
function sameUniverse(x){
var seen={},list=[];
D.forEach(function(y){
if(y.lien===x.lien||!y.image)return;
if(bkey(y)!==bkey(x)&&typeOf(y)!==typeOf(x))return;
var k=nkey(y);
if(k&&seen[k])return;
if(k)seen[k]=1;
list.push(y);
});
list.sort(function(a,b){return (b.remise||0)-(a.remise||0)});
return list.slice(0,4);
}
function storyBlockHtml(x){
var h=histoireOf(x);
var same=sameUniverse(x);
var sameHtml="";
if(same.length){
sameHtml='<div class="same"><div class="same-h"><strong class="lbl" style="margin:0">Dans le même univers</strong><span>'+esc(h.m)+'</span></div><div class="same-list">'+
same.map(function(y){
return '<button type="button" class="same-item" data-l="'+esc(y.lien)+'"><img src="'+esc(thumb(y.image,120))+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="same-in"><b>'+esc(y.nom)+'</b><em>'+f(shoePriceBounds(y).min)+" · −"+y.remise+' %</em></span></button>';
}).join("")+'</div></div>';
}
return '<section class="story-box" aria-labelledby="storyH"><p class="story-kicker">L’histoire</p><h3 class="story-h" id="storyH">Pourquoi cette pièce existe</h3>'+
'<p class="story-lead">'+esc(h.w)+'</p>'+
'<div class="story-grid"><div><h4>Qui est derrière</h4><p>'+esc(h.who)+'</p></div><div><h4>Ce que ça raconte</h4><p>'+esc(h.what)+'</p></div><div><h4>Le bon plan</h4><p>−'+x.remise+' % chez '+esc(x.boutique)+', soit '+f(x.ancien_prix-x.prix)+' de moins. '+(x.inf?'Prix barré à vérifier chez la boutique.':(x._grpN>1?'Même pièce comparée chez '+x._grpN+' boutiques.':'Prix relevé directement sur la fiche boutique.'))+'</p></div></div>'+
'<ol class="timeline">'+h.t.map(function(p){return '<li><b>'+p[0]+'</b><span>'+esc(p[1])+'</span></li>'}).join("")+'</ol>'+
'<blockquote class="story-quote">'+esc(h.q)+'<cite>'+esc(h.m)+'</cite></blockquote>'+sameHtml+'</section>';
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
var alt=esc(((x.marque||"")+" "+(x.nom||"")).trim());
var img=x.image?'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(thumb(x.image))+'" data-o="'+esc(x.image)+'" alt="'+alt+'" onerror="if(this.dataset.o&&this.src!==this.dataset.o){this.src=this.dataset.o;this.dataset.o=\'\'}else{this.style.visibility=\'hidden\'}">':'<div class="ph"></div>';
var href=/^https?:\/\//.test(x.lien)?esc(x.lien):"#";
/* L’image et le texte gardent l’ouverture de la fiche (comportement JS) ;
   le bouton « Voir l’offre » est un vrai lien boutique, avec l’affiliation
   intacte, et ouvre un nouvel onglet. */
return '<div class="card'+(x.gone?" gone":"")+'" data-l="'+esc(x.lien)+'"><button class="fav'+(fv?" on":"")+'" data-l="'+esc(x.lien)+'" aria-label="Favori">'+(fv?"♥":"♡")+'</button><a class="cardlink" href="'+href+'" target="_blank" rel="noopener" aria-label="Voir la fiche : '+alt+'">'+(x.gone?"":'<span class="pct">−'+x.remise+' %</span>')+img+'</a><div class="in"><div class="b">'+esc(x.marque)+" · "+esc(x.boutique)+'</div><div class="t">'+esc(x.nom)+'</div><div><span class="now">'+priceRangeLabel(x)+'</span><span class="old">'+f(x.ancien_prix)+'</span></div><div class="s">'+esc(uSizes.join(", "))+'</div>'+tags+'<a class="offer" href="'+href+'" target="_blank" rel="noopener">Voir l’offre ↗</a></div></div>';
}

function render(){
var shown=L.slice(0,PER);
shownN=shown.length;
var parts=[];
if(CAT!=="all")parts.push(CL[CAT]);
if(TYPE!=="all")parts.push(TY_NAME[TYPE]||TYPE);
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
if(F.type&&F.type!=="all")p.push(TY_NAME[F.type]||F.type);
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
return '<button type="button" class="sz-item'+(pickedSize===t?" on":"")+(isOff?" off":"")+'" data-sz="'+esc(t)+'" aria-pressed="'+(pickedSize===t)+'">'+esc(t)+(isOff?'<em>épuisée</em>':(pv?'<em>'+esc(f(pv))+'</em>':''))+'</button>';
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
/* Lien direct : la fiche s'ouvre sur une entrée d'historique neuve, calquée
   sur le reste du site. Sans cela, la fermeture revenait sur l'URL #p=… et
   rouvrait aussitôt la fiche. */
if(!sheetOpen()){
try{history.replaceState(history.state||{o:1},"",location.pathname+location.search)}catch(e){}
}
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
$("shBody").innerHTML=img+'<div class="b">'+esc(x.marque)+' · '+esc(x.boutique)+'</div><div class="sh-t">'+esc(x.nom)+'</div><div><span class="now big">'+priceRangeLabel(x)+'</span><span class="old">'+f(x.ancien_prix)+'</span><span class="pct2">−'+x.remise+' %</span></div><div class="deal-signal">'+dealSignal(x)+'</div>'+szHtml+'<div id="histWrap" class="hist"></div>'+alt+storyBlockHtml(x)+'<div class="sh-act"><a class="go" href="'+esc(x.lien)+'" target="_blank" rel="noopener">Voir l’offre ↗</a><button class="fbtn" id="shFav" aria-label="Favori">'+(FAV[l]?"♥":"♡")+'</button><button class="fbtn" id="shShare">Partager</button></div>'+seuil;
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
if(a.classList.contains("offer"))return;
e.preventDefault();
openSheet(a.closest(".card").getAttribute("data-l"));
}
});

/* --- Accueil éditorial, filtres rapides, barre mobile ----------------- */
function syncQuick(){
var r=+($("remise")?$("remise").value:0);
Array.prototype.forEach.call(document.querySelectorAll("#quickF .qf"),function(b){
b.classList.toggle("on",+b.getAttribute("data-r")===r);
});
}
/* L'onglet actif suit la vue réelle : favoris, recherche en cours, filtres de
   catégorie, sinon l'accueil. Le profil n'est actif que tant que son tiroir
   est ouvert. */
function updTabs(){
var nav="home";
if(onlyFav)nav="fav";
else if($("q")&&$("q").value.trim())nav="search";
else if(actives().length)nav="cats";
if(PROFILE_TAB&&drawerOpen())nav="profile";
var ids={home:"bnHome",search:"bnSearch",fav:"bnFav",cats:"bnCats",profile:"bnProfile"};
Object.keys(ids).forEach(function(k){
var b=document.getElementById(ids[k]);
if(b)b.classList.toggle("on",nav===k);
});
}
(function(){
var qf=$("quickF");
if(qf)qf.addEventListener("click",function(e){
var b=e.target.closest(".qf");
if(!b)return;
$("remise").value=b.getAttribute("data-r");
apply(true);
});
var band=$("promoBand");
if(band){
if(ls("promoOff")===1)band.remove();
else $("promoX").addEventListener("click",function(){ls("promoOff",1);band.remove()});
}
function tab(id,fn){var b=document.getElementById(id);if(b)b.addEventListener("click",fn)}
tab("bnHome",function(){PROFILE_TAB=false;resetAll();window.scrollTo({top:0,behavior:"auto"})});
tab("bnSearch",function(){window.scrollTo({top:0,behavior:"smooth"});var q=$("q");if(q)setTimeout(function(){q.focus({preventScroll:true})},260)});
tab("bnFav",function(){onlyFav=true;onlyNew=onlyDrop=onlyTop=onlyVisite=false;syncChips();favCount();apply(true,true)});
tab("bnCats",function(){var t=$("catTiles");if(t)t.scrollIntoView({behavior:"smooth",block:"center"})});
tab("bnProfile",function(){
if(!drawerOpen())togglePanel();
PROFILE_TAB=true;
updTabs();
setTimeout(function(){
var p=$("profBox"),panel=$("panel");
if(!p||!panel)return;
/* Le bloc est replié dans sa section : on l'ouvre, puis on y amène le
   tiroir lui-même, pas la page derrière. */
var d=p.closest("details");
if(d&&!d.open)d.open=true;
panel.scrollTop+=p.getBoundingClientRect().top-panel.getBoundingClientRect().top-10;
},180);
});
})();
/* « Dans le même univers » et le trending ouvrent une fiche. */
document.addEventListener("click",function(e){
var it=e.target.closest(".same-item")||e.target.closest(".trend-item");
if(it)openSheet(it.getAttribute("data-l"));
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
