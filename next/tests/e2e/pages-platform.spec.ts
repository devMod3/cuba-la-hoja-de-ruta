import { expect, test } from '@playwright/test';

test('public Inspector toggles with Alt+I and identifies a current Next component', async ({
  page
}) => {
  await page.goto('/');

  await page.keyboard.press('Alt+i');
  await expect(page.locator('html')).toHaveAttribute('data-zen-inspector', 'on');
  await expect
    .poll(() => page.evaluate(() => globalThis.localStorage.getItem('zenInspector.enabled')))
    .toBe('true');

  const heading = page.getByRole('heading', { level: 1 });
  await heading.hover();
  await expect(page.locator('#zen-inspector-hud')).toBeVisible();
  await heading.click();

  const dialog = page.locator('#zen-inspector-modal');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#zen-inspector-component-name')).not.toHaveValue('');
  await expect(page.locator('#zen-inspector-log')).not.toHaveValue('');

  await page.keyboard.press('Alt+i');
  await expect(page.locator('html')).toHaveAttribute('data-zen-inspector', 'off');
});

test('robots.txt declares GitHub Pages sitemap as the only public sitemap authority', async ({
  page
}) => {
  const response = await page.goto('/robots.txt');
  expect(response?.status()).toBe(200);
  const body = await page.locator('body').innerText();
  expect(body).toContain('User-Agent: *');
  expect(body).toContain('Allow: /');
  expect(body).toContain('Sitemap: https://devmod3.github.io/cuba-la-hoja-de-ruta/sitemap.xml');
});

test('sitemap exposes Pages-owned routes and every catalog article', async ({ page }) => {
  const response = await page.goto('/sitemap.xml');
  if (!response) throw new Error('Expected a sitemap response.');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).toContain('https://devmod3.github.io/cuba-la-hoja-de-ruta');
  expect(xml).toContain('https://devmod3.github.io/cuba-la-hoja-de-ruta/explorar/');
  expect(xml).toContain('https://devmod3.github.io/cuba-la-hoja-de-ruta/acerca-de/');
  expect(xml).toContain('/articulo/1102067444728853158/');
  expect(xml).toContain('/articulo/7981496041809796805/');
  expect(xml).not.toContain('blogspot');
});
