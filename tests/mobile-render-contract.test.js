import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/features/home/home.css', import.meta.url), 'utf8');
const tokens = readFileSync(new URL('../src/ui/styles/tokens.css', import.meta.url), 'utf8');

test('M-001 preserves deployed mobile safe-area accounting for real Blogger promotion', () => {
  assert.match(tokens, /--zen-header-h:\s*calc\(92px \+ max\(\.55rem, env\(safe-area-inset-top, 0px\)\)\)/);
  assert.match(tokens, /--zen-player-safe:\s*calc\(56px \+ env\(safe-area-inset-bottom, 0px\)\)/);
});

test('M-002 compacts Home only for bounded short-height mobile viewports', () => {
  assert.match(home, /@media\s*\(max-width:\s*760px\)\s*and\s*\(max-height:\s*760px\)/);
  assert.match(home, /max-width:\s*18ch/);
  assert.match(home, /font-size:\s*clamp\(1\.95rem,\s*8\.3vw,\s*2\.75rem\)/);
  assert.match(home, /-webkit-line-clamp:\s*1/);
});

test('M-002 keeps emergency scroll as an extreme-height fallback', () => {
  assert.match(home, /@media\s*\(max-height:\s*560px\)\s*and\s*\(max-width:\s*899px\)[\s\S]*?overflow-y:\s*auto;\s*overscroll-behavior-y:\s*contain/);
  assert.doesNotMatch(home, /@media\s*\(max-height:\s*620px\)\s*and\s*\(max-width:\s*899px\)/);
});

test('M-002 does not import unrelated deployed mobile sizing or svh behavior', () => {
  assert.match(home, /@media\s*\(max-width:\s*760px\)[\s\S]*?max-width:\s*12ch;[\s\S]*?font-size:\s*clamp\(2\.4rem,\s*10vw,\s*3\.5rem\)/);
  assert.doesNotMatch(home, /100svh/);
});
