import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackageManifest {
  readonly name?: string;
  readonly private?: boolean;
  readonly type?: string;
  readonly exports?: string;
  readonly scripts?: Readonly<Record<string, string>>;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly optionalDependencies?: Readonly<Record<string, string>>;
}

interface TypeScriptConfig {
  readonly extends?: string;
  readonly compilerOptions?: Readonly<Record<string, unknown>>;
}

type Rule = readonly [message: string, pattern: RegExp];

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const selfPath = fileURLToPath(import.meta.url);
const codeExtensions: ReadonlySet<string> = new Set(['.ts', '.tsx']);
const scanRoots = ['apps', 'packages', 'tests', 'scripts'] as const;
const errors: string[] = [];
let scannedFiles = 0;

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory: string): Promise<string[]> {
  if (!(await exists(directory))) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (
      ['node_modules', '.next', 'out', 'coverage', 'playwright-report', 'test-results'].includes(
        entry.name
      )
    )
      continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (codeExtensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T;
}

function report(file: string, message: string): void {
  errors.push(`${path.relative(workspaceRoot, file).replaceAll(path.sep, '/')}: ${message}`);
}

const universalRules: readonly Rule[] = [
  ['TypeScript suppression is forbidden', /@ts-(?:ignore|nocheck|expect-error)\b/u],
  ['ESLint suppression is forbidden', /eslint-disable\b/u],
  ['Focused tests are forbidden', /\b(?:test|it|describe)\.only\s*\(/u],
  ['Skipped/fixme tests are forbidden', /\b(?:test|it|describe)\.(?:skip|fixme)\s*\(/u],
  [
    'Untracked debt marker is forbidden',
    /\b(?:TODO|FIXME|HACK|XXX)\b(?![^\n]*(?:#\d+|https?:\/\/))/u
  ]
];

for (const root of scanRoots) {
  for (const file of await walk(path.join(workspaceRoot, root))) {
    scannedFiles += 1;
    const source = await readFile(file, 'utf8');
    if (file === selfPath) continue;
    for (const [message, pattern] of universalRules) {
      if (pattern.test(source)) report(file, message);
    }
  }
}

const tsconfig = await readJson<TypeScriptConfig>(path.join(workspaceRoot, 'tsconfig.base.json'));
const compilerOptions = tsconfig.compilerOptions ?? {};
const requiredBooleanOptions = [
  'strict',
  'noUncheckedIndexedAccess',
  'exactOptionalPropertyTypes',
  'noImplicitOverride',
  'noPropertyAccessFromIndexSignature',
  'useUnknownInCatchVariables',
  'noFallthroughCasesInSwitch',
  'noUncheckedSideEffectImports',
  'verbatimModuleSyntax',
  'isolatedModules',
  'erasableSyntaxOnly',
  'allowImportingTsExtensions',
  'resolveJsonModule',
  'forceConsistentCasingInFileNames',
  'noEmit'
] as const;
for (const option of requiredBooleanOptions) {
  if (compilerOptions[option] !== true)
    errors.push(`tsconfig.base.json: ${option} must remain true`);
}
if (compilerOptions['skipLibCheck'] !== false)
  errors.push('tsconfig.base.json: skipLibCheck must remain false');

const rootManifest = await readJson<PackageManifest>(path.join(workspaceRoot, 'package.json'));
const checkScript = rootManifest.scripts?.['check'] ?? '';
for (const required of [
  'pnpm format:check',
  'pnpm lint',
  'pnpm source:typescript',
  'pnpm project:standards',
  'pnpm architecture:check',
  'pnpm security:check',
  'pnpm typecheck',
  'pnpm typecheck:quality',
  'pnpm test:coverage',
  'pnpm build',
  'pnpm static:articles:check',
  'pnpm seo:ownership:check',
  'pnpm performance:budget'
] as const) {
  if (!checkScript.includes(required))
    errors.push(`package.json: pnpm check must enforce ${required}`);
}
for (const obsolete of [
  'blogger',
  'cms-blogger',
  'content:snapshot',
  'control-plane',
  'prepare-admin-runtime',
  'compact-admin-runtime'
] as const) {
  if (JSON.stringify(rootManifest).toLowerCase().includes(obsolete)) {
    errors.push(`package.json: obsolete migration/runtime dependency remains: ${obsolete}`);
  }
}

const vitestConfig = await readFile(path.join(workspaceRoot, 'vitest.config.ts'), 'utf8');
for (const [pattern, message] of [
  [/provider:\s*'v8'/u, 'coverage provider must be v8'],
  [/autoUpdate:\s*false/u, 'coverage thresholds may not auto-update'],
  [/statements:\s*90/u, 'global statement floor must be >= 90'],
  [/branches:\s*70/u, 'global branch floor must be >= 70'],
  [/functions:\s*90/u, 'global function floor must be >= 90'],
  [/lines:\s*95/u, 'global line floor must be >= 95'],
  [/packages\/\*\/src\/\*\*\/\*\.ts/u, 'portable package sources must be covered'],
  [/apps\/web\/adapters\/\*\*\/\*\.ts/u, 'web adapters must be covered']
] as const) {
  if (!pattern.test(vitestConfig)) errors.push(`vitest.config.ts: ${message}`);
}
if (/cms-blogger|content-snapshot/u.test(vitestConfig))
  errors.push('vitest.config.ts: migration packages may not remain in coverage policy');

const packageRoot = path.join(workspaceRoot, 'packages');
const packageDirectories = (await readdir(packageRoot, { withFileTypes: true })).filter((entry) =>
  entry.isDirectory()
);
const graph = new Map<string, readonly string[]>();
for (const directory of packageDirectories) {
  const manifestPath = path.join(packageRoot, directory.name, 'package.json');
  const configPath = path.join(packageRoot, directory.name, 'tsconfig.json');
  const manifest = await readJson<PackageManifest>(manifestPath);
  const packageTsconfig = await readJson<TypeScriptConfig>(configPath);
  if (!manifest.name?.startsWith('@zenblog/'))
    report(manifestPath, 'package name must use @zenblog scope');
  if (manifest.private !== true) report(manifestPath, 'internal package must remain private');
  if (manifest.type !== 'module') report(manifestPath, 'package must use ESM');
  if (manifest.exports !== './src/index.ts')
    report(manifestPath, 'public API must be exactly ./src/index.ts');
  if (manifest.scripts?.['typecheck'] !== 'tsc --noEmit')
    report(manifestPath, 'typecheck script must be tsc --noEmit');
  if (packageTsconfig.extends !== '../../tsconfig.base.json')
    report(configPath, 'package must inherit canonical strict TypeScript baseline');

  const internal: string[] = [];
  for (const section of [
    manifest.dependencies,
    manifest.devDependencies,
    manifest.peerDependencies,
    manifest.optionalDependencies
  ]) {
    for (const [dependency, version] of Object.entries(section ?? {})) {
      if (!dependency.startsWith('@zenblog/')) continue;
      internal.push(dependency);
      if (version !== 'workspace:*') report(manifestPath, `${dependency} must use workspace:*`);
    }
  }
  if (manifest.name) graph.set(manifest.name, internal);
}

function visit(
  name: string,
  visiting: Set<string>,
  visited: Set<string>,
  trail: readonly string[]
): void {
  if (visiting.has(name)) {
    errors.push(`packages: cyclic internal dependency: ${[...trail, name].join(' -> ')}`);
    return;
  }
  if (visited.has(name)) return;
  visiting.add(name);
  for (const dependency of graph.get(name) ?? []) {
    if (graph.has(dependency)) visit(dependency, visiting, visited, [...trail, name]);
  }
  visiting.delete(name);
  visited.add(name);
}
const visited = new Set<string>();
for (const name of graph.keys()) visit(name, new Set<string>(), visited, []);

const playwrightConfig = await readFile(path.join(workspaceRoot, 'playwright.config.ts'), 'utf8');
if (!/\bretries:\s*0\b/u.test(playwrightConfig))
  errors.push('playwright.config.ts: retries must be 0');
if (!/\bforbidOnly:\s*true\b/u.test(playwrightConfig))
  errors.push('playwright.config.ts: forbidOnly must be true');
for (const project of ['chromium', 'firefox', 'webkit', 'mobile-webkit'] as const) {
  if (!playwrightConfig.includes(`name: '${project}'`))
    errors.push(`playwright.config.ts: missing project ${project}`);
}

if (errors.length > 0) {
  globalThis.console.error('PROJECT_ENGINEERING_STANDARDS=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('PROJECT_ENGINEERING_STANDARDS=PASS');
globalThis.console.log(`SCANNED_CODE_FILES=${String(scannedFiles)}`);
globalThis.console.log(`STRICT_TS_OPTIONS=${String(requiredBooleanOptions.length)}`);
globalThis.console.log(`INTERNAL_PACKAGES=${String(graph.size)}`);
globalThis.console.log('NEXT_COVERAGE_FLOOR=statements:90,branches:70,functions:90,lines:95');
globalThis.console.log('PLAYWRIGHT_RETRIES=0');
