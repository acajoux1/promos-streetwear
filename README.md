# PROMOS.

Radar personnel des promos streetwear : cinq boutiques comparées, prix vérifié taille par taille,
historique du plus bas vu, alertes et veille locales. Site statique (HTML, CSS, JavaScript sans
dépendance), données collectées chaque heure par GitHub Actions et publiées sur GitHub Pages.

- Site : https://acajoux1.github.io/promos-streetwear/
- Méthode de calcul : `methode.html` · État des collectes : `etat.html`

## Structure

- `index.html`, `app.js`, `style.css` : l’interface (filtres par catégorie et par type, par genre,
  prix, tailles, marques, fiche produit, favoris, comparateur).
- `veille.js` : notifications locales (alertes, seuils, retours en stock), sans serveur.
- `sw.js`, `manifest.json` : service worker et installation en PWA.
- `scraper.py`, `size_prices.py`, `feed.py`, `verifie_sante.py` : collecte horaire, prix par taille,
  flux RSS et fiches SEO, contrôle de santé.
- `enrich.py` : notes de style par article, écrites avec un modèle et affichées dans la fiche.
- `agents/` et `.github/workflows/agent-*.yml` : deux agents autonomes — structure et expérience
  utilisateur d’un côté, histoires de marques vérifiées par leurs sources de l’autre. Ils travaillent
  sur une branche et ouvrent une pull request, jamais sur `main` ; sans `AI_API_KEY`, ils s’arrêtent
  sans rien changer.
- `data/` : promos, historique, prix par taille, index des tailles, état des collectes.

## Vérifier en local

```sh
python3 -m http.server 3001        # puis http://127.0.0.1:3001
node --check app.js && node --check veille.js && node --check sw.js
python3 -m unittest discover -p 'test*.py'
```

Aucun compte, aucun serveur applicatif, aucun traceur : les préférences et favoris restent dans le
navigateur.
