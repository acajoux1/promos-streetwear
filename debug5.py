import urllib.request, re, os

H = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9",
}
BASE = "https://secondemain.lacoste.com"

def get(u):
    req = urllib.request.Request(u, headers=H)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")

out = []
html = get(BASE + "/")
liens = []
for l in re.findall(r'href="([^"]+)"', html):
    if l.startswith("/_nuxt") or l.startswith("#") or l in liens:
        continue
    liens.append(l)
out.append("LIENS (" + str(len(liens)) + "): " + " | ".join(liens[:120]))

for i, m in enumerate(re.finditer(r'"price"', html)):
    if i >= 2:
        break
    out.append("PRIX ctx: " + html[max(0, m.start() - 500): m.start() + 500].replace("\n", " "))
for kw in ["compare", "discount", "originalPrice", "retailPrice", "totalPages", "pageCount", "nextPage", "hasNextPage"]:
    out.append(kw + " : " + str(html.count(kw)))

cand = [l for l in liens if l.startswith("/") and not l.startswith("/products/") and ("collection" in l or "homme" in l or "femme" in l or "catalog" in l or "shop" in l or "search" in l)]
out.append("CANDIDATS: " + " | ".join(cand[:20]))
for l in cand[:4]:
    try:
        h = get(BASE + l)
        out.append("=== " + l + " taille " + str(len(h)) + " cartes " + str(h.count("f-product-card")) + " page= " + str(h.count("page=")))
        pg = re.findall(r'href="([^"]*[?&]page=[^"]*)"', h)
        out.append("PAGINATION: " + " | ".join(pg[:6]))
        j = h.find("f-product-card__price")
        if j >= 0:
            out.append("CARTE ctx: " + h[max(0, j - 900): j + 700].replace("\n", " "))
    except Exception as e:
        out.append("=== " + l + " ECHEC " + str(e))

os.makedirs("data", exist_ok=True)
with open("data/debug5.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
