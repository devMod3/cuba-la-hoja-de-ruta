import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const selfPath = fileURLToPath(import.meta.url);
const codeExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const scanRoots = ['src', 'tools', 'tests', 'next/apps', 'next/packages', 'next/tests', 'next/scripts'];
const errors = [];
let scannedFiles = 0;
let strictOptionCount = 0;
let internalPackageCount = 0;

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  if (!(await exists(directory))) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (['node_modules', '.next', 'out', 'coverage', 'playwright-report', 'test-results'].includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (codeExtensions.has(path.extname(entry.name))) files.push(fullPath);
  }

  return files;
}

function report(file, rule) {
  errors.push(`${path.relative(repoRoot, file)}: ${rule}`);
}

function requireText(source, pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

const universalRules = [
  ['TypeScript suppression is forbidden', /@ts-(?:ignore|nocheck)\b/],
  ['ESLint suppression requires architectural removal, not silence', /eslint-disable\b/],
  ['Focused tests are forbidden', /\b(?:test|it|describe)\.only\s*\(/],
  ['Skipped/fixme tests are forbidden', /\b(?:test|it|describe)\.(?:skip|fixme)\s*\(/],
  ['Untracked debt marker is forbidden', /\b(?:TODO|FIXME|HACK|XXX)\b(?![^\n]*(?:#\d+|https?:\/\/))/]
];

const typescriptRules = [
  ['Explicit any is forbidden', /(?:\bas\s+any\b|:\s*any\b|<any>|\bArray<any>\b|\bPromise<any>\b)/],
  ['Double assertion through unknown is forbidden', /\bas\s+unknown\s+as\b/],
  ['TypeScript expect-error suppression is forbidden', /@ts-expect-error\b/]
];

for (const relativeRoot of scanRoots) {
  const files = await walk(path.join(repoRoot, relativeRoot));

  for (const file of files) {
    if (path.resolve(file) === path.resolve(selfPath)) continue;
    scannedFiles += 1;
    const source = await readFile(file, 'utf8');

    for (const [message, pattern] of universalRules) {
      if (pattern.test(source)) report(file, message);
    }

    if (['.ts', '.tsx'].includes(path.extname(file))) {
      for (const [message, pattern] of typescriptRules) {
        if (pattern.test(source)) report(file, message);
      }
    }
  }
}

const rootManifestPath = path.join(repoRoot, 'package.json');
const rootManifest = JSON.parse(await readFile(rootManifestPath, 'utf8'));
const legacyCoverageScript = String(rootManifest.scripts?.['test:coverage'] ?? '');
requireText(
  legacyCoverageScript,
  /--test-coverage-lines=50(?:\s|$)/,
  'package.json: legacy line coverage floor may not fall below 50%'
);
requireText(
  legacyCoverageScript,
  /--test-coverage-branches=59(?:\s|$)/,
  'package.json: legacy branch coverage floor may not fall below 59%'
);
requireText(
  legacyCoverageScript,
  /--test-coverage-functions=57(?:\s|$)/,
  'package.json: legacy function coverage floor may not fall below 57%'
);
requireText(
  legacyCoverageScript,
  /--test-coverage-include='src\/\*\*\/\*\.js'/,
  'package.json: legacy coverage must include src/**/*.js explicitly'
);
requireText(
  legacyCoverageScript,
  /--test-coverage-include='tools\/\*\*\/\*\.js'/,
  'package.json: legacy coverage must include tools/**/*.js explicitly'
);

const nextRoot = path.join(repoRoot, 'next');
if (await exists(path.join(nextRoot, 'package.json'))) {
  const strictCompilerOptions = {
    strict: true,
    noUncheckedIndexedAccess: true,
    exactOptionalPropertyTypes: true,
    noImplicitOverride: true,
    noPropertyAccessFromIndexSignature: true,
    useUnknownInCatchVariables: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedSideEffectImports: true,
    verbatimModuleSyntax: true,
    isolatedModules: true,
    skipLibCheck: false,
    forceConsistentCasingInFileNames: true,
    noEmit: true
  };
  strictOptionCount = Object.keys(strictCompilerOptions).length;

  const baseTsconfigPath = path.join(nextRoot, 'tsconfig.base.json');
  const baseTsconfig = JSON.parse(await readFile(baseTsconfigPath, 'utf8'));
  for (const [option, requiredValue] of Object.entries(strictCompilerOptions)) {
    if (baseTsconfig.compilerOptions?.[option] !== requiredValue) {
      errors.push(`next/tsconfig.base.json: compilerOptions.${option} must be ${String(requiredValue)}`);
    }
  }

  const nextManifestPath = path.join(nextRoot, 'package.json');
  const nextManifest = JSON.parse(await readFile(nextManifestPath, 'utf8'));
  if (nextManifest.devDependencies?.['@vitest/coverage-v8'] !== '4.1.11') {
    errors.push('next/package.json: @vitest/coverage-v8 must remain exactly 4.1.11 while Vitest is 4.1.11');
  }
  if (nextManifest.devDependencies?.vitest !== '4.1.11') {
    errors.push('next/package.json: Vitest must remain exactly 4.1.11 for the current testing baseline');
  }
  if (nextManifest.scripts?.['test:coverage'] !== 'vitest run --coverage') {
    errors.push('next/package.json: test:coverage must remain the canonical Vitest coverage command');
  }
  if (!String(nextManifest.scripts?.check ?? '').includes('pnpm test:coverage')) {
    errors.push('next/package.json: pnpm check must enforce test:coverage');
  }

  const vitestConfig = await readFile(path.join(nextRoot, 'vitest.config.ts'), 'utf8');
  const requiredCoveragePolicy = [
    [/provider:\s*'v8'/, 'Vitest coverage provider must be v8'],
    [/autoUpdate:\s*false/, 'coverage thresholds may not auto-update'],
    [/statements:\s*90/, 'global statement coverage floor may not fall below 90%'],
    [/branches:\s*70/, 'global branch coverage floor may not fall below 70%'],
    [/functions:\s*90/, 'global function coverage floor may not fall below 90%'],
    [/lines:\s*95/, 'global line coverage floor may not fall below 95%'],
    [/packages\/\*\/src\/\*\*\/\*\.ts/, 'coverage must explicitly include portable package sources'],
    [/apps\/web\/adapters\/\*\*\/\*\.ts/, 'coverage must explicitly include Web adapters']
  ];
  for (const [pattern, message] of requiredCoveragePolicy) {
    requireText(vitestConfig, pattern, `next/vitest.config.ts: ${message}`);
  }
  if (/apps\/web\/components/.test(vitestConfig)) {
    errors.push(
      'next/vitest.config.ts: TSX components must not be forced through unit line coverage; they are governed by browser behavior/accessibility gates'
    );
  }

  const packageRoot = path.join(nextRoot, 'packages');
  const packageDirectories = (await readdir(packageRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const packageGraph = new Map();

  for (const directory of packageDirectories) {
    const manifestPath = path.join(packageRoot, directory.name, 'package.json');
    const tsconfigPath = path.join(packageRoot, directory.name, 'tsconfig.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const tsconfig = JSON.parse(await readFile(tsconfigPath, 'utf8'));

    if (!manifest.name?.startsWith('@zenblog/')) errors.push(`${path.relative(repoRoot, manifestPath)}: package name must use @zenblog scope`);
    if (manifest.private !== true) errors.push(`${path.relative(repoRoot, manifestPath)}: internal package must remain private`);
    if (manifest.type !== 'module') errors.push(`${path.relative(repoRoot, manifestPath)}: package must use ESM`);
    if (manifest.exports !== './src/index.ts') errors.push(`${path.relative(repoRoot, manifestPath)}: public API must be exactly ./src/index.ts`);
    if (manifest.scripts?.typecheck !== 'tsc --noEmit') errors.push(`${path.relative(repoRoot, manifestPath)}: typecheck script must be tsc --noEmit`);
    if (tsconfig.extends !== '../../tsconfig.base.json') errors.push(`${path.relative(repoRoot, tsconfigPath)}: package must inherit the canonical strict TypeScript baseline`);

    const internalDependencies = [];
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const [dependency, version] of Object.entries(manifest[section] ?? {})) {
        if (!dependency.startsWith('@zenblog/')) continue;
        internalDependencies.push(dependency);
        if (version !== 'workspace:*') {
          errors.push(`${path.relative(repoRoot, manifestPath)}: internal dependency ${dependency} must use workspace:*`);
        }
      }
    }
    packageGraph.set(manifest.name, internalDependencies);
  }

  function visitPackage(name, visiting, visited, trail) {
    if (visiting.has(name)) {
      errors.push(`next/packages: cyclic internal dependency detected: ${[...trail, name].join(' -> ')}`);
      return;
    }
    if (visited.has(name)) return;

    visiting.add(name);
    for (const dependency of packageGraph.get(name) ?? []) {
      if (packageGraph.has(dependency)) visitPackage(dependency, visiting, visited, [...trail, name]);
    }
    visiting.delete(name);
    visited.add(name);
  }

  const visited = new Set();
  for (const name of packageGraph.keys()) visitPackage(name, new Set(), visited, []);
  internalPackageCount = packageGraph.size;

  const playwrightPath = path.join(nextRoot, 'playwright.config.ts');
  const playwrightConfig = await readFile(playwrightPath, 'utf8');
  if (!/\bretries:\s*0\b/.test(playwrightConfig)) {
    errors.push('next/playwright.config.ts: retries must be 0; flaky tests may not be hidden');
  }
  if (!/\bforbidOnly:\s*true\b/.test(playwrightConfig)) {
    errors.push('next/playwright.config.ts: forbidOnly must be true in every environment');
  }
  for (const project of ['chromium', 'firefox', 'webkit', 'mobile-webkit']) {
    if (!playwrightConfig.includes(`name: '${project}'`)) {
      errors.push(`next/playwright.config.ts: required browser project missing: ${project}`);
    }
  }
}

if (errors.length) {
  globalThis.console.error('PROJECT_ENGINEERING_STANDARDS=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('PROJECT_ENGINEERING_STANDARDS=PASS');
globalThis.console.log(`SCANNED_CODE_FILES=${scannedFiles}`);
globalThis.console.log(`STRICT_TS_OPTIONS=${strictOptionCount}`);
globalThis.console.log(`INTERNAL_PACKAGES=${internalPackageCount}`);
globalThis.console.log('LEGACY_COVERAGE_FLOOR=lines:50,branches:59,functions:57');
if (internalPackageCount > 0) {
  globalThis.console.log('NEXT_COVERAGE_FLOOR=statements:90,branches:70,functions:90,lines:95');
  globalThis.console.log('PLAYWRIGHT_RETRIES=0');
}
