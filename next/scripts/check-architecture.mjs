import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);

const boundaries = [
  {
    name: '@zenblog/domain',
    root: 'packages/domain',
    sourceRoots: ['src'],
    allowedInternal: [],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/content-snapshot',
    root: 'packages/content-snapshot',
    sourceRoots: ['src'],
    allowedInternal: ['@zenblog/domain'],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/content-renderer',
    root: 'packages/content-renderer',
    sourceRoots: ['src'],
    allowedInternal: [],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/search-core',
    root: 'packages/search-core',
    sourceRoots: ['src'],
    allowedInternal: ['@zenblog/domain'],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/cms-blogger',
    root: 'packages/cms-blogger',
    sourceRoots: ['src'],
    allowedInternal: ['@zenblog/domain'],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/zrp-adapter',
    root: 'packages/zrp-adapter',
    sourceRoots: ['src'],
    allowedInternal: [],
    forbiddenExternal: ['next', 'react', 'react-dom'],
    forbidNodeBuiltins: true
  },
  {
    name: '@zenblog/web',
    root: 'apps/web',
    sourceRoots: ['app', 'components', 'adapters'],
    allowedInternal: [
      '@zenblog/content-renderer',
      '@zenblog/content-snapshot',
      '@zenblog/domain',
      '@zenblog/search-core',
      '@zenblog/zrp-adapter'
    ],
    serverOnlyInternal: ['@zenblog/content-renderer'],
    forbiddenExternal: [],
    forbidNodeBuiltins: false
  }
];

const dependencySections = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
];
const errors = [];

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (sourceExtensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function importedSpecifiers(source) {
  const values = new Set();
  const patterns = [
    /(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) values.add(match[1]);
  }
  return [...values];
}

function internalPackage(specifier) {
  if (!specifier.startsWith('@zenblog/')) return null;
  const [scope, name] = specifier.split('/');
  return `${scope}/${name}`;
}

for (const boundary of boundaries) {
  const packageRoot = path.join(workspaceRoot, boundary.root);
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const manifest = JSON.parse(await readFile(packageJsonPath, 'utf8'));

  if (manifest.name !== boundary.name) {
    errors.push(
      `${boundary.root}/package.json: expected name ${boundary.name}, found ${String(manifest.name)}`
    );
  }

  for (const section of dependencySections) {
    for (const dependency of Object.keys(manifest[section] ?? {})) {
      if (dependency.startsWith('@zenblog/') && !boundary.allowedInternal.includes(dependency)) {
        errors.push(
          `${boundary.root}/package.json: ${boundary.name} may not declare ${dependency} in ${section}`
        );
      }
      if (boundary.forbiddenExternal.includes(dependency)) {
        errors.push(
          `${boundary.root}/package.json: ${boundary.name} may not depend on ${dependency}`
        );
      }
    }
  }

  const files = [];
  for (const relativeSourceRoot of boundary.sourceRoots) {
    files.push(...(await walk(path.join(packageRoot, relativeSourceRoot))));
  }

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const relativeFile = path.relative(workspaceRoot, file);
    const isClientModule = /^\s*['"]use client['"]\s*;/.test(source);

    for (const specifier of importedSpecifiers(source)) {
      if (specifier.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), specifier);
        if (!isInside(packageRoot, resolved)) {
          errors.push(`${relativeFile}: relative import escapes package boundary: ${specifier}`);
        }
        continue;
      }

      if (boundary.forbidNodeBuiltins && specifier.startsWith('node:')) {
        errors.push(
          `${relativeFile}: ${boundary.name} must remain runtime-portable; node builtin forbidden: ${specifier}`
        );
      }

      const internal = internalPackage(specifier);
      if (internal) {
        if (!boundary.allowedInternal.includes(internal)) {
          errors.push(`${relativeFile}: ${boundary.name} may not import ${specifier}`);
        } else if (specifier !== internal) {
          errors.push(
            `${relativeFile}: deep internal import forbidden; import public package root ${internal}, not ${specifier}`
          );
        }

        if (isClientModule && boundary.serverOnlyInternal?.includes(internal)) {
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

if (errors.length) {
  globalThis.console.error('ARCHITECTURE_BOUNDARY_CHECK=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('ARCHITECTURE_BOUNDARY_CHECK=PASS');
globalThis.console.log(`BOUNDARIES=${boundaries.length}`);
