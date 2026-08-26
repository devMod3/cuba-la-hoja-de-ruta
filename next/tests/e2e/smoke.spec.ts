import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function revealPrimaryNavigation(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Abrir navegación' });
  if (await toggle.isVisible()) {
    await toggle.click();
  }
}

test('global header persists across App Router navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-component="Global.Header"]')).toBeVisible();
  await revealPrimaryNavigation(page);
  await page.getByRole('link', { name: 'Acerca de' }).click();
  await expect(page).toHaveURL(/\/acerca-de\//);
  await expect(page.locator('[data-component="Global.Header"]')).toBeVisible();
  await expect(page.locator('[data-component="About"]')).toBeVisible();
});
