import json
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

USER_AGENT = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
)

LETTER_MAP = {
    "xxs": "XXS", "x-small": "XS", "xs": "XS", "extra small": "XS",
    "small": "S", "s": "S", "medium": "M", "m": "M", "large": "L", "l": "L",
    "x-large": "XL", "xl": "XL", "extra large": "XL", "xx-large": "XXL",
    "xxl": "XXL", "2xl": "XXL", "xxx-large": "XXXL", "xxxl": "XXXL", "3xl": "XXXL",
}


def _request(url: str, timeout: int = 15) -> str:
    req = Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json,text/html,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    })
    with urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def fetch_json(url: str, timeout: int = 15):
    return json.loads(_request(url, timeout))


def fetch_text(url: str, timeout: int = 15) -> str:
    return _request(url, timeout)


def parse_price(value):
    """Convertit un prix en euros; les entiers Shopify supérieurs à 5000 sont des centimes."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        num = float(value)
        if num > 5000 and float(num).is_integer():
            num /= 100
        return round(num, 2) if num > 0 else None
    text = str(value).strip()
    if not text:
        return None
    cleaned = re.sub(r"[^0-9,.-]", "", text)
    if not cleaned:
        return None
    if "," in cleaned and "." in cleaned:
        if cleaned.rfind(",") > cleaned.rfind("."):
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    try:
        num = float(cleaned)
        if num > 5000 and num.is_integer():
            num /= 100
        return round(num, 2) if num > 0 else None
    except ValueError:
        return None


def norm_size_key(label: str) -> str:
    raw = re.sub(r"\s*/\s*Default Title$", "", str(label or "").strip(), flags=re.I)
    if not raw:
        return "UNIQUE"
    low = re.sub(r"^(eu|fr)\s*", "", raw.lower()).strip()
    low = re.sub(r"\s*(eu|fr)$", "", low).strip()
    if low in LETTER_MAP:
        return LETTER_MAP[low]
    m = re.match(r"^(\d{2}(?:[.,]5)?)(?:\s*(1/3|2/3))?$", low)
    if m:
        return m.group(1).replace(",", ".") + (f" {m.group(2)}" if m.group(2) else "")
    u = re.match(r"^(uk|us)\s*(\d{1,2}(?:\.5)?)$", low)
    if u:
        return f"{u.group(1).upper()} {u.group(2)}"
    return raw.upper()


COND_RE = re.compile(r"(recond|refurb|neuf|new|occasion|used|seconde)", re.I)
PRIX_ABERRANT = 1500.0


def split_size_label(label):
    """Sépare un libellé composite ("42,5 / RECONDITIONNÉ / 105978") en taille + état."""
    raw = str(label or "").strip()
    if "/" not in raw:
        return raw, ""
    parts = [part.strip() for part in raw.split("/") if part.strip()]
    for index in range(1, len(parts)):
        if COND_RE.search(parts[index]):
            return "/".join(parts[:index]), parts[index]
    return raw, ""


def offer_size_key(label):
    base, _ = split_size_label(label)
    return norm_size_key(base)


def _size_sort_key(key: str):
    number = re.match(r"^(\d+(?:\.\d+)?)", key or "")
    if number:
        return (0, float(number.group(1)), key)
    letters = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"]
    if key in letters:
        return (1, letters.index(key), key)
    return (2, 0, key)


def build_size_index(payload: dict) -> dict:
    """Index léger consommé par l'interface : bornes et prix mini par taille."""
    by_link = {}
    for record in payload.get("articles") or []:
        if not isinstance(record, dict) or not record.get("lien"):
            continue
        prices = {}
        toutes = []
        for variant in record.get("variantes") or []:
            if not isinstance(variant, dict) or variant.get("disponible") is False:
                continue
            price = variant.get("prix")
            if not isinstance(price, (int, float)) or isinstance(price, bool) or price <= 0:
                continue
            value = round(float(price), 2)
            toutes.append(value)
            key = offer_size_key(variant.get("taille"))
            if not key:
                continue
            if key not in prices or value < prices[key]:
                prices[key] = value
        if not prices:
            for size, price in (record.get("prix_par_taille") or {}).items():
                if not isinstance(price, (int, float)) or isinstance(price, bool) or price <= 0:
                    continue
                key = offer_size_key(size)
                if key and (key not in prices or price < prices[key]):
                    prices[key] = round(float(price), 2)
        sizes = sorted(prices, key=_size_sort_key)
        minimum = min(toutes) if toutes else record.get("prix_min")
        maximum = max(toutes) if toutes else record.get("prix_max")
        by_link[record["lien"]] = {"min": minimum, "max": maximum,
                                   "t": sizes, "p": prices}
    return {"maj": payload.get("maj"), "total": len(by_link), "by_link": by_link}


