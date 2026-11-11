import unittest
from scripts.validate_ohio_data import validate

VALID = dict(license_id='TEST-1', name='Sample', address='123 Main St', city='Columbus', state='OH', zip='43215', status='operational', source_url='https://example.org', verified_at='2026-11-11', latitude=39.96, longitude=-83.0)

def dataset(*rows):
    return {'schema_version': 1, 'last_reviewed': '2026-11-11' if rows else None, 'dispensaries': list(rows)}

class OhioDataTests(unittest.TestCase):
    def test_empty_staging_file_is_valid(self):
        self.assertEqual(validate(dataset()), [])
    def test_valid_record(self):
        self.assertEqual(validate(dataset(VALID)), [])
    def test_duplicate_license_is_rejected(self):
        self.assertTrue(any('duplicate' in e for e in validate(dataset(VALID, VALID))))
    def test_bad_zip_and_coordinates_are_rejected(self):
        bad = {**VALID, 'zip': '123', 'latitude': 999}
        errors = validate(dataset(bad))
        self.assertTrue(any('.zip' in e for e in errors))
        self.assertTrue(any('.latitude' in e for e in errors))

    def test_malformed_license_id_and_zip_are_reported_not_crashed(self):
        bad = {**VALID, 'license_id': ['bad'], 'zip': 43215}
        errors = validate(dataset(bad))
        self.assertTrue(any('license_id' in e for e in errors))
        self.assertTrue(any('.zip' in e for e in errors))

    def test_missing_review_date_is_rejected(self):
        data = dataset(VALID)
        data['last_reviewed'] = None
        self.assertTrue(any('last_reviewed' in e for e in validate(data)))

    def test_untrusted_source_invalid_date_and_out_of_state_coordinates(self):
        bad = {**VALID, 'source_url': 'http://example.org', 'verified_at': '2026-99-99', 'latitude': 35.0}
        errors = validate(dataset(bad))
        self.assertTrue(any('source_url' in e for e in errors))
        self.assertTrue(any('verified_at' in e for e in errors))
        self.assertTrue(any('Ohio bounds' in e for e in errors))

if __name__ == '__main__':
    unittest.main()
