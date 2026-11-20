import unittest

import scraper


class TestChoixOffre(unittest.TestCase):
    def test_prix_barre_vient_de_la_meme_variante(self):
        variantes = [
            {"price": "99.00", "compare_at_price": "150.00", "available": True},
            {"price": "79.00", "compare_at_price": None, "available": True},
            {"price": "59.00", "compare_at_price": "199.00", "available": False},
        ]
        prix, ancien = scraper.choisir_offre(variantes)
        self.assertEqual(prix, 99.0)
        self.assertEqual(ancien, 150.0)

    def test_aucune_variante_soldee(self):
        variantes = [
            {"price": "120.00", "compare_at_price": "120.00", "available": True},
            {"price": "110.00", "compare_at_price": None, "available": True},
        ]
        self.assertEqual(scraper.choisir_offre(variantes), (None, None))

    def test_variante_la_moins_chere_parmi_les_soldees(self):
        variantes = [
            {"price": "80.00", "compare_at_price": "100.00", "available": True},
            {"price": "70.00", "compare_at_price": "140.00", "available": True},
        ]
        self.assertEqual(scraper.choisir_offre(variantes), (70.0, 140.0))

    def test_variantes_shopify_prix_par_taille(self):
        produit = {
            "variants": [
                {"id": 11, "option1": "43 / RECONDITIONNÉ / RD172", "price": "799.00", "compare_at_price": "1189.00", "available": True},
                {"id": 12, "option1": "42 / RECONDITIONNÉ / 61065", "price": "999.00", "compare_at_price": "1989.00", "available": True},
                {"id": 13, "option1": "42 / RECONDITIONNÉ / 78686", "price": "499.00", "compare_at_price": "400.00", "available": False},
            ]
        }
        variantes = scraper.variantes_shopify(produit)
        self.assertEqual([v["taille"] for v in variantes],
                         ["43 / RECONDITIONNÉ / RD172", "42 / RECONDITIONNÉ / 61065", "42 / RECONDITIONNÉ / 78686"])
        self.assertEqual([v["prix"] for v in variantes], [799.0, 999.0, 499.0])
        self.assertIsNone(variantes[2]["ancien_prix"])
        self.assertFalse(variantes[2]["disponible"])

    def test_taille_variante_ignore_le_coloris(self):
        self.assertEqual(scraper.taille_variante({"option1": "Noir", "option2": "42.5"}), "42.5")
        self.assertEqual(scraper.taille_variante({"option1": "M", "option2": "Noir"}), "M")

    def test_marque_deduite_du_nom(self):
        self.assertEqual(scraper.marque_de("Air Jordan 1 Low"), "Air Jordan")
        self.assertEqual(scraper.marque_de("New Balance 550"), "New Balance")
        self.assertEqual(scraper.marque_de("Veste inconnue"), "Veste")


if __name__ == "__main__":
    unittest.main(verbosity=2)
