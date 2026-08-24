import { describe, expect, it } from 'vitest';
import { BloggerFeedSource, buildBloggerFeedUrl, mapBloggerEntry } from './src/index';

function entry(id: number, title: string) {
  const idText = String(id);
  return {
    id: { $t: `tag:blogger.com,1999:blog-1.post-${idText}` },
    title: { $t: title },
    published: { $t: `2026-08-${idText.padStart(2, '0')}T12:00:00-04:00` },
    updated: { $t: `2026-08-${idText.padStart(2, '0')}T12:30:00-04:00` },
    link: [{ rel: 'alternate', href: `https://example.com/p/${idText}.html` }],
    category: [{ term: 'Constitución' }]
  };
}

function requestUrl(input: RequestInfo | URL): URL {
  if (input instanceof URL) return input;
  if (typeof input === 'string') return new URL(input);
  return new URL(input.url);
}

describe('mapBloggerEntry', () => {
  it('preserves the legacy Blogger mapping contract', () => {
    const article = mapBloggerEntry(entry(42, 'Documento'));
    expect(article.id).toBe('42');
    expect(article.title).toBe('Documento');
    expect(article.labels).toEqual(['Constitución']);
  });
});

describe('buildBloggerFeedUrl', () => {
  it('preserves the frozen Blogger feed query contract', () => {
    const url = buildBloggerFeedUrl({
      baseUrl: 'https://example.com/path/page',
      pageSize: 150,
      startIndex: 151
    });
    expect(url.pathname).toBe('/feeds/posts/default');
    expect(url.searchParams.get('alt')).toBe('json');
    expect(url.searchParams.get('max-results')).toBe('150');
    expect(url.searchParams.get('start-index')).toBe('151');
    expect(url.searchParams.get('orderby')).toBe('published');
  });
});

describe('BloggerFeedSource', () => {
  it('paginates with no-store/same-origin and deduplicates by post id', async () => {
    const calls: Array<{ url: URL; init: RequestInit | undefined }> = [];
    const fetcher: typeof fetch = (input, init) => {
      const url = requestUrl(input);
      calls.push({ url, init });
      const start = url.searchParams.get('start-index');
      const entries =
        start === '1' ? [entry(1, 'Uno'), entry(2, 'Dos')] : [entry(2, 'Dos'), entry(3, 'Tres')];
      return Promise.resolve(
        new Response(
          JSON.stringify({
            feed: {
              entry: entries,
              openSearch$totalResults: { $t: '4' }
            }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );
    };

    const source = new BloggerFeedSource({
      baseUrl: 'https://example.com/',
      pageSize: 2,
      fetcher
    });
    const posts = await source.listPosts();

    expect(posts.map((post) => post.id)).toEqual(['1', '2', '3']);
    expect(calls).toHaveLength(2);
    expect(calls.map(({ url }) => url.searchParams.get('start-index'))).toEqual(['1', '3']);
    expect(calls.every(({ init }) => init?.credentials === 'same-origin')).toBe(true);
    expect(calls.every(({ init }) => init?.cache === 'no-store')).toBe(true);
  });

  it('rejects a non-success Blogger response', async () => {
    const fetcher: typeof fetch = () => Promise.resolve(new Response('no', { status: 503 }));
    const source = new BloggerFeedSource({ baseUrl: 'https://example.com/', fetcher });
    await expect(source.listPosts()).rejects.toThrow('Blogger feed HTTP 503');
  });

  it('drops malformed external entries instead of trusting them', async () => {
    const fetcher: typeof fetch = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            feed: {
              entry: [
                { id: { $t: 'bad' }, title: { $t: 'Sin URL' }, link: [] },
                entry(7, 'Válido')
              ],
              openSearch$totalResults: { $t: '2' }
            }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );
    const source = new BloggerFeedSource({ baseUrl: 'https://example.com/', fetcher });
    const posts = await source.listPosts();
    expect(posts.map((post) => post.id)).toEqual(['7']);
  });
});
