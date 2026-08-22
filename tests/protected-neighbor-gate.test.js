import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('T040 visible navigation and player boundary remain protected', async () => {
  const [theme, navigation] = await Promise.all([
    read('blogger/theme.xml'),
    read('src/features/navigation/NavigationFeature.js')
  ]);

  for (const [label, route] of [
    ['Portada', 'zen-home'],
    ['Explorar', 'zen-explore'],
    ['Acerca de', 'zen-about']
  ]) {
    assert.match(theme, new RegExp(`data-zen-route='${route}'[^>]*href='#${route}'[^>]*>${label}<`));
  }

  assert.match(theme, /class='zen-player-nav' href='#zen-radio-player'>Reproductor</);
  assert.doesNotMatch(theme, /data-zen-route='zen-radio-player'/);
  assert.match(navigation, /closest\('a\[data-zen-route\]'\)/);
  assert.match(navigation, /new Set\(\['zen-home', 'zen-explore', 'zen-about'\]\)/);
  assert.doesNotMatch(navigation, /zen-radio-player/);
});

test('T040 keyboard focus and native link semantics remain visible', async () => {
  const [theme, shell] = await Promise.all([
    read('blogger/theme.xml'),
    read('src/ui/styles/shell.css')
  ]);

  assert.match(theme, /<a aria-label='Ir a la portada'[^>]*href='#zen-home'>/);
  assert.match(theme, /<a data-zen-route='zen-explore' href='#zen-explore'>Explorar<\/a>/);
  assert.match(theme, /<a data-zen-route='zen-about' href='#zen-about'>Acerca de<\/a>/);
  assert.doesNotMatch(theme, /tabindex='-1'/);
  assert.match(shell, /:where\(a,button,input,select,textarea,summary\):focus-visible/);
  assert.match(shell, /\.zen-primary-nav a:focus-visible/);
});

test('T040 mobile gestures exclude interactive, reader and player surfaces', async () => {
  const gestures = await read('src/features/navigation/MobileGestureNavigation.js');

  for (const protectedSelector of [
    "'a'", "'button'", "'input'", "'select'", "'textarea'", "'summary'",
    "'#zen-radio-player'", "'#zen-article'", "'.zen-results-scroll'", "'[data-zen-no-swipe]'"
  ]) {
    assert.ok(gestures.includes(protectedSelector), `missing protected selector ${protectedSelector}`);
  }

  assert.match(gestures, /target\.closest\(INTERACTIVE_SELECTOR\)/);
  assert.match(gestures, /document\.body\.classList\.contains\('item-view'\)/);
});

test('T040 existing Explore and article contracts stay in the suite', async () => {
  const [explore, articleReturn, articleFeature] = await Promise.all([
    read('tests/explore-query.test.js'),
    read('tests/navigation-article-return.test.js'),
    read('tests/article-feature.test.js')
  ]);

  assert.match(explore, /simple Explore search is title-only/);
  assert.match(explore, /advanced Explore mode delegates only structured filters and sort/);
  assert.match(articleReturn, /SPA article can return to Portada without a document reload/);
  assert.match(articleFeature, /Blogger post URLs/);
});
