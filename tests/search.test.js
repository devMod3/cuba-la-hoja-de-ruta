import test from 'node:test';
import assert from 'node:assert/strict';
import { SearchService } from '../src/search/SearchService.js';

const service = new SearchService();

const posts = [
  {
    id: '101',
    title: 'Qué es pueblo',
    url: 'https://example.test/pueblo',
    publishedAt: '2026-08-01T12:00:00Z'
  },
  {
    id: '102',
    title: 'Artículo 40 de la Constitución de 1940',
    url: 'https://example.test/articulo-40',
    publishedAt: '2026-08-02T12:00:00Z'
  }
];

const registry = {
  records: {
    '101': {
      classification: {
        primaryPillar: 'soberania',
        relatedPillars: ['constitucion'],
        type: 'concepto'
      },
      temporal: { documentYear: 1940 },
      indexing: {
        concepts: ['pueblo', 'soberania-popular'],
        norms: [{ normId: 'c40', articles: ['2'] }],
        aliases: [],
        keywords: []
      },
      editorial: { status: 'verificado' }
    },
    '102': {
      classification: {
        primaryPillar: 'constitucion',
        relatedPillars: [],
        type: 'norma'
      },
      temporal: { documentYear: 1940 },
      indexing: {
        concepts: [],
        norms: [{ normId: 'c40', articles: ['40'] }],
        aliases: [],
        keywords: []
      },
      editorial: { status: 'verificado' }
    }
  }
};

test('search is accent-insensitive', () => {
  const results = service.search({ posts, registry, query: 'soberanía popular', sort: 'relevance' });
  assert.equal(results[0].post.id, '101');
});

test('search resolves structured article references', () => {
  const results = service.search({ posts, registry, query: 'c40 art 40', sort: 'relevance' });
  assert.equal(results.length, 1);
  assert.equal(results[0].post.id, '102');
});

test('pillar filter includes related pillars', () => {
  const results = service.search({
    posts,
    registry,
    filters: { pillar: 'constitucion' },
    sort: 'recent'
  });
  assert.deepEqual(results.map((item) => item.post.id), ['102', '101']);
});

test('documentary year is filterable independently of publication date', () => {
  const results = service.search({
    posts,
    registry,
    filters: { yearFrom: 1940, yearTo: 1940 }
  });
  assert.equal(results.length, 2);
});
