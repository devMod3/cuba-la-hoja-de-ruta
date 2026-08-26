import { expect, test } from '@playwright/test';

const routes = ['/', '/explorar/', '/acerca-de/'] as const;

for (const route of routes) {
  test(`accessible document structure: ${route}`, async ({ page }) => {
    await page.goto(route);

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(horizontalOverflow).toBe(false);
  });
}

test('primary navigation is keyboard reachable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ir a la portada' })).toBeFocused();
});
