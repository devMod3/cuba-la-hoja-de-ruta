import { ContentSource } from '../../contracts/ContentSource.js';

export class BloggerFeedSource extends ContentSource {
  constructor({ pageSize = 150, baseUrl = document.baseURI } = {}) {
    super();
    this.pageSize = pageSize;
    this.baseUrl = baseUrl;
  }

  async #fetchPage(startIndex) {
    const url = new URL('/feeds/posts/default', this.baseUrl);
    url.searchParams.set('alt', 'json');
    url.searchParams.set('max-results', String(this.pageSize));
    url.searchParams.set('start-index', String(startIndex));
    url.searchParams.set('orderby', 'published');

    const response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Blogger feed HTTP ${response.status}`);
    }

    return response.json();
  }

  #mapEntry(entry) {
    const atomId = entry?.id?.$t ?? '';
    const match = atomId.match(/post-(\d+)/);
    const alternate = (entry?.link ?? []).find((item) => item.rel === 'alternate');

    return {
      id: match ? match[1] : atomId,
      url: alternate?.href ?? '',
      title: entry?.title?.$t ?? '(sin título)',
      publishedAt: entry?.published?.$t ?? null,
      updatedAt: entry?.updated?.$t ?? null,
      summary: entry?.summary?.$t ?? '',
      content: entry?.content?.$t ?? '',
      labels: (entry?.category ?? []).map((item) => item.term).filter(Boolean)
    };
  }

  async listPosts() {
    const posts = [];
    let startIndex = 1;
    let total = null;
    let guard = 0;

    while (guard++ < 50) {
      const data = await this.#fetchPage(startIndex);
      const feed = data?.feed ?? {};
      const page = (feed.entry ?? [])
        .map((entry) => this.#mapEntry(entry))
        .filter((post) => post.id && post.url);

      posts.push(...page);

      if (total === null) {
        total = Number(feed['openSearch$totalResults']?.$t ?? page.length);
      }

      if (!page.length || posts.length >= total) break;
      startIndex += page.length;
    }

    const seen = new Set();
    return posts.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }
}
