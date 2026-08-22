import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const RELEASE = '0.9.2';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const theme = read('blogger/theme.xml');
const entry = read('dist/zenblog.js');
const composition = read('src/bootstrap/createZenBlog.js');
const runtime = read('tools/runtime/bootstrap.js');
const about = read('tools/about/bootstrap.js');

test('Blogger pre-shell production surface uses the release cache key everywhere critical', () => {
  const immutableShell = /https:\/\/cdn\.jsdelivr\.net\/gh\/devMod3\/cuba-la-hoja-de-ruta@[a-f0-9]{40}\//.test(theme);
  if (immutableShell) return;

  for (const path of [
    'src/ui/styles/tokens.css',
    'src/ui/styles/shell.css',
    'src/features/home/home.css',
    'src/features/explore/explore.css',
    'src/features/article/article.css',
    'src/ui/styles/responsive.css',
    'dist/zenblog.js',
    'tools/runtime/bootstrap.js'
  ]) {
    assert.match(theme, new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=${RELEASE.replaceAll('.', '\\.')}`));
  }
});

test('public ES module chain is cache-busted with release 0.9.2', () => {
  assert.match(entry, new RegExp(`createZenBlog\\.js\\?v=${RELEASE.replaceAll('.', '\\.')}`));
  assert.equal(composition.includes("const VERSION = '0.9.2'"), true);
  assert.equal((composition.match(/\?v=0\.9\.2/g) || []).length >= 9, true);
  assert.equal(runtime.includes("const RELEASE = '0.9.2'"), true);
  assert.equal(about.includes("const RELEASE = '0.9.2'"), true);
});

test('social image and fallback favicon receive release identity before immutable shell pinning', () => {
  const immutableShell = /https:\/\/cdn\.jsdelivr\.net\/gh\/devMod3\/cuba-la-hoja-de-ruta@[a-f0-9]{40}\//.test(theme);
  if (immutableShell) return;
  assert.match(theme, /favicon-fallback\.png\?v=0\.9\.2/);
  assert.match(theme, /zenblog-social-card\.png\?v=0\.9\.2/);
});
