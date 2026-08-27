import { describe, expect, it } from 'vitest';
import {
  EMPTY_METADATA_REGISTRY,
  LocalMetadataSource,
  type MetadataStorage
} from './local-metadata';

class FixedStorage implements MetadataStorage {
  constructor(private readonly value: string) {}

  getItem(): string {
    return this.value;
  }
}

function readRegistry(value: unknown) {
  return new LocalMetadataSource({
    storage: new FixedStorage(JSON.stringify(value)),
    warn: () => undefined
  }).getRegistry();
}

describe('LocalMetadataSource fail-closed edge coverage', () => {
  it('rejects malformed nested metadata shapes at every client boundary', () => {
    const malformedRegistries = [
      { records: { '42': 42 } },
      { records: { '42': { classification: [] } } },
      { records: { '42': { classification: { primaryPillar: 1940 } } } },
      { records: { '42': { classification: { relatedPillars: 'Estado' } } } },
      { records: { '42': { classification: { relatedPillars: ['Estado', 1] } } } },
      { records: { '42': { classification: { type: 1940 } } } },
      { records: { '42': { temporal: '1940' } } },
      { records: { '42': { temporal: { documentYear: 1940.5 } } } },
      { records: { '42': { indexing: 'Pueblo' } } },
      { records: { '42': { indexing: { concepts: 'Pueblo' } } } },
      { records: { '42': { indexing: { aliases: ['válido', 1] } } } },
      { records: { '42': { indexing: { keywords: ['válida', false] } } } },
      { records: { '42': { indexing: { norms: {} } } } },
      { records: { '42': { indexing: { norms: [null] } } } },
      { records: { '42': { indexing: { norms: [{ normId: 1940 }] } } } },
      { records: { '42': { indexing: { norms: [{ articles: '40' }] } } } },
      { records: { '42': { indexing: { norms: [{ articles: [{}] }] } } } },
      { records: { '42': { editorial: 'Verificado' } } },
      { records: { '42': { editorial: { status: false } } } }
    ];

    for (const registry of malformedRegistries) {
      expect(readRegistry(registry)).toBe(EMPTY_METADATA_REGISTRY);
    }
  });

  it('keeps valid optional norm defaults without requiring schema-runtime code', () => {
    expect(
      readRegistry({
        records: {
          '42': {
            indexing: {
              norms: [{}, { normId: 'c40' }, { articles: [40, '41'] }]
            }
          }
        }
      }).records['42']?.indexing.norms
    ).toEqual([
      { normId: '', articles: [] },
      { normId: 'c40', articles: [] },
      { normId: '', articles: ['40', '41'] }
    ]);
  });
});
