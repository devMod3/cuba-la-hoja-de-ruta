import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDirectory = path.join(workspaceRoot, 'packages/content-snapshot/content');
const snapshotPath = path.join(contentDirectory, 'blogger.snapshot.json');
const metadataPath = path.join(contentDirectory, 'blogger.snapshot.metadata.txt');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const metadata = Object.fromEntries(
  (await readFile(metadataPath, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    })
);
const errors = [];
const expectedOrigin = 'https://cubalahojaderuta.blogspot.com';

if (snapshot.schemaVersion !== 1) errors.push('schemaVersion must be 1');
if (snapshot.source?.type !== 'blogger') errors.push('source.type must be blogger');

try {
  if (new globalThis.URL(snapshot.source?.baseUrl ?? '').origin !== expectedOrigin) {
    errors.push(`source.baseUrl must use ${expectedOrigin}`);
  }
} catch {
  errors.push('source.baseUrl must be a valid URL');
}

if (!Array.isArray(snapshot.articles)) {
  errors.push('articles must be an array');
} else {
  if (snapshot.articleCount !== snapshot.articles.length) {
    errors.push(`articleCount mismatch: ${snapshot.articleCount} != ${snapshot.articles.length}`);
  }

  const ids = new Set();
  const urls = new Set();
  for (const [index, article] of snapshot.articles.entries()) {
    if (!article || typeof article !== 'object') {
      errors.push(`articles[${index}] must be an object`);
      continue;
    }

    if (typeof article.id !== 'string' || !article.id) {
      errors.push(`articles[${index}].id must be a non-empty string`);
    } else if (ids.has(article.id)) {
      errors.push(`duplicate article id: ${article.id}`);
    } else {
      ids.add(article.id);
    }

    if (typeof article.url !== 'string' || !article.url) {
      errors.push(`articles[${index}].url must be a non-empty string`);
    } else {
      try {
        const url = new globalThis.URL(article.url);
        if (url.origin !== expectedOrigin) {
          errors.push(`article ${String(article.id)} escapes canonical Blogger origin`);
        }
        if (urls.has(url.href)) errors.push(`duplicate article URL: ${url.href}`);
        urls.add(url.href);
      } catch {
        errors.push(`articles[${index}].url must be valid`);
      }
    }
  }

  const canonicalOrder = snapshot.articles.toSorted((left, right) => {
    const byPublished = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
    return byPublished || String(left.id).localeCompare(String(right.id));
  });
  if (JSON.stringify(canonicalOrder) !== JSON.stringify(snapshot.articles)) {
    errors.push('articles must use canonical published-descending order');
  }

  const canonicalPayload = JSON.stringify(snapshot.articles);
  const actualSha256 = createHash('sha256').update(canonicalPayload).digest('hex');
  if (snapshot.contentSha256 !== actualSha256) {
    errors.push(`contentSha256 mismatch: ${String(snapshot.contentSha256)} != ${actualSha256}`);
  }
}

if (typeof snapshot.syncedAt !== 'string' || !Number.isFinite(Date.parse(snapshot.syncedAt))) {
  errors.push('syncedAt must be an ISO-compatible date string');
}

if (metadata.contentSha256 !== snapshot.contentSha256) {
  errors.push('metadata contentSha256 must match snapshot');
}
if (metadata.articleCount !== String(snapshot.articleCount)) {
  errors.push('metadata articleCount must match snapshot');
}
if (metadata.syncedAt !== snapshot.syncedAt) {
  errors.push('metadata syncedAt must match snapshot');
}

if (errors.length) {
  globalThis.console.error('BLOGGER_SNAPSHOT_CHECK=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('BLOGGER_SNAPSHOT_CHECK=PASS');
globalThis.console.log(`ARTICLES=${snapshot.articleCount}`);
globalThis.console.log(`CONTENT_SHA256=${snapshot.contentSha256}`);
globalThis.console.log('SNAPSHOT_METADATA_COHERENCE=PASS');
