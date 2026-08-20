import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const controller = readFileSync(new URL('../tools/inspector/InspectorController.js', import.meta.url), 'utf8');
const diagnostics = readFileSync(new URL('../tools/inspector/InspectorDiagnostics.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../tools/inspector/inspector.css', import.meta.url), 'utf8');

test('inspector click opens a diagnostic modal', () => {
  assert.match(controller, /id = 'zen-inspector-modal'/);
  assert.match(controller, /openModal: true/);
  assert.match(controller, /buildInspectorLog/);
});

test('modal focuses and selects the component name first', () => {
  assert.match(controller, /this\.componentName\.focus/);
  assert.match(controller, /this\.componentName\.select\(\)/);
});

test('inspector selection cursor is an arrow instead of crosshair', () => {
  assert.doesNotMatch(css, /crosshair/);
  assert.match(css, /cursor:default!important/);
});

test('every clicked DOM element remains the exact inspection target', () => {
  assert.match(diagnostics, /element: target/);
  assert.match(diagnostics, /Elemento DOM inspeccionado directamente/);
  assert.doesNotMatch(diagnostics, /target\.closest\(item\.selector\)/);
  assert.match(diagnostics, /COMPONENTE PROPIETARIO/);
});

test('Inspector ON suppresses native link URL preview and restores hrefs afterwards', () => {
  assert.match(controller, /SAVED_HREF_ATTR = 'data-zen-inspector-href'/);
  assert.match(controller, /querySelectorAll\?\.\('a\[href\]'\)/);
  assert.match(controller, /removeAttribute\('href'\)/);
  assert.match(controller, /restoreLinks\(\)/);
  assert.match(controller, /setAttribute\('href', href\)/);
});
