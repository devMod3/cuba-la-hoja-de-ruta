import { TextNormalizer } from './TextNormalizer.js';

export class SearchService {
  constructor({ normalizer = new TextNormalizer() } = {}) {
    this.normalizer = normalizer;
  }

  #recordFor(post, registry) {
    return registry?.records?.[String(post.id)] ?? null;
  }

  #documentYear(record) {
    const value = Number(record?.temporal?.documentYear);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  #pillars(record) {
    const classification = record?.classification ?? {};
    return [classification.primaryPillar, ...(classification.relatedPillars ?? [])].filter(Boolean);
  }

  #parseQuery(value) {
    let normalized = this.normalizer.normalize(value);
    let article = null;

    const articleMatch = normalized.match(/\bart(?:iculo)?\.?\s+([0-9]+[a-z-]*)\b/);
    if (articleMatch) {
      article = articleMatch[1];
      normalized = normalized.replace(articleMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }

    return {
      text: normalized,
      article
    };
  }

  #hasArticle(record, article) {
    if (!article) return true;
    return (record?.indexing?.norms ?? []).some((reference) =>
      (reference.articles ?? []).map(String).includes(String(article))
    );
  }

  #haystack(post, record) {
    const indexing = record?.indexing ?? {};
    const classification = record?.classification ?? {};
    const editorial = record?.editorial ?? {};
    const terms = [
      post.title,
      classification.primaryPillar,
      classification.type,
      ...(classification.relatedPillars ?? []),
      ...(indexing.concepts ?? []),
      ...(indexing.aliases ?? []),
      ...(indexing.keywords ?? []),
      editorial.status
    ];

    for (const reference of indexing.norms ?? []) {
      terms.push(reference.normId);
    }

    return this.normalizer.normalize(terms.filter(Boolean).join(' '));
  }

  #score(post, record, parsedQuery) {
    const { text, article } = parsedQuery;

    if (article && !this.#hasArticle(record, article)) return 0;
    if (!text) return article ? 980 : 1;

    const normalizedTitle = this.normalizer.normalize(post.title);
    const haystack = this.#haystack(post, record);
    const tokens = text.split(' ').filter(Boolean);

    if (!tokens.every((token) => haystack.includes(token))) return 0;

    let score = article ? 980 : 0;
    if (normalizedTitle === text) score += 1000;
    else if (normalizedTitle.startsWith(text)) score += 760;
    else if (normalizedTitle.includes(text)) score += 650;

    if (haystack.includes(text)) score += 360;

    for (const token of tokens) {
      if (normalizedTitle.split(' ').includes(token)) score += 180;
      if (haystack.includes(token)) score += 70;
    }

    return score || 1;
  }

  search({ posts = [], registry = {}, query = '', filters = {}, sort = 'recent' } = {}) {
    const parsedQuery = this.#parseQuery(query);
    const hasQuery = Boolean(parsedQuery.text || parsedQuery.article);
    const matches = [];

    for (const post of posts) {
      const record = this.#recordFor(post, registry);
      const classification = record?.classification ?? {};
      const pillars = this.#pillars(record);
      const year = this.#documentYear(record);

      if (filters.pillar && filters.pillar !== 'all' && !pillars.includes(filters.pillar)) continue;
      if (filters.type && filters.type !== 'all' && classification.type !== filters.type) continue;
      if (filters.yearFrom && (!year || year < Number(filters.yearFrom))) continue;
      if (filters.yearTo && (!year || year > Number(filters.yearTo))) continue;

      const score = this.#score(post, record, parsedQuery);
      if (score <= 0) continue;

      matches.push({ post, record, score, year });
    }

    matches.sort((a, b) => {
      if (hasQuery && sort === 'relevance' && b.score !== a.score) return b.score - a.score;
      if (sort === 'az') return a.post.title.localeCompare(b.post.title, 'es');

      const aTime = Date.parse(a.post.publishedAt ?? '') || 0;
      const bTime = Date.parse(b.post.publishedAt ?? '') || 0;
      return sort === 'old' ? aTime - bTime : bTime - aTime;
    });

    return matches;
  }
}
