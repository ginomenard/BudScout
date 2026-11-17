const { test, expect } = require('@playwright/test');

test('fictional demo labels appear on every product card and comparison', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-bud-page="products"]').click();
  await expect(page.locator('#budProducts')).toContainText('Fictional product demo:');
  const cards = page.locator('#list .item');
  await expect(cards).toHaveCount(8);
  await expect(page.locator('#list .demo-tag')).toHaveCount(8);
  await expect(page.locator('#list .demo-price-label')).toHaveCount(8);
  for (const card of await cards.all()) {
    await expect(card).toContainText('FICTIONAL DEMO');
    await expect(card).toContainText('Not a live offer');
  }
  await cards.first().locator('[data-compare]').check();
  await expect(page.locator('#comparePanel')).toBeVisible();
  await expect(page.locator('#compareDisclosure')).toContainText('DEMO ONLY');
  await expect(page.locator('#compareResults caption')).toContainText('Fictional demo comparison');
  await expect(page.locator('#compareResults th').last()).toHaveText('Demo price/g');
});

test('filtered demo cards retain disclosures and real Ohio directory stays separate', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-bud-page="products"]').click();
  await page.locator('[data-query="Gelato"]').click();
  await expect(page.locator('#list .item')).toHaveCount(1);
  await expect(page.locator('#list .demo-tag')).toHaveCount(1);
  await page.locator('[data-bud-page="map"]').click();
  await expect(page.locator('#reviewedLocations')).toBeVisible();
  await expect(page.locator('#reviewedLocations')).toContainText('sample products and prices are not linked to licensed stores');
  await expect(page.locator('#list')).toBeHidden();
});
