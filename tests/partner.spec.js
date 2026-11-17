const { test, expect } = require('@playwright/test');

test('partner information is discoverable and does not imply existing partnerships', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Explore a potential BudScout pilot/ }).click();
  await expect(page).toHaveURL(/partner\.html$/);
  await expect(page.getByRole('heading', { name: 'Partner With BudScout' })).toBeVisible();
  await expect(page.locator('main')).toContainText('No retailer partnerships');
  await expect(page.locator('main')).toContainText('fictional demonstration data');
  await expect(page.locator('main')).toContainText('No GitHub account is needed');
  const contact = page.getByRole('link', { name: 'Email BudScout Partnerships' });
  await expect(contact).toHaveAttribute('href', 'mailto:budscout.partners@gmail.com?subject=BudScout%20Retailer%20Partnership%20Inquiry');
  await expect(page.getByRole('link', { name: /fictional business dashboard concept/ })).toHaveAttribute('href', './partner-demo.html');
});

test('partner contact and back navigation fit narrow mobile screens', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/partner.html');
  const cta = page.getByRole('link', { name: 'Email BudScout Partnerships' });
  await expect(cta).toBeVisible();
  const viewport = await page.evaluate(() => document.documentElement.clientWidth);
  const box = await cta.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport + 1);
  await page.getByRole('link', { name: /Back to BudScout/ }).click();
  await expect(page.locator('#budHome')).toBeVisible();
});
