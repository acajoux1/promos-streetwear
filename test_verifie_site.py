import unittest
from datetime import datetime, timedelta, timezone
from unittest import mock

import verifie_site

MAINTENANT = datetime(2026, 11, 26, 12, 0, tzinfo=timezone.utc)
ACCUEIL = "<title>PROMOS. — radar des promos streetwear</title>"


def promo(maj=None, articles=600):
    maj = maj or (MAINTENANT - timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {"maj": maj, "items": [{} for _ in range(articles)]}


class TestDiagnosticSite(unittest.TestCase):
    def test_site_sain(self):
        self.assertEqual(verifie_site.diagnostic(promo(), ACCUEIL, MAINTENANT), [])

    def test_accueil_sans_le_mot_promos(self):
        problemes = verifie_site.diagnostic(promo(), "<h1>404</h1>", MAINTENANT)
        self.assertTrue(any("accueil" in p for p in problemes))

    def test_accueil_non_verifie_quand_il_n_a_pas_repondu(self):
        self.assertEqual(verifie_site.diagnostic(promo(), None, MAINTENANT), [])

    def test_releve_fige(self):
        vieux = (MAINTENANT - timedelta(hours=8)).strftime("%Y-%m-%dT%H:%M:%SZ")
        problemes = verifie_site.diagnostic(promo(maj=vieux), ACCUEIL, MAINTENANT)
        self.assertTrue(any("vieux" in p for p in problemes))

    def test_catalogue_incomplet(self):
        problemes = verifie_site.diagnostic(promo(articles=12), ACCUEIL, MAINTENANT)
        self.assertTrue(any("articles seulement" in p for p in problemes))

    def test_json_illisible_et_index_absent(self):
        with mock.patch.object(verifie_site, "charger",
                               side_effect=[(200, ACCUEIL), (200, "{"), (404, "")]):
            _, problemes = verifie_site.verifier("https://exemple.test/")
        self.assertTrue(any("illisible" in p for p in problemes))
        self.assertTrue(any("tailles_index" in p for p in problemes))

    def test_relance_sans_jeton_refusee(self):
        self.assertFalse(verifie_site.relancer("depot/test", ""))


class TestRelanceUtile(unittest.TestCase):
    def _api(self, runs):
        return lambda url, jeton: {"workflow_runs": runs}

    def test_passage_deja_en_cours(self):
        utile, raison = verifie_site.relance_utile(
            "jeton", api=self._api([{"status": "in_progress"}]), maintenant=MAINTENANT)
        self.assertFalse(utile)
        self.assertIn("en cours", raison)

    def test_passage_recent_ne_relance_pas(self):
        fin = (MAINTENANT - timedelta(minutes=5)).isoformat()
        utile, raison = verifie_site.relance_utile(
            "jeton", api=self._api([{"status": "completed", "updated_at": fin}]),
            maintenant=MAINTENANT)
        self.assertFalse(utile)
        self.assertIn("5 min", raison)

    def test_collecte_figee_depuis_longtemps(self):
        fin = (MAINTENANT - timedelta(hours=1)).isoformat()
        utile, _ = verifie_site.relance_utile(
            "jeton", api=self._api([{"status": "completed", "updated_at": fin}]),
            maintenant=MAINTENANT)
        self.assertTrue(utile)

    def test_api_illisible_laisse_relancer(self):
        self.assertTrue(verifie_site.relance_utile("jeton", api=lambda u, j: None)[0])

    def test_sans_jeton(self):
        self.assertFalse(verifie_site.relance_utile("")[0])


if __name__ == "__main__":
    unittest.main(verbosity=2)
