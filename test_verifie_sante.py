import unittest
from datetime import datetime, timedelta, timezone

from verifie_sante import diagnostic

MAINTENANT = datetime(2026, 11, 21, 12, 0, tzinfo=timezone.utc)


def promo(maj=None, articles=600, statut=None):
    maj = maj or (MAINTENANT - timedelta(minutes=20)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {"maj": maj, "statut": statut or {"A": {"ok": True, "n": articles}},
            "items": [{} for _ in range(articles)]}


class TestDiagnosticSante(unittest.TestCase):
    def test_collecte_saine(self):
        self.assertEqual(diagnostic(promo(), {"boutiques": {"A": {"n": 600, "avant": 600, "alerte": False}}},
                                    MAINTENANT), [])

    def test_releve_fige(self):
        vieux = (MAINTENANT - timedelta(hours=8)).strftime("%Y-%m-%dT%H:%M:%SZ")
        problemes = diagnostic(promo(maj=vieux), {}, MAINTENANT)
        self.assertTrue(any("vieux" in p for p in problemes))

    def test_boutique_muette_et_effondrement(self):
        problemes = diagnostic(
            promo(articles=600, statut={"A": {"ok": False, "n": 0}}),
            {"boutiques": {"A": {"n": 12, "avant": 700, "alerte": True}}},
            MAINTENANT,
        )
        self.assertTrue(any("n’a pas répondu" in p for p in problemes))
        self.assertTrue(any("12 articles" in p for p in problemes))

    def test_catalogue_trop_petit(self):
        problemes = diagnostic(promo(articles=12), {}, MAINTENANT)
        self.assertTrue(any("articles seulement" in p for p in problemes))

    def test_depot_trop_gros(self):
        problemes = diagnostic(promo(), {}, MAINTENANT, taille_mo=350)
        self.assertTrue(any("Mo publiés" in p for p in problemes))
        self.assertEqual(diagnostic(promo(), {}, MAINTENANT, taille_mo=12), [])


if __name__ == "__main__":
    unittest.main()
