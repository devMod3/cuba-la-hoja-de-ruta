import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const createZenBlog = readFileSync(new URL('../src/bootstrap/createZenBlog.js', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../tools/runtime/bootstrap.js', import.meta.url), 'utf8');
const about = readFileSync(new URL('../tools/about/bootstrap.js', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../blogger/theme.xml', import.meta.url), 'utf8');

function capture(source, pattern, label) {
  const match = source.match(pattern);
  assert.ok(match, `missing ${label}`);
  return match[1];
}

const publicVersion = capture(createZenBlog, /const VERSION = '([^']+)'/, 'createZenBlog VERSION');
const runtimeVersion = capture(runtime, /const RELEASE = '([^']+)'/, 'runtime RELEASE');
const aboutVersion = capture(about, /const RELEASE = '([^']+)'/, 'About RELEASE');

test('ZenBlog application release surfaces converge on 0.9.2', () => {
  assert.equal(packageJson.version, '0.9.2');
  assert.deepEqual(new Set([publicVersion, runtimeVersion, aboutVersion]), new Set(['0.9.2']));
});

test('deployable-shell immutable pins, when present, must all identify one payload SHA', () => {
  const pins = [...theme.matchAll(/https:\/\/cdn\.jsdelivr\.net\/gh\/devMod3\/cuba-la-hoja-de-ruta@([a-f0-9]{40})\//g)].map((match) => match[1]);

  if (pins.length === 0) {
    assert.match(theme, /https:\/\/devmod3\.github\.io\/cuba-la-hoja-de-ruta\//, 'pre-shell state should remain recognizable until the payload SHA exists');
    return;
  }

  assert.equal(new Set(pins).size, 1, 'a deployable release shell must not mix payload SHAs');
  assert.doesNotMatch(theme, /https:\/\/devmod3\.github\.io\/cuba-la-hoja-de-ruta\//, 'immutable release shell must not mix mutable GitHub Pages project assets');
});
