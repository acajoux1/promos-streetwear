# Promos Streetwear — notes techniques

## Fonctionnement

- Boutiques : Starcow Paris, END., Footshop, Laced Run, Dimension Stores
- Relevé : toutes les 1 h (`.github/workflows/maj.yml`), avec `pull --rebase` avant l'envoi
- `scraper.py` : collecte les promos (`data/promos.json`), l'historique de prix (`data/history.json`),
  la santé par boutique (`data/sante.json`, alerte si une boutique perd plus de la moitié de ses articles)
  et l'instantané des variantes (`data/variantes.json` : prix et disponibilité réels de chaque taille,
  lus dans le flux `products.json` des boutiques Shopify, donc sans requête produit individuelle).
  Cet instantané est un fichier de travail ignoré par Git : il ne sert qu'à `size_prices.py`
  dans la même exécution et n'alourdit pas le dépôt.
- `size_prices.py` : prix et disponibilité par taille (`data/prix_tailles.json`, détaillé)
  et index léger consommé au démarrage (`data/tailles_index.json` : bornes + prix mini par taille).
  Il affiche aussi le nombre de variantes à prix aberrant (>= 1500 €) par boutique.
  Pour ne régénérer que l'index sans refaire de réseau : `python3 size_prices.py --index-seulement`
