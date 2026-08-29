import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const extensionDist = path.join(workspaceRoot, 'apps', 'inspector-extension', 'dist');

interface InspectorDiagnosticWindow extends Window {
  zenInspectorBuildLog(element: Element): string;
}

test('universal Inspector diagnostics redact form values and URL secrets', async ({ page }) => {
  const diagnostics = await readFile(path.join(extensionDist, 'diagnostics.js'), 'utf8');
  await page.goto('/');
  await page.setContent(`
    <main data-component="Foreign.Page">
      <a id="secret-link" href="https://example.test/account?token=very-secret#private">Cuenta</a>
      <input id="password" type="password" name="password" value="hunter2" data-token="abc123" />
    </main>
  `);
  await page.addScriptTag({ content: diagnostics });

  const log = await page.evaluate(() => {
    const input = document.querySelector('#password');
    if (!(input instanceof Element)) throw new Error('Expected test input.');
    return (globalThis as unknown as InspectorDiagnosticWindow).zenInspectorBuildLog(input);
  });

  expect(log).toContain('<Foreign.Page>');
  expect(log).toContain('value-present=yes [value redacted]');
  expect(log).toContain('Claves: token [valores no capturados]');
  expect(log).not.toContain('hunter2');
  expect(log).not.toContain('abc123');

  const href = await page.evaluate(() => {
    const link = document.querySelector('#secret-link');
    if (!(link instanceof Element)) throw new Error('Expected test link.');
    return (globalThis as unknown as InspectorDiagnosticWindow).zenInspectorBuildLog(link);
  });
  expect(href).toContain('href=https://example.test/account');
  expect(href).not.toContain('very-secret');
  expect(href).not.toContain('#private');
});

test('content runtime installs an isolated host without requiring site integration', async ({
  page
}) => {
  const diagnostics = await readFile(path.join(extensionDist, 'diagnostics.js'), 'utf8');
  const content = await readFile(path.join(extensionDist, 'content.js'), 'utf8');
  await page.goto('/');
  await page.addScriptTag({ content: diagnostics });
  await page.addScriptTag({ content });

  await expect(page.locator('zen-inspector-extension-root')).toHaveCount(1);
  await expect(page.locator('html')).not.toHaveAttribute('data-zen-inspector', /.+/u);
});
