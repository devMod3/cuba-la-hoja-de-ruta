import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';

const GITHUB_CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Authorization, Content-Type',
  'access-control-allow-methods': 'GET, PUT, OPTIONS'
} as const;

function jsonBase64(value: unknown): string {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8').toString('base64');
}

async function fulfillGitHubPreflight(route: Route): Promise<boolean> {
  if (route.request().method() !== 'OPTIONS') return false;
  await route.fulfill({ status: 204, headers: GITHUB_CORS_HEADERS });
  return true;
}

async function fulfillGitHubJson(route: Route, status: number, json: unknown): Promise<void> {
  await route.fulfill({ status, headers: GITHUB_CORS_HEADERS, json });
}

async function makeMetadataMeaningful(page: Page) {
  await expect(page.locator('#zmm-status')).toContainText(/\d+ artículos/);
  const firstArticle = page.locator('.zmm-title-btn').first();
  await expect(firstArticle).toBeVisible();
  await firstArticle.click();
  await page.locator('#zmm-primary-pillar').selectOption('soberania');
  await page.locator('#zmm-type').selectOption('concepto');
  await page.locator('#zmm-save').click();
  await expect(page.locator('#zmm-status')).toContainText('Metadata guardada');
}

test('Admin mounts the existing four-tool shell and persists metadata locally', async ({
  page
}) => {
  await page.goto('/admin/');

  const shell = page.locator('#zen-admin-shell');
  await expect(shell).toBeVisible();
  await expect(shell.getByRole('tab', { name: 'Metadata' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(shell.getByRole('tab', { name: 'Search Lab' })).toBeVisible();
  await expect(shell.getByRole('tab', { name: 'Acerca de' })).toBeVisible();
  await expect(shell.getByRole('tab', { name: 'Inspector' })).toBeVisible();

  await makeMetadataMeaningful(page);

  const stored = await page.evaluate(() =>
    globalThis.localStorage.getItem('zenMetadataRegistry.v2')
  );
  expect(stored).not.toBeNull();
  expect(JSON.parse(stored ?? '{}')).toMatchObject({ schemaVersion: '1.0.0' });
});

test('Admin Search Lab, About Manager and Inspector remain functional', async ({ page }) => {
  await page.goto('/admin/');
  const shell = page.locator('#zen-admin-shell');
  await expect(shell).toBeVisible();

  await shell.getByRole('tab', { name: 'Search Lab' }).click();
  await expect(page.locator('#zen-search-lab-root')).toBeVisible();
  await expect(page.locator('#zsl-index-status')).toContainText(/\d+ artículos indexados/);
  await page.locator('#zsl-query').fill('pueblo');
  await page.getByRole('button', { name: 'Ejecutar búsqueda' }).click();
  await expect(page.locator('#zsl-results')).not.toContainText('Índice sin cargar');

  await shell.getByRole('tab', { name: 'Acerca de' }).click();
  await expect(page.locator('#zen-about-manager-root')).toBeVisible();

  await shell.getByRole('tab', { name: 'Inspector' }).click();
  const inspector = page.locator('#zas-inspector-switch');
  await expect(inspector).not.toBeChecked();
  await page.locator('label[for="zas-inspector-switch"]').click();
  await expect(inspector).toBeChecked();
  await expect(page.locator('#zas-inspector-state')).toHaveText('ON');
  await expect
    .poll(() => page.evaluate(() => globalThis.localStorage.getItem('zenInspector.enabled')))
    .toBe('true');

  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations, JSON.stringify(accessibility.violations, null, 2)).toEqual([]);
});

test('Pages Admin authorizes in memory and verifies Metadata by remote read-back', async ({
  page
}) => {
  const tokenSentinel = 'github_pat_ZENBLOG_TEST_SENTINEL';
  let metadataContent: string | null = null;

  await page.route('https://api.github.com/**', async (route) => {
    if (await fulfillGitHubPreflight(route)) return;
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/user') {
      await fulfillGitHubJson(route, 200, {
        id: 101433401,
        login: 'devMod3',
        name: 'Maintainer'
      });
      return;
    }
    if (url.pathname === '/repos/devMod3/cuba-la-hoja-de-ruta') {
      await fulfillGitHubJson(route, 200, { permissions: { push: true } });
      return;
    }
    if (url.pathname.endsWith('/contents/next/packages/site-config/data/metadata-registry.json')) {
      if (request.method() === 'PUT') {
        const body = request.postDataJSON() as { content: string };
        metadataContent = body.content;
        await fulfillGitHubJson(route, 200, { content: { sha: 'metadata-sha-1' } });
        return;
      }
      if (metadataContent) {
        await fulfillGitHubJson(route, 200, {
          sha: 'metadata-sha-1',
          content: metadataContent,
          encoding: 'base64',
          type: 'file'
        });
        return;
      }
      await fulfillGitHubJson(route, 404, { message: 'Not Found' });
      return;
    }
    if (url.pathname.endsWith('/contents/next/packages/site-config/data/site-profile.json')) {
      await fulfillGitHubJson(route, 404, { message: 'Not Found' });
      return;
    }
    await route.abort();
  });

  await page.goto('/admin/');
  await makeMetadataMeaningful(page);

  const launcher = page.locator('.zsa-launcher');
  await expect(launcher).toHaveAccessibleName('Compartido · desconectado');
  await launcher.click();

  const dialog = page.getByRole('dialog', { name: 'Estado compartido' });
  await expect(dialog).toBeVisible();
  const tokenInput = dialog.getByLabel('Credencial temporal');
  await tokenInput.fill(tokenSentinel);
  await dialog.getByRole('button', { name: 'Conectar' }).click();

  await expect(launcher).toHaveAttribute('data-state', 'authorized');
  await expect(launcher).toHaveAccessibleName('Compartido · @devMod3');
  await expect(dialog.getByText('@devMod3')).toBeVisible();
  await expect(tokenInput).toHaveCount(0);

  const metadataCard = dialog.locator('[data-zsa-key="metadata-registry"]');
  await expect(metadataCard).toContainText('sólo local');
  await metadataCard.getByRole('button', { name: 'Subir local' }).click();
  await expect(metadataCard).toContainText('sincronizado');
  await expect(dialog.getByRole('status')).toContainText('versión');

  const browserStorage = await page.evaluate(() => ({
    local: Object.fromEntries(Object.entries(globalThis.localStorage)),
    session: Object.fromEntries(Object.entries(globalThis.sessionStorage))
  }));
  expect(JSON.stringify(browserStorage)).not.toContain(tokenSentinel);
  await expect(page.locator('body')).not.toContainText(tokenSentinel);

  const accessibility = await new AxeBuilder({ page })
    .include('#zen-shared-authoring-dialog')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations, JSON.stringify(accessibility.violations, null, 2)).toEqual([]);

  await dialog.getByRole('button', { name: 'Desconectar' }).click();
  await expect(launcher).toHaveAccessibleName('Compartido · desconectado');
});

