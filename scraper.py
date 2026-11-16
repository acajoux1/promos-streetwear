import json, os, datetime, urllib.request

BASE = "https://www.starcowparis.com"
URL = BASE + "/collections/outlet/products.json?limit=250&page={}"

def get(page):
    req = urllib.request.Request(
        URL.format(page), headers={"User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["products"]

items = []
for page in range(1, 30):
    prods = get(page)
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
        items.append({
            "boutique": "Starcow Paris",
            "marque": p["vendor"],
            "nom": p["title"],
            "prix": prix,
            "ancien_prix": ancien,
            "remise": round((1 - prix / ancien) * 100),
            "tailles": [v["option1"] for v in dispo],
            "image": p["images"][0]["src"] if p["images"] else "",
            "lien": BASE + "/products/" + p["handle"],
        })

os.makedirs("data", exist_ok=True)
with open("data/promos.json", "w", encoding="utf-8") as f:
    json.dump(
        {"maj": datetime.datetime.utcnow().isoformat() + "Z", "items": items},
        f, ensure_ascii=False,
    )
print(len(items), "articles")
