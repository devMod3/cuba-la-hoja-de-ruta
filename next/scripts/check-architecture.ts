import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackageManifest {
  readonly name?: string;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly optionalDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
}

interface Boundary {
  readonly name: string;
  readonly root: string;
  readonly sourceRoots: readonly string[];
  readonly allowedInternal: readonly string[];
  readonly allowedExternal: readonly string[];
  readonly forbiddenExternal: readonly string[];
  readonly forbidNodeBuiltins: boolean;
  readonly serverOnlyInternal?: readonly string[];
}

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceExtensions: ReadonlySet<string> = new Set(['.ts', '.tsx']);
const dependencySections = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
] as const;

const boundaries: readonly Boundary[] = [
  {
    name: '@zenblog/domain',
    root: 'packages/domain',
    sourceRoots: ['src'],
    allowedInternal: [],
    allowedExternal: [],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/authoring-core',
    root: 'packages/authoring-core',
    sourceRoots: ['src'],
    allowedInternal: [],
    allowedExternal: [],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/authoring-github',
    root: 'packages/authoring-github',
    sourceRoots: ['src'],
    allowedInternal: ['@zenblog/authoring-core'],
    allowedExternal: [],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/site-config',
    root: 'packages/site-config',
    sourceRoots: ['src'],
    allowedInternal: ['@zenblog/domain'],
    allowedExternal: [],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/content-catalog',
    root: 'packages/content-catalog',
    sourceRoots: ['src'],
    allowedInternal: ['@zenblog/domain'],
    allowedExternal: [],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/content-renderer',
    root: 'packages/content-renderer',
    sourceRoots: ['src'],
    allowedInternal: [],
    allowedExternal: ['sanitize-html', '@types/sanitize-html'],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/search-core',
    root: 'packages/search-core',
    sourceRoots: ['src'],
    allowedInternal: ['@zenblog/domain'],
    allowedExternal: [],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/zrp-adapter',
    root: 'packages/zrp-adapter',
    sourceRoots: ['src'],
    allowedInternal: [],
    allowedExternal: [],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/web',
    root: 'apps/web',
    sourceRoots: ['app', 'components', 'adapters', 'lib'],
    allowedInternal: [
      '@zenblog/authoring-core',
      '@zenblog/authoring-github',
      '@zenblog/content-catalog',
      '@zenblog/content-renderer',
      '@zenblog/domain',
      '@zenblog/search-core',
      '@zenblog/site-config',
      '@zenblog/zrp-adapter'
    ],
    serverOnlyInternal: ['@zenblog/content-renderer'],
    allowedExternal: ['next', 'react', 'react-dom', '@types/react', '@types/react-dom'],
    forbiddenExternal: [],
    forbidNodeBuiltins: false
  }
];

const errors: string[] = [];

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (sourceExtensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function importedSpecifiers(source: string): readonly string[] {
  const values = new Set<string>();
  const patterns: readonly RegExp[] = [
    /(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/gu,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/gu
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier) values.add(specifier);
    }
  }
  return [...values];
}

function internalPackage(specifier: string): string | null {
  if (!specifier.startsWith('@zenblog/')) return null;
  const parts = specifier.split('/');
  const scope = parts[0];
  const name = parts[1];
  return scope && name ? `${scope}/${name}` : null;
}

function dependencyRecord(
  manifest: PackageManifest,
  section: (typeof dependencySections)[number]
): Readonly<Record<string, string>> {
  return manifest[section] ?? {};
}

