import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

interface PublishedProfileFixture {
  readonly profile: {
    readonly displayName: string;
  };
  readonly social: ReadonlyArray<{
    readonly url: string;
    readonly visible: boolean;
  }>;
  readonly relatedResources: ReadonlyArray<{
    readonly title: string;
    readonly url: string;
    readonly visible: boolean;
  }>;
}

async function readPublishedFixture(): Promise<PublishedProfileFixture> {
  const fixturePath = resolve(process.cwd(), 'packages/site-config/data/site-profile.json');
  return JSON.parse(await readFile(fixturePath, 'utf8')) as PublishedProfileFixture;
}

test('About renders the canonical published profile from the repository-owned profile', async ({
  page
}) => {
  const published = await readPublishedFixture();
  await page.goto('/acerca-de/');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: published.profile.displayName || 'La hoja de ruta'
    })
  ).toBeVisible();

  for (const social of published.social.filter((item) => item.visible && item.url)) {
    await expect(page.locator(`a[href="${social.url}"]`)).toBeVisible();
  }
  for (const resource of published.relatedResources.filter(
    (item) => item.visible && item.title && item.url
  )) {
    await expect(page.getByRole('link', { name: resource.title, exact: true })).toHaveAttribute(
      'href',
      resource.url
    );
  }

  await expect(page.getByText(/Esta ruta prueba que el layout global permanece/)).toHaveCount(0);
});

test('About remains responsive without changing the global shell', async ({ page }) => {
  const published = await readPublishedFixture();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/acerca-de/');

  await expect(page.getByRole('link', { name: 'Ir a la portada' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir navegación' })).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: published.profile.displayName || 'La hoja de ruta'
    })
  ).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
});
