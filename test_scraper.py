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

    def test_marque_deduite_du_nom(self):
        self.assertEqual(scraper.marque_de("Air Jordan 1 Low"), "Air Jordan")
        self.assertEqual(scraper.marque_de("New Balance 550"), "New Balance")
        self.assertEqual(scraper.marque_de("Veste inconnue"), "Veste")


if __name__ == "__main__":
    unittest.main(verbosity=2)
