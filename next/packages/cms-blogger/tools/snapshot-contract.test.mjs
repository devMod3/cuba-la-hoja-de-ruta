import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BLOGGER_ORIGIN,
  canonicalizeArticles,
  computeArticleContentSha256,
  createBloggerSnapshot,
  renderSnapshotMetadata
} from './snapshot-contract.mjs';

function article(id, publishedAt, overrides = {}) {
  return {
    id,
    url: `${BLOGGER_ORIGIN}/2026/08/${id}.html`,
    title: `Documento ${id}`,
    publishedAt,
    updatedAt: null,
    summary: '',
    content: '<p>Contenido</p>',
    labels: [],
    ...overrides
  };
}

describe('Blogger snapshot control-plane contract', () => {
  it('sorts deterministically and produces a stable content hash', () => {
    const older = article('2', '2026-08-01T00:00:00.000Z');
    const newer = article('1', '2026-08-02T00:00:00.000Z');
    const canonical = canonicalizeArticles([older, newer]);

    assert.deepEqual(canonical.map(({ id }) => id), ['1', '2']);
    assert.equal(computeArticleContentSha256(canonical), computeArticleContentSha256([...canonical]));
  });

  it('normalizes provenance and renders coherent metadata', () => {
    const snapshot = createBloggerSnapshot({
      articles: [article('1', '2026-08-02T00:00:00.000Z')],
      syncedAt: '2026-08-26T20:00:00-04:00',
      baseUrl: BLOGGER_ORIGIN
    });

    assert.equal(snapshot.source.baseUrl, `${BLOGGER_ORIGIN}/`);
    assert.equal(snapshot.syncedAt, '2026-08-27T00:00:00.000Z');
    assert.match(snapshot.contentSha256, /^[a-f0-9]{64}$/);
    assert.equal(
      renderSnapshotMetadata(snapshot),
      `contentSha256=${snapshot.contentSha256}\narticleCount=1\nsyncedAt=2026-08-27T00:00:00.000Z\n`
    );
  });

  it('fails closed on foreign origins and duplicate identity', () => {
    assert.throws(
      () =>
        createBloggerSnapshot({
          articles: [article('1', '2026-08-02T00:00:00.000Z')],
          syncedAt: '2026-08-26T20:00:00.000Z',
          baseUrl: 'https://example.com'
        }),
      /Blogger source origin/
    );
    assert.throws(
      () =>
        canonicalizeArticles([
          article('1', '2026-08-02T00:00:00.000Z'),
          article('1', '2026-08-01T00:00:00.000Z')
        ]),
      /duplicate article id/
    );
    assert.throws(
      () =>
        canonicalizeArticles([
          article('1', '2026-08-02T00:00:00.000Z', {
            url: 'https://example.com/foreign.html'
          })
        ]),
      /escapes canonical Blogger origin/
    );
  });

  it('rejects malformed collections and timestamps', () => {
    assert.throws(() => canonicalizeArticles(null), /articles must be an array/);
    assert.throws(() => canonicalizeArticles([null]), /article must be an object/);
    assert.throws(
      () => canonicalizeArticles([article('', '2026-08-02T00:00:00.000Z')]),
      /article id/
    );
    assert.throws(
      () =>
        createBloggerSnapshot({
          articles: [],
          syncedAt: 'invalid'
        }),
      /syncedAt/
    );
  });
});
