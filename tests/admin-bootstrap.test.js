import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bootstrap = readFileSync(new URL('../tools/admin/bootstrap.js', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../tools/runtime/bootstrap.js', import.meta.url), 'utf8');
const metadataSource = [1, 2, 3, 4]
  .map((index) => readFileSync(new URL(`../tools/admin/metadata-manager-v0.5.part${index}.txt`, import.meta.url), 'utf8'))
  .join('');

test('Blogger Admin accepts canonical, Blogger-page, path-suffix and hash-suffix /admin routes', () => {
  for (const source of [runtime, bootstrap]) {
    assert.match(source, /BLOGGER_ADMIN_PAGE = '\/p\/admin\.html'/);
    assert.match(source, /path === '\/admin'/);
    assert.match(source, /path\.endsWith\('\/admin'\)/);
    assert.match(source, /hashPath === 'admin'/);
    assert.match(source, /hashPath\.endsWith\('\/admin'\)/);
  }
  assert.match(runtime, /await import\(releaseUrl\('\.\.\/admin\/bootstrap\.js'\)\);[\s\S]*?return;/);
  assert.match(bootstrap, /history\.replaceState\(history\.state \?\? \{\}, '', `\/admin\$\{location\.search\}`\)/);
});

test('externalized Metadata Manager source reconstructs valid JavaScript', () => {
  assert.doesNotThrow(() => new Function(metadataSource));
  assert.match(metadataSource, /zenMetadataRegistry\.v2/);
  assert.match(metadataSource, /zenmetadata:changed/);
  assert.match(metadataSource, /window\.ZenMetadataManager/);
});
