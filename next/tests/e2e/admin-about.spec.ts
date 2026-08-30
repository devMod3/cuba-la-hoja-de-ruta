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

async function openAbout(page: Page) {
  await page.goto('/admin/');
  const shell = page.locator('#zen-admin-shell');
  await expect(shell).toBeVisible();
  await shell.getByRole('tab', { name: 'Acerca de' }).click();
  await expect(page.locator('#zen-about-manager-root')).toBeVisible();
  return shell;
}

test('Admin About follows the approved tabbed flow and contains every visible control inside the shell', async ({
  page
}) => {
  const shell = await openAbout(page);
  const about = page.locator('#zen-about-manager-root');

  for (const name of ['Vista Previa ↗', 'Exportar', 'Importar']) {
    await expect(about.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(about.getByRole('button', { name: 'Guardar', exact: true })).toBeVisible();
  await expect(shell.getByRole('link', { name: 'Ir al sitio ↗' })).toBeVisible();

  const sections = [
    { tab: 'Perfil', headings: ['Identidad y contacto'] },
    {
      tab: 'Detalles',
      headings: ['Perfil extendido', 'Ubicación', 'Campos clásicos de Blogger']
    },
    { tab: 'Intereses', headings: ['Intereses y favoritos'] },
    { tab: 'Redes', headings: ['Redes sociales'] },
    { tab: 'Recursos', headings: ['Recursos relacionados'] }
  ] as const;

  for (const section of sections) {
    const tab = about.getByRole('tab', { name: section.tab, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(about.getByRole('tabpanel')).toBeVisible();
    await expect(about.getByRole('tabpanel')).toHaveCount(1);

    for (const heading of section.headings) {
      await expect(about.getByText(heading, { exact: true }).first()).toBeVisible();
    }

    const metrics = await page.evaluate(() => {
      const adminShell = document.querySelector('#zen-admin-shell');
      const aboutRoot = document.querySelector('#zen-about-manager-root');
      const headerActions = aboutRoot?.querySelector('.zam-header-actions');
      const main = aboutRoot?.querySelector('.zam-main');
      const tabList = aboutRoot?.querySelector('.zam-tabs');
      const tabContent = aboutRoot?.querySelector('.zam-tab-content');
      const footer = aboutRoot?.querySelector('.zam-footer');
      if (
        !(adminShell instanceof HTMLElement) ||
        !(aboutRoot instanceof HTMLElement) ||
        !(headerActions instanceof HTMLElement) ||
        !(main instanceof HTMLElement) ||
        !(tabList instanceof HTMLElement) ||
        !(tabContent instanceof HTMLElement) ||
        !(footer instanceof HTMLElement)
      ) {
        throw new Error('Admin About containment nodes are missing.');
      }

      const shellRect = adminShell.getBoundingClientRect();
      const visibleControls = Array.from(
        aboutRoot.querySelectorAll<HTMLElement>(
          'button, a, input, textarea, select, summary, [role="status"], [role="img"]'
        )
      ).filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        );
      });

      return {
        shellMatchesViewport:
          Math.abs(shellRect.width - globalThis.innerWidth) <= 1 &&
          Math.abs(shellRect.height - globalThis.innerHeight) <= 1,
        shellOverflowX: adminShell.scrollWidth - adminShell.clientWidth,
        aboutOverflowX: aboutRoot.scrollWidth - aboutRoot.clientWidth,
        headerActionsOverflowX: headerActions.scrollWidth - headerActions.clientWidth,
        mainOverflowX: main.scrollWidth - main.clientWidth,
        tabListOverflowX: tabList.scrollWidth - tabList.clientWidth,
        tabContentOverflowX: tabContent.scrollWidth - tabContent.clientWidth,
        footerOverflowX: footer.scrollWidth - footer.clientWidth,
        mainOverflowY: getComputedStyle(main).overflowY,
        tabContentOverflowY: getComputedStyle(tabContent).overflowY,
        controlsOutsideShell: visibleControls
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < shellRect.left - 1 || rect.right > shellRect.right + 1;
          })
          .map((element) => element.outerHTML.slice(0, 180)),
        controlsWithoutShellAncestor: visibleControls
          .filter((element) => element.closest('#zen-admin-shell') !== adminShell)
          .map((element) => element.outerHTML.slice(0, 180))
      };
    });

    expect(metrics.shellMatchesViewport).toBe(true);
    expect(metrics.shellOverflowX).toBeLessThanOrEqual(1);
    expect(metrics.aboutOverflowX).toBeLessThanOrEqual(1);
    expect(metrics.headerActionsOverflowX).toBeLessThanOrEqual(1);
    expect(metrics.mainOverflowX).toBeLessThanOrEqual(1);
    expect(metrics.tabListOverflowX).toBeLessThanOrEqual(1);
    expect(metrics.tabContentOverflowX).toBeLessThanOrEqual(1);
    expect(metrics.footerOverflowX).toBeLessThanOrEqual(1);
    expect(metrics.mainOverflowY).toBe('hidden');
    expect(metrics.tabContentOverflowY).toMatch(/auto|scroll/u);
    expect(metrics.controlsOutsideShell).toEqual([]);
    expect(metrics.controlsWithoutShellAncestor).toEqual([]);
  }

  const profileTab = about.getByRole('tab', { name: 'Perfil', exact: true });
  const detailsTab = about.getByRole('tab', { name: 'Detalles', exact: true });
  await profileTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(detailsTab).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(profileTab).toHaveAttribute('aria-selected', 'true');

  const accessibility = await new AxeBuilder({ page })
    .include('#zen-admin-shell')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations, JSON.stringify(accessibility.violations, null, 2)).toEqual([]);

  await about.getByRole('button', { name: 'Guardar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Estado compartido' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.closest('#zen-admin-shell')?.id ?? null)).toBe(
    'zen-admin-shell'
  );

  const dialogBounds = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      viewportWidth: globalThis.innerWidth,
      viewportHeight: globalThis.innerHeight
    };
  });
  expect(dialogBounds.left).toBeGreaterThanOrEqual(0);
  expect(dialogBounds.top).toBeGreaterThanOrEqual(0);
  expect(dialogBounds.right).toBeLessThanOrEqual(dialogBounds.viewportWidth + 1);
  expect(dialogBounds.bottom).toBeLessThanOrEqual(dialogBounds.viewportHeight + 1);

  await expect(shell.getByRole('tab', { name: 'Metadata' })).toBeVisible();
  await expect(shell.getByRole('tab', { name: 'Search Lab' })).toBeVisible();
  await expect(shell.getByRole('tab', { name: 'Acerca de' })).toBeVisible();
});

