#!/usr/bin/env python3
"""Canari des boutiques : la forme de chaque source, une fois par jour.

`verifie_sante.py` constate après coup qu'une boutique a rendu moins d'articles ;
il ne dit pas *pourquoi*. Ici chaque source est interrogée pour elle-même, avec
le même point d'entrée que le scraper, et la réponse doit encore ressembler à ce
qu'on sait lire : un `products.json` avec variantes et images, une page Footshop
avec le balisage attendu. Une boutique qui change de plateforme ou de collection
est donc signalée par son nom, le matin, avant la première collecte ratée.

Aucune donnée n'est écrite : le canari ne fait que lire.
"""
import json
import sys

import scraper

# Une page de products.json plafonne à 250 : le plancher porte sur la première.
MIN_PAGE = 10


def controler(boutique, fetch=None):
    """(ok, détail, nombre) pour une boutique de `boutiques.json`."""
    fetch = fetch or scraper.fetch
    try:
        if boutique.get("type") == "footshop":
            url = boutique.get("url") or "https://www.footshop.fr/fr/872-promos"
            html = fetch(url)
            n = len(scraper.PAT.findall(html))
            return n >= MIN_PAGE, "page de promos Footshop", n
        url = boutique["base"] + boutique["collection"] + "/products.json?limit=250"
        produits = json.loads(fetch(url)).get("products") or []
        valides = [p for p in produits
                   if p.get("variants") and p.get("title") and p.get("images")]
        return len(valides) >= MIN_PAGE, "products.json Shopify", len(valides)
    except Exception as e:  # réseau, JSON, clé absente : tout est un échec nommé
        return False, "%s : %s" % (type(e).__name__, str(e)[:160]), 0


def main():
    boutiques = scraper.charger_boutiques()
    if not boutiques:
        print("boutiques.json absent, illisible ou vide : rien à contrôler.")
        return 1
    echecs = 0
    for boutique in boutiques:
        ok, detail, nombre = controler(boutique)
        print("%-18s %-4s %5d  %s" % (boutique.get("nom", "?"),
                                      "ok" if ok else "KO", nombre, detail))
        if not ok:
            echecs += 1
    if echecs:
        print("%d boutique(s) ne répondent plus sous la forme attendue." % echecs)
        return 1
    print("Toutes les sources répondent sous la forme attendue.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
