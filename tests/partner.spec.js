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

test('retailer dashboard keeps disclosures visible across tabs and updates sample metrics', async ({ page }) => {
  await page.goto('/partner.html');
  await page.getByRole('link', { name: /fictional business dashboard concept/ }).click();
  const disclosure = page.getByRole('note');
  await expect(disclosure).toContainText('FICTIONAL DEMONSTRATION');
  await expect(page.locator('#kpis')).toContainText('3,842');
  await page.getByLabel('Sample reporting period').selectOption('7');
  await expect(page.locator('#kpis')).toContainText('842');
  await expect(page.locator('#kpis')).not.toContainText('3,842');

  for (const [tab, heading] of [
    ['Market', 'Regional market intelligence'],
    ['Community', 'Community feedback preview'],
    ['Profile', 'Your storefront preview'],
  ]) {
    const button = page.getByRole('button', { name: tab, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(disclosure).toBeVisible();
  }
  await expect(page.locator('#profile')).toContainText('This preview cannot edit or verify a business.');
});
