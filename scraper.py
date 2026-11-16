import json, os, re, time, datetime, urllib.request

H = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9",
}

def fetch(url):
    req = urllib.request.Request(url, headers=H)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")

def shopify(boutique, base, collection, prod_base, maxpages=20):
    items = []
    for page in range(1, maxpages + 1):
        url = base + collection + "/products.json?limit=250&page=" + str(page)
        prods = json.loads(fetch(url))["products"]
        if not prods:
            break
        for p in prods:
            dispo = [v for v in p["variants"] if v["available"]]
            if not dispo:
                continue
            prix = min(float(v["price"]) for v in dispo)
            anciens = [float(v["compare_at_price"]) for v in dispo if v.get("compare_at_price")]
            ancien = max(anciens) if anciens else None
            if not ancien or ancien <= prix:
                continue
            tags = [t for t in p.get("tags", []) if t.startswith(("cat_", "gender:"))]
            tags.append(p.get("product_type", ""))
            items.append({
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
            })
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
        nouveaux = 0
        for m in PAT.finditer(html):
            nom, lien = m.group(1), m.group(2)
            prix, ancien = float(m.group(3)), float(m.group(4))
            if lien in vus or ancien <= prix:
                continue
            vus.add(lien)
            nouveaux += 1
            try:
                nom = json.loads('"' + nom + '"')
            except Exception:
                pass
            items.append({
                "boutique": "Footshop",
                "marque": marque_de(nom),
                "nom": nom,
                "prix": prix,
                "ancien_prix": ancien,
                "remise": round((1 - prix / ancien) * 100),
                "tailles": [],
                "image": "",
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
]

def charger(chemin, defaut):
    try:
        with open(chemin, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return defaut

now = datetime.datetime.now(datetime.timezone.utc)
maj = now.strftime("%Y-%m-%dT%H:%M:%SZ")
jour = now.strftime("%Y-%m-%d")

ancien = charger("data/promos.json", {})
anciens_items = ancien.get("items", [])
ancien_statut = ancien.get("statut", {})
histo = charger("data/history.json", {})

items = []
statut = {}
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

for x in items:
    h = histo.setdefault(x["lien"], {"h": []})
    serie = h["h"]
    prix = round(x["prix"], 2)
    if not serie or serie[-1][1] != prix:
        serie.append([jour, prix])
        del serie[:-10]
    h["v"] = jour
    if len(serie) >= 2:
        x["prec"] = serie[-2][1]
        x["chg"] = serie[-1][0]

limite = (now - datetime.timedelta(days=45)).strftime("%Y-%m-%d")
histo = {k: v for k, v in histo.items() if v.get("v", jour) >= limite}

os.makedirs("data", exist_ok=True)
with open("data/promos.json", "w", encoding="utf-8") as f:
    json.dump({"maj": maj, "statut": statut, "items": items}, f, ensure_ascii=False, separators=(",", ":"))
with open("data/history.json", "w", encoding="utf-8") as f:
    json.dump(histo, f, ensure_ascii=False, separators=(",", ":"))
print("TOTAL", len(items))
