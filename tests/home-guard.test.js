import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/features/home/home.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../src/features/home/HomeFeature.js', import.meta.url), 'utf8');

test('Blogger feed is hidden only after HomeFeature marks home as enhanced', () => {
  assert.match(css, /#zen-home\[data-home-enhanced="true"\]\s+#page_body\s*\{[\s\S]*?display:\s*none\s*!important;/);
  assert.doesNotMatch(css, /body\.homepage-view\s+#page_body\s*\{[\s\S]*?display:\s*none\s*!important;/);
});

test('HomeFeature renders its surface before setting the enhanced guard', () => {
  const renderIndex = source.indexOf('this.renderShell();');
  const enhancedIndex = source.indexOf("this.target.dataset.homeEnhanced = 'true';");

  assert.notEqual(renderIndex, -1);
  assert.notEqual(enhancedIndex, -1);
  assert.ok(renderIndex < enhancedIndex, 'Home surface must render before Blogger feed can be hidden');
});
