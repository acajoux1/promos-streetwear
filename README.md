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
- `pipeline.py`, `scraper.py`, `size_prices.py`, `feed.py` : collecte horaire, prix par taille, flux
  RSS et fiches SEO, dans cet ordre et arrêtés à la première étape en échec.
- `verifie_sante.py`, `verifie_site.py` : contrôle des fichiers après la collecte, et du site
  réellement publié (avec relance automatique de la collecte si les données sont figées).
- `version_sw.py` : version du cache du service worker, dérivée du contenu de la coquille.
- `requirements-ci.txt` : dépendances de test épinglées (Playwright et son Chromium).
- `enrich.py` : notes de style par article, écrites avec un modèle et affichées dans la fiche.
- `agents/` et `.github/workflows/agent-*.yml` : deux agents autonomes — structure et expérience
  utilisateur d’un côté, histoires de marques vérifiées par leurs sources de l’autre. Ils travaillent
  sur une branche et ouvrent une pull request, jamais un commit direct sur `main` ; la proposition de
  structure attend une relecture, l’agent histoire fusionne la sienne en squash quand ses contrôles
  passent. Sans aucune clé, ils s’arrêtent sans rien changer. Les notes de style ont leur propre
  tâche (`agent-notes.yml`).
- `data/` : promos, historique, prix par taille, index des tailles, état des collectes.

## Vérifier en local

```sh
python3 -m http.server 3001        # puis http://127.0.0.1:3001
node --check app.js && node --check veille.js && node --check sw.js
python3 -m unittest discover -p 'test*.py'
python3 pipeline.py                 # collecte + prix par taille + flux, en local
python3 version_sw.py --verifier     # la version du cache suit-elle la coquille ?
```

Les tests d’interface demandent Playwright : `python3 -m pip install -r requirements-ci.txt &&
python3 -m playwright install --with-deps chromium` (sinon ils sont ignorés, sans échec).

Aucun compte, aucun serveur applicatif, aucun traceur : les préférences et favoris restent dans le
navigateur.
