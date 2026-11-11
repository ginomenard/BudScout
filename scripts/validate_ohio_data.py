#!/usr/bin/env python3
"""Validate a staged Ohio dispensary directory; never publishes records."""
import argparse
import json
import re
from datetime import date
from urllib.parse import urlparse
from pathlib import Path

def is_iso_date(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        return False
    try:
        date.fromisoformat(value)
        return True
    except ValueError:
        return False

REQUIRED = ('license_id', 'name', 'address', 'city', 'state', 'zip', 'status', 'source_url', 'verified_at')

def validate(data):
    errors = []
    if data.get('schema_version') != 1:
        errors.append('schema_version must be 1')
    rows = data.get('dispensaries')
    if not isinstance(rows, list):
        return errors + ['dispensaries must be a list']
    if rows and not is_iso_date(data.get('last_reviewed')):
        errors.append('last_reviewed must be an ISO date when records are published')
    seen = set()
    for i, row in enumerate(rows):
        prefix = f'dispensaries[{i}]'
        if not isinstance(row, dict):
            errors.append(f'{prefix} must be an object')
            continue
        for field in REQUIRED:
            if not isinstance(row.get(field), str) or not row[field].strip():
                errors.append(f'{prefix}.{field} is required')
        license_id = row.get('license_id')
        if license_id in seen:
            errors.append(f'{prefix}: duplicate license_id {license_id!r}')
        if license_id:
            seen.add(license_id)
        source_url = row.get('source_url')
        if isinstance(source_url, str):
            parsed = urlparse(source_url)
            if parsed.scheme != 'https' or not parsed.netloc:
                errors.append(f'{prefix}.source_url must be an HTTPS URL')
        if not is_iso_date(row.get('verified_at')):
            errors.append(f'{prefix}.verified_at must be an ISO date')
        if row.get('state') != 'OH':
            errors.append(f'{prefix}.state must be OH')
        zip_code = row.get('zip', '')
        if not isinstance(zip_code, str) or len(zip_code) != 5 or not zip_code.isdigit():
            errors.append(f'{prefix}.zip must be a five-digit string')
        if row.get('status') not in ('operational', 'provisional', 'inactive'):
            errors.append(f'{prefix}.status must be operational, provisional, or inactive')
        for field, lower, upper in (('latitude', -90, 90), ('longitude', -180, 180)):
            value = row.get(field)
            if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float)) or not lower <= value <= upper):
                errors.append(f'{prefix}.{field} must be a valid coordinate or null')
        lat, lon = row.get('latitude'), row.get('longitude')
        if isinstance(lat, (int, float)) and not isinstance(lat, bool) and isinstance(lon, (int, float)) and not isinstance(lon, bool):
            if not (38.3 <= lat <= 42 and -84.9 <= lon <= -80.4):
                errors.append(f'{prefix}: coordinates must be within Ohio bounds')
        if (row.get('latitude') is None) != (row.get('longitude') is None):
            errors.append(f'{prefix}: latitude and longitude must both be present or both null')
    return errors

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('file', nargs='?', default='data/ohio-dispensaries.json')
    args = parser.parse_args()
    data = json.loads(Path(args.file).read_text(encoding='utf-8'))
    errors = validate(data)
    for error in errors:
        print('ERROR:', error)
    print(f'Validated {len(data.get("dispensaries", []))} records: {len(errors)} error(s)')
    raise SystemExit(1 if errors else 0)

if __name__ == '__main__':
    main()