test('Admin About supports Blogger profile, import/export, photo and Audio Clip authoring', async ({
  page
}) => {
  const shell = await openAbout(page);
  const about = page.locator('#zen-about-manager-root');

  await about.getByLabel('Nombre visible').fill('Perfil editorial');
  await about.getByLabel('Introducción').fill('Descripción mantenida desde el entorno Next.js.');
  await about.getByLabel('Perfil de Blogger').fill('https://www.blogger.com/profile/editorial');
  await about.getByRole('tab', { name: 'Detalles', exact: true }).click();
  await about.getByLabel('Ciudad').fill('La Habana');
  await expect(shell.getByRole('link', { name: 'Ir al sitio ↗' })).toHaveAttribute('href', '../');

  await about.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(about.getByRole('status')).toContainText('publicación pública autenticada');

  const stored = await page.evaluate(() => globalThis.localStorage.getItem('zenSiteProfile.v1'));
  expect(stored).not.toBeNull();
  expect(JSON.parse(stored ?? '{}')).toMatchObject({
    profile: {
      displayName: 'Perfil editorial',
      introduction: 'Descripción mantenida desde el entorno Next.js.',
      externalProfileUrl: 'https://www.blogger.com/profile/editorial',
      location: { city: 'La Habana' }
    }
  });

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Estado compartido' })).toBeHidden();

  const importedProfile = {
    schemaVersion: '1.0.0',
    updatedAt: '2026-08-29T00:00:00.000Z',
    profile: {
      displayName: 'Perfil importado',
      photoUrl: '',
      email: '',
      website: '',
      externalProfileUrl: 'https://www.blogger.com/profile/importado',
      audioClipUrl: '',
      wishlistUrl: '',
      randomQuestion: '',
      randomAnswer: '',
      gender: '',
      industry: '',
      occupation: '',
      location: { city: 'La Habana', region: '', country: 'Cuba' },
      introduction: 'Importado desde JSON.',
      interests: [],
      favoriteMovies: [],
      favoriteMusic: [],
      favoriteBooks: []
    },
    social: [],
    relatedResources: []
  };

  await about.getByLabel('Importar perfil JSON').setInputFiles({
    name: 'site-profile.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importedProfile), 'utf8')
  });
  await about.getByRole('tab', { name: 'Perfil', exact: true }).click();
  await expect(about.getByLabel('Nombre visible')).toHaveValue('Perfil importado');
  await expect(about.getByLabel('Perfil de Blogger')).toHaveValue(
    'https://www.blogger.com/profile/importado'
  );
  await expect(about.getByRole('status')).toContainText('Perfil importado');

  const png1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
  );
  await about.getByLabel('Seleccionar foto de perfil').setInputFiles({
    name: 'profile.png',
    mimeType: 'image/png',
    buffer: png1x1
  });
  await expect(about.getByRole('status')).toContainText('Foto optimizada');
  const photoPreview = about.getByRole('img', { name: 'Vista previa de foto de perfil' });
  await expect(photoPreview).toBeVisible();
  await expect(photoPreview).toHaveCSS('background-image', /data:image\/(?:webp|jpeg);base64,/u);

  await about.getByRole('tab', { name: 'Detalles', exact: true }).click();
  await about.getByLabel('Seleccionar Audio Clip').setInputFiles({
    name: 'clip.mp3',
    mimeType: 'audio/mpeg',
    buffer: Buffer.from('ID3', 'utf8')
  });
  await expect(about.getByRole('status')).toContainText('Audio Clip cargado');
  await expect(about.getByLabel('Audio Clip (URL o data URL)')).toHaveValue(
    /^data:audio\/mpeg;base64,/u
  );

  const downloadPromise = page.waitForEvent('download');
  await about.getByRole('button', { name: 'Exportar', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('site-profile.json');
});

test('Admin About Guardar publishes through versioned shared authoring without persisting credentials', async ({
  page
}) => {
  const tokenSentinel = 'github_pat_ABOUT_PUBLICATION_SENTINEL';
  const remoteProfile = {
    schemaVersion: '1.0.0',
    updatedAt: '2026-08-27T10:22:01.214Z',
    profile: {
      displayName: 'Perfil remoto anterior',
      photoUrl: '',
      email: '',
      website: '',
      externalProfileUrl: '',
      audioClipUrl: '',
      wishlistUrl: '',
      randomQuestion: '',
      randomAnswer: '',
      gender: '',
      industry: '',
      occupation: '',
      location: { city: '', region: '', country: '' },
      introduction: '',
      interests: [],
      favoriteMovies: [],
      favoriteMusic: [],
      favoriteBooks: []
    },
    social: [],
    relatedResources: []
  };
  let profileContent = jsonBase64(remoteProfile);
  let profileVersion = 'profile-sha-old';
  const profilePuts: Array<{ content?: string; message?: string; sha?: string }> = [];

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
      await fulfillGitHubJson(route, 404, { message: 'Not Found' });
      return;
    }
    if (url.pathname.endsWith('/contents/next/packages/site-config/data/site-profile.json')) {
      if (request.method() === 'PUT') {
        const profilePut = request.postDataJSON() as {
          content?: string;
          message?: string;
          sha?: string;
        };
        profilePuts.push(profilePut);
        profileContent = profilePut.content ?? '';
        profileVersion = 'profile-sha-new';
        await fulfillGitHubJson(route, 200, { content: { sha: profileVersion } });
        return;
      }
      await fulfillGitHubJson(route, 200, {
        sha: profileVersion,
        content: profileContent,
        encoding: 'base64',
        type: 'file'
      });
      return;
    }
    await route.abort();
  });

  const shell = await openAbout(page);
  const about = page.locator('#zen-about-manager-root');
  await about.getByLabel('Nombre visible').fill('Perfil publicado desde Admin');
  await about.getByLabel('Introducción').fill('Publicación versionada con read-back.');
  await about.getByLabel('Perfil de Blogger').fill('https://www.blogger.com/profile/publicado');
  await about.getByRole('button', { name: 'Guardar', exact: true }).click();

  const dialog = shell.getByRole('dialog', { name: 'Estado compartido' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Credencial temporal').fill(tokenSentinel);
  await dialog.getByRole('button', { name: 'Conectar' }).click();

  const profileCard = dialog.locator('[data-zsa-key="site-profile"]');
  await expect(profileCard).toContainText('divergente');
  page.once('dialog', (confirmation) => confirmation.accept());
  await profileCard.getByRole('button', { name: 'Publicar borrador' }).click();

  await expect(profileCard).toContainText('sincronizado');
  await expect(dialog.getByRole('status')).toContainText('Perfil publicado en main');
  const profilePut = profilePuts.at(0);
  expect(profilePut).toBeDefined();
  if (!profilePut) throw new Error('Expected a versioned profile publication request.');
  expect(profilePut.message).toBe('content: publish About profile');
  expect(profilePut.sha).toBe('profile-sha-old');

  const published = JSON.parse(
    Buffer.from(profilePut.content ?? '', 'base64').toString('utf8')
  ) as {
    profile?: { displayName?: string; introduction?: string; externalProfileUrl?: string };
  };
  expect(published.profile).toMatchObject({
    displayName: 'Perfil publicado desde Admin',
    introduction: 'Publicación versionada con read-back.',
    externalProfileUrl: 'https://www.blogger.com/profile/publicado'
  });

  const browserStorage = await page.evaluate(() => ({
    local: Object.fromEntries(Object.entries(globalThis.localStorage)),
    session: Object.fromEntries(Object.entries(globalThis.sessionStorage))
  }));
  expect(JSON.stringify(browserStorage)).not.toContain(tokenSentinel);
  await expect(page.locator('body')).not.toContainText(tokenSentinel);
});
