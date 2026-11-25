import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent / "agents"))
import histoire  # noqa: E402

PAGE = ("kardo est une marque de pantalons fondée en 2019 à Paris. " * 20)


def page(texte=PAGE):
    return mock.patch.object(histoire.c, "telecharger", return_value=(200, texte))


def pages(par_url, defaut=(200, PAGE)):
    """Réponse différente par URL ; tout ce qui n'est pas prévu renvoie `defaut`."""
    return mock.patch.object(histoire.c, "telecharger",
                             side_effect=lambda u: par_url.get(u, defaut))


class TestCandidatesSources(unittest.TestCase):
    def test_page_wikipedia_renommee_rattrapee_apres_deux_404(self):
        bon = "https://fr.wikipedia.org/wiki/Star_Cow_(marque)"
        with pages({"https://fr.wikipedia.org/wiki/StarCow": (404, "introuvable"),
                    "https://fr.wikipedia.org/wiki/Star_Cow": (404, "introuvable"),
                    bon: (200, PAGE)}):
            ok, detail = histoire.sources_ok(
                "kardo", [2019],
                [["https://fr.wikipedia.org/wiki/StarCow",
                  "https://fr.wikipedia.org/wiki/Star_Cow", bon],
                 "https://www.vogue.com/article/kardo"],
            )
        self.assertTrue(ok, detail)
        self.assertEqual(detail, [bon, "https://www.vogue.com/article/kardo"])

    def test_candidate_sans_la_marque_ecartee_au_profit_de_la_suivante(self):
        homonyme = "https://fr.wikipedia.org/wiki/Kardo_(film)"
        bon = "https://fr.wikipedia.org/wiki/Kardo"
        with pages({homonyme: (200, "Bienvenue sur la boutique. " * 30), bon: (200, PAGE)}):
            ok, detail = histoire.sources_ok(
                "kardo", [2019],
                [[homonyme, bon], "https://www.vogue.com/article/kardo"],
            )
        self.assertTrue(ok, detail)
        self.assertEqual(detail[0], bon)

    def test_candidates_toutes_mortes_refusent_la_source(self):
        with pages({}, defaut=(404, "introuvable")):
            ok, detail = histoire.sources_ok(
                "kardo", [2019],
                [["https://fr.wikipedia.org/wiki/Kardo",
                  "https://fr.wikipedia.org/wiki/Kardo_(marque)"],
                 "https://www.vogue.com/article/kardo"],
            )
        self.assertFalse(ok)
        self.assertIn("injoignable", detail)

    def test_candidate_hors_liste_refusee(self):
        with pages({}):
            ok, detail = histoire.sources_ok(
                "kardo", [2019],
                [["https://fr.wikipedia.org/wiki/Kardo", "https://kardo-magasin.test/histoire"],
                 "https://www.vogue.com/article/kardo"],
            )
        self.assertFalse(ok)
        self.assertIn("kardo-magasin.test", detail)

    def test_candidate_non_https_refusee(self):
        with pages({}):
            ok, detail = histoire.sources_ok(
                "kardo", [2019],
                [["https://fr.wikipedia.org/wiki/Kardo", "http://fr.wikipedia.org/wiki/Kardo"],
                 "https://www.vogue.com/article/kardo"],
            )
        self.assertFalse(ok)
        self.assertIn("non https", detail)

    def test_liste_vide_refusee_sans_planter(self):
        with pages({}):
            ok, detail = histoire.sources_ok(
                "kardo", [2019], [[], "https://www.vogue.com/article/kardo"],
            )
        self.assertFalse(ok)
        self.assertIn("sans URL", detail)


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


BONNE = ('{"cle":"kardo","w":"%s","who":"%s","what":"%s",'
         '"t":[[2019,"fondation à Paris"],[2021,"première collection"],'
         '[2024,"ouverture à Londres"]],"q":"%s","m":"pantalons parisiens",'
         '"src":["https://fr.wikipedia.org/wiki/Kardo"]}')


