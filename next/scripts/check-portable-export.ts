import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(workspaceRoot, 'apps/web/out');
const basePath = globalThis.process.env['ZENBLOG_BASE_PATH'] ?? '';
const errors: string[] = [];

if (!basePath.startsWith('/')) {
  errors.push('ZENBLOG_BASE_PATH must be an absolute path beginning with /.');
}

async function collectHtmlFiles(directory: string): Promise<readonly string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectHtmlFiles(absolute)));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function isLegacyProviderHost(hostname: string): boolean {
  return /(?:^|\.)blogger\.com$/iu.test(hostname) || /(?:^|\.)blogspot\.[a-z.]+$/iu.test(hostname);
}

const htmlFiles = await collectHtmlFiles(outputRoot);
if (htmlFiles.length === 0) errors.push('static export contains no HTML files');

let nextAssetReferences = 0;
for (const htmlPath of htmlFiles) {
  const html = await readFile(htmlPath, 'utf8');
  const relative = path.relative(outputRoot, htmlPath);

  for (const match of html.matchAll(/(?:src|href)=["']([^"']*\/_next\/[^"']*)["']/giu)) {
    const reference = match[1];
    if (!reference) continue;
    nextAssetReferences += 1;
    if (!reference.startsWith(`${basePath}/_next/`)) {
      errors.push(`${relative}: framework asset escapes portable base path: ${reference}`);
    }
  }

  for (const match of html.matchAll(/<(script|link|form)\b[^>]*>/giu)) {
    const tag = match[0];
    const reference = /(?:src|href|action)=["']([^"']+)["']/iu.exec(tag)?.[1];
    if (!reference || !/^https?:\/\//iu.test(reference)) continue;
    const url = new URL(reference);
    if (isLegacyProviderHost(url.hostname)) {
      errors.push(`${relative}: application delivery depends on legacy provider: ${url.hostname}`);
    }
  }
}

if (nextAssetReferences === 0) errors.push('static export contains no Next.js asset references');

if (errors.length > 0) {
  globalThis.console.error('PORTABLE_EXPORT_CHECK=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('PORTABLE_EXPORT_CHECK=PASS');
globalThis.console.log(`HTML_FILES=${String(htmlFiles.length)}`);
globalThis.console.log(`NEXT_ASSET_REFERENCES=${String(nextAssetReferences)}`);
