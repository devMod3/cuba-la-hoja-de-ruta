import { expect, test } from '@playwright/test';

test('About renders the published profile instead of migration placeholder content', async ({
  page
}) => {
  await page.goto('/acerca-de/');

  await expect(page.getByRole('heading', { level: 1, name: 'lα_яєѕιѕтєηċια' })).toBeVisible();
  await expect(
    page.getByText(
      '“Cuando las leyes e instituciones carecen de voluntad soberana, los ciudadanos adquirimos el derecho y el deber de la legítima y adecuada resistencia.”'
    )
  ).toBeVisible();
  await expect(page.getByText('Constitucionalismo', { exact: true })).toBeVisible();
  await expect(page.getByText('Tecnologías', { exact: true })).toBeVisible();

  await expect(page.getByRole('link', { name: 'larsistncia@gmail.com' })).toHaveAttribute(
    'href',
    'mailto:larsistncia@gmail.com'
  );
  await expect(page.getByRole('link', { name: /X \/ Twitter/ })).toHaveAttribute(
    'href',
    'https://x.com/la_RsisTncia'
  );
  await expect(
    page.getByRole('link', { name: /Movimiento C40 - \(Movimiento constitucionalista Cubano\)/ })
  ).toHaveAttribute('href', 'https://movimientoc40.com/');

  await expect(page.getByAltText('Foto de lα_яєѕιѕтєηċια')).toBeVisible();
  await expect(page.getByText(/Esta ruta prueba que el layout global permanece/)).toHaveCount(0);
});

test('About remains responsive without changing the global shell', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/acerca-de/');

  await expect(page.getByRole('link', { name: /La hoja de ruta/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir navegación' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'lα_яєѕιѕтєηċια' })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
});
