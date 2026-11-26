"""Contrôle de santé des collectes.

Lancé par le workflow après la publication des données : en cas d'échec, GitHub
prévient le propriétaire du dépôt. Le contrôle ne bloque jamais la publication,
il sert à ce qu'une boutique muette ou des données figées ne passent pas
inaperçues — `etat.html` les affichait déjà, mais personne ne le lisait.
"""
import json
import os
from datetime import datetime, timezone

PROMOS = "data/promos.json"
SANTE = "data/sante.json"
AGE_MAX_H = 3
MIN_ARTICLES = 500
# GitHub Pages plafonne le site à 1 Go, et le dépôt republie ses données à
# chaque passage : à 300 Mo, il reste largement le temps de réagir.
TAILLE_MAX_MO = 300


def charger(chemin):
    try:
        with open(chemin, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def age_heures(maj, maintenant=None):
    maintenant = maintenant or datetime.now(timezone.utc)
    try:
        t = datetime.strptime(str(maj)[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None
    return (maintenant - t).total_seconds() / 3600


def taille_livree(racine="."):
    """Taille en Mo de ce qui est réellement publié (données, fiches, flux)."""
    total = 0
    for dossier in ("data", "p"):
        for chemin, _, fichiers in os.walk(os.path.join(racine, dossier)):
            for nom in fichiers:
                try:
                    total += os.path.getsize(os.path.join(chemin, nom))
                except OSError:
                    pass
    for nom in ("feed.xml", "sitemap.xml"):
        try:
            total += os.path.getsize(os.path.join(racine, nom))
        except OSError:
            pass
    return total / 1e6


def diagnostic(promo, sante, maintenant=None, age_max=AGE_MAX_H, minimum=MIN_ARTICLES,
               taille_mo=None, taille_max=TAILLE_MAX_MO):
    problemes = []
    items = promo.get("items") or []
    age = age_heures(promo.get("maj"), maintenant)
    if age is None:
        problemes.append("date de relevé illisible")
    elif age > age_max:
        problemes.append(f"relevé vieux de {age:.0f} h (seuil {age_max} h)")
    if len(items) < minimum:
        problemes.append(f"{len(items)} articles seulement (seuil {minimum})")
    for nom, etat in (promo.get("statut") or {}).items():
        if etat.get("ok") is False:
            problemes.append(f"{nom} n’a pas répondu (reprise de {etat.get('n', 0)} anciens articles)")
    for nom, etat in (sante.get("boutiques") or {}).items():
        if etat.get("alerte"):
            problemes.append(f"{nom} : {etat.get('n')} articles contre {etat.get('avant')} au relevé précédent")
    if taille_mo is not None and taille_mo > taille_max:
        problemes.append(f"{taille_mo:.0f} Mo publiés (seuil {taille_max} Mo)")
    return problemes


def main():
    promo = charger(PROMOS)
    if not promo:
        print("promos.json absent ou illisible")
        return 1
    problemes = diagnostic(promo, charger(SANTE), taille_mo=taille_livree())
    if not problemes:
        print(f"Collectes en ordre : {len(promo.get('items') or [])} articles")
        return 0
    print("PROBLÈME DE COLLECTE")
    for p in problemes:
        print(" -", p)
    print("Voir etat.html et les journaux du workflow.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
