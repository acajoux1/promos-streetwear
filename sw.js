var V="promos-v6";
var SHELL=["./","index.html","app.js","style.css","manifest.json"];
self.addEventListener("install",function(e){
e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener("activate",function(e){
e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener("fetch",function(e){
var r=e.request;
if(r.method!=="GET")return;
var u=new URL(r.url);
if(u.origin!==location.origin)return;
if(u.pathname.indexOf("promos.json")>=0){
e.respondWith(
Promise.race([fetch(r),new Promise(function(_,rej){setTimeout(function(){rej(new Error("t"))},4000)})])
.then(function(res){var cp=res.clone();caches.open(V).then(function(c){c.put("data/promos.json",cp)});return res})
.catch(function(){return caches.match("data/promos.json")})
);
return;
}
e.respondWith(caches.match(r,{ignoreSearch:true}).then(function(hit){
var net=fetch(r,{cache:"no-cache"}).then(function(res){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)});return res}).catch(function(){return hit});
return hit||net;
}));
});
