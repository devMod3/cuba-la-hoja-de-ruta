import { describe, expect, it } from 'vitest';
import { MetadataRegistrySchema, type Article } from '@zenblog/domain';
import { normalizeSearchText, searchArticles, type SearchFilters, type SearchSort } from './src/index';
// @ts-expect-error The frozen legacy JavaScript module intentionally has no TypeScript declaration.
import { SearchService } from '../../../src/search/SearchService.js';
// @ts-expect-error The frozen legacy JavaScript module intentionally has no TypeScript declaration.
import { TextNormalizer } from '../../../src/search/TextNormalizer.js';

const articles: Article[] = [
  {
    id: '101',
    url: 'https://example.com/constitucion-1940',
    title: 'Constitución de 1940',
    publishedAt: '2026-01-03T00:00:00.000Z',
    updatedAt: null,
    summary: '',
    content: '',
    labels: []
  },
  {
    id: '102',
    url: 'https://example.com/soberania-popular',
    title: 'Soberanía popular',
    publishedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: null,
    summary: '',
    content: '',
    labels: []
  },
  {
    id: '103',
    url: 'https://example.com/codigo-electoral',
    title: 'Código Electoral de 1943',
    publishedAt: '2026-01-02T00:00:00.000Z',
    updatedAt: null,
    summary: '',
    content: '',
    labels: []
  }
];

const registry = MetadataRegistrySchema.parse({
  records: {
    '101': {
      classification: {
        primaryPillar: 'Constitución',
        relatedPillars: ['Soberanía'],
        type: 'Constitución'
      },
      temporal: { documentYear: '1940' },
      indexing: {
        concepts: ['continuidad jurídica'],
        aliases: ['C40'],
        keywords: ['constitucionalismo cubano'],
        norms: [{ normId: 'C40', articles: [2, 40, 123] }]
      },
      editorial: { status: 'publicado' }
    },
    '102': {
      classification: {
        primaryPillar: 'Soberanía',
        relatedPillars: ['Estado'],
        type: 'Fundamento'
      },
      temporal: { documentYear: 1940 },
      indexing: {
        concepts: ['soberanía popular', 'pueblo'],
        aliases: [],
        keywords: ['titularidad del poder'],
        norms: [{ normId: 'C40', articles: ['2'] }]
      },
      editorial: { status: 'publicado' }
    },
    '103': {
      classification: {
        primaryPillar: 'Estado',
        relatedPillars: [],
        type: 'Ley'
      },
      temporal: { documentYear: 1943 },
      indexing: {
        concepts: ['elecciones'],
        aliases: ['Ley 17'],
        keywords: ['código electoral'],
        norms: [{ normId: 'Ley 17', articles: [] }]
      },
      editorial: { status: 'publicado' }
    }
  }
});

const legacy = new SearchService();
const legacyNormalizer = new TextNormalizer();

function legacyProjection(input: {
  query?: string;
  filters?: SearchFilters;
  sort?: SearchSort;
}) {
  return legacy
    .search({ posts: articles, registry, query: input.query, filters: input.filters, sort: input.sort })
    .map((result: { post: Article; score: number; year: number | null }) => ({
      id: result.post.id,
      score: result.score,
      year: result.year
    }));
}

function nextProjection(input: {
  query?: string;
  filters?: SearchFilters;
  sort?: SearchSort;
}) {
  return searchArticles({ articles, registry, ...input }).map((result) => ({
    id: result.article.id,
    score: result.score,
    year: result.year
  }));
}

describe('legacy SearchService parity', () => {
  it.each(['Constitución_de-1940', ' Soberanía   POPULAR ', 'Código/Electoral']) (
    'normalizes %s exactly like the frozen legacy normalizer',
    (value) => {
      expect(normalizeSearchText(value)).toBe(legacyNormalizer.normalize(value));
    }
  );

  it.each([
    { query: 'constitucion', sort: 'relevance' as const },
    { query: 'C40 continuidad juridica', sort: 'relevance' as const },
    { query: 'artículo 40 constitucion', sort: 'relevance' as const },
    { query: 'art. 2 soberania', sort: 'relevance' as const },
    { query: '', filters: { pillar: 'Soberanía' }, sort: 'az' as const },
    { query: '', filters: { type: 'Ley' }, sort: 'recent' as const },
    { query: '', filters: { yearFrom: 1941, yearTo: 1943 }, sort: 'old' as const },
    { query: '', sort: 'recent' as const },
    { query: '', sort: 'old' as const },
    { query: '', sort: 'az' as const }
  ])('matches legacy results for %#', (input) => {
    expect(nextProjection(input)).toEqual(legacyProjection(input));
  });
});
