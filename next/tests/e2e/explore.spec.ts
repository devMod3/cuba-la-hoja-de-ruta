import { expect, test } from '@playwright/test';

test('Explore is snapshot-backed, title-only, recent-first and accent-insensitive', async ({
  page
}) => {
  const bloggerRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://cubalahojaderuta.blogspot.com/feeds/')) {
      bloggerRequests.push(request.url());
    }
  });

  await page.goto('/explorar/');

  const search = page.locator('[data-component="Explore.PublicSearch"]');
  const results = page.locator('.explore-results a');
  await expect(search).toHaveAttribute('data-hydrated', 'true');
  await expect(page.getByRole('status')).toHaveText('2 artículos');
  await expect(results).toHaveCount(2);
  await expect(results.nth(0)).toHaveText('Que es Pueblo?');
  await expect(results.nth(0)).toHaveAttribute(
    'href',
    'https://cubalahojaderuta.blogspot.com/2026/08/que-es-pueblo.html'
  );
  await expect(results.nth(1)).toHaveText(
    'La supervivencia del artículo 40 de la Constitución de 1940, ante un golpe de Estado'
  );
  await expect(page.getByText('El Blindaje Invisible', { exact: false })).toHaveCount(0);
  expect(bloggerRequests).toEqual([]);

  await page.getByRole('searchbox', { name: 'Buscar por título' }).fill('constitucion');
  await expect(page.getByRole('status')).toHaveText('1 artículo');
  await expect(results).toHaveCount(1);
  await expect(results.first()).toHaveText(
    'La supervivencia del artículo 40 de la Constitución de 1940, ante un golpe de Estado'
  );
});
