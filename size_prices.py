import json
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

USER_AGENT = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
)

LETTER_MAP = {
    "xxs": "XXS",
    "x-small": "XS",
    "xs": "XS",
    "extra small": "XS",
    "small": "S",
    "s": "S",
    "medium": "M",
    "m": "M",
    "large": "L",
    "l": "L",
    "x-large": "XL",
    "xl": "XL",
    "extra large": "XL",
    "xx-large": "XXL",
    "xxl": "XXL",
    "2xl": "XXL",
    "xxx-large": "XXXL",
    "xxxl": "XXXL",
    "3xl": "XXXL",
}


def fetch_json(url: str, timeout: int = 15):
    req = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json,text/html,*/*;q=0.8",
            "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        },
    )
    with urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
        return json.loads(raw)


def parse_price(value):
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        num = float(value)
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
        return round(num, 2) if num > 0 else None
    except ValueError:
        return None


def norm_size_key(label: str) -> str:
    raw = re.sub(r"\s*/\s*Default Title$", "", str(label or "").strip(), flags=re.I)
    if not raw:
        return "UNIQUE"
    low = re.sub(r"^(eu|fr)\s*", "", raw.lower()).strip()
    if low in LETTER_MAP:
        return LETTER_MAP[low]
    m = re.match(r"^(\d{2}(?:[.,]5)?)(?:\s*(1/3|2/3))?$", low)
    if m:
        return m.group(1).replace(",", ".") + (f" {m.group(2)}" if m.group(2) else "")
    u = re.match(r"^(uk|us)\s*(\d{1,2}(?:\.5)?)$", low)
    if u:
        return f"{u.group(1).upper()} {u.group(2)}"
    return raw.upper()


def shopify_product_json_url(product_url: str):
    parsed = urlparse(product_url)
    if not parsed.scheme or not parsed.netloc:
        return None
    path = parsed.path.split("?")[0].rstrip("/")
    if "/products/" not in path:
        return None
    if not path.endswith(".js"):
        path = f"{path}.js"
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def extract_from_shopify_js(data: dict) -> list:
    entries = []
    for var in (data.get("variants") or []):
        if not isinstance(var, dict):
            continue
        raw_label = (var.get("title") or var.get("option1") or "").strip()
        size = norm_size_key(raw_label)
        price = parse_price(var.get("price"))
        if price is not None and price > 5000 and str(var.get("price", "")).isdigit():
            price = round(price / 100.0, 2)
        compare_at = parse_price(var.get("compare_at_price"))
        if compare_at is not None and compare_at > 5000 and str(var.get("compare_at_price", "")).isdigit():
            compare_at = round(compare_at / 100.0, 2)
        if price is not None:
            entries.append({
                "taille": size,
                "prix": price,
                "ancien_prix": compare_at,
                "disponible": bool(var.get("available", True)),
            })
    return entries


def extract_from_generic_fields(item: dict) -> list:
    entries = []
    for key in ("variantes", "variants", "prix_tailles", "tailles_prix", "prix_par_taille", "sizes"):
        val = item.get(key)
        if isinstance(val, list):
            for entry in val:
                if not isinstance(entry, dict):
                    continue
                size = norm_size_key(
                    entry.get("taille") or entry.get("size") or entry.get("title") or entry.get("option1")
                )
                price = parse_price(
                    entry.get("prix") if entry.get("prix") is not None else entry.get("price")
                )
                compare_at = parse_price(
                    entry.get("ancien_prix")
                    if entry.get("ancien_prix") is not None
                    else entry.get("compare_at_price")
                )
                avail = entry.get("disponible")
                if avail is None:
                    avail = entry.get("available", True)
                if price is not None:
                    entries.append({
                        "taille": size,
                        "prix": price,
                        "ancien_prix": compare_at,
                        "disponible": bool(avail),
                    })
        elif isinstance(val, dict):
            for k, v in val.items():
                price = parse_price(v)
                if price is not None:
                    entries.append({
                        "taille": norm_size_key(str(k)),
                        "prix": price,
                        "ancien_prix": parse_price(item.get("ancien_prix")),
                        "disponible": True,
                    })

    if entries:
        return entries

    base_price = (
        parse_price(item.get("prix"))
        or parse_price(item.get("pmin"))
        or parse_price(item.get("prix_min"))
    )
    old_price = parse_price(item.get("ancien_prix"))
    sizes = item.get("tailles") or []
    if isinstance(sizes, list) and sizes and base_price is not None:
        for s in sizes:
            entries.append({
                "taille": norm_size_key(str(s)),
                "prix": base_price,
                "ancien_prix": old_price,
                "disponible": True,
            })
    elif base_price is not None:
        entries.append({
            "taille": "UNIQUE",
            "prix": base_price,
            "ancien_prix": old_price,
            "disponible": True,
        })
    return entries


def deduplicate_entries(entries: list) -> list:
    by_sz = {}
    for e in entries:
        t = e["taille"]
        if t not in by_sz:
            by_sz[t] = dict(e)
        else:
            cur = by_sz[t]
            if e["disponible"] and not cur["disponible"]:
                by_sz[t] = dict(e)
            elif e["disponible"] == cur["disponible"] and e["prix"] < cur["prix"]:
                by_sz[t] = dict(e)
    return list(by_sz.values())


def collect_article_prices(item: dict, fetch_remote_shopify: bool = True, delay: float = 0.12) -> dict:
    lien = item.get("lien") or ""
    entries = extract_from_generic_fields(item)

    if fetch_remote_shopify and "/products/" in lien:
        js_url = shopify_product_json_url(lien)
        if js_url:
            try:
                shopify_data = fetch_json(js_url)
                remote_entries = extract_from_shopify_js(shopify_data)
                if remote_entries:
                    entries = remote_entries
                if delay > 0:
                    time.sleep(delay)
            except (URLError, HTTPError, TimeoutError, ValueError, json.JSONDecodeError):
                pass

    unique_entries = deduplicate_entries(entries)
    prices = [e["prix"] for e in unique_entries if isinstance(e.get("prix"), (int, float))]
    prix_min = min(prices) if prices else parse_price(item.get("prix"))
    prix_max = max(prices) if prices else parse_price(item.get("prix"))

    prix_par_taille = {e["taille"]: e["prix"] for e in unique_entries}
    tailles_dispo = [e["taille"] for e in unique_entries if e.get("disponible", True)]

    return {
        "lien": lien,
        "prix_min": prix_min,
        "prix_max": prix_max,
        "tailles": tailles_dispo,
        "prix_par_taille": prix_par_taille,
        "variantes": unique_entries,
    }


def run_size_prices(
    input_path: str = "data/promos.json",
    output_path: str = "data/prix_tailles.json",
    fetch_remote_shopify: bool = True,
    delay: float = 0.12,
) -> dict:
    with open(input_path, "r", encoding="utf-8") as f:
        source = json.load(f)

    items = source.get("items") if isinstance(source, dict) and "items" in source else source
    if not isinstance(items, list):
        items = []

    by_link = {}
    articles = []
    for item in items:
        if not isinstance(item, dict):
            continue
        rec = collect_article_prices(item, fetch_remote_shopify=fetch_remote_shopify, delay=delay)
        articles.append(rec)
        if rec["lien"]:
            by_link[rec["lien"]] = rec

    payload = {
        "maj": source.get("maj") if isinstance(source, dict) else None,
        "total": len(articles),
        "by_link": by_link,
        "articles": articles,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return payload


if __name__ == "__main__":
    run_size_prices()
