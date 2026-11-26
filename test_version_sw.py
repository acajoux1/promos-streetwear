import tempfile
import unittest
from pathlib import Path

import version_sw

SW = """var V="promos-v39";
var SHELL=["./","index.html","app.js"];
"""


class TestVersionServiceWorker(unittest.TestCase):
    def setUp(self):
        self.dossier = tempfile.TemporaryDirectory()
        self.racine = Path(self.dossier.name)
        (self.racine / "sw.js").write_text(SW, encoding="utf-8")
        (self.racine / "index.html").write_text("<h1>a</h1>", encoding="utf-8")
        (self.racine / "app.js").write_text("1", encoding="utf-8")

    def tearDown(self):
        self.dossier.cleanup()

    def test_shell_ignore_l_entree_racine(self):
        self.assertEqual(version_sw.shell(self.racine), ["index.html", "app.js"])

    def test_version_stable_puis_suit_le_contenu(self):
        avant = version_sw.empreinte(self.racine)
        self.assertTrue(avant.startswith("promos-"))
        self.assertEqual(avant, version_sw.empreinte(self.racine))
        (self.racine / "app.js").write_text("2", encoding="utf-8")
        self.assertNotEqual(avant, version_sw.empreinte(self.racine))

    def test_ecrire_met_a_jour_une_seule_fois(self):
        ancienne, nouvelle, changee = version_sw.ecrire(self.racine)
        self.assertEqual(ancienne, "promos-v39")
        self.assertTrue(changee)
        self.assertEqual(version_sw.version(self.racine), nouvelle)
        self.assertEqual(version_sw.ecrire(self.racine), (nouvelle, nouvelle, False))


if __name__ == "__main__":
    unittest.main(verbosity=2)
