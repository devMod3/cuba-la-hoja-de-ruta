import { describe, expect, it } from 'vitest';
import { mapBloggerEntry } from './src/index';

describe('mapBloggerEntry', () => {
  it('preserves the legacy Blogger mapping contract', () => {
    const article = mapBloggerEntry({
      id: { $t: 'tag:blogger.com,1999:blog-1.post-42' },
      title: { $t: 'Documento' },
      published: { $t: '2026-08-23T12:00:00-04:00' },
      updated: { $t: '2026-08-23T12:30:00-04:00' },
      link: [{ rel: 'alternate', href: 'https://example.com/p/documento.html' }],
      category: [{ term: 'Constitución' }]
    });
    expect(article.id).toBe('42');
    expect(article.title).toBe('Documento');
    expect(article.labels).toEqual(['Constitución']);
  });
});
