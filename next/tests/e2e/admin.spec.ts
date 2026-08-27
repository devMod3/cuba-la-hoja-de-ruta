import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Admin mounts the existing four-tool shell and persists metadata locally', async ({ page }) => {
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

  await expect(page.locator('#zmm-status')).toContainText(/\d+ artículos/);
  const firstArticle = page.locator('.zmm-title-btn').first();
  await expect(firstArticle).toBeVisible();
  await firstArticle.click();
  await page.locator('#zmm-primary-pillar').selectOption('soberania');
  await page.locator('#zmm-type').selectOption('concepto');
  await page.locator('#zmm-save').click();
  await expect(page.locator('#zmm-status')).toContainText('Metadata guardada');

  const stored = await page.evaluate(() => globalThis.localStorage.getItem('zenMetadataRegistry.v2'));
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
  await inspector.check();
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
