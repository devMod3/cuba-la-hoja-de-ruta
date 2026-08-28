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
const auxiliaryRuntimePath = path.join(targetRoot, 'tools', 'runtime', 'bootstrap.js');

function replaceExactCount(source, before, after, expectedCount, label) {
  const count = source.split(before).length - 1;
  if (count !== expectedCount) {
    throw new Error(
      `Admin runtime compaction expected ${expectedCount} marker(s) for ${label}, found ${count}`
    );
  }
  return source.replaceAll(before, after);
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

function removeExactDeclarations(source, names, label) {
  const sourceFile = ts.createSourceFile(
    `${label}.js`,
    source,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.JS
  );
  const expected = new Set(names);
  const found = new Set();
  const ranges = [];
  for (const statement of sourceFile.statements) {
    const name = generatedDeclarationName(statement);
    if (!name || !expected.has(name)) continue;
    if (found.has(name)) throw new Error(`Admin runtime duplicate declaration: ${name}`);
    found.add(name);
    ranges.push([statement.getFullStart(), statement.end]);
  }
  const missing = names.filter((name) => !found.has(name));
  if (missing.length) {
    throw new Error(`Admin runtime declaration missing (${label}): ${missing.join(', ')}`);
  }
  let output = source;
  for (const [start, end] of ranges.sort((left, right) => right[0] - left[0])) {
    output = output.slice(0, start) + output.slice(end);
  }
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
  ).trim();
  return { importsSource, body };
}

function compactAuxiliaryRuntime(source) {
  let output = removeExactDeclarations(
    source,
    ['BLOGGER_ADMIN_PAGE', 'normalizeAdminSegment', 'isAdminLocation'],
    'Next auxiliary runtime'
  );
  output = replaceExactCount(
    output,
    "async function boot() {\n  if (isAdminLocation()) {\n    await import(releaseUrl('../admin/bootstrap.js'));\n    return;\n  }\n\n",
    'async function boot() {\n',
    1,
    'Next-dead auxiliary Admin branch'
  );
  return output;
}

const [controllerSource, authoringSource, bootstrapSource, auxiliaryRuntimeSource] =
  await Promise.all([
    readFile(controllerPath, 'utf8'),
    readFile(authoringPath, 'utf8'),
    readFile(bootstrapPath, 'utf8'),
    readFile(auxiliaryRuntimePath, 'utf8')
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
  '../../authoring/authoring-runtime.js',
  './shared-authoring-runtime.js',
  2,
  'authoring module URL'
);
await Promise.all([
  writeFile(bootstrapPath, bootstrap, 'utf8'),
  writeFile(auxiliaryRuntimePath, compactAuxiliaryRuntime(auxiliaryRuntimeSource), 'utf8')
]);
await rm(controllerPath);
await rm(authoringRoot, { recursive: true, force: true });

globalThis.console.log('ZEN_ADMIN_RUNTIME_COMPACT=PASS');
globalThis.console.log(`ZEN_ADMIN_RUNTIME_COMPACT_TARGET=${path.relative(nextRoot, targetRoot)}`);
globalThis.console.log('ZEN_ADMIN_AUXILIARY_RUNTIME=PUBLIC_ONLY');