- Prix par taille : `size_prices.py` lit `data/variantes.json` en priorité ; chaque taille garde le prix
  de ses propres variantes (chez Dimension Stores, chaque pointure est une pièce unique avec son prix).
  Les variantes indisponibles sont ignorées pour les bornes (repli sur toutes si aucune n'est disponible) ;
  le prix barré vient toujours de la même variante soldée (`choisir_offre`) et n'est retenu que s'il est
  supérieur au prix payé. Le réseau n'est sollicité que pour les fiches sans instantané (Footshop,
  dont la page liste ne donne qu'un prix unique par produit).
- Feuilles de style : tout est dans `style.css`. Thème sombre `#121212`, surfaces `#181818`/
  `#1E1E1E`, un seul accent orange `#F5A000` réservé aux badges de remise, aux CTA, au bandeau promo
  et aux états actifs ; rayons 12–28 px (tokens `--r-*`), filets gris `#2B2B2B`.
- Contraste : `--mut` (#A3A3A3) donne ≈ 7:1 sur `#121212`, et `--dim` (#8A8A8A) ≈ 5,4:1 : les petites
  majuscules restent au-dessus du seuil AA de 4,5:1. L'orange #F5A000 sur #121212 dépasse 8:1.
- Polices : titres et texte en Archivo (Google Fonts, graisses 300 à 900, `display=swap`), une seule
  famille géométrique, chargée depuis Google Fonts ; aucune police locale n'est servie. Repli
  Helvetica Neue / Arial puis sans-serif système.
- Version du cache du service worker : `promos-v39` (`sw.js` ; shell = index, `app.js`, `veille.js`,
  `style.css`, `manifest.json`, pages méthode et état, icône 192 et les cinq visuels éditoriaux
  `img/story-*.jpg`)
- `feed.py` : écrit `feed.xml` (RSS 2.0, 60 dernières baisses) et `sitemap.xml` (accueil, méthode, état)
  à partir des JSON déjà livrés, sans réseau. Lancé par le workflow juste après `size_prices.py`.
  Il écrit aussi les fiches `p/<modèle>-<hash>.html` des 40 meilleures remises : page statique
  avec balises OG, prix par taille et lien profond vers la fiche complète, ajoutée au plan du site.
  Elles servent au partage et au référencement, pas au parcours quotidien.
- `enrich.py` (le bot) : écrit une note de deux phrases par article dans `data/descriptions.json`,
  affichée sous « Le mot du radar » dans la fiche. Il choisit les articles sans note, puis les
  notes de plus de `--refresh-days` (45 j), `--limit` (12) par passage, et tourne avec l’agent
  histoire (une fois par jour), qui livre le fichier dans sa pull request. API compatible OpenAI : `AI_API_KEY`, `AI_API_BASE`
  (défaut `https://api.z.ai/api/paas/v4`), `AI_MODEL` (défaut `glm-4-flash`), lus dans les
  secrets du dépôt, jamais dans le code. Les réponses hors bornes (60–320 caractères, pas d’URL,
  pas de prix, ponctuation finale) sont écartées. **Sans `AI_API_KEY`, le script ne fait rien et
  sort en 0** : la collecte n’en dépend pas. `--dry-run` liste les articles visés sans appeler.
- Deux agents autonomes, **jamais sur `main`** : chacun travaille sur une branche et ouvre une pull
  request, sans fusion automatique. Les deux s’arrêtent proprement si `AI_API_KEY` manque.
  - **Structure et expérience** (`agents/structure.py`, lundi 06:40, `agent-structure.yml`) :
    audit déterministe (identifiants dupliqués, images sans `alt`, boutons sans texte, liens
    internes cassés, cache du service worker, JSON, marques sans histoire), puis au plus deux
    retouches demandées au modèle. Seuil de tolérance : 2 modifications, 3 fichiers, 120 lignes,
    +15 % par fichier ; fichiers autorisés seulement (`index.html`, `methode.html`, `etat.html`,
    `style.css`, `NOTES.md`), jamais `app.js` ni `data/` ; identifiants et liens protégés conservés.
    Syntaxe JS, équilibre HTML/CSS et suite de tests vérifiés : au premier échec, tout est annulé.
  - **Histoires** (`agents/histoire.py`, tous les jours à 05:20, `agent-histoire.yml`) : repère les
    marques du catalogue sans histoire, demande une fiche et ses sources, puis **vérifie** chaque
    source — domaine de confiance (ou site officiel exact de la marque, table `OFFICIELS`),
    page accessible, marque citée, et chacune des années de la frise présente dans le texte.
    Un domaine qui contient juste le nom de la marque (`kardo-magasin.test`) est refusé. Ce qui
    ne passe pas est écarté. Le résultat va dans `data/histoires.json`, fusionné au
    chargement (`HIST_EXTRA`), jamais dans `app.js` ; les sources s’affichent sous la frise dans la
    fiche. Une marque refusée n’est retentée qu’après 14 jours (`_tentatives`).
  - Les deux lisent `AI_API_KEY`, `AI_API_BASE`, `AI_MODEL` dans les secrets du dépôt (ou les
    variables de dépôt pour les deux dernières ; une valeur vide vaut le défaut). Aucun accès
    en écriture à `main`, aux tests ou aux workflows depuis le code des agents.
  - **Repli automatique** (`agents/commun.py`) : si le principal répond **401/403** (clé refusée),
    **429** (quota épuisé), **404/400** (modèle ou route inconnue) ou **500/502/503** (panne
    passagère du service), ou si le transport casse (**timeout**, DNS, connexion coupée, réponse
    illisible : aucun statut HTTP), l'appel passe au fournisseur suivant sans attendre les réessais,
    inutiles quand la limite est journalière et risqués quand le service est à terre. Le dernier
    fournisseur de la liste, lui, réessaie sur place : sans repli, c'est sa seule chance.
    Le secours par défaut est **Gemini** (Google AI Studio, `gemini-3.8-flash`,
    `https://generativelanguage.googleapis.com/v1beta/openai`), gratuit sans carte bancaire et
    compatible OpenAI ; la clé se crée sur `aistudio.google.com/apikey`. Les variables :
    `AI_API_KEY_BACKUP` en **secret**, `AI_API_BASE_BACKUP` et `AI_MODEL_BACKUP` en variables
    (facultatives, elles servent à changer de fournisseur sans toucher au code). Plusieurs clés
    de secours se mettent à la suite, séparées par des virgules ; base et modèle les suivent dans
    le même ordre (une seule valeur vaut pour toutes). Les deux workflows transmettent ces trois
    valeurs. Le journal dit toujours qui a répondu — « Réponse de Z.ai (…). » ou « Z.ai
    indisponible (HTTP 429 …) → repli sur Gemini. » — pour qu'un run vert ne laisse jamais
    deviner le fournisseur. Sans `AI_API_KEY_BACKUP`, le comportement est celui d'avant (réessais
    sur le principal). `enrich.py` (les notes de style) passe par le même `commun.appeler()` :
    il hérite du repli, et les 429 sur les descriptions ne bloquent plus le passage.
- Historique : un point par jour et par changement de prix, plafonné à 30 points par article
  (`HIST_MAX_POINTS`), et articles absents depuis 45 jours oubliés. La date de première observation
  est gardée à part (`d`) pour que les badges annoncent l'ancienneté réelle du suivi même après
  élagage. Le fichier reste borné au lieu de croître sans fin avec le nombre de relevés.
- `verifie_sante.py` : lancé par le workflow **après** la publication. Il échoue — donc GitHub
  prévient le propriétaire — si le relevé a plus de 3 h, si le catalogue tombe sous 500 articles,
  si une boutique n'a pas répondu ou si `sante.json` signale un effondrement. Un échec ne bloque
  pas la publication : les données valides sont déjà en ligne.

## Mobile

- Bandeau resserré : 52 px de barre sous 760 px (58 px au-delà, avec un léger flou d’arrière-plan), recherche à 16 px
  pour qu'iOS ne zoome pas au focus, pastilles de filtre sur une seule ligne défilante.
- Héro sans hauteur minimale imposée : le vide sous les boutons disparaît, la carte fait la taille de
  son contenu (≈ 430 px au lieu de 520). Titre à `clamp(27px,8.6vw,36px)`, chapô à 13 px, deux boutons
  de largeur égale.
- Le mot-symbole `PROMOS` revient dans la carte (`line-height:.95`, sans `translateY`) au lieu d'être
  coupé par son bord. Les marges basses gardent `env(safe-area-inset-*)`.
- Vérifié à 360, 390, 414, 768 et 1280 px : aucun débordement horizontal, polices locales chargées.

## Mesure du démarrage

Mesuré avant d'alléger quoi que ce soit (`node`, V8, 5 passes) :

| Fichier | Taille | gzip | `JSON.parse` |
| --- | --- | --- | --- |
| `data/promos.json` | 2,02 Mo | 0,36 Mo | 6,5 ms |
| `data/tailles_index.json` | 0,74 Mo | 0,13 Mo | 5,4 ms |
| `data/history.json` | 0,71 Mo | — | 3,6 ms |

Conclusion : GitHub Pages compresse déjà, le parsing pèse une dizaine de millisecondes. Un découpage
en plusieurs payloads ne se justifiait pas. Seule optimisation retenue : l'index des tailles part
**en même temps** que `promos.json` (`fetchSizeIndex` avant la requête, `applySizeIndex` après le
parsing) au lieu d'attendre ; et `history.json` n'est chargé qu'après la grille, à l'inactivité.

## Monétisation — décision à prendre, pas encore codée

Aucun lien affilié n'est posé aujourd'hui et aucun classement n'est vendu. Si la question se pose,
elle doit être tranchée **avant** d'ajouter des boutiques : le choix des sources et l'ordre des résultats
en dépendent. Trois options, par ordre de discrétion : rien (statu quo), liens affiliés signalés dans
la fiche, ou emplacements sponsorisés séparés de la grille. Le point non négociable est la transparence :
la page méthode affirme qu'aucun classement n'est vendu, il faudrait la corriger en même temps.

## Boutiques — état

Cinq sources. En ajouter suppose un adaptateur et un relevé réel pour le valider ; l'IP de la VM de
développement est limitée par Shopify (`local_rate_limited`), donc aucun ajout n'a été tenté ici :
`data/sante.json` absorbe déjà la surveillance (alerte si une boutique perd plus de la moitié de ses
articles), ce qui rend l'extension possible sans devenir aveugle.

## Tests

`python -m unittest discover -p 'test*.py'` (lancé par le workflow horaire) couvre :
- les prix par taille (`test_size_prices.py`)
- le choix d'offre et les marques du scraper (`test_scraper.py`)
- l'intégrité des JSON livrés : bornes = variantes disponibles, `articles`/`by_link` cohérents,
  index identique aux bornes (`test_data_integrity.py`)
- le diagnostic de santé des collectes (`test_verifie_sante.py`, sans réseau)
- l'interface dans un vrai navigateur (`test_interface.py`, ignoré si Playwright est absent) : grille
  remplie, aucun débordement horizontal, tiroir et fiche qui s'ouvrent et se ferment, recherche
  tolérante, lien profond `#p=`, et aucune erreur console. En local :
  `pip install playwright && python -m playwright install chromium`, puis
  `python -m unittest test_interface`. Le workflow horaire ne l'installe pas : il est ignoré.

## Interface

- Démarrage : `index.html` + `data/promos.json` + `data/tailles_index.json` (~0,8 Mo) ;
  `data/prix_tailles.json` (une offre par taille et état) n'est chargé qu'à l'ouverture d'une fiche produit.
- La fourchette affichée en haut d'une fiche est calculée à partir des mêmes prix par taille que le bloc
  de tailles : `min`/`max` de l'index = minimum et maximum du bloc.
- Fiche produit : tailles et prix, offres par état (neuf / reconditionné), historique de prix,
  alerte de prix barré peu crédible, lien profond partageable `#p=<lien>&t=<taille>`.
- Fermeture d'une fiche : bouton ✕ de 42 × 42 px dans une barre haute ancrée au panneau (hors flux,
  fond papier + filet), donc toujours atteignable même avec des centaines de tailles. Le panneau est
  borné à `88dvh` (repli `88vh`) : il ne peut plus dépasser l'écran visible des navigateurs mobiles.
  Le contenu défile dessous ; le fond assombri et la touche Échap ferment aussi la fiche.
