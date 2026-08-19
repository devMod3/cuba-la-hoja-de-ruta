import { TextNormalizer } from '../../search/TextNormalizer.js';

export class ExploreQueryService {
  constructor({ searchService, normalizer = new TextNormalizer() } = {}) {
    this.searchService = searchService;
    this.normalizer = normalizer;
  }

  #recentFirst(a, b) {
    const aTime = Date.parse(a.publishedAt ?? '') || 0;
    const bTime = Date.parse(b.publishedAt ?? '') || 0;
    return bTime - aTime;
  }

  searchByTitle({ posts = [], query = '' } = {}) {
    const needle = this.normalizer.normalize(query);
    const ordered = [...posts].sort((a, b) => this.#recentFirst(a, b));
    if (!needle) return ordered.map((post) => ({ post, record: null, score: 1 }));

    return ordered
      .filter((post) => this.normalizer.normalize(post.title).includes(needle))
      .map((post) => ({ post, record: null, score: 1 }));
  }

  filterArchive({ posts = [], registry = {}, filters = {}, sort = 'recent' } = {}) {
    return this.searchService.search({
      posts,
      registry,
      query: '',
      filters,
      sort
    });
  }
}
