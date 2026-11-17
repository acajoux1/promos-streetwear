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
for c in ["/collections/homme-polos", "/collections/femme-polos", "/collections/homme-xs"]:
    try:
        h = get(BASE + c)
        cartes = re.findall(r'<a href="/products/[^"]+" class="f-product-card"', h)
        out.append("=== " + c + " vraies cartes: " + str(len(cartes)))
        for kw in ["Voir plus", "Charger", "load-more", "infinite", "total", "nbHits"]:
            out.append(kw + " : " + str(h.count(kw)))
        if c.endswith("homme-polos"):
            i = h.find('<a href="/products/')
            j = h.find("</a>", i)
            carte = h[i:j + 4]
            carte = re.sub(r"<svg.*?</svg>", "<svg/>", carte, flags=re.S)
            out.append("CARTE: " + carte[:3500].replace("\n", " "))
    except Exception as e:
        out.append("=== " + c + " ECHEC " + str(e))

os.makedirs("data", exist_ok=True)
with open("data/debug6.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
