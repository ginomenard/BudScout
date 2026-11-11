# Ohio dispensary directory: V1 data contract

The canonical source is the Ohio Division of Cannabis Control's official operational dispensary records. This milestone creates **only a staging schema and validator**: it does not download data, geocode, alter the map, schedule jobs, or publish records.

## Record fields

Required: license_id, name, address, city, state (OH), zip (five digits), status (operational/provisional/inactive), source_url, verified_at (ISO date).
Optional: latitude, longitude (both together or both null), phone, website, menu_url, last_checked_at, notes.

## Review gate

1. Retrieve the official licensing source and preserve a dated snapshot, with attribution and source terms checked.
2. Parse and normalize into a proposed staged JSON file, never directly into the live website.
3. Validate records and review additions, removals, status changes, and questionable addresses/coordinates.
4. Require explicit human approval before merging a proposed directory update into the published dataset. Provisional/inactive records must not appear as operational.
5. Only then wire approved operational records into map rendering.

Run: `python3 scripts/validate_ohio_data.py` and `python3 -m unittest discover -s tests -p 'test_ohio_data.py'`.

**Next milestone:** Implement a source-specific importer and change report after confirming the official data format and reuse restrictions. Avoid automated requests to public geocoders without checking rate limits and usage terms.
