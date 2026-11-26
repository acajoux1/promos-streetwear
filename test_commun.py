import os
import subprocess
import sys
import tempfile
import unittest
import urllib.error
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
                return reponses.get("view", (0, "OPEN https://exemple.test/pull/2\n"))
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

    def test_pr_fusionnee_n_est_pas_retouchee(self):
        url, appels = self.appeler({"view": (0, "MERGED https://exemple.test/pull/2\n")})
        self.assertEqual(url, "https://exemple.test/pull/2")
        self.assertEqual([a for a in appels if a[2:3] == ["edit"]], [])


class TestBrancheLibre(unittest.TestCase):
    """Une branche dont la PR est morte doit laisser la place à une variante."""

    def choisir(self, table):
        vus = []

        def faux(branche):
            vus.append(branche)
            return table.get(branche)

        with mock.patch.object(commun, "etat_pr", side_effect=faux):
            nom = commun.branche_libre("agents/histoire-20261125")
        return nom, vus

    def test_sans_pr_garde_le_nom_du_jour(self):
        nom, vus = self.choisir({})
        self.assertEqual(nom, "agents/histoire-20261125")
        self.assertEqual(vus, ["agents/histoire-20261125"])

    def test_pr_ouverte_reprend_la_meme_branche(self):
        nom, _ = self.choisir({"agents/histoire-20261125": "OPEN"})
        self.assertEqual(nom, "agents/histoire-20261125")

    def test_pr_fusionnee_passe_a_une_variante(self):
        nom, vus = self.choisir({"agents/histoire-20261125": "MERGED"})
        self.assertEqual(nom, "agents/histoire-20261125-2")
        self.assertEqual(vus, ["agents/histoire-20261125", "agents/histoire-20261125-2"])

    def test_variante_deja_fusionnee_passe_a_la_suivante(self):
        nom, _ = self.choisir({"agents/histoire-20261125": "MERGED",
                               "agents/histoire-20261125-2": "MERGED"})
        self.assertEqual(nom, "agents/histoire-20261125-3")

    def test_pr_fermee_aussi_change_de_branche(self):
        nom, _ = self.choisir({"agents/histoire-20261125": "CLOSED"})
        self.assertEqual(nom, "agents/histoire-20261125-2")


class TestControles(unittest.TestCase):
    def test_aucun_controle(self):
        self.assertEqual(commun.controles(None), ([], []))
        self.assertEqual(commun.controles([]), ([], []))

    def test_tout_au_vert(self):
        rollup = [
            {"name": "tests", "status": "COMPLETED", "conclusion": "SUCCESS"},
            {"context": "ci", "state": "SUCCESS"},
            {"name": "lint", "status": "COMPLETED", "conclusion": "SKIPPED"},
        ]
        self.assertEqual(commun.controles(rollup), ([], []))

    def test_en_cours_et_en_echec(self):
        rollup = [
            {"name": "tests", "status": "IN_PROGRESS", "conclusion": None},
            {"name": "lint", "status": "COMPLETED", "conclusion": "FAILURE"},
            {"context": "ci", "state": "PENDING"},
        ]
        en_attente, echecs = commun.controles(rollup)
        self.assertEqual(en_attente, ["tests", "ci"])
        self.assertEqual(echecs, ["lint"])