def fiche_json(w=None, who=None, what=None, q=None, frise=None):
    """Une fiche conforme, avec un champ à remplacer pour la rendre fautive."""
    base = BONNE % (w or "Kardo habille les amateurs de pantalons larges depuis son atelier parisien.",
                    who or "Fondée en 2019 par deux amis parisiens, la marque reste indépendante.",
                    what or "Des pantalons amples coupés dans des tissus épais, fabriqués en Europe.",
                    q or "Le pantalon large comme manifeste.")
    if frise is not None:
        base = base.replace('[[2019,"fondation à Paris"],[2021,"première collection"],'
                            '[2024,"ouverture à Londres"]]', frise)
    return base


class TestFicheRedemandee(unittest.TestCase):
    def appels(self, reponses):
        with mock.patch.object(histoire.c, "appeler", side_effect=reponses) as m:
            resultat = histoire.fiche("kardo", 8)
        return resultat, m.call_args_list

    def test_frise_refusee_redemandee_avec_les_problemes(self):
        obj, pbs, transitoire = self.appels([
            fiche_json(frise='[[2019,"fondation à Paris"],[2021,"première collection"]]'),
            fiche_json(),
        ])[0]
        self.assertIsNone(pbs)
        self.assertFalse(transitoire)
        self.assertIsNotNone(obj)
        self.assertEqual(len(obj["t"]), 3)

    def test_la_seconde_demande_dit_ce_qui_clochait(self):
        _, appels = self.appels([
            fiche_json(frise='[[2019,"fondation à Paris"]]'),
            fiche_json(),
        ])
        self.assertEqual(len(appels), 2)
        seconde = appels[1].args[1]
        self.assertIn("frise : 3 ou 4 repères attendus", seconde)

    def test_deux_refus_ecartent_la_marque(self):
        obj, pbs, transitoire = self.appels([
            fiche_json(frise='[[2019,"fondation"]]'),
            fiche_json(frise='[[2019,"fondation"]]'),
        ])[0]
        self.assertIsNone(obj)
        self.assertIn("frise : 3 ou 4 repères attendus", pbs)
        self.assertFalse(transitoire)

    def test_surcharge_429_marquee_transitoire(self):
        with mock.patch.object(histoire.c, "appeler",
                               side_effect=histoire.c.Echec("HTTP 429 : 1305", 429)):
            obj, pbs, transitoire = histoire.fiche("kardo", 8)
        self.assertIsNone(obj)
        self.assertTrue(transitoire)

    def test_erreur_non_transitoire_garde_la_marque_gelee(self):
        with mock.patch.object(histoire.c, "appeler",
                               side_effect=histoire.c.Echec("HTTP 401", 401)):
            obj, pbs, transitoire = histoire.fiche("kardo", 8)
        self.assertIsNone(obj)
        self.assertFalse(transitoire)


if __name__ == "__main__":
    unittest.main(verbosity=2)


class TestResume(unittest.TestCase):
    def test_tableau_et_compte(self):
        texte = histoire.resume([
            {"marque": "end. label", "articles": 15, "etat": "retenue",
             "detail": "3 source(s) vérifiée(s)", "fournisseur": "Gemini"},
            {"marque": "kardo", "articles": 7, "etat": "refusée",
             "detail": "frise : 3 ou 4 repères attendus", "fournisseur": ""},
        ], 5)
        self.assertIn("| end. label | 15 | retenue |", texte)
        self.assertIn("2 marque(s) tentée(s), **1 retenue(s)**, 1 sans fiche", texte)
        self.assertIn("5 fiche(s) après fusion", texte)
        self.assertIn("| — |", texte)  # fournisseur inconnu

    def test_colonne_non_cassee(self):
        texte = histoire.resume([{"marque": "a|b", "articles": 1, "etat": "refusée",
                                  "detail": "x|y", "fournisseur": ""}], 0)
        self.assertIn("a/b", texte)
        self.assertIn("x/y", texte)
        self.assertNotIn("a|b", texte)

    def test_vide_dit_qu_il_n_y_a_rien(self):
        texte = histoire.resume([], 3)
        self.assertIn("0 marque(s) tentée(s)", texte)


