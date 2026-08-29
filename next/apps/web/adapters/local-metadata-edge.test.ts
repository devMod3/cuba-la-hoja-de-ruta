import { describe, expect, it } from 'vitest';
import {
  EMPTY_METADATA_REGISTRY,
  LocalMetadataSource,
  type MetadataStorage
} from './local-metadata';

class FixedStorage implements MetadataStorage {
  private readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  getItem(): string {
    return this.value;
  }
}

function canonical(records: unknown): unknown {
  return {
    schemaVersion: '1.0.0',
    vocabularyVersion: '1.0.0',
    updatedAt: null,
    records
  };
}

function readRegistry(records: unknown) {
  return new LocalMetadataSource({
    storage: new FixedStorage(JSON.stringify(canonical(records))),
    fallbackRegistry: EMPTY_METADATA_REGISTRY,
    warn: () => undefined
  }).getRegistry();
}

describe('LocalMetadataSource fail-closed edge coverage', () => {
  it('rejects malformed nested metadata shapes at every client boundary', () => {
    const malformedRecords = [
      { '42': 42 },
      { '42': { classification: [] } },
      { '42': { classification: { primaryPillar: 1940 } } },
      { '42': { classification: { relatedPillars: 'estado' } } },
      { '42': { classification: { relatedPillars: ['estado', 1] } } },
      { '42': { classification: { type: 1940 } } },
      { '42': { temporal: '1940' } },
      { '42': { temporal: { documentYear: 1940.5 } } },
      { '42': { indexing: 'pueblo' } },
      { '42': { indexing: { concepts: 'pueblo' } } },
      { '42': { indexing: { aliases: ['válido', 1] } } },
      { '42': { indexing: { keywords: ['válida', false] } } },
      { '42': { indexing: { norms: {} } } },
      { '42': { indexing: { norms: [null] } } },
      { '42': { indexing: { norms: [{ normId: 1940 }] } } },
      { '42': { indexing: { norms: [{ articles: '40' }] } } },
      { '42': { indexing: { norms: [{ articles: [{}] }] } } },
      { '42': { editorial: 'verificado' } },
      { '42': { editorial: { status: false } } }
    ];
    for (const records of malformedRecords)
      expect(readRegistry(records)).toBe(EMPTY_METADATA_REGISTRY);
  });

  it('keeps valid optional norm defaults', () => {
    expect(
      readRegistry({
        '42': {
          indexing: {
            norms: [{}, { normId: 'c40' }, { articles: [40, '41'] }]
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
