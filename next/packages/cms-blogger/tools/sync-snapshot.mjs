import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { BloggerFeedSource } from '../src/index.ts';
import {
  BLOGGER_ORIGIN,
  createBloggerSnapshot,
  renderSnapshot,
  renderSnapshotMetadata
} from './snapshot-contract.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDirectory = path.resolve(packageRoot, '../content-snapshot/content');
const snapshotPath = path.join(contentDirectory, 'blogger.snapshot.json');
const metadataPath = path.join(contentDirectory, 'blogger.snapshot.metadata.txt');
const modeArgument = process.argv.find((argument) => argument.startsWith('--mode='));
const mode = modeArgument?.slice('--mode='.length) ?? 'check';

if (!['check', 'sync', 'self-test'].includes(mode)) {
  throw new Error('Usage: sync-snapshot.mjs --mode=check|sync|self-test');
}

const sourceBaseUrl = process.env.ZENBLOG_BLOGGER_ORIGIN ?? BLOGGER_ORIGIN;
if (new globalThis.URL(sourceBaseUrl).origin !== BLOGGER_ORIGIN) {
  throw new Error(`ZENBLOG_BLOGGER_ORIGIN must resolve to ${BLOGGER_ORIGIN}`);
}

const currentSnapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));

if (mode === 'self-test') {
  if (typeof BloggerFeedSource !== 'function') {
    throw new Error('BloggerFeedSource failed to load in the Node control-plane runtime');
  }
  if (typeof currentSnapshot.contentSha256 !== 'string') {
    throw new Error('Checked-in Blogger snapshot failed to load in the control-plane runtime');
  }
  globalThis.console.log('BLOGGER_CONTROL_PLANE_BOOTSTRAP=PASS');
  process.exit(0);
}

const fetcher = (url, init) =>
  globalThis.fetch(url, {
    ...init,
    signal: globalThis.AbortSignal.timeout(15_000)
  });
const source = new BloggerFeedSource({ baseUrl: sourceBaseUrl, fetcher });
const articles = await source.listPosts();

if (currentSnapshot.articleCount > 0 && articles.length === 0) {
  throw new Error('Blogger synchronization returned zero articles; refusing destructive snapshot');
}

const probe = createBloggerSnapshot({
  articles,
  syncedAt: currentSnapshot.syncedAt,
  baseUrl: sourceBaseUrl
});
const contentChanged =
  probe.contentSha256 !== currentSnapshot.contentSha256 ||
  probe.articleCount !== currentSnapshot.articleCount;

if (!contentChanged) {
  globalThis.console.log('BLOGGER_SNAPSHOT_REMOTE=UNCHANGED');
  globalThis.console.log(`ARTICLES=${probe.articleCount}`);
  globalThis.console.log(`CONTENT_SHA256=${probe.contentSha256}`);
  process.exit(0);
}

if (mode === 'check') {
  globalThis.console.error('BLOGGER_SNAPSHOT_REMOTE=STALE');
  globalThis.console.error(`LOCAL_SHA256=${String(currentSnapshot.contentSha256)}`);
  globalThis.console.error(`REMOTE_SHA256=${probe.contentSha256}`);
  process.exit(2);
}

const nextSnapshot = createBloggerSnapshot({
  articles,
  syncedAt: new Date(),
  baseUrl: sourceBaseUrl
});
const snapshotTemporary = `${snapshotPath}.tmp-${process.pid}`;
const metadataTemporary = `${metadataPath}.tmp-${process.pid}`;

try {
  await Promise.all([
    writeFile(snapshotTemporary, renderSnapshot(nextSnapshot), { encoding: 'utf8', flag: 'wx' }),
    writeFile(metadataTemporary, renderSnapshotMetadata(nextSnapshot), {
      encoding: 'utf8',
      flag: 'wx'
    })
  ]);
  await rename(snapshotTemporary, snapshotPath);
  await rename(metadataTemporary, metadataPath);
} finally {
  await Promise.allSettled([unlink(snapshotTemporary), unlink(metadataTemporary)]);
}

globalThis.console.log('BLOGGER_SNAPSHOT_REMOTE=SYNCED');
globalThis.console.log(`ARTICLES=${nextSnapshot.articleCount}`);
globalThis.console.log(`CONTENT_SHA256=${nextSnapshot.contentSha256}`);
