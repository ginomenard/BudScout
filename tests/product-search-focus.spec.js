const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-bud-page="products"]').click();
  await expect(page.locator('#budProducts')).toBeVisible();
});

test('quick-search chips apply without focusing input or jumping the viewport', async ({ page }) => {
  const search = page.locator('#search');
  for (const [query, count] of [['Blue Dream', '4 of'], ['Gelato', '1 of'], ['Summit', '2 of']]) {
    const chip = page.locator('[data-query]').filter({ hasText: query });
    await chip.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    await chip.click();
    await expect(search).toHaveValue(query);
    await expect(page.locator('#count')).toContainText(count);
    expect(await search.evaluate(el => document.activeElement === el)).toBe(false);
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
  }
});

test('Clear filters resets state without focusing search or scrolling to it', async ({ page }) => {
  const search = page.locator('#search');
  await page.locator('[data-query="Blue Dream"]').click();
  await page.locator('#size').selectOption('3.5');
  const clear = page.locator('#clearBtn');
  await expect(clear).toBeVisible();
  await clear.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await clear.click();
  await expect(search).toHaveValue('');
  await expect(page.locator('#size')).toHaveValue('all');
  await expect(clear).toBeHidden();
  expect(await search.evaluate(el => document.activeElement === el)).toBe(false);
  const after = await page.evaluate(() => window.scrollY);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(2);

  // Deliberately tapping the input still focuses it for text entry.
  await search.click();
  expect(await search.evaluate(el => document.activeElement === el)).toBe(true);
});
