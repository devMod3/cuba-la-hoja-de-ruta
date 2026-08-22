import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tokens = readFileSync(new URL('../src/ui/styles/tokens.css', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/features/home/home.css', import.meta.url), 'utf8');
const responsive = readFileSync(new URL('../src/ui/styles/responsive.css', import.meta.url), 'utf8');
const gestures = readFileSync(new URL('../src/features/navigation/MobileGestureNavigation.js', import.meta.url), 'utf8');

test('mobile layout keeps header and player spacing behind shared tokens', () => {
  assert.match(tokens, /--zen-header-h\s*:/);
  assert.match(tokens, /--zen-player-safe\s*:/);
  assert.match(tokens, /--zen-safe-inline\s*:/);
  assert.match(home, /calc\(100dvh\s*-\s*var\(--zen-header-h\)\s*-\s*var\(--zen-player-safe\)\)/);
});

test('Home retains a bounded short-height escape hatch without freezing its threshold', () => {
  assert.match(home, /@media\s*\(max-height:\s*\d+px\)[^{]*\{[\s\S]*?#zen-home\[data-home-enhanced="true"\][^{]*\{[^}]*overflow-y:\s*auto/);
});

test('responsive foundation protects safe inline areas touch targets and horizontal overflow', () => {
  assert.match(responsive, /safe-area-inset-left/);
  assert.match(responsive, /safe-area-inset-right/);
  assert.match(responsive, /min-height:\s*44px/);
  assert.match(responsive, /overflow-x:\s*hidden/);
});

test('mobile gestures remain optional around protected reader and player surfaces', () => {
  assert.match(gestures, /pointer:\s*coarse/);
  assert.match(gestures, /#zen-radio-player/);
  assert.match(gestures, /#zen-article/);
  assert.match(gestures, /\.zen-results-scroll/);
});
