import { describe, expect, it } from 'vitest';
import { ArticleSchema } from './src/article';

describe('ArticleSchema', () => {
  it('accepts a provider-neutral article identity', () => {
    const result = ArticleSchema.safeParse({
      id: '1',
      title: 'Título',
      publishedAt: null,
      updatedAt: null,
      summary: '',
      content: '',
      labels: []
    });
    expect(result.success).toBe(true);
  });

  it('rejects an article without a stable identity', () => {
    const result = ArticleSchema.safeParse({
      id: '',
      title: 'Título',
      publishedAt: null,
      updatedAt: null,
      summary: '',
      content: '',
      labels: []
    });
    expect(result.success).toBe(false);
  });
});