class TestDiagnostic(unittest.TestCase):
    def test_sans_cle_sort_en_echec(self):
        with mock.patch.object(histoire.c, "a_une_cle", return_value=False), \
                mock.patch.object(histoire.c, "resumer") as resume:
            self.assertEqual(histoire.diagnostic(), 1)
        self.assertIn("Aucune clé", resume.call_args[0][0])

    def test_tous_muets_sort_en_echec(self):
        essais = [{"nom": "Z.ai", "modele": "glm", "ok": False,
                   "detail": "HTTP 429 : 1305", "duree": 0.4}]
        with mock.patch.object(histoire.c, "a_une_cle", return_value=True), \
                mock.patch.object(histoire.c, "diagnostic_fournisseurs", return_value=essais), \
                mock.patch.object(histoire.c, "resumer") as resume:
            self.assertEqual(histoire.diagnostic(), 1)
        texte = resume.call_args[0][0]
        self.assertIn("Aucun fournisseur ne répond", texte)
        self.assertIn("AI_API_KEY_BACKUP", texte)

    def test_un_fournisseur_qui_repond_laisse_passer(self):
        essais = [{"nom": "Z.ai", "modele": "glm", "ok": False,
                   "detail": "HTTP 429 : 1305", "duree": 0.4},
                  {"nom": "Gemini", "modele": "gemini-3.8-flash", "ok": True,
                   "detail": "—", "duree": 2.1}]
        with mock.patch.object(histoire.c, "a_une_cle", return_value=True), \
                mock.patch.object(histoire.c, "diagnostic_fournisseurs", return_value=essais), \
                mock.patch.object(histoire.c, "resumer") as resume:
            self.assertEqual(histoire.diagnostic(), 0)
        self.assertIn("**Gemini**", resume.call_args[0][0])

    def test_aucune_marque_resume_et_sort_a_zero(self):
        with mock.patch.object(histoire, "candidats", return_value=[]), \
                mock.patch.object(histoire.c, "lire_json", return_value={}), \
                mock.patch.object(histoire.c, "resumer") as resume:
            self.assertEqual(histoire.main(), 0)
        self.assertIn("Aucune marque", resume.call_args[0][0])


class TestFusionDeLaPr(unittest.TestCase):
    """La PR ouverte doit finir dans `main`, sinon le run échoue franchement."""

    def appeler(self, etat, url="https://exemple.test/pull/3"):
        with mock.patch.object(histoire, "candidats", return_value=[(8, "kardo")]), \
                mock.patch.object(histoire.c, "lire_json", return_value={"items": {}}), \
                mock.patch.object(histoire.c, "a_une_cle", return_value=True), \
                mock.patch.object(histoire.c, "lancer", return_value=(0, "")), \
                mock.patch.object(histoire, "fiche", return_value=(None, ["refus"], False)), \
                mock.patch.object(histoire.c, "ecrire_json"), \
                mock.patch.object(histoire.c, "resumer"), \
                mock.patch.object(histoire.c, "branche_libre",
                                  return_value="agents/histoire-20261125") as libre, \
                mock.patch.object(histoire.c, "creer_pr", return_value=url) as pr, \
                mock.patch.object(histoire.c, "fusionner_pr", return_value=etat) as fusion:
            code = histoire.main()
        self.assertTrue(libre.called)
        return code, pr, fusion

    def test_pr_fusionnee_sort_a_zero(self):
        code, pr, fusion = self.appeler("fusionnée")
        self.assertEqual(code, 0)
        self.assertEqual(pr.call_args[0][2], "agents/histoire-20261125")
        fusion.assert_called_once_with("agents/histoire-20261125")

    def test_pr_non_fusionnee_sort_en_echec(self):
        code, _, fusion = self.appeler("contrôles en échec : tests")
        self.assertEqual(code, 1)
        fusion.assert_called_once()

    def test_sans_pull_request_ne_fusionne_rien(self):
        code, _, fusion = self.appeler("fusionnée", url=None)
        self.assertEqual(code, 0)
        fusion.assert_not_called()
