import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent / "agents"))
import commun  # noqa: E402


def resultat(stdout="", code=0):
    return subprocess.CompletedProcess([], code, stdout, "")


class TestPousserBranche(unittest.TestCase):
    def lancer(self, reponses, attendre_echec=False):
        """Joue `pousser_branche` sur une fausse git ; retourne les appels vus."""
        appels = []

        def faux(*args, verifier=True):
            appels.append((list(args), verifier))
            if args[0] == "fetch":
                return resultat(code=reponses["fetch"])
            if args[0] == "rev-parse":
                return resultat(reponses.get("lu", ""), 0 if reponses.get("lu") else 1)
            if args[0] == "push":
                if reponses.get("refus"):
                    raise RuntimeError("push refusé")
                return resultat()
            raise AssertionError(args)

        with mock.patch.object(commun, "git", side_effect=faux):
            if attendre_echec:
                with self.assertRaises(RuntimeError):
                    commun.pousser_branche("agents/histoire-20261125")
            else:
                commun.pousser_branche("agents/histoire-20261125")
        return appels

    def test_distante_lue_donne_un_bail_explicite(self):
        appels = self.lancer({"fetch": 0, "lu": "152c60a\n"})
        pushes = [a for a, _ in appels if a[0] == "push"]
        self.assertEqual(len(pushes), 1)
        self.assertIn("--force-with-lease=refs/heads/agents/histoire-20261125:152c60a", pushes[0])

    def test_distante_absente_pousse_sans_forcer(self):
        appels = self.lancer({"fetch": 128})
        fetches = [(a, v) for a, v in appels if a[0] == "fetch"]
        # Une distante absente ne doit pas interrompre le run.
        self.assertEqual(fetches[0][1], False)
        pushes = [a for a, _ in appels if a[0] == "push"]
        self.assertEqual(pushes, [["push", "-u", "origin", "agents/histoire-20261125"]])

    def test_push_refuse_relu_puis_reessaye(self):
        appels = self.lancer({"fetch": 0, "lu": "152c60a\n", "refus": True},
                             attendre_echec=True)
        self.assertEqual(len([a for a, _ in appels if a[0] == "fetch"]), 2)
        self.assertEqual(len([a for a, _ in appels if a[0] == "push"]), 2)


class TestActualiserPr(unittest.TestCase):
    """Une PR déjà ouverte doit prendre le corps du passage, pas celui d'avant."""

    def appeler(self, reponses, corps="## Histoires\n\nAucune fiche.\n"):
        appels = []

        def faux(args, timeout=300):
            appels.append(list(args))
            if args[2:3] == ["view"]:
                return reponses.get("view", (0, "https://exemple.test/pull/2\n"))
            if args[2:3] == ["edit"]:
                return reponses.get("edit", (0, ""))
            raise AssertionError(args)

        with tempfile.TemporaryDirectory() as d:
            chemin = Path(d) / ".pr-corps.md"
            chemin.write_text(corps, encoding="utf-8")
            with mock.patch.object(commun, "lancer", side_effect=faux):
                url = commun.actualiser_pr("agents/histoire-20261125", chemin)
        return url, appels

    def test_pr_ouverte_recoit_le_nouveau_corps(self):
        url, appels = self.appeler({})
        self.assertEqual(url, "https://exemple.test/pull/2")
        edits = [a for a in appels if a[2:3] == ["edit"]]
        self.assertEqual(len(edits), 1)
        self.assertIn("--body-file", edits[0])
        self.assertIn(".pr-corps.md", edits[0][-1])

    def test_echec_de_mise_a_jour_garde_l_url(self):
        url, appels = self.appeler({"edit": (1, "boom")})
        self.assertEqual(url, "https://exemple.test/pull/2")
        self.assertEqual(len([a for a in appels if a[2:3] == ["edit"]]), 1)

    def test_sans_pr_rien_a_mettre_a_jour(self):
        url, appels = self.appeler({"view": (1, "no pull requests found")})
        self.assertIsNone(url)
        self.assertEqual([a for a in appels if a[2:3] == ["edit"]], [])
