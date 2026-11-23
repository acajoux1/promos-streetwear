import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent / "agents"))
import histoire  # noqa: E402

PAGE = ("kardo est une marque de pantalons fondée en 2019 à Paris. " * 20)


def page(texte=PAGE):
    return mock.patch.object(histoire.c, "telecharger", return_value=(200, texte))


class TestDomainesSources(unittest.TestCase):
    def test_domaine_usurpe_avec_le_nom_de_la_marque_refuse(self):
        with mock.patch.object(histoire.c, "telecharger") as telecharger:
            ok, detail = histoire.sources_ok(
                "kardo", [2019],
                ["https://kardo-magasin.test/histoire", "https://kardo-magasin.test/apropos"],
            )
        self.assertFalse(ok)
        self.assertIn("hors liste", detail)
        self.assertIn("kardo-magasin.test", detail)
        telecharger.assert_not_called()

    def test_suffixe_piege_sur_la_liste_de_confiance_refuse(self):
        for hote in ("fauxwikipedia.org", "wikipedia.org.exemple.test", "vogue.com.evil.test"):
            self.assertFalse(histoire.source_autorisee("kardo", hote), hote)

    def test_liste_de_confiance_exacte_et_sous_domaine_acceptes(self):
        self.assertTrue(histoire.source_autorisee("kardo", "wikipedia.org"))
        self.assertTrue(histoire.source_autorisee("kardo", "fr.wikipedia.org"))
        self.assertTrue(histoire.source_autorisee("kardo", "vogue.com"))

    def test_site_officiel_exact_accepte(self):
        self.assertTrue(histoire.source_autorisee("adidas", "adidas.com"))
        self.assertTrue(histoire.source_autorisee("adidas", "news.adidas.com"))
        self.assertTrue(histoire.source_autorisee("comme des garçons shirt",
                                                  "comme-des-garcons.com"))

    def test_imitation_du_site_officiel_refusee(self):
        for hote in ("adidas-outlet.test", "adidas.com.evil.test", "adidas.fr"):
            self.assertFalse(histoire.source_autorisee("adidas", hote), hote)

    def test_marque_sans_domaine_officiel_ne_garde_que_la_liste(self):
        self.assertFalse(histoire.source_autorisee("kardo", "kardo.fr"))

    def test_hote_de_normalise_l_url(self):
        self.assertEqual(histoire.hote_de("https://WWW.Vogue.com:443/article"), "vogue.com")
        self.assertEqual(histoire.hote_de("https://user@fr.wikipedia.org/wiki/X"), "fr.wikipedia.org")
        self.assertIsNone(histoire.hote_de("http://vogue.com/article"))

    def test_sources_verifiees_sur_un_domaine_de_confiance(self):
        with page():
            ok, detail = histoire.sources_ok(
                "kardo", [2019],
                ["https://fr.wikipedia.org/wiki/Kardo", "https://www.vogue.com/article/kardo"],
            )
        self.assertTrue(ok, detail)
        self.assertEqual(len(detail), 2)

    def test_source_officielle_verifiee(self):
        with page("adidas est fondée en 1949 par Adolf Dassler. " * 20):
            ok, detail = histoire.sources_ok(
                "adidas", [1949],
                ["https://www.adidas.com/histoire", "https://fr.wikipedia.org/wiki/Adidas"],
            )
        self.assertTrue(ok, detail)

    def test_table_officiels_bien_formee(self):
        for marque, domaine in histoire.OFFICIELS.items():
            self.assertRegex(domaine, r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)+$",
                             "%s : %r" % (marque, domaine))
            self.assertFalse(domaine.startswith("www."), marque)
            self.assertNotIn("/", domaine, marque)

    def test_domaines_corriges_apres_controle_reseau(self):
        # palm angels : palmangels.com (palmandangels.com ne résout pas) ;
        # rhude : rh-ude.com (rhude.com affiche « Site not found »).
        self.assertTrue(histoire.source_autorisee("palm angels", "palmangels.com"))
        self.assertFalse(histoire.source_autorisee("palm angels", "palmandangels.com"))
        self.assertTrue(histoire.source_autorisee("rhude", "rh-ude.com"))
        self.assertFalse(histoire.source_autorisee("rhude", "rhude.com"))

    def test_domaine_officiel_mort_refuse_sans_planter(self):
        for reponse in ((0, ""), (404, "introuvable"), (None, None)):
            with mock.patch.object(histoire.c, "telecharger", return_value=reponse):
                ok, detail = histoire.sources_ok(
                    "adidas", [1949],
                    ["https://www.adidas.com/histoire", "https://fr.wikipedia.org/wiki/Adidas"],
                )
            self.assertFalse(ok, reponse)
            self.assertIn("injoignable", detail)

    def test_domaine_officiel_sans_la_marque_refuse(self):
        with page("Bienvenue sur la boutique. " * 30):
            ok, detail = histoire.sources_ok(
                "adidas", [1949],
                ["https://www.adidas.com/histoire", "https://fr.wikipedia.org/wiki/Adidas"],
            )
        self.assertFalse(ok)
        self.assertIn("la marque n'est pas citée", detail)

    def test_domaine_usurpe_refuse_meme_avec_une_bonne_source(self):
        with page():
            ok, detail = histoire.sources_ok(
                "kardo", [2019],
                ["https://fr.wikipedia.org/wiki/Kardo", "https://kardo-magasin.test/kardo"],
            )
        self.assertFalse(ok)
        self.assertIn("kardo-magasin.test", detail)


if __name__ == "__main__":
    unittest.main(verbosity=2)
