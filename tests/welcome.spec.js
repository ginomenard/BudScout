const { test, expect } = require('@playwright/test');
test.describe('first-visit welcome', () => {
 test.use({ storageState: { cookies: [], origins: [] } });
 test('offers account and guest paths, remembers guest choice', async ({ page }) => {
  await page.goto('/');
  const dialog=page.getByRole('dialog', { name: 'Welcome to BudScout' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link',{name:'Create account'})).toHaveAttribute('href','./account.html?intent=signup');
  await expect(dialog.getByRole('link',{name:'Sign in'})).toHaveAttribute('href','./account.html?intent=signin');
  await dialog.getByRole('button',{name:'Continue as guest'}).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(dialog).toBeHidden();
 });
});
