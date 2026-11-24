#!/usr/bin/env python3
"""Agent 1 — structure et expérience utilisateur.

Il audite le site (HTML, CSS, service worker, liens, contenu), puis demande au
modèle au plus deux retouches sur des fichiers de présentation. Tout passe par
des garde-fous : fichiers autorisés, budget de lignes, chaînes protégées
intactes, identifiants conservés, syntaxe et tests. Une retouche hors seuil est
jetée ; l'audit reste dans le rapport. Le résultat part en pull request :
l'agent ne fusionne jamais et ne pousse pas sur `main`.

Il ne touche pas à `app.js` : une retouche de logique demande une relecture
humaine, l'agent le signale dans son rapport au lieu de l'écrire.
"""
import difflib
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import commun as c

# Le seuil de tolérance : au-delà, la proposition est jetée sans discussion.
SEUIL = {
    "modifications": 2,
    "fichiers": 3,
    "lignes": 120,
    "supprimees": 20,
    "croissance_pct": 15,
}
AUTORISES = ["index.html", "methode.html", "etat.html", "style.css", "NOTES.md"]
JAMAIS = ("sw.js", "app.js", "enrich.py", "agents/", ".github/", "data/",
          "test_", "scraper.py", "size_prices.py", "feed.py")
PROTEGE = [
    '<link rel="stylesheet" href="style.css">',
    'id="q"', 'id="g"', 'id="resH"', 'id="drawer"', 'id="bar"',
    'href="methode.html"', 'href="etat.html"', 'href="feed.xml"',
]

SYSTEME = (
    "Tu es l'agent de structure d'un site statique de promos streetwear. "
    "Tu reçois un audit automatique et le contenu de fichiers de présentation. "
    "Tu proposes AU PLUS DEUX retouches concrètes, petites et vérifiables, qui "
    "améliorent la structure, l'accessibilité ou la lisibilité. "
    "Tu ne touches jamais à la logique JavaScript, aux données, aux workflows, "
    "ni aux liens boutique. Tu ne supprimes aucun identifiant, aucun lien, aucune "
    "section : tu ajustes ou tu ajoutes. "
    "Chaque retouche est un remplacement de texte exact : « avant » doit apparaître "
    "une seule fois dans le fichier, tel quel, avec ses espaces et ses retours à la ligne. "
    "Si l'audit ne montre rien de sûr, renvoie une liste vide : ne devine pas. "
    "Réponds uniquement par un JSON : "
    '{"modifications":[{"fichier":"style.css","avant":"...","apres":"...","pourquoi":"..."}],'
    '"rapport":"une phrase sur ce que tu as vu"}'
)


def ids(html):
    return re.findall(r'id="([^"]+)"', html)


def auditer_html(page):
    pbs = []
    try:
        html = c.lire_texte(page)
    except OSError:
        return pbs
    vus, dup = set(), []
    for i in ids(html):
        if i in vus:
            dup.append(i)
        vus.add(i)
    if dup:
        pbs.append(("haute", page, "identifiants dupliqués : " + ", ".join(sorted(set(dup)))))
    sans_alt = len(re.findall(r"<img\b(?![^>]*\balt=)[^>]*>", html))
    if sans_alt:
        pbs.append(("moyenne", page, "%d <img> sans attribut alt" % sans_alt))
    for m in re.finditer(r"<a\b[^>]*target=\"_blank\"[^>]*>", html, re.I):
        if "rel=" not in m.group(0):
            pbs.append(("haute", page, "lien target=_blank sans rel=noopener"))
            break
    for m in re.finditer(r'href="([^"#?:]+\.html)"', html):
        if not (c.RACINE / m.group(1)).exists():
            pbs.append(("haute", page, "lien interne cassé : " + m.group(1)))
    niveaux = [int(x) for x in re.findall(r"<h([1-6])\b", html)]
    for a, b in zip(niveaux, niveaux[1:]):
        if b - a > 1:
            pbs.append(("basse", page, "titre qui saute un niveau (h%d → h%d)" % (a, b)))
            break
    boutons = re.findall(r"<button\b([^>]*)>(.*?)</button>", html, re.S)
    muets = [txt for attrs, txt in boutons
             if "aria-label" not in attrs
             and not re.search(r"[0-9A-Za-zÀ-ÿ]", re.sub(r"<[^>]+>", "", txt))]
    if muets:
        pbs.append(("moyenne", page, "%d bouton(s) sans texte visible" % len(muets)))
    return pbs


def auditer_sw():
    pbs = []
    try:
        sw = c.lire_texte("sw.js")
    except OSError:
        return [("haute", "sw.js", "fichier absent")]
    m = re.search(r"var SHELL=\[(.*?)\];", sw, re.S)
    if not m:
        return [("haute", "sw.js", "liste SHELL introuvable")]
    for f in re.findall(r'"([^"]+)"', m.group(1)):
        if f in ("", "./"):
            continue
        if not (c.RACINE / f).exists():
            pbs.append(("haute", "sw.js", "précache un fichier absent : " + f))
    return pbs


