import urllib.request, re, os

H = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9",
}

def get(u):
    req = urllib.request.Request(u, headers=H)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")

out = []
try:
    html = get("https://secondemain.lacoste.com/")
    out.append("taille " + str(len(html)))
    for kw in ["__NEXT_DATA__", "__NUXT__", "application/ld+json", "Polaroid", "href=", '"price"', "srcset", "/produit", "/products", "/p/", "api"]:
        out.append(kw + " : " + str(html.count(kw)))
    i = html.find("Polaroid")
    if i >= 0:
        out.append("CONTEXTE: " + html[max(0, i - 1500): i + 1500].replace("\n", " "))
    else:
        out.append("DEBUT: " + html[:2500].replace("\n", " "))
    liens = re.findall(r'href="([^"]+)"', html)
    out.append("LIENS: " + " | ".join(liens[:40]))
except Exception as e:
    out.append("ECHEC " + str(e))

os.makedirs("data", exist_ok=True)
with open("data/debug4.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