def rapport_variantes_aberrantes(items, records, seuil=PRIX_ABERRANT):
    """Compte les variantes à prix invraisemblable pour repérer un parsing douteux."""
    boutique_de = {item.get("lien"): item.get("boutique", "?") for item in items
                   if isinstance(item, dict)}
    par_boutique = {}
    fiches = 0
    for record in records:
        count = 0
        for variant in record.get("variantes") or []:
            price = variant.get("prix")
            if isinstance(price, (int, float)) and not isinstance(price, bool) and price >= seuil:
                count += 1
        if count:
            fiches += 1
            boutique = boutique_de.get(record.get("lien"), "?")
            par_boutique[boutique] = par_boutique.get(boutique, 0) + count
    return {"seuil": seuil, "total": sum(par_boutique.values()),
            "fiches": fiches, "par_boutique": par_boutique}


def extract_variant_id(product_url: str):
    try:
        return parse_qs(urlparse(product_url).query).get("variant", [None])[0]
    except (TypeError, ValueError):
        return None


def shopify_product_json_url(product_url: str):
    parsed = urlparse(product_url)
    if not parsed.scheme or not parsed.netloc:
        return None
    path = parsed.path.rstrip("/")
    if "/products/" not in path:
        return None
    if not path.endswith(".js"):
        path += ".js"
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def extract_from_shopify_js(data: dict) -> list:
    entries = []
    for var in (data.get("variants") or []):
        if not isinstance(var, dict):
            continue
        label = (var.get("title") or var.get("option1") or "").strip()
        price = parse_price(var.get("price"))
        compare_at = parse_price(var.get("compare_at_price"))
        if price is not None:
            entries.append({
                "taille": norm_size_key(label),
                "variant_id": str(var.get("id")) if var.get("id") is not None else None,
                "prix": price,
                "ancien_prix": compare_at,
                "disponible": bool(var.get("available", True)),
            })
    return entries


def extract_from_html_page(html: str, target_variant_id=None) -> dict:
    """Lit le prix principal et les couples ID/prix présents dans les données HTML."""
    page_price = None
    variant_prices = {}
    for tag in re.findall(r"<meta\b[^>]*>", html or "", flags=re.I):
        prop = re.search(r"property\s*=\s*['\"]product:price:amount['\"]", tag, re.I)
        content = re.search(r"content\s*=\s*['\"]([^'\"]+)['\"]", tag, re.I)
        if prop and content:
            page_price = parse_price(content.group(1))
            break
    # Shopify et plusieurs thèmes exposent les variantes sous forme d'objets JSON.
    pattern = re.compile(
        r"[\{,]\s*['\"]id['\"]\s*:\s*['\"]?(\d+)['\"]?"
        r"[^{}]{0,700}?['\"]price['\"]\s*:\s*['\"]?([\d.,]+)", re.I | re.S
    )
    for match in pattern.finditer(html or ""):
        price = parse_price(match.group(2))
        if price is not None:
            variant_prices[match.group(1)] = price
    if target_variant_id is not None:
        target_variant_id = str(target_variant_id)
    return {"page_price": page_price, "variant_prices": variant_prices,
            "target_price": variant_prices.get(target_variant_id)}


def extract_from_generic_fields(item: dict) -> list:
    entries = []
    for key in ("variantes", "variants", "prix_tailles", "tailles_prix", "prix_par_taille", "sizes"):
        value = item.get(key)
        if isinstance(value, list):
            for entry in value:
                if not isinstance(entry, dict):
                    continue
                size = norm_size_key(entry.get("taille") or entry.get("size") or entry.get("title") or entry.get("option1"))
                price = parse_price(entry.get("prix") if entry.get("prix") is not None else entry.get("price"))
                old = parse_price(entry.get("ancien_prix") if entry.get("ancien_prix") is not None else entry.get("compare_at_price"))
                available = entry.get("disponible", entry.get("available", True))
                if price is not None:
                    entries.append({"taille": size, "prix": price, "ancien_prix": old, "disponible": bool(available)})
        elif isinstance(value, dict):
            for size, raw_price in value.items():
                price = parse_price(raw_price)
                if price is not None:
                    entries.append({"taille": norm_size_key(size), "prix": price,
                                    "ancien_prix": parse_price(item.get("ancien_prix")), "disponible": True})
    if entries:
        return entries
    base = parse_price(item.get("prix")) or parse_price(item.get("pmin")) or parse_price(item.get("prix_min"))
    old = parse_price(item.get("ancien_prix"))
    sizes = item.get("tailles") or []
    if isinstance(sizes, list) and sizes and base is not None:
        return [{"taille": norm_size_key(s), "prix": base, "ancien_prix": old, "disponible": True} for s in sizes]
    if base is not None:
        return [{"taille": "UNIQUE", "prix": base, "ancien_prix": old, "disponible": True}]
    return []


