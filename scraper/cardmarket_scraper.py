#!/usr/bin/env python3
"""
Scraper Cardmarket — Weiss Schwarz Mushoku Tensei: Jobless Reincarnation
========================================================================

Extrait : nom, rareté, URL de l'image HD, prix trend (€) de chaque carte
de l'extension, et écrit un JSON compatible avec le gacha simulator
(data/cards.json).

Stratégie anti-Cloudflare :
  1. curl_cffi (impersonate="chrome") : TLS fingerprint d'un vrai Chrome.
  2. Fallback optionnel : undetected-chromedriver (Chrome piloté, très dur à bloquer).

Usage :
  pip install "curl_cffi[impersonate]" lxml
  python scraper/cardmarket_scraper.py --out data/cards.json --max-pages 3
  python scraper/cardmarket_scraper.py --engine uc --out data/cards.json

⚠️  Limites : les prix Cardmarket fluctuent, et le HTML peut évoluer.
    Vérifie data/cards.json après exécution (nb de cartes, cohérence prix).
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from curl_cffi import requests as crequests

try:
    from lxml import html as lxml_html  # type: ignore
except ImportError:  # lxml optionnel mais recommandé
    lxml_html = None

BASE_URL = "https://www.cardmarket.com"
PRODUCT_URL = (
    BASE_URL
    + "/en/WeissSchwarz/Products/Singles/Mushoku-Tensei-Jobless-Reincarnation"
)
PARAMS = {
    "searchMode": "v2",
    "idCategory": "1040",
    "idExpansion": "4983",
    "idRarity": "0",
    "sortBy": "price_desc",
    "perSite": "30",
}

# En-têtes standards (curl_cffi gère déjà le TLS, on reste cohérent)
HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
    "Cache-Control": "no-cache",
    "Referer": BASE_URL,
}

UA_CHROME = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

# Raretés Weiss Schwarz connues (triées du plus commun au plus rare)
KNOWN_RARITIES = [
    "C", "U", "R", "RR", "RRR", "SR", "SFR", "SEC", "SSP", "SP", "TD", "P",
]

PRICE_RE = re.compile(r"(\d+[.,]\d{1,2})")


@dataclass
class Card:
    name: str
    rarity: str
    image_url: str
    price_trend: float

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "rarity": self.rarity,
            "imageUrl": self.image_url,
            "priceTrend": self.price_trend,
        }


# ---------------------------------------------------------------------------
# Récupération HTML
# ---------------------------------------------------------------------------

def fetch_page(session, url: str, engine: str = "curl", tries: int = 3) -> str | None:
    """Récupère une page en contournant Cloudflare, avec retries exponentiels."""
    for attempt in range(1, tries + 1):
        try:
            if engine == "curl":
                resp = session.get(
                    url,
                    params=PARAMS if "Products/Singles" in url else None,
                    headers=HEADERS,
                    timeout=30,
                )
            else:  # uc
                resp = session.get(url, timeout=30)  # type: ignore[union-attr]
            if resp.status_code == 200 and len(resp.text) > 5000:
                return resp.text
            print(f"  ⚠️  HTTP {resp.status_code} (tentative {attempt}/{tries})")
        except Exception as exc:  # noqa: BLE001
            print(f"  ⚠️  Erreur : {exc} (tentative {attempt}/{tries})")
        time.sleep(2 * attempt + random.uniform(0.5, 1.5))
    return None


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def parse_price(text: str) -> float | None:
    """'12,45 €' / '0.05 €' -> 12.45 / 0.05"""
    if not text:
        return None
    m = PRICE_RE.search(text.replace("\xa0", " "))
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", "."))
    except ValueError:
        return None


def parse_rows_html(tree) -> Iterable[Card]:
    """Parse les lignes du tableau produit Cardmarket (mode HTML + lxml)."""
    # Chaque ligne produit contient un lien vers la page single
    rows = tree.xpath(
        '//div[contains(@class,"table-body")]//div'
        '[contains(@class,"row") or contains(@class,"product")]'
    )
    for row in rows:
        # Nom + lien
        name_nodes = row.xpath('.//a[contains(@href,"/Products/Singles/")]/span/text()')
        href_nodes = row.xpath('.//a[contains(@href,"/Products/Singles/")]/@href')
        if not name_nodes or not href_nodes:
            continue
        name = name_nodes[0].strip()
        url = BASE_URL + href_nodes[0]

        # Rareté : colonne "Rarity" ou extension dans le lien
        rar_nodes = row.xpath(
            './/span[contains(@class,"rarity")]/text() | '
            './/div[contains(@class,"col-rarity")]//text()'
        )
        rarity = ""
        for cand in (r.strip() for cand in rar_nodes for r in cand.split()):
            if cand in KNOWN_RARITIES:
                rarity = cand
                break

        # Prix trend : dernière cellule "Trend price"
        price_nodes = row.xpath(
            './/span[contains(@class,"price") or contains(@class,"trend")]//text()'
        )
        price = None
        for cand in price_nodes:
            price = parse_price(cand)
            if price is not None:
                break

        # Image HD
        img_nodes = row.xpath('.//img/@src | .//img/@data-src')
        image = ""
        for src in img_nodes:
            if "item-images" in str(src) or "covers" in str(src):
                image = str(src)
                if image.startswith("//"):
                    image = "https:" + image
                break

        if name and price is not None:
            yield Card(name=name, rarity=rarity, image_url=image, price_trend=price)


def parse_rows_json(script_text: str) -> Iterable[Card]:
    """Fallback : si le rendu est côté client, tenter d'extraire du JSON inline."""
    # Cardmarket sérialise parfois les données produit dans un script JSON.
    for m in re.finditer(r'"productName"\s*:\s*"([^"]+)"', script_text):
        name = m.group(1)
        # Cherche prix et rareté proches
        window = script_text[m.start(): m.start() + 800]
        price_m = PRICE_RE.search(window)
        rar_m = re.search(r'"rarity"\s*:\s*"([^"]+)"', window)
        img_m = re.search(r'"image"\s*:\s*"([^"]+)"', window)
        yield Card(
            name=name,
            rarity=rar_m.group(1) if rar_m else "",
            image_url=img_m.group(1) if img_m else "",
            price_trend=float(price_m.group(1).replace(",", ".")) if price_m else 0.0,
        )


