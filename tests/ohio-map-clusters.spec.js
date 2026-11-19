const { test, expect } = require('@playwright/test');

test('Ohio pins group at state zoom and directory navigation still opens an individual store', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-bud-page="map"]').click();
  await expect(page.locator('#reviewedLocationList .store-jump').first()).toBeVisible();
  const published = await page.locator('#reviewedLocationList .store-jump').count();
  expect(published).toBeGreaterThan(1);
  // A clustered state view must have fewer markers than published locations.
  await expect.poll(async () => page.locator('#map .bud-map-cluster').count()).toBeGreaterThan(0);
  const pins = await page.locator('#map .bud-store-pin').count();
  const clusters = await page.locator('#map .bud-map-cluster').count();
  expect(pins + clusters).toBeLessThan(published);
  await page.locator('#reviewedLocationList .store-jump').first().click();
  await expect(page.locator('#map .bud-location-card').first()).toBeVisible();
  await expect(page.locator('#reviewedCount')).toContainText('published');
});
