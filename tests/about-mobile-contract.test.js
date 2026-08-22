import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const aboutCss = await readFile(new URL('../tools/about/about.css', import.meta.url), 'utf8');
const themeXml = await readFile(new URL('../blogger/theme.xml', import.meta.url), 'utf8');

function mediaBlock(maxWidth) {
  const marker = `@media(max-width:${maxWidth}px){`;
  const start = aboutCss.indexOf(marker);
  assert.notEqual(start, -1, `missing ${marker}`);
  let depth = 0;
  for (let index = start; index < aboutCss.length; index += 1) {
    if (aboutCss[index] === '{') depth += 1;
    if (aboutCss[index] === '}') {
      depth -= 1;
      if (depth === 0) return aboutCss.slice(start, index + 1);
    }
  }
  throw new Error(`unclosed ${marker}`);
}

test('M-004 keeps populated About compact on normal phones and stacks only when truly narrow', () => {
  const phone = mediaBlock(500);
  const narrow = mediaBlock(340);

  assert.match(phone, /grid-template-columns:96px minmax\(0,1fr\)/);
  assert.doesNotMatch(phone, /grid-template-columns:1fr/);
  assert.match(narrow, /grid-template-columns:1fr/);
});

test('M-004 owns player-safe spacing and overflow resilience inside About CSS', () => {
  assert.match(aboutCss, /overscroll-behavior-y:contain/);
  assert.match(mediaBlock(700), /padding-bottom:var\(--zen-player-safe,56px\)!important/);
  assert.match(aboutCss, /overflow-wrap:anywhere/);
  assert.match(aboutCss, /flex-wrap:wrap/);
});

test('M-004 does not retain obsolete viewport-unit or historical runtime delivery rules', () => {
  assert.doesNotMatch(aboutCss, /100dvh|100svh/);
  assert.equal((aboutCss.match(/@media\(max-width:500px\)\{/g) || []).length, 1);
  assert.equal((aboutCss.match(/@media\(max-width:340px\)\{/g) || []).length, 1);
  assert.doesNotMatch(themeXml, /about-production-v0\.1\.5\.css/);
});