for (const boundary of boundaries) {
  const packageRoot = path.join(workspaceRoot, boundary.root);
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const manifest = JSON.parse(await readFile(packageJsonPath, 'utf8')) as PackageManifest;

  if (manifest.name !== boundary.name) {
    errors.push(
      `${boundary.root}/package.json: expected ${boundary.name}, found ${String(manifest.name)}`
    );
  }

  for (const section of dependencySections) {
    for (const dependency of Object.keys(dependencyRecord(manifest, section))) {
      if (dependency.startsWith('@zenblog/')) {
        if (!boundary.allowedInternal.includes(dependency)) {
          errors.push(
            `${boundary.root}/package.json: ${boundary.name} may not declare ${dependency} in ${section}`
          );
        }
        continue;
      }
      if (!boundary.allowedExternal.includes(dependency)) {
        errors.push(
          `${boundary.root}/package.json: undeclared architectural dependency ${dependency} in ${section}`
        );
      }
      if (boundary.forbiddenExternal.includes(dependency)) {
        errors.push(
          `${boundary.root}/package.json: ${boundary.name} may not depend on ${dependency}`
        );
      }
    }
  }

  const files: string[] = [];
  for (const sourceRoot of boundary.sourceRoots) {
    files.push(...(await walk(path.join(packageRoot, sourceRoot))));
  }

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const relativeFile = path.relative(workspaceRoot, file).replaceAll(path.sep, '/');
    const isClientModule = /^\s*['"]use client['"]\s*;/u.test(source);
    const serverOnlyInternal = boundary.serverOnlyInternal ?? [];

    for (const specifier of importedSpecifiers(source)) {
      if (specifier.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), specifier);
        if (!isInside(packageRoot, resolved)) {
          errors.push(`${relativeFile}: relative import escapes package boundary: ${specifier}`);
        }
        continue;
      }

      if (boundary.forbidNodeBuiltins && specifier.startsWith('node:')) {
        errors.push(`${relativeFile}: portable package may not import Node builtin ${specifier}`);
      }

      const internal = internalPackage(specifier);
      if (internal) {
        if (!boundary.allowedInternal.includes(internal)) {
          errors.push(`${relativeFile}: ${boundary.name} may not import ${specifier}`);
        } else if (specifier !== internal) {
          errors.push(`${relativeFile}: deep package import forbidden; use ${internal}`);
        }
        if (isClientModule && serverOnlyInternal.includes(internal)) {
          errors.push(
            `${relativeFile}: client module may not import server-only package ${internal}`
          );
        }
      }

      for (const external of boundary.forbiddenExternal) {
        if (specifier === external || specifier.startsWith(`${external}/`)) {
          errors.push(
            `${relativeFile}: ${boundary.name} may not import framework dependency ${specifier}`
          );
        }
      }
    }
  }
}

// SOLID/DIP gate: concrete infrastructure is wired only in the Admin composition root.
const webRoot = path.join(workspaceRoot, 'apps/web');
for (const file of await walk(webRoot)) {
  const source = await readFile(file, 'utf8');
  const relativeFile = path.relative(workspaceRoot, file).replaceAll(path.sep, '/');
  if (!importedSpecifiers(source).includes('@zenblog/authoring-github')) continue;
  if (relativeFile !== 'apps/web/components/admin/admin-shell.tsx') {
    errors.push(
      `${relativeFile}: DIP violation; @zenblog/authoring-github is allowed only in Admin composition root`
    );
  }
}

const sharedAuthoring = await readFile(
  path.join(workspaceRoot, 'apps/web/components/admin/shared-authoring.tsx'),
  'utf8'
);
if (!sharedAuthoring.includes('type AuthoringConnector')) {
  errors.push(
    'apps/web/components/admin/shared-authoring.tsx: UI must depend on AuthoringConnector abstraction'
  );
}

// 50-year portability gate: inner layers must not encode current vendors or deployment hosts.
const portableRoots = [
  'packages/domain/src',
  'packages/authoring-core/src',
  'packages/site-config/src',
  'packages/content-catalog/src',
  'packages/search-core/src',
  'packages/content-renderer/src'
] as const;
const vendorPattern = /(?:github\.com|github\.io|api\.github\.com|blogger|blogspot)/iu;
for (const root of portableRoots) {
  for (const file of await walk(path.join(workspaceRoot, root))) {
    const source = await readFile(file, 'utf8');
    if (vendorPattern.test(source)) {
      errors.push(
        `${path.relative(workspaceRoot, file).replaceAll(path.sep, '/')}: portable core encodes a vendor/host`
      );
    }
  }
}

const domainManifest = JSON.parse(
  await readFile(path.join(workspaceRoot, 'packages/domain/package.json'), 'utf8')
) as PackageManifest;
if (Object.keys(domainManifest.dependencies ?? {}).length > 0) {
  errors.push('packages/domain/package.json: domain must remain runtime-dependency-free');
}

const authoringCoreSource = await readFile(
  path.join(workspaceRoot, 'packages/authoring-core/src/index.ts'),
  'utf8'
);
if (/metadata-registry|site-profile/u.test(authoringCoreSource)) {
  errors.push('packages/authoring-core: core may not enumerate application document keys');
}

if (errors.length > 0) {
  globalThis.console.error('ARCHITECTURE_BOUNDARY_CHECK=FAIL');
  globalThis.console.error('SOLID_ARCHITECTURE_CHECK=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('ARCHITECTURE_BOUNDARY_CHECK=PASS');
globalThis.console.log('SOLID_ARCHITECTURE_CHECK=PASS');
globalThis.console.log(`BOUNDARIES=${String(boundaries.length)}`);
