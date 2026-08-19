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
      for (const article of reference.articles ?? []) {
        terms.push(`art ${article}`, `articulo ${article}`, `artículo ${article}`);
      }
    }

    return this.normalizer.normalize(terms.filter(Boolean).join(' '));
  }

  #score(post, record, query) {
    if (!query) return 1;

    const normalizedTitle = this.normalizer.normalize(post.title);
    const haystack = this.#haystack(post, record);
    const tokens = query.split(' ').filter(Boolean);

    if (!tokens.every((token) => haystack.includes(token))) return 0;

    let score = 0;
    if (normalizedTitle === query) score += 1000;
    else if (normalizedTitle.startsWith(query)) score += 760;
    else if (normalizedTitle.includes(query)) score += 650;

    if (haystack.includes(query)) score += 360;

    for (const token of tokens) {
      if (normalizedTitle.split(' ').includes(token)) score += 180;
      if (haystack.includes(token)) score += 70;
    }

    return score || 1;
  }

  search({ posts = [], registry = {}, query = '', filters = {}, sort = 'recent' } = {}) {
    const normalizedQuery = this.normalizer.normalize(query);
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

      const score = this.#score(post, record, normalizedQuery);
      if (score <= 0) continue;

      matches.push({ post, record, score, year });
    }

    matches.sort((a, b) => {
      if (normalizedQuery && sort === 'relevance' && b.score !== a.score) return b.score - a.score;
      if (sort === 'az') return a.post.title.localeCompare(b.post.title, 'es');

      const aTime = Date.parse(a.post.publishedAt ?? '') || 0;
      const bTime = Date.parse(b.post.publishedAt ?? '') || 0;
      return sort === 'old' ? aTime - bTime : bTime - aTime;
    });

    return matches;
  }
}
