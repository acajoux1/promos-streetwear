import json
import os
import unittest

from size_prices import build_size_index, offer_size_key

PARIS = "data/prix_tailles.json"
INDEX = "data/tailles_index.json"


def charger(chemin):
    with open(chemin, encoding="utf-8") as fichier:
        return json.load(fichier)


def bornes_disponibles(record):
    prix = [v.get("prix") for v in record.get("variantes") or []
            if isinstance(v.get("prix"), (int, float))
            and not isinstance(v.get("prix"), bool)
            and v.get("disponible", True)]
    if not prix:
        prix = [v.get("prix") for v in record.get("variantes") or []
                if isinstance(v.get("prix"), (int, float))
                and not isinstance(v.get("prix"), bool)]
    if not prix:
        return (None, None)
    return (min(prix), max(prix))


@unittest.skipUnless(os.path.exists(PARIS), "données prix_tailles.json absentes")
class TestIntegriteDonnees(unittest.TestCase):
    def test_articles_et_by_link_coherents(self):
        data = charger(PARIS)
        self.assertEqual(len(data["articles"]), data["total"])
        self.assertEqual(len(data["by_link"]), len(data["articles"]))
        for record in data["articles"]:
            self.assertEqual(data["by_link"][record["lien"]]["prix_min"], record["prix_min"])
            self.assertEqual(data["by_link"][record["lien"]]["prix_max"], record["prix_max"])

    def test_bornes_derivees_des_variantes_disponibles(self):
        data = charger(PARIS)
        for record in data["articles"]:
            attendu = bornes_disponibles(record)
            self.assertEqual((record["prix_min"], record["prix_max"]), attendu,
                             "bornes incohérentes pour %s" % record["lien"])

    def test_tailles_disponibles_sans_variante_indisponible(self):
        data = charger(PARIS)
        for record in data["articles"]:
            indisponibles = {offer_size_key(v.get("taille")) for v in record.get("variantes") or []
                             if v.get("disponible") is False}
            disponibles = {offer_size_key(v.get("taille")) for v in record.get("variantes") or []
                           if v.get("disponible") is not False}
            self.assertFalse((indisponibles - disponibles) & set(record["tailles"]),
                             "taille indisponible listée pour %s" % record["lien"])


@unittest.skipUnless(os.path.exists(PARIS) and os.path.exists(INDEX),
                     "index des tailles absent")
class TestIndexTailles(unittest.TestCase):
    def test_index_correspond_aux_bornes(self):
        data = charger(PARIS)
        index = charger(INDEX)
        self.assertEqual(index["total"], len(index["by_link"]))
        for lien, record in data["by_link"].items():
            entree = index["by_link"].get(lien)
            self.assertIsNotNone(entree, "lien absent de l'index : %s" % lien)
            self.assertEqual(entree["min"], record["prix_min"], lien)
            self.assertEqual(entree["max"], record["prix_max"], lien)
            for taille, prix in entree["p"].items():
                self.assertIn(taille, entree["t"], lien)
                self.assertGreaterEqual(prix, entree["min"] - 0.005, lien)
                self.assertLessEqual(prix, entree["max"] + 0.005, lien)

    def test_index_regenerable_a_l_identique(self):
        data = charger(PARIS)
        index = charger(INDEX)
        recalcule = build_size_index(data)
        self.assertEqual(recalcule["by_link"], index["by_link"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
