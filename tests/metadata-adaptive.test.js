import test from 'node:test';
import assert from 'node:assert/strict';
import { ADAPTIVE_RULES, preferredBlocks } from '../tools/admin/AdaptiveMetadataUI.js';

test('adaptive metadata policy covers the seven document types', () => {
  assert.equal(Object.keys(ADAPTIVE_RULES).length, 7);
  for (const type of ['concepto','analisis','norma','documento','cronologia','historia','dossier']) {
    assert.ok(ADAPTIVE_RULES[type]);
  }
});

test('norma prioritizes norm references and documentary year', () => {
  assert.deepEqual(preferredBlocks('norma'), ['norms', 'year']);
});

test('concepto prioritizes controlled concepts', () => {
  assert.deepEqual(preferredBlocks('concepto'), ['concepts']);
});

test('unregistered type has no automatic priorities', () => {
  assert.deepEqual(preferredBlocks('otro'), []);
});
