import type { Article } from '@zenblog/domain';

export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

export function searchArticlesByTitle(articles: readonly Article[], query: string): Article[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [...articles];
  return articles.filter((article) => normalizeSearchText(article.title).includes(normalized));
}
