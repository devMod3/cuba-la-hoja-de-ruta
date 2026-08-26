import { ArticleSchema, type Article } from '@zenblog/domain';
import snapshot from '../content/blogger.snapshot.json';

const BLOGGER_ORIGIN = 'https://cubalahojaderuta.blogspot.com';

export interface BloggerSnapshotPayload {
  readonly schemaVersion: number;
  readonly source: Readonly<{
    type: string;
    baseUrl: string;
  }>;
  readonly articleCount: number;
  readonly articles: readonly unknown[];
}

export function validateBloggerSnapshot(candidate: BloggerSnapshotPayload): readonly Article[] {
  if (candidate.schemaVersion !== 1) throw new Error('Unsupported Blogger snapshot schema');
  if (candidate.source.type !== 'blogger') throw new Error('Unexpected content snapshot source');
  if (new globalThis.URL(candidate.source.baseUrl).origin !== BLOGGER_ORIGIN) {
    throw new Error('Unexpected Blogger snapshot origin');
  }

  const articles = candidate.articles.map((entry) => ArticleSchema.parse(entry));
  if (candidate.articleCount !== articles.length) {
    throw new Error('Blogger snapshot articleCount mismatch');
  }

  for (const article of articles) {
    if (new globalThis.URL(article.url).origin !== BLOGGER_ORIGIN) {
      throw new Error(`Article ${article.id} escapes Blogger canonical origin`);
    }
  }

  return Object.freeze(articles);
}

export const bloggerSnapshotArticles = validateBloggerSnapshot(snapshot);
export const bloggerSnapshotContentSha256 = snapshot.contentSha256;
export const bloggerSnapshotSyncedAt = snapshot.syncedAt;

export function getBloggerSnapshotArticleById(id: string): Article | undefined {
  return bloggerSnapshotArticles.find((article) => article.id === id);
}