- Bandeau : 58 px, wordmark Archivo 900, liens discrets (favoris, alertes, boutiques) et un bouton
  rond « filtres » avec pastille orange du nombre de filtres actifs. Recherche arrondie, pastilles de
  filtres actifs en pilules.
- Accueil éditorial : bandeau promo orange refermable (choix mémorisé), héro typographique, carrousel
  de cinq stories (image générée, titre en capitales, texte court, flèche ronde ↗), tuiles carrées de
  catégories en défilement horizontal, puis trending : les dix meilleures remises de la semaine,
  dédoublonnées par marque et par type, numérotées. Chaque tuile applique sa catégorie et son type.
- Fiche : bloc « L’HISTOIRE » (pourquoi la pièce existe, qui est derrière, ce qu’elle raconte, frise
  création → sortie → réédition, citation, « dans le même univers »), et indicateur de bon plan
  (« au plus bas depuis X j », « stock limité ») calculé sur l’historique et les tailles disponibles.
  Les textes sont stockés dans `HISTOIRES` (`app.js`) : 79 entrées, soit près de soixante-dix
  marques (Nike, adidas, Carhartt WIP, Levi’s, Stone Island, Gramicci, Casablanca, Edwin, Vans,
  Supreme, Patta, Kardo, Entire Studios, Homecore, Staple, Club 1984, Prada, Burberry, Acne
  Studios, Barbour, Butter Goods, TALA…), sinon une entrée par type d’article, sinon un texte
  générique. Dates et faits recoupés avec les sources des marques (Levi’s, Stone Island, Salomon,
  Gramicci, Edwin, A.P.C., Universal Works, Denim Tears, Peachy Den, Kardo, Homecore, Staple,
  Prada, Burberry, Acne Studios, Barbour, Butter Goods, TALA).
