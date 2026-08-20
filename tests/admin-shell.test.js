import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const adminShell = readFileSync(new URL('../tools/admin/AdminShell.js', import.meta.url), 'utf8');
const bootstrap = readFileSync(new URL('../tools/admin/bootstrap.js', import.meta.url), 'utf8');
const responsive = readFileSync(new URL('../src/ui/styles/responsive.css', import.meta.url), 'utf8');

test('admin exposes Metadata Search Lab About and Inspector as top-level tabs', () => {
  for (const label of ['Metadata', 'Search Lab', 'Acerca de', 'Inspector']) assert.match(adminShell, new RegExp(`label: '${label}'`));
});

test('legacy metadata launcher is removed after compatibility boot', () => {
  assert.match(bootstrap, /removeLegacyMetadataLauncher\(\)/);
  assert.doesNotMatch(bootstrap, /launcher\.innerHTML/);
});

test('responsive foundation explicitly covers desktop tablet and mobile transitions', () => {
  assert.match(responsive, /min-width:761px\) and \(max-width:899px/);
  assert.match(responsive, /min-width:761px\) and \(max-width:1023px/);
  assert.match(responsive, /max-width:760px/);
});
