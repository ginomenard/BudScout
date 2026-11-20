const { test, expect } = require('@playwright/test');

test('community preview creates, persists, and joins locally without shared claims', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-bud-page="community"]').click();
  await expect(page.locator('#budCommunity')).toBeVisible();
  await expect(page.locator('#budCommunity')).toContainText('saved only in this browser');
  await page.locator('#communityCreateToggle').click();
  await page.locator('#communityName').fill('Toledo Neighbors');
  await page.locator('#communityCity').fill('Toledo, Ohio');
  await page.locator('#communityDescription').fill('Local questions and tips');
  await page.locator('#communityCreateForm button[type="submit"]').click();
  await expect(page.locator('#communityList')).toContainText('Toledo Neighbors');
  await expect(page.locator('#communityPostForm')).toBeVisible();
  await page.locator('#communityPostText').fill('Welcome to our local preview.');
  await page.locator('#communityPostForm button[type="submit"]').click();
  await expect(page.locator('#communityFeed')).toContainText('Saved locally');
  await page.reload();
  await page.locator('[data-bud-page="community"]').click();
  await expect(page.locator('#communityList')).toContainText('Toledo Neighbors');
  await expect(page.locator('#communityFeed')).toContainText('Welcome to our local preview.');
  await page.getByRole('button', { name: 'Leave community' }).click();
  await expect(page.locator('#communityPostForm')).toBeHidden();
  await page.getByRole('button', { name: 'Join community' }).click();
  await expect(page.locator('#communityPostForm')).toBeVisible();
});

test('community rejects street addresses and duplicate local communities', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-bud-page="community"]').click();
  const open = async () => {
    await page.locator('#communityCreateToggle').click();
    await page.locator('#communityName').fill('Area Scouts');
    await page.locator('#communityDescription').fill('General local discussion');
  };
  await open();
  await page.locator('#communityCity').fill('123 Main Street, Columbus');
  await page.locator('#communityCreateForm button[type="submit"]').click();
  await expect(page.locator('#communityCreateStatus')).toContainText('not a street address');
  await page.locator('#communityCity').fill('Columbus, Ohio');
  await page.locator('#communityCreateForm button[type="submit"]').click();
  await expect(page.locator('#communityList')).toContainText('Area Scouts');
  await open();
  await page.locator('#communityCity').fill('Columbus, Ohio');
  await page.locator('#communityCreateForm button[type="submit"]').click();
  await expect(page.locator('#communityCreateStatus')).toContainText('already exists');
  await expect(page.locator('#communityList .bud-community-card')).toHaveCount(1);
});

test('community search and feed tabs work on mobile without invented activity', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-bud-page="community"]').click();
  await expect(page.locator('#communityFeed')).toContainText('No posts yet');
  await page.locator('[data-community-feed="following"]').click();
  await expect(page.locator('[data-community-feed="following"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#communityList')).toContainText('Follow communities');
  await page.locator('#communitySearch').fill('Cleveland');
  await expect(page.locator('#communityList')).not.toContainText('fictional member');
});
