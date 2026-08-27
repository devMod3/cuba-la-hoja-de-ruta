import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFile(path.join(workspaceRoot, relative), 'utf8');

const [packageText, workspaceText, lockfileText, baselineText] = await Promise.all([
  read('package.json'),
  read('pnpm-workspace.yaml'),
  read('pnpm-lock.yaml'),
  read('security/dependency-baseline.json')
]);

const manifest = JSON.parse(packageText);
const baseline = JSON.parse(baselineText);
const errors = [];

const lockfileSha256 = createHash('sha256').update(lockfileText).digest('hex');
const integrityEntries = [...lockfileText.matchAll(/resolution: \{integrity: /g)].length;
const exoticProtocol = String.raw`(?:git\+|github:|http://|https://|ssh://|git://)`;
const externalSourceValuePattern = new RegExp(
  String.raw`^\s*(?:specifier|version|resolution|tarball):[^\n]*${exoticProtocol}`,
  'gm'
);

function findExternalSourceValues(text) {
  return [...text.matchAll(externalSourceValuePattern)].map((match) => match[0].trim());
}

const policyCases = [
  ['workspace importer name', '  packages/authoring-github:\n', 0],
  ['GitHub specifier', '        specifier: github:owner/repository\n', 1],
  ['HTTPS tarball resolution', '    resolution: {tarball: https://example.test/archive.tgz}\n', 1],
  ['ordinary workspace link', '        version: link:../authoring-core\n', 0]
];
for (const [label, sample, expectedMatches] of policyCases) {
  const actualMatches = findExternalSourceValues(sample).length;
  if (actualMatches !== expectedMatches) {
    errors.push(
      `external-source policy self-test failed (${label}): expected ${expectedMatches}, found ${actualMatches}`
    );
  }
}

if (manifest.packageManager !== baseline.packageManager) {
  errors.push(
    `packageManager changed: expected ${baseline.packageManager}, found ${String(manifest.packageManager)}`
  );
}

if (manifest.engines?.node !== baseline.nodeEngine) {
  errors.push(
    `Node engine changed: expected ${baseline.nodeEngine}, found ${String(manifest.engines?.node)}`
  );
}

if (lockfileSha256 !== baseline.lockfileSha256) {
  errors.push(
    `lockfile SHA-256 changed: expected ${baseline.lockfileSha256}, found ${lockfileSha256}`
  );
}

if (integrityEntries !== baseline.lockfileEntries) {
  errors.push(
    `lockfile integrity-entry count changed: expected ${baseline.lockfileEntries}, found ${integrityEntries}`
  );
}

const externalSourceMatches = findExternalSourceValues(lockfileText);
if (externalSourceMatches.length > 0) {
  errors.push(`lockfile contains disallowed external source value: ${externalSourceMatches[0]}`);
}

const requiredWorkspaceSettings = [
  'engineStrict: true',
  'strictPeerDependencies: true',
  `minimumReleaseAge: ${baseline.minimumReleaseAgeMinutes}`,
  'blockExoticSubdeps: true',
  'strictDepBuilds: true'
];

for (const setting of requiredWorkspaceSettings) {
  if (!workspaceText.includes(setting)) errors.push(`pnpm workspace policy missing: ${setting}`);
}

const allowBuildSection = workspaceText.split(/\nallowBuilds:\s*\n/)[1] ?? '';
const actualAllowedBuilds = [...allowBuildSection.matchAll(/^\s{2}'([^']+)': true\s*$/gm)]
  .map((match) => match[1])
  .sort();
const expectedAllowedBuilds = [...baseline.allowedBuildScripts].sort();

if (JSON.stringify(actualAllowedBuilds) !== JSON.stringify(expectedAllowedBuilds)) {
  errors.push(
    `build-script allowlist changed: expected ${expectedAllowedBuilds.join(', ') || '(none)'}, found ${actualAllowedBuilds.join(', ') || '(none)'}`
  );
}

if (errors.length) {
  globalThis.console.error('SUPPLY_CHAIN_BASELINE_CHECK=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('SUPPLY_CHAIN_BASELINE_CHECK=PASS');
globalThis.console.log(`LOCKFILE_SHA256=${lockfileSha256}`);
globalThis.console.log(`INTEGRITY_ENTRIES=${integrityEntries}`);
globalThis.console.log(`ALLOWED_BUILD_SCRIPTS=${actualAllowedBuilds.join(',')}`);
