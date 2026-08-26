import { afterEach, describe, expect, it, vi } from 'vitest';
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mapBloggerEntry', () => {
  it('preserves the legacy Blogger mapping contract', () => {
    const article = mapBloggerEntry(entry(42, 'Documento'));
    expect(article.id).toBe('42');
    expect(article.title).toBe('Documento');
    expect(article.labels).toEqual(['Constitución']);
  });

  it('rejects malformed identity and alternate URL fields at the trust boundary', () => {
    expect(() => mapBloggerEntry(null)).toThrow('Invalid Blogger entry');
    expect(() =>
      mapBloggerEntry({
        link: [{ rel: 'alternate', href: 'https://example.com/post' }],
        category: []
      })
    ).toThrow('Blogger entry requires id');
    expect(() =>
      mapBloggerEntry({
        id: { $t: 'post-8' },
        link: [],
        category: []
      })
    ).toThrow('Blogger entry requires alternate URL');
    expect(() =>
      mapBloggerEntry({
        id: { $t: 'post-8' },
        link: null,
        category: []
      })
    ).toThrow('Blogger entry requires alternate URL');
    expect(() =>
      mapBloggerEntry({
        id: { $t: 'post-8' },
        link: [{ rel: 'alternate', href: 'not a valid absolute url' }],
        category: []
      })
    ).toThrow('Invalid Blogger alternate URL');
  });

  it('defaults optional Blogger fields and ignores malformed link/category members', () => {
    const article = mapBloggerEntry({
      id: { $t: 'legacy-id' },
      title: { $t: '' },
      published: { $t: 123 },
      summary: null,
      link: [
        null,
        {},
        { rel: 7, href: 'https://ignored.example/' },
        { rel: 'alternate', href: 'https://example.com/post' }
      ],
      category: [null, {}, { term: 7 }, { term: 'Ley' }]
    });

    expect(article).toMatchObject({
      id: 'legacy-id',
      url: 'https://example.com/post',
      title: '(sin título)',
      publishedAt: null,
      updatedAt: null,
      summary: '',
      content: '',
      labels: ['Ley']
    });
  });

  it('preserves optional summary and content text from Blogger', () => {
    const article = mapBloggerEntry({
      ...entry(12, 'Doce'),
      summary: { $t: 'Resumen' },
      content: { $t: '<p>Contenido</p>' }
    });

    expect(article.summary).toBe('Resumen');
    expect(article.content).toBe('<p>Contenido</p>');
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

  it('uses browser document.baseURI and runtime fetch when dependencies are omitted', async () => {
    const calls: URL[] = [];
    const fetcher: typeof fetch = (input) => {
      calls.push(requestUrl(input));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            feed: {
              entry: [entry(9, 'Nueve')],
              openSearch$totalResults: { $t: '1' }
            }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );
    };

    vi.stubGlobal('document', { baseURI: 'https://example.com/context/page' });
    vi.stubGlobal('fetch', fetcher);

    const posts = await new BloggerFeedSource({ pageSize: 1 }).listPosts();
    expect(posts.map((post) => post.id)).toEqual(['9']);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.origin).toBe('https://example.com');
    expect(calls[0]?.pathname).toBe('/feeds/posts/default');
  });

  it('fails closed when runtime dependencies cannot be resolved', () => {
    const inertFetcher: typeof fetch = () => Promise.resolve(new Response());
    vi.stubGlobal('document', undefined);
    expect(() => new BloggerFeedSource({ fetcher: inertFetcher })).toThrow(
      'BloggerFeedSource requires baseUrl outside a browser'
    );

    vi.stubGlobal('document', { baseURI: 42 });
    expect(() => new BloggerFeedSource({ fetcher: inertFetcher })).toThrow(
      'BloggerFeedSource requires baseUrl outside a browser'
    );

    vi.stubGlobal('fetch', undefined);
    expect(() => new BloggerFeedSource({ baseUrl: 'https://example.com/' })).toThrow(
      'BloggerFeedSource requires fetch'
    );
  });

  it('rejects a non-success Blogger response', async () => {
    const fetcher: typeof fetch = () => Promise.resolve(new Response('no', { status: 503 }));
    const source = new BloggerFeedSource({ baseUrl: 'https://example.com/', fetcher });
    await expect(source.listPosts()).rejects.toThrow('Blogger feed HTTP 503');
  });

  it('rejects structurally invalid Blogger feed envelopes', async () => {
    for (const payload of [null, {}, { feed: null }]) {
      const fetcher: typeof fetch = () =>
        Promise.resolve(
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'content-type': 'application/json' }
          })
        );
      const source = new BloggerFeedSource({ baseUrl: 'https://example.com/', fetcher });
      await expect(source.listPosts()).rejects.toThrow('Invalid Blogger feed');
    }
  });

  it('treats a valid feed without entry or total metadata as an empty page', async () => {
    const fetcher: typeof fetch = () =>
      Promise.resolve(
        new Response(JSON.stringify({ feed: {} }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      );
    const source = new BloggerFeedSource({ baseUrl: 'https://example.com/', fetcher });
    await expect(source.listPosts()).resolves.toEqual([]);
  });

  it('treats malformed pagination metadata conservatively', async () => {
    const fetcher: typeof fetch = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            feed: {
              entry: [entry(10, 'Diez')],
              openSearch$totalResults: { $t: 'not-a-number' }
            }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );
    const source = new BloggerFeedSource({ baseUrl: 'https://example.com/', fetcher });
    const posts = await source.listPosts();
    expect(posts.map((post) => post.id)).toEqual(['10']);
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
