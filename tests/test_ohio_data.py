import unittest
from scripts.validate_ohio_data import validate

VALID = dict(license_id='TEST-1', name='Sample', address='123 Main St', city='Columbus', state='OH', zip='43215', status='operational', source_url='https://example.org', verified_at='2026-11-11', latitude=39.96, longitude=-83.0)

class OhioDataTests(unittest.TestCase):
    def test_empty_staging_file_is_valid(self):
        self.assertEqual(validate({'schema_version': 1, 'dispensaries': []}), [])
    def test_valid_record(self):
        self.assertEqual(validate({'schema_version': 1, 'dispensaries': [VALID]}), [])
    def test_duplicate_license_is_rejected(self):
        self.assertTrue(any('duplicate' in e for e in validate({'schema_version': 1, 'dispensaries': [VALID, VALID]})))
    def test_bad_zip_and_coordinates_are_rejected(self):
        bad = {**VALID, 'zip': '123', 'latitude': 999}
        errors = validate({'schema_version': 1, 'dispensaries': [bad]})
        self.assertTrue(any('.zip' in e for e in errors))
        self.assertTrue(any('.latitude' in e for e in errors))

if __name__ == '__main__':
    unittest.main()
