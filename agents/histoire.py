#!/usr/bin/env python3
"""Agent 2 — histoires de marques, vérifiées.

Chaque jour, il repère les marques présentes au catalogue qui n'ont pas encore
d'histoire, demande au modèle une fiche courte et ses sources, puis **vérifie**
chaque source : page accessible, marque citée, et chacune des dates de la frise
retrouvée dans le texte des pages. Une source peut proposer plusieurs URL
candidates (page Wikipédia renommée) : la première qui répond est gardée.
Ce qui ne passe pas est écarté.

Le résultat va dans `data/histoires.json`, jamais dans `app.js` : le site fusionne
ce fichier au chargement. L'agent ouvre une pull request, ne fusionne pas et
n'écrit pas sur `main`. Les marques déjà décrites à la main gardent leur texte.
"""
import re
import sys
import time
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import commun as c

MAX_PAR_PASSAGE = 2
NOTES_PAR_PASSAGE = 12
MIN_ARTICLES = 6
RETENTE_JOURS = 14
MAX_CANDIDATS = 3  # URL candidates essayées par source, dans l'ordre donné
ANNEES_MIN, ANNEES_MAX = 1800, time.localtime().tm_year

# Sources acceptées d'office : encyclopédies, presse mode et culture.
# Comparaison sur le domaine exact ou un sous-domaine : « fauxwikipedia.org »
# et « wikipedia.org.exemple.test » ne passent pas.
DOMAINES = (
    "wikipedia.org", "britannica.com", "vogue.com", "businessoffashion.com",
    "highsnobiety.com", "hypebeast.com", "wwd.com", "gq.com", "esquire.com",
    "nytimes.com", "theguardian.com", "bbc.co.uk", "bbc.com", "reuters.com",
    "forbes.com", "fashionnetwork.com", "complex.com", "sneakerfreaker.com",
    "theface.com", "dazeddigital.com", "i-d.co", "nssmag.com", "ft.com",
)

# Sites officiels : domaine racine exact, et lui seul. Une marque absente de
# cette table n'accepte que les domaines de `DOMAINES` ; son site officiel est
# alors écarté, ce qui est le repli sûr. Pour l'ouvrir, ajouter sa ligne ici.
# Entrées contrôlées le 23/11/2026 : chaque hôte répond et sert bien la marque.
# Si un domaine meurt ou change, la source est simplement refusée (« injoignable »)
# et la marque repasse après RETENTE_JOURS : aucune fiche n'est écrite à tort.
OFFICIELS = {
    "adidas": "adidas.com", "adidas originals": "adidas.com", "adidas performance": "adidas.com",
    "nike": "nike.com", "air jordan": "nike.com", "jordan": "nike.com",
    "new balance": "newbalance.com", "puma": "puma.com", "reebok": "reebok.com",
    "asics": "asics.com", "salomon": "salomon.com", "vans": "vans.com",
    "converse": "converse.com", "hoka": "hoka.com", "hoka®": "hoka.com",
    "merrell": "merrell.com", "columbia": "columbia.com", "crocs": "crocs.com",
    "ugg": "ugg.com", "birkenstock": "birkenstock.com", "dr. martens": "drmartens.com",
    "clarks": "clarks.com", "clarks originals": "clarks.com", "timberland": "timberland.com",
    "keen": "keenfootwear.com", "diadora": "diadora.com", "saucony": "saucony.com",
    "karhu": "karhu.com", "grenson": "grenson.com", "roa": "roa-hiking.com",
    "arcteryx": "arcteryx.com", "patagonia": "patagonia.com",
    "the north face": "thenorthface.com", "carhartt": "carhartt.com",
    "carhartt wip": "carhartt-wip.com", "dickies": "dickies.com",
    "champion": "champion.com", "umbro": "umbro.com", "levi's": "levi.com",
    "diesel": "diesel.com", "calvin klein": "calvinklein.com",
    "polo ralph lauren": "ralphlauren.com", "under armour": "underarmour.com",
    "stussy": "stussy.com", "supreme": "supreme.com", "palace": "palaceskateboards.com",
    "a bathing ape": "bape.com", "wtaps": "wtaps.com", "gramicci": "gramicci.com",
    "nanamica": "nanamica.com", "snow peak": "snowpeak.com", "thisisneverthat": "thisisneverthat.com",
    "patta": "patta.nl", "kith": "kith.com", "gallery dept.": "gallerydept.com",
    "rhude": "rh-ude.com", "amiri": "amiri.com", "represent": "representclo.com",
    "denim tears": "denimtears.com", "corteiz": "corteiz.com",
    "chrome hearts": "chromehearts.com", "goyard": "goyard.com",
    "stone island": "stoneisland.com", "c.p. company": "cpcompany.com",
    "cp company": "cpcompany.com", "moncler": "moncler.com",
    "napapijri": "napapijri.com", "barbour": "barbour.com", "pyrenex": "pyrenex.com",
    "gucci": "gucci.com", "prada": "prada.com", "dior": "dior.com",
    "burberry": "burberry.com", "versace": "versace.com", "loewe": "loewe.com",
    "givenchy": "givenchy.com", "celine": "celine.com", "hermes": "hermes.com",
    "cartier": "cartier.com", "lanvin": "lanvin.com", "balenciaga": "balenciaga.com",
    "jacquemus": "jacquemus.com", "acne studios": "acnestudios.com",
    "off-white": "off---white.com", "maison margiela": "maisonmargiela.com",
    "rick owens": "rickowens.eu", "sacai": "sacai.jp", "ami paris": "amiparis.com",
    "coperni": "coperni.com", "palm angels": "palmangels.com",
    "comme des garçons shirt": "comme-des-garcons.com",
    "comme des garçons wallet": "comme-des-garcons.com",
    "skims": "skims.com", "ganni": "ganni.com", "rapha": "rapha.cc",
}

