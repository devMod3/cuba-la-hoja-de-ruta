import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackageManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
}

interface JsonSchemaDocument {
  readonly $schema?: string;
  readonly $id?: string;
}

interface ContentCatalog {
  readonly schemaVersion?: unknown;
  readonly articleCount?: unknown;
  readonly articles?: unknown;
}

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors: string[] = [];

async function readJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(path.join(workspaceRoot, relativePath), 'utf8')) as T;
}

const domainManifest = await readJson<PackageManifest>('packages/domain/package.json');
if (Object.keys(domainManifest.dependencies ?? {}).length > 0) {
  errors.push('domain must have zero runtime dependencies');
}

const schemaPaths = [
  'packages/content-catalog/schema/articles.schema.json',
  'packages/site-config/schema/metadata-registry.schema.json',
  'packages/site-config/schema/site-profile.schema.json',
  'packages/site-config/schema/vocabulary.schema.json'
] as const;

for (const schemaPath of schemaPaths) {
  const schema = await readJson<JsonSchemaDocument>(schemaPath);
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
    errors.push(`${schemaPath}: must use JSON Schema 2020-12`);
  }
  if (!schema.$id?.startsWith('urn:')) {
    errors.push(`${schemaPath}: schema identity must be provider-neutral URN`);
  }
}

const catalog = await readJson<ContentCatalog>('packages/content-catalog/content/articles.json');
if (catalog.schemaVersion !== '1.0.0') errors.push('content catalog schemaVersion must be 1.0.0');
if (!Array.isArray(catalog.articles)) {
  errors.push('content catalog articles must be an array');
} else {
  if (catalog.articleCount !== catalog.articles.length) {
    errors.push('content catalog articleCount must match articles length');
  }
  const ids = new Set<string>();
  for (const [index, value] of catalog.articles.entries()) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`content catalog article ${String(index)} must be an object`);
      continue;
    }
    const article = value as Record<string, unknown>;
    if ('url' in article || 'host' in article || 'origin' in article) {
      errors.push(`content catalog article ${String(index)} must not persist delivery coordinates`);
    }
    const id = article['id'];
    if (typeof id !== 'string' || !id) {
      errors.push(`content catalog article ${String(index)} requires stable id`);
    } else if (ids.has(id)) {
      errors.push(`content catalog contains duplicate id ${id}`);
    } else {
      ids.add(id);
    }
  }
}

const portableSourceFiles = [
  'packages/domain/src/article.ts',
  'packages/domain/src/metadata.ts',
  'packages/authoring-core/src/index.ts',
  'packages/content-catalog/src/index.ts'
] as const;
const vendorPattern = /(?:github\.com|github\.io|api\.github\.com|blogger|blogspot)/iu;
for (const sourcePath of portableSourceFiles) {
  if (vendorPattern.test(await readFile(path.join(workspaceRoot, sourcePath), 'utf8'))) {
    errors.push(`${sourcePath}: portable source contains vendor/host identity`);
  }
}

if (errors.length > 0) {
  globalThis.console.error('PORTABILITY_50Y_CHECK=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('PORTABILITY_50Y_CHECK=PASS');
globalThis.console.log(`STANDARD_SCHEMAS=${String(schemaPaths.length)}`);
globalThis.console.log(
  `CATALOG_ARTICLES=${String(Array.isArray(catalog.articles) ? catalog.articles.length : 0)}`
);
