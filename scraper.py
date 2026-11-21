import json, os, re, time, datetime, urllib.error, urllib.request

H = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9",
}

def fetch(url, essais=4):
    derniere = None
    for i in range(essais):
        try:
            req = urllib.request.Request(url, headers=H)
            return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
        except urllib.error.HTTPError as e:
            derniere = e
            if e.code not in (429, 500, 502, 503, 504):
                break
            time.sleep(2 + 3 * i)
        except Exception as e:
            derniere = e
            time.sleep(1 + i)
    raise derniere

TAILLE_RE = re.compile(
    r"^(?:(?:eu|fr|uk|us)\s*)?(?:xxs|xs|s|m|l|xl|xxl|2xl|3xl|xxxl|tu|unique|[2-5]\d(?:[.,]5)?(?:\s*(?:1/3|2/3))?)$",
    re.I,
)


def taille_variante(v):
    """Libellé de taille d'une variante, même quand l'option 1 est un coloris.

    Dimension Stores encode la pointure, l'état et le numéro de pièce dans la
    même option ("43 / RECONDITIONNÉ / RD172") : on garde le libellé entier
    pour ne pas perdre l'état, le découpage est fait plus tard.
    """
    for cle in ("option1", "option2", "option3"):
        libelle = str(v.get(cle) or "").strip()
        if not libelle:
            continue
        base = re.split(r"\s*/\s*", libelle)[0].strip()
        if TAILLE_RE.match(base):
            return libelle
    return str(v.get("title") or v.get("option1") or "").strip()


def variantes_shopify(produit):
    """Instantané prix/disponibilité de chaque variante, pris dans products.json.

    C'est la seule source fiable pour les prix par taille : le flux de
    collection les donne déjà, alors que les requêtes produit individuellement
    sont limitées (429) et renvoyaient un prix unique pour toutes les tailles.
    """
    sortie = []
    for v in produit.get("variants") or []:
        taille = taille_variante(v)
        try:
            prix = round(float(v["price"]), 2)
        except (KeyError, TypeError, ValueError):
            continue
        brut = v.get("compare_at_price")
        try:
            ancien = round(float(brut), 2) if brut else None
        except (TypeError, ValueError):
            ancien = None
        if ancien is not None and ancien <= prix:
            ancien = None
        sortie.append({
            "taille": taille,
            "variant_id": str(v.get("id")) if v.get("id") is not None else None,
            "prix": prix,
            "ancien_prix": ancien,
            "disponible": bool(v.get("available")),
        })
    return sortie

def choisir_offre(variantes):
    """Retourne (prix, ancien_prix) pris sur une même variante soldée.

    Le prix barré ne doit jamais venir d'une autre variante : appliquer le
    compare_at le plus élevé (grande taille, coloris rare) au prix le plus bas
    fabrique une remise qui n'existe sur aucune variante. On retient la
    variante réellement soldée la moins chère, et son propre ancien prix.
    """
    meilleure = None
    for v in variantes:
        if not v.get("available"):
            continue
        try:
            prix = round(float(v["price"]), 2)
            brut = v.get("compare_at_price")
            ancien = round(float(brut), 2) if brut else None
        except (KeyError, TypeError, ValueError):
            continue
        if ancien is None or ancien <= prix:
            continue
        if meilleure is None or prix < meilleure[0]:
            meilleure = (prix, ancien)
    return meilleure if meilleure else (None, None)

def shopify(boutique, base, collection, prod_base, maxpages=20):
    items = []
    for page in range(1, maxpages + 1):
        url = base + collection + "/products.json?limit=250&page=" + str(page)
        try:
            res = fetch(url)
            prods = json.loads(res)["products"]
        except Exception:
            break
        if not prods:
            break
        for p in prods:
            dispo = [v for v in p["variants"] if v["available"]]
            if not dispo:
                continue
            prix, ancien = choisir_offre(dispo)
            if prix is None:
                continue
            tags = [t for t in p.get("tags", []) if t.startswith(("cat_", "gender:"))]
            tags.append(p.get("product_type", ""))
            variantes = variantes_shopify(p)
            pt = {}
            for v in dispo:
                k = v.get("option1")
                if not k:
                    continue
                vp = float(v["price"])
                vc = float(v["compare_at_price"]) if v.get("compare_at_price") else 0
                if k not in pt or vp < pt[k][0]:
                    pt[k] = [vp, vc]
            it = {
                "boutique": boutique,
                "marque": p["vendor"],
                "nom": p["title"],
                "prix": prix,
                "ancien_prix": ancien,
                "remise": round((1 - prix / ancien) * 100),
                "tailles": [v["option1"] for v in dispo if v.get("option1")],
                "image": p["images"][0]["src"] if p["images"] else "",
                "lien": prod_base + p["handle"],
                "cat": tags,
            }
            if len(set(a for a, b in pt.values())) > 1:
                it["pt"] = pt
            if variantes:
                it["_variantes"] = variantes
            items.append(it)
        time.sleep(0.5)
    return items

