import { expect, test } from '@playwright/test';

const ARTICLE_ID = '1102067444728853158';
const CANONICAL = 'https://cubalahojaderuta.blogspot.com/2026/08/que-es-pueblo.html';

test('article preview is static, noindex and canonically owned by Blogger', async ({ page }) => {
  await page.goto(`/articulo/${ARTICLE_ID}/`);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Que es Pueblo?');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  await expect(page.getByRole('link', { name: 'Leer versión canónica en Blogger ↗' })).toHaveAttribute(
    'href',
    CANONICAL
  );
  await expect(page.locator('[data-component="Article.Preview"] script')).toHaveCount(0);
  await expect(page.locator('[data-component="Article.Preview"] iframe')).toHaveCount(0);
});
