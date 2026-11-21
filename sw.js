var V="promos-v29";
// Ne pas précacher les gros JSON : l’installation du service worker ne doit pas
// échouer lorsque les données produits dépassent le quota de cache disponible.
var SHELL=["./","index.html","app.js","shiny.js","veille.js","style.css","manifest.json","methode.html","etat.html","icone-192.png","fonts/newsreader-latin.woff2","fonts/courier-prime-latin.woff2"];

self.addEventListener("install",function(e){
  e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}));
});

self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});

// Clic sur une notification de veille : ramener l’onglet existant sur la fiche.
self.addEventListener("notificationclick",function(e){
  e.notification.close();
  var url=(e.notification.data&&e.notification.data.url)||"./";
  var base=url.split("#")[0];
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){
      var c=cs[i];
      if(c.url.indexOf(base)===0){
        if(c.navigate){try{c.navigate(url)}catch(err){}}
        return c.focus();
      }
    }
    if(self.clients.openWindow)return self.clients.openWindow(url);
  }));
});

self.addEventListener("fetch",function(e){
  var r=e.request;
  if(r.method!=="GET")return;
  var u=new URL(r.url);
  if(u.origin!==location.origin)return;

  // Les JSON sont toujours demandés au réseau en premier. En cas d'échec,
  // utiliser la dernière copie effectivement mise en cache.
  if(/(?:promos|prix_tailles|tailles_index|history|sante)\.json$/.test(u.pathname)){
    e.respondWith(
      Promise.race([
        fetch(r,{cache:"no-store"}),
        new Promise(function(_,reject){setTimeout(function(){reject(new Error("timeout"));},10000);})
      ]).then(function(res){
        if(!res.ok)throw new Error("HTTP "+res.status);
        var copy=res.clone();
        caches.open(V).then(function(c){c.put(u.pathname,copy);});
        return res;
      }).catch(function(){
        return caches.match(u.pathname).then(function(hit){
          return hit||new Response("Données hors ligne indisponibles",{
            status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}
          });
        });
      })
    );
    return;
  }

  // Réseau d'abord pour les fichiers de l'application afin qu'une mise à jour
  // soit visible dès que GitHub Pages sert la nouvelle version.
  e.respondWith(fetch(r,{cache:"no-cache"}).then(function(res){
    if(res.ok){var copy=res.clone();caches.open(V).then(function(c){c.put(r,copy);});}
    return res;
  }).catch(function(){return caches.match(r,{ignoreSearch:true});}));
});
