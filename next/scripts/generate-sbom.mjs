import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

let bom;
try {
  bom = JSON.parse(result.stdout);
} catch (error) {
  globalThis.console.error('SBOM_GENERATION=FAIL');
  globalThis.console.error(`Invalid JSON from pnpm sbom: ${String(error)}`);
  globalThis.process.exit(1);
}

const errors = [];
if (bom.bomFormat !== 'CycloneDX') errors.push(`unexpected bomFormat: ${String(bom.bomFormat)}`);
if (bom.specVersion !== '1.7') errors.push(`unexpected specVersion: ${String(bom.specVersion)}`);
if (!Array.isArray(bom.components) || bom.components.length === 0) {
  errors.push('SBOM contains no components');
}

const componentsWithoutVersion = (bom.components ?? []).filter(
  (component) => typeof component?.version !== 'string' || component.version.length === 0
);
if (componentsWithoutVersion.length) {
  errors.push(`SBOM components missing version: ${componentsWithoutVersion.length}`);
}

if (errors.length) {
  globalThis.console.error('SBOM_VALIDATION=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

const reportsDirectory = path.join(workspaceRoot, 'security-reports');
await mkdir(reportsDirectory, { recursive: true });
await writeFile(path.join(reportsDirectory, 'sbom.cdx.json'), `${JSON.stringify(bom, null, 2)}\n`);

globalThis.console.log('SBOM_VALIDATION=PASS');
globalThis.console.log(`SBOM_COMPONENTS=${bom.components.length}`);
globalThis.console.log('SBOM_SPEC=CYCLONEDX_1.7');
