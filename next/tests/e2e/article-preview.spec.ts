import { expect, test } from '@playwright/test';

const ARTICLE_ID = '1102067444728853158';
const CANONICAL = 'https://cubalahojaderuta.blogspot.com/2026/08/que-es-pueblo.html';
const SECOND_ARTICLE_ID = '7981496041809796805';

test('article preview is static, noindex and canonically owned by Blogger', async ({ page }) => {
  await page.goto(`/articulo/${ARTICLE_ID}/`);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Que es Pueblo?');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', CANONICAL);
  await expect(
    page.getByRole('link', { name: 'Leer versión canónica en Blogger ↗' })
  ).toHaveAttribute('href', CANONICAL);
  await expect(page.locator('[data-component="Article.Preview"] script')).toHaveCount(0);
  await expect(page.locator('[data-component="Article.Preview"] iframe')).toHaveCount(0);
});

test('every captured Blogger article gets a static preview route', async ({ page }) => {
  const response = await page.goto(`/articulo/${SECOND_ARTICLE_ID}/`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'La supervivencia del artículo 40'
  );
});

test('unknown article IDs are not generated dynamically', async ({ page }) => {
  const response = await page.goto('/articulo/not-in-snapshot/');
  expect(response?.status()).toBe(404);
});