class TestFusionnerPr(unittest.TestCase):
    def lancer(self, vues, fusion=(0, ""), attente=120):
        appels = []
        vues = list(vues)

        def faux(args, timeout=300):
            appels.append(list(args))
            if args[2:3] == ["view"]:
                return vues.pop(0) if len(vues) > 1 else vues[0]
            if args[2:3] == ["merge"]:
                return fusion
            raise AssertionError(args)

        with mock.patch.object(commun, "lancer", side_effect=faux), \
                mock.patch.object(commun.time, "sleep"):
            etat = commun.fusionner_pr("agents/histoire-20261125", attente=attente, pause=0)
        return etat, appels

    def test_sans_controle_fusionne_en_squash_et_supprime_la_branche(self):
        etat, appels = self.lancer([(0, '{"state":"OPEN","statusCheckRollup":[]}')])
        self.assertEqual(etat, "fusionnée")
        merges = [a for a in appels if a[2:3] == ["merge"]]
        self.assertEqual(len(merges), 1)
        self.assertIn("--squash", merges[0])
        self.assertIn("--delete-branch", merges[0])

    def test_controle_en_echec_ne_fusionne_pas(self):
        vue = ('{"state":"OPEN","statusCheckRollup":[{"name":"tests",'
               '"status":"COMPLETED","conclusion":"FAILURE"}]}')
        etat, appels = self.lancer([(0, vue)])
        self.assertIn("contrôles en échec", etat)
        self.assertIn("tests", etat)
        self.assertEqual([a for a in appels if a[2:3] == ["merge"]], [])

    def test_controle_en_attente_puis_vert(self):
        en_cours = ('{"state":"OPEN","statusCheckRollup":[{"name":"tests",'
                    '"status":"IN_PROGRESS"}]}')
        vert = ('{"state":"OPEN","statusCheckRollup":[{"name":"tests",'
                '"status":"COMPLETED","conclusion":"SUCCESS"}]}')
        etat, appels = self.lancer([(0, en_cours), (0, vert)])
        self.assertEqual(etat, "fusionnée")
        self.assertEqual(len([a for a in appels if a[2:3] == ["view"]]), 2)

    def test_pr_deja_fusionnee_ne_refusionne_pas(self):
        etat, appels = self.lancer([(0, '{"state":"MERGED"}')])
        self.assertEqual(etat, "fusionnée")
        self.assertEqual([a for a in appels if a[2:3] == ["merge"]], [])

    def test_fusion_refusee_rend_la_raison(self):
        etat, _ = self.lancer([(0, '{"state":"OPEN","statusCheckRollup":[]}')],
                              fusion=(1, "X Pull request is not mergeable"), attente=0)
        self.assertIn("fusion refusée", etat)
        self.assertIn("not mergeable", etat)


class TestResumer(unittest.TestCase):
    def test_ecrit_dans_le_fichier_du_resume(self):
        with tempfile.TemporaryDirectory() as d:
            chemin = Path(d) / "summary.md"
            with mock.patch.dict(os.environ, {"GITHUB_STEP_SUMMARY": str(chemin)}):
                commun.resumer("## A\n")
                commun.resumer("## B\n\nligne")
            self.assertEqual(chemin.read_text(encoding="utf-8"), "## A\n## B\n\nligne\n")

    def test_sans_fichier_ne_casse_rien(self):
        env = {k: v for k, v in os.environ.items() if k != "GITHUB_STEP_SUMMARY"}
        with mock.patch.dict(os.environ, env, clear=True):
            commun.resumer("## A")


class TestBasculeSurPanneServeur(unittest.TestCase):
    """Une panne passagère (5xx) du principal doit mener au repli, pas perdre la marque."""

    LISTE = [{"nom": "Z.ai", "modele": "glm", "cle": "z"},
             {"nom": "Gemini", "modele": "g", "cle": "x"}]

    def tearDown(self):
        commun.oublier_dernier_appel()

    def lancer(self, codes):
        vus = []

        def faux(f, messages, *args, **kwargs):
            vus.append((f["nom"], kwargs.get("abandonner_sur")))
            code = codes.get(f["nom"])
            if code:
                raise commun.Echec("HTTP %s" % code, code)
            return "ok"

        with mock.patch.object(commun, "fournisseurs", return_value=self.LISTE), \
                mock.patch.object(commun, "_appeler", side_effect=faux):
            return commun.appeler("systeme", "utilisateur"), vus

    def test_les_pannes_serveur_font_basculer(self):
        for code in (500, 502, 503):
            self.assertIn(code, commun.BASCULE, "un %s doit passer au repli" % code)

    def test_503_sur_le_principal_passe_au_repli(self):
        texte, vus = self.lancer({"Z.ai": 503})
        self.assertEqual(texte, "ok")
        self.assertEqual([nom for nom, _ in vus], ["Z.ai", "Gemini"])
        self.assertIn(503, vus[0][1], "le principal abandonne sur place, sans réessai")
        self.assertEqual(vus[1][1], (), "le dernier fournisseur garde ses réessais")

    def test_502_sur_les_deux_laisse_un_echec_lisible(self):
        with self.assertRaises(commun.Echec) as ctx:
            self.lancer({"Z.ai": 502, "Gemini": 502})
        self.assertIn("Gemini", str(ctx.exception))
        self.assertEqual(ctx.exception.code, 502)


