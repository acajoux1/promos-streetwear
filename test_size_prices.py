import json
import os
import tempfile
import unittest
from unittest.mock import patch

from size_prices import (
    aberrantes_bloquantes,
    collect_article_prices,
    deduplicate_entries,
    extract_from_html_page,
    extract_from_shopify_js,
    extract_variant_id,
    norm_size_key,
    parse_price,
    rapport_variantes_aberrantes,
    run_size_prices,
)


class TestGeneralSizePrices(unittest.TestCase):
    def test_parse_price_formats(self):
        self.assertEqual(parse_price("299,00 €"), 299.0)
        self.assertEqual(parse_price("1 989,00 €"), 1989.0)
        self.assertEqual(parse_price("59.5"), 59.5)
        self.assertEqual(parse_price(29900), 299.0)
        self.assertIsNone(parse_price(None))
        self.assertIsNone(parse_price(0))
        self.assertIsNone(parse_price("abc"))

    def test_norm_size_key_and_deduplication(self):
        self.assertEqual(norm_size_key("42 EU"), "42")
        self.assertEqual(norm_size_key("40.5"), "40.5")
        self.assertEqual(norm_size_key("medium"), "M")
        self.assertEqual(norm_size_key("UK 8.5"), "UK 8.5")

        entries = [
            {"taille": "42", "variant_id": "1", "prix": 250.0, "ancien_prix": 300.0, "disponible": True},
            {"taille": "42", "variant_id": "2", "prix": 199.0, "ancien_prix": 300.0, "disponible": True},
            {"taille": "43", "variant_id": "3", "prix": 220.0, "ancien_prix": None, "disponible": False},
        ]
        deduped = deduplicate_entries(entries)
        by_sz = {e["taille"]: e for e in deduped}
        self.assertEqual(len(deduped), 2)
        self.assertEqual(by_sz["42"]["prix"], 199.0)

    def test_extract_variant_id_and_html_price(self):
        url = "https://dimension-stores.com/products/fb9927-200?variant=53467188199752"
        self.assertEqual(extract_variant_id(url), "53467188199752")

        html = (
            '<meta property="product:price:amount" content="249.00">'
            '<script>{"id": 53467188199752, "price": "249.00"}</script>'
        )
        info = extract_from_html_page(html, target_variant_id="53467188199752")
        self.assertEqual(info["page_price"], 249.0)
        self.assertEqual(info["variant_prices"].get("53467188199752"), 249.0)

    def test_extract_from_shopify_js(self):
        payload = {
            "variants": [
                {"id": 101, "title": "41 EU", "price": "189.00", "compare_at_price": "220.00", "available": True},
                {"id": 102, "title": "42 EU", "price": "219.00", "compare_at_price": "220.00", "available": False},
            ]
        }
        res = extract_from_shopify_js(payload)
        self.assertEqual(len(res), 2)
        self.assertEqual(res[0]["taille"], "41")
        self.assertEqual(res[0]["prix"], 189.0)
        self.assertFalse(res[1]["disponible"])

    def test_collect_article_prices_with_mocks(self):
        item = {
            "lien": "https://dimension-stores.com/products/fb9927-200?variant=53467188199752",
            "nom": "Air Jordan 4 Retro SE Craft Olive",
            "marque": "Jordan",
            "boutique": "Dimension Stores",
            "prix": 299.0,
            "tailles": ["41", "42"],
        }
        fake_js = {
            "variants": [
                {"id": 53467188199751, "title": "41", "price": "230.00", "available": True},
                {"id": 53467188199752, "title": "42", "price": "299.00", "available": True},
            ]
        }
        fake_html = '<script>{"id": 53467188199752, "price": "259.00"}</script>'

        with patch("size_prices.fetch_json", return_value=fake_js), patch(
            "size_prices.fetch_text", return_value=fake_html
        ):
            rec = collect_article_prices(item, fetch_remote_shopify=True, delay=0)

        par_taille = {v["taille"]: v["prix"] for v in rec["variantes"]}
        self.assertEqual(par_taille, {"41": 230.0, "42": 259.0})
        self.assertEqual(rec["prix_min"], 230.0)
        self.assertEqual(rec["prix_max"], 259.0)

    def test_bornes_ignorent_variantes_indisponibles(self):
        item = {
            "lien": "https://shop-ex.test/products/item-3",
            "prix": 199.0,
            "tailles": ["43"],
        }
        fake_js = {
            "variants": [
                {"id": 201, "title": "41", "price": "19.00", "available": False},
                {"id": 202, "title": "42", "price": "3900.00", "available": False},
                {"id": 203, "title": "43", "price": "199.00", "available": True},
            ]
        }

        with patch("size_prices.fetch_json", return_value=fake_js):
            rec = collect_article_prices(item, fetch_remote_shopify=True, delay=0)

        self.assertEqual(rec["prix_min"], 199.0)
        self.assertEqual(rec["prix_max"], 199.0)

    def test_instantane_variantes_prix_par_taille(self):
        item = {
            "lien": "https://dimension-stores.com/products/dh3114-001",
            "prix": 149.0,
            "tailles": ["36", "39", "41", "44,5"],
        }
        snapshot = [
            {"taille": "36 / RECONDITIONNÉ / OM-1", "variant_id": "1", "prix": 149.0, "ancien_prix": 249.0, "disponible": True},
            {"taille": "39 / RECONDITIONNÉ / OM-2", "variant_id": "2", "prix": 199.0, "ancien_prix": 249.0, "disponible": True},
            {"taille": "41 / RECONDITIONNÉ / OM-3", "variant_id": "3", "prix": 189.0, "ancien_prix": 249.0, "disponible": True},
            {"taille": "41 / RECONDITIONNÉ / OM-4", "variant_id": "4", "prix": 159.0, "ancien_prix": 249.0, "disponible": True},
            {"taille": "44,5 / RECONDITIONNÉ / OM-5", "variant_id": "5", "prix": 179.0, "ancien_prix": 249.0, "disponible": False},
        ]

        rec = collect_article_prices(item, fetch_remote_shopify=False, delay=0, variantes=snapshot)

        # Une seule offre par taille et état, au prix le plus bas disponible.
        par_taille = {v["taille"]: v["prix"] for v in rec["variantes"]}
        self.assertEqual(par_taille, {"36 / RECONDITIONNÉ": 149.0,
                                      "39 / RECONDITIONNÉ": 199.0,
                                      "41 / RECONDITIONNÉ": 159.0})
        self.assertEqual(rec["prix_min"], 149.0)
        self.assertEqual(rec["prix_max"], 199.0)

    def test_ancien_prix_inferieur_ignore(self):
        entries = extract_from_shopify_js({"variants": [
            {"id": 1, "title": "43", "price": "799.00", "compare_at_price": "400.00", "available": True},
        ]})
        self.assertIsNone(entries[0]["ancien_prix"])

    def test_run_size_prices_end_to_end(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            in_path = os.path.join(tmpdir, "promos.json")
            out_path = os.path.join(tmpdir, "prix_tailles.json")

            sample = {
                "maj": "2026-11-19T23:00:00+04:00",
                "items": [
                    {
                        "lien": "https://shop-a.test/products/item-1",
                        "prix": 99.0,
                        "tailles": ["S", "M"],
                    },
                    {
                        "lien": "https://shop-b.test/item-2",
                        "prix": 149.0,
                        "prix_par_taille": {"L": 149.0, "XL": 169.0},
                    },
                ],
            }
            with open(in_path, "w", encoding="utf-8") as f:
                json.dump(sample, f)

            result = run_size_prices(
                input_path=in_path,
                output_path=out_path,
                fetch_remote_shopify=False,
                delay=0,
            )

            self.assertTrue(os.path.exists(out_path))
            self.assertEqual(result["total"], 2)
            self.assertIn("https://shop-a.test/products/item-1", result["by_link"])
            self.assertEqual(result["by_link"]["https://shop-b.test/item-2"]["prix_max"], 169.0)


class TestVariantesAberrantes(unittest.TestCase):
    def test_quelques_pieces_d_archive_ne_bloquent_pas(self):
        # 18 variantes au-dessus de 1 500 € sur 17 000 : la situation réelle.
        rapport = {"total": 18, "variantes": 17020}
        self.assertFalse(aberrantes_bloquantes(rapport))

    def test_un_parsing_casse_bloque(self):
        rapport = {"total": 4000, "variantes": 17000}
        self.assertTrue(aberrantes_bloquantes(rapport))

    def test_le_plancher_protege_un_petit_catalogue(self):
        self.assertFalse(aberrantes_bloquantes({"total": 49, "variantes": 10}))

    def test_rapport_compte_toutes_les_variantes(self):
        items = [{"lien": "https://shop.test/p/1", "boutique": "Shop"}]
        records = [{"lien": "https://shop.test/p/1", "variantes": [
            {"prix": 90.0}, {"prix": 1600.0}, {"prix": 2100.0},
        ]}]
        rapport = rapport_variantes_aberrantes(items, records)
        self.assertEqual(rapport["variantes"], 3)
        self.assertEqual(rapport["total"], 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
