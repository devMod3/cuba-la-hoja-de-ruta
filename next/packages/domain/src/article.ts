import {
  asRecord,
  createDomainSchema,
  nullableText,
  requiredText,
  text,
  textArray
} from './schema';

export interface Article {
  readonly id: string;
  readonly title: string;
  readonly publishedAt: string | null;
  readonly updatedAt: string | null;
  readonly summary: string;
  readonly content: string;
  readonly labels: readonly string[];
}

function parseArticle(value: unknown): Article {
  const record = asRecord(value, 'Article');
  return Object.freeze({
    id: requiredText(record['id'], 'Article.id'),
    title: requiredText(record['title'], 'Article.title'),
    publishedAt: nullableText(record['publishedAt'], 'Article.publishedAt'),
    updatedAt: nullableText(record['updatedAt'], 'Article.updatedAt'),
    summary: text(record['summary']),
    content: text(record['content']),
    labels: textArray(record['labels'], 'Article.labels')
  });
}

export const ArticleSchema = createDomainSchema(parseArticle);
