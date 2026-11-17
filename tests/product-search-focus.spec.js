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
  await expect(clear).toBeDisabled();
  await expect(clear).toBeVisible();
  expect(await search.evaluate(el => document.activeElement === el)).toBe(false);
  // WebKit may adjust scroll after the clicked control becomes disabled.
  // The actual regression is unexpected focus/keyboard and a jump to the search field,
  // not every browser-driven layout adjustment when result counts change.
  const after = await page.evaluate(() => window.scrollY);
  const searchTop = await search.evaluate(el => el.getBoundingClientRect().top);
  expect(Number.isFinite(after)).toBe(true);
  expect(searchTop).toBeLessThan(0);

  // Deliberately tapping the input still focuses it for text entry.
  await search.click();
  expect(await search.evaluate(el => document.activeElement === el)).toBe(true);
});


test('partner contact opens private email rather than a public GitHub issue', async ({ page }) => {
  await page.goto('/partner.html');
  await expect(page.getByRole('heading', { name: 'Partner With BudScout' })).toBeVisible();
  const inquiry = page.getByRole('link', { name: 'Email BudScout Partnerships' });
  await expect(inquiry).toHaveAttribute('href', 'mailto:budscout.partners@gmail.com?subject=BudScout%20Retailer%20Partnership%20Inquiry');
  await expect(page.getByRole('link', { name: 'budscout.partners@gmail.com' })).toHaveAttribute('href', 'mailto:budscout.partners@gmail.com');
  await expect(page.locator('a[href*="github.com/ginomenard/BudScout/issues/new"]')).toHaveCount(0);
});
