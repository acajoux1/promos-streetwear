import unittest
from datetime import datetime, timezone

import menage

MAINTENANT = datetime(2026, 11, 26, 12, 0, tzinfo=timezone.utc)

PRS = [
    {"number": 1, "state": "open", "head": {"ref": "agents/structure-20260101"},
     "updated_at": "2026-01-01T00:00:00Z"},
    {"number": 2, "state": "open", "head": {"ref": "agents/structure-20261120"},
     "updated_at": "2026-11-20T00:00:00Z"},
    {"number": 3, "state": "open", "head": {"ref": "feature/humaine"},
     "updated_at": "2020-01-01T00:00:00Z"},
    {"number": 4, "state": "closed", "head": {"ref": "agents/histoire-20260101"},
     "updated_at": "2020-01-01T00:00:00Z"},
]


class TestMenage(unittest.TestCase):
    def test_seules_les_pr_d_agent_perimees(self):
        self.assertEqual([pr["number"] for pr in menage.perimees(PRS, maintenant=MAINTENANT)],
                         [1])

    def test_fermeture_et_suppression_de_branche(self):
        appels = []

        def faux(chemin, methode="GET", charge=None, jeton="", base=None):
            appels.append((methode, chemin, charge))
            if chemin.startswith("/repos/x/y/pulls?state=open"):
                return 200, PRS
            return 200, {}

        fermees = menage.fermer("x/y", "jeton", requete=faux, maintenant=MAINTENANT,
                                journal=lambda *a: None)
        self.assertEqual(fermees, [1])
        patch = [a for a in appels if a[0] == "PATCH"]
        self.assertEqual(patch[0][1], "/repos/x/y/pulls/1")
        suppression = [a for a in appels if a[0] == "DELETE"]
        self.assertEqual(suppression[0][1], "/repos/x/y/git/refs/heads/agents/structure-20260101")

    def test_liste_illisible(self):
        def faux(chemin, methode="GET", charge=None, jeton="", base=None):
            return 500, None
        self.assertEqual(menage.fermer("x/y", "jeton", requete=faux), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
