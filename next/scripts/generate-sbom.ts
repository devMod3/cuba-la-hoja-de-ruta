import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface CycloneDxBom {
  readonly bomFormat?: unknown;
  readonly specVersion?: unknown;
  readonly components?: unknown;
}

function asBom(value: unknown): CycloneDxBom {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function componentVersion(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const version = (value as Record<string, unknown>)['version'];
  return typeof version === 'string' && version.length > 0 ? version : null;
}

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pnpmCommand = globalThis.process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const result = spawnSync(
  pnpmCommand,
  ['sbom', '--sbom-format', 'cyclonedx', '--sbom-spec-version', '1.7'],
  {
    cwd: workspaceRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  }
);

if (result.status !== 0) {
  globalThis.console.error('SBOM_GENERATION=FAIL');
  globalThis.console.error(result.stderr || result.stdout || 'pnpm sbom failed without output');
  globalThis.process.exit(result.status ?? 1);
}

let parsed: unknown;
try {
  parsed = JSON.parse(result.stdout) as unknown;
} catch (error) {
  globalThis.console.error('SBOM_GENERATION=FAIL');
  globalThis.console.error(`Invalid JSON from pnpm sbom: ${String(error)}`);
  globalThis.process.exit(1);
}
const bom = asBom(parsed);
const errors: string[] = [];
if (bom.bomFormat !== 'CycloneDX') errors.push(`unexpected bomFormat: ${String(bom.bomFormat)}`);
if (bom.specVersion !== '1.7') errors.push(`unexpected specVersion: ${String(bom.specVersion)}`);
const components = isUnknownArray(bom.components) ? bom.components : [];
if (components.length === 0) errors.push('SBOM contains no components');
const componentsWithoutVersion = components.filter(
  (component) => componentVersion(component) === null
);
if (componentsWithoutVersion.length > 0)
  errors.push(`SBOM components missing version: ${String(componentsWithoutVersion.length)}`);

if (errors.length > 0) {
  globalThis.console.error('SBOM_VALIDATION=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

const reportsDirectory = path.join(workspaceRoot, 'security-reports');
await mkdir(reportsDirectory, { recursive: true });
await writeFile(
  path.join(reportsDirectory, 'sbom.cdx.json'),
  `${JSON.stringify(parsed, null, 2)}\n`
);
globalThis.console.log('SBOM_VALIDATION=PASS');
globalThis.console.log(`SBOM_COMPONENTS=${String(components.length)}`);
globalThis.console.log('SBOM_SPEC=CYCLONEDX_1.7');
