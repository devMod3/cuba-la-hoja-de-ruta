import { describe, expect, it } from 'vitest';
import { articles, getArticleById, validateContentCatalog } from './src/index';

describe('content catalog', () => {
  it('exposes immutable provider-neutral articles', () => {
    expect(articles).toHaveLength(2);
    expect(Object.isFrozen(articles)).toBe(true);
    for (const article of articles) {
      expect(article.id).toMatch(/^\d+$/u);
      expect(getArticleById(article.id)).toEqual(article);
      expect('url' in article).toBe(false);
    }
  });

  it('rejects malformed catalog boundaries', () => {
    expect(() =>
      validateContentCatalog({
        schemaVersion: '2.0.0',
        articleCount: 0,
        articles: []
      })
    ).toThrow(/Unsupported content catalog schema/u);
    expect(() =>
      validateContentCatalog({
        schemaVersion: '1.0.0',
        articleCount: 1,
        articles: []
      })
    ).toThrow(/articleCount mismatch/u);
    const first = articles[0];
    if (!first) throw new Error('Expected catalog fixture');
    expect(() =>
      validateContentCatalog({
        schemaVersion: '1.0.0',
        articleCount: 2,
        articles: [first, first]
      })
    ).toThrow(/Duplicate article id/u);
  });
});
