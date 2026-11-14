#!/usr/bin/env python3
"""Validate BudScout offer fixtures without third-party dependencies.

This is a safety/semantic gate, not a complete JSON Schema implementation.
The full schema is data/offer.schema.json. No fixture is a public feed.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LICENSE = re.compile(r"^CCD[0-9]{6}-[0-9]{2}$")
REQUIRED = ("offer_id", "dispensary", "canonical_product", "source_listing",
            "package", "price", "availability", "provenance", "freshness")
AUTHORIZED = {"retailer_consent_form", "platform_partnership",
              "retailer_agency_agreement", "b2b_license_with_republication"}


def parse_date(value):
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (TypeError, ValueError, AttributeError):
        return None


def validate_offer(offer, publish=False, now=None):
    errors = []
    if not isinstance(offer, dict):
        return ["offer must be an object"]
    for key in REQUIRED:
        if key not in offer:
            errors.append(f"missing {key}")
    if errors:
        return errors
    disp = offer["dispensary"]
    price = offer["price"]
    prov = offer["provenance"]
    fresh = offer["freshness"]
    product = offer["canonical_product"]
    package = offer["package"]
    availability = offer["availability"]
    source = offer["source_listing"]
    if not all(isinstance(x, dict) for x in (disp, price, prov, fresh, product, package, availability, source)):
        return ["nested offer fields must be objects"]
    if not LICENSE.fullmatch(str(disp.get("license_id", ""))):
        errors.append("invalid Ohio license_id")
    for key in ("name", "city"):
        if not isinstance(disp.get(key), str) or not disp[key].strip():
            errors.append(f"missing dispensary.{key}")
    for key in ("canonical_product_id", "brand_normalized", "product_name_normalized", "category"):
        if not isinstance(product.get(key), str) or not product[key].strip():
            errors.append(f"missing canonical_product.{key}")
    if not isinstance(package.get("weight_g"), (int, float)) or isinstance(package.get("weight_g"), bool) or package["weight_g"] <= 0:
        errors.append("package.weight_g must be positive")
    if package.get("count") is not None and (type(package["count"]) is not int or package["count"] <= 0):
        errors.append("package.count must be a positive integer or null")
    if price.get("currency") != "USD" or price.get("tax_included") is not False:
        errors.append("prices must be USD and pre-tax")
    for key in ("list_price", "effective_price"):
        if key not in price:
            errors.append(f"missing required nullable price.{key}")
        elif price[key] is not None and (type(price[key]) not in (int, float) or price[key] <= 0):
            errors.append(f"price.{key} must be positive or null (never zero)")
    if price.get("price_per_gram") is not None:
        if product.get("category") != "flower" or price.get("effective_price") is None:
            errors.append("price_per_gram only valid for priced flower")
        elif type(price["price_per_gram"]) not in (int, float) or price["price_per_gram"] <= 0:
            errors.append("invalid price_per_gram")
    discount = price.get("discount")
    if discount is not None:
        if not isinstance(discount, dict):
            errors.append("discount must be an object or null")
        elif discount.get("eligibility") not in (None, "all_customers", "unknown"):
            if price.get("list_price") is not None and price.get("effective_price") != price.get("list_price"):
                errors.append("restricted discounts must not lower general effective_price")
    if availability.get("status") not in ("in_stock", "low_stock", "out_of_stock", "unknown"):
        errors.append("invalid availability status")
    if not isinstance(source.get("source_name"), str) or not source["source_name"].strip():
        errors.append("missing source_listing.source_name")
    if not str(source.get("source_url", "")).startswith("https://"):
        errors.append("source URL must be HTTPS")
    if prov.get("authorization_basis") not in AUTHORIZED | {"none"}:
        errors.append("invalid authorization basis")
    if not isinstance(prov.get("provider"), str) or not prov["provider"].strip():
        errors.append("missing provider")
    if prov.get("retrieval_method") not in ("partner_api", "retailer_issued_api_key", "retailer_file_feed", "b2b_data_license", "manual_entry"):
        errors.append("invalid retrieval method")
    retrieved = parse_date(fresh.get("retrieved_at"))
    if retrieved is None or retrieved.tzinfo is None:
        errors.append("retrieved_at must be timezone-aware ISO datetime")
    stale = parse_date(fresh.get("stale_after")) if fresh.get("stale_after") is not None else None
    if fresh.get("stale_after") is not None and (stale is None or stale.tzinfo is None):
        errors.append("stale_after must be timezone-aware ISO datetime or null")
    if publish:
        if prov.get("authorization_basis") not in AUTHORIZED:
            errors.append("publication blocked: no documented republication authorization")
        if offer.get("offer_id", "").startswith("off_EXAMPLE") or "EXAMPLE" in str(offer.get("offer_id", "")):
            errors.append("publication blocked: illustrative fixture")
        if price.get("effective_price") is None:
            errors.append("publication blocked: no usable price")
        if stale is None or now is None or stale <= now:
            errors.append("publication blocked: price stale or freshness unverified")
    return errors


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data/sample-offers.nonpublishable.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    offers = data["examples"] if isinstance(data, dict) else data
    errors = [f"offer {i}: {error}" for i, offer in enumerate(offers)
              for error in validate_offer(offer)]
    for error in errors:
        print("ERROR:", error)
    print(f"Validated {len(offers)} nonpublishable examples: {len(errors)} errors")
    return int(bool(errors))


if __name__ == "__main__":
    raise SystemExit(main())