- Identité : `SIG` (`app.js`) donne une année de naissance et une signature courte par marque ;
  la carte l’affiche sous le nom, la fiche en tête (« Depuis 1985 · … »). Repli par type d’article
  sans date pour les marques inconnues, jamais de date inventée.
- La paire du jour : `PAIRES` (`app.js`) réunit une trentaine de modèles dont la date de sortie et
  l’idée d’origine sont documentées (swoosh, semelle liège, air visible, split tongue…). Le bloc
  change chaque jour, passe en tête le jour de l’anniversaire quand la date exacte est connue
  (Air Max 1 le 26 mars, Vans le 16 mars), et propose la fiche de la paire si elle est en promo,
  sinon les sneakers du jour. Aucun classement payé n’entre dans le choix.
- Produit voyageur : un seul article (le premier résultat avec image) fixé en `position:fixed`, déplacé
  et estompé au défilement. Masqué sous 900 px et sous `prefers-reduced-motion`.
- Barre mobile fixe en bas (Accueil, Rechercher, Wishlist, Catégories, Profil), 64 px + zone de
  sécurité iOS ; le contenu est décalé d’autant et le bouton retour en haut passe au-dessus.
- Carte produit : toute la surface ouvre la fiche — image, marque, nom, prix, tailles. Seul le
  bouton « Voir l’offre » garde son lien boutique (`target="_blank"`), et le cœur reste
  indépendant de la carte.
