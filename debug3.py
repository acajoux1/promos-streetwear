import urllib.request, re, os

H = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9",
}

def get(u):
    req = urllib.request.Request(u, headers=H)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")

out = []
html = get("https://www.footshop.fr/fr/872-promos")
out.append("taille liste " + str(len(html)))
for kw in ['"image', '"images', '"photo', '"picture', '"thumb', ".jpg", ".webp", '"sizes', '"size"']:
    out.append(kw + " : " + str(html.count(kw)))

m = re.search(r'"url":"([^"]+\.html)","price":\{', html)
if m:
    out.append("APRES PRIX: " + html[m.end():m.end() + 1800])
    lien = "https://www.footshop.fr/fr/" + m.group(1)
    out.append("PAGE PRODUIT " + lien)
    try:
        ph = get(lien)
        out.append("taille page " + str(len(ph)))
        for i, mm in enumerate(re.finditer(r'https?:(?:\\/|/){2}[^"\s]+?\.(?:jpg|webp)', ph)):
            if i >= 6:
                break
            out.append("IMG " + mm.group(0))
        for i, mm in enumerate(re.finditer(r'"size', ph)):
            if i >= 4:
                break
            out.append("SIZE ctx: " + ph[max(0, mm.start() - 200):mm.start() + 400].replace("\n", " "))
    except Exception as e:
        out.append("ECHEC page produit " + str(e))
else:
    out.append("aucun produit trouve")

os.makedirs("data", exist_ok=True)
with open("data/debug3.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
