import test from 'node:test';
import assert from 'node:assert/strict';
import { ExploreQueryService } from '../src/features/explore/ExploreQueryService.js';

const posts = [
  { id: '1', title: 'Qué es pueblo', publishedAt: '2026-01-01T00:00:00Z' },
  { id: '2', title: 'Soberanía popular', publishedAt: '2026-03-01T00:00:00Z' },
  { id: '3', title: 'Constitución y Estado', publishedAt: '2026-02-01T00:00:00Z' }
];

test('simple Explore search is title-only, accent-insensitive and recent-first', () => {
  const service = new ExploreQueryService({
    searchService: { search() { throw new Error('advanced search must not run'); } }
  });

  assert.deepEqual(
    service.searchByTitle({ posts, query: 'soberania' }).map(({ post }) => post.id),
    ['2']
  );

  assert.deepEqual(
    service.searchByTitle({ posts, query: '' }).map(({ post }) => post.id),
    ['2', '3', '1']
  );
});

test('advanced Explore mode delegates only structured filters and sort', () => {
  let received = null;
  const service = new ExploreQueryService({
    searchService: {
      search(args) {
        received = args;
        return [{ post: posts[0], record: null, score: 1 }];
      }
    }
  });

  const filters = { pillar: 'constitucion', type: 'norma', yearFrom: '1940', yearTo: '1940' };
  const results = service.filterArchive({ posts, registry: { records: {} }, filters, sort: 'old' });

  assert.equal(results.length, 1);
  assert.equal(received.query, '');
  assert.equal(received.sort, 'old');
  assert.deepEqual(received.filters, filters);
});
