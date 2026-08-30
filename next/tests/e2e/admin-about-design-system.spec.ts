import { expect, test, type Page } from '@playwright/test';

async function openAbout(page: Page) {
  await page.goto('/admin/');
  const shell = page.locator('#zen-admin-shell');
  await expect(shell).toBeVisible();
  await shell.getByRole('tab', { name: 'Acerca de' }).click();
  const about = page.locator('#zen-about-manager-root');
  await expect(about).toBeVisible();
  return { shell, about };
}

test('Admin About inherits the editorial theme and preserves deliberate action hierarchy', async ({
  page
}) => {
  const { about } = await openAbout(page);

  const preview = about.getByRole('button', { name: 'Vista Previa ↗', exact: true });
  const exportButton = about.getByRole('button', { name: 'Exportar', exact: true });
  const importButton = about.getByRole('button', { name: 'Importar', exact: true });
  const save = about.getByRole('button', { name: 'Guardar', exact: true });

  await expect(preview).toBeVisible();
  await expect(exportButton).toBeVisible();
  await expect(importButton).toBeVisible();
  await expect(save).toBeVisible();

  const metrics = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('#zen-about-manager-root');
    const heading = root?.querySelector<HTMLElement>('.zam-profile-heading h1');
    const sidebar = root?.querySelector<HTMLElement>('.zam-profile-sidebar');
    const status = root?.querySelector<HTMLElement>('.zam-status');
    const buttons = Array.from(
      root?.querySelectorAll<HTMLButtonElement>('.zam-profile-actions > button') ?? []
    );

    if (!root || !heading || !sidebar || !status || buttons.length !== 4) {
      throw new Error('Admin About design-system nodes are missing.');
    }

    const [previewButton, exportAction, importAction, saveButton] = buttons;
    if (!previewButton || !exportAction || !importAction || !saveButton) {
      throw new Error('Admin About action hierarchy is incomplete.');
    }

    const style = (element: Element) => getComputedStyle(element);
    const rect = (element: Element) => element.getBoundingClientRect();
    const buttonMetrics = buttons.map((button) => ({
      width: rect(button).width,
      height: rect(button).height,
      left: rect(button).left,
      top: rect(button).top,
      background: style(button).backgroundColor
    }));

    return {
      viewportWidth: globalThis.innerWidth,
      colorScheme: style(root).colorScheme,
      rootBackground: style(root).backgroundColor,
      headingFont: style(heading).fontFamily,
      sidebarWidth: rect(sidebar).width,
      statusTop: rect(status).top,
      previewBackground: style(previewButton).backgroundColor,
      exportBackground: style(exportAction).backgroundColor,
      importBackground: style(importAction).backgroundColor,
      saveBackground: style(saveButton).backgroundColor,
      buttons: buttonMetrics
    };
  });

  expect(metrics.colorScheme).toContain('dark');
  expect(metrics.rootBackground).not.toBe('rgb(255, 255, 255)');
  expect(metrics.headingFont).toContain('Source Serif 4');
  expect(metrics.saveBackground).toBe('rgb(197, 174, 122)');
  expect(metrics.saveBackground).not.toBe(metrics.previewBackground);
  expect(metrics.exportBackground).toBe('rgba(0, 0, 0, 0)');
  expect(metrics.importBackground).toBe('rgba(0, 0, 0, 0)');

  for (const button of metrics.buttons) {
    expect(button.width).toBeGreaterThanOrEqual(43);
    expect(button.height).toBeGreaterThanOrEqual(43);
  }

  const [previewMetrics, exportMetrics, importMetrics, saveMetrics] = metrics.buttons;
  expect(previewMetrics).toBeDefined();
  expect(exportMetrics).toBeDefined();
  expect(importMetrics).toBeDefined();
  expect(saveMetrics).toBeDefined();
  if (!previewMetrics || !exportMetrics || !importMetrics || !saveMetrics) return;

  if (metrics.viewportWidth > 900) {
    expect(metrics.sidebarWidth).toBeGreaterThanOrEqual(291);
    expect(metrics.sidebarWidth).toBeLessThanOrEqual(337);
    expect(exportMetrics.left).toBeLessThan(importMetrics.left);
    expect(importMetrics.left).toBeLessThan(previewMetrics.left);
    expect(previewMetrics.left).toBeLessThan(saveMetrics.left);
    expect(metrics.statusTop).toBeLessThan(exportMetrics.top);
  }

  if (metrics.viewportWidth <= 640) {
    expect(previewMetrics.top).toBeLessThan(exportMetrics.top);
    expect(saveMetrics.top).toBeLessThan(importMetrics.top);
  }
});
