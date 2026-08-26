import { expect, test } from '@playwright/test';

const BLOGGER_BASE_URL = 'https://cubalahojaderuta.blogspot.com/';
const ARTICLES = [
  {
    url: 'https://cubalahojaderuta.blogspot.com/2026/08/que-es-pueblo.html',
    title: 'Que es Pueblo?'
  },
  {
    url: 'https://cubalahojaderuta.blogspot.com/2026/08/blog-post.html',
    title: 'La supervivencia del artículo 40 de la Constitución de 1940, ante un golpe de Estado'
  }
] as const;

test.describe('Blogger Real cutover QA', () => {
  test('production Blogger home remains reachable', async ({ page }) => {
    const response = await page.goto(BLOGGER_BASE_URL, { waitUntil: 'domcontentloaded' });
    expect
      .soft(response?.ok(), `Blogger home HTTP status=${String(response?.status() ?? 'no-response')}`)
      .toBe(true);
    expect(new URL(page.url()).hostname).toBe('cubalahojaderuta.blogspot.com');
  });

  for (const article of ARTICLES) {
    test(`preserves production article contract: ${article.title}`, async ({ page }) => {
      const response = await page.goto(article.url, { waitUntil: 'domcontentloaded' });
      expect
        .soft(response?.ok(), `${article.url} HTTP status=${String(response?.status() ?? 'no-response')}`)
        .toBe(true);
      expect(await page.title()).toContain(article.title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', article.url);
    });
  }
});
