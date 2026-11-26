#!/usr/bin/env python3
"""Contrôle de couverture des données publiées.

Les garde-fous existants comptent les articles et comparent chaque boutique au
relevé précédent ; aucun ne regarde ce qui manque *dans* les articles. Un
parseur qui se casse à moitié (prix par taille, image, prix barré) passe donc
sous les radars tant que le total tient.

Lancé par `maj.yml` après la publication : les données déjà valides sont en
ligne, et un échec ici prévient le mainteneur par le courriel de GitHub, puis
par l'issue d'incident (`incident.yml`).
"""
import json
import sys

PROMOS = "data/promos.json"
INDEX = "data/tailles_index.json"

# Calibrés sous les valeurs observées (images et remises à 100 %, tailles
# au-delà de 90 %) : un passage ne doit pas alerter pour un écart ordinaire.
SEUILS = {"tailles": 0.80, "images": 0.90, "remise": 0.80}


def taux(promo, index):
    """Part des articles avec prix par taille, image et prix barré."""
    items = [x for x in (promo or {}).get("items") or [] if isinstance(x, dict)]
    total = len(items)
    if not total:
        return {"tailles": 0.0, "images": 0.0, "remise": 0.0, "articles": 0}
    by_link = (index or {}).get("by_link") if isinstance(index, dict) else None
    by_link = by_link if isinstance(by_link, dict) else {}

    def a_des_tailles(x):
        entree = by_link.get(x.get("lien")) or {}
        tailles = entree.get("p") if isinstance(entree, dict) else None
        return bool(tailles)

    def a_une_remise(x):
        ancien = x.get("ancien_prix")
        prix = x.get("prix")
        return (isinstance(ancien, (int, float)) and isinstance(prix, (int, float))
                and ancien > prix)

    return {
        "articles": total,
        "tailles": sum(1 for x in items if a_des_tailles(x)) / total,
        "images": sum(1 for x in items if x.get("image")) / total,
        "remise": sum(1 for x in items if a_une_remise(x)) / total,
    }


def diagnostic(promo, index, seuils=None):
    """Problèmes de couverture, du plus grave au moins grave."""
    seuils = seuils or SEUILS
    mesures = taux(promo, index)
    if not mesures["articles"]:
        return ["aucun article à mesurer"]
    problemes = []
    for cle, libelle in (("tailles", "prix par taille"), ("images", "images"),
                         ("remise", "prix barrés")):
        part = mesures[cle]
        if part < seuils[cle]:
            problemes.append("%s : %.0f %% des articles (seuil %.0f %%)"
                             % (libelle, 100 * part, 100 * seuils[cle]))
    return problemes


def charger(chemin):
    try:
        with open(chemin, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def main():
    promo, index = charger(PROMOS), charger(INDEX)
    mesures = taux(promo, index)
    print("Couverture : %d articles · tailles %.1f %% · images %.1f %% · remises %.1f %%"
          % (mesures["articles"], 100 * mesures["tailles"],
             100 * mesures["images"], 100 * mesures["remise"]))
    problemes = diagnostic(promo, index)
    if not problemes:
        return 0
    print("COUVERTURE INSUFFISANTE")
    for p in problemes:
        print(" -", p)
    return 1


if __name__ == "__main__":
    sys.exit(main())
