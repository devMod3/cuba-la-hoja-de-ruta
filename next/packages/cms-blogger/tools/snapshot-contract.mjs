import { createHash } from 'node:crypto';

export const BLOGGER_ORIGIN = 'https://cubalahojaderuta.blogspot.com';

function canonicalOrigin(baseUrl) {
  const url = new URL(baseUrl);
  if (url.origin !== BLOGGER_ORIGIN) {
    throw new Error(`Blogger source origin must be ${BLOGGER_ORIGIN}`);
  }
  return `${url.origin}/`;
}

export function canonicalizeArticles(articles) {
  if (!Array.isArray(articles)) throw new TypeError('articles must be an array');

  const ids = new Set();
  const urls = new Set();
  const canonical = articles.map((article) => {
    if (!article || typeof article !== 'object') throw new TypeError('article must be an object');
    if (typeof article.id !== 'string' || article.id.length === 0) {
      throw new Error('article id must be a non-empty string');
    }
    if (ids.has(article.id)) throw new Error(`duplicate article id: ${article.id}`);
    ids.add(article.id);

    const url = new URL(article.url);
    if (url.origin !== BLOGGER_ORIGIN) {
      throw new Error(`article ${article.id} escapes canonical Blogger origin`);
    }
    if (urls.has(url.href)) throw new Error(`duplicate article URL: ${url.href}`);
    urls.add(url.href);

    return article;
  });

  return canonical.toSorted((left, right) => {
    const byPublished = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
    return byPublished || left.id.localeCompare(right.id);
  });
}

export function computeArticleContentSha256(articles) {
  return createHash('sha256').update(JSON.stringify(articles)).digest('hex');
}

export function createBloggerSnapshot({ articles, syncedAt, baseUrl = BLOGGER_ORIGIN }) {
  const timestamp = new Date(syncedAt);
  if (!Number.isFinite(timestamp.valueOf())) throw new Error('syncedAt must be a valid date');

  const canonicalArticles = canonicalizeArticles(articles);
  return {
    schemaVersion: 1,
    source: { type: 'blogger', baseUrl: canonicalOrigin(baseUrl) },
    syncedAt: timestamp.toISOString(),
    contentSha256: computeArticleContentSha256(canonicalArticles),
    articleCount: canonicalArticles.length,
    articles: canonicalArticles
  };
}

export function renderSnapshot(snapshot) {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

export function renderSnapshotMetadata(snapshot) {
  return [
    `contentSha256=${snapshot.contentSha256}`,
    `articleCount=${snapshot.articleCount}`,
    `syncedAt=${snapshot.syncedAt}`,
    ''
  ].join('\n');
}
