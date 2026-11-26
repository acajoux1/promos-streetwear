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
from datetime import datetime, timezone

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


def api_json(url, jeton, timeout=20):
    """Objet JSON de l'API GitHub, ou None si le réseau ou le jeton ne suit pas."""
    req = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + jeton,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "promos-surveillance/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8", "replace"))
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError,
            ValueError):
        return None


def relance_utile(jeton, depot=DEPOT, maintenant=None, fenetre_min=20, api=None):
    """(faut-il relancer, explication) : évite une boucle de relances.

    `surveillance.yml` tourne aussi à la fin de chaque `maj.yml` : sans ce
    garde-fou, une page publiée quelques secondes trop tard serait prise pour
    un relevé figé et relancerait la collecte en boucle. On ne relance donc ni quand
un passage est déjà en file, ni quand le dernier s'est terminé il y a moins de
vingt minutes (déploiement Pages compris).
    """
    if not jeton:
        return False, "pas de jeton"
    api = api or api_json
    url = "https://api.github.com/repos/%s/actions/workflows/%s/runs?per_page=10" % (
        depot, WORKFLOW)
    data = api(url, jeton)
    if not isinstance(data, dict):
        return True, "état des passages illisible"
    runs = [r for r in data.get("workflow_runs") or [] if isinstance(r, dict)]
    for r in runs:
        if (r.get("status") or "").lower() in (
                "queued", "in_progress", "waiting", "requested", "pending"):
            return False, "un passage est déjà en cours"
    maintenant = maintenant or datetime.now(timezone.utc)
    for r in runs:
        if (r.get("status") or "").lower() != "completed":
            continue
        fin = r.get("updated_at") or r.get("run_started_at") or r.get("created_at")
        try:
            t = datetime.fromisoformat(str(fin).replace("Z", "+00:00"))
        except ValueError:
            continue
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
        minutes = (maintenant - t).total_seconds() / 60
        if 0 <= minutes < fenetre_min:
            return False, "passage terminé il y a %d min" % minutes
    return True, "aucun passage récent"


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
        depot = os.environ.get("GITHUB_REPOSITORY") or DEPOT
        utile, raison = relance_utile(jeton, depot)
        if not utile:
            print("Pas de relance : %s. Le prochain contrôle tranchera." % raison)
            return 0
        if relancer(depot, jeton):
            print("Collecte relancée (%s) : le passage suivant devrait rafraîchir les données."
                  % WORKFLOW)
            return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
