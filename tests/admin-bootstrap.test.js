import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bootstrap = readFileSync(new URL('../tools/admin/bootstrap.js', import.meta.url), 'utf8');
const metadataSource = [1, 2, 3, 4]
  .map((index) => readFileSync(new URL(`../tools/admin/metadata-manager-v0.5.part${index}.txt`, import.meta.url), 'utf8'))
  .join('');

test('admin bootstrap is scoped to /admin and /p/admin.html', () => {
  assert.match(bootstrap, /'\/admin'/);
  assert.match(bootstrap, /'\/p\/admin\.html'/);
  assert.match(bootstrap, /history\.replaceState/);
});

test('externalized Metadata Manager source reconstructs valid JavaScript', () => {
  assert.doesNotThrow(() => new Function(metadataSource));
  assert.match(metadataSource, /zenMetadataRegistry\.v2/);
  assert.match(metadataSource, /zenmetadata:changed/);
  assert.match(metadataSource, /window\.ZenMetadataManager/);
});