SYSTEME = (
    "Tu documentes l'histoire de marques de mode pour un site français. "
    "Tu n'écris que des faits établis : date de création, fondateur, ville, pièce "
    "ou invention qui a fait la marque. Si tu n'es pas sûr d'une date, tu ne la "
    "mets pas dans la frise. "
    "Tu fournis 2 à 4 sources, chacune avec une URL https réellement consultable "
    "(Wikipédia, presse, site officiel de la marque, domaine racine exact) qui "
    "mentionne la marque ET les années de la frise. Quand le titre d'une page peut "
    "avoir changé (article Wikipédia renommé), donne 2 ou 3 URL candidates pour "
    "cette même source, de la plus sûre à la moins sûre : la première qui répond "
    "sera utilisée. "
    "Aucune citation attribuée à quelqu'un : « q » est une phrase de ton cru. "
    "Réponds uniquement par un JSON : "
    '{"cle":"nom de marque en minuscules","w":"pourquoi la marque existe, 2 phrases",'
    '"who":"fondateur, année, ville, 2 phrases","what":"ce qu elle fait, 2 phrases",'
    '"t":[[1985,"repere court"],[1990,"repere"],[2000,"repere"]],'
    '"q":"une phrase de synthèse","m":"deux ou trois mots",'
    '"src":["https://...",["https://...","https://..."]]}'
)


def sans_accent(s):
    s = unicodedata.normalize("NFD", s or "")
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn").lower()


# Clés de marque normalisées, comme celles du catalogue (« garçons » -> « garcons »).
OFFICIELS_NORM = {sans_accent(k).strip(): v for k, v in OFFICIELS.items()}


def marques_connues():
    connues = c.cles_histoires()
    hist = c.lire_json("data/histoires.json", {}) or {}
    if isinstance(hist, dict):
        connues |= set((hist.get("items") or {}).keys())
    return connues


def candidats(hist):
    promos = c.lire_json("data/promos.json", {}) or {}
    compte = {}
    for x in promos.get("items") or []:
        k = (x.get("marque") or "").strip().lower()
        if c.marque_valide(k):
            compte[k] = compte.get(k, 0) + 1
    connues = marques_connues()
    essais = (hist.get("_tentatives") or {}) if isinstance(hist, dict) else {}
    today = time.time()
    liste = []
    for k, n in compte.items():
        if n < MIN_ARTICLES or k in connues:
            continue
        dernier = essais.get(k)
        if dernier:
            try:
                quand = time.mktime(time.strptime(dernier[:10], "%Y-%m-%d"))
            except (ValueError, TypeError):
                quand = 0
            if (today - quand) / 86400 < RETENTE_JOURS:
                continue
        liste.append((n, k))
    liste.sort(key=lambda p: (-p[0], p[1]))
    return liste[:MAX_PAR_PASSAGE]


def hote_de(url):
    """Hôte nu d'une URL https, sans « www. » ni port, ou None."""
    m = re.match(r"^https://([^/?#]+)", url or "", re.I)
    if not m:
        return None
    hote = m.group(1).rsplit("@", 1)[-1].split(":")[0].strip(".").lower()
    if hote.startswith("www."):
        hote = hote[4:]
    return hote or None


