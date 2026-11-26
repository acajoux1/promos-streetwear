#!/usr/bin/env python3
"""Ménage des pull requests d'agents abandonnées.

Les agents travaillent sur des branches datées (`agents/histoire-AAAAMMJJ`,
`agents/structure-AAAAMMJJ`). Quand une proposition n'est ni fusionnée ni
refusée, elle reste ouverte indéfiniment et le dépôt se remplit de branches
mortes. Une tâche hebdomadaire ferme celles qui n'ont pas bougé depuis trente
jours et supprime leur branche ; rien d'autre n'est touché.
"""
import os
import sys
from datetime import datetime, timedelta, timezone

from incident import requete

PREFIXE = "agents/"
JOURS = 30


def parse_date(valeur):
    try:
        t = datetime.fromisoformat(str(valeur).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    return t if t.tzinfo else t.replace(tzinfo=timezone.utc)


def perimees(prs, jours=JOURS, prefixe=PREFIXE, maintenant=None):
    """Pull requests ouvertes, d'un agent, sans activité depuis `jours`."""
    maintenant = maintenant or datetime.now(timezone.utc)
    limite = maintenant - timedelta(days=jours)
    gardees = []
    for pr in prs or []:
        if not isinstance(pr, dict):
            continue
        if (pr.get("state") or "open").lower() != "open":
            continue
        ref = ((pr.get("head") or {}).get("ref") or "")
        if not ref.startswith(prefixe):
            continue
        quand = parse_date(pr.get("updated_at") or pr.get("created_at"))
        if quand is None or quand < limite:
            gardees.append(pr)
    return gardees


def fermer(depot, jeton, jours=JOURS, prefixe=PREFIXE, requete=requete,
           maintenant=None, journal=print):
    """Ferme et nettoie les PR périmées ; retourne leurs numéros."""
    code, prs = requete("/repos/%s/pulls?state=open&per_page=100" % depot,
                        jeton=jeton)
    if code != 200 or not isinstance(prs, list):
        journal("Liste des pull requests illisible (HTTP %s)." % code)
        return []
    fermees = []
    for pr in perimees(prs, jours, prefixe, maintenant):
        numero = pr.get("number")
        ref = (pr.get("head") or {}).get("ref") or ""
        requete("/repos/%s/pulls/%d" % (depot, numero), "PATCH",
                {"state": "closed"}, jeton=jeton)
        requete("/repos/%s/git/refs/heads/%s" % (depot, ref), "DELETE", jeton=jeton)
        journal("Fermée : #%s (%s)" % (numero, ref))
        fermees.append(numero)
    return fermees


def main():
    depot = os.environ.get("GITHUB_REPOSITORY", "")
    jeton = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""
    if not depot or not jeton:
        print("Dépôt ou jeton absent : rien à faire.")
        return 0
    fermees = fermer(depot, jeton)
    print("%d pull request(s) d'agent fermée(s)." % len(fermees))
    return 0


if __name__ == "__main__":
    sys.exit(main())
