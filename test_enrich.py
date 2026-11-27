import sys
import unittest
from unittest import mock

import enrich

NOTE = "Une paire sobre en cuir grainé, coupée large et montée sur une semelle épaisse."


def article(lien, remise=20, nom="Sneaker de test"):
    return {"lien": lien, "nom": nom, "remise": remise}


class TestNotes(unittest.TestCase):
    def test_note_lue_dans_les_deux_formats(self):
        cache = {"a": {"d": "texte", "t": "2026-11-01T00:00:00+00:00"}, "b": "ancien"}
        self.assertEqual(enrich.note_de(cache, "a"), "texte")
        self.assertEqual(enrich.note_de(cache, "b"), "ancien")
        self.assertEqual(enrich.note_de(cache, "c"), "")

    def test_prioritaires_par_remise(self):
        items = [article("https://x/1", 10), article("https://x/2", 80),
                 article("https://x/3", 50), article("https://x/4", 90, nom="Court")]
        self.assertEqual([x["lien"] for x in enrich.prioritaires(items, 2)],
                         ["https://x/2", "https://x/3"])

    def test_couverture_de_la_cible(self):
        items = [article("https://x/%d" % i) for i in range(4)]
        cache = {"https://x/0": {"d": "note"}, "https://x/1": {"d": "note"}}
        self.assertEqual(enrich.couverture(items, cache, 4), 0.5)

    def test_choisir_ecarte_les_noms_trop_courts(self):
        items = [article("https://x/1", 90, nom="Court"),
                 article("https://x/2", 5, nom="Une paire correcte")]
        self.assertEqual([x["lien"] for x in enrich.choisir(items, {}, 10, 45)],
                         ["https://x/2"])

    def test_choisir_repasse_les_notes_anciennes(self):
        items = [article("https://x/1")]
        vieux = {"https://x/1": {"d": "texte", "t": "2020-01-01T00:00:00+00:00"}}
        self.assertEqual(len(enrich.choisir(items, vieux, 10, 45)), 1)
        recent = {"https://x/1": {"d": "texte", "t": "2099-01-01T00:00:00+00:00"}}
        self.assertEqual(enrich.choisir(items, recent, 10, 45), [])


class TestPanneDesFournisseurs(unittest.TestCase):
    """Quand les fournisseurs sont à terre, le passage doit sortir en échec.

    Sans ça, un run vert « rien de neuf » faisait passer une panne pour une
    journée sans nouveauté.
    """

    ARTICLES = [{"lien": "https://x/%d" % i, "nom": "Sneaker de test %d" % i,
                 "remise": 10 * i} for i in range(3)]

    def lancer(self, suite):
        """`suite` : l'échec à lever (ou None pour répondre) à chaque appel."""
        appels = []

        def faux(texte, *args, **kwargs):
            appels.append(texte)
            e = suite[min(len(appels) - 1, len(suite) - 1)]
            if e is not None:
                raise e
            return NOTE

        promos = {"items": self.ARTICLES}
        with mock.patch.object(sys, "argv", ["enrich.py", "--limit", "5"]), \
                mock.patch.object(enrich, "lire_json",
                                  side_effect=lambda p, d: promos if p == enrich.PROMOS else {}), \
                mock.patch.object(enrich.commun, "a_une_cle", return_value=True), \
                mock.patch.object(enrich.commun, "appeler", side_effect=faux), \
                mock.patch.object(enrich.time, "sleep"), \
                mock.patch.object(enrich, "ecrire_json") as ecrire:
            code = enrich.main()
        return code, appels, ecrire

    def test_panne_totale_sort_en_echec_et_arrete_la_boucle(self):
        echec = enrich.commun.Echec(
            "appel au modèle impossible (Z.ai : HTTP 429 ; Gemini : HTTP 503)",
            503, panne=True)
        code, appels, ecrire = self.lancer([echec])
        self.assertEqual(code, 1, "une panne ne doit pas finir en run vert")
        self.assertEqual(len(appels), 1, "insister sur les articles suivants est inutile")
        etat = ecrire.call_args[0][1]["_etat"]
        self.assertEqual(etat["dernier_code"], "panne")
        self.assertEqual(etat["notes"], 0, "aucun article n'entre au cache : rien n'est gelé")

    def test_un_429_sans_attribut_panne_suffit(self):
        code, appels, ecrire = self.lancer([enrich.commun.Echec("HTTP 429 : 1305", 429)])
        self.assertEqual(code, 1)
        self.assertEqual(len(appels), 1)
        self.assertEqual(ecrire.call_args[0][1]["_etat"]["dernier_code"], "panne")

    def test_les_notes_deja_ecrites_sont_gardees(self):
        code, appels, ecrire = self.lancer(
            [None, enrich.commun.Echec("HTTP 503", 503, panne=True)])
        self.assertEqual(code, 1)
        self.assertEqual(len(appels), 2)
        contenu = ecrire.call_args[0][1]
        self.assertEqual(len(contenu["items"]), 1, "la note écrite avant la panne est gardée")
        self.assertEqual(contenu["_etat"]["dernier_code"], "panne")

    def test_un_refus_de_contenu_reste_vert(self):
        code, _, ecrire = self.lancer([enrich.commun.Echec("réponse vide (finish_reason=stop)", None)])
        self.assertEqual(code, 0)
        self.assertEqual(ecrire.call_args[0][1]["_etat"]["dernier_code"], "echec")


if __name__ == "__main__":
    unittest.main(verbosity=2)
