import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tokens = readFileSync(new URL('../src/ui/styles/tokens.css', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/features/home/home.css', import.meta.url), 'utf8');
const about = readFileSync(new URL('../tools/about/about.css', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../blogger/theme.xml', import.meta.url), 'utf8');

test('mobile header height accounts for iOS safe area', () => {
  assert.match(tokens, /--zen-header-h:\s*calc\(92px \+ max\(\.55rem, env\(safe-area-inset-top, 0px\)\)\)/);
  assert.match(tokens, /--zen-player-safe:\s*calc\(56px \+ env\(safe-area-inset-bottom, 0px\)\)/);
});

test('Home has compact short-phone mode before emergency scrolling', () => {
  assert.match(home, /max-width:\s*760px\) and \(max-height:\s*760px/);
  assert.match(home, /max-width:\s*18ch/);
  assert.match(home, /-webkit-line-clamp:\s*1/);
  assert.match(home, /max-height:\s*560px/);
});

test('About keeps portrait and identity side-by-side on normal phones', () => {
  assert.match(about, /@media\(max-width:500px\)/);
  assert.match(about, /grid-template-columns:92px minmax\(0,1fr\)/);
  assert.match(about, /@media\(max-width:340px\)/);
  assert.match(about, /grid-template-columns:1fr/);
});

test('About stylesheet is declared by Blogger head to prevent layout flash', () => {
  assert.match(theme, /id='zen-about-css'/);
  assert.match(theme, /tools\/about\/about\.css\?v=0\.9\.2/);
});
