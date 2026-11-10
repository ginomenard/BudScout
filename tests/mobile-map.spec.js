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