test('Pages Admin exposes stale-write conflict without destructive retry', async ({ page }) => {
  const remoteMetadata = {
    schemaVersion: '1.0.0',
    vocabularyVersion: '1.0.0',
    updatedAt: '2026-08-27T00:00:00.000Z',
    records: {}
  };
  let metadataGets = 0;
  let metadataPuts = 0;

  await page.route('https://api.github.com/**', async (route) => {
    if (await fulfillGitHubPreflight(route)) return;
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/user') {
      await fulfillGitHubJson(route, 200, { id: 101433401, login: 'devMod3', name: null });
      return;
    }
    if (url.pathname === '/repos/devMod3/cuba-la-hoja-de-ruta') {
      await fulfillGitHubJson(route, 200, { permissions: { push: true } });
      return;
    }
    if (url.pathname.endsWith('/contents/next/packages/site-config/data/metadata-registry.json')) {
      if (request.method() === 'PUT') {
        metadataPuts += 1;
        await fulfillGitHubJson(route, 409, { message: 'sha does not match' });
        return;
      }
      metadataGets += 1;
      await fulfillGitHubJson(route, 200, {
        sha: metadataGets > 1 ? 'metadata-sha-new' : 'metadata-sha-old',
        content: jsonBase64(remoteMetadata),
        encoding: 'base64',
        type: 'file'
      });
      return;
    }
    if (url.pathname.endsWith('/contents/next/packages/site-config/data/site-profile.json')) {
      await fulfillGitHubJson(route, 404, { message: 'Not Found' });
      return;
    }
    await route.abort();
  });

  await page.goto('/admin/');
  await makeMetadataMeaningful(page);
  const launcher = page.locator('.zsa-launcher');
  await launcher.click();
  const dialog = page.getByRole('dialog', { name: 'Estado compartido' });
  await dialog.getByLabel('Credencial temporal').fill('github_pat_conflict_sentinel');
  await dialog.getByRole('button', { name: 'Conectar' }).click();

  await expect(launcher).toHaveAttribute('data-state', 'authorized');
  const metadataCard = dialog.locator('[data-zsa-key="metadata-registry"]');
  await expect(metadataCard).toContainText('divergente');
  page.once('dialog', (confirmation) => confirmation.accept());
  await metadataCard.getByRole('button', { name: 'Sobrescribir remoto' }).click();

  await expect(metadataCard).toContainText('conflicto');
  await expect(metadataCard).toContainText('se recargó');
  expect(metadataPuts).toBe(1);
  expect(metadataGets).toBeGreaterThanOrEqual(2);
});

