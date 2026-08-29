import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import manifestData from '../package.json' with { type: 'json' };
import baselineData from '../security/dependency-baseline.json' with { type: 'json' };

interface DependencyBaseline {
  readonly packageManager: string;
  readonly nodeEngine: string;
  readonly pnpmEngine: string;
  readonly lockfileSha256: string;
  readonly lockfileEntries: number;
  readonly minimumReleaseAgeMinutes: number;
  readonly allowedBuildScripts: readonly string[];
}

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative: string): Promise<string> =>
  readFile(path.join(workspaceRoot, relative), 'utf8');
const baseline: DependencyBaseline = baselineData;
const [workspaceText, lockfileText] = await Promise.all([
  read('pnpm-workspace.yaml'),
  read('pnpm-lock.yaml')
]);
const errors: string[] = [];

const lockfileSha256 = createHash('sha256').update(lockfileText).digest('hex');
const countIntegrityEntries = (text: string): number =>
  [...text.matchAll(/\bintegrity:\s+\S+/gu)].length;
const integrityCounterCases: readonly (readonly [string, string, number])[] = [
  ['inline integrity', 'resolution: {integrity: sha512-inline}', 1],
  ['multiline integrity', 'resolution:\n  {\n    integrity: sha512-multiline\n  }', 1],
  ['no integrity', 'resolution: {tarball: archive.tgz}', 0]
];
for (const [label, sample, expectedMatches] of integrityCounterCases) {
  const actualMatches = countIntegrityEntries(sample);
  if (actualMatches !== expectedMatches) {
    errors.push(
      `integrity counter self-test failed (${label}): expected ${String(expectedMatches)}, found ${String(actualMatches)}`
    );
  }
}
const integrityEntries = countIntegrityEntries(lockfileText);
const exoticProtocol = String.raw`(?:git\+|github:|http://|https://|ssh://|git://)`;
const externalSourceValuePattern = new RegExp(
  String.raw`^\s*(?:specifier|version|resolution|tarball):[^\n]*${exoticProtocol}`,
  'gmu'
);

function findExternalSourceValues(text: string): string[] {
  return [...text.matchAll(externalSourceValuePattern)].map((match) => match[0].trim());
}

const policyCases: readonly (readonly [string, string, number])[] = [
  ['workspace importer name', '  packages/authoring-github:\n', 0],
  ['GitHub specifier', '        specifier: github:owner/repository\n', 1],
  ['HTTPS tarball resolution', '    resolution: {tarball: https://example.test/archive.tgz}\n', 1],
  ['ordinary workspace link', '        version: link:../authoring-core\n', 0]
];
for (const [label, sample, expectedMatches] of policyCases) {
  const actualMatches = findExternalSourceValues(sample).length;
  if (actualMatches !== expectedMatches) {
    errors.push(
      `external-source policy self-test failed (${label}): expected ${String(expectedMatches)}, found ${String(actualMatches)}`
    );
  }
}

if (manifestData.packageManager !== baseline.packageManager) {
  errors.push(
    `packageManager changed: expected ${baseline.packageManager}, found ${manifestData.packageManager}`
  );
}
if (manifestData.engines.node !== baseline.nodeEngine) {
  errors.push(
    `Node engine changed: expected ${baseline.nodeEngine}, found ${manifestData.engines.node}`
  );
}
if (manifestData.engines.pnpm !== baseline.pnpmEngine) {
  errors.push(
    `pnpm engine changed: expected ${baseline.pnpmEngine}, found ${manifestData.engines.pnpm}`
  );
}
if (lockfileSha256 !== baseline.lockfileSha256) {
  errors.push(
    `lockfile SHA-256 changed: expected ${baseline.lockfileSha256}, found ${lockfileSha256}`
  );
}
if (integrityEntries !== baseline.lockfileEntries) {
  errors.push(
    `lockfile integrity-entry count changed: expected ${String(baseline.lockfileEntries)}, found ${String(integrityEntries)}`
  );
}

const externalSourceMatches = findExternalSourceValues(lockfileText);
if (externalSourceMatches.length > 0)
  errors.push(
    `lockfile contains disallowed external source value: ${externalSourceMatches[0] ?? ''}`
  );

for (const setting of [
  'engineStrict: true',
  'strictPeerDependencies: true',
  `minimumReleaseAge: ${String(baseline.minimumReleaseAgeMinutes)}`,
  'blockExoticSubdeps: true',
  'strictDepBuilds: true'
] as const) {
  if (!workspaceText.includes(setting)) errors.push(`pnpm workspace policy missing: ${setting}`);
}

const allowBuildSection = workspaceText.split(/\nallowBuilds:\s*\n/u)[1] ?? '';
const actualAllowedBuilds = [...allowBuildSection.matchAll(/^\s{2}'([^']+)': true\s*$/gmu)]
  .map((match) => match[1] ?? '')
  .filter(Boolean)
  .sort();
const expectedAllowedBuilds = [...baseline.allowedBuildScripts].sort();
if (JSON.stringify(actualAllowedBuilds) !== JSON.stringify(expectedAllowedBuilds)) {
  errors.push(
    `build-script allowlist changed: expected ${expectedAllowedBuilds.join(', ') || '(none)'}, found ${actualAllowedBuilds.join(', ') || '(none)'}`
  );
}

if (errors.length > 0) {
  globalThis.console.error('SUPPLY_CHAIN_BASELINE_CHECK=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('SUPPLY_CHAIN_BASELINE_CHECK=PASS');
globalThis.console.log(`LOCKFILE_SHA256=${lockfileSha256}`);
globalThis.console.log(`INTEGRITY_ENTRIES=${String(integrityEntries)}`);
globalThis.console.log(`ALLOWED_BUILD_SCRIPTS=${actualAllowedBuilds.join(',')}`);
