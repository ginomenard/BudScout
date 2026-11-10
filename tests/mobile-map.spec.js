const { test, expect } = require('@playwright/test');

test('Ohio map fills its container and remains usable after drag and view switches', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /map/i }).first().click();
  const map = page.locator('#map');
  await expect(map).toBeVisible();
  await expect.poll(async () => map.evaluate(el => Boolean(el._leaflet_id))).toBe(true);
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible({ timeout: 20000 });
  const initial = await map.evaluate(el => {
    const pane = el.querySelector('.leaflet-map-pane');
    const tile = el.querySelector('.leaflet-tile-loaded');
    const bounds = el.getBoundingClientRect();
    const tileStyle = tile && getComputedStyle(tile);
    return { width: bounds.width, height: bounds.height, panePosition: pane && getComputedStyle(pane).position,
      tilePosition: tileStyle && tileStyle.position, tileWidth: tile && tile.getBoundingClientRect().width };
  });
  expect(initial.width).toBeGreaterThan(250);
  expect(initial.height).toBeGreaterThan(300);
  expect(initial.panePosition).toBe('absolute');
  expect(initial.tilePosition).toBe('absolute');
  expect(initial.tileWidth).toBeGreaterThan(200);
  const box = await map.boundingBox();
  await page.mouse.move(box.x + box.width * .65, box.y + box.height * .5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .35, box.y + box.height * .55, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await page.getByRole('button', { name: /list/i }).first().click();
  await page.getByRole('button', { name: /map/i }).first().click();
  await expect(map).toBeVisible();
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
});

test('demo product comparison still works', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Search products').fill('Blue Dream');
  await expect(page.locator('#count')).toContainText('4 of');
  await page.locator('[data-compare]').first().check();
  await expect(page.locator('#comparePanel')).toBeVisible();
  await expect(page.locator('#compareCount')).toHaveText('(1/3)');
});


test('Ohio location search centers map without relying on live geocoding', async ({ page }) => {
  await page.route('https://nominatim.openstreetmap.org/search**', async route => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('countrycodes')).toBe('us');
    expect(url.searchParams.get('bounded')).toBe('1');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ lat: '41.3898', lon: '-82.0190', display_name: 'Avon, Ohio, USA' }])
    });
  });
  await page.goto('/');
  await page.locator('#mapBtn').click();
  await page.locator('#locationQuery').fill('Avon');
  await page.getByRole('button', { name: 'Search location' }).click();
  await expect(page.locator('#locationFeedback')).toContainText('Map centered on Avon, Ohio, USA');
  await expect(page.locator('#map .leaflet-interactive')).toHaveCount(1);
  await page.locator('#resetOhio').click();
  await expect(page.locator('#locationFeedback')).toHaveText('Map reset to Ohio.');
  await expect(page.locator('#map .leaflet-interactive')).toHaveCount(0);
});

test('location search handles no Ohio matches without moving the map', async ({ page }) => {
  await page.route('https://nominatim.openstreetmap.org/search**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/');
  await page.locator('#mapBtn').click();
  await page.locator('#locationQuery').fill('Not a real Ohio city');
  await page.getByRole('button', { name: 'Search location' }).click();
  await expect(page.locator('#locationFeedback')).toContainText('No matching Ohio location found');
  await expect(page.getByRole('button', { name: 'Search location' })).toBeEnabled();
});
