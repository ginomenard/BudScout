"""Safety tests for nonpublishable Muse menu fixtures."""
import copy
import json
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from validate_offers import validate_offer

DATA = json.loads((ROOT / "data/sample-offers.nonpublishable.json").read_text(encoding="utf-8"))
SCHEMA = json.loads((ROOT / "data/offer.schema.json").read_text(encoding="utf-8"))


class OfferTests(unittest.TestCase):
    def test_schema_prices_required_nullable(self):
        price = SCHEMA["properties"]["price"]
        self.assertIn("list_price", price["required"])
        self.assertIn("effective_price", price["required"])
        for key in ("list_price", "effective_price"):
            self.assertIn("null", price["properties"][key]["type"])

    def test_three_examples_validate(self):
        self.assertEqual(len(DATA["examples"]), 3)
        for example in DATA["examples"]:
            self.assertEqual(validate_offer(example), [])

    def test_examples_cannot_publish(self):
        for example in DATA["examples"]:
            self.assertEqual(example["provenance"]["authorization_basis"], "none")
            self.assertTrue(validate_offer(example, publish=True, now=datetime.now(timezone.utc)))

    def test_missing_price_is_not_zero(self):
        sample = next(x for x in DATA["examples"] if x["availability"]["status"] == "out_of_stock")
        self.assertIsNone(sample["price"]["list_price"])
        self.assertIsNone(sample["price"]["effective_price"])
        bad = copy.deepcopy(sample)
        bad["price"]["list_price"] = 0
        self.assertTrue(validate_offer(bad))

    def test_required_price_cannot_be_omitted(self):
        bad = copy.deepcopy(DATA["examples"][0])
        del bad["price"]["effective_price"]
        self.assertTrue(validate_offer(bad))

    def test_restricted_discount_cannot_change_general_price(self):
        bad = copy.deepcopy(DATA["examples"][0])
        bad["price"]["discount"]["eligibility"] = "veterans"
        bad["price"]["effective_price"] = 12
        self.assertTrue(validate_offer(bad))

    def test_license_id_is_join_key(self):
        sample = copy.deepcopy(DATA["examples"][0])
        sample["dispensary"]["name"] = "Different trade name"
        self.assertEqual(validate_offer(sample), [])
        sample["dispensary"]["license_id"] = "wrong"
        self.assertTrue(validate_offer(sample))


if __name__ == "__main__":
    unittest.main()