MARQUES = ["Air Jordan", "Nike", "Adidas", "New Balance", "Puma", "Asics", "Calvin Klein",
           "Carhartt", "Vans", "Converse", "Reebok", "Salomon", "Hoka", "The North Face",
           "Timberland", "Levi's", "Fila", "Kappa", "Lacoste", "Champion", "Ellesse",
           "Umbro", "Under Armour", "Dickies", "Crocs", "Birkenstock", "Saucony", "Mizuno"]

def marque_de(nom):
    for m in MARQUES:
        if nom.lower().startswith(m.lower()):
            return m
    return nom.split(" ")[0] if nom else ""

PAT = re.compile(
    r'"name":"((?:[^"\\]|\\.)*)","title":"(?:[^"\\]|\\.)*","description":".{0,8000}?","url":"([^"]+\.html)",'
    r'"price":\{"value":([\d.]+),"value_without_vat":[\d.]+,"value_without_reduction":([\d.]+)',
    re.S,
)

def decode(s):
    try:
        return json.loads('"' + s + '"')
    except Exception:
        return s

def footshop(maxpages=40):
    base = "https://www.footshop.fr/fr/"
    vus, items = set(), []
    for page in range(1, maxpages + 1):
        url = "https://www.footshop.fr/fr/872-promos"
        if page > 1:
            url = url + "?page=" + str(page)
        try:
            html = fetch(url)
        except Exception as e:
            print("Footshop arret page", page, type(e).__name__)
            break
        ms = list(PAT.finditer(html))
        nouveaux = 0
        for i, m in enumerate(ms):
            nom, lien = decode(m.group(1)), m.group(2)
            prix, ancien = float(m.group(3)), float(m.group(4))
            if lien in vus or ancien <= prix:
                continue
            vus.add(lien)
            nouveaux += 1
            fin = ms[i + 1].start() if i + 1 < len(ms) else m.end() + 8000
            seg = html[m.end():fin]
            mb = re.search(r'"manufacturer":\{"id":\d+,"name":"((?:[^"\\]|\\.)*)"', seg)
            marque = decode(mb.group(1)) if mb else marque_de(nom)
            mi = re.search(r'"image":"(https?://[^"]+)"', seg)
            image = mi.group(1) if mi else ""
            mv = re.search(r'"attributes":\{"variants":\[(.*?)\]', seg, re.S)
            tailles = re.findall(r'\{"name":"([^"]+)","url"', mv.group(1)) if mv else []
            items.append({
                "boutique": "Footshop",
                "marque": marque,
                "nom": nom,
                "prix": prix,
                "ancien_prix": ancien,
                "remise": round((1 - prix / ancien) * 100),
                "tailles": tailles,
                "image": image,
                "lien": base + lien,
                "cat": [],
            })
        if nouveaux == 0:
            break
        time.sleep(0.5)
    return items

SOURCES = [
    ("Starcow Paris", lambda: shopify("Starcow Paris", "https://www.starcowparis.com", "/collections/outlet", "https://www.starcowparis.com/products/")),
    ("END.", lambda: shopify("END.", "https://www.endclothing.com", "/en-eu/collections/sale", "https://www.endclothing.com/en-eu/products/")),
    ("Footshop", footshop),
    ("Laced Run", lambda: shopify("Laced Run", "https://lacedrun.com", "/collections/soldes-2026", "https://lacedrun.com/products/")),
    ("Dimension Stores", lambda: shopify("Dimension Stores", "https://dimension-stores.com", "/collections/good-deals", "https://dimension-stores.com/products/")),
]

