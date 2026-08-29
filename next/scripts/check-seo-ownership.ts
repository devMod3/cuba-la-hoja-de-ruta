import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { articleUrl, siteUrl } from '../apps/web/lib/site-address.ts';
import catalog from '../packages/content-catalog/content/articles.json' with { type: 'json' };

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(workspaceRoot, 'apps/web/out');
const errors: string[] = [];

const robots = await readFile(path.join(outputRoot, 'robots.txt'), 'utf8');
if (!/^User-Agent: \*$/mu.test(robots)) errors.push('robots.txt must target all crawlers');
if (!/^Allow: \/$/mu.test(robots)) errors.push('robots.txt must allow the public site');
if (/^Disallow: \/articulo\/$/mu.test(robots)) {
  errors.push('robots.txt must not block first-party article routes');
}
if (!robots.includes(`Sitemap: ${siteUrl('/sitemap.xml')}`)) {
  errors.push('robots.txt must advertise the configured canonical sitemap');
}

const sitemap = await readFile(path.join(outputRoot, 'sitemap.xml'), 'utf8');
for (const article of catalog.articles) {
  const html = await readFile(path.join(outputRoot, 'articulo', article.id, 'index.html'), 'utf8');
  const canonicalUrl = articleUrl(article.id);
  const escapedCanonical = canonicalUrl.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

  if (
    !new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["']${escapedCanonical}["']`, 'iu').test(
      html
    )
  ) {
    errors.push(`article ${article.id} must use its configured canonical URL`);
  }
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/iu.test(html)) {
    errors.push(`article ${article.id} must remain indexable`);
  }
  if (!sitemap.includes(`<loc>${canonicalUrl}</loc>`)) {
    errors.push(`sitemap must include article ${article.id}`);
  }
}

if (errors.length) {
  globalThis.console.error('SEO_OWNERSHIP_CHECK=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('SEO_OWNERSHIP_CHECK=PASS');
globalThis.console.log(`ARTICLE_CANONICALS=${String(catalog.articles.length)}`);
globalThis.console.log(`CANONICAL_ORIGIN=${siteUrl('/').replace(/\/$/u, '')}`);
