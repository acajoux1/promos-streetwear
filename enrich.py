#!/usr/bin/env python3
"""Le bot qui écrit les descriptions produit.

Il tourne dans la même tâche planifiée que le scraper : à chaque passage, il
choisit quelques articles sans description (ou dont la description a vieilli),
demande un texte court au modèle, vérifie la réponse puis l'écrit dans
`data/descriptions.json`. Le site lit ce fichier à la demande : s'il est absent
ou vide, les fiches s'affichent exactement comme avant.

Aucune clé n'est écrite ici. Sans `AI_API_KEY`, le script ne fait rien et sort
avec le code 0, donc la tâche de collecte n'échoue jamais à cause de lui.

Variables d'environnement :
  AI_API_KEY    clé de l'API (obligatoire pour agir)
  AI_API_BASE   base compatible OpenAI (défaut : Z.ai)
  AI_MODEL      modèle (défaut : glm-4-flash)
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROMOS = ROOT / "data" / "promos.json"
CACHE = ROOT / "data" / "descriptions.json"

DEFAULT_BASE = "https://api.z.ai/api/paas/v4"
DEFAULT_MODEL = "glm-4-flash"
MIN_LEN, MAX_LEN = 60, 320

SYSTEM = (
    "Tu écris les notes de style d'un radar de promos streetwear, en français. "
    "Deux phrases au maximum, 240 caractères, ton posé et précis, jamais publicitaire. "
    "Tu décris la pièce à partir de son nom, de sa marque et de sa catégorie : "
    "silhouette, matière, détail, place dans l'histoire de la marque. "
    "Interdit : inventer une matière, une date, un lieu ou une collaboration absents du nom ; "
    "parler de prix, de stock ou de livraison ; les emojis, les guillemets, le markdown, "
    "les formules comme « découvrez », « plongez », « ne manquez pas ». "
    "Réponds uniquement par le texte, sans préambule."
)


def lire_json(path, defaut):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return defaut


def ecrire_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    tmp.replace(path)


def age_jours(iso):
    try:
        t = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        return 10 ** 6
    if t.tzinfo is None:
        t = t.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - t).days


def choisir(items, cache, limit, refresh_days):
    """Sans description d'abord, puis les plus anciennes, à remise égale."""
    neufs, vieux = [], []
    for x in items:
        lien = (x.get("lien") or "").strip()
        nom = (x.get("nom") or "").strip()
        if not lien.startswith("http") or len(nom) < 8:
            continue
        entree = cache.get(lien)
        texte = entree.get("d") if isinstance(entree, dict) else entree
        if not texte:
            neufs.append(x)
        elif isinstance(entree, dict) and age_jours(entree.get("t")) >= refresh_days:
            vieux.append(x)
    cle = lambda x: (-(x.get("remise") or 0), x.get("nom") or "")
    neufs.sort(key=cle)
    vieux.sort(key=cle)
    return (neufs + vieux)[:limit]


def prompt(x):
    tailles = x.get("tailles") or []
    bouts = [
        "Marque : " + str(x.get("marque") or ""),
        "Modèle : " + str(x.get("nom") or ""),
        "Boutique : " + str(x.get("boutique") or ""),
        "Catégories : " + ", ".join(x.get("cat") or []),
    ]
    if tailles:
        bouts.append("Tailles proposées : " + ", ".join(str(t) for t in tailles[:12]))
    return "\n".join(bouts)


def appeler(base, modele, cle, texte, timeout=40):
    corps = json.dumps({
        "model": modele,
        "temperature": 0.5,
        "max_tokens": 220,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": texte},
        ],
    }).encode("utf-8")
    req = urllib.request.Request(
        base.rstrip("/") + "/chat/completions",
        data=corps,
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + cle},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        j = json.loads(r.read().decode("utf-8"))
    return j["choices"][0]["message"]["content"]


def nettoyer(texte):
    t = (texte or "").strip()
    t = re.sub(r"^```[a-z]*\s*|\s*```$", "", t)
    t = re.sub(r"[*_#>`]", "", t)
    t = re.sub(r"^[«\"'“”\s]+|[»\"'“”\s]+$", "", t)
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def valide(t):
    if not (MIN_LEN <= len(t) <= MAX_LEN):
        return False
    if re.search(r"https?:|www\.|\d+\s*€|€\s*\d+", t):
        return False
    if not re.search(r"[.!?]$", t):
        return False
    return True


def main():
    ap = argparse.ArgumentParser(description="Écrit les descriptions produit.")
    ap.add_argument("--limit", type=int, default=12, help="articles traités par passage")
    ap.add_argument("--refresh-days", type=int, default=45, help="âge avant réécriture")
    ap.add_argument("--dry-run", action="store_true", help="n'appelle pas l'API")
    args = ap.parse_args()

    cle = (os.environ.get("AI_API_KEY") or "").strip()
    base = (os.environ.get("AI_API_BASE") or DEFAULT_BASE).strip()
    modele = (os.environ.get("AI_MODEL") or DEFAULT_MODEL).strip()

    promos = lire_json(PROMOS, {}).get("items") or []
    cache_brut = lire_json(CACHE, {})
    cache = cache_brut.get("items") if isinstance(cache_brut, dict) else {}
    cache = cache if isinstance(cache, dict) else {}

    if not cle:
        print("AI_API_KEY absente : descriptions inchangées.")
        return 0

    cible = choisir(promos, cache, args.limit, args.refresh_days)
    print("%d article(s) à décrire (cache : %d)." % (len(cible), len(cache)))
    if args.dry_run:
        for x in cible:
            print(" -", x.get("marque"), "·", x.get("nom"))
        return 0

    ecrits, echecs = 0, 0
    for x in cible:
        lien = x["lien"]
        try:
            brut = appeler(base, modele, cle, prompt(x))
        except urllib.error.HTTPError as e:
            print("HTTP %s sur %s" % (e.code, lien[:60]))
            echecs += 1
            if e.code in (401, 403, 429):
                break
            continue
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as e:
            print("Erreur réseau (%s) : arrêt du passage." % e)
            echecs += 1
            break
        texte = nettoyer(brut)
        if not valide(texte):
            print("Réponse écartée (%d car.) pour %s" % (len(texte), lien[:60]))
            echecs += 1
            continue
        cache[lien] = {"d": texte, "t": datetime.now(timezone.utc).replace(microsecond=0).isoformat()}
        ecrits += 1
        time.sleep(0.8)

    if ecrits:
        ecrire_json(CACHE, {
            "_maj": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "items": cache,
        })
    print("%d description(s) écrite(s), %d écartée(s)." % (ecrits, echecs))
    return 0


if __name__ == "__main__":
    sys.exit(main())
