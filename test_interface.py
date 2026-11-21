"""Vérification de non-régression de l'interface, dans un vrai navigateur.

Le test est ignoré si Playwright n'est pas installé (le workflow horaire ne
l'installe pas) ; en local :

    pip install playwright && python -m playwright install chromium
    python -m unittest test_interface
"""
import functools
import http.server
import os
import threading
import unittest

try:
    from playwright.sync_api import sync_playwright

    HAS_PW = True
except Exception:  # pragma: no cover - dépend de l'environnement
    HAS_PW = False

RACINE = os.path.dirname(os.path.abspath(__file__))


class _Silencieux(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@unittest.skipUnless(HAS_PW, "playwright absent : test d'interface ignoré")
class InterfaceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = http.server.ThreadingHTTPServer(
            ("127.0.0.1", 0), functools.partial(_Silencieux, directory=RACINE)
        )
        cls.port = cls.httpd.server_address[1]
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

        cls.pw = sync_playwright().start()
        cls.navigateur = cls.pw.chromium.launch()
        cls.page = cls.navigateur.new_page(viewport={"width": 1280, "height": 900})
        cls.erreurs = []
        cls.page.on("pageerror", lambda e: cls.erreurs.append(str(e)))
        cls.page.on(
            "console",
            lambda m: cls.erreurs.append(m.text) if m.type == "error" else None,
        )
        cls.page.goto(f"http://127.0.0.1:{cls.port}/index.html", wait_until="load")
        cls.page.wait_for_function(
            "() => document.querySelectorAll('#g .card:not(.sk)').length > 0",
            timeout=30000,
        )

    @classmethod
    def tearDownClass(cls):
        try:
            cls.navigateur.close()
            cls.pw.stop()
        finally:
            cls.httpd.shutdown()

    def test_01_grille_et_donnees(self):
        n = self.page.eval_on_selector_all("#g .card:not(.sk)", "els => els.length")
        self.assertGreater(n, 10)
        total = self.page.inner_text("#n")
        self.assertRegex(total, r"\d+ articles?")

    def test_02_pas_de_debordement(self):
        m = self.page.evaluate(
            "() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]"
        )
        self.assertEqual(m[0], m[1])

    def test_03_tiroir_et_fiche(self):
        self.page.click("#fBtn")
        self.page.wait_for_selector("#drawer.open")
        self.page.click("#profSec > summary")
        self.page.click("#drawer .dr-head .sh-x")
        self.page.wait_for_function("() => !document.querySelector('#drawer.open')")

        self.page.click("#g .card a")
        self.page.wait_for_selector("#sheet.open")
        self.assertTrue(self.page.is_visible("#szWrap"))
        self.page.keyboard.press("Escape")
        self.page.wait_for_function("() => !document.querySelector('#sheet.open')")

    def test_04_recherche_tolerante(self):
        champ = self.page.locator("#q")
        champ.fill("chaussures")
        self.page.wait_for_timeout(350)
        n1 = len(self.page.query_selector_all("#g .card"))
        champ.fill("sneakers")
        self.page.wait_for_timeout(350)
        n2 = len(self.page.query_selector_all("#g .card"))
        self.assertGreater(n1, 0)
        self.assertGreater(n2, 0)
        champ.fill("")
        self.page.wait_for_timeout(350)

    def test_05_lien_profond_et_erreurs(self):
        lien = self.page.eval_on_selector(
            "#g .card", "el => el.getAttribute('data-l')"
        )
        self.page.evaluate(
            "l => { location.hash = '#p=' + encodeURIComponent(l) }", lien
        )
        self.page.wait_for_selector("#sheet.open", timeout=10000)
        self.page.keyboard.press("Escape")
        self.assertEqual(self.erreurs, [])


if __name__ == "__main__":
    unittest.main()
