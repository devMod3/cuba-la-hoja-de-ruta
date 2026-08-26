import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const zrpUrl = 'https://devmod3.github.io/zen-radio-player/assets/zen-radio-player.js?v=1.0.4';

async function revealPrimaryNavigation(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Abrir navegación' });
  if (await toggle.isVisible()) {
    await toggle.click();
  }
}

test('ZRP loader is mounted once and launcher survives App Router navigation', async ({ page }) => {
  const zrpRequests: string[] = [];

  page.on('request', (request) => {
    if (request.url() === zrpUrl) zrpRequests.push(request.url());
  });

  await page.route(zrpUrl, async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body: `
        document.documentElement.dataset.zrpOpenCount = '0';
        window.addEventListener('zen-radio-player:open', () => {
          const current = Number(document.documentElement.dataset.zrpOpenCount ?? '0');
          document.documentElement.dataset.zrpOpenCount = String(current + 1);
        });
      `
    });
  });

  await page.goto('/');

  const loader = page.locator('script[data-component="ZRP.Loader"]');
  await expect(loader).toHaveCount(1);
  await expect(loader).toHaveAttribute('src', zrpUrl);
  await expect(page.locator('html')).toHaveAttribute('data-zrp-open-count', '0');

  await revealPrimaryNavigation(page);
  await page.getByRole('button', { name: 'Reproductor' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-zrp-open-count', '1');

  await revealPrimaryNavigation(page);
  await page.getByRole('link', { name: 'Acerca de' }).click();
  await expect(page).toHaveURL(/\/acerca-de\//);
  await expect(page.locator('[data-component="Global.Header"]')).toBeVisible();
  await expect(loader).toHaveCount(1);

  await revealPrimaryNavigation(page);
  await page.getByRole('button', { name: 'Reproductor' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-zrp-open-count', '2');

  expect(zrpRequests).toEqual([zrpUrl]);
});
