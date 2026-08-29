import { expect, test } from '@playwright/test';

const ZRP_SCRIPT_URL =
  'https://devmod3.github.io/zen-radio-player/assets/zen-radio-player.js?v=1.0.4';

const PEOPLE_ARTICLE_ID = '1102067444728853158';
const CONSTITUTION_ARTICLE_ID = '7981496041809796805';
const ZRP_PLAYLIST_URL = 'https://zuma-radio-player.major-oasis-8708.chatgpt.site/api/playlist';

function isGlobalShellRequest(url: URL): boolean {
  return url.href === ZRP_SCRIPT_URL || url.href === ZRP_PLAYLIST_URL;
}

test('Explore simple mode is catalog-backed, title-only and routes internally', async ({
  page
}) => {
  const unexpectedExternalRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (
      ['http:', 'https:'].includes(url.protocol) &&
      !['127.0.0.1', 'localhost'].includes(url.hostname)
    ) {
      if (!isGlobalShellRequest(url)) unexpectedExternalRequests.push(request.url());
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
  expect(unexpectedExternalRequests).toEqual([]);

  await page.getByRole('searchbox', { name: 'Buscar por título' }).fill('constitucion');
  await expect(page.getByRole('status')).toHaveText('1 artículo');
  await expect(results).toHaveCount(1);
  await expect(results.first()).toContainText(
    'La supervivencia del artículo 40 de la Constitución de 1940, ante un golpe de Estado'
  );

  await page.getByRole('button', { name: 'Limpiar' }).click();
  await expect(page.getByRole('status')).toHaveText('2 artículos');
  expect(unexpectedExternalRequests).toEqual([]);
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
                primaryPillar: 'soberania',
                relatedPillars: ['estado'],
                type: 'concepto'
              },
              temporal: { documentYear: 2026 },
              indexing: { concepts: [], aliases: [], keywords: [], norms: [] },
              editorial: { status: 'verificado' }
            },
            [constitutionId]: {
              classification: {
                primaryPillar: 'constitucion',
                relatedPillars: [],
                type: 'analisis'
              },
              temporal: { documentYear: 1940 },
              indexing: { concepts: [], aliases: [], keywords: [], norms: [] },
              editorial: { status: 'verificado' }
            }
          }
        })
      );
    },
    { peopleId: PEOPLE_ARTICLE_ID, constitutionId: CONSTITUTION_ARTICLE_ID }
  );

  await page.goto('/explorar/');
  await page.getByRole('button', { name: 'Búsqueda avanzada' }).click();

  await expect(page.getByRole('searchbox', { name: 'Buscar por título' })).toHaveCount(0);
  await page.getByLabel('Pilar').selectOption('constitucion');
  await expect(page.getByRole('status')).toHaveText('1 artículo');
  const result = page.locator('.explore-results a');
  await expect(result).toHaveCount(1);
  await expect(result).toContainText('Análisis');
  await expect(result).toContainText('Constitución de 1940');

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

test('Explore advanced mode falls back only to controlled-vocabulary pillars and never invents document metadata', async ({
  page
}) => {
  await page.goto('/explorar/');
  await page.getByRole('button', { name: 'Búsqueda avanzada' }).click();

  await page.getByLabel('Pilar').selectOption('estado');
  await expect(page.getByRole('status')).toHaveText('1 artículo');
  await expect(page.locator('.explore-results a')).toContainText('Que es Pueblo?');

  await page.getByLabel('Año documental').selectOption('range');
  await page.getByLabel('Desde').fill('1500');
  await page.getByLabel('Hasta').fill('2200');
  await expect(page.getByRole('status')).toHaveText('0 artículos');
  await expect(page.getByText('No hay artículos que coincidan con los criterios.')).toBeVisible();
});
