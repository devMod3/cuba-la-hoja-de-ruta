import { describe, expect, it } from 'vitest';
import {
  bloggerSnapshotArticles,
  bloggerSnapshotContentSha256,
  bloggerSnapshotSyncedAt,
  getBloggerSnapshotArticleById,
  validateBloggerSnapshot,
  type BloggerSnapshotPayload
} from './src/index';

const BLOGGER_ORIGIN = 'https://cubalahojaderuta.blogspot.com';

function article(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    id: '42',
    url: `${BLOGGER_ORIGIN}/2026/08/documento.html`,
    title: 'Documento',
    publishedAt: '2026-08-01T12:00:00.000Z',
    updatedAt: null,
    summary: '',
    content: '<p>Contenido</p>',
    labels: [],
    ...overrides
  };
}

function payload(overrides: Partial<BloggerSnapshotPayload> = {}): BloggerSnapshotPayload {
  return {
    schemaVersion: 1,
    source: { type: 'blogger', baseUrl: BLOGGER_ORIGIN },
    articleCount: 1,
    articles: [article()],
    ...overrides
  };
}

describe('checked-in Blogger snapshot', () => {
  it('exports an immutable validated snapshot with stable provenance', () => {
    expect(bloggerSnapshotArticles).toHaveLength(2);
    expect(Object.isFrozen(bloggerSnapshotArticles)).toBe(true);
    expect(bloggerSnapshotContentSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(Date.parse(bloggerSnapshotSyncedAt)).not.toBeNaN();
    expect(getBloggerSnapshotArticleById(bloggerSnapshotArticles[0]?.id ?? '')).toEqual(
      bloggerSnapshotArticles[0]
    );
    expect(getBloggerSnapshotArticleById('not-in-snapshot')).toBeUndefined();
  });
});

describe('validateBloggerSnapshot', () => {
  it('accepts the canonical Blogger boundary and freezes the result', () => {
    const result = validateBloggerSnapshot(payload());
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('42');
    expect(Object.isFrozen(result)).toBe(true);
  });

  it.each([
    [payload({ schemaVersion: 2 }), 'Unsupported Blogger snapshot schema'],
    [
      payload({ source: { type: 'other', baseUrl: BLOGGER_ORIGIN } }),
      'Unexpected content snapshot source'
    ],
    [
      payload({ source: { type: 'blogger', baseUrl: 'https://example.com' } }),
      'Unexpected Blogger snapshot origin'
    ],
    [payload({ articleCount: 2 }), 'Blogger snapshot articleCount mismatch'],
    [
      payload({ articles: [article({ url: 'https://example.com/documento.html' })] }),
      'escapes Blogger canonical origin'
    ]
  ])('rejects invalid snapshot contract %#', (candidate, message) => {
    expect(() => validateBloggerSnapshot(candidate)).toThrow(message);
  });

  it('rejects malformed article data through the domain schema', () => {
    expect(() => validateBloggerSnapshot(payload({ articles: [article({ id: '' })] }))).toThrow();
  });
});
