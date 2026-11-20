import json
import os
import unittest

from size_prices import build_size_index, offer_size_key

PARIS = "data/prix_tailles.json"
INDEX = "data/tailles_index.json"


def charger(chemin):
    with open(chemin, encoding="utf-8") as fichier:
        return json.load(fichier)


def bornes(record):
    """Minimum et maximum du bloc de prix : prix mini de chaque pointure."""
    par_taille = {}
    for variante in record.get("variantes") or []:
        prix = variante.get("prix")
        if not isinstance(prix, (int, float)) or isinstance(prix, bool):
            continue
        cle = offer_size_key(variante.get("taille"))
        if cle and (cle not in par_taille or prix < par_taille[cle]):
            par_taille[cle] = prix
    if not par_taille:
        return (None, None)
    return (min(par_taille.values()), max(par_taille.values()))


@unittest.skipUnless(os.path.exists(PARIS), "données prix_tailles.json absentes")
class TestIntegriteDonnees(unittest.TestCase):
    def test_by_link_coherent(self):
        data = charger(PARIS)
        self.assertEqual(len(data["by_link"]), data["total"])
        self.assertNotIn("articles", data, "les fiches sont dupliquées dans le fichier")

    def test_bornes_derivees_du_bloc_de_prix(self):
        data = charger(PARIS)
        for lien, record in data["by_link"].items():
            self.assertEqual((record["prix_min"], record["prix_max"]), bornes(record),
                             "bornes incohérentes pour %s" % lien)

    def test_une_offre_par_taille_et_etat(self):
        data = charger(PARIS)
        for lien, record in data["by_link"].items():
            vus = set()
            for variante in record.get("variantes") or []:
                self.assertIsNot(variante.get("disponible"), False, lien)
                cle = (offer_size_key(variante["taille"]), variante["taille"].split(" / ")[-1]
                       if " / " in variante["taille"] else "")
                self.assertNotIn(cle, vus, "taille en double pour %s" % lien)
                vus.add(cle)


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

    def test_fourchette_affichee_egale_bloc_de_prix(self):
        index = charger(INDEX)
        for lien, entree in index["by_link"].items():
            prix = list(entree["p"].values())
            self.assertTrue(prix, "bloc de prix vide pour %s" % lien)
            self.assertEqual(entree["min"], min(prix), lien)
            self.assertEqual(entree["max"], max(prix), lien)
            for taille, valeur in entree["p"].items():
                self.assertIn(taille, entree["t"], lien)

    def test_index_regenerable_a_l_identique(self):
        data = charger(PARIS)
        index = charger(INDEX)
        recalcule = build_size_index(data)
        self.assertEqual(recalcule["by_link"], index["by_link"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
