import { expect, test } from '@playwright/test';

const feed = {
  feed: {
    openSearch$totalResults: { $t: '2' },
    entry: [
      {
        id: { $t: 'tag:blogger.com,1999:blog-1.post-1' },
        title: { $t: 'Constitución de 1940' },
        published: { $t: '2026-01-01T00:00:00.000Z' },
        updated: { $t: '2026-01-01T00:00:00.000Z' },
        summary: { $t: 'NO DEBE VERSE EN EXPLORAR' },
        link: [{ rel: 'alternate', href: 'https://example.com/constitucion' }],
        category: []
      },
      {
        id: { $t: 'tag:blogger.com,1999:blog-1.post-2' },
        title: { $t: 'Qué es pueblo' },
        published: { $t: '2026-01-02T00:00:00.000Z' },
        updated: { $t: '2026-01-02T00:00:00.000Z' },
        summary: { $t: 'TAMPOCO DEBE VERSE' },
        link: [{ rel: 'alternate', href: 'https://example.com/pueblo' }],
        category: []
      }
    ]
  }
};

test.beforeEach(async ({ page }) => {
  await page.route('https://cubalahojaderuta.blogspot.com/feeds/posts/default**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(feed)
    });
  });
});

test('Explore is title-only, recent-first and accent-insensitive', async ({ page }) => {
  await page.goto('/explorar/');

  const results = page.locator('.explore-results a');
  await expect(page.getByRole('status')).toHaveText('2 artículos');
  await expect(results).toHaveCount(2);
  await expect(results.nth(0)).toHaveText('Qué es pueblo');
  await expect(results.nth(1)).toHaveText('Constitución de 1940');
  await expect(page.getByText('NO DEBE VERSE EN EXPLORAR')).toHaveCount(0);

  await page.getByRole('searchbox', { name: 'Buscar por título' }).fill('constitucion');
  await expect(page.getByRole('status')).toHaveText('1 artículo');
  await expect(results).toHaveCount(1);
  await expect(results.first()).toHaveText('Constitución de 1940');
});
