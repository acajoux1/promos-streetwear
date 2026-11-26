#!/usr/bin/env python3
"""Contrat de forme des données publiées.

Les tests unitaires couvrent des fixtures ; rien ne vérifiait la forme des
fichiers réellement produits. Une collecte peut écrire un `promos.json` valide
en JSON mais inutilisable par l'interface (prix nul, lien manquant, doublon) :
le site s'affiche alors vide ou faux sans qu'aucun test ne rougisse.

Lancé par `pipeline.py` avant le flux : un fichier hors contrat arrête le
passage au lieu d'être publié. `tailles_index.json` n'est validé que s'il vient
de la même collecte — après un échec des prix par taille, l'index de la veille
reste en place et n'est pas une faute.
"""
import json
import sys

PROMOS = "data/promos.json"
INDEX = "data/tailles_index.json"


def lien_valide(valeur):
    return isinstance(valeur, str) and valeur.startswith("http")


def prix_valide(valeur):
    return (isinstance(valeur, (int, float)) and not isinstance(valeur, bool)
            and valeur > 0)


def valider_promos(promo):
    """Problèmes bloquants d'un `promos.json` ; liste vide = publiable."""
    if not isinstance(promo, dict):
        return ["promos.json n'est pas un objet"]
    problemes = []
    if not promo.get("maj"):
        problemes.append("date de relevé absente")
    items = promo.get("items")
    if not isinstance(items, list) or not items:
        return problemes + ["aucun article"]
    liens, doublons, incomplets = set(), 0, 0
    for x in items:
        if not isinstance(x, dict):
            incomplets += 1
            continue
        lien = x.get("lien")
        if not lien_valide(lien):
            incomplets += 1
            continue
        if lien in liens:
            doublons += 1
        liens.add(lien)
        if not prix_valide(x.get("prix")):
            incomplets += 1
        elif not (x.get("nom") and x.get("boutique")):
            incomplets += 1
    if incomplets:
        problemes.append("%d article(s) incomplet(s)" % incomplets)
    if doublons:
        problemes.append("%d doublon(s) de lien" % doublons)
    return problemes


def valider_index(index, promo=None):
    """Problèmes d'un `tailles_index.json` de la même collecte que `promo`."""
    if not isinstance(index, dict):
        return ["tailles_index.json n'est pas un objet"]
    if promo is not None and index.get("maj") != promo.get("maj"):
        return []  # index de la collecte précédente : rien à lui reprocher
    by_link = index.get("by_link")
    if not isinstance(by_link, dict):
        return ["by_link absent ou mal typé"]
    problemes = []
    total = index.get("total")
    if isinstance(total, int) and total != len(by_link):
        problemes.append("total %d contre %d fiches" % (total, len(by_link)))
    liens_promo = None
    if isinstance(promo, dict) and isinstance(promo.get("items"), list):
        liens_promo = {x.get("lien") for x in promo["items"] if isinstance(x, dict)}
    mauvais, inconnus = 0, 0
    for lien, entree in by_link.items():
        if liens_promo is not None and lien not in liens_promo:
            inconnus += 1
        if not isinstance(entree, dict):
            mauvais += 1
            continue
        mini, maxi = entree.get("min"), entree.get("max")
        if not (prix_valide(mini) and prix_valide(maxi)) or mini > maxi:
            mauvais += 1
            continue
        tailles = entree.get("p")
        if tailles is not None and not isinstance(tailles, dict):
            mauvais += 1
    if mauvais:
        problemes.append("%d fiche(s) de taille(s) incohérente(s)" % mauvais)
    if inconnus:
        problemes.append("%d fiche(s) absente(s) de promos.json" % inconnus)
    return problemes


def charger(chemin):
    try:
        with open(chemin, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError) as e:
        print("Illisible :", chemin, "—", e)
        return None


def main():
    promo = charger(PROMOS)
    index = charger(INDEX)
    if promo is None or index is None:
        return 1
    problemes = valider_promos(promo)
    problemes += valider_index(index, promo)
    if not problemes:
        print("Contrat des données respecté : %d article(s), %d fiche(s) de tailles."
              % (len(promo.get("items") or []), len(index.get("by_link") or {})))
        return 0
    print("DONNÉES HORS CONTRAT")
    for p in problemes:
        print(" -", p)
    return 1


if __name__ == "__main__":
    sys.exit(main())
