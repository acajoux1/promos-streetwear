#!/usr/bin/env python3
"""Contrôle du site réellement publié, et chien de garde des collectes.

`verifie_sante.py` regarde les fichiers du dépôt après la collecte ; personne
ne regardait la page servie. Ici une tâche horaire (`surveillance.yml`) ouvre
l'accueil, `promos.json` et l'index des tailles : la page répond-elle, le
catalogue est-il complet, le relevé a-t-il moins de trois heures ?

Si le relevé est figé, la tâche relance `maj.yml` par l'API. Le planificateur
de GitHub ne respecte pas l'heure demandée et saute parfois un passage : la
relance répare au lieu d'attendre le suivant.

Sortie : 0 si tout va bien (ou si la relance est partie), 1 sinon — GitHub
prévient alors le propriétaire du dépôt.
"""
import json
import os
import sys
import urllib.error
import urllib.request

from verifie_sante import age_heures

BASE = "https://acajoux1.github.io/promos-streetwear/"
AGE_MAX_H = 3
MIN_ARTICLES = 500
WORKFLOW = "maj.yml"
DEPOT = "acajoux1/promos-streetwear"


def charger(url, timeout=20):
    """(code HTTP, texte) ; le texte est vide en cas d'échec réseau."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "promos-surveillance/1.0",
            "Cache-Control": "no-cache",
            "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.getcode(), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print("Réseau :", e)
        return 0, ""


def diagnostic(promo, accueil=None, maintenant=None, age_max=AGE_MAX_H,
               minimum=MIN_ARTICLES):
    """Problèmes d'un relevé publié ; `accueil` vide ou absent = non vérifié."""
    problemes = []
    if accueil is not None and "promos" not in accueil.lower():
        problemes.append("accueil sans le mot PROMOS (page vide ou remplacée)")
    items = (promo or {}).get("items") or []
    age = age_heures((promo or {}).get("maj"), maintenant)
    if age is None:
        problemes.append("date de relevé illisible")
    elif age > age_max:
        problemes.append("relevé vieux de %.0f h (seuil %s h)" % (age, age_max))
    if len(items) < minimum:
        problemes.append("%d articles seulement (seuil %d)" % (len(items), minimum))
    return problemes


def verifier(base=BASE):
    """(promo, problèmes) du site en ligne."""
    problemes = []
    code, accueil = charger(base)
    if code != 200:
        problemes.append("accueil HTTP %s" % (code or "injoignable"))
        accueil = None

    pcode, ptexte = charger(base + "data/promos.json")
    promo = {}
    if pcode != 200:
        problemes.append("promos.json HTTP %s" % (pcode or "injoignable"))
    else:
        try:
            promo = json.loads(ptexte)
        except ValueError:
            problemes.append("promos.json illisible")

    problemes += diagnostic(promo, accueil)

    icode, _ = charger(base + "data/tailles_index.json")
    if icode != 200:
        problemes.append("tailles_index.json HTTP %s" % (icode or "injoignable"))
    return promo, problemes


def relancer(depot=DEPOT, jeton="", workflow=WORKFLOW, branche="main"):
    """Déclenche `maj.yml` par l'API ; vrai si GitHub a accepté la demande."""
    if not jeton:
        print("Pas de jeton : relance impossible.")
        return False
    url = "https://api.github.com/repos/%s/actions/workflows/%s/dispatches" % (
        depot, workflow)
    req = urllib.request.Request(
        url,
        data=json.dumps({"ref": branche}).encode("utf-8"),
        method="POST",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": "Bearer " + jeton,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "promos-surveillance/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.getcode() == 204
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = e.read().decode("utf-8", "ignore")[:200]
        except OSError:
            pass
        print("Relance refusée : HTTP %s %s" % (e.code, detail.strip()))
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print("Relance impossible :", e)
    return False


def main():
    promo, problemes = verifier()
    if not problemes:
        print("Site en ligne : relevé de %s, %d articles." % (
            promo.get("maj"), len(promo.get("items") or [])))
        return 0
    print("SITE À VÉRIFIER")
    for probleme in problemes:
        print(" -", probleme)
    if any("vieux" in p for p in problemes):
        jeton = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""
        if relancer(os.environ.get("GITHUB_REPOSITORY") or DEPOT, jeton):
            print("Collecte relancée (%s) : le passage suivant devrait rafraîchir les données."
                  % WORKFLOW)
            return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
