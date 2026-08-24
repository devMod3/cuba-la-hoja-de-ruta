import { ArticleSchema, type Article } from '@zenblog/domain';
import snapshot from '../../../content/blogger.snapshot.json';

const BLOGGER_ORIGIN = 'https://cubalahojaderuta.blogspot.com';

function validateSnapshot(): readonly Article[] {
  if (snapshot.schemaVersion !== 1) throw new Error('Unsupported Blogger snapshot schema');
  if (snapshot.source.type !== 'blogger') throw new Error('Unexpected content snapshot source');
  if (new URL(snapshot.source.baseUrl).origin !== BLOGGER_ORIGIN) {
    throw new Error('Unexpected Blogger snapshot origin');
  }

  const articles = snapshot.articles.map((entry) => ArticleSchema.parse(entry));
  if (snapshot.articleCount !== articles.length) {
    throw new Error('Blogger snapshot articleCount mismatch');
  }

  for (const article of articles) {
    if (new URL(article.url).origin !== BLOGGER_ORIGIN) {
      throw new Error(`Article ${article.id} escapes Blogger canonical origin`);
    }
  }

  return Object.freeze(articles);
}

export const bloggerSnapshotArticles = validateSnapshot();
export const bloggerSnapshotContentSha256 = snapshot.contentSha256;
export const bloggerSnapshotSyncedAt = snapshot.syncedAt;
