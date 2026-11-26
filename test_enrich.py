import unittest

import enrich


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


if __name__ == "__main__":
    unittest.main(verbosity=2)
