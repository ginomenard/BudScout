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

test('Search opens the Ohio map and tapping a cluster zooms to the selected marker', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-bud-page="products"]').click();
  await page.locator('#mapBtn').click();
  await expect(page.locator('#budMap')).toBeVisible();
  await expect(page.locator('[data-bud-page="map"]')).toHaveAttribute('aria-current', 'page');

  const clusters = page.locator('#map .bud-map-cluster');
  await expect.poll(() => clusters.count()).toBeGreaterThan(0);
  await page.locator('#map').scrollIntoViewIfNeeded();
  const selected = await page.evaluate(() => {
    const mapCenter = ohioMap.getSize().divideBy(2);
    const icons = [...document.querySelectorAll('#map .bud-map-cluster')];
    const visible = storeMarkerLayer.getLayers().flatMap(marker => {
      const index = icons.indexOf(marker.getElement());
      if (index === -1 || !ohioMap.getBounds().contains(marker.getLatLng())) return [];
      return [{ marker, index, distance: ohioMap.latLngToContainerPoint(marker.getLatLng()).distanceTo(mapCenter) }];
    });
    visible.sort((a, b) => a.distance - b.distance);
    const { marker, index } = visible[0];
    const { lat, lng } = marker.getLatLng();
    return { index, lat, lng, zoom: ohioMap.getZoom() };
  });
  await clusters.nth(selected.index).click();
  await expect.poll(() => page.evaluate(() => ohioMap.getZoom())).toBeGreaterThan(selected.zoom);
  await expect.poll(() => page.evaluate(({ lat, lng }) =>
    ohioMap.latLngToContainerPoint([lat, lng]).distanceTo(ohioMap.getSize().divideBy(2)),
  selected)).toBeLessThan(2);
});