def auditer_donnees():
    pbs = []
    for f in sorted((c.RACINE / "data").glob("*.json")):
        try:
            import json
            with open(f, encoding="utf-8") as h:
                json.load(h)
        except (OSError, ValueError):
            pbs.append(("haute", "data/" + f.name, "JSON illisible"))
    promos = c.lire_json("data/promos.json", {}) or {}
    items = promos.get("items") or []
    hist = c.lire_json("data/histoires.json", {}) or {}
    extra = (hist.get("items") or {}) if isinstance(hist, dict) else {}
    connues = c.cles_histoires() | set(extra.keys())
    marques, sans = {}, {}
    for x in items:
        k = (x.get("marque") or "").strip().lower()
        if not c.marque_valide(k):
            continue
        marques[k] = marques.get(k, 0) + 1
        if k not in connues:
            sans[k] = sans.get(k, 0) + 1
    if sans:
        top = sorted(sans.items(), key=lambda kv: -kv[1])[:8]
        pbs.append(("moyenne", "app.js", "%d marque(s) sans histoire ; les plus fournies : %s"
                    % (len(sans), ", ".join("%s (%d)" % (k, n) for k, n in top))))
    desc = c.lire_json("data/descriptions.json", {}) or {}
    notes = (desc.get("items") or {}) if isinstance(desc, dict) else {}
    if items:
        manquantes = sum(1 for x in items if (x.get("lien") or "") not in notes)
        pbs.append(("basse", "descriptions", "%d/%d article(s) sans note du radar"
                    % (manquantes, len(items))))
    return pbs


def auditer():
    pbs = []
    for page in ("index.html", "methode.html", "etat.html"):
        pbs += auditer_html(page)
    pbs += auditer_sw()
    pbs += auditer_donnees()
    return pbs


def resume(pbs):
    return "\n".join("%-7s %-14s %s" % (g, f, m) for g, f, m in pbs) or "aucun problème détecté"


def contexte():
    """Les fichiers de présentation, bornés pour tenir dans un seul appel."""
    morceaux, reste = [], 60000
    for f in ("index.html", "methode.html", "etat.html", "style.css"):
        try:
            txt = c.lire_texte(f)
        except OSError:
            continue
        if len(txt) > reste:
            txt = txt[:reste] + "\n/* … tronqué … */"
        reste -= len(txt)
        morceaux.append("### FICHIER %s\n%s" % (f, txt))
        if reste <= 2000:
            break
    return "\n\n".join(morceaux)


def lignes_changees(avant, apres):
    """Lignes ajoutées ou retirées, sans compter les en-têtes du diff."""
    n = 0
    for l in difflib.unified_diff(avant.splitlines(), apres.splitlines(), lineterm="", n=0):
        if l[:1] in "+-" and not l.startswith(("+++", "---")):
            n += 1
    return n


def appliquer(mods):
    """Applique au contenu en mémoire ; None si une règle tombe."""
    if not isinstance(mods, list) or not mods:
        return None
    if len(mods) > SEUIL["modifications"]:
        c.log("Trop de modifications proposées (%d)." % len(mods))
        return None
    originaux = {}
    for m in mods:
        f = (m or {}).get("fichier") or ""
        if f not in AUTORISES:
            c.log("Fichier refusé : %r" % f)
            return None
        avant = m.get("avant") or ""
        apres = m.get("apres") or ""
        if len(avant) < 4 or avant == apres:
            c.log("Retouche vide ou trop courte sur %s." % f)
            return None
        if f not in originaux:
            try:
                originaux[f] = c.lire_texte(f)
            except OSError:
                return None
        if originaux[f].count(avant) != 1:
            c.log("« avant » absent ou ambigu dans %s (%d occurrence)." % (f, originaux[f].count(avant)))
            return None
        originaux[f] = originaux[f].replace(avant, apres, 1)
    if len(originaux) > SEUIL["fichiers"]:
        return None
    total = 0
    for f, txt in originaux.items():
        avant_txt = c.lire_texte(f)
        if len(txt) > len(avant_txt) * (1 + SEUIL["croissance_pct"] / 100.0):
            c.log("%s grossit de plus de %d %%." % (f, SEUIL["croissance_pct"]))
            return None
        if f.endswith(".html") and set(ids(avant_txt)) - set(ids(txt)):
            c.log("%s perd un identifiant." % f)
            return None
        for p in PROTEGE:
            if avant_txt.count(p) > txt.count(p):
                c.log("%s perd « %s »." % (f, p))
                return None
        total += lignes_changees(avant_txt, txt)
    if total > SEUIL["lignes"]:
        c.log("Diff trop large : %d lignes (seuil %d)." % (total, SEUIL["lignes"]))
        return None
    return originaux


def equilibre(txt, balises):
    for b in balises:
        ouvre = len(re.findall(r"<%s[\s>]" % b, txt))
        ferme = len(re.findall(r"</%s>" % b, txt))
        if ouvre != ferme:
            return "%s : %d ouvertes / %d fermées" % (b, ouvre, ferme)
    return None


