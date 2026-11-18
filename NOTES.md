# Appli Promos Streetwear : notes pour l'assistant

Je modifie mon appli uniquement depuis un iPhone (GitHub mobile) et je ne sais pas modifier du code ligne par ligne. Réponds en français, court et direct.

## Règles de réponse
- Décide sans hésiter : fais l'hypothèse la plus probable et dis-la en une ligne. Une seule question, seulement si tu es bloqué.
- Pas d'introduction, pas de récapitulatif, pas de politesse. Réponse simple = 1 à 3 phrases.
- Pas d'améliorations non demandées (au plus une idée courte à la fin).

## Règles pour le code
- Renvoie uniquement les fichiers qui changent, chacun UNE SEULE FOIS, en un bloc complet à recoller. Jamais de code répété.
- Avant les blocs : une ligne par fichier « fichier : ce qui change ». Après : étapes en 3 à 5 lignes.
- Garde le style et la structure existants. Pas de commentaires dans le code.
- Tout changement de index.html, style.css ou app.js impose de changer la version dans sw.js (promos-vN suivant) et de donner sw.js complet.
- Python : indentation exacte, fichier complet.
- app.js doit se terminer par navigator.serviceWorker.register("sw.js")… (sinon l'appli reste bloquée sur les cases animées).
- Si je ne t'ai pas donné le fichier à jour et que tu n'es pas sûr de son contenu, demande-moi de le coller. Ne devine ni adresse, ni structure de site, ni API.
- Je ne contourne jamais le blocage d'un site.
- Si j'envoie une capture d'erreur : cause probable + une seule vérification, avant tout code.

## Étapes standard (à rappeler en une ligne)
Commit changes (deux fois), attendre 1 à 2 minutes, fermer l'appli et la rouvrir deux fois. Si le relevé est concerné : Actions > Mise à jour des promos > Run workflow.

## Projet
- Dépôt : github.com/acajoux1/promos-streetwear, publié sur https://acajoux1.github.io/promos-streetwear/ (GitHub Pages).
- Fichiers : index.html (structure + décor SVG), style.css, app.js (toute la logique), sw.js (cache hors ligne), manifest.json, scraper.py, .github/workflows/maj.yml (relevés à 9 h et 20 h heure de La Réunion), data/promos.json et data/history.json (générés).
- Article : boutique, marque, nom, prix, ancien_prix, remise, tailles, image, lien, cat, et selon l'historique prec, chg, pmin, inf. promos.json contient aussi maj et statut par boutique.
- Boutiques branchées : Starcow Paris et END. (Shopify, products.json), Footshop (lue dans le HTML), Laced Run (Shopify, à confirmer). Liens seulement : Fenom (403), Lacoste seconde main (catalogue privé), Footpatrol (403).
- Ajouter une boutique Shopify = une ligne dans SOURCES de scraper.py. Pour toute autre boutique, il faut d'abord un test lisant la page depuis GitHub Actions.
- Thème : Miami Vice sombre et rétro (coucher de soleil, palmiers), couleurs douces, barre blanc-rouge-vert de Madagascar sous le titre.
- Fonctions : menu ☰ en sections repliables, pastilles de filtres, favoris, alertes (sur l'appareil), fiche produit glissante, top 30, baisses, filtre « Livre à La Réunion » (liste RE_OK dans app.js), comparateur, mode compact, mémoire de position, défilement infini (48 articles par lot).

## État actuel (à mettre à jour après chaque modification)
- Version du cache : promos-v10
- Dernière modification : défilement replacé sous la barre de recherche à chaque changement de filtre, mode compact, mémoire de position, fermeture de la fiche par glissement.
- Point en suspens : Laced Run n'apparaissait pas dans l'appli. À vérifier dans Actions > Mise à jour des promos > Run python scraper.py (ligne « Laced Run : … » ?) ou en cherchant « Laced Run » dans data/promos.json.
