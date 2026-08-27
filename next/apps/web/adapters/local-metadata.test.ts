import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_METADATA_STORAGE_KEY,
  EMPTY_METADATA_REGISTRY,
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

  set(value: string | null) {
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LocalMetadataSource', () => {
  it('preserves the zenMetadataRegistry.v2 storage contract', () => {
    expect(DEFAULT_METADATA_STORAGE_KEY).toBe('zenMetadataRegistry.v2');
  });

  it('reads valid metadata with domain-compatible defaults and coercions', () => {
    const storage = new MemoryStorage(
      JSON.stringify({
        schemaVersion: '1.0.0',
        records: {
          '42': {
            classification: {
              primaryPillar: 'Constitución',
              relatedPillars: ['Estado'],
              type: 'Análisis'
            },
            temporal: { documentYear: '1940' },
            indexing: {
              concepts: ['Poder constituyente'],
              norms: [{ normId: 'c40', articles: [40, '41'] }]
            },
            editorial: { status: 'Verificado' },
            ignoredFutureField: true
          },
          '43': {}
        },
        ignoredTopLevelField: 'compatible'
      })
    );

    const registry = new LocalMetadataSource({ storage }).getRegistry();
    expect(registry.records['42']).toEqual({
      classification: {
        primaryPillar: 'Constitución',
        relatedPillars: ['Estado'],
        type: 'Análisis'
      },
      temporal: { documentYear: 1940 },
      indexing: {
        concepts: ['Poder constituyente'],
        aliases: [],
        keywords: [],
        norms: [{ normId: 'c40', articles: ['40', '41'] }]
      },
      editorial: { status: 'Verificado' }
    });
    expect(registry.records['43']).toEqual({
      classification: { primaryPillar: null, relatedPillars: [], type: null },
      temporal: { documentYear: null },
      indexing: { concepts: [], aliases: [], keywords: [], norms: [] },
      editorial: { status: null }
    });
  });

  it('normalizes non-positive and non-numeric documentary years to null', () => {
    for (const documentYear of [null, '', 0, -1940, 'not-a-year']) {
      const storage = new MemoryStorage(
        JSON.stringify({ records: { '42': { temporal: { documentYear } } } })
      );
      expect(new LocalMetadataSource({ storage }).getRegistry().records['42']?.temporal).toEqual({
        documentYear: null
      });
    }
  });

  it('fails closed for malformed structures rather than trusting partial metadata', () => {
    const malformedRegistries = [
      null,
      [],
      { records: null },
      { records: { '42': null } },
      { records: { '42': { classification: 'Constitución' } } },
      { records: { '42': { classification: { primaryPillar: 1940 } } } },
      { records: { '42': { classification: { relatedPillars: ['Estado', 1] } } } },
      { records: { '42': { temporal: { documentYear: 1940.5 } } } },
      { records: { '42': { indexing: { concepts: 'Pueblo' } } } },
      { records: { '42': { indexing: { norms: [{ articles: [{}] }] } } } },
      { records: { '42': { editorial: { status: false } } } }
    ];

    for (const registry of malformedRegistries) {
      const source = new LocalMetadataSource({
        storage: new MemoryStorage(JSON.stringify(registry))
      });
      expect(source.getRegistry()).toBe(EMPTY_METADATA_REGISTRY);
    }
  });

  it('accepts a missing records property as an empty registry', () => {
    const source = new LocalMetadataSource({ storage: new MemoryStorage('{"future":true}') });
    expect(source.getRegistry()).toEqual(EMPTY_METADATA_REGISTRY);
  });

  it('returns a stable external-store snapshot until raw storage changes', () => {
    const storage = new MemoryStorage(JSON.stringify({ records: {} }));
    const source = new LocalMetadataSource({ storage });

    const first = source.getRegistry();
    expect(source.getRegistry()).toBe(first);

    storage.set(
      JSON.stringify({
        records: {
          '42': {
            classification: {
              primaryPillar: 'Constitución',
              relatedPillars: [],
              type: 'Análisis'
            },
            temporal: { documentYear: 1940 }
          }
        }
      })
    );

    const second = source.getRegistry();
    expect(second).not.toBe(first);
    expect(second.records['42']?.classification.type).toBe('Análisis');
    expect(source.getRegistry()).toBe(second);
  });

  it('falls back safely and caches invalid JSON until the raw value changes', () => {
    const warn = vi.fn();
    const storage = new MemoryStorage('{broken');
    const source = new LocalMetadataSource({ storage, warn });

    expect(source.getRegistry()).toEqual(EMPTY_METADATA_REGISTRY);
    expect(source.getRegistry()).toBe(EMPTY_METADATA_REGISTRY);
    expect(warn).toHaveBeenCalledOnce();

    storage.set('{still-broken');
    expect(source.getRegistry()).toBe(EMPTY_METADATA_REGISTRY);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('warns and fails closed when the storage boundary throws', () => {
    const warn = vi.fn();
    const source = new LocalMetadataSource({ storage: new ThrowingStorage(), warn });

    expect(source.getRegistry()).toBe(EMPTY_METADATA_REGISTRY);
    expect(warn).toHaveBeenCalledWith('[ZenBlog] Metadata registry unavailable', expect.any(Error));
  });

  it('uses the default console warning for storage parse failures', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const source = new LocalMetadataSource({ storage: new MemoryStorage('{broken') });

    expect(source.getRegistry()).toEqual(EMPTY_METADATA_REGISTRY);
    expect(consoleWarn).toHaveBeenCalledOnce();
    expect(consoleWarn).toHaveBeenCalledWith(
      '[ZenBlog] Metadata registry unavailable',
      expect.any(SyntaxError)
    );
  });

  it('falls back silently for missing or schema-invalid metadata', () => {
    const warn = vi.fn();

    expect(
      new LocalMetadataSource({ storage: new MemoryStorage(null), warn }).getRegistry()
    ).toEqual(EMPTY_METADATA_REGISTRY);
    expect(
      new LocalMetadataSource({
        storage: new MemoryStorage('{"records":null}'),
        warn
      }).getRegistry()
    ).toEqual(EMPTY_METADATA_REGISTRY);
    expect(warn).not.toHaveBeenCalled();
  });

  it('publishes updates for zenmetadata:changed and only the matching storage key', () => {
    const storage = new MemoryStorage(JSON.stringify({ records: {} }));
    const documentTarget = new EventTarget();
    const windowTarget = new EventTarget();
    const source = new LocalMetadataSource({ storage, documentTarget, windowTarget });
    const listener = vi.fn();
    const unsubscribe = source.subscribe(listener);

    documentTarget.dispatchEvent(new Event('zenmetadata:changed'));
    windowTarget.dispatchEvent(new KeyedEvent('storage', 'other.key'));
    windowTarget.dispatchEvent(new KeyedEvent('storage', DEFAULT_METADATA_STORAGE_KEY));

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    documentTarget.dispatchEvent(new Event('zenmetadata:changed'));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('honors a custom storage key and tolerates an omitted event target', () => {
    const storage = new MemoryStorage(JSON.stringify({ records: {} }));
    const windowTarget = new EventTarget();
    const listener = vi.fn();
    const source = new LocalMetadataSource({
      storage,
      storageKey: 'custom.metadata',
      windowTarget
    });
    const unsubscribe = source.subscribe(listener);

    windowTarget.dispatchEvent(new KeyedEvent('storage', DEFAULT_METADATA_STORAGE_KEY));
    windowTarget.dispatchEvent(new KeyedEvent('storage', null));
    windowTarget.dispatchEvent(new KeyedEvent('storage', 'custom.metadata'));

    expect(listener).toHaveBeenCalledOnce();
    expect(() => {
      unsubscribe();
    }).not.toThrow();
  });
});
