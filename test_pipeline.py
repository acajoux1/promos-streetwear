import os
import tempfile
import unittest

import pipeline


class TestPipeline(unittest.TestCase):
    def test_s_arrete_a_la_premiere_etape_en_echec(self):
        with tempfile.TemporaryDirectory() as dossier:
            marque = os.path.join(dossier, "fait")
            etapes = (
                ("panne", ("-c", "raise SystemExit(3)")),
                ("jamais", ("-c", "open(%r, 'w')" % marque)),
            )
            self.assertEqual(pipeline.executer(etapes, racine=dossier), 3)
            self.assertFalse(os.path.exists(marque))

    def test_etape_non_critique_continue_et_rend_2(self):
        with tempfile.TemporaryDirectory() as dossier:
            marque = os.path.join(dossier, "fait")
            etapes = (
                ("prix", ("-c", "raise SystemExit(3)"), False),
                ("flux", ("-c", "open(%r, 'w')" % marque), True),
            )
            self.assertEqual(pipeline.executer(etapes, racine=dossier), 2)
            self.assertTrue(os.path.exists(marque))

    def test_enchaine_les_etapes_dans_l_ordre(self):
        with tempfile.TemporaryDirectory() as dossier:
            etapes = (
                ("un", ("-c", "open('un', 'w')")),
                ("deux", ("-c", "open('deux', 'w')")),
            )
            self.assertEqual(pipeline.executer(etapes, racine=dossier), 0)
            self.assertEqual(sorted(os.listdir(dossier)), ["deux", "un"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
