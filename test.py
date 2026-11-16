import urllib.request, urllib.error

TESTS = [
    ("Footpatrol vetements", "https://www.footpatrol.fr/collections/promos-vetements/products.json?limit=5"),
    ("Footpatrol chaussures", "https://www.footpatrol.fr/collections/chaussures-hommes-promos/products.json?limit=5"),
    ("Fenom", "https://www.fenom.com/fr/123-outlet"),
    ("Footshop", "https://www.footshop.fr/fr/872-promos"),
    ("END.", "https://www.endclothing.com/en-eu/collections/sale"),
]

for nom, url in TESTS:
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode("utf-8", "ignore")
            print("OK ", nom, r.status, len(body), "octets | prix:", "price" in body.lower())
    except urllib.error.HTTPError as e:
        print("BLOQUE", nom, e.code)
    except Exception as e:
        print("ERREUR", nom, type(e).__name__)