class TestBasculeSurErreurReseau(unittest.TestCase):
    """Un timeout ou une coupure réseau du principal doit mener au repli."""

    LISTE = [{"nom": "Z.ai", "modele": "glm", "cle": "z"},
             {"nom": "Gemini", "modele": "g", "cle": "x"}]

    def tearDown(self):
        commun.oublier_dernier_appel()

    def lancer(self, echecs):
        vus = []

        def faux(f, messages, *args, **kwargs):
            vus.append(f["nom"])
            if f["nom"] in echecs:
                raise echecs[f["nom"]]
            return "ok"

        with mock.patch.object(commun, "fournisseurs", return_value=self.LISTE), \
                mock.patch.object(commun, "_appeler", side_effect=faux):
            return commun.appeler("systeme", "utilisateur"), vus

    def test_un_timeout_sur_le_principal_passe_au_repli(self):
        texte, vus = self.lancer({"Z.ai": commun.Echec("timed out", None, reseau=True)})
        self.assertEqual(texte, "ok")
        self.assertEqual(vus, ["Z.ai", "Gemini"])

    def test_une_coupure_sur_les_deux_rend_un_echec_lisible(self):
        def panne():
            return commun.Echec("<urlopen error timed out>", None, reseau=True)

        with self.assertRaises(commun.Echec) as ctx:
            self.lancer({"Z.ai": panne(), "Gemini": panne()})
        self.assertIn("Gemini", str(ctx.exception))
        self.assertIsNone(ctx.exception.code, "un timeout n'a pas de statut HTTP")
        self.assertTrue(ctx.exception.reseau)

    def test_une_reponse_vide_ne_bascule_pas(self):
        # Un modèle qui répond du vide n'est pas une panne de transport : le
        # repli n'a pas à être sollicité pour ça.
        vide = commun.Echec("réponse vide (finish_reason=stop)", None)
        with self.assertRaises(commun.Echec):
            self.lancer({"Z.ai": vide})
        self.assertFalse(vide.reseau)

    def test_le_transport_marque_l_echec_comme_reseau(self):
        f = {"nom": "Z.ai", "base": "https://exemple.test", "modele": "m", "cle": "k"}
        with mock.patch.object(commun.urllib.request, "urlopen",
                               side_effect=urllib.error.URLError("timed out")):
            with self.assertRaises(commun.Echec) as ctx:
                commun._appeler(f, [{"role": "user", "content": "x"}], 0.3, 16, 1, False)
        self.assertTrue(ctx.exception.reseau)
        self.assertIsNone(ctx.exception.code)
        self.assertIn("timed out", str(ctx.exception))


class TestDiagnosticFournisseurs(unittest.TestCase):
    def lancer(self, liste, appels):
        def faux(f, messages, **kwargs):
            appels.append(f["nom"])
            if f["nom"] == "muet":
                raise commun.Echec("HTTP 429 : 1305", 429)
            return "ok"

        with mock.patch.object(commun, "fournisseurs", return_value=liste), \
                mock.patch.object(commun, "_appeler", side_effect=faux):
            return commun.diagnostic_fournisseurs()

    def test_un_muet_et_un_qui_repond(self):
        appels = []
        res = self.lancer([{"nom": "Z.ai", "modele": "glm", "cle": "z"},
                           {"nom": "muet", "modele": "g", "cle": "x"}], appels)
        self.assertEqual([r["ok"] for r in res], [True, False])
        self.assertIn("429", res[1]["detail"])
        self.assertGreaterEqual(res[1]["duree"], 0)

    def test_sans_cle_pas_d_appel(self):
        appels = []
        res = self.lancer([{"nom": "Z.ai", "modele": "glm", "cle": ""}], appels)
        self.assertEqual(appels, [])
        self.assertFalse(res[0]["ok"])
        self.assertIn("aucune clé", res[0]["detail"])