def verifier():
    """Les contrôles qui décident si la proposition mérite une pull request."""
    echecs = []
    for f in AUTORISES:
        try:
            c.lire_texte(f)
        except OSError:
            echecs.append("fichier perdu : " + f)
    for page in ("index.html", "methode.html", "etat.html"):
        try:
            txt = c.lire_texte(page)
        except OSError:
            continue
        err = equilibre(txt, ("div", "section", "main", "header", "footer", "nav", "button", "a", "ul", "li", "p", "span", "article"))
        if err:
            echecs.append("%s déséquilibré (%s)" % (page, err))
    try:
        css = c.lire_texte("style.css")
        if css.count("{") != css.count("}"):
            echecs.append("style.css : accolades déséquilibrées")
    except OSError:
        echecs.append("style.css absent")
    for cmd in (["node", "--check", "app.js"], ["node", "--check", "sw.js"]):
        code, sortie = c.lancer(cmd)
        if code:
            echecs.append(" ".join(cmd) + " : " + sortie.strip()[:200])
    code, sortie = c.lancer(["python3", "-m", "unittest", "discover", "-p", "test*.py"], timeout=600)
    if code:
        echecs.append("tests : " + sortie.strip().splitlines()[-1][:200] if sortie.strip() else "tests en échec")
    return echecs


def corps_pr(pbs, mods, rapport, echecs):
    lignes = ["Audit automatique du %s." % time.strftime("%d/%m/%Y %H:%M"), "",
              "## Ce que l'agent a vu", "", "```", resume(pbs), "```", ""]
    if mods:
        lignes += ["## Retouches proposées", ""]
        for m in mods:
            lignes.append("- `%s` — %s" % (m.get("fichier"), (m.get("pourquoi") or "").strip()))
        lignes += ["", "## Rapport", "", (rapport or "—").strip(), ""]
    if echecs:
        lignes += ["## Contrôles en échec", ""] + ["- " + e for e in echecs] + [""]
    lignes += ["## Garde-fous", "",
               "- fichiers autorisés : " + ", ".join(AUTORISES) + " ;",
               "- budget : %d modifications, %d fichiers, %d lignes, +%d %% par fichier ;"
               % (SEUIL["modifications"], SEUIL["fichiers"], SEUIL["lignes"], SEUIL["croissance_pct"]),
               "- identifiants, liens et chaînes protégées conservés ;",
               "- syntaxe JS, équilibre HTML/CSS et suite de tests vérifiés.",
               "", "Aucune fusion automatique : cette branche attend une relecture.", ""]
    return "\n".join(lignes)


def laisser_audit():
    """L'audit ne part pas seul : sans pull request, il est retiré."""
    p = c.RACINE / "data" / "audit.json"
    code, _ = c.lancer(["git", "ls-files", "--error-unmatch", "data/audit.json"])
    if code == 0:
        c.git("checkout", "--", "data/audit.json", verifier=False)
    elif p.exists():
        try:
            p.unlink()
        except OSError:
            pass


def main():
    pbs = auditer()
    rapport_txt = resume(pbs)
    c.log("Audit :\n" + rapport_txt)
    c.ecrire_json("data/audit.json", {
        "_maj": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "problemes": [{"gravite": g, "fichier": f, "message": m} for g, f, m in pbs],
    })
    # L'audit seul ne justifie pas une branche : on ne propose que du concret.
    if not c.cle_api():
        c.log("AI_API_KEY absente : audit écrit, aucune retouche proposée.")
        laisser_audit()
        return 0
    try:
        reponse = c.appeler(SYSTEME, "AUDIT\n" + rapport_txt + "\n\n" + contexte(),
                            temperature=0.2, max_tokens=2000, json_mode=True)
        proposition = c.extraire_json(reponse)
    except (RuntimeError, ValueError) as e:
        c.log("Proposition ignorée :", e)
        laisser_audit()
        return 0
    mods = proposition.get("modifications") or []
    if not mods:
        c.log("Rien de sûr à corriger : pas de pull request.")
        laisser_audit()
        return 0
    fichiers = appliquer(mods)
    if not fichiers:
        c.log("Proposition rejetée par les garde-fous.")
        laisser_audit()
        return 0
    originaux = {f: c.lire_texte(f) for f in fichiers}
    for f, txt in fichiers.items():
        c.ecrire_texte(f, txt)
    echecs = verifier()
    if echecs:
        for f, txt in originaux.items():
            c.ecrire_texte(f, txt)
        c.log("Contrôles en échec, tout est annulé :\n- " + "\n- ".join(echecs))
        laisser_audit()
        return 0
    url = c.creer_pr(c.titre_date("Agent structure"), corps_pr(pbs, mods, proposition.get("rapport"), []),
                     "agents/structure-" + time.strftime("%Y%m%d"))
    if url:
        c.log("Proposition envoyée en relecture.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
