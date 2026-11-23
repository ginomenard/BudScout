#!/usr/bin/env python3
"""Read-only official Ohio ArcGIS license-ID diff. Never publishes listings."""
import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

SOURCE = "https://maps.ohio.gov/arcgis/rest/services/Hosted/Geocoded_Dispensaries_/FeatureServer/0"
LICENSE = re.compile(r"CCD\d{6}-\d{2}", re.I)
FIELDS = ("name", "address", "city", "zip", "latitude", "longitude")
MAX_ROWS = 2000


def license_id(attrs):
    for key in ("user_lic_1", "user_licen"):
        value = str(attrs.get(key) or "").strip()
        match = LICENSE.search(value)
        if match:
            return match.group().upper()
    raise ValueError("Missing valid CCD license ID in source row")


def parse_features(payload):
    if not isinstance(payload, dict) or payload.get("error") or payload.get("exceededTransferLimit"):
        raise ValueError("ArcGIS returned an error or incomplete results")
    features = payload.get("features")
    if not isinstance(features, list) or not 1 <= len(features) <= MAX_ROWS:
        raise ValueError("Unexpected source feature count")
    records = {}
    for feature in features:
        attrs = feature.get("attributes") or {}
        key = license_id(attrs)
        if key in records:
            raise ValueError(f"Duplicate source license ID: {key}")
        geom = feature.get("geometry") or {}
        lat, lon = geom.get("y"), geom.get("x")
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)) or not (38.3 <= lat <= 42 and -84.9 <= lon <= -80.4):
            raise ValueError(f"Missing/out-of-Ohio source geometry for {key}")
        records[key] = {
            "name": str(attrs.get("user_dispe") or attrs.get("user_busin") or "").strip(),
            "address": str(attrs.get("user_stree") or "").strip(),
            "city": str(attrs.get("user_city") or "").strip(),
            "zip": str(attrs.get("user_zip") or "").strip().zfill(5),
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
        }
        if not records[key]["name"] or not records[key]["city"]:
            raise ValueError(f"Missing source name/city for {key}")
    return records


def compare(staged, official):
    rows = staged.get("dispensaries")
    if not isinstance(rows, list) or not rows:
        raise ValueError("Staged directory missing or empty")
    old = {}
    for row in rows:
        key = row["license_id"]
        if key in old:
            raise ValueError(f"Duplicate staged license ID: {key}")
        old[key] = row
    added = sorted(set(official) - set(old))
    missing = sorted(set(old) - set(official))
    changed = {}
    for key in sorted(set(old) & set(official)):
        delta = {}
        for field in FIELDS:
            a, b = old[key].get(field), official[key][field]
            if field in ("latitude", "longitude") and a is not None:
                a = round(a, 6)
            if a != b:
                delta[field] = {"staged": a, "official": b}
        if delta:
            changed[key] = delta
    return {"added": added, "missing_from_source": missing, "changed": changed}


def fetch():
    params = urlencode({"where": "1=1", "outFields": "*", "returnGeometry": "true", "outSR": "4326", "f": "json"})
    with urlopen(SOURCE + "/query?" + params, timeout=30) as response:
        if response.status != 200:
            raise ValueError(f"ArcGIS HTTP {response.status}")
        payload = json.load(response)
    return parse_features(payload)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--staged", default="data/ohio-dispensaries.json")
    parser.add_argument("--output", default="ohio-gis-review.json")
    parser.add_argument("--fixture", help="Offline test fixture; no network call")
    args = parser.parse_args()
    staged = json.loads(Path(args.staged).read_text(encoding="utf-8"))
    official = parse_features(json.loads(Path(args.fixture).read_text(encoding="utf-8"))) if args.fixture else fetch()
    report = {
        "source": SOURCE,
        "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        "staged_last_reviewed": staged.get("last_reviewed"),
        "staged_count": len(staged["dispensaries"]),
        "official_count": len(official),
        "review_required": True,
        "publication_performed": False,
        "diff": compare(staged, official),
        "warning": "Source records and changed/missing entries require human license/status/address verification; do not publish automatically.",
    }
    Path(args.output).write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Staged: {report['staged_count']}; official: {report['official_count']}; added: {len(report['diff']['added'])}; missing: {len(report['diff']['missing_from_source'])}; changed: {len(report['diff']['changed'])}")
    print(f"Review artifact: {args.output}; no directory file modified")


if __name__ == "__main__":
    main()
