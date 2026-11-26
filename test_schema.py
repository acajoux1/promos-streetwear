import unittest

import schema


def promo(articles=None, maj="2026-11-26T10:00:00Z"):
    if articles is None:
        articles = [{"lien": "https://a.example/p/1", "nom": "Sneaker",
                     "boutique": "A", "prix": 90.0}]
    return {"maj": maj, "items": articles}


def index(maj="2026-11-26T10:00:00Z", by_link=None, total=None):
    by_link = by_link if by_link is not None else {
        "https://a.example/p/1": {"min": 90.0, "max": 90.0, "p": {"42": 90.0}},
    }
    return {"maj": maj, "total": total if total is not None else len(by_link),
            "by_link": by_link}


class TestPromos(unittest.TestCase):
    def test_promos_valide(self):
        self.assertEqual(schema.valider_promos(promo()), [])

    def test_prix_nul_ou_absent(self):
        articles = [
            {"lien": "https://a.example/p/1", "nom": "A", "boutique": "A", "prix": 0},
            {"lien": "https://a.example/p/2", "nom": "B", "boutique": "A", "prix": 10},
            {"lien": "https://a.example/p/3", "nom": "C", "boutique": "A"},
        ]
        problemes = schema.valider_promos(promo(articles))
        self.assertTrue(any("incomplet" in p for p in problemes))

    def test_doublon_de_lien(self):
        article = {"lien": "https://a.example/p/1", "nom": "A", "boutique": "A", "prix": 10}
        problemes = schema.valider_promos(promo([article, dict(article)]))
        self.assertTrue(any("doublon" in p for p in problemes))

    def test_aucun_article(self):
        self.assertTrue(schema.valider_promos(promo([])))


class TestIndex(unittest.TestCase):
    def test_index_valide(self):
        self.assertEqual(schema.valider_index(index(), promo()), [])

    def test_index_d_une_autre_collecte_ignore(self):
        self.assertEqual(schema.valider_index(index(maj="2026-11-25T10:00:00Z"), promo()), [])

    def test_bornes_inversees_et_total_incoherent(self):
        by_link = {"https://a.example/p/1": {"min": 120.0, "max": 90.0, "p": {"42": 90.0}}}
        problemes = schema.valider_index(index(by_link=by_link, total=5), promo())
        self.assertTrue(any("incohérente" in p for p in problemes))
        self.assertTrue(any("total" in p for p in problemes))

    def test_fiche_absente_des_promos(self):
        by_link = {"https://a.example/autre": {"min": 1.0, "max": 1.0, "p": {"42": 1.0}}}
        problemes = schema.valider_index(index(by_link=by_link), promo())
        self.assertTrue(any("absente" in p for p in problemes))


if __name__ == "__main__":
    unittest.main(verbosity=2)
