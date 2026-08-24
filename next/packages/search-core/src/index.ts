import type { Article, MetadataRecord, MetadataRegistry } from '@zenblog/domain';

export type SearchSort = 'recent' | 'old' | 'az' | 'relevance';

export interface SearchFilters {
  readonly pillar?: string;
  readonly type?: string;
  readonly yearFrom?: number | string;
  readonly yearTo?: number | string;
}

export interface SearchResult {
  readonly article: Article;
  readonly metadata: MetadataRecord | null;
  readonly score: number;
  readonly year: number | null;
}

interface ParsedQuery {
  readonly text: string;
  readonly article: string | null;
}

export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseSearchQuery(value: string | null | undefined): ParsedQuery {
  let normalized = normalizeSearchText(value);
  let article: string | null = null;

  const articleMatch = normalized.match(/\bart(?:iculo)?\.?\s+([0-9]+[a-z-]*)\b/);
  if (articleMatch) {
    article = articleMatch[1] ?? null;
    normalized = normalized.replace(articleMatch[0], ' ').replace(/\s+/g, ' ').trim();
  }

  return { text: normalized, article };
}

function metadataFor(
  article: Article,
  registry: MetadataRegistry | undefined
): MetadataRecord | null {
  return registry?.records[article.id] ?? null;
}

function documentYear(record: MetadataRecord | null): number | null {
  const value = Number(record?.temporal.documentYear);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function pillars(record: MetadataRecord | null): string[] {
  const classification = record?.classification;
  return [classification?.primaryPillar, ...(classification?.relatedPillars ?? [])].filter(
    (value): value is string => Boolean(value)
  );
}

function hasArticleReference(record: MetadataRecord | null, article: string | null): boolean {
  if (!article) return true;
  return (record?.indexing.norms ?? []).some((reference) =>
    reference.articles.includes(article)
  );
}

function haystack(article: Article, record: MetadataRecord | null): string {
  const indexing = record?.indexing;
  const classification = record?.classification;
  const editorial = record?.editorial;
  const terms: Array<string | null | undefined> = [
    article.title,
    classification?.primaryPillar,
    classification?.type,
    ...(classification?.relatedPillars ?? []),
    ...(indexing?.concepts ?? []),
    ...(indexing?.aliases ?? []),
    ...(indexing?.keywords ?? []),
    editorial?.status
  ];

  for (const reference of indexing?.norms ?? []) terms.push(reference.normId);
  return normalizeSearchText(terms.filter((value): value is string => Boolean(value)).join(' '));
}

function score(article: Article, record: MetadataRecord | null, parsedQuery: ParsedQuery): number {
  const { text, article: articleReference } = parsedQuery;
  if (articleReference && !hasArticleReference(record, articleReference)) return 0;
  if (!text) return articleReference ? 980 : 1;

  const normalizedTitle = normalizeSearchText(article.title);
  const searchable = haystack(article, record);
  const tokens = text.split(' ').filter(Boolean);

  if (!tokens.every((token) => searchable.includes(token))) return 0;

  let value = articleReference ? 980 : 0;
  if (normalizedTitle === text) value += 1000;
  else if (normalizedTitle.startsWith(text)) value += 760;
  else if (normalizedTitle.includes(text)) value += 650;

  if (searchable.includes(text)) value += 360;

  for (const token of tokens) {
    if (normalizedTitle.split(' ').includes(token)) value += 180;
    if (searchable.includes(token)) value += 70;
  }

  return value || 1;
}

export function searchArticles({
  articles = [],
  registry,
  query = '',
  filters = {},
  sort = 'recent'
}: {
  readonly articles?: readonly Article[];
  readonly registry?: MetadataRegistry;
  readonly query?: string;
  readonly filters?: SearchFilters;
  readonly sort?: SearchSort;
} = {}): SearchResult[] {
  const parsedQuery = parseSearchQuery(query);
  const hasQuery = Boolean(parsedQuery.text || parsedQuery.article);
  const matches: SearchResult[] = [];

  for (const article of articles) {
    const metadata = metadataFor(article, registry);
    const classification = metadata?.classification;
    const articlePillars = pillars(metadata);
    const year = documentYear(metadata);

    if (filters.pillar && filters.pillar !== 'all' && !articlePillars.includes(filters.pillar)) {
      continue;
    }
    if (filters.type && filters.type !== 'all' && classification?.type !== filters.type) continue;
    if (filters.yearFrom && (!year || year < Number(filters.yearFrom))) continue;
    if (filters.yearTo && (!year || year > Number(filters.yearTo))) continue;

    const relevance = score(article, metadata, parsedQuery);
    if (relevance <= 0) continue;
    matches.push({ article, metadata, score: relevance, year });
  }

  matches.sort((a, b) => {
    if (hasQuery && sort === 'relevance' && b.score !== a.score) return b.score - a.score;
    if (sort === 'az') return a.article.title.localeCompare(b.article.title, 'es');

    const aTime = Date.parse(a.article.publishedAt ?? '') || 0;
    const bTime = Date.parse(b.article.publishedAt ?? '') || 0;
    return sort === 'old' ? aTime - bTime : bTime - aTime;
  });

  return matches;
}

export function searchArticlesByTitle(articles: readonly Article[], query: string): Article[] {
  const normalized = normalizeSearchText(query);
  const ordered = [...articles].sort((a, b) => {
    const aTime = Date.parse(a.publishedAt ?? '') || 0;
    const bTime = Date.parse(b.publishedAt ?? '') || 0;
    return bTime - aTime;
  });
  if (!normalized) return ordered;
  return ordered.filter((article) => normalizeSearchText(article.title).includes(normalized));
}
