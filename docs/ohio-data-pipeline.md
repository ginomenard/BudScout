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


## November 11, 2026: official-source candidate review and map integration

Official certificate-of-operation listing (checked 2026-11-11):
https://com.ohio.gov/divisions-and-programs/cannabis-control/about-dcc/licenses/dispensaries/dispensary-licenses

A small factual batch of Ohio DCC-listed names and addresses is staged in
`data/ohio-review-candidates.json`. **Candidates are not published to the map.**
The DCC table provides the public business address and certificate-of-operation
listing, but did not provide verified license IDs or usable, reconciled WGS84
coordinates in the source material inspected. A public Ohio GIS FeatureServer
appears to expose license and coordinate fields, but its individual records were
not retrievable for comparison in this run:
https://maps.ohio.gov/arcgis/rest/services/Hosted/Geocoded_Dispensaries_/FeatureServer/0

Before promoting any candidate into `data/ohio-dispensaries.json`:
1. Confirm the DCC listing is current and the data reuse terms permit publication.
2. Match the correct *actual license ID* and operational status to the street address.
3. Obtain and independently reconcile the WGS84 latitude/longitude; do not guess
   coordinates or run bulk requests against public geocoding services.
4. Record the HTTPS source URL, verified_at date, and top-level last_reviewed date;
   have a human review the proposed diff before merging.
5. Run the Python validator and mobile tests. Only operational records with all
   review fields and Ohio coordinates render as pins, with Google Maps directions.

The website now loads the reviewed JSON on page load, but the published dataset
is intentionally empty. The UI keeps the honest empty-state message until
a separately reviewed follow-up PR publishes verified locations.

## November 12, 2026: map directory and official-source fallback

The Map tab now includes a browsable list **only** for operational, reviewed records
that pass the same pin eligibility gate. Selecting a list entry centers the map
and opens its marker popup. While the reviewed JSON is empty, the list displays
an explicit empty state and links to Ohio DCC's official interactive dispensary map:
https://com.ohio.gov/divisions-and-programs/cannabis-control/about-dcc/licenses/what-we-do/cannabis-dispensary-map

The state map and certificate-of-operation listing were checked on 2026-11-12.
They provide a public lookup, but the published BudScout directory remains empty:
we have not reconciled actual license IDs and coordinates for the staged candidates.
Do **not** convert address-lookup markers or fictional product listings into licensed
store pins. A human-reviewed data PR is still required.
