import urllib.request, re, os, json

H = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9",
}

def get(url):
    req = urllib.request.Request(url, headers=H)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")

out = []

for url in [
    "https://www.endclothing.com/en-eu/collections/sale/products.json?limit=3",
    "https://www.endclothing.com/collections/sale/products.json?limit=3",
    "https://www.endclothing.com/fr/collections/sale/products.json?limit=3",
]:
    try:
        body = get(url)
        out.append("=== END OK " + url + " " + str(len(body)))
        out.append(body[:1500])
    except Exception as e:
        out.append("=== END ECHEC " + url + " " + str(e))

try:
    p1 = get("https://www.footshop.fr/fr/872-promos")
    key = '"value_without_reduction"'
    out.append("=== FOOTSHOP page1 produits: " + str(p1.count(key)))
    for i, m in enumerate(re.finditer(re.escape(key), p1)):
        if i >= 2:
            break
        out.append("--- PRODUIT " + str(i))
        out.append(p1[max(0, m.start() - 1800): m.start() + 400])
    for u in [
        "https://www.footshop.fr/fr/872-promos?page=2",
        "https://www.footshop.fr/fr/872-promos?p=2",
    ]:
        try:
            p2 = get(u)
            out.append("=== PAGE2 " + u + " produits: " + str(p2.count(key)) + " identique: " + str(p2 == p1))
        except Exception as e:
            out.append("=== PAGE2 ECHEC " + u + " " + str(e))
except Exception as e:
    out.append("=== FOOTSHOP ECHEC " + str(e))

os.makedirs("data", exist_ok=True)
with open("data/debug2.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
