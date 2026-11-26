import unittest

import incident


def faux(reponses):
    """Faux client d'API : répond selon (fragment de chemin, méthode)."""
    appels = []

    def appel(chemin, methode="GET", charge=None, jeton="", base=None):
        appels.append((methode, chemin, charge))
        for prefixe, meth, code, data in reponses:
            if prefixe in chemin and meth == methode:
                return code, data
        return 404, None

    appel.appels = appels
    return appel


VIDE = ("/search/issues", "GET", 200, {"items": []})
EXISTE = ("/search/issues", "GET", 200, {
    "items": [{"number": 7, "title": "Incident · Tests"}]})


class TestIncident(unittest.TestCase):
    def test_ouverture_avec_label(self):
        api = faux([VIDE, ("/repos/x/y/labels", "POST", 201, {}),
                    ("/repos/x/y/issues", "POST", 201, {"number": 9})])
        resultat = incident.signaler("Tests", "https://run/1", "failure", "main",
                                     "jeton", "x/y", api)
        self.assertEqual(resultat, "ouvert")
        creation = [a for a in api.appels if a[0] == "POST" and a[1].endswith("/issues")]
        self.assertEqual(len(creation), 1)
        self.assertEqual(creation[0][2]["title"], "Incident · Tests")
        self.assertEqual(creation[0][2]["labels"], ["incident"])
        self.assertIn("https://run/1", creation[0][2]["body"])

    def test_pas_de_doublon_pour_le_meme_run(self):
        api = faux([EXISTE, ("/comments?per_page=100", "GET", 200, [
            {"body": "déjà vu https://run/1"}]),
            ("/repos/x/y/issues/7/comments", "POST", 201, {})])
        resultat = incident.signaler("Tests", "https://run/1", "failure", "main",
                                     "jeton", "x/y", api)
        self.assertEqual(resultat, "déjà signalé")
        commentaires = [a for a in api.appels if a[0] == "POST"]
        self.assertEqual(commentaires, [])

    def test_commentaire_sur_une_issue_existante(self):
        api = faux([EXISTE, ("/comments?per_page=100", "GET", 200, [{"body": "autre"}]),
                    ("/repos/x/y/issues/7/comments", "POST", 201, {})])
        self.assertEqual(incident.signaler("Tests", "https://run/2", "failure",
                                           jeton="jeton", depot="x/y", requete=api),
                         "commenté")

    def test_fermeture_au_retour_au_vert(self):
        api = faux([EXISTE, ("/repos/x/y/issues/7/comments", "POST", 201, {}),
                    ("/repos/x/y/issues/7", "PATCH", 200, {})])
        self.assertEqual(incident.signaler("Tests", "https://run/1", "success",
                                           jeton="jeton", depot="x/y", requete=api),
                         "fermé")
        patch = [a for a in api.appels if a[0] == "PATCH"]
        self.assertEqual(patch[0][2], {"state": "closed"})

    def test_rien_sans_jeton(self):
        self.assertIn("rien à signaler",
                      incident.signaler("Tests", "", "failure"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
