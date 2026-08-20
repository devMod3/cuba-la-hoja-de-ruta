import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const parts = [1, 2, 3, 4].map((n) =>
  readFileSync(new URL(`../tools/admin/search-core-v1.part${n}.txt`, import.meta.url), 'utf8')
);
const source = parts.join('');
const coreModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { SearchDocument, createZenSearchCore, ZEN_VOCABULARY_V1, DOCUMENTARY_RANKING_V1 } = coreModule;

function metadata({ pillar = 'soberania', related = [], type = 'analisis', year = null, aliases = [], keywords = [] } = {}) {
  return {
    contractVersion: '1.0.0',
    identity: { postId: '1', canonicalUrl: 'https://example.test/1' },
    title: 'Documento',
    classification: { primaryPillar: pillar, relatedPillars: related, type },
    temporal: { publishedAt: null, updatedAt: null, documentYear: year, period: null },
    indexing: { concepts: [], norms: [], aliases, keywords },
    editorial: { status: null, revision: null }
  };
}

function makeCore(documents) {
  return createZenSearchCore({ documents, vocabulary: ZEN_VOCABULARY_V1, rankingConfig: DOCUMENTARY_RANKING_V1 });
}

test('Search Core browser distribution is syntactically loadable', () => {
  assert.equal(typeof createZenSearchCore, 'function');
  assert.equal(ZEN_VOCABULARY_V1.version, '1.0.0');
});

test('related pillar participates in structured filters', () => {
  const doc = new SearchDocument({ id: '1', url: 'https://example.test/1', title: 'Documento', metadata: metadata({ related: ['constitucion'], year: 1940 }) });
  assert.equal(makeCore([doc]).service.search('pilar:constitucion').length, 1);
});

test('single full-text token does not match inside a larger word', () => {
  const doc = new SearchDocument({ id: '1', url: 'https://example.test/1', title: 'Documento', metadata: metadata(), content: { headings: [], bodyText: 'Interés estadounidense.' } });
  assert.equal(makeCore([doc]).service.search('estado').length, 0);
});

test('aliases and keywords participate in retrieval', () => {
  const doc = new SearchDocument({ id: '1', url: 'https://example.test/1', title: 'Documento', metadata: metadata({ aliases: ['república constitucional'], keywords: ['vacío de poder'] }) });
  const core = makeCore([doc]);
  assert.ok(core.service.search('república').some((r) => r.reasons.some((x) => x.kind === 'aliasToken')));
  assert.ok(core.service.search('vacío').some((r) => r.reasons.some((x) => x.kind === 'keywordToken')));
});

test('documentary year ranges are supported without changing Explore', () => {
  const docs = [1940, 1959].map((year) => new SearchDocument({ id: String(year), url: `https://example.test/${year}`, title: `Documento ${year}`, metadata: { ...metadata({ year }), identity: { postId: String(year), canonicalUrl: `https://example.test/${year}` } } }));
  const core = makeCore(docs);
  const query = core.queryParser.parse('');
  query.filters.yearFrom = 1940;
  query.filters.yearTo = 1940;
  const results = core.service.search(query);
  assert.deepEqual(results.map((r) => r.document.id), ['1940']);
});
