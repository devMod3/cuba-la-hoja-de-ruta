import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import snapshot from '../packages/content-snapshot/content/blogger.snapshot.json' with { type: 'json' };

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routeRoot = path.join(workspaceRoot, 'apps/web/out/articulo');
const expectedIds = snapshot.articles.map((article) => article.id).sort();
const errors = [];

let routeEntries = [];
try {
  routeEntries = await readdir(routeRoot, { withFileTypes: true });
} catch (error) {
  errors.push(`missing static article route directory: ${String(error)}`);
}

const actualIds = routeEntries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
  errors.push(`static article IDs mismatch: expected ${expectedIds.join(',')}; got ${actualIds.join(',')}`);
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
globalThis.console.log(`ARTICLE_ROUTES=${actualIds.length}`);
for (const id of actualIds) globalThis.console.log(`ARTICLE_ID=${id}`);
