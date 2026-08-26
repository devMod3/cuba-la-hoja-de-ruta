import { expect, test } from '@playwright/test';

test('editorial home exposes the approved discovery contract', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('SOBERANÍA · CONSTITUCIÓN · ESTADO', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Seguir el origen, los límites y el ejercicio del poder.'
    })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Explorar el sistema/ })).toHaveAttribute(
    'href',
    '/explorar/'
  );
  await expect(page.getByText('DESTACADO', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Leer' })).toHaveAttribute(
    'href',
    /^\/articulo\/[^/]+\/$/
  );
});

test('mobile navigation exposes every first-level action without removing ZRP', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Abrir navegación' });
  await expect(toggle).toBeVisible();
  await toggle.click();

  const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Portada' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Explorar' })).toBeVisible();
  await expect(navigation.getByRole('button', { name: 'Reproductor' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Acerca de' })).toBeVisible();

  await navigation.getByRole('link', { name: 'Explorar' }).click();
  await expect(page).toHaveURL(/\/explorar\//);
  await expect(navigation).toBeHidden();
});
