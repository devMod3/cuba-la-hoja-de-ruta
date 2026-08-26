import { describe, expect, it } from 'vitest';
import { MetadataRegistrySchema, type Article } from '@zenblog/domain';
import {
  normalizeSearchText,
  parseSearchQuery,
  searchArticles,
  type SearchResult
} from './src/index';

function article(id: string, title: string, publishedAt: string | null): Article {
  return {
    id,
    url: `https://example.com/${id}`,
    title,
    publishedAt,
    updatedAt: null,
    summary: '',
    content: '',
    labels: []
  };
}

function ids(results: readonly SearchResult[]): string[] {
  return results.map((result) => result.article.id);
}

const metadataArticle = article('meta', 'Documento neutral', '2024-01-01T00:00:00.000Z');
const laterArticle = article('later', 'Documento posterior', '2024-01-03T00:00:00.000Z');
const noMetadataArticle = article(
  'no-meta',
  'Constitución sin ficha',
  '2024-01-04T00:00:00.000Z'
);

const registry = MetadataRegistrySchema.parse({
  records: {
    meta: {
      classification: {
        primaryPillar: 'Instituciones',
        relatedPillars: ['Soberanía'],
        type: 'Ley'
      },
      temporal: { documentYear: 1940 },
      indexing: {
        concepts: ['consulta popular'],
        aliases: ['C40'],
        keywords: ['constitucionalismo'],
        norms: [{ normId: 'Ley 17', articles: [40] }]
      },
      editorial: { status: 'borrador' }
    },
    later: {
      classification: {
        primaryPillar: 'Estado',
        relatedPillars: [],
        type: 'Ley'
      },
      temporal: { documentYear: 1943 },
      indexing: {
        concepts: [],
        aliases: [],
        keywords: [],
        norms: [{ normId: 'Ley 18', articles: [2] }]
      },
      editorial: { status: 'publicado' }
    }
  }
});

describe('search-core fault sensitivity', () => {
  it('keeps null normalization and article-reference parsing explicit', () => {
    expect(normalizeSearchText(null)).toBe('');
    expect(normalizeSearchText(undefined)).toBe('');
    expect(parseSearchQuery('  ARTÍCULO 40   Constitución ')).toEqual({
      text: 'constitucion',
      article: '40'
    });
  });

  it('fails open to title search when registry metadata is absent', () => {
    const results = searchArticles({
      articles: [noMetadataArticle],
      query: 'constitucion',
      sort: 'relevance'
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      article: { id: 'no-meta' },
      metadata: null,
      year: null
    });
    expect(searchArticles()).toEqual([]);
  });

  it('indexes every public metadata search surface and enforces article references', () => {
    for (const query of [
      'soberania',
      'ley',
      'consulta popular',
      'c40',
      'constitucionalismo',
      'ley 17',
      'borrador'
    ]) {
      expect(
        ids(searchArticles({ articles: [metadataArticle], registry, query, sort: 'relevance' }))
      ).toEqual(['meta']);
    }

    const articleReference = searchArticles({
      articles: [metadataArticle, laterArticle],
      registry,
      query: 'artículo 40',
      sort: 'relevance'
    });
    expect(ids(articleReference)).toEqual(['meta']);
    expect(articleReference[0]?.score).toBe(980);

    expect(
      searchArticles({
        articles: [metadataArticle, laterArticle],
        registry,
        query: 'artículo 999',
        sort: 'relevance'
      })
    ).toEqual([]);
  });

  it('accepts an article reference when any norm points to it and rejects missing metadata safely', () => {
    const multiNormArticle = article('multi', 'Documento multinorma', '2024-01-05T00:00:00.000Z');
    const multiNormRegistry = MetadataRegistrySchema.parse({
      records: {
        multi: {
          indexing: {
            norms: [
              { normId: 'Ley A', articles: [1] },
              { normId: 'Ley B', articles: [40] }
            ]
          }
        }
      }
    });

    expect(
      ids(
        searchArticles({
          articles: [multiNormArticle],
          registry: multiNormRegistry,
          query: 'artículo 40',
          sort: 'relevance'
        })
      )
    ).toEqual(['multi']);

    expect(
      searchArticles({
        articles: [noMetadataArticle],
        query: 'artículo 40',
        sort: 'relevance'
      })
    ).toEqual([]);
  });

  it('treats all filters as disabled and keeps year bounds inclusive', () => {
    const corpus = [metadataArticle, laterArticle, noMetadataArticle];

    expect(
      new Set(
        ids(
          searchArticles({
            articles: corpus,
            registry,
            filters: { pillar: 'all', type: 'all' }
          })
        )
      )
    ).toEqual(new Set(['meta', 'later', 'no-meta']));

    expect(ids(searchArticles({ articles: corpus, registry, filters: { yearFrom: 1940 } }))).toEqual([
      'later',
      'meta'
    ]);
    expect(ids(searchArticles({ articles: corpus, registry, filters: { yearFrom: 1943 } }))).toEqual([
      'later'
    ]);
    expect(ids(searchArticles({ articles: corpus, registry, filters: { yearTo: 1943 } }))).toEqual([
      'later',
      'meta'
    ]);
    expect(ids(searchArticles({ articles: corpus, registry, filters: { yearTo: 1940 } }))).toEqual([
      'meta'
    ]);
  });

  it('excludes records without metadata when a concrete type filter is active', () => {
    expect(
      ids(
        searchArticles({
          articles: [noMetadataArticle, metadataArticle, laterArticle],
          registry,
          filters: { type: 'Ley' },
          sort: 'recent'
        })
      )
    ).toEqual(['later', 'meta']);
  });

  it('orders exact, prefix and contained title matches by relevance rather than recency', () => {
    const exact = article('exact', 'Constitución', '2024-01-01T00:00:00.000Z');
    const prefix = article('prefix', 'Constitución vigente', '2024-01-02T00:00:00.000Z');
    const contained = article(
      'contained',
      'Historia de la Constitución',
      '2024-01-03T00:00:00.000Z'
    );
    const corpus = [exact, prefix, contained];

    const relevance = searchArticles({ articles: corpus, query: 'constitucion', sort: 'relevance' });
    expect(ids(relevance)).toEqual(['exact', 'prefix', 'contained']);
    expect(relevance.find((result) => result.article.id === 'contained')?.score).toBe(1260);

    expect(ids(searchArticles({ articles: corpus, query: 'constitucion', sort: 'recent' }))).toEqual([
      'contained',
      'prefix',
      'exact'
    ]);
  });

  it('uses publication recency as the deterministic tie-break for equal relevance scores', () => {
    const older = article('older-tie', 'Constitución', '2024-01-01T00:00:00.000Z');
    const newer = article('newer-tie', 'Constitución', '2024-01-02T00:00:00.000Z');

    expect(
      ids(searchArticles({ articles: [older, newer], query: 'constitucion', sort: 'relevance' }))
    ).toEqual(['newer-tie', 'older-tie']);
  });
});
