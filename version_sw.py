#!/usr/bin/env python3
"""Numéro de version du cache du service worker, calculé et non recopié.

`V` dans `sw.js` nomme le cache de la coquille : tant qu'il ne change pas, un
navigateur continue de servir l'`app.js` et le `style.css` qu'il a déjà. Il
était bumpé à la main, donc oublié au premier changement d'interface. Ici la
version dérive du contenu des fichiers listés dans `SHELL` : elle change
exactement quand l'un d'eux change, et reste stable sinon — le relevé horaire
ne crée donc aucun commit inutile.

Usage : `python3 version_sw.py` (écrit `sw.js` si besoin) ou
`python3 version_sw.py --verifier` (code 1 si la version ne suit plus `SHELL`).
"""
import hashlib
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent
SW = "sw.js"
SHELL_RE = re.compile(r"var SHELL=(\[.*?\]);", re.S)
V_RE = re.compile(r'var V="[^"]*";')


def shell(racine=RACINE):
    """Fichiers précachés, lus dans `sw.js` : une seule source de vérité."""
    texte = (Path(racine) / SW).read_text(encoding="utf-8")
    trouve = SHELL_RE.search(texte)
    if not trouve:
        raise ValueError("liste SHELL introuvable dans " + SW)
    return [nom for nom in json.loads(trouve.group(1)) if nom != "./"]


def empreinte(racine=RACINE):
    """Version attendue : huit caractères tirés du contenu de la coquille."""
    racine = Path(racine)
    h = hashlib.sha1()
    for nom in shell(racine):
        chemin = racine / nom
        if not chemin.is_file():
            # Un fichier manquant est déjà signalé par l'audit de structure ;
            # il ne doit pas empêcher de versionner tout le reste.
            continue
        h.update(nom.encode("utf-8"))
        h.update(chemin.read_bytes())
    return "promos-" + h.hexdigest()[:8]


def version(racine=RACINE):
    """Version actuellement écrite dans `sw.js`, ou une chaîne vide."""
    trouve = V_RE.search((Path(racine) / SW).read_text(encoding="utf-8"))
    if not trouve:
        return ""
    return trouve.group(0)[len('var V="'):-2]


def ecrire(racine=RACINE):
    """Met `V` à jour ; retourne (ancienne, nouvelle, changée ?)."""
    racine = Path(racine)
    chemin = racine / SW
    ancienne = version(racine)
    nouvelle = empreinte(racine)
    if ancienne == nouvelle:
        return ancienne, nouvelle, False
    texte = chemin.read_text(encoding="utf-8")
    if not V_RE.search(texte):
        raise ValueError('ligne `var V="…";` introuvable dans ' + SW)
    chemin.write_text(V_RE.sub('var V="%s";' % nouvelle, texte, count=1), encoding="utf-8")
    return ancienne, nouvelle, True


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if "--verifier" in argv:
        ancienne, attendue = version(), empreinte()
        if ancienne != attendue:
            print("Version du cache périmée : %s au lieu de %s" % (ancienne, attendue))
            return 1
        print("Version du cache à jour :", ancienne)
        return 0
    ancienne, nouvelle, changee = ecrire()
    if changee:
        print("Version du cache : %s → %s" % (ancienne, nouvelle))
    else:
        print("Version du cache inchangée :", nouvelle)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
