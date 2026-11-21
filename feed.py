"""Génère le flux RSS des nouveautés et le plan du site.

Appelé par le workflow horaire juste après size_prices.py : aucun accès réseau,
seulement les fichiers déjà livrés.
"""
import json
import os
from email.utils import format_datetime
from datetime import datetime, timezone
from xml.sax.saxutils import escape

PROMOS = "data/promos.json"
FEED = "feed.xml"
SITEMAP = "sitemap.xml"
SITE = "https://acajoux1.github.io/promos-streetwear/"
LIMITE = 60


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


def titre(x):
    prix = x.get("prix")
    p = f"{prix:.2f} €".replace(".", ",") if isinstance(prix, (int, float)) else "prix ?"
    return f"{x.get('marque', '')} {x.get('nom', '')}".strip() + f" — {p}"


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


def ecrire_sitemap(promo):
    maj = promo.get("maj", "")[:10]
    pages = [("", "1.0"), ("methode.html", "0.6"), ("etat.html", "0.4")]
    lignes = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for chemin, prio in pages:
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
    ecrire_feed(promo)
    ecrire_sitemap(promo)
    n = min(LIMITE, len(promo.get("items") or []))
    print(f"{FEED} : {n} entrées · {SITEMAP} : 3 pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
