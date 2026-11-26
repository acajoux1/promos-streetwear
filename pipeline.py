#!/usr/bin/env python3
"""Enchaîne la collecte, les prix par taille, le contrat et le flux.

Trois scripts appelés en trois étapes du workflow, c'étaient trois fois le même
code de départ et un ordre à tenir à la main. Ici l'ordre est dans le code.

Toutes les étapes tournent, même après un échec non critique : si les prix par
taille cassent, le flux, les fiches et le plan du site sont quand même
régénérés avec l'index de la veille, plutôt que de laisser le site incohérent.
Les étapes critiques (collecte, contrat des données) arrêtent tout : publier
un `promos.json` hors contrat serait pire que ne rien publier.

Codes de sortie : 0 si tout va bien, le code de l'étape critique en échec
sinon, 2 si seules des étapes non critiques ont échoué (passage dégradé : les
données valides sont publiées, puis le workflow rougit).
"""
import subprocess
import sys
import time

ETAPES = (
    ("Collecte des promos", ("scraper.py",), True),
    ("Prix par taille", ("size_prices.py",), False),
    ("Contrat des données", ("schema.py",), True),
    ("Flux RSS, fiches et plan du site", ("feed.py",), False),
)


def executer(etapes=ETAPES, python=None, racine=None):
    """Lance les étapes dans l'ordre ; voir les codes de sortie du module."""
    python = python or sys.executable
    degradees = []
    for etape in etapes:
        nom, args = etape[0], etape[1]
        critique = etape[2] if len(etape) > 2 else True
        depart = time.monotonic()
        code = subprocess.run([python, *args], cwd=racine).returncode
        duree = time.monotonic() - depart
        etat = "ok" if code == 0 else "ÉCHEC (%d)" % code
        print("— %s : %s en %.0f s" % (nom, etat, duree), flush=True)
        if not code:
            continue
        if critique:
            print("Arrêt : les étapes suivantes partiraient sur des données "
                  "incomplètes.", flush=True)
            return code
        degradees.append(nom)
        print("Dégradé : l'étape suivante tourne avec les fichiers précédents.",
              flush=True)
    if degradees:
        print("Passage dégradé (%s) : les données valides sont publiées, le "
              "workflow doit le signaler." % ", ".join(degradees), flush=True)
        return 2
    return 0


def main():
    return executer()


if __name__ == "__main__":
    raise SystemExit(main())
