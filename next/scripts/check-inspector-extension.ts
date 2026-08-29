import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const errors: string[] = [];

async function exists(relativePath: string): Promise<boolean> {
  try {
    await access(path.join(workspaceRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

const manifest = JSON.parse(
  await readFile(path.join(extensionRoot, 'manifest.json'), 'utf8')
) as ExtensionManifest;
const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
if (manifest.manifest_version !== 3) errors.push('Manifest V3 is required.');
if (JSON.stringify(permissions) !== JSON.stringify(['activeTab', 'scripting'])) {
  errors.push('permissions must remain exactly activeTab + scripting.');
}
for (const forbidden of [
  'host_permissions',
  'content_scripts',
  'web_accessible_resources'
] as const) {
  if (manifest[forbidden] !== undefined) errors.push(`${forbidden} must remain absent.`);
}
if (manifest.background?.['service_worker'] !== 'service-worker.js') {
  errors.push('background.service_worker must remain service-worker.js.');
}

const runtimeEntries = ['diagnostics.ts', 'content.ts', 'service-worker.ts'] as const;
const importPattern = /(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/gu;
const forbiddenRuntimePattern =
  /\b(?:fetch\s*\(|XMLHttpRequest\b|WebSocket\b|EventSource\b|sendBeacon\s*\(|localStorage\b|sessionStorage\b|chrome\.storage\b)/u;
for (const entry of runtimeEntries) {
  const source = await readFile(path.join(sourceRoot, entry), 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (specifier) errors.push(`${entry}: runtime import is forbidden: ${specifier}`);
  }
  if (forbiddenRuntimePattern.test(source)) {
    errors.push(`${entry}: runtime must remain local-only and non-persistent.`);
  }
}

for (const legacy of [
  'apps/web/components/inspector-runtime.tsx',
  'apps/web/components/inspector-state.ts',
  'apps/web/components/inspector-diagnostics.ts',
  'apps/web/app/inspector.css'
] as const) {
  if (await exists(legacy)) errors.push(`${legacy}: embedded site Inspector must remain removed.`);
}

const layout = await readFile(path.join(workspaceRoot, 'apps/web/app/layout.tsx'), 'utf8');
if (/InspectorRuntime|inspector\.css/u.test(layout)) {
  errors.push('apps/web/app/layout.tsx: public site may not load Inspector runtime or CSS.');
}

if (errors.length > 0) {
  globalThis.console.error('INSPECTOR_EXTENSION_CONTRACT=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('INSPECTOR_EXTENSION_CONTRACT=PASS');
globalThis.console.log('INSPECTOR_PERMISSIONS=activeTab,scripting');
globalThis.console.log('INSPECTOR_HOST_PERMISSIONS=none');
