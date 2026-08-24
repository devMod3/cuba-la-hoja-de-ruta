import type { Article } from '@zenblog/domain';

type JsonObject = Record<string, unknown>;

interface BloggerLink {
  rel?: string;
  href?: string;
}

interface BloggerCategory {
  term?: string;
}

interface BloggerEntry {
  id?: string;
  title?: string;
  published?: string;
  updated?: string;
  summary?: string;
  content?: string;
  link: BloggerLink[];
  category: BloggerCategory[];
}

interface BloggerFeedPage {
  entry: unknown[];
  totalResults?: string;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string | undefined {
  if (!isObject(value)) return undefined;
  return typeof value['$t'] === 'string' ? value['$t'] : undefined;
}

function readLinks(value: unknown): BloggerLink[] {
  if (!Array.isArray(value)) return [];
  const links: BloggerLink[] = [];

  for (const item of value) {
    if (!isObject(item)) continue;
    const link: BloggerLink = {};
    if (typeof item['rel'] === 'string') link.rel = item['rel'];
    if (typeof item['href'] === 'string') link.href = item['href'];
    links.push(link);
  }

  return links;
}

function readCategories(value: unknown): BloggerCategory[] {
  if (!Array.isArray(value)) return [];
  const categories: BloggerCategory[] = [];

  for (const item of value) {
    if (!isObject(item)) continue;
    const category: BloggerCategory = {};
    if (typeof item['term'] === 'string') category.term = item['term'];
    categories.push(category);
  }

  return categories;
}

function parseBloggerEntry(input: unknown): BloggerEntry {
  if (!isObject(input)) throw new Error('Invalid Blogger entry');

  const entry: BloggerEntry = {
    link: readLinks(input['link']),
    category: readCategories(input['category'])
  };

  const id = readText(input['id']);
  const title = readText(input['title']);
  const published = readText(input['published']);
  const updated = readText(input['updated']);
  const summary = readText(input['summary']);
  const content = readText(input['content']);

  if (id !== undefined) entry.id = id;
  if (title !== undefined) entry.title = title;
  if (published !== undefined) entry.published = published;
  if (updated !== undefined) entry.updated = updated;
  if (summary !== undefined) entry.summary = summary;
  if (content !== undefined) entry.content = content;

  return entry;
}

function parseBloggerFeed(input: unknown): BloggerFeedPage {
  if (!isObject(input)) throw new Error('Invalid Blogger feed');
  const feed = input['feed'];
  if (!isObject(feed)) throw new Error('Invalid Blogger feed');

  const page: BloggerFeedPage = {
    entry: Array.isArray(feed['entry']) ? feed['entry'] : []
  };
  const totalResults = readText(feed['openSearch$totalResults']);
  if (totalResults !== undefined) page.totalResults = totalResults;
  return page;
}

function assertValidUrl(value: string): void {
  try {
    new URL(value);
  } catch {
    throw new Error('Invalid Blogger alternate URL');
  }
}

function browserBaseUrl(): string | undefined {
  const documentValue: unknown = Reflect.get(globalThis, 'document');
  if (!isObject(documentValue)) return undefined;
  const baseUri = documentValue['baseURI'];
  return typeof baseUri === 'string' ? baseUri : undefined;
}

function runtimeFetch(): typeof fetch | undefined {
  const fetchValue: unknown = Reflect.get(globalThis, 'fetch');
  return typeof fetchValue === 'function' ? (fetchValue as typeof fetch) : undefined;
}

export function mapBloggerEntry(input: unknown): Article {
  const entry = parseBloggerEntry(input);
  const atomId = entry.id ?? '';
  const id = atomId.match(/post-(\d+)/)?.[1] ?? atomId;
  const url = entry.link.find((item) => item.rel === 'alternate')?.href ?? '';

  if (!id) throw new Error('Blogger entry requires id');
  if (!url) throw new Error('Blogger entry requires alternate URL');
  assertValidUrl(url);

  return {
    id,
    url,
    title: entry.title || '(sin título)',
    publishedAt: entry.published ?? null,
    updatedAt: entry.updated ?? null,
    summary: entry.summary ?? '',
    content: entry.content ?? '',
    labels: entry.category
      .map((item) => item.term)
      .filter((value): value is string => Boolean(value))
  };
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

  constructor({ pageSize = 150, baseUrl, fetcher }: BloggerFeedSourceOptions = {}) {
    const resolvedBaseUrl = baseUrl ?? browserBaseUrl();
    const resolvedFetcher = fetcher ?? runtimeFetch();
    if (!resolvedBaseUrl) throw new Error('BloggerFeedSource requires baseUrl outside a browser');
    if (!resolvedFetcher) throw new Error('BloggerFeedSource requires fetch');
    this.#pageSize = pageSize;
    this.#baseUrl = resolvedBaseUrl;
    this.#fetcher = resolvedFetcher;
  }

  async #fetchPage(startIndex: number): Promise<BloggerFeedPage> {
    const url = buildBloggerFeedUrl({
      baseUrl: this.#baseUrl,
      pageSize: this.#pageSize,
      startIndex
    });
    const response = await this.#fetcher(url, {
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Blogger feed HTTP ${String(response.status)}`);
    return parseBloggerFeed(await response.json());
  }

  async listPosts(): Promise<Article[]> {
    const posts: Article[] = [];
    let startIndex = 1;
    let total: number | null = null;
    let guard = 0;

    while (guard++ < 50) {
      const feed = await this.#fetchPage(startIndex);
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
        const parsedTotal = Number(feed.totalResults ?? page.length);
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
