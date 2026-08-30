import { expect, test, type Page } from '@playwright/test';

async function openAbout(page: Page) {
  await page.goto('/admin/');
  const shell = page.locator('#zen-admin-shell');
  await expect(shell).toBeVisible();
  await shell.getByRole('tab', { name: 'Acerca de' }).click();
  const about = page.locator('#zen-about-manager-root');
  await expect(about).toBeVisible();
  return about;
}

test('Admin About previews the current local draft without changing the canonical public page', async ({
  context,
  page
}) => {
  const about = await openAbout(page);
  const draftName = 'Borrador local no publicado';
  const draftIntro = 'Vista previa generada sin escribir el repositorio.';

  await about.getByLabel('Nombre visible').fill(draftName);
  await about.getByLabel('Introducción').fill(draftIntro);

  const previewOpened = context.waitForEvent('page');
  await about.getByRole('button', { name: 'Vista Previa ↗', exact: true }).click();
  const preview = await previewOpened;
  await preview.waitForLoadState('domcontentloaded');

  await expect(preview.getByRole('status')).toContainText('todavía no están publicados');
  await expect(preview.getByRole('heading', { level: 1, name: draftName })).toBeVisible();
  await expect(preview.getByText(draftIntro, { exact: true })).toBeVisible();

  const stored = await page.evaluate(() => globalThis.localStorage.getItem('zenSiteProfile.v1'));
  expect(stored).toContain(draftName);

  await page.goto('/acerca-de/');
  await expect(page.getByRole('heading', { level: 1, name: draftName })).toHaveCount(0);
});

test('Admin About keeps explicit, unique order when social links and resources are moved', async ({
  page
}) => {
  const about = await openAbout(page);

  await about.getByRole('button', { name: '+ Añadir red', exact: true }).click();
  await about.getByRole('button', { name: '+ Añadir red', exact: true }).click();
  const socialCards = about.locator(
    'section[aria-labelledby="about-social-heading"] article.zam-card'
  );
  await expect(socialCards).toHaveCount(3);
  await socialCards.nth(0).getByLabel('Etiqueta personalizada').fill('Primera');
  await socialCards.nth(1).getByLabel('Etiqueta personalizada').fill('Segunda');
  await socialCards.nth(1).getByLabel('URL').fill('https://example.com/segunda');
  await socialCards.nth(2).getByLabel('Etiqueta personalizada').fill('Tercera');
  await socialCards.nth(2).getByLabel('URL').fill('https://example.com/tercera');

  await about.getByRole('button', { name: 'Subir red 3' }).click();
  await expect(socialCards.nth(1).getByLabel('Etiqueta personalizada')).toHaveValue('Tercera');
  await expect(socialCards.nth(2).getByLabel('Etiqueta personalizada')).toHaveValue('Segunda');

  await about.getByRole('button', { name: '+ Añadir recurso', exact: true }).click();
  await about.getByRole('button', { name: '+ Añadir recurso', exact: true }).click();
  const resourceCards = about.locator(
    'section[aria-labelledby="about-resources-heading"] article.zam-card'
  );
  await expect(resourceCards).toHaveCount(2);
  await resourceCards.nth(0).getByLabel('Título').fill('Primero');
  await resourceCards.nth(0).getByLabel('URL').fill('https://example.com/primero');
  await resourceCards.nth(1).getByLabel('Título').fill('Segundo');
  await resourceCards.nth(1).getByLabel('URL').fill('https://example.com/segundo');

  await about.getByRole('button', { name: 'Subir recurso 2' }).click();
  await expect(resourceCards.nth(0).getByLabel('Título')).toHaveValue('Segundo');
  await expect(resourceCards.nth(1).getByLabel('Título')).toHaveValue('Primero');

  await about.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(about.getByRole('status')).toContainText('publicación pública autenticada');

  const stored = await page.evaluate(() => globalThis.localStorage.getItem('zenSiteProfile.v1'));
  const parsed = JSON.parse(stored ?? '{}') as {
    social?: Array<{ label?: string; order?: number }>;
    relatedResources?: Array<{ title?: string; order?: number }>;
  };
  expect(parsed.social?.map((item) => item.order)).toEqual([0, 1, 2]);
  expect(parsed.social?.map((item) => item.label)).toEqual(['Primera', 'Tercera', 'Segunda']);
  expect(parsed.relatedResources?.map((item) => item.order)).toEqual([0, 1]);
  expect(parsed.relatedResources?.map((item) => item.title)).toEqual(['Segundo', 'Primero']);
});
