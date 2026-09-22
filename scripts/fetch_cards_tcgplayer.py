#!/usr/bin/env python3
"""
Génère public/data/cards.json depuis l'API TCGCSV (miroir JSON de TCGplayer).

Avantages vs scraping Cardmarket :
  - API JSON publique, sans anti-bot, sans scraping HTML fragile.
  - Images HD servies par le CDN TCGplayer (pas de protection).

Sortie : public/data/cards.json (compatible avec le simulateur).

Usage :
  python scripts/fetch_cards_tcgplayer.py
"""

from __future__ import annotations

import json
import sys
import time
import urllib.request
from pathlib import Path

CATEGORY_ID = 20          # Weiss Schwarz
GROUP_ID = 2979           # Mushoku Tensei: Jobless Reincarnation
BASE = "https://tcgcsv.com/tcgplayer"
# CDN sans anti-hotlink, tailles testées : 437x437 (~34 Ko) et 874x874 (~106 Ko)
IMG_CDN = "https://product-images.tcgplayer.com/fit-in/874x874/{pid}.jpg"

# TCGplayer -> codes Weiss Schwarz officiels
RARITY_MAP = {
    "Common": "C",
    "Climax Common": "CC",
    "Uncommon": "U",
    "Rare": "R",
    "Climax Rare": "CR",
    "Double Rare": "RR",
    "Triple Rare": "RRR",
    "Super Rare": "SR",
    "Special Rare": "SP",
    "Super Special Rare": "SSP",
    "Promo": "PR",
    "Trial Deck": "TD",
}

# Seuils de l'algorithme de tirage (< 0.5 C, < 5 U, < 25 SR, >= 25 UR)
TIER_C_MAX = 0.5
TIER_U_MAX = 5.0
TIER_SR_MAX = 25.0


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (gacha-sim)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status} pour {url}")
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print(f"⏳ Récupération products… ({BASE}/{CATEGORY_ID}/{GROUP_ID}/products)")
    products = fetch_json(f"{BASE}/{CATEGORY_ID}/{GROUP_ID}/products")
    print(f"⏳ Récupération prices…   ({BASE}/{CATEGORY_ID}/{GROUP_ID}/prices)")
    prices = fetch_json(f"{BASE}/{CATEGORY_ID}/{GROUP_ID}/prices")

    price_by_pid: dict[int, float] = {}
    for row in prices.get("results", []):
        market = row.get("marketPrice")
        if market is None:
            continue
        pid = row["productId"]
        # garde le prix "Normal" si présent, sinon le plus élevé vu (foil/RRR)
        if pid not in price_by_pid or row.get("subTypeName") == "Normal":
            price_by_pid[pid] = float(market)

    cards: list[dict] = []
    skipped_no_image = 0
    skipped_sealed = 0
    for prod in products.get("results", []):
        # Ignorer les produits scellés (booster packs / boxes / decks)
        ed = prod.get("extendedData") or []
        rarity_full = next((e.get("value", "") for e in ed if e.get("name") == "Rarity"), "")
        if not rarity_full:
            skipped_sealed += 1
            continue
        pid = prod["productId"]
        code = RARITY_MAP.get(rarity_full)
        if code is None:
            print(f"  ⚠️  Rareté inconnue ignorée : {rarity_full!r} ({prod['cleanName']})")
            continue
        price = price_by_pid.get(pid, 0.0)
        cards.append({
            "name": prod["cleanName"],
            "rarity": code,
            "imageUrl": IMG_CDN.format(pid=pid),
            "priceTrend": round(price, 2),
            "productId": pid,
        })

    cards.sort(key=lambda c: -c["priceTrend"])

    # Statistiques de tiers (pour l'algorithme de tirage)
    def tier_of(p: float) -> str:
        if p < TIER_C_MAX: return "Common"
        if p < TIER_U_MAX: return "Uncommon"
        if p < TIER_SR_MAX: return "SuperRare"
        return "UltraRare"

    tiers = {"Common": 0, "Uncommon": 0, "SuperRare": 0, "UltraRare": 0}
    for c in cards:
        tiers[tier_of(c["priceTrend"])] += 1

    payload = {
        "set": "Mushoku Tensei: Jobless Reincarnation",
        "game": "Weiss Schwarz",
        "source": "TCGplayer via TCGCSV (prix market USD->€ approx. 1:1)",
        "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
        "groupId": GROUP_ID,
        "stats": {
            "total": len(cards),
            "tiers": tiers,
            "skippedNoRarity": skipped_sealed,
            "skippedUnknownRarity": 0,
        },
        "cards": cards,
    }

    out = Path("public/data/cards.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"💾 {len(cards)} cartes écrites dans {out}")
    print(f"   Tiers : {tiers}")
    print(f"   Scellés ignorés (pas de rareté) : {skipped_sealed}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
