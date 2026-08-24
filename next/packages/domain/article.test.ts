import { describe, expect, it } from 'vitest';
import { ArticleSchema } from './src/article';

describe('ArticleSchema', () => {
  it('rejects an article without a canonical URL', () => {
    const result = ArticleSchema.safeParse({
      id: '1',
      url: '',
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
