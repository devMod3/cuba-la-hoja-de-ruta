import { describe, expect, it } from 'vitest';
import type { Article } from '@zenblog/domain';
import { searchArticles, searchArticlesByTitle } from './src/index';

const article: Article = {
  id: '1',
  title: 'Constitución de 1940',
  publishedAt: null,
  updatedAt: null,
  summary: '',
  content: '',
  labels: []
};

describe('searchArticlesByTitle', () => {
  it('is accent-insensitive for title search', () => {
    expect(searchArticlesByTitle([article], 'constitucion')).toHaveLength(1);
  });

  it('rejects articles outside the requested pillar', () => {
    expect(searchArticles({ articles: [article], filters: { pillar: 'constitucion' } })).toEqual(
      []
    );
  });
});
