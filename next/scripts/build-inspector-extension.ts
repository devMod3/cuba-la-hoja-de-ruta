import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

interface ExtensionManifest {
  readonly manifest_version?: unknown;
  readonly permissions?: unknown;
  readonly host_permissions?: unknown;
  readonly content_scripts?: unknown;
  readonly web_accessible_resources?: unknown;
  readonly background?: Readonly<Record<string, unknown>>;
}

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionRoot = path.join(workspaceRoot, 'apps', 'inspector-extension');
const sourceRoot = path.join(extensionRoot, 'src');
const outputRoot = path.join(extensionRoot, 'dist');
const entrypoints = ['diagnostics.ts', 'content.ts', 'service-worker.ts'] as const;

const manifestText = await readFile(path.join(extensionRoot, 'manifest.json'), 'utf8');
const manifest = JSON.parse(manifestText) as ExtensionManifest;
const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
if (manifest.manifest_version !== 3) throw new Error('Inspector extension must use Manifest V3.');
if (JSON.stringify(permissions) !== JSON.stringify(['activeTab', 'scripting'])) {
  throw new Error('Inspector extension permissions must remain exactly activeTab + scripting.');
}
for (const forbidden of [
  'host_permissions',
  'content_scripts',
  'web_accessible_resources'
] as const) {
  if (manifest[forbidden] !== undefined) {
    throw new Error(`Inspector extension may not declare ${forbidden}.`);
  }
}
if (manifest.background?.['service_worker'] !== 'service-worker.js') {
  throw new Error('Inspector extension service worker entrypoint is invalid.');
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const entrypoint of entrypoints) {
  const source = await readFile(path.join(sourceRoot, entrypoint), 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      removeComments: false,
      sourceMap: false
    },
    fileName: entrypoint,
    reportDiagnostics: true
  });
  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (errors.length > 0) {
    const details = errors
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      .join('\n');
    throw new Error(`Inspector extension transpilation failed for ${entrypoint}:\n${details}`);
  }
  await writeFile(
    path.join(outputRoot, entrypoint.replace(/\.ts$/u, '.js')),
    result.outputText,
    'utf8'
  );
}

await writeFile(path.join(outputRoot, 'manifest.json'), manifestText, 'utf8');
globalThis.console.log(`INSPECTOR_EXTENSION_BUILD=PASS files=${String(entrypoints.length + 1)}`);
