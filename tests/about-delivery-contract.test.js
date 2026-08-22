import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const theme = readFileSync(new URL('../blogger/theme.xml', import.meta.url), 'utf8');
const bootstrap = readFileSync(new URL('../tools/about/bootstrap.js', import.meta.url), 'utf8');

test('M-003 keeps About CSS off the global reader critical path', () => {
  assert.doesNotMatch(theme, /id='zen-about-css'/);
  assert.doesNotMatch(theme, /tools\/about\/about\.css/);
});

test('M-003 lazy bootstrap owns one stylesheet and waits before About mount', () => {
  assert.match(bootstrap, /document\.getElementById\(ABOUT_STYLESHEET_ID\)/);
  assert.match(bootstrap, /link\.id = ABOUT_STYLESHEET_ID/);
  assert.match(bootstrap, /const stylesheetReady = await loadStylesheet\(\)/);

  const awaitIndex = bootstrap.indexOf('const stylesheetReady = await loadStylesheet()');
  const mountIndex = bootstrap.indexOf('new AboutFeature({ store }).mount()');
  assert.ok(awaitIndex >= 0 && mountIndex > awaitIndex, 'About must mount only after stylesheet readiness');
});

test('M-003 preserves server fallback when the lazy stylesheet fails', () => {
  const failureIndex = bootstrap.indexOf('if (!stylesheetReady)');
  const mountIndex = bootstrap.indexOf('new AboutFeature({ store }).mount()');
  assert.ok(failureIndex >= 0 && mountIndex > failureIndex);
  assert.match(bootstrap, /se conserva el fallback/);
  assert.match(bootstrap, /About stylesheet failed to load/);
});
