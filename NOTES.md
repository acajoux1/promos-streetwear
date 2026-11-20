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
- Feuilles de style : tout est dans `style.css` (base, fiches, héro, habillage pixel art).
- Version du cache du service worker : `promos-v24` (`sw.js`)

## Tests

`python -m unittest discover -p 'test*.py'` (lancé par le workflow horaire) couvre :
- les prix par taille (`test_size_prices.py`)
- le choix d'offre et les marques du scraper (`test_scraper.py`)
- l'intégrité des JSON livrés : bornes = variantes disponibles, `articles`/`by_link` cohérents,
  index identique aux bornes (`test_data_integrity.py`)

## Interface

- Démarrage : `index.html` + `data/promos.json` + `data/tailles_index.json` (~0,8 Mo) ;
  `data/prix_tailles.json` (une offre par taille et état) n'est chargé qu'à l'ouverture d'une fiche produit.
- La fourchette affichée en haut d'une fiche est calculée à partir des mêmes prix par taille que le bloc
  de tailles : `min`/`max` de l'index = minimum et maximum du bloc.
- Fiche produit : tailles et prix, offres par état (neuf / reconditionné), historique de prix,
  alerte de prix barré peu crédible, lien profond partageable `#p=<lien>&t=<taille>`.
- Fermeture d'une fiche : bouton ✕ de 46 × 46 px dans une barre haute qui ne défile pas
  (le contenu défile dessous), plus le fond assombri et la touche Échap.
- Décor : ciel pixel art animé (étoiles filantes, nuages, ville, lucioles), lignes de balayage
  et coins pixel sur les cartes. Tout est désactivé par `prefers-reduced-motion`.
- Filtres, budget rapide (≤ 100/150/200 €) et tailles choisies sont mémorisés dans `localStorage`.
- Dédoublonnage : un même modèle vendu par plusieurs boutiques n'apparaît qu'une fois
  (désactivable via « 🧩 Regrouper les doublons »).
- Mes alertes : recherches enregistrées localement, avec le nombre d'articles et de nouveautés.
  Aucune notification système : rien ne s'affiche lorsque l'application est fermée.