def source_autorisee(marque, hote):
    """Liste de confiance, ou domaine officiel exact de la marque (et sous-domaines).

    Le nom de la marque ne suffit jamais : « kardo-magasin.test » est refusé.
    """
    if not hote:
        return False
    if any(hote == d or hote.endswith("." + d) for d in DOMAINES):
        return True
    officiel = OFFICIELS_NORM.get(sans_accent(marque).strip())
    return bool(officiel) and (hote == officiel or hote.endswith("." + officiel))


def sources_ok(marque, annees, urls):
    """Vérifie que chaque source existe et porte la marque et les dates.

    Une entrée de `src` est une URL, ou une liste d'URL candidates pour la même
    source (plusieurs titres Wikipédia possibles). La première candidate qui
    répond, cite la marque et tient le domaine passe : une page renommée (404)
    ne fait donc plus perdre la marque, qui n'est retentée qu'après RETENTE_JOURS.
    """
    if not isinstance(urls, list) or not (2 <= len(urls) <= 4):
        return False, "2 à 4 sources attendues"
    mot = sans_accent(marque).split()[0]
    textes, gardees = [], []
    for entree in urls:
        # Une entrée de `src` est une URL seule, ou une liste de candidates.
        cands = (entree if isinstance(entree, list) else [entree])[:MAX_CANDIDATS]
        if not cands:
            return False, "source sans URL : %r" % (entree,)
        for u in cands:
            if not isinstance(u, str) or not u.startswith("https://"):
                return False, "URL non https : %r" % u
            hote = hote_de(u)
            if not source_autorisee(marque, hote):
                return False, "source hors liste (domaine non reconnu) : %s" % hote
        echecs = []
        for u in cands:
            code, txt = c.telecharger(u)
            if code != 200 or len(txt) < 500:
                echecs.append("source injoignable (%s) : %s" % (code, u))
                continue
            texte = sans_accent(txt)
            # Avec plusieurs candidates, la marque sert à choisir la bonne page.
            if len(cands) > 1 and mot not in texte:
                echecs.append("la marque n'est pas citée : %s" % u)
                continue
            textes.append(texte)
            gardees.append(u)
            break
        else:
            return False, " ; ".join(echecs)
    corpus = "\n".join(textes)
    if mot not in corpus:
        return False, "la marque n'est pas citée dans les sources"
    for a in annees:
        if str(a) not in corpus:
            return False, "l'année %s n'est pas dans les sources" % a
    return True, gardees


def valide(obj, marque):
    pbs = []
    if not isinstance(obj, dict):
        return ["réponse qui n'est pas un objet"]
    if (obj.get("cle") or "").strip().lower() != marque:
        pbs.append("clé inattendue : %r" % obj.get("cle"))
    bornes = {"w": (70, 300), "who": (60, 300), "what": (60, 300), "q": (25, 200), "m": (3, 40)}
    for champ, (lo, hi) in bornes.items():
        v = obj.get(champ)
        if not isinstance(v, str) or not (lo <= len(v.strip()) <= hi):
            pbs.append("%s hors bornes (%s car.)" % (champ, len(v.strip()) if isinstance(v, str) else "?"))
    t = obj.get("t")
    if not isinstance(t, list) or not (3 <= len(t) <= 4):
        pbs.append("frise : 3 ou 4 repères attendus")
    else:
        for p in t:
            if not (isinstance(p, list) and len(p) == 2):
                pbs.append("repère mal formé")
                break
            an, lib = p
            if not isinstance(an, int) or not (ANNEES_MIN <= an <= ANNEES_MAX):
                pbs.append("année invalide : %r" % (an,))
                break
            if not isinstance(lib, str) or not (3 <= len(lib.strip()) <= 45):
                pbs.append("libellé de frise invalide")
                break
        annees = sorted({p[0] for p in t if isinstance(p, list) and p and isinstance(p[0], int)})
        if len(annees) != len(t):
            pbs.append("années en double dans la frise")
    return pbs


def demander(marque, n, pbs=None):
    """Un tour au modèle ; les problèmes du tour précédent lui sont rappelés."""
    question = ("Marque : %s\nNombre d'articles au catalogue : %d\nAnnée courante : %d\n"
                "Écris la fiche et ses sources." % (marque, n, ANNEES_MAX))
    if pbs:
        question += ("\nLa réponse précédente a été refusée : %s. "
                     "Corrige-la et renvoie le JSON complet." % " ; ".join(pbs))
    return c.extraire_json(c.appeler(
        SYSTEME, question, temperature=0.2, max_tokens=1200, json_mode=True))