def deduplicate_entries(entries: list) -> list:
    by_size = {}
    for entry in entries:
        size = entry["taille"]
        current = by_size.get(size)
        if current is None or (entry.get("disponible", True) and not current.get("disponible", True)):
            by_size[size] = dict(entry)
        elif entry.get("disponible", True) == current.get("disponible", True) and entry["prix"] < current["prix"]:
            by_size[size] = dict(entry)
    return list(by_size.values())


def collect_article_prices(item: dict, fetch_remote_shopify: bool = True, delay: float = 0.12) -> dict:
    link = item.get("lien") or ""
    entries = extract_from_generic_fields(item)
    target_id = extract_variant_id(link)
    if fetch_remote_shopify and "/products/" in link:
        js_url = shopify_product_json_url(link)
        if js_url:
            try:
                remote = extract_from_shopify_js(fetch_json(js_url))
                if remote:
                    entries = remote
                if delay > 0:
                    time.sleep(delay)
            except (URLError, HTTPError, TimeoutError, ValueError, json.JSONDecodeError):
                pass
    entries = deduplicate_entries(entries)
    target_price = None
    if fetch_remote_shopify and target_id and "/products/" in link:
        try:
            html_info = extract_from_html_page(fetch_text(link), target_id)
            target_price = html_info.get("target_price")
            if target_price is None:
                target_price = html_info.get("page_price")
            if target_price is not None:
                matching = next((e for e in entries if e.get("variant_id") == str(target_id)), None)
                if matching:
                    matching["prix"] = target_price
                elif len(entries) == 1:
                    entries[0]["prix"] = target_price
            if delay > 0:
                time.sleep(delay)
        except (URLError, HTTPError, TimeoutError, ValueError, json.JSONDecodeError):
            pass
    entries = deduplicate_entries(entries)
    prices = [e["prix"] for e in entries
              if isinstance(e.get("prix"), (int, float)) and e.get("disponible", True)]
    if not prices:
        prices = [e["prix"] for e in entries if isinstance(e.get("prix"), (int, float))]
    fallback = parse_price(item.get("prix"))
    prices = prices or ([fallback] if fallback is not None else [])
    return {
        "lien": link,
        "variant_cible": str(target_id) if target_id else None,
        "prix_min": min(prices) if prices else None,
        "prix_max": max(prices) if prices else None,
        "tailles": [e["taille"] for e in entries if e.get("disponible", True)],
        "prix_par_taille": {e["taille"]: e["prix"] for e in entries},
        "variantes": entries,
    }


def run_size_prices(input_path: str = "data/promos.json", output_path: str = "data/prix_tailles.json",
                    fetch_remote_shopify: bool = True, delay: float = 0.12,
                    index_path: str = None) -> dict:
    with open(input_path, "r", encoding="utf-8") as source_file:
        source = json.load(source_file)
    items = source.get("items") if isinstance(source, dict) and "items" in source else source
    if not isinstance(items, list):
        items = []
    records = [collect_article_prices(item, fetch_remote_shopify, delay)
               for item in items if isinstance(item, dict)]
    by_link = {record["lien"]: record for record in records if record["lien"]}
    payload = {"maj": source.get("maj") if isinstance(source, dict) else None,
               "total": len(records), "by_link": by_link, "articles": records}
    with open(output_path, "w", encoding="utf-8") as output_file:
        json.dump(payload, output_file, ensure_ascii=False, indent=2)
    if index_path:
        index = build_size_index(payload)
        with open(index_path, "w", encoding="utf-8") as index_file:
            json.dump(index, index_file, ensure_ascii=False, separators=(",", ":"))
    rapport = rapport_variantes_aberrantes(items, records)
    print("Variantes à prix aberrant (>= {:.0f} €) : {} sur {} fiche(s)".format(
        rapport["seuil"], rapport["total"], rapport["fiches"]))
    for boutique, count in sorted(rapport["par_boutique"].items(), key=lambda kv: -kv[1]):
        print("  - {} : {}".format(boutique, count))
    return payload


def main():
    if "--index-seulement" in sys.argv:
        with open("data/prix_tailles.json", encoding="utf-8") as source:
            payload = json.load(source)
        index = build_size_index(payload)
        with open("data/tailles_index.json", "w", encoding="utf-8") as target:
            json.dump(index, target, ensure_ascii=False, separators=(",", ":"))
        print("Index régénéré :", index["total"], "fiches")
        return
    run_size_prices(index_path="data/tailles_index.json")


if __name__ == "__main__":
    main()
