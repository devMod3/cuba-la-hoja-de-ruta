import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const xml = readFileSync(new URL('../blogger/theme.xml', import.meta.url), 'utf8');
const SHA = 'feaa8f561295204edbe1fa15d13a341899602fdd';

test('LAB theme pins project assets to one immutable commit', () => {
  const projectUrls = [...xml.matchAll(/https:\/\/cdn\.jsdelivr\.net\/gh\/devMod3\/cuba-la-hoja-de-ruta@([a-f0-9]{40})\//g)].map((m) => m[1]);
  assert.ok(projectUrls.length >= 8);
  assert.deepEqual(new Set(projectUrls), new Set([SHA]));
});

test('LAB theme does not load unmerged project code from GitHub Pages main', () => {
  assert.doesNotMatch(xml, /https:\/\/devmod3\.github\.io\/cuba-la-hoja-de-ruta\//);
});

test('Home and About runtime entrypoints are both present', () => {
  assert.match(xml, new RegExp(`${SHA}/dist/zenblog\\.js`));
  assert.match(xml, new RegExp(`${SHA}/tools/runtime/bootstrap\\.js`));
});
