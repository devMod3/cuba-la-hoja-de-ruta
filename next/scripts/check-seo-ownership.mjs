import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import snapshot from '../packages/content-snapshot/content/blogger.snapshot.json' with { type: 'json' };

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(workspaceRoot, 'apps/web/out');
const errors = [];

const robots = await readFile(path.join(outputRoot, 'robots.txt'), 'utf8');
if (!/^User-Agent: \*$/m.test(robots)) errors.push('robots.txt must target all crawlers');
if (!/^Allow: \/$/m.test(robots)) errors.push('robots.txt must allow the public shell');
if (!/^Disallow: \/articulo\/$/m.test(robots)) {
  errors.push('robots.txt must disallow migration article previews');
}
if (/^Sitemap:/m.test(robots)) {
  errors.push('robots.txt must not claim a Next sitemap before hostname cutover');
}

for (const article of snapshot.articles) {
  const html = await readFile(path.join(outputRoot, 'articulo', article.id, 'index.html'), 'utf8');
  const escapedCanonical = article.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (
    !new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["']${escapedCanonical}["']`, 'i').test(
      html
    )
  ) {
    errors.push(`article ${article.id} must preserve Blogger canonical URL`);
  }
  if (!/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) {
    errors.push(`article ${article.id} must remain noindex`);
  }
}

if (errors.length) {
  globalThis.console.error('SEO_OWNERSHIP_CHECK=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('SEO_OWNERSHIP_CHECK=PASS');
globalThis.console.log(`ARTICLE_CANONICALS=${snapshot.articles.length}`);
globalThis.console.log('PREVIEW_ROBOTS_DISALLOW=/articulo/');