class TestFournisseurs(unittest.TestCase):
    """Lecture de `AI_API_KEY_BACKUP` : clés multiples, bases et modèles alignés.

    L'environnement est vidé pour chaque cas : un `AI_API_*` posé sur la
    machine qui lance les tests ne doit pas changer le résultat.
    """

    def lire(self, **env):
        with mock.patch.dict(os.environ, env, clear=True):
            return commun.fournisseurs(), commun.a_une_cle()

    def test_plusieurs_cles_alignent_base_et_modele(self):
        liste, une_cle = self.lire(
            AI_API_KEY="z-123",
            # Un secret collé avec des espaces autour des virgules reste lisible.
            AI_API_KEY_BACKUP=" g-1 ,  g-2 ",
            AI_API_BASE_BACKUP=("https://generativelanguage.googleapis.com/v1beta/openai,"
                                "https://api.groq.com/openai/v1"),
            AI_MODEL_BACKUP="gemini-3.8-flash,llama-4-scout",
        )
        self.assertTrue(une_cle)
        self.assertEqual([f["nom"] for f in liste], ["Z.ai", "Gemini", "Groq"])
        self.assertEqual([f["cle"] for f in liste], ["z-123", "g-1", "g-2"])
        self.assertEqual([f["base"] for f in liste][1:], [
            "https://generativelanguage.googleapis.com/v1beta/openai",
            "https://api.groq.com/openai/v1",
        ])
        self.assertEqual([f["modele"] for f in liste],
                         ["glm-4-flash", "gemini-3.8-flash", "llama-4-scout"])

    def test_une_seule_base_et_un_seul_modele_valent_pour_toutes_les_cles(self):
        liste, _ = self.lire(
            AI_API_KEY_BACKUP="g-1,g-2",
            AI_API_BASE_BACKUP="https://api.groq.com/openai/v1",
            AI_MODEL_BACKUP="llama-4-scout",
        )
        secours = liste[1:]
        self.assertEqual([f["base"] for f in secours], [
            "https://api.groq.com/openai/v1",
            "https://api.groq.com/openai/v1",
        ])
        self.assertEqual([f["modele"] for f in secours], ["llama-4-scout", "llama-4-scout"])

    def test_sans_base_ni_modele_le_secours_prend_gemini(self):
        liste, _ = self.lire(AI_API_KEY_BACKUP="g-1")
        self.assertEqual(liste[1]["base"], commun.BASE_REPLI)
        self.assertEqual(liste[1]["modele"], commun.MODELE_REPLI)
        self.assertEqual(liste[1]["nom"], "Gemini")

    def test_le_secours_seul_suffit(self):
        # Cas réel d'un dépôt qui n'a que la clé Gemini : les scripts ne doivent
        # pas se croire sans clé pour autant.
        liste, une_cle = self.lire(AI_API_KEY="", AI_API_KEY_BACKUP="g-1")
        self.assertTrue(une_cle)
        self.assertEqual(len(liste), 2)
        self.assertEqual(liste[0]["cle"], "", "le principal sans clé reste en tête")
        self.assertEqual(liste[1]["cle"], "g-1")

    def test_valeurs_vides_ignorees(self):
        liste, une_cle = self.lire(AI_API_KEY="   ", AI_API_KEY_BACKUP=" , ,")
        self.assertFalse(une_cle)
        self.assertEqual(len(liste), 1, "aucune clé de secours vide ne crée un fournisseur")
        self.assertEqual(liste[0]["nom"], "Z.ai")
