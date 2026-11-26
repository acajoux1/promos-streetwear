import json
import tempfile
import unittest
from pathlib import Path

import canary
import scraper

SHOPIFY = {
    "nom": "X",
    "type": "shopify",
    "base": "https://x.example",
    "collection": "/collections/soldes",
    "produits": "https://x.example/products/",
}

FOOTSHOP = {"nom": "F", "type": "footshop",
            "url": "https://f.example/promos"}


def produits(n=12):
    return json.dumps({"products": [
        {"title": "Sneaker %d" % i, "variants": [{"price": "80.00"}],
         "images": [{"src": "https://img/%d.jpg" % i}]} for i in range(n)
    ]})


class TestCanari(unittest.TestCase):
    def test_shopify_en_forme(self):
        ok, detail, n = canary.controler(SHOPIFY, fetch=lambda url: produits())
        self.assertTrue(ok, detail)
        self.assertEqual(n, 12)

    def test_shopify_vide(self):
        ok, detail, n = canary.controler(SHOPIFY, fetch=lambda url: '{"products": []}')
        self.assertFalse(ok)
        self.assertEqual(n, 0)

    def test_shopify_sans_variantes(self):
        corps = json.dumps({"products": [{"title": "A", "images": [{"src": "x"}]}] * 12})
        ok, _, n = canary.controler(SHOPIFY, fetch=lambda url: corps)
        self.assertFalse(ok)
        self.assertEqual(n, 0)

    def test_panne_reseau_nommee(self):
        def casse(url):
            raise TimeoutError("délai dépassé")
        ok, detail, n = canary.controler(SHOPIFY, fetch=casse)
        self.assertFalse(ok)
        self.assertIn("TimeoutError", detail)

    def test_footshop_avec_balisage(self):
        bloc = ('"name":"Sneaker","title":"Sneaker","description":"x","url":"/p/a.html",'
                '"price":{"value":80.0,"value_without_vat":66.0,"value_without_reduction":100.0}')
        ok, _, n = canary.controler(FOOTSHOP, fetch=lambda url: bloc * 12)
        self.assertTrue(ok)
        self.assertEqual(n, 12)


class TestConfigBoutiques(unittest.TestCase):
    def test_le_fichier_du_depot_est_complet(self):
        boutiques = scraper.charger_boutiques()
        self.assertGreaterEqual(len(boutiques), 5)
        for b in boutiques:
            if b["type"] == "shopify":
                for cle in ("base", "collection", "produits"):
                    self.assertTrue(b.get(cle), "%s sans %s" % (b["nom"], cle))

    def test_entrees_incompletes_ecartees(self):
        contenu = {"boutiques": [
            {"nom": "Bon", "type": "shopify", "base": "https://b", "collection": "/c",
             "produits": "https://b/products/"},
            {"nom": "Sans type"},
            {"type": "footshop"},
        ]}
        with tempfile.TemporaryDirectory() as d:
            chemin = Path(d) / "boutiques.json"
            chemin.write_text(json.dumps(contenu), encoding="utf-8")
            self.assertEqual([b["nom"] for b in scraper.charger_boutiques(str(chemin))],
                             ["Bon"])

    def test_fichier_absent(self):
        self.assertEqual(scraper.charger_boutiques("/inexistant/boutiques.json"), [])

    def test_sources_construites(self):
        liste = scraper.sources([{"nom": "X", "type": "shopify", "base": "https://x",
                                  "collection": "/collections/s",
                                  "produits": "https://x/products/"}])
        self.assertEqual([nom for nom, _ in liste], ["X"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
