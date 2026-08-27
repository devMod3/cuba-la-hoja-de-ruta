import { expect, test } from '@playwright/test';

const ARTICLE_ID = '1102067444728853158';
const CANONICAL = 'https://cubalahojaderuta.blogspot.com/2026/08/que-es-pueblo.html';
const SECOND_ARTICLE_ID = '7981496041809796805';

test('article reader is sanitized, noindex and canonically owned by Blogger', async ({ page }) => {
  await page.goto(`/articulo/${ARTICLE_ID}/`);

  await expect(page.locator('[data-reader-version="professional"]')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Que es Pueblo?');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', CANONICAL);
  await expect(page.getByRole('link', { name: 'Abrir fuente original ↗' })).toHaveAttribute(
    'href',
    CANONICAL
  );

  const copy = page.locator('[data-sanitized-html="true"]');
  await expect(copy.getByRole('heading', { level: 2 }).first()).toContainText('Por qué');
  await expect(copy.getByRole('heading', { level: 2 }).first()).toHaveAttribute('id', /.+/);
  await expect(
    copy.locator('script, style, iframe, svg, math, form, input, button, textarea, xmp')
  ).toHaveCount(0);
  await expect(copy.locator('[style], [onclick], [onerror], [onload], [onmouseover]')).toHaveCount(
    0
  );
  await expect(page.locator('[data-component="Article.Preview"] h1')).toHaveCount(1);
});

test('article reader exposes editorial hierarchy, contextual index and reading tools', async ({
  page
}) => {
  await page.goto(`/articulo/${ARTICLE_ID}/`);

  await expect(page.getByText(/min de lectura/).first()).toBeVisible();
  await expect(page.getByRole('list', { name: 'Materias del artículo' })).toContainText('Estado');
  await expect(page.getByRole('list', { name: 'Materias del artículo' })).toContainText(
    'Soberanía'
  );

  const toc = page.getByRole('navigation', { name: 'Índice del artículo' });
  await expect(toc).toBeVisible();
  const firstSection = toc.getByRole('link').first();
  await expect(firstSection).toContainText('Por qué');
  await expect(firstSection).toHaveAttribute('href', /^#por-que-/);
  await firstSection.click();
  await expect(page).toHaveURL(/#por-que-/);

  await expect(page.getByRole('button', { name: 'Copiar referencia' })).toBeVisible();
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset['printRequested'] = 'true';
    };
  });
  await page.getByRole('button', { name: 'Imprimir' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-print-requested', 'true');
});

test('reading progress responds to document scroll', async ({ page }) => {
  await page.goto(`/articulo/${ARTICLE_ID}/`);

  const progress = page.getByRole('progressbar', { name: 'Progreso de lectura' });
  await expect(progress).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });

  await expect
    .poll(async () => Number(await progress.getAttribute('aria-valuenow')))
    .toBeGreaterThan(50);
});

test('every captured Blogger article gets a static reader route', async ({ page }) => {
  const response = await page.goto(`/articulo/${SECOND_ARTICLE_ID}/`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'La supervivencia del artículo 40'
  );
  await expect(page.locator('[data-reader-version="professional"]')).toBeVisible();
});
