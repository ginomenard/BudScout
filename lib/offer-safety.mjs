// BudScout offer safety gate. Pure Node.js, no dependencies or network access.
// Only authorized, current, meaningful prices may enter a future public feed.
export function validateOffer(offer, now = new Date()) {
  const errors = [];
  if (!offer || typeof offer !== 'object') return ['Offer must be an object'];
  const id = offer.dispensary?.license_id;
  if (!/^CCD\d{6}-\d{2}$/.test(id ?? '')) errors.push('Valid Ohio license_id required');
  if (!offer.offer_id || !offer.canonical_product?.canonical_product_id) errors.push('Offer and product IDs required');
  if (!offer.source_listing?.source_url || !/^https:\/\//.test(offer.source_listing.source_url)) errors.push('HTTPS source URL required');
  const price = offer.price;
  if (!price || !Object.hasOwn(price, 'list_price') || !Object.hasOwn(price, 'effective_price')) {
    errors.push('Both prices required (null is allowed)');
  } else {
    for (const field of ['list_price', 'effective_price']) {
      const value = price[field];
      if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) errors.push(field + ' must be positive or null');
    }
  }
  if (!offer.provenance?.authorization_basis) errors.push('Authorization basis required');
  if (!offer.freshness?.retrieved_at || !Number.isFinite(Date.parse(offer.freshness.retrieved_at))) errors.push('Valid retrieved_at required');
  if (offer.freshness?.stale_after && !Number.isFinite(Date.parse(offer.freshness.stale_after))) errors.push('Invalid stale_after');
  if (!['in_stock', 'low_stock', 'out_of_stock', 'unknown'].includes(offer.availability?.status)) errors.push('Availability status required');
  return errors;
}

export function canPublishOffer(offer, now = new Date()) {
  if (validateOffer(offer, now).length) return false;
  if (!['retailer_consent_form', 'platform_partnership', 'retailer_agency_agreement', 'b2b_license_with_republication'].includes(offer.provenance.authorization_basis)) return false;
  if (!['partner_api', 'retailer_issued_api_key', 'retailer_file_feed', 'b2b_data_license'].includes(offer.provenance.retrieval_method)) return false;
  if (offer.availability.status === 'out_of_stock' || offer.availability.status === 'unknown') return false;
  if (offer.price.effective_price === null || offer.price.list_price === null) return false;
  const retrieved = Date.parse(offer.freshness.retrieved_at);
  const expiry = offer.freshness.stale_after ? Date.parse(offer.freshness.stale_after) : retrieved + 24 * 60 * 60 * 1000;
  return retrieved <= now.getTime() && now.getTime() < expiry;
}
