import unittest

import couverture


def promo(n=10, images=True, remise=True):
    return {"items": [{"lien": "https://a.example/p/%d" % i,
                       "image": "https://img/%d.jpg" % i if images else "",
                       "prix": 80.0,
                       "ancien_prix": 100.0 if remise else 80.0} for i in range(n)]}


def index(n=10, avec_tailles=True):
    by_link = {}
    for i in range(n):
        by_link["https://a.example/p/%d" % i] = (
            {"min": 80.0, "max": 80.0, "p": {"42": 80.0}} if avec_tailles else
            {"min": 80.0, "max": 80.0})
    return {"by_link": by_link}


class TestCouverture(unittest.TestCase):
    def test_taux_complets(self):
        mesures = couverture.taux(promo(), index())
        self.assertEqual(mesures["articles"], 10)
        self.assertEqual(mesures["tailles"], 1.0)
        self.assertEqual(mesures["images"], 1.0)
        self.assertEqual(mesures["remise"], 1.0)

    def test_aucune_alerte_sur_des_donnees_completes(self):
        self.assertEqual(couverture.diagnostic(promo(), index()), [])

    def test_prix_par_taille_perdus(self):
        problemes = couverture.diagnostic(promo(), index(avec_tailles=False))
        self.assertTrue(any("prix par taille" in p for p in problemes))

    def test_images_perdues(self):
        problemes = couverture.diagnostic(promo(images=False), index())
        self.assertTrue(any("images" in p for p in problemes))

    def test_prix_barres_perdus(self):
        problemes = couverture.diagnostic(promo(remise=False), index())
        self.assertTrue(any("prix barrés" in p for p in problemes))

    def test_catalogue_vide(self):
        self.assertEqual(couverture.diagnostic({"items": []}, {}), ["aucun article à mesurer"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
