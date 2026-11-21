"""Génère le flux RSS, les fiches partageables et le plan du site.

Appelé par le workflow horaire juste après size_prices.py : aucun accès réseau,
seulement les fichiers déjà livrés.
"""
import hashlib
import html
import json
import os
import re
import shutil
import unicodedata
from email.utils import format_datetime
from datetime import datetime, timezone
from urllib.parse import quote
from xml.sax.saxutils import escape

PROMOS = "data/promos.json"
INDEX = "data/tailles_index.json"
FEED = "feed.xml"
SITEMAP = "sitemap.xml"
FICHES = "p"
SITE = "https://acajoux1.github.io/promos-streetwear/"
LIMITE = 60
# Les fiches statiques servent au partage et au référencement : inutile d'en
# générer des milliers, les meilleures remises suffisent.
FICHES_MAX = 40


def charger(chemin):
    try:
        with open(chemin, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def date_rfc822(valeur):
    """Accepte « 2026-11-20 » ou un horodatage ISO complet."""
    if not valeur:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(str(valeur)[:19], fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def retenus(items):
    """Les dernières baisses d'abord, puis les plus fortes remises."""
    def cle(x):
        d = date_rfc822(x.get("chg"))
        return (d or datetime(1970, 1, 1, tzinfo=timezone.utc), x.get("remise") or 0)
    return sorted(items, key=cle, reverse=True)[:LIMITE]


def euros(valeur):
    if not isinstance(valeur, (int, float)) or isinstance(valeur, bool):
        return "prix ?"
    return f"{valeur:.2f} €".replace(".", ",")


def description(x):
    bouts = []
    if x.get("ancien_prix"):
        bouts.append(f"Ancien prix {x['ancien_prix']:.2f} € · remise {x.get('remise', 0)} %")
    else:
        bouts.append(f"Remise affichée {x.get('remise', 0)} %")
    if x.get("tailles"):
        bouts.append("Tailles : " + ", ".join(str(t) for t in x["tailles"][:14]))
    if x.get("boutique"):
        bouts.append("Boutique : " + x["boutique"])
    return " — ".join(bouts)


def nom_affiche(x):
    """Évite « Adidas Adidas Samba » quand le titre contient déjà la marque."""
    marque = str(x.get("marque") or "").strip()
    nom = str(x.get("nom") or "").strip()
    if marque and nom.lower().startswith(marque.lower()):
        return nom
    return f"{marque} {nom}".strip()


def titre(x):
    return nom_affiche(x) + f" — {euros(x.get('prix'))}"


def ecrire_feed(promo):
    items = promo.get("items") or []
    maj = date_rfc822(promo.get("maj")) or datetime.now(timezone.utc)
    lignes = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "<channel>",
        "<title>PROMOS. — nouveautés streetwear</title>",
        f"<link>{SITE}</link>",
        "<description>Les dernières baisses de prix relevées heure par heure dans cinq boutiques streetwear.</description>",
        "<language>fr</language>",
        f'<atom:link href="{SITE}feed.xml" rel="self" type="application/rss+xml"/>',
        f"<lastBuildDate>{format_datetime(maj)}</lastBuildDate>",
    ]
    for x in retenus(items):
        lien = x.get("lien")
        if not lien:
            continue
        d = date_rfc822(x.get("chg")) or maj
        lignes += [
            "<item>",
            f"<title>{escape(titre(x))}</title>",
            f"<link>{escape(lien)}</link>",
            f'<guid isPermaLink="false">{escape(lien)}</guid>',
            f"<pubDate>{format_datetime(d)}</pubDate>",
            f"<description>{escape(description(x))}</description>",
            "</item>",
        ]
    lignes += ["</channel>", "</rss>", ""]
    with open(FEED, "w", encoding="utf-8") as f:
        f.write("\n".join(lignes))


def slug(x):
    """Nom de fichier lisible et stable pour une fiche."""
    nom = str(x.get("nom") or "")
    marque = str(x.get("marque") or "")
    base = nom if (not marque or nom.lower().startswith(marque.lower())) else f"{marque} {nom}"
    base = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode()
    base = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")[:60] or "article"
    court = hashlib.sha1((x.get("lien") or "").encode("utf-8")).hexdigest()[:6]
    return f"{base}-{court}"


def image_absolue(url):
    if not url:
        return SITE + "og.png"
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return SITE.rstrip("/") + url
    return url


def fiche_html(x, entree, maj):
    nom = html.escape(nom_affiche(x))
    boutique = html.escape(str(x.get("boutique") or ""))
    lien = html.escape(str(x.get("lien") or ""))
    image = html.escape(image_absolue(x.get("image") or ""))
    prix = euros(x.get("prix"))
    ancien = euros(x.get("ancien_prix")) if x.get("ancien_prix") else ""
    remise = x.get("remise") or 0
    fichier = slug(x) + ".html"
    canonique = f"{SITE}p/{fichier}"
    profond = f"{SITE}#p={quote(str(x.get('lien') or ''), safe='')}"
    resume = f"{nom} à {prix} chez {boutique} (−{remise} %). Prix vérifié taille par taille, relevé du {maj}."
    ancien_html = f' <span class="old">{ancien}</span>' if ancien else ""

    blocs = []
    if entree:
        for taille in entree.get("t") or []:
            p = (entree.get("p") or {}).get(taille)
            blocs.append(
                '<span class="chip">' + html.escape(str(taille))
                + (f" · {euros(p)}" if p else "") + "</span>"
            )
    tailles = ('<div class="lbl">Tailles &amp; prix</div><div class="tabs">'
               + "".join(blocs) + "</div>") if blocs else ""

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#EFE9DD">
<meta name="description" content="{html.escape(resume)}">
<link rel="canonical" href="{canonique}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="PROMOS.">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="{nom} — {prix}">
<meta property="og:description" content="{html.escape(resume)}">
<meta property="og:url" content="{canonique}">
<meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="192x192" href="../icone-192.png">
<link rel="stylesheet" href="../style.css">
<title>{nom} — {prix} · PROMOS.</title>
</head>
<body>
<main class="page fiche">
<p class="kicker">Fiche · {boutique}</p>
<h1>{nom}</h1>
<p class="fiche-prix"><span class="big">{prix}</span>{ancien_html} <span class="pct2">−{remise} %</span></p>
<img class="sh-img" src="{image}" alt="" referrerpolicy="no-referrer">
{tailles}
<p><a class="go" href="{lien}" target="_blank" rel="noopener">Voir l’offre chez {boutique}</a></p>
<p><a href="{profond}">Ouvrir la fiche complète : historique du prix et autres boutiques</a></p>
<div class="hist-warn">Prix relevé le {maj} lors du suivi horaire de cinq boutiques. La remise affichée est recoupée avec les prix observés : voir la <a href="../methode.html">méthode</a>.</div>
<a class="back" href="../">← Toutes les promos</a>
</main>
</body>
</html>
"""


def ecrire_fiches(promo, index):
    """Les meilleures remises en pages statiques, partageables et indexables."""
    items = [x for x in (promo.get("items") or []) if x.get("lien") and x.get("image")]
    items.sort(key=lambda x: ((x.get("remise") or 0), -(x.get("prix") or 0)), reverse=True)
    shutil.rmtree(FICHES, ignore_errors=True)
    os.makedirs(FICHES, exist_ok=True)
    maj = str(promo.get("maj") or "")[:10]
    by_link = index.get("by_link") if isinstance(index, dict) else {}
    pages = []
    for x in items[:FICHES_MAX]:
        fichier = slug(x) + ".html"
        with open(os.path.join(FICHES, fichier), "w", encoding="utf-8") as f:
            f.write(fiche_html(x, (by_link or {}).get(x["lien"]), maj))
        pages.append(f"p/{fichier}")
    return pages


def ecrire_sitemap(promo, pages):
    maj = str(promo.get("maj") or "")[:10]
    entrees = [("", "1.0"), ("methode.html", "0.6"), ("etat.html", "0.4")]
    entrees += [(chemin, "0.5") for chemin in pages]
    lignes = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for chemin, prio in entrees:
        bloc = [f"<loc>{SITE}{chemin}</loc>"]
        if maj:
            bloc.append(f"<lastmod>{maj}</lastmod>")
        bloc.append(f"<priority>{prio}</priority>")
        lignes.append("<url>" + "".join(bloc) + "</url>")
    lignes += ["</urlset>", ""]
    with open(SITEMAP, "w", encoding="utf-8") as f:
        f.write("\n".join(lignes))


def main():
    promo = charger(PROMOS)
    if not promo:
        print("promos.json illisible : flux et plan du site inchangés")
        return 1
    index = charger(INDEX)
    ecrire_feed(promo)
    pages = ecrire_fiches(promo, index)
    ecrire_sitemap(promo, pages)
    n = min(LIMITE, len(promo.get("items") or []))
    print(f"{FEED} : {n} entrées · {len(pages)} fiches · {SITEMAP} : {3 + len(pages)} pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
