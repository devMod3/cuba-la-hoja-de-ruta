import { ArticleSchema, type Article } from '@zenblog/domain';
import catalogData from '../content/articles.json';

export interface ContentCatalogPayload {
  readonly schemaVersion: string;
  readonly articleCount: number;
  readonly articles: readonly unknown[];
}

export function validateContentCatalog(candidate: ContentCatalogPayload): readonly Article[] {
  if (candidate.schemaVersion !== '1.0.0') throw new Error('Unsupported content catalog schema');

  const parsedArticles = candidate.articles.map((entry) => ArticleSchema.parse(entry));
  if (candidate.articleCount !== parsedArticles.length) {
    throw new Error('Content catalog articleCount mismatch');
  }

  const ids = new Set<string>();
  for (const article of parsedArticles) {
    if (ids.has(article.id)) throw new Error(`Duplicate article id: ${article.id}`);
    ids.add(article.id);
  }

  return Object.freeze(parsedArticles);
}

export const articles = validateContentCatalog(catalogData);

export function getArticleById(id: string): Article | undefined {
  return articles.find((article) => article.id === id);
}
