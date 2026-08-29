import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MetadataRegistry } from '@zenblog/domain';
import {
  DEFAULT_METADATA_STORAGE_KEY,
  LocalMetadataSource,
  type MetadataStorage
} from './local-metadata';

class MemoryStorage implements MetadataStorage {
  #value: string | null;

  constructor(value: string | null = null) {
    this.#value = value;
  }

  getItem(): string | null {
    return this.#value;
  }

  set(value: string | null): void {
    this.#value = value;
  }
}

class ThrowingStorage implements MetadataStorage {
  getItem(): string | null {
    throw new Error('storage unavailable');
  }
}

class KeyedEvent extends Event {
  readonly key: string | null;

  constructor(type: string, key: string | null) {
    super(type);
    this.key = key;
  }
}

function shared(records: unknown = {}): string {
  return JSON.stringify({
    schemaVersion: '1.0.0',
    vocabularyVersion: '1.0.0',
    updatedAt: null,
    records
  });
}

const fallback: MetadataRegistry = Object.freeze({ records: {} });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LocalMetadataSource', () => {
  it('preserves the local metadata storage contract', () => {
    expect(DEFAULT_METADATA_STORAGE_KEY).toBe('zenMetadataRegistry.v2');
  });

  it('reads canonical shared metadata with domain coercions', () => {
    const storage = new MemoryStorage(
      shared({
        '42': {
          classification: {
            primaryPillar: 'constitucion',
            relatedPillars: ['estado'],
            type: 'analisis'
          },
          temporal: { documentYear: '1940' },
          indexing: {
            concepts: ['poder-constituyente'],
            norms: [{ normId: 'c40', articles: [40, '41'] }]
          },
          editorial: { status: 'verificado' },
          ignoredFutureField: true
        },
        '43': {}
      })
    );

    const registry = new LocalMetadataSource({ storage, fallbackRegistry: fallback }).getRegistry();
    expect(registry.records['42']).toEqual({
      classification: {
        primaryPillar: 'constitucion',
        relatedPillars: ['estado'],
        type: 'analisis'
      },
      temporal: { documentYear: 1940 },
      indexing: {
        concepts: ['poder-constituyente'],
        aliases: [],
        keywords: [],
        norms: [{ normId: 'c40', articles: ['40', '41'] }]
      },
      editorial: { status: 'verificado' }
    });
    expect(registry.records['43']).toEqual({
      classification: { primaryPillar: null, relatedPillars: [], type: null },
      temporal: { documentYear: null },
      indexing: { concepts: [], aliases: [], keywords: [], norms: [] },
      editorial: { status: null }
    });
  });

  it('normalizes invalid documentary years to null', () => {
    for (const documentYear of [null, '', 0, -1940, 'not-a-year']) {
      const source = new LocalMetadataSource({
        storage: new MemoryStorage(shared({ '42': { temporal: { documentYear } } })),
        fallbackRegistry: fallback
      });
      expect(source.getRegistry().records['42']?.temporal).toEqual({ documentYear: null });
    }
  });

  it('fails closed when the shared-document envelope is malformed', () => {
    for (const value of [null, [], {}, { records: {} }, { schemaVersion: '2.0.0', records: {} }]) {
      const source = new LocalMetadataSource({
        storage: new MemoryStorage(JSON.stringify(value)),
        fallbackRegistry: fallback,
        warn: () => undefined
      });
      expect(source.getRegistry()).toBe(fallback);
    }
  });

  it('fails closed for malformed nested metadata', () => {
    const malformed = [
      { '42': null },
      { '42': { classification: 'constitucion' } },
      { '42': { classification: { primaryPillar: 1940 } } },
      { '42': { classification: { relatedPillars: ['estado', 1] } } },
      { '42': { temporal: { documentYear: 1940.5 } } },
      { '42': { indexing: { concepts: 'pueblo' } } },
      { '42': { indexing: { norms: [{ articles: [{}] }] } } },
      { '42': { editorial: { status: false } } }
    ];
    for (const records of malformed) {
      const source = new LocalMetadataSource({
        storage: new MemoryStorage(shared(records)),
        fallbackRegistry: fallback,
        warn: () => undefined
      });
      expect(source.getRegistry()).toBe(fallback);
    }
  });

  it('returns a stable snapshot until raw storage changes', () => {
    const storage = new MemoryStorage(shared({}));
    const source = new LocalMetadataSource({ storage, fallbackRegistry: fallback });
    const first = source.getRegistry();
    expect(source.getRegistry()).toBe(first);

    storage.set(
      shared({
        '42': {
          classification: {
            primaryPillar: 'constitucion',
            relatedPillars: [],
            type: 'analisis'
          }
        }
      })
    );
    const second = source.getRegistry();
    expect(second).not.toBe(first);
    expect(second.records['42']?.classification.type).toBe('analisis');
    expect(source.getRegistry()).toBe(second);
  });

  it('caches invalid JSON until the raw value changes', () => {
    const warn = vi.fn();
    const storage = new MemoryStorage('{broken');
    const source = new LocalMetadataSource({ storage, fallbackRegistry: fallback, warn });
    expect(source.getRegistry()).toBe(fallback);
    expect(source.getRegistry()).toBe(fallback);
    expect(warn).toHaveBeenCalledOnce();
    storage.set('{still-broken');
    expect(source.getRegistry()).toBe(fallback);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('warns and fails closed when storage throws', () => {
    const warn = vi.fn();
    const source = new LocalMetadataSource({
      storage: new ThrowingStorage(),
      fallbackRegistry: fallback,
      warn
    });
    expect(source.getRegistry()).toBe(fallback);
    expect(warn).toHaveBeenCalledWith('[ZenBlog] Metadata registry unavailable', expect.any(Error));
  });

  it('uses the default console warning for parse failures', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const source = new LocalMetadataSource({
      storage: new MemoryStorage('{broken'),
      fallbackRegistry: fallback
    });
    expect(source.getRegistry()).toBe(fallback);
    expect(consoleWarn).toHaveBeenCalledWith(
      '[ZenBlog] Metadata registry unavailable',
      expect.any(SyntaxError)
    );
  });

  it('uses the embedded registry when local storage is missing', () => {
    const embedded: MetadataRegistry = Object.freeze({
      records: {
        '42': {
          classification: { primaryPillar: 'estado', relatedPillars: [], type: null },
          temporal: { documentYear: null },
          indexing: { concepts: [], aliases: [], keywords: [], norms: [] },
          editorial: { status: null }
        }
      }
    });
    const source = new LocalMetadataSource({
      storage: new MemoryStorage(null),
      fallbackRegistry: embedded
    });
    expect(source.getRegistry()).toBe(embedded);
  });

  it('publishes updates for metadata and matching storage events', () => {
    const storage = new MemoryStorage(shared({}));
    const documentTarget = new EventTarget();
    const windowTarget = new EventTarget();
    const source = new LocalMetadataSource({
      storage,
      fallbackRegistry: fallback,
      documentTarget,
      windowTarget
    });
    const listener = vi.fn();
    const unsubscribe = source.subscribe(listener);

    documentTarget.dispatchEvent(new Event('zenmetadata:changed'));
    windowTarget.dispatchEvent(new KeyedEvent('storage', 'unrelated'));
    windowTarget.dispatchEvent(new KeyedEvent('storage', DEFAULT_METADATA_STORAGE_KEY));
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    documentTarget.dispatchEvent(new Event('zenmetadata:changed'));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
