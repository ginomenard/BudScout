const { test, expect } = require('@playwright/test');

test('homepage offers accurate prelaunch messaging and functional discovery CTAs', async ({ page }) => {
  await page.goto('/');
  const home = page.locator('#budHome');
  await expect(home).toBeVisible();
  await expect(home.getByRole('heading', { name: /Discover Ohio dispensaries/ })).toBeVisible();
  await expect(home).toContainText('illustrative demo');
  await expect(home).toContainText('No live menu feeds or retailer partnerships');

  await home.getByRole('button', { name: 'Explore dispensaries' }).click();
  await expect(page.locator('#budMap')).toBeVisible();
  await expect(page.locator('#map')).toBeVisible();
  await expect(page.locator('[data-bud-page="map"]')).toHaveAttribute('aria-current', 'page');

  await page.locator('[data-bud-page="home"]').click();
  await home.getByRole('button', { name: 'Compare demo products' }).click();
  await expect(page.locator('#budProducts')).toBeVisible();
  await expect(page.locator('#budProducts')).toContainText('Demo listings only');
  await expect(page.locator('[data-bud-page="products"]')).toHaveAttribute('aria-current', 'page');
});

test('homepage CTA buttons remain usable on narrow mobile viewports', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const actions = page.locator('.bud-hero-actions');
  await expect(actions.getByRole('button')).toHaveCount(2);
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  for (const button of await actions.getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 1);
  }
  await actions.getByRole('button', { name: 'Explore dispensaries' }).click();
  await expect(page.locator('#budMap')).toBeVisible();
});
