import { z } from 'zod';
import { ArticleSchema, type Article } from '@zenblog/domain';

const BloggerTextSchema = z.object({ $t: z.string() });
const BloggerLinkSchema = z.object({ rel: z.string().optional(), href: z.string().optional() });
const BloggerCategorySchema = z.object({ term: z.string().optional() });

export const BloggerEntrySchema = z
  .object({
    id: BloggerTextSchema.optional(),
    title: BloggerTextSchema.optional(),
    published: BloggerTextSchema.optional(),
    updated: BloggerTextSchema.optional(),
    summary: BloggerTextSchema.optional(),
    content: BloggerTextSchema.optional(),
    link: z.array(BloggerLinkSchema).default([]),
    category: z.array(BloggerCategorySchema).default([])
  })
  .passthrough();

const BloggerFeedSchema = z
  .object({
    feed: z
      .object({
        entry: z.array(BloggerEntrySchema).default([]),
        'openSearch$totalResults': BloggerTextSchema.optional()
      })
      .passthrough()
      .default({})
  })
  .passthrough();

export function mapBloggerEntry(input: unknown): Article {
  const entry = BloggerEntrySchema.parse(input);
  const atomId = entry.id?.$t ?? '';
  const id = atomId.match(/post-(\d+)/)?.[1] ?? atomId;
  const url = entry.link.find((item) => item.rel === 'alternate')?.href ?? '';

  return ArticleSchema.parse({
    id,
    url,
    title: entry.title?.$t || '(sin título)',
    publishedAt: entry.published?.$t ?? null,
    updatedAt: entry.updated?.$t ?? null,
    summary: entry.summary?.$t ?? '',
    content: entry.content?.$t ?? '',
    labels: entry.category
      .map((item) => item.term)
      .filter((value): value is string => Boolean(value))
  });
}

export function buildBloggerFeedUrl({
  baseUrl,
  pageSize = 150,
  startIndex = 1
}: {
  readonly baseUrl: string;
  readonly pageSize?: number;
  readonly startIndex?: number;
}): URL {
  const url = new URL('/feeds/posts/default', baseUrl);
  url.searchParams.set('alt', 'json');
  url.searchParams.set('max-results', String(pageSize));
  url.searchParams.set('start-index', String(startIndex));
  url.searchParams.set('orderby', 'published');
  return url;
}

export interface BloggerFeedSourceOptions {
  readonly pageSize?: number;
  readonly baseUrl?: string;
  readonly fetcher?: typeof fetch;
}

export class BloggerFeedSource {
  readonly #pageSize: number;
  readonly #baseUrl: string;
  readonly #fetcher: typeof fetch;

  constructor({ pageSize = 150, baseUrl, fetcher = globalThis.fetch }: BloggerFeedSourceOptions = {}) {
    const resolvedBaseUrl = baseUrl ?? globalThis.document?.baseURI;
    if (!resolvedBaseUrl) throw new Error('BloggerFeedSource requires baseUrl outside a browser');
    if (!fetcher) throw new Error('BloggerFeedSource requires fetch');
    this.#pageSize = pageSize;
    this.#baseUrl = resolvedBaseUrl;
    this.#fetcher = fetcher;
  }

  async #fetchPage(startIndex: number) {
    const url = buildBloggerFeedUrl({
      baseUrl: this.#baseUrl,
      pageSize: this.#pageSize,
      startIndex
    });
    const response = await this.#fetcher(url, {
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Blogger feed HTTP ${response.status}`);
    return BloggerFeedSchema.parse(await response.json());
  }

  async listPosts(): Promise<Article[]> {
    const posts: Article[] = [];
    let startIndex = 1;
    let total: number | null = null;
    let guard = 0;

    while (guard++ < 50) {
      const data = await this.#fetchPage(startIndex);
      const feed = data.feed;
      const page: Article[] = [];

      for (const entry of feed.entry) {
        try {
          const article = mapBloggerEntry(entry);
          if (article.id && article.url) page.push(article);
        } catch {
          // External feed validation boundary: malformed entries are ignored, not trusted.
        }
      }

      posts.push(...page);
      if (total === null) {
        const parsedTotal = Number(feed['openSearch$totalResults']?.$t ?? page.length);
        total = Number.isFinite(parsedTotal) ? parsedTotal : page.length;
      }
      if (!page.length || posts.length >= total) break;
      startIndex += page.length;
    }

    const seen = new Set<string>();
    return posts.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }
}