def fiche(marque, n):
    """Une fiche valide, ou la raison du refus.

    Un premier refus de forme (frise de 2 ou 5 repères, champ hors bornes) est
    redemandé une fois en disant au modèle ce qui clochait : le rejeter du
    premier coup perdait la marque pour quatorze jours sur une virgule.
    Retourne (objet, problèmes, transitoire) ; `transitoire` signale une
    surcharge du fournisseur, qui ne dit rien de la marque elle-même.
    """
    pbs = None
    for tour in (1, 2):
        try:
            obj = demander(marque, n, pbs)
        except (RuntimeError, ValueError) as e:
            c.log("  réponse inutilisable :", e)
            return None, None, getattr(e, "code", None) == 429
        pbs = valide(obj, marque)
        if not pbs:
            return obj, None, False
        if tour == 1:
            c.log("  écartée : %s — fiche corrigée redemandée." % " ; ".join(pbs))
    c.log("  écartée : " + " ; ".join(pbs))
    return None, pbs, False


def main():
    hist = c.lire_json("data/histoires.json", {}) or {}
    if not isinstance(hist, dict):
        hist = {}
    items = hist.get("items") or {}
    essais = hist.get("_tentatives") or {}
    cible = candidats(hist)
    c.log("%d marque(s) à documenter." % len(cible))
    if not cible:
        return 0
    if not c.a_une_cle():
        c.log("Aucune clé d'API (ni AI_API_KEY ni AI_API_KEY_BACKUP) : rien de nouveau, aucune pull request.")
        return 0

    # Volet 1 : les notes de style des articles (même agent, même branche).
    code, sortie = c.lancer([sys.executable, "enrich.py", "--limit", str(NOTES_PAR_PASSAGE)], timeout=900)
    if sortie.strip():
        c.log(sortie.strip())

    # Volet 2 : les histoires de marques, vérifiées par leurs sources.
    ajouts = {}
    for n, marque in cible:
        c.log("— %s (%d articles)" % (marque, n))
        essai = {"marque": marque, "articles": n}
        obj, pbs, transitoire = fiche(marque, n)
        if obj is None:
            if not transitoire:
                essais[marque] = time.strftime("%Y-%m-%d")
            if pbs:
                essai["refus"] = pbs
            continue
        annees = [p[0] for p in obj["t"]]
        ok, detail = sources_ok(marque, annees, obj.get("src"))
        if not ok:
            c.log("  sources refusées : " + detail)
            essais[marque] = time.strftime("%Y-%m-%d")
            continue
        items[marque] = {
            "w": obj["w"].strip(), "who": obj["who"].strip(), "what": obj["what"].strip(),
            "t": obj["t"], "q": obj["q"].strip(), "m": obj["m"].strip(), "src": detail,
        }
        ajouts[marque] = items[marque]
        essais[marque] = time.strftime("%Y-%m-%d")
        c.log("  retenue (%d sources vérifiées)." % len(detail))

    if ajouts:
        c.ecrire_json("data/histoires.json", {
            "_maj": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "items": items,
            "_tentatives": essais,
        })

    lignes = ["Deux volets dans cette branche : les notes de style du jour "
              "(`data/descriptions.json`) et les histoires de marques vérifiées.", ""]
    if ajouts:
        lignes += ["## Histoires", "",
                   "Sources vérifiées : page accessible, marque citée, dates retrouvées.", ""]
        for k, h in ajouts.items():
            lignes += ["### %s" % k, "", h["w"], "",
                       "**%s** — %s" % (h["who"], h["what"]), "",
                       " · ".join("%s %s" % (a, lib) for a, lib in h["t"]), "",
                       "Sources : " + " ".join(h["src"]), ""]
    else:
        lignes += ["## Histoires", "", "Aucune fiche n'a passé la vérification ce passage.", ""]
    lignes += ["Les marques déjà documentées à la main gardent leur texte. "
               "Aucune fusion automatique.", ""]
    if c.creer_pr(c.titre_date("Agent histoire"), "\n".join(lignes),
                  "agents/histoire-" + time.strftime("%Y%m%d")) is None and not ajouts:
        c.log("Aucune nouveauté ce passage : pas de pull request.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
