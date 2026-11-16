import urllib.request, re, os

SITES = [
    ("END", "https://www.endclothing.com/en-eu/collections/sale"),
    ("FOOTSHOP", "https://www.footshop.fr/fr/872-promos"),
]
H = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9",
}
out = []
for nom, url in SITES:
    try:
        req = urllib.request.Request(url, headers=H)
        html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    except Exception as e:
        out.append("=== " + nom + " ERREUR " + str(e))
        continue
    out.append("=== " + nom + " taille " + str(len(html)))
    for marq in ["__NEXT_DATA__", "application/ld+json", "window.__", "dataLayer", '"products"', "data-product"]:
        out.append(marq + " : " + str(html.count(marq)))
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if m:
        out.append("NEXT_DATA debut: " + m.group(1)[:2500])
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    if m:
        out.append("LD+JSON: " + m.group(1)[:1500])
    for i, m in enumerate(re.finditer(r'"price"', html)):
        if i >= 3:
            break
        s = max(0, m.start() - 300)
        out.append("PRIX ctx: " + html[s:m.start() + 300].replace("\n", " "))

os.makedirs("data", exist_ok=True)
with open("data/debug.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
