"""Offline regression tests for official GIS review safety."""
import unittest
from scripts.review_ohio_gis import parse_features, compare


def feature(license_id, name="Sample", latitude=40.1, longitude=-82.9):
    return {"attributes": {"user_lic_1": license_id, "user_dispe": name,
                            "user_stree": "100 Main St", "user_city": "Columbus", "user_zip": 43219},
            "geometry": {"x": longitude, "y": latitude}}


class GISReviewTests(unittest.TestCase):
    def test_added_missing_and_changed_by_license_not_row_order(self):
        official = parse_features({"features": [feature("CCD000002-00", "New name"),
                                                  feature("CCD000003-00")]})
        staged = {"dispensaries": [
            {"license_id": "CCD000001-00"},
            {"license_id": "CCD000002-00", "name": "Old name", "address": "100 Main St",
             "city": "Columbus", "zip": "43219", "latitude": 40.1, "longitude": -82.9}]}
        diff = compare(staged, official)
        self.assertEqual(diff["added"], ["CCD000003-00"])
        self.assertEqual(diff["missing_from_source"], ["CCD000001-00"])
        self.assertEqual(diff["changed"]["CCD000002-00"]["name"]["official"], "New name")

    def test_duplicate_license_rejected(self):
        with self.assertRaisesRegex(ValueError, "Duplicate source license"):
            parse_features({"features": [feature("CCD000001-00"), feature("CCD000001-00")]})

    def test_incomplete_or_invalid_geometry_rejected(self):
        with self.assertRaisesRegex(ValueError, "incomplete"):
            parse_features({"features": [], "exceededTransferLimit": True})
        with self.assertRaisesRegex(ValueError, "geometry"):
            parse_features({"features": [feature("CCD000001-00", latitude=0)]})

    def test_missing_license_rejected(self):
        with self.assertRaisesRegex(ValueError, "license"):
            parse_features({"features": [feature("INVALID")]})

    def test_no_source_records_rejected(self):
        with self.assertRaisesRegex(ValueError, "count"):
            parse_features({"features": []})


if __name__ == "__main__":
    unittest.main()
