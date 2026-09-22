#!/usr/bin/env python3
"""
Récupère les cartes UNION ARENA "Mushoku Tensei: Jobless Reincarnation" [UA54BT]
depuis la cardlist officielle unionarena-tcg.com (images HD PNG officielles),
avec fallback de prix TCGplayer (TCGCSV) si le set y est indexé.

Sortie : public/data/cards.json (compatible simulateur).

Usage :
  python scripts/fetch_unionarena.py
"""

from __future__ import annotations

import html as htmllib
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

SERIES_URL = "https://www.unionarena-tcg.com/en/cardlist/?search=true&series=589154"
DETAIL_URL = "https://www.unionarena-tcg.com/en/cardlist/detail_iframe.php?card_no={card_no}"
IMG_BASE = "https://www.unionarena-tcg.com/en/images/cardlist/card/{img}.png?v5"

# Prix TCGplayer (peut être absent si le set n'est pas encore indexé)
TCGCSV_UA_BASE = "https://tcgcsv.com/tcgplayer/81"

UA = {"User-Agent": "Mozilla/5.0 (gacha-sim; contact: local)"}


def http_get(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status} pour {url}")
        return resp.read().decode("utf-8", errors="replace")


def strip_tags(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    s = htmllib.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


# ---------------------------------------------------------------------------
# 1) Cardlist officielle : numéros + noms + images
# ---------------------------------------------------------------------------

def fetch_series() -> list[dict]:
    html = http_get(SERIES_URL)
    # Blocs : <a ... href="...card_no=UA54BT/MST-1-001"> <img ... data-src=".../UA54BT_MST-1-001.png" alt="UA54BT/MST-1-001 Eris">
    blocks = re.findall(
        r'href="\./detail_iframe\.php\?card_no=([^"]+)".*?'
        r'data-src="[^"]*/([^/"]+\.png)[^"]*"\s+alt="([^"]*)"',
        html,
        flags=re.S,
    )
    cards: list[dict] = []
    seen: set[str] = set()
    for card_no, img, alt in blocks:
        card_no = card_no.strip()
        if card_no in seen:
            continue
        seen.add(card_no)
        # alt = "UA54BT/MST-1-001 Eris" (parfois sans le suffixe _p1 du card_no)
        # -> on retire uniquement le préfixe numéro, jamais le début du nom.
        name = re.sub(r"^UA54BT/MST-1-[A-Za-z0-9_]+\s*", "", alt).strip()
        if name.lower().startswith("action point card"):
            name = "Action Point Card"
        cards.append({"cardNo": card_no, "imageFile": img, "name": name})
    return cards


# ---------------------------------------------------------------------------
# 2) Détails par carte : rareté (+ fallback nom, BP)
# ---------------------------------------------------------------------------

RARITY_RE = re.compile(
    r"(UA54BT/MST-1-[A-Za-z0-9_]+)\s+([A-Z]{1,3})(?:\s+Parallel)?\s+card\s+Title",
)

def fetch_detail(card_no: str) -> dict:
    html = http_get(DETAIL_URL.format(card_no=card_no))
    text = strip_tags(html)

    # Rareté : après le numéro "UA54BT/MST-1-001 C card Title"
    m = RARITY_RE.search(text.replace("Parallel", " Parallel "))
    rarity = m.group(2) if m else ""

    if not rarity:
        # Fallback : "… MST-1-001 C card" entre numéro et "card Title"
        m2 = re.search(r"MST-1-[A-Za-z0-9_]+\s+([A-Z]{1,3})\s+card\b", text)
        rarity = m2.group(1) if m2 else "C"

    # Nom : fallback depuis le title de page "… - <Name> | CARDLIST"
    name = ""
    mt = re.search(r"<title>[^<]*-\s*([^|<]+?)\s*</title>", html, flags=re.I)
    if mt:
        name = mt.group(1).strip()
    if not name or name.lower() == "cardlist":
        mt2 = re.search(r"MST-1-[A-Za-z0-9_]+\s+[A-Z]{1,3}\s*card\s+Title\s*(.*?)\s*Required Energy", text)
        name = mt2.group(1).strip() if mt2 else ""

    # BP éventuel
    bp = ""
    mbp = re.search(r"\bBP\s*(\d{3,4})\b", text)
    if mbp:
        bp = mbp.group(1)

    return {"rarity": rarity, "name": name, "bp": bp}


# ---------------------------------------------------------------------------
# 3) Prix TCGplayer via TCGCSV (catégorie Union Arena = 81) - optionnel
# ---------------------------------------------------------------------------

def try_tcgplayer_prices() -> dict[str, float]:
    # Le set UA54BT n'est pas (encore) indexé : on balaie tous les groupes UA
    try:
        groups = json.loads(http_get(f"{TCGCSV_UA_BASE}/groups"))
    except Exception as exc:  # noqa: BLE001
        print(f"  ⚠️  TCGCSV inaccessible ({exc}) — prix à 0")
        return {}

    price_by_name: dict[str, float] = {}
    target_groups = [
        g["groupId"] for g in groups.get("results", [])
        if "mushoku" in g.get("name", "").lower() or "UA54" in g.get("name", "")
    ]
    if not target_groups:
        print("  ℹ️  Set UA54BT absent de TCGplayer — les prix resteront à 0 (estimation par rareté utilisée par le simulateur)")
        return {}

    for gid in target_groups:
        try:
            prods = json.loads(http_get(f"{TCGCSV_UA_BASE}/{gid}/products")).get("results", [])
            prices = json.loads(http_get(f"{TCGCSV_UA_BASE}/{gid}/prices")).get("results", [])
        except Exception:  # noqa: BLE001
            continue
        pid_price: dict[int, float] = {}
        for row in prices:
            mk = row.get("marketPrice")
            if mk is None:
                continue
            pid = row["productId"]
            if pid not in pid_price or row.get("subTypeName") == "Normal":
                pid_price[pid] = float(mk)
        for prod in prods:
            name = prod.get("cleanName") or prod.get("name") or ""
            mk = pid_price.get(prod["productId"], 0.0)
            if name:
                price_by_name[name.lower()] = max(price_by_name.get(name.lower(), 0.0), mk)
    return price_by_name


# ---------------------------------------------------------------------------
# Estimation de prix par rareté si TCGplayer ne référence pas le set
# ---------------------------------------------------------------------------

ESTIMATE_EUR = {
    "C": 0.10, "U": 0.35, "R": 1.50, "SR": 8.00,
    "AP": 3.00, "SRP": 28.00, "RP": 6.00, "UP": 1.50, "CP": 0.50,
}


def main() -> int:
    print("⏳ Cardlist officielle UNION ARENA…")
    cards = fetch_series()
    print(f"   {len(cards)} cartes détectées")

    price_by_name = try_tcgplayer_prices()

    out_cards: list[dict] = []
    for i, c in enumerate(cards):
        details = {"rarity": "", "name": "", "bp": ""}
        try:
            details = fetch_detail(c["cardNo"])
        except Exception as exc:  # noqa: BLE001
            print(f"  ⚠️  détail {c['cardNo']} : {exc}")
        time.sleep(0.25)

        name = c["name"] or details["name"] or c["cardNo"]
        rarity = details["rarity"] or "C"

        # Cartes AP : rareté dédiée quel que soit le détail extrait
        # (format cardNo : UA54BT/MST-1-AP01 -> tiret avant AP)
        if re.search(r"-AP\d+$", c["cardNo"].strip()):
            rarity = "AP"
        # Parallèles : suffixe P sur la rareté de base (C->CP, U->UP, R->RP, SR->SRP)
        elif c["cardNo"].strip().endswith("_p1"):
            rarity = (details["rarity"] or "C") + "P"

        img = IMG_BASE.format(img=c["imageFile"].removesuffix(".png"))

        # Prix : TCGplayer si connu, sinon estimation par rareté
        p = price_by_name.get(name.lower())
        price = round(p, 2) if p else ESTIMATE_EUR.get(rarity, 0.25)

        out_cards.append({
            "name": name,
            "rarity": rarity,
            "imageUrl": img,
            "priceTrend": price,
            "cardNo": c["cardNo"],
            **({"bp": details["bp"]} if details.get("bp") else {}),
            "priceSource": "tcgplayer" if p else "estimate",
        })
        if (i + 1) % 20 == 0:
            print(f"   … {i + 1}/{len(cards)}")

    # Tri par numéro de carte
    out_cards.sort(key=lambda x: x["cardNo"])

    payload = {
        "set": "Mushoku Tensei: Jobless Reincarnation [UA54BT]",
        "game": "UNION ARENA",
        "source": "unionarena-tcg.com (cardlist officielle) + TCGplayer si indexé",
        "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
        "stats": {
            "total": len(out_cards),
            "byRarity": dict(sorted(
                ((r, sum(1 for c in out_cards if c["rarity"] == r)) for r in set(c["rarity"] for c in out_cards)),
            )),
            "withRealPrice": sum(1 for c in out_cards if c["priceSource"] == "tcgplayer"),
        },
        "cards": out_cards,
    }

    out = Path("public/data/cards.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"💾 {len(out_cards)} cartes écrites dans {out}")
    print(f"   Raretés : {payload['stats']['byRarity']}")
    print(f"   Prix réels TCGplayer : {payload['stats']['withRealPrice']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
