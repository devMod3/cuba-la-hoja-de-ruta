import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import catalog from '../packages/content-catalog/content/articles.json' with { type: 'json' };

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routeRoot = path.join(workspaceRoot, 'apps/web/out/articulo');
const expectedIds = catalog.articles.map((article) => article.id).sort();
const errors: string[] = [];

let actualIds: string[] = [];
try {
  const routeEntries = await readdir(routeRoot, { withFileTypes: true });
  actualIds = routeEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
} catch (error) {
  errors.push(`missing static article route directory: ${String(error)}`);
}

if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
  errors.push(
    `static article IDs mismatch: expected ${expectedIds.join(',')}; got ${actualIds.join(',')}`
  );
}

for (const id of expectedIds) {
  try {
    const index = await stat(path.join(routeRoot, id, 'index.html'));
    if (!index.isFile()) errors.push(`article ${id} index.html is not a file`);
  } catch (error) {
    errors.push(`article ${id} missing index.html: ${String(error)}`);
  }
}

if (errors.length) {
  globalThis.console.error('STATIC_ARTICLE_ROUTES=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('STATIC_ARTICLE_ROUTES=PASS');
globalThis.console.log(`ARTICLE_ROUTES=${String(actualIds.length)}`);
for (const id of actualIds) globalThis.console.log(`ARTICLE_ID=${id}`);
