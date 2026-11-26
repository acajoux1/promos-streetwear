#!/usr/bin/env python3
"""Canal d'incident : une issue GitHub par workflow en échec.

Le courriel de GitHub se perd vite, et un échec répété finit par ne plus être
lu. Ici chaque workflow qui échoue ouvre **une seule** issue à son nom, y
ajoute une ligne par passage en échec (dédupliquée par l'URL du run), et la
referme au premier passage vert du même workflow. Aucun service externe, aucun
secret supplémentaire : le jeton fourni par Actions suffit (`issues: write`).

L'issue est un journal, pas un doublon du journal du run : elle porte le nom du
workflow, la branche, l'URL et l'heure, pour retrouver les journaux ensuite.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

API = "https://api.github.com"
TITRE = "Incident · %s"
LABEL = "incident"


def requete(chemin, methode="GET", charge=None, jeton="", base=API, timeout=20):
    """(code HTTP, objet JSON ou None) ; code 0 si le réseau n'a pas répondu."""
    data = json.dumps(charge).encode("utf-8") if charge is not None else None
    entetes = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "promos-incident/1.0",
    }
    if jeton:
        entetes["Authorization"] = "Bearer " + jeton
    if data is not None:
        entetes["Content-Type"] = "application/json"
    req = urllib.request.Request(base + chemin, data=data, method=methode,
                                 headers=entetes)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            corps = r.read().decode("utf-8", "replace")
            return r.getcode(), (json.loads(corps) if corps.strip() else None)
    except urllib.error.HTTPError as e:
        return e.code, None
    except (urllib.error.URLError, TimeoutError, OSError):
        return 0, None


def trouver(depot, workflow, jeton, requete=requete):
    """Numéro de l'issue d'incident ouverte pour ce workflow, sinon None."""
    titre = TITRE % workflow
    recherche = urllib.parse.quote("repo:%s is:issue is:open label:%s" % (depot, LABEL),
                                   safe=":%")
    code, data = requete("/search/issues?q=" + recherche + "&per_page=50", jeton=jeton)
    if code != 200 or not isinstance(data, dict):
        return None
    for issue in data.get("items") or []:
        if (issue.get("title") or "").strip() == titre:
            return issue.get("number")
    return None


def corps(workflow, url, branche="", quand=None):
    quand = quand or datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    lignes = ["Le workflow **%s** a échoué." % workflow, "",
              "- passage : %s" % (url or "URL inconnue"),
              "- branche : %s" % (branche or "?"),
              "- constaté le : %s" % quand, "",
              "L’issue se referme au prochain passage vert du même workflow. "
              "Les journaux restent sur la page du run."]
    return "\n".join(lignes)


def assurer_label(depot, jeton, requete=requete):
    requete("/repos/%s/labels" % depot, "POST",
            {"name": LABEL, "color": "d93f0b",
             "description": "Passage automatique en échec"}, jeton=jeton)


def fermer(depot, workflow, jeton, requete=requete):
    numero = trouver(depot, workflow, jeton, requete)
    if numero is None:
        return "aucun incident ouvert"
    requete("/repos/%s/issues/%d/comments" % (depot, numero), "POST",
            {"body": "Reprise : le workflow **%s** est repassé au vert." % workflow},
            jeton=jeton)
    code, _ = requete("/repos/%s/issues/%d" % (depot, numero), "PATCH",
                      {"state": "closed"}, jeton=jeton)
    return "fermé" if code == 200 else "fermeture refusée (HTTP %s)" % code


def signaler(workflow, url, conclusion, branche="", jeton="", depot="", requete=requete):
    """Ouvre, commente ou ferme l'issue d'incident ; retourne ce qui a été fait."""
    if not jeton or not depot:
        return "sans jeton ou sans dépôt : rien à signaler"
    if conclusion != "failure":
        return fermer(depot, workflow, jeton, requete)

    numero = trouver(depot, workflow, jeton, requete)
    texte = corps(workflow, url, branche)
    if numero is not None:
        code, comments = requete(
            "/repos/%s/issues/%d/comments?per_page=100" % (depot, numero), jeton=jeton)
        if code == 200 and any(url and url in (c.get("body") or "")
                               for c in comments or []):
            return "déjà signalé"
        code, _ = requete("/repos/%s/issues/%d/comments" % (depot, numero), "POST",
                          {"body": texte}, jeton=jeton)
        return "commenté" if code in (200, 201) else "commentaire refusé (HTTP %s)" % code

    assurer_label(depot, jeton, requete)
    code, _ = requete("/repos/%s/issues" % depot, "POST",
                      {"title": TITRE % workflow, "body": texte, "labels": [LABEL]},
                      jeton=jeton)
    return "ouvert" if code == 201 else "ouverture refusée (HTTP %s)" % code


def main(argv=None):
    ap = argparse.ArgumentParser(description="Signale un passage en échec.")
    ap.add_argument("--workflow", required=True, help="nom du workflow en échec")
    ap.add_argument("--url", default="", help="URL du run")
    ap.add_argument("--conclusion", default="failure", help="conclusion du run")
    ap.add_argument("--branche", default="", help="branche du run")
    args = ap.parse_args(argv)

    depot = os.environ.get("GITHUB_REPOSITORY", "")
    jeton = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""
    fait = signaler(args.workflow, args.url, args.conclusion, args.branche,
                    jeton, depot)
    print("%s : %s" % (args.workflow, fait))
    return 0 if not fait.startswith(("ouverture refusée", "commentaire refusé")) else 1


if __name__ == "__main__":
    sys.exit(main())
