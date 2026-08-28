import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

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

async function replaceFile(relativePath, transform, { allowUnchanged = false } = {}) {
  const file = path.join(targetRoot, relativePath);
  const source = await readFile(file, 'utf8');
  const output = transform(source);
  if (!allowUnchanged && output === source) {
    throw new Error(`Admin runtime patch made no change: ${relativePath}`);
  }
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

async function transpileAuthoringModule(packageName) {
  const sourcePath = path.join(nextRoot, 'packages', packageName, 'src', 'index.ts');
  const source = await readFile(sourcePath, 'utf8');
  const result = ts.transpileModule(source, {
    fileName: sourcePath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      verbatimModuleSyntax: true,
      removeComments: false
    },
    reportDiagnostics: true
  });
  const diagnostics = result.diagnostics ?? [];
  if (diagnostics.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) {
    const message = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (value) => value,
      getCurrentDirectory: () => nextRoot,
      getNewLine: () => '\n'
    });
    throw new Error(`Admin authoring transpilation failed for ${packageName}:\n${message}`);
  }
  return result.outputText;
}

function generatedDeclarationName(statement) {
  if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
    return statement.name?.text ?? null;
  }
  if (ts.isVariableStatement(statement) && statement.declarationList.declarations.length === 1) {
    const declaration = statement.declarationList.declarations[0];
    return ts.isIdentifier(declaration.name) ? declaration.name.text : null;
  }
  return null;
}

function removeGeneratedDeclarations(source, names, label) {
  const sourceFile = ts.createSourceFile(`${label}.js`, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const expected = new Set(names);
  const found = new Set();
  const ranges = [];
  for (const statement of sourceFile.statements) {
    const name = generatedDeclarationName(statement);
    if (!name || !expected.has(name)) continue;
    if (found.has(name)) throw new Error(`Admin runtime duplicate generated declaration: ${name}`);
    found.add(name);
    ranges.push([statement.getFullStart(), statement.end]);
  }
  const missing = names.filter((name) => !found.has(name));
  if (missing.length) {
    throw new Error(`Admin runtime generated declaration missing (${label}): ${missing.join(', ')}`);
  }
  let output = source;
  for (const [start, end] of ranges.sort((left, right) => right[0] - left[0])) {
    output = output.slice(0, start) + output.slice(end);
  }
  return output;
}

function removeGeneratedImport(source, moduleName, label) {
  const sourceFile = ts.createSourceFile(`${label}.js`, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const matches = sourceFile.statements.filter(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === moduleName
  );
  if (matches.length !== 1) {
    throw new Error(`Admin runtime expected one generated import (${label}), found ${String(matches.length)}`);
  }
  const statement = matches[0];
  return source.slice(0, statement.getFullStart()) + source.slice(statement.end);
}

await rm(targetRoot, { recursive: true, force: true });
await mkdir(targetRoot, { recursive: true });

for (const relativePath of ['tools/admin', 'tools/about', 'tools/inspector', 'tools/runtime']) {
  await cp(path.join(repoRoot, relativePath), path.join(targetRoot, relativePath), {
    recursive: true
  });
}
await mkdir(path.join(targetRoot, 'authoring'), { recursive: true });
const authoringCoreRuntime = removeGeneratedDeclarations(
  await transpileAuthoringModule('authoring-core'),
  [
    'AUTHORING_CAPABILITIES',
    'AUTHORING_FAILURE_CODES',
    'disconnectedSession',
    'hasAuthoringCapability',
    'InMemoryVersionedJsonRepository'
  ],
  'authoring-core browser runtime'
);
const authoringGitHubRuntime = removeGeneratedImport(
  await transpileAuthoringModule('authoring-github'),
  '@zenblog/authoring-core',
  'authoring-github browser import'
);
await writeFile(
  path.join(targetRoot, 'authoring', 'authoring-runtime.js'),
  `${authoringCoreRuntime.trimEnd()}\n${authoringGitHubRuntime.trimStart()}`,
  'utf8'
);

await mkdir(path.join(targetRoot, 'src', 'contracts'), { recursive: true });
await cp(
  path.join(repoRoot, 'src', 'contracts', 'ContentSource.js'),
  path.join(targetRoot, 'src', 'contracts', 'ContentSource.js')
);
await mkdir(path.join(targetRoot, 'src', 'adapters', 'blogger'), { recursive: true });

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
  output = replaceExact(
    output,
    "  loadStylesheet(new URL('./admin-shell.css', import.meta.url).href, 'zen-admin-shell-css');",
    "  loadStylesheet(new URL('./admin-shell.css', import.meta.url).href, 'zen-admin-shell-css');\n  loadStylesheet(new URL('./shared-authoring.css', import.meta.url).href, 'zen-shared-authoring-css');",
    'shared authoring stylesheet'
  );
  output = replaceExact(
    output,
    '  const adminShell = await new AdminShell({\n    metadataManager: window.ZenMetadataManager,\n    searchLab,\n    aboutManager,\n    inspectorController\n  }).mount();\n\n  window.ZenBlogAdmin = Object.freeze({',
    "  const adminShell = await new AdminShell({\n    metadataManager: window.ZenMetadataManager,\n    searchLab,\n    aboutManager,\n    inspectorController\n  }).mount();\n\n  const { SharedAuthoringController } = await import(new URL('./SharedAuthoringController.js', import.meta.url).href);\n  const sharedAuthoring = new SharedAuthoringController({\n    metadataManager: window.ZenMetadataManager,\n    aboutManager,\n    coreModuleUrl: new URL('../../authoring/authoring-runtime.js', import.meta.url).href,\n    githubModuleUrl: new URL('../../authoring/authoring-runtime.js', import.meta.url).href\n  }).mount();\n\n  window.ZenBlogAdmin = Object.freeze({",
    'Pages shared authoring controller mount'
  );
  output = replaceExact(
    output,
    "    modules: Object.freeze(['metadata', 'search-lab', 'about', 'inspector']),",
    "    modules: Object.freeze(['metadata', 'search-lab', 'about', 'inspector', 'shared-authoring']),",
    'Pages shared authoring module registry'
  );
  output = replaceExact(
    output,
    '    inspectorController,\n    adminShell',
    '    inspectorController,\n    adminShell,\n    sharedAuthoring',
    'Pages shared authoring public handle'
  );
  return output;
});

await replaceFile(
  'tools/admin/AdminShell.js',
  (source) => {
    const matches = source.match(/href="\/"/g) ?? [];
    if (matches.length !== 3) {
      throw new Error(`Expected 3 AdminShell site links, found ${String(matches.length)}`);
    }
    return source.replaceAll('href="/"', `href="${siteHref}"`);
  },
  { allowUnchanged: siteHref === '/' }
);

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
globalThis.console.log('ZEN_ADMIN_SHARED_AUTHORING=PASS');
