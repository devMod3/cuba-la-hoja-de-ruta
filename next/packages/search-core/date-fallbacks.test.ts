import { describe, expect, it } from 'vitest';
import type { Article } from '@zenblog/domain';
import { searchArticles, searchArticlesByTitle } from './src/index';

function article(id: string, publishedAt: string | null): Article {
  return {
    id,
    title: `Documento ${id}`,
    publishedAt,
    updatedAt: null,
    summary: '',
    content: '',
    labels: []
  };
}

function resultIds(corpus: readonly Article[]): string[] {
  return searchArticles({ articles: corpus, sort: 'recent' }).map((result) => result.article.id);
}

function titleIds(corpus: readonly Article[]): string[] {
  return searchArticlesByTitle(corpus, '').map((item) => item.id);
}

describe('search-core publication date fallbacks', () => {
  const dated = article('dated', '2024-01-02T00:00:00.000Z');
  const undated = article('undated', null);

  it('treats a missing publication date as epoch zero in full search ordering', () => {
    expect(resultIds([dated, undated])).toEqual(['dated', 'undated']);
    expect(resultIds([undated, dated])).toEqual(['dated', 'undated']);

    expect(
      searchArticles({ articles: [dated, undated], sort: 'old' }).map((result) => result.article.id)
    ).toEqual(['undated', 'dated']);
  });

  it('treats a missing publication date as epoch zero in title-only ordering', () => {
    expect(titleIds([dated, undated])).toEqual(['dated', 'undated']);
    expect(titleIds([undated, dated])).toEqual(['dated', 'undated']);
  });
});