test('Admin persists controlled metadata fields with canonical vocabulary identifiers', async ({
  page
}) => {
  await page.goto('/admin/');
  await expect(page.locator('#zen-admin-shell')).toBeVisible();

  const firstArticle = page.locator('.zmm-title-btn').first();
  await firstArticle.click();
  await page.locator('#zmm-primary-pillar').selectOption('soberania');
  await page.getByRole('checkbox', { name: 'Constitución' }).check();
  await page.locator('#zmm-type').selectOption('analisis');
  await page.locator('#zmm-year').fill('1940');
  await page.locator('#zmm-status-field').selectOption('verificado');
  await page.getByRole('checkbox', { name: 'Pueblo' }).check();
  await page.locator('#zmm-norm-list').fill('c40:40,97');
  await page.locator('#zmm-save').click();

  const stored = await page.evaluate(() =>
    globalThis.localStorage.getItem('zenMetadataRegistry.v2')
  );
  expect(stored).not.toBeNull();
  const parsed = JSON.parse(stored ?? '{}') as {
    records?: Record<
      string,
      {
        classification?: { primaryPillar?: string; relatedPillars?: string[]; type?: string };
        temporal?: { documentYear?: number };
        indexing?: { concepts?: string[]; norms?: Array<{ normId?: string; articles?: string[] }> };
        editorial?: { status?: string };
      }
    >;
  };
  const record = Object.values(parsed.records ?? {})[0];
  expect(record).toMatchObject({
    classification: {
      primaryPillar: 'soberania',
      relatedPillars: ['constitucion'],
      type: 'analisis'
    },
    temporal: { documentYear: 1940 },
    indexing: {
      concepts: expect.arrayContaining(['pueblo']),
      norms: [{ normId: 'c40', articles: ['40', '97'] }]
    },
    editorial: { status: 'verificado' }
  });
});

test('Admin About editor persists repository-owned profile data locally', async ({ page }) => {
  await page.goto('/admin/');
  const shell = page.locator('#zen-admin-shell');
  await shell.getByRole('tab', { name: 'Acerca de' }).click();

  await page.getByLabel('Nombre').fill('Perfil editorial');
  await page.getByLabel('Introducción').fill('Descripción mantenida desde el entorno Next.js.');
  await page.getByLabel('Ciudad').fill('La Habana');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('guardado');

  const stored = await page.evaluate(() => globalThis.localStorage.getItem('zenSiteProfile.v1'));
  expect(stored).not.toBeNull();
  expect(JSON.parse(stored ?? '{}')).toMatchObject({
    profile: {
      displayName: 'Perfil editorial',
      introduction: 'Descripción mantenida desde el entorno Next.js.',
      location: { city: 'La Habana' }
    }
  });
});
