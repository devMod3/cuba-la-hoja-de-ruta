import { expect, test } from '@playwright/test';

const PEOPLE_ARTICLE_ID = '1102067444728853158';
const CONSTITUTION_ARTICLE_ID = '7981496041809796805';

test('Explore simple mode is snapshot-backed, title-only and routes internally', async ({ page }) => {
  const bloggerRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://cubalahojaderuta.blogspot.com/')) {
      bloggerRequests.push(request.url());
    }
  });

  await page.goto('/explorar/');

  const search = page.locator('[data-component="Explore.PublicSearch"]');
  const results = page.locator('.explore-results a');
  await expect(search).toHaveAttribute('data-hydrated', 'true');
  await expect(page.getByRole('heading', { level: 1, name: 'Explorar' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('2 artículos');
  await expect(results).toHaveCount(2);
  await expect(results.nth(0)).toContainText('Sin clasificar');
  await expect(results.nth(0)).toContainText('Que es Pueblo?');
  await expect(results.nth(0)).toHaveAttribute('href', `/articulo/${PEOPLE_ARTICLE_ID}/`);
  await expect(results.nth(1)).toContainText(
    'La supervivencia del artículo 40 de la Constitución de 1940, ante un golpe de Estado'
  );
  await expect(results.nth(1)).toHaveAttribute('href', `/articulo/${CONSTITUTION_ARTICLE_ID}/`);
  await expect(page.getByText('El Blindaje Invisible', { exact: false })).toHaveCount(0);
  expect(bloggerRequests).toEqual([]);

  await page.getByRole('searchbox', { name: 'Buscar por título' }).fill('constitucion');
  await expect(page.getByRole('status')).toHaveText('1 artículo');
  await expect(results).toHaveCount(1);
  await expect(results.first()).toContainText(
    'La supervivencia del artículo 40 de la Constitución de 1940, ante un golpe de Estado'
  );

  await page.getByRole('button', { name: 'Limpiar' }).click();
  await expect(page.getByRole('status')).toHaveText('2 artículos');
  expect(bloggerRequests).toEqual([]);
});

test('Explore advanced mode uses canonical metadata, documentary year and deterministic reset', async ({
  page
}) => {
  await page.addInitScript(
    ({ peopleId, constitutionId }) => {
      globalThis.localStorage.setItem(
        'zenMetadataRegistry.v2',
        JSON.stringify({
          schemaVersion: '1.0.0',
          vocabularyVersion: '1.0.0',
          records: {
            [peopleId]: {
              classification: {
                primaryPillar: 'Soberanía',
                relatedPillars: ['Estado'],
                type: 'Concepto'
              },
              temporal: { documentYear: 2026 },
              indexing: { concepts: [], aliases: [], keywords: [], norms: [] },
              editorial: { status: 'Verificado' }
            },
            [constitutionId]: {
              classification: {
                primaryPillar: 'Constitución',
                relatedPillars: [],
                type: 'Análisis'
              },
              temporal: { documentYear: 1940 },
              indexing: { concepts: [], aliases: [], keywords: [], norms: [] },
              editorial: { status: 'Verificado' }
            }
          },
          migrationIssues: {}
        })
      );
    },
    { peopleId: PEOPLE_ARTICLE_ID, constitutionId: CONSTITUTION_ARTICLE_ID }
  );

  await page.goto('/explorar/');
  await page.getByRole('button', { name: 'Búsqueda avanzada' }).click();

  await expect(page.getByRole('searchbox', { name: 'Buscar por título' })).toHaveCount(0);
  await page.getByLabel('Pilar').selectOption('Constitución');
  await expect(page.getByRole('status')).toHaveText('1 artículo');
  await expect(page.locator('.explore-results a')).toContainText(['Análisis', 'Constitución de 1940']);

  await page.getByLabel('Año documental').selectOption('range');
  await page.getByLabel('Desde').fill('1940');
  await page.getByLabel('Hasta').fill('1940');
  await expect(page.getByRole('status')).toHaveText('1 artículo');

  await page.getByLabel('Pilar').selectOption('all');
  await page.getByLabel('Orden').selectOption('az');
  await page.getByRole('button', { name: 'Restablecer criterios' }).click();

  await expect(page.getByLabel('Pilar')).toHaveValue('all');
  await expect(page.getByLabel('Tipo')).toHaveValue('all');
  await expect(page.getByLabel('Año documental')).toHaveValue('all');
  await expect(page.getByLabel('Orden')).toHaveValue('recent');
  await expect(page.getByRole('status')).toHaveText('2 artículos');
});

test('Explore advanced mode falls back only to known Blogger pillars and never invents document metadata', async ({
  page
}) => {
  await page.goto('/explorar/');
  await page.getByRole('button', { name: 'Búsqueda avanzada' }).click();

  await page.getByLabel('Pilar').selectOption('Estado');
  await expect(page.getByRole('status')).toHaveText('1 artículo');
  await expect(page.locator('.explore-results a')).toContainText(['Que es Pueblo?']);

  await page.getByLabel('Año documental').selectOption('range');
  await page.getByLabel('Desde').fill('1500');
  await page.getByLabel('Hasta').fill('2200');
  await expect(page.getByRole('status')).toHaveText('0 artículos');
  await expect(page.getByText('No hay artículos que coincidan con los criterios.')).toBeVisible();
});
