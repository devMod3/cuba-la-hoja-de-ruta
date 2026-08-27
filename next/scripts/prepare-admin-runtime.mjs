import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const nextRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(nextRoot, '..');
const webRoot = path.join(nextRoot, 'apps', 'web');
const args = new Set(globalThis.process.argv.slice(2));
const publicRuntime = path.join(webRoot, 'public', 'zen-admin');

if (args.has('--clean-public')) {
  await rm(publicRuntime, { recursive: true, force: true });
  globalThis.console.log('ZEN_ADMIN_PUBLIC_RUNTIME=CLEAN');
  globalThis.process.exit(0);
}

const targetRoot = args.has('--public') ? publicRuntime : path.join(webRoot, 'out', 'zen-admin');
const basePath = (globalThis.process.env['ZENBLOG_BASE_PATH'] ?? '').replace(/\/$/, '');
const siteHref = `${basePath}/`;

async function replaceFile(relativePath, transform) {
  const file = path.join(targetRoot, relativePath);
  const source = await readFile(file, 'utf8');
  const output = transform(source);
  if (output === source) throw new Error(`Admin runtime patch made no change: ${relativePath}`);
  await writeFile(file, output, 'utf8');
}

function replaceExact(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Admin runtime patch marker missing: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`Admin runtime patch marker is ambiguous: ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function replaceSection(source, start, end, replacement, label) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Admin runtime section missing: ${label}`);
  return source.slice(0, startIndex) + replacement + source.slice(endIndex);
}

await rm(targetRoot, { recursive: true, force: true });
await mkdir(targetRoot, { recursive: true });

for (const relativePath of [
  'tools/admin',
  'tools/about',
  'tools/inspector',
  'tools/runtime',
  'src'
]) {
  await cp(path.join(repoRoot, relativePath), path.join(targetRoot, relativePath), {
    recursive: true
  });
}

await mkdir(path.join(targetRoot, 'content'), { recursive: true });
await cp(
  path.join(nextRoot, 'packages', 'content-snapshot', 'content', 'blogger.snapshot.json'),
  path.join(targetRoot, 'content', 'blogger.snapshot.json')
);

await replaceFile('tools/admin/bootstrap.js', (source) => {
  let output = replaceExact(
    source,
    "  document.title = 'ZenBlog Admin · La hoja de ruta';\n",
    "  document.title = 'ZenBlog Admin · La hoja de ruta';\n  globalThis.ZenAdminSnapshotUrl = new URL('../../content/blogger.snapshot.json', import.meta.url).href;\n",
    'admin snapshot URL'
  );
  output = replaceExact(
    output,
    "  if (location.pathname !== '/admin' || location.hash) {\n    history.replaceState(history.state ?? {}, '', `/admin${location.search}`);\n  }",
    "  if (location.hash) {\n    history.replaceState(history.state ?? {}, '', `${location.pathname}${location.search}`);\n  }",
    'Pages-safe admin history normalization'
  );
  return output;
});

await replaceFile('tools/admin/AdminShell.js', (source) => {
  const matches = source.match(/href="\/"/g) ?? [];
  if (matches.length !== 3) {
    throw new Error(`Expected 3 AdminShell site links, found ${String(matches.length)}`);
  }
  return source.replaceAll('href="/"', `href="${siteHref}"`);
});

await replaceFile('tools/admin/PublicProfilePublishing.js', (source) =>
  replaceExact(
    source,
    "  return String(locationLike?.hostname || '').toLowerCase() === PRODUCTION_BLOGGER_HOST;",
    "  const host = String(locationLike?.hostname || '').toLowerCase();\n  return host === PRODUCTION_BLOGGER_HOST || host === 'devmod3.github.io';",
    'Pages public-profile publishing host'
  )
);

const pagesFeedFunction = `async function fetchFeedPage(startIndex){
  var snapshotUrl=window.ZenAdminSnapshotUrl;
  if(!snapshotUrl)throw new Error('Zen Admin snapshot URL no disponible');
  var response=await fetch(snapshotUrl,{credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw new Error('Snapshot HTTP '+response.status);
  var snapshot=await response.json();
  var articles=Array.isArray(snapshot&&snapshot.articles)?snapshot.articles:[];
  var page=articles.slice(startIndex-1,startIndex-1+FEED_PAGE_SIZE);
  return {feed:{
    entry:page.map(function(article){return {
      id:{$t:'tag:blogger.com,1999:blog-0.post-'+String(article.id||'')},
      title:{$t:String(article.title||'(sin título)')},
      published:{$t:String(article.publishedAt||'')},
      updated:{$t:String(article.updatedAt||'')},
      link:[{rel:'alternate',href:String(article.url||'')}],
      category:(Array.isArray(article.labels)?article.labels:[]).map(function(term){return {term:String(term)};})
    };}),
    'openSearch$totalResults':{$t:String(articles.length)}
  }};
}`;

await replaceFile('tools/admin/metadata-manager-v0.5.part2.txt', (source) =>
  replaceSection(
    source,
    'async function fetchFeedPage(startIndex){',
    '\n\nasync function fetchAllPosts(){',
    pagesFeedFunction,
    'metadata snapshot source'
  )
);

const pagesBloggerFeedSource = `import { ContentSource } from '../../contracts/ContentSource.js';

export class BloggerFeedSource extends ContentSource {
  constructor({ snapshotUrl = globalThis.ZenAdminSnapshotUrl } = {}) {
    super();
    this.snapshotUrl = snapshotUrl;
  }

  async listPosts() {
    if (!this.snapshotUrl) throw new Error('Zen Admin snapshot URL no disponible');
    const response = await fetch(this.snapshotUrl, { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) throw new Error(\`Snapshot HTTP \${response.status}\`);
    const snapshot = await response.json();
    const articles = Array.isArray(snapshot?.articles) ? snapshot.articles : [];
    const seen = new Set();
    return articles
      .map((article) => ({
        id: String(article?.id || ''),
        url: String(article?.url || ''),
        title: String(article?.title || '(sin título)'),
        publishedAt: article?.publishedAt ?? null,
        updatedAt: article?.updatedAt ?? null,
        summary: String(article?.summary || ''),
        content: String(article?.content || ''),
        labels: Array.isArray(article?.labels) ? article.labels.map(String) : []
      }))
      .filter((article) => {
        if (!article.id || !article.url || seen.has(article.id)) return false;
        seen.add(article.id);
        return true;
      });
  }
}
`;

await writeFile(
  path.join(targetRoot, 'src', 'adapters', 'blogger', 'BloggerFeedSource.js'),
  pagesBloggerFeedSource,
  'utf8'
);

globalThis.console.log('ZEN_ADMIN_RUNTIME=PASS');
globalThis.console.log(`ZEN_ADMIN_RUNTIME_TARGET=${path.relative(nextRoot, targetRoot)}`);
globalThis.console.log(`ZEN_ADMIN_SITE_HREF=${siteHref}`);
