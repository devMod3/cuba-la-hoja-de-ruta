import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const nextRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.join(nextRoot, 'apps', 'web');
const args = new Set(globalThis.process.argv.slice(2));
const targetRoot = args.has('--public')
  ? path.join(webRoot, 'public', 'zen-admin')
  : path.join(webRoot, 'out', 'zen-admin');
const controllerPath = path.join(targetRoot, 'tools', 'admin', 'SharedAuthoringController.js');
const authoringRoot = path.join(targetRoot, 'authoring');
const authoringPath = path.join(authoringRoot, 'authoring-runtime.js');
const bundledPath = path.join(targetRoot, 'tools', 'admin', 'shared-authoring-runtime.js');
const bootstrapPath = path.join(targetRoot, 'tools', 'admin', 'bootstrap.js');

function replaceExactCount(source, before, after, expectedCount, label) {
  const count = source.split(before).length - 1;
  if (count !== expectedCount) {
    throw new Error(
      `Admin runtime compaction expected ${expectedCount} marker(s) for ${label}, found ${count}`
    );
  }
  return source.replaceAll(before, after);
}

function specializeControllerBody(source) {
  let output = replaceExactCount(
    source,
    '    githubModuleUrl,\n',
    '',
    1,
    'controller redundant module URL parameter'
  );
  output = replaceExactCount(
    output,
    '    this.githubModuleUrl = githubModuleUrl;\n',
    '',
    1,
    'controller redundant module URL assignment'
  );
  output = replaceExactCount(
    output,
    "  async loadAuthoringModules() {\n    if (this.core && this.github) return;\n    if (!this.coreModuleUrl || !this.githubModuleUrl) {\n      throw new Error('Shared authoring module URLs are unavailable');\n    }\n    const [core, github] = await Promise.all([\n      import(this.coreModuleUrl),\n      import(this.githubModuleUrl)\n    ]);\n    this.core = core;\n    this.github = github;\n  }\n\n",
    "  async loadAuthoringModules() {\n    if (this.core && this.github) return;\n    if (!this.coreModuleUrl) throw new Error('Authoring unavailable');\n    const authoring = await import(this.coreModuleUrl);\n    this.core = authoring;\n    this.github = authoring;\n  }\n\n",
    1,
    'controller bundled authoring loader'
  );
  return output;
}

function splitControllerModule(source) {
  const sourceFile = ts.createSourceFile(
    'SharedAuthoringController.js',
    source,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.JS
  );
  const imports = sourceFile.statements.filter((statement) => ts.isImportDeclaration(statement));
  if (imports.length !== 1) {
    throw new Error(
      `Admin runtime compaction expected one controller import, found ${imports.length}`
    );
  }
  const statement = imports[0];
  const importsSource = source.slice(statement.getFullStart(), statement.end).trim();
  let body = source.slice(0, statement.getFullStart()) + source.slice(statement.end);
  body = replaceExactCount(
    body,
    'export class SharedAuthoringController',
    'class SharedAuthoringController',
    1,
    'controller export'
  );
  body = specializeControllerBody(body).trim();
  return { importsSource, body };
}

const [controllerSource, authoringSource, bootstrapSource] = await Promise.all([
  readFile(controllerPath, 'utf8'),
  readFile(authoringPath, 'utf8'),
  readFile(bootstrapPath, 'utf8')
]);
const controller = splitControllerModule(controllerSource);
const bundledSource = `${controller.importsSource}\n${authoringSource.trim()}\nconst SharedAuthoringController = (() => {\n${controller.body}\nreturn SharedAuthoringController;\n})();\nexport { SharedAuthoringController };\n`;
await writeFile(bundledPath, bundledSource, 'utf8');

let bootstrap = replaceExactCount(
  bootstrapSource,
  './SharedAuthoringController.js',
  './shared-authoring-runtime.js',
  1,
  'controller module URL'
);
bootstrap = replaceExactCount(
  bootstrap,
  "    coreModuleUrl: new URL('../../authoring/authoring-runtime.js', import.meta.url).href,\n    githubModuleUrl: new URL('../../authoring/authoring-runtime.js', import.meta.url).href\n",
  "    coreModuleUrl: new URL('./shared-authoring-runtime.js', import.meta.url).href\n",
  1,
  'bundled authoring module URL options'
);
await writeFile(bootstrapPath, bootstrap, 'utf8');
await rm(controllerPath);
await rm(authoringRoot, { recursive: true, force: true });

globalThis.console.log('ZEN_ADMIN_RUNTIME_COMPACT=PASS');
globalThis.console.log(`ZEN_ADMIN_RUNTIME_COMPACT_TARGET=${path.relative(nextRoot, targetRoot)}`);
