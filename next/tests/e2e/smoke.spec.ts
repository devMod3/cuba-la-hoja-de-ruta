import { expect, test } from '@playwright/test';

test('global header persists across App Router navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-component="Global.Header"]')).toBeVisible();
  await page.getByRole('link', { name: 'Acerca de' }).click();
  await expect(page).toHaveURL(/\/acerca-de\//);
  await expect(page.locator('[data-component="Global.Header"]')).toBeVisible();
  await expect(page.locator('[data-component="About"]')).toBeVisible();
});