# ---------------------------------------------------------------------------
# Fallback undetected-chromedriver
# ---------------------------------------------------------------------------

def make_uc_session():
    import undetected_chromedriver as uc  # type: ignore

    options = uc.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-gpu")
    options.add_argument(f"--user-agent={UA_CHROME}")
    driver = uc.Chrome(options=options)

    class UCDriverSession:
        """Mini-adapteur exposant .get(url) -> réponse avec .text/.status_code."""

        def get(self, url: str, timeout: int = 30):
            driver.get(url)
            time.sleep(2.5)  # laisser le JS rendre le tableau
            class _Resp:
                status_code = 200
                text = driver.page_source
            return _Resp()

        def close(self):
            driver.quit()

    return UCDriverSession()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Scraper Cardmarket Mushoku Tensei WS")
    ap.add_argument("--out", default="data/cards.json")
    ap.add_argument("--max-pages", type=int, default=0, help="0 = toutes les pages")
    ap.add_argument("--engine", choices=["curl", "uc"], default="curl")
    ap.add_argument("--delay-min", type=float, default=1.5)
    ap.add_argument("--delay-max", type=float, default=3.5)
    args = ap.parse_args()

    session = None
    try:
        if args.engine == "curl":
            session = crequests.Session(impersonate="chrome")
        else:
            session = make_uc_session()
    except Exception as exc:  # noqa: BLE001
        print(f"❌ Impossible de créer la session ({args.engine}) : {exc}")
        return 1

    cards: dict[str, Card] = {}
    page = 1
    while True:
        url = PRODUCT_URL
        if page > 1:
            url = f"{PRODUCT_URL}?searchMode=v2&idCategory=1040&idExpansion=4983&idRarity=0&sortBy=price_desc&perSite=30&page={page}"
        print(f"📄 Page {page} …")
        html_text = fetch_page(session, url, engine=args.engine)
        if not html_text:
            print("  ⛔ Page inaccessible, arrêt de la pagination.")
            break

        found: list[Card] = []
        if lxml_html is not None:
            tree = lxml_html.fromstring(html_text)
            found = list(parse_rows_html(tree))
        if not found:
            found = list(parse_rows_json(html_text))

        if not found:
            print("  ⛔ Aucune carte détectée (structure HTML changée ?).")
            break

        new = 0
        for card in found:
            key = card.name.lower()
            if key not in cards:
                cards[key] = card
                new += 1
        print(f"  ✅ {new} nouvelles cartes (total {len(cards)})")

        if args.max_pages and page >= args.max_pages:
            break
        if new == 0:
            break  # page répétée = fin de pagination
        page += 1
        time.sleep(random.uniform(args.delay_min, args.delay_max))

    try:
        session.close()
    except Exception:  # noqa: BLE001
        pass

    if not cards:
        print("❌ Aucune carte extraite. Vérifie la connectivité / le HTML.")
        return 1

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "set": "Mushoku Tensei: Jobless Reincarnation",
        "game": "Weiss Schwarz",
        "source": "Cardmarket",
        "scrapedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
        "cards": [c.to_dict() for c in sorted(cards.values(), key=lambda c: -c.price_trend)],
    }
    out_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"💾 {len(cards)} cartes écrites dans {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
