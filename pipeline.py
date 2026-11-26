#!/usr/bin/env python3
"""Enchaîne la collecte, les prix par taille et le flux dans un seul passage.

Trois scripts appelés en trois étapes du workflow, c'étaient trois fois le même
code de départ et un ordre à tenir à la main. Ici l'ordre est dans le code :
chaque étape lit les fichiers de la précédente, et la première qui échoue
arrête tout — publier un `promos.json` frais avec des prix de la veille serait
pire que ne rien publier.

Usage : `python3 pipeline.py`, et la même chose en local avant de pousser.
"""
import subprocess
import sys
import time

ETAPES = (
    ("Collecte des promos", ("scraper.py",)),
    ("Prix par taille", ("size_prices.py",)),
    ("Flux RSS, fiches et plan du site", ("feed.py",)),
)


def executer(etapes=ETAPES, python=None, racine=None):
    """Lance les étapes dans l'ordre ; retourne le code de la première en échec."""
    python = python or sys.executable
    for nom, args in etapes:
        depart = time.monotonic()
        code = subprocess.run([python, *args], cwd=racine).returncode
        duree = time.monotonic() - depart
        etat = "ok" if code == 0 else "ÉCHEC (%d)" % code
        print("— %s : %s en %.0f s" % (nom, etat, duree), flush=True)
        if code:
            print("Arrêt : les étapes suivantes ne partiraient pas sur des données complètes.",
                  flush=True)
            return code
    return 0


def main():
    return executer()


if __name__ == "__main__":
    raise SystemExit(main())