def charger(chemin, defaut):
    try:
        with open(chemin, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return defaut

def rapport_sante(statut, anciens_items, seuil=0.5):
    """Repère une boutique dont la collecte s'effondre par rapport au relevé précédent."""
    avant = {}
    for item in anciens_items:
        boutique = item.get("boutique")
        if boutique:
            avant[boutique] = avant.get(boutique, 0) + 1
    sante = {}
    for nom, etat in statut.items():
        n = etat.get("n", 0)
        precedent = avant.get(nom, 0)
        alerte = precedent >= 20 and n < precedent * seuil
        sante[nom] = {"n": n, "avant": precedent, "alerte": alerte}
        if alerte:
            print("ALERTE", nom, ":", n, "articles contre", precedent, "au relevé précédent")
    return sante


HIST_MAX_POINTS = 30
HIST_FENETRE_JOURS = 45


def maj_historique(history, items, jour):
    """Ajoute le relevé du jour et borne l'historique de chaque article.

    Un point par jour et par changement de prix suffit à tracer la courbe ; on
    garde au plus HIST_MAX_POINTS points par article pour que le fichier livré
    reste léger, et la date de première observation à part (« d ») pour que les
    badges annoncent l'ancienneté réelle du suivi même après élagage.
    """
    for x in items:
        h = history.setdefault(x["lien"], {"h": []})
        h.setdefault("d", jour)
        serie = h["h"]
        prix = round(x["prix"], 2)
        anc = round(x["ancien_prix"], 2)
        der = serie[-1] if serie else None
        if der is None or der[1] != prix or (len(der) > 2 and der[2] != anc):
            serie.append([jour, prix, anc])
            if len(serie) > HIST_MAX_POINTS:
                del serie[:-HIST_MAX_POINTS]
        h["v"] = jour
        prev = None
        debut = jour
        for e in reversed(serie):
            if e[1] != prix:
                prev = e[1]
                break
            debut = e[0]
        if prev is not None:
            x["prec"] = prev
            x["chg"] = debut
        pmin = min(e[1] for e in serie)
        if pmin < prix - 0.01:
            x["pmin"] = pmin
        ancs = [e[2] for e in serie if len(e) > 2]
        if len(ancs) >= 2:
            bas = min(ancs)
            if anc > bas * 1.05:
                x["inf"] = bas
    return history


def main():
    now = datetime.datetime.now(datetime.timezone.utc)
    maj = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    jour = now.strftime("%Y-%m-%d")

    ancien = charger("data/promos.json", {})
    anciens_items = ancien.get("items", [])
    ancien_statut = ancien.get("statut", {})
    history = charger("data/history.json", {})

    items = []
    statut = {}
    variantes = charger("data/variantes.json", {}).get("by_link", {})
    for nom, fn in SOURCES:
        try:
            r = fn()
        except Exception as e:
            print(nom, ": ECHEC", type(e).__name__, e)
            r = []
        if r:
            print(nom, ":", len(r), "articles")
            items += r
            statut[nom] = {"ok": True, "n": len(r), "depuis": maj}
        else:
            reprise = [x for x in anciens_items if x.get("boutique") == nom]
            print(nom, ": aucun article, reprise de", len(reprise), "anciens")
            items += reprise
            depuis = ancien_statut.get(nom, {}).get("depuis", ancien.get("maj", maj))
            statut[nom] = {"ok": False, "n": len(reprise), "depuis": depuis}

    liens = set()
    for x in items:
        liens.add(x["lien"])
        v = x.pop("_variantes", None)
        if v:
            variantes[x["lien"]] = v
    variantes = {k: v for k, v in variantes.items() if k in liens}

    maj_historique(history, items, jour)

    limite = (now - datetime.timedelta(days=HIST_FENETRE_JOURS)).strftime("%Y-%m-%d")
    history = {k: v for k, v in history.items() if v.get("v", jour) >= limite}

    sante = rapport_sante(statut, anciens_items)

    os.makedirs("data", exist_ok=True)
    with open("data/promos.json", "w", encoding="utf-8") as f:
        json.dump({"maj": maj, "statut": statut, "items": items}, f, ensure_ascii=False, separators=(",", ":"))
    with open("data/history.json", "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, separators=(",", ":"))
    with open("data/sante.json", "w", encoding="utf-8") as f:
        json.dump({"maj": maj, "boutiques": sante}, f, ensure_ascii=False, separators=(",", ":"))
    with open("data/variantes.json", "w", encoding="utf-8") as f:
        json.dump({"maj": maj, "by_link": variantes}, f, ensure_ascii=False, separators=(",", ":"))
    print("TOTAL", len(items))
    return items


if __name__ == "__main__":
    main()
