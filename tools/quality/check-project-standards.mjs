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
if (internalPackageCount > 0) globalThis.console.log('PLAYWRIGHT_RETRIES=0');
