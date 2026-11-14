import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOffer, canPublishOffer } from '../lib/offer-safety.js';

const now = new Date('2026-11-14T18:00:00Z');
const offer = () => ({
  offer_id: 'test-offer',
  dispensary: { license_id: 'CCD000065-00' },
  canonical_product: { canonical_product_id: 'test-product' },
  source_listing: { source_url: 'https://example.org/menu' },
  price: { list_price: 25, effective_price: 20 },
  provenance: { authorization_basis: 'none', retrieval_method: 'manual_entry' },
  freshness: { retrieved_at: '2026-11-14T17:00:00Z' },
  availability: { status: 'in_stock' }
});

test('missing prices are valid as null but never publishable', () => {
  const item = offer(); item.price.list_price = null; item.price.effective_price = null;
  assert.deepEqual(validateOffer(item, now), []);
  assert.equal(canPublishOffer(item, now), false);
});

test('zero and invented placeholder prices fail validation', () => {
  const item = offer(); item.price.effective_price = 0;
  assert.ok(validateOffer(item, now).length > 0);
});

test('unlicensed demonstration data is never published', () => {
  assert.equal(canPublishOffer(offer(), now), false);
});

test('authorized fresh offers can pass the technical gate', () => {
  const item = offer();
  item.provenance = { authorization_basis: 'retailer_consent_form', retrieval_method: 'partner_api' };
  assert.equal(canPublishOffer(item, now), true);
  item.freshness.retrieved_at = '2026-11-12T17:00:00Z';
  assert.equal(canPublishOffer(item, now), false);
});

test('out-of-stock items and invalid license IDs are excluded', () => {
  const item = offer();
  item.provenance = { authorization_basis: 'retailer_consent_form', retrieval_method: 'partner_api' };
  item.availability.status = 'out_of_stock';
  assert.equal(canPublishOffer(item, now), false);
  item.availability.status = 'in_stock';
  item.dispensary.license_id = 'bad';
  assert.ok(validateOffer(item, now).length);
});
