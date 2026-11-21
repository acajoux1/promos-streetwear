/* Veille : notifications locales + seuils de prix par article.
   Aucun serveur : le site relit ses propres données et prévient quand une
   alerte enregistrée ou un seuil personnel est atteint. */
(function(){
var W=window;
var SEUILS={};

function ls(k,v){try{if(v===undefined){return JSON.parse(localStorage.getItem(k))}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function f(n){return Number(n).toFixed(2).replace(".",",")+" €"}
function $(id){return document.getElementById(id)}
function D(){return W.D||[]}
function M(){return W.M||{}}

function permission(){
try{
if(!("Notification" in window))return "unsupported";
return Notification.permission||"default";
}catch(e){return "unsupported"}
}
function demander(){
if(permission()==="unsupported")return Promise.resolve("unsupported");
return Notification.requestPermission().then(function(p){return p}).catch(function(){return permission()});
}
function notifier(titre,corps,lien){
if(!("serviceWorker" in navigator))return Promise.resolve();
return navigator.serviceWorker.ready.then(function(reg){
return reg.showNotification(titre,{
body:corps,
tag:lien||"promos",
icon:"icone-192.png",
badge:"icone-192.png",
data:{url:lien&&W.deepLink?W.deepLink(lien):"./"}
});
}).catch(function(){});
}

function charger(){
var s=ls("seuils");
SEUILS=(s&&typeof s==="object")?s:{};
}

/* Compare le dernier relevé aux alertes et aux seuils, et sonne une fois. */
function verifier(){
charger();
if(permission()!=="granted")return 0;
var vus=ls("vus")||{};
var alertes=ls("alerts")||[];
var out=[];
var liste=D();

alertes.forEach(function(a){
if(!a||!a.f)return;
liste.forEach(function(x){
if(!W.NEWS||!(W.NEWS[x.lien]||(W.isDrop&&W.isDrop(x))))return;
if(!W.pass||!W.pass(x,a.f))return;
var k="a:"+x.lien;
if(vus[k])return;
out.push({t:"Alerte · "+a.name,b:x.nom+" — "+f(x.prix)+" chez "+x.boutique,l:x.lien,k:k});
});
});

Object.keys(SEUILS).forEach(function(l){
var x=M()[l],s=SEUILS[l];
if(!x||!s||!(s.prix>0))return;
if(!(x.prix<=s.prix))return;
var k="s:"+l+":"+x.prix;
if(vus[k])return;
out.push({t:"Seuil atteint",b:x.nom+" à "+f(x.prix)+" (objectif "+f(s.prix)+")",l:l,k:k});
});

/* Retour en stock : une taille surveillée depuis la fiche redevient disponible. */
var retours=ls("retours")||{};
Object.keys(retours).forEach(function(l){
var x=M()[l];
if(!x)return;
Object.keys(retours[l]||{}).forEach(function(sz){
if(!(W.sizePrice&&W.sizePrice(l,sz)>0))return;
var k="r:"+l+":"+sz;
if(vus[k])return;
out.push({t:"Retour en stock",b:x.nom+" — taille "+sz+" de nouveau disponible",l:l,k:k});
});
});

/* Moins cher ailleurs : un article dont le prix est surveillé se trouve à 15 %
   de moins ou plus dans une autre boutique du même modèle. */
Object.keys(SEUILS).forEach(function(l){
var x=M()[l];
if(!x||!x._alt||!x._alt.length||!W.shoePriceBounds)return;
var best=null;
x._alt.forEach(function(y){var v=W.shoePriceBounds(y).min;if(v>0&&(best===null||v<best))best=v});
if(best===null||best>=x.prix*0.85)return;
var k="x:"+l+":"+Math.round(best*100);
if(vus[k])return;
out.push({t:"Moins cher ailleurs",b:x.nom+" à "+f(best)+" (vous suivez "+f(x.prix)+")",l:l,k:k});
});

out.slice(0,4).forEach(function(n){
notifier(n.t,n.b,n.l);
vus[n.k]=Date.now();
});

/* Un retour signalé n'est plus surveillé. */
var rest=ls("retours")||{};
Object.keys(rest).forEach(function(l){
Object.keys(rest[l]||{}).forEach(function(sz){
if(vus["r:"+l+":"+sz])delete rest[l][sz];
});
if(!Object.keys(rest[l]||{}).length)delete rest[l];
});
ls("retours",rest);

/* On garde les 400 derniers repères pour ne pas gonfler le stockage. */
var ks=Object.keys(vus);
if(ks.length>400){
ks.sort(function(a,b){return (vus[a]||0)-(vus[b]||0)});
ks.slice(0,ks.length-400).forEach(function(k){delete vus[k]});
}
ls("vus",vus);
return out.length;
}

/* --- Interface -------------------------------------------------------- */
function blocHtml(){
charger();
var p=permission();
var txt=p==="granted"?"Notifications autorisées":p==="denied"?"Notifications bloquées dans le navigateur":p==="unsupported"?"Ce navigateur ne gère pas les notifications":"Notifications non activées";
var h='<div class="veille"><div class="lbl">Veille</div><div class="veille-line">'+txt+'</div>';
if(p==="default"){
h+='<div class="sh-act"><button type="button" class="fbtn" data-v-act="perm">Activer les notifications</button></div>';
}else if(p==="granted"){
h+='<div class="sh-act"><button type="button" class="fbtn" data-v-act="test">Vérifier maintenant</button></div>';
}
h+='<div class="veille-note">La veille est locale : elle sonne quand le site est ouvert, ou tant que l’onglet reste en arrière-plan. Un site statique ne peut pas se réveiller seul, nous ne prétendons donc pas le contraire.</div>';
var ret=ls("retours")||{};
var rk=[];
Object.keys(ret).forEach(function(l){
var nm=(M()[l]||{}).nom||(ret[l]&&Object.values(ret[l])[0]&&Object.values(ret[l])[0].nom)||"Article";
Object.keys(ret[l]||{}).forEach(function(sz){rk.push({l:l,sz:sz,nom:nm})});
});
if(rk.length){
h+='<div class="lbl" style="margin-top:14px">Retours en stock suivis</div>';
rk.forEach(function(r){
h+='<div class="seuil-on"><span>'+esc(r.nom)+' · taille '+esc(r.sz)+'</span><button type="button" class="fbtn" data-v-act="delret" data-l="'+esc(r.l)+'" data-sz="'+esc(r.sz)+'">Retirer</button></div>';
});
}
var ks=Object.keys(SEUILS);
if(ks.length){
h+='<div class="lbl" style="margin-top:14px">Seuils suivis</div>';
ks.forEach(function(l){
var x=M()[l];
h+='<div class="seuil-on"><span>'+esc((x&&x.nom)||SEUILS[l].nom||l)+' · '+f(SEUILS[l].prix)+'</span><button type="button" class="fbtn" data-v-act="del" data-l="'+esc(l)+'">Retirer</button></div>';
});
}
h+='</div>';
return h;
}

function ficheHtml(x){
charger();
var s=SEUILS[x.lien];
var def=(x.prix&&x.prix>5)?Math.round(x.prix*0.9*10)/10:"";
return '<div class="seuil" id="seuilWrap">'+
'<div class="lbl">M’alerter sous</div>'+
(s?'<div class="seuil-on"><span>Seuil enregistré : '+f(s.prix)+'</span><button type="button" class="fbtn" data-v-act="del" data-l="'+esc(x.lien)+'">Retirer</button></div>':'')+
'<div class="seuil-row"><input type="number" inputmode="decimal" min="1" step="0.5" id="seuilPrix" value="'+(s?s.prix:"")+'" placeholder="ex. '+def+'"><button type="button" class="fbtn" data-v-act="set" data-l="'+esc(x.lien)+'">'+(s?"Modifier":"Créer")+'</button></div>'+
'<div class="veille-note">Vous serez prévenu à la prochaine visite, dès que l’article passe sous ce prix.</div>'+
'</div>';
}

/* Remplit l'emplacement réservé par app.js dans la fiche « Mes alertes ». */
function majAlertes(){
var s=$("veilleSlot");
if(s)s.innerHTML=blocHtml();
}

function majSeuil(l){
var x=M()[l];
var wrap=$("seuilWrap");
if(wrap&&x)wrap.outerHTML=ficheHtml(x);
}

document.addEventListener("click",function(e){
var b=e.target.closest("[data-v-act]");
if(!b)return;
var act=b.getAttribute("data-v-act");
var l=b.getAttribute("data-l");
if(act==="perm"){
demander().then(function(p){
if(p==="granted"){
notifier("PROMOS. · veille active","Vous serez prévenu dès qu’une alerte ou un seuil est atteint.",null);
}
majAlertes();
});
return;
}
if(act==="test"){
var n=verifier();
var nb=$("shBody");
if(nb){
var line=nb.querySelector(".veille-line");
if(line)line.textContent=n?n+" alerte"+(n>1?"s":"")+" envoyée"+(n>1?"s":"")+" · notifications autorisées":"Aucune nouveauté à signaler pour vos alertes";
}
return;
}
if(act==="set"){
charger();
var input=$("seuilPrix");
var v=parseFloat(String((input&&input.value)||"").replace(",","."));
if(!(v>0)){if(input)input.focus();return}
var x=M()[l];
SEUILS[l]={prix:v,nom:(x&&x.nom)||""};
ls("seuils",SEUILS);
if(permission()==="default")demander();
majSeuil(l);
return;
}
if(act==="delret"){
var rr=ls("retours")||{};
var lr=b.getAttribute("data-l"),sr=b.getAttribute("data-sz");
if(rr[lr]){delete rr[lr][sr];if(!Object.keys(rr[lr]).length)delete rr[lr]}
ls("retours",rr);
majAlertes();
return;
}
if(act==="del"){
charger();
delete SEUILS[l];
ls("seuils",SEUILS);
var w=$("seuilWrap");
if(w&&document.getElementById("sheet").className==="open")majSeuil(l);
else majAlertes();
return;
}
});

document.addEventListener("promos:maj",function(){
charger();
verifier();
});

/* Une visite, un contrôle : les nouveautés déjà vues ne resonnent pas. */
window.addEventListener("load",function(){
setTimeout(function(){charger();verifier()},2500);
});

W.Veille={verifier:verifier,demander:demander,ficheHtml:ficheHtml,majAlertes:majAlertes};
})();