- Navigation : une seule entrée d’historique par couche (fiche produit, tiroir de filtres) ; le
  Retour, Échap ou ✕ ferment la couche sans recharger la page. Un lien direct `#p=…` ouvre la fiche
  sur une entrée neuve, donc la croix la ferme au lieu de la rouvrir. Recherche, filtres et onglets
  amènent aux résultats (repère : le titre « Toutes les promos »), et l’onglet actif suit la vue
  réelle (favoris, recherche, catégories, profil). L’onglet Profil ouvre le tiroir directement sur
  le bloc de tailles, déplié.
- Historique : la courbe est tracée à l'ouverture (`strokeDashoffset` animé ~2 s).
- Filtres : cinq sections — catégories (avec le type d’article et les collections sous les puces
  de catégorie), prix & boutique, tailles & marques, alertes, affichage. Le type d’article
  (manteau, veste, sweat, chemise, short, pantalon, sneakers…) est déduit du titre, du rayon et des
  étiquettes, avec son compteur par catégorie : aucun article n’est masqué sans que la puce
  correspondante soit visible et désactivable. Seuls les huit types les plus fournis sont
  affichés ; les autres sont repliés derrière « Plus de types », et le type choisi reste
  visible même replié (puce et pastille). Seules les catégories sont
  ouvertes à l'ouverture du tiroir ; le profil tailles vit dans la section tailles au lieu d'occuper
  sa propre section. Le filtre de genre (Femme, Homme, Unisexe) est calculé, pas deviné :
  l'étiquette `gender:` de la boutique fait foi (Mens + Womens = unisexe), sinon son rayon dans
  l'URL (`baskets-femme`, `baskets-homme`), sinon le titre (`Women's`, `Wmns`, `W'`, `Men's`) ;
  sans signal explicite, l'article est rangé avec les unisexes plutôt que dans un genre inventé.
  Chaque puce affiche son nombre d'articles dans la catégorie courante ; le choix reste visible
  (pastille, badge, compteur) et il est enregistré avec les autres préférences.
- Dédoublonnage : un même modèle vendu par plusieurs boutiques n'apparaît qu'une fois
  (désactivable via « Regrouper les doublons »).
- Mes alertes : recherches enregistrées localement, avec le nombre d'articles et de nouveautés.
  La fiche réserve un emplacement `<div id="veilleSlot">` que `veille.js` remplit via
  `Veille.majAlertes()` : pas de réécriture de `openAlerts`, la fiche reste dessinée par `app.js`.
- Veille (`veille.js`) : notifications locales. À chaque relevé (événement `promos:maj` émis par
  `loadPromos`), chaque alerte enregistrée et chaque seuil personnel sont revérifiés ; jusqu'à quatre
  notifications sont envoyées par le service worker, une seule fois par article et par prix
  (`ls("vus")`, borné à 400 repères). **Limite assumée : un site statique ne se réveille pas seul** —
  la veille sonne quand le site est ouvert ou tant que l'onglet vit en arrière-plan. Le dire est
  préférable à le laisser croire ; c'est écrit dans l'interface et sur la page méthode.
- Seuil par article : « M'alerter sous X € » dans la fiche, stocké avec le nom de l'article, prévient
  dès que le prix passe sous le seuil (et non seulement en cas de baisse déclarée par la boutique).
- Comparateur : la fiche liste les autres boutiques du même modèle, triées par prix, avec le prix de
  la taille sélectionnée quand il est connu, l'écart avec l'offre courante et un repère « meilleur prix ».
- Badges d'historique : « PLUS BAS · N J » quand le prix courant égale le minimum relevé, « MIN N J · x € »
  sinon. `N` est l'ancienneté réelle des relevés de l'article (5 jours aujourd'hui), jamais un
  90 jours théorique : le badge ne promet pas plus d'historique qu'il n'en existe. Rien n'est affiché
  sous trois relevés, un « plus bas » sur un point unique ne veut rien dire. Les badges sont posés
  après coup (`annotateBasSuivi`) sans redessiner la grille.
- Baisses depuis la dernière visite : une photo des prix (`prix_visite`) est gardée d'une visite
  à l'autre ; le bandeau annonce les articles réellement moins chers depuis, avec une date de
  référence, et un filtre dédié. « Ignorer » remet le compteur à zéro. Cela ne dépend pas de la
  granularité quotidienne de l'historique.
- Tailles épuisées : l'index publie les pointures dont toutes les variantes sont parties (`e`).
  Elles restent visibles, sans prix inventé, et « Me prévenir si elle revient » enregistre une
  surveillance ; la veille prévient au relevé où la taille réapparaît.
- Prix par taille : avec une seule taille sélectionnée, « Prix maximum » et les tris de prix portent
  sur cette taille, pas sur le plus bas de l'article.
- Recherche sans résultat exact : les articles partageant au moins un terme sont proposés, avec une
  mention explicite, et la requête reste notée dans `ls("vides")` pour compléter les synonymes et
  les marques manquantes. Cette liste ne s'affiche plus dans le tiroir : elle n'aide pas à choisir
  un article.
- Comparateur : ligne « prix médian ailleurs » qui juge le prix barré sur les prix réellement
  pratiqués par les autres boutiques, au lieu d'une règle arbitraire.
- Veille : en plus des alertes et des seuils, deux contrôles — retour en stock d'une taille
  surveillée, et « moins cher ailleurs » (15 % ou plus) pour un article dont un seuil est suivi.
  Les deux passent par la même déduplication et la même limite de quatre notifications.
- Accessibilité : le focus revient à l'élément qui a ouvert une couche, la tabulation reste piégée
  dans la fiche et le tiroir, `aria-expanded` suit le bouton filtres, et le compteur de résultats
  est en `aria-live`.
- Sélection de la semaine : cinq articles au plus bas depuis le début du suivi, classés par remise
  affichée, calculés après l'inactivité et masqués dès qu'un filtre ou un tri est actif.
- Recherche tolérante : accents et pluriels normalisés, synonymes du vestiaire (`chaussures` ↔ `sneaker`,
  `sweat` ↔ `hoodie`…), et un nombre cherché correspond aussi à une taille. Les requêtes sans résultat
  sont mémorisées dans `ls("vides")` (40 dernières), sans affichage dans l'interface, pour arbitrer
  la suite.
- Profil tailles : « Filtrer tout le catalogue » applique les trois tailles du profil à tous les
  résultats, sans les perdre au changement de catégorie (`syncProfFilter` après `pruneSZBR`).
- Favoris partageables : `#f=` porte la liste encodée en base64url ; à l'ouverture, un bandeau propose
  d'importer les liens encore en promo. « Partager mes favoris » est dans le tiroir, section Alertes.
- Bandeau « nouvelle version » : `controllerchange` du service worker déclenche un rechargement proposé,
  sans écraser la position de lecture.
- Pied de page : méthode, état des collectes, flux RSS. Pages `methode.html` (règles de calcul, limites)
  et `etat.html` (santé par boutique, lue dans `data/sante.json`).
