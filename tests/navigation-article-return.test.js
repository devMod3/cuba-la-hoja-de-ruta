import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../src/features/navigation/NavigationFeature.js', import.meta.url),
  'utf8'
);

test('SPA article can return to Portada without a document reload', () => {
  assert.match(source, /route === 'zen-home'/);
  assert.match(source, /document\.body\.classList\.contains\('item-view'\)/);
  assert.match(source, /location\.assign\('\/#zen-home'\)/);
  assert.match(source, /location\.hash = nextHash/);
  assert.doesNotMatch(source, /!isHomepageDocument\(\)/);
});
